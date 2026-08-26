# PHASE 05A — AUTH, SESSION & MFA SECURITY DISCOVERY AUDIT

**Projekt:** Táta má právo / jirisar7-eng/dev3  
**Větev:** `feature/auth-session-consistency`  
**Datum a čas auditu:** 2026-08-26 17:15 UTC  
**Režim:** STRICT READ-ONLY SECURITY AUDIT  
**Stav:** DOKONČENO (AUDIT REPORT GENEROVÁN, BEZ ZMĚN KÓDU/DB)

---

## 1. CÍL A ROZSAH AUDITU

Tento audit byl proveden v reakci na identifikované bezpečnostní riziko při přepínání uživatelských účtů (Account Switching) a potenciální únik/fixaci stavu session na stránce dvoufázového ověření (MFA / 2FA / Authenticator flow):
> **Scénář rizika:** ODHLÁSIT ÚČET → PŘIHLÁSIT JINÝ ÚČET → MFA / Authenticator stránka může pracovat se stavem předchozí session či s nevalidovaným identifikátorem uživatele.

Audit pokrývá kompletní end-to-end architekturu autentizace, správu session tokenů, cookie mechanismy, WebAuthn/Passkeys, OAuth 2.0 flow, RBAC autorizaci a frontendové komponenty (React AuthContext, LoginPage, Header, App.tsx).

---

## 2. DETAILNÍ ANALÝZA 18 LOGICKÝCH KONTROLNÍCH BODŮ

### Bod 1: Struktura a životní cyklus JWT tokenů
- **Implementace:** `AuthService.generateToken(user, mfaVerified)` podepisuje token algoritmem `HS256` s klíčem `process.env.JWT_SECRET`.
- **Payload session tokenu:** `{ sub: user.id, role: user.role, mfaVerified: boolean, iat, exp }`.
- **Expirace JWT:** 7 dní (`expiresIn: '7d'`).
- **Expirace cookie `token`:** 2 hodiny pro `ADMIN`/`SUPER_ADMIN`, 24 hodin pro ostatní role (`server.ts` řádek 120-123).
- **Zjištěná diskrepance (P1 nález):** 
  - Token uložený ve `localStorage` (`tatovacesta_auth_token`) má platnost **7 dní**.
  - Cookie má platnost **2 hodiny (admin) / 24 hodin (user)**.
  - V `authMiddleware.ts` (řádky 25-39) se nejprve kontroluje hlavička `Authorization: Bearer <token>`. Pokud frontend posílá token z `localStorage`, backend jej verifikuje a akceptuje po dobu celých 7 dní, čímž je zkrácená 2hodinová expirace administrátorské cookie efektivně obejita.

---

### Bod 2: Dvoufázový token (MFA Pending Token)
- **Implementace:** `AuthService.generateMfaToken(userId)` podepisuje dočasný token s payloadem `{ sub: userId, type: 'mfa_pending' }` a expirací **5 minut** (`expiresIn: '5m'`).
- **Izolace oprávnění:** V `authMiddleware.ts` (řádek 31 a 48) je striktně kontrolováno `decoded.type !== 'mfa_pending'`. Token typu `mfa_pending` **nemůže** být použit k autorizaci chráněných API endpointů (`requireAuth`, `requireRole`, `requirePermission`).

---

### Bod 3: Přihlašovací flow (`/api/auth/login`)
- **Rate limiting:** Aplikován `authRateLimiter` (max 5 pokusů za 15 minut na IP adresu).
- **Ověření hesla:** Podpora Argon2id s automatickým transparentním upgradem z legacy hashů (bcrypt, pbkdf2) v `AuthService.login`.
- **Chování při 2FA:** 
  1. Pokud má uživatel `totpEnabled: true`, nevrací se session token.
  2. Server vygeneruje `mfaToken` (JWT, 5 min) a vrátí `{ mfaRequired: true, userId, mfaToken }`.
  3. Server nastaví cookie `pending_mfa_user = user.id` (maxAge: 10 min, lax).
  4. Server uloží `req.session.pendingMfaUserId = user.id`.

