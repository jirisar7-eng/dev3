# NAVIGATION + ADMIN SHELL REDESIGN — PHASE 00: BASELINE AUDIT

**Projekt:** Táta má právo (`jirisar7-eng/dev3`)  
**Datum a čas:** 2026-08-26  
**Režim:** READ-ONLY / Analytická fáze (Zero Code Modifications)  
**Cílové prostředí:** DEV3 (`https://dev3.tatovacesta.cz`) / plná kompatibilita s PROD3  
**Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor projektu

---

## 1. EXECUTIVNÍ SHRNUTÍ & CÍL AUDITU

Tento audit představuje **vstupní baseline (Phase 00)** pro plánovaný redesign a sjednocení navigačního systému, oddělení veřejné a privátní vrstvy, konsolidaci administračního rozhraní (**Admin Shell**) a přípravu architektonického základu pro **Team Center**.

Audit vychází ze striktního principu:
1. **BEZPEČNOST A INTEGRITA DAT (P0):** Navigace a klientské přepínače vrstev slouží výhradně pro UX a ergonomii. Skutečné zabezpečení, autorizace a ochrana citlivých údajů jsou vynucovány striktně na serveru (Express middleware, JWT cookies, RBAC matice a databázová integrita).
2. **KONTROLA VIDITELNOSTI (UX vs. SECURITY):** Nepřihlášený uživatel nesmí v navigaci vidět privátní moduly, osobní spisy ani administraci jako běžné položky. Přihlášený uživatel má mít personalizované menu s jasným rozlišením rolí.
3. **READ-ONLY INTEGRITA:** V této fázi nebyly provedeny žádné změny v kódu, schématu databáze ani routování.

---

## 2. PŘEHLED PROSTUDOVANÝCH HISTORICKÝCH AUDITŮ

1. `docs/audit/NAVIGATION_ARCHITECTURE_2026-08-23.md`:
   - Zmapoval 10 základních kategorií (`cat-home`, `cat-1` až `cat-9`), včetně podpoložek a navázání na routy.
   - Poukázal na překryvy mezi `O nás` a `O projektu` a nutnost oddělit privátní položky (Můj případ, Profil, Administrace).
2. `docs/audit/INFORMATION_ARCHITECTURE_AUDIT_2026-08-20.md`:
   - Detailní rozbor 8 funkčních pilířů informační architektury (Krizová pomoc, Opatrovnictví, Péče, Osobní spis, AI nástroje, Akademie, Zprávy, Organizace).
3. `docs/audit/RESPONSIVE_NAVIGATION_AUDIT_2026-08-19.md`:
   - Definoval princip adaptivního vykreslování navigace: měření šířky mimo DOM pomocí `ResizeObserver`, prevence nekonečných re-render smyček a fallback do kompaktního `LOGO | MENU` režimu.
4. `docs/audit/PUCK_UNIFIED_CMS_AUDIT.md`:
   - Zdokumentoval integraci vizuálního editoru `@measured/puck`, strukturu `Page`, `PageSection`, `PageTemplate` a hybridní ukládání (PostgreSQL Prisma + `dbStore`).
5. `docs/audit/PUCK_HOMEPAGE_LINK_ROUTING_AUDIT_2026-08-19.md`:
   - Ověřil validitu všech 15 klíčových odkazů a rout z homepage na podstránky (např. `/sos-plan`, `/opatrovnicka-agenda`, `/plan-pece`, `/centrum-formularu`, `/judikatura`, `/ai-guide`).

---

## 3. MAPOVÁNÍ SOUČASNÉHO STAVU (CURRENT STATE INVENTORY)

### 3.1 Zdroje pravdy pro navigaci

