# ZÁSADY POUŽÍVÁNÍ SOUBORŮ COOKIE A ÚLOŽIŠŤ PROHLÍŽEČE (COOKIE & STORAGE POLICY)
**Kanonické ID:** `DOC-TMPR-COOKIE-V2`  
**Klíč v systému:** `cookies`  
**Status:** `STATUS: WORKING DRAFT — NOT FOR PUBLICATION`  
**Návrh verze:** `2.0.0-DRAFT`  
**Datum návrhu:** 2026-09-09  
**Předchozí platná verze:** `v1.0.0` (ze dne 2026-01-01)  
**Právní rámec:** Zákon č. 127/2005 Sb., o elektronických komunikacích, ve znění zákona č. 374/2021 Sb. (§ 89 odst. 3 – opt-in režim); Směrnice Evropského parlamentu a Rady 2002/58/ES (směrnice o soukromí a elektronických komunikacích – ePrivacy); Nařízení (EU) 2016/679 (GDPR).  

---

## OBSAH DOKUMENTU
- **ČÁST I: ÚVOD A PRÁVNÍ REŽIM COOKIES V ČESKÉ REPUBLICE**
- **ČÁST II: ROZDÍL MEZI COOKIES, LOCALSTORAGE, SESSIONSTORAGE A DALŠÍMI ÚLOŽIŠTI**
- **ČÁST III: KATEGORIZACE A ÚČELY POUŽÍVANÝCH TECHNOLOGIÍ**
- **ČÁST IV: KOMPLETNÍ TECHNICKÁ INVENTURA COOKIES A ÚLOŽIŠŤ**
- **ČÁST V: INTERNÍ ANALYTIKA VS. ABSENCE REKLAMNÍCH TRACKERŮ**
- **ČÁST VI: SPRÁVA SOUHLASŮ, COOKIE LIŠTA A ULOŽENÍ VOLBY**
- **ČÁST VII: NÁVOD NA ODSTRANĚNÍ A BLOKOVÁNÍ COOKIES V PROHLÍŽEČI**
- **ČÁST VIII: BEZPEČNOSTNÍ REVIZE A PŘECHOD DO PRODUKČNÍHO REŽIMU**
- **ČÁST IX: ZÁVĚREČNÁ USTANOVENÍ A KONTAKTY**

---

## ČÁST I: ÚVOD A PRÁVNÍ REŽIM COOKIES V ČESKÉ REPUBLICE

### 1. Správce a působnost dokumentu
1.1 Tyto Zásady používání souborů cookie a síťových úložišť (dále jen „Zásady“) upravují způsoby, jakými portál **Táta má právo** (provozovaný na doméně `tatovacesta.cz` v rámci ekosystému Synthesis OS, dále jen „Portál“) ukládá a načítá informace na koncových zařízeních uživatelů a návštěvníků.  
1.2 **Správce:** Jiří Šár, fyzická osoba (`[LEGAL RESEARCH REQUIRED: determine mandatory operator identification for current natural-person operating model]`), kontaktní e-mail: `[TO VERIFY: podpora@tatovacesta.cz]` (dále jen „Správce“).  
*(Poznámka k organizaci [PRODUCT INTENT — FUTURE]: Případné budoucí provozování portálu zapsaným spolkem je dosud neuskutečněný záměr; spolek nebyl založen a není v současnosti správcem.)*    

### 2. Právní úprava opt-in principu v ČR
2.1 V souladu s ustanovením **§ 89 odst. 3 zákona č. 127/2005 Sb., o elektronických komunikacích** (ve znění novely č. 374/2021 Sb.), je každý provozovatel internetových stránek povinen předem získat prokazatelný aktivní souhlas uživatele (opt-in) s ukládáním cookies a přistupováním k údajům na jeho koncovém zařízení, s výjimkou případů, kdy je ukládání nezbytné pro technické fungování služby.  
2.2 **Zákonná výjimka pro nezbytné cookies:**  
Souhlas se nevyžaduje pouze pro ukládání a čtení takových dat, která jsou **nezbytně nutná pro potřeby přenosu zprávy prostřednictvím sítě elektronických komunikací nebo pro poskytování služby informační společnosti, kterou si uživatel výslovně vyžádal** (tzv. technické či nezbytné cookies).  
2.3 Portál Táta má právo striktně respektuje toto pravidlo. Technické cookies a autentizační tokeny jsou aktivovány automaticky; jakékoli volitelné analytické či funkční technologie jsou aktivovány výhradně na základě svobodného a informovaného souhlasu Uživatele.  

