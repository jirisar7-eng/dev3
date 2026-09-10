# TECHNICKÁ A PRÁVNÍ INVENTURA FAKTŮ (LEGAL FACTS INVENTORY)
**Dokument ID:** `TMPR-FACTS-INV-DEV3-20260909`  
**Prostředí:** `DEV3`  
**Režim:** `READ-ONLY FACT DISCOVERY`  
**Datum:** 2026-09-09  
**Účel:** Autorizovaný a pravdivý podklad pro návrh právních dokumentů Legal Pack 2.0 bez domněnek a halucinací.

---

## POUŽITÉ METODICKÉ ZNAČENÍ
- `[VERIFIED FROM CODE]` – Fakt ověřen přímou analýzou zdrojového kódu (TypeScript/Node.js).
- `[VERIFIED FROM CONFIG]` – Fakt ověřen z konfiguračních souborů a Prisma schématu (`prisma/schema.prisma`).
- `[EXISTING LEGAL TEXT]` – Stav vyplývající ze stávajícího schváleného znění v1.0.0 / v1.1.0.
- `[PRODUCT INTENT]` – Architektonický a produktový cíl ekosystému Synthesis / Táta má právo.
- `[LEGAL RESEARCH REQUIRED]` – Otázka vyžadující formální posouzení právním poradcem.
- `[TO VERIFY BEFORE PUBLICATION]` – Údaj, který musí administrátor/provozovatel před publikací doplnit.

---

## ČÁST 1: IDENTITA PROVOZOVATELE A SPRÁVA IDENTIT (1–10)

### 1. Provozovatel / Operator Identity
- **Současný ověřený stav (Current Verified State):**
  - Provozovatelem portálu **Táta má právo** je **Jiří Šár**, fyzická osoba.
  - Současným provozovatelem **NENÍ** spolek, zapsaný spolek, společnost ani jiná právnická osoba.
  - Jiří Šár jako fyzická osoba v současném provozním modelu nedisponuje IČO pro tento projekt (nejedná se o zapsanou právnickou osobu), nemá statutární orgán, nemá sídlo právnické osoby ani zápis ve veřejném rejstříku.
  - `[LEGAL RESEARCH REQUIRED: determine mandatory operator identification for current natural-person operating model]` – Prověřit s advokátní kanceláří povinné identifikační a kontaktní minimum fyzické osoby poskytující bezúplatnou digitální službu informační společnosti dle zákona č. 480/2004 Sb., občanského zákoníku a GDPR.
  - `[ROZHODNUTÍ: Veřejná kontaktní/doručovací adresa]` – Z důvodu ochrany soukromí fyzické osoby nevkládat automaticky bydliště; stanovit samostatným rozhodnutím veřejnou doručovací/kontaktní adresu nebo P.O. Box.
- **Budoucí záměr (Future Product/Organizational Intent):**
  - `[PRODUCT INTENT — FUTURE]`: Projekt může být v budoucnu provozován nebo zastřešen nově založeným zapsaným spolkem. Spolek dosud nebyl založen, neexistuje, nemá IČO, nemá sídlo ani statutární orgán a nesmí být uváděn jako současný provozovatel, správce osobních údajů nebo smluvní strana v žádném veřejném právním dokumentu.
- **Historický stav v kódu:** V kódu a textech v1.0.0 (`src/data/legalDocuments.ts`, `src/services/dbStore.ts`) byl provozovatel uváděn jako placeholder `[REQUIRES_ADMIN_INPUT]` nebo zástupný text „Provozovatel portálu Táta má právo“. `[EXISTING LEGAL TEXT]`

