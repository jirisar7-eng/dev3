# Audit — Orion Global Control Plane & Shell

- Datum: 2026-09-07
- Projekt: Táta má právo / Synthesis Hub
- Větev: feat/ai-policy-council-integration-20260907
- HEAD před commitem auditu: e41e7904fcda9bea8a800af57932956165671feb
- Typ: READ-ONLY architektonický a bezpečnostní audit
- Stav implementace: UNCOMMITTED WORKTREE

---

## 1. Rozsah

Audit ověřuje výhradně komponenty a změny globální architektury Orion:
- `src/services/orion/orionTypes.ts`
- `src/services/orion/orionControlPlane.ts`
- `src/routes/orionGlobalRoutes.ts`
- `src/components/orion/OrionGlobalShell.tsx`
- `server.ts` (registrace a mount `/api/orion`)
- `src/App.tsx` (globální integrace `<OrionGlobalShell />`)
- `src/services/controlPlaneAuthorization.ts` (doplnění `content.write` do ORION_BASE_CAPABILITIES a podpora role EDITOR)
- `tests/orion-global-control-plane.test.ts` (testovací sada 13 scénářů)

Vedlejší změny v pracovním stromu (telemetrie, orchestrátor modelů, patch skripty atd.) jsou evidovány v sekci 5 a **nejsou** součástí Orion implementace ani tohoto commitu.

---

## 2. Implementace

### Orion Types (`src/services/orion/orionTypes.ts`)
- ✅ `OrionDecision`: Typový svazek `'ALLOW' | 'DENY' | 'AI_RECOMMENDATION' | 'HUMAN_APPROVAL_REQUIRED'`.
- ✅ `OrionContext`: Striktní kontext relace (`user`, `userRole`, `effectiveCapabilities`, `currentRoute`, `pageContext`, `correlationId`).
- ✅ `OrionQueryRequest`: Požadavek klienta (`message`, `currentRoute`, `pageContext`, `requestedCapability`, `correlationId`).
- ✅ `OrionProposedAction`: Struktura pro návrhy akcí (`title`, `intent`, `targetResource`, `riskLevel`, `requiresHumanApproval`, `operationId`).
- ✅ `OrionQueryResponse`: Odpověď Oriona se stavem, rozhodnutím, odznaky důvěryhodnosti a navrženými akcemi.

### Orion Control Plane (`src/services/orion/orionControlPlane.ts`)
- ✅ Využití existující `ControlPlaneAuthorization` a `ControlPlaneService`.
- ✅ Žádné duplicitní vyhodnocování rolí (RBAC).
- ✅ Fail-closed pro neznámé capabilities: okamžité zamítnutí s chybou `Unknown capability`.
- ✅ Fail-closed pro neoprávněné capabilities: vyvolání `authorizeOrionCapability` s návratem `DENY`.
- ✅ Striktní oddělení oborů (`PUBLIC` pro anonymní relaci, `AUTHENTICATED` pro běžné role, `ELEVATED` pro adminy).
- ✅ Human-in-the-loop (HITL): Detekce mutujících nebo vysoce rizikových operací (`P0`, `P1`, `CRITICAL`) v `ControlPlaneService.analyzeIntent`. Vynucení rozhodnutí `HUMAN_APPROVAL_REQUIRED` s návrhovou kartou DRAFT.
- ✅ AI Policy Engine integrace: respektování globální politiky `aiPolicyEngine` a okamžitý zákaz při restrikci.
- ✅ Auditní logování: Záznam událostí přes `AuditService.recordLog` bez ukládání hesel, tokenů nebo citlivých PII.
- ✅ CorrelationId: Generování a propagace napříč celým požadavkem.

### Global API (`src/routes/orionGlobalRoutes.ts`)
- ✅ `POST /api/orion`: Hlavní endpoint pro dotazování Oriona.
- ✅ `GET /api/orion/context`: Poskytnutí aktivního kontextu a efektivních capabilities pro UI.
- ✅ Zod validace: Kontrola schématu dotazu (`min(1)`, `max(4000)`).
- ✅ Zákaz klientských credentialů: Požadavky obsahující `apiKey`, `token`, `secret` nebo `password` jsou okamžitě odmítnuty (HTTP 400).
- ✅ Identita výhradně ze serveru: Uživatel je čerpán výhradně z `(req as AuthenticatedRequest).user`.
- ✅ Server mount: Registrováno v `server.ts` pod `/api/orion`.

### Global Shell (`src/components/orion/OrionGlobalShell.tsx`)
- ✅ Jedna globální instance plovoucího widgetu s ikonou 👁️.
- ✅ Integrace v nejvyšším společném layoutu v `src/App.tsx` (vedle `PWAInstallPrompt`).
- ✅ Striktní hranice klient/server: Žádné server-only importy (`fs`, `child_process`, `prisma`, `process.env`, `aiPolicyEngine`).
- ✅ Kontextová citlivost: Sleduje `currentPath` a `pageContext`.
- ✅ Read-only zobrazení capabilities: UI zobrazuje capabilities výhradně informativně; neuděluje oprávnění.
- ✅ Jasné rozhodovací stavy v chatu: Odznaky `AI_RECOMMENDATION`, `ALLOW`, `DENY`, `HUMAN_APPROVAL_REQUIRED`.

---

## 3. Bezpečnost

