# ANALYTICS 2.0 – USER JOURNEY & SEARCH INTELLIGENCE: READ-ONLY AUDIT

**Datum auditu:** 2026-08-25 19:45 UTC  
**Větev:** `feat/analytics-2-user-journey`  
**Účel:** Detailní rozbor existující architektury analytiky (v1) před implementací User Journey & Search Intelligence (v2).

---

## 1. Současný stav Analytics architektury (v1)

### 1.1 Databázové modely (Prisma & in-memory store)
- **`AnalyticsEvent`**:
  - `id`: UUID (PK)
  - `timestamp`: DateTime (indexováno)
  - `sessionId`: String (indexováno)
  - `userId`: String? (indexováno)
  - `eventType`: String (indexováno) – např. `page_view`, `feature_open`, `feature_complete`, `search`, `session_start`, `session_end`, `form_start`, `form_complete`, `document_download`
  - `route`: String (indexováno)
  - `featureId`: String?
  - `metadata`: Json? (sanitizovaný payload s whitelistem klíčů)
  - `isAnonymous`: Boolean (default true)
  - `createdAt`: DateTime
- **`AnalyticsSetting`**:
  - `id`: String (PK)
  - `publicStatsEnabled`: Boolean
  - `simulatedActivityEnabled`: Boolean
  - `simulationMultiplier`: Float
  - `simulationMin`: Int
  - `simulationMax`: Int
  - `simulationTimeWindow`: Int
  - `updatedAt`: DateTime
- **`dbStore` (In-Memory Fallback)**:
  - `analyticsEvents`: Array s automatickým oříznutím na 50 000 prvků.
  - `analyticsSetting`: Výchozí konfigurace.

### 1.2 Existující eventy a sanitizace metadat
- **Povolené klíče metadat**: `durationSeconds`, `query`, `category`, `step`, `totalSteps`, `status`, `format`, `docType`, `source`.
- **Sanitizace**: Odstraňování e-mailů a telefonních čísel z textů, odstranění query parametrů z URL `route`.
- **IP anonymizace**: SHA-256 hashování se solí a rotujícím denním oknem.

### 1.3 Existující API a RBAC
- `POST /api/analytics/event`: Veřejný ingest s rate-limitingem (120 req/min/IP).
- `GET /api/analytics/public-summary`: Veřejný agregovaný souhrn pro `PortalActivityPanel`.
- `GET /api/analytics/admin-stats`: Chráněno `requireAuth` + `requireRole('ADMIN')`.
- `POST /api/analytics/admin-settings`: Chráněno `requireAuth` + `requireRole('ADMIN')` + `AuditLog`.

---

## 2. Plán rozšíření na Analytics 2.0 (User Journey & Search Intelligence)

### 2.1 Žádné duplicitní tabulky
Architektura `AnalyticsEvent` je flexibilní a normalizovaná. Není potřeba zakládat nové tabulky; rozšíříme:
1. **Metadata whitelist**: Přidání `resultsCount`, `targetRoute`, `previousRoute`, `stepName`, `funnelId`, `flowType`, `actionType`, `filter` pro podporu komplexních funnels a search inteligence.
2. **Časové filtry**: Podpora časových oken (`today`, `7d`, `30d`, `custom`) na backendu pro analytické dotazy.
3. **Agregační metody v `AnalyticsService`**:
   - `getUserJourneyStats(timeRange)`: Nejčastější vstupní/výstupní stránky, tranzice mezi stránkami, průměrná hloubka návštěvy a čas relace, nejčastější sekvence stránek.
   - `getFunnelStats(funnelId, timeRange)`: Univerzální výpočet konverzního trychtýře (krok za krokem, completion rate, drop-off / abandonment rate).
   - `getSearchIntelligence(timeRange)`: Celkový počet hledání, nejčastější dotazy, dotazy s nulovým počtem výsledků (Zero Results), průměrný počet výsledků a míra prokliku (CTR).
   - `getFeatureDeepAnalytics(timeRange)`: Podrobná analýza modulů/nástrojů, trendy, průměrná doba trvání a opuštění.
   - `getUserIndividualHistory(userId, timeRange, adminActorId)`: Zabezpečené vyčtení anonymizované časové osy konkrétního registrovaného uživatele s povinným auditním záznamem do `AuditLog`.
   - `getAnalyticsAiInsights(timeRange)`: Agregovaná data připravená pro budoucí lokální/AI souhrny.
4. **Nové/Rozšířené API endpointy**:
   - `GET /api/analytics/admin/journey` (ADMIN)
   - `GET /api/analytics/admin/funnels` (ADMIN)
   - `GET /api/analytics/admin/search-intelligence` (ADMIN)
   - `GET /api/analytics/admin/features` (ADMIN)
   - `GET /api/analytics/admin/users/:userId/history` (ADMIN + Audit)
   - `GET /api/analytics/admin/ai-insights-data` (ADMIN)
5. **Admin UI (`AnalyticsManager.tsx`)**:
   - Záložky: 1. Přehled, 2. User Journey, 3. Funnels (Konverzní trychtýře), 4. Vyhledávání & Zero Results, 5. Funkce & Nástroje, 6. Uživatelé & Časová osa, 7. Simulace & Prezentace.
   - Filtry období: Dnes, Posledních 7 dní, Posledních 30 dní.

---

## 3. Bezpečnostní a architektonická pravidla pro Analytics 2.0
1. **Zero-PII**: Žádné ukládání hesel, tokenů, citlivých osobních údajů, rozsudků, spisů či rodných čísel.
2. **Data Isolation**: Simulace zůstává striktně izolovaná od reálných dat.
3. **Auditní stopa**: Přístup k časové ose konkrétního uživatele musí být vždy zapsán do `AuditLog`.
4. **Zpětná kompatibilita**: Existující tracker i veřejný panel zůstávají 100% funkční.
