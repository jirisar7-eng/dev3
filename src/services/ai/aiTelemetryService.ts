export type QuotaType = 'API_QUOTA' | 'PROVIDER_QUOTA' | 'SUBSCRIPTION_QUOTA' | 'UNKNOWN';
export type QuotaStatus = 'OK' | 'EXCEEDED' | 'RATE_LIMITED' | 'NOT_AVAILABLE_THROUGH_CURRENT_API';

export interface AiTelemetryMetric {
  correlationId: string;
  providerKey: string;
  modelKey: string;
  providerModelId: string;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens: number | null;
  reasoningTokens: number | null;
  latencyMs: number;
  errorsCount: number;
  retriesCount: number;
  fallbacksCount: number;
  estimatedCostUsd: number;
  quotaType: QuotaType;
  quotaStatus: QuotaStatus;
  quotaNote?: string;
  timestamp: string;
}

export interface ModelTelemetrySummary {
  modelKey: string;
  providerKey: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCachedTokens: number;
  totalReasoningTokens: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalErrors: number;
  totalRetries: number;
  totalFallbacks: number;
  totalCostUsd: number;
  quotaType: QuotaType;
  quotaStatus: QuotaStatus;
  quotaNote: string;
  lastUpdated: string;
}

export class AiTelemetryService {
  private metricsLog: AiTelemetryMetric[] = [];
  private readonly maxLogSize = 2000;

  public recordMetric(metric: Omit<AiTelemetryMetric, 'timestamp'>): AiTelemetryMetric {
    const fullMetric: AiTelemetryMetric = {
      ...metric,
      timestamp: new Date().toISOString()
    };

    this.metricsLog.push(fullMetric);
    if (this.metricsLog.length > this.maxLogSize) {
      this.metricsLog.shift();
    }

    return fullMetric;
  }

  public getTelemetryByCorrelationId(correlationId: string): AiTelemetryMetric[] {
    return this.metricsLog.filter(m => m.correlationId === correlationId);
  }

  public getTelemetrySummary(modelKey?: string): ModelTelemetrySummary[] {
    const grouped = new Map<string, AiTelemetryMetric[]>();

    for (const m of this.metricsLog) {
      if (modelKey && m.modelKey !== modelKey) continue;
      const key = `${m.providerKey}:${m.modelKey}`;
      const existing = grouped.get(key) || [];
      existing.push(m);
      grouped.set(key, existing);
    }

    const summaries: ModelTelemetrySummary[] = [];

    grouped.forEach((metrics, key) => {
      const [providerKey, mKey] = key.split(':');
      const totalRequests = metrics.reduce((acc, m) => acc + m.requestCount, 0);
      const totalInputTokens = metrics.reduce((acc, m) => acc + m.inputTokens, 0);
      const totalOutputTokens = metrics.reduce((acc, m) => acc + m.outputTokens, 0);
      const totalTokens = metrics.reduce((acc, m) => acc + m.totalTokens, 0);
      const totalCachedTokens = metrics.reduce((acc, m) => acc + (m.cachedTokens || 0), 0);
      const totalReasoningTokens = metrics.reduce((acc, m) => acc + (m.reasoningTokens || 0), 0);
      const totalErrors = metrics.reduce((acc, m) => acc + m.errorsCount, 0);
      const totalRetries = metrics.reduce((acc, m) => acc + m.retriesCount, 0);
      const totalFallbacks = metrics.reduce((acc, m) => acc + m.fallbacksCount, 0);
      const totalCostUsd = metrics.reduce((acc, m) => acc + m.estimatedCostUsd, 0);

      const latencies = metrics.map(m => m.latencyMs).sort((a, b) => a - b);
      const avgLatencyMs = latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;
      const p95Idx = Math.floor(latencies.length * 0.95);
      const p95LatencyMs = latencies.length > 0 ? latencies[p95Idx] : 0;

      const latestMetric = metrics[metrics.length - 1];
      const isGoogleGemini = providerKey === 'gemini';

      // Quota classification
      let quotaType: QuotaType = latestMetric?.quotaType || 'API_QUOTA';
      let quotaStatus: QuotaStatus = latestMetric?.quotaStatus || 'OK';
      let quotaNote = latestMetric?.quotaNote || 'Standard API quota metrics';

      if (isGoogleGemini) {
        quotaNote = 'Google AI Pro Subscription usage NOT_AVAILABLE_THROUGH_CURRENT_API. Showing API Quota telemetry.';
        if (quotaStatus === 'OK' && latestMetric?.quotaType === 'SUBSCRIPTION_QUOTA') {
          quotaStatus = 'NOT_AVAILABLE_THROUGH_CURRENT_API';
        }
      }

      summaries.push({
        modelKey: mKey,
        providerKey,
        totalRequests,
        totalInputTokens,
        totalOutputTokens,
        totalTokens,
        totalCachedTokens,
        totalReasoningTokens,
        avgLatencyMs,
        p95LatencyMs,
        totalErrors,
        totalRetries,
        totalFallbacks,
        totalCostUsd: Number(totalCostUsd.toFixed(6)),
        quotaType,
        quotaStatus,
        quotaNote,
        lastUpdated: latestMetric ? latestMetric.timestamp : new Date().toISOString()
      });
    });

    return summaries;
  }
}

export const aiTelemetryService = new AiTelemetryService();
