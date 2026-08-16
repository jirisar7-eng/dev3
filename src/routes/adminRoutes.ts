import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { testRunnerService } from '../services/testRunnerService';

const router = Router();

// POST /api/admin/run-tests - Trigger E2E AI Tests
router.post('/run-tests', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await testRunnerService.runTests(req.user);
    if (!result.success && testRunnerService.getStatus().isTesting) {
      return res.status(409).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při spouštění E2E testů.',
    });
  }
});

// GET /api/admin/test-status - Get current E2E test execution status and report link
router.get('/test-status', requireAuth as any, requireRole('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const status = testRunnerService.getStatus();
    res.json({
      success: true,
      state: status,
      isTesting: status.isTesting,
      lastRun: status.lastRun,
      result: status.result,
      reportUrl: status.reportUrl,
      hasReport: status.hasReport,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Chyba při zjišťování stavu testů.',
    });
  }
});

export default router;
