# MASTER CONTENT & PUBLIC NAVIGATION ARCHITECTURE MAP

**DATUM:** 2026-09-02  
**BRANCH:** `feat/faze-6a-unified-ai-audit-operations`  
**COMMIT SHA:** `bec2a656f13698a9c5a472f9bdfa39117287b8af`  
**SCOPE:** Read-Only inventura veřejného menu, existujících veřejných rout a komponent, kategorizace obsahu a návrh nové informační architektury (Life-Situations oriented).

---

## 1. INVENTURA VEŘEJNÉHO MENU (`src/config/navigation.ts`)

V `src/config/navigation.ts` je celkem **52 položek**, z toho:
- **Veřejné (public):** 40 položek (7 hlavních kategorií + 33 podpoložek)
- **Uživatelské (user - po přihlášení):** 8 položek (2 kategorie + 6 podpoložek)
- **Administrátorské (admin - pouze role):** 5 položek (1 kategorie + 4 podpoložky)

### Přehled existujících veřejných kategorií:
1. `cat-home` — **🏠 Domů & Veřejnost** (`/`) — Podpoložky: Domů (`/`), Přihlásit / Registrace (`/login`)
2. `cat-1` — **🚨 Pomoc & Komunita** (`/krizova-pomoc`) — Podpoložky: SOS krizový plán (`/sos-plan`), Krizový rozcestník (`/krizova-pomoc`), Právní poradna (`/pravni-poradna`), Fórum (`/forum`), Memento otců (`/memento`), Registr subjektů (`/registr-subjektu`), Mapa subjektů (`/mapa-subjektu`)
3. `cat-2` — **⚖️ Právo & Opatrovnictví** (`/agenda`) — Podpoložky: Agenda opatrovnického řízení (`/agenda`), Práva otců (`/prava`), Judikatura (`/judikatura`), Vzory dokumentů (`/dokumenty`), Odborné články (`/clanky`), Zákony / e-Sbírka (`/state-laws`), Průvodce OSPOD (`/ospod`), Průvodce soudním řízením (`/soud`), Finanční a majetkové vypořádání (`/majetek`)
4. `cat-3` — **👨‍👧 Péče & Spolurodičovství** (`/pece`) — Podpoložky: Péče o dítě / Care Hub (`/pece`), CoParent Hub (`/portal/coparent`), Kalkulačka výživného (`/kalkulacka-vyzivneho`), Psychologická podpora dětí (`/psychologie`)
5. `cat-5` — **🤖 AI Nástroje** (`/ai-asistent`) — Podpoložky: AI Právní Asistent (`/ai-asistent`), AI Průvodce řízením (`/ai-pruvodce`), Generátor formulářů (`/ai-formulare`), Simulátor modelů péče (`/ai-simulator`)
6. `cat-6` — **🎓 Akademie & Vzdělávání** (`/studia`) — Podpoložky: Kurzy pro rodiče (`/studia`), Videotéka & Webináře (`/videoteka`), Kvízy (`/kvizy`), Encyklopedie & Wiki pojmů (`/wiki`), Katalog odborných studií (`/studie`), Statistiky a data (`/state-statistics`), Uživatelský manuál (`/user-manual`)
7. `cat-7` — **📰 Aktuality & Příběhy** (`/novinky`) — Podpoložky: Novinky & Zprávy (`/novinky`), Příběhy otců (`/pribehy`)
8. `cat-8` — **🏛️ O projektu & Podpora** (`/o-projektu`) — Podpoložky: O nás & Tvůrci (`/o-projektu`), Moje cesta zakladatele (`/moje-cesta-zakladatele`), Podpořte nás (`/podporte-nas`), Kontakt (`/kontakt`), Hledáme dobrovolníky (`/dobrovolnici`), Kodex dobrovolníka (`/kodex-dobrovolnika`), Mapa stránek (`/sitemap`)

