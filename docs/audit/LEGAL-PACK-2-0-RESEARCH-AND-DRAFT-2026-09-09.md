# TECHNICKÝ AUDIT: VÝZKUM A VYHOTOVENÍ PRÁVNÍHO BALÍČKU LEGAL PACK 2.0
**Audit ID:** `TMPR-20260909-LEGAL-018`  
**Datum:** 2026-09-09  
**Prostředí:** `DEV3`  
**Režim:** `RESEARCH_AND_DRAFT_ONLY`  
**Autor:** Hlavní architekt & DevSecOps / QA Auditor ekosystému Synthesis  
**Nadřazený příkaz:** `TMPR-20260909-LEGAL-017`  

---

## 1. CÍL A ÚČEL
Příprava uceleného pracovního návrhu nové generace právní a compliance dokumentace projektu **Táta má právo** v rámci technologické platformy **Synthesis OS** (Legal Pack 2.0).  
Režim příkazu byl striktně výzkumný a dokumentační: žádný zásah do databázového schématu, žádné Prisma migrace, žádné změny backendových služeb (`server.ts`), žádné úpravy React komponent a **nulový zásah do stávajících platných publikovaných dokumentů (`PUBLISHED` v1.0.0 a v1.1.0)**.

---

## 2. METODIKA A REALIZACE

### Fáze 1: Read-Only inventura technických a právních faktů
Byla provedena hloubková inspekce celého ekosystému DEV3 napříč 50 tématickými oblastmi:
- **Autentizace a identita:** `User` model, bcrypt hashování, Passkeys (FIDO2 via WebAuthn), TOTP (RFC 6238), federované OAuth (Google, Microsoft), session tokens (`token` cookie).
- **Rodinná a citlivá data:** `CoParentSpace`, `Child`, `CarePlan`, deníky incidentů, spisové značky soudů a OSPOD v `clientCaseService.ts`.
- **Úložiště a bezpečnost:** Self-hosted MinIO (`minioStorageService.ts`), antivirový streaming skener ClamAV (`clamAvService.ts`).
- **Umělá inteligence:** Multi-provider fallback architektura `AiService.ts` (Google Gemini, Grok via xAI, Groq), deterministický i asistovaný `judgmentParserService.ts`, agent Orion (`orionService.ts`).
- **Ochrana soukromí:** Fail-closed regex blokování čl. 9 GDPR a heuristická pseudonymizace v `privacyFilterService.ts`.
- **Cookies a úložiště:** Přísně technické nezbytné cookies v `server.ts` a `cookieUtils.ts`; vyloučení komerčních reklamních pixelů.
- **Externí registry:** Omezení e-Sbírky (1 req/s, 5 req/den) v `EsbirkaService.ts`, ARES API verifikace v `ares.ts`.
- **Práva subjektů:** Export dat v JSON (`GET /api/gdpr/export-data`) a kaskádový výmaz (`POST /api/gdpr/deletion-request`).

### Fáze 2: Vypracování strukturovaného balíčku Legal Pack 2.0
V nově založené složce `/docs/legal-drafts/legal-pack-2.0/` bylo vyhotoveno 12 ucelených Markdown dokumentů:
1. `README.md` – Manifest balíčku, metodická pravidla, zákaz publikace a instrukce pro advokátní kancelář.
2. `00-LEGAL-FACTS-INVENTORY.md` – Vyčerpávající technická a procesní inventura 50 zjištěných faktů s verifikačními tagy.
3. `01-LEGAL-PACK-ARCHITECTURE.md` – Architektura balíčku, kanonická terminologie, sémantické verzování, lifecycle (`DRAFT`/`PUBLISHED`/`ARCHIVED`) a pravidla sazby.
4. `02-TERMS-OF-USE-DRAFT.md` – Podmínky užívání portálu (vymezení neadvokátní povahy, CoParentHub, uživatelský obsah, duševní vlastnictví, limity odpovědnosti dle § 2898 NOZ).
5. `03-PRIVACY-NOTICE-DRAFT.md` – Informační plnění dle čl. 13 a 14 GDPR (čl. 9 zvláštní kategorie, účely, příjemci, mezinárodní předávání, práva subjektů údajů, zákaz profilování).
6. `04-COOKIE-POLICY-DRAFT.md` – Pravidla používání cookies a web storage dle § 89 odst. 3 ZEK (vyčerpávající tabulky technických cookies a localStorage).
7. `05-LEGAL-DISCLAIMER-DRAFT.md` – Právní výhrada a vyloučení právních služeb (limity vzorů, kalkulátorů, AI halucinace, krizové kontakty pomoci).
8. `06-VOLUNTEER-CODE-DRAFT.md` – Etický kodex dobrovolníka ve 14 kapitolách (priorita zájmu dítěte, přísný zákaz vinklaření, mlčenlivost, whistleblowing).
9. `07-AI-TRANSPARENCY-DRAFT.md` – Deklarace AI dle čl. 50 EU AI Act (identifikace Oriona, poskytovatelé, limity Privacy Filteru, zákaz automatizovaného rozhodování dle čl. 22 GDPR).
10. `08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md` – Rámcová smlouva o dobrovolné spolupráci (inominátní smlouva dle § 1746 odst. 2 NOZ, bezúplatnost, autorská práva, mlčenlivost dle čl. 29 GDPR).
11. `09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md` – Křížová matice konzistence eliminující dřívější terminologické a právní rozpory.
12. `10-PRE-PUBLICATION-LEGAL-REVIEW.md` – Předpublikační auditní checklist priorit P0 až P3 s formálním sign-off protokolem pro advokáta a statutárního zástupce.

---

## 3. IDENTIFIKOVANÁ A OŠETŘENÁ RIZIKA (ODSTRANĚNÍ STARÝCH ROZPORŮ)
1. **Odstranění neplatných absolutních disclaimerů:** Staré formulace „nenese žádnou odpovědnost za jakékoli škody“ byly nahrazeny zákonnou limitací dle § 2898 NOZ s respektováním mandatory rights spotřebitele.
2. **Korekce povahy Privacy Notice:** Zásady ochrany osobních údajů již nejsou prezentovány jako „smluvní souhlas“, nýbrž jako jednostranné informační plnění dle GDPR.
3. **Pravdivost terminologie přijetí:** Zcela vymýcen termín „podpis“ pro běžnou akceptaci; zaveden termín „potvrzení přijetí dokumentu“.
4. **Transparentnost AI:** Plná transparentnost vůči čl. 50 EU AI Act; Orion není vydáván za člověka a jsou přiznány limity jazykových modelů (halucinace).
5. **Realistická definice ochrany soukromí:** Opuštěna nepodložená tvrzení o „0-PII“ a kryptografické anonymizaci; přesně popsána heuristická pseudonymizace a fail-closed regex ochrana.

---

## 4. ZÁVĚREČNÉ SHRNUTÍ A STATUS
- V repozitáři vznikla kompletní, vnitřně nerozporná složka `/docs/legal-drafts/legal-pack-2.0/`.
- Žádný existující kód, databázový model ani publikovaný dokument nebyl změněn.
- Stav dokumentů je striktně `WORKING DRAFT — NOT FOR PUBLICATION` do provedení právního auditu externím advokátem dle checklistu `10-PRE-PUBLICATION-LEGAL-REVIEW.md`.

**Výsledný status:** ✅ OVĚŘENO (RESEARCH & DRAFTING COMPLETE)
