import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { qaDiscoveryService } from '../services/qaDiscoveryService';
import { qaAuditEngine } from '../services/qa/qaAuditEngine';

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
    const result = await qaAuditEngine.runAudit(token);
    res.json({ success: true, result });
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

export default router;
