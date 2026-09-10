# PODMÍNKY UŽÍVÁNÍ PORTÁLU TÁTA MÁ PRÁVO (TERMS OF USE)
**Kanonické ID:** `DOC-TMPR-TERMS-V2`  
**Klíč v systému:** `terms`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-10  
**Předchozí platná verze:** `v1.0.0` (ze dne 2026-01-01)  
**Právní režim:** Zákon č. 89/2012 Sb., občanský zákoník, ve znění pozdějších předpisů (§ 2389a a násl., § 2898); zákon č. 634/1992 Sb., o ochraně spotřebitele; zákon č. 480/2004 Sb., o některých službách informační společnosti; zákon č. 121/2000 Sb., o právu autorském; Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR); Nařízení Evropského parlamentu a Rady (EU) 2024/1689 (EU AI Act).  

---

## ⚠️ DŮLEŽITÉ UPOZORNĚNÍ PRO PRÁVNÍ REVIZI
Tento dokument představuje **druhou, hloubkově rozšířenou pracovní verzi (Working Draft 2.0)** podmínek užívání internetového portálu **Táta má právo** v rámci technologického ekosystému **Synthesis OS**. Dokument slouží jako autoritativní normativní podklad pro finální odbornou revizi a autorizaci kvalifikovaným advokátem České advokátní komory před plánovaným uvedením do produkčního provozu. 

**TENTO DOKUMENT NENÍ SCHVÁLEN K PUBLIKACI.** Do doby jeho formálního schválení, přezkumu a publikace v produkční databázi zůstává pro všechny uživatele v platnosti výhradně publikovaná verze v1.0.0.

---

## OBSAH DOKUMENTU (TABLE OF CONTENTS)
- **ČÁST I: ÚVODNÍ USTANOVENÍ, POSTAVENÍ PROVOZOVATELE A PŮSOBNOST**
  - Článek 1: Smluvní strany, identita Provozovatele a právní rámec
  - Článek 2: Účel a věcná působnost Portálu
  - Článek 3: Vznik smlouvy o poskytování bezplatného digitálního obsahu a služeb
  - Článek 4: Věková způsobilost, svéprávnost a ochrana nezletilých
- **ČÁST II: VYMEZENÍ ZÁKLADNÍCH POJMŮ A STRUKTURA PLATFORMY**
  - Článek 5: Definice a terminologie systému Synthesis OS
- **ČÁST III: CHARAKTER SLUŽBY, VÝHRADA PRÁVNÍCH SLUŽEB A INFORMAČNÍ REŽIM**
  - Článek 6: Striktní vyloučení poskytování právních služeb a advokátního poradenství
  - Článek 7: Povaha poskytovaných informací a doporučení odborné právní pomoci
  - Článek 8: Vyloučení advokátního tajemství a ochrana důvěrnosti
- **ČÁST IV: UŽIVATELSKÝ ÚČET, REGISTRACE A OVĚŘOVÁNÍ IDENTITY**
  - Článek 9: Registrační proces a pravdivost poskytovaných údajů
  - Článek 10: Uživatelský profil a rozsah evidovaných údajů
  - Článek 11: Zákaz duplicitních, fiktivních a zneužívajících účtů
- **ČÁST V: BEZPEČNOST, PŘIHLAŠOVÁNÍ, HESLA, MFA, PASSKEYS A OAUTH**
  - Článek 12: Autentizační mechanismy (Argon2id hesla, TOTP, Passkeys, OAuth2)
  - Článek 13: Povinnosti Uživatele při ochraně přístupových údajů a zařízení
  - Článek 14: Relace, autentizační tokeny (JWT, Cookies) a bezpečnostní incidenty
  - Článek 15: Řízení přístupových práv (RBAC) a zákaz eskalace oprávnění
- **ČÁST VI: RODINNÁ DATA, EVIDENCE DÍTĚTE A NEJLEPŠÍ ZÁJEM DÍTĚTE**
  - Článek 16: Ochrana práv a nejlepšího zájmu dítěte
  - Článek 17: Rozsah a účel evidence údajů o dítěti
  - Článek 18: Oprávnění k vložení údajů o dítěti a odpovědnost rodiče
- **ČÁST VII: SPOLURODIČOVSKÝ PROSTOR (COPARENTHUB) A EVIDENCE PÉČE**
  - Článek 19: Účel modulu CoParentHub a principy spolurodičovské komunikace
  - Článek 20: Zakládání sdíleného prostoru (CoParentSpace) a dobrovolnost účasti druhého rodiče
  - Článek 21: Komunikační profily (Kooperace, Paralelní, Vysoce konfliktní)
  - Článek 22: Harmonogram péče, kalendář střídání a prázdninové plány
  - Článek 23: Deník předávání, denní záznamy a incidenty
  - Článek 24: Evidence mimořádných výdajů na dítě a jejich právní relevance
  - Článek 25: Přístup třetích osob (Observer role) a transparentní auditní stopa
- **ČÁST VIII: SPRÁVA PŘÍPADŮ, DŮKAZNÍ KATALOG, SOUDNÍ AGENDA A LHŮTY**
  - Článek 26: Osobní opatrovnická složka (Case Management)
  - Článek 27: Evidence soudu, spisových značek, soudců a referátů OSPOD
  - Článek 28: Důkazní katalog, kategorizace materiálů a varování před nezákonnými nahrávkami
  - Článek 29: Hlídání procesních lhůt a vyloučení odpovědnosti za jejich zmeškání
- **ČÁST IX: DOKUMENTOVÝ TREZOR, UPLOAD SOUBORŮ A ANTIVIROVÁ KONTROLA**
  - Článek 30: Dokumentový trezor (Document Vault) a úložiště MinIO / S3
  - Článek 31: Technické parametry uploadu a kontrola formátů
  - Článek 32: Antivirová a bezpečnostní kontrola (ClamAV) s pravidlem Fail-Closed
- **ČÁST X: UŽIVATELSKÝ OBSAH, ZAKÁZANÉ MATERIÁLY A OCHRANA PRÁV TŘETÍCH OSOB**
  - Článek 33: Odpovědnost Uživatele za vložený a nahraný obsah
  - Článek 34: Kategorický zákaz protiprávního obsahu (CSAM, násilí, revenge porn, malware)
  - Článek 35: Ochrana osobnostních práv druhého rodiče a třetích osob
- **ČÁST XI: NÁSTROJE ASISTIVNÍ UMĚLÉ INTELIGENCE (ORION, BIFF, PARSER, GENERÁTORY, SIMULÁTORY)**
  - Článek 36: Transparentnost AI dle EU AI Act a vyloučení lidské povahy AI
  - Článek 37: Asistenční entita Orion AI a její pravomoci
  - Článek 38: BIFF komunikační konvertor
  - Článek 39: Judgment Parser (analyzátor rozsudků) a jeho limity
  - Článek 40: AI generátory konceptů podání a edukační simulátory opatrovnických situací
  - Článek 41: Ochrana soukromí při AI zpracování (Privacy Filter, pseudonymizace) a externí poskytovatelé
  - Článek 42: Zákaz spoléhání se na AI bez lidského ověření a halucinace modelů
- **ČÁST XII: VEŘEJNÉ NÁSTROJE, KALKULÁTORY, E-SBÍRKA, REGISTR SUBJEKTŮ A MAPY**
  - Článek 43: Orientační kalkulátory výživného a poměru péče
  - Článek 44: Integrace právních předpisů ze systému e-Sbírka (DIA/MV ČR)
  - Článek 45: Registr subjektů, integrace ARES a mapové podklady (Leaflet/OSM)
  - Článek 46: Uživatelská hodnocení subjektů, diskusní příspěvky a jejich moderace
- **ČÁST XIII: DUŠEVNÍ VLASTNICTVÍ, AUTORSKÁ PRÁVA A LICENCE**
  - Článek 47: Autorská práva k Obsahu portálu a software Synthesis OS
  - Článek 48: Práva k Uživatelskému obsahu a licence udělená Provozovateli
- **ČÁST XIV: DOSTUPNOST SLUŽBY, ÚDRŽBA, ZÁLOHOVÁNÍ A EXPORT DAT**
  - Článek 49: Režim dostupnosti „As is“, údržba a výpadky
  - Článek 50: Povinnost Uživatele zálohovat data a implementovaný GDPR export
- **ČÁST XV: MODERACE, PORUŠENÍ PODMÍNEK, POZASTAVENÍ A UKONČENÍ ÚČTU**
  - Článek 51: Moderace obsahu a oznamovací mechanismus (Notice and Take Down)
  - Článek 52: Pozastavení účtu (SUSPENDED) a zrušení účtu (BANNED)
  - Článek 53: Právo Uživatele na zrušení účtu a smazání údajů
- **ČÁST XVI: ZÁKONNÉ LIMITY ODPOVĚDNOSTI ZA ŠKODU DLE § 2898 OBČANSKÉHO ZÁKONÍKU**
  - Článek 54: Odpovědnost, kterou nelze zákonně vyloučit ani omezit
  - Článek 55: Omezení odpovědnosti v ostatních případech a vis maior
