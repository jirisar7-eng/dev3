import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { DeterministicJudgmentParser } from '../src/services/deterministicJudgmentParser';
import { JudgmentParserService, JudgmentParserError } from '../src/services/judgmentParserService';
import { ClientCaseService } from '../src/services/clientCaseService';

// Real-world Czech judgment text from Okresní soud v Pardubicích
const SAMPLE_PARDUBICE_JUDGMENT = `
ČESKÁ REPUBLIKA
ROZSUDEK
JMÉNEM REPUBLIKY

Okresní soud v Pardubicích rozhodl samosoudkyní JUDr. Janou Novákovou v právní věci
žalobce / otce: Jan Novák, nar. 15. 5. 1980, bytem Pardubice, Pernštýnské nám. 1
žalované / matky: Marie Nováková, nar. 20. 8. 1982, bytem Pardubice, Sladkovského 12
za účasti OSPOD Pardubice jako opatrovníka pro nezletilé dítě:
nezl. Jakub Novák, narozen 12. 03. 2018

o úpravu péče a výživy pro dobu po rozvodu

č. j. 14 Nc 25/2024-48

t a k t o :

I. Nezletilý Jakub Novák, nar. 12. 03. 2018, se svěřuje do střídavé péče obou rodičů v intervalu 7/7, a to tak, že otec bude o nezletilého pečovat v každém lichém týdnu v roce a matka v každém sudém týdnu v roce.

II. Předání nezletilého se uskuteční vždy v pondělí v 17:00 hodin v místě bydliště matky.

III. Otec je povinen přispívat na výživu nezletilého částkou ve výši 6 500 Kč měsíčně, splatnou vždy do každého 15. dne v měsíci předem k rukám matky, s účinností od 1. 9. 2024.

IV. Dlužné výživné za období od 1. 1. 2024 do 31. 8. 2024 ve výši 18 000 Kč je otec povinen uhradit ve lhátě do 31. 12. 2024.

V. Během letních prázdnin (červenec a srpen) platí zvláštní režim: otec pečuje v prvních 14 dnech v červenci a prvních 14 dnech v srpnu. Vánoční svátky: v sudých letech otec od 23. 12. do 26. 12., v lichých letech matka.

VI. Rodiče jsou povinni se vzájemně informovat o zdravotním stavu dítěte a školním prospěchu.

Pardubice dne 15. 08. 2024
JUDr. Jana Nováková v. r.
předsedkyně senátu
`;

