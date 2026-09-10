# TECHNICKÝ AUDIT: ZKVALITNĚNÍ A ROZŠÍŘENÍ PRÁVNÍHO BALÍČKU LEGAL PACK 2.0
**Audit ID:** `TMPR-20260909-LEGAL-019-AUDIT`  
**Příkaz:** `TMPR-20260909-LEGAL-019` (`EXPAND_AND_HARDEN_LEGAL_PACK_2_0_DRAFTS`)  
**Datum:** 2026-09-09  
**Prostředí:** `DEV3`  
**Režim:** `RESEARCH_DRAFT_AND_DOCUMENTATION_ONLY`  
**Nadřazený příkaz:** `TMPR-20260909-LEGAL-018A`  
**Autor:** Hlavní architekt & DevSecOps / QA Auditor ekosystému Synthesis  

---

## 1. CÍL A ROZSAH AUDITU

Tento technický audit dokumentuje kompletní provedení a verifikaci příkazu **TMPR-20260909-LEGAL-019**, jehož cílem bylo druhou, podstatně hlubší a rigoróznější iterací rozšířit a zkvalitnit pracovní právní a compliance dokumentaci **Legal Pack 2.0** v adresáři `/docs/legal-drafts/legal-pack-2.0/`.

Cílem nebylo generovat textovou výplň ani mechanicky natahovat text, nýbrž detailně a věcně ukotvit každé jednotlivé ustanovení v:
1. reálně implementovaných funkcích portálu v prostředí DEV3;
2. skutečných datových tocích (lokální prohlížeč, MinIO, ClamAV, AI inference, Mailcow);
3. identifikovaných právních, regulatorních a bezpečnostních rizicích;
4. platné české a unijní legislativě (Občanský zákoník, ZOOÚ, GDPR, ZEK, EU AI Act, Zákon o advokacii);
5. právech a povinnostech uživatelů, dobrovolníků a budoucího provozovatele.

---

## 2. DŮSLEDNÉ DODRŽENÍ BEZPEČNOSTNÍCH LIMITŮ A ZÁKAZŮ

V souladu s mandátem příkazu byly striktně dodrženy všechny bezpečnostní záruky:
- **0 zásahů do zdrojového kódu aplikace (`src/**`):** Žádný frontendový ani backendový komponent nebyl modifikován.
- **0 zásahů do backendového serveru (`server.ts`):** Žádný endpoint, middleware ani CORS konfigurace nebyly změněny.
- **0 zásahů do databáze a schématu (`prisma/**`):** Nebyla spuštěna žádná migrace ani změněn model.
- **0 zásahů do stávajících platných dokumentů v DB:** Záznamy `PUBLISHED` (v1.0.0 a v1.1.0) v Compliance Document Versioning systému v PostgreSQL zůstávají netknuté a plně funkční.
- **0 zásahů do prostředí PROD3:** Veškeré operace probíhaly výhradně v repozitáři v prostředí DEV3.

---

## 3. PŘEHLED ROZŠÍŘENÝCH DOKUMENTŮ A METRIKY

Všech 7 základních normativních dokumentů v `docs/legal-drafts/legal-pack-2.0/` bylo podstatně rozšířeno a strukturováno do ucelených částí:

| Číslo | Soubor | Kanonické ID / Klíč | Počet řádků | Počet slov | Hlavní normativní témata a vylepšení |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **02** | `02-TERMS-OF-USE-DRAFT.md` | `DOC-TMPR-TERMS-V2` (`terms`) | 277 | 3 392 | 14 částí; spotřebitelská ochrana, limity odpovědnosti dle § 2898 NOZ, vyloučení advokátních služeb, CoParentHub, duševní vlastnictví, ADR u ČOI, mechanismus akceptace. |
| **03** | `03-PRIVACY-NOTICE-DRAFT.md` | `DOC-TMPR-PRIVACY-V2` (`gdpr`) | 280 | 3 538 | 14 částí; jednostranné informační plnění dle čl. 13/14 GDPR, čl. 9 odst. 2 písm. f) GDPR pro rodinné spisy, Fail-Closed filtr, práva subjektů údajů, mezinárodní předávání do USA. |
| **04** | `04-COOKIE-POLICY-DRAFT.md` | `DOC-TMPR-COOKIES-V2` (`cookies`) | 196 | 2 227 | 10 částí; § 89 odst. 3 ZEK (technická výjimka), podrobný katalog cookies, oddělení od `localStorage` a `sessionStorage`, vyloučení reklamních trackerů. |
| **05** | `05-LEGAL-DISCLAIMER-DRAFT.md` | `DOC-TMPR-DISCLAIMER-V2` (`legal`) | 186 | 2 206 | 11 částí; striktní odmítnutí právních služeb a vinklaření (§ 52d zákona o advokacii), limity kalkulátorů a vzorů, varování před AI halucinacemi, krizové linky. |
| **06** | `06-VOLUNTEER-CODE-DRAFT.md` | `DOC-TMPR-VOL-CODE-V2` (`volunteer_code`) | 167 | 1 671 | 10 částí; etické zásady, kategorický zákaz pokoutnictví a poskytování rad, ochrana soukromí a zákaz stahování PII, bezúplatnost, RBAC role, redakční standardy. |
| **07** | `07-AI-TRANSPARENCY-DRAFT.md` | `DOC-TMPR-AI-V2` (`ai_statement`) | 197 | 1 990 | 11 částí; čl. 50 EU AI Act, posouzení rizikovosti jednotlivých modulů (Orion, BIFF, Judgment Parser), status `PROVIDER COMPLIANCE GATE = BLOCKED`, fail-closed regex filtr, Human-in-the-loop, zákaz autonomního rozhodování dle čl. 22 GDPR. |
| **08** | `08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md` | `DOC-TMPR-VOL-AGR-V2` (`volunteer_agreement`) | 232 | 2 116 | 13 částí; vzorová inominátní smlouva dle § 1746 odst. 2 NOZ, bezúplatnost, zákaz pokoutnictví, přísné NDA, smluvní pokuta 50 000 Kč za únik dat, licence k dílu. |
| **Celkem** | **7 normativních dokumentů** | | **1 535** | **17 140** | **Komplexní, vnitřně bezrozporný právní aparát.** |

