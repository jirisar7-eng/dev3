import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { dbStore } from '../services/dbStore';
import { ensureAllModulePagesExist, convertAllPagesToPuck } from '../services/PageService';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/pages/sync-modules
 * Synchronizuje všech 33 modulů z menu do databáze/dbStore stránek.
 */
router.post('/sync-modules', requireAuth as any, requireRole('ADMIN') as any, async (_req: Request, res: Response) => {
  try {
    const result = await ensureAllModulePagesExist();
    return res.json(result);
  } catch (error: any) {
    console.error('Chyba při synchronizaci modulových stránek:', error);
    return res.status(500).json({
      error: 'Chyba při synchronizaci modulových stránek.',
      details: error?.message,
    });
  }
});

/**
 * POST /api/pages/convert-all-to-puck
 * Převede všechny stávající stránky v databázi/dbStore do formátu Puck editoru.
 */
router.post('/convert-all-to-puck', requireAuth as any, requireRole('ADMIN') as any, async (_req: Request, res: Response) => {
  try {
    const result = await convertAllPagesToPuck();
    return res.json(result);
  } catch (error: any) {
    console.error('Chyba při převodu stránek do Puck editoru:', error);
    return res.status(500).json({
      error: 'Chyba při převodu stránek do Puck editoru.',
      details: error?.message,
    });
  }
});

/**
 * GET /api/pages
 * Vrátí seznam všech stránek z DB nebo z dbStore fallbacku.
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    let pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    if (!pages || pages.length === 0) {
      pages = dbStore.pages as any[];
    }

    return res.json(pages);
  } catch (error: any) {
    console.warn('Prisma selhala, vracím stránky z dbStore:', error?.message);
    return res.json(dbStore.pages);
  }
});

/**
 * GET /api/pages/:slug
 * Vrátí stránku z DB nebo z dbStore podle zadaného slug.
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    let { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: 'Slug je povinný parametr.' });
    }

    const decodedSlug = decodeURIComponent(slug);
    const lookupSlugs = [decodedSlug];
    if (decodedSlug === '/' || decodedSlug === 'index' || decodedSlug === 'root') {
      lookupSlugs.push('home', 'domu');
    }

    let page = null;
    try {
      for (const s of lookupSlugs) {
        page = await prisma.page.findUnique({ where: { slug: s } });
        if (page) break;
      }
    } catch (e) {
      // Prisma error, fallback to dbStore
    }

    if (!page) {
      page = dbStore.pages.find((p) => lookupSlugs.includes(p.slug));
    }

    if (!page) {
      return res.status(404).json({ error: 'Stránka nebyla nalezena.' });
    }

    return res.json(page);
  } catch (error: any) {
    console.error('Chyba při načítání stránky podle slug:', error);
    return res.status(500).json({
      error: 'Chyba serveru při načítání stránky.',
      details: error?.message,
    });
  }
});

/**
 * POST /api/pages
 * Vytvoří nebo aktualizuje stránku se zadaným slugem přes upsert.
 */
router.post('/', requireAuth as any, requireRole('ADMIN') as any, async (req: Request, res: Response) => {
  try {
    const { title, slug, content } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ error: 'Parametry title a slug jsou povinné.' });
    }

    let formattedContent = content;
    if (typeof content === 'string') {
      try {
        formattedContent = JSON.parse(content);
      } catch (e) {
        formattedContent = {
          content: [
            {
              type: 'TextBlock',
              props: { text: content, align: 'left' },
            },
          ],
          root: { props: { title } },
        };
      }
    }
    if (!formattedContent || typeof formattedContent !== 'object') {
      formattedContent = { content: [], root: { props: { title } } };
    }

    let page = null;
    try {
      page = await prisma.page.upsert({
        where: { slug },
        update: {
          title,
          content: formattedContent,
        },
        create: {
          title,
          slug,
          content: formattedContent,
        },
      });
    } catch (e: any) {
      console.warn('Prisma upsert selhal, ukládám do dbStore:', e?.message);
    }

    // Always keep dbStore in sync
    const existingIdx = dbStore.pages.findIndex((p) => p.slug === slug);
    if (existingIdx >= 0) {
      dbStore.pages[existingIdx] = {
        ...dbStore.pages[existingIdx],
        title,
        content: formattedContent,
        updatedAt: new Date().toISOString(),
      };
      if (!page) page = dbStore.pages[existingIdx];
    } else {
      const newPage = {
        id: `pg-${Date.now()}`,
        title,
        slug,
        content: formattedContent,
        published: true,
        updatedAt: new Date().toISOString(),
      };
      dbStore.pages.push(newPage as any);
      if (!page) page = newPage;
    }

    return res.status(200).json(page);
  } catch (error: any) {
    console.error('Chyba při ukládání/upsertu stránky:', error);
    return res.status(500).json({
      error: 'Chyba serveru při ukládání stránky.',
      details: error?.message,
    });
  }
});

/**
 * DELETE /api/pages/:id
 * Smaže stránku podle ID nebo slugu.
 */
router.delete('/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    try {
      await prisma.page.delete({
        where: { id },
      });
    } catch (e) {
      // Ignore if prisma fails or item doesn't exist in prisma
    }

    dbStore.pages = dbStore.pages.filter((p) => p.id !== id && p.slug !== id);

    return res.json({ success: true, message: 'Stránka byla úspěšně smazána.' });
  } catch (error: any) {
    console.error('Chyba při mazání stránky:', error);
    return res.status(500).json({
      error: 'Chyba serveru při mazání stránky.',
      details: error?.message,
    });
  }
});

export default router;
