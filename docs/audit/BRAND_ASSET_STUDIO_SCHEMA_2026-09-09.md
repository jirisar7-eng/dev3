# Brand Asset Studio — schema foundation

Datum: 2026-09-09
Větev: `feat/brand-asset-studio-schema-20260909`
Base SHA: `3431c1ffddaacd9376998b293d6191ff5ffd84a7`
Checkpoint SHA: `6d885b3ea3027b75a60a1c345247d56f95831b1e`

## Rozsah

Byly přidány typové kontrakty pro plánované brand kampaně,
nové Prisma modely a explicitní forward-only migrace.

Starý model `BrandingVersion` zůstává beze změny.
Nebyla spuštěna migrace proti DEV3 ani PROD3.
Nebyl proveden deploy ani `prisma db push`.

## Datový model

- 14 nových enumů.
- 11 nových relačních modelů.
- Tři identity: public, case a admin portal.
- Verzované assety s MinIO adresou a SHA-256.
- Neměnné složení releasu přes `BrandReleaseAsset`.
- Dokumentové profily a exportní auditní stopa.
- Plánované sváteční a příležitostné brand kampaně.
- Každá kampaň cílí explicitní identitu a plochu.

## Databázové invarianty

- Nejvýše jeden aktivní release na profil.
- Nejvýše jeden aktivní dokumentový profil na klíč.
- Aktivní verze musí být publikovaná.
- Family a application profil mají správnou identitu.
- Kampaň musí mít platný časový interval.
- Velikosti, rozměry a SHA-256 jsou kontrolované.
- Odvozený dokument musí evidovat hash originálu.
- Celkem 11 `CHECK` omezení a 2 partial unique indexy.

## Ověření

- Prisma schema validate: PASS.
- Prisma Client generate: PASS.
- TypeScript lint: PASS.
- Produkční build: PASS.
- Celý test runner: PASS.
- Clean-room původního schématu: PASS.
- Nová migrace na clean-room baseline: PASS.
- Vytvořeno všech 11 tabulek.
- Praktické testy invariantů: 5/5 PASS.
- Testovací data vrácena přes `ROLLBACK`.
- Izolovaný kontejner odstraněn a port uvolněn.

## Existující blokátor migrační historie

Čistý `prisma migrate deploy` selže ve staré migraci
`20260829_add_audit_finding_model`.

Tato migrace odkazuje na `ControlPlaneAction`, která vzniká
až v následující migraci. Nová brand migrace se při tomto pokusu
vůbec nespustila.

Jde o existující problém `origin/main`, nikoliv regresi této větve.
Před nasazením jakékoliv nové migrace musí být vyřešen samostatně.

## Verdikt

`PASS_FOR_CODE_REVIEW`

Schéma i nová migrace jsou validní a prošly izolovaným ověřením.
Deploy gate zůstává `BLOCKED_BY_EXISTING_MIGRATION_CHAIN`.

DEV3 a PROD3 zůstaly beze změny.
