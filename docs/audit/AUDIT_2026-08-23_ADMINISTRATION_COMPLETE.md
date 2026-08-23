# AUDIT: Kompletní administrace (Táta má právo / DEV3)

**Datum a čas auditu:** 2026-08-23
**Projekt:** Táta má právo – dev3
**Typ auditu:** Kompletní READ-ONLY audit administrace (Frontend, API, Databáze, Bezpečnost)

## 1. Executive Summary

Audit administrace odhalil **závažné architektonické a bezpečnostní nedostatky**. Přestože UI administrace obsahuje široké portfolio nástrojů (26+ modulů), podkladové API a databázová vrstva jsou ve stavu, který neodpovídá produkčnímu nasazení. Bylo nalezeno několik **CRITICAL** a **HIGH** zranitelností, především naprostá absence autorizace u kritických API endpointů, nekonzistence mezi frontendem a backendem, a nevhodné využití in-memory datového úložiště (`dbStore`) namísto perzistentní Prisma databáze.

## 2. Stav administrace (Overall Health)

*   **Frontend Administrace:** Velmi robustní, obsahuje 26 samostatných manager komponent s podporou pokročilého UI (Tailwind, Radix).
*   **Backend API:** Výrazně monolitické v `server.ts` a částečně routované. Mnoho funkcí postrádá RBAC ochranu (`requireRole` nebo `requireAuth`).
*   **Databáze:** Aplikace používá in-memory pole `dbStore` k ukládání desítek kritických entit (uživatelé, passkeys, stavy) namísto existujícího Prisma klienta, což způsobuje ztrátu dat při každém restartu služby (Cloud Run).

## 3. Seznam všech administračních modulů (Frontend/API Matrix)

| Modul (Frontend) | API Endpoint (Zavoláno z UI) | Backend Existence | RBAC Kontrola (Backend) | Stav / Poznámka |
| :--- | :--- | :--- | :--- | :--- |
| `UserManager.tsx` | `/api/admin/users` | **Existuje** | `ADMIN` | Používá in-memory `dbStore` |
| `ContactModerationManager.tsx` | `/api/pracovnici/pending` | **Existuje** | **ŽÁDNÁ** | Endpoint v `server.ts` je zcela veřejný |
| `ContactModerationManager.tsx` | `/api/pracovnici/:id/status` | **Existuje** | **ŽÁDNÁ** | Aktualizace statusu (APPROVE/REJECT) je veřejná |
| `SubjektManager.tsx` | `/api/subjekty` | **Existuje** | `MODERATOR` | Plně pokryto v `subjektRoutes.ts` |
| `AuditCenter.tsx` | `/api/admin/audits` | **Existuje** | `ADMIN` | Plně pokryto |
| `CmsManager.tsx` | `/api/cms/...` | **Existuje** | **ŽÁDNÁ** | Většina CMS endpoints v `server.ts` je veřejná |
| `Role/Permission` | `/api/roles`, `/api/permissions`| **Existuje** | **ŽÁDNÁ** | Získání rolí je veřejné (bez `requireAuth`) |

## 4. RBAC Matrix a Bezpečnost (Security Audit)

**CRITICAL: Neexistující ochrana API**
Byla identifikována přímá definice endpointů v `server.ts`, která neprochází `requireAuth` ani `requireRole` middlewarem. 
Veřejný uživatel může přistoupit a modifikovat data na těchto endpointech:
*   `POST /api/pracovnici` – kdokoliv může anonymně vytvořit pracovníka.
*   `PATCH /api/pracovnici/:id/status` – kdokoliv může změnit status (schválit/zamítnout) libovolného pracovníka!
*   `DELETE /api/pracovnici/:id` – kdokoliv může nenávratně smazat záznam.
*   `GET /api/pracovnici/pending` – kdokoliv vidí moderátorskou frontu.

**Funkčnost middleware (`requireRole`)**
Tam, kde je middleware nasazen (např. v dedikovaných routes jako `subjektRoutes.ts` pro `MODERATOR`), funguje správně pomocí `AuthService.getUserById` a srovnáním RBAC stromu.

## 5. Databáze (Database/API Matrix)