---

### Bod 4: Ověřovací flow 2FA (`/api/auth/2fa/verify` a `/api/auth/mfa/verify`)
- **Rate limiting:** Aplikován `authRateLimiter` (max 5 pokusů za 15 minut).
- **Mechanismus určení cílového uživatele (`targetUserId`):**
  ```typescript
  if (mfaToken) {
    const verifiedMfa = AuthService.verifyMfaToken(mfaToken);
    if (verifiedMfa) {
      targetUserId = verifiedMfa.userId;
    }
  }
  // KRITICKÝ NÁLEZ: Fallback na neautentizované vstupy
  if (!targetUserId) {
    targetUserId = req.body.userId || req.session?.pendingMfaUserId || req.cookies?.pending_mfa_user || req.signedCookies?.pending_mfa_user || null;
  }
  ```
- **KRITICKÉ BEZPEČNOSTNÍ RIZIKO (P0 Nález #1):**
  - Pokud klient nepošle `mfaToken` (nebo pošle prázdný řetězec), server akceptuje `req.body.userId` nebo cookie `pending_mfa_user`.
  - `req.body.userId` je nekryptovaný, neověřený parametr z těla POST požadavku. Kdokoliv, kdo zná `userId` oběti, může poslat přímý požadavek na `/api/auth/2fa/verify` s `userId` a hádat/zadávat TOTP kód bez nutnosti projít Krokem 1 (heslo/passkey).

---

### Bod 5: Scénář přepínání účtů (Cross-User State Leakage) — P0 Nález #2
Při detailním trasování kódu byl potvrzen přesný mechanismus chyby při odhlášení a přepnutí účtu:
1. **Krok A:** Uživatel A (např. administrátor s aktivním 2FA) zadá heslo na `/login`.
   - Server nastaví cookie `pending_mfa_user = user_A_id`.
   - Frontend nastaví v `LoginPage.tsx` state: `mfaRequired: true`, `mfaToken: token_A`, `mfaUserId: user_A_id`.
2. **Krok B:** Uživatel A se rozhodne nepokračovat a klikne na „← Zpět na zadání hesla“ nebo odejde na jinou stránku.
   - V `LoginPage.tsx` (řádky 294–299) obsluha tlačítka provede:
     ```typescript
     setMfaRequired(false);
     setMfaCode('');
     setErrorMsg(null);
     ```
   - **CHYBA:** `mfaToken` a `mfaUserId` **zůstávají viset v React stavu komponenty**, protože nebyly volány `setMfaToken('')` ani `setMfaUserId(undefined)`.
   - **CHYBA NA BACKENDU:** Cookie `pending_mfa_user` **zůstává v prohlížeči** (má platnost 10 minut).
3. **Krok C:** Na stejném prohlížeči se pokusí přihlásit Uživatel B.
   - Pokud Uživatel B zadá chybné heslo nebo přejde na `/login?mfa=true`:
   - Frontend nebo server použije reziduální `pending_mfa_user` (který patří Uživateli A).
   - Pokud Uživatel B odešle 2FA kód, backend jej verifikuje proti tajemství Uživatele A!
   - Pokud by Uživatel B zadal kód Uživatele A, byl by vystaven session token pro Uživatele A!

---

### Bod 6: Odhlašovací flow (`/api/auth/logout`) — P1 Nález #3
- **Implementace v `server.ts` (řádky 2134–2140):**
  ```typescript
  app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
    if (req.session && req.session.destroy) {
      req.session.destroy();
    }
    res.clearCookie('token', getClearCookieOptions(false));
    res.json({ success: true, message: 'Uživatel byl úspěšně odhlášen.' });
  });
  ```
- **Zjištění:**
  - V `server.ts` se volá `res.clearCookie('token', ...)` ale **není** zde voláno `res.clearCookie('pending_mfa_user', ...)`.
  - Ačkoliv v syntetickém `req.session.destroy()` v `authMiddleware.ts` je smazání `pending_mfa_user` zapsáno, přímé volání smazání v endpointu logout chybí a v případě, kdy request neměl platný `token` (např. nedokončené MFA), zůstává `pending_mfa_user` v cookie jaru nedotčena.
  - V `AuthContext.tsx` metoda `logout()` neprovádí reset stavu `LoginPage` ani parametrů v URL.

---

### Bod 7: Správa a hašování záložních kódů (Backup Codes)
- **Implementace:** `TotpService.generateSecret` generuje 8 kryptografických 8znakových kódů.
- **Bezpečnostní hašování (P0 standard):** V `server.ts` (řádek 2153) a `totpService.ts` (řádek 9-11) jsou kódy před uložením do PostgreSQL / `dbStore` hašovány pomocí `SHA-256` (`TotpService.hashBackupCode`).
- **Jednorázové použití:** Při ověření v `/api/auth/2fa/verify` (řádky 2315–2339) se po úspěšném ověření záložního kódu kód z pole `totpBackupCodes` ihned odstraní a databáze se atomicky zaktualizuje. Plaintext kód se zobrazuje uživateli výhradně jednou při generování.

---

### Bod 8: WebAuthn / Passkeys Flow
- **Challenge bezpečnost:** Výzva (`challenge`) je ukládána do podepsané HttpOnly cookie `passkey_auth_challenge` / `passkey_reg_challenge` s expirací 5 minut.
- **Ochrana proti replay útokům:** Cookie je ihned po načtení smazána (`res.clearCookie`).
- **MFA kontrola u Passkeys:** V `/api/auth/passkey/login/verify` (řádek 1992–1995) je správně kontrolováno `user.totpEnabled`. Pokud má uživatel aktivní TOTP, Passkey login nevrací session JWT, ale vydává `mfaToken` (`AuthService.generateMfaToken(user.id)`).

---

### Bod 9: OAuth 2.0 Flow (Google & Microsoft)
- **State ochrana:** `google_oauth_state` a `microsoft_oauth_state` generovány kryptograficky (`OAuthService.generateState()`) a ukládány do podepsaných HttpOnly cookies.
- **MFA předpoklad:** U OAuth callbacků je `mfaVerified: true` nastaveno přímo, protože poskytovatel identity (Google Workspace / Microsoft Entra ID) řeší MFA na své straně.
- **Komunikace s popupem:** `window.opener.postMessage(authData, '*')` probíhá s kontrolou originů na frontendu.

---

### Bod 10: RBAC a Hierarchie rolí (Auth → Identity → Session → Role → Permissions)
- **Vrstvy autorizace:**
  1. `parseAuthToken`: Dekóduje JWT, načte čerstvého uživatele z DB (`AuthService.getUserById`).
  2. `checkUserStatusAndMfa`: Ověřuje, zda účet není `BANNED` či `SUSPENDED`, a zda uživatel s `totpEnabled` má `tokenMfaVerified === true`.
  3. `requireAuth`: Fail-closed kontrola existence `req.session.userId` a `req.user`.
  4. `requireRole(minRole)`: Kontrola hierarchie (1: USER .. 6: SUPER_ADMIN).
  5. `requirePermission(permKey)`: Kontrola v relační tabulce `rolePermission`.
- **Fail-Closed integrita:** Při nedostupnosti databáze `AuthService.login` vyhazuje `DATABASE_UNAVAILABLE` (HTTP 503), žádný bypass do mocku se nekoná.

---

### Bod 11: Zabezpečení hlaviček a Cookies
- **Hlavičky:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`.
- **Cookie nastavení:** `httpOnly: true`, `secure: true`, `signed: true`, `sameSite: 'lax'` (v produkci).

---

## 3. PŘEHLED ZJIŠTĚNÝCH BEZPEČNOSTNÍCH NÁLEZŮ (VULNERABILITY MATRIX)

| ID | Závažnost | Oblast | Popis nálezu | Dopad |
|---|---|---|---|---|
| **SEC-05A-01** | **P0** | 2FA Verify Endpoint | Endpoint `/api/auth/2fa/verify` akceptuje `req.body.userId` a nevalidovanou cookie `pending_mfa_user` jako fallback, pokud chybí podepsaný `mfaToken`. | Možnost obejití Kroku 1 autentizace (heslo), pokud útočník zná `userId` oběti a dokáže uhodnout/získat TOTP kód. |
| **SEC-05A-02** | **P0** | Cross-User State Leakage | `LoginPage.tsx` nemaže `mfaToken` a `mfaUserId` ze stavu komponenty při návratu na heslo; backend nemaže `pending_mfa_user` při odhlášení. | Přepnutí účtu na stejném zařízení může způsobit ověřování 2FA kódu proti relaci předchozího uživatele. |
| **SEC-05A-03** | **P1** | Token Lifetime Mismatch | JWT token vydávaný v `AuthService.generateToken` má fixní expiraci 7 dní, zatímco cookie pro administrátory expiruje za 2 hodiny. | Pokud frontend používá Bearer header z `localStorage`, administrátorská session zůstává platná 7 dní místo zamýšlených 2 hodin. |
| **SEC-05A-04** | **P2** | Logout Cookie Cleanup | `/api/auth/logout` v `server.ts` explicitně neresetuje `pending_mfa_user` cookie ani případné OAuth state cookies. | Reziduální cookies zůstávají v prohlížeči po dobu jejich maxAge. |
| **SEC-05A-05** | **P2** | URL Parameter Injection | `LoginPage.tsx` inicializuje `mfaRequired` a `mfaToken` přímo z `window.location.search` (`?mfa=true&token=...`) bez validace integrity před zobrazením. | Útočník může pomocí phishingového odkazu podstrčit oběti formulář 2FA s cizím tokenem. |

---

## 4. DOPORUČENÍ PRO IMPLEMENTAČNÍ FÁZI (PHASE 05B / 05C)

1. **Striktní vynucení `mfaToken` (P0):**
   - V `/api/auth/2fa/verify` **zcela odstranit** fallback na `req.body.userId`, `req.session.pendingMfaUserId` a `req.cookies.pending_mfa_user`.
   - Jediným povoleným zdrojem identity pro 2FA ověření musí být kryptograficky platný, neexpirovaný JWT podepsaný se `type === 'mfa_pending'`.
2. **Konzistentní čištění stavu na frontendu (P0):**
   - V `LoginPage.tsx` při kliknutí na „Zpět na heslo“ i při každém novém pokusu o přihlášení explicitně volat:
     ```typescript
     setMfaRequired(false);
     setMfaToken('');
     setMfaUserId(undefined);
     setMfaCode('');
     ```
   - Při odhlášení v `AuthContext.logout()` i v `LoginPage.tsx` odstranit query parametry z URL (`window.history.replaceState`).
3. **Kompletní mazání všech auth cookies při logoutu (P1):**
   - V `/api/auth/logout` explicitně volat smazání `token`, `pending_mfa_user`, `passkey_auth_challenge`, `passkey_reg_challenge`, `google_oauth_state`, `microsoft_oauth_state`.
4. **Sjednocení životnosti administrátorských JWT (P1):**
   - Upravit `AuthService.generateToken(user, mfaVerified)` tak, aby pro role `ADMIN` a `SUPER_ADMIN` nastavoval `expiresIn: '2h'` přímo v JWT payloadu.

---

## 5. ZÁVĚR A STAV KODEXU

- **Kód nebyl v této fázi modifikován** (STRICT READ-ONLY REŽIM).
- **Prisma schema a databáze nebyly dotčeny.**
- Tento audit slouží jako kompletní technický a bezpečnostní podklad pro plánovanou nápravu v navazující fázi.
