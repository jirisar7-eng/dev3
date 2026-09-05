import { AgentAuthorizationResult, AgentType } from './agentRegistry';
import { User } from './index';

export interface AgentDispatchRequest {
  agentId: AgentType | string;
  capabilityId: string;
  user?: User; // Strictly from server-side session
  requestedOperation?: string;
  targetResource?: string;
  scope?: string;
  payload?: unknown; // The actual workload data
}

export interface AgentDispatchResult {
  success: boolean;
  decision: AgentAuthorizationResult['decision'];
  reason?: string;
  ticketId?: string; // If human approval required
  traceId?: string;
  data?: unknown; // Result of execution
}

export interface AgentCapabilityHandler {
  execute(
    request: AgentDispatchRequest,
    authorization: AgentAuthorizationResult
  ): Promise<unknown>;
}
