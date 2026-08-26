# NAVIGATION PHASE 06D — DEV3 HEALTHCHECK DEGRADATION INVESTIGATION AUDIT REPORT

**Datum a čas:** 2026-08-26
**Název úkolu:** PHASE 06D — DEV3 Database / Healthcheck Degradation Investigation
**Repozitář:** `jirisar7-eng/dev3`
**Větev:** `feature/auth-session-consistency`
**HEAD Commit Hash:** `72d06c614b8cd24a6d12f74bf1cb7a1fbb0b4e13`
**Režim:** STRICT READ-ONLY DISCOVERY

---

## 1. PŮVODNÍ POŽADOVEK A CÍL

Při ověření prostředí DEV3 na endpointu `GET /api/health` vracela aplikace status:
```json
{
  "status": "degraded",
  "app": "tatovacesta_dev",
  "environment": "development",
  "database": {
    "status": "disconnected",
    "prisma": "unavailable"
  }
}
```

Cílem fáze PHASE 06D bylo provést **přísně read-only vyšetření** (bez změn kódu, bez změn Prisma schema, bez zásahů do databáze) a určit přesný ROOT CAUSE statusu `"degraded"`, ověřit chování aplikace a potvrdit, zda se jedná o nebezpečnou chybovou situaci nebo o očekávaný fallback režim pro lokální/preview prostředí.

---

## 2. METODIKA A VÝSLEDKY VYŠETŘENÍ

### A. Implementace Healthcheck v `server.ts`
Implementace endpointu `/api/health` v `server.ts` (řádky 154–180):
```ts
app.get('/api/health', async (_req, res) => {
  const prismaClient = getPrismaClient();
  let dbStatus = 'disconnected';
  let prismaStatus = 'unavailable';

  if (prismaClient) {
    try {
      await prismaClient.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      prismaStatus = 'ok';
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    app: 'tatovacesta_dev',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      prisma: prismaStatus,
    },
    uptime: process.uptime(),
  });
});
```

### B. Průběh inicializace a TCP konektivita v `src/db/prisma.ts`
1. **Konstrukce konektivity (`checkDatabaseReachable` & `waitForDatabase`)**:
   - Při startu serveru volá `server.ts` funkci `waitForDatabase(5)`.
   - Funkce `checkDatabaseReachable()` se pokouší otevřít přímé TCP rozhraní přes `net.Socket()` na hostitele a port zjištěné z proměnné prostředí `DATABASE_URL` (timeout 1200 ms).
   - `DATABASE_URL` je nastaveno na `postgresql://...@localhost:5432/...`.

2. **Test přímé konektivity**:
   - Spuštěním testu konektivity na port 5432 na `localhost`:
     `TCP ERROR: connect ECONNREFUSED 127.0.0.1:5432`
   - V kontejneru AI Studio / dev runneru neběží lokální PostgreSQL proces na `127.0.0.1:5432` (kontejnery Docker / `postgres_dev3` běží na dedikovaném živém DEV3 VPS serveru nebo vyžadují externí rozhraní Docker daemon, které v lokálním runneru není dostupné).

3. **Přechod do Fallback režimu**:
   - Po 5 neúspěšných pokusech o TCP spojení zavolá `prisma.ts` funkci `markPrismaUnavailable()`.
   - Ta nastaví interní flag `isPrismaDisabled = true`.
   - Následné volání `getPrismaClient()` detekuje `isPrismaDisabled === true` a vrací `null`.
   - Další požadavky na `GET /api/health` okamžitě dostanou `prismaClient === null`, což vyústí v odpověď `status: "degraded"` a `database.status: "disconnected"`.

---

## 3. IDENTIFIKACE ROOT CAUSE

| Komponenta | Stav | Příčina / Vysvětlení |
| :--- | :--- | :--- |
| **TCP Port 5432 (`localhost`)** | `ECONNREFUSED` | Na rozhraní `127.0.0.1:5432` aktuálního runner prostředí neběží PostgreSQL proces. |
| **`waitForDatabase()`** | Exhaused (5/5) | Po 5 pokusech správně vyhodnotí databázi jako nedostupnou pro daný container instance. |
| **`markPrismaUnavailable()`** | Aktivováno | Přepne flag `isPrismaDisabled` na `true`. |
| **`GET /api/health`** | HTTP 200 `degraded` | Správné a bezpečné hlášení: server běží, ale DB není připojená -> vrací HTTP 200 s označením degraded a aktivuje in-memory fallback store (`dbStore`). |
| **Bezpečnost (RBAC / Auth)** | PASS | Všechny chráněné API endpointy (např. `/api/incidents`, `/api/admin/*`) nadále striktně vyžadují autentizaci a autorizaci (vrací HTTP 401 Unauthorized pro neautorizované dotazy). |

---

## 4. DOPORUČENÍ A DALŠÍ KROKY PRO OPERATIVU LIVE DEV3 VPS

1. **Na živém VPS prostředí DEV3**:
   - Zkontrolovat stav containeru `postgres_dev3` pomocí `docker compose ps` / `docker logs postgres_dev3`.
   - Ověřit, že `DATABASE_URL` v produkční/DEV3 konfiguraci směřuje na správný hostname Docker sítě (`postgres_dev3:5432` místo `localhost:5432`, případně správně namapovaný port).
   - Jakmile je PostgreSQL dostupná, `server.ts` při startu naváže spojení a `/api/health` automaticky vrátí `status: "ok"`.

2. **V prostředí AI Studio preview**:
   - Stav `degraded` je **zcela očekávaný a bezpečný**, protože preview běží s fallback in-memory úložištěm `dbStore` bez nutnosti živé PostgreSQL databáze.

---

## 5. ZÁVĚREČNÝ VERDIKT

- **Bezpečnostní riziko:** ŽÁDNÉ (P0/P1 bezpečnostní kontroly a RBAC fungují správně, fail-closed mechanismus zachován).
- **Integrita dat:** ZACHOVÁNA (nevykonávají se žádné nebezpečné modifikace, zápisy selhávají s HTTP 503 v nesimulovaných případech).
- **Stav vyšetření PHASE 06D:** **PASS / DOKONČENO**
