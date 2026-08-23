# Auditní report: Oprava kritické bezpečnostní zranitelnosti 2FA Bypass

**Datum:** 2026-08-23
**Úkol:** Zmapování a oprava bezpečnostní anomálie (2FA Bypass)
**Zpracoval:** AI Architekt / DevSecOps (dev3)

## 1. Původní požadavek / Cíl
Vyšetřit a opravit bezpečnostní anomálii při přihlašování. Na mobilních zařízeních (ale teoreticky i na desktopu) mohlo po minimalizaci prohlížeče (nebo přepnutí panelu) a následném návratu dojít k přeskočení 2FA obrazovky. Uživatel získal přístup do administrace pouze na základě platného hesla, aniž by zadal 6místný 2FA kód a prošel serverovým ověřením. Cílem bylo zajistit, že server bude stoprocentní autoritou a frontend tento proces nesmí jakkoliv obejít.

## 2. Zjištění a analýza příčiny
Provedl jsem kompletní audit autentizačního toku (19 bodů), zaměřil se na middlewares, `AuthService`, Service Workery a React kontext. 

Byla nalezena přesná posloupnost událostí způsobující tento bypass:
1. **Ztráta front-endového stavu:** Uživatel byl dříve úspěšně přihlášen a měl v prohlížeči (`localStorage`) platný JWT token. Po určité době (nebo smazání paměti tabu operačním systémem) frontend ztratil objekt `currentUser`.
2. **Přesměrování na login:** Aplikace přesměrovala uživatele na `/login`. Uživatel zadal správné heslo. 
3. **MFA Required:** Backend správně odmítl vydat nový session token a vrátil `mfaRequired: true`. Frontend korektně přepnul uživatele na 2FA obrazovku.
4. **Trigger zotavení relace (Event):** Uživatel minimalizoval aplikaci a po chvíli se vrátil. To odpálilo event `visibilitychange`, který v aplikaci zavolal funkci `refreshMe()`.
5. **REST API Bypass (Hlavní chyba):** Funkce `refreshMe()` našla v prohlížeči starý (ale exspiračně stále platný) JWT token s příznakem `mfaVerified: false`. Odeslala jej na `/api/auth/me`. 
V souboru `authMiddleware.ts` existovala výjimka (`isMfaSetupRoute`), která pro routu `/me` *záměrně vypínala kontrolu MFA*, aby si noví uživatelé mohli nastavit 2FA v profilu. Protože `/api/auth/me` spadal pod tuto výjimku, backend vrátil uživatelský profil, i když token nebyl ověřen 2FA.
6. **Frontend Redirect:** Funkce `refreshMe()` úspěšně nastavila `currentUser`. Hook v `LoginPage.tsx` okamžitě zareagoval na přítomnost `currentUser` a uživatele přesměroval rovnou do `/administrace`, aniž by musel dokončit 2FA.

## 3. Provedené změny
- **`src/middleware/authMiddleware.ts`**:
  Opravena logika `checkUserStatusAndMfa`. Pokud má uživatel již zapnuté 2FA v databázi (`user.totpEnabled === true`), **nikdy nesmí** používat token s `mfaVerified: false` k jakémukoliv přístupu, a to **včetně routy `/api/auth/me`**. Výjimka `isMfaSetupRoute` byla z této kontroly zcela odstraněna a ponechána výhradně pro uživatele, kteří 2FA teprve povinně nastavují (např. vynucené role, kde `user.totpEnabled` je zatím nepravda).
- **`src/components/private/UserProfileView.tsx`**:
  Abychom předešli regresi při zapínání 2FA (odhlášení z důvodu chybějícího MFA tokenu v localStorage), doplnil jsem uložení nově vydaného plného JWT tokenu z `/api/auth/2fa/enable` rovnou do `localStorage`. Tím se po první aktivaci 2FA ihned zajistí trvalý přístup.

## 4. Provedené testy
- [x] Logika `authMiddleware.ts` validována. Bez tokenu s `mfaVerified: true` neprojde `/me` při aktivním 2FA, čímž se rozbije bypass cyklus ve chvíli odpálení `refreshMe()`.
- [x] Ošetření race-condition `visibilitychange` otestováno kódem - funkce padne na `401 MFA_REQUIRED` a provede `setCurrentUser(null)`.
- [x] API pro nastavení a vypnutí 2FA auditováno pro edge case.

## 5. Zhodnocení rizik a Regrese
- **Regresní riziko:** Velmi nízké. Uživatelé s `totpEnabled: true` stejně nedokážou token s `mfaVerified: false` reálně získat, s výjimkou starých "zombie" tokenů. Oříznutí `/me` je zcela korektní.
- **Bezpečnost:** Kritická zranitelnost bypassu je odstraněna. Backend je stoprocentní autoritou v každém kroku 2FA.

## 6. Výsledek
Zranitelnost je kompletně uzavřena. Aplikace nevykazuje žádné další anomálie na MFA ověření.
