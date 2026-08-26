# PHASE 04D — TEAM CENTER SECURITY, RBAC & INTEGRATION FINAL AUDIT

**Projekt:** Táta má právo (`dev3`)  
**Datum:** 2026-08-26  
**Větev:** `feature/auth-session-consistency`  
**Režim:** STRICT READ-ONLY AUDIT  
**Status:** ✅ **PASS / APPROVED**  
**Předchozí reference:**
- `docs/audit/TEAM_CENTER_SPOLEK_RBAC_DISCOVERY_2026-08-26.md` (Phase 04A)
- `docs/audit/TEAM_CENTER_RBAC_DATA_ACCESS_DESIGN_2026-08-26.md` (Phase 04B)
- `docs/audit/TEAM_CENTER_PHASE_04C_IMPLEMENTATION_2026-08-26.md` (Phase 04C)

---

## 1. Executive Summary & Cíl Auditu

Tento audit představuje závěrečnou kontrolní fázi (**PHASE 04D**) implementace modulu **Team Center (Spolkové centrum)**.
Účelem auditu je provést nezávislou, detailní a komplexní prověrku:
1. **Granulárního RBAC modelu** a oddělení rolí od oprávnění (`team.*`).
2. **Bezpečnosti ticketovacího systému**, ochrany proti **IDOR/BOLA** útokům a izolace interních poznámek.
3. **P0 Izolace citlivých klientských dat** (žádný přístup k entitám `Case`, `CaseDocument`, `Judgment` pro běžné role Team Centra).
4. **Oddělení administrativních hranic** (ochrana VPS, Mailcow, DNS, GitHub Publisher před spolkovými rolemi).
5. **Navigační a UI architektury** (hybridní integrace: standalone `/team` dashboard + Admin Shell Slot).
6. **Auditovatelnosti a dohledatelnosti** všech provedených operací.
7. **Kvality kódu, typové bezpečnosti a průchodnosti testů**.

---

## 2. Architektura RBAC & Granulárních Oprávnění

### 2.1 Deklarace a Mapování Oprávnění
Veškerá oprávnění jsou spravována autoritativně v databázi přes tabulky `Permission` a `RolePermission` v `src/services/seedService.ts`.

Bylo zavedeno **11 specializovaných spolkových oprávnění**:
1. `team.access` – Vstup do Team Centra.
2. `team.tickets.view_assigned` – Zobrazení ticketů přiřazených danému uživateli.
3. `team.tickets.view_all` – Globální náhled na všechny tickety.
4. `team.tickets.reply` – Odesílání veřejných i interních odpovědí na přiřazené/přístupné tickety.
5. `team.tickets.assign` – Třídění, prioritizace a přiřazování ticketů dobrovolníkům/mentorům.
6. `team.tickets.close` – Uzavírání a archivace ticketů.
7. `team.moderation.subjects` – Schvalování komunitních návrhů subjektů a pracovníků.
8. `team.moderation.reviews` – Moderace recenzí subjektů a institucí.
9. `team.volunteers.view` – Náhled do seznamu aktivních členů týmu/dobrovolníků a jejich vytížení.
10. `team.knowledge.view` – Čtení interní znalostní báze a metodických pokynů.
11. `team.knowledge.edit` – Editace a správa článků znalostní báze.

### 2.2 Maticové mapování Rolí a Oprávnění (Seed Matrix)

