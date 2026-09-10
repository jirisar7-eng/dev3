# PROHLÁŠENÍ O TRANSPARENTNOSTI A UŽÍVÁNÍ UMĚLÉ INTELIGENCE (AI TRANSPARENCY STATEMENT)
**Kanonické ID:** `DOC-TMPR-AI-V2`  
**Klíč v systému:** `ai_transparency`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-09  
**Předchozí platná verze:** `v1.0.0` (ze dne 2026-01-01)  
**Právní rámec:** Nařízení Evropského parlamentu a Rady (EU) 2024/1689 ze dne 13. června 2024, kterým se stanoví harmonizovaná pravidla pro umělou inteligenci (Akt o umělé inteligenci / EU AI Act), zejména články 50 a 52; Nařízení (EU) 2016/679 (GDPR, zejména články 5, 9 a 22).  

---

## ℹ️ METODICKÉ UPOZORNĚNÍ PRO PRÁVNÍ REVIZI
Tento dokument představuje **komplexní a pravdivé prohlášení o transparentnosti nasazení systémů umělé inteligence (AI Transparency Statement)** v rámci portálu **Táta má právo** a technologického ekosystému **Synthesis OS**.

Dokument vychází z reálné technické architektury zdrojového kódu a datových toků a otevřeně deklaruje stávající bezpečnostní a smluvní blokátory před produkčním nasazením.

---

## OBSAH DOKUMENTU
- **ČÁST I: PŮSOBNOST A POSLÁNÍ DOKUMENTU DLE EU AI ACT**
- **ČÁST II: ARCHITEKTURA A KLASIFIKACE AI SYSTÉMŮ NA PORTÁLU**
- **ČÁST III: DETAILNÍ POPIS JEDNOTLIVÝCH AI MODULŮ**
- **ČÁST IV: ARCHITEKTURA NAPOJENÍ NA EXTERNÍ POSKYTOVATELE**
- **ČÁST V: BEZPEČNOSTNÍ STATUS: PROVIDER COMPLIANCE GATE = BLOCKED**
- **ČÁST VI: PRIVACY BOUNDARY: FAIL-CLOSED FILTR A PSEUDONYMIZACE**
- **ČÁST VII: PRINCIP LIDSKÉHO DOHLEDU (HUMAN-IN-THE-LOOP)**
- **ČÁST VIII: RIZIKA ZKRESLENÍ (BIAS), HALUCINACÍ A METODICKÁ OMEZENÍ**
- **ČÁST IX: VYLOUČENÍ AUTOMATIZOVANÉHO ROZHODOVÁNÍ DLE ČL. 22 GDPR**
- **ČÁST X: PRÁVA UŽIVATELŮ, ZPĚTNÁ VAZBA A HLÁŠENÍ CHYB AI**
- **ČÁST XI: ZÁVĚREČNÁ USTANOVENÍ A ARCHITEKTONICKÝ STATUS**

---

## ČÁST I: PŮSOBNOST A POSLÁNÍ DOKUMENTU DLE EU AI ACT

### 1. Právní ukotvení a transparentnost dle čl. 50 EU AI Act
1.1 Dne 1. srpna 2024 vstoupilo v platnost Nařízení (EU) 2024/1689 (EU AI Act). Článek 50 tohoto nařízení ukládá poskytovatelům a uživatelům systémů umělé inteligence povinnost zajistit, aby fyzické osoby byly jasně a srozumitelně informovány o tom, že přicházejí do styku se systémem AI nebo že text, který čtou či používají, byl generován systémem AI.  
1.2 **Základní deklarace Provozovatele:**  
Provozovatel portálu Táta má právo plně podporuje transparentní, odpovědné a etické využívání technologií umělé inteligence. Portál nevyužívá žádné zakázané praktiky AI ve smyslu článku 5 AI Actu (sociální skórování, biometrická identifikace na dálku v reálném čase, kognitivní manipulace za účelem způsobení újmy).  

---

## ČÁST II: ARCHITEKTURA A KLASIFIKACE AI SYSTÉMŮ NA PORTÁLU

### 2. Diferencovaná kategorizace rizikovosti systémů AI
2.1 Provozovatel odmítá zjednodušující blanketní tvrzení, že „veškerá AI na portálu spadá do kategorie minimálního rizika“. Vzhledem k tomu, že Portál zasahuje do oblasti rodinného práva, soudních rozhodnutí a péče o děti, je nutné jednotlivé moduly posuzovat diferencovaně:

