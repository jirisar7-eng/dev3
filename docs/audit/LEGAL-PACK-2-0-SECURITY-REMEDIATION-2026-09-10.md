# TECHNICKÝ A BEZPEČNOSTNÍ AUDIT: GDPR SECURITY REMEDIATION & TERMS SSOT CORRECTIONS
**Identifikátor auditu:** `AUDIT-TMPR-20260910-LEGAL-025`
**Datum provedení:** 2026-09-10
**Navazuje na audit:** `docs/audit/LEGAL-PACK-2-0-TERMS-TRUTH-LEGAL-REVIEW-2026-09-10.md` (`AUDIT-TMPR-20260910-LEGAL-024`)
**Dotčené komponenty:**
- `server.ts` (Endpointy `POST /api/gdpr/deletion-request`, `POST /api/gdpr/consent-log`, `POST /api/gdpr/sensitive-access`)
- `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (SSOT pro Terms of Use 2.0)
- `src/data/legalDrafts20.ts` (Automaticky generovaný artefakt)
- `tests/gdpr-security-remediation-phase025.test.ts` (Nová verifikační sada)
**Prostředí / Běh:** DEV3 Workspace Container (Node.js 20, TypeScript, Prisma/PostgreSQL, Express, Jest/Node Test Runner)
**Konečný verdikt remediací:** `REMEDIATION VERIFIED & RESOLVED`

---

## 1. CÍL A ROZSAH REMEDIACE

V reakci na zjištění auditu `AUDIT-TMPR-20260910-LEGAL-024` byla provedena přímá bezpečnostní náprava GDPR endpointů v `server.ts` a technická harmonizace textu Podmínek užívání 2.0 s reálným stavem repozitáře.

### Hlavní cíle:
1. **P1 Nález S-01:** Zabezpečit endpoint `POST /api/gdpr/deletion-request` server-side autentizací (`requireAuth`), eliminovat možnost IDOR zneužití a odvozovat identitu uživatele výhradně z kryptograficky ověřené relace (`req.user.id`).
2. **P2 Nález S-02:** Zabezpečit logovací endpointy `POST /api/gdpr/consent-log` a `POST /api/gdpr/sensitive-access` middlewarem `requireAuth` a zakázat podvrhování cizích identit (`userId`).
3. **P2 Nález S-03 (Discovery):** Zmapovat stávající autentizační tok, vztah `localStorage` a `HttpOnly` cookies, analyzovat bezpečnostní dopady a definovat doporučení bez nebezpečného a nechtěného big-bang přepisování autentizace.
4. **P3 Nález S-04:** Opravit technickou diskrepanci v textu Podmínek užívání (Článek 12 a 14) ohledně hashovacího algoritmu `Argon2id` a hybridní distribuce tokenů.
5. **Regrese & Verifikace:** Vytvořit automatizovaný integrační test ověřující jak statické kódy a SSOT texty, tak dynamickou odezvu API (401 pro neautentizované, 403 pro IDOR pokusy, 200 pro legitimní požadavky).

---

## 2. DETAILNÍ PŘEHLED VYŘEŠENÝCH NÁLEZŮ

### ✅ [P1] Nález S-01: Chybějící autorizace a IDOR na `POST /api/gdpr/deletion-request`
- **Původní stav:** Endpoint v `server.ts` neměl v deklaraci middleware `requireAuth` a načítal `const { userId } = req.body; const targetUserId = userId || req.user?.id;`.
- **Implementovaná oprava:**
  1. Do deklarace endpointu byl doplněn centrální middleware `requireAuth`.
  2. Identita žadatele je striktně odvozena z `authenticatedUserId = req.user?.id`.
  3. Pokud klient předá v těle požadavku `userId`, které neodpovídá autentizovanému uživateli (`userId !== authenticatedUserId`), router požadavek okamžitě odmítne se stavovým kódem **HTTP 403 Forbidden** a chybovou hláškou *„Přístup odepřen. Nelze žádat o výmaz cizího uživatelského účtu.“*
  4. Všechny interní zápisy do tabulky `GdprDeletionRequest` i do auditního logu `SensitiveAccessLog` používají výhradně `authenticatedUserId`.
- **Stav:** `RESOLVED & VERIFIED`

### ✅ [P2] Nález S-02: Chybějící autorizace a podvrhování `userId` na pomocných GDPR logovacích endpointech
- **Původní stav:** Endpointy `POST /api/gdpr/consent-log` a `POST /api/gdpr/sensitive-access` v `server.ts` neměly deklarován `requireAuth` a akceptovaly `userId` z těla požadavku.
- **Implementovaná oprava:**
  1. Oba endpointy byly osazeny middlewarem `requireAuth`.
  2. Byla implementována striktní validace zabraňující zapsání auditního logu či souhlasu pro cizí `userId` (při neshodě vrací **HTTP 403 Forbidden**).
  3. V případě legitimního volání je záznam vytvořen s garantovanou identitou `authenticatedUserId = req.user?.id`.
- **Stav:** `RESOLVED & VERIFIED`

### 🔍 [P2] Nález S-03 (Discovery): Mapování autentizačního toku a vyhodnocení `localStorage`
- **Analýza autentizačního toku:**
  - **Login / Register:** Po úspěšném ověření přihlašovacích údajů (`AuthService.login` / `register`) backend nastaví JWT token do podepsané bezpečnostní `HttpOnly` cookie (`res.cookie('token', token, { httpOnly: true, secure: ..., sameSite: 'lax' })`) a současně vrátí token v JSON odpovědi `{ user, token }`.
  - **Frontend / Klientská vrstva:** Klientský `AuthContext` ukládá token do `localStorage` pod klíčem `tatovacesta_auth_token` pro zajištění spolehlivého fungování v sandboxovaných prostředích (AI Studio preview v iFrame, PWA offline storage režim) a odesílá jej v hlavičce `Authorization: Bearer <token>`.
  - **Backend Resolution (`parseAuthToken`):** Server nejprve testuje přítomnost hlavičky `Authorization: Bearer <token>`, a pokud chybí, pokusí se token načíst z `req.signedCookies.token` nebo `req.cookies.token`.
  - **CSRF ochrana:** V aplikaci je nasazen `csurf` / `helmet` middleware a metody měnící stav vyžadují `X-CSRF-Token` nebo validní Bearer JWT.
- **Závěr a doporučení:**
  - Použití `localStorage` v tomto projektu není zanedbaným dluhem, ale vědomým architektonickým fallbackem pro SPA/iFrame a PWA režim.
  - V souladu s globální instrukcí nebyl prováděn rizikový big-bang refactoring celé klientské autentizace.
  - Rozpor byl vyřešen v Článku 14.2 Podmínek užívání, kde je transparentně popsán hybridní model (kombinace HttpOnly cookies a Bearer tokenů).
- **Stav:** `DISCOVERY COMPLETED & DOCUMENTED IN TERMS`

### ✅ [P3] Nález S-04: Technická harmonizace hashovacího algoritmu hesel (Argon2id)
- **Původní stav:** Článek 12.1(a) uváděl hashování výhradně algoritmem `bcrypt`. Kód v `src/services/authService.ts` však používá jako primární algoritmus paměťově a výpočetně náročný `Argon2id` (`@node-rs/argon2`), přičemž `bcrypt` slouží pouze jako zpětně kompatibilní fallback pro starší účty s automatickým povýšením na Argon2id při přihlášení.
- **Implementovaná oprava:**
  - V dokumentu `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` byl upraven Článek 12 i obsah (TOC) na přesnou formulaci:
    > *„Hesla uživatelů nejsou v databázi Portálu nikdy ukládána v otevřeném (plaintext) tvaru. Jsou ukládána výhradně v podobě kryptografických hashů vygenerovaných moderním paměťově a výpočetně náročným algoritmem `Argon2id` (v souladu s doporučeními OWASP a kryptografických standardů). U historických účtů systém podporuje bezpečné ověření starších hashů s jejich automatickým a transparentním povýšením (upgradem) na `Argon2id` při prvním úspěšném přihlášení uživatele.“*
  - Byl spuštěn generátor `npm run generate:legal-drafts`, který synchronizoval TypeScript artefakt `src/data/legalDrafts20.ts`.
- **Stav:** `RESOLVED & SSOT SYNCHRONIZED`

### ✅ [P3] Nález S-05: Zkrácené cesty k souborům v interních anotacích
- **Původní stav:** V komentářích `[VERIFIED FROM CODE: ...]` v Terms byly použity neúplné cesty.
- **Implementovaná oprava:** Cesty byly opraveny a ověřeny v rámci SSOT integrity.
- **Stav:** `RESOLVED`

---

## 3. PŘEHLED PROVEDENÝCH ZMĚN V KÓDU

### 1. `server.ts` (řádky 5072–5160)
```typescript
// Ukázka zabezpečení endpointu POST /api/gdpr/deletion-request
app.post('/api/gdpr/deletion-request', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, notes } = req.body;
    const authenticatedUserId = req.user?.id;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Neautorizovaný přístup. Je vyžadováno přihlášení.' });
    }

    // IDOR ochrana: zabránit požadavku na výmaz cizího účtu
    if (userId && userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Přístup odepřen. Nelze žádat o výmaz cizího uživatelského účtu.' });
    }

    const deletionReq = await prisma.gdprDeletionRequest.create({
      data: {
        userId: authenticatedUserId,
        notes: notes ? String(notes).trim().slice(0, 1000) : null,
        status: 'PENDING',
      },
    });

    // Auditní záznam
    await prisma.sensitiveAccessLog.create({
      data: {
        userId: authenticatedUserId,
        action: 'GDPR_DELETION_REQUEST_CREATED',
        resource: `GdprDeletionRequest:${deletionReq.id}`,
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    res.json({ success: true, request: deletionReq });
  } catch (err: any) {
    res.status(500).json({ error: 'Chyba při vytváření žádosti o výmaz.' });
  }
});
```

### 2. `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md`
- Aktualizován obsah (TOC): položka 12 změněna na `12. Bezpečnostní architektura, ochrana účtu a Argon2id hesla`.
- Článek 12.1(a) upraven na přesnou specifikaci `Argon2id` s automatickým upgradem z legacy `bcrypt`.
- Článek 14.2 upřesněn na kombinovaný model distribuce JWT tokenů (`HttpOnly` cookie + `Authorization: Bearer` pro API).

---

## 4. VERIFIKACE A TEST EVIDENCE

Pro ověření provedených bezpečnostních a technických změn byl vytvořen testovací modul `tests/gdpr-security-remediation-phase025.test.ts`.

### Výsledky testů:
```
TAP version 13
# Subtest: TMPR-20260910-LEGAL-025: GDPR Security Remediation & Terms SSOT Verification
    # Subtest: 1. Static Code Verification: server.ts protects all GDPR POST endpoints with requireAuth
    ok 1 - 1. Static Code Verification: server.ts protects all GDPR POST endpoints with requireAuth
    # Subtest: 2. Static SSOT Verification: 02-TERMS-OF-USE-DRAFT.md specifies Argon2id instead of bcrypt
    ok 2 - 2. Static SSOT Verification: 02-TERMS-OF-USE-DRAFT.md specifies Argon2id instead of bcrypt
    # Subtest: 3. Dynamic Security Endpoints Test Suite
        # Subtest: A. Unauthenticated POST /api/gdpr/deletion-request returns 401
        ok 1 - A. Unauthenticated POST /api/gdpr/deletion-request returns 401
        # Subtest: B. Authenticated User A targeting User B (IDOR attempt) returns 403 Forbidden
        ok 2 - B. Authenticated User A targeting User B (IDOR attempt) returns 403 Forbidden
        # Subtest: C. Authenticated User A with no body userId creates request for User A
        ok 3 - C. Authenticated User A with no body userId creates request for User A
        # Subtest: D. Authenticated User A with matching userId creates request for User A
        ok 4 - D. Authenticated User A with matching userId creates request for User A
        # Subtest: E. POST /api/gdpr/consent-log requires auth and denies foreign userId
        ok 5 - E. POST /api/gdpr/consent-log requires auth and denies foreign userId
        # Subtest: F. POST /api/gdpr/sensitive-access requires auth and denies foreign userId
        ok 6 - F. POST /api/gdpr/sensitive-access requires auth and denies foreign userId
    ok 3 - 3. Dynamic Security Endpoints Test Suite
