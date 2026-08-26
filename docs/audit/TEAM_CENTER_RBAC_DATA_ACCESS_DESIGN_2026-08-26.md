# PHASE 04B: TEAM CENTER RBAC & DATA ACCESS DESIGN AUDIT

- **Datum a čas auditu:** 2026-08-26 16:30 UTC (18:30 SELČ)
- **Projekt:** Táta má právo (`dev3`)
- **Prostředí:** DEV3 (`https://dev3.tatovacesta.cz`) / plná kompatibilita s PROD3
- **Větev:** `feature/auth-session-consistency`
- **Režim:** **STRICT READ-ONLY ARCHITECTURE & DESIGN** (Žádné změny kódu, DB ani schématu)
- **Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor projektu
- **Priorita:** P0 (Bezpečnost, integrita dat, ochrana soukromí dětí a rodin, fail-closed RBAC)
- **Výsledek fáze 04B:** **PHASE 04B CHECKPOINT: PASS**

---

## 1. EXECUTIVNÍ SHRNUTÍ & CÍL ARCHITEKTONICKÉHO NÁVRHU

Tento dokument představuje **definitivní architektonický, bezpečnostní a datový design** pro subsystém **Team Center** (spolkové centrum pomoci a koordinace) a navazující model oprávnění (RBAC) pro projekt „Táta má právo“.

Design vychází z poznatků discovery fáze **PHASE 04A** a řeší klíčové architektonické výzvy:
1. **Přechod od rigidní jednorozměrné číselné hierarchie rolí (1–6) k operativnímu, granulárnímu modelu oprávnění (Least Privilege).**
2. **Přísné oddělení klientských spisů a citlivých rodinných dat od týmové a spolkové práce.**
3. **Architektonické řešení tiketovacího systému s podporou bezpečného přiřazení (assignment), fronty triage a ochrany proti IDOR/BOLA.**
4. **Neprostupná bezpečnostní hranice mezi Team Centerem a technickou administrací (VPS, DNS, Mailcow, GitHub Publisher, správa uživatelů).**
5. **Ergonomické začlenění Team Centeru do navigace pro členy týmu i administrátory (Hybridní model).**

---

## 2. AUDIT A HODNOCENÍ EXISTUJÍCÍCH 11 ROLÍ (AS-IS)

V následující tabulce je detailně vyhodnoceno všech 11 současných rolí definovaných v `UserRoleType` a tabulce `Role`:

