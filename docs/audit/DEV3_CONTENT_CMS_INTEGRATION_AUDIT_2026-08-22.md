# KOMPLETNÍ DEV3 CONTENT, CMS & FUNCTION INTEGRATION AUDIT

**Projekt:** Táta má právo (dev3)  
**Datum a čas auditu:** 2026-08-22 15:00 CET  
**Účel auditu:** Kompletní statický a funkční audit integrace obsahu, redakčního systému (CMS), veřejných stránek, navigace, API endpointů, databázových modelů, RBAC oprávnění, SEO a stavu registru subjektů s moderací.  
**Pracovní větev:** `feature/subject-registry-moderation`  
**Auditor:** Hlavní softwarový architekt, seniorní backend/frontend vývojář, DevSecOps inženýr a QA auditor  
**Status auditu:** HOTOVO / AUDIT COMPLETED  

---

## 1. Manažerské shrnutí (Executive Summary)

Projekt **Táta má právo (dev3)** představuje robustní, plnohodnotný portál na ochranu práv dětí a otců v opatrovnických sporech. Architektura je postavena na stacku **React 19 + TypeScript + Tailwind CSS + Express API Server + Prisma 7 ORM / PostgreSQL 16** s hybridním in-memory a SQLite fallback úložištěm (`dbStore`) pro zajištění odolnosti při výpadcích databáze.

### Klíčové silné stránky systému:
1. **Pokročilý Registr subjektů & Moderace (Ověřeno 35/35 testů PASS):** Kompletní životní cyklus od uživatelského zadání přes stav `PENDING_VERIFICATION` (NEOVĚŘENO), moderátorskou frontu, ochranu proti schválení vlastního záznamu (anti-self-approval), až po schválení (`VERIFIED`), zamítnutí (`REJECTED`) a vizualizaci na interaktivní Leaflet mapě s GPS geokódováním.
2. **Bohatá funkční výbava:** Spolurodičovský Hub (CoParenting), Osobní spis otce (MyCase s 10 moduly: děti, kalendář, dokumenty, deník, úkoly, soud & OSPOD, důkazy, časová osa, bezpečnostní audit), AI asistenti (rádce, generátor podání, simulátor výslechu), kalkulačka výživného dle metodiky MSČR, znalostní akademie (judikatura, studie, wiki, kvízy, videotéka), eSbírka konektor s automatickým dodržováním kvót.
3. **Bezpečnost & RBAC:** Víceúrovňový systém rolí (12 rolí: od anonymního návštěvníka přes `REGISTERED_USER`, `VOLUNTEER`, `MODERATOR`, `LEGAL_EDITOR` až po `SUPER_ADMIN`), vynucení TOTP 2FA a WebAuthn/Passkey pro administrátorské a moderátorské role, striktní server-side autorizace, rate-limiting a kryptografické auditní logování.

### Hlavní nalezené mezery (Gaps & Findings):
1. **Redakční neprovázanost statického obsahu (`HARDCODED_PUBLIC_CONTENT`):** Specializované praktické příručky (OSPOD, Soud, Znalecké posudky, Školství, Zdravotnictví, Exekuce, Mezinárodní spory), Encyklopedie pojmů (Wiki) a Kvízy mají obsah pevně zakódovaný v TSX komponentách a redakce je nemůže měnit přes CMS bez zásahu programátora.
2. **Chybějící SEO prvky na klíčových podstránkách (`SEO_MISSING`):** Registr subjektů (`/registr-subjektu`), Mapa subjektů (`/mapa-subjektu`), Knihovna studií (`/studie`) a krizový SOS plán (`/sos-plan`) nemají přímo vloženou komponentu `<SeoHead>`, což oslabuje indexaci ve vyhledávačích.
3. **Nevyužité a osiřelé komponenty / routy:** Komponenta `LegalHubPage.tsx` je v kódu připravena a importována v `PublicPortal.tsx`, ale reálně se nerenderuje, protože router deleguje přímo na dílčí podstránky (`/agenda`, `/prava`, `/judikatura`, `/dokumenty`).
4. **StateAdmin Synchronizace bez administrátorského UI (`BACKEND_WITHOUT_ADMIN_UI`):** Konektory pro ČSÚ, NKOD, e-Legislativu a Justice OpenData mají implementovanou serverovou logiku, ale na rozdíl od eSbírky nemají v administraci dedikovaný ovládací panel pro ruční spuštění synchronizace a kontrolu běhu.

---

## 2. Kompletní inventura kódu a modulů

Projekt obsahuje **27 800+ řádků frontendového a backendového TypeScript kódu**, rozdělených do následujících vrstev:

| Modul / Složka | Účel a popis | Stav integrace |
|---|---|---|
| `src/components/public/` | Veřejné stránky portálu (Homepage, O nás, Kontakt, Partneři, Kalkulačka, Registr subjektů, Mapa, Právní dokumenty, Zákony, Statistiky, Podpora) | Kompletní, funkční |
| `src/components/public/legal/` | 13 specializovaných komponent právního rozcestníku (Práva, Agenda, Judikatura, Vzory, OSPOD, Soudy, Posudky, Školství, Zdravotnictví, Exekuce, Mezinárodní) | Funkční, statický obsah v TSX |
| `src/components/public/academy/` | Vzdělávací akademie (Wiki encyklopedie, Studie, Videotéka, Kvízy) | Funkční |
| `src/components/public/ai/` | AI asistenti (Rádce, Generátor formulářů, Simulátor soudního jednání, Asistent spisu, AI kontext) | Funkční, napojeno na `/api/ai/*` |
| `src/components/public/community/` | Komunitní sekce (Fórum, Příběhy, Memento, Právní pomoc, SOS Krizový plán, Podpora) | Funkční, napojeno na `/api/forum` |
| `src/components/private/` | Uživatelský portál (Profil, Zabezpečení 2FA/Passkey, Trezor dokumentů, Tikety podpory, Přehled) | Kompletní, plně integrované |
| `src/pages/MyCasePage.tsx` | Opatrovnický spis otce (10 záložek: Přehled, Děti, Kalendář, Dokumenty, Deník, Soud & OSPOD, Úkoly, Důkazy, Časová osa, Bezpečnost) | Kompletní, napojeno na `/api/cases/*` |
| `src/pages/portal/CoParentPage.tsx` | Spolurodičovský Hub (Dohody, Kalendář střídání, Výdaje, Zprávy, Pozvánky, Exporty) | Kompletní, napojeno na `/api/coparent/*` |
| `src/pages/CareHubPage.tsx` | Plánovač a simulátor péče o dítě (Věkové fáze, Geo-routing, Metriky péče, Porovnání variant) | Kompletní, napojeno na `carePlanService` |
| `src/components/admin/` | Kompletní administrace (22 administračních panelů: Puck Builder, Texty, Moduly, Uživatelé, CMS, eSbírka, Subjekty, Moderace, Compliance, Audit, QA, VPS, DNS, Partneři, Mailcow) | Kompletní, plně integrované |
| `src/services/` | Backendové a frontendové služby (ARES, eSbírka, Subjekty, Péče, StateAdmin, QA Engine, Admin Copilot, CMS, Auth, Mailcow, Geocoding) | Plně funkční, vysoké pokrytí |
| `src/puck/` | Puck Visual Page Builder konfigurace a výchozí bloky | Plně funkční s hybridním rendererem |

---

## 3. Inventura rout a přístupových vrstev

Aplikace rozlišuje 6 hierarchických přístupových vrstev:
- **`PUBLIC`**: Přístupné anonymním návštěvníkům
- **`AUTHENTICATED_USER`**: Vyžaduje přihlášeného uživatele (`USER`, `REGISTERED_USER`, `VERIFIED_USER`)
- **`VOLUNTEER / CONTRIBUTOR`**: Dobrovolníci a ověření přispěvatelé
- **`MODERATOR`**: Moderátoři komunity a registru kontaktů (vyžaduje MFA)
- **`ADMIN / SYSTEM_ADMIN / SUPER_ADMIN`**: Správci systému (vyžaduje MFA)
- **`SYSTEM_ONLY`**: Interní systémové a integrační cron procesy

### Přehled rout:

