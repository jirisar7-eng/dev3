import assert from 'node:assert';
import { ConsensusEngine } from '../services/qa/ai/consensusEngine.js';
import {
  SynthesisMultiAIOrchestrator,
  shouldTriggerAICouncil
} from '../services/qa/ai/synthesisMultiAIOrchestrator.js';
import {
  AIAnalysisContext,
  AICouncilAnalystResult,
  AIProvider,
  AIProviderResponse,
  EvidenceBundle
} from '../services/qa/ai/types.js';
import { EvidenceValidator } from '../services/qa/ai/evidenceValidator.js';

class MockCouncilProvider implements AIProvider {
  public name: string;
  public modelName: string;
  private _enabled: boolean = true;
  private mockVerdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW';

  constructor(
    name: string,
    modelName: string,
    mockVerdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' = 'PASS'
  ) {
    this.name = name;
    this.modelName = modelName;
    this.mockVerdict = mockVerdict;
  }

  public isAvailable(): boolean {
    return true;
  }

  public isEnabled(): boolean {
    return this._enabled;
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public async analyze(sanitizedPrompt: string): Promise<AIProviderResponse> {
    const rawText = JSON.stringify({
      summary: `Analýza od ${this.name}`,
      confidence: 0.92,
      verdict: this.mockVerdict,
      findings: [
        {
          finding: `Nález od ${this.name}`,
          severity: 'P1',
          rootCause: `Detailní root cause od ${this.name}`,
          confidence: 0.90,
          evidence: `Evidence string with stack trace from ${this.name}`,
          recommendation: `Fix recommendation from ${this.name}`,
          suggestedTests: [`Test from ${this.name}`]
        }
      ]
    });

    return {
      rawText,
      promptTokens: 120,
      completionTokens: 80,
      model: this.modelName,
      latencyMs: 40
    };
  }
}

export async function runAICouncilConsensusTests() {
  console.log('🧪 Starting AI Council & Consensus Engine Test Suite...\n');

  const basePassContext: AIAnalysisContext = {
    commitSha: 'commit-pass-123',
    branch: 'main',
    environment: 'production',
    qaRunId: 'run-pass-001',
    testResults: {
      metrics: { pages: 10, routes: 10, components: 20, buttons: 30, links: 40, forms: 5, apiEndpoints: 15, prismaModels: 10, e2eTests: 10 },
      scores: { functional: 100, security: 100, api: 100, persistence: 100, e2e: 100, overall: 100 },
      counts: { pass: 100, fail: 0, partial: 0, notTested: 0, p0: 0, p1: 0, p2: 0, p3: 0, discovered: 100 },
      findings: []
    }
  };

  const baseFailContext: AIAnalysisContext = {
    commitSha: 'commit-fail-456',
    branch: 'main',
    environment: 'production',
    qaRunId: 'run-fail-002',
    testResults: {
      metrics: { pages: 10, routes: 10, components: 20, buttons: 30, links: 40, forms: 5, apiEndpoints: 15, prismaModels: 10, e2eTests: 10 },
      scores: { functional: 50, security: 50, api: 50, persistence: 50, e2e: 50, overall: 50 },
      counts: { pass: 50, fail: 10, partial: 5, notTested: 35, p0: 1, p1: 2, p2: 0, p3: 0, discovered: 100 },
      findings: [
        { id: 'f-101', severity: 'P0', category: 'SECURITY', message: 'SQL Injection in User search API' }
      ]
    }
  };

  // Test 1: Consensus Engine UNANIMOUS Status
  console.log('Test 1: Consensus Engine UNANIMOUS Status...');
  const geminiAnalyst: AICouncilAnalystResult = {
    providerName: 'gemini',
    modelName: 'gemini-2.5-flash',
    timestamp: new Date().toISOString(),
    confidence: 0.95,
    summary: 'Gemini agrees test is clean.',
    verdict: 'PASS',
    findings: []
  };

  const grokAnalyst: AICouncilAnalystResult = {
    providerName: 'grok',
    modelName: 'grok-2-latest',
    timestamp: new Date().toISOString(),
    confidence: 0.90,
    summary: 'Grok agrees test is clean.',
    verdict: 'PASS',
    findings: []
  };

  const unanimousConsensus = ConsensusEngine.evaluateConsensus(basePassContext, { gemini: geminiAnalyst, grok: grokAnalyst });
  assert.strictEqual(unanimousConsensus.status, 'UNANIMOUS');
  assert.strictEqual(unanimousConsensus.consensusVerdict, 'PASS');
  assert.strictEqual(unanimousConsensus.finalQAVerdict, 'PRODUCTION READY');
  console.log('✅ Test 1 Passed\n');

  // Test 2: Consensus Engine DISAGREEMENT Status -> NEEDS_REVIEW
  console.log('Test 2: Consensus Engine DISAGREEMENT Status...');
  const grokFailAnalyst: AICouncilAnalystResult = { ...grokAnalyst, verdict: 'FAIL' };
  const disagreementConsensus = ConsensusEngine.evaluateConsensus(baseFailContext, { gemini: geminiAnalyst, grok: grokFailAnalyst });
  assert.strictEqual(disagreementConsensus.status, 'DISAGREEMENT');
  assert.strictEqual(disagreementConsensus.consensusVerdict, 'NEEDS_REVIEW');
  console.log('✅ Test 2 Passed\n');

  // Test 3: QA = FAIL Priority Rule (AI cannot override QA = FAIL to PASS)
  console.log('Test 3: QA = FAIL Priority Rule (Deterministic Override)...');
  const unanimousPassOnFailContext = ConsensusEngine.evaluateConsensus(baseFailContext, { gemini: geminiAnalyst, grok: grokAnalyst });
  assert.strictEqual(unanimousPassOnFailContext.finalQAVerdict, 'NOT PRODUCTION READY', 'Final QA verdict MUST stay NOT PRODUCTION READY when QA = FAIL');
  assert.strictEqual(unanimousPassOnFailContext.consensusVerdict, 'NEEDS_REVIEW');
  console.log('✅ Test 3 Passed\n');

  // Test 4: Trigger Optimization (Limit AI execution for 100% PASS)
  console.log('Test 4: Trigger Optimization Limits...');
  const shouldTriggerForCleanPass = shouldTriggerAICouncil(basePassContext);
  assert.strictEqual(shouldTriggerForCleanPass, false, '100% clean PASS should NOT trigger AI calls');

  const shouldTriggerForFail = shouldTriggerAICouncil(baseFailContext);
  assert.strictEqual(shouldTriggerForFail, true, 'FAIL / P0 / P1 MUST trigger AI Council');
  console.log('✅ Test 4 Passed\n');

  // Test 5: End-to-End Orchestrator Council Execution
  console.log('Test 5: End-to-End Orchestrator Council Execution...');
  const orchestrator = new SynthesisMultiAIOrchestrator();
  orchestrator.clearProviders();

  orchestrator.registerProvider(new MockCouncilProvider('gemini', 'gemini-2.5-flash', 'FAIL'));
  orchestrator.registerProvider(new MockCouncilProvider('grok', 'grok-2-latest', 'FAIL'));

  const councilResult = await orchestrator.analyze(baseFailContext, { mode: 'council', forceExecute: true });

  assert.ok(councilResult.aiCouncil, 'aiCouncil field MUST be populated');
  assert.strictEqual(councilResult.aiCouncil?.status, 'UNANIMOUS');
  assert.strictEqual(councilResult.aiCouncil?.consensusVerdict, 'FAIL');
  assert.strictEqual(councilResult.aiCouncil?.finalQAVerdict, 'NOT PRODUCTION READY');
  assert.ok(councilResult.aiCouncil?.agreedFindings.length! > 0, 'Agreed findings should be present');

  const firstFinding = councilResult.aiCouncil?.agreedFindings[0];
  assert.ok(firstFinding?.finding, 'Finding title must exist');
  assert.ok(firstFinding?.severity, 'Severity must exist');
  assert.ok(firstFinding?.rootCause, 'Root cause must exist');
  assert.ok(typeof firstFinding?.confidence === 'number', 'Confidence must be a number');
  assert.ok(firstFinding?.evidence, 'Evidence must exist');
  assert.ok(firstFinding?.recommendation, 'Recommendation must exist');
  assert.ok(Array.isArray(firstFinding?.suggestedTests), 'SuggestedTests must be an array');
  console.log('✅ Test 5 Passed\n');

  // Test 6: Evidence Validation & Consensus States (CONFIRMED, LIKELY, INSUFFICIENT_EVIDENCE, RESOLVED, DISAGREEMENT)
  console.log('Test 6: Evidence Validation States & Score Assessments...');
  
  // 6A. CONFIRMED Case: Both fail, deterministic fails, sufficient evidence
  const confirmedEvidence: EvidenceBundle = {
    findingId: 'f-101',
    findingMessage: 'SQL Injection in User search API',
    findingCategory: 'SECURITY',
    severity: 'P0',
    qaRunId: 'run-fail-002',
    commitSha: 'commit-fail-456',
    gitCommitSha: 'commit-fail-456',
    validationStatus: {
      exists: true,
      isFresh: true,
      relatesToCommit: true,
      evidenceScore: 90,
      hasSufficientEvidence: true,
      wasPreviouslyVerified: false,
      hasChangedSinceVerification: true
    }
  };

  const contextWithEvidence: AIAnalysisContext = {
    ...baseFailContext,
    evidenceBundles: [confirmedEvidence]
  };

  const geminiFindingAnalyst: AICouncilAnalystResult = {
    providerName: 'gemini',
    modelName: 'gemini-2.5-flash',
    timestamp: new Date().toISOString(),
    confidence: 0.95,
    summary: 'Gemini found SQL injection.',
    verdict: 'FAIL',
    findings: [{
      finding: 'SQL Injection in User search API',
      severity: 'P0',
      rootCause: 'Improper query sanitization',
      confidence: 0.95,
      evidence: 'Raw query constructed with string concat',
      recommendation: 'Use parameterized queries',
      suggestedTests: []
    }]
  };

  const grokFindingAnalyst: AICouncilAnalystResult = {
    providerName: 'grok',
    modelName: 'grok-2-latest',
    timestamp: new Date().toISOString(),
    confidence: 0.90,
    summary: 'Grok confirms SQL injection.',
    verdict: 'FAIL',
    findings: [{
      finding: 'SQL Injection in User search API',
      severity: 'P0',
      rootCause: 'Concatenated values',
      confidence: 0.90,
      evidence: 'Found concat in src/api/users.ts',
      recommendation: 'Use parameters',
      suggestedTests: []
    }]
  };

  const confirmedConsensus = ConsensusEngine.evaluateConsensus(contextWithEvidence, {
    gemini: geminiFindingAnalyst,
    grok: grokFindingAnalyst
  });

  assert.strictEqual(confirmedConsensus.agreedFindings.length, 1);
  const matchedConfirmed = confirmedConsensus.agreedFindings[0];
  assert.strictEqual(matchedConfirmed.consensusState, 'CONFIRMED', 'Should match CONFIRMED status');
  assert.strictEqual(matchedConfirmed.evidenceScore, 90);
  assert.ok(matchedConfirmed.evidenceBundle, 'Evidence bundle should be attached');

  // 6B. INSUFFICIENT_EVIDENCE Case: Score < 40 or hasSufficientEvidence = false
  const weakEvidence: EvidenceBundle = {
    findingId: 'f-101',
    findingMessage: 'SQL Injection in User search API',
    findingCategory: 'SECURITY',
    severity: 'P0',
    qaRunId: 'run-fail-002',
    commitSha: 'commit-fail-456',
    gitCommitSha: 'commit-fail-456',
    validationStatus: {
      exists: true,
      isFresh: true,
      relatesToCommit: true,
      evidenceScore: 20,
      hasSufficientEvidence: false,
      wasPreviouslyVerified: false,
      hasChangedSinceVerification: true
    }
  };

  const contextWithWeakEvidence: AIAnalysisContext = {
    ...baseFailContext,
    evidenceBundles: [weakEvidence]
  };

  const weakConsensus = ConsensusEngine.evaluateConsensus(contextWithWeakEvidence, {
    gemini: geminiFindingAnalyst,
    grok: grokFindingAnalyst
  });

  assert.strictEqual(weakConsensus.agreedFindings[0].consensusState, 'INSUFFICIENT_EVIDENCE', 'Should be INSUFFICIENT_EVIDENCE when validation lacks data');

  // 6C. RESOLVED Case: Previously verified & unchanged
  const resolvedEvidence: EvidenceBundle = {
    findingId: 'f-101',
    findingMessage: 'SQL Injection in User search API',
    findingCategory: 'SECURITY',
    severity: 'P0',
    qaRunId: 'run-fail-002',
    commitSha: 'commit-fail-456',
    gitCommitSha: 'commit-fail-456',
    validationStatus: {
      exists: true,
      isFresh: true,
      relatesToCommit: true,
      evidenceScore: 100,
      hasSufficientEvidence: true,
      wasPreviouslyVerified: true,
      hasChangedSinceVerification: false
    }
  };

  const contextWithResolvedEvidence: AIAnalysisContext = {
    ...baseFailContext,
    evidenceBundles: [resolvedEvidence]
  };

  const resolvedConsensus = ConsensusEngine.evaluateConsensus(contextWithResolvedEvidence, {
    gemini: geminiFindingAnalyst,
    grok: grokFindingAnalyst
  });

  assert.strictEqual(resolvedConsensus.agreedFindings[0].consensusState, 'RESOLVED', 'Should be RESOLVED since file has been previously verified without changes');

  // 6D. LIKELY Case: both fail but no deterministic finding (simulating a clean pass but AI found potential bug)
  const likelyEvidence: EvidenceBundle = {
    findingId: 'f-202',
    findingMessage: 'Potential race condition in payment endpoint',
    findingCategory: 'PERSISTENCE',
    severity: 'P1',
    qaRunId: 'run-pass-001',
    commitSha: 'commit-pass-123',
    gitCommitSha: 'commit-pass-123',
    validationStatus: {
      exists: true,
      isFresh: true,
      relatesToCommit: true,
      evidenceScore: 80,
      hasSufficientEvidence: true,
      wasPreviouslyVerified: false,
      hasChangedSinceVerification: true
    }
  };

  const contextWithLikelyEvidence: AIAnalysisContext = {
    ...basePassContext,
    evidenceBundles: [likelyEvidence]
  };

  const geminiLikelyAnalyst: AICouncilAnalystResult = {
    ...geminiFindingAnalyst,
    findings: [{
      finding: 'Potential race condition in payment endpoint',
      severity: 'P1',
      rootCause: 'No lock on wallet table',
      confidence: 0.95,
      evidence: 'Missing lock',
      recommendation: 'Add transactions',
      suggestedTests: []
    }]
  };

  const grokLikelyAnalyst: AICouncilAnalystResult = {
    ...grokFindingAnalyst,
    findings: [{
      finding: 'Potential race condition in payment endpoint',
      severity: 'P1',
      rootCause: 'Race condition',
      confidence: 0.90,
      evidence: 'Race condition',
      recommendation: 'Add locking',
      suggestedTests: []
    }]
  };

  const likelyConsensus = ConsensusEngine.evaluateConsensus(contextWithLikelyEvidence, {
    gemini: geminiLikelyAnalyst,
    grok: grokLikelyAnalyst
  });

  assert.strictEqual(likelyConsensus.agreedFindings[0].consensusState, 'LIKELY', 'Should be LIKELY when both agree but deterministic finding is absent');

  console.log('✅ Test 6 Passed\n');

  console.log('🎉 ALL AI COUNCIL & CONSENSUS ENGINE TESTS PASSED SUCCESSFULLY!');
}

// Auto run if executed directly
if (process.argv[1] && process.argv[1].includes('aiCouncilConsensus.test')) {
  runAICouncilConsensusTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
