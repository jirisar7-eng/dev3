import { AIStats, ProviderTelemetryStats, AICallRecord, ModelPricing } from './types';

/**
 * Centralized Pricing Model Table ($ per token)
 * Explicitly marked as ESTIMATED in UI.
 * If model is unknown or pricing unavailable, returns costStatus: 'UNKNOWN' and cost: null.
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  'gemini-3.6-flash': { promptCostPerToken: 0.000000075, completionCostPerToken: 0.0000003 },
  'gemini-2.5-flash': { promptCostPerToken: 0.000000075, completionCostPerToken: 0.0000003 },
  'gemini-2.5-pro': { promptCostPerToken: 0.00000125, completionCostPerToken: 0.000005 },
  'grok-2-1212': { promptCostPerToken: 0.000002, completionCostPerToken: 0.00001 },
  'llama-3.3-70b-versatile': { promptCostPerToken: 0.00000059, completionCostPerToken: 0.00000079 },
};

export function calculateEstimatedCost(
  model: string,
  promptTokens?: number | null,
  completionTokens?: number | null
): { cost: number | null; costStatus: 'ESTIMATED' | 'UNKNOWN' } {
  if (promptTokens === null || promptTokens === undefined || completionTokens === null || completionTokens === undefined) {
    return { cost: null, costStatus: 'UNKNOWN' };
  }
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    return { cost: null, costStatus: 'UNKNOWN' };
  }
  const cost = (promptTokens * pricing.promptCostPerToken) + (completionTokens * pricing.completionCostPerToken);
  return { cost: Number(cost.toFixed(6)), costStatus: 'ESTIMATED' };
}

export function calculateP95(latencies: number[]): number {
  if (!latencies || latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

class AIStatsManager {
  private totalCalls = 0;
  private cacheHits = 0;
  private skipped = 0;
  private promptTokens = 0;
  private completionTokens = 0;
  private estimatedCostUsd = 0;
  private lastCallAt: string | null = null;
  private skippedReasons: Record<string, number> = {};

  private maxCallQuota = 50; // Safe quota limit
  private maxHistorySize = 200; // Bounded circular memory buffer

  private callHistory: AICallRecord[] = [];
  private providerStatsMap: Map<string, ProviderTelemetryStats> = new Map();

  private activeOperation: {
    isWorking: boolean;
    provider?: string;
    model?: string;
    startTime?: string;
    estimatedMs?: number | null;
  } | null = null;

  constructor() {
    this.initDefaultProviders();
  }

  private initDefaultProviders(): void {
    const defaultProviders = [
      { name: 'gemini', model: 'gemini-3.6-flash' },
      { name: 'grok', model: 'grok-2-1212' },
      { name: 'groq', model: 'llama-3.3-70b-versatile' }
    ];

    for (const p of defaultProviders) {
      if (!this.providerStatsMap.has(p.name)) {
        this.providerStatsMap.set(p.name, {
          provider: p.name,
          model: p.model,
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
          timeoutCount: 0,
          fallbackCount: 0,
          avgLatencyMs: 0,
          p95LatencyMs: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          costStatus: 'ESTIMATED',
          status: 'IDLE',
          lastCallAt: null
        });
      }
    }
  }

  public recordCallDetails(params: {
    provider: string;
    model: string;
    promptTokens?: number | null;
    completionTokens?: number | null;
    latencyMs: number;
    success: boolean;
    isTimeout?: boolean;
    isFallback?: boolean;
    errorMsg?: string;
  }): void {
    try {
      const {
        provider,
        model,
        promptTokens = null,
        completionTokens = null,
        latencyMs,
        success,
        isTimeout = false,
        isFallback = false,
        errorMsg
      } = params;

      const now = new Date().toISOString();
      this.totalCalls += 1;
      this.lastCallAt = now;

      // Add to circular history buffer
      this.callHistory.push({
        provider,
        model,
        latencyMs,
        promptTokens,
        completionTokens,
        success,
        isTimeout,
        isFallback,
        timestamp: now,
        errorMsg: errorMsg ? errorMsg.slice(0, 150) : null // 0-PII sanitized snippet
      });

      if (this.callHistory.length > this.maxHistorySize) {
        this.callHistory.shift();
      }

      // Update provider-specific stats
      let stats = this.providerStatsMap.get(provider);
      if (!stats) {
        stats = {
          provider,
          model,
          requestCount: 0,
          successCount: 0,
          failureCount: 0,
          timeoutCount: 0,
          fallbackCount: 0,
          avgLatencyMs: 0,
          p95LatencyMs: 0,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          estimatedCostUsd: 0,
          costStatus: 'ESTIMATED',
          status: 'IDLE',
          lastCallAt: null
        };
        this.providerStatsMap.set(provider, stats);
      }

      stats.model = model;
      stats.requestCount += 1;
      stats.lastCallAt = now;

      if (success) {
        stats.successCount += 1;
      } else {
        stats.failureCount += 1;
        stats.lastErrorMessage = errorMsg ? errorMsg.slice(0, 150) : 'Unknown error';
      }

      if (isTimeout) {
        stats.timeoutCount += 1;
      }
      if (isFallback) {
        stats.fallbackCount += 1;
      }

      // Compute Tokens
      if (promptTokens !== null && promptTokens !== undefined) {
        stats.promptTokens = (stats.promptTokens || 0) + promptTokens;
        this.promptTokens += promptTokens;
      } else {
        if (stats.promptTokens === 0 && stats.requestCount === 1) {
          stats.promptTokens = null;
        }
      }

      if (completionTokens !== null && completionTokens !== undefined) {
        stats.completionTokens = (stats.completionTokens || 0) + completionTokens;
        this.completionTokens += completionTokens;
      } else {
        if (stats.completionTokens === 0 && stats.requestCount === 1) {
          stats.completionTokens = null;
        }
      }

      if (stats.promptTokens !== null && stats.completionTokens !== null) {
        stats.totalTokens = stats.promptTokens + stats.completionTokens;
      } else {
        stats.totalTokens = null;
      }

      // Compute Cost
      const costResult = calculateEstimatedCost(model, promptTokens, completionTokens);
      stats.costStatus = costResult.costStatus;
      if (costResult.cost !== null) {
        stats.estimatedCostUsd = Number(((stats.estimatedCostUsd || 0) + costResult.cost).toFixed(6));
        this.estimatedCostUsd += costResult.cost;
      } else {
        if (stats.estimatedCostUsd === 0 && stats.requestCount === 1) {
          stats.estimatedCostUsd = null;
        }
      }

      // Calculate provider latencies from circular buffer
      const providerHistory = this.callHistory.filter(h => h.provider === provider);
      const latencies = providerHistory.map(h => h.latencyMs);

      if (latencies.length > 0) {
        const sum = latencies.reduce((a, b) => a + b, 0);
        stats.avgLatencyMs = Math.round(sum / latencies.length);
        stats.p95LatencyMs = Math.round(calculateP95(latencies));
      }

      // Determine Provider Status
      if (isFallback) {
        stats.status = 'FALLBACK';
      } else if (!success) {
        stats.status = 'ERROR';
      } else if (stats.failureCount > 0 && stats.successCount > 0) {
        stats.status = 'DEGRADED';
      } else {
        stats.status = 'ACTIVE';
      }

    } catch (err) {
      // Non-blocking telemetry fallback
      console.warn('[AIStatsManager] Telemetry recording failed silently:', err);
    }
  }

  // Legacy fallback method for backwards compatibility
  public recordCall(provider: string, promptTokens: number, completionTokens: number): void {
    const model = provider === 'grok' ? 'grok-2-1212' : (provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-3.6-flash');
    this.recordCallDetails({
      provider,
      model,
      promptTokens,
      completionTokens,
      latencyMs: 150,
      success: true
    });
  }

  public recordCacheHit(): void {
    this.cacheHits += 1;
  }

  public recordSkipped(reason: string): void {
    this.skipped += 1;
    this.skippedReasons[reason] = (this.skippedReasons[reason] || 0) + 1;
  }

  public isQuotaExceeded(): boolean {
    return this.totalCalls >= this.maxCallQuota;
  }

  public setQuotaLimit(limit: number): void {
    this.maxCallQuota = limit;
  }

  public getQuotaLimit(): number {
    return this.maxCallQuota;
  }

  public startOperation(provider: string, model: string, estimatedMs?: number | null): void {
    this.activeOperation = {
      isWorking: true,
      provider,
      model,
      startTime: new Date().toISOString(),
      estimatedMs: estimatedMs || null
    };

    const stats = this.providerStatsMap.get(provider);
    if (stats) {
      stats.status = 'ACTIVE';
    }
  }

  public endOperation(): void {
    this.activeOperation = null;
  }

  public getStats(): AIStats {
    const providersObj: Record<string, ProviderTelemetryStats> = {};
    for (const [key, val] of this.providerStatsMap.entries()) {
      providersObj[key] = { ...val };
    }

    const elapsedMs = this.activeOperation?.startTime
      ? Date.now() - new Date(this.activeOperation.startTime).getTime()
      : 0;

    return {
      totalCalls: this.totalCalls,
      cacheHits: this.cacheHits,
      skipped: this.skipped,
      tokenUsage: {
        promptTokens: this.promptTokens,
        completionTokens: this.completionTokens,
        totalTokens: this.promptTokens + this.completionTokens
      },
      estimatedCostUsd: Number(this.estimatedCostUsd.toFixed(6)),
      lastCallAt: this.lastCallAt,
      skippedReasons: { ...this.skippedReasons },
      providers: providersObj,
      history: [...this.callHistory],
      activeOperation: this.activeOperation ? {
        ...this.activeOperation,
        elapsedMs
      } : null
    };
  }

  public resetStats(): void {
    this.totalCalls = 0;
    this.cacheHits = 0;
    this.skipped = 0;
    this.promptTokens = 0;
    this.completionTokens = 0;
    this.estimatedCostUsd = 0;
    this.lastCallAt = null;
    this.skippedReasons = {};
    this.callHistory = [];
    this.providerStatsMap.clear();
    this.activeOperation = null;
    this.initDefaultProviders();
  }
}

export const aiStatsManager = new AIStatsManager();