| Role | Účel & Skutečné funkce | Současná oprávnění | Rizika | Status & Doporučení |
|---|---|---|---|---|
| **`SUPER_ADMIN`** | Hlavní správce infrastruktury, DevSecOps, nasazení, VPS, DNS, GitHub Publisher, Mailcow, nouzová obnova. | Všechna systémová oprávnění (`*`), bypass všech kontrol. | P0 riziko: Zneužití může způsobit pád celého serveru nebo únik dat. | **ZŮSTANE / BEZE ZMĚNY**. Vyžaduje MFA. Žádný tým ani běžný admin do této role nesmí vstoupit. |
| **`SYSTEM_ADMIN`** | Technický správce systémových modulů, sledování logů, databázové diagnostiky. | `system.logs`, úroveň 5 v `hasPermission`. | Riziko neoprávněného čtení technických logů. | **ZŮSTANE / BEZE ZMĚNY**. |
| **`ADMIN`** | Provozní správce portálu, správa CMS, uživatelských účtů, reset hesel, správa e-Sbírky a státních dat. | `users.manage`, `content.publish`, `legal.edit`, `system.logs`. | Možnost eskalace rolí (změna cizí role na ADMIN). | **ZŮSTANE / BEZE ZMĚNY**. Vyžaduje MFA. Omezeno od VPS a GitHub Publisheru. |
| **`CONTENT_MANAGER`** | Redaktor obsahu, správa blogových článků, médií, FAQ a Puck šablon. | `content.publish`, úroveň 4 v `hasPermission`. | Riziko publikování neautorizovaného obsahu na veřejný web. | **ZŮSTANE / KONSOLIDOVAT**. Vhodné pro redakční tým spolku. |
| **`LEGAL_EDITOR`** | Právní editor, verzování právních dokumentů (Podmínky, Kodex, GDPR) a právních průvodců. | `legal.edit`, úroveň 4 v `hasPermission`. | Riziko změny právních textů bez schválení vedením spolku. | **ZŮSTANE / KONSOLIDOVAT**. Integrovat do právního modulu Team Centeru. |
| **`MODERATOR`** | Moderátor komunitního obsahu, schvalování institucí v registru, pracovníků OSPOD/soudů a recenzí. | `moderator.moderate`, úroveň 4 v `hasPermission`. | Riziko neoprávněného schválení podvodného subjektu nebo smazání oprávněné recenze. | **ZŮSTANE / ROZŠÍŘIT**. Klíčová týmová role pro Team Center. |
| **`VOLUNTEER`** | Registrovaný dobrovolník spolku, který podepsal dohodu a kodex. Poskytuje peer podporu. | Úroveň 3 v `hasPermission`, bez implicitních admin permissions. | Riziko předpokladu, že dobrovolník může vidět cizí klientská data bez přiřazení. | **ZŮSTANE / ZPŘESNIT**. Základní týmová role s přístupem do Team Centeru (pouze na přiřazené úkoly). |
| **`VERIFIED_CONTRIBUTOR`**| Ověřený externí přispěvatel (např. autor odborného článku, spolupracující advokát). | Úroveň 3 v `hasPermission`. | Nízké riziko, minimální využití. | **ZŮSTANE (Legacy)**. Nepoužívat pro interní role spolku. |
| **`VERIFIED_USER`** | Uživatel s ověřenou identitou (např. přes BankID nebo e-mail). | Úroveň 2 v `hasPermission`. | Nízké riziko. | **ZŮSTANE**. Klientská vrstva. |
| **`REGISTERED_USER`** | Standardní registrovaný uživatel po potvrzení e-mailu. | Úroveň 1 v `hasPermission`. | Nízké riziko. | **ZŮSTANE**. Klientská vrstva. |
| **`USER`** | Výchozí anonymní / nově registrovaný uživatel. | Úroveň 1 v `hasPermission`. | Nízké riziko. | **ZŮSTANE**. Klientská vrstva. |

---

## 3. AUDIT A HODNOCENÍ EXISTUJÍCÍCH 6 PERMISSIONS

V tabulce `Permission` je v současnosti evidováno 6 oprávnění:

| Permission | Kategorie | Současné použití | Hodnocení znovupoužitelnosti |
|---|---|---|---|
| **`users.manage`** | AUTH | Správa uživatelů, editace účtů, reset hesel. | **ZŮSTANE ADMIN-ONLY**. Team Center nesmí spravovat uživatelské účty. |
| **`content.publish`** | CMS | Vytváření a publikování stránek a článků. | **ZNOVUPOUŽÍT**. Vhodné pro redaktory a koordinátory spolku. |
| **`legal.edit`** | COMPLIANCE | Editace a verzování právních dokumentů a zákonů. | **ZNOVUPOUŽÍT**. Vhodné pro právní editory a právní poradce. |
| **`system.logs`** | SYSTEM | Zobrazení audit logů a systémových metrik. | **ZŮSTANE ADMIN-ONLY**. Tým nesmí číst systémové audit logy. |
| **`moderator.moderate`** | MODERATION | Schvalování/zamítání subjektů, pracovníků a recenzí. | **ZNOVUPOUŽÍT & ROZŠÍŘIT**. Základní právo pro moderační sekci Team Centeru. |
| **`system.github.publish`**| SYSTEM | Přímá synchronizace kódu do GitHub repozitáře. | **ZŮSTANE SUPER_ADMIN-ONLY**. Zcela vyloučeno z týmových rolí. |

---

## 4. DEFINITIVNÍ NÁVRH TEAM RBAC MODELU (ROLE SPOLKU)

Místo vytváření zbytečně mnoha rigidních rolí v DB schématu je doporučeno **konsolidovat existující role** a doplnit **pouze ty, které mají reálné, vzájemně se nepřekrývající povinnosti**:

### 4.1 Konsolidovaný model rolí:

