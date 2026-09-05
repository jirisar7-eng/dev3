import { Router, Response } from 'express';
import express from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AgentDispatcher } from '../services/agentDispatcher';

const router = Router();

// Apply a strict payload limit for this router to prevent DoS (Phase 1D-1 requirement)
router.use(express.json({ limit: '2mb' }));

router.post('/dispatch', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentId, capabilityId, payload, targetResource, requestedOperation } = req.body;

    // 1. Basic validation
    if (!agentId || typeof agentId !== 'string') {
      return res.status(400).json({ success: false, error: 'agentId is required and must be a string' });
    }
    if (!capabilityId || typeof capabilityId !== 'string') {
      return res.status(400).json({ success: false, error: 'capabilityId is required and must be a string' });
    }

    if (agentId.length > 50 || capabilityId.length > 100) {
      return res.status(400).json({ success: false, error: 'Invalid input length' });
    }

    if (targetResource && typeof targetResource !== 'string') {
      return res.status(400).json({ success: false, error: 'targetResource must be a string' });
    }
    if (requestedOperation && typeof requestedOperation !== 'string') {
      return res.status(400).json({ success: false, error: 'requestedOperation must be a string' });
    }

    // 2. Payload sanitization (Provider override prevention)
    let safePayload: Record<string, unknown> | undefined = undefined;
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      safePayload = { ...payload };
      // Delete forbidden properties explicitly to enforce execution policy
      const forbiddenKeys = [
        'user', 'actor', 'role', 'permissions', 'approval', 'approvalId', 'ticketId', 'traceId',
        'provider', 'preferredProvider', 'model', 'systemPrompt', 'temperature', 'maxTokens'
      ];
      for (const key of forbiddenKeys) {
        delete safePayload[key];
      }
    }

    // 3. Trusted User Extraction
    // Ensure the actor comes ONLY from the trusted req.user object.
    const trustedUser = req.user;
    if (!trustedUser) {
      return res.status(401).json({ success: false, error: 'Unauthorized user context' });
    }

    // 4. Dispatch construction
    // The request to AgentDispatcher explicitly ignores any client-supplied auth contexts.
    const dispatchRequest = {
      agentId,
      capabilityId,
      user: trustedUser as any,
      payload: safePayload,
      targetResource,
      requestedOperation,
    };

    // 5. Dispatch
    const result = await AgentDispatcher.dispatch(dispatchRequest);

    // 6. Response Handling
    if (result.decision === 'DENY') {
      // 403 Forbidden for explicitly denied operations
      return res.status(403).json({
        success: false,
        error: result.reason || 'Access Denied',
        traceId: result.traceId
      });
    }

    if (result.decision === 'REQUIRE_HUMAN_APPROVAL') {
      // 202 Accepted, but pending action
      return res.status(202).json({
        success: false,
        pending: true,
        message: result.reason || 'Operation requires human approval',
        ticketId: result.ticketId,
        traceId: result.traceId
      });
    }

    if (!result.success) {
      // Allowed but failed execution
      return res.status(500).json({
        success: false,
        error: result.reason || 'Execution Failed',
        traceId: result.traceId
      });
    }

    // 200 OK for successful execution
    return res.status(200).json({
      success: true,
      data: result.data,
      traceId: result.traceId
    });

  } catch (err: any) {
    console.error('[AgentRoutes] Dispatch error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

export default router;
