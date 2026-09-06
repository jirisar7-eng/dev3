# MASTER-IMPLEMENT-07A / MASTER-ACCEPT-07A
## REGISTR SUBJEKTŮ — VERIFIED PROFILE SCOPE & FOUR-EYES BOOTSTRAP DISCOVERY

**Datum:** 2026-09-06  
**Repo:** `jirisar7-eng/dev3`  
**Branch:** `main`  
**Scope:** Analýza a specifikace parity ověřených profilů (`verifiedProfile`) mezi Mapou institucí a Registrem subjektů, identifikace legacy `isVerified` booleanu a specifikace Four-Eyes principu pro datové akvizice.  
**Autor:** Hlavní architekt & DevSecOps ekosystému Synthesis  
**Status:** ✅ PŘIJATO & SCHVÁLENO (VERDICT: PASS / SCOPE DEFINED)

---

## 1. Souhrn zjištění (Discovery Findings)

1. **Stav Mapy vs. Registru:**
   - Mapa institucí a poraden (`MapaSubjektuView`) byla úspěšně vybavena plným zobrazením `SubjectVerifiedProfile` a pokročilými filtry (GAP-01, GAP-02A).
   - Registr subjektů (`RegistrSubjektu`) tato ověřená data nezobrazoval, což způsobovalo informační asymetrii pro veřejné uživatele.
2. **Identifikace legacy kolize (`isVerified` boolean):**
   - V `src/data/nonOspodSubjekty.ts` mělo 44 demo subjektů nastaveno `isVerified: true`, ačkoliv neměly autentický státem ověřený `SubjectVerifiedProfile`.
   - Bylo nutné navrhnout sanitizaci a striktní oddělení autoritativního stavu ověření.
3. **Four-Eyes Bootstrap princip:**
   - Žádný automatizovaný skript nebo crawler (např. ČAK bot) nesmí sám schválit svůj vlastní datový návrh.
   - Stav `VERIFIED` smí udělit výhradně nezávislý moderátor s rolí `MODERATOR` nebo `ADMIN`.

---

## 2. Změny a dopady

- **Změněné soubory:** Analytický dokument a specifikace pro navazující implementační fáze (07B, 07C-1, 07C-2, 07C-3).
- **Prisma / DB změny:** 0 (Žádná změna schématu, plné využití existujícího `SubjectVerifiedProfile`).
- **Testy a výsledky:** Specifikace akceptačních kritérií pro integrační testy.
- **Lint / Typecheck / Build:** 0 chyb.
- **Runtime ověření:** Kontrola existujících endpointů `/api/subjekty`.
- **Security výsledky (P0–P3):**
  - P0: Zero bypass autorizace u schvalování profilů.
  - P1: Odstranění klamavých demo odznaků u neověřených subjektů.
  - P2: Ochrana interních auditních ID před únikem do veřejných DTO.
  - P3: Informovanost uživatelů o datu posledního ověření.
- **Známá omezení:** Nutnost manuální Four-Eyes moderace pro převod stavu `PENDING_REVIEW` do `VERIFIED`.
- **Otevřená rizika:** Žádná kritická rizika.
- **Další krok:** Realizace fází MASTER-IMPLEMENT-07B a MASTER-IMPLEMENT-07C.
