# PODMÍNKY UŽÍVÁNÍ PORTÁLU TÁTA MÁ PRÁVO
**Kanonické ID:** `DOC-TMPR-TERMS-V2`  
**Klíč v systému:** `terms`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-09  
**Předchozí platná verze:** `v1.0.0` (ze dne 2026-01-01)  

---

## OBSAH
- **ČÁST I: ÚVODNÍ USTANOVENÍ A DEFINICE**
- **ČÁST II: CHARAKTER SLUŽBY A VÝHRADA INFORMATIVNÍ POVAHY**
- **ČÁST III: UŽIVATELSKÝ ÚČET, REGISTRACE A ZABEZPEČENÍ**
- **ČÁST IV: PRAVIDLA UŽÍVÁNÍ A ZÁKAZ ZNEUŽITÍ**
- **ČÁST V: SPOLURODIČOVSKÝ PROSTOR (COPARENTHUB) A EVIDENCE PÉČE**
- **ČÁST VI: SPRÁVA PŘÍPADŮ, EVIDENCE DŮKAZŮ A UPLOAD DOKUMENTŮ**
- **ČÁST VII: NÁSTROJE ASISTIVNÍ UMĚLÉ INTELIGENCE (ORION & AI MODULY)**
- **ČÁST VIII: DUŠEVNÍ VLASTNICTVÍ A LICENCE K OBSAHU**
- **ČÁST IX: DOSTUPNOST SLUŽBY, ÚDRŽBA A BEZPEČNOSTNÍ INCIDENTY**
- **ČÁST X: MODERACE OBSAHU, POZASTAVENÍ A UKONČENÍ ÚČTU**
- **ČÁST XI: ODPOVĚDNOST ZA ŠKODU A ZÁKONNÉ LIMITY**
- **ČÁST XII: ZÁVĚREČNÁ USTANOVENÍ A ROZHODNÉ PRÁVO**

---

## ČÁST I: ÚVODNÍ USTANOVENÍ A DEFINICE

### 1. Smluvní strany a účel dokumentu
1.1 Tyto Podmínky užívání (dále jen „Podmínky“) upravují práva a povinnosti vznikající v souvislosti s přístupem a užíváním internetového portálu **Táta má právo** a jeho modulů v rámci technologického ekosystému Synthesis OS (dále jen „Portál“).  
1.2 **Provozovatel:** [TO VERIFY: identita budoucího provozovatele], IČO: [TO VERIFY: IČO], se sídlem: [TO VERIFY: sídlo], zapsaný v [TO VERIFY: spisová značka v příslušném rejstříku] (dále jen „Provozovatel“).  
1.3 **Uživatel:** Každá zletilá a plně svéprávná fyzická osoba, která vstupuje na Portál, prohlíží jej, registruje se nebo využívá jeho nástroje (dále jen „Uživatel“).  
1.4 Registrací účtu nebo aktivním užíváním Portálu uzavírá Uživatel s Provozovatelem smlouvu o poskytování bezplatných digitálních služeb, jejíž nedílnou součást tvoří tyto Podmínky. `[PROPOSED CLAUSE]`

### 2. Vymezení pojmů
2.1 Pro účely těchto Podmínek se rozumí:
a) **Službou** – souhrn informačních, edukačních a softwarových nástrojů přístupných na webovém rozhraní Portálu;  
b) **Uživatelským obsahem** – veškeré údaje, texty, poznámky, data o dětech, záznamy o předávání, audio či video soubory, fotografie, listinné skeny a rozsudky vložené Uživatelem;  
c) **Obsahem portálu** – veškeré redakční články, vzory podání, metodické příručky, kalkulátory, struktury databází a grafické prvky publikované Provozovatelem;  
d) **CoParentHubem** – privátní spolurodičovské rozhraní umožňující vzájemnou koordinaci péče o nezletilé děti mezi rodiči či oprávněnými zástupci;  
e) **Asistivní AI (Orion)** – softwarový modul využívající modely strojového učení k formátování textů, sumarizaci rozsudků a jazykové asistenci.

---

