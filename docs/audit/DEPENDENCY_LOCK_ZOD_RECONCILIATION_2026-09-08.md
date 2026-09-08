# Dependency Lock — Zod Reconciliation

Datum: 2026-09-08
Větev: `fix/dependency-lock-zod-20260908`
Start SHA: `30f09795b0c45b6de97be5f84d8af3e6008976d5`

## Oprava

`zod` již existoval v `package.json`, ale chyběl v `package-lock.json`.
Lockfile nyní obsahuje přesně `zod@4.5.2`. Žádná jiná závislost nebyla změněna.

## Ověření

- `npm ci --ignore-scripts`: PASS
- Prisma Client `7.9.1`: PASS
- lint: PASS
- build: PASS
- statické bezpečnostní testy: 5/5 PASS
- Subject Verified Information: 16/16 PASS
- Soudy Population Pipeline: 6/6 PASS

## Rizika

Node 20 vyvolává `EBADENGINE` pro několik existujících balíčků vyžadujících Node 22.
Tento samostatný P1 compatibility nález není součástí opravy lockfile.

## Verdikt

PASS — lockfile je synchronizovaný a reprodukovatelný. Bez DB migrace, deploye nebo zásahu do DEV3/PROD3.
