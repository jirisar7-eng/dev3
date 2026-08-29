# AUDIT REPORT: READ-ONLY PRE-IMPLEMENTATION AUDIT FÁZE 6B
## ORION VISUALIZATION & TRACE CENTER

**Datum a čas:** 2026-08-29 12:30:00 UTC  
**Název úkolu:** Pre-Implementation Read-Only Audit Fáze 6B – Orion Visualization & Trace Center  
**Repozitář:** `jirisar7-eng/dev3`  
**Pracovní větev:** `feat/faze-6a-unified-ai-audit-operations`  
**Autor:** Senior System Architect / QA Auditor / DevSecOps Engineer  
**Režim:** STRICT READ-ONLY PRE-IMPLEMENTATION AUDIT  

---

## 1. EXISTUJÍCÍ ORION & ARCHITEKTURA
- **Orion Služba:** `src/services/audit/orionService.ts`
- **Agent Identity:** `agent-orion-qa-v1`
- **Role & Oprávnění:** `AI_SECURITY_ANALYST`, deterministické oprávnění přes `ControlPlaneAuthorization.authorizeOrionCapability(user, 'audit.run')`.
- **Capability Intersection:** `User ∩ Orion` striktně vynucena. Pokud uživatel nemá odpovídající roli, operace okamžitě selže (Fail-Closed).
- **Audit Logs:** Vyvolává auditní události `ORION_ANALYSIS_STARTED`, `ORION_ANALYSIS_COMPLETED`, `ORION_ANALYSIS_FAILED`, `ORION_ACTION_PROPOSED`.
- **DRAFT Enforcement:** Orion navrhuje akce výhradně ve stavu `DRAFT` / `PLAN_CREATED` bez oprávnění pro automatické `approveAction` či `executeAction`.

---

## 2. AI TELEMETRIE & PROVIDEŘI
- **Existující telemetrický systém:** `AiTelemetryCard.tsx`, API `/api/admin/qa/ai-orchestrator/status`, `/api/admin/qa/ai-orchestrator/stats`.
- **Dostupná data:**
  - Spotřeba tokenů (promptTokens, completionTokens, totalTokens)
  - Odhadované náklady ($ USD)
  - Latence (ms) a časové razítko poslední aktivity
  - Multi-provider failover stav (Primary: Gemini, Secondary: Grok, Tertiary: Groq)
  - Cooldown a chybovost providerů
- **Závěr:** Telemetrická data existují a nebudou duplikována. Trace Center z nich bude přímo čerpat.

---

## 3. AUDIT CENTER 2.0 INTEGRACE
- **AuditRegistryEngine:** Načítá a ověřuje auditní záznamy.
- **RegressionEngine:** Analyzuje časovou osu a detekuje P0/P1 regrese.
- **ReleaseGateService:** Deterministicky vyhodnocuje Project Health.
- Orion Trace získá kroky bezpečným dotazováním existujících služeb bez přímého zásahu do jejich vnitřní logiky.

---

## 4. INTEGRACE DO ADMINISTRACE & NAVIGACE
- **Požadovaný route:** `/administrace/orion` (Tab ID: `'orion'`).
- **Umístění v navigaci (`adminNavigation.ts`):**  
  Bude přidán pod sekci **Synthesis AI & QA Center** (`sec-ai`) s badgem `Trace Graph` (barva `purple`).
- **Propojení v `UnifiedOperationsCenter.tsx`:** Přidána rychlá záložka / odkaz na Orion Trace Center.

---

## 5. VISUÁLNÍ KONCEPT & INTERAKTIVNÍ RENDERING (SVG / REACT)
Trace proces bude zobrazen jako interaktivní graf s těmito uzly:

```
[USER] 
  ↓
[ORION AGENT] (agent-orion-qa-v1)
  ↓
[CONTEXT GATHERING] (AuditRegistry, Regressions, ProjectHealth)
  ↓
[SOURCES & DOCUMENTS] (docs/audit, DB cache)
  ↓
[SANITIZER] (sanitizer.ts - 0-PII masking)
  ↓
[PERMISSION INTERSECTION] (User ∩ Orion capabilities)
  ↓
[AI PROVIDER SELECTION] (Gemini / Fallback to Grok/Groq / Deterministic)
  ↓
[EVIDENCE EVALUATION] (Finding Severity P0-P3)
  ↓
[AI_RECOMMENDATION GENERATION] (Zod schema validation)
  ↓
[CONTROL PLANE ACTION PROPOSAL] (Action created in DRAFT)
  ↓
[HUMAN APPROVAL GATE] (SUPER_ADMIN approval required)
```

