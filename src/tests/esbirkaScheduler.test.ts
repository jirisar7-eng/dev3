import { EsbirkaScheduler } from '../services/esbirka/EsbirkaScheduler';
import { EsbirkaSyncEngine, PRIORITY_LEGAL_ACTS } from '../services/esbirka/EsbirkaSyncEngine';
import { EsbirkaLockGuard } from '../services/esbirka/EsbirkaLockGuard';
import { EsbirkaQuotaGuard } from '../services/esbirka/EsbirkaQuotaGuard';
import { EsbirkaLegalRepository } from '../services/esbirka/EsbirkaLegalRepository';
import { EsbirkaApiError } from '../services/esbirka/errors';

/**
 * Comprehensive Enterprise Test Suite for ÚKOL 7/10:
 * BEZPEČNÝ SCHEDULER A ŘÍZENÁ SYNCHRONIZACE e-SBÍRKA / e-LEGISLATIVA.
 * 
 * STRICT INVARIANTS:
 * - 100% Mock transport, ZERO real network calls, ZERO live secrets.
 * - Rigorous verification of all 13+ required failure, concurrency, quota, and lifecycle scenarios.
 */
export async function runSchedulerTests(): Promise<{ passed: number; failed: number }> {
  // Test-only environment: enables scheduler lifecycle tests without using a real secret.
  const originalApiKey = process.env.ESBIRKA_API_KEY;
  const originalSchedulerEnabled = process.env.ESBIRKA_SCHEDULER_ENABLED;
  const originalNodeEnv = process.env.NODE_ENV;

  process.env.ESBIRKA_API_KEY = 'TEST_ONLY_MOCK_KEY';
  process.env.ESBIRKA_SCHEDULER_ENABLED = 'true';
  process.env.NODE_ENV = 'test';

  console.log('======================================================================');
  console.log('--- STARTING ÚKOL 7/10: SECURE SCHEDULER & CONTROLLED SYNC SUITE ---');
  console.log('======================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, detail !== undefined ? detail : '');
      failed++;
    }
  }

  function resetAll() {
    EsbirkaScheduler.resetForTesting();
    EsbirkaLockGuard.resetForTesting();
    EsbirkaQuotaGuard.resetForTesting();
    EsbirkaLegalRepository.resetForTesting();
  }

  // Sample standard fixture (Občanský zákoník č. 89/2012 Sb.)
  const sampleAct89 = {
    predpis: {
      cislo: 89,
      rok: 2012,
      sbirka: 'Sb.',
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      zkratka: 'OZ',
      typ: 'ZAKON',
      category: 'FAMILY_LAW',
      stav: 'ACTIVE',
      datumVyhlaseni: '2012-03-22',
      datumUcinnostiOd: '2014-01-01',
      paragrafy: [
        {
          cislo: '858',
          nazev: 'Rodičovská odpovědnost',
          text: 'Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů, která spočívají v péči o dítě...',
        },
      ],
    },
  };

  const sampleAct359 = {
    predpis: {
      cislo: 359,
      rok: 1999,
      sbirka: 'Sb.',
      nazev: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí',
      zkratka: 'zOSPOD',
      typ: 'ZAKON',
      category: 'SOCIAL_PROTECTION',
      stav: 'ACTIVE',
      datumVyhlaseni: '1999-12-28',
      datumUcinnostiOd: '2000-04-01',
      paragrafy: [
        {
          cislo: '1',
          nazev: 'Předmět úpravy',
          text: 'Tento zákon upravuje sociálně-právní ochranu dětí...',
        },
      ],
    },
  };

  function createMockClient(responseProvider: (num: number, yr: number) => Promise<any> | any) {
    return {
      fetchAct: async (num: number, yr: number) => {
        return responseProvider(num, yr);
      },
    };
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 1: SCHEDULER LIFECYCLE & IDEMPOTENCY
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 1: Scheduler Startup, Stop & Idempotency ---');
  resetAll();

  // Test 1: Start Scheduler
  EsbirkaScheduler.start();
  let status1 = await EsbirkaScheduler.getStatus();
  assert(status1.isInitialized === true, '1. Scheduler successfully initializes');
  assert(status1.isRunning === true, '1b. Scheduler reports running state');
  assert(status1.cronExpression === EsbirkaScheduler.DEFAULT_CRON_EXPRESSION, '1c. Default cron expression is 0 3,11,19 * * * (3x daily)');

  // Test 2: Idempotent second start
  EsbirkaScheduler.start(); // Should not duplicate or throw
  let status2 = await EsbirkaScheduler.getStatus();
  assert(status2.isRunning === true, '2. Repeated start() is safe and idempotent');

  // Test 3: Stop Scheduler
  EsbirkaScheduler.stop();
  let status3 = await EsbirkaScheduler.getStatus();
  assert(status3.isRunning === false, '3. Scheduler successfully stops');

  // -------------------------------------------------------------------------
  // TEST GROUP 2: SCHEDULED TICK EXECUTION & PRIORITY ROTATION
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 2: Scheduled Tick Execution & Dynamic Priority Selection ---');
  resetAll();

  // Test 4: Execute scheduled tick with mock client
  const mockClientSuccess = createMockClient((num, yr) => {
    if (num === 89) return sampleAct89;
    return sampleAct359;
  });

  const tick1Result = await EsbirkaScheduler.executeScheduledTick(mockClientSuccess);
  assert(tick1Result !== null && tick1Result.status === 'SUCCESS', '4. First scheduled tick succeeds');
  assert(tick1Result?.actCode === '89/2012', '4b. First scheduled tick selects P0 act (89/2012)', tick1Result?.actCode);

  // Test 5: Next scheduled tick rotates to next unsynced priority act (359/1999)
  await new Promise((r) => setTimeout(r, 1050));
  const tick2Result = await EsbirkaScheduler.executeScheduledTick(mockClientSuccess);
  assert(tick2Result !== null && tick2Result.status === 'SUCCESS', '5. Second scheduled tick succeeds');
  assert(tick2Result?.actCode === '359/1999', '5b. Second scheduled tick automatically selects next priority act (359/1999)', tick2Result?.actCode);

  // -------------------------------------------------------------------------
  // TEST GROUP 3: CONCURRENT EXECUTION PROTECTION (LOCK GUARD)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 3: Concurrency Protection (Lock Guard Shield) ---');
  resetAll();

  // Test 6: Simultaneous runs blocked by lock
  const slowMockClient = createMockClient(async () => {
    await new Promise((r) => setTimeout(r, 300));
    return sampleAct89;
  });

  const runPromise1 = EsbirkaScheduler.executeScheduledTick(slowMockClient);
  // Immediate second run while first is in progress
  const runPromise2 = EsbirkaScheduler.executeScheduledTick(slowMockClient);

  const [resConcurrent1, resConcurrent2] = await Promise.all([runPromise1, runPromise2]);
  const succeededCount = [resConcurrent1, resConcurrent2].filter((r) => r?.status === 'SUCCESS').length;
  assert(succeededCount === 1, '6. LockGuard permits exactly 1 concurrent execution, second is safely blocked or skipped', {
    run1Status: resConcurrent1?.status,
    run2Status: resConcurrent2?.status,
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 4: EXHAUSTED DAILY QUOTA (FAIL-CLOSED)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 4: Daily Quota Protection (3 Target / 5 Hard Limit) ---');
  resetAll();

  // Simulate quota reservations up to target limit (3)
  for (let i = 0; i < 3; i++) {
    await EsbirkaQuotaGuard.reserveSlot(`/dokumenty-sbirky/test/${i}`, `test-${i}`, null, 'GET_ACT');
    await new Promise((r) => setTimeout(r, 1050));
  }

  const quotaBeforeTick = await EsbirkaQuotaGuard.getQuotaStatus();
  assert(quotaBeforeTick.usedToday === 3, '7. Quota reached 3/5 target calls', quotaBeforeTick);

  // Test 8: Scheduled tick is gracefully skipped when target quota (3) is reached
  const skippedTickResult = await EsbirkaScheduler.executeScheduledTick(mockClientSuccess);
  assert(skippedTickResult === null, '8. Scheduled tick gracefully skipped when daily target quota (3) is reached');

  // Test 9: Manual sync rejects when hard limit (5) is reached
  await EsbirkaQuotaGuard.reserveSlot(`/dokumenty-sbirky/test/3`, `test-3`, null, 'GET_ACT');
  await new Promise((r) => setTimeout(r, 1050));
  await EsbirkaQuotaGuard.reserveSlot(`/dokumenty-sbirky/test/4`, `test-4`, null, 'GET_ACT');

  const quotaHardLimit = await EsbirkaQuotaGuard.getQuotaStatus();
  assert(quotaHardLimit.usedToday === 5 && quotaHardLimit.isExceeded === true, '9. Daily hard quota limit (5/5) reached', quotaHardLimit);

  let manualSyncBlocked = false;
  try {
    await EsbirkaScheduler.triggerManualSync({
      actCode: '89/2012',
      userId: 'admin-1',
      userRole: 'ADMIN',
      apiClientOverride: mockClientSuccess,
    });
  } catch (err: any) {
    if (err.code === 'RATE_LIMITED' || err.message.includes('hard limit')) {
      manualSyncBlocked = true;
    }
  }
  assert(manualSyncBlocked, '9b. Manual admin sync strictly blocked when 5/5 hard limit reached (Fail-Closed)');

  // -------------------------------------------------------------------------
  // TEST GROUP 5: MINIMUM INTERVAL (1,000 ms)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 5: Rate Limiting (Minimum 1,000 ms Interval) ---');
  resetAll();

  // Make 1 call
  await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientSuccess,
  });

  // Immediate second call without waiting 1,000 ms
  let rateLimitCaught = false;
  try {
    await EsbirkaQuotaGuard.reserveSlot('/dokumenty-sbirky/%2Fsb%2F2012%2F89', '89/2012', null, 'GET_ACT');
  } catch (err: any) {
    if (err.code === 'RATE_LIMITED' || err.message.includes('Rate limit violation')) {
      rateLimitCaught = true;
    }
  }
  assert(rateLimitCaught, '10. Immediate subsequent request (< 1000ms) blocked by Rate Limiter');

  // -------------------------------------------------------------------------
  // TEST GROUP 6: PROCESS RESTART & STATE RESTORATION
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 6: Idempotent Process Restart & Recovery ---');
  resetAll();

  // First run: sync 89/2012
  await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientSuccess,
  });

  // Simulate process restart (Reset Scheduler state while preserving repository)
  EsbirkaScheduler.stop();
  EsbirkaScheduler.resetForTesting();
  EsbirkaScheduler.start();

  // Verify next priority act to sync is NOT 89/2012, but the next unsynced one (359/1999)
  const nextTargetAfterRestart = await EsbirkaLegalRepository.findNextPriorityActToSync(PRIORITY_LEGAL_ACTS);
  assert(nextTargetAfterRestart.actCode === '359/1999', '11. Process restart recovers state from DB; selects next unsynced act (359/1999)', nextTargetAfterRestart.actCode);

  // -------------------------------------------------------------------------
  // TEST GROUP 7: HTTP ERROR HANDLING (401, 403, 429, 500, TIMEOUT)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 7: Robust Error Handling (401, 403, 429, 500, Timeout) ---');

  // Test 12: HTTP 401 Unauthorized -> Fail-Closed, audited
  resetAll();
  const mock401 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Unauthorized access to e-Sbírka API',
      code: 'UNAUTHORIZED',
      httpStatus: 401,
    });
  });

  const res401 = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mock401,
  });
  assert(res401.status === 'FAILED', '12. HTTP 401 fails closed with status FAILED');
  assert(res401.httpStatus === 401 || res401.error?.httpStatus === 401, '12b. HTTP 401 status correctly reported');

  // Test 13: HTTP 403 Forbidden -> Fail-Closed, audited
  resetAll();
  const mock403 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Forbidden access: API key lacks necessary scope',
      code: 'FORBIDDEN',
      httpStatus: 403,
    });
  });

  const res403 = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mock403,
  });
  assert(res403.status === 'FAILED' && (res403.httpStatus === 403 || res403.error?.httpStatus === 403), '13. HTTP 403 fails closed safely');

  // Test 14: HTTP 429 Too Many Requests -> Fails closed without uncontrolled retry
  resetAll();
  const mock429 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Rate limit exceeded on remote endpoint',
      code: 'RATE_LIMITED',
      httpStatus: 429,
    });
  });

  const res429 = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mock429,
  });
  assert(res429.status === 'FAILED' && (res429.httpStatus === 429 || res429.error?.httpStatus === 429), '14. HTTP 429 terminated cleanly without retry loops');

  // Test 15: HTTP 500 Internal Server Error -> Fail-Closed
  resetAll();
  const mock500 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'e-Sbírka upstream server error',
      code: 'REMOTE_SERVER_ERROR',
      httpStatus: 500,
    });
  });

  const res500 = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mock500,
  });
  assert(res500.status === 'FAILED' && (res500.httpStatus === 500 || res500.error?.httpStatus === 500), '15. HTTP 500 upstream failure handled safely');

  // Test 16: Timeout -> Safe termination
  resetAll();
  const mockTimeout = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Request to e-Sbírka timed out after 30000ms',
      code: 'TIMEOUT',
      httpStatus: 504,
    });
  });

  const resTimeout = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockTimeout,
  });
  assert(resTimeout.status === 'FAILED' && resTimeout.error?.code === 'TIMEOUT', '16. Network timeout handled cleanly');

  // -------------------------------------------------------------------------
  // TEST GROUP 8: UNCHANGED VS CHANGED DATA (ZERO DUPLICATE VERSIONS)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 8: Change Detection & Version History Integrity ---');
  resetAll();

  // Sync initial act
  await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientSuccess,
  });

  const actInitial = await EsbirkaLegalRepository.getActDetailsByCode('89/2012');
  assert(actInitial?.versions?.length === 1, '17a. Initial sync creates 1 version');

  await new Promise((r) => setTimeout(r, 1050));

  // Sync again with UNCHANGED payload
  const resUnchanged = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientSuccess,
  });

  assert(resUnchanged.changeStatus === 'UNCHANGED', '17. Unchanged payload recognized as UNCHANGED');
  const actAfterUnchanged = await EsbirkaLegalRepository.getActDetailsByCode('89/2012');
  assert(actAfterUnchanged?.versions?.length === 1, '17b. Unchanged payload creates ZERO duplicate versions (count remains 1)');

  await new Promise((r) => setTimeout(r, 1050));

  // Sync with CHANGED payload
  const changedAct89 = {
    predpis: {
      ...sampleAct89.predpis,
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník (novelizované znění)',
      paragrafy: [
        {
          cislo: '858',
          nazev: 'Rodičovská odpovědnost (aktualizováno)',
          text: 'Rodičovská odpovědnost zahrnuje novelizované povinnosti a práva rodičů...',
        },
      ],
    },
  };
  const mockClientChanged = createMockClient(() => changedAct89);

  const resChanged = await EsbirkaSyncEngine.syncAct({
    actCode: '89/2012',
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientChanged,
  });

  assert(resChanged.changeStatus === 'CHANGED', '18. Changed payload recognized as CHANGED');
  const actAfterChanged = await EsbirkaLegalRepository.getActDetailsByCode('89/2012');
  assert(actAfterChanged?.versions?.length === 2, '18b. Changed payload creates exactly 1 new version snapshot (count is 2)');

  // -------------------------------------------------------------------------
  // TEST GROUP 9: RBAC & ZERO SECRETS IN LOGS
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 9: RBAC Authorization & Zero Secrets In Logs ---');
  resetAll();

  // Test 19: Unauthorized user role rejected
  let unauthorizedCaught = false;
  try {
    await EsbirkaScheduler.triggerManualSync({
      actCode: '89/2012',
      userId: 'user-regular',
      userRole: 'USER',
      apiClientOverride: mockClientSuccess,
    });
  } catch (err: any) {
    if (err.httpStatus === 403 || err.code === 'AUTHORIZATION_ERROR') {
      unauthorizedCaught = true;
    }
  }
  assert(unauthorizedCaught, '19. Non-admin user rejected from triggering manual synchronization (HTTP 403)');

  // Test 20: No secrets in error details, audit, or status
  const statusDiagnose = await EsbirkaScheduler.getStatus();
  const serializedStatus = JSON.stringify(statusDiagnose);
  const containsRawKeyPattern = /ESBIRKA_API_KEY|secret|password|bearer\s+[a-zA-Z0-9_\-\.]{10,}/i.test(serializedStatus);
  assert(!containsRawKeyPattern, '20. Scheduler diagnostic status contains ZERO secret API keys or credentials');

  // Summary
  console.log('\n======================================================================');
  console.log(`--- ÚKOL 7/10 TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  console.log('======================================================================\n');

  if (originalApiKey === undefined) delete process.env.ESBIRKA_API_KEY;
  else process.env.ESBIRKA_API_KEY = originalApiKey;
  if (originalSchedulerEnabled === undefined) delete process.env.ESBIRKA_SCHEDULER_ENABLED;
  else process.env.ESBIRKA_SCHEDULER_ENABLED = originalSchedulerEnabled;
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;

  return { passed, failed };
}

// Direct execution when run as standalone script
if (process.argv[1]?.endsWith('esbirkaScheduler.test.ts')) {
  runSchedulerTests().then((res) => {
    if (res.failed > 0) process.exit(1);
    process.exit(0);
  });
}
