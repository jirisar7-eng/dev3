# PRE-IMPLEMENTATION AUDIT – FÁZE 6C: AI TELEMETRY, USAGE, LATENCY & COST CENTER

**Datum a čas:** 2026-08-29 13:22:00 UTC  
**Název úkolu:** Pre-Implementation Audit Fáze 6C – AI Telemetry, Usage, Latency & Cost Center  
**Projekt:** „Táta má právo“ (dev3)  
**Větev:** `feat/faze-6b-orion-visualization-trace-center` (Base: `origin/main` `a38286cd3f5f3394d4b58f1b2819329c69d35f1b`)  
**Režim:** STRICT READ-ONLY AUDIT (Žádné změny v kódové bázi, žádný commit, žádný push, žádný merge)

---

## 1. ZÁKLADNÍ ZJIŠTĚNÍ A REŽIM PODMÍNEK

Předběžný audit prověřil celý stávající AI ekosystém v projektu `dev3` za účelem návrhu bezpečného, 0-PII a vysoce efektivního **AI Telemetry & Cost Center** v rámci existující administrace (`/administrace/operace?subtab=telemetry`), aniž by vznikaly duplicitní komponenty nebo byly zaváděny destruktivní změny v databázi.

### Klíčová fakta:
- **ŽÁDNÁ ZMĚNA DATABÁZE (NO DATABASE CHANGE):** Veškerá metrická data telemetrie jsou a zůstanou zpracovávána in-memory pomocí rozšířeného `aiStatsManager` s lehkým kruhovým paměťovým bufferem.
- **NEVYTVÁŘET NOVOUPARALELNÍ ADMINISTRACI:** Telemetrie již má své přirozené místo v `AiTelemetryCard.tsx`, která je plně integrovaná jako záložka (`telemetry`) v `UnifiedOperationsCenter.tsx` (`/administrace/operace`).
- **0-PII GUARANTEE:** Telemetrie eviduje výhradně metadata volání (ID modelu, provider, token prompt/completion, latenci v ms, HTTP/Error status, timestamp). Nikdy se neukládají raw prompty, odpovědi, osobní údaje, rodná čísla ani interní chain-of-thought.

---

## 2. KARTA EXISTUJÍCÍHO AI STACKU (MAPPING MODELŮ A PROVIDERŮ)

| Provider | Model ID | Využití v systému | Fallback pořadí | Timeout | In-Memory Stats / Metrics | 0-PII Sanitized |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini (Google)** | `gemini-3.6-flash`<br>`gemini-2.5-flash`<br>`gemini-2.5-pro` | - QA Multi-AI Rada (Primary)<br>- Admin Copilot<br>- Generování dokumentů a rozborů (`AiService.ts`) | **1. (Primary)** | 15 000 ms | Sledováno v `aiStatsManager` i `AiService` | **ANO** (`sanitizer.ts`) |
| **Grok (xAI)** | `grok-2-1212` | - QA Multi-AI Rada (Consensus & Failover)<br>- Sekundární nezávislý analytik | **2. (Secondary)** | 15 000 ms | Sledováno v `aiStatsManager` | **ANO** (`sanitizer.ts`) |
| **Groq (Meta)** | `llama-3.3-70b-versatile` | - QA Multi-AI Rada (Tertiary Fallback)<br>- Rychlá agregace nálezů | **3. (Tertiary)** | 15 000 ms | Sledováno v `aiStatsManager` | **ANO** (`sanitizer.ts`) |

### Stávající architektura komponent:
1. **`src/services/AiService.ts`**: Hlavní aplikační brána pro Gemini a externí modely. Podporuje streaming, JSON schema response a fallback při výpadku primárního klíče.
2. **`src/services/qa/ai/synthesisMultiAIOrchestrator.ts`**: Orchestrátor Multi-AI Rady. Zajišťuje paralelní volání Gemini, Grok a Groq s vyhodnocením konsenzu (`ConsensusEngine`) a automatickým Circuit Breakerem (po 3 selháních 60s cooldown).
3. **`src/services/qa/ai/aiStats.ts`**: Centralizovaný in-memory manager metrik. Sleduje celkový počet volání, tokeny, odhadované náklady ($0.000005/token), cache hits a důvody přeskočení.
4. **`src/services/audit/orionService.ts` & `orionTraceStore.ts`**: Bezpečnostní AI asistent Orion (`agent-orion-qa-v1`) spojený s `OrionTraceCenterPage` (Fáze 6B). Metriky Oriona (latence uzlů, stav kroků) jsou již evidovány v trace store.
5. **`src/components/admin/audit/AiTelemetryCard.tsx`**: Existující UI komponenta ve velínu. Zobrazuje 4 KPI karty (Spotřeba Tokenů, Náklady, Volání & Cache Hit, Poslední AI Aktivita), matici stavů providerů s toggle tlačítky a stav AI Context Indexu.

---

## 3. IDENTIFIKOVANÉ MEZERY A CÍLE IMPLEMENTACE (FÁZE 6C)

Přestože základní infrastructure telemetrie existuje, stávající stav má 3 konkrétní nedostatky, které Fáze 6C vyřeší:

1. **Absence per-provider rozpadu v `aiStatsManager`:**
   - *Současný stav:* Tokeny a náklady se sčítají do jedné globální proměnné (`promptTokens`, `completionTokens`, `estimatedCostUsd`). Nelze porovnat latenci Gemini vs Grok vs Groq ani jejich individuální chybovost.
   - *Cíl Fáze 6C:* Rozšířit `aiStatsManager` o `providerStatsMap: Record<string, ProviderDetailedStats>` obsahující latence (avg/max/p95), chybovost, počet volání a přesné tokeny pro každý model zvlášť.

2. **Nepropojenost `AiService.ts` s `aiStatsManager`:**
   - *Současný stav:* Pouze volání probíhající přes `synthesisMultiAIOrchestrator` zaznamenávají statistiky do `aiStatsManager`. Přímá volání z `AiService.ts` nebyla započítávána.
   - *Cíl Fáze 6C:* Instrumentovat `AiService.ts` tak, aby každé volání transparentně hlásilo metadatu do `aiStatsManager`.

3. **Vylepšení UI v `AiTelemetryCard.tsx` (bez tvorby nových stránek):**
   - *Současný stav:* Karta zobrazuje celková čísla a toggle tlačítka.
   - *Cíl Fáze 6C:* Doplnit v rámci `AiTelemetryCard.tsx` přehlednou tabulku rozpadu latencí, chybovosti a nákladů dle jednotlivých providerů a vizuální indikátor health statusu jednotlivých modelů.

---

## 4. NAVRŽENÝ PLÁN IMPLEMENTACE (BEZPEČNÝ KROK ZA KROKEM)

### Krok 1: Rozšíření `src/services/qa/ai/aiStats.ts` (0-PII, In-Memory)
- Přidat rozhraní `ProviderTelemetryDetails`:
  ```typescript
  export interface ProviderTelemetryDetails {
    provider: string;
    modelName: string;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    promptTokens: number;
    completionTokens: number;
    totalLatencyMs: number;
    avgLatencyMs: number;
    lastLatencyMs: number;
    estimatedCostUsd: number;
    lastErrorAt: string | null;
    lastErrorMessage: string | null;
  }
  ```
- Upravit `recordCall(provider: string, modelName: string, promptTokens: number, completionTokens: number, latencyMs: number, success: boolean, errorMsg?: string)` v `AIStatsManager`.

### Krok 2: Instrumentace `AiService.ts` & Orchestrátoru
- Při dokončení volání v `AiService.ts` a `synthesisMultiAIOrchestrator.ts` zavolat `aiStatsManager.recordCall(...)`.
- Zaručit, že v případě chyby/timeoutu se zaznamená `success: false` a navýší se chybové počítadlo daného providera.

### Krok 3: Rozšíření REST API Endpointu `/api/admin/qa/ai-orchestrator/status`
- Přidat do JSON odpovědi pole `detailedStats`, které vrací rozpad metrik dle providerů.

### Krok 4: Rozšíření UI v `AiTelemetryCard.tsx`
- Přidat sekci **"Model Performance & Cost Breakdown"** s přehledem:
  - Průměrná latence (ms) pro každý model (Gemini vs Grok vs Groq)
  - Chybovost (%) a počet selhání za session
  - Podíl na celkových nákladech ($)
  - Vizuální stav dostupnosti a indikátor circuit breaku

---

## 5. BEZPEČNOSTNÍ A AUDITNÍ ZÁRUKY

1. **RBAC Control:** Přístup k AI Telemetry API `/api/admin/qa/ai-orchestrator/*` je chráněn administrátorským oprávněním (`User ∩ Orion` authorization filter).
2. **Fail-Closed Strategy:** Výpadek telemetrie nebo chyby při sčítání statistik nesmí nikdy ovlivnit samotné provádění AI dotazů (telemetrické zápisy jsou obaleny v `try-catch`).
3. **Control Plane & Release Gate Isolation:** Telemetrie je pouze observabilní vrstva. Nemá žádná exekuční práva a neovlivňuje Release Gate kromě poskytování zdravotního stavu AI subsystému (`health.aiSubsystem`).

---

## 6. DEFINITION OF DONE PRO SCHVÁLENÍ FÁZE 6C

- [x] Read-only Pre-implementation Audit dokončen a uložen v `docs/audit/`.
- [ ] Rozšířen `aiStatsManager` o per-provider rozpad (0-PII, in-memory).
- [ ] Instrumentován `AiService.ts` i `synthesisMultiAIOrchestrator.ts`.
- [ ] Rozšířen backend endpoint `/api/admin/qa/ai-orchestrator/status`.
- [ ] Vylepšena UI karta `AiTelemetryCard.tsx` v rámci `UnifiedOperationsCenter.tsx`.
- [ ] Ověřeno 21/21 testů bez regresí v Audit Center 2.0 a Control Plane.
- [ ] Vytvořen post-implementation audit a ověřen Push/Merge workflow.

---
*Report připraven v režimu STRICT READ-ONLY. Žádné soubory aplikace nebyly změněny.*
