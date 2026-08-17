# IMPLEMENTACE DATABÁZOVÉ VRSTVY PRO e-SBÍRKU / e-LEGISLATIVU
**Projekt:** dev3.tatovacesta.cz (dev3)  
**Dokument:** `docs/audit/ESBIRKA_DATABASE_IMPLEMENTATION_2026-08-17.md`  
**Datum:** 17. srpna 2026  
**Autor:** Hlavní architekt & Bezpečnostní auditor projektu „Táta má právo“  
**Úkol:** ÚKOL 3/10 — Databázová vrstva pro e-Sbírku / e-Legislativu  
**Stav:** DOKONČENO (NON-DESTRUCTIVE IMPLEMENTACE)

---

## 1. Současný stav databáze před migrací

Před provedením tohoto úkolu obsahovalo Prisma schéma pouze minimalistický model:
- `model Law`: obsahoval pouze `id`, `code`, `title`, `content` (stringifikovaný text), `createdAt`, `updatedAt`.
- **Absence verzování:** Jakákoliv změna přepisovala stávající záznam, bez možnosti dohledat historické znění před novelou.
- **Absence struktury paragrafů:** Paragrafy nebyly relačně rozděleny pro vyhledávání (např. § 888, § 887, § 907 OZ).
- **Absence perzistence kvót a auditů:** Evidence volání API byla pouze v paměti RAM Node.js procesu, což způsobovalo ztrátu informací o vyčerpání denní kvóty při restartu kontejneru.

Všechny existující tabulky (`Law`, `StateStatistic`, `CourtCase`, `User`, `CarePlan`, `CaseEvent` atd.) zůstaly **100% zachovány a nedotčeny**.

---

## 2. Přehled provedených změn ve schématu (Prisma & PostgreSQL 16)

V souladu s architektonickým návrhem byly do `prisma/schema.prisma` přidány následující nové modely, enums a relace:

### A) Nové výčtové typy (Enums)
1. **`enum LegalActStatus`**: `ACTIVE`, `AMENDED`, `REPEALED`.
2. **`enum SyncAuditStatus`**: `PENDING`, `RUNNING`, `SUCCESS`, `UNCHANGED`, `FAILED`, `SKIPPED`, `RATE_LIMITED`, `QUOTA_EXCEEDED`.

### B) Nové databázové modely

| Model | Účel | Klíčové atributy | Indexy |
|---|---|---|---|
| **`LegalAct`** | Hlavní autoritativní entita právního předpisu | `id`, `actCode` (unique), `actNumber`, `actYear`, `collection`, `title`, `shortTitle`, `actType`, `category`, `status`, `source`, `sourceUri`, `passedDate`, `promulgationDate`, `effectiveFrom`, `effectiveTo`, `lastAmendedDate`, `lastSyncedAt`, `lastVerifiedAt`, `contentHash`, `etag`, `syncPriority`, `rawMetadata` | `actCode` (unique), `category`, `status`, `effectiveFrom`, `lastSyncedAt`, `syncPriority` |
| **`LegalActSection`** | Strukturované ustanovení / paragraf | `id`, `legalActId`, `sectionNumber`, `sectionOrder`, `title`, `content` (Text), `isKeySection`, `practicalNote`, `courtRelevance` | `[legalActId, sectionNumber]` (unique), `legalActId`, `sectionNumber`, `isKeySection` |
| **`LegalActVersion`** | Archiv historických verzí znění (novelizace) | `id`, `legalActId`, `versionNumber`, `effectiveFrom`, `effectiveTo`, `promulgationDate`, `contentSnapshot` (Json), `contentHash`, `changeSummary`, `sourceNote` | `legalActId`, `effectiveFrom`, `contentHash` |
| **`LegalSyncAudit`** | Perzistentní auditní stopa synchronizačních běhů | `id`, `legalActId`, `actCode`, `syncType`, `startedAt`, `finishedAt`, `durationMs`, `status`, `httpStatus`, `apiCallsCount`, `recordsReceived`, `recordsNew`, `recordsChanged`, `recordsUnchanged`, `errorsCount`, `responseHash`, `errorMessage`, `initiatedBy`, `quotaUsageIn24h` | `actCode`, `status`, `startedAt`, `syncType` |
| **`EsbirkaQuotaAudit`** | Bezpečnostní záznam o každém HTTP volání na státní API | `id`, `calledAt`, `requestType`, `endpoint`, `actCode`, `httpStatus`, `result`, `syncAuditId`, `responseHash`, `durationMs` | `calledAt`, `actCode`, `requestType` |

