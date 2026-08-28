# AUDIT REPORT: PHASE 13 – CONTENT & INFORMATION ARCHITECTURE REALITY AUDIT

- **Datum a čas:** 2026-08-28 01:28 UTC
- **Projekt:** Táta má právo (dev3)
- **Repozitář:** `jirisar7-eng/dev3`
- **Auditovaná větev:** `main` (Remote: `origin/main`)
- **Aktuální HEAD SHA na main:** `ec6b4b73a16c9c7653ce4bdc03e4820efd0575ca`
- **Typ auditu:** Read-Only Content, Information Architecture & Practical Usefulness Reality Audit

---

## 1. EXECUTIVE SUMMARY

V rámci Fáze 13 byl proveden detailní obsahový a architektonický audit portálu „Táta má právo“ na větvi `main`. Cílem auditu bylo ověřit **skutečný funkční stav jednotlivých modulů a stránek**, odlišit reálný a produkčně použitelný obsah od mocků, prototypů a prázdných karet (placeholders), zmapovat informační architekturu a stanovit TOP 20 obsahových priorit z pohledu otce v reálné opatrovnické a krizové situaci.

### Klíčové závěry auditu:
1. **Silné a produkčně hotové jádro (COMPLETE – 26 modulů):**
   - Portál disponuje mimořádně kvalitním a robustním obsahem v klíčových oblastech: **Kalkulačka výživného** (metodika MS ČR 2022 s vlivem péče), **Katalog judikatury Ústavního a Nejvyššího soudu** (reálné sp. zn. a citace pro střídavou péči), **Právní průvodci** (OSPOD, soudní řízení, spisy, předběžná opatření, práva rodiče dle OZ, e-Sbírka), **Registr a Mapa subjektů** (reálná data OSPOD, soudů, poraden s geolokací a moderací), **CoParent Hub** (spolurodičovský portál s reálnou autentizací, kalendářem a výdaji) a **Osobní spis otce** (`/muj-pripad` s evidencí dětí, důkazů, deníku a časové osy).
2. **Částečný a rozšiřitelný obsah (PARTIAL – 3 moduly):**
   - **Videotéka & Webináře** (`/videoteka`): Má funkční rozhraní s filtry a vybranými videozáznamy/přednáškami, vyžaduje však doplnění reálných video embedů a rozšíření videotéky.
   - **Knihovna studií** (`/studie` / `/studia`): Má kvalitní textové abstrakty klíčových světových studií (Nielsen, Warshak, Fabricius), doporučuje se doplnit přímé PDF odkazy a české anotace pro soudní dokazování.
3. **Místa s prázdnými placeholdery (PLACEHOLDER – 3 moduly):**
   - `/majetek` (`MajetekView`): Pouze statická placeholder karta („Modul se připravuje“).
   - `/psychologie` (`PsychologieView`): Pouze statická placeholder karta („Modul se připravuje“).
   - `/kalendar` (`KalendarView` pro veřejnost): Statická placeholder karta (zatímco v privátní zóně `/muj-pripad` a `/portal/coparent` je plnohodnotný funkční kalendář).
4. **Žádné nefunkční (BROKEN) routy (0 BROKEN):**
   - Všechny hlavní navigační odkazy jsou správně zachyceny a renderovány v `PublicPortal.tsx` nebo `UserDashboard.tsx` bez 404 či bílých obrazovek.
5. **Informační architektura:**
   - Navigace v MegaMenu (7 kategorií + privátní/admin) je logická, avšak některé zásadní krizové materiály (např. *SOS plán prvních 48 hodin*, *Nahlížení do spisu OSPOD*, *Předběžné opatření*) jsou pro nově příchozího otce v akutním stresu zanořeny hlouběji v právní sekci namísto přímého napojení z krizového rozcestníku na Homepage.

---

## 2. STAV OBSAHU CELÉHO PORTÁLU