---

## ČÁST II: ROZDÍL MEZI COOKIES, LOCALSTORAGE, SESSIONSTORAGE A DALŠÍMI ÚLOŽIŠTI

Moderní webové aplikace využívají vedle klasických HTTP cookies několik různých mechanismů webového úložiště prohlížeče (Web Storage API). Pro zajištění plné transparentnosti uvádíme jejich stručné vysvětlení:

### 3. Přehled použitých technologií úložiště
3.1 **HTTP Cookies:**  
Malé textové soubory odesílané webovým serverem a ukládané prohlížečem, které jsou automaticky přikládány ke každému následujícímu HTTP požadavku na daný server. Mohou být zabezpečeny příznaky:  
- `HttpOnly`: Cookie nelze přečíst klientským skriptem (JavaScriptem), což poskytuje zásadní ochranu proti útokům typu Cross-Site Scripting (XSS);  
- `Secure`: Cookie je přenášena výhradně přes šifrované spojení HTTPS;  
- `SameSite=Lax/Strict`: Cookie se neodesílá při požadavcích pocházejících z cizích stránek, což brání útokům typu Cross-Site Request Forgery (CSRF). `[VERIFIED FROM CODE: server.ts]`  

3.2 **Místní úložiště (localStorage):**  
Klientské úložiště na zařízení uživatele, jehož data zůstávají uložena trvale i po zavření okna prohlížeče, dokud nejsou výslovně smazána uživatelem nebo klientským skriptem. Data v `localStorage` nejsou automaticky posílána na server v HTTP hlavičkách.  

3.3 **Relační úložiště (sessionStorage):**  
Dočasné úložiště, jehož data jsou platná pouze po dobu trvání otevřeného panelu (tabu) webového prohlížeče. Po zavření panelu jsou data automaticky vymazána.  

3.4 **IndexedDB:**  
Klientská databáze na zařízení pro ukládání strukturovaných dat.  
- **Stav v Portálu:** V současném běhovém kódu DEV3 **není runtime implementována**; v budoucnu je plánována pro mobilní offline PWA režim. `[PRODUCT INTENT]`  

3.5 **Cache Storage a Service Worker:**  
Vyrovnávací paměť prohlížeče využívaná v režimu PWA k uložení statických souborů aplikace (HTML, CSS, JS, ikony) za účelem rychlého načítání a chodu aplikace při výpadku internetového připojení. `[VERIFIED FROM CODE]`  

---

## ČÁST III: KATEGORIZACE A ÚČELY POUŽÍVANÝCH TECHNOLOGIÍ

Správce rozděluje veškeré technologie ukládání dat na koncovém zařízení do těchto 4 kategorií:

### 4. Kategorie podle účelu
4.1 **Nezbytné (Technické a bezpečnostní):**  
Zajišťují základní funkce Portálu: přihlášení uživatele, dvoufaktorovou autentizaci (TOTP), bezpečné ověření klíči Passkeys, ochranu proti padělání požadavků (CSRF tokeny), uchování volby v cookie liště a bezpečný průchod platební/autentizační branou. Tyto prvky nelze vypnout bez toho, aby došlo k znefunkčnění Portálu. Právní titul: § 89 odst. 3 zákona č. 127/2005 Sb. a čl. 6 odst. 1 písm. b) a f) GDPR.  

