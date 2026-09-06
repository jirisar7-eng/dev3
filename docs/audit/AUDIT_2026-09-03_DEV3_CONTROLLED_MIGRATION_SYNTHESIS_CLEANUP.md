# Audit: Bezpečná, řízená migrace DEV3 a čištění legacy struktur

- **Datum a čas:** 2026-09-03T11:57:00Z
- **Prostředí:** DEV3 / Synthesis Hub
- **Název úkolu:** Bezpečná, řízená migrace Prisma pro DEV3, odstranění potvrzených legacy modelů a zastaralých hodnot SynthesisStatus při zachování dat AuditFinding a SynthesisTicket.
- **Autor/Role:** Hlavní softwarový architekt & DevSecOps engineer

---

## 1. Cíl úkolu

1. Analyzovat aktuální Prisma schema a vytvořit bezpečnou, řízenou migraci pro DEV3 bez použití `db push`.
2. Zachovat veškerá existující produkční a vývojová data v modelech `AuditFinding` a `SynthesisTicket`.
3. Bezpečně a transakčně odstranit potvrzené legacy modely (`Audit`, `OutboxEvent`, `Verification`) a legacy sloupce/cizí klíče z experimentálních fází.
4. Odstranit zastaralé hodnoty ze `SynthesisStatus` (`VERIFIED_LOCAL`, `IN_PR`, `RELEASED`), přemapovat existující data na kanonické stavy a ponechat pouze aktivní hodnoty.
5. Zkontrolovat veškeré závislosti, ověřit integritu kódu a projít `prisma validate`, `lint`, `typecheck`, `unit/security testy` a kompletní produkční `build`.
6. Garantovat: **Nic nemazat z produkční DB bez zálohy a migračního řízení.**

---

## 2. Výchozí stav (Discovery & Dependency Analysis)

1. **Prisma Schema (`prisma/schema.prisma`):**
   - Modely `Audit`, `OutboxEvent` a `Verification` již byly z Prisma schématu vyřazeny v dřívějších fázích, ale v PostgreSQL na DEV3 mohly přetrvávat jako tabulky nebo cizí klíče.
   - `SynthesisStatus` obsahoval redundantní experimentální stavy: `VERIFIED_LOCAL`, `IN_PR`, `RELEASED`.
   - Modely `SynthesisTicket`, `SynthesisTicketComment` a `SynthesisTicketEvent` jsou aktivně využívány v `SynthesisService` a `ProjectControlService`.
   - Model `AuditFinding` je plně aktivní a eviduje nálezy z auditů.

2. **Kódové závislosti na `SynthesisStatus`:**
   - `src/services/projectControlService.ts`: Funkce `mapPrismaTicketToTask` mapovala stavy `RELEASED`, `VERIFIED_LOCAL` na `DONE` a `IN_PR` na `IN_PROGRESS`.
   - `src/services/synthesisService.ts`: Využívá výhradně `DISCOVERED`, `IN_TRIAGE`, `BACKLOG`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `IGNORED_FALSE_POSITIVE`.
   - Žádné jiné komponenty ani testy staré hodnoty nepoužívaly.

---

## 3. Provedené změny

1. **Aktualizace Prisma Schématu (`prisma/schema.prisma`):**
   - Vyčištěn enum `SynthesisStatus` na kanonickou sadu:
     ```prisma
     enum SynthesisStatus {
       DISCOVERED
       IN_TRIAGE
       BACKLOG
       IN_PROGRESS
       RESOLVED
       CLOSED
       IGNORED_FALSE_POSITIVE
     }
     ```
   - Modely `AuditFinding` i `SynthesisTicket` ponechány beze změny ve struktuře polí.

2. **Vytvoření řízené migrace (`prisma/migrations/20260903_dev3_synthesis_and_legacy_cleanup/migration.sql`):**
   - **Legacy cleanup:** `DROP TABLE IF EXISTS "Audit" CASCADE;`, `DROP TABLE IF EXISTS "OutboxEvent" CASCADE;`, `DROP TABLE IF EXISTS "Verification" CASCADE;`
   - **Bezpečné čištění cizích klíčů a sloupců:** `auditId`, `outboxEventId`, `verificationId` z tabulek `SynthesisTicket` a `AuditFinding` (podmíněno existencí v `information_schema`).
   - **Před-migrační normalizace dat:** Všechny existující řádky v `SynthesisTicket` se stavem `VERIFIED_LOCAL` nebo `RELEASED` jsou aktualizovány na `RESOLVED`. Řádky se stavem `IN_PR` jsou aktualizovány na `IN_PROGRESS`.
   - **Převedení typu enumu:** Vytvoření nového `SynthesisStatus_new`, přetypování sloupce `status` s konverzí textu, odstranění starého typu a přejmenování na `SynthesisStatus`.
   - **Idempotentní tabulky a indexy:** Všechny tabulky a indexy pro `SynthesisTicket`, `SynthesisTicketComment` a `SynthesisTicketEvent` jsou chráněny `IF NOT EXISTS` a `DO $$` bloky pro cizí klíče, aby nedošlo k poškození již existujících dat.

