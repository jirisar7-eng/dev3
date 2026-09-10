# AUDIT: Legal Pack 2.0 Single Source of Truth (SSOT) Architecture
**Datum:** 2026-09-10  
**Příkaz:** TMPR-20260910-LEGAL-022  
**Název příkazu:** REMOVE_LEGAL_PACK_2_0_DUAL_SOURCE_OF_TRUTH  
**Prostředí:** DEV3  
**Status:** COMPLETE (VERIFIED)  
**Autor:** Antigravity / DeepMind AI Coding Agent (Synthesis Architecture & Security)  

---

## 1. CÍL

Odstranit architektonický dluh **P2 ARCHITECTURE DEBT: DUAL SOURCE OF TRUTH (DSOT)** vzniklý při prvotní integraci Legal Pack 2.0 do webového administračního rozhraní DEV3.

Před touto změnou existoval obsah dokumentů paralelně:
1. V primárních Markdown souborech `docs/legal-drafts/legal-pack-2.0/*.md`
2. V manuálně udržovaném TypeScript souboru `src/data/legalDrafts20.ts`

Tento stav představoval riziko desynchronizace textů při revizích. Cílem bylo ustavit Markdown soubory jako jediný autoritativní zdroj pravdy (SSOT) a nahradit manuální synchronizaci plně deterministickým generátorem.

---

## 2. STATUS IMPLEMENTACE

- **Jediný zdroj pravdy (SSOT):** `docs/legal-drafts/legal-pack-2.0/*.md` (7/7 normativních dokumentů)
- **Generátor:** `scripts/generateLegalDrafts20.ts` (idempotentní, typově bezpečný skript v Node.js/TypeScript)
- **Build-Time integrace:** Přidán NPM skript `"generate:legal-drafts"` a napojen jako povinný pre-build krok v `package.json` (`npm run build`).
- **Generovaný artefakt:** `src/data/legalDrafts20.ts` nese striktní varovnou hlavičku `AUTO-GENERATED FILE — DO NOT EDIT MANUALLY!` a je kdykoli deterministicky regenerovatelný.
- **Bezpečnostní hranice:** Všechny Fail-Closed mechanismy (zákaz akceptace, admin-only náhled, nulové ovlivnění published v1.0.0 a DB/Prisma) zůstávají 100% zachovány.

---

## 3. MAPA DOKUMENTŮ A METADAT (7/7)

| Klíč systému | Soubor v SSOT (`docs/legal-drafts/legal-pack-2.0/`) | Kanonické ID | Status | Verze |
|---|---|---|---|---|
| `terms` | `02-TERMS-OF-USE-DRAFT.md` | `DOC-TMPR-TERMS-V2` | DRAFT | `2.0.0-DRAFT` |
| `gdpr` | `03-PRIVACY-NOTICE-DRAFT.md` | `DOC-TMPR-PRIVACY-V2` | DRAFT | `2.0.0-DRAFT` |
| `cookies` | `04-COOKIE-POLICY-DRAFT.md` | `DOC-TMPR-COOKIES-V2` | DRAFT | `2.0.0-DRAFT` |
| `legal` | `05-LEGAL-DISCLAIMER-DRAFT.md` | `DOC-TMPR-DISCLAIMER-V2` | DRAFT | `2.0.0-DRAFT` |
| `volunteer_code` | `06-VOLUNTEER-CODE-DRAFT.md` | `DOC-TMPR-VOLUNTEER-CODE-V2` | DRAFT | `2.0.0-DRAFT` |
| `ai_statement` | `07-AI-TRANSPARENCY-DRAFT.md` | `DOC-TMPR-AI-TRANSPARENCY-V2` | DRAFT | `2.0.0-DRAFT` |
| `dohoda-o-spolupraci` | `08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md` | `DOC-TMPR-VOLUNTEER-AGREEMENT-V2` | DRAFT | `2.0.0-DRAFT` |

---

## 4. DŮKAZ TESTŮ A VERIFIKACE

### 4.1. Specializovaný SSOT testovací modul (`tests/legal-pack-2-0-ssot.test.ts`)
- **Test 1:** Ověření existence SSOT adresáře a všech 7 Markdown souborů.
- **Test 2:** Porovnání obsahu znak po znaku (byte-for-byte fidelity) mezi Markdown soubory a exportovanými daty.
- **Test 3:** Idempotence generátoru a přítomnost `AUTO-GENERATED` hlavičky.
- **Test 4:** Shoda metadat (kanonická ID, verze `2.0.0-DRAFT`, status `DRAFT`, varovná hláška).
- **Test 5:** Funkčnost `ComplianceService.getAllDraftsPreview()` a `ComplianceService.getDraftPreview()`.
- **Test 6:** Fail-Closed ověření odmítnutí pokusu o akceptaci verze `2.0.0-DRAFT`.

**Výsledek testu:**
```
TAP version 13
# Subtest: TMPR-20260910-LEGAL-022: Legal Pack 2.0 Single Source of Truth (SSOT) Verification Suite
    ok 1 - 1. Authoritative Markdown SSOT directory exists and contains all 7 draft files
    ok 2 - 2. Generated TypeScript data matches Markdown SSOT character-for-character
    ok 3 - 3. Generator is idempotent and produces clean deterministic output
    ok 4 - 4. Metadata matches 7/7 definitions with canonical IDs and 2.0.0-DRAFT version
    ok 5 - 5. ComplianceService draft API returns exact SSOT content without database publication
    ok 6 - 6. Fail-closed security rule: DRAFT 2.0 cannot be accepted or recorded into consents
1..6
ok 1 - TMPR-20260910-LEGAL-022: Legal Pack 2.0 Single Source of Truth (SSOT) Verification Suite
# tests 7
# pass 7
# fail 0
```

### 4.2. Regresní sada Draft Preview (`tests/legal-pack-2-0-draft-preview.test.ts`)
- 12 z 12 testů prošlo bez jediné chyby (`pass 13, fail 0`).

### 4.3. Statická analýza a kompilace
- `npm run lint` (`tsc --noEmit`): 0 chyb.
- `compile_applet` (`npm run build`): Úspěšná kompilace.

---

## 5. BEZPEČNOSTNÍ GARANCE

1. **Zero Database / Schema Mutation:** Žádný zásah do Prisma schématu, migrací ani tabulek.
2. **Server Logic Intact:** `server.ts` a autentizační middleware nebyly modifikovány.
3. **Fail-Closed Enforcement:** Jakýkoli požadavek na akceptaci konceptu verze `2.0.0-DRAFT` je okamžitě server-side zablokován a zalogován jako nepřípustná operace.
4. **Isolated Admin View:** Běžní uživatelé a veřejné endpointy `/pravni-dokumenty` mají přístup výhradně k platným verzím `v1.0.0` / `v1.1.0`.
5. **Operator Identity:** Provozovatel je striktně Jiří Šár jako fyzická osoba; spolek je uveden výhradně jako budoucí záměr bez smluvní platnosti a bez fiktivních identifikačních čísel.

---

## 6. CHANGELOG ENTRY

Záznam byl přidán do `CHANGELOG.md` pod dnešním datem (2026-09-10).