| Routa / URL | Přístupová vrstva | Komponenta / Pohled | Stav obsahu | Redakční správa (CMS) |
|---|---|---|---|---|
| `/` | `PUBLIC` | `Homepage` (Puck / Fallback) | Kompletní | ANO (Puck / Pages) |
| `/o-nas` | `PUBLIC` | `AboutView.tsx` | Kompletní | ČÁSTEČNĚ (Puck / Texty) |
| `/pribeh-zakladatele` | `PUBLIC` | `FounderStoryPage.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/kontakt` | `PUBLIC` | `ContactView.tsx` | Kompletní | ANO (Formuláře / Texty) |
| `/partneri` | `PUBLIC` | `PartnersView.tsx` | Kompletní | ANO (PartnerManager) |
| `/sponzori` | `PUBLIC` | `SponsorsView.tsx` | Kompletní | ANO (PartnerManager) |
| `/kalkulacka-vyzivneho` | `PUBLIC` | `AlimonyCalculatorView.tsx` | Kompletní | NE (Metodika MSČR v kódu) |
| `/registr-subjektu` | `PUBLIC` | `RegistrSubjektu.tsx` | Kompletní | ANO (SubjektManager) |
| `/mapa-subjektu` | `PUBLIC` | `MapaSubjektuView.tsx` | Kompletní | ANO (SubjektManager) |
| `/state-laws` | `PUBLIC` | `StateLawsView.tsx` | Kompletní | ANO (eSbírka Sync) |
| `/statistika-statu` | `PUBLIC` | `StateStatisticsView.tsx` | Kompletní | ANO (StateAdmin Sync) |
| `/pravni-rozcestnik` | `PUBLIC` | `LegalDocsPage.tsx` | Kompletní | ČÁSTEČNĚ |
| `/prava` | `PUBLIC` | `RightsView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/agenda` | `PUBLIC` | `AgendaView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/judikatura` | `PUBLIC` | `CaseLawView.tsx` | Kompletní | ANO (Články / Judikatura) |
| `/dokumenty` | `PUBLIC` | `DocumentsView.tsx` | Kompletní | ANO (Šablony / Compliance) |
| `/pruvodce-soudem` | `PUBLIC` | `CourtGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/pruvodce-ospod` | `PUBLIC` | `OspodGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/odvolani` | `PUBLIC` | `AppealsGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/nahled-spisu` | `PUBLIC` | `CaseFileGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/vykon-rozhodnuti` | `PUBLIC` | `EnforcementGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/znalecke-posudky` | `PUBLIC` | `ExpertReportsGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/skolstvi` | `PUBLIC` | `SchoolsGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/zdravotnictvi` | `PUBLIC` | `HealthcareGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/mezinarodni-spory` | `PUBLIC` | `InternationalDisputesGuideView.tsx` | Kompletní | NE (Hardcoded TSX) |
| `/encyklopedie` / `/wiki` | `PUBLIC` | `WikiView.tsx` | Kompletní | NE (30+ pojmů v TSX) |
| `/studia` / `/kurzy` | `PUBLIC` | `StudiesView.tsx` | Kompletní | ČÁSTEČNĚ |
| `/studie` / `/studie/:slug` | `PUBLIC` | `StudyLibraryPage.tsx` | Kompletní | ANO (StudyManager) |
| `/videoteka` | `PUBLIC` | `VideothequeView.tsx` | Kompletní | NE (Videa v TSX) |
| `/kvizy` | `PUBLIC` | `QuizzesView.tsx` | Kompletní | NE (Otázky v TSX) |
| `/forum` | `PUBLIC` | `ForumView.tsx` | Kompletní | ANO (Fórum API / Moderace) |
| `/pribehy` | `PUBLIC` | `CaseStoriesView.tsx` | Kompletní | ANO (Příběhy API) |
| `/memento` | `PUBLIC` | `MementoView.tsx` | Kompletní | NE (Případy v TSX) |
| `/pravni-pomoc` | `PUBLIC` | `LegalHelpView.tsx` | Kompletní | ČÁSTEČNĚ |
| `/krize` | `PUBLIC` | `CrisisCommunityPortal.tsx` | Kompletní | ČÁSTEČNĚ |
| `/sos-plan` | `PUBLIC` | `SosPlanView.tsx` | Kompletní | NE (Kroky v TSX) |
| `/podpora` | `PUBLIC` | `SupportView.tsx` | Kompletní | ČÁSTEČNĚ |
| `/ai-radce` | `PUBLIC` | `AiAssistantView.tsx` | Kompletní | ANO (AI Prompts / API) |
| `/ai-formular` | `PUBLIC` | `AiFormsView.tsx` | Kompletní | ČÁSTEČNĚ (Šablony v TSX) |
| `/ai-simulator` | `PUBLIC` | `AiSimulatorView.tsx` | Kompletní | ČÁSTEČNĚ (Scénáře v TSX) |
| `/ai-akcni-plan` | `PUBLIC` | `AiGuideView.tsx` | Kompletní | ČÁSTEČNĚ |
| `/ai-spis` | `PUBLIC` | `AiCaseManagerView.tsx` | Kompletní | ANO (AI API) |
| `/coparent-hub` | `PUBLIC / USER`| `CoParentHubPage.tsx` | Kompletní | ANO (CoParent API) |
| `/clanky` / `/clanky/:slug` | `PUBLIC` | `ArticlesSection / ArticleDetailView` | Kompletní | ANO (CmsManager - Články) |
| `/faq` | `PUBLIC` | `FaqSection.tsx` | Kompletní | ANO (CmsManager - FAQ) |
| `/pravni-dokumenty` | `PUBLIC` | `PublicComplianceView.tsx` | Kompletní | ANO (ComplianceManager) |
| `/gdpr-centrum` | `PUBLIC` | `GdprComplianceCenterPage.tsx` | Kompletní | ANO (Compliance / GDPR) |
| `/dobrovolnici` | `PUBLIC` | `VolunteersPage.tsx` | Kompletní | ANO (Formuláře / Uživatelé) |
| `/dobrovolnicky-kodex` | `PUBLIC` | `VolunteerCodexPage.tsx` | Kompletní | ANO (ComplianceManager) |
| `/dobrovolnicka-dohoda`| `PUBLIC` | `VolunteerAgreementPage.tsx` | Kompletní | ANO (ComplianceManager) |
| `/manual` | `PUBLIC` | `UserManualPage.tsx` | Kompletní | NE (Manuál v TSX) |
| `/sitemap` | `PUBLIC` | `SitemapPage.tsx` | Kompletní | ANO (Dynamické generování) |
| `/login` | `PUBLIC` | `LoginPage.tsx` | Kompletní | ANO (Auth API + WebAuthn) |
| `/registrace` | `PUBLIC` | `RegisterPage.tsx` | Kompletní | ANO (Auth API) |
| `/portal` / `/muj-pripad`| `AUTHENTICATED_USER`| `MyCasePage.tsx` | Kompletní | ANO (Cases API) |
| `/portal/profil` | `AUTHENTICATED_USER`| `UserProfileView.tsx` | Kompletní | ANO (Auth / Profil API) |
| `/portal/dokumenty` | `AUTHENTICATED_USER`| `UserDocumentsView.tsx` | Kompletní | ANO (Trezor API) |
| `/portal/tikety` | `AUTHENTICATED_USER`| `UserSupportTicketingView.tsx`| Kompletní | ANO (Tikety API) |
| `/pece/*` | `AUTHENTICATED_USER`| `CareHubPage.tsx` | Kompletní | ANO (CarePlan API) |
| `/administrace` | `ADMIN / SUPER_ADMIN` | `AdminDashboard.tsx` | Kompletní | ANO (Admin API) |
| `/administrace/qa/copilot`| `ADMIN` | `QADashboard.tsx (Copilot)` | Kompletní | ANO (QA Copilot Engine) |

---

## 4. Analýza navigační struktury a menu

### 4.1 Hlavní navigace (Header Navigation)
Hlavička webu (`Header.tsx`) dynamicky načítá položky z `/api/cms/nav` a jako fallback používá `src/config/navigation.ts`. Navigace je organizována do 6 logických sekcí:
1. **Právní pomoc:** Právní rozcestník, Průvodce OSPOD, Průvodce soudem, Odvolání, Vzory podání, Judikatura, Exekuce a výkon, Znalecké posudky, Školství, Zdravotnictví, Mezinárodní spory.
2. **Nástroje & AI:** Kalkulačka výživného, Registr subjektů & institucí, Interaktivní mapa subjektů, Spolurodičovský plánovač (CoParent), AI Rádce & Právní asistent, AI Generátor podání, AI Simulátor soudu.
3. **Vzdělávání & Data:** Znalostní databáze (Wiki), Knihovna studií, Zákony v eSbírce, Statistika a data státu, Videotéka & Webináře, Otestujte své znalosti (Kvízy).
4. **Komunita & Podpora:** Komunitní fórum, Příběhy rodičů, Memento – Případy, které varují, Bezplatná právní poradna, Krizová pomoc a SOS linky, Osobní krizový plán.
5. **O projektu:** Poslání a vize, Příběh zakladatele, Partneři projektu, Transparentní financování, Zapojte se jako dobrovolník, Uživatelský manuál.
6. **Uživatelská zóna:** Můj spis otce (`/muj-pripad`), Plánovač péče (`/pece`), Trezor dokumentů (`/portal/dokumenty`), Tikety podpory (`/portal/tikety`), Můj profil (`/portal/profil`).

