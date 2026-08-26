# AUDIT_2026-08-26_P0_AUTH_SESSION_CONSISTENCY

## Cíl
Vyřešit dva kritické P0 problémy s autentizací v dev3:
1. **Záměna účtů (Problém A):** Pokud se uživatel A odhlásí a následně uživatel B začne proces přihlášení (a ocitne se na MFA obrazovce), minimalizace a návrat do aplikace (focus/visibilitychange) způsobila nesprávné obnovení relace uživatele A namísto setrvání na MFA obrazovce pro uživatele B.
2. **Rozsynchronizování Auto-logoutu (Problém B):** Pokud backend API vrátí `401 Unauthorized` (např. po vypršení tokenu vlivem nečinnosti), frontendový stav (`AuthContext`) si uživatele nadále pamatoval jako přihlášeného, což vedlo k chybovému zobrazení ("zombie relace").

## Výchozí stav
- **Backend (`res.clearCookie`):** Při odhlášení na `/api/auth/logout` i v `destroy()` middleware chyběly ve funkci `res.clearCookie` volby pro přesnou specifikaci atributů. Používalo se pouze `{ path: '/' }`. Z důvodu absence flagů `domain`, `secure` a `sameSite` nedocházelo na produkčních prostředích k reálnému vymazání JWT token cookie v prohlížeči. Stará cookie tak zůstávala v prohlížeči navzdory odhlášení.
- **Frontend (Globální zpracování chyb):** Klientský kód pro volání API spoléhal na surovou instanci `fetch()`. Neexistoval centrální mechanismus pro odchyt a aplikaci API `401 Unauthorized` chyb pro okamžité vyčištění lokálního `AuthContext`u. 

## Provedené změny
1. **Úplné odstranění Auth cookies na backendu:**
   - Vytvořen bezpečný util helper `src/utils/cookieUtils.ts` (obsahující `getClearCookieOptions`).
   - Sjednoceno bezpečné smazání cookies v `server.ts` a `src/middleware/authMiddleware.ts`. Volání `res.clearCookie` nově vždy správně zohledňuje proměnnou `process.env.COOKIE_DOMAIN` a `secure` flagy. 
   - Opraveno smazání jak hlavní JWT `token` cookie, tak dočasné `pending_mfa_user` cookie.

2. **Centrální Fetch interceptor na Frontendu:**
   - V `src/main.tsx` aplikován globální interceptor pro `window.fetch`. V případě detekce stavového kódu `401` se z app dispatchne globální událost `auth_401_error`. (Endpointy `/api/auth/login` a `/api/auth/2fa/verify` jsou chráněny proti endless interceptu).
   - Upraven `src/context/AuthContext.tsx`: přidán `useEffect` listener na událost `auth_401_error`. Pokud aplikace obdrží `401`, automaticky a deterministicky se provede `setCurrentUser(null)` a vyčistí se `localStorage`. 

3. **Integrita a testování:**
   - Omezeno odhlášení při `403` (zůstalo zachováno chování - `403 Forbidden` nevymazává currentUser state - což je důležité pro role-based access denial cases).
   - Nový unit test `tests/p0-auth-session-consistency.test.ts` vytvořen na prověření funkčnosti validního vymazání cookies na serveru a zaručení izolace relací během MFA fáze (dle specifikace požadavků).

## Dotčené soubory
- `src/utils/cookieUtils.ts` (přidáno)
- `server.ts`
- `src/middleware/authMiddleware.ts`
- `src/main.tsx`
- `src/context/AuthContext.tsx`
- `tests/p0-auth-session-consistency.test.ts` (přidáno)

## Testování (PASS)
- `npm run lint` & `npx tsc --noEmit` & `npm run build` & `npm test` - SUCCESS.
- Test `tests/p0-auth-session-consistency.test.ts` ověřil `domain` a `secure` shodu v `Set-Cookie` a zabránění úniku relace během MFA přepnutí (Test 1-4 z minima zadání ok).

## Zbývající rizika
- Žádná bezprostřední rizika (zombie sessions byly eliminovány). 

## Závěr
Problémy s překrýváním relací (race condition v live-reload frontendu) a rozsynchronizováním po expiraci byly deterministicky a centrálně vyřešeny bez destruktivních změn v API kontraktech.
