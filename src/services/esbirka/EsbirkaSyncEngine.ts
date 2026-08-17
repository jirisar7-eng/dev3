import crypto from 'crypto';
import { EsbirkaLockGuard } from './EsbirkaLockGuard';
import { EsbirkaQuotaGuard, QuotaSlotReservation } from './EsbirkaQuotaGuard';
import { EsbirkaValidator } from './EsbirkaValidator';
import { EsbirkaNormalizer } from './EsbirkaNormalizer';
import { EsbirkaChangeDetector } from './EsbirkaChangeDetector';
import { EsbirkaLegalRepository } from './EsbirkaLegalRepository';
import { EsbirkaApiClient } from './EsbirkaApiClient';
import { EsbirkaApiError, isEsbirkaApiError } from './errors';
import { SyncExecutionOptions, SyncResult, QuotaStatus, LockInfo } from './syncTypes';

export interface PriorityActTarget {
  cislo: number;
  rok: number;
  actCode: string;
  title: string;
}

/**
 * Priority acts required for the "Táta má právo" legal repository.
 */
export const PRIORITY_LEGAL_ACTS: PriorityActTarget[] = [
  { cislo: 89, rok: 2012, actCode: '89/2012', title: 'Zákon č. 89/2012 Sb., občanský zákoník' },
  { cislo: 359, rok: 1999, actCode: '359/1999', title: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí' },
  { cislo: 99, rok: 1963, actCode: '99/1963', title: 'Zákon č. 99/1963 Sb., občanský soudní řád' },
  { cislo: 292, rok: 2013, actCode: '292/2013', title: 'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních' },
];

/**
 * Enterprise Orchestrator & Synchronization Engine for e-Sbírka / e-Legislativa.
 * 
 * Pipeline:
 * 1. Mutual Exclusion (EsbirkaLockGuard - Max 1 concurrent execution)
 * 2. Strict Quota Enforcement (EsbirkaQuotaGuard - Max 5 req/day, Min 1000ms interval)
 * 3. Safe Transport (EsbirkaApiClient / Mock Transport, 0 secrets in logs)
 * 4. Fail-Closed Validation (EsbirkaValidator - 0 DB write on invalid payload)
 * 5. Deterministic Normalization (EsbirkaNormalizer - SHA-256 hash & canonical order)
 * 6. Change Detection (EsbirkaChangeDetector - NEW vs CHANGED vs UNCHANGED)
 * 7. Transactional Persistence (EsbirkaLegalRepository - Atomic Prisma $transaction)
 * 8. Comprehensive Audit (LegalSyncAudit & EsbirkaQuotaAudit)
 */
export class EsbirkaSyncEngine {
  /**
   * Synchronizes a single legal act by act code or act number/year.
   */
  public static async syncAct(options: SyncExecutionOptions): Promise<SyncResult> {
    const syncId = options.correlationId || crypto.randomUUID();
    const startedAt = new Date();
    const initiatedBy = options.initiatedBy || 'ADMIN_MANUAL';
    const syncType = options.syncType || 'ADMIN_MANUAL';

    // 1. Resolve actCode, actNumber, actYear
    let actCode = options.actCode;
    let actNumber = options.actNumber;
    let actYear = options.actYear;

    if (!actCode && actNumber && actYear) {
      actCode = `${actNumber}/${actYear}`;
    } else if (actCode && (!actNumber || !actYear)) {
      const parts = actCode.split('/');
      if (parts.length === 2) {
        actNumber = parseInt(parts[0], 10);
        actYear = parseInt(parts[1], 10);
      }
    }

    if (!actCode || !actNumber || !actYear || isNaN(actNumber) || isNaN(actYear)) {
      const errorMsg = `Invalid act specification: actCode='${actCode}', actNumber='${actNumber}', actYear='${actYear}'.`;
      await EsbirkaLegalRepository.recordSyncAudit({
        syncId,
        actCode: actCode || 'UNKNOWN',
        syncType,
        status: 'FAILED',
        startedAt,
        finishedAt: new Date(),
        durationMs: 0,
        errorMessage: errorMsg,
        initiatedBy,
      });

      return {
        syncId,
        actCode: actCode || 'UNKNOWN',
        status: 'FAILED',
        startedAt,
        finishedAt: new Date(),
        durationMs: 0,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsChanged: 0,
        recordsUnchanged: 0,
        quotaUsageIn24h: 0,
        error: { code: 'INVALID_ACT_SPECIFICATION', message: errorMsg },
      };
    }

    let lockAcquired = false;
    let quotaSlot: QuotaSlotReservation | null = null;
    const endpoint = `/dokumenty-sbirky/%2Fsb%2F${actYear}%2F${actNumber}`;

    try {
      // 2. CONCURRENCY GUARD: Acquire distributed lock
      try {
        await EsbirkaLockGuard.acquireLock(EsbirkaLockGuard.DEFAULT_LOCK_NAME, syncId);
        lockAcquired = true;
      } catch (lockErr: any) {
        const durationMs = Date.now() - startedAt.getTime();
        await EsbirkaLegalRepository.recordSyncAudit({
          syncId,
          actCode,
          syncType,
          status: 'SKIPPED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          errorMessage: lockErr?.message || 'Lock acquisition failed (concurrent execution)',
          initiatedBy,
        });

        return {
          syncId,
          actCode,
          status: 'SKIPPED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsChanged: 0,
          recordsUnchanged: 0,
          quotaUsageIn24h: 0,
          error: {
            code: 'SYNC_ALREADY_RUNNING',
            message: lockErr?.message || 'Sync already in progress.',
            safeDetails: lockErr?.safeDetails,
          },
        };
      }

      // Record initial RUNNING audit
      await EsbirkaLegalRepository.recordSyncAudit({
        syncId,
        actCode,
        syncType,
        status: 'RUNNING',
        startedAt,
        initiatedBy,
      });

      // 3. QUOTA & RATE GUARD: Reserve atomic quota slot
      try {
        quotaSlot = await EsbirkaQuotaGuard.reserveSlot(endpoint, actCode, syncId, 'GET_ACT');
      } catch (quotaErr: any) {
        const durationMs = Date.now() - startedAt.getTime();
        const errCode = quotaErr?.code || 'QUOTA_EXCEEDED';
        const finalStatus = errCode === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'QUOTA_EXCEEDED';

        await EsbirkaLegalRepository.recordSyncAudit({
          syncId,
          actCode,
          syncType,
          status: finalStatus,
          startedAt,
          finishedAt: new Date(),
          durationMs,
          errorMessage: quotaErr?.message || 'Quota or rate limit exceeded',
          initiatedBy,
        });

        return {
          syncId,
          actCode,
          status: finalStatus,
          startedAt,
          finishedAt: new Date(),
          durationMs,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsChanged: 0,
          recordsUnchanged: 0,
          quotaUsageIn24h: quotaErr?.safeDetails?.usedToday || EsbirkaQuotaGuard.MAX_API_CALLS_PER_DAY,
          error: {
            code: errCode,
            message: quotaErr?.message || 'Quota guard violation',
            safeDetails: quotaErr?.safeDetails,
          },
        };
      }

      // 4. TRANSPORT LAYER: Fetch raw act data (Mock transport in tests/preview, EsbirkaApiClient in production)
      let rawApiResponse: any;
      let httpStatus = 200;
      let etag: string | null = null;
      const fetchStartMs = Date.now();

      try {
        if (options.apiClientOverride) {
          // Custom/mock client passed (e.g. during test suites)
          rawApiResponse = await options.apiClientOverride.fetchAct(actNumber, actYear);
          if (rawApiResponse?.etag) etag = rawApiResponse.etag;
          if (rawApiResponse?.httpStatus) httpStatus = rawApiResponse.httpStatus;
        } else {
          // Default client with safety checks
          const client = new EsbirkaApiClient({
            timeoutMs: 20000,
          });
          const fetched = await client.getAct(actNumber, actYear);
          rawApiResponse = fetched.data;
          httpStatus = fetched.status;
          etag = fetched.etag || null;
        }
      } catch (apiErr: any) {
        const fetchDuration = Date.now() - fetchStartMs;
        const status = apiErr?.httpStatus || (apiErr?.code === 'UNAUTHORIZED' ? 401 : apiErr?.code === 'FORBIDDEN' ? 403 : apiErr?.code === 'RATE_LIMITED' ? 429 : 500);

        // Update quota audit record with error
        await EsbirkaQuotaGuard.recordCallResult(
          quotaSlot.auditId,
          status,
          'ERROR',
          null,
          fetchDuration
        );

        const durationMs = Date.now() - startedAt.getTime();
        const safeErrorMsg = this.sanitizeErrorMessage(apiErr?.message || 'API request failed');

        await EsbirkaLegalRepository.recordSyncAudit({
          syncId,
          actCode,
          syncType,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          httpStatus: status,
          errorMessage: safeErrorMsg,
          initiatedBy,
          quotaUsageIn24h: quotaSlot.dayCount,
          errorsCount: 1,
        });

        return {
          syncId,
          actCode,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsChanged: 0,
          recordsUnchanged: 0,
          httpStatus: status,
          quotaUsageIn24h: quotaSlot.dayCount,
          error: {
            code: apiErr?.code || 'API_FETCH_FAILED',
            message: safeErrorMsg,
            httpStatus: status,
          },
        };
      }

      const fetchDuration = Date.now() - fetchStartMs;

      // 5. VALIDATOR: Fail-Closed validation
      const validationResult = EsbirkaValidator.validateAct(rawApiResponse);

      if (!validationResult.isValid) {
        await EsbirkaQuotaGuard.recordCallResult(
          quotaSlot.auditId,
          httpStatus,
          'ERROR',
          null,
          fetchDuration
        );

        const durationMs = Date.now() - startedAt.getTime();
        const validationErrors = (validationResult as { isValid: false; errors: any[] }).errors || [];
        const errorMessages = validationErrors.map((e: any) => `${e.path}: ${e.message}`).join('; ');
        const errorSummary = `Validation failed: ${errorMessages}`;

        await EsbirkaLegalRepository.recordSyncAudit({
          syncId,
          actCode,
          syncType,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          httpStatus,
          errorMessage: errorSummary,
          initiatedBy,
          quotaUsageIn24h: quotaSlot.dayCount,
          errorsCount: validationErrors.length,
        });

        return {
          syncId,
          actCode,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsChanged: 0,
          recordsUnchanged: 0,
          httpStatus,
          quotaUsageIn24h: quotaSlot.dayCount,
          error: {
            code: 'VALIDATION_FAILED',
            message: errorSummary,
            safeDetails: validationErrors,
          },
        };
      }

      // 6. NORMALIZER: Canonical hashing and deterministic formatting
      let normalizedAct;
      try {
        normalizedAct = EsbirkaNormalizer.normalizeAct(validationResult.data);
      } catch (normErr: any) {
        await EsbirkaQuotaGuard.recordCallResult(
          quotaSlot.auditId,
          httpStatus,
          'ERROR',
          null,
          fetchDuration
        );

        const durationMs = Date.now() - startedAt.getTime();
        const normErrorMsg = `Normalization failed: ${normErr?.message || 'Unknown error'}`;

        await EsbirkaLegalRepository.recordSyncAudit({
          syncId,
          actCode,
          syncType,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          httpStatus,
          errorMessage: normErrorMsg,
          initiatedBy,
          quotaUsageIn24h: quotaSlot.dayCount,
          errorsCount: 1,
        });

        return {
          syncId,
          actCode,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsChanged: 0,
          recordsUnchanged: 0,
          httpStatus,
          quotaUsageIn24h: quotaSlot.dayCount,
          error: {
            code: 'NORMALIZATION_FAILED',
            message: normErrorMsg,
          },
        };
      }

      // 7. CHANGE DETECTOR: Compare with local database
      const existingActSnapshot = await EsbirkaLegalRepository.findActByCode(actCode);
      const changeResult = EsbirkaChangeDetector.detectChange(normalizedAct, existingActSnapshot);

      // 8. DATABASE TRANSACTION: Atomic persistence
      let persistedRecord;
      try {
        persistedRecord = await EsbirkaLegalRepository.persistNormalizedAct(
          normalizedAct,
          changeResult.changeType,
          etag,
          syncId
        );
      } catch (txErr: any) {
        await EsbirkaQuotaGuard.recordCallResult(
          quotaSlot.auditId,
          httpStatus,
          'ERROR',
          normalizedAct.contentHash,
          fetchDuration
        );

        const durationMs = Date.now() - startedAt.getTime();
        const txErrorMsg = `DB Transaction failed: ${txErr?.message || 'Unknown error'}`;

        await EsbirkaLegalRepository.recordSyncAudit({
          syncId,
          actCode,
          syncType,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          httpStatus,
          errorMessage: txErrorMsg,
          initiatedBy,
          quotaUsageIn24h: quotaSlot.dayCount,
          errorsCount: 1,
        });

        return {
          syncId,
          actCode,
          status: 'FAILED',
          startedAt,
          finishedAt: new Date(),
          durationMs,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsChanged: 0,
          recordsUnchanged: 0,
          httpStatus,
          quotaUsageIn24h: quotaSlot.dayCount,
          error: {
            code: 'TRANSACTION_FAILED',
            message: txErrorMsg,
          },
        };
      }

      // 9. UPDATE AUDITS & QUOTA SUCCESS
      const totalDurationMs = Date.now() - startedAt.getTime();
      const quotaResultStatus = changeResult.isUnchanged ? 'NOT_MODIFIED' : 'SUCCESS';

      await EsbirkaQuotaGuard.recordCallResult(
        quotaSlot.auditId,
        httpStatus,
        quotaResultStatus,
        normalizedAct.contentHash,
        fetchDuration
      );

      const recordsCreated = changeResult.isNew ? normalizedAct.sections.length : changeResult.sectionsAdded;
      const recordsChanged = changeResult.sectionsUpdated;
      const recordsUnchanged = changeResult.isUnchanged ? normalizedAct.sections.length : 0;
      const syncAuditStatus = changeResult.isUnchanged ? 'UNCHANGED' : 'SUCCESS';

      await EsbirkaLegalRepository.recordSyncAudit({
        syncId,
        actCode,
        legalActId: persistedRecord?.id || null,
        syncType,
        status: syncAuditStatus,
        startedAt,
        finishedAt: new Date(),
        durationMs: totalDurationMs,
        httpStatus,
        recordsReceived: normalizedAct.sections.length,
        recordsNew: recordsCreated,
        recordsChanged,
        recordsUnchanged,
        errorsCount: 0,
        responseHash: normalizedAct.contentHash,
        initiatedBy,
        quotaUsageIn24h: quotaSlot.dayCount,
      });

      return {
        syncId,
        actCode,
        status: syncAuditStatus,
        changeStatus: changeResult.changeType,
        startedAt,
        finishedAt: new Date(),
        durationMs: totalDurationMs,
        recordsProcessed: normalizedAct.sections.length,
        recordsCreated,
        recordsChanged,
        recordsUnchanged,
        contentHash: normalizedAct.contentHash,
        etag,
        quotaUsageIn24h: quotaSlot.dayCount,
        httpStatus,
        error: null,
      };
    } finally {
      // Guaranteed lock release
      if (lockAcquired) {
        await EsbirkaLockGuard.releaseLock(EsbirkaLockGuard.DEFAULT_LOCK_NAME, syncId);
      }
    }
  }

  /**
   * Synchronizes all priority legal acts sequentially (never in parallel).
   */
  public static async syncAllPriorityActs(
    options: Partial<SyncExecutionOptions> = {}
  ): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    for (const target of PRIORITY_LEGAL_ACTS) {
      // Check quota before initiating next act
      const quotaStatus = await EsbirkaQuotaGuard.getQuotaStatus();
      if (quotaStatus.isExceeded) {
        console.warn(`[EsbirkaSyncEngine] Daily quota reached (${quotaStatus.usedToday}/${quotaStatus.maxDailyCalls}). Halting priority sync loop.`);
        break;
      }

      const res = await this.syncAct({
        actCode: target.actCode,
        actNumber: target.cislo,
        actYear: target.rok,
        initiatedBy: options.initiatedBy || 'SYSTEM_PRIORITY_BATCH',
        syncType: options.syncType || 'AUTOMATIC_CRON',
        apiClientOverride: options.apiClientOverride,
      });

      results.push(res);

      if (res.status === 'QUOTA_EXCEEDED') {
        break;
      }
    }

    return results;
  }

  /**
   * Returns current sync engine status (lock status, quota status, day boundaries).
   */
  public static async getEngineStatus(): Promise<{
    lock: LockInfo | null;
    quota: QuotaStatus;
  }> {
    const lock = EsbirkaLockGuard.getLockInfo();
    const quota = await EsbirkaQuotaGuard.getQuotaStatus();
    return { lock, quota };
  }

  /**
   * Redacts sensitive tokens or headers from error messages.
   */
  private static sanitizeErrorMessage(msg: string): string {
    if (!msg) return '';
    return msg
      .replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED]')
      .replace(/key=[A-Za-z0-9-_.]+/gi, 'key=[REDACTED]')
      .replace(/api[-_]?key[:=]\s*['"]?[A-Za-z0-9-_.]+['"]?/gi, 'apiKey=[REDACTED]');
  }
}
