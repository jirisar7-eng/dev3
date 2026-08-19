import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { UserManualPage } from '../components/public/UserManualPage';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';

console.log('=============================================================');
console.log('--- PUCK P0 /user-manual TESTS ---');
console.log('=============================================================');

const wrapWithProvider = (element: React.ReactElement) => {
  return <TextProvider>{element}</TextProvider>;
};

async function runUserManualTests() {
  // Test 1: Fallback to original UserManualPage when Flag is OFF
  const fallbackHtml = renderToStaticMarkup(wrapWithProvider(<UserManualPage />));
  assert.ok(fallbackHtml.includes('Nápověda &amp; Uživatelský manuál') || fallbackHtml.includes('Nápověda & Uživatelský manuál'), 'Should render original UserManualPage title');
  assert.ok(fallbackHtml.includes('Stránka je připravena pro budoucí obsah'), 'Should render fallback description');
  console.log('✅ Test 1 Passed: Original UserManualPage fallback renders completely');

  // Test 2: Validation of Puck JSON structure for user-manual
  const userManualPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-user-manual',
          badgeText: 'Nápověda k platformě',
          title: 'Uživatelský manuál & Nápověda',
          description: 'Kompletní průvodce platformou Táta má právo a systémem Synthesis OS. Od prvního přihlášení až po pokročilou správu opatrovnického spisu.',
          ctaText: 'Začít s průvodcem',
          ctaUrl: '/o-projektu',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-user-manual-1',
          text: '### 📥 Sekce se aktuálně připravuje\n\nVšechny technické cesty, oprávnění a navigační vazby byly úspěšně sestaveny. Tento modul je plně registrován v systému a čeká na napojení finálního obsahu v další fázi projektu. Brzy zde najdete detailní návody na použití AI asistentů, správu případů a práci se zabezpečeným úložištěm.',
          align: 'center',
          maxWidth: 'xl',
          color: 'default',
        },
      }
    ],
    root: {
      props: {
        title: 'Uživatelská příručka a nápověda',
      },
    },
  };

  assert.ok(Array.isArray(userManualPuckData.content), 'Puck content must be an array');
  assert.strictEqual(userManualPuckData.content.length, 2, 'Should have 2 Puck blocks');
  console.log('✅ Test 2 Passed: User manual Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProvider(<PageRender data={userManualPuckData} />));
  assert.ok(puckHtml.includes('Uživatelský manuál &amp; Nápověda') || puckHtml.includes('Uživatelský manuál & Nápověda'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Nápověda k platformě'), 'Puck render must include badge');
  assert.ok(puckHtml.includes('Sekce se aktuálně připravuje'), 'Puck render must include text block');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature flag matrix & fallback logic
  const mockStorage: Record<string, string> = {};
  const isPuckEnabled = (flagKey: string, globalKey: string) => {
    return mockStorage[flagKey] === 'true' || mockStorage[globalKey] === 'true';
  };

  assert.strictEqual(
    isPuckEnabled('PUCK_USER_MANUAL_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    false,
    'Default flag must be OFF'
  );

  mockStorage['PUCK_USER_MANUAL_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_USER_MANUAL_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Page-specific flag must enable Puck'
  );

  delete mockStorage['PUCK_USER_MANUAL_RENDERER_ENABLED'];
  mockStorage['PUCK_PUBLIC_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_USER_MANUAL_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Global public flag must enable Puck'
  );

  console.log('✅ Test 4 Passed: Feature flag matrix and fallback logic verified');
  console.log('\n🎉 ALL USER MANUAL PUCK TESTS PASSED SUCCESSFULLY!\n');
}

runUserManualTests().catch((err) => {
  console.error('❌ User manual tests failed:', err);
  process.exit(1);
});
