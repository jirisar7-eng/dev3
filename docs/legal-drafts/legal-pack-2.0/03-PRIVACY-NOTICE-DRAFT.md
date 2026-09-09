# ZÁSADY OCHRANY OSOBNÍCH ÚDAJŮ (PRIVACY NOTICE)
**Kanonické ID:** `DOC-TMPR-PRIVACY-V2`  
**Klíč v systému:** `gdpr`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-09  
**Předchozí platná verze:** `v1.1.0` (ze dne 2026-09-09)  
**Právní rámec:** Nařízení Evropského parlamentu a Rady (EU) 2016/679 (GDPR) a zákon č. 110/2019 Sb., o zpracování osobních údajů.

---

## ℹ️ METODICKÉ UPOZORNĚNÍ
Tento dokument představuje splnění **informační povinnosti správce dle čl. 13 a čl. 14 GDPR**. Tento dokument **NENÍ souhlasem se zpracováním osobních údajů** a není jako souhlas koncipován. Zpracování osobních údajů probíhá primárně na základě jiných zákonných právních titulů (plnění smlouvy, plnění právní povinnosti, ochrana právních nároků a oprávněný zájem).

---

## OBSAH
- **ČÁST I: IDENTIFIKACE SPRÁVCE A KONTAKTNÍ ÚDAJE**
- **ČÁST II: KATEGORIE ZPRACOVÁVANÝCH OSOBNÍCH ÚDAJŮ**
- **ČÁST III: ZVLÁŠTNÍ KATEGORIE ÚDAJŮ (ČL. 9 GDPR) A RODINNÁ DATA**
- **ČÁST IV: PRÁVNÍ ZÁKLADY A ÚČELY ZPRACOVÁNÍ**
- **ČÁST V: PŘÍJEMCI, ZPRACOVATELÉ A EXTERNÍ TECHNOLOGIE**
- **ČÁST VI: PŘEDÁVÁNÍ ÚDAJŮ DO TŘETÍCH ZEMÍ (MIMO EU/EHP)**
- **ČÁST VII: DOBA UCHOVÁVÁNÍ ÚDAJŮ (RETENCE)**
- **ČÁST VIII: PRÁVA SUBJEKTŮ ÚDAJŮ A ZPŮSOB JEJICH UPLATNĚNÍ**
- **ČÁST IX: AUTOMATIZOVANÉ ROZHODOVÁNÍ A PROFILOVÁNÍ**
- **ČÁST X: TECHNICKÁ A ORGANIZAČNÍ BEZPEČNOSTNÍ OPATŘENÍ**

---

## ČÁST I: IDENTIFIKACE SPRÁVCE A KONTAKTNÍ ÚDAJE

### 1. Správce osobních údajů
1.1 Správcem osobních údajů zpracovávaných v rámci internetového portálu **Táta má právo** a platformy Synthesis OS je:  
**Provozovatel:** [TO VERIFY: identita budoucího provozovatele, např. zapsaný spolek či nadační fond]  
**IČO:** [TO VERIFY: IČO]  
**Sídlo:** [TO VERIFY: adresa sídla]  
**E-mail pro záležitosti ochrany osobních údajů:** [TO VERIFY: např. gdpr@tatovacesta.cz]  
**ID datové schránky:** [TO VERIFY: ID datové schránky]  
(dále jen „Správce“).

### 2. Pověřenec pro ochranu osobních údajů (DPO)
2.1 Správce s ohledem na rozsah a povahu zpracování [TO VERIFY: zda vzniká povinnost jmenovat DPO dle čl. 37 GDPR; pokud ne: „nejmenoval pověřence pro ochranu osobních údajů, neboť nesplňuje zákonné podmínky povinného jmenování. Veškeré dotazy vyřizuje pověřená odpovědná osoba Správce na výše uvedeném e-mailu.“].

---

## ČÁST II: KATEGORIE ZPRACOVÁVANÝCH OSOBNÍCH ÚDAJŮ

Správce zpracovává pouze osobní údaje nezbytné pro poskytování Služby v těchto kategoriích:

### 2.1 Identifikační a kontaktní údaje Uživatele
- E-mailová adresa (slouží jako primární identifikátor účtu). `[VERIFIED FROM CONFIG: User model]`
- Jméno a příjmení (případně uživatelské jméno).
- Heslo v kryptograficky hashované podobě (bcrypt). Plaintext heslo není nikdy ukládáno ani zpracováváno.
- Telefonní číslo a poštovní adresa (pokud je Uživatel dobrovolně vyplní v profilu pro účely předvyplňování soudních vzorů). `[VERIFIED FROM CONFIG: UserProfile model]`
- Externí identifikátory Google ID a Microsoft ID (při využití přihlášení přes OAuth). `[VERIFIED FROM CODE: oauthService.ts]`

