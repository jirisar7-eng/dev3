import {
  AresClientConfig,
  AresVerifyResult,
  AresEconomicSubjectRaw,
} from './types';
import { AresValidator } from './AresValidator';
import { AresNormalizer } from './AresNormalizer';

/**
 * Enterprise server-side HTTP transport client for official ARES REST API v3.
 * 
 * Invariants:
 * - Server-side execution only (never runs in client/browser)
 * - Zero fallback/dummy data generation (Fail-Closed)
 * - Strict HTTPS URL verification & SSRF protection
 * - Explicit 10-second timeout with AbortController
 * - Response payload size guard (10MB limit)
 * - Zero secrets in client-side bundles
 */
export class AresApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly maxResponseSizeBytes: number;
  private readonly customFetch?: (url: string, init?: any) => Promise<any>;

  constructor(config?: AresClientConfig) {
    if (typeof window !== 'undefined') {
      throw new Error('AresApiClient can only be instantiated in a secure server-side Node.js environment.');
    }

    this.baseUrl = config?.baseUrl || process.env.ARES_BASE_URL || 'https://ares.gov.cz/ekonomicke-subjekty-v-ares/restApi';
    this.timeoutMs = config?.timeoutMs ?? 10000;
    this.maxResponseSizeBytes = config?.maxResponseSizeBytes ?? 10 * 1024 * 1024; // 10MB
    this.customFetch = config?.customFetch;
  }

  /**
   * Fetches and verifies economic subject from ARES by IČO.
   */
  public async fetchSubjectByIco(icoInput: string | number): Promise<AresVerifyResult> {
    // 1. Validate and normalize IČO format & checksum
    const icoValidation = AresValidator.validateIco(icoInput);
    if (!icoValidation.valid || !icoValidation.normalizedIco) {
      return {
        success: false,
        error: {
          code: 'INVALID_ICO',
          message: icoValidation.errors.join(' '),
        },
      };
    }

    const ico = icoValidation.normalizedIco;
    const targetUrl = `${this.baseUrl.replace(/\/$/, '')}/ekonomicke-subjekty/${ico}`;

    // 2. SSRF URL Check
    const urlValidation = AresValidator.validateTargetUrl(targetUrl);
    if (!urlValidation.valid) {
      return {
        success: false,
        error: {
          code: 'SSRF_DETECTED',
          message: urlValidation.error || 'Neplatná nebo zakázaná cílová adresa ARES API.',
        },
      };
    }

    // 3. HTTP Request with AbortController Timeout
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const fetchFn = this.customFetch || globalThis.fetch;
      const response = await fetchFn(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TataMaPravo/1.0 (StateAdmin-Integration)',
        },
        signal: abortController.signal,
      });

      // Handle 404 Not Found
      if (response.status === 404) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Ekonomický subjekt s IČO ${ico} nebyl v registru ARES nalezen.`,
            httpStatus: 404,
          },
        };
      }

      // Handle non-200 HTTP statuses
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `ARES API vrátilo neočekávaný stav ${response.status} (${response.statusText || 'Error'}).`,
            httpStatus: response.status,
          },
        };
      }

      // Read text first to verify size limit and JSON validity
      const rawText = await response.text();
      if (rawText.length > this.maxResponseSizeBytes) {
        return {
          success: false,
          error: {
            code: 'RESPONSE_TOO_LARGE',
            message: 'Odpověď z ARES API překročila maximální povolenou velikost (10MB).',
          },
        };
      }

      let parsedJson: AresEconomicSubjectRaw;
      try {
        parsedJson = JSON.parse(rawText);
      } catch {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Odpověď z ARES API není platný formát JSON.',
          },
        };
      }

      // 4. Validate Response Structure
      const structValidation = AresValidator.validateAresResponse(parsedJson);
      if (!structValidation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: structValidation.errors.join(' '),
          },
        };
      }

      // 5. Normalize Data
      const normalized = AresNormalizer.normalizeSubject(parsedJson);

      return {
        success: true,
        subject: normalized,
      };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: `Vypršel časový limit pro dotaz na ARES API (${this.timeoutMs}ms).`,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: `Chyba síťové komunikace s ARES: ${err?.message || 'Neznámá chyba'}`,
        },
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
