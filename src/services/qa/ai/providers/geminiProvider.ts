import { GoogleGenAI } from '@google/genai';
import { AIProvider, AIProviderResponse } from '../types';

export class GeminiProvider implements AIProvider {
  public name: 'gemini' = 'gemini';
  public modelName = 'gemini-2.5-flash';
  private _enabled = true;

  public isAvailable(): boolean {
    return !!(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2);
  }

  public isEnabled(): boolean {
    return this._enabled && this.isAvailable();
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public async analyze(sanitizedPrompt: string, options?: { timeoutMs?: number }): Promise<AIProviderResponse> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const start = Date.now();
    const timeoutMs = options?.timeoutMs || 15000;
    const ai = new GoogleGenAI({ apiKey });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Gemini API call timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    const callPromise = (async () => {
      const response = await ai.models.generateContent({
        model: this.modelName,
        contents: sanitizedPrompt,
        config: {
          responseMimeType: 'application/json'
        }
      });
      return response.text || '';
    })();

    const rawText = await Promise.race([callPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;

    const promptTokens = Math.ceil(sanitizedPrompt.length / 4);
    const completionTokens = Math.ceil(rawText.length / 4);

    return {
      rawText,
      promptTokens,
      completionTokens,
      model: this.modelName,
      latencyMs
    };
  }
}

