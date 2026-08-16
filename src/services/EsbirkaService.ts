import fetch from 'node-fetch';
import cron from 'node-cron';
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

export class EsbirkaService {
  private static BASE_URL = process.env.ESBIRKA_BASE_URL || 'https://www.esbirka.cz/api/v1';

  // --- STRIKTNÍ RATE LIMITER & QUOTA ---
  private static MAX_DAILY_CALLS = 5;
  private static MIN_DELAY_MS = 1200; // Min 1200ms pauza mezi HTTP požadavky (max 1 req/s)
  
  private static callTimestamps: number[] = [];
  private static lastRequestTimestamp = 0;
  private static requestQueue: Promise<any> = Promise.resolve();

  // Seznam klíčových předpisů pro plánovanou synchronizaci (Občanský zákoník 89/2012, zOSPOD 359/1999)
  private static PRIORITY_LAWS = [
    { cislo: 89, rok: 2012, title: 'Zákon č. 89/2012 Sb., občanský zákoník' },
    { cislo: 359, rok: 1999, title: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (zOSPOD)' },
  ];
  private static cronRotationIndex = 0;
  private static cronTaskScheduled = false;

  /**
   * Generuje autorizační hlavičky pro e-Sbírka API
   */
  private static getHeaders() {
    const apiKey = process.env.ESBIRKA_API_KEY || '';
    return {
      'Authorization': `Bearer ${apiKey}`,
      'X-API-KEY': apiKey,
      'Accept': 'application/json',
    };
  }

  /**
   * Vyčistí historii volání starší než 24 hodin a vrátí počet volání v okně
   */
  private static checkAndCleanDailyQuota(): number {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.callTimestamps = this.callTimestamps.filter((t) => t > twentyFourHoursAgo);
    return this.callTimestamps.length;
  }

  /**
   * Získání aktuálního stavu kvóty pro diagnostiku / status
   */
  static getQuotaStatus() {
    const used = this.checkAndCleanDailyQuota();
    return {
      used,
      limit: this.MAX_DAILY_CALLS,
      remaining: Math.max(0, this.MAX_DAILY_CALLS - used),
      minIntervalMs: this.MIN_DELAY_MS,
      maxConcurrent: 1,
    };
  }

  /**
   * Synchronizuje vybraný předpis z e-Sbírka API do PostgreSQL / dbStore.
   * Vynucuje:
   * 1. Max 1 souběžný požadavek (fronta)
   * 2. Minimální pauzu 1200 ms mezi HTTP voláními
   * 3. Maximálně 5 volání za 24 hodin
   */
  static async syncLaw(cislo: number, rok: number): Promise<LawRecord> {
    // Zařazení do sekvenční fronty (max 1 souběžné připojení)
    this.requestQueue = this.requestQueue.then(async () => {
      return this.executeSyncLaw(cislo, rok);
    });

    return this.requestQueue;
  }

  /**
   * Interní prováděcí metoda s dodržením rate limitu a denní kvóty
   */
  private static async executeSyncLaw(cislo: number, rok: number): Promise<LawRecord> {
    const code = `${cislo}/${rok}`;

    // 1. Kontrola denního limitu (5 volání za 24h)
    const usedToday = this.checkAndCleanDailyQuota();
    if (usedToday >= this.MAX_DAILY_CALLS) {
      const quotaMsg = 'Aktivní denní limit API e-Sbírka (5/5) doručen.';
      console.warn(quotaMsg);
      throw new Error(quotaMsg);
    }

    // 2. Dodržení minimální pauzy 1200ms mezi požadavky
    const now = Date.now();
    const timeSinceLastCall = now - this.lastRequestTimestamp;
    if (timeSinceLastCall < this.MIN_DELAY_MS) {
      const waitTime = this.MIN_DELAY_MS - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Poznamenání času volání pro rate limiting i denní kvótu
    const callTime = Date.now();
    this.lastRequestTimestamp = callTime;
    this.callTimestamps.push(callTime);

    console.log(`[e-Sbírka Sync] Odesílám HTTP požadavek na e-Sbírku pro ${code} (Volání ${this.callTimestamps.length}/5)...`);

    try {
      const response = await fetch(`${this.BASE_URL}/predpisy/${rok}/${cislo}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`e-Sbírka API vrátila status ${response.status}`);
      }

      let lawData: any;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        lawData = await response.json();
      } else {
        console.warn(`[e-Sbírka Sync] API pro ${code} vrátilo neplatný formát (${contentType}). Používám offline záložní data.`);
        lawData = {
          nazev: `Zákon č. ${code} (Offline záloha)`,
          paragrafy: [
            { paragraf: 1, text: "API e-Sbírka je momentálně nedostupné. Toto je dočasná offline kopie." }
          ]
        };
      }

      const title = lawData.nazev || `Zákon č. ${code}`;
      const content = JSON.stringify(lawData.paragrafy || lawData);

      let savedLaw: LawRecord | null = null;

      if (isPrismaAvailable()) {
        try {
          savedLaw = await prisma.law.upsert({
            where: { code },
            update: {
              title,
              content,
              updatedAt: new Date(),
            },
            create: {
              code,
              title,
              content,
            },
          });
        } catch (dbErr) {
          console.warn(`[Database] Prisma/PostgreSQL DB unavailable. Falling back to local in-memory dbStore. Error:`, dbErr);
        }
      } 
      
      if (!savedLaw) {
        // Fallback do in-memory dbStore
        const existingIndex = dbStore.laws.findIndex((l) => l.code === code);
        const record: LawRecord = {
          id: existingIndex >= 0 ? dbStore.laws[existingIndex].id : `law-${cislo}-${rok}`,
          code,
          title,
          content,
          createdAt: existingIndex >= 0 ? dbStore.laws[existingIndex].createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (existingIndex >= 0) {
          dbStore.laws[existingIndex] = record;
        } else {
          dbStore.laws.push(record);
        }
        savedLaw = record;
      }

      console.log(`[e-Sbírka Sync] Úspěšně synchronizován zákon ${code} do lokalního úložiště.`);
      return savedLaw;
    } catch (error) {
      console.error(`[e-Sbírka Sync Error] Selhala synchronizace předpisu ${code}:`, error);
      throw error;
    }
  }

  /**
   * --- KLIENTSKÉ METODY: ČTOU VÝHRADNĚ Z LOKÁLNÍ DATABÁZE (PostgreSQL / dbStore) ---
   * Zaručují, že návštěvníci webu nikdy nevyvolají přímý HTTP požadavek na e-Sbírku.
   */

  /**
   * Načte všechny uložené zákony z lokální databáze
   */
  static async getLawsFromDb(): Promise<LawRecord[]> {
    if (isPrismaAvailable()) {
      try {
        const laws = await prisma.law.findMany({
          orderBy: { code: 'asc' },
        });
        if (laws.length > 0) return laws;
      } catch (err) {
        console.warn('[e-Sbírka DB Warning] Chyba při čtení z PostgreSQL, použije se dbStore:', err);
      }
    }
    return dbStore.laws;
  }

  /**
   * Načte konkrétní předpis podle kódu (např. "89/2012" nebo "359/1999") z lokální databáze
   */
  static async getLawByCodeFromDb(code: string): Promise<LawRecord | null> {
    const formattedCode = code.replace('-', '/');

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
      } catch (err) {
        console.warn(`[e-Sbírka DB Warning] Nepodařilo se načíst předpis ${code} z PostgreSQL:`, err);
      }
    }

    // Fallback v dbStore
    const localLaw = dbStore.laws.find(
      (l) => l.code === formattedCode || l.code === code || l.id === code
    );
    return localLaw || null;
  }

  /**
   * --- AUTOMATICKÝ CRON PLÁNOVAČ (3x denně v 03:00, 11:00 a 19:00) ---
   * Spustí kontroly aktualizací vybraných předpisů (Občanský zákoník 89/2012, zOSPOD 359/1999)
   * s MAXIMÁLNĚ 1 voláním API na jedno spuštění.
   */
  static initCronScheduler() {
    if (this.cronTaskScheduled) return;
    this.cronTaskScheduled = true;

    // Cron výraz pro spuštění přesně 3x denně (03:00, 11:00, 19:00)
    cron.schedule('0 3,11,19 * * *', async () => {
      console.log('[e-Sbírka Cron] Spouštím plánovanou kontrolu aktualizací předpisů (3x denně)...');

      // Vybereme 1 předpis v rotaci (max 1 volání API na spuštění)
      const target = this.PRIORITY_LAWS[this.cronRotationIndex % this.PRIORITY_LAWS.length];
      this.cronRotationIndex++;

      try {
        console.log(`[e-Sbírka Cron] Kontrola předpisu ${target.cislo}/${target.rok} (${target.title})...`);
        await this.syncLaw(target.cislo, target.rok);
        console.log(`[e-Sbírka Cron] Plánovaná synchronizace pro ${target.cislo}/${target.rok} byla úspěšná.`);
      } catch (err: any) {
        console.warn(`[e-Sbírka Cron Info] Plánovaná synchronizace přeskočena/selhala: ${err.message}`);
      }
    });

    console.log('[e-Sbírka Cron] Automatický plánovač úspěšně inicializován (3x denně: 03:00, 11:00, 19:00).');
  }
}