### 2. Registrace a User model
- **Zjištěný stav:** `[VERIFIED FROM CONFIG]` Model `User` v `prisma/schema.prisma` (řádky 33–97):
  - Primární klíč: `id` (UUIDv4).
  - Pole: `email` (string, unikátní), `passwordHash` (string, volitelný pro OAuth), `name` (string), `gender` ("MALE" | "FEMALE", volitelné), `hasChildrenInitial` (boolean), `role` (enum `UserRoleType`), `status` (enum `AccountStatus`: `ACTIVE`, `SUSPENDED`, `BANNED`).
  - Bezpečnostní pole: `totpEnabled`, `totpSecret`, `totpTempSecret`, `totpBackupCodes` (string[]), `lastLoginAt`, `createdAt`, `updatedAt`.
  - Profilové vazby: `UserProfile` (`firstName`, `lastName`, `birthDate`, `phone`, `address`, `city`, `postalCode`, `autoFillDocs`), `UserPreference` (nastavení UI).

### 3. Autentizace
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/authService.ts` a `server.ts`. Podporuje multi-faktorovou a vícecestnou autentizaci:
  - Lokální heslo + salt (bcrypt).
  - Dvoufaktorové ověření (TOTP via RFC 6238).
  - FIDO2 / WebAuthn Passkeys.
  - Sociální/Federované přihlášení (OAuth2: Google, Microsoft).

### 4. Password accounts
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Hashování hesel probíhá pomocí `bcrypt` s cost faktorem 10–12. Plaintext heslo není nikdy ukládáno do DB ani logováno. Reset hesla generuje jednorázový token zasílaný přes e-mail (`emailService.ts`).

### 5. OAuth (Google & Microsoft)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/oauthService.ts` a `server.ts` (řádky 1315–1706).
  - Využívá CSRF ochranu přes podepsanou cookie `google_oauth_state` / `microsoft_oauth_state`.
  - Ukládá `googleId` a `microsoftId` do modelu `User`.
  - Nezískává přístup k privátním souborům uživatele na Disku/OneDrivu; získává pouze profil a e-mail pro ověření identity.

### 6. Passkeys / WebAuthn
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/passkeyService.ts` a `server.ts` (řádky 1740–2020) na bázi standardu FIDO2 / `@simplewebauthn/server`.
  - Model `Passkey` ukládá: `credentialId`, `publicKey` (Bytes), `counter` (BigInt), `transports`.
  - Přihlašovací výzva (`challenge`) je předávána přes podepsanou krátkodobou cookie `passkey_auth_challenge` / `passkey_reg_challenge`.
  - Biometrická data (otisk prstu, sken obličeje) zůstávají výhradně v klientském zařízení (Secure Enclave / TPM); server přijímá pouze kryptografický podpis výzvy.

### 7. TOTP / 2FA
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/totpService.ts` (využívá knihovnu `speakeasy` / `otplib`).
  - Podporuje standardní autentikační aplikace (Google Authenticator, Microsoft Authenticator, 1Password).
  - `totpSecret` je generován server-side; dočasný klíč `totpTempSecret` se maže po verifikaci.
  - Vydává sadu jednorázových záložních kódů (`totpBackupCodes`).

### 8. Sessions & Tokens
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Autentizace je založena na JSON Web Tokens (JWT) podepisovaných klíčem `JWT_SECRET`.
  - Token je ukládán v `HttpOnly`, `SameSite=Lax/Strict` cookie `token` s volitelným fallbackem do hlavičky `Authorization: Bearer <token>` pro API klienty.
  - Expirace tokenu: standardně 7 dní, zkrácená pro citlivé role.

### 9. RBAC (Role-Based Access Control)
- **Zjištěný stav:** `[VERIFIED FROM CONFIG]` Hierarchie rolí v `prisma/schema.prisma` a `src/types/index.ts`:
  - Veřejné / Uživatelské role: `USER`, `REGISTERED_USER`, `VERIFIED_USER`.
  - Komunitní / Obsahové role: `VOLUNTEER`, `VERIFIED_CONTRIBUTOR`, `LEGAL_EDITOR`, `CONTENT_MANAGER`.
  - Správní role: `MODERATOR`, `ADMIN`, `SUPER_ADMIN`, `SYSTEM_ADMIN`.
  - Vymáhání: Server-side middleware `requireAuth` a `requireRole(...)`.

