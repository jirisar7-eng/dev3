# PŘEDPUBLIKAČNÍ KONTROLNÍ CHECKLIST (PRE-PUBLICATION LEGAL REVIEW)
**Dokument ID:** `TMPR-REVIEW-CHECKLIST-2.0-20260909`
**Projekt:** Táta má právo / Synthesis OS
**Status:** `STATUS: PRE-PUBLICATION AUDIT PROTOCOL — MANDATORY GATE`
**Datum:** 2026-09-09
**Cílová verze:** `Legal Pack 2.0.0`

---

## I. ÚČEL A ZÁVAZNOST CHECKLISTU

Tento kontrolní protokol stanoví **nepřekročitelné podmínky (Quality Gates)**, které musí být stoprocentně splněny a právně verifikovány předtím, než bude kterýkoli dokument z balíčku Legal Pack 2.0 převeden ze stavu `DRAFT` do stavu `PUBLISHED` v databázovém systému správy dokumentů portálu Táta má právo.

> ⛔ **STRIKTNÍ ZÁKAZ PUBLIKACE:**
> Žádný dokument nesmí být publikován, dokud nejsou uzavřeny a podepsány všechny položky kategorie **P0** a **P1**.

---

## II. CHECKLIST PRIORITA P0 – KRITICKÁ PRÁVNÍ A REGULAČNÍ RIZIKA

Položky P0 představují přímá rizika sankcí ze strany dozorových orgánů (ÚOOÚ, ČOI, ČAK), absolutní neplatnosti smluv či trestněprávní odpovědnosti.

| ID | Kontrolní bod | Zjištěný stav v DRAFTU | Požadavek pro právní revizi (Sign-Off) | Status |
| :--- | :--- | :--- | :--- | :---: |
| **P0-1** | **Identita provozovatele a právní forma** | Provozovatel ukotven jako Jiří Šár, fyzická osoba. Z public-facing dokumentů odstraněny neexistující subjekty (spolek, IČO, sídlo PO, zápis v rejstříku). Budoucí spolek je označen jako `[PRODUCT INTENT — FUTURE]`. | Dokončit právní rešerši povinných identifikačních a kontaktních údajů fyzické osoby poskytující bezplatnou informační službu dle zákona č. 480/2004 Sb. a GDPR (`[LEGAL RESEARCH REQUIRED]`) a stanovit veřejnou doručovací/kontaktní adresu. | 🟡 K SIGN-OFF |
| **P0-2** | **Čl. 9 GDPR – Rodinná data a data dětí o zdraví a psychologii** | Definováno uložení na základě čl. 9 odst. 2 písm. f) GDPR (výkon právních nároků) s fail-closed blokováním AI v `PrivacyFilterService`. | Advokátní posouzení právního titulu pro uchovávání citlivých zpráv OSPOD a psychologických posudků v uživatelském trezoru bez rizika pro správce. | 🟡 K REVIZI |
| **P0-3** | **Zákaz vinklaření (zákon o advokacii č. 85/1996 Sb.)** | Explicitní zákaz v Terms (Čl. II), Kodexu (Část IV) i Dohodě (Čl. IV); odmítnutí právních služeb. | Kontrola formulací advokátem zapsaným v ČAK, zda nemůže vzniknout podezření na neoprávněné poskytování právních služeb dobrovolníky či AI. | 🟡 K REVIZI |
| **P0-4** | **Předávání dat do USA a smlouvy s AI poskytovateli (DPA)** | Identifikováno volání Google Gemini, Grok (xAI) a Groq přes enterprise API. | Ověřit existenci a platnost Data Processing Addenda (DPA), účast v EU-U.S. Data Privacy Frameworku nebo uzavření Standardních smluvních doložek (SCC). | 🟡 K REVIZI |
| **P0-5** | **Vyloučení neplatných klauzulí o zřeknutí se odpovědnosti** | Odstraněna dřívější absolutní zřeknutí se odpovědnosti; zavedeny limity dle § 2898 občanského zákoníku. | Právní posouzení limitace odpovědnosti ve vztahu k bezplatnému poskytování digitální služby a spotřebitelskému právu. | 🟡 K REVIZI |
| **P0-6** | **Soulad s EU AI Act (čl. 50 – transparentnost)** | Zpracován dedikovaný dokument `07-AI-TRANSPARENCY-DRAFT.md`, explicitní vymezení, že Orion není člověk. | Ověřit klasifikaci rizikovosti asistivních nástrojů dle přílohy III Nařízení (EU) 2024/1689 a správnost informačního poučení. | 🟡 K REVIZI |

---

## III. CHECKLIST PRIORITA P1 – VYSOKÁ PRIORITA (INTEGRITA A PRÁVA SPOTŘEBITELE)

