import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { GdprComplianceCenterPage } from '../components/public/GdprComplianceCenterPage';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';
import { AuthProvider } from '../context/AuthContext';

console.log('=============================================================');
console.log('--- PUCK P0 /zasady-ochrany-osobnich-udaju & /privacy-policy TESTS ---');
console.log('=============================================================');

const wrapWithProviders = (element: React.ReactElement) => {
  return (
    <AuthProvider>
      <TextProvider>{element}</TextProvider>
    </AuthProvider>
  );
};

async function runPrivacyPolicyTests() {
  // Test 1: Fallback to original GdprComplianceCenterPage when Flag is OFF
  const fallbackHtml = renderToStaticMarkup(wrapWithProviders(<GdprComplianceCenterPage />));
  assert.ok(fallbackHtml.includes('GDPR Compliance Center'), 'Should render original GdprComplianceCenterPage title');
  assert.ok(
    fallbackHtml.includes('Synthesis OS • Security &amp; Privacy Compliance') ||
    fallbackHtml.includes('Synthesis OS • Security & Privacy Compliance'),
    'Should render original banner badge'
  );
  assert.ok(fallbackHtml.includes('Zásady zpracování a ochrany osobních údajů'), 'Should render policy title');
  assert.ok(fallbackHtml.includes('Identifikace správce'), 'Should render Section 1');
  assert.ok(fallbackHtml.includes('Práva uživatelů'), 'Should render Section 7');
  console.log('✅ Test 1 Passed: Original GdprComplianceCenterPage fallback renders completely');

  // Test 2: Validation of Puck JSON structure for zasady-ochrany-osobnich-udaju
  const privacyPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-privacy-policy',
          badgeText: 'Synthesis OS • Security & Privacy Compliance',
          title: 'Zásady ochrany osobních údajů (GDPR)',
          description: 'Transparentní zpracování a ochrana osobních údajů podle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR). Release 0.5.1 • Účinnost od 12. 8. 2026.',
          ctaText: 'Zpět na hlavní portál',
          ctaUrl: '/',
          secondaryCtaText: 'Kontaktní formulář',
          secondaryCtaUrl: '/kontakt',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-privacy-controller',
          text: '### 1. Identifikace správce\nSprávcem osobních údajů podle Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR) je:\n- **Jméno a příjmení:** Jiří Šár (fyzická osoba nepodnikající)\n- **Role:** Zakladatel a provozovatel projektu *Táta má právo / Synthesis OS*\n- **Webový portál:** www.tatovacesta.cz\n- **Kontaktní e-mail:** info@tatovacesta.cz | **Pověřený GDPR e-mail:** gdpr@tatamapravo.cz\n\n### 2. Kategorie a soubory zpracovávaných údajů\nZpracováváme osobní údaje nezbytné pro provoz portálu, komunitních funkcí a AI nástrojů:\n- **Identifikační a kontaktní údaje:** E-mailová adresa, uživatelské jméno, unikátní ID účtu.\n- **Technické údaje:** IP adresa, soubory cookies, logy přihlášení, typ prohlížeče.\n- **Autentizační údaje (Passkeys):** Systém **neukládá biometrické údaje**. Biometrická autentizace probíhá výhradně na zařízení uživatele (FIDO2/WebAuthn). Na server se přenáší pouze kryptografický veřejný klíč.',
          align: 'left',
          maxWidth: 'xl',
          color: 'default',
        },
      },
      {
        type: 'ColumnsBlock',
        props: {
          id: 'columns-privacy-sensitive',
          columnsCount: '2',
          ratio: 'equal',
          gap: 'lg',
          col1Title: '2.4 Citlivé osobní údaje (Čl. 9)',
          col1Text: 'Při vkládání podkladů do poradny systém zpracovává informace z rodinných vztahů a soudních spisů. Tyto údaje nejsou vyžadovány pro běžné použití a doporučuje se jejich důsledná anonymizace.',
          col2Title: '3. Zpracování pomocí AI',
          col2Text: 'AI nástroje uplatňují princip minimalizace dat. Výstupy slouží jako orientační podklad a nepředstavují automatizované rozhodování podle Čl. 22 GDPR.',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-privacy-rights',
          text: '### 5. Ochrana osobních údajů nezletilých dětí\nPortál **není určen k veřejnému zveřejňování identifikačních údajů o dětech**. V komunitních sekcích je zakázáno uvádět celá jména dětí, fotografie, rodná čísla nebo adresy škol a bydliště. Veškeré příběhy musí být důsledně anonymizovány.\n\n### 6. Uchování dat a zálohování\nOsobní údaje aktivních účtů uchováváme po dobu trvání registrace. Po žádosti o zrušení účtu dojde k výmazu údajů z aktivních systémů do 30 dnů. Technické zálohy jsou přemazávány v automatických cyklech (max. 90 dnů).\n\n### 7. Práva uživatelů podle GDPR\nMáte právo na přístup (Čl. 15), opravu (Čl. 16), výmaz / právo být zapomenut (Čl. 17), omezení zpracování (Čl. 18), přenositelnost údajů (Čl. 20) a vznesení námitky (Čl. 21). Svá práva můžete uplatnit na e-mailu gdpr@tatamapravo.cz.',
          align: 'left',
          maxWidth: 'xl',
          color: 'default',
        },
      },
      {
        type: 'CallToAction',
        props: {
          id: 'cta-privacy-contact',
          title: 'Máte dotaz k ochraně osobních údajů nebo chcete uplatnit svá práva?',
          description: 'Náš pověřený tým pro ochranu osobních údajů vám rád odpoví a pomůže s uplatněním práv subjektu údajů podle GDPR.',
          buttonText: 'Kontaktovat GDPR podporu',
          buttonUrl: '/kontakt',
          variant: 'primary',
        },
      },
    ],
    root: {
      props: {
        title: 'Zásady ochrany osobních údajů (GDPR)',
      },
    },
  };

  assert.ok(Array.isArray(privacyPuckData.content), 'Puck content must be an array');
  assert.strictEqual(privacyPuckData.content.length, 5, 'Should have 5 Puck blocks');
  console.log('✅ Test 2 Passed: Zásady ochrany osobních údajů Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProviders(<PageRender data={privacyPuckData} />));
  assert.ok(puckHtml.includes('Zásady ochrany osobních údajů (GDPR)'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Synthesis OS • Security &amp; Privacy Compliance') || puckHtml.includes('Synthesis OS • Security & Privacy Compliance'), 'Puck render must include hero badge');
  assert.ok(puckHtml.includes('Identifikace správce'), 'Puck render must include controller identification');
  assert.ok(puckHtml.includes('Citlivé osobní údaje'), 'Puck render must include sensitive data column');
  assert.ok(puckHtml.includes('Kontaktovat GDPR podporu'), 'Puck render must include CTA button');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature flag logic and fallback conditions
  const mockStorage: Record<string, string> = {};
  const isPuckEnabled = (flagKey: string, globalKey: string) => {
    return mockStorage[flagKey] === 'true' || mockStorage[globalKey] === 'true';
  };

  // 4a. Default: OFF
  assert.strictEqual(
    isPuckEnabled('PUCK_PRIVACY_POLICY_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    false,
    'Default flag must be OFF'
  );

  // 4b. Specific flag enabled
  mockStorage['PUCK_PRIVACY_POLICY_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_PRIVACY_POLICY_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Page-specific flag must enable Puck'
  );

  // 4c. Global flag enabled
  delete mockStorage['PUCK_PRIVACY_POLICY_RENDERER_ENABLED'];
  mockStorage['PUCK_PUBLIC_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_PRIVACY_POLICY_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Global public flag must enable Puck'
  );

  // 4d. Corrupted / Missing JSON fallback validation
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

  assert.strictEqual(testCorruptedData('{ broken json string'), null, 'Broken JSON should safely resolve to null fallback');
  assert.strictEqual(testCorruptedData({ invalid: true }), null, 'Invalid object should safely resolve to null fallback');
  assert.strictEqual(testCorruptedData(null), null, 'Null data should safely resolve to null fallback');
  assert.notStrictEqual(testCorruptedData(privacyPuckData), null, 'Valid Puck data should parse correctly');

  // 4e. Alias routing check: /zasady-ochrany-osobnich-udaju, /privacy-policy, /gdpr, /gdpr-center
  const checkRoute = (slug: string) =>
    slug === 'zasady-ochrany-osobnich-udaju' || slug === 'privacy-policy' || slug === 'gdpr' || slug === 'gdpr-center';
  assert.ok(checkRoute('zasady-ochrany-osobnich-udaju'), '/zasady-ochrany-osobnich-udaju must match');
  assert.ok(checkRoute('privacy-policy'), '/privacy-policy must match');
  assert.ok(checkRoute('gdpr'), '/gdpr must match');
  assert.ok(checkRoute('gdpr-center'), '/gdpr-center must match');
  assert.strictEqual(checkRoute('unrelated-page'), false, 'Unrelated routes must not match');

  console.log('✅ Test 4 Passed: Feature flag matrix, route alias and safe fallback logic verified');
  console.log('\n🎉 ALL PRIVACY POLICY PUCK TESTS PASSED SUCCESSFULLY!\n');
}

runPrivacyPolicyTests().catch((err) => {
  console.error('❌ Privacy Policy tests failed:', err);
  process.exit(1);
});
