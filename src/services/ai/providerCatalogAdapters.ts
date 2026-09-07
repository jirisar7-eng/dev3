import fetch from 'node-fetch';

export interface DiscoveredModelInfo {
  providerKey: string;
  providerModelId: string; // Exact API Model ID (e.g. gemini-2.0-flash-exp)
  displayName: string;
  suggestedKey: string;
  lifecycleStatus: 'FREE' | 'PAID' | 'PREVIEW' | 'DEPRECATED' | 'UNAVAILABLE' | 'FREE_TIER' | 'OPEN_SOURCE';
  capabilities: string[];
  contextWindow?: number;
  maxOutputTokens?: number;
  inputPricePer1M?: number;
  outputPricePer1M?: number;
  freeTier?: boolean;
  supportsTools?: boolean;
  supportsVision?: boolean;
  supportsReasoning?: boolean;
  supportsStructuredOutput?: boolean;
  rawMetadata?: any;
}

export interface ProviderCatalogDiscoveryResult {
  providerKey: string;
  providerName: string;
  supported: boolean;
  models: DiscoveredModelInfo[];
  error?: string;
  source: 'API' | 'HEURISTIC' | 'NOT_AVAILABLE';
}

export interface ProviderCatalogAdapter {
  providerKey: string;
  providerName: string;
  discoverModels(): Promise<ProviderCatalogDiscoveryResult>;
}

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal as any });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Google Gemini Catalog Adapter
 */
export class GeminiCatalogAdapter implements ProviderCatalogAdapter {
  public providerKey = 'gemini';
  public providerName = 'Google Gemini';

  public async discoverModels(): Promise<ProviderCatalogDiscoveryResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback to documented catalog heuristic when API key is missing
      const heuristicModels: DiscoveredModelInfo[] = [
        {
          providerKey: 'gemini',
          providerModelId: 'gemini-2.0-flash-exp',
          displayName: 'Gemini 2.0 Flash (Experimental)',
          suggestedKey: 'gemini-2.0-flash-exp',
          lifecycleStatus: 'PREVIEW',
          capabilities: ['chat', 'code', 'vision', 'tools', 'reasoning'],
          contextWindow: 1048576,
          maxOutputTokens: 8192,
          inputPricePer1M: 0,
          outputPricePer1M: 0,
          freeTier: true,
          supportsTools: true,
          supportsVision: true,
          supportsReasoning: true
        },
        {
          providerKey: 'gemini',
          providerModelId: 'gemini-1.5-pro',
          displayName: 'Gemini 1.5 Pro',
          suggestedKey: 'gemini-1.5-pro',
          lifecycleStatus: 'PAID',
          capabilities: ['chat', 'code', 'vision', 'tools', 'reasoning', 'legal_analysis'],
          contextWindow: 2097152,
          maxOutputTokens: 8192,
          inputPricePer1M: 1.25,
          outputPricePer1M: 5.0,
          freeTier: false,
          supportsTools: true,
          supportsVision: true,
          supportsReasoning: true
        },
        {
          providerKey: 'gemini',
          providerModelId: 'gemini-1.5-flash',
          displayName: 'Gemini 1.5 Flash',
          suggestedKey: 'gemini-1.5-flash',
          lifecycleStatus: 'FREE_TIER',
          capabilities: ['chat', 'code', 'vision', 'tools'],
          contextWindow: 1048576,
          maxOutputTokens: 8192,
          inputPricePer1M: 0,
          outputPricePer1M: 0,
          freeTier: true,
          supportsTools: true,
          supportsVision: true
        }
      ];

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models: heuristicModels,
        source: 'HEURISTIC',
        error: 'GEMINI_API_KEY není nastaven. Použita záložní katalogová heuristika.'
      };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await fetchWithTimeout(url, { method: 'GET' }, 8000);
      if (!res.ok) {
        throw new Error(`Google API vrací HTTP status ${res.status}`);
      }

      const data = (await res.json()) as any;
      const apiModels = data.models || [];

      const normalized: DiscoveredModelInfo[] = apiModels
        .filter((m: any) => m.name && m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => {
          // m.name is in format "models/gemini-1.5-pro"
          const rawId = m.name.replace(/^models\//, '');
          const displayName = m.displayName || rawId;

          const isFree = rawId.includes('free') || rawId.includes('exp') || rawId.includes('flash');
          const isPreview = rawId.includes('preview') || rawId.includes('exp');

          return {
            providerKey: 'gemini',
            providerModelId: rawId,
            displayName,
            suggestedKey: rawId,
            lifecycleStatus: isPreview ? 'PREVIEW' : isFree ? 'FREE_TIER' : 'PAID',
            capabilities: ['chat', 'code', 'vision', 'tools'],
            contextWindow: m.inputTokenLimit || 1048576,
            maxOutputTokens: m.outputTokenLimit || 8192,
            inputPricePer1M: isFree ? 0 : 1.25,
            outputPricePer1M: isFree ? 0 : 5.0,
            freeTier: isFree,
            supportsTools: true,
            supportsVision: true,
            rawMetadata: {
              description: m.description,
              temperature: m.temperature,
              topP: m.topP
            }
          };
        });

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models: normalized,
        source: 'API'
      };
    } catch (err: any) {
      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: false,
        models: [],
        source: 'NOT_AVAILABLE',
        error: `Chyba při dotazu na Gemini API models endpoint: ${err.message}`
      };
    }
  }
}

