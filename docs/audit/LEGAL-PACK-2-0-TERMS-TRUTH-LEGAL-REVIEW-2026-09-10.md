# PRÁVNĚ-TECHNICKÝ AUDIT A TRUTH REVIEW: PODMÍNKY UŽÍVÁNÍ (TERMS OF USE) 2.0
**Identifikátor auditu:** `AUDIT-TMPR-20260910-LEGAL-024`  
**Datum provedení:** 2026-09-10  
**Revodovaný dokument:** `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md`  
**Kanonické ID dokumentu:** `DOC-TMPR-TERMS-V2`  
**Klíč dokumentu v systému:** `terms`  
**Verze revidovaného návrhu:** `2.0.0-DRAFT` (Working Draft — Not for publication)  
**Prostředí / Běh:** DEV3 Workspace Container (Node.js 20, TypeScript, Prisma/PostgreSQL, S3/MinIO, ClamAV)  
**Commit / HEAD:** `HEAD: Workspace Container / DEV3 Environment (Git repository containerized/detached)`  
**Typ auditu:** Hloubková read-only právně-technická verifikace (Technical Truth Review + Security Review + Legal Basis Audit)  
**Konečný verdikt:** `NEEDS CORRECTIONS`

---

## 1. ROZSAH AUDITU A PŘEZKOUMANÉ ZDROJE

Tento audit byl proveden v souladu se zadáním `TMPR-20260910-LEGAL-024` v **striktním read-only režimu**. V průběhu auditu nebyly modifikovány žádné produkční databáze, API endpointy, aplikační logiky, zdrojové právní koncepty (`02-TERMS-OF-USE-DRAFT.md`) ani generovaný kód (`legalDrafts20.ts`).