| Role | `team.access` | `view_assigned` | `view_all` | `reply` | `assign` | `close` | `mod.subjects` | `mod.reviews` | `volunteers.view` | `knowledge.view` | `knowledge.edit` |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `SUPER_ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `SYSTEM_ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ADMIN` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `CONTENT_MANAGER` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `LEGAL_EDITOR` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `MODERATOR` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `VOLUNTEER` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `VERIFIED_CONTRIBUTOR`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `VERIFIED_USER` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `REGISTERED_USER` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `USER` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.3 Kontrola Vynucování Oprávnění (Enforcement)
- Middleware `requirePermission(permissionKey)` v `src/middleware/authMiddleware.ts` ověřuje oprávnění přímo vůči relační vazbě `RolePermission` v Prisma.
- **Fail-Closed Princip:** Pokud uživatel nemá přiřazenou roli s daným oprávněním nebo databáze neodpoví, middleware vrací striktní `HTTP 403 Forbidden` / `HTTP 500`.
- **MFA Kontrola:** U všech administrativních a spolkových rolí vyžaduje `requireAuth` i `requirePermission` aktivní a ověřené 2FA session tokeny.

---

## 3. Bezpečnost Ticketovacího Systému & Ochrana proti IDOR/BOLA

### 3.1 Mechanismus `verifyTicketAccess`
V `src/routes/teamRoutes.ts` je veškerý přístup k detailům ticketů, zprávám a stavovým změnám zabezpečen centralizovanou kontrolní funkcí `verifyTicketAccess(req, ticketId)`.

**Algoritmus vyhodnocení přístupu:**
1. Ověření existence ticketu v Prisma / in-memory DB (při absenci vrací `404 Ticket nenalezen`).
2. Pokud je uživatel `SUPER_ADMIN`, `SYSTEM_ADMIN` nebo `ADMIN` → **Povoleno** (`canManage: true, canReply: true`).
3. Pokud má uživatel oprávnění `team.tickets.view_all` (např. koordinátor / `MODERATOR`) → **Povoleno** (`canManage: true, canReply: true`).
4. Pokud je ticket přímo přiřazen danému uživateli (`ticket.assignedToId === user.id`) a uživatel má `team.tickets.view_assigned` → **Povoleno** (`canManage: false, canReply: true`).
5. V ostatních případech → **Okamžité zamítnutí s HTTP 403 Forbidden** (`Přístup k tomuto ticketu byl odepřen`).

### 3.2 Ochrana proti BOLA (Broken Object Level Authorization)
- **Přiřazování ticketů (`POST /api/team/tickets/:id/assign`):** Striktně vyžaduje `team.tickets.assign`. Běžný `VOLUNTEER` nemůže manipulovat s přiřazením.
- **Vlastní převzetí ticketu (`POST /api/team/tickets/:id/self-assign`):** Povoleno pouze pro nepřiřazené tickety (`status: OPEN / TRIAGE`, `assignedToId: null`) nebo s oprávněním `team.tickets.assign`.
- **Změna stavu (`POST /api/team/tickets/:id/status`):** Vyžaduje `team.tickets.close` pro uzavření/vyřešení, nebo příslušnost ticketu k uživateli.
- **Izolace Interních Poznámek (`isInternal: true`):**
  - Při odesílání odpovědi z Team Centra lze označit zprávu jako `isInternal: true`.
  - V portálových klientských routách (`/api/portal/tickets/*`) jsou zprávy s `isInternal: true` striktně filtrovány z JSON výstupu pro klienta. Běžný uživatel interní poznámky spolku nikdy neuvidí.

---

## 4. P0 Izolace Citlivých Klientských Dat (Case / Legal Isolation)

### 4.1 Architektonická Izolace
Byla provedena prověrka všech endpointů a služeb Team Centra vůči klientským právním spisům:
- **Žádný endpoint v `/api/team/*` nepřistupuje k tabulkám:**
  - `Case` (Opatrovnické a rodinné případy)
  - `CaseDocument` (Soudní podání, důkazy, znalecké posudky)
  - `Judgment` (Rozsudky a citlivá data ze spisů)
  - `IncidentRecord` (Záznamy o incidentech při předávání dětí)
- **Klientský modul `caseRoutes.ts`:**
  - Zůstává striktně chráněn přes `ClientCaseService.authorizeCaseAccess(userId, caseId)`.
  - Přístup ke spisu má výhradně vlastník spisu nebo explicitně pověřený právní zástupce.
  - Role `VOLUNTEER`, `MODERATOR`, `CONTENT_MANAGER` nemají žádný bypass mechanismus do klientských spisů.

---

## 5. Administrativní Hranice & Ochrana Infrastruktury

### 5.1 Striktní izolace systémových modulů
Spolkové role v Team Centru nemají přístup k citlivé infrastruktuře:
- **VPS Správa (`/api/admin/vps/*`):** Vyžaduje striktně roli `SUPER_ADMIN`.
- **Git / GitHub Publisher (`/api/admin/publisher/*`):** Vyžaduje striktně roli `SUPER_ADMIN`.
- **Mailcow & DNS Server konfigurace:** Přístupné pouze pro `SUPER_ADMIN`.
- **Systémové auditní logy (`/api/admin/audits/*`):** Vyžaduje `system.logs` / `ADMIN`.

---

## 6. Hybridní Navigační a UI Architektura

### 6.1 Architektura Přístupových Bodů
Modul Team Center je navržen v hybridním modelu:
1. **Dedikovaný pohled `/team`:**
   - Plnohodnotný pracovní dashboard pro dobrovolníky a tým spolku.
   - V `src/App.tsx` je routa `/team` a `/spolek` mapována na `currentView === 'team'`.
   - V `src/components/Header.tsx` je v přepínači vrstev (Layer Switcher) zobrazeno tlačítko `Team` pro oprávněné role (`isAuthorizedTeam`).
   - V mobilním menu a uživatelském dropdownu je přítomen odkaz `Team Center (Spolek)`.
2. **Integrovaný Admin Shell Slot (`/administrace?tab=team-center`):**
   - Komponenta `TeamCenterSlot.tsx` vkládá `TeamCenterDashboard` s parametrem `isEmbedded={true}` přímo do administrativního rozhraní sekce 8.
   - Administrátoři tak mají plynulý přístup k týmové agendě bez nutnosti opustit CMS.

---

## 7. Kompletní Inventář API Endpointů & Bezpečnostní Matice

| Metoda | Endpoint | Vyžadované Oprávnění | IDOR Ochrana | Audit Log |
|---|---|---|:---:|:---:|
| `GET` | `/api/team/stats` | `team.access` | Filtrováno dle role/přiřazení | ❌ (read) |
| `GET` | `/api/team/tickets/assigned` | `team.tickets.view_assigned` | Striktní `where: { assignedToId: user.id }` | ❌ (read) |
| `GET` | `/api/team/tickets/triage` | `team.tickets.assign` / `view_all` | Pouze nepřiřazené tickety | ❌ (read) |
| `GET` | `/api/team/tickets/all` | `team.tickets.view_all` | Globální výpis s filtry | ❌ (read) |
| `GET` | `/api/team/tickets/:id` | `team.access` | `verifyTicketAccess` | ❌ (read) |
| `POST` | `/api/team/tickets/:id/assign` | `team.tickets.assign` | `verifyTicketAccess` | ✅ `TICKET_ASSIGN` |
| `POST` | `/api/team/tickets/:id/self-assign` | `team.tickets.view_assigned` | `verifyTicketAccess` + unassigned check | ✅ `TICKET_SELF_ASSIGN` |
| `POST` | `/api/team/tickets/:id/reply` | `team.tickets.reply` | `verifyTicketAccess` | ✅ `TICKET_REPLY` / `NOTE` |
| `POST` | `/api/team/tickets/:id/status` | `team.tickets.close` / `reply` | `verifyTicketAccess` | ✅ `TICKET_STATUS_CHANGE` |
| `GET` | `/api/team/volunteers` | `team.volunteers.view` | Agregace bez hesel a PII | ❌ (read) |
| `GET` | `/api/team/knowledge` | `team.knowledge.view` | Veřejné a interní návody | ❌ (read) |
| `POST` | `/api/team/knowledge` | `team.knowledge.edit` | Validace vstupů | ✅ `KNOWLEDGE_CREATE` |

---

## 8. Dohledatelnost & Auditní Stopa (Auditability)

Všechny mutační operace v Team Centru generují záznam v `AuditLog`:
- **Přiřazení ticketu:** Zaznamenává ID ticketu, přiřazeného uživatele a identitu koordinátora.
- **Odeslání odpovědi / Interní poznámky:** Zaznamenává autora, ID ticketu a příznak `isInternal`.
- **Změna stavu ticketu:** Zaznamenává předchozí a nový stav (`RESOLVED`, `CLOSED`, `IN_PROGRESS`).

---

## 9. Výsledky Testů & Verifikace Kvality Kódu

### 9.1 Automatizovaná Testovací Sada (`npm test`)
Spuštěno **18 testovacích sad** prostřednictvím `scripts/test-runner.js`:
1. Static & Security Integrity (`test/main.test.cjs`) → **PASS**
2. Security & Audit Integrations (`run_security_tests.cjs`) → **PASS**
3. State Administration API Hub (`tests/state-admin-p1-p2.test.js`) → **PASS**
4. Mapa Subjektů & Registr Integration (`scripts/test-mapa-subjektu.cjs`) → **PASS**
5. Judgment AI Extractor -> Case Persistence (`tests/judgment-case-sync.test.ts`) → **PASS**
6. Care Occurrence Engine & Calendar Integration (`tests/care-occurrence-engine.test.ts`) → **PASS**
7. AI Extractor Local PDF Fallback (20 Tests) (`tests/judgment-ai-extractor-fallback.test.ts`) → **PASS**
8. Branding API & Secure SVG Sanitization (`tests/branding-and-svg.test.ts`) → **PASS**
9. Branding API Integration (`tests/branding-api.test.ts`) → **PASS**
10. Prisma Fail-Closed Security & Read-Only Fallback (`tests/prisma-fail-closed.test.ts`) → **PASS**
11. Analytics 2.0 (Zero-PII) (`tests/analytics-2-user-journey.test.ts`) → **PASS**
12. AI Provider Consistency & Failover (`tests/ai-provider-consistency.test.ts`) → **PASS**
13. AI Forms Source Fidelity (`tests/p0-2-1-ai-forms-source-fidelity.test.ts`) → **PASS**
14. AI Provider Model Compatibility (`tests/p0-2-3-model-compatibility.test.ts`) → **PASS**
15. Navigation Consolidation & Visibility Phase 02 (`tests/navigation-consolidation-phase02.test.ts`) → **PASS**
16. Admin Shell Information Architecture Phase 03B (`tests/admin-shell-phase03b.test.ts`) → **PASS**
17. Admin Shell Cleanup & Deep-Linking Phase 03C (`tests/admin-shell-phase03c.test.ts`) → **PASS**
18. **Team Center Foundation & Granular RBAC Phase 04C (`tests/team-center-phase04c.test.ts`)** → **PASS (6/6 subtests)**

**Celkový výsledek testovací sady: 100% PASS (0 failures, 0 regressions).**

### 9.2 TypeScript Kontrola Typů (`npm run lint` / `tsc --noEmit`)
- Výsledek: **0 errors, 0 warnings**.

### 9.3 Build Kontrola (`compile_applet`)
- Výsledek: **Build succeeded - the applet is compiled**.

---

## 10. Závěrečné Zhodnocení & Definition of Done

| Kritérium | Požadavek | Stav | Poznámka |
|---|---|:---:|---|
| **Granulární RBAC** | 11 `team.*` oprávnění navázaných na role | ✅ PASS | Ověřeno v seedService i middleware |
| **Least Privilege** | VOLUNTEER nemá přístup k systémovým nástrojům | ✅ PASS | Striktně omezeno na přiřazené tickety |
| **IDOR / BOLA Ochrana** | Kontrola vlastnictví a přiřazení ticketu | ✅ PASS | Vynuceno přes `verifyTicketAccess` |
| **Data Isolation (P0)** | Žádný přístup k Case/Judgment datům | ✅ PASS | Fyzicky i logicky odděleno |
| **Admin Boundary** | Ochrana VPS, DNS, Mailcow, Publisher | ✅ PASS | Vyhrazeno pro SUPER_ADMIN |
| **Hybridní UI** | Standalone `/team` + Admin Slot | ✅ PASS | Plně funkční a responsivní |
| **Kvalita Kódu & Testy**| 100% úspěšnost testů a nulové chyby typování | ✅ PASS | Všechny testy zelené |
| **Auditní Zpráva** | Kompletní zdokumentování v `docs/audit/` | ✅ PASS | Uloženo |

**Závěr:** Fáze **PHASE 04D (Final Security, RBAC & Integration Audit)** byla úspěšně dokončena. Modul Team Center splňuje veškeré bezpečnostní, architektonické a integrační požadavky.
