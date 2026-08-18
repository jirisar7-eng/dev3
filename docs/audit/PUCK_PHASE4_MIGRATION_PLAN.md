# PLÁN MIGRACE VEŘEJNÝCH STRÁNEK NA UNIFIED PUCK CMS (DEV3 — FÁZE 4)
**Projekt:** Táta má právo (dev3)  
**Verze dokumentu:** 1.0  
**Datum:** 18. srpna 2026  
**Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor  
**Git Commit Base Reference:** `1f1442cc0ae7193a2883e6c041c918e02f75ac98` (Větev: `feature/puck-adapter-layer`)  
**Status:** PLAN / AUDIT (Žádný produkční kód nebyl změněn)

---

## 1. EXEKUTIVNÍ SHRNUTÍ & CÍLE MIGRACE

Tento dokument představuje vyčerpávající architektonický a migrační plán pro převod veřejných stránek platformy **Táta má právo (dev3)** do jednotného vizuálního systému **Unified Puck CMS**.

V předchozích fázích byl vytvořen a otestován:
1. **Puck Adapter Layer (`src/puck/adapters/`):** 7 plně sanitizovaných a izolovaných komponentních adaptérů s ochranou proti XSS, open redirects a SSRF.
2. **CMS Request Deduplication & In-Memory TTL Cache (`src/lib/cmsCache.ts`):** Ochrana proti rate limiting (HTTP 429) a opakovaným voláním backendu.
3. **Pilotní stránka (`/o-projektu`):** Úspěšně ověřena s feature flagem a automatickým fallbackem na původní `AboutView`.

### Hlavní zásady migrace Fáze 4:
1. **Puck jako Layout & Content Engine, nikoliv aplikační mozek:** Puck spravuje rozložení, texty, bloky, obrázky, výzvy k akci a vizuální kompozici.
2. **Striktní zákaz nahrazování business logiky:** Puck nesmí převzít autentizaci, autorizaci (RBAC), správu klientských spisů, opatrovnické algoritmy, generátory podání, ani synchronizaci státních dat (e-Sbírka / e-Legislativa).
3. **Zero-Downtime & Safe Fallback:** Každá migrovaná stránka musí mít garantovaný fallback v případě chyby JSONu, nedostupnosti CMS API nebo chyby v databázi.

---

## 2. KATEGORIZACE STRÁNEK (P0 / P1 / P2)

Veškeré existující URL adresy, routery a pohledy v aplikaci byly analyzovány a rozděleny do 3 kategorií:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🟢 P0 — SAFE PUCK (Čistě informační obsah)                                  │
│ Úplný převod do Pucku. Žádná kritická backendová business logika.          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🟡 P1 — HYBRID (Kombinovaný layout + interaktivní/dynamické jádro)          │
│ Puck řídí hlavičky, CTA, textový kontext a uspořádání; dynamické komponenty│
│ a backendové konektory zůstávají nedotčeny jako vnořené bloky/adaptéry.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🔴 P2 — DO NOT PUCK (Privátní zóna, klientská data, právo & AI jádro)       │
│ Zákaz převodu do Pucku. Vyžaduje přísné RBAC, šifrování a neměnné flow.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. DETAILNÍ INVENTÁŘ VEŘEJNÝCH STRÁNEK A KOMPONENT

### 🟢 KATEGORIE P0 — SAFE PUCK (Čistě informační stránky)

Tyto stránky obsahují statický nebo polo-statický textový a edukační obsah, který je plně vhodný pro správu redaktory v Puck editoru.

