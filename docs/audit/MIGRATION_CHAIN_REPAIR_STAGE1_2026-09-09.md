# Migrační řetězec — oprava Stage 1

Datum: 2026-09-09
Větev: `fix/migration-chain-canonical-baseline-20260909`
Base SHA: `50366f6c7183bb4f662ee398716a4212aab36e10`

## Rozsah

První realizační fáze opravy migračního řetězce.

Byly vytvořeny a ověřeny:

- úplné zálohy DEV3 a PROD3,
- obnovitelné databázové kopie,
- kandidátní kanonická baseline,
- idempotentní migrace chybějících polí modelu `Study`,
- samostatné zkoušky reconciliace DEV3 a PROD3.

Živá DEV3 ani PROD3 databáze nebyla změněna.

## Kanonická baseline

Baseline má stav `CANDIDATE_NOT_ACTIVE` a Prisma ji automaticky
nespouští.

Obsahuje:

- 34 enum typů,
- 139 tabulek,
- 11 CHECK constraintů Brand Asset Studia,
- 2 partial unique indexy Brand Asset Studia.

Čistá aplikace na PostgreSQL 16 prošla bez chyby.
Následný Prisma schema diff byl prázdný.
Baseline neobsahuje DROP, TRUNCATE ani DELETE operace.

## Izolovaná kopie DEV3

Úplná záloha byla obnovena do databáze `dev3_full_clone`.

Kopie obsahovala 132 tabulek, 8 uživatelů a 13 záznamů
migračního ledgeru.

`prisma migrate deploy` úspěšně přidal Brand Asset Studio.
Následná idempotentní Study migrace proběhla bez chyby.

Tabulky `AiProvider`, `AiModel` a `OrionApproval` zůstaly zachované.
Všech 11 CHECK constraintů a 2 partial unique indexy byly ověřeny.

## Izolovaná kopie PROD3

Úplná záloha byla obnovena do databáze `prod3_full_clone`.

Kopie obsahovala 127 tabulek, 3 uživatele a 5 záznamů
migračního ledgeru.

Po evidenční reconciliaci tří fyzicky přítomných migrací byly
úspěšně aplikovány ověřené profily subjektů, Brand Asset Studio
a idempotentní Study migrace.

Výsledný Prisma schema diff proti aktuálnímu `main` byl prázdný.
Všechny operace proběhly pouze nad izolovanou kopií.

## Zálohy

Zálohy jsou uložené odděleně mimo repozitář v adresáři:

`/home/uadmin/db_backups/20260909_migration_repair`

Kontrolní součty všech čtyř souborů jsou uložené v `SHA256SUMS`.

Obě úplné zálohy prošly kontrolou `pg_restore --list`
a skutečnou obnovou do izolovaných databází.

## Nová forward-only migrace

Migrace `20260909_reconcile_study_evidence_fields` doplňuje:

- `causality`,
- `evidenceDirection`,
- `evidenceLevel`,
- `sourceType`.

Používá pouze `ADD COLUMN IF NOT EXISTS`.

Na kopii DEV3 byla bezpečným no-op.
Na kopii PROD3 doplnila chybějící sloupce.
Po jejím provedení byl PROD3 schema diff prázdný.

## Zbývající blokátory

Aktivní historický řetězec stále není použitelný pro čistou databázi,
protože Audit Finding předchází vytvoření Control Plane.

Kandidátní baseline proto zatím nesmí být přesunuta do
`prisma/migrations`.

Před baseline cutover musí být:

1. řízeně reconciliován DEV3,
2. samostatně reconciliován PROD3,
3. rozhodnuto o integraci AI registry a Orion Approval,
4. znovu ověřeny úplné zálohy a schema diffy.

## Verdikt

`PASS_FOR_CONTROLLED_ENVIRONMENT_RECONCILIATION`

`BLOCKED_FOR_CANONICAL_BASELINE_CUTOVER`

Stage 1 připravil ověřenou baseline a bezpečnou Study migraci.
Neprovedl změnu živé DEV3 ani PROD3 databáze.

Další fáze musí nejprve projít DEV3 a teprve poté PROD3.
