import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicJudgmentParser } from '../src/services/deterministicJudgmentParser';
import { ClientCaseService } from '../src/services/clientCaseService';
import { dbStore } from '../src/services/dbStore';
import { User } from '../src/types';

describe('Section 5 End-to-End Forensics & Judgment Mapping Verification', () => {
  const testUser: User = {
    id: 'test_sec5_user_1',
    email: 'sec5.father@example.com',
    name: 'Otec Štěpána',
    role: 'CLIENT',
    status: 'ACTIVE',
    totpEnabled: false
  };

  const testCaseId = 'test_sec5_case_1';

  const SECTION5_JUDGMENT_TEXT = `
Okresní soud v Pardubicích
č. j. 13 Nc 11/2026

ROZSUDEK
JMÉNEM REPUBLIKY

I. Nezletilý Štěpán Šár, nar. 02.12.2025, se svěřuje do střídavé péče obou rodičů.
Péče se zakládá na rozvrhu podle sudých a lichých kalendářních týdnů.
Předání nezletilého proběhne v pondělí v 17:00 hodin v místě Přelouč – železniční stanice.
II. Otec je povinen přispívat na výživu nezletilého částkou 1 500 Kč měsíčně k rukám matky.
III. Oběma rodičům se ukládá informační povinnost informovat druhého rodiče 1x denně o stavu nezletilého.
`;

  before(() => {
    dbStore.users.push(testUser);
    dbStore.cases = dbStore.cases.filter(c => c.id !== testCaseId);
    dbStore.cases.push({
      id: testCaseId,
      ownerId: testUser.id,
      title: 'Péče o nezletilého Štěpána Šára',
      caseNumber: '',
      court: '',
      caseType: 'OPATROVNICKE',
      status: 'ACTIVE',
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      participants: []
    });
  });

  test('1. Deterministic parser extracts exact clean fields without legal verb pollution', () => {
    const extracted = DeterministicJudgmentParser.parseText(SECTION5_JUDGMENT_TEXT, 'sec5_doc_1');

    assert.equal(extracted.childName, 'Štěpán Šár', 'Child name must be clean Štěpán Šár');
    assert.notEqual(extracted.childName, 'dítě');
    assert.ok(!extracted.childName?.includes('svěřuje'), 'Child name must NOT contain verb phrases');

    assert.equal(extracted.childBirthDate, '2025-12-02', 'Child birth date must be ISO 2025-12-02');
    assert.equal(extracted.court, 'Okresní soud v Pardubicích');
    assert.equal(extracted.caseNumber, '13 Nc 11/2026');
    assert.equal(extracted.custodyType, 'SHARED');
    assert.equal(extracted.scheduleType, 'EVEN_ODD_WEEKS');
    assert.equal(extracted.alimonyAmount, 1500, 'Alimony amount must be exactly 1500');
    assert.ok(extracted.handoverLocation?.includes('Přelouč'), 'Handover location must include Přelouč');
    assert.ok(extracted.informationDuty, 'Information duty must be extracted');
  });

  test('2. Atomic persistence populates Case, Child, Documents, Deadlines, Tasks, CarePlans, CareDays and Events cleanly', async () => {
    const extracted = DeterministicJudgmentParser.parseText(SECTION5_JUDGMENT_TEXT, 'sec5_doc_1');

    const applyRes = await ClientCaseService.applyJudgmentToCase(testCaseId, testUser, extracted, true);
    assert.ok(applyRes.success, 'Apply judgment must return success');

    const fetchedCase = await ClientCaseService.getCaseById(testCaseId, testUser);
    assert.ok(fetchedCase, 'Fetched case must exist');
    assert.equal(fetchedCase.caseNumber, '13 Nc 11/2026', 'Case number must be saved as string');
    assert.equal(fetchedCase.court, 'Okresní soud v Pardubicích', 'Court must be saved as string');

    // Children assertion
    assert.ok(fetchedCase.children && fetchedCase.children.length > 0, 'Children list must not be empty');
    const child = fetchedCase.children[0];
    assert.equal(child.firstName, 'Štěpán', 'First name must be Štěpán');
    assert.equal(child.lastName, 'Šár', 'Last name must be Šár');
    assert.equal(child.dateOfBirth, '2025-12-02', 'Date of birth must be 2025-12-02');

    // Document assertion
    assert.ok(fetchedCase.documents && fetchedCase.documents.length > 0, 'Documents list must not be empty');

    // Evidence assertion
    assert.ok(fetchedCase.evidence && fetchedCase.evidence.length > 0, 'Evidence list must not be empty');

    // Deadlines / Alimony assertion
    assert.ok(fetchedCase.deadlines && fetchedCase.deadlines.length > 0, 'Deadlines list must not be empty');
    const alimonyDeadline = fetchedCase.deadlines.find(d => d.type === 'FINANCIAL');
    assert.ok(alimonyDeadline, 'Financial alimony deadline must exist');
    assert.ok(alimonyDeadline.title.includes('1500') || alimonyDeadline.title.includes('1 500'), 'Alimony deadline must reference 1 500 Kč');

    // Tasks assertion (Informační povinnost)
    assert.ok(fetchedCase.tasks && fetchedCase.tasks.length > 0, 'Tasks list must not be empty');
    const infoTask = fetchedCase.tasks.find(t => t.title.includes('Informační'));
    assert.ok(infoTask, 'Information duty task must exist');

    // Care Plans & Care Days assertion
    assert.ok(fetchedCase.carePlans && fetchedCase.carePlans.length > 0, 'Care plans list must not be empty');
    const activeCarePlan = fetchedCase.carePlans[0];
    assert.ok(activeCarePlan.days && activeCarePlan.days.length > 0, 'Care plan days must be generated');

    // Events assertion
    assert.ok(fetchedCase.events && fetchedCase.events.length > 0, 'Case events list must not be empty');
  });
});