- **ČÁST XVII: ZMĚNY PODMÍNEK, VERZOVÁNÍ A AUDITNÍ AKCEPTACE**
  - Článek 56: Pravidla jednostranné změny Podmínek a notifikační lhůta
  - Článek 57: Právo na odmítnutí změn a elektronický audit akceptace (ComplianceModal)
- **ČÁST XVIII: SPOTŘEBITELSKÁ PRÁVA, ROZHODNÉ PRÁVO, ŘEŠENÍ SPORŮ A ZÁVĚR**
  - Článek 58: Práva spotřebitele a mimosoudní řešení sporů (ČOI / ADR)
  - Článek 59: Rozhodné právo, soudní příslušnost a jazyková verze
  - Článek 60: Salvátorská klauzule, vzájemné vazby dokumentů a účinnost

---

## ČÁST I: ÚVODNÍ USTANOVENÍ, POSTAVENÍ PROVOZOVATELE A PŮSOBNOST

### Článek 1: Smluvní strany, identita Provozovatele a právní rámec
1.1 Tyto Podmínky užívání (dále jen „Podmínky“) upravují veškerá vzájemná práva, povinnosti a smluvní vztahy vznikající mezi Provozovatelem a Uživatelem v souvislosti s prohlížením, registrací a užíváním internetového portálu **Táta má právo**, dostupného na webové adrese `tatovacesta.cz` a jejích subdoménách v rámci modulární technologické platformy **Synthesis OS** (dále jen „Portál“).  
1.2 **Identifikace Provozovatele:**  
- **Provozovatel:** Jiří Šár  
- **Právní forma:** Fyzická osoba  
- **Identifikační údaje:** `[LEGAL RESEARCH REQUIRED: determine mandatory operator identification for current natural-person operating model]`  
- **Veřejná doručovací / kontaktní adresa:** `[LEGAL RESEARCH REQUIRED: stanovit veřejnou doručovací/kontaktní adresu Provozovatele — samostatné organizační rozhodnutí]`  
- **Oficiální kontaktní e-mail:** `[TO VERIFY BEFORE PUBLICATION: např. info@tatovacesta.cz]`  
- **Bezpečnostní a compliance e-mail:** `[TO VERIFY BEFORE PUBLICATION: např. podpora@tatovacesta.cz]`  
- **Datová schránka:** `[TO VERIFY BEFORE PUBLICATION: ID datové schránky fyzické osoby, je-li zřízena]`  
(v textu těchto Podmínek dále jen „Provozovatel“).  

> **DŮLEŽITÉ UPOZORNĚNÍ K PRÁVNÍM SUBJEKTŮM A BUDOUCÍMU ZÁMĚRU:**  
> Projekt Táta má právo je v současné době vyvíjen a provozován výhradně fyzickou osobou: **Jiří Šár**.  
> Provozovatelem **NENÍ** spolek, zapsaný spolek, obchodní společnost ani jiná právnická osoba.  
> `[PRODUCT INTENT — FUTURE]`: Případné založení zapsaného spolku či nadačního fondu za účelem budoucího institucionálního zastřešení komunity představuje výhradně dlouhodobý strategický záměr. V současném stavu takový spolek **NEEXISTUJE**, nemá přiděleno IČO, nemá sídlo, nemá statutární orgány a nesmí být v žádném dokumentu uváděn jako smluvní strana, provozovatel či správce osobních údajů.

1.3 **Uživatel Portálu:**  
Uživatelem je každá fyzická osoba, která vstupuje na Portál, prochází jeho veřejný obsah, zakládá si Uživatelský účet, ukládá do systému osobní či rodinná data, využívá komunikační nástroje, vede agendu péče o děti, generuje koncepty podání či používá asistivní softwarové moduly (dále jen „Uživatel“).

### Článek 2: Účel a věcná působnost Portálu
2.1 Portál Táta má právo představuje nezávislou, nekomerční, informační, edukační a technologickou platformu určenou k podpoře rodičů (zejména otců a matek řešících úpravu rodičovské odpovědnosti), kteří usilují o férové, vyvážené a transparentní uspořádání péče o své nezletilé děti v souladu s jejich nejlepším zájmem.  
2.2 Hlavními funkčními pilíři Portálu jsou:  
a) **Edukační a informační servis:** Publikace článků, metodik, anotované judikatury, právních vzorů a znění právních předpisů;  
b) **Organizační nástroje CoParentHub:** Kalendář střídání péče, evidence předávání dětí, přehled plateb a deeskalační komunikační prostředí;  
c) **Osobní opatrovnická složka (Case Management):** Přehled spisových značek, strukturovaný důkazní katalog a zabezpečený trezor pro osobní listiny;  
d) **Asistivní technologie a AI:** Nástroje pro přeformulování zpráv (BIFF), analýzu výroků rozsudků (Judgment Parser), orientační modelování výživného a tréninkové simulátory.

### Článek 3: Vznik smlouvy o poskytování bezplatného digitálního obsahu a služeb
3.1 Dokončením registračního formuláře, potvrzením e-mailové adresy a akceptací těchto Podmínek uzavírá Uživatel s Provozovatelem **smlouvu o bezúplatném poskytování digitálního obsahu a digitálních služeb** ve smyslu ustanovení § 2389a a násl. zákona č. 89/2012 Sb., občanský zákoník (dále jen „Občanský zákoník“). `[PROPOSED CLAUSE]`  
3.2 Tyto Podmínky tvoří přímý a nedílný obsahový rámec uvedené smlouvy.  
3.3 Pouhé prohlížení veřejně přístupných částí Portálu bez přihlášení zakládá mezi návštěvníkem a Provozovatelem právní vztah řídící se těmito Podmínkami v rozsahu přiměřeném povaze veřejného obsahu.

### Článek 4: Věková způsobilost, svéprávnost a ochrana nezletilých
4.1 Veřejný edukační a informační obsah Portálu je volně přístupný bez věkového omezení.  
4.2 **Založení Uživatelského účtu, vedení rodinné agendy, vkládání údajů o dětech, nahrávání soudních listin do Trezoru dokumentů a užívání AI modulů je přípustné výhradně pro fyzické osoby, které dosáhly věku 18 let a jsou plně svéprávné.** `[PROPOSED CLAUSE]`  
4.3 Osoba, jejíž svéprávnost byla soudem omezena v oblasti nakládání s osobními údaji nebo uzavírání smluv o digitálních službách, smí Portál užívat výhradně se souhlasem svého zákonného zástupce či opatrovníka.  
4.4 Pokud Provozovatel zjistí, že si účet založila osoba mladší 18 let bez náležitého oprávnění, je oprávněn takový účet bezodkladně zablokovat a veškerá s ním spojená data nevratně vymazat.

---

## ČÁST II: VYMEZENÍ ZÁKLADNÍCH POJMŮ A STRUKTURA PLATFORMY

### Článek 5: Definice a terminologie systému Synthesis OS
V těchto Podmínkách mají následující pojmy psané s velkým počátečním písmenem níže stanovený význam:  
5.1 **„Portál“** – souhrn softwarových aplikací, backendových služeb, databázových systémů, grafických uživatelských rozhraní a API provozovaných pod názvem Táta má právo na infrastruktuře platformy Synthesis OS.  
5.2 **„Uživatelský účet“** – privátní virtuální profil Uživatele vytvořený registrací, zabezpečený autentizačními faktory, umožňující přístup k neveřejným modulům.  
5.3 **„Uživatelský obsah“** – veškeré texty, poznámky, data o dětech, záznamy o předávání, audio a video nahrávky, fotografie, skeny listin, rozsudky, protokoly a podání, které Uživatel dobrovolně vloží, nahraje či vytvoří v rámci svého účtu.  
5.4 **„Obsah portálu“** – veškeré redakční články, metodiky, struktury rozsudků, matematické kalkulátory, designové prvky, zdrojové kódy a systémové texty publikované Provozovatelem.  
5.5 **„CoParentHub“** – integrovaný modul pro koordinaci péče o společné děti mezi rodiči či oprávněnými zástupci, zahrnující kalendář péče, deník předávání a evidenci mimořádných výdajů.  
5.6 **„CoParentSpace“** – konkrétní izolovaný prostor v databázi vytvořený pro správu péče o konkrétní děti, přístupný pouze schváleným členům (`CoParentMember`). `[VERIFIED FROM CODE: coparentService.ts]`  
5.7 **„Dítě“** – nezletilá osoba, k níž Uživatel vykonává rodičovskou odpovědnost, péči, poručenství či opatrovnictví a jejíž údaje Uživatel eviduje v Portálu.  
5.8 **„Trezor dokumentů“ (Document Vault)** – privátní úložiště souborů v systému MinIO (kompatibilní s protokolem S3), určené k zabezpečenému uchovávání listin Uživatele s řízeným proxy přístupem. `[VERIFIED FROM CODE: minioStorageService.ts]`  
5.9 **„Důkazní katalog“ (Case Evidence)** – strukturovaná evidence dokumentů, multimédií, korespondence a časových razítek vedená Uživatelem pro účely přípravy na opatrovnické či soudní řízení. `[VERIFIED FROM CODE: clientCaseService.ts]`  
5.10 **„Asistivní AI“** – softwarové moduly využívající algoritmy strojového učení, regulární výrazy a velkých jazykových modelů (LLM) určené k pomocné redakční, analytické a deeskalační činnosti.  
5.11 **„Orion AI“** – systémová asistenční entita platformy Synthesis OS (`agent-orion-qa-v1`) určená k navigaci, nápovědě a kontrole formální struktury dat. `[VERIFIED FROM CODE: orionService.ts]`  
5.12 **„BIFF Metodika“** – softwarový asistent transformující zprávy do formátu Brief, Informative, Friendly, Firm (Stručně, Informativně, Přátelsky, Pevně). `[VERIFIED FROM CODE]`  
5.13 **„Judgment Parser“** – modul pro optické rozpoznávání a sémantickou analýzu výroků rozsudků opatrovnických soudů. `[VERIFIED FROM CODE: judgmentParserService.ts]`  
5.14 **„RBAC“** – systém řízení přístupových práv na základě rolí (Role-Based Access Control) vynucovaný serverovým middlewarem. `[VERIFIED FROM CONFIG: schema.prisma]`

