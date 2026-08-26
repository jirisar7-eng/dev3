import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AiService } from '../src/services/AiService';

describe('P0.2.3: AI Provider Model Compatibility & Runtime Parity Suite', () => {
  const originalEnv = { ...process.env };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    globalThis.fetch = originalFetch;
  });

  // TEST 1: Primary Gemini uses gemini-3.6-flash and not deprecated gemini-2.5-flash
  test('TEST 1: Primary Gemini uses gemini-3.6-flash and not deprecated gemini-2.5-flash', async () => {
    process.env.GEMINI_API_KEY = 'mock-primary-key';
    delete process.env.GEMINI_API_KEY_2;
    delete process.env.XAI_API_KEY;
    delete process.env.GROK_API_KEY;
    delete process.env.GROQ_API_KEY;

    let modelUsed = '';
    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async (params: any) => {
          modelUsed = params.model;
          return { text: 'Gemini 3.6 Flash Response' };
        }
      }
    });

    const result = await AiService.generateContent('Test prompt');
    assert.strictEqual(result, 'Gemini 3.6 Flash Response');
    assert.strictEqual(modelUsed, 'gemini-3.6-flash');
    assert.notStrictEqual(modelUsed, 'gemini-2.5-flash');
  });

  // TEST 2: Secondary Gemini uses gemini-3.6-flash when Primary fails
  test('TEST 2: Secondary Gemini uses gemini-3.6-flash when Primary fails', async () => {
    process.env.GEMINI_API_KEY = 'mock-primary-key';
    process.env.GEMINI_API_KEY_2 = 'mock-secondary-key';
    delete process.env.XAI_API_KEY;
    delete process.env.GROK_API_KEY;
    delete process.env.GROQ_API_KEY;

    let secondaryModelUsed = '';
    let callCount = 0;
    (AiService as any).getGeminiClient = (keyEnv: string) => ({
      models: {
        generateContent: async (params: any) => {
          callCount++;
          if (keyEnv === 'GEMINI_API_KEY') {
            throw new Error('Primary Gemini 404 NOT_FOUND');
          }
          secondaryModelUsed = params.model;
          return { text: 'Secondary Gemini 3.6 Flash Response' };
        }
      }
    });

    const result = await AiService.generateContent('Test prompt');
    assert.strictEqual(result, 'Secondary Gemini 3.6 Flash Response');
    assert.strictEqual(secondaryModelUsed, 'gemini-3.6-flash');
    assert.strictEqual(callCount, 2);
  });

  // TEST 3: Grok fallback uses grok-2-1212 and not deprecated grok-2-latest
  test('TEST 3: Grok fallback uses grok-2-1212 and not deprecated grok-2-latest', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY_2;
    process.env.XAI_API_KEY = 'mock-grok-key';
    delete process.env.GROQ_API_KEY;

    let grokModelRequested = '';
    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      const body = JSON.parse(init.body);
      grokModelRequested = body.model;
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Grok 2 1212 Response' } }]
        })
      };
    };

    const result = await AiService.generateContent('Test prompt');
    assert.strictEqual(result, 'Grok 2 1212 Response');
    assert.strictEqual(grokModelRequested, 'grok-2-1212');
    assert.notStrictEqual(grokModelRequested, 'grok-2-latest');
  });

  // TEST 4: Failover preserves systemInstruction and jsonMode across providers
  test('TEST 4: Failover preserves systemInstruction and jsonMode across providers', async () => {
    process.env.GEMINI_API_KEY = 'mock-primary';
    process.env.XAI_API_KEY = 'mock-xai';
    process.env.GROQ_API_KEY = 'mock-groq';

    // Primary Gemini fails
    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => {
          throw new Error('Quota exceeded 429');
        }
      }
    });

    let grokBody: any = null;
    globalThis.fetch = async (url: any, init: any): Promise<any> => {
      grokBody = JSON.parse(init.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"analyzed": true}' } }]
        })
      };
    };

    const systemInstruction = 'Jsi OSPOD poradce.';
    const result = await AiService.generateContent('Analyzuj situaci', {
      systemInstruction,
      jsonMode: true
    });

    assert.strictEqual(result, '{"analyzed": true}');
    assert.strictEqual(grokBody.model, 'grok-2-1212');
    assert.deepStrictEqual(grokBody.response_format, { type: 'json_object' });
    assert.strictEqual(grokBody.messages[0].role, 'system');
    assert.strictEqual(grokBody.messages[0].content, systemInstruction);
  });

  // TEST 5: Fail-closed when all providers fail (no fake data inserted)
  test('TEST 5: Fail-closed when all providers fail (no fake data inserted)', async () => {
    process.env.GEMINI_API_KEY = 'mock-gemini';
    process.env.GROQ_API_KEY = 'mock-groq';

    (AiService as any).getGeminiClient = () => ({
      models: {
        generateContent: async () => {
          throw new Error('HTTP 503 Service Unavailable');
        }
      }
    });

    globalThis.fetch = async (): Promise<any> => {
      return {
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      };
    };

    await assert.rejects(
      async () => {
        await AiService.generateContent('Test prompt');
      },
      (err: any) => {
        assert.ok(err.message.includes('AI_PROVIDER_ERROR'));
        assert.ok(!err.message.includes('Navrhovatel dále zdůrazňuje'));
        return true;
      }
    );
  });
});
