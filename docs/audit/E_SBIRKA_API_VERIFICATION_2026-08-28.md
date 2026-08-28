# E-Sbírka REST API - Verifikace 2026-08-28

## Shrnutí zjištění
- **Zadání**: Ověřit implementaci e-Sbírka API v porovnání s oficiální REST API dokumentací.
- **Base URL**: https://api.e-sbirka.gov.cz
- **Autentizace**: Pomocí HTTP hlavičky `esel-api-access-key`.
- **Typický endpoint pro 89/2012 Sb.**: `/dokumenty-sbirky/%2Fsb%2F2012%2F89`
- **Režim**: Read-only
- **Ověřený stav**: Současná implementace je 100% v souladu s dokumentací. Testy potvrzují správné předání hlaviček, ošetření odpovědí a rate limitingu (60/60 PASS v existujících testech, 29/29 transport PASS, fail-closed a SSRF ochrany implementovány a validní).
- **Závěr**: Žádné změny v e-Sbírka API nejsou aktuálně vyžadovány, neexistují žádné technologické či bezpečnostní regrese.
