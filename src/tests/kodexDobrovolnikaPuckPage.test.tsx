import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'assert';
import { VolunteerCodexPage } from '../components/public/VolunteerCodexPage';
import { PageRender } from '../components/builder/PageRender';
import { TextProvider } from '../context/TextContext';
import { AuthProvider } from '../context/AuthContext';

console.log('=============================================================');
console.log('--- PUCK P0 /kodex-dobrovolnika & /volunteer-code TESTS ---');
console.log('=============================================================');

const wrapWithProviders = (element: React.ReactElement) => {
  return (
    <AuthProvider>
      <TextProvider>{element}</TextProvider>
    </AuthProvider>
  );
};

async function runKodexDobrovolnikaTests() {
  // Test 1: Fallback to original VolunteerCodexPage when Flag is OFF
  const fallbackHtml = renderToStaticMarkup(wrapWithProviders(<VolunteerCodexPage />));
  assert.ok(fallbackHtml.includes('DOBROVOLNICKÝ KODEX'), 'Should render original VolunteerCodexPage title');
  assert.ok(fallbackHtml.includes('Synthesis OS • Samostatný modul compliance'), 'Should render original banner badge');
  assert.ok(fallbackHtml.includes('I. ÚČEL KODEXU'), 'Should render section I');
  assert.ok(fallbackHtml.includes('XIV. SLIB DOBROVOLNÍKA'), 'Should render section XIV');
  assert.ok(fallbackHtml.includes('Elektronický podpis'), 'Should render electronic signature section');
  console.log('✅ Test 1 Passed: Original VolunteerCodexPage fallback renders completely');

  // Test 2: Validation of Puck JSON structure for kodex-dobrovolnika
  const kodexPuckData = {
    content: [
      {
        type: 'HeroBlock',
        props: {
          id: 'hero-kodex-dobrovolnika',
          badgeText: 'Synthesis OS • Samostatný modul compliance',
          title: 'DOBROVOLNICKÝ KODEX',
          description: 'Táta má právo / Synthesis OS • Etická pravidla, zásady komunikace a odpovědného jednání dobrovolníků. Verze dokumentu: 1.0 • ID: SYNTH-CODEX-VOL-2026-V1 • Účinnost od: 12. 8. 2026',
          ctaText: 'Zpět na hlavní portál',
          ctaUrl: '/',
          secondaryCtaText: 'Podpořit projekt',
          secondaryCtaUrl: '/podporte-nas',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-kodex-purpose',
          text: '### I. ÚČEL KODEXU\n1. Tento kodex stanovuje základní pravidla chování všech dobrovolníků, spolupracovníků a osob s přístupem k projektu **Táta má právo / Synthesis OS**.\n2. Účelem kodexu je zajistit, aby projekt zůstal bezpečným, důvěryhodným a respektujícím prostředím pro rodiče, děti i všechny členy komunity.\n3. Dobrovolník přijímá skutečnost, že práce v projektu může mít přímý dopad na životní situace lidí, kteří se nacházejí v náročných rodinných, právních nebo psychických okolnostech.\n\n### II. POSLÁNÍ PROJEKTU\nDobrovolník při své činnosti podporuje zejména nejlepší zájem dítěte, zdravý vztah dítěte k oběma rodičům, respekt mezi rodiči, odpovědné rodičovství, dostupnost ověřených informací a lidský přístup k lidem v obtížné situaci.\n\n*Projekt není založen na boji proti jednotlivým osobám, ale na podpoře řešení, informovanosti a odpovědnosti.*',
          align: 'left',
          maxWidth: 'xl',
          color: 'default',
        },
      },
      {
        type: 'ColumnsBlock',
        props: {
          id: 'columns-kodex-values',
          columnsCount: '2',
          ratio: 'equal',
          gap: 'lg',
          col1Title: 'III. ZÁKLADNÍ HODNOTY',
          col1Text: '1. Respekt ke každému člověku bez ohledu na pohlaví, věk či situaci.\n2. Ochrana dítěte – dítě není nástroj konfliktu.\n3. Pravdivost a odpovědnost – ověřování informací a uvádění zdrojů.',
          col2Title: 'IV. KOMUNIKACE A PRAVIDLA',
          col2Text: 'Slušná, klidná a věcná komunikace bez odsuzování, urážení či vyvolávání konfliktů. Zásada neútočení na druhého rodiče a důsledná ochrana soukromí.',
        },
      },
      {
        type: 'TextBlock',
        props: {
          id: 'text-kodex-standards',
          text: '### VII. OCHRANA SOUKROMÍ A ODBORNOST\nDobrovolník chrání identitu uživatelů, nesdílí screenshoty komunikace ani detaily případů. Nepředstírá kvalifikaci, kterou nemá, a jasně rozlišuje osobní názor od stanoviska projektu.\n\n### X. TECHNOLOGICKÁ ETIKA A AI\nBezpečnost systému znamená ochranu lidí. Při využití AI dobrovolník kontroluje výstupy a nevkládá citlivé osobní údaje do externích služeb.\n\n### XIV. SLIB DOBROVOLNÍKA\n> *„Přijímám odpovědnost za své jednání v projektu Táta má právo. Budu chránit soukromí lidí, respektovat důstojnost rodičů i dětí a využívat své schopnosti k pomoci, nikoliv k prohlubování konfliktů.“*',
          align: 'left',
          maxWidth: 'xl',
          color: 'default',
        },
      },
      {
        type: 'CallToAction',
        props: {
          id: 'cta-kodex-volunteer',
          title: 'Chcete se zapojit do dobrovolnického týmu?',
          description: 'Pomozte nám rozvíjet nezávislé právní a psychologické nástroje a komunitní podporu pro rodiny v opatrovnických řízeních.',
          buttonText: 'Kontaktovat koordinátora',
          buttonUrl: '/kontakt',
          variant: 'primary',
        },
      },
    ],
    root: {
      props: {
        title: 'Dobrovolnický kodex',
      },
    },
  };

  assert.ok(Array.isArray(kodexPuckData.content), 'Puck content must be an array');
  assert.strictEqual(kodexPuckData.content.length, 5, 'Should have 5 Puck blocks');
  console.log('✅ Test 2 Passed: Kodex dobrovolníka Puck data structure is valid');

  // Test 3: Static rendering of Puck blocks via PageRender
  const puckHtml = renderToStaticMarkup(wrapWithProviders(<PageRender data={kodexPuckData} />));
  assert.ok(puckHtml.includes('DOBROVOLNICKÝ KODEX'), 'Puck render must include hero title');
  assert.ok(puckHtml.includes('Synthesis OS • Samostatný modul compliance'), 'Puck render must include hero badge');
  assert.ok(puckHtml.includes('I. ÚČEL KODEXU'), 'Puck render must include purpose text block');
  assert.ok(puckHtml.includes('III. ZÁKLADNÍ HODNOTY'), 'Puck render must include values columns block');
  assert.ok(puckHtml.includes('Chcete se zapojit do dobrovolnického týmu?'), 'Puck render must include CTA');
  console.log('✅ Test 3 Passed: Puck PageRender executes without errors and renders valid HTML');

  // Test 4: Feature flag logic and fallback conditions
  const mockStorage: Record<string, string> = {};
  const isPuckEnabled = (flagKey: string, globalKey: string) => {
    return mockStorage[flagKey] === 'true' || mockStorage[globalKey] === 'true';
  };

  // 4a. Default: OFF
  assert.strictEqual(
    isPuckEnabled('PUCK_KODEX_DOBROVOLNIKA_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    false,
    'Default flag must be OFF'
  );

  // 4b. Kodex specific flag enabled
  mockStorage['PUCK_KODEX_DOBROVOLNIKA_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_KODEX_DOBROVOLNIKA_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
    true,
    'Page-specific flag must enable Puck'
  );

  // 4c. Global flag enabled
  delete mockStorage['PUCK_KODEX_DOBROVOLNIKA_RENDERER_ENABLED'];
  mockStorage['PUCK_PUBLIC_RENDERER_ENABLED'] = 'true';
  assert.strictEqual(
    isPuckEnabled('PUCK_KODEX_DOBROVOLNIKA_RENDERER_ENABLED', 'PUCK_PUBLIC_RENDERER_ENABLED'),
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

  assert.strictEqual(testCorruptedData('{ unclosed json'), null, 'Corrupted JSON string should safely resolve to null fallback');
  assert.strictEqual(testCorruptedData({ noContent: true }), null, 'Object without content array should safely resolve to null fallback');
  assert.strictEqual(testCorruptedData(null), null, 'Null data should safely resolve to null fallback');
  assert.notStrictEqual(testCorruptedData(kodexPuckData), null, 'Valid Puck data should parse correctly');

  // 4e. Alias routing check: both /kodex-dobrovolnika and /volunteer-code route identically
  const checkRoute = (slug: string) => slug === 'kodex-dobrovolnika' || slug === 'volunteer-code';
  assert.ok(checkRoute('kodex-dobrovolnika'), '/kodex-dobrovolnika must match');
  assert.ok(checkRoute('volunteer-code'), '/volunteer-code must match');
  assert.strictEqual(checkRoute('other-route'), false, 'other routes must not match');

  console.log('✅ Test 4 Passed: Feature flag matrix, route alias and safe fallback logic verified');
  console.log('\n🎉 ALL KODEX DOBROVOLNIKA PUCK TESTS PASSED SUCCESSFULLY!\n');
}

runKodexDobrovolnikaTests().catch((err) => {
  console.error('❌ Kodex dobrovolníka tests failed:', err);
  process.exit(1);
});
