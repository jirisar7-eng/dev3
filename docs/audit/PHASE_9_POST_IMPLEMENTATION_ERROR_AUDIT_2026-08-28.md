# AUDIT REPORT: PHASE 9 – POST-IMPLEMENTATION ERROR AUDIT

- **Datum a čas:** 2026-08-28 00:14 UTC
- **Projekt:** Táta má právo (dev3)
- **Cíl auditu:** Prověřit chyby, regresní problémy a nedokončené části související s FÁZÍ 8
- **Stav implementace:** PARTIAL / NALEZENY CHYBY K NÁSLEDNÉ OPRAVĚ
- **Režim:** READ-ONLY ERROR AUDIT (Bez aplikace oprav v této fázi dle zadání)

---

## 1. Souhrn výsledků auditu

| Oblast | Stav | Zjištění / Závažnost |
| :--- | :---: | :--- |
| **Routing `/kalkulacka-vyzivneho`** | **CHYBA** | **Vysoká (Shadowing)**: V `PublicPortal.tsx` je slug zachycen dříve blokem pro `AiSimulatorView`, kalkulačka se nezobrazí. |
| **Routing & Komponenty `/pece`** | **PASS** | Všechny podcesty (`/pece/plany/:id`, `/pece/kalendar`, `/pece/simulator`, atd.) jsou správně propojeny s komponentami v `src/components/care/`. |
| **Routing `/coparent` (Veřejný)** | **PASS** | Správně směruje na `CoParentHubPage` v `PublicPortal.tsx`. |
| **Routing `/portal/coparent` (Privátní)**| **PASS** | Správně směruje na `CoParentPage` v `UserDashboard.tsx` a `App.tsx`. |
| **Autentizace v CoParent komponentách** | **CHYBA** | **Vysoká (P0 Security/Data Integrity)**: V `CoParentPage.tsx`, `JudgmentImportModal.tsx` a `InviteModal.tsx` je posílán fiktivní token `jwt_token_user_${Date.now()}` namísto autentického tokenu. |
| **TypeScript / Build** | **PASS** | `tsc --noEmit` a `compile_applet` procházejí bez chyb (0 chyb). |
| **Testy Fáze 8 & Celá Test Suite** | **PASS** | Všech 24 testovacích sad v `scripts/test-runner.js` i `tests/alimonyCalculator.test.ts` procházejí (100% PASS). |

---

## 2. Detailní rozbor zkoumaných oblastí

### 2.1 `/kalkulacka-vyzivneho`
- **Stav:** **CHYBA (Shadowed Route)**
- **Soubor:** `src/components/public/PublicPortal.tsx`
- **Konkrétní příčina:**
  Na řádku 363 v `PublicPortal.tsx` je definována podmínka:
  ```tsx
  if (slug === 'ai-simulator' || slug === 'simulator' || slug === 'plan-pece' || slug === 'kalkulacka-vyzivneho' || slug === 'simulator-predavani') return <AiSimulatorView onNavigate={onNavigate} />;
  ```
  Tato podmínka předbíhá řádek 380:
  ```tsx
  if (slug === 'kalkulacka-vyzivneho') return <AlimonyCalculatorPage onNavigate={onNavigate} />;
  ```
  V důsledku toho uživatel při kliknutí na `/kalkulacka-vyzivneho` neuvidí kalkulačku výživného, ale simulátor situací (`AiSimulatorView`).
- **Výpočetní jádro (`src/utils/alimonyCalculator.ts`):** Je plně funkční, respektuje doporučující tabulku MS ČR (věkové kategorie 0-5, 6-9, 10-14, 15+, redukce při více vyživovacích povinnostech, redukce dle dnů péče až po střídavou péči).
- **Testy (`tests/alimonyCalculator.test.ts`):** 6/6 testů úspěšně ověřeno.

---

### 2.2 `/pece` (Care Hub a sub-routes)
- **Stav:** **PASS**
- **Soubor:** `src/pages/CareHubPage.tsx`
- **Podcesty a komponenty:**
  - `/pece` -> `CareMainDashboard.tsx`
  - `/pece/plany/:id` -> `CarePlanDetailPage.tsx`
  - `/pece/kalendar` -> `CareCalendarPage.tsx`
  - `/pece/simulator` -> `CareSimulatorPage.tsx`
  - `/pece/porovnani` -> `CareComparisonPage.tsx`
  - `/pece/prazdniny` -> `CareHolidaysPage.tsx`
  - `/pece/mista` -> `CareLocationsPage.tsx`
  - `/pece/statistiky` -> `CareStatisticsPage.tsx`
  - `/pece/historie` -> `CareHistoryPage.tsx`
  - `/pece/jak-se-pocita` -> `CareHowItCalculatesPage.tsx`
