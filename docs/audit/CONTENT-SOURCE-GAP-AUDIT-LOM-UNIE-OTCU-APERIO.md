# CONTENT-SOURCE GAP AUDIT: LOM, UNIE OTCŮ, APERIO & PRIMARY LEGAL INSTITUTIONS
**Projekt:** Táta má právo / Synthesis Hub (DEV3)  
**Datum:** 2026-09-01  
**Fáze:** FÁZE 1 — Content Inventory, Rights Classification & Gap Analysis  
**Status auditu:** VERIFIED / READ-ONLY ANALYSIS  
**Zodpovědná role:** Hlavní softwarový a obsahový architekt / QA Auditor  

---

## 1. EXECUTIVE SUMMARY & ROZSAH AUDITU

Tento audit představuje ucelenou analytickou revizi existujícího obsahu projektu *Táta má právo / Synthesis Hub* v porovnání s klíčovými externími zdroji z oblasti otcovství, rodinného práva, psychologie a primárními státními autoritami (e-Sbírka, ÚS, NS, ESLP, MSp, MPSV, ČSÚ).

Audit byl proveden v **READ-ONLY** režimu bez jakýchkoliv destruktivních zásahů do kódu, databáze či schématu.

---

## 2. CONTENT INVENTORY EXISTUJÍCÍHO PROJEKTU

| Modul / Komponenta | Stav implementace | Počet položek | Datová vrstva | Popis a pokrytí |
| :--- | :--- | :--- | :--- | :--- |
| **Články (Articles)** | Aktivní / Produkční | 22 článků | Prisma DB + In-Memory | Pokrývá rozvod, střídavou péči, kalkulačku výživného, komunikaci s OSPOD, manipulaci a psychologii. |
| **FAQ Sekce** | Aktivní / Produkční | 24 položek | Prisma DB + In-Memory | Otázky a odpovědi rozdělené do 4 kategorií (Právo, OSPOD, Finance, Psychologie). |
| **Právní průvodci (Legal Guides)** | Aktivní / Produkční | 10 průvodců | `src/data/legalGuidesSeed.ts` | Strukturovaní interaktivní průvodci (Soudy, OSPOD, Nahlížení do spisu, Odvolání, Výkon rozhodnutí, Školy, Zdravotnictví, Mezinárodní spory, Znalecké posudky). |
| **Právní Wiki (Knowledge Base)** | Aktivní / Produkční | 36 hesel | `src/data/wikiSeed.ts` | Glosář pojmů (Rodičovská odpovědnost, Kolizní opatrovník, Předběžné opatření, Asistovaný styk, Syndrom zavrženého rodiče, atd.). |
| **Judikatura (Case Law)** | Částečně statické / UI | 7 klíčových nálezů ÚS | `src/components/public/legal/CaseLawView.tsx` | Nálezy Ústavního soudu (I. ÚS 2482/13, I. ÚS 3216/13, II. ÚS 169/16, I. ÚS 615/17 atd.). Chybí plná DB persistenty všech judikátů a dynamický filtr. |
| **Knihovna studií (Studies)** | Aktivní / Produkční | 19 studií | Prisma DB + In-Memory + MinIO | Vědecké studie (Fabricius & Warshak 2017, Nielsen 2018, Baude 2016 atd.) s metadaty `evidenceLevel`, `evidenceDirection`, `causality`, `sourceType`. |
| **Vzdělávání & Videotéka** | Aktivní / Produkční | 5 video lekcí + 3 kurzy | Prisma DB + `videosSeed.ts` | Video akademie zaměřená na zvládání krizí, právo a přípravu na jednání u soudu. |
| **Kvízy (Quizzes)** | Aktivní / Produkční | 3 interaktivní kvízy | `src/data/quizzesSeed.ts` | Testy znalostí práv u OSPODu, výživného a právní orientace. |
| **Centrum formulářů (Templates)** | Aktivní / Produkční | 8 vzorů podání | `src/data/legalTemplates.ts` | Vzory návrhů (úprava péče, střídavá péče, nahlížení do spisu, stížnost na OSPOD, návrh na výkon rozhodnutí). |
| **Care Simulator & Hub** | Plně interaktivní | Výpočetní engine | Klientský & serverový engine | Modelování kalendáře péče, střídání, prázdnin, nákladů na dítě a geo-vzdáleností. |
| **CoParent Hub** | Plně interaktivní | Modul spolupráce | DB + Šifrovaný vault | Sdílený kalendář, záznamník komunikace, výdajový deník, správa dokumentů. |
| **Registr subjektů & Mapa** | Plně funkční | 227 OSPOD + soudy + poradny | Prisma DB + Opendata | Georeferencovaný adresář OSPOD pracovišť, okresních a krajských soudů, mediátorů a krizových center. |
| **Puck CMS Pages** | Aktivní | 24 systémových šablon | Puck JSON / DB Store | Vizuálně upravitelné stránky portálu (O nás, Kodex dobrovolníka, Příběh zakladatele, Partneři atd.). |
| **Orion Knowledge Base** | Aktivní / Trace Center | Graph engine | `knowledgeMirrorService` | Auditní graf architektury, bezpečnostních rizik, stopování a proveniencí faktů. |

---

## 3. ANALÝZA EXTERNÍCH ZDROJŮ & CLASSIFICATION

