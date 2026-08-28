import assert from 'node:assert';
import { SynthesisService } from '../services/synthesisService';
import { GithubSyncService } from '../services/synthesis/githubSyncService';
import { isPrismaAvailable, setPrismaDisabled, setPrismaClientForTest } from '../db/prisma';
import { AuthService } from '../services/authService';

async function runSynthesisCoreTests() {
  console.log('[Test] Running Synthesis Core & Control Center Conformance Tests...');

  // Test 1: Deduplication hash determinism
  console.log('1. Testing computeDedupHash determinism...');
  const str1 = 'EsbirkaScheduler:89/2012:MISSING_SECTIONS:fallbackSections:validation_contract';
  const hash1 = SynthesisService.computeDedupHash(str1);
  const hash2 = SynthesisService.computeDedupHash(str1 + '   '); // Should trim
  assert.strictEqual(hash1, hash2, 'computeDedupHash should trim whitespace and be deterministic');
  assert.strictEqual(hash1.length, 64, 'computeDedupHash should return a 64-char hex string (SHA256)');

  // Test 2: Git SHA normalization & integrity (no fake SHAs)
  console.log('2. Testing commitSha validation and normalization (STRICT SHA)...');
  const validSha = '40247ac75a3ea02817a80bd20f692ecffa7f41f2';
  assert.strictEqual(SynthesisService.normalizeCommitSha(validSha), validSha, 'Valid 40-char SHA must be preserved');
  assert.strictEqual(SynthesisService.normalizeCommitSha('main-HEAD'), null, 'main-HEAD must be converted to null');
  assert.strictEqual(SynthesisService.normalizeCommitSha('HEAD'), null, 'HEAD must be converted to null');
  assert.strictEqual(SynthesisService.normalizeCommitSha('unknown'), null, 'unknown must be converted to null');
  assert.strictEqual(SynthesisService.normalizeCommitSha('fake'), null, 'fake must be converted to null');
  assert.strictEqual(SynthesisService.normalizeCommitSha(null), null, 'null SHA must return null');
  assert.strictEqual(SynthesisService.normalizeCommitSha(undefined), null, 'undefined SHA must return null');

  // Test 3: Fail-closed verification when Prisma is disabled / unavailable
  console.log('3. Testing fail-closed behavior when DB is unavailable...');

  try {
    // Force DB disabled
    setPrismaDisabled(true);
    assert.strictEqual(isPrismaAvailable(), false, 'isPrismaAvailable must return false when setPrismaDisabled(true)');

    // Read operation should return empty/degraded
    const readResult = await SynthesisService.getTickets();
    assert.strictEqual(readResult.isDegraded, true, 'getTickets should report degraded status when DB unavailable');
    assert.strictEqual(readResult.tickets.length, 0, 'getTickets should return empty array when DB unavailable');

    // Write operation createTicket MUST fail-closed with 503
    let createFailedWithError = false;
    try {
      await SynthesisService.createTicket({
        title: 'Test Fail-Closed',
        description: 'Should fail',
        source: 'MANUAL_ADMIN',
        severity: 'P3_LOW',
        category: 'FUNCTIONAL',
      });
    } catch (err: any) {
      createFailedWithError = true;
      assert.strictEqual(err.statusCode, 503, 'Error statusCode must be 503');
      assert.strictEqual(err.code, 'DATABASE_UNAVAILABLE', 'Error code must be DATABASE_UNAVAILABLE');
    }
    assert.strictEqual(createFailedWithError, true, 'createTicket MUST throw fail-closed 503 error when DB unavailable');

    // Write operation addComment MUST fail-closed with 503
    let commentFailedWithError = false;
    try {
      await SynthesisService.addComment({
        ticketId: 'non-existent',
        authorName: 'Test',
        content: 'Test content',
      });
    } catch (err: any) {
      commentFailedWithError = true;
      assert.strictEqual(err.statusCode, 503, 'Comment error statusCode must be 503');
    }
    assert.strictEqual(commentFailedWithError, true, 'addComment MUST throw fail-closed 503 error when DB unavailable');

    // Write operation ingestEsbirkaRemediationFinding MUST fail-closed with 503
    let ingestFailedWithError = false;
    try {
      await SynthesisService.ingestEsbirkaRemediationFinding();
    } catch (err: any) {
      ingestFailedWithError = true;
      assert.strictEqual(err.statusCode, 503, 'Ingest error statusCode must be 503');
    }
    assert.strictEqual(ingestFailedWithError, true, 'ingestEsbirkaRemediationFinding MUST throw fail-closed 503 error when DB unavailable');

  } finally {
    // Restore setPrismaDisabled
    setPrismaDisabled(false);
  }

  // Test 4: RBAC Role Verification
  console.log('4. Testing RBAC access controls for Synthesis endpoints...');
  assert.strictEqual(AuthService.hasPermission('SUPER_ADMIN' as any, 'ADMIN' as any), true, 'SUPER_ADMIN must be ALLOWED');
  assert.strictEqual(AuthService.hasPermission('ADMIN' as any, 'ADMIN' as any), true, 'ADMIN must be ALLOWED');
  assert.strictEqual(AuthService.hasPermission('SYSTEM_ADMIN' as any, 'ADMIN' as any), true, 'SYSTEM_ADMIN must be ALLOWED');
  assert.strictEqual(AuthService.hasPermission('USER' as any, 'ADMIN' as any), false, 'USER must be DENIED (403)');

  // Test 5: SynthesisService logic validation with mock prisma
  console.log('5. Testing SynthesisService createTicket, deduplication, relations, and e-Sbírka ingestion logic...');

  const mockTickets = new Map<string, any>();
  let ticketCounter = 1;

  const mockPrisma: any = {
    synthesisTicket: {
      findUnique: async ({ where }: any) => {
        if (where.dedupHash) {
          return mockTickets.get(where.dedupHash) || null;
        }
        if (where.id) {
          for (const ticket of mockTickets.values()) {
            if (ticket.id === where.id) return ticket;
          }
        }
        return null;
      },
      findMany: async () => Array.from(mockTickets.values()),
      count: async () => mockTickets.size,
      create: async ({ data }: any) => {
        const id = `synthesis-ticket-${ticketCounter}`;
        const ticketNumber = ticketCounter++;
        const ticket = {
          id,
          ticketNumber,
          title: data.title,
          description: data.description,
          source: data.source,
          severity: data.severity,
          category: data.category,
          status: data.status,
          dedupHash: data.dedupHash,
          sourcePath: data.sourcePath,
          auditDocumentId: data.auditDocumentId || null,
          qaFindingId: data.qaFindingId || null,
          supportTicketId: data.supportTicketId || null,
          commitSha: data.commitSha,
          branch: data.branch,
          coderabbitCommentId: data.coderabbitCommentId || null,
          githubIssueNumber: data.githubIssueNumber || null,
          githubIssueUrl: data.githubIssueUrl || null,
          githubPrNumber: data.githubPrNumber || null,
          githubPrUrl: data.githubPrUrl || null,
          slaDueDate: data.slaDueDate || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          comments: data.comments?.create?.map((c: any, idx: number) => ({
            id: `comment-${idx + 1}`,
            ticketId: id,
            authorName: c.authorName,
            content: c.content,
            isInternal: c.isInternal,
            isAiGenerated: c.isAiGenerated,
            createdAt: new Date(),
          })) || [],
          events: data.events?.create?.map((e: any, idx: number) => ({
            id: `event-${idx + 1}`,
            ticketId: id,
            eventType: e.eventType,
            actorName: e.actorName,
            toValue: e.toValue,
            metadata: e.metadata,
            createdAt: new Date(),
          })) || [],
        };
        mockTickets.set(data.dedupHash, ticket);
        return ticket;
      },
      update: async ({ where, data }: any) => {
        for (const ticket of mockTickets.values()) {
          if (ticket.id === where.id) {
            Object.assign(ticket, data);
            return ticket;
          }
        }
        return null;
      },
    },
    synthesisTicketComment: {
      create: async ({ data }: any) => {
        const comment = {
          id: `comment-${Date.now()}`,
          ticketId: data.ticketId,
          authorName: data.authorName,
          content: data.content,
          isInternal: data.isInternal,
          isAiGenerated: data.isAiGenerated,
          createdAt: new Date(),
        };
        for (const ticket of mockTickets.values()) {
          if (ticket.id === data.ticketId) {
            ticket.comments.push(comment);
          }
        }
        return comment;
      },
    },
    synthesisTicketEvent: {
      create: async ({ data }: any) => {
        const event = {
          id: `event-${Date.now()}`,
          ticketId: data.ticketId,
          eventType: data.eventType,
          actorName: data.actorName,
          metadata: data.metadata,
          createdAt: new Date(),
        };
        for (const ticket of mockTickets.values()) {
          if (ticket.id === data.ticketId) {
            ticket.events.push(event);
          }
        }
        return event;
      },
    },
    auditDocument: {
      findFirst: async () => null,
    },
  };

  setPrismaClientForTest(mockPrisma);

  try {
    // 5a. Ingest e-Sbírka finding
    const ingestRes1 = await SynthesisService.ingestEsbirkaRemediationFinding();
    assert.strictEqual(ingestRes1.isDuplicate, false, 'First ingestion should NOT be a duplicate');
    assert.strictEqual(ingestRes1.ticket.severity, 'P2_MEDIUM', 'Severity should be P2_MEDIUM');
    assert.strictEqual(ingestRes1.ticket.category, 'API', 'Category should be API');
    assert.strictEqual(ingestRes1.ticket.status, 'IN_TRIAGE', 'Status should be IN_TRIAGE');
    assert.strictEqual(ingestRes1.ticket.commitSha, '40247ac75a3ea02817a80bd20f692ecffa7f41f2', 'Commit SHA must match e-Sbírka fix');
    assert.strictEqual(ingestRes1.ticket.branch, 'feature/auth-session-consistency', 'Branch must match feature/auth-session-consistency');

    // 5b. Deduplication check
    const ingestRes2 = await SynthesisService.ingestEsbirkaRemediationFinding();
    assert.strictEqual(ingestRes2.isDuplicate, true, 'Second ingestion MUST return isDuplicate: true');
    assert.strictEqual(ingestRes2.ticket.id, ingestRes1.ticket.id);

    // 5c. Sanitization of fake commitSha check
    const fakeShaTicketRes = await SynthesisService.createTicket({
      title: 'Fake SHA Ticket Test',
      description: 'Testing that fake SHA string is converted to null',
      source: 'MANUAL_ADMIN',
      severity: 'P3_LOW',
      category: 'FUNCTIONAL',
      commitSha: 'main-HEAD', // Fake placeholder
    });
    assert.strictEqual(fakeShaTicketRes.ticket.commitSha, null, 'Fake SHA "main-HEAD" must be sanitized to null');

    // 5d. Add comment test
    const commentRes = await SynthesisService.addComment({
      ticketId: ingestRes1.ticket.id,
      authorName: 'QA Auditor',
      content: 'Verified reconciliation audit in docs/audit/SYNTHESIS_PHASE_01_6_ESBIRKA_UNPLANNED_CHANGE_RECONCILIATION_2026-08-26.md',
    });
    assert.strictEqual(commentRes.authorName, 'QA Auditor');

    // 5e. Fetch ticket check
    const fetched = await SynthesisService.getTicketById(ingestRes1.ticket.id);
    assert.notStrictEqual(fetched, null);
    assert.strictEqual(fetched?.id, ingestRes1.ticket.id);

    // 6. Test GithubSyncService validations and linking
    console.log('6. Testing GithubSyncService validation & linking...');
    const ticketToSync = ingestRes1.ticket;

    // 6a. Valid Issue link
    const syncRes1 = await GithubSyncService.linkGithubMetadata({
      ticketId: ticketToSync.id,
      githubIssueNumber: 101,
      actorName: 'Admin Tester',
    });
    assert.strictEqual(syncRes1.githubIssueNumber, 101);
    assert.strictEqual(syncRes1.githubIssueUrl, 'https://github.com/jirisar7-eng/dev3/issues/101');
    assert.strictEqual(syncRes1.githubSyncStatus, 'ISSUE_CREATED');

    // 6b. Valid PR link
    const syncRes2 = await GithubSyncService.linkGithubMetadata({
      ticketId: ticketToSync.id,
      githubPrNumber: 42,
      actorName: 'Admin Tester',
    });
    assert.strictEqual(syncRes2.githubPrNumber, 42);
    assert.strictEqual(syncRes2.githubPrUrl, 'https://github.com/jirisar7-eng/dev3/pull/42');
    assert.strictEqual(syncRes2.githubSyncStatus, 'PR_LINKED');

    // 6c. Valid 40-char commit SHA
    const valid40Sha = '1234567890abcdef1234567890abcdef12345678';
    const syncRes3 = await GithubSyncService.linkGithubMetadata({
      ticketId: ticketToSync.id,
      commitSha: valid40Sha,
      actorName: 'Admin Tester',
    });
    assert.strictEqual(syncRes3.commitSha, valid40Sha);

    // 6d. Invalid SHA rejected
    let invalidShaRejected = false;
    try {
      await GithubSyncService.linkGithubMetadata({
        ticketId: ticketToSync.id,
        commitSha: 'not-a-sha',
      });
    } catch (err: any) {
      invalidShaRejected = true;
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_COMMIT_SHA');
    }
    assert.strictEqual(invalidShaRejected, true, 'Invalid SHA must be rejected with 400');

    // 6e. Fake SHA rejected
    let fakeShaRejected = false;
    try {
      await GithubSyncService.linkGithubMetadata({
        ticketId: ticketToSync.id,
        commitSha: 'unknown',
      });
    } catch (err: any) {
      fakeShaRejected = true;
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_COMMIT_SHA');
    }
    assert.strictEqual(fakeShaRejected, true, 'Fake SHA "unknown" must be rejected with 400');

    // 6f. Invalid Issue/PR numbers rejected
    let invalidNumberRejected = false;
    try {
      await GithubSyncService.linkGithubMetadata({
        ticketId: ticketToSync.id,
        githubIssueNumber: -1,
      });
    } catch (err: any) {
      invalidNumberRejected = true;
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'INVALID_GITHUB_NUMBER');
    }
    assert.strictEqual(invalidNumberRejected, true, 'Negative issue number must be rejected with 400');

    // 6g. Cross-repository reference rejected
    let crossRepoRejected = false;
    try {
      await GithubSyncService.linkGithubMetadata({
        ticketId: ticketToSync.id,
        repository: 'malicious-user/other-repo',
      });
    } catch (err: any) {
      crossRepoRejected = true;
      assert.strictEqual(err.statusCode, 400);
      assert.strictEqual(err.code, 'CROSS_REPOSITORY_REJECTED');
    }
    assert.strictEqual(crossRepoRejected, true, 'Cross-repository reference must be rejected with 400');

  } finally {
    setPrismaClientForTest(null as any);
  }

  console.log('✅ ALL Synthesis Core & Control Center Conformance tests passed successfully!');
}

runSynthesisCoreTests().catch((err) => {
  console.error('❌ Synthesis Core tests failed:', err);
  process.exit(1);
});
