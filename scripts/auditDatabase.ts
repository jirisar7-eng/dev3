import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { DatabaseAuditService } from '../src/services/audit/databaseAuditService';
import { DatabaseAuditContext, DatabaseAuditResult } from '../src/types/databaseAudit';

// Load environment configuration safely if .env exists
dotenv.config();

interface CliArgs {
  env: 'DEV3' | 'PRODUCTION' | 'LOCAL';
  json: boolean;
  outputPath?: string;
  expectedDbName?: string;
}

function parseArguments(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {
    env: 'DEV3',
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--env' && args[i + 1]) {
      const val = args[i + 1].toUpperCase();
      if (val === 'DEV3' || val === 'PRODUCTION' || val === 'LOCAL') {
        parsed.env = val as any;
      }
      i++;
    } else if (arg.startsWith('--env=')) {
      const val = arg.split('=')[1].toUpperCase();
      if (val === 'DEV3' || val === 'PRODUCTION' || val === 'LOCAL') {
        parsed.env = val as any;
      }
    } else if (arg === '--json') {
      parsed.json = true;
    } else if (arg === '--output' && args[i + 1]) {
      parsed.outputPath = args[i + 1];
      i++;
    } else if (arg.startsWith('--output=')) {
      parsed.outputPath = arg.split('=')[1];
    } else if (arg === '--db' && args[i + 1]) {
      parsed.expectedDbName = args[i + 1];
      i++;
    } else if (arg.startsWith('--db=')) {
      parsed.expectedDbName = arg.split('=')[1];
    }
  }

  return parsed;
}

function formatMarkdownReport(result: DatabaseAuditResult): string {
  const lines: string[] = [];

  lines.push('# POSTGRESQL DATABASE INTEGRITY & PARITY AUDIT REPORT');
  lines.push('');
  lines.push(`**Audit ID:** \`${result.auditId}\`  `);
  lines.push(`**Timestamp:** \`${result.timestamp}\`  `);
  lines.push(`**Target Environment:** \`${result.environmentSafety.targetEnvironment}\`  `);
  lines.push(`**Database Source:** \`${result.databaseSource}\`  `);
  lines.push(`**Overall Status:** \`${result.status}\`  `);
  lines.push(`**Duration:** ${result.durationMs} ms  `);
  lines.push(`**Fallback Mode:** \`${result.isFallbackMode}\`  `);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 1. Environment & Connectivity');
  lines.push('');
  lines.push(`- **Host / Port:** \`${result.environmentSafety.actualServerHost}:${result.environmentSafety.actualServerPort}\``);
  lines.push(`- **Database Name:** \`${result.environmentSafety.actualDatabaseName}\``);
  lines.push(`- **Current DB User:** \`${result.identity.currentUser}\` (Superuser: \`${result.identity.isSuperuser}\`)`);
  lines.push(`- **PostgreSQL Version:** ${result.environmentSafety.postgresVersion || result.identity.encoding}`);
  lines.push(`- **Latency:** ${result.identity.latencyMs >= 0 ? `${result.identity.latencyMs} ms` : 'N/A'}`);
  lines.push(`- **Environment Safety Verified:** \`${result.environmentSafety.isSafe}\``);
  if (result.environmentSafety.mismatchReason) {
    lines.push(`- **Mismatch / Warning:** ${result.environmentSafety.mismatchReason}`);
  }
  lines.push('');
  lines.push('## 2. Schema, Parity & Constraints');
  lines.push('');
  lines.push(`- **Prisma Models Expected:** ${result.schemaParity.prismaModelParity.expectedModelsCount}`);
  lines.push(`- **Prisma Models Matched in DB:** ${result.schemaParity.prismaModelParity.matchedModelsCount}`);
  lines.push(`- **PostgreSQL Base Tables Found:** ${result.schemaParity.postgresTableParity.dbTablesCount}`);
  lines.push(`- **Foreign Keys Total:** ${result.schemaParity.constraintParity.totalForeignKeys}`);
  lines.push(`- **DB Indexes Total:** ${result.schemaParity.indexParity.totalDbIndexes}`);
  lines.push(`- **Foreign Keys Missing Index:** ${result.schemaParity.indexParity.missingIndexesOnFk.length}`);
  lines.push('');
  if (result.schemaParity.prismaModelParity.missingModels.length > 0) {
    lines.push(`> ⚠️ **Missing Tables for Prisma Models:** ${result.schemaParity.prismaModelParity.missingModels.join(', ')}`);
    lines.push('');
  }

  lines.push('## 3. Table Metrics & Content Counts');
  lines.push('');
  if (result.tableMetrics.length === 0) {
    lines.push('_Žádné tabulkové metriky (databáze nedostupná nebo prázdná)._');
  } else {
    lines.push('| Table Name | Est. Rows | Exact Rows | Published | Draft | Size |');
    lines.push('| :--- | :--- | :--- | :--- | :--- | :--- |');
    for (const m of result.tableMetrics.slice(0, 30)) {
      const exact = m.exactRowCount !== undefined ? m.exactRowCount.toString() : '-';
      const pub = m.publishedCount !== undefined ? m.publishedCount.toString() : '-';
      const dft = m.draftCount !== undefined ? m.draftCount.toString() : '-';
      const sizeKb = (m.totalSizeBytes / 1024).toFixed(1);
      lines.push(`| \`${m.tableName}\` | ${m.estimatedRowCount} | ${exact} | ${pub} | ${dft} | ${sizeKb} KB |`);
    }
  }
  lines.push('');

  lines.push('## 4. Integrity & Orphan Checks');
  lines.push('');
  lines.push(`- **Duplicate Slugs:** ${result.integrity.duplicateSlugs.length}`);
  lines.push(`- **Orphan Records:** ${result.integrity.orphanRecords.length}`);
  lines.push(`- **CMS Status Anomalies:** ${result.integrity.cmsStatusAnomalies.length}`);
  lines.push('');

  lines.push('## 5. Findings & Remediation (P0–P3)');
  lines.push('');
  if (result.findings.length === 0) {
    lines.push('✅ **Nebyly nalezeny žádné vady integrity ani bezpečnostní neshody.**');
  } else {
    for (const f of result.findings) {
      lines.push(`### [${f.severity}] ${f.title} (\`${f.code}\`)`);
      lines.push(`- **Popis:** ${f.description}`);
      if (f.affectedTable) {
        lines.push(`- **Dotčená tabulka:** \`${f.affectedTable}\``);
      }
      lines.push(`- **Doporučená náprava:** ${f.remediationGuidance}`);
      lines.push('');
    }
  }
  lines.push('');
  lines.push('---');
  lines.push(`*Generated strictly via canonical DatabaseAuditService on ${new Date().toISOString()}*`);

  return lines.join('\n');
}

