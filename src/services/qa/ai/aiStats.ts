import { AIStats } from './types';

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

  public recordCall(provider: string, promptTokens: number, completionTokens: number): void {
    this.totalCalls += 1;
    this.promptTokens += promptTokens;
    this.completionTokens += completionTokens;
    this.lastCallAt = new Date().toISOString();

    // Approximate cost calculation ($0.000005 per token)
    const totalTokensForCall = promptTokens + completionTokens;
    const callCost = totalTokensForCall * 0.000005;
    this.estimatedCostUsd += callCost;
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

  public getStats(): AIStats {
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
      skippedReasons: { ...this.skippedReasons }
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
  }
}

export const aiStatsManager = new AIStatsManager();