## ČÁST II: CHARAKTER SLUŽBY A VÝHRADA INFORMATIVNÍ POVAHY

### 3. Vymezení informační povahy
3.1 Portál je **informační, vzdělávací a technologickou platformou**. Portál ani Provozovatel **NEJSOU advokátní kanceláří** ani poskytovatelem právních služeb ve smyslu zákona č. 85/1996 Sb., o advokacii.  
3.2 Žádná část Obsahu portálu, interaktivních formulářů, kalkulátorů ani výstupů Asistivní AI **nepředstavuje individuální právní poradenství**, právní stanovisko ani závazný návod k vedení soudního sporu.  
3.3 Mezi Uživatelem a Provozovatelem **nevzniká vztah advokáta a klienta** (attorney-client relationship). Komunikace prostřednictvím Portálu není chráněna advokátním tajemstvím.  
3.4 Provozovatel důrazně doporučuje, aby Uživatel před učiněním jakéhokoli právního úkonu, podáním návrhu k soudu či orgánu OSPOD konzultoval svůj případ s advokátem zapsaným v České advokátní komoře.

---

## ČÁST III: UŽIVATELSKÝ ÚČET, REGISTRACE A ZABEZPEČENÍ

### 4. Vznik účtu a věková způsobilost
4.1 Využívání veřejných článků a základního registru subjektů je přístupné bez registrace. Využívání modulů CoParentHub, trezoru dokumentů, správy případů a generátorů podání vyžaduje vytvoření uživatelského účtu.  
4.2 Založit uživatelský účet smí výhradně osoba, která dosáhla věku **18 let** a je plně způsobilá k právním úkonům. `[PROPOSED CLAUSE]`  
4.3 Uživatel je povinen při registraci uvést pravdivé, úplné a aktuální identifikační údaje a udržovat je v aktuálním stavu. Registrace pod cizí identitou je zakázána.

### 5. Bezpečnost přihlašovacích údajů a vícefaktorová autentizace
5.1 Přístupové údaje (e-mail, heslo, Passkeys, záložní kódy) jsou přísně důvěrné a nepřenosné. Uživatel nesmí umožnit přístup ke svému účtu třetím osobám.  
5.2 Systém umožňuje zabezpečení účtu pomocí dvoufaktorového ověření (TOTP) a kryptografických klíčů Passkeys (WebAuthn). `[VERIFIED FROM CODE: totpService.ts, passkeyService.ts]` Provozovatel aktivaci těchto prvků důrazně doporučuje vzhledem k citlivé povaze rodinných údajů.  
5.3 V případě podezření na zneužití, ztrátu přihlašovacích údajů nebo neautorizovaný přístup je Uživatel povinen neprodleně změnit své heslo a kontaktovat Provozovatele na adrese `[TO VERIFY: bezpečnostní kontaktní e-mail]`.

---

## ČÁST IV: PRAVIDLA UŽÍVÁNÍ A ZÁKAZ ZNEUŽITÍ

### 6. Povinnosti Uživatele a zakázaná jednání
6.1 Uživatel se zavazuje užívat Portál výhradně v souladu s právními předpisy České republiky, dobrými mravy a těmito Podmínkami.  
6.2 Uživatel se výslovně zavazuje, že nebude:  
a) vkládat do veřejných částí Portálu, fór či komentářů vulgární, výhrůžné, pomlouvačné nebo nenávistné projevy vůči jakékoli osobě (včetně druhého rodiče, dětí, pracovníků OSPOD nebo soudců);  
b) zveřejňovat v otevřených částech Portálu rodná čísla, adresy bydliště, zdravotní záznamy nebo jiné identifikátory třetích osob bez jejich výslovného zákonného zmocnění;  
c) nahrávat do systému soubory obsahující malware, viry, trojské koně či jiný škodlivý kód; `[VERIFIED FROM CODE: clamAvService.ts provádí automatickou kontrolu]`  
d) pokoušet se o neoprávněný průnik do infrastruktury Portálu, obcházení autentizace, reverzní inženýrství, přetěžování serverů (DDoS) nebo vytěžování databáze (scraping);  
e) zneužívat komunikační nástroje a Asistivní AI k šikanování, stalkingu nebo nátlaku na druhého rodiče.

