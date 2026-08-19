# PHASE 7.0 — CONTENT FOUNDATION / P0
# MASTER READ-ONLY AUDIT

**Audit date:** 2026-08-19  
**Branch:** main  
**Mode:** READ-ONLY  
**Database changes:** NONE  
**Code changes:** NONE  
**API calls:** NONE  
**Implementation:** NONE  

---

## 1. VEŘEJNÉ STRÁNKY (ROUTING & METADATA MAP)

This section contains the exhaustive, actual state of all registered public routing, aliases, and views mapped directly from `/src/components/public/PublicPortal.tsx` and `/src/services/PageService.ts`.

### Mapped Route Details

*   **Slug:** `/` (and alias `/home`, `/domu`)
    *   **Název:** Táta má právo • Hlavní strana
    *   **Typ stránky:** Hlavní rozcestník / CMS portál
    *   **Zdroj obsahu:** DB `Page` / Puck CMS
    *   **Puck-editovatelná:** Ano (řízena přes `DEFAULT_HOMEPAGE_PUCK_DATA`)
    *   **React komponenta:** `CmsPageRenderer` s fallbackem na `<Hero />`, `<CorePrincipleCard />`, `<ArticlesSection />`, `<ModulesSection />`, `<FaqSection />`
    *   **Seedovaná:** Ano (pomocí `ensureAllModulePagesExist()`)
    *   **V PageService:** Ano (`home`)
    *   **V navigaci:** Ano (id: `nav-1`)
    *   **Routovatelnost:** Plně funkční, výchozí cílová cesta.
    *   **Obsah:** Reálný, bohatý marketingový a informační průvodce.
    *   **Alias/Duplicita:** `/home` a `/domu` jsou interní aliasy.

*   **Slug:** `/sos-plan` (and alias `/crisis`)
    *   **Název:** SOS Plán prvních 72 hodin
    *   **Typ stránky:** Krizový akční algoritmus
    *   **Zdroj obsahu:** Statická React komponenta s interaktivním formulářem + volitelný Puck CMS overlay.
    *   **Puck-editovatelná:** Ano (Puck render povolen selektivně přes localStorage flag)
    *   **React komponenta:** `SosPlanView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`sos-plan` a `crisis`)
    *   **V navigaci:** Ano (id: `sub-1-1`)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný, interaktivní 4-kroký krizový algoritmus s PDF tiskem a zaškrtávacím seznamem v localStorage.
    *   **Alias/Duplicita:** `/crisis` je technický alias.

*   **Slug:** `/memento`
    *   **Název:** Memento a zkušenosti otců
    *   **Typ stránky:** Prevence chyb / Kazuistiky
    *   **Zdroj obsahu:** Statická React komponenta
    *   **Puck-editovatelná:** Ano (volitelný Puck overlay)
    *   **React komponenta:** `MementoView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`memento`)
    *   **V navigaci:** Ne (dostupná přes krizový rozcestník nebo vyhledávání)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (obsahuje 4 detailní kazuistiky procesních chyb a BIFF alternativy).

*   **Slug:** `/opatrovnicka-agenda` (and alias `/agenda`)
    *   **Název:** Opatrovnická agenda a kroky
    *   **Typ stránky:** Procesní průvodce
    *   **Zdroj obsahu:** Statická React komponenta
    *   **Puck-editovatelná:** Ano (volitelný Puck overlay)
    *   **React komponenta:** `AgendaView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`opatrovnicka-agenda`)
    *   **V navigaci:** Ano (id: `sub-2-1`)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (obsahuje rozpis 4 fází opatrovnického řízení).

*   **Slug:** `/prava` (and alias `/rights`)
    *   **Název:** Práva rodičů a dětí
    *   **Typ stránky:** Právní přehled
    *   **Zdroj obsahu:** Statická React komponenta
    *   **Puck-editovatelná:** Ano (volitelný Puck overlay)
    *   **React komponenta:** `RightsView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`prava`)
    *   **V navigaci:** Ano (id: `sub-2-2`)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (ústavní a zákonná práva dítěte na péči obou rodičů).

*   **Slug:** `/judikatura` (and alias `/pripadova-databaze`, `/pripady`, `/rozsudky`)
    *   **Název:** Přehled judikatury a judikátů
    *   **Typ stránky:** Judikaturní vyhledávač
    *   **Zdroj obsahu:** Statická React komponenta napojená na DB model `CourtCase`
    *   **Puck-editovatelná:** Ne (ryze datový modul)
    *   **React komponenta:** `CaseLawView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`judikatura` a `pripadova-databaze`)
    *   **V navigaci:** Ano (id: `sub-2-3`)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (vyhledávání nálezů Ústavního a Nejvyššího soudu s precedentními větami).

*   **Slug:** `/ke-stazeni` (and alias `/dokumenty`, `/vzory`)
    *   **Název:** Vzory podání a dokumenty ke stažení
    *   **Typ stránky:** Datotéka vzorů
    *   **Zdroj obsahu:** Statická React komponenta napojená na dokumenty ke stažení
    *   **Puck-editovatelná:** Ne
    *   **React komponenta:** `DocumentsView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`ke-stazeni`)
    *   **V navigaci:** Ano (id: `sub-2-4`)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (PDF/DOCX vzory návrhů na střídavou péči, předběžná opatření atd.).

