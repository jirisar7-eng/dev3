import assert from 'node:assert';
import {
  SynthesisMultiAIOrchestrator,
  synthesisMultiAIOrchestrator
} from '../services/qa/ai/synthesisMultiAIOrchestrator.js';
import {
  AIAnalysisContext,
  AIProvider,
  AIProviderResponse
} from '../services/qa/ai/types.js';

class MockProvider implements AIProvider {
  public name: string;
  public modelName: string;
  private _available: boolean;
  private _enabled: boolean = true;
  private shouldFail: boolean = false;
  private mockText: string;
  private mockLatencyMs: number;

  constructor(
    name: string,
    modelName: string,
    available: boolean = true,
    mockVerdict: 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY' = 'PRODUCTION READY',
    mockLatencyMs: number = 50
  ) {
    this.name = name;
    this.modelName = modelName;
    this._available = available;
    this.mockLatencyMs = mockLatencyMs;
    this.mockText = JSON.stringify({
      executiveSummary: `Mock executive summary from ${name}`,
      technicalSummary: `Mock technical summary from ${name}`,
      criticalFindings: [`Finding from ${name}`],
      rootCauseAnalysis: `Root cause from ${name}`,
      riskAssessment: `Risk assessment from ${name}`,
      recommendedFixes: [`Fix 1 from ${name}`],
      suggestedTests: [`Test 1 from ${name}`],
      productionReadinessAssessment: `Readiness assessment from ${name}`,
      aiVerdict: mockVerdict
    });
  }

  public isAvailable(): boolean {
    return this._available;
  }

  public isEnabled(): boolean {
    return this._enabled && this._available;
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  public async analyze(sanitizedPrompt: string, options?: { timeoutMs?: number }): Promise<AIProviderResponse> {
    if (this.shouldFail) {
      throw new Error(`MockProvider ${this.name} simulated error`);
    }

    if (options?.timeoutMs && options.timeoutMs < this.mockLatencyMs) {
      await new Promise(resolve => setTimeout(resolve, options.timeoutMs + 10));
      throw new Error(`MockProvider ${this.name} request timed out`);
    }

    await new Promise(resolve => setTimeout(resolve, this.mockLatencyMs));

    return {
      rawText: this.mockText,
      promptTokens: 150,
      completionTokens: 80,
      model: this.modelName,
      latencyMs: this.mockLatencyMs
    };
  }
}

export async function runSynthesisOrchestratorTests() {
  console.log('🧪 Starting Synthesis Multi-AI Orchestrator Test Suite...\n');

  const baseContext: AIAnalysisContext = {
    commitSha: 'commit-abc-123',
    branch: 'main',
    environment: 'production',
    testResults: {
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
        functional: 14,
        security: 100,
        api: 100,
        persistence: 100,
        e2e: 100,
        overall: 14
      },
      counts: {
        pass: 15,
        fail: 0,
        partial: 1,
        notTested: 97,
        p0: 0,
        p1: 0,
        p2: 0,
        p3: 0,
        discovered: 113,
        tested: 16
      },
      findings: [
        { severity: 'P2', category: 'SECURITY', message: 'Missing security header X-Frame-Options' }
      ]
    },
    stackTraces: ['Error: Test trace at file.ts:12:34'],
    gitDiff: 'diff --git a/src/App.tsx b/src/App.tsx\n+ const newFeature = true;',
    changedFiles: ['src/App.tsx', 'src/services/qa/qaAuditEngine.ts'],
    dependencyContext: { '@google/genai': '0.1.1' },
    previousQAResults: { previousRunId: 'run-001', previousScore: 10 },
    adminCopilotContext: { prompt: 'Verify Production Readiness Gate enforcement.' }
  };

  // Test 1: Provider Status & Toggling
  console.log('Test 1: Provider Status & Toggling...');
  const orchestrator = new SynthesisMultiAIOrchestrator();
  orchestrator.clearProviders();

  const mockGemini = new MockProvider('mock-gemini', 'gemini-test', true, 'PRODUCTION READY');
  const mockGrok = new MockProvider('mock-grok', 'grok-test', true, 'PRODUCTION READY');

  orchestrator.registerProvider(mockGemini);
  orchestrator.registerProvider(mockGrok);

  let statuses = orchestrator.getProviderStatuses();
  const geminiStatus = statuses.find(s => s.name === 'mock-gemini');
  assert.ok(geminiStatus, 'mock-gemini should be registered');
  assert.strictEqual(geminiStatus?.enabled, true);

  // Toggle mock-gemini off
  orchestrator.setProviderEnabled('mock-gemini', false);
  statuses = orchestrator.getProviderStatuses();
  const geminiDisabled = statuses.find(s => s.name === 'mock-gemini');
  assert.strictEqual(geminiDisabled?.enabled, false, 'mock-gemini should be disabled');