### 2.2 Technické a přístupové údaje
- IP adresa zařízení a časové razítko přihlášení či provedení akce.
- Údaje o prohlížeči (User-Agent).
- Bezpečnostní kryptografická data: veřejné klíče a čítače Passkeys (FIDO2/WebAuthn), tajný klíč TOTP pro dvoufaktorové ověření. `[VERIFIED FROM CODE]`
- Transakční záznamy o akceptaci dokumentů v auditním logu (`UserConsentLog`).

### 2.3 Rodinná data a údaje o dětech (Uživatelský obsah)
- Jméno a příjmení dítěte, datum narození. `[VERIFIED FROM CODE: Child model]`
- Vzdělávací instituce (škola/školka), zájmové kroužky, praktický lékař, zdravotní pojišťovna.
- Rozvrh péče, záznamy v kalendáři střídání, záznamy o předávání dítěte, evidence mimořádných událostí.
- Evidence výdajů na potřeby dítěte (výše částky, účel, doklad o zaplacení).

### 2.4 Případová agenda a důkazní materiály
- Označení příslušného soudu, spisová značka (např. 0 P 123/2024), jméno soudce a referenta OSPOD. `[VERIFIED FROM CODE: clientCaseService.ts]`
- Listinné důkazy a dokumenty nahrávané Uživatelem (rozsudky, protokoly z jednání, návrhy, zprávy OSPOD, lékařské posudky, SMS/e-mailová komunikace).

---

## ČÁST III: ZVLÁŠTNÍ KATEGORIE ÚDAJŮ (ČL. 9 GDPR) A RODINNÁ DATA

### 3. Nakládání s citlivými údaji (čl. 9 GDPR)
3.1 Dokumenty nahrané Uživatelem v rámci trezoru dokumentů nebo poznámek k soudnímu sporu mohou obsahovat zvláštní kategorie osobních údajů ve smyslu čl. 9 odst. 1 GDPR, zejména:  
a) **údaje o zdravotním stavu** dítěte nebo rodičů (lékařské zprávy, záznamy o alergiích, očkování, diagnózách);  
b) **údaje o psychologickém stavu** (znalecké posudky z oboru psychologie a psychiatrie, zprávy z krizových center);  
c) **záznamy orgánů OSPOD a sociálních šetření**.

### 3.2 Právní titul pro uchovávání citlivých údajů
3.2 Správce tyto citlivé údaje neanalyzuje k vlastním účelům. Právním základem pro jejich technické uložení a zpracování v zabezpečeném trezoru Uživatele je:  
- **čl. 9 odst. 2 písm. f) GDPR** – zpracování je nezbytné pro **určení, výkon nebo obhajobu právních nároků** Uživatele v opatrovnickém či soudním řízení;  
- podpůrně **čl. 9 odst. 2 písm. a) GDPR** – výslovný souhlas Uživatele udělený při nahrání konkrétního dokumentu do osobního profilu. `[PROPOSED CLAUSE]`

### 3.3 Zvláštní bezpečnostní režim a PrivacyFilterService
3.3 Správce implementuje technické ochranné mechanismy zabraňující neoprávněnému úniku citlivých údajů:  
a) **Blokování odeslání do AI (Fail-Closed):** Služba `PrivacyFilterService` provádí heuristickou regex kontrolu textu před odesláním do jazykových modelů AI. Pokud text obsahuje indikátory zdravotních či psychiatrických údajů (`SPECIAL_CATEGORY_REGEX`), je volání AI okamžitě **zablokováno** s chybou `PRIVACY_BOUNDARY_BLOCKED`. `[VERIFIED FROM CODE: privacyFilterService.ts]`  
b) **Vymezení povahy pseudonymizace:** Pseudonymizační mechanismy systému nahrazují identifikátory (jména, rodná čísla, bankovní účty) zástupnými tokeny. Správce **výslovně upozorňuje, že se nejedná o absolutní matematickou anonymizaci (0-PII)**, nýbrž o ochrannou pseudonymizaci zmírňující rizika přenosu.

---

## ČÁST IV: PRÁVNÍ ZÁKLADY A ÚČELY ZPRACOVÁNÍ

