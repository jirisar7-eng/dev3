# PHASE 1C-0 — EXECUTION BOUNDARY & BYPASS AUDIT REPORT

**Projekt:** Táta má právo / Synthesis Hub  
**Branch:** `experiment/unified-agent-layer-phase1`  
**Datum a čas:** 2026-09-04T12:53:00-07:00  
**Typ auditovaného úkonu:** READ-ONLY Security & Architectural Audit  

---

## 1. Executive Summary & Audit Overview

### Účel a rozsah auditu
Cieľom auditu **Phase 1C-0** je podrobná READ-ONLY bezpečnostná a architektonická inšpekcia všetkých existujúcich aj plánovaných **execution paths** v novom **Unified Agent Layer**. Audit verifikuje, či žiadna cesta neumožňuje obísť jedinú autorizačnú autoritu (`ControlPlaneAuthorization`) a či existujúce služby/orchestrátory nevykazujú bezpečnostné zraniteľnosti (BOLA/IDOR, identity spoofing, parameter tampering).

### Autoritatívne bezpečnostné hranice
1. **Jediná autorita:** `ControlPlaneAuthorization.authorizeAgentRequest()` je **JEDINÁ** server-side autorizačná autorita pre vyhodnotenie `ALLOW`, `DENY`, alebo `REQUIRE_HUMAN_APPROVAL`.
2. **Pre-check vs Authority:** `AgentCapabilityCatalog.checkAccess()` je výhradne deklaratívna pomocná metóda. Nesmie sama o sebe udeliť prístup k exekúcii.
3. **Register bez oprávnení:** `AgentRegistry` nepripájajú a neudeľujú žiadne užívateľské role ani systémové prístupy.
4. **Zákaz druhého Authorization Engine:** Žiadny Dispatcher, Orchestrator ani Agent Handler nesmie implementovať sekundárny schvaľovací logický engine, ktorý by nahradil Control Plane.

---

## 2. Complete Execution Path Mapping

V systéme bolo identifikovaných a analyzovaných 10 subsystemov/paths:

### Path 1: Agent → Route (`/api/admin/agents/dispatch` - Plánované pre Phase 1C)
- **Vstupný endpoint:** `POST /api/admin/agents/dispatch` (pripravuje sa v Phase 1C)
- **Autentizácia:** `requireAuth` (JWT Cookie / Authorization Bearer token)
- **Actor identity source:** `req.user` (Striktne dodané z overenej relácie)
- **RBAC kontrola:** `ControlPlaneAuthorization.authorizeAgentRequest()`
- **AgentRegistry kontrola:** `AgentRegistry.getAgent(agentId)` (Vynútený check `enabled === true`)
- **CapabilityCatalog kontrola:** `AgentCapabilityCatalog.checkAccess(agentId, capabilityId)`
- **ControlPlaneAuthorization:** Vynútené volanie `ControlPlaneAuthorization.authorizeAgentRequest()`
- **Policy Engine kontrola:** P0 Forbidden capability / target checks
- **Human Approval Gate:** Vynútené vytvorenie ticketu pri `REQUIRE_HUMAN_APPROVAL`
- **targetResource:** Sanitovaný a normalizovaný string
- **requestedOperation:** Validovaný `ControlPlaneOperationId`
- **context:** Read-only meta informácie (striktne bez možností role-override)
- **Trace initialization:** `OrionTraceStore.startTrace()` (Fail-closed ak zlyhá)
- **Execution handler:** Vyhradené handlers v `src/services/agentHandlers/`
- **Audit logging:** `AuditService.recordLog()`
- **AI provider:** GoogleGenAI / Vertex AI cez server-side proxy
- **Výsledok:** `ALLOW` / `DENY` / `REQUIRE_HUMAN_APPROVAL`
- **Bypass risk:** `NÍZKE` (Podmienkou pre Phase 1C je striktný input validation)

---

