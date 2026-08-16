import assert from 'node:assert';
import { calculateQAScoresAndMetrics } from '../services/qa/qaAuditEngine.js';
import { computeDeterministicVerdict, aiAnalystOrchestrator } from '../services/qa/ai/aiAnalystOrchestrator.js';

export async function runQualityGateTests() {
  console.log('🧪 Starting QA Quality Gate & Production Readiness Audit Tests...\n');

  // Test 1: User scenario 15 PASS + 1 PARTIAL + 97 NOT TESTED
  console.log('Test 1: 15 PASS + 1 PARTIAL + 97 NOT TESTED...');
  const counts1 = {
    pass: 15,
    fail: 0,
    partial: 1,
    notTested: 97,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    discovered: 113,
    tested: 16,
    verifiedSkipped: 0
  };

  const verdict1 = computeDeterministicVerdict(counts1);
  assert.strictEqual(verdict1, 'NOT PRODUCTION READY', 'Verdict MUST be NOT PRODUCTION READY when NOT TESTED or PARTIAL exist');

  const result1 = calculateQAScoresAndMetrics({
    passCount: 15,
    failCount: 0,
    partialCount: 1,
    notTestedCount: 97,
    verifiedSkippedCount: 0,
    p0Count: 0,
    p1Count: 0,
    p2Count: 0,
    p3Count: 0,
    totalDiscovered: 113,
    findingsList: []
  });

  assert.ok(result1.scores.overall < 100, `Overall score MUST be < 100% (got ${result1.scores.overall}%)`);
  assert.ok(result1.scores.functional < 100, `Functional score MUST be < 100% (got ${result1.scores.functional}%)`);
  assert.strictEqual(result1.metrics.coveragePercent, 13, 'Coverage % should be ~13%');
  assert.strictEqual(result1.metrics.testedCoveragePercent, 14, 'Tested coverage % should be ~14%');
  console.log('✅ Test 1 Passed (Verdict: NOT PRODUCTION READY, Overall QA Score: ' + result1.scores.overall + '%)\n');

  // Test 2: 0 PASS + 100 NOT TESTED
  console.log('Test 2: 100 NOT TESTED...');
  const counts2 = {
    pass: 0,
    fail: 0,
    partial: 0,
    notTested: 100,
    p0: 0,
    p1: 0,
    p2: 0,
    p3: 0,
    discovered: 100
  };

  const verdict2 = computeDeterministicVerdict(counts2);
  assert.strictEqual(verdict2, 'NOT PRODUCTION READY');

  const result2 = calculateQAScoresAndMetrics({
    passCount: 0,
    failCount: 0,
    partialCount: 0,
    notTestedCount: 100,
    verifiedSkippedCount: 0,
    p0Count: 0,
    p1Count: 0,
    p2Count: 0,
    p3Count: 0,
    totalDiscovered: 100,
    findingsList: []
  });

  assert.strictEqual(result2.scores.overall, 0);
  console.log('✅ Test 2 Passed\n');

  // Test 3: P0 or P1 findings -> NOT PRODUCTION READY
  console.log('Test 3: P0/P1 findings...');
  const verdict3 = computeDeterministicVerdict({ pass: 100, fail: 0, partial: 0, notTested: 0, p0: 1, p1: 0, p2: 0, p3: 0 });
  assert.strictEqual(verdict3, 'NOT PRODUCTION READY');

  const verdict3b = computeDeterministicVerdict({ pass: 100, fail: 0, partial: 0, notTested: 0, p0: 0, p1: 1, p2: 0, p3: 0 });
  assert.strictEqual(verdict3b, 'NOT PRODUCTION READY');
  console.log('✅ Test 3 Passed\n');

  // Test 4: P2/P3 findings when 100% tested -> PRODUCTION READY WITH WARNINGS
  console.log('Test 4: P2/P3 findings...');
  const verdict4 = computeDeterministicVerdict({ pass: 100, fail: 0, partial: 0, notTested: 0, p0: 0, p1: 0, p2: 2, p3: 3 });
  assert.strictEqual(verdict4, 'PRODUCTION READY WITH WARNINGS');
  console.log('✅ Test 4 Passed\n');

  // Test 5: Perfect run 100% PASS
  console.log('Test 5: Perfect 100% PASS run...');
  const verdict5 = computeDeterministicVerdict({ pass: 100, fail: 0, partial: 0, notTested: 0, p0: 0, p1: 0, p2: 0, p3: 0, discovered: 100 });
  assert.strictEqual(verdict5, 'PRODUCTION READY');

  const result5 = calculateQAScoresAndMetrics({
    passCount: 100,
    failCount: 0,
    partialCount: 0,
    notTestedCount: 0,
    verifiedSkippedCount: 0,
    p0Count: 0,
    p1Count: 0,
    p2Count: 0,
    p3Count: 0,
    totalDiscovered: 100,
    findingsList: []
  });

  assert.strictEqual(result5.scores.overall, 100);
  console.log('✅ Test 5 Passed\n');

  // Test 6: AI Deterministic Report Gate Override Protection
  console.log('Test 6: AI Report override protection...');
  const report = aiAnalystOrchestrator.buildDeterministicReport({
    commitSha: 'test-sha',
    branch: 'main',
    environment: 'test',
    metrics: {
      pages: 10,
      routes: 10,
      components: 10,
      buttons: 10,
      links: 10,
      forms: 10,
      apiEndpoints: 10,
      prismaModels: 10,
      e2eTests: 10
    },
    scores: {
      functional: 14,
      security: 100,
      api: 100,
      persistence: 100,
      e2e: 100,
      overall: 14
    },
    counts: {
      pass: 15,
      fail: 0,
      partial: 1,
      notTested: 97,
      p0: 0,
      p1: 0,
      p2: 0,
      p3: 0,
      discovered: 113
    },
    findings: []
  });

  assert.strictEqual(report.aiVerdict, 'NOT PRODUCTION READY');
  assert.ok(report.productionReadinessAssessment.includes('PRODUCTION READY smí vzniknout pouze tehdy'));
  console.log('✅ Test 6 Passed\n');

  console.log('🎉 ALL QA QUALITY GATE TESTS PASSED SUCCESSFULLY!');
}

// Auto run if executed directly
if (process.argv[1] && process.argv[1].includes('qaQualityGate.test')) {
  runQualityGateTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
