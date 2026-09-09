# ZÁSADY POUŽÍVÁNÍ SOUBORŮ COOKIE A ÚLOŽIŠŤ PROHLÍŽEČE
**Kanonické ID:** `DOC-TMPR-COOKIES-V2`  
**Klíč v systému:** `cookies`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-09  
**Předchozí platná verze:** `v1.0.0` (ze dne 2026-01-01)  
**Právní rámec:** § 89 odst. 3 zákona č. 127/2005 Sb., o elektronických komunikacích (ZEK), Směrnice Evropského parlamentu a Rady 2002/58/ES (ePrivacy) a Nařízení (EU) 2016/679 (GDPR).

---

## OBSAH
- **ČÁST I: CO JSOU SOUBORY COOKIE A LOKÁLNÍ ÚLOŽIŠTĚ**
- **ČÁST II: KATEGORIZACE COOKIES A PRÁVNÍ ZÁKLADY**
- **ČÁST III: PŘEHLED POUŽÍVANÝCH COOKIES V SYSTÉMU**
- **ČÁST IV: PŘEHLED POLOŽEK V LOKÁLNÍM ÚLOŽIŠTI (LOCALSTORAGE)**
- **ČÁST V: MARKETINGOVÉ A SLEDOVACÍ NÁSTROJE TŘETÍCH STRAN**
- **ČÁST VI: SPRÁVA PŘEDVOLEB A ZPŮSOBY BLOKOVÁNÍ V PROHLÍŽEČI**

---

## ČÁST I: CO JSOU SOUBORY COOKIE A LOKÁLNÍ ÚLOŽIŠTĚ

### 1. Vymezení pojmů
1.1 **Soubory cookie** jsou malé textové soubory, které webový server odesílá internetovému prohlížeči Uživatele při návštěvě webové stránky. Prohlížeč tyto soubory ukládá do koncového zařízení Uživatele a při každé další návštěvě je odesílá zpět serveru. Umožňují webu rozpoznat zařízení Uživatele, udržet aktivní přihlášení a zajistit bezpečnost relace.  
1.2 **Lokální webové úložiště (localStorage / sessionStorage)** je technologie HTML5 umožňující ukládání strukturovaných dat přímo v prohlížeči Uživatele na straně klienta bez jejich automatického odesílání serveru při každém HTTP požadavku.

---

## ČÁST II: KATEGORIZACE COOKIES A PRÁVNÍ ZÁKLADY

### 2. Technické a nezbytné cookies (Strictly Necessary)
2.1 Tyto soubory cookie jsou **nezbytné pro technické fungování Portálu**, zajištění síťové bezpečnosti, ochranu před kybernetickými útoky (CSRF) a udržení zabezpečené relace přihlášeného Uživatele.  
2.2 **Právní základ:** Podle § 89 odst. 3 zákona č. 127/2005 Sb., o elektronických komunikacích, **není k ukládání těchto cookies vyžadován předchozí souhlas Uživatele**, neboť jejich výhradním účelem je přenos zprávy prostřednictvím sítě elektronických komunikací nebo jsou nezbytné pro poskytování služby informační společnosti, kterou si Uživatel výslovně vyžádal.

### 3. Preferenční a funkční prvky
3.1 Slouží k zapamatování uživatelských voleb rozhraní (např. volba světlého/tmavého režimu, rozbalení nabídek).  
3.2 Jsou ukládány na základě oprávněného zájmu na uživatelském komfortu, případně na základě volby v Cookie liště.

### 4. Analytické a statistické prvky
4.1 V současném technickém stavu Portál **NEPOUŽÍVÁ žádné analytické cookies třetích stran** (jako jsou Google Analytics, Hotjar, Smartlook). Interní agregovaná metrika přístupů je zpracovávána server-side bez ukládání sledovacích cookies třetích stran do zařízení Uživatele. `[VERIFIED FROM CODE: analyticsService.ts]`

### 5. Marketingové a reklamní cookies
5.1 Portál **NEPOUŽÍVÁ žádné marketingové, remarketingové ani profilovací cookies** (žádný Facebook Pixel, Google Ads, Seznam Sklik). Portál nezobrazuje komerční reklamu a nesleduje Uživatele napříč jinými webovými stránkami.

---

## ČÁST III: PŘEHLED POUŽÍVANÝCH COOKIES V SYSTÉMU

Následující tabulka obsahuje kompletní a vyčerpávající soupis souborů cookie generovaných a zpracovávaných backendem Portálu: `[VERIFIED FROM CODE: server.ts, cookieUtils.ts]`

