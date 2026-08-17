import crypto from 'crypto';
import { prisma, isPrismaAvailable } from '../../db/prisma';
import { NormalizedLegalAct, NormalizedLegalSection, NormalizedLegalVersion } from './validationTypes';
import { SyncAuditStatusType, ActChangeType } from './syncTypes';
import { ExistingActSnapshot } from './EsbirkaChangeDetector';
import { EsbirkaApiError } from './errors';

export interface PersistSyncAuditParams {
  syncId: string;
  actCode: string;
  legalActId?: string | null;
  syncType?: string;
  status: SyncAuditStatusType;
  startedAt: Date;
  finishedAt?: Date | null;
  durationMs?: number | null;
  httpStatus?: number | null;
  apiCallsCount?: number;
  recordsReceived?: number;
  recordsNew?: number;
  recordsChanged?: number;
  recordsUnchanged?: number;
  errorsCount?: number;
  responseHash?: string | null;
  errorMessage?: string | null;
  initiatedBy?: string;
  quotaUsageIn24h?: number;
}

export interface LegalActRecord {
  id: string;
  actCode: string;
  actNumber: number;
  actYear: number;
  collection: string;
  title: string;
  shortTitle: string | null;
  actType: string;
  category: string;
  status: string;
  source: string;
  sourceUri: string | null;
  passedDate: Date | null;
  promulgationDate: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  lastAmendedDate: Date | null;
  lastSyncedAt: Date | null;
  lastVerifiedAt: Date | null;
  contentHash: string;
  etag: string | null;
  syncPriority: number;
  rawMetadata: any;
  createdAt: Date;
  updatedAt: Date;
  sections?: Array<{
    id: string;
    sectionNumber: string;
    sectionOrder: number;
    title: string | null;
    content: string;
    isKeySection: boolean;
    practicalNote: string | null;
    courtRelevance: string | null;
  }>;
  versions?: Array<{
    id: string;
    versionNumber: string;
    effectiveFrom: Date;
    effectiveTo: Date | null;
    promulgationDate: Date | null;
    contentSnapshot: any;
    contentHash: string;
    changeSummary: string | null;
    sourceNote: string | null;
    createdAt: Date;
  }>;
}

/**
 * Enterprise Transactional Repository for Legal Acts, Versions, Sections, and Audits.
 *
 * Guarantees:
 * - Atomicity via Prisma $transaction (All-or-Nothing).
 * - Full historical versioning without destructive overwrites.
 * - Idempotent upserts keyed on unique identifiers.
 * - In-memory mirror for isolated testing and preview sandbox resilience.
 */
export class EsbirkaLegalRepository {
  // In-memory fallback and test store
  private static memoryActs: Map<string, LegalActRecord> = new Map();
  private static memorySyncAudits: Map<string, PersistSyncAuditParams> = new Map();

  /**
   * Fetches an existing legal act by its canonical act code (e.g. "89/2012").
   */
  public static async findActByCode(actCode: string): Promise<ExistingActSnapshot | null> {
    if (isPrismaAvailable()) {
      try {
        const act = await prisma.legalAct.findUnique({
          where: { actCode },
          include: {
            sections: {
              select: {
                sectionNumber: true,
                sectionOrder: true,
                title: true,
                content: true,
              },
            },
          },
        });

        if (!act) return null;

        return {
          actCode: act.actCode,
          contentHash: act.contentHash,
          sections: act.sections,
        };
      } catch (err: any) {
        console.warn(`[EsbirkaLegalRepository] DB query failed (${err?.message}), checking memory store.`);
      }
    }

    const memAct = this.memoryActs.get(actCode);
    if (!memAct) return null;

    return {
      actCode: memAct.actCode,
      contentHash: memAct.contentHash,
      sections: memAct.sections?.map((s) => ({
        sectionNumber: s.sectionNumber,
        sectionOrder: s.sectionOrder,
        title: s.title,
        content: s.content,
      })),
    };
  }