/**
 * OpenAI Catalog Adapter Architecture
 */
export class OpenAiCatalogAdapter implements ProviderCatalogAdapter {
  public providerKey = 'openai';
  public providerName = 'OpenAI';

  public async discoverModels(): Promise<ProviderCatalogDiscoveryResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: false,
        models: [],
        source: 'NOT_AVAILABLE',
        error: 'OPENAI_API_KEY není nastaven v prostředí.'
      };
    }

    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      }, 8000);

      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = (await res.json()) as any;
      const apiModels = data.data || [];

      const models: DiscoveredModelInfo[] = apiModels
        .filter((m: any) => m.id.startsWith('gpt-') || m.id.startsWith('o1') || m.id.startsWith('o3'))
        .map((m: any) => ({
          providerKey: 'openai',
          providerModelId: m.id,
          displayName: `OpenAI ${m.id}`,
          suggestedKey: m.id,
          lifecycleStatus: m.id.includes('preview') ? 'PREVIEW' : 'PAID',
          capabilities: ['chat', 'code', 'reasoning'],
          contextWindow: 128000,
          maxOutputTokens: 16384,
          inputPricePer1M: 2.5,
          outputPricePer1M: 10.0,
          freeTier: false,
          supportsTools: true,
          supportsReasoning: m.id.startsWith('o1') || m.id.startsWith('o3')
        }));

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models,
        source: 'API'
      };
    } catch (err: any) {
      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: false,
        models: [],
        source: 'NOT_AVAILABLE',
        error: err.message
      };
    }
  }
}

/**
 * xAI / Grok Catalog Adapter Architecture
 */
export class GrokCatalogAdapter implements ProviderCatalogAdapter {
  public providerKey = 'grok';
  public providerName = 'xAI Grok';

  public async discoverModels(): Promise<ProviderCatalogDiscoveryResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      const defaultGrok: DiscoveredModelInfo[] = [
        {
          providerKey: 'grok',
          providerModelId: 'grok-2-1212',
          displayName: 'xAI Grok 2',
          suggestedKey: 'grok-2-1212',
          lifecycleStatus: 'PAID',
          capabilities: ['chat', 'code', 'vision', 'reasoning'],
          contextWindow: 131072,
          maxOutputTokens: 8192,
          inputPricePer1M: 2.0,
          outputPricePer1M: 10.0,
          freeTier: false,
          supportsVision: true,
          supportsTools: true
        }
      ];

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models: defaultGrok,
        source: 'HEURISTIC'
      };
    }

    try {
      const res = await fetchWithTimeout('https://api.x.ai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      }, 8000);

      if (!res.ok) throw new Error(`xAI HTTP ${res.status}`);
      const data = (await res.json()) as any;
      const apiModels = data.data || [];

      const models: DiscoveredModelInfo[] = apiModels.map((m: any) => ({
        providerKey: 'grok',
        providerModelId: m.id,
        displayName: `xAI ${m.id}`,
        suggestedKey: m.id,
        lifecycleStatus: 'PAID',
        capabilities: ['chat', 'code', 'reasoning'],
        contextWindow: 131072,
        maxOutputTokens: 8192,
        inputPricePer1M: 2.0,
        outputPricePer1M: 10.0,
        freeTier: false,
        supportsTools: true
      }));

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models,
        source: 'API'
      };
    } catch (err: any) {
      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: false,
        models: [],
        source: 'NOT_AVAILABLE',
        error: err.message
      };
    }
  }
}

