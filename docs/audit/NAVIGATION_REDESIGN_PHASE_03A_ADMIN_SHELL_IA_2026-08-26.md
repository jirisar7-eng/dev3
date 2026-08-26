# NAVIGATION + ADMIN SHELL REDESIGN — PHASE 03A: ADMIN SHELL INFORMATION ARCHITECTURE

**Projekt:** Táta má právo (`jirisar7-eng/dev3`)  
**Datum a čas:** 2026-08-26  
**Fáze:** PHASE 03A — Admin Shell Information Architecture (IA & Design Blueprint)  
**Režim:** READ-ONLY / Architektonický a analytický audit (Zero Code Modifications in UI)  
**Cílové prostředí:** DEV3 (`https://dev3.tatovacesta.cz`) / plná kompatibilita s PROD3  
**Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor projektu  

---

## 1. EXECUTIVNÍ SHRNUTÍ & VÝCHODISKA

Tento dokument představuje **kompletní informační architekturu (IA) a architektonický plán pro redesign Admin Shellu (Phase 03A)**.

### Současný stav a hlavní problém:
Komponenta `AdminDashboard.tsx` aktuálně obsluhuje **28 funkcí / tabů v jediném plochém, neseskupeném seznamu tlačítek** v levém postranním panelu. Uvnitř některých modulů (zejména `CmsManager.tsx` s 13 vnitřními subtaby a `QADashboard.tsx` s 6 vnitřními subtaby) navíc existují vnořené navigační vrstvy.

Tato struktura:
1. **Způsobuje kognitivní přetížení administrátorů:** Položky různého charakteru (design, databáze, VPS, články, AI agenti, moderace, právo) jsou smíchány v jedné dlouhé vertikální liště.
2. **Obsahuje skryté duplicity a překryvy:** Např. vizuální tvorba stránek (Puck `AdminPagesList`) vs. starý sekční editor stránek v `CmsManager`; starý DB editor navigace v `CmsManager` vs. konsolidovaná navigace `src/config/navigation.ts`; tři různé auditní moduly (`AuditLogViewer`, `AuditCenter`, `QADashboard`).
3. **Ztěžuje granulární delegování rolí (RBAC):** Redaktor obsahu (`CONTENT_MANAGER`), právní editor (`LEGAL_EDITOR`) nebo moderátor (`MODERATOR`) jsou vystaveni nepřehlednému množství systémových a vývojářských voleb, i když mají přístup jen k vybraným oblastem.

### Cíl Phase 03A:
Navrhnout **8 logických oblastí Admin Shellu**, vytvořit detailní inventář všech existujících funkcí, zmapovat reálné role a permissions v PostgreSQL schématu a backendovém middleware a připravit strukturovaný strom pro implementaci ve Phase 03B.

> [!IMPORTANT]
> **Pravidlo Phase 03A (Zero Code Modifications):**
> V této fázi se **nemění žádný produkční kód, nepřepisuje se `AdminDashboard.tsx`, neodstraňují se funkce ani se nevytvářejí vymyšlené role či falešné stuby**. Výstupem je autoritativní architektonická mapa schválená k následné realizaci.

---

## 2. A) KOMPLETNÍ INVENTÁŘ SOUČASNÝCH ADMIN FUNKCÍ (28+ POLOŽEK)

Kompletní audit všech tabů, komponent a modulů zapojených do `AdminDashboard.tsx` a jeho podřízených manažerů:

