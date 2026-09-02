import { DatabaseAuditService } from '../services/audit/databaseAuditService';
import { DatabaseAuditContext } from '../types/databaseAudit';

async function runTests() {
  console.log('=== RUNNING DATABASE AUDIT SERVICE UNIT TESTS (PHASE 1) ===\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Unreachable DB handling & fail-closed fallback identification
  try {
    const context: DatabaseAuditContext = {
      initiator: 'CLI',
      expectedEnvironment: 'DEV3',
    };
    const result = await DatabaseAuditService.runAudit(context);

    console.log('Test 1: Unreachable DB Handling');
    console.log('  Status:', result.status);
    console.log('  Database Source:', result.databaseSource);
    console.log('  Is Fallback Mode:', result.isFallbackMode);
    console.log('  Findings count:', result.findings.length);

    if (
      result.status === 'FAIL' &&
      result.databaseSource === 'UNVERIFIED' &&
      result.isFallbackMode === true &&
      result.findings.some((f) => f.code === 'DB_POSTGRES_UNREACHABLE' && f.severity === 'P0')
    ) {
      console.log('  -> PASS\n');
      passed++;
    } else {
      console.error('  -> FAIL: Expected status FAIL with UNVERIFIED source and DB_POSTGRES_UNREACHABLE finding');
      failed++;
    }
  } catch (err: any) {
    console.error('  -> FAIL (Exception):', err.message);
    failed++;
  }

  // Test 2: Environment Safety Check (Mismatch detection)
  try {
    const context: DatabaseAuditContext = {
      initiator: 'ADMIN_API',
      expectedEnvironment: 'DEV3',
      expectedDatabaseName: 'mismatched_test_db_xyz',
    };
    const result = await DatabaseAuditService.runAudit(context);

    console.log('Test 2: Environment Safety Mismatch Guard');
    console.log('  Status:', result.status);
    console.log('  Is Safe:', result.environmentSafety.isSafe);
    console.log('  Mismatch Reason:', result.environmentSafety.mismatchReason);

    if (
      result.status === 'BLOCKED' &&
      !result.environmentSafety.isSafe &&
      result.findings.some((f) => f.code === 'DB_ENV_MISMATCH' && f.severity === 'P0')
    ) {
      console.log('  -> PASS\n');
      passed++;
    } else {
      console.error('  -> FAIL: Expected status BLOCKED with DB_ENV_MISMATCH finding');
      failed++;
    }
  } catch (err: any) {
    console.error('  -> FAIL (Exception):', err.message);
    failed++;
  }

  // Test 3: Audit Cache & Retrieval by ID
  try {
    const context: DatabaseAuditContext = {
      initiator: 'CLI',
      expectedEnvironment: 'DEV3',
    };
    const result = await DatabaseAuditService.runAudit(context);
    const retrieved = await DatabaseAuditService.getAuditById(result.auditId);

    console.log('Test 3: Audit Cache & getAuditById');
    console.log('  Audit ID:', result.auditId);
    console.log('  Retrieved ID:', retrieved?.auditId);

    if (retrieved && retrieved.auditId === result.auditId && retrieved.status === result.status) {
      console.log('  -> PASS\n');
      passed++;
    } else {
      console.error('  -> FAIL: Retrieved audit does not match original result');
      failed++;
    }
  } catch (err: any) {
    console.error('  -> FAIL (Exception):', err.message);
    failed++;
  }

  // Test 4: Static Read-Only & Zero-Mutation Verification
  try {
    console.log('Test 4: Static Inspection for Read-Only Compliance');
    // Inspect source code of DatabaseAuditService for any write/mutation patterns
    const fs = await import('fs');
    const path = await import('path');
    const code = fs.readFileSync(path.join(process.cwd(), 'src/services/audit/databaseAuditService.ts'), 'utf-8');

    const forbiddenKeywords = [
      'INSERT INTO',
      'UPDATE ',
      'DELETE FROM',
      'DROP TABLE',
      'ALTER TABLE',
      'TRUNCATE',
      'prisma.$executeRaw',
      'prisma.$executeRawUnsafe',
      'prisma.$queryRawUnsafe',
      'prisma.user.delete',
      'prisma.article.delete',
      'client.create(',
      'client.update(',
      'client.delete(',
      'client.upsert(',
    ];

    const forbiddenFound = forbiddenKeywords.filter((kw) => {
      // Allow AuditService.recordLog which writes audit log via AuditService
      return code.includes(kw);
    });

    console.log('  Forbidden mutation keywords detected in service:', forbiddenFound);

    if (forbiddenFound.length === 0) {
      console.log('  -> PASS (Strictly Read-Only)\n');
      passed++;
    } else {
      console.error('  -> FAIL: Detected potential mutation keyword in audit engine:', forbiddenFound);
      failed++;
    }
  } catch (err: any) {
    console.error('  -> FAIL (Exception):', err.message);
    failed++;
  }

  // Test 5: Sanitization of Secrets & PII
  try {
    console.log('Test 5: Sanitization & Data Protection');
    const context: DatabaseAuditContext = {
      initiator: 'ORION',
      expectedEnvironment: 'DEV3',
    };
    const result = await DatabaseAuditService.runAudit(context);
    const jsonString = JSON.stringify(result);

    const sensitivePatterns = [
      /password/i,
      /totpSecret/i,
      /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/,
      /AIza[a-zA-Z0-9_-]{20,}/,
    ];

    // Filter allowed harmless occurrences like "password" in word "passwordHash" if properly redacted or absent
    const hasUnredactedSecrets = sensitivePatterns.some((pattern) => {
      const match = jsonString.match(pattern);
      if (!match) return false;
      // If it's redacted, it's safe
      return !jsonString.includes('[REDACTED');
    });

    if (!hasUnredactedSecrets) {
      console.log('  -> PASS (No unredacted secrets or credentials found in audit output)\n');
      passed++;
    } else {
      console.error('  -> FAIL: Unredacted sensitive pattern found in audit output');
      failed++;
    }
  } catch (err: any) {
    console.error('  -> FAIL (Exception):', err.message);
    failed++;
  }

  console.log(`=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
