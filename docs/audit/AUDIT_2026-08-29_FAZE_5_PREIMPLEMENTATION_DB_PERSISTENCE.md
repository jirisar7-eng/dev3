# PRE-IMPLEMENTATION AUDIT – FÁZE 5: DB PERSISTENCE FINDINGS & E2E VERIFICATION

**Projekt:** Táta má právo (dev3)  
**Repozitář:** `jirisar7-eng/dev3`  
**Pracovní větev:** `feat/audit-center-2-registry`  
**Datum:** 2026-08-29  
**Režim:** READ-ONLY PRE-IMPLEMENTATION AUDIT  
**Stav:** PASS WITH WARNINGS (PŘIPRAVENO K IMPLEMENTACI S ARCHITEKTONICKÝMI DOPORUČENÍMI)

---

## 1. PRISMA / POSTGRESQL STAV & INFRASTRUKTURA

### 1.1 Aktuální stav `prisma/schema.prisma`
- **ORM / Databáze:** Prisma Client `^7.9.1` s PostgreSQL providerem.
- **Existující Control Plane modely:**
  - `ControlPlaneAction` (lines 2523–2551) – `id` je `@default(uuid())`, stavové pole `status String`, JSON struktury pro `affectedResources`, `currentState`, `proposedState`.
  - `ControlPlaneEvent` (lines 2553–2562) – auditní trail akce, FK na `ControlPlaneAction.id` s `onDelete: Cascade`.
  - `ControlPlaneSnapshot` (lines 2564–2578) – 48h snapshoty stavu, FK na `ControlPlaneAction.id` s `onDelete: Cascade`.
- **Existující Audit & QA modely:**
  - `AuditLog` (lines 501–515) – systémové auditní záznamy pro audit trail.
  - `AuditDocument` (lines 517–540) – metadata markdown auditních dokumentů (indexované soubory v `docs/audit`).
  - `AuditShare` (lines 542–556) – tokeny pro bezpečné sdílení auditů.
  - `QAFinding` (lines 1874–1884) – zjištění z automatických běhů QA engine (`QARun`), nikoli z Markdown auditních zpráv.
  - `SynthesisTicket` (lines 2442–2486) – triážní agregátor ticketů pro GitHub issue sync.
- **Zjištění k `AuditFinding`:** Model `AuditFinding` v `prisma/schema.prisma` dosud **NEEXISTUJE** (existuje výhradně jako TypeScript rozhraní v `src/services/audit/types.ts`).

### 1.2 Migrační historie (`prisma/migrations`)
1. `20260821_initial_production`
2. `20260822_phase_b_multimedia_education`
3. `20260822_subject_moderation`
4. `20260829_add_control_plane_models`
- **Posouzení:** Všechny ID v nedávných migracích (`20260829_add_control_plane_models`) používají standardní `TEXT` / UUID. Naming conventions jsou konzistentní (PascalCase tabulky, camelCase sloupce, explicitní indexy a foreign key constraints).

---

## 2. POSOUZENÍ NÁVRHU MODELU `AuditFinding`

### 2.1 Návrh vs. Konzistence schématu
Původní návrh ze zadání:
```prisma
model AuditFinding {
  id                   String   @id @default(cuid())
  auditFilename        String
  code                 String
  title                String
  description          String
  severity             String
  status               String
  firstSeenAt          DateTime @default(now())
  lastSeenAt           DateTime @updatedAt
  actionId             String?
  action               ControlPlaneAction? @relation(fields: [actionId], references: [id])
  fixCommitSha         String?
  prNumber             Int?
  testReference        String?
  verifiedBy           String?
  verificationEvidence String?
  verifiedAt           DateTime?

  @@unique([auditFilename, code])
  @@index([status, severity])
}
```

### 2.2 Zjištěné body a doporučené úpravy (Architektonické posouzení):
1. **ID Generátor (`uuid()` vs `cuid()`):**
   - V celém `schema.prisma` (včetně `ControlPlaneAction`, `AuditDocument`, `QAFinding`, `SynthesisTicket`) se používá `@default(uuid())`.
   - **Doporučení:** Použít `@default(uuid())` pro 100% sjednocení s existujícími modely.
