# PRE-IMPLEMENTATION AUDIT REPORT – FÁZE 6E: INFRASTRUCTURE OBSERVABILITY & AUDIT

**Datum:** 30. srpna 2026  
**Projekt:** „Táta má právo“ (`dev3.tatovacesta.cz` / `jirisar7-eng/dev3`)  
**Fáze:** FÁZE 6E – Infrastructure Observability & Audit  
**Cílový commit (main SHA):** `16970bea7a447904f94646ec625cc81785b7e90e`  
**Pracovní režim:** STRICT READ-ONLY ARCHITECTURE + PRE-IMPLEMENTATION AUDIT  

---

## 1. EXECUTIVE SUMMARY & VÝSLEDNÝ STATUS

### STATUS: PASS WITH WARNINGS

Aplikace na hlavní větvi `main` (`16970bea7a447904f94646ec625cc81785b7e90e`) disponuje plně funkční základní infrastrukturou a auditním subsystémem (Unified Operations Center, Release Gate, Orion AI Analyst, Control Plane, Knowledge Mirror). Cílem Fáze 6E je rozšíření této architektury o **deterministické sledování produkční infrastruktury** (Caddy, Docker, PostgreSQL, MinIO, Mailcow, Uptime Kuma, Dozzle, Health Endpoints, VPS zdroje, Logging).

Tento Pre-Implementation Audit ověřil existující komponenty, definoval bezpečný **strikce read-only** návrh `InfrastructureAuditService`, zamezil duplicitám a připravil integrační schéma do Release Gate a Admin UI (`/administrace/operace`).

---

## 2. KLASIFIKACE NÁLEZŮ (FINDING CLASSIFICATION)

- **P0 (Critical):** 0
- **P1 (High):** 0
- **P2 (Medium):** 2
  - **P2-1 (Docker Socket / Podman API Access Bounds):** Služba `adminVpsRoutes.ts` přistupuje k Podman / Docker REST API přes Unix socket (`unix:///var/run/docker.sock`) nebo TCP endpoint (`DOCKER_HOST` / `PODMAN_API_URL`). Přestože je chráněna striktní server-side autorizací (`requireAuth` + `requireRole('SUPER_ADMIN')`), přímá komunikace s Docker socketem bez vyžadování auditní stopy u zápisových operací (např. restart kontejneru) představuje potenciální bezpečnostní riziko.
  - **P2-2 (Caddy Proxy & Network Isolation Probe Boundary):** Caddy běží jako externí reverzní proxy v síti `tatovacesta_app_network` (`caddy_net`). Express server uvnitř kontejneru nemá přímý přístup k souborovému systému Caddyfile ani k nízkoúrovňovým certifikátům. Kontrola Caddy musela být navržena jako vnější HTTP/HTTPS sonda na bezpečnostní hlavičky a TLS kvalitu.
- **P3 (Low / Informational):** 3
  - **P3-1 (Mailcow Health Probe Isolation):** Metoda `checkMailcowHealth()` v `mailcowService.ts` testuje Mailcow API na IP `172.22.1.14` / `mail.tatovacesta.cz`. Sonda musí mít nastaven striktní timeout (max 3000ms), aby případná nedostupnost Mailcow neblokovala hlavní healthcheck aplikace (`/api/health`).
  - **P3-2 (MinIO S3 Client Fallback & ForcePathStyle):** Služba `minioStorageService.ts` využívá `@aws-sdk/client-s3` s `forcePathStyle: true`. Infrastrukturní audit musí ověřovat dostupnost S3 bucketu `tatovacesta-studies` pomocí lehkého příkazu `HeadBucketCommand` bez ovlivnění startu aplikace při výpadku MinIO.
  - **P3-3 (Docker Storage & Log Driver Retention):** Logovací soubory kontejneru (`json-file`) mohou při vysoké zátěži zabírat značné místo na disku VPS, pokud není v `docker-compose.prod.yml` explicitně nastaven `max-size: 10m` a `max-file: 3`.

