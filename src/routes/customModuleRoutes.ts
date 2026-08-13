import { Router, Request, Response } from 'express';
import { CustomModuleService } from '../services/customModuleService';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * GET /api/custom-modules
 * Veřejný seznam aktivních dynamických modulů
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const onlyActive = req.query.all !== 'true';
    const modules = await CustomModuleService.getAllCustomModules(onlyActive);
    return res.json(modules);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Chyba při načítání modulů' });
  }
});

/**
 * GET /api/custom-modules/admin
 * Správa všech modulů v administraci
 */
router.get('/admin', requireAuth as any, requireRole('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const modules = await CustomModuleService.getAllCustomModules(false);
    return res.json(modules);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Chyba při načítání modulů pro admin' });
  }
});

/**
 * GET /api/custom-modules/slug/:slug
 * Načtení detailu dynamického modulu podle slugu pro vykreslení v UI
 */
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const moduleItem = await CustomModuleService.getCustomModuleBySlug(slug);
    if (!moduleItem) {
      return res.status(404).json({ error: 'Modul nebyl nalezena nebo je neaktivní' });
    }
    return res.json(moduleItem);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Chyba při načítání detailu modulu' });
  }
});

/**
 * GET /api/custom-modules/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const moduleItem = await CustomModuleService.getCustomModuleById(id);
    if (!moduleItem) {
      return res.status(404).json({ error: 'Modul nebyl nalezen' });
    }
    return res.json(moduleItem);
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Chyba při načítání modulu' });
  }
});

/**
 * POST /api/custom-modules
 * Vytvoření nového Schema-Driven modulu
 */
router.post('/', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug, title, category, icon, showInMenu, isActive, contentJson } = req.body;

    if (!slug || !title || !contentJson) {
      return res.status(400).json({ error: 'Identifikátor (slug), název (title) a JSON schématu (contentJson) jsou povinné.' });
    }

    const newModule = await CustomModuleService.createCustomModule(
      {
        slug,
        title,
        category,
        icon,
        showInMenu,
        isActive,
        contentJson,
      },
      req.user
    );

    return res.status(201).json(newModule);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Chyba při vytváření modulu' });
  }
});

/**
 * PUT /api/custom-modules/:id
 * Úprava Schema-Driven modulu
 */
router.put('/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { slug, title, category, icon, showInMenu, isActive, contentJson } = req.body;

    const updated = await CustomModuleService.updateCustomModule(
      id,
      {
        slug,
        title,
        category,
        icon,
        showInMenu,
        isActive,
        contentJson,
      },
      req.user
    );

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Chyba při úpravě modulu' });
  }
});

/**
 * PATCH /api/custom-modules/:id/toggle
 * Rychlé přepnutí stavu (aktivní / zobrazit v menu)
 */
router.patch('/:id/toggle', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, showInMenu } = req.body;

    const updated = await CustomModuleService.updateCustomModule(
      id,
      {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(showInMenu !== undefined ? { showInMenu } : {}),
      },
      req.user
    );

    return res.json(updated);
  } catch (error: any) {
    return res.status(400).json({ error: error?.message || 'Chyba při přepínání stavu modulu' });
  }
});

/**
 * DELETE /api/custom-modules/:id
 * Smazání modulu
 */
router.delete('/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await CustomModuleService.deleteCustomModule(id, req.user);
    if (!success) {
      return res.status(404).json({ error: 'Modul k odstranění nebyl nalezen' });
    }
    return res.json({ success: true, message: 'Modul byl úspěšně odstraněn' });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Chyba při mazání modulu' });
  }
});

export default router;
