# PHASE 04A: TEAM CENTER & SPOLEK RBAC DISCOVERY AUDIT

- **Datum a čas auditu:** 2026-08-26 16:25 UTC (18:25 SELČ)
- **Projekt:** Táta má právo (`dev3`)
- **Prostředí:** DEV3 (`https://dev3.tatovacesta.cz`) / plná kompatibilita s PROD3
- **Větev:** `feature/auth-session-consistency`
- **Režim:** **STRICT READ-ONLY DISCOVERY** (Žádné změny kódu, DB ani schématu)
- **Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor projektu
- **Priorita:** P0 (Bezpečnost, integrita dat, ochrana soukromí dětí a rodin, fail-closed RBAC)
- **Výsledek fáze 04A:** **PHASE 04A CHECKPOINT: PASS**

---

## 1. EXECUTIVNÍ SHRNUTÍ & CÍL DISCOVERY FÁZE

Fáze **PHASE 04A** navazuje na úspěšně dokončené a integrované fáze 00–03D (veřejná navigace a Admin Shell). Cílem této fáze je provést hloubkový architektonický, bezpečnostní a datový audit se zaměřením na:
1. **Analýzu stávajícího RBAC subsystému** (Prisma modely, hierarchie rolí, middlewary).
2. **Inventarizaci existujících funkcí portálu relevantních pro tým, spolek a dobrovolníky.**
3. **Přesné vymezení hranic** mezi `USER`, `TEAM (Spolek / Dobrovolník / Poradce)`, `ADMIN` a `SUPER_ADMIN`.
4. **Ochranu citlivých osobních a opatrovnických údajů** (GDPR, data dětí, rozsudky, finance, klientské spisy).
5. **Návrh budoucí architektury Team Centeru a modelu oprávnění spolku** bez předčasné implementace.

---

## 2. AUDIT EXISTUJÍCÍHO STAVU (AS-IS)

### 2.1 Prisma Schema & RBAC Modely
V databázovém schématu (`prisma/schema.prisma`) jsou v současnosti definovány následující komponenty pro řízení identit a oprávnění:

1. **Enum `UserRoleType`** (11 hodnot):
   - `USER`, `VOLUNTEER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`, `SYSTEM_ADMIN`, `CONTENT_MANAGER`, `LEGAL_EDITOR`, `VERIFIED_CONTRIBUTOR`, `REGISTERED_USER`, `VERIFIED_USER`.
2. **Model `Role`** (Dynamická tabulka v PostgreSQL s unikátním klíčem `key` a příznakem `requiresMfa`):
   - Inicializováno v `seedService.ts` s 11 rolemi:
     - `SUPER_ADMIN` (P0, MFA: true, plný systémový přístup)
     - `SYSTEM_ADMIN` (P1, MFA: true, správa systému a logy)
     - `ADMIN` (P1, MFA: true, správa obsahu, uživatelů a nastavení)
     - `CONTENT_MANAGER` (P2, MFA: true, CMS a články)
     - `LEGAL_EDITOR` (P2, MFA: true, úprava a verzování právních dokumentů)
     - `MODERATOR` (P2, MFA: true, moderace subjektů a kontaktů)
     - `VOLUNTEER` (P3, MFA: false, mentoring a pomoc)
     - `VERIFIED_CONTRIBUTOR` (P3, MFA: false, ověřený přispěvatel)
     - `VERIFIED_USER` (P4, MFA: false, ověřený registrovaný uživatel)
     - `REGISTERED_USER` (P4, MFA: false, registrovaný uživatel)
     - `USER` (P4, MFA: false, výchozí role)
3. **Model `Permission`** (Dynamická tabulka v PostgreSQL s unikátním klíčem `key`, názvem a kategorií):
   - Inicializováno v `seedService.ts` s 6 systémovými oprávněními:
     - `users.manage` (Kategorie AUTH: Změny rolí a správa účtů)
     - `content.publish` (Kategorie CMS: Vytváření a úprava stránek/článků)
     - `legal.edit` (Kategorie COMPLIANCE: Verzování právních dokumentů)
     - `system.logs` (Kategorie SYSTEM: Technické logy a stav)
     - `moderator.moderate` (Kategorie MODERATION: Moderování komunitního obsahu)
     - `system.github.publish` (Kategorie SYSTEM: Publikování do GitHubu)
