import { describe, it } from 'node:test';
import assert from 'node:assert';
import { dbStore } from '../src/services/dbStore';
import { SoudyPopulationPipeline } from '../src/services/dataPipeline/soudyPopulationPipeline';
import { soudyDataset } from '../src/data/soudyDataset';
import { subjektService, toPublicSubjektDto } from '../src/services/subjektService';
import { VerifiedInfoValidator } from '../src/services/verifiedInfoValidator';
import {
  isSubjectAccessible,
  isSubjectNoAppointmentNeeded,
  matchesAdvancedFilters,
} from '../src/utils/mapFilters';

describe('MASTER-IMPLEMENT-07A: Verified Data Population Pipeline / Soudy ČR', () => {
  it('1. Pipeline Execution & Full 107 Courts Population', async () => {
    // Reset store data to ensure clean state
    dbStore.subjectVerifiedProfiles = [];
    dbStore.subjectInformationSources = [];

    assert.strictEqual(dbStore.subjectVerifiedProfiles.length, 0);
    assert.strictEqual(dbStore.subjectInformationSources.length, 0);

    const result = await SoudyPopulationPipeline.populateInMemory(dbStore);

    assert.strictEqual(result.totalProcessed, 107);
    assert.strictEqual(result.verifiedCount, 107);
    assert.strictEqual(result.profilesCreated, 107);
    assert.strictEqual(result.profilesUpdated, 0);
    assert.strictEqual(result.sourcesCreated, 856); // 107 * 8 fields
    assert.strictEqual(result.skippedCount, 0);
    assert.strictEqual(result.errors.length, 0);

    assert.strictEqual(dbStore.subjectVerifiedProfiles.length, 107);
    assert.strictEqual(dbStore.subjectInformationSources.length, 856);
  });

  it('2. Provenance Integrity & Field Validation', () => {
    const courtsInStore = dbStore.subjekty.filter(s => s.type === 'SOUD');
    assert.strictEqual(courtsInStore.length, 107);

    for (const court of courtsInStore) {
      const profile = dbStore.subjectVerifiedProfiles.find(p => p.subjektId === court.id);
      assert.ok(profile, `Profile must exist for court: ${court.name}`);
      assert.strictEqual(profile.status, 'VERIFIED');
      assert.strictEqual(profile.appointmentRequired, false);
      assert.ok(profile.officialEmail, `Court email must exist for: ${court.name}`);
      assert.ok(profile.officialPhone, `Court phone must exist for: ${court.name}`);
      assert.ok(profile.dataBoxId, `DataBox ID must exist for: ${court.name}`);
      assert.ok(profile.submissionMethods, `Submission methods must exist for: ${court.name}`);
      assert.ok(profile.accessibility, `Accessibility text must exist for: ${court.name}`);
      assert.ok(profile.verifiedAt, `verifiedAt must exist for: ${court.name}`);
      assert.strictEqual(profile.verifiedById, 'system-pipeline-admin');

      // Check opening hours
      const openingHours = profile.openingHours;
      const hoursValidation = VerifiedInfoValidator.validateWeeklyOpeningHours(openingHours);
      assert.strictEqual(hoursValidation.valid, true, `Opening hours must be valid for ${court.name}`);

      // Check URL
      const urlValidation = VerifiedInfoValidator.validateSourceUrl(profile.officialWebsite || '');
      assert.strictEqual(urlValidation.valid, true, `Official website URL must be valid for ${court.name}`);

      // Check sources (8 provenance records per court)
      const sources = dbStore.subjectInformationSources.filter(s => s.subjektId === court.id);
      assert.strictEqual(sources.length, 8, `Court ${court.name} must have exactly 8 provenance sources`);

      const fieldKeys = sources.map(s => s.fieldKey);
      assert.ok(fieldKeys.includes('officialWebsite'));
      assert.ok(fieldKeys.includes('officialPhone'));
      assert.ok(fieldKeys.includes('officialEmail'));
      assert.ok(fieldKeys.includes('dataBoxId'));
      assert.ok(fieldKeys.includes('openingHours'));
      assert.ok(fieldKeys.includes('appointmentRequired'));
      assert.ok(fieldKeys.includes('submissionMethods'));
      assert.ok(fieldKeys.includes('accessibility'));

      for (const src of sources) {
        assert.strictEqual(src.status, 'VERIFIED');
        assert.ok(src.sourceUrl.startsWith('https://'), `Source URL must be https: ${src.sourceUrl}`);
        assert.ok(src.sourceLevel === 'P0_OFFICIAL_SUBJECT_WEB' || src.sourceLevel === 'P2_PUBLIC_STATE_REGISTRY');
        assert.ok(src.fetchedAt, 'fetchedAt must be set');
        assert.strictEqual(src.reviewedById, 'system-pipeline-admin');
      }
    }
  });

  it('3. Idempotency & Safe Deduplication', async () => {
    const initialProfilesCount = dbStore.subjectVerifiedProfiles.length;
    const initialSourcesCount = dbStore.subjectInformationSources.length;

    // Run pipeline a second time
    const result2 = await SoudyPopulationPipeline.populateInMemory(dbStore);

    assert.strictEqual(result2.totalProcessed, 107);
    assert.strictEqual(result2.verifiedCount, 107);
    assert.strictEqual(result2.profilesCreated, 0, 'No new profiles should be created on second run');
    assert.strictEqual(result2.profilesUpdated, 107, 'All 107 profiles should be updated');
    assert.strictEqual(result2.sourcesCreated, 0, 'No new sources should be created on second run');
    assert.strictEqual(result2.sourcesUpdated, 856, 'All 856 sources should be updated');
    assert.strictEqual(result2.errors.length, 0);

    assert.strictEqual(dbStore.subjectVerifiedProfiles.length, initialProfilesCount);
    assert.strictEqual(dbStore.subjectInformationSources.length, initialSourcesCount);
  });

  it('4. Public DTO Sanitization & Security Boundary', async () => {
    const publicSubjekty = await subjektService.getSubjekty({ type: 'SOUD', status: 'VERIFIED' });
    assert.strictEqual(publicSubjekty.length, 107);

    for (const item of publicSubjekty) {
      const sanitized = toPublicSubjektDto(item, false);
      assert.ok(sanitized.verifiedProfile, `Verified profile must be attached to ${sanitized.name}`);
      assert.strictEqual(sanitized.verifiedProfile.status, 'VERIFIED');
      assert.strictEqual((sanitized.verifiedProfile as any).verifiedById, undefined, 'verifiedById must not leak');
      assert.strictEqual((sanitized.verifiedProfile as any).createdById, undefined, 'createdById must not leak');
      assert.strictEqual((sanitized.verifiedProfile as any).reviewedById, undefined, 'reviewedById must not leak');
      assert.strictEqual((sanitized.verifiedProfile as any).informationSources, undefined, 'internal sources must not leak');
      assert.ok(typeof sanitized.verifiedProfile.openingHours === 'object', 'openingHours must be parsed object');
    }
  });

  it('5. Map Advanced Filters Integration', async () => {
    const publicSubjekty = await subjektService.getSubjekty({ type: 'SOUD', status: 'VERIFIED' });
    const dtoList = publicSubjekty.map(s => toPublicSubjektDto(s, false));

    // Filter 1: Pouze bezbariérové
    const filteredAccessibility = dtoList.filter(s => isSubjectAccessible(s as any));
    assert.strictEqual(filteredAccessibility.length, 107, 'All 107 courts must pass accessibility filter');

    // Filter 2: Bez nutnosti objednání
    const filteredAppointment = dtoList.filter(s => isSubjectNoAppointmentNeeded(s as any));
    assert.strictEqual(filteredAppointment.length, 107, 'All 107 courts must pass no-appointment filter');

    // Filter 3: Combined filters
    const filteredCombined = dtoList.filter(s =>
      matchesAdvancedFilters(s as any, {
        onlyAccessible: true,
        noAppointmentNeeded: true,
      })
    );
    assert.strictEqual(filteredCombined.length, 107, 'All 107 courts must pass combined filters');
  });

  it('6. Audit Logging Verification', () => {
    const auditLogs = dbStore.auditLogs.filter(
      l => l.action === 'POPULATE_PIPELINE' && l.module === 'SUBJECT_VERIFIED_INFO'
    );
    assert.ok(auditLogs.length > 0, 'Audit log entry must be recorded for pipeline execution');
    assert.ok(auditLogs[0].details.includes('Soudy Population Pipeline executed'));
  });
});
