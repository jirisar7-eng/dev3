import { runValidationNormalizationTests } from './esbirkaValidationNormalization.test';
import { runSyncEngineTests } from './esbirkaSyncEngine.test';
import { runSchedulerTests } from './esbirkaScheduler.test';
import { runPublicPortalTests } from './esbirkaPublicPortal.test';

async function runAll() {
  console.log('\n=============================================================');
  console.log('--- COMPREHENSIVE e-SBÍRKA / e-LEGISLATIVA TEST SUITE ---');
  console.log('=============================================================\n');

  console.log('>>> RUNNING VALIDATOR & NORMALIZER TESTS (ÚKOL 5/10)...');
  await runValidationNormalizationTests();

  console.log('\n>>> RUNNING SYNCHRONIZATION ENGINE TESTS (ÚKOL 6/10)...');
  const syncResults = await runSyncEngineTests();

  console.log('\n>>> RUNNING SCHEDULER & CONTROLLED SYNC TESTS (ÚKOL 7/10)...');
  const schedulerResults = await runSchedulerTests();

  console.log('\n>>> RUNNING PUBLIC PORTAL & READS TESTS (ÚKOL 9/10)...');
  const portalResults = await runPublicPortalTests();

  const totalFailed = syncResults.failed + schedulerResults.failed + portalResults.failed;
  const totalPassed = syncResults.passed + schedulerResults.passed + portalResults.passed;

  if (totalFailed > 0) {
    console.error(`\n❌ TEST SUITE FAILED: ${totalFailed} tests failed.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL TESTS PASSED: ${totalPassed} tests passed successfully across all tasks.`);
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
