# VALIDÁTOR A NORMALIZÁTOR DAT e-SBÍRKA / e-LEGISLATIVA
**Projekt:** dev3.tatovacesta.cz (dev3)  
**Dokument:** `docs/audit/ESBIRKA_VALIDATION_NORMALIZATION_2026-08-17.md`  
**Datum:** 17. srpna 2026  
**Autor:** Hlavní architekt & Bezpečnostní auditor projektu „Táta má právo“  
**Úkol:** ÚKOL 5/10 — Validátor a normalizátor dat e-Sbírka / e-Legislativa  
**Stav:** DOKONČENO (STRIKTNĚ DETERMINISTICKÁ BEZPEČNÁ VRSTVA)

---

## 1. Výchozí stav & Architektonické napojení

Implementace navazuje na **Checkpoint 4 (`b3e492f`)**, ve kterém byl dokončen zabezpečený server-side transportní klient `EsbirkaApiClient`.

### Architektonický řetězec:
```text
REST API (e-Sbírka / e-Legislativa)
   ↓
EsbirkaApiClient (Transport, Rate Limiting, Timeout, Mutex, ETag)
   ↓
EsbirkaValidator (Strukturální, typová a bezpečnostní validace, Fail-Closed)
   ↓
EsbirkaNormalizer (Deterministická normalizace, 100% zachování právního textu, SHA-256 hash)
   ↓
[SYNCHRONIZER - ÚKOL 6/10]
   ↓
[POSTGRESQL - ÚKOL 3/10 / 6/10]
```

### Přísné mantinely tohoto kroku:
1. **NULOVÉ skutečné API volání:** Všechny testy a validace probíhají 100% v paměti nad statickými strukturami.
2. **NULOVÝ zápis do databáze:** Žádný Prisma `create`, `update`, `upsert` ani `delete`.
3. **NULOVÁ změna Prisma schématu:** Schéma zůstává plně v souladu s Úkolem 3/10.
4. **NULOVÁ modifikace právního textu:** Text zákonů nesmí být sumarizován, parafrázován, krácen ani měněn AI modelem.

---

## 2. Datový kontrakt

Vytvořeny 3 striktně oddělené typové úrovně v `src/services/esbirka/validationTypes.ts`:

### A. Surový vstup (`RawEsbirkaActEnvelope`, `RawEsbirkaSection`)
- Přijímá netypovaný JSON z REST API e-Sbírka nebo e-Legislativa.
- Podporuje jak standardní anglické názvy klíčů (`actNumber`, `actYear`, `title`, `sections`), tak české úřední klíče (`cislo`, `rok`, `nazev`, `paragrafy`, `odstavce`, `pismena`), i vnořenou obálku `{ predpis: { ... } }`.

### B. Validovaný mezistup (`ValidatedEsbirkaAct`, `ValidatedEsbirkaSection`)
- Výsledek úspěšné validace `EsbirkaValidator.validateAct()`.
- Garantuje existenci a platnost všech povinných polí, správné datové typy, platná data a neprázdný normativní text.

### C. Normalizovaný doménový model (`NormalizedLegalAct`, `NormalizedLegalSection`, `NormalizedLegalVersion`)
- Výsledek transformace `EsbirkaNormalizer.normalizeAct()`.
- Obsahuje kanonický identifikátor `actCode` (např. `"89/2012"`), deterministický `contentHash`, vypočtené řadící klíče `sectionOrder` (např. `88800` pro § 888, `88801` pro § 888a), snapshot verze a značky opatrovnických paragrafů (`isKeySection`).

---

## 3. Validační pravidla (`EsbirkaValidator`)

Třída `EsbirkaValidator` implementuje princip **Fail-Closed** — při jakékoliv nesrovnalosti vrací `{ isValid: false, errors: ValidationError[] }` a zabrání předání dat do normalizátoru a synchronizéru.

### Kontrolovaná pravidla:
1. **Ochrana proti JSON bombám:** Maximální povolená hloubka vnoření objektu je **15 úrovní** (`MAX_JSON_DEPTH = 15`). Hlubší struktury jsou okamžitě odmítnuty (`DEPTH_LIMIT_EXCEEDED`).
2. **Technické limity velikosti:**
   - Maximální počet paragrafů na předpis: **10 000** (`MAX_SECTIONS_COUNT = 10000`).
   - Maximální délka názvu předpisu: **2 000 znaků** (`MAX_TITLE_LENGTH = 2000`).
   - Maximální délka textu jednoho paragrafu: **500 000 znaků** (`MAX_SECTION_CONTENT_LENGTH = 500000`).
3. **Identifikátory a čísla zákonů:**
   - `actNumber` / `cislo`: Kladné celé číslo `1` až `999999`.
   - `actYear` / `rok`: Kladné celé číslo `1918` až `2100`.
4. **Validace kalendářních dat:**
   - Přísná kontrola reálnosti data (např. `"2026-02-31"` je odhaleno a odmítnuto jako `NON_EXISTENT_CALENDAR_DATE`).
