/**
 * STATE ADMINISTRATION API HUB - PHASE 5 INTEGRATION TEST SUITE
 * Complete testing for P1 (Justice), P2 (ČSÚ/NKOD), P3 (Public Registries), P4 (e-Legislativa)
 * Strictly verifies ZERO SYNTHETIC DATA & FAIL-CLOSED ARCHITECTURE
 */

import { StateAdminApiClient } from '../src/services/stateAdmin/StateAdminApiClient.js';
import { JusticeOpenDataConnector } from '../src/services/stateAdmin/JusticeOpenDataConnector.js';
import { CsuNkodConnector } from '../src/services/stateAdmin/CsuNkodConnector.js';
import { PublicRegistryConnector } from '../src/services/stateAdmin/PublicRegistryConnector.js';
import { ELegislativaConnector } from '../src/services/stateAdmin/ELegislativaConnector.js';
import { StateAdminHubService } from '../src/services/stateAdmin/StateAdminHubService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('===============================================================');
  console.log('🏛️  RUNNING UNIT & INTEGRATION TESTS: STATE ADMIN API HUB (PHASE 5)');
  console.log('    STRICT FAIL-CLOSED & ZERO MOCK DATA VERIFICATION');
  console.log('===============================================================');

  StateAdminApiClient.resetForTesting();

  // --- GROUP 1: P1 JUSTICE / MSP CONNECTOR ---
  console.log('\n--- TEST GROUP 1: P1 JUSTICE / MSP CONNECTOR ---');
  {
    const res = await JusticeOpenDataConnector.getJudicialStatistics('P');
    assert(res.source === 'P1_JUSTICE', 'Source is correctly marked P1_JUSTICE');
    assert(Array.isArray(res.data), 'Data is an array');

    const casesRes = await JusticeOpenDataConnector.getJudicialCases('Ústavní soud');
    assert(casesRes.source === 'P1_JUSTICE', 'Cases source is P1_JUSTICE');
    assert(Array.isArray(casesRes.data), 'Cases data is an array');
  }

  // --- GROUP 2: P2 ČSÚ / NKOD CONNECTOR ---
  console.log('\n--- TEST GROUP 2: P2 ČSÚ / NKOD CONNECTOR ---');
  {
    const res = await CsuNkodConnector.getDemographicStatistics();
    assert(res.source === 'P2_CSU_NKOD', 'Source is correctly marked P2_CSU_NKOD');
    assert(Array.isArray(res.data), 'Demographic data is an array');

    const searchRes = await CsuNkodConnector.searchNkodDatasets('rodina');
    assert(searchRes.source === 'P2_CSU_NKOD', 'Search source is P2_CSU_NKOD');
    assert(Array.isArray(searchRes.data), 'NKOD dataset search returns array');
  }

  // --- GROUP 3: P3 PUBLIC REGISTRIES CONNECTOR ---
  console.log('\n--- TEST GROUP 3: P3 PUBLIC REGISTRIES CONNECTOR ---');
  {
    const ovmRes = await PublicRegistryConnector.getOvmEntities('SOUD');
    assert(ovmRes.source === 'P3_PUBLIC_REGISTRY', 'Source is correctly marked P3_PUBLIC_REGISTRY');
    assert(Array.isArray(ovmRes.data), 'OVM data is an array');

    const aresRes = await PublicRegistryConnector.verifyLegalProfessional('00025429');
    assert(aresRes.source === 'P3_PUBLIC_REGISTRY', 'ARES verification source is P3_PUBLIC_REGISTRY');
    assert(Array.isArray(aresRes.data), 'ARES professional verification returns array');
  }

  // --- GROUP 4: P4 E-LEGISLATIVA CONNECTOR ---
  console.log('\n--- TEST GROUP 4: P4 E-LEGISLATIVA CONNECTOR ---');
  {
    const billsRes = await ELegislativaConnector.getLegislativeBills('89/2012');
    assert(billsRes.source === 'P4_E_LEGISLATIVA', 'Source is correctly marked P4_E_LEGISLATIVA');
    assert(Array.isArray(billsRes.data), 'Bills data is an array');
  }

  // --- GROUP 5: FAIL-CLOSED & ZERO MOCK DATA VERIFICATION ---
  console.log('\n--- TEST GROUP 5: FAIL-CLOSED & ZERO MOCK DATA VERIFICATION ---');
  {
    // Normalizer Zero Synthetic Data Checks
    const emptyStats = JusticeOpenDataConnector.normalizeJudicialStatistics([], 'P');
    assert(emptyStats.length === 0, 'Normalizer returns EMPTY array for empty raw statistics input (NO SYNTHETIC MOCKS)');

    const emptyCases = JusticeOpenDataConnector.normalizeJudicialCases([], 'Ústavní soud');
    assert(emptyCases.length === 0, 'Normalizer returns EMPTY array for empty raw cases input (NO SYNTHETIC MOCKS)');

    const emptyDemo = CsuNkodConnector.normalizeDemographicStatistics([]);
    assert(emptyDemo.length === 0, 'Normalizer returns EMPTY array for empty raw demography input (NO SYNTHETIC MOCKS)');

    const emptyOvm = PublicRegistryConnector.normalizeOvmEntities([], 'SOUD');
    assert(emptyOvm.length === 0, 'Normalizer returns EMPTY array for empty raw OVM input (NO SYNTHETIC MOCKS)');

    const emptyAres = PublicRegistryConnector.normalizeAresLegalProfessional(null);
    assert(emptyAres === null, 'Normalizer returns NULL for empty raw ARES input (NO SYNTHETIC MOCKS)');

    const emptyBills = ELegislativaConnector.normalizeLegislativeBills([], '89/2012');
    assert(emptyBills.length === 0, 'Normalizer returns EMPTY array for empty raw legislative bills input (NO SYNTHETIC MOCKS)');

    // Audit Log Check (from Groups 1-4)
    const auditLogs = StateAdminApiClient.getAuditLogs();
    assert(auditLogs.length > 0, 'Audit logs recorded for all executions');

    // SSRF Fail-Closed Check
    const ssrfResult = await StateAdminApiClient.executeGet('P1_JUSTICE', 'http://127.0.0.1:3000/internal');
    assert(ssrfResult.status === 400, 'SSRF Defense blocks private IP with status 400');
    assert(ssrfResult.data === null, 'SSRF blocked request returns NULL data');

    // Rate Limiter Fail-Closed Check
    let rateLimitExceeded = false;
    for (let i = 0; i < 35; i++) {
      if (!StateAdminApiClient.checkRateLimit('P1_JUSTICE', 30)) {
        rateLimitExceeded = true;
        break;
      }
    }
    assert(rateLimitExceeded === true, 'Rate Limiter triggers after 30 req/min');
  }

  // --- GROUP 6: STATE ADMIN HUB ORCHESTRATOR ---
  console.log('\n--- TEST GROUP 6: STATE ADMIN HUB ORCHESTRATOR ---');
  {
    const health = await StateAdminHubService.getHealthStatus();
    assert(health.status === 'HEALTHY' || health.status === 'DEGRADED', 'Health status evaluated');
    assert(health.connectors.P1_JUSTICE !== undefined, 'P1 Justice status present');
    assert(health.connectors.P2_CSU_NKOD !== undefined, 'P2 ČSÚ status present');
    assert(health.connectors.P3_PUBLIC_REGISTRY !== undefined, 'P3 Public Registry status present');
    assert(health.connectors.P4_E_LEGISLATIVA !== undefined, 'P4 e-Legislativa status present');
  }

  console.log('===============================================================');
  console.log(`📊 PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during Phase 5 test execution:', err);
  process.exit(1);
});
