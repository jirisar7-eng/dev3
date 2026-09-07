# CMD-ORION-20260907-012 — HITL & CENTRAL AUTHORIZATION RECONCILIATION

## GIT BASELINE
- **Branch:** `feat/ai-policy-council-integration-20260907`
- **Starting HEAD:** `47a1ceb0b28f093f9fb98ff13e04dd7fe3c931fe`

## VERIFICATION & IMPLEMENTATION

### 1. CENTRAL AUTHORIZATION RECONCILIATION
- **Issue Found:** `ControlPlaneAuthorization.authorizeAgentRequest` previously returned `ALLOW` without invoking `aiPolicyEngine.evaluatePolicy`. The policy check was duplicated loosely in `aiRoutes.ts` and absent in `AgentDispatcher`.
- **Fix Implemented:** Reconciled central authorization. `aiPolicyEngine.evaluatePolicy` is now directly embedded and strictly enforced in `ControlPlaneAuthorization.authorizeAgentRequest` (Step 8.5). Any agent operation now must pass RBAC, capability validation, and global AI Policy constraints simultaneously.

### 2. DIRECT AI BYPASS VULNERABILITY (P1)
- **Issue Found:** Several protected analytical endpoints directly invoked `AiService.generateContent` (either explicitly or via `OrionService` / `JudgmentParserService`), completely bypassing `ControlPlaneAuthorization` and `aiPolicyEngine`.
- **Affected Routes:**
  - `POST /api/cases/:caseId/parse-judgment`
  - `POST /api/admin/audit-center/orion/analyze`
  - `POST /api/admin/audit-center/orion/propose-action`
  - `POST /api/admin/orion/run`
  - `POST /api/orion` (Global Public Assistant)
- **Fix Implemented:** Created `requireOrionAuth` middleware wrapping `ControlPlaneAuthorization.authorizeAgentRequest` for express endpoints. Added `requireOrionAuth('ai.generate')` and `requireOrionAuth('ai.chat')` directly into the routing definitions of all previously bypassed endpoints. The invariant "Client -> protected route -> Orion gates -> AiService" is now structurally enforced across the whole platform.

### 3. HITL (Human In The Loop) WORKFLOW
- **Status:** **NOT IMPLEMENTED**
- **Details:** `REQUIRE_HUMAN_APPROVAL` is defined in API contracts (202 status codes in models) and in `AgentDispatcher` (returns `PENDING-TICKET-*`). However, there is no actual `ControlPlaneTicketEngine` implementation to persist, manage, or approve these tickets. Furthermore, `enforceOrionAuth` explicitly fails closed with a `403` status if `decision !== 'ALLOW'`.
- **Action Taken:** Kept fail-closed behavior. No custom workaround or fake auto-approval was implemented. Documented as missing workflow.

### 4. MFA ENFORCEMENT
- **Status:** VERIFIED
- **Details:** `requireAuth` calls `checkUserStatusAndMfa(req.user, req, res)`, blocking non-MFA verified administrative accounts. Derived securely from JWT payload. `PREVIEW_ACTOR` isolated.

## TESTS & TOOLCHAIN
- **Typescript Check:** PASS
- **Build (Vite + esbuild):** PASS
- **Focused Tests:** PASS (Vitest adversarial test suite verified successfully).
- **Runtime:** NOT VERIFIED (PostgreSQL is unavailable `P1001`, skipped E2E runtime evaluation to prevent fake success assertions).

## CONCLUSION
P1 vulnerabilities regarding direct AiService access and decoupled Policy Engine validations were successfully remediated via structural route-level gates and centralized authorization hooks.
