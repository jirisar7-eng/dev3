# AUDIT & IMPLEMENTAČNÍ PLÁN: FÁZE 7 – P0 CONTENT & ROUTING

**Projekt:** „Táta má právo“ (dev3)  
**Datum:** 2026-08-27  
**Stav:** Schváleno k realizaci  
**Priorita:** P0 (Kritická priorita pro veřejný portál)

---

## 1. PŘEHLED A CÍL FÁZE 7

Fáze 7 řeší 3 nejkritičtější P0 obsahové a routingové problémy veřejného portálu:
1. **`/kalkulacka-vyzivneho`**: Zpřístupnění reálné tabulkové kalkulačky výživného dle MSČR a odstranění kolize s AI simulátorem péče.
2. **`/pece` (Péče o dítě / Care Hub)**: Vytvoření veřejné prezentační a edukační landing page pro nepřihlášené uživatele a propojení s privátním Care Hubem.
3. **`/portal/coparent` -> `/coparent` (CoParent Hub - Spolurodičovství)**: Vytvoření veřejné landing page vysvětlující zásady bezkonfliktní komunikace (BIFF) a oddělení veřejné routy od privátního nástroje.

---

## 2. DETAILNÍ ANALÝZA A REALIZAČNÍ SPECIFIKACE

### A. Kalkulačka výživného (`/kalkulacka-vyzivneho`)

1. **Co již existuje:**
   - Plně funkční komponenta `AlimonyCalculatorView.tsx` (296 řádků).
   - Matematický engine `src/utils/alimonyCalculator.ts` implementující metodiku Ministerstva spravedlnosti ČR (věkové skupiny 0–5, 6–9, 10–14, 15+ let, kontrolní částka povinného rodiče, podíl péče).
   - Stránkový obal `src/pages/AlimonyCalculatorPage.tsx`.

2. **Co lze použít:**
   - Stávající komponentu `AlimonyCalculatorView` i engine `alimonyCalculator.ts` bez nutnosti přepisování logiky výpočtu.

3. **Jaký veřejný obsah chybí:**
   - Edukační metodický blok pod kalkulačkou vysvětlující:
     - Princip doporučujících tabulek MSČR a jejich nezávaznost pro soud.
     - Kontrolní částku (ochrana životního minima a nákladů povinného rodiče).
     - Odůvodněné potřeby dítěte vs. nadstandardní výdaje (kroužky, spoření).
     - Judikaturu Ústavního soudu k tvorbě úspor a posuzování majetkových poměrů.

4. **Routingové změny:**
   - V `src/components/public/PublicPortal.tsx` (řádek 363): Odstranit `|| slug === 'kalkulacka-vyzivneho'` ze seznamu aliasů `AiSimulatorView`.
   - Zajistit, aby cesta `/kalkulacka-vyzivneho` (i `/vyzivne`) vykreslila `AlimonyCalculatorPage`.

5. **Obsahové doplnění:**
   - Přidat podrobný rozpad metodiky, tipy pro soudní jednání o výživném a FAQ.

---

### B. Péče o dítě (`/pece`)

1. **Co již existuje:**
   - Komplexní privátní nástroj `src/pages/CareHubPage.tsx` (355 řádků) a moduly v `src/components/care/*`.
   - Backendové API pro ukládání plánů a harmonogramů péče.

2. **Co lze použít:**
   - Architekturu harmonogramů a typů péče (střídavá 2-2-3, 7-7, rozšířená, asymetrická).
   - Plný Care Hub v privátní zóně pro přihlášené.

3. **Jaký veřejný obsah chybí:**
   - Veřejná prezentační komponenta (`CareHubPublicLandingView`):
     - Co je to rodičovský plán péče a proč jej opatrovnické soudy vyžadují.
     - Přehled a srovnání nejčastějších modelů střídání podle věku dítěte.
     - Interaktivní ukázka rozvrhu pro nepřihlášené rodiče.
     - Výhody digitálního deníku předávání a kalendáře.
     - Výzva k bezplatné registraci (CTA tlačítko).

4. **Routingové změny:**
   - V `src/App.tsx`: Pokud je uživatel nepřihlášen a jde na `/pece`, propustit požadavek do `PublicPortal.tsx`.
   - V `src/components/public/PublicPortal.tsx`: Zaregistrovat obsluhu routy `/pece` a `/care-hub` vracející veřejný landing page.
   - Pro přihlášené uživatele v privátním dashboardu ponechat zobrazení plného `CareHubPage`.

5. **Obsahové doplnění:**
   - Metodika adaptace dítěte na střídavou péči, checklist předávání, vzorový plán péče ke stažení.

---

### C. CoParent Hub (`/coparent` / `/portal/coparent`)

1. **Co již existuje:**
   - Robustní privátní aplikace `src/pages/portal/CoParentPage.tsx` (1274 řádků) s AI detekcí toxicity, knihou výdajů, žádostmi o změny termínů a auditním exportem pro soud.

2. **Co lze použít:**
   - Veškerou privátní funkcionalitu pro přihlášené páry/rodiče.

3. **Jaký veřejný obsah chybí:**
   - Veřejná landing page (`CoParentPublicLandingView`):
     - Zásady bezkonfliktní komunikace po rozchodu (metodika BIFF).
     - Jak funguje nezpochybnitelný soudní export komunikace.
     - Transparentní sdílení mimořádných nákladů na dítě bez osobních sporů.
     - Návod, jak navrhnout druhému rodiči nebo soudu komunikaci přes aplikaci.
     - CTA k založení spolurodičovského profilu.

4. **Routingové změny:**
   - V `src/config/navigation.ts`: Změnit URL veřejné položky z `/portal/coparent` na `/coparent`.
   - V `src/components/public/PublicPortal.tsx`: Zaregistrovat obsluhu routy `/coparent` a `/spolurodicovstvi`.
   - V privátní zóně ponechat URL `/portal/coparent` pro přihlášené uživatele.

5. **Obsahové doplnění:**
   - Desatero komunikace s manipulativním expartnerem, ukázka certifikovaného auditního protokolu pro soud.

---

## 3. MASTER IMPLEMENTAČNÍ KROKY (FÁZE 7)

```text
KROK 1: Oprava routingu v PublicPortal.tsx (odblokování kalkulačky výživného)
KROK 2: Vytvoření CareHubPublicLandingView a úprava guardu pro /pece
KROK 3: Vytvoření CoParentPublicLandingView a úprava navigace na /coparent
KROK 4: Testování zobrazení pro nepřihlášené i přihlášené uživatele
KROK 5: Finální audit a verifikace
```

---
*Zpracováno v rámci auditu projektu „Táta má právo“.*
