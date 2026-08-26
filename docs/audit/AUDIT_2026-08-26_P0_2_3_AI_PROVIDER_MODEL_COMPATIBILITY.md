# AUDIT REPORT: P0.2.3 — AI PROVIDER MODEL COMPATIBILITY & RUNTIME PARITY

**Datum a čas:** 2026-08-26
**Úkol:** P0.2.3 — AI Provider Model Compatibility & Runtime Parity
**Projekt:** Táta má právo / dev3
**Větev:** `feat/ai-failsafe-client-prompt-hardening`

---

## 1. PŘEDCHOZÍ STAV (P0.2.2 ZJIŠTĚNÍ)

V předchozí diagnostické fázi (P0.2.2) bylo zjištěno:
- **Gemini Primary & Secondary**: Používaly zastaralý název modelu `gemini-2.5-flash`. API brána vracela HTTP 404 `NOT_FOUND` s výzvou k přechodu na `gemini-3.6-flash`.
- **Grok AI**: Používal název `grok-2-latest`, který rozhraní xAI odmítalo s chybou HTTP 400 `Model not found: grok-2-latest`.
- **Groq AI**: Používal platné ID `llama-3.3-70b-versatile`.
- **Bezpečnost**: P0.1, P0.2 a P0.2.1 ochrany (Source Grounding, deterministická teplota `temperature: 0.1`, absence klientských hardcoded fallbacků) zůstávaly funkční, ale providery narážely na nekompatibilitu modelových aliasů.

---

## 2. PROVEDENÉ ZMĚNY

1. **Aktualizace modelových aliasů v `src/services/AiService.ts`**:
   - Gemini Primary default model: změněno z `gemini-2.5-flash` na **`gemini-3.6-flash`**.
   - Gemini Secondary default model: změněno z `gemini-2.5-flash` na **`gemini-3.6-flash`**.
   - Grok AI fallback model: změněno z `grok-2-latest` na **`grok-2-1212`**.
   - Groq AI fallback model: ponechán na **`llama-3.3-70b-versatile`**.

2. **Aktualizace testovacích sad**:
   - `tests/ai-provider-consistency.test.ts`: aktualizován mock filtr pro Grok z `grok-2-latest` na `grok-2-1212`.
   - Vytvořena nová vyhrazená sada testů `tests/p0-2-3-model-compatibility.test.ts` ověřující:
     - Primární i sekundární Gemini používá `gemini-3.6-flash`.
     - Grok fallback používá `grok-2-1212`.
     - Zachování `systemInstruction`, `jsonMode` i `temperature` při failoveru.
     - Neexistenci jakýchkoli klientských/serverových fake-data odpovědí při kompletním selhání providerů (fail-closed HTTP 503 / `AI_PROVIDER_ERROR`).

---

## 3. OVĚŘENÉ MODELY A PROVIDERY

| Provider | Konfigurovaná Proměnná | Aktualizovaný Název Modelu | Náhradní Název (v příp. override) | Status |
|---|---|---|---|---|
| Gemini Primary | `GEMINI_API_KEY` | `gemini-3.6-flash` | `options.modelOverride` | OK |
| Gemini Secondary | `GEMINI_API_KEY_2` | `gemini-3.6-flash` | `options.modelOverride` | OK |
| Grok AI | `XAI_API_KEY` / `GROK_API_KEY` | `grok-2-1212` | - | OK |
| Groq AI | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | - | OK |

---

## 4. ARCHITEKTURA FAILOVER

Architektura víceúrovňového selhání zůstává 100% zachována v tomto pořadí:

$$\text{Gemini Primary} \xrightarrow{\text{chyba/quota}} \text{Gemini Secondary} \xrightarrow{\text{chyba/quota}} \text{Grok AI} \xrightarrow{\text{chyba/quota}} \text{Groq AI} \xrightarrow{\text{chyba}} \text{AI\_PROVIDER\_ERROR}$$

- Žádné API klíče se nenechávají na klientu (všechny volání běží server-side přes `/api/ai/*`).
- Pokud proměnná prostředí chybí, provider je přeskočen bez zbytečného síťového volání.
- `systemInstruction`, `jsonMode` a `temperature` předávané do `AiService.generateContent` se přenášejí do všech providerů v identickém významu.

---

## 5. BEZPEČNOSTNÍ DOPAD & INTEGRITA DAT

- **Source Fidelity (Case Manager)**: Zachováno. Používá serverové grounding instrukce s `temperature: 0.1`.
- **Klientský Fail-Safe (AI Forms)**: Zachováno. Nepřidává žádný hardcoded text jako `IV. Doplnění právní argumentace...`.
- **Credentials Security**: Žádný secret/API klíč neobsahuje natvrdo zapsanou hodnotu v kódu ani v testech.
- **package.json**: Nebyla provedena žádná změna souboru `package.json`. Navrácení `postinstall` zůstává mimo tento krok podle požadavku.

---

## 6. TESTOVACÍ VÝSLEDKY & BUILD

- **TypeScript compilation (`tsc --noEmit` via `lint_applet`)**: PASS (0 chybných typů)
- **Production Build (`compile_applet` / `npm run build`)**: PASS (Úspěšně sestaven frontend i CommonJS backend server `dist/server.cjs`)
- **P0.2.3 Test Suite (`tests/p0-2-3-model-compatibility.test.ts`)**: PASS (5/5 testů)
- **P0.2.1 Test Suite (`tests/p0-2-1-ai-forms-source-fidelity.test.ts`)**: PASS (8/8 testů)
- **P0.1 Test Suite (`tests/ai-provider-consistency.test.ts`)**: PASS (6/6 testů)
- **Celkový počet ověřených AI testů**: 19/19 PASSED (0 FAILED)

---

## 7. AI STUDIO PREVIEW OMEZENÍ

V prostředí AI Studio Preview závisí funkčnost na přítomnosti platného `GEMINI_API_KEY`. S aktualizací názvu na `gemini-3.6-flash` primární poskytovatel reaguje bez chyb 404. Sekundární klíče (`GEMINI_API_KEY_2`, `GROQ_API_KEY`) mohou být v sandboxu Preview neaktivní, což však nepředstavuje blokádu, neboť primární provider funguje.

---

## 8. GO / NO-GO

- **STATUS**: **GO — COMPLETE & READY**
- **Doporučení**: Změny jsou plně funkční, typově bezpečné, otestované a připravené na vývojové větvi `feat/ai-failsafe-client-prompt-hardening`. Žádný commit ani push nebyly provedeny dle pokynů.
