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

// GET /api/admin/experimental/approved-users - Get list of approved users (SUPER_ADMIN or PREVIEW_ACTOR)
router.get('/experimental/approved-users', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== ('PREVIEW_ACTOR' as any)) {
    return res.status(403).json({ error: 'Přístup odepřen. Vyžadována role SUPER_ADMIN.' });
  }
  try {
    const { prisma } = await import('../db/prisma');
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Databáze je dočasně nedostupná.' });
    }
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { key: 'experimental.approved_users' },
    });
    const rawUsers = setting ? JSON.parse(setting.value) : [];
    const users = Array.isArray(rawUsers)
      ? rawUsers.map((item: any) => (typeof item === 'string' ? item : item?.email)).filter(Boolean)
      : [];
    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Chyba při načítání schválených uživatelů.' });
  }
});

// POST /api/admin/experimental/approved-users - Approve a user (SUPER_ADMIN only)
router.post('/experimental/approved-users', requireAuth as any, requireRole('SUPER_ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prisma } = await import('../db/prisma');
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Databáze je dočasně nedostupná.' });
    }
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'E-mail je povinný.' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const setting = await (prisma as any).systemSetting.findUnique({
      where: { key: 'experimental.approved_users' },
    });

    let approvedList: any[] = [];
    if (setting) {
      approvedList = JSON.parse(setting.value);
    }

    if (!Array.isArray(approvedList)) {
      approvedList = [];
    }

    const alreadyApproved = approvedList.some((item: any) => {
      const existingEmail = typeof item === 'string' ? item : item?.email;
      return existingEmail && existingEmail.toLowerCase() === trimmedEmail;
    });

    if (!alreadyApproved) {
      approvedList.push({
        email: trimmedEmail,
        approvedAt: new Date().toISOString(),
        approvedBy: req.user?.email || 'unknown',
      });

      await (prisma as any).systemSetting.upsert({
        where: { key: 'experimental.approved_users' },
        create: {
          key: 'experimental.approved_users',
          value: JSON.stringify(approvedList),
          category: 'experimental',
          description: 'Seznam uživatelů schválených pro Experimentální laboratoř',
        },
        update: {
          value: JSON.stringify(approvedList),
        },
      });
    }

    res.json({ success: true, data: approvedList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Chyba při přidávání schváleného uživatele.' });
  }
});

// DELETE /api/admin/experimental/approved-users - Revoke access for a user (SUPER_ADMIN only)
router.delete('/experimental/approved-users', requireAuth as any, requireRole('SUPER_ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prisma } = await import('../db/prisma');
    if (!prisma) {
      return res.status(503).json({ success: false, error: 'Databáze je dočasně nedostupná.' });
    }
    const { email } = req.body;
    const targetEmail = (email || req.query.email) as string;
    if (!targetEmail) {
      return res.status(400).json({ success: false, error: 'E-mail je povinný.' });
    }

    const trimmedEmail = targetEmail.trim().toLowerCase();

    const setting = await (prisma as any).systemSetting.findUnique({
      where: { key: 'experimental.approved_users' },
    });

    if (!setting) {
      return res.json({ success: true, data: [] });
    }

    let approvedList = JSON.parse(setting.value);
    if (!Array.isArray(approvedList)) {
      approvedList = [];
    }

    approvedList = approvedList.filter((item: any) => {
      const existingEmail = typeof item === 'string' ? item : item?.email;
      return existingEmail && existingEmail.toLowerCase() !== trimmedEmail;
    });

    await (prisma as any).systemSetting.update({
      where: { key: 'experimental.approved_users' },
      data: {
        value: JSON.stringify(approvedList),
      },
    });

    res.json({ success: true, data: approvedList });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Chyba při odebírání schváleného uživatele.' });
  }
});

export default router;
