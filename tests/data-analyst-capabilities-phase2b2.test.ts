import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'fs';
import path from 'path';
import agentRoutes from '../src/routes/agentRoutes';
import { AgentDispatcher } from '../src/services/agentDispatcher';
import { dataAnalystHandler } from '../src/services/agentHandlers/dataAnalystHandler';

// Mock auth middleware to control req.user in supertest
vi.mock('../src/middleware/authMiddleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    if (req.headers['x-test-no-auth']) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    req.user = {
      id: req.headers['x-test-user-id'] || 'admin_user_1',
      email: 'admin@synthesis.cz',
      role: req.headers['x-test-role'] || 'ADMIN',
      permissions: req.headers['x-test-permissions']
        ? req.headers['x-test-permissions'].split(',')
        : ['analytics.read', 'metrics.query', 'report.generate'],
    };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use('/api/admin/agent', agentRoutes);

describe('Phase 2B-2 — DATA ANALYST Remaining Capabilities (analytics.read & metrics.query)', () => {
  const adminUser = {
    id: 'admin_1',
    email: 'admin@synthesis.cz',
    role: 'ADMIN',
    permissions: ['analytics.read', 'metrics.query', 'report.generate'],
  } as any;

  const normalUser = {
    id: 'user_1',
    email: 'user@synthesis.cz',
    role: 'USER',
    permissions: [],
  } as any;

  // -------------------------------------------------------------
  // ANALYTICS.READ (1 - 12)
  // -------------------------------------------------------------
  describe('analytics.read Capability', () => {
    it('1. valid request executes and returns admin stats payload', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { timeRange: '30d' },
        user: adminUser,
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.real).toBeDefined();
      expect(data.simulation).toBeDefined();
      expect(data.publicDisplay).toBeDefined();
      expect(data.requestedTimeRange).toBe('30d');
    });

    it('2. missing payload defaults timeRange to 30d and succeeds', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: undefined,
        user: adminUser,
      });

      expect(result.decision).toBe('ALLOW');
      expect((result.data as any).requestedTimeRange).toBe('30d');
    });

    it('3. invalid timeRange throws and is caught with FAIL CLOSED', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { timeRange: '99d' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid timeRange');
    });

    it('4. excessive timeRange (>10 chars) is rejected fail-closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { timeRange: '100000000000d' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Excessive timeRange');
    });

    it('5. unauthenticated actor is rejected with DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { timeRange: '30d' },
        user: undefined,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Unauthenticated actor');
    });

    it('6. unauthorized actor (role USER) is rejected with DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { timeRange: '30d' },
        user: normalUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('lacks required capability');
    });

    it('7. spoofed role in payload is stripped by dispatch API and evaluated via req.user', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .set('x-test-role', 'USER')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'analytics.read',
          payload: { role: 'SUPER_ADMIN', timeRange: '30d' },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('lacks required capability');
    });

    it('8. spoofed permissions in payload are stripped by dispatch API', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .set('x-test-role', 'USER')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'analytics.read',
          payload: {
            permissions: ['analytics.read', 'settings.write'],
            timeRange: '30d',
          },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('9. provider spoofing in payload is stripped and ignored', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'analytics.read',
          payload: { provider: 'external_untrusted', timeRange: '30d' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('10. model spoofing in payload is stripped and ignored', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'analytics.read',
          payload: { model: 'gpt-4-custom', timeRange: '30d' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('11. raw SQL attempt in payload triggers fail-closed security error', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { sql: 'SELECT * FROM "User"', timeRange: '30d' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Client is strictly forbidden from specifying database operations');
    });

    it('12. arbitrary query attempt in payload is rejected fail-closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { query: 'findMany', table: 'events' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Client is strictly forbidden from specifying database operations');
    });
  });

  // -------------------------------------------------------------
  // METRICS.QUERY (13 - 22)
  // -------------------------------------------------------------
  describe('metrics.query Capability', () => {
    it('13. valid request executes and returns AI insights data', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { timeRange: '7d' },
        user: adminUser,
      });

      expect(result.decision).toBe('ALLOW');
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.timeRange).toBe('7d');
      expect(data.summary).toBeDefined();
      expect(data.missingContentTopics).toBeDefined();
      expect(data.funnelBottlenecks).toBeDefined();
    });

    it('14. invalid timeRange is rejected fail-closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { timeRange: '365d' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid timeRange');
    });

    it('15. excessive timeRange is rejected fail-closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { timeRange: 'very_long_invalid_timerange_string' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Excessive timeRange');
    });

    it('16. unauthenticated actor is rejected with DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { timeRange: '30d' },
        user: undefined,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Unauthenticated actor');
    });

    it('17. unauthorized actor (role USER) is rejected with DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { timeRange: '30d' },
        user: normalUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('lacks required capability');
    });

    it('18. spoofed role in payload is stripped by dispatch API and rejected', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .set('x-test-role', 'USER')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'metrics.query',
          payload: { role: 'ADMIN', timeRange: '30d' },
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('19. provider spoofing in metrics.query is stripped', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'metrics.query',
          payload: { provider: 'claude-ai', timeRange: '30d' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('20. model spoofing in metrics.query is stripped', async () => {
      const res = await request(app)
        .post('/api/admin/agent/dispatch')
        .send({
          agentId: 'DATA_ANALYST',
          capabilityId: 'metrics.query',
          payload: { model: 'gpt-4o-mini', timeRange: '30d' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('21. raw SQL injection attempt in field value is detected and rejected', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { timeRange: '30d; DROP TABLE users;--' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('SQL injection attempt detected');
    });

    it('22. arbitrary query attempt (rawQuery / table) is rejected fail-closed', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'metrics.query',
        payload: { rawQuery: 'SELECT count(*) FROM analytics', timeRange: '30d' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Client is strictly forbidden from specifying database operations');
    });
  });

  // -------------------------------------------------------------
  // DISPATCHER (23 - 28)
  // -------------------------------------------------------------
  describe('Dispatcher & Handler Safeguards', () => {
    it('23. unknown capability returns DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'nonexistent.capability',
        user: adminUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Unknown capability');
    });

    it('24. wrong agent/capability combination returns DENY', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'document.parse',
        user: adminUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('is not authorized for agent');
    });

    it('25. generic execution attempt is prevented by explicit handler mapping', async () => {
      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { execute: 'eval("2+2")', function: 'danger' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Client is strictly forbidden from specifying database operations');
    });

    it('26. handler failure is safely captured without crash', async () => {
      const spy = vi.spyOn(dataAnalystHandler, 'execute').mockRejectedValueOnce(new Error('Simulated internal DB failure'));

      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        payload: { timeRange: '30d' },
        user: adminUser,
      });

      expect(result.success).toBe(false);
      expect(result.reason).toContain('Simulated internal DB failure');
      spy.mockRestore();
    });

    it('27. trace failure fails closed', async () => {
      // If traceRequired agent cannot bind a trace, it must fail closed
      const { OrionTraceStore } = await import('../src/services/audit/orionTraceStore');
      const startSpy = vi.spyOn(OrionTraceStore, 'startTrace').mockReturnValueOnce(null as any);
      const activeSpy = vi.spyOn(OrionTraceStore, 'getActiveOrLatestTrace').mockReturnValueOnce(null as any);

      const result = await AgentDispatcher.dispatch({
        agentId: 'DATA_ANALYST',
        capabilityId: 'analytics.read',
        user: adminUser,
      });

      expect(result.decision).toBe('DENY');
      expect(result.reason).toContain('Failed to initialize trace context');

      startSpy.mockRestore();
      activeSpy.mockRestore();
    });

    it('28. correct handler mapping: DATA_ANALYST handles analytics.read and metrics.query', () => {
      const readHandler = (AgentDispatcher as any).handlers.get('DATA_ANALYST:analytics.read');
      const metricsHandler = (AgentDispatcher as any).handlers.get('DATA_ANALYST:metrics.query');
      const reportHandler = (AgentDispatcher as any).handlers.get('DATA_ANALYST:report.generate');

      expect(readHandler).toBe(dataAnalystHandler);
      expect(metricsHandler).toBe(dataAnalystHandler);
      expect(reportHandler).toBe(dataAnalystHandler);
    });
  });

  // -------------------------------------------------------------
  // FRONTEND (29 - 32)
  // -------------------------------------------------------------
  describe('Frontend AnalyticsManager Integration', () => {
    const filePath = path.resolve(__dirname, '../src/components/admin/AnalyticsManager.tsx');
    const content = fs.readFileSync(filePath, 'utf8');

    it('29. correct agentId is used in AnalyticsManager', () => {
      expect(content).toContain("agentId: 'DATA_ANALYST'");
    });

    it('30. correct capabilityIds are used in AnalyticsManager', () => {
      expect(content).toContain("capabilityId: 'analytics.read'");
      expect(content).toContain("capabilityId: 'metrics.query'");
    });

    it('31. forbidden client fields are absent in dispatch calls', () => {
      const overviewBlock = content.split('const fetchOverviewStats = async () => {')[1].split('const fetchJourneyStats')[0];
      const aiInsightsBlock = content.split('const fetchAiInsights = async () => {')[1].split('// Load all analytics modules')[0];

      for (const block of [overviewBlock, aiInsightsBlock]) {
        expect(block).not.toContain('user:');
        expect(block).not.toContain('role:');
        expect(block).not.toContain('permissions:');
        expect(block).not.toContain('provider:');
        expect(block).not.toContain('model:');
        expect(block).not.toContain('systemPrompt:');
        expect(block).not.toContain('sql:');
        expect(block).not.toContain('ticketId:');
        expect(block).not.toContain('approval:');
      }
    });

    it('32. correct response handling in AnalyticsManager', () => {
      expect(content).toContain("if (response.decision === 'SUCCESS' && response.data) {");
      expect(content).toContain("else if (response.decision === 'DENY') {");
      expect(content).toContain("setErrorMessage('Přístup k analytice byl zamítnut (nedostatečná oprávnění).');");
    });
  });
});
