import { EsbirkaValidator } from '../services/esbirka/EsbirkaValidator';
import { EsbirkaNormalizer } from '../services/esbirka/EsbirkaNormalizer';
import { EsbirkaChangeDetector } from '../services/esbirka/EsbirkaChangeDetector';
import { EsbirkaLegalRepository } from '../services/esbirka/EsbirkaLegalRepository';
import { EsbirkaSyncEngine } from '../services/esbirka/EsbirkaSyncEngine';
import { EsbirkaService } from '../services/EsbirkaService';

/**
 * UNIT TEST SUITE FOR E-SBÍRKA PHASE 2: ČASOVÁ ZNĚNÍ A AKTUÁLNÍ ZÁKONY
 * 
 * STRICT INVARIANTS:
 * - 100% in-memory testing.
 * - ZERO unverified endpoint calls.
 * - Complete verification of historical versions, change detection, and validity computation.
 * - Fail-Closed error handling.
 */
export async function runEsbirkaPhase2VersionsTests() {
  console.log('--- STARTING E-SBÍRKA PHASE 2 (ČASOVÁ ZNĚNÍ & HISTORIE) TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Reset repository state before starting
  EsbirkaLegalRepository.resetForTesting();

  // --------------------------------------------------------------------------
  // TEST 1: Validity determination for CURRENT, PAST, and FUTURE versions
  // --------------------------------------------------------------------------
  const now = new Date('2026-08-19T12:00:00Z');

  // Case A: Active current version (no end date)
  const currentRes = EsbirkaNormalizer.determineVersionValidity(
    new Date('2014-01-01'),
    null,
    now
  );
  assert(currentRes.isValidAtDate === true, 'TEST 1A: Ongoing version is valid at current date');
  assert(currentRes.isCurrent === true, 'TEST 1A: Ongoing version is marked current');
  assert(currentRes.status === 'CURRENT', 'TEST 1A: Status is CURRENT');

  // Case B: Past historical version (expired)
  const pastRes = EsbirkaNormalizer.determineVersionValidity(
    new Date('2014-01-01'),
    new Date('2020-12-31'),
    now
  );
  assert(pastRes.isValidAtDate === false, 'TEST 1B: Expired version is not valid at current date');
  assert(pastRes.isCurrent === false, 'TEST 1B: Expired version is not marked current');
  assert(pastRes.status === 'PAST', 'TEST 1B: Status is PAST');

  // Case C: Past version evaluated at a historical date when it WAS valid
  const pastHistoricRes = EsbirkaNormalizer.determineVersionValidity(
    new Date('2014-01-01'),
    new Date('2020-12-31'),
    new Date('2018-05-15')
  );
  assert(pastHistoricRes.isValidAtDate === true, 'TEST 1C: Historical version valid when evaluated at reference date within range');
  assert(pastHistoricRes.status === 'CURRENT', 'TEST 1C: Status is CURRENT relative to 2018 reference date');

  // Case D: Future version (legisvakanční lhůta)
  const futureRes = EsbirkaNormalizer.determineVersionValidity(
    new Date('2027-01-01'),
    null,
    now
  );
  assert(futureRes.isValidAtDate === false, 'TEST 1D: Future version not yet valid');
  assert(futureRes.status === 'FUTURE', 'TEST 1D: Status is FUTURE');

  // --------------------------------------------------------------------------
  // TEST 2: Parsing date aliases and version metadata from e-Sbírka payloads
  // --------------------------------------------------------------------------
  const rawPayloadWithAliases = {
    predpis: {
      cislo: 89,
      rok: 2012,
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      datumVyhlaseni: '2012-03-22',
      datumPlatnosti: '2012-03-22',
      datumUcinnostiOd: '2014-01-01',
      datumUcinnostiDo: '2026-12-31',
      datumPosledniNovely: '2025-06-01',
      verze: 'v-2025-06',
      paragrafy: [
        {
          cislo: '858',
          text: 'Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů.',
        },
      ],
    },
  };

  const valRes = EsbirkaValidator.validateAct(rawPayloadWithAliases);
  assert(valRes.isValid === true, 'TEST 2: Successfully parsed envelope with date & version aliases');
  if (valRes.isValid) {
    assert(valRes.data.versionNumber === 'v-2025-06', 'TEST 2: Extracted version number string');
    assert(valRes.data.effectiveFrom?.toISOString().slice(0, 10) === '2014-01-01', 'TEST 2: Parsed effectiveFrom date');
    assert(valRes.data.effectiveTo?.toISOString().slice(0, 10) === '2026-12-31', 'TEST 2: Parsed effectiveTo date');
    assert(valRes.data.lastAmendedDate?.toISOString().slice(0, 10) === '2025-06-01', 'TEST 2: Parsed lastAmendedDate');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Normalizer builds versionSnapshot with SHA-256 content hash
  // --------------------------------------------------------------------------
  if (valRes.isValid) {
    const normalized = EsbirkaNormalizer.normalizeAct(valRes.data);
    assert(normalized.versionSnapshot.versionNumber === 'v-2025-06', 'TEST 3: Version snapshot has versionNumber');
    assert(typeof normalized.versionSnapshot.contentHash === 'string' && normalized.versionSnapshot.contentHash.length === 64, 'TEST 3: Version snapshot has 64-char SHA-256 hash');
    assert(normalized.versionSnapshot.contentSnapshot.sectionsCount === 1, 'TEST 3: Content snapshot stores sectionsCount');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Version history preservation & change detection across updates
  // --------------------------------------------------------------------------
  // Version 1 Sync
  const actV1Payload = {
    predpis: {
      cislo: 89,
      rok: 2012,
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      datumVyhlaseni: '2012-03-22',
      datumUcinnostiOd: '2014-01-01',
      verze: 'zneni-2014',
      paragrafy: [
        {
          cislo: '858',
          text: 'Původní text § 858 o rodičovské odpovědnosti.',
        },
        {
          cislo: '888',
          text: 'Původní text § 888 o styku s dítětem.',
        },
      ],
    },
  };

  const valV1 = EsbirkaValidator.validateAct(actV1Payload);
  assert(valV1.isValid === true, 'TEST 4A: Validated version 1');
  if (valV1.isValid) {
    const normV1 = EsbirkaNormalizer.normalizeAct(valV1.data);
    await EsbirkaLegalRepository.persistNormalizedAct(normV1, 'NEW', null);

    const actFromDb = await EsbirkaLegalRepository.getActDetailsByCode('89/2012');
    assert(actFromDb !== null, 'TEST 4A: Persisted act in repository');
    assert(actFromDb?.versions?.length === 1, 'TEST 4A: Repository has 1 version snapshot');
    assert(actFromDb?.versions?.[0].versionNumber === 'zneni-2014', 'TEST 4A: Version 1 has correct identifier');
  }

  // Version 2 Sync (Amended / Novela text)
  const actV2Payload = {
    predpis: {
      cislo: 89,
      rok: 2012,
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      datumVyhlaseni: '2012-03-22',
      datumUcinnostiOd: '2025-01-01',
      verze: 'novela-2025',
      paragrafy: [
        {
          cislo: '858',
          text: 'Novelozovaný moderní text § 858 o rovnoměrné rodičovské odpovědnosti.',
        },
        {
          cislo: '888',
          text: 'Původní text § 888 o styku s dítětem.',
        },
      ],
    },
  };

  const valV2 = EsbirkaValidator.validateAct(actV2Payload);
  assert(valV2.isValid === true, 'TEST 4B: Validated version 2');
  if (valV2.isValid) {
    const normV2 = EsbirkaNormalizer.normalizeAct(valV2.data);
    
    // Check change detector recognizes text difference
    const existing = await EsbirkaLegalRepository.getActDetailsByCode('89/2012');
    const changeDet = EsbirkaChangeDetector.detectChange(normV2, {
      actCode: existing!.actCode,
      contentHash: existing!.contentHash,
      versionNumber: existing!.versions?.[0]?.versionNumber,
      sections: existing!.sections!.map((s) => ({
        sectionNumber: s.sectionNumber,
        content: s.content,
        title: s.title,
      })),
    });

    assert(changeDet.isChanged === true, 'TEST 4B: Change detector recognized modified section');
    assert(changeDet.changeType === 'CHANGED', 'TEST 4B: Change type is CHANGED');

    // Persist new version snapshot
    await EsbirkaLegalRepository.persistNormalizedAct(normV2, 'CHANGED', null);

    const actAfterV2 = await EsbirkaLegalRepository.getActDetailsByCode('89/2012');
    assert(actAfterV2?.versions?.length === 2, 'TEST 4B: Version history is preserved with 2 versions');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Public Portal queries for time versions and historical snapshot
  // --------------------------------------------------------------------------
  const allVersions = await EsbirkaService.getActVersions('89/2012', now);
  assert(allVersions.length === 2, 'TEST 5A: EsbirkaService.getActVersions returns all 2 versions');
  assert(allVersions[0].versionNumber === 'novela-2025', 'TEST 5A: Latest version is first');
  assert(allVersions[0].isCurrent === true, 'TEST 5A: Latest version is current');

  // Query specific historical snapshot (zneni-2014)
  const historicDetails = await EsbirkaService.getActVersionDetails('89/2012', 'zneni-2014', now);
  assert(historicDetails !== null, 'TEST 5B: Successfully retrieved historical version details');
  assert(historicDetails?.versionNumber === 'zneni-2014', 'TEST 5B: Retrieved version identifier matches');
  assert(historicDetails?.contentSnapshot?.sections?.[0]?.content?.includes('Původní text § 858'), 'TEST 5B: Historical snapshot preserves original wording verbatim');

  // --------------------------------------------------------------------------
  // TEST 6: Fail-Closed on invalid date / corrupt version structure
  // --------------------------------------------------------------------------
  const corruptDatePayload = {
    predpis: {
      cislo: 89,
      rok: 2012,
      nazev: 'Zákon č. 89/2012 Sb.',
      datumUcinnostiOd: '2026-02-31', // Invalid leap/calendar date
      paragrafy: [{ cislo: '1', text: 'Text' }],
    },
  };
  const valCorrupt = EsbirkaValidator.validateAct(corruptDatePayload);
  assert(valCorrupt.isValid === false, 'TEST 6: Invalid calendar date 2026-02-31 fails validation');

  console.log(`--- E-SBÍRKA PHASE 2 TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) {
    throw new Error(`Esbirka Phase 2 test suite failed with ${failed} failure(s).`);
  }
}
