# PRE-IMPLEMENTATION AUDIT — FÁZE 6: UNIFIED AI & AUDIT OPERATIONS CENTER

**Datum a čas:** 2026-08-29 18:35 UTC  
**Repozitář:** `jirisar7-eng/dev3`  
**Výchozí větev:** `main` (`3bc57dabb5e44e5a2de2b18ff508ce32c9ef238c`)  
**Režim:** STRICT READ-ONLY PRE-IMPLEMENTATION AUDIT  
**Status:** **READY FOR PHASE 6 DESIGN & IMPLEMENTATION**  

---

## 1. GIT STAV & VÝCHOZÍ INTEGRACE MAIN

- **Potvrzený `origin/main` HEAD:** `3bc57dabb5e44e5a2de2b18ff508ce32c9ef238c`
- **Poslední commity na `main`:**
  1. `3bc57da` - `feat(audit-center): Audit Center 2.0 Phases 1–5 (#22)`
  2. `d425ade` - `chore: ignore local runtime and recovery data`
  3. `0fa7be1` - `fix: include tsconfig in production Docker image`
  4. `8c426af` - `feat: recover Control Plane Phase 5A/5B (#21)`
- **Přítomnost Audit Center 2.0 na main:** **VERIFIED** (AuditRegistryEngine, RegressionEngine, ReleaseGateService, OrionService, AuditFinding Prisma model, AuditCenter UI).

---

## 2. INVENTÁŘ EXISTUJÍCÍ ADMINISTRACE

| Modul | UI Umístění | Route / Path | Backend Service | API Endpointy | Databáze | RBAC | Audit Logging | Status | Duplicity Risk |
|---|---|---|---|---|---|---|---|---|---|
| **Synthesis Admin Copilot** | `QADashboard.tsx` (Tab: copilot) | `/administrace/qa/copilot` | `adminCopilot.ts` | `POST /api/admin/qa/copilot/plan`, `execute-step` | Paměť / Git | `ADMIN`, `SUPER_ADMIN` | `AuditService.recordLog` | IMPLEMENTED | MEDIUM (překryv s Orionem) |
| **AI Context & Index** | `AiContextManager.tsx` | Tab `ai-context` | `aiContextService.ts` | `GET /api/ai-context/status`, `POST /api/admin/ai-context/refresh`, `/llms.txt`, `/sitemap.xml` | Filesystem (`public/`) | Veřejné GET / `ADMIN` POST | `AuditService.recordLog` | IMPLEMENTED | LOW |
| **QA & Audit Syntéza** | `QADashboard.tsx` | `/administrace/qa` | `qaAuditEngine.ts`, `aiAnalystOrchestrator.ts`, `consensusEngine.ts` | `POST /api/admin/qa/run-audit`, `/run-ai-analysis`, `GET /dashboard` | Filesystem (`qa-registry.json`) | `ADMIN` | `AuditService.recordLog` | IMPLEMENTED | HIGH (roztříštěná zjištění) |
| **E2E AI Testy** | `TestRunnerCard.tsx` | Tab `tests` | `server.ts` (subprocess exec) | `GET /api/admin/test-status`, `POST /api/admin/run-tests` | Paměť / Process | `ADMIN` | `AuditService.recordLog` | IMPLEMENTED | LOW |
| **Audit Center 2.0** | `AuditCenter.tsx` (4 panely) | `/administrace/audity` | `auditRegistryEngine.ts`, `releaseGateService.ts`, `regressionEngine.ts` | `GET /api/admin/audits/release-gate`, `/findings`, `/stats`, `POST /sync` | `AuditFinding` (Prisma) + `docs/audit/*.md` (SSOT) | `ADMIN`, `SUPER_ADMIN` | `AuditService.recordLog` | IMPLEMENTED | LOW |
| **Orion Safety Bridge** | `OrionAssistantPanel.tsx` | `/administrace/audity` | `orionService.ts`, `controlPlaneAuthorization.ts` | `POST /api/admin/audits/orion/analyze`, `/orion/propose-action` | `ControlPlaneAction` (DRAFT) | `ADMIN` (User ∩ Orion) | `AuditService.recordLog` | IMPLEMENTED | LOW |
| **Audit Log (DB)** | `AuditLogViewer.tsx` | Tab `audit` | `auditService.ts` | `GET /api/audit` | `AuditLog` (PostgreSQL) | `ADMIN`, `SUPER_ADMIN` | Systémový sink | IMPLEMENTED | LOW (provozní logy vs vývojové audity) |
| **Synthesis Project Control Center** | `SynthesisProjectControlCenter.tsx` | `/admin/project-control` | `controlPlaneService.ts`, `controlPlaneRiskEngine.ts` | `/api/admin/control-plane/*` | `ControlPlaneAction`, `ControlPlaneFinding` | `ADMIN`, `SUPER_ADMIN`, `CONTENT_MANAGER` | `AuditService.recordLog` | IMPLEMENTED | MEDIUM |
| **AI Stats & Telemetry** | `QADashboard.tsx` (Tab: ai) | `/administrace/qa` | `aiStats.ts` (`aiStatsManager`) | `GET /api/admin/qa/ai-stats` | In-Memory singleton | `ADMIN` | N/A | PARTIAL | MEDIUM |