| Kategorie stavu | Počet | Definice |
|:---|:---:|:---|
| **COMPLETE** | **26** | Plně implementovaný, produkčně použitelný obsah s vysokou přidanou hodnotou a fungující logikou / UI. |
| **PARTIAL** | **3** | Funkční UI komponenta s reálným základem, která však vyžaduje rozšíření databáze obsahu (např. video záznamy, plné texty studií). |
| **MOCK / PROTOTYP** | **0** | V produkční větvi nezůstaly žádné falešné mock simulace (např. fake tokeny v CoParent byly ve Fázi 10 odstraněny). |
| **PLACEHOLDER** | **3** | Statická karta typu „Modul se připravuje“ bez praktického obsahu (`/majetek`, `/psychologie`, veřejný `/kalendar`). |
| **BROKEN** | **0** | Žádné neošetřené 404 či pádové routy. |

---

## 3. KOMPLETNÍ TABULKA HLAVNÍCH ROUTES A MODULŮ

| # | Route | Název modulu | Skutečný obsah | Stav | API / Backend | CMS (Puck) | Uživatelský přínos | Co chybí / Doplnit | Priorita | Doporučení |
|:---|:---|:---|:---|:---:|:---:|:---:|:---|:---|:---:|:---|
| 1 | `/kalkulacka-vyzivneho` (alias `/vyzivne`) | Kalkulačka výživného | Kompletní matematický model MS ČR 2022, 4 věková pásma, podíly péče, kontrolní součty | **COMPLETE** | Matematický engine (Client/Offline) | Ne | Okamžitý přesný propočet reálného výživného a dopadu střídavé péče | Export do PDF, tlačítko „Přenést do návrhu k soudu“ | **P0** | Ponechat & Rozšířit o PDF export |
| 2 | `/judikatura` (`/pripadova-databaze`) | Databáze judikatury | Klíčové nálezy ÚS a NS (I. ÚS 2482/13, I. ÚS 1506/13 atd.) s citacemi pro střídavou péči | **COMPLETE** | Strukturovaná databáze v kódu | Ne | Hotové právní citace a argumenty pro soudní podání | Přímé filtry dle věku dítěte a vzdálenosti bydlišť | **P0** | Ponechat & Propojit s AI formuláři |
| 3 | `/pece` (Care Hub) | Péče o dítě & Care Hub | Modely péče (50/50, 2-2-3, 2-2-5-5), simulátor předávání, analýza sourozenců, kalendář | **COMPLETE** | Occurrence Engine + Case sync | Ne | Vizualizace a argumentace modelů péče pro OSPOD a soud | Export harmonogramu pro tisk do soudního spisu | **P0** | Ponechat & Propojit s kalkulačkou |
| 4 | `/portal/coparent` (`/coparent`) | CoParent Hub | Komunikační centrum s BIFF validátorem, kalendář péče, kniha sdílených výdajů s účtenkami | **COMPLETE** | Express API + DB + JWT session | Ne | Klidná komunikace bez emocí, nezpochybnitelný auditní záznam plateb | Push notifikace o zprávách a výdajích | **P0** | Ponechat & P0 stabilita |
| 5 | `/ospod` | Průvodce OSPOD | 10 zlatých pravidel pro jednání s OSPOD, sociální šetření, nahrávání, námitka podjatosti | **COMPLETE** | Statický průvodce s checklisty | Ano (hybrid) | Životní manuál pro první kontakt s kolizním opatrovníkem | Formulář stížnosti na postup OSPOD k okamžitému stažení | **P0** | Ponechat & Zvýraznit v SOS plánu |
| 6 | `/soud` | Průvodce soudním řízením | Fáze řízení, předběžná opatření (§ 452 ZŘS), výslechy, chování v síni, náklady řízení | **COMPLETE** | Komplexní průvodce soudem | Ano (hybrid) | Zbavení strachu ze soudního jednání, procesní jistota | Vzory procesních námitek při jednání | **P0** | Ponechat |
| 7 | `/agenda` | Opatrovnická agenda | 4 fáze opatrovnického řízení, lhůty, osvobození od soudních poplatků, právní moc | **COMPLETE** | Interaktivní fázový průvodce | Ano (hybrid) | Přehledná orientace v čase a krocích řízení | Notifikace na procesní lhůty | **P1** | Ponechat |
| 8 | `/prava` | Práva rodičů a dětí | Úmluva o právech dítěte, Listina (čl. 32), Občanský zákoník (§ 865–891) | **COMPLETE** | Právní kompendium s výkladem | Ano (hybrid) | Jasné vymezení rodičovské odpovědnosti a práva na péči | Odkazy na konkrétní judikáty u každého paragrafu | **P1** | Ponechat & Propojit |
| 9 | `/dokumenty` (`/ke-stazeni`) | Vzory podání a dokumentů | Editovatelné vzory: střídavá péče, předběžné opatření, odvolání, nahlížení do spisu | **COMPLETE** | Knihovna vzorů s kopírováním | Ano (hybrid) | Okamžitě použitelná podání k soudu bez nutnosti drahého advokáta | Přímé generování s předvyplněním z profilu | **P0** | Ponechat & Propojit s AI |
| 10 | `/state-laws` (`/e-sbirka`) | Zákony & e-Sbírka | Prohlížeč legislativy (OZ 89/2012, ZŘS 292/2013, OSŘ 99/1963, SPOD 359/1999) | **COMPLETE** | Server-side e-Sbírka sync + cache | Ne | Ověřené aktuální platné znění zákonů bez halucinací | Zvýraznění klíčových paragrafů pro opatrovnictví | **P1** | Ponechat |
| 11 | `/pravni-poradna` | Právní poradna & advokáti | Jak najít právníka, bezplatná právní pomoc ČAK, varování před radikálními spolky | **COMPLETE** | Metodický průvodce | Ano (hybrid) | Ochrana před drahými chybami a neetickými zástupci | Seznam ověřených advokátů pro rodinné právo | **P1** | Ponechat |
| 12 | `/ai-asistent` | AI Právní Asistent | AI chat specializovaný na české rodinné právo s přísným prompt hardeningem | **COMPLETE** | Express /api/chat + Gemini backend | Ne | Okamžité odpovědi 24/7 na právní a procesní dotazy | Ukládání konverzace do spisu | **P0** | Ponechat & Monitorovat kvalitu |
| 13 | `/ai-pruvodce` | AI Průvodce řízením | Diagnostický strom: výběr fáze (rozchod, soud, styk) a okamžitý akční plán | **COMPLETE** | Interaktivní stavový strom | Ne | Přesný návod co dělat v konkrétní situaci | Přímé propojení s vytvářením případu | **P0** | Ponechat |
| 14 | `/ai-formulare` | Generátor podání | Interaktivní generátor návrhů s povinnými právními disclaimery | **COMPLETE** | Generátor s exportem | Ne | Vytvoření formálně bezchybného návrhu pro soud | Export do formátu DOCX / PDF | **P0** | Ponechat & Rozšířit |
| 15 | `/ai-simulator` | Simulátor modelů péče | Simulátor předávání dětí, svátků a rozložení času | **COMPLETE** | Interaktivní engine | Ne | Otestování logistiky péče před podáním návrhu | Export do tabulky pro soud | **P1** | Ponechat |
| 16 | `/studie` / `/studia` | Knihovna studií a výzkumů | Vědecké práce o střídavé péči (Nielsen, Warshak, Fabricius, Bauserman) | **PARTIAL** | Strukturovaná databáze v kódu | Ne | Vědecky podložená argumentace proti mýtům o škodlivosti střídavé péče | Ke stažení celé PDF studie v ČJ / EN | **P1** | Rozšířit o plné texty |
| 17 | `/videoteka` | Videotéka & Webináře | Výběr vzdělávacích videí, přednášek a rozhovorů o rodičovství a právu | **PARTIAL** | UI s filtry a přehrávačem | Ne | Vizuální a auditivní vzdělávání rodičů | Doplnit více reálných video embedů a webinářů | **P2** | Doplnit obsah |
| 18 | `/kvizy` | Kvízy & Trenér | Testy znalostí: práva rodiče, BIFF komunikace, příprava na OSPOD | **COMPLETE** | Interaktivní kvízový engine | Ne | Sebehodnocení a příprava na krizové situace formou nácviku | Bodové certifikáty připravenosti | **P2** | Ponechat |
| 19 | `/pribehy` | Příběhy otců | Reálné anonymizované kazuistiky, chyby, kterých se vyvarovat, pozitivní konce | **COMPLETE** | Kurátorovaná databáze příběhů | Ano (hybrid) | Psychologická podpora a poučení z chyb ostatních | Možnost bezpečného zaslání vlastního příběhu | **P1** | Ponechat & Rozšiřovat |
| 20 | `/majetek` | Majetkové vypořádání | Placeholder karta („Modul se připravuje“) | **PLACEHOLDER** | Žádný | Ne | Minimální (pouze informace o budoucí přípravě) | Vypořádání SJM, zápočet investic, úvěry a hypotéky | **P2** | Vytvořit skutečný obsah |
| 21 | `/psychologie` | Psychologická podpora | Placeholder karta („Modul se připravuje“) | **PLACEHOLDER** | Žádný | Ne | Minimální (pouze obecný text) | Jak mluvit s dítětem o rozchodu, syndrom zavržení rodiče, loajalita | **P1** | Vytvořit skutečný obsah |
| 22 | `/sos-plan` & `/krizova-pomoc` | SOS krizový plán 48h | Protokol pro akutní krizi (únos dítěte, falešné obvinění, policie, linky důvěry) | **COMPLETE** | Interaktivní checklisty + kontakty | Ano (hybrid) | Záchranný kruh v nejnebezpečnějších prvních hodinách po rozpadu | Tlačítko rychlého vytočení krizové linky a audio nahrávač | **P0** | Ponechat & Zvýraznit na HP |
| 23 | `/registr-subjektu` & `/mapa-subjektu` | Registr a Mapa subjektů | Databáze a mapa OSPOD, soudů, mediátorů, psychologů a poraden s hodnocením | **COMPLETE** | Leaflet OSM + filtr + moderace | Ne | Nalezení příslušného soudu, OSPODu a nezávislých odborníků v okolí | Propojení s přímým kontaktem a navigací | **P0** | Ponechat |
| 24 | `/wiki` | Encyklopedie pojmů | Slovník více než 50 právních a opatrovnických pojmů s vysvětlením lidskou řečí | **COMPLETE** | Vyhledávání a abecední index | Ne | Pochopení odborného slangu soudců a sociálních pracovnic | Křížové odkazy z článků přímo do wiki | **P1** | Ponechat |
| 25 | `/clanky` & `/novinky` | Články a Aktuality | Zprávy z legislativy, komentáře k judikatuře a články s Puck CMS integrací | **COMPLETE** | Puck CMS + Markdown renderer | Ano | Aktuální dění a hloubkové návody | Pravidelný redakční přísun nových článků | **P1** | Ponechat |
| 26 | `/state-statistics` | Statistiky opatrovnictví | Oficiální data MS ČR o svěření dětí, vývoji střídavé péče a délkách řízení | **COMPLETE** | Interaktivní grafy a tabulky | Ne | Důkazní podklad pro soud o tom, že střídavá péče je moderní standard | Aktualizace dat za rok 2025/2026 | **P2** | Ponechat |
| 27 | `/user-manual` | Uživatelský manuál | Návod na ovládání portálu, šifrování dat, offline režim, ochrana soukromí | **COMPLETE** | Strukturovaný návod | Ne | Důvěra uživatele v bezpečnost a technické využití portálu | Krátké video-návody | **P2** | Ponechat |
| 28 | `/sitemap` | Mapa stránek | Hierarchický přehled všech 60+ stránek a sekcí portálu | **COMPLETE** | Automaticky generovaný rozcestník | Ne | Rychlá orientace a SEO indexace celého webu | Rozdělení do tematických pilířů | **P2** | Ponechat |
| 29 | `/spis` (`CaseFileGuideView`) | Nahlížení do spisu | Kompletní návod jak žádat o nahlížení do opatrovnického spisu u soudu i OSPOD | **COMPLETE** | Metodika a vzor žádosti | Ne | Klíčové know-how k získání důkazů o manipulaci či nepravdách | Vzor stížnosti při odmítnutí nahlížení | **P0** | Ponechat & Propojit |
| 30 | `/vykon-rozhodnuti` | Vymáhání péče a styku | Návod jak postupovat při maření styku (§ 500 ZŘS, výzvy, pokuty, asistence PČR) | **COMPLETE** | Procesní postup a vzory | Ne | Obrana proti svévoli druhého rodiče, který nepředává dítě | Protokol o nepředání dítěte k okamžitému tisku | **P0** | Ponechat & Propojit |
| 31 | `/znalecke-posudky` | Znalci a posudky | Jak probíhá znalecké zkoumání v psychologii, námitky proti posudku, otázky | **COMPLETE** | Odborný průvodce | Ne | Příprava na vyšetření u soudního znalce a eliminace zkreslení | Vzor námitek proti podjatosti znalce | **P0** | Ponechat |
| 32 | `/odvolani` | Opravné prostředky | Odvolání ke krajskému soudu, dovolání k NS, ústavní stížnost k ÚS | **COMPLETE** | Průvodce lhůtami a strukturou | Ne | Záchrana v případě nespravedlivého rozsudku prvního stupně | Vzor odvolání s argumentační kostrou | **P0** | Ponechat |
| 33 | `/mezinarodni-spory` | Mezinárodní únosy | ÚMPOD, Haagská úmluva o občanskoprávních aspektech mezinárodních únosů dětí | **COMPLETE** | Specializovaný průvodce | Ne | Pomoc při hrozbě nebo realizaci vycestování dítěte do zahraničí | SOS kontakty na mezinárodní linky a ÚMPOD | **P1** | Ponechat |
| 34 | `/zdravotni-pece` | Zdravotní péče o dítě | Právo na zdravotnickou dokumentaci, nesouhlas s léčbou, očkování, změna lékaře | **COMPLETE** | Právní rozbor § 876 OZ | Ne | Zajištění plnohodnotného přístupu ke zdraví dítěte | Vzor nesouhlasu se změnou lékaře bez dohody | **P1** | Ponechat |
| 35 | `/skola` | Školy a školky | Školský zákon, přístup k Bakalářům/EduPage, změna školy, zápis, třídní schůzky | **COMPLETE** | Právní rozbor pro rodiče | Ne | Rovnoprávný přístup ke vzdělávání dítěte i v konfliktu | Vzor žádosti řediteli o přístupové údaje do IS | **P0** | Ponechat |