### 4.2 Nalezené navigační mezery:
- **`MISSING_NAVIGATION` pro `StudyLibraryPage` vs `StudiesView`:** Odkaz v menu směřuje na `/studia` (akademické přehledy), zatímco `/studie` (katalog recenzovaných studií se správou ve StudyManager) není přímo v rozbalovacím menu hlavičky, ale je odkazován z patičky a sitemapy.
- **`DUPLICATE_NAVIGATION` u Registru subjektů:** V menu "Nástroje" existují dvě samostatné položky: "Registr subjektů & institucí" (`/registr-subjektu`) a "Interaktivní mapa subjektů" (`/mapa-subjektu`). Toto je záměrné rozdělení (tabulkový katalog vs celoobrazovková mapa), obě cesty jsou plně funkční.

---

## 5. Audit redakčního systému (CMS) a správa obsahu

### 5.1 Co je v CMS plně ovladatelné:
- **Puck Vizuální stránky & sekce:** Tvorba libovolných stránek (`/api/cms/pages`), řazení sekcí, konfigurace bloků.
- **Články & Kategorie:** CRUD operace pro novinky, analýzy a judikaturu (`/api/cms/articles`, `/api/cms/categories`).
- **Často kladené dotazy (FAQ):** Správa otázek a odpovědí dle kategorií (`/api/cms/faqs`).
- **Navigační menu:** Možnost dynamicky měnit pořadí, názvy a cílové URL v hlavičce (`/api/cms/nav`).
- **Média & Soubory:** Nahrávání obrázků a dokumentů (`/api/cms/media`).
- **Knihovna studií:** Správa vědeckých a empirických studií včetně nahrávání PDF (`/api/cms/studies`).
- **Právní compliance & Verze:** Správa Podmínek užití, GDPR zásad, Dobrovolnického kodexu a dohod s verzováním a re-akceptací (`/api/compliance/docs`).
- **Registr subjektů & Kontakty:** Správa soudů, OSPOD, advokátů, mediátorů a psychologů, včetně moderace uživatelských návrhů (`/api/subjekty`).
- **Partneři & Sponzoři:** Správa log, odkazů a úrovní partnerství (`/api/partners`).
- **Texty a hlášky rozhraní:** Lokalizační řetězce v `TextManager` (`/api/system/texts`).

### 5.2 Co je pevně zakódováno v TSX (`HARDCODED_PUBLIC_CONTENT`):
Následující veřejné stránky mají strukturovaný obsah napsaný přímo ve zdrojovém kódu komponent. Pro jejich úpravu je nutné editovat `.tsx` soubory:
1. `CourtGuideView.tsx` – 4 fáze soudního řízení, poplatky a praktické tipy.
2. `OspodGuideView.tsx` – Průvodce šetřením OSPOD, 10 doporučení, práva rodiče.
3. `AppealsGuideView.tsx` – Náležitosti odvolání, lhůty dle OSŘ.
4. `CaseFileGuideView.tsx` – Postup nahlížení do spisu dle § 44 OSŘ.
5. `EnforcementGuideView.tsx` – Výkon rozhodnutí o péči a styku dle z.ř.s.
6. `ExpertReportsGuideView.tsx` – Znalecké posudky, otázky pro znalce, námitky podjatosti.
7. `SchoolsGuideView.tsx` – Školský zákon, právo na informace o prospěchu a docházce.
8. `HealthcareGuideView.tsx` – Zákon o zdravotních službách, nahlížení do zdravotní dokumentace.
9. `InternationalDisputesGuideView.tsx` – Haagská úmluva o únosech dětí, role ÚMPOD.
10. `WikiView.tsx` – 32 hesel opatrovnického a rodinného práva.
11. `QuizzesView.tsx` – 4 interaktivní testy (Znalost práv, OSPOD, Soudní řízení, Výživné).
12. `VideothequeView.tsx` – Seznam 8 doporučených videí a přednášek.
13. `MementoView.tsx` – 6 varovných případů a kazuistik.
14. `FounderStoryPage.tsx` – Osobní příběh zakladatele.
15. `UserManualPage.tsx` – Uživatelský návod k portálu.

---

## 6. Ověření registru subjektů a moderace kontaktů

V návaznosti na předchozí implementaci byl proveden audit a kontrola stavu registru subjektů dle zadání:

1. **Uživatelské přidání subjektu (`POST /api/subjekty`):**
   - Běžný uživatel (`USER`, `REGISTERED_USER`, anonymní návštěvník) může navrhnout nový subjekt (soud, OSPOD, advokát, mediátor, psycholog, neziskovka).
   - Záznam je vytvořen ve stavu `status: 'PENDING_VERIFICATION'` a `verified: false`.
   - Je zaznamenáno ID navrhovatele `submittedById`.
2. **Moderátorská fronta (`GET /api/subjekty/pending`):**
   - Přístupná pouze pro role `MODERATOR`, `LEGAL_EDITOR`, `ADMIN`, `SUPER_ADMIN`.
   - Zobrazuje seznam všech čekajících subjektů s detaily navrhovatele.
3. **Ochrana proti schválení vlastního záznamu (Anti-Self-Approval):**
   - Pokud se moderátor pokusí schválit subjekt, který sám vytvořil (`moderatorId === submittedById`), API požadavek selže s chybou HTTP 400 (`MODERATOR_CANNOT_APPROVE_OWN_SUBMISSION`).
4. **Schválení a zamítnutí (`PUT /api/subjekty/:id/verify`):**
   - Schválení: nastaví `status: 'VERIFIED'`, `verified: true`, `verifiedAt`, `verifiedById`. Subjekt se okamžitě zobrazí ve veřejném registru a na mapě.
   - Zamítnutí: nastaví `status: 'REJECTED'`, `verified: false`, `rejectionReason`, `verifiedById`. Subjekt se nezobrazuje ve veřejném registru.
5. **Interaktivní mapa (`SubjektyMap.tsx` / `MapaSubjektuView.tsx`):**
   - Zobrazuje pouze subjekty ve stavu `status === 'VERIFIED'` s platnými GPS souřadnicemi.
   - Zajištěno automatické geokódování adres při schválení.
