# AUDIT REPORT: ANALYTICS 2.0 – USER JOURNEY & SEARCH INTELLIGENCE

**Datum a čas auditu:** 2026-08-25T19:50:00Z  
**Větev:** `feat/analytics-2-user-journey`  
**Název úkolu:** Analytics 2.0 – User Journey, Funnels, Search Intelligence & Zero-PII Aggregations  
**Status:** DOKONČENO & PLNĚ OTESTOVÁNO (PASS)  

---

## 1. Původní požadavek a cíl
Rozšířit existující Privacy-First Analytics systém projektu „Táta má právo“ (dev3) bez přepisování architektury o:
1. **User Journey rekonstrukci** (vstupní/výstupní stránky, tranzice mezi routami, top sekvence a délka relace).
2. **Funnel Analytics** (generický mechanismus pro sledování kroků klíčových procesů, míra dokončení, drop-off míra a identifikace bottlenecks).
3. **Search Intelligence & Zero-Results** (vyhledávané právní výrazy, četnost, analýza dotazů s 0 výsledky pro identifikaci obsahových mezer).
4. **Deep Feature Analytics** (využití modulů, dokončení, míra opuštění, průměrná doba interakce).
5. **Časová osa konkrétního uživatele** (RBAC chráněná administrátorská funkce s povinným auditním logováním každého přístupu).
6. **Agregovaná AI příprava** (strukturovaný export bez syrových PII pro budoucí lokální / AI analýzu).
7. **Správa retence dat** (pravidelný automatický cleanup starých záznamů po 90 dnech).

---

## 2. Výchozí stav
- Existovala základní infrastruktura `AnalyticsEvent` a `AnalyticsSetting` v Prisma i in-memory `dbStore`.
- Existoval `AnalyticsService`, `analyticsRoutes`, `analyticsClient` a oddělená simulace veřejného widgetu.
- Chyběla hlubší rekonstrukce průchodů uživatelů, analýza konverzí a vyhledávací inteligence.

---

## 3. Provedené změny a dotčené soubory

### A. Datové typy (`src/types/index.ts`)
- Přidána rozhraní: `UserJourneyStats`, `UserJourneyPath`, `UserJourneyTransition`, `FunnelStats`, `FunnelStepStats`, `SearchIntelligenceStats`, `SearchQueryStat`, `FeatureAnalyticsDeepStat`, `UserAnalyticsHistory`, `UserTimelineEvent`, `AnalyticsAiInsightsData`, `AnalyticsTimeRange`.

### B. Analytická služba (`src/services/analyticsService.ts`)
- Implementováno:
  - `getUserJourneyStats`: Sestavuje cesty, identifikuje vstupní a výstupní stránky, tranzice a průměrné počty kroků na session.
  - `getFunnelStats`: Generický mechanismus kalkulující konverzi jednotlivých kroků, odchody a největší propadový krok (`biggestDropOffStep`).
  - `getSearchIntelligence`: Agregace vyhledávání, kalkulace nulových výsledků (`zeroResultsRate`) s přísnou Zero-PII sanitizací dotazů (redakce emailů, telefonů, max 80 znaků).
  - `getFeatureDeepAnalytics`: Přehled otevření, interakcí a dokončení nástrojů s dobou trvání a mírou dokončení.
  - `getUserIndividualHistory`: Bezpečný výpis časové osy konkrétního registrovaného uživatele s **povinným zápisem do auditního logu** (`VIEW_USER_ANALYTICS_HISTORY`).
  - `getAnalyticsAiInsights`: Příprava bezpečně agregovaných dat pro AI doporučení.
  - `cleanOldEvents`: Mazání událostí starších než 90 dní z DB i paměťového fallbacku.
  - Inicializace 24h periodického časovače v konstruktoru třídy s `unref()`.

### C. Backend API Endpointy (`src/routes/analyticsRoutes.ts`)
- `GET /api/analytics/admin/journey` (ADMIN)
- `GET /api/analytics/admin/funnels` (ADMIN)
- `GET /api/analytics/admin/search-intelligence` (ADMIN)
- `GET /api/analytics/admin/features` (ADMIN)
- `GET /api/analytics/admin/users/:userId/history` (ADMIN + Audit Log)
- `GET /api/analytics/admin/ai-insights-data` (ADMIN)
- `POST /api/analytics/admin/clean-old` (ADMIN)

### D. Klientské trasování (`src/lib/analyticsClient.ts`)
- Přidána metoda `trackFunnelStep` pro sledování kroků vícekrokových formulářů a kalkulaček.
- Rozšířena metoda `trackSearch` o předávání `resultsCount` a `hasResults` s ochranou proti PII.

### E. Administrátorský dashboard (`src/components/admin/AnalyticsManager.tsx`)
- Vytvořeno 9 přehledných sekcí s filtry období (`dnes`, `7 dní`, `30 dní`, `vše`):
  1. *Přehled & Realita*
  2. *User Journey (Cesty návštěvníků)*
  3. *Konverzní Funnels (Krok za krokem, Bottlenecks)*
  4. *Vyhledávání (Search Intelligence)*
  5. *Hledání bez výsledku (Obsahové mezery)*
  6. *Nástroje & Moduly (Deep Analytics)*
  7. *Uživatelé & Historie (Audited User Timeline)*
  8. *AI Příprava & Mezery*
  9. *Nastavení & Simulace (Killswitch & Multiplier)*

### F. Testovací pokrytí (`tests/analytics-2-user-journey.test.ts`, `scripts/test-runner.js`)
- Implementováno 9 komplexních unit/integration testů pokrývajících sanitizaci PII, rekonstrukci cesty, trychtýře, vyhledávání, metriky nástrojů, auditní logování, izolaci simulace a retenci.

---

## 4. Výsledky testů a verifikace
- **Jednotkové a integrační testy:**
  - `tests/analytics-2-user-journey.test.ts`: **9/9 PASS**
- **Celý test runner:** `npm test`: **ALL SUITES PASS (100%)**
- **Typecheck / Lint:** `npm run lint` (`tsc --noEmit`): **PASS (0 errors)**
- **Kompilace / Build:** `npm run build`: **PASS**

---

## 5. Bezpečnostní a architektonická kontrola (DevSecOps)
- **Zero-PII Enforcement:** Sanitizer propouští pouze povolené klíče. Žádné hesla, tokeny, jména dětí ani texty právních podání se do databáze nedostanou.
- **RBAC:** Všechny nové administrátorské endpointy vyžadují platnou session a roli `ADMIN`.
- **Audit Logging:** Prohlížení časové osy konkrétního uživatele je transparentně zaznamenáváno v auditním logu s ID přihlášeného administrátora.
- **Fail-Closed & In-Memory Fallback:** Při výpadku nebo nedostupnosti PostgreSQL běží analytika bezpečně v paměťovém store bez pádu aplikace.
- **Simulační izolace:** Simulace veřejného panelu je výhradně matematická a nezapisuje do databáze.

---

## 6. Závěr
Úkol **Analytics 2.0 – User Journey & Search Intelligence** byl úspěšně a bezpečně dokončen. Všechny komponenty jsou plně funkční a otestované.
