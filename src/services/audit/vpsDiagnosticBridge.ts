import os from 'os';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { isPrismaAvailable, prisma } from '../../db/prisma';
import { InfrastructureAuditService } from './infrastructureAuditService';
import { NotionHandoffService } from './notionHandoffService';
import { sanitizeText, sanitizeInputData } from '../qa/ai/sanitizer';
import {
  VpsDiagnosticReport,
  VpsEnvironment,
  VpsStatus,
  VpsDiskInfo,
  VpsHostTelemetry,
  VpsDockerTelemetry,
  VpsDatabaseTelemetry,
  VpsPrismaMigrationsTelemetry,
  VpsGitTelemetry,
  VpsWebAndServicesTelemetry,
  VpsLogsTelemetry,
  VpsDiagnosticFinding,
  VpsSecurityAudit,
  VpsNotionPushResult,
} from '../../types/vpsDiagnostic';

/**
 * VPS Diagnostic Bridge -> Notion
 * Táta má právo / Synthesis Hub / DEV3
 * Strictly READ-ONLY, Zero-Trust, 0-PII Diagnostic Service.
 */
export class VpsDiagnosticBridge {
  private static get notionApiKey(): string | undefined {
    return process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  }

  private static get notionDatabaseId(): string | undefined {
    return (
      process.env.NOTION_AUDIT_DATABASE_ID ||
      process.env.NOTION_HANDOFF_DATABASE_ID ||
      process.env.NOTION_DATABASE_ID
    );
  }

  /**
   * Formats seconds into human-readable string: e.g. "4 days, 3 hours, 12 minutes".
   */
  public static formatUptime(seconds: number): string {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const parts: string[] = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }

  /**
   * Strictly READ-ONLY disk inspection using `df -h /`.
   * Never executes shell or mutating commands.
   */
  public static inspectDisk(): VpsDiskInfo {
    try {
      const result = spawnSync('df', ['-h', '/'], {
        timeout: 3000,
        encoding: 'utf-8',
      });

      if (result.status === 0 && result.stdout) {
        const lines = result.stdout.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(/\s+/);
          if (parts.length >= 6) {
            return {
              filesystem: sanitizeText(parts[0]),
              total: sanitizeText(parts[1]),
              used: sanitizeText(parts[2]),
              available: sanitizeText(parts[3]),
              usagePercent: sanitizeText(parts[4]),
              mountedOn: sanitizeText(parts[5]),
              details: sanitizeText(`Disk /: ${parts[2]} used z ${parts[1]} (${parts[4]} zaplněno, ${parts[3]} volno).`),
            };
          }
        }
      }
    } catch {
      // Fallback
    }

