# AUDIT REPORT: CENTRÁLNÍ INTEGRACE ROZSUDKU DO „MŮJ PŘÍPAD“ A STRUKTUROVANÁ DATABÁZOVÁ REPREZENTACE

**Datum a čas:** 2026-08-23 17:00 CET
**Úkol:** Centrální integrace soudních rozsudků do osobního spisu („Můj případ“), profily dětí, kalendář, finance a CoParent Hub s větou po větě databázovým mapováním.
**Pracovní větev:** `feature/central-judgment-case-integration`
**Garant:** Senior Software Architect & DevSecOps Engineer

---

## 1. CÍL A ROZSAH
Přepracování architekturní vrstvy zpracování a aplikace rozsudků tak, aby rozsudek sloužil jako **jediný centrální právní zdroj pravdy** pro celý případ (`Case`).

### Klíčové principy:
1. **Centrální Case entita:** Žádné izolované nebo duplicitní databáze pro CoParent Hub či dílčí moduly. Všechny údaje vychází z rozsudku spojeného se spisem.
2. **Granularita na úroveň vět:** Každá věta rozsudku je samostatným záznamem `JudgmentSentence` s metadaty o straně, odstavci, sekci (VÝROK, ODŮVODNĚNÍ atd.) a spolehlivosti.
3. **Auditovatelnost právních faktů:** Každý extrahovaný fakt (`JudgmentLegalFact`) odkazuje na konkrétní `sentenceId` a původní text rozsudku. Uživatel může kliknout na jakýkoliv údaj a vidět jeho přesný právní podklad.
4. **Propagace do modulů:** Automatická synchronizace údajů do profilu dítěte (`Child`), plánu péče (`CarePlan`), kalendáře (`CaseEvent`), dokumentů (`CaseDocument`), důkazů (`CaseEvidence`) a finančních závazků (`FinancialObligation`).
5. **Uživatelské korekce a historie:** Při změně právního faktu uživatelem zůstává původní hodnota z rozsudku nezměněna, zatímco nová hodnota se uloží s příznakem `isOverriddenByUser = true`, důvodem úpravy a časovým razítkem.

---

## 2. PROVEDENÉ ZMĚNY A SOUBORY

### A. Databázový model (`prisma/schema.prisma`)
Přidány 4 nové centrální databázové modely propojené s `Case`:
- `Judgment`: Reprezentuje přijatý rozsudek (spisová značka, soud, datum vydání, právní moc, rawText, scanStatus).
- `JudgmentSentence`: Segmentované věty rozsudku (index, číslo strany, číslo odstavce, sekce, text, confidence, source).
- `JudgmentLegalFact`: Strukturované právní skutečnosti (režim péče, rozvrh, střídání, výživné, povinnosti) s vazbou na `sentenceId`.
- `FinancialObligation`: Pravidelné výživné a dlužné výživné svázané s dítětem a větou rozsudku.

### B. Segmentace textu a rozhraní (`src/services/judgmentParserService.ts`, `src/services/deterministicJudgmentParser.ts`)
- Přidáno rozhraní `JudgmentSentenceData`.
- Do `JudgmentExtractedData` přidána pole `rawText` a `sentences`.
- Implemetována metoda `DeterministicJudgmentParser.extractSentences()` rozbíjející text rozsudku na číslované věty, určující sekce rozsudku (ZÁHLAVÍ, VÝROK, ODŮVODNĚNÍ, POUČENÍ) a odhadující čísla stran a odstavců.

### C. Atomická transakční integrace (`src/services/clientCaseService.ts`)
Metoda `applyJudgmentToCase()` upravena tak, aby v jediné atomické PostgreSQL transakci (`prisma.$transaction`) vytvářela a aktualizovala:
1. `Case` (spisová značka, soud, režim péče)
2. `Child` & `UserChild` (jméno, datum narození, poznámka k rozsudku)
3. `CaseDocument` (uložení rozsudku v dokumentech spisu s ClamAV CLEAN stavem)
4. `CaseEvidence` (přiřazení rozsudku do důkazního spisu)
5. `Judgment`, `JudgmentSentence[]`, `JudgmentLegalFact[]` (centrální větná a faktická struktura)
6. `FinancialObligation[]` (pravidelné i dlužné výživné)
7. `CaseDeadline` (lhůty splatnosti výživného)
8. `CarePlan` & `CareDay[]` & `CareHolidayRule[]` (plán péče a střídání)
9. `CaseEvent[]` (synchronizace do kalendáře spisu)

Přidány API metody pro ClientCaseService:
- `getJudgmentsByCaseId(caseId, requestingUser)`
- `updateLegalFact(caseId, factId, requestingUser, newValue, reason)`

### D. REST Endpoints (`src/routes/caseRoutes.ts`)
- `GET /api/cases/:caseId/judgments`: Získání všech rozsudků spisu včetně vět, právních faktů a finančních závazků.
- `PATCH /api/cases/:caseId/facts/:factId`: Uživatelská úprava právního faktu s uplatněním auditního logování.

### E. Testovací sada (`src/tests/judgmentSyncAudit.test.ts`)
Rozšířena testovací sada o ověření vytvoření a provázanosti `Judgment`, `JudgmentSentence`, `JudgmentLegalFact` a `FinancialObligation` v databázi.

---

## 3. VÝSLEDKY VERIFIKACE A TESTŮ

1. **Typová kontrola (TypeScript):**
   - Příkaz: `npx tsc --noEmit`
   - Výsledek: **0 chyby (PASS)**
2. **Statická analýza a linter:**
   - Příkaz: `npm run lint`
   - Výsledek: **0 chyby (PASS)**
3. **Kompletní testovací sada:**
   - Příkaz: `npm test`
   - Výsledek: **Všechny testy prošly (PASS)**
     - *Judgment AI Extractor -> Case Persistence Integration: PASS*
     - *Care Occurrence Engine & Judgment Calendar Integration: PASS*
     - *AI Extractor Local PDF Fallback & Deterministic Extraction (20 Tests): PASS*
4. **Applet kompilace:**
   - Tool: `compile_applet`
   - Výsledek: **Build succeeded (PASS)**

---

## 4. BEZPEČNOSTNÍ AUDIT (SECURITY & SECRETS CHECK)
- V kódu ani v testech nejsou přítomna žádná hardcoded hesla, API klíče, tokeny ani reálné rodinné/osobní údaje.
- Všechny operace jsou zabezpečeny kontrolou oprávnění skrze `authorizeCaseAccess()`.
- Dokumenty prochází ClamAV virus scannerem.

---

## 5. ZÁVĚR
Úkol byl úspěšně a bezpečně dokončen. Centrální reprezentace rozsudku je plně funkční a otestovaná.
PROD3 prostory zůstaly netknuté dle bezpečnostních instrukcí.
