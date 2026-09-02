/**
 * Database Audit Types & Interfaces
 * Canonical definitions for database.audit engine (Phase 1)
 */

export type DatabaseAuditStatus = 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | 'BLOCKED';

export type AuditSeverity = 'P0' | 'P1' | 'P2' | 'P3';

export type DatabaseAuditSource = 'VERIFIED' | 'UNVERIFIED';

export type DatabaseAuditFindingCode =
  | 'DB_ENV_MISMATCH'
  | 'DB_POSTGRES_UNREACHABLE'
  | 'DB_SCHEMA_TABLE_MISSING'
  | 'DB_SCHEMA_COLUMN_MISMATCH'
  | 'DB_CONSTRAINT_FK_INVALID'
  | 'DB_INDEX_MISSING_ON_FK'
  | 'DB_INTEGRITY_ORPHAN_FOUND'
  | 'DB_INTEGRITY_DUPLICATE_SLUG'
  | 'DB_CMS_STATUS_ANOMALY'
  | 'DB_UNMAPPED_EXTENSION_TABLE'
  | 'DB_ROWCOUNT_DRIFT';

export interface DatabaseAuditContext {
  initiator: 'CLI' | 'ADMIN_API' | 'ORION';
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  expectedEnvironment?: 'DEV3' | 'PRODUCTION' | 'LOCAL';
  expectedDatabaseName?: string;
}

export interface DatabaseAuditFinding {
  id: string;
  code: DatabaseAuditFindingCode;
  severity: AuditSeverity;
  title: string;
  description: string;
  affectedTable?: string;
  remediationGuidance: string;
}

export interface EnvironmentSafetyReport {
  targetEnvironment: string;
  actualDatabaseName: string;
  actualServerHost: string;
  actualServerPort: number;
  postgresVersion: string;
  isSafe: boolean;
  mismatchReason?: string;
}

export interface PostgresIdentityReport {
  databaseName: string;
  currentUser: string;
  isSuperuser: boolean;
  sessionUser: string;
  encoding: string;
  timezone: string;
  serverVersionNum?: number;
  latencyMs: number;
}

export interface SchemaParityReport {
  prismaModelParity: {
    expectedModelsCount: number;
    matchedModelsCount: number;
    missingModels: string[];
    modelsList: string[];
  };
  postgresTableParity: {
    dbTablesCount: number;
    dbTablesList: string[];
    legitimateExtensions: string[];
    unmappedTables: string[];
  };
  columnParity: {
    totalColumnsChecked: number;
    mismatchedTypes: Array<{ table: string; column: string; prismaType: string; dbType: string }>;
    missingColumns: Array<{ table: string; column: string }>;
  };
  constraintParity: {
    totalForeignKeys: number;
    validForeignKeys: number;
    invalidForeignKeys: string[];
  };
  indexParity: {
    totalDbIndexes: number;
    missingIndexesOnFk: Array<{ table: string; column: string; constraintName: string }>;
  };
}

export interface TableMetricItem {
  tableName: string;
  estimatedRowCount: number;
  exactRowCount?: number;
  totalSizeBytes: number;
  publishedCount?: number;
  draftCount?: number;
}

export interface IntegrityReport {
  duplicateSlugs: Array<{ entity: string; slug: string; count: number }>;
  orphanRecords: Array<{ relation: string; parentId: string; count: number; description: string }>;
  nullAnomalies: Array<{ table: string; column: string; count: number }>;
  cmsStatusAnomalies: Array<{ entity: string; id: string; issue: string }>;
}

export interface DatabaseAuditResult {
  auditId: string;
  timestamp: string;
  durationMs: number;
  status: DatabaseAuditStatus;
  databaseSource: DatabaseAuditSource;
  isFallbackMode: boolean;
  environmentSafety: EnvironmentSafetyReport;
  identity: PostgresIdentityReport;
  schemaParity: SchemaParityReport;
  tableMetrics: TableMetricItem[];
  integrity: IntegrityReport;
  findings: DatabaseAuditFinding[];
}
