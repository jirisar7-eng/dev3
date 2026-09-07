import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireOrionAuth } from '../src/middleware/orionAuthMiddleware';
import { OrionApprovalStore } from '../src/services/orion/orionApprovalStore';
import { ControlPlaneAuthorization, AGENT_ORION_IDENTITY } from '../src/services/controlPlaneAuthorization';
import * as crypto from 'crypto';

describe('HITL Workflow', () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: any;

  beforeEach(() => {
    mockReq = {
      headers: {},
      body: { some: 'data' },
      originalUrl: '/api/test',
      user: { id: 'user1', email: 'user@test.cz', role: 'ADMIN' },
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      statusCode: 200,
      on: vi.fn((event, cb) => {
        if (event === 'finish') {
          // Store the finish callback to trigger it manually
          mockRes._finishCb = cb;
        }
      })
    };
    nextFn = vi.fn();
    // clear store
    (OrionApprovalStore as any).fallbackApprovals.clear();
    (OrionApprovalStore as any).useDb = false;
  });

  it('creates pending request and returns 202 on REQUIRE_HUMAN_APPROVAL', async () => {
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: false,
      decision: 'REQUIRE_HUMAN_APPROVAL',
      reason: 'Need human',
      traceId: 'trc-123'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(202);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      decision: 'REQUIRE_HUMAN_APPROVAL',
      status: 'PENDING',
      approvalId: expect.any(String)
    }));
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('allows execution if approval is APPROVED and user/bindings match', async () => {
    const approval = await OrionApprovalStore.create({
      agentId: AGENT_ORION_IDENTITY, capabilityId: 'ai.generate', userId: 'user1', operation: 'test-op', target: '/api/test', scope: 'ai-engine', riskLevel: 'P1_HIGH', traceId: 'trc', payload: mockReq.body
    });
    await OrionApprovalStore.transitionStatus(approval.id, 'PENDING', 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: true, decision: 'ALLOW'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalled();
    const updatedApproval = await OrionApprovalStore.get(approval.id);
    expect(updatedApproval?.status).toBe('EXECUTING');
    
    // Simulate request finish
    if (mockRes._finishCb) {
      await mockRes._finishCb();
    }
    const finalizedApproval = await OrionApprovalStore.get(approval.id);
    expect(finalizedApproval?.status).toBe('EXECUTED');
  });

  it('rejects execution if user binding mismatches', async () => {
    const approval = await OrionApprovalStore.create({
      agentId: AGENT_ORION_IDENTITY, capabilityId: 'ai.generate', userId: 'user2', operation: 'test-op', target: '/api/test', scope: 'ai-engine', riskLevel: 'P1_HIGH', traceId: 'trc', payload: mockReq.body
    });
    await OrionApprovalStore.transitionStatus(approval.id, 'PENDING', 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    
    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('binding mismatch') }));
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('rejects execution if payload tampering is detected', async () => {
    const approval = await OrionApprovalStore.create({
      agentId: AGENT_ORION_IDENTITY, capabilityId: 'ai.generate', userId: 'user1', operation: 'test-op', target: '/api/test', scope: 'ai-engine', riskLevel: 'P1_HIGH', traceId: 'trc', payload: { some: 'other-data' }
    });
    await OrionApprovalStore.transitionStatus(approval.id, 'PENDING', 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    
    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Payload tampering detected') }));
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('rejects execution if status is EXPIRED', async () => {
    const approval = await OrionApprovalStore.create({
      agentId: AGENT_ORION_IDENTITY, capabilityId: 'ai.generate', userId: 'user1', operation: 'test-op', target: '/api/test', scope: 'ai-engine', riskLevel: 'P1_HIGH', traceId: 'trc', payload: mockReq.body
    });
    // manually expire
    const ap = (OrionApprovalStore as any).fallbackApprovals.get(approval.id);
    ap.expiresAt = Date.now() - 1000;
    
    await OrionApprovalStore.transitionStatus(approval.id, 'PENDING', 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    
    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFn).not.toHaveBeenCalled();
  });

  it('rejects execution if underlying policy now DENYs', async () => {
    const approval = await OrionApprovalStore.create({
      agentId: AGENT_ORION_IDENTITY, capabilityId: 'ai.generate', userId: 'user1', operation: 'test-op', target: '/api/test', scope: 'ai-engine', riskLevel: 'P1_HIGH', traceId: 'trc', payload: mockReq.body
    });
    await OrionApprovalStore.transitionStatus(approval.id, 'PENDING', 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: false, decision: 'DENY', reason: 'Now blocked'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('failed after approval') }));
    expect(nextFn).not.toHaveBeenCalled();
  });
  
  it('sets state to FAILED if route execution fails (statusCode >= 400)', async () => {
    const approval = await OrionApprovalStore.create({
      agentId: AGENT_ORION_IDENTITY, capabilityId: 'ai.generate', userId: 'user1', operation: 'test-op', target: '/api/test', scope: 'ai-engine', riskLevel: 'P1_HIGH', traceId: 'trc', payload: mockReq.body
    });
    await OrionApprovalStore.transitionStatus(approval.id, 'PENDING', 'APPROVED');
    
    mockReq.headers['x-orion-approval-id'] = approval.id;
    vi.spyOn(ControlPlaneAuthorization, 'authorizeAgentRequest').mockReturnValue({
      success: true, decision: 'ALLOW'
    });

    const middleware = requireOrionAuth('ai.generate', 'test-op');
    await middleware(mockReq, mockRes, nextFn);

    expect(nextFn).toHaveBeenCalled();
    
    // Simulate request finish with error
    mockRes.statusCode = 500;
    if (mockRes._finishCb) {
      await mockRes._finishCb();
    }
    const finalizedApproval = await OrionApprovalStore.get(approval.id);
    expect(finalizedApproval?.status).toBe('FAILED');
  });
});
