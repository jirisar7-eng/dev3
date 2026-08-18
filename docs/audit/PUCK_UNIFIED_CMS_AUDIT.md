# ARCHITEKTURNÍ AUDIT A NÁVRH SJEDNOCENÍ PUCK CMS & DEV3
**Projekt:** Táta má právo (dev3)  
**Verze dokumentu:** 1.0  
**Datum:** 17. srpna 2026  
**Autor:** Hlavní softwarový architekt & DevSecOps inženýr  
**Git Commit HEAD Reference:** `9108d275ef909f7cdcc1d6c5a04b080b300ade7d` (Větev: `main`)  
**Status auditu:** PLAN - READ-ONLY ANALÝZA (Žádný produkční kód nebyl změněn)

---

## 1. EXECUTIVNÍ SHRNUTÍ & ÚČEL AUDITU

Tento audit byl proveden za účelem analýzy současného stavu integrace **Puck Builderu (CMS)** s existujícími statickými i dynamickými stránkami platformy **Táta má právo (dev3)**. 

Cílem je identifikovat architekturu obou systémů, popsat duplicity v ukládání a vykreslování obsahu (tzv. "split-brain" chování) a navrhnout bezpečný, vysoce integrovaný cílový model, kde Puck slouží jako jednotný vizuální editor a layoutový engine, aniž by však nahrazoval nebo obcházel backendovou, bezpečnostní a databázovou logiku kritických interaktivních modulů.

---

## 2. DETAILNÍ ANALÝZA SOUČASNÉHO STAVU (CURRENT STATE)

### A. Puck Builder integrace v projektu
Platforma využívá vizuální editor `@measured/puck` ve verzi `^0.20.2` (dle `package.json`). V projektu jsou přítomny dvě hlavní sady konfiguračních a editorových souborů, které vykazují strukturální duplicitu:
1. **`/src/puck/`** (PuckEditorView.tsx, config.tsx, PuckInteractiveBlocks.tsx, systemTemplates.ts): Tato složka představuje nativní, novější integraci Pucku. Obsahuje pokročilé interaktivní bloky (Anketa, Kontaktní formulář) s přímým napojením na API.
2. **`/src/components/builder/`** (PageEditor.tsx, PageRender.tsx, puck.config.tsx): Tato složka deleguje nebo zrcadlí část konfigurace ze složky `/src/puck/`.

#### Puck datový tok a normalizace
*   **Normalizace dat (`normalizePuckData`):** Definována v `/src/puck/config.tsx` a exportována do zbytku aplikace. Zajišťuje, aby každý element v poli `content` měl unikátní, deterministicky vygenerované ID (formát `${type}-${timestamp}-${idx}-${random}`) pro zamezení chyb při renderování v Reactu.
*   **Ukládání Puck JSON:** Data z editoru se odesílají jako standardní JSON struktura obsahující pole `content` (seznam bloků s jejich vlastnostmi) a objekt `root` (vlastnosti celé stránky jako titulek).

---

### B. CMS architektura & Modely (Prisma & dbStore)
Systém využívá **hybridní (duální) úložný mechanismus** pro zajištění vysoké dostupnosti i v offline/preview režimu:
1.  **Durable PostgreSQL (přes Prisma):** Primární produkční databáze.
2.  **Transient Memory State (`dbStore`):** Fallback datový obchod v `/src/services/dbStore.ts`, který se aktivuje automaticky při výpadku spojení s databází (chyba `P1001` apod.).

#### Databázové modely v `prisma/schema.prisma`
*   **`Page`:** Klíčový model pro CMS stránky.
    *   `id` (UUID, PK)
    *   `title` (String)
    *   `slug` (String, Unique Index)
    *   `content` (Json) - Ukládá buď čistý text, nebo kompletní Puck JSON strukturu.
    *   `published` (Boolean)
    *   `seoTitle` / `seoDescription` (String?)
    *   Relace: `sections PageSection[]` (kaskádové mazání)
*   **`PageSection`:** Reprezentuje historický/sekční CMS model, kde každá sekce má svůj `sectionKey` ("hero", "text", "cards", "faq", "cta") a vlastní `config` v JSON formátu.
*   **`PageTemplate`:** Umožňuje ukládat hotová rozvržení Pucku pod kategoriemi (`LANDING`, `ARTICLE`, `LEGAL`, `FORM`, `CUSTOM`) s plnou podporou serializovaného JSON v `puckDataJson`.

