# AUDIT: VPS Diagnostic Bridge -> Notion Integration (DEV3)

- **Datum a čas:** 2026-09-03T12:18:00Z (3. září 2026, 14:18 CET)
- **Název úkolu:** Implementace bezpečného read-only nástroje „VPS Diagnostic Bridge → Notion“ (`vps-report`)
- **Prostředí:** DEV3_VPS / Synthesis Hub / AI Studio Sandbox
- **Status:** PASS (Všechny testy a statické kontroly úspěšné)
- **Verifikace:** 9/9 unit & integration testů PASS, TypeScript lint (`tsc --noEmit`) PASS, Vite build PASS.

---

## 1. CÍL

1. Vytvořit jednotný příkaz `vps-report` (a `npm run vps-report`).
2. Provést striktně předem definovanou read-only diagnostiku VPS / DEV3 prostředí:
   - Datum a čas (ISO + formátovaný CET čas)
   - Hostname / VPS identifikace
   - Uptime (sekundy a čitelný formát D/H/M/S)
   - Kernel / OS architektura a verze
   - Disková kapacita (`df -h /` bezpečně přes `spawnSync`)
   - RAM paměť (celková, využitá, volná, procentuální vytížení)
   - Docker kontejnery a jejich stav / restarty (read-only GET dotazy)
   - PostgreSQL dostupnost a latence v ms
   - Prisma migrace (počet lokálních migrací v `prisma/migrations`, aplikované vs. neaplikované v `_prisma_migrations`)
   - Git větev, commit SHA, čistota working tree a sanitizovaný remote URL
   - DEV3 `/api/health` stav a odezva
   - Caddy HTTPS reverzní proxy a TLS hlavičky
   - Důležité systémové služby (MinIO S3, Mailcow)
   - Poslední relevantní errory a varování z aplikačních logů
3. Výstup automaticky sanitizovat od hesel, tokenů, API klíčů, JWT, PII (Czech rodné číslo, emaily) a unredacted secretů.
4. Výsledek uložit přes existující Notion integraci do „DEV3 – Audit Knowledge Base“ (nebo odpovídající nakonfigurované Notion databáze/stránky).
5. Zachovat Zero Trust / Least Privilege, striktně nulové mutační příkazy, žádné restarty a fail-safe fallback v prostředí bez Notion klíče.
6. Výstup v Notion strukturovat tak, aby ho mohl AI agent přímo číst a strojově analyzovat (včetně kanonického JSON bloku).

---

## 2. VÝCHOZÍ STAV

- V projektu existoval `InfrastructureAuditService` s metodami pro audit Dockeru, Postgresu, Caddy, MinIO, Mailcow a logů.
- V projektu existoval `NotionHandoffService` s fail-closed kontrolou `scanForSecrets` a sanitizací textu v `src/services/qa/ai/sanitizer.ts`.
- Chyběl však jednotný bridge/reportér integrující inspekci disku, Git repozitáře, detailní stav Prisma migrací a generování strukturovaného výstupu optimalizovaného pro AI agenty do Notion.
- Chyběl CLI příkaz `vps-report` v `package.json` a systémový alias pro příkazovou řádku.

---

## 3. PROVEDENÉ ZMĚNY

1. **Typová definice (`src/types/vpsDiagnostic.ts` & `src/types/index.ts`):**
   - Vytvořen ucelený model `VpsDiagnosticReport`, `VpsHostTelemetry`, `VpsDockerTelemetry`, `VpsDatabaseTelemetry`, `VpsPrismaMigrationsTelemetry`, `VpsGitTelemetry`, `VpsWebAndServicesTelemetry`, `VpsLogsTelemetry`, `VpsDiagnosticFinding`, `VpsSecurityAudit` a `VpsNotionPushResult`.
   - Exportováno do kořenových typů v `src/types/index.ts`.