- **Vlastnosti rendereru:**
  - Vizuální stav uzlů: `pending` (šedá), `running` (pultující fialová/modrá animace), `success` (zelená), `warning` (oranžová), `failed` (červená), `fallback` (jantarová).
  - Animované spojovací čáry (SVG dash-array animation).
  - Kliknutí na uzel otevře boční detail panel s 0-PII metrikami, časováním, spotřebovanými tokeny a efektivními oprávněními.

---

## 6. REAL-TIME TRACE MECHANISMUS
- **Zvolené řešení:** **Polling Endpoint** (`/api/admin/orion/active-trace` / `/api/admin/orion/trace/:id`) s intervalem **1000 ms**.
- **Zdůvodnění:** Polling přes REST API je v Cloud Run / Express prostředí 100% stabilní, nebludný, nepodléhá odpojování WebSocket spojení a nevyžaduje dodatečné stavové servery.

---

## 7. BEZPEČNOST & PRIVACY (0-PII SANITIZACE)
- **Autorizace:** Endpointy chráněny `requireAuth` + `requireRole(['ADMIN', 'SUPER_ADMIN'])`.
- **Sanitizace trace dat:**  
  - Všechny texty prochází přes `sanitizer.ts` (`sanitizeInputData`, `sanitizeText`, `redactToken`).
  - Žádné raw LLM prompty, JWT tokeny, hesla ani rodná čísla/PII se v trace neobjeví.
  - Interní myšlenkové pochody (chain-of-thought) modelu NEJSOU ukládány ani zobrazovány. Zobrazují se výhradně strukturované auditovatelné kroky.

---

## 8. NOTION AUDIT MIRROR INTEGRATION
- **Služba:** `src/services/notionAuditMirror.ts` (volitelný konektor).
- **Princip:** Pokud je nastaven secret `NOTION_API_KEY` a `NOTION_DATABASE_ID`, po dokončení Orion operace se zrcadlí sanitizovaný souhrn do Notion databáze.
- **Role Notionu:** Výhradně KNOWLEDGE / AUDIT MIRROR. Autoritativním zdrojem zůstává aplikace, PostgreSQL a Git.

---

## 9. UX, TIMING & AI WAITING
- **Časomíra (Elapsed Time):** Stopky s přesností na stovky milisekund.
- **Stav čekání na AI:** Zobrazení vybraného providera/modelu, stávající latence a odpočtu do timeoutu (25 s).
- **Průhlednost:** Pokud dojde k AI fallbacku nebo vypršení limitu, rozsvítí se varovný indikátor a uzel přepne do deterministického offline režimu.
- **Žádné falešné indikátory:** Žádná falešná procenta dokončení; zobrazují se pouze reálné stavy kroků a reálné stopy.

---

## 10. DATABÁZOVÝ MODEL
- **Potřeba nového DB modelu:** **ŽÁDNÝ NOVÝ DB MODEL (NONE)**.
- **Zdůvodnění:** Trace lze dynamicky rekonstruovat ze stávajících `AuditLog` záznamů, in-memory paměťového trace bufferu a `ControlPlaneAction` položek.

---

## 11. KONTROLA DUPLICIT
- V projektu neexistuje žádný jiný interaktivní SVG mind-map renderer pro AI traces.
- Komponenta bude vytvořena jako čistá nová modulární vizualizace (`OrionTraceMindMap.tsx`).

---

## 12. TEST PLAN (PRO FÁZI 6B)
1. **Trace Rendering Test (`tests/orion-trace-visualization.test.ts`):**
   - Ověření správného pořadí a vyrendrování všech 11 uzlů.
2. **Fallback & Timeout Test:**
   - Ověření přepnutí vizualizace uzlu AI Provider do stavu fallback při selhání Gemini.
3. **Security & Sanitization Test:**
   - Test, že trace data neobsahují PII ani uníknuté akční klíče.
4. **User ∩ Orion Capabilities Test:**
   - Ověření správného vyhodnocení a zobrazení průniku oprávnění v uzlu PERMISSION INTERSECTION.
5. **DRAFT Action Verification Test:**
   - Test, že vytvořená akce v uzlu CONTROL PLANE zůstává striktně v DRAFT a tlačítko schválení vyžaduje lidskou intervenci.

---

## 13. SOUHRNNÝ STAV AUDITU
- **Stav:** **PASS**
- **Orion Trace Readiness:** **READY**
- **Existing Telemetry:** **FOUND**
- **Database:** **NONE (Není vyžadován nový model)**
- **Notion Mirror:** **READY (Katalogizovaný mirror)**
- **Security:** **PASS**
- **Duplicity:** **NO**
- **Rizika:** **LOW**