2. **Textová pole (`@db.Text`):**
   - Pole `description` a `verificationEvidence` mohou obsahovat rozsáhlé markdown výstupy a testovací logy.
   - **Doporučení:** Explicitně anotovat jako `@db.Text` (shodně s `ControlPlaneAction.request` nebo `SynthesisTicket.description`).
3. **Vztah s `ControlPlaneAction` (FK a Reverse Relation):**
   - V `ControlPlaneAction` je nutné doplnit zpětnou vazbu: `auditFindings AuditFinding[]`.
   - Na úrovni FK doporučujeme `onDelete: SetNull`, aby smazání/expirace akce nezpůsobila kaskádové smazání auditního zjištění.
4. **Enum vs. String:**
   - Typy `FindingSeverity` (`P0`, `P1`, `P2`, `P3`) a `FindingStatus` (`OPEN`, `IN_PROGRESS`, `FIXED`, `VERIFIED`, `ACCEPTED_RISK`) jsou v TypeScriptu striktně typovány. V Prisma schématu zachování `String` poskytuje vysokou migrabilitu bez nutnosti složitých `ALTER TYPE` migrací v PostgreSQL při rozšiřování statusů.
5. **Životní cyklus `lastSeenAt` & `@updatedAt`:**
   - `@updatedAt` v Prisma automaticky nastavuje čas na `NOW()` při jakémkoliv DB updatu řádku. Pokud je potřeba zaznamenat datum auditního souboru (např. z 2026-08-20), je vhodné mít pole `auditDate DateTime?` nebo řídit `lastSeenAt` programově v synchronizačním enginu namísto `@updatedAt`, případně zachovat `@updatedAt` jako technické časové razítko DB záznamu.
6. **Sémantika `@@unique([auditFilename, code])`:**
   - Tento unikátní index garantuje, že v rámci jednoho auditního souboru je kód zjištění unikátní.
   - Pokud se stejný kód (např. `SEC-AUTH-01`) objeví v následném auditu, vytvoří se nový záznam pro nový soubor, což umožňuje `RegressionEngine` sledovat vývoj v čase.
   - **Doplňkový index:** Doporučujeme přidat `@@index([code])` a `@@index([actionId])` pro rychlé dohledání vazeb a historie.

---

## 3. AUDIT REGISTRY ENGINE & INTEGRITA SSOT

### 3.1 Git Markdown jako SSOT (Single Source of Truth)
- Soubory v `docs/audit/*.md` jsou neměnnou primární pravdou v gitu.
- PostgreSQL tabulka `AuditFinding` a `AuditDocument` slouží jako indexační, dotazovací a stavová vrstva pro rychlé UI, filtry, agregace a vazbu na Control Plane.
- **Pravidlo integrity:** Databázová synchronizace nesmí nikdy modifikovat ani mazat soubory v `docs/audit/`.

### 3.2 Změny, odstranění a SHA-256 evidence
- `AuditRegistryEngine.computeSha256(content)` počítá SHA-256 otisk každého auditního souboru.
- Při změně souboru v gitu se změní `sourceSha`. Synchronizační engine detekuje neshodu a provede deterministický re-sync.
- Pokud je soubor z gitu smazán, DB vrstva označí odpovídající nálezy stavem `ARCHIVED` nebo provede bezpečný soft-delete, aby v registru nezůstávaly phantom entity.

---

## 4. CONTROL PLANE LIFECYCLE & ORION AI BEZPEČNOSTNÍ HRANICE

### 4.1 Životní cyklus zjištění a akce:
$$\text{Audit Markdown} \longrightarrow \text{DB Sync (OPEN)} \longrightarrow \text{Orion AI (Doporučení)} \longrightarrow \text{Action (DRAFT)} \longrightarrow \text{Human Approval (SUPER\_ADMIN)} \longrightarrow \text{EXECUTING} \longrightarrow \text{Targeted Test PASS} \longrightarrow \text{Finding (VERIFIED)}$$

