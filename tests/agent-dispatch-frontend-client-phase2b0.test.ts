import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchAgent, AgentDispatchRequest } from '../src/services/agent/agentDispatchClient';
import * as apiClient from '../src/utils/apiClient';

// Mock the apiClient to intercept fetch calls
vi.mock('../src/utils/apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/apiClient')>();
  return {
    ...actual,
    apiFetch: vi.fn(),
    safeJsonResponse: vi.fn(),
  };
});

describe('Phase 2B-0 — Safe Agent Dispatch Frontend Client', () => {
  const mockApiFetch = vi.mocked(apiClient.apiFetch);
  const mockSafeJsonResponse = vi.mocked(apiClient.safeJsonResponse);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue('mocked-token'),
    };
    Object.defineProperty(global, 'window', {
      value: { localStorage: localStorageMock },
      writable: true,
    });
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  it('1. Returns SUCCESS on valid ALLOW response', async () => {
    mockApiFetch.mockResolvedValue({ status: 200 } as any);
    mockSafeJsonResponse.mockResolvedValue({
      success: true,
      data: { result: 'ok' },
      traceId: 'trace-123'
    });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(true);
    expect(res.decision).toBe('SUCCESS');
    expect(res.data).toEqual({ result: 'ok' });
    expect(res.traceId).toBe('trace-123');
  });

  it('2. Returns DENY on 403 response', async () => {
    mockApiFetch.mockResolvedValue({ status: 403 } as any);
    mockSafeJsonResponse.mockResolvedValue({
      success: false,
      error: 'Access Denied',
      traceId: 'trace-456'
    });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('DENY');
    expect(res.error).toBe('Access Denied');
    expect(res.traceId).toBe('trace-456');
  });

  it('3. Returns REQUIRE_HUMAN_APPROVAL on 202 PENDING response', async () => {
    mockApiFetch.mockResolvedValue({ status: 202 } as any);
    mockSafeJsonResponse.mockResolvedValue({
      success: false,
      pending: true,
      message: 'Approval required',
      ticketId: 'ticket-789',
      traceId: 'trace-789'
    });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'analytics.read' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('REQUIRE_HUMAN_APPROVAL');
    expect(res.ticketId).toBe('ticket-789');
    expect(res.message).toBe('Approval required');
  });

  it('4. Handles 400 Validation Error', async () => {
    mockApiFetch.mockResolvedValue({ status: 400 } as any);
    mockSafeJsonResponse.mockResolvedValue({ success: false, error: 'Invalid input' });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Invalid input');
  });

  it('5. Handles 401 Unauthorized', async () => {
    mockApiFetch.mockResolvedValue({ status: 401 } as any);
    mockSafeJsonResponse.mockResolvedValue({ success: false, error: 'Unauthorized' });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Unauthorized');
  });

  it('6. Handles 413 Payload Too Large', async () => {
    mockApiFetch.mockResolvedValue({ status: 413 } as any);
    mockSafeJsonResponse.mockResolvedValue({ success: false, error: 'Payload Too Large' });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Payload Too Large');
  });

  it('7. Handles 429 Rate Limit', async () => {
    mockApiFetch.mockResolvedValue({ status: 429 } as any);
    mockSafeJsonResponse.mockResolvedValue({ success: false, error: 'Too Many Requests' });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Too Many Requests');
  });

  it('8. Handles 500 Internal Server Error', async () => {
    mockApiFetch.mockResolvedValue({ status: 500 } as any);
    mockSafeJsonResponse.mockResolvedValue({ success: false, error: 'Internal Server Error' });

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Internal Server Error');
  });

  it('9. Handles network error gracefully', async () => {
    mockApiFetch.mockRejectedValue(new Error('Failed to fetch'));

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Network error or unable to reach server');
  });

  it('10. Handles timeout/abort error gracefully', async () => {
    const err = new Error('AbortError');
    err.name = 'AbortError';
    mockApiFetch.mockRejectedValue(err);

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('Request timeout or aborted');
  });

  it('11. Handles malformed response gracefully', async () => {
    mockApiFetch.mockResolvedValue({ status: 200 } as any);
    mockSafeJsonResponse.mockResolvedValue(null);

    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(true);
    expect(res.decision).toBe('SUCCESS');
    expect(res.data).toBeUndefined(); // Or null based on logic
  });

  it('12. Validation fails for empty/invalid agentId', async () => {
    const req: AgentDispatchRequest = { agentId: '', capabilityId: 'report.generate' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('agentId is required');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('13. Validation fails for empty/invalid capabilityId', async () => {
    const req: AgentDispatchRequest = { agentId: 'DATA_ANALYST', capabilityId: '' };
    const res = await dispatchAgent(req);

    expect(res.success).toBe(false);
    expect(res.decision).toBe('ERROR');
    expect(res.error).toBe('capabilityId is required');
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it('14. Safely strips client-side spoofing fields before fetch', async () => {
    mockApiFetch.mockResolvedValue({ status: 200 } as any);
    mockSafeJsonResponse.mockResolvedValue({ success: true });

    // Client passes forbidden fields (which wouldn't compile due to types, but we test runtime casting)
    const req = { 
      agentId: 'DATA_ANALYST', 
      capabilityId: 'report.generate',
      user: 'spoofed_user',
      role: 'ADMIN',
      permissions: ['all'],
      approval: true,
      ticketId: 'fake-ticket',
      traceId: 'fake-trace',
      provider: 'spoofed-provider',
      model: 'gpt-4',
      systemPrompt: 'bypass',
      payload: { validData: 123 }
    } as unknown as AgentDispatchRequest;

    await dispatchAgent(req);

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    
    // Check that the body passed to fetch does NOT contain the spoofed fields
    const fetchArgs = mockApiFetch.mock.calls[0];
    const requestBody = JSON.parse(fetchArgs[1]?.body as string);
    
    expect(requestBody.agentId).toBe('DATA_ANALYST');
    expect(requestBody.capabilityId).toBe('report.generate');
    expect(requestBody.payload).toEqual({ validData: 123 });
    
    // Explicitly check absence of forbidden fields at top level
    expect(requestBody.user).toBeUndefined();
    expect(requestBody.role).toBeUndefined();
    expect(requestBody.permissions).toBeUndefined();
    expect(requestBody.provider).toBeUndefined();
    expect(requestBody.model).toBeUndefined();
    expect(requestBody.systemPrompt).toBeUndefined();
  });
});
