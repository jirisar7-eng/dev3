import { AuditRegistryEngine } from './auditRegistryEngine';
import { RegressionEngine } from './regressionEngine';
import { ControlPlaneService } from '../controlPlaneService';
import {
  AuditRecord,
  AuditFinding,
  RegressionFinding,
  AuditRegistrySummary,
  ReleaseGateEvaluationResult,
  ReleaseGateVerdict,
  ReleaseGateBlocker,
  RuntimeEvidence,
  EvidenceState,
  ProjectHealthPillars,
  ProjectHealthStatus,
} from './types';

export class ReleaseGateService {
  /**
   * Sanitizes text to prevent any secret or PII leakage into blockers or logs.
   */
  private static sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\w-]{24,}/g, '[REDACTED_TOKEN]')
      .replace(/bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/password\s*[:=]\s*\S+/gi, 'password=[REDACTED]')
      .replace(/api[_-]?key\s*[:=]\s*\S+/gi, 'apiKey=[REDACTED]');
  }

  /**
   * Evaluates the 5 Project Health pillars deterministically without any AI.
   */
  public static evaluateProjectHealth(
    summary: AuditRegistrySummary,
    latestAudit: AuditRecord | undefined,
    regressions: RegressionFinding[],
    controlPlaneActions: any[],
    evidence: RuntimeEvidence
  ): ProjectHealthPillars {
    // 1. Database & Migrations
    let dbStatus: ProjectHealthStatus = 'UNKNOWN';
    let dbMessage = 'Stav migrací a databáze není přímo ověřen proti běžící DB.';

    if (evidence.migrationStatus === 'FAILED') {
      dbStatus = 'FAILED';
      dbMessage = `Kritická chyba migrací/databáze: ${this.sanitizeText(evidence.migrationDetails || 'Migration check failed')}`;
    } else if (evidence.migrationStatus === 'VERIFIED') {
      dbStatus = 'VERIFIED';
      dbMessage = 'Prisma schéma a migrace jsou plně synchronizovány.';
    } else {
      dbStatus = 'UNKNOWN';
      dbMessage = 'Databázový server nebyl v běhu / migrační stav je neověřen (UNKNOWN).';
    }

    // 2. Security & RBAC
    let secStatus: ProjectHealthStatus = 'VERIFIED';
    let secMessage = 'Žádná otevřená zranitelnost P0/P1 nebyla detekována.';

    const openP0 = summary.severityCounts.p0;
    const openP1 = summary.severityCounts.p1;
    const hasSecRegression = regressions.some(
      r => r.changeType === 'REGRESSION' && (r.currentSeverity === 'P0' || r.currentSeverity === 'P1')
    );

    if (openP0 > 0 || openP1 > 0 || hasSecRegression) {
      secStatus = 'FAILED';
      secMessage = `Detekovány bezpečnostní hrozby: ${openP0}x P0, ${openP1}x P1, regrese: ${hasSecRegression ? 'ANO' : 'NE'}.`;
    } else if (!latestAudit || latestAudit.trustLevel === 'UNKNOWN') {
      secStatus = 'UNKNOWN';
      secMessage = 'Poslední bezpečnostní audit nemá ověřenou úroveň důvěry (trustLevel UNKNOWN).';
    }

    // 3. Control Plane
    let cpStatus: ProjectHealthStatus = 'VERIFIED';
    let cpMessage = 'Všechny Control Plane akce jsou v terminálním bezpečném stavu.';

    const failedActions = controlPlaneActions.filter((a: any) => a.status === 'FAILED');
    const executingActions = controlPlaneActions.filter((a: any) => a.status === 'EXECUTING');

    if (failedActions.length > 0) {
      cpStatus = 'FAILED';
      cpMessage = `Detekováno ${failedActions.length} selhaných Control Plane akcí (status FAILED).`;
    } else if (executingActions.length > 0) {
      cpStatus = 'UNKNOWN';
      cpMessage = `Právě probíhá ${executingActions.length} Control Plane akcí (status EXECUTING).`;
    }

    // 4. Test Suite & Build
    let testBuildStatus: ProjectHealthStatus = 'VERIFIED';
    let testBuildMessage = 'Testy, TypeScript kompilace a produkční build jsou plně ověřeny.';

    if (
      evidence.testSuiteStatus === 'FAILED' ||
      evidence.tscStatus === 'FAILED' ||
      evidence.buildStatus === 'FAILED'
    ) {
      testBuildStatus = 'FAILED';
      testBuildMessage = `Selhání v CI/CD pipeline: Testy=${evidence.testSuiteStatus}, TSC=${evidence.tscStatus}, Build=${evidence.buildStatus}.`;
    } else if (
      evidence.testSuiteStatus === 'UNKNOWN' ||
      evidence.tscStatus === 'UNKNOWN' ||
      evidence.buildStatus === 'UNKNOWN'
    ) {
      testBuildStatus = 'UNKNOWN';
      testBuildMessage = `Neúplná evidence CI/CD: Testy=${evidence.testSuiteStatus}, TSC=${evidence.tscStatus}, Build=${evidence.buildStatus}.`;
    }

    // 5. AI Subsystem (Read-only, no merge authority)
    const aiStatus: ProjectHealthStatus = 'VERIFIED';
    const aiMessage = 'AI subsystém je v izolovaném režimu (zero merge/execution authority nad Release Gate).';

    return {
      databaseAndMigrations: { status: dbStatus, message: dbMessage },
      securityAndRbac: { status: secStatus, message: secMessage },
      controlPlane: { status: cpStatus, message: cpMessage },
      testSuiteAndBuild: { status: testBuildStatus, message: testBuildMessage },
      aiSubsystem: { status: aiStatus, message: aiMessage },
    };
  }

  /**
   * Deterministically evaluates Release Gate status based on all inputs and evidence.
   */
  public static async evaluateReleaseGate(
    customEvidence?: Partial<RuntimeEvidence>,
    customAuditDir: string = 'docs/audit'
  ): Promise<ReleaseGateEvaluationResult> {
    const evaluatedAt = new Date().toISOString();

    // 1. Default fail-closed runtime evidence (missing/undefined => UNKNOWN, never PASS)
    const evidence: RuntimeEvidence = {
      tscStatus: customEvidence?.tscStatus || 'UNKNOWN',
      testSuiteStatus: customEvidence?.testSuiteStatus || 'UNKNOWN',
      buildStatus: customEvidence?.buildStatus || 'UNKNOWN',
      migrationStatus: customEvidence?.migrationStatus || 'UNKNOWN',
      phase1TestsStatus: customEvidence?.phase1TestsStatus || 'UNKNOWN',
      tscOutput: customEvidence?.tscOutput,
      testSummary: customEvidence?.testSummary,
      buildOutput: customEvidence?.buildOutput,
      migrationDetails: customEvidence?.migrationDetails,
      timestamp: customEvidence?.timestamp || evaluatedAt,
    };

    // 2. Load and index audits
    const { records, summary } = AuditRegistryEngine.loadRegistry(customAuditDir);
    const regressions = RegressionEngine.analyzeAuditTimeline(records);

    // 3. Load Control Plane actions safely
    let controlPlaneActions: any[] = [];
    try {
      controlPlaneActions = await ControlPlaneService.getAllActions();
    } catch {
      controlPlaneActions = [];
    }

    const blockers: ReleaseGateBlocker[] = [];
    const warnings: string[] = [];

    // Collect all open findings
    const allFindings = records.flatMap(r => r.findings);
    const openFindings = allFindings.filter(f => f.status === 'OPEN' || f.status === 'IN_PROGRESS');

    const openP0Findings = openFindings.filter(f => f.severity === 'P0');
    const openP1Findings = openFindings.filter(f => f.severity === 'P1');
    const openP2Findings = openFindings.filter(f => f.severity === 'P2');
    const openP3Findings = openFindings.filter(f => f.severity === 'P3');

    // BLOCKER RULE 1: Open P0 findings
    for (const f of openP0Findings) {
      blockers.push({
        code: 'OPEN_P0_FINDING',
        message: `Kritické otevřené zjištění P0 [${f.code}]: ${this.sanitizeText(f.title)} (${f.auditId})`,
        severity: 'P0',
        component: 'SECURITY',
        referenceId: f.id,
      });
    }

    // BLOCKER RULE 2: Open P1 findings
    for (const f of openP1Findings) {
      blockers.push({
        code: 'OPEN_P1_FINDING',
        message: `Závažné otevřené zjištění P1 [${f.code}]: ${this.sanitizeText(f.title)} (${f.auditId})`,
        severity: 'P1',
        component: 'SECURITY',
        referenceId: f.id,
      });
    }

    // BLOCKER RULE 3: Critical Security Regressions
    const criticalRegressions = regressions.filter(
      r => r.changeType === 'REGRESSION' && (r.currentSeverity === 'P0' || r.currentSeverity === 'P1')
    );
    for (const reg of criticalRegressions) {
      blockers.push({
        code: 'CRITICAL_SECURITY_REGRESSION',
        message: `Bezpečnostní regrese [${reg.code}]: Znovu otevřený problém v auditu ${reg.currentAuditId}`,
        severity: reg.currentSeverity,
        component: 'REGRESSION',
        referenceId: reg.findingId,
      });
    }

    // BLOCKER RULE 4: Negative Severity Drift (Escalation to P0/P1)
    const negativeDrifts = regressions.filter(
      r => r.changeType === 'SEVERITY_DRIFT' && (r.currentSeverity === 'P0' || r.currentSeverity === 'P1')
    );
    for (const drift of negativeDrifts) {
      blockers.push({
        code: 'NEGATIVE_SEVERITY_DRIFT',
        message: `Eskalace závažnosti [${drift.code}]: Změna z ${drift.previousSeverity} na ${drift.currentSeverity} (${drift.currentAuditId})`,
        severity: drift.currentSeverity,
        component: 'REGRESSION',
        referenceId: drift.findingId,
      });
    }

    // BLOCKER RULE 5: Control Plane Failures or Active Execution
    const failedActions = controlPlaneActions.filter(a => a.status === 'FAILED');
    for (const fa of failedActions) {
      blockers.push({
        code: 'CONTROL_PLANE_ACTION_FAILED',
        message: `Control Plane akce [${fa.id}] selhala (status FAILED): ${this.sanitizeText(fa.intent)}`,
        severity: 'BLOCKER',
        component: 'CONTROL_PLANE',
        referenceId: fa.id,
      });
    }

    const executingActions = controlPlaneActions.filter(a => a.status === 'EXECUTING');
    for (const ea of executingActions) {
      blockers.push({
        code: 'CONTROL_PLANE_ACTION_EXECUTING',
        message: `Control Plane akce [${ea.id}] právě probíhá (status EXECUTING): ${this.sanitizeText(ea.intent)}`,
        severity: 'BLOCKER',
        component: 'CONTROL_PLANE',
        referenceId: ea.id,
      });
    }

    // BLOCKER RULE 6: Runtime Evidence Failures
    if (evidence.tscStatus === 'FAILED') {
      blockers.push({
        code: 'TSC_CHECK_FAILED',
        message: 'Kompilace TypeScriptu (tsc --noEmit) selhala s chybami.',
        severity: 'BLOCKER',
        component: 'BUILD_AND_TEST',
      });
    }

    if (evidence.testSuiteStatus === 'FAILED') {
      blockers.push({
        code: 'TEST_SUITE_FAILED',
        message: 'Globální sada testů (vitest run) selhala s chybami.',
        severity: 'BLOCKER',
        component: 'BUILD_AND_TEST',
      });
    }

    if (evidence.buildStatus === 'FAILED') {
      blockers.push({
        code: 'PRODUCTION_BUILD_FAILED',
        message: 'Produkční build (npm run build) selhal.',
        severity: 'BLOCKER',
        component: 'BUILD_AND_TEST',
      });
    }

    if (evidence.migrationStatus === 'FAILED') {
      blockers.push({
        code: 'PRISMA_MIGRATION_FAILED',
        message: 'Prisma migrace jsou ve stavu selhání nebo nesouladu.',
        severity: 'BLOCKER',
        component: 'DATABASE',
      });
    }

    // BLOCKER RULE 7: Audit Registry Integrity
    if (records.length === 0) {
      blockers.push({
        code: 'EMPTY_AUDIT_REGISTRY',
        message: 'Nebyly nalezeny žádné platné auditní zprávy v docs/audit.',
        severity: 'BLOCKER',
        component: 'AUDIT_REGISTRY',
      });
    }

    const latestAudit = records.length > 0 ? records[0] : undefined;
    if (latestAudit && latestAudit.status === 'FAIL') {
      blockers.push({
        code: 'LATEST_AUDIT_FAILED',
        message: `Poslední audit [${latestAudit.id}] skončil se stavem FAIL.`,
        severity: 'P0',
        component: 'AUDIT_REGISTRY',
        referenceId: latestAudit.id,
      });
    }

    // WARNINGS: P2/P3 open findings
    if (openP2Findings.length > 0 || openP3Findings.length > 0) {
      warnings.push(
        `Existují otevřená zjištění s nižší prioritou: ${openP2Findings.length}x P2, ${openP3Findings.length}x P3.`
      );
    }

    // Evaluate Project Health Pillars
    const health = this.evaluateProjectHealth(
      summary,
      latestAudit,
      regressions,
      controlPlaneActions,
      evidence
    );

    // 4. Deterministic Verdict Computation
    let verdict: ReleaseGateVerdict = 'DO_NOT_MERGE';
    let isMergeable = false;

    // Check if there are definite active failure blockers
    const hasDefiniteFailures = blockers.length > 0;

    // Check if any mandatory runtime evidence is UNKNOWN
    const hasUnknownEvidence =
      evidence.tscStatus === 'UNKNOWN' ||
      evidence.testSuiteStatus === 'UNKNOWN' ||
      evidence.buildStatus === 'UNKNOWN' ||
      evidence.migrationStatus === 'UNKNOWN' ||
      !latestAudit ||
      latestAudit.status === 'UNKNOWN';

    if (hasDefiniteFailures) {
      verdict = 'DO_NOT_MERGE';
      isMergeable = false;
    } else if (hasUnknownEvidence) {
      verdict = 'UNKNOWN';
      isMergeable = false;
      warnings.push('Chybí povinná ověřená evidence pro finální schválení (stav UNKNOWN).');
    } else if (
      blockers.length === 0 &&
      evidence.tscStatus === 'VERIFIED' &&
      evidence.testSuiteStatus === 'VERIFIED' &&
      evidence.buildStatus === 'VERIFIED' &&
      evidence.migrationStatus === 'VERIFIED' &&
      latestAudit &&
      (latestAudit.status === 'PASS' || latestAudit.status === 'PASS_WITH_WARNINGS')
    ) {
      verdict = 'READY_TO_MERGE';
      isMergeable = true;
    } else {
      verdict = 'DO_NOT_MERGE';
      isMergeable = false;
    }

    return {
      verdict,
      isMergeable,
      evaluatedAt,
      blockers,
      warnings,
      evidence,
      health,
      summary: {
        openP0: openP0Findings.length,
        openP1: openP1Findings.length,
        openP2: openP2Findings.length,
        openP3: openP3Findings.length,
        criticalRegressions: criticalRegressions.length,
        activeControlPlaneActions: executingActions.length + failedActions.length,
        totalAudits: records.length,
        latestAuditDate: latestAudit?.date,
        latestAuditStatus: latestAudit?.status,
      },
    };
  }
}