| # | Tab ID | Název v UI | Soubor komponenty | Účel a funkční rozsah |
|---|---|---|---|---|
| 1 | `overview` | Přehled systému | `AdminDashboard.tsx` (inline) | Hlavní dashboard: rychlé statistiky (aktivní moduly, slovník textů, VPS stav), spouštění Admin Copilota, TestRunnerCard, architektonický stav Fáze 1. |
| 2 | `analytics` | Analytika & Návštěvnost | `AnalyticsManager.tsx` | 0-PII telemetrie, agregovaná návštěvnost stránek, konverze, heatmaps, přístupy bez ukládání osobních údajů. |
| 3 | `pages` | Správa stránek | `AdminPagesList.tsx` | Seznam stránek CMS s integrací vizuálního editoru Puck, publikační stav, SEO metadata, historie verzí. |
| 4 | `templates` | Šablony stránek | `TemplateManager.tsx` | Správa šablon stránek (Engine), přednastavené bloky pro Puck, seed šablon. |
| 5 | `page-builder` | Puck Editor | `AdminPageBuilder.tsx` | Plnohodnotný vizuální editor komponent `@measured/puck` s live preview. |
| 6 | `texts` | Text Manager | `TextManager.tsx` | Slovník textů a lokalizačních řetězců (`ContentString`), překlady CZ/EN, inline editace systémových hlášek. |
| 7 | `theme` | Theme & Colors | `ThemeManager.tsx` | Vizuální nastavení barevných schémat, systémové palety, osobní tématické presety, CSS proměnné. |
| 8 | `branding` | Branding / Logo | `BrandingManager.tsx` | Správa loga, favicon, vektorových SVG assetů a integrovaný editor `VisualSvgEditor`. |
| 9 | `modules` | Module Manager | `ModuleManager.tsx` | Řízení životního cyklu modulů portálu (aktivace/deaktivace, závislosti, konfigurace). |
| 10 | `custom-modules` | JSON Moduly (Schema) | `CustomModuleManager.tsx` | Tvorba a správa vlastních modulů definovaných pomocí JSON Schema a dynamického UI formuláře. |
| 11 | `esbirka` | Administrace e-Sbírka | `EsbirkaAdminPanel.tsx` | Správa konektoru na MV ČR e-Sbírka, stav synchronizace zákonů, ruční trigger, monitorování limitů (1 req/s, 5 req/den). |
| 12 | `state-admin` | Státní data & API Hub | `StateAdminManager.tsx` | Agregátor státních dat: ČSÚ statistiky, MSp soudní data, ARES integrace, OSPOD registry, OpenData. |
| 13 | `subjekty` | Registr Subjektů | `SubjektManager.tsx` | Databáze institucí (Soudy, OSPOD, Mediátoři, Znalci, Advokáti), schvalování uživatelských podání, recenze a hodnocení. |
| 14 | `schvalovani-kontaktu` | Schvalování kontaktů | `ContactModerationManager.tsx` | Moderace uživatelských návrhů na přidání/úpravu konkrétních pracovníků (soudci, kolizní opatrovníci, OSPOD pracovníci). |
| 15 | `cms` | Obsah CMS | `CmsManager.tsx` | Zastřešující CMS manažer s 13 vnitřními sekcemi (Články, Kategorie, FAQ, Média, Odborné studie, Právní návody, Videa, Kvízy, Memento). |
| 16 | `users` | Uživatelé & RBAC | `UserManager.tsx` | Správa uživatelských účtů, přiřazování rolí, kontrola 2FA, zablokování účtů, reset hesel, propojení s Mailcow. |
| 17 | `sponsors` | Sponzoři a partneři | `PartnerManager.tsx` | Správa partnerských organizací, dárců, log, odkazů a úrovní podpory (Tiers). |
| 18 | `mailcow` | Správa E-mailů | `MailcowManager.tsx` | Integrace Mailcow API pro vytváření e-mailových schránek pro tým, aliasy, doménové routování. |
| 19 | `compliance` | Compliance Docs | `ComplianceManager.tsx` | Verzování a správa závazných právních dokumentů (GDPR, Podmínky užití, Kodex dobrovolníka, Cookies). |
| 20 | `audit` | Audit Log | `AuditLogViewer.tsx` | Prohlížeč systémových bezpečnostních logů z PostgreSQL tabulky `AuditLog` (přihlášení, změny rolí, chyby). |
| 21 | `audits` | Audit Center | `AuditCenter.tsx` | Vývojářské a QA auditní centrum DEV3: čtení a analýza markdown auditů z `docs/audit/`, sdílení a tisk. |
| 22 | `qa` | QA & Audit Syntéza | `QADashboard.tsx` | Komplexní QA orchestrátor: 6 subtabů (Dashboard, Test Runs, Findings, AI Analýza, Registry, Copilot). |
| 23 | `qa/copilot` | Synthesis Admin Copilot | `QADashboard.tsx` (subtab) | Multi-AI agent pro plánování úloh, automatickou diagnostiku chyb a asistované provádění administrátorských akcí. |
| 24 | `ai-context` | AI Context & Index | `AiContextManager.tsx` | Indexace obsahu stránek pro LLM modely, správa systémových promptů a znalostního kontextu. |
| 25 | `settings` | Systémové Nastavení | `SettingsManager.tsx` | Globální parametry systému, SMTP konfigurace, systémové přepínače, cache invalidace. |
| 26 | `dns` | Správa DNS | `DnsManagementPage.tsx` | Správa DNS záznamů na Vercel API (A, CNAME, TXT, MX pro doménu `tatovacesta.cz` a subdomény). |
| 27 | `github` | GitHub Publisher | `GitHubPublisher.tsx` | Automatizovaný nástroj pro přímé publikování commitů a synchronizaci do GitHub repozitáře (`SUPER_ADMIN`). |
| 28 | `vps` | VPS & Systém | `VpsManagement.tsx` | Serverový monitoring a řízení: PM2 procesy, Caddy reverzní proxy, Docker, využití CPU/RAM/disku (`SUPER_ADMIN`). |
| 29 | `tests` | E2E AI Testy | `TestRunnerCard.tsx` | Spouštěč automatizovaných E2E a Playwright testovacích scénářů přímo z administrace. |