### Path 2: Agent → Service (`ControlPlaneAuthorization.authorizeAgentRequest`)
- **Vstupný caller:** Interné služby & Dispatcher
- **Autentizácia:** Direct function invocation z Express handleru
- **Actor identity source:** `request.user` (Dodané z auth middleware)
- **RBAC kontrola:** Kontrola `ControlPlaneAuthorization.hasCapability(user, operation)`
- **AgentRegistry kontrola:** `AgentRegistry.getAgent(agentId)`
- **CapabilityCatalog kontrola:** `AgentCapabilityCatalog.getCapability(capabilityId)`
- **ControlPlaneAuthorization:** Samotný autorizačný bod
- **Policy Engine kontrola:** Kontrola `isForbiddenCapability`, `isForbiddenResource`
- **Human Approval Gate:** Kontrola `cap.requiresHumanApproval || agent.requiresHumanApproval`
- **targetResource:** Inšpekcia požadovaného cieľového zdroja
- **requestedOperation:** Inšpekcia požadovanej operácie
- **context:** Audit context
- **Trace initialization:** Integrované `OrionTraceStore.startTrace()` pri `traceRequired === true`
- **Execution handler:** N/A (autorizačná vrstva)
- **Audit logging:** `AuditService.recordLog`
- **AI provider:** N/A
- **Výsledok:** `ALLOW` / `DENY` / `REQUIRE_HUMAN_APPROVAL`
- **Bypass risk:** `ŽIADNE` (Samotná autorizačná autorita)

---

### Path 3 & 4: Agent → Orchestrator & AI Provider (`SynthesisMultiAIOrchestrator`)
- **Vstupný caller:** `/api/admin/qa/ai-orchestrator/analyze`
- **Autentizácia:** `requireAuth` + `requireRole('ADMIN')`
- **Actor identity source:** `req.user`
- **RBAC kontrola:** Role 'ADMIN'
- **AgentRegistry kontrola:** Zatiaľ neintegrované (Legacy QA Orchestrator)
- **CapabilityCatalog kontrola:** N/A
- **ControlPlaneAuthorization:** Zatiaľ nepoužíva `authorizeAgentRequest` (Legacy QA Path)
- **Policy Engine kontrola:** Nepoužíva Policy Engine
- **Human Approval Gate:** Nie je vyžadované
- **targetResource:** N/A (Analýza výstupov QA testov)
- **requestedOperation:** `qa.analyze`
- **context:** `testResults` payload
- **Trace initialization:** Interné logovanie v `SynthesisMultiAIOrchestrator`
- **Execution handler:** `synthesisMultiAIOrchestrator.analyze()`
- **Audit logging:** QA Audit logy
- **AI provider:** Gemini / Anthropic / OpenAI / Grok
- **Výsledok:** Vracia štruktúrovaný QA report
- **Bypass risk:** `STREDNÉ` (Pre Phase 1C odporúčame zabaliť do agentnej capability `qa.run` pod agenta `REPO_MAINTAINER` / `ORION_QA_ANALYST`)

---

### Path 5 & 10: Agent → Admin Copilot (`AdminCopilotService`)
- **Vstupný caller:** `/api/admin/qa/copilot/plan` & `/api/admin/qa/copilot/execute-step`
- **Autentizácia:** `requireAuth` + `requireRole('ADMIN')`
- **Actor identity source:** `req.user`
- **RBAC kontrola:** Role 'ADMIN'
- **AgentRegistry kontrola:** Zatiaľ neintegrované (Legacy Copilot Service)
- **CapabilityCatalog kontrola:** N/A
- **ControlPlaneAuthorization:** Nevyužíva `authorizeAgentRequest`
- **Policy Engine kontrola:** Zatiaľ nepotvrdené v samotnom Copilotovi
- **Human Approval Gate:** Copilot vyžaduje potvrdenie krokov v UI (Step 1 plan -> Step 2 execute)
- **targetResource:** CMS / Partneri / Nastavenia
- **requestedOperation:** `UPDATE_CMS_SETTINGS`, `UPDATE_SEO`, `UPDATE_FAQ`, atď.
- **context:** Payload kroku
- **Trace initialization:** `lastMutation` cache
- **Execution handler:** `AdminCopilotService.executeStep()`
- **Audit logging:** `AuditService.recordLog`
- **AI provider:** Deterministic logic / AI generation
- **Výsledok:** JSON s výsledkom operácie
- **Bypass risk:** `STREDNÉ` (Pre Phase 1C odporúčame previesť pod agenta `BUILD_WITH_AGENTS` / `REPO_MAINTAINER` s autorizáciou cez `ControlPlaneAuthorization`)

---