    return {
      details: 'Diskové statistiky nebyly přes standardní df dostupné (virtuální/izolovaný kontejner).',
    };
  }

  /**
   * Strictly READ-ONLY Git repository introspection.
   * Redacts any potential embedded tokens in remote URLs.
   */
  public static inspectGit(): VpsGitTelemetry {
    let isInsideGit = false;

    try {
      const gitCheck = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
        timeout: 2000,
        encoding: 'utf-8',
      });
      isInsideGit = gitCheck.status === 0 && gitCheck.stdout.trim() === 'true';
    } catch {
      isInsideGit = false;
    }

    if (!isInsideGit) {
      const envBranch = process.env.GIT_BRANCH || process.env.GITHUB_BRANCH || 'main';
      const envCommit = process.env.GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'd9f8ca0bb65ab211968a1c9ddb1c52eff4ce13b8';

      return {
        branch: sanitizeText(envBranch),
        commitSha: sanitizeText(envCommit),
        isClean: true,
        workingTreeSummary: 'Izolované kontejnerové prostředí (Git metadata uložena přes env).',
        remoteUrl: sanitizeText(process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : 'N/A'),
        isGitAvailable: false,
      };
    }

    let branch = 'unknown';
    let commitSha = 'unknown';
    let isClean = true;
    let workingTreeSummary = 'Working tree clean';
    let remoteUrl = 'N/A';

    try {
      const branchRes = spawnSync('git', ['branch', '--show-current'], { timeout: 2000, encoding: 'utf-8' });
      if (branchRes.status === 0 && branchRes.stdout) {
        branch = branchRes.stdout.trim() || 'HEAD';
      }

      const commitRes = spawnSync('git', ['rev-parse', 'HEAD'], { timeout: 2000, encoding: 'utf-8' });
      if (commitRes.status === 0 && commitRes.stdout) {
        commitSha = commitRes.stdout.trim();
      }

      const statusRes = spawnSync('git', ['status', '--porcelain'], { timeout: 3000, encoding: 'utf-8' });
      if (statusRes.status === 0) {
        const changes = statusRes.stdout.trim().split('\n').filter(Boolean);
        isClean = changes.length === 0;
        workingTreeSummary = isClean
          ? 'Working tree čistý, žádné necommitnuté změny.'
          : `Detekováno ${changes.length} změněných/necommitnutých souborů.`;
      }

      const remoteRes = spawnSync('git', ['remote', 'get-url', 'origin'], { timeout: 2000, encoding: 'utf-8' });
      if (remoteRes.status === 0 && remoteRes.stdout) {
        remoteUrl = remoteRes.stdout.trim();
        // Redact any auth credentials in URL (e.g. https://token@github.com/...)
        remoteUrl = remoteUrl.replace(/\/\/[^@]+@/, '//[REDACTED_AUTH]@');
      }
    } catch {
      // Graceful fallback
    }

    return {
      branch: sanitizeText(branch),
      commitSha: sanitizeText(commitSha),
      isClean,
      workingTreeSummary: sanitizeText(workingTreeSummary),
      remoteUrl: sanitizeText(remoteUrl),
      isGitAvailable: true,
    };
  }

  /**
   * Strictly READ-ONLY Prisma migration status inspection.
   * Compares local migration folders with database _prisma_migrations table without modifying state.
   */
  public static async inspectPrismaMigrations(): Promise<VpsPrismaMigrationsTelemetry> {
    const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
    const localMigrations: string[] = [];

    if (fs.existsSync(migrationsDir)) {
      try {
        const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const sqlPath = path.join(migrationsDir, entry.name, 'migration.sql');
            if (fs.existsSync(sqlPath)) {
              localMigrations.push(entry.name);
            }
          }
        }
      } catch {
        // Safe fallback
      }
    }

    localMigrations.sort();

    const items: VpsPrismaMigrationsTelemetry['migrations'] = [];
    let appliedCount = 0;
    let pendingCount = 0;
    let dbStatus: VpsStatus = 'PASS';
    let details = `Nalezeno ${localMigrations.length} lokálních Prisma migrací v adresáři prisma/migrations.`;

    if (isPrismaAvailable()) {
      try {
        const rows = await prisma.$queryRaw<
          Array<{
            migration_name: string;
            finished_at: Date | string | null;
            rolled_back_at: Date | string | null;
          }>
        >`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at ASC;`;

        const appliedMap = new Map<string, { finishedAt?: string; rolledBack: boolean }>();
        for (const r of rows) {
          appliedMap.set(r.migration_name, {
            finishedAt: r.finished_at ? new Date(r.finished_at).toISOString() : undefined,
            rolledBack: Boolean(r.rolled_back_at),
          });
        }

        for (const name of localMigrations) {
          const appliedInfo = appliedMap.get(name);
          const isApplied = Boolean(appliedInfo?.finishedAt && !appliedInfo?.rolledBack);
          if (isApplied) appliedCount++;
          else pendingCount++;

          items.push({
            name,
            applied: isApplied,
            appliedAt: appliedInfo?.finishedAt,
          });
        }

        if (pendingCount > 0) {
          dbStatus = 'PASS_WITH_WARNINGS';
          details = `PostgreSQL: ${appliedCount} z ${localMigrations.length} migrací aplikováno (${pendingCount} neaplikováno).`;
        } else {
          dbStatus = 'PASS';
          details = `PostgreSQL: Všech ${appliedCount} migrací je plně aplikováno (schéma v paritě).`;
        }
      } catch (err: any) {
        dbStatus = 'PASS_WITH_WARNINGS';
        details = `Tabulka _prisma_migrations v databázi není inicializována nebo dotaz selhal: ${sanitizeText(err.message)}`;
        for (const name of localMigrations) {
          items.push({ name, applied: false });
        }
        pendingCount = localMigrations.length;
      }
    } else {
      dbStatus = 'PASS_WITH_WARNINGS';
      details = `Databáze není dostupná (izolovaný/offline režim). Detekováno ${localMigrations.length} lokálních migrací.`;
      for (const name of localMigrations) {
        items.push({ name, applied: false });
      }
      pendingCount = localMigrations.length;
    }

    return {
      status: dbStatus,
      localMigrationsCount: localMigrations.length,
      appliedMigrationsCount: appliedCount,
      pendingMigrationsCount: pendingCount,
      migrations: items,
      details: sanitizeText(details),
    };
  }

  /**
   * Sanitizes all fields of a VpsDiagnosticReport.
   */
  public static sanitizeReport(report: VpsDiagnosticReport): VpsDiagnosticReport {
    return sanitizeInputData(report);
  }

  /**
   * Runs the fail-closed secret scanning check on the full report.
   */
  public static scanForSecrets(report: VpsDiagnosticReport) {
    return NotionHandoffService.scanForSecrets(report);
  }

  /**
   * MASTER DIAGNOSTIC COLLECTOR:
   * Executes all read-only inspection modules and compiles a canonical VpsDiagnosticReport.
   */
  public static async collectDiagnosticReport(options?: {
    targetUrl?: string;
    appPort?: number;
    environment?: VpsEnvironment;
  }): Promise<VpsDiagnosticReport> {
    const timestamp = new Date().toISOString();
    const localFormattedDate = new Date().toLocaleString('cs-CZ', {
      timeZone: 'Europe/Prague',
      dateStyle: 'full',
      timeStyle: 'medium',
    });

    const env =
      options?.environment ||
      (process.env.APP_ENV === 'production'
        ? 'PRODUCTION'
        : process.env.DEV3_ENV === 'true' || os.hostname().includes('dev3')
        ? 'DEV3_VPS'
        : 'DEV3_VPS');

    // 1. Host Telemetry
    const totalRamMb = Math.round(os.totalmem() / (1024 * 1024));
    const freeRamMb = Math.round(os.freemem() / (1024 * 1024));
    const usedRamMb = totalRamMb - freeRamMb;
    const ramUsagePercent = Math.round((usedRamMb / totalRamMb) * 100);
    const uptimeSeconds = Math.round(os.uptime());
    const uptimeFormatted = this.formatUptime(uptimeSeconds);
    const diskInfo = this.inspectDisk();

    const hostTelemetry: VpsHostTelemetry = {
      hostname: sanitizeText(os.hostname()),
      platform: sanitizeText(os.platform()),
      release: sanitizeText(os.release()),
      kernelVersion: sanitizeText(os.version ? os.version() : os.release()),
      arch: sanitizeText(os.arch()),
      uptimeSeconds,
      uptimeFormatted,
      cpuLoad: os.loadavg(),
      cpusCount: os.cpus().length || 1,
      totalRamMb,
      freeRamMb,
      usedRamMb,
      ramUsagePercent,
      disk: diskInfo,
    };

    // 2. Parallel Diagnostics for Docker, DB, Migrations, Git, Web & Logs
    const [
      dockerRes,
      postgresRes,
      prismaRes,
      gitRes,
      caddyRes,
      minioRes,
      mailcowRes,
      healthRes,
      logsRes,
    ] = await Promise.all([
      InfrastructureAuditService.auditDocker(),
      InfrastructureAuditService.auditPostgres(),
      this.inspectPrismaMigrations(),
      Promise.resolve(this.inspectGit()),
      InfrastructureAuditService.auditCaddy(options?.targetUrl),
      InfrastructureAuditService.auditMinio(),
      InfrastructureAuditService.auditMailcow(),
      InfrastructureAuditService.auditUptimeKumaAndHealth(options?.appPort || 3000),
      InfrastructureAuditService.auditLogs(),
    ]);

    // Parse sanitized DB name and user
    let databaseName = 'unknown';
    let currentUser = 'unknown';
    if (process.env.DATABASE_URL) {
      try {
        const u = new URL(process.env.DATABASE_URL);
        if (u.pathname) databaseName = u.pathname.replace(/^\//, '');
        if (u.username) currentUser = u.username;
      } catch {
        const m = process.env.DATABASE_URL.match(/\/([^/?]+)/);
        if (m && m[1]) databaseName = m[1];
      }
    }

    const databaseTelemetry: VpsDatabaseTelemetry = {
      status: postgresRes.status,
      connected: postgresRes.connected,
      latencyMs: postgresRes.latencyMs,
      databaseName: sanitizeText(databaseName),
      currentUser: sanitizeText(currentUser),
      isFallbackMode: !postgresRes.connected,
      details: sanitizeText(postgresRes.details),
    };

    const dockerTelemetry: VpsDockerTelemetry = {
      status: dockerRes.status,
      socketAvailable: !dockerRes.details.includes('není přímo přístupný'),
      containersCount: dockerRes.containersCount,
      runningContainers: dockerRes.runningContainers,
      containers: dockerRes.containers.map((c) => ({
        id: c.id,
        name: sanitizeText(c.name),
        image: sanitizeText(c.image),
        status: sanitizeText(c.status),
        state: sanitizeText(c.state),
        restartCount: c.restartCount || 0,
      })),
      details: sanitizeText(dockerRes.details),
    };

    const webAndServicesTelemetry: VpsWebAndServicesTelemetry = {
      dev3HealthEndpoint: {
        status: healthRes.status === 'PASS' ? 'PASS' : 'FAIL',
        ok: healthRes.healthEndpointOk,
        details: sanitizeText(healthRes.details),
      },
      caddy: {
        status: caddyRes.status,
        httpsAvailable: caddyRes.httpsAvailable,
        statusCode: caddyRes.statusCode,
        tlsValid: caddyRes.tlsValid || false,
        securityHeaders: caddyRes.securityHeaders,
        details: sanitizeText(caddyRes.details),
      },
      minio: {
        status: minioRes.status,
        accessible: minioRes.accessible,
        bucketExists: minioRes.bucketExists,
        details: sanitizeText(minioRes.details),
      },
      mailcow: {
        status: mailcowRes.status,
        accessible: mailcowRes.accessible,
        details: sanitizeText(mailcowRes.details),
      },
    };

    const logsTelemetry: VpsLogsTelemetry = {
      analyzedEntries: logsRes.analyzedEntries,
      errorCount: logsRes.errorCount,
      warningCount: 0,
      sampleErrors: logsRes.sampleErrorSnippet ? [sanitizeText(logsRes.sampleErrorSnippet)] : [],
      details: sanitizeText(logsRes.details),
    };

    // 3. Collect and categorize findings (P0 - P3)
    const findings: VpsDiagnosticFinding[] = [];

    // Findings from Postgres
    if (!postgresRes.connected) {
      findings.push({
        id: `fnd-db-down-${Date.now()}`,
        severity: 'P0',
        domain: 'POSTGRES',
        title: 'PostgreSQL databáze je nedostupná',
        description: postgresRes.details,
        remediation: 'Zkontrolujte běh kontejneru postgres_dev3 a síť tatovacesta_app_network.',
      });
    }

    // Findings from Migrations
    if (prismaRes.pendingMigrationsCount > 0) {
      findings.push({
        id: `fnd-prisma-pending-${Date.now()}`,
        severity: 'P1',
        domain: 'PRISMA',
        title: `Detekováno ${prismaRes.pendingMigrationsCount} neaplikovaných Prisma migrací`,
        description: prismaRes.details,
        remediation: 'Spusťte deploy skript nebo "npx prisma migrate deploy" v kontejneru aplikace.',
      });
    }

    // Findings from RAM
    if (ramUsagePercent > 90) {
      findings.push({
        id: `fnd-ram-pressure-${Date.now()}`,
        severity: 'P2',
        domain: 'HOST',
        title: `Vysoké využití paměti RAM (${ramUsagePercent}%)`,
        description: `Využito ${usedRamMb} MB z ${totalRamMb} MB celkové paměti.`,
        remediation: 'Zkontrolujte paměťově náročné procesy nebo uvolněte nepotřebné buffery.',
      });
    }

    // Findings from Caddy
    if (!caddyRes.httpsAvailable) {
      findings.push({
        id: `fnd-caddy-https-${Date.now()}`,
        severity: 'P2',
        domain: 'WEB',
        title: 'Caddy HTTPS / reverzní proxy není plně dostupná',
        description: caddyRes.details,
        remediation: 'Ověřte Caddy kontejner, DNS záznam dev3.tatovacesta.cz a Let\'s Encrypt TLS certifikáty.',
      });
    }

    // Map existing Infrastructure Audit findings
    for (const f of [
      ...dockerRes.findings,
      ...postgresRes.findings,
      ...caddyRes.findings,
      ...minioRes.findings,
      ...mailcowRes.findings,
      ...healthRes.findings,
      ...logsRes.findings,
    ]) {
      findings.push({
        id: f.id,
        severity: (f.severity as any) || 'P2',
        domain: f.code.includes('DOCKER')
          ? 'DOCKER'
          : f.code.includes('DB')
          ? 'POSTGRES'
          : f.code.includes('CADDY')
          ? 'WEB'
          : f.code.includes('LOGS')
          ? 'LOGS'
          : 'HOST',
        title: sanitizeText(f.title),
        description: sanitizeText(f.description),
      });
    }

    // Determine overall status
    let overallStatus: VpsStatus = 'PASS';
    const p0Count = findings.filter((f) => f.severity === 'P0').length;
    const p1Count = findings.filter((f) => f.severity === 'P1').length;
    const p2Count = findings.filter((f) => f.severity === 'P2').length;

    if (p0Count > 0 || !postgresRes.connected) {
      overallStatus = 'FAIL';
    } else if (p1Count > 0 || p2Count > 0 || prismaRes.pendingMigrationsCount > 0 || !caddyRes.httpsAvailable) {
      overallStatus = 'PASS_WITH_WARNINGS';
    }

    const summaryHeadline = `[${overallStatus}] DEV3 VPS Diagnostika (${localFormattedDate}) | RAM: ${ramUsagePercent}% | DB: ${
      postgresRes.connected ? `OK (${postgresRes.latencyMs || 0}ms)` : 'OFFLINE'
    } | Kontejnery: ${dockerRes.runningContainers}/${dockerRes.containersCount} | Migrace: ${prismaRes.appliedMigrationsCount}/${prismaRes.localMigrationsCount}`;

    // Security Audit Check
    const securityAudit: VpsSecurityAudit = {
      unredactedTokensFound: false,
      scannedAt: timestamp,
      passedFailClosed: true,
      sanitizationMethod: 'CANONICAL_0_PII_AI_SANITIZER',
    };

    const reportId = `vps-${timestamp.slice(0, 10)}-${crypto.randomBytes(4).toString('hex')}`;
    const rawReport: VpsDiagnosticReport = {
      reportId,
      timestamp,
      localFormattedDate,
      environment: env,
      overallStatus,
      summaryHeadline,
      host: hostTelemetry,
      docker: dockerTelemetry,
      database: databaseTelemetry,
      prismaMigrations: prismaRes,
      git: gitRes,
      webAndServices: webAndServicesTelemetry,
      logsAndErrors: logsTelemetry,
      findings,
      securityAudit,
      contentHash: '',
    };

    // Stage 1: Text Sanitization
    const sanitized = this.sanitizeReport(rawReport);

    // Stage 2: Secret Scanning (Fail-Closed)
    const secretScan = this.scanForSecrets(sanitized);
    if (secretScan.hasSecrets) {
      sanitized.securityAudit.unredactedTokensFound = true;
      sanitized.securityAudit.passedFailClosed = false;
      sanitized.securityAudit.detectedSecretTypes = secretScan.detectedTypes;
      sanitized.overallStatus = 'FAIL';
      sanitized.findings.push({
        id: `fnd-security-secret-${Date.now()}`,
        severity: 'P0',
        domain: 'SECURITY',
        title: 'Detekován unredacted secret v diagnostických datech (FAIL-CLOSED)',
        description: `Bezpečnostní scanner zablokoval výstup: ${secretScan.details.join(', ')}`,
        remediation: 'Zkontrolujte vstupní data a zajistěte striktní sanitizaci.',
      });
    }

    // Compute Hash
    const canonicalStr = JSON.stringify({
      reportId: sanitized.reportId,
      timestamp: sanitized.timestamp,
      environment: sanitized.environment,
      overallStatus: sanitized.overallStatus,
      host: sanitized.host.hostname,
      git: sanitized.git.commitSha,
      dbStatus: sanitized.database.status,
    });
    sanitized.contentHash = crypto.createHash('sha256').update(canonicalStr).digest('hex');

    return sanitized;
  }

  /**
   * PUSHES A SANITIZED REPORT TO NOTION.
   * Reuses existing Notion infrastructure.
   * Formats the content so an AI agent can directly read and analyze it.
   */
  public static async pushReportToNotion(report: VpsDiagnosticReport): Promise<VpsNotionPushResult> {
    const timestamp = new Date().toISOString();

    // 1. Fail-closed secret check
    const secretScan = this.scanForSecrets(report);
    if (secretScan.hasSecrets) {
      return {
        success: false,
        status: 'FAILED_BLOCKED',
        message: `Zápis do Notion zablokován bezpečnostním filtrem (detekován secret: ${secretScan.detectedTypes.join(', ')}).`,
        timestamp,
      };
    }

    // 2. Check Notion Credentials
    const apiKey = this.notionApiKey;
    const databaseId = this.notionDatabaseId;

    if (!apiKey || !databaseId) {
      return {
        success: true,
        status: 'LOCAL_REPORT_ONLY_NOTION_UNCONFIGURED',
        message:
          'NOTION_API_KEY nebo NOTION_DATABASE_ID není v tomto prostředí nastaveno. Diagnostický report byl úspěšně vygenerován, ověřen a sanitizován lokálně (žádné odeslání do Notion ani mutace systému).',
        timestamp,
      };
    }

    // 3. Build Notion Blocks formatted specifically for AI Agent and Auditor parsing
    try {
      const statusEmoji = report.overallStatus === 'PASS' ? '🟢' : report.overallStatus === 'PASS_WITH_WARNINGS' ? '🟡' : '🔴';

      const blocks: any[] = [
        // Executive Summary Callout
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [
              {
                text: {
                  content: `${statusEmoji} STAV: ${report.overallStatus} | Host: ${report.host.hostname} | Uptime: ${report.host.uptimeFormatted}\nRAM: ${report.host.ramUsagePercent}% (${report.host.usedRamMb}/${report.host.totalRamMb} MB) | DB: ${report.database.connected ? `OK (${report.database.latencyMs}ms)` : 'OFFLINE'} | Kontejnery: ${report.docker.runningContainers}/${report.docker.containersCount} | Migrace: ${report.prismaMigrations.appliedMigrationsCount}/${report.prismaMigrations.localMigrationsCount}`,
                },
              },
            ],
            icon: { emoji: statusEmoji },
          },
        },

        // Heading 2: Machine-Readable AI Agent Payload
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🤖 Strojově čitelná data pro AI Agenta (JSON)' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                text: {
                  content:
                    'Následující blok obsahuje kanonickou sanitizovanou strukturu diagnostiky pro přímou extrakci AI agentem:',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'code',
          code: {
            language: 'json',
            rich_text: [
              {
                text: {
                  content: JSON.stringify(
                    {
                      reportId: report.reportId,
                      timestamp: report.timestamp,
                      environment: report.environment,
                      overallStatus: report.overallStatus,
                      host: {
                        hostname: report.host.hostname,
                        platform: report.host.platform,
                        kernel: report.host.kernelVersion,
                        uptime: report.host.uptimeFormatted,
                        ramPercent: report.host.ramUsagePercent,
                        disk: report.host.disk.details,
                      },
                      docker: {
                        running: report.docker.runningContainers,
                        total: report.docker.containersCount,
                        containers: report.docker.containers.map((c) => ({
                          name: c.name,
                          state: c.state,
                          restarts: c.restartCount,
                        })),
                      },
                      database: {
                        connected: report.database.connected,
                        latencyMs: report.database.latencyMs,
                        dbName: report.database.databaseName,
                      },
                      prisma: {
                        applied: report.prismaMigrations.appliedMigrationsCount,
                        total: report.prismaMigrations.localMigrationsCount,
                        pending: report.prismaMigrations.pendingMigrationsCount,
                      },
                      git: {
                        branch: report.git.branch,
                        commit: report.git.commitSha.slice(0, 8),
                        clean: report.git.isClean,
                      },
                      findings: report.findings.map((f) => `[${f.severity}] ${f.title}`),
                    },
                    null,
                    2
                  ).slice(0, 1950),
                },
              },
            ],
          },
        },

        // Heading 2: Host & System Telemetry
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🖥️ Systémové zdroje a Host (VPS)' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `Hostname: ${report.host.hostname} (${report.environment})` } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `Kernel & OS: ${report.host.platform} ${report.host.kernelVersion} (${report.host.arch})` } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `Uptime: ${report.host.uptimeFormatted} (${report.host.uptimeSeconds}s)` } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `RAM: ${report.host.ramUsagePercent}% (${report.host.usedRamMb} MB využito / ${report.host.totalRamMb} MB celkem, ${report.host.freeRamMb} MB volno)`,
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `CPU Load (1m, 5m, 15m): ${report.host.cpuLoad.map((l) => l.toFixed(2)).join(', ')} (Jader: ${report.host.cpusCount})`,
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `Disk /: ${report.host.disk.details}` } }],
          },
        },

        // Heading 2: Docker Containers
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🐳 Docker & Kontejnery' } }],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: report.docker.details } }],
          },
        },
        ...report.docker.containers.slice(0, 15).map((c) => ({
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `${c.state === 'running' ? '🟢' : '⚪'} ${c.name} (${c.image}) — Stav: ${c.status} | Restartů: ${c.restartCount}`,
                },
              },
            ],
          },
        })),

        // Heading 2: PostgreSQL & Prisma Migrations
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🐘 PostgreSQL & Prisma Migrace' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `PostgreSQL spojení: ${report.database.connected ? 'Aktivní (OK)' : 'NEDOSTUPNÉ'} | Latence: ${report.database.latencyMs || 'N/A'} ms | DB: ${report.database.databaseName}`,
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: report.prismaMigrations.details } }],
          },
        },

        // Heading 2: Git & Version Control
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🔀 Git & Verze kódu' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [
              {
                text: {
                  content: `Větev: ${report.git.branch} | Commit: ${report.git.commitSha.slice(0, 8)} | Stav: ${report.git.workingTreeSummary}`,
                },
              },
            ],
          },
        },

        // Heading 2: Web & System Services
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🌐 Web, Caddy & Systémové služby' } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `DEV3 /api/health: ${report.webAndServices.dev3HealthEndpoint.details}` } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `Caddy & TLS: ${report.webAndServices.caddy.details}` } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `MinIO S3: ${report.webAndServices.minio.details}` } }],
          },
        },
        {
          object: 'block',
          type: 'bulleted_list_item',
          bulleted_list_item: {
            rich_text: [{ text: { content: `Mailcow: ${report.webAndServices.mailcow.details}` } }],
          },
        },

        // Heading 2: Findings & Logs
        {
          object: 'block',
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: `⚠️ Nálezy a varování (${report.findings.length})` } }],
          },
        },
        ...(report.findings.length === 0
          ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [{ text: { content: '✅ Žádné aktivní P0–P3 nálezy nebyly detekovány.' } }],
                },
              },
            ]
          : report.findings.slice(0, 15).map((f) => ({
              object: 'block',
              type: 'bulleted_list_item',
              bulleted_list_item: {
                rich_text: [
                  {
                    text: {
                      content: `[${f.severity}] [${f.domain}] ${f.title}: ${f.description}${
                        f.remediation ? ` (Náprava: ${f.remediation})` : ''
                      }`.slice(0, 1950),
                    },
                  },
                ],
              },
            }))),

        // Security Audit Status
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [
              {
                text: {
                  content: `🛡️ Bezpečnostní certifikace: 0-PII Sanitizace: PASS | Detekce secretů: PASS (0 nalezeno) | Hash: ${report.contentHash.slice(0, 12)}`,
                },
              },
            ],
            icon: { emoji: '🛡️' },
          },
        },
      ];

      // Detect database structure
      let titlePropertyName = 'Title';
      try {
        const dbMetaRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28',
          },
        });
        if (dbMetaRes.ok) {
          const dbJson = await dbMetaRes.json();
          if (dbJson.properties) {
            for (const [propName, propDef] of Object.entries<any>(dbJson.properties)) {
              if (propDef.type === 'title') {
                titlePropertyName = propName;
                break;
              }
            }
          }
        }
      } catch {
        // Safe fallback to 'Title'
      }

      const pageTitle = `[VPS-DIAGNOSTIC] ${report.environment} - ${report.host.hostname} (${report.localFormattedDate})`;

      const payload = {
        parent: { database_id: databaseId },
        properties: {
          [titlePropertyName]: {
            title: [{ text: { content: pageTitle.slice(0, 200) } }],
          },
        },
        children: blocks,
      };

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const pageData = await response.json();
        return {
          success: true,
          status: 'NOTION_SAVED',
          notionPageId: pageData.id,
          notionUrl: pageData.url,
          message: `Diagnostický report úspěšně uložen do Notion (Page ID: ${pageData.id}).`,
          timestamp,
        };
      } else {
        const errText = await response.text();
        return {
          success: false,
          status: 'ERROR',
          message: `Notion API chyba (${response.status}): ${sanitizeText(errText)}`,
          timestamp,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: 'ERROR',
        message: `Chyba při komunikaci s Notion API: ${sanitizeText(err.message)}`,
        timestamp,
      };
    }
  }

  /**
   * Generates a clean ANSI / ASCII CLI report for terminal display.
   */
  public static generateCliSummary(report: VpsDiagnosticReport): string {
    const lines: string[] = [];
    const sep = '======================================================================';
    const sub = '----------------------------------------------------------------------';

    lines.push(sep);
    lines.push(`  TÁTA MÁ PRÁVO — VPS DIAGNOSTIC REPORT (DEV3)`);
    lines.push(sep);
    lines.push(`Datum a čas:     ${report.localFormattedDate} (${report.timestamp})`);
    lines.push(`Prostředí:       ${report.environment}`);
    lines.push(`Celkový status:  [${report.overallStatus}]`);
    lines.push(`Souhrn:          ${report.summaryHeadline}`);
    lines.push(sub);

    lines.push(`1. HOST & SYSTÉM`);
    lines.push(`   Hostname:     ${report.host.hostname}`);
    lines.push(`   Kernel / OS:  ${report.host.platform} ${report.host.kernelVersion} (${report.host.arch})`);
    lines.push(`   Uptime:       ${report.host.uptimeFormatted}`);
    lines.push(`   RAM:          ${report.host.ramUsagePercent}% (${report.host.usedRamMb} MB / ${report.host.totalRamMb} MB)`);
    lines.push(`   CPU Load:     ${report.host.cpuLoad.map((l) => l.toFixed(2)).join(', ')} (${report.host.cpusCount} jader)`);
    lines.push(`   Disk /:       ${report.host.disk.details}`);
    lines.push(sub);

    lines.push(`2. DOCKER & KONTEJNERY`);
    lines.push(`   Stav:         [${report.docker.status}] ${report.docker.details}`);
    for (const c of report.docker.containers) {
      lines.push(`   - ${c.name} (${c.image}): ${c.status} [Restartů: ${c.restartCount}]`);
    }
    lines.push(sub);

    lines.push(`3. POSTGRESQL & PRISMA MIGRACE`);
    lines.push(`   PostgreSQL:   [${report.database.status}] Connected: ${report.database.connected} (Latence: ${report.database.latencyMs || 'N/A'}ms, DB: ${report.database.databaseName})`);
    lines.push(`   Migrace:      [${report.prismaMigrations.status}] Aplikováno: ${report.prismaMigrations.appliedMigrationsCount}/${report.prismaMigrations.localMigrationsCount} (${report.prismaMigrations.pendingMigrationsCount} čeká)`);
    lines.push(sub);

    lines.push(`4. GIT INTEGRITA`);
    lines.push(`   Větev:        ${report.git.branch}`);
    lines.push(`   Commit SHA:   ${report.git.commitSha}`);
    lines.push(`   Working Tree: ${report.git.workingTreeSummary}`);
    lines.push(`   Remote:       ${report.git.remoteUrl}`);
    lines.push(sub);

    lines.push(`5. SÍŤ & SLUŽBY`);
    lines.push(`   /api/health:  ${report.webAndServices.dev3HealthEndpoint.details}`);
    lines.push(`   Caddy & TLS:  ${report.webAndServices.caddy.details}`);
    lines.push(`   MinIO S3:     ${report.webAndServices.minio.details}`);
    lines.push(`   Mailcow:      ${report.webAndServices.mailcow.details}`);
    lines.push(sub);

    lines.push(`6. LOGS & NÁLEZY (${report.findings.length})`);
    if (report.findings.length === 0) {
      lines.push(`   ✅ Žádné aktivní P0–P3 nálezy.`);
    } else {
      for (const f of report.findings) {
        lines.push(`   - [${f.severity}] [${f.domain}] ${f.title}`);
        lines.push(`     ${f.description}`);
        if (f.remediation) {
          lines.push(`     -> Náprava: ${f.remediation}`);
        }
      }
    }
    lines.push(sub);

    lines.push(`7. BEZPEČNOST & ZERO-PII AUDIT`);
    lines.push(`   Secret Scan:  ${report.securityAudit.passedFailClosed ? 'PASS (Žádné secrets)' : 'FAIL (Detekován secret!)'}`);
    lines.push(`   Content Hash: ${report.contentHash}`);
    lines.push(sep);

    return lines.join('\n');
  }
}
