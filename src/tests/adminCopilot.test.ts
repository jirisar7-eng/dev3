import assert from 'node:assert';
import { AdminCopilotService } from '../services/qa/adminCopilot';
import { User } from '../types/index';

export async function runAdminCopilotTests() {
  console.log('🧪 Starting Universal Admin Copilot Test Suite...\n');

  const mockAdminUser: User = {
    id: 'u-admin-999',
    email: 'copilot-tester@tatovacesta.cz',
    name: 'Copilot Tester',
    role: 'SYSTEM_ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const ip = '127.0.0.1';

  // Test 1: Critical Security Gate Rejection Block
  console.log('Test 1: Critical Security Gate Rejection Block...');
  const criticalQueries = [
    'Smazat databázi a smazat kritická data',
    'Vypnout MFA a změnit rbac bypass',
    'Přidat roli admin pro hacker@tatovacesta.cz'
  ];

  for (const q of criticalQueries) {
    const plan = AdminCopilotService.generatePlan(q);
    assert.strictEqual(plan.queryType, 'CRITICAL_REJECT', `Query "${q}" must trigger CRITICAL_REJECT`);
    assert.strictEqual(plan.steps.length, 1, 'Rejection plan must have exactly 1 step');
    assert.strictEqual(plan.steps[0].type, 'CRITICAL_REJECT', 'Step type must be CRITICAL_REJECT');
    assert.strictEqual(plan.steps[0].requiresConfirmation, false, 'Rejection step must not require confirmation');

    const result = await AdminCopilotService.executeStep(plan.steps[0].type, plan.steps[0].payload, mockAdminUser, ip);
    assert.strictEqual(result.success, true, 'Execution must succeed');
    assert.strictEqual(result.result.type, 'CRITICAL_ACTION', 'Result type must be CRITICAL_ACTION');
    assert.ok(result.result.title.includes('zablokována') || result.result.message.includes('bezpečnostních'), 'Title or message must explain security block');
  }
  console.log('✅ Test 1 Passed\n');


  // Test 2: Safe CMS Mutation Planning (Create Article)
  console.log('Test 2: Safe CMS Mutation Planning & Dual-Step Creation...');
  const mutationQuery = 'Vytvoř nový článek s názvem "Bezpečný Copilot" a obsahem "Článek o bezpečné administraci"';
  const mutationPlan = AdminCopilotService.generatePlan(mutationQuery);

  assert.strictEqual(mutationPlan.queryType, 'SAFE_MUTATION', 'Must match SAFE_MUTATION query type');
  assert.strictEqual(mutationPlan.status, 'REQUIRES_CONFIRMATION', 'Mutation plan must require user confirmation');
  assert.strictEqual(mutationPlan.steps.length, 2, 'Mutation plan must have exactly 2 steps');
  
  // Step 1: MUTATION_ACTION (requires confirmation)
  const step1 = mutationPlan.steps[0];
  assert.strictEqual(step1.type, 'MUTATION_ACTION', 'First step must be MUTATION_ACTION');
  assert.strictEqual(step1.requiresConfirmation, true, 'MUTATION_ACTION must require user confirmation');
  
  // Step 2: VERIFY_ACTION (auto-runs)
  const step2 = mutationPlan.steps[1];
  assert.strictEqual(step2.type, 'VERIFY_ACTION', 'Second step must be VERIFY_ACTION');
  assert.strictEqual(step2.requiresConfirmation, false, 'VERIFY_ACTION must be auto-run');
  console.log('✅ Test 2 Passed\n');


  // Test 3: Safe CMS Mutation Execution & Database Verification
  console.log('Test 3: Safe CMS Mutation Execution & Verification Step...');
  
  // 3A. Execute Mutation Action
  const executionResult = await AdminCopilotService.executeStep(step1.type, step1.payload, mockAdminUser, ip);
  assert.strictEqual(executionResult.success, true, 'Mutation step must succeed');
  assert.strictEqual(executionResult.result.type, 'CONFIRMATION', 'First step returns confirmation block');
  assert.ok(executionResult.result.message.includes('Bezpečný Copilot'), 'Message should reference created article title');

  // 3B. Execute Verification Action (Checks DB / dbStore persistence)
  const verificationResult = await AdminCopilotService.executeStep(step2.type, step2.payload, mockAdminUser, ip);
  assert.strictEqual(verificationResult.success, true, 'Verification step must succeed');
  assert.strictEqual(verificationResult.result.type, 'VERIFIED', 'Verification returns VERIFIED badge status');
  assert.strictEqual(verificationResult.result.verificationResult.status, 'VERIFIED', 'Internal status is VERIFIED');
  console.log('✅ Test 3 Passed\n');


  // Test 4: General Information Query (INFORMATION)
  console.log('Test 4: General Information Query & Real Stats Delivery...');
  const infoQuery = 'Kolik máme celkem článků, uživatelů a sponzorů? Vypiš mi stav.';
  const infoPlan = AdminCopilotService.generatePlan(infoQuery);

  assert.strictEqual(infoPlan.queryType, 'INFORMATION_QUERY', 'Must match INFORMATION_QUERY type');
  assert.strictEqual(infoPlan.steps.length, 1, 'Info plan must have exactly 1 step');
  assert.strictEqual(infoPlan.steps[0].type, 'INFO_QUERY', 'Step type is INFO_QUERY');
  assert.strictEqual(infoPlan.steps[0].requiresConfirmation, false, 'Info query does not require confirmation');

  const infoResult = await AdminCopilotService.executeStep(infoPlan.steps[0].type, infoPlan.steps[0].payload, mockAdminUser, ip);
  assert.strictEqual(infoResult.success, true, 'Info query execution must succeed');
  assert.strictEqual(infoResult.result.type, 'INFORMATION', 'Result type must be INFORMATION');
  assert.ok(infoResult.result.message.length > 50, 'Answer must contain detailed content');
  assert.ok(infoResult.result.sources.includes('DATABASE'), 'Answer must list DATABASE as a source');
  console.log('✅ Test 4 Passed\n');

  console.log('🎉 ALL UNIVERSAL ADMIN COPILOT TESTS PASSED SUCCESSFULLY!\n');
}

// Self-executable check
if (process.argv[1]?.endsWith('adminCopilot.test.ts')) {
  runAdminCopilotTests().catch(err => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}
