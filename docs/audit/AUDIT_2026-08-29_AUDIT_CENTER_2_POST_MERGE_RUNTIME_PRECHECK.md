# POST-MERGE RUNTIME PRE-CHECK & DEPLOYMENT CHECKLIST — AUDIT CENTER 2.0

**Datum a čas:** 2026-08-29 17:56 UTC  
**Repozitář:** `jirisar7-eng/dev3`  
**Cílová větev (Merged):** `main`  
**Potvrzený HEAD na main:** `3bc57dabb5e44e5a2de2b18ff508ce32c9ef238c`  
**PR:** #22 (Squash Merged)  
**Režim:** READ-ONLY ANALÝZA & RUNTIME READINESS VERIFIKACE  

---

## 1. EVIDENCE CLASSIFICATION SUMMARY

| Komponenta / Oblast | Status | Klasifikace | Evidence / Důkaz |
|---|---|---|---|
| **Git main HEAD** | `3bc57dabb5e44e5a2de2b18ff508ce32c9ef238c` | **VERIFIED** | Ověřeno přes `git fetch origin main` & `git rev-parse origin/main` |
| **Audit Center 2.0 Kód v main** | Všech 5 fází v `main` | **VERIFIED** | Zkontrolován strom souborů a diff v PR #22 |
| **Prisma Schema & Migrace** | Model `AuditFinding` + SQL DDL migrace | **VERIFIED** | `prisma validate` PASS, DDL soubor přítomen |
| **API Routy (Backend)** | `/api/admin/audits/*` & `/api/admin/audit-center/*` | **VERIFIED** | Zkontrolována registrace v `server.ts` & `src/routes/auditCenterRoutes.ts` |
| **RBAC & Autorizace** | `requireAuth` + `requireRole('ADMIN')` | **VERIFIED** | Server-side vynucení na všech routách, fail-closed |
| **Admin UI Integrace** | `/administrace/audity` (4 panely) | **VERIFIED** | `AuditCenter.tsx` s `ProjectHealthCard`, `AuditFindingsList`, `OrionAssistantPanel`, `AuditDocumentsCatalog` |
| **Orion AI Safety Bridge** | Zákaz approve/execute, DRAFT only | **VERIFIED** | 11/11 safety testů PASS, User ∩ Orion capabilities |
| **Unit / Integration Testy** | 52/52 dedikovaných testů | **VERIFIED** | Vitest běh 52/52 PASS |
| **Docker & Compose Architektura** | `tatovacesta_app_dev3` + `postgres_dev3` | **DERIVED** | Odvozeno z `Dockerfile`, `docker-compose.yml`, `deploy.sh` |
| **Nové Environment Variables** | 0 nových env proměnných | **VERIFIED** | Žádné nové secrets nejsou pro Audit Center 2.0 vyžadovány |
| **Ostré nasazení na produkční VPS** | Skutečný běh na produkčním serveru | **NOT EXECUTED** | Bude provedeno v rámci deployment kroku |

---

## 2. DOCKER & DEPLOYMENT ARCHITEKTURA (DERIVED)

- **Docker kontejner:** `tatovacesta_app_dev3` (Node.js 20 Alpine, multi-stage build).
- **PostgreSQL kontejner:** `postgres_dev3` (PostgreSQL 16 Alpine, persistentní volume `postgres_data_dev3`).
- **Deploy skript:** `deploy.sh` zajišťuje:
  1. `git fetch origin main` & `git reset --hard origin/main`
  2. `docker compose up -d --build --remove-orphans`
  3. `docker compose exec -T app npx prisma validate`
  4. `docker compose exec -T app npx prisma db push` (nebo aplikaci migrací)
  5. Ověření health checku na `/api/health`.

---

## 3. DATABÁZOVÁ INTEGRITA & MIGRACE

- **Model:** `AuditFinding`
  - Primární klíč: `id` (Text/UUID).
  - Unikátní složený index: `@@unique([auditFilename, code])`.
  - Cizí klíč: `actionId` odkazující na `ControlPlaneAction.id` s `ON DELETE SET NULL`.
- **Riziko migrace:** **NULOVÉ (ČISTĚ ADITIVNÍ)**. Žádná existující tabulka, sloupec ani vazba se nemění ani nemaže.
- **SSOT Integrita:** Markdown soubory v `docs/audit/*.md` zůstávají primárním Single Source of Truth; databáze slouží jako indexovaný query cache.

---

## 4. BEZPEČNOSTNÍ A RUNTIME KONTROLA

1. **RBAC:** Všechny Audit Center endpointy vyžadují roli `ADMIN` nebo `SUPER_ADMIN`.
2. **Orion Safety Bridge:**
   - Orion identita: `agent-orion-qa-v1`.
   - Zákaz přímého zápisu do DB, filesystemu nebo repozitáře.
   - Zákaz `approveAction` a `executeAction`.
   - Návrhy jsou vytvářeny výhradně jako `DRAFT` v Control Plane podléhající lidskému schválení.
3. **Fail-Closed:** Při nedostupnosti dat nebo chybě parseru vrací Release Gate stav `UNKNOWN` / `DO_NOT_MERGE`.

---

## 5. STANDARDNÍ DEPLOYMENT & VERIFIKAČNÍ PLÁN

1. **Git Sync na VPS:** Provedení `git fetch origin main` a checkout/reset na `3bc57dabb5e44e5a2de2b18ff508ce32c9ef238c`.
2. **Docker Build:** Spuštění `docker compose up -d --build` (vytvoření nového image s kompilovaným bundle).
3. **Prisma Synchronizace:** Aplikace schématu / migrace `20260829_add_audit_finding_model`.
4. **Health Check:** Ověření HTTP 200 na `/api/health`.
5. **API Smoke Test:**
   - `GET /api/admin/audit-center/release-gate` (musí vrátit deterministické skóre zdraví a stav Release Gate).
   - `GET /api/admin/audit-center/findings` (musí vrátit seznam nálezů z registru).
6. **Admin UI Verifikace:** Otevření `/administrace/audity` a kontrola zobrazení všech 4 záložek (Project Health, Findings, Orion Assistant, Catalog).
7. **Control Plane / Orion E2E Test:** Ověření, že Orion analýza vytvoří návrh akce ve stavu `DRAFT`.
8. **Restart & Fallback Resilience:** Ověření, že při případném restartu DB nedochází k pádu aplikace (graceful in-memory fallback).

---

## 6. ZÁVĚREČNÉ HODNOCENÍ

- **Status:** **READY FOR DEPLOYMENT**
- **Doporučení:** **PROCEED TO DEPLOYMENT** (Systém na `main` je plně stabilní, typově i bezpečnostně ověřen).
