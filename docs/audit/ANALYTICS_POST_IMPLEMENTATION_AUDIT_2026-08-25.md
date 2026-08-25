# P0 POST-IMPLEMENTATION SECURITY & FUNCTIONAL AUDIT: PRIVACY-FIRST ANALYTICS

**Datum a čas auditu:** 2026-08-25 19:40 UTC  
**Úloha:** Samostatný Read-Only Security + Functional Audit celého implementovaného subsystému analytiky  
**Větev:** `feat/analytics-system` (commit `753d9b5`)  
**Cílová větev pro posouzení:** `main`  
**Role auditora:** DevSecOps Engineer, Senior Backend/Frontend Architect & QA Auditor (Projekt Táta má právo / dev3)  
**Režim auditu:** READ-ONLY (žádné změny kódu, žádný commit, žádný push, žádná změna databáze)  

---

## 1. Manažerské shrnutí a celkový verdikt

| Metrika | Hodnota | Poznámka |
| :--- | :--- | :--- |
| **Celkový verdikt** | **PASS (SCHVÁLENO PRO MERGE DO MAIN)** | Implementace splňuje všechny bezpečnostní i funkční standardy |
| **Kritické zranitelnosti (P0)** | **0 nalezeno** | Žádné úniky PII, žádné falšování DB, striktní RBAC |
| **Závažná rizika (P1)** | **0 nalezeno** | Bezpečné toky dat, ochrana proti DoS |
| **Doporučení / Údržba (P2)** | **1 zjištění** | Nastavení periodického spouštění DB retention cronu v produkci |
| **Drobné náměty (P3)** | **1 zjištění** | Zvážení Redis pro distribuovaný rate-limiting při multi-node škálování |
| **Výsledky testů** | **PASS (5/5)** | `src/tests/analyticsPrivacyAndSimulation.test.ts` |
| **TypeScript / Linter** | **PASS (0 chyb)** | `npm run lint` (`tsc --noEmit`) |
| **Produkční build** | **PASS** | `npm run build` |

---

## 2. Detailní audit dle 14 bodů zadání

### 2.1 DATABASE & DATOVÝ MODEL
- **Prisma Schema vs Implementace:**
  - Model `AnalyticsEvent` a model `AnalyticsSetting` jsou řádně deklarovány v `prisma/schema.prisma` a odpovídají TypeScript typům v `src/types/index.ts`.
  - Atributy: `id` (UUID PK), `timestamp` (DateTime default `now()`), `sessionId` (String), `userId` (String optional), `eventType` (String), `route` (String), `featureId` (String optional), `metadata` (Json optional), `isAnonymous` (Boolean default `true`).
- **Indexy a efektivita dotazů:**
  - Vytvořeny dedikované indexy: `@@index([timestamp])`, `@@index([eventType])`, `@@index([route])`, `@@index([sessionId])`, `@@index([userId])`.
  - Pokrývají veškeré agregační dotazy (časová okna, agregace sekcí, filtr aktivních relací i audit uživatelské historie).
- **Prevence nekontrolovaného růstu databáze:**
  - In-memory store (`dbStore.analyticsEvents`) implementuje automatické oříznutí FIFO na maximálně **50 000 záznamů**.
  - `AnalyticsService.cleanOldEvents(days = 90)` implementuje bezpečné čištění záznamů starších než 90 dní.
- **Bezpečnost in-memory fallbacku:**
  - Všechny databázové operace v `AnalyticsService` používají bezpečný `try/catch` blok s voláním `isPrismaAvailable()`. Při výpadku PostgreSQL je aktivita plynule zpracována přes `dbStore` bez pádu serveru (HTTP 503 / graceful degradation).

---

### 2.2 REAL DATA (End-to-End tok dat)
- **Kompletní E2E tok:**
  `Browser UI` → `analyticsClient` (`src/lib/analyticsClient.ts`) → `POST /api/analytics/event` (`src/routes/analyticsRoutes.ts`) → `AnalyticsService.recordEvent` (`src/services/analyticsService.ts`) → `Prisma/dbStore` → `AnalyticsService.computeRealStats` → `GET /api/analytics/admin-stats` & `GET /api/analytics/public-summary` → `PortalActivityPanel` / `AnalyticsManager`.
- **Ověřené typy událostí:**
  - `page_view`: Automaticky zachyceno v `PublicPortal.tsx` při každé navigaci.
  - `session_start` & session tracking: Inicializováno v `analyticsClient.ts` s ukládáním `sessionId` v `sessionStorage`.
  - `feature_open` / `feature_complete`: Integrováno např. v `AlimonyCalculatorView.tsx`.
  - `search`: Vyhledávací dotazy jsou normalizovány a očištěny od citlivých znaků.
  - `login` / `logout`: Zachycení stavu přihlášení bez ukládání hesel nebo session tokenů.
  - `form_start` / `form_complete` / `document_download`: Zaznamenání technického typu formuláře/dokumentu bez obsahu.

