import crypto from 'crypto';
import {
  AIAnalysisContext,
  AIProvider,
  AIProviderResponse,
  AIAnalystReport,
  ProviderStatus,
  SynthesisAIResult,
  SynthesisOptions,
  AICouncilAnalystResult,
  AICouncilFinding,
  EvidenceBundle
} from './types';
import { sanitizeInputData } from './sanitizer';
import { aiCache } from './aiCache';
import { aiStatsManager } from './aiStats';
import { computeDeterministicVerdict } from './aiAnalystOrchestrator';
import { ConsensusEngine } from './consensusEngine';
import { GeminiProvider } from './providers/geminiProvider';
import { GrokProvider } from './providers/grokProvider';
import { GroqProvider } from './providers/groqProvider';
import { EvidenceValidator } from './evidenceValidator';

interface ProviderState {
  provider: AIProvider;
  failureCount: number;
  lastFailureAt: number | null;
  cooldownUntil: number | null;
}

export function shouldTriggerAICouncil(context: AIAnalysisContext, options?: SynthesisOptions): boolean {
  if (options?.forceExecute || context.forceExecute) {
    return true;
  }
  if (context.adminCopilotContext?.prompt) {
    return true;
  }

  const counts = context.testResults.counts;
  const hasFailures = (counts.fail || 0) > 0;
  const hasPartial = (counts.partial || 0) > 0;
  const hasCriticalFindings = (counts.p0 || 0) > 0 || (counts.p1 || 0) > 0;
  const hasRegressions = context.hasRegression || (context.previousQAResults?.regressions && context.previousQAResults.regressions.length > 0);

  return hasFailures || hasPartial || hasCriticalFindings || !!hasRegressions;
}

export class SynthesisMultiAIOrchestrator {
  private providers: Map<string, ProviderState> = new Map();