### Kritická zjištění k menu:
- **Přetížení a redundance:** Menu obsahuje 7 veřejných kategorií s až 9 podpoložkami v jedné kategorii (např. Právo).
- **Míchání kontextů:** Přihlášení/Registrace je umístěno jako položka pod "Domů" namísto v hlavičce/akční liště.
- **Rozpad péče a dětí:** Péče o dítě (`/pece`), CoParent Hub (`/portal/coparent`), výživné a psychologie jsou namíchány v jedné kategorii, zatímco procesní průvodce jako Škola a Zdravotní péče v menu zcela chybí.
- **Příliš technické názvy:** Názvy jako "Agenda opatrovnického řízení" nebo "AI Context & Administrace" nejsou optimalizovány pro otce v krizové situaci.

---

## 2. INVENTURA SKUTEČNÝCH VEŘEJNÝCH ROUT (`PublicPortal.tsx`)

| Veřejná routa | Komponenta / View | Status | Poznámka k implementaci |
|---|---|---|---|
| `/` | `Hero`, `ArticlesSection`, `ModulesSection`, `FaqSection` | **IMPLEMENTED** | S podporou Puck CMS rendereru (`CmsPageRenderer slug="home"`) |
| `/krizova-pomoc` | `CrisisCommunityPortal` | **IMPLEMENTED** | Kompletní krizové kontakty a rozcestník |
| `/sos-plan` | `SosPlanView` | **IMPLEMENTED** | Krizový interaktivní SOS plán |
| `/pravni-poradna` | `LegalHelpView` | **IMPLEMENTED** | Veřejná právní poradna |
| `/forum` | `ForumView` | **IMPLEMENTED** | Komunitní diskuse a vlákna |
| `/memento` | `MementoView` | **IMPLEMENTED** | Memento otců a krizová historie |
| `/registr-subjektu` | `RegistrSubjektu` | **IMPLEMENTED** | Full-text registr OSPOD, soudů, znalců a mediátorů s hodnocením |
| `/mapa-subjektu` | `MapaSubjektuView` | **IMPLEMENTED** | Geografická mapa subjektů s filtry |
| `/agenda` | `AgendaView` | **IMPLEMENTED** | Fázový průvodce opatrovnickým řízením |
| `/prava` | `RightsView` | **IMPLEMENTED** | Přehled rodičovských práv a povinností |
| `/judikatura` | `CaseLawView` | **IMPLEMENTED** | Přelomová judikatura ÚS/NS |
| `/dokumenty` | `DocumentsView` | **IMPLEMENTED** | Vzory návrhů a podání ke stažení |
| `/clanky`, `/clanky/:slug` | `ArticlesSection`, `ArticleDetailView` | **IMPLEMENTED** | Katalog a detail odborných článků |
| `/metodika`, `/metodika/:slug` | `LegalHubPage`, `LegalGuideDynamicView` | **IMPLEMENTED** | Metodické články a CMS průvodci |
| `/state-laws` | `StateLawsView` | **IMPLEMENTED** | e-Sbírka / integrace zákonů s vyhledáváním |
| `/ospod` | `LegalGuideDynamicView` + `OspodGuideView` | **IMPLEMENTED** | Průvodce OSPOD (dynamický CMS + fallback) |
| `/soud` | `LegalGuideDynamicView` + `CourtGuideView` | **IMPLEMENTED** | Průvodce soudem (dynamický CMS + fallback) |
| `/spis` | `LegalGuideDynamicView` + `CaseFileGuideView` | **IMPLEMENTED** | Nahlížení do spisu |
| `/vykon-rozhodnuti` | `LegalGuideDynamicView` + `EnforcementGuideView`| **IMPLEMENTED** | Výkon rozhodnutí a maření styku |
| `/znalecke-posudky` | `LegalGuideDynamicView` + `ExpertReportsGuideView`| **IMPLEMENTED** | Znalecké posudky |
| `/odvolani` | `LegalGuideDynamicView` + `AppealsGuideView` | **IMPLEMENTED** | Odvolání, dovolání, ústavní stížnost |
| `/mezinarodni-spory` | `LegalGuideDynamicView` + `InternationalDisputesGuideView` | **IMPLEMENTED** | Mezinárodní únosy a UMPOD |
| `/zdravotni-pece` | `LegalGuideDynamicView` + `HealthcareGuideView` | **IMPLEMENTED** | Zdravotní péče o dítě, OČR, nahlížení do dokumentace |
| `/skola` | `LegalGuideDynamicView` + `SchoolsGuideView` | **IMPLEMENTED** | Školka, škola, změna školy, informovanost rodiče |
| `/majetek` | `MajetekView` | **IMPLEMENTED** | Komplexní průvodce SJM a hypotékou |
| `/psychologie` | `PsychologieView` | **IMPLEMENTED** | Psychologická podpora a vývojová stádia dětí (0-3, 3-6, 6-11, 12+) |
| `/pece` | `CareHubPublicLandingView` / CMS | **PARTIAL** | Landing page pro péči |
| `/portal/coparent` | `CoParentHubPage` | **IMPLEMENTED** | Interaktivní CoParent Hub |
| `/kalkulacka-vyzivneho`| `AlimonyCalculatorPage` | **IMPLEMENTED** | MPSV kalkulačka výživného |
| `/ai-asistent` | `AiAssistantView` | **IMPLEMENTED** | Interaktivní AI právní chat |
| `/ai-pruvodce` | `AiGuideView` | **IMPLEMENTED** | Interaktivní fázový AI průvodce řízením |
| `/ai-formulare` | `AiFormsView` | **IMPLEMENTED** | Generátor a centrum formulářů |
| `/ai-simulator` | `AiSimulatorView` | **IMPLEMENTED** | Simulátor střídavé péče a předávání |
| `/ai-case-manager` | `AiCaseManagerView` | **IMPLEMENTED** | AI Case Manager a rozbor spisu |
| `/studia` | `StudiesView` | **IMPLEMENTED** | Kurzy a akademie |
| `/videoteka` | `VideothequeView` | **IMPLEMENTED** | Videotéka a webináře |
| `/kvizy` | `QuizzesView` | **IMPLEMENTED** | Interaktivní kvízy a trenažér |
| `/wiki` | `WikiView` | **IMPLEMENTED** | Dynamická Encyklopedie a Wiki |
| `/studie` | `StudyLibraryPage` | **IMPLEMENTED** | Katalog vědeckých recenzovaných studií |
| `/state-statistics` | `StateStatisticsView` | **IMPLEMENTED** | Státní demografické a soudní statistiky |
| `/novinky` | `NewsHubView` | **IMPLEMENTED** | Novinky a aktuality |
| `/pribehy` | `CaseStoriesView` | **IMPLEMENTED** | Reálné příběhy a kazuistiky otců |
| `/o-projektu` | `AboutView` | **IMPLEMENTED** | Informace o projektu a spolku |
| `/moje-cesta-zakladatele`| `FounderStoryPage` | **IMPLEMENTED** | Příběh zakladatele |
| `/podporte-nas` | `SupportUsPage` | **IMPLEMENTED** | Transparentní účet a možnosti podpory |
| `/kontakt` | `ContactView` | **IMPLEMENTED** | Kontaktní formulář a údaje |
| `/dobrovolnici` | `VolunteersPage` | **IMPLEMENTED** | Nábor dobrovolníků a formulář |
| `/kodex-dobrovolnika` | `VolunteerCodexPage` | **IMPLEMENTED** | Etický kodex dobrovolníka |
| `/sitemap` | `SitemapPage` | **IMPLEMENTED** | HTML mapa stránek |
| `/user-manual` | `UserManualPage` | **IMPLEMENTED** | Uživatelský manuál |
| `/pravni-dokumenty` | `LegalDocsPage` | **IMPLEMENTED** | Právní doložky a podmínky portálu |
| `/zasady-ochrany-osobnich-udaju` | `GdprComplianceCenterPage` | **IMPLEMENTED** | GDPR a ochrana soukromí |
| `/dohoda-o-spolupraci` | `VolunteerAgreementPage` | **IMPLEMENTED** | E-dohoda pro dobrovolníky |
| `/aktivita-portalu` | `PortalActivityPanel` | **IMPLEMENTED** | Živá anonymizovaná telemetrie |
| `/kalendar` | `KalendarView` (v `placeholderViews.tsx`) | **PLACEHOLDER** | Jednoduchý textový placeholder |

