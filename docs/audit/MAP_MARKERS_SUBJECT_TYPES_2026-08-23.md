# AUDIT: Mapové markery a typy subjektů

**Datum:** 2026-08-23
**Projekt:** Táta má právo (dev3)
**Zaměření:** Vizualizace typů subjektů v registrech a na mapě

## A) Kde je implementována mapa
Logika mapy a zobrazení registrů je rozdělena do 3 hlavních komponent:
1. `src/components/public/SubjektyMap.tsx` – Jádro mapy, správa markerů, popup okna.
2. `src/components/public/MapaSubjektuView.tsx` – Dedikované view přes celou obrazovku s filtry a postranním list panelem.
3. `src/components/public/RegistrSubjektu.tsx` – Klasické adresářové zobrazení s filtry a inline mapou.

## B) Jaká mapová knihovna se používá
Používá se knihovna **Leaflet** přes React wrapper **react-leaflet**. Dále se využívají ikonky z knihovny `lucide-react`.

## C) Kde se vytvářejí mapové markery
Markery jsou vytvářeny v `src/components/public/SubjektyMap.tsx` v komponentě `<SubjektMarker>`. Samotný vzhled markeru se generuje jako HTML string funkcí `createCustomPinIcon(type, isSelected)` pomocí `L.divIcon`.

## D) Jak se markeru určuje typ subjektu
Typ je předán pomocí vlastnosti `subjekt.type` (která odpovídá typu `EntityType`). Tato hodnota vstupuje do funkce generující HTML ikonu.

## E) Kde je definováno mapování subjectType → ikona
Zde je zásadní rozpor současného stavu:
* V **UI filtrech** je mapování (ikony `lucide-react`) duplicitně definováno přes konstantu `ENTITY_CONFIG`.
* V samotném **mapovém markeru** je však pro VŠECHNY typy natvrdo vložen univerzální SVG kód pro `MapPin` (`<path d="M20 10c0 6-8 12..."/>`). Typ subjektu tedy nyní ovlivňuje **pouze barvu pozadí markeru** (voláním duplicitní funkce `getEntityPinColor`), nikoliv jeho symbol.

## F) Kde jsou definovány horní filtry a jejich ikony
Filtry se definují duplicitně jako `const ENTITY_CONFIG: Record<EntityType, ...>` uvnitř:
* `src/components/public/RegistrSubjektu.tsx`
* `src/components/public/MapaSubjektuView.tsx`

Tlačítko "Všechny subjekty" je navíc vloženo manuálně vedle mapovacího cyklu a momentálně používá v `RegistrSubjektu` nesprávně ikonu `Building2`, i když by mělo používat `MapPin`.

## G) Zda horní filtry a mapa používají stejný enum/datový typ
Ano, obojí používá globální TypeScriptový typ `EntityType` ze `src/types/index.ts` (`'SOUD' | 'OSPOD' | 'ZNALEC' | 'ADVOKAT' | 'PORADNA_CHARITA'`).

## H) Zda existují duplicity typových konstant
**ANO, existuje masivní duplicita dat a logiky:**
1. `ENTITY_CONFIG` je celá zkopírovaná ve 2 různých souborech.
2. V `MapaSubjektuView.tsx` config obsahuje navíc pole `pinColor`, které `RegistrSubjektu.tsx` nemá.
3. Mapová komponenta `SubjektyMap.tsx` si definuje vlastní switch pro barvy `getEntityPinColor()` a vlastní textový formatter `formatEntityType()`.
4. Formuláře v `src/components/admin/SubjektManager.tsx` mají typy natvrdo zakódované v `<option>` tagách místo čerpání z jednotného configu.

## I) Zda existuje clustering markerů
**NE**. Markery se renderují všechny najednou 1:1 k vyfiltrovanému políčku. Chybí knihovna typu `react-leaflet-cluster`, což může při stovkách subjektů způsobit pokles výkonu a vizuální nepřehlednost.

## J) Jak se řeší aktivní/neaktivní filtr
Stav se udržuje v lokálním React state `activeType`. Neaktivní filtr má bílé pozadí (`bg-white text-slate-700`), aktivní tmavé pozadí (`bg-slate-900 text-white shadow-md`).

## K) Jak se řeší selected/active marker
Je řízen propou `selectedSubjektId`. Pokud marker odpovídá tomuto ID:
* Zvětší se (scale) z 32px na 42px.
* Obdrží žlutý zvýrazňující okraj (`#fbbf24`).
* Aplikuje se pulzující animace v pozadí (`animation: ping`).
* Pomocí `ref.current.openPopup()` se mu automaticky programově otevře detail bubliny.

## L) Jaký dopad by měla změna na mobilní zařízení
Konsolidace SVG ikon neovlivní negativně mobilní zobrazení, naopak jej zlepší – sjednocená vizuální řeč uživateli umožní rychleji skenovat obrazovku. Změna ikon ve filtrech i na mapě bude responzivně zcela bezpečná (tlačítka projdou bez potíží v rámci flex/wrap kontejneru).

## M) Zda jsou markery přístupné (aria-label/title)
**NE**. Markery na mapě jsou vykresleny do divů jako čistě vizuální `<svg>`. Chybí u nich `aria-label`, `<span class="sr-only">` nebo `title` tag, což znamená, že čtečky obrazovek (VoiceOver/TalkBack) nemají možnost sdělit uživateli typ bez otevření popup okna.

## N) Navržená architektura sjednocení ikon

**Doporučené řešení (Single Source of Truth):**
1. Vytvořit nový konfigurační soubor: `src/config/entityConfig.ts`.
2. Do něj vložit sjednocený globální slovník `ENTITY_CONFIG`. Ten bude obsahovat:
   * Label
   * Barevnou škálu pro tailwind badge (bg, text, border).
   * HEX barvy pro mapový marker.
   * Přímou definici ikony jako React (Lucide) komponenty.
   * **Extra:** SVG path raw string (protože `L.divIcon` v Leafletu vyžaduje HTML string a nepodporuje přímý render React komponenty – vložení standardizovaného SVG path přes string interpolaci je pro Leaflet nejelegantnější).
3. Nahradit veškeré duplikáty napříč aplikací, včetně administrátorských `<option>` selectů (generovat je mapováním configu).
4. Do `L.divIcon` přidat `aria-label` podle názvu typu subjektu pro přístupnost.
5. Vytvořit abstraktní tlačítko filtru, které bude přijímat konfiguraci (Soud → Scale, OSPOD → Building2, Znalec → PenLine, Advokát → Briefcase, Poradna → HeartHandshake). Tlačítko pro "Všechny" by explicitně používalo `MapPin` místo `Building2`.

**Odhad rozsahu a rizika:**
* **Rozsah:** Malý / Střední (refaktor cca 4 souborů, přesun kódů do jednoho sdíleného configu).
* **Rizika:** Velmi malá. Jedná se pouze o UI prezentační vrstvu bez dopadu na backend routy, databázi nebo integrace třetích stran.