---

## 3. MAPOVÁNÍ EXISTUJÍCÍ NAVIGACE & DUPLICIT

### Současný stav v `src/config/adminNavigation.ts`:
- **Sekce `sec-ai` ("Synthesis AI & QA Center"):**
  - `copilot` (Synthesis Admin Copilot)
  - `ai-context` (AI Context & Index)
  - `qa` (QA & Audit Syntéza)
  - `tests` (E2E AI Testy)
- **Sekce `sec-analytics` ("Observability & Audit"):**
  - `analytics` (Analytika & Návštěvnost)
  - `audit` (Audit Log - Provozní DB)
  - `audits` (Audit Center - Vývojové zprávy docs/audit)
  - `compliance` (Compliance Dokumenty)

### Zjištěné UX/Navigační problémy:
1. **Rozdělení vývojových auditů vs QA syntézy:** Uživatel musí přepínat mezi `/administrace/qa` (kde běží AI analýza běhů) a `/administrace/audity` (kde je Audit Center 2.0 s Release Gate a Orionem).
2. **Duplicita Copilot vs Orion:** V systému existuje starší `Synthesis Admin Copilot` (`adminCopilot.ts`) v QA dashboardu a nový bezpečnostní `Orion Assistant` (`agent-orion-qa-v1`) v Audit Center.
3. **Izolace AI telemetrie:** Statistiky tokenů, odhadovaných nákladů a chybovosti providerů (Gemini/Grok/Groq) jsou uvězněny v subzáložce QA dashboardu a nejsou viditelné v centrálním přehledu.

---

## 4. NÁVRH UNIFIED INFORMATION ARCHITECTURE

Sjednocený koncept **AI & AUDIT OPERATIONS CENTER**:

