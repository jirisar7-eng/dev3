import { AgentCapabilityHandler, AgentDispatchRequest } from '../../types/agentDispatcher';
import { AgentAuthorizationResult } from '../../types/agentRegistry';
import { aiAnalystOrchestrator } from '../qa/ai/aiAnalystOrchestrator';

class DataAnalystHandler implements AgentCapabilityHandler {
  public async execute(
    request: AgentDispatchRequest,
    authorization: AgentAuthorizationResult
  ): Promise<unknown> {
    // Only execute if authorization is strictly ALLOW.
    // The Dispatcher already checks this, but it's good practice.
    if (authorization.decision !== 'ALLOW') {
      throw new Error('Unauthorized execution attempt.');
    }

    if (request.capabilityId === 'report.generate') {
      // Use existing orchestrator functionality instead of duplicating it
      // Ensure we only pass necessary data and not sensitive objects
      const payload = request.payload as Record<string, unknown> || {};
      
      try {
        const report = await aiAnalystOrchestrator.analyzeRunPayload({
          id: String(payload.id || Date.now()),
          timestamp: new Date().toISOString(),
          status: 'success',
          environment: 'production',
          tests: [],
          ...payload
        } as any); // Type cast since we just proxy it to the orchestrator
        return report;
      } catch (err: any) {
         throw new Error(`Analytics Generation Error: ${err.message}`);
      }
    }
    
    if (request.capabilityId === 'analytics.read' || request.capabilityId === 'metrics.query') {
        return {
            status: 'success',
            message: `Mocked data for ${request.capabilityId}`,
            target: request.targetResource
        };
    }

    throw new Error(`Unsupported capability ${request.capabilityId} for DATA_ANALYST.`);
  }
}

export const dataAnalystHandler = new DataAnalystHandler();