1. 🏛️ **`SPOLEK_COORDINATOR` (Koordinátor spolku & Vedoucí týmu)**
   - **Odůvodnění:** Spolek potřebuje vedoucí roli, která vidí celkový přehled příchozích tiketů, provádí **triage** (roztřídění a přiřazení konkrétním mentorům), eviduje aktivní dobrovolníky a jejich dohody/kodexy, ale **nemá** technická admin práva (nemůže restartovat servery, měnit DNS, mazat administrátory).
   - **Povolená oprávnění:** `team.tickets.view_all`, `team.tickets.assign`, `team.tickets.reply`, `team.volunteers.view`, `team.moderation.all`, `content.publish`.
   - **Zakázaná oprávnění:** `users.manage` (nemůže měnit systémové role), `system.logs`, `system.github.publish`, správa VPS/DNS.
   - **Datový rozsah:** Všechny tikety ve frontě (pro účely triage), přehledy dobrovolníků, moderační fronta. **NEMÁ přístup k neautorizovaným klientským spisům.**

2. 🤝 **`PEER_MENTOR` / `VOLUNTEER` (Krizový poradce / Dobrovolník mentor)**
   - **Odůvodnění:** Dobrovolník, který prošel ověřením a podepsal Dobrovolnický kodex. Poskytuje peer podporu rodičům v tísni.
   - **Povolená oprávnění:** `team.tickets.view_assigned` (pouze své tikety), `team.tickets.reply` (odpovídání a interní poznámky), `team.knowledge.view`.
   - **Zakázaná oprávnění:** `team.tickets.assign` (nemůže přerozdělovat cizí tikety), moderační schvalování (pokud není zároveň moderátor), přístup k cizím tiketům, jakákoliv admin práva.
   - **Datový rozsah:** Výhradně jemu explicitně přiřazené tikety (`SupportTicket.assignedToId === user.id`) a veřejné/interní znalostní báze.

3. ⚖️ **`MODERATOR` (Moderátor registru a komunity)**
   - **Odůvodnění:** Plně pokrývá existující roli `MODERATOR`. Zodpovídá za čistotu registru institucí, ověřování IČO soudů a OSPODů, kontrolu etiky recenzí a diskuzí.
   - **Povolená oprávnění:** `moderator.moderate`, `team.moderation.subjects`, `team.moderation.reviews`.
   - **Zakázaná oprávnění:** Přístup k tiketům podpory (pokud není mentor), správa uživatelů, CMS publikace.

4. 📝 **`LEGAL_EDITOR` / `LEGAL_ADVISOR` (Právní poradce & Editor vzorů)**
   - **Odůvodnění:** Konsolidace existující role `LEGAL_EDITOR`. Zajišťuje odbornou správu právních průvodců, kontrolu vzorů podání a metodických materiálů pro tým.
   - **Povolená oprávnění:** `legal.edit`, `team.knowledge.edit`, `content.publish`.
   - **Zakázaná oprávnění:** Správa uživatelů, technické logy, přímý přístup k cizím spisům.

> [!TIP]
> **Konsolidační rozhodnutí:** Role `SPOLEK_MEMBER` není nutná jako samostatný enum v DB – řadový člen spolku má status `VOLUNTEER` nebo `VERIFIED_USER` s přiřazeným oprávněním číst interní materiály (`team.knowledge.view`). Tím udržíme schéma štíhlé a čisté.

---

## 5. GRANULÁRNÍ MODEL OPRÁVNĚNÍ (OPERACE & DOMÉNY)

Model oprávnění je postaven na matici **DOMÉNA : OPERACE**:

```
[Doména] . [Operace]
```

### 5.1 Definitivní katalog granulárních oprávnění:

| Oprávnění | Doména | Operace | Popis a bezpečnostní kontrola |
|---|---|---|---|
| `team.access` | TEAM | VIEW | Základní vstup do rozhraní Team Centeru (`/team`). |
| `team.tickets.view_assigned` | TICKETS | VIEW | Čtení tiketů, kde `assignedToId === user.id`. |
| `team.tickets.view_all` | TICKETS | VIEW | Čtení všech otevřených i nepřiřazených tiketů ve frontě (Triage). |
| `team.tickets.reply` | TICKETS | CREATE/EDIT | Odeslání odpovědi klientovi nebo vložení interní poznámky. |
| `team.tickets.assign` | TICKETS | ASSIGN | Přiřazení nebo přerozdělení tiketu jinému mentorovi. |
| `team.tickets.close` | TICKETS | EDIT | Uzavření nebo vyřešení tiketu. |
| `team.moderation.subjects` | MODERATION | APPROVE/REJECT | Schválení/zamítnutí nově zadaného subjektu nebo pracovníka. |
| `team.moderation.reviews` | MODERATION | APPROVE/DELETE | Schválení nebo smazání uživatelské recenze. |
| `team.volunteers.view` | VOLUNTEERS | VIEW | Přehled přihlášek dobrovolníků a stavu podepsaných dohod/kodexů. |
| `team.knowledge.view` | KNOWLEDGE | VIEW | Čtení interních metodických materiálů spolku. |
| `team.knowledge.edit` | KNOWLEDGE | EDIT/PUBLISH | Tvorba a úprava interních návodů a krizových postupů. |
| `content.publish` | CMS | PUBLISH | Publikování článků a novinek na veřejný web. |
| `legal.edit` | LEGAL | EDIT | Úprava právních průvodců a vzorů. |
| `users.manage` | AUTH | ALL | **STRICT ADMIN ONLY:** Správa uživatelských účtů a rolí. |
| `system.logs` | SYSTEM | VIEW | **STRICT ADMIN ONLY:** Zobrazení technických audit logů. |
| `system.infrastructure` | SYSTEM | ALL | **STRICT SUPER_ADMIN ONLY:** VPS, DNS, Mailcow, GitHub Publisher. |

---

## 6. ARCHITEKTURA TIKETŮ: TÝMOVÝ PŘÍSTUP & ASSIGNMENT SUBSYSTÉM

### 6.1 Problém stávajícího stavu:
V současném schématu model `SupportTicket` obsahuje pouze:
- `userId` (vlastník / tazatel),
- `status` (`OPEN`, `IN_PROGRESS`, `WAITING_USER`, `RESOLVED`, `CLOSED`),
- `category`, `priority`, `subject`, `description`.
**Chybí relace na řešitele.** Backend `/api/portal/tickets` v současnosti umožňuje zobrazení cizích tiketů pouze pro roli `ADMIN` / `SUPER_ADMIN`.

### 6.2 Navržené schéma v Prisma (Návrh pro Fázi 04C):
Do modelu `SupportTicket` navrhujeme doplnit:
```prisma
model SupportTicket {
  // ... existující pole ...
  
  // Týmové přiřazení (Assignment)
  assignedToId      String?         // ID dobrovolníka / mentora
  assignedTo        User?           @relation("TicketAssignee", fields: [assignedToId], references: [id], onDelete: SetNull)
  assignedAt        DateTime?       // Čas přiřazení
  assignedById      String?         // Kdo tiket přiřadil (Koordinátor)
  assignedBy        User?           @relation("TicketAssigner", fields: [assignedById], references: [id], onDelete: SetNull)
  
  // Řešení a eskalace
  internalNotesCount Int            @default(0)
  lastActivityAt    DateTime        @default(now())
  resolvedAt        DateTime?
  
  @@index([assignedToId])
  @@index([status, assignedToId])
}
```

### 6.3 Logika týmových front (Triage vs. Moje tikety):
1. **Fronta Triage (Nepřiřazené tikety):**
   - Přístupná pouze pro uživatele s právem `team.tickets.view_all` (Koordinátor, Admin).
   - Zobrazuje tikety se stavem `OPEN` a `assignedToId === null`.
   - Akce: „Převzít k řešení“ (self-assign) nebo „Přiřadit mentorovi X“.
2. **Moje tikety (Přiděleno mně):**
   - Přístupná pro každého mentora s právem `team.tickets.view_assigned`.
   - Dotaz: `WHERE assignedToId = currentUser.id AND status != 'CLOSED'`.
   - Mentor vidí pouze své tikety.
3. **Ochrana proti IDOR/BOLA (P0):**
   - Endpoint `GET /api/team/tickets/:id`:
     - Pokud uživatel má `team.tickets.view_all` -> Povoleno.
     - Pokud uživatel má `team.tickets.view_assigned` -> Povoleno POUZE pokud `ticket.assignedToId === currentUser.id`.
     - V opačném případě -> **HTTP 403 Forbidden** (Fail-Closed).
4. **Audit převzetí a změn:**
   - Každé přiřazení, přerozdělení nebo uzavření tiketu vytvoří systémovou zprávu v `SupportTicketMessage` s příznakem `isInternal = true` (např. *„Tiket přiřazen pracovníkovi Jan Novák koordinátorem Petr Svoboda dne ...“*).