| Modul / Systém AI | Primární účel | Povaha technologie | Klasifikace dle EU AI Act | Hlavní aplikovaná bezpečnostní opatření | Status v kódu |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Orion AI** | Systémový asistent a navigátor | Specializovaná LLM agentní vrstva | Systém s povinností transparentnosti (čl. 50) | RBAC omezení, role-prompting, zákaz spouštění systémových příkazů | `[VERIFIED FROM CODE: orionService.ts]` |
| **BIFF Konvertor** | Deeskalace rodičovské komunikace | Jazyková parafráze textu zprávy | Systém s povinností transparentnosti (čl. 50) | Povinné schválení člověkem před odesláním, zákaz ukládání promptů | `[VERIFIED FROM CODE: server.ts]` |
| **Judgment Parser** | Extrakce výroků z textu rozsudků | Hybridní OCR + LLM extrakce entit | Asistivní nástroj / `[LEGAL RESEARCH REQUIRED: ověřit Přílohu III bod 8]` | Regexová pseudonymizace PII, kontrola proti skenu, fail-closed čl. 9 | `[VERIFIED FROM CODE: judgmentParserService.ts]` |
| **Generátory konceptů podání** | Předvyplnění šablon návrhů soudu | Šablonové doplňování parametrů | Systém s povinností transparentnosti (čl. 50) | Výslovné vodoznaky „NÁVRH / DRAFT“, zákaz automatického podání soudu | `[VERIFIED FROM CODE]` |
| **Edukační simulátor** | Nácvik komunikace u opatrovnického soudu | Interaktivní scénářové větvení | Systém minimálního rizika (edukace) | Striktní izolace od reálných spisů, syntetická cvičná data | `[PRODUCT INTENT]` |

### 3. Posouzení vztahu k Příloze III bod 8 AI Actu (Správa spravedlnosti)
3.1 Bod 8 Přílohy III AI Actu řadí mezi **vysokorizikové systémy AI (High-Risk AI Systems)** systémy určené pro použití justičními orgány při zjišťování a výkladu skutkového stavu a práva a při uplatňování práva na konkrétní skutkové podstaty.  
3.2 **Právní vymezení modulu Judgment Parser:**  
- Modul Judgment Parser **NENÍ určen pro použití justičními orgány, soudci ani orgány OSPOD**.  
- Modul slouží výhradně jako **soukromý organizační a administrativní nástroj jednotlivého občana**, který si do svého privátního účtu nahrává rozsudek za účelem vygenerování kalendáře péče a přehledu výživného.  
- Přesto Provozovatel před přechodem do ostré produkce zadává nezávislé advokátní kanceláři **posouzení případného přesahu k regulatorním požadavkům na vysokorizikové systémy dle čl. 6 a násl. AI Actu** (`[LEGAL RESEARCH REQUIRED]`).  

---

## ČÁST III: DETAILNÍ POPIS JEDNOTLIVÝCH AI MODULŮ

### 4. Orion AI – Asistent a analytická entita
4.1 Orion AI představuje řízenou softwarovou entitu platformy Synthesis OS.  
4.2 **Rozsah schopností:**  
a) Pomáhá Uživateli s orientací v komplexních funkcích Portálu;  
b) Asistuje při formulaci věcných poznámek k opatrovnickému případu;  
c) Pomáhá vyhledávat relevantní zákonná ustanovení a publikovanou judikaturu Ústavního soudu;  
d) Vyhodnocuje formální srozumitelnost připravovaných textů.  
4.3 **Bezpečnostní omezení Oriona:**  
- Orion nemá přístup k databázím jiných uživatelů ani k cizím rodinným prostorům (striktní tenant isolation);  
- Orion nesmí a nemůže samostatně vykonávat úkony v operačním systému serveru (zákaz obecného shell endpointu);  
- Orion nepředstavuje právního poradce a jeho odpovědi mají výhradně podpůrnou hodnotu. `[VERIFIED FROM CODE: orionService.ts]`  

### 5. BIFF Komunikační konvertor
5.1 Metodika BIFF (Brief, Informative, Friendly, Firm) vyvinutá High Conflict Institute je mezinárodně uznávaným standardem pro deeskalaci komunikace v rodinných sporech.  
5.2 Uživatel zadá do vstupního pole návrh zprávy, kterou hodlá odeslat druhému rodiči (často obsahující výčitky, emotivní hodnocení a obvinění).  
5.3 Asistivní model analyzuje zprávu, odstraní emocionální balast, invektivy a pasivně agresivní formulace a navrhne **stručné, informativní, věcné a zdvořilé znění**.  
5.4 **Důležité pravidlo:** Konvertovaná zpráva se nikdy neodešle automaticky. Uživatel ji musí vědomě zkontrolovat, může ji libovolně upravit a teprve poté potvrdit její odeslání. `[VERIFIED FROM CODE]`  

