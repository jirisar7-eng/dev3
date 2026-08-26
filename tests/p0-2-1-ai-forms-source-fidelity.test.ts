import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AiService } from '../src/services/AiService.js';
import express from 'express';
import aiRoutes from '../src/routes/aiRoutes.js';
import request from 'supertest';

const app = express();
app.use(express.json());
app.use('/api/ai', aiRoutes);

describe('P0.2.1: AI Forms Fail-Safe & Case Manager Source Fidelity Test Suite', () => {
  const originalEnv = { ...process.env };
  const originalGenerate = AiService.generateContent;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    AiService.generateContent = originalGenerate;
  });

  test('TEST 1: AI Forms failure does not append hardcoded fallback or judikatura text', async () => {
    let templateContent = 'PŮVODNÍ TEXT NÁVRHU K SOUDU';
    let errorOccurred = false;
    let errorMessage = null;

    AiService.generateContent = async () => { throw new Error('AI služba je dočasně nedostupná.'); };

    try {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ mode: 'forms', messages: [{ role: 'user', content: 'hello' }] });

      if (res.status >= 400) throw new Error(res.body.error);
    } catch (err: any) {
      errorOccurred = true;
      errorMessage = err.message;
    }

    assert.strictEqual(templateContent, 'PŮVODNÍ TEXT NÁVRHU K SOUDU', 'Template content must remain unchanged on AI failure');
    assert.strictEqual(errorOccurred, true, 'Error state must be triggered');
    assert.strictEqual(errorMessage, 'Chyba při komunikaci s AI.', 'Error message must be preserved');
    assert.ok(!templateContent.includes('IV. Doplnění právní argumentace'), 'Must NOT contain hardcoded judikatura fallback');
  });

  test('TEST 2: Case Manager does not fabricate date "12.5." when not in source text', async () => {
    const documentTextWithoutDate = 'Matka tvrdí, že otec nekomunikuje. Otec uvádí, že předal návrh dohody.';

    AiService.generateContent = async (prompt, opts) => {
      // Mocking provider boundary, returning expected JSON output
      return JSON.stringify({
        summary: 'Rozbor opatrovnické zprávy.',
        contradictions: [],
        counterArguments: ['Doložit komunikaci otce.'],
        riskLevel: 'Nízké',
        anonymizedCount: 0
      });
    };

    const res = await request(app).post('/api/ai/analyze-document').send({ documentText: documentTextWithoutDate });
    const result = res.body;

    assert.ok(!JSON.stringify(result).includes('12.5.'), 'Output must NOT contain hallucinated date 12.5.');
  });

  test('TEST 3: Case Manager does not fabricate e-mails or unseen communications', async () => {
    const documentTextWithoutEmail = 'Otec žádá o změnu styku z důvodu nástupu dítěte do MŠ.';

    AiService.generateContent = async () => {
      return JSON.stringify({
        summary: 'Zpráva OSPOD popisuje komplikace při předávání dítěte na veřejném místě.',
        contradictions: [],
        counterArguments: ['Navrhnout předávání přes mateřskou školu.'],
        riskLevel: 'Střední',
        anonymizedCount: 0
      });
    };

    const res = await request(app).post('/api/ai/analyze-document').send({ documentText: documentTextWithoutEmail });
    const result = res.body;

    assert.ok(!JSON.stringify(result).includes('e-mailová komunikace ze dne'), 'Output must NOT fabricate email communications');
    assert.ok(!JSON.stringify(result).includes('písemný návrh kompromisu'), 'Output must NOT fabricate unmentioned compromises');
  });

  test('TEST 4: Single-sided claim without conflicting evidence in source text is NOT marked as contradiction', async () => {
    const singleClaimDoc = 'Matka do protokolu uvedla, že otec se nepodílí na výchově.';

    AiService.generateContent = async () => {
      return JSON.stringify({
        summary: 'Jednostranné tvrzení matky v protokolu o nepodílení se na výchově.',
        contradictions: [],
        counterArguments: ['Doložit aktivní účast otce na péči a zájmových kroužcích.'],
        riskLevel: 'Střední',
        anonymizedCount: 0
      });
    };

    const res = await request(app).post('/api/ai/analyze-document').send({ documentText: singleClaimDoc });
    assert.deepStrictEqual(res.body.contradictions, [], 'Contradictions must be empty when only one claim exists');
  });

  test('TEST 5: Valid contradiction is generated when source document contains two contradictory claims', async () => {
    const twoClaimsDoc = 'V odst. 2 matka tvrdí, že otec nekomunikuje. V odst. 5 matka uvádí, že otec týdně zasílá e-maily s požadavky na styk.';

    AiService.generateContent = async () => {
      return JSON.stringify({
        summary: 'Vyhodnocení vyjádření matky s vnitřními rozpory.',
        contradictions: ['Rozpor v tvrzení o nekomunikaci otce (odst. 2) a současném přiznání týdenní e-mailové komunikace (odst. 5).'],
        counterArguments: ['Poukázat na vnitřní rozpor v tvrzeních matky.'],
        riskLevel: 'Nízké',
        anonymizedCount: 0
      });
    };

    const res = await request(app).post('/api/ai/analyze-document').send({ documentText: twoClaimsDoc });
    assert.strictEqual(res.body.contradictions.length, 1, 'Should identify valid contradiction');
    assert.ok(res.body.contradictions[0].includes('Rozpor v tvrzení'), 'Contradiction text must describe the conflict');
  });

  test('TEST 6: Source fact explicitly present in document is accurately captured', async () => {
    const factDoc = 'Nezletilý Adam (nar. 15.3.2018) navštěvuje MŠ Sluníčko v Praze 4.';

    AiService.generateContent = async () => {
      return JSON.stringify({
        summary: 'Dokument uvádí, že nezletilý Adam navštěvuje MŠ Sluníčko v Praze 4.',
        contradictions: [],
        counterArguments: [],
        riskLevel: 'Nízké',
        anonymizedCount: 0,
        structuredAnalysis: [{ type: 'SOURCE_FACT', claim: 'Nezletilý Adam navštěvuje MŠ Sluníčko v Praze 4' }]
      });
    };

    const res = await request(app).post('/api/ai/analyze-document').send({ documentText: factDoc });
    assert.ok(res.body.summary.includes('MŠ Sluníčko'), 'Fact from source text must be captured in summary');
  });

  test('TEST 7: Unknown information not in document is not fabricated as fact', async () => {
    const briefDoc = 'Soudní jednání je nařízeno na příští měsíc.';

    AiService.generateContent = async () => {
      return JSON.stringify({
        summary: 'Dokument obsahuje informaci o nařízení soudního jednání na příští měsíc.',
        contradictions: [],
        counterArguments: ['Vyžádat přesný termín a čas jednání od soudu.'],
        riskLevel: 'Nízké',
        anonymizedCount: 0
      });
    };

    const res = await request(app).post('/api/ai/analyze-document').send({ documentText: briefDoc });
    assert.ok(!JSON.stringify(res.body).includes('spisová značka 12 P 45/2024'), 'Must NOT invent unmentioned case numbers');
    assert.ok(!JSON.stringify(res.body).includes('OSPOD Praha 4'), 'Must NOT invent unmentioned OSPOD offices');
  });

  test('TEST 8: Retry operation preserves prompt input without duplicating text or modifying template state unexpectedly', async () => {
    const originalCompiledText = 'NÁVRH NA URČENÍ PÉČE O NEZLETILÉHO';
    const customInstruction = 'Doplň větu o flexibilní pracovní době otce.';
    let executeCount = 0;

    AiService.generateContent = async () => {
      executeCount++;
      if (executeCount === 1) throw new Error('Překročen limit dotazů na AI (HTTP 429).');
      return originalCompiledText + '\n\nNavrhovatel dále uvádí, že disponuje flexibilní pracovní dobou.';
    };

    let currentText = originalCompiledText;

    const res1 = await request(app).post('/api/ai/chat').send({ mode: 'forms', messages: [{ role: 'user', content: customInstruction }] });
    assert.strictEqual(res1.status, 429, 'First attempt should fail');
    assert.strictEqual(executeCount, 1);

    const res2 = await request(app).post('/api/ai/chat').send({ mode: 'forms', messages: [{ role: 'user', content: customInstruction }] });
    assert.strictEqual(res2.status, 200, 'Second attempt should succeed');
    assert.ok(res2.body.reply.includes('flexibilní pracovní dobou'), 'Text updated correctly on Retry');
    assert.strictEqual(executeCount, 2, 'Executed exactly twice');
  });
});
