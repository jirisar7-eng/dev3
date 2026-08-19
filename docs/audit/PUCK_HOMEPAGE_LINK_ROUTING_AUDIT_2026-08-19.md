# Puck / Homepage Link Audit & Routing Verification Report
**Datum:** 19. srpna 2026  
**Větev:** `feature/state-admin-ares`  
**Autor:** Senior Full-Stack Architect & AI Systems Engineer  
**Stav:** ✅ PASSED (100% validní routing a Puck struktura)

---

## 1. Stav před opravením
Během hloubkového auditu navigační struktury a Puck dat hlavní strany (`home`) byly prověřovány všechny interní odkazové cesty, správnost registrace v databázové vrstvě (`PageService` / `dbStore`) a zpracování v routeru veřejného portálu (`PublicPortal.tsx`).

Identifikovaná nesrovnalost před úpravou:
- Odkaz `/prava` (používaný v bloku `FeatureGridBlock` na homepage) byl v `PublicPortal.tsx` správně obsluhován a v `LEGAL_PAGES_PUCK_DATA` měl připravená Puck data, avšak v `MENU_MODULE_PAGES` v `PageService.ts` byl registrován pouze anglický slug `rights`. V důsledku toho při automatické synchronizaci modulů chyběl záznam pro slug `prava` v `dbStore`.

---

## 2. Provedené kontroly
Byl proveden audit v následujících souborech a kódových místech:

1. **`src/puck/defaultPageData.ts`**:
   - `DEFAULT_HOMEPAGE_PUCK_DATA`: Kontrola všech 15 unikátních URL v bloku Hero, SituationSelector, FeatureGrid, LifeSituationsGrid, GuideSection, WorkspaceSection, AiSection, KnowledgeCenter, CtaGrid a FooterCta.
   - `LEGAL_PAGES_PUCK_DATA` & `CRISIS_COMMUNITY_PAGES_PUCK_DATA`: Kontrola navázaných Puck struktur pro cílové stránky.

2. **`src/components/public/PublicPortal.tsx`**:
   - Kontrola routing pravidel pro zpracování slugů (`/opatrovnicka-agenda`, `/sos-plan`, `/plan-pece`, `/centrum-formularu`, `/judikatura`, `/ai-guide`, `/prava`, `/user-portal`, `/ai-assistant`, `/crisis`, `/forum`, `/coparent-hub`, `/pravni-poradna`, `/legal-wiki`, `/sitemap`).

3. **`src/services/PageService.ts`**:
   - Registrace v `MENU_MODULE_PAGES` a inicializační logika v `ensureAllModulePagesExist()`.

4. **`src/services/dbStore.ts`**:
   - Kontrola výchozích dat v `MemoryStore` a automatické sanitace Puck JSON struktur.

5. **`scripts/auditHomepageLinks.ts`**:
   - Automatizovaný skript pro extrakci všech interních odkazů z Puck JSON homepage a jejich křížové ověření.

---

## 3. Ověření 6 povinných cílových částí Homepage

| # | Výchozí karta / tlačítko | Cílový text / Název | Cílové URL | Stav Routingu | Stav Puck Dat |
|---|--------------------------|---------------------|------------|---------------|---------------|
| 1 | "Jsem po rozchodu" | Průvodce po rozchodu | `/sos-plan` | ✅ Funkční (`PublicPortal.tsx`) | ✅ Validní Puck JSON |
| 2 | "Řeším soud nebo OSPOD" | Průvodce řízením | `/opatrovnicka-agenda` | ✅ Funkční (`PublicPortal.tsx`) | ✅ Validní Puck JSON |
| 3 | "Chci nastavit péči o dítě" | Plán péče | `/plan-pece` | ✅ Funkční (`PublicPortal.tsx`) | ✅ Validní Puck JSON |
| 4 | "Potřebuji připravit dokument" | Centrum formulářů | `/centrum-formularu` | ✅ Funkční (`PublicPortal.tsx`) | ✅ Validní Puck JSON |
| 5 | "Potřebuji najít právní oporu" | Judikatura a legislativa | `/judikatura` | ✅ Funkční (`PublicPortal.tsx`) | ✅ Validní Puck JSON |
| 6 | "Nevím, jak svůj případ uchopit" | AI průvodce | `/ai-guide` | ✅ Funkční (`PublicPortal.tsx`) | ✅ Validní Puck JSON |

