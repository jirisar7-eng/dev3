export type AuditStatusType = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'UNKNOWN';

export type TrustLevel = 'VERIFIED' | 'DERIVED' | 'UNKNOWN';

export type FindingSeverity = 'P0' | 'P1' | 'P2' | 'P3';

export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'VERIFIED' | 'ACCEPTED_RISK';

export type RegressionChangeType = 'NEW' | 'PERSISTENT' | 'RESOLVED' | 'REGRESSION' | 'SEVERITY_DRIFT';

export type AuditCategory =
  | 'SECURITY'
  | 'ARCHITECTURE'
  | 'MIGRATION'
  | 'RELEASE_GATE'
  | 'QA_REGRESSION'
  | 'DATA_INTEGRITY'
  | 'GENERAL';

export interface AuditFinding {
  id: string;
  auditId: string;
  code: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  status: FindingStatus;
  firstDetectedAt: string;
  lastSeenAt: string;
  isDerivedCode?: boolean;
  actionId?: string;
  fixCommitSha?: string;
  prNumber?: number;
  testReference?: string;
  verifiedBy?: string;
  verificationEvidence?: string;
}

export interface AuditRecord {
  id: string;
  filename: string;
  title: string;
  type: AuditCategory;
  phase?: string;
  date: string;
  scope: string[];
  status: AuditStatusType;
  metrics: {
    p0Count: number;
    p1Count: number;
    p2Count: number;
    p3Count: number;
    testsTotal: number;
    testsPassed: number;
    testsFailed: number;
  };
  source: string;
  commitSha?: string;
  branch?: string;
  prNumber?: number;
  testEvidence?: {
    total?: number;
    passed?: number;
    failed?: number;
    summary?: string;
    evidenceText?: string;
  };
  deploymentEvidence?: {
    environment?: string;
    url?: string;
    deployedAt?: string;
  };
  verification?: {
    verifiedAt?: string;
    verifiedBy?: string;
    summary?: string;
  };
  sourceSha: string;
  trustLevel: TrustLevel;
  findings: AuditFinding[];
  rawContent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegressionFinding {
  findingId: string;
  code: string;
  title: string;
  previousSeverity?: FindingSeverity;
  currentSeverity: FindingSeverity;
  previousStatus?: FindingStatus;
  currentStatus: FindingStatus;
  changeType: RegressionChangeType;
  previousAuditId?: string;
  currentAuditId: string;
  explanation: string;
}

export interface ParserWarning {
  filename: string;
  message: string;
  code: string;
  timestamp: string;
}

export interface AuditRegistrySummary {
  totalAudits: number;
  totalFindings: number;
  statusBreakdown: {
    pass: number;
    passWithWarnings: number;
    fail: number;
    unknown: number;
  };
  severityCounts: {
    p0: number;
    p1: number;
    p2: number;
    p3: number;
  };
  trustBreakdown: {
    verified: number;
    derived: number;
    unknown: number;
  };
  latestAuditDate?: string;
  parserWarningsCount: number;
}

export type EvidenceState = 'VERIFIED' | 'FAILED' | 'UNKNOWN';

export type ReleaseGateVerdict = 'READY_TO_MERGE' | 'DO_NOT_MERGE' | 'UNKNOWN';

export type ProjectHealthStatus = 'VERIFIED' | 'UNKNOWN' | 'FAILED';

export interface ReleaseGateBlocker {
  code: string;
  message: string;
  severity: FindingSeverity | 'BLOCKER';
  component: string;
  referenceId?: string;
}

export interface RuntimeEvidence {
  tscStatus: EvidenceState;
  testSuiteStatus: EvidenceState;
  buildStatus: EvidenceState;
  migrationStatus: EvidenceState;
  phase1TestsStatus?: EvidenceState;
  tscOutput?: string;
  testSummary?: string;
  buildOutput?: string;
  migrationDetails?: string;
  timestamp?: string;
}

export interface PillarHealth {
  status: ProjectHealthStatus;
  message: string;
  details?: Record<string, any>;
}

export interface ProjectHealthPillars {
  databaseAndMigrations: PillarHealth;
  securityAndRbac: PillarHealth;
  controlPlane: PillarHealth;
  testSuiteAndBuild: PillarHealth;
  aiSubsystem: PillarHealth;
}

export interface ReleaseGateEvaluationResult {
  verdict: ReleaseGateVerdict;
  isMergeable: boolean;
  evaluatedAt: string;
  blockers: ReleaseGateBlocker[];
  warnings: string[];
  evidence: RuntimeEvidence;
  health: ProjectHealthPillars;
  summary: {
    openP0: number;
    openP1: number;
    openP2: number;
    openP3: number;
    criticalRegressions: number;
    activeControlPlaneActions: number;
    totalAudits: number;
    latestAuditDate?: string;
    latestAuditStatus?: AuditStatusType;
  };
}

export type OrionTrustLevel = 'AI_RECOMMENDATION';

export interface OrionFindingAnalysis {
  code: string;
  title: string;
  severity: FindingSeverity;
  status?: FindingStatus;
  riskEvaluation: string;
  recommendedRemediation: string;
}

export interface OrionSuggestedDraftAction {
  title: string;
  intent: string;
  targetResource: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'P0' | 'P1' | 'P2' | 'P3';
  requiresHumanApproval: true;
}

export interface OrionAnalysisRequest {
  scope?: 'REGISTRY' | 'FINDING' | 'REGRESSION' | 'HEALTH' | 'GENERAL';
  targetCode?: string;
  userQuery?: string;
  contextLimit?: number;
}

export interface OrionAnalysisResponse {
  agentId: 'agent-orion-qa-v1';
  role: 'AI_SECURITY_ANALYST';
  trustLevel: OrionTrustLevel;
  timestamp: string;
  summary: string;
  findingsAnalysis: OrionFindingAnalysis[];
  regressionAnalysis?: string;
  safetyWarnings: string[];
  suggestedDraftActions: OrionSuggestedDraftAction[];
  metadata: {
    model: string;
    latencyMs: number;
    effectiveCapabilities: string[];
    tokenUsage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

export interface OrionProposeActionRequest {
  title: string;
  intent: string;
  payload?: any;
  targetResource?: string;
  findingReference?: string;
}

export interface OrionProposeActionResponse {
  agentId: 'agent-orion-qa-v1';
  trustLevel: OrionTrustLevel;
  actionId: string;
  status: 'DRAFT' | 'PLAN_CREATED';
  message: string;
  requiresHumanApproval: true;
  requiredApprovalLevel: string;
  action: any;
}

