import { prisma, isPrismaAvailable } from '../db/prisma';
import { User } from '../types';

export class CoParentService {
  /**
   * Get or create active CoParent space for user
   */
  public static async getOrCreateSpace(user: User) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) {
      throw new Error('Databáze není dostupná.');
    }

    // Check if user is member of any space or owner
    let space = await (p as any).coparentSpace.findFirst({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      },
      include: {
        members: { include: { user: true } },
        children: true,
        documents: true
      }
    });

    if (!space) {
      // Create default space
      space = await (p as any).coparentSpace.create({
        data: {
          title: `Spolurodičovský prostor - ${user.name}`,
          conflictMode: 'COOPERATION',
          ownerId: user.id,
          members: {
            create: [
              { userId: user.id, role: 'PARENT' }
            ]
          },
          children: {
            create: [
              { firstName: 'Dítě', lastName: user.name.split(' ').pop() || 'Nové' }
            ]
          }
        },
        include: {
          members: { include: { user: true } },
          children: true,
          documents: true
        }
      });

      await (p as any).coparentAuditLog.create({
        data: {
          spaceId: space.id,
          userId: user.id,
          action: 'SPACE_CREATED',
          entity: 'CoParentSpace',
          entityId: space.id,
          details: `Vytvořen nový spolurodičovský prostor uživatelem ${user.email}`
        }
      });
    }

    return space;
  }

  /**
   * Get Dashboard summary for CoParent space
   */
  public static async getDashboard(spaceId: string, userId: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const space = await (p as any).coparentSpace.findUnique({
      where: { id: spaceId },
      include: {
        children: true,
        members: { include: { user: true } },
        handovers: { orderBy: { scheduledAt: 'asc' }, take: 5 },
        expenses: { where: { status: 'PENDING' } },
        requests: { where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'desc' }, take: 10, include: { sender: true } },
        agreements: true
      }
    });

    if (!space) throw new Error('Spolurodičovský prostor nenalezen.');

    return {
      space: {
        id: space.id,
        title: space.title,
        conflictMode: space.conflictMode,
        ownerId: space.ownerId
      },
      conflictMode: space.conflictMode,
      children: space.children,
      members: space.members,
      upcomingHandovers: space.handovers,
      pendingExpenses: space.expenses,
      pendingRequests: space.requests,
      recentMessages: space.messages,
      agreementsCount: space.agreements.length
    };
  }

  /**
   * Update conflict mode (COOPERATION, DISAGREEMENT, HIGH_CONFLICT)
   */
  public static async updateConflictMode(spaceId: string, conflictMode: string, user: User) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const updated = await (p as any).coparentSpace.update({
      where: { id: spaceId },
      data: { conflictMode }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId: user.id,
        action: 'CONFLICT_MODE_CHANGED',
        entity: 'CoParentSpace',
        entityId: spaceId,
        details: `Režim konfliktu změněn na: ${conflictMode} uživatelem ${user.email}`
      }
    });

    return updated;
  }

  /**
   * Create structured request (Schedule change, expense approval, agreement modification)
   */
  public static async createRequest(spaceId: string, userId: string, type: string, details: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const request = await (p as any).coparentRequest.create({
      data: {
        spaceId,
        requesterId: userId,
        type,
        details,
        status: 'PENDING'
      }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'REQUEST_CREATED',
        entity: 'CoParentRequest',
        entityId: request.id,
        details: `Nová strukturovaná žádost [${type}]: ${details}`
      }
    });

    return request;
  }

  /**
   * Send message (Blocks direct chat if HIGH_CONFLICT)
   */
  public static async sendMessage(spaceId: string, userId: string, content: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const space = await (p as any).coparentSpace.findUnique({ where: { id: spaceId } });
    if (!space) throw new Error('Prostor nenalezen.');

    if (space.conflictMode === 'HIGH_CONFLICT') {
      throw new Error('V režimu vysokého konfliktu (HIGH_CONFLICT) je přímý chat deaktivován. Použijte prosím strukturované žádosti.');
    }

    const message = await (p as any).coparentMessage.create({
      data: {
        spaceId,
        senderId: userId,
        content,
        isApproved: true
      },
      include: { sender: true }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'MESSAGE_SENT',
        entity: 'CoParentMessage',
        entityId: message.id,
        details: `Odeslána zpráva v chatu.`
      }
    });

    return message;
  }

  /**
   * Export audit data for legal / mediation
   */
  public static async exportAuditData(spaceId: string, userId: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const space = await (p as any).coparentSpace.findUnique({
      where: { id: spaceId },
      include: {
        members: { include: { user: true } },
        children: true,
        events: true,
        handovers: true,
        messages: true,
        agreements: true,
        expenses: true,
        dailyUpdates: true,
        requests: true,
        auditLogs: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!space) throw new Error('Prostor nenalezen.');

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'AUDIT_DATA_EXPORTED',
        entity: 'CoParentSpace',
        entityId: spaceId,
        details: `Exportován kompletní auditní záznam pro právní / mediační účely.`
      }
    });

    return {
      exportVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      spaceInfo: {
        id: space.id,
        title: space.title,
        conflictMode: space.conflictMode,
        createdAt: space.createdAt
      },
      members: space.members,
      children: space.children,
      events: space.events,
      handovers: space.handovers,
      messages: space.messages,
      agreements: space.agreements,
      expenses: space.expenses,
      dailyUpdates: space.dailyUpdates,
      requests: space.requests,
      auditLogs: space.auditLogs
    };
  }

  /**
   * Add Expense
   */
  public static async createExpense(spaceId: string, userId: string, data: any) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const expense = await (p as any).coparentExpense.create({
      data: {
        spaceId,
        createdBy: userId,
        title: data.title,
        amount: parseFloat(data.amount),
        currency: data.currency || 'CZK',
        category: data.category || 'GENERAL',
        receiptUrl: data.receiptUrl,
        status: 'PENDING'
      }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'EXPENSE_CREATED',
        entity: 'CoParentExpense',
        entityId: expense.id,
        details: `Přidán nový výdaj: ${expense.title} (${expense.amount} ${expense.currency})`
      }
    });

    return expense;
  }

  /**
   * Update Expense Status (Approve / Reject)
   */
  public static async updateExpenseStatus(expenseId: string, userId: string, status: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const expense = await (p as any).coparentExpense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Výdaj nenalezen.');

    const updated = await (p as any).coparentExpense.update({
      where: { id: expenseId },
      data: { status }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId: expense.spaceId,
        userId,
        action: `EXPENSE_${status}`,
        entity: 'CoParentExpense',
        entityId: expenseId,
        details: `Výdaj "${expense.title}" byl ${status === 'APPROVED' ? 'schválen' : 'zamítnut'}.`
      }
    });

    return updated;
  }

  /**
   * Create Agreement
   */
  public static async createAgreement(spaceId: string, userId: string, data: any) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const agreement = await (p as any).coparentAgreement.create({
      data: {
        spaceId,
        title: data.title,
        content: data.content,
        status: 'PROPOSED'
      }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'AGREEMENT_CREATED',
        entity: 'CoParentAgreement',
        entityId: agreement.id,
        details: `Navržena nová dohoda: ${agreement.title}`
      }
    });

    return agreement;
  }

  /**
   * Create Invitation
   */
  public static async createInvite(spaceId: string, userId: string, email: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `CP-${randomStr}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const invite = await (p as any).coparentInvite.create({
      data: {
        spaceId,
        invitedBy: userId,
        email,
        code,
        status: 'PENDING',
        expiresAt
      }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'INVITE_CREATED',
        entity: 'CoParentInvite',
        entityId: invite.id,
        details: `Vytvořena pozvánka pro email ${email} s kódem ${code}`
      }
    });

    return invite;
  }

  /**
   * Accept Invitation
   */
  public static async acceptInvite(code: string, user: User, role: string = 'PARENT') {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const invite = await (p as any).coparentInvite.findUnique({
      where: { code }
    });

    if (!invite) throw new Error('Pozvánka s tímto kódém nebyla nalezena.');
    if (invite.status !== 'PENDING') throw new Error('Tato pozvánka již byla využita nebo vypršela.');
    if (new Date() > new Date(invite.expiresAt)) {
      await (p as any).coparentInvite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' }
      });
      throw new Error('Platnost pozvánky vypršela (48h).');
    }

    // Check if user is already member of this space
    const existingMember = await (p as any).coparentMember.findFirst({
      where: { spaceId: invite.spaceId, userId: user.id }
    });

    if (!existingMember) {
      await (p as any).coparentMember.create({
        data: {
          spaceId: invite.spaceId,
          userId: user.id,
          role: role || 'PARENT'
        }
      });
    }

    await (p as any).coparentInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' }
    });

    await (p as any).coparentAuditLog.create({
      data: {
        spaceId: invite.spaceId,
        userId: user.id,
        action: 'INVITE_ACCEPTED',
        entity: 'CoParentInvite',
        entityId: invite.id,
        details: `Uživatel ${user.email} přijal pozvánku ${code} a připojil se do prostoru.`
      }
    });

    return { success: true, spaceId: invite.spaceId };
  }

  /**
   * Get Members of Space
   */
  public static async getMembers(spaceId: string) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const members = await (p as any).coparentMember.findMany({
      where: { spaceId },
      include: { user: true }
    });

    return members;
  }

  /**
   * Apply AI Extracted Judgment Setup
   */
  public static async applyJudgmentSetup(spaceId: string, userId: string, data: any) {
    const p = prisma;
    if (!isPrismaAvailable() || !p) throw new Error('Databáze není dostupná.');

    const nameParts = (data.childName || 'Dítě Novák').trim().split(' ');
    const firstName = nameParts[0] || 'Dítě';
    const lastName = nameParts.slice(1).join(' ') || 'Nováková';

    // 1. Create or update child
    const child = await (p as any).coparentChild.create({
      data: {
        spaceId,
        firstName,
        lastName,
        birthDate: data.childBirthDate || null,
        notes: `Režim péče: ${data.custodyType}, Rozvrh: ${data.scheduleType}. Prázdniny: ${data.holidaysRule || 'Neuvedeno'}`
      }
    });

    // 2. Generate handover
    const now = new Date();
    const handover = await (p as any).coparentHandover.create({
      data: {
        spaceId,
        scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days later as next handover
        location: data.handoverLocation || 'Předávací místo / Bydliště',
        status: 'SCHEDULED',
        notes: `Čas předání dle rozsudku: ${data.handoverTime} (${data.handoverDay})`
      }
    });

    // 3. Create Alimony expense rule
    if (data.alimonyAmount && data.alimonyAmount > 0) {
      await (p as any).coparentExpense.create({
        data: {
          spaceId,
          title: `Měsíční výživné na ${firstName} (${data.alimonyDueDate}. den v měsíci)`,
          amount: Number(data.alimonyAmount),
          currency: 'CZK',
          category: 'ALIMONY' as any,
          status: 'APPROVED',
          createdBy: userId
        }
      });
    }

    // 4. Create Agreement summary
    await (p as any).coparentAgreement.create({
      data: {
        spaceId,
        title: `Soudní rozsudek / Dohoda o péči - ${firstName} ${lastName}`,
        content: `Typ péče: ${data.custodyType}\\nRozvrh: ${data.scheduleType}\\nPředání: ${data.handoverDay} v ${data.handoverTime}\\nMísto: ${data.handoverLocation || 'Neuvedeno'}\\nVýživné: ${data.alimonyAmount || 0} Kč (splatné ${data.alimonyDueDate}.)\\nPravidla pro prázdniny: ${data.holidaysRule || 'Není určeno'}`,
        status: 'ACCEPTED'
      }
    });

    // 5. Audit Log
    await (p as any).coparentAuditLog.create({
      data: {
        spaceId,
        userId,
        action: 'JUDGMENT_IMPORTED',
        entity: 'CoParentChild',
        entityId: child.id,
        details: `Úspěšně importován rozsudek / dohoda pro dítě ${firstName} ${lastName} (AI Extractor).`
      }
    });

    return { success: true, child, handover };
  }
}