```
AI & AUDIT OPERATIONS CENTER (/administrace/audity nebo /administrace/operations)
│
├── 1. Overview (Centrální velitelský přehled)
│   ├── Project Health & Release Gate (READY_TO_MERGE / DO_NOT_MERGE)
│   ├── Aktivní P0/P1 blokery & Regrese
│   ├── AI Telemetry KPI (Dnešní tokeny, odhadované náklady, chybovost providerů)
│   └── Poslední systémové a bezpečnostní události
│
├── 2. Audit Center (Vývojové audity & SSOT)
│   ├── Project Health Card
│   ├── Findings Registry & Regrese (5 stavů)
│   ├── Audit Documents Catalog (docs/audit/*.md)
│   └── Release Gate Evaluator
│
├── 3. Orion AI Safety Assistant
│   ├── AI Root Cause & Fix Recommendations
│   ├── Navrhování DRAFT Control Plane akcí
│   ├── Bezpečnostní mantinely (User ∩ Orion)
│   └── Historie analýz & Audit Trail
│
├── 4. AI Systems & Telemetry
│   ├── Model Provider Status (Gemini, Grok, Groq) & Cooldowny
│   ├── Token Usage & Náklady (Prompt / Completion / Cache hits)
│   ├── AI Context & Index (llms.txt, sitemap.xml, robots.txt)
│   └── Provider Failover & Latence
│
├── 5. QA & Test Runner
│   ├── E2E Test Suite spouštěč (Playwright / Vitest)
│   ├── QA Discovery & Registry integrity
│   └── Consensus Engine reporty
│
└── 6. Provozní Audit Logy (Observability)
    ├── PostgreSQL AuditLog viewer s filtry
    └── Bezpečnostní události & Změny rolí
```

---

## 5. SECURITY & RBAC AUDIT

1. **Role-Based Access Control:**
   - **USER (Běžný uživatel):** Nulový přístup k AI & Audit Operations Center (HTTP 401/403).
   - **ADMIN:** Přístup k Overview, Audit Center, Orion analýzám, AI Context indexaci, QA testům a standardním audit logům.
   - **SUPER_ADMIN:** Výhradní právo provádět nevratné Control Plane exekuce, schvalovat rizikové akce (P0/P1), měnit kvóty AI providerů a prohlížet citlivé bezpečnostní logy.
2. **Orion Identity & Capability Intersection:**
   - Orion identita: `agent-orion-qa-v1`.
   - Vynucen vzorec: `effectiveCapabilities = userCapabilities ∩ agentCapabilities`.
   - Orion **NESMÍ** mít právo schvalovat (`approveAction`) ani spouštět (`executeAction`) žádnou operaci. Všechny výstupy jsou striktně `AI_RECOMMENDATION` ve stavu `DRAFT`.
3. **Ochrana PII, Tokenů a Secrets:**
   - Telemetrie **NESMÍ** logovat surové prompty obsahující osobní údaje uživatelů, rodná čísla či rodinné spory.
   - Výstupy chyb nesmí exponovat API klíče (`GEMINI_API_KEY`, `GROK_API_KEY`, `DATABASE_URL`).
   - Veškeré AI výstupy musí procházet modulem `src/services/qa/ai/sanitizer.ts`.

---

## 6. AI STATISTICS & COST ARCHITECTURE

- **VERIFIED EXISTING (IMPLEMENTED):**
  - In-Memory čítače v `aiStatsManager` (`totalCalls`, `cacheHits`, `skipped`, `promptTokens`, `completionTokens`, `estimatedCostUsd`, `lastCallAt`, `skippedReasons`).
  - Provider fallback failover status (`isAvailable()`, cooldown status pro Gemini/Grok/Groq).
- **PARTIAL:**
  - Konsolidace statistik mezi `AiService` (klientské AI funkce) a `synthesisMultiAIOrchestrator.ts` (QA/Audit AI funkce).
- **MISSING:**
  - Dlouhodobá DB persistence AI metrik přes restarty kontejneru (v současnosti uloženo pouze v RAM singletonu).
  - Rozpad nákladů per-user a per-task.

---

## 7. DATABASE IMPACT

- **Fáze 6A (Unified UI & Navigation):** **DB IMPACT: NONE**. Využívá existující endpointy a schémata.
- **Fáze 6B (Agregace telemetrie & QA):** **DB IMPACT: NONE**. Agregace existujících dat v paměti / v `AuditFinding` / `AuditLog`.
- **Fáze 6C (Volitelná dlouhodobá AI telemetrie):** **DB IMPACT: OPTIONAL LOW** (Pouze pokud by byla vyžadována nová tabulka `AiUsageLog`, jinak není DB změna nutná).

---

