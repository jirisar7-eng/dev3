# DEV3 – AUDIT A REPORT FÁZE 19: CONTENT & PROJECT CONTROL CENTER

**Datum a čas:** 2026-08-28 03:14:00  
**Projekt:** Táta má právo (dev3)  
**Větev:** `feature/phase-19-content-project-control-center`  
**Autor / Režim:** Senior Architekt & QA Auditor (AI Studio)  

---

## 1. PŮVODNÍ STAV & CÍLE FÁZE 19

Před Fází 19 chybělo v administraci sjednocené řídicí centrum obsahu, projektového backlogu, auditních zjištění a živé reality repozitáře. Informace o pokrytí portálu, restech z minulých auditů a fázových cílích byly roztříštěné napříč samostatnými dokumenty.

**Hlavní cíl Fáze 19:**
Vytvořit kompletní, produkčně připravené centrum **„Obsah & Projekt“ (Content & Project Control Center)** přístupné přímo v Admin Shellu. Centrum sjednocuje pohled na:
1. Skutečně implementované stránky, nástroje a kalkulačky (Reality Content Catalog).
2. Auditní doporučení z minulých Fází 13–18.
3. Projektový backlog s 6 unifikovanými stavy (`DONE`, `IN_PROGRESS`, `PLANNED`, `IDEA`, `BLOCKED`, `ARCHIVED`).
4. Fázový plán vývoje (Fáze 1–19+).
5. **Unified Smart Audit** pro srovnání reálného stavu (GitHub + repozitář) a plánovaného stavu (Notion/Backlog) včetně detekce **Reality Mismatch**.

---

## 2. PROVEDENÉ ZMĚNY A ARCHITEKTURA

### Architektonické komponenty:

1. **`src/types/projectControl.ts`**:
   - Definice datových typů pro 6 unifikovaných stavů úkolů.
   - Typy pro katalog obsahu, auditní doporučení, projektové fáze a Smart Audit.
   - Typy pro detekci nesouladů (`RealityMismatchItem`) a stav připojení externích služeb (`ExternalServiceConnectionStatus`).

2. **`src/services/projectControlService.ts`**:
   - Centrální služba spravující statické ověřené katalogy i dynamický backlog.
   - Fail-closed architektura: při výpadku PostgreSQL/Prisma databáze automaticky přepíná na in-memory fallback store bez padání aplikací.
   - Generátor sjednoceného **Smart Audit Summary** kombinujícího stav repozitáře (GitHub), projektové roadmapy (Notion/Backlog) a detekci nesouladů.
   - Integrace s `AuditService` pro logování všech CRUD operací nad backlogem.

3. **`src/routes/projectControlRoutes.ts`**:
   - Restful API endpointy na `/api/admin/project-control/*`:
     - `GET /overview` - Souhrnné metriky a stav zdraví.
     - `GET /content` - Katalog obsahu portálu s filtrováním.
     - `GET /recommendations` - Auditní doporučení.
     - `GET /phases` - Fáze vývoje.
     - `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` - CRUD operace backlogu.
     - `GET /smart-audit` - Sjednocený Smart Audit zpráv o repozitáři a plánu.

4. **`src/components/admin/ContentProjectCenter.tsx`**:
   - Reaktivní vizuální rozhraní v Admin Shellu s 9 záložkami:
     - **Přehled** (Dashboard & KPI)
     - **Obsah portálu** (Co máme)
     - **Co chybí** (Analýza mezer)
     - **Doporučení** (Auditní nálezy)
     - **Nápady & Backlog** (Správa úkolů s modal okny)
     - **Roadmapa** (Fáze vývoje)
     - **Audity** (Historické zprávy)
     - **Smart Audit** (Sjednocený audit reality vs. plánu s detekcí rozporů)
     - **Nastavení & Integrace** (Stav GitHub/Notion spojení)

5. **`src/config/adminNavigation.ts` & `AdminDashboard.tsx`**:
   - Registrace sekce `Obsah & Projekt` (`project-control`) v navigaci Admin Shellu pod sekcí *Obsah & CMS* a její korektní URL směrování.

---

## 3. SECURITY, TOKEN SECURITY, RBAC & AUDIT LOG

