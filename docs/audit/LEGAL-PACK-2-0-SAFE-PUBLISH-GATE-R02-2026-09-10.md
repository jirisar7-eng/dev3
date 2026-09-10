# AUDIT: TMPR-20260910-LEGAL-PUBLISH-001-R02 — Bezpečná publikační brána Legal Pack 2.0 (Sanace Defektů)

- **TASK ID:** TMPR-20260910-LEGAL-PUBLISH-001-R02
- **DATUM:** 2026-09-10
- **PROSTŘEDÍ:** AI Studio Workspace (Cílové prostředí: DEV3)
- **REŽIM:** RECOVERY & VERIFY
- **STATUS:** COMPLETE (IMPLEMENTED, LOCAL_TESTED, BUILD_VERIFIED, NOT_DEPLOYED, NOT_PUBLISHED)
- **VERDIKT:** READY_FOR_DEPLOYMENT_REVIEW
- **NOTION PAGE ID:** `3d7a127f-178a-815b-a167-e14dcad056cc`

---

## 1. Cíl a Rozsah (Goal & Scope)

### Cíl
Sanovat výhradně dva potvrzené architektonické a bezpečnostní defekty identifikované během verifikačního úkolu `TMPR-20260910-LEGAL-PUBLISH-001-V01` bez jakéhokoliv zásahu do živých právních dokumentů a bez nasazení do produkce:
1. **Defekt 1:** Zajištění neměnnosti (immutability) právní historie v `prepareDraftForPublication()` – zamezení přepsání již publikovaných nebo archivovaných verzí `2.0.0`.
2. **Defekt 2:** Sjednocení publikace a povinného auditního záznamu do jediné atomické transakce v `publishVersion()` s garancí kompletního rollbacku při libovolném selhání (včetně výpadku zápisu auditu).

### Rozsah (Scope)
- **IN SCOPE:**
  - `src/services/complianceService.ts`: fail-closed ochrana verze 2.0.0 v `prepareDraftForPublication()`.
  - `src/services/complianceService.ts`: interaktivní transakce `prisma.$transaction(async (tx) => { ... })` a in-memory deep snapshot/rollback v `publishVersion()`.
  - `tests/legal-pack-publish-phase3.test.ts`: rozšíření regresních testů (body 15–18).
  - Verifikace: `npx tsc --noEmit`, testy, `npm run build`.
  - Notion write-back a read-back na stránce `3d7a127f-178a-815b-a167-e14dcad056cc`.
- **OUT OF SCOPE:**
  - Publikace jakéhokoliv dokumentu Legal Pack 2.0.
  - Zásah do PROD3 nebo nasazení na DEV3.
  - Změny právních textů.

---

## 2. Výchozí stav a Zjištění (Baseline & Findings)

### Výchozí stav (Baseline)
Během auditu `TMPR-20260910-LEGAL-PUBLISH-001-V01` bylo zjištěno, že:
- `prepareDraftForPublication` aktualizoval existující verzi `2.0.0` bez kontroly jejího statusu. Pokud by v DB existovala verze `2.0.0` se statusem `PUBLISHED` nebo `ARCHIVED`, došlo by k přepsání historického právního textu.
- `publishVersion` prováděl `prisma.auditLog.create` až za blokem `prisma.$transaction([ ... ])`. Při selhání auditu zůstala verze publikována, ale auditní stopa nevznikla.

### Klasifikace zjištění
- **Defekt 1:** P1 (Porušení integrity právní historie a neměnnosti verzí).
- **Defekt 2:** P1 (Neatomický auditní log při kritické stavové operaci publikace).

---

## 3. Implementace a Změněné soubory (Implementation & Changed Files)

### 3.1. `src/services/complianceService.ts`
1. **Sanace Defektu 1 (`prepareDraftForPublication`):**
   - V Prisma větvi i in-memory fallbacku implementována fail-closed kontrola:
     ```typescript
     if (candidate.status !== 'DRAFT') {
       throw new Error(`FAIL CLOSED: Verze 2.0.0 pro dokument '${key}' již existuje se statusem '${candidate.status}'. Historické, publikované a archivované právní verze jsou neměnné.`);
     }
     ```
   - Sémantika:
     - Neexistující 2.0.0 -> vytvoří se perzistovaný kandidát (status DRAFT).
     - Existující 2.0.0 se statusem DRAFT -> obsah lze obnovit z SSOT.
     - Existující 2.0.0 se statusem PUBLISHED/ARCHIVED/jiným -> okamžitá výjimka, obsah se nemění.

