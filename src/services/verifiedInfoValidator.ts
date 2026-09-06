import { StateAdminApiClient } from './stateAdmin/StateAdminApiClient';
import {
  DayOpeningHours,
  OpeningIntervalType,
  TimeInterval,
  WeeklyOpeningHours,
} from '../types/verifiedSubjectInfo';

const ALLOWED_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const ALLOWED_INTERVAL_TYPES: OpeningIntervalType[] = ['STANDARD', 'APPOINTMENT_ONLY', 'FILING_OFFICE'];
const ALLOWED_FIELD_KEYS = new Set([
  'officialWebsite',
  'officialPhone',
  'officialEmail',
  'openingHours',
  'appointmentRequired',
  'bookingUrl',
  'accessibility',
  'dataBoxId',
  'submissionMethods',
  'parkingInfo',
  'publicTransport',
  'crisisContacts',
  'departments',
]);

export class VerifiedInfoValidator {
  /**
   * Validates HH:mm 24-hour time format.
   */
  public static validateTimeFormat(timeStr: string): boolean {
    if (typeof timeStr !== 'string') return false;
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr.trim());
  }

  /**
   * Converts HH:mm to minutes since midnight for comparison.
   */
  public static timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.trim().split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Validates a single opening interval (from < to).
   */
  public static validateInterval(
    from: string,
    to: string,
    type?: OpeningIntervalType
  ): { valid: boolean; error?: string; interval?: TimeInterval } {
    if (!this.validateTimeFormat(from)) {
      return { valid: false, error: `Neplatný formát času 'od': ${from} (očekává se HH:mm)` };
    }
    if (!this.validateTimeFormat(to)) {
      return { valid: false, error: `Neplatný formát času 'do': ${to} (očekává se HH:mm)` };
    }

    const fromMin = this.timeToMinutes(from);
    const toMin = this.timeToMinutes(to);

    if (fromMin >= toMin) {
      return { valid: false, error: `Čas začátku intervalu (${from}) musí být dřívější než čas konce (${to})` };
    }

    const intervalType: OpeningIntervalType = type && ALLOWED_INTERVAL_TYPES.includes(type) ? type : 'STANDARD';

    return {
      valid: true,
      interval: {
        from: from.trim(),
        to: to.trim(),
        type: intervalType,
      },
    };
  }

  /**
   * Validates day opening hours.
   */
  public static validateDayOpeningHours(
    day: unknown,
    dayName = 'den'
  ): { valid: boolean; error?: string; normalized?: DayOpeningHours } {
    if (!day || typeof day !== 'object') {
      return { valid: false, error: `Chybí objekt úředních hodin pro ${dayName}` };
    }

    const d = day as any;
    const isOpen = Boolean(d.isOpen);

    if (!isOpen) {
      return {
        valid: true,
        normalized: {
          isOpen: false,
          intervals: [],
          note: typeof d.note === 'string' ? this.sanitizeText(d.note, 300) : undefined,
        },
      };
    }

    if (!Array.isArray(d.intervals) || d.intervals.length === 0) {
      return { valid: false, error: `Pro otevřený den (${dayName}) musí být definován alespoň jeden časový interval` };
    }

    if (d.intervals.length > 5) {
      return { valid: false, error: `Maximální počet časových intervalů na den (${dayName}) je 5` };
    }

    const validatedIntervals: TimeInterval[] = [];

    for (let i = 0; i < d.intervals.length; i++) {
      const item = d.intervals[i];
      if (!item || typeof item !== 'object') {
        return { valid: false, error: `Neplatný interval na pozici ${i + 1} pro ${dayName}` };
      }

      const res = this.validateInterval(item.from, item.to, item.type);
      if (!res.valid || !res.interval) {
        return { valid: false, error: `Chyba v intervalu ${i + 1} pro ${dayName}: ${res.error}` };
      }

      validatedIntervals.push(res.interval);
    }

    // Sort intervals and check for overlap
    validatedIntervals.sort((a, b) => this.timeToMinutes(a.from) - this.timeToMinutes(b.from));

    for (let i = 0; i < validatedIntervals.length - 1; i++) {
      const currentEnd = this.timeToMinutes(validatedIntervals[i].to);
      const nextStart = this.timeToMinutes(validatedIntervals[i + 1].from);
      if (currentEnd > nextStart) {
        return {
          valid: false,
          error: `Časové intervaly pro ${dayName} se nesmí překrývat (${validatedIntervals[i].from}-${validatedIntervals[i].to} vs ${validatedIntervals[i + 1].from}-${validatedIntervals[i + 1].to})`,
        };
      }
    }

    return {
      valid: true,
      normalized: {
        isOpen: true,
        intervals: validatedIntervals,
        note: typeof d.note === 'string' ? this.sanitizeText(d.note, 300) : undefined,
      },
    };
  }

  /**
   * Validates Czech phone format (+420...).
   */
  public static validatePhone(phone: string | null | undefined): { valid: boolean; error?: string; normalized?: string } {
    if (!phone || typeof phone !== 'string') {
      return { valid: false, error: 'Telefonní číslo je povinné' };
    }
    const cleaned = phone.trim().replace(/\s+/g, ' ');
    if (!/^\+420\s?\d{3}\s?\d{3}\s?\d{3}$/.test(cleaned) && !/^\+420\d{9}$/.test(cleaned)) {
      return { valid: false, error: 'Neplatný formát telefonního čísla (očekává se +420 XXX XXX XXX)' };
    }
    return { valid: true, normalized: cleaned };
  }

  /**
   * Validates email format.
   */
  public static validateEmail(email: string | null | undefined): { valid: boolean; error?: string; normalized?: string } {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Emailová adresa je povinná' };
    }
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { valid: false, error: 'Neplatný formát emailové adresy' };
    }
    return { valid: true, normalized: trimmed };
  }

  /**
   * Validates ISDS DataBox ID (7 alphanumeric characters).
   */
  public static validateDataBoxId(dataBoxId: string | null | undefined): { valid: boolean; error?: string; normalized?: string } {
    if (!dataBoxId || typeof dataBoxId !== 'string') {
      return { valid: false, error: 'ID datové schránky je povinné' };
    }
    const trimmed = dataBoxId.trim();
    if (!/^[a-zA-Z0-9]{7}$/.test(trimmed)) {
      return { valid: false, error: 'ID datové schránky musí mít přesně 7 alfanumerických znaků' };
    }
    return { valid: true, normalized: trimmed };
  }

  /**
   * Alias for validateWeeklyOpeningHours.
   */
  public static validateOpeningHours(
    data: unknown
  ): { valid: boolean; error?: string; normalized?: WeeklyOpeningHours } {
    return this.validateWeeklyOpeningHours(data);
  }

  /**
   * Validates complete 7-day weekly opening hours structure.
   */
  public static validateWeeklyOpeningHours(
    data: unknown
  ): { valid: boolean; error?: string; normalized?: WeeklyOpeningHours } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Chybí objekt týdenních úředních hodin' };
    }

    const w = data as any;
    const normalized: Partial<WeeklyOpeningHours> = {};

    for (const dayKey of ALLOWED_DAYS) {
      const res = this.validateDayOpeningHours(w[dayKey], dayKey);
      if (!res.valid || !res.normalized) {
        return { valid: false, error: res.error };
      }
      normalized[dayKey] = res.normalized;
    }

    if (w.irregularScheduleNote && typeof w.irregularScheduleNote === 'string') {
      normalized.irregularScheduleNote = this.sanitizeText(w.irregularScheduleNote, 500);
    }

    normalized.lastUpdated = new Date().toISOString();

    return {
      valid: true,
      normalized: normalized as WeeklyOpeningHours,
    };
  }

  /**
   * Validates source URL using the established SSRF protection.
   */
  public static validateSourceUrl(
    urlStr: string
  ): { valid: boolean; error?: string; normalizedUrl?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, error: 'URL zdroje je povinné' };
    }

    const trimmed = urlStr.trim();
    if (trimmed.length > 1000) {
      return { valid: false, error: 'Délka URL nesmí přesáhnout 1000 znaků' };
    }

    if (!StateAdminApiClient.isUrlSsrfSafe(trimmed)) {
      return {
        valid: false,
        error: 'URL nesplňuje bezpečnostní pravidla (SSRF: privátní IP, localhost, nestandardní protokol)',
      };
    }

    try {
      const parsed = new URL(trimmed);
      return { valid: true, normalizedUrl: parsed.href };
    } catch {
      return { valid: false, error: 'Nevalidní formát URL' };
    }
  }

  /**
   * Validates field key for source proposal.
   */
  public static validateFieldKey(fieldKey: string): { valid: boolean; error?: string } {
    if (!fieldKey || typeof fieldKey !== 'string') {
      return { valid: false, error: 'Klíč pole je povinný' };
    }
    const trimmed = fieldKey.trim();
    if (!ALLOWED_FIELD_KEYS.has(trimmed)) {
      return {
        valid: false,
        error: `Nepovolený klíč pole: ${trimmed}. Povolené klíče: ${Array.from(ALLOWED_FIELD_KEYS).join(', ')}`,
      };
    }
    return { valid: true };
  }

  /**
   * Sanitizes text to strip HTML tags, script tags, and bounds length.
   */
  public static sanitizeText(text: string | null | undefined, maxLen = 2000): string {
    if (!text || typeof text !== 'string') return '';
    const stripped = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
      .trim();
    return stripped.slice(0, maxLen);
  }
}
