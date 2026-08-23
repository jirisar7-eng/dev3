# AUDIT: Fail-Safe AI Extractor & Deterministický Fallback Parser Rozsudků (P0)

- **Datum a čas**: 2026-08-23 16:06:00 UTC
- **Projekt**: Táta má právo (dev3 / prod3)
- **Pracovní větev**: `feature/judgment-extractor-local-fallback`
- **Úroveň priority**: P0 (Produkční stabilita & Fail-Safe odolnost)
- **Odpovědný architekt**: Senior Backend / DevSecOps & QA Auditor

---

## 1. Výchozí stav a incident v produkčním prostředí PROD3

V produkčním testovacím prostředí PROD3 byl proveden reálný test s PDF rozsudkem Okresního soudu v Pardubicích (7 stran).
- ClamAV kontrola proběhla úspěšně (dokument prošel jako čistý).
- Následně externí volání AI poskytovatelů skončilo chybou:
  `"AI analýza rozsudku selhala u všech dostupných poskytovatelů. Zkuste to prosím znovu."`
- Celý import rozsudku havaroval, i když samotný text dokumentu byl korektně extrahován z PDF/DOCX vrstvy.

### Základní architektonické pravidlo (Definition of Done)
> **Externí AI musí být enrichment layer, nikoliv jediný mechanismus schopný dokument zpracovat.**
> Pokud všechny AI providery selžou (`AI_DOWN`, quota limit, timeout, výpadek konektivity), systém **nesmí** selhat.
> `AI_ENRICHMENT_FAILED` nesmí znamenat `JUDGMENT_IMPORT_FAILED`.
> Systém musí provést lokální deterministickou extrakci, označit pole, informovat uživatele v UI a umožnit zkontrolovat a bezpečně importovat rozsudek do případu.

---

## 2. Provedené architektonické změny

### A. Lokální deterministický parser (`DeterministicJudgmentParser.ts`)
Byl vytvořen samostatný parser postavený na českých právních a gramatických vzorech (regex & parsing engine) pro rodinněprávní rozsudky:
1. **Soudy**: Regex pro Okresní, Obvodní, Městské, Krajské a Vrchní soudy v ČR.
2. **Spisové značky**: Extrakce `č. j.` / `sp. zn.` (včetně tvarů `14 Nc 25/2024-48`, `0 P 123/2024`).
3. **Data**: Normalizace českých datumů (slovních i číselných měsíců) do standardního ISO `YYYY-MM-DD`.
4. **Účastníci a dítě**: Rozlišení otce, matky, OSPODu, identifikace nezletilého dítěte a data narození bez parazitních předpon `nezl.`.
5. **Typ péče & harmonogram**: Klasifikace střídavé/společné/výlučné péče, lichý/sudý týden, dny v týdnu, intervaly předání a místa.
6. **Výživné a dluh**: Extrakce běžného výživného, dne splatnosti, příjemce a dlužného výživného včetně lhůty splatnosti.
7. **Prázdniny a zvláštní režimy**: Detekce letních prázdnin, Vánoc, Velikonoc a informační povinnosti rodičů.
8. **Provenance tracking**: Každé deterministicky získané pole nese metadata: `{ value, confidence, status, source: 'LOCAL_PDF', sourceText }`.

### B. Fail-Safe Pipeline v `JudgmentParserService.ts`
Implementována víceúrovňová pipeline:
1. **Vstupní bezpečnostní filtr**:
   - Kontrola velikosti (max 25 MB).
   - Validace MIME typu (`application/pdf`, `docx`, `txt`).
   - ClamAV antivirus sken (Fail-Closed).
2. **Textová extrakce**:
   - `pdf-parse` pro PDF (s normalizací mezer).
   - `mammoth` pro DOCX.
3. **Lokální deterministický baseline**:
   - Okamžitá extrakce všech dostupných parametrů.
4. **Volitelný AI Enrichment**:
   - Pokud jsou k dispozici AI klíče (`GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`), spustí se AI analýza.
   - Při selhání libovolného či všech poskytovatelů (`AI_TIMEOUT`, `AI_AUTH_ERROR`, `AI_PROVIDER_ERROR`) je chyba zachycena v `catch` bloku, zapsána do serverového logu a je bezpečně vrácen výsledek lokálního parseru s příznakem `aiEnrichmentFailed: true` a uživatelským upozorněním:
     `"Externí AI analýza není momentálně dostupná. Dokument byl přečten lokálním parserem. Některé údaje nemusí být automaticky rozpoznány. Zkontrolujte údaje před importem."`
5. **Inteligentní fúze (Merge Engine)**:
   - Pokud AI uspěje, `mergeLocalAndAiData` zkombinuje data. Pokud AI vrátí prázdnou hodnotu pro některé pole, které lokální parser spolehlivě našel, použije se hodnota z lokálního parseru.

### C. Validace a Integrita Dat v `ClientCaseService.ts`
Před jakýmkoliv zápisem rozsudku do databáze (`applyJudgmentToCase`) byla přidána validační brána `validateExtractedJudgmentData`:
- Kontrola formátu a rozsahu data narození dítěte (nesmí být v budoucnosti).
- Kontrola výše výživného (nesmí být záporná hodnota).
- Kontrola formátu časů předání (`HH:MM`).
- Zákaz syntetických / dummy dat.