2. **Sanace Defektu 2 (`publishVersion`):**
   - V Prisma větvi převedeno na interaktivní transakci `prisma.$transaction(async (tx) => { ... })`:
     - Krok 1: Archivace předchozí verze přes `tx.legalDocumentVersion.updateMany`.
     - Krok 2: Povýšení kandidáta na PUBLISHED přes `tx.legalDocumentVersion.update`.
     - Krok 3: Zápis auditního záznamu přes `tx.auditLog.create`.
     - Všechny operace využívají transakčního klienta `tx`.
   - V in-memory fallbacku vytvořen hluboký snapshot (`docSnapshot`, `auditLogsSnapshot`). Při výjimce v jakékoliv fázi (včetně simulovaného selhání `logAudit`) dochází k plnému rollbacku stavu paměti.
   - Doplněna kontrola vazby kandidáta na `LegalDocument`, ověření, že verze není již PUBLISHED nebo ARCHIVED, a zákaz publikace verzí s příznakem `DRAFT`.

### 3.2. `tests/legal-pack-publish-phase3.test.ts`
Přidány 4 nové regresní testy:
- Subtest 15: Ověření, že existující PUBLISHED 2.0.0 nelze přepsat.
- Subtest 16: Ověření, že existující ARCHIVED 2.0.0 nelze přepsat.
- Subtest 17: Ověření zachování funkčnosti pro existující DRAFT 2.0.0.
- Subtest 18: Simulace výpadku auditu v transakci publikace – ověření kompletního rollbacku (původní verze zůstává PUBLISHED, kandidát zůstává DRAFT, auditní log neunikl).

---

## 4. Výsledky testů a Sestavení (Verification Evidence)

1. **Cílené regresní testy publikační brány:**
   - Příkaz: `npx tsx tests/legal-pack-publish-phase3.test.ts`
   - Výsledek: **13/13 testů PASS** (18 dílčích kontrolních bodů).
2. **Testy náhledu návrhů Legal Pack 2.0:**
   - Příkaz: `npx tsx tests/legal-pack-2-0-draft-preview.test.ts`
   - Výsledek: **13/13 testů PASS**.
3. **Statická typová kontrola:**
   - Příkaz: `npx tsc --noEmit`
   - Výsledek: **0 chyb (PASS)**.
4. **Produkční sestavení:**
   - Příkaz: `npm run build`
   - Výsledek: **PASS** (Prisma client vygenerován, Vite build 2865 modulů hotov, esbuild server bundle `dist/server.js` vygenerován bez varování).

---

## 5. Bezpečnostní a Databázový dopad (Security & DB Impact)
- **Fail-closed garance:** Nedostupnost databáze nebo auditního subsystému striktně znemožňuje nekonzistentní publikaci.
- **Integrita:** Historické právní záznamy jsou chráněny proti jakékoliv nechtěné modifikaci.
- **Autorizace:** Všechny operace vyžadují `ADMIN` roli na serveru.
- **Stav publikace:** Žádný dokument z balíčku Legal Pack 2.0 nebyl publikován do ostrého provozu.

---

## 6. Záznam do Notion (Knowledge Write-Back)
- **Page ID:** `3d7a127f-178a-815b-a167-e14dcad056cc`
- **Titul:** `[TMPR-20260910-LEGAL-PUBLISH-001] — Bezpečná publikační brána Legal Pack 2.0`
- **Stav zápisu:** `NOTION_APPEND_STATUS: 200`
- **Read-Back ověření:** Počet bloků zvýšen na 24, zapsána sekce V01 zjištění, R02 sanace, výsledky testů a striktní potvrzení nepublikování.

---

## 7. Rizika a Další kroky (Risks & Next Steps)
- **Otevřená rizika:** Žádná v aplikačním kódu. Skutečná transakce v PostgreSQL musí být validována na DEV3 po nasazení.
- **Další krok:** Předat kód k posouzení deploymentu na DEV3 (task vedoucího vývoje / ChatGPT).