---

## 3. INVENTURA OBSAHOVÝCH OBLASTÍ & STATUS

| Oblast | Témata / Moduly | Reálný Status |
|---|---|---|
| **1. Krizová pomoc** | SOS plán, krizové linky, psychická první pomoc, Memento | **IMPLEMENTED** |
| **2. Právo & Zákony** | Práva otců, opatrovnická agenda, e-Sbírka, SJM / majetek | **IMPLEMENTED** |
| **3. Procesní průvodci** | OSPOD, soud, spis, odvolání, výkon rozhodnutí, posudky, mezinárodní spory | **IMPLEMENTED** |
| **4. Dítě, škola & zdraví**| Psychologický vývoj (0-3, 3-6, 6-11, 12+), škola/školka, zdravotní péče, OČR | **IMPLEMENTED** (Není však v hlavním menu) |
| **5. Judikatura** | Rozsudky Ústavního a Nejvyššího soudu, judikáty ke střídavé péči | **IMPLEMENTED** |
| **6. Výživné & Náklady** | Kalkulačka dle MPSV tabulek, výpočet nákladů a podílu péče | **IMPLEMENTED** |
| **7. CoParenting & Péče**| CoParent Hub, plány péče, komunikace rodičů | **IMPLEMENTED** |
| **8. Vzory & Podání** | Vzory ke stažení, centrum formulářů, generátor podání | **IMPLEMENTED** |
| **9. AI Nástroje** | AI Asistent, AI Průvodce řízením, AI Case Manager, Simulátor | **IMPLEMENTED** |
| **10. Encyklopedie & Wiki**| Právní pojmy, dynamické CMS vyhledávání, abecední rejstřík | **IMPLEMENTED** |
| **11. Vědecké studie** | Knihovna recenzovaných studií (Fabricius, Warshak, Nielsen atd.) | **IMPLEMENTED** |
| **12. Vzdělávání & Kvízy**| Kurzy pro rodiče, videotéka, interaktivní testy | **IMPLEMENTED** |
| **13. Statistiky & Data** | Rozvodovost, svěření do péče, délka řízení dle ČSÚ/MS ČR | **IMPLEMENTED** |
| **14. Registr & Mapa** | Registr OSPOD/soudů/znalců/mediátorů s mapovým zobrazením | **IMPLEMENTED** |
| **15. Komunita & Příběhy** | Fórum, poradna, skutečné příběhy otců | **IMPLEMENTED** |
| **16. Kalendář a lhůty** | Procesní lhůtníkový kalendář | **PLACEHOLDER** |
| **17. B.I.F.F. Komunikace** | Školení konstruktivní deeskalační komunikace | **MISSING** (Vhodné pro nový obsah) |

