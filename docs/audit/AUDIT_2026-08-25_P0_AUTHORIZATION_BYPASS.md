# AUDIT: P0 Authorization Bypass via Prisma Proxy Fallback & Whitelist Architecture Refactor

- **Datum a čas auditu:** 25. 8. 2026
- **Název úkolu:** P0 oprava fail-open bypassu v Prisma Proxy: Přechod z blacklistu na Content-only Whitelist a striktní zákaz simulace WRITE operací
- **Původní požadavek/cíl:** Zjistit, zda globální DB fallback může způsobit FAIL-OPEN autorizaci nebo falešné zápisy, a zajistit striktní FAIL-CLOSED chování pro všechny bezpečnostní, doménové, auditní, transakční a WRITE operace, zatímco CMS/UI nadále používá bezpečný read-only fallback.
- **Kontext & PR #10:** Větev `fix/security-fail-closed-permission`, Pull Request #10.
- **Výchozí stav & Původní zranitelnost:**
  Prisma Proxy v `src/db/prisma.ts` pohlcovalo veškeré výpadky připojení k PostgreSQL. Jakýkoliv dotaz na libovolný model pak vracel lokální instanci `dummyModel`, obsahující například ID `dummy-1234-uuid`. To způsobovalo, že middlewary pro ověřování oprávnění (jako `requirePermission`) vyhodnotily tento dummy objekt jako existující oprávnění a vpustily útočníka k chráněnému API, čímž vznikla P0 FAIL-OPEN zranitelnost. Následný blacklist `SECURITY_MODELS` byl navíc nedostatečný, protože neřešil zápisové metody, `$transaction`, raw SQL a chyběly mu citlivé modely.
- **Důvody pro zamítnutí Blacklistu (`SECURITY_MODELS`):**
  Následná analýza a CodeRabbit re-review odhalily, že blacklist přístup (`SECURITY_MODELS`) nebyl architektonicky dostatečný:
  1. *Chybějící modely:* Nezahrnoval `consent`, `legalSyncAudit`, `legalAct`, `legalActVersion`, `userCase` a desítky dalších doménových/auditních entit.
  2. *Write Simulation Risk:* `dummyModel` simuloval operace `create`, `update`, `upsert`, `delete`, čímž vytvářel falešný dojem úspěšného zápisu při nedostupné DB.
  3. *Transaction Bypass:* Metoda `$transaction` při výpadku DB spouštěla callback lokálně a předávala do něj samotnou Proxy `prisma`, čímž docházelo k falešným potvrzením transakcí a zápisů.
  4. *Raw SQL Risk:* Raw SQL operace (`$queryRaw`, `$executeRaw`) nebyly zachyceny blacklistem.
  5. *Náchylnost na chyby:* Přidání nového modelu do `schema.prisma` by bylo automaticky vystaveno fail-open chování, pokud by jej vývojář opomněl zapsat do blacklistu.
- **Nová architektura: Explicitní Whitelist (`SAFE_CONTENT_FALLBACK_MODELS`) & Read-Only Fallback (`SAFE_READ_OPERATIONS`):**
  - Nastaveno základní pravidlo: **DEFAULT = FAIL-CLOSED**.
  - Fallback je povolen VÝHRADNĚ pro explicitně schválené CMS/UI/Content modely:
    `['page', 'pageSection', 'category', 'article', 'faq', 'navigationItem', 'mediaContent', 'media', 'contentString', 'theme', 'stringTheme', 'themeVariable', 'module', 'moduleSetting']`.
  - Fallback je povolen VÝHRADNĚ pro bezpečné READ operace: `findUnique`, `findUniqueOrThrow`, `findFirst`, `findFirstOrThrow`, `findMany`, `count`, `aggregate`, `groupBy`.
  - **Zákaz WRITE simulace:** WRITE operace (`create`, `update`, `upsert`, `delete`, `createMany`, `updateMany`, `deleteMany`) u libovolného modelu při nedostupné DB okamžitě vyhazují výjimku `Databáze je momentálně nedostupná. Zápisové a nepodporované operace nelze simulovat.` (žádný fake success).
  - Všechny ostatní modely (autentizace, autorizace, RBAC, spisy, účastníci, děti, rozsudky, souhlasy, audity, e-Sbírka synchronizace) při nedostupnosti DB okamžitě vyhodí výjimku `Databáze je momentálně nedostupná.`.
  - `$transaction` ochrana: Pokud není dostupný reálný PrismaClient, `$transaction` vyhodí výjimku a callback NIKDY nespustí.
  - RAW SQL ochrana: `$queryRaw`, `$queryRawUnsafe`, `$executeRaw`, `$executeRawUnsafe` při nedostupné DB nikdy nepoužijí dummy fallback a vyhodí výjimku.
