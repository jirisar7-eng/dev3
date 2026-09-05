import { apiFetch, safeJsonResponse } from '../../utils/apiClient';

export interface AgentDispatchRequest {
  agentId: string;
  capabilityId: string;
  payload?: Record<string, unknown>;
  targetResource?: string;
  requestedOperation?: string;
}

export type AgentDispatchDecision = 'SUCCESS' | 'DENY' | 'REQUIRE_HUMAN_APPROVAL' | 'ERROR';

export interface AgentDispatchResponse<T = unknown> {
  success: boolean;
  decision: AgentDispatchDecision;
  data?: T;
  error?: string;
  message?: string;
  ticketId?: string;
  traceId?: string;
}

export const dispatchAgent = async <T = unknown>(
  request: AgentDispatchRequest,
  abortSignal?: AbortSignal
): Promise<AgentDispatchResponse<T>> => {
  // Client-side validation
  if (!request.agentId || typeof request.agentId !== 'string') {
    return {
      success: false,
      decision: 'ERROR',
      error: 'agentId is required'
    };
  }

  if (!request.capabilityId || typeof request.capabilityId !== 'string') {
    return {
      success: false,
      decision: 'ERROR',
      error: 'capabilityId is required'
    };
  }

  // Construct safe payload by explicitly picking allowed fields
  const safeBody = {
    agentId: request.agentId,
    capabilityId: request.capabilityId,
    payload: request.payload,
    targetResource: request.targetResource,
    requestedOperation: request.requestedOperation
  };

  try {
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('tatovacesta_auth_token') || '';
    }

    const response = await apiFetch('/api/admin/agent/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(safeBody),
      signal: abortSignal
    });

    const json = await safeJsonResponse(response);

    if (response.status >= 200 && response.status < 300) {
      if (response.status === 202) {
        return {
          success: false,
          decision: 'REQUIRE_HUMAN_APPROVAL',
          message: json?.message || 'Operation requires human approval',
          ticketId: json?.ticketId,
          traceId: json?.traceId
        };
      }
      
      return {
        success: true,
        decision: 'SUCCESS',
        data: json?.data,
        traceId: json?.traceId
      };
    }

    // Map HTTP error codes
    let decision: AgentDispatchDecision = 'ERROR';
    if (response.status === 403) {
      decision = 'DENY';
    } else if (response.status === 400 || response.status === 401 || response.status === 413 || response.status === 429 || response.status >= 500) {
      decision = 'ERROR';
    }

    return {
      success: false,
      decision,
      error: json?.error || `HTTP Error ${response.status}`,
      traceId: json?.traceId
    };

  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        decision: 'ERROR',
        error: 'Request timeout or aborted'
      };
    }
    return {
      success: false,
      decision: 'ERROR',
      error: 'Network error or unable to reach server'
    };
  }
};
