import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditRegistryEngine } from '../src/services/audit/auditRegistryEngine';
import { FindingStatus, FindingSeverity } from '../src/services/audit/types';
import { setPrismaClientForTest, setPrismaDisabled, prisma } from '../src/db/prisma';
import crypto from 'crypto';

describe('Phase 5: AuditFinding Database Persistence & E2E Verification', () => {
  // In-memory mock store for Prisma AuditFinding & ControlPlaneAction
  let dbAuditFindings: Map<string, any> = new Map();
  let dbControlPlaneActions: Map<string, any> = new Map();

  const mockPrismaClient: any = {
    auditFinding: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) {
          return dbAuditFindings.get(where.id) || null;
        }
        if (where.auditFilename_code) {
          const key = `${where.auditFilename_code.auditFilename}::${where.auditFilename_code.code}`;
          for (const item of dbAuditFindings.values()) {
            if (item.auditFilename === where.auditFilename_code.auditFilename && item.code === where.auditFilename_code.code) {
              return item;
            }
          }
          return null;
        }
        return null;
      }),
      findMany: vi.fn(async ({ where, orderBy }: any) => {
        let results = Array.from(dbAuditFindings.values());
        if (where?.status) {
          results = results.filter(r => r.status === where.status);
        }
        if (where?.severity) {
          results = results.filter(r => r.severity === where.severity);
        }
        if (where?.code) {
          results = results.filter(r => r.code === where.code);
        }
        if (where?.auditFilename) {
          results = results.filter(r => r.auditFilename === where.auditFilename);
        }
        return results;
      }),
      create: vi.fn(async ({ data }: any) => {
        const id = data.id || crypto.randomUUID();
        const created = {
          ...data,
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbAuditFindings.set(id, created);
        return created;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        let target: any = null;
        if (where.id) {
          target = dbAuditFindings.get(where.id);
        } else if (where.auditFilename_code) {
          for (const item of dbAuditFindings.values()) {
            if (item.auditFilename === where.auditFilename_code.auditFilename && item.code === where.auditFilename_code.code) {
              target = item;
              break;
            }
          }
        }
        if (!target) {
          throw new Error('Record to update not found');
        }
        const updated = {
          ...target,
          ...data,
          updatedAt: new Date(),
        };
        dbAuditFindings.set(target.id, updated);
        return updated;
      }),
    },
    controlPlaneAction: {
      findUnique: vi.fn(async ({ where }: any) => {
        return dbControlPlaneActions.get(where.id) || null;
      }),
    },
  };

  beforeEach(() => {
    dbAuditFindings.clear();
    dbControlPlaneActions.clear();
    setPrismaClientForTest(mockPrismaClient);
  });

  // 1. Prisma schema & model mapping
  it('correctly maps AuditFinding fields and preserves types', async () => {
    const finding = await mockPrismaClient.auditFinding.create({
      data: {
        id: 'test-uuid-1',
        auditFilename: 'AUDIT_2026-08-29_TEST.md',
        code: 'SEC-AUTH-01',
        title: 'MFA Bypass Risk',
        description: 'Detail popisu chyby autentizace',
        severity: 'P0',
        status: 'OPEN',
        firstSeenAt: new Date('2026-08-29T10:00:00Z'),
        lastSeenAt: new Date('2026-08-29T10:00:00Z'),
        sourceSha: 'sha256-test-hash',
      },
    });

    expect(finding.id).toBe('test-uuid-1');
    expect(finding.code).toBe('SEC-AUTH-01');
    expect(finding.severity).toBe('P0');
    expect(finding.status).toBe('OPEN');
  });

  // 2. Idempotent synchronization from Git Markdown to PostgreSQL
  it('performs idempotent database sync without creating duplicates on repeated runs', async () => {
    const sync1 = await AuditRegistryEngine.syncToDatabase();
    expect(sync1.success).toBe(true);
    expect(sync1.createdCount).toBeGreaterThan(0);
    const initialDbCount = dbAuditFindings.size;

    // Run sync second time
    const sync2 = await AuditRegistryEngine.syncToDatabase();
    expect(sync2.success).toBe(true);
    expect(sync2.createdCount).toBe(0); // No new duplicates created
    expect(sync2.updatedCount).toBeGreaterThanOrEqual(initialDbCount);
    expect(dbAuditFindings.size).toBe(initialDbCount);
  });

  // 3. Status preservation during repeated sync
  it('preserves workflow status (IN_PROGRESS, FIXED, VERIFIED) during markdown re-sync', async () => {
    await AuditRegistryEngine.syncToDatabase();

    // Find first finding in DB
    const firstFinding = Array.from(dbAuditFindings.values())[0];
    expect(firstFinding).toBeDefined();

    // Mark as IN_PROGRESS in DB
    await AuditRegistryEngine.updateFindingStatus({
      auditFilename: firstFinding.auditFilename,
      code: firstFinding.code,
      status: 'IN_PROGRESS',
      actor: { id: 'admin-1', role: 'ADMIN' },
    });

    const updatedInDb = await mockPrismaClient.auditFinding.findUnique({
      where: { id: firstFinding.id },
    });
    expect(updatedInDb.status).toBe('IN_PROGRESS');

    // Run sync again - must preserve IN_PROGRESS
    await AuditRegistryEngine.syncToDatabase();

    const afterResync = await mockPrismaClient.auditFinding.findUnique({
      where: { id: firstFinding.id },
    });
    expect(afterResync.status).toBe('IN_PROGRESS');
  });

  // 4. Rule 12: VERIFIED status requires verification evidence
  it('strictly rejects transition to VERIFIED without verificationEvidence or testReference and verifiedBy', async () => {
    await mockPrismaClient.auditFinding.create({
      data: {
        id: 'finding-rule12',
        auditFilename: 'AUDIT_SECURITY.md',
        code: 'SEC-TEST-99',
        title: 'Test issue',
        description: 'Description',
        severity: 'P1',
        status: 'OPEN',
      },
    });

    // Attempt 1: Without evidence & verifier
    await expect(
      AuditRegistryEngine.updateFindingStatus({
        auditFilename: 'AUDIT_SECURITY.md',
        code: 'SEC-TEST-99',
        status: 'VERIFIED',
        actor: { id: 'admin-1', role: 'ADMIN' },
      })
    ).rejects.toThrow(/Verification Policy Violation/i);

    // Attempt 2: With verifier and testReference
    const result = await AuditRegistryEngine.updateFindingStatus({
      auditFilename: 'AUDIT_SECURITY.md',
      code: 'SEC-TEST-99',
      status: 'VERIFIED',
      actor: { id: 'admin-1', role: 'ADMIN' },
      verifiedBy: 'Senior QA Engineer',
      testReference: 'tests/auth-remediation-phase05b.test.ts',
      verificationEvidence: '34/34 tests passed cleanly in CI pipeline.',
    });

    expect(result.success).toBe(true);
    expect(result.finding?.status).toBe('VERIFIED');
    expect(result.finding?.verifiedBy).toBe('Senior QA Engineer');
    expect(result.finding?.testReference).toBe('tests/auth-remediation-phase05b.test.ts');
  });

  // 5. RBAC security enforcement
  it('rejects finding updates from unauthorized roles (USER, VOLUNTEER)', async () => {
    await expect(
      AuditRegistryEngine.updateFindingStatus({
        auditFilename: 'AUDIT_SECURITY.md',
        code: 'SEC-TEST-99',
        status: 'FIXED',
        actor: { id: 'user-1', role: 'USER' },
      })
    ).rejects.toThrow(/Unauthorized/i);

    await expect(
      AuditRegistryEngine.linkFindingToControlPlaneAction(
        'AUDIT_SECURITY.md',
        'SEC-TEST-99',
        'action-uuid-1',
        { id: 'vol-1', role: 'VOLUNTEER' }
      )
    ).rejects.toThrow(/Unauthorized/i);
  });

  // 6. Linking finding to ControlPlaneAction
  it('correctly links an AuditFinding to a ControlPlaneAction', async () => {
    dbControlPlaneActions.set('action-fix-123', {
      id: 'action-fix-123',
      intent: 'Remediate SEC-TEST-99',
      status: 'APPROVED',
    });

    await mockPrismaClient.auditFinding.create({
      data: {
        id: 'finding-link-1',
        auditFilename: 'AUDIT_SEC.md',
        code: 'SEC-TEST-99',
        title: 'Fix issue',
        description: 'Desc',
        severity: 'P1',
        status: 'OPEN',
      },
    });

    const linkResult = await AuditRegistryEngine.linkFindingToControlPlaneAction(
      'AUDIT_SEC.md',
      'SEC-TEST-99',
      'action-fix-123',
      { id: 'admin-1', role: 'SUPER_ADMIN' }
    );

    expect(linkResult.success).toBe(true);

    const updated = await mockPrismaClient.auditFinding.findUnique({
      where: { id: 'finding-link-1' },
    });
    expect(updated.actionId).toBe('action-fix-123');
    expect(updated.status).toBe('IN_PROGRESS');
  });

  // 7. Full E2E Lifecycle: Markdown -> Sync -> In-Progress -> Action Link -> Test Evidence -> Verified
  it('executes complete E2E finding lifecycle with full audit trail', async () => {
    // Step A & B: Ingest from markdown
    const sync = await AuditRegistryEngine.syncToDatabase();
    expect(sync.success).toBe(true);

    const finding = Array.from(dbAuditFindings.values())[0];
    expect(finding).toBeDefined();

    // Step C: Action created in Control Plane
    dbControlPlaneActions.set('cp-action-456', {
      id: 'cp-action-456',
      intent: `Fix ${finding.code}`,
      status: 'EXECUTING',
    });

    // Step D: Link to action
    await AuditRegistryEngine.linkFindingToControlPlaneAction(
      finding.auditFilename,
      finding.code,
      'cp-action-456',
      { id: 'admin-1', role: 'SUPER_ADMIN' }
    );

    // Step E: Verification test passes and evidence is recorded
    const verifiedResult = await AuditRegistryEngine.updateFindingStatus({
      auditFilename: finding.auditFilename,
      code: finding.code,
      status: 'VERIFIED',
      actor: { id: 'qa-admin', role: 'SUPER_ADMIN' },
      actionId: 'cp-action-456',
      fixCommitSha: '01589f2f0285473e061eed2ded516d18a829755e',
      prNumber: 42,
      testReference: 'tests/audit-center-2-ui.test.ts',
      verifiedBy: 'QA Auditor',
      verificationEvidence: 'Automated Vitest suite 44/44 PASS + E2E browser smoke test PASS.',
    });

    if (!verifiedResult.success) {
      console.error('STEP E FAILED WITH ERROR:', verifiedResult.error);
    }

    expect(verifiedResult.success).toBe(true);
    expect(verifiedResult.finding?.status).toBe('VERIFIED');
    expect(verifiedResult.finding?.fixCommitSha).toBe('01589f2f0285473e061eed2ded516d18a829755e');
    expect(verifiedResult.finding?.prNumber).toBe(42);

    // Step F: Query from DB with filter
    const verifiedFindings = await AuditRegistryEngine.getFindingsFromDatabase({
      status: 'VERIFIED',
    });
    expect(verifiedFindings.some(f => f.code === finding.code)).toBe(true);
  });

  // 8. Graceful fallback when database is disabled
  it('safely handles DB outage without crashing by falling back in-memory', async () => {
    setPrismaDisabled(true);

    const findings = await AuditRegistryEngine.getFindingsFromDatabase();
    expect(Array.isArray(findings)).toBe(true);
    expect(findings.length).toBeGreaterThan(0);

    const syncOutage = await AuditRegistryEngine.syncToDatabase();
    expect(syncOutage.success).toBe(true);
    expect(syncOutage.errors[0]).toContain('fallback');
  });
});
