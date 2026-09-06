# AUDIT: Oprava startupu aplikace a optimalizace deployment procesu DEV3

- **Datum a čas:** 2026-09-03T11:05:00Z
- **Název úkolu:** Oprava startupu aplikace a deployment posloupnosti dle architektury DEV3
- **Prostředí:** DEV3 / VPS / Cloud Container
- **Status:** DOKONČENO (IMPLEMENTED & VERIFIED)

---

## 1. Cíl

1. **Odstranění nebezpečných operací ze startupu aplikace (`server.ts`):**
   - Vyloučení spouštění `prisma db push --accept-data-loss` při HTTP startupu.
   - Vyloučení automatického spouštění `runSeed()` při každém startu HTTP serveru.
   - Okamžité otevření HTTP portu (3000) bez blokování a bez čekání na PostgreSQL.
   - Odstranění nepoužívaného importu `execSync` z `child_process`.
2. **Přechod na striktní `prisma migrate deploy`:**
   - Databázové migrace nesmí používat `db push`, ale výhradně deterministický `prisma migrate deploy`.
   - Úprava webhook deployment handleru v `src/routes/system.ts`.
3. **Přeuspořádání deployment pipeline DEV3 (`deploy.sh`, `deploy-dev.sh`):**
   - Striktní 7-kroková sekvence:
     1. PostgreSQL (`docker compose up -d postgres`)
     2. Čekání na PostgreSQL readiness (`pg_isready` smyčka)
     3. `prisma migrate deploy` (před spuštěním aplikace)
     4. `prisma/seed.ts` (explicitní jednorázový seed)
     5. Spuštění aplikace (`docker compose up -d --remove-orphans`)
     6. Health check (`/api/health` verifikace)
     7. Caddy reload

---

## 2. Výchozí stav

- `server.ts` obsahoval v `setTimeout` po `app.listen` blok:
  ```typescript
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', timeout: 5000 });
  await runSeed();
  ```
  Tento kód mohl vést k nežádoucí synchronizaci se ztrátou dat a opakovanému spouštění seedu při každém restartu aplikace.
- `src/routes/system.ts` obsahoval v deployment webhooku příkaz `sh -c "npx prisma db push && npx prisma generate"`.
- `deploy.sh` a `deploy-dev.sh` využívaly `npx prisma db push` místo řízených migrací a neměly explicitně oddělené fáze PostgreSQL readiness, migrací, seedu a Caddy reloadu.

---

## 3. Provedené změny

### A. `server.ts`
- Odstraněn import `import { execSync } from 'child_process';`.
- Odstraněn import `import { runSeed } from './prisma/seed';`.
- Blok na konci `startServer()` nahrazen neblokující kontrolou konektivity bez provádění DDL/seed operací:
  ```typescript
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Táta má právo] Core & API Server running on port ${PORT}`);
  });

  // Background DB connectivity check - non-blocking so HTTP port opens immediately without waiting for PostgreSQL
  setTimeout(async () => {
    try {
      if (process.env.DATABASE_URL) {
        const isDbReachable = await checkDatabaseReachable();
        if (isDbReachable) {
          console.log('[System] PostgreSQL databáze je dostupná.');
        } else {
          console.info('[System] PostgreSQL databáze na DATABASE_URL není dostupná.');
        }
      } else {
        console.log('[System] DATABASE_URL chybí.');
        markPrismaUnavailable('DATABASE_URL is missing');
      }
    } catch (error) {
      console.warn('[System] Upozornění při kontrole databáze:', error);
      markPrismaUnavailable(error);
    }
  }, 100);
  ```

### B. `src/routes/system.ts`
- Aktualizován deploy command v webhooku:
  - Původní: `sh -c "npx prisma db push && npx prisma generate"`
  - Nový: `sh -c "npx prisma migrate deploy && npx prisma generate"`

### C. `deploy.sh` a `deploy-dev.sh`
- Zavedena a plně implementována požadovaná sekvence 7 kroků:
  - **[1/7] PostgreSQL:** `docker compose up -d postgres`
  - **[2/7] Čekání na PostgreSQL readiness:** testování `pg_isready` až 30 sekund.
  - **[3/7] prisma migrate deploy:** spuštění migrací v izolovaném kontejneru (`docker compose run --rm -T --no-deps app npx prisma migrate deploy`) s fallbackem na běžící kontejner.
  - **[4/7] prisma/seed.ts:** explicitní spuštění `npx tsx prisma/seed.ts`.
  - **[5/7] Spuštění aplikace:** `docker compose up -d --remove-orphans`.
  - **[6/7] Health check:** testování dostupnosti endpointu `/api/health`.
  - **[7/7] Caddy reload:** provedení reloadu reverzní proxy Caddy.

---

## 4. Dotčené soubory

- `server.ts`
- `src/routes/system.ts`
- `deploy.sh`
- `deploy-dev.sh`
- `docs/audit/AUDIT_2026-09-03_STARTUP_AND_DEPLOYMENT_REFACTOR.md`

---

## 5. Změny DB a API

- **DB Schéma:** Beze změn (žádná migrace nebyla nutná).
- **API rozhraní:** 100% zachováno, žádné breaking changes.

---

## 6. Bezpečnost a integrita dat

- **Zero Data Loss:** Kompletně eliminován parametr `--accept-data-loss` ze všech částí repozitáře (výsledek grepu: 0 výskytů).
- **Deterministické migrace:** Všechny operace nad DB strukturou probíhají výhradně formou verzovaných migrací `prisma migrate deploy`.
- **Secrets check:** V kódu ani v auditu nejsou obsaženy žádné tokeny, hesla ani credentials.
- **Fail-Closed / Non-Blocking:** HTTP server ihned obsluhuje požadavky; pokud DB není dostupná, aktivuje se standardní fallback mechanismus bez pádů serveru.

---

## 7. Verifikace a testování

1. **Grep audit pro `db push` a `--accept-data-loss`:**
   - `grep -rn "db push" .` -> 0 výskytů v aktivním zdrojovém kódu aplikace.
   - `grep -rn "accept-data-loss" .` -> 0 výskytů v celém repozitáři.
2. **TypeScript typecheck (`npm run lint` / `tsc --noEmit`):**
   - PASS (0 chyb).
3. **Produkční sestavení (`npm run build`):**
   - PASS (`prisma generate`, `vite build`, `esbuild server.ts`).
4. **Applet Compilation (`compile_applet`):**
   - PASS (Build succeeded).
5. **Kritické bezpečnostní testy:**
   - `node --test test/main.test.cjs` -> PASS (5/5).
   - `node run_security_tests.cjs` -> PASS (4/4).

---

## 8. Rizika a doporučení

- Při prvním spuštění nového deploymentu na DEV3 VPS je nutné, aby migrační složka `prisma/migrations` obsahovala všechny dosud aplikované migrace, což je v repozitáři standardně zajištěno.
- Při deploymentu na DEV3 VPS spustit `deploy.sh` po dokončení synchronizace větví.

---

## 9. Výsledný stav

- **STAV:** DOKONČENO / PASS
- **KÓD:** Upraven, zkompilován a zvalidován bez chyb.