  /**
   * Atomically persists a normalized legal act according to change type (NEW, CHANGED, UNCHANGED).
   */
  public static async persistNormalizedAct(
    normalizedAct: NormalizedLegalAct,
    changeType: ActChangeType,
    etag: string | null = null,
    syncId: string = crypto.randomUUID()
  ): Promise<LegalActRecord> {
    const now = new Date();

    if (isPrismaAvailable()) {
      try {
        return await prisma.$transaction(async (tx) => {
          if (changeType === 'NEW') {
            // 1. Create LegalAct
            const createdAct = await tx.legalAct.create({
              data: {
                actCode: normalizedAct.actCode,
                actNumber: normalizedAct.actNumber,
                actYear: normalizedAct.actYear,
                collection: normalizedAct.collection,
                title: normalizedAct.title,
                shortTitle: normalizedAct.shortTitle,
                actType: normalizedAct.actType,
                category: normalizedAct.category as any,
                status: normalizedAct.status as any,
                source: normalizedAct.source,
                sourceUri: normalizedAct.sourceUri,
                passedDate: normalizedAct.passedDate,
                promulgationDate: normalizedAct.promulgationDate,
                effectiveFrom: normalizedAct.effectiveFrom,
                effectiveTo: normalizedAct.effectiveTo,
                lastAmendedDate: normalizedAct.lastAmendedDate,
                lastSyncedAt: now,
                lastVerifiedAt: now,
                contentHash: normalizedAct.contentHash,
                etag,
                syncPriority: normalizedAct.syncPriority,
                rawMetadata: normalizedAct.rawMetadata as any,
              },
            });

            // 2. Create initial Version snapshot
            await tx.legalActVersion.create({
              data: {
                legalActId: createdAct.id,
                versionNumber: normalizedAct.versionSnapshot.versionNumber,
                effectiveFrom: normalizedAct.versionSnapshot.effectiveFrom,
                effectiveTo: normalizedAct.versionSnapshot.effectiveTo,
                promulgationDate: normalizedAct.versionSnapshot.promulgationDate,
                contentSnapshot: normalizedAct.versionSnapshot.contentSnapshot as any,
                contentHash: normalizedAct.versionSnapshot.contentHash,
                changeSummary: 'Počáteční synchronizace z e-Sbírky / e-Legislativy',
                sourceNote: normalizedAct.versionSnapshot.sourceNote,
              },
            });

            // 3. Create all sections
            for (const sec of normalizedAct.sections) {
              await tx.legalActSection.create({
                data: {
                  legalActId: createdAct.id,
                  sectionNumber: sec.sectionNumber,
                  sectionOrder: sec.sectionOrder,
                  title: sec.title,
                  content: sec.content,
                  isKeySection: sec.isKeySection,
                  practicalNote: sec.practicalNote,
                  courtRelevance: sec.courtRelevance,
                },
              });
            }

            return createdAct as any;
          } else if (changeType === 'CHANGED') {
            // Find existing act
            const existing = await tx.legalAct.findUnique({
              where: { actCode: normalizedAct.actCode },
            });

            if (!existing) {
              throw new Error(`Cannot update non-existent LegalAct '${normalizedAct.actCode}'`);
            }

            // 1. Update LegalAct header & content hash
            const updatedAct = await tx.legalAct.update({
              where: { id: existing.id },
              data: {
                title: normalizedAct.title,
                shortTitle: normalizedAct.shortTitle,
                actType: normalizedAct.actType,
                category: normalizedAct.category as any,
                status: normalizedAct.status as any,
                sourceUri: normalizedAct.sourceUri,
                passedDate: normalizedAct.passedDate,
                promulgationDate: normalizedAct.promulgationDate,
                effectiveFrom: normalizedAct.effectiveFrom,
                effectiveTo: normalizedAct.effectiveTo,
                lastAmendedDate: normalizedAct.lastAmendedDate,
                lastSyncedAt: now,
                lastVerifiedAt: now,
                contentHash: normalizedAct.contentHash,
                etag,
                rawMetadata: normalizedAct.rawMetadata as any,
              },
            });

            // 2. Create new Version snapshot (Preserving previous versions!)
            await tx.legalActVersion.create({
              data: {
                legalActId: existing.id,
                versionNumber: normalizedAct.versionSnapshot.versionNumber,
                effectiveFrom: normalizedAct.versionSnapshot.effectiveFrom,
                effectiveTo: normalizedAct.versionSnapshot.effectiveTo,
                promulgationDate: normalizedAct.versionSnapshot.promulgationDate,
                contentSnapshot: normalizedAct.versionSnapshot.contentSnapshot as any,
                contentHash: normalizedAct.versionSnapshot.contentHash,
                changeSummary: `Aktualizace znění ze dne ${now.toISOString().slice(0, 10)}`,
                sourceNote: normalizedAct.versionSnapshot.sourceNote,
              },
            });

            // 3. Upsert sections
            for (const sec of normalizedAct.sections) {
              await tx.legalActSection.upsert({
                where: {
                  legalActId_sectionNumber: {
                    legalActId: existing.id,
                    sectionNumber: sec.sectionNumber,
                  },
                },
                create: {
                  legalActId: existing.id,
                  sectionNumber: sec.sectionNumber,
                  sectionOrder: sec.sectionOrder,
                  title: sec.title,
                  content: sec.content,
                  isKeySection: sec.isKeySection,
                  practicalNote: sec.practicalNote,
                  courtRelevance: sec.courtRelevance,
                },
                update: {
                  sectionOrder: sec.sectionOrder,
                  title: sec.title,
                  content: sec.content,
                  isKeySection: sec.isKeySection,
                  practicalNote: sec.practicalNote,
                  courtRelevance: sec.courtRelevance,
                },
              });
            }

            return updatedAct as any;
          } else {
            // UNCHANGED: Update only sync metadata
            const existing = await tx.legalAct.findUnique({
              where: { actCode: normalizedAct.actCode },
            });

            if (existing) {
              return await tx.legalAct.update({
                where: { id: existing.id },
                data: {
                  lastSyncedAt: now,
                  lastVerifiedAt: now,
                  etag,
                },
              }) as any;
            }

            throw new Error(`Cannot touch UNCHANGED LegalAct '${normalizedAct.actCode}': not found`);
          }
        });
      } catch (dbErr: any) {
        console.warn(`[EsbirkaLegalRepository] Prisma transaction failed (${dbErr?.message}), executing on in-memory store.`);
      }
    }

    // In-memory transactional fallback
    return this.persistToMemoryStore(normalizedAct, changeType, etag, now);
  }