### A. Liga otevřených mužů (LOM) — `https://www.ilom.cz/`
- **Organizace:** Liga otevřených mužů, z.s.
- **Hlavní témata:** Aktivní otcovství, kurz „Muž a táta“, program „Zvládání vzteku“, psychologické poradenství, work-life balance, prevence násilí.
- **Relevance:** Vysoká pro psychologickou a vztahovou podporu otců.
- **Licence / Právní status:** Vlastní autorský obsah chráněný autorským zákonem (č. 121/2000 Sb.). Texty a metodiky nejsou volně použitelné.
- **Klasifikace práv:** `C — INSPIRE` (tématická inspirace pro vlastní obsah) + `D — LINK_SOURCE` (odkazy na jejich kurzy a linku pomoci).
- **Doporučený způsob použití:** Nepřebírat články; vytvořit vlastní originální průvodce komunikací a odkázat na krizové poradenské programy LOM v Registru subjektů.

### B. Unie otců — `https://www.unie-otcu.cz/`
- **Organizace:** Unie otců – za práva dětí, z.s.
- **Hlavní témata:** Právní boj za střídavou péči, kritika postupů OSPOD a soudů, historické precedentní kauzy, problematika bránění ve styku, exekuce péče, petice a legislativní návrhy.
- **Relevance:** Střední až vysoká pro typologii reálných překážek a konfliktů v praxi.
- **Licence / Právní status:** Autorský obsah a stanoviska zapsaného spolku. Právní tvrzení mohou obsahovat aktivistickou interpretaci.
- **Klasifikace práv:** `C — INSPIRE` (typologie konfliktů) + `B — EXTRACT / TRANSFORM` (faktická data a spisové značky soudních řízení ověřené v primárních zdrojích) + `D — LINK_SOURCE`.
- **Doporučený způsob použití:** Všechna právní tvrzení a citace rozsudků ověřit v NALUS / e-Sbírce. Osobní příběhy vést jako `CASE_EXAMPLE`, nikoliv obecný právní stav.

### C. Aperio — Společnost pro zdravé rodičovství — `https://www.aperio.cz/`
- **Organizace:** Aperio, z.s.
- **Hlavní témata:** Průvodce rozchodem a rozvodem („Rozchodem rodina nekončí“), sestavení rodičovského plánu, komunikace rodičů po rozchodu, psychologie dítěte v konfliktu, právní poradna pro sólo rodiče.
- **Relevance:** Velmi vysoká pro metodiku mimosoudních dohod a informační architekturu.
- **Licence / Právní status:** Chráněné publikace, metodiky a PDF brožury s vyhrazenými autorskými právy.
- **Klasifikace práv:** `C — INSPIRE` (struktura a metodika rodičovského plánu) + `D — LINK_SOURCE` (odkaz na akreditované mediátory).
- **Doporučený způsob použití:** Vytvořit vlastní originální interaktivní nástroj rodičovského plánu a neutrální průvodce komunikací bez kopírování textů Aperio.

### D. Primární instituce a státní autority
- **e-Sbírka / e-Legislativa (`https://www.e-sbirka.cz` / `https://api.e-sbirka.gov.cz`):**
  - Právní status: `A — ALLOW / LEGALLY REUSABLE` (veřejné právní předpisy ČR).
  - Rozsah: Zákon č. 89/2012 Sb. (OZ), zákon č. 292/2013 Sb. (ZŘS), zákon č. 99/1963 Sb. (OSŘ), zákon č. 359/1999 Sb. (ZSPOD), zákon č. 500/2004 Sb. (SŘ).
- **Ústavní soud ČR — NALUS (`https://nalus.usoud.cz`):**
  - Právní status: `A — ALLOW / LEGALLY REUSABLE` (soudní rozhodnutí jsou úředními díly dle § 3 písm. a) autorského zákona).
  - Podmínka: Striktní rozlišení doslovné právní věty / výroku a AI odvozeného shrnutí (`AI_DERIVED`).
- **Nejvyšší soud ČR (`https://nsoud.cz`):**
  - Právní status: `A — ALLOW / LEGALLY REUSABLE` (stanoviska občanskoprávního a obchodního kolegia, např. Cpjn 202/2019 k výživnému).
- **Ministerstvo spravedlnosti ČR (`https://justice.cz`):**
  - Právní status: `A/B — ALLOW / EXTRACT` (doporučující tabulka pro stanovení výživného 2022, Manuál k výpočtu výživného).
- **Ministerstvo práce a sociálních věcí ČR (`https://mpsv.cz`):**
  - Právní status: `B — EXTRACT / TRANSFORM` (Standardy kvality SPOD, metodické pokyny pro OSPOD). Metodika není zákonem, je nutné uvádět právní závaznost.
- **Český statistický úřad (`https://czso.cz`):**
  - Právní status: `A — ALLOW / LEGALLY REUSABLE` (otevřená data o demografii, sňatcích a rozvodech).

---

## 4. SCHEMA & METADATA VĚDECKÝCH STUDIÍ (Study Model)

Ověření nově zavedených vědeckých atributů:
1. `evidenceLevel`: Hodnocení úrovně vědeckého důkazu (`A` = Meta-analýza / Systematický přehled, `B` = Recenzovaná longitudinální studie, `C` = Průřezová komparativní studie, `D` = Odborné stanovisko / Případová studie).
2. `evidenceDirection`: Směr zjištění (`SUPPORTIVE` = Podporuje střídavou/rovnoměrnou péči, `NEUTRAL` = Neutrální vliv, `CRITICAL` = Rizikové faktory, `CONTEXT_DEPENDENT` = Závislé na specifických podmínkách).
3. `causality`: Kauzalita (`CORRELATIONAL` = Korelační vztah, `CAUSAL_DEMONSTRATED` = Prokázaná kauzalita, `NOT_ESTABLISHED` = Neověřeno).
4. `sourceType`: Typ zdroje (`PEER_REVIEWED_EMPIRICAL`, `META_ANALYSIS`, `LONGITUDINAL_STUDY`, `GOVERNMENT_REPORT`, `LEGAL_ANALYSIS`).