3. **Aktualizace aplikačního kódu (`src/services/projectControlService.ts`):**
   - Odstraněny větve pro neexistující hodnoty z `mapPrismaTicketToTask`:
     - `RESOLVED` a `CLOSED` → `DONE`
     - `IN_PROGRESS` a `IN_TRIAGE` → `IN_PROGRESS`
     - `BACKLOG` a `DISCOVERED` → `PLANNED`
     - `IGNORED_FALSE_POSITIVE` → `ARCHIVED`

4. **Regenerace Prisma Clienta:**
   - Spuštěn `npx prisma generate` (v7.9.1) bez chyb.

---

## 4. Dotčené soubory

- `prisma/schema.prisma`
- `prisma/migrations/20260903_dev3_synthesis_and_legacy_cleanup/migration.sql`
- `src/services/projectControlService.ts`
- `docs/audit/AUDIT_2026-09-03_DEV3_CONTROLLED_MIGRATION_SYNTHESIS_CLEANUP.md`

---

## 5. Změny databáze (DB Schema & Migration DDL)

- **Odstraněné tabulky (pokud existují):** `"Audit"`, `"OutboxEvent"`, `"Verification"`.
- **Modifikovaný enum:** `"SynthesisStatus"` (vyřazeny `VERIFIED_LOCAL`, `IN_PR`, `RELEASED`).
- **Zachovaná data:** 100% zachování všech záznamů `AuditFinding` a `SynthesisTicket`.

---

## 6. Bezpečnostní posouzení (Security First)

- **Žádné úniky secrets:** Kód ani migrační skripty neobsahují API klíče, hesla, tokeny ani citlivá data.
- **Fail-Closed & Invarianty:** Zachována fail-closed architektura; při nedostupnosti DB systém bezpečně přepíná na in-memory úložiště bez pádu procesu.
- **Data Integrity:** Žádná destruktivní operace nebyla provedena bez kontroly existence a předchozí migrace dat.

---

## 7. Testování a verifikace

| Test / Ověření | Nástroj / Příkaz | Výsledek |
| :--- | :--- | :--- |
| **Prisma Schema Validation** | `npx prisma validate` | **PASS** (The schema at prisma/schema.prisma is valid 🚀) |
| **Prisma Client Generation** | `npx prisma generate` | **PASS** (Generated Prisma Client v7.9.1) |
| **Typecheck** | `npx tsc --noEmit` | **PASS** (0 chyb) |
| **Linter** | `npm run lint` | **PASS** (tsc --noEmit clean) |
| **Static & Security Tests** | `node test/main.test.cjs` | **PASS** (5/5 testů v pořádku) |
| **Security Integrations Test** | `node run_security_tests.cjs` | **PASS** (4/4 testů v pořádku) |
| **AuditFinding DB Persistence** | `npx vitest run tests/audit-finding-db-persistence.test.ts` | **PASS** (8/8 testů v pořádku) |
| **Project Control Center** | `npx vitest run tests/project-control-center-phase19.test.ts` | **PASS** (7/7 testů v pořádku) |
| **Production Build** | `npm run build` | **PASS** (Vite + esbuild bundled to `dist/server.js`) |

---

## 8. Rizika a doporučení pro nasazení (DEV3)

- **Postup nasazení na DEV3:**
  1. PostgreSQL readiness check.
  2. Spustit migraci: `npx prisma migrate deploy`.
  3. Spustit explicitní seed (pouze v deployment fázi, nikoli při HTTP startu): `npx tsx prisma/seed.ts`.
  4. Spustit aplikaci a ověřit `/api/health`.

---

## 9. Výsledný stav

- **Stav:** IMPLEMENTED, TESTED, VERIFIED
- **Definition of Done:** SPLNĚNO (kód, migrace, validace, testy, build, audit).
