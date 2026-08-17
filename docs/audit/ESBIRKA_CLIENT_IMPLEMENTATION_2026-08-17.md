# IMPLEMENTACE BEZPEČNÉHO REST API KLIENTA e-SBÍRKA / e-LEGISLATIVA
**Projekt:** dev3.tatovacesta.cz (dev3)  
**Dokument:** `docs/audit/ESBIRKA_CLIENT_IMPLEMENTATION_2026-08-17.md`  
**Datum:** 17. srpna 2026  
**Autor:** Hlavní architekt & Bezpečnostní auditor projektu „Táta má právo“  
**Úkol:** ÚKOL 4/10 — Bezpečný REST API klient e-Sbírka / e-Legislativa  
**Stav:** DOKONČENO (STRIKTNÍ TRANSPORTNÍ VRSTVA)

---

## 1. Executive Summary & Architektonické vymezení

V rámci Úkolu 4/10 byla vytvořena izolovaná, enterprise-grade server-side transportní vrstva pro komunikaci s REST API e-Sbírka / e-Legislativa Ministerstva vnitra ČR:
- **`src/services/esbirka/types.ts`** — Typové definice, error kódy, konfigurace a odpovědní obálky.
- **`src/services/esbirka/errors.ts`** — Bezpečná třída `EsbirkaApiError` s automatickou sanitizací secretů.
- **`src/services/esbirka/EsbirkaApiClient.ts`** — Vlastní transportní klient s mutexem souběžnosti, rate limiterem, URL validátorem a validátorem obsahu.
- **`src/services/esbirka/index.ts`** — Veřejný exportní modul.
- **`src/tests/esbirkaApiClient.test.ts`** — Komplexní unit testovací sada s 100% in-memory mockem.

### Zásadní záruky a mantinely:
1. **Nulový kontakt se skutečným API v tomto kroku:** Žádné reálné API volání nebylo a nesmí být provedeno.
2. **Čistá transportní vrstva:** Klient neprovádí žádný zápis do PostgreSQL ani dbStore. Pouze přijme požadavek, zvaliduje ho, zprostředkuje HTTP transport, zkontroluje integritu těla odpovědi a vrátí typovaný výsledek `EsbirkaApiResponse<T>`.
3. **Fail-Closed zásada:** Při jakékoliv chybě (chybějící klíč, neplatná URL, HTTP 500, HTML odpověď, nevalidní JSON, timeout) klient okamžitě selže chybou `EsbirkaApiError`. Je přísně zakázáno generovat falešná či offline dummy data.

---

## 2. Bezpečnostní mechanismy (Security & Hardening)

### A. Ochrana API klíče a Server-Side Only architektura
- Klíč `ESBIRKA_API_KEY` je načítán výhradně z `process.env.ESBIRKA_API_KEY`.
- Třída `EsbirkaApiClient` při inicializaci kontroluje prostředí (`typeof window === 'undefined'`). Pokud by byla importována na frontendu, okamžitě vyhodí výjimku.
- **Sanitizace chybových zpráv:** Metoda `EsbirkaApiError.sanitizeMessage` automaticky filtruje veškeré regulární výrazy odpovídající `Bearer ...`, `X-API-KEY: ...`, `apiKey: ...` a nahrazuje je značkou `[REDACTED]`.
- V logovacím výstupu se tisknou pouze metadata: `requestId`, `endpoint`, `httpStatus`, `durationMs`, `responseBytes`.

### B. Validace HTTPS a SSRF ochrana
Metoda `EsbirkaApiClient.validateAndNormalizeUrl` provádí striktní audit základní URL adresy:
- Povoluje výhradně protokol `https:`.
- **SSRF ochrana:** Odmítá `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `.local`, `.internal` a privátní IP rozsahy (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`).
- Odmítá dynamické URL předávané od koncových uživatelů.

### C. Autentizační hlavičky
V souladu se schválenou projektovou konfigurací a specifikací e-Sbírky klient do požadavku transparentně vkládá:
```http
Authorization: Bearer <ESBIRKA_API_KEY>
X-API-KEY: <ESBIRKA_API_KEY>
Accept: application/json, application/problem+json
User-Agent: TataMaPravo-LegislativeSync/1.0 (dev3.tatovacesta.cz)
If-None-Match: <etag> (volitelně při inkrementální kontrole)
```

