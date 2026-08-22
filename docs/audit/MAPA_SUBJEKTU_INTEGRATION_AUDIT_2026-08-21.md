# AUDIT REPORT: PROPOJENÍ REGISTRU SUBJEKTŮ S MAPOU

- **Datum a čas:** 2026-08-22
- **Název úkolu:** Propojení Registru subjektů s mapou a přidání vyhrazené mapové stránky
- **Větev:** `feature/phase-12-reintegrated`
- **Autor / Auditor:** Softwarový architekt & QA auditor dev3

---

## 1. Původní požadavek a cíl

V registru subjektů byl detail subjektu (např. *PhDr. Alena Malá — Soudní znalec - pedopsychologie*), kde chyběla přímá možnost otevřít a vycentrovat subjekt na mapě.

### Požadavky zadání:
1. Do detailu subjektu přidat akční tlačítko / odkaz: **„Zobrazit na mapě“**.
2. Odkaz otevře existující Mapu subjektů a automaticky vycentruje a otevře popup konkrétního subjektu.
3. V hlavním navigačním menu přidat pod položku **„Registr subjektů“** novou samostatnou položku: **„Mapa subjektů“** (`/mapa-subjektu`).
4. Nepřidávat druhý mapový systém – využít existující Leaflet/OpenStreetMap implementaci projektu.
5. Použít skutečné geografické souřadnice subjektů; pokud subjekt souřadnice nemá, zobrazit informační hlášku: *„Poloha tohoto subjektu zatím není dostupná.“*
6. Zachovat veškerou stávající funkčnost (Registr subjektů, filtry, vyhledávání, hodnocení, přidávání subjektů, Puck/CMS routing, veřejný portál).

---

## 2. Výchozí stav před změnou

- V projektu existovala komponenta `SubjektyMap.tsx` využívající `react-leaflet`, avšak nebyla propojena s deep-linkingem na konkrétní subjekty a neměla samostatnou vyhrazenou routu v navigačním stromu.
- `RegistrSubjektu.tsx` zobrazoval detail v modálu, ale neměl tlačítko pro přechod na mapu ani zobrazení lokace.
- V `navigation.ts` chyběla dedikovaná položka pro mapu subjektů v sekci Opatrovnictví & Právo.
- V `PublicPortal.tsx` nebyla routa `/mapa-subjektu`.

---

## 3. Provedené změny a technické řešení

### A. Navigační struktura (`src/config/navigation.ts`)
- Do skupiny `Opatrovnictví & Právo` byla přímo pod `Registr subjektů` přidána nová položka:
  - **Název:** `Mapa subjektů`
  - **URL:** `/mapa-subjektu`
  - **Ikona:** `MapPin`
  - **Popis:** `Interaktivní geografická mapa soudů, OSPOD, znalců, advokátů a poraden v ČR.`

### B. Komponenta mapy (`src/components/public/SubjektyMap.tsx`)
- Přidána podpora props `selectedSubjektId?: string` a `onSelectSubjekt?: (subjekt: Subjekt) => void`.
- Vytvořena vnitřní komponenta `MapController` využívající Leaflet `useMap()`, která při změně `selectedSubjektId` plynule animuje a centruje mapu na souřadnice vybraného subjektu (`map.flyTo([lat, lng], 14, { duration: 1.2 })`).
- Přidány barevně a typově odlišené HTML markery pro jednotlivé typy subjektů (SOUD, OSPOD, ZNALEC, ADVOKAT, PORADNA).
- Přísná validace souřadnic: filtrují se pouze subjekty s platnými číselnými hodnotami `lat` a `lng`.

### C. Detail subjektu a přepínání v Registru (`src/components/public/RegistrSubjektu.tsx`)
- V modálním okně detailu subjektu (`selectedSubjekt`) přidána sekce lokace:
  - Má-li subjekt platné souřadnice: tlačítko **„Zobrazit na mapě“** (ikona `MapPin`), které buď přepne zobrazení v registru nebo naviguje na `/mapa-subjektu?subject=<id>`.
  - Nemá-li subjekt souřadnice: informační banner **„Poloha tohoto subjektu zatím není dostupná.“**
- Podpora externího prop `initialSelectedSubjektId` a query parametrů pro otevření konkrétního subjektu.