---

## ČÁST V: SPOLURODIČOVSKÝ PROSTOR (COPARENTHUB) A EVIDENCE PÉČE

### 7. Účel modulu CoParentHub
7.1 Modul CoParentHub slouží k transparentní, věcné a prokazatelné koordinaci péče o nezletilé děti. Jeho cílem je ochrana nejlepšího zájmu dítěte a eliminace destruktivních komunikačních konfliktů mezi rodiči. `[PRODUCT INTENT]`  
7.2 Založením prostoru vzniká privátní datové prostředí (`CoParentSpace`), k němuž mají přístup pouze oprávnění členové (`CoParentMember`). `[VERIFIED FROM CODE: coparentService.ts]`

### 8. Pozvání druhého rodiče a třetích osob
8.1 Uživatel může prostřednictvím systému odeslat pozvánku druhému rodiči nebo jiné oprávněné osobě (např. opatrovníkovi). Vstup druhého rodiče je zcela dobrovolný.  
8.2 Přijetím pozvánky získává druhý rodič přístup ke sdílenému kalendáři, záznamům o předávání dítěte a dohodám. Záznamy vložené do sdíleného prostoru jsou přístupné oběma stranám.  
8.3 Záznamy v CoParentHubu (předání, schválené výdaje, zprávy) podléhají neměnnému auditnímu logování (`CoParentAuditLog`) pro účely vyloučení dodatečné manipulace s historií. `[VERIFIED FROM CODE]`

---

## ČÁST VI: SPRÁVA PŘÍPADŮ, EVIDENCE DŮKAZŮ A UPLOAD DOKUMENTŮ

### 9. Vedení případové agendy (Case Management)
9.1 V rámci správy případu může Uživatel vést časovou osu řízení, evidovat jednání, lhůty, účastníky a poznámky k průběhu opatrovnického sporu. `[VERIFIED FROM CODE: clientCaseService.ts]`  
9.2 Data v tomto modulu jsou přísně soukromá a slouží výhradně pro osobní potřebu a přípravu Uživatele na jednání. Provozovatel do těchto záznamů nezasahuje ani je neposuzuje.

### 10. Bezpečné ukládání souborů a kontrola integrity
10.1 Uživatel může do trezoru dokumentů nahrávat soubory ve formátech PDF, DOCX či běžných obrazových formátech. Maximální velikost jednotlivého souboru činí [TO VERIFY: limit velikosti souboru v MB, např. 25 MB].  
10.2 Každý nahrávaný soubor je před uložením do privátního úložiště MinIO zkontrolován antivirovým systémem ClamAV. `[VERIFIED FROM CODE: clamAvService.ts, minioStorageService.ts]` Infikované soubory jsou okamžitě zablokovány a smazány.  
10.3 Uživatel nese plnou odpovědnost za obsah nahrávaných souborů a prohlašuje, že disponuje oprávněním tyto dokumenty zpracovávat a ukládat v souladu se zákonem o ochraně osobních údajů.

---

## ČÁST VII: NÁSTROJE ASISTIVNÍ UMĚLÉ INTELIGENCE (ORION & AI MODULY)

### 11. Povaha a omezení AI nástrojů
11.1 Portál integruje nástroje asistivní umělé inteligence (zejména konvertor zpráv BIFF, analyzátor rozsudků Judgment Parser a generátor konceptů podání). `[VERIFIED FROM CODE: aiRoutes.ts, judgmentParserService.ts]`  
11.2 **Asistivní AI není člověk, soudce ani advokát.** Výstupy generované AI jsou statistickými aproximacemi a jazykovými modely. Mohou obsahovat faktické, věcné, interpretační nebo právní nepřesnosti (tzv. halucinace).  
11.3 Uživatel je povinen **veškeré výstupy AI pečlivě zkontrolovat**, ověřit jejich věcnou správnost a porovnat je s reálným textem právních předpisů a rozsudků před jejich jakýmkoli použitím.  
11.4 Podrobné technické vymezení, způsoby filtrování dat a architektura AI jsou upraveny v samostatném dokumentu `07-AI-TRANSPARENCY-DRAFT.md` (AI Prohlášení a transparentnost).

