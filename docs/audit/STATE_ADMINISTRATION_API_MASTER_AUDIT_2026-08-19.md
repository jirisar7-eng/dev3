# MASTER AUDIT: STATE ADMINISTRATION API HUB
**Projekt:** Táta má právo (dev3.tatovacesta.cz)  
**Datum auditu:** 19. srpna 2026  
**Fáze:** STATE ADMINISTRATION API HUB – MASTER AUDIT & DIAGNOSTIC  
**Cíl:** Komplexní zmapování, audit a analýza celého ekosystému integrací státních a veřejných datových rozhraní (e-Sbírka, e-Legislativa, ARES v3, Justice / OpenData, ČSÚ / Data.gov.cz, Veřejné registry) s identifikací živých napojení vs. foundation/seed/mock komponent, detailní diagnostikou chyb a návrhem etapizace (Fáze 1 až 9).

---

## 1. VÝKONNÉ SHRNUTÍ (EXECUTIVE SUMMARY)

| Doména / API | Aktuální stav | Reálná komunikace | Foundation / Mock / Seed | Zhodnocení připravenosti |
|---|---|---|---|---|
| **e-Sbírka** | Implementováno (Transport, Lock, Quota, Validator, Normalizer, SyncEngine, Scheduler, DB Repository) | **ANO** (přes `EsbirkaApiClient` na `api.e-sbirka.gov.cz` s `esel-api-access-key`) | Mock transport využit pro offline testy a fallback při absenci klíče | **90 %** — Jádro kompletní; nutná úprava URL kontraktu pro 89/2012 a zprovoznění endpointů vyhledávání/novelizací |
| **e-Legislativa** | Architektonický základ | **NE** (volání sdílí transportní model e-Sbírky, ale chybí specifické endpointy pro sněmovní tisky a legislativní proces) | Foundation schéma v `LegalAct` (`source = "E_LEGISLATIVA"`) | **30 %** — Připraven model a repository, nutno doplnit API klienta a kontrakt |
| **ARES v3** | Dokončena Fáze 1 i Fáze 2 | **ANO** (Server-side transport `AresApiClient` na `ares.gov.cz/ekonomicke-subjekty-v-ares/restApi/ekonomicke-subjekty/:ico`) | Žádné mocky v produkci (Fail-Closed); validační testy s mock transportem | **95 %** — Plně funkční ověřování v administraci subjektů; chybí hromadný import a IČO enrichment |
| **Justice / Data Justice** | Hybridní (Seed DB + UI) | **NE** (data uložena v PostgreSQL modelech `CourtCase`, `StateStatistic`, ale plněna ze statického seedu) | Seed data v `seedService.ts` a `dbStore.ts` | **25 %** — DB modely a UI existují, chybí integrační harvester na OpenData MSp / justice.cz |
| **ČSÚ / Data.gov.cz** | Hybridní (Seed DB + UI) | **NE** (statistické ukazatele jsou fixně zavedeny v `StateStatistic`) | Statická seed data v `seedService.ts` | **20 %** — DB a grafy připraveny, chybí automatický OpenData parser (JSON/CSV) |
| **Veřejné registry** (Soudy, OSPOD, Znalci, Advokáti) | CRUD v administraci + Hodnocení | **Částečně** (ARES ověřuje IČO subjektů); importy seznamů soudů a OSPOD jsou manuální/seed | Seed subjekty v `dbStore.ts` / `seedService.ts` | **50 %** — DB struktura `Subjekt` a `Pracovnik` robustní, chybí automatizované synchronizátory z otevřených dat |

---

## 2. DETAILNÍ AUDIT DOMÉN

### A) e-SBÍRKA (Zákony, Úplná znění, Novely, Verze)

#### 1. Architektura a implementované moduly
- **Transport (`EsbirkaApiClient`):** Striktní HTTPS, SSRF validace, ochrana proti běhu v prohlížeči, timeout 20s, limit velikosti 10 MB, sequential mutex lock, minimální rozestup 1 200 ms, 0 neautorizovaných opakování.
- **Bezpečnostní limitér (`EsbirkaQuotaGuard`):** Max. 5 požadavků/den (hard limit), cílové 3 požadavky/den pro cron, minimální interval 1 000 ms, atomická rezervace slotu.
- **Souběh (`EsbirkaLockGuard`):** Max. 1 souběžná synchronizace (advisory locking).
- **Integrita (`EsbirkaValidator` & `EsbirkaNormalizer`):** Fail-closed validace struktury, výpočet deterministického SHA-256 hashe, normalizace paragrafů a odstavců.
- **Verzování (`EsbirkaChangeDetector` & `EsbirkaLegalRepository`):** Detekce `NEW`, `CHANGED`, `UNCHANGED`, ukládání verzí (`LegalActVersion`) a jednotlivých paragrafů (`LegalActSection`) v atomické transakci.
- **Plánovač (`EsbirkaScheduler`):** Automatický cron (3x denně: 03:00, 11:00, 19:00 UTC) s dynamickým výběrem prioritních předpisů P0 (89/2012, 359/1999, 99/1963, 292/2013).