### D. UI vrstva (`CareJudgmentImportModal.tsx`, `JudgmentImportModal.tsx`)
- V případě `aiEnrichmentFailed: true` nebo `userNotice` je v modálním okně zobrazen zřetelný žlutý alert banner s vysvětlením, že proběhla lokální extrakce.
- Všechna extrahovaná pole zůstávají plně editovatelná uživatelem před finálním odesláním do spisu.

---

## 3. Dotčené soubory

| Soubor | Typ změny | Popis |
|---|---|---|
| `src/services/deterministicJudgmentParser.ts` | Nový soubor | Deterministický regex parser pro české soudní rozsudky o péči a výživném |
| `src/services/judgmentParserService.ts` | Modifikace | Fail-safe pipeline, multi-provider fallback a inteligentní fúze dat |
| `src/services/clientCaseService.ts` | Modifikace | Validační brána `validateExtractedJudgmentData` před Prisma transakcí |
| `src/components/case/care/CareJudgmentImportModal.tsx` | Modifikace | Zobrazení fallback banneru při výpadku AI providerů |
| `src/components/coparent/JudgmentImportModal.tsx` | Modifikace | Zobrazení fallback banneru v CoParent importéru |
| `tests/judgment-ai-extractor-fallback.test.ts` | Nový soubor | 20 integračních a jednotkových testů pro deterministický fallback & validaci |
| `scripts/test-runner.js` | Modifikace | Registrace nové testovací sady do centrálního CI runneru |

---

## 4. Výsledky testů a verifikace

### A. Nová testovací sada (20 testů)
Spuštěno: `npx tsx --test tests/judgment-ai-extractor-fallback.test.ts`
- 1. Soud (Okresní soud v Pardubicích) -> **PASS**
- 2. Spisová značka (`14 Nc 25/2024-48`) -> **PASS**
- 3. Datum rozsudku (`2024-08-15`) -> **PASS**
- 4. Účastníci (Jan Novák, Marie Nováková) -> **PASS**
- 5. Jméno dítěte (Jakub Novák bez `nezl.`) -> **PASS**
- 6. Datum narození dítěte (`2018-05-12`) -> **PASS**
- 7. Klasifikace péče (`SHARED`) -> **PASS**
- 8. Typ harmonogramu (`EVEN_ODD_WEEKS`) -> **PASS**
- 9. Den a čas předání (`Pondělí`, `17:00`) -> **PASS**
- 10. Místo předání -> **PASS**
- 11. Běžné výživné (6 500 Kč) -> **PASS**
- 12. Den splatnosti výživného (15. den v měsíci) -> **PASS**
- 13. Dlužné výživné (18 000 Kč, splatnost do `2024-12-31`) -> **PASS**
- 14. Prázdniny, Vánoce, informační povinnost -> **PASS**
- 15. Field provenance (`source: 'LOCAL_PDF'`) -> **PASS**
- 16. **[P0 FAIL-SAFE] Všechny AI API klíče nedostupné / výpadek AI -> úspěšná extrakce s userNotice** -> **PASS**
- 17. Ochrana: Odmítnutí prázdného dokumentu (`EMPTY_DOCUMENT`) -> **PASS**
- 18. Ochrana: Odmítnutí souboru nad 25MB (`FILE_TOO_LARGE`) -> **PASS**
- 19. Validační brána `validateExtractedJudgmentData` odhalí budoucí datum narození a záporné výživné -> **PASS**
- 20. Validační brána schválí platný extrahovaný rozsudek -> **PASS**

### B. Celý integrační test runner (`node scripts/test-runner.js`)
- Registry & Connectors -> **PASS**
- State Administration API Hub (P1 & P2) -> **PASS**
- Mapa Subjektů & Registr -> **PASS**
- Judgment AI Extractor -> Case Persistence -> **PASS**
- Care Occurrence Engine & Calendar Integration -> **PASS**
- AI Extractor Local PDF Fallback (20 Tests) -> **PASS**
- **Výsledek**: 100% testů prošlo (0 selhání).

### C. Build & Lint kontrola
- `tsc --noEmit` (lint_applet) -> **PASS** (0 chyb).
- `vite build` (compile_applet) -> **PASS** (Applet úspěšně sestaven).

---

## 5. Bezpečnostní a DevSecOps audit

1. **Security First**:
   - V žádném souboru nejsou hardcoded klíče ani citlivé údaje.
   - ClamAV skenování zůstává striktně Fail-Closed (pokud antivirus selže nebo detekuje virus, soubor je zamítnut).
   - AI obohacení je Fail-Open (při výpadku AI se použijí lokální extrahovaná data s uživatelským upozorněním).
2. **Ochrana soukromí**:
   - Při lokálním zpracování neopouští text rozsudku serverové prostředí.
3. **BOLA / IDOR**:
   - Autorizace `case.userId === userId` je striktně vynucena v `clientCaseService.ts`.
4. **Integrita dat & Žádná syntetická data**:
   - Lokální parser extrahuje pouze to, co je prokazatelně v textu rozsudku. Neznámá pole jsou označena jako `NOT_FOUND`, nikoliv vymyšlena.
5. **Git Change Control**:
   - Změny jsou prováděny na vyhrazené větvi `feature/judgment-extractor-local-fallback`.
   - Větev `main` zůstává nedotčena.

---

## 6. Závěr

Implementace deterministického lokálního fallback parseru a fail-safe architektury je kompletní, 100% otestovaná a připravená k nasazení. Problém s pádem importu při nedostupnosti AI poskytovatelů v PROD3 byl bezezbytku vyřešen.
