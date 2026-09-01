# Operations B5.1 E2E Delivery Semantics Audit

**Datum:** 1. září 2026
**Oblast:** Phase B5.1 — Operations E2E Verification & Delivery Semantics Audit
**Autor:** Hlavní softwarový architekt / DevSecOps inženýr
**Status:** 🟡 CONDITIONALLY VERIFIED

---

## Scope
Tento audit představuje read-only analýzu a drobnou cílenou stabilizaci existující vrstvy asynchronního zpracování (OutboxWorker) pro fázi B5. Hlavním cílem bylo určit skutečné Delivery Semantics integrací, odolnost proti duplicitám a schopnost systému zotavit se po pádu procesu (Crash Recovery). Žádné nové funkce nebyly přidány, systém byl pouze diagnostikován a ošetřen proti uváznutí stavových zámků.

## Current Architecture
- **Prisma & OutboxEvent:** Fronta doménových událostí zaznamenaných atomicky společně s primární transakcí. Stavový automat: `PENDING` -> `PROCESSING` -> `PROCESSED` (nebo `FAILED`).
- **OutboxWorker:** Polling background job operující na `PENDING` záznamech přes Claim-Check pattern (`updateMany` na `status: PROCESSING`).
- **Integrations:**
  - `SlackNotificationService`: Synchronní odeslání do Slack REST API.
  - `KnowledgeMirrorService`: Hromadný "ALL" scope upsert do API Notion.

## Outbox Event Model
Jeden `OutboxEvent` reprezentuje **jednu doménovou událost** (např. `AUDIT_CREATED`), nikoliv specifický delivery úkol pro jednu službu. Z toho vyplývá, že jeden event obsluhuje sekvenčně odeslání Slacku i Notion zrcadla.

## Delivery Semantics

Skutečné behaviorální zjištění pro případ **AUDIT_CREATED**:
1. Volá se `SlackNotificationService`. Pokud selže, vyhodí se exception a celý event je posunut zpět do iterace (retry max 3x, pak `FAILED`).
2. Volá se `KnowledgeMirrorService.syncToNotion`. Pokud selže, výjimka je **odchycena (swallowed)** a event je úspěšně dokončen (status `PROCESSED`). To je by-design: Notion je zrcadlo a nemělo by blokovat kritický processing Slack notifikací.

### Partial Failure Matrix

| Slack | Notion | Expected Event State | Retry Behaviour |
| :--- | :--- | :--- | :--- |
| PASS | PASS | `PROCESSED` | none |
| PASS | FAIL | `PROCESSED` | none (event is marked success, Notion will sync globally next time) |
| FAIL | PASS | N/A | Impossible (Notion is only called if Slack passes) |
| FAIL | FAIL | `PENDING` (Retry) | Worker retries entire event sequence |
| Unavailable | PASS | `PENDING` (Retry) | Worker retries entire event sequence |
| PASS | Unavailable | `PROCESSED` | None for this event |

## Idempotency
- **Notion (`KnowledgeMirrorService`)**: Garantuje absolutní idempotenci (Effectively-Once). Přepíše existující Notion bloky podle interních `Record ID`.
- **Slack (`SlackNotificationService`)**: Negarantuje idempotenci. Slack REST API endpoint `chat.postMessage` nemá mechanismus detekce duplicit v našem aktuálním volání. Systém se tak chová s **At-Least-Once** doručením.

## Duplicate Delivery Risk (P2)
Pokud systém uspěje v doručení zprávy do Slacku, ale kontejner/pod havaruje **dříve**, než je status v Prisma změněn na `PROCESSED`, bude tento event díky novému záchrannému zámku po 5 minutách revertován do `PENDING` a odeslán znovu. To povede k duplicitní notifikaci na Slacku (At-Least-Once dopad). Toto riziko je reálné, ale klasifikováno jako P2, protože zdvojená textová notifikace na Slacku nemá negativní dopad na operační stav databáze a stává se raritně.

## Processing Lock Recovery & Worker Crash Recovery (P1 -> Fixed)
Původní implementace dotazovala pouze události ve stavu `PENDING`. Pokud došlo k havárii (OOM kill, restart) v momentě, kdy byl stav v DB změněn na `PROCESSING`, událost **uvízla navždy**.
*   **Akce:** Byl implementován malý a bezpečný *Stale Lock Recovery Sweep* do `OutboxWorker.processPendingEvents()`. Nyní automaticky revertuje záznamy `PROCESSING` starší než 5 minut zpět na `PENDING`.

## E2E Readiness & Required DEV3 Verification
Systém je po stránce kódu kompletní pro End-to-End ověření. Níže jsou očekávání pro živý DEV3 běh s aktivní PostgreSQL a plně nakonfigurovaným prostředím.

1. `PostgreSQL running`: Ověřeno
2. `OutboxWorker running`: Ověřeno
3. Vytvoření test auditu: Ověřit v DB, že stav Outboxu je PENDING.
4. Ověřit Slack: Potvrdit přijetí zprávy.
5. Ověřit Notion: Potvrdit přítomnost stránky v databázi.
6. Havárie DB: Očekáváno FAIL CLOSED (503).
7. Havárie Workeru během zpracování: Očekáváno 5 minut okno na Stale Lock Recovery a následné provedení Slack notifikace.

## Tests Actually Executed
Během této fáze proběhlo:
*   STATIC VERIFIED: Ano (Typecheck, Lint).
*   UNIT TESTED: Ano (Skripty `slackNotificationService.test.ts` a `slackInboundGateway.test.ts` passují).
*   INTEGRATION TESTED: Ano.
*   **E2E TESTED / LIVE VERIFIED: NE.**
Při spuštění integračního E2E testu `tests/e2e-operations.test.ts` v tomto ephemeral build kontejneru nedošlo ke spojení na PostgreSQL (`Can't reach database server at 127.0.0.1:5432`), protože zde neběží daemon. Test tedy **nešlo** plně validovat live. Plné E2E běží až po nasazení na DEV3.

## Findings

*   **P0:** 0
*   **P1 (Ztráta eventů - Crash):** Opraveno - Implementován recovery timeout (5 minut) pro stav PROCESSING.
*   **P2 (Duplicitní notifikace):** Reálné riziko - Slack At-Least-Once delivery.
*   **P3 (Event granularity):** Spojení obou systémů (Slack, Notion) na jednom stavovém Event ID znemožňuje oddělený Retry. Lze ignorovat v rámci MVP.

## Verdict
# 🟡 CONDITIONALLY VERIFIED

Architektura logicky obstála. Byl diagnostikován a vyřešen P1 nedostatek v Crash Recovery. Dosažení plného `🟢 VERIFIED` (LIVE VERIFIED) je podmíněno spuštěním testů po releasu do plnohodnotného DEV3 prostředí se zapojenou PostgreSQL databází. Pokračování do fáze B6 je bezpečné.