| URL / Slug | Aktuální komponenta | Aktuální renderer | DB Page | Puck JSON | Adaptér | Dynamická data | Riziko | Doporučený postup migrace |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `/o-projektu`, `/o-nas` | `AboutView.tsx` | `CmsPageRenderer` (při flagu) / `AboutView` | **ANO** | **ANO** | **ANO** | NE (čistý text & karty) | Nízké | **Hotovo v pilotu**; aktivovat produkčně jako výchozí renderer. |
| `/partneri`, `/partners` | `PartnersView.tsx` | Hardcoded v `PublicPortal.tsx` | **ANO** | Lze seed | **ANO** | NE (statický seznam partnerů) | Nízké | Vytvořit Puck stránku `partneri` s `ColumnsBlock` a `ImageBlock`. |
| `/sponzori` | `SponsorsView.tsx` | Hardcoded v `PublicPortal.tsx` | **ANO** | Lze seed | **ANO** | NE (loga a děkovné texty) | Nízké | Vytvořit Puck šablonu pro dárce a partnery. |
| `/kodex-dobrovolnika`, `/volunteer-code` | `VolunteerCodexPage.tsx` | Hardcoded stránka | **ANO** | Lze převést | **ANO** | NE (etický kodex) | Nízké | Převedení statických odstavců kodexu do strukturovaných `TextBlock` a `HeroBlock`. |
| `/zasady-ochrany-osobnich-udaju`, `/privacy-policy` | `GdprComplianceCenterPage.tsx` | Specializovaný viewer | **ANO** | Lze převést | **ANO** | NE (neměnný právní text) | Nízké | Zachovat jako fallback, obsah umožnit editovat v CMS pod verzovaným formátem. |
| `/cesta-zakladatele` | Generováno přes `PageService` | `CmsPageRenderer` | **ANO** | **ANO** | **ANO** | NE | Nízké | Plně připraveno v DB jako Puck stránka. |
| `/user-manual`, `/sitemap` | Generováno přes `PageService` | `CmsPageRenderer` | **ANO** | **ANO** | **ANO** | NE | Nízké | Plně připraveno v DB jako Puck stránka. |

---

### 🟡 KATEGORIE P1 — HYBRID (Kombinovaný layout + dynamická data)

Tyto stránky vyžadují přítomnost dynamických API endpointů (články, FAQ, formuláře, katalogy), ale jejich okolní obal, záhlaví, postranní panely, výzvy k akci a edukační kontext mají být plně editovatelné v Pucku přes specializované adaptéry.