**CRITICAL: In-Memory Databáze v produkci**
Vyhledávání `grep dbStore server.ts` odhalilo 66 řádků využívajících in-memory stav (`dbStore.users.find`, `dbStore.users.unshift`).
*   Produkční data (uživatelé, MFA, autorizace) se zapisují do proměnné (RAM).
*   Toto narušuje **Integritu Dat (P0)** a **Udržitelnost**, jelikož Prisma model `User` je do značné míry obcházen pro runtime operace.

## 6. Moderation Workflow Audit

*   **Původní cíl:** Návrhy pracovníků jsou drženy ve stavu PENDING, viditelné v `ContactModerationManager.tsx`, odkud se schvalují (APPROVED) nebo odmítají (REJECTED).
*   **Problém:** Vzhledem k popsané absenci `requireAuth` u `PATCH /api/pracovnici/:id/status` v `server.ts` je workflow naprosto nezabezpečeno. Kdo zná nebo uhodne ID pracovníka, může ho schválit přímým API voláním.

## 7. Subject Registry Audit (227 OSPODs)

*   Administrace načítá data korektně přes `GET /api/subjekty`.
*   Data do OSPOD registru jsou persistentní a existují. Modely `Subjekt` a `Pracovnik` jsou v Prisma schématu správně svázány.
*   Přímo v `SubjektManager.tsx` API komunikuje se `src/routes/subjektRoutes.ts`, který je na rozdíl od `server.ts` správně chráněn na `MODERATOR`.

## 8. Nálezy podle klasifikace

### CRITICAL
*   **ID:** SEC-01
    *   **Závažnost:** CRITICAL
    *   **Kategorie:** SECURITY / FUNCTIONAL
    *   **Soubor:** `server.ts`
    *   **Popis:** Absolutní absence autentizace (`requireAuth`) a autorizace (`requireRole`) na klíčových endpointech `/api/pracovnici/pending`, `POST /api/pracovnici`, `PATCH /api/pracovnici/:id/status`, `DELETE /api/pracovnici/:id`.
    *   **Dopad:** Kdokoliv může mazat a schvalovat návrhy (BOLA/IDOR).
    *   **Oprava:** Přidat `requireAuth` a `requireRole('MODERATOR')` do handlerů, nebo je přesunout do `subjektRoutes.ts`.

*   **ID:** ARCH-01
    *   **Závažnost:** CRITICAL
    *   **Kategorie:** DATABASE / ARCHITECTURE
    *   **Soubor:** `server.ts`
    *   **Popis:** Autentizační a uživatelské endpointy (`/api/auth/register`, `/api/users/quick-create`) zapisují uživatele do in-memory struktury `dbStore` místo PostgreSQL (Prisma).
    *   **Dopad:** Všechny nově registrované účty, úpravy rolí a MFA nastavení zmizí po restartu kontejneru.
    *   **Oprava:** Přepsat veškeré použití `dbStore` na metody `prisma.user.*`.

### HIGH
*   **ID:** SEC-02
    *   **Závažnost:** HIGH
    *   **Kategorie:** SECURITY
    *   **Soubor:** `server.ts`
    *   **Popis:** Chybějící ochrana veřejných CMS endpointů, které čtou potenciálně neveřejná strukturovaná data stránek před jejich publishnutím (`app.get('/api/cms/...')`).

### MEDIUM / INFO
*   **ID:** UX-01
    *   **Závažnost:** INFO
    *   **Kategorie:** ARCHITECTURE
    *   **Soubor:** `server.ts` vs `src/routes/`
    *   **Popis:** Rozbitá modulární struktura. Většina aplikace používá elegantní routery (`pageRoutes.ts`, `qaRoutes.ts`), ale kritické auth a users endpointy uvízly v gigantickém `server.ts`.

## 9. Výsledky testů
*   **`npx tsc --noEmit`**: PASS (Clean)
*   **`npx vite build`**: PASS (Build proběhl s varováním o velikosti chunku).

## 10. Prioritizovaný Remediation Plan (Nesmí být provedeno bez příkazu)

1.  **HOTFIX (P0):** Uzamknout `server.ts` endpointy `/api/pracovnici/*` pomocí `requireAuth` a `requireRole('MODERATOR')`.
2.  **REFACTOR (P0):** Nahradit 66 výskytů `dbStore` v `server.ts` skutečnými dotazy do Prisma `AuthService`.
3.  **CLEANUP (P1):** Rozdělit `server.ts` (více než 2500 řádků) a vytěžit z něj `userRoutes.ts` a `authRoutes.ts`.