---

## 3. B) SOUČASNÁ ROLE → PERMISSION → FUNKCE MAPA

### 3.1 Skutečné role v databázi (`prisma/schema.prisma` enum `UserRoleType`)
```prisma
enum UserRoleType {
  USER
  REGISTERED_USER
  VERIFIED_USER
  VOLUNTEER
  VERIFIED_CONTRIBUTOR
  MODERATOR
  CONTENT_MANAGER
  LEGAL_EDITOR
  ADMIN
  SYSTEM_ADMIN
  SUPER_ADMIN
}
```

### 3.2 Hierarchie oprávnění (`src/services/authService.ts`)
| Úroveň váhy | Role | Povolené role v hierarchii |
|---|---|---|
| **6 (Nejvyšší)** | `SUPER_ADMIN` | Má přístup ke všem funkcím, včetně VPS a GitHub Publisheru. |
| **5** | `SYSTEM_ADMIN`, `ADMIN` | Plná administrace, správa uživatelů, CMS, státních dat a auditů. |
| **4** | `CONTENT_MANAGER`, `LEGAL_EDITOR`, `MODERATOR` | Přístup ke specializovaným agendám (CMS publikace, schvalování subjektů, úprava právních textů). |
| **3** | `VOLUNTEER`, `VERIFIED_CONTRIBUTOR` | Týmový přístup (poradna, dobrovolnické formuláře). |
| **1–2** | `USER`, `REGISTERED_USER`, `VERIFIED_USER` | Běžný klientský uživatel (nemá přístup do Admin Shellu). |

