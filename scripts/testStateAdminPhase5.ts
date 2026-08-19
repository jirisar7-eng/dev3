/**
 * STATE ADMINISTRATION API HUB - PHASE 5 INTEGRATION TEST SUITE
 * Complete testing for P1 (Justice), P2 (ČSÚ/NKOD), P3 (Public Registries), P4 (e-Legislativa)
 */

import { StateAdminApiClient } from '../src/services/stateAdmin/StateAdminApiClient.js';
import { JusticeOpenDataConnector } from '../src/services/stateAdmin/JusticeOpenDataConnector.js';
import { CsuNkodConnector } from '../src/services/stateAdmin/CsuNkodConnector.js';
import { PublicRegistryConnector } from '../src/services/stateAdmin/PublicRegistryConnector.js';
import { ELegislativaConnector } from '../src/services/stateAdmin/ELegislativaConnector.js';
import { StateAdminHubService } from '../src/services/stateAdmin/StateAdminHubService.ts';

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
  console.log('===============================================================');

  StateAdminApiClient.resetForTesting();

  // --- GROUP 1: P1 JUSTICE / MSP CONNECTOR ---
  console.log('\n--- TEST GROUP 1: P1 JUSTICE / MSP CONNECTOR ---');
  {
    const res = await JusticeOpenDataConnector.getJudicialStatistics('P');
    assert(res.source === 'P1_JUSTICE', 'Source is correctly marked P1_JUSTICE');
    assert(res.data.length > 0, 'Returns non-empty judicial statistics list');
    assert(res.data[0].agenda === 'P', 'Normalized agenda is P (Opatrovnická)');
    assert(typeof res.data[0].averageDurationDays === 'number', 'Contains average duration metric');

    const casesRes = await JusticeOpenDataConnector.getJudicialCases('Ústavní soud');
    assert(casesRes.source === 'P1_JUSTICE', 'Cases source is P1_JUSTICE');
    assert(casesRes.data.length > 0, 'Returns constitutional court precedent cases');
    assert(casesRes.data[0].court.includes('Ústavní soud'), 'Court is correctly assigned');
  }

  // --- GROUP 2: P2 ČSÚ / NKOD CONNECTOR ---
  console.log('\n--- TEST GROUP 2: P2 ČSÚ / NKOD CONNECTOR ---');
  {
    const res = await CsuNkodConnector.getDemographicStatistics();
    assert(res.source === 'P2_CSU_NKOD', 'Source is correctly marked P2_CSU_NKOD');
    assert(res.data.length > 0, 'Returns demographic statistics data');
    assert(res.data[0].category.includes('Demografie') || res.data[0].category.includes('Péče'), 'Category is relevant to family/demographics');

    const searchRes = await CsuNkodConnector.searchNkodDatasets('rodina');
    assert(searchRes.source === 'P2_CSU_NKOD', 'Search source is P2_CSU_NKOD');
    assert(searchRes.data.length > 0, 'NKOD dataset search returns results');
  }

  // --- GROUP 3: P3 PUBLIC REGISTRIES CONNECTOR ---
  console.log('\n--- TEST GROUP 3: P3 PUBLIC REGISTRIES CONNECTOR ---');
  {
    const ovmRes = await PublicRegistryConnector.getOvmEntities('SOUD');
    assert(ovmRes.source === 'P3_PUBLIC_REGISTRY', 'Source is correctly marked P3_PUBLIC_REGISTRY');
    assert(ovmRes.data.length > 0, 'Returns OVM court entities');
    assert(ovmRes.data[0].type === 'SOUD', 'Entity type is SOUD');
    assert(ovmRes.data[0].isVerified === true, 'Entity marked verified');

    const aresRes = await PublicRegistryConnector.verifyLegalProfessional('00025429');
    assert(aresRes.source === 'P3_PUBLIC_REGISTRY', 'ARES verification source is P3_PUBLIC_REGISTRY');
    assert(aresRes.data.length > 0, 'ARES professional verification succeeded');
    assert(aresRes.data[0].ico.length > 0, 'ARES result contains valid ICO');
  }

  // --- GROUP 4: P4 E-LEGISLATIVA CONNECTOR ---
  console.log('\n--- TEST GROUP 4: P4 E-LEGISLATIVA CONNECTOR ---');
  {
    const billsRes = await ELegislativaConnector.getLegislativeBills('89/2012');
    assert(billsRes.source === 'P4_E_LEGISLATIVA', 'Source is correctly marked P4_E_LEGISLATIVA');
    assert(billsRes.data.length > 0, 'Returns legislative bills for OZ 89/2012');
    assert(billsRes.data[0].actCodeAffected === '89/2012', 'Affected act code matches 89/2012');
    assert(billsRes.data[0].billNumber.length > 0, 'Bill number is present');
  }

  // --- GROUP 5: FAIL-CLOSED & SECURITY DEFENSES ---
  console.log('\n--- TEST GROUP 5: FAIL-CLOSED & SECURITY DEFENSES ---');
  {
    // SSRF URL Block Check
    const ssrfSafeLocal = StateAdminApiClient.isUrlSsrfSafe('http://localhost:3000/internal');
    const ssrfSafeIp = StateAdminApiClient.isUrlSsrfSafe('http://192.168.1.1/admin');
    const ssrfSafePublic = StateAdminApiClient.isUrlSsrfSafe('https://data.gov.cz/api/v2/datasets');

    assert(ssrfSafeLocal === false, 'SSRF Defense blocks localhost target');
    assert(ssrfSafeIp === false, 'SSRF Defense blocks private IP subnets');
    assert(ssrfSafePublic === true, 'SSRF Defense permits public HTTPS endpoints');

    // Audit Logging Check (from previous connector calls)
    const auditLogsBefore = StateAdminApiClient.getAuditLogs();
    assert(auditLogsBefore.length > 0, 'Audit logs recorded for API executions');
    assert(auditLogsBefore[0].timestamp instanceof Date, 'Audit log timestamp is valid Date object');

    // Rate Limiting Check
    StateAdminApiClient.resetForTesting();
    let rateLimitTriggered = false;
    for (let i = 0; i < 35; i++) {
      const allowed = StateAdminApiClient.checkRateLimit('P1_JUSTICE', 30);
      if (!allowed) {
        rateLimitTriggered = true;
        break;
      }
    }
    assert(rateLimitTriggered === true, 'Rate Limiter blocks calls exceeding 30 req/min');
  }

  // --- GROUP 6: STATE ADMIN HUB ORCHESTRATOR & HEALTH CHECK ---
  console.log('\n--- TEST GROUP 6: STATE ADMIN HUB ORCHESTRATOR ---');
  {
    const health = await StateAdminHubService.getHealthStatus();
    assert(health.status === 'HEALTHY' || health.status === 'DEGRADED', 'Health status evaluated');
    assert(health.connectors.P1_JUSTICE !== undefined, 'P1 Justice status present in health report');
    assert(health.connectors.P2_CSU_NKOD !== undefined, 'P2 ČSÚ status present in health report');
    assert(health.connectors.P3_PUBLIC_REGISTRY !== undefined, 'P3 Public Registry status present in health report');
    assert(health.connectors.P4_E_LEGISLATIVA !== undefined, 'P4 e-Legislativa status present in health report');
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
