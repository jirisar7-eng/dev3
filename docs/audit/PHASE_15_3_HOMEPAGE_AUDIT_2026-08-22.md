# AUDIT REPORT — FÁZE 15.3: NOVÁ HLAVNÍ STRÁNKA BETA 1.0

**Datum a čas:** 2026-08-22  
**Projekt:** Táta má právo (dev3)  
**Větev:** `feature/subject-registry-moderation`  
**Autor/Role:** Hlavní softwarový architekt, seniorní full-stack vývojář & QA auditor  

---

## 1. PŮVODNÍ POŽADAVEK / CÍL

Aplikovat finální koncepci Beta 1.0 pro novou hlavní stránku portálu `dev3`.  
Hlavní stránka musí okamžitě odpovědět otci v opatrovnické situaci na otázku:  
> **„Jsem otec v konkrétní situaci. Kam mám teď jít?“**

### Požadované klíčové bloky:
1. **Hero / Úvost:** Zřetelná identita "Táta má právo", stručný účel portálu bez zbytečných stěn textu, hlavní CTA směřující k situacím.
2. **Rychlá pomoc podle situace:** Zřetelné vstupy (Práva, Styk s dítětem / Krizová pomoc, OSPOD, Soud, Komunikace rodičů, Formuláře, Osobní spis, Akutní pomoc).
3. **Hlavní funkce portálu:** Práva & Poradna, Krizová pomoc, Péče o dítě, Osobní spis otce, CoParent Hub, Akademie, Právní Wiki, Centrum formulářů, AI Asistent, Judikatura.
4. **Krizový blok:** Zřetelně vypíchnutý krizový rozcestník ("Potřebuji pomoc teď") bez falešných právních jistot.
5. **Praktický obsah z CMS:** Propojení s redakčním systémem CMS (ArticlesFeedBlock).
6. **Workflow (Co může otec udělat):** 5-kroková cesta (Zjistit → Připravit → Dokumentovat → Komunikovat → Řešit).
7. **Důvěryhodnost a bezpečnost:** Disclaimers (informační charakter, nenahrazuje advokáta, dítě není předmět sporu).

---

## 2. VÝCHOZÍ STAV & PROZKOUMÁNÍ ARCHITEKTURY

- Routing v `PublicPortal.tsx` směruje cestu `/` na `CmsPageRenderer` s parametrem `slug="home"`.
- `CmsPageRenderer.tsx` se pokouší načíst stránku z DB (`/api/pages/home`). Pokud neexistuje nebo selže, používá `DEFAULT_HOMEPAGE_PUCK_DATA` z `src/puck/defaultPageData.ts`.
- Puck architektura (`puckConfig`, `HomepageAdapters.tsx`, `PageRender.tsx`) umožňuje plnou dynamickou úpravu homepage administrátorem přes Puck CMS editor.

---

## 3. PROVEDENÉ ZMĚNY A DOPLŇKY

### A. Aktualizace `DEFAULT_HOMEPAGE_PUCK_DATA` (`src/puck/defaultPageData.ts`)
- **HeroBlock:** Doplněna jasná výzva `Potřebuji pomoc podle mé situace` směřující na kotevní bod `#situace-home` a sekundární krizové CTA `🚨 Krizový rozcestník` (`/krizova-pomoc`).
- **SituationSelectorBlock:** Přizpůsobeno 8 přesným situacím:
  1. *Potřebuji řešit práva* -> `/prava`
  2. *Mám problém se stykem s dítětem* -> `/krizova-pomoc`
  3. *Čeká mě OSPOD* -> `/ospod`
  4. *Čeká mě soud* -> `/soud`
  5. *Rodiče se nedokážou domluvit* -> `/coparent-hub`
  6. *Potřebuji připravit dokumenty* -> `/centrum-formularu`
  7. *Potřebuji si vést svůj případ* -> `/muj-pripad`
  8. *Potřebuji pomoc okamžitě* -> `/krizova-pomoc`
- **ProcessTimelineBlock:** Implementována 5-kroková metodika (Zjistit → Připravit → Dokumentovat → Komunikovat → Řešit).
- **FeatureGridBlock:** Zahrnuje 10 hlavních modulů portálu s přímými odkazy na jejich funkční routy (`/prava`, `/krizova-pomoc`, `/plan-pece`, `/muj-pripad`, `/coparent-hub`, `/vzdelavani`, `/wiki`, `/centrum-formularu`, `/ai-assistant`, `/judikatura`).
- **ArticlesFeedBlock:** Vložen do struktury pro automatické načítání nejnovějších článků z databáze CMS.
- **AiSectionBlock & WorkspaceSectionBlock & GuideSectionBlock:** Propojeny na AI asistenta a klientský Osobní spis otce.
- **PrincipleSectionBlock & FooterCtaBlock:** Doplněny bezpečnostní a právní výhrady (informační charakter, nenahrazuje advokáta).

### B. Úprava `CmsPageRenderer.tsx`
- Pokud `/api/pages/home` nevrátí stránku z DB (např. v čerstvém nebo nepředvyplněném prostředí), `CmsPageRenderer` automaticky vykreslí `PageRender` s `DEFAULT_HOMEPAGE_PUCK_DATA`, čímž je zaručena 100% dostupnost bohaté Beta 1.0 homepage i bez manuálního uložení v Puck CMS editoru.

---

## 4. DOTČENÉ SOUBORY

- `src/puck/defaultPageData.ts` (úprava výchozí Puck JSON struktury)
- `src/components/public/CmsPageRenderer.tsx` (fallback rendering pro `slug === 'home' || slug === 'domu'`)
- `docs/audit/PHASE_15_3_HOMEPAGE_AUDIT_2026-08-22.md` (tento auditní soubor)

---

## 5. TESTOVÁNÍ A VERIFIKACE

1. **Static Typecheck & Lint:**
   - Příkaz: `npm run lint` (`tsc --noEmit`)
   - Výsledek: **PASS** (0 chyb, 0 varování)

2. **Application Build:**
   - Příkaz: `npm run build` (`vite build`)
   - Výsledek: **PASS** (úspěšná kompilace produkčního bundle)

3. **Bezpečnostní kontrola:**
   - Prověřeno, že žádný secret, API klíč ani osobní údaj nebyl vložen do zdrojového kódu nebo auditu.

---

## 6. BEZPEČNOST, PRIVACY A BEZPEČNOSTNÍ VÝHRADY

- Na hlavní stránce i v patičce je výslovně uvedeno, že informace mají výhradně obecný vzdělávací a orientační charakter a nenahrazují individuální právní služby advokáta.
- Nejsou garantovány žádné výsledky soudních řízení ani rozhodnutí OSPOD.

---

## 7. ZÁVĚR A GIT STATUS

- **Stav úkolu:** **HOTOVO (DONE)**
- **Pracovní větev:** `feature/subject-registry-moderation`
- **Definition of Done splněno.**
