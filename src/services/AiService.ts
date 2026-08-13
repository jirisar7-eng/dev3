import { GoogleGenAI } from '@google/genai';

export class AiService {
  private static getGeminiClient(keyEnvVar: string): GoogleGenAI {
    const key = process.env[keyEnvVar];
    if (!key) throw new Error(`${keyEnvVar} environment variable is missing`);
    return new GoogleGenAI({ apiKey: key });
  }

  static async generateContent(prompt: string): Promise<string> {
    // 1. Try Primary Gemini Key
    try {
      if (process.env.GEMINI_API_KEY) {
        console.log('[AiService] Using Primary GEMINI_API_KEY...');
        const ai = this.getGeminiClient('GEMINI_API_KEY');
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
        if (response.text) return response.text;
      }
    } catch (err: any) {
      console.warn('[AiService] Primary GEMINI_API_KEY failed:', err?.message);
    }

    // 2. Try Secondary Gemini Key
    try {
      if (process.env.GEMINI_API_KEY_2) {
        console.log('[AiService] Using Secondary GEMINI_API_KEY_2...');
        const ai2 = this.getGeminiClient('GEMINI_API_KEY_2');
        const response2 = await ai2.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });
        if (response2.text) return response2.text;
      }
    } catch (err: any) {
      console.warn('[AiService] Secondary GEMINI_API_KEY_2 failed:', err?.message);
    }

    // 3. Fallback to Groq API
    if (process.env.GROQ_API_KEY) {
      console.log('[AiService] Fallback to GROQ_API_KEY (llama-3.3-70b-versatile)...');
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!groqResponse.ok) {
          const errData = await groqResponse.json().catch(() => ({}));
          throw new Error(`Groq API returned ${groqResponse.status}: ${JSON.stringify(errData)}`);
        }

        const data = await groqResponse.json();
        return data.choices[0]?.message?.content || '';
      } catch (err: any) {
        console.error('[AiService] Groq fallback failed:', err?.message);
        throw new Error('All AI providers (Gemini Primary, Gemini Secondary, Groq) failed.');
      }
    }

    throw new Error('No available AI providers succeeded or configured.');
  }
}
