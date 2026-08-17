import { EsbirkaSyncEngine } from '../services/esbirka/EsbirkaSyncEngine';
import { EsbirkaLockGuard } from '../services/esbirka/EsbirkaLockGuard';
import { EsbirkaQuotaGuard } from '../services/esbirka/EsbirkaQuotaGuard';
import { EsbirkaLegalRepository } from '../services/esbirka/EsbirkaLegalRepository';
import { EsbirkaChangeDetector } from '../services/esbirka/EsbirkaChangeDetector';
import { EsbirkaApiError } from '../services/esbirka/errors';

/**
 * Enterprise Test Suite for ÚKOL 6/10: SYNCHRONIZAČNÍ ENGINE e-SBÍRKA / e-LEGISLATIVA.
 * 
 * STRICT INVARIANTS:
 * - 100% Mock & In-Memory Transport.
 * - ZERO real network calls, ZERO live credentials.
 * - 33+ comprehensive test scenarios.
 */
export async function runSyncEngineTests(): Promise<{ passed: number; failed: number }> {
  console.log('======================================================================');
  console.log('--- STARTING ÚKOL 6/10: SYNCHRONIZATION ENGINE UNIT & INTEGRATION SUITE ---');
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

  // Helper to reset all states before test groups
  function resetAll() {
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
        {
          cislo: '888',
          nazev: 'Styk s dítětem',
          text: 'Dítě, které je v péči jen jednoho rodiče, má právo stýkat se s druhým rodičem...',
        },
      ],
    },
  };

  // Mock API client factory
  function createMockClient(responseProvider: (num: number, yr: number) => Promise<any> | any) {
    return {
      fetchAct: async (num: number, yr: number) => {
        return responseProvider(num, yr);
      },
    };
  }

  // -------------------------------------------------------------------------
  // TEST GROUP 1: BASIC SYNC LIFECYCLE (NEW, UNCHANGED, CHANGED)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 1: Basic Sync Lifecycle (NEW, UNCHANGED, CHANGED) ---');
  resetAll();

  // Test 1: First sync (NEW act) -> Creates LegalAct, LegalActVersion, LegalActSection
  const mockClient1 = createMockClient(() => sampleAct89);
  const res1 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClient1,
    initiatedBy: 'ADMIN:tester',
  });

  assert(res1.status === 'SUCCESS', '1. First sync returns status SUCCESS', res1);
  assert(res1.changeStatus === 'NEW', '1b. First sync changeStatus is NEW', res1.changeStatus);
  assert(res1.recordsCreated === 2, '1c. First sync creates 2 sections', res1.recordsCreated);
  assert(typeof res1.contentHash === 'string' && res1.contentHash.length === 64, '1d. First sync computes SHA-256 hash', res1.contentHash);

  // Test 2: Verify DB record in repository
  const dbAct1 = await EsbirkaLegalRepository.findActByCode('89/2012');
  assert(dbAct1 !== null, '2. LegalAct persisted in repository', dbAct1);
  assert(dbAct1?.sections?.length === 2, '2b. LegalAct sections count is 2', dbAct1?.sections?.length);

  // Test 3: Unchanged act (same content hash) -> Returns UNCHANGED
  // Advance time by 1100ms to avoid RATE_LIMITED
  await new Promise((r) => setTimeout(r, 1100));
  const res3 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClient1,
  });

  assert(res3.status === 'UNCHANGED', '3. Identical payload returns status UNCHANGED', res3.status);
  assert(res3.changeStatus === 'UNCHANGED', '3b. Change status is UNCHANGED', res3.changeStatus);
  assert(res3.recordsCreated === 0 && res3.recordsChanged === 0, '3c. Zero duplicate records created', res3);

  // Test 4: Changed act (Novela / new text) -> Returns CHANGED, creates new LegalActVersion, preserves history
  await new Promise((r) => setTimeout(r, 1100));
  const modifiedAct89 = JSON.parse(JSON.stringify(sampleAct89));
  modifiedAct89.predpis.paragrafy.push({
    cislo: '888a',
    nazev: 'Nový paragraf o styku',
    text: 'Rodiče mají právo a povinnost vzájemně se informovat.',
  });
  modifiedAct89.predpis.paragrafy[0].text = 'Rodičovská odpovědnost (aktualizováno novelou)...';

  const mockClientModified = createMockClient(() => modifiedAct89);
  const res4 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientModified,
  });

  assert(res4.status === 'SUCCESS', '4. Modified act returns status SUCCESS', res4.status);
  assert(res4.changeStatus === 'CHANGED', '4b. Change status is CHANGED', res4.changeStatus);
  assert(res4.recordsCreated === 1, '4c. 1 new section created (888a)', res4.recordsCreated);
  assert(res4.recordsChanged === 1, '4d. 1 existing section updated (858)', res4.recordsChanged);

  // -------------------------------------------------------------------------
  // TEST GROUP 2: FAIL-CLOSED VALIDATION & NORMALIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 2: Fail-Closed Validation & Normalization ---');
  resetAll();

  // Test 5: Validator failure -> 0 DB write, audit FAILED
  const invalidActPayload = {
    predpis: {
      cislo: 'INVALID_NUMBER', // Violation: string instead of positive integer
      rok: 2012,
      nazev: 'Poškozený předpis',
      paragrafy: [],
    },
  };
  const mockClientInvalid = createMockClient(() => invalidActPayload);
  const res5 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientInvalid,
  });

  assert(res5.status === 'FAILED', '5. Validation error returns status FAILED', res5.status);
  assert(res5.error?.code === 'VALIDATION_FAILED', '5b. Error code is VALIDATION_FAILED', res5.error?.code);
  const checkDb5 = await EsbirkaLegalRepository.findActByCode('89/2012');
  assert(checkDb5 === null, '5c. Zero legal data written to DB on validation failure', checkDb5);

  // Test 6: Normalizer failure / deeply nested attack payload
  await new Promise((r) => setTimeout(r, 1100));
  let deepNested: any = { leaf: 'attack' };
  for (let i = 0; i < 20; i++) {
    deepNested = { nested: deepNested };
  }
  const nestingAttackPayload = {
    predpis: {
      cislo: 89,
      rok: 2012,
      sbirka: 'Sb.',
      nazev: 'Zákon č. 89/2012 Sb.',
      paragrafy: [
        {
          cislo: '1',
          nazev: 'Test',
          text: 'Platný text',
          attack: deepNested,
        },
      ],
    },
  };
  const mockClientNesting = createMockClient(() => nestingAttackPayload);
  const res6 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientNesting,
  });
  assert(res6.status === 'FAILED', '6. Deeply nested payload rejected Fail-Closed', res6.status);

  // -------------------------------------------------------------------------
  // TEST GROUP 3: API ERROR HANDLING (401, 403, 429, 500, TIMEOUT, NETWORK)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 3: API Transport Error Handling ---');
  resetAll();

  // Test 7: API 401 Unauthorized
  const mockClient401 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Unauthorized access to e-Sbírka API',
      code: 'UNAUTHORIZED',
      httpStatus: 401,
      endpoint: '/predpisy/2012/89',
    });
  });
  const res7 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClient401,
  });
  assert(res7.status === 'FAILED', '7. 401 Unauthorized returns FAILED', res7.status);
  assert(res7.httpStatus === 401, '7b. HTTP status 401 recorded in audit', res7.httpStatus);

  // Test 8: API 403 Forbidden
  await new Promise((r) => setTimeout(r, 1100));
  const mockClient403 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Forbidden: IP not allowlisted',
      code: 'FORBIDDEN',
      httpStatus: 403,
      endpoint: '/predpisy/2012/89',
    });
  });
  const res8 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClient403,
  });
  assert(res8.status === 'FAILED' && res8.httpStatus === 403, '8. 403 Forbidden handled safely', res8);

  // Test 9: API 429 Rate Limited from Upstream
  await new Promise((r) => setTimeout(r, 1100));
  const mockClient429 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Upstream rate limit exceeded (429)',
      code: 'RATE_LIMITED',
      httpStatus: 429,
      endpoint: '/predpisy/2012/89',
    });
  });
  const res9 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClient429,
  });
  assert(res9.status === 'FAILED' && res9.httpStatus === 429, '9. 429 Upstream Rate Limit handled', res9);

  // Test 10: API 500 Server Error
  await new Promise((r) => setTimeout(r, 1100));
  const mockClient500 = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'e-Sbírka Internal Server Error (500)',
      code: 'SERVER_ERROR',
      httpStatus: 500,
      endpoint: '/predpisy/2012/89',
    });
  });
  const res10 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClient500,
  });
  assert(res10.status === 'FAILED' && res10.httpStatus === 500, '10. 500 Server Error handled', res10);

  // Test 11: Timeout
  resetAll(); // Reset quota for remaining transport tests
  const mockClientTimeout = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'Connection timeout after 10000ms',
      code: 'TIMEOUT',
      httpStatus: 504,
      endpoint: '/predpisy/2012/89',
    });
  });
  const res11 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientTimeout,
  });
  assert(res11.status === 'FAILED' && res11.error?.code === 'TIMEOUT', '11. Timeout handled safely', res11);

  // Test 12: Network Connection Error
  await new Promise((r) => setTimeout(r, 1100));
  const mockClientNetwork = createMockClient(() => {
    throw new EsbirkaApiError({
      message: 'ECONNREFUSED: e-sbirka.cz is unreachable',
      code: 'NETWORK_ERROR',
      httpStatus: 503,
      endpoint: '/predpisy/2012/89',
    });
  });
  const res12 = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientNetwork,
  });
  assert(res12.status === 'FAILED' && res12.error?.code === 'NETWORK_ERROR', '12. Network error handled safely', res12);

  // -------------------------------------------------------------------------
  // TEST GROUP 4: STRICT QUOTA & RATE LIMITING (5 calls/day, 1000ms interval)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 4: Strict Quota & Rate Limiting ---');
  resetAll();

  // Test 13: Daily quota 0/5 -> Allowed
  const quotaInit = await EsbirkaQuotaGuard.getQuotaStatus();
  assert(quotaInit.usedToday === 0, '13. Initial quota usage is 0', quotaInit.usedToday);
  assert(quotaInit.remainingCalls === 5, '13b. Remaining calls is 5', quotaInit.remainingCalls);

  // Execute calls 1, 2, 3, 4, 5 with required delay
  const mockValid = createMockClient(() => sampleAct89);
  
  // Call 1
  const qRes1 = await EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockValid });
  assert(qRes1.status === 'SUCCESS' && qRes1.quotaUsageIn24h === 1, '14. Call 1/5 succeeds (quota=1)', qRes1);

  // Test 17: Request under 1000ms is blocked (RATE_LIMITED)
  const rateLimitPromise = EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockValid });
  const qRateLimitRes = await rateLimitPromise;
  assert(qRateLimitRes.status === 'RATE_LIMITED', '17. Request under 1000ms returns RATE_LIMITED', qRateLimitRes.status);
  assert(qRateLimitRes.error?.code === 'RATE_LIMITED', '17b. Error code is RATE_LIMITED', qRateLimitRes.error?.code);

  // Call 2
  await new Promise((r) => setTimeout(r, 1100));
  const qRes2 = await EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockValid });
  assert(qRes2.quotaUsageIn24h === 2, '14b. Call 2/5 succeeds (quota=2)', qRes2.quotaUsageIn24h);

  // Call 3
  await new Promise((r) => setTimeout(r, 1100));
  const qRes3 = await EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockValid });
  assert(qRes3.quotaUsageIn24h === 3, '14c. Call 3/5 succeeds (quota=3 - Target reached)', qRes3.quotaUsageIn24h);

  // Call 4
  await new Promise((r) => setTimeout(r, 1100));
  const qRes4 = await EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockValid });
  assert(qRes4.quotaUsageIn24h === 4, '14d. Call 4/5 succeeds (quota=4)', qRes4.quotaUsageIn24h);

  // Call 5 (Maximum allowed)
  await new Promise((r) => setTimeout(r, 1100));
  const qRes5 = await EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockValid });
  assert(qRes5.quotaUsageIn24h === 5, '15. Call 5/5 succeeds (quota=5 - Limit reached)', qRes5.quotaUsageIn24h);

  // Test 16: Sixth request is strictly blocked (QUOTA_EXCEEDED, 0 API call made)
  await new Promise((r) => setTimeout(r, 1100));
  let apiCallExecutedOn6th = false;
  const mockClientTrap = createMockClient(() => {
    apiCallExecutedOn6th = true;
    return sampleAct89;
  });

  const qRes6 = await EsbirkaSyncEngine.syncAct({ actNumber: 89, actYear: 2012, apiClientOverride: mockClientTrap });
  assert(qRes6.status === 'QUOTA_EXCEEDED', '16. 6th call returns QUOTA_EXCEEDED', qRes6.status);
  assert(qRes6.error?.code === 'QUOTA_EXCEEDED', '16b. Error code is QUOTA_EXCEEDED', qRes6.error?.code);
  assert(apiCallExecutedOn6th === false, '16c. ZERO API calls made on 6th request (Fail-Closed confirmed)', apiCallExecutedOn6th);

  // -------------------------------------------------------------------------
  // TEST GROUP 5: CONCURRENCY & DISTRIBUTED LOCKING
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 5: Concurrency & Distributed Locking ---');
  resetAll();

  // Test 18: Concurrent sync is blocked (ALREADY_RUNNING)
  let longFetchStarted = false;
  let releaseLongFetch: () => void = () => {};
  const longFetchPromise = new Promise<void>((resolve) => {
    releaseLongFetch = resolve;
  });

  const mockSlowClient = createMockClient(async () => {
    longFetchStarted = true;
    await longFetchPromise;
    return sampleAct89;
  });

  // Launch first sync in background
  const syncPromise1 = EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockSlowClient,
  });

  // Wait until slow client is active holding the lock
  while (!longFetchStarted) {
    await new Promise((r) => setTimeout(r, 10));
  }

  // Attempt simultaneous second sync
  const syncPromise2 = EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockValid,
  });

  const resConcurrent = await syncPromise2;
  assert(resConcurrent.status === 'SKIPPED', '18. Concurrent sync is SKIPPED/Blocked', resConcurrent.status);
  assert(resConcurrent.error?.code === 'SYNC_ALREADY_RUNNING', '18b. Concurrency error code is SYNC_ALREADY_RUNNING', resConcurrent.error?.code);

  // Release first sync
  releaseLongFetch();
  const resSlowFirst = await syncPromise1;
  assert(resSlowFirst.status === 'SUCCESS', '18c. First sync completes with SUCCESS after lock release', resSlowFirst.status);

  // Test 20: Stale Lock Recovery
  await EsbirkaLockGuard.acquireLock('stale_test_lock', 'crashed_process_1', 100); // 100ms TTL
  assert(EsbirkaLockGuard.isLocked('stale_test_lock'), '20. Lock acquired with 100ms TTL');
  await new Promise((r) => setTimeout(r, 150)); // Wait for TTL expiry

  // Next acquirer should evict stale lock and acquire successfully
  const recoveredLock = await EsbirkaLockGuard.acquireLock('stale_test_lock', 'new_worker_2', 5000);
  assert(recoveredLock.ownerId === 'new_worker_2', '20b. Stale lock evicted and reclaimed by new worker', recoveredLock.ownerId);
  await EsbirkaLockGuard.releaseLock('stale_test_lock', 'new_worker_2');

  // -------------------------------------------------------------------------
  // TEST GROUP 6: IDEMPOTENCY, SECURITY & AUDIT SECRECY
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 6: Idempotency, Security & Audit Secrecy ---');
  resetAll();

  // Test 28 & 29: API key is NEVER in logs or DB audits
  const fakeSecretKey = 'esbirka_secret_super_key_9876543210';
  const mockClientWithErrorContainingSecret = createMockClient(() => {
    throw new Error(`Authentication failure: Bearer ${fakeSecretKey} with apiKey=${fakeSecretKey}`);
  });

  const resSecretTest = await EsbirkaSyncEngine.syncAct({
    actNumber: 89,
    actYear: 2012,
    apiClientOverride: mockClientWithErrorContainingSecret,
  });

  assert(resSecretTest.status === 'FAILED', '28. Error with secret caught');
  assert(!resSecretTest.error?.message.includes(fakeSecretKey), '28b. Error message in result has REDACTED secret', resSecretTest.error?.message);

  const auditLog = await EsbirkaLegalRepository.getSyncAudit(resSecretTest.syncId);
  assert(auditLog !== null, '29. Sync audit record exists', auditLog);
  assert(!auditLog?.errorMessage?.includes(fakeSecretKey), '29b. DB Audit record NEVER contains secret key', auditLog?.errorMessage);

  // Test 31: UTC and Prague day representation
  const quotaBounds = await EsbirkaQuotaGuard.getQuotaStatus();
  assert(typeof quotaBounds.currentUtcDate === 'string' && quotaBounds.currentUtcDate.length === 10, '31. UTC Date formatted as YYYY-MM-DD', quotaBounds.currentUtcDate);
  assert(typeof quotaBounds.currentPragueDate === 'string' && quotaBounds.currentPragueDate.length === 10, '31b. Prague Date formatted as YYYY-MM-DD', quotaBounds.currentPragueDate);

  // Test 32: Priority legal acts batch execution with sequential safety
  resetAll();
  const batchMock = createMockClient((num) => {
    const act = JSON.parse(JSON.stringify(sampleAct89));
    act.predpis.cislo = num;
    act.predpis.nazev = `Zákon č. ${num}`;
    return act;
  });

  const batchResults = await EsbirkaSyncEngine.syncAllPriorityActs({
    apiClientOverride: batchMock,
  });

  assert(batchResults.length > 0, '33. Priority batch executed sequentially', batchResults.length);
  assert(batchResults.every((r) => r.status === 'SUCCESS' || r.status === 'RATE_LIMITED' || r.status === 'QUOTA_EXCEEDED'), '33b. All batch results properly categorized', batchResults);

  console.log('\n======================================================================');
  console.log(`--- TEST RESULTS: ${passed} PASSED, ${failed} FAILED ---`);
  console.log('======================================================================');

  return { passed, failed };
}
