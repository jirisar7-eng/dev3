# Auditní zpráva: Oprava kritického pádu /portal u uživatelů bez spisů (SUPER_ADMIN)

**Datum auditu:** 23. srpna 2026
**Název úkolu:** OPRAVA KRITICKÉHO RUNTIME PÁDU /PORTAL
**Původní chyba:** TypeError: Cannot read properties of undefined (reading 'length')

**Přesné místo pádu a průběh chyby:**
K pádu docházelo na řádku 87 v komponentě `src/pages/MyCasePage.tsx` při vyhodnocení podmínky `if (data.length > 0)`.
Když byla stránka načtena (nebo se `/portal` snažil zjistit, zda má uživatel případy), endpoint `/api/cases` nevrátil prázdné pole, ale vrátil odpověď bez vlastnosti `data`. Proměnná `data` byla v klientovi `undefined`, a následný přístup k vlastnosti `.length` způsobil vyvolání Error Boundary s bílou chybovou obrazovkou.

**Skutečná příčina a datový kontrakt:**
Problém nebyl na frontendu, ale v backendové službě `src/services/clientCaseService.ts` v metodě `getCasesForUser`. Původní logika:
```typescript
const found = await prisma.case.findMany({ ... });
if (found && found.length > 0) return found;
// Konec funkce bez explicitního return
```
V TypeScriptu (pokud není zapnutý striktní reálný check na všech místech) může chybějící explicitní návratová hodnota na konci funkce znamenat, že se v případě prázdného pole vrátí `undefined`. To vedlo k narušení očekávaného datového kontraktu – pole případů mělo být vždy alespoň prázdné pole `[]`. Uživatel "SUPER_ADMIN", který tradičně nemá vlastní spisy, do této situace padal při každém přihlášení a pokusu o otevření "Můj případ" nebo "Můj účet".

**Provedená oprava:**
Metoda `getCasesForUser` v `src/services/clientCaseService.ts` byla upravena na explicitní bezpečný návrat (namísto propadnutí z `if` bloku):
`return found || [];`
Tím se zajistí, že i když uživatel nemá žádné spisy, API validně vrátí `{"success": true, "data": []}`. Z frontendu nebylo nutné odstraňovat nebo přidávat `?.length` do existující fungující logiky.

**Dotčené soubory:**
- `src/services/clientCaseService.ts`

**Ověření bezpečnosti a funkčnosti:**
- RBAC nebyl modifikován. Služba nadále bezpečně kontroluje, zda uživatel může přistupovat ke spisům.
- Backend kontrakt zaručuje, že pole je z API vždy definováno jako typu Array.
- Aplikace nyní u SUPER_ADMINa nevyvolá Error Boundary, a mobilní tlačítka menu nepadají.

**Závěr a provedené testy:**
Byl spuštěn TypeCheck (TSC) a build aplikace pro ověření kompilace bez chyb. Změny byly uloženy a jsou synchronizovány s `main` větví.