---

### C. Analýza Synchronizačních a Převodních Služeb (`PageService.ts`)
Třída `PageService` v `/src/services/PageService.ts` spravuje životní cyklus CMS stránek prostřednictvím dvou hlavních metod, které se spouštějí při startu aplikace (`server.ts`):
1.  **`ensureAllModulePagesExist`:** Iteruje přes pole `MENU_MODULE_PAGES` (obsahující 33+ systémových modulů) a pro každý modul, který v databázi chybí, vytvoří:
    *   Záznam `Page` s výchozími 3 Puck bloky (`HeroBlock`, `TextBlock`, `CallToAction`).
    *   Současně navázané záznamy v `PageSection` pro zpětnou kompatibilitu s legacy CMS rendererem.
2.  **`convertAllPagesToPuck`:** Automatický migrační skript. Pokud detekuje, že pole `content` v záznamu `Page` je prostý text (legacy CMS), transformuje jej na validní Puck JSON strukturu s `HeroBlock`, `TextBlock` a `CallToAction/FormBlock` na základě typu slugu.

---

### D. CMS API Endpointy (v `server.ts` a `pageRoutes.ts`)
*   **Služba `CmsService` (`/src/services/cmsService.ts`):** Zapouzdřuje CRUD operace nad stránkami, sekcemi, články, kategoriemi, FAQ, navigací a médii s automatickým fallbackem na `dbStore`. Zapisuje veškeré operace do auditních logů (`AuditLog`).
*   **Routování (`/api/pages`):** Mountováno v `server.ts` na `/api/pages` ze souboru `/src/routes/pageRoutes.ts`. Obsahuje:
    *   `POST /api/pages/sync-modules` (Admin-only, synchronizace modulů)
    *   `POST /api/pages/convert-all-to-puck` (Admin-only, hromadný převod)
    *   `GET /api/pages` (Veřejný seznam)
    *   `GET /api/pages/:slug` (Veřejný detail s podporou dekódování URL a fallbacků)
    *   `POST /api/pages` (Admin-only, upsert stránky s automatickou tvorbou Puck JSON)
    *   `DELETE /api/pages/:id` (Admin-only, smazání)
*   **Legacy CMS Routování (`/api/cms`):** Mountováno přímo v `server.ts` (řádky 2909–3223), spravuje sekce, FAQ, články, menu a nahrávání médií s kontrolou přes antivirus ClamAV a ukládáním do objektového úložiště MinIO.

---

## 3. VEŘEJNÝ FRONTEND - MAPOVÁNÍ ROUT & UNIFIKACE (VEŘEJNÝ FRONTEND)

Níže uvedená tabulka podrobně mapuje všech 33+ stránek definovaných v platformě. Odhaluje kritickou nesrovnalost: **Služba `PageService` sice pro všechny tyto moduly generuje DB záznamy a Puck JSON, ale frontendový směrovač `PublicPortal.tsx` je odchytává a renderuje nativními React komponentami, což činí jakékoliv úpravy administrátora v Pucku pro tyto stránky neúčinnými.**