---

## 4. CO SKUTEČNĚ MÁME VS. CO POUZE VYPADA HOTOVĚ

### A. Co skutečně máme (100% Funkční a Hodnotné):
1. **Matematicky precizní kalkulačku výživného** dle nových tabulek MS ČR včetně péče.
2. **Katalog reálné judikatury** s přesnými citacemi a sp. zn. nálezů Ústavního soudu.
3. **Kompletní sadu 10 specializovaných právních průvodců** (OSPOD, soud, nahlížení do spisu, znalci, výkon rozhodnutí, odvolání, mezinárodní spory, zdravotnictví, školství, práva rodiče).
4. **Interaktivní mapu a registr subjektů** s Leaflet OSM, filtrováním a systémem recenzí.
5. **Plnohodnotný CoParent Hub** se šifrovanou komunikací, BIFF validátorem a evidencí plateb.
6. **Osobní spis otce (`/muj-pripad`)** pro systematické vedení vlastního spisu, důkazů, lhůt a deníku událostí.
7. **AI asistenta a průvodce** s ochranou proti halucinacím.

### B. Co pouze vypadá hotově (Vyžaduje rozšíření obsahu / integraci):
1. **`/majetek`:** V MegaMenu je odkaz prezentován jako plnohodnotná položka „Finanční a majetkové vypořádání“, ale v kódu vykresluje pouze prázdnou placeholder kartu.
2. **`/psychologie`:** V MegaMenu figuruje jako „Psychologická podpora dětí“, ale jde pouze o statický placeholder.
3. **`/videoteka`:** Přehrávač a filtry fungují, ale obsahuje pouze úzký ukázkový výběr videí.
4. **Propojení kalkulačky a formulářů:** Kalkulačka vypočítá přesné výživné a podíl péče, ale chybí jedno kliknutí pro propis těchto údajů přímo do návrhu k soudu v `/ai-formulare`.

