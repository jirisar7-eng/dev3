# AUDIT REPORT: TEAM CENTER FOUNDATION & GRANULAR RBAC IMPLEMENTATION (PHASE 04C)

**Datum a čas:** 2026-08-26  
**Prostředí:** DEV3  
**Větev:** `feature/auth-session-consistency`  
**Autor:** Hlavní softwarový architekt & QA Auditor  
**Stav:** PASS (Kompletní implementace & 100% testy zelené)

---

## 1. Cíl a Účel Úlohy

Fáze **PHASE 04C** představuje první implementační etapu schváleného návrhu z fází `PHASE 04A` (Discovery) a `PHASE 04B` (Design). Cílem bylo:
1. Zavést **granulární RBAC** s principem **Least Privilege** a **Fail-Closed**.
2. Rozšířit Prisma schéma o tickety a přiřazování bez destruktivních migrací (`assignedToId`, `assignedAt`, `assignedById`, `internalNotesCount`, `lastActivityAt`, `resolvedAt`, `isInternal`).
3. Vytvořit autoritativní backendové API pro Team Center (`/api/team/*`) chráněné striktními `requirePermission` a IDOR/BOLA kontrolami (`verifyTicketAccess`).
4. Zaručit **absolutní izolaci klientských spisů a spisových dat** (`Case`, `CaseDocument`, `Judgment`) – týmové role nemají žádný plošný přístup k těmto entitám.
5. Vytvořit hybridní frontendové rozhraní: samostatný dashboard **Team Center** (`/team`), jeho vnoření do **Admin Shellu** (Sekce 8 - Team Center) a zpřístupnění v hlavní navigaci (`Header.tsx`) a routingu (`App.tsx`).
6. Napsat komplexní testovací sadu a ověřit celistvost celého projektu.

---

## 2. Přehled Provedených Změn

### A. Databázová Vrstva & Schéma (`prisma/schema.prisma`)
- Model `SupportTicket`:
  - Přidána pole: `assignedToId`, `assignedAt`, `assignedById`, `internalNotesCount`, `lastActivityAt`, `resolvedAt`.
  - Přidána relace: `assignedTo User? @relation("TicketAssignee", fields: [assignedToId], references: [id])`.
  - Přidány indexy: `@@index([assignedToId])`, `@@index([status, assignedToId])`.
- Model `SupportTicketMessage`:
  - Přidáno pole: `isInternal Boolean @default(false)` pro odlišení interních týmových poznámek od veřejné komunikace s klientem.
- Model `User`:
  - Přidána inverzní relace `assignedTickets SupportTicket[] @relation("TicketAssignee")`.

### B. Oprávnění & RBAC Matice (`src/services/seedService.ts`)
Do systémového seedu a tabulky `Permission` bylo přidáno 11 nových granulárních týmových oprávnění:
- `team.access` – Vstup do Team Centra
- `team.tickets.view_assigned` – Čtení ticketů přiřazených danému uživateli
- `team.tickets.view_all` – Čtení všech ticketů (triage fronta a globální přehled)
- `team.tickets.reply` – Odpovídání na tickety / přidávání interních poznámek
- `team.tickets.assign` – Přeřazování ticketů mezi členy týmu
- `team.tickets.close` – Uzavírání a změna stavu ticketů
- `team.moderation.subjects` – Moderace a schvalování subjektů na mapě
- `team.moderation.reviews` – Moderace recenzí
- `team.volunteers.view` – Seznam dobrovolníků a členů spolku
- `team.knowledge.view` – Prohlížení interní znalostní báze spolku
- `team.knowledge.edit` – Editace interní znalostní báze spolku

**Mapování rolí na oprávnění:**
- `VOLUNTEER`: Nejnižší týmová oprávnění (`team.access`, `team.tickets.view_assigned`, `team.tickets.reply`, `team.knowledge.view`). Nemá přístup k cizím ticketům, správě uživatelů ani systémovým logům.
- `MODERATOR`: Týmový přístup + moderace (`team.access`, `team.tickets.view_assigned`, `team.tickets.view_all`, `team.tickets.reply`, `team.moderation.subjects`, `team.moderation.reviews`, `team.knowledge.view`).
- `LEGAL_EDITOR` / `CONTENT_MANAGER`: Týmový přístup + znalostní báze + redakce obsahu.
- `ADMIN` / `SUPER_ADMIN` / `SYSTEM_ADMIN`: Plná týmová oprávnění včetně přiřazování ticketů (`team.tickets.assign`, `team.tickets.close`) a správy členů.

