/**
 * Sanitization module for AI Prompts.
 * Ensures no passwords, secrets, JWT tokens, MFA secrets, API keys, or PII leave the server environment.
 */

// JWT Token pattern (eyJ...)
const JWT_REGEX = /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;

// Generic API key patterns (xai-..., AIzaSy..., sk-..., Bearer ...)
const API_KEY_REGEX = /(?:xai-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|sk-[a-zA-Z0-9]{20,}|bearer\s+[a-zA-Z0-9._-]{20,}|token[=:]\s*["']?[a-zA-Z0-9._-]{20,}["']?)/gi;

// Password / secret fields in JSON or key-value format
const PASSWORD_SECRET_REGEX = /"(?:password|passwordHash|totpSecret|mfaSecret|secret|token|api_key|apiKey|jwt|accessToken|refreshToken)":\s*"[^"]*"/gi;

// Key-value pairs like password=XYZ or JWT=XYZ
const KEY_VALUE_SECRET_REGEX = /\b(?:password|passwordHash|totpSecret|mfaSecret|secret|jwt_secret)=([^\s&;]+)/gi;

// Rodné číslo (Czech Identity Number) pattern: e.g. 850101/1234 or 8501011234
const CZECH_RC_REGEX = /\b\d{6}\/?\d{3,4}\b/g;

// Email address pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function sanitizeText(text: string): string {
  if (!text) return text;

  let sanitized = text;

  // 1. Redact JWT tokens
  sanitized = sanitized.replace(JWT_REGEX, '[REDACTED_JWT_TOKEN]');

  // 2. Redact API Keys
  sanitized = sanitized.replace(API_KEY_REGEX, '[REDACTED_API_KEY]');

  // 3. Redact Password / Secret fields in JSON
  sanitized = sanitized.replace(PASSWORD_SECRET_REGEX, (match) => {
    const key = match.split(':')[0];
    return `${key}: "[REDACTED_SECRET]"`;
  });

  // 4. Redact Key-Value secret parameters
  sanitized = sanitized.replace(KEY_VALUE_SECRET_REGEX, (match) => {
    const key = match.split('=')[0];
    return `${key}=[REDACTED_SECRET]`;
  });

  // 5. Redact Czech Rodné Číslo (PII)
  sanitized = sanitized.replace(CZECH_RC_REGEX, '[REDACTED_RC_PII]');

  // 6. Redact Emails (PII)
  sanitized = sanitized.replace(EMAIL_REGEX, '[REDACTED_EMAIL]');

  return sanitized;
}

export function sanitizeInputData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeText(data) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInputData(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      // Redact sensitive keys directly
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('totp') ||
        lowerKey.includes('mfasecret') ||
        lowerKey.includes('jwt') ||
        lowerKey.includes('apikey') ||
        lowerKey.includes('secret')
      ) {
        sanitizedObj[key] = '[REDACTED_SECRET]';
      } else {
        sanitizedObj[key] = sanitizeInputData(value);
      }
    }
    return sanitizedObj as T;
  }

  return data;
}
