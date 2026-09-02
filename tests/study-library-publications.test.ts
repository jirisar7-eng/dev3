import test from 'node:test';
import assert from 'node:assert/strict';
import { StudyService } from '../src/services/studyService';
import { dbStore } from '../src/services/dbStore';

test('Study Library - Fabricius & Suh (2017) and Warshak (2018) publications', async (t) => {
  await t.test('1. should retrieve exactly 19 published studies from StudyService', async () => {
    const studies = await StudyService.getStudies({ status: 'PUBLISHED' });
    assert.ok(studies.length >= 19, 'Should have at least 19 published studies');
  });

  await t.test('2. should verify Fabricius & Suh (2017) metadata integrity', async () => {
    const fabriciusSlug = 'fabricius-suh-2017-prespavani-kojencu-batolat-otcove';
    const study = await StudyService.getStudyBySlug(fabriciusSlug);

    assert.ok(study, 'Fabricius & Suh study must exist');
    assert.strictEqual(study.slug, fabriciusSlug);
    assert.strictEqual(study.authors, 'William V. Fabricius, Go Woon Suh');
    assert.strictEqual(study.publicationYear, 2017);
    assert.strictEqual(study.doi, '10.1037/law0000108');
    assert.strictEqual(study.sourceUrl, 'https://doi.org/10.1037/law0000108');
    assert.strictEqual(study.category, 'stridava_pece');
    assert.strictEqual(study.status, 'PUBLISHED');
    assert.strictEqual(study.featured, true);
    assert.strictEqual(
      study.originalTitle,
      'Should Infants and Toddlers Have Frequent Overnight Parenting Time With Fathers? The Policy Debate and New Data'
    );
    assert.strictEqual(
      study.title,
      'Frekvence přespávání kojenců a batolat u otců v rámci střídavé péče: Nová data a debata o rodinné politice'
    );
  });

  await t.test('3. should verify Warshak (2018) metadata integrity', async () => {
    const warshakSlug = 'warshak-2018-nocni-pece-prespavani-deti-odmitnuti-pausalnich-omezeni';
    const study = await StudyService.getStudyBySlug(warshakSlug);

    assert.ok(study, 'Warshak study must exist');
    assert.strictEqual(study.slug, warshakSlug);
    assert.strictEqual(study.authors, 'Richard A. Warshak');
    assert.strictEqual(study.publicationYear, 2018);
    assert.strictEqual(study.doi, '10.1080/10502556.2018.1454193');
    assert.strictEqual(study.sourceUrl, 'https://doi.org/10.1080/10502556.2018.1454193');
    assert.strictEqual(study.category, 'stridava_pece');
    assert.strictEqual(study.status, 'PUBLISHED');
    assert.strictEqual(study.featured, true);
    assert.strictEqual(
      study.originalTitle,
      'Night Shifts: Revisiting Blanket Restrictions on Children’s Overnights With Separated Parents'
    );
    assert.strictEqual(
      study.title,
      'Noční péče: Přehodnocení plošných zákazů a omezení přespávání dětí u odloučených rodičů'
    );
  });

  await t.test('4. should verify no duplicate Slugs exist', async () => {
    const studies = await StudyService.getStudies();
    const slugs = studies.map((s) => s.slug);
    const uniqueSlugs = new Set(slugs);

    assert.strictEqual(uniqueSlugs.size, slugs.length, 'Slugs must be unique');
  });

  await t.test('5. should support fulltext search for authors and keywords', async () => {
    const fabriciusSearch = await StudyService.getStudies({ search: 'Fabricius' });
    assert.ok(fabriciusSearch.length >= 1, 'Should find at least 1 study for Fabricius');
    assert.ok(fabriciusSearch.some(s => s.slug === 'fabricius-suh-2017-prespavani-kojencu-batolat-otcove'), 'Should contain the Fabricius & Suh 2017 study');

    const warshakSearch = await StudyService.getStudies({ search: 'Warshak' });
    assert.ok(warshakSearch.length >= 1, 'Should find at least 1 study for Warshak');
    assert.ok(warshakSearch.some(s => s.slug === 'warshak-2018-nocni-pece-prespavani-deti-odmitnuti-pausalnich-omezeni'), 'Should contain the Warshak 2018 study');

    const commonSearch = await StudyService.getStudies({ search: 'přespávání' });
    assert.ok(commonSearch.length >= 2, 'Should find at least 2 studies for search word "přespávání"');
  });
});