---

## 3. Transportní politika (Request Policy & Limits)

### A. Zámek souběhu (Mutex Lock)
- Státní API povoluje maximálně **1 souběžné připojení**.
- Klient implementuje statickou frontu `EsbirkaApiClient.mutexQueue`, která zaručuje, že se žádné dva požadavky nebudou v rámci Node.js procesu provádět paralelně. Případné `Promise.all` je na úrovni klienta zřetězeno do sekvence.

### B. Pauza mezi požadavky (Inter-request Delay)
- API vyžaduje maximálně 1 požadavek za sekundu.
- Klient vynucuje minimální interval `minIntervalMs = 1200 ms` (1,2 sekundy), což odpovídá bezpečné frekvenci 0,83 req/s.

### C. Zákaz automatického opakování (Zero Auto-Retry)
- **Výchozí stav:** `0 automatických retry`.
- Vzhledem k limitu 3–5 volání denně nesmí transportní klient sám opakovat neúspěšná volání (hrozil by retry storm). Případné opakování bude řízeno výhradně synchronizačním enginem v Úkolu 6/10 po ověření stavu denní kvóty.

### D. Explicitní Timeout (20 sekund)
- Každý požadavek je chráněn přes `AbortController` s výchozím limitem **20 000 ms**.
- **Zdůvodnění:** Plné znění rozsáhlých kodexů (např. Občanský zákoník č. 89/2012 Sb. se 3000+ paragrafy) může při vytížení státních serverů generovat odpověď několik sekund. Limit 20 s poskytuje bezpečnou rezervu, ale zároveň chrání server před zablokováním vlákna visícím spojením.

### E. Ochrana proti přetečení paměti (Response Size Limit: 10 MB)
- Tělo odpovědi je limitováno na **10 485 760 bajtů (10 MB)**.
- **Zdůvodnění:** Běžný rozsáhlý zákon v JSON formátu má 2–4 MB. Limit 10 MB spolehlivě pojme i největší předpisy české legislativy, ale chrání Node.js před paměťovým vyčerpáním (OOM) v případě poškozeného streamu nebo Denial-of-Service.

---

## 4. Validace odpovědi a chybový model

Před předáním odpovědi do vyšších vrstev klient ověřuje:
1. **HTTP Status:** 200–299 (úspěch) nebo 304 (Not Modified). Všechny ostatní stavy (401, 403, 429, 500, 502, 503) vyvolají příslušný `EsbirkaApiError`.
2. **Content-Type:** Musí obsahovat `application/json` (nebo `application/problem+json`). HTML chybové stránky (např. Cloudflare/Nginx 502) jsou okamžitě odmítnuty jako `INVALID_CONTENT_TYPE`.
3. **Validita JSONu:** Tělo je parsováno přes `JSON.parse` s odchycením chyb syntaxe (`INVALID_JSON`).
4. **Strukturální validita obálky:** Výsledek musí být objekt nebo pole, nikoliv prázdný řetězec či primitivum (`INVALID_RESPONSE`).
5. **SHA-256 Hash:** Pro každé úspěšné tělo je vypočten deterministický hash `rawBodyHash` pro potřeby detekce změn ve verzovacím systému.

### Matice chybových kódů (`EsbirkaErrorCode`):
| Kód | Důvod vyvolání |
|---|---|
| `CONFIGURATION_ERROR` | Neplatná URL, nepovolený protokol (HTTP), SSRF cíl nebo spuštění na frontendu. |
| `AUTHENTICATION_ERROR` | Chybějící `ESBIRKA_API_KEY` nebo serverem vrácený HTTP 401. |
| `AUTHORIZATION_ERROR` | Nedostatečná oprávnění na straně API (HTTP 403). |
| `RATE_LIMITED` | Překročení limitu na straně serveru (HTTP 429). |
| `TIMEOUT` | Vypršení 20s limitu spojení (přerušeno přes AbortController). |
| `NETWORK_ERROR` | Výpadek TCP spojení, DNS selhání, SSL error. |
| `HTTP_ERROR` | Ostatní serverové chyby (HTTP 500, 502, 503). |
| `INVALID_CONTENT_TYPE` | Server vrátil HTML stránku, text nebo binární soubor místo JSONu. |
| `INVALID_JSON` | Neplatná syntaxe JSON těla odpovědi. |
| `INVALID_RESPONSE` | Prázdná odpověď nebo neplatná datová struktura. |
| `RESPONSE_TOO_LARGE` | Tělo odpovědi překročilo bezpečnostní limit 10 MB. |
| `UNKNOWN_ERROR` | Neošetřená vnitřní výjimka. |