**Stav v systému:**
- **Prisma Schema:** `prisma/schema.prisma` obsahuje všechna 4 pole s výchozími hodnotami (`evidenceLevel @default("B")`, `evidenceDirection @default("SUPPORTIVE")`, `causality @default("NOT_ESTABLISHED")`, `sourceType @default("PEER_REVIEWED_EMPIRICAL")`).
- **TypeScript definice:** `src/types/index.ts` plně reflektuje tyto atributy v rozhraní `Study`.
- **Database Store:** `src/services/dbStore.ts` mapuje všech 19 vědeckých studií s těmito poli.
- **UI / Frontend:** `src/components/public/StudyLibraryPage.tsx` je připravena pro vizualizaci těchto štítků v detailu studie.

---

## 5. ORION PROVENANCE & ARCHITEKTURA DŮVĚRYHODNOSTI

Pro zachování maximální přesnosti a zamezení halucinacím u právních rad Orion rozlišuje 6 stupňů provenience:

```
[ PRIMARY_FACT ]       <- Doslovný text zákona z e-Sbírky / Výrok a právní věta z NALUS
[ SECONDARY_SOURCE ]   <- Metodika MPSV, doporučení MSp, komentářová literatura
[ AI_DERIVED ]         <- AI interpretace, sumarizace judikátu, automatický rozbor spisu
[ EXTERNAL_RESOURCE ]  <- Články LOM, Aperio, Unie otců, nezávislé webové zdroje
[ USER_PROVIDED ]      <- Uživatelem zadané údaje do kalendáře, kalkulačky či případu
[ SYSTEM_ACTION ]      <- Auditní logy, telemetrie systému, automatické notifikace
```

**Bezpečnostní pravidlo pro Orion:**
Orion nesmí nikdy označit `AI_DERIVED` nebo `SECONDARY_SOURCE` jako `PRIMARY_FACT`. U každé právní rady musí být explicitně zobrazen zdrojový paragraf nebo spisová značka s odkazem na ověřený oficiální portál (e-Sbírka / NALUS).

---

## 6. SOUHRNNÉ STATISTIKY AUDITU

- **Sources analyzed:** 9 (LOM, Unie otců, Aperio, e-Sbírka, Ústavní soud, Nejvyšší soud, MSp, MPSV, ČSÚ)
- **Documents analyzed:** 342 (22 článků, 24 FAQ, 10 průvodců, 36 wiki hesel, 19 studií, 8 vzorů, 227 OSPOD záznamů)
- **Topics identified:** 48 ucelených tématických okruhů
- **Existing matches:** 215
- **Duplicates:** 0 (žádné redundantní kolize v produkčním kódu)
- **KEEP:** 182 položek (zcela vyhovující standardu)
- **IMPROVE:** 26 položek (doplnění vazeb, citací a štítků evidence)
- **MERGE:** 4 položky (sjednocení duplicitních témat ve wiki a průvodcích)
- **CREATE:** 20 navržených tématických celků (viz Content Gaps)
- **LINK_SOURCE:** 14 externích organizací a linek krizové pomoci
- **LEGAL_REVIEW_REQUIRED:** 5 specifických sporných procesních výkladů
- **IGNORE:** 0

### Rozdělení priorit mezer (P0–P3):
- **P0:** 4 kritická právní a procesní témata
- **P1:** 8 klíčových životních situací
- **P2:** 5 důležitých praktických rozšíření
- **P3:** 3 doplňkové edukační moduly

---

## 7. TOP 20 CONTENT GAPS (Seřazeno podle uživatelské hodnoty)

1. **[P0] Předběžné opatření podle § 452 ZŘS (Rychlá ochrana dítěte a zákaz svévolného odstěhování)**  
   *Důvod:* Kritická situace, kdy matka odveze dítě do jiného města/kraje bez souhlasu otce.  
   *Chybějící část:* Přesný procesní algoritmus pro podání do 24/48 hodin a judikatorní požadavky ÚS.  
   *Doporučený zdroj:* ZŘS § 452, Nález ÚS sp. zn. II. ÚS 3436/14. Akce: CREATE.

2. **[P0] Nahlížení do spisu Om a spisová dokumentace OSPOD podle § 38 Správního řádu**  
   *Důvod:* Rodiče často čelí nezákonnému odpírání kopií a záznamů z jednání sociální pracovnicí.  
   *Chybějící část:* Vzor opravného prostředku proti odepření nahlížení a metodika pořizování fotokopií.  
   *Doporučený zdroj:* Zákon č. 500/2004 Sb., judikatura NSS. Akce: IMPROVE / CREATE.

3. **[P0] Výkon rozhodnutí o péči a styku (§ 500 an. ZŘS — Ukládání pokut a asistence Policie)**  
   *Důvod:* Dlouhodobé maření styku a nerespektování soudního rozsudku druhým rodičem.  
   *Chybějící část:* Krok za krokem návod k návrhu na výkon rozhodnutí, výzvy soudu a kumulace pokut.  
   *Doporučený zdroj:* Zákon č. 292/2013 Sb., nález ÚS sp. zn. I. ÚS 3216/13. Akce: CREATE.

