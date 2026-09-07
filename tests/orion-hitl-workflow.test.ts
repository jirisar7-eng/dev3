import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireOrionAuth } from '../src/middleware/orionAuthMiddleware';
import { OrionApprovalStore } from '../src/services/orion/orionApprovalStore';
import { ControlPlaneAuthorization } from '../src/services/controlPlaneAuthorization';

describe('HITL Workflow', () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: any;

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: {},
      originalUrl: '/api/test',
      user: { id: 'user1', email: 'user@test.cz', role: 'ADMIN' },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    nextFn = vi.fn();
    // clear store
    (OrionApprovalStore as any).approvals.clear();
  });

  it('creates pending request and returns 202 on REQUIRE_HUMAN_APPROVAL', () => {
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: false,
      decision: 'REQUIRE_HUMAN_APPROVAL',
      reason: 'Need human',
      traceId: 'trc-123'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(202);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'REQUIRE_HUMAN_APPROVAL',
      status: 'PENDING',
      approvalId: expect.any(String)
    }));
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('allows execution if approval is APPROVED and user matches', () => {
    const approval = OrionApprovalStore.create({
      agentId: 'agent', capabilityId: 'ai.generate', userId: 'user1', operation: 'test', target: '/api/test', scope: 'ai', riskLevel: 'P1', traceId: 'trc', payload: {}
    });
    OrionApprovalStore.updateStatus(approval.id, 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: true, decision: 'ALLOW'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    middleware(mockReq, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalled();
    expect(OrionApprovalStore.get(approval.id)?.status).toBe('EXECUTED');
  });

  it('rejects execution if user binding mismatches', () => {
    const approval = OrionApprovalStore.create({
      agentId: 'agent', capabilityId: 'ai.generate', userId: 'user2', operation: 'test', target: '/api/test', scope: 'ai', riskLevel: 'P1', traceId: 'trc', payload: {}
    });
    OrionApprovalStore.updateStatus(approval.id, 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    
    const middleware = requireOrionAuth('ai.generate', 'test-op');
    middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('binding mismatch') }));
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('rejects execution if status is EXPIRED', () => {
    const approval = OrionApprovalStore.create({
      agentId: 'agent', capabilityId: 'ai.generate', userId: 'user1', operation: 'test', target: '/api/test', scope: 'ai', riskLevel: 'P1', traceId: 'trc', payload: {}
    });
    approval.expiresAt = Date.now() - 1000;
    OrionApprovalStore.updateStatus(approval.id, 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    
    const middleware = requireOrionAuth('ai.generate', 'test-op');
    middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('rejects execution if underlying policy now DENYs', () => {
    const approval = OrionApprovalStore.create({
      agentId: 'agent', capabilityId: 'ai.generate', userId: 'user1', operation: 'test', target: '/api/test', scope: 'ai', riskLevel: 'P1', traceId: 'trc', payload: {}
    });
    OrionApprovalStore.updateStatus(approval.id, 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: false, decision: 'DENY', reason: 'Now blocked'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('failed after approval') }));
    expect(nextFn).not.toHaveBeenCalled();
  });
});
