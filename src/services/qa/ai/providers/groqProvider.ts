import { apiFetch } from '../../../../utils/apiClient';
import { AIProvider, AIProviderResponse } from '../types';

export class GroqProvider implements AIProvider {
  public name: 'groq' = 'groq';
  public modelName = 'llama-3.3-70b-versatile';
  private _enabled = true;

  public isAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
  }

  public isEnabled(): boolean {
    return this._enabled && this.isAvailable();
  }

  public setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  public async analyze(sanitizedPrompt: string, options?: { timeoutMs?: number }): Promise<AIProviderResponse> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const start = Date.now();
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    const timeoutMs = options?.timeoutMs || 15000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: 'You are an AI Audit Analyst. Return valid JSON only.'
            },
            {
              role: 'user',
              content: sanitizedPrompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API call failed with status ${response.status}: ${errText}`);
      }

      const data: any = await response.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      const latencyMs = Date.now() - start;

      const promptTokens = data.usage?.prompt_tokens || Math.ceil(sanitizedPrompt.length / 4);
      const completionTokens = data.usage?.completion_tokens || Math.ceil(rawText.length / 4);

      return {
        rawText,
        promptTokens,
        completionTokens,
        model: this.modelName,
        latencyMs
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Groq API call timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