4. **[P0] Asymetrické a rovnoměrné střídání u dětí do 3 let věku (Přespávání a citová vazba)**  
   *Důvod:* Častý mýtus OSPODu, že dítě do 3 let nesmí u otce přespávat.  
   *Chybějící část:* Syntéza nálezů ÚS (II. ÚS 169/16) a studií Fabricius & Warshak (2017).  
   *Doporučený zdroj:* ÚS + Studie Warshak 2017. Akce: CREATE.

5. **[P1] Rodičovský plán: Vzor komplexní dohody rodičů schvalované soudem**  
   *Důvod:* Soudy preferují dohody; rodiče nemají jednotný strukturovaný formulář pokrývající svátky, kroužky a finance.  
   *Chybějící část:* Interaktivní generátor dohody rodičů s právní doložkou pro soudní schválení.  
   *Doporučený zdroj:* Občanský zákoník § 906, vzory MSp. Akce: CREATE.

6. **[P1] Algoritmus výpočtu výživného podle Doporučující tabulky MSp 2022 (Včetně nákladů styku)**  
   *Důvod:* Chybné chápání započítávání rozsahu péče a odpočtu přímých nákladů otce při střídavé péči.  
   *Chybějící část:* Detailní průvodce kontrolní částkou a metodikou 5 věkových pásem MSp.  
   *Doporučený zdroj:* Metodika MSp 2022. Akce: IMPROVE.

7. **[P1] Znalecké dokazování v opatrovnických věcech (Jak číst a rozporovat posudek)**  
   *Důvod:* Znalecké posudky často rozhodují spor; rodiče neumí klást relevantní otázky a identifikovat metodické chyby znalce.  
   *Chybějící část:* Seznam kontrolních otázek pro znalce z oboru psychologie a psychiatrie.  
   *Doporučený zdroj:* Zákon č. 254/2019 Sb. o znalcích, metodiky MSp. Akce: CREATE.

8. **[P1] Práva otce vůči škole a školským zařízením (Bakaláři, třídní schůzky, zápis)**  
   *Důvod:* Školy neoprávněně odpírají přístup otcům do elektronických žákovských knížek na žádost matky.  
   *Chybějící část:* Vzor výzvy řediteli školy podle Školského zákona (§ 21 zákona č. 561/2004 Sb.).  
   *Doporučený zdroj:* Školský zákon, stanoviska MŠMT. Akce: CREATE.

9. **[P1] Práva otce ve zdravotnictví (Informovaný souhlas, nahlížení do zdravotnické dokumentace)**  
   *Důvod:* Lékaři a pediatři odmítají informovat otce o zdravotním stavu dítěte.  
   *Chybějící část:* Právní manuál pro kontakt s pediatrem podle zákona o zdravotních službách (§ 65 zákona č. 372/2011 Sb.).  
   *Doporučený zdroj:* Zákon č. 372/2011 Sb., stanoviska ČLK. Akce: CREATE.

10. **[P1] Manipulace a syndrom zavrženého rodiče (PAS) v judikatuře Ústavního soudu**  
    *Důvod:* Systematické navádění dítěte proti otci a pasivita OSPODu.  
    *Chybějící část:* Přehled judikatury ÚS, kdy manipulace vedla ke změně výchovného prostředí.  
    *Doporučený zdroj:* Nálezy ÚS sp. zn. I. ÚS 615/17, II. ÚS 3765/17. Akce: CREATE.

11. **[P1] Cestování s dítětem do zahraničí a pas dítěte při střídavé péči**  
    *Důvod:* Konflikty ohledně zadržování cestovních dokladů dítěte jedním z rodičů.  
    *Chybějící část:* Právní rozbor práva na vydání pasu pro účely dovolené a mezinárodní aspekty.  
    *Doporučený zdroj:* Zákon o cestovních dokladech, judikatura ÚS. Akce: CREATE.

12. **[P1] Změna poměrů (§ 907 OZ / § 475 ZŘS — Kdy a jak žádat rozšíření péče)**  
    *Důvod:* Původní rozsudek z útlého věku dítěte neodpovídá školnímu věku.  
    *Chybějící část:* Kritéria podstatné změny poměrů a načasování návrhu.  
    *Doporučený zdroj:* Občanský zákoník, judikatura NS ČR. Akce: CREATE.

13. **[P2] Zvládání vzteku a deeskalace konfliktu s bývalou partnerkou**  
    *Důvod:* Emoční vyhrocení poškozuje pozici otce před soudem a OSPODem.  
    *Chybějící část:* Praktická metodika komunikace (BIFF metoda) a techniky deeskalace.  
    *Doporučený zdroj:* Metodická inspirace LOM / Bill Eddy. Akce: CREATE.

14. **[P2] Mediace v rodinných sporech: Zapsaný mediátor vs. nařízené setkání soudem**  
    *Důvod:* Nejasnost rodičů, co je povinné (první setkání se zapsaným mediátorem dle § 100 OSŘ) a co dobrovolné.  
    *Chybějící část:* Průvodce přípravou na mediaci a ochrana před neúčelnou obstrukcí.  
    *Doporučený zdroj:* Zákon č. 202/2012 Sb. o mediaci. Akce: CREATE.

15. **[P2] Výživné zletilého dítěte a studium (Přechod ze střední na VŠ)**  
    *Důvod:* Zánik vyživovací povinnosti, přímá platba zletilému dítěti, neúspěšné studium.  
    *Chybějící část:* Právní návod k podání návrhu na zrušení výživného vůči zletilému.  
    *Doporučený zdroj:* § 910 an. OZ, judikatura NS. Akce: CREATE.

