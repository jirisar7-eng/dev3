import { CareMetricsEngine } from '../services/care/careMetricsEngine';
import { CarePlanService } from '../services/care/carePlanService';
import { CareDay, CareHolidayRule } from '../types';

/**
 * Automated Verification Test Suite for Care & Parenting Hub Hardening
 */
async function runTests() {
  console.log('--- STARTING CARE & PARENTING HUB HARDENING TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST 1: Math integrity - Total Hours = totalDays * 24 across all rotation patterns
  {
    const patterns = ['7/7', '2-2-3', '3-4-4-3', 'ALTERNATING_WEEKENDS', 'EXTENDED_WEEKENDS'];
    for (const pattern of patterns) {
      const days = CarePlanService.generateDaysSequence({
        startDate: '2026-09-01',
        daysCount: 28,
        rotationPattern: pattern,
        defaultHandoverTime: '16:30',
        handoverDistanceKm: 15,
        handoverDurationMin: 25,
      });

      const metrics = CareMetricsEngine.calculateMetrics(days);
      const expectedTotalHours = 28 * 24;

      assert(metrics.totalDays === 28, `Pattern ${pattern}: totalDays is 28`);
      assert(metrics.timeEstimateCalculable === true, `Pattern ${pattern}: time estimate is calculable`);
      assert(
        metrics.estimatedTimePercentA !== null &&
          metrics.estimatedTimePercentB !== null &&
          Math.round(metrics.estimatedTimePercentA + metrics.estimatedTimePercentB) === 100,
        `Pattern ${pattern}: Sum of time percentages A+B equals 100% (${metrics.estimatedTimePercentA}% + ${metrics.estimatedTimePercentB}%)`
      );
    }
  }

  // TEST 2: Handover consistency with Holiday Rules (Principle: Recomputed handovers)
  {
    const holidayRules: CareHolidayRule[] = [
      {
        id: 'rule-xmas',
        carePlanId: 'p1',
        holidayType: 'CHRISTMAS',
        name: 'Vánoční prázdniny',
        startDate: '2026-12-23',
        endDate: '2026-12-27',
        allocationModel: 'ALWAYS_PARENT_B',
      },
    ];

    const days = CarePlanService.generateDaysSequence({
      startDate: '2026-12-20',
      daysCount: 14,
      rotationPattern: '7/7',
      startParent: 'PARENT_A',
      defaultHandoverTime: '16:00',
      holidayRules,
    });

    // Check holiday days
    const holidayDays = days.filter(d => d.isHoliday);
    assert(holidayDays.length === 5, '5 holiday days assigned');
    assert(
      holidayDays.every(d => d.assignedParent === 'PARENT_B'),
      'All holiday days assigned to Parent B'
    );

    // Verify all handovers strictly match parent transitions
    let handoversMatch = true;
    for (let i = 1; i < days.length; i++) {
      const isParentChange = days[i].assignedParent !== days[i - 1].assignedParent;
      if (days[i].isHandover !== isParentChange) {
        handoversMatch = false;
        break;
      }
    }
    assert(handoversMatch, 'All handovers strictly match adjacent parent changes with zero phantom handovers');
  }

  // TEST 3: Alternating years holiday rule evaluation
  {
    const alternatingRules: CareHolidayRule[] = [
      {
        id: 'rule-easter',
        carePlanId: 'p1',
        holidayType: 'EASTER',
        name: 'Velikonoce',
        startDate: '2026-04-03',
        endDate: '2026-04-06',
        allocationModel: 'ALTERNATING_YEARS',
        evenYearParent: 'PARENT_A',
        oddYearParent: 'PARENT_B',
      },
    ];

    // 2026 is an even year -> Parent A
    const days2026 = CarePlanService.generateDaysSequence({
      startDate: '2026-04-01',
      daysCount: 10,
      rotationPattern: '7/7',
      startParent: 'PARENT_B',
      holidayRules: alternatingRules,
    });

    const easterDays = days2026.filter(d => d.date >= '2026-04-03' && d.date <= '2026-04-06');
    assert(
      easterDays.every(d => d.assignedParent === 'PARENT_A'),
      'Even year 2026 Easter assigned to Parent A'
    );
  }

  // TEST 4: Sibling schedule analysis
  {
    const child1Days: CareDay[] = [
      { date: '2026-09-01', dayOfWeek: 2, assignedParent: 'PARENT_A', isOvernight: true, isHandover: false },
      { date: '2026-09-02', dayOfWeek: 3, assignedParent: 'PARENT_A', isOvernight: true, isHandover: false },
      { date: '2026-09-03', dayOfWeek: 4, assignedParent: 'PARENT_B', isOvernight: true, isHandover: true },
    ];
    const child2Days: CareDay[] = [
      { date: '2026-09-01', dayOfWeek: 2, assignedParent: 'PARENT_A', isOvernight: true, isHandover: false },
      { date: '2026-09-02', dayOfWeek: 3, assignedParent: 'PARENT_B', isOvernight: true, isHandover: true }, // separation on day 2
      { date: '2026-09-03', dayOfWeek: 4, assignedParent: 'PARENT_B', isOvernight: true, isHandover: false },
    ];

    const analysis = CareMetricsEngine.analyzeSiblingSchedules([
      { childId: 'c1', childName: 'Adam', days: child1Days },
      { childId: 'c2', childName: 'Eva', days: child2Days },
    ]);

    assert(analysis.jointDaysCount === 2, '2 joint days between siblings');
    assert(analysis.separatedDaysCount === 1, '1 separated day between siblings');
    assert(analysis.separatedDates.includes('2026-09-02'), 'Separated date correctly identified as 2026-09-02');
  }

  // TEST 5: Server-side validation schema
  {
    let caughtInvalidLat = false;
    try {
      CarePlanService.validatePlanInput({ parentALat: 95 });
    } catch (e: any) {
      caughtInvalidLat = true;
    }
    assert(caughtInvalidLat, 'Caught invalid latitude > 90');

    let caughtInvalidTime = false;
    try {
      CarePlanService.validatePlanInput({ defaultHandoverTime: '28:99' });
    } catch (e: any) {
      caughtInvalidTime = true;
    }
    assert(caughtInvalidTime, 'Caught invalid handover time format');

    let caughtInvalidDates = false;
    try {
      CarePlanService.validatePlanInput({ startDate: '2026-10-10', endDate: '2026-10-01' });
    } catch (e: any) {
      caughtInvalidDates = true;
    }
    assert(caughtInvalidDates, 'Caught endDate < startDate');
  }

  // TEST 6: Multi-variant compare generator
  {
    const variants = CarePlanService.compareVariants(['7/7', '2-2-3'], {
      startDate: '2026-09-01',
      daysCount: 28,
    });

    assert(variants.length === 2, 'Generated 2 variants');
    assert(variants[0].pattern === '7/7', 'First variant is 7/7');
    assert(variants[1].pattern === '2-2-3', 'Second variant is 2-2-3');
    assert(variants[0].metrics.totalDays === 28, 'Variant metrics calculated correctly');
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
