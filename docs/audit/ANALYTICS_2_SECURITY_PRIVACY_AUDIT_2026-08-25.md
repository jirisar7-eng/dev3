# P0/P1 Independent Security, Privacy, and Data-Integrity Audit: Analytics 2.0

**Projekt:** Táta má právo (dev3)  
**Repozitář:** `jirisar7-eng/dev3`  
**Datum auditu:** 2026-08-25  
**Auditovaná větev:** `feat/analytics-2-user-journey`  
**Auditovaný commit:** `c46909d`  
**Typ auditu:** Nezávislý Read-Only Security, Privacy, Data-Integrity a Architecture Audit  
**Auditor:** DevSecOps & QA Security Engineering Hub  

---

## 1. Executive Summary

Byl proveden hloubkový, nezávislý bezpečnostní, architektonický a privacy audit systému **Analytics 2.0 (User Journey, Funnels, Search Intelligence & Zero-PII)**.

Audit se zaměřil na:
1. **Ochranu soukromí a Zero-PII sanitizaci** citlivých rodinných a právních dat portálu.
2. **Autorizaci a RBAC ochranu** administrátorských endpointů včetně analýzy rizik IDOR / BOLA u historie uživatelů.
3. **Auditní stopu (Audit Trail)** při přístupu administrátorů k analytickým datům.
4. **Izolaci simulace veřejné aktivity** od skutečných datových úložišť (ochrana před kontaminací produkční DB).
5. **Ochranu před zneužitím veřejného API pro sběr událostí** (Event Injection, Rate Limiting, DoS ochrana).
6. **AI Export & Compliance** – bezpečné agregace bez úniku identity uživatelů do externích služeb.
7. **Retenční pravidla a minimalizaci dat** (GDPR Article 5(1)(e) & Article 25).

### Souhrnný výsledek
| Metrika | Výsledek |
| :--- | :--- |
| **Celkový bezpečnostní verdikt** | **PASS** |
| **P0 Bezpečnostní zranitelnosti** | **0** |
| **P1 Závažná rizika integrity/soukromí** | **0** |
| **P2 Střední zjištění** | **0** |
| **P3 Nízká zjištění / doporučení** | **2** (architektonické poznámky k distribuovanému rate-limiteru a DB take limitu) |
| **Automatizované testy Analytics 2.0** | **9 / 9 PASS (100 %)** |
| **Kompletní systémová testovací sada** | **PASS** |
| **TypeScript Typecheck / Lint** | **PASS (0 chyb)** |
| **Produkční build (`npm run build`)** | **PASS** |
| **Doporučení pro merge na feature/dev** | **SCHVÁLENO** (Merge do `main` podléhá standardnímu Change Control) |

---

## 2. Detailní hodnocení auditovaných oblastí

### 2.1. Uživatelská historie & RBAC / IDOR / BOLA (P0 Kontrola)
* **Hodnocené komponenty:** `src/routes/analyticsRoutes.ts`, `src/services/analyticsService.ts` (`getUserIndividualHistory`).
* **Zjištění:**
  1. **Autentizace a autorizace:** Endpoint `GET /api/analytics/admin/users/:userId/history` je striktně chráněn middlewarem `requireAuth` a `requireRole('ADMIN')`. Neautorizované požadavky nebo požadavky od uživatelů s rolí `USER` / `MODERATOR` jsou odmítnuty s HTTP 401 / 403.
  2. **Imunita vůči IDOR/BOLA:** Běžný koncový uživatel nemá přístup k žádnému endpointu, který by vracel surovou nebo individuální historii analytických událostí (ani svoji vlastní, ani cizích uživatelů).
  3. **Povinný auditní záznam:** Metoda `getUserIndividualHistory()` okamžitě při volání zapisuje strukturovaný auditní log `VIEW_USER_ANALYTICS_HISTORY` prostřednictvím `dbStore.logAudit()` (s ID a e-mailem administrátora).
  4. **Ochrana citlivých údajů:** Události v časové ose generují pouze bezpečná sumarizační hlášení (`safeDescription`). Záznamy nikdy neobsahují hesla, tokeny, rodná čísla, spisy ani texty podání.

