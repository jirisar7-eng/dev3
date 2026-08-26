import { apiFetch } from '../../utils/apiClient';
/**
 * STATE ADMINISTRATION API HUB - SERVER-SIDE BASE CLIENT
 * Phase 5: High-Security SSRF-Protected HTTP Transport
 */

import { ConnectorResult, StateAdminAuditLog, StateAdminSourceCategory } from './types.js';

export interface StateAdminCacheEntry<T = any> {
  source: StateAdminSourceCategory;
  cacheKey: string;
  data: T[];
  recordsCount: number;
  fetchedAt: string;
  lastSuccessAt: string;
}

export class StateAdminApiClient {
  private static auditLogs: StateAdminAuditLog[] = [];
  private static rateLimiterMap: Map<string, number[]> = new Map();
  private static cacheStore: Map<string, StateAdminCacheEntry> = new Map();

  /**
   * SSRF Protection: Verify host URL is safe and public.
   */
  public static isUrlSsrfSafe(urlStr: string): boolean {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return false;
      }

      const hostname = parsed.hostname.toLowerCase();
      // Block localhost, loopback, private IPv4 ranges
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.endsWith('.local') ||
        hostname.endsWith('.internal')
      ) {
        return false;
      }

      // Block private IP subnets 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      if (
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        return false;
      }

      // Block internal service names (like postgres_db, mailcow, etc.)
      if (hostname.includes('_') || !hostname.includes('.')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check rate limit for source (e.g. max 30 calls/minute per source)
   */
  public static checkRateLimit(source: StateAdminSourceCategory, maxPerMin: number = 30): boolean {
    const now = Date.now();
    const windowStart = now - 60000;
    const timestamps = this.rateLimiterMap.get(source) || [];

    const validTimestamps = timestamps.filter((t) => t > windowStart);
    if (validTimestamps.length >= maxPerMin) {
      return false; // Rate limit exceeded
    }

    validTimestamps.push(now);
    this.rateLimiterMap.set(source, validTimestamps);
    return true;
  }

  /**
   * Server-Side Cache Management for Verified State Admin Data
   */
  public static getCache<T = any>(cacheKey: string): StateAdminCacheEntry<T> | null {
    const entry = this.cacheStore.get(cacheKey);
    if (!entry) return null;
    return entry as StateAdminCacheEntry<T>;
  }

  public static setCache<T = any>(
    cacheKey: string,
    source: StateAdminSourceCategory,
    data: T[]
  ): void {
    if (!Array.isArray(data) || data.length === 0) {
      return; // Never overwrite valid cache with empty or invalid data
    }
    const nowIso = new Date().toISOString();
    this.cacheStore.set(cacheKey, {
      source,
      cacheKey,
      data,
      recordsCount: data.length,
      fetchedAt: nowIso,
      lastSuccessAt: nowIso,
    });
  }

  public static clearCache(): void {
    this.cacheStore.clear();
  }

  /**
   * Execute secure server-side HTTP GET with timeout, SSRF check, rate limiting, and audit logging.
   */
  public static async executeGet<T>(
    source: StateAdminSourceCategory,
    urlStr: string,
    headers: Record<string, string> = {},
    timeoutMs: number = 10000,
    maxRetries: number = 1
  ): Promise<{ status: number; data: any; durationMs: number; error?: string }> {
    const startTime = Date.now();

    // 1. Browser Defense Check
    if (typeof window !== 'undefined') {
      const durationMs = Date.now() - startTime;
      this.recordAudit(source, urlStr, 403, durationMs, false, 0, 'Browser execution forbidden (SSRF defense)');
      return {
        status: 403,
        data: null,
        durationMs,
        error: 'CLIENT_EXECUTION_FORBIDDEN: State Admin APIs must be invoked exclusively server-side.',
      };
    }

    // 2. SSRF Protection
    if (!this.isUrlSsrfSafe(urlStr)) {
      const durationMs = Date.now() - startTime;
      this.recordAudit(source, urlStr, 400, durationMs, false, 0, 'SSRF validation failed for target URL');
      return {
        status: 400,
        data: null,
        durationMs,
        error: 'INVALID_URL_SSRF_BLOCKED: Target URL failed security validation.',
      };
    }

    // 3. Rate Limit Check
    if (!this.checkRateLimit(source)) {
      const durationMs = Date.now() - startTime;
      this.recordAudit(source, urlStr, 429, durationMs, false, 0, 'Rate limit exceeded');
      return {
        status: 429,
        data: null,
        durationMs,
        error: 'RATE_LIMIT_EXCEEDED: Maximum requests per minute exceeded for connector.',
      };
    }

    let lastError: any = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      attempts++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await apiFetch(urlStr, {
          method: 'GET',
          headers: {
            'User-Agent': 'TataMaPravo-StateAdminHub/1.0 (+https://ai.tatovacesta.cz)',
            Accept: 'application/json, text/plain, */*',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          if ((response.status === 502 || response.status === 503 || response.status === 504) && attempts <= maxRetries) {
            await new Promise((r) => setTimeout(r, 200));
            continue;
          }
          this.recordAudit(source, urlStr, response.status, durationMs, false, 0, `HTTP ${response.status}`);
          return {
            status: response.status,
            data: null,
            durationMs,
            error: `UPSTREAM_HTTP_ERROR_${response.status}`,
          };
        }

        const json = await response.json().catch(() => null);
        if (!json) {
          this.recordAudit(source, urlStr, 200, durationMs, false, 0, 'Invalid JSON response payload');
          return {
            status: 422,
            data: null,
            durationMs,
            error: 'INVALID_JSON_PAYLOAD: Response could not be parsed as valid JSON.',
          };
        }

        this.recordAudit(source, urlStr, 200, durationMs, true, Array.isArray(json) ? json.length : 1);
        return {
          status: 200,
          data: json,
          durationMs,
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        if (attempts <= maxRetries) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const isTimeout = lastError?.name === 'AbortError';
    const status = isTimeout ? 504 : 500;
    const errorMsg = isTimeout ? 'TIMEOUT: Upstream API failed to respond within limit.' : lastError?.message || 'Fetch failed';

    this.recordAudit(source, urlStr, status, durationMs, false, 0, errorMsg);
    return {
      status,
      data: null,
      durationMs,
      error: isTimeout ? 'UPSTREAM_TIMEOUT' : `FETCH_ERROR: ${errorMsg}`,
    };
  }

  /**
   * Execute secure server-side SPARQL query against NKOD (https://data.gov.cz/sparql)
   */
  public static async executeSparqlQuery(
    source: StateAdminSourceCategory,
    sparqlQuery: string,
    timeoutMs: number = 10000,
    maxRetries: number = 1
  ): Promise<{ status: number; data: any; durationMs: number; error?: string }> {
    const sparqlEndpoint = 'https://data.gov.cz/sparql';
    const startTime = Date.now();

    // 1. Browser Defense
    if (typeof window !== 'undefined') {
      const durationMs = Date.now() - startTime;
      this.recordAudit(source, sparqlEndpoint, 403, durationMs, false, 0, 'Browser execution forbidden (SSRF defense)');
      return {
        status: 403,
        data: null,
        durationMs,
        error: 'CLIENT_EXECUTION_FORBIDDEN: SPARQL queries must be executed exclusively server-side.',
      };
    }

    // 2. SSRF Protection
    if (!this.isUrlSsrfSafe(sparqlEndpoint)) {
      const durationMs = Date.now() - startTime;
      this.recordAudit(source, sparqlEndpoint, 400, durationMs, false, 0, 'SSRF validation failed for SPARQL endpoint');
      return {
        status: 400,
        data: null,
        durationMs,
        error: 'INVALID_URL_SSRF_BLOCKED: SPARQL endpoint failed security validation.',
      };
    }

    // 3. Rate Limit Check
    if (!this.checkRateLimit(source)) {
      const durationMs = Date.now() - startTime;
      this.recordAudit(source, sparqlEndpoint, 429, durationMs, false, 0, 'Rate limit exceeded');
      return {
        status: 429,
        data: null,
        durationMs,
        error: 'RATE_LIMIT_EXCEEDED: Maximum requests per minute exceeded for connector.',
      };
    }

    let lastError: any = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      attempts++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await apiFetch(sparqlEndpoint, {
          method: 'POST',
          headers: {
            'User-Agent': 'TataMaPravo-StateAdminHub/1.0 (+https://ai.tatovacesta.cz)',
            Accept: 'application/sparql-results+json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `query=${encodeURIComponent(sparqlQuery)}`,
          signal: controller.signal,
        });

        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          if ((response.status === 502 || response.status === 503 || response.status === 504) && attempts <= maxRetries) {
            await new Promise((r) => setTimeout(r, 200));
            continue;
          }
          this.recordAudit(source, sparqlEndpoint, response.status, durationMs, false, 0, `SPARQL HTTP ${response.status}`);
          return {
            status: response.status,
            data: null,
            durationMs,
            error: `UPSTREAM_HTTP_ERROR_${response.status}`,
          };
        }

        const json = await response.json().catch(() => null);
        if (!json || !json.results || !Array.isArray(json.results.bindings)) {
          this.recordAudit(source, sparqlEndpoint, 200, durationMs, false, 0, 'Invalid SPARQL JSON bindings response');
          return {
            status: 422,
            data: null,
            durationMs,
            error: 'INVALID_SPARQL_RESPONSE: Response does not contain valid SPARQL result bindings.',
          };
        }

        const bindings = json.results.bindings;
        this.recordAudit(source, sparqlEndpoint, 200, durationMs, true, bindings.length);
        return {
          status: 200,
          data: bindings,
          durationMs,
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        if (attempts <= maxRetries) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const isTimeout = lastError?.name === 'AbortError';
    const status = isTimeout ? 504 : 500;
    const errorMsg = isTimeout ? 'TIMEOUT: SPARQL endpoint failed to respond within limit.' : lastError?.message || 'Fetch failed';

    this.recordAudit(source, sparqlEndpoint, status, durationMs, false, 0, errorMsg);
    return {
      status,
      data: null,
      durationMs,
      error: isTimeout ? 'UPSTREAM_TIMEOUT' : `SPARQL_FETCH_ERROR: ${errorMsg}`,
    };
  }

  /**
   * Audit Logger
   */
  private static recordAudit(
    source: StateAdminSourceCategory,
    endpoint: string,
    httpStatus: number,
    durationMs: number,
    success: boolean,
    recordsCount: number,
    errorMessage?: string
  ) {
    const audit: StateAdminAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      source,
      endpoint,
      httpStatus,
      durationMs,
      success,
      recordsCount,
      errorMessage,
      timestamp: new Date(),
    };
    this.auditLogs.unshift(audit);
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  public static getAuditLogs(source?: StateAdminSourceCategory): StateAdminAuditLog[] {
    if (source) {
      return this.auditLogs.filter((a) => a.source === source);
    }
    return [...this.auditLogs];
  }

  public static resetForTesting(): void {
    this.auditLogs = [];
    this.rateLimiterMap.clear();
    this.cacheStore.clear();
  }
}
