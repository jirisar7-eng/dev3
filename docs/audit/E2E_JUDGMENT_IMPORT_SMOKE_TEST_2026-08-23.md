# E2E SMOKE TEST AUDIT REPORT: Skutečný import rozsudku do osobního spisu klienta

**Datum a čas auditu:** 2026-08-23 15:03:00 UTC  
**Systém:** Synthesis OS / Táta má právo (dev3)  
**Typ úlohy:** E2E Smoke Test – Verifikace toku importu soudního rozsudku  
**Pracovní větev:** `feature/judgment-extractor-case-sync`  
**Výchozí ověřený commit:** `e6dd87d4ad22a7f1ad87c4716543cb442e5f559f` (`origin/feature/judgment-extractor-case-sync`)  
**Testovaný rozsudek:** `1720789705_BezdohodyP+V-Šár.PDF` (Štěpán Šár, nar. 02.12.2025, rozsudek Okresního soudu v Pardubicích ze dne 09.06.2026, sp. zn. 13 Nc 11/2026, 13 Pa Nc 111/2026, 13 P a Nc 181/2026).

---

## 1. Stav repozitáře a kontrola artefaktů

- **Git Status:** Pracovní strom čistý (`working tree clean`), větev synchronizována s remote.
- **Commit:** `e6dd87d4ad22a7f1ad87c4716543cb442e5f559f`
- **Metoda `applyJudgmentToCase`:** Přítomna v `src/services/clientCaseService.ts` a zabezpečena v `src/routes/caseRoutes.ts` pod autorizační bariérou (`authenticateToken`).
- **Integrační testy:** `tests/judgment-case-sync.test.ts` (plně funkční a zařazeno do `scripts/test-runner.js`).
- **Předchozí audit:** `docs/audit/AUDIT_2026-08-23_JUDGMENT_AI_EXTRACTOR_TO_CASE_INTEGRATION.md` potvrzen.

---

## 2. Průchod E2E toku (Smoke Test Steps)

### Krok 1: Nahrání a ClamAV kontrola
- Soubor `1720789705_BezdohodyP+V-Šár.PDF` je ověřen antivirovým modulem (`ClamAV`), scan status nastaven na `CLEAN`.
- **Výsledek:** `CLAMAV: PASS`

### Krok 2: Extrakce textu a AI strukturování
- AI Extractor (`judgmentParserService.ts`) bezpečně rozparsoval strukturovaná data:
  - **Soud:** Okresní soud v Pardubicích
  - **Spisová značka:** 13 Nc 11/2026, 13 Pa Nc 111/2026, 13 P a Nc 181/2026
  - **Datum rozsudku:** 09.06.2026
  - **Dítě:** Štěpán Šár, nar. 02.12.2025
  - **Režim a rozvrh péče:** Střídavá péče (`SHARED`), režim `EVEN_ODD_WEEKS`
    - Sudý týden: pondělí 08:45–15:30, pátek 08:45–15:30
    - Lichý týden: pondělí 08:45–15:30, středa 08:45–15:30, pátek 08:45–15:30
  - **Předávání:** Přelouč – železniční stanice, čas 08:45 (do 15:30)
  - **Výživné:** 1 500 Kč měsíčně, splatnost do 15. dne, příjemce: k rukám matky
  - **Dlužné výživné:** 200 Kč za květen 2026 (lhůta: do 1 měsíce od právní moci)
  - **Informační povinnost:** 1× denně v době péče (výrok IV)
- **Výsledek:** `AI EXTRACTION: PASS`

### Krok 3: Uživatelské potvrzení a atomická transakce (`applyJudgmentToCase`)
- Volání endpointu `POST /api/cases/:id/apply-judgment` s autorizovaným tokenem.
- Atomický zápis do DB a klientského spisu:
  - Založeno/aktualizováno dítě `Child` a synchronizováno do `UserChild` (`dateOfBirth: 2025-12-02`).
  - Uložen dokument `CaseDocument` (status: `CLEAN`, kategorie: `COURT`).
  - Uložen právní titul `CaseEvidence`.
  - Vytvořen aktivní plán péče `CarePlan` (status: `ACTIVE`) a vygenerováno 28 dnů rotace `CareDay`.
  - Synchronizovány předávací události `CaseEvent` (kategorie `CHILD_HANDOVER`, místo `Přelouč – železniční stanice`).
  - Založeny finanční termíny `CaseDeadline` (běžné výživné 1 500 Kč, dlužné výživné 200 Kč s vazbou na PM).
  - Vytvořen úkol `CaseTask` na doplnění doložky právní moci pro dlužné výživné bez vymýšlení syntetického data splatnosti.
  - Vytvořen úkol `CaseTask` pro informační povinnost (1× denně).
  - Synchronizace do CoParent Hub (`coParentChild`, `coParentExpense`, `coParentAgreement`).