4.2 **Funkční (Uživatelské preference):**  
Umožňují zapamatovat si volby provedené Uživatelem (např. předvyplnění kontextu formuláře, dočasné koncepty redakčního systému Puck, stav rozbalení navigačních panelů). Právní titul: Souhlas dle § 89 odst. 3 zákona o elektronických komunikacích.  

4.3 **Analytické (Interní agregovaná statistika):**  
Slouží k pochopení toho, jak návštěvníci Portál využívají, jaké moduly jsou nejnavštěvovanější a kde dochází k chybám v rozhraní. Portál využívá výhradně **vlastní, self-hosted analytické řešení bez předávání dat reklamním společnostem**. Právní titul: Souhlas dle § 89 odst. 3 zákona o elektronických komunikacích.  

4.4 **Marketingové a reklamní:**  
**PORTÁL TÁTA MÁ PRÁVO NEPOUŽÍVÁ ŽÁDNÉ MARKETINGOVÉ ANI REKLAMNÍ COOKIES.** Portál nezobrazuje reklamy, neprofiluje uživatele pro cílení inzerce a nespolupracuje s reklamními sítěmi Google Ads, Meta Ads, Seznam Sklik ani žádnou jinou platformou.  

---

## ČÁST IV: KOMPLETNÍ TECHNICKÁ INVENTURA COOKIES A ÚLOŽIŠŤ

Následující tabulka uvádí kompletní, pravdivý a ze zdrojového kódu ověřený přehled veškerých identifikátorů ukládaných na zařízení uživatele:

| Název / Klíč | Typ úložiště | Kategorie | Doba platnosti | Účel a popis funkce | Přístup | Třetí strana | Právní titul |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `token` | HTTP Cookie | Nezbytné | Do odhlášení / 30 dnů | JWT autentizační token přihlášeného Uživatele. Zajišťuje autorizaci k privátním funkcím. Příznaky: `HttpOnly`, `SameSite=Lax/Strict`, `Secure`. | Pouze server | Ne | § 89 odst. 3 ZEK / Smlouva |
| `pending_mfa_user` | HTTP Cookie | Nezbytné | 10 minut | Dočasný identifikátor uživatelského účtu při probíhající dvoufázové výzvě TOTP. Příznaky: `HttpOnly`, `SameSite=Strict`. | Pouze server | Ne | § 89 odst. 3 ZEK / Bezpečnost |
| `passkey_auth_challenge` | HTTP Cookie | Nezbytné | 5 minut | Kryptografická výzva (challenge) generovaná serverem pro ověření identity přes FIDO2 / WebAuthn Passkeys. `HttpOnly`, `SameSite=Strict`. | Pouze server | Ne | § 89 odst. 3 ZEK / Bezpečnost |
| `passkey_reg_challenge` | HTTP Cookie | Nezbytné | 5 minut | Kryptografická výzva pro bezpečnou registraci nového hardwarového klíče Passkey. `HttpOnly`, `SameSite=Strict`. | Pouze server | Ne | § 89 odst. 3 ZEK / Bezpečnost |
| `google_oauth_state` | HTTP Cookie | Nezbytné | 15 minut | Kryptografický náhodný řetězec bránící útokům CSRF při federovaném přihlášení přes Google OAuth2. `HttpOnly`, `SameSite=Lax`. | Pouze server | Google LLC | § 89 odst. 3 ZEK / Bezpečnost |
| `microsoft_oauth_state`| HTTP Cookie | Nezbytné | 15 minut | Kryptografický náhodný řetězec bránící útokům CSRF při federovaném přihlášení přes Microsoft OAuth2. `HttpOnly`, `SameSite=Lax`. | Pouze server | Microsoft Corp. | § 89 odst. 3 ZEK / Bezpečnost |
| `oauth_return_url` | HTTP Cookie | Nezbytné | 15 minut | Uložení cílové URL adresy v rámci Portálu, na kterou má být Uživatel po úspěšném přihlášení přes OAuth přesměrován. `HttpOnly`. | Pouze server | Ne | § 89 odst. 3 ZEK / Funkčnost |
| `cookie_consent_v1` | localStorage | Nezbytné | 12 měsíců | Serializovaný JSON záznam o volbách Uživatele v cookie liště (`essential: true`, `functional: bool`, `analytics: bool`, `marketing: false`). | Klientský JS | Ne | § 89 odst. 3 ZEK / Splnění zákona |
| `session_hash` | localStorage | Nezbytné | 12 měsíců | Náhodně vygenerovaný pseudonymní identifikátor prohlížeče sloužící k prokázání volby v cookie liště a spárování s backendovým logem. | Klientský JS | Ne | Čl. 6 odst. 1 písm. c) GDPR |
| `tatovacesta_auth_token` | localStorage | Nezbytné ⚠️ | Do odhlášení | Klientská kopie Bearer JWT tokenu pro odesílání autorizační hlavičky `Authorization: Bearer <token>` z webového rozhraní. ⚠️ `[SECURITY REVIEW REQUIRED]` | Klientský JS | Ne | § 89 odst. 3 ZEK / Smlouva |
| `tmp_analytics_sid` | sessionStorage| Analytické | Do zavření panelu | Pseudonymní identifikátor relace interní klientské knihovny `AnalyticsClient` pro měření průchodu stránkami v rámci jedné návštěvy. | Klientský JS | Ne | Souhlas dle ZEK |
| `ai_assistant_initial_prompt` | sessionStorage | Funkční | Do zavření panelu | Dočasné předání textového zadání z veřejné kalkulačky či judikatury do okna asistenta Orion. | Klientský JS | Ne | Souhlas dle ZEK |
| `tatovapravo_form_context` | sessionStorage | Funkční | Do zavření panelu | Dočasné uložení vybraných parametrů rodinné situace pro generátor vzorových podání. | Klientský JS | Ne | Souhlas dle ZEK |
| `puck_pending_template` | localStorage | Funkční | Dočasné | Mezipaměť redakčních šablon v administrátorském rozhraní Puck editoru (využíváno editory). | Klientský JS | Ne | Oprávněný zájem / Smlouva |

