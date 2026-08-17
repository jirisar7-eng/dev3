import crypto from 'crypto';

/**
 * Standardized error codes for the e-Sbírka / e-Legislativa API transport client.
 */
export type EsbirkaErrorCode =
  | 'CONFIGURATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR'
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_JSON'
  | 'INVALID_RESPONSE'
  | 'RESPONSE_TOO_LARGE'
  | 'UNKNOWN_ERROR';

/**
 * Configuration options for initializing the EsbirkaApiClient.
 */
export interface EsbirkaClientConfig {
  /**
   * The HTTPS base URL for e-Sbírka / e-Legislativa REST API.
   * Defaults to process.env.ESBIRKA_BASE_URL or 'https://www.esbirka.cz/api/v1'.
   */
  baseUrl?: string;

  /**
   * The authorization API key.
   * Defaults to process.env.ESBIRKA_API_KEY.
   */
  apiKey?: string;

  /**
   * Request timeout in milliseconds (default: 20000ms / 20 seconds).
   */
  timeoutMs?: number;

  /**
   * Maximum allowed response payload size in bytes (default: 10MB = 10485760 bytes).
   */
  maxResponseSizeBytes?: number;

  /**
   * Minimum required delay between consecutive HTTP requests in ms (default: 1200ms).
   */
  minIntervalMs?: number;

  /**
   * Optional custom fetch implementation for unit testing and dependency injection.
   */
  customFetch?: (url: string, init?: any) => Promise<any>;
}

/**
 * Options for sending an API request.
 */
export interface EsbirkaRequestOptions {
  /**
   * Relative endpoint path (e.g. '/predpisy/2012/89').
   */
  endpoint: string;

  /**
   * HTTP Method (default: 'GET').
   */
  method?: 'GET' | 'HEAD';

  /**
   * Optional custom headers to merge (secrets must not be passed here).
   */
  headers?: Record<string, string>;

  /**
   * Optional ETag for conditional caching (If-None-Match).
   */
  etag?: string;

  /**
   * Optional per-request timeout override.
   */
  timeoutMs?: number;
}

/**
 * Strongly-typed validated response from the e-Sbírka API transport layer.
 */
export interface EsbirkaApiResponse<T = any> {
  /**
   * The parsed and structurally validated JSON payload.
   */
  data: T;

  /**
   * HTTP response status code (e.g. 200, 304).
   */
  status: number;

  /**
   * HTTP status text.
   */
  statusText: string;

  /**
   * Response headers (sanitized, lowercase keys).
   */
  headers: Record<string, string>;

  /**
   * Request duration in milliseconds.
   */
  durationMs: number;

  /**
   * Unique sanitized Request ID (UUIDv4) for audit tracing.
   */
  requestId: string;

  /**
   * Size of the received raw response body in bytes.
   */
  responseSizeBytes: number;

  /**
   * ETag header if provided by the upstream server.
   */
  etag?: string;

  /**
   * Last-Modified header if provided by the upstream server.
   */
  lastModified?: string;

  /**
   * Deterministic SHA-256 hash of the raw response body.
   */
  rawBodyHash: string;
}

/**
 * Sanitized logging payload for transport audits (zero secrets).
 */
export interface EsbirkaLogMetadata {
  timestamp: string;
  requestId: string;
  endpoint: string;
  httpStatus?: number;
  durationMs: number;
  responseBytes?: number;
  errorCode?: EsbirkaErrorCode;
  message?: string;
}