5. **Ukončení členství v týmu:**
   - Pokud je uživateli odebrána role mentora, databázová vazba `onDelete: SetNull` zajistí, že tikety nezmizí, ale jejich `assignedToId` se stane `null` a vrátí se do fronty Triage k novému přiřazení.

---

## 7. MATICE PŘÍSTUPU K DATŮM (DATA ACCESS MATRIX)

V následující matici je přesně definováno, kdo smí číst a upravovat jednotlivé datové entity:

| Datová entita | Veřejnost | Vlastní uživatel (Client) | Přiřazený mentor (Team) | Celý Team / Koordinátor | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|---|
| **`SupportTicket`** | ❌ | ✅ Vlastní (CRUD) | ✅ Čtení + Odpověď | ✅ Triage + Přerozdělení | ✅ Plný přístup | ✅ Plný přístup |
| **`SupportTicketMessage` (veřejná)** | ❌ | ✅ Čtení + Odeslání | ✅ Čtení + Odeslání | ✅ Čtení + Odeslání | ✅ Plný přístup | ✅ Plný přístup |
| **`SupportTicketMessage` (`isInternal`)** | ❌ | ❌ **SKRYTO** | ✅ Čtení + Zápis | ✅ Čtení + Zápis | ✅ Plný přístup | ✅ Plný přístup |
| **`Case` (Klientský spis)** | ❌ | ✅ Vlastní (CRUD) | ❌ **NEPŘÍSTUPNÉ\*** | ❌ **NEPŘÍSTUPNÉ** | ⚠️ Pouze technický support | ⚠️ Pouze krizový zásah |
| **`CaseDocument` / `CaseEvidence`**| ❌ | ✅ Vlastní (CRUD) | ❌ **NEPŘÍSTUPNÉ\*** | ❌ **NEPŘÍSTUPNÉ** | ⚠️ Pouze technický support | ⚠️ Pouze krizový zásah |
| **`Judgment` (Rozsudky)** | ❌ | ✅ Vlastní (CRUD) | ❌ **NEPŘÍSTUPNÉ\*** | ❌ **NEPŘÍSTUPNÉ** | ⚠️ Pouze technický support | ⚠️ Pouze krizový zásah |
| **`VolunteerApplication`** | ❌ | ✅ Vlastní podání | ❌ | ✅ Přehled přihlášek | ✅ Plná správa | ✅ Plná správa |
| **`VolunteerCodexAgreement`** | ❌ | ✅ Vlastní podpis | ❌ | ✅ Ověření platnosti | ✅ Plná správa | ✅ Plná správa |
| **`Subjekt` (Soudy, OSPOD, Mediátoři)**| ✅ Schválené | ✅ Návrh nového | ✅ Schvalování | ✅ Schvalování | ✅ Plná správa | ✅ Plná správa |
| **`Pracovnik` (Úředníci, Soudci)** | ✅ Schválení | ✅ Návrh nového | ✅ Schvalování | ✅ Schvalování | ✅ Plná správa | ✅ Plná správa |
| **`Review` (Hodnocení)** | ✅ Schválené | ✅ Vlastní (CRUD) | ✅ Moderace | ✅ Moderace | ✅ Plná správa | ✅ Plná správa |
| **`Article` / `NewsItem`** | ✅ Publikované | ❌ | ✅ Čtení draftů | ✅ Editace draftů | ✅ Plná správa / Puck | ✅ Plná správa |
| **`LegalGuide` / `Law`** | ✅ Publikované | ❌ | ✅ Čtení podkladů | ✅ Editace (Legal Editor) | ✅ Plná správa | ✅ Plná správa |
| **`FAQ` / `WikiTerm`** | ✅ Publikované | ❌ | ✅ Čtení | ✅ Tvorba a editace | ✅ Plná správa | ✅ Plná správa |
| **`User` (Účty, Hesla, 2FA)** | ❌ | ✅ Vlastní profil | ❌ **NEPŘÍSTUPNÉ** | ❌ **NEPŘÍSTUPNÉ** | ✅ Správa / Reset | ✅ Plná správa |
| **`SystemSetting` / `AuditLog`** | ❌ | ❌ | ❌ **NEPŘÍSTUPNÉ** | ❌ **NEPŘÍSTUPNÉ** | ✅ Čtení / Nastavení | ✅ Plná správa |
| **VPS / DNS / GitHub / Mailcow** | ❌ | ❌ | ❌ **NEPŘÍSTUPNÉ** | ❌ **NEPŘÍSTUPNÉ** | ❌ **NEPŘÍSTUPNÉ** | ✅ Plná správa |

