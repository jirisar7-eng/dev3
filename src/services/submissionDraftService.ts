import { prisma, isPrismaAvailable, markPrismaUnavailable, isFallbackAllowed } from '../db/prisma';
import { dbStore } from './dbStore';
import { ClientCaseService } from './clientCaseService';
import { AuditService } from './auditService';
import { User, CaseSubmissionDraft, CaseSubmissionDraftVersion, SubmissionDraftStatus } from '../types';

export interface CreateDraftInput {
  title: string;
  templateId?: string;
  formData?: any;
  generatedContent?: string;
  notes?: string;
  status?: SubmissionDraftStatus | string;
}

export interface UpdateDraftInput {
  title?: string;
  templateId?: string;
  formData?: any;
  generatedContent?: string;
  notes?: string;
  status?: SubmissionDraftStatus | string;
  createNewVersion?: boolean;
  changeSummary?: string;
}

export class SubmissionDraftService {
  private static isAdmin(user: User): boolean {
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || (user.role as any) === 'SYSTEM_ADMIN';
  }

  private static validateStatus(status?: string): void {
    if (status && !['DRAFT', 'FINAL', 'ARCHIVED'].includes(status)) {
      throw new Error('Neplatný stav konceptu podání. Povolené hodnoty: DRAFT, FINAL, ARCHIVED.');
    }
  }