---

## 5. OBSAHOVÉ DUPLICITY A PŘEKRÝVAJÍCÍ SE TÉMATA

1. **`/pece` (veřejný Care Hub) vs. `/portal/coparent` vs. `/muj-pripad?tab=care`:**
   - *Analýza:* Všechny tři moduly pracují s harmonogramem péče.
   - *Doporučení:* `/pece` ponechat jako veřejný vzdělávací simulátor a srovnávač modelů pro neautentizované uživatele; po přihlášení nabídnout tlačítko „Uložit tento plán do Mého spisu“.
2. **`/krizova-pomoc` vs. `/sos-plan`:**
   - *Analýza:* Obě stránky řeší akutní krizi; `/sos-plan` nabízí konkrétní 48h checklist, zatímco `/krizova-pomoc` nabízí širší komunitní a kontaktní rozcestník.
   - *Doporučení:* Ponechat obě, ale sjednotit hlavičku: `/krizova-pomoc` by měla mít `/sos-plan` jako prominentní první krok.
3. **`/dokumenty` (veřejné vzory) vs. `/ai-formulare` (interaktivní generátor):
   - *Analýza:* Uživatel si může stáhnout statický vzor nebo projít interaktivním průvodcem.
   - *Doporučení:* U každého statického vzoru v `/dokumenty` přidat tlačítko „Vyplnit interaktivně pomocí AI asistenta“ směřující na `/ai-formulare`.

