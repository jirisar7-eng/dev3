# AUDIT DOKUMENTACE — MASTER-IMPLEMENT-MOJE-DITE-02

**Název úkolu:** MASTER-IMPLEMENT-MOJE-DITE-02 — CareHub /pece  
**Projekt:** Táta má právo / Synthesis Hub (`jirisar7-eng/dev3`)  
**DEV3 Runtime:** `https://dev3.tatovacesta.cz/pece`  
**Datum:** 2026-09-06  
**Autor:** Senior Full-Stack Architect & DevSecOps  

---

### A. AKTUÁLNÍ STAV
Požadavek na URL `/pece` byl vyřešen zapojením bezstavové veřejné komponenty `CareHubPublicLandingView.tsx` do hlavního klientského směrovače `PublicPortal.tsx`. Tím byl odstraněn problém, kdy nevětvící se požadavky propadaly do `CmsPageRenderer` a zobrazovaly prázdný fallback.

---

### B. RUNTIME FLOW
```
GET /pece 
  ➔ main.tsx 
  ➔ App.tsx 
  ➔ PublicPortal.tsx (currentPath="/pece", slug="pece")
  ➔ [Podmínka slug === 'pece' || slug === 'care-hub' || slug === 'pece-o-dite']
  ➔ [Kontrola localStorage PUCK_PECE_RENDERER_ENABLED]
  ➔ Fallback: <CareHubPublicLandingView onNavigate={onNavigate} />
  ➔ Vykreslení veřejné metodiky Care Hub bez vyžadování přihlášení
```

---

### C. PROVEDENÉ ZMĚNY
1. **Směrování v `PublicPortal.tsx`:**
   - Přidán import `import { CareHubPublicLandingView } from './CareHubPublicLandingView';`.
   - Zavedeno zpracování směrování pro `slug === 'pece' || slug === 'care-hub' || slug === 'pece-o-dite'`.
   - Zachována podpora pro Puck CMS skrze `CmsPageRenderer` s fallbackem na `CareHubPublicLandingView`.
2. **Rozšíření komponenty `CareHubPublicLandingView.tsx`:**
   - **Tlačítko pro návrat:** Přidáno tlačítko *„Zpět na Moje dítě“* (`/psychologie`).
   - **Tlačítko pro tisk:** Přidáno tlačítko *„Vytisknout / PDF“* (`window.print()`) a doplněny třídy `print:hidden`.
   - **Odborné a etické vymezení:** Vložen amber banner jasně deklarující, že stránka neposkytuje diagnostiku, nehodnotí rodiče a nenahrazuje odborníky (pediatr, psycholog, právník, OSPOD).
   - **Metodický blok pro novorozence a kojence (0–1 rok):** Vytvořeno 6 karet s doporučeními v nekategorickém jazyce (*„může být vhodné…“*, *„záleží na okolnostech…“*, *„je vhodné zohlednit…“*):
     1. Bezpečí a stabilní prostředí (attachment).
     2. Krmení, kojení a odsávání (flexibilní dohoda).
     3. Spánek a denní rytmus (večerní a noční péče s odkazem na výzkumy Warshak 2014, Fabricius & Suh 2017).
     4. Hygiena a každodenní péče (přebalování, koupání, nošení).
     5. Předávání a adaptace (postupné budování kontaktů).
     6. Komunikace rodičů o dítěti (sdílení záznamů o spánku, krmení a zdraví).
   - **Srovnání modelů péče:** Přidáno výslovné upozornění, že modely (7-7, 2-2-3, 2-2-5-5, rozšířená péče) slouží jako *příklady možného uspořádání*, nikoli jako univerzální šablona.
   - **Spodní křižovatka:** Přidána 4 tlačítka na navazující moduly Moje dítě (`/psychologie`, `/skola`, `/zdravotni-pece`, `/studie/citova-vazba`).
3. **Nový test `src/tests/careHubPublicView.test.ts`:**
   - Vytvořeno 8 testovacích scénářů ověřujících směrování, absenci privátních modulů spisu, obsahové bloky, disclaimer, nekategorický jazyk, tisk a navigaci.

---

### D. ZMĚNĚNÉ SOUBORY
- `src/components/public/PublicPortal.tsx` *(Přidání importu a směrovací větve pro /pece)*
- `src/components/public/CareHubPublicLandingView.tsx` *(Rozšíření o 0-1 r. péči, tisk, disclaimer, navazující moduly)*
- `src/tests/careHubPublicView.test.ts` *(Nový unit test pro veřejný CareHub)*
- `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02-CAREHUB.md` *(Tento dokument)*
- `CHANGELOG.md` *(Aktualizace vývojového deníku)*

---

### E. POUŽITÉ EXISTUJÍCÍ KOMPONENTY
- `CareHubPublicLandingView.tsx` (Veřejná bezstavová landing komponenta).
- `PublicPortal.tsx` (Hlavní veřejný router).
- `CmsPageRenderer.tsx` (Puck CMS fallback wrapper).
- `SeoHead.tsx` (Správa SEO meta tagů).

---

### F. TESTY
- `npx vitest run src/tests/careHubPublicView.test.ts src/tests/psychologieView.test.ts` → **PASS** *(17/17 testů PASSED)*.

---

### G. BUILD / TYPECHECK / LINT
- `npm run lint` (`tsc --noEmit`) → **PASS** *(0 chyb)*.
- `npm run build` → **PASS** *(Úspěšné vytvoření produkčního balíčku)*.

---

### H. DEV3 RUNTIME
- **URL:** `https://dev3.tatovacesta.cz/pece`
- **Sledovaný stav:** Požadavek na `/pece` správně vykresluje veřejný CareHub s metodikou pro novorozence i starší děti, fungujícími interaktivními přepínači modelů, tiskovým tlačítkem a spojením na navazující veřejné stránky. Nevyžaduje přihlášení a nepadá do 404/Puck fallbacku.

---

### I. SECURITY
- **P0 / Secrets:** 0 tajných klíčů či hesla.
- **P1 / Private Case Data:** Veřejná stránka `/pece` nepoužívá privátní modely `UserCase`, `CaseChild`, `UserChild` ani privátní komponenty `CareHubPage.tsx` / `CareHubTab.tsx`. **Zero PII leakage**.
- **P2 / Authorization:** Nepřihlášený uživatel se dostane výhradně k veřejným metodikám. Tlačítka pro přechod do privátní zóny směrují nepřihlášeného uživatele na `/login`.

---

### J. PRINT / PDF
- Zavedeno tlačítko `window.print()`.
- Doplněny tiskové utility `print:hidden` pro skrytí navigačních tlačítek při zachování plné čitelnosti edukačních textů, disclaimeru, checklistu a modelů.

---

### K. ZBYLÁ RIZIKA
- **Žádná kritická rizika.** Modul funguje nezávisle a plně bezstavově.

---

### L. GIT STAV
- Git verification BLOCKED — repository není v aktuálním runtime prostředí dostupné (`.git` složka neexistuje).

---

### M. VERDIKT

🟢 **PASS** — Vše bylo implementováno, otestováno, ověřeno v buildu a zdokumentováno.
