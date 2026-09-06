# Phase 2B-0 — Safe Agent Dispatch Frontend Client

## 1. Scope
Implementation of a secure, typed frontend client layer for `POST /api/admin/agent/dispatch`. This acts as a foundation before migrating existing AI flows in `QADashboard.tsx` to the new Unified Agent Layer, ensuring zero disruption to existing legacy processes.

## 2. Existing Frontend Client Architecture
- Core fetching is performed via `apiFetch` in `src/utils/apiClient.ts`.
- `apiFetch` handles basic 401 interception but does not impose global timeouts, retries, or structured response parsing.
- JWT tokens are manually read from `localStorage` (`tatovacesta_auth_token`) in various components before each `apiFetch`.

## 3. Existing `apiFetch` Analysis
- Used across the frontend natively passing standard `fetch` arguments.
- It returns a raw `Response` promise.
- `safeJsonResponse` helper safely parses JSON, dropping invalid responses.
- We opted to reuse this pattern, wrapping it in a strongly typed client specific to the agent dispatch route.

## 4. AgentDispatch Request Contract
Defined strictly as `AgentDispatchRequest`:
- Allows: `agentId`, `capabilityId`, `payload`, `targetResource`, `requestedOperation`.
- Actively deletes any attempt to inject: `user`, `actor`, `role`, `permissions`, `approval`, `approvalId`, `ticketId`, `traceId`, `provider`, `preferredProvider`, `model`, `systemPrompt`, `temperature`, `maxTokens`.

## 5. AgentDispatch Response Contract
Defined structurally as `AgentDispatchResponse`:
- `success`: boolean
- `decision`: `SUCCESS | DENY | REQUIRE_HUMAN_APPROVAL | ERROR`
- `data`: Typed result
- `error`: Error message
- `message`: Pending message
- `ticketId`: The server-generated human approval ticket ID
- `traceId`: The audit trace ID

## 6. HTTP Status Mapping
- **200-299 (Except 202):** `SUCCESS`
- **202 Accepted:** `REQUIRE_HUMAN_APPROVAL`
- **403 Forbidden:** `DENY`
- **400, 401, 413, 429, 5xx:** `ERROR`
- All technical exceptions or network errors map safely to `ERROR` without leaking stack traces.

## 7. Human Approval Handling
Handled inherently via mapping HTTP 202 to the `REQUIRE_HUMAN_APPROVAL` decision state, extracting the server-supplied `ticketId` directly. The frontend client does NOT generate or construct approval tickets.

## 8. Security Boundary
- Re-verified that the client securely strips spoofing fields prior to serialization.
- Validates the presence of `agentId` and `capabilityId` client-side to prevent malformed requests from hitting the server.
- Leaves RBAC and auth strictly to the backend and `localStorage` token parsing.

## 9. Data Analyst Compatibility
- Explicit compatibility with `DATA_ANALYST` and capabilities `report.generate`, `analytics.read`, and `metrics.query` verified in tests.
- Deprecated manual `{ provider: 'auto' }` inputs from old legacy architectures are natively ignored by the new request stripping logic.

## 10. Timeout Analysis
- Passed down `AbortSignal` capability exists to allow React components to cancel requests on unmount or on a manual timer.
- Complex timeout handling or long-polling is delegated to Phase 2B-1 (UI Integration) to manage UX states appropriately, since `apiFetch` does not implement automatic polling.

## 11. Tests
- **Created file:** `tests/agent-dispatch-frontend-client-phase2b0.test.ts`
- **Results:** 14/14 Passed.
- Verifies all HTTP status mappings, spoofing resistance, invalid inputs, and AbortSignal handling.

## 12. Typecheck
- **Command:** `npm run lint` (runs `tsc --noEmit`)
- **Status:** PASS

## 13. Lint
- **Status:** PASS (Merged with Typecheck in package script)

## 14. Build
- **Command:** `npm run build`
- **Status:** PASS

## 15. Git
- **Status:** NOT VERIFIED (Not a Git repository)

## 16. DB
- **Status:** PASS (No migrations or Prisma changes applied)

## 17. Findings P0-P3
- **None.** The frontend architecture allows a very clean API client implementation.

## 18. Remaining gaps
- UI needs to be updated to handle `decision === 'REQUIRE_HUMAN_APPROVAL'` gracefully (showing a pending state or an approval gate).

## 19. Recommended Phase 2B-1
- Proceed with Phase 2B-1: Migrate `QADashboard.tsx` to use the new `dispatchAgent` client instead of the legacy `POST /api/admin/qa/run-ai-analysis` endpoint. Implement UX handling for `REQUIRE_HUMAN_APPROVAL`.