| Název cookie | Typ / Účel | Doba platnosti | Atributy zabezpečení | Právní základ |
| :--- | :--- | :--- | :--- | :--- |
| **`token`** | **Nezbytná (Session):** Zabezpečený JWT token pro autentizaci přihlášeného uživatele k API | 7 dní (nebo do odhlášení) | `HttpOnly`, `SameSite=Lax/Strict`, `Secure` (v HTTPS) | § 89 odst. 3 ZEK (Technická nezbytnost) |
| **`pending_mfa_user`** | **Nezbytná (Bezpečnostní):** Dočasná relace pro dokončení dvoufaktorového ověření (TOTP/Passkey) | 10 minut | `HttpOnly`, `SameSite=Lax`, `Secure` | § 89 odst. 3 ZEK (Technická nezbytnost) |
| **`passkey_auth_challenge`** | **Nezbytná (FIDO2/WebAuthn):** Kryptografická výzva serveru k ověření podpisu klíče Passkey | 5 minut | `HttpOnly`, `SameSite=Lax`, `Secure` | § 89 odst. 3 ZEK (Technická nezbytnost) |
| **`passkey_reg_challenge`** | **Nezbytná (FIDO2/WebAuthn):** Kryptografická výzva k registraci nového bezpečnostního klíče | 5 minut | `HttpOnly`, `SameSite=Lax`, `Secure` | § 89 odst. 3 ZEK (Technická nezbytnost) |
| **`google_oauth_state`** | **Nezbytná (CSRF prevence):** Jednorázový kryptografický token pro bezpečné přihlášení přes Google | 15 minut | `HttpOnly`, `SameSite=Lax`, `Secure` | § 89 odst. 3 ZEK (Technická nezbytnost) |
| **`microsoft_oauth_state`** | **Nezbytná (CSRF prevence):** Jednorázový kryptografický token pro bezpečné přihlášení přes Microsoft | 15 minut | `HttpOnly`, `SameSite=Lax`, `Secure` | § 89 odst. 3 ZEK (Technická nezbytnost) |
| **`oauth_return_url`** | **Nezbytná (Navigace):** Zapamatování cílové stránky, kam má být uživatel po úspěšném přihlášení přesměrován | 15 minut | `HttpOnly`, `SameSite=Lax`, `Secure` | § 89 odst. 3 ZEK (Technická nezbytnost) |

*Poznámka:* Všechny výše uvedené soubory cookie jsou přísně technické a jejich přítomnost je nutná k zajištění bezpečného provozu klientského účtu.

---

## ČÁST IV: PŘEHLED POLOŽEK V LOKÁLNÍM ÚLOŽIŠTI (LOCALSTORAGE)

V lokálním úložišti prohlížeče Uživatele (`window.localStorage`) jsou ukládány pouze tyto hodnoty: `[VERIFIED FROM CODE: CookieConsentBanner.tsx, server.ts, clientCaseService.ts]`

1. **`cookie_consent_v1`**  
   - **Účel:** Uložení volby Uživatele o seznámení se s těmito Zásadami používání cookies.  
   - **Doba uložení:** Trvale (do smazání mezipaměti prohlížeče).  
   - **Formát:** JSON řetězec obsahující stav přijetí a časové razítko.
2. **`session_hash`**  
   - **Účel:** Náhodně vygenerovaný pseudonáhodný řetězec sloužící k evidenci anonymního přijetí právních dokumentů před vytvořením plného účtu.  
   - **Doba uložení:** Relace prohlížeče / do smazání dat prohlížeče.
3. **`tatovacesta_auth_token`**  
   - **Účel:** Klientský záložní token pro autorizaci API volání v rozhraních nepodporujících přímé čtení HttpOnly cookies.  
   - **Doba uložení:** Po dobu přihlášení (při odhlášení se maže).
4. **`puck_pending_template`**  
   - **Účel:** Dočasná pracovní mezipaměť rozpracovaného návrhu právní šablony v redakčním editoru.  
   - **Doba uložení:** Dočasně do uložení či zavření editoru.

---

## ČÁST V: MARKETINGOVÉ A SLEDOVACÍ NÁSTROJE TŘETÍCH STRAN

5.1 Provozovatel prohlašuje, že na Portálu **nejsou integrovány žádné reklamní skripty, sledovací pixely ani widgety sociálních sítí**, které by předávaly informace o chování Uživatele třetím komerčním stranám pro reklamní účely.  
5.2 Mapové podklady zobrazené v rámci Registru subjektů využívají otevřenou knihovnu Leaflet s podkladovými dlaždicemi OpenStreetMap, které neukládají sledovací cookies ani neprovádějí komerční profilování.

---

## ČÁST VI: SPRÁVA PŘEDVOLEB A ZPŮSOBY BLOKOVÁNÍ V PROHLÍŽEČI

### 6. Správa prostřednictvím Cookie lišty
6.1 Uživatel může své volby týkající se volitelných prvků kdykoli zkontrolovat či upravit prostřednictvím odkazu „Správa cookies“ umístěného v zápatí Portálu.

### 7. Nastavení v internetovém prohlížeči
7.1 Uživatel má možnost ukládání souborů cookie ve svém internetovém prohlížeči zcela zakázat nebo nastavit individuální pravidla pro konkrétní weby. Návody pro nejpoužívanější prohlížeče naleznete zde:  
- **Google Chrome:** [Nastavení cookies v Chrome](https://support.google.com/chrome/answer/95647)  
- **Mozilla Firefox:** [Blokování cookies ve Firefoxu](https://support.mozilla.org/cs/kb/blokovani-cookies)  
- **Microsoft Edge:** [Odstranění a správa souborů cookie v Edge](https://support.microsoft.com/cs-cz/microsoft-edge/odstran%C4%9Bn%C3%AD-soubor%C5%AF-cookie-v-prohl%C3%AD%C5%BEe%C4%8Di-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09)  
- **Apple Safari:** [Správa cookies v Safari](https://support.apple.com/cs-cz/guide/safari/sfri11471/mac)

### 8. Důsledky zablokování technických cookies
8.1 **Upozornění:** Pokud Uživatel ve svém prohlížeči zablokuje veškeré soubory cookie (včetně technických cookies první strany):  
a) **nebude možné se přihlásit do uživatelského účtu**, neboť systém nebude schopen udržet ověřenou relaci (`token`);  
b) nebude fungovat vícefaktorové ověření (TOTP) ani přihlašování kryptografickými klíči Passkeys (FIDO2);  
c) nebude funkční přihlášení přes federované identity Google a Microsoft;  
d) Portál bude přístupný výhradně v režimu anonymního čtení veřejných článků.