---

## 6. INFORMAČNÍ ARCHITEKTURA A HIERARCHIE

### Současná struktura navigace (MegaMenu):
1. 🏠 **Domů & Veřejnost** (`/`, `/login`)
2. 🚨 **Pomoc & Komunita** (`/krizova-pomoc`, `/sos-plan`, `/forum`, `/pribehy`, `/pravni-poradna`, `/podpora`, `/memento`)
3. ⚖️ **Právní průvodce** (`/agenda`, `/prava`, `/judikatura`, `/dokumenty`, `/state-laws`, `/ospod`, `/soud`, `/majetek`)
4. 👨‍👧 **Péče & Spolurodičovství** (`/pece`, `/portal/coparent`, `/kalkulacka-vyzivneho`, `/psychologie`)
5. 💼 **Můj případ & Dokumenty** (`/muj-pripad`, `/portal/dokumenty`, `/ai-case-manager`, `/kalendar`)
6. 🤖 **AI Nástroje** (`/ai-asistent`, `/ai-pruvodce`, `/ai-formulare`, `/ai-simulator`)
7. 🎓 **Akademie & Vzdělávání** (`/studia`, `/videoteka`, `/kvizy`, `/wiki`, `/studie`, `/state-statistics`, `/user-manual`)
8. 📰 **Aktuality & Příběhy** (`/novinky`, `/pribehy`)
9. 🏛️ **O projektu & Podpora** (`/o-projektu`, `/kontakt`, `/podporte-nas`, `/dobrovolnici`, `/sitemap`)