### 2.2. Zero-PII Sanitizace a Filtrační Pipeline (P0/P1 Kontrola)
* **Hodnocené komponenty:** `src/services/analyticsService.ts` (`sanitizeMetadata`).
* **Zjištění:**
  1. **Allowlist přístup:** Metadata událostí procházejí striktním whitelist filtrem povolených klíčů: `query`, `category`, `resultsCount`, `hasResults`, `step`, `stepName`, `totalSteps`, `funnelId`, `docType`, `format`, `durationSeconds`, `referrer`.
  2. **Aktivní blacklist:** Všechny potenciálně citlivé klíče (`password`, `email`, `token`, `ssn`, `rc`, `childName`, `legalCaseNotes`, `caseNumber`, `iban`, `amount`) jsou bezpodmínečně vyřazeny.
  3. **Regex sanitizace vyhledávacích dotazů:**
     - E-mailové adresy jsou detekovány a nahrazeny tokenem `[EMAIL_REDACTED]`.
     - Telefonní čísla ve formátu CZ/SK jsou detekována a nahrazena tokenem `[PHONE_REDACTED]`.
     - Maximální délka vyhledávacího dotazu je omezena na 120 znaků (ochrana před přetečením paměti a log injection).
  4. Ověřeno jednotkovým testem č. 1: `Zero-PII Sanitization strips forbidden keys` (PASS).

### 2.3. Search Intelligence & Ochrana dotazů (P1 Kontrola)
* **Hodnocené komponenty:** `src/services/analyticsService.ts` (`getSearchIntelligence`).
* **Zjištění:**
  1. **Agregace a normalizace:** Vyhledávací dotazy jsou normalizovány (`toLowerCase().trim()`), jednopísmenný šum je ignorován.
  2. **Anonymní přehled:** Výstup agreguje počty dotazů, průměrné počty nalezených výsledků a identifikuje témata s nulovým výsledkem (pro rozšíření obsahu/průvodců).
  3. **Žádná vazba na uživatele:** Ve výstupu Search Intelligence nejsou obsažena žádná `userId`, `sessionId` ani IP adresy.

### 2.4. AI Insights Export & Ochrana před externím únikem (P1 Kontrola)
* **Hodnocené komponenty:** `src/services/analyticsService.ts` (`getAnalyticsAiInsights`).
* **Zjištění:**
  1. **Lokální agregace:** Endpoint `GET /api/analytics/admin/ai-insights` generuje statistický strukturovaný objekt ze souhrnných metrik (top dotazy bez výsledků, drop-off kroky ve formulářích).
  2. **Žádné externí volání API:** Kód nevolá žádné externí AI služby na pozadí a neodesílá surová data třetím stranám.
  3. **Zero-PII struktura:** Export obsahuje pouze agregované názvy funkcí a anonymizované klíčové fráze.

### 2.5. Izolace simulace aktivity (P0 Kontrola integrity)
* **Hodnocené komponenty:** `src/services/analyticsService.ts` (`computeSimulation`, `computeRealStats`).
* **Zjištění:**
  1. **Čistě prezentační vrstva:** Simulace aktivity se počítá v reálném čase podle denní křivky (diurnal factor) a konfigurace.
  2. **Nulový zápis do DB:** Simulace NIKDY nezapisuje falešné události do tabulky `AnalyticsEvent` ani do `dbStore.analyticsEvents`.
  3. **Striktní oddělení v administraci:** Administrátor v `AnalyticsManager` vidí jasně oddělené záložky *Skutečná data (100% Real)* vs *Prezentační vrstva (Veřejný portál)*.
  4. Ověřeno testem č. 8: `Simulation is strictly isolated and does not alter real storage` (PASS).

### 2.6. Ingestion Pipeline & Rate Limiting (P1 Kontrola odolnosti)
* **Hodnocené komponenty:** `src/routes/analyticsRoutes.ts` (`checkRateLimit`, `POST /api/analytics/event`).
* **Zjištění:**
  1. **Rate Limiter:** Zaveden in-memory rate limiting pro ingestion (max. 120 požadavků / minutu na IP / session).
  2. **Payload validace:** Striktní kontrola maximální délky polí (route max 300 znaků, featureId max 100 znaků, sessionId max 100 znaků).
  3. **Graceful Degradation:** Při nedostupnosti databáze systém přechází na paměťový fallback bez dopadu na uživatelskou zkušenost a bez házení 500 chyb uživateli.

