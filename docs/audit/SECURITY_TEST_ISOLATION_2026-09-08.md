# Security Test Isolation

Datum: 2026-09-08
Větev: `fix/security-test-isolation-20260908`
Start SHA: `2d318fce337a10b587218f314136b6e8ab367104`

## Oprava

Hlavní test runner nyní spouští security integrace přes izolovaný wrapper.
Wrapper odmítne obsazený port 3000, spustí lokální backend bez `DATABASE_URL`,
ověří identitu aplikace a odpojenou databázi, provede testy a server ukončí.

## Ověření

- Izolovaná security sada: 4/4 PASS
- Celý `npm run test`: PASS
- Lint: PASS
- Build: PASS
- Port 3000 po testu: volný
- DEV3 a PROD3: beze změn

## Verdikt

PASS — security testy jsou reprodukovatelné bez ručně spuštěného serveru.
