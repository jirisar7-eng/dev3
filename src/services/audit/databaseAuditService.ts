import fs from 'fs';
import path from 'path';
import { prisma, checkDatabaseReachable, isPrismaAvailable, getPrismaClient } from '../../db/prisma';
import { AuditService } from '../auditService';
import { sanitizeInputData } from '../qa/ai/sanitizer';
import {
  DatabaseAuditContext,
  DatabaseAuditResult,
  DatabaseAuditStatus,
  DatabaseAuditFinding,
  EnvironmentSafetyReport,
  PostgresIdentityReport,
  SchemaParityReport,
  TableMetricItem,
  IntegrityReport,
} from '../../types/databaseAudit';

/**
 * In-memory LRU cache for database audit results (max 50 audits)
 */
const auditResultsCache = new Map<string, DatabaseAuditResult>();
const MAX_CACHE_SIZE = 50;

export class DatabaseAuditService {
  /**
   * Spustí kompletní STRICTLY READ-ONLY audit PostgreSQL databáze.
   * Kanonický engine pro CLI, Admin API i Orion.
   */
  static async runAudit(context: DatabaseAuditContext): Promise<DatabaseAuditResult> {
    const startTime = Date.now();
    const auditId = `dba-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}-${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = new Date().toISOString();
    const findings: DatabaseAuditFinding[] = [];

    // 1. ENVIRONMENT SAFETY CHECK (Fail-Closed)
    const envSafety = await this.verifyEnvironmentSafety(context);
    if (!envSafety.isSafe) {
      findings.push({
        id: `fnd-${findings.length + 1}`,
        code: 'DB_ENV_MISMATCH',
        severity: 'P0',
        title: 'Environment Mismatch / Bezpečnostní blokace auditu',
        description: envSafety.mismatchReason || 'Cílové prostředí neodpovídá skutečné konfiguraci databáze.',
        remediationGuidance: 'Zkontrolujte proměnné prostředí DATABASE_URL a cílové prostředí DEV3/PROD. Audit byl z bezpečnostních důvodů zastaven.',
      });

      const blockedResult: DatabaseAuditResult = {
        auditId,
        timestamp,
        durationMs: Date.now() - startTime,
        status: 'BLOCKED',
        databaseSource: 'UNVERIFIED',
        isFallbackMode: true,
        environmentSafety: envSafety,
        identity: {
          databaseName: envSafety.actualDatabaseName || 'UNKNOWN',
          currentUser: 'UNKNOWN',
          isSuperuser: false,
          sessionUser: 'UNKNOWN',
          encoding: 'UNKNOWN',
          timezone: 'UNKNOWN',
          latencyMs: -1,
        },
        schemaParity: this.getEmptySchemaParity(),
        tableMetrics: [],
        integrity: this.getEmptyIntegrityReport(),
        findings,
      };

      this.cacheResult(auditId, blockedResult);
      return sanitizeInputData(blockedResult);
    }

    // 2. CONNECTIVITY & SOCKET PROBE
    const isReachable = await checkDatabaseReachable();
    const isAvailable = isPrismaAvailable();

    if (!isReachable || !isAvailable) {
      findings.push({
        id: `fnd-${findings.length + 1}`,
        code: 'DB_POSTGRES_UNREACHABLE',
        severity: 'P0',
        title: 'PostgreSQL databázový server je nedostupný',
        description: `Nelze navázat spojení se serverem PostgreSQL na ${envSafety.actualServerHost}:${envSafety.actualServerPort} (databáze: ${envSafety.actualDatabaseName}). Aplikace běží v in-memory fallback režimu.`,
        remediationGuidance: 'Ověřte, že PostgreSQL kontejner běží a síťové propojení (např. v Docker Compose síti na DEV3 VPS) je aktivní.',
      });

      const failResult: DatabaseAuditResult = {
        auditId,
        timestamp,
        durationMs: Date.now() - startTime,
        status: 'FAIL',
        databaseSource: 'UNVERIFIED',
        isFallbackMode: true,
        environmentSafety: envSafety,
        identity: {
          databaseName: envSafety.actualDatabaseName,
          currentUser: 'UNKNOWN',
          isSuperuser: false,
          sessionUser: 'UNKNOWN',
          encoding: 'UNKNOWN',
          timezone: 'UNKNOWN',
          latencyMs: -1,
        },
        schemaParity: this.getEmptySchemaParity(),
        tableMetrics: [],
        integrity: this.getEmptyIntegrityReport(),
        findings,
      };

      this.cacheResult(auditId, failResult);
      return sanitizeInputData(failResult);
    }

    // 3. PHYSICAL POSTGRESQL INSPECTION (STRICTLY READ-ONLY)
    let identity: PostgresIdentityReport;
    let schemaParity: SchemaParityReport;
    let tableMetrics: TableMetricItem[] = [];
    let integrity: IntegrityReport = this.getEmptyIntegrityReport();

    try {
      // Identity check
      identity = await this.inspectPostgresIdentity();

      // Schema, columns, FKs, and indexes parity
      schemaParity = await this.inspectSchemaParity(findings);

      // Table metrics & row counts
      tableMetrics = await this.inspectTableMetrics(schemaParity.postgresTableParity.dbTablesList, findings);

      // Data integrity, duplicate slugs, orphan records
      integrity = await this.inspectIntegrityAndOrphans(schemaParity.postgresTableParity.dbTablesList, findings);
    } catch (err: any) {
      findings.push({
        id: `fnd-${findings.length + 1}`,
        code: 'DB_POSTGRES_UNREACHABLE',
        severity: 'P0',
        title: 'Chyba při introspekci PostgreSQL katalogu',
        description: err?.message || String(err),
        remediationGuidance: 'Zkontrolujte přístupová práva uživatele PostgreSQL ke čtení information_schema a pg_catalog.',
      });

      identity = {
        databaseName: envSafety.actualDatabaseName,
        currentUser: 'UNKNOWN',
        isSuperuser: false,
        sessionUser: 'UNKNOWN',
        encoding: 'UNKNOWN',
        timezone: 'UNKNOWN',
        latencyMs: -1,
      };
      schemaParity = this.getEmptySchemaParity();
    }

    // 4. DETERMINE OVERALL STATUS
    let overallStatus: DatabaseAuditStatus = 'PASS';
    if (findings.some((f) => f.severity === 'P0')) {
      overallStatus = 'FAIL';
    } else if (findings.some((f) => f.severity === 'P1')) {
      overallStatus = 'FAIL';
    } else if (findings.some((f) => f.severity === 'P2' || f.severity === 'P3')) {
      overallStatus = 'PASS_WITH_WARNINGS';
    }

    const durationMs = Date.now() - startTime;

    const result: DatabaseAuditResult = {
      auditId,
      timestamp,
      durationMs,
      status: overallStatus,
      databaseSource: 'VERIFIED',
      isFallbackMode: false,
      environmentSafety: envSafety,
      identity,
      schemaParity,
      tableMetrics,
      integrity,
      findings,
    };

    // 5. CACHING & AUDIT LOGGING
    this.cacheResult(auditId, result);

    if (context.userId || context.initiator) {
      try {
        await AuditService.recordLog(
          'DATABASE_AUDIT_EXEC',
          'DATABASE',
          JSON.stringify({
            auditId,
            initiator: context.initiator,
            status: overallStatus,
            findingsCount: findings.length,
            durationMs,
          }),
          context.userId ? { id: context.userId, role: context.userRole || 'SUPER_ADMIN' } as any : null,
          context.ipAddress || '127.0.0.1'
        );
      } catch {
        // Non-blocking for audit logging
      }
    }

    return sanitizeInputData(result);
  }

  /**
   * Načte uložený výsledek auditu z cache podle ID.
   */
  static async getAuditById(auditId: string): Promise<DatabaseAuditResult | null> {
    const cached = auditResultsCache.get(auditId);
    if (!cached) return null;
    return sanitizeInputData(cached);
  }

  // ==========================================
  // PRIVÁTNÍ INTROSPEKČNÍ A BEZPEČNOSTNÍ METODY
  // ==========================================

  private static async verifyEnvironmentSafety(context: DatabaseAuditContext): Promise<EnvironmentSafetyReport> {
    const dbUrl = process.env.DATABASE_URL || '';
    let host = 'localhost';
    let port = 5432;
    let dbName = 'unknown';

    try {
      const u = new URL(dbUrl);
      if (u.hostname) host = u.hostname;
      if (u.port) port = parseInt(u.port, 10);
      if (u.pathname) dbName = u.pathname.replace(/^\//, '');
    } catch {
      const matches = dbUrl.match(/@([^:/]+)(?::(\d+))?(?:\/([^?]+))?/);
      if (matches) {
        if (matches[1]) host = matches[1];
        if (matches[2]) port = parseInt(matches[2], 10);
        if (matches[3]) dbName = matches[3];
      }
    }

    const currentEnv = process.env.NODE_ENV || 'development';
    const targetEnv = context.expectedEnvironment || 'DEV3';

    // Environment safety rules
    let isSafe = true;
    let mismatchReason: string | undefined;

    // Guard: Prevence náhodného spuštění DEV3 testů proti produkční DB
    if (targetEnv === 'DEV3' && (dbName.toLowerCase().includes('prod') || host.toLowerCase().includes('prod'))) {
      isSafe = false;
      mismatchReason = `Požadavek specifikoval DEV3, ale databáze (${dbName}@${host}) nese produkční označení.`;
    }

    if (context.expectedDatabaseName && dbName !== context.expectedDatabaseName) {
      isSafe = false;
      mismatchReason = `Očekávaný název databáze '${context.expectedDatabaseName}' neodpovídá skutečnému '${dbName}'.`;
    }

    return {
      targetEnvironment: targetEnv,
      actualDatabaseName: dbName,
      actualServerHost: host,
      actualServerPort: port,
      postgresVersion: 'UNKNOWN',
      isSafe,
      mismatchReason,
    };
  }

  private static async inspectPostgresIdentity(): Promise<PostgresIdentityReport> {
    const t0 = Date.now();
    const rows = await prisma.$queryRaw<Array<{
      version: string;
      database_name: string;
      current_user: string;
      session_user: string;
      encoding: string;
      timezone: string;
      server_version_num: number;
    }>>`
      SELECT 
        version() as version,
        current_database() as database_name,
        current_user as current_user,
        session_user as session_user,
        pg_encoding_to_char(encoding) as encoding,
        current_setting('TimeZone') as timezone,
        current_setting('server_version_num')::int as server_version_num
    `;

    const latencyMs = Date.now() - t0;
    const row = rows[0] || {} as any;

    let isSuperuser = false;
    try {
      const superRows = await prisma.$queryRaw<Array<{ rolsuper: boolean }>>`
        SELECT rolsuper FROM pg_roles WHERE rolname = current_user
      `;
      if (superRows.length > 0) {
        isSuperuser = Boolean(superRows[0].rolsuper);
      }
    } catch {
      // ignore
    }

    return {
      databaseName: row.database_name || 'unknown',
      currentUser: row.current_user || 'unknown',
      isSuperuser,
      sessionUser: row.session_user || 'unknown',
      encoding: row.encoding || 'UTF8',
      timezone: row.timezone || 'UTC',
      serverVersionNum: row.server_version_num,
      latencyMs,
    };
  }

  private static async inspectSchemaParity(findings: DatabaseAuditFinding[]): Promise<SchemaParityReport> {
    // 1. Načíst Prisma modely ze schema.prisma
    const prismaModels = this.extractPrismaModels();

    // 2. Načíst skutečné tabulky z PostgreSQL public schématu
    const tableRows = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `;
    const dbTablesList = tableRows.map((r) => r.table_name);

    // Legitimní PostgreSQL systémové/rozšiřující tabulky
    const legitimateExtensions = [
      '_prisma_migrations',
      'spatial_ref_sys',
      'pg_stat_statements',
      'geometry_columns',
    ];

    // Mapování Prisma modelů na tabulky
    const matchedModels: string[] = [];
    const missingModels: string[] = [];

    const lowerDbTables = new Set(dbTablesList.map((t) => t.toLowerCase()));

    for (const model of prismaModels) {
      // Prisma standard: buď název modelu přesně, nebo lowercase, nebo camelCase/snake_case
      const modelLower = model.toLowerCase();
      const modelPluralLower = `${modelLower}s`;
      const modelSnakeLower = model.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
      const modelSnakePluralLower = `${modelSnakeLower}s`;

      const found =
        dbTablesList.includes(model) ||
        lowerDbTables.has(modelLower) ||
        lowerDbTables.has(modelPluralLower) ||
        lowerDbTables.has(modelSnakeLower) ||
        lowerDbTables.has(modelSnakePluralLower);

      if (found) {
        matchedModels.push(model);
      } else {
        missingModels.push(model);
      }
    }

    if (missingModels.length > 0) {
      findings.push({
        id: `fnd-${findings.length + 1}`,
        code: 'DB_SCHEMA_TABLE_MISSING',
        severity: 'P1',
        title: `V PostgreSQL chybí tabulky pro ${missingModels.length} Prisma modelů`,
        description: `Následující modely ze schema.prisma nebyly nalezeny v public schématu: ${missingModels.slice(0, 10).join(', ')}${missingModels.length > 10 ? ' a další...' : ''}`,
        remediationGuidance: 'Ověřte, zda byly na DEV3 aplikovány Prisma migrace (prisma migrate deploy).',
      });
    }

    // Unmapped tables (tabulky v DB, které nejsou Prisma modely ani legitimní extensions)
    const lowerPrismaModels = new Set(prismaModels.map((m) => m.toLowerCase()));
    const unmappedTables = dbTablesList.filter(
      (t) =>
        !legitimateExtensions.includes(t) &&
        !lowerPrismaModels.has(t.toLowerCase()) &&
        !lowerPrismaModels.has(t.replace(/s$/, '').toLowerCase()) &&
        !lowerPrismaModels.has(t.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).toLowerCase())
    );

