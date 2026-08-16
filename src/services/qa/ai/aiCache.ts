import crypto from 'crypto';
import { AIAnalystReport } from './types';

export interface CacheKeyParams {
  commitSha: string;
  sourceHash: string;
  context: string;
  provider: string;
  model: string;
}

class AICache {
  private cache = new Map<string, AIAnalystReport>();

  public computeKey(params: CacheKeyParams): string {
    const rawString = `${params.commitSha}:${params.sourceHash}:${params.context}:${params.provider}:${params.model}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  public get(key: string): AIAnalystReport | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    return {
      ...cached,
      cachedHit: true,
      providerUsed: 'cached'
    };
  }

  public set(key: string, report: AIAnalystReport): void {
    this.cache.set(key, report);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const aiCache = new AICache();