| Zdroj / Soubor | Účel a role v systému | Stav & Nálezy |
|---|---|---|
| `src/config/navigation.ts` | Statická definice `NAVIGATION_ITEMS` (9 kategorií + podpoložky). | Obsahuje 40+ položek. Zahrnuje veřejné i privátní (`cat-4`, `cat-9`) a administrátorské (`/admin`) položky ve společném poli. |
| `src/components/Header.tsx` | Hlavní desktopový/mobilní header aplikace. Obsahuje `Layer Switcher` (Veřejnost / Můj Účet / CMS) a trigger pro `MegaMenu`. | Využívá `Header` jako primární layout wrapper. |
| `src/components/layout/Navbar.tsx` | Alternativní/starší verze Navbaru. | Obsahuje duplicitní `Layer Switcher` a trigger pro `MegaMenu`. V současném `App.tsx` je použit přímo `Header.tsx`. |
| `src/components/layout/MegaMenu.tsx` | MegaMenu překryvné okno zobrazující kategorie. | Filtruje administraci (`/admin`, `/administrace`) podle `isAuthorizedAdmin`. Zobrazuje však privátní kategorie (`💼 Můj případ`, `👤 Můj účet`) i nepřihlášeným uživatelům (kteří po kliku narazí na přihlašovací obrazovku). |
| `src/components/Footer.tsx` | Patička webu (desktop i mobilní verze). | Obsahuje rychlou navigaci, krizové tlačítko, odkazy na compliance dokumenty a sponzory. |
| `src/App.tsx` | Klientský router a stavový kontejner (`currentView`: `public`, `private`, `admin`, `login`, `register`). | Řídí přepínání hlavních pohledů na základě URL cesty (`getViewFromPath`). |
| `src/components/public/PublicPortal.tsx` | Router a renderer pro veřejné stránky a CMS bloky. | Obsahuje více než 50 mapovaných slugů a rout. |
| `src/components/private/UserDashboard.tsx` | Privátní klientská zóna (`/portal`, `/muj-pripad`, `/pece`, `/portal/profil`, `/portal/dokumenty`, `/portal/coparent`, `/portal/tikety`). | Obsahuje vnitřní přepínání podle `currentPath`. |
| `src/components/admin/AdminDashboard.tsx` | Administrační panel (CMS Control Panel). | Obsahuje 28 tabů v levém panelu, bez logické hierarchické kategorizace. |

---

## 4. IDENTIFIKOVANÉ PROBLÉMY A DUPLICITY (GAP & PROBLEM ANALYSIS)

### 4.1 Split-Brain a viditelnost položek pro nepřihlášené uživatele (P0 UX/IA)
- **Problém:** V `src/config/navigation.ts` a `MegaMenu.tsx` jsou kategorie `💼 Můj případ & Dokumenty` (`cat-4`) a `👤 Můj účet` (`cat-9`) vykreslovány v hlavním rozcestníku i anonymnímu návštěvníkovi.
- **Dopad:** Anonymní uživatel je zmaten, proč vidí odkazy na své spisy, když ještě není přihlášen. Kliknutí vede na login screen nebo prázdný stav.
- **Cílové řešení:** 
  - **Veřejné menu (Nepřihlášený):** Zobrazuje pouze informační, edukační, právní, krizové a komunitní moduly + výrazné CTA "Přihlásit se" / "Registrace".
  - **Privátní menu (Přihlášený):** Přidává personalizovaný rozcestník "Můj portál" (Osobní spis, Péče, Dokumenty, Spolurodičovství, Nastavení).
  - **Administrátorské menu (ADMIN/SUPER_ADMIN):** Zpřístupňuje rychlý vstup do Administrace / CMS.

### 4.2 Duplicita v komponentách navigace (`Header.tsx` vs. `Navbar.tsx`)
- **Problém:** V repozitáři existují dva téměř identické soubory pro navigaci: `src/components/Header.tsx` a `src/components/layout/Navbar.tsx`.
- **Dopad:** Riziko regrese při úpravě jednoho souboru, pokud by jiná část aplikace importovala druhý.
- **Cílové řešení:** Konsolidace do jediného primárního navigačního layoutu `Header` s čistě oddělenými sub-komponentami.