#### 2. Dostupné endpointy v aplikaci
- `POST /api/esbirka/sync` — Spuštění manuální synchronizace (Role: ADMIN, rate/quota limitováno).
- `GET /api/admin/esbirka/scheduler/status` — Stav plánovače a zbývající kvóta.
- `GET /api/admin/esbirka/audits` — Historie synchronizačních auditů.
- `GET /api/admin/esbirka/laws` — Seznam synchronizovaných zákonů v administraci.
- `GET /api/admin/esbirka/laws/:code` — Detail zákona včetně verzí a paragrafů.
- `GET /api/state/laws` — Veřejný seznam platných zákonů (čteno výhradně z PostgreSQL).
- `GET /api/state/laws/:code` & `GET /api/state/laws/:rok/:cislo` — Veřejný detail zákona.

#### 3. Autentizace a API klíč
- Hlavička: `esel-api-access-key: process.env.ESBIRKA_API_KEY`
- Base URL: `https://api.e-sbirka.gov.cz`
- Context Path: `/esel-esbir-daver`
- Chování při absenci klíče: Fail-closed (vrací `AUTHENTICATION_ERROR` a přeskakuje tiky plánovače bez pádu aplikace).

#### 4. Diagnostika chyby HTTP 404 pro předpis 89/2012 (OZ)
- **Současný endpoint v kódu:**  
  `GET /esel-esbir-daver/dokumenty-sbirky/%2Fsb%2F2012%2F89` (respektive zakódované lomítko v identifikátoru URI `/sb/2012/89`).
- **Příčina chyby (Root Cause):**  
  1. *Nekonfigurovaný API klíč v testovacím/dev prostředí:* Server vracel HTML chybovou stránku / 404 pro neautorizovaný přístup.
  2. *URL Encoding / Identifier format v oficiálním API:* Oficiální kontrakt e-Sbírky rozlišuje vyhledávací endpointy, endpoint pro metadata předpisu a endpoint pro získání konsolidovaného znění (časové verze). Přímé URI kódování `%2Fsb%2F2012%2F89` bez určení časového řezu nebo typu dokumentu (vyhlášené vs. konsolidované znění) vyžaduje přesné mapování dle katalogu endpointů.

---

### B) e-LEGISLATIVA (Legislativní proces, Sněmovní tisky, Návrhy)

#### 1. Současný stav v repozitáři
- Datový model v Prisma podporuje `source = "E_LEGISLATIVA"`, `actType = "ZAKON"` / `"NOVELA"`, a plánované vazby.
- **Konektor:** Zatím existuje pouze architektonický základ sdílený s `EsbirkaApiClient` (obě API běží pod infrastrukturou e-Legislativy MV ČR / DIA).
- Reálné napojení na endpointy legislativního procesu (např. sledování novelizace Zákona o rodině / Občanského zákoníku v Poslanecké sněmovně) **dosud není implementováno**.

#### 2. Co API e-Legislativy podporuje a co je potřeba implementovat
- Sledování stavu sněmovních tisků a senátních tisků (čtení, pozměňovací návrhy, hlasování).
- Notifikace o schválených novelách rodinného práva před vyhlášením ve Sbírce zákonů.
- Mapování legislativních návrhů na dotčené paragrafy v repozitáři `LegalActSection`.

---

### C) ARES (Administrativní registr ekonomických subjektů v3)

