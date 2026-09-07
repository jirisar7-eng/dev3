import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { aiModelRegistry } from '../services/ai/aiModelRegistry';
import { aiPolicyEngine } from '../services/ai/aiPolicyEngine';
import { aiCouncilService } from '../services/ai/aiCouncilService';
import { aiTelemetryService } from '../services/ai/aiTelemetryService';
import { aiStatsManager } from '../services/qa/ai/aiStats';
import { AuditService } from '../services/auditService';

const router = Router();

// All routes require authentication and ADMIN or SUPER_ADMIN role
router.use(requireAuth as any, requireRole('ADMIN') as any);

// GET /api/admin/ai/overview
router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const providers = await aiModelRegistry.getProvidersOverview();
    const models = await aiModelRegistry.getModelsOverview();
    const routingTopology = await aiModelRegistry.getRoutingTopology();
    const stats = aiStatsManager.getStats();
    const globalPolicy = aiPolicyEngine.getGlobalPolicy();
    const modelOverrides = aiPolicyEngine.getModelOverrides();

    res.json({
      success: true,
      data: {
        providers,
        models,
        routingTopology,
        stats,
        globalPolicy,
        modelOverrides
      }
    });
  } catch (error: any) {
    console.error('[Admin AI Routes] GET /overview error:', error);
    res.status(500).json({ success: false, error: error.message || 'Chyba při načítání přehledu AI registrů.' });
  }
});

