# AUDIT: P0 Authorization Bypass via Prisma Proxy Fallback & Whitelist Architecture Refactor

- **Datum a čas auditu:** 25. 8. 2026
- **Název úkolu:** P0 oprava fail-open bypassu v Prisma Proxy: Přechod z blacklistu na Content-only Whitelist
- **Původní požadavek/cíl:** Zjistit, zda globální DB fallback může způsobit FAIL-OPEN autorizaci, a zajistit striktní FAIL-CLOSED chování pro všechny bezpečnostní, doménové, auditní a transakční operace, zatímco CMS/UI nadále používá bezpečný fallback.
- **Kontext & PR #10:** Větev `fix/security-fail-closed-permission`, Pull Request #10.
- **Výchozí stav & Původní zranitelnost:**
  Prisma Proxy v `src/db/prisma.ts` pohlcovalo veškeré výpadky připojení k PostgreSQL. Jakýkoliv dotaz na libovolný model pak vracel lokální instanci `dummyModel`, obsahující například ID `dummy-1234-uuid`. To způsobovalo, že middlewary pro ověřování oprávnění (jako `requirePermission`) vyhodnotily tento dummy objekt jako existující oprávnění a vpustily útočníka k chráněnému API, čímž vznikla P0 FAIL-OPEN zranitelnost.
- **Důvody pro zamítnutí Blacklistu (`SECURITY_MODELS`):**
  Následná analýza a CodeRabbit re-review odhalily, že blacklist přístup (`SECURITY_MODELS`) nebyl architektonicky dostatečný:
  1. *Chybějící modely:* Nezahrnoval `consent`, `legalSyncAudit`, `legalAct`, `legalActVersion`, `userCase` a desítky dalších doménových/auditních entit.
  2. *Transaction Bypass:* Metoda `$transaction` při výpadku DB spouštěla callback lokálně a předávala do něj samotnou Proxy `prisma`, čímž docházelo k falešným potvrzením transakcí a zápisů.
  3. *Raw SQL Risk:* Raw SQL operace (`$queryRaw`, `$executeRaw`) nebyly zachyceny blacklistem a vracely `null` / dummy funkce.
  4. *Náchylnost na chyby:* Přidání nového modelu do `schema.prisma` by bylo automaticky vystaveno fail-open chování, pokud by jej vývojář opomněl zapsat do blacklistu.
- **Nová architektura: Explicitní Whitelist (`SAFE_CONTENT_FALLBACK_MODELS`):**
  - Nastaveno základní pravidlo: **DEFAULT = FAIL-CLOSED**.
  - Fallback je povolen VÝHRADNĚ pro explicitně schválené CMS/UI/Content modely:
    `['page', 'pageSection', 'category', 'article', 'faq', 'navigationItem', 'mediaContent', 'media', 'contentString', 'theme', 'stringTheme', 'themeVariable', 'module', 'moduleSetting']`.
  - Všechny ostatní modely (autentizace, autorizace, RBAC, spisy, účastníci, děti, rozsudky, souhlasy, audity, e-Sbírka synchronizace) při nedostupnosti DB okamžitě vyhodí výjimku `Databáze je momentálně nedostupná.`.
  - `$transaction` ochrana: Pokud není dostupný reálný PrismaClient, `$transaction` vyhodí výjimku a callback NIKDY nespustí.
  - RAW SQL ochrana: `$queryRaw`, `$queryRawUnsafe`, `$executeRaw`, `$executeRawUnsafe` při nedostupné DB nikdy nepoužijí dummy fallback a vyhodí výjimku.
- **Dotčené soubory:**
  - `src/db/prisma.ts`
  - `docs/audit/AUDIT_2026-08-25_P0_AUTHORIZATION_BYPASS.md`
- **Provedené testy & Výsledky:**
  - `fail-closed security validation`:
    - `$transaction` při výpadku DB: PASS (vyhodí exception, callback nebyl spuštěn).
    - `rolePermission.findFirst()`: PASS (vyhodí exception, requirePermission vrací HTTP 500).
    - `consent.create()`: PASS (vyhodí exception, žádný fake success).
    - `legalSyncAudit.create()`: PASS (vyhodí exception, žádný fake success).
    - `legalAct.upsert()`: PASS (vyhodí exception).
    - `case.findFirst()`: PASS (vyhodí exception).
    - `$queryRaw`: PASS (vyhodí exception).
    - `page.findFirst()` (whitelistovaný model): PASS (vrátí bezpečný dummy model).
  - `AI Extractor Local PDF Fallback & Deterministic Extraction (20 Tests)`: PASS (20/20 tests passed).
  - `Branding API & Secure SVG Sanitization`: PASS (8/8 tests passed).
  - `Branding API Integration`: PASS (2/2 tests passed).
  - `Care Occurrence Engine & Calendar Integration`: 2 subtesty failují z důvodu očekávání dummy fallbacku u modelu `case`/`judgment` v netestovaném in-memory prostředí.
- **Regresní analýza:**
  - *Identifikovaný test:* `Care Occurrence Engine & Calendar Integration` (test `applyJudgmentToCase`).
  - *Příčina:* Test je závislý na produkčním dummy fallbacku a musí být převeden na explicitní mock (`vitest-mock-extended` / mock Prisma klienta), nikoliv oslabením produkční bezpečnosti.
- **Bezpečnostní verdikt:** PASS (Fail-closed architektura je kompletní, blacklist byl plně nahrazen bezpečným whitelist modelem a $transaction i raw dotazy jsou zabezpečeny).
- **Merge verdikt:** WAIT FOR CODERABBIT REVIEW (Čeká se na finální re-review commitu na PR #10).