import { Router, Request, Response } from 'express';
import {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  seedSystemTemplates,
} from '../services/templateService';

const router = Router();

/**
 * GET /api/templates
 * Vrátí seznam všech šablon (volitelně filtrováno podle category)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const templates = await getAllTemplates(category);
    return res.json(templates);
  } catch (error: any) {
    console.error('Chyba při načítání šablon:', error);
    return res.status(500).json({ error: 'Chyba při načítání šablon.', details: error?.message });
  }
});

/**
 * GET /api/templates/:id
 * Vrátí konkrétní šablonu podle ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const template = await getTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: 'Šablona nebyla nalezena.' });
    }
    return res.json(template);
  } catch (error: any) {
    console.error('Chyba při načítání šablony:', error);
    return res.status(500).json({ error: 'Chyba při načítání šablony.', details: error?.message });
  }
});

/**
 * POST /api/templates
 * Vytvoří novou opodstatněnou šablonu
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, category, description, puckDataJson, thumbnailUrl, isSystem } = req.body;

    if (!name || !puckDataJson) {
      return res.status(400).json({ error: 'Jméno šablony a data v Puck formátu jsou povinná.' });
    }

    const formattedDataJson =
      typeof puckDataJson === 'object' ? JSON.stringify(puckDataJson) : puckDataJson;

    const created = await createTemplate({
      name,
      category: category || 'CUSTOM',
      description,
      puckDataJson: formattedDataJson,
      thumbnailUrl,
      isSystem: !!isSystem,
    });

    return res.status(201).json(created);
  } catch (error: any) {
    console.error('Chyba při vytváření šablony:', error);
    return res.status(500).json({ error: 'Chyba při vytváření šablony.', details: error?.message });
  }
});

/**
 * PUT /api/templates/:id
 * Aktualizuje existující šablonu
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, description, puckDataJson, thumbnailUrl } = req.body;

    const formattedDataJson =
      puckDataJson && typeof puckDataJson === 'object' ? JSON.stringify(puckDataJson) : puckDataJson;

    const updated = await updateTemplate(id, {
      name,
      category,
      description,
      puckDataJson: formattedDataJson,
      thumbnailUrl,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Šablona nebyla nalezena pro aktualizaci.' });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error('Chyba při aktualizaci šablony:', error);
    return res.status(500).json({ error: 'Chyba při aktualizaci šablony.', details: error?.message });
  }
});

/**
 * DELETE /api/templates/:id
 * Smaže šablonu podle ID
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteTemplate(id);
    return res.json({ success: true, message: 'Šablona byla úspěšně smazána.' });
  } catch (error: any) {
    console.error('Chyba při mazání šablony:', error);
    return res.status(500).json({ error: 'Chyba při mazání šablony.', details: error?.message });
  }
});

/**
 * POST /api/templates/seed
 * Znovu inicializuje systémové šablony
 */
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    await seedSystemTemplates();
    return res.json({ success: true, message: 'Systémové šablony byly úspěšně inicializovány.' });
  } catch (error: any) {
    console.error('Chyba při inicializaci šablon:', error);
    return res.status(500).json({ error: 'Chyba při inicializaci šablon.', details: error?.message });
  }
});

export default router;
