import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ComplianceService } from '../src/services/complianceService.js';
import { getLegalDraft20Item, legalDrafts20Content } from '../src/data/legalDrafts20.js';

test('TMPR-20260910-LEGAL-023: Terms of Use 2.0 Deep Expansion Verification Suite', async (t) => {
  const termsMdPath = path.join(process.cwd(), 'docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md');

  await t.test('1. Terms of Use draft exists in SSOT and has required word count range (6,000 - 8,500 words)', () => {
    assert.ok(fs.existsSync(termsMdPath), 'Terms draft markdown must exist');
    const content = fs.readFileSync(termsMdPath, 'utf8');
    const wordCount = content.trim().split(/\s+/).length;
    assert.ok(
      wordCount >= 6000 && wordCount <= 8500,
      `Word count must be between 6,000 and 8,500 words. Actual: ${wordCount}`
    );
  });

  await t.test('2. Contains mandatory header metadata and Working Draft status', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /DOC-TMPR-TERMS-V2/);
    assert.match(content, /STATUS: WORKING DRAFT — NOT FOR PUBLICATION/);
    assert.match(content, /2\.0\.0-DRAFT/);
    assert.match(content, /v1\.0\.0/);
  });

  await t.test('3. Operator is strictly Jiří Šár as natural person; no fake association or fictitious IČO', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /Jiří Šár/);
    assert.match(content, /Fyzická osoba/i);
    assert.match(content, /PRODUCT INTENT — FUTURE/);
    assert.doesNotMatch(content, /zapsaný spolek Táta má právo, IČO:/i);
  });

  await t.test('4. Strict exclusion of legal services and attorney-client privilege', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /PROVOZOVATEL NENÍ ADVOKÁTEM/);
    assert.match(content, /zákona č\. 85\/1996 Sb\., o advokacii/i);
    assert.match(content, /nevzniká smlouva o poskytování právních služeb/i);
  });

  await t.test('5. CoParentHub features accurately reflected from implementation', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /CoParentSpace/);
    assert.match(content, /conflictMode/);
    assert.match(content, /COOPERATION/);
    assert.match(content, /PARALLEL/);
    assert.match(content, /HIGH_CONFLICT/);
    assert.match(content, /CoParentAuditLog/);
    assert.match(content, /OBSERVER/);
  });

  await t.test('6. Vault & Security features accurately reflected from implementation', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /MinIO/);
    assert.match(content, /50 MB/);
    assert.match(content, /ClamAV/);
    assert.match(content, /FAIL-CLOSED/);
    assert.match(content, /Passkeys/);
    assert.match(content, /FIDO2/);
    assert.match(content, /TOTP/);
    assert.match(content, /bcrypt/);
  });

  await t.test('7. AI & Orion features accurately reflected with EU AI Act disclosures', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /EU AI Act/);
    assert.match(content, /Orion AI/);
    assert.match(content, /agent-orion-qa-v1/);
    assert.match(content, /BIFF/);
    assert.match(content, /Judgment Parser/);
    assert.match(content, /halucinace modelů/);
    assert.match(content, /SPECIAL_CATEGORY_REGEX/);
    assert.match(content, /PRIVACY_BOUNDARY_BLOCKED/);
  });

  await t.test('8. GDPR export and deletion endpoints match actual routes in code', () => {
    const content = fs.readFileSync(termsMdPath, 'utf8');
    assert.match(content, /\/api\/gdpr\/export-data/);
    assert.match(content, /\/api\/gdpr\/deletion-request/);
  });

  await t.test('9. Generated TS artifact matches Markdown SSOT byte-for-byte for terms', () => {
    const mdContent = fs.readFileSync(termsMdPath, 'utf8');
    const tsTerms = getLegalDraft20Item('terms');
    assert.ok(tsTerms, 'Generated terms object must exist');
    assert.equal(tsTerms.content, mdContent, 'TypeScript generated content must match Markdown exactly');
  });

  await t.test('10. Fail-closed draft protection in ComplianceService blocks acceptance of 2.0.0-DRAFT', async () => {
    await assert.rejects(
      async () => {
        await ComplianceService.recordConsent('user-test-id', 'terms', '2.0.0-DRAFT', 'ACCEPTED');
      },
      /FAIL CLOSED/
    );
  });
});
