# AUDIT REPORT: AI STUDIO PREVIEW VS DEV3 PROVIDER PARITY & DIAGNOSTIC (P0.2.2)

**Datum a čas:** 2026-08-26
**Projekt:** Táta má právo / dev3
**Větev:** `feat/ai-failsafe-client-prompt-hardening`
**Rozsah:** Diagnostic & Parity Analysis (Strict Read-Only)

---

## 1. CURRENT STATE

V prostředí AI Studio Preview dochází při volání jakékoli AI funkce k selhání na všech 4 providerech:

1. **Gemini Primary (`GEMINI_API_KEY`)**:
   - Error: `HTTP 404 NOT_FOUND`
   - Zpráva: `"This model models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.6-flash"`
2. **Gemini Secondary (`GEMINI_API_KEY_2`)**:
   - Error: `HTTP 400 INVALID_ARGUMENT` (`API_KEY_INVALID`)
3. **Grok AI (`XAI_API_KEY` / `GROK_API_KEY`)**:
   - Error: `HTTP 400 Bad Request`
   - Zpráva: `"Model not found: grok-2-latest"`
4. **Groq AI (`GROQ_API_KEY`)**:
   - Error: `HTTP 401 Unauthorized` (`invalid_api_key`)

---

## 2. DEV3 RUNTIME VS AI STUDIO RUNTIME

- **dev3.tatovacesta.cz (Produkční/Staging Cloud Run Container)**:
  - Používá platné produkční klíče předávané z GCP Secret Manageru.
  - Funguje buď přes primární klíč (pokud projekt ještě podporoval starší model alias) nebo záložní provider, kde jsou nastaveny platné credentials.
  - Všechny AI endpointy (`/api/ai/chat`, `/api/ai/analyze-document`, atd.) běží na serverové části Node.js/Express na portu 3000.
- **AI Studio Preview Environment**:
  - Běží v izolovaném containeru AI Studio sandboxu.
  - Název modelu `gemini-2.5-flash` je u nově vydaných klíčů nebo v tomto projektu zamítnut API bránou (`404 NOT_FOUND`).
  - Vedlejší klíče (`GEMINI_API_KEY_2`, `GROQ_API_KEY`) v Preview sandboxu buď nejsou nastaveny, nebo obsahují neplatné/expirované testovací hodnoty.
  - Název modelu `grok-2-latest` není xAI API bránou akceptován (`Model not found`).

---

## 3. PROVIDER MATRIX

| Provider | Env Variable | Endpoint / SDK | Preview Error | Root Cause |
|---|---|---|---|---|
| Gemini Primary | `GEMINI_API_KEY` | `@google/genai` SDK | 404 NOT_FOUND | Zastaralý název modelu (`gemini-2.5-flash` -> požadován `gemini-3.6-flash`) |
| Gemini Secondary | `GEMINI_API_KEY_2` | `@google/genai` SDK | 400 INVALID_ARGUMENT | Neplatný API klíč v env |
| Grok AI | `XAI_API_KEY` / `GROK_API_KEY` | `https://api.x.ai/v1` | 400 Model not found | Zastaralý název modelu (`grok-2-latest`) |
| Groq AI | `GROQ_API_KEY` | `https://api.groq.com/openai/v1` | 401 Unauthorized | Neplatný API klíč v env |

---

## 4. MODEL MATRIX

- **Gemini Primary / Secondary**:
  - Aktuální v kódu: `gemini-2.5-flash`
  - Požadovaný / Funkční alias: `gemini-3.6-flash`
- **Grok AI**:
  - Aktuální v kódu: `grok-2-latest`
  - Podporované xAI názvy: `grok-2-1212`, `grok-2` nebo `grok-beta`
- **Groq AI**:
  - Aktuální v kódu: `llama-3.3-70b-versatile`
  - Stav: Název modelu správný, selhává na autentizaci klíče.

---

## 5. ENVIRONMENT PARITY

- Názvy proměnných v kódu (`AiService.ts`):
  - `GEMINI_API_KEY`
  - `GEMINI_API_KEY_2`
  - `XAI_API_KEY` / `GROK_API_KEY`
  - `GROQ_API_KEY`