### 4.3 Monolitický Admin Dashboard (28 plochých tabů)
- **Problém:** `AdminDashboard.tsx` obsahuje 28 položek v jednom plochém seznamu tlačítek v levém sloupci:
  - *Obsah:* Pages, Templates, Texts, Theme, Branding, CMS
  - *Systém & Moduly:* Modules, Custom Modules, JSON Schema, Settings, DNS, VPS, GitHub Publisher
  - *Data & Právo:* e-Sbírka, Státní data & API Hub, Registr subjektů, Schvalování kontaktů
  - *Uživatelé & Komunikace:* Users & RBAC, Sponzoři, Mailcow, Compliance, Audit Log, Audit Center
  - *QA & AI:* QA & Audit Syntéza, Synthesis Admin Copilot, AI Context & Index, Test Runner
- **Dopad:** Špatná přehlednost pro administrátory, chybějící seskupení do logických sekcí (Obsah, Uživatelé & Bezpečnost, Právní & Státní data, Systém & DevSecOps).
- **Cílové řešení:** Přestavba na moderní **Admin Shell** s hierarchickým bočním panelem (Sidebar Groups), vyhledáváním a rychlými filtry.

---

## 5. ZÁVISLOSTI NA AUTH A RBAC (SERVER-SIDE & CLIENT-SIDE)

### 5.1 Role v systému (`prisma/schema.prisma` & `UserRoleType`)
- `USER`, `REGISTERED_USER`, `VERIFIED_USER`
- `VOLUNTEER`
- `MODERATOR`
- `CONTENT_MANAGER`, `LEGAL_EDITOR`
- `ADMIN`
- `SUPER_ADMIN`, `SYSTEM_ADMIN`

### 5.2 Oprávnění (`Permission`) a vazby (`RolePermission`)
Systém má v databázi připraven model oprávnění:
- `users.manage` (AUTH)
- `content.publish` (CMS)
- `legal.edit` (COMPLIANCE)
- `system.logs` (SYSTEM)
- `moderator.moderate` (MODERATION)
- `system.github.publish` (SYSTEM)

### 5.3 Bezpečnostní pravidlo
- **Klientská navigace:** Podmínky `hasRole('ADMIN')` nebo `currentUser !== null` řídí pouze viditelnost v UI.
- **Backendové API:** Každý citlivý endpoint (např. `/api/admin/*`, `/api/cases/*`, `/api/portal/*`) je striktně chráněn serverovými middleware: `requireAuth`, `requireRole(['ADMIN', 'SUPER_ADMIN'])`, `requirePermission(...)`.

---

## 6. PŘÍPRAVA PRO TEAM CENTER (FOUNDATION & COMPATIBILITY)

### 6.1 Co je Team Center?
Modul určený pro koordinaci interního týmu, dobrovolníků, právních editorů, moderátorů a podpory.

### 6.2 Architektonické požadavky pro integraci do navigace:
1. **Navigační umístění:** 
   - Pro administrátory: součást Admin Shellu pod sekcí "Tým & Spolupráce".
   - Pro dobrovolníky/moderátory: vyhrazená sekce v privátní zóně (např. `/portal/tym` nebo `/tym`).
2. **Nezávislost na hlavním menu:** Navigační struktura musí používat modulární registraci, aby přidání Team Centeru nevyžadovalo refaktor celého MegaMenu.

---

## 7. NÁVRH CÍLOVÉ ARCHITEKTURY (TARGET ARCHITECTURE PLAN)

### 7.1 Cílová struktura hlavního menu (Veřejné vs. Privátní)

