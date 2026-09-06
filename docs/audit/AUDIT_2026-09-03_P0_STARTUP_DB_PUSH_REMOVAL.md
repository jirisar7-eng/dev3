# AUDIT: P0 Bezpečnostní oprava DEV3 – Odstranění `db push` ze startupu a deployment pipeline

- **Datum a čas:** 2026-09-03T22:25:00Z
- **Název úkolu:** Odstranění destruktivního `prisma db push --accept-data-loss` ze startupu a sjednocení na řízené migrace
- **Prostředí:** DEV3 / VPS / Cloud Container (`tatovacesta_app_dev3`)
- **Status:** DOKONČENO (IMPLEMENTED, TESTED & VERIFIED)

---

## 1. Identifikace P0 incidentu a Root Cause

Při startu backendu v `server.ts` byla v background `setTimeout` po otevření portu 3000 přítomna instrukce:
```typescript
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', timeout: 5000 });
```
Tento příkaz při každém startu aplikace synchronizoval DB schema přímo z `prisma/schema.prisma` s parametrem `--accept-data-loss`, což vedlo k odstranění legacy struktur a datových sloupců.

---

## 2. Provedené nápravné kroky

1. **Odstranění `db push` z `server.ts`:**
   - Ze souboru `server.ts` byl zcela odstraněn `execSync('npx prisma db push --accept-data-loss', ...)` i nepoužívaný import `execSync` z `child_process`.
   - Zachována byla plná podpora pro `checkDatabaseReachable()`, bezpečný `runSeed()` a graceful error handling.
   - Aplikace při startu provádí pouze read-only health check databáze a seed (pokud je potřeba).

2. **Úprava deployment skriptů (`deploy.sh` a `deploy-dev.sh`):**
   - Krok `[5/6]` v obou skriptech byl změněn z `npx prisma db push` na standardní a deterministický `npx prisma migrate deploy`.

3. **Úprava deployment webhooku (`src/routes/system.ts`):**
   - Webhook příkaz byl upraven z `npx prisma db push && npx prisma generate` na `npx prisma migrate deploy && npx prisma generate`.

4. **Přidání P0 regresního testu (`tests/startup-db-safety.test.ts`):**
   - Automatický test ověřuje, že:
     - `server.ts` neobsahuje `db push`, `--accept-data-loss` ani runtime `execSync` pro Prisma.
     - `deploy.sh` i `deploy-dev.sh` striktně používají `prisma migrate deploy` a nikoliv `db push`.
     - `src/routes/system.ts` používá výhradně `npx prisma migrate deploy`.
     - Žádný zdrojový kód neobsahuje `--accept-data-loss`.
   - Test byl zařazen do hlavní testovací sady `scripts/test-runner.js`.

---

## 3. Výsledky testů a verifikace

- **Unit & Regression Tests:** 28 test suites – PASS (včetně nového `Startup & Deployment DB Safety`)
- **TypeScript Typecheck (`tsc --noEmit`):** PASS (0 chyb)
- **Production Build (`npm run build`):** PASS (Vite + Prisma Generate + esbuild bundle `dist/server.js`)
- **Zákaz zásahů do DB:** Během této opravy nebyly provedeny žádné `prisma migrate deploy`, `prisma db push`, `db reset` ani manipulace s daty.

---

## 4. Seznam změněných souborů

- `server.ts`
- `src/routes/system.ts`
- `deploy.sh`
- `deploy-dev.sh`
- `scripts/test-runner.js`
- `tests/startup-db-safety.test.ts` (nový soubor)
- `docs/audit/AUDIT_2026-09-03_P0_STARTUP_DB_PUSH_REMOVAL.md` (nový soubor)