*\*Poznámka k osobním spisům (`Case`): Týmová role automaticky neuděluje přístup k žádnému klientskému spisu. Přístup je možný výhradně v budoucnu na základě explicitní klientské žádosti o asistenci (Opt-In delegace) s časovým limitem a povinným zápisem do `SensitiveAccessLog`.*

---

## 8. STRIKTNÍ OCHRANA OSOBNÍCH SPISŮ (CASE ISOLATION PROTOCOL)

Data v klientských spisech (`Case`, `Child`, `CarePlan`, `CaseDocument`, `Judgment`, `FinancialObligation`) představují nejcitlivější údaje (čl. 9 GDPR, opatrovnická řízení, nezletilé děti, rodinné konflikty).

### 8.1 Architektonická pravidla izolace spisů:
1. **Serverová autorizace:** Všechny endpointy `/api/cases/*` striktně vyžadují ověření vlastníka (`ownerId === req.user.id`).
2. **Žádný globální Team bypass:** Běžný middleware pro tým (`requirePermission('team.access')`) **NIKDY** neuděluje oprávnění číst cizí spisy v `/api/cases`.
3. **Případná budoucí klientská asistence (Plán pro Fázi 5+):**
   - Pokud klient požádá o konzultaci spisu, musí v rozhraní klientské zóny kliknout na „Požádat mentora o revizi spisu“.
   - Tím vznikne časově omezená vazba `CaseAccessGrant` (např. platnost 7 dní).
   - Každé otevření spisu mentorem zaznamená auditní záznam: *Kdo, Kdy, Který spis, Důvod otevření*.

---

## 9. NEPROSTUPNÁ BEZPEČNOSTNÍ HRANICE (ADMIN & SUPER_ADMIN BOUNDARY)

Team Center a jeho uživatelé **NESMÍ** za žádných okolností získat přístup k následujícím subsystémům:

```
+-------------------------------------------------------------------------------+
|                       ZAKÁZANÁ ZÓNA PRO TEAM CENTER                           |
+-------------------------------------------------------------------------------+
| ❌ 1. VPS Management (/api/admin/vps/*)        -> SUPER_ADMIN only            |
| ❌ 2. GitHub Publisher (/api/admin/github/*)    -> SUPER_ADMIN only            |
| ❌ 3. Vercel DNS Správa (/api/admin/dns/*)       -> SUPER_ADMIN only            |
| ❌ 4. Mailcow Správa (/api/admin/mailcow/*)     -> SUPER_ADMIN only            |
| ❌ 5. Správa uživatelů & hesel (/api/admin/users) -> ADMIN only                |
| ❌ 6. Globální nastavení portálu (/api/admin/settings) -> ADMIN only          |
| ❌ 7. Bezpečnostní logy (/api/admin/audits/*)   -> ADMIN only                |
| ❌ 8. Server secrets, .env konfigurace a DB spojení -> SUPER_ADMIN only      |
+-------------------------------------------------------------------------------+
```

**Technická vynutitelnost:** Všechny výše uvedené endpointy jsou a zůstanou chráněny serverovým middlewarem `requireRole('ADMIN' | 'SUPER_ADMIN')` nebo `requirePermission('system.infrastructure')`. Klientské skrytí v navigaci je pouze doplňkem.

---

## 10. INFORMAČNÍ ARCHITEKTURA (IA) TEAM CENTERU

Navržená struktura Team Centeru je optimalizována pro efektivní práci spolku a řešení požadavků klientů:

```
🏛️ Team Center (/team nebo /admin/team-center)
├── 📊 1. Přehled (Overview)
│   ├── Moje KPI (otevřené tikety, čekající moderace)
│   ├── Spolkové novinky & oznámení pro tým
│   └── Rychlé akce (Převzít tiket, Zkontrolovat registr)
│
├── 🎫 2. Tickety & Podpora (Support Hub)
│   ├── Moje přidělené tikety (Moje aktivní případy pomoci)
│   ├── Fronta k přiřazení (Triage - pro Koordinátora)
│   ├── Vyřešené a archivované tikety
│   └── Šablony rychlých odpovědí & doporučení
│
├── ⚖️ 3. Moderace & Registr (Moderation Center)
│   ├── Nově navržené subjekty (Soudy, OSPOD, Poradny)
│   ├── Nově navržení pracovníci
│   └── Uživatelské recenze ke schválení
│
├── 🤝 4. Dobrovolnická síť (Volunteers Hub - Koordinátor)
│   ├── Seznam aktivních dobrovolníků
│   ├── Nové přihlášky k dobrovolnictví
│   └── Kontrola platnosti Dohod a Kodexů
│
└── 📚 5. Znalostní báze spolku (Team Knowledge Base)
    ├── Metodika krizové intervence a komunikace
    ├── Právní manuály a doporučené vzory podání
    └── Adresář krizových kontaktů a intervenčních center
```

---

## 11. NAVIGAČNÍ ZAPOJENÍ: HYBRIDNÍ ARCHITEKTURA (A vs. B vs. C)

Posoudili jsme 3 architektonické varianty umístění Team Centeru:
- **Varianta A: Samostatná `/team` zóna.** (Čisté pro dobrovolníky, ale administrátoři musí přepínat kontext).
- **Varianta B: Výhradně součást `/admin`.** (Matoucí pro dobrovolníky, kteří nepotřebují vidět 7 technických sekcí administrace).
- **Varianta C: Hybridní model s jednou sdílenou komponentou.** (**VÍTĚZNÁ VARIANTA**)

### 11.1 Zdůvodnění vítězného hybridního modelu (Varianta C):
1. **Pro dobrovolníky a moderátory (`VOLUNTEER`, `MODERATOR`, `SPOLEK_*`):**
   - Vstupují přímo na čistou, přehlednou URL `/team` (z odkazu v `Header.tsx`).
   - Vidí pouze týmové nástroje, bez technických admin panelů, VPS a systémových nastavení.
2. **Pro administrátory (`ADMIN`, `SUPER_ADMIN`):**
   - Mohou přistupovat přes `/team` NEBO přímo v Admin Shellu v **Sekci 8 (`sec-team` / `/admin/team-center`)**.
   - Obě cesty renderují **stejnou jádrovou komponentu `TeamCenterDashboard.tsx`**, což zaručuje 100% konzistenci bez duplicity kódu.

---

## 12. BUDOUCÍ MIGRAČNÍ PLÁN PRO IMPLEMENTACI (FÁZE 04C+)

Implementace proběhne v přísně sekvenčních, kontrolovaných krocích:

```
[1. RBAC & PERMISSIONS SEED]
  -> Definice nových permissions v seedService.ts a inicializace v DB
  -> Bezpečná asociace s existujícími i novými rolemi

[2. PRISMA SCHEMA & MIGRATION]
  -> Doplnění polí assignedToId, assignedAt, assignedById do SupportTicket
  -> Provedení migrace: npx prisma migrate dev --name add_ticket_assignment

[3. BACKEND SERVICES & API ROUTING]
  -> Vytvoření /src/services/teamService.ts
  -> Vytvoření /src/routes/teamRoutes.ts (/api/team/tickets, /api/team/moderation)
  -> Aplikace striktních requirePermission middleware s ochranou IDOR

[4. FRONTEND TEAM CENTER KOMPONENTY]
  -> Vytvoření /src/components/team/TeamCenterDashboard.tsx
  -> Vytvoření podkomponent: TeamTicketQueue, TeamTicketDetail, TeamModerationView, TeamVolunteersView
  -> Propojení se Sekcí 8 v Admin Shellu (nahrazení TeamCenterSlot)

[5. NAVIGACE & HLAVIČKA]
  -> Úprava Header.tsx pro zobrazení odkazu "Team Center" pro oprávněné uživatele
  -> Přidání routy /team v App.tsx

[6. TESTOVÁNÍ & VERIFIKACE]
  -> Automatické testy RBAC, testy izolace tiketů, penetrační testy IDOR
  -> Ověření produkčního buildu a zápis finálního auditu
```

---