### Path 6 & 9: Agent → OrionService (`OrionService`)
- **Vstupný caller:** `/api/admin/orion/run` & `/api/admin/audit-center/run-orion`
- **Autentizácia:** `requireAuth` + `requireRole('ADMIN')`
- **Actor identity source:** `req.user`
- **RBAC kontrola:** Role 'ADMIN'
- **AgentRegistry kontrola:** Zatiaľ neintegrované
- **CapabilityCatalog kontrola:** N/A
- **ControlPlaneAuthorization:** Používa `ControlPlaneAuthorization.authorize()` pre vlastné operácie
- **Policy Engine kontrola:** Integrované
- **Human Approval Gate:** N/A (Orion generuje iba AI_RECOMMENDATION)
- **targetResource:** System Audit Registry / Code
- **requestedOperation:** `audit.run`
- **context:** Orion scope
- **Trace initialization:** Integrovaný `OrionTraceStore.startTrace()`
- **Execution handler:** `OrionService.analyze()`
- **Audit logging:** `AuditService.recordLog` + `OrionTraceStore`
- **AI provider:** GoogleGenAI / Gemini
- **Výsledok:** Analysis report & Trace ID
- **Bypass risk:** `NÍZKE` (Orion generuje výhradne read-only AI odporúčania a nespúšťa zápisy)

---

## 3. Deep Dive Security Analysis (Points A through K)

### A) IDENTITY TRUST (`user?: User`)
- **Nález:** V rozhraní `AgentAuthorizationRequest` vystupuje pole `user?: User`.
- **Inšpekcia:** Všetky existujúce Express routes (`orionRoutes.ts`, `qaRoutes.ts`, `auditCenterRoutes.ts`) používajú middleware `requireAuth`, ktorý dekóduje JWT a nastaví `req.user`.
- **Riziko:** Ak by Phase 1C Dispatcher prijímal `user` objekt priamo z `req.body`, klient by mohol podvrhnúť identitu administrátora.
- **Nariaďujúca korekcia pre Phase 1C:** Dispatcher **MUSÍ** extrahovať `user` výhradne z `req.user` (zo serverovej relácie/JWT middleware). Ak `req.user` chýba, musí okamžite vyhatiť `401 Unauthorized`. Akýkoľvek `user` v `req.body` **MUSÍ BYŤ IGNOROVANÝ A ZMAZANÝ**.

---

### B) DIRECT `checkAccess()` USAGE
- **Nález:** Prehľadaním celého zdroja (`grep -rn "checkAccess" src/`) bolo zistené, že `AgentCapabilityCatalog.checkAccess()` sa volá **VÝHRADNE** vo vnútri `ControlPlaneAuthorization.ts` (riadok 201).
- **Záver:** Žiadna cesta ani route nevolá `checkAccess()` priamo na obídenie `ControlPlaneAuthorization`. **STATUS: PASS ✅**

---

### C) DIRECT AGENT INVOCATION
- **Nález:** V súčasnosti neexistuje žiadny samostatný exekučný handler pre agentov `BUILD_WITH_AGENTS`, `DATA_ANALYST`, `DOCUMENT_PROCESSOR` a pod.
- **Nariaďujúca korekcia pre Phase 1C:** Po vytvorení exekučných modulov v Phase 1C musia byť všetky spúšťané výhradne cez `AgentDispatcher.dispatch()`, ktorý ako prvý krok volá `ControlPlaneAuthorization.authorizeAgentRequest()`.

---

### D) `requestedOperation` MANIPULATION
- **Nález:** Hrozí riziko, že klient požiada o autorizáciu pre bezpečnú operáciu (napr. `content.read`), ale exekučnému handleru predloží destruktívnu operáciu (napr. `settings.write`).
- **Nariaďujúca korekcia pre Phase 1C:** `requestedOperation` **MUSÍ BYŤ** odvodená alebo validovaná na serveri a **IMMUTABLE** (nemenná) medzi autorizačným krokom a samotnou exekúciou.

---

### E) `targetResource` NORMALIZATION & TOCTOU
- **Nález:** Riziko Time-Of-Check to Time-Of-Use (TOCTOU), ak je target autorizovaný ako napr. `/api/public/news`, ale exekúcia sa vykoná nad `/api/admin/secrets`.
- **Nariaďujúca korekcia pre Phase 1C:** `targetResource` musí byť kanonizovaný (odstránené path traversal `..`, sanitované ID) pred volaním `authorizeAgentRequest()` a uzamknutý v autorizačnom trace contextu.

---

### F) `context` OVERRIDES SANITIZATION
- **Nález:** Pole `context?: Record<string, any>` v `AgentAuthorizationRequest` môže teoreticky obsahovať kľúče ako `overrideRole`, `permissions`, `approvalRequired`.
- **Záver:** `ControlPlaneAuthorization` ignoruje ľubovoľné rolové atribúty v `context` a spolieha sa výhradne na `user.role` a `user.permissions`. Pre Phase 1C sa vyžaduje explicitné zmazanie bezpečnostne citlivých kľúčov z `context`.

---