---

## 5. Výsledky testů transportní vrstvy (`src/tests/esbirkaApiClient.test.ts`)

Byla spuštěna kompletní sada testů ověřující všechny výše uvedené invarianty výhradně s in-memory mockem:

```text
--- STARTING ÚKOL 4/10: e-SBÍRKA API CLIENT UNIT TEST SUITE ---
✅ PASS: TEST 1: Missing API key fails closed with AUTHENTICATION_ERROR
✅ PASS: TEST 2: Correctly rejected Non-HTTPS protocol: http://www.esbirka.cz/api
✅ PASS: TEST 2: Correctly rejected Localhost rejection: http://localhost:3000
✅ PASS: TEST 2: Correctly rejected Loopback IPv4 rejection: https://127.0.0.1/api
✅ PASS: TEST 2: Correctly rejected Wildcard address rejection: https://0.0.0.0/api
✅ PASS: TEST 2: Correctly rejected FTP protocol rejection: ftp://www.esbirka.cz/api
✅ PASS: TEST 2: Correctly rejected Javascript pseudo-protocol rejection: javascript:alert(1)
✅ PASS: TEST 2: Correctly rejected Private network CIDR rejection: https://192.168.1.1/api
✅ PASS: TEST 2: Valid HTTPS URL correctly normalized
✅ PASS: TEST 3: Returns HTTP 200
✅ PASS: TEST 3: Successfully parsed data payload
✅ PASS: TEST 3: Extracts ETag correctly
✅ PASS: TEST 3: Generates valid SHA-256 payload hash
✅ PASS: TEST 3: Bearer token sent to upstream
✅ PASS: TEST 3: X-API-KEY header sent to upstream
✅ PASS: TEST 4: HTTP 500 throws HTTP_ERROR with status 500 (Fail-Closed, 0 DB write)
✅ PASS: TEST 5: HTML response rejected with INVALID_CONTENT_TYPE
✅ PASS: TEST 6: Broken JSON rejected with INVALID_JSON
✅ PASS: TEST 7: Payload exceeding limit rejected with RESPONSE_TOO_LARGE
✅ PASS: TEST 8: Timeout triggers TIMEOUT error code
✅ PASS: TEST 9: HTTP 429 produces RATE_LIMITED error
✅ PASS: TEST 10: Mutex queue strictly serializes calls (Max concurrent observed: 1, expected: 1)
✅ PASS: TEST 11: Error messages automatically sanitize and redact secret tokens

=== ÚKOL 4/10 TEST RESULTS ===
Passed: 23
Failed: 0
VERDICT: ALL TESTS PASSED - API CLIENT TRANSPORT LAYER VERIFIED
```

---

## 6. Vyhodnocení BLOCKERŮ

- **BLOCKERy:** **ŽÁDNÉ (0).**
- Transportní klient je bezpečný, odolný, plně typovaný a připravený pro napojení na validační a synchronizační vrstvu.

---

## 7. Doporučení a návrh pro ÚKOL 5/10

V navazujícím **ÚKOLU 5/10** (Validátor a parser odpovědí e-Sbírky) doporučujeme:
1. Implementovat doménový parser, který převede surovou strukturu JSONu z e-Sbírky na entity `LegalAct` a `LegalActSection`.
2. Ošetřit hierarchii odstavců, písmen a bodů paragrafů se zachováním normativního formátování.
3. Připravit automatické značkování klíčových opatrovnických paragrafů (`isKeySection: true` pro § 858, § 888, § 887, § 907 OZ a § 19, § 9a zOSPOD).
4. Všechny testy v Úkolu 5/10 budou opět prováděny výhradně nad statickými JSON fixturami bez volání externího API.