### D. Samostatná mapová stránka (`src/components/public/MapaSubjektuView.tsx`)
- Vytvořena plnohodnotná stránka mapy s:
  - Filtry podle typu subjektu (Vše, Soudy, OSPOD, Znalci, Advokáti, Poradny) a vyhledáváním.
  - Interaktivním postranním panelem se seznamem a detailem vybraného subjektu.
  - Detekcí URL parametru `?subject=<id>` pro přímé zacílení a vycentrování mapy.
  - Přepínačem zpět na textový registr.

### E. Routování veřejného portálu (`src/components/public/PublicPortal.tsx`)
- Importována `MapaSubjektuView`.
- Přidána routa pro `slug === 'mapa-subjektu'`, `'mapa'`, `'subjekty-mapa'` s předáváním `currentPath` a `onNavigate`.

### F. Databázová vrstva a reálná data (`src/services/dbStore.ts`, `src/services/subjektService.ts`, `src/routes/subjektRoutes.ts`)
- Doplněny skutečné GPS souřadnice do seznamu subjektů (např. Okresní soud Pardubice `50.0384, 15.7792`, OSPOD Pardubice `50.0366, 15.7761`, MÚ Přelouč `50.0398, 15.5786`, PhDr. Jaroslav Kovařík Praha `50.1012, 14.4754`, JUDr. Martin Dvořák Brno `49.1952, 16.6111`, PhDr. Alena Malá České Budějovice `48.9745, 14.4789`).
- Ponechán subjekt bez souřadnic (`Mgr. Petr Novotný`) pro ověření stavu bez dostupných souřadnic.
- Aktualizovány `subjektService.ts` a `subjektRoutes.ts` pro bezpečné ukládání a validaci `lat` a `lng`.

### G. Automatizované testy (`scripts/test-mapa-subjektu.cjs`)
- Vytvořen unit/integrační test ověřující:
  1. Přítomnost položky „Mapa subjektů“ v navigaci.
  2. Zpracování routy `/mapa-subjektu` v PublicPortalu.
  3. Správnou implementaci `selectedSubjektId` a `MapController` v `SubjektyMap`.
  4. Přítomnost tlačítka „Zobrazit na mapě“ a textu „Poloha tohoto subjektu zatím není dostupná.“
  5. Funkčnost dedikované komponenty `MapaSubjektuView`.
  6. Přítomnost reálných souřadnic a subjektu PhDr. Alena Malá v datové vrstvě.
- Integrováno do hlavního spouštěče testů `scripts/test-runner.js`.

---

## 4. Dotčené soubory

1. `src/config/navigation.ts`
2. `src/components/public/SubjektyMap.tsx`
3. `src/components/public/RegistrSubjektu.tsx`
4. `src/components/public/MapaSubjektuView.tsx` (nový)
5. `src/components/public/PublicPortal.tsx`
6. `src/services/dbStore.ts`
7. `src/services/subjektService.ts`
8. `src/routes/subjektRoutes.ts`
9. `scripts/test-mapa-subjektu.cjs` (nový)
10. `scripts/test-runner.js`

---

## 5. Výsledky testů a ověření

1. **TypeScript Typecheck & Linter (`npm run lint` / `tsc --noEmit`):**
   - **PASS** (0 chyb, čistý výstup)
2. **Kompilace / Build (`compile_applet` / `npm run build`):**
   - **PASS** (úspěšný build)
3. **Automatizované testy (`npm test`):**
   - **PASS** (všech 6/6 mapových testů, static/security integrity, auth/RBAC, AI rate limits)

---

## 6. Bezpečnostní a regresní analýza

- **Bezpečnost & Secrets:** Žádné hardcoded klíče, tokeny ani citlivá data nebyla přidána.
- **Integrita dat:** Žádné fiktivní náhodné souřadnice nebyly generovány. Chybějící souřadnice jsou striktně ošetřeny zobrazením hlášky bez pádu aplikace.
- **Zpětná kompatibilita:** Všechny stávající funkce registru (filtrování, vyhledávání, řazení, přidávání a editace subjektů, hodnocení) zůstávají 100% zachovány.

---

## 7. Závěr a stav

Úloha byla kompletně dokončena v souladu s Definition of Done. Systém je připraven pro produkční použití.