4. **M:N Vazební modely:**
   - `RolePermission` (Propojení role a oprávnění s unikátním indexem `[roleId, permissionId]`)
   - `UserRole` (Přiřazení dynamických rolí uživateli s unikátním indexem `[userId, roleId]`)
   - `ModulePermission` (Oprávnění na úrovni dynamických modulů)

### 2.2 Autorizační Middleware & Logika Ověřování
V projektu koexistují dva autorizační mechanismy:
1. **Hierarchická kontrola rolí (`requireRole(minRole)`):**
   - V `src/services/authService.ts` metoda `hasPermission`:
     - Úroveň 1: `USER`, `REGISTERED_USER`
     - Úroveň 2: `VERIFIED_USER`
     - Úroveň 3: `VOLUNTEER`, `VERIFIED_CONTRIBUTOR`
     - Úroveň 4: `MODERATOR`, `LEGAL_EDITOR`, `CONTENT_MANAGER`
     - Úroveň 5: `ADMIN`, `SYSTEM_ADMIN`
     - Úroveň 6: `SUPER_ADMIN`
   - **Limitace:** Hierarchický model předpokládá, že vyšší role automaticky dědí všechna práva nižších rolí. To je nevhodné pro specializované týmové role (např. dobrovolník mentor nesmí mít práva moderátora registru, a naopak).
