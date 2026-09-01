# Operations B5.2 DEV3 Live Integration Verification Plan

**Datum:** 1. září 2026
**Oblast:** Phase B5.2 — DEV3 Live Integration Verification Plan
**Autor:** Hlavní softwarový architekt / DevSecOps inženýr
**Status:** 🟡 CONDITIONALLY VERIFIED (Čeká na manuální DEV3 exekuci operátorem)

---

## Scope
Tento dokument popisuje přesný, bezpečný a opakovatelný plán (Runbook) pro provedení finálního End-to-End (E2E) Live Verification Testu v plnohodnotném produkčně-ekvivalentním prostředí DEV3 (s běžící PostgreSQL databází). Žádná nová aplikační logika nebyla přidána. Cílem je dosáhnout stavu 🟢 LIVE VERIFIED provedením řízených zkoušek nad izolovanými testovacími daty a ověřením external side-effects (Slack, Notion).

## Current Status
* **PostgreSQL Schema & Operations Core**: Plně nasazeno a unit-tested.
* **Slack & Notion Services**: Nasazeny, fail-closed handling prověřen.
* **OutboxWorker**: Periodický interval implementován, P1 stale-lock opraven.
* **Závěr**: Chybí už pouze vizuální / systémové ověření v běžícím deploymentu.

## Preconditions & Required Environment
Před spuštěním testu na DEV3 VPS musí operátor zkontrolovat přítomnost těchto proměnných prostředí (`.env`).
_Upozornění: Konkrétní secrets zde nejsou úmyslně vypsány._

| Proměnná | Stav | Význam pro test |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Required** | Nezbytné pro PostgreSQL Authoritative State. |
| `SLACK_BOT_TOKEN` | **Required** | Slack Oauth Token pro zrcadlení zpráv. |
| `SLACK_DEFAULT_CHANNEL_ID` | **Required** | Cílový Slack kanál (doporučeno testovací `#synthesis-operations-dev`). |
| `NOTION_API_KEY` | **Required** | Integrace pro Knowledge Base mirror. |
| `NOTION_DATABASE_ID` | **Required** | Cílová databáze pro Audit logy. |
| `GITHUB_REPOSITORY` | *Optional* | Default repozitář; logy generují artefakty na disk. Není nutné pro live E2E tok DB->Outbox->Slack. |

## Test Data Isolation
Pro zamezení kontaminace skutečných operačních dat byl navržen speciální skript `scripts/dev3-live-verification.ts`.
Všechna vytvářená data v tomto testu obsahují explicitní prefix **`LIVE-E2E-TEST-{timestamp}`**. 
Data se **nemažou**. Zůstávají v PostgreSQL jako immutable historický log, čímž se zamezí porušení integrity auditu. Představují permanentní důkaz o proběhlém testu s autorizací DEV3_OPERATOR.

## Verification Steps (Manual Observation & Scripts)

### 1. Database Verification
Skript `dev3-live-verification.ts` zkontroluje dostupnost spojení s DB (funkce `isPrismaAvailable()`). Vytvoří reálnou DB transakci pro vytvoření Auditu, Finding a Ticketu a nasimuluje celou paletu stavových přechodů. Tím prověří ACID garanci přímo proti DEV3 PostgreSQL démonovi.
**Expected:** Data úspěšně vložena bez vyvolání výjimky (Fail Closed = OFF pro happy path).

### 2. Slack Live Verification
Skript probudí OutboxWorker. Worker načte Pending události z databáze a pošle skutečný síťový payload na Slack.
**Expected:** Operátor vizuálně ověří doručení `🟢 Audit Created`, `🔴 P1 Finding`, `Ticket Created`, několika stavových změn a konečně `🟢 Verification Passed (Ticket CLOSED)` v určeném DEV3 kanále.

### 3. Notion Live Verification
Na pozadí Worker při eventu `AUDIT_CREATED` asynchronně zavolá `KnowledgeMirrorService.syncToNotion`.
**Expected:** Operátor zkontroluje existenci nového řádku s názvem `LIVE-E2E-TEST-{timestamp} - Integration Verification` ve vymezené Notion databázi.