  constructor() {
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new GrokProvider());
    this.registerProvider(new GroqProvider());
  }

  public clearProviders(): void {
    this.providers.clear();
    console.log('[Synthesis Multi-AI Orchestrator] All providers cleared.');
  }

  public unregisterProvider(name: string): boolean {
    const deleted = this.providers.delete(name);
    if (deleted) {
      console.log(`[Synthesis Multi-AI Orchestrator] Unregistered provider: ${name}`);
    }
    return deleted;
  }

  public registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, {
      provider,
      failureCount: 0,
      lastFailureAt: null,
      cooldownUntil: null
    });
    console.log(`[Synthesis Multi-AI Orchestrator] Registered provider: ${provider.name} (${provider.modelName})`);
  }

  public getProviderStatuses(): ProviderStatus[] {
    const now = Date.now();
    const statuses: ProviderStatus[] = [];

    for (const [name, state] of this.providers.entries()) {
      const isCooldownActive = state.cooldownUntil !== null && state.cooldownUntil > now;
      statuses.push({
        name,
        modelName: state.provider.modelName,
        available: state.provider.isAvailable(),
        enabled: state.provider.isEnabled() && !isCooldownActive,
        failureCount: state.failureCount,
        lastFailureAt: state.lastFailureAt ? new Date(state.lastFailureAt).toISOString() : null,
        cooldownUntil: isCooldownActive && state.cooldownUntil ? new Date(state.cooldownUntil).toISOString() : null
      });
    }

    return statuses;
  }

  public setProviderEnabled(name: string, enabled: boolean): boolean {
    const state = this.providers.get(name);
    if (!state) return false;

    state.provider.setEnabled(enabled);
    if (enabled) {
      state.failureCount = 0;
      state.cooldownUntil = null;
    }
    console.log(`[Synthesis Multi-AI Orchestrator] Provider ${name} enabled set to ${enabled}`);
    return true;
  }

  public disableProvider(name: string, cooldownMs: number = 60000): boolean {
    const state = this.providers.get(name);
    if (!state) return false;

    state.cooldownUntil = Date.now() + cooldownMs;
    console.warn(`[Synthesis Multi-AI Orchestrator] Provider ${name} temporarily disabled for ${cooldownMs}ms`);
    return true;
  }

  public enableProvider(name: string): boolean {
    return this.setProviderEnabled(name, true);
  }

  private isProviderCallable(state: ProviderState): boolean {
    if (!state.provider.isEnabled()) {
      return false;
    }

    const now = Date.now();
    if (state.cooldownUntil !== null) {
      if (state.cooldownUntil > now) {
        return false;
      } else {
        state.cooldownUntil = null;
        state.failureCount = 0;
      }
    }

    return true;
  }

  private recordProviderSuccess(state: ProviderState): void {
    state.failureCount = 0;
    state.lastFailureAt = null;
    state.cooldownUntil = null;
  }

  private recordProviderFailure(state: ProviderState, err: any): void {
    state.failureCount += 1;
    state.lastFailureAt = Date.now();
    console.warn(
      `[Synthesis Multi-AI Orchestrator] Provider ${state.provider.name} failed (Attempt/Failure count: ${state.failureCount}):`,
      err?.message || err
    );

    if (state.failureCount >= 3) {
      state.cooldownUntil = Date.now() + 60000;
      console.warn(
        `[Synthesis Multi-AI Orchestrator] Circuit Breaker triggered for ${state.provider.name}. Disabled for 60s.`
      );
    }
  }

  private async executeWithRetry(
    state: ProviderState,
    sanitizedPrompt: string,
    timeoutMs: number = 15000,
    maxRetries: number = 2
  ): Promise<AIProviderResponse> {
    let lastErr: any = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const backoffMs = Math.min(1000, 200 * Math.pow(2, attempt - 1));
        console.log(`[Synthesis Multi-AI Orchestrator] Retrying ${state.provider.name} (attempt ${attempt + 1}/${maxRetries + 1}) after ${backoffMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }

      try {
        const start = Date.now();
        const res = await state.provider.analyze(sanitizedPrompt, { timeoutMs });
        const latencyMs = res.latencyMs || (Date.now() - start);

        console.log(`[Synthesis Multi-AI Orchestrator] Provider ${state.provider.name} succeeded in ${latencyMs}ms (${res.promptTokens + res.completionTokens} tokens)`);
        this.recordProviderSuccess(state);
        return { ...res, latencyMs };
      } catch (err: any) {
        lastErr = err;
      }
    }

    this.recordProviderFailure(state, lastErr);
    const isTimeout = lastErr?.message?.toLowerCase().includes('timeout') || false;
    aiStatsManager.recordCallDetails({
      provider: state.provider.name,
      model: state.provider.modelName,
      latencyMs: timeoutMs,
      success: false,
      isTimeout,
      errorMsg: lastErr?.message || String(lastErr)
    });
    throw lastErr;
  }

  public buildOptimizedPrompt(context: AIAnalysisContext): string {
    return this.buildCouncilPrompt(context);
  }

  public buildCouncilPrompt(context: AIAnalysisContext): string {
    const testResults = context.testResults;
    const trimmedGitDiff = context.gitDiff
      ? (context.gitDiff.length > 1500 ? context.gitDiff.slice(0, 1500) + '\n... [Git Diff truncated for optimal context]' : context.gitDiff)
      : 'N/A';

    const trimmedStackTraces = context.stackTraces && context.stackTraces.length > 0
      ? context.stackTraces.slice(0, 5).map(st => st.slice(0, 300))
      : [];

    const changedFilesText = context.changedFiles && context.changedFiles.length > 0
      ? context.changedFiles.slice(0, 20).join(', ')
      : 'N/A';

    const copilotPrompt = context.adminCopilotContext?.prompt
      ? `\nSPECIFICKÝ DOTAZ ADMIN COPILOTA:\n${context.adminCopilotContext.prompt}\n`
      : '';

    const evidenceBundlesBlock = context.evidenceBundles && context.evidenceBundles.length > 0
      ? `\nDETEKOVANÉ DETERMINISTICKÉ DŮKAZY (EVIDENCE BUNDLES):
Pro každý nález byly deterministicky shromážděny následující podklady a stavy validace:
${JSON.stringify(context.evidenceBundles.map(b => ({
          findingId: b.findingId,
          findingMessage: b.findingMessage,
          severity: b.severity,
          validationStatus: b.validationStatus,
          stackTrace: b.stackTrace,
          apiRequestResponse: b.apiRequestResponse,
          previousVerifiedResult: b.previousVerifiedResult,
          gitDiff: b.gitDiff,
          sourceFiles: b.sourceFiles?.map(s => ({ filePath: s.filePath, hash: s.hash, contentSnippet: s.content.slice(0, 1500) }))
        })), null, 2)}
`
      : '';

    return `
Jsi nezávislý AI Audit Analytik v AI Radě (AI Council) projektu "Táta má právo".
Tvá úloha je provést objektovní, evidencemi doloženou bezpečnostní a funkční analýzu dodaného QA kontextu.

BEZPEČNOSTNÍ A DETERMINISTICKÉ ZÁSADY:
1. Nesmíš měnit výsledky deterministických testů ani skóre.
2. Nesmíš provádět žádné zápisy do databáze ani měnit oprávnění (RBAC).
3. Pokud existují selhání, P0/P1 nálezy nebo neotestované prvky, hodnocení musí být "FAIL".
4. Každý tvůj závěr musí být podložen konkrétním deterministickým důkazem (viz EVIDENCE BUNDLES). Pokud chybí zdrojový kód nebo relevantní stack trace pro FAIL/PARTIAL nález, nebo je hasSufficientEvidence = false, nesmíš jej potvrdit jako FAIL. V takovém případě musíš vrátit "NEEDS_REVIEW" s odůvodněním "INSUFFICIENT_EVIDENCE".
5. Již ověřený prvek (wasPreviouslyVerified = true a hasChangedSinceVerification = false) neanalyzuj znovu jako chybu. Označ jej jako vyřešený ("RESOLVED" nebo "PASS").

DODANÝ RELEVANTNÍ KONTEXT AUDITU:
- Commit SHA: ${context.commitSha} (${context.branch})
- Prostředí: ${context.environment}
- Změněné soubory: ${changedFilesText}
- Git Diff: ${trimmedGitDiff}
- Kontext závislostí: ${context.dependencyContext ? JSON.stringify(context.dependencyContext) : 'N/A'}
- Předchozí QA výsledky: ${context.previousQAResults ? JSON.stringify(context.previousQAResults) : 'N/A'}
${copilotPrompt}
${evidenceBundlesBlock}

VÝSLEDKY DETERMINISTICKÝCH TESTŮ:
- Metriky: Pages=${testResults.metrics.pages}, API=${testResults.metrics.apiEndpoints}, DB=${testResults.metrics.prismaModels}, E2E=${testResults.metrics.e2eTests}
- Skóre: Functional=${testResults.scores.functional}%, Security=${testResults.scores.security}%, Overall=${testResults.scores.overall}%
- Počty testů: PASS=${testResults.counts.pass}, FAIL=${testResults.counts.fail}, PARTIAL=${testResults.counts.partial}, NOT_TESTED=${testResults.counts.notTested}
- Závažnosti: P0=${testResults.counts.p0}, P1=${testResults.counts.p1}, P2=${testResults.counts.p2}, P3=${testResults.counts.p3}

SEZNAM NÁLEZŮ (FINDINGS):
${JSON.stringify(testResults.findings || [], null, 2)}

INVARIANTY A STACK TRACES:
- Invarianty: ${JSON.stringify(testResults.invariantsResults || [], null, 2)}
- Stack Traces: ${JSON.stringify(trimmedStackTraces, null, 2)}

Odpověz VÝHRADNĚ jako platný JSON objekt s následující přesnou strukturou:
{
  "summary": "Stručné shrnutí tvého zjištění jako nezávislého analytika.",
  "confidence": 0.95,
  "verdict": "PASS" | "FAIL" | "NEEDS_REVIEW",
  "findings": [
    {
      "finding": "Stručný název nebo popis zjištěného problému",
      "severity": "P0" | "P1" | "P2" | "P3",
      "rootCause": "Detailní příčina nebo vysvětlení problému",
      "confidence": 0.90,
      "evidence": "Konkrétní důkaz (stack trace, zpráva z testu, chyba)",
      "recommendation": "Doporučení pro opravu",
      "suggestedTests": ["Návrh nového testu 1"]
    }
  ]
}
`;
  }

  public async analyze(
    rawContext: AIAnalysisContext,
    options: SynthesisOptions = {}
  ): Promise<SynthesisAIResult> {
    const sanitizedContext: AIAnalysisContext = sanitizeInputData(rawContext);
    const timeoutMs = options.timeoutMs || 15000;
    const maxRetries = options.maxRetries ?? 1;

    // Check Trigger Optimization
    const shouldRun = shouldTriggerAICouncil(sanitizedContext, options);
    if (!shouldRun) {
      console.log('[Synthesis Multi-AI Orchestrator] AI Council skipped: 100% PASS with zero failures or P0/P1 issues.');
      aiStatsManager.recordSkipped('CLEAN_PASS_SKIPPED');
      return this.buildCleanPassReport(sanitizedContext);
    }

    // Get active & callable providers
    const availableStates: ProviderState[] = [];
    for (const state of this.providers.values()) {
      if (this.isProviderCallable(state)) {
        availableStates.push(state);
      }
    }

    if (availableStates.length === 0) {
      console.warn('[Synthesis Multi-AI Orchestrator] No AI providers available or enabled.');
      aiStatsManager.recordSkipped('NO_AVAILABLE_PROVIDERS');
      return this.buildFallbackReport(sanitizedContext, 'NO_AVAILABLE_PROVIDERS');
    }

    // Filter preferred providers if specified
    let targetStates = availableStates;
    if (options.preferredProviders && options.preferredProviders.length > 0) {
      const filtered = availableStates.filter(s => options.preferredProviders!.includes(s.provider.name));
      if (filtered.length > 0) {
        targetStates = filtered;
      }
    }

    // Generate Evidence Bundles for all findings
    const findingsList = sanitizedContext.testResults.findings || [];
    const evidenceBundles: EvidenceBundle[] = [];
    for (const finding of findingsList) {
      const bundle = await EvidenceValidator.createBundle(finding, {
        id: sanitizedContext.qaRunId || 'temp-run-id',
        commitSha: sanitizedContext.commitSha,
        branch: sanitizedContext.branch,
        environment: sanitizedContext.environment,
        findings: sanitizedContext.testResults.findings
      });
      evidenceBundles.push(bundle);
    }
    sanitizedContext.evidenceBundles = evidenceBundles;

    const councilPrompt = this.buildCouncilPrompt(sanitizedContext);
    console.log(`[Synthesis Multi-AI Orchestrator] Executing AI Council across ${targetStates.length} providers: ${targetStates.map(s => s.provider.name).join(', ')}`);

    const bundlesHash = crypto.createHash('sha256')
      .update(JSON.stringify(evidenceBundles.map(b => ({
        findingId: b.findingId,
        findingMessage: b.findingMessage,
        severity: b.severity,
        validationStatus: b.validationStatus,
        sourceFilesHash: b.sourceFiles?.map(s => s.hash)
      }))))
      .digest('hex');

    const executionPromises = targetStates.map(async state => {
      const bundleModelCacheKey = `bundle-cache:${sanitizedContext.commitSha}:${bundlesHash}:${state.provider.name}:${state.provider.modelName}`;
      
      let res: AIProviderResponse;
      const cachedResponse = aiCache.getBundleResult(bundleModelCacheKey);
      
      if (cachedResponse) {
        console.log(`[Synthesis Multi-AI Orchestrator] Cache hit for provider ${state.provider.name} and model ${state.provider.modelName}`);
        res = cachedResponse;
      } else {
        const promptStart = Date.now();
        res = await this.executeWithRetry(state, councilPrompt, timeoutMs, maxRetries);
        res.latencyMs = res.latencyMs || (Date.now() - promptStart);
        aiCache.setBundleResult(bundleModelCacheKey, res);
      }

      const start = Date.now();
      const latencyMs = res.latencyMs || (Date.now() - start);

      let parsed: any = {};
      try {
        parsed = JSON.parse(res.rawText);
      } catch (e) {
        parsed = {
          summary: res.rawText.slice(0, 200),
          confidence: 0.5,
          verdict: 'NEEDS_REVIEW',
          findings: []
        };
      }

      const formattedFindings: AICouncilFinding[] = (parsed.findings || []).map((f: any) => ({
        finding: f.finding || f.message || 'Neidentifikovaný nález',
        severity: ['P0', 'P1', 'P2', 'P3'].includes(f.severity) ? f.severity : 'P2',
        rootCause: f.rootCause || 'Root cause neuveden',
        confidence: typeof f.confidence === 'number' ? Math.min(1, Math.max(0, f.confidence)) : 0.8,
        evidence: f.evidence || 'Evidence neuvedena',
        recommendation: f.recommendation || f.fix || 'Doporučení neuvedeno',
        suggestedTests: Array.isArray(f.suggestedTests) ? f.suggestedTests : [],
        qaFindingId: f.qaFindingId
      }));

      const analystResult: AICouncilAnalystResult = {
        providerName: state.provider.name,
        modelName: state.provider.modelName,
        timestamp: new Date().toISOString(),
        confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.85,
        findings: formattedFindings,
        summary: parsed.summary || 'AI Analyst dokončil hodnocení.',
        verdict: ['PASS', 'FAIL', 'NEEDS_REVIEW'].includes(parsed.verdict) ? parsed.verdict : 'NEEDS_REVIEW'
      };

      return {
        providerName: state.provider.name,
        modelName: state.provider.modelName,
        analystResult,
        response: res,
        latencyMs
      };
    });

    const results = await Promise.allSettled(executionPromises);

    const analysts: Record<string, AICouncilAnalystResult> = {};
    const executedProviders: string[] = [];
    const providerReports: Record<string, any> = {};
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (const res of results) {
      if (res.status === 'fulfilled') {
        const val = res.value;
        executedProviders.push(val.providerName);
        analysts[val.providerName] = val.analystResult;

        totalPromptTokens += val.response.promptTokens;
        totalCompletionTokens += val.response.completionTokens;

        providerReports[val.providerName] = {
          verdict: val.analystResult.verdict,
          model: val.modelName,
          latencyMs: val.latencyMs,
          tokenUsage: {
            promptTokens: val.response.promptTokens,
            completionTokens: val.response.completionTokens,
            totalTokens: val.response.promptTokens + val.response.completionTokens
          },
          summary: val.analystResult.summary
        };

        aiStatsManager.recordCallDetails({
          provider: val.providerName,
          model: val.modelName,
          promptTokens: val.response.promptTokens,
          completionTokens: val.response.completionTokens,
          latencyMs: val.latencyMs,
          success: true
        });
      }
    }

    if (Object.keys(analysts).length === 0) {
      aiStatsManager.recordSkipped('ALL_PROVIDERS_FAILED');
      return this.buildFallbackReport(sanitizedContext, 'ALL_PROVIDERS_FAILED');
    }

    // Evaluate Consensus via ConsensusEngine
    const consensus = ConsensusEngine.evaluateConsensus(sanitizedContext, analysts, {
      qaRunId: options.qaRunId || sanitizedContext.qaRunId
    });

    const estimatedCostUsd = Number(((totalPromptTokens + totalCompletionTokens) * 0.000005).toFixed(6));

    const primaryAnalyst = Object.values(analysts)[0];
    const combinedFixes = Array.from(new Set(consensus.agreedFindings.map(f => f.recommendation)));
    const combinedTests = Array.from(new Set(consensus.agreedFindings.flatMap(f => f.suggestedTests)));
    const combinedCriticalFindings = consensus.agreedFindings.map(f => `[${f.severity}] ${f.finding}: ${f.rootCause}`);

    return {
      executiveSummary: `[AI Council: ${consensus.status}] ${primaryAnalyst.summary}`,
      technicalSummary: `AI Rada vyhodnotila ${Object.keys(analysts).length} nezávislých analytiků (${Object.keys(analysts).join(', ')}). Konsenzus: ${consensus.status}, Verdikt: ${consensus.consensusVerdict}.`,
      criticalFindings: combinedCriticalFindings,
      rootCauseAnalysis: consensus.agreedFindings.length > 0 ? consensus.agreedFindings[0].rootCause : 'Žádné kritické selhání nebylo potvrzeno.',
      riskAssessment: consensus.finalQAVerdict === 'NOT PRODUCTION READY' ? 'Vysoké riziko – blokováno Quality Gate.' : 'Rizika jsou v mezích normy.',
      recommendedFixes: combinedFixes,
      suggestedTests: combinedTests,
      productionReadinessAssessment: consensus.finalQAVerdict === 'NOT PRODUCTION READY'
        ? 'PRODUCTION READY smí vzniknout pouze tehdy, pokud všechny povinné QA prvky mají aktuální VERIFIED/PASS stav.'
        : 'Aplikace splňuje kritéria pro produkční nasazení.',
      aiVerdict: consensus.finalQAVerdict,
      providerUsed: Object.keys(analysts).length === 1 ? (Object.keys(analysts)[0] as any) : 'multi' as any,
      modelUsed: Object.values(analysts).map(a => `${a.providerName}:${a.modelName}`).join(', '),
      cachedHit: false,
      tokensUsed: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens
      },
      estimatedCostUsd,
      aiCouncil: consensus,
      multiProviderSynthesis: {
        executedProviders,
        providerReports,
        consensusVerdict: consensus.finalQAVerdict
      }
    };
  }

  private buildCleanPassReport(context: AIAnalysisContext): SynthesisAIResult {
    const timestamp = new Date().toISOString();
    return {
      executiveSummary: `Audit vyhodnotil 100% PASS s nulovým počtem selhání a P0/P1 nálezů. AI Council spuštění přeskočeno pro úsporu zdrojů.`,
      technicalSummary: `Všechny komponenty, API i testy jsou ve stavu VERIFIED/PASS. Celkové QA skóre: ${context.testResults.scores.overall}%.`,
      criticalFindings: [],
      rootCauseAnalysis: 'Žádná selhání nebyla detekována.',
      riskAssessment: 'Provozní i bezpečnostní rizika jsou minimální.',
      recommendedFixes: [],
      suggestedTests: ['Pokračovat v pravidelných automatizovaných auditech'],
      productionReadinessAssessment: 'Aplikace splňuje všechna kritéria pro produkční nasazení.',
      aiVerdict: 'PRODUCTION READY',
      providerUsed: 'none',
      skippedReason: 'CLEAN_PASS_SKIPPED',
      aiCouncil: {
        status: 'UNANIMOUS',
        consensusVerdict: 'PASS',
        finalQAVerdict: 'PRODUCTION READY',
        agreedFindings: [],
        disputedFindings: [],
        insufficientEvidenceReason: 'AI Council skipped: 100% PASS with zero failures or P0/P1 issues.',
        analysts: {},
        timestamp,
        qaRunId: context.qaRunId
      },
      multiProviderSynthesis: {
        executedProviders: [],
        providerReports: {},
        consensusVerdict: 'PRODUCTION READY'
      }
    };
  }

  private buildFallbackReport(context: AIAnalysisContext, reason: string): SynthesisAIResult {
    const verdict = computeDeterministicVerdict(context.testResults.counts);
    const criticalFindingsList = (context.testResults.findings || []).map(f => `[${f.severity}] ${f.category}: ${f.message}`);
    const isNotReady = verdict === 'NOT PRODUCTION READY';
    const timestamp = new Date().toISOString();

    return {
      executiveSummary: isNotReady
        ? `Audit vyhodnotil stav jako NOT PRODUCTION READY (Deterministická brána). Neověřené: ${context.testResults.counts.notTested}, Částečné: ${context.testResults.counts.partial}, Selhání: ${context.testResults.counts.fail}.`
        : `Všechny deterministické testy proběhly úspěšně. Celkové QA skóre: ${context.testResults.scores.overall}%.`,
      technicalSummary: `Aplikace: Discovered=${context.testResults.counts.discovered || context.testResults.metrics.pages}, PASS=${context.testResults.counts.pass}, FAIL=${context.testResults.counts.fail}, PARTIAL=${context.testResults.counts.partial}, NOT_TESTED=${context.testResults.counts.notTested}.`,
      criticalFindings: criticalFindingsList.length > 0 ? criticalFindingsList : ['Žádné kritické nálezy.'],
      rootCauseAnalysis: isNotReady
        ? 'Důvodem NOT PRODUCTION READY stavu je přítomnost selhání, PARTIAL testů nebo neotestovaných prvků.'
        : 'Všechny provozní testy indikují stabilní stav.',
      riskAssessment: isNotReady
        ? 'Vysoké provozní a bezpečnostní riziko. Nasazení blokováno Quality Gate.'
        : 'Rizika vyhodnocena jako minimální.',
      recommendedFixes: isNotReady
        ? ['Doplňte testy pro neotestované prvky (NOT TESTED).', 'Opravte zjištěná selhání a P0/P1 nálezy.']
        : ['Aplikujte doporučené bezpečnostní hlavičky.'],
      suggestedTests: [
        'Automatizované IDOR testy pro spisy',
        'Zátěžové testy pro obnovení session tokenu'
      ],
      productionReadinessAssessment: isNotReady
        ? 'PRODUCTION READY smí vzniknout pouze tehdy, pokud všechny povinné QA prvky mají aktuální VERIFIED/PASS stav.'
        : 'Aplikace splňuje kritéria pro produkční nasazení.',
      aiVerdict: verdict,
      providerUsed: 'none',
      skippedReason: reason,
      aiCouncil: {
        status: 'INSUFFICIENT_EVIDENCE',
        consensusVerdict: 'NEEDS_REVIEW',
        finalQAVerdict: verdict,
        agreedFindings: [],
        disputedFindings: [],
        insufficientEvidenceReason: `AI analytici nebyli dostupní (${reason}).`,
        analysts: {},
        timestamp,
        qaRunId: context.qaRunId
      },
      multiProviderSynthesis: {
        executedProviders: [],
        providerReports: {},
        consensusVerdict: verdict
      }
    };
  }
}

export const synthesisMultiAIOrchestrator = new SynthesisMultiAIOrchestrator();
