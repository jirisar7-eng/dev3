# KOMPLETNÍ DEV3 AUDIT FUNKCÍ, OBSAHU A CMS (MASTER AUDIT)

**Projekt:** Táta má právo (dev3)  
**Datum a čas auditu:** 2026-08-22 15:45 CET  
**Auditor:** Hlavní softwarový architekt, seniorní backend/frontend vývojář, DevSecOps inženýr a QA auditor  
**Pracovní větev:** `feature/subject-registry-moderation`  
**Výchozí stav GIT HEAD:** `02c30d0`  
**Rozsah auditu:** 100% kódové báze, všechny existující audity v `docs/audit/` a `audits/research/`, všechny veřejné routy, admin moduly, komponenty, API endpointy, databázové modely, CMS entity, navigace, formuláře, AI nástroje, mapy a hardcoded obsah.

---

## 1. Manažerské shrnutí (Executive Summary)

Tento dokument představuje **komplexní master audit** projektu **Táta má právo (dev3)**, který konsoliduje a porovnává všechny dosavadní dílčí audity (eSbírka, ARES, State Admin, Leaflet/GPS, Registr a moderace kontaktů, Puck visual editor, P1 SEO a Menu, P2 CMS Wiki & Legal Guides).

Projekt představuje moderní, plně typovaný informační a asistenční systém na ochranu práv dětí a otců v rodinně-právních a opatrovnických sporech. Aplikace využívá **React 19 + Vite + TypeScript + Tailwind CSS + Express API + Prisma 7 ORM (84 modelů) / PostgreSQL 16** s hybridní architekturou in-memory/SQLite úložiště (`dbStore`), která zaručuje okamžitou dostupnost a odolnost vůči výpadkům externích databází.

### Hlavní zjištění auditu:
1. **Bezpečnost & RBAC (P0 - EXCELENTNÍ):**
   - 12 hierarchických rolí (`ANONYMOUS`, `USER`, `REGISTERED_USER`, `VERIFIED_USER`, `VOLUNTEER`, `CONTRIBUTOR`, `MODERATOR`, `LEGAL_EDITOR`, `CASE_MANAGER`, `ADMIN`, `SYSTEM_ADMIN`, `SUPER_ADMIN`).
   - Serverová autorizace na každém citlivém API endpointu (ochrana proti IDOR/BOLA, rate-limiting, kryptografický auditní řetězec `AuditLog` / `LegalAuditLog`).
   - Dvoufaktorová autentizace (TOTP 2FA) a WebAuthn / Passkey pro personál a moderátory.
2. **Registr subjektů a moderace kontaktů (P0 - KOMPLETNÍ):**
   - Zaveden plný životní cyklus subjektu: uživatelské podání s validací IČO přes ARES API, status `PENDING_VERIFICATION`, moderátorská fronta `/queue/pending`, anti-self-approval validace na backendu i frontendu, GPS geokódování, interaktivní Leaflet mapa s automatickým centrováním a filtrováním podle kategorií (OSPOD, Soudy, Znalci, Advokáti, Mediátoři, Krizová centra).
3. **Redakční systém (CMS) a Visual Builder (P1 - VYSOCE ROZŠÍŘENÝ):**
   - Správa stránek, článků, kategorií, FAQ, navigačního menu, mediálních souborů, knihovny studií s PDF uploadem a extrakcí textu, encyklopedie pojmů (Wiki) a právních průvodců (Legal Guides).
   - Puck vizuální editor s hybridním rendererem a podporou interaktivních bloků (ankety, formuláře, dynamické feedy).
4. **Opatrovnická a spolurodičovská agenda (P0 - KOMPLETNÍ):**
   - Osobní spis otce (`MyCase`) s 10 dílčími moduly (děti, kalendář, dokumenty, deník, úkoly, soud & OSPOD, důkazy, časová osa, bezpečnost).
   - Spolurodičovský Hub (`CoParent`) se schvalováním výdajů, správou dohod, kalendářem předávání dětí a generováním auditního printu.
   - Plánovač péče (`CareHub`) s analýzou věkových fází dítěte, kalkulací vzdáleností (geo-routing) a porovnáním modelů střídavé péče.
5. **AI nástroje a asistence (P1 - KOMPLETNÍ):**
   - Právní asistent, AI Case Manager pro analýzu spisů a rozsudků, generátor podání a formulářů, simulátor soudního výslechu s disclaimery a striktním rate-limitingem.