---

## 4. Kompletní seznam všech 15 unikátních odkazů z Homepage

| # | URL | Cílový slug | Záznam v DB/dbStore | Zpracování v Routeru | Puck Data Validní | Výsledek Auditu |
|---|-----|-------------|---------------------|----------------------|-------------------|-----------------|
| 1 | `/opatrovnicka-agenda` | `opatrovnicka-agenda` | YES | YES | YES | ✅ PASS |
| 2 | `/sitemap` | `sitemap` | YES | YES | YES | ✅ PASS |
| 3 | `/sos-plan` | `sos-plan` | YES | YES | YES | ✅ PASS |
| 4 | `/plan-pece` | `plan-pece` | YES | YES | YES | ✅ PASS |
| 5 | `/centrum-formularu` | `centrum-formularu` | YES | YES | YES | ✅ PASS |
| 6 | `/judikatura` | `judikatura` | YES | YES | YES | ✅ PASS |
| 7 | `/ai-guide` | `ai-guide` | YES | YES | YES | ✅ PASS |
| 8 | `/prava` | `prava` | YES | YES | YES | ✅ PASS |
| 9 | `/user-portal` | `user-portal` | YES | YES | YES | ✅ PASS |
| 10 | `/ai-assistant` | `ai-assistant` | YES | YES | YES | ✅ PASS |
| 11 | `/crisis` | `crisis` | YES | YES | YES | ✅ PASS |
| 12 | `/forum` | `forum` | YES | YES | YES | ✅ PASS |
| 13 | `/coparent-hub` | `coparent-hub` | YES | YES | YES | ✅ PASS |
| 14 | `/pravni-poradna` | `pravni-poradna` | YES | YES | YES | ✅ PASS |
| 15 | `/legal-wiki` | `legal-wiki` | YES | YES | YES | ✅ PASS |

---

## 5. Provedené opravy
1. **Doplnění slugu `/prava` v `PageService.ts`**:
   - Do `MENU_MODULE_PAGES` byl přidán záznam `{ slug: 'prava', title: 'Práva rodičů a dětí', ... }`, aby byla zaručena kompletní inicializace v databázové i paměťové vrstvě.
2. **Rozšíření automatizovaného testu**:
   - Vytvořen skript `scripts/auditHomepageLinks.ts`, který rekurzivně projde všechna URL v Puck JSON homepage a zkontroluje jejich cílové slugy, existenci v DB a platnost Puck dat.

---

## 6. Důkaz o funkčnosti (Výstup testovacího skriptu)

```text
Found 15 internal links in DEFAULT_HOMEPAGE_PUCK_DATA:

URL: /opatrovnicka-agenda      | Slug: opatrovnicka-agenda  | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /sitemap                  | Slug: sitemap              | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /sos-plan                 | Slug: sos-plan             | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /plan-pece                | Slug: plan-pece            | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /centrum-formularu        | Slug: centrum-formularu    | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /judikatura               | Slug: judikatura           | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /ai-guide                 | Slug: ai-guide             | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /prava                    | Slug: prava                | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /user-portal              | Slug: user-portal          | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /ai-assistant             | Slug: ai-assistant         | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /crisis                   | Slug: crisis               | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /forum                    | Slug: forum                | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /coparent-hub             | Slug: coparent-hub         | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /pravni-poradna           | Slug: pravni-poradna       | DB: YES | Route: YES | Puck: VALID   | Result: PASS
URL: /legal-wiki               | Slug: legal-wiki           | DB: YES | Route: YES | Puck: VALID   | Result: PASS

=== AUDIT SUMMARY ===
Total Links Checked: 15
Broken Links: 0
Missing Routes: 0
Invalid Puck Data: 0

✅ AUDIT PASSED: All homepage links lead to valid routes and valid Puck pages!
```

---

## 7. Doporučení pro další rozvoj
1. **Ponechání skriptu v CI/CD**: Ponechat `scripts/auditHomepageLinks.ts` jako součást automatických testů při jakýchkoliv úpravách Puck šablon nebo navigace.
2. **Zachování fallbacků**: V `CmsPageRenderer.tsx` nadále udržovat runtime normalizaci pro případ, že by administrátor v editoru Puck uložil nekompletní strukturu.
