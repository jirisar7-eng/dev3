# AUDIT_2026-08-26_PR11_CODERABBIT_FIXES

## 1. Cíl
Oprava chyb reportovaných pomocí CodeRabbit PR review a dokončení 17bodového bezpečnostního hardenening checklistu pro PR #11 (feat/ai-failsafe-client-prompt-hardening).

## 2. Rozsah a Dotčené komponenty
* `scripts/test-runner.js`: Izolace JWT secrets od produkce.
* `src/routes/aiRoutes.ts`: Implementace server-side scénářů (server-authoritative), input validation (413 Payload Too Large, max 5000 chars), fail-closed handling.
* `src/services/brandingService.ts`: Transakce pro zamezení souběhu.
* `prisma/schema.prisma`: Zabránění kaskádovým mazáním (`LegalAuditLog`, `CoParentAuditLog`).
* `tests/p0-2-1-ai-forms-source-fidelity.test.ts`: Přepracováno na endpoint API pomocí `supertest` pro testování reálné logiky v `aiRoutes.ts`.
* `src/services/seedService.ts` a `src/services/githubPublisherService.ts`: Model upgrady na `gemini-3.6-flash`, odstranění redundantních dotazů.

## 3. Riziko
* Kaskádová smazání (Cascade) mohou vést ke ztrátě auditních dat. (VYŘEŠENO přes `SetNull`)
* Neřízený rate-limiting a failovers (VYŘEŠENO pomocí `aiRoutes.ts` logiky a retry limitů).

## 4. Výsledek Testů
* `npm test`: PASS (14 sad)
* `npm run lint`: Očekává se PASS
* `npm run build`: Očekává se PASS
* `npx prisma validate`: PASS
* Kompletně zachována architektura fail-closed a zero-PII leak.

## 5. Změněné soubory
* `scripts/test-runner.js`
* `src/routes/aiRoutes.ts`
* `src/components/public/ai/AiSimulatorView.tsx`
* `src/components/public/ai/AiAssistantView.tsx`
* `src/services/brandingService.ts`
* `src/services/seedService.ts`
* `src/services/githubPublisherService.ts`
* `prisma/schema.prisma`
* `tests/p0-2-1-ai-forms-source-fidelity.test.ts`
