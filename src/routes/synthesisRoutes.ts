import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { SynthesisService } from '../services/synthesisService';
import { GithubSyncService } from '../services/synthesis/githubSyncService';

const router = Router();

/**
 * GET /api/admin/synthesis/tickets
 * Lists synthesis tickets with optional filtering.
 */
router.get('/tickets', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { source, severity, category, status, search, limit, offset } = req.query;

    const result = await SynthesisService.getTickets({
      source: source as any,
      severity: severity as any,
      category: category as any,
      status: status as any,
      search: search as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json({
      success: true,
      data: result.tickets,
      total: result.total,
      isDegraded: result.isDegraded,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Error fetching synthesis tickets',
    });
  }
});

/**
 * GET /api/admin/synthesis/tickets/:id
 * Fetches a single synthesis ticket by ID or ticketNumber.
 */
router.get('/tickets/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await SynthesisService.getTicketById(id);

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: 'Synthesis ticket not found',
      });
      return;
    }

    res.json({
      success: true,
      data: ticket,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Error fetching synthesis ticket',
    });
  }
});

/**
 * POST /api/admin/synthesis/tickets
 * Creates a new synthesis ticket (or returns existing duplicate).
 * FAIL-CLOSED: Returns 503 if DB is unavailable.
 */
router.post('/tickets', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      source,
      severity,
      category,
      status,
      dedupHash,
      sourcePath,
      auditDocumentId,
      qaFindingId,
      supportTicketId,
      commitSha,
      branch,
      githubIssueNumber,
      comment,
    } = req.body;

    if (!title || !description || !source || !severity || !category) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, source, severity, category',
      });
      return;
    }

    const result = await SynthesisService.createTicket({
      title,
      description,
      source,
      severity,
      category,
      status,
      dedupHash,
      sourcePath,
      auditDocumentId,
      qaFindingId,
      supportTicketId,
      commitSha,
      branch,
      githubIssueNumber,
      createdById: req.user?.id,
      comment,
    });

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      data: result.ticket,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || (err.code === 'DATABASE_UNAVAILABLE' ? 503 : 500);
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Error creating synthesis ticket',
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/admin/synthesis/tickets/:id/comments
 * Adds a comment to an existing synthesis ticket.
 * FAIL-CLOSED: Returns 503 if DB is unavailable.
 */
router.post('/tickets/:id/comments', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { content, isInternal, isAiGenerated } = req.body;

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Content is required for comment',
      });
      return;
    }

    const authorName = req.user?.name || req.user?.email || 'Admin User';

    const comment = await SynthesisService.addComment({
      ticketId: id,
      authorId: req.user?.id,
      authorName,
      content,
      isInternal: isInternal ?? true,
      isAiGenerated: isAiGenerated ?? false,
    });

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || (err.code === 'DATABASE_UNAVAILABLE' ? 503 : 500);
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Error adding comment to synthesis ticket',
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/admin/synthesis/ingest-esbirka
 * Ingests the e-Sbírka finding as first real Synthesis ticket.
 * FAIL-CLOSED: Returns 503 if DB is unavailable.
 */
router.post('/ingest-esbirka', requireAuth as any, requireRole('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await SynthesisService.ingestEsbirkaRemediationFinding();

    res.status(result.isDuplicate ? 200 : 201).json({
      success: true,
      data: result.ticket,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || (err.code === 'DATABASE_UNAVAILABLE' ? 503 : 500);
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Error ingesting e-Sbírka remediation finding',
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/admin/synthesis/tickets/:id/github
 * Links/synchronizes GitHub metadata (Issue, PR, Commit SHA, Branch) with a Synthesis ticket.
 * STRICT FAIL-CLOSED & RBAC: Requires ADMIN role, rejects invalid SHA/numbers and cross-repository references.
 */
router.post('/tickets/:id/github', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      githubIssueNumber,
      githubIssueUrl,
      githubPrNumber,
      githubPrUrl,
      commitSha,
      branch,
      repository,
    } = req.body;

    const actorName = req.user?.name || req.user?.email || 'Admin User';

    const updatedTicket = await GithubSyncService.linkGithubMetadata({
      ticketId: id,
      githubIssueNumber: githubIssueNumber !== undefined ? Number(githubIssueNumber) : undefined,
      githubIssueUrl,
      githubPrNumber: githubPrNumber !== undefined ? Number(githubPrNumber) : undefined,
      githubPrUrl,
      commitSha,
      branch,
      repository,
      actorId: req.user?.id,
      actorName,
    });

    res.json({
      success: true,
      data: updatedTicket,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || (err.code === 'DATABASE_UNAVAILABLE' ? 503 : 500);
    res.status(statusCode).json({
      success: false,
      error: err.message || 'Error linking GitHub metadata to synthesis ticket',
      code: err.code || 'INTERNAL_ERROR',
    });
  }
});

export default router;
