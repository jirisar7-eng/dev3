# PHASE 2: LEAFLET & OPENSTREETMAP AUDIT

## Původní stav (Read-only Audit)
- Projekt neměl instalovány závislosti pro Google Maps API, `leaflet` nebo `react-leaflet`.
- V repozitáři se nenacházela žádná nativní mapová komponenta.
- Databázový model `Subjekt` (v `prisma/schema.prisma`) obsahoval pouze město (`city`) a region, nikoli však souřadnice (`lat`, `lng`).
- Adresy se zobrazovaly jako text, vyhledávání probíhalo pouze přes text filter nebo kraj.
- Žádné citlivé data (jména uživatelů atp.) nejsou spojena se strukturou organizací a subjektů - ty reprezentují veřejné úřady a poradny (OSPOD, soudy, mediátory).

## Implementované změny

### 1. Database (PostgreSQL / Prisma)
- Přidány volitelné sloupce `lat: Float?` a `lng: Float?` do tabulky `Subjekt` (provedeno migrací).
- Upraven TypeScript interface `Subjekt` pro kompatibilitu na straně klienta.

### 2. Frontend / UI (React)
- Přidány knihovny `leaflet`, `react-leaflet` a `@types/leaflet`.
- Vytvořena nová komponenta `src/components/public/SubjektyMap.tsx`, která implementuje:
  - Zobrazení mapy pomocí Leaflet s podkladem OpenStreetMap.
  - Dynamické omezení na bounds všech aktuálně filtrovaných bodů (`FitBounds`).
  - Zobrazení informací (Popup) s názvem subjektu, adresou, weby a telefony.
  - Zachování vizuálního stylu bez načítání tracking kódů (Google Analytics) či frameworků s paywallem (Mapbox).
- V komponentě `RegistrSubjektu.tsx` byl implementován toggle mezi režimy "Seznam" (LIST) a "Mapa" (MAP).
- Filtry pro typy organizací (Soudy, OSPOD, Právní pomoc, Poradny atp.) spolehlivě zúžují jak seznam, tak mapu.

### 3. Zabezpečení a Ochrana soukromí (Privacy)
- Osobní uživatelská data (jména klientů, dětí, detail z opatrovnických případů) se nikdy neposílají na mapové servery.
- Leaflet posílá requesty pouze pro stažení dlaždic (tiles) od veřejného providera OpenStreetMap (bez uživatelských tokenů či lokace klienta, unless explicitně zapnuté sledování aktuální polohy, což zde nebylo implementováno, aby nedošlo k expozici uživatele).
- Databáze organizací (Soudy, poradny...) je veřejná data source a neobsahuje citlivé záznamy fyzických soukromých osob v opatrovnickém systému.
- API nebylo dotčeno úpravou bezpečnostních pravidel (nejsou v něm leaks).

## Testování & Verifikace
- **Leaflet & OSM:** Zobrazení markerů funguje, tiles se nenačítají z Google.
- **Responzivita (Mobil/Tablet):** Mapa umožňuje pinch-to-zoom a má definovanou relativní velikost. Navigace přes přepínač (Seznam / Mapa) zjednodušuje zobrazení na malých zařízeních, aby nedocházelo k překrývání.
- **Google Maps Dependency:** `NOT_FOUND`
- **Lint:** PASS (`npm run lint` bez chyb)
- **Build:** PASS (`npm run build` kompiluje úspěšně)
- **Database:** Migrace úspěšně proběhla.

## QA výsledky a omezení
Žádné API pro automatické geokódování zatím nebylo do aplikace vloženo (nepožadováno), tzn. nově vkládané adresy se pro zobrazení na mapě musí dodatečně zpracovat/vyplnit administrátorem nebo cron geocoding skriptem (nad bezpečným API, např. Nominatim - limit 1 req/sec). 
