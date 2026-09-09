# ARCHITEKTURA PRÁVNÍ DOKUMENTACE (LEGAL PACK 2.0)
**Dokument ID:** `TMPR-ARCH-LEGAL-2.0-20260909`  
**Projekt:** Táta má právo / Synthesis OS  
**Status:** `STATUS: WORKING DRAFT ARCHITECTURE`  
**Datum:** 2026-09-09  

---

## I. ZÁKLADNÍ PRINCIPY ARCHITEKTURY

Právní dokumentace Legal Pack 2.0 tvoří integrovaný, vnitřně nerozporný normativní systém. Každý dokument má jasně definovaný účel, normativní sílu a okruh adresátů.

```
+-------------------------------------------------------------------------+
|                              SYNTHESIS OS                               |
|                         (Platformní vrstva)                             |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                           TÁTA MÁ PRÁVO                                 |
|                       (Veřejný komunitní portál)                        |
+-------------------------------------------------------------------------+
    |                    |                    |                     |
    v                    v                    v                     v
+------------+   +---------------+   +-----------------+   +--------------+
| 02 - TERMS |   |  03 - PRIVACY |   | 05 - DISCLAIMER |   | 04 - COOKIES |
|  (Smlouva) |   | (Info/GDPR)   |   | (Výhrada rizik) |   | (Souhlasy)   |
+------------+   +---------------+   +-----------------+   +--------------+
    |                                                               |
    +------------------------------+--------------------------------+
                                   |
                                   v
+-------------------------------------------------------------------------+
|                  SPECIALIZOVANÁ PRAVIDLA A MODULY                       |
+-------------------------------------------------------------------------+
        |                                                 |
        v                                                 v
+-----------------------+                     +---------------------------+
| 07 - AI TRANSPARENCY  |                     |  DOBROVOLNICKÝ RÁMEC      |
| (AI Act & Orion)      |                     | 06 - KODEX DOBROVOLNÍKA   |
|                       |                     | 08 - DOHODA O SPOLUPRÁCI  |
+-----------------------+                     +---------------------------+
```

---

## II. KANONICKÁ TERMINOLOGIE A DEFINICE

V celém balíčku dokumentů se používají tyto jednotné definice:

1. **Portál / Služba:** Webová aplikace, informační databáze a nástroje dostupné na doméně `tatovacesta.cz` (a souvisejících subdoménách), provozované pod názvem „Táta má právo“ v rámci technologické platformy Synthesis OS.
2. **Provozovatel:** Budoucí určený subjekt `[TO VERIFY: identita budoucího provozovatele]`, IČO: `[TO VERIFY: IČO]`, se sídlem: `[TO VERIFY: sídlo]`.
3. **Uživatel:** Každá fyzická osoba starší 18 let, která přistupuje k Portálu, prohlíží jej nebo vytváří uživatelský účet.
4. **Návštěvník:** Uživatel přistupující k veřejně dostupným částem Portálu bez přihlášení k účtu.
5. **Registrovaný uživatel:** Uživatel, který úspěšně dokončil registrační proces a disponuje aktivním uživatelským účtem.
6. **CoParentHub (Spolurodičovský prostor):** Zabezpečený modul Portálu umožňující koordinaci péče o dítě, sdílení kalendáře, evidenci výdajů a strukturovanou komunikaci mezi rodiči či oprávněnými zástupci.
7. **Dítě:** Nezletilá osoba, jejíž údaje jsou zákonným zástupcem vloženy do systému za účelem organizace péče nebo přípravy podání.
8. **Asistivní AI (Orion / AI Asistent):** Automatizovaný softwarový modul využívající rozsáhlé jazykové modely (LLM) k přeformulování textu (metodika BIFF), sumarizaci soudních rozsudků a předvyplnění konceptů formulářů.
9. **Obsah portálu:** Veškeré texty, články, metodiky, šablony, vzory podání, kalkulátory a databáze judikatury publikované Provozovatelem.
10. **Uživatelský obsah:** Veškerá data, texty, poznámky, soubory, fotografie, audio nahrávky a dokumenty nahrané nebo vytvořené Uživatelem v Portálu.
11. **Právní informace:** Obecné edukativní shrnutí právní úpravy a judikatury; **nejsou právní službou ani advokátním poradenstvím**.

---

## III. IDENTIFIKÁTORY DOKUMENTŮ A VERZOVÁNÍ

### 1. Tabulka kanonických ID a klíčů
| Číslo | Kanonické ID | Databázový klíč (`key`) | Typ (`type`) | Cílová verze |
| :---: | :--- | :--- | :--- | :---: |
| 02 | `DOC-TMPR-TERMS-V2` | `terms` | `TERMS` | `2.0.0` |
| 03 | `DOC-TMPR-PRIVACY-V2` | `gdpr` | `PRIVACY` | `2.0.0` |
| 04 | `DOC-TMPR-COOKIES-V2` | `cookies` | `COOKIES` | `2.0.0` |
| 05 | `DOC-TMPR-DISCLAIMER-V2` | `legal` | `LEGAL` | `2.0.0` |
| 06 | `DOC-TMPR-VOLUNTEER-CODE-V2` | `volunteer_code` | `VOLUNTEER_CODE` | `2.0.0` |
| 07 | `DOC-TMPR-AI-TRANSPARENCY-V2` | `ai_statement` | `AI_STATEMENT` | `2.0.0` |
| 08 | `DOC-TMPR-VOLUNTEER-AGREEMENT-V2` | `dohoda-o-spolupraci` | `VOLUNTEER_AGREEMENT` | `2.0.0` |

