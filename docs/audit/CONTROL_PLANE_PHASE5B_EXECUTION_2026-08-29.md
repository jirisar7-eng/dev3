# Audit Report: Control Plane Phase 5B - Execution & Persistent Store

**Datum:** 2026-08-29
**Cíl:** Navázat na Phase 5A a implementovat persistentní Control Plane a GitHub Execution contract.

## Výchozí stav
- Phase 5A dokončena (State Machine, Catalog, RBAC).
- Local storage (JSON) chyběla optimistic concurrency kontrola.
- GitHub publikování z Control Plane nebylo pevně zapojeno v State Machine cyklu.

## Provedené změny
1. **Database Design (Prisma):** Navrženy modely `ControlPlaneAction`, `ControlPlaneEvent`, `ControlPlaneSnapshot`. Přidáno poli `version` pro optimistic concurrency a `expiresAt` pro 48h lifecycle.
2. **Optimistic Concurrency:** Zavedena kontrola `expectedVersion` při akcích `approveAction`, `executeAction`, `completeAction` a `rollbackAction` ve službě `ControlPlaneService`. Tím se brání double-approval condition.
3. **Real GitHub Execution Contract:** Do `executeAction` integrována příprava na git větve a přísný block proti pokusům posílat změny na `main`. Přenáší zpracování `publishCopilotBranch`, kde `GithubPublisherService` vynucuje `copilot/*` pattern a kontrolu secrets.
4. **Rollback Immutability:** Funkce `rollbackAction` ponechává původní stopu akce nedotčenou. Vytváří novou rollback akci s novým ID (typ `rollback`), pro zanechání kompletní auditní stopy události.
5. **Phase 5B Tests:** Vytvořeny unit testy simulující concurrency konflikty a rollback imutabilitu v `src/tests/controlPlanePhase5b.test.ts`.

## Databáze
- `schema.prisma` aktualizováno s ControlPlane modely.
- **NEPROVEDENO `prisma db push`** (ani nevygenerován client) dle explicitních instrukcí - zastaveno před migrací.

## Bezpečnostní a Regresní Rizika (Otevřená/Zvládlá)
- *Risk:* Double Approval - Zvládnuto pomocí `version` increment a `expectedVersion` kontroly.
- *Risk:* Direct `main` push - Odmítnuto State Machine / `GithubPublisherService`.
- *Risk:* Ztráta původního auditu po Rollbacku - Původní Action objekt i audit je zachován, Rollback tvoří nový navazující Action ticket.

## TODO
- Fyzická migrace DB (`npx prisma db push`).
- Kompletní integrace Prisma clienta uvnitř `ControlPlaneService` namísto JSON stubu.
- Phase 5C - UI integrace do Frontend panelu.

## Výsledný stav
Backend contract pro integraci GitHub API a Prisma persistence je hotov, testy dodány. Repozitář zůstává ve funkčním stavu a fail-closed bezpečnostních nastaveních.