---

## ČÁST III: CHARAKTER SLUŽBY, VÝHRADA PRÁVNÍCH SLUŽEB A INFORMAČNÍ REŽIM

### Článek 6: Striktní vyloučení poskytování právních služeb a advokátního poradenství
6.1 **PROVOZOVATEL NENÍ ADVOKÁTEM, ADVOKÁTNÍ KANCELÁŘÍ, NOTÁŘEM, SOUDNÍM EXEKUTOREM ANI JINÝM SUBJEKTEM OPRÁVNĚNÝM POSKYTOVAT PRÁVNÍ SLUŽBY VE SMYSLU ZÁKONA Č. 85/1996 SB., O ADVOKACII.**  
6.2 Veškeré informace, texty, metodické návody, vzory podání, orientační výpočty výživného, výstupy AI asistentů a simulace situací publikované na Portálu mají **výhradně obecnou edukační, organizační a informativní povahu**.  
6.3 Žádná část Portálu nepředstavuje a nesmí být vykládána jako:  
a) individuální právní poradenství či posouzení konkrétní právní věci;  
b) závazné stanovení procesní strategie v soudním či správním řízení;  
c) oficiální výklad právních předpisů České republiky;  
d) garance určitého procesního výsledku či rozhodnutí soudu nebo orgánu OSPOD.  
6.4 Mezi Uživatelem a Provozovatelem, ani mezi Uživatelem a jakýmkoli administrátorem, redaktorem či dobrovolníkem Portálu, **nevzniká smlouva o poskytování právních služeb, smlouva o právní pomoci ani vztah důvěrnosti advokáta a klienta (attorney-client privilege).**

### Článek 7: Povaha poskytovaných informací a doporučení odborné právní pomoci
7.1 Každé opatrovnické řízení, spor o péči o dítě, stanovení vyživovací povinnosti či rozvod manželství představuje unikátní právní a lidskou situaci, která závisí na konkrétním skutkovém stavu, zájmu konkrétního dítěte a volném hodnocení důkazů nezávislým soudem dle zákona č. 99/1963 Sb., občanský soudní řád (OSŘ), a zákona č. 292/2013 Sb., o zvláštních řízeních soudních (ZŘS).  
7.2 **DOPORUČENÍ PROVOZOVATELE:** Provozovatel důrazně doporučuje Uživateli, aby veškerá zásadní právní podání (zejména návrhy na zahájení řízení, odvolání, dovolání, ústavní stížnosti či dohody rodičů) **před jejich podáním soudu či orgánu OSPOD konzultoval s advokátem zapsaným v České advokátní komoře**, případně využil služeb zapsaného rodinného mediátora.

### Článek 8: Vyloučení advokátního tajemství a ochrana důvěrnosti
8.1 Vzhledem k tomu, že Provozovatel neposkytuje právní služby dle zákona o advokacii, **na data vložená do Portálu se nevztahuje zákonná advokátní mlčenlivost dle § 21 zákona č. 85/1996 Sb.**  
8.2 Provozovatel chrání data Uživatelů podle standardů GDPR a těchto Podmínek prostřednictvím technických a organizačních bezpečnostních opatření, Uživatel však bere na vědomí, že v případech výslovně stanovených trestním řádem (zákon č. 141/1961 Sb.) nebo na základě pravomocného příkazu soudu může být Provozovatel povinen poskytnout součinnost orgánům činným v trestním řízení.

---

## ČÁST IV: UŽIVATELSKÝ ÚČET, REGISTRACE A OVĚŘOVÁNÍ IDENTITY

### Článek 9: Registrační proces a pravdivost poskytovaných údajů
9.1 Přístup do neveřejných modulů (CoParentHub, správa případů, nahrávání listin, generátory konceptů) vyžaduje bezplatnou registraci Uživatelského účtu. `[VERIFIED FROM CODE: authService.ts]`  
9.2 Při registraci je Uživatel povinen uvést platnou e-mailovou adresu, k níž má výhradní přístup, a nastavit si silné přístupové heslo.  
9.3 **ZÁVAZEK PRAVDIVOSTI:** Uživatel se výslovně zavazuje uvádět ve svém profilu a při správě případu výhradně pravdivé, přesné, aktuální a své vlastní osobní údaje.  
9.4 Uvádění smyšlených identit třetích osob, registrace pod cizím jménem, vydávání se za jiného rodiče, advokáta, soudce či sociálního pracovníka je přísně zakázáno a zakládá právo Provozovatele k okamžitému zrušení účtu bez náhrady.

### Článek 10: Uživatelský profil a rozsah evidovaných údajů
10.1 Uživatel může v nastavení profilu nepovinně doplnit své jméno, příjmení, datum narození, telefonní číslo, doručovací adresu a nastavení preferencí pro automatické předvyplňování konceptů dokumentů (`autoFillDocs`). `[VERIFIED FROM CONFIG: schema.prisma]`  
10.2 Uživatel má právo své profilové údaje kdykoli upravit, aktualizovat nebo smazat.

### Článek 11: Zákaz duplicitních, fiktivních a zneužívajících účtů
11.1 Každý Uživatel je oprávněn disponovat pouze jedním aktivním Uživatelským účtem.  
11.2 Je přísně zakázáno zakládat Uživatelské účty za účelem:  
a) obcházení dříve uloženého zákazu přístupu (BAN / SUSPENDED);  
b) testování zranitelností, neoprávněného vytěžování databází či DoS útoků;  
c) skrytého monitorování a stalkingu druhého rodiče;  
d) manipulace s hodnoceními v Registru subjektů.

---

## ČÁST V: BEZPEČNOST, PŘIHLAŠOVÁNÍ, HESLA, MFA, PASSKEYS A OAUTH

### Článek 12: Autentizační mechanismy (Argon2id hesla, TOTP, Passkeys, OAuth2)
12.1 S ohledem na mimořádnou citlivost rodinných dat implementuje Portál víceúrovňovou autentizační architekturu:  
a) **Hesla s kryptografickým hashováním:** Hesla jsou ukládána výhradně v podobě hashů vygenerovaných moderním paměťově a výpočetně náročným algoritmem `Argon2id`. Pro účty zavedené ve starších verzích systém podporuje zpětně kompatibilní ověření přes `bcrypt`/PBKDF2 s automatickým a transparentním povýšením (upgradem) hashe na `Argon2id` při úspěšném přihlášení. Heslo v otevřeném textu (plaintext) není nikdy ukládáno do databáze, nepřenáší se v logu ani není dostupné správcům systému. `[VERIFIED FROM CODE: src/services/authService.ts]`  
b) **Dvoufaktorové ověření (TOTP):** Uživatel si může aktivovat dvoufázové ověřování pomocí časově proměnných kódů dle standardu RFC 6238 (aplikace Google Authenticator, Microsoft Authenticator, 1Password). Systém generuje jednorázové záložní kódy (`totpBackupCodes`) pro nouzový přístup. `[VERIFIED FROM CODE: src/services/totpService.ts]`  
c) **Kryptografické klíče Passkeys (FIDO2 / WebAuthn):** Portál plně podporuje bezheslové přihlašování založené na standardu FIDO2 / `@simplewebauthn`. Biometrická data (otisk prstu, sken obličeje Touch ID / Windows Hello) zůstávají uzamčena v hardwarovém čipu (Secure Enclave / TPM) zařízení Uživatele; server zpracovává pouze veřejný klíč a kryptografický podpis výzvy. `[VERIFIED FROM CODE: src/services/passkeyService.ts]`  
d) **Federované přihlašování (OAuth2):** Uživatel může využít ověření identity přes Google či Microsoft účet. Portál získává pouze ověřený e-mail a identifikační token; nezískává žádný přístup k souborům na Disku Google, OneDrivu ani k e-mailové korespondenci Uživatele. `[VERIFIED FROM CODE: src/services/oauthService.ts]`  
12.2 **DOPORUČENÍ K ZABEZPEČENÍ:** Provozovatel důrazně doporučuje všem Uživatelům aktivovat TOTP nebo Passkeys ihned po registraci.

