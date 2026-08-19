import { AresEconomicSubjectRaw, AresValidationResult } from './types';

/**
 * Validation service for ARES inputs and API responses.
 */
export class AresValidator {
  /**
   * Validates a Czech IČO (Identifikační číslo osoby) using the standard modulo 11 checksum.
   */
  public static validateIco(icoInput: string | number): AresValidationResult {
    const errors: string[] = [];

    if (icoInput === null || icoInput === undefined) {
      return { valid: false, errors: ['IČO nesmí být prázdné.'] };
    }

    // Clean whitespace and normalize to string
    const cleaned = String(icoInput).trim().replace(/\s+/g, '');

    // Check basic length (must be 1 to 8 digits)
    if (!/^\d{1,8}$/.test(cleaned)) {
      return {
        valid: false,
        errors: ['IČO musí obsahovat pouze číslice a mít maximálně 8 znaků.'],
      };
    }

    // Pad with leading zeros to standard 8-digit length
    const padded = cleaned.padStart(8, '0');

    // Modulo 11 check digit verification
    const digits = padded.split('').map(Number);
    const weights = [8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += digits[i] * weights[i];
    }

    const remainder = sum % 11;
    let expectedCheckDigit: number;

    if (remainder === 0) {
      expectedCheckDigit = 1;
    } else if (remainder === 1) {
      expectedCheckDigit = 0;
    } else {
      expectedCheckDigit = 11 - remainder;
    }

    // Edge case if 11 - remainder equals 10, check digit is 1
    if (expectedCheckDigit === 10) {
      expectedCheckDigit = 1;
    }

    const actualCheckDigit = digits[7];

    if (actualCheckDigit !== expectedCheckDigit) {
      errors.push(`Neplatný kontrolní součet IČO (očekáváno ${expectedCheckDigit}, zadáno ${actualCheckDigit}).`);
      return { valid: false, errors, normalizedIco: padded };
    }

    return {
      valid: true,
      errors: [],
      normalizedIco: padded,
    };
  }

  /**
   * Validates that the target URL is a safe HTTPS URL and belongs to an allowed ARES host.
   */
  public static validateTargetUrl(urlString: string): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(urlString);

      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return { valid: false, error: 'Protokol musí být HTTPS.' };
      }

      const hostname = parsed.hostname.toLowerCase();

      // Block SSRF to internal / private addresses
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('172.16.') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return { valid: false, error: 'SSRF ochrana: Volání lokálních a interních adres je zakázáno.' };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'Neplatný formát URL.' };
    }
  }

  /**
   * Validates raw ARES v3 JSON response structure.
   */
  public static validateAresResponse(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Odpověď z ARES API je prázdná nebo není platným JSON objektem.'] };
    }

    if (!data.ico || typeof data.ico !== 'string') {
      errors.push('Odpověď neobsahuje povinné pole "ico".');
    }

    if (!data.obchodniJmeno || typeof data.obchodniJmeno !== 'string') {
      errors.push('Odpověď neobsahuje povinné pole "obchodniJmeno".');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