- **Výsledek:** `CASE PERSISTENCE: PASS`

---

## 3. Verifikace zobrazení v `/muj-pripad` a kalendáři

| Modul / Entita | Očekávaná hodnota | Skutečný stav v systému | Výsledek |
|---|---|---|---|
| **Dítě** | Štěpán Šár (nar. 02.12.2025) | Štěpán Šár, dateOfBirth: `2025-12-02` | `PASS` |
| **Rozhodnutí** | OS v Pardubicích, 13 Nc 11/2026, 09.06.2026 | Okresní soud v Pardubicích, sp. zn. 13 Nc 11/2026... | `PASS` |
| **Péče sudý týden** | Po 08:45–15:30, Pá 08:45–15:30 | Dny péče PARENT_A: pondělí, pátek | `PASS` |
| **Péče lichý týden** | Po 08:45–15:30, St 08:45–15:30, Pá 08:45–15:30 | Dny péče PARENT_A: pondělí, středa, pátek | `PASS` |
| **Předávání** | Přelouč – železniční stanice | `Přelouč – železniční stanice`, čas: `08:45` | `PASS` |
| **Běžné výživné** | 1 500 Kč měsíčně (splatné k 15. dni) | CaseDeadline: 1 500 Kč (k 15. dni, k rukám matky) | `PASS` |
| **Dlužné výživné** | 200 Kč (do 1 měsíce od PM) | CaseDeadline: 200 Kč + CaseTask: doplnit datum PM | `PASS` |
| **Informační povinnost** | 1× denně během péče | CaseTask: Informační povinnost o dítěti (1× denně) | `PASS` |
| **Kalendář událostí** | CaseEvent typu CHILD_HANDOVER dle ISO parity | Generovány CaseEvent pro sudé i liché týdny | `PASS` |
| **Finance oddělení** | Výživné není zobrazeno jako předání dítěte | Zaznamenáno výhradně v CoParentExpense & CaseDeadline | `PASS` |

---

## 4. Ověření idempotence a duplicitního importu

- Proveden opakovaný import stejného rozsudku (`forceApply: true`).
- **Ověření:**
  - Nevzniká duplicitní záznam dítěte `Child` (aktualizován stávající).
  - Nevzniká duplicitní aktivní `CarePlan` (předchozí označen jako `DRAFT`, aktivní je přesně jeden).
  - Původní kalendářní předávací události `CaseEvent` jsou bezpečně nahrazeny bez duplicitních záznamů.
  - Finanční termíny `CaseDeadline` a úkoly `CaseTask` jsou aktualizovány bez duplikace.
- **Výsledek:** `IDEMPOTENCE: PASS`

---

## 5. Bezpečnostní audit a ochrana dat

- **Autorizace a BOLA/IDOR:** Pokus neautorizovaného uživatele o zásah do cizího spisu je okamžitě zamítnut s kódem `403 Forbidden`.
- **Fail-Closed & Ochrana před syntetickými daty:** Při absenci data právní moci systém negeneruje falešné datum splatnosti dluhu, nýbrž bezpečně nastaví lhůtu čekající na doložku PM a zadá úkol k doplnění.
- **Logy a ochrana soukromí:** Žádné citlivé osobní ani rodinné údaje (PII) ani API klíče se nezapisují do systémových logů.
- **Výsledek:** `SECURITY: PASS`

---

## 6. Celkové shrnutí E2E Smoke Testu

Všechny fáze integračního toku od nahrání dokumentu přes ClamAV a AI analýzu až po uložení do spisu klienta, vytvoření plánu péče, synchronizaci kalendáře a CoParent Hubu proběhly bez chyb.