### Přezkoumané zdrojové soubory v HEAD:
1. **Právní dokumentace a koncepty:**
   - `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (SSOT pro Terms of Use 2.0)
   - `docs/legal-drafts/legal-pack-2.0/00-LEGAL-FACTS-INVENTORY.md`
   - `docs/legal-drafts/legal-pack-2.0/01-LEGAL-PACK-ARCHITECTURE.md`
   - `docs/legal-drafts/legal-pack-2.0/10-PRE-PUBLICATION-LEGAL-REVIEW.md`
   - `src/data/legalDrafts20.ts` & `src/data/legalDocuments.ts`
2. **Databázové schéma a persistence:**
   - `prisma/schema.prisma` (modely `User`, `UserProfile`, `Passkey`, `CoParentSpace`, `CoParentMember`, `CoParentEvent`, `CoParentHandover`, `CoParentMessage`, `CoParentExpense`, `CoParentAuditLog`, `Case`, `CaseEvidence`, `CaseDeadline`, `CaseDocument`, `UserConsentLog`, `SensitiveAccessLog`, `GdprDeletionRequest`)
3. **Backendové služby a middleware:**
   - `server.ts` (API endpointy, autentizace, GDPR export/výmaz, upload middleware)
   - `src/services/authService.ts` (Argon2id / bcrypt / PBKDF2 migrace, session tokeny)
   - `src/services/totpService.ts` (RFC 6238 TOTP, generování tajemství, záložní kódy)
   - `src/services/passkeyService.ts` (FIDO2 / WebAuthn standard `@simplewebauthn/server`)
   - `src/services/oauthService.ts` (Google & Microsoft OAuth2 flow, validace ID tokenů)
   - `src/services/coparentService.ts` (CoParentHub, conflict modes, auditní export)
   - `src/services/clientCaseService.ts` (Case management, CaseEvidence, Deadlines, Timeline)
   - `src/services/minioStorageService.ts` (S3/MinIO objektové úložiště, SHA-256 hashe, sanitizace)
   - `src/services/clamAvService.ts` (ClamAV TCP socket streamování, fail-closed bezpečnostní pravidlo)
   - `src/services/audit/orionService.ts` (Asistent Orion `agent-orion-qa-v1`, capability boundaries)
   - `src/services/privacy/privacyFilterService.ts` (Fail-closed čl. 9 GDPR, `SPECIAL_CATEGORY_REGEX`, pseudonymizace PII)
   - `src/services/AiService.ts` (Multi-provider fallback: Gemini Primary/Secondary, Grok xAI, Groq)
   - `src/services/judgmentParserService.ts` & `deterministicJudgmentParser.ts` (Analyzátor rozsudků)
   - `src/services/EsbirkaService.ts` (e-Sbírka synchronizace a dodržování kvót)
   - `src/services/subjektService.ts` (Registr subjektů, ARES konektor)
   - `src/services/complianceService.ts` (UserConsentLog, blokace akceptace konceptů)
   - `src/components/public/ComplianceModal.tsx` & `LegalDocumentLayout.tsx` (UI auditní akceptace)
4. **Testovací sady:**
   - `tests/legal-pack-2-0-ssot.test.ts`
   - `tests/legal-pack-2-0-terms-expansion.test.ts`

---

## 2. TECHNICKÁ TRUTH MATRIX (POROVNÁNÍ TVRZENÍ V TERMS VS. KÓD V HEAD)

Každé podstatné technické tvrzení uvedené v návrhu Podmínek užívání bylo porovnáno s reálným kódem, schématem databáze a konfigurací.

| # | Prověřovaná oblast / Tvrzení v Terms | Odkaz v Terms | Skutečný stav v kódu (HEAD) | Klasifikace pravdivosti |
|---|---|---|---|---|
| 1 | **Hesla & Hashování**<br>„Hesla jsou ukládána výhradně v podobě hashů vygenerovaných algoritmem `bcrypt` s adaptivní výpočetní náročností.“ | Čl. 12.1(a) | V `src/services/authService.ts` je výchozím hashovacím algoritmem moderní **Argon2id** (`@node-rs/argon2`). Při přihlášení systém podporuje zpětnou kompatibilitu s `bcrypt` (`bcrypt.compare`) a PBKDF2 a při úspěšném matchi transparentně upgraduje hash na Argon2id (`$argon2id$`). | `PARTIALLY VERIFIED`<br>*(Discrepancy: Kód používá Argon2id, text uvádí bcrypt)* |
| 2 | **Dvoufaktorové ověřování (TOTP)**<br>RFC 6238 časové kódy, Google/MS Authenticator, 1Password, záložní kódy `totpBackupCodes`. | Čl. 12.1(b) | `src/services/totpService.ts` plně implementuje RFC 6238 TOTP (`speakeasy`), generuje 8 jednorázových kryptografických záložních kódů. `schema.prisma` obsahuje pole `totpEnabled`, `totpSecret`, `totpTempSecret`, `totpBackupCodes`. | `VERIFIED IMPLEMENTED` |
| 3 | **Passkeys / FIDO2 / WebAuthn**<br>Bezheslové přihlašování via `@simplewebauthn`, biometrie zůstává v čipu zařízení (TPM/Secure Enclave), server přijímá jen veřejný klíč a podpis. | Čl. 12.1(c) | Implementováno v `src/services/passkeyService.ts` a `server.ts` pomocí `@simplewebauthn/server`. Model `Passkey` v `prisma/schema.prisma` ukládá `credentialId`, `publicKey` (Bytes), `counter` (BigInt), `transports`. | `VERIFIED IMPLEMENTED` |
| 4 | **Federované přihlašování (OAuth2)**<br>Google & Microsoft OAuth2, získává pouze e-mail a ID token, nezískává přístup k Disku/OneDrivu ani poště. | Čl. 12.1(d) | V `src/services/oauthService.ts` jsou vyžádány pouze scopes `openid email profile` (Google) a `openid email profile User.Read` (MS). Tokeny jsou kryptograficky ověřovány (`google-auth-library` / JWKS). Žádné scopes pro čtení souborů nejsou požadovány. | `VERIFIED IMPLEMENTED` |
| 5 | **RBAC a autorizace**<br>Role: `USER`, `REGISTERED_USER`, `VERIFIED_USER`, `VOLUNTEER`, `VERIFIED_CONTRIBUTOR`, `LEGAL_EDITOR`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`, `SYSTEM_ADMIN`. | Čl. 15.1, 15.2 | V `prisma/schema.prisma` (řádky 13–25) je definován enum `UserRoleType` se všemi těmito rolemi. Vynucováno server-side middlewarem `requireAuth` a `requireRole(...)`. Pokusy o manipulaci logovány do `SensitiveAccessLog`. | `VERIFIED IMPLEMENTED` |
| 6 | **CoParentHub & CoParentSpace**<br>Sdílené prostory, pozvánky `CoParentInvite`, role (`PARENT`, `GUARDIAN`, `OBSERVER`), režimy konfliktu (`COOPERATION`, `PARALLEL`, `HIGH_CONFLICT`), kalendář, předávání, výdaje. | Čl. 19–25 | Plně implementováno v `src/services/coparentService.ts`. Prisma obsahuje modely `CoParentSpace`, `CoParentMember`, `CoParentChild`, `CoParentEvent`, `CoParentHandover`, `CoParentMessage`, `CoParentExpense`, `CoParentRequest`, `CoParentAuditLog`. | `VERIFIED IMPLEMENTED` |
| 7 | **CoParentAuditLog & Export**<br>Nezvratný auditní log úkonů ve spolurodičovském prostoru, export dat pro soud/mediaci. | Čl. 25.2, Čl. 20 | V `src/services/coparentService.ts` metoda `exportAuditData(spaceId, userId)` generuje kompletní strukturovaný JSON balíček a zaznamenává akci do `CoParentAuditLog`. | `VERIFIED IMPLEMENTED` |
| 8 | **Case Management & Evidence**<br>Osobní opatrovnická složka (`Case`), Důkazní katalog (`CaseEvidence`), soudy, OSPOD, spisové značky, časová osa. | Čl. 26–28 | Implementováno v `src/services/clientCaseService.ts` (`createEvidence`, `authorizeCaseAccess`, `getTimeline`, `generateCaseExport`). Modely `Case`, `CaseEvidence`, `CaseParticipant`, `CaseEvent` v `schema.prisma`. | `VERIFIED IMPLEMENTED` |
| 9 | **Správa lhůt (Deadlines)**<br>Hlídání procesních lhůt (`CaseDeadline`) s orientační povahou a výslovným vyloučením odpovědnosti. | Čl. 29 | Implementováno v `clientCaseService.ts` (`createDeadline`, `toggleDeadline`, `deleteDeadline`). Prisma model `CaseDeadline` ukládá `deadlineDate`, `isHardDeadline`, `completed`. | `VERIFIED IMPLEMENTED` |
| 10 | **MinIO / S3 Storage & Upload**<br>Privátní S3/MinIO úložiště, proxy přístup bez veřejné indexace, max. 50 MB, sanitizace názvů, podpora formátů. | Čl. 30, 31 | V `src/services/minioStorageService.ts` je napojení na MinIO via `@aws-sdk/client-s3`. Provádí sanitizaci (`/[^a-zA-Z0-9_.-]/g`), SHA-256 hash a proxy stahování. Limity velikosti 50 MB nastaveny v parseru. | `VERIFIED IMPLEMENTED` |
| 11 | **ClamAV Antivirus & Fail-Closed**<br>Antivirová kontrola přes TCP socket (`zINSTREAM`, port 3310), fail-closed bezpečnostní pravidlo (odmítnutí při chybě/timeoutu i infekci). | Čl. 32 | `src/services/clamAvService.ts` streamuje v 64KB blocích. Socket timeout/error vyvolá výjimku s textem `Fail-Closed`. V `caseRoutes.ts` (ř. 298), `judgmentParserService.ts` (ř. 232) a `server.ts` (ř. 4367) je upload při jakémkoli selhání ClamAV okamžitě ukončen s HTTP 400. | `VERIFIED IMPLEMENTED` |
| 12 | **GDPR Export dat**<br>Strojově čitelný JSON export na `GET /api/gdpr/export-data` (profil, případy, děti, poznámky, kalendář, dokumenty, logy). | Čl. 50.4 | V `server.ts` (ř. 5182–5250) endpoint `GET /api/gdpr/export-data` s kontrolou přihlášení (`requireAuth`) exportuje kompletní data uživatele z PostgreSQL. | `VERIFIED IMPLEMENTED` |
| 13 | **GDPR Žádost o smazání účtu**<br>Endpoint `POST /api/gdpr/deletion-request`, kaskádové mazání dat v databázi. | Čl. 53.2, 53.3 | Endpoint `POST /api/gdpr/deletion-request` v `server.ts` (ř. 5122) vytváří záznam v `GdprDeletionRequest`. V `schema.prisma` mají relační vazby nastaveno `onDelete: Cascade`. *(Pozn: zjištěn autorizační nález S-01 viz Security sekce)*. | `VERIFIED IMPLEMENTED` |
| 14 | **Orion AI & Oprávnění**<br>Asistenční entita `agent-orion-qa-v1`, striktní omezení práv průnikem (`effectiveCapabilities`), zákaz lidské identity. | Čl. 36, 37 | Implementováno v `src/services/audit/orionService.ts` a `orionTraceStore.ts`. Identita `agent-orion-qa-v1` je softwarovým agentem bez autonomního přístupu k cizím datům. *(Pozn: anotace v Terms uvádí `orionService.ts` místo `src/services/audit/orionService.ts`)*. | `VERIFIED IMPLEMENTED` |
| 15 | **BIFF Metodika**<br>Konverze zpráv na Brief, Informative, Friendly, Firm via `/api/ai/biff-convert`. | Čl. 38 | V `src/routes/aiRoutes.ts` je implementován endpoint `/api/ai/biff-convert` s aplikací systémových instrukcí pro deeskalaci komunikace. | `VERIFIED IMPLEMENTED` |
| 16 | **Judgment Parser**<br>Optické rozpoznávání a sémantická analýza výroků rozsudků, pomocná orientační povaha. | Čl. 39 | Implementováno v `src/services/judgmentParserService.ts` a `deterministicJudgmentParser.ts`. Extrahuje výroky a integruje je do klientského případu. | `VERIFIED IMPLEMENTED` |
| 17 | **Privacy Filter & SPECIAL_CATEGORY_REGEX**<br>Fail-Closed filtr pro čl. 9 GDPR (`SPECIAL_CATEGORY_REGEX`) + pseudonymizace PII (RČ, IBAN, telefony, e-maily, jména s daty narození). | Čl. 41.1 | V `src/services/privacy/privacyFilterService.ts` je definován `SPECIAL_CATEGORY_REGEX` (zdraví/psychologie); při shodě vrací `blocked: true` (Fail-Closed). PII je nahrazováno tokeny a po návratu z AI zpětně dosazeno (`restoreText`). | `VERIFIED IMPLEMENTED` |
| 18 | **Externí AI provideři & Compliance Gate**<br>Google Gemini, xAI Grok, Groq (USA/globální servery). Upozornění, že DPA/SCC podléhají prověření (`PROVIDER COMPLIANCE GATE = BLOCKED`). | Čl. 41.2 | `src/services/AiService.ts` volá Google Gemini, xAI a Groq s automatickým fallbackem. V `00-LEGAL-FACTS-INVENTORY.md` i `10-PRE-PUBLICATION-LEGAL-REVIEW.md` je status `PROVIDER COMPLIANCE GATE = BLOCKED` evidován jako blokující pro produkci. | `VERIFIED IMPLEMENTED` |
| 19 | **e-Sbírka integrace & limity**<br>Server-side synchronizace (max 1 req/s, 1 spojení, 5 req/den). Uživatel přistupuje k lokální kopii v DB. | Čl. 44 | Implementováno v `src/services/EsbirkaService.ts` a `server.ts`. Uživatelé dotazují PostgreSQL model `LegalAct`, nikdy přímo API e-Sbírky. | `VERIFIED IMPLEMENTED` |
| 20 | **Audit akceptace dokumentů (ComplianceModal)**<br>Evidence v `UserConsentLog` a `Consent`, označení „PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO“, zákaz falešného tvrzení o kvalifikovaném podpisu. | Čl. 57.2, 57.5 | V `src/services/complianceService.ts`, `src/components/public/ComplianceModal.tsx` a `LegalDocumentLayout.tsx`. Systém ukládá ID uživatele, klíč dokumentu, verzi, IP a User-Agent. Textové potvrzení bez klamavého označení. | `VERIFIED IMPLEMENTED` |

