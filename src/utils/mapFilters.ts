import { SubjectVerifiedProfileDto, WeeklyOpeningHours } from '../types/verifiedSubjectInfo';
import { Subjekt } from '../types';

/**
 * Maps Day names to WeeklyOpeningHours keys based on Europe/Prague timezone.
 */
export function getPragueDayKey(date: Date = new Date()): keyof WeeklyOpeningHours | null {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Prague',
      weekday: 'long',
    });
    const weekday = formatter.format(date).toLowerCase();
    switch (weekday) {
      case 'monday':
        return 'monday';
      case 'tuesday':
        return 'tuesday';
      case 'wednesday':
        return 'wednesday';
      case 'thursday':
        return 'thursday';
      case 'friday':
        return 'friday';
      case 'saturday':
        return 'saturday';
      case 'sunday':
        return 'sunday';
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Helper to safely extract SubjectVerifiedProfileDto from either a Subjekt or a verifiedProfile directly.
 */
function resolveProfile(
  target: Subjekt | SubjectVerifiedProfileDto | null | undefined
): SubjectVerifiedProfileDto | null | undefined {
  if (!target || typeof target !== 'object') return null;
  if ('verifiedProfile' in target) {
    return (target as Subjekt).verifiedProfile;
  }
  return target as SubjectVerifiedProfileDto;
}

/**
 * Checks if verifiedProfile has a valid, approved status (VERIFIED or STALE).
 * FAIL-CLOSED: PENDING_REVIEW, REJECTED, or missing status will return false.
 */
export function isProfileStatusActive(
  target: Subjekt | SubjectVerifiedProfileDto | string | null | undefined
): boolean {
  if (typeof target === 'string') {
    return target === 'VERIFIED' || target === 'STALE';
  }
  const profile = resolveProfile(target);
  if (!profile || typeof profile !== 'object') return false;
  return profile.status === 'VERIFIED' || profile.status === 'STALE';
}

/**
 * Filter 1: "Pouze bezbariérové"
 * Returns true only if:
 * 1. profile exists and is VERIFIED or STALE (fail-closed)
 * 2. accessibility is a non-empty, sanitized string
 */
export function isSubjectAccessible(
  target: Subjekt | SubjectVerifiedProfileDto | null | undefined
): boolean {
  const profile = resolveProfile(target);
  if (!isProfileStatusActive(profile)) return false;
  if (!profile || typeof profile.accessibility !== 'string') return false;
  return profile.accessibility.trim().length > 0;
}

/**
 * Filter 2: "Bez nutnosti objednání"
 * Returns true only if:
 * 1. profile exists and is VERIFIED or STALE (fail-closed)
 * 2. appointmentRequired is explicitly false
 */
export function isSubjectNoAppointmentNeeded(
  target: Subjekt | SubjectVerifiedProfileDto | null | undefined
): boolean {
  const profile = resolveProfile(target);
  if (!isProfileStatusActive(profile)) return false;
  if (!profile) return false;
  return profile.appointmentRequired === false;
}

/**
 * Safely parses opening hours from an object or JSON string.
 */
export function parseOpeningHoursSafely(raw: unknown): WeeklyOpeningHours | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as WeeklyOpeningHours;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed as WeeklyOpeningHours;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Filter 3: "Otevřeno dnes" (Má dnes úřední hodiny)
 * Returns true only if:
 * 1. profile exists and is VERIFIED or STALE (fail-closed)
 * 2. valid WeeklyOpeningHours exist (object or parseable JSON string)
 * 3. for the current day in Europe/Prague, isOpen === true
 * 4. day contains at least one non-empty time interval (from & to)
 * 
 * Safe against corrupted/missing data (returns false, never crashes).
 */
export function isSubjectOpenToday(
  target: Subjekt | SubjectVerifiedProfileDto | null | undefined,
  currentDate: Date = new Date()
): boolean {
  const profile = resolveProfile(target);
  if (!isProfileStatusActive(profile)) return false;
  if (!profile) return false;

  const hours =
    parseOpeningHoursSafely(profile.openingHours) ||
    parseOpeningHoursSafely(profile.openingHoursRaw);

  if (!hours || typeof hours !== 'object') return false;

  const dayKey = getPragueDayKey(currentDate);
  if (!dayKey) return false;

  const daySchedule = (hours as any)[dayKey];
  if (!daySchedule || typeof daySchedule !== 'object') return false;

  if (daySchedule.isOpen !== true) return false;
  if (!Array.isArray(daySchedule.intervals) || daySchedule.intervals.length === 0) {
    return false;
  }

  // Ensure at least one interval is valid with non-empty from and to
  const hasValidInterval = daySchedule.intervals.some(
    (iv: any) =>
      iv &&
      typeof iv === 'object' &&
      typeof iv.from === 'string' &&
      typeof iv.to === 'string' &&
      iv.from.trim().length > 0 &&
      iv.to.trim().length > 0
  );

  return hasValidInterval;
}

export interface AdvancedMapFilterOptions {
  onlyAccessible?: boolean;
  noAppointmentNeeded?: boolean;
  openToday?: boolean;
  currentDate?: Date;
}

/**
 * Master predicate applying advanced filters in conjunction (AND logic).
 */
export function matchesAdvancedFilters(
  subjekt: Subjekt,
  filters: AdvancedMapFilterOptions
): boolean {
  if (filters.onlyAccessible && !isSubjectAccessible(subjekt)) {
    return false;
  }
  if (filters.noAppointmentNeeded && !isSubjectNoAppointmentNeeded(subjekt)) {
    return false;
  }
  if (filters.openToday && !isSubjectOpenToday(subjekt, filters.currentDate)) {
    return false;
  }
  return true;
}