| URL / Slug | Aktuální komponenta | Aktuální renderer | DB Page | Puck JSON | Adaptér | Dynamická data | Riziko | Doporučený postup migrace |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `/` (Homepage) | `Hero`, `CorePrincipleCard`, `ArticlesSection`, `ModulesSection`, `FaqSection` | Hardcoded sekce v `PublicPortal.tsx` | **ANO** (slug `home`) | Lze sestavit | **ANO** | **ANO** (články z DB, FAQ z DB) | Střední | Vytvořit Puck Layout složený z `HeroBlock`, `ArticlesFeedBlock`, `FaqFeedBlock`, `CtaBlock`. Původní sekce slouží jako adaptéry. |
| `/clanky` | `ArticlesSection.tsx` | Hardcoded sekce v `PublicPortal.tsx` | **ANO** | Lze sestavit | **ANO** (`ArticlesFeedAdapter`) | **ANO** (`/api/cms/articles`) | Nízké | Obalit do Puck šablony `clanky` s horním bannerem a dynamickým feedem. |
| `/clanky/:slug`, `/metodika/:slug` | `ArticleDetailView.tsx` | Hardcoded detail v `PublicPortal.tsx` | **ANO** (Article DB) | Lze vložit | **ANO** | **ANO** (`/api/cms/articles/:slug`) | Střední | Detail článku čte obsah z `Article.content`, záhlaví a související boxy řízeny šablonou. |
| `/faq` | `FaqSection.tsx` | Hardcoded sekce v `PublicPortal.tsx` | **ANO** | Lze sestavit | **ANO** (`FaqFeedAdapter`) | **ANO** (`/api/cms/faqs`) | Nízké | Puck stránka obsahující vyhledávací `HeroBlock` a dynamický `FaqFeedAdapter`. |
| `/kontakt` | `ContactView.tsx` + kontaktní formulář | `CmsPageRenderer` + vnořený Form | **ANO** | **ANO** | **ANO** | **ANO** (Odeslání zprávy přes API) | Střední | Horní část a kontaktní údaje řízeny Puckem; interaktivní formulář renderován přes bezpečný formulářový adaptér s backend rate-limitingem. |
| `/podporte-nas`, `/podpora-a-spolek` | `SupportUsPage.tsx` | Hardcoded stránka | **ANO** | Lze sestavit | **ANO** | **ANO** (Platební QR kódy, dary) | Střední | Puck řídí texty o činnosti spolku a transparentním účtu; platební kalkulačka je chráněný adaptér. |
| `/dobrovolnici`, `/hledame-kolegy` | `VolunteersPage.tsx` | Hardcoded stránka | **ANO** | Lze sestavit | **ANO** | **ANO** (Registrační formulář dobrovolníka) | Střední | Popis rolí a přínosů v Pucku; formulář přihlášky je zabezpečený adaptér. |
| `/dohoda-o-spolupraci`, `/e-dohoda` | `VolunteerAgreementPage.tsx` | Specializovaný viewer s podpisem | **ANO** | Částečně | NE (formulář) | **ANO** (Generování PDF, e-podpis) | Střední/Vysoké | Právní znění dohody se čte z verzovaného systému; Puck spravuje pouze edukační úvodní stránku. |
| `/studie`, `/knihovna-studii` | `StudyLibraryPage.tsx` / `StudiesView.tsx` | Hardcoded viewer | **ANO** | Lze sestavit | **ANO** | **ANO** (Filtrování studií, tagy) | Střední | Puck zajišťuje úvod a kategorizaci; seznam studií je napojen přes datový adaptér. |
| `/videoteka` | `VideothequeView.tsx` | Hardcoded viewer | **ANO** | **ANO** | **ANO** | **ANO** (Přehrávač, YouTube ID) | Nízké | Využít Puck bloky pro embed bezpečných videí. |
| `/kvizy`, `/vzdelavani` | `QuizzesView.tsx` | Hardcoded komponenta | **ANO** | **ANO** | **ANO** | **ANO** (Interaktivní stav testu) | Střední | Vizuální layout v Pucku, stav kvízu zapouzdřen v komponentě. |
| `/wiki`, `/legal-wiki` | `WikiView.tsx` | Hardcoded slovník | **ANO** | **ANO** | **ANO** | **ANO** (Rejstřík pojmů) | Nízké | Puck rozhraní s abecedním vyhledáváním. |
| `/forum`, `/pribehy`, `/memento`, `/pravni-poradna`, `/podpora` | Komunitní views v `community/` | Hardcoded v `PublicPortal.tsx` | **ANO** | **ANO** | **ANO** | **ANO** (Komentáře, příběhy) | Střední | Úvodní popis a metodika v Pucku; interaktivní vlákna přes zabezpečené komponenty. |
| `/sos-plan`, `/crisis`, `/krizova-pomoc` | `SosPlanView.tsx`, `CrisisCommunityPortal.tsx` | Hardcoded v `PublicPortal.tsx` | **ANO** | **ANO** | **ANO** | **ANO** (Interaktivní checklist 72h) | Střední | Kritický krizový text v Pucku (rychlá editace linek pomoci); interaktivní checklist v lokálním state. |
| `/registr-subjektu`, `/subjekty` | `RegistrSubjektu.tsx` | Hardcoded katalog | **ANO** | Lze sestavit | **ANO** | **ANO** (Databáze soudů, OSPOD, znalců) | Střední | Úvodní text a filtry v Pucku; tabulka a vyhledávač napojeny na DB endpoint. |
| `/agenda`, `/prava`, `/judikatura`, `/dokumenty`, `/ke-stazeni` | Legal views v `legal/` | Hardcoded v `PublicPortal.tsx` | **ANO** | **ANO** | **ANO** | **ANO** (Šablony ke stažení, judikáty) | Střední | Struktura stránek v Pucku; soubory ke stažení a metadata z DB. |

---

### 🔴 KATEGORIE P2 — DO NOT PUCK (Přísně neveřejná a citlivá jádra)

