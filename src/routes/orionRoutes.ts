import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { OrionTraceStore } from '../services/audit/orionTraceStore';
import { NotionAuditMirrorService } from '../services/notionAuditMirror';
import { OrionService } from '../services/audit/orionService';
import { z } from 'zod';

const router = Router();

const OrionRunBodySchema = z.object({
  scope: z.enum(['REGISTRY', 'FINDING', 'REGRESSION', 'HEALTH', 'GENERAL']).optional(),
  targetCode: z.string().max(50).optional(),
  userQuery: z.string().max(2000).optional(),
});

/**
 * GET /api/admin/orion/active-trace
 * Polled by frontend every 1000ms. Returns active or latest process trace.
 * Observability only — 0-PII sanitized, no raw prompts or chain-of-thought.
 */
router.get('/active-trace', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const trace = OrionTraceStore.getActiveOrLatestTrace();
    const notionStatus = NotionAuditMirrorService.getStatus();

    res.json({
      success: true,
      data: {
        trace,
        notionStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání active trace.',
    });
  }
});

/**
 * GET /api/admin/orion/traces
 * Returns list of recent trace history records.
 */
router.get('/traces', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const traces = OrionTraceStore.getRecentTraces();

    res.json({
      success: true,
      data: traces,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání historie trace.',
    });
  }
});

/**
 * GET /api/admin/orion/trace/:id
 * Returns a specific trace by ID.
 */
router.get('/trace/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const trace = OrionTraceStore.getTraceById(id);

    if (!trace) {
      return res.status(404).json({
        success: false,
        error: 'Požadovaný trace nebyl nalezen.',
      });
    }

    res.json({
      success: true,
      data: trace,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání detailu trace.',
    });
  }
});

/**
 * POST /api/admin/orion/run
 * Triggers an Orion analysis run which generates a live trace and safe AI_RECOMMENDATION.
 */
router.post('/run', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = OrionRunBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Neplatný požadavek pro spuštění Orion analýzy.',
        details: parseResult.error.issues,
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Neautentizovaný uživatel.',
      });
    }

    // Run Orion analysis async / inline generating live process trace
    const analysis = await OrionService.analyze(req.user, parseResult.data, undefined, req.ip);
    const trace = OrionTraceStore.getActiveOrLatestTrace();

    res.json({
      success: true,
      data: {
        analysis,
        trace,
      },
    });
  } catch (error: any) {
    res.status(error.message?.includes('FAIL CLOSED') ? 403 : 500).json({
      success: false,
      error: error.message || 'Chyba při spuštění Orion Trace analýzy.',
    });
  }
});

/**
 * GET /api/admin/orion/notion-status
 * Checks status of Notion Audit Mirror connection.
 */
router.get('/notion-status', requireAuth as any, requireRole('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const status = NotionAuditMirrorService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při kontrole Notion stavu.',
    });
  }
});

export default router;
