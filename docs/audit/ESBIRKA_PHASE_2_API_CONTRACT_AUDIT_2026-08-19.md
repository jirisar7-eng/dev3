# MASTER AUDIT REPORT: E-SBÍRKA PHASE 2 – ČASOVÁ ZNĚNÍ A AKTUÁLNÍ ZÁKONY

- **Datum:** 2026-08-19
- **Fáze:** PHASE 2 – Časová znění, verze a historie právních předpisů (e-Sbírka / e-Legislativa)
- **Větev:** `feature/state-admin-ares`
- **Autor / Systém:** Senior Full-Stack Architect & AI Systems Engineer (State Administration API Hub)

---

## 1. CÍL FÁZE 2
Umožnit bezpečné získávání a správu časových znění (verzí) a aktuálních znění podporovaných právních předpisů ČR (zejm. Zákon č. 89/2012 Sb. OZ, Zákon č. 359/1999 Sb. SPOD, Zákon č. 292/2013 Sb. ZŘS, Zákon č. 99/1963 Sb. OSŘ).

Klíčové schopnosti:
1. Získání aktuálního znění podporovaných předpisů z e-Sbírky.
2. Získání a zpracování dostupných časových znění a jejich časových platností (`effectiveFrom`, `effectiveTo`, `promulgationDate`).
3. Bezpečné ukládání jednotlivých verzí bez destruktivního přepisování minulosti (`LegalActVersion` immutable snapshots).
4. Algoritmické určení platnosti a účinnosti verze k libovolnému referenčnímu datu (`CURRENT`, `PAST`, `FUTURE`).
5. Deterministická detekce změny oproti poslední synchronizované verzi na bázi SHA-256 normativního obsahu.
6. Zachování historie verzí a zpřístupnění fasády pro veřejný portál a detailní právní náhledy.
7. Dodržení principu Fail-Closed a nulového generování mock/dummy dat.

---

## 2. API ENDPOINTY A OFICIÁLNÍ ZDROJE
- **Oficiální zdroj:** Ministerstvo vnitra ČR / Digitální a informační agentura (DIA) – e-Sbírka & e-Legislativa REST API (`https://e-sbirka.gov.cz/restful-api`).
- **Ověřený základní REST endpoint:**
  - `GET /dokumenty-sbirky/{kod}` (např. `/dokumenty-sbirky/%2Fsb%2F2012%2F89`)
  - Vrácená struktura obsahuje metadata o platnosti, účinnosti a normativní znění paragrafů.
- **Mapování časových polí v payloadu:**
  - Datum vyhlášení / platnosti: `datumVyhlaseni` / `datumPlatnosti` / `promulgationDate`
  - Účinnost od: `datumUcinnostiOd` / `datumUcinnosti` / `ucinnostOd` / `effectiveFrom`
  - Účinnost do: `datumUcinnostiDo` / `ucinnostDo` / `effectiveTo`
  - Poslední novela: `datumPosledniNovely` / `datumNovely` / `lastAmendedDate`
  - Označení verze: `verze` / `cisloVerze` / `oznaceniVerze` / `versionNumber`
- **Neověřené / spekulativní endpointy:**
  - Spekulativní endpointy mimo oficiální OpenAPI specifikaci jsou přísně zakázány a izolovány.

---

## 3. IMPLEMENTACE A ZMĚNĚNÉ SOUBORY

### Změněné soubory:
1. `src/services/esbirka/validationTypes.ts`:
   - Přidány typy `VersionValidityStatus` (`'CURRENT' | 'PAST' | 'FUTURE'`), `VersionValidityInfo`, `RawEsbirkaVersion`, `ValidatedEsbirkaVersion`.
   - Rozšířen `RawEsbirkaActEnvelope` o aliasy oficiálních časových polí e-Sbírky.
   - Rozšířen `ValidatedEsbirkaAct` a `NormalizedLegalAct` o podporu časových znění a verzí.
2. `src/services/esbirka/EsbirkaValidator.ts`:
   - Zvalidovány aliasy časových a datových polí.
   - Přidáno bezpečné parsování označení verze a časových razítek.
3. `src/services/esbirka/EsbirkaNormalizer.ts`:
   - Implementována metoda `determineVersionValidity(effectiveFrom, effectiveTo, referenceDate)`.
   - Zajištěno deterministické sestavení `versionSnapshot` s SHA-256 hashem normativního textu.