---

## 3. ANALÝZA EXISTUJÍCÍCH KOMPONENT A ZAMETENÍ DUPLICIT

Provedený audit kódové báze potvrdil existenci následujících funkčních služeb a modulů, které budou v rámci Fáze 6E **reutilizovány bez vytváření duplicit**:

1. **`src/routes/adminVpsRoutes.ts`**:
   - Poskytuje nízkoúrovňový přístup k Podman/Docker REST API (`/api/admin/vps/status`, `/api/admin/vps/logs`, `/api/admin/vps/update`).
   - Obsahuje funkce `cleanDockerLogsStream()` pro odstraňování multiplexovaných hlaviček logů, `sanitizeContainerId()` pro ochranu proti Path Traversal a `formatContainersAsCliTable()`.
   - **Použití v 6E:** `InfrastructureAuditService` využije `fetchContainersList()` a `callPodmanApi()` v čistě read-only režimu pro inspekci kontejnerů a systémových metrik.
2. **`src/services/mailcowService.ts`**:
   - Obsahuje kompletní metodu `checkMailcowHealth()`, která testuje DNS, TLS, veřejnou/interní IP `172.22.1.14` a Mailcow API klíč.
   - **Použití v 6E:** `InfrastructureAuditService` zavolá `checkMailcowHealth()` přímo z `mailcowService.ts` bez psaní nového kódu pro Mailcow.
3. **`src/services/minioStorageService.ts`**:
   - Spravuje připojení k MinIO S3 uložení (`forcePathStyle: true`, bucket `tatovacesta-studies`).
   - **Použití v 6E:** `InfrastructureAuditService` provede lehkou S3 probe (Bucket Head check).
4. **`server.ts` (`/api/health`)**:
   - Provádí test Prisma PostgreSQL připojení (`SELECT 1`).
   - **Použití v 6E:** Infrastrukturní audit integruje tento stav do pilíře `databaseAndMigrations`.
5. **`src/services/audit/` (`AuditRegistryEngine`, `ReleaseGateService`, `RegressionEngine`)**:
   - Zajišťují správu nálezů P0–P3, výpočet 5 pilířů zdraví projektu a výpočet Release Gate verdiktu.
   - **Použití v 6E:** Infrastrukturní nálezy budou přímo převáděny na `AuditFinding` objekty a napojeny do `ReleaseGateService`.
6. **`src/components/admin/operations/UnifiedOperationsCenter.tsx`**:
   - Jednotné administrátorské centrum na adrese `/administrace/operace`.
   - **Použití v 6E:** Přidá se nová záložka `INFRASTRUCTURE` (`governance_infra`). Nebude se vytvářet žádné paralelní administrátorské rozhraní.
7. **`src/services/notionAuditMirror.ts` (`sanitizePiiAndSecrets`)**:
   - Robustní sanitizer odstraňující hesla, API klíče, JWT tokeny, e-maily a rodná čísla.
   - **Použití v 6E:** Zaručuje 0-PII při zrcadlení infrastrukturních nálezů do Notion.

---

## 4. AUDIT SCOPE – DETAILNÍ PROVĚRKA 10 DOMÉN INFRASTRUKTURY

