const fs = require('fs');

const classCode = `import crypto from 'crypto';
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
  // Only allow test environment fallback for isolated unit tests that explicitly mock this or require it
  // In production (NODE_ENV !== 'test'), DB is strictly required. Fail-closed.
  private static isTestEnvironment = process.env.NODE_ENV === 'test';
  private static testFallbackApprovals: Map<string, OrionApprovalRequest> = new Map();

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
    const canonicalObj = {
      bindingVersion: '1.0',
      approvalId: data.id,
      agentId: data.agentId,
      capabilityId: data.capabilityId,
      userId: data.userId,
      operation: data.operation,
      target: data.target,
      scope: data.scope,
      traceId: data.traceId,
      riskLevel: data.riskLevel,
      payloadHash: data.payloadHash
    };
    const canonical = JSON.stringify(canonicalObj);
    return crypto.createHash('sha256').update(canonical).digest('hex');
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
    const id = \`apr_\${crypto.randomBytes(12).toString('hex')}\`;
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
      if (this.isTestEnvironment) {
        this.testFallbackApprovals.set(id, approval);
        return approval;
      }
      console.error('[OrionApprovalStore] Persistence failed. Fail closed.', err);
      throw new Error('FAIL CLOSED: Databáze není dostupná pro uložení HITL tiketu.');
    }
  }

  public static async get(id: string): Promise<OrionApprovalRequest | undefined> {
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
      if (this.isTestEnvironment) {
        return this.testFallbackApprovals.get(id);
      }
      console.error('[OrionApprovalStore] Get failed. Fail closed.', err);
      throw new Error('FAIL CLOSED: Databáze není dostupná.');
    }
  }

  public static async transitionStatus(
    id: string, 
    expectedStatus: ApprovalStatus, 
    newStatus: ApprovalStatus,
    metadata?: { by?: string }
  ): Promise<boolean> {
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
      if (this.isTestEnvironment) {
        const approval = this.testFallbackApprovals.get(id);
        if (approval && approval.status === expectedStatus) {
          approval.status = newStatus;
          const time = Date.now();
          if (newStatus === 'APPROVED') { approval.approvedAt = time; if(metadata?.by) approval.approvedBy = metadata.by; }
          if (newStatus === 'REJECTED') { approval.rejectedAt = time; if(metadata?.by) approval.rejectedBy = metadata.by; }
          if (newStatus === 'EXECUTING') { approval.executingAt = time; }
          if (newStatus === 'EXECUTED') { approval.executedAt = time; }
          if (newStatus === 'FAILED') { approval.failedAt = time; }
          this.testFallbackApprovals.set(id, approval);
          return true;
        }
        return false;
      }
      console.error('[OrionApprovalStore] Transition failed. Fail closed.', err);
      return false; // MUST fail if DB fails
    }
  }

  public static async getAll(): Promise<OrionApprovalRequest[]> {
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
      if (this.isTestEnvironment) {
        return Array.from(this.testFallbackApprovals.values());
      }
      throw new Error('FAIL CLOSED: Databáze není dostupná.');
    }
  }
}
`;
fs.writeFileSync('src/services/orion/orionApprovalStore.ts', classCode);