| URL Slug | Renderer na Frontendu | Hlavní React Komponenta | Má DB Page? | Má Puck JSON? | Závislost na Modulu (RBAC / State) | Vhodnost pro plné nahrazení Puckem | Doporučené řešení sjednocení |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `krizova-pomoc` | Interceptovaný (Nativní) | `CrisisCommunityPortal` | Ano | Ano | Komunitní databáze, kontakty | **NE** | Ponechat nativní, Puck použít jen pro SEO/hlavičku. |
| `sos-plan` | Interceptovaný (Nativní) | `SosPlanView` | Ano | Ano | SOS algoritmus, krizový stav | **NE** | Ponechat nativní s možností injektovat texty z CMS. |
| `crisis` | Interceptovaný (Nativní) | `SosPlanView` | Ano | Ano | Krizové linky, urgentní state | **NE** | Ponechat nativní, dynamická data ze státního API. |
| `forum` | Interceptovaný (Nativní) | `ForumView` | Ano | Ano | Fórum, DB vlákna, Auth, Zápis | **NE** | Ponechat nativní, Puck vykresluje pouze statický úvod. |
| `pribehy` | Interceptovaný (Nativní) | `CaseStoriesView` | Ano | Ano | Příběhy otců, DB články | **ČÁSTEČNĚ** | Využít Puck s vlastním blokem `ArticlesFeedBlock`. |
| `stories` | Interceptovaný (Nativní) | `CaseStoriesView` | Ano | Ano | Anglická verze příběhů, DB | **ČÁSTEČNĚ** | Využít Puck s vlastním blokem `ArticlesFeedBlock`. |
| `memento` | Interceptovaný (Nativní) | `MementoView` | Ano | Ano | Svědectví, statický obsah | **ANO** | Plně nahradit Puckem. |
| `pravni-poradna` | Interceptovaný (Nativní) | `LegalHelpView` | Ano | Ano | DB dotazy, formulář, Auth | **NE** | Ponechat nativní, formulář chráněn server-side. |
| `advice` | Interceptovaný (Nativní) | `LegalHelpView` | Ano | Ano | Anglická poradna, DB, Auth | **NE** | Ponechat nativní, formulář chráněn server-side. |
| `podpora` | Interceptovaný (Nativní) | `SupportView` | Ano | Ano | Mentorská síť, kontakty | **ČÁSTEČNĚ** | Puck s blokem `MentorList` načítajícím data z API. |
| `support` | Interceptovaný (Nativní) | `SupportView` | Ano | Ano | Anglická mentorská síť | **ČÁSTEČNĚ** | Puck s blokem `MentorList` načítajícím data z API. |
| `opatrovnicka-agenda` | Interceptovaný (Nativní) | `AgendaView` | Ano | Ano | Průvodce agendou, interaktivní | **ČÁSTEČNĚ** | Ponechat interaktivní logiku, Puck pro popisy. |
| `rights` | Interceptovaný (Nativní) | `RightsView` | Ano | Ano | Ústavní práva, statické texty | **ANO** | Plně nahradit Puckem. |
| `judikatura` | Interceptovaný (Nativní) | `CaseLawView` | Ano | Ano | Databáze rozsudků, vyhledávání | **NE** | Ponechat nativní, vyhledávač napojen na DB. |
| `ke-stazeni` | Interceptovaný (Nativní) | `DocumentsView` | Ano | Ano | Správa souborů, MinIO download | **ČÁSTEČNĚ** | Puck s vlastním blokem `DownloadsBlock` z API. |
| `state-laws` | Interceptovaný (Nativní) | `StateLawsView` | Ano | Ano | e-Sbírka synchronizace, P0 limity | **NE** | Ponechat nativní (přísné limity 1 req/s, 5 req/den). |
| `state-statistics` | Interceptovaný (Nativní) | `StateStatisticsView` | Ano | Ano | MS ČR statistiky, D3 grafy | **NE** | Ponechat nativní, renderování přes Recharts/D3. |
| `pripadova-databaze` | Interceptovaný (Nativní) | `CaseLawView` | Ano | Ano | Rozsudky, vyhledávací index | **NE** | Ponechat nativní, DB napojení. |
| `knihovna-studii` | Interceptovaný (Nativní) | `StudiesView` | Ano | Ano | Knihovna studií, PDF stahování | **NE** | Ponechat nativní s dynamickým výpisem z DB. |
| `videoteka` | Interceptovaný (Nativní) | `VideothequeView` | Ano | Ano | YouTube embedy, kategorie | **ČÁSTEČNĚ** | Puck s blokem `VideoGridBlock` napojeným na DB. |
| `vzdelavani` | Interceptovaný (Nativní) | `QuizzesView` | Ano | Ano | Kvízy, interaktivní state, skóre | **NE** | Ponechat nativní, komplexní klientská logika. |
| `legal-wiki` | Interceptovaný (Nativní) | `WikiView` | Ano | Ano | Slovník pojmů, rejstřík | **ČÁSTEČNĚ** | Puck s blokem `WikiGlossary` (čte z DB/API). |
| `cesta-zakladatele` | Informační (Výchozí) | `CmsPageRenderer` | Ano | Ano | Příběh zakladatele | **ANO** | Plně nahradit Puckem. |
| `user-portal` | Systémový (Privátní) | `UserDashboard` | Ano | Ano | Osobní klientská složka, Auth | **NE** | Ponechat v privátní zóně (bezpečnostní izolace). |
| `profile` | Systémový (Privátní) | `UserDashboard` | Ano | Ano | Nastavení účtu, MFA, hesla | **NE** | Ponechat v privátní zóně (přísné P0 zabezpečení). |
| `coparent-hub` | Systémový (Privátní) | `CoParentHubPage` | Ano | Ano | Sdílený kalendář, výlohy | **NE** | Ponechat v privátní zóně (izolace, real-time). |
| `ai-assistant` | Interceptovaný (Nativní) | `AiAssistantView` | Ano | Ano | Gemini SDK, server-side API | **NE** | Ponechat nativní, chat vyžaduje WebSocket/Stream. |
| `ai-guide` | Interceptovaný (Nativní) | `AiGuideView` | Ano | Ano | Gemini SDK, personalizovaný krok | **NE** | Ponechat nativní, citlivé dotazy. |
| `ai-case-manager` | Interceptovaný (Nativní) | `AiCaseManagerView` | Ano | Ano | Gemini SDK, nahrávání spisů | **NE** | Ponechat nativní, přísná kontrola ClamAV. |
| `plan-pece` | Interceptovaný (Nativní) | `AiSimulatorView` | Ano | Ano | Výpočet výživného, kalkulačka | **NE** | Ponechat nativní, složité matematické výpočty. |
| `centrum-formularu` | Interceptovaný (Nativní) | `AiFormsView` | Ano | Ano | Generování PDF, šablony | **NE** | Ponechat nativní, serverové generování dokumentů. |
| `news` | Informační (Výchozí) | `CmsPageRenderer` | Ano | Ano | Aktualizace a změny | **ANO** | Plně nahradit Puckem. |
| `sitemap` | Informační (Výchozí) | `CmsPageRenderer` | Ano | Ano | Mapa stránek | **ANO** | Plně nahradit Puckem. |
| `kontakt` | Interceptovaný (Nativní) | `ContactView` + CMS | Ano | Ano | Interaktivní formulář, kontakty | **ČÁSTEČNĚ** | Puck pro vizuální části, formulář nativně. |
| `dobrovolnici` | Interceptovaný (Nativní) | `VolunteersPage` | Ne | Ne | Seznam dobrovolníků, nábor | **ČÁSTEČNĚ** | Puck s blokem `VolunteerForm`. |
| `gdpr` | Interceptovaný (Nativní) | `GdprComplianceCenterPage`| Ano | Ano | Právní souhlasy, auditní stopa | **NE** | Ponechat nativní kvůli právní integritě (P0). |

