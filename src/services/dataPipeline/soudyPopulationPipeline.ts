import { soudyDataset } from '../../data/soudyDataset';
import { getCourtVerifiedMetadata, CourtVerifiedMetadata } from '../../data/soudyVerifiedMetadata';
import { VerifiedInfoValidator } from '../verifiedInfoValidator';
import { dbStore } from '../dbStore';
import { prisma, isPrismaAvailable, getPrismaClient } from '../../db/prisma';
import { AuditService } from '../auditService';
import { SubjectVerifiedProfileDto, SubjectInformationSourceDto } from '../../types/verifiedSubjectInfo';

export interface PopulationResult {
  totalProcessed: number;
  profilesCreated: number;
  profilesUpdated: number;
  sourcesCreated: number;
  sourcesUpdated: number;
  verifiedCount: number;
  skippedCount: number;
  errors: Array<{ courtName: string; fieldKey?: string; error: string }>;
  durationMs: number;
}

export class SoudyPopulationPipeline {
  /**
   * Populates verified data for 107 courts into the in-memory dbStore.
   * Fully idempotent, non-destructive, and provenance-tracked.
   */
  static async populateInMemory(store: typeof dbStore = dbStore): Promise<PopulationResult> {
    const startTime = Date.now();
    const result: PopulationResult = {
      totalProcessed: 0,
      profilesCreated: 0,
      profilesUpdated: 0,
      sourcesCreated: 0,
      sourcesUpdated: 0,
      verifiedCount: 0,
      skippedCount: 0,
      errors: [],
      durationMs: 0,
    };

    const systemUser = {
      id: 'system-pipeline-admin',
      email: 'admin@tatamapravo.cz',
      role: 'ADMIN',
      name: 'System Pipeline Admin',
    };

    for (const court of soudyDataset) {
      result.totalProcessed++;
      const emailLower = (court.email || '').toLowerCase().trim();
      const nameLower = (court.name || '').toLowerCase().trim();

      // Find subject in store
      let existingSubjekt = store.subjekty.find(
        s => s.type === 'SOUD' && (s.email?.toLowerCase().trim() === emailLower || s.name.toLowerCase().trim() === nameLower)
      );

      if (!existingSubjekt) {
        // Fallback: search by name
        existingSubjekt = store.subjekty.find(
          s => s.name.toLowerCase().trim() === nameLower
        );
      }

      if (!existingSubjekt) {
        result.skippedCount++;
        result.errors.push({
          courtName: court.name,
          error: `Subjekt not found in store for court: ${court.name}`,
        });
        continue;
      }

      const meta: CourtVerifiedMetadata = getCourtVerifiedMetadata(court.email, court.website);

      // Validate opening hours
      const hoursValidation = VerifiedInfoValidator.validateWeeklyOpeningHours(meta.openingHours);
      if (!hoursValidation.valid || !hoursValidation.normalized) {
        result.errors.push({
          courtName: court.name,
          fieldKey: 'openingHours',
          error: hoursValidation.error || 'Invalid opening hours',
        });
        continue;
      }

      // Validate URL
      const urlValidation = VerifiedInfoValidator.validateSourceUrl(meta.officialWebsite || meta.sourceUrl);
      if (!urlValidation.valid) {
        result.errors.push({
          courtName: court.name,
          fieldKey: 'officialWebsite',
          error: urlValidation.error || 'Invalid official website URL',
        });
        continue;
      }

      const now = new Date();
      const nextCheck = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days

      // 1. Prepare fields with provenance
      const fieldEntries: Array<{ fieldKey: string; value: any }> = [
        { fieldKey: 'officialWebsite', value: meta.officialWebsite || meta.sourceUrl },
        { fieldKey: 'officialPhone', value: court.phone },
        { fieldKey: 'officialEmail', value: court.email },
        { fieldKey: 'dataBoxId', value: meta.dataBoxId },
        { fieldKey: 'openingHours', value: hoursValidation.normalized },
        { fieldKey: 'appointmentRequired', value: false },
        { fieldKey: 'submissionMethods', value: meta.submissionMethods },
        { fieldKey: 'accessibility', value: meta.accessibility },
      ];

      // Upsert sources in store
      for (const field of fieldEntries) {
        const existingSourceIndex = store.subjectInformationSources.findIndex(
          s => s.subjektId === existingSubjekt!.id && s.fieldKey === field.fieldKey
        );

        const extractedValueStr = typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value);

        if (existingSourceIndex >= 0) {
          store.subjectInformationSources[existingSourceIndex] = {
            ...store.subjectInformationSources[existingSourceIndex],
            sourceUrl: meta.sourceUrl,
            sourceLevel: meta.sourceTrustLevel,
            extractedValue: extractedValueStr,
            status: 'VERIFIED',
            reviewedById: systemUser.id,
            reviewedAt: now.toISOString(),
            updatedAt: now.toISOString(),
            fetchedAt: now.toISOString(),
          };
          result.sourcesUpdated++;
        } else {
          const newSource: SubjectInformationSourceDto = {
            id: `src-${existingSubjekt.id}-${field.fieldKey}`,
            subjektId: existingSubjekt.id,
            fieldKey: field.fieldKey,
            extractedValue: extractedValueStr,
            sourceUrl: meta.sourceUrl,
            sourceLevel: meta.sourceTrustLevel,
            extractionMethod: 'OFFICIAL_DATASET_INGESTION',
            status: 'VERIFIED',
            createdById: systemUser.id,
            reviewedById: systemUser.id,
            reviewedAt: now.toISOString(),
            fetchedAt: now.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };
          store.subjectInformationSources.push(newSource);
          result.sourcesCreated++;
        }
      }

      // Upsert profile in store
      const existingProfileIndex = store.subjectVerifiedProfiles.findIndex(
        p => p.subjektId === existingSubjekt!.id
      );

      const profilePayload: SubjectVerifiedProfileDto = {
        id: existingProfileIndex >= 0 ? store.subjectVerifiedProfiles[existingProfileIndex].id : `vp-${existingSubjekt.id}`,
        subjektId: existingSubjekt.id,
        officialWebsite: meta.officialWebsite || meta.sourceUrl,
        officialPhone: court.phone,
        officialEmail: court.email,
        dataBoxId: meta.dataBoxId,
        openingHours: hoursValidation.normalized,
        appointmentRequired: false,
        bookingUrl: null,
        submissionMethods: meta.submissionMethods,
        accessibility: meta.accessibility,
        status: 'VERIFIED',
        staleAfterDays: 180,
        verifiedAt: now.toISOString(),
        verifiedById: systemUser.id,
        lastCheckedAt: now.toISOString(),
        nextCheckAt: nextCheck.toISOString(),
        createdAt: existingProfileIndex >= 0 ? store.subjectVerifiedProfiles[existingProfileIndex].createdAt : now.toISOString(),
        updatedAt: now.toISOString(),
      };

      if (existingProfileIndex >= 0) {
        store.subjectVerifiedProfiles[existingProfileIndex] = profilePayload;
        result.profilesUpdated++;
      } else {
        store.subjectVerifiedProfiles.push(profilePayload);
        result.profilesCreated++;
      }

      // Update Subjekt coordinates if needed
      if ((existingSubjekt.lat == null || existingSubjekt.lng == null) && court.lat != null && court.lng != null) {
        existingSubjekt.lat = court.lat;
        existingSubjekt.lng = court.lng;
      }

      result.verifiedCount++;
    }

