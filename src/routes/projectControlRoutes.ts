import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { ProjectControlService } from '../services/projectControlService';
import type { ProjectTaskStatus, ProjectTaskPriority, ProjectTaskCategory } from '../types/projectControl';

const router = Router();

// Middleware to check admin or content manager access
const requireAdminOrContentManager = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Přihlášení vyžadováno.' });
  }
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'SYSTEM_ADMIN', 'CONTENT_MANAGER', 'LEGAL_EDITOR'];
  if (allowedRoles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: `Přístup odepřen (RBAC 403). Role '${req.user.role}' nemá oprávnění k sekci Obsah & Projekt.`,
  });
};

/**
 * GET /api/admin/project-control/overview
 * Returns dashboard metrics, status breakdown, phase summary and recent items.
 */
router.get('/overview', requireAuth as any, requireAdminOrContentManager as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await ProjectControlService.getOverview();
    return res.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error in /overview:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání přehledu projektu.',
    });
  }
});

/**
 * GET /api/admin/project-control/content
 * Returns catalog of portal content items, modules and tools.
 */
router.get('/content', requireAuth as any, requireAdminOrContentManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, status, search } = req.query;
    const content = ProjectControlService.getContentCatalog({
      category: category as string,
      status: status as string,
      search: search as string,
    });
    return res.json({
      success: true,
      data: content,
      total: content.length,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error in /content:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání katalogu obsahu portálu.',
    });
  }
});

/**
 * GET /api/admin/project-control/recommendations
 * Returns audit recommendations mapped from historic audit reports.
 */
router.get('/recommendations', requireAuth as any, requireAdminOrContentManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phase, priority, status, search } = req.query;
    const recommendations = ProjectControlService.getAuditRecommendations({
      phase: phase as string,
      priority: priority as string,
      status: status as string,
      search: search as string,
    });
    return res.json({
      success: true,
      data: recommendations,
      total: recommendations.length,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error in /recommendations:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání auditních doporučení.',
    });
  }
});

/**
 * GET /api/admin/project-control/phases
 * Returns all development & audit phases (1 through 19+).
 */
router.get('/phases', requireAuth as any, requireAdminOrContentManager as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const phases = ProjectControlService.getProjectPhases();
    return res.json({
      success: true,
      data: phases,
      total: phases.length,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error in /phases:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání fází projektu.',
    });
  }
});

/**
 * GET /api/admin/project-control/tasks
 * Returns project backlog tasks with filters.
 */
router.get('/tasks', requireAuth as any, requireAdminOrContentManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, priority, category, search } = req.query;
    const tasks = await ProjectControlService.getAllTasks({
      status: status as ProjectTaskStatus | 'ALL',
      priority: priority as ProjectTaskPriority | 'ALL',
      category: category as ProjectTaskCategory | 'ALL',
      search: search as string,
    });
    return res.json({
      success: true,
      data: tasks,
      total: tasks.length,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error in /tasks:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Chyba při načítání seznamu úkolů.',
    });
  }
});

/**
 * POST /api/admin/project-control/tasks
 * Creates a new task / idea / proposal.
 */
router.post('/tasks', requireAuth as any, requireAdminOrContentManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, status, priority, category, assignedToName, notes } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Název úkolu (title) je povinný parametr.',
      });
    }

    const task = await ProjectControlService.createTask(
      {
        title,
        description: description || '',
        status,
        priority,
        category,
        assignedToName,
        notes,
      },
      req.user,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: `Úkol "${task.title}" byl úspěšně vytvořen.`,
      data: task,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error creating task:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Chyba při vytváření úkolu.',
    });
  }
});

/**
 * PUT /api/admin/project-control/tasks/:id
 * Updates task status, priority, description, etc.
 */
router.put('/tasks/:id', requireAuth as any, requireAdminOrContentManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, category, assignedToName, notes } = req.body;

    const updated = await ProjectControlService.updateTask(
      id,
      {
        title,
        description,
        status,
        priority,
        category,
        assignedToName,
        notes,
      },
      req.user,
      req.ip
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: `Úkol s ID ${id} nebyl nalezen.`,
      });
    }

    return res.json({
      success: true,
      message: `Úkol ID ${id} byl úspěšně aktualizován.`,
      data: updated,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error updating task:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Chyba při aktualizaci úkolu.',
    });
  }
});

/**
 * DELETE /api/admin/project-control/tasks/:id
 * Deletes or archives a task.
 */
router.delete('/tasks/:id', requireAuth as any, requireAdminOrContentManager as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await ProjectControlService.deleteTask(id, req.user, req.ip);

    return res.json({
      success,
      message: `Úkol ID ${id} byl úspěšně odstraněn.`,
    });
  } catch (error: any) {
    console.error('[ProjectControlRoutes] Error deleting task:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Chyba při mazání úkolu.',
    });
  }
});

export default router;
