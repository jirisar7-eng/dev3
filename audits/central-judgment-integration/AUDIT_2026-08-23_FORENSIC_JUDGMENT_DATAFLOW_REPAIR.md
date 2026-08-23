# AUDIT REPORT: Forenzní Audit a Oprava Central Judgment Integration Dataflow

**Datum:** 2026-08-23  
**Účel:** Identifikovat a opravit příčinu stavu „IMPORT HLÁSÍ PASS“, kdy import soudního rozsudku sice vrátil stav úspěchu, ale do rozhraní „Můj případ“ se zapsaly chybějící nebo nekorektní údaje (např. chybějící č. j., „0 dětí“, nezaevidovaná výše výživného).  
**Autor:** DevSecOps / Lead System Architect  

---

## 1. Výchozí stav & Nalezené Root Causes

Při provádění hloubkového forenzního trasování (PDF → ClamAV → Text Extraction → Deterministic Parser → Merge Engine → ClientCaseService.applyJudgmentToCase → DB Store / Prisma → getCaseById → Frontend React UI) byly odhaleny tři klíčové systémové chyby v datovém toku:

### A. Parser Regex Over-matching a Neodfiltrované Právní Fráze
- **Symptom:** V některých rozsudcích (např. *Štěpán Šár*) extraktor vrátil u jména dítěte znečištěný řetězec nebo generické slovo „dítě“ či „dítěte“.
- **Root Cause:** Regex `extractChild` zachytil v textu „opatrovníka pro nezletilé dítě“ slovo „dítě“ díky case-insensitive vyhledávání a nedostatečnému odfiltrování generických podstatných jmen. Při absenci omezujících podmínek docházelo také ke spojení jména s navazujícím textem (např. „se svěřuje...“).

### B. Nested `ParseMatch` Object Deserializace v Merge Engine
- **Symptom:** Některá pole zapsaná do databáze obsahovala neočekávané prázdné hodnoty nebo hodnoty typu `[object Object]`.
- **Root Cause:** Funkce `mergeLocalAndAiData` v `JudgmentParserService` očekávala na vstupu ploché hodnoty, avšak `DeterministicJudgmentParser` vrací datové struktury typu `ParseMatch<T>` (objekt obsahující `{ value, confidence, sourceText }`). Slučovací logika vkládala přímo tento objekt do textového pole bez jeho unwrapování.

### C. Chybějící Relace (Includes) v `getCaseById` a `getCasesForUser`
- **Symptom:** Přestože `applyJudgmentToCase` do databáze úspěšně uložil `CarePlan`, `CaseDocument`, `CaseEvidence`, `CaseDeadline` a `Child`, frontendové rozhraní „Můj případ“ zobrazovalo prázdné záložky a hlásilo 0 dětí.
- **Root Cause:** Dotazovací metody `ClientCaseService.getCaseById` a `getCasesForUser` vracely pouze základní záznam tabulky `Case` bez definovaných relací (`include: { children: true, carePlans: true, documents: true, evidence: true, deadlines: true, tasks: true }`).

---

## 2. Provedené Opravy & Změněné Soubory

1. **`src/services/deterministicJudgmentParser.ts`**
   - Zpřísněny regulární výrazy `extractChild` pro zachycení čistého jména a příjmení dítěte.
   - Přidán seznam zakázaných generických slov (`dítě`, `dítěte`, `rodiče`, `rodičů`, `obou`, `všech`, `syna`, `dceru`, `nezletilého`, `nezletilou`, `nezletilé`).
   - Přidáno čištění právních balastních frází (`se svěřuje`, `nar.`, `bytem`, `zastoupený`, `v péči`).

2. **`src/services/judgmentParserService.ts`**
   - Vytvořena pomocná unwrapovací funkce `unwrap` v `mergeLocalAndAiData`, která bezpečně extrahuje hodnotu `ParseMatch.value` nezávisle na tom, zda vstup pochází z lokálního lokátoru nebo AI struktury.

3. **`src/services/clientCaseService.ts`**
   - V `applyJudgmentToCase` doplněno striktní přetypování polí `caseNumber` a `court` na `string` a robustnější dělení celého jména dítěte na `firstName` a `lastName`.
   - V `getCaseById` a `getCasesForUser` doplněno kompletní načítání závislých relací (především `children`, `carePlans`, `documents`, `evidence`, `deadlines`, `tasks`, `events`), čímž se garantuje předání plného stavu případu do React UI.
   - Vytvořeno nulově bezpečné ošetření `(sr.text || '').toLowerCase()` v interní vyhledávací funkci `findSentenceForText`.

4. **Regresní & End-to-End Testovací Sady**
   - `tests/section5-reproduction.test.ts`: Vytvořen nový end-to-end test přímo replikující data z rozsudku Štěpána Šára (13 Nc 11/2026, Okresní soud v Pardubicích, střídavá péče 7/7, výživné 1 500 Kč).
   - Všechny stávající testy v `tests/judgment-ai-extractor-fallback.test.ts`, `tests/judgment-case-sync.test.ts` a `tests/care-occurrence-engine.test.ts` byly aktualizovány a ověřeny.

---

## 3. Změny v Databázi a API

- **Databáze (Prisma Schema / DB Store):** Nedošlo k destruktivním změnám schématu. Zpřesnila se perzistence a čtení stávajících entit `Case`, `Child`, `CarePlan`, `CaseDocument`, `CaseEvidence`, `CaseDeadline` a `CaseTask`.
- **API Kontrakty:**
  - POST `/api/care/import-judgment`: Nyní garantovaně vrací plný objekt případu včetně vytvořených dětí, plánu péče a finančních závazků.

---

## 4. Výsledky Testování & Verifikace

Nástrojem Node Test Runner byla provedena kompletní verifikace 34 testovacích scénářů ve 4 testovacích sadách:

- `tests/section5-reproduction.test.ts` — **PASS** (2/2)
- `tests/judgment-ai-extractor-fallback.test.ts` — **PASS** (20/20)
- `tests/judgment-case-sync.test.ts` — **PASS** (3/3)
- `tests/care-occurrence-engine.test.ts` — **PASS** (9/9)

**Compilation Check:**
- `compile_applet` proběhl bez chyb.

---

## 5. Bezpečnostní a Regresní Rizika

- **Secrets & Credentials:** Žádné klíče, hesla ani tokeny nebyly vloženy do kódové základny ani testů.
- **Bezpečnost (RBAC & BOLA):** Všechny databázové operace vyžadují ověření vlastníka případu (`ownerId === user.id`). Neautorizované požadavky (např. útočník User B) jsou striktně odmítány kódem `403 Forbidden`.
- **Regresní riziko:** Nízké. Změny byly izolovány do parserových helperů a dotazovacích include klauzulí, což zvyšuje konzistenci dat bez narušení existující logiky.

---

## 6. Finální Stav

Systém „Táta má právo“ (dev3) má nyní plně funkční, verifikovaný a nulově bezpečný datový tok od nahraného PDF rozsudku až po jeho zobrazení v sekcích „Můj případ“, „Profil dětí“, „Dokumenty“ a „Plán péče / Kalendář“.
