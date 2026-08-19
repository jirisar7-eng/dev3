import { EsbirkaValidator } from '../services/esbirka/EsbirkaValidator';
import { EsbirkaNormalizer } from '../services/esbirka/EsbirkaNormalizer';
import { EsbirkaApiError } from '../services/esbirka/errors';

/**
 * UNIT TEST SUITE FOR ÚKOL 5/10: VALIDÁTOR A NORMALIZÁTOR DAT e-SBÍRKA / e-LEGISLATIVA
 * 
 * STRICT INVARIANTS:
 * - 100% in-memory testing.
 * - ZERO network calls, ZERO database writes, ZERO live secrets.
 * - STRICT preservation of normative legal text.
 */
export async function runValidationNormalizationTests() {
  console.log('--- STARTING ÚKOL 5/10: VALIDATOR & NORMALIZER UNIT TEST SUITE ---');
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

  // Sample valid legal act fixture (Občanský zákoník - rodinné právo)
  const sampleValidAct = {
    predpis: {
      cislo: 89,
      rok: 2012,
      sbirka: 'Sb.',
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      zkratka: 'OZ',
      typ: 'ZAKON',
      category: 'FAMILY_LAW',
      stav: 'ACTIVE',
      datumVyhlaseni: '2012-03-22',
      datumUcinnostiOd: '2014-01-01',
      paragrafy: [
        {
          cislo: '858',
          nazev: 'Rodičovská odpovědnost',
          text: 'Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů, která spočívají v péči o dítě, zahrnující zejména péči o jeho zdraví, jeho tělesný, citový, rozumový a mravní vývoj.',
        },
        {
          cislo: '888',
          nazev: 'Styk s dítětem',
          text: 'Dítě, které je v péči jen jednoho rodiče, má právo stýkat se s druhým rodičem v rozsahu, který je v zájmu dítěte, a tento rodič má právo stýkat se s dítětem, ledaže soud toto právo omezí.',
        },
        {
          cislo: '888a',
          nazev: 'Doprovodná ustanovení ke styku',
          text: 'Rodiče jsou povinni vzájemně si sdělit všechny podstatné okolnosti týkající se dítěte a jeho zájmů.',
        },
      ],
    },
  };

  // --------------------------------------------------------------------------
  // TEST 1: Valid legal act parsing & validation
  // --------------------------------------------------------------------------
  const valRes1 = EsbirkaValidator.validateAct(sampleValidAct);
  assert(valRes1.isValid === true, 'TEST 1: Valid legal act successfully validates');
  if (valRes1.isValid) {
    assert(valRes1.data.actNumber === 89, 'TEST 1: Correctly parsed act number');
    assert(valRes1.data.actYear === 2012, 'TEST 1: Correctly parsed act year');
    assert(valRes1.data.sections.length === 3, 'TEST 1: Correctly validated all 3 sections');
  }

  // --------------------------------------------------------------------------
  // TEST 2: Missing mandatory field (missing title & missing actNumber)
  // --------------------------------------------------------------------------
  const invalidMissing = {
    predpis: {
      rok: 2012,
      paragrafy: [{ cislo: '1', text: 'Text paragrafu' }],
    },
  };
  const valRes2 = EsbirkaValidator.validateAct(invalidMissing);
  assert(valRes2.isValid === false, 'TEST 2: Missing mandatory fields marked invalid (Fail-Closed)');
  if (valRes2.isValid === false) {
    const errorCodes = valRes2.errors.map((e) => e.code);
    assert(errorCodes.includes('INVALID_ACT_NUMBER'), 'TEST 2: Detected missing/invalid act number');
    assert(errorCodes.includes('MISSING_TITLE'), 'TEST 2: Detected missing title');
  }

  // --------------------------------------------------------------------------
  // TEST 3: Invalid data types (number as title, string as sections)
  // --------------------------------------------------------------------------
  const invalidTypes = {
    cislo: 89,
    rok: 2012,
    nazev: 12345, // Invalid number instead of string
    sections: 'Not an array',
  };
  const valRes3 = EsbirkaValidator.validateAct(invalidTypes);
  assert(valRes3.isValid === false, 'TEST 3: Wrong data types rejected');
  if (valRes3.isValid === false) {
    const errorCodes = valRes3.errors.map((e) => e.code);
    assert(errorCodes.includes('MISSING_TITLE') || errorCodes.includes('MISSING_SECTIONS'), 'TEST 3: Caught invalid types');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Invalid identifier / actCode (negative act number, future year)
  // --------------------------------------------------------------------------
  const invalidIdent = {
    cislo: -5,
    rok: 2350,
    nazev: 'Fiktivní zákon',
    sections: [{ cislo: '1', text: 'Text' }],
  };
  const valRes4 = EsbirkaValidator.validateAct(invalidIdent);
  assert(valRes4.isValid === false, 'TEST 4: Negative act number and out-of-range year rejected');
  if (valRes4.isValid === false) {
    const codes = valRes4.errors.map((e) => e.code);
    assert(codes.includes('INVALID_ACT_NUMBER'), 'TEST 4: Detected negative act number');
    assert(codes.includes('INVALID_ACT_YEAR'), 'TEST 4: Detected out-of-range act year');
  }

  // --------------------------------------------------------------------------
  // TEST 5: Invalid date (non-existent calendar date 2026-02-31)
  // --------------------------------------------------------------------------
  const invalidDatePayload = {
    cislo: 89,
    rok: 2012,
    nazev: 'Zákon o rodině',
    datumVyhlaseni: '2026-02-31', // Non-existent date
    sections: [{ cislo: '1', text: 'Text' }],
  };
  const valRes5 = EsbirkaValidator.validateAct(invalidDatePayload);
  assert(valRes5.isValid === false, 'TEST 5: Non-existent calendar date (Feb 31) rejected');
  if (valRes5.isValid === false) {
    assert(valRes5.errors.some((e) => e.code === 'NON_EXISTENT_CALENDAR_DATE'), 'TEST 5: Raised NON_EXISTENT_CALENDAR_DATE');
  }

  // --------------------------------------------------------------------------
  // TEST 6: Invalid status enum
  // --------------------------------------------------------------------------
  const invalidStatusPayload = {
    cislo: 89,
    rok: 2012,
    nazev: 'Zákon',
    stav: 'SUPER_ACTIVE', // Unknown status
    sections: [{ cislo: '1', text: 'Text' }],
  };
  const valRes6 = EsbirkaValidator.validateAct(invalidStatusPayload);
  assert(valRes6.isValid === false, 'TEST 6: Invalid status enum rejected');
  if (valRes6.isValid === false) {
    assert(valRes6.errors.some((e) => e.code === 'INVALID_STATUS'), 'TEST 6: Raised INVALID_STATUS');
  }

  // --------------------------------------------------------------------------
  // TEST 7: Malformed / corrupted section structure
  // --------------------------------------------------------------------------
  const malformedSectionsPayload = {
    cislo: 89,
    rok: 2012,
    nazev: 'Zákon',
    sections: [
      null, // Corrupted null section
      { cislo: 'invalid-section-%%%', text: 'Valid text' },
      { cislo: '2', text: '' }, // Empty content
    ],
  };
  const valRes7 = EsbirkaValidator.validateAct(malformedSectionsPayload);
  assert(valRes7.isValid === false, 'TEST 7: Malformed section objects rejected');
  if (valRes7.isValid === false) {
    const codes = valRes7.errors.map((e) => e.code);
    assert(codes.includes('INVALID_SECTION_OBJECT'), 'TEST 7: Detected null section');
    assert(codes.includes('INVALID_SECTION_NUMBER'), 'TEST 7: Detected invalid section number syntax');
    assert(codes.includes('EMPTY_SECTION_CONTENT'), 'TEST 7: Detected empty section text');
  }

  // --------------------------------------------------------------------------
  // TEST 8: Extremely long text exceeding limits
  // --------------------------------------------------------------------------
  const hugeTextPayload = {
    cislo: 89,
    rok: 2012,
    nazev: 'Zákon',
    sections: [
      {
        cislo: '1',
        text: 'A'.repeat(EsbirkaValidator.MAX_SECTION_CONTENT_LENGTH + 100),
      },
    ],
  };
  const valRes8 = EsbirkaValidator.validateAct(hugeTextPayload);
  assert(valRes8.isValid === false, 'TEST 8: Excessively long section text rejected');
  if (valRes8.isValid === false) {
    assert(valRes8.errors.some((e) => e.code === 'SECTION_CONTENT_TOO_LONG'), 'TEST 8: Raised SECTION_CONTENT_TOO_LONG');
  }

  // --------------------------------------------------------------------------
  // TEST 9: Extreme number of items (>10,000 sections)
  // --------------------------------------------------------------------------
  const hugeSectionsArray = [];
  for (let i = 1; i <= 10005; i++) {
    hugeSectionsArray.push({ cislo: String(i), text: `Paragraf ${i}` });
  }
  const hugeCountPayload = {
    cislo: 89,
    rok: 2012,
    nazev: 'Zákon',
    sections: hugeSectionsArray,
  };
  const valRes9 = EsbirkaValidator.validateAct(hugeCountPayload);
  assert(valRes9.isValid === false, 'TEST 9: Oversized section count rejected');
  if (valRes9.isValid === false) {
    assert(valRes9.errors.some((e) => e.code === 'SECTIONS_COUNT_EXCEEDED'), 'TEST 9: Raised SECTIONS_COUNT_EXCEEDED');
  }

  // --------------------------------------------------------------------------
  // TEST 10: Valid Normalization to domain entity
  // --------------------------------------------------------------------------
  const validActData = (valRes1 as any).data;
  const normalizedAct = EsbirkaNormalizer.normalizeAct(validActData);
  assert(normalizedAct.actCode === '89/2012', 'TEST 10: Canonical actCode format 89/2012');
  assert(normalizedAct.shortTitle === 'OZ', 'TEST 10: Standard shortTitle resolved');
  assert(normalizedAct.category === 'FAMILY_LAW', 'TEST 10: Canonical category resolved');
  assert(normalizedAct.sections.length === 3, 'TEST 10: All sections normalized');
  assert(normalizedAct.sections[0].sectionOrder === 85800, 'TEST 10: Correct numeric sort order for § 858');
  assert(normalizedAct.sections[1].sectionOrder === 88800, 'TEST 10: Correct numeric sort order for § 888');
  assert(normalizedAct.sections[2].sectionOrder === 88801, 'TEST 10: Correct numeric sort order for § 888a');

  // --------------------------------------------------------------------------
  // TEST 11: Preservation of normative legal text (RAW == NORMALIZED)
  // --------------------------------------------------------------------------
  const rawLegalText = 'Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů, která spočívají v péči o dítě, zahrnující zejména péči o jeho zdraví, jeho tělesný, citový, rozumový a mravní vývoj.';
  assert(
    normalizedAct.sections[0].content === rawLegalText,
    'TEST 11: Exact 100% legal text fidelity preserved without alteration'
  );

  // --------------------------------------------------------------------------
  // TEST 12: Deterministic SHA-256 hash generation
  // --------------------------------------------------------------------------
  assert(typeof normalizedAct.contentHash === 'string' && normalizedAct.contentHash.length === 64, 'TEST 12: Valid 64-char hex SHA-256 hash produced');

  // --------------------------------------------------------------------------
  // TEST 13: Same data = Same hash
  // --------------------------------------------------------------------------
  const normalizedActCopy = EsbirkaNormalizer.normalizeAct(validActData);
  assert(normalizedAct.contentHash === normalizedActCopy.contentHash, 'TEST 13: Deterministic hash: Identical data yields identical hash');

  // --------------------------------------------------------------------------
  // TEST 14: Changed data = Different hash
  // --------------------------------------------------------------------------
  const modifiedActData = JSON.parse(JSON.stringify(validActData));
  modifiedActData.sections[0].content = modifiedActData.sections[0].content + ' (doplněno)';
  const normalizedModified = EsbirkaNormalizer.normalizeAct(modifiedActData);
  assert(normalizedAct.contentHash !== normalizedModified.contentHash, 'TEST 14: Modified legal text produces distinct SHA-256 hash');

  // --------------------------------------------------------------------------
  // TEST 15: Ordering of technically irrelevant metadata does NOT change content hash
  // --------------------------------------------------------------------------
  const reorderedActData = JSON.parse(JSON.stringify(validActData));
  // Reverse sections order in input payload
  reorderedActData.sections.reverse();
  const normalizedReordered = EsbirkaNormalizer.normalizeAct(reorderedActData);
  assert(
    normalizedAct.contentHash === normalizedReordered.contentHash,
    'TEST 15: Input section ordering is deterministically sorted; hash remains identical'
  );

  // --------------------------------------------------------------------------
  // TEST 16: Key section tagging (§ 888 OZ, § 858 OZ)
  // --------------------------------------------------------------------------
  const sec858 = normalizedAct.sections.find((s) => s.sectionNumber === '858');
  const sec888 = normalizedAct.sections.find((s) => s.sectionNumber === '888');
  assert(sec858?.isKeySection === true, 'TEST 16: § 858 auto-tagged as key custody section');
  assert(sec888?.isKeySection === true, 'TEST 16: § 888 auto-tagged as key custody section');
  assert(typeof sec888?.practicalNote === 'string' && sec888.practicalNote.length > 10, 'TEST 16: § 888 enriched with practical legal guidance');

  // --------------------------------------------------------------------------
  // TEST 17: Invalid data cannot be normalized
  // --------------------------------------------------------------------------
  try {
    EsbirkaNormalizer.normalizeAct(null as any);
    assert(false, 'TEST 17: Normalizing null must throw error');
  } catch (err: any) {
    assert(EsbirkaApiError.isEsbirkaApiError(err), 'TEST 17: Normalizer fails closed on invalid input');
  }

  // --------------------------------------------------------------------------
  // TEST 18: Invalid data cannot proceed to sync
  // --------------------------------------------------------------------------
  const badValidationResult = EsbirkaValidator.validateAct({ invalid: true });
  assert(badValidationResult.isValid === false, 'TEST 18: Corrupted payload blocked at validator stage');

  // --------------------------------------------------------------------------
  // TEST 19: API Secrets & Keys are NOT in error messages
  // --------------------------------------------------------------------------
  const sensitiveError = new EsbirkaApiError({
    message: 'Validation failed with Bearer secret-super-token-12345',
    code: 'INVALID_RESPONSE',
    requestId: 'req-test',
    endpoint: '/test',
  });
  assert(!sensitiveError.message.includes('secret-super-token-12345'), 'TEST 19: Secrets redacted from error message');
  assert(sensitiveError.message.includes('[REDACTED]'), 'TEST 19: Replaced with [REDACTED]');

  // --------------------------------------------------------------------------
  // TEST 20: Safe structured object representations for errors
  // --------------------------------------------------------------------------
  const safeObj = sensitiveError.toSafeObject();
  assert(safeObj.code === 'INVALID_RESPONSE' && safeObj.requestId === 'req-test', 'TEST 20: Safe error object structure verified');

  // --------------------------------------------------------------------------
  // TEST 21: Deep JSON nesting protection (> 15 levels)
  // --------------------------------------------------------------------------
  let deeplyNested: any = { leaf: 'data' };
  for (let i = 0; i < 20; i++) {
    deeplyNested = { child: deeplyNested };
  }
  const depthRes = EsbirkaValidator.calculateObjectDepth(deeplyNested);
  assert(depthRes > 15, 'TEST 21: Depth calculation detected deep recursion');
  const deepPayloadVal = EsbirkaValidator.validateAct(deeplyNested);
  assert(deepPayloadVal.isValid === false, 'TEST 21: Payload with >15 nesting levels rejected (DEPTH_LIMIT_EXCEEDED)');

  // --------------------------------------------------------------------------
  // TEST 22: Structured paragraphs with odstavce and pismena
  // --------------------------------------------------------------------------
  const structuredActPayload = {
    cislo: 359,
    rok: 1999,
    nazev: 'Zákon o sociálně-právní ochraně dětí',
    paragrafy: [
      {
        cislo: '19',
        nazev: 'Opatření k ochraně dítěte',
        odstavce: [
          {
            cislo: 1,
            text: 'Orgán sociálně-právní ochrany dětí je povinen sledovat nepříznivé vlivy na děti.',
            pismena: [
              { pismeno: 'a', text: 'v rodinách s narušenou funkcí' },
              { pismeno: 'b', text: 'v ústavních zařízeních' },
            ],
          },
        ],
      },
    ],
  };
  const valRes22 = EsbirkaValidator.validateAct(structuredActPayload);
  assert(valRes22.isValid === true, 'TEST 22: Structured odstavce and pismena validated');
  if (valRes22.isValid) {
    const norm22 = EsbirkaNormalizer.normalizeAct(valRes22.data);
    assert(norm22.actCode === '359/1999', 'TEST 22: Act code 359/1999');
    assert(norm22.shortTitle === 'zOSPOD', 'TEST 22: Resolved shortTitle zOSPOD');
    assert(norm22.sections[0].isKeySection === true, 'TEST 22: § 19 zOSPOD tagged as key section');
    assert(norm22.sections[0].content.includes('v rodinách s narušenou funkcí'), 'TEST 22: Sub-items correctly formatted in content');
  }

  // --------------------------------------------------------------------------
  // TEST 23: Section order calculation tests
  // --------------------------------------------------------------------------
  assert(EsbirkaNormalizer.calculateSectionOrder('1') === 100, 'TEST 23: § 1 -> 100');
  assert(EsbirkaNormalizer.calculateSectionOrder('888') === 88800, 'TEST 23: § 888 -> 88800');
  assert(EsbirkaNormalizer.calculateSectionOrder('888a') === 88801, 'TEST 23: § 888a -> 88801');
  assert(EsbirkaNormalizer.calculateSectionOrder('888b') === 88802, 'TEST 23: § 888b -> 88802');
  assert(EsbirkaNormalizer.calculateSectionOrder('888z') === 88826, 'TEST 23: § 888z -> 88826');

  // --------------------------------------------------------------------------
  // TEST 24: Validation options, envelope unwrapping, and context fallback
  // --------------------------------------------------------------------------
  const envelopePayloadWithoutTopLevelIdent = {
    dokument: {
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      ustanoveni: [
        {
          cislo: '858',
          text: 'Rodičovská odpovědnost.',
        },
      ],
    },
  };
  const valRes24 = EsbirkaValidator.validateAct(envelopePayloadWithoutTopLevelIdent, {
    expectedActNumber: 89,
    expectedActYear: 2012,
    expectedActCode: '89/2012',
  });
  assert(valRes24.isValid === true, 'TEST 24: Envelope unwrapping and context fallback succeeded for missing top-level cislo/rok');
  if (valRes24.isValid) {
    assert(valRes24.data.actNumber === 89, 'TEST 24: Act number resolved to 89');
    assert(valRes24.data.actYear === 2012, 'TEST 24: Act year resolved to 2012');
    assert(valRes24.data.sections[0].sectionNumber === '858', 'TEST 24: Section number resolved to 858');
  }

  console.log('\n=== ÚKOL 5/10 TEST RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`VERDICT: ${failed === 0 ? 'ALL TESTS PASSED - VALIDATOR & NORMALIZER LAYER VERIFIED' : 'TESTS FAILED'}`);

  return { passed, failed };
}

// Execute tests if run directly
runValidationNormalizationTests().then((res) => {
  if (res.failed > 0) process.exit(1);
}).catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