### Token Security & Ochrana secrets (P0)
- GitHub i Notion API klíče a tokeny jsou zpracovávány **výhradně server-side** v Node.js prostředí.
- Žádné secrets nebyly vloženy do zdrojového kódu, bundle, localStorage, sessionStorage ani do auditních souborů.
- Pokud tokeny nejsou nastaveny v proměnných prostředí, rozhraní transparentně zobrazuje stav **NOT CONNECTED / UNAVAILABLE** a **nevytváří falešná (dummy/fake) data**.

### RBAC Kontrola přístupu
- Endpointy v `projectControlRoutes.ts` i UI v `ContentProjectCenter.tsx` podléhají existujícímu bezpečnostnímu middleware `requireAuth` a `requireAdminOrContentManager`.
- Přístup je povolen výhradně autorizovaným rolím (`SUPER_ADMIN`, `ADMIN`, `SYSTEM_ADMIN`, `CONTENT_MANAGER`, `LEGAL_EDITOR`). Nepřihlášeným uživatelům nebo běžným rolím `USER` je vrátena chyba HTTP 403 Forbidden.

### Audit Log
- Všechny operace přidání, úpravy nebo smazání projektového úkolu automaticky generují záznam v existujícím `AuditService` logu včetně identifikace autora (`who`), času (`when`), operace (`what`), původní a nové hodnoty.

---

## 4. UNIFIED SMART AUDIT & REALITY MISMATCH DETEKCE

Smart Audit sjednocuje pohled na stav projektu ze dvou perspektiv:
- **Git/Repozitář Reality**: Stav kódu, commit historie, existující testy a auditní soubory.
- **Notion/Backlog Plan**: Plánované fáze, doporučení z předchozích auditů a prioritní úkoly.

**Detekce Reality Mismatch:**
Pokud se stav položky liší mezi implementací (GitHub/Kód) a evidencí (Notion/Backlog), Smart Audit vygeneruje varování `⚠️ REALITY MISMATCH` s uvedením obou zdrojů. Žádný stav není tichým způsobem přepsán.

---

## 5. SEZNAM ZMĚNĚNÝCH A VYTVOŘENÝCH SOUBORŮ

| Typ | Cesta | Popis |
| :--- | :--- | :--- |
| **Modified** | `server.ts` | Registrace `/api/admin/project-control` routeru |
| **Modified** | `src/components/admin/AdminDashboard.tsx` | Vykreslení `ContentProjectCenter` pro záložku `project-control` |
| **Modified** | `src/config/adminNavigation.ts` | Přidání navigační položky `Obsah & Projekt` |
| **Untracked** | `src/types/projectControl.ts` | TypeScript rozhraní a typové definice |
| **Untracked** | `src/services/projectControlService.ts` | Business logika a katalog dat |
| **Untracked** | `src/routes/projectControlRoutes.ts` | Express API endpointy s RBAC |
| **Untracked** | `src/components/admin/ContentProjectCenter.tsx` | React UI rozhraní s 9 záložkami |
| **Untracked** | `tests/project-control-center-phase19.test.ts` | Vitest integrační testy (7/7 PASS) |
| **Untracked** | `docs/audit/PHASE_19_CONTENT_PROJECT_CONTROL_CENTER_RESULT_2026-08-28.md` | Tento auditní report |

---

## 6. VÝSLEDKY TESTŮ A BUILDU

1. **TypeScript Typecheck (`tsc --noEmit`)**: Bez chyb.
2. **Kompilace aplikace (`compile_applet`)**: **BUILD PASS** (úspěšná kompilace Vite + server).
3. **Vitest testy (`tests/project-control-center-phase19.test.ts`)**: **7/7 PASS**.

---

## 7. OTEVŘENÉ POLOŽKY A DOPORUČENÍ PRO DALŠÍ FÁZI

1. **Možnost napojení živých webhooků GitHub / Notion**: Vteřinové aktualizace při změnách v remote repozitáři nebo pracovním prostoru Notion.
2. **Přímé propojování úkolů s Opatrovnickou složkou**: Automatické vytváření úkolů z uživatelské zpětné vazby.

---
*Audit schválen a připraven k commitu a push na feature branch a následnému merge do `main`.*
