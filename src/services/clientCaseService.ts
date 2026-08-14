import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { AuditService } from './auditService';

const getPrismaClient = () => prisma;
import {
  User,
  ClientCase,
  CaseParticipant,
  CaseChild,
  CaseEvent,
  CaseDeadline,
  CaseTask,
  CaseNote,
  CaseDocument,
  CaseEvidence,
  CaseCommunication,
  CareArrangement,
  CaseTimelineItem,
} from '../types';

export class ClientCaseService {
  /**
   * Helper: check if user is admin
   */
  private static isAdmin(user: User): boolean {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || (user.role as any) === 'SYSTEM_ADMIN';
  }

  /**
   * Authorize access to a specific case by caseId
   */
  public static async authorizeCaseAccess(caseId: string, user: User): Promise<ClientCase> {
    const activeCase = await this.getCaseById(caseId, user);
    if (!activeCase) {
      throw new Error('Případ nebyl nalezen.');
    }
    if (activeCase.ownerId !== user.id && !this.isAdmin(user)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění k tomuto případu.');
    }
    return activeCase;
  }

  /**
   * Get all cases owned by user (or all if admin)
   */
  public static async getCasesForUser(targetUserId: string, requestingUser: User): Promise<ClientCase[]> {
    if (targetUserId !== requestingUser.id && !this.isAdmin(requestingUser)) {
      throw new Error('Přístup odepřen: Nemáte oprávnění zobrazit případy jiného uživatele.');
    }

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const found = await (prisma as any).case.findMany({
          where: { ownerId: targetUserId },
          include: {
            children: true,
            participants: true,
            careArrangements: true,
          },
          orderBy: { updatedAt: 'desc' },
        });
        if (found && found.length > 0) return found;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma getCasesForUser fallback to dbStore:', e);
      }
    }

    // In-memory fallback
    let userCases = dbStore.cases.filter((c) => c.ownerId === targetUserId);
    if (userCases.length === 0) {
      // Auto-provision a default case if none exists
      const defaultCase = await this.createDefaultCaseForUser(targetUserId, requestingUser);
      userCases = [defaultCase];
    }
    return userCases;
  }

  /**
   * Get single case with all sub-modules loaded
   */
  public static async getCaseById(caseId: string, requestingUser: User): Promise<ClientCase | null> {
    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const c = await (prisma as any).case.findUnique({
          where: { id: caseId },
          include: {
            children: true,
            participants: true,
            events: { orderBy: { eventDate: 'asc' } },
            deadlines: { orderBy: { dueDate: 'asc' } },
            tasks: { orderBy: { createdAt: 'desc' } },
            notes: { orderBy: { createdAt: 'desc' } },
            documents: { orderBy: { createdAt: 'desc' } },
            evidence: {
              include: { document: true, event: true },
              orderBy: { createdAt: 'desc' },
            },
            communications: { orderBy: { date: 'desc' } },
            careArrangements: { orderBy: { createdAt: 'desc' } },
          },
        });
        if (c) {
          if (c.ownerId !== requestingUser.id && !this.isAdmin(requestingUser)) {
            throw new Error('Přístup odepřen: Tento spis patří jinému uživateli.');
          }
          return c;
        }
      } catch (e: any) {
        if (e.message?.includes('Přístup odepřen')) throw e;
        console.warn('[ClientCaseService] Prisma getCaseById fallback to dbStore:', e);
      }
    }

    // In-memory lookup
    const found = dbStore.cases.find((c) => c.id === caseId);
    if (!found) return null;
    if (found.ownerId !== requestingUser.id && !this.isAdmin(requestingUser)) {
      throw new Error('Přístup odepřen: Tento spis patří jinému uživateli.');
    }

    return {
      ...found,
      children: dbStore.caseChildren.filter((ch) => ch.caseId === caseId),
      participants: dbStore.caseParticipants.filter((p) => p.caseId === caseId),
      events: dbStore.caseEvents.filter((ev) => ev.caseId === caseId),
      deadlines: dbStore.caseDeadlines.filter((d) => d.caseId === caseId),
      tasks: dbStore.caseTasks.filter((t) => t.caseId === caseId),
      notes: dbStore.caseNotes.filter((n) => n.caseId === caseId),
      documents: dbStore.caseDocuments.filter((doc) => doc.caseId === caseId),
      evidence: dbStore.caseEvidence
        .filter((ev) => ev.caseId === caseId)
        .map((ev) => ({
          ...ev,
          document: dbStore.caseDocuments.find((d) => d.id === ev.documentId),
          event: dbStore.caseEvents.find((e) => e.id === ev.eventId),
        })),
      communications: dbStore.caseCommunications.filter((cm) => cm.caseId === caseId),
      careArrangements: dbStore.careArrangements.filter((ca) => ca.caseId === caseId),
    };
  }

  /**
   * Auto-provisions a clean initial case for a father on first entrance
   */
  public static async createDefaultCaseForUser(userId: string, requestingUser: User): Promise<ClientCase> {
    const user = dbStore.users.find((u) => u.id === userId) || requestingUser;
    const now = new Date().toISOString();
    const caseId = `case-${userId}-${Date.now()}`;

    const newCase: ClientCase = {
      id: caseId,
      ownerId: userId,
      title: `Opatrovnická složka - ${user.name || 'Můj případ'}`,
      caseNumber: '',
      court: 'Obvodní / Okresní soud',
      caseType: 'OPATROVNICKE',
      status: 'ACTIVE',
      description: 'Osobní klientská složka pro evidenci opatrovnického řízení, péče o děti a související agendy.',
      currentCareType: 'STRIDAVA',
      createdAt: now,
      updatedAt: now,
      children: [],
      participants: [
        {
          id: `part-${Date.now()}-1`,
          caseId,
          name: user.name || 'Otec',
          role: 'OTEC',
          email: user.email,
          institution: 'Otec',
          createdAt: now,
          updatedAt: now,
        },
      ],
      careArrangements: [
        {
          id: `care-${Date.now()}`,
          caseId,
          title: 'Střídavá péče 7/7 (Týden / Týden)',
          type: 'STRIDAVA',
          intervalDays: 7,
          handoverDay: 'Pátek 16:00',
          handoverLocation: 'Před školou / bydlištěm',
          childSupportAmount: 0,
          notes: 'Výchozí návrh modelu péče pro nejlepší zájem dítěte.',
          createdAt: now,
          updatedAt: now,
        },
      ],
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).case.create({
          data: {
            id: caseId,
            ownerId: userId,
            title: newCase.title,
            court: newCase.court,
            caseType: newCase.caseType,
            status: newCase.status,
            description: newCase.description,
            currentCareType: newCase.currentCareType,
            participants: {
              create: [
                {
                  name: user.name || 'Otec',
                  role: 'OTEC',
                  email: user.email,
                  institution: 'Otec',
                },
              ],
            },
            careArrangements: {
              create: [
                {
                  title: 'Střídavá péče 7/7 (Týden / Týden)',
                  type: 'STRIDAVA',
                  intervalDays: 7,
                  handoverDay: 'Pátek 16:00',
                  handoverLocation: 'Před školou / bydlištěm',
                  childSupportAmount: 0,
                },
              ],
            },
          },
          include: {
            children: true,
            participants: true,
            careArrangements: true,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createDefaultCase fallback to dbStore:', e);
      }
    }

    dbStore.cases.unshift(newCase);
    if (newCase.participants) dbStore.caseParticipants.push(...newCase.participants);
    if (newCase.careArrangements) dbStore.careArrangements.push(...newCase.careArrangements);
    return newCase;
  }

  /**
   * Update core case attributes
   */
  public static async updateCase(caseId: string, requestingUser: User, data: Partial<ClientCase>): Promise<ClientCase> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const updated = await (prisma as any).case.update({
          where: { id: caseId },
          data: {
            title: data.title,
            caseNumber: data.caseNumber,
            court: data.court,
            caseType: data.caseType,
            status: data.status,
            description: data.description,
            currentCareType: data.currentCareType,
            updatedAt: new Date(),
          },
        });
        await AuditService.recordLog(
          'CASE_UPDATED',
          'ClientCase',
          `Aktualizace spisu ID: ${caseId} (${data.title || ''})`,
          requestingUser
        );
        return updated;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma updateCase fallback to dbStore:', e);
      }
    }

    const idx = dbStore.cases.findIndex((c) => c.id === caseId);
    if (idx === -1) throw new Error('Případ nenalezen');
    const existing = dbStore.cases[idx];
    const updated: ClientCase = {
      ...existing,
      ...data,
      id: caseId,
      ownerId: existing.ownerId,
      updatedAt: now,
    };
    dbStore.cases[idx] = updated;

    await AuditService.recordLog(
      'CASE_UPDATED',
      'ClientCase',
      `Aktualizace spisu ID: ${caseId}`,
      requestingUser
    );

    return updated;
  }

  // ----------------------------------------------------
  // CHILDREN CRUD
  // ----------------------------------------------------
  public static async createChild(caseId: string, requestingUser: User, data: Partial<CaseChild>): Promise<CaseChild> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `child-${Date.now()}`;

    const childObj: CaseChild = {
      id,
      caseId,
      firstName: data.firstName || 'Dítě',
      lastName: data.lastName || '',
      dateOfBirth: data.dateOfBirth || '',
      birthNumber: data.birthNumber || '',
      schoolName: data.schoolName || '',
      pediatrician: data.pediatrician || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).child.create({
          data: {
            id,
            caseId,
            firstName: childObj.firstName,
            lastName: childObj.lastName,
            dateOfBirth: childObj.dateOfBirth,
            birthNumber: childObj.birthNumber,
            schoolName: childObj.schoolName,
            pediatrician: childObj.pediatrician,
            notes: childObj.notes,
          },
        });
        await AuditService.recordLog(
          'CHILD_CREATED',
          'ClientCase',
          `Přidáno dítě ${childObj.firstName} ${childObj.lastName} do spisu ${caseId}`,
          requestingUser
        );
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createChild fallback:', e);
      }
    }

    dbStore.caseChildren.unshift(childObj);
    await AuditService.recordLog(
      'CHILD_CREATED',
      'ClientCase',
      `Přidáno dítě ${childObj.firstName} ${childObj.lastName}`,
      requestingUser
    );
    return childObj;
  }

  public static async updateChild(childId: string, requestingUser: User, data: Partial<CaseChild>): Promise<CaseChild> {
    const child = dbStore.caseChildren.find((ch) => ch.id === childId);
    const caseId = child ? child.caseId : data.caseId;
    if (caseId) await this.authorizeCaseAccess(caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const updated = await (prisma as any).child.update({
          where: { id: childId },
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth,
            birthNumber: data.birthNumber,
            schoolName: data.schoolName,
            pediatrician: data.pediatrician,
            notes: data.notes,
            updatedAt: new Date(),
          },
        });
        return updated;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma updateChild fallback:', e);
      }
    }

    const idx = dbStore.caseChildren.findIndex((ch) => ch.id === childId);
    if (idx === -1) throw new Error('Záznam dítěte nenalezen.');
    const updated = { ...dbStore.caseChildren[idx], ...data, updatedAt: new Date().toISOString() };
    dbStore.caseChildren[idx] = updated;
    return updated;
  }

  public static async deleteChild(childId: string, requestingUser: User): Promise<boolean> {
    const child = dbStore.caseChildren.find((ch) => ch.id === childId);
    if (child) await this.authorizeCaseAccess(child.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).child.delete({ where: { id: childId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteChild fallback:', e);
      }
    }

    dbStore.caseChildren = dbStore.caseChildren.filter((ch) => ch.id !== childId);
    return true;
  }

  // ----------------------------------------------------
  // PARTICIPANTS CRUD
  // ----------------------------------------------------
  public static async createParticipant(caseId: string, requestingUser: User, data: Partial<CaseParticipant>): Promise<CaseParticipant> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `part-${Date.now()}`;

    const partObj: CaseParticipant = {
      id,
      caseId,
      name: data.name || '',
      role: data.role || 'MATKA',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      institution: data.institution || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseParticipant.create({
          data: {
            id,
            caseId,
            name: partObj.name,
            role: partObj.role,
            email: partObj.email,
            phone: partObj.phone,
            address: partObj.address,
            institution: partObj.institution,
            notes: partObj.notes,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createParticipant fallback:', e);
      }
    }

    dbStore.caseParticipants.unshift(partObj);
    return partObj;
  }

  public static async updateParticipant(participantId: string, requestingUser: User, data: Partial<CaseParticipant>): Promise<CaseParticipant> {
    const part = dbStore.caseParticipants.find((p) => p.id === participantId);
    if (part) await this.authorizeCaseAccess(part.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const updated = await (prisma as any).caseParticipant.update({
          where: { id: participantId },
          data: {
            name: data.name,
            role: data.role,
            email: data.email,
            phone: data.phone,
            address: data.address,
            institution: data.institution,
            notes: data.notes,
            updatedAt: new Date(),
          },
        });
        return updated;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma updateParticipant fallback:', e);
      }
    }

    const idx = dbStore.caseParticipants.findIndex((p) => p.id === participantId);
    if (idx === -1) throw new Error('Účastník nenalezen.');
    const updated = { ...dbStore.caseParticipants[idx], ...data, updatedAt: new Date().toISOString() };
    dbStore.caseParticipants[idx] = updated;
    return updated;
  }

  public static async deleteParticipant(participantId: string, requestingUser: User): Promise<boolean> {
    const part = dbStore.caseParticipants.find((p) => p.id === participantId);
    if (part) await this.authorizeCaseAccess(part.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseParticipant.delete({ where: { id: participantId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteParticipant fallback:', e);
      }
    }

    dbStore.caseParticipants = dbStore.caseParticipants.filter((p) => p.id !== participantId);
    return true;
  }

  // ----------------------------------------------------
  // EVENTS CRUD
  // ----------------------------------------------------
  public static async createEvent(caseId: string, requestingUser: User, data: Partial<CaseEvent>): Promise<CaseEvent> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `event-${Date.now()}`;

    const evtObj: CaseEvent = {
      id,
      caseId,
      createdBy: requestingUser.id,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'OTHER',
      eventDate: data.eventDate || now,
      endDate: data.endDate,
      location: data.location || '',
      attachments: data.attachments || null,
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseEvent.create({
          data: {
            id,
            caseId,
            createdBy: requestingUser.id,
            title: evtObj.title,
            description: evtObj.description,
            category: evtObj.category,
            eventDate: new Date(evtObj.eventDate),
            endDate: evtObj.endDate ? new Date(evtObj.endDate) : null,
            location: evtObj.location,
            attachments: evtObj.attachments,
          },
        });
        await AuditService.recordLog(
          'EVENT_CREATED',
          'ClientCase',
          `Vytvořena událost "${evtObj.title}" (${evtObj.category})`,
          requestingUser
        );
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createEvent fallback:', e);
      }
    }

    dbStore.caseEvents.unshift(evtObj);
    return evtObj;
  }

  public static async updateEvent(eventId: string, requestingUser: User, data: Partial<CaseEvent>): Promise<CaseEvent> {
    const evt = dbStore.caseEvents.find((e) => e.id === eventId);
    if (evt) await this.authorizeCaseAccess(evt.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const updated = await (prisma as any).caseEvent.update({
          where: { id: eventId },
          data: {
            title: data.title,
            description: data.description,
            category: data.category,
            eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
            location: data.location,
            attachments: data.attachments,
            updatedAt: new Date(),
          },
        });
        return updated;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma updateEvent fallback:', e);
      }
    }

    const idx = dbStore.caseEvents.findIndex((e) => e.id === eventId);
    if (idx === -1) throw new Error('Událost nenalezena.');
    const updated = { ...dbStore.caseEvents[idx], ...data, updatedAt: new Date().toISOString() };
    dbStore.caseEvents[idx] = updated;
    return updated;
  }

  public static async deleteEvent(eventId: string, requestingUser: User): Promise<boolean> {
    const evt = dbStore.caseEvents.find((e) => e.id === eventId);
    if (evt) await this.authorizeCaseAccess(evt.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseEvent.delete({ where: { id: eventId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteEvent fallback:', e);
      }
    }

    dbStore.caseEvents = dbStore.caseEvents.filter((e) => e.id !== eventId);
    return true;
  }

  // ----------------------------------------------------
  // DEADLINES CRUD
  // ----------------------------------------------------
  public static async createDeadline(caseId: string, requestingUser: User, data: Partial<CaseDeadline>): Promise<CaseDeadline> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `dead-${Date.now()}`;

    const deadObj: CaseDeadline = {
      id,
      caseId,
      createdBy: requestingUser.id,
      title: data.title || '',
      description: data.description || '',
      dueDate: data.dueDate || now,
      type: data.type || 'COURT',
      isCompleted: !!data.isCompleted,
      priority: data.priority || 'HIGH',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseDeadline.create({
          data: {
            id,
            caseId,
            createdBy: requestingUser.id,
            title: deadObj.title,
            description: deadObj.description,
            dueDate: new Date(deadObj.dueDate),
            type: deadObj.type,
            isCompleted: deadObj.isCompleted,
            priority: deadObj.priority,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createDeadline fallback:', e);
      }
    }

    dbStore.caseDeadlines.unshift(deadObj);
    return deadObj;
  }

  public static async toggleDeadline(deadlineId: string, requestingUser: User): Promise<CaseDeadline> {
    const dead = dbStore.caseDeadlines.find((d) => d.id === deadlineId);
    if (dead) await this.authorizeCaseAccess(dead.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const current = await (prisma as any).caseDeadline.findUnique({ where: { id: deadlineId } });
        if (current) {
          const updated = await (prisma as any).caseDeadline.update({
            where: { id: deadlineId },
            data: { isCompleted: !current.isCompleted, updatedAt: new Date() },
          });
          return updated;
        }
      } catch (e) {
        console.warn('[ClientCaseService] Prisma toggleDeadline fallback:', e);
      }
    }

    const idx = dbStore.caseDeadlines.findIndex((d) => d.id === deadlineId);
    if (idx === -1) throw new Error('Termín nenalezen.');
    dbStore.caseDeadlines[idx].isCompleted = !dbStore.caseDeadlines[idx].isCompleted;
    dbStore.caseDeadlines[idx].updatedAt = new Date().toISOString();
    return dbStore.caseDeadlines[idx];
  }

  public static async deleteDeadline(deadlineId: string, requestingUser: User): Promise<boolean> {
    const dead = dbStore.caseDeadlines.find((d) => d.id === deadlineId);
    if (dead) await this.authorizeCaseAccess(dead.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseDeadline.delete({ where: { id: deadlineId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteDeadline fallback:', e);
      }
    }

    dbStore.caseDeadlines = dbStore.caseDeadlines.filter((d) => d.id !== deadlineId);
    return true;
  }

  // ----------------------------------------------------
  // TASKS CRUD
  // ----------------------------------------------------
  public static async createTask(caseId: string, requestingUser: User, data: Partial<CaseTask>): Promise<CaseTask> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `task-${Date.now()}`;

    const taskObj: CaseTask = {
      id,
      caseId,
      createdBy: requestingUser.id,
      title: data.title || '',
      description: data.description || '',
      dueDate: data.dueDate,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'TODO',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseTask.create({
          data: {
            id,
            caseId,
            createdBy: requestingUser.id,
            title: taskObj.title,
            description: taskObj.description,
            dueDate: taskObj.dueDate ? new Date(taskObj.dueDate) : null,
            priority: taskObj.priority,
            status: taskObj.status,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createTask fallback:', e);
      }
    }

    dbStore.caseTasks.unshift(taskObj);
    return taskObj;
  }

  public static async updateTask(taskId: string, requestingUser: User, data: Partial<CaseTask>): Promise<CaseTask> {
    const task = dbStore.caseTasks.find((t) => t.id === taskId);
    if (task) await this.authorizeCaseAccess(task.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const updated = await (prisma as any).caseTask.update({
          where: { id: taskId },
          data: {
            title: data.title,
            description: data.description,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            priority: data.priority,
            status: data.status,
            updatedAt: new Date(),
          },
        });
        return updated;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma updateTask fallback:', e);
      }
    }

    const idx = dbStore.caseTasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error('Úkol nenalezen.');
    const updated = { ...dbStore.caseTasks[idx], ...data, updatedAt: new Date().toISOString() };
    dbStore.caseTasks[idx] = updated;
    return updated;
  }

  public static async deleteTask(taskId: string, requestingUser: User): Promise<boolean> {
    const task = dbStore.caseTasks.find((t) => t.id === taskId);
    if (task) await this.authorizeCaseAccess(task.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseTask.delete({ where: { id: taskId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteTask fallback:', e);
      }
    }

    dbStore.caseTasks = dbStore.caseTasks.filter((t) => t.id !== taskId);
    return true;
  }

  // ----------------------------------------------------
  // NOTES CRUD
  // ----------------------------------------------------
  public static async createNote(caseId: string, requestingUser: User, data: Partial<CaseNote>): Promise<CaseNote> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `note-${Date.now()}`;

    const noteObj: CaseNote = {
      id,
      caseId,
      createdBy: requestingUser.id,
      title: data.title || 'Nová poznámka',
      content: data.content || '',
      category: data.category || 'GENERAL',
      visibility: data.visibility || 'PRIVATE',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseNote.create({
          data: {
            id,
            caseId,
            createdBy: requestingUser.id,
            title: noteObj.title,
            content: noteObj.content,
            category: noteObj.category,
            visibility: noteObj.visibility,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createNote fallback:', e);
      }
    }

    dbStore.caseNotes.unshift(noteObj);
    return noteObj;
  }

  public static async updateNote(noteId: string, requestingUser: User, data: Partial<CaseNote>): Promise<CaseNote> {
    const note = dbStore.caseNotes.find((n) => n.id === noteId);
    if (note) await this.authorizeCaseAccess(note.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const updated = await (prisma as any).caseNote.update({
          where: { id: noteId },
          data: {
            title: data.title,
            content: data.content,
            category: data.category,
            visibility: data.visibility,
            updatedAt: new Date(),
          },
        });
        return updated;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma updateNote fallback:', e);
      }
    }

    const idx = dbStore.caseNotes.findIndex((n) => n.id === noteId);
    if (idx === -1) throw new Error('Poznámka nenalezena.');
    const updated = { ...dbStore.caseNotes[idx], ...data, updatedAt: new Date().toISOString() };
    dbStore.caseNotes[idx] = updated;
    return updated;
  }

  public static async deleteNote(noteId: string, requestingUser: User): Promise<boolean> {
    const note = dbStore.caseNotes.find((n) => n.id === noteId);
    if (note) await this.authorizeCaseAccess(note.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseNote.delete({ where: { id: noteId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteNote fallback:', e);
      }
    }

    dbStore.caseNotes = dbStore.caseNotes.filter((n) => n.id !== noteId);
    return true;
  }

  // ----------------------------------------------------
  // DOCUMENTS CRUD
  // ----------------------------------------------------
  public static async createDocument(caseId: string, requestingUser: User, data: Partial<CaseDocument>): Promise<CaseDocument> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `doc-${Date.now()}`;

    const docObj: CaseDocument = {
      id,
      caseId,
      uploadedBy: requestingUser.id,
      name: data.name || 'Dokument.pdf',
      category: data.category || 'COURT',
      fileUrl: data.fileUrl || `/documents/${data.name || 'dokument.pdf'}`,
      s3Bucket: data.s3Bucket || 'tatovacesta-vault',
      s3ObjectKey: data.s3ObjectKey || `cases/${caseId}/${data.name || 'dokument.pdf'}`,
      fileType: data.fileType || 'pdf',
      mimeType: data.mimeType || 'application/pdf',
      size: data.size || 102400,
      fileHash: data.fileHash || `sha256:${Date.now().toString(16)}`,
      storageProvider: data.storageProvider || 'MinIO',
      scanStatus: data.scanStatus || 'CLEAN',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseDocument.create({
          data: {
            id,
            caseId,
            uploadedBy: requestingUser.id,
            name: docObj.name,
            category: docObj.category,
            fileUrl: docObj.fileUrl,
            s3Bucket: docObj.s3Bucket,
            s3ObjectKey: docObj.s3ObjectKey,
            fileType: docObj.fileType,
            mimeType: docObj.mimeType,
            size: docObj.size,
            fileHash: docObj.fileHash,
            storageProvider: docObj.storageProvider,
            scanStatus: docObj.scanStatus,
            notes: docObj.notes,
          },
        });
        await AuditService.recordLog(
          'DOCUMENT_UPLOADED',
          'ClientCase',
          `Nahrán dokument "${docObj.name}" do spisu ${caseId}`,
          requestingUser
        );
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createDocument fallback:', e);
      }
    }

    dbStore.caseDocuments.unshift(docObj);
    await AuditService.recordLog(
      'DOCUMENT_UPLOADED',
      'ClientCase',
      `Nahrán dokument "${docObj.name}"`,
      requestingUser
    );
    return docObj;
  }

  public static async deleteDocument(docId: string, requestingUser: User): Promise<boolean> {
    const doc = dbStore.caseDocuments.find((d) => d.id === docId);
    if (doc) await this.authorizeCaseAccess(doc.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseDocument.delete({ where: { id: docId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteDocument fallback:', e);
      }
    }

    dbStore.caseDocuments = dbStore.caseDocuments.filter((d) => d.id !== docId);
    return true;
  }

  // ----------------------------------------------------
  // EVIDENCE CRUD
  // ----------------------------------------------------
  public static async createEvidence(caseId: string, requestingUser: User, data: Partial<CaseEvidence>): Promise<CaseEvidence> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `evi-${Date.now()}`;

    const eviObj: CaseEvidence = {
      id,
      caseId,
      createdBy: requestingUser.id,
      title: data.title || '',
      description: data.description || '',
      date: data.date || now,
      type: data.type || 'DOCUMENT',
      documentId: data.documentId,
      eventId: data.eventId,
      relevance: data.relevance || '',
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseEvidence.create({
          data: {
            id,
            caseId,
            createdBy: requestingUser.id,
            title: eviObj.title,
            description: eviObj.description,
            date: eviObj.date ? new Date(eviObj.date) : null,
            type: eviObj.type,
            documentId: eviObj.documentId || null,
            eventId: eviObj.eventId || null,
            relevance: eviObj.relevance,
          },
          include: { document: true, event: true },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createEvidence fallback:', e);
      }
    }

    dbStore.caseEvidence.unshift(eviObj);
    return {
      ...eviObj,
      document: dbStore.caseDocuments.find((d) => d.id === eviObj.documentId),
      event: dbStore.caseEvents.find((e) => e.id === eviObj.eventId),
    };
  }

  public static async deleteEvidence(evidenceId: string, requestingUser: User): Promise<boolean> {
    const evi = dbStore.caseEvidence.find((e) => e.id === evidenceId);
    if (evi) await this.authorizeCaseAccess(evi.caseId, requestingUser);

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        await (prisma as any).caseEvidence.delete({ where: { id: evidenceId } });
        return true;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma deleteEvidence fallback:', e);
      }
    }

    dbStore.caseEvidence = dbStore.caseEvidence.filter((e) => e.id !== evidenceId);
    return true;
  }

  // ----------------------------------------------------
  // CARE ARRANGEMENTS CRUD
  // ----------------------------------------------------
  public static async createCareArrangement(caseId: string, requestingUser: User, data: Partial<CareArrangement>): Promise<CareArrangement> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `care-${Date.now()}`;

    const careObj: CareArrangement = {
      id,
      caseId,
      title: data.title || 'Střídavá péče',
      type: data.type || 'STRIDAVA',
      intervalDays: data.intervalDays || 7,
      handoverDay: data.handoverDay || 'Pátek 16:00',
      handoverLocation: data.handoverLocation || '',
      childSupportAmount: data.childSupportAmount || 0,
      notes: data.notes || '',
      validFrom: data.validFrom,
      validTo: data.validTo,
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).careArrangement.create({
          data: {
            id,
            caseId,
            title: careObj.title,
            type: careObj.type,
            intervalDays: careObj.intervalDays,
            handoverDay: careObj.handoverDay,
            handoverLocation: careObj.handoverLocation,
            childSupportAmount: careObj.childSupportAmount,
            notes: careObj.notes,
            validFrom: careObj.validFrom ? new Date(careObj.validFrom) : null,
            validTo: careObj.validTo ? new Date(careObj.validTo) : null,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createCareArrangement fallback:', e);
      }
    }

    dbStore.careArrangements.unshift(careObj);
    return careObj;
  }

  // ----------------------------------------------------
  // COMMUNICATIONS CRUD
  // ----------------------------------------------------
  public static async createCommunication(caseId: string, requestingUser: User, data: Partial<CaseCommunication>): Promise<CaseCommunication> {
    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();
    const id = `comm-${Date.now()}`;

    const commObj: CaseCommunication = {
      id,
      caseId,
      createdBy: requestingUser.id,
      participantName: data.participantName || 'Účastník',
      channel: data.channel || 'EMAIL',
      date: data.date || now,
      summary: data.summary || '',
      tone: data.tone || 'NEUTRAL',
      attachments: data.attachments || null,
      createdAt: now,
      updatedAt: now,
    };

    const prisma = getPrismaClient();
    if (isPrismaAvailable() && prisma) {
      try {
        const created = await (prisma as any).caseCommunication.create({
          data: {
            id,
            caseId,
            createdBy: requestingUser.id,
            participantName: commObj.participantName,
            channel: commObj.channel,
            date: new Date(commObj.date),
            summary: commObj.summary,
            tone: commObj.tone,
            attachments: commObj.attachments,
          },
        });
        return created;
      } catch (e) {
        console.warn('[ClientCaseService] Prisma createCommunication fallback:', e);
      }
    }

    dbStore.caseCommunications.unshift(commObj);
    return commObj;
  }

  // ----------------------------------------------------
  // TIMELINE & CHRONOLOGY AGGREGATION
  // ----------------------------------------------------
  public static async getTimeline(caseId: string, requestingUser: User): Promise<CaseTimelineItem[]> {
    const activeCase = await this.getCaseById(caseId, requestingUser);
    if (!activeCase) return [];

    const timeline: CaseTimelineItem[] = [];

    // 1. Events
    (activeCase.events || []).forEach((e) => {
      timeline.push({
        id: `timeline-event-${e.id}`,
        type: 'EVENT',
        date: e.eventDate,
        title: e.title,
        description: e.description,
        category: e.category,
        badge: `Událost (${e.category})`,
        meta: { location: e.location },
      });
    });

    // 2. Deadlines
    (activeCase.deadlines || []).forEach((d) => {
      timeline.push({
        id: `timeline-dead-${d.id}`,
        type: 'DEADLINE',
        date: d.dueDate,
        title: d.title,
        description: d.description,
        category: d.type,
        badge: d.isCompleted ? 'Termín splněn' : 'Lhůta / Termín',
        status: d.isCompleted ? 'COMPLETED' : 'PENDING',
        priority: d.priority,
      });
    });

    // 3. Documents
    (activeCase.documents || []).forEach((doc) => {
      timeline.push({
        id: `timeline-doc-${doc.id}`,
        type: 'DOCUMENT',
        date: doc.createdAt,
        title: `Vložení dokumentu: ${doc.name}`,
        description: doc.notes || `Kategorie: ${doc.category}, formát: ${doc.fileType.toUpperCase()}`,
        category: doc.category,
        badge: 'Dokument',
        meta: { fileUrl: doc.fileUrl, size: doc.size },
      });
    });

    // 4. Tasks
    (activeCase.tasks || []).forEach((t) => {
      if (t.dueDate) {
        timeline.push({
          id: `timeline-task-${t.id}`,
          type: 'TASK',
          date: t.dueDate,
          title: `Úkol: ${t.title}`,
          description: t.description,
          status: t.status,
          priority: t.priority,
          badge: 'Úkol',
        });
      }
    });

    // 5. Communications
    (activeCase.communications || []).forEach((c) => {
      timeline.push({
        id: `timeline-comm-${c.id}`,
        type: 'COMMUNICATION',
        date: c.date,
        title: `Komunikace: ${c.participantName} (${c.channel})`,
        description: c.summary,
        badge: 'Komunikace',
        meta: { tone: c.tone },
      });
    });

    // Sort chronologically descending (newest first)
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ----------------------------------------------------
  // EXPORT SUMMARY
  // ----------------------------------------------------
  public static async generateCaseExport(caseId: string, requestingUser: User): Promise<any> {
    const fullCase = await this.getCaseById(caseId, requestingUser);
    if (!fullCase) throw new Error('Případ nenalezen.');

    await AuditService.recordLog(
      'CASE_EXPORTED',
      'ClientCase',
      `Export spisu ID: ${caseId} (${fullCase.title})`,
      requestingUser
    );

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: requestingUser.name,
        system: 'Synthesis OS / Táta má právo (tatovacesta.cz)',
        version: '1.0',
        confidentialityNotice: 'DŮVĚRNÉ - Osobní spis klienta',
      },
      case: fullCase,
    };
  }
}