### 6. Judgment Parser – Analyzátor soudních rozhodnutí
6.1 Modul umožňuje nahrát sken nebo text opatrovnického rozsudku.  
6.2 Systém provede:  
a) detekci textové vrstvy (OCR);  
b) filtrování citlivých údajů přes `PrivacyFilterService`;  
c) extrakci klíčových právních parametrů: forma péče (střídavá / výlučná / společná), přesný harmonogram předávání, výše výživného a bankovní spojení.  
6.3 Získané parametry jsou Uživateli předloženy k verifikaci a následně mohou sloužit k automatickému nastavení kalendáře péče v CoParentHubu. `[VERIFIED FROM CODE: judgmentParserService.ts]`  

---

## ČÁST IV: ARCHITEKTURA NAPOJENÍ NA EXTERNÍ POSKYTOVATELE

### 7. Multi-provider architektura a toky dat
7.1 Portál nevyvíjí a netrénuje vlastní základní jazykový model (Foundation Model) od nuly, nýbrž využívá klientská aplikační rozhraní (API) externích specializovaných technologických poskytovatelů:  
1. **Google LLC (Google GenAI / Vertex AI):** Primární model `gemini-3.6-flash`;  
2. **xAI Corp. (Grok API):** Záložní model `grok-2-1212`;  
3. **Groq Inc.:** Rychlý inferenční server pro open-source model `llama-3.3-70b-versatile`. `[VERIFIED FROM CODE: AiService.ts]`  
7.2 Systém uplatňuje automatické přepínání (fallback) v případě výpadku či nedostupnosti primárního poskytovatele.  
7.3 Servery poskytovatelů se nacházejí primárně ve Spojených státech amerických nebo v globální distribuované infrastruktuře.  

---

## ČÁST V: BEZPEČNOSTNÍ STATUS: PROVIDER COMPLIANCE GATE = BLOCKED

### 8. Pravdivé prohlášení o stavu souladu externích API
8.1 Provozovatel v souladu se zásadou integrity a transparentnosti otevřeně deklaruje, že **k datu tohoto návrhu (2026-09-09) je brána souladu s poskytovateli AI v prostředí DEV3 označena jako ZABLOKOVÁNA (GATE = BLOCKED)**:

```
============================================================
AI PROVIDER COMPLIANCE GATE STATUS: BLOCKED
============================================================
1. Enterprise Tier:            NOT VERIFIED (pouze API klíče v env)
2. Smlouvy DPA / SCC:          NOT EXECUTED (neuzavřeno formálně)
3. Záruka netrénování modelů:  NOT CERTIFIED (pouze obecné podmínky)
4. Retence promptů u třetích:  NOT VERIFIED (standardně až 30 dnů)
5. Právní DPIA posouzení:      PENDING LEGAL REVIEW
============================================================
```

8.2 **DŮSLEDEK BLOKACE PRO PRODUKCI:**  
- **Do doby formálního uzavření podnikových DPA a ověření účtů nesmí být do rozhraní AI zadávána žádná reálná neanonymizovaná data živých soudních kauz.**  
- V testovacím a vývojovém prostředí DEV3 jsou pro ladění promptů využívána výhradně fiktivní, syntetická či historická plně anonymizovaná data.  
- Přechod Portálu do ostrého provozu (PROD) je podmíněn úspěšným odblokováním této brány (`GATE = UNBLOCKED`). `[TO VERIFY BEFORE PUBLICATION]`  

---

## ČÁST VI: PRIVACY BOUNDARY: FAIL-CLOSED FILTR A PSEUDONYMIZACE

### 9. Technická ochrana soukromí před odesláním dat do AI
9.1 Každý požadavek před předáním do externího rozhraní AI prochází modulem `PrivacyFilterService` (`src/services/privacy/privacyFilterService.ts`). `[VERIFIED FROM CODE]`  
9.2 **Striktní Fail-Closed filtr pro data zvláštní kategorie (čl. 9 GDPR):**  
- Systém obsahuje syntaktický skener využívající regulární výrazy pro detekci zdravotních, psychiatrických a psychologických pojmů (`SPECIAL_CATEGORY_REGEX`).  
- Pokud je v textu detekován výskyt pojmů indikujících lékařské diagnózy, posudky duševního stavu či intimní zdravotní detaily, **systém požadavek okamžitě odmítne s chybou `PRIVACY_BOUNDARY_BLOCKED`**.  
- V takovém případě nedojde k žádnému odchozímu síťovému spojení na servery Google, xAI ani Groq.  

### 10. Heuristická obousměrná pseudonymizace
10.1 Pokud text projde filtrem citlivých dat, následuje fáze **obousměrné tokenizace**:  
- Rodná čísla -> `[RODNE_CISLO_X]`  
- Čísla bankovních účtů -> `[BANKOVNI_UCET_X]`  
- E-mailové adresy -> `[EMAIL_X]`  
- Telefonní čísla -> `[TELEFON_X]`  
- Jména a data narození -> `[JMENO_X]`, `[DATUM_NAROZENI_X]`  
10.2 Do jazykového modelu odchází výhradně tokenizovaný text zbavený přímých identifikátorů.  
10.3 Po návratu odpovědi z modelu provede systém lokální dosazení původních hodnot zpět do textu (`restorePseudonyms`).  
10.4 **Vyloučení klamavých tvrzení (No 0-PII):** Provozovatel výslovně neprohlašuje, že tato ochrana zajišťuje „100% anonymizaci“ či „nulový přenos PII“. Jedná se o heuristickou ochranu, která může selhat u atypických nestandardních textových struktur. Uživatel je povinen dbát obezřetnosti.  

