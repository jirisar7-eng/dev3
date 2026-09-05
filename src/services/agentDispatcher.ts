import { AgentDispatchRequest, AgentDispatchResult } from '../types/agentDispatcher';
import { ControlPlaneAuthorization } from './controlPlaneAuthorization';
import { AgentCapabilityHandler } from '../types/agentDispatcher';
import { dataAnalystHandler } from './agentHandlers/dataAnalystHandler';
import { documentProcessorHandler } from './agentHandlers/documentProcessorHandler';

export class AgentDispatcher {
  private static handlers = new Map<string, AgentCapabilityHandler>();

  static {
    // Register available safe handlers here.
    // Ensure we do not map dangerous capabilities.
    AgentDispatcher.handlers.set('DATA_ANALYST:report.generate', dataAnalystHandler);
    AgentDispatcher.handlers.set('DATA_ANALYST:analytics.read', dataAnalystHandler);
    AgentDispatcher.handlers.set('DATA_ANALYST:metrics.query', dataAnalystHandler);

    // Document Processor safe handlers (Phase 2C)
    AgentDispatcher.handlers.set('DOCUMENT_PROCESSOR:document.read', documentProcessorHandler);
    AgentDispatcher.handlers.set('DOCUMENT_PROCESSOR:document.parse', documentProcessorHandler);
    AgentDispatcher.handlers.set('DOCUMENT_PROCESSOR:ocr.extract', documentProcessorHandler);
  }

  /**
   * Main entry point for dispatching capabilities to agents.
   * This method guarantees that ControlPlaneAuthorization.authorizeAgentRequest()
   * is called BEFORE any capability handler is executed.
   */
  public static async dispatch(request: AgentDispatchRequest): Promise<AgentDispatchResult> {
    // 1. Immutable Authorization Request
    // Ensure context does not carry authorization-sensitive overrides
    const authRequest = {
      agentId: request.agentId,
      capabilityId: request.capabilityId,
      user: request.user,
      requestedOperation: request.requestedOperation,
      targetResource: request.targetResource,
      scope: request.scope,
    };

    // 2. Invoke Single Source of Truth for Authorization
    const authResult = ControlPlaneAuthorization.authorizeAgentRequest(authRequest);

    // 3. Evaluate Decision
    if (authResult.decision === 'DENY') {
      return {
        success: false,
        decision: 'DENY',
        reason: authResult.reason,
        traceId: authResult.traceId,
      };
    }

    if (authResult.decision === 'REQUIRE_HUMAN_APPROVAL') {
      // In a real implementation, we would integrate with ControlPlaneTicketEngine here.
      // For now, return a safe pending state.
      return {
        success: false,
        decision: 'REQUIRE_HUMAN_APPROVAL',
        reason: 'Operation requires human approval.',
        ticketId: `PENDING-TICKET-${Date.now()}`,
        traceId: authResult.traceId,
      };
    }

    // 4. Execution path (ALLOW)
    const handlerKey = `${request.agentId}:${request.capabilityId}`;
    const handler = AgentDispatcher.handlers.get(handlerKey);

    if (!handler) {
      // Missing handler -> Fail Closed
      return {
        success: false,
        decision: 'DENY',
        reason: `FAIL CLOSED: No execution handler registered for ${handlerKey}.`,
        traceId: authResult.traceId,
      };
    }

    // 5. Execute Handler
    try {
      const data = await handler.execute(request, authResult);
      return {
        success: true,
        decision: 'ALLOW',
        traceId: authResult.traceId,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        decision: 'ALLOW', // The authorization allowed it, but execution failed
        reason: `Execution failed: ${error?.message || 'Unknown error'}`,
        traceId: authResult.traceId,
      };
    }
  }
}
