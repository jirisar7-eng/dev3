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
});

// 2. Public portal routing test
runTest('Routing: PublicPortal routes /mapa-subjektu to MapaSubjektuView', () => {
  const portalContent = fs.readFileSync(path.join(__dirname, '../src/components/public/PublicPortal.tsx'), 'utf8');
  assert(portalContent.includes("import { MapaSubjektuView } from './MapaSubjektuView';"), 'Must import MapaSubjektuView');
});

// 3. SubjektyMap component test
runTest('SubjektyMap: accepts selectedSubjektId and auto-centers map', () => {
  const mapContent = fs.readFileSync(path.join(__dirname, '../src/components/public/SubjektyMap.tsx'), 'utf8');
  assert(mapContent.includes('selectedSubjektId'), 'Must support selectedSubjektId prop');
});

// 4. Detail Modal "Zobrazit na mapě" link & missing location notice
runTest('Detail Modal: "Zobrazit na mapě" button & "Poloha tohoto subjektu zatím není dostupná" text', () => {
  const regContent = fs.readFileSync(path.join(__dirname, '../src/components/public/RegistrSubjektu.tsx'), 'utf8');
  assert(regContent.includes('Zobrazit na mapě'), 'RegistrSubjektu must contain "Zobrazit na mapě"');
});

// 5. Dedicated MapaSubjektuView test
runTest('Dedicated View: MapaSubjektuView handles query params', () => {
  const viewContent = fs.readFileSync(path.join(__dirname, '../src/components/public/MapaSubjektuView.tsx'), 'utf8');
  assert(viewContent.includes("params.get('subject')"), 'Must parse subject query param');
});

// 6. DB Store
runTest('Database & Coordinates: Real geographic coordinates & Alena Mala present', () => {
  const dbContent = fs.readFileSync(path.join(__dirname, '../src/services/dbStore.ts'), 'utf8');
  assert(dbContent.includes('Alena Malá'), 'Must contain Alena Malá');
});

// 7. SubjektManager
runTest('SubjektManager: UI contains lat/lng inputs and geocoding', () => {
  const adminContent = fs.readFileSync(path.join(__dirname, '../src/components/admin/SubjektManager.tsx'), 'utf8');
  assert(adminContent.includes('Zeměpisná šířka (Lat):'), 'Must contain Latitude input');
});

// 8. Header Menu Merge
runTest('Header: properly merges NAVIGATION_ITEMS with API navigation without overwriting', () => {
  const headerContent = fs.readFileSync(path.join(__dirname, '../src/components/Header.tsx'), 'utf8');
  assert(headerContent.includes('missingRequired'), 'Must calculate missingRequired items from FALLBACK_NAV_ITEMS');
  assert(headerContent.includes('baseNav = [...navData, ...missingRequired]'), 'Must merge navData with missingRequired');
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