---

## ČÁST VII: PRINCIP LIDSKÉHO DOHLEDU (HUMAN-IN-THE-LOOP)

### 11. Zákaz plně autonomního působení AI
11.1 V souladu s článkem 14 EU AI Actu a základními principy kybernetické etiky platí na Portálu **striktní princip Human-in-the-Loop (člověk v řízení)**:  
a) Žádný AI modul **nemá pravomoc samostatně odeslat zprávu druhému rodiči**;  
b) Žádný AI modul **nemá oprávnění odeslat podání soudu či orgánu OSPOD**;  
c) Žádný AI modul **nemůže změnit právní status uživatele či provést smazání účtu**.  
11.2 Výstupy umělé inteligence jsou vždy prezentovány jako **návrhy, koncepty či doporučení k lidskému posouzení**.  

---

## ČÁST VIII: RIZIKA ZKRESLENÍ (BIAS), HALUCINACÍ A METODICKÁ OMEZENÍ

### 12. Známá technická a kognitivní omezení modelů
12.1 Uživatel bere na vědomí následující neodstranitelná technická rizika současných generativních modelů AI:  
a) **Halucinace (Faktické výmysly):** Model může s vysokou mírou gramatické a stylistické jistoty uvést zcela smyšlené číslo soudního rozhodnutí, neexistující paragraf zákona či neplatný judikát Ústavního soudu;  
b) **Genderové a kulturní zkreslení (Bias):** Modely trénované na globálních datech mohou vykazovat skryté předsudky ohledně tradičních rodičovských rolí (např. automatické předpokládání primární pečovatelské role matky a výhradně vyživovací role otce). Provozovatel aplikuje systémové prompty směřující k neutralitě a rovnému rodičovství, nemůže však zcela vyloučit latentní zkreslení podkladových modelů;  
c) **Neschopnost empatického prožívání:** AI nerozumí skutečným emocím dětí a nemůže nahradit psychologickou či pedagogickou diagnostiku.  

---

## ČÁST IX: VYLOUČENÍ AUTOMATIZOVANÉHO ROZHODOVÁNÍ DLE ČL. 22 GDPR

### 13. Soulad s článkem 22 GDPR
13.1 Správce potvrzuje, že žádný modul Asistivní AI na Portálu **neprovádí automatizované rozhodování včetně profilování s právními účinky pro subjekt údajů ve smyslu čl. 22 odst. 1 GDPR**.  
13.2 Výstupy AI nepředstavují správní ani soudní akty a nemají žádnou závaznou právní sílu.  

---

## ČÁST X: PRÁVA UŽIVATELŮ, ZPĚTNÁ VAZBA A HLÁŠENÍ CHYB AI

### 14. Možnost volby a hlášení vadných výstupů
14.1 **Dobrovolnost užívání AI:** Využívání modulů Asistivní AI je pro Uživatele zcela dobrovolné. Uživatel může Portál, správu kalendáře i psaní zpráv plnohodnotně využívat bez zapojení jakýchkoli AI funkcí.  
14.2 **Hlášení halucinací a závad:** Zjistí-li Uživatel, že modul AI vygeneroval nepravdivou, zavádějící, diskriminační či nebezpečnou informaci, může takový výstup nahlásit prostřednictvím tlačítka „Nahlásit vadu výstupu AI“ nebo e-mailem na adresu: `[TO VERIFY: podpora@tatovacesta.cz]`.  
14.3 Nahlášené incidenty jsou zaznamenávány do technického registru a slouží k úpravě systémových promptů a bezpečnostních filtrů.  

---

## ČÁST XI: ZÁVĚREČNÁ USTANOVENÍ A ARCHITEKTONICKÝ STATUS

### 15. Závaznost a budoucí vývoj
15.1 Toto Prohlášení o transparentnosti AI v2.0.0-DRAFT představuje otevřený a závazný technicko-právní standard Portálu.  
15.2 Provozovatel se zavazuje toto prohlášení průběžně aktualizovat v návaznosti na vydávání prováděcích předpisů a pokynů Evropského úřadu pro umělou inteligenci (AI Office) a České obchodní inspekce.  

*Konec textu Prohlášení o transparentnosti umělé inteligence (AI Transparency Statement v2.0.0-DRAFT)*