- **Ošetření stavů:**
  - 503 Databáze nedostupná: Zobrazuje dedikovaný panel s tlačítkem "Zkusit znovu" (`RotateCcw`).
  - 401 Neautorizováno: Přesměrovává na `/login`.
  - Načítání: Standardní animovaný indikátor.

---

### 2.3 `/coparent` a `/portal/coparent`
- **Stav:** **PARTIAL / ZJIŠTĚNY CHYBY AUTENTIZACE**
- **Soubory:**
  - `src/pages/CoParentHubPage.tsx` (Veřejná prezentace modulu) -> **OK**
  - `src/pages/portal/CoParentPage.tsx` (Privátní modul sdíleného rodičovství) -> **CHYBA AUTENTIZACE**
  - `src/components/coparent/JudgmentImportModal.tsx` -> **CHYBA AUTENTIZACE**
  - `src/components/coparent/InviteModal.tsx` -> **CHYBA AUTENTIZACE**
  - `src/components/coparent/AuditPrintView.tsx` -> **OK**
- **Nalezená bezpečnostní a funkční vada (Dummy JWT Token):**
  V souborech:
  - `src/pages/portal/CoParentPage.tsx` (řádky 56, 86, 131, 145, 165, 190, 211, 230, 257, 276, 297, 322, 342, 361)
  - `src/components/coparent/JudgmentImportModal.tsx` (řádky 82, 112)
  - `src/components/coparent/InviteModal.tsx` (řádek 53)
  
  dochází k odesílání požadavků s hlavičkou:
  ```ts
  'Authorization': `Bearer jwt_token_user_${Date.now()}`
  ```
  **Důsledek:**
  - Backendové middleware `requireAuth` / `parseAuthToken` ověřuje podpis JWT (`jwt.verify`). Falešný token `jwt_token_user_...` neprojde ověřením.
  - Pokud prohlížeč nemá platnou HttpOnly cookie `token`, požadavky skončí chybou HTTP 401 Unauthorized.
  - Porušuje zásadu P0 Security First (žádné mock/dummy autorizační tokeny v kódu).
  - V další fázi je nutné nahradit tyto volání čtením reálného tokenu (`localStorage.getItem('tatovacesta_auth_token')`) nebo standardním `apiFetch` s automatickým předáváním přihlašovací relace.

---

### 2.4 Testy a verifikace
1. **TypeScript Kontrola (`tsc --noEmit`):**
   - Výsledek: **0 chyb** (PASS).
2. **Kompilace / Build (`compile_applet` / `vite build`):**
   - Výsledek: **Succeeded** (PASS).
3. **Automatické testy (`scripts/test-runner.js`):**
   - Spuštěno 24 testovacích sad pokrývajících PWA, bezpečnostní disclaimery, RBAC, šifrování v IndexedDB (Phase 18B), Passkey (Phase 19), AI fallback a stavovou správu.
   - Výsledek: **24/24 PASS**.
4. **Unit test kalkulačky výživného (`tests/alimonyCalculator.test.ts`):**
   - Výsledek: **PASS** (doporučeno zařadit do `scripts/test-runner.js` v navazující fázi).

---

## 3. Seznam nalezených chyb k nápravě (Backlog pro opravnou fázi)

1. **[BUG-01 - Routing]** Odstranit `'kalkulacka-vyzivneho'` z hromadné podmínky pro `AiSimulatorView` v `src/components/public/PublicPortal.tsx` (řádek 363), aby se správně vykreslila `AlimonyCalculatorPage`.
2. **[BUG-02 - Auth / Security]** Odstranit všechny výskyty hardcoded dummy tokenu `jwt_token_user_${Date.now()}` v `src/pages/portal/CoParentPage.tsx`, `src/components/coparent/JudgmentImportModal.tsx` a `src/components/coparent/InviteModal.tsx` a nahradit je standardním načítáním reálného autentizačního tokenu / session.
3. **[IMPROVEMENT-03 - Test Runner]** Zaregistrovat `tests/alimonyCalculator.test.ts` do hlavního seznamu testů v `scripts/test-runner.js`.

---

## 4. Stav repozitáře a Git

- **Git Repozitář:** V sandbox kontejneru AI Studio není přítomen lokální `.git` strom (`fatal: not a git repository`).
- **Změny v kódu:** Žádné zdrojové soubory aplikace nebyly v rámci tohoto auditu modifikovány (v souladu s příkazem "NEIMPLEMENTUJ OPRAVY").
- **Vytvořený auditní soubor:** `docs/audit/PHASE_9_POST_IMPLEMENTATION_ERROR_AUDIT_2026-08-28.md`

---
*Konec auditu Fáze 9. Systém je připraven pro další instrukce.*