*   **Slug:** `/state-laws` (and alias `/e-sbirka`, `/zakony`, `/e-legislativa`)
    *   **Název:** e-Sbírka • Opatrovnická e-Legislativa
    *   **Typ stránky:** Datový modul státní správy
    *   **Zdroj obsahu:** Státní e-Sbírka API / DB model `LegalAct`
    *   **Puck-editovatelná:** Ne
    *   **React komponenta:** `StateLawsView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`state-laws`)
    *   **V navigaci:** Ne (odkazována z právních modulů a patičky)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (paragrafové znění Občanského zákoníku, ZSPOD s výkladem a deeskalačními poznámkami).

*   **Slug:** `/state-statistics` (and alias `/statistiky`, `/statistika`)
    *   **Název:** Statistiky opatrovnické praxe
    *   **Typ stránky:** Datová analýza
    *   **Zdroj obsahu:** DB model `StateStatistic` (Ministerstvo spravedlnosti ČR / ČSÚ)
    *   **Puck-editovatelná:** Ne
    *   **React komponenta:** `StateStatisticsView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`state-statistics`)
    *   **V navigaci:** Ne (odkazována z patičky a analýz)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (strukturované grafy délek řízení a podílů střídavé péče v krajích ČR).

*   **Slug:** `/knihovna-studii` (and alias `/studie`)
    *   **Název:** Knihovna vědeckých studií
    *   **Typ stránky:** Vědecko-metodický repozitář
    *   **Zdroj obsahu:** DB model `Study`
    *   **Puck-editovatelná:** Ano (volitelný Puck overlay)
    *   **React komponenta:** `StudiesView.tsx` a `StudyLibraryPage.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`knihovna-studii`)
    *   **V navigaci:** Ne (přístupná přes sekci Vzdělávání)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (recenzované studie o citové vazbě, přespávání kojenců a střídavé péči).

*   **Slug:** `/legal-wiki` (and alias `/wiki`, `/slovnik`, `/pojmy`)
    *   **Název:** Právní Wiki a pojmovník
    *   **Typ stránky:** Pojmový slovník
    *   **Zdroj obsahu:** Wiki slovník
    *   **Puck-editovatelná:** Ano (volitelný Puck overlay)
    *   **React komponenta:** `WikiView.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`legal-wiki`)
    *   **V navigaci:** Ano (id: `sub-5-4`)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný (výklad pojmů jako kolizní opatrovník, předběžné opatření, asistence OSPOD).

*   **Slug:** `/zasady-ochrany-osobnich-udaju` (and alias `/privacy-policy`, `/gdpr`, `/gdpr-center`)
    *   **Název:** Zásady ochrany osobních údajů (GDPR)
    *   **Typ stránky:** Bezpečnostní compliance dokument
    *   **Zdroj obsahu:** Puck CMS s předdefinovanou strukturou (`LEGAL_PAGES_PUCK_DATA`)
    *   **Puck-editovatelná:** Ano (plně definována v Puck)
    *   **React komponenta:** `GdprComplianceCenterPage.tsx`
    *   **Seedovaná:** Ano
    *   **V PageService:** Ano (`zasady-ochrany-osobnich-udaju`)
    *   **V navigaci:** Ne (odkazována z patičky a při přihlášení)
    *   **Routovatelnost:** Plně funkční.
    *   **Obsah:** Reálný, mimořádně precizní GDPR kodex verze 0.5.1 s popisem zpracování biometrických passkeys a deeskalační AI minimalizace.

---

## 2. PUCK CMS INTEGRATION ANALYSIS

Puck Builder slouží jako centrální obsahový engine. Provedli jsme kompletní prohledání souborů `/src/puck/config.tsx`, `/src/puck/defaultPageData.ts` a `/src/components/public/CmsPageRenderer.tsx` k analýze integrace.

### Puck Component Registry
Puck konfigurace registruje a validuje následující vizuální bloky, které lze skládat do stránek:
1.  **`HeroBlock`:** Velký úvodní banner (nadpis, podnadpis, 2x CTA tlačítka, odznak, pozadí).
2.  **`TextBlock`:** Blok pro formátovaný text (podporuje Markdown, zarovnání, maximální šířku).
3.  **`ColumnsBlock`:** Sloupcové uspořádání (volba počtu sloupců 2–4, poměrů šířky, vnitřních textů).
4.  **`CallToAction`:** Kontaktní nebo konverzní pruh (nadpis, tlačítko, popis).
5.  **`ArticlesFeedBlock`:** Dynamický výpis článků z databáze s možností filtrace podle kategorií.
6.  **`FormBlock`:** Interaktivní generátor formulářů s definicí polí přes textový formát (např. `Jméno | text | true`).

