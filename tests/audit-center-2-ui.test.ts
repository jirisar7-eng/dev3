import { describe, it, expect } from 'vitest';
import { ProjectHealthCard } from '../src/components/admin/audit/ProjectHealthCard';
import { AuditFindingsList } from '../src/components/admin/audit/AuditFindingsList';
import { OrionAssistantPanel } from '../src/components/admin/audit/OrionAssistantPanel';
import { AuditDocumentsCatalog } from '../src/components/admin/audit/AuditDocumentsCatalog';
import { AuditCenter } from '../src/components/admin/AuditCenter';
import { ReleaseGateEvaluationResult } from '../src/services/audit/types';

describe('Audit Center 2.0 Admin UI Subcomponents Contract', () => {
  it('exports all 4 core subcomponents and master AuditCenter without errors', () => {
    expect(ProjectHealthCard).toBeDefined();
    expect(AuditFindingsList).toBeDefined();
    expect(OrionAssistantPanel).toBeDefined();
    expect(AuditDocumentsCatalog).toBeDefined();
    expect(AuditCenter).toBeDefined();
  });

  it('validates mock data contract against ReleaseGateEvaluationResult interface', () => {
    const mockReleaseGate: ReleaseGateEvaluationResult = {
      verdict: 'READY_TO_MERGE',
      isMergeable: true,
      evaluatedAt: new Date().toISOString(),
      blockers: [],
      warnings: [],
      evidence: {
        tscStatus: 'VERIFIED',
        testSuiteStatus: 'VERIFIED',
        buildStatus: 'VERIFIED',
        migrationStatus: 'VERIFIED',
      },
      health: {
        databaseAndMigrations: { status: 'VERIFIED', message: 'Prisma schema and tables in sync' },
        securityAndRbac: { status: 'VERIFIED', message: 'All endpoints enforce RBAC and fail-closed' },
        controlPlane: { status: 'VERIFIED', message: 'Audit registry and state machine active' },
        testSuiteAndBuild: { status: 'VERIFIED', message: 'All test suites passing cleanly' },
        aiSubsystem: { status: 'VERIFIED', message: 'Orion AI safety bridge active with read-only guards' },
      },
      summary: {
        openP0: 0,
        openP1: 0,
        openP2: 2,
        openP3: 1,
        criticalRegressions: 0,
        activeControlPlaneActions: 0,
        totalAudits: 5,
        latestAuditDate: '2026-08-29',
        latestAuditStatus: 'PASS',
      },
    };

    expect(mockReleaseGate.verdict).toBe('READY_TO_MERGE');
    expect(mockReleaseGate.health.databaseAndMigrations.status).toBe('VERIFIED');
    expect(mockReleaseGate.health.securityAndRbac.status).toBe('VERIFIED');
    expect(mockReleaseGate.health.controlPlane.status).toBe('VERIFIED');
    expect(mockReleaseGate.health.testSuiteAndBuild.status).toBe('VERIFIED');
    expect(mockReleaseGate.health.aiSubsystem.status).toBe('VERIFIED');
  });

  it('validates DO_NOT_MERGE contract when P0 blockers exist', () => {
    const blockedGate: ReleaseGateEvaluationResult = {
      verdict: 'DO_NOT_MERGE',
      isMergeable: false,
      evaluatedAt: new Date().toISOString(),
      blockers: [
        {
          code: 'P0-SEC-001',
          component: 'Security',
          message: 'Hardcoded secret detected',
          severity: 'P0',
        },
      ],
      warnings: ['Regressions found'],
      evidence: {
        tscStatus: 'VERIFIED',
        testSuiteStatus: 'FAILED',
        buildStatus: 'VERIFIED',
        migrationStatus: 'VERIFIED',
      },
      health: {
        databaseAndMigrations: { status: 'VERIFIED', message: 'OK' },
        securityAndRbac: { status: 'FAILED', message: 'P0 blocker present' },
        controlPlane: { status: 'VERIFIED', message: 'OK' },
        testSuiteAndBuild: { status: 'FAILED', message: 'Vitest failed' },
        aiSubsystem: { status: 'VERIFIED', message: 'OK' },
      },
      summary: {
        openP0: 1,
        openP1: 0,
        openP2: 0,
        openP3: 0,
        criticalRegressions: 1,
        activeControlPlaneActions: 1,
        totalAudits: 5,
      },
    };

    expect(blockedGate.verdict).toBe('DO_NOT_MERGE');
    expect(blockedGate.isMergeable).toBe(false);
    expect(blockedGate.blockers.length).toBe(1);
    expect(blockedGate.blockers[0].code).toBe('P0-SEC-001');
  });
});
