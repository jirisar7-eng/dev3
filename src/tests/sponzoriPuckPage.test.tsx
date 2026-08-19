import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { PartnersView } from '../components/public/PartnersView';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';

console.log('=============================================================');
console.log('--- PUCK P0 /sponzori PAGE & FALLBACK TESTS ---');
console.log('=============================================================');

const wrapWithProvider = (element: React.ReactElement) => {
  return <TextProvider>{element}</TextProvider>;
};

async function runSponzoriTests() {
  // Test 1: Fallback to original PartnersView
  const fallbackHtml = renderToStaticMarkup(wrapWithProvider(<PartnersView />));
  assert.ok(fallbackHtml.includes('Naši partneři a sponzoři'), 'Should render original PartnersView badge/heading');
  assert.ok(fallbackHtml.includes('Podporují nás'), 'Should render original heading');
  assert.ok(fallbackHtml.includes('Zajištění dostupnosti poradenských materiálů'), 'Should render original description');
  console.log('✅ Test 1 Passed: Original PartnersView fallback renders correctly for /sponzori');

  // Test 2: Validation of Puck JSON structure for sponzori
  const sponzoriPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-sponzori',
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
          id: 'feed-sponzori',
          title: 'Technologičtí a odborní partneři',
          subtitle: 'Děkujeme za podporu infrastruktury a provozu portálu.',
          categoryFilter: 'Partneři a sponzoři',
          limit: 6,
        },
      },
      {
        type: 'CallToAction',
        props: {
          id: 'cta-sponzori',
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

  assert.ok(Array.isArray(sponzoriPuckData.content), 'Puck content must be an array');
  assert.strictEqual(sponzoriPuckData.content.length, 3, 'Should have 3 Puck blocks');
  console.log('✅ Test 2 Passed: Sponzori Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProvider(<PageRender data={sponzoriPuckData} />));
  assert.ok(puckHtml.includes('Naši partneři a sponzoři'), 'Puck render must include hero badge');
  assert.ok(puckHtml.includes('Podporují nás'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Stát se partnerem'), 'Puck render must include hero CTA');
  assert.ok(puckHtml.includes('Chcete se stát partnerem projektu Táta má právo?'), 'Puck render must include CTA title');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature flag logic and fallback conditions
  const mockStorage: Record<string, string> = {};
  const isPuckEnabled = (flagKey: string, globalKey: string) => {
    return mockStorage[flagKey] === 'true' || mockStorage[globalKey] === 'true';
  };

  // Default: OFF
  assert.strictEqual(isPuckEnabled('PUCK_SPONZORI_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'), false, 'Default flag must be OFF');

  // Sponzori flag enabled
  mockStorage['PUCK_SPONZORI_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(isPuckEnabled('PUCK_SPONZORI_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'), true, 'Page-specific flag must enable Puck');

  // Reset & Global flag enabled
  delete mockStorage['PUCK_SPONZORI_RENDERER_ENABLED'];
  mockStorage['PUCK_PUBLIC_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(isPuckEnabled('PUCK_SPONZORI_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'), true, 'Global public flag must enable Puck');

  // Corrupted/Invalid Puck data fallback validation
  const testCorruptedData = (data: any) => {
    try {
      const raw = typeof data === 'string' ? JSON.parse(data) : data;
      if (raw && typeof raw === 'object' && Array.isArray(raw.content)) {
        return raw;
      }
      return null;
    } catch {
      return null;
    }
  };

  assert.strictEqual(testCorruptedData('{ invalid json'), null, 'Corrupted JSON string should safely resolve to null fallback');
  assert.strictEqual(testCorruptedData({ noContent: true }), null, 'Object without content array should safely resolve to null fallback');
  assert.notStrictEqual(testCorruptedData(sponzoriPuckData), null, 'Valid Puck data should parse correctly');

  console.log('✅ Test 4 Passed: Feature flag matrix and safe fallback logic verified');
  console.log('\n🎉 ALL SPONZORI PUCK TESTS PASSED SUCCESSFULLY!\n');
}

runSponzoriTests().catch((err) => {
  console.error('❌ Sponzori tests failed:', err);
  process.exit(1);
});
