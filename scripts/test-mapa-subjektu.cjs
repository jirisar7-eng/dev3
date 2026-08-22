const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST: PROPOJENÍ REGISTRU SUBJEKTŮ S MAPOU ===\n');

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

// 1. Navigation items test
runTest('Navigation: "Mapa subjektů" exists directly below "Registr subjektů"', () => {
  const navContent = fs.readFileSync(path.join(__dirname, '../src/config/navigation.ts'), 'utf8');
  assert(navContent.includes("labelKey: 'Registr subjektů'"), 'Must contain Registr subjektů');
  assert(navContent.includes("labelKey: 'Mapa subjektů'"), 'Must contain Mapa subjektů');
  assert(navContent.includes("url: '/mapa-subjektu'"), 'Must link to /mapa-subjektu');

  const regIndex = navContent.indexOf("labelKey: 'Registr subjektů'");
  const mapIndex = navContent.indexOf("labelKey: 'Mapa subjektů'");
  assert(mapIndex > regIndex, 'Mapa subjektů must follow Registr subjektů');
});

// 2. Public portal routing test
runTest('Routing: PublicPortal routes /mapa-subjektu to MapaSubjektuView', () => {
  const portalContent = fs.readFileSync(path.join(__dirname, '../src/components/public/PublicPortal.tsx'), 'utf8');
  assert(portalContent.includes("import { MapaSubjektuView } from './MapaSubjektuView';"), 'Must import MapaSubjektuView');
  assert(portalContent.includes("slug === 'mapa-subjektu'"), 'Must handle slug mapa-subjektu');
  assert(portalContent.includes('<MapaSubjektuView'), 'Must render MapaSubjektuView');
});

// 3. SubjektyMap component test
runTest('SubjektyMap: accepts selectedSubjektId and auto-centers map', () => {
  const mapContent = fs.readFileSync(path.join(__dirname, '../src/components/public/SubjektyMap.tsx'), 'utf8');
  assert(mapContent.includes('selectedSubjektId'), 'Must support selectedSubjektId prop');
  assert(mapContent.includes('MapController'), 'Must include MapController for programmatic centering');
  assert(mapContent.includes('validSubjekty'), 'Must filter valid coordinates');
  assert(mapContent.includes("typeof s.lat === 'number'"), 'Must strictly validate numeric lat');
  assert(mapContent.includes("typeof s.lng === 'number'"), 'Must strictly validate numeric lng');
});

// 4. Detail modal "Zobrazit na mapě" link & missing location notice
runTest('Detail Modal: "Zobrazit na mapě" button & "Poloha tohoto subjektu zatím není dostupná" text', () => {
  const regContent = fs.readFileSync(path.join(__dirname, '../src/components/public/RegistrSubjektu.tsx'), 'utf8');
  assert(regContent.includes('Zobrazit na mapě'), 'RegistrSubjektu must contain "Zobrazit na mapě"');
  assert(regContent.includes('Poloha tohoto subjektu zatím není dostupná.'), 'RegistrSubjektu must contain missing location notice');
  assert(regContent.includes('/mapa-subjektu?subject='), 'Must link to mapa-subjektu with subject param');
});

// 5. Dedicated MapaSubjektuView test
runTest('Dedicated View: MapaSubjektuView handles query params, centering, and missing location notice', () => {
  const viewContent = fs.readFileSync(path.join(__dirname, '../src/components/public/MapaSubjektuView.tsx'), 'utf8');
  assert(viewContent.includes('Mapa subjektů opatrovnictví'), 'Must display title');
  assert(viewContent.includes("params.get('subject')"), 'Must parse subject query param');
  assert(viewContent.includes('Poloha tohoto subjektu zatím není dostupná.'), 'Must display missing location notice when coords absent');
  assert(viewContent.includes('SubjektyMap'), 'Must use SubjektyMap component');
});

// 6. Database & Coordinates: Real geographic coordinates & Alena Mala presence
runTest('Database & Coordinates: Real geographic coordinates & Alena Mala present', () => {
  const dbContent = fs.readFileSync(path.join(__dirname, '../src/services/dbStore.ts'), 'utf8');
  assert(dbContent.includes('PhDr. Alena Malá'), 'Must contain PhDr. Alena Malá');
  assert(dbContent.includes('lat: 50.0384'), 'Must have real lat for Pardubice court');
  assert(dbContent.includes('lng: 15.7792'), 'Must have real lng for Pardubice court');
  assert(dbContent.includes('Mgr. Petr Novotný'), 'Must contain subject without coordinates for testing');
});

console.log(`\n========================================`);
console.log(`Summary: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log('✅ ALL MAP INTEGRATION TESTS PASSED!');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}
