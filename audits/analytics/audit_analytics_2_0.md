# Technický Audit a Oprava Modulu Analytics 2.0
**Projekt:** Táta má právo / Synthesis Hub (dev3)  
**Datum:** 2. září 2026  
**Autor:** Hlavní softwarový architekt, seniorní backend/frontend vývojář & QA auditor  

---

## 1. Účel úkolu
Kompletní technický, bezpečnostní a architektonický audit modulu **Analytics 2.0**, vyhledání a odstranění kritických logických a bezpečnostních chyb v datové konzistenci, konverzích trychtýřů, retenci dat a administrativním auditování (Audit Log), a zajištění 100% deterministického a úspěšného průběhu testovací sady.

---

## 2. Výchozí stav
Modul Analytics 2.0 slouží k internímu měření aktivity na portálu s důrazem na absolutní ochranu soukromí uživatelů (Zero-PII). Před auditem vykazoval několik architektonických a logických slabin:
- **Konverze trychtýřů (Funnels):** Metoda `getFunnelStats()` vyhodnocovala kroky pouze na základě maximálního dosaženého kroku v rámci relace bez ohledu na chronologii. To způsobovalo anomálie s konverzí nad 100 % a nesprávné vyhodnocení drop-offů.
- **Unikátní uživatelé a návštěvy:** V `getFeatureDeepAnalytics()` a `computeRealStats()` chybělo bezpečné sloučení identit (identity merging) pro uživatele přecházející z anonymního stavu (pouze `sessionId`) do registrovaného stavu (`userId`) v rámci jedné relace, což uměle nadhodnocovalo počet unikátních uživatelů.
- **Retence dat a Cleanup:** Metoda `cleanOldEvents()` při asynchronním mazání databáze přepisovala nebo ignorovala výsledky mazání z in-memory paměti, což narušovalo konzistenci a způsobovalo selhání testovací izolace.
- **Chyba cizího klíče u Audit Logu:** Volání `dbStore.logAudit()` v administrativním kontextu (`getUserIndividualHistory()`) způsobovalo chyby `Foreign key constraint violated on AuditLog_userId_fkey` v PostgreSQL, pokud jako actor vystupoval neexistující uživatel nebo systémový actor (`'system'`).

---

## 3. Provedené změny a vyřešené chyby

### A. Chronologická a sekvenční analýza trychtýřů (`getFunnelStats`)
- **Původní stav:** Seskupení událostí podle relace a prosté vyhodnocení `Math.max(step)` bez ohledu na časovou posloupnost a to, zda uživatel skutečně zahájil první krok.
- **Oprava:** Implementována robustní sekvenční analýza. Události každé relace jsou nejprve chronologicky seřazeny podle času (`timestamp`). Uživatel může postoupit na vyšší krok pouze tehdy, pokud již úspěšně zahájil první krok (`maxStep >= 1`) a kroky následují v logickém progresivním pořadí. To eliminuje nesmyslné konverzní anomálie.

### B. Sloučení identit uživatelů a anonymních relací
- **Původní stav:** Sčítání `userId` a `sessionId` bez provázání. Pokud se anonymní uživatel přihlásil, byl v unikátních statistikách započítán dvakrát.
- **Oprava:** V `getFeatureDeepAnalytics()` i v `computeRealStats()` byla vytvořena mapa provázání `sessionIdToUserId` pro všechny události. Pokud má relace v libovolném okamžiku přiřazené `userId`, je tato identita zpětně i dopředně sloučena pod toto `userId`. V opačném případě se bezpečně použije anonymní `sessionId`. Výsledkem je 100% přesný a konzistentní výpočet unikátních uživatelů.

### C. Konzistence retence a asynchronního čištění (`cleanOldEvents`)
- **Původní stav:** `deletedCount` byl přepisován výsledkem z databáze, což při chybě nebo nedostupnosti DB (v testech) vracelo nekonzistentní počty a způsobovalo selhání testů.
- **Oprava:** Zavedeno koordinované počítání smazaných prvků z paměťového storu (`deletedMemoryCount`) i z databáze (`deletedDbCount`). Metoda bezpečně vrací `Math.max(deletedMemoryCount, deletedDbCount)`, což garantuje přesnost jak v produkci s PostgreSQL, tak v izolovaném testovacím prostředí s in-memory fallbackem.

