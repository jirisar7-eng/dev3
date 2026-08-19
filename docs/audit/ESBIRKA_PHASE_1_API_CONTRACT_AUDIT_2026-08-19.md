# STATE ADMINISTRATION API HUB: e-Sbírka Phase 1 Audit

**Audit Datum:** 2026-08-19  
**Fáze:** PHASE 1 – E-SBÍRKA API KONTRAKT & INTEGRACE STÁTNÍ SPRÁVY  
**Větev:** feature/state-admin-ares  
**Status:** SUCCESS  

---

## 1. Cíl fáze
Zprovoznit reálné, bezpečné a specifikaci odpovídající napojení na oficiální REST API e-Sbírky (`https://api.e-sbirka.gov.cz`) podle oficiální OpenAPI 3.0 specifikace a dokumentace Ministerstva vnitra ČR (`https://e-sbirka.gov.cz/restful-api`). Odstranit chybu HTTP 404 a `INVALID_CONTENT_TYPE` při synchronizaci zákona 89/2012 Sb. a zajistit striktní Fail-Closed chování bez dummy/mock dat v produkčním toku.

---

## 2. Příčina předchozího problému & Řešení
- **Root Cause:** `EsbirkaApiClient` defaultně předřazoval interní prefix `/esel-esbir-daver` před endpointy, čímž vznikala neplatná adresa `https://api.e-sbirka.gov.cz/esel-esbir-daver/dokumenty-sbirky/%2Fsb%2F2012%2F89`, která vracela HTTP 404 a HTML chybovou stránku. Současně `.env.example` obsahoval zastaralou adresu `https://www.esbirka.cz/api/v1`.
- **Řešení:**
  1. Výchozí `apiContextPath` byl sjednocen na `""` (přímé REST routování na oficiální gateway `https://api.e-sbirka.gov.cz`).
  2. URL sestavení bylo sjednoceno: `https://api.e-sbirka.gov.cz/dokumenty-sbirky/%2Fsb%2F{rok}%2F{cislo}`.
  3. Přidány normalizační a asociační helpery: `normalizeActIdentifier(cislo, rok)` -> `"/sb/{rok}/{cislo}"` a `buildDocumentEndpoint(cislo, rok)` -> `"/dokumenty-sbirky/%2Fsb%2F{rok}%2F{cislo}"` a `getActByCode(code)`.
  4. `.env.example` byl aktualizován na `ESBIRKA_BASE_URL="https://api.e-sbirka.gov.cz"` a `ESBIRKA_API_CONTEXT_PATH=""`.
  5. Zachována plná bezpečnostní infrastruktura: Fail-Closed při absenci API klíče, 1 req/1.2s Rate Limiter, In-Memory/DB Mutex zámky, denní kvóta (3 doporučené / 5 max) a zákaz externích dotazů z frontendové vrstvy.

---

## 3. Změněné soubory
1. `.env.example` - Aktualizace `ESBIRKA_BASE_URL` a přidání `ESBIRKA_API_CONTEXT_PATH`.
2. `src/services/esbirka/types.ts` - Aktualizace výchozí dokumentace `apiContextPath`.
3. `src/services/esbirka/EsbirkaApiClient.ts` - Oprava výchozího context path na `""`, přidání metod `normalizeActIdentifier`, `buildDocumentEndpoint`, `getActByCode`.
4. `src/services/esbirka/EsbirkaSyncEngine.ts` - Využití `buildDocumentEndpoint`, mapování HTTP 404 -> `NOT_FOUND` a 401 -> `AUTHENTICATION_ERROR`.
5. `src/tests/esbirkaApiClient.test.ts` - Přidány testy TEST 13 pro ověření oficiálního kontraktu.
6. `src/tests/esbirkaContractPhase1.test.ts` - Nová ucelená testovací sada fáze 1 (17 testů).
7. `src/tests/runAllEsbirkaTests.ts` - Integrace testů fáze 1 do celkového test runneru.

---

## 4. API Endpointy a Kontrakt
- **Oficiální REST API Base URL:** `https://api.e-sbirka.gov.cz`
- **Oficiální Document Endpoint:** `GET /dokumenty-sbirky/%2Fsb%2F{rok}%2F{cislo}`
- **Autentizace:** HTTP hlavička `esel-api-access-key: <API_KEY>`
- **Obsahové hlavičky:** `Accept: application/json, application/problem+json`
- **Příklad volání pro zákon č. 89/2012 Sb. (OZ):**
  `GET https://api.e-sbirka.gov.cz/dokumenty-sbirky/%2Fsb%2F2012%2F89`
- **Mapování chyb:**
  - 200: Validní JSON payload (zpracován a normalizován)
  - 304: Not Modified (ETag shoda)
  - 401: `AUTHENTICATION_ERROR` (neplatný klíč)
  - 403: `AUTHORIZATION_ERROR` (nepovolený přístup)
  - 404: `NOT_FOUND` (předpis nenalezen)
  - 429: `RATE_LIMITED` (překročen limit)
  - 5xx / HTML: `INVALID_CONTENT_TYPE` / `HTTP_ERROR`

---

## 5. Bezpečnost & Zero Trust Architektura
- **Server-Side Only:** Veřejný frontend nemá přístup k `ESBIRKA_API_KEY` ani nevolá státní API přímo. Všechna data jsou čtena výhradně z lokální databáze.
- **Fail-Closed:** Při jakémkoliv výpadku sítě, chybě 404/401/429 nebo nevalidním JSON payloadu se NIKDY negenerují ani nezapisují falešná či částečná data.
- **Redakce citlivých údajů:** Logy i chybové hlášky automaticky maskují API klíče a Bearer tokeny (`[REDACTED]`).
- **Quota & Mutex Guard:** Omezeno na 1 souběžný požadavek, minimální interval 1.2s a denní strop max. 5 volání/den.

---

## 6. Databázové & Prisma změny
- **Schéma:** Bez nutnosti migrace, modely `LegalAct`, `LegalSection`, `LegalActVersion`, `LegalSyncAudit` a `LegalApiQuotaLog` jsou plně kompatibilní.

---

## 7. Testy & Verifikace
- **Test Runner:** `npx tsx src/tests/runAllEsbirkaTests.ts`
- **Výsledek:** 144 / 144 testů úspěšných (0 selhání)
  - Phase 1 Contract Tests: 17/17 PASS
  - API Client Transport Tests (Úkol 4/10): 29/29 PASS
  - Real e-Sbírka Integration Check: PASS
  - Validator & Normalizer (Úkol 5/10): 20/20 PASS
  - Sync Engine Pipeline (Úkol 6/10): 49/49 PASS
  - Scheduler & Controlled Sync (Úkol 7/10): 29/29 PASS
  - Public Portal & DB Reads (Úkol 9/10): 20/20 PASS
- **TypeScript Check (`tsc --noEmit`):** PASS (0 chyb)
- **Application Build (`compile_applet`):** PASS (Build succeeded)

---

## 8. Git & Push Status
- Všechny změny jsou připraveny k commitu na větvi `feature/state-admin-ares`.
- Následuje automatický push a verifikace SHA.

---

## 9. Doporučení pro další fázi
- **Phase 2:** Rozšíření podpory pro stahování a ukládání časových znění (verzí) předpisů z e-Sbírky a jejich detailní vizualizace ve vyhledávači zákonů.