### 2.7. Retence & Minimalizace dat (P1 GDPR Kontrola)
* **Hodnocené komponenty:** `src/services/analyticsService.ts` (`cleanOldEvents`).
* **Zjištění:**
  1. Metoda `cleanOldEvents(days=90)` bezpečně maže analytické události starší než 90 dní z databáze i z paměti.
  2. Ověřeno testem č. 9: `Retention cleanup removes events older than 90 days` (PASS).

---

## 3. Výsledky testů a verifikace

| Testovací sada | Popis | Výsledek |
| :--- | :--- | :--- |
| **Test 1** | Zero-PII Sanitization strips forbidden keys | **PASS** (1.5 ms) |
| **Test 2** | User Journey Analytics reconstructs entry/exit pages and transitions | **PASS** (53.5 ms) |
| **Test 3** | Funnel Analytics correctly computes conversion and drop-off steps | **PASS** (1.4 ms) |
| **Test 4** | Search Intelligence tracks top queries and zero-result queries | **PASS** (1.1 ms) |
| **Test 5** | Deep Feature Analytics computes usage, completion and duration metrics | **PASS** (1.2 ms) |
| **Test 6** | Individual User History returns timeline and logs administrative audit | **PASS** (1.1 ms) |
| **Test 7** | Aggregated AI Insights identifies content gaps and bottlenecks without raw PII | **PASS** (1.3 ms) |
| **Test 8** | Simulation is strictly isolated and does not alter real storage | **PASS** (2.8 ms) |
| **Test 9** | Retention cleanup removes events older than 90 days | **PASS** (0.9 ms) |
| **Regression** | Prisma Fail-Closed Security & Read-Only Fallback (12 subtests) | **PASS** (14.1 ms) |
| **Lint** | `tsc --noEmit` | **PASS** (0 chyb) |
| **Build** | `npm run build` | **PASS** |

---

## 4. Přehled zjištění a doporučení (Findings)

### P0 (Kritická zjištění): 0
*Nebyly nalezeny žádné P0 bezpečnostní ani datové vady.*

### P1 (Vysoká zjištění): 0
*Nebyly nalezeny žádné P1 privacy ani integrity vady.*

### P2 (Střední zjištění): 0
*Nebyly nalezeny žádné P2 vady.*

### P3 (Nízká zjištění / Architektonická doporučení): 2
1. **[P3-01] Distribuovaný Rate Limiting pro multi-pod nasazení:**
   - *Současný stav:* Ingestion rate limiter v `analyticsRoutes.ts` používá in-memory mapu `ingestionRateLimitMap`. V jednokontejnerovém prostředí (dev3 / Cloud Run single instance) funguje bezchybně.
   - *Doporučení:* Při budoucím škálování na více současných replik kontejnerů portálu zvážit napojení na Redis / Cloud Armor.
2. **[P3-02] Periodické automatické spouštění retence (Cron):**
   - *Současný stav:* Funkce `cleanOldEvents()` je implementována a otestována, v administraci je dostupná a připravena pro manuální i programatické volání.
   - *Doporučení:* Doporučuje se napojit `cleanOldEvents(90)` na noční cron scheduler (např. v `server.ts` společně s e-Sbírka údržbou).

---

## 5. Závěrečný verdikt

| Položka | Stav |
| :--- | :--- |
| **Bezpečnostní audit:** | **PASS** |
| **Integrita dat a Zero-PII:** | **PASS** |
| **Ochrana před únikem dat (RBAC + Audit Log):** | **PASS** |
| **CAN MERGE TO DEV/FEATURE:** | **YES** |
| **CAN MERGE TO MAIN:** | **Subject to explicit user Change Control directive** |

*Implementace Analytics 2.0 plně splňuje nejpřísnější bezpečnostní, etické a architektonické standardy projektu „Táta má právo“.*
