# AUDIT REPORT: ANALYTICS & ACTIVITY SYSTEM ARCHITECTURE AUDIT

**Datum a čas:** 2026-08-25 19:25 UTC  
**Úloha:** Audit existujícího stavu před implementací Privacy-First analytiky a veřejného panelu aktivity  
**Větev:** `feat/analytics-system`  
**Autor:** DevSecOps / Senior Full-Stack Architect & QA Engineer  

---

## 1. Shrnutí a cíl auditu
Cílem tohoto auditu je zmapovat stávající komponenty, databázové modely, API endpointy, middleware a frontendové vrstvy v projektu `dev3` pro návrh nového, bezpečného a striktně odděleného analytického subsystému s podporou volitelné prezentační simulace bez zkreslení reálných dat.

---

## 2. Zjištěný současný stav

### 2.1 Databázové modely (Prisma schema)
- **`AuditLog` / `AuditDocument` / `AuditShare`**: Existující modely pro auditování administrativních a bezpečnostních operací (přihlášení, změny konfigurace, exporty, sdílení spisů).
- **`SensitiveAccessLog`**: Model pro zaznamenávání přístupu k citlivým údajům dle GDPR.
- **`StateStatistic`**: Tabulka pro státní a soudní statistiky (ČSÚ, Ministerstvo spravedlnosti ČR, NKOD).
- **Analytický model pro návštěvnost**: V databázi dosud **neexistuje** dedikovaný model pro sledování page views, session ani interakcí portálu.

### 2.2 API Endpointy a Middleware
- **`src/middleware/authMiddleware.ts`**:
  - `parseAuthToken`: Dekóduje JWT token z Bearer hlavičky nebo HttpOnly cookie. Nastavuje `req.session.userId` a `req.user`.
  - `requireAuth`, `requireRole`, `requirePermission`: Zajišťují RBAC kontrolu (`USER`, `MODERATOR`, `LEGAL_EDITOR`, `CONTENT_MANAGER`, `ADMIN`, `SYSTEM_ADMIN`, `SUPER_ADMIN`).
- **`server.ts`**:
  - Registruje veřejné i privátní API routy pod `/api/*`.
  - Zahrnuje rate-limiting a bezpečnostní hlavičky.

### 2.3 Frontendové komponenty a navigace
- **`src/App.tsx` & `src/components/public/PublicPortal.tsx`**:
  - Klientský routing pomocí `window.history.pushState` a listeneru `popstate`.
  - Sekce homepage využívá Puck layout engine (`DEFAULT_HOMEPAGE_PUCK_DATA`) a dedikované komponenty (`Hero`, `ArticlesSection`, `FaqSection`, `ModulesSection`).
- **`src/components/admin/AdminDashboard.tsx`**:
  - Obsahuje tabové rozhraní pro správu (`overview`, `pages`, `texts`, `theme`, `branding`, `modules`, `esbirka`, `state-admin`, `subjekty`, `cms`, `users`, `compliance`, `audit`, `qa`, `ai-context`, `settings`, `dns`, `vps`, `tests`).

---

## 3. Bezpečnostní a architektonická rizika
1. **Riziko znečištění reálných dat (Data Integrity - P0)**:
   - Pokud by simulovaná prezentační aktivita zapisovala záznamy do tabulky reálných eventů, došlo by k trvalému znehodnocení analytických dat.
   - **Řešení**: Zavedení striktního pravidla: Simulace je čistě matematická prezentační transformační funkce na výstupním veřejném endpointu: `PublicDisplay = RealValue + (simEnabled ? SimulatedValue : 0)`. Administrace má vždy přístup k surovým reálným datům `RealValue`.
2. **Riziko úniku citlivých údajů (Privacy & GDPR - P0)**:
   - Záznamy interakcí nesmí obsahovat texty soudních rozhodnutí, jména dětí, hesla, tokeny ani osobní údaje z formulářů.
   - **Řešení**: Striktní sanitizace metadat, ukládání pouze technických parametrů (ID modulu, délka návštěvy, kategorie vyhledávání, normalizovaný dotaz bez PII).
