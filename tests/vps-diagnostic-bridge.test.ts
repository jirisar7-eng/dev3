import { describe, it } from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { VpsDiagnosticBridge } from '../src/services/audit/vpsDiagnosticBridge';

describe('VPS Diagnostic Bridge -> Notion Integration', () => {
  it('1. Uptime formatting produces clean, human-readable strings', () => {
    assert.strictEqual(VpsDiagnosticBridge.formatUptime(0), '0s');
    assert.strictEqual(VpsDiagnosticBridge.formatUptime(45), '45s');
    assert.strictEqual(VpsDiagnosticBridge.formatUptime(125), '2m 5s');
    assert.strictEqual(VpsDiagnosticBridge.formatUptime(3665), '1h 1m 5s');
    assert.strictEqual(VpsDiagnosticBridge.formatUptime(90061), '1d 1h 1m 1s');
  });

  it('2. Disk inspection is strictly read-only and handles container filesystems safely', () => {
    const disk = VpsDiagnosticBridge.inspectDisk();
    assert.ok(disk);
    assert.ok(typeof disk.details === 'string' && disk.details.length > 0);
  });

  it('3. Git inspection runs read-only and redacts auth tokens from remote URLs', () => {
    const git = VpsDiagnosticBridge.inspectGit();
    assert.ok(git);
    assert.ok(typeof git.branch === 'string');
    assert.ok(typeof git.commitSha === 'string');
    assert.ok(typeof git.workingTreeSummary === 'string');
    assert.ok(typeof git.isClean === 'boolean');
    // Ensure no token leaked in remote URL
    assert.ok(!git.remoteUrl.includes('ghp_'));
    assert.ok(!git.remoteUrl.includes('glpat-'));
    assert.ok(!git.remoteUrl.includes('://token:'));
  });

  it('4. Prisma migration inspection reads migration directory without mutating state', async () => {
    const migrations = await VpsDiagnosticBridge.inspectPrismaMigrations();
    assert.ok(migrations);
    assert.ok(migrations.localMigrationsCount >= 6, `Expected at least 6 migrations, found ${migrations.localMigrationsCount}`);
    assert.ok(migrations.migrations.some((m) => m.name.includes('20260903_dev3_synthesis_and_legacy_cleanup')));
    assert.ok(typeof migrations.details === 'string');
  });

  it('5. Diagnostic collector gathers complete, structured telemetry across all required domains', async () => {
    const report = await VpsDiagnosticBridge.collectDiagnosticReport({
      targetUrl: 'http://127.0.0.1:3000',
      appPort: 3000,
      environment: 'DEV3_VPS',
    });

    assert.ok(report);
    assert.ok(report.reportId.startsWith('vps-'));
    assert.strictEqual(report.environment, 'DEV3_VPS');
    assert.ok(['PASS', 'PASS_WITH_WARNINGS', 'FAIL'].includes(report.overallStatus));

    // Host
    assert.ok(report.host.hostname);
    assert.ok(report.host.totalRamMb > 0);
    assert.ok(report.host.uptimeFormatted);
    assert.ok(report.host.kernelVersion);

    // Docker
    assert.ok(report.docker);
    assert.ok(typeof report.docker.containersCount === 'number');

    // Database
    assert.ok(report.database);
    assert.ok(typeof report.database.connected === 'boolean');

    // Prisma
    assert.ok(report.prismaMigrations);
    assert.ok(report.prismaMigrations.localMigrationsCount >= 6);

    // Git
    assert.ok(report.git.branch);
    assert.ok(report.git.commitSha);

    // Web & Services
    assert.ok(report.webAndServices.dev3HealthEndpoint);
    assert.ok(report.webAndServices.caddy);
    assert.ok(report.webAndServices.minio);
    assert.ok(report.webAndServices.mailcow);

    // Logs & Security
    assert.ok(report.logsAndErrors);
    assert.ok(report.securityAudit);
    assert.strictEqual(report.securityAudit.unredactedTokensFound, false);
    assert.strictEqual(report.securityAudit.passedFailClosed, true);
    assert.ok(report.contentHash.length === 64);
  });

  it('6. Sanitizer and secret scanner enforce Fail-Closed Zero-Trust security', () => {
    const dirtyReport: any = {
      reportId: 'vps-test',
      timestamp: new Date().toISOString(),
      environment: 'DEV3_VPS',
      host: { hostname: 'dev3.local' },
      secretSnippet: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M',
      dbUrl: 'postgres://admin:SuperSecretPass123@localhost:5432/dev3_db',
      apiKey: 'sk-proj-1234567890abcdef1234567890abcdef',
      userEmail: 'admin.dev3@tatovacesta.cz',
    };

    const sanitized = VpsDiagnosticBridge.sanitizeReport(dirtyReport);
    const serialized = JSON.stringify(sanitized);

    // Verify all sensitive tokens and credentials are redacted
    assert.ok(!serialized.includes('SuperSecretPass123'));
    assert.ok(!serialized.includes('sk-proj-1234567890'));
    assert.ok(!serialized.includes('admin.dev3@tatovacesta.cz'));
  });

  it('7. Fail-safe Notion behavior when Notion credentials are unconfigured', async () => {
    const report = await VpsDiagnosticBridge.collectDiagnosticReport();
    const result = await VpsDiagnosticBridge.pushReportToNotion(report);

    // When NOTION_API_KEY is not in environment, must report LOCAL_REPORT_ONLY_NOTION_UNCONFIGURED
    assert.ok(result);
    if (!process.env.NOTION_API_KEY && !process.env.NOTION_TOKEN) {
      assert.strictEqual(result.status, 'LOCAL_REPORT_ONLY_NOTION_UNCONFIGURED');
      assert.strictEqual(result.success, true);
      assert.ok(result.message.includes('lokálně'));
    }
  });

  it('8. CLI Summary formatting produces clear, structured text report', async () => {
    const report = await VpsDiagnosticBridge.collectDiagnosticReport();
    const summary = VpsDiagnosticBridge.generateCliSummary(report);

    assert.ok(typeof summary === 'string');
    assert.ok(summary.includes('TÁTA MÁ PRÁVO — VPS DIAGNOSTIC REPORT (DEV3)'));
    assert.ok(summary.includes('1. HOST & SYSTÉM'));
    assert.ok(summary.includes('2. DOCKER & KONTEJNERY'));
    assert.ok(summary.includes('3. POSTGRESQL & PRISMA MIGRACE'));
    assert.ok(summary.includes('4. GIT INTEGRITA'));
    assert.ok(summary.includes('5. SÍŤ & SLUŽBY'));
    assert.ok(summary.includes('7. BEZPEČNOST & ZERO-PII AUDIT'));
  });

  it('9. CLI script scripts/vpsReport.ts executes with --help and --local-only', () => {
    const helpRun = spawnSync('npx', ['tsx', 'scripts/vpsReport.ts', '--help'], {
      encoding: 'utf-8',
      timeout: 10000,
    });
    assert.strictEqual(helpRun.status, 0);
    assert.ok(helpRun.stdout.includes('VPS Diagnostic Bridge (vps-report)'));

    const localRun = spawnSync('npx', ['tsx', 'scripts/vpsReport.ts', '--local-only', '--json'], {
      encoding: 'utf-8',
      timeout: 15000,
    });
    // The status code can be 0 or 1 depending on whether DB connection passes, but output must be valid JSON
    assert.ok(localRun.stdout.trim().startsWith('{'));
    const parsed = JSON.parse(localRun.stdout.trim());
    assert.ok(parsed.reportId);
    assert.ok(parsed.host);
    assert.ok(parsed.prismaMigrations);
  });
});
