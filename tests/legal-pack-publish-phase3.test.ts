import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { ComplianceService } from '../src/services/complianceService';
import { dbStore } from '../src/services/dbStore';
import { prisma } from '../src/db/prisma';

test('TMPR-20260910-LEGAL-PUBLISH-001: Legal Pack 2.0 Safe Publication Gate', async (t) => {
  const serverPath = path.join(process.cwd(), 'server.ts');
  const serverCode = fs.readFileSync(serverPath, 'utf8');

  await t.test('1. Anonymous user cannot publish (route requires requireAuth)', () => {
    assert.ok(
      serverCode.includes("app.put('/api/compliance/versions/:versionId/publish', requireAuth as any"),
      'Publish route must strictly require authentication'
    );
  });

  await t.test('2. USER cannot publish and 3. Unauthorized role cannot publish (requires requireRole("ADMIN"))', () => {
    assert.ok(
      serverCode.includes("requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) =>"),
      'Publish route must strictly enforce requireRole("ADMIN")'
    );
    assert.ok(
      serverCode.includes("app.post('/api/compliance/docs/:key/prepare-draft', requireAuth as any, requireRole('ADMIN')"),
      'Prepare draft route must strictly enforce requireRole("ADMIN")'
    );
  });

  await t.test('4. Authorized administrator can create an approved persisted version', async () => {
    const candidateId = await ComplianceService.prepareDraftForPublication('terms');
    assert.ok(candidateId, 'Candidate ID must exist');
    const preflight = await ComplianceService.preflightPublication(candidateId);
    assert.strictEqual(preflight.candidateVersion, '2.0.0', 'Candidate version must be 2.0.0');
  });

  await t.test('5. Working 2.0.0-DRAFT cannot be directly published', async () => {
    // Attempting to publish 2.0.0-DRAFT directly
    const storeDoc = dbStore.complianceDocs.find(d => d.key === 'terms');
    const draftVer = storeDoc?.versions?.find(v => v.version === '2.0.0-DRAFT');
    assert.ok(draftVer, '2.0.0-DRAFT must exist');

    const preflight = await ComplianceService.preflightPublication(draftVer.id);
    assert.strictEqual(preflight.canPublish, false, 'Preflight must fail for *-DRAFT');
    assert.ok(preflight.blockers.some(b => b.includes('DRAFT')), 'Blocker must mention DRAFT suffix');

    await assert.rejects(
      async () => {
        await ComplianceService.publishVersion(draftVer.id);
      },
      /FAIL CLOSED/,
      'Direct publish of 2.0.0-DRAFT must fail closed'
    );
  });

  await t.test('6. Synthetic draft-20-* ID cannot be published', async () => {
    const syntheticId = 'draft-20-terms';
    const preflight = await ComplianceService.preflightPublication(syntheticId);
    assert.strictEqual(preflight.canPublish, false, 'Preflight must fail for synthetic ID');
    assert.ok(preflight.blockers.some(b => b.includes('syntetické ID')), 'Blocker must identify synthetic ID');

    await assert.rejects(
      async () => {
        await ComplianceService.publishVersion(syntheticId);
      },
      /FAIL CLOSED/,
      'Publish of synthetic draft-20-* must fail closed'
    );
  });

  await t.test('7-12. Publication lifecycle: atomic transaction, archival, audit, and public resolver', async () => {
    // Create a mock clean document to test successful publication cycle without disturbing real legal documents
    const uniqueKey = 'test_lifecycle_doc_' + Date.now();
    const testDoc = await ComplianceService.createDoc({
      key: uniqueKey,
      title: 'Test Lifecycle Dokument',
      description: 'Ověření bezpečného publikačního životního cyklu',
      type: 'LEGAL',
      category: 'LEGAL',
    });

    // createDoc already initializes v1.0.0 as PUBLISHED
    // Verify 11. Public endpoint returns old version before publication
    const publicBefore = await ComplianceService.getPublishedDoc(testDoc.key);
    assert.strictEqual(publicBefore?.version, '1.0.0', 'Public before publish must be v1.0.0');
    const v1Id = publicBefore?.versions?.[0]?.id;

    // 2. Create a clean candidate 2.0.0 DRAFT (no blockers)
    const v2Candidate = await ComplianceService.createVersion(testDoc.key, {
      version: '2.0.0',
      content: '# Verze 2.0.0\nČistý nový obsah bez jakýchkoliv nevyřešených markerů.',
      status: 'DRAFT',
    });

    const preflight = await ComplianceService.preflightPublication(v2Candidate.id);
    assert.strictEqual(preflight.canPublish, true, 'Clean candidate must pass preflight');
    assert.strictEqual(preflight.status, 'READY');

    // 3. Publish candidate
    const published = await ComplianceService.publishVersion(v2Candidate.id, {
      id: 'admin-test-id',
      email: 'admin@tatovacesta.cz',
      role: 'ADMIN',
      name: 'Admin Test',
    } as any);

    // 8. New version becomes PUBLISHED
    assert.strictEqual(published.status, 'PUBLISHED', 'Candidate must become PUBLISHED');
    assert.strictEqual(published.version, '2.0.0');

    // 7. Previous PUBLISHED version becomes ARCHIVED
    const docWithVersions = dbStore.complianceDocs.find(d => d.key === testDoc.key);
    const v1Updated = docWithVersions?.versions?.find(v => v.id === v1Id);
    assert.strictEqual(v1Updated?.status, 'ARCHIVED', 'Previous version must become ARCHIVED');

    // 9. Historical content is preserved
    assert.ok(v1Updated?.content, 'Old content must be preserved in archive');

    // 10. Audit record is created
    const auditLogs = dbStore.auditLogs || [];
    const pubAudit = auditLogs.find(a => a.action === 'COMPLIANCE_VERSION_PUBLISH' && a.details?.includes('Test Lifecycle Dokument'));
    assert.ok(pubAudit, 'Audit log COMPLIANCE_VERSION_PUBLISH must be recorded');

    // 12. Public endpoint returns new version after successful publication
    const publicAfter = await ComplianceService.getPublishedDoc(testDoc.key);
    assert.strictEqual(publicAfter?.version, '2.0.0', 'Public after publish must be v2.0.0');
  });

  await t.test('13. No publication happens merely by opening Draft Preview', async () => {
    // Sync drafts
    await ComplianceService.ensureLegalPack20Drafts();
    const publishedTerms = await ComplianceService.getPublishedDoc('terms');
    assert.notStrictEqual(publishedTerms?.version, '2.0.0-DRAFT', 'Terms must not be published as 2.0.0-DRAFT');
    assert.strictEqual(publishedTerms?.status, 'PUBLISHED', 'Terms must remain PUBLISHED v1.x');
  });

  await t.test('14. Failure during preflight does not leave document without valid PUBLISHED version', async () => {
    const publishedTermsBefore = await ComplianceService.getPublishedDoc('terms');
    const prevVersion = publishedTermsBefore?.version;

    // Attempt invalid publish on terms (which has unresolved markers)
    const termsCandidateId = await ComplianceService.prepareDraftForPublication('terms');
    await assert.rejects(
      async () => {
        await ComplianceService.publishVersion(termsCandidateId);
      },
      /FAIL CLOSED/
    );

    const publishedTermsAfter = await ComplianceService.getPublishedDoc('terms');
    assert.strictEqual(publishedTermsAfter?.version, prevVersion, 'Published version must remain unchanged on failure');
    assert.strictEqual(publishedTermsAfter?.status, 'PUBLISHED', 'Document must still have a valid PUBLISHED version');
  });

  await t.test('15. DEFECT 1 Regression: existing PUBLISHED 2.0.0 cannot be overwritten by prepareDraftForPublication', async () => {
    const uniqueKey = 'test_immutable_pub_' + Date.now();
    const doc = await ComplianceService.createDoc({
      key: uniqueKey,
      title: 'Dokument s publikovanou v2.0.0',
      description: 'Test neměnnosti publikované verze',
      type: 'LEGAL',
      category: 'LEGAL',
    });

    const storeDoc = dbStore.complianceDocs.find(d => d.key === uniqueKey);
    assert.ok(storeDoc, 'Dokument musí existovat v store');
    if (!storeDoc.versions) storeDoc.versions = [];

    const originalContent = 'ORIGINAL_IMMUTABLE_PUBLISHED_2_0_0_CONTENT';
    storeDoc.versions.push({
      id: `${storeDoc.id}-v2-pub-test`,
      documentId: storeDoc.id,
      version: '2.0.0',
      content: originalContent,
      status: 'PUBLISHED',
      effectiveDate: new Date().toISOString(),
      author: 'Původní autor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await assert.rejects(
      async () => {
        await ComplianceService.prepareDraftForPublication(uniqueKey);
      },
      /FAIL CLOSED.*neměnné/i,
      'prepareDraftForPublication must fail closed when 2.0.0 is already PUBLISHED'
    );

    const versionAfter = storeDoc.versions.find(v => v.version === '2.0.0');
    assert.strictEqual(versionAfter?.content, originalContent, 'PUBLISHED 2.0.0 content must be strictly immutable');
    assert.strictEqual(versionAfter?.status, 'PUBLISHED', 'Status must remain PUBLISHED');
  });

  await t.test('16. DEFECT 1 Regression: existing ARCHIVED 2.0.0 cannot be overwritten by prepareDraftForPublication', async () => {
    const uniqueKey = 'test_immutable_arch_' + Date.now();
    const doc = await ComplianceService.createDoc({
      key: uniqueKey,
      title: 'Dokument s archivovanou v2.0.0',
      description: 'Test neměnnosti archivované verze',
      type: 'LEGAL',
      category: 'LEGAL',
    });

    const storeDoc = dbStore.complianceDocs.find(d => d.key === uniqueKey);
    assert.ok(storeDoc, 'Dokument musí existovat v store');
    if (!storeDoc.versions) storeDoc.versions = [];

    const originalContent = 'ORIGINAL_IMMUTABLE_ARCHIVED_2_0_0_CONTENT';
    storeDoc.versions.push({
      id: `${storeDoc.id}-v2-arch-test`,
      documentId: storeDoc.id,
      version: '2.0.0',
      content: originalContent,
      status: 'ARCHIVED',
      effectiveDate: new Date().toISOString(),
      author: 'Původní autor',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await assert.rejects(
      async () => {
        await ComplianceService.prepareDraftForPublication(uniqueKey);
      },
      /FAIL CLOSED.*neměnné/i,
      'prepareDraftForPublication must fail closed when 2.0.0 is ARCHIVED'
    );

    const versionAfter = storeDoc.versions.find(v => v.version === '2.0.0');
    assert.strictEqual(versionAfter?.content, originalContent, 'ARCHIVED 2.0.0 content must be strictly immutable');
    assert.strictEqual(versionAfter?.status, 'ARCHIVED', 'Status must remain ARCHIVED');
  });

  await t.test('17. DEFECT 1 Regression: existing DRAFT 2.0.0 behavior remains intentional and tested', async () => {
    const uniqueKey = 'terms'; // 'terms' has SSOT content
    const candidateId = await ComplianceService.prepareDraftForPublication(uniqueKey);
    assert.ok(candidateId, 'prepareDraftForPublication should return candidateId for existing DRAFT');

    const storeDoc = dbStore.complianceDocs.find(d => d.key === uniqueKey);
    const candidate = storeDoc?.versions?.find(v => v.id === candidateId);
    assert.ok(candidate, 'Candidate must exist');
    assert.strictEqual(candidate.version, '2.0.0');
    assert.strictEqual(candidate.status, 'DRAFT', 'Status must remain DRAFT until explicitly published');
  });

  await t.test('18. DEFECT 2 Regression: simulated audit failure causes COMPLETE rollback of publication', async () => {
    const uniqueKey = 'test_audit_rollback_' + Date.now();
    const testDoc = await ComplianceService.createDoc({
      key: uniqueKey,
      title: 'Test Audit Rollback Dokument',
      description: 'Ověření transakčního rollbacku při chybě auditu',
      type: 'LEGAL',
      category: 'LEGAL',
    });

    const storeDoc = dbStore.complianceDocs.find(d => d.key === uniqueKey);
    assert.ok(storeDoc, 'Dokument musí existovat v store');
    const v1Before = storeDoc.versions?.find(v => v.version === '1.0.0');
    assert.ok(v1Before, 'v1.0.0 musí existovat');
    assert.strictEqual(v1Before.status, 'PUBLISHED');
    const v1OriginalContent = v1Before.content;

    // Create a clean 2.0.0 DRAFT candidate
    const v2Candidate = await ComplianceService.createVersion(uniqueKey, {
      version: '2.0.0',
      content: '# Čistý obsah 2.0.0 pro rollback test\nBez jakýchkoliv blockerů.',
      status: 'DRAFT',
    });
    const v2OriginalContent = v2Candidate.content;

    // Verify preflight passes
    const preflight = await ComplianceService.preflightPublication(v2Candidate.id);
    assert.strictEqual(preflight.canPublish, true, 'Preflight must pass before publication');

    const auditCountBefore = (dbStore.auditLogs || []).length;

    // Monkey-patch dbStore.logAudit to simulate failure during publication audit writing
    const originalLogAudit = dbStore.logAudit.bind(dbStore);
    (dbStore as any).logAudit = () => {
      throw new Error('SIMULATED_DB_AUDIT_TRANSACTION_FAILURE');
    };

    try {
      await assert.rejects(
        async () => {
          await ComplianceService.publishVersion(v2Candidate.id, {
            id: 'admin-test',
            email: 'admin@tatovacesta.cz',
            role: 'ADMIN',
            name: 'Admin',
          } as any);
        },
        /FAIL CLOSED.*rollback.*SIMULATED_DB_AUDIT_TRANSACTION_FAILURE/i,
        'Publication must fail closed and report rollback when audit write fails'
      );
    } finally {
      // Restore original logAudit
      (dbStore as any).logAudit = originalLogAudit;
    }

    // Verify COMPLETE ROLLBACK (Requirements 10, 11, 12, 13):
    // 11. Previous public version remains PUBLISHED
    const v1After = storeDoc.versions?.find(v => v.version === '1.0.0');
    assert.strictEqual(v1After?.status, 'PUBLISHED', 'Previous public version must remain PUBLISHED after rollback');
    assert.strictEqual(v1After?.content, v1OriginalContent, 'Previous public version content must remain unchanged');

    // 12. Candidate remains non-PUBLISHED after rollback (still DRAFT)
    const v2After = storeDoc.versions?.find(v => v.id === v2Candidate.id);
    assert.strictEqual(v2After?.status, 'DRAFT', 'Candidate version must remain DRAFT after rollback');
    assert.strictEqual(v2After?.content, v2OriginalContent, 'Candidate content must remain unchanged');

    // Root document state
    assert.strictEqual(storeDoc.version, '1.0.0', 'Document active version must remain 1.0.0');
    assert.strictEqual(storeDoc.status, 'PUBLISHED', 'Document status must remain PUBLISHED');

    // Public resolver check
    const publicDoc = await ComplianceService.getPublishedDoc(uniqueKey);
    assert.strictEqual(publicDoc?.version, '1.0.0', 'Public resolver must still return v1.0.0');

    // Audit logs count must be unchanged (no partial audit log leaked)
    const auditCountAfter = (dbStore.auditLogs || []).length;
    assert.strictEqual(auditCountAfter, auditCountBefore, 'No partial or orphaned audit log must be persisted on rollback');
  });
});
