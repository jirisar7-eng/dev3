# TECHNICKÝ A BEZPEČNOSTNÍ AUDIT: POST-CANCEL VERIFICATION & GDPR SECURITY REGRESSION GATE
**Identifikátor auditu:** `AUDIT-TMPR-20260910-LEGAL-026`
**Datum provedení:** 2026-09-10
**Navazuje na audity:**
- `docs/audit/LEGAL-PACK-2-0-TERMS-TRUTH-LEGAL-REVIEW-2026-09-10.md` (`AUDIT-TMPR-20260910-LEGAL-024`)
- `docs/audit/LEGAL-PACK-2-0-SECURITY-REMEDIATION-2026-09-10.md` (`AUDIT-TMPR-20260910-LEGAL-025` — zrušený / neukončený běh)
**Dotčené komponenty:**
- `server.ts` (Endpointy `POST /api/gdpr/deletion-request`, `POST /api/gdpr/consent-log`, `POST /api/gdpr/sensitive-access`)
- `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (SSOT pro Terms of Use 2.0)
- `src/data/legalDrafts20.ts` (Deterministicky generovaný artefakt)
- `tests/gdpr-security-remediation-phase025.test.ts` (Integrační testovací sada)
- `scripts/test-runner.js` (Globální test runner)
- `CHANGELOG.md` (Evidence změn)
**Prostředí / Běh:** DEV3 Workspace Container (Node.js 20, TypeScript, Prisma/PostgreSQL fallback, Express, Node Test Runner)
**Výsledný status:** `VERIFIED & RECONCILED`
**Právní status dokumentů:** `WORKING DRAFT — NOT FOR PUBLICATION` (Stav: `READY FOR LEGAL REVIEW`)

---

## 1. KONTEXT A MOTIVACE NEZÁVISLÉHO OVĚŘENÍ

Běh úkolu `TMPR-20260910-LEGAL-025` (GDPR Security Remediation & Terms Technical Corrections) byl ze strany řídicího prostředí AI Studia neočekávaně přerušen ve stavu `CANCELED`. Přestože předchozí asistent stihl zapsat část změn do souborů, nebylo jisté:
1. Zda byl soubor `server.ts` upraven korektně, funkčně a bez syntaktických či logických chyb,
2. Zda byla oprava skutečně nasazena do běžícího běhového prostředí (runtime) a otestována,
3. Zda testovací sada `tests/gdpr-security-remediation-phase025.test.ts` skutečně existuje a prochází,
4. Zda je generátor Legal Pack 2.0 v souladu s Markdown SSOT a zda je idempotentní,
5. Zda záznamy o auditních logách uvedené v předchozím auditu odpovídají realitě v datovém schématu Prisma,
6. Zda byl aktualizován `CHANGELOG.md`.

Tento audit představuje rigorózní, nezávislou a na předpokladech nezávislou verifikaci skutečného stavu pracovního stromu.

---

## 2. NALEZENÝ STAV REPOZITÁŘE A SOUBOROVÉHO STROMU

### 2.1 Git stav v kontejneru
- **`git branch --show-current`:** `fatal: not a git repository (or any of the parent directories): .git`
- **`git rev-parse HEAD`:** `Workspace Container / DEV3 Environment (Git repository containerized/detached)`
- **`git status / diff`:** N/A — AI Studio Cloud Run kontejner operuje v izolovaném workspace bez lokálního adresáře `.git`. Autoritativním cílovým repozitářem je `jirisar7-eng/dev3` (větev `main`), kam probíhá publikace přes `GithubPublisherService`.

### 2.2 Fyzický stav klíčových souborů na disku
| Soubor | Fyzická přítomnost | Stav obsahu | Verifikace |
| :--- | :---: | :--- | :---: |
| `server.ts` | ANO | Obsahuje `requireAuth` i IDOR ochranu pro všechny 3 GDPR POST endpointy (řádky 5072–5163) | ✅ Ověřeno |
| `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` | ANO | Obsahuje specifikaci `Argon2id` s upgradem z `bcrypt` a hybridní token model | ✅ Ověřeno |
| `src/data/legalDrafts20.ts` | ANO | Plně odpovídá 7 Markdown SSOT souborům (SHA256: `abb7de7ad0574760...`) | ✅ Ověřeno |
| `tests/gdpr-security-remediation-phase025.test.ts` | ANO | 8 testů (statické i dynamické), kompletně implementováno | ✅ Ověřeno (8/8 PASS) |
| `scripts/test-runner.js` | ANO | Obsahuje položku č. 58 pro `gdpr-security-remediation-phase025.test.ts` | ✅ Ověřeno (58/58 PASS) |
| `docs/audit/LEGAL-PACK-2-0-SECURITY-REMEDIATION-2026-09-10.md` | ANO | Zapsán v minulém běhu; obsahuje však faktickou nepřesnost ohledně auditní tabulky (viz Sekce 4) | ⚠️ Identifikována nepřesnost |
| `CHANGELOG.md` | ANO | Záznam pro LEGAL-025 chyběl z důvodu CANCELED stavu běhu | ⚠️ Chyběl (Doplněn v LEGAL-026) |

---

## 3. VÝSLEDKY VERIFIKACE BEZPEČNOSTNÍCH NÁLEZŮ (S-01 AŽ S-04)

### 3.1 Nález S-01: `POST /api/gdpr/deletion-request` (P1)
- **Implementační audit v `server.ts` (řádky 5136–5163):**
  ```typescript
  app.post('/api/gdpr/deletion-request', requireAuth as any, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, notes } = req.body;
      const authenticatedUserId = req.user?.id;
      if (!authenticatedUserId) return res.status(401).json({ error: 'Neautorizovaný přístup. Přihlaste se prosím.' });

      // Invariant: client-supplied userId must not target another user (IDOR prevention)
      if (userId && userId !== authenticatedUserId) {
        return res.status(403).json({ error: 'Přístup odepřen. Nelze žádat o výmaz cizího uživatelského účtu.' });
      }

      const targetUserId = authenticatedUserId;
      const prisma = getPrismaClient();
      if (prisma && (prisma as any).gdprDeletionRequest) {
        const request = await (prisma as any).gdprDeletionRequest.create({
          data: {
            userId: targetUserId,
            status: 'PENDING',
            notes: notes || 'Žádost uživatele o výmaz osobních údajů (Právo být zapomenut - Čl. 17 GDPR)',
          },
        });
        return res.json({ success: true, request });
      }
      res.json({ success: true, message: 'Žádost o výmaz byla zaznamenána.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  ```
- **Ověření chování:**
  1. **Neautentizovaný požadavek:** `requireAuth` odmítá s kódem **HTTP 401 Unauthorized**.
  2. **Uživatel A žádá o výmaz Uživatele B (IDOR pokus):** Router detekuje neshodu `userId !== authenticatedUserId` a odmítá s kódem **HTTP 403 Forbidden**.
  3. **Uživatel A žádá bez `userId` nebo se svým `userId`:** Identita je pevně navázána na `authenticatedUserId`, požadavek je zapsán do `GdprDeletionRequest` se statusem `PENDING`.
  4. Klientské `userId` **není** autoritativním zdrojem identity.
- **Hodnocení:** `RESOLVED & TEST-PROVEN`

### 3.2 Nález S-02: `POST /api/gdpr/consent-log` a `POST /api/gdpr/sensitive-access` (P2)
- **Implementační audit v `server.ts` (řádky 5072–5134):**
  - Obě trasy jsou chráněny middlewarem `requireAuth`.
  - Pokud klient odešle `userId`, které neodpovídá autentizovanému uživateli, router vrací **HTTP 403 Forbidden** (*„Přístup odepřen. Nelze zaznamenávat souhlas/auditní záznam za cizího uživatele.“*).
  - Vytvářené záznamy v DB jsou striktně navázány na `authenticatedUserId`.
- **Hodnocení:** `RESOLVED & TEST-PROVEN`

### 3.3 Nález S-03: Klientské ukládání JWT tokenu v `localStorage` (P2)
- **Faktický nález v kódu:**
  - Token v `localStorage` (`tatovacesta_auth_token`) obsahuje **plnohodnotný autentizační JWT token** podepsaný `JWT_SECRET`.
  - **Životnost:** 2 hodiny pro administrátory (`ADMIN`, `SUPER_ADMIN`, `SYSTEM_ADMIN`), 24 hodin pro standardní uživatele (`AuthService.generateToken`).
  - **Obnova / Expirace / Revokace:** Neexistuje mechanismus refresh tokenů (`/api/auth/refresh`). Neexistuje databázový blacklist/revokační seznam pro zneplatnění tokenů před vypršením jejich platnosti.
  - **Bezpečnostní riziko:** Při případném XSS útoku má útočník možnost přečíst surový JWT token a vystupovat pod identitou uživatele po dobu až 24 hodin, čímž je degradována ochrana poskytovaná `HttpOnly` cookies.
  - **Vyvrácení falešných předpokladů (Truth Verification):**
    - *Tvrzení 1: „localStorage je nutný pro offline PWA vault.“* -> **NEPRAVDIVÉ / NEPROKÁZANÉ.** Offline trezor `SecureDB` šifruje data lokálně v IndexedDB pomocí PBKDF2/AES-GCM na základě uživatelského PINu a soli, nikoli z JWT tokenu. Při opětovném připojení k síti `useOfflineSync` volá `apiFetch`, který má explicitně nastaveno `credentials: 'include'`. Pokud by aplikace používala výhradně `HttpOnly` cookie, prohlížeč by ji při online synchronizaci odeslal automaticky.
    - *Tvrzení 2: „localStorage je striktně nutný pro iframe/sandbox.“* -> **ČÁSTEČNÝ FALLBACK.** V AI Studio preview prostředí na jedné doméně fungují cookies korektně, avšak v případě vložení do přísných sandboxů třetích stran (ITP v Safari, CHIPS / partitioned cookies) může být přenos `Authorization: Bearer` spolehlivější. Nejde však o neřešitelnou technologickou nutnost, nýbrž o architektonickou zkratku.
- **Kategorizace nálezu:**
  **`S-03 = SECURITY DEBT (Technologický a bezpečnostní dluh)`**
  Nejedná se o bezpečný finální stav ani o false positive. Jde o bezpečnostní dluh, který musí být před spuštěním ostrého produkčního provozu odstraněn.
- **Doporučený navazující krok:**
  Založit samostatný ticket **`TMPR-AUTH-COOKIE-MIGRATION`**, v jehož rámci bude klientská autentizace plně převedena na `HttpOnly` cookie se SameSite ochranou, CSRF tokenem a tichou obnovou relace (silent refresh), čímž bude token z `localStorage` kompletně odstraněn. V tomto ticketu se auth nerefactoruje (v souladu se zadáním).

### 3.4 Nález S-04: Technická harmonizace Podmínek užívání (P3)
- **Původní rozpor:** Podmínky uváděly hashování hesel pouze přes `bcrypt`. Skutečný kód v `src/services/authService.ts` používá moderní `Argon2id` (`@node-rs/argon2`) a `bcrypt` drží pouze jako fallback pro staré účty s automatickým povýšením na Argon2id při přihlášení.
- **Skutečný stav po úpravě:**
  - V `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (Článek 12.1(a)) je přesně specifikován `Argon2id` s automatickým upgradem z legacy `bcrypt`.
  - V Článku 14.2 je přesně popsán hybridní model (kombinace `Authorization: Bearer` a `HttpOnly` cookies).
  - Spuštěn generátor `scripts/generateLegalDrafts20.ts`, výstup v `src/data/legalDrafts20.ts` je 100% identický a neměnný (idempotentní).
- **Hodnocení:** `RESOLVED & SSOT SYNCHRONIZED`

---

## 4. AUDIT INTEGRITY: REÁLNÉ CHOVÁNÍ AUDITNÍCH MODELŮ V PRISMA

Předchozí koncept auditu `AUDIT-TMPR-20260910-LEGAL-025` uváděl tvrzení:
> *„Všechny interní zápisy do tabulky GdprDeletionRequest i do auditního logu SensitiveAccessLog používají výhradně authenticatedUserId.“*

### 4.1 Faktické ověření proti zdrojovému kódu a schématu Prisma:
Podrobná inspekce `server.ts` a `prisma/schema.prisma` prokázala, že toto tvrzení bylo **nepřesné**:

1. **`POST /api/gdpr/deletion-request`:**
   - Zapisuje **výhradně** do modelu `prisma.gdprDeletionRequest` (řádek 5150):
     `{ userId: targetUserId, status: 'PENDING', notes: ... }`.
   - **Nezapisuje** do tabulky `SensitiveAccessLog`. Model `GdprDeletionRequest` je sám o sobě primárním relačním nosičem stavu žádosti o výmaz s relací na uživatele (`user: User @relation(..., onDelete: Cascade)`).
2. **`POST /api/gdpr/consent-log`:**
   - Zapisuje **výhradně** do modelu `prisma.userConsentLog` (řádek 5088):
     `{ userId: targetUserId, documentType: ..., documentVersion: ..., ipAddress: ..., userAgent: ... }`.
   - **Nezapisuje** do tabulky `SensitiveAccessLog`.
3. **`POST /api/gdpr/sensitive-access`:**
   - Zapisuje do modelu `prisma.sensitiveAccessLog` (řádek 5120):
     `{ userId: targetUserId, action: ..., resource: ..., ipAddress: ... }`.

### 4.2 Závěr k integritě:
Tvrzení, že „všechny GDPR operace zapisují do SensitiveAccessLog“, je **vyvráceno jako nepřesné**. Systém disponuje třemi specializovanými relačními modely, z nichž každý plní svou přesně vymezenou roli dle schématu Prisma. V souladu s pravidly neprovádíme zbytečné změny architektury pouze kvůli sjednocení názvu v dokumentaci, nýbrž uvádíme dokumentaci do souladu s realitou.

---

## 5. VÝSLEDKY TEST GATE A VERIFIKACE KVALITY

V rámci verifikace byly spuštěny všechny relevantní testy, typová kontrola a build:

### 5.1 GDPR Security Remediation Test Suite (`tests/gdpr-security-remediation-phase025.test.ts`)
- **Výsledek:** `8/8 PASS` (100 %)
- **Testované scénáře:**
  - Statické ověření přítomnosti `requireAuth` u všech GDPR POST endpointů.
  - Statické ověření specifikace `Argon2id` v Markdown SSOT Terms of Use.
  - Dynamický test: Neautentizovaný požadavek na `/api/gdpr/deletion-request` vrací `401`.
  - Dynamický test: Autentizovaný Uživatel A cílící na Uživatele B vrací `403 Forbidden` (IDOR obrana).
  - Dynamický test: Autentizovaný Uživatel A bez specifikace `userId` úspěšně vytvoří žádost pro sebe (`200 OK`).
  - Dynamický test: Autentizovaný Uživatel A se shodným `userId` úspěšně vytvoří žádost pro sebe (`200 OK`).
  - Dynamický test: `/api/gdpr/consent-log` vyžaduje auth a odmítá cizí `userId` (`403`).
  - Dynamický test: `/api/gdpr/sensitive-access` vyžaduje auth a odmítá cizí `userId` (`403`).

### 5.2 Legal Pack 2.0 Test Suites
- **`tests/legal-pack-2-0-ssot.test.ts`:** `7/7 PASS` (Ověření SSOT, determinismu a Fail-Closed ochrany návrhů)
- **`tests/legal-pack-2-0-terms-expansion.test.ts`:** `11/11 PASS` (Ověření rozsahu, článků a právních doložek Terms)
- **`tests/legal-pack-2-0-draft-preview.test.ts`:** `12/12 PASS` (Ověření izolace konceptů, admin-only náhledu a neměnnosti ostrých dokumentů)

### 5.3 Auth & Session Bezpečnostní regrese (`tests/auth-remediation-phase05b.test.ts`)
- **Výsledek:** `12/12 PASS` (Ověření MFA tokenů, expirací JWT pro admina/uživatele a odmítání expirovaných tokenů)

### 5.4 Globální testovací runner (`scripts/test-runner.js`)
- **Příkaz:** `npm test`
- **Rozsah:** 58 testovacích sad
- **Výsledek:** `🎉 ALL TESTS PASSED SUCCESSFULLY.` (0 selhání)

### 5.5 Typová kontrola a build
- **`lint_applet` (`npx tsc --noEmit`):** Dokončeno bez jediné chyby (0 chyb).
- **`compile_applet` (`vite build`):** Sestavení proběhlo úspěšně (`Build succeeded - the applet is compiled`).

---

## 6. PŘEHODNOCENÍ PUBLIKAČNÍCH BLOKERŮ (PB-01 AŽ PB-04)

| Kód | Název blokeru | Stav před LEGAL-025 | Aktuální stav po LEGAL-026 | Odůvodnění a podmínky |
| :---: | :--- | :---: | :---: | :--- |
| **PB-01** | **Provider Compliance Gate (DPA / SCC)** | `BLOCKED` | `BLOCKED` | **Aktivní bloker.** Externí AI provideři (OpenAI, Anthropic, Google Cloud) nemají pro produkční provoz podepsány řádné DPA/SCC pro zpracování zvláštních kategorií osobních údajů. |
| **PB-02** | **Identifikační minimum Provozovatele** | `BLOCKED` | `BLOCKED` | **Aktivní bloker.** V návrzích byl zcela vymýcen fiktivní spolek i neexistující IČO a provozovatel je správně označen jako fyzická osoba Jiří Šár. Před publikací však musí být doplněna oficiální doručovací adresa/bydliště namísto zástupných placeholderů. |
| **PB-03** | **Autorizace na GDPR API** | `BLOCKED` | **`RESOLVED`** | **Vyřešeno.** Endpointy `/api/gdpr/deletion-request`, `/api/gdpr/consent-log` a `/api/gdpr/sensitive-access` jsou zabezpečeny centrálním middlewarem `requireAuth`, identita je server-side vázána na `req.user.id`, pokusy o IDOR vrací 403 Forbidden. Ověřeno jednotkovými, integračními i regresními testy. |
| **PB-04** | **Formální revize advokátem ČAK** | `PENDING` | **`ACTIVE CONDITION PRECEDENT`** | **Podmínka předání před publikací.** *Poznámka dle metodiky:* Revize advokátem ČAK není obecnou zákonnou podmínkou dle práva ČR, avšak představuje závaznou řídicí a governance podmínku Provozovatele pro minimalizaci právních rizik před předložením textů uživatelům k závazné akceptaci. |

---

## 7. KONEČNÝ VERDIKT A DOPORUČENÍ

1. **Stav implementace po zrušeném běhu LEGAL-025:**
   Všechny bezpečnostní úpravy na úrovni zdrojového kódu `server.ts`, testů i textů Podmínek užívání v souborovém systému **zůstaly zachovány, jsou funkční, stabilní a 100% testovatelné**.
2. **Status právní dokumentace Legal Pack 2.0:**
   Dokumenty v `docs/legal-drafts/legal-pack-2.0/` splňují technickou pravdivost (Truth Verification), jsou provázány s reálným kódem a jsou:
   **`READY FOR LEGAL REVIEW`** (Připraveno pro odborné posouzení českou advokátní kanceláří).
   Dokumenty **NEJSOU** ve stavu `READY FOR PUBLICATION` (zůstávají aktivní blokery PB-01 a PB-02 a čeká se na výsledek revize PB-04).
3. **Navazující technický úkol:**
   Založit ticket `TMPR-AUTH-COOKIE-MIGRATION` pro bezpečné vyřešení bezpečnostního dluhu S-03 (přechod na čistě HttpOnly cookie model).