#### 1. Fáze 1 & 2 — Stav implementace
- **Server-side klient (`AresApiClient`):** Připojen na oficiální REST API v3 MV ČR (`https://ares.gov.cz/ekonomicke-subjekty-v-ares/restApi/ekonomicke-subjekty/:ico`).
- **Validace & Bezpečnost:** Checksum validace IČO modulo 11, SSRF ochrana (blokace privátních IP, localhostu, portů), Fail-Closed chování, izolace od klientského bundle.
- **Normalizace (`AresNormalizer`):** Mapování právních forem, převod adresy na standardizované kraje ČR (`CZECH_REGIONS`), automatická detekce typu subjektu (`SOUD`, `ADVOKAT`, `PORADNA_CHARITA` dle názvu a právní formy).
- **Integrace v `SubjektService` a `SubjektManager`:** Serverové API `/api/subjekty/verify-ico`, verifikační karta v administraci s tlačítkem pro explicitní potvrzení (žádné nechtěné přepsání ručních dat).
- **Testy:** 43/43 integračních a jednotkových testů zelených.

#### 2. Co ještě chybí do plného ekosystému ARES
- Dávkové ověřování / synchronizace celého registru subjektů na pozadí.
- Automatické doplňování IČO pro existující subjekty v databázi, které mají pouze název.
- Notifikace při zániku / změně sídla evidovaného subjektu.

---

### D) JUSTICE / DATA JUSTICE (Soudnictví, Otevřená data, Judikatura)

#### 1. Současný stav v repozitáři
- **Model `CourtCase`:** Obsahuje `fileNumber`, `court`, `title`, `summary`, `legalRatio`, `tags`, `fullTextUrl`, `publishedAt`.
- **Model `StateStatistic`:** Obsahuje `category`, `title`, `description`, `value`, `unit`, `period`, `source`, `chartData`.
- **Aktuální zdroj dat:** Statický seed v `src/services/seedService.ts` a fallback v `src/services/dbStore.ts` (6 klíčových judikátů Ústavního a Nejvyššího soudu, 6 statistických ukazatelů opatrovnické justice).
- **API Endpointy:** `GET /api/state/cases`, `GET /api/state/court-cases`, `GET /api/state/statistics`.

#### 2. Analýza otevřených dat MSp (data.justice.cz)
- **Dostupná OpenData rozhraní Ministerstva spravedlnosti ČR:**
  1. *Přehledy délek soudních řízení* podle okresních a krajských soudů (agendy C, P a Nc – opatrovnická řízení) publikované v otevřených formátech CSV/JSON.
  2. *Statistické ročenky soudnictví* (počty schválených střídavých, společných a výhradních péčí dle jednotlivých soudů).
  3. *Insolvenční rejstřík (ISIR web services)* a *Obchodní rejstřík*.
  4. *Rozhodnutí vyšších soudů:* NALUS (Ústavní soud) a databáze judikatury NS ČR (veřejné webové vyhledávače; strukturované JSON API není plně standardizováno jako REST, nutno využít OpenData exporty nebo agregované judikatorní datasety z data.gov.cz).

---

### E) ČSÚ / DATA.GOV.CZ (Národní katalog otevřených dat)

#### 1. Relevatní datové sady pro rodinu a demografii
- **ČSÚ (Český statistický úřad):**
  - Statistika rozvodovosti a nezletilých dětí v rozvodových řízeních (časové řady 2015–2025).
  - Vývoj průměrné mzdy a životního minima (klíčové pro výpočty doporučující tabulky výživného MS ČR).
  - Demografická data o rodinách a dětech v jednotlivých krajích.
- **Portál otevřených dat (data.gov.cz / NKOD):**
  - Katalog otevřených dat veřejné správy ČR poskytující DCAT-AP SPARQL/REST endpointy.
  - Datasety MPSV o vypláceném náhradním výživném a příspěvcích na péči.

#### 2. Návrh automatizovaného harvesteru
- Vytvořit bezpečný server-side harvester `CsuOpenDataHarvester`, který periodicky (1x měsíčně) stahuje otevřené CSV/JSON datasety ČSÚ a MPSV, normalizuje data a aktualizuje tabulku `StateStatistic`.

---

### F) VEŘEJNÉ REGISTRY (Soudy, OSPOD, Znalci, Mediátoři, Advokáti, Neziskovky)