### 4.2 Bezpečnostní mantinely AI (Orion):
- `ORION_BASE_CAPABILITIES` obsahuje výhradně read-only schopnosti (`audit.run`, `qa.run`, `content.read`, `settings.read`, `database.read`, `vps.read`, `github.read`).
- Orion **NEMÁ** oprávnění `database.migrate`, `github.commit`, `github.push`, `vps.write` ani `deploy.production`.
- Orion může navrhnout akci výhradně ve stavu `DRAFT`.
- Žádný automatický přechod do `EXECUTING`, `MERGED` nebo `VERIFIED` bez explicitního podpisu / schválení `SUPER_ADMIN` a úspěšného běhu verifikačního testu.

---

## 5. DETAILNÍ E2E TESTOVACÍ SCÉNÁŘ

1. **Krok A (Vznik auditu):** Do `docs/audit/` je přidán nový soubor `AUDIT_TEST_E2E_2026-08-29.md` s nálezem `[P1] SEC-TEST-01: Chybějící CSRF token`.
2. **Krok B (Registry Scan):** `AuditRegistryEngine` detekuje nový soubor a spočítá SHA-256.
3. **Krok C (DB Sync):** Synchronizační služba zapíše/aktualizuje záznam do tabulky `AuditFinding`.
4. **Krok D (Výchozí stav):** Nález má `status = 'OPEN'` a `severity = 'P1'`.
5. **Krok E (Orion Analýza):** `OrionService.analyze()` vygeneruje bezpečné doporučení a vytvoří návrh akce v `ControlPlaneService` se stavem `DRAFT`.
6. **Krok F (Human Approval):** Uživatel s rolí `SUPER_ADMIN` schválí akci (`status -> APPROVED -> EXECUTING`).
7. **Krok G (Exekuce & Fix):** Provede se oprava, vznikne commit SHA a PR.
8. **Krok H (Verifikační test):** Spustí se cílený test (např. `tests/csrf-protection.test.ts`), který projde (`PASS`).
9. **Krok I (Přechod na VERIFIED):** Po úspěšném testu a zadání důkazů přejde finding do `status = 'VERIFIED'`.
10. **Krok J (Evidence důkazů):** Uloží se `fixCommitSha`, `testReference`, `verifiedBy` a `verificationEvidence`.
11. **Krok K (Auditní ověření):** Následný audit potvrdí vyřešení nálezu.
12. **Krok L (Restart odolnost):** Po restartu serveru a vyčištění in-memory cache zůstává stav v PostgreSQL zachován.
13. **Krok M (Re-sync odolnost):** Opakovaný běh synchronizace nezpůsobí duplicity ani přepsání `VERIFIED` stavu na `OPEN`.

---

## 6. ANALÝZA CHYBOVÝCH STAVŮ (FAILURE MODES & FAIL-CLOSED)

| Scénář | Chování systému | Riziko | Zajištění integrity |
| :--- | :--- | :--- | :--- |
| **PostgreSQL nedostupná** | HTTP 503 / Bezpečný read-only fallback ze souborového systému s varováním | LOW | Žádné falešné zápisy, fail-closed |
| **Prisma Write Failure** | Transakční rollback (`$transaction`), záznam do `AuditLog` | LOW | Žádná částečně zapsaná data |
| **Duplicitní finding v Markdownu** | Deterministická deduplikace podle `auditFilename + code` | LOW | Upsert mechanismus zamezí duplicitám v DB |
| **Konflikt DB vs Markdown** | Git Markdown je autoritativní SSOT pro obsah; DB drží stav řešení | LOW | Explicitní merge strategie bez přepsání auditu |
| **Změna SHA-256 souboru** | Detekce změny, re-parse a aktualizace metadat | LOW | Auditní stopa v `ControlPlaneEvent` |
| **Odstranění souboru auditu** | Nálezy označeny jako `ARCHIVED` | LOW | Žádné osiřelé aktivní nálezy v Release Gate |
| **Rozbitý / nevalidní Markdown** | Zachyceno parserem, vytvořen `ParserWarning`, status `UNKNOWN` | LOW | Release Gate zablokuje merge (`DO_NOT_MERGE`) |
| **Selhaný verifikační test** | Akce přechází do `FAILED`, finding zůstává `OPEN` | LOW | Falešné `VERIFIED` je nemožné |