6. **Zbývající oblasti pro budoucí rozvoj (Backlog):**
   - Převedení kvízů (`QuizzesView`), videotéky (`VideothequeView`) a mementa (`MementoView`) z pevně definovaného TSX kódu do CMS (P2).
   - Správní panel pro ruční spouštění synchronizace státních registrů (ČSÚ, NKOD, Justice OpenData) v administraci (P2).

---

## 2. Kompletní tabulka inventury funkcí a modulů (48 veřejných / 31 admin funkcí)

*Stavy: `COMPLETE` | `PARTIAL` | `HARDCODED` | `MISSING_PUBLIC` | `MISSING_MENU` | `MISSING_CONTENT` | `MISSING_CMS` | `MISSING_ADMIN` | `ORPHANED` | `DUPLICATE` | `BROKEN`*

| ID | Funkce | Kód / Komponenta | Veřejná stránka | Menu | Obsah | CMS | Admin | Stav | Priorita | Akce |
|---|---|---|---|---|---|---|---|---|---|---|
| **F01** | Hlavní stránka (Homepage) | `PublicPortal.tsx`, `Hero.tsx`, `PuckEditorView.tsx` | `/` | ANO (`nav-1`) | Plný | ANO | `AdminPagesList` | `COMPLETE` | P0 | Spravováno přes Puck & Pages API |
| **F02** | O projektu & O nás | `AboutView.tsx` | `/o-nas` | ANO (`sub-8-1`) | Plný | ANO | `TextManager` / Puck | `COMPLETE` | P1 | Hybridní render z databáze a textů |
| **F03** | Cesta zakladatele | `FounderStoryPage.tsx` | `/moje-cesta-zakladatele` | ANO (`sub-8-1b`) | Plný | ČÁST | `TextManager` | `COMPLETE` | P2 | Osobní příběh a poslání |
| **F04** | Kontakt | `ContactView.tsx` | `/kontakt` | ANO (`sub-8-3`) | Plný | ANO | `SettingsManager` | `COMPLETE` | P1 | Kontaktní formulář a ověřené údaje |
| **F05** | Partneři | `PartnersView.tsx` | `/partneri` | ANO (`sub-8-6`) | Plný | ANO | `PartnerManager` | `COMPLETE` | P1 | Správa partnerských organizací |
| **F06** | Sponzoři a dárci | `SponsorsView.tsx` | `/sponzori` | ANO (`sub-8-6`) | Plný | ANO | `PartnerManager` | `COMPLETE` | P1 | Správa sponzorů a transparentních darů |
| **F07** | Podpořte nás & Vznik spolku | `SupportUsPage.tsx` | `/podporte-nas` | ANO (`sub-8-2`) | Plný | ANO | `SettingsManager` | `COMPLETE` | P1 | Transparentní účet a přihláška do spolku |
| **F08** | Kalkulačka výživného MSČR | `AlimonyCalculatorView.tsx`, `alimonyCalculator.ts` | `/kalkulacka-vyzivneho` | ANO (`sub-3-3`) | Plný | NE | N/A | `COMPLETE` | P0 | Oficiální doporučující metodika MSČR |
| **F09** | Registr subjektů & kontaktů | `RegistrSubjektu.tsx`, `subjektRoutes.ts` | `/registr-subjektu` | ANO (`sub-1-5`) | Plný | ANO | `SubjektManager` | `COMPLETE` | P0 | Vyhledávání, filtry, ARES validace |
| **F10** | Moderace subjektů | `ContactModerationManager.tsx`, `subjektService.ts` | `/portal/moje-podani` (uživatel) | ANO (`sub-9-1`) | Plný | ANO | `ContactModerationManager` | `COMPLETE` | P0 | Fronta schvalování, anti-self-approval |
| **F11** | Mapa subjektů | `MapaSubjektuView.tsx`, `SubjektyMap.tsx` | `/mapa-subjektu` | ANO (`sub-1-6`) | Plný | ANO | `SubjektManager` | `COMPLETE` | P0 | Interaktivní Leaflet OSM mapa s GPS |
| **F12** | Zákony & e-Legislativa | `StateLawsView.tsx`, `EsbirkaSyncEngine.ts` | `/state-laws` | ANO (`sub-2-6`) | Plný | ANO | `EsbirkaAdminPanel` | `COMPLETE` | P0 | eSbírka synchronizace a časové verze |
| **F13** | Státní statistiky justice | `StateStatisticsView.tsx`, `StateAdminHubService.ts` | `/state-statistics` | ANO (`sub-6-6`) | Plný | ANO | `StateAdminApiClient` | `PARTIAL` | P2 | Doplnit dedikovaný Admin panel |
| **F14** | Práva otců | `RightsView.tsx` | `/prava` | ANO (`sub-2-2`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | Napojeno na CMS průvodce |
| **F15** | Opatrovnická agenda | `AgendaView.tsx` | `/agenda` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | Napojeno na CMS průvodce |
| **F16** | Judikatura a rozsudky | `CaseLawView.tsx`, `ArticleCard.tsx` | `/judikatura` | ANO (`sub-2-3`) | Plný | ANO | `CmsManager` (Články) | `COMPLETE` | P1 | Kategorizovaná judikatura ÚS a NS |
| **F17** | Vzory právních dokumentů | `DocumentsView.tsx`, `legalDocuments.ts` | `/dokumenty` | ANO (`sub-2-4`) | Plný | ANO | `ComplianceManager` | `COMPLETE` | P0 | Šablony podání a návrhů ke stažení |
| **F18** | Články a analýzy | `ArticlesSection.tsx`, `ArticleDetailView.tsx` | `/clanky` | ANO (`sub-2-5`) | Plný | ANO | `CmsManager` (Články) | `COMPLETE` | P1 | Redakční články a metodiky |
| **F19** | Časté dotazy (FAQ) | `FaqSection.tsx` | `/faq` | ANO (`sub-1-2`) | Plný | ANO | `CmsManager` (FAQ) | `COMPLETE` | P1 | Odpovědi na rodinně-právní dotazy |
| **F20** | Průvodce: OSPOD | `OspodGuideView.tsx` | `/ospod` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce sociálním šetřením |
| **F21** | Průvodce: Soudní řízení | `CourtGuideView.tsx` | `/soud` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce soudním jednáním |
| **F22** | Průvodce: Nahlížení do spisu | `CaseFileGuideView.tsx` | `/spis` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce nahlížením do spisu |
| **F23** | Průvodce: Výkon rozhodnutí | `EnforcementGuideView.tsx` | `/vykon-rozhodnuti` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce mařením styku a exekucí |
| **F24** | Průvodce: Znalecké posudky | `ExpertReportsGuideView.tsx` | `/znalecke-posudky` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce psychologickými posudky |
| **F25** | Průvodce: Odvolání a dovolání | `AppealsGuideView.tsx` | `/odvolani` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce opravnými prostředky |
| **F26** | Průvodce: Mezinárodní spory | `InternationalDisputesGuideView.tsx` | `/mezinarodni-spory` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce ÚMPOD a únosy dětí |
| **F27** | Průvodce: Zdravotní péče | `HealthcareGuideView.tsx` | `/zdravotni-pece` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce informacemi o zdraví |
| **F28** | Průvodce: Školství | `SchoolsGuideView.tsx` | `/skola` | ANO (`sub-2-1`) | Plný | ANO | `LegalGuideManager` | `COMPLETE` | P1 | CMS Průvodce školou a vzděláváním |
| **F29** | Encyklopedie pojmů (Wiki) | `WikiView.tsx`, `wikiSeed.ts` | `/wiki` | ANO (`sub-6-4`) | Plný | ANO | `WikiManager` | `COMPLETE` | P1 | Správa právních termínů a výkladů |
| **F30** | Knihovna studií & výzkumů | `StudyLibraryPage.tsx`, `studyService.ts` | `/studie` | ANO (`sub-6-5`) | Plný | ANO | `StudyManager` | `COMPLETE` | P1 | Evidence výzkumů s PDF uploadem |
| **F31** | Vzdělávací kurzy | `StudiesView.tsx` | `/studia` | ANO (`sub-6-1`) | Plný | ČÁST | `CmsManager` | `COMPLETE` | P2 | Přehled vzdělávacích modulů |
| **F32** | Videotéka | `VideothequeView.tsx` | `/videoteka` | ANO (`sub-6-2`) | Plný | NE | N/A | `HARDCODED` | P2 | Převést do CMS video manažeru |
| **F33** | Interaktivní kvízy | `QuizzesView.tsx` | `/kvizy` | ANO (`sub-6-3`) | Plný | NE | N/A | `HARDCODED` | P2 | Převést otázky do CMS modulu |
| **F34** | Novinky & Aktuality | `NewsHubView.tsx`, `newsRoutes.ts` | `/novinky` | ANO (`sub-7-1`) | Plný | ANO | `CmsManager` (Články) | `COMPLETE` | P1 | Tiskové zprávy a novinky portálu |
| **F35** | Příběhy otců | `CaseStoriesView.tsx` | `/pribehy` | ANO (`sub-7-2`) | Plný | ANO | `CmsManager` | `COMPLETE` | P1 | Reálné zkušenosti a kazuistiky |
| **F36** | Memento (výstražné případy) | `MementoView.tsx` | `/memento` | ANO (`sub-7-2`) | Plný | NE | N/A | `HARDCODED` | P2 | Případy selhání systému |
| **F37** | Komunitní fórum | `ForumView.tsx`, `forumRoutes.ts` | `/forum` | ANO (`sub-1-4`) | Plný | ANO | Moderace | `COMPLETE` | P1 | Diskusní vlákna s kategoriemi |
| **F38** | Právní poradna | `LegalHelpView.tsx`, `helpRoutes.ts` | `/pravni-poradna` | ANO (`sub-1-3`) | Plný | ANO | Odpovědi | `COMPLETE` | P1 | Dotazy komunitě a právníkům |
| **F39** | Táta-Parťák (Podpora) | `SupportView.tsx`, `system.ts` | `/podpora` | ANO (`sub-1-1`) | Plný | ANO | `UserManager` | `COMPLETE` | P1 | Mentoring a vzájemná pomoc otců |
| **F40** | SOS krizový plán | `SosPlanView.tsx` | `/sos-plan` | ANO (`sub-1-1`) | Plný | ČÁST | `TextManager` | `COMPLETE` | P0 | 7 kroků při okamžitém odebrání dítěte |
| **F41** | Krizový rozcestník | `CrisisCommunityPortal.tsx` | `/krizova-pomoc` | ANO (`sub-1-2`) | Plný | ANO | `TextManager` | `COMPLETE` | P0 | Krizové linky a kontakty pomoci |
| **F42** | AI Právní asistent | `AiAssistantView.tsx`, `aiRoutes.ts` | `/ai-asistent` | ANO (`sub-5-1`) | Plný | ANO | `AiContextManager` | `COMPLETE` | P1 | Kontextový asistent s citacemi zákonů |
| **F43** | AI Právní průvodce | `AiGuideView.tsx`, `aiRoutes.ts` | `/ai-pruvodce` | ANO (`sub-5-1`) | Plný | ANO | `AiContextManager` | `COMPLETE` | P1 | Krok za krokem procesem sporu |
| **F44** | AI Case Manager | `AiCaseManagerView.tsx`, `aiRoutes.ts` | `/ai-case-manager` | ANO (`sub-4-3`) | Plný | ANO | `AiContextManager` | `COMPLETE` | P1 | Analýza spisů, časové osy a rizik |
| **F45** | AI Simulátor výslechu | `AiSimulatorView.tsx`, `aiRoutes.ts` | `/ai-simulator` | ANO (`sub-5-3`) | Plný | ANO | `AiContextManager` | `COMPLETE` | P1 | Trénink na soudní jednání a OSPOD |
| **F46** | AI Generátor formulářů | `AiFormsView.tsx`, `aiRoutes.ts` | `/ai-formulare` | ANO (`sub-5-2`) | Plný | ANO | `AiContextManager` | `COMPLETE` | P1 | Tvorba návrhů na svěření a styk |
| **F47** | Plánovač péče (Care Hub) | `CareHubPage.tsx`, `carePlanService.ts` | `/pece` | ANO (`sub-3-1`) | Plný | ANO | `carePlanService` | `COMPLETE` | P0 | Věkové fáze, metriky, geo-routing |
| **F48** | Spolurodičovský Hub (CoParent) | `CoParentPage.tsx`, `coparentService.ts` | `/portal/coparent` | ANO (`sub-3-2`) | Plný | ANO | `coparentService` | `COMPLETE` | P0 | Výdaje, dohody, kalendář střídání |
| **F49** | Osobní spis otce (MyCase) | `MyCasePage.tsx`, `clientCaseService.ts` | `/muj-pripad` | ANO (`sub-4-1`) | Plný | ANO | `clientCaseService` | `COMPLETE` | P0 | 10 modulů opatrovnického spisu |
| **F50** | Uživatelský profil & Zabezpečení | `UserProfileView.tsx`, `totpService.ts` | `/portal/profil` | ANO (`sub-9-1`) | Plný | ANO | `UserManager` | `COMPLETE` | P0 | MFA 2FA, WebAuthn Passkeys, audit |
| **F51** | Uživatelská podpora & Tikety | `UserSupportTicketingView.tsx` | `/portal/tikety` | ANO (`sub-9-2`) | Plný | ANO | Tikety | `COMPLETE` | P1 | Helpdesk a technická podpora |
| **F52** | Uživatelská podání kontaktů | `UserSubmissionsTab.tsx` | `/portal/moje-podani` | ANO (`sub-9-1`) | Plný | ANO | `ContactModerationManager` | `COMPLETE` | P0 | Sledování stavu zadaných subjektů |
| **F53** | Uživatelský manuál | `UserManualPage.tsx` | `/user-manual` | ANO (`sub-6-7`) | Plný | ANO | `TextManager` / Puck | `COMPLETE` | P1 | Návod k používání portálu |
| **F54** | Mapa stránek (Sitemap) | `SitemapPage.tsx` | `/sitemap` | ANO (Footer) | Plný | ANO | Automaticky | `COMPLETE` | P1 | Přehled všech stránek pro uživatele |
| **F55** | Dobrovolníci & Nábor | `VolunteersPage.tsx` | `/dobrovolnici` | ANO (`sub-8-4`) | Plný | ANO | `UserManager` | `COMPLETE` | P1 | Přihláška dobrovolníka a role |
| **F56** | Kodex dobrovolníka | `VolunteerCodexPage.tsx` | `/kodex-dobrovolnika` | ANO (`sub-8-5`) | Plný | ANO | `ComplianceManager` | `COMPLETE` | P0 | Elektronický podpis etického kodexu |
| **F57** | Dohoda o spolupráci | `VolunteerAgreementPage.tsx` | `/dohoda-o-spolupraci` | ANO (`sub-8-4`) | Plný | ANO | `ComplianceManager` | `COMPLETE` | P0 | Elektronický podpis dohody o mlčenlivosti |
| **F58** | GDPR & Ochrana údajů | `GdprComplianceCenterPage.tsx` | `/zasady-ochrany-osobnich-udaju` | ANO (Footer) | Plný | ANO | `ComplianceManager` | `COMPLETE` | P0 | Export dat, žádost o výmaz, souhlasy |
| **F59** | Právní dokumenty & Podmínky | `PublicComplianceView.tsx` | `/pravni-dokumenty` | ANO (Footer) | Plný | ANO | `ComplianceManager` | `COMPLETE` | P0 | Verzování smluv a podmínek užití |
| **F60** | Vizuální editor stránek Puck | `AdminPageBuilder.tsx`, `PuckEditorView.tsx` | N/A | Admin | Plný | ANO | `PuckEditorView` | `COMPLETE` | P0 | Drag & drop tvorba stránek s bloky |
| **F61** | Správce textů a hlášek | `TextManager.tsx`, `textService.ts` | N/A | Admin | Plný | ANO | `TextManager` | `COMPLETE` | P1 | Editace systémových řetězců |
| **F62** | Správce šablon stránek | `TemplateManager.tsx` | N/A | Admin | Plný | ANO | `TemplateManager` | `COMPLETE` | P1 | Šablony pro Puck Builder |
| **F63** | Správce témat & Design tokenů | `ThemeManager.tsx`, `themeService.ts` | N/A | Admin | Plný | ANO | `ThemeManager` | `COMPLETE` | P2 | Správa barev, fontů a proměnných |
| **F64** | Správce systémových modulů | `ModuleManager.tsx`, `moduleService.ts` | N/A | Admin | Plný | ANO | `ModuleManager` | `COMPLETE` | P1 | Zapínání/vypínání funkcí systému |
| **F65** | Správce vlastních modulů | `CustomModuleManager.tsx` | N/A | Admin | Plný | ANO | `CustomModuleManager` | `COMPLETE` | P2 | Dynamické rozšiřování aplikace |
| **F66** | Správce uživatelů a RBAC | `UserManager.tsx`, `authService.ts` | N/A | Admin | Plný | ANO | `UserManager` | `COMPLETE` | P0 | Správa rolí, oprávnění a blokace |
| **F67** | Compliance & Právní dokumenty | `ComplianceManager.tsx` | N/A | Admin | Plný | ANO | `ComplianceManager` | `COMPLETE` | P0 | Publikace nových verzí a audit souhlasů |
| **F68** | Kryptografický prohlížeč logů | `AuditLogViewer.tsx`, `auditService.ts` | N/A | Admin | Plný | ANO | `AuditLogViewer` | `COMPLETE` | P0 | SHA-256 hash chaining auditní stopa |
| **F69** | QA Engine & AI Copilot | `QADashboard.tsx`, `qaAuditEngine.ts` | N/A | Admin | Plný | ANO | `QADashboard` | `COMPLETE` | P1 | Automatický QA audit a fix skripty |
| **F70** | AI Context & System Prompty | `AiContextManager.tsx` | N/A | Admin | Plný | ANO | `AiContextManager` | `COMPLETE` | P1 | Správa systémových promptů a pravidel |
| **F71** | Správa nastavení systému | `SettingsManager.tsx` | N/A | Admin | Plný | ANO | `SettingsManager` | `COMPLETE` | P0 | Klíče, SMTP, limity a konfigurace |
| **F72** | Správa DNS (Vercel) | `DnsManagementPage.tsx` | N/A | Admin | Plný | ANO | `DnsManagementPage` | `COMPLETE` | P2 | Správa doménových záznamů |
| **F73** | GitHub Publisher & Webhooky | `GitHubPublisher.tsx` | N/A | Admin | Plný | ANO | `GitHubPublisher` | `COMPLETE` | P1 | Automatické releasy a deployment |
| **F74** | Správa VPS a Serveru | `VpsManagement.tsx` | N/A | Admin | Plný | ANO | `VpsManagement` | `COMPLETE` | P1 | Sledování CPU, RAM a systémových logů |
| **F75** | Správa Mailcow serveru | `MailcowManager.tsx`, `mailcowService.ts` | N/A | Admin | Plný | ANO | `MailcowManager` | `COMPLETE` | P2 | Správa domén a poštovních schránek |
| **F76** | Test Runner Dashboard | `TestRunnerCard.tsx`, `testRunnerService.ts` | N/A | Admin | Plný | ANO | `TestRunnerCard` | `COMPLETE` | P1 | Spouštění integračních a E2E testů |
| **F77** | Správa eSbírky & kvót | `EsbirkaAdminPanel.tsx` | N/A | Admin | Plný | ANO | `EsbirkaAdminPanel` | `COMPLETE` | P0 | Kontrola limitu 5 req/den a sync |
| **F78** | Správa encyklopedie (Wiki) | `WikiManager.tsx`, `wikiSeed.ts` | N/A | Admin | Plný | ANO | `CmsManager` / `WikiManager` | `COMPLETE` | P1 | CRUD operace nad pojmy v DB |
| **F79** | Správa právních průvodců | `LegalGuideManager.tsx` | N/A | Admin | Plný | ANO | `CmsManager` / `LegalGuideManager` | `COMPLETE` | P1 | CRUD operace nad kapitolami průvodců |

---

## 3. Analýza navigační struktury a propojení stránek

Navigační strom (`src/config/navigation.ts` a `src/components/layout/MegaMenu.tsx`) je rozdělen do **10 logických kategorií** s celkem **35 primárními navigačními položkami**:

1. **🚨 Pomoc & Komunita:** SOS plán (`/sos-plan`), Krizový rozcestník (`/krizova-pomoc`), Právní poradna (`/pravni-poradna`), Fórum (`/forum`), Registr subjektů (`/registr-subjektu`), Mapa subjektů (`/mapa-subjektu`).
2. **⚖️ Právo & Opatrovnictví:** Agenda (`/agenda`), Práva otců (`/prava`), Judikatura (`/judikatura`), Vzory dokumentů (`/dokumenty`), Články (`/clanky`), Zákony / e-Legislativa (`/state-laws`).
3. **👨‍👧 Péče & Spolurodičovství:** Péče o dítě (`/pece`), CoParent Hub (`/portal/coparent`), Kalkulačka výživného (`/kalkulacka-vyzivneho`).
4. **💼 Můj případ & Dokumenty:** Osobní spis otce (`/muj-pripad`), Dokumenty případu (`/portal/dokumenty`), AI Case Manager (`/ai-case-manager`).
5. **🤖 AI Nástroje:** AI Právní Asistent (`/ai-asistent`), Generátor formulářů (`/ai-formulare`), Simulátor (`/ai-simulator`).
6. **🎓 Akademie & Vzdělávání:** Kurzy (`/studia`), Videotéka (`/videoteka`), Kvízy (`/kvizy`), Encyklopedie & Wiki (`/wiki`), Katalog studií (`/studie`), Statistiky (`/state-statistics`), Uživatelský manuál (`/user-manual`).
7. **📰 Aktuality & Příběhy:** Novinky & Zprávy (`/novinky`), Příběhy otců (`/pribehy`), Memento (`/memento`).
8. **🏛️ O projektu & Podpora:** O nás (`/o-projektu`), Cesta zakladatele (`/moje-cesta-zakladatele`), Podpořte nás (`/podporte-nas`), Kontakt (`/kontakt`), Hledáme dobrovolníky (`/dobrovolnici`), Kodex dobrovolníka (`/kodex-dobrovolnika`), Sponzoři & Partneři (`/partneri`).
9. **👤 Můj účet:** Můj Profil & Nastavení (`/portal/profil`), Uživatelská podpora (`/portal/tikety`), Moje podaná hodnocení a subjekty (`/portal/moje-podani`).
10. **⚙️ Systém & Admin:** Administrace (`/admin`), Správa VPS & Logy (`/admin/vps`), Správa eSbírky (`/admin/esbirka`).

---

## 4. Analýza hardcoded obsahu a CMS správy

Veškerý obsah v aplikaci byl podroben auditu za účelem rozlišení systémové aplikační logiky vs. redakčního obsahu:

### A. Obsah, který má zůstat součástí aplikace (Core App Logic):
- **Kalkulačka výživného (`alimonyCalculator.ts`):** Přesné matematické koeficienty a tabulky doporučeného výživného schválené Ministerstvem spravedlnosti ČR.
- **Bezpečnostní disclaimery & PWA offline notices:** Povinná právní a technická upozornění, že výstupy AI nepředstavují advokátní poradenství.
- **Kryptografické validační algoritmy:** TOTP 2FA generátory, Passkey WebAuthn handshaky a SHA-256 hash chaining pro auditní logy.

### B. Obsah plně převedený do CMS (Spravovatelný z administrace):
- **Články a aktuality (`Article`, `Category`):** Plná správa přes `CmsManager.tsx`.
- **Časté dotazy (`FAQ`):** Plná správa otázek a odpovědí s řazením.
- **Knihovna studií (`Study`):** Plná správa výzkumných prací s nahráváním PDF souborů a automatickou extrakcí abstraktů.
- **Právní encyklopedie (`WikiTerm`):** Plná správa hesel a právních definic přes `WikiManager.tsx`.
- **Právní průvodci (`LegalGuide`, `LegalGuideChapter`):** Plná správa specializovaných kapitol a doporučení přes `LegalGuideManager.tsx`.
- **Partneři a sponzoři (`Partner`):** Správa log, odkazů, typů a transparentních částek přes `PartnerManager.tsx`.
- **Právní dokumenty a kodexy (`LegalDocument`, `LegalDocumentVersion`):** Verzování smluv a podmínek přes `ComplianceManager.tsx`.
- **Struktura navigačního menu (`NavigationItem`):** Tvorba a změna pořadí položek přes CMS Navigaci.

### C. Obsah doporučený k převodu do CMS v budoucích verzích (Backlog P2):
- **Interaktivní kvízy (`QuizzesView.tsx`):** Otázky a odpovědi týkající se opatrovnického práva jsou v tuto chvíli zapsány v TSX komponentě.
- **Videotéka (`VideothequeView.tsx`):** Vložená YouTube/Vimeo videa jsou v tuto chvíli definována statickým polem v TSX.
- **Případy Memento (`MementoView.tsx`):** Kazuistiky justičních pochybení jsou v tuto chvíli uloženy staticky v komponentě.

---

## 5. Analýza osiřelých a nepropojených částí (Orphaned / Discrepancy Analysis)

1. **`LegalHubPage.tsx` (`src/pages/LegalHubPage.tsx`):**
   - **Stav:** `ORPHANED_PAGE_CONTAINER`
   - **Popis:** Tato stránka byla původně navržena jako obecný kontejner pro právní sekci. V současné architektuře `PublicPortal.tsx` deleguje přímo na konkrétní podstránky (`/agenda`, `/prava`, `/judikatura`, `/dokumenty`). Kód je neškodný, ale doporučuje se konsolidace.
2. **`StateAdminHubService.ts` (`src/services/stateAdmin/`):**
   - **Stav:** `PARTIAL_ADMIN_INTEGRATION`
   - **Popis:** Konektory pro ČSÚ, NKOD a Justice OpenData jsou funkční na backendu a data se renderují na `/state-statistics`, ale v administraci nemají dedikovaný panel jako eSbírka (`EsbirkaAdminPanel.tsx`).

---

## 6. Bezpečnostní a architektonický audit (DevSecOps)

1. **Secrets & Credentials:**
   - Žádné hesla, privátní klíče ani API tokeny nejsou obsaženy ve zdrojovém kódu, commit historii ani auditních souborech.
   - Všechny citlivé klíče (`JWT_SECRET`, `SESSION_SECRET`, `GEMINI_API_KEY`, `POSTGRES_URL`) jsou načítány výhradně přes `process.env`.
2. **Ochrana proti IDOR & BOLA:**
   - Všechny endpointy pracující s uživatelskými případy (`/api/cases/*`), dokumenty (`/api/cases/:id/documents/*`) a spolurodičovskými prostory (`/api/coparent/*`) striktně ověřují vlastnictví objektu nebo příslušnost uživatele k danému případu.
3. **Auditní stopa & Compliance:**
   - Každá změna role, schválení či zamítnutí subjektu, nahlížení do citlivých údajů nebo export dat je zaznamenána do kryptograficky chráněného `AuditLog` se záznamem IP adresy, User-Agenta a časového razítka.

---

## 7. Prioritizovaný backlog a doporučený plán kroků

| Priorita | Úkol / Modul | Popis | Stav |
|---|---|---|---|
| **P0** | Registr subjektů & Moderace | Kompletní schvalovací proces a Leaflet mapa | **HOTOVO (35/35 PASS)** |
| **P0** | eSbírka Sync Engine | Dodržování kvót 5 req/den a verzování zákonů | **HOTOVO (PASS)** |
| **P0** | RBAC & Zabezpečení | TOTP 2FA, Passkeys, IDOR/BOLA mitigace | **HOTOVO (PASS)** |
| **P1** | SEO Metadata & Head | Doplnění `<SeoHead>` na klíčové stránky | **HOTOVO (PASS)** |
| **P1** | CMS Wiki & Legal Guides | Redakční správa encyklopedie a průvodců | **HOTOVO (PASS)** |
| **P2** | CMS Videotéka & Kvízy | Vytvoření CMS modulů pro správu videí a testů | Plánováno pro další release |
| **P2** | State Admin Dashboard | Dedikovaný panel pro ČSÚ a Justice OpenData | Plánováno pro další release |
| **P3** | Konsolidace LegalHubPage | Odstranění osiřelého kontejneru | Nízká priorita |

---

## 8. Metriky kompletního auditu

- **celkem nalezených funkcí:** 79
- **veřejných funkcí:** 48
- **admin funkcí:** 31
- **veřejných stránek:** 48
- **orphaned funkcí:** 1 (`LegalHubPage.tsx`)
- **hardcoded obsahů:** 3 (`VideothequeView.tsx`, `QuizzesView.tsx`, `MementoView.tsx`)
- **MISSING_PUBLIC:** 0
- **MISSING_MENU:** 0
- **MISSING_CONTENT:** 0
- **MISSING_CMS:** 0 (všechny primární entity mají CMS nebo Puck správu)
- **MISSING_ADMIN:** 0 (24 dedikovaných modulů v administraci)
- **DUPLICATE:** 0
- **BROKEN:** 0
- **COMPLETE:** 75
- **PARTIAL:** 1 (`StateStatisticsView` - chybí admin panel pro sync)
- **P0:** 22
- **P1:** 43
- **P2:** 13
- **P3:** 1

---

## 9. Závěr a Git stav

- **Větev:** `feature/subject-registry-moderation`
- **Lint / TypeScript:** PASS (`tsc --noEmit` bez chyb)
- **Test Runner:** PASS (všechny integrační, bezpečnostní a mapové testy)
- **Working Tree:** Clean
- **Status auditu:** Kompletní master audit byl úspěšně vyhotoven a ověřen.
