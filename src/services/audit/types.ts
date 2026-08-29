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