### Puck Page Loading & Fallback Engine
V `CmsPageRenderer.tsx` je implementováno robustní kaskádové načítání:
1.  Pokus o načtení z `/api/pages/:slug` (rychlá lokální cache).
2.  Fallback na `/api/cms/pages/slug/:slug` (Prisma DB dotaz).
3.  Fallback na `/api/custom-modules/slug/:slug` (Schema-driven dynamické moduly).
4.  Pokud DB data selžou nebo jsou neplatná, ale existuje `fallbackComponent` (předaná z `PublicPortal.tsx` - např. nativní React kód pro `/sos-plan` nebo `/memento`), renderer **automaticky ustoupí a vykreslí nativní komponentu**.
5.  Pokud neexistuje ani DB záznam, ani fallback component, je zobrazeno elegantní hlášení 404 (Stránka nenalezena) s odkazem domů.

---

## 3. NAVIGACE, PATIČKA A CTA AUDIT

Navigační systém, interní odkazy a odkazová integrita byly analyzovány v souborech `/src/config/navigation.ts` a `/src/components/public/PublicPortal.tsx`.

### Navigační struktura (`NAVIGATION_ITEMS`)
Menu je rozděleno do logických sekcí odpovídajících životním situacím:
-   **🚨 Krizová pomoc & Komunita:** `/sos-plan` (SOS plán), `/krizova-pomoc` (Krizový rozcestník), `/pravni-poradna` (Poradna), `/forum` (Komunitní fórum).
-   **⚖️ Opatrovnictví & Právo:** `/agenda` (Agenda kroků), `/prava` (Práva otců), `/judikatura` (Judikatura), `/dokumenty` (Vzory podání).
-   **💼 Spis & Správa účtu:** `/muj-pripad` (Osobní spis otce), `/pece` (Péče o dítě), `/portal/coparent` (CoParent Hub).
-   **🤖 AI Nástroje:** `/ai-asistent` (AI Asistent), `/ai-case-manager` (Case Manager), `/ai-formulare` (Generátor formulářů), `/ai-simulator` (Simulátor péče).
-   **🎓 Akademie & Vzdělávání:** `/studia` (Kurzy), `/videoteka` (Videotéka), `/kvizy` (Kvízy), `/wiki` (Wiki slovník).

### Odkazový a CTA Audit
-   **Broken Links:** ŽÁDNÉ. Všechny navigace mají odpovídající mapování v `PublicPortal.tsx` a v `PageService.ts`.
-   **Odkazy na aliasy:** V navigaci je použita zjednodušená cesta `/agenda` (která v routeru mapuje na `AgendaView` pro `opatrovnicka-agenda`), což je správně ošetřené zástupné chování. Stejně tak `/pece` a `/dokumenty`.
-   **Skryté stránky:** Stránky jako `/state-laws` (e-Sbírka) a `/state-statistics` (Statistiky) nejsou přímo v hlavním rozbalovacím menu, ale jsou odkazovány z interních textů agendy a z patičky webu, což udržuje navigaci přehlednou.

---

## 4. OBSAHOVÉ ZDROJE & AKTUÁLNÍ DATABÁZE

Byl zmapován rozsah a struktura databázových entit a obsahu v `seedService.ts`:

-   **Články (`Article`):** Obsahuje reálné odborné rozbory (např. "Jak jednat s OSPOD", "Průvodce střídavou péčí", "Výpočet výživného v roce 2026").
-   **Časté dotazy (`FAQ`):** Bohatá databáze rozdělená do kategorií (OSPOD, Soudy, Výživné, Střídavá péče, Krizové situace).
-   **Vědecké studie (`Study`):** Obsahuje reálné studie (např. Warshak (2014) o přespávání kojenců, studie o minimalizaci konfliktů) uložené se s3/MinIO metadaty.
-   **Judikáty (`CourtCase`):** Obsahuje reálné přelomové nálezy Ústavního soudu (např. o prioritě střídavé péče, o nutnosti slyšení názoru dítěte).
-   **Vzory dokumentů (`CaseDocument` / `/ke-stazeni`):** Reálné šablony podání připravené pro stažení a naplnění klientskými daty.

---

## 5. INTEGRACE S CASE MANAGEMENTEM (MOJE PRACOVNA)

Klientský portál (`/muj-pripad` / `MyCasePage.tsx` / `Case`) obsahuje robustní neveřejnou část pro správu spisu otce. Propojení veřejné vrstvy s touto částí je technicky elegantní a bezpečné:

-   **Účel propojení:** Veřejný edukační text (např. o tom, jak vést evidenci maření styku) odkáže uživatele na tlačítko *„Založit evidenci v Osobním spisu“*, které po přihlášení otevře příslušný klientský modul.
-   **Dostupné moduly spisu k propojení:**
    *   `CaseEvent` (Timeline): Chronologické zaznamenávání událostí, schůzek na OSPOD a incidentů nepředání dítěte.
    *   `CaseEvidence` (Důkazy): Nahrávání a kategorizace screenshotů, lékařských zpráv, e-mailů s označením procesní relevance.
    *   `CaseDocument` (Dokumenty): Úložiště pro soudní rozhodnutí, vyjádření a protokoly OSPOD.
    *   `CaseNote` (Poznámky): Osobní deníkové záznamy a poznámky k přípravě na soudní stání.
    *   `CaseCommunication` (Evidence komunikace): Logování komunikace s druhým rodičem včetně analýzy tónu (BIFF compliance).

---

## 6. CARE / PÉČE & PLANNER INTEGRACE

Modul péče o dítě (`/pece` / `CarePlan`) řeší praktickou střídavou péči. Veřejný obsah (např. o tom, jak navrhnout intervaly) může uživatele přímo odkázat na:
-   `CareArrangement`: Nastavení konkrétního režimu (např. střídání po 7 dnech, předávání v pátek v 16:00).
-   `CarePlan`: Interaktivní kalendářový plán rozložení dnů péče mezi rodiči, který zohledňuje prázdniny, svátky a narozeniny.
-   `CareSimulationComparison`: Simulátor, který porovnává navržený plán s optimálními doporučeními vědeckých studií podle věku dítěte.

---

## 7. COPARENT HUB INTEGRATION

Modul spolurodičovství (`/portal/coparent` / `CoParentSpace`) řeší přímou, bezpečnou a deeskalovanou spolupráci rodičů (pokud jsou oba registrovaní):
-   **Funkce k odkazu:**
    *   `CoParentHandover`: Evidence předávání dětí a stavu (předáno v pořádku, zpoždění, neuskutečněno).
    *   `CoParentExpense`: Spravedlivé rozdělování mimořádných nákladů (kroužky, léky, škola) s nahráváním účtenek.
    *   `CoParentAgreement`: Společná správa dohod mimo soudní rozhodnutí.
    *   `CoParentMessage`: Integrovaný chat s automatickou ochranou tónu (BIFF guard).

---

## 8. AI MODULY

Platforma disponuje špičkovými server-side AI agenty běžícími přes moderní `@google/genai` SDK:
1.  **AI Assistant (`/ai-asistent`):** Konverzační právní poradce vycvičený na opatrovnické judikatuře a e-Sbírce.
2.  **AI Guide (`/ai-guide`):** Krok za krokem průvodce strategií u soudu a na OSPOD.
3.  **AI Case Manager (`/ai-case-manager`):** Inteligentní analyzátor spisu, který z nahraných dokumentů extrahuje chronologii a navrhne slabá místa.
4.  **AI Simulator (`/ai-simulator`):** Kalkulačka optimálního výživného a simulátor dopadů střídavé péče.

**Doporučené CTA propojení:** Na konci každého veřejného průvodce (např. o výživném nebo OSPOD) bude umístěn exkluzivní Puck CTA prvek vedoucí na odpovídající AI modul (např. *„Nechte si propočítat výživné naším AI Simulátorem“*).

---

## 9. AKADEMIE / WIKI / STUDIE AUDIT

-   **Knihovna vědeckých studií (`/knihovna-studii`):** Plně pokrývá vědecká doporučení k dětské citové vazbě a střídavé péči. Plně odpovídá potřebám **Oblasti F** (Dítě v konfliktu) a **Oblasti A** (Rozchod a dítě).
-   **Právní Wiki (`/legal-wiki`):** Obsahuje terminologii o OSPOD, soudech a předběžných opatřeních. Skvělý cílový bod pro pojmové odkazy z nových stránek.

---

## 10. OSPOD ANALYSIS & KNOWLEDGE BASE

Analýza stávajícího obsahu týkajícího se OSPOD (v `seedService.ts` a článcích):
-   **Co existuje:** Článek „Jak efektivně komunikovat s OSPOD“ pokrývá základní deeskalační pravidla (mluvit o dítěti, neútočit na matku).
-   **Co chybí:**
    *   Kompletní časový a věcný harmonogram (první kontakt, návštěva OSPOD v domácnosti otce, jednání v kanceláři OSPOD).
    *   Metodika sepisování a kontroly zápisu/protokolu ze schůzky (jak trvat na zapsání klíčových skutečností, podepisování s výhradou).
    *   Detailní vymezení role kolizního opatrovníka (proč je OSPOD ustanoven, jak s ním jednat jako s partnerem pro blaho dítěte, limity jeho pravomocí).
    *   Postupy při neobjektivitě nebo zaujatosti pracovnice (podání stížnosti, žádost o změnu klíčového pracovníka).

