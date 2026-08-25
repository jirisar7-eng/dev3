import { Router, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { AuthenticatedRequest, requireAuth, requireRole } from '../middleware/authMiddleware';

export const analyticsRouter = Router();

// In-memory rate limiting map for anonymous event submission (max 60 events / min per IP/sessionId)
const eventRateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(key: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = eventRateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    eventRateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count++;
  return true;
}

// Periodically clean rate limit map
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of eventRateLimitMap.entries()) {
    if (now > val.resetTime) {
      eventRateLimitMap.delete(key);
    }
  }
}, 120000);

/**
 * 1. POST /api/analytics/event
 * Ingests a single privacy-compliant analytics event.
 * Public endpoint, but securely identifies authenticated users server-side.
 */
analyticsRouter.post('/event', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { eventType, route, sessionId, featureId, metadata } = req.body || {};

    if (!eventType || typeof eventType !== 'string') {
      return res.status(400).json({ error: 'Chybí povinný parametr eventType' });
    }

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}_${sessionId || 'nosess'}`;

    if (!checkRateLimit(rateLimitKey, 120, 60000)) {
      return res.status(429).json({ error: 'Příliš mnoho požadavků na analytiku. Zpomalte prosím.' });
    }

    // Resolve userId safely from server session, NOT from request body!
    const resolvedUserId = req.user?.id || req.session?.userId || null;

    const event = await analyticsService.recordEvent({
      sessionId: String(sessionId || 'anon-' + clientIp),
      eventType: String(eventType).toLowerCase(),
      route: String(route || '/'),
      userId: resolvedUserId,
      featureId: featureId ? String(featureId) : null,
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
      ip: clientIp,
      userAgent: req.headers['user-agent'],
    });

    return res.status(201).json({
      success: true,
      eventId: event.id,
      timestamp: event.timestamp,
    });
  } catch (err: any) {
    console.error('[AnalyticsRouter] Error recording event:', err);
    return res.status(500).json({ error: 'Chyba při záznamu analytického eventu' });
  }
});

/**
 * 2. GET /api/analytics/public-summary
 * Returns public aggregated activity data (respects simulation settings).
 */
analyticsRouter.get('/public-summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const summary = await analyticsService.getPublicSummary();
    res.setHeader('Cache-Control', 'public, max-age=10');
    return res.json(summary);
  } catch (err: any) {
    console.error('[AnalyticsRouter] Error fetching public summary:', err);
    return res.status(500).json({ error: 'Chyba při načítání souhrnu aktivity' });
  }
});

/**
 * 3. GET /api/analytics/admin-stats
 * Detailed real vs simulated analytics for administrators.
 */
analyticsRouter.get(
  '/admin-stats',
  requireAuth,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await analyticsService.getAdminStats();
      return res.json(stats);
    } catch (err: any) {
      console.error('[AnalyticsRouter] Error fetching admin stats:', err);
      return res.status(500).json({ error: 'Chyba při načítání administrátorské analytiky' });
    }
  }
);

/**
 * 4. POST /api/analytics/admin-settings
 * Update simulation and public display settings (Admin only).
 */
analyticsRouter.post(
  '/admin-settings',
  requireAuth,
  requireRole('ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        publicStatsEnabled,
        simulatedActivityEnabled,
        simulationMultiplier,
        simulationMin,
        simulationMax,
        simulationTimeWindow,
      } = req.body || {};

      const current = await analyticsService.getSettings();
      const updated = await analyticsService.updateSettings(
        {
          publicStatsEnabled:
            publicStatsEnabled !== undefined ? Boolean(publicStatsEnabled) : current.publicStatsEnabled,
          simulatedActivityEnabled:
            simulatedActivityEnabled !== undefined
              ? Boolean(simulatedActivityEnabled)
              : current.simulatedActivityEnabled,
          simulationMultiplier:
            simulationMultiplier !== undefined
              ? Math.max(0.1, Math.min(20, Number(simulationMultiplier)))
              : current.simulationMultiplier,
          simulationMin:
            simulationMin !== undefined
              ? Math.max(0, Math.min(100, Number(simulationMin)))
              : current.simulationMin,
          simulationMax:
            simulationMax !== undefined
              ? Math.max(0, Math.min(500, Number(simulationMax)))
              : current.simulationMax,
          simulationTimeWindow:
            simulationTimeWindow !== undefined
              ? Math.max(1, Math.min(60, Number(simulationTimeWindow)))
              : current.simulationTimeWindow,
        },
        req.user
          ? { id: req.user.id, email: req.user.email }
          : undefined
      );

      return res.json({
        success: true,
        settings: updated,
      });
    } catch (err: any) {
      console.error('[AnalyticsRouter] Error updating admin settings:', err);
      return res.status(500).json({ error: 'Chyba při ukládání nastavení analytiky' });
    }
  }
);
