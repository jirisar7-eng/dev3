# AUDIT: Synchronizace rozsudků, pravidel péče a kalendáře (CoParent Hub & Opatrovnický spis)

**Datum a čas:** 2026-08-23 14:05 CET  
**Projekt:** Táta má právo (dev3)  
**Větev:** main  
**Oblast:** CoParent Hub → AI Extractor rozsudků → Pravidla péče (Care Rules) → Kalendář (CaseEvent & CoParentEvent) → Mezimodulová synchronizace  
**Autor:** Hlavní softwarový architekt & DevSecOps auditor  

---

## 1. Cíl auditu a výchozí stav

### 1.1 Výchozí problém
AI Extractor rozsudků (`JudgmentParserService`) byl úspěšně opraven a robustně extrahuje strukturovaná data ze soudních rozhodnutí a dohod o péči. Následný datový tok z extrahovaných dat do reálných modulů aplikace však vykazoval mezery:
1. **Asymetrické rozvrhy a parita týdnů:** V reálných rozsudcích (např. *Okresní soud v Pardubicích, sp. zn. 13 Nc 11/2026*, rozhodnutí z 9. 6. 2026, dítě *Štěpán Šár*) je péče často asymetrická podle sudého a lichého týdne (např. sudý týden: Po 08:45–15:30, Pá 08:45–15:30; lichý týden: Po 08:45–15:30, St 08:45–15:30, Pá 08:45–15:30). Původní generátor kalendáře předpokládal symetrické bloky (7/7, 2-2-3).
2. **Časové intervaly během dne:** Původní logika neuměla plně zohlednit časový rozsah (např. 08:45–15:30) jako denní blok styku bez přenocování (`isOvernight: false`).
3. **Platnost a účinnost:** Chyběla explicitní kontrola data nabytí právní moci / vykonatelnosti (`effectiveDate`). Pokud datum chybí, stav musí být `REQUIRES_CONFIRMATION`.
4. **Idempotence a dohledatelnost (Provenance):** Opakovaný import stejného rozsudku nesmí duplikovat události v kalendáři a každá událost musí být trasovatelná k původnímu rozsudku (`sourceDocumentId` / `carePlanId`).

---

## 2. Analýza současného stavu v kódu

### 2.1 Zkoumané komponenty a toky dat
1. **`src/services/judgmentParserService.ts`**:
   - Extrahuje `JudgmentExtractedData` obsahující `caseNumber`, `court`, `judgmentDate`, `effectiveDate`, `childName`, `childBirthDate`, `custodyType`, `scheduleType`, `evenWeek`, `oddWeek`, `handoverStartTime`, `handoverEndTime`, `handoverLocation`, `alimonyAmount`, `alimonyDueDate`, `holidaysRule`.
2. **`src/controllers/coparentController.ts` & `src/services/coparentService.ts`**:
   - `CoParentService.applyJudgmentSetup`: Vytváří/aktualizuje `CoParentChild`, generuje záznamy `CoParentExpense` pro výživné, vytváří `CoParentAgreement` a vkládá události `CoParentEvent` na 60 dní dopředu.
3. **`src/routes/caseRoutes.ts` & `src/services/clientCaseService.ts`**:
   - `ClientCaseService.applyJudgmentToCase`: Aktualizuje spis (`Case`), dítě (`Child`), volá `CarePlanService.createPlan` a `CarePlanService.syncPlanToCaseCalendar`.
4. **`src/services/care/carePlanService.ts`**:
   - `generateDaysSequence`: Generuje sekvenci `CareDay`.
   - `syncPlanToCaseCalendar`: V atomické transakci maže předchozí události s `sourceType: 'CARE_PLAN'` a vkládá nové `CaseEvent` pro předání.

---

## 3. Posouzení databázového schématu (Prisma DB Schema)

### 3.1 Otázka: Je nutná změna databázového schématu?
**ZÁVĚR: ZMĚNA DATABÁZOVÉHO SCHÉMATU NENÍ NUTNÁ (NO DB SCHEMA CHANGE REQUIRED).**

### 3.2 Zdůvodnění:
Existující modely v `prisma/schema.prisma` mají dostatečnou flexibilitu:
- `CarePlan`:
  - `rotationPattern` (String): Pojme jak standardní šablony (`7/7`, `2-2-3`), tak `EVEN_ODD_WEEKS` nebo `CUSTOM`.
  - `metricsJson` (Text): Umožňuje uložit strukturovaná pravidla, intervaly a metriky.
  - `notes` (Text): Ukládá kompletní právní citaci a metadata rozsudku.
  - `startDate` a `endDate`: Podporují časovou platnost a účinnost.