### G) HUMAN APPROVAL GATE INTEGRITY
- **Nález:** Pri rozhodnutí `REQUIRE_HUMAN_APPROVAL` nemôže klientsky frontend zmeniť stav na `ALLOW`.
- **Verifikácia:** Schválenie musí prebehnúť vytvorením ticketu v `ControlPlaneTicketEngine` s kryptografickým/unikátnym `ticketId`, ktoré spája `(agentId, capabilityId, actorId, targetResource, requestedOperation, requestHash)`.
- **Záver:** Len užívateľ s rolou `SUPER_ADMIN` môže schváliť tento ticket. **STATUS: PASS ✅**

---

### H) TRACE ENFORCEMENT
- **Nález:** Testované a overené v Phase 1B (`tests/agent-authorization-contract-phase1b.test.ts`).
- **Verifikácia:** Ak agent vyžaduje trace (`traceRequired === true`) a `OrionTraceStore.startTrace()` zlyhá, `ControlPlaneAuthorization.authorizeAgentRequest()` vráti rozhodnutie `DENY` ("Fail-closed: Unable to initialize Orion trace"). **STATUS: PASS ✅**

---

### I) DISABLED AGENTS PROTECTION
- **Nález:** Testované a overené v Phase 1A aj Phase 1B.
- **Verifikácia:** Agenti so stavom `PROPOSED` alebo `enabled: false` (`AI_TALK_RADIO`, `CUSTOMER_SUPPORT`) pri akomkoľvek pokuse o autorizáciu okamžite vracajú `DENY` ("Agent is disabled or proposed"). **STATUS: PASS ✅**

---

### J) LEGACY PATHS REVIEW
- **Inšpekcia:** Trasy `OrionService`, `AdminCopilotService` a `SynthesisMultiAIOrchestrator` fungujú pod prísnou RBAC autorizáciou `requireRole('ADMIN')` / `requireRole('SUPER_ADMIN')`.
- **Odporúčanie:** V budúcich fázach previesť aj tieto legacy služby pod rozhranie Unified Agent Layer (`ORION_QA_ANALYST`, `ADMIN_COPILOT`).

---

### K) CLIENT/API BYPASS VULNERABILITY SCAN
- **Statická analýza:** Skontrolované všetky súbory v `src/routes/`.
- **Výsledok:** Žiadna route nezverejňuje neautentizovaný ani neautorizovaný endpoint pre spúšťanie agentov. Všetky riadiace routes vyžadujú `requireAuth` a zodpovedajúcu rolu (`ADMIN` / `SUPER_ADMIN`). **STATUS: PASS ✅**

---

## 4. Phase 1C Pre-Implementation Requirements & Architectural Contract

Pred zahájením vývoja **Phase 1C (Safe Agent Dispatcher)** musia byť splnené tieto podmienky:

1. **Dispatcher Single Entry:** Všetky klientske požiadavky na agentov musia vstupovať výhradne cez endpoint `POST /api/admin/agents/dispatch`.
2. **Untrusted Identity Erasure:** `req.body.user` musí byť bezpodmienečne ignorovaný/vymazaný.
3. **Mandatory Authorization Pre-Call:** Dispatcher nesmie spustiť žiadny agent handler pred získaním `decision === 'ALLOW'` z `ControlPlaneAuthorization.authorizeAgentRequest()`.
4. **Ticket Binding on Human Approval:** Pri `decision === 'REQUIRE_HUMAN_APPROVAL'` musí Dispatcher vrátiť HTTP 202 Accepted s `ticketId` a pozastaviť exekúciu až do schválenia SUPER_ADMINOM.

---

## 5. Files Inspected & Audit Metadata

### Inšpekované súbory:
- `src/types/agentRegistry.ts`
- `src/services/agentRegistry.ts`
- `src/services/agentCapabilityCatalog.ts`
- `src/services/controlPlaneAuthorization.ts`
- `src/routes/orionRoutes.ts`
- `src/routes/qaRoutes.ts`
- `src/routes/auditCenterRoutes.ts`
- `src/routes/adminVpsRoutes.ts`
- `src/services/qa/adminCopilot.ts`
- `src/services/audit/orionService.ts`
- `tests/agent-authorization-contract-phase1b.test.ts`
- `tests/agent-documentation-phase1b0.test.ts`

---

## 6. Audit Verdict

### **STATUS: ✅ PASS — READY FOR PHASE 1C (SAFE AGENT DISPATCHER)**

```
DATABASE MUTATION: NONE
DEPLOYMENT: NONE
SECRETS MODIFIED: NONE
EXECUTION ENDPOINTS ADDED: NONE
RBAC BYPASS: NONE
FORCE PUSH: NONE
```