## 8. DUPLICITY AUDIT & ZÁSADA ROZŠIŘOVÁNÍ

- **Zákaz duplicitních komponent:** Nevytvářet soubory typu `AuditCenter2.tsx` ani `NewAiOperations.tsx`.
- **Doporučená architektura:**
  - Zachovat `src/components/admin/AuditCenter.tsx` jako modulární kontejner.
  - Využít existující dílčí komponenty (`ProjectHealthCard`, `AuditFindingsList`, `OrionAssistantPanel`, `AuditDocumentsCatalog`).
  - Doplnit modulární panel `AiTelemetryCard.tsx` a sjednotit navigaci v `src/config/adminNavigation.ts`.

---

## 9. UX AUDIT (ZÁVĚRY & PRAVIDLA)

1. **Rozlišení ACTION vs INFORMATION:**
   - Interaktivní akce (např. *Obnovit index*, *Spustit Orion analýzu*, *Znovu vyhodnotit Gate*) musí mít explicitní tlačítka s hover efektem a stavem načítání.
   - Diagnostická data a metriky (např. *SHA hash*, *Skóre 84 %*, *Token count*) nesmí mít vzhled tlačítek.
2. **Status Indikátory:**
   - Přísně unifikovat badge barvy: `READY_TO_MERGE` (zelená), `DO_NOT_MERGE` (červená), `UNKNOWN` (šedá), `PASS` / `WARNING` / `FAIL`.
3. **AI Výstupy:**
   - Každý výstup generovaný LLM/Orionem musí nést badge `AI_RECOMMENDATION` (fialová) a disclaimer, že nebyl přímo vykonán.

---

## 10. NÁVRH IMPLEMENTAČNÍCH FÁZÍ

### FÁZE 6A: Unified Navigation & Overview Hub
- **Cíl:** Sjednotit admin navigaci a vytvořit centrální Overview záložku v `AuditCenter.tsx`.
- **Dotčené soubory:** `src/config/adminNavigation.ts`, `src/components/admin/AuditCenter.tsx`.
- **DB Impact:** `NONE`.
- **Security:** Zachování `requireRole('ADMIN')`.

### FÁZE 6B: AI Telemetry & QA Synthesis Integration
- **Cíl:** Propojit `aiStatsManager` a stav multi-AI providerů do panelu telemetrie v Audit Center.
- **Dotčené soubory:** `src/routes/auditCenterRoutes.ts`, `src/components/admin/audit/AiTelemetryCard.tsx`.
- **DB Impact:** `NONE`.
- **Security:** Sanitizace chybových hlášek, maskování interních stack traces.

### FÁZE 6C: Copilot & Orion Convergence
- **Cíl:** Konsolidovat rozhraní Orion asistenta tak, aby pokrývalo jak vývojové audity, tak QA nálezy bez duplicitního kódu.
- **Dotčené soubory:** `src/services/audit/orionService.ts`, `src/components/admin/audit/OrionAssistantPanel.tsx`.
- **DB Impact:** `NONE`.
- **Security:** Vynucení `User ∩ Orion` capability intersection.

---

## 11. POVINNÉ TESTOVÁNÍ (READ-ONLY OVĚŘENÍ)

- **Prisma Schema Validation:** `PASS` (`prisma validate` - valid schema 🚀).
- **TypeScript Typecheck (`npx tsc --noEmit`):** `PASS` (0 chyb).
- **Audit Center Test Suites (Vitest):** `52/52 PASS` (100% úspěšnost napříč 5 sadami).
- **AI Provider Consistency Tests (`node --test`):** `6/6 PASS`.
- **Bezpečnostní kontrola:** `0 P0`, `0 P1`, `Fail-Closed` model 100% zachován.

---

## 12. ZÁVĚR & DOPORUČENÍ

- **Celkový stav:** **PASS (READY FOR FÁZE 6)**
- **Doporučení:** **PROCEED TO PHASE 6A UPON USER APPROVAL**
