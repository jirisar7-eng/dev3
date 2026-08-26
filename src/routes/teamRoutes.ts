import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requirePermission, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// Helper to verify IDOR / BOLA ticket access for team members
async function verifyTicketAccess(req: AuthenticatedRequest, ticketId: string) {
  const user = req.user;
  if (!user) return { allowed: false, ticket: null, reason: 'UNAUTHENTICATED' };

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
        },
      },
    },
  });

  if (!ticket) {
    return { allowed: false, ticket: null, reason: 'NOT_FOUND' };
  }

  // Super Admin / Admin always allowed
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'SYSTEM_ADMIN') {
    return { allowed: true, ticket };
  }

  // Check if user has permission to view all tickets
  const hasViewAll = await (prisma as any).rolePermission.findFirst({
    where: {
      role: { key: user.role },
      permission: { key: 'team.tickets.view_all' },
    },
  });

  if (hasViewAll) {
    return { allowed: true, ticket };
  }

  // If user has view_assigned, ticket MUST be assigned to them
  const hasViewAssigned = await (prisma as any).rolePermission.findFirst({
    where: {
      role: { key: user.role },
      permission: { key: 'team.tickets.view_assigned' },
    },
  });

  if (hasViewAssigned && ticket.assignedToId === user.id) {
    return { allowed: true, ticket };
  }

  return { allowed: false, ticket, reason: 'FORBIDDEN' };
}

// ------------------------------------------------------
// 1. STATS / KPI OVERVIEW
// ------------------------------------------------------
router.get('/stats', requireAuth, requirePermission('team.access'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const [
      totalOpen,
      unassignedTriage,
      myAssigned,
      resolvedCount,
      pendingSubjects,
      pendingReviews,
    ] = await Promise.all([
      prisma.supportTicket.count({
        where: { status: { in: ['open', 'in_progress'] } },
      }),
      prisma.supportTicket.count({
        where: { assignedToId: null, status: { not: 'closed' } },
      }),
      prisma.supportTicket.count({
        where: { assignedToId: userId, status: { in: ['open', 'in_progress'] } },
      }),
      prisma.supportTicket.count({
        where: { status: { in: ['resolved', 'closed'] } },
      }),
      // Moderation metrics if available
      prisma.subjekt.count({ where: { status: 'PENDING' } }).catch(() => 0),
      prisma.hodnoceni.count({ where: { status: 'PENDING' } }).catch(() => 0),
    ]);

    res.json({
      totalOpen,
      unassignedTriage,
      myAssigned,
      resolvedCount,
      pendingSubjects,
      pendingReviews,
    });
  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({ error: 'Chyba při načítání týmových statistik' });
  }
});

// ------------------------------------------------------
// 2. TICKETS - ASSIGNED TO ME
// ------------------------------------------------------
router.get('/tickets/assigned', requireAuth, requirePermission('team.tickets.view_assigned'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const statusFilter = req.query.status as string;

    const whereClause: any = {
      assignedToId: userId,
    };

    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { lastActivityAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { messages: true } },
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    res.status(500).json({ error: 'Chyba při načítání přiřazených tiketů' });
  }
});

// ------------------------------------------------------
// 3. TICKETS - TRIAGE (UNASSIGNED)
// ------------------------------------------------------
router.get('/tickets/triage', requireAuth, requirePermission('team.tickets.view_all'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: {
        assignedToId: null,
        status: { not: 'closed' },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching triage tickets:', error);
    res.status(500).json({ error: 'Chyba při načítání fronty triage' });
  }
});

// ------------------------------------------------------
// 4. TICKETS - ALL TICKETS (FOR COORDINATORS & ADMINS)
// ------------------------------------------------------
router.get('/tickets/all', requireAuth, requirePermission('team.tickets.view_all'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const category = req.query.category as string;
    const search = req.query.search as string;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { lastActivityAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching all team tickets:', error);
    res.status(500).json({ error: 'Chyba při načítání tiketů' });
  }
});

