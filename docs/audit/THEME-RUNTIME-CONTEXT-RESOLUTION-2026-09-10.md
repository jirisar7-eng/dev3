# THEME ENGINE — PHASE 2: CONTEXT RESOLUTION & RESPONSIBILITY SEPARATION AUDIT REPORT

**Task ID:** `TMPR-20260910-THEME-003`  
**Datum:** 2026-09-10  
**Autor:** Google AI Studio Engineering Agent / Jiří Šár  
**Baseline Commit:** `23e0272b2b8c9b87019f737ae6d9023fcf33c37c` (`fix/theme-security-integrity-20260910`)  
**Git Větev:** `feat/theme-runtime-context-20260910`  
**Cílové prostředí:** `AI_STUDIO` / `DEV3`  
**Režim úlohy:** `IMPLEMENT` + `TEST` + `VERIFY`  
**Stav:** ✅ `COMPLETE` (100 % testů prošlo, 0 vizuálních regresí)

---

## 1. Metadata úkolu

| Položka | Hodnota | Poznámka |
| :--- | :--- | :--- |
| **Task ID** | `TMPR-20260910-THEME-003` | Fáze 2: Theme Runtime, Context Resolution & Separace |
| **Předchozí úloha** | `TMPR-20260910-THEME-002-SEC01` | Phase 1 Security & Data Integrity Remediation |
| **Typ úlohy** | Runtime Architecture & Context Isolation | Izolace kontextů, separace brandingu, deterministický provider strom |
| **Vizuální změna** | **NONE (0 vizuálních změn)** | Zachován identický vzhled portálu i adminu |
| **Databázový dopad** | **ŽÁDNÝ (0 změn schématu)** | Žádné migrace, žádný `db push`, žádná změna `schema.prisma` |
| **Dotčené soubory** | 8 souborů | `themeResolver.ts`, `BrandingContext.tsx`, `ThemeContext.tsx`, `Logo.tsx`, `App.tsx`, `themeService.ts`, `server.ts`, testy |
| **Testovací pokrytí** | 19 nových testů (`tests/theme-runtime-context.test.ts`) + 22 regresních testů (`tests/theme-security-integrity.test.ts`) | Celkem 41/41 testů PASS (100 %) |

---

## 2. Manažerské shrnutí (Executive Summary)

V návaznosti na Phase 1 (kde byla zavedena atomická transakční bezpečnost a striktní fail-closed model) řešila Phase 2 odstranění architektonických vad v runtime vrstvě Theme systému:

1. **Směšování odpovědností:** `ThemeContext` historicky obsahoval a přímo manipuloval SVG data loga, faviconu a aplikační manifest (`link[rel="manifest"]`).
2. **Chybějící kontextová izolace témat:** Všechny části aplikace (veřejné, klientské i administrátorské) používaly nerozlišeně globální téma bez ohledu na routu. Nebylo garantováno, že aktivní téma administrace neovlivní veřejný portál nebo klientský spis.
3. **Nedefinovaná priorita vrstev:** Neexistovalo přesné určení hierarchie mezi systémovým tématem a uživatelskými preferencemi vzhledu (vysoký kontrast, dark mode, color presety).

### Výsledky Fáze 2:
- ✅ Vytvořen samostatný modul `src/utils/themeResolver.ts` pro čisté a deterministické mapování rout na kontexty `PUBLIC` | `PRIVATE` | `ADMIN`.
- ✅ Vytvořen samostatný kontext `src/context/BrandingContext.tsx`, do něhož byla kompletně přesunuta správa loga, faviconu a manifestu.
- ✅ `src/context/ThemeContext.tsx` byl očištěn a zaměřen výhradně na správu témat, CSS proměnné a prioritizaci uživatelského vzhledu.
- ✅ Hierarchie providerů v `App.tsx` byla uspořádána: `AuthProvider` > `BrandingProvider` > `TextProvider` > `ThemeProvider` > `ModuleProvider` > `App`.
- ✅ V `ThemeService` a API koncových bodech `/api/themes/active` i `/api/themes/css-vars` byla zavedena striktní validace povolených kontextů (`GLOBAL`, `PUBLIC`, `PRIVATE`, `ADMIN`) s bezpečným fallbackem a ochranou proti úniku cizích kontextů.
- ✅ Vizuální diff je **nulový** (identické výchozí barvy a rozvržení).

---

## 3. Detailní architektura implementace

### 3.1 Route Context Resolver (`src/utils/themeResolver.ts`)
Čistá utilita bez závislosti na Reactu provádí normalizaci cesty a mapování na základě autoritativních prefixů projektu:
- **PUBLIC:** `/`, `/verejna-stranka`, `/krizova-pomoc`, `/sos-plan`, `/pravni-poradna`, `/pece`, `/skola`, `/zdravotni-pece`, `/kalkulacka-vyzivneho`, `/agenda`, `/prava`, `/ospod`, `/soud`, `/spis`, `/dokumenty`, `/wiki`, `/clanky`, `/o-projektu`, `/moje-cesta-zakladatele`, `/kontakt`, `/pravni-dokumenty`, `/login`, `/registrace`, `/logout`.
- **PRIVATE:** `/muj-pripad`, `/portal`, `/portal/coparent`, `/user-portal`, `/dashboard`, `/nastenka`, `/team`, `/spolek`.
- **ADMIN:** `/administrace`, `/admin`, `/ai-admin`, `/ai-context`, `/experimenty`.