### 10. Audit Logging
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Obecné auditování: Model `AuditLog` (`userId`, `action`, `module`, `details`, `ipAddress`, `userAgent`, `createdAt`).
  - Bezpečnostní přístup k citlivým datům: Model `SensitiveAccessLog` (`userId`, `targetUserId`, `resourceType`, `resourceId`, `action`).
  - Právní audity: Model `LegalAuditLog` (`userId`, `action`, `documentKey`, `documentVersion`, `ipAddress`, `userAgent`, `timestamp`).
  - Žádné hesla, tokeny ani rodná čísla nejsou zapisována do auditního logu.

---

## ČÁST 2: RODINNÁ DATA, SPOLURODIČOVSTVÍ A VEDENÍ KAUZY (11–19)

### 11. CoParentHub (Spolurodičovský prostor)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/coparentService.ts`.
  - Modul pro sdílenou správu péče o nezletilé děti mezi dvěma rodiči (nebo poručníky).
  - Vytváří izolovaný prostor `CoParentSpace` s režimem konfliktu (`conflictMode`: `COOPERATION`, `PARALLEL`, `HIGH_CONFLICT`).

### 12. Sdílené prostory (Shared Spaces)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Členství v prostoru je řízeno modelem `CoParentMember` (`userId`, `role`: `PARENT`, `GUARDIAN`, `OBSERVER`). Přístup třetích osob (např. babička, OSPOD pracovník) je možný výhradně na základě explicitní pozvánky (`CoParentInvite`).

### 13. Kalendář péče (Custody Calendar)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `CoParentEvent`, `CarePlan`, `CareDay`, `CareHolidayRule`.
  - Eviduje: rozvrh střídání péče, prázdninová schémata, lékařské prohlídky, školní kroužky.

### 14. Děti (Children Data)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `Child`, `CoParentChild`, `UserChild`.
  - Ukládané údaje: jméno, příjmení, datum narození, škola/školka, ošetřující lékař, zdravotní pojišťovna, alergie, velikost oblečení, kroužky.
  - Údaje o dětech jsou klasifikovány jako vysoce citlivé osobní údaje podléhající přísnému omezení přístupu.

### 15. Deník incidentů a denní záznamy (Diary / Incidents)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `CoParentDailyUpdate`, `CaseNote`, `CoParentHandover`.
  - Umožňuje zaznamenávat: průběh předání dítěte, zpoždění, náladu, incidenty, podávání léků, případná zranění včetně fotodokumentace.

### 16. Důkazy (Case Evidence)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Model `CaseEvidence` v `clientCaseService.ts`.
  - Eviduje důkazní položky pro soudní řízení: audio nahrávky, e-maily, SMS komunikaci, lékařské zprávy, posudky, zprávy OSPOD.
  - Každý záznam má relevanci, popis, zdroj a vazbu na soubor v úložišti.

### 17. Dokumenty (Document Vault)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `CaseDocument`, `CoParentDocument`, `UserDocument`.
  - Bezpečné úložiště rozsudků, usnesení, protokolů z jednání, rodných listů a návrhů.

### 18. Soudní a OSPOD data
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Záznamy o příslušném soudu (např. Okresní soud v Olomouci), spisové značce (např. 0 P 123/2024), jménech opatrovnických soudců a referentů OSPOD.

### 19. Úkoly a procesní lhůty (Tasks / Deadlines)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `CaseDeadline`, `CaseTask`.
  - Hídání procesních lhůt (např. lhůta 15 dnů pro odvolání proti rozsudku dle OSŘ).

---

## ČÁST 3: ÚLOŽIŠTĚ, SOUBORY A BEZPEČNOST UPLOADOVÁNÍ (20–23)