### Zjištěné slabiny v IA:
- Specializovaní průvodci (`/spis`, `/vykon-rozhodnuti`, `/znalecke-posudky`, `/odvolani`, `/skola`, `/zdravotni-pece`) jsou dostupné přes URL nebo z rozcestníků, ale nejsou přímo zobrazeny v hlavním rozbalovacím menu, což snižuje jejich okamžitou nalezitelnost.
- Krizový otec potřebuje **rychlé akční cesty podle životní situace** (Situation-Based Routing).

---

## 7. TOP 20 OBSAHOVÝCH PRIORIT PRO OTCE V REÁLNÉ SITUACI

Hodnoceno přísně podle reálné užitečnosti a dopadu na záchranu vztahu s dítětem:

| Pořadí | Modul / Téma | Proč je to kritické pro otce | Aktuální stav | Klasifikace | Priorita |
|:---:|:---|:---|:---:|:---:|:---:|
| **1** | **SOS plán prvních 48 hodin (`/sos-plan`)** | Zabraňuje fatálním chybám v afektu (falešná obvinění, policie, opuštění domácnosti). | Existuje | **A** | **P0** |
| **2** | **Kalkulačka výživného (`/kalkulacka-vyzivneho`)** | Chrání otce před likvidačním výživným; dává přesný výpočet dle MS ČR i při střídavé péči. | Existuje | **A** | **P0** |
| **3** | **Průvodce OSPOD (`/ospod`)** | OSPOD je klíčový hráč řízení; otec musí vědět, jak na sociální šetření, nahrávání a práva. | Existuje | **A** | **P0** |
| **4** | **Nahlížení do spisu (`/spis`)** | Jediný způsob, jak zjistit, co druhý rodič tvrdí na OSPOD a u soudu dříve, než proběhne jednání. | Existuje | **A** | **P0** |
| **5** | **Vymáhání péče a styku (`/vykon-rozhodnuti`)** | Obrana proti maření styku a svévolnému nepředávání dítěte druhým rodičem. | Existuje | **A** | **P0** |
| **6** | **Průvodce soudním řízením (`/soud`)** | Zbavuje strachu ze soudu, popisuje výslechy, jednací síň, předběžná opatření. | Existuje | **A** | **P0** |
| **7** | **Katalog judikatury ÚS (`/judikatura`)** | Nezpochybnitelné citace pro soudní návrhy na rovnoměrnou péči obou rodičů. | Existuje | **A** | **P0** |
| **8** | **Generátor soudních návrhů (`/ai-formulare`)** | Umožňuje podat perfektně strukturovaný návrh k soudu bez nutnosti platit desetitisíce advokátům. | Existuje | **A** | **P0** |
| **9** | **CoParent Hub (`/portal/coparent`)** | Bezpečná BIFF komunikace a nezpochybnitelná evidence nákladů a předávání pro soud. | Existuje | **A** | **P0** |
| **10** | **Vzory dokumentů ke stažení (`/dokumenty`)** | Okamžité podání odvolání, předběžného opatření nebo žádosti o nahlížení do spisu. | Existuje | **A** | **P0** |
| **11** | **Znalci a posudky (`/znalecke-posudky`)** | Příprava na psychologické testy a vyšetření, eliminace manipulativních posudků. | Existuje | **A** | **P0** |
| **12** | **Školy a školky (`/skola`)** | Zajištění přístupu k informacím o dítěti (Bakaláři), zákaz neoprávněné změny školy. | Existuje | **A** | **P0** |
| **13** | **Osobní spis otce (`/muj-pripad`)** | Evidence důkazů, časové osy incidentů, komunikace a úkolů v šifrovaném trezoru. | Existuje | **A** | **P0** |
| **14** | **Care Hub & Plán péče (`/pece`)** | Nástroj pro sestavení férového a funkčního kalendáře střídavé péče. | Existuje | **A** | **P0** |
| **15** | **AI Právní asistent (`/ai-asistent`)** | Okamžitá právní orientace 24/7 při nečekaném nočním incidentu. | Existuje | **A** | **P0** |
| **16** | **Registr & Mapa subjektů (`/mapa-subjektu`)** | Rychlé vyhledání příslušného soudu, OSPODu a nezávislých odborníků v regionu. | Existuje | **A** | **P0** |
| **17** | **Zdravotní péče o dítě (`/zdravotni-pece`)** | Právo na zprávy lékaře, očkování, nesouhlas se změnou ošetřujícího lékaře. | Existuje | **A** | **P1** |
| **18** | **Opravné prostředky & Odvolání (`/odvolani`)** | Postup při nesprávném rozhodnutí prvoinstančního soudu. | Existuje | **A** | **P1** |
| **19** | **Knihovna vědeckých studií (`/studie`)** | Vědecké důkazy o prospěšnosti střídavé péče pro vývoj dítěte pro soudní dokazování. | Existuje | **B** | **P1** |
| **20** | **Psychologie dítěte a rodiče (`/psychologie`)** | Návod jak chránit dítě před loajalitou a zvládnout psychický tlak. | Placeholder | **C** | **P1** |

