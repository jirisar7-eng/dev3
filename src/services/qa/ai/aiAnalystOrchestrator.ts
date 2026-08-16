import crypto from 'crypto';
import { AIAnalysisInput, AIAnalystReport, AIAnalysisContext } from './types';
import { sanitizeInputData } from './sanitizer';
import { aiCache } from './aiCache';
import { aiStatsManager } from './aiStats';
import { synthesisMultiAIOrchestrator } from './synthesisMultiAIOrchestrator';

export function computeDeterministicVerdict(counts: {
  pass: number;
  fail: number;
  partial: number;
  notTested: number;
  p0: number;
  p1: number;
  p2: number;
  p3: number;
  discovered?: number;
  verifiedSkipped?: number;
}): 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY' {
  // Rule 6: P0 or P1 → ALWAYS NOT PRODUCTION READY
  if (counts.p0 > 0 || counts.p1 > 0 || counts.fail > 0) {
    return 'NOT PRODUCTION READY';
  }

  // Rules 1, 2, 4, 5, 9: If NOT TESTED > 0 or PARTIAL > 0, CANNOT BE PRODUCTION READY
  if (counts.notTested > 0 || counts.partial > 0) {
    return 'NOT PRODUCTION READY';
  }

  // If there are P2 or P3 findings (and 0 P0/P1, 0 fail, 0 partial, 0 notTested)
  if (counts.p2 > 0 || counts.p3 > 0) {
    return 'PRODUCTION READY WITH WARNINGS';
  }

  return 'PRODUCTION READY';
}