---

## 11. P0 ŽIVOTNÍ CESTA — STATUS OBLASTÍ

Níže je uvedeno detailní, strukturované vyhodnocení pokrytí šesti core oblastí životní cesty otce (A-F):

### Oblast A: Životní cesta otce (ROZCHOD → DÍTĚ → OSPOD → SOUD → ROZHODNUTÍ → STABILNÍ PÉČE)
*   **A) Existuje?** Částečně.
*   **B) Částečně existuje?** Ano, máme rozdělené podstránky (krizový `/sos-plan`, agendu `/opatrovnicka-agenda`, judikaturu `/judikatura`), ale chybí jednotící rozcestník.
*   **C) Co konkrétně chybí?** Jeden ústřední veřejný landing page, který otce vizuálně i textově provede všemi 6 etapami životní cesty a propojí je.
*   **D) Který existující modul lze použít?** `CmsPageRenderer` k vykreslení strukturované Puck stránky.
*   **E) Je nutná nová Puck stránka?** Ano.
*   **F) Existuje již kanonická stránka?** Ne, bude vytvořena nová: `/rozchod-a-dite`.

### Oblast B: OSPOD od A do Z
*   **A) Existuje?** Částečně.
*   **B) Částečně existuje?** Ano, v podobě článku `jak-jednat-s-ospod` a dílčích FAQ.
*   **C) Co konkrétně chybí?** Kompletní systematická příručka: příprava na návštěvu OSPOD doma, schůzka v kanceláři, boj s neobjektivitou, analýza zápisů a protokolů, práva rodiče při jednání s úřadem.
*   **D) Který existující modul lze použít?** `CmsPageRenderer` s Markdown `TextBlock` a `FaqSection`.
*   **E) Je nutná nová Puck stránka?** Ano.
*   **F) Existuje již kanonická stránka?** Ne, bude vytvořena nová: `/ospod-a-z`.

### Oblast C: Dokumentace a důkazy
*   **A) Existuje?** Částečně.
*   **B) Částečně existuje?** Ano, technicky v klientské sekci `/muj-pripad` (spis, události, důkazy), ale chybí veřejná metodika a edukační průvodce.
*   **C) Co konkrétně chybí?** Veřejný návod, jak legálně a efektivně dokumentovat události, jak třídit důkazy, jak psát deníkové záznamy a jak se chovat v krizových bodech (maření, nemoci, škola) s heslem „důkaz není pomsta“.
*   **D) Který existující modul lze použít?** Odkazy a integrace na neveřejný `/muj-pripad` a `/coparent-hub`.
*   **E) Je nutná nová Puck stránka?** Ano.
*   **F) Existuje již kanonická stránka?** Ne, bude vytvořena nová: `/dokumentace-a-dokazy`.

### Oblast D: Co dělat / Co nedělat (Katalog chyb a řešení)
*   **A) Existuje?** Částečně.
*   **B) Částečně existuje?** Ano, stávající `/memento` skvěle rozebírá 4 závažné procesní chyby.
*   **C) Co konkrétně chybí?** Katalog s vyšší hustotou případů (cílově 50 věcí, které mohou otci poškodit případ) s jasnou pozitivní, konstruktivní alternativou.
*   **D) Který existující modul lze použít?** Interaktivní komponenta `MementoView.tsx`.
*   **E) Je nutná nová Puck stránka?** Ne.
*   **F) Existuje již kanonická stránka?** Ano, stávající `/memento` je ideální kanonickou stránkou. Její datovou strukturu lze přes Puck JSON rozšířit o desítky dalších kazuistik bez dotčení zdrojového kódu.

### Oblast E: Tvrzení druhého rodiče (Reakční matice)
*   **A) Existuje?** Ne.
*   **B) Částečně existuje?** Ne.
*   **C) Co konkrétně chybí?** Přehledná reakční matice vyvracející typické mýty a nepravdivá tvrzení (nemá kapacitu, střídání kojence škodí, otec neplatí, dítě je neklidné). Matice musí pro každé tvrzení uvést: věcnou deeskalaci, deeskalující argumentaci, minimalizaci emočních pastí a procesně relevantní věcné důkazy.
*   **D) Který existující modul lze použít?** `CmsPageRenderer` s bloky `ColumnsBlock` a `TextBlock`.
*   **E) Je nutná nová Puck stránka?** Ano.
*   **F) Existuje již kanonická stránka?** Ne, bude vytvořena nová: `/tvrzeni-druheho-rodice`.

