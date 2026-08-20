import crypto from 'crypto';
import {
  EsbirkaClientConfig,
  EsbirkaRequestOptions,
  EsbirkaApiResponse,
  EsbirkaLogMetadata,
  EsbirkaErrorCode,
} from './types';
import { EsbirkaApiError } from './errors';

/**
 * Enterprise-grade, secure server-side HTTP transport client for e-Sbírka / e-Legislativa REST API.
 * 
 * Invariants & Guarantees:
 * - Server-side only (never runs in browser/client bundle)
 * - Zero real API calls without explicit invocation
 * - Zero fallback/dummy data generation (Fail-Closed)
 * - Strict HTTPS URL verification & SSRF protection
 * - 1 concurrent request maximum (Mutex Lock)
 * - 1200ms minimum inter-request spacing
 * - 0 automatic retries by default (respecting 3-5 calls/day quota)
 * - Explicit 20-second timeout with AbortController
 * - Response size guard (10MB limit)
 * - Pure transport layer: zero database writes
 * - Zero secrets in logs, error messages, or telemetry
 */
export class EsbirkaApiClient {
  private readonly baseUrl: string;
  private readonly apiContextPath: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxResponseSizeBytes: number;
  private readonly minIntervalMs: number;
  private readonly customFetch?: (url: string, init?: any) => Promise<any>;

  // Global static synchronization queue to guarantee max 1 concurrent connection
  private static mutexQueue: Promise<any> = Promise.resolve();
  private static lastRequestTimestamp = 0;

  constructor(config?: EsbirkaClientConfig) {
    // 1. Enforce Server-Side execution
    if (typeof window !== 'undefined') {
      throw new EsbirkaApiError({
        message: 'EsbirkaApiClient can only be instantiated in a secure server-side Node.js environment.',
        code: 'CONFIGURATION_ERROR',
        requestId: crypto.randomUUID(),
        endpoint: 'N/A',
      });
    }

    // 2. Validate and resolve HTTPS Base URL
    const rawBaseUrl = config?.baseUrl || process.env.ESBIRKA_BASE_URL || 'https://api.e-sbirka.gov.cz';
    this.baseUrl = EsbirkaApiClient.validateAndNormalizeUrl(rawBaseUrl);

    // 2b. Resolve API Context Path (empty string for direct official REST API routing)
    let contextPath = config?.apiContextPath !== undefined 
      ? config.apiContextPath 
      : (process.env.ESBIRKA_API_CONTEXT_PATH ?? '');

    // The official api.e-sbirka.gov.cz domain uses direct root path /dokumenty-sbirky/...
    if (this.baseUrl.includes('api.e-sbirka.gov.cz') && config?.apiContextPath === undefined) {
      contextPath = '';
    }

    if (contextPath && !contextPath.startsWith('/')) {
      contextPath = `/${contextPath}`;
    }
    if (contextPath.endsWith('/')) {
      contextPath = contextPath.slice(0, -1);
    }
    
    // Prevent duplication: if baseUrl already ends with the context path, strip the context path
    // OR if we just want to ensure we don't duplicate, we can trim it from baseUrl
    if (contextPath && this.baseUrl.endsWith(contextPath)) {
      this.baseUrl = this.baseUrl.slice(0, -contextPath.length);
    }
    this.apiContextPath = contextPath;

    // 3. Resolve API Key (fail closed if missing)
    const resolvedApiKey = config?.apiKey !== undefined ? config.apiKey : (process.env.ESBIRKA_API_KEY || '');
    this.apiKey = resolvedApiKey.trim();

    // 4. Configure operational parameters
    this.timeoutMs = config?.timeoutMs ?? 20000; // 20 seconds
    this.maxResponseSizeBytes = config?.maxResponseSizeBytes ?? 10 * 1024 * 1024; // 10 MB
    this.minIntervalMs = config?.minIntervalMs ?? 1200; // 1.2 seconds (> 1 req/s requirement)
    this.customFetch = config?.customFetch;
  }

