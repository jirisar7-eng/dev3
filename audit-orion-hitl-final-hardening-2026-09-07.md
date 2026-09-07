# CMD-ORION-20260907-015 — FINAL HITL FAIL-CLOSED REVALIDATION & PERSISTENCE

## GIT BASELINE
- **Branch:** `feat/ai-policy-council-integration-20260907`
- **Starting HEAD:** `26ecb98` (fix(orion): harden HITL approval binding and replay protection)

## P1 FINDINGS & RESOLUTIONS
1. **P1 — REVALIDATION FAILED OPEN:** Previously, if the re-authorization step after an approval returned `REQUIRE_HUMAN_APPROVAL`, the execution continued because it only blocked `DENY`. 
   *Fix:* Added explicit `hasValidHitlApproval` to `AgentAuthorizationRequest` and patched `ControlPlaneAuthorization.authorizeAgentRequest` to return `ALLOW` if the human approval requirement is satisfied by the verified binding. Added a strict fail-closed assertion in `requireOrionAuth`: `if (authRes.decision !== 'ALLOW')`, ensuring anything else strictly fails.
2. **P1 — IN-MEMORY FALLBACK PRO PRODUKČNÍ HITL:** `OrionApprovalStore` previously fell back to an in-memory Map if PostgreSQL was unreachable (`P1001`), which is an unacceptable loss of persistence and auditability in production.
   *Fix:* Completely removed production in-memory mapping. Re-implemented `OrionApprovalStore` to restrict the Memory Map strictly to `isTestEnvironment = process.env.NODE_ENV === 'test'`. For standard production execution, if PostgreSQL is offline or unreachable, the system fails closed with a severe Database Error and blocks execution.
3. **P1 — CANONICAL BINDING HARDENING:** The hash function was concatenating parts with pipes (`|`), which is prone to collision and parsing ambiguities.
   *Fix:* Implemented deterministic Canonical JSON Serialization mapping to a `{ bindingVersion: '1.0', ... }` object literal before executing the SHA-256 hash.

## TESTS AND COMMANDS EXECUTED
- **Type Checking:** `bunx tsc --noEmit` -> PASS
- **Build:** `npm run build` -> PASS (esbuild generated server runtime successfully)
- **Focused HITL & Agent Tests:** `bunx vitest run tests/orion-adversarial-security.test.ts tests/orion-action-catalog.test.ts tests/orion-global-control-plane.test.ts tests/agent-authorization-contract-phase1b.test.ts` -> PASS (97/97 passing).

## POSTGRESQL RUNTIME STATUS
- **Status:** **NOT VERIFIED**. The PostgreSQL container is fundamentally unreachable at `127.0.0.1:5432` in the current CI/CD step (yielding `P1001 DatabaseNotReachable`). Therefore, tests fallback to the test-only memory map. Production DB persistence could not be validated E2E.

## FINAL VERDICT
The core fail-closed logic, persistence hardening, canonical hashing, and revalidation logic is 100% complete and fully passing isolated tests. However, because the production PostgreSQL database was uncontactable to formally verify DB schema persistence without memory fallback, the CMD is recorded as **PARTIAL / NOT VERIFIED**.
