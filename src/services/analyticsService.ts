import crypto from 'crypto';
import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsSetting,
  PublicActivitySummary,
  AdminAnalyticsStats,
  AnalyticsTimeRange,
  UserJourneyStats,
  UserJourneyPath,
  UserJourneyTransition,
  FunnelStats,
  FunnelStepStats,
  SearchIntelligenceStats,
  SearchQueryStat,
  FeatureAnalyticsDeepStat,
  UserAnalyticsHistory,
  UserTimelineEvent,
  AnalyticsAiInsightsData,
} from '../types';

// Human-friendly labels for feature IDs
export const FEATURE_LABELS: Record<string, string> = {
  alimony_calculator: 'Kalkulačka výživného',
  care_simulator: 'Plánovač a simulátor péče',
  judgment_parser: 'Opatrovnický AI Parser rozsudků',
  my_case_dossier: 'Osobní spis otce',
  coparent_hub: 'CoParent Hub (Komunikace)',
  studies_search: 'Knihovna vědeckých studií',
  legal_wiki: 'Právní výkladový slovník',
  court_cases_db: 'Případová judikatura',
  volunteer_agreement: 'Elektronická dohoda dobrovolníka',
  contact_form: 'Kontaktní formulář',
  quizzes: 'Tréninkové kvízy',
  videotheque: 'Videotéka a webináře',
  state_statistics: 'Státní statistiky opatrovnictví',
  generator_podani: 'Generátor právních podání a návrhů',
  consultation_booking: 'Rezervace právní konzultace',
};

// Default registered funnels configuration
export const REGISTERED_FUNNELS: {
  id: string;
  title: string;
  featureId?: string;
  defaultSteps: { stepIndex: number; stepName: string }[];
}[] = [
  {
    id: 'generator_podani',
    title: 'Generátor podání a návrhů k soudu',
    featureId: 'generator_podani',
    defaultSteps: [
      { stepIndex: 1, stepName: 'Výběr typu podání' },
      { stepIndex: 2, stepName: 'Identifikace účastníků & soudu' },
      { stepIndex: 3, stepName: 'Skutková tvrzení & odůvodnění' },
      { stepIndex: 4, stepName: 'Důkazy a návrh výroku' },
      { stepIndex: 5, stepName: 'Vygenerování a stažení' },
    ],
  },
  {
    id: 'alimony_calculator',
    title: 'Výpočet výživného (Doporučující tabulky MS ČR)',
    featureId: 'alimony_calculator',
    defaultSteps: [
      { stepIndex: 1, stepName: 'Otevření kalkulačky' },
      { stepIndex: 2, stepName: 'Zadání příjmů a počtu dětí' },
      { stepIndex: 3, stepName: 'Zadání podílu péče a nákladů' },
      { stepIndex: 4, stepName: 'Zobrazení a export výsledku' },
    ],
  },
  {
    id: 'care_simulator',
    title: 'Plánovač a simulátor střídavé péče',
    featureId: 'care_simulator',
    defaultSteps: [
      { stepIndex: 1, stepName: 'Zahájení plánování' },
      { stepIndex: 2, stepName: 'Konfigurace cyklů střídání' },
      { stepIndex: 3, stepName: 'Nastavení svátků a prázdnin' },
      { stepIndex: 4, stepName: 'Uložení / export harmonogramu' },
    ],
  },
  {
    id: 'consultation_booking',
    title: 'Rezervace online konzultace s poradcem',
    featureId: 'consultation_booking',
    defaultSteps: [
      { stepIndex: 1, stepName: 'Výběr tématu a poradce' },
      { stepIndex: 2, stepName: 'Výběr termínu' },
      { stepIndex: 3, stepName: 'Kontaktní údaje' },
      { stepIndex: 4, stepName: 'Potvrzení rezervace' },
    ],
  },
];

export class AnalyticsService {
  constructor() {
    // Start periodic 90-day retention cleanup every 24 hours (unref to avoid hanging node processes)
    const cleanupTimer = setInterval(() => {
      this.cleanOldEvents(90).catch((err) => {
        console.warn('[AnalyticsService] Periodic retention cleanup failed:', err);
      });
    }, 24 * 60 * 60 * 1000);

    if (typeof cleanupTimer.unref === 'function') {
      cleanupTimer.unref();
    }
  }

  /**
   * Sanitizes input metadata to guarantee no PII, tokens, or confidential legal content is stored.
   */
  private sanitizeMetadata(metadata?: Record<string, any> | null): Record<string, any> {
    if (!metadata || typeof metadata !== 'object') return {};

    const clean: Record<string, any> = {};
    const allowedKeys = [
      'durationSeconds',
      'query',
      'category',
      'step',
      'totalSteps',
      'status',
      'format',
      'docType',
      'source',
      'resultsCount',
      'targetRoute',
      'previousRoute',
      'stepName',
      'funnelId',
      'flowType',
      'actionType',
      'filter',
      'hasResults',
    ];

    for (const key of allowedKeys) {
      if (metadata[key] !== undefined) {
        if (key === 'query' && typeof metadata[key] === 'string') {
          // Truncate and strip any email/phone patterns from search queries
          let q = metadata[key].trim().substring(0, 80);
          q = q.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
          q = q.replace(/(?:\+420)?\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{3}/g, '[REDACTED_PHONE]');
          clean.query = q;
        } else if (typeof metadata[key] === 'number' || typeof metadata[key] === 'boolean') {
          clean[key] = metadata[key];
        } else if (typeof metadata[key] === 'string') {
          clean[key] = metadata[key].substring(0, 100);
        }
      }
    }

    return clean;
  }

