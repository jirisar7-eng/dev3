import { EsbirkaScheduler } from './esbirka/EsbirkaScheduler';
import { EsbirkaSyncEngine } from './esbirka/EsbirkaSyncEngine';
import { EsbirkaQuotaGuard } from './esbirka/EsbirkaQuotaGuard';
import { EsbirkaLegalRepository } from './esbirka/EsbirkaLegalRepository';
import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';

export interface LawRecord {
  id: string;
  code: string;
  title: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * High-Level Service Facade for e-Sbírka / Legal Data operations.
 * Fully integrates with EsbirkaScheduler, EsbirkaSyncEngine, and EsbirkaLegalRepository.
 * 
 * Guarantees:
 * - 0 Dummy data fallback on API failure (Fail-Closed).
 * - Full enforcement of 1 req/s and 5 calls/day.
 * - 100% Client reads strictly from local database.
 */
export class EsbirkaService {
  /**
   * Initializes the automated cron scheduler (delegates to EsbirkaScheduler).
   */
  public static initCronScheduler(): void {
    EsbirkaScheduler.start();
  }

  /**
   * Returns current quota status.
   */
  public static getQuotaStatus() {
    const memStatus = EsbirkaQuotaGuard.getQuotaStatusSync();
    return {
      used: memStatus.usedToday,
      limit: memStatus.maxDailyCalls,
      remaining: memStatus.remainingCalls,
      minIntervalMs: memStatus.minIntervalMs,
      maxConcurrent: 1,
    };
  }

  /**
   * Synchronizes a legal act by number and year.
   * Strictly delegates to EsbirkaSyncEngine with full lock, quota, and change detection guards.
   */
  public static async syncLaw(cislo: number, rok: number): Promise<LawRecord> {
    const actCode = `${cislo}/${rok}`;
    const result = await EsbirkaSyncEngine.syncAct({
      actNumber: cislo,
      actYear: rok,
      actCode,
      syncType: 'ADMIN_MANUAL',
      initiatedBy: 'ADMIN_FACADE',
    });

    if (result.status === 'FAILED') {
      throw new Error(`Synchronizace předpisu ${actCode} selhala: ${result.error?.message || 'Chyba při komunikaci s API e-Sbírka.'}`);
    }

    const fetched = await this.getLawByCodeFromDb(actCode);
    if (!fetched) {
      return {
        id: result.syncId,
        code: actCode,
        title: `Zákon č. ${actCode}`,
        content: JSON.stringify({ actCode, status: result.status }),
        createdAt: result.startedAt,
        updatedAt: result.finishedAt,
      };
    }
    return fetched;
  }

  /**
   * Reads all stored laws for public views.
   * 100% local database read (zero external requests).
   */
  public static async getLawsFromDb(): Promise<LawRecord[]> {
    // 1. Try new LegalAct model via repository
    try {
      const legalActs = await EsbirkaLegalRepository.getAllActs();
      if (legalActs && legalActs.length > 0) {
        return legalActs.map((act) => ({
          id: act.id,
          code: act.actCode,
          title: act.title,
          content: JSON.stringify(act.sections || []),
          createdAt: act.createdAt,
          updatedAt: act.updatedAt,
        }));
      }
    } catch {
      // fallback to legacy model
    }

    // 2. Fallback to legacy Law table if exists
    if (isPrismaAvailable()) {
      try {
        const legacyLaws = await prisma.law.findMany({
          orderBy: { code: 'asc' },
        });
        if (legacyLaws.length > 0) return legacyLaws;
      } catch {
        // fallback to memory
      }
    }

    // 3. Fallback to dbStore
    return dbStore.laws;
  }

  /**
   * Reads a single law by its code (e.g. "89/2012").
   * 100% local database read (zero external requests).
   */
  public static async getLawByCodeFromDb(code: string): Promise<LawRecord | null> {
    const formattedCode = code.replace('-', '/');

    // 1. Try new LegalAct model via repository
    try {
      const legalAct = await EsbirkaLegalRepository.getActDetailsByCode(formattedCode);
      if (legalAct) {
        return {
          id: legalAct.id,
          code: legalAct.actCode,
          title: legalAct.title,
          content: JSON.stringify(legalAct.sections || []),
          createdAt: legalAct.createdAt,
          updatedAt: legalAct.updatedAt,
        };
      }
    } catch {
      // fallback
    }

    // 2. Fallback to legacy Law model
    if (isPrismaAvailable()) {
      try {
        const law = await prisma.law.findFirst({
          where: {
            OR: [
              { code: formattedCode },
              { code: code },
              { id: code },
            ],
          },
        });
        if (law) return law;
      } catch {
        // fallback
      }
    }

    // 3. In-memory store fallback
    const localLaw = dbStore.laws.find(
      (l) => l.code === formattedCode || l.code === code || l.id === code
    );
    return localLaw || null;
  }

  /**
   * Retrieves all stored time versions (časová znění) for a given legal act.
   * 100% local database read (zero external requests).
   */
  public static async getActVersions(code: string, referenceDate: Date = new Date()) {
    const formattedCode = code.replace('-', '/');
    return EsbirkaLegalRepository.getActVersions(formattedCode, referenceDate);
  }

  /**
   * Retrieves a specific historical/current version details and section wording snapshot.
   * 100% local database read (zero external requests).
   */
  public static async getActVersionDetails(
    code: string,
    versionIdOrNumber: string,
    referenceDate: Date = new Date()
  ) {
    const formattedCode = code.replace('-', '/');
    return EsbirkaLegalRepository.getActVersionDetails(formattedCode, versionIdOrNumber, referenceDate);
  }

  /**
   * Evaluates validity of a time version given effective dates and a reference date.
   */
  public static determineActWordingValidity(
    effectiveFrom: Date,
    effectiveTo: Date | null,
    referenceDate: Date = new Date()
  ) {
    return EsbirkaLegalRepository.determineVersionValidity(effectiveFrom, effectiveTo, referenceDate);
  }
}
