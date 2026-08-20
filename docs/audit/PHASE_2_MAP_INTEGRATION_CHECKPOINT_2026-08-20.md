# CHECKPOINT AUDIT: INTEGRACE MAP DO PORTÁLU TÁTA MÁ PRÁVO (DEV3)

**Datum a čas auditu:** 20. srpna 2026, 20:25 UTC  
**Typ auditu:** READ-ONLY Checkpoint Verification  
**Projekt:** Táta má právo (dev3)  
**Cíl:** Ověření reálného zakomponování mapových funkcí Leaflet + OpenStreetMap do příslušných stránek veřejného portálu.

---

## 1. Nalezené mapové komponenty a služby

| Soubor | Typ | Účel / Popis |
|---|---|---|
| `src/components/public/SubjektyMap.tsx` | React Komponenta | Plnohodnotná Leaflet + OpenStreetMap mapová komponenta pro vizualizaci opatrovnických subjektů, dynamické ohraničení (`FitBounds`), zobrazení pop-up oken s kontakty a stavem ověření. |
| `src/services/care/geoRoutingService.ts` | Backend / Service | Nominatim OpenStreetMap geocoding a výpočty vzdáleností / tras pro plán péče (Care Locations). |

**Duplicity:** Žádné duplicitní mapové komponenty nebyly v repozitáři nalezeny.  
**Nepoužívané mapové komponenty:** Žádné. `SubjektyMap.tsx` je přímo importována a aktivně renderována v `RegistrSubjektu.tsx`.

---

## 2. Přesné soubory a umístění v architektuře portálu

1. **Komponenta registru a mapy:**
   - Soubor: `src/components/public/RegistrSubjektu.tsx`
   - Import: `import { SubjektyMap } from './SubjektyMap';`
   - Přepínač zobrazení: Seznam (`LIST`) / Mapa (`MAP`)
   - Rendrování: `<SubjektyMap subjekty={filteredSubjekty} />`

2. **Routování ve veřejném portálu:**
   - Soubor: `src/components/public/PublicPortal.tsx` (řádky 329–331)
   - Routy: `/registr-subjektu`, `/subjekty`, `/hodnoceni-subjektu`, `/hodnoceni`
   - Příslušnost k veřejnému portálu: ANO, přímo obsluhováno veřejným směrovačem.

3. **Navigace portálu:**
   - Soubor: `src/config/navigation.ts` (řádek 12)
   - Položka: `sub-1-5` („Registr subjektů“, url: `/registr-subjektu`) v sekci `🚨 Pomoc & Komunita`.

---

## 3. Ověření integrace podle povinných oblastí

| Oblast | Mapová komponenta | Konkrétní stránka / routa | Stav | Detail propojení s daty |
|---|---|---|---|---|
| **Soudy** | `SubjektyMap` | `/registr-subjektu` (kategorie `SOUD` – Opatrovnické soudy) | **INTEGRATED** | Filtr `SOUD` zobrazuje okresní, obvodní a krajské opatrovnické soudy na OpenStreetMap mapě včetně kontaktů, adres a hodnocení. |
| **OSPOD** | `SubjektyMap` | `/registr-subjektu` (kategorie `OSPOD` – Orgány OSPOD) | **INTEGRATED** | Filtr `OSPOD` zobrazuje oddělení sociálně-právní ochrany dětí na mapě s vazbou na města a kraje ČR. |
| **Právní pomoc** | `SubjektyMap` | `/registr-subjektu` (kategorie `ADVOKAT` – Advokáti pro rodinné právo) | **INTEGRATED** | Filtr `ADVOKAT` lokalizuje rodinné advokáty a specialisty na střídavou péči s ověřením v ARES v3. |
| **Poradny** | `SubjektyMap` | `/registr-subjektu` (kategorie `PORADNA_CHARITA` – Poradny & Mediátoři) | **INTEGRATED** | Filtr `PORADNA_CHARITA` lokalizuje manželské/rodinné poradny a krizová centra. |
| **Mediace** | `SubjektyMap` | `/registr-subjektu` (kategorie `PORADNA_CHARITA` – Poradny & Mediátoři) | **INTEGRATED** | Zapsaní mediátoři a mediační centra jsou sjednoceni v kategorii poraden a mediací v interaktivní mapě. |

---

## 4. Analýza napojení a doporučení pro další fáze (Architektonické poznatky)

- **Centrální přístup vs. izolované podstránky:**
  Všechny subjekty (soudy, OSPOD, advokáti, poradny, mediátoři) jsou sjednoceny v centrálním Registru subjektů (`/registr-subjektu`), který poskytuje společné filtrování podle typu, kraje a minimálního hodnocení spolu s přepínačem Seznam / Mapa.
- **Doporučení pro budoucí rozšíření (mimo scope tohoto checkpointu):**
  V samostatných textových podstránkách (např. `/pravni-poradna` nebo `/krizova-pomoc`) lze v budoucnu přidat přímé prolinkování do registru s předvybraným filtrem kategorie (např. `/registr-subjektu?type=OSPOD` nebo `/registr-subjektu?type=ADVOKAT`).

---

## 5. Závěr Checkpointu

FÁZE 2 (Leaflet + OpenStreetMap) je **skutečně zakomponována** do veřejného portálu:
- Není pouhou izolovanou komponentou, ale plně funkční součástí veřejné routy `/registr-subjektu`.
- Je napojena na navigační strom portálu.
- Reaguje na filtry všech 5 požadovaných kategorií (Soudy, OSPOD, Právní pomoc, Poradny, Mediace).
- **Celková integrace: PASS**