### C. Backend API Endpointy (`src/routes/teamRoutes.ts` & `server.ts`)
Vytvořen dedikovaný router `/api/team` připojený v `server.ts`:
1. `GET /api/team/stats` – Statistika ticketů (moje přiřazené, nepřiřazené, otevřené, vyřešené).
2. `GET /api/team/tickets/assigned` – Seznam ticketů přiřazených přihlášenému pracovníkovi.
3. `GET /api/team/tickets/triage` – Fronta nepřiřazených ticketů čekajících na zpracování (`team.tickets.view_all`).
4. `GET /api/team/tickets/all` – Všechny tickety v systému (`team.tickets.view_all`).
5. `GET /api/team/tickets/:id` – Detail ticketu s historií zpráv a interních poznámek. Chráněno `verifyTicketAccess` (IDOR ochrana: dobrovolník vidí pouze svůj ticket, správce vidí vše).
6. `POST /api/team/tickets/:id/assign` – Přiřazení ticketu konkrétnímu pracovníkovi (`team.tickets.assign`).
7. `POST /api/team/tickets/:id/self-assign` – Převzetí nepřiřazeného ticketu do své péče (`team.tickets.reply`).
8. `POST /api/team/tickets/:id/reply` – Odeslání odpovědi nebo interní týmové poznámky.
9. `POST /api/team/tickets/:id/status` – Změna stavu ticketu (`team.tickets.close`).
10. `GET /api/team/volunteers` – Přehled aktivních dobrovolníků a koordinátorů spolku (`team.volunteers.view`).
11. `GET /api/team/knowledge` – Metodické materiály a právní standardy pro dobrovolníky (`team.knowledge.view`).

### D. Uživatelské Rozhraní (Frontend UI)
- `src/components/team/TeamCenterDashboard.tsx`: Plnohodnotný moderní dashboard s přehledem statistik, frontou nepřiřazených dotazů (Triage), seznamem mých úkolů (Moje přiřazené), filtrem témat, detailem ticketu včetně konverzace, možností přidání veřejné odpovědi i interní žlutě zvýrazněné poznámky, kartou dobrovolníků a metodickou znalostní bází.
- `src/components/admin/layout/TeamCenterSlot.tsx`: Propojen s `TeamCenterDashboard` pro hladkou integraci v rámci Admin Shellu (Sekce 8).
- `src/components/Header.tsx`:
  - Přidána autorizace `isAuthorizedTeam`.
  - Přidáno tlačítko `Team` do přepínače vrstev (Desktop Layer Switcher) pro týmové role.
  - Přidán odkaz `Team Center (Spolek)` do uživatelského menu (desktop i mobil).
- `src/App.tsx`:
  - Přidána vrstva `team` do typu `AppView`.
  - Přidáno směrování cest `/team` a `/spolek` na komponentu `TeamCenterDashboard`.

---

## 3. Bezpečnostní Ověření & Izolace Dat (P0)

1. **Striktní Izolace Klientských Spisů (No Case Leakage):**
   - V žádném z týmových endpointů (`/api/team/*`) nebyl povolen přístup k modelům `Case`, `CaseDocument` ani `Judgment`.
   - Všechny klientské operace v `caseRoutes.ts` zůstávají výhradně vázány na `ClientCaseService.authorizeCaseAccess(caseId, req.user!)`.
2. **IDOR & BOLA Ochrana:**
   - Každé volání `/api/team/tickets/:id` a souvisejících POST endpointů prochází funkcí `verifyTicketAccess(ticket, user)`.
   - Uživatel bez `team.tickets.view_all` nemůže číst ani upravovat ticket přiřazený jinému dobrovolníkovi.
3. **Fail-Closed Princip:**
   - Běžní uživatelé (`USER`, `REGISTERED_USER`, `VERIFIED_USER`) mají v databázi nulová týmová oprávnění a při pokusu o přístup k `/api/team/*` obdrží HTTP 403 Forbidden.
4. **Žádné Hardcoded Secrets ani Fake Data:**
   - Veškeré dotazy jdou přímo přes Prisma ORM s transakční integritou a ověřováním relací.

---

## 4. Výsledky Testů & QA Ověření

Vytvořen nový integrační test `tests/team-center-phase04c.test.ts` a spuštěn celý centrální test runner `npm test`.

### Výsledky Test Sady:
- `tests/team-center-phase04c.test.ts`: **PASS (5/5 subtestů)**
  - 1. Prisma Schema Verification: SupportTicket & SupportTicketMessage (PASS)
  - 2. Granular Permissions & Role-Permission Seed Mapping (PASS)
  - 3. Team Center Routes & IDOR Protection Verification (PASS)
  - 4. Strict Case & Legal Data Isolation Guarantee (PASS)
  - 5. Hybrid UI & Navigation Contract (Header + AdminDashboard + App.tsx) (PASS)
- **Celkový Test Runner (`npm test`): 18/18 testovacích sad PASS (100% úspěšnost)**
- **TypeScript Typecheck (`npm run lint` / `tsc --noEmit`): PASS (0 chyb)**
- **Produkční Build (`npm run build`): PASS (Úspěšná kompilace)**

---

## 5. Dotčené Soubory

1. `prisma/schema.prisma`
2. `src/services/seedService.ts`
3. `src/routes/teamRoutes.ts` (nový)
4. `server.ts`
5. `src/components/team/TeamCenterDashboard.tsx` (nový)
6. `src/components/admin/layout/TeamCenterSlot.tsx`
7. `src/components/Header.tsx`
8. `src/App.tsx`
9. `tests/team-center-phase04c.test.ts` (nový)
10. `scripts/test-runner.js`
11. `docs/audit/TEAM_CENTER_PHASE_04C_IMPLEMENTATION_2026-08-26.md` (tento audit)

---

## 6. Závěr & Stav

Implementace fáze **PHASE 04C** je kompletní, otestovaná a splňuje všechny bezpečnostní a architektonické standardy projektu „Táta má právo“.
