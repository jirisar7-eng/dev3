import { NotionHandoffService } from '../services/audit/notionHandoffService';
import { InternalHandoffNote } from '../types/handoffTypes';
import fs from 'fs';
import path from 'path';

function createSampleHandoff(overrides: Partial<InternalHandoffNote> = {}): InternalHandoffNote {
  const baseNote: Omit<InternalHandoffNote, 'contentHash'> = {
    handoffId: 'HND-20260901-DEV3-DB-AUDIT-P2',
    timestamp: new Date().toISOString(),
    source: 'AI_STUDIO',
    target: 'CHATGPT',
    project: 'TATA_MA_PRAVO',
    topic: 'Database Audit Engine Phase 1+2 Ready for DEV3 Verification',
    status: 'HANDOFF_READY',
    environment: 'AI_STUDIO_SANDBOX',
    verificationState: 'VERIFIED',
    databaseSourceState: 'UNVERIFIED',
    gitContext: {
      repository: 'jirisar7-eng/dev3',
      branch: 'feat/faze-6a-unified-ai-audit-operations',
      commitSha: '916b44be2c9c56b289ad137da91b1570ab650e73',
      verifiedOnRemote: true,
    },
    verifiedFacts: [
      'DatabaseAuditService introspects PostgreSQL schema, tables, FKs, indexes and anomalies strictly read-only',
      'CLI runner scripts/auditDatabase.ts supports --env DEV3, --json and --output without unredacted secrets',
      'All 5/5 unit tests in databaseAuditService.test.ts pass with 0 TypeScript errors',
    ],
    implementedChanges: [
      'src/types/databaseAudit.ts',
      'src/services/audit/databaseAuditService.ts',
      'src/tests/databaseAuditService.test.ts',
      'scripts/auditDatabase.ts',
    ],
    decisionsMade: [
      'AI Studio does not access VPS or live PostgreSQL directly; synchronization goes via GitHub deployment',
      'DatabaseAuditService is fail-closed when DB is unreachable, explicitly returning DATABASE SOURCE: UNVERIFIED',
    ],
    assumptionsAndProposals: [
      'DEV3 VPS will execute auto-sync and run scripts/auditDatabase.ts within tatovacesta_app container',
    ],
    risksAndBlockers: [
      {
        severity: 'P0',
        code: 'DB_POSTGRES_UNREACHABLE',
        description: 'PostgreSQL DB is unreachable in AI Studio sandbox container',
        remediation: 'Run canonical audit directly on DEV3 VPS via docker compose exec app npx tsx scripts/auditDatabase.ts',
      },
    ],
    dependencies: [
      'Docker Compose dev network on DEV3 VPS',
      'Prisma client in app container',
    ],
    nextConcreteAction: 'Synchronize DEV3 VPS with feat/faze-6a-unified-ai-audit-operations commit 916b44b and run scripts/auditDatabase.ts',
  };

  const merged = { ...baseNote, ...overrides };
  return NotionHandoffService.createHandoffNote(merged);
}

