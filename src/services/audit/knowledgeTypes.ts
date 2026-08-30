import { z } from 'zod';

export type KnowledgeType =
  | 'VERIFIED_FACT'
  | 'HUMAN_DECISION'
  | 'ARCHITECTURE_DECISION'
  | 'AUDIT_FINDING'
  | 'AI_RECOMMENDATION'
  | 'IMPLEMENTATION_RESULT'
  | 'TEST_RESULT'
  | 'TECHNICAL_DEBT'
  | 'SECURITY_RISK'
  | 'PROJECT_NOTE'
  | 'DRAFT_ACTION'
  | 'EXECUTED_ACTION'
  | 'VERIFICATION_EVIDENCE';

export type KnowledgeSource =
  | 'USER'
  | 'CHATGPT'
  | 'AI_STUDIO'
  | 'ORION'
  | 'SYSTEM';

export type KnowledgeProjectArea =
  | 'SECURITY'
  | 'AUDIT_CENTER'
  | 'ORION'
  | 'CONTROL_PLANE'
  | 'LEGAL'
  | 'CMS'
  | 'CORE'
  | 'INFRASTRUCTURE';

export type KnowledgeStatus =
  | 'ACTIVE'
  | 'VERIFIED'
  | 'RESOLVED'
  | 'DEPRECATED'
  | 'PENDING_APPROVAL';

export type KnowledgeSeverity = 'P0' | 'P1' | 'P2' | 'P3' | 'NONE';

export type KnowledgeRelationshipType =
  | 'RELATES_TO'
  | 'SUPERSEDES'
  | 'IMPLEMENTED_BY'
  | 'VERIFIED_BY'
  | 'BLOCKED_BY'
  | 'DERIVED_FROM';

export interface KnowledgeRelationship {
  targetId: string;
  type: KnowledgeRelationshipType;
  description?: string;
}

export interface KnowledgeRecord {
  id: string;
  title: string;
  type: KnowledgeType;
  projectArea: KnowledgeProjectArea;
  status: KnowledgeStatus;
  confidence: number; // 0.0 to 1.0
  verified: boolean;
  severity: KnowledgeSeverity;
  source: KnowledgeSource;
  sourceCommitSha?: string;
  sourceBranch?: string;
  relatedAuditPath?: string;
  timestamp: string;
  contentHash: string;
  summary: string;
  details?: string;
  relationships?: KnowledgeRelationship[];
  verificationEvidence?: string;
}

export interface KnowledgeMirrorDTO {
  recordId: string;
  title: string;
  type: KnowledgeType;
  projectArea: KnowledgeProjectArea;
  status: KnowledgeStatus;
  confidence: number;
  verified: boolean;
  severity: KnowledgeSeverity;
  source: KnowledgeSource;
  sourceCommitSha: string;
  sourceBranch: string;
  relatedAuditPath: string;
  timestamp: string;
  contentHash: string;
  sanitizedSummary: string;
}

export interface KnowledgeMirrorSyncResult {
  success: boolean;
  totalProcessed: number;
  syncedCount: number;
  skippedCount: number;
  failedCount: number;
  message: string;
  timestamp: string;
}

export const KnowledgeSyncOptionsSchema = z.object({
  scope: z.enum(['ALL', 'AUDITS', 'FINDINGS', 'ARCHITECTURAL_DECISIONS', 'ORION_TRACES', 'CONTROL_PLANE']).default('ALL'),
  forceResync: z.boolean().default(false),
});

export type KnowledgeSyncOptions = z.infer<typeof KnowledgeSyncOptionsSchema>;