2. **Diagnostický a integrační engine (`src/services/audit/vpsDiagnosticBridge.ts`):**
   - Implementován `VpsDiagnosticBridge` s kompletním sběrem telemetrie:
     * `inspectDisk()`: Bezpečný read-only dotaz na `df -h /` bez shell interpolace.
     * `inspectGit()`: Introspekce aktuální větve, commit SHA, stavu working tree a sanitizace remote URL s fallbackem pro kontejner.
     * `inspectPrismaMigrations()`: Introspekce adresáře `prisma/migrations`, detekce migrací a čtení z `_prisma_migrations` (bez spouštění migrací).
     * `collectDiagnosticReport()`: Paralelní orchestrace všech inspekčních subsystémů, stanovení statusu (`PASS`, `PASS_WITH_WARNINGS`, `FAIL`) a výpočet sha256 otisku reportu.
     * `sanitizeReport()`: Dvoustupňová sanitizace (transformace a fail-closed scan).
     * `pushReportToNotion()`: Formátování bloků pro Notion s důrazem na čitelnost pro člověka i AI agenta (blok `code` s `language: "json"` obsahující strojově parsovatelná data, callouty, odrážky a tabulky). Fail-safe chování při absenci `NOTION_API_KEY`.
     * `generateCliSummary()`: Formátovaný ASCII výstup pro konzoli a logy.

3. **Bezpečnostní rozšíření sanitizéru (`src/services/qa/ai/sanitizer.ts`):**
   - Přidána regex detekce a filtrace URL embedded credentials (`protocol://user:password@host` -> `protocol://user:[REDACTED_SECRET]@host`).

4. **CLI skript a wrapper (`scripts/vpsReport.ts` & `scripts/vps-report.sh`):**
   - `scripts/vpsReport.ts`: Spouštěcí TypeScript CLI skript s podporou flagů `--json`, `--local-only`, `--target-url`, `--port`, `--help`.
   - `scripts/vps-report.sh`: Robustní bash wrapper s dynamickým dohledáním reálné cesty symlinku.
   - Symlink `/usr/local/bin/vps-report` směřující na wrapper, umožňující přímé spuštění `vps-report` odkudkoliv v terminálu.

5. **Package.json konfigurace (`package.json`):**
   - Přidán skript `"vps-report": "tsx scripts/vpsReport.ts"`.

6. **Automatizované testy (`tests/vps-diagnostic-bridge.test.ts` & `scripts/test-runner.js`):**
   - Vytvořena testovací sada s 9 testy pokrývajícími všechny klíčové požadavky.
   - Zařazeno do centrálního `scripts/test-runner.js`.

---

## 4. DOTČENÉ SOUBORY

- `src/types/vpsDiagnostic.ts` (nový soubor)
- `src/types/index.ts` (export nového typu)
- `src/services/audit/vpsDiagnosticBridge.ts` (nový soubor)
- `src/services/qa/ai/sanitizer.ts` (úprava regex filtru URL credentials)
- `scripts/vpsReport.ts` (nový soubor)
- `scripts/vps-report.sh` (nový soubor)
- `package.json` (přidán skript "vps-report")
- `tests/vps-diagnostic-bridge.test.ts` (nový soubor)
- `scripts/test-runner.js` (registrace nového testu)
- `docs/audit/AUDIT_2026-09-03_VPS_DIAGNOSTIC_BRIDGE_NOTION.md` (tento audit)

---

## 5. DB A API ZMĚNY

- **Databázové schéma:** ŽÁDNÉ ZMĚNY. Zůstává striktně zachováno.
- **Databázové mutace:** ŽÁDNÉ. Všechny operace jsou 100% read-only (`SELECT ...`).
- **Nové externí API:** ŽÁDNÉ. Využívá se výhradně existující konfigurace `NOTION_API_KEY` / `NOTION_TOKEN` a `NOTION_DATABASE_ID`.

---

## 6. BEZPEČNOST A ZERO TRUST

- **Striktní Read-Only:** Žádné `rm`, `kill`, `restart`, `prune`, `ALTER`, `UPDATE`, `DELETE`, `prisma migrate dev` ani mutační API požadavky.
- **Fail-Closed Secret Filter:** Pokud by v datech zůstal unredacted secret (např. uniklý JWT token nebo heslo), `NotionHandoffService.scanForSecrets` výstup okamžitě zablokuje s chybou `FAILED_BLOCKED` a status reportu označí jako `FAIL`.
- **0-PII Sanitizace:** Všechny texty, URL a parametry jsou před odesláním či výpisem prohnány přes `sanitizeText` (redakce rodných čísel, emailů, hesel, JWT, API klíčů a URL autorizací).
- **Graceful Unconfigured Fallback:** Při absenci Notion API tokenu nástroj nehavaruje, nevytváří dočasné nezabezpečené soubory a bezpečně vygeneruje sanitizovaný lokální výstup s hlášením `LOCAL_REPORT_ONLY_NOTION_UNCONFIGURED`.