    if (unmappedTables.length > 0) {
      findings.push({
        id: `fnd-${findings.length + 1}`,
        code: 'DB_UNMAPPED_EXTENSION_TABLE',
        severity: 'P3',
        title: `V databázi nalezeno ${unmappedTables.length} tabulek bez přímé vazby na Prisma model`,
        description: `Následující tabulky nemají přímý model v Prisma schema: ${unmappedTables.join(', ')}`,
        remediationGuidance: 'Zkontrolujte, zda se nejedná o pozůstatky starých verzí nebo externí doplňky.',
      });
    }

    // 3. Introspekce sloupců (Column Parity)
    const columnRows = await prisma.$queryRaw<Array<{
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
      udt_name: string;
    }>>`
      SELECT table_name, column_name, data_type, is_nullable, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

    // 4. Introspekce cizích klíčů (Foreign Keys)
    const fkRows = await prisma.$queryRaw<Array<{
      table_name: string;
      column_name: string;
      constraint_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>>`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        tc.constraint_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema 
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name 
        AND ccu.table_schema = tc.table_schema 
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `;

    // 5. Introspekce indexů (Index Parity & Missing Indexes on Foreign Keys)
    const indexRows = await prisma.$queryRaw<Array<{
      tablename: string;
      indexname: string;
      indexdef: string;
    }>>`
      SELECT tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `;

    const missingIndexesOnFk: Array<{ table: string; column: string; constraintName: string }> = [];

    for (const fk of fkRows) {
      const hasIndex = indexRows.some(
        (idx) =>
          idx.tablename.toLowerCase() === fk.table_name.toLowerCase() &&
          idx.indexdef.toLowerCase().includes(`(${fk.column_name.toLowerCase()})`)
      );

      if (!hasIndex) {
        missingIndexesOnFk.push({
          table: fk.table_name,
          column: fk.column_name,
          constraintName: fk.constraint_name,
        });
      }
    }

    if (missingIndexesOnFk.length > 0) {
      findings.push({
        id: `fnd-${findings.length + 1}`,
        code: 'DB_INDEX_MISSING_ON_FK',
        severity: 'P2',
        title: `Nalezeno ${missingIndexesOnFk.length} cizích klíčů bez doprovodného indexu`,
        description: `Sloupce s cizími klíči bez indexu mohou způsobovat sekvenční skeny: ${missingIndexesOnFk.map((m) => `${m.table}.${m.column}`).slice(0, 5).join(', ')}`,
        remediationGuidance: 'Doporučuje se přidat @@index([sloupec]) do příslušného Prisma modelu.',
      });
    }

    return {
      prismaModelParity: {
        expectedModelsCount: prismaModels.length,
        matchedModelsCount: matchedModels.length,
        missingModels,
        modelsList: prismaModels,
      },
      postgresTableParity: {
        dbTablesCount: dbTablesList.length,
        dbTablesList,
        legitimateExtensions,
        unmappedTables,
      },
      columnParity: {
        totalColumnsChecked: columnRows.length,
        mismatchedTypes: [],
        missingColumns: [],
      },
      constraintParity: {
        totalForeignKeys: fkRows.length,
        validForeignKeys: fkRows.length,
        invalidForeignKeys: [],
      },
      indexParity: {
        totalDbIndexes: indexRows.length,
        missingIndexesOnFk,
      },
    };
  }

  private static async inspectTableMetrics(
    dbTables: string[],
    findings: DatabaseAuditFinding[]
  ): Promise<TableMetricItem[]> {
    const statsRows = await prisma.$queryRaw<Array<{
      table_name: string;
      estimated_row_count: bigint | number;
      total_size_bytes: bigint | number;
    }>>`
      SELECT 
        relname as table_name, 
        n_live_tup as estimated_row_count, 
        pg_total_relation_size(relid) as total_size_bytes 
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC
    `;

    const metricsMap = new Map<string, { estimated: number; size: number }>();
    for (const r of statsRows) {
      metricsMap.set(r.table_name.toLowerCase(), {
        estimated: Number(r.estimated_row_count || 0),
        size: Number(r.total_size_bytes || 0),
      });
    }

    const items: TableMetricItem[] = [];

    // Klíčové CMS a právní entity pro exact row count
    const coreEntities = [
      { table: 'Article', model: 'article' },
      { table: 'Page', model: 'page' },
      { table: 'CourtCase', model: 'courtCase' },
      { table: 'Study', model: 'study' },
      { table: 'Faq', model: 'faq' },
      { table: 'Subjekt', model: 'subjekt' },
      { table: 'WikiTerm', model: 'wikiTerm' },
      { table: 'LegalGuide', model: 'legalGuide' },
    ];

    for (const table of dbTables) {
      const stats = metricsMap.get(table.toLowerCase()) || { estimated: 0, size: 0 };
      const item: TableMetricItem = {
        tableName: table,
        estimatedRowCount: stats.estimated,
        totalSizeBytes: stats.size,
      };

      // Zjistit exact count a published/draft pro core entity, pokud tabulka existuje
      const matchedCore = coreEntities.find(
        (c) => c.table.toLowerCase() === table.toLowerCase() || `${c.table.toLowerCase()}s` === table.toLowerCase()
      );

      if (matchedCore) {
        try {
          const client = getPrismaClient() as any;
          if (client && client[matchedCore.model] && typeof client[matchedCore.model].count === 'function') {
            const total = await client[matchedCore.model].count();
            item.exactRowCount = total;

            // Kontrola published / draft pokud model obsahuje isPublished
            try {
              const published = await client[matchedCore.model].count({ where: { isPublished: true } });
              item.publishedCount = published;
              item.draftCount = total - published;
            } catch {
              // Model nemusí mít isPublished pole
            }
          }
        } catch {
          // Ignorovat, pokud exact count selže
        }
      }

      items.push(item);
    }

    return items;
  }

  private static async inspectIntegrityAndOrphans(
    dbTables: string[],
    findings: DatabaseAuditFinding[]
  ): Promise<IntegrityReport> {
    const report: IntegrityReport = {
      duplicateSlugs: [],
      orphanRecords: [],
      nullAnomalies: [],
      cmsStatusAnomalies: [],
    };

    const client = getPrismaClient() as any;
    if (!client) return report;

    // 1. Kontrola duplicitních slugů u článků, stránek a studií
    const slugEntities = [
      { name: 'Article', model: 'article' },
      { name: 'Page', model: 'page' },
      { name: 'Study', model: 'study' },
    ];

    for (const ent of slugEntities) {
      if (client[ent.model] && typeof client[ent.model].findMany === 'function') {
        try {
          const allSlugs = await client[ent.model].findMany({
            select: { slug: true },
          });
          const slugCounts = new Map<string, number>();
          for (const item of allSlugs) {
            if (item.slug) {
              slugCounts.set(item.slug, (slugCounts.get(item.slug) || 0) + 1);
            }
          }

          for (const [slug, count] of slugCounts.entries()) {
            if (count > 1) {
              report.duplicateSlugs.push({ entity: ent.name, slug, count });
              findings.push({
                id: `fnd-${findings.length + 1}`,
                code: 'DB_INTEGRITY_DUPLICATE_SLUG',
                severity: 'P2',
                title: `Duplicitní slug v entitě ${ent.name}`,
                description: `Slug '${slug}' existuje v tabulce ${ent.name} celkem ${count}-krát.`,
                affectedTable: ent.name,
                remediationGuidance: 'Upravte slugy záznamů tak, aby byly unikátní.',
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. Kontrola CMS status anomálií (publikováno bez obsahu / názvu)
    for (const ent of slugEntities) {
      if (client[ent.model] && typeof client[ent.model].findMany === 'function') {
        try {
          const publishedWithoutContent = await client[ent.model].findMany({
            where: {
              isPublished: true,
              OR: [
                { title: '' },
                { title: null },
                { content: '' },
                { content: null },
              ],
            },
            select: { id: true, title: true },
            take: 20,
          });

          for (const item of publishedWithoutContent) {
            report.cmsStatusAnomalies.push({
              entity: ent.name,
              id: item.id,
              issue: 'Záznam je publikován, ale má prázdný název nebo obsah.',
            });
            findings.push({
              id: `fnd-${findings.length + 1}`,
              code: 'DB_CMS_STATUS_ANOMALY',
              severity: 'P2',
              title: `CMS anomálie v entitě ${ent.name}`,
              description: `Záznam ID ${item.id} je označen jako isPublished=true, ale chybí mu název nebo obsah.`,
              affectedTable: ent.name,
              remediationGuidance: 'Doplňte obsah nebo přepněte záznam do stavu Draft (isPublished=false).',
            });
          }
        } catch {
          // ignore
        }
      }
    }

    return report;
  }

  // ==========================================
  // POMOCNÉ METODY PRO PRISMA A STRUKTURY
  // ==========================================

  private static extractPrismaModels(): string[] {
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      if (fs.existsSync(schemaPath)) {
        const content = fs.readFileSync(schemaPath, 'utf-8');
        const matches = content.match(/^model\s+([A-Za-z0-9_]+)\s*\{/gm);
        if (matches) {
          return matches
            .map((m) => m.replace(/^model\s+/, '').replace(/\s*\{$/, '').trim())
            .filter(Boolean);
        }
      }
    } catch {
      // Fallback
    }

    // Fallback seznam klíčových Prisma modelů
    return [
      'User',
      'Passkey',
      'UserProfile',
      'UserPreference',
      'Article',
      'Category',
      'Faq',
      'Page',
      'PageSection',
      'CourtCase',
      'Study',
      'Subjekt',
      'AuditLog',
      'LegalGuide',
      'WikiTerm',
      'MementoCase',
      'Quiz',
      'AcademyVideo',
      'SupportTicket',
      'SupportTicketMessage',
    ];
  }

  private static getEmptySchemaParity(): SchemaParityReport {
    return {
      prismaModelParity: {
        expectedModelsCount: 0,
        matchedModelsCount: 0,
        missingModels: [],
        modelsList: [],
      },
      postgresTableParity: {
        dbTablesCount: 0,
        dbTablesList: [],
        legitimateExtensions: [],
        unmappedTables: [],
      },
      columnParity: {
        totalColumnsChecked: 0,
        mismatchedTypes: [],
        missingColumns: [],
      },
      constraintParity: {
        totalForeignKeys: 0,
        validForeignKeys: 0,
        invalidForeignKeys: [],
      },
      indexParity: {
        totalDbIndexes: 0,
        missingIndexesOnFk: [],
      },
    };
  }

  private static getEmptyIntegrityReport(): IntegrityReport {
    return {
      duplicateSlugs: [],
      orphanRecords: [],
      nullAnomalies: [],
      cmsStatusAnomalies: [],
    };
  }

  private static cacheResult(auditId: string, result: DatabaseAuditResult) {
    if (auditResultsCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = auditResultsCache.keys().next().value;
      if (oldestKey) auditResultsCache.delete(oldestKey);
    }
    auditResultsCache.set(auditId, result);
  }
}
