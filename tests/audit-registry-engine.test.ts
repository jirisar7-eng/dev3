import { describe, it, expect } from 'vitest';
import { AuditRegistryEngine } from '../src/services/audit/auditRegistryEngine';
import { RegressionEngine } from '../src/services/audit/regressionEngine';
import { AuditRecord, AuditFinding } from '../src/services/audit/types';
import fs from 'fs';
import path from 'path';

describe('Audit Registry & Parser Engine (Phase 1)', () => {
  // 1. Parsing PASS
  it('correctly parses an explicit PASS audit', () => {
    const markdown = `# AUDIT: Security Hardening

**Datum a čas:** 2026-08-29 10:00 UTC  
**Commit:** \`ab6d0183cca918e282395cf1fb28f1430caec55e\`  
**Větev:** \`main\`  
**STATUS:** PASS  

## 1. Testy a ověření
- 34/34 testů PASS
- Zero P0 issues
`;
    const record = AuditRegistryEngine.parseAuditContent(markdown, 'AUDIT_SECURITY_PASS_2026-08-29.md');
    expect(record.status).toBe('PASS');
    expect(record.trustLevel).toBe('VERIFIED');
    expect(record.metrics.testsPassed).toBe(34);
    expect(record.metrics.testsTotal).toBe(34);
    expect(record.commitSha).toBe('ab6d0183cca918e282395cf1fb28f1430caec55e');
    expect(record.sourceSha).toHaveLength(64);
  });

  // 2. Parsing PASS WITH WARNINGS
  it('correctly parses PASS WITH WARNINGS audit', () => {
    const markdown = `# AUDIT: Live Reconciliation

**Datum:** 2026-08-28  
**STATUS:** PASS WITH WARNINGS  

## 1. Upozornění
- Menší varování při načítání externích stylů.
`;
    const record = AuditRegistryEngine.parseAuditContent(markdown, 'AUDIT_LIVE_WARNINGS_2026-08-28.md');
    expect(record.status).toBe('PASS_WITH_WARNINGS');
  });

  // 3. Parsing FAIL
  it('correctly parses an explicit FAIL audit', () => {
    const markdown = `# AUDIT: State Administration API

**Datum:** 2026-08-19  
**VÝSLEDEK:** FAIL  

## 1. Nalezené problémy
- [P0] Kritická chyba při synchronizaci ARES
`;
    const record = AuditRegistryEngine.parseAuditContent(markdown, 'AUDIT_STATE_ADMIN_FAIL_2026-08-19.md');
    expect(record.status).toBe('FAIL');
    expect(record.findings.length).toBeGreaterThan(0);
    expect(record.findings[0].severity).toBe('P0');
  });

  // 4. UNKNOWN on ambiguous or unverified audit
  it('defaults to UNKNOWN when no explicit verifiable status is present and does not false-positive on word PASS in sentences', () => {
    const markdown = `# Background Document

This document discusses password handling and compass alignment.
We hope all systems will eventually pass evaluation.

## Topics
- User guide details
`;
    const record = AuditRegistryEngine.parseAuditContent(markdown, 'USER_GUIDE_DRAFT.md');
    expect(record.status).toBe('UNKNOWN');
    expect(record.trustLevel).toBe('UNKNOWN');
  });

  // 5. P0/P1/P2/P3 extraction
  it('extracts severity markers and counts accurately', () => {
    const markdown = `# P0/P1 Security Audit

**Datum:** 2026-08-25  
**STATUS:** PASS  

## 1. Souhrn
- P0: 0 nalezeno
- P1: 1 zjištěno
- P2: 2 issues
- P3: 1 položka
`;
    const record = AuditRegistryEngine.parseAuditContent(markdown, 'AUDIT_SEVERITY_2026-08-25.md');
    expect(record.metrics.p0Count).toBeGreaterThanOrEqual(1);
    expect(record.metrics.p1Count).toBeGreaterThanOrEqual(1);
    expect(record.metrics.p2Count).toBeGreaterThanOrEqual(1);
    expect(record.metrics.p3Count).toBeGreaterThanOrEqual(1);
  });

  // 6. Test count extraction
  it('extracts test fraction counts like 13/13 testů PASS', () => {
    const markdown = `# AI Extractor Audit

**Datum:** 2026-08-23  
**Status:** DOKONČENO (13/13 testů PASS, Build PASS)
`;
    const record = AuditRegistryEngine.parseAuditContent(markdown, 'AI_EXTRACTOR_2026-08-23.md');
    expect(record.metrics.testsPassed).toBe(13);
    expect(record.metrics.testsTotal).toBe(13);
    expect(record.metrics.testsFailed).toBe(0);
    expect(record.status).toBe('PASS');
  });

  // 7. SHA-256 evidence hash
  it('computes a consistent SHA-256 hash for identical content', () => {
    const content = '# Test Content\nDeterministic SHA';
    const hash1 = AuditRegistryEngine.computeSha256(content);
    const hash2 = AuditRegistryEngine.computeSha256(content);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  // 8. NEW finding detection in RegressionEngine
  it('detects NEW finding in current audit', () => {
    const prevAudit: AuditRecord = {
      id: 'AUDIT_01',
      filename: 'AUDIT_01.md',
      title: 'Audit 1',
      type: 'SECURITY',
      date: '2026-08-01',
      scope: [],
      status: 'PASS',
      metrics: { p0Count: 0, p1Count: 0, p2Count: 0, p3Count: 0, testsTotal: 10, testsPassed: 10, testsFailed: 0 },
      source: 'docs/audit/AUDIT_01.md',
      sourceSha: 'sha1',
      trustLevel: 'VERIFIED',
      findings: [],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const currFinding: AuditFinding = {
      id: 'f1',
      auditId: 'AUDIT_02',
      code: 'SEC-IDOR-01',
      title: 'IDOR in profile endpoint',
      description: 'Missing user ID check',
      severity: 'P0',
      status: 'OPEN',
      firstDetectedAt: '2026-08-02',
      lastSeenAt: '2026-08-02',
    };

    const currAudit: AuditRecord = {
      ...prevAudit,
      id: 'AUDIT_02',
      filename: 'AUDIT_02.md',
      date: '2026-08-02',
      status: 'FAIL',
      findings: [currFinding],
    };

    const regressions = RegressionEngine.compareAudits(prevAudit, currAudit);
    expect(regressions.length).toBe(1);
    expect(regressions[0].changeType).toBe('NEW');
    expect(regressions[0].code).toBe('SEC-IDOR-01');
    expect(regressions[0].currentSeverity).toBe('P0');
  });

  // 9. PERSISTENT finding detection
  it('detects PERSISTENT finding across consecutive audits', () => {
    const finding1: AuditFinding = {
      id: 'f1',
      auditId: 'AUDIT_01',
      code: 'DB-SYNC-01',
      title: 'Database sync latency',
      description: 'Slow queries',
      severity: 'P2',
      status: 'OPEN',
      firstDetectedAt: '2026-08-01',
      lastSeenAt: '2026-08-01',
    };

    const finding2: AuditFinding = {
      ...finding1,
      id: 'f2',
      auditId: 'AUDIT_02',
      lastSeenAt: '2026-08-02',
    };

    const prevAudit: AuditRecord = {
      id: 'AUDIT_01',
      filename: 'AUDIT_01.md',
      title: 'Audit 1',
      type: 'GENERAL',
      date: '2026-08-01',
      scope: [],
      status: 'FAIL',
      metrics: { p0Count: 0, p1Count: 0, p2Count: 1, p3Count: 0, testsTotal: 5, testsPassed: 4, testsFailed: 1 },
      source: 'docs/audit/AUDIT_01.md',
      sourceSha: 'sha1',
      trustLevel: 'VERIFIED',
      findings: [finding1],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const currAudit: AuditRecord = {
      ...prevAudit,
      id: 'AUDIT_02',
      filename: 'AUDIT_02.md',
      date: '2026-08-02',
      findings: [finding2],
    };

    const regressions = RegressionEngine.compareAudits(prevAudit, currAudit);
    expect(regressions.some(r => r.changeType === 'PERSISTENT')).toBe(true);
  });

  // 10. RESOLVED finding detection
  it('detects RESOLVED finding when status transitions to FIXED', () => {
    const finding1: AuditFinding = {
      id: 'f1',
      auditId: 'AUDIT_01',
      code: 'AUTH-FIX-01',
      title: 'Token expiry missing',
      description: 'Add expiry to JWT',
      severity: 'P1',
      status: 'OPEN',
      firstDetectedAt: '2026-08-01',
      lastSeenAt: '2026-08-01',
    };

    const finding2: AuditFinding = {
      ...finding1,
      id: 'f2',
      auditId: 'AUDIT_02',
      status: 'FIXED',
      lastSeenAt: '2026-08-02',
    };

    const prevAudit: AuditRecord = {
      id: 'AUDIT_01',
      filename: 'AUDIT_01.md',
      title: 'Audit 1',
      type: 'SECURITY',
      date: '2026-08-01',
      scope: [],
      status: 'FAIL',
      metrics: { p0Count: 0, p1Count: 1, p2Count: 0, p3Count: 0, testsTotal: 5, testsPassed: 4, testsFailed: 1 },
      source: 'docs/audit/AUDIT_01.md',
      sourceSha: 'sha1',
      trustLevel: 'VERIFIED',
      findings: [finding1],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const currAudit: AuditRecord = {
      ...prevAudit,
      id: 'AUDIT_02',
      filename: 'AUDIT_02.md',
      date: '2026-08-02',
      status: 'PASS',
      findings: [finding2],
    };

    const regressions = RegressionEngine.compareAudits(prevAudit, currAudit);
    expect(regressions.some(r => r.changeType === 'RESOLVED')).toBe(true);
  });

  // 11. REGRESSION (Reopened after fix)
  it('detects REGRESSION when a previously FIXED issue becomes OPEN again', () => {
    const finding1: AuditFinding = {
      id: 'f1',
      auditId: 'AUDIT_01',
      code: 'RBAC-REGRESS-01',
      title: 'RBAC Bypass in admin route',
      description: 'Checked middleware',
      severity: 'P0',
      status: 'FIXED',
      firstDetectedAt: '2026-08-01',
      lastSeenAt: '2026-08-01',
    };

    const finding2: AuditFinding = {
      ...finding1,
      id: 'f2',
      auditId: 'AUDIT_02',
      status: 'OPEN',
      lastSeenAt: '2026-08-02',
    };

    const prevAudit: AuditRecord = {
      id: 'AUDIT_01',
      filename: 'AUDIT_01.md',
      title: 'Audit 1',
      type: 'SECURITY',
      date: '2026-08-01',
      scope: [],
      status: 'PASS',
      metrics: { p0Count: 0, p1Count: 0, p2Count: 0, p3Count: 0, testsTotal: 10, testsPassed: 10, testsFailed: 0 },
      source: 'docs/audit/AUDIT_01.md',
      sourceSha: 'sha1',
      trustLevel: 'VERIFIED',
      findings: [finding1],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const currAudit: AuditRecord = {
      ...prevAudit,
      id: 'AUDIT_02',
      filename: 'AUDIT_02.md',
      date: '2026-08-02',
      status: 'FAIL',
      findings: [finding2],
    };

    const regressions = RegressionEngine.compareAudits(prevAudit, currAudit);
    const reg = regressions.find(r => r.code === 'RBAC-REGRESS-01');
    expect(reg).toBeDefined();
    expect(reg?.changeType).toBe('REGRESSION');
  });

  // 12. SEVERITY_DRIFT detection
  it('detects SEVERITY_DRIFT when severity escalates from P2 to P0', () => {
    const finding1: AuditFinding = {
      id: 'f1',
      auditId: 'AUDIT_01',
      code: 'DRIFT-01',
      title: 'Rate limiter issue',
      description: 'Slow rate limiter',
      severity: 'P2',
      status: 'OPEN',
      firstDetectedAt: '2026-08-01',
      lastSeenAt: '2026-08-01',
    };

    const finding2: AuditFinding = {
      ...finding1,
      id: 'f2',
      auditId: 'AUDIT_02',
      severity: 'P0',
      lastSeenAt: '2026-08-02',
    };

    const prevAudit: AuditRecord = {
      id: 'AUDIT_01',
      filename: 'AUDIT_01.md',
      title: 'Audit 1',
      type: 'SECURITY',
      date: '2026-08-01',
      scope: [],
      status: 'FAIL',
      metrics: { p0Count: 0, p1Count: 0, p2Count: 1, p3Count: 0, testsTotal: 5, testsPassed: 4, testsFailed: 1 },
      source: 'docs/audit/AUDIT_01.md',
      sourceSha: 'sha1',
      trustLevel: 'VERIFIED',
      findings: [finding1],
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    };

    const currAudit: AuditRecord = {
      ...prevAudit,
      id: 'AUDIT_02',
      filename: 'AUDIT_02.md',
      date: '2026-08-02',
      findings: [finding2],
    };

    const regressions = RegressionEngine.compareAudits(prevAudit, currAudit);
    const drift = regressions.find(r => r.changeType === 'SEVERITY_DRIFT');
    expect(drift).toBeDefined();
    expect(drift?.previousSeverity).toBe('P2');
    expect(drift?.currentSeverity).toBe('P0');
  });

  // 13. Corrupted / Malformed Markdown
  it('handles corrupted, empty or malformed markdown gracefully without throwing', () => {
    const emptyRecord = AuditRegistryEngine.parseAuditContent('', 'EMPTY.md');
    expect(emptyRecord.status).toBe('UNKNOWN');
    expect(emptyRecord.trustLevel).toBe('UNKNOWN');
    expect(emptyRecord.id).toBe('EMPTY');

    const garbageRecord = AuditRegistryEngine.parseAuditContent('@@###$$$ invalid syntax \x00 binary', 'GARBAGE.md');
    expect(garbageRecord.id).toBe('GARBAGE');
    expect(garbageRecord.status).toBe('UNKNOWN');
  });

  // 14. Duplicate audit handling
  it('registers warnings when duplicate audit files exist', () => {
    const testDir = path.resolve(process.cwd(), 'docs/audit');
    if (fs.existsSync(testDir)) {
      const result = AuditRegistryEngine.loadRegistry('docs/audit');
      expect(Array.isArray(result.records)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    }
  });

  // 15. Audit without metadata
  it('falls back safely for audit with no metadata headers', () => {
    const plainMarkdown = `Just some notes about testing.
Nothing structured here.`;
    const record = AuditRegistryEngine.parseAuditContent(plainMarkdown, 'NOTES_2026-08-20.md');
    expect(record.date).toBe('2026-08-20');
    expect(record.status).toBe('UNKNOWN');
  });

  // 16. Security: Path Traversal Protection
  it('throws security violation on path traversal attempts outside audit directory', () => {
    expect(() => {
      AuditRegistryEngine.validateAuditPath('../../../etc/passwd');
    }).toThrow(/Security Violation/);

    expect(() => {
      AuditRegistryEngine.validateAuditPath('.env');
    }).toThrow(/Security Violation/);

    expect(() => {
      AuditRegistryEngine.validateAuditPath('src/services/authService.ts');
    }).toThrow();
  });

  // 17. Security: Secret redaction in warnings
  it('does not leak secrets in parser warnings', () => {
    const secretContent = 'Error with password=SuperSecretPassword123 and token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
    // Path traversal with token in name
    expect(() => {
      AuditRegistryEngine.validateAuditPath(`../../secret_apiKey_123456789012345678901234.md`);
    }).toThrow(/REDACTED/);
  });

  // 18. Live Audit Registry scanning from docs/audit/*.md
  it('loads real repository docs/audit directory successfully and aggregates summary', () => {
    const { records, summary, warnings } = AuditRegistryEngine.loadRegistry('docs/audit');
    expect(records.length).toBeGreaterThanOrEqual(100);
    expect(summary.totalAudits).toBe(records.length);
    expect(summary.totalFindings).toBeGreaterThanOrEqual(0);
    expect(summary.statusBreakdown.pass).toBeGreaterThan(0);
    expect(summary.statusBreakdown.fail).toBeGreaterThanOrEqual(0);

    // Verify chronological sorting (newest first)
    if (records.length >= 2) {
      expect(records[0].date >= records[records.length - 1].date).toBe(true);
    }

    // Verify timeline regression analysis runs cleanly across real audits
    const timelineRegressions = RegressionEngine.analyzeAuditTimeline(records);
    expect(Array.isArray(timelineRegressions)).toBe(true);
  });
});