---

## 4. POROVNÁNÍ S AUDITEM Z 2026-08-22 (`DEV3_P1_P2_SEO_MENU_CMS_AUDIT_2026-08-22.md`)

- **Kompatibilita:** Všechny P1 a P2 položky z auditu 22. 8. 2026 zůstávají 100% platné a integrované:
  - `SeoHead` je nasazen na `/registr-subjektu`, `/mapa-subjektu`, `/studie`, `/sos-plan`, `/pravni-dokumenty`.
  - Položka "Katalog odborných studií a výzkumů" (`/studie`) a "Encyklopedie & Wiki pojmů" (`/wiki`) jsou správně propojeny na dynamické CMS.
- **Nově zjištěné rozpory / příležitosti:**
  - V menu chybí přímé odkazy na vynikající nově vytvořené průvodce: **Škola a školka** (`/skola`), **Zdravotní péče a dokumentace** (`/zdravotni-pece`), **Nahlížení do spisu** (`/spis`), **Znalecké posudky** (`/znalecke-posudky`) a **Výkon rozhodnutí** (`/vykon-rozhodnuti`). Tyto stránky existují a jsou plně funkční, ale uživatel na ně z hlavního menu nenarazí.

---

## 5. NÁVRH NOVÉ INFORMAČNÍ ARCHITEKTURY (LIFE-SITUATIONS ORIENTED)

