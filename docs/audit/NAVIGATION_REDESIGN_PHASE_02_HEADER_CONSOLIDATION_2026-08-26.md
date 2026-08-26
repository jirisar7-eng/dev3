# NAVIGATION + ADMIN SHELL REDESIGN — PHASE 02: HEADER & NAVIGATION CONSOLIDATION

**Projekt:** Táta má právo (`jirisar7-eng/dev3`)  
**Datum a čas:** 2026-08-26  
**Fáze:** PHASE 02 — Header & Navigation Consolidation  
**Cílové prostředí:** DEV3 (`https://dev3.tatovacesta.cz`) / plná kompatibilita s PROD3  
**Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor projektu  

---

## 1. CÍL FÁZE A ZADÁNÍ

Sjednotit stávající rozptýlené navigační prvky a rozhraní do jednoho hlavního, konzistentního navigačního systému bez vzniku paralelních architektur:

1. **Jediný zdroj pravdy:** Konsolidace navigačního stromu a hierarchie v `src/config/navigation.ts`.
2. **Konzistentní filtrování viditelnosti:** Vytvoření a integrace helper funkce `getVisibleNavItems(items, authContext)` s granularitou rolí:
   - `ANONYMOUS`: Vidí výhradně veřejné položky (`public`). Žádné privátní spisy (`cat-4`), účty (`cat-9`) ani administraci (`cat-10`). V hlavičce jsou zobrazeny akce "Přihlásit se" / "Registrace".
   - `AUTHENTICATED USER`: Vidí veřejné položky + uživatelské položky (`user` - Můj případ, Dokumenty případu, AI Case Manager, Kalendář, Profil, Nastavení, Odhlášení). Nevidí administrátorské položky.
   - `TEAM (VOLUNTEER / MODERATOR / EDITOR)`: Vidí veřejné, uživatelské a přidělené týmové/redakční sekce.
   - `ADMIN / SUPER_ADMIN`: Vidí plný navigační strom včetně administrace (`admin`), správy uživatelů a pokročilého systémového managementu (VPS správa výhradně pro `SUPER_ADMIN` / `SYSTEM_ADMIN` / `ADMIN`).
3. **Odstranění duplicit:** Úplné odstranění redundantních komponent `src/components/Navbar.tsx` a `src/components/layout/Navbar.tsx` po ověření a refaktoringu všech jejich závislostí.
4. **Responzivní sjednocení:** Desktopové i mobilní menu (`Header.tsx`, `MegaMenu.tsx`) čerpají ze shodného zdroje a aplikují identická pravidla viditelnosti.

---

## 2. PŘEHLED PROVEDENÝCH ZMĚN

### 2.1 Datové typy a konfigurace (`src/types/index.ts` & `src/config/navigation.ts`)
- Rozšířeno rozhraní `NavItem` o volitelná pole:
  - `visibility?: 'public' | 'user' | 'team' | 'admin'`
  - `requiredRoles?: string[]`
  - `requiredPermissions?: string[]`
- V `src/config/navigation.ts` implementován normalizovaný navigační strom `NAVIGATION_ITEMS` (10 hlavních kategorií + podpoložky) a autorizační funkce:
  - `isNavItemVisible(item: NavItem, auth: NavAuthContext): boolean`
  - `getVisibleNavItems(items: NavItem[], auth: NavAuthContext): NavItem[]`
  - Zajištěna integrita hierarchie: potomci se nezobrazí, pokud je skryt jejich rodič; prázdné kategorie se nezobrazují jako slepé nadpisy.

### 2.2 Konsolidace komponent (`Header.tsx` & `MegaMenu.tsx`)
- `src/components/Header.tsx`:
  - Plně přepojeno na `getVisibleNavItems`.
  - Responzivní přizpůsobení s podporou dropdownů a mobilního triggeru.
  - Odstraněna veškerá přímá vazba na staré duplicitní Navbar implementace.
- `src/components/layout/MegaMenu.tsx`:
  - Přepojeno na `getVisibleNavItems`.
  - Sjednocené seskupování podpoložek podle `parentId` a filtrování podle aktuálního stavu uživatele.
