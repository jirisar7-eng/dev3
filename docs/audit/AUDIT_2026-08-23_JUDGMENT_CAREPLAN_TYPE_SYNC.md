# Auditní Report: CarePlanType & Idempotent Sync Fix v Judgment Import
**Datum a čas auditu:** 2026-08-23 19:52:30 UTC  
**Název úkolu:** Oprava Judgment Import / CarePlanType a idempotentního importu  
**Větev:** `feature/careplan-type-idempotent-sync-fix`  
**Commit SHA:** `7f96b4deaafab00b80ae7281619ec8fc0d14b86f`  

---

## 1. Výchozí stav & Identifikovaný problém
Při předchozím auditu byly identifikovány nekonzistence v modulu **Judgment Import**:
1. V `src/services/clientCaseService.ts` a `src/components/case/care/CareSimulatorModal.tsx` docházelo k předávání hodnot `'ALTERNATING'` nebo `'ASYMMETRIC'` do vlastnosti `type` objektu `CarePlan`.
2. V Prisma schématu je enum `CarePlanType` definován striktně s hodnotami `CURRENT`, `PROPOSED`, `SIMULATION`.
3. V `src/types/index.ts` byl typ `CarePlanType` označen volně (`| 'ALTERNATING' | 'ASYMMETRIC' | string`), což zakrývalo chybu před kompilátorem TypeScriptu.
4. Při opakovaném importu rozsudku chyběla garance přechodu předchozích aktivních plánů do stavu `DRAFT` v paměťové vrstvě, což vedlo k riziku více aktivních plánů v témže spisu.

---

## 2. Provedené změny (Změněné soubory)

### A. `src/types/index.ts`
- Zpřísněn `CarePlanType` výhradně na platné hodnoty Prisma enumu:
  ```ts
  export type CarePlanType = 'CURRENT' | 'PROPOSED' | 'SIMULATION';
  export type CarePlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'PROPOSED';
  export type CarePlanSource = 'MANUAL' | 'JUDGMENT_IMPORT' | 'SIMULATION_TEMPLATE';
  ```

### B. `src/services/clientCaseService.ts`
- Při vytvoření `CarePlan` z rozsudku (v Prisma i záložním objektu) je striktně nastavena hodnota `type: 'CURRENT'`.
- V ne-databázové (in-memory `dbStore`) vrstvě je před přidáním nového plánu provedena deaktivace předchozích `ACTIVE` plánů na `DRAFT`.
- Zajištěno pročištění kalendářních událostí s filtrem `sourceType === 'CARE_PLAN'`, přičemž `MANUAL` události v kalendáři zůstávají nedotčeny.

### C. `src/services/care/carePlanService.ts`
- Sanitizována metoda `createPlan` a `updatePlan` tak, že neplatné hodnoty `type` spadnou na výchozí platný `CarePlanType`.
- Doplněna typová sanitace bez použití nebezpečných `as any` přetypování pro `status` a `type`.

### D. `src/components/case/care/CareSimulatorModal.tsx`
- Opraveno předávání `type` při ukládání plánu ze simulátoru z neplatných hodnot na `type: status === 'PROPOSED' ? 'PROPOSED' : 'SIMULATION'`.

### E. `src/tests/judgmentSyncAudit.test.ts`
- Rozšířeny testovací aserce pro ověření:
  - `CarePlan.type === 'CURRENT'`.
  - Správné funkce `conflictDetected === true` při opakovaném importu bez `forceApply`.
  - Idempotentního nahrazení s `forceApply = true` s výsledkem právě **1 ACTIVE** plán na spis.
  - Zachování manuálně vytvořených událostí v kalendáři spisu.

---

## 3. Výsledky testů a verifikace

1. **Typová kontrola (Linter / TypeScript)**:
   ```bash
   npm run lint (tsc --noEmit) -> PASSED (0 errors)
   ```
2. **Výsledky automatizovaných testovacích sad**:
   - `src/tests/judgmentSyncAudit.test.ts`: **13 PASSED, 0 FAILED**
   - `src/tests/careHubHardening.test.ts`: **29 PASSED, 0 FAILED**
   - `src/tests/careHubProductionReadinessAudit.test.ts`: **15 PASSED, 0 FAILED**
   - `src/tests/judgmentParserRegression.test.ts`: **13 PASSED, 0 FAILED**

3. **Produkční build (`npm run build`)**:
   ```bash
   vite build -> SUCCESS (dist/ generated cleanly)
   ```

---

## 4. Bezpečnostní a datová kontrola
- **Secrets check**: Neobsahuje žádná hesla, API klíče ani credentials.
- **Data integrity**: Nedošlo k žádným destruktivním zásahům do databáze ani schématu Prisma.
- **Git status**: Pracovní větev `feature/careplan-type-idempotent-sync-fix` čistá, pushnuto na remote repository. `main` větev nedotčena.

---

## 5. Závěr a připravenost
Všechna kritéria ze zadání byla v plném rozsahu splněna a verifikována.
**FINAL VERDICT: READY FOR MERGE TO MAIN**