Navrhujeme redukci z původních 7 přetížených kategorií na **9 čistých, tématických kategorií zaměřených na životní situace**:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TÁTA MÁ PRÁVO — HLAVNÍ MENU                                     │
├─────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────────┬──────────┬────────┤
│ 🏠 Domů │ 🆘 Potřebuji │ 👨‍👧 Moje     │ 🤝 Spolurodi-│ ⚖️ Právo a   │ 📝 Dokumenty │ 🤖 AI    │ 📚     │
│         │    pomoc     │    dítě      │    čovství   │    soudy     │    a podání  │  nástroje│ Knihovna
└─────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────────┴──────────┴────────┘
```

### Detailní struktura navrženého menu:

#### 1. 🏠 Domů (`/`)
- **Účel:** Hlavní vstupní brána, rozcestník pro otce, aktuální upozornění a živá aktivita portálu.
- **Položky:**
  - Úvodní stránka (`/`)
  - Živá aktivita portálu (`/aktivita-portalu`)
  - O projektu & Vize (`/o-projektu`)

#### 2. 🆘 Potřebuji pomoc (`/krizova-pomoc`)
- **Účel:** Okamžitá krizová intervence, první kroky po rozchodu, nouzové kontakty.
- **Položky:**
  - SOS krizový plán — první kroky (`/sos-plan`)
  - Krizový rozcestník & Linky pomoci (`/krizova-pomoc`)
  - Právní poradna & Dotazy (`/pravni-poradna`)
  - Registr & Hodnocení subjektů (`/registr-subjektu`)
  - Mapa institucí a poraden (`/mapa-subjektu`)
  - Memento otců (`/memento`)

#### 3. 👨‍👧 Moje dítě (`/pece`)
- **Účel:** Vše týkající se dítěte — psychologie, péče, škola, lékaři a věk dítěte.
- **Položky:**
  - Psychologický vývoj & Emoce dítěte (`/psychologie`)
  - Péče o novorozence a malé děti (`/pece`)
  - Škola, školka & Informovanost rodiče (`/skola`)
  - Lékařská péče, OČR & Zdravotní dokumentace (`/zdravotni-pece`)
  - Výzkumy citové vazby & Přespávání (`/studie`)

#### 4. 🤝 Spolurodičovství & Finance (`/coparent-hub`)
- **Účel:** Praktické fungování po rozchodu, komunikace s matkou, výživné a majetek.
- **Položky:**
  - CoParent Hub — Nástroj pro rodiče (`/portal/coparent`)
  - Kalkulačka výživného MPSV (`/kalkulacka-vyzivneho`)
  - Finanční a majetkové vypořádání (SJM) (`/majetek`)
  - Simulátor modelů péče a předávání (`/ai-simulator`)
  - Deeskalační komunikace (B.I.F.F.) (`/komunikace-biff` — *Nový obsah*)

#### 5. ⚖️ Právo a soudy (`/agenda`)
- **Účel:** Kompletní právní procesní navigace pro otce v řízení.
- **Položky:**
  - Průvodce opatrovnickým řízením (`/agenda`)
  - Práva otců & Rodičovská odpovědnost (`/prava`)
  - Průvodce OSPOD (`/ospod`)
  - Průvodce soudním jednáním (`/soud`)
  - Nahlížení do spisu & Příprava důkazů (`/spis`)
  - Znalecké posudky v rodinném právu (`/znalecke-posudky`)
  - Odvolání, dovolání & Ústavní stížnosti (`/odvolani`)
  - Výkon rozhodnutí & Maření péče (`/vykon-rozhodnuti`)
  - Mezinárodní spory & Únosy dětí (`/mezinarodni-spory`)
  - Přelomová judikatura ÚS a NS (`/judikatura`)
  - Zákony & e-Sbírka předpisů (`/state-laws`)

#### 6. 📝 Dokumenty a podání (`/dokumenty`)
- **Účel:** Všechny vzory, formuláře a šablony podání na jednom místě.
- **Položky:**
  - Vzory návrhů a podání ke stažení (`/dokumenty`)
  - Inteligentní generátor formulářů (`/ai-formulare`)
  - Vzor rodičovského plánu (`/dokumenty/rodicovsky-plan`)
  - Návrh na nařízení předběžného opatření (`/dokumenty/predbezne-opatreni`)

#### 7. 🤖 AI Asistenti (`/ai-asistent`)
- **Účel:** Přehledné sdružení všech inteligentních nástrojů portálu.
- **Položky:**
  - AI Právní Asistent — konzultace (`/ai-asistent`)
  - AI Průvodce procesními kroky (`/ai-pruvodce`)
  - AI Analýza spisu & Case Manager (`/ai-case-manager`)
  - Simulátor péče & Harmonogramů (`/ai-simulator`)

#### 8. 📚 Knihovna a data (`/wiki`)
- **Účel:** Vzdělávání, odborné zázemí a statistiky.
- **Položky:**
  - Encyklopedie & Právní slovník (`/wiki`)
  - Katalog vědeckých recenzovaných studií (`/studie`)
  - Odborné články a analýzy (`/clanky`)
  - Statistická data ČR o péči a soudech (`/state-statistics`)
  - Videotéka & Webináře (`/videoteka`)
  - Kvízy & Opatrovnický trenažér (`/kvizy`)

#### 9. 📰 Komunita & O projektu (`/o-projektu`)
- **Účel:** Transparentnost, komunita, novinky a kontakt.
- **Položky:**
  - O spolku & Tvůrci (`/o-projektu`)
  - Příběhy a zkušenosti otců (`/pribehy`)
  - Komunitní fórum (`/forum`)
  - Novinky & Aktuality (`/novinky`)
  - Podpořte nás (`/podporte-nas`)
  - Kontakt & Poradna (`/kontakt`)
  - Hledáme dobrovolníky (`/dobrovolnici`)
  - Uživatelský manuál (`/user-manual`)

---

## 6. MAPOVÁNÍ STARÉHO MENU NA NOVOU STRUKTURU

| Stará kategorie | Stará položka | Nová kategorie | Cílová routa | Stav |
|---|---|---|---|---|
| `cat-home` | Domů | 🏠 Domů | `/` | Existuje |
| `cat-home` | Přihlásit / Registrace | *Přesunuto do hlavičky* | `/login` | Existuje |
| `cat-1` | SOS krizový plán | 🆘 Potřebuji pomoc | `/sos-plan` | Existuje |
| `cat-1` | Krizový rozcestník | 🆘 Potřebuji pomoc | `/krizova-pomoc` | Existuje |
| `cat-1` | Právní poradna | 🆘 Potřebuji pomoc | `/pravni-poradna` | Existuje |
| `cat-1` | Fórum | 📰 Komunita & O projektu | `/forum` | Existuje |
| `cat-1` | Registr subjektů | 🆘 Potřebuji pomoc | `/registr-subjektu` | Existuje |
| `cat-1` | Mapa subjektů | 🆘 Potřebuji pomoc | `/mapa-subjektu` | Existuje |
| `cat-2` | Agenda řízení | ⚖️ Právo a soudy | `/agenda` | Existuje |
| `cat-2` | Práva otců | ⚖️ Právo a soudy | `/prava` | Existuje |
| `cat-2` | Judikatura | ⚖️ Právo a soudy | `/judikatura` | Existuje |
| `cat-2` | Vzory dokumentů | 📝 Dokumenty a podání | `/dokumenty` | Existuje |
| `cat-2` | Odborné články | 📚 Knihovna a data | `/clanky` | Existuje |
| `cat-2` | Zákony / e-Sbírka | ⚖️ Právo a soudy | `/state-laws` | Existuje |
| `cat-2` | Průvodce OSPOD | ⚖️ Právo a soudy | `/ospod` | Existuje |
| `cat-2` | Průvodce soudem | ⚖️ Právo a soudy | `/soud` | Existuje |
| `cat-2` | Majetkové vypořádání | 🤝 Spolurodičovství & Finance | `/majetek` | Existuje |
| *Nové v menu*| Škola a školka | 👨‍👧 Moje dítě | `/skola` | Existuje (implementováno) |
| *Nové v menu*| Zdravotní péče | 👨‍👧 Moje dítě | `/zdravotni-pece` | Existuje (implementováno) |
| *Nové v menu*| Nahlížení do spisu | ⚖️ Právo a soudy | `/spis` | Existuje (implementováno) |
| *Nové v menu*| Znalecké posudky | ⚖️ Právo a soudy | `/znalecke-posudky` | Existuje (implementováno) |
| *Nové v menu*| Výkon rozhodnutí | ⚖️ Právo a soudy | `/vykon-rozhodnuti` | Existuje (implementováno) |
| *Nové v menu*| Odvolání a stížnosti | ⚖️ Právo a soudy | `/odvolani` | Existuje (implementováno) |
| *Nové v menu*| Mezinárodní spory | ⚖️ Právo a soudy | `/mezinarodni-spory`| Existuje (implementováno) |
| `cat-3` | Care Hub | 👨‍👧 Moje dítě | `/pece` | Existuje |
| `cat-3` | CoParent Hub | 🤝 Spolurodičovství & Finance | `/portal/coparent` | Existuje |
| `cat-3` | Kalkulačka výživného | 🤝 Spolurodičovství & Finance | `/kalkulacka-vyzivneho` | Existuje |
| `cat-3` | Psychologie dětí | 👨‍👧 Moje dítě | `/psychologie` | Existuje |
| `cat-5` | AI Právní Asistent | 🤖 AI Asistenti | `/ai-asistent` | Existuje |
| `cat-5` | AI Průvodce | 🤖 AI Asistenti | `/ai-pruvodce` | Existuje |
| `cat-5` | Generátor formulářů | 📝 Dokumenty a podání | `/ai-formulare` | Existuje |
| `cat-5` | Simulátor péče | 🤖 AI Asistenti / Spolurodičovství | `/ai-simulator` | Existuje |
| `cat-6` | Kurzy pro rodiče | 📚 Knihovna a data | `/studia` | Existuje |
| `cat-6` | Videotéka | 📚 Knihovna a data | `/videoteka` | Existuje |
| `cat-6` | Kvízy | 📚 Knihovna a data | `/kvizy` | Existuje |
| `cat-6` | Encyklopedie & Wiki | 📚 Knihovna a data | `/wiki` | Existuje |
| `cat-6` | Katalog studií | 📚 Knihovna a data / Moje dítě | `/studie` | Existuje |
| `cat-6` | Statistiky a data | 📚 Knihovna a data | `/state-statistics` | Existuje |

---

## 7. IDENTIFIKACE MEZER V OBSAHU & DOPORUČENÝ OBSAH (P1–P3)

1. **B.I.F.F. Komunikační trénink (`/komunikace-biff`):**
   - *Status:* **MISSING** (P1)
   - *Popis:* Metodika Brief, Informative, Friendly, Firm pro komunikaci s vysoce konfliktním expartnerem.
2. **Plnohodnotný procesní kalendář (`/kalendar`):**
   - *Status:* **PLACEHOLDER** (P2)
   - *Popis:* Nahradit statický placeholder interaktivním počítadlem procesních lhůt (např. 15 dní na odvolání, 3 roky na SJM, 3 dny na předběžné opatření).
3. **Praktické checklisty pro předávání dětí:**
   - *Status:* **PARTIAL** (P2)
   - *Popis:* Vytvořit dedikované checklisty pro předávání novorozenců, batolat a školních dětí.

---

## 8. SOUHRN AUDITU & STATISTIKY

- **Aktuální Commit SHA:** `bec2a656f13698a9c5a472f9bdfa39117287b8af`
- **Počet veřejných položek v současném menu:** 40
- **Počet hlavních kategorií v současném menu:** 7 veřejných (+ 2 uživatelské + 1 administrátorská)
- **Počet existujících veřejných rout v `PublicPortal.tsx`:** 55
- **Statusy rout:**
  - **IMPLEMENTED:** 52
  - **PARTIAL:** 2 (`/pece`, `/portal/coparent` landing)
  - **PLACEHOLDER:** 1 (`/kalendar`)
  - **MISSING:** 1 (`/komunikace-biff` v menu)
  - **DUPLICATE:** 0 (Díky CMS aliasům jsou duplicitní cesty bezpečně obslouženy jedním rendererem)
- **Počet navržených nových kategorií v informační architektuře:** 9
- **Kritická rizika (P0–P3):**
  - **P0:** 0
  - **P1:** 0 (Žádná kritická nefunkčnost)
  - **P2:** Skryté hotové routy (7 plnohodnotných procesních průvodců `/skola`, `/zdravotni-pece`, `/spis`, `/znalecke-posudky`, `/vykon-rozhodnuti`, `/odvolani`, `/mezinarodni-spory` není v hlavním menu).
  - **P3:** Placeholder `/kalendar` vyžaduje v budoucnu napojení na interaktivní kalkulátor lhůt.