// ------------------------------------------------------
// 5. TICKET DETAIL - WITH IDOR / BOLA PROTECTION
// ------------------------------------------------------
router.get('/tickets/:id', requireAuth, requirePermission('team.access'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { allowed, ticket, reason } = await verifyTicketAccess(req, req.params.id);

    if (reason === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Tiket nebyl nalezen' });
    }

    if (!allowed) {
      return res.status(403).json({
        error: 'Přístup odepřen. Nemáte oprávnění k zobrazení tohoto klientského požadavku.',
      });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket detail:', error);
    res.status(500).json({ error: 'Chyba při načítání detailu tiketu' });
  }
});

// ------------------------------------------------------
// 6. ASSIGN TICKET (COORDINATOR / ADMIN)
// ------------------------------------------------------
router.post('/tickets/:id/assign', requireAuth, requirePermission('team.tickets.assign'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { assignedToId } = req.body;
    const ticketId = req.params.id;

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Tiket nebyl nalezen' });

    let assignee = null;
    if (assignedToId) {
      assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!assignee) {
        return res.status(400).json({ error: 'Vybraný řešitel nebyl v systému nalezen' });
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: assignedToId || null,
        assignedAt: assignedToId ? new Date() : null,
        assignedById: assignedToId ? req.user!.id : null,
        status: ticket.status === 'open' && assignedToId ? 'in_progress' : ticket.status,
        lastActivityAt: new Date(),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Record internal audit note
    const auditText = assignee
      ? `[SYSTÉM] Tiket byl přiřazen řešiteli ${assignee.name} (${assignee.role}) koordinátorem ${req.user!.name}.`
      : `[SYSTÉM] Přiřazení tiketu bylo zrušeno koordinátorem ${req.user!.name}. Tiket byl vrácen do fronty Triage.`;

    await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId: req.user!.id,
        content: auditText,
        isInternal: true,
      },
    });

    // Increment internal notes count
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { internalNotesCount: { increment: 1 } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ error: 'Chyba při přiřazení tiketu' });
  }
});

// ------------------------------------------------------
// 7. SELF-ASSIGN TICKET (MENTOR / VOLUNTEER)
// ------------------------------------------------------
router.post('/tickets/:id/self-assign', requireAuth, requirePermission('team.tickets.view_assigned'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = req.params.id;
    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: 'Tiket nebyl nalezen' });

    if (ticket.assignedToId && ticket.assignedToId !== req.user!.id) {
      // Check if user has permission to reassign
      const canReassign = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
      if (!canReassign) {
        return res.status(400).json({ error: 'Tento tiket je již přiřazen jinému řešiteli.' });
      }
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: req.user!.id,
        assignedAt: new Date(),
        assignedById: req.user!.id,
        status: ticket.status === 'open' ? 'in_progress' : ticket.status,
        lastActivityAt: new Date(),
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId: req.user!.id,
        content: `[SYSTÉM] Pracovník ${req.user!.name} (${req.user!.role}) převzal tiket k řešení.`,
        isInternal: true,
      },
    });

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { internalNotesCount: { increment: 1 } },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error self-assigning ticket:', error);
    res.status(500).json({ error: 'Chyba při převzetí tiketu' });
  }
});

// ------------------------------------------------------
// 8. REPLY / INTERNAL NOTE
// ------------------------------------------------------
router.post('/tickets/:id/reply', requireAuth, requirePermission('team.tickets.reply'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { content, isInternal, newStatus } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Obsah zprávy nesmí být prázdný' });
    }

    const { allowed, ticket, reason } = await verifyTicketAccess(req, ticketId);
    if (!allowed || !ticket) {
      return res.status(403).json({ error: 'Přístup odepřen. Nemáte oprávnění odpovídat na tento tiket.' });
    }

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId: req.user!.id,
        content: content.trim(),
        isInternal: !!isInternal,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatar: true } },
      },
    });

    // Update ticket metadata
    const updateData: any = {
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    };

    if (isInternal) {
      updateData.internalNotesCount = { increment: 1 };
    }

    if (newStatus && ['open', 'in_progress', 'resolved', 'closed'].includes(newStatus)) {
      updateData.status = newStatus;
      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolvedAt = new Date();
      }
    } else if (ticket.status === 'open') {
      updateData.status = 'in_progress';
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error replying to ticket:', error);
    res.status(500).json({ error: 'Chyba při odesílání odpovědi' });
  }
});