### 3.3 Reálná oprávnění (`Permission` v PostgreSQL schématu a seedu)
1. `users.manage` (Kategorie: `AUTH`): Správa uživatelů, editace účtů, reset hesel, povyšování rolí.
2. `content.publish` (Kategorie: `CMS`): Tvorba a úprava stránek, Puck šablony, články, textový slovník.
3. `legal.edit` (Kategorie: `COMPLIANCE`): Správa závazných dokumentů, verze compliance, editace právních průvodců.
4. `system.logs` (Kategorie: `SYSTEM`): Prohlížení systémových auditních logů, QA dashboard, telemetrie.
5. `moderator.moderate` (Kategorie: `MODERATION`): Schvalování subjektů a kontaktů v registru, moderace diskuzí.
6. `system.github.publish` (Kategorie: `SYSTEM`): Přímý push a release management na GitHub (`SUPER_ADMIN`).

### 3.4 Matice přístupu k funkcím Admin Shellu
| Admin oblast / modul | Minimální vyžadovaná role | Vyžadované Permission | Vyžadováno 2FA (MFA) |
|---|---|---|---|
| **Přehled / Dashboard** | `ADMIN` / `SYSTEM_ADMIN` | `system.logs` nebo `ADMIN` | ANO |
| **Obsah & CMS (Puck, Stránky, Texty, Témata)** | `CONTENT_MANAGER` / `ADMIN` | `content.publish` | ANO |
| **Právní texty & Compliance** | `LEGAL_EDITOR` / `ADMIN` | `legal.edit` | ANO |
| **Registr & Moderace kontaktů** | `MODERATOR` / `ADMIN` | `moderator.moderate` | ANO |
| **e-Sbírka & Státní data** | `ADMIN` / `LEGAL_EDITOR` | `legal.edit` / `ADMIN` | ANO |
| **Uživatelé & RBAC** | `ADMIN` / `SUPER_ADMIN` | `users.manage` | ANO |
| **Analytika & Audit Log** | `ADMIN` / `SYSTEM_ADMIN` | `system.logs` | ANO |
| **Audit Center DEV3 & QA Copilot** | `ADMIN` / `SUPER_ADMIN` | `system.logs` / `ADMIN` | ANO |
| **Systémové nastavení & DNS & Mailcow** | `ADMIN` / `SYSTEM_ADMIN` | `system.logs` / `ADMIN` | ANO |
| **GitHub Publisher & VPS Management** | `SUPER_ADMIN` | `system.github.publish` / `SUPER_ADMIN` | ANO (Vynuceno) |

---

## 4. C) NÁVRH NOVÉHO ADMIN SHELL STROMU (8 HLAVNÍCH OBLASTÍ)

Nový Admin Shell nahradí 28 plochých tlačítek **strukturovaným hierarchickým sidebarem** s 8 hlavními sekcemi, rychlým vyhledáváním a přehlednými indikátory stavu:

```
ADMIN SHELL (Táta má právo Control Panel)
├── 🔍 [Vyhledat v administraci... (Ctrl+K / ⌘K)]
│
├── 1. 📊 PŘEHLED (Overview & Status)
│   ├── 1.1 Dashboard (Přehled stavu, aktivní metriky, rychlé akce)
│   ├── 1.2 Stav systému (VPS, PostgreSQL, API konektory, Caddy)
│   └── 1.3 Důležitá upozornění (Bezpečnostní incidenty, čekající schválení)
│
├── 2. 📝 OBSAH & CMS (Content Management)
│   ├── 2.1 Správa stránek (Puck Visual Page List)
│   ├── 2.2 Šablony stránek (Puck Template Engine)
│   ├── 2.3 Články & Poradna (Blog, aktuality, kategorie, FAQ)
│   ├── 2.4 Multimédia & Vzdělávání (Studie, Wiki, Právní návody, Videa, Kvízy, Memento)
│   ├── 2.5 Text Manager (Slovník ContentString CZ/EN)
│   ├── 2.6 Theme, Barvy & Branding (Barevné presety, Logo, Visual SVG Editor)
│   ├── 2.7 Média & Soubory (Správa nahraných souborů a assetů)
│   └── 2.8 Dynamické JSON Moduly (Custom Module Schema UI)
│
├── 3. 👥 UŽIVATELÉ & PŘÍSTUPY (Identity & Access)
│   ├── 3.1 Seznam uživatelů (Vyhledávání, filtry, stav účtů, reset hesel)
│   ├── 3.2 Role & RBAC matice (Správa oprávnění, 2FA požadavky)
│   └── 3.3 Schvalování & Verifikace (Žádosti o roli dobrovolníka / editora)
│
├── 4. ⚖️ PRÁVO & STÁTNÍ DATA (Legal & State Data)
│   ├── 4.1 e-Sbírka (MV ČR konektor, synchronizace právních předpisů, limity)
│   ├── 4.2 Státní data & API Hub (ČSÚ, MSp, ARES, OSPOD OpenData)
│   ├── 4.3 Registr subjektů (Soudy, OSPOD, Znalci, Mediátoři, Advokáti)
│   └── 4.4 Schvalování kontaktů & recenzí (Moderace uživatelských podání)
│
├── 5. 🤖 AI & AUTOMATIZACE (AI & Automation Center)
│   ├── 5.1 Synthesis Admin Copilot (Multi-AI agent pro asistovanou správu)
│   ├── 5.2 AI Context & Index (LLM znalostní báze, systémové prompty, indexace)
│   ├── 5.3 QA Orchestrátor (Analýza integrity stránek, automatické audity)
│   └── 5.4 E2E Testy & Playwright Runner (Automatizované testovací scénáře)
│
├── 6. 📈 ANALYTIKA & AUDIT (Analytics, Logs & Quality)
│   ├── 6.1 Analytika & Návštěvnost (0-PII telemetrie, metriky, konverze)
│   ├── 6.2 Audit Log (Systémové bezpečnostní logy v PostgreSQL databázi)
│   ├── 6.3 Audit Center DEV3 (Prohlížeč markdown reportů z docs/audit/)
│   ├── 6.4 Compliance & Právní dokumenty (GDPR, Podmínky, Kodex)
│   └── 6.5 Partneři & Sponzoři (Správa sponzorských profilů a úrovní)
│
├── 7. ⚙️ SYSTÉM & DEVSECOPS (System & Operations)
│   ├── 7.1 Systémové Nastavení (Globální konfigurace, SMTP, přepínače)
│   ├── 7.2 Module Manager (Zapínání a vypínání základních modulů portálu)
│   ├── 7.3 Správa E-mailů (Mailcow API konektor, poštovní schránky a aliasy)
│   ├── 7.4 Správa DNS (Vercel DNS management, záznamy a domény)
│   ├── 7.5 VPS & Serverový stav [SUPER_ADMIN] (PM2, Caddy, procesy, hardware)
│   └── 7.6 GitHub Publisher [SUPER_ADMIN] (Push a release management)
│
└── 8. 🏛️ TEAM CENTER (Vyhrazený slot pro budoucí týmový hub)
    └── 8.1 [SLOT] Týmový přehled (Zatím neaktivní - rezervováno pro Phase 04+)
```

---

## 5. D) PŘIŘAZENÍ KAŽDÉ SOUČASNÉ FUNKCE DO NOVÉ OBLASTI