### 4. Crash Recovery Verification (Manual Simulator)
Test zpracování stale-zámků po havárii workeru nesmí být prováděn násilným killnutím produkčního procesu, to by mohlo ohrozit paralelní práci uživatelů DEV3.
Místo toho se prověřuje analyticky a přes řízený DB UPDATE:
* Operátor ručně přes databázovou konzoli změní PENDING Outbox záznam vytvořený jako součást `LIVE-E2E-TEST` na status `PROCESSING` a updatuje jeho `updatedAt` na timestamp starší 6 minut (např. `UPDATE "OutboxEvent" SET status='PROCESSING', "updatedAt" = NOW() - interval '6 minutes' WHERE "aggregateId" = '<test-audit-id>';`). Nikdy neupravujte cizí záznamy.
* Počká na automatický běh `OutboxWorker` (až 10s interval).
* **Expected:** Worker vrátí záznam do `PENDING` a zaloguje Warning: `Recovered X stale PROCESSING locks`.

## Delivery Semantics
Tento live test explicitně dodržuje a ověřuje stanovená pravidla:
* **Slack = At-Least-Once**: Záznam je na síťový endpoint doručen dříve, než DB potvrdí `PROCESSED`. Výpadek DB v posledním zlomku sekundy doručí zprávu dvakrát.
* **Notion = Effective/Best-Effort**: Update pomocí `Record ID`. Operace lze bezpečně opakovat. Výpadek Notionu nezneplatní předchozí odeslání do Slacku.

## Failure Tests (Operator Guide)
Tyto testy jsou dobrovolné, ale doporučené. Dělají se smazáním konkrétní env variable, restartem služby a voláním testovacího skriptu.
*   **Slack unavailable** (Invalidate `SLACK_BOT_TOKEN`): DB transakce projde. Kontejner zaloguje Slack Error. Událost zůstane `PENDING` (případně po 3x retries spadne do FAILED Dead-Letter Queue).
*   **Notion unavailable** (Invalidate `NOTION_API_KEY`): DB projde. Slack projde. Zaloguje se Warning o Notionu. Událost skončí na `PROCESSED`. Neztrácíme Notifikace kvůli selhání Backup Mirroru.
*   **PostgreSQL unavailable**: Test okamžitě zhavaruje na HTTP 503 nebo Error kódu na startu skriptu. K uložení nedojde (Fail-Closed).

## Commands / DEV3 Verification Sequence
Toto je přesné, bezpečné a nedeštruktivní pořadí příkazů, které provede DEV3 operátor připojený přes SSH / Cloud Shell do běžícího DEV3 prostředí.

```bash
# 1. Zkontrolujte stav env variables (Neukazovat hodnoty, pouze existenci!)
awk -F= '/^(DATABASE_URL|SLACK_BOT_TOKEN|NOTION_API_KEY)/ {print $1"=<configured>"}' .env

# 2. Zkontrolujte dostupnost sítě z DEV3 na Slack a Notion (neměl by blokovat egress firewall)
curl -I https://slack.com/api/chat.postMessage
curl -I https://api.notion.com

# 3. Spusťte izolovaný live-verification script (nedestruktivní, vyžaduje TS-Node nebo TSX)
npx tsx scripts/dev3-live-verification.ts

# 4. (Manuální kontrola)
# - Podívejte se do Slacku
# - Podívejte se do Notionu
```

## Rollback / Cleanup
Není vyžadován. Vytvořená data záměrně používají `LIVE-E2E-TEST` maskování a trvale slouží jako logovací důkaz, že infrastruktura byla plně certifikována. Jakýkoli manuální Delete příkaz nad PostgreSQL by porušil Audit Integrity princip.

## Final Verdict Criteria
Až budou výše uvedené kroky v reálném nasazeném DEV3 kontejneru / instanci úspěšně spuštěny operátorem bez síťových selhání, P0/P1 error výpisů a side-effekty se projeví na reálných platformách, bude fáze **B5 (a celý blok integrací B1-B5.2)** povýšena z `🟡 CONDITIONALLY VERIFIED` na **`🟢 LIVE VERIFIED`**.

Lze bezpečně postoupit do dalších domén projektu (např. Frontend, Auth UX, atd.).
