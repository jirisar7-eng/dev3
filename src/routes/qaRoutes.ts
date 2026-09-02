import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { qaDiscoveryService } from '../services/qaDiscoveryService';
import { qaAuditEngine } from '../services/qa/qaAuditEngine';
import { qaRegistryService } from '../services/qa/qaRegistryService';
import { aiStatsManager, aiAnalystService } from '../services/qa/aiAnalystService';
import { synthesisMultiAIOrchestrator } from '../services/qa/ai/synthesisMultiAIOrchestrator';
import { AdminCopilotService } from '../services/qa/adminCopilot';
import { NotionAuditMirrorService } from '../services/notionAuditMirror';
import { KnowledgeMirrorService } from '../services/audit/knowledgeMirrorService';
import { KnowledgeSyncOptionsSchema } from '../services/audit/knowledgeTypes';
import { InfrastructureAuditService } from '../services/audit/infrastructureAuditService';

const router = Router();

// GET /api/admin/qa/dashboard
router.get('/dashboard', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await qaDiscoveryService.getDashboardData();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/ai-orchestrator/status
router.get('/ai-orchestrator/status', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const statuses = synthesisMultiAIOrchestrator.getProviderStatuses();
    const stats = aiStatsManager.getStats();
    res.json({ success: true, statuses, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/ai-orchestrator/toggle
router.post('/ai-orchestrator/toggle', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { provider, enabled } = req.body;
    if (!provider || typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Chybí název providera nebo stav enabled.' });
    }
    const updated = synthesisMultiAIOrchestrator.setProviderEnabled(provider, enabled);
    const statuses = synthesisMultiAIOrchestrator.getProviderStatuses();
    res.json({ success: updated, statuses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/ai-orchestrator/analyze
router.post('/ai-orchestrator/analyze', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { context, options } = req.body;
    if (!context || !context.testResults) {
      return res.status(400).json({ success: false, error: 'Chybí platný kontext s výsledky testů (context.testResults).' });
    }

    const report = await synthesisMultiAIOrchestrator.analyze(context, options || { mode: 'synthesis' });
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// POST /api/admin/qa/discover
router.post('/discover', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await qaDiscoveryService.discover();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/run-audit
router.post('/run-audit', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const isIncremental = req.query.mode === 'incremental' || req.body?.isIncremental === true;
    const result = await qaAuditEngine.runAudit(token, { isIncremental });
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/run-incremental-audit
router.post('/run-incremental-audit', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const result = await qaAuditEngine.runAudit(token, { isIncremental: true });
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/registry
router.get('/registry', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await qaRegistryService.getRegistryOverview();
    const gitInfo = qaRegistryService.getGitInfo();
    res.json({ success: true, items, gitInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/ai-stats
router.get('/ai-stats', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = aiStatsManager.getStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/run-ai-analysis
router.post('/run-ai-analysis', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const runs = await qaAuditEngine.getRuns();
    const latestRun = runs[0];
    if (!latestRun) {
      return res.status(400).json({ success: false, error: 'Žádný běh auditu nebyl nalezen pro spuštění AI analýzy.' });
    }

    const statsCounts = (latestRun as any)?.stats?.counts || (latestRun as any)?.counts || {};
    const statsScores = (latestRun as any)?.stats?.scores || (latestRun as any)?.scores || {};

    const payload = {
      commitSha: latestRun.commitSha || 'main-HEAD',
      branch: latestRun.branch || 'main',
      environment: latestRun.environment || 'production',
      metrics: {
        pages: latestRun.pagesScanned || 10,
        routes: 15,
        components: 25,
        buttons: latestRun.buttonsScanned || 40,
        links: latestRun.linksScanned || 50,
        forms: latestRun.formsScanned || 8,
        apiEndpoints: latestRun.apiEndpointsScanned || 20,
        prismaModels: latestRun.prismaModelsScanned || 12,
        e2eTests: latestRun.e2eTestsScanned || 15
      },
      scores: {
        functional: statsScores.functional ?? latestRun.functionalScore ?? 100,
        security: statsScores.security ?? latestRun.securityScore ?? 100,
        api: statsScores.api ?? latestRun.apiScore ?? 100,
        persistence: statsScores.persistence ?? latestRun.persistenceScore ?? 100,
        e2e: statsScores.e2e ?? latestRun.e2eScore ?? 100,
        overall: statsScores.overall ?? latestRun.overallScore ?? 100
      },
      counts: {
        pass: statsCounts.pass ?? latestRun.passCount ?? 0,
        fail: statsCounts.fail ?? latestRun.failCount ?? 0,
        partial: statsCounts.partial ?? 0,
        notTested: statsCounts.notTested ?? 0,
        p0: statsCounts.p0 ?? latestRun.p0Count ?? 0,
        p1: statsCounts.p1 ?? latestRun.p1Count ?? 0,
        p2: statsCounts.p2 ?? latestRun.p2Count ?? 0,
        p3: statsCounts.p3 ?? latestRun.p3Count ?? 0,
        discovered: statsCounts.discovered,
        tested: statsCounts.tested,
        verifiedSkipped: statsCounts.verifiedSkipped
      },
      findings: latestRun.findings || [],
      adminRequested: true,
      preferredProvider: (req.body?.provider as any) || 'auto'
    };

    const report = await aiAnalystService.analyzeRunPayload(payload);
    res.json({ success: true, report });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/runs
router.get('/runs', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const runs = await qaAuditEngine.getRuns();
    res.json({ success: true, runs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/runs/compare
router.get('/runs/compare', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const prev = req.query.prev as string;
    const curr = req.query.curr as string;
    if (!prev || !curr) {
      return res.status(400).json({ success: false, error: "Missing prev or curr parameter." });
    }
    const comparison = await qaAuditEngine.compareRuns(prev, curr);
    res.json({ success: true, comparison });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/copilot/plan
router.post('/copilot/plan', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Chybí zpráva pro Admin Copilota.' });
    }
    const plan = AdminCopilotService.generatePlan(message);
    res.json({ success: true, plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/copilot/execute-step
router.post('/copilot/execute-step', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { stepType, payload } = req.body;
    if (!stepType) {
      return res.status(400).json({ success: false, error: 'Chybí typ kroku stepType.' });
    }
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Uživatel není přihlášen.' });
    }

    const ipAddress = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const execution = await AdminCopilotService.executeStep(stepType, payload, req.user, ipAddress);

    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/knowledge-mirror/status
router.get('/knowledge-mirror/status', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = NotionAuditMirrorService.getStatus();
    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/knowledge-mirror/sync
router.post('/knowledge-mirror/sync', requireAuth as any, requireRole('SUPER_ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = KnowledgeSyncOptionsSchema.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: 'Neplatné parametry pro sync.', details: parsed.error.issues });
    }
    const result = await KnowledgeMirrorService.syncToNotion(parsed.data);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/knowledge
router.get('/knowledge', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await KnowledgeMirrorService.collectKnowledgeRecords();
    res.json({ success: true, records, count: records.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/qa/infrastructure-audit
router.get('/infrastructure-audit', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await InfrastructureAuditService.runFullInfrastructureAudit();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/qa/infrastructure-audit/run
router.post('/infrastructure-audit/run', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await InfrastructureAuditService.runFullInfrastructureAudit();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
