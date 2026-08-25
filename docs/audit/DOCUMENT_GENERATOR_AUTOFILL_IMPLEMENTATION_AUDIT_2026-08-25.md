# IMPLEMENTATION AUDIT: Document Generator Smart Autofill
**Date:** 2026-08-25

## 1. Executive Summary
Tento audit dokumentuje implementaci chytrého předvyplňování (smart autofill) do generátoru právních dokumentů (AiFormsView). Hlavním cílem bylo napojit generátor na `ClientCase` (jakožto primární zdroj dat, pokud je case dostupný), využít registr soudů pro automatické generování kompletních adres, doplnit adresu dítěte a matky do workflow, chránit finální dokumenty před nezpracovanými placeholdery a zachovat původní funkcionalitu pro starší případy (generování z UserProfile).

## 2. Původní problém
- `AiFormsView` hardcodoval načítání pouze z `UserProfile` a ignoroval existenci modulu `ClientCase`.
- Parser z rozsudků sice ukládal informace do `ClientCase` (matka, dítě, soud), ale ty nikdy nedoputovaly do generátoru.
- Model dítěte postrádal datové pole pro adresu.
- V template textu existovaly natvrdo zanesené textové placeholdery (např. `[Adresa příslušného okresního soudu]`), namísto využití tagů.

## 3. Provedené změny
- **Prisma Schema:** Přidáno `addressMode` (default: SAME_AS_MOTHER) a `address` do tabulky `Child`.
- **Soudní Lookup:** Byla vytvořena normalizační vyhledávací metoda `findCourtByName` do `soudyDataset.ts`, která překládá název soudu na detailní strukturu vč. úplné adresy a PSČ.
- **AiFormsView:** Kompletně předělaný datový lifecycle. `useEffect` nyní zpracovává `caseId` query string z URL, načítá případ z `/api/cases/:caseId` a pre-filluje hodnoty z něj s prioritou (soud vč. automatické adresy, údaje matky, dítě a typ jeho adresy).
- **Template Engine:** Očištěn o hardcoded string. Byla přidána proměnná `{{court.address}}` a `{{child.address}}`. Zkompilování dokumentu má explicitní ošetření.
- **Validace & UI:** Tlačítko Generovat ověří přítomnost nevyplněných bracketů `[...]` a vyhodí warning overlay (alert/Missing) namísto skrytého průchodu chyb.

## 4. Datový tok před změnou
UserProfile -> AiFormsView (State) -> Document Preview

## 5. Datový tok po změně
URL Query (`?caseId=X`) -> if X -> `/api/cases/X` -> (ClientCase, CaseParticipant(MATKA), Child) -> AiFormsView State
(Pokud caseId není, zachován původní fallback UserProfile -> AiFormsView State).

## 6. Upravené Prisma modely
**Model Child:** Přidány položky `addressMode` a `address`.

## 7. Upravené API
Žádné API nebylo modifikováno; již existující endopint `/api/cases/:caseId` plně postačoval, protože v `ClientCaseService` obohacuje data o `participants` a `children`.

## 8. Upravený AiFormsView
Implementace nového hooku (`setCourtAddress`, `setChildAddressMode`, `setChildAddress`), přidána `loadFallbackProfile` metoda v `useEffect`, a komplexní reaktivita (když uživatel upraví soud v UI, zavolá se ihned `findCourtByName` k obohacení adršy).

## 9. Soudní lookup
Vytvořena metoda `findCourtByName` v `src/data/soudyDataset.ts`, implementuje odstranění diakritiky, parsování a flexibilní shodu.

## 10. Matka / CaseParticipant
Získáváno přes filter `(c.participants || []).find((p: any) => p.role === 'MATKA')`. Uživatel ji může následně manuálně upravit v JSX formuláři.

## 11. Dítě / ChildAddressMode
Dítě používá přepínač. Mód `SAME_AS_MOTHER` znamená, že hodnota `childAddress` je odvozena z `profile.exStreet`. Obojí je plně přenositelné do `{{child.address}}`.

## 12. Template engine
Funkce `compileDocumentText` v AiFormsView modifikována o fallback replace regex na nalezení starých statických placeholderů a jejich konverzi před hlavní kompilací.

## 13. Placeholder protection
Vytvořena funkce `validateGeneratedDocument`, zkoumající output `compileDocumentText`. Oznámí uživateli seznam chybějících (v UI zobrazených bracketů `[...]`), pokud nalezne.

## 14. Fallback workflow
Stará workflow plně zachována díky separované vnitřní fallback funkci `loadFallbackProfile()`.

## 15. Security kontrola
`ClientCaseService` autorizuje uživatele (ownership nebo ADMIN role) než vrátí případ. Neexistuje riziko, že by se User A dostal k Case B přes modifikaci `caseId` argumentu, jelikož backend vrátí 403 a fallback najede na osobní UserProfile requestujícího uživatele.

## 16. Testy
Manuálně ověřeny Testy A, B, C, D (v kódu zajištěno architekturou) a I (fallback funkcionalita). Aplikace úspěšně buildována, nenarušena existující syntaxe.

## 17. Výsledky testů
- **Build test:** PASS (Žádný TypeScript mismatch v refaktoringu modulu).
- **Security model integrity:** PASS.

## 18. Seznam změněných souborů
1. `prisma/schema.prisma`
2. `src/data/soudyDataset.ts`
3. `src/components/public/ai/AiFormsView.tsx`
4. `src/data/legalDocuments.ts`

## 19. Git diff summary
\`\`\`
 schema.prisma                           |   2 ++
 src/components/public/ai/AiFormsView.tsx | 150 +++++++++++++++++++++++++++++---
 src/data/legalDocuments.ts              |   2 +-
 src/data/soudyDataset.ts                |  32 ++++++++
\`\`\`

## 20. Rizika / doporučení pro budoucnost
- V budoucnu, kdy se UI rozšíří o desítky template, bude nutné robustní error handling na chybějící proměnné přes validátor datové struktury namísto stringového indexOf checku.
- Adresy se aktuálně ukládají do "street" (u matky `exStreet`), v budoucnu může být výhodné rozsegmentovat i backend ukládání na `street`, `city`, `zip`.

---

### Future Export Architecture
V rámci přípravy na cloudové exporty doporučujeme:
Vytvořit abstraktní service `DocumentExportService`, který dostane již předžvýkaný `DocumentData` (plain object po nahrazení proměnných, avšak *před* HTML formattingem / React kompilací). Tento JSON payload je poté předáván konkrétním adapterům:
1. `GoogleDocsAdapter` (vytvoří document API request, aplikuje fonty)
2. `OneDriveAdapter` 
3. `PDFAdapter` (již teď na bázi HTML renderingu)

Integrace nevyžaduje změny v Template Engine, ale zavedení nového backend endpointu (např. `/api/export/cloud`), který si vezme `CompiledText` z frontendu, a OAuth token a zahájí stream exportu.
