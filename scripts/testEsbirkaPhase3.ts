import { EsbirkaLegalRepository } from '../src/services/esbirka/EsbirkaLegalRepository';
import { EsbirkaService } from '../src/services/EsbirkaService';
import { EsbirkaNormalizer } from '../src/services/esbirka/EsbirkaNormalizer';

async function runPhase3Tests() {
  console.log('===============================================================');
  console.log('⚖️  RUNNING UNIT & INTEGRATION TESTS: E-SBÍRKA PHASE 3 (PORTAL)');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Reset memory store for clean test isolation
    EsbirkaLegalRepository.resetForTesting();

    // 2. Prepare mock normalized acts for the 4 core opatrovnické předpisy
    const actsToSeed = [
      {
        actCode: '89/2012',
        actNumber: 89,
        actYear: 2012,
        collection: 'Sb.',
        title: 'Zákon č. 89/2012 Sb., občanský zákoník',
        shortTitle: 'Občanský zákoník (o.z.)',
        actType: 'Zákon',
        category: 'FAMILY_LAW',
        status: 'ACTIVE',
        source: 'e-Sbírka MV ČR',
        sourceUri: 'https://api.e-sbirka.gov.cz/sb/2012/89',
        passedDate: new Date('2012-02-03'),
        promulgationDate: new Date('2012-03-22'),
        effectiveFrom: new Date('2014-01-01'),
        effectiveTo: null,
        lastAmendedDate: new Date('2024-01-01'),
        syncPriority: 1,
        contentHash: 'hash-89-2012-v2',
        rawMetadata: {},
        versionSnapshot: {
          versionNumber: '2',
          effectiveFrom: new Date('2024-01-01'),
          effectiveTo: null,
          promulgationDate: new Date('2023-12-15'),
          contentSnapshot: [
            {
              id: 'sec-855',
              sectionNumber: '§ 855',
              sectionOrder: 1,
              title: 'Rodičovská odpovědnost',
              content: 'Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů...',
              isKeySection: true,
              practicalNote: 'Základní ustanovení pro rovná práva obou rodičů.',
              courtRelevance: 'Nutno citovat při návrhu na péči obou rodičů.',
            },
            {
              id: 'sec-888',
              sectionNumber: '§ 888',
              sectionOrder: 2,
              title: 'Styk s dítětem',
              content: 'Dítě má právo na péči obou rodičů a na styk s nimi...',
              isKeySection: true,
              practicalNote: 'Garantuje právo dítěte na kontakt s otcem.',
              courtRelevance: 'Klíčové ustanovení při bránění ve styku.',
            },
          ],
          contentHash: 'hash-89-2012-v2',
          sourceNote: 'Novela 2024',
        },
        sections: [
          {
            sectionNumber: '§ 855',
            sectionOrder: 1,
            title: 'Rodičovská odpovědnost',
            content: 'Rodičovská odpovědnost zahrnuje povinnosti a práva rodičů...',
            isKeySection: true,
            practicalNote: 'Základní ustanovení pro rovná práva obou rodičů.',
            courtRelevance: 'Nutno citovat při návrhu na péči obou rodičů.',
          },
          {
            sectionNumber: '§ 888',
            sectionOrder: 2,
            title: 'Styk s dítětem',
            content: 'Dítě má právo na péči obou rodičů a na styk s nimi...',
            isKeySection: true,
            practicalNote: 'Garantuje právo dítěte na kontakt s otcem.',
            courtRelevance: 'Klíčové ustanovení při bránění ve styku.',
          },
        ],
      },
      {
        actCode: '359/1999',
        actNumber: 359,
        actYear: 1999,
        collection: 'Sb.',
        title: 'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí',
        shortTitle: 'ZSPOD',
        actType: 'Zákon',
        category: 'FAMILY_LAW',
        status: 'ACTIVE',
        source: 'e-Sbírka MV ČR',
        sourceUri: 'https://api.e-sbirka.gov.cz/sb/1999/359',
        passedDate: new Date('1999-12-09'),
        promulgationDate: new Date('1999-12-30'),
        effectiveFrom: new Date('2000-04-01'),
        effectiveTo: null,
        lastAmendedDate: new Date('2023-01-01'),
        syncPriority: 2,
        contentHash: 'hash-359-1999-v1',
        rawMetadata: {},
        versionSnapshot: {
          versionNumber: '1',
          effectiveFrom: new Date('2000-04-01'),
          effectiveTo: null,
          promulgationDate: new Date('1999-12-30'),
          contentSnapshot: [
            {
              sectionNumber: '§ 1',
              sectionOrder: 1,
              title: 'Předmět úpravy',
              content: 'Sociálně-právní ochrana dětí představuje zajištění práva dítěte na příznivý vývoj...',
              isKeySection: true,
            },
          ],
          contentHash: 'hash-359-1999-v1',
        },
        sections: [
          {
            sectionNumber: '§ 1',
            sectionOrder: 1,
            title: 'Předmět úpravy',
            content: 'Sociálně-právní ochrana dětí představuje zajištění práva dítěte na příznivý vývoj...',
            isKeySection: true,
          },
        ],
      },
      {
        actCode: '292/2013',
        actNumber: 292,
        actYear: 2013,
        collection: 'Sb.',
        title: 'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních',
        shortTitle: 'ZŘS',
        actType: 'Zákon',
        category: 'FAMILY_LAW',
        status: 'ACTIVE',
        source: 'e-Sbírka MV ČR',
        sourceUri: 'https://api.e-sbirka.gov.cz/sb/2013/292',
        passedDate: new Date('2013-09-12'),
        promulgationDate: new Date('2013-10-02'),
        effectiveFrom: new Date('2014-01-01'),
        effectiveTo: null,
        lastAmendedDate: new Date('2022-07-01'),
        syncPriority: 3,
        contentHash: 'hash-292-2013-v1',
        rawMetadata: {},
        versionSnapshot: {
          versionNumber: '1',
          effectiveFrom: new Date('2014-01-01'),
          effectiveTo: null,
          promulgationDate: new Date('2013-10-02'),
          contentSnapshot: [
            {
              sectionNumber: '§ 452',
              sectionOrder: 1,
              title: 'Předběžná opatření',
              content: 'Ocitlo-li se nezletilé dítě bez jakékoliv péče...',
              isKeySection: true,
            },
          ],
          contentHash: 'hash-292-2013-v1',
        },
        sections: [
          {
            sectionNumber: '§ 452',
            sectionOrder: 1,
            title: 'Předběžná opatření',
            content: 'Ocitlo-li se nezletilé dítě bez jakékoliv péče...',
            isKeySection: true,
          },
        ],
      },
      {
        actCode: '99/1963',
        actNumber: 99,
        actYear: 1963,
        collection: 'Sb.',
        title: 'Zákon č. 99/1963 Sb., občanský soudní řád',
        shortTitle: 'OSŘ',
        actType: 'Zákon',
        category: 'FAMILY_LAW',
        status: 'ACTIVE',
        source: 'e-Sbírka MV ČR',
        sourceUri: 'https://api.e-sbirka.gov.cz/sb/1963/99',
        passedDate: new Date('1963-12-04'),
        promulgationDate: new Date('1963-12-19'),
        effectiveFrom: new Date('1964-04-01'),
        effectiveTo: null,
        lastAmendedDate: new Date('2024-01-01'),
        syncPriority: 4,
        contentHash: 'hash-99-1963-v1',
        rawMetadata: {},
        versionSnapshot: {
          versionNumber: '1',
          effectiveFrom: new Date('1964-04-01'),
          effectiveTo: null,
          promulgationDate: new Date('1963-12-19'),
          contentSnapshot: [
            {
              sectionNumber: '§ 74',
              sectionOrder: 1,
              title: 'Předběžné opatření',
              content: 'Před zahájením řízení může předseda senátu nařídit předběžné opatření...',
              isKeySection: true,
            },
          ],
          contentHash: 'hash-99-1963-v1',
        },
        sections: [
          {
            sectionNumber: '§ 74',
            sectionOrder: 1,
            title: 'Předběžné opatření',
            content: 'Před zahájením řízení může předseda senátu nařídit předběžné opatření...',
            isKeySection: true,
          },
        ],
      },
    ];

    for (const act of actsToSeed) {
      await EsbirkaLegalRepository.persistNormalizedAct(act as any, 'NEW');
    }

    console.log('--- TEST GROUP 1: SUPPORTED ACTS LISTING ---');
    const supportedActs = await EsbirkaService.getSupportedActs();
    assert(supportedActs.length === 4, 'Returns all 4 seeded legal acts');
    assert(supportedActs.some((a) => a.actCode === '89/2012'), 'Includes 89/2012 Občanský zákoník');
    assert(supportedActs.some((a) => a.actCode === '359/1999'), 'Includes 359/1999 SPOD');
    assert(supportedActs.some((a) => a.actCode === '292/2013'), 'Includes 292/2013 ZŘS');
    assert(supportedActs.some((a) => a.actCode === '99/1963'), 'Includes 99/1963 OSŘ');
    assert(supportedActs.every((a) => a.isCurrent === true), 'All seeded acts evaluated as CURRENT today');

    console.log('\n--- TEST GROUP 2: ACT DETAIL & CURRENT WORDING ---');
    const ozDetail = await EsbirkaService.getActDetails('89/2012');
    assert(ozDetail !== null, 'Retrieves details for 89/2012');
    assert(ozDetail?.title.includes('občanský zákoník') === true, 'Act title correctly matches');
    assert(ozDetail?.sections?.length === 2, 'Contains 2 sections');

    const ozCurrent = await EsbirkaService.getCurrentActWording('89/2012');
    assert(ozCurrent !== null, 'Retrieves current wording for 89/2012');
    assert(ozCurrent?.validity === 'CURRENT', 'Current wording marked with CURRENT validity');
    assert(ozCurrent?.sections?.length === 2, 'Current wording sections count matches');

    console.log('\n--- TEST GROUP 3: TIME VERSIONS & DATE RESOLUTION ---');
    // Seed an older historical version for 89/2012 (effective 2014-01-01 to 2023-12-31)
    const historicalOzAct = {
      ...actsToSeed[0],
      versionSnapshot: {
        versionNumber: '1',
        effectiveFrom: new Date('2014-01-01'),
        effectiveTo: new Date('2023-12-31'),
        promulgationDate: new Date('2012-03-22'),
        contentSnapshot: [
          {
            sectionNumber: '§ 855',
            sectionOrder: 1,
            title: 'Rodičovská odpovědnost (2014)',
            content: 'Původní znění rodičovské odpovědnosti z roku 2014...',
          },
        ],
        contentHash: 'hash-89-2012-v1',
        sourceNote: 'Původní účinné znění',
      },
    };
    await EsbirkaLegalRepository.persistNormalizedAct(historicalOzAct as any, 'CHANGED');

    const ozVersions = await EsbirkaService.getActVersions('89/2012');
    assert(ozVersions.length >= 2, 'Retrieves multiple time versions for 89/2012');

    // Query wording at historical date: 2018-05-15
    const historicalWording = await EsbirkaService.getActWordingAtDate('89/2012', new Date('2018-05-15'));
    assert(historicalWording !== null, 'Retrieves wording for historical date 2018-05-15');
    assert(historicalWording?.validity === 'PAST', 'Historical wording evaluated as PAST status');
    assert(historicalWording?.version?.versionNumber === '1', 'Correctly picked version 1 for 2018');

    // Query wording at current date: 2025-01-01
    const currentWording = await EsbirkaService.getActWordingAtDate('89/2012', new Date('2025-01-01'));
    assert(currentWording !== null, 'Retrieves wording for 2025-01-01');
    assert(currentWording?.validity === 'CURRENT', 'Evaluated as CURRENT for 2025-01-01');
    assert(currentWording?.version?.versionNumber === '2', 'Correctly picked version 2 for 2025');

    // Query wording before act was effective: 2000-01-01
    const futureWording = await EsbirkaService.getActWordingAtDate('89/2012', new Date('2000-01-01'));
    assert(futureWording !== null && futureWording.validity === 'FUTURE', 'Date prior to promulgation marked as FUTURE');

    console.log('\n--- TEST GROUP 4: FAIL-CLOSED & SECURITY GUARANTEES ---');
    const nonExistent = await EsbirkaService.getActDetails('9999/9999');
    assert(nonExistent === null, 'Non-existent act returns NULL (404), zero dummy data');

    const nonExistentWording = await EsbirkaService.getCurrentActWording('000/0000');
    assert(nonExistentWording === null, 'Non-existent current wording returns NULL (404)');

    console.log('\n===============================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  }
}

runPhase3Tests();