5. **Výčtové typy (Enums):**
   - `status`: `ACTIVE`, `AMENDED`, `REPEALED`.
   - `actType`: `ZAKON`, `USTAVNI_ZAKON`, `VYHLASKA`, `NARIZENI_VLADY`.
   - `category`: `FAMILY_LAW`, `CHILD_PROTECTION`, `CIVIL_PROCEDURE`, `EXECUTION`, `CONSTITUTIONAL`.
6. **Validace struktury paragrafů:**
   - Každý paragraf musí mít platné číslo vyhovující `/^\d+[a-z]?$/i` (např. `"888"`, `"888a"`, `"19"`).
   - Každý paragraf musí obsahovat neprázdný text (buď přímé pole `content`/`text`, nebo složené odstavce a písmena).
   - Odmítnutí `null` prvků a neznámých struktur.

---

## 4. Normalizační pravidla a integrita textu (`EsbirkaNormalizer`)

### A. Striktní zachování normativního právního textu (100% Text Fidelity)
- **ZÁKAZ:** AI sumarizace, parafrázování, opravování právních formulací nebo krácení.
- **POVOLENO:** Pouze čistě technické sjednocení:
  - Unicode normalizace na tvar **NFC**.
  - Sjednocení konců řádků (`\r\n` a `\r` na `\n`).
  - Oříznutí přebytečných mezer na konci řádků (`trimEnd`).
  - Redukce trojitých a vícenásobných prázdných řádků na maximálně dvojité (`\n\n`).

### B. Deterministický výpočet řazení paragrafů (`sectionOrder`)
Pro správné řazení paragrafů v seznamech i databázi se používá vzorec:
- Základní číslo paragrafu $\times 100$ + abecední posun písmene (a=1, b=2, ..., z=26).
- **Příklady:**
  - § 1 $\rightarrow$ `100`
  - § 19 $\rightarrow$ `1900`
  - § 858 $\rightarrow$ `85800`
  - § 888 $\rightarrow$ `88800`
  - § 888a $\rightarrow$ `88801`
  - § 888b $\rightarrow$ `88802`
  - § 907 $\rightarrow$ `90700`

### C. Automatické značkování klíčových opatrovnických paragrafů
Normalizátor identifikuje klíčová ustanovení pro rodičovská práva a obohacuje je o praktická metadata (aniž by měnil text zákona):
- **89/2012 Sb. (OZ):**
  - **§ 858:** Rodičovská odpovědnost (rovná práva obou rodičů).
  - **§ 885 / § 887:** Právo dítěte na styk s oběma rodiči.
  - **§ 888:** Povinnost nepředpojatého předání dítěte ke styku (obrana proti maření styku).
  - **§ 889:** Zákaz popuzování a narušování vztahu dítěte k druhému rodiči.
  - **§ 890:** Právo rodiče na informace ze školy a od lékařů.
  - **§ 906 / § 907:** Formy péče — priorita rodičovské dohody a střídavé péče.
  - **§ 910 / § 913:** Vyživovací povinnost a kritéria stanovení výživného.
- **359/1999 Sb. (ZOSPOD):**
  - **§ 1 / § 9a:** Základní zásady, právo nahlížet do spisu Om.
  - **§ 14 / § 19:** Povinnost OSPOD vést rodiče k dohodě a zachování vazeb s oběma rodiči.

---

## 5. Deterministický SHA-256 Hash obsahu

Metoda `EsbirkaNormalizer.computeContentHash` generuje SHA-256 hash výhradně z kanonicky seřazeného normativního textu všech paragrafů:

$$\text{Hash} = \text{SHA256}\left(\bigcup_{i} \left[\text{SEC}: s_i.\text{sectionNumber} \mid \text{ORD}: s_i.\text{sectionOrder} \mid \text{TITLE}: s_i.\text{title}\right] + \text{"\textbackslash n"} + s_i.\text{content}\right)$$

### Vlastnosti hashe:
- **Zcela nezávislý na:** API klíči, času stažení, ID požadavku, pořadí nezávislých polí v JSONu, ETagu.
- **Stejný právní obsah $\rightarrow$ Identický hash.**
- **Jakákoliv změna textu $\rightarrow$ Odlišný hash.**
- Slouží k budoucí detekci `UNCHANGED` vs. `CHANGED` v Úkolu 6/10.

---

## 6. Přehled a výsledky unit testů (`src/tests/esbirkaValidationNormalization.test.ts`)

Byla vytvořena a úspěšně spuštěna kompletní testovací sada s **56 kontrolními body** (všechny 100% in-memory):