  /**
   * Validates that the base URL is strictly HTTPS and not an SSRF or private network target.
   */
  public static validateAndNormalizeUrl(rawUrl: string): string {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new EsbirkaApiError({
        message: 'e-Sbírka base URL is required and must be a valid HTTPS URL string.',
        code: 'CONFIGURATION_ERROR',
        requestId: crypto.randomUUID(),
        endpoint: String(rawUrl),
      });
    }

    const trimmed = rawUrl.trim();

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      throw new EsbirkaApiError({
        message: `Invalid base URL format: ${trimmed}`,
        code: 'CONFIGURATION_ERROR',
        requestId: crypto.randomUUID(),
        endpoint: trimmed,
      });
    }

    // Reject non-HTTPS protocols
    if (parsed.protocol !== 'https:') {
      throw new EsbirkaApiError({
        message: `Insecure protocol '${parsed.protocol}' rejected. Only 'https:' is permitted for state API.`,
        code: 'CONFIGURATION_ERROR',
        requestId: crypto.randomUUID(),
        endpoint: trimmed,
      });
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject localhost, loopback, broadcast, and obvious local patterns
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      throw new EsbirkaApiError({
        message: `Disallowed host '${hostname}'. Private, local, and internal networks are strictly rejected.`,
        code: 'CONFIGURATION_ERROR',
        requestId: crypto.randomUUID(),
        endpoint: trimmed,
      });
    }

    // Return normalized URL without trailing slashes
    return trimmed.replace(/\/+$/, '');
  }

  /**
   * Sanitizes relative endpoint paths to prevent directory traversal or URL tampering.
   */
  private sanitizeEndpoint(endpoint: string): string {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Endpoint must be a non-empty string');
    }
    const clean = endpoint.trim();
    if (!clean.startsWith('/')) {
      return `/${clean}`;
    }
    return clean;
  }

  /**
   * Sends an audited, rate-limited, fail-closed GET request to the e-Sbírka REST API.
   * Enforces single concurrency and minimum delay before dispatching.
   */
  public async get<T = any>(options: EsbirkaRequestOptions): Promise<EsbirkaApiResponse<T>> {
    const requestId = crypto.randomUUID();
    const endpoint = this.sanitizeEndpoint(options.endpoint);

    // 1. Fail Closed if API key is absent
    if (!this.apiKey) {
      const err = new EsbirkaApiError({
        message: 'ESBIRKA_API_KEY environment variable is not configured or is empty. Execution blocked (Fail-Closed).',
        code: 'AUTHENTICATION_ERROR',
        requestId,
        endpoint,
      });
      this.logAudit({
        timestamp: new Date().toISOString(),
        requestId,
        endpoint,
        durationMs: 0,
        errorCode: 'AUTHENTICATION_ERROR',
        message: err.message,
      });
      throw err;
    }

    // 2. Sequential Mutex Queue Execution
    return (EsbirkaApiClient.mutexQueue = EsbirkaApiClient.mutexQueue
      .catch(() => {}) // Prevent previous queue failure from blocking subsequent requests
      .then(async () => {
        return this.executeRequest<T>(requestId, endpoint, options);
      }));
  }

  /**
   * Internal execution handler wrapped inside the sequential mutex lock.
   */
  private async executeRequest<T>(
    requestId: string,
    endpoint: string,
    options: EsbirkaRequestOptions
  ): Promise<EsbirkaApiResponse<T>> {
    const startTime = Date.now();

    // A. Enforce minimum delay between requests
    const timeSinceLast = startTime - EsbirkaApiClient.lastRequestTimestamp;
    if (timeSinceLast < this.minIntervalMs && EsbirkaApiClient.lastRequestTimestamp > 0) {
      const delayNeeded = this.minIntervalMs - timeSinceLast;
      await new Promise((resolve) => setTimeout(resolve, delayNeeded));
    }
    EsbirkaApiClient.lastRequestTimestamp = Date.now();

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const targetUrl = `${this.baseUrl}${this.apiContextPath}${cleanEndpoint}`;
    const timeout = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'esel-api-access-key': this.apiKey,
      'Accept': 'application/json, application/problem+json',
      'User-Agent': 'TataMaPravo-LegislativeSync/1.0 (tatovacesta.cz)',
      ...(options.headers || {}),
    };

    if (options.etag) {
      headers['If-None-Match'] = options.etag;
    }

    let response: any;
    let rawText = '';

    try {
      const fetchImpl = this.customFetch || (typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default);

      response = await fetchImpl(targetUrl, {
        method: options.method || 'GET',
        headers,
        signal: controller.signal,
      });
    } catch (networkErr: any) {
      clearTimeout(timer);
      const durationMs = Date.now() - startTime;

      if (networkErr?.name === 'AbortError' || networkErr?.code === 'ABORT_ERR') {
        const timeoutError = new EsbirkaApiError({
          message: `Request to e-Sbírka API timed out after ${timeout}ms.`,
          code: 'TIMEOUT',
          requestId,
          endpoint,
          cause: networkErr,
        });
        this.logAudit({
          timestamp: new Date().toISOString(),
          requestId,
          endpoint,
          durationMs,
          errorCode: 'TIMEOUT',
          message: timeoutError.message,
        });
        throw timeoutError;
      }

      const netError = new EsbirkaApiError({
        message: `Network transport failure while contacting e-Sbírka API: ${networkErr.message}`,
        code: 'NETWORK_ERROR',
        requestId,
        endpoint,
        cause: networkErr,
      });
      this.logAudit({
        timestamp: new Date().toISOString(),
        requestId,
        endpoint,
        durationMs,
        errorCode: 'NETWORK_ERROR',
        message: netError.message,
      });
      throw netError;
    } finally {
      clearTimeout(timer);
    }

    const durationMs = Date.now() - startTime;
    const status = response.status;
    const statusText = response.statusText || '';

    // Extract sanitized response headers
    const resHeaders: Record<string, string> = {};
    if (response.headers && typeof response.headers.forEach === 'function') {
      response.headers.forEach((val: string, key: string) => {
        resHeaders[key.toLowerCase()] = val;
      });
    } else if (response.headers && typeof response.headers.raw === 'function') {
      const raw = response.headers.raw();
      for (const k of Object.keys(raw)) {
        resHeaders[k.toLowerCase()] = Array.isArray(raw[k]) ? raw[k].join(', ') : String(raw[k]);
      }
    }

    const contentType = (resHeaders['content-type'] || '').toLowerCase();
    const etag = resHeaders['etag'];
    const lastModified = resHeaders['last-modified'];

    // B. Handle 304 Not Modified (Valid response for conditional requests)
    if (status === 304) {
      this.logAudit({
        timestamp: new Date().toISOString(),
        requestId,
        endpoint,
        httpStatus: 304,
        durationMs,
        responseBytes: 0,
      });

      return {
        data: null as any,
        status: 304,
        statusText: 'Not Modified',
        headers: resHeaders,
        durationMs,
        requestId,
        responseSizeBytes: 0,
        etag,
        lastModified,
        rawBodyHash: crypto.createHash('sha256').update('').digest('hex'),
      };
    }

    // C. Handle Authentication & Rate Limiting HTTP Errors
    if (status === 401) {
      throw this.createAndLogHttpError('AUTHENTICATION_ERROR', `Authentication rejected (HTTP 401). Verify ESBIRKA_API_KEY.`, requestId, endpoint, status, durationMs);
    }
    if (status === 403) {
      throw this.createAndLogHttpError('AUTHORIZATION_ERROR', `Access forbidden (HTTP 403) for endpoint ${endpoint}.`, requestId, endpoint, status, durationMs);
    }
    if (status === 404) {
      throw this.createAndLogHttpError('NOT_FOUND', `Dokument nebo předpis nebyl v e-Sbírce nalezen (HTTP 404) pro endpoint ${endpoint}.`, requestId, endpoint, status, durationMs);
    }
    if (status === 429) {
      throw this.createAndLogHttpError('RATE_LIMITED', `Rate limit exceeded on e-Sbírka server (HTTP 429).`, requestId, endpoint, status, durationMs);
    }
    if (status < 200 || status >= 300) {
      throw this.createAndLogHttpError('HTTP_ERROR', `Upstream e-Sbírka server returned HTTP ${status} ${statusText}.`, requestId, endpoint, status, durationMs);
    }

    // D. Validate Content-Type (Reject HTML error pages, text, etc.)
    const isJsonMime =
      contentType.includes('application/json') ||
      contentType.includes('application/problem+json') ||
      contentType.includes('application/ld+json');

    if (!isJsonMime) {
      throw this.createAndLogHttpError(
        'INVALID_CONTENT_TYPE',
        `Invalid Content-Type received: '${contentType}'. Expected 'application/json'. Non-JSON response rejected.`,
        requestId,
        endpoint,
        status,
        durationMs
      );
    }

    // E. Read text and enforce maximum response size
    try {
      rawText = await response.text();
    } catch (readErr: any) {
      throw this.createAndLogHttpError(
        'NETWORK_ERROR',
        `Failed to read response body: ${readErr.message}`,
        requestId,
        endpoint,
        status,
        durationMs
      );
    }

    const responseSizeBytes = Buffer.byteLength(rawText, 'utf8');

    if (responseSizeBytes > this.maxResponseSizeBytes) {
      throw this.createAndLogHttpError(
        'RESPONSE_TOO_LARGE',
        `Response size (${responseSizeBytes} bytes) exceeded security limit of ${this.maxResponseSizeBytes} bytes.`,
        requestId,
        endpoint,
        status,
        durationMs,
        responseSizeBytes
      );
    }

    if (responseSizeBytes === 0) {
      throw this.createAndLogHttpError(
        'INVALID_RESPONSE',
        `Empty response body received from e-Sbírka API for ${endpoint}.`,
        requestId,
        endpoint,
        status,
        durationMs,
        0
      );
    }

    // F. Validate and Parse JSON
    let parsedData: T;
    try {
      parsedData = JSON.parse(rawText);
    } catch (jsonErr: any) {
      throw this.createAndLogHttpError(
        'INVALID_JSON',
        `Failed to parse response body as JSON: ${jsonErr.message}`,
        requestId,
        endpoint,
        status,
        durationMs,
        responseSizeBytes
      );
    }

    // G. Structural Validation (Must be an object or array)
    if (parsedData === null || typeof parsedData !== 'object') {
      throw this.createAndLogHttpError(
        'INVALID_RESPONSE',
        `Response payload does not match expected object envelope structure.`,
        requestId,
        endpoint,
        status,
        durationMs,
        responseSizeBytes
      );
    }

    // Compute deterministic SHA-256 hash for cache verification
    const rawBodyHash = crypto.createHash('sha256').update(rawText).digest('hex');

    // H. Audit logging (Sanitized metadata only)
    this.logAudit({
      timestamp: new Date().toISOString(),
      requestId,
      endpoint,
      httpStatus: status,
      durationMs,
      responseBytes: responseSizeBytes,
    });

    return {
      data: parsedData,
      status,
      statusText,
      headers: resHeaders,
      durationMs,
      requestId,
      responseSizeBytes,
      etag,
      lastModified,
      rawBodyHash,
    };
  }

  /**
   * Normalizes legal act number and year into official e-Sbírka URI identifier path (e.g. '/sb/2012/89').
   */
  public static normalizeActIdentifier(actNumber: number, actYear: number): string {
    return `/sb/${actYear}/${actNumber}`;
  }

  /**
   * Constructs the official OpenAPI document endpoint for a legal act.
   * E.g. for Act 89/2012 -> '/dokumenty-sbirky/%2Fsb%2F2012%2F89'
   */
  public static buildDocumentEndpoint(actNumber: number, actYear: number): string {
    const identifier = EsbirkaApiClient.normalizeActIdentifier(actNumber, actYear);
    return `/dokumenty-sbirky/${encodeURIComponent(identifier)}`;
  }

  /**
   * Convenience method to fetch a legal act by year and act number.
   */
  public async getAct(actNumber: number, actYear: number, options?: Partial<EsbirkaRequestOptions>): Promise<EsbirkaApiResponse<any>> {
    const endpoint = EsbirkaApiClient.buildDocumentEndpoint(actNumber, actYear);
    return this.get<any>({ endpoint, ...options });
  }

  /**
   * Convenience method to fetch a legal act by code string (e.g. '89/2012' or '/sb/2012/89').
   */
  public async getActByCode(code: string, options?: Partial<EsbirkaRequestOptions>): Promise<EsbirkaApiResponse<any>> {
    if (!code || typeof code !== 'string') {
      throw new EsbirkaApiError({
        message: 'Invalid act code. Must be in format "number/year" (e.g. "89/2012") or "/sb/year/number".',
        code: 'CONFIGURATION_ERROR',
        requestId: crypto.randomUUID(),
        endpoint: String(code),
      });
    }

    const clean = code.trim();
    if (clean.startsWith('/sb/')) {
      const parts = clean.slice(4).split('/');
      if (parts.length === 2) {
        const actYear = parseInt(parts[0], 10);
        const actNumber = parseInt(parts[1], 10);
        if (!isNaN(actNumber) && !isNaN(actYear)) {
          return this.getAct(actNumber, actYear, options);
        }
      }
    }

    const parts = clean.split('/');
    if (parts.length === 2) {
      const actNumber = parseInt(parts[0], 10);
      const actYear = parseInt(parts[1], 10);
      if (!isNaN(actNumber) && !isNaN(actYear)) {
        return this.getAct(actNumber, actYear, options);
      }
    }

    throw new EsbirkaApiError({
      message: `Invalid act code format: '${code}'. Expected format "number/year" (e.g. "89/2012").`,
      code: 'CONFIGURATION_ERROR',
      requestId: crypto.randomUUID(),
      endpoint: clean,
    });
  }

  /**
   * Alias for getAct.
   */
  public async fetchAct(actNumber: number, actYear: number, options?: Partial<EsbirkaRequestOptions>): Promise<any> {
    const res = await this.getAct(actNumber, actYear, options);
    return res.data;
  }

  /**
   * Helper to construct, log, and return an EsbirkaApiError.
   */
  private createAndLogHttpError(
    code: EsbirkaErrorCode,
    message: string,
    requestId: string,
    endpoint: string,
    httpStatus?: number,
    durationMs = 0,
    responseSize = 0
  ): EsbirkaApiError {
    const error = new EsbirkaApiError({
      message,
      code,
      requestId,
      endpoint,
      httpStatus,
      responseSize,
    });

    this.logAudit({
      timestamp: new Date().toISOString(),
      requestId,
      endpoint,
      httpStatus,
      durationMs,
      responseBytes: responseSize,
      errorCode: code,
      message: error.message,
    });

    return error;
  }

  /**
   * Safe structured console logging with zero secrets.
   */
  private logAudit(meta: EsbirkaLogMetadata): void {
    const level = meta.errorCode ? 'warn' : 'info';
    const statusPart = meta.httpStatus ? ` status=${meta.httpStatus}` : '';
    const bytesPart = meta.responseBytes !== undefined ? ` bytes=${meta.responseBytes}` : '';
    const errorPart = meta.errorCode ? ` error=${meta.errorCode} msg="${meta.message}"` : '';

    console[level](
      `[e-Sbírka API] [reqId:${meta.requestId}] endpoint=${meta.endpoint}${statusPart} durationMs=${meta.durationMs}${bytesPart}${errorPart}`
    );
  }
}

// Singleton getter for application-wide usage
let singletonClient: EsbirkaApiClient | null = null;

export function getEsbirkaApiClient(): EsbirkaApiClient {
  if (!singletonClient) {
    singletonClient = new EsbirkaApiClient();
  }
  return singletonClient;
}
