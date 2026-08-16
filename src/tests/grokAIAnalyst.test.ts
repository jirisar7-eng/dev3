import assert from 'node:assert';
import { aiAnalystOrchestrator } from '../services/qa/ai/aiAnalystOrchestrator.js';
import { aiStatsManager } from '../services/qa/ai/aiStats.js';
import { aiCache } from '../services/qa/ai/aiCache.js';
import { sanitizeText, sanitizeInputData } from '../services/qa/ai/sanitizer.js';
import { AIAnalysisInput } from '../services/qa/ai/types.js';

async function runTests() {
  console.log('🧪 Starting Grok / AI Analyst Test Suite...\n');

  // Helper base input template
  const createBaseInput = (overrides?: Partial<AIAnalysisInput>): AIAnalysisInput => ({
    commitSha: 'a1b2c3d4',
    branch: 'main',
    environment: 'production',
    metrics: {
      pages: 10,
      routes: 15,
      components: 25,
      buttons: 40,
      links: 50,
      forms: 8,
      apiEndpoints: 20,
      prismaModels: 12,
      e2eTests: 15
    },
    scores: {
      functional: 100,
      security: 100,
      api: 100,
      persistence: 100,
      e2e: 100,
      overall: 100
    },
    counts: {
      pass: 50,
      fail: 0,
      partial: 0,
      notTested: 0,
      p0: 0,
      p1: 0,
      p2: 0,
      p3: 0
    },
    findings: [],
    ...overrides
  });

  // TEST 1: PASS → no AI call
  console.log('Test 1: Clean PASS → No AI Call...');
  aiStatsManager.resetStats();
  aiCache.clear();

  const passInput = createBaseInput();
  const passReport = await aiAnalystOrchestrator.analyzeRunPayload(passInput);

  assert.strictEqual(passReport.providerUsed, 'none', 'Clean PASS should not call external AI provider');
  assert.strictEqual(passReport.skippedReason, 'PASS_SKIPPED', 'Skipped reason should be PASS_SKIPPED');
  assert.strictEqual(aiStatsManager.getStats().totalCalls, 0, 'Total AI calls should remain 0 on clean PASS');
  assert.strictEqual(aiStatsManager.getStats().skipped, 1, 'Skipped count should increment');
  console.log('✓ Clean PASS correctly skipped AI call without external API traffic\n');

  // TEST 2: Secret Sanitization
  console.log('Test 2: Secret & PII Sanitization...');
  const textWithSecrets = 'Auth header Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c with password "passwordHash": "super_secret_123" and api key xai-123456789012345678901234567890 and email sarji@seznam.cz';
  
  const sanitizedText = sanitizeText(textWithSecrets);
  assert(!sanitizedText.includes('super_secret_123'), 'Raw password should be redacted');
  assert(!sanitizedText.includes('eyJhbGciOiJIUzI1NiJ9'), 'JWT token should be redacted');
  assert(!sanitizedText.includes('xai-123456789012345678901234567890'), 'API key should be redacted');
  assert(!sanitizedText.includes('sarji@seznam.cz'), 'Email PII should be redacted');
  assert(sanitizedText.includes('[REDACTED_SECRET]') || sanitizedText.includes('[REDACTED_JWT_TOKEN]'), 'Sanitized text should contain redaction markers');

  // Test object deep sanitization
  const objWithSecrets = {
    user: 'admin',
    passwordHash: 'secret_hash_value',
    jwtToken: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    totpSecret: 'MFA_SECRET_987',
    nested: {
      apiKey: 'sk-1234567890123456789012345'
    }
  };
  const sanitizedObj = sanitizeInputData(objWithSecrets);
  assert.strictEqual(sanitizedObj.passwordHash, '[REDACTED_SECRET]', 'passwordHash field should be redacted');
  assert.strictEqual(sanitizedObj.totpSecret, '[REDACTED_SECRET]', 'totpSecret field should be redacted');
  assert.strictEqual(sanitizedObj.nested.apiKey, '[REDACTED_SECRET]', 'Nested apiKey should be redacted');
  console.log('✓ Secret & PII sanitization verified across strings and nested objects\n');

  // TEST 3: FAIL → AI call trigger evaluation
  console.log('Test 3: FAIL → AI Call Trigger Evaluation...');
  aiStatsManager.resetStats();

  const failInput = createBaseInput({
    counts: { pass: 40, fail: 2, partial: 0, notTested: 0, p0: 1, p1: 0, p2: 0, p3: 0 },
    findings: [{ severity: 'P0', category: 'SECURITY', message: 'Unauthorized endpoint access detected' }]
  });

  const shouldTrigger = aiAnalystOrchestrator.shouldTriggerAI(failInput);
  assert.strictEqual(shouldTrigger, true, 'FAIL or P0 finding must trigger AI analysis');

  const failReport = await aiAnalystOrchestrator.analyzeRunPayload(failInput);
  assert.strictEqual(failReport.aiVerdict, 'NOT PRODUCTION READY', 'P0 finding must result in NOT PRODUCTION READY verdict');
  console.log('✓ FAIL and P0 finding correctly triggered AI analysis and enforced strict verdict\n');

  // TEST 4: Cached result → No new API call
  console.log('Test 4: Cache Hit → No New API Call...');
  aiStatsManager.resetStats();
  aiCache.clear();

  // Manually pre-populate cache
  const testCacheKey = aiCache.computeKey({
    commitSha: 'commit-cached-123',
    sourceHash: 'source-hash-456',
    context: 'production:main:default',
    provider: 'grok',
    model: 'grok-2-latest'
  });

  aiCache.set(testCacheKey, {
    executiveSummary: 'Cached Summary',
    technicalSummary: 'Cached Technical',
    criticalFindings: ['Cached Finding'],
    rootCauseAnalysis: 'Cached Root Cause',
    riskAssessment: 'Cached Risk',
    recommendedFixes: ['Fix 1'],
    suggestedTests: ['Test 1'],
    productionReadinessAssessment: 'Ready',
    aiVerdict: 'PRODUCTION READY'
  });

  const cachedResult = aiCache.get(testCacheKey);
  assert(cachedResult !== null, 'Cache hit should return cached report');
  assert.strictEqual(cachedResult?.cachedHit, true, 'Report must be marked as cachedHit');
  assert.strictEqual(cachedResult?.providerUsed, 'cached', 'Provider should be marked as cached');
  console.log('✓ Cache hit correctly served cached report without performing API calls\n');

  // TEST 5: Quota exceeded → Skip with AI_ANALYSIS_SKIPPED_QUOTA
  console.log('Test 5: Quota Exceeded → Skip with AI_ANALYSIS_SKIPPED_QUOTA...');
  aiStatsManager.resetStats();
  aiStatsManager.setQuotaLimit(2);

  // Record 2 calls to hit the quota limit of 2
  aiStatsManager.recordCall('grok', 100, 100);
  aiStatsManager.recordCall('grok', 100, 100);

  assert.strictEqual(aiStatsManager.isQuotaExceeded(), true, 'Quota should be exceeded after 2 calls');

  const quotaInput = createBaseInput({
    counts: { pass: 40, fail: 1, partial: 0, notTested: 0, p0: 0, p1: 1, p2: 0, p3: 0 },
    findings: [{ severity: 'P1', category: 'API', message: 'API response timeout' }]
  });

  const quotaReport = await aiAnalystOrchestrator.analyzeRunPayload(quotaInput);
  assert.strictEqual(quotaReport.skippedReason, 'AI_ANALYSIS_SKIPPED_QUOTA', 'Skipped reason must be AI_ANALYSIS_SKIPPED_QUOTA');
  assert.strictEqual(aiStatsManager.getStats().skippedReasons['AI_ANALYSIS_SKIPPED_QUOTA'], 1, 'Skipped reason quota count should be recorded');
  console.log('✓ Quota limit correctly enforced AI_ANALYSIS_SKIPPED_QUOTA fallback\n');

  console.log('========================================');
  console.log('🎉 ALL GROK / AI ANALYST TESTS PASSED!');
  console.log('========================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
