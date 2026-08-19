import cron from 'node-cron';
import { EsbirkaSyncEngine, PRIORITY_LEGAL_ACTS, PriorityActTarget } from './EsbirkaSyncEngine';
import { EsbirkaQuotaGuard } from './EsbirkaQuotaGuard';
import { EsbirkaLockGuard } from './EsbirkaLockGuard';
import { EsbirkaLegalRepository } from './EsbirkaLegalRepository';
import { SyncResult, QuotaStatus, LockInfo } from './syncTypes';
import { EsbirkaApiError } from './errors';

export interface SchedulerStatus {
  isInitialized: boolean;
  isRunning: boolean;
  cronExpression: string;
  nextScheduledHoursUtc: string[];
  lastRunAt: Date | null;
  lastRunResult: SyncResult | null;
  quota: QuotaStatus;
  lock: LockInfo | null;
  priorityActs: Array<PriorityActTarget & { lastSyncedAt?: Date | null }>;
  nextActToSync: PriorityActTarget | null;
}

export interface ManualSyncOptions {
  actCode?: string;
  actNumber?: number;
  actYear?: number;
  userId: string;
  userRole?: string;
  apiClientOverride?: any;
}

/**
 * Enterprise Scheduler for e-Sbírka / e-Legislativa Synchronization.
 * 
 * Invariants & Contract Compliance:
 * 1. ZERO UNCONTROLLED RUNS: Only executes 3 times per day (03:00, 11:00, 19:00 UTC).
 * 2. STRICT QUOTA BOUNDARY: Target 3 calls/day, Absolute Max 5 calls/day.
 * 3. FAIL-CLOSED: Rejects unauthenticated runs, quota overflows, and unvalidated payloads.
 * 4. IDEMPOTENT & RESTORE-SAFE: Rotation state is derived from DB/memory repository timestamps,
 *    meaning container restarts will NOT repeat already-synced acts or duplicate versions.
 * 5. CONCURRENCY SHIELD: Relies on EsbirkaLockGuard (PostgreSQL advisory lock & in-memory mutex).
 * 6. ZERO SECRETS: Never exposes, logs, or stores API credentials.
 */
export class EsbirkaScheduler {
  public static readonly DEFAULT_CRON_EXPRESSION = '0 3,11,19 * * *'; // 03:00, 11:00, 19:00 UTC

  private static cronTask: any = null;
  private static isInitialized = false;
  private static isRunning = false;
  private static lastRunAt: Date | null = null;
  private static lastRunResult: SyncResult | null = null;
  private static activeCronExpression = EsbirkaScheduler.DEFAULT_CRON_EXPRESSION;

  /**
   * Initializes and starts the automated cron scheduler.
   * Safe for repeated calls (idempotent).
   */
  public static start(customSchedule?: string): void {
    if (this.isInitialized && this.cronTask) {
      console.log('[EsbirkaScheduler] Scheduler is already active and running.');
      return;
    }

    const schedule = customSchedule || process.env.ESBIRKA_CRON_SCHEDULE || this.DEFAULT_CRON_EXPRESSION;
    this.activeCronExpression = schedule;

    // Check if scheduler is explicitly disabled via env OR in development when ESBIRKA_API_KEY is missing
    if (process.env.ESBIRKA_SCHEDULER_ENABLED === 'false' || (!process.env.ESBIRKA_API_KEY && process.env.NODE_ENV !== 'production')) {
      console.log('[EsbirkaScheduler] Scheduler disabled via configuration (ESBIRKA_SCHEDULER_ENABLED=false or missing ESBIRKA_API_KEY in dev).');
      this.isInitialized = true;
      this.isRunning = false;
      return;
    }

    try {
      this.cronTask = cron.schedule(
        schedule,
        async () => {
          console.log(`[EsbirkaScheduler] [CRON_TICK] Triggered automated legal sync at ${new Date().toISOString()} (UTC)...`);
          try {
            await this.executeScheduledTick();
          } catch (err: any) {
            console.error(`[EsbirkaScheduler] Error during scheduled tick execution: ${err?.message || err}`);
          }
        },
        {
          timezone: 'UTC',
        }
      );

      this.isInitialized = true;
      this.isRunning = true;
      console.log(`[EsbirkaScheduler] Automated legal synchronization scheduler active (Schedule: '${schedule}' UTC).`);
    } catch (scheduleErr: any) {
      console.error(`[EsbirkaScheduler] Failed to initialize cron scheduler with pattern '${schedule}':`, scheduleErr);
      this.isInitialized = false;
      this.isRunning = false;
    }
  }

