/**
 * STATE ADMINISTRATION API HUB - PHASE 5 & 6 INTEGRATION & CONTRACT TEST SUITE
 * Complete testing for P1 (Justice), P2 (ČSÚ/NKOD), P3 (Public Registries), P4 (e-Legislativa)
 * Strictly verifies ZERO SYNTHETIC DATA, FAIL-CLOSED & OFFICIAL API CONTRACTS
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
  console.log('🏛️  RUNNING CONTRACT & INTEGRATION TESTS: STATE ADMIN API HUB');
  console.log('    STRICT FAIL-CLOSED & ZERO MOCK DATA VERIFICATION');
  console.log('===============================================================');

  StateAdminApiClient.resetForTesting();

  // --- GROUP 1: P1 JUSTICE / MSP CONNECTOR ---
  console.log('\n--- TEST GROUP 1: P1 JUSTICE / MSP CONNECTOR ---');
  {
    // Judicial Statistics is BLOCKED/NOT_IMPLEMENTED (no dataset in NKOD SPARQL)
    const res = await JusticeOpenDataConnector.getJudicialStatistics('P');
    assert(res.source === 'P1_JUSTICE', 'Source is correctly marked P1_JUSTICE');
    assert(res.success === false, 'Blocked statistics connector returns success=false');
    assert(res.httpStatus === 501, 'Blocked statistics connector returns HTTP 501');
    assert(res.error?.code === 'SOURCE_BLOCKED_NOT_IMPLEMENTED', 'Error code is SOURCE_BLOCKED_NOT_IMPLEMENTED');
    assert(res.data.length === 0, 'Blocked statistics returns empty data array (NO MOCKS)');

    // Judicial Cases via SPARQL
    const casesRes = await JusticeOpenDataConnector.getJudicialCases('Ústavní soud');
    assert(casesRes.source === 'P1_JUSTICE', 'Cases source is P1_JUSTICE');
    assert(casesRes.success === true, 'Judicial cases SPARQL call returned success=true');
    assert(casesRes.httpStatus === 200, 'Judicial cases SPARQL returned HTTP 200');
    assert(Array.isArray(casesRes.data), 'Cases data is an array');
    assert(casesRes.data.length > 0, `Judicial cases found via SPARQL (count: ${casesRes.data.length})`);
    assert(casesRes.data[0]?.title !== '', 'First judicial case has non-empty title');
    assert(typeof casesRes.data[0]?.publishedAt === 'string', 'First judicial case has publishedAt date string');
  }

  // --- GROUP 2: P2 ČSÚ / NKOD CONNECTOR ---
  console.log('\n--- TEST GROUP 2: P2 ČSÚ / NKOD CONNECTOR ---');
  {
    const res = await CsuNkodConnector.getDemographicStatistics();
    assert(res.source === 'P2_CSU_NKOD', 'Source is correctly marked P2_CSU_NKOD');
    assert(res.success === true, 'Demographic statistics SPARQL returned success=true');
    assert(res.httpStatus === 200, 'Demographic statistics SPARQL returned HTTP 200');
    assert(Array.isArray(res.data), 'Demographic data is an array');
    assert(res.data.length > 0, `Demographic datasets found via SPARQL (count: ${res.data.length})`);
    assert(res.data[0]?.title !== '', 'First demographic item has non-empty title');
    assert(res.data[0]?.unit === 'DCAT-AP', 'Demographic payload has valid DCAT-AP format metadata');

    const searchRes = await CsuNkodConnector.searchNkodDatasets('rodina');
    assert(searchRes.source === 'P2_CSU_NKOD', 'Search source is P2_CSU_NKOD');
    assert(searchRes.success === true, 'NKOD dataset search SPARQL returned success=true');
    assert(searchRes.httpStatus === 200, 'NKOD dataset search SPARQL returned HTTP 200');
    assert(Array.isArray(searchRes.data), 'NKOD dataset search returns array');
    assert(searchRes.data.length > 0, `NKOD datasets found for "rodina" (count: ${searchRes.data.length})`);
    assert(searchRes.data[0]?.title !== '', 'First NKOD dataset item has non-empty title');
  }

  // --- GROUP 3: P3 PUBLIC REGISTRIES CONNECTOR ---
  console.log('\n--- TEST GROUP 3: P3 PUBLIC REGISTRIES CONNECTOR ---');
  {
    const ovmRes = await PublicRegistryConnector.getOvmEntities('SOUD');
    assert(ovmRes.source === 'P3_PUBLIC_REGISTRY', 'Source is correctly marked P3_PUBLIC_REGISTRY');
    assert(ovmRes.success === true, 'OVM entities SPARQL returned success=true');
    assert(ovmRes.httpStatus === 200, 'OVM entities SPARQL returned HTTP 200');
    assert(Array.isArray(ovmRes.data), 'OVM data is an array');
    assert(ovmRes.data.length > 0, `OVM datasets found via SPARQL (count: ${ovmRes.data.length})`);
    assert(ovmRes.data[0]?.name !== '', 'First OVM entity has non-empty name');

    // ARES v3 verification via SPARQL
    const aresRes = await PublicRegistryConnector.verifyLegalProfessional('00025429');
    assert(aresRes.source === 'P3_PUBLIC_REGISTRY', 'ARES verification source is P3_PUBLIC_REGISTRY');
    assert(aresRes.success === true, 'ARES v3 verification returned success=true');
    assert(aresRes.httpStatus === 200, 'ARES v3 verification returned HTTP 200');
    assert(Array.isArray(aresRes.data), 'ARES professional verification returns array');
    assert(aresRes.data.length === 1, 'ARES verification returns exactly 1 subject');
    assert(aresRes.data[0].isVerified === true, 'Subject verified in ARES v3');
  }

  // --- GROUP 4: P4 E-LEGISLATIVA CONNECTOR ---
  console.log('\n--- TEST GROUP 4: P4 E-LEGISLATIVA CONNECTOR ---');
  {
    const apiKey = process.env.ESBIRKA_API_KEY || '';
    if (!apiKey) {
      console.log('  ⚠️  BLOCKED: ESBIRKA_API_KEY NOT CONFIGURED (Testing Fail-Closed behavior)');
      const billsRes = await ELegislativaConnector.getLegislativeBills('89/2012');
      assert(billsRes.source === 'P4_E_LEGISLATIVA', 'Source is correctly marked P4_E_LEGISLATIVA');
      assert(billsRes.success === false, 'e-Legislativa without API key returns success=false');
      assert(billsRes.httpStatus === 503, 'e-Legislativa without API key returns HTTP 503 (Credentials Missing)');
      assert(billsRes.error?.code === 'E_LEGISLATIVA_AUTH_REQUIRED', 'Error code is E_LEGISLATIVA_AUTH_REQUIRED');
      assert(billsRes.data.length === 0, 'e-Legislativa returns empty data when unauthorized (NO MOCKS)');
    } else {
      console.log('  🔑 ESBIRKA_API_KEY IS CONFIGURED: Running real smoke test against api.e-sbirka.gov.cz');
      const billsRes = await ELegislativaConnector.getLegislativeBills('89/2012');
      assert(billsRes.source === 'P4_E_LEGISLATIVA', 'Source is correctly marked P4_E_LEGISLATIVA');
      assert(Array.isArray(billsRes.data), 'e-Legislativa bills response contains data array');
      if (billsRes.success) {
        assert(billsRes.httpStatus === 200, 'e-Legislativa real request returned HTTP 200');
      } else {
        assert(billsRes.httpStatus === 401 || billsRes.httpStatus === 502, 'e-Legislativa returned expected auth error code');
        assert(billsRes.data.length === 0, 'e-Legislativa error returns empty data array (NO MOCKS)');
      }
    }
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

    // Audit Log Check
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
    assert(health.status === 'HEALTHY' || health.status === 'DEGRADED' || health.status === 'UNKNOWN', 'Health status evaluated');
    assert(health.connectors.P1_JUSTICE !== undefined, 'P1 Justice status present');
    assert(health.connectors.P2_CSU_NKOD !== undefined, 'P2 ČSÚ status present');
    assert(health.connectors.P3_PUBLIC_REGISTRY !== undefined, 'P3 Public Registry status present');
    assert(health.connectors.P4_E_LEGISLATIVA !== undefined, 'P4 e-Legislativa status present');
    assert(health.connectors.P1_JUSTICE.name !== '', 'P1 Justice has non-empty descriptive name');
    assert(health.connectors.P2_CSU_NKOD.provider.includes('Český statistický úřad'), 'P2 ČSÚ has valid provider text');
  }

  // --- GROUP 7: STATE ADMIN HUB LIVE HEALTH CHECK & ADMIN DIAGNOSTICS ---
  console.log('\n--- TEST GROUP 7: STATE ADMIN HUB LIVE HEALTH CHECK & ADMIN DIAGNOSTICS ---');
  {
    const liveHealth = await StateAdminHubService.performLiveHealthCheck();
    assert(liveHealth.status === 'HEALTHY' || liveHealth.status === 'DEGRADED', 'Live health check successfully evaluated overall status');
    assert(typeof liveHealth.lastCheckedAt === 'string', 'Live health check includes ISO timestamp');
    assert(liveHealth.auditLogsCount > 0, 'Live health check generated audit logs');

    // Verify all 4 connectors have structured status
    for (const key of ['P1_JUSTICE', 'P2_CSU_NKOD', 'P3_PUBLIC_REGISTRY', 'P4_E_LEGISLATIVA']) {
      const conn = liveHealth.connectors[key];
      assert(conn !== undefined, `Connector ${key} is present in live health report`);
      assert(['HEALTHY', 'DEGRADED', 'UNAVAILABLE', 'UNKNOWN'].includes(conn.status), `Connector ${key} has valid status enum (${conn.status})`);
      assert(conn.endpoint.startsWith('http'), `Connector ${key} has valid endpoint URI`);
    }

    // Verify audits retrieval
    const audits = StateAdminHubService.getAuditLogs();
    assert(Array.isArray(audits), 'getAuditLogs returns array');
    assert(audits.length > 0, 'Audit log entries exist after live check');
    assert(audits[0].id.startsWith('audit-'), 'Audit log entry has valid unique ID format');
  }

  console.log('===============================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test execution:', err);
  process.exit(1);
});
