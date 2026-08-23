# AUDIT REPORT: Oprava integrace AI Extractor rozsudku do osobního spisu klienta (/muj-pripad)

**Datum a čas auditu:** 2026-08-23 07:58:30 UTC  
**Systém:** Synthesis OS / Táta má právo (dev3)  
**Typ úlohy:** Oprava integračního toku PDF rozsudek → ClamAV → AI Extractor → strukturované entity → Case → Child/UserChild → CaseDocument → CaseEvidence → CarePlan/CareDay → CaseDeadline → CaseEvent → CoParentHub → /muj-pripad  
**Ověřovací případ:** Rozsudek `1720789705_BezdohodyP+V-Šár.PDF` (Štěpán Šár, nar. 02.12.2025, rozsudek OS v Pardubicích ze dne 09.06.2026, sp. zn. 13 Nc 11/2026, 13 Pa Nc 111/2026, 13 P a Nc 181/2026).

---

## 1. Výchozí stav a identifikovaný problém

Uživatel popsal problém, kdy po nahrání dokumentu `1720789705_BezdohodyP+V-Šár.PDF`, úspěšném antivirovém prověření (ClamAV) a provedení AI analýzy zůstával osobní spis (`/muj-pripad`) v prázdném stavu:
- Děti v péči: 0
- Lhůty/úkoly: 0
- Dokumenty: 0
- Harmonogram/rozvrh péče: prázdný

### Příčina problému zjištěná auditem:
1. **Chybějící pole v AI parseru (`judgmentParserService.ts`):** Interface a prompt neobsahovaly pole pro `alimonyRecipient`, `alimonyDebtAmount`, `alimonyDebtPeriod`, `alimonyDebtDueDate` a `informationDuty`.
2. **Filtrování klíčů v parseru:** Pole `keys` v `parseResponse()` zahazovalo některé extrahované hodnoty a parsování částek selhávalo při specifickém formátování měn.
3. **Chybějící atomická transakce a perzistence do souvisejících entit:** V servisní vrstvě `clientCaseService.ts` nebyla vazba na datum narození, synchronizaci dlužného výživného (včetně vazby na doložku právní moci bez falešných odhadů), informační povinnost (1× denně v době péče) a CoParent agreement text.

---

## 2. Provedené změny a technické úpravy

### A. Rozšíření extrakční vrstvy (`src/services/judgmentParserService.ts`)
- Rozšířen interface `JudgmentExtractedData` o:
  - `alimonyRecipient?: string` (např. "k rukám matky")
  - `alimonyDebtAmount?: number` (doplatek výživného, např. 200 Kč)
  - `alimonyDebtPeriod?: string` (období dluhu, např. "květen 2026")
  - `alimonyDebtDueDate?: string` (splatnost, např. "do 1 měsíce od PM")
  - `informationDuty?: string` (informační povinnost, výrok IV)
- Aktualizován AI extraction prompt (`getPrompt`) pro strukturované JSON výstupy s explicitní instruktáží pro výživné, dlužné výživné a informační povinnosti.
- Normalizace finančních položek a numerických dnů splatnosti v `parseResponse()`.

### B. Posílení transakční perzistence (`src/services/clientCaseService.ts`)
- **Child & UserChild:**
  - Vytvoření / aktualizace entity `Child` navázané na `caseId`.
  - Uložení přesného data narození (např. `2025-12-02`).
  - Synchronizace s klientským profilem `UserChild`.
- **CaseDocument & CaseEvidence:**
  - Automatická registrace dokumentu se statusem `CLEAN` a kategorií `COURT`.
  - Vytvoření právního titulu v `CaseEvidence` s proveniencí rozsudku a sp. zn.
- **Finanční lhůty (CaseDeadline):**
  - Pravidelné výživné (např. 1 500 Kč k 15. dni v měsíci, příjemce matka).
  - Dlužné výživné (např. 200 Kč za květen 2026):
    - *Pokud datum právní moci není známo:* Systém nevymýšlí falešné datum, ale nastaví lhůtu s příznakem čekání na PM a automaticky vytvoří úkol (`CaseTask`) na doplnění data právní moci po jejím vyznačení.
- **Informační povinnost (CaseTask):**
  - Vygenerován úkol s vysokou prioritou pro evidenci a plnění informační povinnosti (1× denně v době péče o dítě).
- **Plán péče (CarePlan & CareDay) a kalendář spisu (CaseEvent):**
  - Automatické vygenerování aktivního střídavého/asymetrického plánu péče (sudé/liché týdny, Po+Pá sudý, Po+St+Pá lichý).
  - Přesný čas (08:45–15:30) a předávací místo ("Přelouč – železniční stanice").
  - Synchronizace předávacích událostí do kalendáře spisu (`CaseEvent`).
- **CoParent Hub:**
  - Propis do `coParentChild`, `coParentHandover`, schválených `coParentExpense` a platné `coParentAgreement`.

### C. Testovací pokrytí (`tests/judgment-case-sync.test.ts`)
- **Test 1:** Autorizační bariéra a ochrana proti BOLA/IDOR (cizí útočník je zamítnut s 403 Forbidden).
- **Test 2:** Kompletní atomická transakce a perzistence případu Štěpán Šár (ověření Child, CaseDocument, CaseEvidence, Alimony Deadline, Debt Deadline, PM Task, Information Task, Active Care Plan).
- **Test 3:** Idempotence a bezpečný opakovaný import bez duplicitních aktivních plánů nebo narušení integrity.

---

## 3. Výsledky testů a verifikace

1. **Static & Security Integrity (PWA, Disclaimers, Auth, RBAC):** PASS (5/5)
2. **Security & Audit Integrations:** PASS (4/4)
3. **State Administration API Hub (P1 & P2 Connectors):** PASS (7/7)
4. **Mapa Subjektů & Registr Integration:** PASS (9/9)
5. **Judgment AI Extractor -> Case Persistence Integration:** PASS (3/3)
6. **Compile Verification (`compile_applet`):** BUILD SUCCESS
7. **Typecheck & Linter (`lint_applet`):** PASS (0 chyb)

---

## 4. Bezpečnostní a architektonické zásady

- **Fail-Closed & Zero Synthetic Data:** Systém nikdy nedoplňuje smyšlená data právní moci nebo neověřené finanční částky.
- **Ochrana soukromí (GDPR / PII):** Žádné osobní ani rodinné údaje nejsou logovány do aplikačních logů.
- **RBAC & BOLA/IDOR:** Každá manipulace se spisem je striktně vázána na ověřeného vlastníka spisu (`requestingUser.id == case.ownerId || case.userId`).
