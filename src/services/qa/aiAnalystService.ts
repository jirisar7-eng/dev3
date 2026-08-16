import { AIAnalysisInput, AIAnalystReport, AIStats } from './ai/types';
import { aiAnalystOrchestrator } from './ai/aiAnalystOrchestrator';
import { aiStatsManager } from './ai/aiStats';
import { aiCache } from './ai/aiCache';

export type { AIAnalysisInput, AIAnalystReport, AIStats };
export { aiStatsManager, aiCache, aiAnalystOrchestrator };

export const aiAnalystService = {
  async analyzeRunPayload(input: AIAnalysisInput): Promise<AIAnalystReport> {
    return aiAnalystOrchestrator.analyzeRunPayload(input);
  }
};