| Původní tab v `AdminDashboard.tsx` | Nová sekce v Admin Shellu | Podsekce / Cílová komponenta | Poznámka k transformaci |
|---|---|---|---|
| `overview` | **1. Přehled** | 1.1 Dashboard + 1.2 Stav systému | Zachováno, zpřehledněno o agregované metriky. |
| `pages` | **2. Obsah & CMS** | 2.1 Správa stránek | `AdminPagesList` (Puck). |
| `templates` | **2. Obsah & CMS** | 2.2 Šablony stránek | `TemplateManager`. |
| `page-builder` | **2. Obsah & CMS** | 2.1 (Editor mód) | `AdminPageBuilder` (otevírá se při editaci/tvorbě). |
| `cms` (Articles, Categories, FAQs) | **2. Obsah & CMS** | 2.3 Články & Poradna | Vyjmuto z monolitického `CmsManager`. |
| `cms` (Studies, Wiki, Guides, Videos, Quizzes, Memento) | **2. Obsah & CMS** | 2.4 Multimédia & Vzdělávání | Logické seskupení edukačních modulů. |
| `texts` | **2. Obsah & CMS** | 2.5 Text Manager | `TextManager`. |
| `theme` + `branding` | **2. Obsah & CMS** | 2.6 Theme, Barvy & Branding | Sloučeno do společného vizuálního centra. |
| `custom-modules` | **2. Obsah & CMS** | 2.8 Dynamické JSON Moduly | `CustomModuleManager`. |
| `users` | **3. Uživatelé & Přístupy** | 3.1 Seznam uživatelů + 3.2 RBAC | `UserManager` (s filtry rolí a 2FA). |
| `esbirka` | **4. Právo & Státní data** | 4.1 e-Sbírka | `EsbirkaAdminPanel`. |
| `state-admin` | **4. Právo & Státní data** | 4.2 Státní data & API Hub | `StateAdminManager`. |
| `subjekty` | **4. Právo & Státní data** | 4.3 Registr subjektů | `SubjektManager`. |
| `schvalovani-kontaktu` | **4. Právo & Státní data** | 4.4 Schvalování kontaktů | `ContactModerationManager`. |
| `qa/copilot` | **5. AI & Automatizace** | 5.1 Synthesis Admin Copilot | Samostatný hlavní vstup do AI Copilota. |
| `ai-context` | **5. AI & Automatizace** | 5.2 AI Context & Index | `AiContextManager`. |
| `qa` | **5. AI & Automatizace** | 5.3 QA Orchestrátor | `QADashboard` (Runs, Findings, Registry). |
| `tests` | **5. AI & Automatizace** | 5.4 E2E Testy | `TestRunnerCard`. |
| `analytics` | **6. Analytika & Audit** | 6.1 Analytika & Návštěvnost | `AnalyticsManager`. |
| `audit` | **6. Analytika & Audit** | 6.2 Audit Log (DB) | `AuditLogViewer`. |
| `audits` | **6. Analytika & Audit** | 6.3 Audit Center DEV3 | `AuditCenter`. |
| `compliance` | **6. Analytika & Audit** | 6.4 Compliance Docs | `ComplianceManager`. |
| `sponsors` | **6. Analytika & Audit** | 6.5 Partneři & Sponzoři | `PartnerManager`. |
| `settings` | **7. Systém & DevSecOps** | 7.1 Systémové Nastavení | `SettingsManager`. |
| `modules` | **7. Systém & DevSecOps** | 7.2 Module Manager | `ModuleManager`. |
| `mailcow` | **7. Systém & DevSecOps** | 7.3 Správa E-mailů | `MailcowManager`. |
| `dns` | **7. Systém & DevSecOps** | 7.4 Správa DNS | `DnsManagementPage`. |
| `vps` | **7. Systém & DevSecOps** | 7.5 VPS & Serverový stav | `VpsManagement` (`SUPER_ADMIN`). |
| `github` | **7. Systém & DevSecOps** | 7.6 GitHub Publisher | `GitHubPublisher` (`SUPER_ADMIN`). |
| *(nový slot)* | **8. Team Center** | 8.1 [Slot] Týmový přehled | Pouze architektonický placeholder. |

---

## 6. E) IDENTIFIKOVANÉ DUPLICITY

V současném kódu byly nalezeny následující duplicitní nebo překrývající se části:

1. **Vizuální správa stránek vs. starý sekční editor:**
   - `pages` tab používá moderní vizuální editor Puck (`AdminPagesList` + `AdminPageBuilder`).
   - `cms` tab uvnitř `CmsManager.tsx` obsahuje starou sub-záložku `pages` (editace sekcí `hero`, `about`, `cta` ve starém formátu).
   - **Doporučení pro Phase 03B:** Starou sub-záložku v `CmsManager` bezpečně deaktivovat nebo přesměrovat na `AdminPagesList`, aby nedocházelo ke zmatení administrátora.

