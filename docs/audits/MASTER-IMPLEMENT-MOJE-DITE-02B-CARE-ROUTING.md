# AUDIT A DOKUMENTACE OPRAVY — MASTER-IMPLEMENT-MOJE-DITE-02B

**Název úkolu:** MASTER-IMPLEMENT-MOJE-DITE-02B — Oprava routingu veřejné "/pece" a privátního "/portal/pece"  
**Projekt:** Táta má právo / Synthesis Hub (`jirisar7-eng/dev3`)  
**DEV3 Runtime:** `https://dev3.tatovacesta.cz/pece`  
**Datum:** 2026-09-06  
**Autor:** Senior Full-Stack Architect & DevSecOps  

---

### A. ROOT CAUSE ANALÝZA (PŮVODNÍ STAV)
Při pokusu o přístup na veřejnou trasu `/pece` byla nepřihlášenému návštěvníkovi zobrazena obrazovka *„Přístup do soukromé zóny — Pro vstup do uživatelského portálu se prosím přihlaste.“*.

**Analýzou bylo zjištěno:**
V souboru `src/App.tsx` obsahovala funkce `getViewFromPath()` pravidlo:
```typescript
if (path.startsWith('/portal') || path.startsWith('/muj-pripad') || path.startsWith('/pece') || ...) return 'private';
```
Toto pravidlo způsobilo, že klientský router vyhodnotil trasu `/pece` jako `'private'` a vykreslil `UserDashboard.tsx`. Jelikož uživatel nebyl přihlášen (`currentUser === null`), `UserDashboard.tsx` zobrazil hlášku pro přihlášení. Požadavek se nikdy nedostal do `PublicPortal.tsx` ani do `CareHubPublicLandingView.tsx`.

---

### B. PROVEDENÉ ZMĚNY

1. **`src/App.tsx` (Odstranění `/pece` z privátního routeru):**
   - V `getViewFromPath()` odebrán výraz `|| path.startsWith('/pece')`.
   - Trasa `/pece` je nyní správně vyhodnocována jako `'public'`.
   - Trasa `/portal/pece` nadále spadá pod `path.startsWith('/portal')` a vrací `'private'`.

2. **`src/components/private/UserDashboard.tsx` (Přeorientování privátního CareHubu):**
   - Upravena podmínka z `if (currentPath.startsWith('/pece'))` na `if (currentPath.startsWith('/portal/pece'))`.
   - Privátní komponenta `CareHubPage` je nyní přístupná výhradně přes `/portal/pece` v rámci přihlášeného dashboardu.

3. **`src/components/public/CareHubPublicLandingView.tsx` (Korekce CTA přesměrování):**
   - V `handleCtaClick()` opraveno přesměrování pro přihlášeného uživatele z navracení na veřejné `/pece` na privátní zónu `/portal/pece`.

4. **`src/tests/careHubPublicView.test.ts` (Testovací pokrytí routingu):**
   - Přidán nový scénář (Test 9) ověřující, že `App.tsx` neklasifikuje `/pece` jako privátní a CTA přesměrovává přihlášeného uživatele na `/portal/pece`.

---

### C. ZMĚNĚNÉ SOUBORY
- `src/App.tsx`
- `src/components/private/UserDashboard.tsx`
- `src/components/public/CareHubPublicLandingView.tsx`
- `src/tests/careHubPublicView.test.ts`
- `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02B-CARE-ROUTING.md` *(Tento dokument)*
- `CHANGELOG.md`

---

### D. ARCHITEKTURA A ROUTING PO OPRAVĚ

```
PUBLIC ROUTE
/pece (nebo /care-hub, /pece-o-dite)
  ↓
App.tsx (getViewFromPath ➔ 'public')
  ↓
PublicPortal.tsx (slug === 'pece')
  ↓
CareHubPublicLandingView.tsx
  ↓
Veřejný metodický obsah (přístupný VŠEM bez přihlášení)


PRIVATE ROUTE
/portal/pece
  ↓
App.tsx (getViewFromPath ➔ 'private')
  ↓
UserDashboard.tsx (currentPath.startsWith('/portal/pece'))
  ↓
CareHubPage.tsx
  ↓
Privátní správa spisu a plánu péče pro přihlášeného uživatele
```

---

### E. SECURITY AUDIT (P0–P3)
- **P0 / Secrets & Credentials:** 0 nálezů.
- **P1 / Authorization Boundary & PII:** Zpřísněna hranice mezi veřejnou a privátní zónou. Veřejná `/pece` nenačítá privátní data spisu (`UserCase`, `CaseChild`, `UserChild`). Privátní `CareHubPage` je bezpečně chráněna v `UserDashboard` pod `/portal/pece`.
- **P2 / Route Conflict:** Zrušena kolize tras.
- **P3 / UX Hardening:** Nepřihlášený uživatel vidí plnohodnotný edukační obsah, přihlášený uživatel se z CTA dostane přímo do svého privátního portálu.

---

### F. VÝSLEDKY VERIFIKACE A TESTŮ
1. **Vitest Unit Testy:**
   - Command: `npx vitest run src/tests/careHubPublicView.test.ts src/tests/psychologieView.test.ts`
   - Výsledek: `18 passed (18/18)` — 100% uspělo.
2. **Typecheck & Lint:**
   - Command: `npm run lint` (`tsc --noEmit`)
   - Výsledek: `0 errors` — 100% čisté.
3. **Produkční Build:**
   - Command: `npm run build`
   - Výsledek: Úspěšně skompilováno.
4. **DEV3 Runtime Smoke Test:**
   - `GET https://dev3.tatovacesta.cz/pece` ➔ Zobrazí veřejný CareHub bez přihlašovací obrazovky.
   - `GET https://dev3.tatovacesta.cz/portal/pece` ➔ Chráněná privátní zóna.
   - `GET https://dev3.tatovacesta.cz/psychologie` ➔ Bez regrese, plně funkční.

---

### G. ZÁVĚREČNÝ STATUS
🟢 **PASS** — Problém s nechtěným vyžadováním přihlášení na `/pece` byl vyřešen, kód je bezpečný, otestovaný a bez regresí.
