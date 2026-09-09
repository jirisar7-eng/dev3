# DEV3 — migration reconciliation Stage 2

Datum: 2026-09-09
Pracovní větev: `ops/dev3-migration-reconciliation-20260909`
Base SHA: `28bc20fc4aec8a436c07eb2777ac79216f11e2b9`

## Rozsah

Řízená aplikace dvou otestovaných forward-only migrací
výhradně na DEV3.

PROD3 nebylo změněno. Nebyl použit `prisma db push`,
`migrate reset`, restore ani automatický deployment.
DEV3 aplikace nebyla restartována.

## Výchozí stav

Živý DEV3 repozitář `/var/www/tatovacesta_dev3` byl čistý,
ale běžel z větve `feat/ai-policy-council-integration-20260907`
na SHA `89c0621deb9cc47d7b359eb24f1276ccc8e6b6bf`.

Společný základ s `main` byl `30f09795b0c45b6de97be5f84d8af3e6008976d5`.
DEV3 větev měla 20 vlastních commitů a `main` 17 vlastních commitů.

Tato divergence nebyla během databázové reconciliace změněna.

## Pre-migration záloha

Nová úplná záloha živého DEV3 byla vytvořena před změnou:

`/home/uadmin/db_backups/20260909_migration_repair/dev3_stage2_pre_reconciliation.dump`

SHA-256 dumpu:

`c4403630b40a0fe35df45dc69dcd9fd457d7b0b1b4269d15d9619c4212c71909`

Migrační ledger měl SHA-256:

`e71339ff4c9d1568841a6c03455716caca37eef102f3193a04dcbd2cedcc672b`

Dump prošel `pg_restore --list` s 819 položkami
a skutečnou obnovou do `dev3_stage2_restore_test`.

Obnovená kopie obsahovala 8 uživatelů, 13 ledger záznamů,
4 providery, 5 AI modelů a 0 Orion Approval záznamů.

## Izolovaný rehearsal

Na čerstvě obnovené kopii čekaly pouze migrace:

- `20260909_brand_asset_studio_foundation`
- `20260909_reconcile_study_evidence_fields`

Obě byly úspěšně aplikovány přes `prisma migrate deploy`.

Po zkoušce zůstaly počty User a AI/Orion dat beze změny.
Bylo ověřeno 11 CHECK constraintů a 2 partial unique indexy.

## Provedení na živém DEV3

Migrace byly spuštěny z aktuálního `main`
v jednorázovém kontejneru pouze v síti DEV3.

Úspěšně byly aplikovány:

- `20260909_brand_asset_studio_foundation`
- `20260909_reconcile_study_evidence_fields`

Oba ledger záznamy jsou dokončené, nejsou rollbackované
a jejich checksumy odpovídají souborům v `main`.

Study migrace byla bezpečný no-op, protože všechna čtyři
pole i správné defaulty již v DEV3 existovaly.

## Ověření po migraci

DEV3 obsahuje všech 11 tabulek Brand Asset Studia.

Ověřeno:

- 11 CHECK constraintů,
- 2 partial unique indexy,
- přesná shoda s rehearsal kopii,
- `User`: 8,
- `AiProvider`: 4,
- `AiModel`: 5,
- `OrionApproval`: 0.

Aplikace nebyla restartována a má 0 restartů.
`/api/health` vrátil HTTP 200, databázi `connected`
a Prisma stav `ok`.

## Post-migration záloha

SHA-256:

- dump: `b981a9a0b8e7d1ec8050f9cef7c703be9abaaacf241154e92cb68e90218a8c54`
- ledger: `e0af3b8b6f97d77377b9ce5bf368b5d45a27a1330b02c03587441ee5de4bfb30`
- invarianty: `233047ad8d2fcab9d3d532648f85cbb640f0a740c6ad088e2a345f2a884b7d07`

Dump prošel `pg_restore --list` s 937 položkami.
Všechny tři kontrolní součty byly ověřeny.

## Zbývající blokátory

Živý DEV3 kód stále běží z AI/Orion feature větve,
nikoli z aktuálního `main`.

AI/Orion objekty a data musí zůstat zachované.
Jejich integrace do `main` vyžaduje samostatné rozhodnutí.

Runtime stále hlásí neznámý Git SHA a image digest.
PROD3 nebylo reconciliováno ani změněno.
Kandidátní baseline zůstává neaktivní.

## Verdikt

`PASS_DEV3_MIGRATION_RECONCILIATION`

`PASS_FOR_PROD3_RECONCILIATION_PLANNING`

`BLOCKED_FOR_PROD3_EXECUTION`

`BLOCKED_FOR_CANONICAL_BASELINE_CUTOVER`

DEV3 databázová Stage 2 je dokončená.
Další práce nesmí smíchat DEV3 a PROD3.