    result.durationMs = Date.now() - startTime;

    store.logAudit(
      'POPULATE_PIPELINE',
      'SUBJECT_VERIFIED_INFO',
      `Soudy Population Pipeline executed in-memory. Processed: ${result.totalProcessed}, Verified: ${result.verifiedCount}, Sources Created/Updated: ${result.sourcesCreated}/${result.sourcesUpdated}`,
      systemUser as any
    );

    return result;
  }

  /**
   * Populates verified data for 107 courts into PostgreSQL via Prisma.
   * If Prisma is unavailable, falls back gracefully to in-memory store.
   */
  static async populatePrisma(prismaClient = getPrismaClient()): Promise<PopulationResult> {
    if (!isPrismaAvailable() || !prismaClient) {
      return this.populateInMemory();
    }

    const startTime = Date.now();
    const result: PopulationResult = {
      totalProcessed: 0,
      profilesCreated: 0,
      profilesUpdated: 0,
      sourcesCreated: 0,
      sourcesUpdated: 0,
      verifiedCount: 0,
      skippedCount: 0,
      errors: [],
      durationMs: 0,
    };

    const systemUser = {
      id: 'system-pipeline-admin',
      email: 'admin@tatamapravo.cz',
      role: 'ADMIN',
      name: 'System Pipeline Admin',
    };

    for (const court of soudyDataset) {
      result.totalProcessed++;
      const emailLower = (court.email || '').toLowerCase().trim();
      const nameLower = (court.name || '').toLowerCase().trim();

      // Find subject in DB
      let subject = await prismaClient.subjekt.findFirst({
        where: {
          type: 'SOUD',
          OR: [
            { email: { equals: emailLower, mode: 'insensitive' } },
            { name: { equals: nameLower, mode: 'insensitive' } },
          ],
        },
      });

      if (!subject) {
        result.skippedCount++;
        result.errors.push({
          courtName: court.name,
          error: `Subjekt not found in PostgreSQL for court: ${court.name}`,
        });
        continue;
      }

      const meta: CourtVerifiedMetadata = getCourtVerifiedMetadata(court.email, court.website);

      // Validate opening hours
      const hoursValidation = VerifiedInfoValidator.validateWeeklyOpeningHours(meta.openingHours);
      if (!hoursValidation.valid || !hoursValidation.normalized) {
        result.errors.push({
          courtName: court.name,
          fieldKey: 'openingHours',
          error: hoursValidation.error || 'Invalid opening hours',
        });
        continue;
      }

      // Validate URL
      const urlValidation = VerifiedInfoValidator.validateSourceUrl(meta.officialWebsite || meta.sourceUrl);
      if (!urlValidation.valid) {
        result.errors.push({
          courtName: court.name,
          fieldKey: 'officialWebsite',
          error: urlValidation.error || 'Invalid official website URL',
        });
        continue;
      }

      const now = new Date();
      const nextCheck = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

      const fieldEntries: Array<{ fieldKey: string; value: any }> = [
        { fieldKey: 'officialWebsite', value: meta.officialWebsite || meta.sourceUrl },
        { fieldKey: 'officialPhone', value: court.phone },
        { fieldKey: 'officialEmail', value: court.email },
        { fieldKey: 'dataBoxId', value: meta.dataBoxId },
        { fieldKey: 'openingHours', value: hoursValidation.normalized },
        { fieldKey: 'appointmentRequired', value: false },
        { fieldKey: 'submissionMethods', value: meta.submissionMethods },
        { fieldKey: 'accessibility', value: meta.accessibility },
      ];

      // Upsert sources in DB
      for (const field of fieldEntries) {
        const extractedValueStr = typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value);

        const existingSource = await prismaClient.subjectInformationSource.findFirst({
          where: {
            subjektId: subject.id,
            fieldKey: field.fieldKey,
          },
        });

        if (existingSource) {
          await prismaClient.subjectInformationSource.update({
            where: { id: existingSource.id },
            data: {
              sourceUrl: meta.sourceUrl,
              sourceLevel: meta.sourceTrustLevel,
              extractedValue: extractedValueStr,
              status: 'VERIFIED',
              reviewedById: systemUser.id,
              reviewedAt: now,
              fetchedAt: now,
            },
          });
          result.sourcesUpdated++;
        } else {
          await prismaClient.subjectInformationSource.create({
            data: {
              subjektId: subject.id,
              fieldKey: field.fieldKey,
              extractedValue: extractedValueStr,
              sourceUrl: meta.sourceUrl,
              sourceLevel: meta.sourceTrustLevel,
              extractionMethod: 'OFFICIAL_DATASET_INGESTION',
              status: 'VERIFIED',
              createdById: systemUser.id,
              reviewedById: systemUser.id,
              reviewedAt: now,
              fetchedAt: now,
            },
          });
          result.sourcesCreated++;
        }
      }

      // Upsert profile in DB
      const existingProfile = await prismaClient.subjectVerifiedProfile.findUnique({
        where: { subjektId: subject.id },
      });

      const profileData = {
        officialWebsite: meta.officialWebsite || meta.sourceUrl,
        officialPhone: court.phone,
        officialEmail: court.email,
        dataBoxId: meta.dataBoxId,
        openingHours: JSON.stringify(hoursValidation.normalized),
        appointmentRequired: false,
        bookingUrl: null,
        submissionMethods: meta.submissionMethods,
        accessibility: meta.accessibility,
        status: 'VERIFIED' as const,
        staleAfterDays: 180,
        verifiedAt: now,
        verifiedById: systemUser.id,
        lastCheckedAt: now,
        nextCheckAt: nextCheck,
      };

      if (existingProfile) {
        await prismaClient.subjectVerifiedProfile.update({
          where: { id: existingProfile.id },
          data: profileData,
        });
        result.profilesUpdated++;
      } else {
        await prismaClient.subjectVerifiedProfile.create({
          data: {
            subjektId: subject.id,
            ...profileData,
          },
        });
        result.profilesCreated++;
      }

      // Ensure GPS is up-to-date
      if ((subject.lat == null || subject.lng == null) && court.lat != null && court.lng != null) {
        await prismaClient.subjekt.update({
          where: { id: subject.id },
          data: {
            lat: court.lat,
            lng: court.lng,
          },
        });
      }

      result.verifiedCount++;
    }

    result.durationMs = Date.now() - startTime;

    await AuditService.recordLog(
      'POPULATE_PIPELINE',
      'SUBJECT_VERIFIED_INFO',
      `Soudy Population Pipeline executed in PostgreSQL. Processed: ${result.totalProcessed}, Verified: ${result.verifiedCount}, Sources Created/Updated: ${result.sourcesCreated}/${result.sourcesUpdated}`,
      systemUser as any
    );

    // Also sync in-memory store so runtime consistency is maintained
    await this.populateInMemory();

    return result;
  }
}