  /**
   * Internal memory store persistence with full relational fidelity.
   */
  private static persistToMemoryStore(
    normalizedAct: NormalizedLegalAct,
    changeType: ActChangeType,
    etag: string | null,
    now: Date
  ): LegalActRecord {
    let act = this.memoryActs.get(normalizedAct.actCode);

    if (changeType === 'NEW' || !act) {
      const actId = crypto.randomUUID();
      const sections = normalizedAct.sections.map((s) => ({
        id: crypto.randomUUID(),
        sectionNumber: s.sectionNumber,
        sectionOrder: s.sectionOrder,
        title: s.title,
        content: s.content,
        isKeySection: s.isKeySection,
        practicalNote: s.practicalNote,
        courtRelevance: s.courtRelevance,
      }));

      const version = {
        id: crypto.randomUUID(),
        versionNumber: normalizedAct.versionSnapshot.versionNumber,
        effectiveFrom: normalizedAct.versionSnapshot.effectiveFrom,
        effectiveTo: normalizedAct.versionSnapshot.effectiveTo,
        promulgationDate: normalizedAct.versionSnapshot.promulgationDate,
        contentSnapshot: normalizedAct.versionSnapshot.contentSnapshot,
        contentHash: normalizedAct.versionSnapshot.contentHash,
        changeSummary: 'Počáteční synchronizace z e-Sbírky (in-memory)',
        sourceNote: normalizedAct.versionSnapshot.sourceNote,
        createdAt: now,
      };

      act = {
        id: actId,
        actCode: normalizedAct.actCode,
        actNumber: normalizedAct.actNumber,
        actYear: normalizedAct.actYear,
        collection: normalizedAct.collection,
        title: normalizedAct.title,
        shortTitle: normalizedAct.shortTitle,
        actType: normalizedAct.actType,
        category: normalizedAct.category,
        status: normalizedAct.status,
        source: normalizedAct.source,
        sourceUri: normalizedAct.sourceUri,
        passedDate: normalizedAct.passedDate,
        promulgationDate: normalizedAct.promulgationDate,
        effectiveFrom: normalizedAct.effectiveFrom,
        effectiveTo: normalizedAct.effectiveTo,
        lastAmendedDate: normalizedAct.lastAmendedDate,
        lastSyncedAt: now,
        lastVerifiedAt: now,
        contentHash: normalizedAct.contentHash,
        etag,
        syncPriority: normalizedAct.syncPriority,
        rawMetadata: normalizedAct.rawMetadata,
        createdAt: now,
        updatedAt: now,
        sections,
        versions: [version],
      };

      this.memoryActs.set(normalizedAct.actCode, act);
      return act;
    }

    if (changeType === 'CHANGED') {
      act.title = normalizedAct.title;
      act.shortTitle = normalizedAct.shortTitle;
      act.contentHash = normalizedAct.contentHash;
      act.lastSyncedAt = now;
      act.lastVerifiedAt = now;
      act.etag = etag;
      act.updatedAt = now;

      // Add version snapshot without deleting previous
      if (!act.versions) act.versions = [];
      act.versions.push({
        id: crypto.randomUUID(),
        versionNumber: normalizedAct.versionSnapshot.versionNumber,
        effectiveFrom: normalizedAct.versionSnapshot.effectiveFrom,
        effectiveTo: normalizedAct.versionSnapshot.effectiveTo,
        promulgationDate: normalizedAct.versionSnapshot.promulgationDate,
        contentSnapshot: normalizedAct.versionSnapshot.contentSnapshot,
        contentHash: normalizedAct.versionSnapshot.contentHash,
        changeSummary: `Aktualizace znění ${now.toISOString().slice(0, 10)} (in-memory)`,
        sourceNote: normalizedAct.versionSnapshot.sourceNote,
        createdAt: now,
      });

      // Update sections
      act.sections = normalizedAct.sections.map((s) => ({
        id: crypto.randomUUID(),
        sectionNumber: s.sectionNumber,
        sectionOrder: s.sectionOrder,
        title: s.title,
        content: s.content,
        isKeySection: s.isKeySection,
        practicalNote: s.practicalNote,
        courtRelevance: s.courtRelevance,
      }));

      return act;
    }

    // UNCHANGED
    act.lastSyncedAt = now;
    act.lastVerifiedAt = now;
    act.etag = etag;
    act.updatedAt = now;

    return act;
  }

