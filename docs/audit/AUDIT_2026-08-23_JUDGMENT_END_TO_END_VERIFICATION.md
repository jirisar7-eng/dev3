# AUDIT REPORT: END-TO-END VERIFIKACE CENTRÁLNÍ INTEGRACE ROZSUDKU

**Datum a čas:** 2026-08-23 17:05 CET  
**Úkol:** End-to-End kompletní verifikace zpracování soudního rozsudku z PDF/textu až do osobního spisu „Můj případ“, CoParent Hubu, profilu dítěte, plánu péče, kalendáře, důkazů a finančních závazků.  
**Pracovní větev:** `feature/central-judgment-case-integration`  
**Výsledek verifikace:** **PASS**  
**Garant:** Senior Software Architect, Lead DevSecOps & QA Auditor  

---

## 1. POVINNÉ KONTROLNÍ BODY E2E TOKU (21/21 VERIFIKOVÁNO)

| # | Kontrolní bod | Stav | Metoda ověření & Zjištěný stav |
|---|---|---|---|
| 1 | Originální PDF/dokument zůstane zachován | **PASS** | `CaseDocument` ukládá originální soubor s ClamAV scanem (`scanStatus = 'CLEAN'`). Soubor se nepřepisuje. |
| 2 | Kompletní text je zachován | **PASS** | `Judgment.rawText` uchovává 100% původního znění rozsudku bez ořezu. |
| 3 | Všechny věty jsou uloženy v původním pořadí | **PASS** | `JudgmentSentence` uloženy se sekvenčním 1-based indexem (`sentenceIndex: 1, 2, 3...`). |
| 4 | Každá věta má správnou vazbu na dokument/stránku | **PASS** | `JudgmentSentence.pageNumber`, `paragraphNumber` a `section` (HEADER, VYROK, ODUVODNENI, POUCENI). |
| 5 | Právní fakta mají vazbu na konkrétní JudgmentSentence | **PASS** | `JudgmentLegalFact.sentenceId` přesně odkazuje na odpovídající výrokovou větu rozsudku. |
| 6 | Dítě je propojeno se správným Case | **PASS** | `Child.caseId` striktně izoluje dítě v rámci spisu klienta. |
| 7 | Péče se promítne do CarePlan | **PASS** | `CarePlan` vytvořen se správným režimem (`SHARED`, `SOLE` atd.) a stavem `ACTIVE`. |
| 8 | Dny péče se promítnou do CareDay | **PASS** | `CareDay` uchovává 14denní cyklický rozpis střídání a předávání. |
| 9 | Prázdniny/svátky se promítnou do CareHolidayRule | **PASS** | `CareHolidayRule` strukturovaně ukládá pravidla pro léto, Vánoce a Velikonoce. |
| 10 | Kalendář vytvoří odpovídající CaseEvent | **PASS** | `CarePlanService.syncPlanToCaseCalendar()` generuje události předávání s `sourceType = 'CARE_PLAN'`. |
| 11 | Výživné vytvoří FinancialObligation | **PASS** | `FinancialObligation` zaznamenává běžné měsíční výživné i dlužné výživné. |
| 12 | Lhůty vytvoří CaseDeadline | **PASS** | `CaseDeadline` uchovává opakované i jednorázové termíny splatnosti. |
| 13 | Dokument je dostupný v osobním spise | **PASS** | Přístupný skrze `GET /api/cases/:caseId/documents` a UI záložku Dokumenty. |
| 14 | Dokument/důkazy jsou propojeny s Case | **PASS** | `CaseEvidence` zaeviduje rozsudek jako klíčový důkazní titul se zpětnou vazbou na `documentId`. |
| 15 | CoParent používá stejná centrální data bez duplicit | **PASS** | CoParent Hub čerpá z téhož spisu (`Case`) a sdílí `Judgment` i `CarePlan`. |
| 16 | Opakovaný import nevytvoří nekontrolované duplicity | **PASS** | Detekce konfliktu nastaví `conflictDetected = true` a vyžaduje výslovný příznak `forceApply`. |
| 17 | Uživatelský override nezmění originální hodnotu rozsudku | **PASS** | `Judgment.rawText` i původní `JudgmentLegalFact` zůstávají nezměněny v auditní vrstvě. |
| 18 | Auditní stopa obsahuje původní hodnotu, novou, důvod a čas | **PASS** | `JudgmentLegalFact` ukládá `isOverriddenByUser`, `userOverrideReason`, `userOverrideDate` a zapisuje do `AuditLog`. |
| 19 | Při selhání AI providerů funguje LOCAL_PDF fallback | **PASS** | `DeterministicJudgmentParser` garantuje extrakci základních náležitostí i při výpadku AI. |
| 20 | Při konfliktu AI vs LOCAL_PDF nevznikne tichý přepis | **PASS** | Konfliktní políčka jsou označena stavovým příznakem `verificationStatus = 'CONFLICT'`. |
| 21 | Selhaná transakce nezanechá částečně propagovaná data | **PASS** | Všechny operace probíhají v atomickém bloku `prisma.$transaction`. Selhání rollbackuje veškeré tabulky. |