---

## ČÁST VIII: DUŠEVNÍ VLASTNICTVÍ A LICENCE K OBSAHU

### 12. Autorská práva k Portálu
12.1 Veškeré prvky Portálu (grafické rozhraní, zdrojový kód, struktura databází, články, metodiky, šablony a vzory) jsou chráněny autorským právem Provozovatele a licenčních partnerů dle zákona č. 121/2000 Sb., autorský zákon.  
12.2 Uživatel získává nevýhradní, nepřenosnou a časově omezenou licenci k užívání Obsahu portálu výhradně pro svou **osobní, nekomerční potřebu** související s řešením své rodinné situace.  
12.3 Šíření, publikování, komerční přeprodej či hromadné strojové stahování vzorů a obsahu bez předchozího písemného souhlasu Provozovatele je zakázáno.

### 13. Práva k Uživatelskému obsahu
13.1 Vlastnická a autorská práva k Uživatelskému obsahu zůstávají Uživateli.  
13.2 Vložením Uživatelského obsahu do systému uděluje Uživatel Provozovateli bezúplatnou, územně neomezenou licenci výhradně v rozsahu nezbytném pro technické zajištění Služby (ukládání na serverech, antivirová kontrola, zálohování, šifrování a zobrazení v uživatelském rozhraní). Provozovatel není oprávněn Uživatelský obsah komerčně využívat ani poskytovat třetím stranám k trénování komerčních AI modelů. `[PROPOSED CLAUSE]`

---

## ČÁST IX: DOSTUPNOST SLUŽBY, ÚDRŽBA A BEZPEČNOSTNÍ INCIDENTY

### 14. Dostupnost a plánované odstávky
14.1 Služba je poskytována bezplatně. Provozovatel vyvíjí maximální úsilí k zajištění vysoké dostupnosti a integrity dat, avšak **negarantuje nepřetržitou 100% dostupnost** Portálu.  
14.2 Provozovatel si vyhrazuje právo na plánované i neplánované technické odstávky nezbytné pro údržbu systému, bezpečnostní aktualizace a zálohování. O plánovaných odstávkách delších než 2 hodiny bude Uživatel předem informován na úvodní stránce Portálu.

### 15. Reakce na bezpečnostní incidenty
15.1 V případě detekce kybernetického útoku, pokusu o neoprávněný průnik nebo zranitelnosti je Provozovatel oprávněn okamžitě omezit či přerušit provoz Portálu na dobu nezbytnou k odstranění hrozby.

---

## ČÁST X: MODERACE OBSAHU, POZASTAVENÍ A UKONČENÍ ÚČTU

### 16. Moderace a zásahy administrátorů
16.1 Provozovatel nemonitoruje soukromý obsah v privátních modulech (trezor dokumentů, soukromé poznámky).  
16.2 Ve veřejných a komunitních částech Portálu (fórum, komentáře) si Provozovatel vyhrazuje právo odstranit příspěvky, které porušují zákon, tyto Podmínky nebo obsahují vulgarity a nenávistné projevy.

### 17. Pozastavení (suspendace) a zrušení účtu Provozovatelem
17.1 V případě závažného nebo opakovaného porušení těchto Podmínek (zejména šíření malware, kybernetické útoky, obtěžování jiných uživatelů) je Provozovatel oprávněn:  
a) odeslat Uživateli výstrahu;  
b) dočasně pozastavit přístup k účtu (`status: SUSPENDED`);  
c) trvale zablokovat a zrušit uživatelský účet (`status: BANNED`). `[VERIFIED FROM CONFIG: AccountStatus v schema.prisma]`  
17.2 O uplatnění tohoto opatření bude Uživatel vyrozuměn e-mailem s uvedením důvodu, vyjma případů, kdy by toto vyrozumění mařilo vyšetřování trestné činnosti.

