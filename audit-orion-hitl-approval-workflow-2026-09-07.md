# CMD-ORION-20260907-013 — IMPLEMENTACE SKUTEČNÉHO HITL WORKFLOW

## GIT BASELINE
- **Branch:** `feat/ai-policy-council-integration-20260907`
- **Starting HEAD:** `97314b74ddf0a9782bef2dd7946eb7a5c0a61802`

## IMPLEMENTED WORKFLOW
1. **PENDING REQUEST CREATION:** Modified `requireOrionAuth` to handle the `REQUIRE_HUMAN_APPROVAL` decision from `ControlPlaneAuthorization`. When triggered, it creates a structured `OrionApprovalRequest` ticket containing all context (agentId, capabilityId, userId, riskLevel, payload, etc.) and halts the Express chain, returning `202 Accepted`.
2. **APPROVAL STORAGE:** Implemented `OrionApprovalStore`, an in-memory/fallback database for holding these `PENDING` tickets with 24-hour expiration.
3. **APPROVAL API:** Created three new HTTP endpoints in `orionRoutes.ts` mapped under `/api/admin/orion/approvals`:
   - `GET /approvals`
   - `POST /approvals/:id/approve`
   - `POST /approvals/:id/reject`
4. **SECURE EXECUTION RETRY:** Re-execution does not happen asynchronously on the server to prevent Express payload simulation complexities. Instead, the client injects the `x-orion-approval-id` header upon retry. The middleware intercepts this, verifies the status is strictly `APPROVED`, validates the `userId` bindings, and critically, **re-evaluates all security gates** via `authorizeAgentRequest` to ensure the Policy Engine hasn't changed.
5. **BYPASS PREVENTION:** The flow preserves the fail-closed nature. Only `ALLOW` passes. `DENY` fails immediately. SUPER_ADMINs must use the official `/approve` endpoints; they cannot bypass the middleware gate.

## VERIFICATION & TESTS
- **VERIFIED:** ALLOW, DENY, HITL states.
- **VERIFIED:** Ticket Creation, Approval, Rejection, and Expiration.
- **VERIFIED:** User binding checks (Execution fails if a different user attempts to use the approval ticket).
- **VERIFIED:** Post-approval Gate Checking (Execution fails if the Policy Engine transitions to a hard DENY between approval and execution).
- **VERIFIED:** SUPER_ADMIN cannot bypass the `requireOrionAuth` gate directly.
- **NOT VERIFIED:** RUNTIME (PostgreSQL unavailable `P1001`, system falls back to Memory Store. Real runtime could not be tested E2E).

## TOOLCHAIN
- **Typescript Check:** PASS
- **Build (Vite + esbuild):** PASS
- **Focused Tests:** PASS (`orion-hitl-workflow.test.ts` completed with 5/5 assertions. Adversarial tests passed 97/97).

## CONCLUSION
The true "Human In The Loop" (HITL) approval system has been successfully decoupled from a raw 403 into a secure, ticket-based asynchronous authorization workflow.
