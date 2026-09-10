# TECHNICKÝ A PRÁVNÍ AUDIT: OPRAVA IDENTITY SOUČASNÉHO PROVOZOVATELE V DRAFTECH LEGAL PACK 2.0

**Dokument ID:** `TMPR-AUDIT-LEGAL-020-20260910`  
**Datum provedení:** 2026-09-10  
**Příkaz:** `TMPR-20260910-LEGAL-020 (CORRECT_CURRENT_OPERATOR_LEGAL_IDENTITY)`  
**Nadřazený příkaz:** `TMPR-20260909-LEGAL-019`  
**Prostředí:** DEV3  
**Režim:** LEGAL_DOCUMENTATION_ONLY  
**Auditor:** Hlavní architekt & Senior Full-Stack DevSecOps / QA Auditor ekosystému Synthesis  

---

## 1. VÝCHOZÍ STAV A AUTORITATIVNÍ PRODUKTOVÝ FAKT

V dřívější iteraci pracovních návrhů Legal Pack 2.0 (`docs/legal-drafts/legal-pack-2.0/`) byly v identifikačních polích provozovatele použity placeholdery předpokládající existenci právnické osoby či zapsaného spolku (např. `[TO VERIFY: identita budoucího provozovatele, např. Táta má právo, z.s.]`, IČO, adresa sídla, spisová značka veřejného rejstříku, statutární orgán).

### Autoritativní právní a produktový fakt:
1. **Současným provozovatelem projektu Táta má právo NENÍ spolek, zapsaný spolek, společnost ani jiná právnická osoba.**
2. **Projekt v současnosti provozuje výhradně:**
   **Jiří Šár**, jako fyzická osoba.
3. **Založení zapsaného spolku je pouze BUDOUCÍ ZÁMĚR (`[PRODUCT INTENT — FUTURE]`).**
   Spolek v současné době neexistuje, není založen ani zapsán ve spolkovém rejstříku, nemá IČO, nemá sídlo jako právnická osoba, nemá statutární orgán a **nesmí být v žádném veřejném právním dokumentu prezentován jako současný provozovatel, správce osobních údajů nebo smluvní strana.**
4. **Zákaz vymýšlení osobních údajů:** Nebyla doplňována ani odhadována žádná soukromá data fyzické osoby (soukromá adresa bydliště, rodné číslo, datum narození, telefon, bankovní spojení).

---

## 2. PŘEHLED PROVEDENÝCH ZMĚN V JEDNOTLIVÝCH DOKUMENTECH

Všech 10 dotčených souborů ve složce `docs/legal-drafts/legal-pack-2.0/` bylo zkontrolováno a upraveno:

### 1. `00-LEGAL-FACTS-INVENTORY.md` (Technická a právní inventura faktů)
- Sekce 1 (*Provozovatel / Operator Identity*) byla kompletně přeformulována.
- Autoritativně zakotven současný ověřený stav: Provozovatelem je **Jiří Šár, fyzická osoba**.
- Explicitně deklarováno, že provozovatel nemá statutární orgán, IČO ani sídlo právnické osoby.
- Označeno metodickou značkou `[LEGAL RESEARCH REQUIRED: determine mandatory operator identification for current natural-person operating model]` pro advokátní posouzení povinného identifikačního minima nepodnikající fyzické osoby dle zákona č. 480/2004 Sb. a GDPR.
- Případné budoucí založení spolku striktně izolováno jako `[PRODUCT INTENT — FUTURE]`.

### 2. `01-LEGAL-PACK-ARCHITECTURE.md` (Architektura balíčku)
- Definice bodu 2 (*Provozovatel*) sjednocena na: **Jiří Šár, fyzická osoba** (`[LEGAL RESEARCH REQUIRED]`), s poznámkou, že budoucí zastřešení spolkem je dosud neuskutečněný záměr (`[PRODUCT INTENT — FUTURE]`).

### 3. `02-TERMS-OF-USE-DRAFT.md` (Podmínky užívání / ToS)
- V Článku 1.2 (*Provozovatel Portálu*) odstraněny neexistující položky (IČO, sídlo právnické osoby, zápis v rejstříku).
- Provozovatel identifikován jako: **Jiří Šár, fyzická osoba**.
- Doplněna explicitní organizační poznámka `[PRODUCT INTENT — FUTURE]` vysvětlující, že spolek zatím neexistuje a není smluvní stranou.
- V Článku 43.2 opravena sudiště klauzule: spory jsou příslušné podle obecného soudu Provozovatele (fyzické osoby), nikoli „podle sídla“.

### 4. `03-PRIVACY-NOTICE-DRAFT.md` (Zásady ochrany osobních údajů / GDPR)
- V Článku 1.1 (*Správce osobních údajů*) upraveno na: **Jiří Šár, fyzická osoba**.
- Odstraněna pole IČO, sídlo a statutární orgán.
- Doplněna poznámka k budoucímu záměru `[PRODUCT INTENT — FUTURE]`.
- V Článku 2.2 nahrazeno slovní spojení „statutární orgán Správce“ za formulaci „přímo Správce (Jiří Šár) a pověřený compliance tým“.

### 5. `04-COOKIE-POLICY-DRAFT.md` (Zásady používání cookies)
- V Článku 1.2 (*Správce*) identifikován správce jako: **Jiří Šár, fyzická osoba** (`[LEGAL RESEARCH REQUIRED]`).
- Odstraněn placeholder pro spolek, IČO a sídlo; připojena poznámka `[PRODUCT INTENT — FUTURE]`.