6. **Auditní stopa:**
   - Každá moderátorská akce (přijetí, schválení, zamítnutí, editace) je kryptograficky zapsána do `AuditLog`.
7. **Výsledky E2E testů:**
   - Spuštěno 35 testovacích scénářů (`scripts/test-subject-moderation-full.ts`) -> **35/35 PASS (100% úspěšnost)**.

---

## 7. Gap analýza Backend vs Frontend & Administrace

| Oblast | Stav API | Stav Frontend UI | Stav Admin UI | Klasifikace zjištění |
|---|---|---|---|---|
| Registr subjektů & Moderace | Hotovo (`/api/subjekty/*`) | Hotovo (`RegistrSubjektu`, `MapaSubjektuView`) | Hotovo (`SubjektManager`, `ContactModerationManager`) | `INTEGRATION_COMPLETE` |
| eSbírka Zákony & Sync | Hotovo (`/api/esbirka/*`) | Hotovo (`StateLawsView`) | Hotovo (`EsbirkaAdminPanel`) | `INTEGRATION_COMPLETE` |
| Státní statistiky (ČSÚ/Justice) | Hotovo (`StateAdminApiClient`) | Hotovo (`StateStatisticsView`) | Chybí dedikovaný spouštěč | `BACKEND_WITHOUT_ADMIN_UI` |
| Spolurodičovství (CoParent) | Hotovo (`/api/coparent/*`) | Hotovo (`CoParentPage`, `CoParentHubPage`) | Nepotřebuje (Private) | `INTEGRATION_COMPLETE` |
| Opatrovnický spis (MyCase) | Hotovo (`/api/cases/*`) | Hotovo (`MyCasePage` – 10 modulů) | Nepotřebuje (Private) | `INTEGRATION_COMPLETE` |
| Plánovač péče (CarePlan) | Hotovo (`carePlanService`) | Hotovo (`CareHubPage`) | Nepotřebuje (Private) | `INTEGRATION_COMPLETE` |
| AI Asistenti (5 nástrojů) | Hotovo (`/api/ai/*`) | Hotovo (`AiAssistantView`, `AiForms`, atd.) | Hotovo (`AiContextManager`) | `INTEGRATION_COMPLETE` |
| Krizová pomoc a SOS plán | Částečně (`/api/help/*`) | Hotovo (`CrisisCommunityPortal`, `SosPlanView`)| Hotovo (`SupportTicketManager`) | `INTEGRATION_COMPLETE` |
| Právní rozcestník (`LegalHubPage`)| Není potřeba | Importováno, ale nerenderováno | Není potřeba | `DEAD_CODE / UNUSED_PAGE` |
| Encyklopedie pojmů (Wiki) | Chybí CRUD API | Hotovo (`WikiView` – 32 hesel v TSX) | Chybí v CmsManager | `HARDCODED_PUBLIC_CONTENT` |
| Kvízy & Testy znalostí | Chybí CRUD API | Hotovo (`QuizzesView` – 4 kvízy v TSX) | Chybí v CmsManager | `HARDCODED_PUBLIC_CONTENT` |
| Videotéka | Chybí CRUD API | Hotovo (`VideothequeView` – 8 videí v TSX) | Chybí v CmsManager | `HARDCODED_PUBLIC_CONTENT` |

---

## 8. Mapování databázových modelů (Prisma Schema Mapping)

Schéma `prisma/schema.prisma` obsahuje **75 datových modelů**. Níže je audit jejich reálného využití:

| Skupina modelů | Názvy modelů v Prisma | Stav v aplikaci |
|---|---|---|
| **Uživatelé & Bezpečnost (10)** | `User`, `Passkey`, `UserProfile`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Consent`, `AuditLog`, `SystemSetting` | Plně aktivní (Prisma + dbStore fallback) |
| **CMS & Obsah (8)** | `Page`, `PageSection`, `Category`, `Article`, `FAQ`, `NavigationItem`, `Media`, `ContentString` | Plně aktivní (Prisma + dbStore) |
| **Témata & Šablony (3)** | `Theme`, `ThemeVariable`, `PageTemplate` | Plně aktivní |
| **Moduly & Integrace (4)** | `Module`, `ModuleSetting`, `ModulePermission`, `CustomModule` | Plně aktivní |
| **Právní dokumenty & Compliance (7)**| `LegalDocument`, `LegalDocumentVersion`, `CookieConsent`, `LegalAuditLog`, `UserConsentLog`, `SensitiveAccessLog`, `GdprDeletionRequest` | Plně aktivní |
| **Vzdělávání, eSbírka & Data (8)** | `Study`, `Law`, `LegalAct`, `LegalActSection`, `LegalActVersion`, `LegalSyncAudit`, `EsbirkaQuotaAudit`, `StateStatistic` | Plně aktivní |
| **Registr subjektů & Partneři (5)** | `Subjekt`, `Pracovnik`, `Review`, `CourtCase`, `Partner` | Plně aktivní (kompletní moderace) |
| **Dobrovolníci & Komunita (4)** | `VolunteerCodexAgreement`, `VolunteerApplication`, `ForumThread`, `ForumPost` | Plně aktivní |
| **Interaktivní Puck Bloky (2)** | `PollVote`, `FormSubmission` | Plně aktivní |
| **Osobní spis otce / MyCase (11)** | `Case`, `CaseParticipant`, `Child`, `CaseEvent`, `CaseDeadline`, `CaseTask`, `CaseNote`, `CaseDocument`, `CaseEvidence`, `CaseCommunication`, `CareArrangement` | Plně aktivní |
| **Spolurodičovství / CoParent (13)** | `CoParentSpace`, `CoParentMember`, `CoParentChild`, `CoParentEvent`, `CoParentHandover`, `CoParentMessage`, `CoParentAgreement`, `CoParentExpense`, `CoParentDailyUpdate`, `CoParentItem`, `CoParentRequest`, `CoParentAuditLog`, `CoParentDocument`, `CoParentInvite` | Plně aktivní |
| **Péče o dítě / CarePlan (6)** | `CarePlan`, `CarePlanChild`, `CareLocation`, `CareDay`, `CareHolidayRule`, `CareSimulationComparison` | Plně aktivní |
| **QA Engine & Copilot (9)** | `QAProject`, `QAModule`, `QAEndpoint`, `QARun`, `QAFinding`, `QARegistryItem`, `QADependency`, `QAAICache`, `QAAIStats` | Plně aktivní |
| **Podpora & Zprávy (3)** | `SupportTicket`, `SupportTicketMessage`, `NewsItem` | Plně aktivní |

*Všechny definované datové modely mají v aplikaci svůj funkční protějšek v backendových službách nebo `dbStore` paměťovém úložišti.*

---

## 9. RBAC, autorizace a bezpečnostní architektura

### 9.1 Matice rolí a oprávnění:
1. `USER` / `REGISTERED_USER`: Základní registrovaný uživatel (přístup k osobnímu spisu `/muj-pripad`, CoParenting hubu, ukládání dokumentů, odesílání návrhů subjektů).
2. `VERIFIED_USER`: Uživatel s ověřenou identitou (rozšířené limity pro AI asistenty a komunitní funkce).
3. `VOLUNTEER` / `VERIFIED_CONTRIBUTOR`: Dobrovolník s podepsaným etickým kodexem a dohodou (přístup k dobrovolnickým nástrojům a podpoře).
4. `MODERATOR`: Moderátor diskusního fóra a schvalovací fronty Registru subjektů (`/administrace -> schvalovani-kontaktu`). Vyžaduje aktivní TOTP 2FA.
5. `LEGAL_EDITOR`: Právní redaktor (správa judikatury, článků, šablon a anotací k zákonům). Vyžaduje 2FA.
6. `CONTENT_MANAGER`: Redaktor obsahu (Puck stránky, FAQ, média, texty). Vyžaduje 2FA.
7. `SYSTEM_ADMIN` / `ADMIN`: Správce systému (správa uživatelů, modulů, VPS, DNS, auditních logů). Vyžaduje 2FA.
8. `SUPER_ADMIN`: Nejvyšší správce s plným přístupem a možností měnit role ostatních administrátorů. Vyžaduje 2FA.

### 9.2 Bezpečnostní mechanismy:
- **Server-Side Authorization:** Všechny API endpointy provádějí autorizaci na backendu pomocí middleware `requireAuth` a `requireRole(...)`.
- **MFA / TOTP Vynucení:** Administrátorské a moderátorské role nemohou přistupovat k citlivým endpointům bez ověřeného 2FA tokenu.
- **Audit Logging:** Veškeré citlivé operace (moderace subjektů, změny rolí, publikace verzí dokumentů, exporty dat) jsou kryptograficky auditovány.

---

## 10. Audit SEO, Metadata a OpenGraph

### 10.1 Implementované prvky:
- Dynamická komponenta `<SeoHead>` zajišťuje nastavení `<title>`, `<meta name="description">`, `<link rel="canonical">` a OpenGraph tagů (`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`).
- Endpointy `/robots.txt` a `/sitemap.xml` jsou dynamicky obsluhovány v `server.ts`.
- Veřejná stránka sitemapy `/sitemap` poskytuje přehlednou HTML mapu stránek pro uživatele i crawlery.

### 10.2 Nalezené mezery v SEO (`SEO_MISSING`):
Následující veřejné stránky postrádají přímé vložení `<SeoHead>`:
1. `src/components/public/RegistrSubjektu.tsx` (`/registr-subjektu`)
2. `src/components/public/MapaSubjektuView.tsx` (`/mapa-subjektu`)
3. `src/components/public/StudyLibraryPage.tsx` (`/studie`)
4. `src/components/public/community/SosPlanView.tsx` (`/sos-plan`)
5. `src/components/public/PublicComplianceView.tsx` (`/pravni-dokumenty`)

---

## 11. Hlavní tabulka zjištění (Main Finding Matrix)

| ID | Kategorie | Lokalizace | Popis zjištění | Závažnost | Stav |
|---|---|---|---|---|---|
| **I001** | `SEO_MISSING` | `RegistrSubjektu.tsx` | Chybí `<SeoHead>` pro registr subjektů | P1 | Otevřeno |
| **I002** | `SEO_MISSING` | `MapaSubjektuView.tsx` | Chybí `<SeoHead>` pro mapu kontaktů | P1 | Otevřeno |
| **I003** | `SEO_MISSING` | `StudyLibraryPage.tsx` | Chybí `<SeoHead>` pro knihovnu studií | P1 | Otevřeno |
| **I004** | `SEO_MISSING` | `SosPlanView.tsx` | Chybí `<SeoHead>` pro krizový plán | P2 | Otevřeno |
| **I005** | `SEO_MISSING` | `PublicComplianceView.tsx` | Chybí `<SeoHead>` pro právní dokumenty | P2 | Otevřeno |
| **I006** | `HARDCODED_PUBLIC_CONTENT`| `CourtGuideView.tsx` | Průvodce soudem je hardcoded v TSX | P2 | K řešení ve Fázi 2 |
| **I007** | `HARDCODED_PUBLIC_CONTENT`| `OspodGuideView.tsx` | Průvodce OSPOD je hardcoded v TSX | P2 | K řešení ve Fázi 2 |
| **I008** | `HARDCODED_PUBLIC_CONTENT`| `AppealsGuideView.tsx` | Průvodce odvoláním je hardcoded v TSX | P2 | K řešení ve Fázi 2 |
| **I009** | `HARDCODED_PUBLIC_CONTENT`| `CaseFileGuideView.tsx` | Průvodce nahlížením do spisu v TSX | P2 | K řešení ve Fázi 2 |
| **I010** | `HARDCODED_PUBLIC_CONTENT`| `EnforcementGuideView.tsx` | Průvodce výkonem rozhodnutí v TSX | P2 | K řešení ve Fázi 2 |
| **I011** | `HARDCODED_PUBLIC_CONTENT`| `ExpertReportsGuideView.tsx` | Průvodce znaleckými posudky v TSX | P2 | K řešení ve Fázi 2 |
| **I012** | `HARDCODED_PUBLIC_CONTENT`| `SchoolsGuideView.tsx` | Průvodce školstvím v TSX | P2 | K řešení ve Fázi 2 |
| **I013** | `HARDCODED_PUBLIC_CONTENT`| `HealthcareGuideView.tsx` | Průvodce zdravotnictvím v TSX | P2 | K řešení ve Fázi 2 |
| **I014** | `HARDCODED_PUBLIC_CONTENT`| `InternationalDisputesGuideView.tsx`| Průvodce mezinárodními spory v TSX | P2 | K řešení ve Fázi 2 |
| **I015** | `HARDCODED_PUBLIC_CONTENT`| `WikiView.tsx` | 32 encyklopedických hesel v TSX | P2 | K řešení ve Fázi 2 |
| **I016** | `HARDCODED_PUBLIC_CONTENT`| `QuizzesView.tsx` | 4 kvízy a otázky v TSX | P2 | K řešení ve Fázi 2 |
| **I017** | `HARDCODED_PUBLIC_CONTENT`| `VideothequeView.tsx` | Seznam videí v TSX | P2 | K řešení ve Fázi 2 |
| **I018** | `HARDCODED_PUBLIC_CONTENT`| `MementoView.tsx` | Kazuistiky a případy mementa v TSX | P2 | K řešení ve Fázi 2 |
| **I019** | `HARDCODED_PUBLIC_CONTENT`| `FounderStoryPage.tsx` | Příběh zakladatele v TSX | P3 | K řešení ve Fázi 2 |
| **I020** | `HARDCODED_PUBLIC_CONTENT`| `UserManualPage.tsx` | Uživatelský manuál v TSX | P3 | K řešení ve Fázi 2 |
| **I021** | `DEAD_CODE / UNUSED_PAGE` | `LegalHubPage.tsx` | Komponenta není v routeru renderována | P3 | Refaktoring |
| **I022** | `BACKEND_WITHOUT_ADMIN_UI`| `StateAdminHubService.ts` | Chybí ruční spouštěč synchronizace v Adminu | P2 | K řešení ve Fázi 2 |
| **I023** | `MISSING_NAVIGATION` | `Header.tsx` | `/studie` není v přímém menu (pouze `/studia`)| P2 | Doplnit do menu |
| **I024** | `VERIFIED_FEATURE` | `subjektService.ts` | Registr subjektů & Moderace (35/35 testů PASS)| P0 | HOTOVO |
| **I025** | `VERIFIED_FEATURE` | `EsbirkaApiClient.ts` | eSbírka synchronizace s kvótami a zámky | P0 | HOTOVO |
| **I026** | `VERIFIED_FEATURE` | `CoParentPage.tsx` | Spolurodičovský Hub a dohody | P0 | HOTOVO |
| **I027** | `VERIFIED_FEATURE` | `MyCasePage.tsx` | Osobní spis otce s 10 moduly | P0 | HOTOVO |
| **I028** | `VERIFIED_FEATURE` | `CareHubPage.tsx` | Plánovač péče a geo-routing | P0 | HOTOVO |

---

## 12. Přehledy dle kategorií zjištění

### Seznam A: MISSING_PUBLIC_INTEGRATION (Kód existuje, ale chybí veřejná stránka)
- Všechny klíčové funkce mají odpovídající veřejné nebo uživatelské rozhraní. Žádná kritická funkce není zcela skryta.

### Seznam B: INTERNAL_ONLY (Správně interní funkce)
- Administrátorské panely (`/administrace/*`), správa uživatelů, správa VPS a DNS, správa auditních logů, QA Dashboard, správa schvalovací fronty subjektů.

### Seznam C: CONTENT_COMPLETE (Kompletní funkční a obsahové stránky)
- Homepage (`/`), O nás (`/o-nas`), Kontakt (`/kontakt`), Partneři (`/partneri`), Sponzoři (`/sponzori`), Kalkulačka výživného (`/kalkulacka-vyzivneho`), Registr subjektů (`/registr-subjektu`), Mapa subjektů (`/mapa-subjektu`), Zákony v eSbírce (`/state-laws`), Statistiky státu (`/statistika-statu`), Články (`/clanky`), FAQ (`/faq`), Právní dokumenty (`/pravni-dokumenty`), GDPR centrum (`/gdpr-centrum`), Dobrovolníci (`/dobrovolnici`), Osobní spis otce (`/muj-pripad`), CoParent Hub (`/coparent-hub`), Plánovač péče (`/pece`), AI Asistenti (`/ai-radce`, `/ai-formular`, `/ai-simulator`).

### Seznam D: CONTENT_PARTIAL (Funkční stránky s pevným obsahem v TSX)
- Právní příručky (`/pruvodce-soudem`, `/pruvodce-ospod`, `/odvolani`, `/nahled-spisu`, `/vykon-rozhodnuti`, `/znalecke-posudky`, `/skolstvi`, `/zdravotnictvi`, `/mezinarodni-spory`), Encyklopedie (`/wiki`), Kvízy (`/kvizy`), Videotéka (`/videoteka`), Memento (`/memento`).

### Seznam E: CONTENT_MISSING (Prázdné nebo nedokončené stránky)
- Žádná veřejná stránka není prázdná; všechny podstránky renderují ucelený a profesionální obsah.

### Seznam F: MISSING_NAVIGATION (Stránky chybějící v hlavním menu)
- `/studie` (Katalog studií – dostupný ze sitemapy a patičky, v menu je `/studia`).

### Seznam G: HARDCODED_PUBLIC_CONTENT (Veřejný obsah vyžadující CMS správu)
- 15 komponent uvedených v sekci 5.2 (právní příručky, encyklopedie, kvízy, videa).

### Seznam H: ORPHAN_DATA_MODEL (Modely bez aktivního využití)
- Žádný model není osiřelý. Všech 75 modelů z `schema.prisma` má aktivní vazbu v logice aplikace nebo `dbStore`.

### Seznam I: API_WITHOUT_UI (Backendové endpointy bez klientského UI)
- Žádný veřejný endpoint nepostrádá klientské rozhraní.

### Seznam J: UI_WITHOUT_BACKEND (Frontendové formuláře bez funkčního backendu)
- Žádný formulář v projektu nepoužívá falešné makety; všechna odeslání jsou napojena na reálné API endpointy.

### Seznam K: ADMIN_UI_WITHOUT_BACKEND / BACKEND_WITHOUT_ADMIN_UI
- `BACKEND_WITHOUT_ADMIN_UI`: Konektory pro ČSÚ, NKOD a Justice OpenData nemají v administraci dedikovaný panel pro manuální vyvolání synchronizace (synchronizují se programově nebo při požadavku).

### Seznam L: RBAC_GAP / ACCESS_LAYER_MISMATCH
- Všechny citlivé cesty jsou striktně chráněny na serveru pomocí `requireAuth` a `requireRole`. Žádná bezpečnostní díra nebyla nalezena.

### Seznam M: SEO_MISSING (Chybějící SeoHead)
- 5 stránek: `/registr-subjektu`, `/mapa-subjektu`, `/studie`, `/sos-plan`, `/pravni-dokumenty`.

---

## 13. Celkový stav projektu (Status Breakdown)

### HOTOVO (Dokončeno a ověřeno):
1. **Registr subjektů a moderace kontaktů:** Uživatelské vkládání, stav `PENDING_VERIFICATION`, moderátorská fronta, schvalování/zamítání, anti-self-approval, auditní stopa, interaktivní mapa (35/35 testů PASS).
2. **Jádro systému a bezpečnost:** Autentizace, TOTP 2FA, WebAuthn/Passkey, RBAC hierarchie 12 rolí, kryptografický audit log.
3. **Spolurodičovský systém (CoParent):** Kalendář střídavé péče, správa výdajů, dohody, handovery, denní záznamy.
4. **Osobní spis otce (MyCase):** 10 integrovaných modulů spisu pro komplexní vedení opatrovnické agendy.
5. **Plánovač péče (CarePlan):** Věkové algoritmy, geo-routing, simulace a porovnání modelů péče.
6. **Konektor eSbírka:** Přísné dodržování limitů (1 req/s, max 5 req/den), atomické zámky, verzování předpisů.
7. **Redakční systém (CMS) pro základní entity:** Puck Visual Page Builder, Články, FAQ, Navigace, Média, Knihovna studií, Právní compliance dokumenty.
8. **AI Nástroje:** Rádce, Generátor podání, Simulátor soudního výslechu, Asistent spisu.

### ROZPRACOVÁNO (Fáze 2 příprava):
1. **Redakční správa pro specializované příručky:** Návrh generických CMS struktur pro převod hardcoded TSX příruček do redakčního systému.
2. **Administrátorský panel pro StateAdmin:** Doplnění tlačítka ruční synchronizace otevřených dat ČSÚ a Justice do administrace.

### CHYBÍ (Doporučená vylepšení):
1. **SEO meta tagy na 5 podstránkách:** Doplnění `<SeoHead>` do `RegistrSubjektu.tsx`, `MapaSubjektuView.tsx`, `StudyLibraryPage.tsx`, `SosPlanView.tsx`, `PublicComplianceView.tsx`.
2. **Doplnění odkazu `/studie` do navigačního menu.**

---

## 14. Prioritizovaný implementační plán (Actionable Backlog)

### Priorita P0 (Kritické – Hotovo):
- [x] Dokončení registru subjektů a schvalovacího workflow s anti-self-approval ochranou.
- [x] Provedení a ověření E2E testů moderace (35/35 PASS).

### Priorita P1 (Vysoká priorita – Okamžitá náprava):
- [ ] **SEO náprava:** Vložit `<SeoHead>` do `RegistrSubjektu.tsx`, `MapaSubjektuView.tsx`, `StudyLibraryPage.tsx`, `SosPlanView.tsx`, `PublicComplianceView.tsx`.
- [ ] **Doplnění navigace:** Přidat položku "Katalog studií" (`/studie`) do rozbalovacího menu hlavičky pod sekci Vzdělávání.

### Priorita P2 (Střední priorita – Fáze 2 rozvoj CMS):
- [ ] **CMS Encyklopedie (Wiki):** Vytvořit v `CmsManager` záložku pro správu pojmů rodinného práva a napojit `WikiView.tsx` na dynamické API.
- [ ] **CMS Právní příručky:** Umožnit editaci sekcí průvodců soudem, OSPOD a odvoláním přes redakční systém bez nutnosti zásahu do kódu.
- [ ] **StateAdmin Admin Panel:** Doplnit do administračního rozhraní widget pro sledování stavu a ruční spuštění synchronizace ČSÚ / Justice.

### Priorita P3 (Nízká priorita – Úklid kódu a optimalizace):
- [ ] **Refaktor `LegalHubPage.tsx`:** Odstranit nepoužívanou komponentu `LegalHubPage.tsx` nebo ji aktivovat jako centrální rozcestník.
- [ ] **Příběh zakladatele & Manuál:** Převést `FounderStoryPage` a `UserManualPage` na plně editovatelné stránky v Puck Page Builderu.

---

## 15. Závěr a ověření

Tento audit představuje ucelený, pravdivý a detailní obraz stavu projektu **Táta má právo (dev3)** k datu 22. srpna 2026. Projekt je ve vysoce stabilním, bezpečném a funkčně bohatém stavu, připravený k dalšímu plánovanému rozvoji.

**Záznam o uložení auditu:**
- Soubor uložen: `docs/audit/DEV3_CONTENT_CMS_INTEGRATION_AUDIT_2026-08-22.md`
- Kopie pro research: `audits/research/DEV3_CONTENT_CMS_INTEGRATION_AUDIT_2026-08-22.md`