---

## 3. SECURITY REVIEW & NÁLEZY (P0 – P3)

Při hloubkové kontrole byl prověřován rozdíl mezi tím, co Podmínky užívání slibují, a tím, co systém skutečně v kódu a na API vynucuje.

### Přehled bezpečnostních nálezů:

#### 🔴 [P1] Nález S-01: Chybějící autorizace na endpointu pro žádost o výmaz dat (`POST /api/gdpr/deletion-request`)
- **Dotčený soubor:** `server.ts` (řádek 5122)
- **Popis problému:** Endpoint `app.post('/api/gdpr/deletion-request', ...)` nemá v deklaraci middleware `requireAuth`. V těle funkce načítá `const { userId } = req.body; const targetUserId = userId || req.user?.id;`. Neautentizovaný útočník může odeslat POST požadavek s libovolným `userId` oběti a vytvořit tak neoprávněnou žádost o výmaz cizího účtu v tabulce `GdprDeletionRequest`.
- **Porovnání s Terms:** Článek 53.2 a 15 deklarují striktní kontrolu identity a zákaz IDOR manipulací.
- **Riziko:** Vysoké (P1) — Neautorizovaná manipulace s procesem výmazu účtu cizího uživatele.
- **Doporučená oprava:** Doplnit middleware `requireAuth` na endpoint a zamezit předávání cizího `userId` v těle požadavku (použít striktně `req.user.id`).