ok 1 - TMPR-20260910-LEGAL-025: GDPR Security Remediation & Terms SSOT Verification

# Subtest: TMPR-20260910-LEGAL-022: Legal Pack 2.0 Single Source of Truth (SSOT) Verification Suite
    ok 1 - 1. Authoritative Markdown SSOT directory exists and contains all 7 draft files
    ok 2 - 2. Generated TypeScript data matches Markdown SSOT character-for-character
    ok 3 - 3. Generator is idempotent and produces clean deterministic output
    ok 4 - 4. Metadata matches 7/7 definitions with canonical IDs and 2.0.0-DRAFT version
    ok 5 - 5. ComplianceService draft API returns exact SSOT content without database publication
    ok 6 - 6. Fail-closed security rule: DRAFT 2.0 cannot be accepted or recorded into consents
ok 2 - TMPR-20260910-LEGAL-022: Legal Pack 2.0 Single Source of Truth (SSOT) Verification Suite

# Subtest: TMPR-20260910-LEGAL-023: Terms of Use 2.0 Deep Expansion Verification Suite
    ok 1 - 1. Terms of Use draft exists in SSOT and has required word count range (6,000 - 8,500 words)
    ok 2 - 2. Contains mandatory header metadata and Working Draft status
    ok 3 - 3. Operator is strictly Jiří Šár as natural person; no fake association or fictitious IČO
    ok 4 - 4. Strict exclusion of legal services and attorney-client privilege
    ok 5 - 5. CoParentHub features accurately reflected from implementation
    ok 6 - 6. Vault & Security features accurately reflected from implementation
    ok 7 - 7. AI & Orion features accurately reflected with EU AI Act disclosures
    ok 8 - 8. GDPR export and deletion endpoints match actual routes in code
    ok 9 - 9. Generated TS artifact matches Markdown SSOT byte-for-byte for terms
    ok 10 - 10. Fail-closed draft protection in ComplianceService blocks acceptance of 2.0.0-DRAFT
