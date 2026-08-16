import {
  AICouncilAnalystResult,
  AICouncilConsensus,
  AICouncilFinding,
  AIAnalysisContext,
  ConsensusStatus
} from './types';
import { computeDeterministicVerdict } from './aiAnalystOrchestrator';

export class ConsensusEngine {
  public static evaluateConsensus(
    context: AIAnalysisContext,
    analysts: Record<string, AICouncilAnalystResult>,
    options?: { qaRunId?: string }
  ): AICouncilConsensus {
    const timestamp = new Date().toISOString();
    const analystList = Object.values(analysts);
    const deterministicVerdict = computeDeterministicVerdict(context.testResults.counts);
    const qaRunId = options?.qaRunId || context.qaRunId;

    // 1. If 0 analysts ran or empty
    if (analystList.length === 0) {
      return {
        status: 'INSUFFICIENT_EVIDENCE',
        consensusVerdict: 'NEEDS_REVIEW',
        finalQAVerdict: deterministicVerdict,
        agreedFindings: [],
        disputedFindings: [],
        insufficientEvidenceReason: 'Žádný AI analytik neposkytl výsledky.',
        analysts: {},
        timestamp,
        qaRunId
      };
    }

    // Link findings to specific QA findings if matching message or category
    for (const analyst of analystList) {
      for (const f of analyst.findings) {
        if (!f.qaFindingId && context.testResults.findings) {
          const match = context.testResults.findings.find(
            (qaf: any) => qaf.id && (
              qaf.message.toLowerCase().includes(f.finding.toLowerCase()) ||
              f.finding.toLowerCase().includes(qaf.message.toLowerCase())
            )
          );
          if (match && (match as any).id) {
            f.qaFindingId = (match as any).id;
          }
        }
      }
    }

    // Compare verdicts
    const verdicts = analystList.map(a => a.verdict);
    const passCount = verdicts.filter(v => v === 'PASS').length;
    const failCount = verdicts.filter(v => v === 'FAIL').length;
    const totalAnalysts = analystList.length;

    let consensusStatus: ConsensusStatus = 'DISAGREEMENT';
    let rawConsensusVerdict: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' = 'NEEDS_REVIEW';

    if (totalAnalysts === 1) {
      consensusStatus = 'UNANIMOUS';
      rawConsensusVerdict = verdicts[0];
    } else if (passCount === totalAnalysts) {
      consensusStatus = 'UNANIMOUS';
      rawConsensusVerdict = 'PASS';
    } else if (failCount === totalAnalysts) {
      consensusStatus = 'UNANIMOUS';
      rawConsensusVerdict = 'FAIL';
    } else if (passCount / totalAnalysts > 0.5) {
      consensusStatus = 'MAJORITY';
      rawConsensusVerdict = 'PASS';
    } else if (failCount / totalAnalysts > 0.5) {
      consensusStatus = 'MAJORITY';
      rawConsensusVerdict = 'FAIL';
    } else {
      consensusStatus = 'DISAGREEMENT';
      rawConsensusVerdict = 'NEEDS_REVIEW';
    }

    // Collect agreed and disputed findings across analysts
    const allFindingsMap = new Map<string, { finding: AICouncilFinding; occurrences: number; analysts: string[] }>();

    for (const analyst of analystList) {
      for (const f of analyst.findings) {
        const key = `${f.severity}:${f.finding.toLowerCase().trim()}`;
        if (!allFindingsMap.has(key)) {
          allFindingsMap.set(key, { finding: { ...f }, occurrences: 1, analysts: [analyst.providerName] });
        } else {
          const existing = allFindingsMap.get(key)!;
          existing.occurrences += 1;
          existing.analysts.push(analyst.providerName);
          existing.finding.confidence = Number(((existing.finding.confidence + f.confidence) / 2).toFixed(2));
        }
      }
    }

    const agreedFindings: AICouncilFinding[] = [];
    const disputedFindings: AICouncilFinding[] = [];

    for (const entry of allFindingsMap.values()) {
      if (entry.occurrences >= Math.ceil(totalAnalysts / 2)) {
        agreedFindings.push(entry.finding);
      } else {
        disputedFindings.push(entry.finding);
      }
    }

    // Apply strict QA Priority Rules:
    // Rule A: QA = PASS -> AI cannot create a FAIL without verifiable evidence (e.g. stack trace or P0/P1)
    // Rule B: QA = FAIL -> AI cannot change FAIL to PASS.
    // Rule C: AI disagreement -> mark verdict/status as NEEDS_REVIEW.

    const isDeterministicPass = deterministicVerdict === 'PRODUCTION READY';
    const isDeterministicFail = deterministicVerdict === 'NOT PRODUCTION READY';

    let adjustedConsensusVerdict = rawConsensusVerdict;
    if (consensusStatus === 'DISAGREEMENT') {
      adjustedConsensusVerdict = 'NEEDS_REVIEW';
    }

    let finalQAVerdict = deterministicVerdict;

    if (isDeterministicPass) {
      if (adjustedConsensusVerdict === 'FAIL') {
        const hasVerifiableEvidence = agreedFindings.some(
          f => (f.severity === 'P0' || f.severity === 'P1') && f.evidence && f.evidence.length > 10
        );
        if (hasVerifiableEvidence) {
          finalQAVerdict = 'NOT PRODUCTION READY';
        } else {
          // No verifiable evidence -> AI cannot override QA PASS!
          adjustedConsensusVerdict = 'PASS';
          finalQAVerdict = 'PRODUCTION READY';
        }
      } else {
        finalQAVerdict = 'PRODUCTION READY';
      }
    } else if (isDeterministicFail) {
      // Deterministic FAIL -> AI CANNOT change FAIL to PASS
      finalQAVerdict = 'NOT PRODUCTION READY';
      if (adjustedConsensusVerdict === 'PASS') {
        adjustedConsensusVerdict = 'NEEDS_REVIEW';
      }
    } else {
      // PRODUCTION READY WITH WARNINGS
      if (adjustedConsensusVerdict === 'FAIL') {
        finalQAVerdict = 'NOT PRODUCTION READY';
      } else if (adjustedConsensusVerdict === 'NEEDS_REVIEW') {
        finalQAVerdict = 'PRODUCTION READY WITH WARNINGS';
      }
    }

    return {
      status: consensusStatus,
      consensusVerdict: adjustedConsensusVerdict,
      finalQAVerdict,
      agreedFindings,
      disputedFindings,
      analysts,
      timestamp,
      qaRunId
    };
  }
}