  // Toggle back on
  orchestrator.setProviderEnabled('mock-gemini', true);
  console.log('✅ Test 1 Passed\n');

  // Test 2: Optimized Context Formatting
  console.log('Test 2: Optimized Context Prompt Formatting...');
  const prompt = orchestrator.buildOptimizedPrompt(baseContext);
  assert.ok(prompt.includes('commit-abc-123'), 'Prompt MUST contain commit SHA');
  assert.ok(prompt.includes('src/App.tsx'), 'Prompt MUST contain changed files');
  assert.ok(prompt.includes('SPECIFICKÝ DOTAZ ADMIN COPILOTA'), 'Prompt MUST include Copilot query context');
  console.log('✅ Test 2 Passed\n');

  // Test 3: Parallel Multi-AI Synthesis Execution
  console.log('Test 3: Parallel Multi-AI Synthesis Mode...');
  const synthesisResult = await orchestrator.analyze(baseContext, { mode: 'synthesis' });

  assert.ok(synthesisResult.multiProviderSynthesis, 'multiProviderSynthesis field should exist');
  assert.ok(synthesisResult.multiProviderSynthesis?.executedProviders.includes('mock-gemini'), 'mock-gemini should be executed');
  assert.ok(synthesisResult.multiProviderSynthesis?.executedProviders.includes('mock-grok'), 'mock-grok should be executed');
  console.log('✅ Test 3 Passed\n');

  // Test 4: Quality Gate Enforcement over AI Verdict
  console.log('Test 4: Strict Quality Gate Enforcement over AI Verdict...');
  // Note: baseContext has 97 NOT TESTED and 1 PARTIAL -> deterministic verdict MUST be NOT PRODUCTION READY
  assert.strictEqual(synthesisResult.aiVerdict, 'NOT PRODUCTION READY', 'Final verdict MUST be NOT PRODUCTION READY regardless of AI model claims');
  assert.ok(synthesisResult.productionReadinessAssessment.includes('PRODUCTION READY smí vzniknout pouze tehdy'), 'Readiness assessment must state strict rule');
  console.log('✅ Test 4 Passed\n');

  // Test 5: Circuit Breaker & Failover
  console.log('Test 5: Circuit Breaker & Failover...');
  mockGemini.setShouldFail(true);

  // Run analysis -> mockGemini fails, falls back to mockGrok
  const failoverResult = await orchestrator.analyze(baseContext, { mode: 'single', preferredProviders: ['mock-gemini', 'mock-grok'] });
  assert.strictEqual(failoverResult.aiVerdict, 'NOT PRODUCTION READY');

  // Simulate 3 failures to trigger Circuit Breaker
  try {
    await orchestrator.analyze(baseContext, { mode: 'single', preferredProviders: ['mock-gemini'], maxRetries: 0 });
  } catch {}
  try {
    await orchestrator.analyze(baseContext, { mode: 'single', preferredProviders: ['mock-gemini'], maxRetries: 0 });
  } catch {}

  const statusesAfterFailures = orchestrator.getProviderStatuses();
  const geminiStatusAfter = statusesAfterFailures.find(s => s.name === 'mock-gemini');
  assert.ok(geminiStatusAfter?.cooldownUntil !== null || geminiStatusAfter?.failureCount! >= 3, 'Circuit breaker or failure count should be triggered');
  console.log('✅ Test 5 Passed\n');

  // Test 6: Production Ready 100% PASS Scenario
  console.log('Test 6: 100% PASS Scenario Production Ready...');
  const perfectContext: AIAnalysisContext = {
    ...baseContext,
    testResults: {
      ...baseContext.testResults,
      scores: { functional: 100, security: 100, api: 100, persistence: 100, e2e: 100, overall: 100 },
      counts: { pass: 100, fail: 0, partial: 0, notTested: 0, p0: 0, p1: 0, p2: 0, p3: 0, discovered: 100 }
    }
  };

  mockGemini.setShouldFail(false);
  const perfectResult = await orchestrator.analyze(perfectContext, { mode: 'synthesis' });
  assert.strictEqual(perfectResult.aiVerdict, 'PRODUCTION READY', '100% PASS scenario should yield PRODUCTION READY verdict');
  console.log('✅ Test 6 Passed\n');

  console.log('🎉 ALL SYNTHESIS MULTI-AI ORCHESTRATOR TESTS PASSED SUCCESSFULLY!');
}

// Auto run if executed directly
if (process.argv[1] && process.argv[1].includes('synthesisOrchestrator.test')) {
  runSynthesisOrchestratorTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  });
}