### Článek 13: Povinnosti Uživatele při ochraně přístupových údajů a zařízení
13.1 Přihlašovací údaje, Passkeys, TOTP tajemství a záložní kódy jsou přísně důvěrné.  
13.2 **UŽIVATEL NESMÍ SVÉ PŘIHLAŠOVACÍ ÚDAJE SDÍLET S ŽÁDNOU TŘETÍ OSOBOU**, a to ani s rodinnými příslušníky, novým partnerem či právními zástupci.  
13.3 Uživatel je povinen zabezpečit své koncové zařízení (počítač, telefon, tablet) bezpečným zámkem obrazovky, aktuálním operačním systémem a antivirovou ochranou.  
13.4 Uživatel nese plnou odpovědnost za veškeré operace provedené pod jeho účtem až do okamžiku, kdy prokazatelně nahlásí kompromitaci účtu Provozovateli.

### Článek 14: Relace, autentizační tokeny (JWT, Cookies) a bezpečnostní incidenty
14.1 Stav přihlášení je udržován pomocí kryptograficky podepsaného JSON Web Tokenu (JWT) chráněného tajným klíčem Provozovatele.  
14.2 Token je distribuován prostřednictvím hlavičky `Authorization: Bearer <token>` v klientském rozhraní a/nebo zabezpečených cookies s příznaky `HttpOnly`, `SameSite=Lax/Strict` a `Secure` (v produkčním HTTPS režimu). `[VERIFIED FROM CODE: src/middleware/authMiddleware.ts]`  
14.3 Uživatel bere na vědomí, že přihlašování na veřejně přístupných počítačích (školy, knihovny, internetové kavárny) představuje vysoké bezpečnostní riziko. Uživatel je povinen se po ukončení práce vždy explicitně odhlásit tlačítkem „Odhlásit se“.  
14.4 V případě ztráty zařízení nebo podezření na únik hesla je Uživatel povinen:  
a) neprodleně změnit heslo ve svém profilu;  
b) zrušit aktivní Passkey klíče a vygenerovat nové TOTP nastavení;  
c) kontaktovat podporu na e-mailu `[TO VERIFY BEFORE PUBLICATION: podpora@tatovacesta.cz]`.

### Článek 15: Řízení přístupových práv (RBAC) a zákaz eskalace oprávnění
15.1 Systém uplatňuje striktní řízení přístupových práv (Role-Based Access Control):  
- `USER` / `REGISTERED_USER` – standardní uživatelský přístup k osobním datům;  
- `VERIFIED_USER` – ověřený uživatel s přístupem ke komunitním funkcím;  
- `VOLUNTEER` – dobrovolník se schváleným přístupem do Team Centra;  
- `VERIFIED_CONTRIBUTOR` / `LEGAL_EDITOR` – odborný redaktor a přispěvatel;  
- `MODERATOR` – moderátor diskusí a uživatelských hlášení;  
- `ADMIN` / `SUPER_ADMIN` / `SYSTEM_ADMIN` – technická a provozní správa. `[VERIFIED FROM CONFIG: schema.prisma]`  
15.2 Jakýkoli pokus o neoprávněnou manipulaci s API endpointy, podvržení role (privilege escalation), manipulaci s cizími identifikátory (IDOR/BOLA) je zaznamenáván do bezpečnostního logu (`SensitiveAccessLog`) a vede k okamžitému zablokování účtu a případnému trestnímu oznámení. `[VERIFIED FROM CODE: server.ts]`

---

## ČÁST VI: RODINNÁ DATA, EVIDENCE DÍTĚTE A NEJLEPŠÍ ZÁJEM DÍTĚTE

### Článek 16: Ochrana práv a nejlepšího zájmu dítěte
16.1 **NEJVYŠŠÍ ZÁSADA PORTÁLU:** Veškeré funkce Portálu a veškeré nakládání s daty o nezletilých dětech podléhají zásadě ochrany **nejlepšího zájmu dítěte** dle čl. 3 Úmluvy o právech dítěte a § 855 a násl. Občanského zákoníku.  
16.2 Uživatel se zavazuje nevyužívat Portál způsobem, který by vedl k manipulaci dítěte, jeho zatahování do rodičovského konfliktu, poškozování jeho citového vývoje či narušování jeho práva na klidné rodinné zázemí.

### Článek 17: Rozsah a účel evidence údajů o dítěti
17.1 Uživatel může v Portálu evidovat údaje o svých dětech: jméno, příjmení, datum narození, navštěvovanou školu/školku, ošetřujícího pediatra, zdravotní pojišťovnu, chronická onemocnění, alergie, rozvrh kroužků a velikosti oblečení. `[VERIFIED FROM CODE: prisma/schema.prisma]`  
17.2 Údaje o dětech slouží výhradně pro praktickou organizaci péče, koordinaci rodičů a evidenci podstatných informací o vývoji dítěte.  
17.3 Tyto údaje jsou považovány za vysoce citlivé osobní údaje a podléhají nejpřísnějšímu režimu technické ochrany.

### Článek 18: Oprávnění k vložení údajů o dítěti a odpovědnost rodiče
18.1 Uživatel prohlašuje a zaručuje, že je nositelem rodičovské odpovědnosti k evidovanému dítěti, jeho zákonným zástupcem, opatrovníkem nebo poručníkem ustanoveným soudem.  
18.2 Uživatel nese plnou právní odpovědnost za oprávněnost vložení osobních údajů dítěte do systému a za to, že jejich vedení v Portálu neporušuje práva dítěte ani pravomocná rozhodnutí soudu.

---

## ČÁST VII: SPOLURODIČOVSKÝ PROSTOR (COPARENTHUB) A EVIDENCE PÉČE

### Článek 19: Účel modulu CoParentHub a principy spolurodičovské komunikace
19.1 Modul CoParentHub představuje strukturované digitální prostředí pro usnadnění komunikace a organizace péče mezi rodiči žijícími odděleně.  
19.2 Cílem modulu je nahradit chaotickou, konfliktní a emočně vypjatou komunikaci přes SMS či instant messengery transparentním, věcným a prokazatelným protokolem.

### Článek 20: Zakládání sdíleného prostoru (CoParentSpace) a dobrovolnost účasti druhého rodiče
20.1 Uživatel může v systému vytvořit rodinný prostor (`CoParentSpace`) a odeslat elektronickou pozvánku (`CoParentInvite`) druhému rodiči na jeho e-mail. `[VERIFIED FROM CODE: coparentService.ts]`  
20.2 **DOBROVOLNOST ÚČASTI:** Zapojení druhého rodiče do CoParentHubu je **zcela dobrovolné**. Žádný rodič nemůže být k užívání Portálu nucen, ledaže by mu takovou povinnost pravomocně uložil soud v rámci schváleného mediačního plánu.  
20.3 Pokud druhý rodič pozvání nepřijme nebo odmítne, funguje prostor pro zakládajícího Uživatele jako privátní opatrovnický deník.  
20.4 Přijetím pozvánky a dokončením registrace se druhý rodič stává plnohodnotným členem sdíleného prostoru s rovnocennými právy náhledu a vkládání záznamů.

### Článek 21: Komunikační profily (Kooperace, Paralelní, Vysoce konfliktní)
21.1 Správce prostoru může zvolit komunikační režim (`conflictMode`):  
a) **Režim Kooperace (COOPERATION):** Plně otevřený sdílený kalendář, volná výměna zpráv a flexibilní správa požadavků;  
b) **Paralelní rodičovství (PARALLEL):** Oddělené záznamy pro jednotlivé domácnosti; sdílí se pouze nezbytné informace (lékařské zprávy, termíny předávání, vysvědčení);  
c) **Vysoce konfliktní režim (HIGH_CONFLICT):** Vypnutí volného chatu, komunikace výhradně prostřednictvím standardizovaných formulářů s povinnou asistencí filtru BIFF. `[VERIFIED FROM CODE: coparentService.ts]`

### Článek 22: Harmonogram péče, kalendář střídání a prázdninové plány
22.1 Modul umožňuje definovat cyklická schémata péče (týden/týden, 2-2-3, rozšířený víkend) a plánovat prázdninové pobyty a svátky.  
22.2 Záznam v kalendáři, který byl oběma rodiči v systému výslovně potvrzen, je považován za oboustranně odsouhlasený rozvrh péče pro dané období.

### Článek 23: Deník předávání, denní záznamy a incidenty
23.1 Rodič může v systému zaznamenat přesný čas, místo a průběh předání dítěte, včetně zpoždění druhého rodiče či neuskutečnění styku. `[VERIFIED FROM CODE: coparentService.ts]`  
23.2 **Věcnost záznamů:** Uživatel se zavazuje vést záznamy v deníku fakticky, pravdivě a bez vulgárních či difamačních útoků na adresu druhého rodiče.  
23.3 Záznamy lze označit jako „Soukromé“ (viditelné pouze autorovi) nebo „Sdílené“ (viditelné pro oba rodiče). Soukromé záznamy nejsou druhému rodiči zpřístupněny.

