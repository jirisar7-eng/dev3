import { apiFetch } from '../utils/apiClient';
import { GoogleGenAI } from '@google/genai';
import { aiStatsManager } from './qa/ai/aiStats';

export interface AiGenerateOptions {
  timeoutMs?: number;
  jsonMode?: boolean;
  modelOverride?: string;
  systemInstruction?: string;
  temperature?: number;
}

export class AiService {
  private static getGeminiClient(keyEnvVar: string): GoogleGenAI {
    const key = process.env[keyEnvVar];
    if (!key) throw new Error(`${keyEnvVar} environment variable is missing`);
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Universal AI content generation with multi-provider resilience:
   * 1. Gemini Primary (gemini-3.6-flash via GEMINI_API_KEY)
   * 2. Gemini Secondary (gemini-3.6-flash via GEMINI_API_KEY_2)
   * 3. Grok / xAI (grok-2-1212 via XAI_API_KEY or GROK_API_KEY)
   * 4. Groq (llama-3.3-70b-versatile via GROQ_API_KEY)
   */
  static async generateContent(prompt: string, options?: AiGenerateOptions): Promise<string> {
    const timeoutMs = options?.timeoutMs || 25000;
    const errors: Array<{ provider: string; error: string }> = [];

    // Helper for timeout execution
    const withTimeout = async <T>(promise: Promise<T>, providerName: string): Promise<T> => {
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Timeout: ${providerName} neodpověděl do ${timeoutMs}ms`));
        }, timeoutMs);
      });
      try {
        return await Promise.race([promise, timeoutPromise]);
      } finally {
        clearTimeout(timer!);
      }
    };

    // Prepare Gemini configuration
    const geminiConfig: Record<string, any> = {};
    if (options?.systemInstruction && options.systemInstruction.trim().length > 0) {
      geminiConfig.systemInstruction = options.systemInstruction;
    }
    if (options?.jsonMode) {
      geminiConfig.responseMimeType = 'application/json';
    }
    if (typeof options?.temperature === 'number') {
      geminiConfig.temperature = options.temperature;
    }
    const geminiConfigParam = Object.keys(geminiConfig).length > 0 ? geminiConfig : undefined;

    // Prepare OpenAI-compatible messages for Grok and Groq (system + user)
    const openAiMessages: Array<{ role: string; content: string }> = [];
    if (options?.systemInstruction && options.systemInstruction.trim().length > 0) {
      openAiMessages.push({
        role: 'system',
        content: options.systemInstruction
      });
    }
    openAiMessages.push({
      role: 'user',
      content: prompt
    });

    // 1. Try Primary Gemini Key
    if (process.env.GEMINI_API_KEY) {
      const model = options?.modelOverride || 'gemini-3.6-flash';
      const start = Date.now();
      aiStatsManager.startOperation('gemini', model);
      try {
        console.log(`[AiService] Calling Primary Gemini AI (${model})...`);
        const ai = this.getGeminiClient('GEMINI_API_KEY');
        const call = async () => {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: geminiConfigParam
          });
          return response;
        };

        const responseObj = await withTimeout(call(), 'Gemini Primary');
        const text = responseObj?.text || '';
        const latencyMs = Date.now() - start;

        if (text && text.trim().length > 0) {
          console.log(`[AiService] Primary Gemini AI completed successfully in ${latencyMs}ms (${text.length} chars output).`);
          const usage = responseObj?.usageMetadata;
          aiStatsManager.recordCallDetails({
            provider: 'gemini',
            model,
            promptTokens: usage?.promptTokenCount || null,
            completionTokens: usage?.candidatesTokenCount || null,
            latencyMs,
            success: true
          });
          aiStatsManager.endOperation();
          return text;
        }
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        const isTimeout = err?.message?.toLowerCase().includes('timeout') || false;
        console.warn('[AiService] Primary Gemini AI failed:', err?.message || err);
        errors.push({ provider: 'Gemini Primary', error: err?.message || String(err) });
        aiStatsManager.recordCallDetails({
          provider: 'gemini',
          model,
          latencyMs,
          success: false,
          isTimeout,
          errorMsg: err?.message || String(err)
        });
      } finally {
        aiStatsManager.endOperation();
      }
    }

    // 2. Try Secondary Gemini Key
    if (process.env.GEMINI_API_KEY_2) {
      const model = options?.modelOverride || 'gemini-3.6-flash';
      const start = Date.now();
      aiStatsManager.startOperation('gemini', model);
      try {
        console.log(`[AiService] Calling Secondary Gemini AI (${model})...`);
        const ai2 = this.getGeminiClient('GEMINI_API_KEY_2');
        const call = async () => {
          const response2 = await ai2.models.generateContent({
            model,
            contents: prompt,
            config: geminiConfigParam
          });
          return response2;
        };

        const responseObj2 = await withTimeout(call(), 'Gemini Secondary');
        const text = responseObj2?.text || '';
        const latencyMs = Date.now() - start;

        if (text && text.trim().length > 0) {
          console.log(`[AiService] Secondary Gemini AI completed successfully in ${latencyMs}ms.`);
          const usage = responseObj2?.usageMetadata;
          aiStatsManager.recordCallDetails({
            provider: 'gemini',
            model,
            promptTokens: usage?.promptTokenCount || null,
            completionTokens: usage?.candidatesTokenCount || null,
            latencyMs,
            success: true,
            isFallback: true
          });
          aiStatsManager.endOperation();
          return text;
        }
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        const isTimeout = err?.message?.toLowerCase().includes('timeout') || false;
        console.warn('[AiService] Secondary Gemini AI failed:', err?.message || err);
        errors.push({ provider: 'Gemini Secondary', error: err?.message || String(err) });
        aiStatsManager.recordCallDetails({
          provider: 'gemini',
          model,
          latencyMs,
          success: false,
          isTimeout,
          isFallback: true,
          errorMsg: err?.message || String(err)
        });
      } finally {
        aiStatsManager.endOperation();
      }
    }

    // 3. Fallback to Grok (xAI API)
    const grokKey = process.env.XAI_API_KEY || process.env.GROK_API_KEY;
    if (grokKey) {
      const model = 'grok-2-1212';
      const start = Date.now();
      aiStatsManager.startOperation('grok', model);
      try {
        console.log('[AiService] Fallback to Grok AI (grok-2-1212)...');
        const call = async () => {
          const controller = new AbortController();
          const grokResponse = await apiFetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${grokKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages: openAiMessages,
              temperature: typeof options?.temperature === 'number' ? options.temperature : 0.1,
              response_format: options?.jsonMode ? { type: 'json_object' } : undefined
            }),
            signal: controller.signal
          });

          if (!grokResponse.ok) {
            const errData = await grokResponse.text().catch(() => '');
            throw new Error(`Grok API returned HTTP ${grokResponse.status}: ${errData.slice(0, 200)}`);
          }

          const data: any = await grokResponse.json();
          return data;
        };

        const data = await withTimeout(call(), 'Grok AI');
        const text = data.choices?.[0]?.message?.content || '';
        const latencyMs = Date.now() - start;

        if (text && text.trim().length > 0) {
          console.log(`[AiService] Grok AI fallback succeeded in ${latencyMs}ms.`);
          aiStatsManager.recordCallDetails({
            provider: 'grok',
            model,
            promptTokens: data.usage?.prompt_tokens || null,
            completionTokens: data.usage?.completion_tokens || null,
            latencyMs,
            success: true,
            isFallback: true
          });
          aiStatsManager.endOperation();
          return text;
        }
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        const isTimeout = err?.message?.toLowerCase().includes('timeout') || false;
        console.warn('[AiService] Grok AI fallback failed:', err?.message || err);
        errors.push({ provider: 'Grok AI', error: err?.message || String(err) });
        aiStatsManager.recordCallDetails({
          provider: 'grok',
          model,
          latencyMs,
          success: false,
          isTimeout,
          isFallback: true,
          errorMsg: err?.message || String(err)
        });
      } finally {
        aiStatsManager.endOperation();
      }
    }

    // 4. Fallback to Groq API (llama-3.3-70b-versatile)
    if (process.env.GROQ_API_KEY) {
      const model = 'llama-3.3-70b-versatile';
      const start = Date.now();
      aiStatsManager.startOperation('groq', model);
      try {
        console.log('[AiService] Fallback to Groq AI (llama-3.3-70b-versatile)...');
        const call = async () => {
          const groqResponse = await apiFetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages: openAiMessages,
              temperature: typeof options?.temperature === 'number' ? options.temperature : 0.1,
              response_format: options?.jsonMode ? { type: 'json_object' } : undefined
            })
          });

          if (!groqResponse.ok) {
            const errData = await groqResponse.text().catch(() => '');
            throw new Error(`Groq API returned HTTP ${groqResponse.status}: ${errData.slice(0, 200)}`);
          }

          const data: any = await groqResponse.json();
          return data;
        };

        const data = await withTimeout(call(), 'Groq AI');
        const text = data.choices?.[0]?.message?.content || '';
        const latencyMs = Date.now() - start;

        if (text && text.trim().length > 0) {
          console.log(`[AiService] Groq AI fallback succeeded in ${latencyMs}ms.`);
          aiStatsManager.recordCallDetails({
            provider: 'groq',
            model,
            promptTokens: data.usage?.prompt_tokens || null,
            completionTokens: data.usage?.completion_tokens || null,
            latencyMs,
            success: true,
            isFallback: true
          });
          aiStatsManager.endOperation();
          return text;
        }
      } catch (err: any) {
        const latencyMs = Date.now() - start;
        const isTimeout = err?.message?.toLowerCase().includes('timeout') || false;
        console.warn('[AiService] Groq AI fallback failed:', err?.message || err);
        errors.push({ provider: 'Groq AI', error: err?.message || String(err) });
        aiStatsManager.recordCallDetails({
          provider: 'groq',
          model,
          latencyMs,
          success: false,
          isTimeout,
          isFallback: true,
          errorMsg: err?.message || String(err)
        });
      } finally {
        aiStatsManager.endOperation();
      }
    }

    // If all providers failed or no keys configured
    if (errors.length === 0) {
      throw new Error('AI_AUTH_ERROR: Žádný AI poskytovatel není nakonfigurován (chybí GEMINI_API_KEY, XAI_API_KEY i GROQ_API_KEY).');
    }

    const isTimeout = errors.some(e => e.error.toLowerCase().includes('timeout'));
    const isRateLimit = errors.some(e => e.error.includes('429') || e.error.toLowerCase().includes('quota') || e.error.toLowerCase().includes('rate limit'));

    if (isRateLimit) {
      throw new Error(`AI_RATE_LIMIT: Poskytovatelé AI hlásí překročení kvóty nebo limitu požadavků.`);
    }
    if (isTimeout) {
      throw new Error(`AI_TIMEOUT: Zpracování dokumentu překročilo časový limit.`);
    }

    throw new Error(`AI_PROVIDER_ERROR: Selhali všichni dostupní AI poskytovatelé (${errors.map(e => `${e.provider}: ${e.error}`).join('; ')})`);
  }
}

