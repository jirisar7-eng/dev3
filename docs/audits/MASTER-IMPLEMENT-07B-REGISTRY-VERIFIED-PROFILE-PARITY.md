# MASTER-IMPLEMENT-07B
## REGISTR ↔ MAPA VERIFIED PROFILE PARITY

**Datum:** 2026-09-06  
**Repo:** `jirisar7-eng/dev3`  
**Branch:** `main`  
**Scope:** Sjednocení veřejného detailu Registru subjektů s existujícím zobrazením `verifiedProfile` v Mapě institucí a poraden.  
**Autor:** Hlavní architekt & DevSecOps ekosystému Synthesis  
**Status:** ✅ IMPLEMENTOVÁNO & OVĚŘENO (DOCUMENTATION CLOSURE)

---

## 1. Původní stav

Před realizací MASTER-IMPLEMENT-07B existoval následující asymetrický stav:
- **Mapa institucí a poraden (`MapaSubjektuView.tsx`)** již plně využívala a zobrazovala ověřené úřední informace (`SubjectVerifiedProfile` — GAP-01).
- **Registr subjektů (`RegistrSubjektu.tsx`)** data z `verifiedProfile` v katalogovém zobrazení ani v modálním detailu nevykresloval a zobrazoval pouze základní neověřené kontakty.
- **Backend a API vrstva (`subjektService.ts`, `subjektRoutes.ts`)** již poskytovaly jednotné a bezpečně sanitizované veřejné DTO (`toPublicSubjektDto`), obsahující `verifiedProfile` pro oprávněné stavy (`VERIFIED`, `STALE`).
- Nebyl potřeba žádný nový datový model, žádná Prisma migrace ani žádný nový API endpoint.

---

## 2. Implementace

Všechny úpravy proběhly výhradně v existující komponentě:
- `src/components/public/RegistrSubjektu.tsx`

### Klíčové prvky implementace:
1. **Status a odznaky (`VERIFIED` / `STALE`):**
   - Vizuální odznak *Aktivně ověřeno* (emerald) pro stav `VERIFIED`.
   - Vizuální odznak *K přezkoumání* (amber) pro stav `STALE`.
   - Stavy `PENDING_REVIEW` a `REJECTED` jsou veřejně potlačeny.
2. **Datum ověření (`verifiedAt` / `lastCheckedAt`):**
   - Zobrazení informace `Naposledy ověřeno: DD.MM.YYYY` v záhlaví sekce.
3. **Oficiální úřední kontakty:**
   - Zobrazení dedikovaného bloku pro `officialPhone` (`tel:`), `officialEmail` (`mailto:`) a `officialWebsite` (s atributy `target="_blank"` a `rel="noopener noreferrer"`).
4. **Datová schránka (`dataBoxId`):**
   - Zobrazení ISDS kódu v monospace formátu s tlačítkem pro zkopírování do schránky a 2sekundovou vizuální zpětnou vazbou.
5. **Úřední / otevírací hodiny (`openingHours` / `openingHoursRaw`):**
   - Strukturované zobrazení rozpisu Po–Pá/Ne s časovými okny a štítky (`podatelna`, `pouze pro objednané`), s bezpečným fallbackem pro nestrukturovaný text.
6. **Objednání předem & Rezervační odkaz (`appointmentRequired`, `bookingUrl`):**
   - Jasná textová i vizuální indikace, zda je nutné se předem objednat.
   - Odkaz na online rezervaci se striktní sanitizací protokolu (`http`/`https`).
7. **Bezbariérovost (`accessibility`):**
   - Strukturovaný blok s popisem bezbariérového přístupu dle vyhlášky č. 398/2009 Sb.
8. **Způsoby podání (`submissionMethods`):**
   - Formátované štítky pro akceptované formy podání (`Datová schránka`, `Pošta`, `Osobně na podatelně`, `E-mail s uznávaným el. podpisem`).
9. **Katalogové karty v seznamu:**
   - Doplnění štítku ověření a identifikátoru ISDS do karet v mřížce registru.
10. **Lazy-fetch profile fallback:**
    - Doplnění bezpečného načtení `/api/subjekty/:id/verified-profile`, pokud je subjekt otevřen přímo přes odkaz a profil nebyl přednačten.

---

## 3. Datový model & Architektura

- **Žádný nový model:** Využívá se výhradně existující model `SubjectVerifiedProfile`.
- **Žádná Prisma migrace:** Schéma databáze zůstalo 100% netknuté.
- **Žádná nová datová vrstva:** Registr i Mapa sdílejí totožný DTO kontrakt a sanitizační funkce (`toPublicSubjektDto`).
- **Nulová duplicita:** Logika formátování a sanitizace striktně odpovídá pravidlům zavedeným v Mapě.

---

## 4. Fail-Closed bezpečnostní pravidla