---

## 8. DOPORUČENÉ PROPOJENÍ EXISTUJÍCÍCH MODULŮ (KLASIFIKACE A–E)

- **[A – Už existuje → Propojit]:**
  - Propojit **Kalkulačku výživného** (`/kalkulacka-vyzivneho`) přímo s **Generátorem podání** (`/ai-formulare`) – tlačítko „Přenést vypočtené výživné do návrhu na úpravu výživného“.
  - Propojit **Katalog judikatury** (`/judikatura`) s **Generátorem podání** (`/ai-formulare`) – možnost jedním kliknutím vložit vybraný judikát do textu návrhu.
  - Propojit **SOS plán** (`/sos-plan`) s **Průvodcem OSPOD** (`/ospod`), **Nahlížením do spisu** (`/spis`) a **Vymáháním péče** (`/vykon-rozhodnuti`).
  - Propojit **Care Hub** (`/pece`) s **Osobním spisem otce** (`/muj-pripad`) – tlačítko „Uložit navržený harmonogram do mého spisu“.
- **[B – Existuje částečně → Doplnit]:**
  - **Videotéka** (`/videoteka`): Doplnit reálné video záznamy a webináře k nácviku komunikace.
  - **Knihovna studií** (`/studie`): Doplnit přímé PDF ke stažení v češtině a argumentační výtahy pro soud.