Tyto sekce a moduly **NESMÍ BÝT PŘEVEDENY DO PUCK CMS**. Obsahují autentizaci, autorizaci, šifrovaná klientská data, správu případů, klientské spisy, algoritmy péče, soudní simulátory, generátory podání nebo přímou integraci se státními databázemi.

| URL / Modul | Hlavní komponenta | Důvod zákazu převodu do Pucku |
| :--- | :--- | :--- |
| `/login`, `/register`, `/registrace` | `LoginPage.tsx`, `RegisterPage.tsx` | **Autentizace & Bezpečnost:** CSRF tokeny, hashování hesel, 2FA/TOTP autentizace, ochrana proti brute-force útokům. |
| `/portal/*`, `/dashboard`, `/nastenka` | `UserDashboard.tsx` | **Privátní klientská zóna:** Vyžaduje platnou session, RBAC kontrolu a klientskou autorizaci. |
| `/muj-pripad`, `/pripad`, `/moje-slozka` | `MyCasePage.tsx`, Osobní spis otce | **Přísně důvěrná data (GDPR P0):** Správa nezletilých dětí, protokoly OSPOD, důkazní audio/video materiály, soudní spisy. |
| `/coparent-hub`, `/coparent` | `CoParentHubPage.tsx` | **Vzájemná rodičovská komunikace:** Sdílený kalendář péče, evidence plateb, schvalování výdajů. |
| `/ai-asistent`, `/ai-assistant` | `AiAssistantView.tsx` | **AI Business Engine:** Server-side streaming s Gemini SDK, správa systémových promptů a právní bezpečnost. |
| `/ai-pruvodce`, `/ai-guide` | `AiGuideView.tsx` | **Interaktivní procesní strom:** Komplexní rozhodovací logika pro jednání u soudu a OSPOD. |
| `/ai-case-manager`, `/rozbor-spisu` | `AiCaseManagerView.tsx` | **Analýza spisu:** Právní sumarizace klientských dokumentů s přísným oddělením tenantů. |
| `/ai-simulator`, `/simulator`, `/plan-pece` | `AiSimulatorView.tsx` | **Matematické & právní kalkulátory:** Oficiální algoritmy výpočtu výživného (metodika MS ČR) a tabulky střídavé péče. |
| `/ai-formulare`, `/centrum-formularu` | `AiFormsView.tsx` | **Generátor procesních návrhů:** Právní šablony generující soudní podání na základě strukturovaných dat. |
| `/state-laws`, `/e-sbirka`, `/e-legislativa` | `StateLawsView.tsx` | **Státní data & e-Sbírka connector:** Server-side synchronizace s e-Sbírkou, striktní limity 1 req/s a 5 req/den, verzování zákonů. |
| `/state-statistics`, `/statistiky` | `StateStatisticsView.tsx` | **Oficiální statistiky:** Analýza otevřených dat Ministerstva spravedlnosti s analytickými grafy (Recharts). |
| `/pravni-dokumenty`, `/compliance/*` | `LegalDocsPage.tsx`, `PublicComplianceView` | **Verzovaný compliance registr:** Závazné právní podmínky, souhlasy a verze vyžadující auditní stopu a neměnnost. |
| `/administrace/*`, `/admin/*` | `AdminDashboard.tsx`, Puck Editor | **Správní vrstva:** Vyžaduje roli `ADMIN` nebo `SUPER_ADMIN` s vynuceným MFA. |

---

## 4. ARCHITEKTONICKÁ ANALÝZA SOUČASNÝCH DUPLICIT A HARDCODED OBSAHU

V kódu byly identifikovány tyto klíčové strukturální problémy:

### A. Dva různé CMS Renderery
1. **`PageRenderer.tsx` (Starší verze):** Obsahuje legacy `switch(sec.sectionKey)` (`hero`, `text`, `cards`, `faq`, `cta`).
2. **`CmsPageRenderer.tsx` (Modernější verze):** Obsahuje podporu `PageRender` (Puck), `SchemaDrivenRenderer` (vlastní moduly) a rozšířený `switch(sec.sectionKey)`.
* **Cílový stav:** Sjednotit do jediného `CmsPageRenderer.tsx`, který jako primární formát používá Puck JSON a adaptéry. `PageRenderer.tsx` označit jako deprecated a odstranit duplicitu.

