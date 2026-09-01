# Operations B5.2.1 Preflight Audit

**Datum:** 1. září 2026
**Oblast:** Phase B5.2.1 — DEV3 Live Verification Preflight Audit
**Autor:** Hlavní softwarový architekt / QA
**Status:** 🟢 DEV3 GO

---

## 1. ENV Variable Source of Truth
Byla provedena inspekce `process.env` ve zdrojovém kódu relevantním pro B5.
Rozpory mezi runbookem a kódem nebyly nalezeny, názvy odpovídaly implementaci.

| Service | Variable | Required | Actual code usage |
| :--- | :--- | :--- | :--- |
| `SlackNotificationService` | `SLACK_BOT_TOKEN` | Yes | `process.env.SLACK_BOT_TOKEN` |
| `SlackNotificationService` | `SLACK_DEFAULT_CHANNEL_ID` | Yes | `process.env.SLACK_DEFAULT_CHANNEL_ID` |
| `KnowledgeMirrorService` | `NOTION_API_KEY` | Yes | `process.env.NOTION_API_KEY \|\| process.env.NOTION_TOKEN` |
| `KnowledgeMirrorService` | `NOTION_DATABASE_ID` | Yes | `process.env.NOTION_DATABASE_ID` |
| `SlackAuthMiddleware` | `SLACK_SIGNING_SECRET` | Yes (Inbound)| `process.env.SLACK_SIGNING_SECRET` |
| `Prisma/DB` | `DATABASE_URL` | Yes | `process.env.DATABASE_URL` |

## 2. Nalezené nesoulady a opravy runbooku
Při analýze datové izolace a skriptů pro Live Test byly identifikovány a rovnou opraveny dvě P1 zranitelnosti ve vztahu k produkčním (non-testovacím) datům a bezpečnosti:

### A. Oprava izolace (P1 Data Isolation)
- **Původní stav:** Skript volal `OutboxWorker.processPendingEvents()`. Ačkoliv je toto produkční logika, způsobila by sweep *všech* `PENDING` eventů na DEV3 (i těch vytvořených běžnými uživateli), nikoliv pouze testovacích z `LIVE-E2E-TEST`.
- **Změna:** Skript `scripts/dev3-live-verification.ts` byl upraven tak, aby explicitně načetl pouze eventy spojené s aktuálním testovacím ID a iterativně nad nimi zavolal izolovaně `OutboxWorker.processEvent(event.id)`. Zpracovávají se tak výhradně SAFE TEST DATA.

### B. Oprava Secret-Leak (P1 Security)
- **Původní stav:** Bash příkaz v runbooku používal `grep -E "DATABASE_URL|SLACK_BOT_TOKEN" .env`. Tento příkaz by operátorovi do konzole vypsal *reálné hodnoty* credentials.
- **Změna:** Nahrazeno příkazem `awk -F= '/^(DATABASE_URL|SLACK_BOT_TOKEN|NOTION_API_KEY)/ {print $1"=<configured>"}' .env`, který vypíše pouze názvy přítomných proměnných.

### C. Oprava SQL Recovery Testu (P1 PostgreSQL Compatibility & Isolation)
- **Původní stav:** Návod pro vyvolání "Stale Locku" v runbooku instruoval ke změně 1 random `PENDING` záznamu bez specifikace PostgreSQL syntaxe.
- **Změna:** Návod upraven na přesný update statement `UPDATE "OutboxEvent" SET status='PROCESSING', "updatedAt" = NOW() - interval '6 minutes' WHERE "aggregateId" = '<test-audit-id>'`, což zaručuje, že nedojde k ovlivnění reálných záznamů (striktní FORBIDDEN REAL DATA ochrana).

## 3. Test Isolation Verification & Result Integrity
- **Zajištěno:** Každý vygenerovaný záznam nese unikátní klíč a string `LIVE-E2E-TEST-{timestamp}`. 
- **Zajištěno:** Skript netvoří alternativní logiku, plně znovupoužívá atomickou produkční metodu `OutboxWorker.processEvent()`.
- **Zajištěno:** Test kontroluje stavové počty na pozadí a při failu opouští proces přes tvrdý `process.exit(1)`.

## 4. Remaining Risks
- Slack notifikace mají stále by-design sémantiku **At-Least-Once**. E2E test je navržen s ohledem na ni, při těžkém crashi hned po odeslání požadavku je výskyt duplicitního hlášení v chatu normální.

## 5. Závěr
Veškeré podmínky pro PREFLIGHT byly bezpečně splněny a skripty ošetřeny proti riziku kontaminace či pádů na DEV3 instanci.

**Verdikt:** 🟢 DEV3 GO