```text
--- STARTING ÚKOL 5/10: VALIDATOR & NORMALIZER UNIT TEST SUITE ---
✅ PASS: TEST 1: Valid legal act successfully validates
✅ PASS: TEST 1: Correctly parsed act number
✅ PASS: TEST 1: Correctly parsed act year
✅ PASS: TEST 1: Correctly validated all 3 sections
✅ PASS: TEST 2: Missing mandatory fields marked invalid (Fail-Closed)
✅ PASS: TEST 2: Detected missing/invalid act number
✅ PASS: TEST 2: Detected missing title
✅ PASS: TEST 3: Wrong data types rejected
✅ PASS: TEST 3: Caught invalid types
✅ PASS: TEST 4: Negative act number and out-of-range year rejected
✅ PASS: TEST 4: Detected negative act number
✅ PASS: TEST 4: Detected out-of-range act year
✅ PASS: TEST 5: Non-existent calendar date (Feb 31) rejected
✅ PASS: TEST 5: Raised NON_EXISTENT_CALENDAR_DATE
✅ PASS: TEST 6: Invalid status enum rejected
✅ PASS: TEST 6: Raised INVALID_STATUS
✅ PASS: TEST 7: Malformed section objects rejected
✅ PASS: TEST 7: Detected null section
✅ PASS: TEST 7: Detected invalid section number syntax
✅ PASS: TEST 7: Detected empty section text
✅ PASS: TEST 8: Excessively long section text rejected
✅ PASS: TEST 8: Raised SECTION_CONTENT_TOO_LONG
✅ PASS: TEST 9: Oversized section count rejected
✅ PASS: TEST 9: Raised SECTIONS_COUNT_EXCEEDED
✅ PASS: TEST 10: Canonical actCode format 89/2012
✅ PASS: TEST 10: Standard shortTitle resolved
✅ PASS: TEST 10: Canonical category resolved
✅ PASS: TEST 10: All sections normalized
✅ PASS: TEST 10: Correct numeric sort order for § 858
✅ PASS: TEST 10: Correct numeric sort order for § 888
✅ PASS: TEST 10: Correct numeric sort order for § 888a
✅ PASS: TEST 11: Exact 100% legal text fidelity preserved without alteration
✅ PASS: TEST 12: Valid 64-char hex SHA-256 hash produced
✅ PASS: TEST 13: Deterministic hash: Identical data yields identical hash
✅ PASS: TEST 14: Modified legal text produces distinct SHA-256 hash
✅ PASS: TEST 15: Input section ordering is deterministically sorted; hash remains identical
✅ PASS: TEST 16: § 858 auto-tagged as key custody section
✅ PASS: TEST 16: § 888 auto-tagged as key custody section
✅ PASS: TEST 16: § 888 enriched with practical legal guidance
✅ PASS: TEST 17: Normalizer fails closed on invalid input
✅ PASS: TEST 18: Corrupted payload blocked at validator stage
✅ PASS: TEST 19: Secrets redacted from error message
✅ PASS: TEST 19: Replaced with [REDACTED]
✅ PASS: TEST 20: Safe error object structure verified
✅ PASS: TEST 21: Depth calculation detected deep recursion
✅ PASS: TEST 21: Payload with >15 nesting levels rejected (DEPTH_LIMIT_EXCEEDED)
✅ PASS: TEST 22: Structured odstavce and pismena validated
✅ PASS: TEST 22: Act code 359/1999
✅ PASS: TEST 22: Resolved shortTitle zOSPOD
✅ PASS: TEST 22: § 19 zOSPOD tagged as key section
✅ PASS: TEST 22: Sub-items correctly formatted in content
✅ PASS: TEST 23: § 1 -> 100
✅ PASS: TEST 23: § 888 -> 88800
✅ PASS: TEST 23: § 888a -> 88801
✅ PASS: TEST 23: § 888b -> 88802
✅ PASS: TEST 23: § 888z -> 88826

=== ÚKOL 5/10 TEST RESULTS ===
Passed: 56
Failed: 0
VERDICT: ALL TESTS PASSED - VALIDATOR & NORMALIZER LAYER VERIFIED
```

---

## 7. Status neověřených položek (UNVERIFIED)

V souladu s architektonickým mandátem jsou následující položky označeny jako **UNVERIFIED**:
1. **Přesný JSON schema kontrakt e-Legislativy pro legislativní procesy:** `UNVERIFIED` — byl vytvořen rozšiřitelný adapter podporující obálky `predpis`, `paragrafy`, `odstavce` i `pismena`.
2. **Přítomnost strukturovaných poznámek pod čarou v e-Sbírce:** `UNVERIFIED` — text poznámek je v současné vrstvě zachován jako součást normativního těla paragrafu.

---

## 8. Bezpečnostní shrnutí & Připravenost pro ÚKOL 6/10

- **Žádné externí síťové volání nebylo provedeno.**
- **Žádný zápis do databáze nebyl proveden.**
- **Žádné tajemství ani API klíč nejsou přítomny v kódu, testech ani auditu.**
- **Právní text je 100% nedotčen.**
- **BLOCKERy: 0.**

Všechny komponenty jsou připraveny pro **ÚKOL 6/10 — Synchronizační engine a idempotentní DB integrace**.