| Doména | Běžící stav & Architektura | Bezpečnost & 0-PII | Zjištěná rizika / Opatření pro 6E |
|---|---|---|---|
| **1. Caddy** | Reverzní proxy v Docker síti `tatovacesta_app_network`. Zajišťuje HTTPS terminaci, routing na port 3000 a bezpečnostní hlavičky (`X-Frame-Options`, `HSTS`, `nosniff`). | SSL/TLS certifikáty jsou spravovány na úrovni hostitelského Caddy. | Express aplikace provede lehkou HTTP/HTTPS reakční sondu na vlastní veřejný endpoint pro ověření bezpečnostních hlaviček. |
| **2. Docker** | Produkční kontejnery `tatovacesta_app` (`node:20-alpine`) a `postgres_prod3` (`postgres:16-alpine`) s `restart: always`. | Přístup přes socket `unix:///var/run/docker.sock` chráněn výhradně pro `SUPER_ADMIN`. | Zabránit hromadění logů nastavením doporučených log-driver limitů. Zamezit osiřelým kontejnerům. |
| **3. PostgreSQL** | PostgreSQL 16 Alpine na dedikovaném nazvaném svazku `postgres_data_prod3:/var/lib/postgresql/data`. | Žádné SQL dumpy, hesla ani uživatelská data nesmí opustit server nebo vniknout do auditních logů. | Verifikace přes Prisma `SELECT 1`. Zákaz spouštění `prisma db push` na produkci (používat výhradně `prisma migrate deploy`). |
| **4. MinIO** | S3-kompatibilní uložení dokumentů (bucket `tatovacesta-studies`). S3 klient používá `forcePathStyle: true`. | Přístupové klíče `MINIO_ACCESS_KEY` a `MINIO_SECRET_KEY` jsou maskovány a nesmí být zobrazeny v UI/auditu. | Sonda testuje odezvu S3 `HeadBucket` v časovém limitu do 3000 ms. |
| **5. Mailcow** | Poštovní server Mailcow na interní IP `172.22.1.14` / `mail.tatovacesta.cz`. | E-mailové adresy a SMTP autentizační údaje podléhají 100% 0-PII sanitizaci. | Použití stávající metody `checkMailcowHealth()` z `mailcowService.ts`. |
| **6. Uptime Kuma** | Syntetický monitoring pravidelně (á 60s) dotazující `/api/health`. | Read-only veřejně přístupný stav bez odhalení vnitřní struktury. | Sonda ověřuje, že `/api/health` vrací korektní JSON strukturu se stavem `ok`. |
| **7. Dozzle / Logging** | Logy kontejneru jsou načítány přes `adminVpsRoutes.ts` (`/api/admin/vps/logs`). | Čištění Docker multiplexovaných hlaviček přes `cleanDockerLogsStream()`. Sanitizace PII přes `sanitizePiiAndSecrets()`. | Žádný surový log (raw log) s hesly nebo tokeny nesmí být uložen do markdown auditu nebo Notion. |
| **8. Health Endpoints** | Hlavní endpoint `/api/health` vrací stav databáze, prostředí a uptime. | Fail-closed chování u kritických administrativních cest při selhání databáze (HTTP 503 Service Unavailable). | Odlišení stavu Readiness (připravenost odbavovat požadavky) vs Liveness (proces žije). |
| **9. VPS Resources** | Zdroje serveru (RAM, CPU, Disk storage, Inodes) sledované přes Node `os` modul a Podman REST API `/info`. | Žádné interní IP nebo privátní cesty se nezveřejňují neautorizovaným uživatelům. | Včasná detekce zaplnění diskového prostoru (>85% kapacity triggeruje P2 finding, >95% triggeruje P0 finding). |
| **10. Security** | Žádné hardcoded secrets v repozitáři. Sekrety výhradně v `.env`. RBAC chráněný Express middlewarem. | Striktní kontrola rolí `SUPER_ADMIN` a `ADMIN` pro všechny inspekční endpointy. | Výhradně read-only přístup. Zákaz jakýchkoliv automatických destruktivních zásahů. |

---

## 5. NAVRŽENÁ ARCHITEKTURA A DATOVÝ TOK (PROPOSED ARCHITECTURE)

Navržená architektura propojuje infrastrukturní zdroje s existujícím auditním centrem bez narušení stávajících principů Change Control:

```
[ Infrastructure Data Sources ]
  ├─ Docker REST API / Socket   ---> (Kontejnery, logy, RAM/CPU, storage)
  ├─ Prisma DB Probe            ---> (SELECT 1, stav migrací, pool)
  ├─ MinIO S3 Probe             ---> (Dostupnost bucketu, S3 odezva)
  ├─ Mailcow API Probe          ---> (checkMailcowHealth, SMTP/HTTPS)
  └─ VPS OS Metrics             ---> (RAM, Disk space, CPU Load, Uptime)
         │
         ▼
[ InfrastructureAuditService (Strict Read-Only) ]
  ├─ 100% Read-Only & Non-Mutating (Zákaz restartu, mazání, změny konfigurace)
  ├─ PII & Secret Sanitization (sanitizePiiAndSecrets / cleanDockerLogsStream)
  ├─ Generování Infrastructure Findings (P0-P3)
         │
         ▼
[ Integrace do Auditní Architektury ]
  ├─ Infrastructure Findings (P0-P3)
  ├─ RegressionEngine (Sledování regrese a driftu závažnosti)
  ├─ ProjectHealthPillars (Aktualizace pilířů databaseAndMigrations, securityAndRbac, testSuiteAndBuild)
  ├─ ReleaseGateService (Integrace blokačních infrastrukturních nálezů do Release Gate)
         │
         ▼
[ Human Governance & Remediation Loop ]
  Finding (P0-P3) ──> AI Recommendation (Orion) ──> Control Plane Draft Action ──> Human Approval (SUPER_ADMIN) ──> Execution ──> Verification ──> Audit
```

---

## 6. SMLOUVA BEZPEČNOSTI PRO `InfrastructureAuditService` (READ-ONLY CONTRACT)

Služba `InfrastructureAuditService` bude mít **STRIKTNĚ ZAKÁZÁNO** provádět jakékoliv modifikující operace:

1. **ZÁKAZ RESTARTU KONTEJNERŮ:** Služba nesmí volat restartovací endpointy Dockeru/Podmanu.
2. **ZÁKAZ MAZÁNÍ DAT:** Služba nesmí mazat databázové tabulky, logy, svazky (volumes) ani MinIO objekty.
3. **ZÁKAZ ZMĚNY FIREWALLU A SÍTĚ:** Služba nesmí upravovat iptables, UFW ani Docker sítě.
4. **ZÁKAZ ZMĚNY CADDY A DNS:** Služba nesmí upravovat Caddyfile ani DNS záznamy.
5. **ZÁKAZ STRUKTURÁLNÍCH ZMĚN DB:** Služba nesmí spouštět DDL příkazy, migrace ani mutovat data.
6. **ZÁKAZ MODIFIKACE SCHRÁNEK MAILCOW:** Služba nesmí zakládat, měnit ani mazat e-mailové schránky.

---

## 7. ROZŠÍŘENÍ ADMIN UX (`/administrace/operace`)

Stávající komponenta `UnifiedOperationsCenter.tsx` bude rozšířena o novou sub-záložku `INFRASTRUCTURE` (`governance_infra`):

### Přehled sekcí v UI:
1. **Caddy & Reverzní Proxy:** Stav TLS certifikátu, bezpečnostní hlavičky, HTTPS forwarding.
2. **Docker Kontejnery:** Tabulka kontejnerů (`tatovacesta_app`, `postgres_prod3`), stav, uptime, restarty.
3. **PostgreSQL Databáze:** Stav Prisma připojení, odezva `SELECT 1`, schéma verifikace.
4. **MinIO Object Storage:** Stav bucketu `tatovacesta-studies`, S3 odezva.
5. **Mailcow E-Mail:** Stav API na `172.22.1.14`, počet schránek, TLS validace.
6. **Uptime Kuma & Monitoring:** Stav syntetických monitorů a odezva `/api/health`.
7. **Dozzle & Kontejnerové Logy:** Živý sanitovaný náhled logů kontejneru s možností vyhledávání.
8. **Health Endpoints:** Inspekce JSON odpovědi z `/api/health`.
9. **VPS Zdroje:** Vytížení RAM, CPU load, disková kapacita, inode tlak.
10. **Security & Audit:** Kontrola tajných klíčů, RBAC zabezpečení Docker socketu, 0-PII validace.

