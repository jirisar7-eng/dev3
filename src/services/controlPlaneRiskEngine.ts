import { ControlPlaneRiskLevel, ControlPlaneFinding, RiskAnalysisResult } from '../types/controlPlane';

export interface AIImpactSuggestion {
  securityImpact: string;
  dataImpact: string;
  productionImpact: string;
  availabilityImpact: string;
  userImpact: string;
  reversibility: string;
  affectedScope: string;
  suggestedSeverity: string;
}

export class ControlPlaneRiskEngine {
  
  /**
   * Deterministic Risk Calculation
   * Refuses to blindly trust AI suggested severity.
   */
  public static calculateRisk(
    title: string,
    description: string,
    impact: AIImpactSuggestion,
    confidence: number
  ): RiskAnalysisResult {
    let severity: ControlPlaneRiskLevel = 'P3';
    let isP0 = false;
    let isP1 = false;
    let isP2 = false;
    const reasons: string[] = [];
    
    const textToAnalyze = (title + ' ' + description + ' ' + Object.values(impact).join(' ')).toLowerCase();
    
    // P0 RULES (CRITICAL)
    const p0Keywords = [
      'únik secretů', 'secret leak', 'credentials exposed', 
      'bypass autentizace', 'auth bypass', 'unauthenticated access',
      'bypass rbac', 'privilege escalation', 'rbac bypass',
      'destrukce produkčních dat', 'data destruction', 'drop table',
      'vzdálené převzetí', 'rce', 'remote code execution',
      'nekontrolovaný deploy', 'uncontrolled deploy',
      'zápis do main', 'write to main', 'force push main',
      'kritická ztráta dat', 'data loss'
    ];
    
    // P1 RULES (HIGH)
    const p1Keywords = [
      'sql injection', 'xss', 'security vulnerability',
      'api limit', 'rate limit bypass',
      'downtime', 'výpadek produkce', 'production outage',
      'corrupted data', 'porušení integrity'
    ];
    
    // P2 RULES (MEDIUM)
    const p2Keywords = [
      'performance degradation', 'zpomalení', 'timeout',
      'ui chyba', 'broken layout', 'validation error',
      'non-critical bug', 'regression'
    ];
    
    for (const kw of p0Keywords) {
      if (textToAnalyze.includes(kw)) {
        isP0 = true;
        reasons.push(`Detekován kritický bezpečnostní/data symptom (P0): ${kw}`);
      }
    }
    
    if (!isP0) {
      for (const kw of p1Keywords) {
        if (textToAnalyze.includes(kw)) {
          isP1 = true;
          reasons.push(`Detekován závažný symptom (P1): ${kw}`);
        }
      }
    }
    
    if (!isP0 && !isP1) {
      for (const kw of p2Keywords) {
        if (textToAnalyze.includes(kw)) {
          isP2 = true;
          reasons.push(`Detekován střední symptom (P2): ${kw}`);
        }
      }
    }
    
    if (isP0) severity = 'P0';
    else if (isP1) severity = 'P1';
    else if (isP2) severity = 'P2';
    else severity = 'P3';
    
    // Fallback if AI suggested P0 but no keywords matched - we still require human review
    // but we might not auto-elevate to P0 unless confidence is very high.
    // Actually, fail closed: if AI thinks it's P0, we make it P1 requiring human review to confirm P0.
    if (impact.suggestedSeverity === 'P0' && !isP0) {
      severity = 'P1';
      reasons.push('AI navrhlo P0, ale nebyl nalezen deterministický důkaz. Vyžadována manuální eskalace (Fail Closed).');
    }
    
    const recommendsHumanReview = confidence < 0.8 || severity === 'P0' || severity === 'P1';
    
    // Calculate Project Priority Score
    let priorityScore = 0;
    if (severity === 'P0') priorityScore += 1000;
    if (severity === 'P1') priorityScore += 500;
    if (severity === 'P2') priorityScore += 100;
    if (severity === 'P3') priorityScore += 10;
    
    if (textToAnalyze.includes('production')) priorityScore += 200;
    if (textToAnalyze.includes('security')) priorityScore += 300;
    
    // Confidence penalty
    priorityScore = Math.floor(priorityScore * confidence);

    let priorityReason = `Základní skóre pro ${severity}. `;
    if (confidence < 0.5) priorityReason += 'Skóre sníženo kvůli nízké AI confidence. ';

    return {
      severity,
      confidence,
      reason: reasons.length > 0 ? reasons.join(' | ') : 'Symptom odpovídá P3 (Low Risk).',
      recommendsHumanReview,
      priorityScore,
      priorityReason
    };
  }

  public static generateFingerprint(source: string, title: string, affectedResources: string[]): string {
    const crypto = require('crypto');
    const normalizedTitle = title.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const resources = affectedResources.sort().join('|');
    const raw = `${source}:${normalizedTitle}:${resources}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