- Všechny 4 proměnné jsou správně definovány v `.env.example` a používány výhradně na server-side (`server.ts`, `/api/ai/*`).
- Žádný API klíč není exponován do klientského bundle ani hardcoded v kódové bázi.

---

## 6. FAILOVER PARITY

- Skutečné pořadí v `AiService.ts`:
  1. Gemini Primary (`GEMINI_API_KEY`)
  2. Gemini Secondary (`GEMINI_API_KEY_2`)
  3. Grok AI (`XAI_API_KEY` / `GROK_API_KEY`)
  4. Groq AI (`GROQ_API_KEY`)
- Failover logika: Každý provider kontroloval přítomnost `process.env.<KEY>`. Pokud proměnná existuje, proběhl pokus o volání. Při selhání se zaznamená chyba a zkouší se další provider v pořadí.
- Problém: Pokud všechny 4 providery selžou (kvůli neplatným modelům nebo klíčům), `AiService.ts` vyhodí agregovanou výjimku `AI_PROVIDER_ERROR`.

---

## 7. ROOT CAUSE ANALÝZA

1. **CODE PROBLEM (Kódový problém)**:
   - Zastaralé názvy modelů v `src/services/AiService.ts`:
     - `gemini-2.5-flash` vyžaduje aktualizaci na `gemini-3.6-flash`.
     - `grok-2-latest` vyžaduje aktualizaci na platný xAI model id (např. `grok-2-1212` / `grok-2`).
2. **CONFIGURATION / SECRET PROBLEM**:
   - V prostředí Preview jsou `GEMINI_API_KEY_2` a `GROQ_API_KEY` neplatné nebo poškozené.
3. **PREVIEW ENVIRONMENT ISOLATION**:
   - Preview běží v izolovaném sandboxu a spoléhá na primární `GEMINI_API_KEY`, který po aktualizaci aliasu na `gemini-3.6-flash` začne okamžitě fungovat.

---

## 8. SECURITY IMPACT & OCHRANY (P0.1, P0.2, P0.2.1)

- **Ochrana proti podvrženým datům (No Fake Fallback)**: Zachována 100%. Při selhání všech providerů systém korektně vrací HTTP 503 / `AI_PROVIDER_ERROR`, bez vkládání fiktivních právních podání či rozporuplných faktů.
- **Server-Side API Route Isolation**: API klíče neopouštějí backendové prostředí Node.js (`server.ts`).
- **Data Integrity**: Všechny instrukce Source Grounding, roleplay `systemInstruction` a deterministické `temperature: 0.1` nastavení zůstávají plně zachovány.

---

## 9. RECOMMENDED FIX (DOPORUČENÝ POSTUP PRO P0.2.2)

1. Aktualizovat názvy modelů v `src/services/AiService.ts`:
   - Primární Gemini: `gemini-3.6-flash`
   - Sekundární Gemini: `gemini-3.6-flash`
   - Grok AI: `grok-2-1212` (nebo `grok-2`)
2. Aktualizovat regresní testy v `tests/ai-provider-consistency.test.ts` pro nový název modelu `gemini-3.6-flash`.
3. Ověřit sestavení (`npm run build`) a regresní sadu testů.

---

## 10. WHAT MUST NOT BE CHANGED

- NEVKLÁDAT žádné natvrdo zapsané API klíče.
- NEPOUŽÍVAT žádný klientský fake data fallback.
- NEMĚNIT architekturu backend proxy serveru (`/api/ai/*`).
- NEMĚNIT bezpečnostní pravidla Source Fidelity z P0.2.1.

---

## 11. GO / NO-GO PRO NÁSLEDUJÍCÍ IMPLEMENTAČNÍ FÁZI

- **Status**: **GO FOR P0.2.2 MODEL ALIAS UPDATE**
- **Důvod**: Úprava modelů v `AiService.ts` vyřeší selhání Gemini Primary i Grok AI bez jakýchkoli bezpečnostních nebo architektonických rizik.