---

## 4. REGISTROVANÉ PUCK KOMPONENTY (PUCK COMPONENTS)

V `/src/puck/config.tsx` jsou aktuálně registrovány následující komponenty:

### A. Statické & Layoutové bloky
1.  **`HeroBlock`:** Úvodní sekce s velkým nadpisem, popisem a akčním tlačítkem. Vykresluje se s moderním tmavým gradientem (`from-slate-900 via-indigo-950 to-slate-900`).
2.  **`TextBlock`:** Standardní textový blok s nastavením zarovnání (vlevo, na střed, vpravo). Podporuje formátování textu a zachování konců řádků (`whitespace-pre-wrap`).
3.  **`CallToAction` (CTA):** Upoutávka s tlačítkem. Podporuje 3 varianty vzhledu (`primary` - fialovo-modrá, `secondary` - šedá s ohraničením, `dark` - tmavá břidlice).
4.  **`ColumnsBlock`:** Layoutový mřížkový systém (2, 3 nebo 4 sloupce) s flexibilním nastavením šířky sloupků (`equal`, `70-30`, `30-70`, `60-40`, `40-60`) a mezer (`sm`, `md`, `lg`, `xl`).
5.  **`ImageBlock`:** Vykreslení obrázku s nastavením poměru stran (`16:9`, `4:3`, `1:1`, `21:9`, `auto`), zaoblení rohů, zarovnání a možnosti klikacího odkazu.

### B. Dynamické & Interaktivní bloky
Tyto bloky jsou definovány v `/src/puck/PuckInteractiveBlocks.tsx` a implementují kompletní interaktivní stav a komunikaci s backendovým API:

