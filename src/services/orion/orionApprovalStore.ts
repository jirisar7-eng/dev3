import * as crypto from 'crypto';
import { prisma } from '../../db/prisma';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTING' | 'EXECUTED' | 'FAILED' | 'CANCELLED';

export interface OrionApprovalRequest {
  id: string;
  agentId: string;
  capabilityId: string;
  userId: string;
  operation: string;
  target: string;
  scope: string;
  riskLevel: string;
  traceId: string;
  payloadHash: string;
  payload: any;
  status: ApprovalStatus;
  createdAt: number;
  expiresAt: number;
  approvedAt?: number;
  approvedBy?: string;
  rejectedAt?: number;
  rejectedBy?: string;
  executingAt?: number;
  executedAt?: number;
  failedAt?: number;
  auditRef?: string;
  bindingHash: string;
}

export class OrionApprovalStore {
  // Fallback in-memory map
  private static fallbackApprovals: Map<string, OrionApprovalRequest> = new Map();
  private static useDb = true;

  public static generatePayloadHash(payload: any): string {
    const canonical = JSON.stringify(payload ?? null);
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  public static generateBindingHash(data: {
    id: string;
    agentId: string;
    capabilityId: string;
    userId: string;
    operation: string;
    target: string;
    scope: string;
    traceId: string;
    riskLevel: string;
    payloadHash: string;
  }): string {
    const parts = [
      data.id,
      data.agentId,
      data.capabilityId,
      data.userId,
      data.operation,
      data.target,
      data.scope,
      data.traceId,
      data.riskLevel,
      data.payloadHash
    ];
    return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
  }

  public static async create(data: {
    agentId: string;
    capabilityId: string;
    userId: string;
    operation: string;
    target: string;
    scope: string;
    riskLevel: string;
    traceId: string;
    payload: any;
  }): Promise<OrionApprovalRequest> {
    const id = `apr_${crypto.randomBytes(12).toString('hex')}`;
    const payloadHash = this.generatePayloadHash(data.payload);
    
    const bindingHash = this.generateBindingHash({
      id,
      agentId: data.agentId,
      capabilityId: data.capabilityId,
      userId: data.userId,
      operation: data.operation,
      target: data.target,
      scope: data.scope,
      traceId: data.traceId,
      riskLevel: data.riskLevel,
      payloadHash
    });

    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000;

    const approval: OrionApprovalRequest = {
      ...data,
      id,
      payloadHash,
      status: 'PENDING',
      bindingHash,
      createdAt: now,
      expiresAt: expiresAt
    };

    if (this.useDb) {
      try {
        await prisma.orionApproval.create({
          data: {
            id: approval.id,
            agentId: approval.agentId,
            capabilityId: approval.capabilityId,
            userId: approval.userId,
            operation: approval.operation,
            target: approval.target,
            scope: approval.scope,
            riskLevel: approval.riskLevel,
            traceId: approval.traceId,
            payloadHash: approval.payloadHash,
            payload: JSON.stringify(approval.payload),
            status: approval.status,
            bindingHash: approval.bindingHash,
            createdAt: new Date(approval.createdAt),
            expiresAt: new Date(approval.expiresAt)
          }
        });
        return approval;
      } catch (err: any) {
        if (err.code === 'P1001' || err.message?.includes('DatabaseNotReachable') || err.message?.includes('Can\'t reach database')) {
          console.warn('[OrionApprovalStore] DB offline, falling back to memory store.');
          this.useDb = false;
        } else {
          // Some other schema error, meaning we haven't pushed maybe?
          console.warn('[OrionApprovalStore] Prisma error, falling back.', err);
          this.useDb = false;
        }
      }
    }
    
    this.fallbackApprovals.set(id, approval);
    return approval;
  }

  public static async get(id: string): Promise<OrionApprovalRequest | undefined> {
    if (this.useDb) {
      try {
        const doc = await prisma.orionApproval.findUnique({ where: { id } });
        if (doc) {
          return {
            id: doc.id,
            agentId: doc.agentId,
            capabilityId: doc.capabilityId,
            userId: doc.userId,
            operation: doc.operation,
            target: doc.target,
            scope: doc.scope,
            riskLevel: doc.riskLevel,
            traceId: doc.traceId,
            payloadHash: doc.payloadHash,
            payload: doc.payload ? JSON.parse(doc.payload) : null,
            status: doc.status as ApprovalStatus,
            createdAt: doc.createdAt.getTime(),
            expiresAt: doc.expiresAt.getTime(),
            approvedAt: doc.approvedAt?.getTime(),
            approvedBy: doc.approvedBy || undefined,
            rejectedAt: doc.rejectedAt?.getTime(),
            rejectedBy: doc.rejectedBy || undefined,
            executingAt: doc.executingAt?.getTime(),
            executedAt: doc.executedAt?.getTime(),
            failedAt: doc.failedAt?.getTime(),
            auditRef: doc.auditRef || undefined,
            bindingHash: doc.bindingHash
          };
        }
        return undefined;
      } catch (err: any) {
        this.useDb = false;
      }
    }
    return this.fallbackApprovals.get(id);
  }

  // Atomic state transition
  public static async transitionStatus(
    id: string, 
    expectedStatus: ApprovalStatus, 
    newStatus: ApprovalStatus,
    metadata?: { by?: string }
  ): Promise<boolean> {
    if (this.useDb) {
      try {
        const updateData: any = { status: newStatus };
        const now = new Date();
        if (newStatus === 'APPROVED') { updateData.approvedAt = now; if(metadata?.by) updateData.approvedBy = metadata.by; }
        if (newStatus === 'REJECTED') { updateData.rejectedAt = now; if(metadata?.by) updateData.rejectedBy = metadata.by; }
        if (newStatus === 'EXECUTING') { updateData.executingAt = now; }
        if (newStatus === 'EXECUTED') { updateData.executedAt = now; }
        if (newStatus === 'FAILED') { updateData.failedAt = now; }

        const result = await prisma.orionApproval.updateMany({
          where: { id, status: expectedStatus },
          data: updateData
        });
        return result.count > 0;
      } catch (err: any) {
        this.useDb = false;
      }
    }

    const approval = this.fallbackApprovals.get(id);
    if (approval && approval.status === expectedStatus) {
      approval.status = newStatus;
      const now = Date.now();
      if (newStatus === 'APPROVED') { approval.approvedAt = now; if(metadata?.by) approval.approvedBy = metadata.by; }
      if (newStatus === 'REJECTED') { approval.rejectedAt = now; if(metadata?.by) approval.rejectedBy = metadata.by; }
      if (newStatus === 'EXECUTING') { approval.executingAt = now; }
      if (newStatus === 'EXECUTED') { approval.executedAt = now; }
      if (newStatus === 'FAILED') { approval.failedAt = now; }
      this.fallbackApprovals.set(id, approval);
      return true;
    }
    return false;
  }

  public static async getAll(): Promise<OrionApprovalRequest[]> {
    if (this.useDb) {
      try {
        const docs = await prisma.orionApproval.findMany({ orderBy: { createdAt: 'desc' } });
        return docs.map(doc => ({
            id: doc.id,
            agentId: doc.agentId,
            capabilityId: doc.capabilityId,
            userId: doc.userId,
            operation: doc.operation,
            target: doc.target,
            scope: doc.scope,
            riskLevel: doc.riskLevel,
            traceId: doc.traceId,
            payloadHash: doc.payloadHash,
            payload: doc.payload ? JSON.parse(doc.payload) : null,
            status: doc.status as ApprovalStatus,
            createdAt: doc.createdAt.getTime(),
            expiresAt: doc.expiresAt.getTime(),
            approvedAt: doc.approvedAt?.getTime(),
            approvedBy: doc.approvedBy || undefined,
            rejectedAt: doc.rejectedAt?.getTime(),
            rejectedBy: doc.rejectedBy || undefined,
            executingAt: doc.executingAt?.getTime(),
            executedAt: doc.executedAt?.getTime(),
            failedAt: doc.failedAt?.getTime(),
            auditRef: doc.auditRef || undefined,
            bindingHash: doc.bindingHash
        }));
      } catch (err: any) {
        this.useDb = false;
      }
    }
    return Array.from(this.fallbackApprovals.values());
  }
}