### 18. Zrušení účtu Uživatelem
18.1 Uživatel je oprávněn svůj účet kdykoli bez udání důvodu zrušit prostřednictvím nastavení profilu nebo zasláním požadavku dle postupu uvedeného v Zásadách ochrany osobních údajů.  
18.2 Před zrušením účtu má Uživatel možnost provést kompletní export svých dat ve strojově čitelném formátu JSON (`GET /api/gdpr/export-data`). `[VERIFIED FROM CODE: server.ts]`

---

## ČÁST XI: ODPOVĚDNOST ZA ŠKODU A ZÁKONNÉ LIMITY

### 19. Zákonné limity odpovědnosti
19.1 Vzhledem k tomu, že Služba je poskytována bezplatně a má výhradně edukační a technologický charakter, Provozovatel v souladu s § 2898 zákona č. 89/2012 Sb., občanský zákoník, neodpovídá za:  
a) nepřímé, náhodné či následné škody nebo ušlý zisk vzniklý v souvislosti s užíváním Portálu;  
b) výsledek jakéhokoli soudního, správního či opatrovnického řízení, v němž Uživatel použil vzory, kalkulace nebo informace z Portálu;  
c) škodu způsobenou neoprávněným zásahem třetí osoby v důsledku nedbalého nakládání Uživatele s jeho přihlašovacími údaji;  
d) škodu vzniklou v důsledku technických výpadků internetového připojení nebo služeb třetích stran (výpadky cloudu, e-mailových serverů).  
19.2 **Zákonná ochrana (Mandatory Rights):** Žádné ustanovení těchto Podmínek nevylučuje ani neomezuje odpovědnost Provozovatele za škodu způsobenou úmyslně nebo z hrubé nedbalosti, ani odpovědnost, kterou podle kogentních ustanovení českého práva na ochranu spotřebitele a občanského zákoníku nelze platně vyloučit. `[PROPOSED CLAUSE - SOULAD SE ZÁKONEM]`

---

## ČÁST XII: ZÁVĚREČNÁ USTANOVENÍ A ROZHODNÉ PRÁVO

### 20. Rozhodné právo a soudní příslušnost
20.1 Právní vztahy založené těmito Podmínkami se řídí výhradně právním řádem České republiky, zejména zákonem č. 89/2012 Sb., občanský zákoník.  
20.2 K řešení případných sporů mezi Uživatelem a Provozovatelem jsou příslušné obecné soudy České republiky místně příslušné podle sídla Provozovatele.  
20.3 Spotřebitel má právo na mimosoudní řešení spotřebitelského sporu (ADR) prostřednictvím České obchodní inspekce (ČOI, www.coi.cz).

### 21. Oddělitelnost ustanovení (Severability)
21.1 Je-li nebo stane-li se některé ustanovení těchto Podmínek neplatným, neúčinným nebo nevymahatelným, platnost a účinnost ostatních ustanovení zůstává nedotčena. Neplatné ustanovení bude nahrazeno platným ustanovením, jehož smysl se co nejvíce přibližuje původnímu záměru.

### 22. Změny Podmínek užívání
22.1 Provozovatel si vyhrazuje právo tyto Podmínky v přiměřeném rozsahu měnit (zejména z důvodu legislativních změn, rozvoje bezpečnostních standardů nebo zavedení nových funkcionalit).  
22.2 O změnách Podmínek bude Uživatel informován e-mailem a oznámením v rozhraní Portálu nejméně **14 dnů před nabytím jejich účinnosti**. V případě vydání nové MAJOR verze Podmínek bude Uživatel vyzván k jejich elektronickému potvrzení při příštím přihlášení. Nesouhlasí-li Uživatel se změnou, má právo před nabytím účinnosti smlouvu vypovědět a svůj účet smazat.

### 23. Kontaktní údaje
23.1 Provozovatele lze kontaktovat:  
- E-mailem: `[TO VERIFY: oficiální kontaktní e-mail, např. podpora@tatovacesta.cz]`  
- Datovou schránkou: `[TO VERIFY: ID datové schránky]`  
- Poštou na adrese sídla: `[TO VERIFY: adresa sídla]`