### Článek 24: Evidence mimořádných výdajů na dítě a jejich právní relevance
24.1 Modul umožňuje evidovat výdaje na dítě (školní potřeby, tábory, rovnátka, lékařské zákroky, zájmové kroužky) a nahrávat příslušné účetní doklady a faktury.  
24.2 Druhý rodič může výdaj schválit, zamítnout nebo navrhnout úpravu podílu na úhradě.  
24.3 **Právní povaha:** Evidence výdajů v Portálu představuje přehledné soukromoprávní vyúčtování a důkazní záznam o vzájemné komunikaci. Schválení výdaje v Portálu může sloužit jako důkaz o dohodě rodičů před soudem, nenahrazuje však pravomocný exekuční titul.

### Článek 25: Přístup třetích osob (Observer role) a transparentní auditní stopa
25.1 Rodiče mohou do sdíleného prostoru pozvat třetí osobu v roli pozorovatele (`OBSERVER` – např. rodinného mediátora, advokáta, pověřeného pracovníka OSPOD či prarodiče). Pozorovatel má právo pouze číst odsouhlasené záznamy bez možnosti zápisu. `[VERIFIED FROM CODE: coparentService.ts]`  
25.2 **NEMĚNNOST AUDITNÍ STOPY:** Veškeré úkony v CoParentHubu (schválení termínu, zápis předání, potvrzení výdaje, odeslání zprávy) jsou nezvratně protokolovány do auditního logu (`CoParentAuditLog`). Žádný uživatel nemůže již potvrzený záznam zpětně smazat či pozměnit bez zanechání časové stopy. Tím je chráněna integrita důkazů pro opatrovnické řízení.

---

## ČÁST VIII: SPRÁVA PŘÍPADŮ, DŮKAZNÍ KATALOG, SOUDNÍ AGENDA A LHŮTY

### Článek 26: Osobní opatrovnická složka (Case Management)
26.1 Modul správy případů (`clientCaseService.ts`) umožňuje Uživateli vést přehlednou digitální složku ke svému soudnímu a opatrovnickému sporu.  
26.2 Veškerá data v tomto modulu jsou **přísně soukromá a jsou přístupná výhradně danému Uživateli**. Provozovatel, jiní uživatelé ani druhý rodič k nim nemají přístup.

### Článek 27: Evidence soudu, spisových značek, soudců a referátů OSPOD
27.1 Uživatel může v modulu evidovat příslušný okresní/krajský soud, spisovou značku řízení (např. 0 P 123/2024), jména soudců, opatrovnických referentů OSPOD, kolizních opatrovníků, protistrany a soudních znalců. `[VERIFIED FROM CODE: clientCaseService.ts]`  
27.2 Uživatel odpovídá za to, že evidované údaje odpovídají skutečnému stavu doručených soudních písemností.

### Článek 28: Důkazní katalog, kategorizace materiálů a varování před nezákonnými nahrávkami
28.1 V Důkazním katalogu (`CaseEvidence`) může Uživatel shromažďovat, popisovat a časově řadit jednotlivé důkazní prostředky (SMS zprávy, e-maily, lékařské zprávy, školní hodnocení, audiovizuální nahrávky).  
28.2 **DŮRAZNÉ PRÁVNÍ VAROVÁNÍ PŘED NEZÁKONNÝMI DŮKAZY:**  
a) Pořizování zvukových a obrazových záznamů osob bez jejich vědomí a souhlasu představuje zásah do jejich osobnostních práv dle § 86 Občanského zákoníku;  
b) Zásahy do listovního tajemství, neoprávněné čtení soukromé korespondence druhého rodiče či instalace sledovacího software (spyware) do zařízení dítěte či partnera může naplňovat skutkovou podstatu trestného činu dle zákona č. 40/2009 Sb., trestní zákoník;  
c) Soud v civilním řízení může důkaz pořízený v hrubém rozporu se zákonem a ústavním pořádkem odmítnout jako nepřípustný.  
28.3 Uživatel nese výhradní právní odpovědnost za způsob pořízení a legálnost jím evidovaných důkazních materiálů.

### Článek 29: Hlídání procesních lhůt a vyloučení odpovědnosti za jejich zmeškání
29.1 Modul umožňuje nastavení procesních lhůt (např. 15denní lhůta pro odvolání proti rozsudku dle § 204 OSŘ, lhůta k vyjádření k návrhu dle výzvy soudu). `[VERIFIED FROM CODE: clientCaseService.ts]`  
29.2 **VÝHRADA K PROCESNÍM LHŮTÁM:** Výpočet a upozorňování na procesní lhůty v Portálu má **čistě pomocnou a orientační povahu**.  
29.3 **PROVOZOVATEL NENESE ŽÁDNOU ODPOVĚDNOST ZA ZMEŠKÁNÍ PROCESNÍ LHŮTY UŽIVATELEM**, ať již k němu došlo z důvodu chybného zadání data Uživatelem, technického výpadku serveru, nedoručení notifikačního e-mailu či nesprávného započtení dnů pracovního klidu. Uživatel je povinen hlídat si zákonné a soudem stanovené lhůty samostatně a s odbornou péčí dle doručených úředních písemností.

---

## ČÁST IX: DOKUMENTOVÝ TREZOR, UPLOAD SOUBORŮ A ANTIVIROVÁ KONTROLA

### Článek 30: Dokumentový trezor (Document Vault) a úložiště MinIO / S3
30.1 Dokumentový trezor slouží k bezpečnému ukládání kopií soudních rozhodnutí, protokolů, podání, smluv a lékařských zpráv Uživatele.  
30.2 Soubory jsou ukládány v privátním objektovém úložišti kompatibilním s protokolem S3 (MinIO). Přístup k souborům je řízen výhradně přes zabezpečené backendové rozhraní po ověření oprávnění přihlášeného Uživatele. Soubory nejsou veřejně indexovatelné ani přístupné z otevřeného internetu. `[VERIFIED FROM CODE: minioStorageService.ts]`

### Článek 31: Technické parametry uploadu a kontrola formátů
31.1 Do Trezoru dokumentů a Důkazního katalogu smí Uživatel nahrávat soubory pouze v podporovaných formátech:  
- Dokumenty: PDF, DOCX, ODT, TXT, RTF;  
- Obrázky: JPEG, PNG, WEBP;  
- Audio / Video: MP3, M4A, WAV, MP4.  
31.2 Maximální velikost jednoho nahrávaného souboru je z provozních a bezpečnostních důvodů omezena na **50 MB**. `[VERIFIED FROM CODE: minioStorageService.ts]`  
31.3 Názvy nahrávaných souborů jsou při příjmu automaticky sanitizovány (odstranění nebezpečných řídicích znaků).

### Článek 32: Antivirová a bezpečnostní kontrola (ClamAV) s pravidlem Fail-Closed
32.1 Každý nahrávaný soubor prochází před uložením do trvalého úložiště automatickou bezpečnostní kontrolou na přítomnost virů, trojských koní, červů, škodlivých maker a ransomware prostřednictvím skeneru ClamAV napojeného přes TCP socket. `[VERIFIED FROM CODE: clamAvService.ts]`  
32.2 **BEZPEČNOSTNÍ PRAVIDLO FAIL-CLOSED:** Pokud antivirový skener vyhodnotí soubor jako infikovaný nebo podezřelý, **soubor je okamžitě odmítnut, vymazán z operační paměti a do trvalého úložiště se vůbec neuloží**. Uživateli se zobrazí chybové hlášení o bezpečnostním zablokování.  
32.3 Opakované pokusy o nahrání škodlivého kódu jsou vyhodnoceny jako bezpečnostní útok a vedou k okamžitému zrušení Uživatelského účtu.

---

## ČÁST X: UŽIVATELSKÝ OBSAH, ZAKÁZANÉ MATERIÁLY A OCHRANA PRÁV TŘETÍCH OSOB

### Článek 33: Odpovědnost Uživatele za vložený a nahraný obsah
33.1 Uživatel nese výhradní a plnou právní odpovědnost za veškerý Uživatelský obsah, který do Portálu vloží, nahraje či vytvoří.  
33.2 Uživatel prohlašuje, že je oprávněn s tímto obsahem nakládat a že jeho uložením do Portálu neporušuje právní předpisy, autorská práva, obchodní tajemství ani práva třetích osob na ochranu osobnosti a soukromí.

### Článek 34: Kategorický zákaz protiprávního obsahu (CSAM, násilí, revenge porn, malware)
34.1 Do Portálu je **PŘÍSNĚ ZAKÁZÁNO** nahrávat, vkládat, ukládat, šířit či odkazovat na obsah, který:  
a) **zobrazuje sexuální zneužívání dětí (CSAM / dětská pornografie)** – zjištění takového obsahu vede k okamžitému zablokování účtu, nevratnému zajištění auditní stopy a neprodlenému předání věci Policii České republiky;  
b) **propaguje terorismus, extremismus, násilí** či podněcuje k nenávisti vůči skupině osob;  
c) **obsahuje intimní snímky či nahrávky intimní povahy pořízené bez souhlasu zobrazené osoby (tzv. revenge porn)**;  
d) **obsahuje nezákonné odposlechy prostor** hrubě zasahující do lidské důstojnosti a intimního života třetích osob;  
e) **obsahuje malware, viry, exploity**, phishingové šablony či nástroje pro prolamování bezpečnosti;  
f) **neoprávněně zasahuje do autorských práv, průmyslových práv či know-how třetích osob.**  
34.2 Provozovatel uplatňuje vůči protiprávnímu obsahu politiku absolutní nulové tolerance.

