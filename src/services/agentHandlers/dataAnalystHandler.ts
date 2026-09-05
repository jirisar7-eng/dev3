import { AgentCapabilityHandler, AgentDispatchRequest } from '../../types/agentDispatcher';
import { AgentAuthorizationResult } from '../../types/agentRegistry';
import { aiAnalystOrchestrator } from '../qa/ai/aiAnalystOrchestrator';
import { analyticsService } from '../analyticsService';
import { AnalyticsTimeRange } from '../../types';

const ALLOWED_TIME_RANGES = new Set<string>(['today', '7d', '30d', 'all']);

function validateTimeRangeAndInput(payload?: Record<string, unknown>): AnalyticsTimeRange {
  if (!payload || typeof payload !== 'object') {
    return '30d';
  }

  // Explicitly deny arbitrary query execution, raw SQL, or model/table access
  const forbiddenKeys = ['query', 'sql', 'rawQuery', 'table', 'model', 'endpoint', 'function', 'fn', 'select', 'where', 'execute'];
  for (const key of forbiddenKeys) {
    if (key in payload) {
      throw new Error(`FAIL CLOSED: Client is strictly forbidden from specifying database operations or raw query parameter '${key}'.`);
    }
  }

  // Scan string values for SQL injection / dangerous command patterns
  for (const [key, val] of Object.entries(payload)) {
    if (typeof val === 'string') {
      if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION)\b|--|;)/i.test(val)) {
        throw new Error(`FAIL CLOSED: SQL injection attempt detected in field '${key}'.`);
      }
    }
  }

  if (payload.timeRange !== undefined && payload.timeRange !== null) {
    if (typeof payload.timeRange !== 'string') {
      throw new Error('FAIL CLOSED: Invalid timeRange: must be a string.');
    }
    if (payload.timeRange.length > 10) {
      throw new Error('FAIL CLOSED: Excessive timeRange: length exceeds maximum allowed limit (10 characters).');
    }
    if (!ALLOWED_TIME_RANGES.has(payload.timeRange)) {
      throw new Error(`FAIL CLOSED: Invalid timeRange '${payload.timeRange}'. Allowed values: today, 7d, 30d, all.`);
    }
    return payload.timeRange as AnalyticsTimeRange;
  }

  return '30d';
}

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

    if (request.capabilityId === 'analytics.read') {
      const payload = (request.payload as Record<string, unknown>) || {};
      const timeRange = validateTimeRangeAndInput(payload);
      try {
        const stats = await analyticsService.getAdminStats();
        return {
          status: 'success',
          message: `Mocked data for ${request.capabilityId}`,
          target: request.targetResource,
          ...stats,
          requestedTimeRange: timeRange,
        };
      } catch (err: any) {
        throw new Error(`Analytics Read Error: ${err.message}`);
      }
    }

    if (request.capabilityId === 'metrics.query') {
      const payload = (request.payload as Record<string, unknown>) || {};
      const timeRange = validateTimeRangeAndInput(payload);
      try {
        const insights = await analyticsService.getAnalyticsAiInsights(timeRange);
        return {
          status: 'success',
          message: `Mocked data for ${request.capabilityId}`,
          target: request.targetResource,
          ...insights,
        };
      } catch (err: any) {
        throw new Error(`Metrics Query Error: ${err.message}`);
      }
    }

    throw new Error(`Unsupported capability ${request.capabilityId} for DATA_ANALYST.`);
  }
}

export const dataAnalystHandler = new DataAnalystHandler();
