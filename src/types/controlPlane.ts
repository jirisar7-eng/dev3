export type ControlPlaneCapability = 
  | "content.read" 
  | "content.write" 
  | "cms.write"
  | "settings.read" 
  | "settings.write" 
  | "users.read" 
  | "users.write" 
  | "qa.run" 
  | "audit.run" 
  | "github.read" 
  | "github.branch.create" 
  | "github.commit"
  | "github.push.feature"
  | "github.pr.create" 
  | "database.read" 
  | "database.migrate" 
  | "vps.read" 
  | "vps.write" 
  | "deploy.production" 
  | "security.policy.write"
  | "project.manage"
  | "moderation.read"
  | "moderation.write";

export type ControlPlaneRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'P0' | 'P1' | 'P2' | 'P3';
export type OldRiskLevel = 'P0' | 'P1' | 'P2' | 'P3'; 

export type ControlPlaneApprovalLevel = 'READ_ONLY' | 'SAFE_MUTATION' | 'SENSITIVE_MUTATION' | 'CRITICAL_MUTATION';

export type ControlPlaneStatus = 
  | 'DRAFT'
  | 'DISCOVERY'
  | 'PLANNED'
  | 'PLAN_CREATED' // Compatibility
  | 'SNAPSHOTTED'
  | 'WAITING_APPROVAL'
  | 'AWAITING_APPROVAL' // Compatibility
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'COMPLETED' // Missed this one
  | 'BRANCH_CREATED'
  | 'COMMITTED'
  | 'PUSHED'
  | 'PR_CREATED'
  | 'CI_RUNNING'
  | 'CI_FAILED'
  | 'QA_RUNNING'
  | 'QA_FAILED'
  | 'AI_REVIEW'
  | 'WAITING_MERGE_APPROVAL'
  | 'MERGED'
  | 'DEPLOYING'
  | 'DEPLOYED'
  | 'MONITORING'
  | 'ROLLBACK_WINDOW'
  | 'ROLLBACK_IN_PROGRESS' // Compatibility
  | 'FINALIZED'
  | 'ROLLED_BACK'
  | 'FAILED'
  | 'BLOCKED';

export type ControlPlaneOperationId = 
  | 'CONTENT_READ'
  | 'CONTENT_UPDATE'
  | 'CMS_PAGE_CREATE'
  | 'CMS_PAGE_UPDATE'
  | 'CMS_PAGE_DELETE'
  | 'CONFIG_READ'
  | 'CONFIG_UPDATE'
  | 'FEATURE_ENABLE'
  | 'FEATURE_DISABLE'
  | 'QA_RUN'
  | 'AUDIT_RUN'
  | 'TICKET_CREATE'
  | 'TICKET_UPDATE'
  | 'GIT_BRANCH_CREATE'
  | 'GIT_COMMIT'
  | 'GIT_PUSH_FEATURE'
  | 'GITHUB_PR_CREATE'
  | 'GITHUB_PR_READ'
  | 'CI_READ'
  | 'AI_ANALYSIS'
  | 'AI_REVIEW'
  | 'VPS_READ'
  | 'DEPLOY'
  | 'ROLLBACK'
  | 'MERGE_MAIN';

export interface ControlPlaneOperationDef {
  id: ControlPlaneOperationId;
  description: string;
  requiredCapability: ControlPlaneCapability;
  riskLevel: ControlPlaneRiskLevel;
  requiresSnapshot: boolean;
  requiresApproval: boolean;
  reversible: boolean;
  allowedStates: ControlPlaneStatus[];
  auditEvent: string;
  forbiddenTargets: string[];
}

export interface ControlPlaneAction {
  id: string;
  actorId: string;
  actorRole: string;
  request: string;
  intent: string;
  operationId?: ControlPlaneOperationId;
  affectedResources: string[];
  riskLevel: ControlPlaneRiskLevel;
  approvalLevel: ControlPlaneApprovalLevel;
  
  currentState: any;
  proposedState: any;
  originalState: any; // For snapshotting
  
  backupReference?: string;
  changeReference?: string; // e.g., branch name, PR number
  branch?: string;
  commitSha?: string;
  prNumber?: number;
  
  createdAt: Date;
  expiresAt: Date;
  version?: number; // For the 48h limit
  
  status: ControlPlaneStatus;
  
  // Execution trace
  logs: ControlPlaneLog[];
}

export interface ControlPlaneLog {
  timestamp: Date;
  event: string;
  details: string;
}

export interface DryRunResult {
  plan: any;
  affectedResources: string[];
  riskLevel: ControlPlaneRiskLevel;
  requiredApproval: ControlPlaneApprovalLevel;
  requiredPermissions: string[];
  backupPlan: string;
  rollbackPlan: string;
  willMutate: boolean;
}

export type ControlPlaneFindingSource = 'QA' | 'AUDIT' | 'TEST' | 'USER' | 'SECURITY' | 'VPS' | 'DATABASE' | 'GITHUB' | 'MONITORING';

export interface ControlPlaneFinding {
  findingId: string;
  source: ControlPlaneFindingSource;
  sourceReference: string;
  title: string;
  description: string;
  severity: ControlPlaneRiskLevel; 
  confidence: number; // 0.0 - 1.0
  affectedResources: string[];
  affectedFiles: string[];
  affectedRoutes: string[];
  affectedServices: string[];
  affectedDatabaseModels: string[];
  securityImpact: string;
  userImpact: string;
  productionImpact: string;
  regressionRisk: string;
  reproducibility: string;
  detectedAt: Date;
  status: 'DETECTED' | 'ANALYZING' | 'CONFIRMED' | 'PLANNED' | 'IN_PROGRESS' | 'PR_CREATED' | 'QA' | 'RESOLVED' | 'REJECTED' | 'FALSE_POSITIVE' | 'WONT_FIX' | 'BLOCKED';
  linkedTicketId?: string;
  linkedActionId?: string;
  dedupHash: string; // fingerprint
  priorityScore?: number; // Calculated project priority score
  priorityReason?: string;
}

export interface RiskAnalysisResult {
  severity: ControlPlaneRiskLevel;
  confidence: number;
  reason: string;
  recommendsHumanReview: boolean;
  priorityScore: number;
  priorityReason: string;
}

export interface ControlPlaneSnapshot {
  snapshotId: string;
  actionId: string;
  actorId: string;
  operation: string;
  target: string;
  createdAt: Date;
  expiresAt: Date;
  version?: number;
  beforeStateHash: string;
  state: any;
  approvalRequired: boolean;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
}