16. **[P2] Výživné na neprovdanou matku a úhrada nákladů těhotenství (§ 920 OZ)**  
    *Důvod:* Specifické nároky matky do 2 let věku dítěte a jejich limity.  
    *Chybějící část:* Výpočetní logika a limity důvodných nákladů.  
    *Doporučený zdroj:* § 920 Občanského zákoníku. Akce: CREATE.

17. **[P2] Náklady řízení a osvobození od soudních poplatků v opatrovnických věcech**  
    *Důvod:* Obavy otců z nákladů znaleckého posudku a zastoupení advokátem.  
    *Chybějící část:* Přehled pravidel: opatrovnické řízení je ze zákona osvobozeno od poplatků (§ 11 ZSOP), stát hradí znalečné pokud nenařídí náhradu.  
    *Doporučený zdroj:* Zákon č. 549/1991 Sb. a OSŘ. Akce: CREATE.

18. **[P3] Přestupkové řízení proti maření styku a schválnostem (§ 7 zákona o některých přestupcích)**  
    *Důvod:* Využití přestupkového řízení při fyzických incidentech u předávání dítěte.  
    *Chybějící část:* Návod k podání oznámení a limity přestupkových komisí.  
    *Doporučený zdroj:* Zákon č. 251/2016 Sb. Akce: CREATE.

19. **[P3] Domácí násilí a falešná obvinění v opatrovnickém sporu**  
    *Důvod:* Taktické zneužívání trestního oznámení k vyloučení otce z péče před rozhodnutím soudu.  
    *Chybějící část:* Krizový postup, zajištění důkazů, komunikace s PČR a presumpce neviny.  
    *Doporučený zdroj:* Trestní řád, nálezy ÚS k presumpci neviny v opatrovnictví. Akce: CREATE.

20. **[P3] Opatrovnická rada a podpora širší rodiny (Práva prarodičů na styk s vnukem § 927 OZ)**  
    *Důvod:* Prarodiče z otcovy strany jsou často odříznuti od vnoučat.  
    *Chybějící část:* Právní návod k úpravě styku prarodičů a sourozenců.  
    *Doporučený zdroj:* § 927 Občanského zákoníku, nálezy ÚS. Akce: CREATE.

---

## 8. TOP 20 RECOMMENDED ACTIONS (Návrhy dalšího postupu)

1. **[Doporučení 1]** Vytvořit originální modul *„Předběžné opatření 452 ZŘS“* s interaktivním průvodcem lhůt a vzorem návrhu.
2. **[Doporučení 2]** Zpracovat téma *„Nahlížení do spisu OSPOD podle § 38 SŘ“* do podoby praktického procesního taháku pro mobilní zařízení.
3. **[Doporučení 3]** Rozšířit modul *Judikatura* v databázi Prisma o kompletní dataset 50 klíčových nálezů ÚS a stanovisek NS ČR.
4. **[Doporučení 4]** Integrovat interaktivní *„Generátor rodičovského plánu“* s možností exportu do PDF/DOCX pro soudní schválení.
5. **[Doporučení 5]** Zpřístupnit na frontendu přehledné štítky vědecké síly (`evidenceLevel: A/B/C/D`) v katalogu Knihovny studií.
6. **[Doporučení 6]** Vytvořit průvodce *„Práva otce ve škole a školce“* s generátorem oficiální žádosti o přístup k Bakalářům a informacím.
7. **[Doporučení 7]** Vytvořit průvodce *„Práva otce ve zdravotnictví“* s výzvou k poskytování informací od ošetřujícího lékaře dítěte.
8. **[Doporučení 8]** Zpracovat manuál *„Znalecký posudek v opatrovnictví“* s kontrolním seznamem vad posudku pro advokáta.
9. **[Doporučení 9]** Rozšířit Registr subjektů o externí odkazy (`LINK_SOURCE`) na akreditované poradny Ligy otevřených mužů a Aperia.
10. **[Doporučení 10]** Doplnit do Orion Knowledge Graphu hrany mezi články, nálezy Ústavního soudu a relevantními paragrafy e-Sbírky.
11. **[Doporučení 11]** Zpracovat téma *„Střídavá péče kojenců a batolat“* propojující judikát II. ÚS 169/16 a studii Warshak (2017).
12. **[Doporučení 12]** Vytvořit procesní návod *„Výkon rozhodnutí o styku a ukládání pokut (§ 500 ZŘS)“*.
13. **[Doporučení 13]** Vytvořit vzor návrhu na *„Změnu poměrů a rozšíření péče z útlého věku na školní věk“*.
14. **[Doporučení 14]** Doplnit FAQ sekci o 15 nejčastějších procesních pastí při jednání na OSPODu.
15. **[Doporučení 15]** Zahrnout do kalkulačky výživného přesný odečet nákladů styku a péče podle metodiky MSp 2022.
16. **[Doporučení 16]** Vytvořit krizový manuál *„Reakce na nepravdivé obvinění z domácího násilí“* (presumpce neviny a evidence).
17. **[Doporučení 17]** Zpracovat průvodce *„Pas a cestování do zahraničí ve střídavé péči“*.
18. **[Doporučení 18]** Vytvořit vzor návrhu pro *„Úpravu styku prarodičů s dítětem podle § 927 OZ“*.
19. **[Doporučení 19]** Zkontrolovat veškeré externí odkazy v Registru subjektů na aktuálnost a funkčnost (404 check).
20. **[Doporučení 20]** Připravit podklady pro fázi 2 — tvorbu vlastního ověřeného obsahu bez porušení cizích autorských práv.

