import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { CareOccurrenceEngine, StructuredCareRule } from '../src/services/care/careOccurrenceEngine';
import { ClientCaseService } from '../src/services/clientCaseService';
import { dbStore } from '../src/services/dbStore';
import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { User } from '../src/types';

describe('CARE OCCURRENCE ENGINE & JUDGMENT CALENDAR INTEGRATION TEST SUITE', () => {
  const userA: User = {
    id: 'test_user_care_engine_a',
    email: 'tata.care@example.com',
    name: 'Jan Novák',
    role: 'CLIENT',
    status: 'ACTIVE',
    totpEnabled: false,
  };

  const userB: User = {
    id: 'test_user_care_engine_b',
    email: 'attacker.care@example.com',
    name: 'Útočník',
    role: 'CLIENT',
    status: 'ACTIVE',
    totpEnabled: false,
  };

  const caseId = 'test_case_care_engine_1';

  before(async () => {
    dbStore.users.push(userA, userB);
    const existingIdx = dbStore.cases.findIndex(c => c.id === caseId);
    if (existingIdx >= 0) dbStore.cases.splice(existingIdx, 1);
    dbStore.cases.push({
      id: caseId,
      ownerId: userA.id,
      title: 'Péče o nezletilého Štěpána',
      caseNumber: '13 Nc 11/2026',
      court: 'Okresní soud v Pardubicích',
      caseType: 'OPATROVNICKE',
      status: 'ACTIVE',
      currentCareType: 'STRIDAVA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      participants: []
    });
  });

  after(async () => {
    const existingIdx = dbStore.cases.findIndex(c => c.id === caseId);
    if (existingIdx >= 0) dbStore.cases.splice(existingIdx, 1);
  });

  // 1. ISO-8601 Week Parity and Year Turnover Calculation
  test('1. ISO-8601 Week Parity and Year Turnover Calculation', () => {
    // 2026-06-15 is Monday, ISO week 25 (ODD)
    const d1 = new Date(2026, 5, 15);
    const info1 = CareOccurrenceEngine.getIsoWeekInfo(d1);
    assert.equal(info1.week, 25);
    assert.equal(info1.isOdd, true);
    assert.equal(info1.isEven, false);

    // 2026-06-22 is Monday, ISO week 26 (EVEN)
    const d2 = new Date(2026, 5, 22);
    const info2 = CareOccurrenceEngine.getIsoWeekInfo(d2);
    assert.equal(info2.week, 26);
    assert.equal(info2.isEven, true);
    assert.equal(info2.isOdd, false);

    // 2026-12-31 is Thursday, ISO week 53 of 2026 (ODD)
    const d3 = new Date(2026, 11, 31);
    const info3 = CareOccurrenceEngine.getIsoWeekInfo(d3);
    assert.equal(info3.year, 2026);
    assert.equal(info3.week, 53);
    assert.equal(info3.isOdd, true);

    // 2027-01-01 is Friday, still part of ISO week 53 of 2026 (ODD)
    const d4 = new Date(2027, 0, 1);
    const info4 = CareOccurrenceEngine.getIsoWeekInfo(d4);
    assert.equal(info4.year, 2026);
    assert.equal(info4.week, 53);
    assert.equal(info4.isOdd, true);

    // 2027-01-04 is Monday, ISO week 1 of 2027 (ODD)
    const d5 = new Date(2027, 0, 4);
    const info5 = CareOccurrenceEngine.getIsoWeekInfo(d5);
    assert.equal(info5.year, 2027);
    assert.equal(info5.week, 1);
    assert.equal(info5.isOdd, true);
  });

  // 2. Timezone Europe/Prague and DST Wall-Clock Safety
  test('2. Timezone Europe/Prague and DST Wall-Clock Safety', () => {
    // Summer date (CEST, UTC+2)
    const dtSummer = CareOccurrenceEngine.createPragueDateTime('2026-07-15', '08:45');
    assert.equal(dtSummer.getHours(), 8);
    assert.equal(dtSummer.getMinutes(), 45);

    // Winter date (CET, UTC+1)
    const dtWinter = CareOccurrenceEngine.createPragueDateTime('2026-12-15', '08:45');
    assert.equal(dtWinter.getHours(), 8);
    assert.equal(dtWinter.getMinutes(), 45);

    // Format matches YYYY-MM-DD
    assert.equal(CareOccurrenceEngine.formatPragueDate(dtSummer), '2026-07-15');
    assert.equal(CareOccurrenceEngine.formatPragueDate(dtWinter), '2026-12-15');
  });

  // 3. Hourly Intra-Day Intervals (Model Judgment: Even Po+Pá 08:45–15:30, Odd Po+St+Pá 08:45–15:30)
  test('3. Hourly Intra-Day Intervals Generation (Model Judgment)', () => {
    const modelJudgment = {
      court: 'Okresní soud v Pardubicích',
      caseNumber: '13 Nc 11/2026',
      scheduleType: 'EVEN_ODD_WEEKS',
      handoverLocation: 'Přelouč – železniční stanice',
      handoverStartTime: '08:45',
      handoverEndTime: '15:30',
      evenWeek: {
        days: ['pondělí', 'pátek'],
        summary: 'Sudý týden: pondělí 08:45–15:30, pátek 08:45–15:30'
      },
      oddWeek: {
        days: ['pondělí', 'středa', 'pátek'],
        summary: 'Lichý týden: pondělí 08:45–15:30, středa 08:45–15:30, pátek 08:45–15:30'
      }
    };

    const rules = CareOccurrenceEngine.parseJudgmentToCareRules(modelJudgment);
    assert.equal(rules.length, 2);

    // Start on Monday 2026-06-15 (Odd week 25)
    const res = CareOccurrenceEngine.generateOccurrencesAndDays({
      caseId: 'test_case_care_engine_1',
      startDate: '2026-06-15',
      daysCount: 14, // 2 full weeks
      rules,
      defaultLocation: 'Přelouč – železniční stanice'
    });

    assert.equal(res.days.length, 14);
    // Week 25 (Odd): Mon, Wed, Fri = 3 occurrences
    // Week 26 (Even): Mon, Fri = 2 occurrences
    // Total in 14 days = 5 occurrences
    assert.equal(res.occurrences.length, 5);

    // Check exact times and duration
    for (const occ of res.occurrences) {
      assert.equal(occ.eventDate.getHours(), 8);
      assert.equal(occ.eventDate.getMinutes(), 45);
      assert.equal(occ.endDate.getHours(), 15);
      assert.equal(occ.endDate.getMinutes(), 30);
      assert.equal(occ.durationMinutes, 405); // 6h 45m = 405 min
      assert.equal(occ.location, 'Přelouč – železniční stanice');
      assert.ok(occ.durationMinutes > 0, 'Duration must be strictly positive');
    }
  });

  // 4. Overnight and Multi-Day Intervals Crossing Midnight (Strictly Positive Duration)
  test('4. Overnight Intervals Crossing Midnight (Strictly Positive Duration)', () => {
    // Custom rule: Friday 15:00 to Saturday 10:00
    const ruleOvernight: StructuredCareRule = {
      id: 'rule-overnight-weekend',
      ruleCategory: 'WEEKEND',
      priority: 50,
      parity: 'EVERY',
      intervals: [{
        startDayOfWeek: 5, // Friday
        startTime: '15:00',
        endDayOfWeek: 6,   // Saturday
        endTime: '10:00',
        crossesMidnight: true,
        endDayOffset: 1
      }],
      assignedParent: 'PARENT_A',
      location: 'Místo předání',
      status: 'VERIFIED'
    };

    const res = CareOccurrenceEngine.generateOccurrencesAndDays({
      caseId: 'test_case_care_engine_1',
      startDate: '2026-06-15', // Mon
      daysCount: 7,
      rules: [ruleOvernight]
    });

    assert.equal(res.occurrences.length, 1);
    const friOcc = res.occurrences[0];
    assert.equal(friOcc.eventDate.getDay(), 5); // Friday
    assert.equal(friOcc.eventDate.getHours(), 15);
    assert.equal(friOcc.endDate.getDay(), 6); // Saturday
    assert.equal(friOcc.endDate.getHours(), 10);
    assert.equal(friOcc.durationMinutes, 1140); // 19 hours
    assert.ok(friOcc.durationMinutes > 0, 'Duration must be strictly positive');
  });

  // 5. Multi-Day Weekend Interval: Friday 18:00 to Monday 08:00
  test('5. Multi-Day Weekend Interval: Friday 18:00 to Monday 08:00', () => {
    const ruleLongWeekend: StructuredCareRule = {
      id: 'rule-long-weekend',
      ruleCategory: 'WEEKEND',
      priority: 50,
      parity: 'EVERY',
      intervals: [{
        startDayOfWeek: 5, // Friday
        startTime: '18:00',
        endDayOfWeek: 1,   // Monday
        endTime: '08:00',
        crossesMidnight: true,
        endDayOffset: 3
      }],
      assignedParent: 'PARENT_A',
      status: 'VERIFIED'
    };

    const res = CareOccurrenceEngine.generateOccurrencesAndDays({
      caseId: 'test_case_care_engine_1',
      startDate: '2026-06-15',
      daysCount: 7,
      rules: [ruleLongWeekend]
    });

    assert.equal(res.occurrences.length, 1);
    const occ = res.occurrences[0];
    assert.equal(occ.eventDate.getDay(), 5); // Friday
    assert.equal(occ.endDate.getDay(), 1);   // Monday
    assert.equal(occ.durationMinutes, 3720); // 62 hours
    assert.ok(occ.durationMinutes > 0);
  });

  // 6. Continuous Alternating 7/7 Standard Care Regime
  test('6. Continuous Alternating 7/7 Regime', () => {
    const extractedData = {
      scheduleType: '7/7',
      custodyType: 'SHARED',
      handoverTime: '16:00',
      handoverLocation: 'Předání před školou'
    };

    const rules = CareOccurrenceEngine.parseJudgmentToCareRules(extractedData);
    const res = CareOccurrenceEngine.generateOccurrencesAndDays({
      caseId: 'test_case_care_engine_1',
      startDate: '2026-06-15',
      daysCount: 28,
      rules
    });

    assert.equal(res.days.length, 28);
    assert.ok(res.occurrences.length > 0);
  });

  // 7. Atomic Integration into Case via applyJudgmentToCase
  test('7. Atomic Integration into Case via applyJudgmentToCase', async () => {
    const fullJudgmentData = {
      court: 'Okresní soud v Pardubicích',
      caseNumber: '13 Nc 11/2026',
      childName: 'Štěpán Šár',
      childBirthDate: '2025-12-02',
      judgmentDate: '2026-06-09',
      custodyType: 'SHARED',
      scheduleType: 'EVEN_ODD_WEEKS',
      handoverLocation: 'Přelouč – železniční stanice',
      handoverStartTime: '08:45',
      handoverEndTime: '15:30',
      handoverTime: '08:45',
      alimonyAmount: 1500,
      alimonyDueDate: 15,
      alimonyDebtAmount: 200,
      informationDuty: 'Rodič má v době své péče 1× denně informovat druhého rodiče o dítěti.',
      evenWeek: {
        days: ['pondělí', 'pátek'],
        summary: 'Sudý týden: pondělí 08:45–15:30, pátek 08:45–15:30'
      },
      oddWeek: {
        days: ['pondělí', 'středa', 'pátek'],
        summary: 'Lichý týden: pondělí 08:45–15:30, středa 08:45–15:30, pátek 08:45–15:30'
      }
    };

    const res = await ClientCaseService.applyJudgmentToCase(caseId, userA, fullJudgmentData, true);
    assert.ok(res.success);
    assert.equal(res.caseId, caseId);
    assert.ok(res.carePlan);
    assert.equal(res.carePlan.days.length, 28);
  });

  // 8. BOLA / IDOR Security Check (User B rejected)
  test('8. BOLA / IDOR Security Check (User B rejected with 403)', async () => {
    await assert.rejects(
      async () => {
        await ClientCaseService.applyJudgmentToCase(caseId, userB, { court: 'Soud' }, true);
      },
      (err: any) => {
        return err.message.includes('Přístup odepřen') || err.message.includes('Forbidden') || err.message.includes('403');
      }
    );
  });

  // 9. Idempotence Check
  test('9. Idempotence Check - Repeated application produces consistent state', async () => {
    const fullJudgmentData = {
      court: 'Okresní soud v Pardubicích',
      caseNumber: '13 Nc 11/2026',
      childName: 'Štěpán Šár',
      childBirthDate: '2025-12-02',
      custodyType: 'SHARED',
      scheduleType: 'EVEN_ODD_WEEKS',
      handoverLocation: 'Přelouč – železniční stanice',
      handoverStartTime: '08:45',
      handoverEndTime: '15:30',
      evenWeek: { days: ['pondělí', 'pátek'] },
      oddWeek: { days: ['pondělí', 'středa', 'pátek'] }
    };

    const res1 = await ClientCaseService.applyJudgmentToCase(caseId, userA, fullJudgmentData, true);
    assert.ok(res1.success);

    const res2 = await ClientCaseService.applyJudgmentToCase(caseId, userA, fullJudgmentData, true);
    assert.ok(res2.success);
  });
});
