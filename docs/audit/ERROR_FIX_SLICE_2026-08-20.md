# Oprava startu aplikace – Data Contract Mismatch (slice error)

## 1. Příčina chyby (Root Cause)
Při startu aplikace (ve `StateStatisticsView`) docházelo k fatální chybě `Cannot read properties of undefined (reading 'slice')`. 
Problémem byl nesoulad kontraktu mezi frontendem a backendem v integraci Národního katalogu otevřených dat (NKOD). 
Backendová funkce `normalizeNkodDatasets` ve třídě `CsuNkodConnector` správně vracela dataset, kde byly definované klíče: `provider`, `keywords` (pole), `downloadUrl` a `issuedDate`. 
Frontendová definice interface `NkodDataset` ovšem očekávala: `publisher`, `keyword`, `distributionUrl` a `issuedAt`. Tím pádem na frontendu docházelo k mapování na neexistující vlastnosti a operace `.slice(0, 3)` volaná nad `undefined` hodnotou `ds.keyword` shodila renderování celé aplikace.

## 2. Provedená oprava
- **Kontrakt sjednocen** podle chování backendu (jelikož u klíčových slov dává smysl množné číslo `keywords`).
- Opraven byl interface `NkodDataset` v souboru `src/components/public/StateStatisticsView.tsx`.
- Opraveny všechny reference v příslušném renderu:
  - `ds.publisher` -> `ds.provider`
  - `ds.issuedAt` -> `ds.issuedDate`
  - `ds.keyword.slice(0, 3)` -> `(ds.keywords || []).slice(0, 3)`
  - `ds.distributionUrl` -> `ds.downloadUrl`

## 3. Změněné soubory
- `src/components/public/StateStatisticsView.tsx`

## 4. Výsledky testů (QA)
- `typecheck`: PASS
- `lint`: PASS
- `build`: PASS
- `diff-check`: PASS
- `runtime startup`: PASS (odstraněn TypeError blokující inicializaci)

