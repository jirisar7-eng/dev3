# Závěrečný diagnostický report chyby "Cannot read properties of undefined (reading 'slice')"

## 1. Informace o chybě
- **Symptom:** Během startu aplikace/při načítání portálu se objevila bílá obrazovka s chybou `Cannot read properties of undefined (reading 'slice')`.
- **Datum diagnostiky:** 20. srpna 2026
- **Zpracoval:** QA & DevSecOps AI

## 2. Přesné místo chyby
- **Soubor:** `src/components/public/StateStatisticsView.tsx`
- **Řádek:** 371
- **Chybný kód:** 
```tsx
{ds.keyword.slice(0, 3).map((kw) => (
  <span key={kw} className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
    #{kw}
  </span>
))}
```

## 3. Detailní příčina problému (Root Cause Analysis)
Chyba je způsobena nesouladem v názvu vlastnosti mezi backendem a frontendem (Data Contract Mismatch).

1. **Frontend Očekávání:**
V souboru `src/components/public/StateStatisticsView.tsx` (řádek 43) je definován interface `NkodDatasetItem`, který definuje pole klíčových slov v jednotném čísle:
```typescript
interface NkodDatasetItem {
  ...
  keyword: string[];
  ...
}
```
Díky tomu React komponenta volá mapování přes `ds.keyword.slice()`.

2. **Backend Implementace:**
Backendová služba v souboru `src/services/stateAdmin/CsuNkodConnector.ts` (řádek 132 v metodě `normalizeNkodDatasets`) ale vrací datový payload s vlastností v množném čísle `keywords`:
```typescript
.map((item: any) => ({
  ...
  keywords: [searchKeyword],
  ...
}));
```

3. **Průběh pádu (Crash path):**
Při inicializaci veřejného portálu na homepage (nebo při prohlížení StateStatisticsView) se spustí React hook `useEffect`, který volá `fetchNkodDatasets('rodina')`.
Backend úspěšně vrátí data z NKOD obsahující vlastnost `keywords`.
Když se následně komponenta `StateStatisticsView` pokusí výsledky vyrenderovat, přistupuje k `ds.keyword`. Protože backend zaslal `keywords`, hodnota `ds.keyword` je `undefined`.
Volání `undefined.slice(0, 3)` způsobí fatální výjimku v React renderovacím cyklu, což zablokuje zobrazení celé stránky.

## 4. Navrhované řešení (ZATÍM NEIMPLEMENTOVÁNO)
K opravě je třeba sjednotit název vlastnosti na obou stranách. Logičtější (s ohledem na to, že jde o pole) je použít množné číslo `keywords`.

1. **V souboru `src/components/public/StateStatisticsView.tsx`:**
   - Změnit v interface `NkodDatasetItem` vlastnost z `keyword` na `keywords: string[];`.
   - Změnit na řádku 371 kód z `ds.keyword.slice(0, 3)` na bezpečnější `(ds.keywords || []).slice(0, 3)`.

*Poznámka: Veškerý kód prozatím zůstal v původním READ-ONLY stavu, nedošlo k žádnému commitu, fixaci ani pushování v souladu se zadáním.*