---

## ČÁST V: INTERNÍ ANALYTIKA VS. ABSENCE REKLAMNÍCH TRACKERŮ

### 5. Samostatná self-hosted analytika
5.1 Portál pro vyhodnocování návštěvnosti využívá výhradně vlastní softwarové komponenty (`src/services/analyticsService.ts` a `src/lib/analyticsClient.ts`). `[VERIFIED FROM CODE]`  
5.2 **Principy interní analytiky:**  
- Události jsou navázány na dočasné náhodné ID relace (`tmp_analytics_sid` v `sessionStorage`), které se po zavření prohlížeče zničí;  
- Nesledujeme pohyb uživatelů napříč jinými internetovými stránkami;  
- Data o návštěvnosti nejsou spojována s rodinnými spisy ani nahrávanými soudními rozsudky;  
- Žádná analytická data nejsou předávána třetím stranám za účelem monetizace či tvorby marketingových profilů.  

### 6. Deklarace absence komerčních trackerů
6.1 Portál v současném zdrojovém kódu **neobsahuje a vědomě neimplementuje**:  
- Google Analytics / Google Tag Manager;  
- Meta Pixel (Facebook Pixel);  
- Sklik / Seznam konverzní a remarketingové skripty;  
- Hotjar, Smartlook či jiné záznamníky chování myši a obrazovky;  
- Reklamní skripty sociálních sítí (TikTok, X/Twitter, LinkedIn trackery).  

---

## ČÁST VI: SPRÁVA SOUHLASŮ, COOKIE LIŠTA A ULOŽENÍ VOLBY

### 7. Nastavení a změna preferencí
7.1 Při první návštěvě Portálu se Uživateli zobrazí informační a ovládací dialog – **Cookie lišta (`CookieConsentBanner.tsx`)**. `[VERIFIED FROM CODE: CookieConsentBanner.tsx]`  
7.2 Dialog umožňuje Uživateli:  
a) **Přijmout vše:** udělit souhlas se všemi kategoriemi (Funkční, Analytické);  
b) **Odmítnout volitelné:** pokračovat v prohlížení pouze se strictly necessary technickými prvky;  
c) **Detailní nastavení (Nastavit předvolby):** individuálně přepnout posuvníky pro Funkční a Analytické technologie. Kategorie „Nezbytné“ je technicky uzamčena a nelze ji vypnout.  

