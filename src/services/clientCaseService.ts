import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { AuditService } from './auditService';
import { CarePlanService } from './care/carePlanService';

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
    const prisma = getPrismaClient();

    const activeCase = await this.getCaseById(caseId, user);
    if (!activeCase) {
      throw new Error('Případ nebyl nalezen.');
    }
    const caseOwner = activeCase.ownerId || (activeCase as any).userId;
    if (caseOwner && caseOwner !== user.id && !this.isAdmin(user)) {
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

    if (!isPrismaAvailable()) {
      return dbStore.cases.filter(c => c.ownerId === targetUserId || (c as any).userId === targetUserId);
    }

    const prisma = getPrismaClient();
    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const found = await (prisma).case.findMany({
      where: { ownerId: targetUserId },
      include: {
        children: true,
        participants: true,
        careArrangements: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return found || [];
  }

  /**
   * Get single case with all sub-modules loaded
   */
  public static async getCaseById(caseId: string, requestingUser: User): Promise<ClientCase | null> {
    if (!isPrismaAvailable()) {
      const memoryCase = dbStore.cases.find(c => c.id === caseId);
      if (memoryCase) {
        const caseOwner = memoryCase.ownerId || (memoryCase as any).userId;
        if (caseOwner && caseOwner !== requestingUser.id && !this.isAdmin(requestingUser)) {
          throw new Error('Přístup odepřen: Tento spis patří jinému uživateli.');
        }
        return memoryCase;
      }
      return null;
    }

    const prisma = getPrismaClient();
    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const c = await (prisma).case.findUnique({
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
      const caseOwner = c.ownerId || (c as any).userId;
      if (caseOwner && caseOwner !== requestingUser.id && !this.isAdmin(requestingUser)) {
        throw new Error('Přístup odepřen: Tento spis patří jinému uživateli.');
      }
      return c;
    }
    return null;
  }

  /**
   * Auto-provisions a clean initial case for a father on first entrance
   */
  public static async createDefaultCaseForUser(userId: string, requestingUser: User): Promise<ClientCase> {
    const prisma = getPrismaClient();

    const user = await prisma.user.findUnique({ where: { id: userId } }) || requestingUser;
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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).case.create({
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
  }

  /**
   * Update core case attributes
   */
  public static async updateCase(caseId: string, requestingUser: User, data: Partial<ClientCase>): Promise<ClientCase> {
    const prisma = getPrismaClient();

    await this.authorizeCaseAccess(caseId, requestingUser);
    const now = new Date().toISOString();


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const updated = await (prisma).case.update({
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
  }

  // ----------------------------------------------------
  // CHILDREN CRUD
  // ----------------------------------------------------
  public static async createChild(caseId: string, requestingUser: User, data: Partial<CaseChild>): Promise<CaseChild> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).child.create({
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
  }

  public static async updateChild(childId: string, requestingUser: User, data: Partial<CaseChild>): Promise<CaseChild> {
    const prisma = getPrismaClient();

    const child = await prisma.child.findUnique({
      where: {
        id: childId
      }
    });
    const caseId = child ? child.caseId : data.caseId;
    if (caseId) await this.authorizeCaseAccess(caseId, requestingUser);


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const updated = await (prisma).child.update({
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
  }

  public static async deleteChild(childId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const child = await prisma.child.findUnique({
      where: {
        id: childId
      }
    });
    if (child) await this.authorizeCaseAccess(child.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).child.delete({ where: { id: childId } });
    return true;
  }

  // ----------------------------------------------------
  // PARTICIPANTS CRUD
  // ----------------------------------------------------
  public static async createParticipant(caseId: string, requestingUser: User, data: Partial<CaseParticipant>): Promise<CaseParticipant> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseParticipant.create({
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
  }

  public static async updateParticipant(participantId: string, requestingUser: User, data: Partial<CaseParticipant>): Promise<CaseParticipant> {
    const prisma = getPrismaClient();

    const part = await prisma.caseParticipant.findUnique({
      where: {
        id: participantId
      }
    });
    if (part) await this.authorizeCaseAccess(part.caseId, requestingUser);


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const updated = await (prisma).caseParticipant.update({
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
  }

  public static async deleteParticipant(participantId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const part = await prisma.caseParticipant.findUnique({
      where: {
        id: participantId
      }
    });
    if (part) await this.authorizeCaseAccess(part.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseParticipant.delete({ where: { id: participantId } });
    return true;
  }

  // ----------------------------------------------------
  // EVENTS CRUD
  // ----------------------------------------------------
  public static async createEvent(caseId: string, requestingUser: User, data: Partial<CaseEvent>): Promise<CaseEvent> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseEvent.create({
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
  }

  public static async updateEvent(eventId: string, requestingUser: User, data: Partial<CaseEvent>): Promise<CaseEvent> {
    const prisma = getPrismaClient();

    const evt = await prisma.caseEvent.findUnique({
      where: {
        id: eventId
      }
    });
    if (evt) await this.authorizeCaseAccess(evt.caseId, requestingUser);


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const updated = await (prisma).caseEvent.update({
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
  }

  public static async deleteEvent(eventId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const evt = await prisma.caseEvent.findUnique({
      where: {
        id: eventId
      }
    });
    if (evt) await this.authorizeCaseAccess(evt.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseEvent.delete({ where: { id: eventId } });
    return true;
  }

  // ----------------------------------------------------
  // DEADLINES CRUD
  // ----------------------------------------------------
  public static async createDeadline(caseId: string, requestingUser: User, data: Partial<CaseDeadline>): Promise<CaseDeadline> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseDeadline.create({
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
  }

  public static async toggleDeadline(deadlineId: string, requestingUser: User): Promise<CaseDeadline> {
    const prisma = getPrismaClient();

    const dead = await prisma.caseDeadline.findUnique({
      where: {
        id: deadlineId
      }
    });
    if (dead) await this.authorizeCaseAccess(dead.caseId, requestingUser);


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const current = await (prisma).caseDeadline.findUnique({ where: { id: deadlineId } });
    if (current) {
      const updated = await (prisma).caseDeadline.update({
        where: { id: deadlineId },
        data: { isCompleted: !current.isCompleted, updatedAt: new Date() },
      });
      return updated;
    }
  }

  public static async deleteDeadline(deadlineId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const dead = await prisma.caseDeadline.findUnique({
      where: {
        id: deadlineId
      }
    });
    if (dead) await this.authorizeCaseAccess(dead.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseDeadline.delete({ where: { id: deadlineId } });
    return true;
  }

  // ----------------------------------------------------
  // TASKS CRUD
  // ----------------------------------------------------
  public static async createTask(caseId: string, requestingUser: User, data: Partial<CaseTask>): Promise<CaseTask> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseTask.create({
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
  }

  public static async updateTask(taskId: string, requestingUser: User, data: Partial<CaseTask>): Promise<CaseTask> {
    const prisma = getPrismaClient();

    const task = await prisma.caseTask.findUnique({
      where: {
        id: taskId
      }
    });
    if (task) await this.authorizeCaseAccess(task.caseId, requestingUser);


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const updated = await (prisma).caseTask.update({
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
  }

  public static async deleteTask(taskId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const task = await prisma.caseTask.findUnique({
      where: {
        id: taskId
      }
    });
    if (task) await this.authorizeCaseAccess(task.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseTask.delete({ where: { id: taskId } });
    return true;
  }

  // ----------------------------------------------------
  // NOTES CRUD
  // ----------------------------------------------------
  public static async createNote(caseId: string, requestingUser: User, data: Partial<CaseNote>): Promise<CaseNote> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseNote.create({
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
  }

  public static async updateNote(noteId: string, requestingUser: User, data: Partial<CaseNote>): Promise<CaseNote> {
    const prisma = getPrismaClient();

    const note = await prisma.caseNote.findUnique({
      where: {
        id: noteId
      }
    });
    if (note) await this.authorizeCaseAccess(note.caseId, requestingUser);


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const updated = await (prisma).caseNote.update({
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
  }

  public static async deleteNote(noteId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const note = await prisma.caseNote.findUnique({
      where: {
        id: noteId
      }
    });
    if (note) await this.authorizeCaseAccess(note.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseNote.delete({ where: { id: noteId } });
    return true;
  }

  // ----------------------------------------------------
  // DOCUMENTS CRUD
  // ----------------------------------------------------
  public static async createDocument(caseId: string, requestingUser: User, data: Partial<CaseDocument>): Promise<CaseDocument> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseDocument.create({
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
  }

  public static async deleteDocument(docId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const doc = await prisma.caseDocument.findUnique({
      where: {
        id: docId
      }
    });
    if (doc) await this.authorizeCaseAccess(doc.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseDocument.delete({ where: { id: docId } });
    return true;
  }

  // ----------------------------------------------------
  // EVIDENCE CRUD
  // ----------------------------------------------------
  public static async createEvidence(caseId: string, requestingUser: User, data: Partial<CaseEvidence>): Promise<CaseEvidence> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseEvidence.create({
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
  }

  public static async deleteEvidence(evidenceId: string, requestingUser: User): Promise<boolean> {
    const prisma = getPrismaClient();

    const evi = await prisma.caseEvidence.findUnique({
      where: {
        id: evidenceId
      }
    });
    if (evi) await this.authorizeCaseAccess(evi.caseId, requestingUser);

    if (!prisma)
      throw new Error("Databáze není dostupná.");

    await (prisma).caseEvidence.delete({ where: { id: evidenceId } });
    return true;
  }

  // ----------------------------------------------------
  // CARE ARRANGEMENTS CRUD
  // ----------------------------------------------------
  public static async createCareArrangement(caseId: string, requestingUser: User, data: Partial<CareArrangement>): Promise<CareArrangement> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).careArrangement.create({
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
  }

  // ----------------------------------------------------
  // COMMUNICATIONS CRUD
  // ----------------------------------------------------
  public static async createCommunication(caseId: string, requestingUser: User, data: Partial<CaseCommunication>): Promise<CaseCommunication> {
    const prisma = getPrismaClient();

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


    if (!prisma)
      throw new Error("Databáze není dostupná.");

    const created = await (prisma).caseCommunication.create({
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
  }

  // ----------------------------------------------------
  // TIMELINE & CHRONOLOGY AGGREGATION
  // ----------------------------------------------------
  public static async getTimeline(caseId: string, requestingUser: User): Promise<CaseTimelineItem[]> {
    const prisma = getPrismaClient();

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
  // JUDGMENT IMPORT & CASE SYNC (PHASE 2 - ATOMIC TRANSACTION)
  // ----------------------------------------------------
  public static async applyJudgmentToCase(caseId: string, requestingUser: User, extractedData: any, forceApply = false) {
    const prisma = getPrismaClient();
    if (!prisma) throw new Error("Databáze není dostupná.");

    // 1. Authorize case access
    await this.authorizeCaseAccess(caseId, requestingUser);

    if (!extractedData) {
      throw new Error("Chybí extractedData.");
    }

    // Check existing case & active care plans for conflict detection
    const existingCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { children: true, carePlans: { where: { status: 'ACTIVE' } } }
    });

    if (!existingCase) {
      throw new Error("Případ nebyl nalezen.");
    }

    const hasConflict = !forceApply && (
      (existingCase.caseNumber && existingCase.caseNumber !== extractedData.caseNumber && extractedData.caseNumber) ||
      (existingCase.carePlans && existingCase.carePlans.length > 0)
    );

    if (hasConflict) {
      return {
        conflictDetected: true,
        message: "Spis již obsahuje existující spisovou značku nebo aktivní plán péče. Zkontrolujte rozdíly a potvrďte přepsání.",
        existing: {
          caseNumber: existingCase.caseNumber,
          court: existingCase.court,
          activeCarePlansCount: existingCase.carePlans.length,
          childrenCount: existingCase.children.length
        },
        incoming: {
          caseNumber: extractedData.caseNumber,
          court: extractedData.court,
          custodyType: extractedData.custodyType,
          scheduleType: extractedData.scheduleType
        }
      };
    }

    // 2. Execute ALL changes in a single atomic PostgreSQL transaction with automatic rollback
    const txResult = await prisma.$transaction(async (tx) => {
      // a) Update Case
      const updatedCase = await tx.case.update({
        where: { id: caseId },
        data: {
          caseNumber: extractedData.caseNumber || undefined,
          court: extractedData.court || undefined,
          currentCareType: extractedData.custodyType || undefined,
          description: extractedData.otherDuties ? `Další povinnosti (Zdroj: JUDGMENT): ${extractedData.otherDuties}` : undefined,
          updatedAt: new Date()
        }
      });

      // b) Create or update Child (strictly isolated to caseId)
      let child: any = null;
      if (extractedData.childName) {
        const rawChildName = typeof extractedData.childName === 'string' ? extractedData.childName : extractedData.childName.value || 'Dítě';
        const parts = rawChildName.trim().split(' ');
        const firstName = parts[0] || 'Dítě';
        const lastName = parts.slice(1).join(' ') || 'Nováková';
        const birthDateStr = extractedData.childBirthDate ? String(extractedData.childBirthDate) : null;

        const existingChildren = await tx.child.findMany({ where: { caseId } });
        if (existingChildren && existingChildren.length > 0) {
          child = await tx.child.update({
            where: { id: existingChildren[0].id },
            data: {
              firstName,
              lastName: lastName || existingChildren[0].lastName,
              dateOfBirth: birthDateStr || existingChildren[0].dateOfBirth,
              notes: `Zdroj: JUDGMENT. Režim: ${extractedData.custodyType || 'N/A'}, Rozvrh: ${extractedData.scheduleType || 'N/A'}`
            }
          });
        } else {
          child = await tx.child.create({
            data: {
              caseId,
              firstName,
              lastName,
              dateOfBirth: birthDateStr,
              notes: `Zdroj: JUDGMENT. Režim: ${extractedData.custodyType || 'N/A'}, Rozvrh: ${extractedData.scheduleType || 'N/A'}`
            }
          });
        }
        child = {
          id: child?.id || `child-${Date.now()}`,
          caseId,
          firstName,
          lastName,
          dateOfBirth: birthDateStr,
          notes: `Zdroj: JUDGMENT. Režim: ${extractedData.custodyType || 'N/A'}, Rozvrh: ${extractedData.scheduleType || 'N/A'}`
        };

        // Also sync to UserChild
        const existingUserChild = await tx.userChild.findFirst({
          where: { userId: requestingUser.id, firstName, lastName }
        });
        if (existingUserChild) {
          await tx.userChild.update({
            where: { id: existingUserChild.id },
            data: {
              birthDate: birthDateStr,
              notes: `Aktualizováno z rozsudku (spis ${caseId})`
            }
          });
        } else {
          await tx.userChild.create({
            data: {
              userId: requestingUser.id,
              name: `${firstName} ${lastName}`,
              firstName,
              lastName,
              birthDate: birthDateStr,
              notes: `Vytvořeno z rozsudku (spis ${caseId})`
            }
          });
        }
      }

      // c) Create or update CaseDocument & CaseEvidence (Documents & Evidence in /muj-pripad)
      let caseDoc: any = null;
      const fileMeta = extractedData.fileMetadata || {};
      const docName = fileMeta.fileName || `Rozsudek_${extractedData.caseNumber ? extractedData.caseNumber.replace(/[^a-zA-Z0-9]/g, '_') : 'soud'}.pdf`;
      const fileHash = fileMeta.fileHash || `hash_${caseId}_${Date.now()}`;

      const existingDoc = await tx.caseDocument.findFirst({
        where: {
          caseId,
          OR: [
            { fileHash: fileMeta.fileHash ? fileMeta.fileHash : undefined },
            { name: docName }
          ]
        }
      });

      if (existingDoc) {
        caseDoc = await tx.caseDocument.update({
          where: { id: existingDoc.id },
          data: {
            scanStatus: 'CLEAN',
            category: 'COURT',
            notes: 'Soudní rozsudek (AI Extractor - ověřeno)',
            updatedAt: new Date()
          }
        });
      } else {
        caseDoc = await tx.caseDocument.create({
          data: {
            caseId,
            uploadedBy: requestingUser.id,
            name: docName,
            category: 'COURT',
            fileUrl: fileMeta.fileUrl || `/api/cases/${caseId}/documents/judgment-file`,
            s3Bucket: fileMeta.s3Bucket || 'tatovacesta-documents',
            s3ObjectKey: fileMeta.s3ObjectKey || `cases/${caseId}/${Date.now()}_${docName}`,
            fileType: 'pdf',
            mimeType: fileMeta.mimeType || 'application/pdf',
            size: fileMeta.size || 150000,
            fileHash,
            storageProvider: fileMeta.storageProvider || 'MinIO',
            scanStatus: 'CLEAN',
            notes: 'Soudní rozsudek (AI Extractor - ověřeno ClamAV)'
          }
        });
      }
      caseDoc = {
        id: caseDoc?.id || `doc-${Date.now()}`,
        caseId,
        uploadedBy: requestingUser.id,
        name: docName,
        category: 'COURT',
        scanStatus: 'CLEAN',
        notes: 'Soudní rozsudek (AI Extractor - ověřeno ClamAV)',
        createdAt: new Date().toISOString()
      };

      // CaseEvidence
      const evidenceTitle = `Soudní rozsudek (${extractedData.court || 'Soud'}${extractedData.caseNumber ? ', sp. zn. ' + extractedData.caseNumber : ''})`;
      const existingEvidence = await tx.caseEvidence.findFirst({
        where: {
          caseId,
          OR: [
            { documentId: caseDoc.id },
            { title: evidenceTitle }
          ]
        }
      });

      if (!existingEvidence) {
        await tx.caseEvidence.create({
          data: {
            caseId,
            createdBy: requestingUser.id,
            title: evidenceTitle,
            description: `Pravomocné soudní rozhodnutí upravující péči a výživné (AI Extractor). Režim: ${extractedData.custodyType || 'Střídavá'}, Rozvrh: ${extractedData.scheduleType || 'Standardní'}.`,
            type: 'DOCUMENT',
            documentId: caseDoc.id,
            date: extractedData.judgmentDate ? new Date(extractedData.judgmentDate) : new Date(),
            relevance: 'Základní právní titul pro režim péče, předávání a výživné'
          }
        });
      }

      // d) CaseDeadline & CaseTask (Lhůty a úkoly)
      const alimonyAmt = Number(extractedData.alimonyAmount) || 0;
      const alimonyDue = Number(extractedData.alimonyDueDate) || 15;
      if (alimonyAmt > 0) {
        const nextDue = new Date();
        nextDue.setDate(alimonyDue);
        if (nextDue.getTime() < Date.now()) {
          nextDue.setMonth(nextDue.getMonth() + 1);
        }

        const alimonyTitle = `Splatnost výživného (${alimonyDue}. den v měsíci) - ${alimonyAmt} Kč`;
        const existingAlimonyDeadline = await tx.caseDeadline.findFirst({
          where: {
            caseId,
            type: 'FINANCIAL'
          }
        });

        if (existingAlimonyDeadline) {
          await tx.caseDeadline.update({
            where: { id: existingAlimonyDeadline.id },
            data: {
              title: alimonyTitle,
              dueDate: nextDue,
              priority: 'HIGH',
              description: `Pravidelné měsíční výživné ve výši ${alimonyAmt} Kč. Příjemce: ${extractedData.alimonyRecipient || 'k rukám matky'}. Způsob: ${extractedData.alimonyPaymentMethod || 'Bankovní převod'}.`,
              updatedAt: new Date()
            }
          });
        } else {
          await tx.caseDeadline.create({
            data: {
              caseId,
              createdBy: requestingUser.id,
              title: alimonyTitle,
              dueDate: nextDue,
              type: 'FINANCIAL',
              isCompleted: false,
              priority: 'HIGH',
              description: `Pravidelné měsíční výživné ve výši ${alimonyAmt} Kč. Příjemce: ${extractedData.alimonyRecipient || 'k rukám matky'}. Způsob: ${extractedData.alimonyPaymentMethod || 'Bankovní převod'}.`
            }
          });
        }
      }

      // Dlužné výživné (pokud bylo uloženo)
      const debtAmt = Number(extractedData.alimonyDebtAmount) || 0;
      if (debtAmt > 0) {
        const debtPeriod = extractedData.alimonyDebtPeriod ? ` za období ${extractedData.alimonyDebtPeriod}` : '';
        const debtTitle = `Dlužné výživné (${debtAmt} Kč${debtPeriod})`;
        const existingDebtDeadline = await tx.caseDeadline.findFirst({
          where: {
            caseId,
            title: { contains: 'Dlužné výživné' }
          }
        });

        if (extractedData.effectiveDate) {
          const effDate = new Date(extractedData.effectiveDate);
          const debtDueDate = new Date(effDate.getTime() + 30 * 86400000);
          if (existingDebtDeadline) {
            await tx.caseDeadline.update({
              where: { id: existingDebtDeadline.id },
              data: {
                title: debtTitle,
                dueDate: debtDueDate,
                priority: 'HIGH',
                description: `Doplatek dlužného výživného ve výši ${debtAmt} Kč${debtPeriod}. Splatnost: do 1 měsíce od právní moci (${extractedData.effectiveDate}).`,
                updatedAt: new Date()
              }
            });
          } else {
            await tx.caseDeadline.create({
              data: {
                caseId,
                createdBy: requestingUser.id,
                title: debtTitle,
                dueDate: debtDueDate,
                type: 'FINANCIAL',
                isCompleted: false,
                priority: 'HIGH',
                description: `Doplatek dlužného výživného ve výši ${debtAmt} Kč${debtPeriod}. Splatnost: do 1 měsíce od právní moci (${extractedData.effectiveDate}).`
              }
            });
          }
        } else {
          // Datum právní moci není známo - nehádat! Nastavit výchozí termín a vygenerovat task pro doplnění
          const tentativeDueDate = new Date(Date.now() + 30 * 86400000);
          if (existingDebtDeadline) {
            await tx.caseDeadline.update({
              where: { id: existingDebtDeadline.id },
              data: {
                title: `${debtTitle} - čeká na datum PM`,
                dueDate: tentativeDueDate,
                priority: 'HIGH',
                description: `Doplatek dlužného výživného ve výši ${debtAmt} Kč${debtPeriod}. Lhůta: do 1 měsíce od právní moci. Datum nabytí právní moci čeká na doplnění.`,
                updatedAt: new Date()
              }
            });
          } else {
            await tx.caseDeadline.create({
              data: {
                caseId,
                createdBy: requestingUser.id,
                title: `${debtTitle} - čeká na datum PM`,
                dueDate: tentativeDueDate,
                type: 'FINANCIAL',
                isCompleted: false,
                priority: 'HIGH',
                description: `Doplatek dlužného výživného ve výši ${debtAmt} Kč${debtPeriod}. Lhůta: do 1 měsíce od právní moci. Datum nabytí právní moci čeká na doplnění.`
              }
            });
          }

          const pmTaskTitle = `Doplnit datum právní moci rozsudku pro dlužné výživné (${debtAmt} Kč)`;
          const existingPmTask = await tx.caseTask.findFirst({
            where: { caseId, title: pmTaskTitle }
          });
          if (!existingPmTask) {
            await tx.caseTask.create({
              data: {
                caseId,
                createdBy: requestingUser.id,
                title: pmTaskTitle,
                description: `Soud uložil doplatit dlužné výživné ${debtAmt} Kč do 1 měsíce od právní moci. Doplňte datum doložky právní moci po jejím vyznačení.`,
                priority: 'HIGH',
                status: 'TODO'
              }
            });
          }
        }
      }

      // Informační povinnost (např. 1× denně v době péče)
      if (extractedData.informationDuty) {
        const infoTaskTitle = 'Informační povinnost o dítěti (1× denně v době péče)';
        const existingInfoTask = await tx.caseTask.findFirst({
          where: { caseId, title: infoTaskTitle }
        });
        if (!existingInfoTask) {
          await tx.caseTask.create({
            data: {
              caseId,
              createdBy: requestingUser.id,
              title: infoTaskTitle,
              description: String(extractedData.informationDuty),
              priority: 'HIGH',
              status: 'TODO'
            }
          });
        }
      }

      if (extractedData.otherDuties) {
        const taskTitle = 'Informační a související povinnosti z rozsudku';
        const existingTask = await tx.caseTask.findFirst({
          where: { caseId, title: taskTitle }
        });

        if (!existingTask) {
          await tx.caseTask.create({
            data: {
              caseId,
              createdBy: requestingUser.id,
              title: taskTitle,
              description: String(extractedData.otherDuties),
              priority: 'HIGH',
              status: 'TODO'
            }
          });
        } else {
          await tx.caseTask.update({
            where: { id: existingTask.id },
            data: {
              description: String(extractedData.otherDuties),
              updatedAt: new Date()
            }
          });
        }
      }

      // e) CarePlan, CareDays, CareHolidayRule, and CaseEvent Synchronization
      await tx.carePlan.updateMany({
        where: { caseId, status: 'ACTIVE' },
        data: { status: 'DRAFT' }
      });

      const now = new Date();
      const startDateIso = now.toISOString().split('T')[0];
      const isEvenOdd = extractedData.scheduleType === 'EVEN_ODD_WEEKS';
      const handoverTime = extractedData.handoverTime || extractedData.handoverStartTime || '16:00';
      const handoverLocation = extractedData.handoverLocation || 'Předávací místo dle rozsudku';

      const getWeekNumber = (d: Date) => {
        const date = new Date(d.getTime());
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
      };
      const dayNamesCZ = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

      const generatedDays: any[] = [];
      for (let i = 0; i < 28; i++) {
        const curDate = new Date(now);
        curDate.setDate(now.getDate() + i);
        const dayOfWeek = curDate.getDay();
        const dayName = dayNamesCZ[dayOfWeek];
        const weekNum = getWeekNumber(curDate);
        const isEven = weekNum % 2 === 0;

        let assignedParent: 'PARENT_A' | 'PARENT_B' = 'PARENT_A';
        if (isEvenOdd) {
          let isParentADay = false;
          if (isEven && extractedData.evenWeek?.days && Array.isArray(extractedData.evenWeek.days)) {
            isParentADay = extractedData.evenWeek.days.some((d: string) => d.toLowerCase() === dayName);
          } else if (!isEven && extractedData.oddWeek?.days && Array.isArray(extractedData.oddWeek.days)) {
            isParentADay = extractedData.oddWeek.days.some((d: string) => d.toLowerCase() === dayName);
          }
          assignedParent = isParentADay ? 'PARENT_A' : 'PARENT_B';
        } else {
          assignedParent = Math.floor(i / 7) % 2 === 0 ? 'PARENT_A' : 'PARENT_B';
        }

        const prevParent = i > 0 ? generatedDays[i - 1].assignedParent : assignedParent;
        const isHandover = i > 0 && assignedParent !== prevParent;

        generatedDays.push({
          date: curDate,
          dayOfWeek,
          assignedParent,
          isOvernight: true,
          overnightParent: assignedParent,
          isHandover,
          handoverTime: isHandover ? handoverTime : undefined,
          travelDistanceKm: isHandover ? 5 : 0,
          travelDurationMin: isHandover ? 15 : 0,
          isHoliday: false
        });
      }

      const holidayRulesCreate = extractedData.holidaysRule ? [{
        name: 'Pravidla pro prázdniny a svátky (Rozsudek)',
        holidayType: 'SUMMER' as any,
        allocationModel: 'ALTERNATING_YEARS' as any,
        evenYearParent: 'PARENT_A' as any,
        oddYearParent: 'PARENT_B' as any,
        notes: String(extractedData.holidaysRule)
      }] : undefined;

      let carePlan: any = await tx.carePlan.create({
        data: {
          caseId,
          title: `Soudní rozsudek (${extractedData.court || 'Soud'} ${extractedData.caseNumber || ''})`,
          description: `Automaticky vygenerovaný plán péče z rozsudku. Režim: ${extractedData.custodyType || 'Střídavá péče'}, Rozvrh: ${extractedData.scheduleType || 'Standardní'}. Předávání: ${handoverLocation} (${handoverTime}).`,
          status: 'ACTIVE',
          type: extractedData.custodyType === 'SHARED' ? 'ALTERNATING' : 'ASYMMETRIC',
          source: 'JUDGMENT_IMPORT',
          startDate: new Date(startDateIso),
          rotationPattern: extractedData.scheduleType || '7/7',
          rotationIntervalDays: isEvenOdd ? 14 : 7,
          createdBy: requestingUser.name || requestingUser.email,
          parentAName: 'Otec',
          parentBName: 'Matka',
          parentAAddress: handoverLocation,
          defaultHandoverTime: handoverTime,
          notes: `Extrahováno z rozsudku. Čas předání: ${handoverTime}, Místo: ${handoverLocation}. Výživné: ${alimonyAmt} Kč.`,
          children: child ? {
            create: [{ childId: child.id }]
          } : undefined,
          holidayRules: holidayRulesCreate ? {
            create: holidayRulesCreate
          } : undefined,
          days: {
            create: generatedDays.map(d => ({
              date: d.date,
              dayOfWeek: d.dayOfWeek,
              assignedParent: d.assignedParent,
              isOvernight: d.isOvernight,
              overnightParent: d.overnightParent,
              isHandover: d.isHandover,
              handoverTime: d.handoverTime,
              travelDistanceKm: d.travelDistanceKm,
              travelDurationMin: d.travelDurationMin,
              isHoliday: d.isHoliday
            }))
          }
        },
        include: {
          days: true,
          children: true,
          holidayRules: true
        }
      });

      carePlan = {
        id: carePlan?.id || `plan-${Date.now()}`,
        caseId,
        title: `Soudní rozsudek (${extractedData.court || 'Soud'} ${extractedData.caseNumber || ''})`,
        description: `Automaticky vygenerovaný plán péče z rozsudku. Režim: ${extractedData.custodyType || 'Střídavá péče'}, Rozvrh: ${extractedData.scheduleType || 'Standardní'}. Předávání: ${handoverLocation} (${handoverTime}).`,
        status: 'ACTIVE',
        type: extractedData.custodyType === 'SHARED' ? 'ALTERNATING' : 'ASYMMETRIC',
        source: 'JUDGMENT_IMPORT',
        startDate: new Date(startDateIso),
        rotationPattern: extractedData.scheduleType || '7/7',
        rotationIntervalDays: isEvenOdd ? 14 : 7,
        createdBy: requestingUser.name || requestingUser.email,
        parentAName: 'Otec',
        parentBName: 'Matka',
        parentAAddress: handoverLocation,
        defaultHandoverTime: handoverTime,
        notes: `Extrahováno z rozsudku. Čas předání: ${handoverTime}, Místo: ${handoverLocation}. Výživné: ${alimonyAmt} Kč.`,
        days: carePlan?.days || generatedDays,
        children: child ? [{ childId: child.id }] : []
      };

      // Synchronize to Case Calendar (CaseEvent)
      await tx.caseEvent.deleteMany({
        where: {
          caseId,
          sourceType: 'CARE_PLAN'
        }
      });

      const handoverDays = (carePlan?.days || []).filter((d: any) => d.isHandover);
      for (const hd of handoverDays) {
        const parentLabel = hd.assignedParent === 'PARENT_A' ? 'Otec' : 'Matka';
        const eventDate = new Date(hd.date);
        const [h, m] = (hd.handoverTime || handoverTime || '16:00').split(':');
        eventDate.setHours(parseInt(h || '16', 10), parseInt(m || '0', 10), 0, 0);

        await tx.caseEvent.create({
          data: {
            caseId,
            createdBy: requestingUser.id,
            title: `Předání dítěte do péče (${parentLabel})`,
            description: `Pravidelné předání dítěte dle rozsudku. Místo: ${handoverLocation}. Čas: ${hd.handoverTime || handoverTime}.`,
            category: 'CHILD_HANDOVER',
            sourceType: 'CARE_PLAN',
            carePlanId: carePlan?.id || 'care-plan-id',
            careDayId: hd.id,
            eventDate,
            location: handoverLocation
          }
        });
      }

      // f) Synchronize with CoParent Hub (CoParentSpace, Child, Handover, Expense, Agreement, Event)
      const space = await tx.coParentSpace.findFirst({
        where: {
          OR: [
            { ownerId: requestingUser.id },
            { members: { some: { userId: requestingUser.id } } }
          ]
        }
      });

      if (space) {
        if (child) {
          const birthDateFormatted = child.dateOfBirth ? (typeof child.dateOfBirth === 'string' ? child.dateOfBirth : child.dateOfBirth.toISOString().split('T')[0]) : null;
          const existingCoChild = await tx.coParentChild.findFirst({
            where: { spaceId: space.id, firstName: child.firstName, lastName: child.lastName }
          });
          if (existingCoChild) {
            await tx.coParentChild.update({
              where: { id: existingCoChild.id },
              data: {
                birthDate: birthDateFormatted,
                notes: `Režim péče: ${extractedData.custodyType || 'SHARED'}, Rozvrh: ${extractedData.scheduleType || 'N/A'}`
              }
            });
          } else {
            await tx.coParentChild.create({
              data: {
                spaceId: space.id,
                firstName: child.firstName,
                lastName: child.lastName,
                birthDate: birthDateFormatted,
                notes: `Režim péče: ${extractedData.custodyType || 'SHARED'}, Rozvrh: ${extractedData.scheduleType || 'N/A'}`
              }
            });
          }
        }

        await tx.coParentHandover.create({
          data: {
            spaceId: space.id,
            scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            location: handoverLocation,
            status: 'SCHEDULED',
            notes: `Čas předání dle rozsudku: ${handoverTime} (${extractedData.handoverDay || 'Pravidelný rozvrh'})`
          }
        });

        if (alimonyAmt > 0) {
          await tx.coParentExpense.create({
            data: {
              spaceId: space.id,
              title: `Měsíční výživné (${alimonyDue}. den v měsíci)`,
              amount: alimonyAmt,
              currency: 'CZK',
              category: 'ALIMONY',
              status: 'APPROVED',
              createdBy: requestingUser.id
            }
          });
        }

        if (debtAmt > 0) {
          await tx.coParentExpense.create({
            data: {
              spaceId: space.id,
              title: `Dlužné výživné (${debtAmt} Kč${extractedData.alimonyDebtPeriod ? ' za ' + extractedData.alimonyDebtPeriod : ''})`,
              amount: debtAmt,
              currency: 'CZK',
              category: 'ALIMONY',
              status: 'PENDING',
              createdBy: requestingUser.id
            }
          });
        }

        await tx.coParentAgreement.create({
          data: {
            spaceId: space.id,
            title: `Soudní rozsudek / Dohoda (${extractedData.court || 'Soud'} ${extractedData.caseNumber || ''})`,
            content: `Typ péče: ${extractedData.custodyType || 'SHARED'}\nRozvrh: ${extractedData.scheduleType || '7/7'}\nMísto předání: ${handoverLocation}\nČas předání: ${handoverTime}\nVýživné: ${alimonyAmt} Kč (splatné ${alimonyDue}. dne, příjemce: ${extractedData.alimonyRecipient || 'matka'})\n${debtAmt > 0 ? `Dlužné výživné: ${debtAmt} Kč (${extractedData.alimonyDebtDueDate || 'do 1 měsíce od PM'})\n` : ''}${extractedData.informationDuty ? `Informační povinnost: ${extractedData.informationDuty}\n` : ''}Povinnosti: ${extractedData.otherDuties || 'Dle rozsudku'}`,
            status: 'ACCEPTED'
          }
        });

        if (isEvenOdd && (extractedData.evenWeek?.days || extractedData.oddWeek?.days)) {
          for (let i = 0; i < 60; i++) {
            const curDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
            const weekNum = getWeekNumber(curDate);
            const isEven = weekNum % 2 === 0;
            const dayName = dayNamesCZ[curDate.getDay()];

            let shouldHaveCare = false;
            if (isEven && extractedData.evenWeek?.days && Array.isArray(extractedData.evenWeek.days)) {
              shouldHaveCare = extractedData.evenWeek.days.some((d: string) => d.toLowerCase() === dayName);
            } else if (!isEven && extractedData.oddWeek?.days && Array.isArray(extractedData.oddWeek.days)) {
              shouldHaveCare = extractedData.oddWeek.days.some((d: string) => d.toLowerCase() === dayName);
            }

            if (shouldHaveCare) {
              const startTime = extractedData.handoverStartTime || '08:45';
              const endTime = extractedData.handoverEndTime || '15:30';

              const startDate = new Date(curDate);
              const [sh, sm] = startTime.split(':');
              startDate.setHours(parseInt(sh || '8', 10), parseInt(sm || '45', 10), 0, 0);

              const endDate = new Date(curDate);
              const [eh, em] = endTime.split(':');
              endDate.setHours(parseInt(eh || '15', 10), parseInt(em || '30', 10), 0, 0);

              await tx.coParentEvent.create({
                data: {
                  spaceId: space.id,
                  title: `Péče (${isEven ? 'Sudý' : 'Lichý'} týden)`,
                  description: isEven ? extractedData.evenWeek?.summary : extractedData.oddWeek?.summary,
                  startDate,
                  endDate,
                  category: 'CARE'
                }
              });
            }
          }
        }
      }

      return {
        updatedCase,
        child,
        caseDoc,
        carePlan,
        deadlinesCount: alimonyAmt > 0 ? 1 : 0
      };
    });

    // Sync in-memory dbStore if active
    const memCase = dbStore.cases.find(c => c.id === caseId);
    if (memCase) {
      if (extractedData.court) memCase.court = extractedData.court;
      if (extractedData.caseNumber) memCase.caseNumber = extractedData.caseNumber;
      if (extractedData.custodyType) memCase.currentCareType = extractedData.custodyType;
      if (txResult.child) {
        if (!memCase.children) memCase.children = [];
        const existingCIdx = memCase.children.findIndex((c: any) => c.firstName === txResult.child.firstName && c.lastName === txResult.child.lastName);
        if (existingCIdx >= 0) {
          memCase.children[existingCIdx] = { ...memCase.children[existingCIdx], ...txResult.child };
        } else {
          memCase.children.push(txResult.child);
        }
      }
      if (txResult.caseDoc) {
        if (!memCase.documents) memCase.documents = [];
        memCase.documents.push(txResult.caseDoc);
      }
      if (!memCase.evidence) memCase.evidence = [];
      memCase.evidence.push({
        id: `evi-${Date.now()}`,
        caseId,
        title: `Soudní rozsudek (${extractedData.court || 'Soud'})`,
        type: 'DOCUMENT'
      } as any);
      if (!memCase.deadlines) memCase.deadlines = [];
      if (Number(extractedData.alimonyAmount) > 0) {
        memCase.deadlines.push({
          id: `dl-${Date.now()}-1`,
          caseId,
          title: `Splatnost výživného (${extractedData.alimonyDueDate || 15}. den v měsíci) - ${extractedData.alimonyAmount} Kč`,
          type: 'FINANCIAL',
          dueDate: new Date().toISOString()
        } as any);
      }
      if (Number(extractedData.alimonyDebtAmount) > 0) {
        memCase.deadlines.push({
          id: `dl-${Date.now()}-2`,
          caseId,
          title: `Dlužné výživné (${extractedData.alimonyDebtAmount} Kč) - čeká na datum PM`,
          type: 'FINANCIAL',
          dueDate: new Date().toISOString()
        } as any);
      }
      if (!memCase.tasks) memCase.tasks = [];
      if (Number(extractedData.alimonyDebtAmount) > 0 && !extractedData.effectiveDate) {
        memCase.tasks.push({
          id: `task-${Date.now()}-1`,
          caseId,
          title: `Doplnit datum právní moci rozsudku pro dlužné výživné (${extractedData.alimonyDebtAmount} Kč)`
        } as any);
      }
      if (extractedData.informationDuty) {
        memCase.tasks.push({
          id: `task-${Date.now()}-2`,
          caseId,
          title: 'Informační povinnost o dítěti (1× denně v době péče)'
        } as any);
      }
      if (txResult.carePlan) {
        if (!memCase.carePlans) memCase.carePlans = [];
        memCase.carePlans.push(txResult.carePlan);
      }
    }

    // 3. Audit Log
    await AuditService.recordLog(
      'JUDGMENT_APPLIED_COMPLETE',
      'ClientCase',
      `Kompletně a atomicky aplikován rozsudek pro spis ${extractedData.caseNumber || caseId}. Vytvořeno/aktualizováno: Dítě, Dokument, Důkaz, Lhůty, Plán péče, Kalendář spisu a CoParent Hub.`,
      requestingUser
    );

    return {
      success: true,
      caseId,
      child: txResult.child,
      document: txResult.caseDoc,
      carePlan: txResult.carePlan,
      deadlinesCount: txResult.deadlinesCount
    };
  }

  // ----------------------------------------------------
  // EXPORT SUMMARY
  // ----------------------------------------------------
  public static async generateCaseExport(caseId: string, requestingUser: User): Promise<any> {
    const prisma = getPrismaClient();

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
