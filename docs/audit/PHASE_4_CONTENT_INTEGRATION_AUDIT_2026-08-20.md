# AUDIT INTEGRACE OBSAHU: FÁZE 4 — IMPLEMENTACE 54 OBSAHOVÝCH PRVKŮ DO DEV3

**Projekt:** Táta má právo (dev3)  
**Datum a čas auditu:** 20. srpna 2026  
**Odpovědný architekt:** Hlavní softwarový architekt, seniorní backend/frontend vývojář, DevSecOps inženýr & QA auditor  
**Typ operace:** IMPLEMENTAČNÍ INTEGRACE & VERIFIKACE OBSAHU  
**Vstupní stav:** FÁZE 3 — Komplexní obsahový audit potvrdil existenci a kompletní návrh 54 klíčových obsahových prvků rozdělených do prioritních skupin P0 až P3.  
**Stav po Fázi 4:** Všechny prvky jsou úspěšně integrované, ověřené a dostupné uživatelům přes veřejné portálové cesty.

---

## 1. STRATEGIE INTEGRACE (DATA → KOMPONENTA → STRÂNKA → NAVIGACE → UŽIVATEL)

Integrace probíhá s využitím principu **EXTEND_EXISTING** a **VERIFY_EXISTING**, aby se zabránilo zbytečným duplicitám a zajistila maximální konzistence se stávajícím robustním systémem Puck CMS a dedikovanými klientskými view moduly v dev3.

Veškeré texty a strukturovaný obsah jsou přímo načítány z:
- `src/puck/defaultPageData.ts` (hlavní struktury stránek pro práva, krizové linky, soudy)
- `src/puck/practicalExpansionData.ts` (hluboký rozšiřující obsah pro OSPOD, manipulaci, předávání dětí a krizové scénáře)
- `src/data/legalDocuments.ts` (vzory podání ke stažení)
- Dedikované moduly jako `/crisis`, `/opatrovnicka-agenda`, `/rights`, `/judikatura`, `/vzdelavani`, `/coparent-hub` a interaktivní Leaflet + OSM mapa (`SubjektyMap.tsx`).

---

## 2. DETAILNÍ KATALOG A INTEGRAČNÍ MATICE 54 OBSAHOVÝCH PRVKŮ

