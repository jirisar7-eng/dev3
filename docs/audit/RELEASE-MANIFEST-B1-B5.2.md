# Release Manifest: Phase B1 - B5.2

**Datum:** 1. září 2026
**Oblast:** Operations E2E, Slack Inbound/Outbound, Outbox Worker
**Autor:** Hlavní softwarový architekt / DevSecOps inženýr
**Status:** READY FOR GITHUB HANDOFF

---

## 1. Release Scope
Tento release sjednocuje celou Fázi B1–B5.2 a zajišťuje zavedení robustního Operations Core. Architektura stojí na atomických transakcích uvozených přes Prisma (Outbox Pattern), integraci se službami Slack (Notification & Inbound Control) a Notion (Knowledge Mirror) včetně striktních RBAC ověření.

## 2. Changed / New Files

**Database & Core:**
- `prisma/schema.prisma` (Nové modely: SynthesisAudit, SynthesisAuditFinding, SynthesisVerification, SynthesisTicket, SynthesisTicketEvent, SynthesisTicketComment, OutboxEvent)
- `src/services/synthesisOperationsCore.ts`
- `src/services/outboxWorker.ts`

**Slack Integrations:**
- `src/services/slackNotificationService.ts`
- `src/services/slackIdentityService.ts`
- `src/middleware/slackAuthMiddleware.ts`
- `src/routes/slackWebhookRoutes.ts`

**Notion Integration:**
- `src/services/audit/knowledgeMirrorService.ts`

**Scripts & Tests:**
- `scripts/dev3-live-verification.ts`
- `tests/e2e-operations.test.ts`
- `tests/slackInboundGateway.test.ts`
- `tests/slackNotificationService.test.ts`

**Audit Reports:**
- `docs/audit/AUDIT-OPERATIONS-CORE-B2.1-SECURITY.md`
- `docs/audit/AUDIT-SLACK-INBOUND-GATEWAY-B4.md`
- `docs/audit/AUDIT-SLACK-INBOUND-GATEWAY-B4-VERIFICATION.md`
- `docs/audit/AUDIT-OPERATIONS-INTEGRATION-B5.md`
- `docs/audit/AUDIT-OPERATIONS-B5.1-E2E-DELIVERY-SEMANTICS.md`
- `docs/audit/AUDIT-OPERATIONS-B5.2-LIVE-VERIFICATION-PLAN.md`
- `docs/audit/AUDIT-OPERATIONS-B5.2.1-PREFLIGHT.md`
- `docs/audit/AUDIT-OPERATIONS-B5.2.2-RELEASE-HANDOFF.md`
- *(Missing: `docs/audit/AUDIT-OPERATIONS-CORE-B2.md`)*

## 3. Prisma Changes
- **Status:** Bezpečné a aditivní modely. Žádné mazání sloupců ani dat.
- **Akce před spuštěním:** `npx prisma generate` a `npx prisma migrate deploy` (případně ekvivalent v závislosti na CI/CD).

## 4. Test Results
- **Unit a Integrační (Slack Outbound/Inbound):** PASS 🟢
- **Statická Analýza (TSC, Lint):** PASS 🟢
- **E2E (DB / Outbox worker flow):** PARTIAL 🟡 (Lokální prostředí neobsahuje běžící PostgreSQL daemona, Live Test čeká na DEV3 nasazení)

## 5. Security Results
- **Hardcoded Secrets:** Nenalezeny. Veškeré proměnné proudí výhradně přes `process.env`.
- **RBAC & Authorization:** Validováno, Inbound příkazy uplatňují restriktivní HMAC SHA-256 ověření se Slack Signing Secret a uživatelskou Slack/GCP e-mail mapou. Fail-closed.
- **Data Isolation:** Skript pro Live-Verification na DEV3 testuje výhradně eventy pod vlastním klíčem (`LIVE-E2E-TEST-*`). Nesahá na existující produkční eventy.

## 6. Deployment Prerequisites (ENV Variables)
Operátor musí zajistit na produkci následující proměnné:
- `DATABASE_URL` (Required)
- `SLACK_BOT_TOKEN` (Required)
- `SLACK_DEFAULT_CHANNEL_ID` (Required)
- `SLACK_SIGNING_SECRET` (Required)
- `NOTION_API_KEY` (Required)
- `NOTION_DATABASE_ID` (Required)

## 7. Rollback Postup
Jelikož Prisma změny pouze přidávaly nové tabulky (Synthesis), nedošlo k zásahu do stávajících identit. V případě fatálního selhání:
1. Revert Git commity a deployment aplikačního kódu o verzi nazpět.
2. Není potřeba provádět downgrade databáze, starý kód nové tabulky ignoruje.
3. Restart procesů (kontejner).

## 8. Stav LIVE Verification
- **Current State:** NOT YET VERIFIED
- Pro dokončení verifikace je vyžadováno po nasazení (GitHub -> DEV3) ruční spuštění příkazu operátorem:
`npx tsx scripts/dev3-live-verification.ts`
- Očekává se vizuální potvrzení doručení do příslušného Slack Channelu a zrcadla v Notionu.