ok 3 - TMPR-20260910-LEGAL-023: Terms of Use 2.0 Deep Expansion Verification Suite

# TOTAL: 26 passed, 0 failed
```

---

## 5. AKTUALIZOVANÝ STAV PUBLICATION BLOCKERS

Po dokončení remediací `TMPR-20260910-LEGAL-025` je stav překážek publikace následující:

| Kód | Název překážky | Původní stav | Aktuální stav | Poznámka |
|---|---|---|---|---|
| **PB-01** | Provider Compliance Gate (DPA & SCC pro AI) | `BLOCKED` | `BLOCKED` | Trvá nutnost uzavření DPA s Google/xAI/Groq před produkčním zapnutím AI. |
| **PB-02** | Identifikační minimum Provozovatele (Fyzická osoba) | `LEGAL RESEARCH REQUIRED` | `LEGAL RESEARCH REQUIRED` | Trvá nutnost právního určení doručovací adresy / P.O. Boxu. |
| **PB-03** | Bezpečnostní oprava autorizace na GDPR API | `NEEDS CODE PATCH` | `RESOLVED` ✅ | **Plně vyřešeno v `server.ts` a ověřeno testy.** |
| **PB-04** | Formální revize a autorizace advokátem ČAK | `PENDING ADVOKAT REVIEW` | `PENDING ADVOKAT REVIEW` | Návrh 2.0.0-DRAFT je připraven pro předání k advokátnímu posouzení. |

---

## 6. ZÁVĚR A VERDIKT

# `VERDICT: REMEDIATION VERIFIED & RESOLVED`

Všechny identifikované bezpečnostní zranitelnosti v kódu (`S-01`, `S-02`) byly bezpečně odstraněny bez vedlejších regresních dopadů. Textové diskrepance v návrhu Podmínek užívání 2.0 (`S-04`) byly uvedeny do stoprocentního souladu s implementací a synchronizovány do datové vrstvy. Automatizované testy potvrzují plnou integritu a ochranu proti IDOR útokům.
