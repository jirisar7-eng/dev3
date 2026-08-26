# AUDIT REPORT: P0.2 AI FAIL-SAFE & CLIENT PROMPT HARDENING

**Datum a čas:** 2026-08-25
**Projekt:** Táta má právo / dev3
**Repo:** `/var/www/tatovacesta_dev3`
**Pracovní větev:** `feat/ai-failsafe-client-prompt-hardening`
**Úkol:** P0.2 — AI Fail-Safe & Client Prompt Hardening

---

## 1. CÍL ÚKOLU A ROZSAH
Odstranit všechny klientské fake-data AI fallbacky a zabránit klientovi v předávání vlastního `systemPrompt` backendu. Při selhání AI (runtime chyba, rate-limit 429, nedostupnost 503) musí systém vrátit skutečnou chybovou odpověď s HTTP status kódem a uživatelské rozhraní zobrazí chybový alert s tlačítkem „Zkusit znovu“ (Retry).

---

## 2. PROVEDENÉ ZMĚNY A DOTČENÉ SOUBORY

### Backend (`src/routes/aiRoutes.ts`):
1. **Server-Side System Prompts:** Odstraněna možnost přijímat `systemPrompt` z těla klientského požadavku. Režim systému je určován výhradně server-side na základě parametru `mode` nebo `scenarioId`.
2. **Server-Side System Instruction Propagation:** Všechna volání `AiService.generateContent` předávají `systemInstruction` serverově.
3. **Odstranění Server-Side Fake JSON Fallbacků:** Odstraněny všechny `catch` bloky vracející statické JSON objekty při selhání `JSON.parse` nebo LLM.
4. **Vylepšený Error Status Code Mapping:** Správné předávání HTTP 429 (Rate Limit) a 503 (Service Unavailable) klientovi s jasným chybovým hlášením v češtině.

### Frontend:
1. **`src/components/public/ai/AiSimulatorView.tsx`:**
   - Odstraněn `getFallbackCounterpartReply` a `getFallbackEvaluation`.
   - Aktualizován klientský kontrakt volání `/api/ai/chat` (zasílá `mode: 'simulator'`, `scenarioId`, `scenarioTitle`, `counterpartName`).
   - Přidány stavové proměnné `chatError` a `evalError` s UI indikací a tlačítkem „Zkusit znovu“.
2. **`src/components/public/ai/AiAssistantView.tsx`:**
   - Odstraněn `getFallbackReply` a klientský regex fallback pro BIFF konverzi.
   - Aktualizováno volání `/api/ai/chat` (zasílá `mode: 'assistant'`).
   - Přidány stavové proměnné `chatError` a `biffError` s UI indikací a tlačítkem „Zkusit znovu“.
3. **`src/components/public/ai/AiCaseManagerView.tsx`:**
   - Odstraněn klientský fallback v `handleAnalyze`.
   - Přidána stavová proměnná `analysisError` s UI indikací a tlačítkem „Zkusit znovu“.

---

## 3. SECURITY & INTEGRITY CHECK
- **Secrets Audit:** PASS (Žádná hesla, API klíče ani secrets v kódu nebo auditu).
- **No Mock/Fake Data in Production Path:** PASS (Všechny fake AI fallbacky kompletně odstraněny).
- **Client Prompt Injection Resistance:** PASS (Klient již nemůže přepsat serverové instrukce zasláním políčka `systemPrompt`).

---

## 4. VÝSLEDKY TESTŮ A VALIDACE
- `lint_applet` (tsc --noEmit): **PASS** (Bez chyb)
- `compile_applet` (npm run build): **PASS** (Build úspěšný)

---

## 5. ZÁVĚR & GIT STATUS
- Všechny úpravy byly provedeny v souladu s P0.2 specifikací a pravidly systému.
- Připraveno ke commitu a pushi na pracovní větev `feat/ai-failsafe-client-prompt-hardening`.
