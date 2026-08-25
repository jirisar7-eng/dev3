# Auditní zpráva: Google OAuth Security Fix

## Informace o auditu
- **Datum:** 2026-08-25
- **Úkol:** OPRAVA GOOGLE OAUTH ID TOKEN VERIFICATION
- **Cíl:** Odstranit zranitelnost způsobenou vyhodnocováním Google ID tokenu bez ověření podpisu.

## Výchozí stav
- Aplikace parsovala data z ID tokenu pouze pomocí `jwt.decode()`, což nijak neověřovalo kryptografický podpis tokenu vůči certifikátům Google.

## Provedené změny
- Nainstalována knihovna `google-auth-library` (v11) s využitím existujícího balíčkovacího systému (Bun).
- Soubor `src/services/oauthService.ts` aktualizován tak, že namísto prostého dekódování nyní validuje token prostřednictvím metody `verifyIdToken` (třída `OAuth2Client`).
- Ověřuje se kryptografický podpis, Audience (`GOOGLE_CLIENT_ID`), Issuer a Expirace tokenu.
- Byly přidány komplexní unit testy do `tests/oauthService.test.ts`.

## Bezpečnostní rizika (Uzavřeno)
- **Uzavřeno:** Zásadní bezpečnostní riziko (GAP) spoofingu identity pomocí podvrženého, ale nepodepsaného nebo špatně podepsaného JWT tokenu. Nyní je důvěryhodnost identity plně kryptograficky ověřena.

## Testování
- [x] PLATNÝ TOKEN (PASS)
- [x] PODVRŽENÝ TOKEN / ŠPATNÝ PODPIS (REJECT)
- [x] WRONG AUDIENCE (REJECT)
- [x] WRONG ISSUER (REJECT)
- [x] EXPIRED TOKEN (REJECT)
