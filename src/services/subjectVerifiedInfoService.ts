import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { AuditService } from './auditService';
import { VerifiedInfoValidator } from './verifiedInfoValidator';
import {
  CreateSourceProposalInput,
  ReviewSourceProposalInput,
  SubjectInformationSourceDto,
  SubjectVerificationStatus,
  SubjectVerifiedProfileDto,
  UpdateVerifiedProfileInput,
  WeeklyOpeningHours,
} from '../types/verifiedSubjectInfo';
import { User } from '../types';

export class SubjectVerifiedInfoService {
  /**
   * Helper to serialize WeeklyOpeningHours to string safely.
   */
  private static serializeOpeningHours(hours?: WeeklyOpeningHours | null): string | null {
    if (!hours) return null;
    return JSON.stringify(hours);
  }

  /**
   * Helper to parse raw opening hours into WeeklyOpeningHours.
   */
  private static parseOpeningHours(raw?: string | null): WeeklyOpeningHours | null {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const res = VerifiedInfoValidator.validateWeeklyOpeningHours(parsed);
      return res.valid && res.normalized ? res.normalized : null;
    } catch {
      return null;
    }
  }

  /**
   * Map Prisma profile record to DTO.
   */
  private static mapPrismaProfileToDto(p: any): SubjectVerifiedProfileDto {
    return {
      id: p.id,
      subjektId: p.subjektId,
      officialWebsite: p.officialWebsite || null,
      officialPhone: p.officialPhone || null,
      officialEmail: p.officialEmail || null,
      openingHours: this.parseOpeningHours(p.openingHours),
      openingHoursRaw: p.openingHours || null,
      appointmentRequired: Boolean(p.appointmentRequired),
      bookingUrl: p.bookingUrl || null,
      accessibility: p.accessibility || null,
      dataBoxId: p.dataBoxId || null,
      submissionMethods: p.submissionMethods || null,
      status: p.status as SubjectVerificationStatus,
      staleAfterDays: p.staleAfterDays || 180,
      lastCheckedAt: p.lastCheckedAt ? p.lastCheckedAt.toISOString() : null,
      nextCheckAt: p.nextCheckAt ? p.nextCheckAt.toISOString() : null,
      verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
      verifiedById: p.verifiedById || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  /**
   * Map Prisma source record to DTO.
   */
  private static mapPrismaSourceToDto(s: any): SubjectInformationSourceDto {
    return {
      id: s.id,
      profileId: s.profileId || null,
      subjektId: s.subjektId,
      sourceLevel: s.sourceLevel,
      sourceUrl: s.sourceUrl,
      fieldKey: s.fieldKey,
      extractedValue: s.extractedValue,
      evidenceSnippet: s.evidenceSnippet || null,
      extractionMethod: s.extractionMethod,
      confidence: s.confidence != null ? s.confidence : null,
      status: s.status as SubjectVerificationStatus,
      createdById: s.createdById || null,
      reviewedById: s.reviewedById || null,
      reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
      rejectionReason: s.rejectionReason || null,
      fetchedAt: s.fetchedAt ? s.fetchedAt.toISOString() : s.createdAt.toISOString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  /**
   * Get verified profile for a Subject.
   */
  public static async getVerifiedProfile(subjektId: string): Promise<SubjectVerifiedProfileDto | null> {
    if (!subjektId) return null;

    if (isPrismaAvailable()) {
      try {
        const p = await prisma.subjectVerifiedProfile.findUnique({
          where: { subjektId },
        });
        if (p) return this.mapPrismaProfileToDto(p);
      } catch (err) {
        console.warn('[VerifiedInfoService] Fallback getVerifiedProfile to dbStore:', err);
      }
    }

    const memProfile = dbStore.subjectVerifiedProfiles.find((p) => p.subjektId === subjektId);
    return memProfile || null;
  }

  /**
   * Get information sources for a Subject.
   */
  public static async getInformationSources(
    subjektId: string,
    filterStatus?: SubjectVerificationStatus
  ): Promise<SubjectInformationSourceDto[]> {
    if (!subjektId) return [];

    if (isPrismaAvailable()) {
      try {
        const where: any = { subjektId };
        if (filterStatus) where.status = filterStatus;

        const sources = await prisma.subjectInformationSource.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });
        return sources.map((s: any) => this.mapPrismaSourceToDto(s));
      } catch (err) {
        console.warn('[VerifiedInfoService] Fallback getInformationSources to dbStore:', err);
      }
    }

    return dbStore.subjectInformationSources.filter((s) => {
      if (s.subjektId !== subjektId) return false;
      if (filterStatus && s.status !== filterStatus) return false;
      return true;
    });
  }

  /**
   * Submit a new information source proposal.
   * STRICT SECURITY: Forced PENDING_REVIEW status, SSRF verification, sanitization, audit log.
   */
  public static async submitSourceProposal(
    input: CreateSourceProposalInput,
    submitter?: User | null
  ): Promise<SubjectInformationSourceDto> {
    if (!input.subjektId) {
      throw new Error('ID subjektu je povinné');
    }

    // SSRF URL validation
    const urlValidation = VerifiedInfoValidator.validateSourceUrl(input.sourceUrl);
    if (!urlValidation.valid || !urlValidation.normalizedUrl) {
      throw new Error(urlValidation.error || 'Neplatná URL adresa zdroje');
    }

    // Field key validation
    const keyValidation = VerifiedInfoValidator.validateFieldKey(input.fieldKey);
    if (!keyValidation.valid) {
      throw new Error(keyValidation.error || 'Neplatný klíč pole');
    }

    // If openingHours, validate weekly structure
    let extractedValue = input.extractedValue;
    if (input.fieldKey === 'openingHours') {
      try {
        const parsed = typeof extractedValue === 'string' ? JSON.parse(extractedValue) : extractedValue;
        const hoursRes = VerifiedInfoValidator.validateWeeklyOpeningHours(parsed);
        if (!hoursRes.valid || !hoursRes.normalized) {
          throw new Error(hoursRes.error || 'Nevalidní formát úředních hodin');
        }
        extractedValue = JSON.stringify(hoursRes.normalized);
      } catch (e: any) {
        throw new Error(e.message || 'Chyba validace formátu úředních hodin');
      }
    } else {
      extractedValue = VerifiedInfoValidator.sanitizeText(extractedValue, 5000);
    }

    const sanitizedSnippet = VerifiedInfoValidator.sanitizeText(input.evidenceSnippet, 2000);
    const sourceLevel = input.sourceLevel || 'P4_USER_COMMUNITY_PROPOSAL';
    const extractionMethod = input.extractionMethod || (submitter ? 'COMMUNITY_PROPOSAL' : 'MANUAL');

    // Verify Subject exists
    let existingSubjekt: any = null;
    if (isPrismaAvailable()) {
      try {
        existingSubjekt = await prisma.subjekt.findUnique({
          where: { id: input.subjektId },
          select: { id: true, name: true },
        });
      } catch (err) {
        console.warn('[VerifiedInfoService] Fallback check subjekt in dbStore:', err);
      }
    }

    if (!existingSubjekt) {
      existingSubjekt = dbStore.subjekty.find((s) => s.id === input.subjektId);
    }

    if (!existingSubjekt) {
      throw new Error(`Subjekt s ID ${input.subjektId} nebyl nalezen`);
    }

    // Database or Memory persistence
    let createdSourceDto: SubjectInformationSourceDto;

    if (isPrismaAvailable()) {
      try {
        const created = await prisma.subjectInformationSource.create({
          data: {
            subjektId: input.subjektId,
            sourceLevel,
            sourceUrl: urlValidation.normalizedUrl,
            fieldKey: input.fieldKey.trim(),
            extractedValue,
            evidenceSnippet: sanitizedSnippet || null,
            extractionMethod,
            confidence: input.confidence != null ? Number(input.confidence) : null,
            status: 'PENDING_REVIEW', // STRICT ENFORCEMENT
            createdById: submitter?.id || null,
          },
        });

        createdSourceDto = this.mapPrismaSourceToDto(created);
      } catch (err) {
        console.warn('[VerifiedInfoService] Prisma submitSourceProposal fallback:', err);
        createdSourceDto = this.submitSourceProposalMemory(
          input.subjektId,
          urlValidation.normalizedUrl,
          input.fieldKey.trim(),
          extractedValue,
          sanitizedSnippet,
          sourceLevel,
          extractionMethod,
          input.confidence,
          submitter
        );
      }
    } else {
      createdSourceDto = this.submitSourceProposalMemory(
        input.subjektId,
        urlValidation.normalizedUrl,
        input.fieldKey.trim(),
        extractedValue,
        sanitizedSnippet,
        sourceLevel,
        extractionMethod,
        input.confidence,
        submitter
      );
    }

    // Record audit log
    await AuditService.recordLog(
      'PROPOSE_SUBJECT_SOURCE',
      'SUBJEKT_VERIFIED_INFO',
      JSON.stringify({
        sourceId: createdSourceDto.id,
        subjektId: input.subjektId,
        subjektName: existingSubjekt.name,
        fieldKey: input.fieldKey,
        sourceUrl: urlValidation.normalizedUrl,
        sourceLevel,
      }),
      submitter
    );

    return createdSourceDto;
  }

  private static submitSourceProposalMemory(
    subjektId: string,
    sourceUrl: string,
    fieldKey: string,
    extractedValue: string,
    evidenceSnippet: string,
    sourceLevel: any,
    extractionMethod: string,
    confidence?: number,
    submitter?: User | null
  ): SubjectInformationSourceDto {
    const newSource: SubjectInformationSourceDto = {
      id: 'src-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      subjektId,
      sourceLevel,
      sourceUrl,
      fieldKey,
      extractedValue,
      evidenceSnippet: evidenceSnippet || null,
      extractionMethod,
      confidence: confidence != null ? confidence : null,
      status: 'PENDING_REVIEW',
      createdById: submitter?.id || null,
      fetchedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.subjectInformationSources.unshift(newSource);
    return newSource;
  }

  /**
   * Review an information source proposal (APPROVE / REJECT).
   * STRICT SECURITY: Only MODERATOR, ADMIN, SUPER_ADMIN can review.
   * On APPROVE: Updates source status and applies field to SubjectVerifiedProfile.
   */
  public static async reviewSourceProposal(
    sourceId: string,
    reviewInput: ReviewSourceProposalInput,
    reviewer: User
  ): Promise<{ source: SubjectInformationSourceDto; profile?: SubjectVerifiedProfileDto }> {
    if (!reviewer) {
      const err: any = new Error('Neautorizovaný přístup k moderaci');
      err.statusCode = 401;
      throw err;
    }

    const role = (reviewer.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
      const err: any = new Error('Nemáte oprávnění moderovat ověřené informace subjektů');
      err.statusCode = 403;
      throw err;
    }

    if (!sourceId) {
      const err: any = new Error('ID zdroje je povinné');
      err.statusCode = 400;
      throw err;
    }

    // Load existing source upfront for Concurrency Guard & Four-Eyes Principle check
    let existingSource: any = null;
    if (isPrismaAvailable()) {
      try {
        existingSource = await prisma.subjectInformationSource.findUnique({
          where: { id: sourceId },
        });
      } catch (err) {
        console.warn('[VerifiedInfoService] Prisma findUnique error fallback:', err);
      }
    }
    if (!existingSource) {
      existingSource = dbStore.subjectInformationSources.find((s) => s.id === sourceId) || null;
    }

    if (!existingSource) {
      const err: any = new Error(`Zdroj s ID ${sourceId} nebyl nalezen`);
      err.statusCode = 404;
      throw err;
    }

    // CONCURRENCY GUARD: Only PENDING_REVIEW can be processed
    if (existingSource.status !== 'PENDING_REVIEW') {
      const err: any = new Error('Tento návrh byl již zpracován jiným moderátorem.');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    // IDOR / BOLA PROTECTION: If subjektId provided, verify source belongs to the same subject
    if (reviewInput.subjektId && existingSource.subjektId !== reviewInput.subjektId) {
      const err: any = new Error('Zdroj nepatří k zadanému subjektu.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    // FOUR-EYES PRINCIPLE: Submitter cannot moderate their own proposal
    if (existingSource.createdById && reviewer.id && existingSource.createdById === reviewer.id) {
      const err: any = new Error('Nemůžete moderovat vlastní návrh.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    const now = new Date();
    const nextCheckDate = new Date();
    nextCheckDate.setDate(nextCheckDate.getDate() + 180);

    if (reviewInput.decision === 'REJECT') {
      const reason = VerifiedInfoValidator.sanitizeText(reviewInput.rejectionReason, 500) || 'Zamítnuto moderátorem';

      if (isPrismaAvailable()) {
        try {
          const updateResult = await prisma.subjectInformationSource.updateMany({
            where: { id: sourceId, status: 'PENDING_REVIEW' },
            data: {
              status: 'REJECTED',
              reviewedById: reviewer.id,
              reviewedAt: now,
              rejectionReason: reason,
            },
          });

          if (updateResult.count === 0) {
            const err: any = new Error('Tento návrh byl již zpracován jiným moderátorem.');
            err.statusCode = 409;
            err.code = 'CONFLICT';
            throw err;
          }

          const updated = await prisma.subjectInformationSource.findUnique({
            where: { id: sourceId },
          });

          await AuditService.recordLog(
            'REJECT_SUBJECT_SOURCE',
            'SUBJEKT_VERIFIED_INFO',
            JSON.stringify({ sourceId, rejectionReason: reason }),
            reviewer
          );

          return { source: this.mapPrismaSourceToDto(updated!) };
        } catch (err: any) {
          if (err?.statusCode === 409) throw err;
          console.warn('[VerifiedInfoService] Prisma reject error fallback:', err);
        }
      }

      const memSource = dbStore.subjectInformationSources.find((s) => s.id === sourceId);
      if (!memSource) throw new Error(`Zdroj s ID ${sourceId} nebyl nalezen`);

      if (memSource.status !== 'PENDING_REVIEW') {
        const err: any = new Error('Tento návrh byl již zpracován jiným moderátorem.');
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }

      memSource.status = 'REJECTED';
      memSource.reviewedById = reviewer.id;
      memSource.reviewedAt = now.toISOString();
      memSource.rejectionReason = reason;
      memSource.updatedAt = now.toISOString();

      await AuditService.recordLog(
        'REJECT_SUBJECT_SOURCE',
        'SUBJEKT_VERIFIED_INFO',
        JSON.stringify({ sourceId, rejectionReason: reason }),
        reviewer
      );

      return { source: memSource };
    }

    // Decision === 'APPROVE'
    if (isPrismaAvailable()) {
      try {
        const source = await prisma.subjectInformationSource.findUnique({
          where: { id: sourceId },
        });

        if (!source) throw new Error(`Zdroj s ID ${sourceId} nebyl nalezen`);
        if (source.status !== 'PENDING_REVIEW') {
          const err: any = new Error('Tento návrh byl již zpracován jiným moderátorem.');
          err.statusCode = 409;
          err.code = 'CONFLICT';
          throw err;
        }

        // Prepare profile update data based on fieldKey
        const profileUpdateData: any = {
          status: 'VERIFIED',
          lastCheckedAt: now,
          nextCheckAt: nextCheckDate,
          verifiedAt: now,
          verifiedById: reviewer.id,
        };

        if (source.fieldKey === 'openingHours') {
          profileUpdateData.openingHours = source.extractedValue;
        } else if (source.fieldKey === 'officialWebsite') {
          profileUpdateData.officialWebsite = source.extractedValue;
        } else if (source.fieldKey === 'officialPhone') {
          profileUpdateData.officialPhone = source.extractedValue;
        } else if (source.fieldKey === 'officialEmail') {
          profileUpdateData.officialEmail = source.extractedValue;
        } else if (source.fieldKey === 'accessibility') {
          profileUpdateData.accessibility = source.extractedValue;
        } else if (source.fieldKey === 'dataBoxId') {
          profileUpdateData.dataBoxId = source.extractedValue;
        } else if (source.fieldKey === 'submissionMethods') {
          profileUpdateData.submissionMethods = source.extractedValue;
        } else if (source.fieldKey === 'bookingUrl') {
          profileUpdateData.bookingUrl = source.extractedValue;
        } else if (source.fieldKey === 'appointmentRequired') {
          profileUpdateData.appointmentRequired = source.extractedValue === 'true' || source.extractedValue === '1';
        }

        // Update Source with atomic concurrency guard FIRST
        const updateResult = await prisma.subjectInformationSource.updateMany({
          where: { id: sourceId, status: 'PENDING_REVIEW' },
          data: {
            status: 'VERIFIED',
            reviewedById: reviewer.id,
            reviewedAt: now,
          },
        });

        if (updateResult.count === 0) {
          const err: any = new Error('Tento návrh byl již zpracován jiným moderátorem.');
          err.statusCode = 409;
          err.code = 'CONFLICT';
          throw err;
        }

        // Upsert Profile only after atomic status claim succeeded
        const profile = await prisma.subjectVerifiedProfile.upsert({
          where: { subjektId: source.subjektId },
          create: {
            subjektId: source.subjektId,
            ...profileUpdateData,
          },
          update: {
            ...profileUpdateData,
          },
        });

        // Link profileId to source
        await prisma.subjectInformationSource.update({
          where: { id: sourceId },
          data: { profileId: profile.id },
        });

        const updatedSource = await prisma.subjectInformationSource.findUnique({
          where: { id: sourceId },
        });

        await AuditService.recordLog(
          'APPROVE_SUBJECT_SOURCE',
          'SUBJEKT_VERIFIED_INFO',
          JSON.stringify({
            sourceId,
            subjektId: source.subjektId,
            fieldKey: source.fieldKey,
            profileId: profile.id,
          }),
          reviewer
        );

        return {
          source: this.mapPrismaSourceToDto(updatedSource!),
          profile: this.mapPrismaProfileToDto(profile),
        };
      } catch (err: any) {
        if (err?.statusCode === 409) throw err;
        console.warn('[VerifiedInfoService] Prisma approve error fallback:', err);
      }
    }

    // Memory Fallback
    const memSource = dbStore.subjectInformationSources.find((s) => s.id === sourceId);
    if (!memSource) throw new Error(`Zdroj s ID ${sourceId} nebyl nalezen`);

    if (memSource.status !== 'PENDING_REVIEW') {
      const err: any = new Error('Tento návrh byl již zpracován jiným moderátorem.');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    // Atomically claim state immediately to prevent race conditions
    memSource.status = 'VERIFIED';

    let memProfile = dbStore.subjectVerifiedProfiles.find((p) => p.subjektId === memSource.subjektId);

    if (!memProfile) {
      memProfile = {
        id: 'prof-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        subjektId: memSource.subjektId,
        appointmentRequired: false,
        status: 'VERIFIED',
        staleAfterDays: 180,
        lastCheckedAt: now.toISOString(),
        nextCheckAt: nextCheckDate.toISOString(),
        verifiedAt: now.toISOString(),
        verifiedById: reviewer.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      dbStore.subjectVerifiedProfiles.push(memProfile);
    } else {
      memProfile.status = 'VERIFIED';
      memProfile.lastCheckedAt = now.toISOString();
      memProfile.nextCheckAt = nextCheckDate.toISOString();
      memProfile.verifiedAt = now.toISOString();
      memProfile.verifiedById = reviewer.id;
      memProfile.updatedAt = now.toISOString();
    }

    if (memSource.fieldKey === 'openingHours') {
      memProfile.openingHours = this.parseOpeningHours(memSource.extractedValue);
      memProfile.openingHoursRaw = memSource.extractedValue;
    } else if (memSource.fieldKey === 'officialWebsite') {
      memProfile.officialWebsite = memSource.extractedValue;
    } else if (memSource.fieldKey === 'officialPhone') {
      memProfile.officialPhone = memSource.extractedValue;
    } else if (memSource.fieldKey === 'officialEmail') {
      memProfile.officialEmail = memSource.extractedValue;
    } else if (memSource.fieldKey === 'accessibility') {
      memProfile.accessibility = memSource.extractedValue;
    } else if (memSource.fieldKey === 'dataBoxId') {
      memProfile.dataBoxId = memSource.extractedValue;
    } else if (memSource.fieldKey === 'submissionMethods') {
      memProfile.submissionMethods = memSource.extractedValue;
    } else if (memSource.fieldKey === 'bookingUrl') {
      memProfile.bookingUrl = memSource.extractedValue;
    } else if (memSource.fieldKey === 'appointmentRequired') {
      memProfile.appointmentRequired = memSource.extractedValue === 'true' || memSource.extractedValue === '1';
    }

    memSource.status = 'VERIFIED';
    memSource.profileId = memProfile.id;
    memSource.reviewedById = reviewer.id;
    memSource.reviewedAt = now.toISOString();
    memSource.updatedAt = now.toISOString();

    await AuditService.recordLog(
      'APPROVE_SUBJECT_SOURCE',
      'SUBJEKT_VERIFIED_INFO',
      JSON.stringify({
        sourceId,
        subjektId: memSource.subjektId,
        fieldKey: memSource.fieldKey,
        profileId: memProfile.id,
      }),
      reviewer
    );

    return { source: memSource, profile: memProfile };
  }

  /**
   * Direct update of Verified Profile by Admin.
   * STRICT SECURITY: Only ADMIN, SUPER_ADMIN can execute.
   */
  public static async updateVerifiedProfileDirect(
    subjektId: string,
    updateData: UpdateVerifiedProfileInput,
    adminUser: User
  ): Promise<SubjectVerifiedProfileDto> {
    if (!adminUser) {
      throw new Error('Neautorizovaný přístup');
    }

    const role = (adminUser.role || '').toUpperCase();
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      throw new Error('Nemáte oprávnění k přímé úpravě ověřeného profilu');
    }

    if (!subjektId) {
      throw new Error('ID subjektu je povinné');
    }

    let openingHoursStr: string | null = null;
    if (updateData.openingHours) {
      const hoursRes = VerifiedInfoValidator.validateWeeklyOpeningHours(updateData.openingHours);
      if (!hoursRes.valid || !hoursRes.normalized) {
        throw new Error(hoursRes.error || 'Nevalidní formát úředních hodin');
      }
      openingHoursStr = JSON.stringify(hoursRes.normalized);
    }

    const now = new Date();
    const staleDays = updateData.staleAfterDays || 180;
    const nextCheckDate = new Date();
    nextCheckDate.setDate(nextCheckDate.getDate() + staleDays);

    const profileData: any = {
      status: 'VERIFIED',
      staleAfterDays: staleDays,
      lastCheckedAt: now,
      nextCheckAt: nextCheckDate,
      verifiedAt: now,
      verifiedById: adminUser.id,
    };

    if (updateData.officialWebsite !== undefined) {
      if (updateData.officialWebsite) {
        const urlRes = VerifiedInfoValidator.validateSourceUrl(updateData.officialWebsite);
        if (!urlRes.valid) throw new Error(urlRes.error);
        profileData.officialWebsite = urlRes.normalizedUrl;
      } else {
        profileData.officialWebsite = null;
      }
    }

    if (updateData.officialPhone !== undefined) {
      profileData.officialPhone = updateData.officialPhone
        ? VerifiedInfoValidator.sanitizeText(updateData.officialPhone, 50)
        : null;
    }

    if (updateData.officialEmail !== undefined) {
      profileData.officialEmail = updateData.officialEmail
        ? VerifiedInfoValidator.sanitizeText(updateData.officialEmail, 150)
        : null;
    }

    if (openingHoursStr !== null) {
      profileData.openingHours = openingHoursStr;
    }

    if (updateData.appointmentRequired !== undefined) {
      profileData.appointmentRequired = Boolean(updateData.appointmentRequired);
    }

    if (updateData.bookingUrl !== undefined) {
      if (updateData.bookingUrl) {
        const urlRes = VerifiedInfoValidator.validateSourceUrl(updateData.bookingUrl);
        if (!urlRes.valid) throw new Error(urlRes.error);
        profileData.bookingUrl = urlRes.normalizedUrl;
      } else {
        profileData.bookingUrl = null;
      }
    }

    if (updateData.accessibility !== undefined) {
      profileData.accessibility = updateData.accessibility
        ? VerifiedInfoValidator.sanitizeText(updateData.accessibility, 200)
        : null;
    }

    if (updateData.dataBoxId !== undefined) {
      profileData.dataBoxId = updateData.dataBoxId
        ? VerifiedInfoValidator.sanitizeText(updateData.dataBoxId, 30)
        : null;
    }

    if (updateData.submissionMethods !== undefined) {
      profileData.submissionMethods = updateData.submissionMethods
        ? VerifiedInfoValidator.sanitizeText(updateData.submissionMethods, 1000)
        : null;
    }

    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.subjectVerifiedProfile.upsert({
          where: { subjektId },
          create: {
            subjektId,
            ...profileData,
          },
          update: {
            ...profileData,
          },
        });

        await AuditService.recordLog(
          'DIRECT_UPDATE_VERIFIED_PROFILE',
          'SUBJEKT_VERIFIED_INFO',
          JSON.stringify({ subjektId, updatedFields: Object.keys(profileData) }),
          adminUser
        );

        return this.mapPrismaProfileToDto(updated);
      } catch (err) {
        console.warn('[VerifiedInfoService] Prisma update profile fallback:', err);
      }
    }

    let memProfile = dbStore.subjectVerifiedProfiles.find((p) => p.subjektId === subjektId);
    if (!memProfile) {
      memProfile = {
        id: 'prof-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        subjektId,
        appointmentRequired: false,
        status: 'VERIFIED',
        staleAfterDays: staleDays,
        lastCheckedAt: now.toISOString(),
        nextCheckAt: nextCheckDate.toISOString(),
        verifiedAt: now.toISOString(),
        verifiedById: adminUser.id,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      dbStore.subjectVerifiedProfiles.push(memProfile);
    }

    Object.assign(memProfile, {
      ...profileData,
      lastCheckedAt: now.toISOString(),
      nextCheckAt: nextCheckDate.toISOString(),
      verifiedAt: now.toISOString(),
      verifiedById: adminUser.id,
      updatedAt: now.toISOString(),
      openingHours: openingHoursStr ? this.parseOpeningHours(openingHoursStr) : memProfile.openingHours,
      openingHoursRaw: openingHoursStr || memProfile.openingHoursRaw,
    });

    await AuditService.recordLog(
      'DIRECT_UPDATE_VERIFIED_PROFILE',
      'SUBJEKT_VERIFIED_INFO',
      JSON.stringify({ subjektId, updatedFields: Object.keys(profileData) }),
      adminUser
    );

    return memProfile;
  }

  /**
   * Check for stale profiles and update status if past expiration.
   */
  public static async checkStaleProfiles(): Promise<{ staleCount: number; updatedIds: string[] }> {
    const now = new Date();
    const updatedIds: string[] = [];

    if (isPrismaAvailable()) {
      try {
        const staleProfiles = await prisma.subjectVerifiedProfile.findMany({
          where: {
            status: 'VERIFIED',
            nextCheckAt: { lt: now },
          },
          select: { id: true },
        });

        if (staleProfiles.length > 0) {
          const ids = staleProfiles.map((p) => p.id);
          await prisma.subjectVerifiedProfile.updateMany({
            where: { id: { in: ids } },
            data: { status: 'STALE' },
          });
          return { staleCount: ids.length, updatedIds: ids };
        }
        return { staleCount: 0, updatedIds: [] };
      } catch (err) {
        console.warn('[VerifiedInfoService] Prisma checkStaleProfiles fallback:', err);
      }
    }

    for (const p of dbStore.subjectVerifiedProfiles) {
      if (p.status === 'VERIFIED' && p.nextCheckAt && new Date(p.nextCheckAt) < now) {
        p.status = 'STALE';
        p.updatedAt = now.toISOString();
        updatedIds.push(p.id);
      }
    }

    return { staleCount: updatedIds.length, updatedIds };
  }
}
