# AUDIT: ORION Převzetí funkcí AI Engine v3.6

**Datum:** 2026-09-07
**Účel:** Migrace nezávislých AI funkcí (AI Engine v3.6, BIFF Převodník, Opatrovnický asistent) pod jednotnou identitu a autorizační strukturu Orion. Zajištění fail-closed autorizace, RBAC a Policy Engine dohledu.
**Riziko:** P0/P1 (Privilege escalation, auth bypass, leak) - ZMÍRNĚNO

## 1. Výchozí stav (Před změnou)
Funkce jako "BIFF Převodník" a "AI Opatrovnický asistent" běžely jako nezávislá "druhá AI identita" (AI Engine v3.6) v souboru `src/routes/aiRoutes.ts`.
Tyto endpointy sice využívaly `requireAuth` pro některé cesty, ale **nebyly zapojeny do Orion Control Plane**. Nebyly vyhodnocovány přes `ControlPlaneAuthorization.authorizeAgentRequest`, nevyužívaly `AgentRegistry` a ignorovaly pravidla definovaná v `AiPolicyEngineService`.

## 2. Postup analýzy
1. Provedena READ-ONLY analýza `src/routes/aiRoutes.ts` (API endpointy: `/chat`, `/biff-convert`, `/guide-plan`, `/analyze-document`, `/simulator-evaluate`).
2. Analýza `src/services/agentRegistry.ts` a `src/services/agentCapabilityCatalog.ts`. Zjištěno, že pro Orion nebyl definován agent se specifickými capabilitami `ai.chat` a `ai.generate`.
3. Ověření fungování Policy Engine a MFA v rámci `requireAuth` a `authorizeAgentRequest`. Zjištěno, že ačkoli se auth checks aplikují částečně, plná Orion autorizace vyžaduje dedikovaný scope a ověření.
4. Identifikovány testy (např. `p0-2-1-ai-forms-source-fidelity.test.ts`), které bylo nutné aktualizovat tak, aby posílaly validní mock MFA a procházely nově nasazenou Orion autorizací.

## 3. Co bylo změněno
*   **API (`src/routes/aiRoutes.ts`):** 
    * Všechny POST endpointy nyní obaluje lokální wrapper `enforceOrionAuth`.
    * Prompty a persóny změněny z "AI Engine v3.6" nebo "Opatrovnický asistent" na deterministickou identitu "Orion".
*   **Authz Middleware:** `enforceOrionAuth` nyní volá `ControlPlaneAuthorization.authorizeAgentRequest` (vyžadující scope `ai-engine`) a následně striktně vyhodnocuje přes `aiPolicyEngine.evaluatePolicy()`.
*   **Agent Catalog (`src/services/agentRegistry.ts` a `agentCapabilityCatalog.ts`):** 
    * Přidán agent `agent-orion-qa-v1` se scopes `['audit.run', 'findings.view', 'actions.propose', 'ai.chat', 'ai.generate', 'ai-engine']`.
    * Do katalogu schopností (capabilities) doplněny specifikace `ai.chat` a `ai.generate` sdílené pro Orion a ADMIN_COPILOT.
*   **UI Komponenty:** Odstraněny marketingové zmínky "AI Engine v3.6" z UI (`AiAssistantView.tsx`), nahrazeny jednotnou identitou "Orion".

## 4. Vynucení Control Plane + HITL
Systém nyní splňuje pravidla:
`User Auth -> MFA check -> RBAC (ControlPlaneCapability) -> Agent Catalog -> Policy Engine -> Human Approval Gate`.
Jakýkoli nedostatek (např. chybějící oprávnění `ai.chat`, zablokování uživatele (SUSPENDED), výpadek Policy Engine nebo požadavek na P1 schválení) způsobí Fail-Closed stav (`403 Forbidden`). Tím je garantováno, že žádný AI dotaz (ani BIFF, ani dokumenty) nemůže proběhnout anonymně ani s obcházením limitů.

## 5. Výsledky bezpečnostních testů
*   Spuštěno: `vitest run tests/p0-2-1-ai-forms-source-fidelity.test.ts` (11 testů). Zpočátku selhalo z důvodu vynucené 2FA/MFA u mockovaného ADMIN uživatele. Po doplnění validního MFA stavu do mocku všechny testy **100% PROŠLY**.
*   Spuštěno: `vitest run tests/orion-adversarial-security.test.ts`, `tests/orion-action-catalog.test.ts`, `tests/orion-global-control-plane.test.ts`, `tests/agent-authorization-contract-phase1b.test.ts`. Zkouška plně úspěšná, původní bypass prevence zůstala neporušena.

## 6. Next Steps
*   [ ] Zahájit fázi **CMD-ORION-20260907-011**, pokud existuje – případně migrovat poslední zbytky `aiRoutes.ts` pod sjednocený modul.
*   [ ] Monitorovat latenci (vzhledem k přidání Policy Engine evaluace ke každému requestu) na produkci.
*   [ ] Zvážit vyčlenění `enforceOrionAuth` do globálního middleware adresáře pro čistší znovupoužitelnost v budoucích AI modulech.

**Závěr:** Nežádoucí dualita AI Engine v3.6 a Orion identity byla odstraněna. Architektura je sjednocena pod bezpečnou a plně auditovatelnou kontrolní rovinu.
