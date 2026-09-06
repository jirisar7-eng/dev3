# MASTER-IMPLEMENT-05A: MAPA INSTITUCÍ A PORADEN — VERIFIED PROFILE & GEOCODE SECURITY

**Projekt:** Táta má právo / Synthesis Hub  
**Repo:** `jirisar7-eng/dev3`  
**Datum:** 2026-09-06  
**Status:** ✅ IMPLEMENTOVÁNO & OVĚŘENO (PASS)  
**Autor:** Hlavní architekt & DevSecOps ekosystému Synthesis  
**Scope:** Pouze GAP-01 (Mapa Detail Verified Profile) a GAP-03 (Geocode Rate Limiting & Auth Hardening)

---

## 1. Souhrn implementace

V souladu se striktním rozsahem úkolu MASTER-IMPLEMENT-05A a auditem MASTER-AUDIT-05 byly bezpečně implementovány a otestovány výhradně dva zjištěné bezpečnostní a funkční nedostatky:

1. **GAP-01 (Detail mapy — Verified Profile integration):**
   - Do modálního okna detailu subjektu v `src/components/public/MapaSubjektuView.tsx` bylo napojeno zobrazení existujícího veřejného profilu `verifiedProfile` (`SubjectVerifiedProfile`).
   - Zobrazují se výhradně veřejně bezpečná data ověřeného subjektu (stav `VERIFIED` nebo `STALE`):
     - **Úřední / otevírací hodiny:** strukturovaný týdenní přehled (Pondělí–Neděle) s formátovanými časovými intervaly (převod ze stringifikovaného JSONu či objektu) a badge „Zavřeno“ pro dny bez úředních hodin.
     - **Nutnost objednání:** jasný příznak „Vyžadováno předem“ vs. „Není vyžadováno“.
     - **Online rezervace:** bezpečně validovaná a sanitizovaná URL adresa (`safeBookingUrl`, povolující výhradně protokoly `http://` a `https://`, odmítající `javascript:`, `data:` a jiné potenciálně škodlivé schémata).
     - **Bezbariérovost:** textová specifikace bezbariérového vstupu/přístupu.
     - **Způsoby podání:** formátované české popisky (Datová schránka, Poštou, Osobně na podatelně, E-mailem s elektronickým podpisem).
     - **ID datové schránky:** kódové zobrazení s tlačítkem pro zkopírování do schránky (včetně vizuální zpětné vazby).
     - **Datum posledního ověření:** formátované české datum `verifiedAt` / `lastCheckedAt`.
   - **Bezpečnostní hranice:** Pokud subjekt nemá status `VERIFIED` ani `STALE` (např. `PENDING_REVIEW` nebo `REJECTED`), blok se v mapovém detailu vůbec nevykreslí. Žádná interní metadata (ID reviewerů, interní poznámky, odmítnutí) neopouštějí server ani nejsou v UI dostupná.

2. **GAP-03 (Geocoding Rate Limiting & API Security):**
   - V `src/routes/subjektRoutes.ts` byl vytvořen dedikovaný limiter `geocodeRateLimiter` využívající existující knihovnu `express-rate-limit`.
   - **Konfigurace:** okno 60 sekund, maximálně 20 požadavků na IP adresu, standardní hlavičky (`standardHeaders: true`, `legacyHeaders: false`).
   - **Fail-Closed:** Při překročení limitu endpoint okamžitě vrací `HTTP 429 Too Many Requests` s bezpečnou chybovou hláškou:
     `{"error": "Příliš mnoho požadavků na geokódování. Zkuste to prosím za minutu."}`.
   - Endpoint `POST /api/subjekty/geocode` striktně vyžaduje autentizaci (`requireAuth`), token se neobchází. `MAPY_API_KEY` zůstává 100% server-side.

---

## 2. Dotčené soubory a provedené úpravy

| Soubor | Typ změny | Popis úpravy |
|---|---|---|
| `src/routes/subjektRoutes.ts` | Security | Zavedení `geocodeRateLimiter` (20 req/min) a aplikace na `router.post('/geocode', geocodeRateLimiter, ...)` |
| `src/services/subjektService.ts` | DTO Hardening | V `toPublicSubjektDto` přidáno bezpečné parsování stringifikovaného `openingHours` JSONu na objekt + zachování `openingHoursRaw` |
| `src/components/public/MapaSubjektuView.tsx` | UI Integration | Zobrazení ověřeného profilu v detailním modalu, bezpečné sanitizování `bookingUrl`, formátování způsobů podání, týdenní rozvrh hodin a kopírování ID datové schránky |
| `tests/mapa-subjektu-verified-profile-geocode.test.ts` | Test Suite | Nová dedikovaná testovací sada ověřující DTO sanitizaci, UI kontrakty, 401 autentizaci a 429 rate limit (7/7 PASS) |
| `scripts/test-runner.js` | Test Runner | Registrace testovací sady do centrálního integračního runneru |

---

## 3. Výsledky testů a verifikace

### A. Dedikovaná testovací sada (`tests/mapa-subjektu-verified-profile-geocode.test.ts`)
```bash
npx tsx --test tests/mapa-subjektu-verified-profile-geocode.test.ts
```
- **1. Public DTO Security & Metadata Leak Prevention:**
  - `ok 1` - public DTO strips all internal audit IDs and sensitive reviewer metadata from verifiedProfile
  - `ok 2` - public DTO strips PENDING_REVIEW and REJECTED profiles completely
  - `ok 3` - public DTO allows STALE profile with warning status and sanitized metadata
- **2. UI Contract & Map Detail Component (MapaSubjektuView):**
  - `ok 1` - MapaSubjektuView contains verified profile block with strict status check and all required fields
- **3. Geocode Rate Limiting & Security (GAP-03):**
  - `ok 1` - unauthenticated request without token returns 401 and does not bypass requireAuth
  - `ok 2` - authenticated request with valid token functions properly within rate limit
  - `ok 3` - exceeding 20 requests per minute returns HTTP 429 Too Many Requests (Fail-Closed)
- **Výsledek:** 7/7 PASS (0 fail)

### B. Regresní test ověřených informací (`tests/test_subject_verified_info.ts`)
```bash
npx tsx --test tests/test_subject_verified_info.ts
```
- **Výsledek:** 16/16 PASS (0 fail)

### C. Regresní test mapové integrace (`scripts/test-mapa-subjektu.cjs`)
```bash
node scripts/test-mapa-subjektu.cjs
```
- **Výsledek:** 9/9 PASS (0 fail)

### D. TypeScript kompilace a linter
```bash
npm run lint  # tsc --noEmit
```
- **Výsledek:** 0 chyb.

---

## 4. Dodržení bezpečnostních pravidel Synthesis

- **Zero Trust / Least Privilege:** Veřejný DTO striktně neobsahuje žádné interní ID administrátorů, moderátorů ani zdrojové metadata.
- **Fail-Closed:** Při překročení rate limitu dochází k okamžitému zablokování požadavků s HTTP 429; neověřené statusy (`PENDING_REVIEW`, `REJECTED`) se v mapě vůbec nezobrazí.
- **Secrets:** `MAPY_API_KEY` i `JWT_SECRET` zůstávají výhradně na serveru; žádný secret není exponován klientovi.
- **SSRF / XSS:** `bookingUrl` je validováno proti whitelistu bezpečných protokolů (`^https?://`), žádný kód nepoužívá `dangerouslySetInnerHTML`.
- **Git & Deployment:** Žádný samovolný commit, push, merge ani deployment.
