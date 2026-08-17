# Diagnostický Audit e-Sbírka API
**Datum:** 17. srpna 2026  
**Oblast:** Diagnostika endpointů, Base URL, Context Path a Autentizace e-Sbírka REST API  
**Verze dokumentu:** 1.0  
**Autor:** Seniorní Backend Vývojář & QA Auditor  

---

## 1. Porovnání: Oficiální Specifikace vs. Současná Implementace

Níže je uvedeno detailní porovnání oficiální RESTful specifikace e-Sbírka API (dostupné na adrese `https://e-sbirka.gov.cz/restful-api`) se současným stavem našeho klientského kódu (`EsbirkaApiClient.ts`) a environmentální konfigurací (`.env.example` / `.env`):

### A. Base URL (Základní doména)
*   **Oficiální specifikace:** `https://api.e-sbirka.gov.cz`
*   **Náš `EsbirkaApiClient.ts`:** Výchozí fallback v kódu je sice nastaven na správnou oficiální doménu `https://api.e-sbirka.gov.cz`, avšak načítá hodnotu z environmentální proměnné `ESBIRKA_BASE_URL`.
*   **Náš `.env.example`:** Definuje `ESBIRKA_BASE_URL="https://www.esbirka.cz/api/v1"` (respektive `https://e-sbirka.cz/api/v1` v reálném prostředí), což vede ke permanentnímu přesměrování (HTTP 308) na vládní doménu a případným chybám v transportní vrstvě.

### B. Context Path (Kontextový prefix)
*   **Oficiální specifikace:** Žádný explicitní context path se pro veřejné klientské dotazy neuvádí. Brána (API Gateway) automaticky směruje požadavky na základě cílových endpointů.
*   **Náš `EsbirkaApiClient.ts`:** Výchozí nastavení context path v kódu je `/esel-esbir-daver`. Tento prefix se automaticky připojuje za `baseUrl`.
    *   *Důsledek:* Připojení tohoto prefixu v klientské aplikaci vytváří neexistující cesty (404) nebo po zpracování bránou způsobuje duplikaci prefixů na interních serverech (např. `/esel-esbir-daver/esel-esbir-daver/...`), což vede k chybám.

### C. Autentizace
*   **Oficiální specifikace:** Autentizace probíhá výhradně zasláním vygenerovaného tajného klíče v hlavičce:
    ```http
    esel-api-access-key: <Váš_API_Klíč>
    ```
*   **Náš `EsbirkaApiClient.ts`:** Hlavička je implementována naprosto správně: `'esel-api-access-key': this.apiKey`. Kód striktně odmítá odesílání jiných nekompatibilních hlaviček jako `Authorization Bearer` či `X-API-KEY`, čímž plně odpovídá oficiální specifikaci.

### D. Endpoint a Cesta pro Předpis (Zákon) 89/2012 Sb.
*   **Oficiální specifikace:** Pro vyhledání konkrétního dokumentu sbírky (např. Občanského zákoníku - zákon č. 89/2012 Sb.) slouží endpoint:
    ```
    /dokumenty-sbirky/{kodDokumentuSbirky}
    ```
    Identifikátor předpisu `/sb/2012/89` musí být předán v URL-encoded formátu: `%2Fsb%2F2012%2F89`.
*   **Náš `EsbirkaApiClient.ts`:** Metoda `getAct` má napevno zadrátovaný nesprávný a neoficiální endpoint `/predpisy/${actYear}/${actNumber}`, což na produkční bráně okamžitě selhává s chybou `404 Not Found`.

---

## 2. Přesné a Správné URL pro Dotaz na Zákon 89/2012 Sb.

Pro stažení dat a struktury zákona **89/2012 Sb.** (Občanský zákoník) musí být sestaveno a odesláno následující konkrétní, plně kvalifikované a oficiální URL s příslušnou hlavičkou:

### Oficiální URL:
```
https://api.e-sbirka.gov.cz/dokumenty-sbirky/%2Fsb%2F2012%2F89
```

### Struktura HTTP požadavku:
```http
GET /dokumenty-sbirky/%2Fsb%2F2012%2F89 HTTP/1.1
Host: api.e-sbirka.gov.cz
esel-api-access-key: [REDACTED_API_KEY]
Accept: application/json, application/problem+json
User-Agent: TataMaPravo-LegislativeSync/1.0
```

---

## 3. Doporučený Akční Plán pro Budoucí Opravu

Pro budoucí plnou zprovoznění integrace se doporučuje provést následující ne-destruktivní změny (v tomto auditu nebyly zavedeny do kódu, kód zůstává 100% neporušen):
1.  **Sjednocení proměnných v `.env`:** Nastavit `ESBIRKA_BASE_URL` na `https://api.e-sbirka.gov.cz`.
2.  **Vynulování context path:** Nastavit `ESBIRKA_API_CONTEXT_PATH` na prázdný řetězec `""` pro eliminaci duplicity.
3.  **Oprava skládání cest v `getAct`:** Upravit metodu `getAct` na sestavení endpointu `/dokumenty-sbirky/%2Fsb%2F${actYear}%2F${actNumber}`.