2. **Editor navigace v DB vs. `src/config/navigation.ts`:**
   - `CmsManager.tsx` obsahuje subtab `nav` pro ruční přidávání navigačních položek do DB tabulky `NavItem`.
   - Projekt však ve Phase 02 přešel na striktně typovaný `src/config/navigation.ts` s dynamickým RBAC filtrem `getVisibleNavItems`.
   - **Doporučení pro Phase 03B:** Označit DB editor navigace jako legacy / archiv, nebo jej provázat s importem z centrální konfigurace.

3. **Spouštění testů na třech místech:**
   - `TestRunnerCard` je zobrazen na hlavní ploše `overview`.
   - `TestRunnerCard` je zároveň samostatným tabem v levém menu (`tests`).
   - `QADashboard` (`qa`) obsahuje vlastní testovací a auditní spouštěč.
   - **Doporučení pro Phase 03B:** Sjednotit do sekce **5. AI & Automatizace** (`5.4 E2E Testy & Test Runner`), přičemž na dashboardu `1.1` zůstane pouze kompaktní stavový widget.

---

## 7. F) ŠPATNĚ UMÍSTĚNÉ FUNKCE V PŮVODNÍM NÁVRHU

1. **`sponsors` (PartnerManager):**
   - V původním `AdminDashboard.tsx` byl umístěn mezi `users` a `mailcow`. Nemá žádnou souvislost s uživatelskými účty ani e-maily.
   - Patří do **Obsahu / Analytiky & Partnerství**.
2. **`dns` (Správa DNS):**
   - Původně byl zařazen pod `settings` v náhodném pořadí.
   - Patří do **7. Systém & DevSecOps** vedle `mailcow` a `vps`.
3. **`branding` a `theme`:**
   - Dvě oddělená tlačítka v horní části menu.
   - Patří společně pod **2.6 Theme, Barvy & Branding** s přepínáním záložek.
4. **`schvalovani-kontaktu` a `subjekty`:**
   - Byly umístěny mezi JSON moduly a CMS.
   - Patří logicky pod **4. Právo & Státní data** (Registr a moderace institucí).

---

## 8. G) CHYBĚJÍCÍ PRVKY V SOUČASNÉM ADMIN DASHBOARDU

1. **Rychlé vyhledávání (Quick Search / Command Palette):**
   - Při 28+ funkcích chybí možnost stisknout `Ctrl+K` a rychle vyhledat funkci (např. "e-Sbírka", "DNS", "Puck").
2. **Konzistentní stavové breadcrumbs a URL routing:**
   - Část funkcí se přepíná čistě lokálním React statem (`setActiveTab`), zatímco jiné mění URL (`/admin/pages`, `/admin/dns`, `/administrace/qa`).
   - Je žádoucí sjednotit deep-linking do formátu `/admin/:section/:subsection` (např. `/admin/cms/pages`, `/admin/legal/esbirka`, `/admin/system/dns`).
3. **Vizuální indikátory úrovně oprávnění:**
   - Uživatel s rolí `CONTENT_MANAGER` nevidí, proč jsou některá tlačítka nepřístupná.
   - Je vhodné doplnit štítky oprávnění (např. `SUPER_ADMIN ONLY`, `MODERATION`).

---

## 9. H) NÁVRH ROZŠIŘITELNOSTI PRO BUDOUCÍ MODULY (EXTENSIBILITY)

Architektura nového Admin Shellu bude založena na **deklarativním konfiguračním poli `ADMIN_NAV_SECTIONS`**:

