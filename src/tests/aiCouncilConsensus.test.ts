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
  AIProviderResponse
} from '../services/qa/ai/types.js';

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

  console.log('🎉 ALL AI COUNCIL & CONSENSUS ENGINE TESTS PASSED SUCCESSFULLY!');
}

// Auto run if executed directly
if (process.argv[1] && process.argv[1].includes('aiCouncilConsensus.test')) {
  runAICouncilConsensusTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