---

### 2.3 ACTIVE USERS (Mechanismus aktivních relací)
- **Klouzavé 15minutové okno:**
  - `activeVisitorsNow` počítá unikátní `sessionId` z událostí za posledních 15 minut (`timestamp >= new Date(Date.now() - 15 * 60 * 1000)`).
- **Obnova relace & Heartbeat:**
  - Klientský tracker udržuje `sessionId` v `sessionStorage` a při interakcích delších než 15 minut odesílá heartbeat.
- **Vypršení a timeout:**
  - Pokud uživatel neprovede žádnou akci po dobu 15 minut, jeho relace automaticky vypadává z množiny aktivních návštěvníků.
- **Unikátnost relací:**
  - Agregace využívá `new Set(recentEvents.map(e => e.sessionId)).size` — opakované načtení stránky (F5) nezvyšuje počet aktivních návštěvníků.

---

### 2.4 PRIVACY & GDPR (P0 Security Standard)
- **Striktní Zero-PII garance:**
  - Do databáze se **NIKDY neukládá plaintext IP adresa** ani **User-Agent**.
  - Žádná jména, e-maily, rodná čísla, telefonní čísla ani adresy.
  - **Právní obsah formulářů je striktně eliminován:** Výše příjmů, částky výživného, majetková vyrovnání, texty rozsudků ani návrhů na soud **nejsou** součástí analytiky.
  - Soukromé zprávy, spisy dětí a opatrovnické poznámky jsou zcela mimo dosah analytického modulu.
- **Sanitizace metadat:**
  - Whitelist povolených atributů: `['durationSeconds', 'query', 'category', 'step', 'totalSteps', 'status', 'format', 'docType', 'source']`.
  - Automatické čištění e-mailů (`/[\w.-]+@[\w.-]+\.\w+/g`) a telefonních čísel (`/(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g`) v libovolném textovém poli dotazu.

---

### 2.5 IP HASHING & ROTACE SOLI
- **Algoritmus:** `crypto.createHash('sha256')`.
- **Denní rotace soli:**
  - Sůl je tvořena kombinací serverového tajemství (`process.env.JWT_SECRET`) a celočíselného dne v unixové epoše (`Math.floor(Date.now() / 86400000)`).
  - Včerejší IP hash je nekompatibilní s dnešním IP hashem, což znemožňuje dlouhodobé profilování uživatelů napříč dny.
- **Nereverzibilita a ořezání:**
  - Hash je zkrácen na 16 hexadecimálních znaků (`.substring(0, 16)`), což zabraňuje jakékoli zpětné rekonstrukci síťové adresy.

---

### 2.6 PUBLIC API & DATA EXPOSURE (P0)
- **Endpoint `GET /api/analytics/public-summary`:**
  - Vrací pouze souhrnné agregační hodnoty: `activeVisitorsNow`, `visitsToday`, `pageViewsToday`, `toolsUsedToday`, `isSimulated`, `lastUpdated`.
  - **Expozice dat:** 0 uživatelských ID, 0 session ID, 0 IP hashů, 0 interních trasování, 0 textových parametrů.
- **Cache-Control hlavička:**
  - Nastaveno `res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')`, což chrání backend před DoS a umožňuje efektivní cachování na úrovni reverzní proxy (Caddy / Cloudflare).

---

### 2.7 SIMULATION ENGINE & DATA INTEGRITY (P0)
- **Garance integrity dat:**
  - Funkce `computeSimulation` je čistě výpočetní matematická transformační vrstva.
  - **Simulace NIKDY nezapisuje žádný řádek do tabulky `AnalyticsEvent` ani do `dbStore.analyticsEvents`.**
- **Denní biorytmus (Diurnal Pattern):**
  - Koeficienty škálují aktivitu podle hodiny dne (0.15 v hluboké noci ve 04:00, 0.40 ráno, 0.85 dopoledne, 1.00 odpoledne ve 14:00).
- **Okamžitý nouzový vypínač (Killswitch):**
  - Administrátor může v `AnalyticsManager` jediným kliknutím nastavit `simulatedActivityEnabled = false`.
- **Nemaskovaná data pro administrátora:**
  - Administrátor má na kartě *1. Reálná analytická data* k dispozici výhradně 100% surová data ze skutečných interakcí.

---

### 2.8 ADMIN SECURITY & RBAC (P0)
- **Ochrana endpointů:**
  - `GET /api/analytics/admin-stats`: Chráněno `requireAuth` + `requireRole('ADMIN')`.
  - `POST /api/analytics/admin-settings`: Chráněno `requireAuth` + `requireRole('ADMIN')`.
  - Neautorizovaní uživatelé a běžní uživatelé bez role `ADMIN` / `SUPER_ADMIN` dostávají HTTP 401 nebo HTTP 403.