describe('AI Extractor & Deterministic Fallback Pipeline Test Suite (20 Tests)', () => {

  // TEST 1: Court extraction
  test('1. Extracts correct court name deterministically', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_1', 'AI_TEXT');
    assert.strictEqual(res.court, 'Okresní soud v Pardubicích');
  });

  // TEST 2: Case number extraction
  test('2. Extracts correct case number (č. j.)', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_2', 'AI_TEXT');
    assert.strictEqual(res.caseNumber, '14 Nc 25/2024-48');
  });

  // TEST 3: Judgment date extraction
  test('3. Extracts correct judgment date in ISO format', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_3', 'AI_TEXT');
    assert.strictEqual(res.judgmentDate, '2024-08-15');
  });

  // TEST 4: Participants extraction
  test('4. Extracts father and mother as participants', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_4', 'AI_TEXT');
    assert.ok(res.participants.includes('Jan Novák'));
    assert.ok(res.participants.includes('Marie Nováková'));
  });

  // TEST 5: Child name extraction
  test('5. Extracts child name correctly without prefix nezl.', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_5', 'AI_TEXT');
    assert.strictEqual(res.childName, 'Jakub Novák');
  });

  // TEST 6: Child birth date extraction
  test('6. Extracts child birth date in ISO format', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_6', 'AI_TEXT');
    assert.strictEqual(res.childBirthDate, '2018-03-12');
  });

  // TEST 7: Custody type detection
  test('7. Classifies custody as SHARED (střídavá péče)', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_7', 'AI_TEXT');
    assert.strictEqual(res.custodyType, 'SHARED');
  });

  // TEST 8: Schedule type detection
  test('8. Recognizes schedule type as EVEN_ODD_WEEKS', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_8', 'AI_TEXT');
    assert.strictEqual(res.scheduleType, 'EVEN_ODD_WEEKS');
  });

  // TEST 9: Handover day & time extraction
  test('9. Extracts handover day (Pondělí) and time (17:00)', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_9', 'AI_TEXT');
    assert.strictEqual(res.handoverDay, 'Pondělí');
    assert.strictEqual(res.handoverTime, '17:00');
  });

  // TEST 10: Handover location extraction
  test('10. Extracts handover location', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_10', 'AI_TEXT');
    assert.ok(res.handoverLocation && res.handoverLocation.includes('místě bydliště matky'));
  });

  // TEST 11: Alimony monthly amount extraction
  test('11. Extracts monthly alimony amount as number (6500)', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_11', 'AI_TEXT');
    assert.strictEqual(res.alimonyAmount, 6500);
  });

  // TEST 12: Alimony due date extraction
  test('12. Extracts alimony due day (15. den)', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_12', 'AI_TEXT');
    assert.strictEqual(res.alimonyDueDate, 15);
  });

  // TEST 13: Alimony debt amount & period extraction
  test('13. Extracts alimony debt amount (18000) and debt due date (2024-12-31)', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_13', 'AI_TEXT');
    assert.strictEqual(res.alimonyDebtAmount, 18000);
    assert.strictEqual(res.alimonyDebtDueDate, '2024-12-31');
  });

  // TEST 14: Special rules extraction (vacation, holidays, info duty)
  test('14. Extracts summer, christmas, and information duties', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_14', 'AI_TEXT');
    assert.ok(res.summerRule);
    assert.ok(res.christmasRule);
    assert.ok(res.informationDuty);
  });

  // TEST 15: Provenance tagging (LOCAL_PDF source tags)
  test('15. Accurately assigns LOCAL_PDF provenance to extracted metadata fields', () => {
    const res = DeterministicJudgmentParser.parseText(SAMPLE_PARDUBICE_JUDGMENT, 'doc_15', 'AI_TEXT');
    assert.strictEqual(res.metadata?.fields.court.source, 'LOCAL_PDF');
    assert.strictEqual(res.metadata?.fields.caseNumber.source, 'LOCAL_PDF');
    assert.strictEqual(res.metadata?.fields.alimonyAmount.source, 'LOCAL_PDF');
    assert.strictEqual(res.metadata?.fields.court.status, 'VERIFIED');
    assert.ok((res.metadata?.fields.court.confidence || 0) >= 0.8);
  });

  // TEST 16: P0 FAIL-SAFE: ALL AI PROVIDERS DOWN -> LOCAL EXTRACTION AVAILABLE FOR USER CONFIRMATION
  test('16. [P0 FAIL-SAFE] All AI Providers down returns valid extraction with userNotice', async () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalGemini2 = process.env.GEMINI_API_KEY_2;
    const originalGroq = process.env.GROQ_API_KEY;
    const originalGrok = process.env.GROK_API_KEY;
    const originalXai = process.env.XAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.GROQ_API_KEY;
    delete process.env.GROK_API_KEY;
    delete process.env.XAI_API_KEY;

    try {
      const result = await JudgmentParserService.parseJudgmentFile(undefined, SAMPLE_PARDUBICE_JUDGMENT);
      assert.ok(result);
      assert.strictEqual(result.court, 'Okresní soud v Pardubicích');
      assert.strictEqual(result.caseNumber, '14 Nc 25/2024-48');
      assert.strictEqual(result.childName, 'Jakub Novák');
      assert.strictEqual(result.alimonyAmount, 6500);
      assert.strictEqual(result.custodyType, 'SHARED');
      assert.ok(result.userNotice);
    } finally {
      process.env.GEMINI_API_KEY = originalGemini;
      process.env.GEMINI_API_KEY_2 = originalGemini2;
      process.env.GROQ_API_KEY = originalGroq;
      process.env.GROK_API_KEY = originalGrok;
      process.env.XAI_API_KEY = originalXai;
    }
  });

  // TEST 17: Validates input rejection for empty document
  test('17. Rejects empty document with EMPTY_DOCUMENT error code', async () => {
    await assert.rejects(
      async () => {
        await JudgmentParserService.parseJudgmentFile(undefined, '   ');
      },
      (err: any) => {
        return err instanceof JudgmentParserError && err.code === 'EMPTY_DOCUMENT';
      }
    );
  });

  // TEST 18: Validates file size limit (25MB)
  test('18. Rejects files larger than 25MB with FILE_TOO_LARGE', async () => {
    const hugeBuffer = Buffer.alloc(26 * 1024 * 1024);
    const mockFile: Express.Multer.File = {
      buffer: hugeBuffer,
      originalname: 'huge_judgment.pdf',
      mimetype: 'application/pdf',
      size: 26 * 1024 * 1024,
      fieldname: 'document',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: null as any
    };

    await assert.rejects(
      async () => {
        await JudgmentParserService.parseJudgmentFile(mockFile);
      },
      (err: any) => {
        return err instanceof JudgmentParserError && err.code === 'FILE_TOO_LARGE';
      }
    );
  });

  // TEST 19: Strict validation gate in ClientCaseService
  test('19. ClientCaseService.validateExtractedJudgmentData catches invalid dates or negative numbers', () => {
    assert.throws(
      () => {
        ClientCaseService.validateExtractedJudgmentData({
          childBirthDate: '2099-01-01' // Future date
        });
      },
      { message: 'Datum narození dítěte nemůže být v budoucnosti.' }
    );

    assert.throws(
      () => {
        ClientCaseService.validateExtractedJudgmentData({
          alimonyAmount: -500 // Negative alimony
        });
      },
      { message: 'Výše výživného musí být kladné číslo nebo 0.' }
    );

    assert.throws(
      () => {
        ClientCaseService.validateExtractedJudgmentData({
          alimonyDueDate: 45 // Invalid day of month
        });
      },
      { message: 'Den splatnosti výživného musí být mezi 1. a 31. dnem v měsíci.' }
    );
  });

  // TEST 20: Valid judgment data passes strict validation gate
  test('20. Valid extracted judgment data passes strict validation gate successfully', () => {
    const validData = {
      caseNumber: '14 Nc 25/2024',
      court: 'Okresní soud v Pardubicích',
      childName: 'Jakub Novák',
      childBirthDate: '2018-03-12',
      handoverTime: '17:00',
      alimonyAmount: 6500,
      alimonyDueDate: 15,
      alimonyDebtAmount: 18000
    };

    assert.doesNotThrow(() => {
      ClientCaseService.validateExtractedJudgmentData(validData);
    });
  });

});