### B. Split-Brain ukládání (`Page.content` vs `PageSection[]`)
* V databázi model `Page` ukládá serializovaný JSON v `Page.content`. Současně však existuje relační tabulka `PageSection`.
* `PageService.ensureAllModulePagesExist` při inicializaci vytváří jak Puck JSON v `Page.content`, tak záznamy v `PageSection`.
* **Cílový stav:** Primárním a jediným zdrojem pravdy pro rozvržení je `Page.content` (Puck JSON). `PageSection` slouží pouze pro zpětnou kompatibilitu.

### C. Hardcoded routing v `PublicPortal.tsx`
* `PublicPortal.tsx` obsahuje přes 30 explicitních podmínek `if (slug === '...')`.
* Statické stránky jako `/partneri`, `/sponzori` jsou natvrdo zadrátované v React kódu.
* **Cílový stav:** Postupně delegovat čistě informační a hybridní routy do `CmsPageRenderer`, který podle slugu načte Puck konfiguraci a vykreslí odpovídající adaptéry. Pokud stránka v DB chybí, použije se hardcoded komponenta jako fallback.

---

## 5. BEZPEČNOSTNÍ MANTINELY & INVARIANTOVÁ PRAVIDLA (DEVSEC FIRST)

Při jakékoliv migraci veřejných stránek do Pucku musí být bezpodmínečně dodržena tato pravidla:

1. **XSS & Protocol Sanitization:** Žádný Puck blok nesmí renderovat nevalidované HTML (`dangerouslySetInnerHTML`) bez DOMPurify. Všechny URL v tlačítkách a odkazech musí procházet funkcí `sanitizeUrl()` z `src/puck/adapters/utils.ts` (blokace `javascript:`, `data:`, `vbscript:`).
2. **Open Redirect Defense:** Externí odkazy na neznámé domény musí být sanitizovány a opatřeny `rel="noopener noreferrer"`.
3. **No Auth in Puck:** Puck JSON nesmí obsahovat citlivé údaje, klientská ID, přístupové tokeny ani autorizační příznaky.
4. **Resilient Rate-Limiting:** Všechny komponentní adaptéry čtoucí data z API (články, FAQ) musí používat `fetchCmsPublic()` z `src/lib/cmsCache.ts`, který deduplikuje souběžné requesty a cachuje odpovědi po dobu TTL (60s).
5. **Zero Data Loss on Render Fail:** Pokud Puck selže při parsování poškozeného JSONu, `CmsPageRenderer` okamžitě aktivuje bezpečný fallback na hardcoded komponentu nebo standardní chybové rozhraní bez pádu celé aplikace.

---

## 6. DOPORUČENÉ POŘADÍ IMPLEMENTACE (FÁZE 4 ROLLOUT)

Migrace bude probíhat v malých, kontrolovatelných krocích:

```
KROK 1: P0 Informační stránky (Pilot → Produkce)
  ├── 1.1 Plná aktivace /o-projektu a /o-nas přes CmsPageRenderer (odstranění závislosti na localStorage flagu)
  ├── 1.2 Převod statických stránek /partneri a /sponzori do Puck šablon
  └── 1.3 Převod /cesta-zakladatele, /sitemap, /user-manual

KROK 2: P1 Hybridní obsahové stránky
  ├── 2.1 Nasazení Puck šablony pro /clanky (s využitím ArticlesFeedAdapter)
  ├── 2.2 Nasazení Puck šablony pro /faq (s využitím FaqFeedAdapter)
  └── 2.3 Nasazení Puck šablony pro /kontakt (Puck texty + bezpečný kontaktní formulář)

KROK 3: P1 Hybridní edukační a komunitní rozcestníky
  ├── 3.1 Rozcestník /studie & /knihovna-studii (Puck obal + dynamický katalog)
  ├── 3.2 Rozcestníky /krizova-pomoc, /sos-plan, /videoteka, /kvizy, /wiki
  └── 3.3 Rozcestník /registr-subjektu (Puck představení + tabulka institucí)

KROK 4: Sjednocení a konsolidace Homepage (/)
  ├── 4.1 Vytvoření výchozí kompozice Homepage v Puck JSON
  └── 4.2 Zapojení adaptérů Hero, CorePrinciple, ArticlesFeed, ModulesSection a FaqFeed

KROK 5: Konsolidace a úklid rendererů
  ├── 5.1 Konsolidace CmsPageRenderer.tsx a odstranění duplicitního PageRenderer.tsx
  └── 5.2 Odstranění zbytečných if/else větví v PublicPortal.tsx s plným zachováním fallbacků
```