- **Auditní stopa v `AuditLog`:**
  - Každá změna nastavení simulace vygeneruje záznam v `AuditLog` (`ANALYTICS_SETTINGS_UPDATED`) se záznamem identity administrátora a IP adresy.
- **Prevence IDOR/BOLA:**
  - Žádné endpointy nepřijímají přímé ID jiných uživatelů k manipulaci nebo čtení citlivých dat.

---

### 2.9 RATE LIMITING & DOS OCHRANA
- **Ingest limit na `POST /api/analytics/event`:**
  - Zaveden in-memory rate limiter s limitem **120 požadavků / minutu / IP**.
- **Odezva při překročení limitu:**
  - HTTP 429 Too Many Requests (`{ error: 'Překročen limit analytických požadavků.' }`).
- **Ochrana před memory leakem:**
  - Časové okno se automaticky čistí a neponechává staré IP klíče v paměti.

---

### 2.10 FRONTEND ARCHITEKTURA & VÝKON
- **Neblokující odesílání:**
  - `analyticsClient.ts` preferuje `navigator.sendBeacon()`, případně `fetch()` s příznakem `keepalive: true`.
  - Odesílání probíhá na pozadí a neblokuje vykreslovací vlákno ani přechody mezi stránkami.
- **Silent Failures:**
  - Veškeré volání je obaleno v `try/catch` — výpadek sítě nebo analytického endpointu nikdy neshodí klientskou aplikaci ani nezobrazí chybový dialog uživateli.
- **Správa úložiště:**
  - Využívá `sessionStorage`, která se automaticky zruší po zavření tabu/prohlížeče.

---

### 2.11 VÝKON & AGREGAČNÍ DOTAZY
- **Efektivita:**
  - Časové filtry využívají indexy nad sloupcem `timestamp`.
  - Agregace v paměti má časovou složitost $O(N)$ s využitím hash map (`Map` a `Set`).
- **Doporučení pro vysokou zátěž:**
  - Pro miliony eventů v PostgreSQL doporučeno zachovat 90denní partition/retention strategii.

---

### 2.12 REGISTROVANÍ UŽIVATELÉ & UŽIVATELSKÁ HISTORIE
- **Bezpečné přiřazení identity:**
  - `userId` je zjišťováno výhradně z ověřeného serverového JWT tokenu (`req.user?.id`), nikoli z klientského JSON payloadu.
- **Oddělení anonymních a registrovaných relací:**
  - Anonymní relace mají `userId: null` a `isAnonymous: true`.
  - Anonymní historie není zpětně párována s profilem uživatele bez výslovného souhlasu.

---

### 2.13 RETENTION & CLEANUP
- **In-Memory Store:** Striktní limit **50 000 záznamů**.
- **Databázové promazávání:** Metoda `AnalyticsService.cleanOldEvents(90)` je připravena k volání přes periodický scheduler.

---

### 2.14 TESTY & VERIFIKACE
- **Unit & Integrační testy:**
  - Soubor `src/tests/analyticsPrivacyAndSimulation.test.ts` byl spuštěn přes Vitest.
  - **Výsledek:** **5/5 PASS (100 % úspěšnost)**.
- **Typová kontrola & Linter:**
  - Příkaz `npm run lint` (`tsc --noEmit`): **0 chyb (PASS)**.
- **Kompilace a produkční build:**
  - Příkaz `npm run build`: **PASS**.

---

## 3. Přehled nálezů dle závažnosti (Severity Rating)

| ID | Závažnost | Oblast | Popis | Doporučené opatření | Stav |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUD-ANL-001** | **P2 (Advisory)** | DB Retention | Metoda `cleanOldEvents(90)` je připravena, v produkčním PostgreSQL prostředí je vhodné napojit její volání na denní cron úlohu (např. vedle e-Sbírka scheduleru). | Ponechat v backlogu provozních úloh pro produkční deployment. | OTEVŘENO (Nízké riziko) |
| **AUD-ANL-002** | **P3 (Advisory)** | Rate Limiter | In-memory rate limiting v `analyticsRoutes.ts` chrání jednotlivou instanci Node.js. V případě horizontálního škálování na více kontejnerů lze zvážit centrální Redis store. | Pro současnou jednodeskovou/VPS architekturu plně dostačující. | POZNÁMKA |

---

## 4. Závěrečné stanovisko a Change Control doporučení

Celý analytický systém na větvi `feat/analytics-system` (commit `753d9b5`) byl detailně prověřen v read-only režimu. 
- Systém **neporušuje soukromí uživatelů (Zero-PII)**.
- Systém **neporušuje integritu databáze (nulové falešné řádky)**.
- Systém **má plné pokrytí testy, bezchybný TypeScript lint i úspěšný produkční build**.

**Doporučení pro Change Control:**
Větev `feat/analytics-system` je **bezpečná a plně způsobilá k začlenění (merge) do hlavní větve `main`**, jakmile uživatel vydá pokyn ke Change Control.
