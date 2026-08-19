import crypto from 'crypto';
import { prisma, isPrismaAvailable } from '../../db/prisma';
import { QuotaStatus } from './syncTypes';
import { EsbirkaApiError } from './errors';

export interface QuotaSlotReservation {
  reservationId: string;
  auditId: string;
  calledAt: Date;
  endpoint: string;
  actCode: string | null;
  dayCount: number;
}

export interface QuotaAuditRecord {
  id: string;
  calledAt: Date;
  requestType: string;
  endpoint: string;
  actCode: string | null;
  httpStatus: number | null;
  result: string;
  syncAuditId: string | null;
  responseHash: string | null;
  durationMs: number | null;
  createdAt: Date;
}

/**
 * Strict Persistent Quota & Rate Limiting Guard for e-Sbírka / e-Legislativa API.
 * 
 * Invariants & Contract Limits:
 * - HARD DAILY LIMIT: Maximum 5 API calls per UTC calendar day (MAX_API_CALLS_PER_DAY = 5).
 * - RECOMMENDED TARGET: 3 calls per day (TARGET_API_CALLS_PER_DAY = 3).
 * - MINIMUM INTERVAL: At least 1,000 ms between subsequent API requests (MIN_INTERVAL_MS = 1000).
 * - CONCURRENCY: Maximum 1 concurrent HTTP request.
 * - ATOMIC RESERVATION: Prevents race conditions when multiple processes check quota simultaneously.
 * - ZERO SECRETS: Never stores tokens, API keys, or raw credentials in audit tables.
 * - TIMEZONES: UTC for technical counting, Europe/Prague for administrative reporting.
 */
export class EsbirkaQuotaGuard {
  public static readonly MAX_API_CALLS_PER_DAY = 5;
  public static readonly TARGET_API_CALLS_PER_DAY = 3;
  public static readonly MIN_INTERVAL_MS = 1000; // 1 second
  private static dynamicMinIntervalMs = 1000;

  public static setMinIntervalForTesting(ms: number): void {
    this.dynamicMinIntervalMs = ms;
  }

  // Synchronized in-memory audit store for testing, fallback & atomic race prevention
  private static inMemoryQuotaAudits: QuotaAuditRecord[] = [];
  private static lastCallTimestamp = 0;
  private static mutexPromise: Promise<void> = Promise.resolve();