- `CareDay`:
  - `date`, `dayOfWeek`, `assignedParent`, `isOvernight`, `isHandover`, `handoverTime`, `notes`.
- `CaseEvent`:
  - `sourceType: 'CARE_PLAN'`, `carePlanId`, `careDayId`, `eventDate`, `location`, `title`, `description`.
- `CoParentEvent`:
  - `spaceId`, `title`, `description`, `startDate`, `endDate`, `category`.
- `CoParentExpense` & `CoParentAgreement`:
  - Zajišťují evidenci výživného a textu soudní dohody.

Všechny požadované funkce lze plně implementovat na aplikační úrovni pomocí doménového vzoru **Structured Rule-Based Engine** bez rizika nekompatibility či nutnosti destruktivních migrací databáze.

---

## 4. Návrh cílové architektury: `CourtDecision` → `CareRules` → `Calendar`

```
┌────────────────────────────────────────────────────────┐
│             Soudní rozsudek / Dohoda (PDF/Text)        │
└──────────────────────────┬─────────────────────────────┘
                           │ (AI / Regex Extractor)
                           ▼
┌────────────────────────────────────────────────────────┐
│             JudgmentExtractedData                      │
│ (sp. zn., soud, dítě, lichý/sudý týden, časy, výživné) │
└──────────────────────────┬─────────────────────────────┘
                           │ (Strukturovaná validace)
                           ▼
┌────────────────────────────────────────────────────────┐
│               CareRulesEngine                          │
│ - Parita ISO týdne (Even/Odd Week)                     │
│ - Denní časové intervaly (např. 08:45–15:30)           │
│ - Validace účinnosti (effectiveDate)                   │
│ - Klasifikace přenocování (isOvernight: false)         │
└──────────────────────────┬─────────────────────────────┘
                           │ (Uživatelské schválení v UI)
                           ▼
┌────────────────────────────────────────────────────────┐
│         Idempotentní synchronizátor kalendáře          │
│ - Smazání zastaralých generovaných událostí            │
│ - Zachování ručních uživatelských událostí             │
│ - Generování CaseEvent (Opatrovnický spis)             │
│ - Generování CoParentEvent (CoParent Hub)              │
│ - Uložení výživného do CoParentExpense                 │
│ - Provázání s auditním záznamem a sourceDocumentId     │
└────────────────────────────────────────────────────────┘
```

---

## 5. Klíčová pravidla implementace

1. **Parita kalendářních týdnů (ISO 8601):**
   Výpočet sudého/lichého týdne musí striktně dodržovat ISO 8601 (týden začíná pondělím, 1. týden roku obsahuje první čtvrtek).
2. **Časové intervaly a denní styk:**
   Pokud styk probíhá v rámci jednoho dne (např. 08:45–15:30), událost má začátek v 08:45 a konec v 15:30 téhož dne. `isOvernight` je nastaveno na `false`.
3. **Idempotence:**
   Při opakovaném schválení stejného rozsudku synchronizátor atomicky vyčistí dříve vygenerované události daného plánu a vytvoří aktuální, aniž by došlo ke zdvojení událostí v kalendáři.
4. **Trasovatelnost:**
   Všechny kalendářní záznamy obsahují vazbu na `carePlanId` nebo referenci rozsudku v popisu (`description`), což umožňuje auditní stopu a snadné hromadné úpravy.

---

## 6. Verifikace a testovací plán

Vytvořit komplexní integrační a regresní testovací sadu v `src/tests/judgmentSyncAudit.test.ts` pokrývající:
1. Extrakci a normalizaci asymetrického rozvrhu (Pardubice rozsudek).
2. Generování sudých a lichých týdnů se správnou paritou ISO.
3. Správné nastavení časových intervalů (08:45–15:30).
4. Idempotenci při opakovaném volání synchronizace.
5. Správné vytvoření záznamu výživného (1 500 Kč měsíčně k 15. dni).
6. Ochranu před neautorizovaným přístupem a integritu dat.

---

## 7. Výsledek auditu
- **Stav:** AUDIT COMPLETED — PŘIPRAVENO K IMPLEMENTACI
- **Bezpečnostní rizika:** Žádná nová rizika; zachována striktní RBAC kontrola na backendu.
- **Dopad na databázi:** 0 změn schématu, plně kompatibilní s produkční PostgreSQL databází.