2. **Granulární kontrola oprávnění (`requirePermission(permissionKey)`):**
   - V `src/middleware/authMiddleware.ts`:
     - Kontroluje vazbu `rolePermission` v DB.
     - `SUPER_ADMIN` má automatický bypass.
     - Zabezpečeno proti výpadku DB striktním **fail-closed** mechanismem (ověřeno v auditu PR #10).
3. **Ochrana spisů a klientských dat (`ClientCaseService.authorizeCaseAccess`):**
   - Spis smí otevřít pouze jeho vlastník (`ownerId === user.id`) nebo uživatel s rolí `ADMIN`/`SUPER_ADMIN`/`SYSTEM_ADMIN`.
   - Běžní dobrovolníci ani moderátoři klientské spisy **nemohou otevřít** (fail-closed).

---

## 3. ROZDÍL MEZI STAVY: EXISTUJE / PŘIPRAVENO / PLÁNOVÁNO

| Oblast / Funkcionalita | Stav | Popis a technická realizace |
|---|---|---|
| **Uživatelská podpora (Tikety)** | **EXISTUJE** | `SupportTicket`, `SupportTicketMessage`, `/api/portal/tickets`. Uživatel vytváří tiket, admin odpovídá. Podpora interních zpráv (`isInternal`). |
| **Registrace dobrovolníka & Kodex** | **EXISTUJE** | `VolunteerApplication`, `VolunteerCodexAgreement`, `/api/volunteers`, `/api/compliance/volunteer-agreement/sign`, `/api/compliance/volunteer-codex/sign`. Elektronický podpis dohody a kodexu. |
| **Moderace subjektů a kontaktů** | **EXISTUJE** | `Subjekt`, `Pracovnik`, `Review`, fronta `/api/subjekty/queue/pending`, `/api/pracovnici/pending`, schvalování a zamítání s důvodem. |
| **RBAC Schéma & Fail-Closed Middlewary** | **EXISTUJE** | Modely `Role`, `Permission`, `RolePermission`, `UserRole`, middleware `requireRole`, `requirePermission`. |
| **Admin Shell Sekce 8 Slot** | **PŘIPRAVENO** | Komponenta `TeamCenterSlot.tsx`, routa `/admin/team-center`, záložka v `adminNavigation.ts` se stavem „Připravováno pro Fázi 4“. |
| **Týmové role v DB & Enumu** | **PŘIPRAVENO** | Role `VOLUNTEER`, `MODERATOR`, `LEGAL_EDITOR`, `CONTENT_MANAGER` existují v enumu a tabulce `Role`, ale chybí jim dedikované rozhraní a granulární permissions. |
| **Třídění tiketů dobrovolníky (Triage)** | **PŘIPRAVENO** | Backend `/api/portal/tickets` podporuje interní zprávy, ale vyžaduje roli `ADMIN` pro zobrazení cizích tiketů. Dobrovolník zatím nemá přístup. |
| **Dedikovaný Team Center Dashboard** | **PLÁNOVÁNO** | Samostatné rozhraní pro členy spolku, koordinátory a dobrovolníky oddělené od technické administrace. |
| **Delegování případů & Klientský souhlas** | **PLÁNOVÁNO** | Explicitní přidělení spisu dobrovolníkovi/mentorovi na základě žádosti a souhlasu klienta s časovým omezením a detailním auditním logem. |
| **Granulární Spolek Permissions** | **PLÁNOVÁNO** | `team.tickets.view`, `team.tickets.reply`, `team.moderation.review`, `team.cases.assigned_read`, `team.cases.assigned_note`, `team.volunteers.coordinate`. |
| **Specializované role spolku** | **PLÁNOVÁNO** | `SPOLEK_COORDINATOR`, `PEER_MENTOR`, `LEGAL_ADVISOR`, `SPOLEK_MEMBER`. |

---

## 4. MAPOVÁNÍ: ROLE → PERMISSIONS → FUNKCE → ROUTY/API → DATA

```
+---------------------------------------------------------------------------------------------------+
| 1. BĚŽNÝ UŽIVATEL (USER / REGISTERED_USER / VERIFIED_USER)                                        |
| Permissions: (Základní profil & vlastní data)                                                     |
| Funkce: Správa vlastního spisu, kalkulačky, generátor podání, odesílání tiketů, recenze        |
| API: /api/cases (vlastní), /api/portal/tickets (vlastní), /api/subjekty/submit, /api/user/*       |
| Data: UserProfile, UserCase, Case (ownerId = user.id), CoParentSpace (member)                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 2. TÝM SPOLKU & DOBROVOLNÍCI (VOLUNTEER / MODERATOR / SPOLEK_*)                                  |
| Permissions: moderator.moderate, team.tickets.reply, team.cases.assigned_read (plánováno)         |
| Funkce:                                                                                           |
|  - VOLUNTEER / PEER MENTOR: Odpovídání na přidělené tikety, peer podpora, interní poznámky        |
|  - MODERATOR: Schvalování/zamítání institucí a pracovníků, moderace recenzí a fóra                |
|  - SPOLEK_COORDINATOR: Třídění tiketů, přidělování mentorů, přehled dobrovolnických dohod         |
| API:                                                                                              |
|  - /api/subjekty/queue/pending, /api/subjekty/:id/approve, /api/pracovnici/:id/status             |
|  - /api/portal/tickets (týmový přístup s filtrem), /api/volunteers (přehled žádostí)             |
| Data: SupportTicket, Subjekt (PENDING), Pracovnik (PENDING), Review, VolunteerApplication         |
| KRITICKÉ: ŽÁDNÝ PŘÍSTUP K NEASSIGNED SPISŮM, FINANCÍM ANI SYSTÉMOVÝM LOGŮM!                     |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 3. ADMINISTRÁTOR (ADMIN / CONTENT_MANAGER / LEGAL_EDITOR)                                         |
| Permissions: users.manage, content.publish, legal.edit, system.logs                               |
| Funkce: Kompletní CMS, správa uživatelů, reset hesel, správa e-Sbírky a státních dat, audit logy |
| API: /api/admin/users, /api/admin/pages, /api/admin/cms, /api/admin/esbirka, /api/admin/audits   |
| Data: User, Role, Page, Article, Law, LegalAct, SystemSetting, AuditLog                           |
| OMEZENÍ: Nemá přístup k VPS, DNS, destruktivním systémovým zásahům ani GitHub publisheru.        |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
| 4. SUPER ADMINISTRÁTOR (SUPER_ADMIN / SYSTEM_ADMIN)                                               |
| Permissions: system.github.publish + VŠECHNA OPRÁVNĚNÍ (Bypass)                                   |
| Funkce: Kompletní správa infrastruktury, VPS Docker kontejnery, Vercel DNS, GitHub Publisher,    |
|         Mailcow server, bezpečnostní audity, nouzový přístup.                                     |
| API: /api/admin/vps/*, /api/admin/dns/*, /api/admin/github/*, /api/admin/mailcow/*               |
| Data: Kompletní DB, systémové konfigurace, certifikáty, šifrovací klíče                          |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. ARCHITEKTONICKÉ HRANICE: USER vs. TEAM vs. ADMIN vs. SUPER_ADMIN

| Kritérium | USER | TEAM (Spolek / Dobrovolník) | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|
| **Primární rozhraní** | Veřejný portál, Klientská zóna (`/muj-pripad`, `/profil`) | **Team Center** (`/team` nebo `/admin/team-center`) | **Admin Shell** (Sekce 1–7) | **Admin Shell** (Všechny sekce + VPS/GitHub) |
| **Přístup k osobním spisům** | Výhradně VLASTNÍ spisy | **Pouze explicitně PŘIDĚLENÉ** klientské případy (s prokazatelným souhlasem) | Pouze v rámci technické podpory a autorizovaného zásahu | Plný v rámci krizového řízení a obnovy |
| **Správa uživatelů & hesel** | ❌ Žádná | ❌ Žádná (nemůže měnit cizí role ani hesla) | ✅ Změna rolí, reset hesel, blokace účtů | ✅ Plná včetně správy administrátorů |
| **Moderace obsahu a dat** | ❌ Pouze navrhování | ✅ Schvalování kontaktů, subjektů, recenzí | ✅ Plná správa CMS, článků, Puck stránek | ✅ Plná správa |
| **Infrastruktura & DevSecOps**| ❌ Žádný | ❌ Žádný | ❌ Žádný | ✅ Správa VPS, Vercel DNS, Mailcow, GitHub Publisher |
| **Auditní stopa** | Uživatelské akce | Záznam každého otevření cizího tiketu/spisu | Záznam všech administrativních zásahů | Kompletní bezpečnostní audit |

---

## 6. NÁVRH BUDOUCÍCH ROLÍ SPOLKU & LEAST-PRIVILEGE PERMISSIONS (NÁVRH / PROPOSAL ONLY)

> [!IMPORTANT]
> **Tento návrh slouží výhradně jako architektonický podklad pro budoucí Fázi 04B. Nic z následujícího NENÍ v této fázi implementováno do kódu ani DB.**

### 6.1 Navržené specializované role
1. `ROLE_SPOLEK_COORDINATOR` (Koordinátor spolku & případů):
   - Koordinuje dobrovolníky, přiřazuje tickety a žádosti o pomoc, kontroluje status dobrovolnických dohod a kodexů.
2. `ROLE_PEER_MENTOR` (Krizový poradce / Peer mentor):
   - Zkušený dobrovolník poskytující podporu v krizových situacích otců a rodin. Má přístup výhradně k jemu přiděleným tiketům a zprávám.
3. `ROLE_LEGAL_ADVISOR` (Právní poradce / Právní konzultant spolku):
   - Odborník připravující vzory podání a posuzující legislativní vývoj. Má přístup k právním podkladům a anonymizovaným dotazům.
4. `ROLE_SPOLEK_MEMBER` (Řadový člen spolku / Aktivní přispěvatel):
   - Člen spolku s přístupem k interní znalostní bázi a diskuzím.

### 6.2 Navržená granulární oprávnění (Least Privilege)
- `team.tickets.view_assigned`: Zobrazení tiketů přidělených danému dobrovolníkovi.
- `team.tickets.triage`: Možnost prohlížet nepřiřazené tikety a přidělovat je mentorům.
- `team.tickets.reply_internal`: Vkládání interních poznámek k tiketu.
- `team.moderation.subjects`: Schvalování a zamítání nově vložených institucí a pracovníků.
- `team.moderation.reviews`: Schvalování a mazání nevhodných recenzí.
- `team.volunteers.view_agreements`: Přehled podepsaných dohod a kodexů dobrovolníků.
- `team.knowledge.edit`: Tvorba a editace interních metodických pokynů a návodů.

---

## 7. ARCHITEKTURA TEAM CENTER & UMÍSTĚNÍ V NAVIGACI

### 7.1 Umístění v navigaci
- **Pro běžné uživatele:** Team Center je v navigaci zcela neviditelný.
- **Pro členy týmu (s rolí `VOLUNTEER`, `MODERATOR`, `SPOLEK_*`):**
  - V hlavním `Header.tsx` se v uživatelském menu (nebo horní liště) zobrazí odkaz **„Team Center“** směřující na `/team` (nebo `/admin/team-center`).
- **Pro administrátory:**
  - V Admin Shellu je Team Center přímo dostupný v **Sekci 8 (`sec-team` / `TeamCenterSlot.tsx`)**.

### 7.2 Modulární struktura Team Centeru (Návrh pro Fázi 04B)
1. 📋 **Dashboard přehledu:** Souhrn čekajících úkolů, otevřené tikety, nové žádosti o dobrovolnictví.
2. 🎫 **Triage & Moje tikety:**
   - Záložka „Přiděleno mně“ (tikety řešené přihlášeným mentorem).
   - Záložka „Fronta k přidělení“ (pro koordinátora).
3. ⚖️ **Moderační centrum:** Schvalování institucí, pracovníků OSPOD/soudů a recenzí.
4. 🤝 **Dobrovolnická síť:** Přehled aktivních dobrovolníků, platnost dohod a kodexů.
5. 📚 **Znalostní báze spolku:** Metodiky pomoci, právní manuály, postupy krizové intervence.

---

## 8. FUNKCE, KTERÉ MUSÍ ZŮSTAT STRICT ADMIN / SUPER_ADMIN ONLY (P0)

Následující funkce **NESMÍ** být za žádných okolností přístupné z Team Centeru ani uživatelům s týmovou rolí:
1. 🔒 **Správa uživatelských účtů & rolí (`UserManager.tsx` / `/api/admin/users`):**
   - Změny rolí na `ADMIN` / `SUPER_ADMIN`.
   - Vynucené resety hesel a generování přihlašovacích odkazů.
   - Správa 2FA/MFA tajemství a bezpečnostních klíčů.
2. 🖥️ **Správa infrastruktury & VPS (`VpsManagement.tsx` / `/api/admin/vps/*`):**
   - Restartování docker kontejnerů, čtení systémových env souborů, správa disků a paměti.
3. 🌐 **Správa DNS & Vercel domén (`DnsManagementPage.tsx` / `/api/admin/dns/*`):**
   - Změny A/CNAME/MX záznamů domény `tatovacesta.cz`.
4. 🐙 **GitHub Publisher (`GitHubPublisher.tsx` / `/api/admin/github/*`):**
   - Přímé verzování a pushování zdrojového kódu do Git repozitáře.
5. 📧 **Správa poštovního serveru Mailcow (`MailcowManager.tsx` / `/api/admin/mailcow/*`):**
   - Vytváření schránek a DKIM/SPF klíčů.
6. 📜 **Správa auditních systémových logů (`AuditLogViewer.tsx` / `AuditCenter.tsx`):**
   - Globální přístup k bezpečnostním logům a systémovým vývojářským reportům.

---

## 9. ANALÝZA OCHRANY OSOBNÍCH A CITLIVÝCH ÚDAJŮ (GDPR & PII)

Data zpracovávaná portálem „Táta má právo“ obsahují nejcitlivější kategorii rodinných a právních informací:
- Jména dětí, data narození, školy, lékaři (`UserChild`, `Child`).
- Opatrovnické rozsudky, výroky o svěření do péče, výše výživného (`Judgment`, `FinancialObligation`, `JudgmentSentence`).
- Záznamy o konfliktech, důkazní materiály, audio nahrávky (`CaseEvidence`, `CaseNote`, `CaseDocument`).
- Kalendáře předávání dětí a osobní adresy rodičů (`CarePlan`, `CareLocation`, `CoParentHandover`).

### 9.1 Bezpečnostní zásady pro Team Center:
1. **Zákaz plošného náhledu do spisů:** Žádný člen týmu ani dobrovolník nesmí mít univerzální přístup k procházení klientských spisů.
2. **Explicitní klientský souhlas:** Přístup mentora k jakémukoliv klientskému údaji musí být vyvolán uživatelem (např. žádostí o asistenci s formulářem) a musí být časově limitován.
3. **Auditní logování přístupů:** Každé zobrazení detailu cizího případu nebo tiketu musí vytvořit neměnný záznam v `SensitiveAccessLog` s identifikátorem mentora, časem a důvodem.
4. **Anonymizace v exportech a statistikách:** Veškeré agregované výstupy pro spolek musí být striktně 0-PII.

---

## 10. NÁVRH BEZPEČNÉHO MIGRAČNÍHO PLÁNU PRO IMPLEMENTACI (FAZE 04B+)

Implementace Team Centeru musí proběhnout v kontrolovaných, malých a testovatelných krocích bez narušení stability existujícího systému:

1. **Krok 1 (Fáze 04B – Datový a autorizační model):**
   - Příprava nových oprávnění v `Permission` a `RolePermission`.
   - Úprava `authMiddleware.ts` pro podporu týmových rolí bez porušení fail-closed pravidel.
   - Doplnění vazby `assignedToId` u modelu `SupportTicket` pro bezpečné přiřazení mentora.
2. **Krok 2 (Fáze 04C – Backendové API pro Team Center):**
   - Vytvoření bezpečných routerů `/api/team/tickets`, `/api/team/moderation`, `/api/team/volunteers`.
   - Zavedení `requirePermission` a auditování citlivých dotazů.
3. **Krok 3 (Fáze 04D – Frontend Team Center Shell):**
   - Vytvoření komponenty `TeamCenterDashboard.tsx` a její napojení na slot v Sekci 8 Admin Shellu i klientskou navigaci.
   - Implementace moderačního panelu a nástrojů pro tikety.
4. **Krok 4 (Fáze 04E – QA, E2E testy a závěrečný integrační audit):**
   - Unit testy RBAC oprávnění, IDOR/BOLA penetrační testy pro tikety, verifikace produkčního buildu.

---

## 11. KLASIFIKACE NÁLEZŮ (P0 / P1 / P2 / P3)

- **P0 (Kritická bezpečnostní / datová rizika):** **0 nalezeno** (Stávající systém je bezpečně chráněn na serveru, klientské spisy jsou striktně izolovány na úroveň vlastníka a administrátora).
- **P1 (Architektonické překážky pro týmovou práci):** **1 zjištěno** (Současný `SupportTicket` nepodporuje bezpečné přiřazení konkrétnímu dobrovolníkovi – cizí tikety vidí pouze `ADMIN`/`SUPER_ADMIN`. Bude vyřešeno v Fázi 04B).
- **P2 (Hierarchická limitace rolí):** **1 zjištěno** (Jednorozměrná hierarchie `hasPermission` v `authService.ts` 1–6 neumožňuje oddělit práva moderátora od práv mentora. Bude vyřešeno přechodem na granulární `requirePermission`).
- **P3 (UX a navigace):** **0 nalezeno** (Architektonický slot Sekce 8 v Admin Shellu je připraven).

---

## 12. PŘEHLED METRIK DISCOVERY

- **Počet existujících rolí v schématu / enumu:** `11`
- **Počet existujících inicializovaných oprávnění:** `6`
- **Počet existujících relevantních týmových domén:** `7`
- **Počet navržených budoucích specializovaných rolí spolku:** `4` (`SPOLEK_COORDINATOR`, `PEER_MENTOR`, `LEGAL_ADVISOR`, `SPOLEK_MEMBER`)
- **Počet navržených budoucích týmových oprávnění:** `7`

---

## 13. ZÁVĚREČNÝ CHECKPOINT

**PHASE 04A CHECKPOINT: PASS**  
Discovery audit týmového subsystému a RBAC modelu byl úspěšně dokončen v plně read-only režimu. Repozitář zůstává ve stabilním stavu bez jakýchkoliv neautorizovaných změn zdrojového kódu.
