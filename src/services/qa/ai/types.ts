export interface AICouncilFinding {
  finding: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  rootCause: string;
  confidence: number;
  evidence: string;
  recommendation: string;
  suggestedTests: string[];
  qaFindingId?: string;
}

export interface AICouncilAnalystResult {
  providerName: string;
  modelName: string;
  timestamp: string;
  confidence: number;
  findings: AICouncilFinding[];
  summary: string;
  verdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
}

export type ConsensusStatus = 'UNANIMOUS' | 'MAJORITY' | 'DISAGREEMENT' | 'INSUFFICIENT_EVIDENCE';

export interface AICouncilConsensus {
  status: ConsensusStatus;
  consensusVerdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';
  finalQAVerdict: 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY';
  agreedFindings: AICouncilFinding[];
  disputedFindings: AICouncilFinding[];
  insufficientEvidenceReason?: string;
  analysts: Record<string, AICouncilAnalystResult>;
  timestamp: string;
  qaRunId?: string;
}

export interface AIAnalysisInput {
  commitSha: string;
  branch: string;
  environment: string;
  metrics: {
    pages: number;
    routes: number;
    components: number;
    buttons: number;
    links: number;
    forms: number;
    apiEndpoints: number;
    prismaModels: number;
    e2eTests: number;
    coveragePercent?: number;
    testedCoveragePercent?: number;
    verifiedCoveragePercent?: number;
  };
  scores: {
    functional: number;
    security: number;
    api: number;
    persistence: number;
    e2e: number;
    overall: number;
  };
  counts: {
    pass: number;
    fail: number;
    partial: number;
    notTested: number;
    p0: number;
    p1: number;
    p2: number;
    p3: number;
    discovered?: number;
    tested?: number;
    verifiedSkipped?: number;
  };
  findings: Array<{
    id?: string;
    severity: string;
    category: string;
    message: string;
    endpointId?: string;
  }>;
  stackTraces?: string[];
  invariantsResults?: Array<{ module: string; name: string; passed: boolean; message: string }>;
  // Optional trigger flags
  hasNewFinding?: boolean;
  hasRegression?: boolean;
  requiresRootCauseAnalysis?: boolean;
  adminRequested?: boolean;
  preferredProvider?: 'gemini' | 'grok' | 'auto';
  contextKey?: string;
  qaRunId?: string;
  forceExecute?: boolean;
}

export interface AIAnalystReport {
  executiveSummary: string;
  technicalSummary: string;
  criticalFindings: string[];
  rootCauseAnalysis: string;
  riskAssessment: string;
  recommendedFixes: string[];
  suggestedTests: string[];
  productionReadinessAssessment: string;
  aiVerdict: 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY';
  // Meta fields
  providerUsed?: 'gemini' | 'grok' | 'none' | 'cached';
  modelUsed?: string;
  cachedHit?: boolean;
  skippedReason?: string;
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd?: number;
}

export interface AIAnalysisContext {
  commitSha: string;
  branch: string;
  environment: string;
  qaRunId?: string;
  hasRegression?: boolean;
  forceExecute?: boolean;
  testResults: {
    metrics: AIAnalysisInput['metrics'];
    scores: AIAnalysisInput['scores'];
    counts: AIAnalysisInput['counts'];
    findings: AIAnalysisInput['findings'];
    invariantsResults?: AIAnalysisInput['invariantsResults'];
  };
  stackTraces?: string[];
  gitDiff?: string;
  changedFiles?: string[];
  dependencyContext?: Record<string, string>;
  previousQAResults?: {
    previousRunId?: string;
    previousScore?: number;
    previousVerdict?: string;
    regressions?: string[];
  };
  adminCopilotContext?: {
    prompt?: string;
    scope?: string;
    history?: Array<{ role: string; content: string }>;
  };
}

export interface AIProviderResponse {
  rawText: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
  latencyMs?: number;
}

export interface AIProvider {
  name: 'gemini' | 'grok' | 'groq' | string;
  modelName: string;
  isAvailable(): boolean;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  analyze(sanitizedPrompt: string, options?: { timeoutMs?: number }): Promise<AIProviderResponse>;
}

export interface ProviderStatus {
  name: string;
  modelName: string;
  available: boolean;
  enabled: boolean;
  failureCount: number;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
}

export interface SynthesisOptions {
  mode?: 'single' | 'synthesis' | 'auto' | 'council';
  timeoutMs?: number;
  maxRetries?: number;
  preferredProviders?: string[];
  forceExecute?: boolean;
  qaRunId?: string;
}

export interface SynthesisAIResult extends AIAnalystReport {
  aiCouncil?: AICouncilConsensus;
  multiProviderSynthesis?: {
    executedProviders: string[];
    providerReports: Record<string, {
      verdict: string;
      model: string;
      latencyMs: number;
      tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
      summary: string;
    }>;
    consensusVerdict: 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY';
  };
}

export interface AIStats {
  totalCalls: number;
  cacheHits: number;
  skipped: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd: number;
  lastCallAt: string | null;
  skippedReasons: Record<string, number>;
}