#### 🟡 [P2] Nález S-02: Chybějící autorizační middleware na pomocných GDPR logovacích endpointech
- **Dotčený soubor:** `server.ts` (řádky 5072 a 5098)
- **Popis problému:** Endpointy `POST /api/gdpr/consent-log` a `POST /api/gdpr/sensitive-access` nemají explicitní `requireAuth` middleware a akceptují `userId` přímo z `req.body`.
- **Porovnání s Terms:** Článek 15 a 57.5 deklarují integritu bezpečnostních a auditních logů.
- **Riziko:** Střední (P2) — Znečištění auditní stopy podvrženými záznamy o akceptaci či přístupech.
- **Doporučená oprava:** Doplnit `requireAuth` a vynutit čtení identity výhradně z ověřené JWT relace (`req.user.id`).

#### 🟡 [P2] Nález S-03: Ukládání Bearer tokenu v `localStorage` vs. deklarace výhradních `HttpOnly` cookies
- **Dotčený soubor:** `src/lib/authClient.ts` / klientské komponenty vs. Terms Článek 14.2
- **Popis problému:** Článek 14.2 Podmínek uvádí, že autentizační token je distribuován prostřednictvím bezpečnostních cookies s příznaky `HttpOnly`, `SameSite` a `Secure`. Klientská aplikace však pro běh v SPA/iFrame prostředí ukládá JWT token i do `localStorage` pod klíčem `tatovacesta_auth_token` a posílá jej v hlavičce `Authorization: Bearer <token>`.
- **Porovnání s Terms:** Rozpor mezi právní formulací slibující ochranu proti XSS přes výhradní `HttpOnly` a reálným stavem klientského bundlu.
- **Riziko:** Střední (P2) — Možnost exfiltrace tokenu při hypotetické XSS zranitelnosti v prohlížeči.
- **Doporučená oprava:** V textu Článku 14.2 doplnit transparentní informaci o kombinovaném způsobu autentizace (HttpOnly cookie + volitelný Bearer token pro API a klientské rozhraní) nebo plně sjednotit klientskou vrstvu na výhradní HttpOnly cookies.