export const aiAnalystOrchestrator = {
  shouldTriggerAI(input: AIAnalysisInput): boolean {
    const hasFailures = input.counts.fail > 0;
    const hasP0 = input.counts.p0 > 0;
    const hasP1 = input.counts.p1 > 0;
    const hasSecurityIssue = hasP0 || hasP1;
    const isNewFinding = !!input.hasNewFinding;
    const isRegression = !!input.hasRegression;
    const needsRootCause = !!input.requiresRootCauseAnalysis;
    const isExplicitAdminRequest = !!input.adminRequested || input.preferredProvider === 'grok';

    return (
      hasFailures ||
      hasSecurityIssue ||
      isNewFinding ||
      isRegression ||
      needsRootCause ||
      isExplicitAdminRequest
    );
  },

  buildDeterministicReport(input: AIAnalysisInput, skippedReason?: string): AIAnalystReport {
    const verdict = computeDeterministicVerdict(input.counts);
    const criticalFindingsList = input.findings.map(f => `[${f.severity}] ${f.category}: ${f.message}`);

    const isNotReady = verdict === 'NOT PRODUCTION READY';
    const isWarnings = verdict === 'PRODUCTION READY WITH WARNINGS';

    return {
      executiveSummary: isNotReady
        ? `Audit vyhodnotil stav jako NOT PRODUCTION READY. Neověřené prvky: ${input.counts.notTested}, Částečné: ${input.counts.partial}, Selhání: ${input.counts.fail}, P0/P1: ${input.counts.p0}/${input.counts.p1}.`
        : isWarnings
        ? `Audit proběhl s varováními P2/P3. Všechny prvky jsou ověřeny, ale doporučuje se vyřešit zjištěná varování.`
        : `Všechny deterministické testy a bezpečnostní kontroly proběhly úspěšně. Celkové QA skóre dosahuje ${input.scores.overall}%.`,
      technicalSummary: `Aplikace: Discovered=${input.counts.discovered || input.metrics.pages}, PASS=${input.counts.pass}, FAIL=${input.counts.fail}, PARTIAL=${input.counts.partial}, NOT_TESTED=${input.counts.notTested}, VERIFIED/SKIPPED=${input.counts.verifiedSkipped || 0}.`,
      criticalFindings: criticalFindingsList.length > 0 ? criticalFindingsList : ['Žádné kritické nálezy.'],
      rootCauseAnalysis: isNotReady
        ? 'Důvodem NOT PRODUCTION READY stavu je přítomnost selhání (P0/P1), částečně prošlých testů (PARTIAL) nebo neotestovaných prvků (NOT TESTED).'
        : 'Sledované API endpointy a databázové operace vykazují očekávanou deterministickou odezvu.',
      riskAssessment: isNotReady
        ? 'Vysoké provozní a bezpečnostní riziko. Produkční nasazení je blokováno Quality Gate.'
        : 'Riziko porušení integrity dat nebo neoprávněného přístupu bylo vyhodnoceno jako minimální.',
      recommendedFixes: isNotReady
        ? ['Doplňte testy pro neotestované prvky (NOT TESTED).', 'Opravte zjištěná selhání a P0/P1 nálezy.', 'Ověřte všechny PARTIAL testy.']
        : ['Aplikujte doporučené bezpečnostní hlavičky.'],
      suggestedTests: [
        'Automatizované IDOR testy pro spisy v UserCase',
        'Zátěžové testy pro obnovení session tokenu',
        'Testy správné exspirace cookie consent souborů'
      ],
      productionReadinessAssessment: isNotReady
        ? 'PRODUCTION READY smí vzniknout pouze tehdy, pokud všechny povinné QA prvky mají aktuální VERIFIED/PASS stav.'
        : 'Aplikace plně splňuje kritéria pro produkční nasazení.',
      aiVerdict: verdict,
      providerUsed: 'none',
      skippedReason
    };
  },

  async analyzeRunPayload(rawInput: AIAnalysisInput): Promise<AIAnalystReport> {
    // 1. Sanitize sensitive information
    const sanitizedInput = sanitizeInputData(rawInput);

    // 2. Check if AI execution is triggered
    if (!this.shouldTriggerAI(sanitizedInput)) {
      aiStatsManager.recordSkipped('PASS_SKIPPED');
      return this.buildDeterministicReport(sanitizedInput, 'PASS_SKIPPED');
    }

    // 3. Check Quota Limits
    if (aiStatsManager.isQuotaExceeded()) {
      aiStatsManager.recordSkipped('AI_ANALYSIS_SKIPPED_QUOTA');
      return this.buildDeterministicReport(sanitizedInput, 'AI_ANALYSIS_SKIPPED_QUOTA');
    }

    // 4. Compute SHA-256 Cache Key
    const sourceHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        metrics: sanitizedInput.metrics,
        scores: sanitizedInput.scores,
        counts: sanitizedInput.counts,
        findings: sanitizedInput.findings,
        invariants: sanitizedInput.invariantsResults
      }))
      .digest('hex');

    const contextKey = `${sanitizedInput.environment}:${sanitizedInput.branch}:${sanitizedInput.contextKey || 'default'}`;

    const preferredProvider = sanitizedInput.preferredProvider || 'auto';
    const cacheKey = aiCache.computeKey({
      commitSha: sanitizedInput.commitSha,
      sourceHash,
      context: contextKey,
      provider: preferredProvider,
      model: 'synthesis-multi-ai'
    });

    // 5. Check Cache
    const cachedReport = aiCache.get(cacheKey);
    if (cachedReport) {
      aiStatsManager.recordCacheHit();
      return cachedReport;
    }

    // 6. Build AIAnalysisContext
    const context: AIAnalysisContext = {
      commitSha: sanitizedInput.commitSha,
      branch: sanitizedInput.branch,
      environment: sanitizedInput.environment,
      qaRunId: sanitizedInput.qaRunId,
      hasRegression: sanitizedInput.hasRegression,
      forceExecute: sanitizedInput.forceExecute || sanitizedInput.adminRequested,
      testResults: {
        metrics: sanitizedInput.metrics,
        scores: sanitizedInput.scores,
        counts: sanitizedInput.counts,
        findings: sanitizedInput.findings,
        invariantsResults: sanitizedInput.invariantsResults
      },
      stackTraces: sanitizedInput.stackTraces,
      adminCopilotContext: {
        scope: 'QA Audit Analysis'
      }
    };

    // 7. Delegate to Synthesis Multi-AI Orchestrator
    const preferredProviders = sanitizedInput.preferredProvider && sanitizedInput.preferredProvider !== 'auto'
      ? [sanitizedInput.preferredProvider]
      : undefined;

    const report = await synthesisMultiAIOrchestrator.analyze(context, {
      mode: 'council',
      preferredProviders,
      timeoutMs: 15000,
      maxRetries: 1,
      qaRunId: sanitizedInput.qaRunId
    });

    // Cache successful result
    if (report && !report.skippedReason) {
      aiCache.set(cacheKey, report);
    }

    return report;
  }
};