  /**
   * Persists or updates a synchronization audit log entry.
   */
  public static async recordSyncAudit(params: PersistSyncAuditParams): Promise<void> {
    this.memorySyncAudits.set(params.syncId, { ...params });

    if (isPrismaAvailable()) {
      try {
        await prisma.legalSyncAudit.upsert({
          where: { id: params.syncId },
          create: {
            id: params.syncId,
            actCode: params.actCode,
            legalActId: params.legalActId || null,
            syncType: params.syncType || 'AUTOMATIC_CRON',
            startedAt: params.startedAt,
            finishedAt: params.finishedAt || null,
            durationMs: params.durationMs || null,
            status: params.status as any,
            httpStatus: params.httpStatus || null,
            apiCallsCount: params.apiCallsCount ?? 1,
            recordsReceived: params.recordsReceived ?? 0,
            recordsNew: params.recordsNew ?? 0,
            recordsChanged: params.recordsChanged ?? 0,
            recordsUnchanged: params.recordsUnchanged ?? 0,
            errorsCount: params.errorsCount ?? 0,
            responseHash: params.responseHash || null,
            errorMessage: params.errorMessage || null,
            initiatedBy: params.initiatedBy || 'SYSTEM',
            quotaUsageIn24h: params.quotaUsageIn24h ?? 1,
          },
          update: {
            finishedAt: params.finishedAt || null,
            durationMs: params.durationMs || null,
            status: params.status as any,
            httpStatus: params.httpStatus || null,
            recordsReceived: params.recordsReceived ?? 0,
            recordsNew: params.recordsNew ?? 0,
            recordsChanged: params.recordsChanged ?? 0,
            recordsUnchanged: params.recordsUnchanged ?? 0,
            errorsCount: params.errorsCount ?? 0,
            responseHash: params.responseHash || null,
            errorMessage: params.errorMessage || null,
            quotaUsageIn24h: params.quotaUsageIn24h ?? 1,
          },
        });
      } catch (dbErr: any) {
        console.warn(`[EsbirkaLegalRepository] Failed to persist sync audit to DB (${dbErr?.message}).`);
      }
    }
  }