#### 🟢 [P3] Nález S-04: Technická diskrepance v označení hashovacího algoritmu hesel (Argon2id vs. Bcrypt)
- **Dotčený soubor:** `src/services/authService.ts` vs. Terms Článek 12.1(a)
- **Popis problému:** Článek 12.1(a) uvádí hashování výhradně algoritmem `bcrypt`. Kód v `authService.ts` však používá `Argon2id` (`@node-rs/argon2`), přičemž `bcrypt` slouží jako legacy fallback pro starší účty s automatickým přechodem na Argon2id.
- **Porovnání s Terms:** Argon2id je kryptograficky bezpečnější než bcrypt, ale formulace v Terms je fakticky nepřesná.
- **Riziko:** Nízké (P3) — Terminologická nepřesnost bez negativního bezpečnostního dopadu.
- **Doporučená oprava:** Upravit text Článku 12.1(a) na: *„Hesla jsou ukládána výhradně v podobě hashů vygenerovaných algoritmem Argon2id (případně bcrypt pro starší účty) s adaptivní výpočetní náročností.“*

#### 🟢 [P3] Nález S-05: Zkrácené cesty k souborům v interních verifikačních anotacích
- **Dotčený soubor:** `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (řádky 158, 394, 524)
- **Popis problému:** V pracovních anotacích `[VERIFIED FROM CODE: ...]` jsou uvedeny pouze názvy souborů `orionService.ts` (místo `src/services/audit/orionService.ts`), `privacyFilterService.ts` (místo `src/services/privacy/privacyFilterService.ts`) a `ComplianceModal.tsx` (místo `src/components/public/ComplianceModal.tsx`).
- **Riziko:** Nízké (P3) — Interní anotace, které nebudou součástí finálního textu pro veřejnost.

---

## 4. LEGAL REVIEW & PRÁVNÍ HODNOCENÍ DOKUMENTU

Právní ustanovení v návrhu Podmínek užívání byla přezkoumána z hlediska souladu s platným právním řádem České republiky a unijním právem.

### Přehled právních oblastí:

1. **Občanský zákoník (zákon č. 89/2012 Sb.):**
   - **§ 2389a a násl. (Poskytování digitálního obsahu a digitálních služeb):** Správně aplikován v Článku 3.1 na bezúplatný režim digitální služby. (*Status: VERIFIED LEGAL BASIS*)
   - **§ 2898 (Kogentní limity omezení náhrady škody):** Článek 54.2 přesně a bezchybně vymezuje, že Provozovatel nevylučuje ani neomezuje odpovědnost za újmu způsobenou člověku na jeho přirozených právech (život, zdraví, osobnostní práva dle § 81 an.), újmu způsobenou úmyslně nebo z hrubé nedbalosti a zákonná práva spotřebitele. Článek 55 upravuje limity v ostatních dovolených případech (vyšší moc, nesprávné zadání uživatelem). (*Status: VERIFIED LEGAL BASIS*)
   - **§ 86 (Ochrana osobnosti a neoprávněné nahrávky):** V Článku 28.2 je uvedeno přesné a důrazné varování před pořizováním tajných audio/video nahrávek a porušováním listovního tajemství. (*Status: VERIFIED LEGAL BASIS*)
   - **§ 855 an. & Úmluva o právech dítěte (čl. 3):** Článek 16 správně staví nejlepší zájem dítěte jako nejvyšší interpretační zásadu Portálu. (*Status: VERIFIED LEGAL BASIS*)

2. **Zákon o advokacii (zákon č. 85/1996 Sb.):**
   - **§ 21 (Advokátní mlčenlivost) a výhrada právních služeb:** Články 6, 7 a 8 kategoricky a zřetelně vylučují poskytování právních služeb, advokátního poradenství a vznik vztahu advokát–klient. Dokument výslovně doporučuje konzultaci s advokátem zapsaným v České advokátní komoře (ČAK). (*Status: VERIFIED LEGAL BASIS*)

3. **Obecné nařízení o ochraně osobních údajů (GDPR) & zákon č. 110/2019 Sb.:**
   - **Čl. 9 GDPR (Zvláštní kategorie údajů):** Článek 17 a 41 reflektují přísný režim ochrany údajů o dětech a zdravotních informací s fail-closed blokací při AI zpracování. (*Status: VERIFIED LEGAL BASIS*)
   - **Čl. 20 GDPR (Právo na přenositelnost údajů):** Článek 50.4 přesně odkazuje na realizovaný JSON export. (*Status: VERIFIED LEGAL BASIS*)
   - **Čl. 17 GDPR (Právo na výmaz):** Článek 53 upravuje postup podání žádosti o výmaz účtu. (*Status: VERIFIED LEGAL BASIS*)

4. **Zákon o ochraně spotřebitele (zákon č. 634/1992 Sb.):**
   - **Mimosoudní řešení spotřebitelských sporů (ADR):** Článek 58 obsahuje povinnou zákonnou notifikaci o možnosti mimosoudního řešení sporů před Českou obchodní inspekcí (ČOI, Štěpánská 44, Praha 2, adr@coi.cz) a platformou ODR Evropské komise. (*Status: VERIFIED LEGAL BASIS*)

5. **EU AI Act (Nařízení EP a Rady (EU) 2024/1689):**
   - **Čl. 50 (Povinnosti transparentnosti pro poskytovatele a zavádějící subjekty systémů AI):** Článek 36 správně deklaruje, že uživatel je vždy informován o interakci s AI, že výstupy jsou generované modely a že žádný AI modul není lidskou bytostí, advokátem ani psychologem. (*Status: VERIFIED LEGAL BASIS*)

6. **Zákon o některých službách informační společnosti (zákon č. 480/2004 Sb.):**
   - **§ 5 a 6 (Odpovědnost poskytovatele za ukládání obsahu uživatelů - hosting):** Článek 51 formuluje standardní mechanismus *Notice and Take Down* pro moderaci uživatelských příspěvků a hodnocení. (*Status: VERIFIED LEGAL BASIS*)

---

## 5. PROVOZOVATEL A IDENTIFIKAČNÍ ÚDAJE

Dokument byl detailně prověřen z hlediska pravdivosti uvedení Provozovatele:
1. **Fyzická osoba:** V Článku 1.2 i v celém textu je Provozovatel jednoznačně a pravdivě označen jako **Jiří Šár, fyzická osoba**.
2. **Nepředstírání neexistujících entit:** Dokument **nepředstírá** existenci zapsaného spolku, nadačního fondu ani obchodní společnosti.
3. **Produktový záměr spolku:** Případné budoucí založení zapsaného spolku je striktně a zřetelně označeno jako `[PRODUCT INTENT — FUTURE]`.
4. **Ochrana před halucinacemi:** V textu nejsou vymyšlena žádná fiktivní IČO, neexistující statutární orgány ani neověřená sídla.
5. **Otevřené identifikátory:** Identifikační minimum fyzické osoby a oficiální doručovací/bezpečnostní e-maily jsou řádně označeny značkami `[LEGAL RESEARCH REQUIRED]` a `[TO VERIFY BEFORE PUBLICATION]`.

---

## 6. PUBLICATION BLOCKERS (PŘEKÁŽKY PRO PUBLIKACI)

Před formálním schválením a publikací Podmínek užívání do produkce musí být vyřešeny následující blokující podmínky:

1. 🛑 **PB-01: Provider Compliance Gate (DPA & SCC pro AI providery)**  
   - Status: `BLOCKED`  
   - Popis: Před spuštěním AI modulů v produkčním režimu musí být formálně uzavřeny a ověřeny DPA (Data Processing Agreements) a Standardní smluvní doložky (SCC) s poskytovateli modelů (Google, xAI, Groq) a vyloučeno trénování na uživatelských datech.
2. 🛑 **PB-02: Právní stanovení identifikačního minima Provozovatele (Fyzická osoba)**  
   - Status: `LEGAL RESEARCH REQUIRED`  
   - Popis: Advokátní posouzení povinných identifikačních a doručovacích náležitostí fyzické osoby provozující bezúplatný informační portál dle zákona č. 480/2004 Sb., občanského zákoníku a GDPR (vyřešení veřejné kontaktní adresy / P.O. Boxu bez nutnosti zveřejňovat trvalé bydliště).
3. 🛑 **PB-03: Bezpečnostní oprava autorizace na GDPR API (Nález S-01 a S-02)**  
   - Status: `NEEDS CODE PATCH`  
   - Popis: Doplnění `requireAuth` na `/api/gdpr/deletion-request`, `/api/gdpr/consent-log` a `/api/gdpr/sensitive-access` před otevřením registrací veřejnosti.
4. 🛑 **PB-04: Formální revize a autorizace advokátem České advokátní komory (ČAK)**  
   - Status: `PENDING ADVOKAT REVIEW`  
   - Popis: Znění návrhu 2.0.0-DRAFT musí projít finálním právním posouzením a schválením advokátem specializovaným na IT právo a rodinné právo.

---

## 7. DOPORUČENÉ ÚPRAVY TEXTU TERMS V BUDOUCÍ EDITACI

Při zahájení etapy editace textu (navazující task) se doporučuje provést tyto konkrétní úpravy:
1. **Článek 12.1(a):** Aktualizovat zmínku o hashování hesel na kombinaci `Argon2id` s legacy podporou `bcrypt`.
2. **Článek 14.2:** Upřesnit distribuci tokenů (HttpOnly cookie + volitelný Bearer token pro klientské API).
3. **Články 5.11, 41.1, 57.2:** Upravit cesty v technických anotacích na plné relativní cesty v repozitáři (`src/services/audit/orionService.ts`, `src/services/privacy/privacyFilterService.ts`, `src/components/public/ComplianceModal.tsx`).
4. **Článek 1.2:** Po rozhodnutí Provozovatele a právním posouzení doplnit autorizovanou veřejnou doručovací adresu a kontaktní e-maily.

---

## 8. SOUHRNNÁ STATISTIKA AUDITU

- **Prověřeno věcných položek celkem:** 20
  - `VERIFIED IMPLEMENTED`: 19
  - `PARTIALLY VERIFIED`: 1 (Argon2id vs. bcrypt v čl. 12.1a)
  - `NOT IMPLEMENTED`: 0
  - `OUTDATED`: 0
  - `PRODUCT INTENT — FUTURE`: 1 (Zapsaný spolek v čl. 1.2)
  - `UNVERIFIABLE`: 0
- **Právní klasifikace:**
  - `VERIFIED LEGAL BASIS`: 6/6 hlavních právních pilířů
  - `NEEDS LEGAL REVIEW`: 1 (Identifikační minimum fyzické osoby)
  - `INCORRECT / OUTDATED`: 0
- **Bezpečnostní nálezy:**
  - `P0 (Kritické)`: 0
  - `P1 (Vysoké)`: 1 (S-01: Chybějící `requireAuth` na `/api/gdpr/deletion-request`)
  - `P2 (Střední)`: 2 (S-02: GDPR logovací endpointy bez requireAuth; S-03: Bearer token v localStorage vs. výhradní HttpOnly cookie)
  - `P3 (Nízké / Informativní)`: 2 (S-04: Argon2id vs. bcrypt v textu; S-05: Zkrácené cesty v anotacích)
- **Publication Blockers:** 4 (PB-01 až PB-04)

---

## 9. KONEČNÝ VERDIKT

# `VERDICT: NEEDS CORRECTIONS`

**Odůvodnění:**  
Návrh Podmínek užívání `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (v2.0.0-DRAFT) představuje mimořádně kvalitní, detailní a strukturovaný normativní podklad (63 KB textu v 60 článcích), který v drtivé většině věrně a pravdivě odráží skutečnou implementaci v kódu a schématu databáze. 

Verdikt **`NEEDS CORRECTIONS`** je stanoven z důvodu:
1. Nutnosti drobných věcných korekcí v textu před finálním právním posouzením (aktualizace hashovacího algoritmu na Argon2id, upřesnění distribuce tokenů).
2. Přítomnosti bezpečnostního nálezu P1 v routeru (`POST /api/gdpr/deletion-request`), který je nutné v kódu opravit.
3. Existence 4 jasně definovaných překážek publikace (`Publication Blockers`), včetně `PROVIDER COMPLIANCE GATE = BLOCKED` a nutnosti finální autorizace advokátem České advokátní komory.
