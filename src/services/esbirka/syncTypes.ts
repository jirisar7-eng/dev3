import { ValidatedEsbirkaAct, NormalizedLegalAct } from './validationTypes';
import { SyncAuditStatus, LegalActStatus } from '@prisma/client';

export type SyncAuditStatusType = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'UNCHANGED' | 'FAILED' | 'SKIPPED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED';
export type ActChangeType = 'NEW' | 'CHANGED' | 'UNCHANGED';

/**
 * Options for executing an e-Sbírka legal act synchronization.
 */
export interface SyncExecutionOptions {
  /** Act code to synchronize, e.g. "89/2012", "359/1999", or undefined for all priority acts */
  actCode?: string;
  /** Act number, e.g. 89 */
  actNumber?: number;
  /** Act year, e.g. 2012 */
  actYear?: number;
  /** Source initiating the synchronization */
  initiatedBy?: string; // e.g. "ADMIN:userId", "CRON", "SYSTEM_BOOTSTRAP"
  /** Sync type classification */
  syncType?: 'AUTOMATIC_CRON' | 'ADMIN_MANUAL' | 'SYSTEM_BOOTSTRAP';
  /** Correlation ID for tracing across components */
  correlationId?: string;
  /** If provided, uses a custom / mock API client instead of the default client */
  apiClientOverride?: any;
}

/**
 * Result structure returned from a synchronization attempt.
 */
export interface SyncResult {
  syncId: string;
  actCode: string;
  status: SyncAuditStatusType;
  changeStatus?: ActChangeType;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsChanged: number;
  recordsUnchanged: number;
  contentHash?: string | null;
  etag?: string | null;
  quotaUsageIn24h: number;
  httpStatus?: number | null;
  error?: {
    code: string;
    message: string;
    safeDetails?: any;
    httpStatus?: number | null;
  } | null;
}

/**
 * Quota and rate limiting status snapshot.
 */
export interface QuotaStatus {
  usedToday: number;
  maxDailyCalls: number;
  targetDailyCalls: number;
  remainingCalls: number;
  isExceeded: boolean;
  minIntervalMs: number;
  lastCallAt: Date | null;
  lastCallStatus: string | null;
  lastCallEndpoint: string | null;
  currentUtcDate: string; // YYYY-MM-DD
  currentPragueDate: string; // YYYY-MM-DD
}

/**
 * Distributed lock representation.
 */
export interface LockInfo {
  lockName: string;
  ownerId: string;
  acquiredAt: Date;
  expiresAt: Date;
  isStale: boolean;
}

/**
 * Interface for change detection comparison.
 */
export interface ChangeDetectionResult {
  changeType: ActChangeType;
  isNew: boolean;
  isChanged: boolean;
  isUnchanged: boolean;
  previousHash: string | null;
  currentHash: string;
  summary: string;
  sectionsAdded: number;
  sectionsUpdated: number;
  sectionsRemoved: number;
}