### 8. Odvolání a změna souhlasu
8.1 Uživatel má právo svůj dříve udělený souhlas s volitelnými cookies kdykoli bezplatně **změnit nebo zcela odvolat**.  
8.2 Odkaz pro vyvolání ovládacího dialogu nastavení preferencí je trvale umístěn v zápatí každé stránky Portálu pod názvem **„Nastavení cookies“** nebo **„Spravovat souhlasy“**.  
8.3 Změna preferencí nabývá účinnosti okamžitě po uložení; dříve shromážděná data v `sessionStorage` jsou při odvolání souhlasu vymazána.  

---

## ČÁST VII: NÁVOD NA ODSTRANĚNÍ A BLOKOVÁNÍ COOKIES V PROHLÍŽEČI

### 9. Globální blokování v nastavení webového prohlížeče
9.1 Uživatel může ukládání souborů cookie zakázat nebo již uložené soubory cookie vymazat přímo v nastavení svého internetového prohlížeče.  
9.2 Podrobné návody pro nejrozšířenější webové prohlížeče naleznete na níže uvedených oficiálních stránkách jejich tvůrců:  
- **Google Chrome:** `chrome://settings/cookies` nebo nápověda na `https://support.google.com/chrome/answer/95647`  
- **Mozilla Firefox:** `about:preferences#privacy` nebo nápověda na `https://support.mozilla.org/cs/kb/blokovani-cookies`  
- **Microsoft Edge:** `edge://settings/content/cookies` nebo nápověda na `https://support.microsoft.com/cs-cz/microsoft-edge`  
- **Apple Safari:** Předvolby -> Soukromí -> Spravovat data webových stránek  
- **Brave:** Nastavení -> Štíty (Brave Shields) -> Blokování cookies  
9.3 **Upozornění Správce:** Pokud Uživatel ve svém prohlížeči zcela zablokuje veškeré soubory cookie (včetně nezbytných technických cookies), **nebude možné přihlásit se k Uživatelskému účtu, používat CoParentHub ani bezpečně ukládat data**.  

---

## ČÁST VIII: BEZPEČNOSTNÍ REVIZE A PŘECHOD DO PRODUKČNÍHO REŽIMU

### 10. Bezpečnostní upozornění k autentizačním tokenům
10.1 V rámci bezpečnostního auditu zdrojového kódu DEV3 bylo identifikováno, že systém kromě `HttpOnly` cookies umožňuje klientské čtení JWT tokenu z `localStorage` (`tatovacesta_auth_token`). `[SECURITY REVIEW REQUIRED]`  
10.2 **Doporučení a budoucí krok:** Správce v rámci přípravy na produkční nasazení plánuje revizi tohoto mechanismu s cílem sjednotit veškerou správu relací do striktního režimu `HttpOnly` cookies, čímž bude zcela eliminováno teoretické riziko zcizení autentizačního tokenu skrze XSS útoky.  

---

## ČÁST IX: ZÁVĚREČNÁ USTANOVENÍ A KONTAKTY

### 11. Dotazy a kontakt
11.1 Máte-li jakékoli dotazy k používání souborů cookie nebo zpracování údajů o vašem zařízení, můžete se obrátit na technickou podporu a compliance tým Správce na e-mailu: `[TO VERIFY: podpora@tatovacesta.cz]`.  
11.2 Tyto Zásady používání souborů cookie v2.0.0-DRAFT nabývají platnosti a účinnosti dnem jejich formálního schválení a publikace na Portálu. Do té doby zůstává v platnosti verze v1.0.0.  

*Konec textu Zásad používání souborů cookie (Cookie Policy v2.0.0-DRAFT)*