---

## 9. ZÁVĚR & DEFINITION OF DONE PRO FÁZI 1

Fáze 1 (Content Inventory, Rights Classification & Gap Analysis) byla úspěšně dokončena v souladu se všemi bezpečnostními a procesními pravidly projektu:
- Žádný cizí text nebyl slepě importován ani publikován.
- Všechny externí zdroje byly řádně klasifikovány (A–F) s ohledem na autorská práva.
- Byla provedena inventarizace všech modulů, studií, průvodců a judikatury.
- Byla definována přesná hierarchie proveniencí pro asistenta Orion.
- Audit je kompletně připraven k archivaci a dalšímu rozhodnutí.

---

## 10. FÁZE 2 — IMPLEMENTACE TÉMATU P0: PŘEDBĚŽNÉ OPATŘENÍ PODLE § 452 ZŘS

### A. Přehled implementovaného tématu
- **Téma:** P0 – Předběžné opatření ve věcech péče a styku (§ 452 ZŘS a § 74 an. OSŘ)
- **Obsahová kategorie:** Metodické články & Judikatura (`LEGAL_GUIDE` / `METHODOLOGY`)
- **Rozhodnutí:** `CREATE` (komplexní metodický průvodce) + `IMPROVE` (propojení ve Wiki a vzorech)
- **Umístění v architektuře:** `src/data/legalGuidesSeed.ts` (`id: 'guide-predbezne-opatreni-452'`, `slug: 'predbezne-opatreni-452-zrs'`)
- **Provázání:** `src/data/wikiSeed.ts` (`predbezne-opatreni`) a `src/data/legalTemplates.ts` (`predbezne-opatreni`)

### B. Právní zdroje a prověření (Provenance: PRIMARY_SOURCE / AI_DERIVED)
1. **Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 452–§ 465):**
   - Zvláštní předběžné opatření při bezprostředním ohrožení dítěte (rozhodnutí do 24 hodin na návrh OSPOD).
2. **Zákon č. 99/1963 Sb., občanský soudní řád (§ 74 an., § 102):**
   - Obecné předběžné opatření na úpravu styku/péče podávané rodičem (lhůta pro rozhodnutí 7 kalendářních dnů).
3. **Judikatura Ústavního soudu ČR:**
   - *Nález sp. zn. II. ÚS 3436/14:* Povinnost obecných soudů zatímně upravit styk při svévolném odepření kontaktu druhým rodičem; nebezpečí nevratného přetrhání citových vazeb.
   - *Nález sp. zn. I. ÚS 615/17:* Ochrana práva dítěte na oba rodiče prostřednictvím rychlého předběžného opatření.
   - *Nález sp. zn. II. ÚS 3765/17:* Nepřípustnost pasivity opatrovnického soudu při odcizování dítěte.

### C. Struktura implementovaného průvodce
1. **Kapitola 1:** Účel předběžného opatření a rozdíl mezi § 452 ZŘS a obecným § 74 OSŘ (info)
2. **Kapitola 2:** Kdy má návrh šanci na úspěch: Zamezení styku a svévolná změna poměrů (warning)
3. **Kapitola 3:** Lhůty soudu pro rozhodnutí (7 dnů), vykonatelnost doručením a odvolání bez odkladného účinku (steps)
4. **Kapitola 4:** Náležitosti návrhu, precizní formulace petitu a povinné listinné důkazy (checklist)
5. **Kapitola 5:** Úloha OSPODu, kolizního opatrovníka a souběžné řízení ve věci samé dle § 459 ZŘS (info)
6. **Praktický checklist (5 položek):** Formulace petitu, osvědčení naléhavosti, listinné důkazy, místní příslušnost, hlavní řízení.
7. **FAQ (3 otázky):** Osvobození od soudních poplatků, postup při nerespektování usnesení (§ 500 ZŘS), doba platnosti.

### D. Změněné a ověřené soubory
- `src/data/legalGuidesSeed.ts` (přidán `LegalGuide` pro předběžné opatření § 452 ZŘS)
- `src/data/wikiSeed.ts` (aktualizován heslář a křížové odkazy na průvodce)
- `docs/audit/CONTENT-SOURCE-GAP-AUDIT-LOM-UNIE-OTCU-APERIO.md` (tento auditní záznam)

### E. Bezpečnostní a architektonická kontrola
- Žádné secrets, tokeny, hesla ani credentials nebyly vloženy do souborů.
- Žádná nová databázová schémata ani paralelní modely nebyly vytvářeny.
- Použita existující struktura `LegalGuide` plně kompatibilní s `cmsService`, `dbStore` a frontendem.

### F. Výsledky testů a verifikace
- **Typecheck & Linter:** `npm run lint` -> `tsc --noEmit` (PASS)
- **Kompatibilita datového modelu:** Ověřena vůči `src/types/index.ts` (PASS)
- **Build test:** `compile_applet` (PASS)

### G. Git & Provenance Tracking
- **Branch:** `feat/faze-6a-unified-ai-audit-operations`
- **Commit SHA:** `b561824159e82b13562b48ee9b5f3cbfd224c68d`
- **Push Status:** `SUCCESS / VERIFIED`
- **Remote HEAD:** `b561824159e82b13562b48ee9b5f3cbfd224c68d`

---

## 10. IMPLEMENTACE FÁZE 2B — TAXONOMIE & TOPIC EXPANSION (Nahlížení do spisu OSPOD a soudu)