3. **Ochrana individuální historie registrovaných uživatelů (BOLA / RBAC)**:
   - Detailní uživatelská analytika smí být dostupná pouze administrátorům a každý takový přístup musí být zaznamenán do `AuditLog`.

---

## 4. Návrh změn a nových komponent

### Databáze (`prisma/schema.prisma` & `dbStore.ts`):
1. **`AnalyticsEvent`**:
   - `id`: UUID (PK)
   - `timestamp`: DateTime (default `now()`)
   - `sessionId`: String (anonymizovaný hash nebo generované ID relace)
   - `userId`: String? (pouze pokud je uživatel přihlášen, jinak `null`)
   - `eventType`: Enum / String (`session_start`, `session_end`, `page_view`, `feature_open`, `feature_complete`, `search`, `form_start`, `form_complete`, `document_download`, `login`, `logout`)
   - `route`: String (např. `/kalkulacka-vyzivneho`, `/muj-pripad`, `/studie`)
   - `featureId`: String? (např. `alimony_calculator`, `care_calendar`, `judgment_parser`, `coparent_hub`)
   - `metadata`: Json? (např. `{ "durationSeconds": 45, "status": "success" }`)
   - `isAnonymous`: Boolean (default `true`)
2. **`AnalyticsSetting`**:
   - `id`: UUID
   - `publicStatsEnabled`: Boolean (default `true`)
   - `simulatedActivityEnabled`: Boolean (default `false`)
   - `simulationMultiplier`: Float (default `1.0`)
   - `simulationMin`: Int (default `0`)
   - `simulationMax`: Int (default `5`)
   - `simulationTimeWindow`: Int (default `15`) // minut
   - `updatedAt`: DateTime

### Backend (`src/services/analyticsService.ts`, `src/routes/analyticsRoutes.ts`):
1. Sběr a validace anonymních i autentizovaných eventů s rate-limitingem a ochranou proti spamu.
2. Agregační engine:
   - Aktivní návštěvníci nyní (klouzavé okno 15 minut).
   - Návštěvy dnes, unikátní návštěvníci dnes, návštěvy včera, posledních 7 dní, 30 dní.
   - Zobrazení stránek, top sekce, top funkce, vyhledávání, dokončené/nedokončené průchody, průměrný čas, vstupní/výstupní stránky.
   - Rozlišení anonymních návštěvníků vs registrovaných uživatelů.
3. Veřejný endpoint: `GET /api/analytics/public-summary` (poskytuje bezpečné agregované metriky, započítává simulaci pouze pokud je zapnutá).
4. Administrátorský endpoint: `GET /api/analytics/admin-stats` (chráněno `requireAuth` + `requireRole('ADMIN')`, poskytuje 100% reálná data a nastavení simulace).
5. Endpoint pro správu simulace: `POST /api/analytics/admin-settings` (chráněno `requireAuth` + `requireRole('ADMIN')` + audit log).

### Frontend:
1. `src/lib/analyticsClient.ts`: Klientský tracker pro automatické zaznamenávání `page_view` a pomocné metody `trackFeature`, `trackSearch`, `trackForm`.
2. `src/components/public/PortalActivityPanel.tsx`: Veřejný panel "Aktivita na portálu" / "Dnešní aktivita" pro zobrazení reálných (nebo prezentačně upravených) souhrnných metrik.
3. `src/components/admin/AnalyticsManager.tsx`: Kompletní administrátorský modul s dvěma kartami:
   - **A) Reálná data** (100% nemaskovaná data).
   - **B) Veřejná prezentace & Simulace** (konfigurace simulace s okamžitým přepínačem ON/OFF a náhledem rozdílu).
4. Integrace do `src/components/admin/AdminDashboard.tsx` jako nová záložka `analytics` ("Analytika & Návštěvnost").
5. Integrace veřejného panelu do `src/components/public/PublicPortal.tsx` / `Hero.tsx` / footeru.

---

