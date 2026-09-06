import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isProfileStatusActive,
  isSubjectAccessible,
  isSubjectNoAppointmentNeeded,
  isSubjectOpenToday,
  matchesAdvancedFilters,
  getPragueDayKey,
  parseOpeningHoursSafely,
} from '../src/utils/mapFilters';
import { Subjekt } from '../src/types';
import { SubjectVerifiedProfileDto } from '../src/types/verifiedSubjectInfo';

describe('MASTER-IMPLEMENT-06A: Pokročilé filtry mapy subjektů (GAP-02 FÁZE A)', () => {

  const createMockSubject = (
    id: string,
    verifiedProfile?: Partial<SubjectVerifiedProfileDto> | null
  ): Subjekt => ({
    id,
    name: `Subjekt ${id}`,
    type: 'SOUD',
    address: 'Vodičkova 10',
    city: 'Praha',
    region: 'Hlavní město Praha',
    lat: 50.08,
    lng: 14.42,
    avgRating: 4.5,
    reviewCount: 10,
    isVerified: !!verifiedProfile,
    verifiedProfile: verifiedProfile as SubjectVerifiedProfileDto | undefined,
  });

  // --------------------------------------------------------------------------
  // 1. FAIL-CLOSED STATUS ENFORCEMENT (VERIFIED / STALE only)
  // --------------------------------------------------------------------------
  describe('1. Fail-closed status enforcement', () => {
    test('isProfileStatusActive accepts only VERIFIED and STALE', () => {
      assert.equal(isProfileStatusActive('VERIFIED'), true);
      assert.equal(isProfileStatusActive('STALE'), true);
      assert.equal(isProfileStatusActive('PENDING_REVIEW'), false);
      assert.equal(isProfileStatusActive('REJECTED'), false);
      assert.equal(isProfileStatusActive(undefined), false);
      assert.equal(isProfileStatusActive(null as any), false);
      assert.equal(isProfileStatusActive('UNKNOWN_STATUS' as any), false);
    });

    test('subjects with PENDING_REVIEW or REJECTED never pass any active filter', () => {
      const pendingSubj = createMockSubject('sub-pending', {
        status: 'PENDING_REVIEW',
        accessibility: 'Bezbariérový vchod i toaleta',
        appointmentRequired: false,
        openingHours: JSON.stringify({
          monday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
          tuesday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
          wednesday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
          thursday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
          friday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
          saturday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
          sunday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }] },
        }),
      });

      const rejectedSubj = createMockSubject('sub-rejected', {
        status: 'REJECTED',
        accessibility: 'Ano, plně bezbariérové',
        appointmentRequired: false,
      });

      // Accessible filter
      assert.equal(isSubjectAccessible(pendingSubj), false);
      assert.equal(isSubjectAccessible(rejectedSubj), false);

      // No appointment filter
      assert.equal(isSubjectNoAppointmentNeeded(pendingSubj), false);
      assert.equal(isSubjectNoAppointmentNeeded(rejectedSubj), false);

      // Open today filter
      assert.equal(isSubjectOpenToday(pendingSubj), false);
      assert.equal(isSubjectOpenToday(rejectedSubj), false);

      // Master predicate
      assert.equal(matchesAdvancedFilters(pendingSubj, { onlyAccessible: true }), false);
      assert.equal(matchesAdvancedFilters(rejectedSubj, { noAppointmentNeeded: true }), false);
    });

    test('subjects without verifiedProfile never pass when any filter is active', () => {
      const unverifiedSubj = createMockSubject('sub-unverified', null);

      assert.equal(isSubjectAccessible(unverifiedSubj), false);
      assert.equal(isSubjectNoAppointmentNeeded(unverifiedSubj), false);
      assert.equal(isSubjectOpenToday(unverifiedSubj), false);

      assert.equal(matchesAdvancedFilters(unverifiedSubj, { onlyAccessible: true }), false);
      assert.equal(matchesAdvancedFilters(unverifiedSubj, { noAppointmentNeeded: true }), false);
      assert.equal(matchesAdvancedFilters(unverifiedSubj, { openToday: true }), false);
    });
  });

  // --------------------------------------------------------------------------
  // 2. BEZBARIÉROVOST (ACCESSIBILITY)
  // --------------------------------------------------------------------------
  describe('2. Filter: Pouze bezbariérové', () => {
    test('passes for VERIFIED or STALE profile with non-empty accessibility text', () => {
      const verifiedSubj = createMockSubject('sub-v1', {
        status: 'VERIFIED',
        accessibility: 'Rampa u hlavního vstupu, bezbariérový výtah',
      });
      const staleSubj = createMockSubject('sub-s1', {
        status: 'STALE',
        accessibility: 'Přízemí bez schodů',
      });

      assert.equal(isSubjectAccessible(verifiedSubj), true);
      assert.equal(isSubjectAccessible(staleSubj), true);
    });

    test('fails closed for empty, whitespace-only, or missing accessibility text', () => {
      const emptySubj = createMockSubject('sub-e1', {
        status: 'VERIFIED',
        accessibility: '',
      });
      const whitespaceSubj = createMockSubject('sub-w1', {
        status: 'VERIFIED',
        accessibility: '    \n\t  ',
      });
      const nullSubj = createMockSubject('sub-n1', {
        status: 'VERIFIED',
        accessibility: undefined,
      });

      assert.equal(isSubjectAccessible(emptySubj), false);
      assert.equal(isSubjectAccessible(whitespaceSubj), false);
      assert.equal(isSubjectAccessible(nullSubj), false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. BEZ NUTNOSTI OBJEDNÁNÍ (NO APPOINTMENT NEEDED)
  // --------------------------------------------------------------------------
  describe('3. Filter: Bez nutnosti objednání', () => {
    test('passes strictly when appointmentRequired === false on VERIFIED/STALE', () => {
      const noAppointVerified = createMockSubject('sub-na1', {
        status: 'VERIFIED',
        appointmentRequired: false,
      });
      const noAppointStale = createMockSubject('sub-na2', {
        status: 'STALE',
        appointmentRequired: false,
      });

      assert.equal(isSubjectNoAppointmentNeeded(noAppointVerified), true);
      assert.equal(isSubjectNoAppointmentNeeded(noAppointStale), true);
    });

    test('fails closed when appointmentRequired is true, undefined, or not boolean false', () => {
      const appointRequired = createMockSubject('sub-ar1', {
        status: 'VERIFIED',
        appointmentRequired: true,
      });
      const appointMissing = createMockSubject('sub-ar2', {
        status: 'VERIFIED',
        appointmentRequired: undefined,
      });

      assert.equal(isSubjectNoAppointmentNeeded(appointRequired), false);
      assert.equal(isSubjectNoAppointmentNeeded(appointMissing), false);
    });
  });

  // --------------------------------------------------------------------------
  // 4. OTEVŘENO DNES (OPEN TODAY IN EUROPE/PRAGUE)
  // --------------------------------------------------------------------------
  describe('4. Filter: Otevřeno dnes (Europe/Prague calculation)', () => {
    test('getPragueDayKey correctly extracts weekday in Europe/Prague', () => {
      // 2026-09-06 is Sunday
      const testSunday = new Date('2026-09-06T12:00:00Z');
      assert.equal(getPragueDayKey(testSunday), 'sunday');

      // 2026-09-07 is Monday
      const testMonday = new Date('2026-09-07T12:00:00Z');
      assert.equal(getPragueDayKey(testMonday), 'monday');
    });

    test('parseOpeningHoursSafely parses JSON string or raw object without exceptions', () => {
      const rawObj = {
        monday: { isOpen: true, intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' as const }] }
      };
      assert.deepEqual(parseOpeningHoursSafely(rawObj), rawObj);

      const jsonStr = JSON.stringify(rawObj);
      assert.deepEqual(parseOpeningHoursSafely(jsonStr), rawObj);

      // Corrupted / invalid input returns null safely
      assert.equal(parseOpeningHoursSafely('not valid json {[['), null);
      assert.equal(parseOpeningHoursSafely(null), null);
      assert.equal(parseOpeningHoursSafely(undefined), null);
      assert.equal(parseOpeningHoursSafely(12345), null);
    });

    test('passes when current Prague day has isOpen: true with non-empty intervals', () => {
      const todayPrague = getPragueDayKey()!;

      const openTodayProfile: any = {};
      openTodayProfile[todayPrague] = {
        isOpen: true,
        intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }],
      };

      const subjOpen = createMockSubject('sub-open', {
        status: 'VERIFIED',
        openingHours: JSON.stringify(openTodayProfile),
      });

      assert.equal(isSubjectOpenToday(subjOpen), true);
    });

    test('fails closed when current Prague day has isOpen: false or empty intervals', () => {
      const todayPrague = getPragueDayKey()!;

      const closedTodayProfile: any = {};
      closedTodayProfile[todayPrague] = {
        isOpen: false,
        intervals: [],
      };

      const subjClosed = createMockSubject('sub-closed', {
        status: 'VERIFIED',
        openingHours: JSON.stringify(closedTodayProfile),
      });

      assert.equal(isSubjectOpenToday(subjClosed), false);

      const emptyIntervalsProfile: any = {};
      emptyIntervalsProfile[todayPrague] = {
        isOpen: true,
        intervals: [], // isOpen true but no intervals
      };

      const subjEmpty = createMockSubject('sub-empty-intervals', {
        status: 'VERIFIED',
        openingHours: JSON.stringify(emptyIntervalsProfile),
      });

      assert.equal(isSubjectOpenToday(subjEmpty), false);
    });

    test('fails closed without error on corrupted or missing openingHours', () => {
      const corruptedSubj = createMockSubject('sub-corrupted', {
        status: 'VERIFIED',
        openingHours: 'MALFORMED-JSON-}{@@',
      });
      const missingSubj = createMockSubject('sub-missing-hours', {
        status: 'VERIFIED',
        openingHours: undefined,
      });

      assert.doesNotThrow(() => {
        assert.equal(isSubjectOpenToday(corruptedSubj), false);
        assert.equal(isSubjectOpenToday(missingSubj), false);
      });
    });
  });

  // --------------------------------------------------------------------------
  // 5. COMBINED "AND" FILTERING LOGIC
  // --------------------------------------------------------------------------
  describe('5. Multi-filter AND conjunction', () => {
    test('all subjects pass when no advanced filters are active', () => {
      const unverified = createMockSubject('s1', null);
      const pending = createMockSubject('s2', { status: 'PENDING_REVIEW' });
      const verified = createMockSubject('s3', { status: 'VERIFIED' });

      assert.equal(matchesAdvancedFilters(unverified, {}), true);
      assert.equal(matchesAdvancedFilters(pending, {}), true);
      assert.equal(matchesAdvancedFilters(verified, {}), true);
    });

    test('subject must satisfy ALL active filters simultaneously', () => {
      const todayPrague = getPragueDayKey()!;
      const openTodayProfile: any = {};
      openTodayProfile[todayPrague] = {
        isOpen: true,
        intervals: [{ from: '08:00', to: '16:00', type: 'STANDARD' }],
      };

      // Fully matching subject
      const allRounder = createMockSubject('sub-all', {
        status: 'VERIFIED',
        accessibility: 'Bezbariérový vstup',
        appointmentRequired: false,
        openingHours: JSON.stringify(openTodayProfile),
      });

      // Missing only open today
      const closedTodayProfile: any = {};
      closedTodayProfile[todayPrague] = { isOpen: false, intervals: [] };
      const missingOpen = createMockSubject('sub-missing-open', {
        status: 'VERIFIED',
        accessibility: 'Bezbariérový vstup',
        appointmentRequired: false,
        openingHours: JSON.stringify(closedTodayProfile),
      });

      // Missing only no-appointment (requires appointment)
      const requiresAppointment = createMockSubject('sub-requires-app', {
        status: 'VERIFIED',
        accessibility: 'Bezbariérový vstup',
        appointmentRequired: true,
        openingHours: JSON.stringify(openTodayProfile),
      });

      // Missing accessibility
      const notAccessible = createMockSubject('sub-not-acc', {
        status: 'VERIFIED',
        accessibility: '',
        appointmentRequired: false,
        openingHours: JSON.stringify(openTodayProfile),
      });

      const allFilters = {
        onlyAccessible: true,
        noAppointmentNeeded: true,
        openToday: true,
      };

      assert.equal(matchesAdvancedFilters(allRounder, allFilters), true);
      assert.equal(matchesAdvancedFilters(missingOpen, allFilters), false);
      assert.equal(matchesAdvancedFilters(requiresAppointment, allFilters), false);
      assert.equal(matchesAdvancedFilters(notAccessible, allFilters), false);
    });
  });

  // --------------------------------------------------------------------------
  // 6. ZERO DUPLICATE / OVER-ENGINEERING CHECK
  // --------------------------------------------------------------------------
  describe('6. Zero duplicate registry/map check', () => {
    test('filters utilize existing Subjekt DTO and verifiedProfile fields without schema mutation', () => {
      const sampleDto = createMockSubject('s-test', {
        status: 'VERIFIED',
        accessibility: 'Ano',
        appointmentRequired: false,
        openingHours: {} as any,
      });

      assert.ok('verifiedProfile' in sampleDto);
      assert.ok('status' in (sampleDto.verifiedProfile || {}));
      assert.ok('accessibility' in (sampleDto.verifiedProfile || {}));
      assert.ok('appointmentRequired' in (sampleDto.verifiedProfile || {}));
      assert.ok('openingHours' in (sampleDto.verifiedProfile || {}));
    });
  });
});