async function runTests() {
  console.log('=== RUNNING NOTION HANDOFF SERVICE UNIT TESTS ===\n');
  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`Test: ${testName} -> PASS`);
      passedCount++;
    } else {
      console.error(`Test: ${testName} -> FAIL: ${detail || 'Condition not met'}`);
      failedCount++;
    }
  }

  // Test 1: Valid handoff construction and formatting (AI_STUDIO -> CHATGPT)
  try {
    const note = createSampleHandoff();
    const validation = NotionHandoffService.validateHandoffNote(note);
    assert(validation.valid && validation.errors.length === 0, 'Valid AI_STUDIO -> CHATGPT handoff note validation');
    assert(note.source === 'AI_STUDIO' && note.target === 'CHATGPT', 'Correct source and target assignment');
    assert(note.contentHash && note.contentHash.length === 64, 'Deterministic SHA-256 contentHash generated');
  } catch (err: any) {
    assert(false, 'Valid AI_STUDIO -> CHATGPT handoff creation', err.message);
  }

  // Test 2: Bidirectional flow (CHATGPT -> AI_STUDIO)
  try {
    const chatGptNote = createSampleHandoff({
      handoffId: 'HND-20260901-DEV3-CHATGPT-ACK',
      source: 'CHATGPT',
      target: 'AI_STUDIO',
      status: 'ACKNOWLEDGED',
      environment: 'DEV3_VPS',
      verificationState: 'VERIFIED',
      databaseSourceState: 'VERIFIED_POSTGRES',
      topic: 'DEV3 VPS Sync Complete - Real PostgreSQL Verification Successful',
      verifiedFacts: ['DEV3 container updated to commit 916b44b', 'auditDatabase.ts returned status PASS on DEV3 DB'],
    });

    const validation = NotionHandoffService.validateHandoffNote(chatGptNote);
    assert(validation.valid, 'Valid CHATGPT -> AI_STUDIO handoff note validation');
    assert(chatGptNote.source === 'CHATGPT' && chatGptNote.target === 'AI_STUDIO', 'Bidirectional CHATGPT -> AI_STUDIO tags preserved');
  } catch (err: any) {
    assert(false, 'Bidirectional flow test', err.message);
  }

  // Test 3: Missing mandatory fields validation (Fail-closed)
  try {
    const invalidNote: any = {
      handoffId: 'HND-INVALID',
      // missing timestamp, source, target, topic, etc.
    };
    const validation = NotionHandoffService.validateHandoffNote(invalidNote);
    assert(!validation.valid && validation.errors.length >= 5, 'Fail-closed validation rejects incomplete handoff note');
  } catch (err: any) {
    assert(false, 'Missing mandatory fields validation', err.message);
  }

  // Test 4: Invalid source and target rejection
  try {
    const invalidSourceNote: any = {
      ...createSampleHandoff(),
      source: 'INVALID_ACTOR',
      target: 'UNKNOWN_TARGET',
    };
    const validation = NotionHandoffService.validateHandoffNote(invalidSourceNote);
    assert(!validation.valid, 'Rejects invalid source and target actors');
  } catch (err: any) {
    assert(false, 'Invalid source/target validation', err.message);
  }

  // Test 5: Secrets detection (Fail-closed secret scanner)
  try {
    const rawSecrets = [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      'ghp_1234567890abcdefghijklmnopqrstuvwxyzA',
      'AIzaSyB1234567890abcdefghijklmnopqrstuvw',
      'sk-1234567890abcdefghijklmnopqrstuvwxyz12',
      'Bearer abcdefghijklmnopqrstuvwxyz1234567890',
      'postgres://postgres:SuperSecretPassword123@localhost:5432/mydb',
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...',
      'POSTGRES_PASSWORD=MyDbPass123456',
    ];

    for (const secret of rawSecrets) {
      const scan = NotionHandoffService.scanForSecrets(secret);
      assert(scan.hasSecrets, `Detects raw secret pattern: ${secret.slice(0, 20)}...`);
    }

    // Pushing note with secret must fail-closed and block sending
    const rawNoteWithSecret: any = {
      handoffId: 'HND-20260901-SECRET-TEST',
      timestamp: new Date().toISOString(),
      source: 'AI_STUDIO',
      target: 'CHATGPT',
      project: 'TATA_MA_PRAVO',
      topic: 'Testing with unredacted secret AIzaSyB1234567890abcdefghijklmnopqrstuvw',
      status: 'HANDOFF_READY',
      environment: 'AI_STUDIO_SANDBOX',
      verificationState: 'VERIFIED',
      databaseSourceState: 'UNVERIFIED',
      gitContext: {
        repository: 'jirisar7-eng/dev3',
        branch: 'feat/faze-6a-unified-ai-audit-operations',
        commitSha: '916b44be2c9c56b289ad137da91b1570ab650e73',
        verifiedOnRemote: true,
      },
      verifiedFacts: [],
      implementedChanges: [],
      decisionsMade: [],
      assumptionsAndProposals: [],
      risksAndBlockers: [],
      dependencies: [],
      nextConcreteAction: 'Fix secrets filter',
      contentHash: 'dummy-hash',
    };

    const pushResult = await NotionHandoffService.pushHandoff(rawNoteWithSecret);
    assert(!pushResult.success && pushResult.status === 'FAILED_BLOCKED', 'Blocks pushHandoff if unredacted secret is present');
  } catch (err: any) {
    assert(false, 'Secrets detection test', err.message);
  }

  // Test 6: PII and text sanitization
  try {
    const noteWithPii = createSampleHandoff({
      topic: 'Audit for user with RC 850101/1234 and email confidential-admin@tatamapravo.cz',
      verifiedFacts: ['Contacted user at test.person@example.com regarding case'],
    });

    const sanitized = NotionHandoffService.sanitizeHandoffNote(noteWithPii);
    assert(!sanitized.topic.includes('850101/1234'), 'Redacts Czech Rodné Číslo');
    assert(sanitized.topic.includes('[REDACTED_RC_PII]'), 'Injects [REDACTED_RC_PII] placeholder');
    assert(!sanitized.topic.includes('confidential-admin@tatamapravo.cz'), 'Redacts Email address');
    assert(sanitized.topic.includes('[REDACTED_EMAIL]'), 'Injects [REDACTED_EMAIL] placeholder');
  } catch (err: any) {
    assert(false, 'PII sanitization test', err.message);
  }

  // Test 7: Zero-mutation and no-git-touch invariant
  try {
    const filePath = path.resolve(process.cwd(), 'src/services/audit/notionHandoffService.ts');
    const serviceContent = fs.readFileSync(filePath, 'utf-8');
    const forbiddenKeywords = ['prisma.$executeRaw', 'prisma.create', 'prisma.update', 'prisma.delete', 'git commit', 'git push', 'fs.writeFileSync'];
    const detectedForbidden = forbiddenKeywords.filter(kw => serviceContent.includes(kw));

    assert(detectedForbidden.length === 0, 'Zero-mutation invariant (no DB mutations, no git commits, no arbitrary file dumps)');
  } catch (err: any) {
    assert(false, 'Zero-mutation invariant inspection', err.message);
  }

  // Test 8: Graceful local isolation when Notion is not configured
  try {
    const note = createSampleHandoff();
    const result = await NotionHandoffService.pushHandoff(note);

    assert(
      result.success && (result.status === 'HANDOFF_NOT_SENT_LOCAL_ONLY' || result.status === 'SENT_TO_NOTION'),
      'Graceful execution without throwing when Notion is unconfigured in sandbox'
    );
  } catch (err: any) {
    assert(false, 'Graceful unconfigured execution', err.message);
  }

  // Test 9: Idempotent hash calculation
  try {
    const note1 = createSampleHandoff({ topic: 'Deterministic Test Topic' });
    const note2 = createSampleHandoff({ topic: 'Deterministic Test Topic' });
    const note3 = createSampleHandoff({ topic: 'Different Topic' });

    assert(note1.contentHash === note2.contentHash, 'Identical handoff notes produce identical content hashes');
    assert(note1.contentHash !== note3.contentHash, 'Different handoff notes produce distinct content hashes');
  } catch (err: any) {
    assert(false, 'Idempotent hash test', err.message);
  }

  console.log(`\n=== TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED ===\n`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