| Účel zpracování | Kategorie údajů | Právní základ dle GDPR | Doba zpracování |
| :--- | :--- | :--- | :--- |
| **1. Poskytování Služby, vedení účtu, CoParentHub a trezor** | Identifikační, kontaktní, rodinná data, dokumenty | **Čl. 6 odst. 1 písm. b) GDPR** (plnění smlouvy o užívání) | Po dobu trvání uživatelského účtu |
| **2. Zpracování citlivých dat v trezoru kauzy** | Zdravotní data, posudky, rozsudky | **Čl. 9 odst. 2 písm. f) GDPR** (výkon právních nároků) | Po dobu trvání účtu nebo do smazání Uživatelem |
| **3. Zabezpečení sítě, audit a prevence útoků** | IP adresy, hash hesel, auditní logy přístupů | **Čl. 6 odst. 1 písm. f) GDPR** (oprávněný zájem Správce na bezpečnosti) | [TO VERIFY: retention period, např. 12 měsíců] |
| **4. Plnění zákonných povinností (účetnictví, archivy)** | Fakturační údaje (budou-li placené služby), záznamy sporů | **Čl. 6 odst. 1 písm. c) GDPR** (plnění právní povinnosti) | Dle daňových a archivačních zákonů (až 10 let) |
| **5. Vyřizování dotazů a podpora uživatelů** | E-mail, obsah zprávy | **Čl. 6 odst. 1 písm. f) GDPR** (oprávněný zájem na komunikaci) | 6 měsíců od vyřízení požadavku |
| **6. Výkon a obhajoba právních nároků Správce** | Smluvní dokumentace, záznamy o akceptaci | **Čl. 6 odst. 1 písm. f) GDPR** (oprávněný zájem na právní obraně) | Po dobu promlčecích lhůt (3–10 let) |

---

## ČÁST V: PŘÍJEMCI, ZPRACOVATELÉ A EXTERNÍ TECHNOLOGIE

Správce nepředává osobní údaje žádným třetím stranám pro marketingové či komerční účely. Údaje jsou zpřístupněny výhradně těmto prověřeným zpracovatelům zajišťujícím technologický provoz:

1. **Poskytovatel serverové infrastruktury (Hosting & VPS):**  
   - [TO VERIFY: konkrétní hosting provider, např. Hetzner Online GmbH / OVHcloud / Google Cloud]. Území zpracování: Evropská unie.
2. **Úložiště souborů (Object Storage):**  
   - Self-hosted instance MinIO provozovaná v privátní infrastruktuře Správce. `[VERIFIED FROM CODE: minioStorageService.ts]`
3. **E-mailová a poštovní infrastruktura:**  
   - Self-hosted Mailcow / dedikovaný SMTP server pro odesílání transakčních zpráv. `[VERIFIED FROM CODE: emailService.ts, mailcowService.ts]`
4. **Poskytovatelé asistivních AI modelů (zpracování textu konceptů a rozsudků):**  
   - **Google LLC / Google Ireland Ltd.** (modely Google Gemini via Gemini API).
   - **Groq Inc.** (modely Llama via Groq API).
   - **xAI Corp.** (modely Grok via xAI API). `[VERIFIED FROM CODE: AiService.ts]`  
   *Upozornění:* Data jsou do AI modelů odesílána výhradně v okamžiku, kdy Uživatel sám aktivuje funkci vyžadující AI (např. BIFF konverze, parsování rozsudku).
5. **Mapové podklady:**  
   - OpenStreetMap / Leaflet (zobrazení map bez sledování uživatelů). `[VERIFIED FROM CODE]`
6. **Státní registry a veřejné orgány:**  
   - Přístup k veřejným registrům ARES (Ministerstvo financí ČR) a e-Sbírka (Ministerstvo vnitra ČR / DIA) probíhá výhradně formou serverových dotazů; data uživatelů nejsou těmto registrům předávána. `[VERIFIED FROM CODE: EsbirkaService.ts, ares.ts]`

---

## ČÁST VI: PŘEDÁVÁNÍ ÚDAJŮ DO TŘETÍCH ZEMÍ (MIMO EU/EHP)

6.1 Primární servery, databáze PostgreSQL i souborové úložiště MinIO se nacházejí **výhradně na území Evropské unie**.  
6.2 V případě využití služeb asistivní umělé inteligence (Google, Groq, xAI) může docházet k přenosu dat na servery umístěné ve Spojených státech amerických. Tento přenos je právně zajištěn:  
a) účastí dodavatelů v rámci **EU-U.S. Data Privacy Frameworku**;  
b) uzavřením **Standardních smluvních doložek (SCC)** schválených Evropskou komisí ve smyslu čl. 46 odst. 2 písm. c) GDPR. `[LEGAL RESEARCH REQUIRED: ověřit aktuální certifikaci DPF u xAI a Groq]`  
6.3 Před předáním dat do AI dochází k uplatnění ochranného pseudonymizačního filtru `PrivacyFilterService`.

---

## ČÁST VII: DOBA UCHOVÁVÁNÍ ÚDAJŮ (RETENCE)