Implementace striktně dodržuje principy Zero Trust a Fail-Closed:
- **Chybějící profil:** Pokud subjekt nemá `verifiedProfile`, celá sekce *Ověřené úřední informace* se nezobrazí.
- **`PENDING_REVIEW`:** Návrhy čekající na schválení nejsou veřejně prezentovány jako ověřené.
- **`REJECTED`:** Zamítnuté profily nejsou veřejně prezentovány jako ověřené.
- **`null` / `undefined` hodnoty:** Žádné fiktivní hodnoty ani statické generované fallbacky; nevyplněné pole se jednoduše nevykreslí.
- **`bookingUrl`:** Přísná sanitizace přes regulární výraz `/^https?:\/\//i`, který blokuje škodlivé URI schémata (`javascript:`, `data:` apod.).

---

## 5. Runtime Evidence

Byla provedena exaktní runtime verifikace v běžícím prostředí aplikace:

### A. Ověřený subjekt: Okresní soud v Chrudimi (`subj-nonospod-74`)
- **Status:** `VERIFIED` (*Aktivně ověřeno*)
- **Datová schránka:** `d2qab4q`
- **Oficiální telefon:** `+420 469 669 111`
- **Oficiální e-mail:** `podatelna@osoud.chr.justice.cz`
- **Oficiální web:** `https://www.justice.cz`
- **Objednání předem:** `appointmentRequired = false` (*Není vyžadováno*)
- **Úřední hodiny:** Normalizovaný rozpis podatelny (Po–Pá)
- **Bezbariérovost:** `Budova soudu splňuje standardy bezbariérového přístupu (výtah / plošina / bezbariérový vstup dle vyhlášky č. 398/2009 Sb.)`
- **Způsoby podání:** `Datová schránka soudu (ISDS), elektronická podatelna se zaručeným elektronickým podpisem (QES), poštovní doručení nebo osobní podání na podatelně soudu.`

### B. Subjekt bez ověřeného profilu (Fail-Closed): Marie Svobodová / ZNALEC (`subj-nonospod-108`)
- **Status ověření:** Profil neexistuje (`hasVerifiedProfile = false`, `verifiedProfile = undefined`).
- **Výsledek:** V UI se zobrazují pouze standardní kontaktní údaje; blok ověřených informací je zcela potlačen.

---

## 6. Test Evidence

Všechny testy v testovací infrastruktuře prošly se 100% úspěšností:

- `tests/soudy-data-population.test.ts` — **6/6 PASS**
- `tests/mapa-subjektu-advanced-filters.test.ts` — **15/15 PASS**
- `tests/mapa-subjektu-verified-profile-geocode.test.ts` — **9/9 PASS**
- `tests/test_subject_verified_info.ts` — **16/16 PASS**
- **CELKEM:** **46/46 PASS (0 FAIL)**
- **`npm run lint` (`tsc --noEmit`):** ✅ PASS (0 chyb)
- **`compile_applet` (Vite production build):** ✅ PASS

---

## 7. Security Audit (P0–P3)

- **P0 — Interní metadata leak:** **PASS.** Interní auditní atributy (`createdById`, `verifiedById`, `reviewedById`, `informationSources`, `pendingSourcesCount`) nejsou v public DTO obsaženy a Registr k nim nemá přístup.
- **P0 — Unsafe URL / XSS:** **PASS.** Rezervační odkaz (`bookingUrl`) striktně validuje protokol `http/https`.
- **P1 — Neoprávněná expozice neschválených dat:** **PASS.** Stavy `PENDING_REVIEW` a `REJECTED` se veřejně nezobrazují.
- **P2 — IDOR / BOLA / Mass Assignment:** **PASS.** Žádné nové write operace ani neautorizované mutace stavu nebyly zavedeny.

---

## 8. Acceptance Reference

- **Reference:** `MASTER-ACCEPT-07B`
- **Původní výsledek:** `PASS WITH LIMITATIONS`
- **Důvod limitation:** Absence formálního auditního dokumentu `docs/audits/MASTER-IMPLEMENT-07B-REGISTRY-VERIFIED-PROFILE-PARITY.md`.
- **Aktuální stav:** Vytvořením tohoto auditního dokumentu byla jediná limitation úspěšně odstraněna.

---

## 9. Otevřená rizika & Další kroky

- **44 non-soudních demo subjektů:** V databázi zůstává 44 subjektů (znalci, mediátoři, OSPOD bez verifikace), které zatím nemají oficiální `SubjectVerifiedProfile`. Tyto subjekty se korektně řídí fail-closed pravidlem.
- **Four-Eyes bootstrap issue:** Zůstává evidováno jako samostatné otevřené téma z `MASTER-ACCEPT-07A`.
- **Rozsah:** Tento dokument neřeší FÁZI 07C ani bootstrap bránu, týká se striktně parity zobrazení ověřených profilů mezi Registrem a Mapou.
