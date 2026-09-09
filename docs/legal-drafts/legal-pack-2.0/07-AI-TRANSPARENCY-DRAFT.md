# PROHLÁŠENÍ O VYUŽÍVÁNÍ UMĚLÉ INTELIGENCE A TRANSPARENTNOSTI (AI TRANSPARENCY NOTICE)
**Kanonické ID:** `DOC-TMPR-AI-TRANSPARENCY-V2`  
**Klíč v systému:** `ai_statement`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-09  
**Předchozí platná verze:** `v1.0.0` (ze dne 2026-01-01)  
**Právní rámec:** Nařízení Evropského parlamentu a Rady (EU) 2024/1689 (Akt o umělé inteligenci / EU AI Act), zejména čl. 50 (informační povinnost a transparentnost systémů AI), Nařízení (EU) 2016/679 (GDPR), čl. 13 a 22.

---

## OBSAH
- **ČÁST I: ZÁKLADNÍ PROHLÁŠENÍ A EVROPSKÝ RÁMEC PRO AI (EU AI ACT)**
- **ČÁST II: ARCHITEKTURA ASISTIVNÍCH MODELŮ A POSKYTOVATELÉ**
- **ČÁST III: ORION – AUTOMATIZOVANÁ AI ENTITA A BEZPEČNOSTNÍ ANALYTIK**
- **ČÁST IV: SPECIALIZOVANÉ NÁSTROJE: BIFF, PARSER ROZSUDKŮ A SIMULÁTOR**
- **ČÁST V: OCHRANA SOUKROMÍ, PSEUDONYMIZACE A PRIVACY FILTER**
- **ČÁST VI: RIZIKO HALUCINACÍ, NEPŘESNOSTÍ A METODICKÉ LIMITY**
- **ČÁST VII: PRINCIP LIDSKÉHO DOHLEDU (HUMAN-IN-THE-LOOP) A ZÁKAZ AUTOMATIZOVANÉHO ROZHODOVÁNÍ**
- **ČÁST VIII: PRÁVA UŽIVATELE VE VZTAHU K AI VÝSTUPŮM**

---

## ČÁST I: ZÁKLADNÍ PROHLÁŠENÍ A EVROPSKÝ RÁMEC PRO AI (EU AI ACT)

### 1. Transparentnost a splnění čl. 50 EU AI Act
1.1 V souladu s čl. 50 Nařízení (EU) 2024/1689 (EU AI Act) Provozovatel tímto výslovně a srozumitelně informuje Uživatele, že **určité funkce Portálu využívají systémy umělé inteligence (AI)** založené na velkých jazykových modelech (LLM) a strojovém učení.  
1.2 Kdykoli Uživatel komunikuje s modulem AI, generuje návrhy dokumentů nebo využívá asistenta komunikace, **komunikuje se softwarovým systémem, nikoli s člověkem**.  
1.3 Nástroje AI na Portálu jsou klasifikovány jako podpůrné systémy s minimálním až omezeným rizikem ve smyslu EU AI Act, jejichž účelem je jazyková syntéza, strukturální úprava textu a vyhledávání v právních textech. Portál **nevyužívá žádné zakázané praktiky AI** (žádné sociální skórování, podprahovou manipulaci ani biometrickou identifikaci na dálku).

---

## ČÁST II: ARCHITEKTURA ASISTIVNÍCH MODELŮ A POSKYTOVATELÉ

### 2. Multi-provider infrastruktura s automatickou odolností (Resilience)
2.1 Portál nevyvíjí vlastní základové (foundational) modely, nýbrž využívá technologická rozhraní (API) předních světových poskytovatelů. Backendový systém `AiService` implementuje automatickou failover architekturu: `[VERIFIED FROM CODE: AiService.ts]`  
a) **Primární poskytovatel:** Google Gemini API (modely `gemini-3.6-flash` a související);  
b) **Záložní poskytovatel 1:** Google Gemini Secondary instance (redundantní klíč);  
c) **Záložní poskytovatel 2:** xAI Grok API (modely `grok-2-1212`);  
d) **Záložní poskytovatel 3:** Groq Cloud API (open-weight model `llama-3.3-70b-versatile`).