---

## 7. TESTOVÁNÍ A VÝSLEDKY

### Test suite: `tests/vps-diagnostic-bridge.test.ts`
1. `Uptime formatting produces clean, human-readable strings` -> **PASS**
2. `Disk inspection is strictly read-only and handles container filesystems safely` -> **PASS**
3. `Git inspection runs read-only and redacts auth tokens from remote URLs` -> **PASS**
4. `Prisma migration inspection reads migration directory without mutating state` -> **PASS**
5. `Diagnostic collector gathers complete, structured telemetry across all required domains` -> **PASS**
6. `Sanitizer and secret scanner enforce Fail-Closed Zero-Trust security` -> **PASS**
7. `Fail-safe Notion behavior when Notion credentials are unconfigured` -> **PASS**
8. `CLI Summary formatting produces clear, structured text report` -> **PASS**
9. `CLI script scripts/vpsReport.ts executes with --help and --local-only` -> **PASS**

**Výsledek:** 9 testů, 9 PASS, 0 FAIL.
**Statická analýza (`npm run lint` / `tsc --noEmit`):** PASS (0 chyb).
**Vite build (`compile_applet`):** PASS.
**CLI ověření (`vps-report --help` & `npm run vps-report -- --local-only`):** PASS.

---

## 8. CHYBY A ŘEŠENÍ

- **Problém:** V `sanitizeInputData` byla klíčová slova obsahující `secret` nahrazována za `[REDACTED_SECRET]`. Pole `securityAudit.secretsDetected` bylo proto přepsáno na řetězec `"[REDACTED_SECRET]"`.
  - **Řešení:** Pole v `VpsSecurityAudit` bylo přejmenováno na `unredactedTokensFound: boolean`.
- **Problém:** Databázový string typu `postgres://user:password@host` nebyl původním sanitizérem zachycen, pokud nebyl obalen uvozovkami ve formátu JSON klíče.
  - **Řešení:** V `src/services/qa/ai/sanitizer.ts` byl přidán regulární výraz `URL_CREDENTIALS_REGEX`, který spolehlivě rediguje hesla v URL spojeních.
- **Problém:** Symlink `/usr/local/bin/vps-report` nalezl chybný relativní adresář kvůli vyhodnocení `${BASH_SOURCE[0]}`.
  - **Řešení:** Ve skriptu `scripts/vps-report.sh` byl implementován plnohodnotný resolver symlinků přes `readlink -f`.

---

## 9. RIZIKA A TODO

- **Rizika:** V izolovaném kontejnerovém prostředí bez mountu `/var/run/docker.sock` nebo bez přímého síťového spojení s PostgreSQL report korektně a bezpečně reportuje `PASS_WITH_WARNINGS` nebo `FAIL` s přesnou lokalizací chybějící služby. Žádné riziko poškození dat či stability.
- **TODO pro produkční nasazení DEV3:**
  - Na DEV3 VPS v `.env` zajistit nastavení proměnných `NOTION_API_KEY` a `NOTION_AUDIT_DATABASE_ID` pro automatický zápis do Notion databáze „DEV3 – Audit Knowledge Base“.
  - Nastavit cron úlohu na DEV3 VPS pro periodické spouštění `vps-report` (např. 1x denně nebo po každém deploymentu).

---

## 10. VÝSLEDNÝ STAV

- **Implementace:** DOKONČENO (IMPLEMENTED, TESTED, VERIFIED)
- **Git:** V kontejneru izolované prostředí (virtuální git context)
- **Definition of Done:** SPLNĚNO (kód vytvořen, bezpečnost ověřena, 0 secrets, 9/9 testů prošlo, typecheck prošel, build prošel, audit vytvořen).