- `src/pages/SupportUsPage.tsx`:
  - Odstraněn import a použití zaniklé komponenty `Navbar`.

### 2.3 Odstraněné redundantní soubory
- `src/components/Navbar.tsx` (smazáno)
- `src/components/layout/Navbar.tsx` (smazáno)

---

## 3. SEZNAM DOTČENÝCH SOUBORŮ

| Soubor | Typ změny | Popis |
|---|---|---|
| `src/types/index.ts` | Úprava | Přidání `visibility`, `requiredRoles`, `requiredPermissions` do `NavItem` |
| `src/config/navigation.ts` | Úprava / Náhrada | Kompletní konfigurace kategorií a export `getVisibleNavItems` |
| `src/components/Header.tsx` | Úprava | Integrace `getVisibleNavItems`, odstranění duplicitního stavu |
| `src/components/layout/MegaMenu.tsx` | Úprava | Integrace `getVisibleNavItems`, sjednocení hierarchie kategorií |
| `src/pages/SupportUsPage.tsx` | Úprava | Odstranění odkazu na starý `Navbar` |
| `src/components/Navbar.tsx` | Smazáno | Odstranění nepoužívaného proxy wrapperu |
| `src/components/layout/Navbar.tsx` | Smazáno | Odstranění duplicitní navbar komponenty |
| `scripts/test-runner.js` | Úprava | Registrace nového testovacího balíčku pro Phase 02 |
| `tests/navigation-consolidation-phase02.test.ts` | Nový soubor | Automatizované testy pro validaci RBAC navigace a integrity |

---

## 4. VÝSLEDKY TESTOVÁNÍ A QA VERIFIKACE

### 4.1 Typecheck & Lint (`npm run lint` / `tsc --noEmit`)
```
> tsc --noEmit
VÝSLEDEK: PASS (0 chyb)
```

### 4.2 Build kompilace (`compile_applet`)
```
VÝSLEDEK: Build succeeded - the applet is compiled (0 chyb)
```

### 4.3 Automatizované testy (`tests/navigation-consolidation-phase02.test.ts`)
- **Test 1: Anonymous User:** Ověřena striktní viditelnost pouze veřejných položek (kat 0, 1, 2, 3, 5, 6, 7, 8). Privátní položky (`cat-4`, `cat-9`, `cat-10`, `/admin`, `/muj-pripad`, `/portal/*`) jsou bezpečně skryty. `PASS`
- **Test 2: Authenticated Standard User:** Ověřena dostupnost veřejných i privátních sekcí (`cat-4`, `cat-9`), skrytí administračních položek (`cat-10`, `/admin`, `/admin/vps`). `PASS`
- **Test 3: Authenticated Admin / Super Admin:** Ověřena dostupnost plného spektra včetně CMS a VPS správy. `PASS`
- **Test 4: Legal Editor / Moderator:** Ověřena dostupnost CMS správy bez přístupu k super-admin VPS funkcím. `PASS`
- **Test 5: Hierarchy Integrity:** Žádné osiřelé potomky ani prázdné kategorie bez viditelného obsahu. `PASS`
- **Test 6: Single Source of Truth:** Ověřeno úplné fyzické odstranění `Navbar.tsx` z repozitáře. `PASS`

---

## 5. BEZPEČNOSTNÍ VYHODNOCENÍ (SECURITY & INTEGRITY AUDIT)

1. **Žádné Secrets:** Zkontrolováno, že soubory neobsahují hardcoded hesla, API tokeny ani citlivá data.
2. **Autoritativní Server-Side RBAC:** Změny navigace slouží výhradně pro UX a ergonomii rozhraní. Serverové endpointy (`/api/admin/*`, `/api/portal/*`, `/api/cases/*`) jsou autoritativně chráněny na straně Express middleware.
3. **Data Integrity:** Žádné destruktivní zásahy do databáze ani mockovací zásahy do produkčních cest.

---

## 6. ZÁVĚR A STAV

Fáze **PHASE 02: Header & Navigation Consolidation** byla úspěšně dokončena, otestována a je připravena k začlenění do vývojové větve.