### Článek 35: Ochrana osobnostních práv druhého rodiče a třetích osob
35.1 Uživatel se zavazuje, že nebude Portál zneužívat k šikanování, pronásledování (stalkingu), vydírání, pomluvám či dehonestaci druhého rodiče, opatrovnických referentů OSPOD, soudců, advokátů či jiných účastníků řízení.  
35.2 Veškerá komunikace a záznamy musí zachovávat základní lidskou důstojnost a respekt k právům ostatních dotčených osob.

---

## ČÁST XI: NÁSTROJE ASISTIVNÍ UMĚLÉ INTELIGENCE (ORION, BIFF, PARSER, GENERÁTORY, SIMULÁTORY)

### Článek 36: Transparentnost AI dle EU AI Act a vyloučení lidské povahy AI
36.1 Portál integruje asistivní softwarové nástroje založené na strojovém učení a velkých jazykových modelech (LLM).  
36.2 **TRANSPARENTNOST DLE ČL. 50 NAŘÍZENÍ (EU) 2024/1689 (EU AI ACT):**  
a) Uživatel je vždy zřetelně informován grafickým označením a textovým upozorněním, že komunikuje se systémem umělé inteligence nebo že zobrazený výstup byl vytvořen či modifikován modelem AI;  
b) **Žádný z AI modulů nepředstavuje lidskou bytost, advokáta, soudce, mediátora, psychologa ani sociálního pracovníka.** `[PRODUCT INTENT]`

### Článek 37: Asistenční entita Orion AI a její pravomoci
37.1 **Orion AI** (`agent-orion-qa-v1`) je interní asistenční softwarový agent platformy Synthesis OS určený k nápovědě, orientaci v aplikaci a asistenci při formální organizaci poznámek. `[VERIFIED FROM CODE: orionService.ts]`  
37.2 Oprávnění entity Orion jsou přísně limitována: Orion nemůže disponovat vyššími právy, než jaká má přihlášený Uživatel (`effectiveCapabilities = userCapabilities ∩ orionCapabilities`). Orion nemá autonomní přístup k serveru ani k cizím datům.

### Článek 38: BIFF komunikační konvertor
38.1 Nástroj **BIFF** slouží k asistovanému přeformulování emotivních, útočných či konfliktních návrhů zpráv do věcné, stručné, informativní a pevné podoby dle metodiky B.I.F.F. `[VERIFIED FROM CODE: aiRoutes.ts]`  
38.2 Výsledek převodu představuje nezávazný návrh. Odeslání zprávy vyžaduje vždy výslovnou autorizaci a potvrzení Uživatelem.

### Článek 39: Judgment Parser (analyzátor rozsudků) a jeho limity
39.1 Modul **Judgment Parser** využívá optické rozpoznávání znaků (OCR) a asistivní analýzu textu k orientační identifikaci výroků o péči, výživném a termínech styku ze skenů a textů rozsudků. `[VERIFIED FROM CODE: judgmentParserService.ts]`  
39.2 **VÝHRADA K PARSOVÁNÍ ROZSUDKŮ:** Výstup parseru má **čistě pomocnou a orientační povahu**. Systém může chybně interpretovat složité právní formulace, zápočty výživného či mimořádné výroky. Uživatel je povinen zkontrolovat veškerá extrahovaná data proti originálnímu písemnému vyhotovení rozsudku.

### Článek 40: AI generátory konceptů podání a edukační simulátory opatrovnických situací
40.1 **Generátor konceptů podání:** Nástroj generuje návrhy textových konceptů (např. návrh na schválení dohody o úpravě péče, návrh na zahájení řízení, vyjádření k OSPOD) na základě parametrů zadaných Uživatelem. Generovaný text je pouhým hrubým konceptem k dalšímu dopracování. `[VERIFIED FROM CODE: aiRoutes.ts]`  
40.2 **AI Simulátor:** Tréninkový edukační modul simulující průběh opatrovnického jednání u soudu, pohovor na OSPOD či krizovou komunikaci. Slouží výhradně k nácviku argumentace a psychické přípravě rodiče.

### Článek 41: Ochrana soukromí při AI zpracování (Privacy Filter, pseudonymizace) a externí poskytovatelé
41.1 Portál implementuje technické ochranné filtry (`privacyFilterService.ts`):  
a) **Fail-Closed filtr pro data zvláštní kategorie (čl. 9 GDPR):** Pokud text obsahuje výrazy indikující diagnózy, lékařské posudky či data o zdravotním stavu (`SPECIAL_CATEGORY_REGEX`), je volání AI **okamžitě zablokováno** s chybou `PRIVACY_BOUNDARY_BLOCKED`. `[VERIFIED FROM CODE: privacyFilterService.ts]`  
b) **Ochranná pseudonymizace:** Identifikátory osob (rodná čísla, bankovní účty, e-maily, telefonní čísla a celá jména s daty narození) jsou před odesláním do jazykového modelu nahrazeny náhodnými tokeny (`[RODNE_CISLO_1]`, `[JMENO_1]`). Po obdržení odpovědi provede systém zpětné dosazení původních textů do rozhraní Uživatele.  
c) **Meze pseudonymizace:** Pseudonymizace probíhá na bázi regulárních výrazů a nepředstavuje matematicky garantovanou nulovou stopu (0-PII). Uživatel se zavazuje nevkládat do AI polí zbytečné intimní a citlivé detaily o třetích osobách.  
41.2 **Externí poskytovatelé AI a Provider Compliance Gate:** AI moduly využívají backendová rozhraní velkých jazykových modelů (Google Gemini, xAI Grok, Groq) se servery umístěnými v USA a globálně.  
> **UPOZORNĚNÍ K POSKYTOVATELŮM [LEGAL RESEARCH REQUIRED]:** Provozovatel upozorňuje, že smluvní doložky o zpracování dat (DPA) a Standardní smluvní doložky (SCC) s poskytovateli AI modelů podléhají formálnímu přezkumu před uvedením do ostrého produkčního provozu (`PROVIDER COMPLIANCE GATE = BLOCKED`).

### Článek 42: Zákaz spoléhání se na AI bez lidského ověření a halucinace modelů
42.1 **Jazykové modely umělé inteligence mohou generovat fakticky nesprávné, neexistující, nepřesné či právně chybné informace (tzv. halucinace modelů), mohou vymýšlet neexistující judikáty či nesprávná znění paragrafů.**  
42.2 **UŽIVATEL SE VÝSLOVNĚ ZAVAZUJE, ŽE ŽÁDNÝ TEXT VYGENEROVANÝ ASISTIVNÍ AI NEPŘEDLOŽÍ SOUDU, ORGÁNU OSPOD ANI DRUHÉMU RODIČI BEZ DŮKLADNÉHO OSOBNÍHO OVĚŘENÍ A PŘEZKOUMÁNÍ JEHO VĚCNÉ A PRÁVNÍ SPRÁVNOSTI.**  
42.3 Veškerou právní, procesní a morální odpovědnost za obsah odeslaných zpráv a podaných návrhů nese výhradně Uživatel, který daný dokument autorizoval a podepsal.

---

## ČÁST XII: VEŘEJNÉ NÁSTROJE, KALKULÁTORY, E-SBÍRKA, REGISTR SUBJEKTŮ A MAPY

### Článek 43: Orientační kalkulátory výživného a poměru péče
43.1 Interaktivní kalkulátor výživného na Portálu provádí matematický výpočet orientační vyživovací povinnosti na základě **Doporučujících tabulek Ministerstva spravedlnosti ČR** (manuál k určování výživného). `[VERIFIED FROM CODE]`  
43.2 **VÝHRADA K VÝPOČTŮM VÝŽIVNÉHO:** Výsledek kalkulačky představuje **čistě orientační modelový propočet**.  
43.3 Opatrovnický soud při stanovení výživného není doporučujícími tabulkami striktně vázán a posuzuje celou řadu individuálních faktorů dle § 913 a § 915 Občanského zákoníku (odůvodněné potřeby dítěte, majetkové poměry rodičů, péči o další vyživované osoby, schopnosti a možnosti rodiče, skryté příjmy, osobní péči o dítě). Skutečně stanovené výživné se proto může od výsledku kalkulačky podstatně lišit.

### Článek 44: Integrace právních předpisů ze systému e-Sbírka (DIA/MV ČR)
44.1 Portál umožňuje vyhledávání v právních předpisech České republiky synchronizovaných z oficiálního systému **e-Sbírka** provozovaného Digitální a informační agenturou (DIA) a Ministerstvem vnitra ČR. `[VERIFIED FROM CODE: EsbirkaService.ts]`  
44.2 Provozovatel provádí synchronizaci právních předpisů server-side s přísným respektováním kvót poskytovatele (max. 1 request/s, 1 souběžné spojení, max. 5 synchronizačních požadavků denně). Uživatel přistupuje výhradně k lokální indexované kopii předpisů.  
44.3 Uživatel nesmí vyvíjet žádnou činnost směřující k hromadnému stahování (scrapingu) či přetěžování rozhraní přes Portál.