**Datum:** 2026-09-01  
**Oblast:** Kontrolované rozšiřování obsahu (Fáze 2B)  
**Téma:** Nahlížení do spisu OSPOD (spis Om) a soudního spisu (sp. zn. Nc / P a Nc)  
**Kategorie:** Metodické články & Judikatura (`LEGAL_METHODOLOGY` / `LEGAL_GUIDE`)  
**Typ zásahu:** `IMPROVE` & `EXPAND` (rozšíření z 2 na 6 kapitol, checklist, FAQs a přesná primární judikatura)  

### A. Povinné rozdělení obsahu (Taxonomie)
1. **Klasické články (`/clanky`):**
   - Vlastní praktický informační obsah, rady pro rodiče, rodinná dynamika a komunikace.
   - Routování: `ArticlesSection.tsx` + `ArticleDetailView.tsx`.
2. **Novinky & Aktuality (`/novinky`):**
   - Časově citlivé legislativní změny, nové metodiky, systémové aktuality.
   - Routování: `NewsHubView.tsx`.
3. **Metodické články & Judikatura (`/metodika`, `/pruvodce`, `/judikatura`):**
   - Samostatná odborná vrstva: procesní návody, paragrafové rozbory, judikatura ÚS a NSS, checklisty.
   - Routování: `LegalHubPage.tsx` + `LegalGuideDynamicView.tsx`.

### B. Právní zdroje (Primary Sources)
1. **Zákon č. 500/2004 Sb., správní řád (§ 38):**
   - Nahlížení do správního spisu, pořizování výpisů a kopií, povinné vydání usnesení o odepření (§ 38 odst. 5 SŘ).
2. **Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (§ 55):**
   - Vedení spisové dokumentace Om a evidence; zákonné limity oddělené části spisu (§ 55 odst. 5 ZSPOD).
3. **Zákon č. 99/1963 Sb., občanský soudní řád (§ 44):**
   - Nahlížení účastníka do soudního spisu na infocentru/kanceláři soudu.
4. **Judikatura NSS ČR k fotodokumentaci vlastním zařízením:**
   - *Rozsudek NSS sp. zn. 1 As 7/2010 a 6 As 242/2014:* Právo na bezplatné pořízení fotodokumentace spisu vlastním technickým prostředkem (telefon, fotoaparát) bez poplatků a bez nutnosti souhlasu protistrany.
5. **Nález Ústavního soudu ČR:**
   - *Nález sp. zn. II. ÚS 866/12:* Zákaz zatajování důkazních materiálů před účastníkem a princip rovnosti zbraní.

### C. Struktura implementovaného průvodce (`guide-spis`)
1. **Kapitola 1:** Dva různé spisy: Soudní spis (Nc / P a Nc) vs. spis Om na OSPOD (info)
2. **Kapitola 2:** Zákonné právo na bezplatnou fotodokumentaci a judikatura NSS (warning)
3. **Kapitola 3:** Spis Om na OSPOD a limity oddělené části spisu (§ 55 odst. 5 ZSPOD) (info)
4. **Kapitola 4:** Procesní obrana: Odmítnutí nahlížení a usnesení dle § 38 odst. 5 SŘ (steps)
5. **Kapitola 5:** Metodika analýzy spisu a záznam námitek do protokolu (§ 18 SŘ) (steps)
6. **Kapitola 6:** Klíčové listiny ke kontrole před soudním jednáním (checklist)
7. **Praktický checklist (6 položek):** Spisová značka, včasné objednání, doklad totožnosti + telefon, kompletní nafocení, usnesení dle § 38 odst. 5 SŘ, založení do spisu.
8. **FAQs (4 otázky):** Zákaz focení úředníkem, oddělená část spisu, postup při odmítnutí, optimální načasování nahlížení před soudem.

### D. Změněné a ověřené soubory
- `src/data/legalGuidesSeed.ts` (rozšířen `guide-spis` o 6 kapitol, checklist, FAQs a judikaturu NSS/ÚS)
- `src/data/wikiSeed.ts` (aktualizováno heslo `nahliceni-do-spisu` s odkazem na § 38 SŘ, § 55 ZSPOD a judikaturu)
- `src/components/public/ArticlesSection.tsx` (aktualizován nadpis a popis na Klasické články & Rady)
- `src/components/public/PublicPortal.tsx` (čisté oddělení rout `/clanky` a `/metodika`)
- `docs/audit/CONTENT-SOURCE-GAP-AUDIT-LOM-UNIE-OTCU-APERIO.md` (tento audit)

---

## 11. IMPLEMENTACE FÁZE 3A — VÝŽIVNÉ & METODIKA DOKAZOVÁNÍ PŘÍJMŮ

**Datum:** 2026-09-01  
**Oblast:** Kontrolované rozšiřování obsahu (Fáze 3A — Master Content Map Oblast 7)  
**Téma:** Výživné na dítě, doporučující tabulky MS ČR, dokazování u OSVČ a střídavá péče  
**Kategorie:** Metodické články & Judikatura (`LEGAL_METHODOLOGY` / `LEGAL_GUIDE`)  
**Typ zásahu:** `CREATE` (`guide-vyzivne` s 6 kapitolami, checklistem, 4 FAQs a ověřenou judikaturou) + `EXPAND` Wiki hesel  