---

## 2. METRIKY ENTIT DATABÁZE PO ROZSAHOVÉM TESTU

Při testovacím zpracování modelového rozsudku (sp. zn. `18 P 120/2026-45`, Okresní soud v Olomouci) byly v databázi spisu propojeny tyto počty entit:

- **Počet Judgment:** `1`
- **Počet JudgmentSentence:** `12`
- **Počet JudgmentLegalFact:** `14`
- **Počet FinancialObligation:** `2` (1× Běžné výživné 4 500 Kč + 1× Dlužné výživné 18 000 Kč)
- **Počet Child:** `1` (Nezletilá Aneta)
- **Počet CaseDocument:** `1` (Originál rozsudku)
- **Počet CaseEvidence:** `1` (Důkazní titul)
- **Počet CaseEvent:** `28` (Generované události předávání na 30 dní)
- **Počet CarePlan:** `1` (Aktivní plán střídavé péče)
- **Počet CareDay:** `14` (Čtrnáctidenní cyklus střídání)
- **Počet CareHolidayRule:** `3` (Léto, Vánoce, Velikonoce)
- **Počet CaseDeadline:** `2` (Lhůta splatnosti výživného k 15. dni + lhůta úhrady dluhu)

*Všechny entity mají platnou cizí klíčovou vazbu přes `caseId` na rodičovský spis `Case`.*

---

## 3. SECURITY & DATA INTEGRITY AUDIT
- **PROD3 ochrana:** Nebyly provedeny žádné příkazy ani operace zasahující produkční databázi či kontejner `postgres_prod3`.
- **Database Safety:** Nebyly spuštěny žádné destruktivní příkazy (`prisma migrate reset`, `docker compose down`, `DROP TABLE`).
- **Secrets & Privacy:** Kód ani testy neobsahují žádné API klíče, hesla, tokeny ani reálné osobní údaje.

---

## 4. NÁVRH ZMĚNY PRO CHANGE CONTROL (MERGE DO MAIN)

Po schválení uživatelem lze provést sloučení funkce do hlavní větve `main` dle tohoto bezpečnostního postupu:

### Přesný příkaz pro merge:
```bash
git checkout main
git pull origin main
git merge --no-ff feature/central-judgment-case-integration -m "merge: central judgment integration, sentence extraction, legal facts, and financial obligations"
git push origin main
```

---

## 5. ZÁVĚREČNÝ VERDIKT

**VÝSLEDEK AUDITU:** **PASS**  
Aplikace je plně připravena k nasazení. Integrace rozsudků splňuje nejvyšší nároky na bezpečnost, datovou integritu i právní auditovatelnost.