// GET /api/admin/ai/providers
router.get('/providers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const providers = await aiModelRegistry.getProvidersOverview();
    res.json({ success: true, data: providers });
  } catch (error: any) {
    console.error('[Admin AI Routes] GET /providers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/ai/models
router.get('/models', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const models = await aiModelRegistry.getModelsOverview();
    res.json({ success: true, data: models });
  } catch (error: any) {
    console.error('[Admin AI Routes] GET /models error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/ai/routing
router.get('/routing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sensitiveData = req.query.sensitiveData === 'true';
    const freeOnly = req.query.freeOnly === 'true';
    const preferredProviderKey = typeof req.query.preferredProviderKey === 'string' ? req.query.preferredProviderKey : undefined;
    const capabilitiesRequired = typeof req.query.capabilitiesRequired === 'string' 
      ? req.query.capabilitiesRequired.split(',').filter(Boolean)
      : undefined;

    const topology = await aiModelRegistry.getRoutingTopology({
      sensitiveData,
      freeOnly,
      preferredProviderKey,
      capabilitiesRequired
    });

    res.json({ success: true, data: topology });
  } catch (error: any) {
    console.error('[Admin AI Routes] GET /routing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/ai/providers/:key/status
router.patch('/providers/:key/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { enabled, status } = req.body;

    if (enabled === undefined && !status) {
      return res.status(400).json({ success: false, error: 'Chybí parametry enabled nebo status.' });
    }

    const updated = await aiModelRegistry.updateProviderStatus(key, { enabled, status });

    await AuditService.recordLog(
      'AI_PROVIDER_UPDATE_STATUS',
      'AI_MODEL_REGISTRY',
      `Změněn stav AI Providera '${key}': enabled=${enabled ?? 'nezměněno'}, status=${status ?? 'nezměněno'}`,
      req.user,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[Admin AI Routes] PATCH /providers/:key/status error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/ai/models/:id
router.patch('/models/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Chybí konfigurační políčka pro aktualizaci.' });
    }

    const updated = await aiModelRegistry.updateModelConfig(id, updates);

    await AuditService.recordLog(
      'AI_MODEL_UPDATE_CONFIG',
      'AI_MODEL_REGISTRY',
      `Aktualizován AI Model '${updated.displayName}' (${updated.key}): ${JSON.stringify(updates)}`,
      req.user,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[Admin AI Routes] PATCH /models/:id error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/admin/ai/refresh
router.post('/refresh', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await aiModelRegistry.seedInitialCatalog();
    await aiModelRegistry.refreshCache();

    await AuditService.recordLog(
      'AI_REGISTRY_REFRESH',
      'AI_MODEL_REGISTRY',
      'Synchronizován a aktualizován katalog AI modelů a providerů.',
      req.user,
      req.ip || '127.0.0.1'
    );

    const providers = await aiModelRegistry.getProvidersOverview();
    const models = await aiModelRegistry.getModelsOverview();

    res.json({ success: true, message: 'Katalog AI modelů byl úspěšně synchronizován.', data: { providers, models } });
  } catch (error: any) {
    console.error('[Admin AI Routes] POST /refresh error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/ai/health-check
router.post('/health-check', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { providerKey, modelId } = req.body;
    const results = await aiModelRegistry.triggerHealthCheck(providerKey, modelId);

    await AuditService.recordLog(
      'AI_HEALTH_CHECK',
      'AI_MODEL_REGISTRY',
      `Proveden health-check providerů/modelů (${results.length} výsledků).`,
      req.user,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, data: results });
  } catch (error: any) {
    console.error('[Admin AI Routes] POST /health-check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/ai/models/discover
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.models.manage')
router.post('/models/discover', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { providerKey } = req.body;
    const discoveryResult = await aiModelRegistry.discoverModels(providerKey);

    await AuditService.recordLog(
      'AI_MODEL_DISCOVER_CATALOG',
      'AI_MODEL_REGISTRY',
      `Provedeno dynamické zjišťování katalogu modelů (provider: ${providerKey || 'všechny'}). Vytvořeno ${discoveryResult.newModelsCreatedCount} nových modelů (výchozí stav VYPNUTO).`,
      req.user,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, data: discoveryResult });
  } catch (error: any) {
    console.error('[Admin AI Routes] POST /models/discover error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/ai/telemetry
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.policy.read')
router.get('/telemetry', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { modelKey } = req.query;
    const summary = aiTelemetryService.getTelemetrySummary(typeof modelKey === 'string' ? modelKey : undefined);

    res.json({
      success: true,
      data: {
        telemetry: summary,
        googleAiProNote: 'Google AI Pro Subscription usage NOT_AVAILABLE_THROUGH_CURRENT_API. Showing API Quota telemetry.'
      }
    });
  } catch (error: any) {
    console.error('[Admin AI Routes] GET /telemetry error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/ai/policy
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.policy.read')
router.get('/policy', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const globalPolicy = aiPolicyEngine.getGlobalPolicy();
    const modelOverrides = aiPolicyEngine.getModelOverrides();

    res.json({
      success: true,
      data: {
        globalPolicy,
        modelOverrides
      }
    });
  } catch (error: any) {
    console.error('[Admin AI Routes] GET /policy error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/ai/policy
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.policy.manage')
router.patch('/policy', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'Chybí konfigurační parametry pro aktualizaci politiky.' });
    }

    const updatedGlobal = aiPolicyEngine.updateGlobalPolicy(updates);

    await AuditService.recordLog(
      'AI_POLICY_UPDATE_GLOBAL',
      'AI_POLICY_ENGINE',
      `Aktualizována globální AI politika: ${JSON.stringify(updates)}`,
      req.user,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, data: updatedGlobal });
  } catch (error: any) {
    console.error('[Admin AI Routes] PATCH /policy error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PATCH /api/admin/ai/policy/models/:key
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.models.manage')
router.patch('/policy/models/:key', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const override = req.body;

    if (!override || Object.keys(override).length === 0) {
      return res.status(400).json({ success: false, error: 'Chybí konfigurační parametry override pro model.' });
    }

    const updatedOverride = aiPolicyEngine.setModelOverride(key, override);

    await AuditService.recordLog(
      'AI_POLICY_UPDATE_MODEL_OVERRIDE',
      'AI_POLICY_ENGINE',
      `Aktualizován role/policy override pro model '${key}': ${JSON.stringify(override)}`,
      req.user,
      req.ip || '127.0.0.1'
    );

    res.json({ success: true, data: updatedOverride });
  } catch (error: any) {
    console.error('[Admin AI Routes] PATCH /policy/models/:key error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/admin/ai/council/evaluate-delegation
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.delegation.evaluate')
router.post('/council/evaluate-delegation', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = req.body;
    if (!request.parentAgentOrModel || !request.targetAgentOrModel || !request.taskType) {
      return res.status(400).json({ success: false, error: 'Chybí povinné parametry parentAgentOrModel, targetAgentOrModel nebo taskType.' });
    }

    const models = await aiModelRegistry.getModelsOverview();
    const targetMeta = models.find(m => m.key === request.targetAgentOrModel || m.modelName === request.targetAgentOrModel);

    const evaluation = await aiPolicyEngine.evaluateDelegationRequest(request, targetMeta);
    await aiPolicyEngine.recordDelegationAudit(evaluation, req.user, req.ip || '127.0.0.1');

    res.json({ success: true, data: evaluation });
  } catch (error: any) {
    console.error('[Admin AI Routes] POST /council/evaluate-delegation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/ai/council/simulate
// TODO(RBAC): V budoucnu nahradit router-level requireRole('ADMIN') specifickým oprávněním: requirePermission('ai.council.simulate')
router.post('/council/simulate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const request = req.body;
    if (!request.orchestratorModelKey || !request.mode || !request.taskTitle) {
      return res.status(400).json({ success: false, error: 'Chybí povinné parametry orchestratorModelKey, mode nebo taskTitle.' });
    }

    const plan = await aiCouncilService.planWorkflow(request, req.user, req.ip || '127.0.0.1');
    res.json({ success: true, data: plan });
  } catch (error: any) {
    console.error('[Admin AI Routes] POST /council/simulate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
