import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { analyticsService } from '../src/services/analyticsService';
import { dbStore } from '../src/services/dbStore';

describe('Analytics 2.0 - User Journey, Funnels & Search Intelligence Tests', () => {
  const testSessionId1 = 'sess_test_journey_001';
  const testSessionId2 = 'sess_test_journey_002';
  const testSessionId3 = 'sess_test_journey_003';
  const testUserId = 'usr_test_father_123';

  before(async () => {
    // Seed some test analytics events for session 1
    await analyticsService.recordEvent({
      sessionId: testSessionId1,
      eventType: 'session_start',
      route: '/',
      metadata: { referrer: 'direct' },
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId1,
      eventType: 'page_view',
      route: '/kalkulacka-vyzivneho',
      metadata: {},
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId1,
      eventType: 'feature_open',
      route: '/kalkulacka-vyzivneho',
      featureId: 'alimony_calculator',
      metadata: { step: 1, stepName: 'Otevření kalkulačky' },
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId1,
      eventType: 'feature_use',
      route: '/kalkulacka-vyzivneho',
      featureId: 'alimony_calculator',
      metadata: { step: 2, stepName: 'Zadání příjmů a počtu dětí' },
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId1,
      eventType: 'feature_complete',
      route: '/kalkulacka-vyzivneho',
      featureId: 'alimony_calculator',
      metadata: { step: 4, stepName: 'Zobrazení a export výsledku', durationSeconds: 45 },
    });

    // Seed session 2: Generátor podání with drop-off at step 2
    await analyticsService.recordEvent({
      sessionId: testSessionId2,
      userId: testUserId,
      eventType: 'session_start',
      route: '/generator-podani',
      metadata: {},
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId2,
      userId: testUserId,
      eventType: 'feature_open',
      route: '/generator-podani',
      featureId: 'generator_podani',
      metadata: { step: 1, stepName: 'Výběr typu podání' },
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId2,
      userId: testUserId,
      eventType: 'feature_use',
      route: '/generator-podani',
      featureId: 'generator_podani',
      metadata: { step: 2, stepName: 'Identifikace účastníků & soudu' },
    });

    // Seed search queries (with and without results)
    await analyticsService.recordEvent({
      sessionId: testSessionId3,
      eventType: 'search',
      route: '/vyhledavani',
      metadata: { query: 'střídavá péče judikatura', category: 'judikatura', resultsCount: 14 },
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId3,
      eventType: 'search',
      route: '/vyhledavani',
      metadata: { query: 'výkon rozhodnutí styk', category: 'vzory', resultsCount: 0 },
    });

    await analyticsService.recordEvent({
      sessionId: testSessionId3,
      eventType: 'search',
      route: '/vyhledavani',
      metadata: { query: 'výkon rozhodnutí styk', category: 'vzory', resultsCount: 0 },
    });
  });

  it('1. Zero-PII Sanitization strips forbidden keys', async () => {
    const recordedEvent = await analyticsService.recordEvent({
      sessionId: 'sess_pii_test',
      eventType: 'feature_use',
      route: '/generator-podani',
      featureId: 'generator_podani',
      metadata: {
        step: 2,
        stepName: 'Identifikace účastníků & soudu',
        password: 'SuperSecretPassword123!',
        token: 'eyJh...token',
        ssn: '123456/7890',
        childName: 'Jan Novák',
        legalCaseNotes: 'Citlivé poznámky o sporu',
      },
    });

    assert.ok(recordedEvent);
    assert.ok(recordedEvent.id);
    const meta = recordedEvent.metadata || {};
    assert.equal(meta.step, 2);
    assert.equal(meta.stepName, 'Identifikace účastníků & soudu');
    assert.equal(meta.password, undefined);
    assert.equal(meta.token, undefined);
    assert.equal(meta.ssn, undefined);
    assert.equal(meta.childName, undefined);
    assert.equal(meta.legalCaseNotes, undefined);
  });

  it('2. User Journey Analytics reconstructs entry/exit pages and transitions', async () => {
    const journey = await analyticsService.getUserJourneyStats('all');

    assert.ok(journey);
    assert.ok(journey.totalSessionsAnalyzed >= 2);
    assert.ok(journey.entryPages.length > 0);
    assert.ok(journey.exitPages.length > 0);

    const hasLanding = journey.entryPages.some((e) => e.route === '/' || e.route === '/generator-podani');
    assert.equal(hasLanding, true);

    assert.ok(Array.isArray(journey.topTransitions));
  });

  it('3. Funnel Analytics correctly computes conversion and drop-off steps', async () => {
    const alimonyFunnel = await analyticsService.getFunnelStats('alimony_calculator', 'all');

    assert.ok(alimonyFunnel);
    assert.equal(alimonyFunnel.funnelId, 'alimony_calculator');
    assert.ok(alimonyFunnel.totalStarts >= 1);
    assert.ok(alimonyFunnel.totalCompletions >= 1);
    assert.equal(alimonyFunnel.completionRate, 100);

    const generatorFunnel = await analyticsService.getFunnelStats('generator_podani', 'all');
    assert.ok(generatorFunnel);
    assert.equal(generatorFunnel.funnelId, 'generator_podani');
    assert.ok(generatorFunnel.totalStarts >= 1);
    assert.ok(generatorFunnel.steps.length >= 2);
  });

  it('4. Search Intelligence tracks top queries and zero-result queries', async () => {
    const searchStats = await analyticsService.getSearchIntelligence('all');

    assert.ok(searchStats);
    assert.ok(searchStats.totalSearches >= 3);
    assert.ok(searchStats.uniqueQueriesCount >= 2);

    // Verify zero results query detection
    const zeroResults = searchStats.zeroResultQueries;
    assert.ok(zeroResults.length >= 1);
    const missingTopic = zeroResults.find((q) => q.query.includes('výkon rozhodnutí'));
    assert.ok(missingTopic);
    assert.ok(missingTopic.count >= 2);
  });

  it('5. Deep Feature Analytics computes usage, completion and duration metrics', async () => {
    const features = await analyticsService.getFeatureDeepAnalytics('all');

    assert.ok(Array.isArray(features));
    assert.ok(features.length > 0);

    const alimony = features.find((f) => f.featureId === 'alimony_calculator');
    assert.ok(alimony);
    assert.ok(alimony.openCount >= 1);
    assert.ok(alimony.completeCount >= 1);
    assert.equal(alimony.completionRate, 100);
  });

  it('6. Individual User History returns timeline and logs administrative audit', async () => {
    const adminUser = { id: 'admin_auditor_01', email: 'admin@tatovacesta.cz' };
    const history = await analyticsService.getUserIndividualHistory(testUserId, 'all', adminUser);

    assert.ok(history);
    assert.equal(history.userId, testUserId);
    assert.ok(history.totalEvents >= 2);
    assert.ok(history.timeline.length >= 2);
    assert.ok(history.topUsedFeatures.some((f) => f.featureId === 'generator_podani'));

    // Check that audit log entry was created in dbStore
    const recentAuditLogs = dbStore.auditLogs;
    const analyticsAuditLog = recentAuditLogs.find(
      (l: any) => l.action === 'VIEW_USER_ANALYTICS_HISTORY' && l.details?.includes(testUserId)
    );
    assert.ok(analyticsAuditLog, 'Administrative audit log must be recorded when user history is accessed');
    assert.equal(analyticsAuditLog.userId, adminUser.id);
  });

  it('7. Aggregated AI Insights identifies content gaps and bottlenecks without raw PII', async () => {
    const aiInsights = await analyticsService.getAnalyticsAiInsights('all');

    assert.ok(aiInsights);
    assert.ok(Array.isArray(aiInsights.missingContentTopics));
    assert.ok(Array.isArray(aiInsights.funnelBottlenecks));

    const missingTopic = aiInsights.missingContentTopics.find((m) => m.topic.includes('výkon'));
    assert.ok(missingTopic);
  });

  it('8. Simulation is strictly isolated and does not alter real storage', async () => {
    const realBefore = await analyticsService.computeRealStats('today');

    // Update simulation settings to active
    await analyticsService.updateSettings({
      simulatedActivityEnabled: true,
      simulationMultiplier: 3.5,
      simulationMin: 10,
      simulationMax: 25,
      publicStatsEnabled: true,
      simulationTimeWindow: 15,
    });

    const publicStats = await analyticsService.getPublicSummary();
    const realAfter = await analyticsService.computeRealStats('today');

    // Real stats should remain identical
    assert.equal(realAfter.visitsToday, realBefore.visitsToday);
    assert.equal(realAfter.pageViewsToday, realBefore.pageViewsToday);
    assert.equal(realAfter.completedFeaturesCount, realBefore.completedFeaturesCount);

    // Public stats should reflect the presentation simulation
    assert.ok(publicStats.isSimulationActive);
    assert.ok(publicStats.activeVisitorsNow >= 10);
  });

  it('9. Retention cleanup removes events older than 90 days', async () => {
    // Record an event with old timestamp in dbStore
    const oldTimestamp = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    dbStore.analyticsEvents.push({
      id: 'old_event_100_days',
      sessionId: 'old_session',
      eventType: 'page_view',
      route: '/old-page',
      metadata: {},
      isAnonymous: true,
      timestamp: oldTimestamp,
      createdAt: oldTimestamp,
    });

    const cleanResult = await analyticsService.cleanOldEvents(90);
    assert.ok(cleanResult.deletedCount >= 1);

    const remainingOld = dbStore.analyticsEvents.find((e: any) => e.id === 'old_event_100_days');
    assert.equal(remainingOld, undefined, 'Old event must be removed by retention cleanup');
  });
});