```
[VEŘEJNÁ ČÁST - Nepřihlášený i Přihlášený]
├── 🏠 Domů (/)
├── 🚨 Pomoc v krizi (/sos-plan, /krizova-pomoc, /memento)
├── ⚖️ Právo & Opatrovnictví (/agenda, /prava, /judikatura, /dokumenty, /clanky, /state-laws, /ospod, /soud)
├── 👨‍👧 Péče & Děti (/pece, /kalkulacka-vyzivneho)
├── 🤖 AI Asistent & Nástroje (/ai-asistent, /ai-pruvodce, /ai-formulare, /ai-simulator)
├── 🎓 Akademie & Vzdělávání (/studia, /videoteka, /kvizy, /wiki, /state-statistics)
├── 🏛️ O projektu & Podpora (/o-projektu, /novinky, /kontakt, /dobrovolnici, /podporte-nas)
└── 📍 Mapa & Registr subjektů (/mapa-subjektu, /registr-subjektu)

[PRIVÁTNÍ ČÁST - Pouze Přihlášený Uživatel]
└── 👤 Můj portál & Spis (/portal)
    ├── 📁 Osobní spis otce (/muj-pripad)
    ├── 📅 Plán péče & Kalendář (/pece)
    ├── 🤝 Spolurodičovství (/portal/coparent)
    ├── 📑 Trezor dokumentů (/portal/dokumenty)
    ├── 🎫 Podpora & Dotazy (/portal/tikety)
    └── ⚙️ Nastavení účtu & Zabezpečení (/portal/profil)

[ADMINISTRACE - Pouze ADMIN / SUPER_ADMIN]
└── 🛡️ Administrace (/administrace)
    ├── 📝 Obsah & CMS (Stránky, Šablony, Texty, Puck Builder, Články)
    ├── 👥 Uživatelé & RBAC (Uživatelé, Role, Schvalování kontaktů, Dobrovolníci)
    ├── ⚖️ Právo & Data (e-Sbírka, Státní data, Registr subjektů, Compliance)
    ├── 🤖 AI & Automatizace (AI Context, Synthesis Copilot, Moduly)
    ├── 📊 Analytika & Audit (Návštěvnost 0-PII, Audit Log, Audit Center)
    └── ⚙️ Systém & VPS (Nastavení, DNS, VPS Správa, GitHub Publisher, Testy)
```

---

## 8. MATICE RIZIK A REGRESNÍ PREVENCE

| Oblast | Riziko | Mitigace / Opatření |
|---|---|---|
| **SEO & Odkazy** | Změna nebo rozbití URL existujících stránek. | Všechny existující URL cesty zůstanou 100% zachovány (kompatibilita s Puck CMS a stávajícími odkazy). |
| **RBAC / Zabezpečení** | Zpřístupnění citlivých dat přes klientské menu. | Navigace pouze skrývá/zobrazuje UI. Serverové routy striktně ověřují session a role. |
| **Responzivita** | Přetečení menu na menších displejích. | Zachování off-screen `ResizeObserver` měření pro plynulý přechod do mobilního šuplíku. |
| **Puck CMS Integrace** | Rozbití dynamického načítání stránek. | `CmsPageRenderer` a `PageService` zůstávají nedotčeny. |

---

## 9. NÁSLEDUJÍCÍ FÁZE IMPLEMENTACE (ROADMAP)

1. **FÁZE 01:** Příprava čisté konfigurace navigace (`src/config/navigation.ts`) s jasným oddělením veřejných a privátních položek podle stavu autentizace.
2. **FÁZE 02:** Refaktoring `MegaMenu.tsx` a `Header.tsx` pro čisté oddělení stavů (Nepřihlášený / Přihlášený / Admin) a odstranění duplicitního `Navbar.tsx`.
3. **FÁZE 03:** Redesign `AdminDashboard.tsx` do strukturovaného **Admin Shellu** se seskupenými kategoriemi, vyhledáváním a rychlou navigací.
4. **FÁZE 04:** Příprava skeletonu pro **Team Center** v rámci Admin Shellu a privátní zóny.
5. **FÁZE 05:** Komplexní E2E verifikace, testy autorizace, build kontrola a finální audit.

---

## 10. ZÁVĚREČNÝ VERDIKT FÁZE 00

- **Stav fáze 00:** DOKONČENO (READ-ONLY ANALÝZA).
- **Změny v produkčním kódu:** 0 souborů změněno (vytvořen pouze tento auditní report).
- **Konzistence systému:** 100% zachována.
