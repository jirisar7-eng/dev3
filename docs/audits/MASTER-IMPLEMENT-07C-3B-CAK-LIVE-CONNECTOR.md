# MASTER-IMPLEMENT-07C-3B
## LIVE ČAK CONNECTOR & FOUR-EYES ACQUISITION PIPELINE

**Datum:** 2026-09-06  
**Repo:** `jirisar7-eng/dev3`  
**Branch:** `main`  
**Scope:** Implementace živého ČAK konektoru (`CakLiveConnector`), fail-closed HTML parseru s SHA-256 evidencí (`CakHtmlParser`), ztotožnění subjektů (`identity matching`), ověření formátů (`VerifiedInfoValidator`), ingestu do `SubjectInformationSource` ve stavu `PENDING_REVIEW` a nezávislé moderace (Four-Eyes) do `SubjectVerifiedProfile`.  
**Autor:** Hlavní architekt, senior full-stack vývojář a DevSecOps ekosystému Synthesis  
**Status:** ✅ IMPLEMENTOVÁNO & PLNĚ OTESTOVÁNO (24/24 testů green, 0 chyb)

---

## 1. Architektura Live ČAK Řetězce

```
[ ČAK Registr: vyhledavac.cak.cz ]
                │
                ▼ (HTTPS only, whitelist, 10s timeout, max 10MB, max 1 req / 3s, 24h cache)
       [ CakLiveConnector ]
                │
                ▼ (SHA-256 evidence obsahu, detekce CAPTCHA/WAF/změny struktury -> Fail-Closed)
        [ CakHtmlParser ]
                │
                ▼ (Extrahovaná strukturovaná data advokáta)
   [ Identity Matching Engine ] ──(Neshoda jména/města/IČO/statusu)──► REJECT (FAIL-CLOSED)
                │
                ▼ (Validace telefon, email, ISDS, web přes VerifiedInfoValidator)
  [ Ingest: submitSourceProposal ] (Submitter: crawler-bot@tatamapravo.cz)
                │
                ▼
  [ SubjectInformationSource (status: PENDING_REVIEW) ]
                │
                ├── (Pokus o self-approval crawler botem) ────► 403 FORBIDDEN (BLOKOVÁNO)
                ├── (Pokus neautorizovaným uživatelem USER) ──► 403 FORBIDDEN (BLOKOVÁNO)
                │
                ▼ (Nezávislý moderátor: moderator@tatamapravo.cz, role MODERATOR / ADMIN)
     [ Four-Eyes Moderace ]
                │
                ▼
  [ SubjectVerifiedProfile (status: VERIFIED, P2_PUBLIC_STATE_REGISTRY) ]
                │
                ▼
       [ toPublicSubjektDto ] ──► Veřejné DTO (bez interních audit IDs a tajemství)
```

---

## 2. Implementované Komponenty

### 2.1 `CakHtmlParser` (`src/services/dataPipeline/cakHtmlParser.ts`)
- **Deterministická extrakce:** Zpracovává HTML z `vyhledavac.cak.cz` bez jakéhokoliv doplňování chybějících údajů či AI dedukcí.
- **SHA-256 evidence:** Každý stažený HTML payload je hashován (`crypto.createHash('sha256')`) a hash je vložen do `evidenceSnippet`.
- **Fail-Closed ochrana:**
  - Detekce reCAPTCHA/hCaptcha/Turnstile (`CAPTCHA_DETECTED`).
  - Detekce WAF Cloudflare/Imperva/Akamai challenges (`WAF_BLOCKED`).
  - Detekce změny HTML layoutu nebo chybějících povinných polí (`HTML_LAYOUT_MISMATCH`).
  - Kontrola aktivního statusu výkonu advokacie (`isActiveAdvokat`). Pokud je advokát pozastaven či vyškrtnut, konektor neumožní verifikaci.

### 2.2 `CakLiveConnector` (`src/services/dataPipeline/cakLiveConnector.ts`)
- **Síťová bezpečnost & SSRF:**
  - Whitelist protokolu: výhradně `https://`.
  - Whitelist hostitele: striktně `vyhledavac.cak.cz`.
  - Integrovaná kontrola privátních IP, loopback a cloud metadata adres (`StateAdminApiClient.isUrlSsrfSafe`).