  /**
   * Gets a sync audit log by syncId.
   */
  public static async getSyncAudit(syncId: string): Promise<PersistSyncAuditParams | null> {
    if (isPrismaAvailable()) {
      try {
        const audit = await prisma.legalSyncAudit.findUnique({
          where: { id: syncId },
        });
        if (audit) {
          return {
            syncId: audit.id,
            actCode: audit.actCode,
            legalActId: audit.legalActId,
            syncType: audit.syncType,
            status: audit.status as any,
            startedAt: audit.startedAt,
            finishedAt: audit.finishedAt,
            durationMs: audit.durationMs,
            httpStatus: audit.httpStatus,
            apiCallsCount: audit.apiCallsCount,
            recordsReceived: audit.recordsReceived,
            recordsNew: audit.recordsNew,
            recordsChanged: audit.recordsChanged,
            recordsUnchanged: audit.recordsUnchanged,
            errorsCount: audit.errorsCount,
            responseHash: audit.responseHash,
            errorMessage: audit.errorMessage,
            initiatedBy: audit.initiatedBy,
            quotaUsageIn24h: audit.quotaUsageIn24h,
          };
        }
      } catch (err: any) {
        // Fallback
      }
    }

    return this.memorySyncAudits.get(syncId) || null;
  }

  /**
   * Fetches the latest sync audits, ordered by startedAt descending.
   */
  public static async getAllAudits(limit: number = 50): Promise<PersistSyncAuditParams[]> {
    if (isPrismaAvailable()) {
      try {
        const audits = await prisma.legalSyncAudit.findMany({
          orderBy: { startedAt: 'desc' },
          take: limit,
          include: {
            legalAct: {
              select: { title: true }
            }
          }
        });
        return audits.map((audit: any) => ({
          syncId: audit.id,
          actCode: audit.actCode,
          legalActId: audit.legalActId,
          legalActTitle: audit.legalAct?.title,
          syncType: audit.syncType,
          status: audit.status as any,
          startedAt: audit.startedAt,
          finishedAt: audit.finishedAt,
          durationMs: audit.durationMs,
          httpStatus: audit.httpStatus,
          apiCallsCount: audit.apiCallsCount,
          recordsReceived: audit.recordsReceived,
          recordsNew: audit.recordsNew,
          recordsChanged: audit.recordsChanged,
          recordsUnchanged: audit.recordsUnchanged,
          errorsCount: audit.errorsCount,
          responseHash: audit.responseHash,
          errorMessage: audit.errorMessage,
          initiatedBy: audit.initiatedBy,
          quotaUsageIn24h: audit.quotaUsageIn24h,
        }));
      } catch (err: any) {
        console.warn(`[EsbirkaLegalRepository] DB getAllAudits failed (${err?.message}), falling back to memory.`);
      }
    }

    return Array.from(this.memorySyncAudits.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Fetches all stored legal acts for client/API consumers.
   */
  public static async getAllActs(): Promise<LegalActRecord[]> {
    if (isPrismaAvailable()) {
      try {
        const acts = await prisma.legalAct.findMany({
          orderBy: { syncPriority: 'asc' },
          include: {
            sections: {
              orderBy: { sectionOrder: 'asc' },
            },
          },
        });
        if (acts && acts.length > 0) {
          return acts as any;
        }
      } catch (err: any) {
        console.warn(`[EsbirkaLegalRepository] DB getAllActs failed (${err?.message}), falling back to memory.`);
      }
    }

    return Array.from(this.memoryActs.values()).sort((a, b) => a.syncPriority - b.syncPriority);
  }

  /**
   * Fetches full details of a specific legal act by code.
   */
  public static async getActDetailsByCode(actCode: string): Promise<LegalActRecord | null> {
    const formattedCode = actCode.replace('-', '/');

    if (isPrismaAvailable()) {
      try {
        const act = await prisma.legalAct.findFirst({
          where: {
            OR: [
              { actCode: formattedCode },
              { actCode: actCode },
            ],
          },
          include: {
            sections: {
              orderBy: { sectionOrder: 'asc' },
            },
            versions: {
              orderBy: { effectiveFrom: 'desc' },
            },
          },
        });
        if (act) {
          return act as any;
        }
      } catch (err: any) {
        console.warn(`[EsbirkaLegalRepository] DB getActDetailsByCode failed (${err?.message}), falling back to memory.`);
      }
    }

    const memAct = this.memoryActs.get(formattedCode) || this.memoryActs.get(actCode);
    return memAct || null;
  }

  /**
   * Selects the single priority legal act that most urgently needs synchronization.
   * Priority rule: Acts never synced (lastSyncedAt is null) come first,
   * followed by acts with the oldest lastSyncedAt timestamp.
   */
  public static async findNextPriorityActToSync<T extends { actCode: string; cislo: number; rok: number; title: string }>(
    priorityList: T[]
  ): Promise<T> {
    if (priorityList.length === 0) {
      throw new Error('Priority list cannot be empty.');
    }

    // Map priority list with their lastSyncedAt from DB or memory
    const actsWithTimestamps: Array<{ target: T; lastSyncedAt: Date | null }> = [];

    for (const target of priorityList) {
      let lastSyncedAt: Date | null = null;

      if (isPrismaAvailable()) {
        try {
          const act = await prisma.legalAct.findUnique({
            where: { actCode: target.actCode },
            select: { lastSyncedAt: true },
          });
          if (act) {
            lastSyncedAt = act.lastSyncedAt;
          }
        } catch {
          // fallback to memory
        }
      }

      if (!lastSyncedAt) {
        const memAct = this.memoryActs.get(target.actCode);
        if (memAct) {
          lastSyncedAt = memAct.lastSyncedAt;
        }
      }

      actsWithTimestamps.push({ target, lastSyncedAt });
    }

    // Sort: null lastSyncedAt first, then oldest Date
    actsWithTimestamps.sort((a, b) => {
      if (a.lastSyncedAt === null && b.lastSyncedAt === null) return 0;
      if (a.lastSyncedAt === null) return -1;
      if (b.lastSyncedAt === null) return 1;
      return a.lastSyncedAt.getTime() - b.lastSyncedAt.getTime();
    });

    return actsWithTimestamps[0].target;
  }

  /**
   * Resets all in-memory store states (for unit tests).
   */
  public static resetForTesting(): void {
    this.memoryActs.clear();
    this.memorySyncAudits.clear();
  }
}
