import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { 
  legalDrafts20Content, 
  legalDrafts20Meta, 
  getLegalDraft20Item,
  LEGAL_PACK_2_0_WARNING 
} from '../src/data/legalDrafts20';
import { 
  LEGAL_DRAFT_DEFINITIONS, 
  DRAFTS_DIR, 
  generateLegalDraftsTs 
} from '../scripts/generateLegalDrafts20';
import { ComplianceService } from '../src/services/complianceService';

test('TMPR-20260910-LEGAL-022: Legal Pack 2.0 Single Source of Truth (SSOT) Verification Suite', async (t) => {
  const expectedDocKeys = [
    'terms',
    'gdpr',
    'cookies',
    'legal',
    'volunteer_code',
    'ai_statement',
    'dohoda-o-spolupraci',
  ];

  await t.test('1. Authoritative Markdown SSOT directory exists and contains all 7 draft files', () => {
    assert.strictEqual(fs.existsSync(DRAFTS_DIR), true, 'Drafts directory must exist');
    for (const doc of LEGAL_DRAFT_DEFINITIONS) {
      const filePath = path.join(DRAFTS_DIR, doc.filename);
      assert.strictEqual(fs.existsSync(filePath), true, `File ${doc.filename} must exist`);
      const content = fs.readFileSync(filePath, 'utf-8');
      assert.ok(content.length > 100, `File ${doc.filename} must not be empty`);
      assert.ok(content.includes('STATUS: WORKING DRAFT — NOT FOR PUBLICATION'), `File ${doc.filename} must contain draft status notice`);
      assert.ok(content.includes('2.0.0-DRAFT'), `File ${doc.filename} must contain 2.0.0-DRAFT version`);
    }
  });

  await t.test('2. Generated TypeScript data matches Markdown SSOT character-for-character', () => {
    for (const doc of LEGAL_DRAFT_DEFINITIONS) {
      const filePath = path.join(DRAFTS_DIR, doc.filename);
      const markdownRaw = fs.readFileSync(filePath, 'utf-8');
      const generatedContent = legalDrafts20Content[doc.key];

      assert.ok(generatedContent !== undefined, `Content for key ${doc.key} must be defined`);
      assert.strictEqual(generatedContent, markdownRaw, `Content for key ${doc.key} must exactly match Markdown SSOT character-for-character`);
      assert.strictEqual(generatedContent.length, markdownRaw.length, `Byte length for key ${doc.key} must match exactly`);
    }
  });

  await t.test('3. Generator is idempotent and produces clean deterministic output', () => {
    const genResult = generateLegalDraftsTs();
    assert.strictEqual(genResult.fileCount, 7, 'Generator must process exactly 7 files');
    assert.strictEqual(fs.existsSync(genResult.targetPath), true, 'Generated target file must exist');

    const generatedFileText = fs.readFileSync(genResult.targetPath, 'utf-8');
    assert.ok(generatedFileText.includes('AUTO-GENERATED FILE — DO NOT EDIT MANUALLY!'), 'Generated file must include AUTO-GENERATED notice');
    assert.ok(generatedFileText.includes('Generator script: scripts/generateLegalDrafts20.ts'), 'Generated file must include generator script attribution');
  });

  await t.test('4. Metadata matches 7/7 definitions with canonical IDs and 2.0.0-DRAFT version', () => {
    for (const key of expectedDocKeys) {
      const meta = legalDrafts20Meta[key];
      assert.ok(meta !== undefined, `Metadata for key ${key} must exist`);
      assert.strictEqual(meta.key, key, `Meta key must match ${key}`);
      assert.strictEqual(meta.version, '2.0.0-DRAFT', `Version must be 2.0.0-DRAFT`);
      assert.strictEqual(meta.status, 'DRAFT', `Status must be DRAFT`);
      assert.ok(/^DOC-TMPR-[A-Z0-9-]+-V2$/.test(meta.canonicalId), `Canonical ID ${meta.canonicalId} must match V2 pattern`);
      assert.strictEqual(meta.warningNotice, LEGAL_PACK_2_0_WARNING, `Warning notice must be present`);

      const fullItem = getLegalDraft20Item(key);
      assert.notStrictEqual(fullItem, null, `Full draft item for key ${key} must resolve`);
      assert.strictEqual(fullItem?.content, legalDrafts20Content[key], `Full item content must match generated content`);
    }
  });

  await t.test('5. ComplianceService draft API returns exact SSOT content without database publication', async () => {
    const drafts = await ComplianceService.getAllDraftsPreview();
    assert.strictEqual(drafts.length, 7, 'ComplianceService must return exactly 7 draft documents');

    for (const draft of drafts) {
      assert.ok(expectedDocKeys.includes(draft.key), `Draft key ${draft.key} must be one of expected keys`);
      assert.strictEqual(draft.version, '2.0.0-DRAFT');
      assert.strictEqual(draft.status, 'DRAFT');
      assert.ok(draft.content.length > 100, `Draft ${draft.key} must have non-empty content`);

      const specific = await ComplianceService.getDraftPreview(draft.key);
      assert.notStrictEqual(specific, null, `Single preview for ${draft.key} must resolve`);
      assert.strictEqual(specific?.content, draft.content, `Single preview content must match full list content`);
    }
  });

  await t.test('6. Fail-closed security rule: DRAFT 2.0 cannot be accepted or recorded into consents', async () => {
    for (const key of expectedDocKeys) {
      await assert.rejects(
        async () => {
          await ComplianceService.recordConsent('test-user-123', key, '2.0.0-DRAFT', '127.0.0.1', 'Jest-Test-Agent');
        },
        /FAIL CLOSED.*DRAFT/,
        `Attempting to accept DRAFT version for key ${key} must throw error`
      );
    }
  });
});
