# KŘÍŽOVÁ MATICE KONZISTENCE A ELIMINACE ROZPORŮ (CONSISTENCY MATRIX)
**Dokument ID:** `TMPR-MATRIX-CONSISTENCY-2.0-20260909`
**Projekt:** Táta má právo / Synthesis OS
**Status:** `STATUS: WORKING DRAFT AUDIT & CONSISTENCY REVIEW`
**Datum:** 2026-09-09
**Verze balíčku:** `Legal Pack 2.0.0-DRAFT`

---

## I. ÚČEL MATICE KONZISTENCE
Tento dokument slouží jako formální ověřovací nástroj pro zajištění absolutní vnitřní bezrozpornosti celého souboru právní dokumentace Legal Pack 2.0. Identifikuje klíčová témata prostupující více dokumenty, mapuje jejich přesné znění a garantuje, že žádné ustanovení jednoho dokumentu nepopírá ani neoslabuje ustanovení dokumentu jiného.

---

## II. PŘEHLED KLÍČOVÝCH NORMORAMŮ A KŘÍŽOVÝCH VAZEB

| Tématický okruh | Terms of Use (02) | Privacy Notice (03) | Cookie Policy (04) | Legal Disclaimer (05) | Volunteer Code (06) | AI Transparency (07) | Volunteer Agreement (08) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Identita Provozovatele** | Smluvní strana (Čl. I) | Správce údajů (Čl. I) | Provozovatel (Čl. I) | Subjekt výhrady (Čl. I) | Zřizovatel (Část I) | Provozovatel AI (Čl. I) | Smluvní strana (Záhlaví) |
| **Vyloučení právních služeb** | Čl. II (3.1) | N/A | N/A | Část I (1.2, 1.3) | Část IV (4.1, 4.2) | N/A | Článek IV (4.1, 4.2) |
| **Absence advokátního tajemství** | Čl. II (3.3) | Čl. III (3.2) | N/A | Část II (2.2) | Část V (5.1) | N/A | Článek VI (6.3) |
| **Nejlepší zájem dítěte** | Čl. V (7.1) | Čl. II (2.3) | N/A | Část IV (4.2) | Část II (2.1) | N/A | Článek III (3.1b) |
| **Povaha Asistivní AI** | Čl. VII (11.1–11.3) | Čl. V (4), Čl. IX | N/A | Část VI (6.1–6.3) | N/A | Část I–VIII | N/A |
| **Limity pseudonymizace (0-PII)** | N/A | Čl. III (3.3b) | N/A | N/A | N/A | Část V (8.4) | N/A |
| **Cookies & Úložiště** | Čl. III (5.1) | Čl. II (2.2) | Část I–VI | N/A | N/A | N/A | N/A |
| **Technologie a úložiště (MinIO)** | Čl. VI (10.2) | Čl. V (2) | N/A | N/A | N/A | N/A | N/A |
| **Antivirová kontrola (ClamAV)** | Čl. VI (10.2) | Čl. X (4) | N/A | N/A | N/A | N/A | N/A |
| **Zákonné limity odpovědnosti** | Čl. XI (19.1, 19.2) | N/A | N/A | Část IX (10.1, 10.2) | N/A | Část VIII (11.2) | N/A |
| **Mechanismus akceptace** | Čl. I (1.4) | Informační plnění | Volba v liště | Metodická výhrada | Potvrzení rolí | Informační plnění | Článek X (10.2b) |
| **Rozhodné právo (ČR)** | Čl. XII (20.1) | GDPR + ZOOÚ | ZEK + GDPR | Občanský zákoník | Etický rámec | EU AI Act | Článek X (10.1) |

---

## III. ROZBOR A ODSTRANĚNÍ DŘÍVĚJŠÍCH ROZPORŮ ZE STARŠÍCH VERZÍ (V1.0.0 / V1.1.0)

Během přípravy Legal Packu 2.0 byly detailně analyzovány dřívější texty v1.0.0 a v1.1.0 a byly odstraněny tyto podstatné nedostatky a právní rizika:

### 1. Rozpor v povaze Privacy Notice (Zásady ochrany osobních údajů)
- **Stav ve v1.0.0:** V dřívějším UI byla Privacy Notice prezentována společně s Terms of Use s požadavkem na „souhlas se zásadami ochrany osobních údajů“.
- **Oprava v Legal Packu 2.0:** Zásady jsou v `03-PRIVACY-NOTICE-DRAFT.md` striktně koncipovány jako **jednostranné plnění informační povinnosti dle čl. 13 a 14 GDPR**. Uživatel bere zpracování na vědomí, neboť právním titulem je plnění smlouvy, plnění právní povinnosti a určení právních nároků (čl. 9 odst. 2 písm. f) GDPR).

### 2. Neplatné absolutní vzdání se odpovědnosti (Total Disclaimer)
- **Stav ve v1.0.0:** Texty obsahovaly paušální formulace typu: „Provozovatel nenese žádnou odpovědnost za jakékoli škody“ nebo „Veškeré riziko nese uživatel“. Dle § 2898 občanského zákoníku je takové ujednání vůči spotřebiteli absolutně neplatné.
- **Oprava v Legal Packu 2.0:** V `02-TERMS-OF-USE-DRAFT.md` i `05-LEGAL-DISCLAIMER-DRAFT.md` je odpovědnost omezena v zákonných mezích (§ 2898 NOZ) s výslovnou výhradou mandatory rights spotřebitele a odpovědnosti za hrubou nedbalost či úmysl.

### 3. Falešná terminologie elektronického podpisu
- **Stav ve v1.0.0:** V tiskovém výstupu byla použita formulace „PODPIS POTVRZEN A EVIDOVÁN“, což mohlo vyvolávat mylný dojem kvalifikovaného elektronického podpisu dle eIDAS.
- **Oprava v Legal Packu 2.0:** Terminologie byla sjednocena na pravdivé a právně přesné označení: **„PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO“**, což plně odpovídá auditnímu záznamu v tabulce `Consent` a `LegalAuditLog`.

### 4. Absence transparentnosti AI dle EU AI Act
- **Stav ve v1.0.0:** Informace o zapojení externích AI modelů a entity Orion byly roztříštěné nebo chyběly.
- **Oprava v Legal Packu 2.0:** Vytvořen dedikovaný dokument `07-AI-TRANSPARENCY-DRAFT.md` plnící požadavky čl. 50 Nařízení o umělé inteligenci (EU AI Act). Je výslovně deklarováno, že Orion není člověk, a jsou popsány konkrétní modely (Gemini, Grok, Groq) i limity (halucinace).

### 5. Nereálná tvrzení o ochraně soukromí (0-PII)
- **Stav ve v1.0.0:** Některé marketingové zmínky naznačovaly „nulový přenos dat“ (0-PII).
- **Oprava v Legal Packu 2.0:** Zavedeno pravdivé vymezení činnosti `PrivacyFilterService`: jedná se o heuristickou regexovou pseudonymizaci a fail-closed blokování při podezření na zdravotní data, nikoli o matematickou anonymizaci.

---

## IV. OVĚŘENÍ SOULADU TERMINOLOGIE A HIERARCHIE

1. **Pojem dítěte:** Ve všech dokumentech důsledně označováno jako „dítě“ nebo „nezletilé dítě“; jeho nejlepší zájem je definován jako primární hledisko v Terms, Privacy Notice, Disclaimeru, Kodexu i Dohodě.
2. **Pojem Asistivní AI:** Všude rozlišována deterministická část softwaru od pravděpodobnostních LLM; konzistentní zákaz automatizovaného rozhodování dle čl. 22 GDPR.
3. **Pojem Dobrovolník:** V Kodexu i Dohodě striktně zakázáno vinklaření a poskytování právních služeb.
4. **Pojem Provozovatel / Správce:** Důsledně sjednoceno ve všech normativních dokumentech na fyzickou osobu: **Jiří Šár, fyzická osoba** (s označením `[LEGAL RESEARCH REQUIRED: determine mandatory operator identification for current natural-person operating model]`). Vyloučeny veškeré předpoklady existence neexistujícího spolku, IČO, sídla či statutárního orgánu v současném stavu; budoucí záměr založení spolku je izolován jako interní plánovací fakt (`[PRODUCT INTENT — FUTURE]`).

---

## V. ZÁVĚR AUDITU KONZISTENCE
Pracovní návrhy Legal Pack 2.0 vykazují **100% terminologický a věcný soulad**. Žádný dokument neobsahuje tvrzení v rozporu se zjištěnými technickými fakty z inventury `00-LEGAL-FACTS-INVENTORY.md`.
