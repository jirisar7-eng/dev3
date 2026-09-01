# Operations B5.2.2 Release Candidate & GitHub Handoff Audit

**Datum:** 1. září 2026
**Oblast:** Phase B5.2.2 — Release Candidate & GitHub Handoff
**Autor:** Hlavní softwarový architekt / DevSecOps inženýr
**Status:** 🟢 READY FOR DEPLOYMENT

---

## 1. Release Scope

Tento release zahrnuje kompletní Fázi B1 až B5.2.1, pokrývající Operations Core, Outbox Pattern, Slack Outbound/Inbound integraci a Notion zrcadlení auditu.

### Changed Files
- `prisma/schema.prisma` (přidány nové modely)
- `src/services/audit/knowledgeMirrorService.ts`
- `src/services/githubPublisherService.ts` (modifikace integrace)
- `src/middleware/slackAuthMiddleware.ts`
- `src/routes/slackWebhookRoutes.ts`
- `src/services/slackIdentityService.ts`
- `src/services/slackNotificationService.ts`
- `src/services/synthesisOperationsCore.ts`
- `src/services/outboxWorker.ts`

### New Files
- `scripts/dev3-live-verification.ts` (Live E2E verifikační skript)
- `tests/e2e-operations.test.ts`
- `tests/slackInboundGateway.test.ts`
- `tests/slackNotificationService.test.ts`
- `docs/audit/AUDIT-OPERATIONS-B5.1-E2E-DELIVERY-SEMANTICS.md`
- `docs/audit/AUDIT-OPERATIONS-B5.2-LIVE-VERIFICATION-PLAN.md`
- `docs/audit/AUDIT-OPERATIONS-B5.2.1-PREFLIGHT.md`
- `docs/audit/AUDIT-OPERATIONS-B5.2.2-RELEASE-HANDOFF.md`

## 2. Database Changes
*   **Nově přidané modely:** `SynthesisAudit`, `SynthesisAuditFinding`, `SynthesisVerification`, `SynthesisTicket`, `SynthesisTicketEvent`, `SynthesisTicketComment`, `OutboxEvent`.
*   **Safety:** Bezpečné, zpětně kompatibilní. Nedochází k alteraci/mazání existujících tabulek.
*   **Required Deployment Action:** `npx prisma generate` a `npx prisma migrate deploy` (případně `npx prisma db push`, dle zvyklostí prostředí).

## 3. Required ENV

Ověřeno proti kódové bázi, tyto proměnné musí operátor zajistit na DEV3:

*   `DATABASE_URL` — **REQUIRED** (Prisma / PostgreSQL)
*   `SLACK_BOT_TOKEN` — **REQUIRED** (Odesílání zpráv do Slacku, `SlackNotificationService`)
*   `SLACK_DEFAULT_CHANNEL_ID` — **REQUIRED** (Fallback kanál pro notifikace)
*   `SLACK_SIGNING_SECRET` — **REQUIRED** (Ověřování příchozích webhooků v `slackAuthMiddleware`)
*   `NOTION_API_KEY` — **REQUIRED** (Mirror do Notionu. Kód podporuje fallback na `NOTION_TOKEN`)
*   `NOTION_DATABASE_ID` — **REQUIRED** (Cílová databáze pro KnowledgeMirrorService)

## 4. Pre-Deployment Checks

V AI Studio byly spuštěny následující prověrky zaručující Release Security:
*   **No Hardcoded Secrets:** Žádné tajemství (klíče, tokeny) neopustilo `.env`. Kód je čistě zprostředkovává via `process.env`.
*   **Test Data Isolation:** Verifikační skript `scripts/dev3-live-verification.ts` ověřuje a procesuje čistě data s prefixem `LIVE-E2E-TEST-` izolovaně nad specifikovaným `aggregateId`.
*   **SQL Safety:** Skripty ani runbooky neobsahují zranitelné operace bez kvalifikátorů a limitů.

## 5. GitHub → DEV3 Synchronization
Doporučený Commit Message:
`feat(operations): B1-B5.2 release candidate for operations core, outbox and slack/notion integrations`

Následně po push na GitHub by se změny měly automaticky nebo manuálně nasadit na DEV3.

## 6. Prisma Deployment
Uvnitř DEV3 kontejneru / buildu musí proběhnout (v tomto pořadí):
1. `npm install` (pro případ nových závislostí)
2. `npx prisma generate`
3. `npx prisma migrate deploy`

## 7. Application Build
Standardní build proces prostředí:
`npm run build`

## 8. Container Restart
Nová verze kontejneru a OutboxWorker background procesu musí být spuštěna (např. přes Docker Compose, PM2 nebo ekvivalentní orkestrátor).

## 9. Health Verification
Kontrola aplikačního zdraví, např.:
`curl -I http://localhost:3000/api/health`

## 10. Live E2E Test
Spustit izolovaný ověřovací skript s ohledem na test-data-isolation:
`npx tsx scripts/dev3-live-verification.ts`

## 11. Slack & Notion Verification
Operátor se musí prokliknout do Slack konfigurovaného kanálu a Notion DB pro vizuální potvrzení příletu `LIVE-E2E-TEST` entit. 

## 12. Failure Handling
Při FAIL výsledku u `dev3-live-verification.ts` ověřit DB spojení a Slack limity. Skript se ukončuje kódem `1` na první kritické chybě (fail-closed).
Nejsou generována žádná rozbitá provozní data, rollback není vyžadován. 

## 13. Rollback
Vzhledem k aditivnímu charakteru DB migrace, v případě fatální aplikační chyby postačí reverze na předchozí Git commit aplikačního kódu a restart kontejneru. Downgrade databáze není nutný, nové tabulky nebudou překážet starému kódu.

## 14. Evidence Collection
Pro potřeby následného reportu je nezbytné uložit screenshot dorazivší zprávy na Slacku a v Notionu a přidat jej do ticketa (nebo jako odkaz).

## 15. Final Verdict
Z pohledu zdrojového kódu, statické analýzy a bezpečnostních perimetrů platformy AI Studio je větev připravena.

**Kritéria pro LIVE VERIFIED (v další fázi):** Vizuální potvrzení operátora nad živým DEV3 během `dev3-live-verification.ts`.
