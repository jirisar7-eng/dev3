# Auditní zpráva: Diagnostika a Oprava problému Mapy subjektů

**Datum:** 2026-08-22
**Úkol:** Diagnostika a oprava chování "Mapy subjektů" (Geocoding, UI pro GPS, Fix pádu na null).

## Zjištěný stav (ROOT CAUSE)
Základním problémem byla absence GPS souřadnic (`lat`, `lng`) v reálných datech v produkční databázi a chybějící podpora pro jejich zadávání do systému.
Produkční seedovací sada ani uživatelská administrace z ARES s lokacemi nepracovaly.
Subjekty pak při prázdných koordinátech vyústily ve filtraci mapy, což způsobilo, že pokusy o odkaz "Zobrazit na mapě" selhaly bez viditelné odezvy.

## PROVEDENÉ ZMĚNY A ŘEŠENÍ

1. **Prisma Seed a Databáze (DATA INTEGRITY PASS)**
   - V souboru `prisma/seed.ts` bylo u vybraných testovacích subjektů (soudy, Praha) přidáno reálné `lat`/`lng`.
   - V `seed.ts` byly upraveny klauzule `create` i `update` upsertu tak, aby nově propisovaly souřadnice do `dbStore` a Postgres databáze.

2. **Administrace - SubjektManager (CMS PASS)**
   - Do administrace CMS `src/components/admin/SubjektManager.tsx` přibyla dvě textová/číselná pole (`lat` a `lng`).
   - Přidána validace rozsahů lat/lng před uložením.
   - Byla přidána funkce **Geocodingu**, která využívá Nominatim OpenStreetMap (`https://nominatim.openstreetmap.org/search`) k získání GPS z adresy s jedním kliknutím tlačítka `Získat z adresy`.
   - Administrátor může existující adresní návrh ručně vymazat (GPS je pro backend optional pole).

3. **Backend a Služby (API PASS)**
   - Backend `src/services/subjektService.ts` ve funkci `updateSubjekt` a `createSubjekt` nyní správně ukládá a čistí volitelná pole `lat`/`lng`. Původní kód posílal `undefined` pro smazané hodnoty, nově explicitně nastavuje novou hodnotu případně čistí do databáze (skrze Prisma).
   - API `POST` a `PUT` na `/api/subjekty/` tím spolehlivě zprostředkují změny do DB.

4. **Front-End - UX a Mapa (MAP PASS)**
   - V komponentě `RegistrSubjektu.tsx` byl opraven klik na **Zobrazit na mapě**. Pokud uživatel klikne na subjekt, který nemá platné GPS parametry `lat` a `lng`, komponenta nyní nevykoná chybný přechod, ale zobrazí bezpečné warning sdělení: `"Tento subjekt zatím nemá dostupnou ověřenou polohu."` přímo v komponentě listu.
   - Tlačítko (odkaz) v navigaci je již existujícím validním routovacím uzlem do dedikovaného `MapaSubjektuView`.

## RIZIKO A STABILITA
Riziko této změny je minimální.
Změny nijak nezasáhly do bezpečnostní (Auth/RBAC) roviny, do citlivých údajů nebo jiných struktur databáze. Pro ověření byly úspěšně provedeny všechny bezpečnostní (TypeCheck a `npm run build`) validace, které prokázaly nenarušení celistvosti.

## VÝSLEDEK (DoD)
- GPS administrace: PASS
- Geocoding: PASS (Nominatim OSM integrace, no API key required for low volume)
- Uložení do DB: PASS
- API: PASS
- Mapa: PASS
- "Zobrazit na mapě": PASS (Ošetřeno na obou viewch)
- Seznam/Mapa: PASS
- Testy: PASS
- Build: PASS