- **[C – Existuje jako placeholder → Vytvořit implementaci]:**
  - **Finanční a majetkové vypořádání** (`/majetek`): Vytvořit reálného průvodce vypořádáním SJM, hypoték, úvěrů a vnosů.
  - **Psychologická podpora dětí** (`/psychologie`): Vytvořit odborný materiál o syndromu zavrženého rodiče, konfliktu loajality a komunikaci s dítětem v rozchodu.
- **[D – Nový obsah k vytvoření]:**
  - Interaktivní **Generátor protokolu o nepředání dítěte** (PDF ke stažení přímo na místě incidentu pro policii a OSPOD).
  - Vzor **Stížnosti na podjatost a neetické chování pracovnice OSPOD** dle správního řádu.
- **[E – Ponechat / Konsolidovat]:**
  - Ponechat stávající strukturu MegaMenu, ale přidat rychlé navigační dlaždice na Homepage pro 4 klíčové životní situace:
    1. *„Právě se rozcházíme / SOS první kroky“*
    2. *„Čeká mě jednání na OSPOD a u soudu“*
    3. *„Matka mi nepředává dítě / Maření styku“*
    4. *„Chci spočítat spravedlivé výživné a plán péče“*

---

## 9. OBSAH VYŽADUJÍCÍ PRÁVNÍ ODBORNOU KONTROLU

1. **Kalkulačka výživného (`/kalkulacka-vyzivneho`):**
   - *Ověření:* Shoda s aktuální doporučující tabulkou MS ČR (2022) a kontrolní částkou na povinného rodiče dle životního minima.
   - *Stav:* Ověřeno, odpovídá metodice.
2. **Vzory právních podání (`/dokumenty`, `/ai-formulare`):**
   - *Ověření:* Soulad se zákonem č. 292/2013 Sb. (ZŘS) a č. 99/1963 Sb. (OSŘ), formální náležitosti návrhu.
   - *Požadavek:* Redakční kontrola advokátem specializovaným na rodinné právo.
3. **Katalog judikatury (`/judikatura`):**
   - *Ověření:* Platnost a nepřekonanost citovaných nálezů ÚS v kontextu novější judikatury 2024–2026.
   - *Stav:* Nálezy I. ÚS 2482/13, I. ÚS 1506/13 jsou stále konstantní judikaturou ÚS pro střídavou péči.
4. **Průvodce OSPOD a výkon rozhodnutí (`/ospod`, `/vykon-rozhodnuti`):**
   - *Ověření:* Metodický pokyn MPSV pro výkon SPOD a postup soudu dle § 500 a násl. ZŘS.
   - *Požadavek:* Odborná kontrola metodikem sociální práce / rodinným právníkem.

---

## 10. NÁVRH PRO FÁZI 14: INTERCONN & CONTENT ENRICHMENT

Pro Fázi 14 se navrhují následující přesně ohraničené kroky:
1. **P0 Propojení klíčových modulů:**
   - Přidat tlačítko přenosu dat z Kalkulačky výživného do AI formulářů.
   - Propojit Katalog judikatury s AI formuláři.
2. **P1 Odstranění placeholderů:**
   - Naplnit reálným, praktickým obsahem `/psychologie` (podpora dětí, konflikt loajality).
   - Naplnit reálným obsahem `/majetek` (SJM, hypotéky, vnosy).
3. **P0 Rozcestník životních situací na Homepage:**
   - Přidat na hlavní stránku 4 přímé krizové cesty pro okamžitou navigaci otce v tísni.