7.1 **Aktivní účet:** Údaje jsou zpracovávány po celou dobu existence uživatelského účtu.  
7.2 **Smazání účtu:** Po zrušení účtu Uživatelem nebo na základě vyřízené žádosti o výmaz (`POST /api/gdpr/deletion-request`) jsou veškeré osobní údaje, soubory, vazby na děti a případy z databáze a úložiště MinIO nenávratně odstraněny (kaskádový výmaz). `[VERIFIED FROM CODE: server.ts, schema.prisma]`  
7.3 **Výjimky z výmazu:** Správce si ponechává pouze anonymizované systémové statistiky a transakční záznamy o udělených souhlasech a bezpečnostních auditech po dobu nezbytnou k ochraně právních nároků (promlčecí doba 3 roky dle občanského zákoníku).

---

## ČÁST VIII: PRÁVA SUBJEKTŮ ÚDAJŮ A ZPŮSOB JEJICH UPLATNĚNÍ

Každý Uživatel má podle čl. 15 až 22 GDPR tato zákonná práva:

8.1 **Právo na přístup k údajům (čl. 15 GDPR):** Právo získat potvrzení, zda Správce osobní údaje zpracovává, a právo na kopii těchto údajů.  
8.2 **Právo na opravu (čl. 16 GDPR):** Právo na bezodkladnou opravu nepřesných nebo doplnění neúplných údajů v nastavení profilu.  
8.3 **Právo na výmaz („právo být zapomenut“, čl. 17 GDPR):** Právo na smazání údajů, pokud pominul účel zpracování nebo Uživatel odvolal souhlas.  
8.4 **Právo na přenositelnost údajů (čl. 20 GDPR):** Uživatel může kdykoli využít automatizovanou funkci Portálu pro přímé stažení veškerých svých dat ve strukturovaném, běžně používaném a strojově čitelném formátu JSON prostřednictvím endpointu `GET /api/gdpr/export-data`. `[VERIFIED FROM CODE: server.ts]`  
8.5 **Právo na omezení zpracování (čl. 18 GDPR):** Právo požadovat dočasné omezení zpracování v případě sporu o přesnost dat.  
8.6 **Právo vznést námitku (čl. 21 GDPR):** Právo vznést námitku proti zpracování založenému na oprávněném zájmu Správce.  
8.7 **Právo podat stížnost u dozorového úřadu:** Uživatel má právo podat stížnost u příslušného dozorového úřadu, kterým je v České republice:  
**Úřad pro ochranu osobních údajů (ÚOOÚ)**  
Adresa: Pplk. Sochora 27, 170 00 Praha 7  
Web: [https://www.uoou.cz](https://www.uoou.cz)  
Telefon: +420 234 665 111

---

## ČÁST IX: AUTOMATIZOVANÉ ROZHODOVÁNÍ A PROFILOVÁNÍ

9.1 Správce **neprovádí žádné automatizované individuální rozhodování ani profilování** ve smyslu čl. 22 GDPR, které by mělo pro Uživatele právní účinky nebo se jej obdobným způsobem významně dotýkalo.  
9.2 Veškeré návrhy, klasifikace rozsudků nebo doporučení generovaná Asistivní AI mají výhradně podpůrnou povahu a konečné rozhodnutí náleží vždy lidskému Uživateli.

---

## ČÁST X: TECHNICKÁ A ORGANIZAČNÍ BEZPEČNOSTNÍ OPATŘENÍ

Správce zavedl následující technická a organizační opatření k zajištění integrity a důvěrnosti dat:
1. **Šifrování přenosu:** Veškerá komunikace s Portálem probíhá přes zabezpečený protokol HTTPS s vynuceným TLS 1.3/1.2 a HSTS.
2. **Kryptografické zabezpečení přístupu:** Hashování hesel pomocí `bcrypt`, podpora vícefaktorové autentizace (TOTP) a hardwarových tokenů/Passkeys (FIDO2).
3. **Role-Based Access Control (RBAC):** Přísné oddělení přístupových oprávnění; administrátoři nemají přístup k dešifrovanému soukromému obsahu uživatelských trezorů. `[VERIFIED FROM CODE]`
4. **Antivirová ochrana souborů:** Každý nahraný soubor je před uložením do úložiště MinIO skenován systémem ClamAV v operační paměti. `[VERIFIED FROM CODE: clamAvService.ts]`
5. **Oddělení nájemců (Tenant Isolation):** Data spolurodičovských prostorů jsou izolována na úrovni aplikační a databázové logiky; uživatel se nemůže dostat k záznamům jiné rodiny.
6. **Auditování:** Zaznamenávání veškerých přístupů k citlivým funkcím do neměnného auditního protokolu.
