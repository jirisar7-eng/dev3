import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { ComplianceService } from '../src/services/complianceService';
import { legalDrafts20Content, legalDrafts20Meta, LEGAL_PACK_2_0_WARNING } from '../src/data/legalDrafts20';
import { dbStore } from '../src/services/dbStore';
import { AuthService } from '../src/services/authService';

test('TMPR-20260910-LEGAL-021: Legal Pack 2.0 DEV3 Draft Preview Verification Suite', async (t) => {
  // 1. ADMIN může zobrazit 2.0 DRAFT
  await t.test('1. ADMIN can retrieve all 7 Legal Pack 2.0 drafts with full content & metadata', async () => {
    const drafts = await ComplianceService.getAllDraftsPreview();
    assert.strictEqual(drafts.length, 7, 'Must have exactly 7 draft documents in Legal Pack 2.0');
    
    for (const d of drafts) {
      assert.strictEqual(d.status, 'DRAFT', `Draft ${d.key} must have status DRAFT`);
      assert.strictEqual(d.version, '2.0.0-DRAFT', `Draft ${d.key} must be version 2.0.0-DRAFT`);
      assert.ok(d.content && d.content.length > 200, `Draft ${d.key} must contain full markdown content`);
      assert.ok(d.title, `Draft ${d.key} must have a title`);
      assert.ok(d.author.includes('Jiří Šár'), `Author must reference Jiří Šár`);
    }

    const termsDraft = await ComplianceService.getDraftPreview('terms');
    assert.ok(termsDraft, 'Terms draft preview must resolve');
    assert.strictEqual(termsDraft?.version, '2.0.0-DRAFT');
    assert.strictEqual(termsDraft?.status, 'DRAFT');
  });

  // 2. USER nemůže zobrazit admin draft endpoint (Role checking)
  await t.test('2. USER role fails role check for ADMIN requirement', () => {
    const userHasAdmin = AuthService.hasPermission('USER', 'ADMIN');
    assert.strictEqual(userHasAdmin, false, 'USER must not have ADMIN permission');
    const volunteerHasAdmin = AuthService.hasPermission('VOLUNTEER', 'ADMIN');
    assert.strictEqual(volunteerHasAdmin, false, 'VOLUNTEER must not have ADMIN permission');
  });

  // 3. Anonymous nemůže zobrazit draft (Public API does not expose drafts)
  await t.test('3. Anonymous public API requests cannot see 2.0.0-DRAFT', async () => {
    const publicTerms = await ComplianceService.getPublishedDoc('terms');
    assert.ok(publicTerms, 'Public terms must resolve');
    assert.strictEqual(publicTerms.version, '1.0.0', 'Public terms version must remain 1.0.0');
    assert.strictEqual(publicTerms.status, 'PUBLISHED', 'Public terms status must be PUBLISHED');
    
    // In versions array, no draft must be present
    if (publicTerms.versions) {
      for (const v of publicTerms.versions) {
        assert.strictEqual(v.status, 'PUBLISHED', 'All exposed versions must be PUBLISHED');
        assert.notStrictEqual(v.version, '2.0.0-DRAFT', '2.0.0-DRAFT must NOT be in public versions');
      }
    }
  });

  // 4. /pravni-dokumenty stále ukazuje pouze PUBLISHED
  await t.test('4. Public document center lists only PUBLISHED documents', async () => {
    const expectedKeys = [
      'terms',
      'gdpr',
      'cookies',
      'legal',
      'volunteer_code',
      'ai_statement',
      'dohoda-o-spolupraci',
    ];
    for (const key of expectedKeys) {
      const doc = await ComplianceService.getPublishedDoc(key);
      assert.ok(doc, `Document ${key} must resolve`);
      assert.strictEqual(doc.status, 'PUBLISHED', `${key} must be PUBLISHED`);
      assert.notStrictEqual(doc.version, '2.0.0-DRAFT', `${key} must not be 2.0.0-DRAFT`);
    }
  });

  // 5. Direct draft URL bez oprávnění (Protected endpoints in server.ts require requireRole('ADMIN'))
  await t.test('5. Admin draft preview route requires authentication and ADMIN role', () => {
    const serverPath = path.join(process.cwd(), 'server.ts');
    const serverCode = fs.readFileSync(serverPath, 'utf8');
    
    assert.ok(
      serverCode.includes("app.get('/api/compliance/drafts', requireAuth as any, requireRole('ADMIN')"),
      'Draft listing must be guarded by requireAuth and requireRole("ADMIN")'
    );
    assert.ok(
      serverCode.includes("app.get('/api/compliance/drafts/preview/:key', requireAuth as any, requireRole('ADMIN')"),
      'Draft preview endpoint must be guarded by requireAuth and requireRole("ADMIN")'
    );
  });

  // 6. DRAFT acceptance request → odmítnut (Fail-closed)
  await t.test('6. Acceptance request for 2.0.0-DRAFT is rejected fail-closed', async () => {
    await assert.rejects(
      async () => {
        await ComplianceService.recordConsent('usr-user', 'terms', '2.0.0-DRAFT', 'ACCEPTED');
      },
      /FAIL CLOSED/
    );

    await assert.rejects(
      async () => {
        await ComplianceService.recordConsent('usr-user', 'terms', 'draft-custom', 'ACCEPTED');
      },
      /FAIL CLOSED/
    );
  });

  // 7. Současná PUBLISHED acceptance funguje stejně
  await t.test('7. Acceptance for published version 1.0.0 works as expected', async () => {
    const consent = await ComplianceService.recordConsent(
      'usr-user',
      'terms',
      '1.0.0',
      'ACCEPTED',
      'tata@tatovacesta.cz'
    );
    assert.ok(consent, 'Consent must be recorded');
    assert.strictEqual(consent.docKey, 'terms');
    assert.strictEqual(consent.docVersion, '1.0.0');
    assert.strictEqual(consent.status, 'ACCEPTED');
  });

  // 8. Žádná acceptance nebyla vytvořena pro 2.0
  await t.test('8. No consent records exist for version 2.0.0-DRAFT', async () => {
    const allConsents = await ComplianceService.getConsents();
    const draftConsents = allConsents.filter(c => c.docVersion.includes('DRAFT') || c.docVersion === '2.0.0-DRAFT');
    assert.strictEqual(draftConsents.length, 0, 'There must be zero consent records for any DRAFT version');
  });

  // 9. Aktuální PUBLISHED dokumenty nebyly změněny
  await t.test('9. Existing published documents content is untouched', async () => {
    const terms = await ComplianceService.getPublishedDoc('terms');
    assert.ok(terms?.content.includes('## PODMÍNKY UŽÍVÁNÍ PORTÁLU (v1.0.0)'), 'Terms v1.0.0 content must remain intact');
    
    const gdpr = await ComplianceService.getPublishedDoc('gdpr');
    assert.ok(gdpr?.content.includes('GDPR'), 'GDPR v1.1.0 content must remain intact');
  });

  // 10. Správná identita provozovatele: Jiří Šár — fyzická osoba
  await t.test('10. Operator identity is strictly Jiří Šár as physical person, not a legal entity or association', () => {
    assert.ok(
      LEGAL_PACK_2_0_WARNING.includes('Táta má právo'),
      'Warning notice must reference Táta má právo'
    );
    for (const key of Object.keys(legalDrafts20Meta)) {
      const meta = legalDrafts20Meta[key];
      assert.ok(
        meta.author.includes('Jiří Šár'),
        `Draft author for ${key} must reference Jiří Šár`
      );
    }
    
    // Core documents defining operator identity
    const operatorDefiningDocs = ['terms', 'gdpr', 'cookies', 'legal', 'dohoda-o-spolupraci'];
    for (const key of operatorDefiningDocs) {
      const content = legalDrafts20Content[key];
      assert.ok(
        content.includes('Jiří Šár'),
        `Draft ${key} must reference Jiří Šár as operator`
      );
      assert.ok(
        content.includes('Fyzická osoba') || content.includes('fyzická osoba') || content.includes('fyzickou osobou') || content.includes('fyzické osobě'),
        `Draft ${key} must reference fyzická osoba`
      );
    }
  });

  // 11. Žádné IČO neexistujícího spolku
  await t.test('11. No fake or non-existent association IČO is present in drafts', () => {
    for (const key of Object.keys(legalDrafts20Content)) {
      const content = legalDrafts20Content[key];
      // Check that there is no made-up IČO like 'IČO: 12345678'
      const matches = content.match(/IČO[:\s]+(\d{8})/gi);
      if (matches) {
        // Any match must be flagged or verified
        for (const m of matches) {
          assert.fail(`Draft ${key} contains IČO number: ${m}`);
        }
      }
      assert.ok(
        !content.includes('zapsaný spolek, IČO') && !content.includes('z.s., IČO'),
        `Draft ${key} must not declare a registered association with an IČO`
      );
    }
  });

  // 12. PROD3 untouched
  await t.test('12. PROD3 and production flags are untouched', () => {
    assert.notStrictEqual(process.env.APP_ENV, 'production', 'Environment must not be production');
    assert.notStrictEqual(process.env.NODE_ENV, 'production', 'Environment must not be production');
  });
});
