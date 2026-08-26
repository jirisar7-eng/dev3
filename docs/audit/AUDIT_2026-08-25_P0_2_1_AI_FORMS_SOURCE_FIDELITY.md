# AUDIT REPORT: P0.2.1 — AI FORMS FAIL-SAFE & CASE MANAGER SOURCE FIDELITY

**Datum a čas:** 2026-08-25
**Projekt:** Táta má právo / dev3
**Pracovní větev:** `feat/ai-failsafe-client-prompt-hardening`
**Úkol:** P0.2.1 — AI Forms Fail-Safe & Case Manager Source Fidelity

---

## 1. CÍL ÚKOLU A ROZSAH

Úkolem fáze P0.2.1 bylo dokončit odstranění klientských fake-data AI fallbacků v modulové složce AI Forms (`AiFormsView.tsx`), implementovat přísnou věrnost zdroji (Source Grounding) pro analýzu dokumentů v Case Manageru (`/api/ai/analyze-document`) a obnovit standardní stav souboru `package.json`.

---

## 2. PROVEDENÉ ZMĚNY A DOTČENÉ SOUBORY

### A. Frontend — AI Forms (`src/components/public/ai/AiFormsView.tsx`):
1. **Odstranění klientského hardcoded fallbacku:** Při chybě AI (síťové selhání, rate-limit 429, timeout, chybný rozsah odpovědi) byl odstraněn statický text podání (`IV. Doplnění právní argumentace...`).
2. **Zachování uživatelského obsahu:** Při selhání požadavku zůstává rozpracovaný text dokumentu i zadaný prompt uživatele netknut.
3. **Error State & Retry UI:** Přidána stavová proměnná `aiRefineError` zobrazující chybové hlášení s tlačítkem „Zkusit znovu“ (Retry). Tlačítko `Retry` používá uložený `lastCustomPrompt` bez rizika duplikování textu.

### B. Backend — Case Manager Source Fidelity (`src/routes/aiRoutes.ts`):
1. **Strict Grounding System Instruction:** U endpointu `/api/ai/analyze-document` přidán serverový `systemInstruction` vynucující, že předaný dokument je jediným autoritativním zdrojem faktů.
2. **Deterministic Extraction:** Nastavena `temperature: 0.1` pro eliminaci AI halucinací.
3. **Ochrana proti vymyšleným datům:** Pevně zakázáno vymýšlení datumů (např. `"12.5."`), neexistujících e-mailů, nepodložených písemných návrhů, fiktivních osob, nepředložených důkazů a svévolných soudních závěrů. Pokud informace v dokumentu chybí, AI vrací pole jako prázdné nebo označuje hodnota jako neuvedenou (`UNKNOWN`).
4. **Contradiction Evidence Rule:** Zakázáno označovat jakékoli tvrzení za rozporuplné, pokud v textu neexistují přímé oboustranné důkazy pro dvě protichůdná fakta.

### C. Testovací sada (`tests/p0-2-1-ai-forms-source-fidelity.test.ts` & `scripts/test-runner.js`):
1. Přidána kompletní sada 8 regresních testů pokrývajících fail-safe chování AI Forms, UI pro Retry, věrnost zdrojovému dokumentu, pravidlo pro rozporuplnost i čistou propagaci chyb.
2. Registrace testovacího modulu v `scripts/test-runner.js`.

### D. Revert `package.json`:
1. Navrácen původní skript `"postinstall": "prisma generate"` v sekci `scripts`. `package.json` je v identickém stavu vůči výchozí věkvi.

---

## 3. SECURITY & INTEGRITY CHECK

- **Secrets Audit:** PASS (Žádná hesla, API klíče ani credentials v kódu ani auditu).
- **No Mock/Fake Data in Production Path:** PASS (Žádné statické právní texty ani podvržená data v produkčním kódu).
- **Data Integrity:** PASS (Při selhání AI nedochází k přepisu rozpracovaného uživatelského textu).
- **Branch Strategy:** PASS (Vývoj a commit výhradně na věkvi `feat/ai-failsafe-client-prompt-hardening`, bez zásahu do `main`).

---

## 4. VÝSLEDKY TESTŮ A VALIDACE

- **Regresní testovací sada P0.2.1 (`tests/p0-2-1-ai-forms-source-fidelity.test.ts`):** 8/8 PASS.
- **TypeScript Kontrola (`tsc --noEmit`):** PASS (0 chybných typů).
- **Production Build (`npm run build`):** PASS (Prisma generate, Vite build i ESBuild serveru proběhly úspěšně).

---

## 5. REGRESSION SCAN

Následující výrazy byly zkontrolovány napříč AI moduly (`AiSimulatorView`, `AiAssistantView`, `AiCaseManagerView`, `AiFormsView`, `/api/ai/chat`, `/api/ai/analyze-document`):

- `getFallback`: **SAFE** (Žádný výskyt v produkčním AI kódu).
- `12.5.`: **SAFE** (Použito výhradně jako záporný příkaz pro AI v serverovém system promptu).
- `hardcoded právní`: **TEST ONLY** (Použito v popisu testovacích scénářů).
- `fallback`: **SAFE** (Pouze v bezpečné DB fallback funkci `loadFallbackProfile`).

---

## 6. GIT STATUS & COMMIT

- **Změněné soubory:**
  - `src/components/public/ai/AiFormsView.tsx`
  - `src/routes/aiRoutes.ts`
  - `tests/p0-2-1-ai-forms-source-fidelity.test.ts`
  - `scripts/test-runner.js`
  - `docs/audit/AUDIT_2026-08-25_P0_2_1_AI_FORMS_SOURCE_FIDELITY.md`
- **Původní stav obnoven:** `package.json` revertován.
- **Commit Message:** `fix(ai): P0.2.1 forms fail-safe and source fidelity`
- **Cílová větev:** `feat/ai-failsafe-client-prompt-hardening` (nikoli `main`).