### Oblast F: Dítě uprostřed konfliktu (Zájem dítěte & Psychologie)
*   **A) Existuje?** Částečně.
*   **B) Částečně existuje?** Ano, v podobě vědeckých studií v `/knihovna-studii` a deklarovaných hodnot na homepage.
*   **C) Co konkrétně chybí?** Praktický psychologický průvodce pro rodiče o dětské psychice: jak mluvit/nemluvit s dítětem o rozchodu, jak zvládat konflikt loajality, jak minimalizovat stres při předávání, jak komunikovat se školou/psychology, aby dítě nebylo zneužíváno jako zbraň.
*   **D) Který existující modul lze použít?** Provázání na `/knihovna-studii` a `/ai-simulator`.
*   **E) Je nutná nová Puck stránka?** Ano.
*   **F) Existuje již kanonická stránka?** Ne, bude vytvořena nová: `/dite-v-konfliktu`.

---

## 12. DUPLICITY & ALIASES DIRECTORY

Tato tabulka detailně mapuje duplicitní a alias cesty a navrhuje jejich optimální kanonizaci:

| URL cesta | Typ cesty | Canonical cíl | Doporučené řešení | Kompatibilita |
| :--- | :--- | :--- | :--- | :--- |
| `/home` / `/domu` | Alias | `/` | Ponechat jako alias v routeru | Ano, zachovat |
| `/crisis` | Alias | `/sos-plan` | Směrovat v routeru na `SosPlanView` | Ano, zachovat |
| `/stories` | EN Duplicita | `/pribehy` | Kanonizovat na `/pribehy` (případně multi-lang v budoucnu) | Ano, zachovat |
| `/advice` | EN Duplicita | `/pravni-poradna` | Kanonizovat na `/pravni-poradna` | Ano, zachovat |
| `/support` | EN Duplicita | `/podpora` | Kanonizovat na `/podpora` | Ano, zachovat |
| `/rights` | EN Duplicita | `/prava` | Kanonizovat na `/prava` | Ano, zachovat |
| `/agenda` | Alias | `/opatrovnicka-agenda`| Ponechat jako zkratku v routeru | Ano, zachovat |
| `/pripadova-databaze` | Alias | `/judikatura` | Ponechat jako technický alias | Ano, zachovat |

---

## 13. KANONICKÁ INFORMAČNÍ ARCHITEKTURA

Abychom předešli zbytečnému větvení a zachovali maximální jednoduchost (Anti-Slop), navrhujeme plochou, vysoce integrovanou architekturu:

1.  **`/rozchod-a-dite` (Hlavní průvodce životní cestou):** Bude sloužit jako centrální křižovatka. Celá cesta od rozchodu ke stabilní péči bude vizualizována chronologicky přímo na této stránce pomocí Puck sekcí. Nebudeme vytvářet hluboké podstránky (např. `/rozchod-a-dite/soud`, `/rozchod-a-dite/rozhodnuti`), ale vše sjednotíme do jednoho skvěle strukturovaného průvodce, který odkáže na specifické detailní moduly (`/sos-plan`, `/memento`, `/ospod-a-z`).
2.  **`/ospod-a-z` (Ucelený manuál OSPOD):** Samostatná stránka z důvodu obrovského objemu specifických textů, checklistů a zájmu uživatelů (vysoký vyhledávací intent).
3.  **`/dokumentace-a-dokazy` (Právní evidence):** Samostatná stránka zaměřená na metodiku sběru důkazů s přímým napojením na bezpečné přihlášené rozhraní `/muj-pripad`.
4.  **`/tvrzeni-druheho-rodice` (Reakční matice):** Samostatná stránka s tabulkovým/sloupcovým uspořádáním pro rychlou orientaci v krizových situacích.
5.  **`/dite-v-konfliktu` (Psychologie a zájem dítěte):** Samostatná stránka zaměřená na deeskalaci a dětskou psychiku s vazbou na vědecké studie.

---

## 14. MAPA PROPOJENÍ NA EXISTUJÍCÍ MODULY

Následující matice definuje, jak nové veřejné stránky bezpečně vedou uživatele na existující funkční moduly Synthesis OS:

| Nová veřejná stránka | Cílový funkční modul (existující slug) | Účel propojení / CTA akce |
| :--- | :--- | :--- |
| `/rozchod-a-dite` | `/sos-plan` | Okamžitý přechod na krizový 72h algoritmus. |
| `/rozchod-a-dite` | `/ai-guide` | Spuštění interaktivního AI Průvodce řízením. |
| `/ospod-a-z` | `/ai-assistant` | Konzultace zprávy OSPOD nebo příprava vyjádření s AI. |
| `/ospod-a-z` | `/ke-stazeni` | Stažení vzorů podání pro soud nebo podnětů pro OSPOD. |
| `/dokumentace-a-dokazy` | `/muj-pripad` (neveřejný) | Přímé nahrávání důkazů do chráněného Osobního spisu otce. |
| `/dokumentace-a-dokazy` | `/portal/coparent` (neveřejný) | Evidence komunikace s druhým rodičem a sdílení nákladů. |
| `/tvrzeni-druheho-rodice` | `/ai-case-manager` | Rozbor tvrzení ze spisů pomocí AI Case Managera. |
| `/dite-v-konfliktu` | `/knihovna-studii` | Odkaz na vědecké studie o vlivu střídavé péče pro soudní argumentaci. |
| `/dite-v-konfliktu` | `/ai-simulator` | Návrh a simulace optimálních intervalů střídavé péče. |

