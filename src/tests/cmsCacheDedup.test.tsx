import assert from 'node:assert';
import { fetchCmsPublic, clearCmsCache } from '../lib/cmsCache';

export async function runCmsCacheDedupTests() {
  console.log('\n=============================================================');
  console.log('--- CMS CACHE & REQUEST DEDUPLICATION TESTS ---');
  console.log('=============================================================\n');

  clearCmsCache();

  let fetchCount = 0;
  const originalFetch = global.fetch;

  try {
    // --- Test 1: Deduplication for /api/cms/articles ---
    console.log('Test 1: Concurrent request deduplication for /api/cms/articles...');
    global.fetch = (async (url: any) => {
      fetchCount++;
      await new Promise(r => setTimeout(r, 30));
      return {
        ok: true,
        text: async () => JSON.stringify([{ id: 'art-1', title: 'Test Article' }]),
      } as Response;
    }) as any;

    clearCmsCache();
    fetchCount = 0;

    const p1 = fetchCmsPublic('/api/cms/articles');
    const p2 = fetchCmsPublic('/api/cms/articles');

    const [res1, res2] = await Promise.all([p1, p2]);

    assert.strictEqual(fetchCount, 1, 'Two concurrent requests must trigger exactly ONE HTTP fetch call');
    assert.deepStrictEqual(res1, res2, 'Both promises must resolve to the same data');
    assert.ok(Array.isArray(res1), 'Result should be an array of articles');
    console.log('✅ Test 1 Passed\n');

    // --- Test 2: Deduplication for /api/cms/faqs ---
    console.log('Test 2: Concurrent request deduplication for /api/cms/faqs...');
    clearCmsCache();
    fetchCount = 0;

    global.fetch = (async (url: any) => {
      fetchCount++;
      await new Promise(r => setTimeout(r, 30));
      return {
        ok: true,
        text: async () => JSON.stringify([{ id: 'faq-1', question: 'Test Q', answer: 'Test A' }]),
      } as Response;
    }) as any;

    const f1 = fetchCmsPublic('/api/cms/faqs');
    const f2 = fetchCmsPublic('/api/cms/faqs');

    const [faqRes1, faqRes2] = await Promise.all([f1, f2]);

    assert.strictEqual(fetchCount, 1, 'Two concurrent FAQ requests must trigger exactly ONE HTTP fetch call');
    assert.deepStrictEqual(faqRes1, faqRes2, 'Both FAQ promises must resolve to the same data');
    console.log('✅ Test 2 Passed\n');

    // --- Test 3: HTTP 429 / Rate Exceeded safe handling ---
    console.log('Test 3: HTTP 429 / "Rate exceeded." error handling...');
    clearCmsCache();
    global.fetch = (async (url: any) => {
      return {
        ok: false,
        status: 429,
        text: async () => 'Rate exceeded.',
      } as Response;
    }) as any;

    let caughtError: any = null;
    try {
      await fetchCmsPublic('/api/cms/articles');
    } catch (err: any) {
      caughtError = err;
    }

    assert.ok(caughtError !== null, 'Should catch error on 429 rate exceeded');
    assert.ok(caughtError.message.includes('Rate exceeded.') || caughtError.message.includes('429'), 'Error message should reflect rate exceeded or 429');
    console.log('✅ Test 3 Passed\n');

    console.log('🎉 CMS CACHE & DEDUPLICATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    global.fetch = originalFetch;
    clearCmsCache();
  }
}

if (process.argv[1] && process.argv[1].endsWith('cmsCacheDedup.test.tsx')) {
  runCmsCacheDedupTests().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
}