```typescript
export interface AdminNavSection {
  id: string;
  title: string;
  icon: LucideIcon;
  badge?: string;
  requiredRole?: UserRole;
  requiredPermission?: string;
  items: AdminNavItem[];
}

export interface AdminNavItem {
  id: string;
  title: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
  requiredRole?: UserRole;
  requiredPermission?: string;
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.FC<any>;
}
```

Tento model umožní:
1. **Lazy Loading:** Jednotlivé rozsáhlé manažery (např. `QADashboard`, `VpsManagement`, `AdminPageBuilder`) budou načítány dynamicky pomocí `React.lazy()`, což radikálně zrychlí prvotní načtení administrace.
2. **Jednoduché přidání nového modulu:** Přidání nového administrativního nástroje bude znamenat pouze přidání jedné položky do příslušné sekce v konfiguraci bez nutnosti manuálně upravovat 50 řádků JSX v `AdminDashboard.tsx`.

---

## 10. I) NÁVRH TEAM CENTER SLOTU (BEZ IMPLEMENTACE FALEŠNÝCH ROLÍ)

V souladu se zadáním je pro budoucí týmovou spolupráci připraven **pouze architektonický slot**:

- **ID sekce:** `team-center`
- **Umístění:** Samostatná sekce `8. 🏛️ Team Center` na konci menu.
- **Stav:** `COMING_SOON` / Rezervovaný slot.
- **Pravidla:**
  - Žádné falešné stuby ani neexistující backendové tabulky.
  - Žádné vymýšlení nových rolí (využijí se existující role `VOLUNTEER`, `MODERATOR`, `LEGAL_EDITOR`).
  - Když administrátor klikne na tento slot, zobrazí se čistý informační panel o plánované integraci přidělování případů a týmové koordinace.

---

## 11. J) DOPORUČENÍ PRO PHASE 03B (IMPLEMENTAČNÍ FÁZE)

Pro hladký a bezpečný průběh implementace ve Phase 03B doporučuji:

1. **Vytvořit konfigurační soubor `src/config/adminNavigation.ts`:**
   - Definovat 8 hlavních oblastí a jejich podpoložky s přesnými RBAC filtry.
2. **Vytvořit modulární layout komponenty:**
   - `src/components/admin/layout/AdminShell.tsx` (hlavní kontejner s responzivním sidebarem, hlavičkou, vyhledáváním a obsahem).
   - `src/components/admin/layout/AdminSidebar.tsx` (hierarchické seskupení, skládací sekce Accordion/Collapsible, vyhledávání).
   - `src/components/admin/layout/AdminHeader.tsx` (uživatelský profil, role, stav 2FA, odkaz zpět na portál).
3. **Zachovat zpětnou kompatibilitu všech existujících URL:**
   - URL jako `/admin/pages`, `/admin/pages/new`, `/admin/dns`, `/administrace/qa`, `/administrace/qa/copilot` a `/administrace/audity` musí zůstat 100% funkční a automaticky otevřít odpovídající sekci a podsekci v novém layoutu.
4. **Postupná integrace bez mazání funkčního kódu:**
   - Všechny existující manažery (`TextManager`, `ThemeManager`, `EsbirkaAdminPanel`, `UserManager` atd.) zůstanou zachovány v plném rozsahu, pouze budou přehledně zasazeny do nových rámců.
5. **Zero secrets & P0 Security:**
   - Zachovat striktní server-side ochranu na straně Express API middleware.

---

## 12. VÝSLEDEK AUDITU & SCHVALOVACÍ CHECKPOINT

- **Status Phase 03A:** **DOKONČENO (ANALÝZA & INFORMAČNÍ ARCHITEKTURA HOTOVA)**
- **Změny v kódu:** **0 řádků v UI (Striktní dodržení Zero Code Modifications ve fázi IA)**
- **Git stav:** Pracovní strom čistý, audit připraven k commitu a pushi na vývojovou větev.
- **Následující krok:** Zastavení prací, čekání na posouzení a schválení architektury uživatelem před zahájením Phase 03B.