### 3. Zpracování dat poskytovateli AI (Data Retention & Training)
3.1 Volání modelů probíhá výhradně prostřednictvím **placených komerčních enterprise API rozhraní**.  
3.2 Na základě oficiálních smluvních podmínek enterprise API (Google Cloud Vertex / GenAI Terms, Groq Enterprise Terms) **nejsou vstupy (prompty) ani vygenerované výstupy poskytovateli využívány k trénování ani vylepšování veřejných AI modelů**. `[LEGAL RESEARCH REQUIRED: ověřit doplňková DPA k enterprise kontraktům]`

---

## ČÁST III: ORION – AUTOMATIZOVANÁ AI ENTITA A BEZPEČNOSTNÍ ANALYTIK

### 4. Vymezení identity a role Oriona
4.1 V rámci technologické platformy Synthesis OS vystupuje řízená softwarová entita označená jako **Orion** (systémový identifikátor `agent-orion-qa-v1`). `[VERIFIED FROM CODE: orionService.ts]`  
4.2 **ORION NENÍ ČLOVĚK.** Orion je automatizovaný AI Security Analyst, QA auditor a asistent správy systému.  
4.3 **Práva a bezpečnostní limity Oriona:**  
a) Orion nepředstavuje bezpečnostní autoritu a nepodléhá výjimkám z bezpečnostních pravidel.  
b) Jeho pravomoci jsou striktně omezeny principem Least Privilege a průnikem rolí: Orion **nikdy nemůže disponovat vyššími oprávněními než přihlášený Uživatel**. `[VERIFIED FROM CODE]`  
c) Orion nemá přístup k neomezenému shellu serveru (VPS) a veškeré jeho operace podléhají schvalovacímu Policy Engine a auditování.

---

## ČÁST IV: SPECIALIZOVANÉ NÁSTROJE: BIFF, PARSER ROZSUDKŮ A SIMULÁTOR

### 5. Konvertor zpráv metodikou BIFF
5.1 Nástroj pro úpravu komunikace (`/api/ai/biff-convert`) pomáhá rodičům přeformulovat zprávy určené druhému rodiči tak, aby odpovídaly metodice **BIFF** (Brief, Informative, Friendly, Firm – Stručně, Informativně, Přátelsky, Pevně).  
5.2 Nástroj odstraňuje emočně zabarvené výrazy, výčitky a provokace, a soustředí se na věcná fakta (např. čas a místo předání dítěte, výše úhrady za kroužek).

### 6. Analyzátor rozsudků (Judgment Parser)
6.1 Modul `JudgmentParserService` analyzuje texty anonymizovaných rozsudků opatrovnických soudů. `[VERIFIED FROM CODE: judgmentParserService.ts]`  
6.2 Provádí deterministickou a asistovanou extrakci výroků o svěření do péče, rozsahu styku a výši výživného pro potřeby statistického přehledu a judikaturní databáze.

### 7. Tréninkový simulátor opatrovnických situací
7.1 Modul simulátoru (`/api/ai/simulator`) umožňuje Uživateli vyzkoušet si v bezpečném prostředí modelové situace (např. jednání u opatrovnického soudu, rozhovor s pracovníkem OSPOD).  
7.2 Simulátor slouží výhradně k psychologické přípravě a snížení stresu rodiče; reakce virtuálního soudce či sociálního pracovníka v simulátoru neodrážejí a nemohou předvídat skutečné chování reálných osob v jednací síni.

---

## ČÁST V: OCHRANA SOUKROMÍ, PSEUDONYMIZACE A PRIVACY FILTER

