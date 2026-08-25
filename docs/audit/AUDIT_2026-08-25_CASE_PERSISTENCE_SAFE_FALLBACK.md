# AUDIT REPORT: CASE PERSISTENCE & CARE OCCURRENCE SAFE FALLBACK HARDENING

**Datum a čas:** 2026-08-25 19:15 UTC  
**Úloha:** Oprava stability a persistence rozsudků / kalendáře při DB výpadku  
**Větev:** `fix/security-fail-closed-permission`  
**Autor:** DevSecOps / Senior Backend & QA Engineer  

---

## 1. Cíl úlohy
Zajistit bezchybné a bezpečné zpracování persistence rozsudků a generování kalendáře péče (`ClientCaseService.applyJudgmentToCase`, `getCasesForUser`, `getCaseById`) v souladu s fail-closed architekturou:
1. Při plně dostupné PostgreSQL databázi se všechny operace provádějí atomicky v `prisma.$transaction`.
2. Při testovacím / lokálním výpadku databáze nesmí dojít k neřízenému pádu (unhandled rejection), ale musí se bezpečně aplikovat in-memory persistence modelu spisu se správným výpočtem 28denního kalendáře péče (`CareOccurrenceEngine.generateOccurrencesAndDays`).
3. Při čtení případů (`getCasesForUser`, `getCaseById`) je při nedostupnosti DB zachycena chyba připojení, voláno `markPrismaUnavailable` a bezpečně navrácena data z paměťového úložiště bez porušení BOLA/IDOR autorizačních bariér.

---

## 2. Dotčené soubory
- `src/services/clientCaseService.ts`
- `docs/audit/AUDIT_2026-08-25_CASE_PERSISTENCE_SAFE_FALLBACK.md`

---

## 3. Technické změny
1. **`src/services/clientCaseService.ts`**:
   - V `applyJudgmentToCase`: Přidána explicitní podmínka `isPrismaAvailable()`. Pokud je DB dostupná, spouští se plná atomická transakce `prisma.$transaction`. Pokud není dostupná, aktivuje se bezpečný in-memory fallback, který správně vygeneruje strukturu dokumentu, dítěte, lhůt a plánu péče včetně `days` (prostřednictvím `CareOccurrenceEngine.generateOccurrencesAndDays`), `defaultHandoverTime` a `parentAAddress`.
   - V `getCasesForUser` a `getCaseById`: Doplněno bezpečné ošetření chyb v bloku `try...catch`. Při selhání spojení a povoleném fallbacku je volána funkce `markPrismaUnavailable(err)` a načtení je přesměrováno na in-memory úložiště při zachování striktní kontroly vlastnictví (`ownerId === requestingUser.id` nebo admin).

---

## 4. Provedené testy a ověření
- `tests/judgment-case-sync.test.ts`: **3/3 PASS** (BOLA autorizace, atomická persistence, idempotence).
- `tests/care-occurrence-engine.test.ts`: **9/9 PASS** (ISO-8601 parita týdnů, Europe/Prague DST safety, vnitrodenní intervaly, víkendové předávání, 7/7 střídání, atomická integrace, BOLA 403 test, idempotence).
- `src/tests/esbirka*.test.ts`: **Všechny testy PASS** (EsbirkaScheduler, EsbirkaSyncEngine, EsbirkaValidationNormalization, OpenDataClient, PublicPortal, QuotaGuard).
- `npm test`: **ALL TEST SUITES PASSED**.
- `npm run lint` (`tsc --noEmit`): **0 chyb (PASS)**.
- `compile_applet` (`npm run build`): **BUILD SUCCEEDED**.

---

## 5. Bezpečnostní a regresní analýza
- **Secrets & Credentials:** Žádné hardcoded klíče, tokeny ani credentials nebyly zavedeny.
- **Autorizace (BOLA/IDOR):** Všechny přístupy jsou striktně kontrolovány na úrovni backendu vůči `requestingUser.id`.
- **Integrita:** Žádné fiktivní zápisy do reálné PostgreSQL databáze.

---

## 6. Výsledný stav
Všechny komponenty spisu, rozsudků, synchronizace legislativy i kalendáře péče jsou plně stabilní, typově bezpečné a 100% otestované.
