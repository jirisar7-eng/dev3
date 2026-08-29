import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ReleaseGateService } from '../src/services/audit/releaseGateService';
import { ControlPlaneService } from '../src/services/controlPlaneService';
import { RuntimeEvidence } from '../src/services/audit/types';

const TEST_AUDIT_DIR = path.join(process.cwd(), 'tmp_test_release_gate_audits');

describe('ReleaseGateService Deterministic Engine', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_AUDIT_DIR)) {
      fs.rmSync(TEST_AUDIT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_AUDIT_DIR, { recursive: true });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(TEST_AUDIT_DIR)) {
      fs.rmSync(TEST_AUDIT_DIR, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  const verifiedEvidence: RuntimeEvidence = {
    tscStatus: 'VERIFIED',
    testSuiteStatus: 'VERIFIED',
    buildStatus: 'VERIFIED',
    migrationStatus: 'VERIFIED',
    phase1TestsStatus: 'VERIFIED',
  };

  const createAuditFile = (filename: string, content: string) => {
    fs.writeFileSync(path.join(TEST_AUDIT_DIR, filename), content, 'utf-8');
  };

  it('1. P0 OPEN finding leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| SEC-01 | SQL Injection vulnerability | P0 | OPEN |\n`
    );

    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'OPEN_P0_FINDING')).toBe(true);
    expect(result.health.securityAndRbac.status).toBe('FAILED');
  });

  it('2. P1 OPEN finding leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| SEC-02 | Insecure direct object reference | P1 | OPEN |\n`
    );

    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'OPEN_P1_FINDING')).toBe(true);
    expect(result.health.securityAndRbac.status).toBe('FAILED');
  });

  it('3. P2/P3 OPEN + all verified evidence leads to READY_TO_MERGE with warnings', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| UI-01 | Minor layout shift | P3 | OPEN |\n| UX-02 | Missing aria label | P2 | OPEN |\n`
    );

    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('READY_TO_MERGE');
    expect(result.isMergeable).toBe(true);
    expect(result.blockers.length).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Existují otevřená zjištění s nižší prioritou');
  });

  it('4. Test suite FAIL leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Shrnutí\nVše v pořádku bez nálezů.`
    );

    const failingTestsEvidence: RuntimeEvidence = {
      ...verifiedEvidence,
      testSuiteStatus: 'FAILED',
      testSummary: 'vitest failed with 7 errors',
    };

    const result = await ReleaseGateService.evaluateReleaseGate(failingTestsEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'TEST_SUITE_FAILED')).toBe(true);
    expect(result.health.testSuiteAndBuild.status).toBe('FAILED');
  });

  it('5. TSC FAIL leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n`
    );

    const tscFailEvidence: RuntimeEvidence = {
      ...verifiedEvidence,
      tscStatus: 'FAILED',
    };

    const result = await ReleaseGateService.evaluateReleaseGate(tscFailEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'TSC_CHECK_FAILED')).toBe(true);
    expect(result.health.testSuiteAndBuild.status).toBe('FAILED');
  });

  it('6. Build FAIL leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n`
    );

    const buildFailEvidence: RuntimeEvidence = {
      ...verifiedEvidence,
      buildStatus: 'FAILED',
    };

    const result = await ReleaseGateService.evaluateReleaseGate(buildFailEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'PRODUCTION_BUILD_FAILED')).toBe(true);
    expect(result.health.testSuiteAndBuild.status).toBe('FAILED');
  });

  it('7. Migration UNKNOWN leads to UNKNOWN verdict (Fail-Closed)', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n`
    );

    const migrationUnknownEvidence: RuntimeEvidence = {
      ...verifiedEvidence,
      migrationStatus: 'UNKNOWN',
    };

    const result = await ReleaseGateService.evaluateReleaseGate(migrationUnknownEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('UNKNOWN');
    expect(result.isMergeable).toBe(false);
    expect(result.health.databaseAndMigrations.status).toBe('UNKNOWN');
  });

  it('8. ControlPlaneAction FAILED leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n`
    );

    vi.spyOn(ControlPlaneService, 'getAllActions').mockResolvedValue([
      {
        id: 'act-fail-1',
        actorId: 'admin-1',
        actorRole: 'ADMIN',
        request: 'deploy',
        intent: 'deploy to production',
        operationId: 'CUSTOM_OPERATION' as any,
        affectedResources: [],
        riskLevel: 'P0',
        approvalLevel: 'CRITICAL_MUTATION',
        currentState: null,
        proposedState: null,
        originalState: null,
        createdAt: new Date(),
        version: 1,
        status: 'FAILED',
        logs: [],
      },
    ]);

    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'CONTROL_PLANE_ACTION_FAILED')).toBe(true);
    expect(result.health.controlPlane.status).toBe('FAILED');
  });

  it('9. Security REGRESSION P0/P1 leads to DO_NOT_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-10_base.md',
      `# Audit Base\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| SEC-REG-1 | Broken Access Control | P1 | FIXED |\n`
    );

    createAuditFile(
      'AUDIT_2026-08-20_followup.md',
      `# Audit Followup\nStatus: PASS\n## Nálezy\n| Kód | Název | Závažnost | Stav |\n| SEC-REG-1 | Broken Access Control | P1 | OPEN |\n`
    );

    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'CRITICAL_SECURITY_REGRESSION')).toBe(true);
  });

  it('10. Missing evidence defaults to UNKNOWN (Fail-Closed, never PASS)', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n`
    );

    // Call without any runtime evidence
    const result = await ReleaseGateService.evaluateReleaseGate({}, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('UNKNOWN');
    expect(result.isMergeable).toBe(false);
    expect(result.evidence.tscStatus).toBe('UNKNOWN');
    expect(result.evidence.testSuiteStatus).toBe('UNKNOWN');
    expect(result.evidence.buildStatus).toBe('UNKNOWN');
    expect(result.evidence.migrationStatus).toBe('UNKNOWN');
  });

  it('11. Everything verified with clean audit leads to READY_TO_MERGE', async () => {
    createAuditFile(
      'AUDIT_2026-08-20_test.md',
      `# Audit\nStatus: PASS\n## Výsledek\n34/34 testů PASS\nVšechny kontroly v pořádku.`
    );

    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('READY_TO_MERGE');
    expect(result.isMergeable).toBe(true);
    expect(result.blockers.length).toBe(0);
    expect(result.health.securityAndRbac.status).toBe('VERIFIED');
    expect(result.health.databaseAndMigrations.status).toBe('VERIFIED');
    expect(result.health.testSuiteAndBuild.status).toBe('VERIFIED');
    expect(result.health.controlPlane.status).toBe('VERIFIED');
    expect(result.health.aiSubsystem.status).toBe('VERIFIED');
  });

  it('12. Empty audit registry leads to DO_NOT_MERGE with blocker', async () => {
    // Empty directory
    const result = await ReleaseGateService.evaluateReleaseGate(verifiedEvidence, TEST_AUDIT_DIR);

    expect(result.verdict).toBe('DO_NOT_MERGE');
    expect(result.isMergeable).toBe(false);
    expect(result.blockers.some(b => b.code === 'EMPTY_AUDIT_REGISTRY')).toBe(true);
  });
});