async function main() {
  const cliArgs = parseArguments();

  const context: DatabaseAuditContext = {
    initiator: 'CLI',
    expectedEnvironment: cliArgs.env,
    expectedDatabaseName: cliArgs.expectedDbName,
  };

  // Run audit through canonical DatabaseAuditService
  const result = await DatabaseAuditService.runAudit(context);

  // Write file output if requested
  if (cliArgs.outputPath) {
    const resolvedPath = path.isAbsolute(cliArgs.outputPath)
      ? cliArgs.outputPath
      : path.join(process.cwd(), cliArgs.outputPath);

    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (resolvedPath.endsWith('.json')) {
      fs.writeFileSync(resolvedPath, JSON.stringify(result, null, 2), 'utf-8');
    } else {
      const mdContent = formatMarkdownReport(result);
      fs.writeFileSync(resolvedPath, mdContent, 'utf-8');
    }
  }

  // Handle stdout format
  if (cliArgs.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('===============================================================');
    console.log('🔍 POSTGRESQL CANONICAL DATABASE AUDIT RUNNER (CLI)');
    console.log('===============================================================\n');

    console.log(`AUDIT ID:          ${result.auditId}`);
    console.log(`TIMESTAMP:         ${result.timestamp}`);
    console.log(`TARGET ENV:        ${result.environmentSafety.targetEnvironment}`);
    console.log(`DATABASE SOURCE:   ${result.databaseSource}`);
    console.log(`FALLBACK MODE:     ${result.isFallbackMode ? 'YES (in-memory dbStore)' : 'NO (connected to physical PostgreSQL)'}`);
    console.log(`STATUS:            ${result.status}`);
    console.log(`DURATION:          ${result.durationMs} ms\n`);

    console.log('--- CONNECTIVITY & IDENTITY ---');
    console.log(`Host:              ${result.environmentSafety.actualServerHost}:${result.environmentSafety.actualServerPort}`);
    console.log(`Database:          ${result.environmentSafety.actualDatabaseName}`);
    console.log(`Current User:      ${result.identity.currentUser}`);
    console.log(`Latency:           ${result.identity.latencyMs >= 0 ? `${result.identity.latencyMs} ms` : 'N/A'}\n`);

    console.log('--- SCHEMA & PARITY METRICS ---');
    console.log(`Prisma Models:     ${result.schemaParity.prismaModelParity.matchedModelsCount} / ${result.schemaParity.prismaModelParity.expectedModelsCount} matched`);
    console.log(`PostgreSQL Tables: ${result.schemaParity.postgresTableParity.dbTablesCount} tables in public schema`);
    console.log(`Foreign Keys:      ${result.schemaParity.constraintParity.totalForeignKeys}`);
    console.log(`FKs Missing Index: ${result.schemaParity.indexParity.missingIndexesOnFk.length}\n`);

    console.log('--- FINDINGS & RISKS (P0-P3) ---');
    if (result.findings.length === 0) {
      console.log('✅ Žádné vady nebyly detekovány.\n');
    } else {
      for (const f of result.findings) {
        console.log(`[${f.severity}] [${f.code}] ${f.title}`);
        console.log(`      ${f.description}`);
        console.log(`      Náprava: ${f.remediationGuidance}\n`);
      }
    }

    if (cliArgs.outputPath) {
      console.log(`📄 Report uložen do: ${cliArgs.outputPath}`);
    }
  }

  // Determine CLI exit code
  // 0 = PASS or PASS_WITH_WARNINGS
  // 1 = FAIL or BLOCKED
  if (result.status === 'FAIL' || result.status === 'BLOCKED') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('FATAL CLI ERROR:', err);
  process.exit(1);
});