// ------------------------------------------------------
// 9. CHANGE TICKET STATUS (RESOLVE / CLOSE / REOPEN)
// ------------------------------------------------------
router.post('/tickets/:id/status', requireAuth, requirePermission('team.tickets.reply'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Neplatný stav tiketu' });
    }

    const { allowed, ticket } = await verifyTicketAccess(req, ticketId);
    if (!allowed || !ticket) {
      return res.status(403).json({ error: 'Přístup odepřen k tomuto tiketu' });
    }

    const statusLabels: Record<string, string> = {
      open: 'Otevřený',
      in_progress: 'V řešení',
      resolved: 'Vyřešený',
      closed: 'Uzavřený',
    };

    const updateData: any = {
      status,
      lastActivityAt: new Date(),
    };

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    await prisma.supportTicketMessage.create({
      data: {
        ticketId,
        userId: req.user!.id,
        content: `[SYSTÉM] Stav tiketu byl změněn na: "${statusLabels[status] || status}" pracovníkem ${req.user!.name}.`,
        isInternal: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Chyba při změně stavu tiketu' });
  }
});

// ------------------------------------------------------
// 10. VOLUNTEERS LIST (FOR ASSIGNMENT & COORDINATION)
// ------------------------------------------------------
router.get('/volunteers', requireAuth, requirePermission('team.volunteers.view'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const teamRoles: any[] = ['VOLUNTEER', 'MODERATOR', 'LEGAL_EDITOR', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM_ADMIN'];

    const volunteers = await prisma.user.findMany({
      where: {
        role: { in: teamRoles },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            assignedTickets: {
              where: { status: { in: ['open', 'in_progress'] } },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers list:', error);
    res.status(500).json({ error: 'Chyba při načítání seznamu týmu' });
  }
});

// ------------------------------------------------------
// 11. TEAM KNOWLEDGE BASE / GUIDELINES
// ------------------------------------------------------
router.get('/knowledge', requireAuth, requirePermission('team.knowledge.view'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const knowledgeItems = [
      {
        id: 'k-1',
        title: 'Metodika prvního kontaktu s tátou v krizové situaci',
        category: 'Krizová intervence',
        summary: 'Zásady uklidnění situace, aktivní naslouchání a deeskalace konfliktu.',
        content: `1. Uklidnění a bezpečný prostor: Táta přichází často v silném afektu, po vyhazovu z domova nebo zabránění styku s dítětem.
2. Zákaz radikalizace: Nikdy nepodporujeme agresivní reakce, odvety ani eskalaci trestních oznámení.
3. Priority prvních 48 hodin: Zajištění kontaktu s dítětem (klidná SMS/e-mail), evidence incidentu, kontaktování OSPOD klidnou věcnou formou.`,
      },
      {
        id: 'k-2',
        title: 'Postup při maření styku a předběžná opatření',
        category: 'Právní metodika',
        summary: 'Jak správně dokumentovat nepředání dítěte a kdy má smysl podávat návrh na předběžné opatření dle § 452 ZŘS.',
        content: `• Důkazní břemeno: Vždy slušně zaznamenat přítomnost v místě předání (svědek, audiozáznam bez konfliktu, SMS).
• Komunikace s OSPOD: Oznámit nepředání sociální pracovnici do 24 hodin bez emocí.
• Návrh na soud: Podávat pouze při soustavném maření styku nebo ohrožení vývoje dítěte.`,
      },
      {
        id: 'k-3',
        title: 'Kodex dobrovolníka spolku Táta má právo',
        category: 'Etika & Bezpečnost',
        summary: 'Pravidla mlčenlivosti, ochrany osobních údajů dětí a zákaz právního zastupování bez advokátní licence.',
        content: `• Čl. 1: Dítě je na prvním místě. Každá rada musí směřovat k zájmu dítěte na péči obou rodičů.
• Čl. 2: Přísná mlčenlivost. Žádné údaje o klientských případech se nesmí dostat mimo autorizované kanály.
• Čl. 3: Peer podpora není advokátní služba. Dobrovolník poskytuje osobní a organizační zkušenost, nikoli placené právní poradenství.`,
      },
    ];

    res.json(knowledgeItems);
  } catch (error) {
    console.error('Error fetching knowledge items:', error);
    res.status(500).json({ error: 'Chyba při načítání znalostní báze' });
  }
});

export default router;