### 2. Pravidla sémantického verzování (SemVer)
- **MAJOR verze (X.0.0):** Zásadní změna právních vztahů, právních titulů GDPR, změna provozovatele nebo podstatná změna funkcionalit vyžadující **nové potvrzení přijetí** uživatelem.
- **MINOR verze (2.X.0):** Rozšíření popisu nových technických modulů, aktualizace seznamu procesorů, terminologické zpřesnění bez dopadu na podstatu právního závazku.
- **PATCH verze (2.0.X):** Oprava překlepů, formátování a gramatických chyb.

---

## IV. ŽIVOTNÍ CYKLUS DOKUMENTŮ (DOCUMENT LIFECYCLE)

Každý dokument v systému prochází třemi striktně oddělenými stavy:

```
+-------------+         Schválení a          +---------------+        Vydání nové        +--------------+
|    DRAFT    |  ------------------------->  |   PUBLISHED   |  -----------------------> |   ARCHIVED   |
|  (Neveřejný |      podpis provozovatele    |  (Aktivní pro |         MAJOR verze       |  (Historický |
|   pracovní) |                              |   uživatele)  |                           |     audit)   |
+-------------+                              +---------------+                           +--------------+
```

1. **DRAFT:**
   - Přístupný pouze administrátorům v Compliance Manageru.
   - Nesmí být veřejně nabízen k odsouhlasení.
   - API endpointy pro běžné uživatele jej ignorují (`fail-closed`).
2. **PUBLISHED:**
   - Právně účinný dokument zobrazený na veřejných URL (`/pravni-dokumenty`, `/podminky-uzivani`, `/gdpr` atd.).
   - V daném čase smí existovat právě jedna verze se statusem `PUBLISHED` pro každý dokumentový klíč.
3. **ARCHIVED:**
   - Neměnná historická verze uložená v databázi pro účely auditu a dokazování.
   - Uchovává vazbu na dřívější uživatelské souhlasy (`Consent` vázaný na konkrétní `docVersion`).

---

## V. MODEL AKCEPTACE A PRÁVNÍ ÚČINKY

### 1. Rozlišení dokumentů podle povahy
- **Dokumenty smluvní povahy (vyžadující aktivní akceptaci):**
  - *Podmínky užívání portálu (Terms of Use)* – akceptovány při registraci a při vydání nové MAJOR verze.
  - *Etický kodex dobrovolníka* – akceptován při vstupu do dobrovolnické role.
  - *Dohoda o spolupráci* – uzavírána individuálně s dobrovolníkem.
- **Dokumenty informační povahy (nevyžadující souhlas, ale seznámení):**
  - *Zásady ochrany osobních údajů (Privacy Notice)* – Uživatel je s nimi seznámen; **ochrana osobních údajů se neuzavírá jako smlouva ani se na ni nevyžaduje plošný souhlas**.
  - *Právní výhrada (Legal Disclaimer)* – Výhrada metodické povahy a limitace právní odpovědnosti.
  - *AI Transparentnost* – Informační plnění dle čl. 50 Nařízení o umělé inteligenci (EU AI Act).
- **Technické souhlasy:**
  - *Cookie Policy* – Granulární souhlas udělovaný přes Cookie Consent Banner pro ne-nezbytné cookies.

### 2. Technický mechanismus akceptace
- **Vyloučení klamavého označení:** Systém nesmí tvrdit existenci „kvalifikovaného elektronického podpisu“ (dle nařízení eIDAS).
- **Skutečný mechanismus:** Jedná se o elektronické potvrzení přijetí textu zadáním jména a kliknutím na tlačítko, s auditním záznamem času, IP adresy, User-Agentu a čísla verze do tabulky `Consent` a `LegalAuditLog`.

---

## VI. PRAVIDLA FORMÁTOVÁNÍ A SAZBY (WEB & PRINT/PDF)

### 1. Hierarchické číslování
Každý dokument používá jednotnou 4-úrovňovou hierarchii:
- **Úroveň 1 (Část / Oddíl):** Římské číslice (I., II., III., IV.)
- **Úroveň 2 (Článek):** Arabské číslice s tečkou (1., 2., 3.)
- **Úroveň 3 (Odstavec):** Desetinné arabské číslice (1.1, 1.2, 1.3)
- **Úroveň 4 (Písmeno / Položka):** Malá písmena s kulatou závorkou (a), b), c))

### 2. Webové zobrazení (Accessibility & Readability)
- Respektuje WCAG 2.1 AA kontrastní poměry.
- Písmo: moderní bezpatkový font (Plus Jakarta Sans / Inter), minimální velikost těla 16px, line-height 1.6.
- Šířka textového bloku omezena na 65–75 znaků (`max-w-4xl`) pro optimální čitelnost.
- Interaktivní obsah (Table of Contents) s kotvami pro rychlou navigaci.

### 3. Tiskové a PDF zobrazení (A4 Professional Legal Layout)
- Standardní formát A4, okraje minimálně 20 mm.
- **Hlavička (Header):**
  - Vlevo: Název dokumentu a jeho kanonické ID.
  - Vpravo: Číslo verze a datum účinnosti.
- **Zápatí (Footer):**
  - Vlevo: Identifikace provozovatele / platformy Synthesis OS.
  - Na středu: Stav dokumentu (`DRAFT` / `PUBLISHED`).
  - Vpravo: Číslování stran ve formátu „Strana X z Y“.
- **Zákaz skrytých podmínek:** Zákaz používání písma menšího než 9pt pro jakákoli podstatná smluvní ustanovení, výluky či omezení práv.
