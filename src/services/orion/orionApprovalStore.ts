import * as crypto from 'crypto';

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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED' | 'CANCELLED';
  payload: any;
  createdAt: number;
  expiresAt: number;
  auditRef?: string;
}

export class OrionApprovalStore {
  private static approvals: Map<string, OrionApprovalRequest> = new Map();

  public static create(data: Omit<OrionApprovalRequest, 'id' | 'status' | 'createdAt' | 'expiresAt'>): OrionApprovalRequest {
    const id = `apr_${crypto.randomBytes(8).toString('hex')}`;
    const approval: OrionApprovalRequest = {
      ...data,
      id,
      status: 'PENDING',
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    this.approvals.set(id, approval);
    return approval;
  }

  public static get(id: string): OrionApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  public static updateStatus(id: string, status: OrionApprovalRequest['status']): OrionApprovalRequest | undefined {
    const approval = this.approvals.get(id);
    if (approval) {
      approval.status = status;
      this.approvals.set(id, approval);
    }
    return approval;
  }

  public static getAll(): OrionApprovalRequest[] {
    return Array.from(this.approvals.values());
  }
}
