# PHASE 06A — DEV3 LIVE NAVIGATION RECONCILIATION & LEGACY HEADER DISCOVERY AUDIT REPORT

**Datum a čas:** 2026-08-26 11:25 UTC  
**Prostředí:** DEV3 Live Runtime & Navigation Subsystem Reconciliation  
**Větev:** `feature/auth-session-consistency`  
**Režim:** STRICT READ-ONLY RECONCILIATION AUDIT (NO CODE / NO DB CHANGES / NO COMMIT / NO PUSH)  
**Auditor:** Hlavní Softwarový Architekt & DevSecOps Lead Auditor  

---

## 1. SHRNUTÍ A JEDNOZNAČNÝ ZÁVĚR (CHECKPOINT)

### **PHASE 06A CHECKPOINT: PASS**
*(Fyzická inventura a reconciliace živého stavu veřejné navigace DEV3 byla úspěšně dokončena. Přesný ROOT CAUSE všech zjištěných chyb byl jednoznačně identifikován a zdokumentován).*

---

## 2. PŘEDMĚT REKONSTRUKCE & ŽIVÉ NÁLEZY Z DEV3

Na živém prostředí DEV3 bylo ověřeno:
1. **Admin Shell (`/administrace`):** Používá novou vyhrazenou 8-sekční architekturu (`AdminSidebar.tsx`, `AdminHeader.tsx`, `adminNavigation.ts`) zavedenou ve fázích 03A–03D. Funguje správně a nezávisle.
2. **Team Center (`/team`):** Používá novou vyhrazenou architekturu zavedenou ve fázích 04C–04E. Funguje správně.
3. **Veřejná navigace (`Header.tsx` & `MegaMenu.tsx`):** Vykresluje staré menu z původního navigačního stromu (10 legacy kategorií z období před fázemi 03/04).
4. **Rozcestník:** Veřejné overlay menu obsahuje pevný text **„HLAVNÍ ROZCESTNÍK PORTÁLU“**.
5. **Duplicita:** Veřejné menu zobrazuje duplicitní položku **„Moje cesta zakladatele“**.

---

## 3. FYZICKÁ INVENTURA KOMPONENT & IMPORTNÍCH CEST

| Komponenta | Soubor | Roli v navigaci | Datový zdroj |
| :--- | :--- | :--- | :--- |
| **`Header.tsx`** | `src/components/Header.tsx` | Primární hlavička aplikace v `App.tsx`. Zobrazuje top bar a přepínač vrstev. | `/api/cms/nav` (DB) + fallback `NAVIGATION_ITEMS` (`src/config/navigation.ts`) |
| **`MegaMenu.tsx`** | `src/components/layout/MegaMenu.tsx` | Overlay rozcestník při kliku na MENU / mobilní režim. | Vstupní props z `Header.tsx` (`effectiveNavItems`) |
| **`Footer.tsx`** | `src/components/Footer.tsx` | Patka portálu s vlastní sadou rychlých odkazů. | Statické odkazové sekce |
| **`AdminHeader.tsx` / `AdminSidebar.tsx`** | `src/components/admin/layout/` | Samostatný Admin Shell navigační modul. | `src/config/adminNavigation.ts` (8 sekcí) |
| **`TeamCenterSlot.tsx`** | `src/components/admin/layout/` | Samostatný Team Center navigační modul. | Interní sekce Team Centeru |

---

## 4. HLAVNÍ NÁLEZY & ROOT CAUSE ANALÝZA

### **Nález 1: Původ textu „HLAVNÍ ROZCESTNÍK PORTÁLU“**
- **Soubor:** `src/components/layout/MegaMenu.tsx` (řádek 59)
- **Root Cause:** Text `HLAVNÍ ROZCESTNÍK PORTÁLU` je natvrdo zakódován v JSX šabloně komponenty `MegaMenu.tsx`:
  ```tsx
  <div className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
    <Compass className="w-5 h-5 text-blue-600" />
    <span>HLAVNÍ ROZCESTNÍK PORTÁLU</span>
  </div>
  ```

### **Nález 2: Proč Admin Shell & Team Center mají novou navigaci, ale veřejný Header starou**
- **Root Cause:** V fázích 03A–03D byl kompletně přepsán Admin Shell a dostal vlastní navigační konfiguraci (`src/config/adminNavigation.ts`). Podobně v fázích 04C–04E získal Team Center vlastní navigační architekturu.
- Veřejná navigace (`Header.tsx` a `MegaMenu.tsx`) však v fázích 03/04 nebyla přestavěna na novou datovou strukturu. V Phase 02 sice došlo ke konsolidaci komponenty (`Navbar.tsx` byl smazán a sjednocen do `Header.tsx`), ale datovým zdrojem zůstala původní 10-kategoriová konfigurace `src/config/navigation.ts` a backend endpoint `/api/cms/nav` (který vrací historická data ze `seed.ts` / `dbStore.ts`).