1.  **`PollBlock` (Anketa):**
    *   **Parametry:** `pollId` (unikátní ID ankety), `question` (otázka), `description` (popisek), `optionsText` (možnosti oddělené novým řádkem).
    *   **Datový tok (Fetching):** Při načtení komponenta volá `GET /api/polls/:pollId` pro získání aktuálního počtu hlasů a statistik.
    *   **Odeslání (Submission):** Hlasování probíhá přes `POST /api/polls/vote` (tělo: `{ pollId, optionIndex }`). Úspěšný hlas se uloží lokálně do `localStorage` (`puck_poll_voted_${pollId}`), což zabrání opakovanému hlasování ve stejném prohlížeči a přepne zobrazení na interaktivní sloupcový graf s procenty.
2.  **`FormBlock` (Formulář):**
    *   **Parametry:** `formId`, `formName`, `title`, `description`, `fieldsText` (definice polí ve formátu `Popisek | typ | required`, např. `Jméno | text | true`), `submitButtonText`, `successMessage`.
    *   **Odeslání (Submission):** Data jsou serializována do JSON a odeslána na `POST /api/forms/submit` s tělem `{ formId, formName, dataJson }`. Po úspěšném odeslání se zobrazí animovaná zelená potvrzovací obrazovka.

---

## 5. CHYBĚJÍCÍ BLOKY V PUCK KATALOGU (MISSING COMPONENTS)

Aby bylo možné eliminovat tvrdé interceptování rout na frontendu, chybí v katalogu Pucku specializované bloky, které by bezpečně zapouzdřily dynamické komponenty:

1.  **`ArticlesFeedBlock`:** Blok pro vykreslení výpisu článků z databáze s podporou stránkování a filtrování podle kategorií. Dnes je výpis tvrdě zadrátován v `ArticlesSection.tsx`.
2.  **`FaqFeedBlock`:** Blok pro dynamické načítání FAQ otázek z databáze podle kategorie, s harmonikovým (accordion) efektem. Dnes renderováno staticky ve `FaqSection.tsx`.
3.  **`SubjektyRegistryBlock`:** Zapouzdření interaktivního vyhledávače institucí, soudů a OSPODů (z `RegistrSubjektu.tsx`).
4.  **`StateDataIntegratorBlock`:** Blok pro zobrazení zákonů a vyhledávání v e-Sbírce. Musí implementovat striktní klientskou cache a ochranu proti přetížení externího e-Sbírka API.
5.  **`SupportUsPaymentBlock`:** Blok pro integraci platební brány (Darujme.cz / Stripe) a generování potvrzení o daru.

---

## 6. DETAILNÍ ANALÝZA DUPLICIT (DUPLICITIES)

Během auditu byly zmapovány dvě hlavní úrovně duplicit, které způsobují zmatek při správě obsahu a zvyšují údržbové náklady:

### A. Duplicita úložného systému (Dual-Storage)
*   **Legacy CMS sekce vs. Puck JSON:** V databázi model `Page` obsahuje pole `content` (kam se ukládá Puck JSON), ale zároveň má kaskádovou relaci `sections PageSection[]` (kde jsou uloženy jednotlivé sekce jako "hero" nebo "text").
*   Služba `PageService.ts` při synchronizaci zapisuje data do **obou struktur najednou**. Při editaci stránky v administraci se však aktualizuje pouze pole `content` (Puck JSON), zatímco tabulka `PageSection` zůstává nekonzistentní.

### B. Duplicita vykreslovacího systému (Dual-Rendering)
*   Nástroj `CmsPageRenderer.tsx` i `PageRenderer.tsx` obsahují masivní switch-case bloky (kolem 300 řádků kódu), které ručně vykreslují sekce z `PageSection`.
*   Zároveň oba renderery obsahují parsovací logiku: pokud detekují platný Puck JSON v poli `content`, kompletně odignorují tabulku `PageSection` a předají vykreslování na `@measured/puck` Render engine.
*   **Největší duplicita:** Jak je popsáno v Tabulce rout, `PublicPortal.tsx` zcela obchází oba tyto renderery pro 90 % klíčových stránek a renderuje je přímo pomocí nativních React komponent z adresářů `/src/components/public/community`, `/src/components/public/ai`, `/src/components/public/legal`, `/src/components/public/academy`.

---

## 7. RIZIKOVÁ ANALÝZA (RISKS)

