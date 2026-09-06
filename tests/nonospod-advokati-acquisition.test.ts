import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CakAcquisitionPipeline } from '../src/services/dataPipeline/cakAcquisitionPipeline';
import { cakAdvokatiDataset } from '../src/data/cakAdvokatiDataset';
import { nonOspodSubjekty } from '../src/data/nonOspodSubjekty';
import { SubjectVerifiedInfoService } from '../src/services/subjectVerifiedInfoService';
import { VerifiedInfoValidator } from '../src/services/verifiedInfoValidator';
import { toPublicSubjektDto } from '../src/services/subjektService';
import { dbStore } from '../src/services/dbStore';
import { User } from '../src/types';

describe('MASTER-IMPLEMENT-07C-2: ČAK Official Acquisition Pipeline & Four-Eyes Verification', () => {
  const submitterUser: User = {
    id: 'usr-pipeline-submitter',
    email: 'crawler-submitter@tatamapravo.cz',
    name: 'ČAK Sync Bot',
    role: 'ADMIN',
  };

  const moderatorUser: User = {
    id: 'usr-pipeline-moderator',
    email: 'moderator@tatamapravo.cz',
    name: 'Independent Moderator',
    role: 'MODERATOR',
  };

  const regularUser: User = {
    id: 'usr-regular-user',
    email: 'user@example.com',
    name: 'Regular User',
    role: 'USER',
  };

  beforeEach(() => {
    // Ensure dbStore has target non-OSPOD subjects
    for (const nos of nonOspodSubjekty) {
      if (!dbStore.subjekty.some((s) => s.id === nos.id)) {
        dbStore.subjekty.push({ ...nos } as any);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 1. TARGET IDS & DATASET INTEGRITY (Tests 1-5)
  // --------------------------------------------------------------------------
  describe('1. Target IDs & Dataset Integrity', () => {
    test('1. Exact 14 target ADVOKAT IDs are defined in the pipeline', () => {
      assert.strictEqual(CakAcquisitionPipeline.TARGET_SUBJECT_IDS.length, 14);
      const expectedIds = [
        'subj-nonospod-110', 'subj-nonospod-113', 'subj-nonospod-116', 'subj-nonospod-119',
        'subj-nonospod-122', 'subj-nonospod-125', 'subj-nonospod-128', 'subj-nonospod-131',
        'subj-nonospod-134', 'subj-nonospod-137', 'subj-nonospod-140', 'subj-nonospod-143',
        'subj-nonospod-146', 'subj-nonospod-150',
      ];
      assert.deepStrictEqual([...CakAcquisitionPipeline.TARGET_SUBJECT_IDS], expectedIds);
    });

    test('2. All 14 target IDs exist in dbStore.subjekty and have type ADVOKAT', () => {
      for (const id of CakAcquisitionPipeline.TARGET_SUBJECT_IDS) {
        const found = dbStore.subjekty.find((s) => s.id === id);
        assert.ok(found, `Subjekt ${id} must exist in dbStore.subjekty`);
        assert.strictEqual(found.type, 'ADVOKAT', `Subjekt ${id} must be of type ADVOKAT`);
      }
    });

    test('3. ČAK dataset contains exactly 14 records matching the target IDs', () => {
      assert.strictEqual(cakAdvokatiDataset.length, 14);
      const datasetIds = cakAdvokatiDataset.map((r) => r.subjektId);
      for (const targetId of CakAcquisitionPipeline.TARGET_SUBJECT_IDS) {
        assert.ok(datasetIds.includes(targetId), `Dataset must contain target ID ${targetId}`);
      }
    });

    test('4. All ČAK dataset records have valid ČAK registration numbers', () => {
      for (const record of cakAdvokatiDataset) {
        assert.ok(
          /^\d{4,6}$/.test(record.cakEvidencniCislo),
          `Invalid ČAK registration number for ${record.subjektId}: ${record.cakEvidencniCislo}`
        );
      }
    });

    test('5. All ČAK dataset records have valid 8-digit IČO', () => {
      for (const record of cakAdvokatiDataset) {
        assert.ok(
          /^\d{8}$/.test(record.ico),
          `Invalid IČO for ${record.subjektId}: ${record.ico}`
        );
      }
    });
  });

  // --------------------------------------------------------------------------
  // 2. CONTACTS, URLS & OPENING HOURS VALIDITY (Tests 6-11)
  // --------------------------------------------------------------------------
  describe('2. Contacts, URLs, DataBoxes & Opening Hours Validity', () => {
    test('6. All ČAK dataset records have valid Czech phone format (+420...)', () => {
      for (const record of cakAdvokatiDataset) {
        const val = VerifiedInfoValidator.validatePhone(record.officialPhone);
        assert.strictEqual(val.valid, true, `Phone invalid for ${record.subjektId}: ${val.error}`);
        assert.ok(record.officialPhone.startsWith('+420'));
      }
    });

    test('7. All ČAK dataset records have valid email addresses', () => {
      for (const record of cakAdvokatiDataset) {
        const val = VerifiedInfoValidator.validateEmail(record.officialEmail);
        assert.strictEqual(val.valid, true, `Email invalid for ${record.subjektId}: ${val.error}`);
      }
    });

    test('8. All ČAK dataset source URLs point to official https://vyhledavac.cak.cz/', () => {
      for (const record of cakAdvokatiDataset) {
        assert.ok(
          record.sourceUrl.startsWith('https://vyhledavac.cak.cz/'),
          `Source URL must start with https://vyhledavac.cak.cz/ for ${record.subjektId}`
        );
        const urlVal = VerifiedInfoValidator.validateSourceUrl(record.sourceUrl);
        assert.strictEqual(urlVal.valid, true);
      }
    });

    test('9. All ČAK dataset records have trust level P2_PUBLIC_STATE_REGISTRY', () => {
      for (const record of cakAdvokatiDataset) {
        assert.strictEqual(record.sourceTrustLevel, 'P2_PUBLIC_STATE_REGISTRY');
      }
    });

    test('10. All ČAK dataset records have valid 7-character DataBox IDs', () => {
      for (const record of cakAdvokatiDataset) {
        const val = VerifiedInfoValidator.validateDataBoxId(record.dataBoxId);
        assert.strictEqual(val.valid, true, `DataBox ID invalid for ${record.subjektId}: ${val.error}`);
        assert.strictEqual(record.dataBoxId.length, 7);
      }
    });

    test('11. All ČAK dataset records have valid WeeklyOpeningHours objects', () => {
      for (const record of cakAdvokatiDataset) {
        const val = VerifiedInfoValidator.validateOpeningHours(record.openingHours);
        assert.strictEqual(val.valid, true, `Opening hours invalid for ${record.subjektId}: ${val.error}`);
        assert.strictEqual(record.openingHours.monday.isOpen, true);
        assert.strictEqual(record.openingHours.saturday.isOpen, false);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. PIPELINE VALIDATOR & SECURITY GUARDS (Tests 12-16)
  // --------------------------------------------------------------------------
  describe('3. Pipeline Validator & Security Guards', () => {
    test('12. Validator catches invalid phone format', () => {
      const copy = { ...cakAdvokatiDataset[0], officialPhone: '12345' };
      const val = CakAcquisitionPipeline.validateAdvokatRecord(copy);
      assert.strictEqual(val.valid, false);
      assert.ok(val.errors.some((e) => e.includes('telefon')));
    });

    test('13. Validator catches invalid email format', () => {
      const copy = { ...cakAdvokatiDataset[0], officialEmail: 'not-an-email' };
      const val = CakAcquisitionPipeline.validateAdvokatRecord(copy);
      assert.strictEqual(val.valid, false);
      assert.ok(val.errors.some((e) => e.includes('email')));
    });

    test('14. Validator catches invalid DataBox ID', () => {
      const copy = { ...cakAdvokatiDataset[0], dataBoxId: '12' }; // Too short
      const val = CakAcquisitionPipeline.validateAdvokatRecord(copy);
      assert.strictEqual(val.valid, false);
      assert.ok(val.errors.some((e) => e.includes('datové schránky')));
    });

    test('15. Validator catches invalid source URL (SSRF protection / invalid protocol)', () => {
      const copy = { ...cakAdvokatiDataset[0], sourceUrl: 'http://169.254.169.254/latest/meta-data' };
      const val = CakAcquisitionPipeline.validateAdvokatRecord(copy);
      assert.strictEqual(val.valid, false);
      assert.ok(val.errors.some((e) => e.includes('URL')));
    });

    test('16. Validator catches invalid opening hours', () => {
      const copy = { ...cakAdvokatiDataset[0], openingHours: { monday: { isOpen: true, intervals: [{ from: '99:00', to: '17:00' }] } } as any };
      const val = CakAcquisitionPipeline.validateAdvokatRecord(copy);
      assert.strictEqual(val.valid, false);
      assert.ok(val.errors.some((e) => e.includes('otevírací doba')));
    });
  });

  // --------------------------------------------------------------------------
  // 4. PROPOSAL INGESTION & FOUR-EYES ENFORCEMENT (Tests 17-22)
  // --------------------------------------------------------------------------
  describe('4. Proposal Ingestion & Four-Eyes Enforcement', () => {
    test('17. Ingestion sets status strictly to PENDING_REVIEW (never directly VERIFIED)', async () => {
      const res = await CakAcquisitionPipeline.submitAdvokatProposals('subj-nonospod-110', submitterUser);
      assert.strictEqual(res.success, true);
      assert.ok(res.proposals.length >= 7);

      for (const p of res.proposals) {
        assert.strictEqual(p.status, 'PENDING_REVIEW');
        assert.strictEqual(p.subjektId, 'subj-nonospod-110');
      }
    });

    test('18. Ingestion proposal accurately records the submitter createdById', async () => {
      const res = await CakAcquisitionPipeline.submitAdvokatProposals('subj-nonospod-113', submitterUser);
      assert.strictEqual(res.success, true);
      for (const p of res.proposals) {
        assert.strictEqual(p.createdById, submitterUser.id);
      }
    });

    test('19. Four-Eyes Principle: Submitter CANNOT approve their own proposal (fails with 403 / error)', async () => {
      const res = await CakAcquisitionPipeline.submitAdvokatProposals('subj-nonospod-116', submitterUser);
      assert.strictEqual(res.success, true);

      // Attempt self-approval by submitterUser
      const revRes = await CakAcquisitionPipeline.reviewAdvokatProposals('subj-nonospod-116', submitterUser, 'APPROVE');
      assert.strictEqual(revRes.success, false);
      assert.ok(
        revRes.errors?.some((e) => e.includes('Nemůžete moderovat vlastní návrh') || e.includes('oprávnění')),
        'Must reject self-approval'
      );
    });

    test('20. Unauthorized user (role USER) cannot moderate or review proposals', async () => {
      await CakAcquisitionPipeline.submitAdvokatProposals('subj-nonospod-119', submitterUser);
      const revRes = await CakAcquisitionPipeline.reviewAdvokatProposals('subj-nonospod-119', regularUser, 'APPROVE');
      assert.strictEqual(revRes.success, false);
      assert.ok(revRes.errors?.some((e) => e.includes('Nemáte oprávnění')));
    });

    test('21. Independent moderator (MODERATOR !== submitter) successfully approves proposal to VERIFIED', async () => {
      await CakAcquisitionPipeline.submitAdvokatProposals('subj-nonospod-122', submitterUser);
      const revRes = await CakAcquisitionPipeline.reviewAdvokatProposals('subj-nonospod-122', moderatorUser, 'APPROVE');
      assert.strictEqual(revRes.success, true);
      assert.ok(revRes.reviewedSources.length > 0);
      for (const src of revRes.reviewedSources) {
        assert.strictEqual(src.status, 'VERIFIED');
      }
      assert.ok(revRes.profile);
      assert.strictEqual(revRes.profile.status, 'VERIFIED');
    });

    test('22. Rejection of proposal transitions status to REJECTED with recorded reason', async () => {
      await CakAcquisitionPipeline.submitAdvokatProposals('subj-nonospod-125', submitterUser);
      const revRes = await CakAcquisitionPipeline.reviewAdvokatProposals(
        'subj-nonospod-125',
        moderatorUser,
        'REJECT',
        'Nesprávné telefonní číslo v záznamu'
      );
      assert.strictEqual(revRes.success, true);
      for (const src of revRes.reviewedSources) {
        assert.strictEqual(src.status, 'REJECTED');
        assert.strictEqual(src.rejectionReason, 'Nesprávné telefonní číslo v záznamu');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. FULL PIPELINE EXECUTION & PUBLIC DTO PARITY (Tests 23-24)
  // --------------------------------------------------------------------------
  describe('5. Full Pipeline Execution & Public DTO Parity', () => {
    test('23. Full pipeline execution on all 14 target ADVOKAT subjects creates VERIFIED profiles', async () => {
      const report = await CakAcquisitionPipeline.runFullPipeline(submitterUser, moderatorUser);

      assert.strictEqual(report.totalTargetSubjects, 14);
      assert.strictEqual(report.processedCount, 14);
      assert.strictEqual(report.successCount, 14);
      assert.strictEqual(report.failureCount, 0);
      assert.strictEqual(report.verifiedProfilesCreated, 14);
      assert.ok(report.proposalsSubmitted >= 14 * 7);
      assert.ok(report.proposalsApproved >= 14 * 7);

      for (const item of report.subjectDetails) {
        assert.strictEqual(item.status, 'VERIFIED');
        assert.ok(item.proposalsCount >= 7);
      }
    });

    test('24. toPublicSubjektDto() outputs verifiedProfile with status VERIFIED for approved advocates', async () => {
      const subject = dbStore.subjekty.find((s) => s.id === 'subj-nonospod-110');
      assert.ok(subject);

      const verifiedProfile = await SubjectVerifiedInfoService.getVerifiedProfile('subj-nonospod-110');
      assert.ok(verifiedProfile);
      assert.strictEqual(verifiedProfile.status, 'VERIFIED');

      const dto = toPublicSubjektDto({ ...subject, verifiedProfile });
      assert.ok(dto.verifiedProfile);
      assert.strictEqual(dto.verifiedProfile.status, 'VERIFIED');
      assert.strictEqual(dto.verifiedProfile.officialPhone, '+420 224 210 501');
      assert.strictEqual(dto.verifiedProfile.officialEmail, 'tomas.novotny@ak-novotny.cz');
      assert.strictEqual(dto.verifiedProfile.dataBoxId, 'h9v3k2q');
      assert.strictEqual(dto.verifiedProfile.appointmentRequired, true);
    });
  });
});