## 5. Seznam dotčených souborů
- `prisma/schema.prisma`
- `src/types/index.ts`
- `src/services/dbStore.ts`
- `src/services/analyticsService.ts` *(nový)*
- `src/routes/analyticsRoutes.ts` *(nový)*
- `server.ts`
- `src/lib/analyticsClient.ts` *(nový)*
- `src/components/public/PortalActivityPanel.tsx` *(nový)*
- `src/components/admin/AnalyticsManager.tsx` *(nový)*
- `src/components/admin/AdminDashboard.tsx`
- `src/components/public/PublicPortal.tsx`
- `src/components/public/AlimonyCalculatorView.tsx`
- `src/tests/analyticsPrivacyAndSimulation.test.ts` *(nový)*
- `docs/audit/ANALYTICS_SYSTEM_AUDIT_2026-08-25.md` *(tento soubor)*

---

## 6. Provedené technické a architektonické změny

### 6.1 Databázová vrstva & Modely
- **Prisma Schema (`prisma/schema.prisma`)**:
  - Přidán model `AnalyticsEvent` pro trvalé uchovávání neměnných analytických událostí s indexy na `(timestamp)`, `(eventType)`, `(route)`, `(sessionId)` a `(userId)`.
  - Přidán model `AnalyticsSetting` pro oddělenou konfiguraci veřejného zobrazování a simulace.
- **In-Memory Store (`src/services/dbStore.ts`)**:
  - Přidáno `dbStore.analyticsEvents` s automatickým horním oříznutím paměti na 50 000 záznamů.
  - Přidáno `dbStore.analyticsSetting` pro bezpečný fallback při běhu bez aktivní PostgreSQL instance.

### 6.2 Backend Services & Routes
- **`src/services/analyticsService.ts`**:
  - `recordEvent`: Zajišťuje zápis surových dat. Metadata jsou striktně čištěna whitelistem klíčů (`durationSeconds`, `query`, `category`, `step`, `totalSteps`, `status`, `format`, `docType`, `source`). Z dotazů a parametrů jsou automaticky odstraňovány regexem e-maily a telefonní čísla.
  - IP adresa klienta je jednosměrně hashována (`SHA-256` se solí a denním rotujícím oknem) a zkrácena na 16 znaků.
  - `computeRealStats`: Počítá 100% autentické agregace (aktivní relace za posledních 15 minut, návštěvy dnes, unikátní uživatelé dnes, zobrazení stránek, top sekce, top funkce, poměr dokončení, doba strávená ve funkci, vstupní a výstupní stránky, hodinový profil).
  - `computeSimulation`: Matematická prezentační komponenta zohledňující denní biorytmus (koeficienty 0.15 v noci až 1.0 odpoledne). **Nikdy nezapisuje do databáze ani neovlivňuje reálná data.**
  - `getPublicSummary`: Veřejné agregované metriky (`PublicActivitySummary`).
  - `getAdminStats`: Kompletní administrátorský rozpad reálných vs simulovaných metrik (`AdminAnalyticsStats`).
- **`src/routes/analyticsRoutes.ts`**:
  - `POST /api/analytics/event`: Ingestní veřejný endpoint s rate limitingem (120 req/min/IP). Bezpečně čte `userId` ze serverové session (`req.user?.id` / `req.session?.userId`).
  - `GET /api/analytics/public-summary`: Veřejný endpoint se souhrnnými metrikami a Cache-Control hlavičkou.
  - `GET /api/analytics/admin-stats`: Chráněno `requireAuth` + `requireRole('ADMIN')`.
  - `POST /api/analytics/admin-settings`: Chráněno `requireAuth` + `requireRole('ADMIN')`, ukládá auditní log do `AuditLog`.
- **`server.ts`**:
  - Endpointy namountovány pod `/api/analytics`.

### 6.3 Frontendové komponenty & Integrace
- **`src/lib/analyticsClient.ts`**:
  - Správa `sessionId` v `sessionStorage`.
  - Podpora `navigator.sendBeacon` s bezpečným fallbackem na `fetch(..., { keepalive: true })`.
  - Metody `trackPageView`, `trackFeature`, `trackSearch`, `trackForm`.