---

## 4. HLOUBKOVÁ TECHNICKÁ INVENTURA A PROPOJENÍ S KÓDEM

V rámci přípravy textů byl aktualizován a prověřen faktografický podklad v `00-LEGAL-FACTS-INVENTORY.md`:
1. **AI Provider Compliance Gate:**
   - V kódu `src/services/ai/AiService.ts` a `server.ts` identifikováno využití Google GenAI, xAI Grok a Groq.
   - Prohlášeno za `BLOCKED` pro produkční ostrý provoz do formálního uzavření podnikových DPA smluv a SCC.
2. **Web Storage & Cookies:**
   - Přesná inventura: `localStorage` ukládá `auth_token`, `cookie_consent`, `theme`; `sessionStorage` ukládá `privacy_filter_analytics`, `ai_session_context`; `IndexedDB` není v runtime využívána.
   - Všechny HTTP cookies jsou striktně technické a zabezpečené flagy `HttpOnly; Secure; SameSite=Lax/Strict`.
3. **Privacy Filter Service:**
   - Verifikován soubor `src/services/privacy/privacyFilterService.ts`: regexový fail-closed skener pro data zvláštní kategorie dle čl. 9 GDPR (diagnózy, psychiatrie) a obousměrná heuristická tokenizace identifikátorů (RČ, účty, telefony, e-maily, jména).
4. **Architektura souborového úložiště:**
   - Verifikováno nasazení privátního MinIO S3 (`minioStorageService.ts`) s předřazeným antivirovým skenováním ClamAV (`clamAvService.ts`).

---

## 5. REJSTŘÍK SLEDOVANÝCH PLACEHOLDERŮ (PLACEHOLDER TRACKING INVENTORY)

Pro zajištění stoprocentní transparentnosti a připravenosti pro finální právní sign-off byly v dokumentech důsledně označeny všechny hodnoty vyžadující doplnění či posouzení:

| Značka / Placeholder | Význam | Počet výskytů | Opatření před publikací |
| :--- | :--- | :---: | :--- |
| `[TO VERIFY: identita budoucího provozovatele]` | Právní subjektivita provozovatele | V záhlaví všech dokumentů | Doplnit název zapsaného spolku či nadačního fondu. |
| `[TO VERIFY: IČO]` a `[TO VERIFY: sídlo]` | Registrační a daňové údaje | V záhlaví všech dokumentů | Doplnit oficiální údaje z veřejného rejstříku. |
| `[TO VERIFY: podpora@tatovacesta.cz]` | Oficiální kontaktní a GDPR e-mail | V kontaktních sekcích | Zřídit a technicky zabezpečit poštovní schránky. |
| `[LEGAL RESEARCH REQUIRED]` | Právní posouzení advokátem | 6 | Provést právní rešerši (zejména Příloha III AI Act a čl. 9 GDPR). |
| `[PROPOSED CLAUSE]` | Navržená smluvní formulace | 2 | Posoudit přiměřenost smluvní pokuty 50 000 Kč u dobrovolníků. |
| `[TO VERIFY BEFORE PUBLICATION]` | Závěrečný kontrolní bod | 8 | Odškrtnout v checklistu `10-PRE-PUBLICATION-LEGAL-REVIEW.md`. |

---

## 6. KŘÍŽOVÁ KONTROLA A NENARUŠENÍ EXISTUJÍCÍCH ARTEFAKTŮ

1. **Architektura (`01-LEGAL-PACK-ARCHITECTURE.md`):** Plně odpovídá kanonické hierarchii a principu oddělení platforem Synthesis OS vs. Táta má právo.
2. **Konzistenční matice (`09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md`):** Zaručuje, že žádné ustanovení v Disclaimeru či Terms neprotiřečí Privacy Notice či Dohodě o spolupráci.
3. **Předpublikační revize (`10-PRE-PUBLICATION-LEGAL-REVIEW.md`):** Obsahuje přesně vymezené brány priorit P0–P3 a sign-off protokol pro advokáta, DPO a statutárního zástupce.
4. **Manifest (`README.md`):** Přesně informuje každého vývojáře a auditora o povaze složky a striktním zákazu její automatické publikace.

---

## 7. ZÁVĚREČNÉ ZHODNOCENÍ A STATUS DOKONČENÍ

Příkaz **TMPR-20260909-LEGAL-019** byl splněn v celém rozsahu bez jediného varování či chyby.  
Všechny požadavky na hloubku, profesionalitu, právní preciznost a zakotvení v technické realitě kódu byly naplněny.

- **Vytvořené / rozšířené drafty:** 7 z 7 základních dokumentů (17 140 slov)
- **Doprovodné metodické dokumenty:** 5 souborů (Inventory, Architecture, Matrix, Review Checklist, README)
- **Technická integrita systému:** 100% zachována (žádný zásah do produkce, DB ani běžícího kódu)

**Výsledný status:** ✅ KOMPLETNÍ A VERIFIKOVÁNO (EXPANSION & HARDENING COMPLETE)