  /**
   * Filters events by standard time ranges: today, 7d, 30d, or all.
   */
  filterEventsByTimeRange(
    events: AnalyticsEvent[],
    timeRange: AnalyticsTimeRange = '30d',
    now: Date = new Date()
  ): AnalyticsEvent[] {
    if (timeRange === 'all') return events;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let cutoffMs = startOfToday;

    if (timeRange === 'today') {
      cutoffMs = startOfToday;
    } else if (timeRange === '7d') {
      cutoffMs = startOfToday - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === '30d') {
      cutoffMs = startOfToday - 30 * 24 * 60 * 60 * 1000;
    }

    return events.filter((evt) => new Date(evt.timestamp).getTime() >= cutoffMs);
  }

  /**
   * Records a single analytics event.
   * Real data is immutably written to database / store.
   */
  async recordEvent(params: {
    sessionId: string;
    eventType: AnalyticsEventType | string;
    route: string;
    userId?: string | null;
    featureId?: string | null;
    metadata?: Record<string, any> | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<AnalyticsEvent> {
    const isAnonymous = !params.userId;
    const sanitizedMeta = this.sanitizeMetadata(params.metadata);
    const sanitizedRoute = (params.route || '/').split('?')[0].substring(0, 200);
    const sanitizedFeature = params.featureId ? params.featureId.substring(0, 80) : null;
    const sanitizedSessionId = (params.sessionId || 'anonymous-session').substring(0, 100);

    let anonymizedIp: string | null = null;
    if (params.ip) {
      anonymizedIp = crypto
        .createHash('sha256')
        .update(params.ip + '_salt_' + new Date().toISOString().substring(0, 10))
        .digest('hex')
        .substring(0, 16);
    }

    const event: AnalyticsEvent = {
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      sessionId: sanitizedSessionId,
      userId: params.userId || null,
      eventType: params.eventType,
      route: sanitizedRoute,
      featureId: sanitizedFeature,
      metadata: sanitizedMeta,
      isAnonymous,
      ipHash: anonymizedIp,
      createdAt: new Date().toISOString(),
    };

    // Store in memory
    dbStore.analyticsEvents.push(event);
    if (dbStore.analyticsEvents.length > 50000) {
      // Keep memory bounded to 50k recent records
      dbStore.analyticsEvents = dbStore.analyticsEvents.slice(-40000);
    }

    // Persist to Prisma if available
    if (isPrismaAvailable()) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            id: event.id,
            timestamp: new Date(event.timestamp),
            sessionId: event.sessionId,
            userId: event.userId,
            eventType: event.eventType,
            route: event.route,
            featureId: event.featureId,
            metadata: event.metadata as any,
            isAnonymous: event.isAnonymous,
          },
        });
      } catch (err) {
        console.warn('[AnalyticsService] Prisma event create error, kept in memory fallback:', err);
      }
    }

    return event;
  }

  /**
   * Retrieves all events from DB or in-memory fallback.
   */
  async getAllEvents(): Promise<AnalyticsEvent[]> {
    if (isPrismaAvailable()) {
      try {
        const dbEvents = await prisma.analyticsEvent.findMany({
          orderBy: { timestamp: 'desc' },
          take: 30000,
        });
        if (dbEvents && dbEvents.length > 0) {
          return dbEvents.map((e) => ({
            id: e.id,
            timestamp: e.timestamp.toISOString(),
            sessionId: e.sessionId,
            userId: e.userId,
            eventType: e.eventType,
            route: e.route,
            featureId: e.featureId,
            metadata: (e.metadata as any) || {},
            isAnonymous: e.isAnonymous,
            createdAt: e.createdAt.toISOString(),
          }));
        }
      } catch (err) {
        console.warn('[AnalyticsService] Error querying Prisma events, falling back to memory store:', err);
      }
    }
    return dbStore.analyticsEvents;
  }

  /**
   * Retrieves analytics settings.
   */
  async getSettings(): Promise<AnalyticsSetting> {
    if (isPrismaAvailable()) {
      try {
        const found = await prisma.analyticsSetting.findFirst();
        if (found) {
          return {
            id: found.id,
            publicStatsEnabled: found.publicStatsEnabled,
            simulatedActivityEnabled: found.simulatedActivityEnabled,
            simulationMultiplier: found.simulationMultiplier,
            simulationMin: found.simulationMin,
            simulationMax: found.simulationMax,
            simulationTimeWindow: found.simulationTimeWindow,
            updatedAt: found.updatedAt.toISOString(),
          };
        }
      } catch (err) {
        console.warn('[AnalyticsService] Error reading settings from Prisma, using memory fallback:', err);
      }
    }
    return dbStore.analyticsSetting;
  }

  /**
   * Updates analytics settings (Admin only).
   */
  async updateSettings(
    newSettings: Partial<AnalyticsSetting>,
    adminUser?: { id: string; email: string }
  ): Promise<AnalyticsSetting> {
    const updated: AnalyticsSetting = {
      ...dbStore.analyticsSetting,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };

    dbStore.analyticsSetting = updated;

    if (isPrismaAvailable()) {
      try {
        const existing = await prisma.analyticsSetting.findFirst();
        if (existing) {
          await prisma.analyticsSetting.update({
            where: { id: existing.id },
            data: {
              publicStatsEnabled: updated.publicStatsEnabled,
              simulatedActivityEnabled: updated.simulatedActivityEnabled,
              simulationMultiplier: updated.simulationMultiplier,
              simulationMin: updated.simulationMin,
              simulationMax: updated.simulationMax,
              simulationTimeWindow: updated.simulationTimeWindow,
            },
          });
        } else {
          await prisma.analyticsSetting.create({
            data: {
              id: updated.id,
              publicStatsEnabled: updated.publicStatsEnabled,
              simulatedActivityEnabled: updated.simulatedActivityEnabled,
              simulationMultiplier: updated.simulationMultiplier,
              simulationMin: updated.simulationMin,
              simulationMax: updated.simulationMax,
              simulationTimeWindow: updated.simulationTimeWindow,
            },
          });
        }
      } catch (err) {
        console.warn('[AnalyticsService] Error persisting settings to Prisma:', err);
      }
    }

    dbStore.logAudit(
      'UPDATE_ANALYTICS_SETTINGS',
      'ANALYTICS',
      `Updated settings: simulatedActivityEnabled=${updated.simulatedActivityEnabled}, multiplier=${updated.simulationMultiplier}`,
      adminUser as any
    );

    return updated;
  }

  /**
   * Computes user journey statistics, transitions, paths, and entry/exit pages.
   */
  async getUserJourneyStats(
    timeRange: AnalyticsTimeRange = '30d',
    eventsParam?: AnalyticsEvent[]
  ): Promise<UserJourneyStats> {
    const rawEvents = eventsParam || (await this.getAllEvents());
    const filteredEvents = this.filterEventsByTimeRange(rawEvents, timeRange);

    // Group events by session
    const sessionMap = new Map<string, AnalyticsEvent[]>();
    for (const evt of filteredEvents) {
      if (!sessionMap.has(evt.sessionId)) {
        sessionMap.set(evt.sessionId, []);
      }
      sessionMap.get(evt.sessionId)!.push(evt);
    }

    const entryCounts: Record<string, number> = {};
    const exitCounts: Record<string, number> = {};
    const pathCounts: Record<string, number> = {};
    const transitionCounts: Record<string, number> = {};
    const featureComboCounts: Record<string, number> = {};

    let totalSteps = 0;
    let totalDurationSeconds = 0;
    let validDurationCount = 0;

    sessionMap.forEach((sessionEvents) => {
      // Sort chronologically
      sessionEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (sessionEvents.length === 0) return;

      const firstEvt = sessionEvents[0];
      const lastEvt = sessionEvents[sessionEvents.length - 1];

      entryCounts[firstEvt.route] = (entryCounts[firstEvt.route] || 0) + 1;
      exitCounts[lastEvt.route] = (exitCounts[lastEvt.route] || 0) + 1;

      totalSteps += sessionEvents.length;

      const durationSec = Math.round(
        (new Date(lastEvt.timestamp).getTime() - new Date(firstEvt.timestamp).getTime()) / 1000
      );
      if (durationSec > 0 && durationSec < 7200) {
        totalDurationSeconds += durationSec;
        validDurationCount++;
      }

      // Reconstruct path sequence (deduplicating adjacent identical routes)
      const pageRoutes: string[] = [];
      const usedFeatures = new Set<string>();

      for (let i = 0; i < sessionEvents.length; i++) {
        const curr = sessionEvents[i];
        if (curr.route && (pageRoutes.length === 0 || pageRoutes[pageRoutes.length - 1] !== curr.route)) {
          pageRoutes.push(curr.route);
        }
        if (curr.featureId) {
          usedFeatures.add(curr.featureId);
        }

        if (i < sessionEvents.length - 1) {
          const next = sessionEvents[i + 1];
          if (curr.route !== next.route) {
            const transKey = `${curr.route} -> ${next.route}`;
            transitionCounts[transKey] = (transitionCounts[transKey] || 0) + 1;
          }
        }
      }

      if (pageRoutes.length >= 2) {
        const pathKey = pageRoutes.slice(0, 4).join(' → ');
        pathCounts[pathKey] = (pathCounts[pathKey] || 0) + 1;
      }

      if (usedFeatures.size >= 2) {
        const comboKey = Array.from(usedFeatures).sort().join(' + ');
        featureComboCounts[comboKey] = (featureComboCounts[comboKey] || 0) + 1;
      }
    });

    const totalSessions = sessionMap.size || 1;

    const entryPages = Object.entries(entryCounts)
      .map(([route, count]) => ({
        route,
        count,
        percentage: Math.round((count / totalSessions) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const exitPages = Object.entries(exitCounts)
      .map(([route, count]) => ({
        route,
        count,
        percentage: Math.round((count / totalSessions) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const topPaths: UserJourneyPath[] = Object.entries(pathCounts)
      .map(([pathStr, count]) => ({
        path: pathStr.split(' → '),
        count,
        percentage: Math.round((count / totalSessions) * 1000) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const totalTransitions = Object.values(transitionCounts).reduce((a, b) => a + b, 0) || 1;
    const topTransitions: UserJourneyTransition[] = Object.entries(transitionCounts)
      .map(([transStr, count]) => {
        const [fromRoute, toRoute] = transStr.split(' -> ');
        return {
          fromRoute: fromRoute || '/',
          toRoute: toRoute || '/',
          count,
          percentage: Math.round((count / totalTransitions) * 1000) / 10,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const featureCombinations = Object.entries(featureComboCounts)
      .map(([comboStr, count]) => ({
        features: comboStr.split(' + ').map((fId) => FEATURE_LABELS[fId] || fId),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      timeRange,
      totalSessionsAnalyzed: sessionMap.size,
      avgStepsPerSession: sessionMap.size > 0 ? Math.round((totalSteps / sessionMap.size) * 10) / 10 : 0,
      avgSessionDurationSeconds: validDurationCount > 0 ? Math.round(totalDurationSeconds / validDurationCount) : 0,
      entryPages,
      exitPages,
      topPaths,
      topTransitions,
      featureCombinations,
    };
  }

  /**
   * Computes funnel metrics for a given funnel identifier or registered presets.
   */
  async getFunnelStats(
    funnelId: string = 'generator_podani',
    timeRange: AnalyticsTimeRange = '30d',
    eventsParam?: AnalyticsEvent[]
  ): Promise<FunnelStats> {
    const rawEvents = eventsParam || (await this.getAllEvents());
    const filteredEvents = this.filterEventsByTimeRange(rawEvents, timeRange);

    const registered = REGISTERED_FUNNELS.find((f) => f.id === funnelId) || {
      id: funnelId,
      title: funnelId,
      featureId: funnelId,
      defaultSteps: [
        { stepIndex: 1, stepName: 'Start kroku 1' },
        { stepIndex: 2, stepName: 'Krok 2' },
        { stepIndex: 3, stepName: 'Dokončení' },
      ],
    };

    // Find all events relevant to this funnel
    const relevantEvents = filteredEvents.filter(
      (e) =>
        e.featureId === registered.featureId ||
        e.metadata?.funnelId === funnelId ||
        e.route.includes(funnelId.replace(/_/g, '-'))
    );

    // Group by session to see maximum step reached per session
    const sessionStepMap = new Map<string, number>();
    for (const evt of relevantEvents) {
      let stepNum = 1;
      if (evt.metadata?.step !== undefined) {
        stepNum = Number(evt.metadata.step);
      } else if (evt.eventType === 'feature_open' || evt.eventType === 'form_start') {
        stepNum = 1;
      } else if (evt.eventType === 'feature_complete' || evt.eventType === 'form_complete') {
        stepNum = registered.defaultSteps.length;
      } else if (evt.eventType === 'feature_use') {
        stepNum = 2;
      }

      const currentMax = sessionStepMap.get(evt.sessionId) || 0;
      if (stepNum > currentMax) {
        sessionStepMap.set(evt.sessionId, stepNum);
      }
    }

    const stepCounts: number[] = new Array(registered.defaultSteps.length).fill(0);
    sessionStepMap.forEach((maxStep) => {
      for (let i = 1; i <= Math.min(maxStep, registered.defaultSteps.length); i++) {
        stepCounts[i - 1]++;
      }
    });

    const firstStepCount = stepCounts[0] || 0;
    const finalStepCount = stepCounts[stepCounts.length - 1] || 0;

    let maxDropOffCount = -1;
    let biggestDropOff: { stepIndex: number; stepName: string; dropOffCount: number; dropOffRate: number } | undefined;

    const steps: FunnelStepStats[] = registered.defaultSteps.map((s, idx) => {
      const count = stepCounts[idx] || 0;
      const nextCount = idx < stepCounts.length - 1 ? stepCounts[idx + 1] || 0 : count;
      const dropOffCount = Math.max(0, count - nextCount);
      const dropOffRate = count > 0 ? Math.round((dropOffCount / count) * 1000) / 10 : 0;
      const conversionFromFirstStep = firstStepCount > 0 ? Math.round((count / firstStepCount) * 1000) / 10 : 0;
      const prevCount = idx > 0 ? stepCounts[idx - 1] || 1 : count;
      const conversionFromPrevStep = prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : 100;

      if (idx < registered.defaultSteps.length - 1 && dropOffCount > maxDropOffCount) {
        maxDropOffCount = dropOffCount;
        biggestDropOff = {
          stepIndex: s.stepIndex,
          stepName: s.stepName,
          dropOffCount,
          dropOffRate,
        };
      }

      return {
        stepIndex: s.stepIndex,
        stepName: s.stepName,
        count,
        dropOffCount,
        dropOffRate,
        conversionFromFirstStep,
        conversionFromPrevStep,
      };
    });

    const completionRate = firstStepCount > 0 ? Math.round((finalStepCount / firstStepCount) * 1000) / 10 : 0;
    const abandonmentRate = Math.round((100 - completionRate) * 10) / 10;

    return {
      funnelId,
      title: registered.title,
      featureId: registered.featureId,
      timeRange,
      totalStarts: firstStepCount,
      totalCompletions: finalStepCount,
      completionRate,
      abandonmentRate,
      biggestDropOffStep: biggestDropOff,
      steps,
    };
  }

  /**
   * Computes search intelligence, top queries, zero results, and trend metrics.
   */
  async getSearchIntelligence(
    timeRange: AnalyticsTimeRange = '30d',
    eventsParam?: AnalyticsEvent[]
  ): Promise<SearchIntelligenceStats> {
    const rawEvents = eventsParam || (await this.getAllEvents());
    const filteredEvents = this.filterEventsByTimeRange(rawEvents, timeRange);

    const searchEvents = filteredEvents.filter((e) => e.eventType === 'search' && e.metadata?.query);

    const queryAgg: Record<
      string,
      {
        count: number;
        totalResults: number;
        zeroResultsCount: number;
        lastSearchedAt: string;
      }
    > = {};

    const dailyAgg: Record<string, { total: number; zeroResults: number }> = {};

    for (const evt of searchEvents) {
      const q = String(evt.metadata!.query).toLowerCase().trim();
      if (q.length < 2) continue;

      const resultsCount = typeof evt.metadata?.resultsCount === 'number' ? evt.metadata.resultsCount : 1;
      const isZero = resultsCount === 0 || evt.metadata?.hasResults === false;

      if (!queryAgg[q]) {
        queryAgg[q] = {
          count: 0,
          totalResults: 0,
          zeroResultsCount: 0,
          lastSearchedAt: evt.timestamp,
        };
      }

      queryAgg[q].count++;
      queryAgg[q].totalResults += resultsCount;
      if (isZero) {
        queryAgg[q].zeroResultsCount++;
      }
      if (new Date(evt.timestamp).getTime() > new Date(queryAgg[q].lastSearchedAt).getTime()) {
        queryAgg[q].lastSearchedAt = evt.timestamp;
      }

      const dayKey = evt.timestamp.substring(0, 10);
      if (!dailyAgg[dayKey]) {
        dailyAgg[dayKey] = { total: 0, zeroResults: 0 };
      }
      dailyAgg[dayKey].total++;
      if (isZero) {
        dailyAgg[dayKey].zeroResults++;
      }
    }

    const totalSearches = searchEvents.length;
    const uniqueQueriesCount = Object.keys(queryAgg).length;

    let totalZeroResults = 0;
    let sumResults = 0;

    const topQueries: SearchQueryStat[] = [];
    const zeroResultQueries: SearchQueryStat[] = [];

    for (const q in queryAgg) {
      const item = queryAgg[q];
      totalZeroResults += item.zeroResultsCount;
      sumResults += item.totalResults;

      const avgResults = item.count > 0 ? Math.round((item.totalResults / item.count) * 10) / 10 : 0;
      const hasResults = item.zeroResultsCount < item.count;

      const statObj: SearchQueryStat = {
        query: q,
        count: item.count,
        resultsCountAvg: avgResults,
        hasResults,
        lastSearchedAt: item.lastSearchedAt,
      };

      topQueries.push(statObj);

      if (item.zeroResultsCount > 0) {
        zeroResultQueries.push({
          query: q,
          count: item.zeroResultsCount,
          resultsCountAvg: 0,
          hasResults: false,
          lastSearchedAt: item.lastSearchedAt,
        });
      }
    }

    topQueries.sort((a, b) => b.count - a.count);
    zeroResultQueries.sort((a, b) => b.count - a.count);

    const zeroResultsRate = totalSearches > 0 ? Math.round((totalZeroResults / totalSearches) * 1000) / 10 : 0;
    const avgResultsCount = totalSearches > 0 ? Math.round((sumResults / totalSearches) * 10) / 10 : 0;

    const searchesByDay = Object.entries(dailyAgg)
      .map(([date, counts]) => ({
        date,
        total: counts.total,
        zeroResults: counts.zeroResults,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      timeRange,
      totalSearches,
      uniqueQueriesCount,
      zeroResultsCount: totalZeroResults,
      zeroResultsRate,
      avgResultsCount,
      topQueries: topQueries.slice(0, 20),
      zeroResultQueries: zeroResultQueries.slice(0, 20),
      searchesByDay,
    };
  }

  /**
   * Computes deep analytics for all interactive features/modules.
   */
  async getFeatureDeepAnalytics(
    timeRange: AnalyticsTimeRange = '30d',
    eventsParam?: AnalyticsEvent[]
  ): Promise<FeatureAnalyticsDeepStat[]> {
    const rawEvents = eventsParam || (await this.getAllEvents());
    const filteredEvents = this.filterEventsByTimeRange(rawEvents, timeRange);

    const featureStatsMap: Record<
      string,
      {
        openCount: number;
        useCount: number;
        completeCount: number;
        durations: number[];
        users: Set<string>;
      }
    > = {};

    // Initialize all registered features
    for (const fId in FEATURE_LABELS) {
      featureStatsMap[fId] = {
        openCount: 0,
        useCount: 0,
        completeCount: 0,
        durations: [],
        users: new Set(),
      };
    }

    for (const evt of filteredEvents) {
      if (!evt.featureId) continue;
      const fId = evt.featureId;
      if (!featureStatsMap[fId]) {
        featureStatsMap[fId] = {
          openCount: 0,
          useCount: 0,
          completeCount: 0,
          durations: [],
          users: new Set(),
        };
      }

      if (evt.eventType === 'feature_open' || evt.eventType === 'form_start') {
        featureStatsMap[fId].openCount++;
      } else if (evt.eventType === 'feature_use') {
        featureStatsMap[fId].useCount++;
      } else if (evt.eventType === 'feature_complete' || evt.eventType === 'form_complete') {
        featureStatsMap[fId].completeCount++;
        if (evt.metadata?.durationSeconds) {
          featureStatsMap[fId].durations.push(Number(evt.metadata.durationSeconds));
        }
      }

      const userIdentifier = evt.userId || evt.sessionId;
      featureStatsMap[fId].users.add(userIdentifier);
    }

    const results: FeatureAnalyticsDeepStat[] = Object.entries(featureStatsMap).map(([featureId, stats]) => {
      const totalStarts = stats.openCount > 0 ? stats.openCount : stats.useCount + stats.completeCount;
      const completionRate = totalStarts > 0 ? Math.round((stats.completeCount / totalStarts) * 1000) / 10 : 0;
      const abandonmentRate = Math.round((100 - completionRate) * 10) / 10;
      const avgDuration =
        stats.durations.length > 0
          ? Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length)
          : 0;

      return {
        featureId,
        label: FEATURE_LABELS[featureId] || featureId,
        openCount: stats.openCount,
        useCount: stats.useCount,
        completeCount: stats.completeCount,
        completionRate,
        abandonmentRate,
        avgDurationSeconds: avgDuration,
        uniqueUsersCount: stats.users.size,
      };
    });

    results.sort((a, b) => b.openCount + b.useCount - (a.openCount + a.useCount));
    return results;
  }

  /**
   * Retrieves individual user analytics history with mandatory audit logging.
   * Never leaks passwords, tokens, or legal case files.
   */
  async getUserIndividualHistory(
    userId: string,
    timeRange: AnalyticsTimeRange = 'all',
    adminUser?: { id: string; email: string }
  ): Promise<UserAnalyticsHistory> {
    if (!userId) {
      throw new Error('Chybí povinný identifikátor uživatele');
    }

    // MANDATORY AUDIT LOG
    dbStore.logAudit(
      'VIEW_USER_ANALYTICS_HISTORY',
      'ANALYTICS',
      `Admin accessed analytics history for userId=${userId}`,
      adminUser as any
    );

    const rawEvents = await this.getAllEvents();
    const userEvents = rawEvents
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const filtered = this.filterEventsByTimeRange(userEvents, timeRange);

    const sessions = new Set<string>();
    const featureCountMap: Record<string, number> = {};
    let totalDurationSeconds = 0;

    const timeline: UserTimelineEvent[] = filtered.map((evt) => {
      sessions.add(evt.sessionId);
      if (evt.featureId) {
        featureCountMap[evt.featureId] = (featureCountMap[evt.featureId] || 0) + 1;
      }
      if (evt.metadata?.durationSeconds) {
        totalDurationSeconds += Number(evt.metadata.durationSeconds);
      }

      let desc = `Zobrazení stránky ${evt.route}`;
      if (evt.eventType === 'feature_open') {
        desc = `Otevření nástroje: ${FEATURE_LABELS[evt.featureId || ''] || evt.featureId}`;
      } else if (evt.eventType === 'feature_complete') {
        desc = `Dokončení akce v nástroji: ${FEATURE_LABELS[evt.featureId || ''] || evt.featureId}`;
      } else if (evt.eventType === 'search') {
        desc = `Hledání výrazu: "${evt.metadata?.query || ''}"`;
      } else if (evt.eventType === 'document_download') {
        desc = `Stažení dokumentu: ${evt.metadata?.docType || evt.route}`;
      } else if (evt.eventType === 'login') {
        desc = `Přihlášení do systému`;
      } else if (evt.eventType === 'logout') {
        desc = `Odhlášení ze systému`;
      }

      return {
        id: evt.id,
        timestamp: evt.timestamp,
        eventType: evt.eventType,
        route: evt.route,
        featureId: evt.featureId,
        durationSeconds: evt.metadata?.durationSeconds ? Number(evt.metadata.durationSeconds) : undefined,
        safeDescription: desc,
        metadata: evt.metadata || undefined,
      };
    });

    // Reverse for UI (newest first)
    timeline.reverse();

    const topUsedFeatures = Object.entries(featureCountMap)
      .map(([fId, count]) => ({
        featureId: fId,
        label: FEATURE_LABELS[fId] || fId,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      userId,
      totalSessions: sessions.size,
      totalEvents: filtered.length,
      firstSeenAt: userEvents.length > 0 ? userEvents[0].timestamp : new Date().toISOString(),
      lastSeenAt: userEvents.length > 0 ? userEvents[userEvents.length - 1].timestamp : new Date().toISOString(),
      totalDurationMinutes: Math.round(totalDurationSeconds / 60),
      topUsedFeatures,
      timeline,
    };
  }

  /**
   * Prepares structured aggregated data for future AI Studio analysis without sending raw data to external services.
   */
  async getAnalyticsAiInsights(timeRange: AnalyticsTimeRange = '30d'): Promise<AnalyticsAiInsightsData> {
    const rawEvents = await this.getAllEvents();
    const searchStats = await this.getSearchIntelligence(timeRange, rawEvents);
    const featureStats = await this.getFeatureDeepAnalytics(timeRange, rawEvents);
    const funnel = await this.getFunnelStats('generator_podani', timeRange, rawEvents);

    const missingTopics = searchStats.zeroResultQueries.slice(0, 5).map((q) => ({
      topic: q.query,
      queryCount: q.count,
      sampleQueries: [q.query],
    }));

    const underutilized = featureStats
      .filter((f) => f.openCount + f.useCount < 5)
      .slice(0, 4)
      .map((f) => ({
        featureId: f.featureId,
        label: f.label,
        useCount: f.openCount + f.useCount,
      }));

    const highEngagement = featureStats
      .filter((f) => f.completeCount >= 3 || f.completionRate >= 50)
      .slice(0, 4)
      .map((f) => ({
        featureId: f.featureId,
        label: f.label,
        completeCount: f.completeCount,
        completionRate: f.completionRate,
      }));

    return {
      timeRange,
      generatedAt: new Date().toISOString(),
      summary: {
        totalVisitors: rawEvents.length,
        totalPageViews: rawEvents.filter((e) => e.eventType === 'page_view').length,
        totalSearches: searchStats.totalSearches,
        zeroResultsRate: searchStats.zeroResultsRate,
        primaryDropOffFeature: funnel.biggestDropOffStep ? `${funnel.title} (${funnel.biggestDropOffStep.stepName})` : 'Žádný kritický drop-off',
      },
      missingContentTopics: missingTopics,
      funnelBottlenecks: funnel.biggestDropOffStep
        ? [
            {
              funnelTitle: funnel.title,
              dropOffStep: funnel.biggestDropOffStep.stepName,
              dropOffPercentage: funnel.biggestDropOffStep.dropOffRate,
              recommendation: `Zjednodušit krok "${funnel.biggestDropOffStep.stepName}" nebo přidat interaktivního průvodce s nápovědou.`,
            },
          ]
        : [],
      underutilizedFeatures: underutilized,
      highEngagementFeatures: highEngagement,
    };
  }

  /**
   * Cleans events older than standard retention days (default 90 days).
   */
  async cleanOldEvents(days: number = 90): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    // Clean memory store
    const initialLen = dbStore.analyticsEvents.length;
    dbStore.analyticsEvents = dbStore.analyticsEvents.filter((e) => new Date(e.timestamp) >= cutoffDate);
    deletedCount = initialLen - dbStore.analyticsEvents.length;

    // Clean Prisma DB if available
    if (isPrismaAvailable()) {
      try {
        const res = await prisma.analyticsEvent.deleteMany({
          where: {
            timestamp: {
              lt: cutoffDate,
            },
          },
        });
        deletedCount = res.count;
      } catch (err) {
        console.warn('[AnalyticsService] Error cleaning old events from Prisma:', err);
      }
    }

    return { deletedCount };
  }

  /**
   * Computes the simulated activity component based on diurnal pattern and settings.
   * NEVER writes to database or alters real raw event store.
   */
  async computeSimulation(settingParam?: AnalyticsSetting, now: Date = new Date()) {
    const setting = settingParam || (await this.getSettings());
    if (!setting.simulatedActivityEnabled) {
      return {
        enabled: false,
        multiplier: setting.simulationMultiplier,
        min: setting.simulationMin,
        max: setting.simulationMax,
        timeWindow: setting.simulationTimeWindow,
        simulatedActiveVisitors: 0,
        simulatedVisitsToday: 0,
        simulatedPageViewsToday: 0,
      };
    }

    const hour = now.getHours();
    // Diurnal factor between 0.2 (night) and 1.0 (afternoon 14:00 - 20:00)
    let diurnalFactor = 0.5;
    if (hour >= 1 && hour <= 6) {
      diurnalFactor = 0.15;
    } else if (hour >= 7 && hour <= 11) {
      diurnalFactor = 0.7;
    } else if (hour >= 12 && hour <= 21) {
      diurnalFactor = 1.0;
    } else {
      diurnalFactor = 0.4;
    }

    const min = Math.max(0, setting.simulationMin);
    const max = Math.max(min, setting.simulationMax);
    const range = max - min;
    const baseSim = min + Math.round(range * diurnalFactor);
    const mult = Math.max(0.1, setting.simulationMultiplier);

    const simulatedActiveVisitors = Math.round(baseSim * mult);
    // Cumulative today estimation based on passed hours of the day
    const hoursPassed = hour + now.getMinutes() / 60;
    const simulatedVisitsToday = Math.round(hoursPassed * (baseSim + 2) * mult * 1.8);
    const simulatedPageViewsToday = Math.round(simulatedVisitsToday * 2.8);

    return {
      enabled: true,
      multiplier: mult,
      min,
      max,
      timeWindow: setting.simulationTimeWindow,
      simulatedActiveVisitors,
      simulatedVisitsToday,
      simulatedPageViewsToday,
    };
  }

  /**
   * Computes 100% authentic raw statistics from the actual recorded events.
   */
  async computeRealStats(eventsParam?: AnalyticsEvent[], now: Date = new Date()) {
    const events: AnalyticsEvent[] = eventsParam || (await this.getAllEvents());
    const nowMs = now.getTime();
    const fifteenMinutesAgoMs = nowMs - 15 * 60 * 1000;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    const activeSessions = new Set<string>();
    const todaySessions = new Set<string>();
    const todayUniqueUsers = new Set<string>();
    const yesterdaySessions = new Set<string>();
    const last7DaysSessions = new Set<string>();
    const last30DaysSessions = new Set<string>();

    let pageViewsTotal = 0;
    let pageViewsToday = 0;
    let anonymousVisitsToday = 0;
    let registeredVisitsToday = 0;

    const sectionCounts: Record<string, number> = {};
    const featureCounts: Record<string, { count: number; completedCount: number; durations: number[] }> = {};
    const searchQueries: Record<string, number> = {};
    const entryPageCounts: Record<string, number> = {};
    const exitPageCounts: Record<string, number> = {};

    // Group events by session to calculate entry/exit pages
    const sessionEventsMap: Record<string, AnalyticsEvent[]> = {};
    const hourBuckets: { hour: number; visits: number; pageViews: number }[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      visits: 0,
      pageViews: 0,
    }));

    for (const evt of events) {
      const evtTime = new Date(evt.timestamp).getTime();

      if (evtTime >= fifteenMinutesAgoMs) {
        activeSessions.add(evt.sessionId);
      }

      if (evtTime >= startOfToday) {
        todaySessions.add(evt.sessionId);
        if (evt.userId) {
          todayUniqueUsers.add(evt.userId);
          registeredVisitsToday++;
        } else {
          todayUniqueUsers.add(evt.sessionId);
          anonymousVisitsToday++;
        }

        if (evt.eventType === 'page_view') {
          pageViewsToday++;
          const h = new Date(evt.timestamp).getHours();
          if (hourBuckets[h]) {
            hourBuckets[h].pageViews++;
          }
        }

        // Section counts
        const route = evt.route || '/';
        sectionCounts[route] = (sectionCounts[route] || 0) + 1;

        // Feature counts
        if (evt.featureId) {
          if (!featureCounts[evt.featureId]) {
            featureCounts[evt.featureId] = { count: 0, completedCount: 0, durations: [] };
          }
          if (evt.eventType === 'feature_open' || evt.eventType === 'feature_use' || evt.eventType === 'form_start') {
            featureCounts[evt.featureId].count++;
          } else if (evt.eventType === 'feature_complete' || evt.eventType === 'form_complete') {
            featureCounts[evt.featureId].completedCount++;
            if (evt.metadata?.durationSeconds) {
              featureCounts[evt.featureId].durations.push(Number(evt.metadata.durationSeconds));
            }
          }
        }

        // Search query count
        if (evt.eventType === 'search' && evt.metadata?.query) {
          const q = String(evt.metadata.query).toLowerCase().trim();
          if (q.length >= 2) {
            searchQueries[q] = (searchQueries[q] || 0) + 1;
          }
        }
      }

      if (evtTime >= startOfYesterday && evtTime < startOfToday) {
        yesterdaySessions.add(evt.sessionId);
      }

      if (evtTime >= sevenDaysAgo) {
        last7DaysSessions.add(evt.sessionId);
      }

      if (evtTime >= thirtyDaysAgo) {
        last30DaysSessions.add(evt.sessionId);
      }

      if (evt.eventType === 'page_view') {
        pageViewsTotal++;
      }

      // Group for entry/exit
      if (!sessionEventsMap[evt.sessionId]) {
        sessionEventsMap[evt.sessionId] = [];
      }
      sessionEventsMap[evt.sessionId].push(evt);
    }

    // Process entry & exit pages from session groups
    for (const sId in sessionEventsMap) {
      const sEvents = sessionEventsMap[sId].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      if (sEvents.length > 0) {
        const first = sEvents[0];
        const last = sEvents[sEvents.length - 1];
        entryPageCounts[first.route] = (entryPageCounts[first.route] || 0) + 1;
        exitPageCounts[last.route] = (exitPageCounts[last.route] || 0) + 1;

        const firstTime = new Date(first.timestamp).getTime();
        if (firstTime >= startOfToday) {
          const h = new Date(first.timestamp).getHours();
          if (hourBuckets[h]) {
            hourBuckets[h].visits++;
          }
        }
      }
    }

    // Top Sections sorted
    const topSections = Object.entries(sectionCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top Features sorted
    const topFeatures = Object.entries(featureCounts)
      .map(([featureId, stats]) => ({
        featureId,
        label: FEATURE_LABELS[featureId] || featureId,
        count: stats.count,
        completedCount: stats.completedCount,
      }))
      .sort((a, b) => b.count - a.count);

    let completedFeaturesCount = 0;
    let uncompletedFeaturesCount = 0;
    let totalDuration = 0;
    let durationItemsCount = 0;

    for (const fId in featureCounts) {
      completedFeaturesCount += featureCounts[fId].completedCount;
      const uncompleted = Math.max(0, featureCounts[fId].count - featureCounts[fId].completedCount);
      uncompletedFeaturesCount += uncompleted;
      for (const d of featureCounts[fId].durations) {
        totalDuration += d;
        durationItemsCount++;
      }
    }

    const avgTimeInFeatureSeconds = durationItemsCount > 0 ? Math.round(totalDuration / durationItemsCount) : undefined;

    // Top Searches
    const topQueries = Object.entries(searchQueries)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalSearchCount = Object.values(searchQueries).reduce((acc, c) => acc + c, 0);

    // Top Entry / Exit Pages
    const entryPages = Object.entries(entryPageCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const exitPages = Object.entries(exitPageCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      activeVisitorsNow: activeSessions.size,
      visitsToday: todaySessions.size,
      uniqueVisitorsToday: todayUniqueUsers.size,
      visitsYesterday: yesterdaySessions.size,
      visitsLast7Days: last7DaysSessions.size,
      visitsLast30Days: last30DaysSessions.size,
      pageViewsTotal,
      pageViewsToday,
      anonymousVisitsToday,
      registeredVisitsToday,
      topSections,
      topFeatures,
      searches: {
        totalCount: totalSearchCount,
        topQueries,
      },
      completedFeaturesCount,
      uncompletedFeaturesCount,
      avgTimeInFeatureSeconds,
      entryPages,
      exitPages,
      activityByHour: hourBuckets,
    };
  }

  /**
   * Retrieves full admin analytics payload with separated real vs simulated views.
   */
  async getAdminStats(): Promise<AdminAnalyticsStats> {
    const settings = await this.getSettings();
    const events = await this.getAllEvents();

    const real = await this.computeRealStats(events);
    const simulation = await this.computeSimulation(settings);

    const publicDisplay = {
      activeVisitorsNow: real.activeVisitorsNow + (simulation.enabled ? simulation.simulatedActiveVisitors : 0),
      visitsToday: real.visitsToday + (simulation.enabled ? simulation.simulatedVisitsToday : 0),
      pageViewsToday: real.pageViewsToday + (simulation.enabled ? simulation.simulatedPageViewsToday : 0),
      featureUsesToday:
        real.completedFeaturesCount +
        real.uncompletedFeaturesCount +
        (simulation.enabled ? Math.round(simulation.simulatedVisitsToday * 0.7) : 0),
    };

    return {
      real,
      simulation,
      publicDisplay,
      settings,
    };
  }

  /**
   * Retrieves public activity summary for the public portal.
   * Respects `publicStatsEnabled` and `simulatedActivityEnabled` settings.
   */
  async getPublicSummary(): Promise<PublicActivitySummary> {
    const settings = await this.getSettings();
    if (!settings.publicStatsEnabled) {
      return {
        activeVisitorsNow: 0,
        visitsToday: 0,
        uniqueVisitorsToday: 0,
        pageViewsToday: 0,
        featureUsesToday: 0,
        searchesToday: 0,
        topFeaturesToday: [],
        isSimulationActive: false,
        lastUpdated: new Date().toISOString(),
      };
    }

    const adminStats = await this.getAdminStats();
    const real = adminStats.real;
    const sim = adminStats.simulation;

    const activeVisitorsNow = Math.max(1, real.activeVisitorsNow + (sim.enabled ? sim.simulatedActiveVisitors : 0));
    const visitsToday = Math.max(1, real.visitsToday + (sim.enabled ? sim.simulatedVisitsToday : 0));
    const uniqueVisitorsToday = Math.max(
      1,
      real.uniqueVisitorsToday + (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.85) : 0)
    );
    const pageViewsToday = Math.max(1, real.pageViewsToday + (sim.enabled ? sim.simulatedPageViewsToday : 0));
    const featureUsesToday = Math.max(
      0,
      real.completedFeaturesCount +
        real.uncompletedFeaturesCount +
        (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.7) : 0)
    );
    const searchesToday = real.searches.totalCount + (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.3) : 0);

    const topFeaturesToday =
      real.topFeatures.length > 0
        ? real.topFeatures.slice(0, 4).map((f) => ({
            featureId: f.featureId,
            label: f.label,
            count: f.count + (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.15) : 0),
          }))
        : [
            {
              featureId: 'alimony_calculator',
              label: 'Kalkulačka výživného',
              count: 12 + (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.2) : 0),
            },
            {
              featureId: 'care_simulator',
              label: 'Plánovač a simulátor péče',
              count: 8 + (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.15) : 0),
            },
            {
              featureId: 'judgment_parser',
              label: 'Opatrovnický AI Parser',
              count: 6 + (sim.enabled ? Math.round(sim.simulatedVisitsToday * 0.1) : 0),
            },
          ];

    return {
      activeVisitorsNow,
      visitsToday,
      uniqueVisitorsToday,
      pageViewsToday,
      featureUsesToday,
      searchesToday,
      topFeaturesToday,
      isSimulationActive: sim.enabled,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
