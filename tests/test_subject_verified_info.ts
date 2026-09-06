import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { VerifiedInfoValidator } from '../src/services/verifiedInfoValidator';
import { SubjectVerifiedInfoService } from '../src/services/subjectVerifiedInfoService';
import { toPublicSubjektDto } from '../src/services/subjektService';
import { dbStore } from '../src/services/dbStore';
import { User, WeeklyOpeningHours } from '../src/types';

describe('FAZE P0 — Systém ověřených informací o subjektech: Security, Validation & Audit Test Suite', () => {

  const sampleValidWeeklyHours: WeeklyOpeningHours = {
    monday: {
      isOpen: true,
      intervals: [
        { from: '08:00', to: '12:00', type: 'STANDARD' },
        { from: '13:00', to: '17:00', type: 'APPOINTMENT_ONLY' },
      ],
      note: 'Dopoledne bez objednání, odpoledne pro objednané',
    },
    tuesday: {
      isOpen: false,
      intervals: [],
    },
    wednesday: {
      isOpen: true,
      intervals: [
        { from: '08:00', to: '17:00', type: 'STANDARD' },
      ],
    },
    thursday: {
      isOpen: false,
      intervals: [],
    },
    friday: {
      isOpen: true,
      intervals: [
        { from: '08:00', to: '12:00', type: 'FILING_OFFICE' },
      ],
      note: 'Pouze podatelna',
    },
    saturday: {
      isOpen: false,
      intervals: [],
    },
    sunday: {
      isOpen: false,
      intervals: [],
    },
    irregularScheduleNote: 'O státních svátcích zavřeno.',
  };

  const adminUser: User = {
    id: 'usr-admin-p0',
    email: 'admin@tatamapravo.cz',
    name: 'Admin Ověřovatel',
    role: 'ADMIN',
    active: true,
    isSuperAdmin: false,
    permissions: [],
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const normalUser: User = {
    id: 'usr-citizen-p0',
    email: 'obcan@example.cz',
    name: 'Běžný Uživatel',
    role: 'USER',
    active: true,
    isSuperAdmin: false,
    permissions: [],
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const moderatorUser: User = {
    id: 'usr-mod-p1',
    email: 'moderator@tatamapravo.cz',
    name: 'Moderátor Testovací',
    role: 'MODERATOR',
    active: true,
    isSuperAdmin: false,
    permissions: [],
    twoFactorEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('1. Validace úředních hodin: korektní týdenní rozvrh projde validací', () => {
    const res = VerifiedInfoValidator.validateWeeklyOpeningHours(sampleValidWeeklyHours);
    assert.equal(res.valid, true, 'Validní rozvrh musí projít');
    assert.ok(res.normalized, 'Musí vrátit normalizovaný objekt');
    assert.equal(res.normalized?.monday.isOpen, true);
    assert.equal(res.normalized?.monday.intervals.length, 2);
    assert.equal(res.normalized?.tuesday.isOpen, false);
  });

  test('2. Validace formátu času: odmítnutí neplatných časových řetězců', () => {
    assert.equal(VerifiedInfoValidator.validateTimeFormat('08:00'), true);
    assert.equal(VerifiedInfoValidator.validateTimeFormat('23:59'), true);
    assert.equal(VerifiedInfoValidator.validateTimeFormat('00:00'), true);
    
    // Neplatné časy
    assert.equal(VerifiedInfoValidator.validateTimeFormat('24:00'), false);
    assert.equal(VerifiedInfoValidator.validateTimeFormat('8:00'), false);
    assert.equal(VerifiedInfoValidator.validateTimeFormat('12:60'), false);
    assert.equal(VerifiedInfoValidator.validateTimeFormat('abc'), false);
    assert.equal(VerifiedInfoValidator.validateTimeFormat(''), false);
  });

  test('3. Validace intervalů: odmítnutí obrácených nebo stejných časů (od >= do)', () => {
    const invRes = VerifiedInfoValidator.validateInterval('16:00', '08:00');
    assert.equal(invRes.valid, false, 'Invertovaný interval musí selhat');

    const equalRes = VerifiedInfoValidator.validateInterval('12:00', '12:00');
    assert.equal(equalRes.valid, false, 'Interval se stejným začátkem i koncem musí selhat');
  });

  test('4. Validace překryvu: intervaly v jednom dni se nesmí překrývat', () => {
    const overlappingDay = {
      isOpen: true,
      intervals: [
        { from: '08:00', to: '12:00', type: 'STANDARD' },
        { from: '11:00', to: '14:00', type: 'STANDARD' },
      ],
    };

    const res = VerifiedInfoValidator.validateDayOpeningHours(overlappingDay, 'pondělí');
    assert.equal(res.valid, false, 'Překrývající se intervaly musí být odmítnuty');
    assert.match(res.error || '', /překrývat/i);
  });

  test('5. SSRF ochrana URL zdroje: odmítnutí localhost, privátních IP a neplatných protokolů', () => {
    // Bezpečné veřejné URL
    assert.equal(VerifiedInfoValidator.validateSourceUrl('https://justice.cz/soud-praha').valid, true);
    assert.equal(VerifiedInfoValidator.validateSourceUrl('https://www.mpsv.cz/web/cz/ospod').valid, true);

    // SSRF pokusy
    assert.equal(VerifiedInfoValidator.validateSourceUrl('http://localhost:3000/api/keys').valid, false);
    assert.equal(VerifiedInfoValidator.validateSourceUrl('http://127.0.0.1:5432').valid, false);
    assert.equal(VerifiedInfoValidator.validateSourceUrl('http://10.0.0.5/internal').valid, false);
    assert.equal(VerifiedInfoValidator.validateSourceUrl('http://192.168.1.1').valid, false);
    assert.equal(VerifiedInfoValidator.validateSourceUrl('file:///etc/passwd').valid, false);
    assert.equal(VerifiedInfoValidator.validateSourceUrl('javascript:alert(1)').valid, false);
  });

  test('6. Sanitizace textu: odstranění nebezpečných skriptů a HTML tagů', () => {
    const malicious = '<script>alert("XSS")</script>Úřední hodiny pro veřejnost <b>Po-Pá</b>';
    const sanitized = VerifiedInfoValidator.sanitizeText(malicious);
    assert.equal(sanitized.includes('<script>'), false, 'Skript tag musí být odstraněn');
    assert.equal(sanitized.includes('<b>'), false, 'HTML tagy musí být odstraněny');
    assert.equal(sanitized.includes('Úřední hodiny pro veřejnost Po-Pá'), true);
  });

  test('7. P0 Bezpečnost návrhu zdroje: stav je VŽDY vynucen na PENDING_REVIEW', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';

    const proposal = await SubjectVerifiedInfoService.submitSourceProposal(
      {
        subjektId: subjId,
        sourceUrl: 'https://www.justice.cz/os-praha-1',
        fieldKey: 'officialPhone',
        extractedValue: '+420 221 123 456',
        evidenceSnippet: 'Oficiální kontakt z webu soudu',
        sourceLevel: 'P0_OFFICIAL_SUBJECT_WEB',
      },
      normalUser
    );

    assert.ok(proposal.id, 'Musí vytvořit záznam');
    assert.equal(proposal.status, 'PENDING_REVIEW', 'Nový návrh MUSÍ mít status PENDING_REVIEW');
    assert.equal(proposal.fieldKey, 'officialPhone');
  });

  test('8. Autorizace moderace: běžný uživatel NEMŮŽE schvalovat ani zamítat návrhy', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';
    const proposal = await SubjectVerifiedInfoService.submitSourceProposal(
      {
        subjektId: subjId,
        sourceUrl: 'https://www.justice.cz/os-praha-1',
        fieldKey: 'officialEmail',
        extractedValue: 'posta@osoud.pha1.justice.cz',
      },
      normalUser
    );

    await assert.rejects(
      async () => {
        await SubjectVerifiedInfoService.reviewSourceProposal(proposal.id, { decision: 'APPROVE' }, normalUser);
      },
      /oprávnění|Neautorizovaný/i,
      'Běžný uživatel nesmí schválit návrh'
    );
  });

  test('9. Schválení moderátorem/adminem: aktualizuje zdroj na VERIFIED a promítne se do SubjectVerifiedProfile', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';
    const proposal = await SubjectVerifiedInfoService.submitSourceProposal(
      {
        subjektId: subjId,
        sourceUrl: 'https://www.justice.cz/os-praha-1',
        fieldKey: 'openingHours',
        extractedValue: JSON.stringify(sampleValidWeeklyHours),
        evidenceSnippet: 'Úřední hodiny podatelny z webu soudu',
      },
      normalUser
    );

    const reviewRes = await SubjectVerifiedInfoService.reviewSourceProposal(
      proposal.id,
      { decision: 'APPROVE' },
      adminUser
    );

    assert.equal(reviewRes.source.status, 'VERIFIED');
    assert.equal(reviewRes.source.reviewedById, adminUser.id);
    assert.ok(reviewRes.profile, 'Musí vrátit aktualizovaný profil');
    assert.equal(reviewRes.profile?.status, 'VERIFIED');
    assert.equal(reviewRes.profile?.subjektId, subjId);
    assert.ok(reviewRes.profile?.openingHours, 'Profil musí obsahovat úřední hodiny');
    assert.equal(reviewRes.profile?.openingHours?.monday.isOpen, true);
  });

  test('10. Zamítnutí moderátorem: nastaví status REJECTED a uloží důvod', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';
    const proposal = await SubjectVerifiedInfoService.submitSourceProposal(
      {
        subjektId: subjId,
        sourceUrl: 'https://www.unverified-blog.cz/info',
        fieldKey: 'officialPhone',
        extractedValue: '123456789',
      },
      normalUser
    );

    const rejectRes = await SubjectVerifiedInfoService.reviewSourceProposal(
      proposal.id,
      { decision: 'REJECT', rejectionReason: 'Neověřitelný soukromý blog' },
      adminUser
    );

    assert.equal(rejectRes.source.status, 'REJECTED');
    assert.equal(rejectRes.source.rejectionReason, 'Neověřitelný soukromý blog');
  });

  test('11. Přímá úprava administrátorem: updateVerifiedProfileDirect správně uloží profil s auditem', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';

    const profile = await SubjectVerifiedInfoService.updateVerifiedProfileDirect(
      subjId,
      {
        officialWebsite: 'https://www.justice.cz/soud-praha',
        officialPhone: '+420 222 333 444',
        officialEmail: 'info@soud.cz',
        appointmentRequired: true,
        accessibility: 'Bezbariérový přístup s výtahem v budově B',
        dataBoxId: 'abc1234',
        staleAfterDays: 180,
      },
      adminUser
    );

    assert.equal(profile.subjektId, subjId);
    assert.equal(profile.officialWebsite, 'https://www.justice.cz/soud-praha');
    assert.equal(profile.officialPhone, '+420 222 333 444');
    assert.equal(profile.appointmentRequired, true);
    assert.equal(profile.accessibility, 'Bezbariérový přístup s výtahem v budově B');
    assert.equal(profile.dataBoxId, 'abc1234');
    assert.equal(profile.status, 'VERIFIED');
  });

  test('12. Sanitizace pro veřejný DTO: toPublicSubjektDto ořezává interní auditní pole', () => {
    const rawSubjekt = {
      id: 'subj-test-1',
      name: 'Testovací Soud',
      city: 'Praha',
      createdById: 'usr-creator-hidden',
      verifiedById: 'usr-verifier-hidden',
      rejectionReason: 'hidden reason',
      verifiedProfile: {
        id: 'prof-1',
        subjektId: 'subj-test-1',
        officialPhone: '+420 111 222 333',
        verifiedById: 'usr-verifier-hidden',
        status: 'VERIFIED',
      },
    };

    const publicDto = toPublicSubjektDto(rawSubjekt, false);
    assert.equal(publicDto.createdById, undefined, 'createdById nesmí být ve veřejném DTO');
    assert.equal(publicDto.verifiedById, undefined, 'verifiedById nesmí být ve veřejném DTO');
    assert.equal(publicDto.rejectionReason, undefined, 'rejectionReason nesmí být ve veřejném DTO');
    assert.ok(publicDto.verifiedProfile, 'verifiedProfile zůstává pro veřejnost');
    assert.equal(publicDto.verifiedProfile.officialPhone, '+420 111 222 333');
    assert.equal(publicDto.verifiedProfile.verifiedById, undefined, 'verifiedProfile.verifiedById nesmí opustit server');
  });

  test('13. Detekce zastaralých profilů (STALE): profily po expiraci jsou označeny jako STALE', async () => {
    const expiredProfile = {
      id: 'prof-expired-1',
      subjektId: 'subj-expired-1',
      appointmentRequired: false,
      status: 'VERIFIED' as const,
      staleAfterDays: 180,
      lastCheckedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      nextCheckAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days in the past
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.subjectVerifiedProfiles.push(expiredProfile);

    const checkRes = await SubjectVerifiedInfoService.checkStaleProfiles();
    assert.ok(checkRes.staleCount >= 1, 'Musí detekovat alespoň jeden zastaralý profil');
    assert.ok(checkRes.updatedIds.includes('prof-expired-1'), 'Expirovaný profil musí být v seznamu');
    
    const updated = dbStore.subjectVerifiedProfiles.find(p => p.id === 'prof-expired-1');
    assert.equal(updated?.status, 'STALE', 'Status profilu musí být STALE');
  });

  test('14. Princip čtyř očí (Four-Eyes Principle): moderátor NEMŮŽE moderovat vlastní návrh', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';
    
    // Moderator submits a proposal
    const modProposal = await SubjectVerifiedInfoService.submitSourceProposal(
      {
        subjektId: subjId,
        sourceUrl: 'https://www.justice.cz/os-praha-1',
        fieldKey: 'officialPhone',
        extractedValue: '+420 222 111 000',
      },
      moderatorUser
    );

    // Same moderator attempts to approve it -> MUST fail with 403 / "Nemůžete moderovat vlastní návrh."
    await assert.rejects(
      async () => {
        await SubjectVerifiedInfoService.reviewSourceProposal(
          modProposal.id,
          { decision: 'APPROVE' },
          moderatorUser
        );
      },
      (err: any) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /Nemůžete moderovat vlastní návrh/);
        return true;
      },
      'Moderátor nesmí schválit vlastní návrh'
    );

    // Another moderator or admin CAN review it
    const approveRes = await SubjectVerifiedInfoService.reviewSourceProposal(
      modProposal.id,
      { decision: 'APPROVE' },
      adminUser
    );
    assert.equal(approveRes.source.status, 'VERIFIED');
  });

  test('15. Ochrana proti souběhu (Concurrency Guard): opakované zpracování vyvolá 409 Conflict', async () => {
    const subjId = dbStore.subjekty[0]?.id || 'subj-nonospod-1';
    
    const proposal = await SubjectVerifiedInfoService.submitSourceProposal(
      {
        subjektId: subjId,
        sourceUrl: 'https://www.justice.cz/os-praha-1',
        fieldKey: 'dataBoxId',
        extractedValue: 'ds12345',
      },
      normalUser
    );

    // First review succeeds
    await SubjectVerifiedInfoService.reviewSourceProposal(
      proposal.id,
      { decision: 'APPROVE' },
      moderatorUser
    );

    // Second review on the same proposal -> MUST fail with 409 Conflict
    await assert.rejects(
      async () => {
        await SubjectVerifiedInfoService.reviewSourceProposal(
          proposal.id,
          { decision: 'REJECT', rejectionReason: 'Pozdní zamítnutí jiným moderátorem' },
          adminUser
        );
      },
      (err: any) => {
        assert.equal(err.statusCode, 409);
        assert.match(err.message, /Tento návrh byl již zpracován jiným moderátorem/);
        return true;
      },
      'Druhý moderátor musí dostat 409 Conflict'
    );
  });

  test('16. Sanitizace veřejného DTO: informationSources a pendingSourcesCount jsou bezpečně odstraněny', () => {
    const rawSubjekt = {
      id: 'subj-test-priv',
      name: 'Krajský soud v Brně',
      city: 'Brno',
      informationSources: [{ id: 'src-1', status: 'PENDING_REVIEW' }],
      pendingSourcesCount: 1,
      verifiedProfile: {
        id: 'prof-priv-1',
        subjektId: 'subj-test-priv',
        officialPhone: '+420 541 234 567',
        verifiedById: 'usr-admin-1',
      },
    };

    const publicDto = toPublicSubjektDto(rawSubjekt, false);
    assert.equal(publicDto.informationSources, undefined, 'informationSources nesmí opustit server ve veřejném DTO');
    assert.equal(publicDto.pendingSourcesCount, undefined, 'pendingSourcesCount nesmí opustit server ve veřejném DTO');
    assert.equal(publicDto.verifiedProfile.verifiedById, undefined, 'verifiedById nesmí opustit server');

    // Privileged DTO retains data for admin/moderator
    const privilegedDto = toPublicSubjektDto(rawSubjekt, true);
    assert.ok(privilegedDto.informationSources, 'Privilegovaný DTO má informationSources');
    assert.equal(privilegedDto.pendingSourcesCount, 1);
  });
});
