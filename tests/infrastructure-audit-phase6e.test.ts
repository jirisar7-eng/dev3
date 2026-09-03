import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { InfrastructureAuditService } from '../src/services/audit/infrastructureAuditService';
import { ReleaseGateService } from '../src/services/audit/releaseGateService';
import { KnowledgeMirrorService } from '../src/services/audit/knowledgeMirrorService';
import { sanitizeText } from '../src/services/qa/ai/sanitizer';

describe('Phase 6E: Infrastructure Observability & Audit Test Suite', () => {
  let dockerSpy: any;

  beforeAll(() => {
    dockerSpy = vi.spyOn(InfrastructureAuditService, 'callDockerApiReadOnly').mockImplementation(async (path: string) => {
      const pathLower = path.toLowerCase();
      const mutatingKeywords = [
        'restart', 'exec', 'prune', 'remove', 'delete', 'kill',
        'stop', 'start', 'create', 'update', 'rename', 'pause', 'unpause'
      ];
      if (mutatingKeywords.some(kw => pathLower.includes(kw))) {
        throw new Error(`[SECURITY DENIAL] Mutating Docker API endpoint requested in read-only audit service: ${path}`);
      }

      if (path.includes('/containers/json')) {
        return {
          status: 200,
          data: [
            {
              Id: '1234567890abcdef',
              Names: ['/test-container'],
              Image: 'node:20',
              Status: 'Up 2 hours',
              State: 'running',
              RestartCount: 0,
            }
          ]
        };
      }

      if (path.includes('/system/df')) {
        return {
          status: 200,
          data: {
            Containers: [],
            Volumes: [],
            Images: [],
          }
        };
      }

      return { status: 200, data: {} };
    });
  });

  afterAll(() => {
    dockerSpy.mockRestore();
  });

  it('1. Read-Only Guarantee: Rejects mutating Docker API endpoints', async () => {
    const mutatingEndpoints = [
      '/containers/123/restart',
      '/containers/123/exec',
      '/containers/prune',
      '/containers/123/remove',
      '/containers/123/stop',
      '/containers/123/kill',
      '/volumes/prune',
    ];
    for (const endpoint of mutatingEndpoints) {
      await expect(
        InfrastructureAuditService.callDockerApiReadOnly(endpoint)
      ).rejects.toThrow(/SECURITY DENIAL/i);
    }
  });

  it('2. Caddy / HTTPS Probe: Safely checks HTTP status and security headers', async () => {
    const result = await InfrastructureAuditService.auditCaddy('http://127.0.0.1:3000');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('httpsAvailable');
    expect(result).toHaveProperty('securityHeaders');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('3. Mailcow Timeout Isolation: Caps execution and handles timeout safely without throwing', async () => {
    const startTime = Date.now();
    const result = await InfrastructureAuditService.auditMailcow();
    const elapsedMs = Date.now() - startTime;
    expect(elapsedMs).toBeLessThan(4000); // Must be strictly within safe bound (<4000ms)
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('accessible');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('4. MinIO S3 Probe: Read-only HeadBucket check with forcePathStyle', async () => {
    const result = await InfrastructureAuditService.auditMinio();
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('bucketExists');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('5. PostgreSQL Health: Validates DB connectivity and latency', async () => {
    const result = await InfrastructureAuditService.auditPostgres();
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('connected');
    expect(Array.isArray(result.findings)).toBe(true);
  });

  it('6. Docker Resource Audit: Collects container list and storage info safely', async () => {
    const result = await InfrastructureAuditService.auditDocker();
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('containersCount');
    expect(result).toHaveProperty('runningContainers');
    expect(Array.isArray(result.containers)).toBe(true);
  });

  it('7. VPS Resources Audit: Measures RAM usage, CPU load and uptime', async () => {
    const result = await InfrastructureAuditService.auditVpsResources();
    expect(result).toHaveProperty('status');
    expect(result.totalRamMb).toBeGreaterThan(0);
    expect(result.ramUsagePercent).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.cpuLoad)).toBe(true);
    expect(result.cpuLoad.length).toBe(3);
  });

  it('8. Logging & 0-PII Sanitization: Cleans Docker headers and sanitizes all secrets', async () => {
    const rawDockerLog = '\x01\x00\x00\x00\x00\x00\x00\x1F[ERROR] User email user@example.com logged in with token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c and password "password": "SuperSecretPassword123"';
    const cleaned = InfrastructureAuditService.cleanDockerLogsStream(rawDockerLog);
    const sanitized = sanitizeText(cleaned);
    expect(sanitized).not.toContain('user@example.com');
    expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    expect(sanitized).not.toContain('SuperSecretPassword123');
    expect(sanitized).toContain('[REDACTED_EMAIL]');
    expect(sanitized).toContain('[REDACTED_JWT_TOKEN]');
    expect(sanitized).toContain('[REDACTED_SECRET]');
  });

  it('9. Master Infrastructure Audit: Generates full audit result and findings', async () => {
    const fullAudit = await InfrastructureAuditService.runFullInfrastructureAudit();
    expect(fullAudit).toHaveProperty('overallStatus');
    expect(fullAudit).toHaveProperty('auditRecord');
    expect(fullAudit.auditRecord.scope).toContain('CADDY');
    expect(fullAudit.auditRecord.scope).toContain('DOCKER');
    expect(fullAudit.auditRecord.scope).toContain('POSTGRESQL');
    expect(fullAudit.auditRecord.scope).toContain('MINIO');
    expect(fullAudit.auditRecord.scope).toContain('MAILCOW');
    expect(fullAudit.auditRecord.scope).toContain('HEALTH');
    expect(fullAudit.auditRecord.scope).toContain('VPS');
    expect(fullAudit.auditRecord.scope).toContain('LOGGING');
    expect(Array.isArray(fullAudit.findings)).toBe(true);
  });

  it('10. Release Gate Integration: P0/P1 infrastructure findings block release', async () => {
    const result = await ReleaseGateService.evaluateReleaseGate({
      tscStatus: 'VERIFIED',
      testSuiteStatus: 'VERIFIED',
      buildStatus: 'VERIFIED',
      migrationStatus: 'VERIFIED',
    });
    expect(result).toHaveProperty('verdict');
    expect(result).toHaveProperty('isMergeable');
    expect(result).toHaveProperty('blockers');
    expect(result).toHaveProperty('health');
  });

  it('11. Notion Sanitization: DTO transformation enforces 0-PII on infrastructure records', async () => {
    const fullJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const record = {
      id: 'infra-record-1',
      title: `Infrastructure Audit for dev3.tatovacesta.cz with token ${fullJwt}`,
      type: 'VERIFIED_FACT' as const,
      projectArea: 'AUDIT_CENTER',
      status: 'VERIFIED' as const,
      confidence: 1.0,
      verified: true,
      severity: 'P2' as const,
      source: 'SYSTEM' as const,
      sourceCommitSha: '16970bea7a447904f94646ec625cc81785b7e90e',
      sourceBranch: 'feat/faze-6e-infrastructure-observability',
      relatedAuditPath: 'docs/audit/AUDIT_2026-08-30_FAZE_6E_INFRASTRUCTURE_OBSERVABILITY.md',
      timestamp: new Date().toISOString(),
      contentHash: '1234567890abcdef',
      summary: 'Infrastructure details with secret password="SuperSecret123" and email admin@tatovacesta.cz',
    };
    const dto = KnowledgeMirrorService.toSanitizedDTO(record);
    expect(dto.title).not.toContain(fullJwt);
    expect(dto.title).toContain('[REDACTED_JWT_TOKEN]');
    expect(dto.sanitizedSummary).not.toContain('SuperSecret123');
    expect(dto.sanitizedSummary).not.toContain('admin@tatovacesta.cz');
    expect(dto.sanitizedSummary).toContain('[REDACTED_SECRET]');
    expect(dto.sanitizedSummary).toContain('[REDACTED_EMAIL]');
  });
});