4. `src/services/esbirka/EsbirkaLegalRepository.ts`:
   - Přidáno rozhraní `LegalActVersionRecord`.
   - Implementována metoda `getActVersions(actCode, referenceDate)` pro získání všech verzí seřazených sestupně podle účinnosti.
   - Implementována metoda `getActVersionDetails(actCode, versionIdOrNumber, referenceDate)` pro čtení konkrétního historického znění paragrafů.
   - Implementována metoda `determineVersionValidity`.
   - Ošetřen in-memory fallback se stabilním řazením verzí.
5. `src/services/EsbirkaService.ts`:
   - Přidány metody `getActVersions`, `getActVersionDetails`, `determineActWordingValidity`.
   - 100% lokální čtení z databáze (žádné externí volání při klientských požadavcích).
6. `src/services/esbirka/EsbirkaApiClient.ts`:
   - Zpřesněno výchozí nastavení kontextové cesty (`apiContextPath = ''`) pro doménu `api.e-sbirka.gov.cz`.
7. `src/tests/esbirkaPhase2Versions.test.ts`:
   - Nová kompletní testovací sada ověřující validitu časových znění, detekci změn, uchování historie verzí a fail-closed validaci.
8. `src/tests/runAllEsbirkaTests.ts`:
   - Integrována nová testovací sada Fáze 2 do hlavního test runneru.

---

## 4. BEZPEČNOST (SECURITY)
- **Zero Trust & Least Privilege:** Žádné přímé volání e-Sbírka API z frontendu.
- **Fail-Closed:** Při nevalidním payloadu, chybějícím klíči nebo nevalidním datu (např. 2026-02-31) dochází k okamžitému odmítnutí bez zápisu do DB.
- **Redakce citlivých údajů:** API klíče a tajné proměnné jsou striktně izolovány na serveru.
- **Imutabilita historie:** Záznamy v tabulce `LegalActVersion` jsou neměnné časové otisky; nové synchronizace nepřepisují historické verze.

---

## 5. DATABÁZOVÉ & PRISMA ZMĚNY
- **Schéma:** Existující modely v `prisma/schema.prisma` (`LegalAct`, `LegalActVersion`, `LegalActSection`, `LegalSyncAudit`, `LegalApiQuotaLog`) plně pokrývají požadavky Fáze 2.
- **Nové migrace:** ŽÁDNÉ nebyly vyžadovány (Zero unnecessary DB schema mutations).

---

## 6. VÝSLEDKY TESTŮ A VALIDACE
- **Unit & Integration testy:**
  - `src/tests/esbirkaContractPhase1.test.ts`: 17/17 PASSED
  - `src/tests/esbirkaPhase2Versions.test.ts`: 33/33 PASSED
  - `src/tests/esbirkaApiClient.test.ts`: 25/25 PASSED
  - `src/tests/esbirkaValidationNormalization.test.ts`: 15/15 PASSED
  - `src/tests/esbirkaSyncEngine.test.ts`: 49/49 PASSED
  - `src/tests/esbirkaScheduler.test.ts`: 29/29 PASSED
  - `src/tests/esbirkaPublicPortal.test.ts`: 20/20 PASSED
  - **Celkem:** 144/144 PASSED (0 FAILED)
- **TypeScript Check (TSC):** `tsc --noEmit` – PASSED (0 errors).
- **Build:** `compile_applet` – PASSED (Vite production build succeeded).

---

## 7. DIFF & VERIFIKACE STAVU
- **Regrese:** 0 regresí ve stávajících modulech.
- **Known Issues:** Žádné blokující problémy.

---

## 8. DOPORUČENÍ PRO DALŠÍ FÁZI
- Pokračovat v **PHASE 3 – VEŘEJNÝ PORTÁL A ČASOVÁ OSA PŘEDPISŮ (UI & TIMELINE)**.
- Zpřístupnit přepínání časových znění (např. platné znění k 2014 vs. novelizované znění k 2025/2026) ve veřejném zobrazení portálu `tata-ma-pravo`.
- Zachovat přísné oddělení klientských dotazů (pouze čtení z lokální PostgreSQL / repository).
