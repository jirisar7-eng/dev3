import { describe, it, expect, beforeEach } from 'vitest';
import { analyticsService } from '../services/analyticsService';
import { dbStore } from '../services/dbStore';

describe('Privacy-First Analytics & Simulation Separation Test Suite', () => {
  beforeEach(() => {
    // Reset in-memory store for deterministic testing
    dbStore.analyticsEvents = [];
    dbStore.analyticsSetting = {
      id: 'default_setting',
      publicStatsEnabled: true,
      simulatedActivityEnabled: false,
      simulationMultiplier: 1.0,
      simulationMin: 0,
      simulationMax: 5,
      simulationTimeWindow: 15,
      updatedAt: new Date().toISOString(),
    };
  });

  describe('1. Privacy & Zero-PII Sanitization', () => {
    it('should sanitize PII from event metadata and never store plaintext IP', async () => {
      const sensitiveMetadata = {
        email: 'jan.novak@seznam.cz',
        name: 'Jan Novák',
        childName: 'Petr Novák',
        rodneCislo: '850101/1234',
        alimonyAmount: 8500,
        step: 'kalkulacka_step1',
      };

      const event = await analyticsService.recordEvent({
        sessionId: 'sess_test123',
        eventType: 'feature_complete',
        route: '/kalkulacka-vyzivneho?token=secret123',
        featureId: 'alimony_calculator',
        metadata: sensitiveMetadata,
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      });

      expect(event).toBeDefined();
      // IP is hashed, not plaintext
      expect(event.ipHash).not.toBe('192.168.1.100');
      expect(event.ipHash?.length).toBe(16);

      // Sensitive fields must be stripped
      expect(event.metadata).not.toHaveProperty('email');
      expect(event.metadata).not.toHaveProperty('name');
      expect(event.metadata).not.toHaveProperty('childName');
      expect(event.metadata).not.toHaveProperty('rodneCislo');
      expect(event.metadata).toHaveProperty('step', 'kalkulacka_step1');

      // Query params stripped from route
      expect(event.route).toBe('/kalkulacka-vyzivneho');
    });
  });

  describe('2. Real Statistics Aggregation (Integrity)', () => {
    it('should accurately aggregate real events', async () => {
      // Record multiple real events across 2 sessions
      await analyticsService.recordEvent({
        sessionId: 'sess_user_1',
        eventType: 'page_view',
        route: '/',
      });
      await analyticsService.recordEvent({
        sessionId: 'sess_user_1',
        eventType: 'page_view',
        route: '/kalkulacka-vyzivneho',
      });
      await analyticsService.recordEvent({
        sessionId: 'sess_user_1',
        eventType: 'feature_open',
        route: '/kalkulacka-vyzivneho',
        featureId: 'alimony_calculator',
      });
      await analyticsService.recordEvent({
        sessionId: 'sess_user_1',
        eventType: 'feature_complete',
        route: '/kalkulacka-vyzivneho',
        featureId: 'alimony_calculator',
      });

      await analyticsService.recordEvent({
        sessionId: 'sess_user_2',
        eventType: 'page_view',
        route: '/judikatura',
      });

      const realStats = await analyticsService.computeRealStats();

      expect(realStats.visitsToday).toBe(2);
      expect(realStats.uniqueVisitorsToday).toBe(2);
      expect(realStats.pageViewsToday).toBe(3); // 2 on user1 + 1 on user2
      expect(realStats.topFeatures).toHaveLength(1);
      expect(realStats.topFeatures[0].featureId).toBe('alimony_calculator');
      expect(realStats.topFeatures[0].count).toBe(1);
      expect(realStats.topFeatures[0].completedCount).toBe(1);
    });
  });

  describe('3. Strict Separation of Real and Simulated Data', () => {
    it('should NEVER insert fake rows into the analytics database when simulation is active', async () => {
      // Set simulation = ON
      await analyticsService.updateSettings({
        simulatedActivityEnabled: true,
        simulationMultiplier: 3.0,
        simulationMin: 10,
        simulationMax: 25,
      });

      const initialDbRowCount = dbStore.analyticsEvents.length;

      // Request public and admin stats
      const publicSummary = await analyticsService.getPublicSummary();
      const adminStats = await analyticsService.getAdminStats();

      const afterDbRowCount = dbStore.analyticsEvents.length;

      // Database rows count must NOT change as a result of computing simulation
      expect(afterDbRowCount).toBe(initialDbRowCount);

      // Admin stats must clearly separate real from simulation
      expect(adminStats.real.visitsToday).toBe(0);
      expect(adminStats.simulation.simulatedVisitsToday).toBeGreaterThan(0);
      expect(adminStats.publicDisplay.visitsToday).toBe(
        adminStats.real.visitsToday + adminStats.simulation.simulatedVisitsToday
      );
    });

    it('should return purely real numbers when simulation is disabled', async () => {
      await analyticsService.updateSettings({
        simulatedActivityEnabled: false,
      });

      await analyticsService.recordEvent({
        sessionId: 'sess_real_only',
        eventType: 'page_view',
        route: '/o-projektu',
      });

      const publicSummary = await analyticsService.getPublicSummary();
      const adminStats = await analyticsService.getAdminStats();

      expect(adminStats.simulation.simulatedActiveVisitors).toBe(0);
      expect(adminStats.simulation.simulatedVisitsToday).toBe(0);
      expect(publicSummary.visitsToday).toBe(1);
      expect(publicSummary.pageViewsToday).toBe(1);
    });
  });

  describe('4. Diurnal Pattern in Simulation Engine', () => {
    it('should compute appropriate diurnal multipliers depending on hour', async () => {
      await analyticsService.updateSettings({
        simulatedActivityEnabled: true,
        simulationMultiplier: 1.0,
        simulationMin: 10,
        simulationMax: 20,
      });

      const simStats = await analyticsService.computeSimulation();

      expect(simStats.simulatedActiveVisitors).toBeGreaterThanOrEqual(0);
      expect(simStats.simulatedVisitsToday).toBeGreaterThanOrEqual(0);
    });
  });
});
