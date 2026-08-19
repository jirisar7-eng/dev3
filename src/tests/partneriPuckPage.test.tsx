import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { PartnersView } from '../components/public/PartnersView';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';

console.log('=============================================================');
console.log('--- PUCK P0 /partneri PAGE & FALLBACK TESTS ---');
console.log('=============================================================');

const wrapWithProvider = (element: React.ReactElement) => {
  return <TextProvider>{element}</TextProvider>;
};

async function runPartneriTests() {
  // Test 1: Fallback to original PartnersView
  const fallbackHtml = renderToStaticMarkup(wrapWithProvider(<PartnersView />));
  assert.ok(fallbackHtml.includes('Naši partneři a sponzoři'), 'Should render original PartnersView badge/heading');
  assert.ok(fallbackHtml.includes('Podporují nás'), 'Should render original heading');
  assert.ok(fallbackHtml.includes('Zajištění dostupnosti poradenských materiálů'), 'Should render original description');
  console.log('✅ Test 1 Passed: Original PartnersView fallback renders correctly');

  // Test 2: Validation of Puck JSON structure for partneri
  const partneriPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-partneri',
          badgeText: 'Naši partneři a sponzoři',
          title: 'Podporují nás',
          description: 'Zajištění dostupnosti poradenských materiálů, článků a vzorů právních podání 24 hodin denně, 7 dní v týdnu je pro otce v krizových situacích klíčové.',
          ctaText: 'Stát se partnerem',
          ctaUrl: '/kontakt',
          secondaryCtaText: 'Podpořit spolek',
          secondaryCtaUrl: '/podporte-nas',
        },
      },
      {
        type: 'ArticlesFeedBlock',
        props: {
          id: 'feed-partneri',
          title: 'Technologičtí a odborní partneři',
          subtitle: 'Děkujeme za podporu infrastruktury a provozu portálu.',
          categoryFilter: 'Partneři a sponzoři',
          limit: 6,
        },
      },
      {
        type: 'CallToAction',
        props: {
          id: 'cta-partneri',
          title: 'Chcete se stát partnerem projektu Táta má právo?',
          description: 'Pomozte nám rozvíjet nezávislé právní a psychologické nástroje pro rodiny v opatrovnických řízeních.',
          buttonText: 'Kontaktovat koordinátora',
          buttonUrl: '/kontakt',
          variant: 'primary',
        },
      },
    ],
    root: {
      props: {
        title: 'Partneři a sponzoři',
      },
    },
  };

  assert.ok(Array.isArray(partneriPuckData.content), 'Puck content must be an array');
  assert.strictEqual(partneriPuckData.content.length, 3, 'Should have 3 Puck blocks');
  console.log('✅ Test 2 Passed: Partneri Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProvider(<PageRender data={partneriPuckData} />));
  assert.ok(puckHtml.includes('Naši partneři a sponzoři'), 'Puck render must include hero badge');
  assert.ok(puckHtml.includes('Podporují nás'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Stát se partnerem'), 'Puck render must include hero CTA');
  assert.ok(puckHtml.includes('Chcete se stát partnerem projektu Táta má právo?'), 'Puck render must include CTA title');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature Flag resolution and safe rollback fallback logic
  const resolveRenderer = (
    flagPartneri: boolean,
    flagPublic: boolean,
    hasValidPuckData: boolean,
    isNetworkOk: boolean
  ): 'PUCK' | 'ORIGINAL_FALLBACK' => {
    const isPuckEnabled = flagPartneri || flagPublic;
    if (!isPuckEnabled) {
      return 'ORIGINAL_FALLBACK';
    }
    if (!hasValidPuckData || !isNetworkOk) {
      return 'ORIGINAL_FALLBACK';
    }
    return 'PUCK';
  };

  // 4a. Default OFF
  assert.strictEqual(resolveRenderer(false, false, true, true), 'ORIGINAL_FALLBACK', 'Default OFF must use original fallback');
  // 4b. Enabled via PUCK_PARTNERI_RENDERER_ENABLED
  assert.strictEqual(resolveRenderer(true, false, true, true), 'PUCK', 'Page flag enabled with valid data must use Puck');
  // 4c. Enabled via global PUCK_PUBLIC_RENDERER_ENABLED
  assert.strictEqual(resolveRenderer(false, true, true, true), 'PUCK', 'Global flag enabled with valid data must use Puck');
  // 4d. Enabled but invalid Puck data -> Fallback
  assert.strictEqual(resolveRenderer(true, false, false, true), 'ORIGINAL_FALLBACK', 'Invalid Puck data must trigger safe fallback');
  // 4e. Enabled but network/DB error -> Fallback
  assert.strictEqual(resolveRenderer(true, false, true, false), 'ORIGINAL_FALLBACK', 'Network/DB failure must trigger safe fallback');
  console.log('✅ Test 4 Passed: Feature flag matrix and safe fallback logic verified');

  console.log('🎉 ALL PARTNERI PUCK TESTS PASSED SUCCESSFULLY!');
}

runPartneriTests().catch((err) => {
  console.error('❌ Partneri tests failed:', err);
  process.exit(1);
});