- **Dotčené soubory:**
  - `src/db/prisma.ts`
  - `src/services/complianceService.ts`
  - `src/services/settingsService.ts`
  - `tests/prisma-fail-closed.test.ts`
  - `scripts/test-runner.js`
  - `docs/audit/AUDIT_2026-08-25_P0_AUTHORIZATION_BYPASS.md`
- **Provedené testy & Výsledky (12/12 PASS v `tests/prisma-fail-closed.test.ts`):**
  - **A) DB unavailable + page.findFirst()**: PASS (bezpečný READ fallback, vrátí null).
  - **B) DB unavailable + page.findMany()**: PASS (bezpečný READ fallback, vrátí []).
  - **C) DB unavailable + page.create()**: PASS (vyhodí exception, WRITE operace striktně fail-closed).
  - **D) DB unavailable + page.update()**: PASS (vyhodí exception, WRITE operace striktně fail-closed).
  - **E) DB unavailable + page.upsert()**: PASS (vyhodí exception, WRITE operace striktně fail-closed).
  - **F) DB unavailable + page.delete()**: PASS (vyhodí exception, WRITE operace striktně fail-closed).
  - **G) DB unavailable + rolePermission.findFirst()**: PASS (vyhodí exception, bezpečnostní model fail-closed).
  - **H) DB unavailable + consent.create()**: PASS (vyhodí exception, doménový/compliance model fail-closed).
  - **I) DB unavailable + legalAct.upsert()**: PASS (vyhodí exception, legislativní model fail-closed).
  - **J) DB unavailable + $transaction()**: PASS (vyhodí exception, callback nebyl spuštěn).
  - **K) DB unavailable + $queryRaw()**: PASS (vyhodí exception).
  - **L) DB unavailable + $executeRaw()**: PASS (vyhodí exception).
- **Další testy projektu:**
  - `Static & Security Integrity (PWA, Disclaimers, Auth, RBAC)`: PASS (5/5).
  - `Security & Audit Integrations (run_security_tests.cjs)`: PASS.
  - `State Administration API Hub (P1 & P2 Connectors)`: PASS (7/7).
  - `Mapa Subjektů & Registr Integration`: PASS (17/17).
  - `AI Extractor Local PDF Fallback & Deterministic Extraction`: PASS (20/20).
  - `Branding API & Secure SVG Sanitization`: PASS (8/8).
  - `Branding API Integration`: PASS (2/2).
- **Regresní analýza:**
  - *Identifikovaný test:* `Care Occurrence Engine & Calendar Integration` (2 subtesty v `applyJudgmentToCase`) a `Judgment AI Extractor -> Case Persistence Integration` (2 subtesty).
  - *Příčina:* Tyto testy předpokládaly globální dummy fallback pro model `case` a metodu `$transaction` při chybějící PostgreSQL databázi. Po zavedení striktního fail-closed principu je toto chování zablokováno.
  - *Doporučené řešení:* Převedení unit testů na izolované mocky Prisma klienta (např. `vitest-mock-extended`), nikoli uvolnění bezpečnostní fail-closed ochrany v produkčním kódu.
- **Bezpečnostní verdikt:** PASS (Fail-closed architektura je kompletní, blacklist byl plně nahrazen whitelist modelem, WRITE simulace byla plně odstraněna, $transaction i raw dotazy jsou zabezpečeny).
- **Merge verdikt:** DO NOT MERGE AUTOMATICALLY (Větev připravena pro CodeRabbit audit a uživatelskou kontrolu na PR #10).