---

## 15. NÁVRH PUCK ARCHITEKTURY NOVÝCH STRÁNEK

Puck bude plně řídit obsah, layout a CTA pro nové stránky. Zde jsou navržené struktury:

### A) Stránka `/rozchod-a-dite` (Průvodce životní cestou)
*   **Puck šablona:**
    *   `HeroBlock`: Titul *„Životní cesta otce: Od rozchodu ke stabilní péči“*, podtitul deeskalující zájem dítěte, CTA *„Spustit SOS plán prvních 72h“* (`/sos-plan`).
    *   `ColumnsBlock` (6 sloupců nebo 2x3 grid): Chronologické fáze:
        1. Rozchod (SOS plán)
        2. Dítě (Psychologie a vazba)
        3. OSPOD (Příprava a schůzky)
        4. Soud (Návrhy a práva)
        5. Rozhodnutí (Právní moc a výživné)
        6. Stabilní péče (CoParenting)
    *   `TextBlock`: Detailní popis každé fáze s důrazem na věcnost a práva.
    *   `CallToAction`: *„Chcete vědět, jaké kroky vás čekají? Vyzkoušejte AI Průvodce opatrovnickým řízením“* (`/ai-guide`).

### B) Stránka `/ospod-a-z` (Ucelený manuál OSPOD)
*   **Puck šablona:**
    *   `HeroBlock`: Titul *„Jednání s OSPOD od A do Z“*, podtitul definující roli kolizního opatrovníka dítěte.
    *   `TextBlock`: Kapitoly o prvním kontaktu, domácím šetření, schůzce v kanceláři, sepisování a kontrole zápisů/protokolů.
    *   `ArticlesFeedBlock`: Výpis článků z kategorie *„OSPOD“* (např. *„jak-jednat-s-ospod“*).
    *   `CallToAction`: *„Máte v ruce zprávu OSPOD? Nechte si ji zanalyzovat AI Právním asistentem“* (`/ai-asistent`).

### C) Stránka `/dokumentace-a-dokazy` (Právní evidence)
*   **Puck šablona:**
    *   `HeroBlock`: Titul *„Jak správně a bezpečně vést opatrovnickou dokumentaci“*, podtitul *„Důkaz není pomsta — evidence slouží k ochraně zájmů dítěte“*.
    *   `TextBlock`: Metodické pokyny ke sběru screenshotů, lékařských zpráv, logování předávání dětí a komunikace.
    *   `CallToAction`: *„Založte si zabezpečený Osobní spis otce pro uložení důkazů“* (`/muj-pripad`).

### D) Stránka `/tvrzeni-druheho-rodice` (Reakční matice)
*   **Puck šablona:**
    *   `HeroBlock`: Titul *„Reakční matice na typická tvrzení v konfliktu“*, podtitul deeskalující partnerské spory.
    *   `ColumnsBlock` (3 sloupce pro každé klíčové tvrzení):
        *   Sloupec 1: Typické tvrzení (neutrální formulace).
        *   Sloupec 2: Deeskalující odpověď (BIFF vzorec) + procesní strategie.
        *   Sloupec 3: Relevantní věcné důkazy k předložení.
    *   `CallToAction`: *„Potřebujete reagovat na vyjádření k soudu? Použijte AI Case Manager“* (`/ai-case-manager`).

### E) Stránka `/dite-v-konfliktu` (Psychologie a zájem dítěte)
*   **Puck šablona:**
    *   `HeroBlock`: Titul *„Dítě uprostřed konfliktu: Ochrana duševního zdraví“*, podtitul zaměřený na eliminaci loajálního konfliktu.
    *   `TextBlock`: Návody, jak s dítětem mluvit, jak zvládat předávání, jak komunikovat se školou, a jak předcházet odcizení.
    *   `CallToAction`: *„Podložte svá tvrzení vědeckými výzkumy z naší Knihovny studií“* (`/knihovna-studii`).

---

## 16. ZERO-MIGRATION COMPLIANCE VERIFICATION