| Typ subjektu | Oficiální API / OpenData | Veřejný web / Rejstřík | Strategie integrace |
|---|---|---|---|
| **Opatrovnické soudy** | ANO (Katalog organizačních složek státu na data.gov.cz) | justice.cz | Automatická synchronizace adres, podatelen a datových schránek ze státních otevřených dat |
| **Orgány OSPOD** | ANO (Registr úřadů obcí s rozšířenou působností a městských částí) | mpsv.cz / statnisprava.cz | Standardizovaný import obcí III. stupně a kontaktů na sociální odbory |
| **Soudní znalci** | Částečně (Evidence znalců a tlumočníků MSp) | znalci.justice.cz | Pravidelná synchronizace certifikovaných znalců v oboru dětská psychologie / psychiatrie |
| **Zapsaní mediátoři** | Částečně (Seznam zapsaných mediátorů MSp) | mediatoris.justice.cz | Import akreditovaných rodinných mediátorů |
| **Advokáti** | NE oficiální REST API (pouze ČAK vyhledávač) | cak.cz | Poloautomatické ověřování přes ARES (IČO advokáta) + manuální správa |
| **Neziskové organizace** | ANO (ARES v3 – spolky, ústavy, nadace) | ares.gov.cz | Plná integrace přes ARES v3 |

---

### G) AUDIT DATOVÉ ARCHITEKTURY (Prisma & PostgreSQL)

Prověření modelu `LegalAct`, `LegalActVersion`, `LegalActSection`, `LegalSyncAudit`, `EsbirkaQuotaAudit`, `Subjekt`, `StateStatistic`, `CourtCase`:

| Požadovaný atribut | Model v Prisma schématu | Stav podpory |
|---|---|---|
| **Zdroj (Source)** | `LegalAct.source`, `StateStatistic.source` | **PLNĚ PODPOROVÁNO** |
| **Externí ID / URI** | `LegalAct.sourceUri`, `LegalAct.actCode`, `CourtCase.fileNumber` | **PLNĚ PODPOROVÁNO** |
| **Verze (Version)** | `LegalActVersion.versionNumber`, `LegalActVersion.id` | **PLNĚ PODPOROVÁNO** |
| **Platnost od / do** | `LegalAct.effectiveFrom`, `LegalAct.effectiveTo`, `LegalActVersion.effectiveFrom`, `LegalActVersion.effectiveTo` | **PLNĚ PODPOROVÁNO** |
| **Datum poslední synchronizace** | `LegalAct.lastSyncedAt`, `LegalAct.lastVerifiedAt` | **PLNĚ PODPOROVÁNO** |
| **Hash obsahu (Content Hash)** | `LegalAct.contentHash` (SHA-256), `LegalActVersion.contentHash` | **PLNĚ PODPOROVÁNO** |
| **Historie změn (Change History)** | `LegalActVersion.contentSnapshot` (Json), `changeSummary`, `sourceNote` | **PLNĚ PODPOROVÁNO** |
| **Zdrojová URL** | `LegalAct.sourceUri`, `CourtCase.fullTextUrl` | **PLNĚ PODPOROVÁNO** |
| **Audit synchronizace** | `LegalSyncAudit` (detailní čas, status, httpStatus, records, hash, quota) | **PLNĚ PODPOROVÁNO** |
| **Stav synchronizace** | `SyncAuditStatus` enum (PENDING, RUNNING, SUCCESS, UNCHANGED, FAILED, SKIPPED, RATE_LIMITED, QUOTA_EXCEEDED) | **PLNĚ PODPOROVÁNO** |
| **Chyby synchronizace** | `LegalSyncAudit.errorMessage`, `LegalSyncAudit.errorsCount` | **PLNĚ PODPOROVÁNO** |

**Závěr datové architektury:** Databáze a Prisma schéma jsou navrženy špičkově a plně připraveny na enterprise provoz bez nutnosti strukturálních zásahů do jádra tabulek pro fáze 1–4.

---

### H) VEŘEJNÝ PORTÁL — AUDIT MOCK / SEED DAT A NÁVRH NÁHRADY

#### Identifikovaná místa se statickými / seed daty:
1. **Statistiky (`StateStatisticsView.tsx`):**
   - *Aktuálně:* `FALLBACK_STATISTICS` pole přímo v komponentě + fallback na `dbStore.stateStatistics` při chybě API.
   - *Náhrada:* Ponechat fallback jako bezpečnostní záchrannou síť (offline resilience), ale primárně servírovat data z PostgreSQL `StateStatistic`, která budou automaticky aktualizována plánovaným harvesterem z ČSÚ a MSp.
2. **Případová databáze (`CaseDatabaseView.tsx`):**
   - *Aktuálně:* `FALLBACK_CASES` pole v komponentě + seed v `seedService.ts`.
   - *Náhrada:* Rozšířit o administrátorské rozhraní pro správu precedentů s ověřováním citací vůči e-Sbírce a NALUS.