  /**
   * Vytvoření nového konceptu podání s výchozí verzí 1
   */
  public static async createDraft(
    caseId: string,
    user: User,
    input: CreateDraftInput
  ): Promise<CaseSubmissionDraft> {
    if (!input.title || typeof input.title !== 'string' || input.title.trim() === '') {
      throw new Error('Název konceptu podání je povinný.');
    }

    this.validateStatus(input.status);

    // 1. Ověření přístupu ke spisu (IDOR/BOLA check)
    const clientCase = await ClientCaseService.authorizeCaseAccess(caseId, user);
    const draftStatus = input.status || 'DRAFT';
    const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const versionId = `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const initialVersionData = {
      id: versionId,
      draftId,
      version: 1,
      title: input.title.trim(),
      formData: input.formData || null,
      generatedContent: input.generatedContent || null,
      changeSummary: 'Prvotní koncept podání',
      createdById: user.id,
      createdAt: nowIso,
    };

    if (!isPrismaAvailable()) {
      const draftRecord: CaseSubmissionDraft = {
        id: draftId,
        caseId: clientCase.id,
        userId: user.id,
        title: input.title.trim(),
        templateId: input.templateId || 'CUSTOM',
        status: draftStatus,
        formData: input.formData || null,
        generatedContent: input.generatedContent || null,
        notes: input.notes || null,
        version: 1,
        createdAt: nowIso,
        updatedAt: nowIso,
        versions: [initialVersionData],
      };

      dbStore.submissionDrafts.push(draftRecord);
      dbStore.submissionDraftVersions.push(initialVersionData);

      await AuditService.recordLog(
        'SUBMISSION_DRAFT_CREATED',
        'SUBMISSIONS',
        `Vytvořen nový koncept podání ID: ${draftId} pro případ: ${caseId}`,
        user
      );

      return draftRecord;
    }

    try {
      const created = await (prisma as any).caseSubmissionDraft.create({
        data: {
          caseId: clientCase.id,
          userId: user.id,
          title: input.title.trim(),
          templateId: input.templateId || 'CUSTOM',
          status: draftStatus,
          formData: input.formData || null,
          generatedContent: input.generatedContent || null,
          notes: input.notes || null,
          version: 1,
          versions: {
            create: {
              version: 1,
              title: input.title.trim(),
              formData: input.formData || null,
              generatedContent: input.generatedContent || null,
              changeSummary: 'Prvotní koncept podání',
              createdById: user.id,
            },
          },
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
          },
        },
      });

      await AuditService.recordLog(
        'SUBMISSION_DRAFT_CREATED',
        'SUBMISSIONS',
        `Vytvořen nový koncept podání ID: ${created.id} pro případ: ${caseId}`,
        user
      );

      return {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        versions: created.versions.map((v: any) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
      };
    } catch (err: any) {
      if (!isFallbackAllowed()) throw err;
      markPrismaUnavailable(err);
      return this.createDraft(caseId, user, input);
    }
  }

  /**
   * Získání všech konceptů podání pro daný případ
   */
  public static async getDraftsForCase(
    caseId: string,
    user: User
  ): Promise<CaseSubmissionDraft[]> {
    await ClientCaseService.authorizeCaseAccess(caseId, user);

    if (!isPrismaAvailable()) {
      return dbStore.submissionDrafts
        .filter(d => d.caseId === caseId && (d.userId === user.id || this.isAdmin(user)))
        .map(d => ({
          ...d,
          versions: dbStore.submissionDraftVersions
            .filter(v => v.draftId === d.id)
            .sort((a, b) => b.version - a.version),
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    try {
      const found = await (prisma as any).caseSubmissionDraft.findMany({
        where: {
          caseId,
          ...(this.isAdmin(user) ? {} : { userId: user.id }),
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return found.map((d: any) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        versions: d.versions.map((v: any) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
      }));
    } catch (err: any) {
      if (!isFallbackAllowed()) throw err;
      markPrismaUnavailable(err);
      return this.getDraftsForCase(caseId, user);
    }
  }

  /**
   * Získání jednoho konceptu podání podle ID (s kontrolou vlastnictví)
   */
  public static async getDraftById(
    caseId: string,
    draftId: string,
    user: User
  ): Promise<CaseSubmissionDraft> {
    await ClientCaseService.authorizeCaseAccess(caseId, user);

    if (!isPrismaAvailable()) {
      const draft = dbStore.submissionDrafts.find(d => d.id === draftId && d.caseId === caseId);
      if (!draft) {
        throw new Error('Koncept podání nebyl nalezen.');
      }
      if (draft.userId !== user.id && !this.isAdmin(user)) {
        throw new Error('Přístup odepřen: Nemáte oprávnění k tomuto konceptu podání.');
      }
      const versions = dbStore.submissionDraftVersions
        .filter(v => v.draftId === draft.id)
        .sort((a, b) => b.version - a.version);

      return { ...draft, versions };
    }

    try {
      const draft = await (prisma as any).caseSubmissionDraft.findFirst({
        where: {
          id: draftId,
          caseId,
        },
        include: {
          versions: {
            orderBy: { version: 'desc' },
          },
        },
      });

      if (!draft) {
        throw new Error('Koncept podání nebyl nalezen.');
      }

      if (draft.userId !== user.id && !this.isAdmin(user)) {
        throw new Error('Přístup odepřen: Nemáte oprávnění k tomuto konceptu podání.');
      }

      return {
        ...draft,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
        versions: draft.versions.map((v: any) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
      };
    } catch (err: any) {
      if (!isFallbackAllowed()) throw err;
      markPrismaUnavailable(err);
      return this.getDraftById(caseId, draftId, user);
    }
  }

  /**
   * Aktualizace konceptu podání (automatické uložení / nová verze)
   */
  public static async updateDraft(
    caseId: string,
    draftId: string,
    user: User,
    input: UpdateDraftInput
  ): Promise<CaseSubmissionDraft> {
    const existing = await this.getDraftById(caseId, draftId, user);
    this.validateStatus(input.status);

    const newTitle = input.title !== undefined ? input.title.trim() : existing.title;
    if (!newTitle) {
      throw new Error('Název konceptu podání nesmí být prázdný.');
    }

    const shouldCreateVersion = input.createNewVersion !== undefined
      ? input.createNewVersion
      : (
        (input.generatedContent !== undefined && input.generatedContent !== existing.generatedContent) ||
        (input.formData !== undefined && JSON.stringify(input.formData) !== JSON.stringify(existing.formData))
      );

    const nextVersionNum = shouldCreateVersion ? existing.version + 1 : existing.version;
    const nowIso = new Date().toISOString();

    if (!isPrismaAvailable()) {
      const storeDraft = dbStore.submissionDrafts.find(d => d.id === draftId);
      if (storeDraft) {
        storeDraft.title = newTitle;
        if (input.templateId !== undefined) storeDraft.templateId = input.templateId;
        if (input.status !== undefined) storeDraft.status = input.status;
        if (input.formData !== undefined) storeDraft.formData = input.formData;
        if (input.generatedContent !== undefined) storeDraft.generatedContent = input.generatedContent;
        if (input.notes !== undefined) storeDraft.notes = input.notes;
        storeDraft.version = nextVersionNum;
        storeDraft.updatedAt = nowIso;
      }

      if (shouldCreateVersion) {
        const newVerRecord: CaseSubmissionDraftVersion = {
          id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          draftId: existing.id,
          version: nextVersionNum,
          title: newTitle,
          formData: input.formData !== undefined ? input.formData : existing.formData || null,
          generatedContent: input.generatedContent !== undefined ? input.generatedContent : existing.generatedContent || null,
          changeSummary: input.changeSummary || `Aktualizace podání (verze ${nextVersionNum})`,
          createdById: user.id,
          createdAt: nowIso,
        };
        dbStore.submissionDraftVersions.push(newVerRecord);
      }

      return this.getDraftById(caseId, draftId, user);
    }

    try {
      const updateData: any = {
        title: newTitle,
        ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.formData !== undefined ? { formData: input.formData } : {}),
        ...(input.generatedContent !== undefined ? { generatedContent: input.generatedContent } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        version: nextVersionNum,
      };

      if (shouldCreateVersion) {
        updateData.versions = {
          create: {
            version: nextVersionNum,
            title: newTitle,
            formData: input.formData !== undefined ? input.formData : existing.formData,
            generatedContent: input.generatedContent !== undefined ? input.generatedContent : existing.generatedContent,
            changeSummary: input.changeSummary || `Aktualizace podání (verze ${nextVersionNum})`,
            createdById: user.id,
          },
        };
      }

      const updated = await (prisma as any).caseSubmissionDraft.update({
        where: { id: draftId },
        data: updateData,
        include: {
          versions: {
            orderBy: { version: 'desc' },
          },
        },
      });

      await AuditService.recordLog(
        'SUBMISSION_DRAFT_UPDATED',
        'SUBMISSIONS',
        `Aktualizován koncept podání ID: ${draftId}, Verze: ${nextVersionNum}`,
        user
      );

      return {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
        versions: updated.versions.map((v: any) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
      };
    } catch (err: any) {
      if (!isFallbackAllowed()) throw err;
      markPrismaUnavailable(err);
      return this.updateDraft(caseId, draftId, user, input);
    }
  }

  /**
   * Získání historie verzí konceptu podání
   */
  public static async getDraftVersions(
    caseId: string,
    draftId: string,
    user: User
  ): Promise<CaseSubmissionDraftVersion[]> {
    const draft = await this.getDraftById(caseId, draftId, user);
    return draft.versions || [];
  }

  /**
   * Obnovení (rollback) předchozí verze konceptu podání
   */
  public static async rollbackDraftVersion(
    caseId: string,
    draftId: string,
    targetVersion: number,
    user: User
  ): Promise<CaseSubmissionDraft> {
    if (!targetVersion || typeof targetVersion !== 'number' || targetVersion < 1) {
      throw new Error('Neplatné číslo verze pro obnovení.');
    }

    const draft = await this.getDraftById(caseId, draftId, user);
    const target = (draft.versions || []).find(v => v.version === targetVersion);

    if (!target) {
      throw new Error(`Verze ${targetVersion} nebyla pro tento koncept podání nalezena.`);
    }

    return this.updateDraft(caseId, draftId, user, {
      title: target.title,
      formData: target.formData,
      generatedContent: target.generatedContent,
      createNewVersion: true,
      changeSummary: `Obnovení verze ${targetVersion}`,
    });
  }

  /**
   * Smazání konceptu podání
   */
  public static async deleteDraft(
    caseId: string,
    draftId: string,
    user: User
  ): Promise<boolean> {
    const draft = await this.getDraftById(caseId, draftId, user);

    if (!isPrismaAvailable()) {
      dbStore.submissionDrafts = dbStore.submissionDrafts.filter(d => d.id !== draft.id);
      dbStore.submissionDraftVersions = dbStore.submissionDraftVersions.filter(v => v.draftId !== draft.id);

      await AuditService.recordLog(
        'SUBMISSION_DRAFT_DELETED',
        'SUBMISSIONS',
        `Smazán koncept podání ID: ${draftId}`,
        user
      );

      return true;
    }

    try {
      await (prisma as any).caseSubmissionDraft.delete({
        where: { id: draft.id },
      });

      await AuditService.recordLog(
        'SUBMISSION_DRAFT_DELETED',
        'SUBMISSIONS',
        `Smazán koncept podání ID: ${draftId}`,
        user
      );

      return true;
    } catch (err: any) {
      if (!isFallbackAllowed()) throw err;
      markPrismaUnavailable(err);
      return this.deleteDraft(caseId, draftId, user);
    }
  }
}