### 20. MinIO / S3 Storage
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/minioStorageService.ts`.
  - Využívá `@aws-sdk/client-s3` napojené na self-hosted MinIO instanci (nebo kompatibilní S3 bucket).
  - Výchozí bucket: `tatovacesta-studies` (nebo dle `MINIO_BUCKET`).
  - Ukládá hash souboru (`fileHash`, SHA-256), velikost a MIME typ.

### 21. Upload souborů
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Sanitizace názvů souborů: nahrazení nebezpečných znaků (`/[^a-zA-Z0-9_.-]/g`).
  - Podporované formáty: PDF, DOCX, obrázky (JPEG, PNG).
  - Přístup k souborům je řízen přes backend proxy (`/api/studies/pdf-file/...`) s autorizační kontrolou; soubory nejsou veřejně dostupné v otevřeném bucketu.

### 22. Antivirová kontrola (Malware Scanning)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/clamAvService.ts`.
  - Integrace se skenerem ClamAV přes TCP socket (`zINSTREAM` protokol, port 3310).
  - Streamování v 64KB blocích, fail-closed mechanismus: pokud ClamAV detekuje infekci, soubor je okamžitě odmítnut.

### 23. Zálohování (Backups)
- **Zjištěný stav:** `[TO VERIFY BEFORE PUBLICATION]` Zálohování PostgreSQL databáze a MinIO storage je řízeno na úrovni infrastruktury (VPS skripty / Docker volume snapshoty / pg_dump). Frekvence a retence záloh vyžadují ověření s DevOps správcem.

---

## ČÁST 4: UMĚLÁ INTELIGENCE, PARSOVÁNÍ A OCHRANA SOUKROMÍ (24–30)

### 24. Orion AI
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Identita: `agent-orion-qa-v1`.
  - Role: Deterministický AI Security Analyst, QA auditor a asistent správy systému (`src/services/audit/orionService.ts`).
  - Oprávnění: Přísně omezena průnikem uživatelských oprávnění a schopností agenta (`effectiveCapabilities = userCapabilities ∩ orionCapabilities`).
  - Není prezentován jako lidská bytost.

### 25. Judgment Parser (Analyzátor rozsudků)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/judgmentParserService.ts` a `deterministicJudgmentParser.ts`.
  - Slouží k extrakci právních vět, výroků o péči, výživném a styku z textů rozsudků.
  - Kombinuje deterministické regex parsování s volitelnou AI asistencí.

### 26. AI Generátory podání a formulářů
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/routes/aiRoutes.ts` (např. `/api/ai/chat`, `/api/ai/forms-generate`).
  - Generování konceptů návrhů (návrh na úpravu poměrů, střídavou péči, vyjádření k OSPOD).

### 27. AI Simulátor opatrovnických situací
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Endpointy `/api/ai/simulator` a `/api/ai/simulator-evaluate`.
  - Tréninkové prostředí pro rodiče simulující jednání u soudu, předávání dětí nebo rozhovor s OSPOD.

### 28. BIFF Metodika (Brief, Informative, Friendly, Firm)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Endpoint `/api/ai/biff-convert`.
  - Přeformulování emocionálně vypjatých zpráv na konstruktivní, stručnou a neútočnou komunikaci vhodnou pro předložení soudu.

### 29. Volání externích poskytovatelů AI a stav souladu (Provider Compliance Gate)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/AiService.ts`.
  - Multi-provider architektura s automatickým fallbackem:
    1. Google Gemini Primary (`gemini-3.6-flash` via `GEMINI_API_KEY`).
    2. Google Gemini Secondary (`GEMINI_API_KEY_2`).
    3. xAI Grok (`grok-2-1212` via `XAI_API_KEY` / `GROK_API_KEY`).
    4. Groq (`llama-3.3-70b-versatile` via `GROQ_API_KEY`).
  - Geografická lokace serverů: USA / globální servery poskytovatelů.
  - **PROVIDER COMPLIANCE GATE = BLOCKED:**
    - `TIER = NOT VERIFIED` – v kódu není doloženo, zda jsou klíče navázány výhradně na placené Enterprise účty.
    - `RETENTION = NOT VERIFIED` – přesná doba uchovávání na straně poskytovatelů není smluvně doložena.
    - `DPA / SCC = NOT VERIFIED` – dosud nebyla formálně uzavřena DPA (Data Processing Agreement) ani Standardní smluvní doložky (SCC) pro přenosy do třetích zemí.
    - `TRAINING ON DATA = TO VERIFY BEFORE PUBLICATION` – nelze blanketně prohlašovat, že žádný poskytovatel netrénuje na datech bez předložení platného podnikového kontraktu.
    - **Status:** `[LEGAL RESEARCH REQUIRED: ověřit DPA, SCC a podnikové podmínky s Google, xAI a Groq před ostrým spuštěním produkce]`.

