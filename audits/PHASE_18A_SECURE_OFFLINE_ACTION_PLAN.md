# FÁZE 18A: SECURE OFFLINE ACTION PLAN

Zde je přesný postup, jak postupně a bezpečně vybudovat Offline Case Data architekturu v aplikaci.

## FÁZE 18B: Secure Storage Foundation
**Cíl:** Vytvořit prázdnou, ale bezpečnou infrastrukturu lokální databáze.
- **Závislosti:** Instalace `dexie` (nebo podobný IndexedDB wrapper) a `idb`. (Pozn.: Nesmíme používat nezabezpečené wrappery pro ukládání plain-textu).
- **Komponenty/Služby:** 
  - `src/services/offline/CryptoService.ts` (Web Crypto API, derivace PINu).
  - `src/services/offline/SecureDB.ts` (Šifrované čtení/zápis).
- **UI:** Komponenta pro nastavení a ověření `Offline PINu` v uživatelském profilu.
- **Rizika:** Vyhnutí se memory-leakům klíče. Správné čištění proměnných.
- **Acceptance:** Uživatel zadá PIN -> vygeneruje se MEK v paměti -> zapíše se zašifrovaný testovací string do IndexedDB -> lze jej přečíst jen dokud je MEK v paměti.

## FÁZE 18C: Offline Case Mode
**Cíl:** Umožnit "stažení" dat případu pro offline čtení.
- **Změny na Backendu:** Vytvoření endpointu `/api/offline/snapshot`, který bezpečně zkompletuje relevantní modely (Case, Tasks, CarePlan) do jednoho JSON balíku.
- **Změny na Frontendu:** Tlačítko "Zpřístupnit offline" v hlavičce případu. Tlačítko zavolá snapshot API a uloží data do SecureDB.
- **Data flow:** `MyCasePage.tsx` se podívá, zda jsme `navigator.onLine`. Pokud ne, ověří přítomnost MEK. Pokud MEK existuje, čte ze SecureDB.
- **Rizika:** Cache invalidation. Snapshot může být okamžitě zastaralý, jakmile jej stáhnu.

## FÁZE 18D: Synchronization (Sync Engine)
**Cíl:** Obousměrná komunikace a řešení modifikací.
- **Komponenty:** `src/services/offline/SyncEngine.ts`.
- **Implementace Fronty (Queue):** Offline editace nevyvolají `fetch`, ale vytvoří záznam do tabulky `SyncQueue` (v IndexedDB).
- **Změny na Backendu:** Nový endpoint `/api/offline/sync`, který přijímá pole `operationId` a zpracovává je přes Prisma v `$transaction`.
- **Server Authority:** Reakce na `403` a `401` během syncu.
- **Acceptance:** Pokud uživatel vytvoří úkol (Task) v letadle, úkol je vizuálně přítomen a ihned po přistání a otevření appky se na pozadí synchronizuje se serverem.

## FÁZE 18E: Security Testing
**Cíl:** Validovat ochranu dat v browseru.
- **Testy:** Vytvoření `tests/offline-security.test.ts`.
- **Akce:** 
  - Nasimulování XSS útoku zkoušejícího číst z `IndexedDB`. Očekávaný výsledek: Pouze ciphertext.
  - Simulace zneplatnění tokenu serverem (vymazání uživatele z případu). Očekávaný výsledek: `secureWipe()` zahladí lokální data.

## FÁZE 18F: E2E & PWA Validace
**Cíl:** Reálné testování UX (Playwright).
- **Testy:** Simulace "Network Offline" v prohlížeči. Ověření fungování Service Worker fallbacku v kombinaci s Offline UI stavem.

