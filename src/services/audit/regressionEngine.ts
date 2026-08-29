import { AuditRecord, AuditFinding, RegressionFinding, FindingStatus, FindingSeverity } from './types';

export class RegressionEngine {
  /**
   * Generates a canonical lookup key for finding matching between audits.
   */
  public static getFindingKey(finding: AuditFinding): string {
    if (finding.code && !finding.isDerivedCode) {
      return finding.code.toUpperCase().trim();
    }
    // For derived codes, normalize title to form a deterministic key
    return finding.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 60);
  }

  /**
   * Deterministically compares two audit records (previous vs current).
   */
  public static compareAudits(previousAudit: AuditRecord, currentAudit: AuditRecord): RegressionFinding[] {
    const regressions: RegressionFinding[] = [];

    const prevMap = new Map<string, AuditFinding>();
    for (const f of previousAudit.findings) {
      prevMap.set(this.getFindingKey(f), f);
    }

    const currMap = new Map<string, AuditFinding>();
    for (const f of currentAudit.findings) {
      currMap.set(this.getFindingKey(f), f);
    }

    // 1. Analyze current findings against previous
    for (const [key, currFinding] of currMap.entries()) {
      const prevFinding = prevMap.get(key);

      if (!prevFinding) {
        // NEW finding
        regressions.push({
          findingId: currFinding.id,
          code: currFinding.code,
          title: currFinding.title,
          currentSeverity: currFinding.severity,
          currentStatus: currFinding.status,
          changeType: 'NEW',
          currentAuditId: currentAudit.id,
          explanation: `Nové zjištění (${currFinding.severity}): ${currFinding.title} se poprvé objevilo v auditu ${currentAudit.id}.`,
        });
      } else {
        // Finding existed previously

        // Check for SEVERITY_DRIFT
        if (prevFinding.severity !== currFinding.severity) {
          regressions.push({
            findingId: currFinding.id,
            code: currFinding.code,
            title: currFinding.title,
            previousSeverity: prevFinding.severity,
            currentSeverity: currFinding.severity,
            previousStatus: prevFinding.status,
            currentStatus: currFinding.status,
            changeType: 'SEVERITY_DRIFT',
            previousAuditId: previousAudit.id,
            currentAuditId: currentAudit.id,
            explanation: `Změna závažnosti z ${prevFinding.severity} na ${currFinding.severity} mezi audity ${previousAudit.id} a ${currentAudit.id}.`,
          });
        }

        // Check for REGRESSION (Reopened after fix)
        const wasResolved = prevFinding.status === 'FIXED' || prevFinding.status === 'VERIFIED';
        const isNowOpen = currFinding.status === 'OPEN' || currFinding.status === 'IN_PROGRESS';

        if (wasResolved && isNowOpen) {
          regressions.push({
            findingId: currFinding.id,
            code: currFinding.code,
            title: currFinding.title,
            previousSeverity: prevFinding.severity,
            currentSeverity: currFinding.severity,
            previousStatus: prevFinding.status,
            currentStatus: currFinding.status,
            changeType: 'REGRESSION',
            previousAuditId: previousAudit.id,
            currentAuditId: currentAudit.id,
            explanation: `Regrese: Zjištění bylo v auditu ${previousAudit.id} ve stavu ${prevFinding.status}, ale v ${currentAudit.id} je znovu ${currFinding.status}.`,
          });
        } else if (!wasResolved && isNowOpen) {
          // PERSISTENT finding
          regressions.push({
            findingId: currFinding.id,
            code: currFinding.code,
            title: currFinding.title,
            previousSeverity: prevFinding.severity,
            currentSeverity: currFinding.severity,
            previousStatus: prevFinding.status,
            currentStatus: currFinding.status,
            changeType: 'PERSISTENT',
            previousAuditId: previousAudit.id,
            currentAuditId: currentAudit.id,
            explanation: `Trvající otevřené zjištění (${currFinding.severity}) přetrvává z auditu ${previousAudit.id} do ${currentAudit.id}.`,
          });
        } else if (!wasResolved && (currFinding.status === 'FIXED' || currFinding.status === 'VERIFIED')) {
          // RESOLVED finding
          regressions.push({
            findingId: currFinding.id,
            code: currFinding.code,
            title: currFinding.title,
            previousSeverity: prevFinding.severity,
            currentSeverity: currFinding.severity,
            previousStatus: prevFinding.status,
            currentStatus: currFinding.status,
            changeType: 'RESOLVED',
            previousAuditId: previousAudit.id,
            currentAuditId: currentAudit.id,
            explanation: `Vyřešeno: Zjištění z auditu ${previousAudit.id} (${prevFinding.status}) bylo v auditu ${currentAudit.id} úspěšně označeno jako ${currFinding.status}.`,
          });
        }
      }
    }

    // 2. Check for findings in previous audit that disappeared in current audit (implicitly resolved if current audit passed)
    for (const [key, prevFinding] of prevMap.entries()) {
      if (!currMap.has(key)) {
        if (prevFinding.status === 'OPEN' || prevFinding.status === 'IN_PROGRESS') {
          if (currentAudit.status === 'PASS' || currentAudit.status === 'PASS_WITH_WARNINGS') {
            regressions.push({
              findingId: prevFinding.id,
              code: prevFinding.code,
              title: prevFinding.title,
              previousSeverity: prevFinding.severity,
              currentSeverity: prevFinding.severity,
              previousStatus: prevFinding.status,
              currentStatus: 'FIXED',
              changeType: 'RESOLVED',
              previousAuditId: previousAudit.id,
              currentAuditId: currentAudit.id,
              explanation: `Automaticky vyřešeno: Otevřené zjištění z auditu ${previousAudit.id} se v novém úspěšném auditu ${currentAudit.id} již nevyskytuje.`,
            });
          }
        }
      }
    }

    return regressions;
  }

  /**
   * Analyzes an entire chronological array of audits (oldest to newest) to track complete lifecycle.
   */
  public static analyzeAuditTimeline(audits: AuditRecord[]): RegressionFinding[] {
    if (!audits || audits.length <= 1) {
      return [];
    }

    // Sort ascending by date for chronological progression
    const sorted = [...audits].sort((a, b) => a.date.localeCompare(b.date));
    const allRegressions: RegressionFinding[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const stepRegressions = this.compareAudits(prev, curr);
      allRegressions.push(...stepRegressions);
    }

    return allRegressions;
  }
}
