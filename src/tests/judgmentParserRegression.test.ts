import { JudgmentParserService } from '../services/judgmentParserService';
import { ClamAvService } from '../services/clamAvService';
import { AiService } from '../services/AiService';

async function runRegressionTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING JUDGMENT PARSER REGRESSION AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Mock ClamAV scanBuffer to simulate clean scan during unit test
  const originalScanBuffer = ClamAvService.scanBuffer;
  ClamAvService.scanBuffer = async () => ({ status: 'CLEAN', details: 'OK' });

  // Mock AiService.generateContent to return deterministic JSON
  const originalGenerateContent = AiService.generateContent;
  AiService.generateContent = async (prompt: string) => {
    return JSON.stringify({
      caseNumber: { value: "12 P 45/2024", confidence: 0.95, status: "VERIFIED", sourceText: "sp. zn. 12 P 45/2024" },
      court: { value: "Okresní soud v Olomouci", confidence: 0.92, status: "VERIFIED", sourceText: "Okresní soud v Olomouci" },
      judgmentDate: { value: "2024-05-15", confidence: 0.9, status: "VERIFIED", sourceText: "dne 15. května 2024" },
      effectiveDate: { value: "2024-06-01", confidence: 0.85, status: "VERIFIED", sourceText: "od 1. 6. 2024" },
      participants: { value: ["Jan Novák", "Marie Nováková"], confidence: 0.95, status: "VERIFIED", sourceText: "Jan Novák a Marie Nováková" },
      childName: { value: "Tomáš Novák", confidence: 0.98, status: "VERIFIED", sourceText: "nezl. Tomáš Novák" },
      childBirthDate: { value: "2018-09-12", confidence: 0.95, status: "VERIFIED", sourceText: "nar. 12. 9. 2018" },
      custodyType: { value: "SHARED", confidence: 0.95, status: "VERIFIED", sourceText: "svěřuje do střídavé péče" },
      scheduleType: { value: "EVEN_ODD_WEEKS", confidence: 0.9, status: "VERIFIED", sourceText: "v sudém týdnu otec, v lichém matka" },
      evenWeek: { value: { days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], summary: "Pondělí 8:00 - Pondělí 8:00" }, confidence: 0.9, status: "VERIFIED" },
      oddWeek: { value: { days: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"], summary: "Pondělí 8:00 - Pondělí 8:00" }, confidence: 0.9, status: "VERIFIED" },
      handoverDay: { value: "MON", confidence: 0.88, status: "VERIFIED", sourceText: "každé pondělí v 8:00" },
      handoverTime: { value: "08:00", confidence: 0.88, status: "VERIFIED", sourceText: "v 8:00 hodin" },
      handoverLocation: { value: "MŠ / bydliště", confidence: 0.85, status: "VERIFIED", sourceText: "předáním ve škole" },
      holidaysRule: { value: "Střídavě po roce", confidence: 0.85, status: "VERIFIED" },
      christmasRule: { value: "Štědrý den otec liché roky, matka sudé", confidence: 0.9, status: "VERIFIED" },
      easterRule: { value: "Velikonoce střídavě", confidence: 0.85, status: "VERIFIED" },
      summerRule: { value: "14 dní v červenci, 14 dní v srpnu", confidence: 0.9, status: "VERIFIED" },
      alimonyAmount: { value: 3500, confidence: 0.95, status: "VERIFIED", sourceText: "výživné ve výši 3 500 Kč měsíčně" },
      alimonyDueDate: { value: 15, confidence: 0.9, status: "VERIFIED", sourceText: "vždy do 15. dne v měsíci" },
      alimonyPaymentMethod: { value: "BANK_TRANSFER", confidence: 0.85, status: "VERIFIED" },
      otherDuties: { value: "Hradit mimořádné výdaje na kroužky rovným dílem", confidence: 0.85, status: "VERIFIED" }
    });
  };

  // TEST 1: Valid text PDF parsing
  try {
    console.log('▶ Test 1: Valid text-layer PDF parsing...');
    const validPdfBuffer = Buffer.from(
      '%PDF-1.4\n' +
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
      '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
      '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n' +
      '4 0 obj << /Length 85 >> stream\n' +
      'BT /F1 12 Tf 100 700 Td (Rozsudek Jmenem Republiky: Nezl. Tomas Novak se sveruje do stridave pece rodicu.) Tj ET\n' +
      'endstream\n' +
      'endobj\n' +
      '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n' +
      'xref\n' +
      '0 6\n' +
      '0000000000 65535 f \n' +
      '0000000009 00000 n \n' +
      '0000000058 00000 n \n' +
      '0000000115 00000 n \n' +
      '0000000234 00000 n \n' +
      '0000000369 00000 n \n' +
      'trailer << /Size 6 /Root 1 0 R >>\n' +
      'startxref\n' +
      '449\n' +
      '%%EOF'
    );

    const mockFile: any = {
      originalname: 'rozsudek_12P45_2024.pdf',
      mimetype: 'application/pdf',
      buffer: validPdfBuffer,
    };

    const result = await JudgmentParserService.parseJudgmentFile(mockFile);

    if (result && result.childName === 'Tomáš Novák' && result.custodyType === 'SHARED') {
      console.log('  ✅ PASS: Valid PDF successfully parsed without "text nelze přečíst" error.');
      console.log(`  Extracted case: ${result.caseNumber}, child: ${result.childName}, custody: ${result.custodyType}`);
      passed++;
    } else {
      console.error('  ❌ FAIL: Result missing expected extracted fields:', result);
      failed++;
    }
  } catch (err: any) {
    console.error('  ❌ FAIL: Test 1 threw unexpected error:', err.message);
    failed++;
  }

  // TEST 2: Plain text input parsing
  try {
    console.log('\n▶ Test 2: Plain text input parsing...');
    const rawText = 'Rozsudek Okresního soudu v Olomouci č.j. 12 P 45/2024. Nezl. Tomáš Novák, nar. 12. 9. 2018, se svěřuje do střídavé péče obou rodičů v týdenních cyklech.';
    const result = await JudgmentParserService.parseJudgmentFile(undefined, rawText);

    if (result && result.caseNumber === '12 P 45/2024') {
      console.log('  ✅ PASS: Plain text input parsed successfully.');
      passed++;
    } else {
      console.error('  ❌ FAIL: Plain text parsing returned unexpected result:', result);
      failed++;
    }
  } catch (err: any) {
    console.error('  ❌ FAIL: Test 2 threw unexpected error:', err.message);
    failed++;
  }

  // TEST 3: Short / Empty input validation
  try {
    console.log('\n▶ Test 3: Short input rejection check...');
    let threw = false;
    try {
      await JudgmentParserService.parseJudgmentFile(undefined, 'kratky text');
    } catch (err: any) {
      threw = true;
      if (err.message.includes('příliš krátký')) {
        console.log('  ✅ PASS: Correctly rejected text shorter than 30 characters with helpful message:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error message:', err.message);
        failed++;
      }
    }
    if (!threw) {
      console.error('  ❌ FAIL: Did not throw on short input.');
      failed++;
    }
  } catch (err: any) {
    console.error('  ❌ FAIL: Test 3 error:', err.message);
    failed++;
  }

  // TEST 4: Antivirus Scan Interception
  try {
    console.log('\n▶ Test 4: Antivirus security gatekeeper check...');
    ClamAvService.scanBuffer = async () => {
      throw new Error('Eicar-Test-Signature FOUND');
    };

    const mockInfectedFile: any = {
      originalname: 'infected_judgment.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 infected content'),
    };

    let rejected = false;
    try {
      await JudgmentParserService.parseJudgmentFile(mockInfectedFile);
    } catch (err: any) {
      rejected = true;
      if (err.message.includes('Antivirová kontrola (ClamAV) zamítla')) {
        console.log('  ✅ PASS: ClamAV rejection enforced properly:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected rejection message:', err.message);
        failed++;
      }
    }

    if (!rejected) {
      console.error('  ❌ FAIL: Infected file was not rejected.');
      failed++;
    }
  } catch (err: any) {
    console.error('  ❌ FAIL: Test 4 error:', err.message);
    failed++;
  } finally {
    // Restore original methods
    ClamAvService.scanBuffer = originalScanBuffer;
    AiService.generateContent = originalGenerateContent;
  }

  console.log('\n====================================================');
  console.log(`📊 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
