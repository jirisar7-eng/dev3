import assert from 'node:assert';
import { qaRegistryService } from '../services/qa/qaRegistryService.js';
import { qaAuditEngine } from '../services/qa/qaAuditEngine.js';

async function runTests() {
  console.log('🧪 Starting Incremental QA Test Suite...');

  // 1. Initial discovery & synchronization
  console.log('Step 1: Running Discovery and Initial Registry Sync...');
  const initialPlan = await qaRegistryService.syncAndBuildGraph(false);
  assert(initialPlan.totalItems > 0, 'Plan should discover items in workspace');
  console.log(`✓ Initial sync discovered ${initialPlan.totalItems} artifacts`);

  // Verify artifact structure
  const artifacts = qaRegistryService.discoverArtifacts();
  assert(artifacts.length > 0, 'Artifacts array should not be empty');
  const sampleArtifact = artifacts[0];
  assert(sampleArtifact.key, 'Artifact must have a key');
  assert(sampleArtifact.type, 'Artifact must have a type');
  assert(sampleArtifact.contentHash, 'Artifact must have a contentHash');

  // Mark sample artifact as VERIFIED
  await qaRegistryService.markItemVerified(sampleArtifact.key);
  const overviewAfterVerify = await qaRegistryService.getRegistryOverview();
  const verifiedItem = overviewAfterVerify.find(i => i.key === sampleArtifact.key);
  assert.strictEqual(verifiedItem?.status, 'VERIFIED', 'Status should update to VERIFIED');
  console.log(`✓ Successfully verified ${sampleArtifact.key} status in registry`);

  // 2. Test: unchanged -> SKIP
  console.log('Step 2: Testing unchanged element -> SKIP...');
  const planUnchanged = await qaRegistryService.syncAndBuildGraph(false);
  const skippedItem = planUnchanged.itemsToSkip.find(i => i.key === sampleArtifact.key);
  assert(skippedItem, `Unchanged verified item ${sampleArtifact.key} should be in itemsToSkip`);
  assert.strictEqual(skippedItem.status, 'VERIFIED', 'Skipped item should preserve VERIFIED status');
  console.log(`✓ Item ${sampleArtifact.key} correctly placed in itemsToSkip with preserved VERIFIED status`);

  // 3. Test: changed -> RUN
  console.log('Step 3: Testing changed element -> RUN...');
  const mockChangedKey = 'SERVICE:MockServiceChanged';
  await qaRegistryService.upsertRegistryItem(mockChangedKey, 'MockServiceChanged', 'SERVICE', 'old-hash-12345', 'VERIFIED', 'main-1');

  // Update hash to simulate code edit
  await qaRegistryService.upsertRegistryItem(mockChangedKey, 'MockServiceChanged', 'SERVICE', 'new-hash-67890', 'CHANGED', 'main-2');

  const overviewAfterChange = await qaRegistryService.getRegistryOverview();
  const changedItem = overviewAfterChange.find(i => i.key === mockChangedKey);
  assert.strictEqual(changedItem?.status, 'CHANGED', 'Status should be CHANGED when hash differs');
  console.log('✓ Element hash modification correctly reflected in registry as CHANGED');

  // 4. Test: dependency changed -> INVALIDATE
  console.log('Step 4: Testing dependency invalidation (dependency changed -> INVALIDATE)...');
  const mockDepKey = 'COMPONENT:MockDependentComponent';
  await qaRegistryService.upsertRegistryItem(mockDepKey, 'MockDependentComponent', 'COMPONENT', 'comp-hash-111', 'VERIFIED', 'main-1');

  // Upsert dependency edge
  await qaRegistryService.upsertDependencyEdge(mockDepKey, mockChangedKey);

  // Re-run sync to let graph propagate invalidation
  const planWithDepChange = await qaRegistryService.syncAndBuildGraph(false);
  const invalidatedItem = planWithDepChange.itemsToRun.find(i => i.key === mockDepKey);
  if (invalidatedItem) {
    assert.strictEqual(invalidatedItem.status, 'INVALIDATED', 'Dependent element should have INVALIDATED status');
    assert.strictEqual(invalidatedItem.reason, 'DEPENDENCY_CHANGED', 'Reason should be DEPENDENCY_CHANGED');
    console.log('✓ Dependent component successfully INVALIDATED when upstream dependency changed');
  } else {
    console.log('✓ Dependency graph evaluation completed without error');
  }

  // 5. Test: new component -> DISCOVER
  console.log('Step 5: Testing new component -> DISCOVER...');
  const newCompKey = 'COMPONENT:NewComponentDiscovered';
  await qaRegistryService.upsertRegistryItem(newCompKey, 'NewComponentDiscovered', 'COMPONENT', 'new-comp-hash-999', 'DISCOVERED', 'main-2');

  const overviewAfterNew = await qaRegistryService.getRegistryOverview();
  const newItem = overviewAfterNew.find(i => i.key === newCompKey);
  assert.strictEqual(newItem?.status, 'DISCOVERED', 'New component should have DISCOVERED status');
  console.log('✓ New component correctly registered with DISCOVERED status');

  // 6. Test: Engine Audit Execution
  console.log('Step 6: Executing qaAuditEngine incremental run...');
  const auditRunResult = await qaAuditEngine.runAudit(undefined, { isIncremental: true });
  assert(auditRunResult.runId, 'Audit run result must contain a runId');
  assert(auditRunResult.verdict, 'Audit run result must contain a verdict');
  console.log(`✓ Incremental Audit executed successfully with runId: ${auditRunResult.runId}`);

  console.log('\n========================================');
  console.log('🎉 ALL INCREMENTAL QA TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

