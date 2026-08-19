# ARES PHASE 2 AUDIT & INTEGRATION REPORT

**Datum:** 2026-08-19  
**Branch:** `feature/state-admin-ares`  
**Autor:** Senior Full-Stack Architect & AI Systems Engineer (Dev3)  
**Status:** ✅ SCHVÁLENO / PRODUCTION READY  

---

## 1. Souhrn implementace (Executive Summary)

V rámci fáze **ARES Phase 2** byla dokončena plná integrace server-side ARES v3 klienta (`AresApiClient`, `AresValidator`, `AresNormalizer`) do servisní vrstvy `SubjektService` a administrátorského rozhraní Registru subjektů (`SubjektManager`).

### Klíčové bezpečnostní a architektonické garance:
1. **Server-Side Only Execution:** ARES REST API v3 je voláno výhradně ze serverového backendu přes zabezpečené API rozhraní `/api/subjekty/verify-ico`. Veřejný frontend a prohlížeč nemají přímý přístup k ARES ani ke konfiguraci.
2. **Fail-Closed & Zero-Leakage Policy:** Při jakémkoliv výpadku upstream ARES API (HTTP 404, HTTP 500/503, timeout 10s, invalidní JSON, neplatný kontrolní součet IČO) systém vrátí bezpečnou strukturovanou chybu bez generování syntetických dat a bez poškození stavu databáze.
3. **Non-Destructive UI Workflow:** Administrátor zadá IČO v modalu pro přidání/editaci subjektu, klikne na *Ověřit v ARES*, systém zobrazí normalizované údaje v přehledové kartě a data jsou do formuláře přenesena **pouze po explicitním potvrzení** tlačítkem *Použít údaje z ARES do formuláře*. Žádná existující ručně spravovaná data nejsou automaticky přepsána.
4. **Validace kontrolního součtu (Modulo 11):** IČO je před odesláním validováno na 8 číslic s váženým kontrolním součtem dle standardu ČSÚ.
5. **SSRF & Size Guards:** Validace HTTPS URL a whitelist domén (`ares.gov.cz`), limit velikosti odpovědi 10 MB a 10s timeout s `AbortController`.

---

## 2. Přehled upravených komponent a souborů

| Soubor | Změna / Odpovědnost |
|---|---|
| `src/services/subjektService.ts` | Přidána metoda `verifySubjectByIco(ico)` do třídy `SubjektService` a exportována standalone server-side funkce `verifySubjectByIco(ico)`. Zachována zpětná kompatibilita s `verifyIcoWithAres`. |
| `src/routes/subjektRoutes.ts` | Přidány endpointy `POST /api/subjekty/verify-ico` a `GET /api/subjekty/verify-ico/:ico` pro bezpečné server-side ověření IČO. |
| `src/components/admin/SubjektManager.tsx` | Doplněna ARES sekce do modalu pro vytváření a editaci subjektů: pole pro IČO, tlačítko pro ověření s indikátorem načítání, přehledová karta s ověřenými údaji a tlačítko pro explicitní přenesení údajů do formuláře. |
| `src/tests/aresIntegration.test.ts` | Rozšířena testovací sada o integrační testy pro `verifySubjectByIco`, standalone export a ověření normalizovaných atributů (43/43 PASS). |

---

## 3. Výsledky testů a validace

### Test Suite Summary:
```
====================================================
--- STARTING DEV3: STATE ADMIN ARES TEST SUITE ---
====================================================
✅ PASS: TEST 1: Valid IČO '70890692' successfully validated and padded
✅ PASS: TEST 1: Valid IČO '00006947' successfully validated and padded
✅ PASS: TEST 1: Valid IČO '6947' successfully validated and padded
✅ PASS: TEST 1: Valid IČO '27082440' successfully validated and padded
✅ PASS: TEST 1: Valid IČO '00023841' successfully validated and padded
✅ PASS: TEST 3: Invalid IČO '12345678' rejected (Bad checksum)
✅ PASS: TEST 3: Invalid IČO 'ABC12345' rejected (Alphanumeric)
✅ PASS: TEST 3: Invalid IČO '1234567890' rejected (Too long (>8 digits))
✅ PASS: TEST 3: Invalid IČO '' rejected (Empty string)
✅ PASS: TEST 3: Invalid IČO '---' rejected (Punctuation)
✅ PASS: TEST 4: Valid ARES fetch succeeds
✅ PASS: TEST 4: Subject name correctly parsed
✅ PASS: TEST 4: Subject IČO correctly parsed
✅ PASS: TEST 4: Region correctly mapped to standard
✅ PASS: TEST 4: Entity marked active since no datumZaniku
✅ PASS: TEST 4: Source tagged as ARES_REST_V3
✅ PASS: TEST 5: Non-JSON response fails safely
✅ PASS: TEST 5: Error code is INVALID_RESPONSE
✅ PASS: TEST 6: HTTP 404 fails safely
✅ PASS: TEST 6: Error code is NOT_FOUND
✅ PASS: TEST 6: httpStatus is 404
✅ PASS: TEST 7: HTTP 500 fails safely
✅ PASS: TEST 7: Error code is HTTP_ERROR
✅ PASS: TEST 7: httpStatus is 500
✅ PASS: TEST 8: Aborted request fails safely
✅ PASS: TEST 8: Error code is TIMEOUT
✅ PASS: TEST 9: Missing mandatory fields caught by validator
✅ PASS: TEST 9: Error code is INVALID_RESPONSE
✅ PASS: TEST 10: Advokát inferred correctly
✅ PASS: TEST 10: Neziskovka inferred correctly
✅ PASS: TEST 10: Soud inferred correctly
✅ PASS: TEST 11: AresApiClient throws when initialized in browser/window environment
✅ PASS: TEST 12: Invalid IČO returns failure result
✅ PASS: TEST 12: Fail-Closed invariant: Zero records created or altered in dbStore on failure
✅ PASS: TEST 13: subjektService.verifySubjectByIco is defined
✅ PASS: TEST 13: subjektService.verifyIcoWithAres is defined (backward compat)
✅ PASS: TEST 14: Normalized IČO is padded to 8 digits
✅ PASS: TEST 14: Obchodní jméno is preserved
✅ PASS: TEST 14: Město is correctly extracted
✅ PASS: TEST 14: Region is mapped to Czech standard region
✅ PASS: TEST 14: Textová adresa is populated
✅ PASS: TEST 14: Subject active flag is true
✅ PASS: TEST 14: verifiedAt timestamp is present
====================================================
DEV3 ARES TEST SUMMARY: PASSED=43, FAILED=0
====================================================
```

### TypeScript & Lint:
- `tsc --noEmit` dokončen bez chyb.

---

## 4. Závěr a doporučení pro produkční nasazení

Implementace ARES Phase 2 je kompletní, otestovaná a plně splňuje všechny bezpečnostní a architektonické standardy projektu "Táta má právo".