/**
 * Groq Catalog Adapter Architecture
 */
export class GroqCatalogAdapter implements ProviderCatalogAdapter {
  public providerKey = 'groq';
  public providerName = 'Groq';

  public async discoverModels(): Promise<ProviderCatalogDiscoveryResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const defaultGroq: DiscoveredModelInfo[] = [
        {
          providerKey: 'groq',
          providerModelId: 'llama-3.3-70b-versatile',
          displayName: 'Llama 3.3 70B (Groq)',
          suggestedKey: 'llama-3.3-70b-versatile',
          lifecycleStatus: 'PAID',
          capabilities: ['chat', 'code', 'tools'],
          contextWindow: 128000,
          maxOutputTokens: 8192,
          inputPricePer1M: 0.59,
          outputPricePer1M: 0.79,
          freeTier: false,
          supportsTools: true
        }
      ];

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models: defaultGroq,
        source: 'HEURISTIC'
      };
    }

    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` }
      }, 8000);

      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = (await res.json()) as any;
      const apiModels = data.data || [];

      const models: DiscoveredModelInfo[] = apiModels.map((m: any) => ({
        providerKey: 'groq',
        providerModelId: m.id,
        displayName: `Groq ${m.id}`,
        suggestedKey: m.id,
        lifecycleStatus: 'PAID',
        capabilities: ['chat', 'code', 'tools'],
        contextWindow: m.context_window || 128000,
        maxOutputTokens: 8192,
        inputPricePer1M: 0.59,
        outputPricePer1M: 0.79,
        freeTier: false,
        supportsTools: true
      }));

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models,
        source: 'API'
      };
    } catch (err: any) {
      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: false,
        models: [],
        source: 'NOT_AVAILABLE',
        error: err.message
      };
    }
  }
}

/**
 * OpenRouter Catalog Adapter Architecture
 */
export class OpenRouterCatalogAdapter implements ProviderCatalogAdapter {
  public providerKey = 'openrouter';
  public providerName = 'OpenRouter';

  public async discoverModels(): Promise<ProviderCatalogDiscoveryResult> {
    try {
      const res = await fetchWithTimeout('https://openrouter.ai/api/v1/models', {}, 10000);

      if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
      const data = (await res.json()) as any;
      const apiModels = data.data || [];

      const freeModels = apiModels
        .filter((m: any) => m.pricing?.prompt === '0' && m.pricing?.completion === '0')
        .slice(0, 10);

      const models: DiscoveredModelInfo[] = freeModels.map((m: any) => ({
        providerKey: 'openrouter',
        providerModelId: m.id,
        displayName: m.name || `OpenRouter ${m.id}`,
        suggestedKey: m.id.replace('/', '-'),
        lifecycleStatus: 'FREE',
        capabilities: ['chat', 'code'],
        contextWindow: m.context_length || 32768,
        maxOutputTokens: 4096,
        inputPricePer1M: 0,
        outputPricePer1M: 0,
        freeTier: true,
        supportsTools: false
      }));

      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: true,
        models,
        source: 'API'
      };
    } catch (err: any) {
      return {
        providerKey: this.providerKey,
        providerName: this.providerName,
        supported: false,
        models: [],
        source: 'NOT_AVAILABLE',
        error: err.message
      };
    }
  }
}

export const providerAdapters: Record<string, ProviderCatalogAdapter> = {
  gemini: new GeminiCatalogAdapter(),
  openai: new OpenAiCatalogAdapter(),
  grok: new GrokCatalogAdapter(),
  groq: new GroqCatalogAdapter(),
  openrouter: new OpenRouterCatalogAdapter()
};