### Článek 45: Registr subjektů, integrace ARES a mapové podklady (Leaflet/OSM)
45.1 Portál shromažďuje veřejně dostupné kontaktní a organizační údaje o opatrovnických soudech, pracovištích OSPOD, soudních znalcích a zapsaných mediátorech. `[VERIFIED FROM CODE: subjektService.ts]`  
45.2 Identifikační údaje subjektů jsou ověřovány prostřednictvím veřejného registru ARES Ministerstva financí ČR.  
45.3 Mapové zobrazení využívá open-source technologie Leaflet a data OpenStreetMap bez komerčního sledování uživatelů.  
45.4 Provozovatel usiluje o maximální přesnost dat, neručí však za náhlé změny úředních hodin, personální změny na pracovištích OSPOD či stěhování soudních budov. Uživatel je povinen před návštěvou instituce ověřit úřední hodiny na jejím oficiálním webu.

### Článek 46: Uživatelská hodnocení subjektů, diskusní příspěvky a jejich moderace
46.1 Registrovaní Uživatelé mohou vkládat věcná hodnocení a zkušenosti s pracovišti OSPOD, soudy a odborníky. `[VERIFIED FROM CODE: schema.prisma]`  
46.2 Uživatel se zavazuje, že hodnocení budou vycházet z jeho skutečné osobní zkušenosti, budou formulována slušně, věcně a nebudou obsahovat nepravdivá nařčení z trestné činnosti, vulgární urážky ani osobní útoky na konkrétní referenty či soudce.  
46.3 Provozovatel si vyhrazuje právo odstranit hodnocení, která porušují tato pravidla nebo dobré mravy.

---

## ČÁST XIII: DUŠEVNÍ VLASTNICTVÍ, AUTORSKÁ PRÁVA A LICENCE

### Článek 47: Autorská práva k Obsahu portálu a software Synthesis OS
47.1 Veškerý Obsah portálu – zejména grafické rozhraní, loga, ochranné známky, zdrojový kód, softwarová architektura Synthesis OS, struktura databází, redakční texty, metodické příručky, designové komponenty a vzory dokumentů – je chráněn zákonem č. 121/2000 Sb., o právu autorském (Autorský zákon), a mezinárodními smlouvami.  
47.2 Provozovatel uděluje Uživateli bezúplatnou, omezenou, nevýhradní, nepřenosnou a odvolatelnou licenci k užívání Portálu a jeho Obsahu výhradně pro **osobní, nekomerční potřebu Uživatele** v souladu s těmito Podmínkami.  
47.3 **ZÁKAZY PRO UŽIVATELE:** Uživatel není bez předchozího písemného souhlasu Provozovatele oprávněn:  
a) kopírovat, rozmnožovat, distribuovat, pronajímat či veřejně sdělovat Obsah portálu za komerčním účelem;  
b) provádět zpětnou analýzu (reverse engineering), dekompilaci či rozklad zdrojového kódu Portálu;  
c) vytěžovat databáze Portálu pomocí scraperů, crawlerů či automatizovaných botů;  
d) odstraňovat autorskoprávní výhrady, vodoznaky či identifikační označení z generovaných materiálů.

### Článek 48: Práva k Uživatelskému obsahu a licence udělená Provozovateli
48.1 Veškerá vlastnická a autorská práva k Uživatelskému obsahu (fotografie, osobní texty, deníkové záznamy, listiny) zůstávají v plném rozsahu zachována Uživateli.  
48.2 Vložením Uživatelského obsahu do Portálu uděluje Uživatel Provozovateli bezúplatnou, územně neomezenou, nevýhradní licenci k technickému ukládání, reprodukci, zálohování a zpracování tohoto obsahu v rozsahu nezbytném pro:  
a) řádné poskytování služeb Portálu Uživateli (zobrazení v UI, generování PDF exportů, odeslání pozvanému spolurodiči);  
b) zajištění antivirové kontroly a systémové integrity;  
c) plnění zákonných povinností Provozovatele (např. bezpečnostní logování).  
48.3 Provozovatel se zavazuje, že Uživatelský obsah neposkytne komerčně třetím stranám, nepoužije jej k marketingovým účelům ani k trénování veřejných modelů AI bez výslovného souhlasu Uživatele.

---

## ČÁST XIV: DOSTUPNOST SLUŽBY, ÚDRŽBA, ZÁLOHOVÁNÍ A EXPORT DAT

### Článek 49: Režim dostupnosti „As is“, údržba a výpadky
49.1 Služby Portálu jsou poskytovány **bezplatně, v režimu „tak, jak jsou“ (as is) a „jak jsou dostupné“ (as available)**.  
49.2 Provozovatel vyvíjí maximální přiměřené úsilí k zajištění nepřetržitého a bezpečného chodu Portálu, negarantuje však stoprocentní dostupnost služeb (SLA) ani bezchybný provoz na všech zařízeních a prohlížečích.  
49.3 Provozovatel je oprávněn provádět plánované i neplánované technické odstávky serverů za účelem údržby, aktualizace software a nasazení bezpečnostních záplat. O plánovaných odstávkách delších než 2 hodiny bude Uživatel informován předem upozorněním na Portálu, je-li to technicky proveditelné.

### Článek 50: Povinnost Uživatele zálohovat data a implementovaný GDPR export
50.1 Provozovatel provádí pravidelné systémové zálohování databáze za účelem obnovy provozu v případě technické havárie infrastruktury.  
50.2 **PORTÁL NENÍ ARCHIVAČNÍ SLUŽBOU ANI ÚSCHOVNOU ORIGINÁLNÍCH LISTIN.**  
50.3 **UŽIVATEL JE POVINEN UDRŽOVAT SI VLASTNÍ NEZÁVISLÉ ZÁLOHY VEŠKERÝCH DŮLEŽITÝCH DOKUMENTŮ, ROZSUDKŮ, DŮKAZNÍCH MATERIÁLŮ A ZÁZNAMŮ NA SVÉM VLASTNÍM LOKÁLNÍM ZAŘÍZENÍ ČI EXTERNÍM DISKU.**  
50.4 Portál nabízí funkci hromadného exportu dat ve strojově čitelném formátu JSON (`GET /api/gdpr/export-data`), kterou Uživatel může kdykoli využít k vytvoření lokální kopie svých záznamů (profil, případy, děti, poznámky, kalendář, záznamy o dokumentech a logy souhlasů). `[VERIFIED FROM CODE: server.ts]`

---

## ČÁST XV: MODERACE, PORUŠENÍ PODMÍNEK, POZASTAVENÍ A UKONČENÍ ÚČTU

### Článek 51: Moderace obsahu a oznamovací mechanismus (Notice and Take Down)
51.1 Provozovatel aktivně nemonitoruje privátní Uživatelský obsah v Trezoru dokumentů ani v soukromých poznámkách, respektuje soukromí korespondence dle čl. 13 Listiny základních práv a svobod.  
51.2 Provozovatel je však na základě oznámení Uživatele, orgánu veřejné moci či třetí osoby oprávněn prověřit a **okamžitě znepřístupnit či odstranit obsah, který zjevně porušuje právní předpisy, dobré mravy či tyto Podmínky** (zejména obsah uvedený v Článku 34 těchto Podmínek), a to v souladu se zákonem č. 480/2004 Sb., o některých službách informační společnosti.

### Článek 52: Pozastavení účtu (SUSPENDED) a zrušení účtu (BANNED)
52.1 Provozovatel je oprávněn dočasně pozastavit přístup k Uživatelskému účtu (`AccountStatus: SUSPENDED`), pokud:  
a) existuje důvodné podezření na kompromitaci přihlašovacích údajů či napadení účtu malwarem;  
b) Uživatel provádí neobvykle vysoký počet požadavků ohrožující stabilitu systému (DoS);  
c) probíhá šetření závažného bezpečnostního incidentu. `[VERIFIED FROM CONFIG: schema.prisma]`  
52.2 Provozovatel je oprávněn **trvale zablokovat a zrušit Uživatelský účet (`AccountStatus: BANNED`)**, pokud:  
a) Uživatel závažným způsobem nebo opakovaně poruší tyto Podmínky;  
b) Uživatel se pokusil o neoprávněný průnik do systému, obcházení autentizace či reverzní inženýrství;  
c) Uživatel nahrál do systému obsah zobrazující sexuální zneužívání dětí (CSAM), teroristický materiál či nebezpečný malware;  
d) Uživatel zneužívá systém k systematickému stalkingu, kyberšikaně či vyhrožování druhému rodiči nebo dětem.

### Článek 53: Právo Uživatele na zrušení účtu a smazání údajů
53.1 Uživatel je oprávněn **kdykoli a bez udání důvodu ukončit užívání Portálu a požádat o smazání svého Uživatelského účtu**.  
53.2 Žádost o smazání účtu může Uživatel podat přímo v rozhraní nastavení profilu (`POST /api/gdpr/deletion-request`). `[VERIFIED FROM CODE: server.ts]`  
53.3 Po podání žádosti proběhne kaskádové smazání osobních údajů, profilu, dětí, poznámek a nahraných souborů z aktivních databází v souladu se Zásadami ochrany osobních údajů (Privacy Notice).

