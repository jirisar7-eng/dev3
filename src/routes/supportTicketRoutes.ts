import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();


// Get tickets for current user (or all if admin)
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const userRole = req.user.role;
    const whereClause = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') 
      ? {} 
      : { userId: req.user.id };

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });
    res.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create new ticket
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const { subject, category, description, priority } = req.body;
    if (!subject || !category || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        subject,
        category,
        description,
        priority: priority || 'normal',
        userId: req.user.id
      }
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get specific ticket
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    
    // RBAC check
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter internal messages if user is not admin
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      ticket.messages = ticket.messages.filter(m => !m.isInternal);
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
});

// Add message to ticket
router.post('/:id/messages', requireAuth, async (req: any, res) => {
  try {
    const { content, isInternal } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (ticket.userId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const message = await prisma.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: req.user.id,
        content,
        isInternal: isAdmin ? !!isInternal : false
      }
    });

    // Update ticket status/updatedAt
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { 
        updatedAt: new Date(),
        status: isAdmin ? 'in_progress' : 'open'
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

export default router;
