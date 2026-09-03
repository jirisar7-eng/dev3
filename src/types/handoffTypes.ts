/**
 * Internal Bidirectional Handoff Types
 * Used strictly for internal context continuity between AI Studio and ChatGPT via Notion.
 * Not part of any public portal API or runtime database schema.
 */

export type HandoffSource = 'AI_STUDIO' | 'CHATGPT';
export type HandoffTarget = 'AI_STUDIO' | 'CHATGPT' | 'ALL';
export type HandoffProject = 'TATA_MA_PRAVO' | 'SYNTHESIS_HUB' | 'DEV3';
export type HandoffStatus = 'IN_PROGRESS' | 'HANDOFF_READY' | 'ACKNOWLEDGED' | 'COMPLETED' | 'BLOCKED';
export type HandoffEnvironment = 'AI_STUDIO_SANDBOX' | 'DEV3_VPS' | 'LOCAL' | 'PRODUCTION';
export type HandoffVerificationState = 'VERIFIED' | 'UNVERIFIED' | 'SIMULATED_FAILSAFE';
export type HandoffDatabaseSourceState = 'UNVERIFIED' | 'VERIFIED_POSTGRES' | 'IN_MEMORY_FALLBACK';
export type HandoffSeverity = 'P0' | 'P1' | 'P2' | 'P3';

export interface HandoffGitContext {
  repository: string;
  branch: string;
  commitSha: string;
  verifiedOnRemote: boolean;
}

export interface HandoffRiskItem {
  severity: HandoffSeverity;
  code?: string;
  description: string;
  remediation: string;
}

export interface InternalHandoffNote {
  handoffId: string;
  timestamp: string;
  source: HandoffSource;
  target: HandoffTarget;
  project: HandoffProject;
  topic: string;
  status: HandoffStatus;
  environment: HandoffEnvironment;
  verificationState: HandoffVerificationState;
  databaseSourceState: HandoffDatabaseSourceState;
  gitContext: HandoffGitContext;
  verifiedFacts: string[];
  implementedChanges: string[];
  decisionsMade: string[];
  assumptionsAndProposals: string[];
  risksAndBlockers: HandoffRiskItem[];
  dependencies: string[];
  nextConcreteAction: string;
  contentHash: string;
}

export interface HandoffValidationResult {
  valid: boolean;
  errors: string[];
}

export interface HandoffSecretScanResult {
  hasSecrets: boolean;
  detectedTypes: string[];
  details: string[];
}

export interface HandoffPushResult {
  success: boolean;
  status: 'SENT_TO_NOTION' | 'SKIPPED_IDEMPOTENT' | 'HANDOFF_NOT_SENT_LOCAL_ONLY' | 'FAILED_BLOCKED';
  handoffId: string;
  contentHash: string;
  message: string;
  pageUrl?: string;
  timestamp: string;
  sanitizedNote?: InternalHandoffNote;
}

export interface HandoffFetchResult {
  success: boolean;
  status: 'FETCHED' | 'NOT_CONFIGURED' | 'EMPTY' | 'FAILED';
  note: InternalHandoffNote | null;
  message: string;
  timestamp: string;
}