---

## 7. ZÁVĚREČNÝ STATUS AUDITU

```text
PHASE 4 AUDIT: COMPLETE
SAFE PAGES (P0):
  - /o-projektu, /o-nas
  - /partneri, /partners
  - /sponzori
  - /kodex-dobrovolnika, /volunteer-code
  - /zasady-ochrany-osobnich-udaju, /privacy-policy
  - /cesta-zakladatele
  - /user-manual
  - /sitemap

HYBRID PAGES (P1):
  - / (Homepage)
  - /clanky, /clanky/:slug, /metodika/:slug
  - /faq
  - /kontakt
  - /podporte-nas, /podpora-a-spolek
  - /dobrovolnici, /hledame-kolegy
  - /dohoda-o-spolupraci, /e-dohoda
  - /studie, /knihovna-studii
  - /videoteka
  - /kvizy, /vzdelavani
  - /wiki, /legal-wiki
  - /krizova-pomoc, /sos-plan, /crisis, /forum, /pribehy, /memento, /pravni-poradna, /podpora
  - /registr-subjektu, /subjekty
  - /agenda, /opatrovnicka-agenda, /prava, /rights, /judikatura, /dokumenty, /ke-stazeni

DO NOT PUCK (P2):
  - /login, /register, /registrace (Autentizace, CSRF, hesla, 2FA)
  - /portal/*, /dashboard, /nastenka (Privátní zóna, RBAC)
  - /muj-pripad, /pripad, /moje-slozka (Důvěrný spis otce, děti, OSPOD protokoly)
  - /coparent-hub, /coparent (Sdílený kalendář, výdaje, vyjednávání péče)
  - /ai-asistent, /ai-assistant, /ai-pruvodce, /ai-case-manager, /ai-simulator, /ai-formulare (AI & výpočetní jádro)
  - /state-laws, /e-sbirka, /e-legislativa (Synchronizace se státní e-Sbírkou)
  - /state-statistics, /statistiky (Analýza státních justičních dat)
  - /pravni-dokumenty, /compliance/* (Verzovaný právní registr)
  - /administrace/*, /admin/* (Administrátorské rozhraní)

MIGRATION RISKS:
  - Rate-limiting (HTTP 429) při vícenásobných dotazech na CMS API (vyřešeno v cmsCache.ts)
  - Nevalidní Puck JSON způsobující pád React stromu (vyřešeno ErrorBoundary a fallbacky)
  - Bezpečnostní zranitelnosti (XSS, open redirect) v uživatelsky zadaných odkazech (vyřešeno sanitizací v adaptérech)
  - Narušení existujícího hardcoded chování při nedostupnosti DB (vyřešeno duálním fallbackem)

RECOMMENDED IMPLEMENTATION ORDER:
  1. P0 Informační stránky (produkční aktivace /o-projektu, /partneri, /sponzori)
  2. P1 Hybridní obsahové stránky (/clanky, /faq, /kontakt)
  3. P1 Hybridní edukační a komunitní rozcestníky (/studie, /krizova-pomoc, /registr-subjektu, /agenda)
  4. Sjednocení Homepage (/) do Puck kompozice s adaptéry
  5. Konsolidace rendererů (odstranění legacy PageRenderer.tsx)
```
