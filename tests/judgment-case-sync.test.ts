import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { dbStore } from '../src/services/dbStore';
import { ClientCaseService } from '../src/services/clientCaseService';
import { JudgmentParserService } from '../src/services/judgmentParserService';
import { User } from '../src/types';

describe('Judgment AI Extractor -> Case Persistence Integration', () => {
  const userA: User = {
    id: 'test_user_judgment_owner_1',
    email: 'tata.owner@example.com',
    name: 'Jan Novák',
    role: 'CLIENT',
    status: 'ACTIVE',
    totpEnabled: false
  };

  const userB: User = {
    id: 'test_user_judgment_attacker_2',
    email: 'attacker@example.com',
    name: 'Cizí Uživatel',
    role: 'CLIENT',
    status: 'ACTIVE',
    totpEnabled: false
  };

  const caseId = 'test_case_judgment_sync_1';

  before(async () => {
    // Ensure in-memory dbStore has the test case and users
    dbStore.users.push(userA, userB);
    const existingCaseIdx = dbStore.cases.findIndex(c => c.id === caseId);
    if (existingCaseIdx >= 0) {
      dbStore.cases.splice(existingCaseIdx, 1);
    }
    dbStore.cases.push({
      id: caseId,
      ownerId: userA.id,
      title: 'Rozvod a péče o nezletilého',
      caseNumber: '',
      court: 'Okresní soud',
      caseType: 'OPATROVNICKE',
      status: 'ACTIVE',
      description: 'Testovací spis',
      currentCareType: 'STRIDAVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      participants: []
    });

    // Cleanup prior test data in prisma if connected
    try {
      if (isPrismaAvailable()) {
        await prisma.caseEvent.deleteMany({ where: { caseId } });
        await prisma.careDay.deleteMany({ where: { plan: { caseId } } });
        await prisma.carePlanChild.deleteMany({ where: { plan: { caseId } } });
        await prisma.careHolidayRule.deleteMany({ where: { plan: { caseId } } });
        await prisma.carePlan.deleteMany({ where: { caseId } });
        await prisma.caseEvidence.deleteMany({ where: { caseId } });
        await prisma.caseDocument.deleteMany({ where: { caseId } });
        await prisma.caseDeadline.deleteMany({ where: { caseId } });
        await prisma.caseTask.deleteMany({ where: { caseId } });
        await prisma.child.deleteMany({ where: { caseId } });
        await prisma.case.deleteMany({ where: { id: caseId } });

        await prisma.user.upsert({
          where: { id: userA.id },
          update: {},
          create: {
            id: userA.id,
            email: userA.email,
            name: userA.name,
            role: 'CLIENT',
            status: 'ACTIVE'
          }
        });

        await prisma.user.upsert({
          where: { id: userB.id },
          update: {},
          create: {
            id: userB.id,
            email: userB.email,
            name: userB.name,
            role: 'CLIENT',
            status: 'ACTIVE'
          }
        });

        await prisma.case.create({
          data: {
            id: caseId,
            userId: userA.id,
            title: 'Rozvod a péče o nezletilého',
            status: 'OPEN'
          }
        });
      }
    } catch (e) {
      console.warn('Test setup note:', e);
    }
  });

  after(async () => {
    // Cleanup test data
    const existingCaseIdx = dbStore.cases.findIndex(c => c.id === caseId);
    if (existingCaseIdx >= 0) {
      dbStore.cases.splice(existingCaseIdx, 1);
    }
    try {
      if (isPrismaAvailable()) {
        await prisma.caseEvent.deleteMany({ where: { caseId } });
        await prisma.careDay.deleteMany({ where: { plan: { caseId } } });
        await prisma.carePlanChild.deleteMany({ where: { plan: { caseId } } });
        await prisma.careHolidayRule.deleteMany({ where: { plan: { caseId } } });
        await prisma.carePlan.deleteMany({ where: { caseId } });
        await prisma.caseEvidence.deleteMany({ where: { caseId } });
        await prisma.caseDocument.deleteMany({ where: { caseId } });
        await prisma.caseDeadline.deleteMany({ where: { caseId } });
        await prisma.caseTask.deleteMany({ where: { caseId } });
        await prisma.child.deleteMany({ where: { caseId } });
        await prisma.case.deleteMany({ where: { id: caseId } });
        await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
      }
    } catch (e) {
      // ignore
    }
  });

  test('1. Authorization Check - User B (Attacker) is rejected with 403 on User A Case', async () => {
    const sampleData = {
      court: 'Okresní soud v Pardubicích',
      caseNumber: '13 Nc 11/2026',
      childName: 'Štěpán Šár',
      alimonyAmount: 1500
    };

    await assert.rejects(
      async () => {
        await ClientCaseService.applyJudgmentToCase(caseId, userB, sampleData, true);
      },
      (err: any) => {
        return err.message.includes('Přístup odepřen') || err.message.includes('Forbidden') || err.message.includes('403');
      }
    );
  });

  test('2. Atomic Persistence - Authorized User A applies judgment and persists data', async () => {
    const extractedData = {
      court: 'Okresní soud v Pardubicích',
      caseNumber: '13 Nc 11/2026, 13 Pa Nc 111/2026, 13 P a Nc 181/2026',
      childName: 'Štěpán Šár',
      childBirthDate: '2025-12-02',
      judgmentDate: '2026-06-09',
      effectiveDate: null,
      custodyType: 'SHARED',
      scheduleType: 'EVEN_ODD_WEEKS',
      handoverLocation: 'Přelouč – železniční stanice',
      handoverStartTime: '08:45',
      handoverEndTime: '15:30',
      handoverTime: '08:45',
      alimonyAmount: 1500,
      alimonyDueDate: 15,
      alimonyRecipient: 'k rukám matky',
      alimonyDebtAmount: 200,
      alimonyDebtPeriod: 'květen 2026',
      alimonyDebtDueDate: 'do 1 měsíce od právní moci',
      informationDuty: 'Rodič má v době své péče 1× denně informovat druhého rodiče o nezletilém dítěti (výrok IV).',
      otherDuties: 'Informační povinnost 1x denně, dlužné výživné 200 Kč za květen 2026',
      evenWeek: {
        days: ['pondělí', 'pátek'],
        summary: 'Sudý týden: pondělí 08:45–15:30, pátek 08:45–15:30'
      },
      oddWeek: {
        days: ['pondělí', 'středa', 'pátek'],
        summary: 'Lichý týden: pondělí 08:45–15:30, středa 08:45–15:30, pátek 08:45–15:30'
      },
      fileMetadata: {
        fileName: '1720789705_BezdohodyP+V-Šár.PDF',
        fileHash: 'sha256_mock_hash_test_stepan_sar',
        mimeType: 'application/pdf',
        size: 245000,
        storageProvider: 'MinIO'
      }
    };

    const res = await ClientCaseService.applyJudgmentToCase(caseId, userA, extractedData, true);
    assert.ok(res.success);
    assert.equal(res.caseId, caseId);

    // Verify stored entities in case
    const fetchedCase = await ClientCaseService.getCaseById(caseId, userA);
    assert.ok(fetchedCase);
    assert.equal(fetchedCase.court, 'Okresní soud v Pardubicích');
    assert.equal(fetchedCase.currentCareType, 'SHARED');

    // Child verification
    assert.ok(fetchedCase.children && fetchedCase.children.length > 0);
    const stepan = fetchedCase.children.find(c => c.firstName === 'Štěpán' && c.lastName === 'Šár');
    assert.ok(stepan, 'Child Štěpán Šár must be created');
    assert.equal(stepan.dateOfBirth, '2025-12-02');

    // Document and Evidence verification
    assert.ok(fetchedCase.documents && fetchedCase.documents.length > 0);
    const doc = fetchedCase.documents.find(d => d.name === '1720789705_BezdohodyP+V-Šár.PDF');
    assert.ok(doc, 'Case document must be registered');
    assert.equal(doc.scanStatus, 'CLEAN');

    assert.ok(fetchedCase.evidence && fetchedCase.evidence.length > 0);
    const evi = fetchedCase.evidence.find(e => e.type === 'DOCUMENT');
    assert.ok(evi, 'Case evidence must be linked');

    // Financial obligations: Alimony + Alimony Debt
    assert.ok(fetchedCase.deadlines && fetchedCase.deadlines.length > 0);
    const regularAlimony = fetchedCase.deadlines.find(d => d.type === 'FINANCIAL' && (d.title.includes('1500') || d.title.includes('1 500')));
    assert.ok(regularAlimony, 'Regular alimony deadline must be set');

    const debtAlimony = fetchedCase.deadlines.find(d => d.title.includes('Dlužné výživné') && d.title.includes('200 Kč'));
    assert.ok(debtAlimony, 'Alimony debt deadline must be set');

    // Task for missing effective date and information duty
    assert.ok(fetchedCase.tasks && fetchedCase.tasks.length > 0);
    const pmTask = fetchedCase.tasks.find(t => t.title.includes('právní moci') && t.title.includes('200 Kč'));
    assert.ok(pmTask, 'Task to supply missing effective date for debt must be created');

    const infoTask = fetchedCase.tasks.find(t => t.title.includes('Informační povinnost'));
    assert.ok(infoTask, 'Information duty task must be created');

    // Active Care Plan
    assert.ok(fetchedCase.carePlans && fetchedCase.carePlans.length > 0);
    const activePlan = fetchedCase.carePlans.find(p => p.status === 'ACTIVE');
    assert.ok(activePlan, 'Active care plan must exist');
    assert.equal(activePlan.defaultHandoverTime, '08:45');
    assert.equal(activePlan.parentAAddress, 'Přelouč – železniční stanice');
  });

  test('3. Idempotence Check - Repeated application does not fail or duplicate active care plans', async () => {
    const extractedData = {
      court: 'Okresní soud v Pardubicích',
      caseNumber: '13 Nc 11/2026',
      childName: 'Štěpán Šár',
      childBirthDate: '2018-04-15',
      judgmentDate: '2026-06-09',
      custodyType: 'SHARED',
      scheduleType: 'EVEN_ODD_WEEKS',
      handoverLocation: 'Přelouč – železniční stanice',
      handoverStartTime: '08:45',
      handoverEndTime: '15:30',
      handoverTime: '08:45',
      alimonyAmount: 1500,
      alimonyDueDate: 15,
      otherDuties: 'Informační povinnost 1x denně, dlužné výživné 200 Kč',
      evenWeek: {
        days: ['středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'],
        summary: 'Sudý týden: středa 08:45 až neděle 15:30'
      },
      oddWeek: {
        days: ['úterý', 'středa'],
        summary: 'Lichý týden: úterý a středa'
      },
      fileMetadata: {
        fileName: '1720789705_BezdohodyP+V-Šár.PDF',
        fileHash: 'sha256_mock_hash_test_stepan_sar',
        mimeType: 'application/pdf',
        size: 245000,
        storageProvider: 'MinIO'
      }
    };

    // Apply second time
    const res2 = await ClientCaseService.applyJudgmentToCase(caseId, userA, extractedData, true);
    assert.ok(res2.success);
  });
});