- ✅ **Privilege Escalation:** Vyloučena. Orion přebírá průnik oprávnění uživatele a Oriona (`userCapabilities ∩ ORION_BASE_CAPABILITIES`).
- ✅ **SUPER_ADMIN Bypass:** Vyloučen. Destrukce / mutace vynucují `HUMAN_APPROVAL_REQUIRED`. Orion nemá autoritu akce sám provést.
- ✅ **Anonymní přístup k interním datům:** Blokován. Jakýkoliv pokus o čtení hesel, interních dat nebo spuštění chráněných capabilities vrací `DENY`.
- ✅ **Token / Password / Secret Exposure:** Ošetřeno. V logách, odpovědích ani chybových hláškách se nevyskytují tajné klíče. Prompty jsou před zpracováním sanitizovány (`sanitizeText`).
- ✅ **Podvržení identity klientem:** Zamezeno. Klient nemůže poslat identitu ani roli v těle požadavku; autoritativní je serverová relace.
- ✅ **Policy Engine Bypass:** Zamezeno. Politika má přednost před rozhodnutím asistenta.
- ✅ **Důvěryhodnost IP adres:** Server má nastaveno `app.set('trust proxy', 1)`. V endpointu je použita standardní extrakce s bezpečným fallbackem na `socket.remoteAddress` a `127.0.0.1`.

---

## 4. Testy

### Skutečný výsledek testovacích sad (vitest):
1. **`tests/orion-global-control-plane.test.ts`**
   - 1. Unauthenticated public request: safe AI_RECOMMENDATION — **PASS**
   - 2. Unauthenticated protected request DENY — **PASS**
   - 3. USER allowed capability (content.read) — **PASS**
   - 4. USER forbidden capability DENY (audit.run) — **PASS**
   - 5. EDITOR allowed capability (content.write) — **PASS**
   - 6. ADMIN allowed capability (audit.run) — **PASS**
   - 7. SUPER_ADMIN privileged capability (HUMAN_APPROVAL_REQUIRED) — **PASS**
   - 8. Unknown capability DENY (fail-closed) — **PASS**
   - 9. Authorization error DENY — **PASS**
   - 10. Policy Engine DENY — **PASS**
   - 11. Privilege escalation DENY — **PASS**
   - 12. CorrelationId propagation — **PASS**
   - 13. CurrentPath propagation — **PASS**
   - **Výsledek:** 13/13 PASSED (0 FAILED)

2. **`tests/orion-safety-bridge.test.ts`**
   - 11/11 PASSED (0 FAILED)

3. **Build ověření (`compile_applet` / `vite build` + backend bundle):**
   - **Výsledek:** SUCCESS (žádné kompilační chyby)

---

## 5. Vedlejší změny (Mimo Orion scope)

Následující soubory v pracovním stromu patří k předchozí práci na dynamickém katalogu modelů a telemetrii a **NESMÍ** být zahrnuty do Orion commitu:

- `src/components/admin/audit/AiTelemetryCard.tsx`
- `src/services/qa/ai/aiStats.ts`
- `src/services/qa/ai/providers/geminiProvider.ts`
- `src/services/qa/ai/providers/grokProvider.ts`
- `src/services/qa/ai/providers/groqProvider.ts`
- `src/services/qa/ai/synthesisMultiAIOrchestrator.ts`
- `src/services/qa/ai/types.ts`
- `audit.md`
- `patch_*.cjs`
- `test-browser*.mjs`
- `test-pece.mjs`
- `src/tests/aiModelRegistry.test.ts`

---

## 6. Závěr

### ✅ Ověřené skutečnosti
- Globální architektura Orion splňuje princip Zero Trust a Fail-Closed.
- UI komponenta `OrionGlobalShell` je jediným globálním prvkem s ikonou 👁️ a pouze zobrazuje oprávnění.
- Všechny testy (13/13 v novém testu a 11/11 v bezpečnostním mostu) procházejí na 100 %.
- Aplikace se bez chyb zkompilovala do produkčního tvaru.

### 🟡 Předpoklady / Návrhy
- Do budoucna v navazující fázi integrovat možnost potvrzení `HUMAN_APPROVAL_REQUIRED` akcí přímo přes bezpečný modal napojený na dvoufázové potvrzení v administrátorském Control Plane.

### 🔴 Bezpečnostní nálezy
- **P0/P1:** Žádné.
- **P2/P3:** Žádné.

### Seznam souborů pro budoucí Orion commit:
1. `src/services/orion/orionTypes.ts`
2. `src/services/orion/orionControlPlane.ts`
3. `src/routes/orionGlobalRoutes.ts`
4. `src/components/orion/OrionGlobalShell.tsx`
5. `src/services/controlPlaneAuthorization.ts`
6. `server.ts`
7. `src/App.tsx`
8. `tests/orion-global-control-plane.test.ts`
9. `CHANGELOG.md`

### Seznam souborů, které zůstávají mimo Orion commit:
- `src/components/admin/audit/AiTelemetryCard.tsx`
- `src/services/qa/ai/aiStats.ts`
- `src/services/qa/ai/providers/geminiProvider.ts`
- `src/services/qa/ai/providers/grokProvider.ts`
- `src/services/qa/ai/providers/groqProvider.ts`
- `src/services/qa/ai/synthesisMultiAIOrchestrator.ts`
- `src/services/qa/ai/types.ts`
- `audit.md`
- `patch_*.cjs`
- `test-browser*.mjs`
- `test-pece.mjs`
- `src/tests/aiModelRegistry.test.ts`

---
*Status: Implementace samotného Oriona v pracovním stromu je kompletní a připravena k samostatnému oddělenému commitu po commitnutí tohoto auditu.*