---

## ČÁST XVI: ZÁKONNÉ LIMITY ODPOVĚDNOSTI ZA ŠKODU DLE § 2898 OBČANSKÉHO ZÁKONÍKU

### Článek 54: Odpovědnost, kterou nelze zákonně vyloučit ani omezit
54.1 Provozovatel a Uživatel tímto sjednávají rozsah odpovědnosti za škodu v plném souladu s kogentními ustanoveními právního řádu České republiky, zejména **ustanovením § 2898 Občanského zákoníku**.  
54.2 **ŽÁDNÉ USTANOVENÍ TĚCHTO PODMÍNEK SE NEDOTÝKÁ, NEVYLUČUJE ANI NEOMEZUJE ODPOVĚDNOST PROVOZOVATELE ZA:**  
a) **ÚJMU ZPŮSOBENOU ČLOVĚKU NA JEHO PŘIROZENÝCH PRÁVECH (ŽIVOT, ZDRAVÍ, OSOBNOSTNÍ PRÁVA DLE § 81 A NÁSLEDNÝCH OBČANSKÉHO ZÁKONÍKU);**  
b) **ÚJMU ZPŮSOBENOU ÚMYSLNĚ NEBO Z HRUBÉ NEDBALOSTI PROVOZOVATELE;**  
c) **PRÁVA UŽIVATELE JAKO SPOTŘEBITELE, KTERÁ ZE ZÁKONA NELZE SMLUVNĚ OMEZIT ANI VYLOUČIT.** `[PROPOSED CLAUSE]`

### Článek 55: Omezení odpovědnosti v ostatních případech a vis maior
55.1 V rozsahu, v jakém to platné právní předpisy umožňují, Provozovatel neodpovídá za:  
a) **Výsledek soudních a opatrovnických řízení:** Provozovatel neodpovídá za rozhodnutí soudů, orgánů OSPOD či jiných orgánů veřejné moci. Použití vzorů, kalkulátorů či rad z Portálu nezaručuje úspěch v právním sporu;  
b) **Zmeškání procesních lhůt:** Provozovatel neodpovídá za procesní újmu způsobenou zmeškáním lhůty k odvolání, vyjádření či zaplacení soudního poplatku;  
c) **Nepřesnost výstupů Asistivní AI a kalkulaček:** Provozovatel neodpovídá za případné faktické, právní či výpočtové chyby ve výstupech generovaných modely AI nebo orientačními kalkulačkami, které Uživatel nekontroloval;  
d) **Škodu způsobenou zneužitím přístupových údajů:** Provozovatel neodpovídá za škodu vzniklou tím, že Uživatel umožnil přístup ke svému účtu třetí osobě nebo nedbal na zásady kybernetické bezpečnosti;  
e) **Ztrátu dat způsobenou vyšší mocí (vis maior):** Provozovatel neodpovídá za výpadky a ztráty způsobené živelními pohromami, válečnými konflikty, kybernetickými útoky globálního rozsahu, výpadky páteřních telekomunikačních sítí či zásahy státních orgánů.

---

## ČÁST XVII: ZMĚNY PODMÍNEK, VERZOVÁNÍ A AUDITNÍ AKCEPTACE

### Článek 56: Pravidla jednostranné změny Podmínek a notifikační lhůta
56.1 Provozovatel je oprávněn tyto Podmínky v přiměřeném rozsahu jednostranně měnit nebo doplňovat, zejména z důvodu:  
a) změn právních předpisů (novely občanského zákoníku, zákona o ochraně spotřebitele, GDPR, implementace EU AI Act);  
b) technického rozvoje Portálu, nasazení nových modulů, bezpečnostních funkcí či změny infrastruktury;  
c) reakce na novou judikaturu soudů týkající se digitálních služeb. `[PROPOSED CLAUSE]`

### Článek 57: Právo na odmítnutí změn a elektronický audit akceptace (ComplianceModal)
57.1 Nové znění Podmínek bude zveřejněno na Portálu s uvedením data účinnosti a nového čísla verze.  
57.2 O podstatných změnách Podmínek bude Uživatel informován **nejméně 15 dnů před nabytím jejich účinnosti**, a to prostřednictvím:  
a) informační zprávy zaslané na registrovanou e-mailovou adresu Uživatele; a/nebo  
b) dialogového okna (`ComplianceModal`) zobrazeného při přihlášení do Uživatelského účtu. `[VERIFIED FROM CODE: ComplianceModal.tsx]`  
57.3 Pokud Uživatel s navrženou změnou Podmínek nesouhlasí, **má právo změny odmítnout a smlouvu bez jakýchkoli sankcí vypovědět tím, že před nabytím účinnosti změn požádá o smazání svého Uživatelského účtu**.  
57.4 Pokračuje-li Uživatel v užívání neveřejných funkcí Portálu i po nabytí účinnosti nového znění Podmínek, má se za to, že novou verzi Podmínek přijal.  
57.5 **ELEKTRONICKÝ AUDITNÍ ZÁZNAM:** Portál eviduje historii akceptace právních dokumentů v auditním modelu `UserConsentLog` a `Consent` (ID uživatele, klíč `terms`, verze, časové razítko, IP adresa, User-Agent). Tiskový výstup používá pravdivé označení: **„PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO“**. `[VERIFIED FROM CODE: server.ts]`

---

## ČÁST XVIII: SPOTŘEBITELSKÁ PRÁVA, ROZHODNÉ PRÁVO, ŘEŠENÍ SPORŮ A ZÁVĚR

### Článek 58: Práva spotřebitele a mimosoudní řešení sporů (ČOI / ADR)
58.1 Je-li Uživatel spotřebitelem ve smyslu § 419 Občanského zákoníku, vztahují se na něj ustanovení zákona č. 634/1992 Sb., o ochraně spotřebitele, v platném znění.  
58.2 V případě vzniku spotřebitelského sporu mezi Uživatelem a Provozovatelem, který se nepodaří vyřešit vzájemnou dohodou, má Uživatel právo podat návrh na mimosoudní řešení sporu k příslušnému orgánu, kterým je:  
**Česká obchodní inspekce (ČOI)**  
Ústřední inspektorát – oddělení ADR  
Štěpánská 44, 120 00 Praha 2  
Web: `https://www.coi.cz` | E-mail: `adr@coi.cz`  
58.3 Spotřebitel může využít rovněž platformu pro řešení sporů on-line zřízenou Evropskou komisí na adrese `https://ec.europa.eu/consumers/odr`.

### Článek 59: Rozhodné právo, soudní příslušnost a jazyková verze
59.1 Veškeré právní vztahy vznikající z užívání Portálu, tyto Podmínky a veškeré spory z nich vyplývající se řídí výhradně **právním řádem České republiky**, s vyloučením kolizních norem mezinárodního práva soukromého.  
59.2 Případné spory budou řešeny věcně a místně příslušnými obecnými soudy České republiky podle bydliště / obecného soudu Provozovatele (fyzické osoby), ledaže kogentní právní předpis na ochranu spotřebitele stanoví pro spotřebitele příslušnost jinou.  
59.3 Tyto Podmínky jsou vyhotoveny v **českém jazyce**. Případné cizojazyčné překlady mají pouze informativní charakter; v případě rozporu je rozhodující české znění.

### Článek 60: Salvátorská klauzule, vzájemné vazby dokumentů a účinnost
60.1 Je-li nebo stane-li se některé ustanovení těchto Podmínek neplatným, neúčinným či nevymahatelným, netýká se to platnosti a účinnosti ostatních ustanovení. Namísto neplatného ustanovení nastoupí ustanovení platného právního řádu České republiky, jehož smysl se co nejvíce přibližuje hospodářskému a právnímu účelu původního ustanovení.  
60.2 **Vzájemné vazby dokumentace Legal Pack 2.0:** Tyto Podmínky tvoří ucelený právní celek společně s:  
a) **Zásadami ochrany osobních údajů (Privacy Notice)** – `DOC-TMPR-PRIVACY-V2`;  
b) **Zásadami používání cookies (Cookie Policy)** – `DOC-TMPR-COOKIES-V2`;  
c) **Právním vyloučením odpovědnosti (Legal Disclaimer)** – `DOC-TMPR-DISCLAIMER-V2`;  
d) **Prohlášením o transparentnosti AI (AI Transparency Notice)** – `DOC-TMPR-AI-TRANSPARENCY-V2`.  
60.3 Tento návrh Podmínek užívání v2.0.0-DRAFT nabývá formální platnosti až dnem jeho schválení administrátorem a publikace do produkční databáze po dokončení procedury `PRE-PUBLICATION LEGAL REVIEW`. V mezidobí zůstává v platnosti publikovaná verze v1.0.0 ze dne 2026-01-01.

---
*Konec textu návrhu Podmínek užívání (Terms of Use v2.0.0-DRAFT)*