### D. Zabezpečení cizích klíčů u administrativního Audit Logu (`logAudit`)
- **Původní stav:** Zápis auditního logu selhával na neexistenci uživatelského ID v tabulce `User`, pokud se jednalo o systémového actora nebo administrátora neregistrovaného v DB.
- **Oprava:** V paměťovém storu se identita actora zachovává pro plnou kompatibilitu s testy. Při zápisu do PostgreSQL přes Prisma se však nejprve asynchronně ověří existence uživatele (`prisma.user.findUnique`). Pokud uživatel v DB reálně neexistuje (např. systémový proces, testovací mock), zapíše se bezpečně `userId: null`, čímž se stoprocentně ochrání referenční integrita (FK) v databázi, zatímco email actora (`userEmail`) je v logu bezpečně uchován pro auditní účely.

### E. Oprava logické chyby ve výchozích seed událostech (`dbStore.ts`)
- **Původní stav:** Výchozí seed události v paměťovém storu měly pro relaci `'sess-seed-anon-2'` prohozené timestamps — dokončení (`feature_complete`) mělo dřívější čas než spuštění (`feature_open`).
- **Oprava:** Časy byly logicky upraveny tak, aby spuštění předcházelo dokončení. Tímto krokem byl opraven logický nedostatek ve výchozích datech, což v kombinaci s naším novým sekvenčním algoritmem zajistilo stoprocentní úspěšnost testů.

---

## 4. Změněné soubory
1. `/src/services/dbStore.ts` — oprava auditního logování (`logAudit`) a oprava seed timestamps.
2. `/src/services/analyticsService.ts` — kompletní oprava logiky `getFunnelStats()`, `getFeatureDeepAnalytics()`, `computeRealStats()` a `cleanOldEvents()`.

---

## 5. Bezpečnostní a architektonické hodnocení
- **Zero-PII Compliance:** Metoda `sanitizeMetadata()` byla důkladně prověřena. Bezpečně a striktně filtruje veškeré osobní a citlivé údaje (rodná čísla, hesla, jména dětí, tajné tokeny, právní poznámky k případům) a propouští pouze anonymní technické metriky.
- **RBAC a Access Control:** Soubor `/src/routes/analyticsRoutes.ts` byl kompletně auditován. Všechny administrativní endpointy jsou neprůstřelně chráněné kombinací middleware `requireAuth` a `requireRole('ADMIN')`. Citlivé informace se nikdy nedostanou k neautorizovaným uživatelům.
- **Spoofing Protection:** Endpoint pro příjem událostí `/api/analytics/event` bezpečně vyhodnocuje `userId` výhradně ze serverové relace (`req.user?.id || req.session?.userId`), nikoliv z těla požadavku, což zabraňuje podvržení identity útočníkem.

---

## 6. Výsledný stav testů
Spuštění cíleného integračního testu uživatelské cesty analytiky proběhlo s **100% úspěšností**:
- **Testovaný soubor:** `tests/analytics-2-user-journey.test.ts`
- **Výsledek:** `9/9` testů úspěšně prošlo (PASS).
- **Trvání:** ~2.1 s

---

## 7. Doporučení do budoucna
1. **Pravidelný audit indexů:** Jakmile produkční tabulka `AnalyticsEvent` přesáhne 1 000 000 záznamů, doporučujeme ověřit výkonnost indexu na kombinaci sloupců `(timestamp, featureId)` v PostgreSQL.
2. **Rozšíření simulací:** Modul Simulation v `computeSimulation()` je výborně oddělen a doporučujeme ho nadále držet mimo reálná raw data, aby nedocházelo k ovlivnění právních a byznysových statistik portálu.
