import { Router, Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { requireOrionAuth } from '../middleware/orionAuthMiddleware';
import { OrionControlPlane } from '../services/orion/orionControlPlane';
import { ControlPlaneCapability } from '../types/controlPlane';

const router = Router();

const OrionQuerySchema = z.object({
  message: z.string().min(1, 'Zpráva nesmí být prázdná').max(4000, 'Zpráva je příliš dlouhá'),
  currentRoute: z.string().optional().default('/'),
  pageContext: z.record(z.string(), z.any()).optional(),
  requestedCapability: z.string().optional(),
  correlationId: z.string().optional(),
});

/**
 * GET /api/orion/context
 * Returns current session Orion context, user role, and effective capabilities for UI.
 */
router.get('/context', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const currentRoute = (req.query.route as string) || '/';
  const correlationId = `orion-ctx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  const context = OrionControlPlane.resolveContext(user, currentRoute, undefined, correlationId);

  return res.json({
    correlationId: context.correlationId,
    userRole: context.userRole,
    isAuthenticated: !!user,
    userName: user?.name || (user?.email ? user.email.split('@')[0] : 'Návštěvník'),
    effectiveCapabilities: context.effectiveCapabilities,
    currentRoute: context.currentRoute,
  });
});

/**
 * POST /api/orion
 * Unified entry point for Global Orion Assistant & Security Copilot across the portal.
 */
router.post('/', requireAuth as any, requireOrionAuth('ai.chat') as any, async (req: Request, res: Response) => {
  // 1. Never accept API keys or secret tokens from client payload
  if (
    req.body.apiKey ||
    req.body.api_key ||
    req.body.token ||
    req.body.secret ||
    req.body.password
  ) {
    return res.status(400).json({
      decision: 'DENY',
      trustLevel: 'DENY',
      message: 'Bezpečnostní chyba: Klientský požadavek nesmí obsahovat API klíče ani autentizační tokeny v těle zprávy.',
      error: 'Client credential transmission prohibited'
    });
  }

  // 2. Validate input with Zod
  const parseResult = OrionQuerySchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = (parseResult.error as any).issues
      ? (parseResult.error as any).issues.map((e: any) => e.message).join(', ')
      : ((parseResult.error as any).errors?.map((e: any) => e.message).join(', ') || parseResult.error.message);
    return res.status(400).json({
      decision: 'DENY',
      trustLevel: 'DENY',
      message: 'Neplatný formát požadavku pro Oriona.',
      error: errorDetails
    });
  }

  const { message, currentRoute, pageContext, requestedCapability, correlationId } = parseResult.data;

  // 3. Obtain authenticated user from server session (req.user), never from client body
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // 4. Resolve Context
  const context = OrionControlPlane.resolveContext(
    user,
    currentRoute,
    pageContext,
    correlationId
  );

  // 5. Process query via Orion Control Plane
  try {
    const result = await OrionControlPlane.processQuery(
      context,
      {
        message,
        currentRoute,
        pageContext,
        requestedCapability: requestedCapability as ControlPlaneCapability | undefined,
        correlationId: context.correlationId
      },
      clientIp
    );

    // 6. Return appropriate HTTP status
    // Fail Closed: If access to a protected capability or privilege escalation was denied, return 403 Forbidden
    if (result.decision === 'DENY' && (requestedCapability || (!user && result.error?.includes('protected')))) {
      return res.status(403).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error(`[OrionGlobalRoutes] Unexpected error (Correlation: ${context.correlationId})`);
    return res.status(500).json({
      correlationId: context.correlationId,
      timestamp: new Date().toISOString(),
      decision: 'DENY',
      trustLevel: 'DENY',
      message: 'Vnitřní chyba při zpracování dotazu Orionem (FAIL CLOSED).',
      effectiveCapabilities: context.effectiveCapabilities,
      error: 'Internal processing failure',
      scope: user ? 'AUTHENTICATED' : 'PUBLIC'
    });
  }
});

export default router;
