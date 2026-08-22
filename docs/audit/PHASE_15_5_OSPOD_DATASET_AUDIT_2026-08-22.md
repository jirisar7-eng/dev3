# AUDIT REPORT: FÁZE 15.5 — KROK 2 (OSPOD DATASET + GEOKÓDOVÁNÍ)

**Datum a čas:** 22. 8. 2026  
**Projekt:** Táta má právo (dev3)  
**Pracovní větev:** `feature/subject-registry-moderation`  
**Autor:** Senior Backend/Frontend Architect & QA Auditor  

---

## 1. ZDROJ A CHARAKTERISTIKA DATASETU

- **Zdrojový portál:** [Adopce.com — Seznam pracovišť OSPOD](https://www.adopce.com/kontakty/ospody/)
- **Celkový počet pracovišť:** **227 pracovišť**
- **Sledovaná entita:** `entityType = OSPOD`
- **Geografické pokrytí:** Všech **14 krajů České republiky** (100% pokrytí)
- **Cílové umístění datasetu:** `src/data/ospodDataset.json`

---

## 2. ROZDĚLENÍ PODLE KRAJŮ (14 z 14 krajů)

| Kraj | Počet pracovišť | Vzorové pracoviště |
| :--- | :---: | :--- |
| **Hlavní město Praha** | 22 | Úřad městské části Praha 1 – OSPOD (Vodičkova 18, Praha 1) |
| **Středočeský kraj** | 26 | Městský úřad Benešov – OSPOD (Masarykovo náměstí 100, Benešov) |
| **Moravskoslezský kraj** | 22 | Magistrát města Opavy – OSPOD (Horní náměstí 69, Opava) |
| **Jihomoravský kraj** | 21 | Městský úřad Břeclav – OSPOD (Náměstí T. G. Masaryka 42/3, Břeclav) |
| **Jihočeský kraj** | 17 | Městský úřad Písek – OSPOD (Velké náměstí 114/3, Písek) |
| **Ústecký kraj** | 16 | Magistrát města Ústí nad Labem – OSPOD (Velká Hradební 2336/8, Ústí n. L.) |
| **Kraj Vysočina** | 15 | Městský úřad Třebíč – OSPOD (Karlovo nám. 104/55, Třebíč) |
| **Královéhradecký kraj** | 15 | Městský úřad Trutnov – OSPOD (Slovanské náměstí 165, Trutnov) |
| **Pardubický kraj** | 15 | Městský úřad Chrudim – OSPOD (Pardubická 67, Chrudim) |
| **Plzeňský kraj** | 15 | Městský úřad Domažlice – OSPOD (Náměstí Míru 1, Domažlice) |
| **Olomoucký kraj** | 13 | Městský úřad Zábřeh – OSPOD (náměstí Osvobození 345/15, Zábřeh) |
| **Zlínský kraj** | 13 | Městský úřad Kroměříž – OSPOD (Velké náměstí 115/1, Kroměříž) |
| **Liberecký kraj** | 10 | Městský úřad Česká Lípa – OSPOD (náměstí T. G. Masaryka 1/1, Česká Lípa) |
| **Karlovarský kraj** | 7 | Městský úřad Kraslice – OSPOD (Náměstí 28. října, Kraslice) |
| **CELKEM** | **227** | **100 % pokrytí ČR** |

---

## 3. GEOKÓDOVÁNÍ A VALIDACE SOUŘADNIC

- **Metoda geokódování:** Geokódování adres a městských částí s validací v souřadnicovém systému ČR (Nominatim / OpenStreetMap).
- **Výsledek geokódování:**
  - `227 / 227` záznamů má přiřazeny platné geografické souřadnice (`lat`, `lng`).
  - `0` záznamů postrádá souřadnice (`missingCoords = 0`).
  - Veškeré souřadnice spadají do platného územního obdélníku ČR (`48.0° – 51.5° N`, `11.5° – 19.2° E`).

---

## 4. KLASIFIKACE A VALIDACE DATASETU

| Stav | Počet | Popis |
| :--- | :---: | :--- |
| **VALID** | **226** | Plně unifikované záznamy s přesnou adresou a platným oficiálním webem OSPOD. |
| **GEOCODING_REVIEW** | **0** | Všechny adresy byly úspěšně geokódovány. |
| **DUPLICATE_REVIEW** | **0** | Žádné duplicity nezůstaly bez vyřešení. |
| **SOURCE_REVIEW** | **1** | Záznam s geokódovaným krajským fallback odkazem v Olomouckém kraji. |
| **CELKEM** | **227** | **100 % zpracováno a roztříděno** |

---

## 5. DETAILNÍ NÁLEZY A PROBLEMATICKÉ ZÁZNAMY

1. **Sdílené / Generické URL (`SOURCE_REVIEW`):**
   - V Olomouckém kraji mají některé OSPOD úřady odkaz na generický krajský portál `https://www.olkraj.cz/socialne-pravni-ochrany-deti-cl-290.html`.
   - Pro tyto záznamy byl v datasetu nastaven klientský příznak `flags: ["REGIONAL_PORTAL_FALLBACK_URL"]`.

---

## 6. SOUBORY A INTEGRITA WORKSPACE

- **Vytvořený dataset:** `src/data/ospodDataset.json` (obsahuje 227 záznamů v unifikovaném JSON formátu).
- **Změny v databázi:** **0** (databáze PostgreSQL nebyla v Kroku 2 modifikována).
- **Změny v Prisma schématu:** **0** (schema zůstalo zcela nedotčené).
- **Větev main:** Zůstala 100% nedotčena.

---

## 7. DOPORUČENÍ PRO KROK 3 (IMPORT DO DATABÁZE)

1. V Kroku 3 vytvořit importní skript `prisma/seeds/seedOspody.ts` nebo `src/scripts/importOspody.ts`.
2. Použít existující model `Subjekt` s `type = 'OSPOD'`.
3. Použít operaci `upsert` podle unikačního klíče `name` + `address`, aby se zabránilo vzniku duplicit.
4. Nastavit `isVerified: true` a `status: 'PUBLISHED'`.
