import { JudgmentParserService, JudgmentParserError } from '../services/judgmentParserService';
import { ClamAvService } from '../services/clamAvService';
import { AiService } from '../services/AiService';

async function runRegressionTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING JUDGMENT PARSER 12-POINT REGRESSION AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Preserve original methods and env
  const originalScanBuffer = ClamAvService.scanBuffer;
  const originalGenerateContent = AiService.generateContent;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalGeminiKey2 = process.env.GEMINI_API_KEY_2;
  const originalGroqKey = process.env.GROQ_API_KEY;
  const originalXaiKey = process.env.XAI_API_KEY;
  const originalGrokKey = process.env.GROK_API_KEY;

  // Mock ClamAV scanBuffer to simulate clean scan by default
  ClamAvService.scanBuffer = async () => ({ status: 'CLEAN', details: 'OK' });

  // Standard valid JSON response
  const sampleValidAiResponse = JSON.stringify({
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

  try {
    // ----------------------------------------------------
    // TEST 1: Valid PDF with text layer
    // ----------------------------------------------------
    console.log('▶ Test 1: Valid text-layer PDF parsing...');
    AiService.generateContent = async () => sampleValidAiResponse;
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

    const result1 = await JudgmentParserService.parseJudgmentFile(mockFile);
    if (result1 && (result1.childName === 'Tomáš Novák' || result1.childName === 'Tomas Novak') && result1.custodyType === 'SHARED') {
      console.log('  ✅ PASS: Valid PDF parsed successfully into structured judgment facts.');
      passed++;
    } else {
      console.error('  ❌ FAIL: Test 1 unexpected result:', result1);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 2: PDF without text layer (Scanned document OCR branch)
    // ----------------------------------------------------
    console.log('\n▶ Test 2: PDF without text layer (OCR delegation)...');
    const emptyLayerPdf = Buffer.from('%PDF-1.4\n1 0 obj << >> endobj\nxref\n0 1\n0000000000 65535 f \ntrailer << >>\nstartxref\n30\n%%EOF');
    const mockScannedFile: any = {
      originalname: 'skenovany_rozsudek.pdf',
      mimetype: 'application/pdf',
      buffer: emptyLayerPdf,
    };
    try {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY_2;
      await JudgmentParserService.parseJudgmentFile(mockScannedFile);
      console.error('  ❌ FAIL: Expected OCR_FAILED error for scanned PDF with unconfigured Vision.');
      failed++;
    } catch (err: any) {
      if (err.code === 'OCR_FAILED' || err.message.includes('OCR') || err.message.includes('GEMINI_API_KEY')) {
        console.log('  ✅ PASS: Correctly identified scanned PDF and handled OCR requirement:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for scanned PDF:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 3: Empty document (0 B)
    // ----------------------------------------------------
    console.log('\n▶ Test 3: Empty document (0 B)...');
    try {
      const mockEmptyFile: any = {
        originalname: 'prazdny.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(0),
      };
      await JudgmentParserService.parseJudgmentFile(mockEmptyFile);
      console.error('  ❌ FAIL: Empty file was not rejected.');
      failed++;
    } catch (err: any) {
      if (err.code === 'EMPTY_DOCUMENT' || err.message.includes('prázdný')) {
        console.log('  ✅ PASS: Correctly rejected 0 B document:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for empty file:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 4: File too large (> 25MB)
    // ----------------------------------------------------
    console.log('\n▶ Test 4: File too large (> 25MB)...');
    try {
      const mockLargeFile: any = {
        originalname: 'obri_spis.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.alloc(26 * 1024 * 1024), // 26MB
      };
      await JudgmentParserService.parseJudgmentFile(mockLargeFile);
      console.error('  ❌ FAIL: Oversized file was not rejected.');
      failed++;
    } catch (err: any) {
      if (err.code === 'FILE_TOO_LARGE' || err.message.includes('25 MB')) {
        console.log('  ✅ PASS: Correctly rejected oversized file:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for oversized file:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 5: Corrupt PDF / Unsupported format
    // ----------------------------------------------------
    console.log('\n▶ Test 5: Corrupt PDF / Unsupported file...');
    try {
      const mockCorruptFile: any = {
        originalname: 'corrupt.xyz',
        mimetype: 'application/x-unknown-binary',
        buffer: Buffer.from([0x00, 0xFF, 0xFE, 0x12, 0x34]),
      };
      await JudgmentParserService.parseJudgmentFile(mockCorruptFile);
      console.error('  ❌ FAIL: Corrupt file was not rejected.');
      failed++;
    } catch (err: any) {
      if (err.code === 'INVALID_FILE' || err.message.includes('Nepodporovaný formát')) {
        console.log('  ✅ PASS: Correctly rejected unsupported/corrupt format:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for corrupt file:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 6: AI Timeout
    // ----------------------------------------------------
    console.log('\n▶ Test 6: AI Timeout handling...');
    try {
      AiService.generateContent = async () => {
        throw new Error('AI_TIMEOUT: Zpracování dokumentu překročilo časový limit.');
      };
      const res = await JudgmentParserService.parseJudgmentFile(undefined, 'Rozsudek sp. zn. 12 P 45/2024 o svěření nezletilého do péče.');
      if (res.aiEnrichmentFailed && (res.aiDiagnosticCode === 'AI_TIMEOUT' || res.userNotice?.includes('dostupná'))) {
        console.log('  ✅ PASS: AI timeout correctly caught and returned fail-safe result with code:', res.aiDiagnosticCode);
        passed++;
      } else {
        console.error('  ❌ FAIL: AI timeout did not set aiEnrichmentFailed flag correctly.');
        failed++;
      }
    } catch (err: any) {
      if (err.code === 'AI_TIMEOUT' || err.message.includes('trvala příliš dlouho') || err.message.includes('AI_TIMEOUT')) {
        console.log('  ✅ PASS: AI timeout correctly surfaced as structured error:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for AI timeout:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 7: AI Provider HTTP / Rate Limit error
    // ----------------------------------------------------
    console.log('\n▶ Test 7: AI Rate limit / Quota exhausted handling...');
    try {
      AiService.generateContent = async () => {
        throw new Error('AI_RATE_LIMIT: Poskytovatelé AI hlásí překročení kvóty nebo limitu požadavků.');
      };
      const res = await JudgmentParserService.parseJudgmentFile(undefined, 'Rozsudek sp. zn. 12 P 45/2024 o svěření nezletilého do péče.');
      if (res.aiEnrichmentFailed && (res.aiDiagnosticCode === 'AI_RATE_LIMIT' || res.userNotice?.includes('dostupná'))) {
        console.log('  ✅ PASS: AI rate limit caught and returned fail-safe result with code:', res.aiDiagnosticCode);
        passed++;
      } else {
        console.error('  ❌ FAIL: AI rate limit did not set aiEnrichmentFailed flag correctly.');
        failed++;
      }
    } catch (err: any) {
      if (err.code === 'AI_RATE_LIMIT' || err.message.includes('limit') || err.message.includes('kvót')) {
        console.log('  ✅ PASS: AI rate limit caught and converted to friendly Czech error:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for rate limit:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 8: Missing API configuration
    // ----------------------------------------------------
    console.log('\n▶ Test 8: Missing AI API configuration...');
    try {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY_2;
      delete process.env.GROQ_API_KEY;
      delete process.env.XAI_API_KEY;
      delete process.env.GROK_API_KEY;
      AiService.generateContent = async () => {
        throw new Error('AI_AUTH_ERROR: Žádný AI poskytovatel není nakonfigurován (chybí GEMINI_API_KEY, XAI_API_KEY i GROQ_API_KEY).');
      };
      const res = await JudgmentParserService.parseJudgmentFile(undefined, 'Rozsudek sp. zn. 12 P 45/2024 o svěření nezletilého do péče.');
      if (res && res.userNotice && (res.userNotice.includes('lokálním') || res.aiDiagnosticCode === 'AI_AUTH_ERROR')) {
        console.log('  ✅ PASS: Missing AI API configuration returned fail-safe result with notice:', res.userNotice);
        passed++;
      } else {
        console.error('  ❌ FAIL: Missing API config did not return expected fail-safe notice:', res);
        failed++;
      }
    } catch (err: any) {
      if (err.code === 'AI_AUTH_ERROR' || err.message.includes('nakonfigurována') || err.message.includes('API')) {
        console.log('  ✅ PASS: Missing AI API configuration handled with clear diagnostic:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for missing API config:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 9: Invalid AI JSON response
    // ----------------------------------------------------
    console.log('\n▶ Test 9: Invalid AI JSON response...');
    try {
      process.env.GEMINI_API_KEY = 'mock_key_for_test';
      AiService.generateContent = async () => {
        return 'Omlouvám se, ale jako AI model nemohu splnit tento požadavek. { neplatný json';
      };
      const res = await JudgmentParserService.parseJudgmentFile(undefined, 'Rozsudek sp. zn. 12 P 45/2024 o svěření nezletilého do péče.');
      if (res.aiEnrichmentFailed && (res.aiDiagnosticCode === 'AI_INVALID_RESPONSE' || res.aiDiagnosticCode === 'AI_PROVIDER_ERROR' || res.userNotice?.includes('dostupná'))) {
        console.log('  ✅ PASS: Invalid JSON response returned fail-safe result with code:', res.aiDiagnosticCode);
        passed++;
      } else {
        console.error('  ❌ FAIL: Invalid JSON did not set aiEnrichmentFailed flag correctly.');
        failed++;
      }
    } catch (err: any) {
      if (err.code === 'AI_INVALID_RESPONSE' || err.message.includes('JSON')) {
        console.log('  ✅ PASS: Invalid JSON response rejected cleanly:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected error for invalid JSON:', err.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 10: Multi-provider AI Fallback
    // ----------------------------------------------------
    console.log('\n▶ Test 10: Multi-provider AI Fallback verification...');
    AiService.generateContent = originalGenerateContent;
    process.env.GEMINI_API_KEY = 'invalid_primary_mock_key';
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.GROQ_API_KEY;
    delete process.env.XAI_API_KEY;
    delete process.env.GROK_API_KEY;

    try {
      await AiService.generateContent('Test prompt');
      console.error('  ❌ FAIL: Expected fallback failure on invalid keys.');
      failed++;
    } catch (fallbackErr: any) {
      if (fallbackErr.message.includes('AI_PROVIDER_ERROR') || fallbackErr.message.includes('Gemini Primary') || fallbackErr.message.includes('failed')) {
        console.log('  ✅ PASS: Multi-provider fallback tracked provider failure cascade:', fallbackErr.message.slice(0, 90) + '...');
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected fallback error:', fallbackErr.message);
        failed++;
      }
    }

    // ----------------------------------------------------
    // TEST 11: Valid structured output validation & normalization
    // ----------------------------------------------------
    console.log('\n▶ Test 11: Structured output validation & normalization...');
    const rawAiOutputWithFences = '```json\n' + JSON.stringify({
      caseNumber: { value: "15 P 120/2025", confidence: 0.99, status: "VERIFIED", sourceText: "15 P 120/2025" },
      alimonyAmount: { value: "4 500,00 Kč", confidence: 0.95, status: "VERIFIED", sourceText: "4 500 Kč" },
      alimonyDueDate: { value: "15", confidence: 0.9, status: "VERIFIED" },
      custodyType: { value: "SHARED", confidence: 0.9 }
    }) + '\n```';

    const parsedNormalized = JudgmentParserService.parseResponse(rawAiOutputWithFences, 'test_doc_11', 'AI_TEXT');
    if (
      parsedNormalized.caseNumber === '15 P 120/2025' &&
      parsedNormalized.alimonyAmount === 4500 &&
      parsedNormalized.alimonyDueDate === 15 &&
      parsedNormalized.metadata?.totalFound! >= 3
    ) {
      console.log('  ✅ PASS: Normalized amount (4 500 Kč -> 4500), due date (string "15" -> 15) and markdown fences.');
      passed++;
    } else {
      console.error('  ❌ FAIL: Normalization test failed:', parsedNormalized);
      failed++;
    }

    // ----------------------------------------------------
    // TEST 12: Missing fields / Incomplete output handling
    // ----------------------------------------------------
    console.log('\n▶ Test 12: Missing fields / Incomplete output handling...');
    const partialAiOutput = JSON.stringify({
      caseNumber: { value: "8 P 10/2023", confidence: 0.9, status: "VERIFIED" },
      childName: { value: null, confidence: 0.0, status: "NOT_FOUND" }
    });

    const parsedPartial = JudgmentParserService.parseResponse(partialAiOutput, 'test_doc_12', 'AI_TEXT');
    if (
      parsedPartial.caseNumber === '8 P 10/2023' &&
      parsedPartial.childName === null &&
      parsedPartial.metadata?.notFoundCount! > 10
    ) {
      console.log(`  ✅ PASS: Handled partial data gracefully (${parsedPartial.metadata?.notFoundCount} fields flagged as NOT_FOUND).`);
      passed++;
    } else {
      console.error('  ❌ FAIL: Partial data parsing unexpected result:', parsedPartial);
      failed++;
    }

    // ----------------------------------------------------
    // BONUS TEST 13: Antivirus gatekeeper verification
    // ----------------------------------------------------
    console.log('\n▶ Test 13: Antivirus security gatekeeper check...');
    ClamAvService.scanBuffer = async () => {
      throw new Error('Eicar-Test-Signature FOUND');
    };

    const mockInfectedFile: any = {
      originalname: 'infected_judgment.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 infected content'),
    };

    try {
      await JudgmentParserService.parseJudgmentFile(mockInfectedFile);
      console.error('  ❌ FAIL: Infected file was not rejected.');
      failed++;
    } catch (err: any) {
      if (err.message.includes('Antivirová kontrola (ClamAV) zamítla')) {
        console.log('  ✅ PASS: ClamAV rejection enforced properly:', err.message);
        passed++;
      } else {
        console.error('  ❌ FAIL: Unexpected rejection message:', err.message);
        failed++;
      }
    }

  } finally {
    // Restore original methods and env
    ClamAvService.scanBuffer = originalScanBuffer;
    AiService.generateContent = originalGenerateContent;
    process.env.GEMINI_API_KEY = originalGeminiKey;
    process.env.GEMINI_API_KEY_2 = originalGeminiKey2;
    process.env.GROQ_API_KEY = originalGroqKey;
    process.env.XAI_API_KEY = originalXaiKey;
    process.env.GROK_API_KEY = originalGrokKey;
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
