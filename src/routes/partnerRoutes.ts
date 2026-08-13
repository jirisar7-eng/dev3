import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { dbStore } from '../services/dbStore';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { PartnerType } from '../types';

const router = Router();

/**
 * GET /api/partners
 * Veřejný seznam aktivních sponzorů seřazených podle priority (order).
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const dbPartners = await prisma.partner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return res.json(dbPartners);
  } catch (error: any) {
    console.warn('[Partners API Warning] Nelze načíst sponzory z DB, používám dbStore:', error?.message);
    const fallbackPartners = dbStore.partners
      .filter((p: any) => p.isActive)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return res.json(fallbackPartners);
  }
});

/**
 * GET /api/admin/partners
 * Administrační seznam všech sponzorů (i neaktivních).
 */
router.get('/admin', requireAuth as any, requireRole('ADMIN') as any, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const dbPartners = await prisma.partner.findMany({
      orderBy: { order: 'asc' },
    });
    return res.json(dbPartners);
  } catch (error: any) {
    console.warn('[Partners Admin API Warning] Nelze načíst sponzory z DB, používám dbStore:', error?.message);
    const fallbackPartners = [...dbStore.partners].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return res.json(fallbackPartners);
  }
});

/**
 * POST /api/admin/partners
 * Vytvoření nového sponzora.
 */
router.post('/admin', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { name, description, logoUrl, websiteUrl, type, order, isActive } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Název a popis sponzora jsou povinné.' });
  }

  const partnerData = {
    name,
    description,
    logoUrl: logoUrl || null,
    websiteUrl: websiteUrl || null,
    type: type || 'PARTNER',
    order: typeof order === 'number' ? order : 0,
    isActive: isActive !== undefined ? !!isActive : true,
  };

  try {
    const newPartner = await prisma.partner.create({
      // @ts-ignore
      data: partnerData,
    });

    // Synchronizace in-memory dbStore
    dbStore.partners.push({
      ...newPartner,
      createdAt: newPartner.createdAt.toISOString(),
      updatedAt: newPartner.updatedAt.toISOString(),
    });

    dbStore.logAudit('PARTNER_CREATE', 'PARTNERS_MANAGER', `Vytvořen sponzor/partner: ${name}`, req.user);
    return res.status(201).json(newPartner);
  } catch (error: any) {
    console.warn('[Partners Admin API Error] Chyba při zápisu do DB, ukládám pouze do in-memory dbStore:', error?.message);
    
    const localPartner = {
      id: 'partner-' + Date.now(),
      ...partnerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.partners.push(localPartner as any);
    
    dbStore.logAudit('PARTNER_CREATE', 'PARTNERS_MANAGER', `Vytvořen sponzor/partner (Local only): ${name}`, req.user);
    return res.status(201).json(localPartner);
  }
});

/**
 * PUT /api/admin/partners/:id
 * Aktualizace sponzora.
 */
router.put('/admin/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, description, logoUrl, websiteUrl, type, order, isActive } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Název a popis sponzora jsou povinné.' });
  }

  const partnerData = {
    name,
    description,
    logoUrl: logoUrl || null,
    websiteUrl: websiteUrl || null,
    type: type || 'PARTNER',
    order: typeof order === 'number' ? order : 0,
    isActive: isActive !== undefined ? !!isActive : true,
  };

  try {
    const updatedPartner = await prisma.partner.update({
      where: { id },
      // @ts-ignore
      data: partnerData,
    });

    // Synchronizace in-memory dbStore
    const idx = dbStore.partners.findIndex((p: any) => p.id === id);
    if (idx !== -1) {
      dbStore.partners[idx] = {
        ...dbStore.partners[idx],
        ...updatedPartner,
        createdAt: updatedPartner.createdAt.toISOString(),
        updatedAt: updatedPartner.updatedAt.toISOString(),
      };
    }

    dbStore.logAudit('PARTNER_UPDATE', 'PARTNERS_MANAGER', `Aktualizován sponzor/partner: ${name}`, req.user);
    return res.json(updatedPartner);
  } catch (error: any) {
    console.warn('[Partners Admin API Error] Chyba při úpravě v DB, upravuji v in-memory dbStore:', error?.message);
    
    const idx = dbStore.partners.findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Sponzor nebyl nalezen.' });
    }

    const localPartner = {
      ...dbStore.partners[idx],
      ...partnerData,
      updatedAt: new Date().toISOString(),
    };
    dbStore.partners[idx] = localPartner as any;

    dbStore.logAudit('PARTNER_UPDATE', 'PARTNERS_MANAGER', `Aktualizován sponzor/partner (Local only): ${name}`, req.user);
    return res.json(localPartner);
  }
});

/**
 * DELETE /api/admin/partners/:id
 * Smazání sponzora.
 */
router.delete('/admin/:id', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const deleted = await prisma.partner.delete({
      where: { id },
    });

    // Synchronizace in-memory dbStore
    dbStore.partners = dbStore.partners.filter((p: any) => p.id !== id);

    dbStore.logAudit('PARTNER_DELETE', 'PARTNERS_MANAGER', `Odstraněn sponzor/partner: ${deleted.name}`, req.user);
    return res.json({ success: true, message: 'Sponzor byl úspěšně odstraněn.' });
  } catch (error: any) {
    console.warn('[Partners Admin API Error] Chyba při smazání z DB, odstraňuji z in-memory dbStore:', error?.message);
    
    const target = dbStore.partners.find((p: any) => p.id === id);
    if (!target) {
      return res.status(404).json({ error: 'Sponzor nebyl nalezen.' });
    }

    dbStore.partners = dbStore.partners.filter((p: any) => p.id !== id);

    dbStore.logAudit('PARTNER_DELETE', 'PARTNERS_MANAGER', `Odstraněn sponzor/partner (Local only): ${target.name}`, req.user);
    return res.json({ success: true, message: 'Sponzor byl úspěšně odstraněn (Local only).' });
  }
});

export default router;
