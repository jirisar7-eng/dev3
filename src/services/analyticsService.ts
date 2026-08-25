import crypto from 'crypto';
import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsSetting,
  PublicActivitySummary,
  AdminAnalyticsStats,
} from '../types';

// Human-friendly labels for feature IDs
const FEATURE_LABELS: Record<string, string> = {
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
};

export class AnalyticsService {
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
    let events: AnalyticsEvent[] = eventsParam || dbStore.analyticsEvents || [];
    if (!eventsParam && isPrismaAvailable()) {
      try {
        const dbEvents = await prisma.analyticsEvent.findMany({
          orderBy: { timestamp: 'desc' },
          take: 20000,
        });
        if (dbEvents && dbEvents.length > 0) {
          events = dbEvents.map((e) => ({
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
      } catch {
        // Fallback to memory store
      }
    }
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
          if (evt.eventType === 'feature_open' || evt.eventType === 'feature_use') {
            featureCounts[evt.featureId].count++;
          } else if (evt.eventType === 'feature_complete') {
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
    let events: AnalyticsEvent[] = dbStore.analyticsEvents;

    if (isPrismaAvailable()) {
      try {
        const dbEvents = await prisma.analyticsEvent.findMany({
          orderBy: { timestamp: 'desc' },
          take: 20000,
        });
        if (dbEvents && dbEvents.length > 0) {
          events = dbEvents.map((e) => ({
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
