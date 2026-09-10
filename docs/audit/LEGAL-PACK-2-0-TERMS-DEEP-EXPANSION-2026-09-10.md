# AUDIT: Legal Pack 2.0 Terms of Use Deep Expansion
**Datum:** 2026-09-10
**Příkaz:** TMPR-20260910-LEGAL-023
**Název příkazu:** DEEP_EXPAND_TERMS_OF_USE_2_0
**Prostředí:** DEV3
**Status:** COMPLETE (VERIFIED)
**Autor:** Antigravity / DeepMind AI Coding Agent (Synthesis Architecture & Security)

---

## 1. CÍL

Provést hloubkové, profesionální a detailní rozšíření dokumentu:
`docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` (Kanonické ID: `DOC-TMPR-TERMS-V2`, klíč: `terms`).

Cílem bylo vytvořit plnohodnotné, strukturované Podmínky užívání o rozsahu 6 000–8 000 slov, které pravdivě a přesně reflektují skutečnou implementaci a technický stav platformy Táta má právo (Synthesis OS), aniž by předstíraly neexistující právní skutečnosti či nesprávné garance.

Dokument zůstává ve stavu:
`STATUS: WORKING DRAFT — NOT FOR PUBLICATION` (v2.0.0-DRAFT).

---

## 2. PŘEHLED STRUKTURY A ROZSAH DOKUMENTU

- **Počet slov:** 7 465 slov (cílový interval 6 000 – 8 000 slov splněn)
- **Počet hlavních částí:** 18 číslovaných částí (ČÁST I až ČÁST XVIII)
- **Počet článků:** 60 konkrétních normativních článků
- **Jazyk:** Čeština (profesionální právní a technická terminologie)

### Struktura částí (Table of Contents):
1. **ČÁST I: ÚVODNÍ USTANOVENÍ, POSTAVENÍ PROVOZOVATELE A PŮSOBNOST** (Čl. 1–4)
2. **ČÁST II: VYMEZENÍ ZÁKLADNÍCH POJMŮ A STRUKTURA PLATFORMY** (Čl. 5)
3. **ČÁST III: CHARAKTER SLUŽBY, VÝHRADA PRÁVNÍCH SLUŽEB A INFORMAČNÍ REŽIM** (Čl. 6–8)
4. **ČÁST IV: UŽIVATELSKÝ ÚČET, REGISTRACE A OVĚŘOVÁNÍ IDENTITY** (Čl. 9–11)
5. **ČÁST V: BEZPEČNOST, PŘIHLAŠOVÁNÍ, HESLA, MFA, PASSKEYS A OAUTH** (Čl. 12–15)
6. **ČÁST VI: RODINNÁ DATA, EVIDENCE DÍTĚTE A NEJLEPŠÍ ZÁJEM DÍTĚTE** (Čl. 16–18)
7. **ČÁST VII: SPOLURODIČOVSKÝ PROSTOR (COPARENTHUB) A EVIDENCE PÉČE** (Čl. 19–25)
8. **ČÁST VIII: SPRÁVA PŘÍPADŮ, DŮKAZNÍ KATALOG, SOUDNÍ AGENDA A LHŮTY** (Čl. 26–29)
9. **ČÁST IX: DOKUMENTOVÝ TREZOR, UPLOAD SOUBORŮ A ANTIVIROVÁ KONTROLA** (Čl. 30–32)
10. **ČÁST X: UŽIVATELSKÝ OBSAH, ZAKÁZANÉ MATERIÁLY A OCHRANA PRÁV TŘETÍCH OSOB** (Čl. 33–35)
11. **ČÁST XI: NÁSTROJE ASISTIVNÍ UMĚLÉ INTELIGENCE (ORION, BIFF, PARSER, GENERÁTORY, SIMULÁTORY)** (Čl. 36–42)
12. **ČÁST XII: VEŘEJNÉ NÁSTROJE, KALKULÁTORY, E-SBÍRKA, REGISTR SUBJEKTŮ A MAPY** (Čl. 43–46)
13. **ČÁST XIII: DUŠEVNÍ VLASTNICTVÍ, AUTORSKÁ PRÁVA A LICENCE** (Čl. 47–48)
14. **ČÁST XIV: DOSTUPNOST SLUŽBY, ÚDRŽBA, ZÁLOHOVÁNÍ A EXPORT DAT** (Čl. 49–50)
15. **ČÁST XV: MODERACE, PORUŠENÍ PODMÍNEK, POZASTAVENÍ A UKONČENÍ ÚČTU** (Čl. 51–53)
16. **ČÁST XVI: ZÁKONNÉ LIMITY ODPOVĚDNOSTI ZA ŠKODU DLE § 2898 OBČANSKÉHO ZÁKONÍKU** (Čl. 54–55)
17. **ČÁST XVII: ZMĚNY PODMÍNEK, VERZOVÁNÍ A AUDITNÍ AKCEPTACE** (Čl. 56–57)
18. **ČÁST XVIII: SPOTŘEBITELSKÁ PRÁVA, ROZHODNÉ PRÁVO, ŘEŠENÍ SPORŮ A ZÁVĚR** (Čl. 58–60)

