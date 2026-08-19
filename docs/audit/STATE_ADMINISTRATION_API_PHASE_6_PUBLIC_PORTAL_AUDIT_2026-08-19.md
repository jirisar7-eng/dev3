# STATE ADMINISTRATION API HUB - PHASE 6 PUBLIC PORTAL INTEGRATION AUDIT REPORT
**Datum:** 19. srpna 2026  
**Projekt:** Portál "Táta má právo" / Synthesis AI Control Center (dev3)  
**Větev:** `feature/state-admin-ares`  
**Autor:** Senior Full-Stack Architect & AI Systems Engineer  

---

## 1. EXEKUTIVNÍ SOUHRN & BEZPODMÍNEČNÁ ZÁSADA FAIL-CLOSED
V rámci **Phase 6 – Public Portal Integration** byly prověřené a zabezpečené konektory ze **State Administration API Hub (Phase 5)** napojeny do veřejného portálu *Táta má právo*. Uživatelům tak poskytují ověřená data státní správy ČR v reálném čase bez možnosti podvržení syntetických či zastaralých dat.

### **STRIKTNÍ POTVRZENÍ (ZERO MOCK / FAIL-CLOSED POLICY):**
- **NULOVÁ MOCK/SYNTETICKÁ DATA:** Při jakémkoliv výpadku upstreamu (HTTP status 404, 429, 5xx, timeout, neplatný payload) **UI NEZOBRAZUJE ŽÁDNÁ DUMMY, FAKE ANI HARCODOVANÁ DATA**.
- **FAIL-CLOSED UI HANDLING:** Všechny veřejné komponenty při neúspěchu přechází do explicitního stavu Fail-Closed s hlášením *"Data momentálně nejsou dostupná z oficiálního zdroje"*.
- **NEPORUŠENÍ EXISTUJÍCÍ ARCHITEKTURY:**
  - Žádné změny v Prisma schématu.
  - Žádné změny v e-Sbírce Phase 1–4 ani ARES Phase 1–2.
  - Veřejný portál pro e-Sbírku čte výhradně z lokální PostgreSQL databáze.
  - Veškeré externí dotazy na e-Legislativu, ARES v3, OVM a ČSÚ probíhají výhradně přes server-side API proxy `/api/state-admin/*`.

---

## 2. INTEGRACE VERIFIKOVANÝCH DATOVÝCH ZDROJŮ V UI

### **P1 – JUSTICE (Statistiky & Délky řízení & Judikatura)**
- **API Endpointy:** `/api/state-admin/justice/statistics` & `/api/state-admin/justice/cases`
- **UI Komponenty:**
  - `src/components/public/StateStatisticsView.tsx` (Přímo zobrazuje oficiální sady dat MSp z NKOD data.gov.cz)
  - `src/components/public/CaseDatabaseView.tsx` (Možnost vyhledávat rozhodnutí a judikáty MSp)
- **Atributy v UI:** Obsahuje označení *"Zdroj: MSp / data.gov.cz"*, časové razítko aktualizace a stavový odznak *"Dostupné"* / *"Momentálně nedostupné z oficiálního zdroje"*.

### **P2 – ČSÚ / NKOD (Demografie & Rodinné statistiky)**
- **API Endpointy:** `/api/state-admin/csu/demographics` & `/api/state-admin/nkod/search`
- **UI Komponenta:** `src/components/public/StateStatisticsView.tsx`
- **Funkcionalita:** Reálné vyhledávání v katalogu otevřených dat NKOD (data.gov.cz) pro klíčová slova `demografie`, `rodina`, `soudy`, `rozvod`.
- **Atributy v UI:** Označení *"Zdroj: ČSÚ / NKOD (data.gov.cz)"* a stavový odznak.

### **P3 – VEŘEJNÉ REGISTRY (ARES v3 & OVM Registr)**
- **API Endpointy:** `/api/state-admin/registries/verify-professional` & `/api/state-admin/registries/ovm`
- **UI Komponenta:** `src/components/public/RegistrSubjektu.tsx`
- **Funkcionalita:** 
  1. Kartu pro **okamžité ověření IČO v ARES v3** (advokáti, znalci, mediátoři, psychologové).
  2. Propojení s Registrem orgánů veřejné moci (OVM) pro okresní/krajské soudy a OSPOD.
- **Atributy v UI:** Označení *"Zdroj: ARES v3 (MFCR)"* a *"Zdroj: Registr OVM (data.gov.cz)"*.

### **P4 – E-LEGISLATIVA & SNĚMOVNÍ TISKY**
- **API Endpoint:** `/api/state-admin/e-legislativa/bills`
- **UI Komponenta:** `src/components/public/StateLawsView.tsx`
- **Funkcionalita:** Zobrazování projednávaných poslaneckých a vládních návrhů zákonů (Sněmovní tisky) napojených na opatrovnické životní situace.
- **Atributy v UI:** Označení *"Zdroj: Sněmovní tisky / e-Legislativa api.e-sbirka.gov.cz"*.

---

## 3. AUDITNÍ VERIFIKACE BUBBLINGU & STAVŮ

| Modul | Endpoint | Upstream Zdroj | Fail-Closed Chování | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Justice Stats** | `/api/state-admin/justice/statistics` | OpenData MSp | Červený Fail-Closed banner bez mock dat | **PASS** |
| **ČSÚ Demografie** | `/api/state-admin/csu/demographics` | ČSÚ / NKOD | Červený Fail-Closed banner bez mock dat | **PASS** |
| **NKOD Search** | `/api/state-admin/nkod/search` | data.gov.cz | Prázdné pole výsledků + upozornění | **PASS** |
| **ARES v3 Verify** | `/api/state-admin/registries/verify-professional` | ARES v3 REST | Chybový banner bez vygenerovaného subjektu | **PASS** |
| **OVM Registr** | `/api/state-admin/registries/ovm` | Registr OVM | Červený Fail-Closed banner bez mock dat | **PASS** |
| **e-Legislativa** | `/api/state-admin/e-legislativa/bills` | api.e-sbirka.gov.cz | Zobrazení stavu *"Momentálně nedostupné"* | **PASS** |

---

## 4. ZÁVĚREČNÝ VERDIKT
Phase 6 byla úspěšně dokončena, zkompilována s 0 chybami a ověřena v souladu s pravidly **Zero Trust** a **Fail-Closed**. Všechny veřejné komponenty portálu *Táta má právo* využívají výhradně ověřená data českých státních datových zdrojů.