- **Limity & Ochrana serveru:**
  - Timeout: 10 sekund (prostřednictvím `AbortController`).
  - Velikostní limit odpovědi: 10 MB (odmítnutí `Content-Length > 10MB` i přetečení těla streamu).
  - Rate limiting: minimální interval 3 000 ms (max 1 request / 3 sekundy).
  - Cache: 24hodinový in-memory cache pro prevenci zbytečného zatěžování serverů ČAK.
  - Transparentní User-Agent: identifikace jako `TataMaPravo-VerificationBot/1.0 (+https://tatamapravo.cz/kontakt; audit-bot@tatamapravo.cz)`.
  - Retry policy: max 2 retry výhradně při síťovém timeoutu nebo 503/504; striktně **žádný retry** u HTTP 4xx (400, 403, 404, 429).

### 2.3 `CakAcquisitionPipeline.acquireLiveAdvokat` (`src/services/dataPipeline/cakAcquisitionPipeline.ts`)
- Propojuje živé stažení, parsování, ztotožnění se subjektem v databázi (`dbStore`/`Prisma`), sanitaci a validaci kontaktů (`VerifiedInfoValidator`) a odeslání do `SubjectInformationSource` se stavem `PENDING_REVIEW`.
- Každá operace je auditována přes `AuditService.recordLog` s detailním popisem události a identitou submittera/moderátora.

---

## 3. Bezpečnostní a Procesní Kontroly

| Kontrola | Požadavek | Implementace | Výsledek |
|---|---|---|---|
| **SSRF** | Blokovat privátní sítě a cizí domény | `StateAdminApiClient.isUrlSsrfSafe` + whitelist `vyhledavac.cak.cz` | ✅ Ověřeno |
| **Timeout & Size** | 10s timeout, max 10MB payload | `AbortController` (10s) + kontrola délky streamu (10MB) | ✅ Ověřeno |
| **Rate Limit** | Max 1 req / 3s, cache 24h | `lastRequestTimestamp` guard + 24h cache store | ✅ Ověřeno |
| **Fail-Closed** | Změna HTML / WAF / CAPTCHA | `CakHtmlParser` detekce s návratovým kódem a chybou | ✅ Ověřeno |
| **SHA-256** | Auditovatelná evidence obsahu | Deterministický hash v `contentHash` a `evidenceSnippet` | ✅ Ověřeno |
| **Status Ingestu** | Vždy `PENDING_REVIEW` | Striktní uložení `status: PENDING_REVIEW` | ✅ Ověřeno |
| **Four-Eyes** | Ingestní bot nesmí schválit návrh | `SubjectVerifiedInfoService` kontrola `reviewer.id !== submitter.id` | ✅ Ověřeno |
| **Audit DTO** | Veřejné DTO nesmí unikat interní IDs | `toPublicSubjektDto()` odstraňuje `createdById`, `verifiedById`, `reviewedById` | ✅ Ověřeno |

---

## 4. Výsledky Testů

- **Test Suite:** `tests/cak-live-connector.test.ts`
- **Počet testů:** 24/24 úspěšných
- **Oblasti pokrytí:**
  1. HTTPS Enforcement & Hostname Whitelist (3 testy)
  2. SSRF Protection & Private IP Defense (3 testy)
  3. Timeout and Response Limit (2 testy)
  4. Rate Limit and Cache TTL (3 testy)
  5. HTML Parser & Active Status Checking (2 testy)
  6. Identity Mismatch Detection (1 test)
  7. PENDING_REVIEW Status Ingest (1 test)
  8. Self-Approval Forbidden Four-Eyes Enforcement (1 test)
  9. VERIFIED Only After Independent Reviewer (1 test)
  10. SHA-256 Computation & Verification (1 test)
  11. Fail-Closed on Corrupted HTML, CAPTCHA, WAF (3 testy)
  12. Public DTO Sanitization (1 test)
- **Kombinovaný běh:** 48/48 testů (včetně `tests/nonospod-advokati-acquisition.test.ts`) prošlo bez jediné chyby.
- **Linter & Typecheck:** `npm run lint` (`tsc --noEmit`) = 0 chyb.
- **Build:** `compile_applet` = Success.