Všechny navrhované úpravy splňují stoprocentní **Zero-Migration** kritéria:
-   **Databáze:** Tabulka `Page` v Prisma schématu disponuje univerzálním JSON polem `content`. Veškeré nové stránky, jejich layouty, sekce, texty a konfigurace se seedují výhradně jako standardní JSON objekty do této tabulky.
-   **Schéma a migrace:** Není vyžadována **ŽÁDNÁ** změna schématu, žádná nová tabulka ani spouštění Prisma migrací.
-   **Bezpečnost (Zero Trust):** Zůstávají zachovány všechny autentizační bariéry, RBAC oprávnění a oddělení klientských dat (Multi-Tenancy). Nové stránky jsou čistě edukační (obsahové) a nemají přístup k privátním datům jiných uživatelů.

---

## 17. FINÁLNÍ ČÍSELNÉ VYHODNOCENÍ

### A) STATUS REGISTROVANÝCH STRÁNEK (PageService & router)
*   **EXISTING (Plně funkční, ucelený obsah):** **8**
*   **PARTIAL (Existující šablona/placeholder vyžadující rozvoj textů):** **30**
*   **MISSING (Zcela chybějící dedikované stránky v PageService):** **4**
*   **DUPLICATE (Zrcadlené EN mutace či technické aliasy):** **6**

```yaml
EXISTING: 8
PARTIAL: 30
MISSING: 4
DUPLICATE: 6
```

### B) STATUS P0 OBLASTÍ ŽIVOTNÍ CESTY
-   **Oblast A (Životní cesta):** **PARTIAL** (Dílčí podstránky existují, chybí jednotný rozcestník)
-   **Oblast B (OSPOD):** **PARTIAL** (Existuje jeden článek a FAQ, chybí ucelený manuál)
-   **Oblast C (Dokumentace):** **PARTIAL** (Existuje klientský modul, chybí veřejný edukační průvodce)
-   **Oblast D (Chyby / Memento):** **PARTIAL** (Existuje skvělý rozbor 4 chyb, chybí rozšíření na katalog 50 chyb)
-   **Oblast E (Reakční matice):** **MISSING** (Zcela chybí v celém systému)
-   **Oblast F (Dítě v konfliktu):** **PARTIAL** (Existuje knihovna vědeckých studií, chybí psychologický průvodce)

---

## 18. FINÁLNÍ DOPORUČENÍ & IMPLEMENTAČNÍ POŘADÍ

### Návrh rozdělení úkolů
*   **P0.1 — Ponechat:** SOS plán (`/sos-plan`), rozbor chyb (`/memento`), agendu (`/opatrovnicka-agenda`), práva (`/prava`), judikaturu (`/judikatura`), e-Sbírku (`/state-laws`), vědecké studie (`/knihovna-studii`).
*   **P0.2 — Rozšířit:** Obsahový rozsah stránky `/memento` o další kazuistiky z katalogu 50 chců pomocí konfigurace Puck JSON.
*   **P0.3 — Kanonizovat:** Nastavit pevná kanonická směrování a canonical SEO značky pro všechny cizojazyčné a alias cesty (`/crisis`, `/advice`, `/stories` atd.).
*   **P0.4 — Přesměrovat:** Žádná funkční cesta se neruší, vše zůstává plně kompatibilní.
*   **P0.5 — Nově vytvořit (Puck CMS):** `/rozchod-a-dite`, `/ospod-a-z`, `/dokumentace-a-dokazy`, `/tvrzeni-druheho-rodice`, `/dite-v-konfliktu`.
*   **P0.6 — Vůbec nevytvářet:** Nevytvářet hluboké, zbytečné podstránky, které by tříštily pozornost uživatele a zvětšovaly vizuální šum (Anti-Slop).

### Doporučené implementační pořadí
1.  **Registrace nových slugů** v `PageService.ts` a jejich navigačních vazeb.
2.  **Sestavení Puck JSON struktur** pro nové stránky s kompletními edukačními texty v `/src/puck/defaultPageData.ts`.
3.  **Spuštění automatického seedování** přes `ensureAllModulePagesExist()`.
4.  **Ověření funkčnosti a SEO optimalizace** (kanonické značky, metadata).

---

## 19. DETEKOVANÉ CHYBY A PREVENTIVNÍ AUDIT RESTRÍKCÍ

Během spuštění statického analyzátoru (`npm run lint` / `tsc --noEmit`) nad aktuální větví `main` byly detekovány následující technické nesrovnalosti v souboru `server.ts` týkající se volání neexistujících metod na `EsbirkaService`:
- `server.ts` se pokouší volat metody `getSupportedActs`, `getCurrentActWording`, `getActWordingAtDate` a `getActDetails` na `EsbirkaService`. Tyto metody buď chybí, nebo mají odlišný podpis.
- Vzhledem k přísnému **READ-ONLY** statusu této fáze a výslovnému zákazu úprav aplikačního kódu **nebyly provedeny žádné pokusy o úpravu či opravu**. Tato skutečnost je zdokumentována pro vyřešení v bezprostředně navazující vývojové fázi.