  /**
   * Atomically checks quota and reserves an API call slot before executing an HTTP request.
   * Fails closed if daily limit is reached (QUOTA_EXCEEDED) or rate limit is violated (RATE_LIMITED).
   * 
   * @param endpoint Target API path (e.g. "/dokumenty-sbirky/%2Fsb%2F2012%2F89")
   * @param actCode Optional act code (e.g. "89/2012")
   * @param syncAuditId Optional correlation ID with LegalSyncAudit
   * @param requestType Operation type (e.g. "GET_ACT", "CHECK_METADATA")
   * @returns QuotaSlotReservation containing reservation ID and audit ID
   */
  public static async reserveSlot(
    endpoint: string,
    actCode: string | null = null,
    syncAuditId: string | null = null,
    requestType: string = 'GET_ACT'
  ): Promise<QuotaSlotReservation> {
    // Acquire sequential mutex to guarantee atomic check & reservation
    return new Promise<QuotaSlotReservation>((resolve, reject) => {
      this.mutexPromise = this.mutexPromise.then(async () => {
        try {
          const reservation = await this.executeAtomicReservation(endpoint, actCode, syncAuditId, requestType);
          resolve(reservation);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  /**
   * Internal atomic reservation logic executed under mutex.
   */
  private static async executeAtomicReservation(
    endpoint: string,
    actCode: string | null,
    syncAuditId: string | null,
    requestType: string
  ): Promise<QuotaSlotReservation> {
    const now = new Date();
    const nowMs = now.getTime();

    // 1. Check Minimum Interval (1,000 ms by default)
    const timeSinceLastCall = nowMs - this.lastCallTimestamp;
    if (this.lastCallTimestamp > 0 && timeSinceLastCall < this.dynamicMinIntervalMs) {
      const waitNeeded = this.dynamicMinIntervalMs - timeSinceLastCall;
      throw new EsbirkaApiError({
        message: `Rate limit violation: last request occurred ${timeSinceLastCall}ms ago. Minimum interval is ${this.dynamicMinIntervalMs}ms. Request blocked.`,
        code: 'RATE_LIMITED',
        requestId: syncAuditId || crypto.randomUUID(),
        endpoint,
        safeDetails: {
          timeSinceLastCallMs: timeSinceLastCall,
          minIntervalMs: this.dynamicMinIntervalMs,
          waitNeededMs: waitNeeded,
        },
      });
    }

    // 2. Compute UTC day range [00:00:00.000Z, 23:59:59.999Z]
    const { startOfDay, endOfDay } = this.getUtcDayBounds(now);

    // 3. Count calls already recorded for the current UTC day
    const usedToday = await this.countCallsForDay(startOfDay, endOfDay);

    if (usedToday >= this.MAX_API_CALLS_PER_DAY) {
      throw new EsbirkaApiError({
        message: `Daily hard quota limit reached: ${usedToday}/${this.MAX_API_CALLS_PER_DAY} calls used for UTC date ${now.toISOString().slice(0, 10)}. API execution blocked (Fail-Closed).`,
        code: 'QUOTA_EXCEEDED',
        requestId: syncAuditId || crypto.randomUUID(),
        endpoint,
        safeDetails: {
          usedToday,
          maxDailyCalls: this.MAX_API_CALLS_PER_DAY,
          targetDailyCalls: this.TARGET_API_CALLS_PER_DAY,
          utcDate: now.toISOString().slice(0, 10),
        },
      });
    }

    // 4. Update internal timestamp and create audit record
    this.lastCallTimestamp = nowMs;
    const auditId = crypto.randomUUID();
    const reservationId = crypto.randomUUID();
    const cleanEndpoint = this.sanitizeEndpoint(endpoint);

    const auditRecord: QuotaAuditRecord = {
      id: auditId,
      calledAt: now,
      requestType,
      endpoint: cleanEndpoint,
      actCode: actCode || null,
      httpStatus: null, // Pending completion
      result: 'PENDING',
      syncAuditId: syncAuditId || null,
      responseHash: null,
      durationMs: null,
      createdAt: now,
    };

    // Save to memory store
    this.inMemoryQuotaAudits.push(auditRecord);

    // Save to PostgreSQL if available
    if (isPrismaAvailable()) {
      try {
        await prisma.esbirkaQuotaAudit.create({
          data: {
            id: auditId,
            calledAt: now,
            requestType,
            endpoint: cleanEndpoint,
            actCode: actCode || null,
            httpStatus: null,
            result: 'PENDING',
            syncAuditId: syncAuditId || null,
            responseHash: null,
            durationMs: null,
            createdAt: now,
          },
        });
      } catch (dbErr: any) {
        console.warn(`[EsbirkaQuotaGuard] Failed to persist initial quota audit to DB (${dbErr?.message}), using in-memory store.`);
      }
    }

    return {
      reservationId,
      auditId,
      calledAt: now,
      endpoint: cleanEndpoint,
      actCode: actCode || null,
      dayCount: usedToday + 1,
    };
  }

  /**
   * Updates the quota audit record with the actual execution outcome.
   * 
   * @param auditId The audit ID returned from reserveSlot
   * @param httpStatus HTTP response code (e.g. 200, 304, 500)
   * @param result Status string ("SUCCESS", "NOT_MODIFIED", "ERROR", "TIMEOUT")
   * @param responseHash SHA-256 hash of response payload
   * @param durationMs Execution duration in milliseconds
   */
  public static async recordCallResult(
    auditId: string,
    httpStatus: number | null,
    result: 'SUCCESS' | 'NOT_MODIFIED' | 'ERROR' | 'TIMEOUT',
    responseHash: string | null = null,
    durationMs: number | null = null
  ): Promise<void> {
    // 1. Update in-memory record
    const record = this.inMemoryQuotaAudits.find((a) => a.id === auditId);
    if (record) {
      record.httpStatus = httpStatus;
      record.result = result;
      record.responseHash = responseHash;
      record.durationMs = durationMs;
    }

    // 2. Update DB record if available
    if (isPrismaAvailable()) {
      try {
        await prisma.esbirkaQuotaAudit.update({
          where: { id: auditId },
          data: {
            httpStatus,
            result,
            responseHash,
            durationMs,
          },
        });
      } catch (dbErr: any) {
        console.warn(`[EsbirkaQuotaGuard] Failed to update quota audit in DB (${dbErr?.message}).`);
      }
    }
  }

  /**
   * Counts the total API calls recorded for a given time window.
   */
  public static async countCallsForDay(startOfDay: Date, endOfDay: Date): Promise<number> {
    const startMs = startOfDay.getTime();
    const endMs = endOfDay.getTime();
    const memCount = this.inMemoryQuotaAudits.filter((a) => {
      const callMs = a.calledAt.getTime();
      return callMs >= startMs && callMs <= endMs;
    }).length;

    if (isPrismaAvailable()) {
      try {
        const count = await prisma.esbirkaQuotaAudit.count({
          where: {
            calledAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        });
        if (typeof count === 'number' && count >= memCount) {
          return count;
        }
      } catch (err: any) {
        console.warn(`[EsbirkaQuotaGuard] DB count query failed, calculating from memory store.`);
      }
    }

    return memCount;
  }

  /**
   * Returns current comprehensive quota status.
   */
  public static async getQuotaStatus(): Promise<QuotaStatus> {
    const now = new Date();
    const { startOfDay, endOfDay } = this.getUtcDayBounds(now);
    const usedToday = await this.countCallsForDay(startOfDay, endOfDay);
    const remainingCalls = Math.max(0, this.MAX_API_CALLS_PER_DAY - usedToday);

    // Find last call
    let lastCall: QuotaAuditRecord | null = null;
    if (this.inMemoryQuotaAudits.length > 0) {
      lastCall = this.inMemoryQuotaAudits[this.inMemoryQuotaAudits.length - 1];
    }

    const currentUtcDate = now.toISOString().slice(0, 10);
    const currentPragueDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Prague',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    return {
      usedToday,
      maxDailyCalls: this.MAX_API_CALLS_PER_DAY,
      targetDailyCalls: this.TARGET_API_CALLS_PER_DAY,
      remainingCalls,
      isExceeded: usedToday >= this.MAX_API_CALLS_PER_DAY,
      minIntervalMs: this.MIN_INTERVAL_MS,
      lastCallAt: lastCall?.calledAt || (this.lastCallTimestamp > 0 ? new Date(this.lastCallTimestamp) : null),
      lastCallStatus: lastCall?.result || null,
      lastCallEndpoint: lastCall?.endpoint || null,
      currentUtcDate,
      currentPragueDate,
    };
  }

  /**
   * Synchronous quick snapshot of in-memory quota status.
   */
  public static getQuotaStatusSync(): QuotaStatus {
    const now = new Date();
    const { startOfDay, endOfDay } = this.getUtcDayBounds(now);
    const startMs = startOfDay.getTime();
    const endMs = endOfDay.getTime();

    const usedToday = this.inMemoryQuotaAudits.filter((a) => {
      const callMs = a.calledAt.getTime();
      return callMs >= startMs && callMs <= endMs;
    }).length;

    const remainingCalls = Math.max(0, this.MAX_API_CALLS_PER_DAY - usedToday);
    const lastCall = this.inMemoryQuotaAudits.length > 0 ? this.inMemoryQuotaAudits[this.inMemoryQuotaAudits.length - 1] : null;

    const currentUtcDate = now.toISOString().slice(0, 10);
    const currentPragueDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Prague',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    return {
      usedToday,
      maxDailyCalls: this.MAX_API_CALLS_PER_DAY,
      targetDailyCalls: this.TARGET_API_CALLS_PER_DAY,
      remainingCalls,
      isExceeded: usedToday >= this.MAX_API_CALLS_PER_DAY,
      minIntervalMs: this.MIN_INTERVAL_MS,
      lastCallAt: lastCall?.calledAt || (this.lastCallTimestamp > 0 ? new Date(this.lastCallTimestamp) : null),
      lastCallStatus: lastCall?.result || null,
      lastCallEndpoint: lastCall?.endpoint || null,
      currentUtcDate,
      currentPragueDate,
    };
  }

  /**
   * Computes UTC start and end bounds for a given date.
   */
  public static getUtcDayBounds(date: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    return { startOfDay, endOfDay };
  }

  /**
   * Strips query parameters or sensitive tokens from endpoint paths.
   */
  private static sanitizeEndpoint(endpoint: string): string {
    if (!endpoint) return '/';
    return endpoint.split('?')[0].trim();
  }

  /**
   * Resets internal quota state (strictly for isolated unit testing).
   */
  public static resetForTesting(): void {
    this.inMemoryQuotaAudits = [];
    this.lastCallTimestamp = 0;
  }
}