### 8. Filtrování citlivých údajů před odesláním do AI
8.1 Provozovatel implementoval do backendového kódu dedikovaný bezpečnostní mechanismus `PrivacyFilterService`. `[VERIFIED FROM CODE: privacyFilterService.ts]`  
8.2 **Fail-Closed ochrana zdravotních dat (čl. 9 GDPR):** Pokud systém v textu odesílaném do AI detekuje výrazy indikující diagnózy, lékařské zprávy, psychofarmaka či zdravotní postižení (`SPECIAL_CATEGORY_REGEX`), **zpracování AI je okamžitě zastaveno a požadavek je zamítnut**. Uživatel je vyzván k ručnímu odstranění zdravotních údajů.  
8.3 **Pseudonymizační filtr PII:** Běžné identifikátory (jména, data narození, rodná čísla, bankovní účty, e-maily, telefonní čísla) jsou před odesláním do externího rozhraní AI nahrazeny náhodnými tokeny (např. `[RODNE_CISLO_1]`, `[BANKOVNI_UCET_1]`). Po obdržení jazykové odpovědi provede server zpětné dosazení původních hodnot do textu zobrazeného Uživateli.  
8.4 **Pravdivé vymezení ochrany:** Správce výslovně prohlašuje, že **se nejedná o matematicky garantovanou nulovou stopu (0-PII) ani kryptografickou anonymizaci**, ale o heuristickou ochranu významně snižující expozici osobních dat.

---

## ČÁST VI: RIZIKO HALUCINACÍ, NEPŘESNOSTÍ A METODICKÉ LIMITY

### 9. Varování před limity generativní umělé inteligence
9.1 Generativní jazykové modely pracují na statistickém principu odhadu nejpravděpodobnějšího následujícího slova. **Modely nerozumí právu v lidském slova smyslu.**  
9.2 Při využití výstupů AI existují tato inherentní rizika:  
a) **Právní halucinace:** Model si může vymyslet číslo zákona, neexistující paragraf, fiktivní rozhodnutí Ústavního soudu nebo nesprávně spojit různé právní instituty;  
b) **Časová neaktuálnost:** Model nemusí reflektovat nejnovější novely zákonů;  
c) **Faktické zkreslení:** Model může pozměnit smysl skutkových tvrzení uvedených Uživatelem;  
d) **Nevhodnost pro soud:** Text vytvořený AI bez lidské úpravy může působit neautenticky, strojově a může oslabit věrohodnost rodiče před soudem.

---

## ČÁST VII: PRINCIP LIDSKÉHO DOHLEDU (HUMAN-IN-THE-LOOP) A ZÁKAZ AUTOMATIZOVANÉHO ROZHODOVÁNÍ

### 10. Zákaz plně autonomního rozhodování
10.1 Portál striktně uplatňuje princip **člověka v řízení (Human-in-the-Loop)**. Žádná akce vygenerovaná AI není v systému provedena automaticky bez výslovného lidského potvrzení.  
10.2 Žádný výstup Asistivní AI **nepředstavuje automatizované individuální rozhodování ve smyslu čl. 22 GDPR**. AI nerozhoduje o právech ani povinnostech Uživatele.

---

## ČÁST VIII: PRÁVA UŽIVATELE VE VZTAHU K AI VÝSTUPŮM

### 11. Uživatelská kontrola
11.1 Uživatel má plné právo:  
a) **odmítnout využití AI nástrojů** a vyplňovat veškeré formuláře a texty ručně;  
b) **libovolně editovat, upravovat nebo zcela smazat** jakýkoli návrh vytvořený AI;  
c) vyžádat si informace o tom, který externí model byl k dané úloze využit.  
11.2 **Konečná odpovědnost:** Za konečné znění jakéhokoli podání, dopisu či návrhu doručovaného soudu, OSPOD nebo druhému rodiči nese **výhradní osobní odpovědnost Uživatel**.