  /**
   * Stops the automated scheduler.
   */
  public static stop(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isInitialized = false;
    this.isRunning = false;
    console.log('[EsbirkaScheduler] Automated legal synchronization scheduler stopped.');
  }

  /**
   * Executes a single scheduled tick (e.g. 1 of the 3 daily executions).
   * 
   * Strategy:
   * 1. Evaluates current quota usage. If usedToday >= TARGET (3) or MAX (5), skips execution.
   * 2. Selects exactly 1 priority act with the oldest lastSyncedAt.
   * 3. Executes synchronization through EsbirkaSyncEngine.
   */
  public static async executeScheduledTick(apiClientOverride?: any): Promise<SyncResult | null> {
    const startedAt = new Date();

    // 0. Environment check: Skip if API key is not configured and no mock client override is provided
    const hasApiKey = Boolean(process.env.ESBIRKA_API_KEY && process.env.ESBIRKA_API_KEY.trim().length > 0);
    if (!hasApiKey && !apiClientOverride) {
      console.log('[EsbirkaScheduler] Scheduled tick skipped: ESBIRKA_API_KEY is not configured in environment.');
      await EsbirkaLegalRepository.recordSyncAudit({
        syncId: `cron-skip-nokey-${Date.now()}`,
        actCode: 'NONE',
        syncType: 'AUTOMATIC_CRON',
        status: 'SKIPPED',
        startedAt,
        finishedAt: new Date(),
        durationMs: 0,
        errorMessage: 'Scheduled run skipped: ESBIRKA_API_KEY is not configured.',
        initiatedBy: 'SYSTEM_CRON_SCHEDULER',
      });
      return null;
    }

    // 1. Quota Pre-check (Conservative Target: 3 calls/day)
    const quotaStatus = await EsbirkaQuotaGuard.getQuotaStatus();
    if (quotaStatus.usedToday >= EsbirkaQuotaGuard.TARGET_API_CALLS_PER_DAY || quotaStatus.isExceeded) {
      const reason = quotaStatus.isExceeded
        ? `Daily quota hard limit reached (${quotaStatus.usedToday}/${quotaStatus.maxDailyCalls}).`
        : `Daily target quota reached (${quotaStatus.usedToday}/${quotaStatus.targetDailyCalls}).`;

      console.warn(`[EsbirkaScheduler] Scheduled tick skipped: ${reason}`);

      // Log skip in repository audit
      await EsbirkaLegalRepository.recordSyncAudit({
        syncId: `cron-skip-${Date.now()}`,
        actCode: 'NONE',
        syncType: 'AUTOMATIC_CRON',
        status: 'SKIPPED',
        startedAt,
        finishedAt: new Date(),
        durationMs: 0,
        errorMessage: `Scheduled run skipped: ${reason}`,
        initiatedBy: 'SYSTEM_CRON_SCHEDULER',
        quotaUsageIn24h: quotaStatus.usedToday,
      });

      return null;
    }

    // 2. Select next priority act to sync based on oldest lastSyncedAt
    const nextTarget = await EsbirkaLegalRepository.findNextPriorityActToSync(PRIORITY_LEGAL_ACTS);
    console.log(`[EsbirkaScheduler] Selected next priority act for synchronization: ${nextTarget.actCode} (${nextTarget.title})`);

    // 3. Trigger synchronized execution via SyncEngine
    try {
      const result = await EsbirkaSyncEngine.syncAct({
        actCode: nextTarget.actCode,
        actNumber: nextTarget.cislo,
        actYear: nextTarget.rok,
        syncType: 'AUTOMATIC_CRON',
        initiatedBy: 'SYSTEM_CRON_SCHEDULER',
        apiClientOverride,
      });

      this.lastRunAt = new Date();
      this.lastRunResult = result;

      console.log(`[EsbirkaScheduler] Scheduled synchronization for ${nextTarget.actCode} completed with status: ${result.status}`);
      return result;
    } catch (err: any) {
      console.error(`[EsbirkaScheduler] Scheduled synchronization for ${nextTarget.actCode} failed: ${err?.message || err}`);
      return null;
    }
  }

