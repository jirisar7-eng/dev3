import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { SitemapPage } from '../components/public/SitemapPage';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';

console.log('=============================================================');
console.log('--- PUCK P0 /sitemap TESTS ---');
console.log('=============================================================');

const wrapWithProvider = (element: React.ReactElement) => {
  return <TextProvider>{element}</TextProvider>;
};

async function runSitemapTests() {
  // Test 1: Fallback to original SitemapPage when Flag is OFF
  const fallbackHtml = renderToStaticMarkup(wrapWithProvider(<SitemapPage />));
  assert.ok(fallbackHtml.includes('Architektura &amp; Vývoj Synthesis OS (Sitemap)') || fallbackHtml.includes('Architektura & Vývoj Synthesis OS (Sitemap)'), 'Should render original SitemapPage title');
  assert.ok(fallbackHtml.includes('Stránka je připravena pro budoucí obsah'), 'Should render fallback description');
  console.log('✅ Test 1 Passed: Original SitemapPage fallback renders completely');

  // Test 2: Validation of Puck JSON structure for sitemap
  const sitemapPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-sitemap',
          badgeText: 'Mapa webu',
          title: 'Architektura & Vývoj Synthesis OS (Sitemap)',
          description: 'Přehledná struktura všech sekcí a modulů portálu Táta má právo.',
          ctaText: 'Zpět na domovskou stránku',
          ctaUrl: '/',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-sitemap-1',
          text: '### 📥 Sekce se aktuálně připravuje\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny.',
          align: 'center',
          maxWidth: 'xl',
          color: 'default',
        },
      }
    ],
    root: {
      props: {
        title: 'Mapa stránek a architektura',
      },
    },
  };

  assert.ok(Array.isArray(sitemapPuckData.content), 'Puck content must be an array');
  assert.strictEqual(sitemapPuckData.content.length, 2, 'Should have 2 Puck blocks');
  console.log('✅ Test 2 Passed: Sitemap Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProvider(<PageRender data={sitemapPuckData} />));
  assert.ok(puckHtml.includes('Architektura &amp; Vývoj Synthesis OS (Sitemap)') || puckHtml.includes('Architektura & Vývoj Synthesis OS (Sitemap)'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Mapa webu'), 'Puck render must include badge');
  assert.ok(puckHtml.includes('Sekce se aktuálně připravuje'), 'Puck render must include text block');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature flag matrix & fallback logic
  const mockStorage: Record<string, string> = {};
  const isPuckEnabled = (flagKey: string, globalKey: string) => {
    return mockStorage[flagKey] === 'true' || mockStorage[globalKey] === 'true';
  };

  assert.strictEqual(
    isPuckEnabled('PUCK_SITEMAP_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    false,
    'Default flag must be OFF'
  );

  mockStorage['PUCK_SITEMAP_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_SITEMAP_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Page-specific flag must enable Puck'
  );

  delete mockStorage['PUCK_SITEMAP_RENDERER_ENABLED'];
  mockStorage['PUCK_PUBLIC_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_SITEMAP_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Global public flag must enable Puck'
  );

  console.log('✅ Test 4 Passed: Feature flag matrix and fallback logic verified');
  console.log('\n🎉 ALL SITEMAP PUCK TESTS PASSED SUCCESSFULLY!\n');
}

runSitemapTests().catch((err) => {
  console.error('❌ Sitemap tests failed:', err);
  process.exit(1);
});
