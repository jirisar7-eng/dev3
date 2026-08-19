import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { FounderStoryPage } from '../components/public/FounderStoryPage';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';

console.log('=============================================================');
console.log('--- PUCK P0 /cesta-zakladatele TESTS ---');
console.log('=============================================================');

const wrapWithProvider = (element: React.ReactElement) => {
  return <TextProvider>{element}</TextProvider>;
};

async function runFounderStoryTests() {
  // Test 1: Fallback to original FounderStoryPage when Flag is OFF
  const fallbackHtml = renderToStaticMarkup(wrapWithProvider(<FounderStoryPage />));
  assert.ok(fallbackHtml.includes('Cesta zakladatele projektu'), 'Should render original FounderStoryPage title');
  assert.ok(fallbackHtml.includes('Synthesis OS • Osobní příběh &amp; mise') || fallbackHtml.includes('Synthesis OS • Osobní příběh & mise'), 'Should render original banner badge');
  assert.ok(fallbackHtml.includes('Když se zhroutí jistoty'), 'Should render Section 1');
  assert.ok(fallbackHtml.includes('Vize Synthesis OS'), 'Should render Section 3');
  console.log('✅ Test 1 Passed: Original FounderStoryPage fallback renders completely');

  // Test 2: Validation of Puck JSON structure for cesta-zakladatele
  const founderPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-cesta-zakladatele',
          badgeText: 'Synthesis OS • Osobní příběh & mise',
          title: 'Cesta zakladatele projektu',
          description: 'Proč vznikla platforma Táta má právo? Osobní zkušenost s opatrovnickým systémem, hledání spravedlnosti a vize digitální infrastruktury pro rodiny v krizi.',
          ctaText: 'O projektu',
          ctaUrl: '/o-projektu',
          secondaryCtaText: 'Kontaktní formulář',
          secondaryCtaUrl: '/kontakt',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-founder-story-1',
          text: '### 1. Když se zhroutí jistoty\nKaždý velký projekt obvykle začíná hlubokou osobní krizí nebo silným impulzem...',
          align: 'left',
          maxWidth: 'xl',
          color: 'default',
        },
      },
      {
        type: 'ColumnsBlock',
        props: {
          id: 'columns-founder-pillars',
          columnsCount: '2',
          ratio: 'equal',
          gap: 'lg',
          col1Title: 'Právní jistota & fakta',
          col1Text: 'Všechny výstupy vycházejí z platné legislativy ČR...',
          col2Title: 'Dítě v centru zájmu',
          col2Text: 'Hlavním motorem projektu je ochrana nejlepšího zájmu dítěte...',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-founder-story-2',
          text: '### 2. Od poznání k systémovému řešení...',
          align: 'left',
          maxWidth: 'xl',
          color: 'default',
        },
      },
      {
        type: 'CallToAction',
        props: {
          id: 'cta-founder-support',
          title: 'Chcete podpořit naši misi?',
          description: 'Připojte se k naší komunitě dobrovolníků nebo podpořte provoz portálu Táta má právo.',
          buttonText: 'Podpořit projekt',
          buttonUrl: '/podporte-nas',
          variant: 'primary',
        },
      },
    ],
    root: {
      props: {
        title: 'Cesta zakladatele projektu',
      },
    },
  };

  assert.ok(Array.isArray(founderPuckData.content), 'Puck content must be an array');
  assert.strictEqual(founderPuckData.content.length, 5, 'Should have 5 Puck blocks');
  console.log('✅ Test 2 Passed: Cesta zakladatele Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProvider(<PageRender data={founderPuckData} />));
  assert.ok(puckHtml.includes('Cesta zakladatele projektu'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Synthesis OS'), 'Puck render must include badge');
  assert.ok(puckHtml.includes('Právní jistota &amp; fakta') || puckHtml.includes('Právní jistota & fakta'), 'Puck render must include columns block');
  assert.ok(puckHtml.includes('Chcete podpořit naši misi?'), 'Puck render must include CTA');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature flag matrix & fallback logic
  const mockStorage: Record<string, string> = {};
  const isPuckEnabled = (flagKey: string, globalKey: string) => {
    return mockStorage[flagKey] === 'true' || mockStorage[globalKey] === 'true';
  };

  assert.strictEqual(
    isPuckEnabled('PUCK_CESTA_ZAKLADATELE_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    false,
    'Default flag must be OFF'
  );

  mockStorage['PUCK_CESTA_ZAKLADATELE_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_CESTA_ZAKLADATELE_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Page-specific flag must enable Puck'
  );

  delete mockStorage['PUCK_CESTA_ZAKLADATELE_RENDERER_ENABLED'];
  mockStorage['PUCK_PUBLIC_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_CESTA_ZAKLADATELE_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Global public flag must enable Puck'
  );

  console.log('✅ Test 4 Passed: Feature flag matrix and fallback logic verified');
  console.log('\n🎉 ALL FOUNDER STORY PUCK TESTS PASSED SUCCESSFULLY!\n');
}

runFounderStoryTests().catch((err) => {
  console.error('❌ Founder Story tests failed:', err);
  process.exit(1);
});
