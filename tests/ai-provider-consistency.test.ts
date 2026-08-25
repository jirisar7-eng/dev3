import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AiService, AiGenerateOptions } from '../src/services/AiService';

describe('P0.1: AI Provider Consistency Hardening & Failover Test Suite', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Reset env vars before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  // TEST 1: Roleplay systemInstruction - Verify all providers receive identical role and systemInstruction
  test('Test 1: Roleplay systemInstruction ("Jsi pracovnice OSPOD.") is passed identically to Gemini, Grok and Groq', async () => {
    const systemInstruction = 'Jsi pracovnice OSPOD v opatrovnickém řízení. Reaguj věcně a klidně.';
    const prompt = 'Dobrý den, přišel jsem doložit záznamy o péči o syna.';

    let geminiConfigReceived: any = null;
    let grokBodyReceived: any = null;
    let groqBodyReceived: any = null;

    // 1A. Test Gemini Primary receives systemInstruction in config
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.XAI_API_KEY;
    delete process.env.GROK_API_KEY;
    delete process.env.GROQ_API_KEY;

    // Mock getGeminiClient
    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async (params: any) => {
          geminiConfigReceived = params.config;
          return { text: 'Dobrý den, prosím posaďte se.' };
        }
      }
    });

    const geminiRes = await AiService.generateContent(prompt, { systemInstruction });
    assert.strictEqual(geminiRes, 'Dobrý den, prosím posaďte se.');
    assert.ok(geminiConfigReceived, 'Gemini config must be passed');
    assert.strictEqual(geminiConfigReceived.systemInstruction, systemInstruction);

    // 1B. Test Grok receives system message in messages array
    delete process.env.GEMINI_API_KEY;
    process.env.XAI_API_KEY = 'mock-xai-key';

    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      grokBodyReceived = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Dobrý den z OSPODu.' } }]
        })
      };
    };

    const grokRes = await AiService.generateContent(prompt, { systemInstruction });
    assert.strictEqual(grokRes, 'Dobrý den z OSPODu.');
    assert.ok(grokBodyReceived, 'Grok body must be received');
    assert.strictEqual(grokBodyReceived.messages.length, 2);
    assert.deepStrictEqual(grokBodyReceived.messages[0], {
      role: 'system',
      content: systemInstruction
    });
    assert.deepStrictEqual(grokBodyReceived.messages[1], {
      role: 'user',
      content: prompt
    });

    // 1C. Test Groq receives system message in messages array
    delete process.env.XAI_API_KEY;
    process.env.GROQ_API_KEY = 'mock-groq-key';

    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      groqBodyReceived = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Dobrý den z OSPODu přes Groq.' } }]
        })
      };
    };

    const groqRes = await AiService.generateContent(prompt, { systemInstruction });
    assert.strictEqual(groqRes, 'Dobrý den z OSPODu přes Groq.');
    assert.ok(groqBodyReceived, 'Groq body must be received');
    assert.strictEqual(groqBodyReceived.messages.length, 2);
    assert.deepStrictEqual(groqBodyReceived.messages[0], {
      role: 'system',
      content: systemInstruction
    });
    assert.deepStrictEqual(groqBodyReceived.messages[1], {
      role: 'user',
      content: prompt
    });
  });

  // TEST 2: Roleplay bez "jsonMode" - Grok/Groq neobdrží automatický JSON systémový prompt
  test('Test 2: Roleplay without jsonMode - Grok and Groq do not receive any hardcoded legal/JSON prompt', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_2;
    process.env.XAI_API_KEY = 'mock-xai-key';

    let capturedBody: any = null;
    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Roleplay odpověď bez JSONu.' } }]
        })
      };
    };

    const systemInstruction = 'Jsi soudkyně v opatrovnickém sporu.';
    const prompt = 'Prosím o slovo, paní soudkyně.';

    await AiService.generateContent(prompt, { systemInstruction, jsonMode: false });

    assert.ok(capturedBody);
    assert.strictEqual(capturedBody.response_format, undefined);
    assert.strictEqual(capturedBody.messages.length, 2);
    // Ensure no hardcoded legal analyst text exists
    assert.ok(!JSON.stringify(capturedBody).includes('Jsi specializovaný právní AI analytik'));
    assert.ok(!JSON.stringify(capturedBody).includes('Vracej výhradně validní JSON bez markdownu'));
    assert.strictEqual(capturedBody.messages[0].content, systemInstruction);
  });

  // TEST 3: Roleplay s "jsonMode=true" - Změní se pouze formát, nikoli role
  test('Test 3: Roleplay with jsonMode=true - Only output format changes, persona/role remains intact', async () => {
    // 3A. Test with Gemini
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    delete process.env.XAI_API_KEY;

    let geminiConfig: any = null;
    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async (params: any) => {
          geminiConfig = params.config;
          return { text: '{"roleplayScore": 95}' };
        }
      }
    });

    const systemInstruction = 'Jsi hodnotitel komunikace otce.';
    await AiService.generateContent('Ohodnoť odpověď', { systemInstruction, jsonMode: true });

    assert.strictEqual(geminiConfig.systemInstruction, systemInstruction);
    assert.strictEqual(geminiConfig.responseMimeType, 'application/json');

    // 3B. Test with Grok
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_2;
    process.env.XAI_API_KEY = 'mock-xai-key';

    let grokBody: any = null;
    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      grokBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"status": "ok"}' } }]
        })
      };
    };

    await AiService.generateContent('Analyzuj zprávu', { systemInstruction, jsonMode: true });
    assert.deepStrictEqual(grokBody.response_format, { type: 'json_object' });
    assert.strictEqual(grokBody.messages[0].content, systemInstruction);
    assert.ok(!JSON.stringify(grokBody).includes('Jsi specializovaný právní AI analytik'));
  });

  // TEST 4: Failover Gemini → Grok - Ověř, že Grok dostane stejný systemInstruction a user prompt
  test('Test 4: Failover Gemini Primary -> Grok delivers identical systemInstruction and user prompt', async () => {
    process.env.GEMINI_API_KEY = 'mock-gemini-key';
    delete process.env.GEMINI_API_KEY_2;
    process.env.XAI_API_KEY = 'mock-xai-key';

    // Mock Gemini throwing error (e.g. rate limit 429)
    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => {
          throw new Error('Gemini API quota exceeded (HTTP 429)');
        }
      }
    });

    let grokRequest: any = null;
    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      grokRequest = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Odpověď z Groku po failoveru.' } }]
        })
      };
    };

    const systemInstruction = 'Simulace: Otec v krizové situaci.';
    const prompt = 'Jak mám reagovat na nečekaný příjezd sociální pracovnice?';

    const result = await AiService.generateContent(prompt, {
      systemInstruction,
      temperature: 0.2
    });

    assert.strictEqual(result, 'Odpověď z Groku po failoveru.');
    assert.ok(grokRequest, 'Grok must have been invoked on failover');
    assert.strictEqual(grokRequest.temperature, 0.2);
    assert.strictEqual(grokRequest.messages.length, 2);
    assert.strictEqual(grokRequest.messages[0].role, 'system');
    assert.strictEqual(grokRequest.messages[0].content, systemInstruction);
    assert.strictEqual(grokRequest.messages[1].role, 'user');
    assert.strictEqual(grokRequest.messages[1].content, prompt);
  });

  // TEST 5: Failover Gemini Primary -> Gemini Secondary -> Grok -> Groq
  test('Test 5: Failover Gemini 1 & 2 & Grok -> Groq delivers identical parameters', async () => {
    process.env.GEMINI_API_KEY = 'mock-gemini-key-1';
    process.env.GEMINI_API_KEY_2 = 'mock-gemini-key-2';
    process.env.XAI_API_KEY = 'mock-xai-key';
    process.env.GROQ_API_KEY = 'mock-groq-key';

    // Both Gemini keys fail
    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => {
          throw new Error('Gemini unavailable');
        }
      }
    });

    let fetchCallCount = 0;
    let groqPayload: any = null;

    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      fetchCallCount++;
      const body = JSON.parse(init.body);
      if (body.model === 'grok-2-latest') {
        // Grok fails too
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error on Grok'
        };
      }
      if (body.model === 'llama-3.3-70b-versatile') {
        // Groq succeeds
        groqPayload = body;
        return {
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Odpověď z Groq po plném failoveru.' } }]
          })
        };
      }
      throw new Error('Unexpected URL/model');
    };

    const systemInstruction = 'Jsi asistent pro přípravu na opatrovnické jednání.';
    const prompt = 'Jaké listiny mám mít s sebou?';

    const result = await AiService.generateContent(prompt, {
      systemInstruction,
      jsonMode: true
    });

    assert.strictEqual(result, 'Odpověď z Groq po plném failoveru.');
    assert.ok(groqPayload, 'Groq payload must be captured');
    assert.strictEqual(groqPayload.response_format?.type, 'json_object');
    assert.strictEqual(groqPayload.messages[0].role, 'system');
    assert.strictEqual(groqPayload.messages[0].content, systemInstruction);
    assert.strictEqual(groqPayload.messages[1].role, 'user');
    assert.strictEqual(groqPayload.messages[1].content, prompt);
  });

  // TEST 6: Existující volání bez "systemInstruction" zůstává 100% funkční
  test('Test 6: Legacy/existing calls without systemInstruction remain fully functional without fabricated system messages', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.XAI_API_KEY;
    process.env.GROQ_API_KEY = 'mock-groq-key';

    let groqPayload: any = null;
    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      groqPayload = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Standardní odpověď bez systémových instrukcí.' } }]
        })
      };
    };

    const prompt = 'Stručně shrň článek 12.';
    // Call without any options or systemInstruction
    const result = await AiService.generateContent(prompt);

    assert.strictEqual(result, 'Standardní odpověď bez systémových instrukcí.');
    assert.ok(groqPayload);
    // Messages should contain ONLY the user prompt (no phantom legal prompt)
    assert.strictEqual(groqPayload.messages.length, 1);
    assert.strictEqual(groqPayload.messages[0].role, 'user');
    assert.strictEqual(groqPayload.messages[0].content, prompt);
  });
});
