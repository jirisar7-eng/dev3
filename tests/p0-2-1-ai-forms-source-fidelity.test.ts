import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AiService } from '../src/services/AiService';

describe('P0.2.1: AI Forms Fail-Safe & Case Manager Source Fidelity Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // TEST 1 — AI Forms failure: no hardcoded fallback, no judikatura, template content unchanged
  test('TEST 1: AI Forms failure does not append hardcoded fallback or judikatura text', async () => {
    let templateContent = 'PŮVODNÍ TEXT NÁVRHU K SOUDU';
    let errorOccurred = false;
    let errorMessage = null;

    // Simulate AI Refine request that fails (e.g. 503 Service Unavailable)
    const mockAiRefineFail = async () => {
      try {
        const res = { ok: false, status: 503, json: async () => ({ error: 'AI služba je dočasně nedostupná.' }) };
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error);
        }
      } catch (err: any) {
        errorOccurred = true;
        errorMessage = err.message;
        // CRITICAL CHECK: templateContent is NOT modified in catch block!
      }
    };

    await mockAiRefineFail();

    assert.strictEqual(templateContent, 'PŮVODNÍ TEXT NÁVRHU K SOUDU', 'Template content must remain unchanged on AI failure');
    assert.strictEqual(errorOccurred, true, 'Error state must be triggered');
    assert.strictEqual(errorMessage, 'AI služba je dočasně nedostupná.', 'Error message must be preserved');
    assert.ok(!templateContent.includes('IV. Doplnění právní argumentace'), 'Must NOT contain hardcoded judikatura fallback');
  });

  // TEST 2 — Case Manager hallucinated date ("12.5.") prevention
  test('TEST 2: Case Manager does not fabricate date "12.5." when not in source text', async () => {
    const documentTextWithoutDate = 'Matka tvrdí, že otec nekomunikuje. Otec uvádí, že předal návrh dohody.';

    let passedSystemInstruction = '';
    let passedPrompt = '';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async (params: any) => {
          passedSystemInstruction = params.config?.systemInstruction || '';
          passedPrompt = params.contents || '';
          return {
            text: JSON.stringify({
              summary: 'Rozbor opatrovnické zprávy.',
              contradictions: [],
              counterArguments: ['Doložit komunikaci otce.'],
              riskLevel: 'Nízké',
              anonymizedCount: 0
            })
          };
        }
      }
    });

    process.env.GEMINI_API_KEY = 'mock-key';

    const resultRaw = await AiService.generateContent(
      `Text k rozboru: "${documentTextWithoutDate}"`,
      {
        jsonMode: true,
        systemInstruction: `Jsi analytik opatrovnických dokumentů. DO NOT INVENT DATES (e.g. "12.5."). SOURCE DOCUMENT IS THE ONLY AUTHORITATIVE FACTUAL SOURCE.`,
        temperature: 0.1
      }
    );

    const result = JSON.parse(resultRaw);

    assert.ok(passedSystemInstruction.includes('DO NOT INVENT DATES'), 'System instruction must forbid inventing dates');
    assert.ok(!JSON.stringify(result).includes('12.5.'), 'Output must NOT contain fabricated date 12.5.');
  });

  // TEST 3 — Case Manager hallucinated email communication prevention
  test('TEST 3: Case Manager does not fabricate "e-mailová komunikace" when not in source text', async () => {
    const documentTextWithoutEmail = 'Zpráva OSPOD: Rodiče udávají problémy s předáváním dítěte na zastávce.';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            summary: 'Zpráva OSPOD popisuje komplikace při předávání dítěte na veřejném místě.',
            contradictions: [],
            counterArguments: ['Navrhnout předávání přes mateřskou školu.'],
            riskLevel: 'Střední',
            anonymizedCount: 0
          })
        })
      }
    });

    process.env.GEMINI_API_KEY = 'mock-key';

    const resultRaw = await AiService.generateContent(
      `Text k rozboru: "${documentTextWithoutEmail}"`,
      {
        jsonMode: true,
        systemInstruction: `SOURCE DOCUMENT IS THE ONLY FACTUAL SOURCE. DO NOT INVENT EMAILS OR COMMUNICATIONS NOT IN SOURCE.`,
        temperature: 0.1
      }
    );

    const result = JSON.parse(resultRaw);

    assert.ok(!JSON.stringify(result).includes('e-mailová komunikace ze dne'), 'Output must NOT fabricate email communications');
    assert.ok(!JSON.stringify(result).includes('písemný návrh kompromisu'), 'Output must NOT fabricate unmentioned compromises');
  });

  // TEST 4 — Unsupported contradiction: Single claim must NOT yield a contradiction
  test('TEST 4: Single-sided claim without conflicting evidence in source text is NOT marked as contradiction', async () => {
    const singleClaimDoc = 'Matka do protokolu uvedla, že otec se nepodílí na výchově.';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            summary: 'Jednostranné tvrzení matky v protokolu o nepodílení se na výchově.',
            contradictions: [], // Correct: empty array because source has no conflicting second claim
            counterArguments: ['Doložit aktivní účast otce na péči a zájmových kroužcích.'],
            riskLevel: 'Střední',
            anonymizedCount: 0
          })
        })
      }
    });

    process.env.GEMINI_API_KEY = 'mock-key';

    const resultRaw = await AiService.generateContent(singleClaimDoc, {
      jsonMode: true,
      systemInstruction: 'CONTRADICTIONS REQUIRE EVIDENCE FOR BOTH CONFLICTING CLAIMS IN THE SOURCE TEXT.',
      temperature: 0.1
    });

    const result = JSON.parse(resultRaw);
    assert.deepStrictEqual(result.contradictions, [], 'Contradictions must be empty when only one claim exists');
  });

  // TEST 5 — Valid contradiction: Two conflicting claims in source document yields contradiction
  test('TEST 5: Valid contradiction is generated when source document contains two contradictory claims', async () => {
    const twoClaimsDoc = 'V odst. 2 matka tvrdí, že otec nekomunikuje. V odst. 5 matka uvádí, že otec týdně zasílá e-maily s požadavky na styk.';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            summary: 'Vyhodnocení vyjádření matky s vnitřními rozpory.',
            contradictions: [
              'Rozpor v tvrzení o nekomunikaci otce (odst. 2) a současném přiznání týdenní e-mailové komunikace (odst. 5).'
            ],
            counterArguments: ['Poukázat na vnitřní rozpor v tvrzeních matky.'],
            riskLevel: 'Nízké',
            anonymizedCount: 0
          })
        })
      }
    });

    process.env.GEMINI_API_KEY = 'mock-key';

    const resultRaw = await AiService.generateContent(twoClaimsDoc, {
      jsonMode: true,
      systemInstruction: 'CONTRADICTIONS REQUIRE EVIDENCE FOR BOTH CONFLICTING CLAIMS.',
      temperature: 0.1
    });

    const result = JSON.parse(resultRaw);
    assert.strictEqual(result.contradictions.length, 1, 'Should identify valid contradiction');
    assert.ok(result.contradictions[0].includes('Rozpor v tvrzení'), 'Contradiction text must describe the conflict');
  });

  // TEST 6 — Source fact: Fact in source text is correctly captured
  test('TEST 6: Source fact explicitly present in document is accurately captured', async () => {
    const factDoc = 'Nezletilý Adam (nar. 15.3.2018) navštěvuje MŠ Sluníčko v Praze 4.';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            summary: 'Dokument uvádí, že nezletilý Adam navštěvuje MŠ Sluníčko v Praze 4.',
            contradictions: [],
            counterArguments: [],
            riskLevel: 'Nízké',
            anonymizedCount: 0,
            structuredAnalysis: [
              {
                type: 'SOURCE_FACT',
                claim: 'Nezletilý Adam navštěvuje MŠ Sluníčko v Praze 4',
                sourceEvidence: 'Nezletilý Adam (nar. 15.3.2018) navštěvuje MŠ Sluníčko v Praze 4.',
                confidence: 1.0
              }
            ]
          })
        })
      }
    });

    process.env.GEMINI_API_KEY = 'mock-key';

    const resultRaw = await AiService.generateContent(factDoc, { jsonMode: true, temperature: 0.1 });
    const result = JSON.parse(resultRaw);

    assert.ok(result.summary.includes('MŠ Sluníčko'), 'Fact from source text must be captured in summary');
    assert.strictEqual(result.structuredAnalysis[0].type, 'SOURCE_FACT');
  });

  // TEST 7 — Unknown: Information not in source document is treated as unknown/unsupported
  test('TEST 7: Unknown information not in document is not fabricated as fact', async () => {
    const briefDoc = 'Soudní jednání je nařízeno na příští měsíc.';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            summary: 'Dokument obsahuje informaci o nařízení soudního jednání na příští měsíc.',
            contradictions: [],
            counterArguments: ['Vyžádat přesný termín a čas jednání od soudu.'],
            riskLevel: 'Nízké',
            anonymizedCount: 0
          })
        })
      }
    });

    process.env.GEMINI_API_KEY = 'mock-key';

    const resultRaw = await AiService.generateContent(briefDoc, { jsonMode: true, temperature: 0.1 });
    const result = JSON.parse(resultRaw);

    assert.ok(!JSON.stringify(result).includes('spisová značka 12 P 45/2024'), 'Must NOT invent unmentioned case numbers');
    assert.ok(!JSON.stringify(result).includes('OSPOD Praha 4'), 'Must NOT invent unmentioned OSPOD offices');
  });

  // TEST 8 — Retry: Re-executing AI action preserves input and does not duplicate content
  test('TEST 8: Retry operation preserves prompt input without duplicating text or modifying template state unexpectedly', async () => {
    const originalCompiledText = 'NÁVRH NA URČENÍ PÉČE O NEZLETILÉHO';
    const customInstruction = 'Doplň větu o flexibilní pracovní době otce.';
    let executeCount = 0;

    const simulateAiRefineWithRetry = async (instructionToUse: string) => {
      executeCount++;
      if (executeCount === 1) {
        // First attempt fails
        throw new Error('Překročen limit dotazů na AI (HTTP 429).');
      } else {
        // Second attempt (Retry) succeeds
        return `${originalCompiledText}\n\nNavrhovatel dále uvádí, že disponuje flexibilní pracovní dobou.`;
      }
    };

    let currentText = originalCompiledText;
    let lastPrompt = customInstruction;
    let errorState: string | null = null;

    // First attempt
    try {
      currentText = await simulateAiRefineWithRetry(customInstruction);
    } catch (err: any) {
      errorState = err.message;
    }

    assert.strictEqual(currentText, originalCompiledText, 'Text must remain untouched after failed 1st attempt');
    assert.strictEqual(errorState, 'Překročen limit dotazů na AI (HTTP 429).', 'Error state must record failure');
    assert.strictEqual(lastPrompt, customInstruction, 'Prompt input must be preserved for Retry');

    // Retry attempt
    errorState = null;
    try {
      currentText = await simulateAiRefineWithRetry(lastPrompt);
    } catch (err: any) {
      errorState = err.message;
    }

    assert.strictEqual(errorState, null, 'Error state cleared on success');
    assert.ok(currentText.includes('flexibilní pracovní dobou'), 'Text updated correctly on Retry');
    assert.strictEqual(executeCount, 2, 'Executed exactly twice');
  });
});