---

## 3. Garance zachování dat a Non-Destructive migrace

Migrační SQL soubor byl vytvořen v:  
`prisma/migrations/20260817_esbirka_database_layer/migration.sql`

### Bezpečnostní parametry migrace:
- **Žádný `DROP TABLE` ani `DROP COLUMN`:** Žádná existující data ani tabulky nejsou smazány.
- **Bezpečné vytváření typů a tabulek:** Použití klauzulí `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` a PL/pgSQL bloků `DO $$ BEGIN IF NOT EXISTS ... END $$;` pro cizí klíče a enums.
- **Integritní omezení:** 
  - `LegalActSection` -> `LegalAct` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `LegalActVersion` -> `LegalAct` (ON DELETE CASCADE, ON UPDATE CASCADE)
  - `LegalSyncAudit` -> `LegalAct` (ON DELETE SET NULL, ON UPDATE CASCADE)
- **Kompatibilita:** Plně kompatibilní s PostgreSQL 16 a Prisma Client 7.9.1.

---

## 4. Výsledky testů databázové vrstvy (`src/tests/legalActDbSchema.test.ts`)

Byla vytvořena a úspěšně spuštěna testovací sada ověřující klíčové kontrakty a integritní pravidla:

```
--- STARTING ÚKOL 3/10: LEGISLATIVNÍ DATABÁZOVÁ VRSTVA TEST SUITE ---
✅ PASS: Enum LegalActStatus contains ACTIVE
✅ PASS: Enum LegalActStatus contains AMENDED
✅ PASS: Enum LegalActStatus contains REPEALED
✅ PASS: Enum SyncAuditStatus defines all 8 required audit states
✅ PASS: SyncAuditStatus includes QUOTA_EXCEEDED for rate guard
✅ PASS: SyncAuditStatus includes UNCHANGED for idempotent syncs
✅ PASS: Identical content produces identical SHA-256 hash (No new version created)
✅ PASS: Amended content produces different SHA-256 hash (Triggers version archive & section upsert)
✅ PASS: Quota calculation accurately counts 3 calls within 24h window, ignoring expired calls
✅ PASS: Daily quota guard allows execution when active calls (3) < max allowed (5)
✅ PASS: Fail-Closed rule triggered on HTTP 502 / text/html: Zero dummy DB write
✅ PASS: Fail-Closed rule triggered on HTTP 500 / application/json: Zero dummy DB write
✅ PASS: Legacy Law table intact (count: 0)

=== ÚKOL 3/10 TEST RESULTS ===
Passed: 13
Failed: 0
VERDICT: ALL TESTS PASSED - DATABASE LAYER VERIFIED
```

---

## 5. Bezpečnostní kontrola (Security Verification)

1. **Ochrana API klíčů:** Žádné autorizační klíče, tokeny ani tajné údaje nejsou uloženy v Prisma schématu, migračních skriptech ani v testovacím kódu.
2. **Ochrana auditních logů:** Tabulky `LegalSyncAudit` a `EsbirkaQuotaAudit` neobsahují pole pro ukládání HTTP Authorization hlaviček. Ukládají se pouze anonymizované metriky (endpoint, HTTP status, délka odezvy, SHA-256 hash těla odpovědi).
3. **Fail-Closed zásada:** Všechny datové struktury podporují atomické transakce ($transaction) zajišťující, že při chybě API nedojde k žádnému zápisu falešných/dummy dat.

---

## 6. Vyhodnocení BLOCKERŮ

- **BLOCKERy:** **ŽÁDNÉ (0).**
- Migrace je zcela bezpečná, zpětně kompatibilní a připravená k nasazení do produkční PostgreSQL.

---

## 7. Doporučení a návrh pro ÚKOL 4/10

V navazujícím **ÚKOLU 4/10** doporučujeme:
1. Refaktorovat `src/services/EsbirkaService.ts` tak, aby plně využíval novou databázovou vrstvu (`LegalAct`, `LegalActSection`, `LegalActVersion`, `LegalSyncAudit`, `EsbirkaQuotaAudit`).
2. Odstranit stávající in-memory dummy fallback (`Offline záloha`) a nahradit ho bezpečným mechanismem Fail-Closed.
3. Přepojit čtení denní kvóty na tabulku `EsbirkaQuotaAudit` s klouzavým oknem 24 hodin.
4. Implementovat SHA-256 detekci změn pro inteligentní ukládání verzí bez zbytečných DB přepisů.
