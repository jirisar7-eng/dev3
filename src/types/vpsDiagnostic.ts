/**
 * Types and Interfaces for VPS Diagnostic Bridge -> Notion
 * Táta má právo / Synthesis Hub / DEV3
 * Strictly Read-Only, Zero-Trust, 0-PII Architecture
 */

export type VpsEnvironment = 'DEV3_VPS' | 'AI_STUDIO_SANDBOX' | 'LOCAL' | 'PRODUCTION';
export type VpsStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'UNKNOWN';

export interface VpsDiskInfo {
  filesystem?: string;
  total?: string;
  used?: string;
  available?: string;
  usagePercent?: string;
  mountedOn?: string;
  details: string;
}

export interface VpsHostTelemetry {
  hostname: string;
  platform: string;
  release: string;
  kernelVersion: string;
  arch: string;
  uptimeSeconds: number;
  uptimeFormatted: string;
  cpuLoad: number[];
  cpusCount: number;
  totalRamMb: number;
  freeRamMb: number;
  usedRamMb: number;
  ramUsagePercent: number;
  disk: VpsDiskInfo;
}

export interface VpsContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  restartCount: number;
}

export interface VpsDockerTelemetry {
  status: VpsStatus;
  socketAvailable: boolean;
  containersCount: number;
  runningContainers: number;
  containers: VpsContainerInfo[];
  details: string;
}

export interface VpsDatabaseTelemetry {
  status: VpsStatus;
  connected: boolean;
  latencyMs?: number;
  databaseName: string;
  currentUser: string;
  isFallbackMode: boolean;
  details: string;
}

export interface VpsPrismaMigrationItem {
  name: string;
  applied: boolean;
  appliedAt?: string;
}

export interface VpsPrismaMigrationsTelemetry {
  status: VpsStatus;
  localMigrationsCount: number;
  appliedMigrationsCount: number;
  pendingMigrationsCount: number;
  migrations: VpsPrismaMigrationItem[];
  details: string;
}

export interface VpsGitTelemetry {
  branch: string;
  commitSha: string;
  isClean: boolean;
  workingTreeSummary: string;
  remoteUrl: string;
  isGitAvailable: boolean;
}

export interface VpsWebAndServicesTelemetry {
  dev3HealthEndpoint: {
    status: 'PASS' | 'FAIL';
    ok: boolean;
    statusCode?: number;
    latencyMs?: number;
    details: string;
  };
  caddy: {
    status: VpsStatus;
    httpsAvailable: boolean;
    statusCode?: number;
    tlsValid: boolean;
    securityHeaders: Record<string, boolean>;
    details: string;
  };
  minio: {
    status: VpsStatus;
    accessible: boolean;
    bucketExists: boolean;
    details: string;
  };
  mailcow: {
    status: VpsStatus;
    accessible: boolean;
    details: string;
  };
}

export interface VpsLogsTelemetry {
  analyzedEntries: number;
  errorCount: number;
  warningCount: number;
  sampleErrors: string[];
  details: string;
}

export interface VpsDiagnosticFinding {
  id: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  domain: 'HOST' | 'DOCKER' | 'POSTGRES' | 'PRISMA' | 'GIT' | 'WEB' | 'LOGS' | 'SECURITY';
  title: string;
  description: string;
  remediation?: string;
}

export interface VpsSecurityAudit {
  unredactedTokensFound: boolean;
  scannedAt: string;
  passedFailClosed: boolean;
  sanitizationMethod: string;
  detectedSecretTypes?: string[];
}

export interface VpsDiagnosticReport {
  reportId: string;
  timestamp: string;
  localFormattedDate: string;
  environment: VpsEnvironment;
  overallStatus: VpsStatus;
  summaryHeadline: string;
  host: VpsHostTelemetry;
  docker: VpsDockerTelemetry;
  database: VpsDatabaseTelemetry;
  prismaMigrations: VpsPrismaMigrationsTelemetry;
  git: VpsGitTelemetry;
  webAndServices: VpsWebAndServicesTelemetry;
  logsAndErrors: VpsLogsTelemetry;
  findings: VpsDiagnosticFinding[];
  securityAudit: VpsSecurityAudit;
  contentHash: string;
}

export interface VpsNotionPushResult {
  success: boolean;
  status: 'NOTION_SAVED' | 'LOCAL_REPORT_ONLY_NOTION_UNCONFIGURED' | 'FAILED_BLOCKED' | 'ERROR';
  notionPageId?: string;
  notionUrl?: string;
  message: string;
  timestamp: string;
}