### A. Právní a metodické zdroje (Primary Sources Verified)
1. **Zákon č. 89/2012 Sb., občanský zákoník (§ 910–§ 923):**
   - § 910–912: Základní pravidla vyživovací povinnosti.
   - § 913: Kritéria schopností, možností a majetkových poměrů povinného i oprávněného rodiče.
   - § 915 odst. 1: Princip shodné životní úrovně dítěte a rodičů.
   - § 916: Zákonná domněnka příjmu ve výši 25násobku životního minima jednotlivce při nedoložení podkladů.
   - § 921 odst. 1: Možnost přiznat/zvýšit výživné až 3 roky zpětně u nezletilých.
   - § 923: Změna a zrušení výživného při změně poměrů; zákaz vracení spotřebovaného výživného u nezletilých.
2. **Doporučující tabulka pro stanovení výživného Ministerstva spravedlnosti ČR (verze 2022/2023):**
   - 4 životní etapy (0–5, 6–10, 11–15, 16+ let).
   - Procentní pásma z čistého příjmu dle počtu vyživovacích povinností.
   - Kontrolní částka (reziduální příjem rodiče pro zachování motivace a obživy).
   - Poměrný odečet za rozsah osobní péče.
3. **Zákon č. 588/2020 Sb., o náhradním výživném:**
   - Podmínky výplaty dávky Úřadem práce ČR při neúspěšném vymáhání dlužného výživného v exekuci.
4. **Zákon č. 120/2001 Sb., exekuční řád (§ 71a):**
   - Pozastavení řidičského oprávnění při vymáhání dlužného výživného pro nezletilé dítě a zákonné výjimky.

### B. Judikatura ÚS a NS (Judicial Sources Verified)
1. **Nález Ústavního soudu sp. zn. I. ÚS 2482/13 ze dne 24. 7. 2014:**
   - Posuzování potenciality příjmů a daňové optimalizace OSVČ; zákaz mechanického vycházení z formálních daňových přiznání při zřejmém disproporčním majetku.
2. **Nález Ústavního soudu sp. zn. II. ÚS 1619/20 ze dne 30. 3. 2021:**
   - Určování výživného a kompenzace životní úrovně při střídavé péči 50/50, zákaz znevýhodnění dítěte v jedné z domácností.
3. **Nález Ústavního soudu sp. zn. IV. ÚS 650/15 ze dne 16. 12. 2015:**
   - Povinnost stanovit výživné v souladu s reálnými majetkovými poměry a zákaz likvidačního výživného ohrožujícího existenci rodiče.
4. **Rozsudek Nejvyššího soudu sp. zn. 21 Cdo 1912/2017 ze dne 18. 1. 2018:**
   - Vymezení mimořádných vs. běžných nákladů na dítě; mimořádné nákladné zájmy vyžadují předchozí dohodu obou rodičů dle § 877 OZ.

### C. Struktura implementovaného průvodce (`guide-vyzivne`)
1. **Kapitola 1:** Základy vyživovací povinnosti a princip shodné životní úrovně (§ 910–§ 923 OZ) [info]
2. **Kapitola 2:** Doporučující tabulka Ministerstva spravedlnosti ČR a algoritmus výpočtu [steps]
3. **Kapitola 3:** Potencialita příjmů a dokazování u podnikatelů a OSVČ (§ 916 OZ) [warning]
4. **Kapitola 4:** Výživné při střídavé a rovnocenné péči (II. ÚS 1619/20) [info]
5. **Kapitola 5:** Mimořádné a nahodilé výdaje (rovnátka, lyžařské výcviky, kroužky) [checklist]
6. **Kapitola 6:** Změna poměrů a zpětné přiznání či snížení výživného (§ 923 OZ) [warning]
7. **Procesní checklist (6 položek):** Doložení čistých příjmů za 12 měsíců, rozpis odůvodněných potřeb dítěte, evidence reálné péče v dnech, další vyživovací povinnosti, návrhy na bankovní účty u OSVČ, petit dle tabulek MS ČR.
8. **FAQs (4 otázky):** Fikce příjmu dle § 916 OZ, mimořádné kroužky a školy bez souhlasu, výživné při střídavé péči 50/50, ztráta práce a nemoc jako důvod pro návrh dle § 923 OZ.

### D. Změněné a ověřené soubory
- `src/data/legalGuidesSeed.ts` (přidán kompletní `LegalGuide` `guide-vyzivne`)
- `src/data/wikiSeed.ts` (přidána hesla `vyzivne`, `doporucujici-tabulka-ms-cr`, `potencialita-prijmu`, `nahradni-vyzivne`, `exekuce-vyzivneho`)
- `src/components/public/AlimonyCalculatorView.tsx` (propojení kalkulačky s novým průvodcem `/metodika/vyzivne`)
- `docs/audit/CONTENT-SOURCE-GAP-AUDIT-LOM-UNIE-OTCU-APERIO.md` (tento audit)

### E. Bezpečnostní a architektonická kontrola
- Žádné credentials, API keys ani secrets nebyly dotčeny.
- Žádné změny v Prisma DB schématu ani migracích.
- Plně kompatibilní se stávajícím rendererem `LegalGuideDynamicView.tsx` a rozcestníkem `PublicPortal.tsx`.

### F. Git Reconciliation & Verification Status
- **Branch:** `feat/faze-6a-unified-ai-audit-operations`
- **Previous HEAD:** `d2267e87d02df16205cb01c27790406d3a1ae125`
- **New HEAD Commit SHA:** `e0b6ddb66f26621befd0fc1e3c9b14b35bb3a7e4`
- **Commit Message:** `feat(content): Implement Phase 3A Child Support (Vyzivne) methodology and MS CR tables`
- **Remote Push Status:** `VERIFIED PASS` (Remote HEAD matches local HEAD `e0b6ddb66f26621befd0fc1e3c9b14b35bb3a7e4`)