| ID | Název prvku | Priorita | Cílová oblast / URL | Strategie | Stav | Zdroj |
|---|---|---|---|---|---|---|
| **C01** | SOS: Matka odmítá vydat dítě v termínu předání | `P0` | `/crisis`, `/co-nedelat/predavani` | EXTEND_EXISTING | **DONE** | MPSV, z.ř.s., PČR |
| **C02** | SOS: Křivé obvinění z domácího násilí / vykázání | `P0` | `/crisis`, `/rights` | EXTEND_EXISTING | **DONE** | Ústavní soud, Policie ČR |
| **C03** | SOS: Matka odvezla dítě (Únos jedním z rodičů) | `P0` | `/crisis`, `/opatrovnicka-agenda` | EXTEND_EXISTING | **DONE** | ÚMPOD Brno, § 877 o.z. |
| **C04** | SOS: Návrh na předběžné opatření na styk (§ 74 o.s.ř.) | `P0` | `/ke-stazeni`, `/opatrovnicka-agenda` | EXTEND_EXISTING | **DONE** | Ministerstvo spravedlnosti |
| **C05** | SOS: Psychická krize táty & prevence suicidality | `P0` | `/crisis`, `/instituce` | EXTEND_EXISTING | **DONE** | Linka bezpečí, 116 123 |
| **C06** | SOS: Asistence PČR při předávání dětí | `P0` | `/crisis`, `/rights` | EXTEND_EXISTING | **DONE** | Metodika Policie ČR |
| **C07** | SOS: Matka tvrdí, že dítě je nemocné a ruší styk | `P0` | `/co-nedelat/predavani`, `/coparent-hub` | EXTEND_EXISTING | **DONE** | Sdružení pediatrů, o.z. |
| **C08** | SOS: Zablokování komunikace a komunikační blackout | `P0` | `/co-nedelat/komunikace`, `/coparent-hub`| EXTEND_EXISTING | **DONE** | BIFF Rules, OSPOD |
| **C09** | SOS: Dítě na předávání pláče a odmítá jít | `P0` | `/dite-v-konfliktu/dite-odmita-jit` | EXTEND_EXISTING | **DONE** | Dětská psychologie |
| **C10** | SOS: Hrozba vycestování dítěte do zahraničí | `P0` | `/crisis`, `/instituce` | EXTEND_EXISTING | **DONE** | ÚMPOD, Ministerstvo vnitra |
| **C11** | SOS: Jak legálně pořídit audio/video nahrávku | `P0` | `/dokumentace-a-dokazy`, `/rights` | EXTEND_EXISTING | **DONE** | Nález Ústavního soudu |
| **C12** | SOS: Zásah OSPOD v bytě otce (Sociální šetření) | `P0` | `/ospod-a-z`, `/co-nedelat/osp` | EXTEND_EXISTING | **DONE** | Manuál MPSV pro OSPOD |
| **C13** | Příprava na první jednání u soudu: Manuál | `P1` | `/opatrovnicka-agenda`, `/co-nedelat/soud`| EXTEND_EXISTING | **DONE** | Ministerstvo spravedlnosti |
| **C14** | Jak nahlížet do opatrovnického spisu na soudě a OSPOD| `P1` | `/rights`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | § 44 s.ř., § 168 o.s.ř. |
| **C15** | Soudně-znalecký posudek z psychologie: Průvodce | `P1` | `/opatrovnicka-agenda`, `/knihovna-studii`| EXTEND_EXISTING | **DONE** | Komora soudních znalců |
| **C16** | Jak napadnout chybný nebo podjatý posudek | `P1` | `/rights`, `/judikatura` | EXTEND_EXISTING | **DONE** | Revizní posudky, o.s.ř. |
| **C17** | Kolizní opatrovník OSPOD: Práva, limity, stížnosti | `P1` | `/ospod-a-z`, `/rights` | EXTEND_EXISTING | **DONE** | Zákon o SPOD, stížnosti |
| **C18** | Střídavá péče od A do Z: Právní nárok vs. Zájem | `P1` | `/rights`, `/judikatura` | EXTEND_EXISTING | **DONE** | Nález ÚS I. ÚS 2482/13 |
| **C19** | Překážky střídavé péče: Judikované mýty a realita | `P1` | `/judikatura`, `/knihovna-studii` | EXTEND_EXISTING | **DONE** | Judikatura Ústavního soudu |
| **C20** | Odvolání ke Krajskému soudu: Lhůty a náležitosti | `P1` | `/opatrovnicka-agenda`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | § 205a o.s.ř. |
| **C21** | Ústavní stížnost v opatrovnických věcech | `P1` | `/rights`, `/judikatura` | EXTEND_EXISTING | **DONE** | Zákon o Ústavním soudu |
| **C22** | Výkon rozhodnutí o péči a styku: Pokuty | `P1` | `/opatrovnicka-agenda`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | § 500 z.ř.s., exekuce styku |
| **C23** | Rodičovská odpovědnost vs. Péče o dítě | `P1` | `/rights`, `/legal-wiki` | EXTEND_EXISTING | **DONE** | § 865 občanského zákoníku |
| **C24** | Spory o významných záležitostech dětí (§ 877 o.z.) | `P1` | `/opatrovnicka-agenda`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | Rozhodnutí soudu, § 877 o.z. |
| **C25** | Výslech nezletilého dítěte před soudem | `P1` | `/opatrovnicka-agenda`, `/knihovna-studii`| EXTEND_EXISTING | **DONE** | § 100 o.s.ř., participace |
| **C26** | Změna péče při změně poměrů (§ 907 o.z.) | `P1` | `/opatrovnicka-agenda`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | § 907 odst. 1 o.z. |
| **C27** | Výživné zletilého dítěte na VŠ | `P1` | `/rights`, `/legal-wiki` | EXTEND_EXISTING | **DONE** | Výživné po 18 letech věku |
| **C28** | Komunikační protokol BIFF v praxi | `P2` | `/co-nedelat/komunikace`, `/vzdelavani`| EXTEND_EXISTING | **DONE** | BIFF Method, Bill Eddy |
| **C29** | Metodika výpočtu výživného: Tabulky MSP | `P2` | `/rights`, `/kalkulacka-vyzivneho` | EXTEND_EXISTING | **DONE** | Doporučení MSp ČR |
| **C30** | Mimořádné výdaje na dítě: Co kryje běžné výživné | `P2` | `/coparent-hub`, `/rights` | EXTEND_EXISTING | **DONE** | Výklad Nejvyššího soudu |
| **C31** | Organizace dvou plnohodnotných domovů | `P2` | `/co-nedelat/dite`, `/vzdelavani` | EXTEND_EXISTING | **DONE** | Dětská psychoterapie |
| **C32** | Předávací protokol dítěte a záznam maření | `P2` | `/coparent-hub`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | Důkazní metodika pro soudy |
| **C33** | Školní portály (Bakaláři) a právo na informace | `P2` | `/dite-v-konfliktu/skola`, `/rights` | EXTEND_EXISTING | **DONE** | Metodické stanovisko MŠMT |
| **C34** | Komunikace s pediatrem a nahlížení do dokumentace | `P2` | `/rights`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | Zákon o zdravotních službách |
| **C35** | Modely střídání péče podle věku dítěte | `P2` | `/plan-pece`, `/coparent-hub` | EXTEND_EXISTING | **DONE** | Klinická psychologie dětí |
| **C36** | Předávání přes školu/školku jako deeskalace | `P2` | `/opatrovnicka-agenda`, `/coparent-hub`| EXTEND_EXISTING | **DONE** | Rodinná mediace a praxe |
| **C37** | Prázdniny, Vánoce a svátky: Dělení času | `P2` | `/coparent-hub`, `/plan-pece` | EXTEND_EXISTING | **DONE** | Soudní praxe schvalování dohod|
| **C38** | Cestování s dítětem do zahraničí (Souhlas) | `P2` | `/rights`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | Ministerstvo zahraničních věcí |
| **C39** | Zapojení nových partnerů do života dětí | `P2` | `/vzdelavani`, `/knihovna-studii` | EXTEND_EXISTING | **DONE** | Rodinná psychologie |
| **C40** | Prarodiče a širší rodina: Právo na styk (§ 927 o.z.)| `P2` | `/rights`, `/ke-stazeni` | EXTEND_EXISTING | **DONE** | § 927 občanského zákoníku |
| **C41** | Předškolní adaptace a volba kroužků | `P2` | `/coparent-hub`, `/plan-pece` | EXTEND_EXISTING | **DONE** | Spolurodičovská kooperace |
| **C42** | Společné bankovní konto pro potřeby dětí | `P2` | `/coparent-hub` | EXTEND_EXISTING | **DONE** | Finanční transparentnost |
| **C43** | Studie: Vliv absence otce na vývoj dítěte | `P3` | `/knihovna-studii`, `/judikatura` | EXTEND_EXISTING | **DONE** | Warshak, Fabricius, Nielsen |
| **C44** | Syndrom zavrženého rodiče (PAS): Diagnostika | `P3` | `/knihovna-studii`, `/legal-wiki` | EXTEND_EXISTING | **DONE** | Richard Gardner, PAS syndrom |
| **C45** | Kvíz: Jste připraveni na opatrovnický soud? | `P3` | `/vzdelavani` | VERIFY_EXISTING | **DONE** | Vzdělávací akademie dev3 |
| **C46** | Edukační videotéka a rozbory situací (Simulace) | `P3` | `/vzdelavani` (Videotéka) | VERIFY_EXISTING | **DONE** | Vizuální rozbory a webináře |
| **C47** | Právní Wiki: 50 klíčových pojmů lidsky | `P3` | `/legal-wiki` | EXTEND_EXISTING | **DONE** | Slovník opatrovnických pojmů |
| **C48** | Historie opatrovnického soudnictví v ČR | `P3` | `/o-projektu`, `/knihovna-studii` | EXTEND_EXISTING | **DONE** | Právně-historické studie |
| **C49** | Příběhy tátů o střídavé péči a překonání bariér | `P3` | `/stories`, `/forum` | EXTEND_EXISTING | **DONE** | Kazuistiky z komunity |
| **C50** | Memento: Odvrácená tvář opatrovnických válek | `P3` | `/memento` | EXTEND_EXISTING | **DONE** | Etický kodex, dopady na děti |
| **C51** | Mentoring tátů: Kodex mentora | `P3` | `/podpora` | EXTEND_EXISTING | **DONE** | Mentorská síť Táta má právo |
| **C52** | Mediace a rodinná poradna: Kdy má smysl | `P3` | `/instituce`, `/opatrovnicka-agenda` | EXTEND_EXISTING | **DONE** | Asociace mediátorů ČR |
| **C53** | Otcové a dospívající dcery / synové: Puberta | `P3` | `/knihovna-studii`, `/vzdelavani` | EXTEND_EXISTING | **DONE** | Vývojová psychologie dětí |
| **C54** | Transparentní financování a etický kodex portálu | `P3` | `/o-projektu`, `/support` | EXTEND_EXISTING | **DONE** | Kodex spolku Táta má právo |

---

## 3. STATISTICKÁ INTEGRACE

- **Počet prvků celkem:** 54 / 54
- **DONE (Plně integrováno):** 52
- **VERIFY_EXISTING (Plně ověřeno):** 2
- **BLOCKED / REJECTED:** 0 (Žádné blokace nebyly identifikovány)

---

## 4. TECHNICKÁ VERIFIKACE KVALITY

Abychom zajistili bezchybnost celého systému, byly spuštěny validační nástroje:
1. **Linter:** `PASS`
2. **TypeScript compilation check (`tsc --noEmit`):** `PASS`
3. **Produkční build:** `PASS`
4. **Secrets / Security audit:** `PASS` (Žádné secrets, API klíče ani citlivé osobní údaje nebyly vystaveny).

Všechny routy a navigační položky jsou plně funkční a provázané z hlavního menu portálu, což zaručuje, že se kdokoli v tísni či v opatrovnickém řízení okamžitě dostane k reálnému, vysoce kvalitnímu, právně ověřenému a psychologicky citlivému obsahu.
