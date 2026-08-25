# Audit Report: Sjednocení Registru Soudů (Single Source of Truth)

**Datum:** 2026-08-25
**Úkol:** Odstranění runtime duplicity `soudyDataset.ts` ve prospěch API Registru subjektů pro generátor dokumentů.

## Cíl
Sjednotit datový zdroj soudů. Místo statického importu datasetu `soudyDataset.ts` (108 soudů) přepnout produkční generátor (`AiFormsView`) na dynamické asynchronní dotazování proti hlavní PostgreSQL databázi Registru (modelem `Subjekt`), čímž se zajistí konzistence (SSOT) v případě budoucí modifikace dat v administraci.

## Výchozí stav
- **AiFormsView**: Generátor dokumentů používal lokální funkci `findCourtByName` z `soudyDataset.ts`, která přímo ze statického array vracela adresu soudu.
- **Registr subjektů**: Databáze již obsahovala všech 108 soudů.
- **SubjektService**: Backend neobsahoval metodu pro fuzzy vyhledávání konkrétního soudu pro účely automatického vyplňování formulářů (byl zde jen filtrovaný seznam).

## Provedené změny

1. **SubjektService (Backend)**
   - Vytvořena metoda `findCourtByFuzzyName(courtName: string)` v `src/services/subjektService.ts`.
   - Metoda filtruje pouze ověřené soudy (`type: 'SOUD', status: 'VERIFIED'`).
   - Implementován in-memory fuzzy matching nad všemi databázovými záznamy soudů, aby byla plně zachována zpětná kompatibilita se staršími překlepy/názvy v existujících objektech `ClientCase` vč. diakritiky (case a NFD insensitive).
   - Přidán bezpečný fallback pro in-memory vývojový režim, kdy se v případě nedostupnosti PostgreSQL načte legacy datový soubor.

2. **SubjektRoutes (API)**
   - Exponován nový public endpoint `GET /api/subjekty/lookup?name=X`.
   - Endpoint vrací nalezený soud, nebo 404 (pokud algoritmus nenajde shodu s vysokou pravděpodobností), čímž zamezí dosazení náhodného soudu.

3. **AiFormsView (Frontend)**
   - Odstraněn import a runtime závislost na `soudyDataset.ts`.
   - Úprava `useEffect` lifecycle loadování spisu: adresa soudu se nyní získává přes the nově vytvořený endpoint `GET /api/subjekty/lookup`.
   - Zajištěno, že pokud uživatel ručně vyplní pole s adresou dříve než fetch asynchronně doběhne, manuální zadání nebude automatickým lookupem přepsáno (`setCourtAddress(prev => prev ? prev : cData.address)`).
   - Zrušen neefektivní synchronní lookup při každém stisku klávesy v poli `Okresní soud v:` (zaveden lookup na `onBlur`).

## Výsledek testů a ověření
- [x] **GENERATOR → REGISTRY:** Frontend posílá request na API. Adresa je vrácena korektně.
- [x] **FUZZY MATCH:** Diakritika, velikost písmen a lehké odchylky v názvu v databázi nachází stejné výsledky jako původní metoda.
- [x] **MANUAL OVERRIDE:** Ruční úprava adresy není přepsána pozdní odpovědí ze serveru.
- [x] **SECURITY:** Endpoint respektuje public charakter registru firem, neumožňuje IDOR a nevyžaduje oprávnění (shodné s mapou subjektů).
- [x] **FALLBACK:** Fallback infrastruktura s `soudyDataset.ts` zůstala nepoškozena pro režimy bez PostgreSQL a pro seed databáze.
- [x] **BUILD:** Build aplikace doběhl bez chyb (TypeScript kompatibilita API zachována).

## Rizika a budoucí doporučení
- Ponechán `soudyDataset.ts` jako legacy datový zdroj pro Seedy.
- Pro dokonalou integraci by mohl budoucí úkol transformovat pole `court` u modelu `Case` (aktuálně `String`) do relačního `courtId`. Tím by úplně odpadla nutnost provádět fuzzy name-matching při generování dokumentů, lookup by ale stále zůstal jako vyhledávací vrstva v UI pro zadávání soudu do případu.

## Výsledek
**PASS**. Single Source of Truth je nyní funkční.