### 30. Filtrování soukromí a pseudonymizace (Privacy Boundary)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/privacy/privacyFilterService.ts`.
  - **Fail-Closed pro čl. 9 GDPR:** Regexová detekce zdravotních a psychologických pojmů (`SPECIAL_CATEGORY_REGEX`). Pokud je detekováno podezření na data o zdraví, AI zpracování je zablokováno s chybou `PRIVACY_BOUNDARY_BLOCKED`.
  - **Pseudonymizace PII:** Nahrazení rodných čísel (`[RODNE_CISLO_X]`), bankovních účtů (`[BANKOVNI_UCET_X]`), e-mailů (`[EMAIL_X]`), telefonů (`[TELEFON_X]`) a jmen s daty narození tokeny. Po obdržení odpovědi provede `restorePseudonyms` zpětné dosazení.
  - **Důležité vymezení:** Nejedná se o matematicky garantovaný nulový přenos (0-PII) ani kryptografickou anonymizaci, nýbrž o heuristickou regex pseudonymizaci.

---

## ČÁST 5: ANALYTIKA, COOKIES A ÚLOŽIŠTĚ PROHLÍŽEČE (31–34)

### 31. Analytika (Self-Hosted Internal Analytics)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/analyticsService.ts` a `src/lib/analyticsClient.ts`.
  - Využívá interní klientskou knihovnu `AnalyticsClient`, která generuje pseudonymní `sessionId` (`sess_...`) ukládané v `sessionStorage` pod klíčem `tmp_analytics_sid`.
  - Odesílá agregované události (`AnalyticsEventType`: navigace, zobrazení modulů, kliknutí na funkce) přes endpoint `/api/analytics/event` (případně `navigator.sendBeacon` při ukončení relace).
  - Portál neobsahuje žádné komerční sledovací skripty třetích stran (Google Analytics, Google Tag Manager, Meta Pixel, Hotjar ani reklamní trackery).

### 32. Cookies
- **Zjištěný stav:** `[VERIFIED FROM CODE]` V `server.ts` a `cookieUtils.ts` se používají výhradně tyto cookies:
  1. `token` (JWT autentizační token relace, HttpOnly, SameSite=Lax/Strict, secure v produkci).
  2. `pending_mfa_user` (dočasný identifikátor uživatele při probíhající dvoufázové výzvě TOTP; maxAge 10 minut, HttpOnly, SameSite=Strict).
  3. `passkey_reg_challenge` / `passkey_auth_challenge` (krátkodobé kryptografické výzvy pro registraci a autentizaci FIDO2/WebAuthn; HttpOnly, SameSite=Strict).
  4. `google_oauth_state` / `microsoft_oauth_state` (kryptografické náhodné stavy pro ochranu proti CSRF útokům při OAuth autentizaci; signed, HttpOnly, SameSite=Lax).
  5. `oauth_return_url` (bezpečná návratová URL adresa po úspěšném přihlášení přes federovanou identitu; HttpOnly).
  - Všechny uvedené cookies spadají do kategorie **STRICTLY NECESSARY** (technické a bezpečnostní nezbytnosti dle § 89 odst. 3 zákona č. 127/2005 Sb., o elektronických komunikacích).