## 13. TESTOVACÍ PLÁN PRO BUDOUCÍ IMPLEMENTACI (TEST SUITES)

Pro ověření budoucí implementace budou připraveny následující testovací sady:

1. **Test izolace rolí (Role Isolation):**
   - Ověření, že uživatel s rolí `VOLUNTEER` nedostane přístup na `/api/admin/*`, `/api/admin/vps/*`, `/api/admin/users`.
   - Návratový kód musí být striktně `403 Forbidden`.
2. **Test izolace tiketů (Ticket Assignment & IDOR Protection):**
   - Mentor A se pokusí otevřít tiket přiřazený Mentorovi B -> Očekáváno: `403 Forbidden`.
   - Koordinátor se pokusí otevřít nepřiřazený tiket -> Očekáváno: `200 OK`.
   - Mentor A odpoví na svůj přiřazený tiket -> Očekáváno: `200 OK`.
3. **Test izolace klientských spisů (Case Isolation):**
   - Člen týmu bez klientského vztahu se pokusí načíst `/api/cases/:id` -> Očekáváno: `403 Forbidden`.
4. **Test interních poznámek (Internal Notes Privacy):**
   - Klient (vlastník tiketu) načte `/api/portal/tickets/:id` -> Zprávy s `isInternal: true` nesmí být v odpovědi vůbec obsaženy.
5. **Test navigace a UI:**
   - Ověření viditelnosti odkazu Team Center pouze pro uživatele s oprávněním `team.access`.

---

## 14. INVENTÁŘ BUDOUCÍCH ZMĚN (CHANGE INVENTORY PRO FÁZI 04C+)

V budoucí implementační fázi budou dotčeny tyto soubory (žádné změny nebyly provedeny v této fázi):

- `prisma/schema.prisma` (doplnění assignment polí u `SupportTicket`)
- `src/services/seedService.ts` (nové permissions a výchozí vazby)
- `src/routes/teamRoutes.ts` (nový dedikovaný router pro Team Center)
- `src/routes/supportTicketRoutes.ts` (filtrování interních zpráv pro klienty)
- `server.ts` (registrace `app.use('/api/team', teamRoutes)`)
- `src/components/team/TeamCenterDashboard.tsx` (nová komponenta)
- `src/components/admin/TeamCenterSlot.tsx` (nahrazení slotu plnou komponentou)
- `src/components/Header.tsx` (odkaz do Team Centeru pro tým)
- `src/config/navigation.ts` (definice položky Team Center)
- `tests/team-center-rbac.test.ts` (nová testovací sada)

---

## 15. KLASIFIKACE NÁLEZŮ (P0 / P1 / P2 / P3)

- **P0 (Kritická bezpečnostní rizika):** **0 nalezeno** (Architektonický návrh striktně dodržuje fail-closed zásady, izolaci klientských spisů a 0-PII pravidla).
- **P1 (Architektonická opatření):** **0 nalezeno** (Všechny P1 překážky z Fáze 04A mají navrženo konkrétní technické řešení v sekcích 6 a 7).
- **P2 (Optimalizace schématu):** **0 nalezeno** (Konsolidace rolí zabránila zbytečnému bujení enumů v DB).
- **P3 (Doporučení pro Fázi 04C):** **0 nalezeno**.

---

## 16. METRIKY ARCHITEKTONICKÉHO NÁVRHU

- **Počet existujících rolí analyzováno:** `11`
- **Počet existujících permissions analyzováno:** `6`
- **Počet navržených budoucích rolí po konsolidaci:** `4` (`SPOLEK_COORDINATOR`, `PEER_MENTOR`, `MODERATOR`, `LEGAL_EDITOR`)
- **Počet navržených granulárních permissions:** `16` (Pokrývajících celou matici operací)
- **Navržené změny v Prisma schema:** `1 model rozšířen` (`SupportTicket` o 4 assignment pole, 0 destruktivních změn)
- **Vybraná navigační architektura:** `Hybridní model (Varianta C)`

---

## 17. ZÁVĚREČNÝ CHECKPOINT

**PHASE 04B CHECKPOINT: PASS**  
Architektonický a bezpečnostní design Team Centeru, RBAC modelu a datové izolace byl kompletně zpracován. Repozitář zůstává v přísně read-only stavu bez zásahu do zdrojového kódu a DB.
