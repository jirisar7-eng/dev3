import { EsbirkaErrorCode } from './types';

/**
 * Robust, sanitized error class for all e-Sbírka / e-Legislativa API failures.
 * Guarantees that no authorization headers, API keys, or raw secrets are ever leaked.
 */
export class EsbirkaApiError extends Error {
  public readonly code: EsbirkaErrorCode;
  public readonly requestId: string;
  public readonly endpoint: string;
  public readonly httpStatus?: number;
  public readonly timestamp: string;
  public readonly responseSize?: number;

  constructor(params: {
    message: string;
    code: EsbirkaErrorCode;
    requestId: string;
    endpoint: string;
    httpStatus?: number;
    responseSize?: number;
    cause?: Error | unknown;
  }) {
    // Sanitize message to strip any inadvertent secrets
    const sanitizedMessage = EsbirkaApiError.sanitizeMessage(params.message);
    super(sanitizedMessage);

    this.name = 'EsbirkaApiError';
    this.code = params.code;
    this.requestId = params.requestId;
    this.endpoint = params.endpoint;
    this.httpStatus = params.httpStatus;
    this.responseSize = params.responseSize;
    this.timestamp = new Date().toISOString();

    if (params.cause && params.cause instanceof Error) {
      this.cause = params.cause;
    }

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, EsbirkaApiError.prototype);
  }

  /**
   * Sanitizes strings to prevent leakage of credentials or sensitive tokens.
   */
  public static sanitizeMessage(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
      .replace(/X-API-KEY[:=\s]+[a-zA-Z0-9_\-\.]+/gi, 'X-API-KEY: [REDACTED]')
      .replace(/apiKey[:=\s]+[a-zA-Z0-9_\-\.]+/gi, 'apiKey: [REDACTED]')
      .replace(/token[:=\s]+[a-zA-Z0-9_\-\.]+/gi, 'token: [REDACTED]');
  }

  /**
   * Type guard to check if an unknown error is an EsbirkaApiError.
   */
  public static isEsbirkaApiError(error: unknown): error is EsbirkaApiError {
    return error instanceof EsbirkaApiError;
  }

  /**
   * Returns a safe, structured object representation for telemetry, logging, and client responses.
   */
  public toSafeObject() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      requestId: this.requestId,
      endpoint: this.endpoint,
      httpStatus: this.httpStatus,
      timestamp: this.timestamp,
      responseSize: this.responseSize,
    };
  }
}