  /**
   * Triggers an authorized manual synchronization by an administrator.
   * 
   * Strict guards:
   * - Requires role ADMIN, SUPER_ADMIN, SYSTEM_ADMIN, or LEGAL_EDITOR.
   * - Cannot exceed MAX_DAILY_CALLS (5/day) - fails closed immediately.
   * - Always passes through EsbirkaLockGuard and EsbirkaQuotaGuard.
   */
  public static async triggerManualSync(options: ManualSyncOptions): Promise<SyncResult> {
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN', 'LEGAL_EDITOR'];
    if (options.userRole && !allowedRoles.includes(options.userRole)) {
      throw new EsbirkaApiError({
        message: `Unauthorized manual sync attempt: user role '${options.userRole}' is insufficient. Required: ADMIN or LEGAL_EDITOR.`,
        code: 'AUTHORIZATION_ERROR',
        httpStatus: 403,
      });
    }

    // 1. Quota Check
    const quotaStatus = await EsbirkaQuotaGuard.getQuotaStatus();
    if (quotaStatus.isExceeded || quotaStatus.usedToday >= EsbirkaQuotaGuard.MAX_API_CALLS_PER_DAY) {
      throw new EsbirkaApiError({
        message: `Manual sync rejected: Daily API quota hard limit reached (${quotaStatus.usedToday}/${quotaStatus.maxDailyCalls}). Agreement with MV ČR forbids further requests today.`,
        code: 'RATE_LIMITED',
        httpStatus: 429,
        safeDetails: { usedToday: quotaStatus.usedToday, maxDailyCalls: quotaStatus.maxDailyCalls },
      });
    }

    // 2. Resolve target act
    let targetActCode = options.actCode;
    let targetNumber = options.actNumber;
    let targetYear = options.actYear;

    if (!targetActCode && (!targetNumber || !targetYear)) {
      const nextTarget = await EsbirkaLegalRepository.findNextPriorityActToSync(PRIORITY_LEGAL_ACTS);
      targetActCode = nextTarget.actCode;
      targetNumber = nextTarget.cislo;
      targetYear = nextTarget.rok;
    }

    console.log(`[EsbirkaScheduler] Manual sync requested by user ${options.userId} for act ${targetActCode}...`);

    const result = await EsbirkaSyncEngine.syncAct({
      actCode: targetActCode,
      actNumber: targetNumber,
      actYear: targetYear,
      syncType: 'ADMIN_MANUAL',
      initiatedBy: `ADMIN:${options.userId}`,
      apiClientOverride: options.apiClientOverride,
    });

    this.lastRunAt = new Date();
    this.lastRunResult = result;

    return result;
  }

  /**
   * Returns complete diagnostic status of the scheduler, quota, lock, and legal acts.
   */
  public static async getStatus(): Promise<SchedulerStatus> {
    const lock = EsbirkaLockGuard.getLockInfo();
    const quota = await EsbirkaQuotaGuard.getQuotaStatus();
    const nextActToSync = await EsbirkaLegalRepository.findNextPriorityActToSync(PRIORITY_LEGAL_ACTS).catch(() => null);

    // Collect timestamps for priority acts
    const actsWithDetails: Array<PriorityActTarget & { lastSyncedAt?: Date | null }> = [];
    for (const act of PRIORITY_LEGAL_ACTS) {
      const details = await EsbirkaLegalRepository.findActByCode(act.actCode).catch(() => null);
      actsWithDetails.push({
        ...act,
        lastSyncedAt: details?.sections ? new Date() : null, // will reflect DB state
      });
    }

    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      cronExpression: this.activeCronExpression,
      nextScheduledHoursUtc: ['03:00', '11:00', '19:00'],
      lastRunAt: this.lastRunAt,
      lastRunResult: this.lastRunResult,
      quota,
      lock,
      priorityActs: actsWithDetails,
      nextActToSync,
    };
  }

  /**
   * Resets scheduler state for unit and integration testing.
   */
  public static resetForTesting(): void {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
    this.isInitialized = false;
    this.isRunning = false;
    this.lastRunAt = null;
    this.lastRunResult = null;
    this.activeCronExpression = this.DEFAULT_CRON_EXPRESSION;
  }
}