| ID | Kontrolní bod | Zjištěný stav v DRAFTU | Požadavek pro právní revizi (Sign-Off) | Status |
| :--- | :--- | :--- | :--- | :---: |
| **P1-1** | **Právní rámec dobrovolnické smlouvy** | Koncipováno jako inominátní smlouva dle § 1746 odst. 2 NOZ s odkazem na zákon č. 198/2002 Sb. | Posoudit, zda organizace bude žádat o akreditaci MV ČR dle zákona o dobrovolnické službě, nebo zda setrvá u obecného režimu občanského zákoníku. | 🟡 K REVIZI |
| **P1-2** | **Spotřebitelské poučení a mimosoudní řešení sporů (ADR)** | Do Terms zapracován odkaz na Českou obchodní inspekci (ČOI). | Ověřit povinné spotřebitelské náležitosti dle zákona č. 634/1992 Sb., o ochraně spotřebitele. | 🟡 K REVIZI |
| **P1-3** | **Retenční lhůty osobních údajů** | V Privacy Notice nastaveny základní kategorie retence a kaskádový výmaz při zrušení účtu. | Stanovit přesné archivační a promlčecí doby pro jednotlivé typy auditních logů ve spolupráci s DPO/právním poradcem. | 🟡 K DOPLNĚNÍ |
| **P1-4** | **Režim cookies dle § 89 odst. 3 ZEK** | Zmapovány výhradně technické nezbytné cookies první strany; nulový výskyt marketingových pixelů. | Potvrdit, že žádná z uvedených cookies (token, mfa, passkey, oauth) nevyžaduje opt-in souhlas a postačuje informační lišta. | 🟡 K REVIZI |
| **P1-5** | **Pravdivost terminologie akceptace (žádný fake podpis)** | Odstraněn tiskový label „PODPIS“, zavedeno „PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO“. | Potvrdit, že elektronický záznam v DB plně dostačuje pro důkazní břemeno uzavření smlouvy o užívání dle § 562 NOZ. | 🟡 K REVIZI |

---

## IV. CHECKLIST PRIORITA P2 – STŘEDNÍ PRIORITA (PROCESNÍ A TECHNICKÉ ZAJIŠTĚNÍ)

| ID | Kontrolní bod | Požadavek na realizaci | Odpovědná role | Status |
| :--- | :--- | :--- | :--- | :---: |
| **P2-1** | **Zřízení etické e-mailové linky** | Zřídit a zabezpečit schránku `etika@tatovacesta.cz` pro důvěrné podněty dle Dobrovolnického kodexu. | Administrátor / DevOps | 🟡 K ZAJIŠTĚNÍ |
| **P2-2** | **Zřízení GDPR kontaktního bodu** | Nastavit směrování schránky `gdpr@tatovacesta.cz` na pověřenou osobu správce. | Administrátor | 🟡 K ZAJIŠTĚNÍ |
| **P2-3** | **Mechanismus notifikace o změnách podmínek** | Zkontrolovat v kódu funkčnost e-mailové notifikace registrovaným uživatelům při změně verzí (lhůta 14 dnů). | Backend vývojář | 🟡 K OVĚŘENÍ |
| **P2-4** | **Sazba PDF a tiskové šablony** | Otestovat export dokumentů do A4 PDF včetně záhlaví, zápatí, číslování stran a ověřovací doložky. | Frontend vývojář | 🟡 K OVĚŘENÍ |

---

## V. CHECKLIST PRIORITA P3 – DLOUHODOBÝ ROZVOJ A COMPLIANCE

| ID | Kontrolní bod | Popis dlouhodobého cíle | Termín |
| :--- | :--- | :--- | :---: |
| **P3-1** | **Akreditace dobrovolnické služby** | Příprava žádosti na Ministerstvo vnitra ČR pro akreditaci dle zákona č. 198/2002 Sb. (podmíněno existencí PO) | Dle budoucího záměru [PRODUCT INTENT — FUTURE] |
| **P3-2** | **Pravidelný audit halucinací AI** | Zavedení kvartálního interního auditu přesnosti odpovědí generátoru podání a analyzátoru rozsudků. | Průběžně |
| **P3-3** | **Monitoring legislativních novel e-Sbírky** | Automatická notifikace právního editora při novelizaci klíčových ustanovení občanského zákoníku a ZŘS. | Průběžně |

---

## VI. FORMÁLNÍ PROTOKOL O SCHVÁLENÍ (SIGN-OFF SHEET)

Před publikací musí být tento protokol fyzicky nebo kvalifikovaným elektronickým podpisem podepsán níže uvedenými osobami:

### 1. Právní kontrola (Advokát / Legal Counsel)
- **Jméno a příjmení advokáta:** ............................................................................
- **Číslo osvědčení ČAK:** .....................................................................................
- **Advokátní kancelář:** ....................................................................................
- **Výrok:** *Prohlašuji, že jsem přezkoumal(a) znění dokumentů balíčku Legal Pack 2.0 (02–08) a neshledal(a) jsem rozpor s právním řádem ČR ani právem EU.*
- **Datum:** ........................................ **Podpis:** ....................................................

### 2. Pověřenec pro ochranu osobních údajů / GDPR Specialista
- **Jméno a příjmení:** .......................................................................................
- **Výrok:** *Prohlašuji, že Zásady ochrany osobních údajů a mechanismus Privacy Filteru odpovídají požadavkům GDPR a nálezům technické inventury.*
- **Datum:** ........................................ **Podpis:** ....................................................

### 3. Provozovatel (Fyzická osoba)
- **Jméno a příjmení:** Jiří Šár (Provozovatel)
- **Výrok:** *Schvaluji znění balíčku Legal Pack 2.0 k postoupení do systému verzování dokumentů jako nové PUBLISHED verze.*
- **Datum:** ........................................ **Podpis:** ....................................................