- **`src/components/public/PortalActivityPanel.tsx`**:
  - Veřejný panel prezentující dnešní aktivitu na portálu v kompaktní nebo plné variantě (`variant="compact" | "full"`).
  - Neutrální a korektní formulace: „Aktivita na portálu dnes“, „Aktivní uživatelé nyní“, „Využití nástrojů dnes“.
- **`src/components/admin/AnalyticsManager.tsx`**:
  - Správa analytiky pro administrátory.
  - Dvě hlavní karty: **1. Reálné statistiky** (100% nezkreslená data, podrobný rozpad po hodinách, top nástroje, vstupní/výstupní stránky) a **2. Nastavení veřejné prezentace & Simulace** (okamžitý přepínač simulace ON/OFF, nastavení min/max a multiplikátoru, živý porovnávací náhled Reálná data vs Veřejné zobrazení).
- **`src/components/admin/AdminDashboard.tsx`**:
  - Přidána nová záložka `analytics` ("Analytika & Návštěvnost") s ikonou `Activity`.
- **`src/components/public/PublicPortal.tsx`**:
  - Automatické trasování zobrazení stránek přes `useEffect` při změně cesty.
  - Zobrazení `PortalActivityPanel` na homepage a pod routou `/aktivita-portalu`.
- **`src/components/public/AlimonyCalculatorView.tsx`**:
  - Zapojeno automatické trasování `feature_open` při otevření a `feature_complete` při úspěšném výpočtu.

---

## 7. Výsledky testů a QA verifikace

### 7.1 Unit & Integrační testy
- **Spuštěný test:** `src/tests/analyticsPrivacyAndSimulation.test.ts`
- **Výsledek testu:** **PASS (5/5 testů splněno)**
  1. `1. Privacy & Zero-PII Sanitization > should sanitize PII from event metadata and never store plaintext IP` -> **PASS**
  2. `2. Real Statistics Aggregation (Integrity) > should accurately aggregate real events` -> **PASS**
  3. `3. Strict Separation of Real and Simulated Data > should NEVER insert fake rows into the analytics database when simulation is active` -> **PASS**
  4. `3. Strict Separation of Real and Simulated Data > should return purely real numbers when simulation is disabled` -> **PASS**
  5. `4. Diurnal Pattern in Simulation Engine > should compute appropriate diurnal multipliers depending on hour` -> **PASS**

### 7.2 Linter a Typová kontrola
- **Příkaz:** `npm run lint` (`tsc --noEmit`)
- **Výsledek:** **PASS (0 chyb)**

### 7.3 Build aplikace
- **Příkaz:** `npm run build`
- **Výsledek:** **PASS (Build succeeded)**

---

## 8. Bezpečnostní a privacy kontrola (Security & Privacy Audit)
- **Zero Secrets in Code/Audit:** Žádné API klíče, hesla ani tokeny nebyly vloženy do zdrojových souborů ani do tohoto auditu.
- **Zero PII Storage:** Žádné osobní údaje dětí, matek, otců, rodná čísla ani texty rozsudků nejsou ukládány do analytických tabulek.
- **Anonymizace IP:** IP adresy jsou hashovány jednosměrným SHA-256 algoritmem se solí a zkráceny.
- **RBAC & Autorizace:** Administrátorské statistiky a konfigurace jsou striktně chráněny server-side kontrolou `requireAuth` a `requireRole('ADMIN')`.
- **Integrita dat:** Simulace neběží jako databázový proces, nezapisuje falešné řádky a administrátor má kdykoli možnost okamžitě zobrazit 100% čistá reálná data.

---

## 9. Závěr a Definition of Done
Všechny požadavky zadání (Fáze 1 až 9) byly kompletně implementovány, otestovány a ověřeny. Systém splňuje nejpřísnější standardy bezpečnosti, ochrany soukromí a integrity dat.