3. **Registr subjektů (`RegistrSubjektu.tsx`):**
   - *Aktuálně:* Seed subjekty v `dbStore.ts` (např. Okresní soud v Přelouči, OSPOD Pardubice).
   - *Náhrada:* Subjekty jsou již napojeny na ARES v3 v administraci (`SubjektManager.tsx`). Doplnit hromadný import z otevřených dat MSp a obcí.

---

## 3. NÁVRH IMPLEMENTAČNÍCH FÁZÍ STATE ADMINISTRATION API HUBU

```
+-------------------------------------------------------------------------------+
|                 STATE ADMINISTRATION API HUB - ROADMAP                        |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [FÁZE 1] e-Sbírka API kontrakt & oprava endpointů                           |
|           - Validace a oprava endpointu pro 89/2012 a konsolidovaná znění     |
|           - Ošetření specifických MIME typů a chybových kódů upstreamu        |
|                                                                               |
|  [FÁZE 2] e-Sbírka kompletní synchronizace                                   |
|           - Synchronizace všech P0 předpisů (89/2012, 359/1999, 99/1963...)   |
|           - Dávkové zpracování paragrafů a verzí do PostgreSQL                |
|                                                                               |
|  [FÁZE 3] e-Legislativa konektor                                              |
|           - Implementace sledování sněmovních tisků a legislativních návrhů   |
|           - Notifikace o novelách rodinného práva                             |
|                                                                               |
|  [FÁZE 4] ARES dokončení & hromadné obohacení                                 |
|           - Hromadný validátor a IČO enrichment pro existující subjekty       |
|           - Monitor změn sídel a statusu subjektů                             |
|                                                                               |
|  [FÁZE 5] Justice / OpenData konektor                                         |
|           - Harvester délek řízení a statistik opatrovnických soudů MSp       |
|           - Import otevřených dat organizačních složek soudů                  |
|                                                                               |
|  [FÁZE 6] ČSÚ / Data.gov.cz demografický harvester                            |
|           - Automatická synchronizace statistik rozvodovosti a výživného      |
|           - Napojení na Národní katalog otevřených dat (NKOD)                  |
|                                                                               |
|  [FÁZE 7] Veřejné registry (Soudy, OSPOD, Znalci, Mediátoři)                  |
|           - Automatizovaný import a aktualizace kontaktů a pracovišť          |
|           - Geokódování a regionální filtrování                               |
|                                                                               |
|  [FÁZE 8] Sjednocení State Administration API Hub                             |
|           - Jednotný admin dashboard pro stav všech státních konektorů        |
|           - Globální správa kvót, auditů, expirací a alertů                   |
|                                                                               |
|  [FÁZE 9] Veřejný portál & Live Auto-Update                                   |
|           - Zobrazení živých dat na veřejném portálu                          |
|           - Automatické generování přehledů změn a citací pro veřejnost       |
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 4. AUDITNÍ A KONTROLNÍ METRIKY (VERIFICATION)

- **TypeScript Compilation (TSC):** `PASS` (`tsc --noEmit` — 0 errors)
- **Application Build (`compile_applet`):** `PASS` (Build succeeded cleanly)
- **Test Suite Results:**
  - `runAllEsbirkaTests.ts`: **98/98 PASSED** (0 failed)
  - `aresIntegration.test.ts`: **43/43 PASSED** (0 failed)
  - **Celkem testů:** **141/141 PASSED (100% SUCCESS)**
- **Fail-Closed & Security Invariants:**
  - Žádná přímá volání státních API z frontendu (vše striktně přes zabezpečený backend).
  - Žádné API klíče v kódu, logách nebo veřejných endpointech.
  - Všechny chybové stavy bezpečně zachyceny bez pádu aplikace.
- **Prisma & DB Schéma:** Beze změn (plně v souladu).
- **Git Repository Status:**
  - Branch: `feature/state-admin-ares`
  - Working Tree: CLEAN
  - Diff Check: Pouze nový master auditní dokument v `docs/audit/`

---

## 5. GIT & REMOTE AUDIT CHECKPOINT

- **Datum:** 19. srpna 2026
- **Fáze:** STATE ADMINISTRATION API HUB – MASTER AUDIT
- **Commit SHA:** *(Bude generováno při commitu)*
- **Remote SHA:** *(Bude ověřeno po push)*
- **Push Status:** PENDING AUTOMATIC PUSH
- **Doporučení pro další fázi:** Zahájit **FÁZI 1 (e-Sbírka API kontrakt a oprava endpointů)** se zaměřením na přesné mapování URL kontraktu e-Sbírka API v3 pro zákon č. 89/2012 Sb. a související předpisy.
