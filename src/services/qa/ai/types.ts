export interface AICouncilFinding {
  finding: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  rootCause: string;
  confidence: number;
  evidence: string;
  recommendation: string;
  suggestedTests: string[];
  qaFindingId?: string;
  evidenceBundle?: EvidenceBundle;
  evidenceScore?: number;
  consensusState?: 'CONFIRMED' | 'LIKELY' | 'INSUFFICIENT_EVIDENCE' | 'DISAGREEMENT' | 'RESOLVED';
  geminiVerdict?: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | string;
  geminiConfidence?: number;
  grokVerdict?: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | string;
  grokConfidence?: number;
  deterministicVerdict?: string;
}

export interface EvidenceBundle {
  findingId: string;
  findingMessage: string;
  findingCategory: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3' | string;
  qaRunId: string;
  commitSha: string;
  qaTestResult?: {
    passed: boolean;
    message?: string;
    details?: string;
  };
  apiRequestResponse?: {
    endpoint: string;
    method: string;
    sampleRequest?: string;
    sampleResponse?: string;
  };
  stackTrace?: string;
  sourceFiles?: Array<{
    filePath: string;
    content: string;
    hash: string;
  }>;
  gitCommitSha: string;
  gitDiff?: string;
  dependencyContext?: string[];
  dbState?: string;
  previousVerifiedResult?: {
    verifiedAt: string;
    verdict: string;
    commitSha: string;
    hash: string;
  };
  validationStatus: {
    exists: boolean;
    isFresh: boolean;
    relatesToCommit: boolean;
    hasSufficientEvidence: boolean;
    wasPreviouslyVerified: boolean;
    hasChangedSinceVerification: boolean;
    evidenceScore: number;
    insufficientEvidenceReason?: string;
  };
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
  evidenceBundles?: EvidenceBundle[];
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

export interface ProviderTelemetryStats {
  provider: string;
  model: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  fallbackCount: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  estimatedCostUsd: number | null;
  costStatus: 'ESTIMATED' | 'UNKNOWN';
  status: 'ACTIVE' | 'IDLE' | 'DEGRADED' | 'FALLBACK' | 'ERROR';
  lastCallAt: string | null;
  lastErrorMessage?: string | null;
}

export interface AICallRecord {
  provider: string;
  model: string;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  success: boolean;
  isTimeout: boolean;
  isFallback: boolean;
  timestamp: string;
  errorMsg?: string | null;
}

export interface ModelPricing {
  promptCostPerToken: number;
  completionCostPerToken: number;
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
  providers?: Record<string, ProviderTelemetryStats>;
  history?: AICallRecord[];
  activeOperation?: {
    isWorking: boolean;
    provider?: string;
    model?: string;
    startTime?: string;
    elapsedMs?: number;
    estimatedMs?: number | null;
  } | null;
}