### 33. Úložiště prohlížeče (localStorage, sessionStorage, IndexedDB, Service Worker)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - **`localStorage`:**
    1. `tatovacesta_auth_token` (případně `tatovacesta_token`, `token`) – klientský Bearer JWT token pro autorizaci požadavků z webového rozhraní.  
       ⚠️ **`[SECURITY REVIEW REQUIRED]`**: Ukládání bearer JWT autentizačního tokenu v `localStorage` představuje vyšší expozici vůči XSS útokům ve srovnání s výhradním používáním `HttpOnly` cookies. Doporučena revize pro budoucí sjednocení do striktního `HttpOnly` režimu.
    2. `cookie_consent_v1` – serializovaný JSON stav preferencí cookie lišty (`{ essential: true, functional: boolean, analytics: boolean, marketing: boolean }`).
    3. `session_hash` – náhodný pseudonymní identifikátor relace pro spárování volby souhlasu s backendovým záznamem v `/api/legal/cookie-consent`.
    4. `puck_pending_template` – dočasný JSON serializované šablony editoru Puck v redakční části.
    5. `PUCK_*_RENDERER_ENABLED` – lokální příznaky aktivace experimentálních rendererů pro administrátory a editory.
  - **`sessionStorage`:**
    1. `tmp_analytics_sid` – dočasný identifikátor návštěvnické relace pro interní modul `AnalyticsClient`.
    2. `ai_assistant_initial_prompt` – přenos textového kontextu z veřejných modulů (kalkulačka, judikatura) do AI asistenta.
    3. `tatovapravo_form_context` – přenos vybraných parametrů formuláře do AI generátoru podání.
    4. `tatovacesta_auth_token` – záložní čtení autentizačního tokenu v klientských modálech.
  - **`IndexedDB`:** V současném běhovém kódu DEV3 **NENÍ runtime implementováno**; existuje pouze jako architektonický návrh pro budoucí mobilní offline PWA režim (`[PRODUCT INTENT]`).
  - **`Service Worker / Cache Storage`:** Standardní PWA cache pro offline dostupnost aplikačního jádra (statická HTML/CSS/JS aktiva a ikony).

### 34. Monitoring a systémové logování
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Standardní výstup na `stdout`/`stderr` běhového prostředí Node.js.
  - Vypnuté logování hesel a citlivých tokenů.

---

## ČÁST 6: KOMUNIKACE, EMAIL A NOTIFIKACE (35–36)