---

## 8. INTEGRACE DO NOTION KNOWLEDGE MIRROR (0-PII SANITIZATION)

Infrastrukturní nálezy mohou být zrcadleny do Notion databáze přes `knowledgeMirrorService.ts`. Před odesláním **vždy** proběhne striktní sanitizace přes `sanitizePiiAndSecrets`:

- **ZAKÁZANÉ HODNOTY V NOTION ZRCADLE:**
  - Hesla, DB hesla, SMTP hesla.
  - API klíče, JWT tokeny, Bearer tokeny.
  - E-mailové adresy uživatelů a rodná čísla.
  - Surové neodeslané logy (raw logs) obsahující interní trasovací údaje.
  - Privátní přístupové tokeny k Docker socketu nebo Podman API.

Snímky infrastrukturního auditu v Notion budou označeny atributem `trustLevel: DERIVED` nebo `AI_RECOMMENDATION` s priorním `verified: false`.

---

## 9. IMPLEMENTAČNÍ PLÁN PRO DALŠÍ KROK FÁZE 6E

1. **Krok 1: Vytvoření `src/services/audit/infrastructureAuditService.ts`**:
   - Implementace read-only inspekčních metod pro Docker, DB, MinIO, Mailcow, Caddy a VPS zdroje.
   - PII sanitizace všech výstupních zpráv.
2. **Krok 2: Integrace do `ReleaseGateService` a Express API**:
   - Připojení infrastrukturních zjištění do pilířů zdraví projektu (`evaluateProjectHealth`).
   - Přidání endpointu `GET /api/admin/qa/infrastructure-audit` s chráněným přístupem (`SUPER_ADMIN` / `ADMIN`).
3. **Krok 3: Aktualizace Frontend UI (`UnifiedOperationsCenter.tsx`)**:
   - Přidání záložky `INFRASTRUCTURE` s přehlednými kartami a sanitovaným log zobrazením.
4. **Krok 4: Vytvoření Regresních Testů (`tests/infrastructure-audit-phase6e.test.ts`)**:
   - Testování read-only kontraktu, sanitizace PII/sekretů, integrace do Release Gate a odchytu chyb.
5. **Krok 5: Verifikace a Audit**:
   - Spuštění `npx tsc --noEmit`, `npx prisma validate`, `npm run lint`, `vitest` a `npm run build`.

---

## 10. PLÁN ROSTOUCÍHO TESTOVÁNÍ, ROLLBACKU A RELEASE GATE

- **Testovací plán:**
  - Vývojové unit testy prověří chování `InfrastructureAuditService` jak při dostupných, tak při odpojených službách (offline DB, offline MinIO, offline Mailcow).
  - Testy sanitizace potvrdí, že žádný token, heslo nebo e-mail nepronikne do generovaných nálezů.
- **Rollback plán:**
  - Všechny změny Fáze 6E jsou **čistě aditivní a read-only**. Nebudou prováděny žádné změny v databázovém schématu Prisma ani v konfiguraci Dockeru.
  - V případě potřeby lze větev bezpečně vrátit na commit `16970bea7a447904f94646ec625cc81785b7e90e`.
- **Release Gate Integrace:**
  - Případné infrastrukturní nálezy P0/P1 automaticky nastaví příslušný pilíř na `FAILED` a zablokují sloučení (Release Gate `DO_NOT_MERGE`), dokud lidský správce problém nevyřeší.

---

### ZÁVĚR PRE-IMPLEMENTATION AUDITU
Architektura Fáze 6E je **zcela připravena k implementaci**. Návrh ctí zásady Change Control, zamezuje duplicitám, vynucuje 0-PII sanitizaci a garantuje, že infrastrukturní audit bude fungovat v čistě **read-only** režimu bez pravomoci spouštět automatické destruktivní zásahy.