Resolver normalizuje lomítka, odstraňuje query parametry a hash fragmenty, převádí na malá písmena a garantuje výstup výhradně `PUBLIC` | `PRIVATE` | `ADMIN` (nikdy nevrací `GLOBAL` jako routovací kontext).

### 3.2 Separace Brandingu (`src/context/BrandingContext.tsx`)
Nový kontext poskytuje:
- `branding: BrandingData | null`
- `loading: boolean`
- `reloadBranding: () => Promise<void>`
- Dynamickou aktualizaci `<link rel="icon">`, metadata tagů (`og:image`, `twitter:image`, `apple-touch-icon`) a PWA manifestu s automatickým uvolňováním paměti (`URL.revokeObjectURL`).
- Komponenta `Logo.tsx` nyní čerpá data výhradně z `useBranding()`.

### 3.3 ThemeContext a Context-Aware Resolver
`ThemeContext` nyní implementuje čistou funkci:
```typescript
export function resolveActiveThemeForContext(themeList: Theme[], context: AppThemeContext): Theme | null
```
Pravidla rozlišení a izolace:
1. Aktivní téma přímo se zadaným kontextem (pokud existuje)
2. Aktivní téma s kontextem `GLOBAL` (nebo bez určeného kontextu)
3. Výchozí (`isDefault`) téma s daným kontextem nebo `GLOBAL`
4. Bezpečné systémové čtené výchozí téma
5. **Cross-context zábrana:** Kontext `PUBLIC` nikdy neobdrží aktivní téma kontextu `ADMIN` a naopak.

### 3.4 Neměnná hierarchie priorit (Multi-Layer Priority)
Při aplikaci stylů na kořenový element `document.documentElement` je uplatňována přísná hierarchie:
1. **Layer 1 (Nejvyšší priorita) — Uživatelský Appearance:**
   - Explicitní high contrast (`--color-primary: #000000`, `--color-background: #ffffff`, třída `.high-contrast`)
   - Uživatelský color preset (`blue`, `green`, `purple`, `neutral`)
   - Dark / Light / System mode (třída `.dark`)
   - Uživatelská velikost písma a hustota zobrazení (`data-density`, `data-radius`, `font-family`)
2. **Layer 2 — Kontextové aktivní téma:**
   - CSS proměnné `--color-*` aktivního tématu pro aktuální kontext (`PUBLIC`, `PRIVATE`, `ADMIN`)
3. **Layer 3 — Bezpečný systémový fallback:**
   - Výchozí definice proměnných portálu Táta má právo (`#1e3a8a`, `#0284c7`, atd.)

---

## 4. Výsledky testů a verifikace

### 4.1 Testovací sada Fáze 2 (`tests/theme-runtime-context.test.ts`)
- **1. Route Context Resolver:** 5/5 testů PASS (normalizace, veřejné trasy, klientské trasy, administrátorské trasy, validita výstupu)
- **2. Context-Aware Resolver & Izolace:** 6/6 testů PASS (fallback na GLOBAL, PUBLIC izolace, ADMIN izolace, cross-context zábrana, backend service izolace, odmítnutí neznámého kontextu)
- **3. API Route Resolution & Error Model:** 5/5 testů PASS (`/api/themes/active?context=PUBLIC`, `/api/themes/active?context=ADMIN`, neplatný kontext 400 Bad Request, `/api/themes/css-vars`, neplatný kontext 400 Bad Request)
- **4. Responsibilty Separation:** 2/2 testy PASS (`BrandingContext` export, odstranění DOM manipulace z `ThemeContext`)
- **5. Multi-Layer Priority:** 1/1 test PASS (deterministická hierarchie)

**Celkem Fáze 2:** **19/19 testů PASS**

### 4.2 Regresní testovací sada Fáze 1 (`tests/theme-security-integrity.test.ts`)
- **Celkem Fáze 1:** **22/22 testů PASS**

### 4.3 Build a Typová kontrola
- `compile_applet`: **PASS** (Vite build úspěšný)
- `lint_applet` (`tsc --noEmit`): **PASS** (0 chyb)

---

## 5. Závěr a doporučení pro další fázi

Úkol **TMPR-20260910-THEME-003** je kompletní a připraven k začlenění.
Všechny cíle zadání byly splněny bez jakýchkoliv vizuálních změn nebo zásahu do databázového schématu.

V další fázi (Fáze 3 — Táta Blue / Modernizace témat) bude možné bezpečně definovat specifické barevné profily pro jednotlivé kontexty na základě nyní stabilní a bezpečné runtime architektury.