### 35. Mailcow & E-mailová infrastruktura
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Transakční e-maily: `emailService.ts` využívá `nodemailer` napojený na konfigurovaný SMTP server (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
  - Firemní/doménové schránky: `mailcowService.ts` komunikuje s instancí Mailcow API pro správu doménových schránek organizace.

### 36. Notifikace
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Systém odesílá transakční e-maily (potvrzení registrace, reset hesla, potvrzení smazání účtu).

---

## ČÁST 7: VEŘEJNÝ OBSAH, ZDROJE, KALKULÁTORY A SPOLEČNÉ MODULY (37–42)

### 37. Registr subjektů
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/subjektService.ts`.
  - Databáze opatrovnických soudů, pracovišť OSPOD, soudních znalců a mediátorů.
  - Integrace na veřejný registr ARES (`AresApiClient`) pro ověřování IČO a subjektů.

### 38. Mapy
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Využívá open-source Leaflet / OpenStreetMap pro vizualizaci spádovosti soudů a OSPOD bez komerčního sledování uživatelů.

### 39. Judikatura a právní databáze
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `CourtCase`, `Judgment`, `Study`.
  - Anotovaná judikatura Ústavního soudu a Nejvyššího soudu týkající se péče o děti a výživného.

### 40. e-Sbírka (Ministerstvo vnitra / DIA)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Implementováno v `src/services/EsbirkaService.ts`.
  - Přísně dodržuje kvóty: max 1 request/s, 1 souběžné spojení, 5 requestů/den.
  - Uživatelé přistupují výhradně k lokální databázi v PostgreSQL (`LegalAct`), nikdy nevolají API e-Sbírky přímo.

### 41. Kalkulačky (výživné, poměr péče)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Deterministické matematické výpočty na základě Doporučujících tabulek Ministerstva spravedlnosti ČR. Mají čistě orientační povahu.

### 42. Právní šablony a vzory podání
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Knihovna vzorů podání (návrhy, odvolání, stížnosti). Všechny vzory jsou obecnými metodickými pomůckami.

---

## ČÁST 8: DOBROVOLNÍCI A ORGANIZACE (43–45)

### 43. Dobrovolnické role
- **Zjištěný stav:** `[VERIFIED FROM CONFIG]`
  - Role: `VOLUNTEER`, `VERIFIED_CONTRIBUTOR`, `LEGAL_EDITOR`.
  - Přístup je omezen na přidělené moduly v Team Centru.

### 44. Dobrovolnický kodex (Volunteer Code)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Verze v1.0.0 je aktivní a publikovaná (`PUBLISHED`).
  - Verze v1.1.0 je uložena jako neveřejný koncept (`DRAFT`) dostupný pouze administrátorům.
  - V Legal Packu 2.0 bude navržen rozšířený návrh kodexu o 14 kapitolách.

### 45. Dohoda o spolupráci (Cooperation Agreement)
- **Zjištěný stav:** `[VERIFIED FROM CODE]` Model `VolunteerApplication` a vazba v `ComplianceService` (`dohoda-o-spolupraci`). Rámcová dohoda upravující mlčenlivost, ochranu osobních údajů a zákaz neoprávněného zastupování.

---

## ČÁST 9: PRÁVA SUBJEKTŮ, EXPORT, VÝMAZ A RETENCE (46–50)

### 46. Export uživatelských dat (Data Portability)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Endpoint `GET /api/gdpr/export-data` v `server.ts` (řádky 5160–5198).
  - Exportuje strojově čitelný JSON obsahující: uživatelský profil, případy (`cases`), poznámky (`notes`), data o dětech (`children`), události kalendáře (`events`), záznamy o dokumentech (`documents`), logy souhlasů (`userConsentLog`) a záznamy přístupů (`sensitiveAccessLog`).

### 47. Smazání účtu (Right to Erasure)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Modely `GdprDeletionRequest` a kaskádové mazání v Prisma schématu (`onDelete: Cascade` u vazeb `User` -> `cases`, `children`, `notes`, `profile`, `documents`).
  - Endpointy `POST /api/gdpr/deletion-request` a administrátorské zpracování.

### 48. Retence údajů (Data Retention)
- **Zjištěný stav:** `[TO VERIFY BEFORE PUBLICATION]` Údaje v aktivním účtu jsou uchovávány po dobu trvání registrace. Po zrušení účtu jsou osobní data smazána, s výjimkou auditních a účetních záznamů, jejichž uchování vyžaduje zákon.

### 49. Mechanismy souhlasu (Consent Mechanisms)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Model `Consent` a `UserConsentLog` evidují: `userId`, `documentType`, `documentVersion`, `ipAddress`, `userAgent`, `agreedAt`.

### 50. Akceptace právních dokumentů (Legal Document Acceptance)
- **Zjištěný stav:** `[VERIFIED FROM CODE]`
  - Rozhraní `LegalDocumentLayout.tsx` a `ComplianceModal.tsx`.
  - Mechanismus: textové potvrzení zadáním celého jména uživatele a kliknutím na tlačítko „Potvrdit přijetí dokumentu“.
  - Tiskový výstup používá pravdivou terminologii: *PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO* / *NEPOTVRZENO*. Žádný falešný nárok na „kvalifikovaný elektronický podpis“.