| Identifikované riziko | Úroveň | Dopad na systém | Navržené opatření (Mitigace) |
| :--- | :---: | :--- | :--- |
| **Obcházení autorizace a RBAC v Pucku (P0)** | **Vysoká** | Pokud by se uživatelské rozhraní privátní zóny (`user-portal`, `profile`) převedlo do Pucku, hrozí riziko, že neoprávněný uživatel podvrhne strukturu JSON a získá přístup k citlivým funkcím nebo datům jiných uživatelů (BOLA/IDOR). | **ZÁKAZ** integrace privátních klientských rozhraní do CMS. Privátní zóna musí zůstat striktně oddělená v React komponentách s backendovou kontrolou JWT a rolí v middleware. |
| **Přetížení e-Sbírka API (P0)** | **Vysoká** | Překročení limitů e-Sbírka API (max 1 req/s, 5 req/den) povede k zablokování IP adresy serveru a znefunkčnění modulu zákonů pro reálné uživatele. | Datový integrátor zákonů nesmí volat e-Sbírku přímo z prohlížeče. Synchronizace musí probíhat výhradně asynchronně na serveru (Sync Engine -> PostgreSQL -> Cache -> Klient). |
| **Ztráta uživatelských dat (Data Loss)** | **Střední**| Hromadný převod stránek přes `convertAllPagesToPuck` může přepsat dříve upravené, složitější rozvržení stránek výchozími šablonami. | Přidat do migrační služby kontrolu přítomnosti Puck metadat před přepisem a vynutit automatické zálohování (verzování) stránek v DB. |
| **Nezabezpečené nahrávání souborů** | **Vysoká** | Nahrání infikovaného PDF nebo spustitelného skriptu přes CMS editor. | Všechny soubory musí procházet serverovou proxy s povinnou kontrolou antivirem ClamAV a ukládáním do izolovaného MinIO kbelíku s náhodně generovanými názvy. |
| **Konzistence stavu (Split-Brain)** | **Střední**| Nejednotnost mezi databází PostgreSQL a in-memory stavem `dbStore` při částečném výpadku DB. | Implementovat transakční zápis. Jakmile je Prisma dostupná, musí dojít k okamžité jednosměrné synchronizaci z PostgreSQL do `dbStore` a zamezit zápisům přímo do dbStore, pokud je DB online. |

---

## 8. CÍLOVÁ ARCHITEKTURA (TARGET ARCHITECTURE)

Navržená cílová architektura striktně dodržuje pravidlo: **"Puck definuje vizuální strukturu a layout, ale data a procesy řídí bezpečné API."**

```
                  +-----------------------------------+
                  |        Administrace (Puck)        |
                  +-----------------------------------+
                                    |
                                    v (Ukládá čistý vizuální JSON)
                  +-----------------------------------+
                  |       PostgreSQL (Page.content)   |
                  +-----------------------------------+
                                    |
                                    | (Načítá strukturu layoutu)
                                    v
+------------------+      +-------------------+      +---------------------+
|  Veřejný Klient  | ---> |   PageRenderer    | ---> |  Puck Render Engine |
+------------------+      +-------------------+      +---------------------+
         |                                                      |
         | (Nativní interakce přes API)                         | (Vykresluje registrované bloky)
         v                                                      v
+------------------+                                 +---------------------+
|   Bezpečné API   | <------------------------------ |  Dynamické Bloky    |
|   (/api/polls)   |     (Hlasování / Formuláře)     | (FormBlock, Poll)   |
+------------------+                                 +---------------------+
```

### Hlavní pilíře cílové architektury:
1.  **Layout-Driven Vykreslování:** Puck Config definuje vizuální obálku. Pokud je potřeba zobrazit dynamická data (např. seznam článků), Puck vykreslí blok `ArticlesFeedBlock`, který na klientovi provede asynchronní `fetch` z `/api/cms/articles`. Data nejsou natvrdo uložena v Puck JSONu.
2.  **Oddělení odpovědnosti (Separation of Concerns):** Puck neukládá stav anket ani výsledky formulářů. Tyto operace jsou okamžitě delegovány na specializovaná, zabezpečená serverová API s rate-limitingem a CSRF ochranou.
3.  **Sanitizace a Bezpečnost:** Všechny dynamic-text vstupy z Pucku procházejí striktní XSS filtrací na frontendu i backendu.

---

## 9. MIGRAČNÍ PLÁN & IMPLEMENTAČNÍ POSTUP (MIGRATION PLAN)

Sjednocení musí probíhat v postupných, bezpečných a plně testovatelných krocích bez narušení chodu produkčního systému:

### Fáze 1: Vyčištění duplicit v kódu (P0)
*   Odstranit redundantní složku `/src/components/builder/` a sjednotit veškerou konfiguraci, normalizaci a typy pod jednotný adresář `/src/puck/`.
*   Upravit importy v `AdminPageBuilder.tsx` a `CmsPageRenderer.tsx` na nový sjednocený modul `/src/puck/config`.

### Fáze 2: Vývoj chybějících dynamických bloků (P1)
*   Vytvořit komponenty pro `ArticlesFeedBlock`, `FaqFeedBlock` a `VideoGridBlock`.
*   Zaregistrovat tyto bloky do `puckConfig` v `/src/puck/config.tsx` s příslušnými poli pro administrátora (výběr kategorií, limit počtu položek).

### Fáze 3: Migrace a nahrazení statických stránek (P1)
*   Uvolnit tvrdé intercepty v `PublicPortal.tsx` pro plně informační stránky (`memento`, `rights`, `cesta-zakladatele`, `news`, `sitemap`).
*   Ověřit, že tyto stránky se nyní správně načítají z DB přes `CmsPageRenderer` a vykreslují vizuální podobu upravenou administrátorem v Pucku.

### Fáze 4: Integrace hybridních stránek (P2)
*   Nahradit statické části stránek jako `kontakt`, `dobrovolnici` a `podpora` Puck layoutem, do kterého budou vloženy dynamické bloky (např. `FormBlock` s validací).

### Fáze 5: Kompletní deprecation a smazání `PageSection` (P2)
*   Jakmile jsou všechny stránky úspěšně převedeny na Puck Render, odstranit z databáze tabulku `PageSection` přes Prisma migraci.
*   Smazat legacy switch-case vykreslovací kód z `CmsPageRenderer.tsx` a `PageRenderer.tsx` a ponechat pouze čistý Puck `<Render />` engine.

---

## 10. HARMONOGRAM A PRIORITIZACE ÚKOLŮ (IMPLEMENTATION ORDER)

### P0 (Kritická bezpečnost, stabilita a vyčištění) - *Okamžitě*
1.  **Sjednocení konfigurace:** Přesunout a sloučit `puck.config.tsx` z `/src/components/builder/` do `/src/puck/config.tsx`. (Úsilí: Nízké, Riziko: Nízké).
2.  **Zabezpečení API formulářů a anket:** Přidat rate-limiting na `/api/forms/submit` a `/api/polls/vote`. (Úsilí: Nízké, Riziko: Nízké).
3.  **Zákaz CMS v privátní zóně:** Vytvořit striktní architektonické pravidlo zakazující rendering klientských dashboardů (`user-portal`, `profile`) přes vizuální CMS. (Úsilí: Žádné, Riziko: Žádné).

### P1 (Klíčové funkce a sjednocení hlavních stránek) - *Fáze 2*
1.  **Implementace `ArticlesFeedBlock`:** Vývoj bloku pro dynamický výpis článků z DB. (Úsilí: Střední, Riziko: Nízké).
2.  **Sjednocení informačních stránek:** Odstranění interceptů pro statické stránky v `PublicPortal.tsx` a jejich plné předání pod správu Puck CMS. (Úsilí: Střední, Riziko: Nízké).
3.  **Zprovoznění a migrace `PageTemplate`:** Implementace plnohodnotné správy systémových šablon v editoru, aby administrátoři mohli snadno vytvářet nové stránky podle předloh. (Úsilí: Střední, Riziko: Nízké).

### P2 (Optimalizace, pokročilé integrace a deprecation) - *Fáze 3*
1.  **Odstranění `PageSection`:** Úplné odstranění legacy relační tabulky sekcí z Prisma schématu a pročištění databáze. (Úsilí: Střední, Riziko: Střední - vyžaduje migraci existujících starých dat).
2.  **Smazání legacy rendererů:** Pročištění souborů `CmsPageRenderer.tsx` a `PageRenderer.tsx` od starých switch-case konstrukcí. (Úsilí: Nízké, Riziko: Nízké).

---

## 11. ZÁVĚREČNÝ VERDIKT AUDITU (PASS/FAIL VERDICTS)

Na základě hloubkové analýzy celého repozitáře, databázových modelů, API kontraktů a frontendového renderování se stanovují následující verdikty pro jednotlivé kontrolované oblasti:

### 1. Puck Config & Normalizace: [PASS]
*Zdůvodnění:* Normalizace dat (`normalizePuckData`) je navržena správně a úspěšně řeší React kolize s duplicitními ID komponent. Puck konfigurace podporuje jak základní statické elementy, tak pokročilé interaktivní bloky.

### 2. CMS API Integrace: [PASS]
*Zdůvodnění:* CRUD operace v `CmsService` a routy v `pageRoutes.ts` fungují spolehlivě. Integrace s auditními logy (`AuditLog`) je kompletní a zajišťuje zpětnou sledovatelnost změn provedených administrátory.

### 3. Konzistence a duplicita routování (Routing Consistency): [FAIL]
*Zdůvodnění:* Detekován kritický stav nekonzistence. Ačkoliv systém generuje DB stránky pro všechny moduly, frontend v `PublicPortal.tsx` tyto DB záznamy zcela ignoruje a nahrazuje je hardcoded React komponentami. Administrátor nemá možnost vizuálně ovlivnit vzhled těchto stránek přes CMS.

### 4. Bezpečnost & Autentizace (Security & Auth): [PASS]
*Zdůvodnění:* Všechny administrátorské CMS operace (vytváření, úpravy, mazání stránek a šablon) jsou bezpečně chráněny server-side middlewarem `requireAuth` a `requireRole('ADMIN')`. Citlivé operace v privátní klientské zóně jsou bezpečně izolovány mimo CMS.

### 5. Unifikace stavu (State Unification): [FAIL]
*Zdůvodnění:* Systém udržuje paralelně dvě nekonzistentní datové reprezentace obsahu: Puck JSON v poli `content` a navázané sekce v tabulce `PageSection`. Legacy CMS sekce jsou redundantní a komplikují údržbu kódu.

### 6. Integrita modulových hranic (Module Boundaries): [PASS]
*Zdůvodnění:* Integrace externích rozhraní (např. e-Sbírka) je správně zapouzdřena na backendu. e-Sbírka synchronizace respektuje stanovené přísné API limity a nehrozí zablokování IP adresy klientskými requesty.

---
*Zpracoval Tým Hlavního Architekta platformy „Táta má právo“ v srpnu 2026 pro potřeby vývoje dev3.*

---

## 12. FÁZE 3 — PILOTNÍ STRÁNKA (/o-projektu)

Úspěšně proběhla pilotní migrace a ověření Puck Unified CMS na jediné vybrané čistě informační veřejné stránce (`/o-projektu` / `/o-nas`).

### A. Výsledky pilotní migrace
*   **Pilotní URL:** `/o-projektu` (`/o-nas`)
*   **Původní renderer:** `<AboutView onNavigate={onNavigate} />` (zachován jako bezpečný fallback).
*   **Puck renderer:** `<CmsPageRenderer slug="o-projektu" onNavigate={onNavigate} />` via `<PageRender data={puckData} />` s použitím unifikované `puckConfig` v `/src/puck/config.tsx`.
*   **Použité adaptery:** `HeroBlock`, `TextBlock`, `CallToAction` (z `src/puck/adapters/`).
*   **DB persistence:** Načítání z PostgreSQL modelu `Page` (slug: `o-projektu`) s automatickým fallbackem na `dbStore`.
*   **Veřejné vykreslení:** Úspěšně ověřeno přes feature flag / rollback mechanismus `PUCK_PUBLIC_RENDERER_ENABLED`.
*   **Fallback mechanizmus:** Pokud je feature flag vypnutý (`false`) nebo pokud jsou Puck data neplatná/chybějící, systém bezpečně selže na původní render (`AboutView`).
*   **Testy:** Vytvořena a spuštěna testovací suite v `src/tests/pilotPuckPage.test.tsx` (úspěšně ověřeno načítání, fallback, validace Puck struktury a feature flag logika).
*   **TypeScript / Lint:** `tsc --noEmit` proběhl bez chyb (0 err).
*   **Production build:** `npm run build` úspěšně zkompilován.
*   **Git Branch:** `feature/puck-adapter-layer`
*   **Bezpečnostní kontrola:** Auth, RBAC, klientská data, e-Sbírka, e-Legislativa a privátní zóna (`user-portal`, `profile`) zůstaly zcela nedotčeny a odděleny. Žádné secrets nebyly vystaveny.

**PILOT STATUS: PASS**