### 6. `05-LEGAL-DISCLAIMER-DRAFT.md` (Právní výhrada)
- V Článku 1.2 (*Provozovatel*) ukotven provozovatel jako: **Jiří Šár, fyzická osoba** (`[LEGAL RESEARCH REQUIRED]`).
- Odstraněny fiktivní korporátní údaje, doplněna poznámka `[PRODUCT INTENT — FUTURE]`.

### 7. `06-VOLUNTEER-CODE-DRAFT.md` (Etický kodex dobrovolníka)
- Prověřeny všechny sekce: Provozovatel vystupuje výhradně v pozici zřizovatele a garanta, bez přítomnosti korporátních či spolkových nepravd. Reference na ČAK a zapsané mediátory jsou věcně správné.

### 8. `07-AI-TRANSPARENCY-DRAFT.md` (AI Prohlášení dle EU AI Act)
- Prověřeno: Vystupuje obecný pojem „Provozovatel portálu Táta má právo“ a „Správce“ v plném souladu s fyzickou osobou Jiří Šár.

### 9. `08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md` (Smlouva o dobrovolné spolupráci)
- V Části I (*Smluvní strany*) nahrazen budoucí spolek:
  - Smluvní strana 1: **Jiří Šár, fyzická osoba**.
  - Odstraněny kolonky IČO, sídlo, zápis v rejstříku a zastoupení statutárem.
  - Doplněna klauzule právního nástupnictví: Případný budoucí přechod práv a povinností na nově založený spolek bude vyžadovat písemný dodatek nebo novou smlouvu s výslovným souhlasem dobrovolníka.
- V Článku 18.2 opravena místní příslušnost soudu podle bydliště / působiště Provozovatele.
- V Části XIII upraven podpisový blok: Za Provozovatele podepisuje **Jiří Šár, fyzická osoba**.

### 10. `09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md` (Křížová matice konzistence)
- V Části IV, bodě 4 sjednocen pojem Provozovatel / Správce na fyzickou osobu **Jiří Šár, fyzická osoba** a vyloučeny veškeré předpoklady existence spolku v současném stavu.

### 11. `10-PRE-PUBLICATION-LEGAL-REVIEW.md` (Předpublikační checklist)
- Bod **P0-1** upraven: Odstraněny předpoklady o existenci právnické osoby; kontrolní bod přeformulován na dokončení právní rešerše identifikačního minima nepodnikající fyzické osoby dle zákona č. 480/2004 Sb. a GDPR.
- Bod **P3-1** (Akreditace dobrovolnické služby) podmíněn existencí PO a označen jako budoucí záměr (`[PRODUCT INTENT — FUTURE]`).
- V podpisovém protokolu (Sign-off sheet) nahrazen „Statutární zástupce Provozovatele“ za **„Provozovatel (Fyzická osoba): Jiří Šár“**.

### 12. `README.md` (Manifest a metodický manuál)
- Aktualizován bod 5 a seznam metodických placeholderů na `[LEGAL RESEARCH REQUIRED: determine mandatory operator identification for current natural-person operating model]` a `[PRODUCT INTENT — FUTURE]`.

---

## 3. OVĚŘENÍ DODRŽENÍ BEZPEČNOSTNÍCH A PRODUKTOVÝCH MANTINELŮ

| Požadavek | Stav | Poznámka / Důkaz |
| :--- | :---: | :--- |
| **Zákaz uvádět spolek jako současného provozovatele** | ✅ DODRŽENO | Spolek se v žádném normativním ustanovení nevyskytuje jako současný subjekt. |
| **Převedení spolku do budoucího záměru** | ✅ DODRŽENO | Všude označeno jako `[PRODUCT INTENT — FUTURE]`. |
| **Zákaz vymýšlení osobních údajů** | ✅ DODRŽENO | Nevygenerována žádná fiktivní rodná čísla, adresy bydliště ani telefony. |
| **Zákaz zásahu do zdrojového kódu a DB** | ✅ DODRŽENO | Žádný soubor v `src/**`, `server.ts`, `prisma/**` nebyl dotčen. |
| **Zákaz zásahu do publikovaných dokumentů** | ✅ DODRŽENO | Žádný publikovaný dokument (`PUBLISHED` v1.0.0 / v1.1.0) nebyl změněn. |
| **Konzistence celého Legal Packu 2.0** | ✅ DODRŽENO | Všechny dokumenty 00 až 10 a README jsou v 100% shodě. |

---

## 4. OTEVŘENÉ PRÁVNÍ BODY K ROZHODNUTÍ (LEGAL COUNSEL GATES)

Před přechodem dokumentů ze stavu `DRAFT` do stavu `PUBLISHED` zbývá dořešit následující body:

1. **Právní posouzení identifikačního minima FO:**  
   Stanovit s advokátní kanceláří přesný rozsah identifikačních údajů fyzické osoby poskytující bezúplatnou digitální informační službu (jméno, příjmení, případně kontaktní doručovací adresa) s ohledem na ochranu soukromí dle GDPR a § 5 zákona č. 480/2004 Sb.
2. **Rozhodnutí o veřejné doručovací adrese:**  
   Rozhodnout, zda bude zřízen P.O. Box, virtuální sídlo / doručovací adresa, nebo zda bude komunikace primárně vedena elektronicky (e-mail, ID datové schránky fyzické osoby).
3. **Případný budoucí převod na zapsaný spolek:**  
   V okamžiku, kdy bude zapsaný spolek reálně založen a zapsán do spolkového rejstříku (získá IČO a sídlo), bude vyhotovena nová číslovaná revize právního balíčku (např. v2.1.0 či v3.0.0), která nahradí fyzickou osobu novým právním subjektem.

---

*Konec technického a právního auditu TMPR-AUDIT-LEGAL-020-20260910*