---

## 3. OVĚŘENÍ FAKTŮ PROTI INVENTUŘE A KÓDU (FACT FIDELITY)

| Oblast v Terms of Use | Technický fakt / Implementace | Odraz v textu Článků | Status shody |
|---|---|---|:---:|
| **Identita Provozovatele** | Fyzická osoba Jiří Šár; spolek neexistuje (`[PRODUCT INTENT — FUTURE]`) | Článek 1 (1.2) s výstražným blokem | ✅ OVĚŘENO |
| **Vyloučení právních služeb** | Zákon č. 85/1996 Sb., o advokacii; žádné advokátní tajemství | Články 6, 7 a 8 | ✅ OVĚŘENO |
| **Autentizace & Bezpečnost** | Bcrypt hesla, TOTP (RFC 6238), Passkeys (WebAuthn), Google/MS OAuth2, RBAC | Články 12, 13, 14, 15 | ✅ OVĚŘENO |
| **CoParentHub** | `CoParentSpace`, `CoParentMember`, `conflictMode` (`COOPERATION`, `PARALLEL`, `HIGH_CONFLICT`), `CoParentAuditLog` | Články 19, 20, 21, 22, 23, 24, 25 | ✅ OVĚŘENO |
| **Case Management & Lhůty** | `clientCaseService.ts`, `CaseEvidence`, vyloučení záruky za zmeškání procesních lhůt | Články 26, 27, 28, 29 | ✅ OVĚŘENO |
| **Trezor & Antivir** | MinIO S3 (max 50 MB, formáty PDF/DOCX/PNG/MP3/MP4), ClamAV fail-closed TCP scan | Články 30, 31, 32 | ✅ OVĚŘENO |
| **Zakázaný obsah** | Nulová tolerance CSAM, malware, násilí, revenge porn, neoprávněné odposlechy | Články 33, 34, 35 | ✅ OVĚŘENO |
| **AI Nástroje & Orion** | `agent-orion-qa-v1`, BIFF, Judgment Parser OCR, simulátory, halucinace modelů | Články 36, 37, 38, 39, 40, 42 | ✅ OVĚŘENO |
| **Privacy Filter & AI Poskytovatelé** | `SPECIAL_CATEGORY_REGEX` fail-closed blokování (čl. 9 GDPR), token pseudonymizace, `PROVIDER COMPLIANCE GATE = BLOCKED` | Článek 41 | ✅ OVĚŘENO |
| **Kalkulačky & Veřejné zdroje** | Orientační doporučující tabulky MSp, e-Sbírka limity (1 req/s, max 5/den), ARES, Leaflet / OSM | Články 43, 44, 45, 46 | ✅ OVĚŘENO |
| **Zálohy & GDPR akce** | `GET /api/gdpr/export-data` (JSON export), `POST /api/gdpr/deletion-request` (kaskádový výmaz) | Články 50 a 53 | ✅ OVĚŘENO |
| **Odpovědnost za škodu** | Zákonné limity dle § 2898 NOZ, ochrana spotřebitele, zákaz blanket disclaimeru | Články 54 a 55 | ✅ OVĚŘENO |
| **Auditní akceptace** | `ComplianceModal`, auditní záznam `PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO` | Článek 57 | ✅ OVĚŘENO |

---

## 4. SSOT INTEGRACE A TESTOVACÍ EVIDENCE

1. **SSOT Generátor:** Po úpravě souboru `docs/legal-drafts/legal-pack-2.0/02-TERMS-OF-USE-DRAFT.md` byl úspěšně spuštěn `npm run generate:legal-drafts`.
2. **Generovaný artefakt:** `src/data/legalDrafts20.ts` byl aktualizován s přesnou shodou znaku po znaku.
3. **Testovací sady:**
   - `tests/legal-pack-2-0-terms-expansion.test.ts` (10/10 testů prošlo úspěšně)
   - `tests/legal-pack-2-0-ssot.test.ts` (6/6 testů prošlo úspěšně)
   - `tests/legal-pack-2-0-draft-preview.test.ts` (12/12 testů prošlo úspěšně)

---

## 5. ZÁVĚR

Hloubkové rozšíření Podmínek užívání v2.0.0-DRAFT bylo úspěšně dokončeno, je 100% v souladu s architekturou, technickou inventurou `00-LEGAL-FACTS-INVENTORY.md` a křížovou maticí konzistence `09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md`. Dokument je připraven k odbornému právnímu přezkumu.