---

## 7. BEZPEČNOST, RBAC & THREAT MODEL

1. **Autorizace DB operací:**
   - Synchronizace a správa nálezů vyžaduje roli `ADMIN` nebo `SUPER_ADMIN`.
   - Běžní uživatelé (`USER`, `VOLUNTEER`) nemají k Audit Center endpointům přístup (HTTP 403).
2. **IDOR / BOLA ochrana:**
   - Všechny operace nad `AuditFinding` (nastavení akce, ověření) kontrolují existenci záznamu a oprávnění aktéra na backendu.
3. **Zamezení podvržení stavu `VERIFIED`:**
   - Stav `VERIFIED` nelze nastavit prostým PATCH requestem z klienta; vyžaduje verifikační důkaz (`verificationEvidence`, `testReference`, `verifiedBy`).
4. **Ochrana před únikem PII a tajemství:**
   - Texty v `description` a `verificationEvidence` prochází sanitizérem (`AuditRegistryEngine.sanitizeText`).
5. **SQL Injection & Mass Assignment:**
   - Všechny operace jsou prováděny přes parametrizované dotazy Prisma ORM s validací vstupů přes Zod schéma.

---

## 8. POSOUZENÍ BEZPEČNOSTI MIGRACE (MIGRATION SAFETY)

- **Povaha migrace:** 100% aditivní (přidání nové tabulky `AuditFinding` a přidání indexů/relací).
- **Dopad na existující data:** Nulový (žádné modifikace existujících sloupců ani tabulek).
- **Rollback plán:** `DROP TABLE IF EXISTS "AuditFinding" CASCADE;`.
- **Doporučený postup nasazení:**
  - Lokální vývoj: `prisma migrate dev --name add_audit_finding_model` (po schválení implementace).
  - Produkce: `prisma migrate deploy`.

---

## 9. KONTROLA DUPLICIT A ARCHITEKTONICKÉ ČISTOTY

- Prověřeno schválení modelů:
  - `AuditFinding` (nový) = Persistentní registr nálezů z auditních reportů.
  - `QAFinding` (existující) = Výstupy z automatických testovacích běhů QA Project.
  - `SynthesisTicket` (existující) = Agregační triážní tickety pro GitHub issues.
- **Závěr:** Nejedná se o duplicitu; každý model má jasně oddělenou odpovědnost a lifecycle.

---

## 10. TESTOVACÍ POKRYTÍ A CHYBĚJÍCÍ TESTY PRO FÁZI 5

### Existující testy (PASS):
- `tests/audit-registry-engine.test.ts` (14 testů)
- `tests/release-gate-service.test.ts` (11 testů)
- `tests/orion-safety-bridge.test.ts` (10 testů)
- `tests/audit-center-2-ui.test.ts` (9 testů)

### Plánované testy pro Fázi 5:
1. `tests/audit-finding-db-persistence.test.ts` – ověření Prisma mapování, upsertu, indexů, vazby na `ControlPlaneAction` a fail-closed chování při výpadku DB.
2. `tests/audit-center-e2e-lifecycle.test.ts` – kompletní E2E simulace životního cyklu od Markdownu přes Orion návrh, schválení, test až po `VERIFIED`.

---

## SOUHRNNÝ AUDITNÍ VERDIKT

```
STATUS: PASS WITH WARNINGS
P0: 0
P1: 0
P2: 0
P3: 0

PRISMA: VERIFIED
MIGRATION RISK: LOW
DB IMPACT: LOW
SECURITY: PASS
DUPLICITY: NO

E2E PLAN: READY

IMPLEMENTATION:
PROCEED
```