### **Nález 3: Původ duplicity „Moje cesta zakladatele“**
- **Soubory:** `src/config/navigation.ts`, `prisma/seed.ts`, `src/components/Header.tsx`
- **Root Cause:** 
  1. Statická fallback konfigurace v `src/config/navigation.ts` obsahuje položku s ID `sub-8-2` a URL `/moje-cesta-zakladatele`.
  2. Databáze / Seed `/api/cms/nav` obsahuje původní položku s ID `sub-8-1b` a URL `/cesta-zakladatele` (nebo variantu s jiným ID/URL).
  3. V `Header.tsx` (řádky 97–102) probíhá slučování dat z API a ze statického fallbacku:
     ```typescript
     const dbUrls = new Set(navData.map(n => n.url));
     const dbIds = new Set(navData.map(n => n.id));
     const missingRequired = FALLBACK_NAV_ITEMS.filter(n => !dbUrls.has(n.url) && !dbIds.has(n.id));
     baseNav = [...navData, ...missingRequired];
     ```
     Protože ID `sub-8-2` a URL `/moje-cesta-zakladatele` v datech z DB neexistují (DB má pouze `sub-8-1b` / `/cesta-zakladatele`), slučovací algoritmus vyhodnotí položku ze statického fallbacku jako „chybějící povinnou“ a přidá ji. V menu se pak zobrazí **obě** verze.

---

## 5. KLASIFIKACE CHYB A ZJIŠTĚNÍ PRO DŮVĚRU V PHASE 03D

### **Kategorizace dle typu problému:**
Zvolena **Kombinace F (Kombinace více zdrojů: C + E)**:
- **C (DB-driven fallback / merge logic):** Endpoint `/api/cms/nav` vrací z DB legacy položky, které se v `Header.tsx` nesprávně slučují s `FALLBACK_NAV_ITEMS`.
- **E (Un-refactored Public Navigation branch):** Veřejná navigace nebyla refaktorována v rámci fází 03/04 a stále využívá legacy 10-kategoriový navigační strom.

### **Prověrka tvrzení z PHASE 03D:**
> *Tvrzení z Phase 03D: „Žádné zastaralé Navbar komponenty v repozitáři nezůstaly.“*

- **Z hlediska zdrojových komponent (KÓD): PLATÍ.**  
  Soubory `src/components/Navbar.tsx` a `src/components/layout/Navbar.tsx` byly v Phase 02 fyzicky smazány. V repozitáři neexistuje žádná duplicitní `Navbar.tsx` komponenta.
- **Z hlediska datových struktur a veřejné navigace (DATA): NEPLATÍ.**  
  Datová konfigurace `src/config/navigation.ts` a databázový seeder stále nesou původní 10-kategoriový navigační strom z legacy verze portálu.

---

## 6. PRIORITIZACE NÁLEZŮ (P0 / P1 / P2 / P3)

### **P0 — Kritické runtime vizuální chyby na DEV3**
- **P0-1:** Duplicita položky „Moje cesta zakladatele“ ve veřejném menu z důvodu nesprávného slučování ID/URL v `Header.tsx`.

### **P1 — Architektonická nekonzistence veřejné navigace**
- **P1-1:** Veřejná navigace (`Header.tsx` + `MegaMenu.tsx`) neodpovídá modernizované architektuře Admin Shellu a Team Centeru. Využívá neefektivní 10-kategoriový strom.
- **P1-2:** Pevně zakódovaný titulkový řetězec `HLAVNÍ ROZCESTNÍK PORTÁLU` v `MegaMenu.tsx` (řádek 59).

### **P2 — Nekonzistence databázového seedu a CMS Navigace**
- **P2-1:** Soubory `prisma/seed.ts` a `src/services/dbStore.ts` obsahují zastaralé ID a URL adresy navigačních položek.

### **P3 — Drobná nečistota konfigurace**
- **P3-1:** Nadbytečné kategorie v `src/config/navigation.ts` (např. `cat-home` s duplicitními odkazy na `/` a `/verejny-portal`).

---

## 7. NÁVRH REALIZAČNÍHO PLÁNU PRO PHASE 06B (PROPOSAL ONLY — UNEXECUTED)

Po schválení kroku Change Control navrhujeme provést minimální cílenou opravu v rámci **PHASE 06B**:

1. **Sjednocení datové konfigurace veřejné navigace (`src/config/navigation.ts` & `prisma/seed.ts`):**
   - Vyčistit legacy 10-kategoriovou strukturu na moderní, přehlednou 6-sekční veřejnou navigaci portálu.
   - Odstranit duplicitní položku Cesty zakladatele (`sub-8-1b` vs `sub-8-2`).

2. **Úprava dedup & merge logiky v `Header.tsx`:**
   - Upravit slučovací logiku v `Header.tsx`, aby porovnávala také normalizovaná URL a zabránila duplikaci při načítání z `/api/cms/nav`.

3. **Modernizace a refaktoring `MegaMenu.tsx`:**
   - Nahradit natvrdo napsaný nadpis `HLAVNÍ ROZCESTNÍK PORTÁLU` dynamickým/flexibilním záhlavím s podporou lokalizace.
   - Sjednotit responzivní zobrazení kategórií.

4. **Přidání automatizovaného testu navigační konzistence:**
   - Vytvořit testovací sadu ověřující unikatost všech URL a navigačních ID bez duplicit.

---

## 8. POTVRZENÍ STAVU ENVIRONMENTU

- **Zdrojový kód:** Nebyl změněn (0 změn).
- **Prisma Schema & DB:** Nebyly změněny (0 změn).
- **Git Status:** Pracovní strom zůstal beze změn (mimo vytvoření tohoto READ-ONLY auditního dokumentu).
- **Git Commit & Push:** Nebyl spuštěn (NO COMMIT / NO PUSH).
