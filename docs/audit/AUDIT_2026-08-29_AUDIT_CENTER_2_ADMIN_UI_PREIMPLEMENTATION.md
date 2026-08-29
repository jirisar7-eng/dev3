# READ-ONLY PRE-IMPLEMENTATION AUDIT – FÁZE 4: AUDIT CENTER 2.0 ADMIN UI

**Datum a čas:** 2026-08-29 15:20 UTC  
**Projekt:** Táta má právo (dev3)  
**Repozitář:** `jirisar7-eng/dev3`  
**Větev:** `feat/audit-center-2-registry`  
**Režim:** READ-ONLY PRE-IMPLEMENTATION AUDIT (Žádné změny v kódu, žádný commit, žádný push, žádný merge)

---

## 1. Cíl Auditu a Kontext
Cílem tohoto auditu je provést detailní inspekci stávajícího stavu administrátorského rozhraní (Admin UI), zmapovat existující komponenty související s audity, control plane a QA, a připravit přesný, bezpečný a modulární architektonický návrh pro implementaci **Audit Center 2.0 Admin UI** bez vytváření paralelních duplicitních komponent či matoucích navigací.

---

## 2. Analýza Existujícího Stavuv UI a Komponent

### 2.1 Mapování Existujících Komponent
| Komponenta | Umístění souboru | Účel a aktuální stav | Vazba v navigaci |
| :--- | :--- | :--- | :--- |
| `AuditCenter.tsx` | `/src/components/admin/AuditCenter.tsx` | **Aktivní / Funkční.** Zobrazuje seznam Markdown auditů z `docs/audit/`, statistiky, fulltext vyhledávání, filtry (kategorie, status), modal s Markdown/Raw náhledem, sdílení veřejným odkazem s expirací, tisk/PDF náhled, stažení MD a tlačítko synchronizace (`/api/admin/audits/sync`). **Chybí zde prvky Audit Center 2.0 (Health semafory, Release Gate, Findings registr, Orion AI bridge).** | `/administrace/audity` (sekce Observability & Audit, tab `audits`) |
| `AuditLogViewer.tsx` | `/src/components/admin/AuditLogViewer.tsx` | **Aktivní / Provozní DB.** Zobrazuje provozní bezpečnostní logy z tabulky `audit_logs` v PostgreSQL (události, přihlášení, IP adresy, změny). | `/administrace/audit-log` (sekce Observability & Audit, tab `audit`) |
| `SynthesisProjectControlCenter.tsx` | `/src/components/admin/control-center/SynthesisProjectControlCenter.tsx` | **Aktivní / Prototyp Fáze 4.** Centrální bod pro řízení životního cyklu akcí (Intent → Risk → Plan → Backup → Execution). Obsahuje taby: Dashboard, Command Center (Copilot Dry Run), Approvals (Queue), History. | `/admin/control-center` (sekce Control Center, tab `synthesis-control-center`) |
| `QADashboard.tsx` | `/src/components/admin/qa/QADashboard.tsx` | **Aktivní / QA Pipeline.** 10-krokový automatizovaný QA pipeline orchestrátor, inkrementální QA, Discovery komponent, správa QA test runů a telemetrie. | `/administrace/qa` (sekce Synthesis AI & QA Center, tab `qa`) |
| `ContentProjectCenter.tsx` | `/src/components/admin/ContentProjectCenter.tsx` | Správa stavu obsahu, Puck stránek a roadmapy. | `/admin/project-control` (sekce Obsah & CMS, tab `project-control`) |

### 2.2 Zhodnocení: Zamezení Duplicitám (No-Duplicate Mandate)
- **Klíčové zjištění:** V navigaci i v `AdminDashboard.tsx` již existuje jasně vymezené místo pro vývojové/architektonické audity: **`AuditCenter.tsx`** na routě `/administrace/audity` (tab `audits`).
- **Rozhodnutí:** Audit Center 2.0 **nesmí** vzniknout jako nová paralelní komponenta (`AuditCenter2.tsx`) ani jako nová nesouvisející routa. Všechny funkce Audit Center 2.0 budou implementovány jako přirozené, modulární rozšíření existující komponenty `AuditCenter.tsx` a jejích specializovaných subkomponent ve složce `/src/components/admin/audit/`.

---

## 3. Návrh Architektury a UI Prvků Audit Center 2.0

Komponenta `AuditCenter.tsx` bude rozšířena o strukturované taby / pohledy:

### 3.1 Přehled a Semafory Zdraví Projektu (Project Health & Release Gate)
1. **Release Gate Status Card (Hlavní autoritativní banner):**
   - Zobrazuje velký, barevně kódovaný verdikt vypočtený na backendu:
     - `READY_TO_MERGE` (Zelená – Všechny povinné pilíře a P0/P1 nálezy jsou čisté).
     - `DO_NOT_MERGE` (Červená – Blokující selhání, nevyřešené P0/P1, nefunkční migrace či testy).
     - `UNKNOWN` (Šedá/Žlutá – Nedostatek dat nebo probíhající vyhodnocení).
   - Zobrazuje seznam blokujících důvodů (`blockingReasons`) a varování (`warnings`).
   - Tlačítko pro okamžité přehodnocení (`Re-evaluate Release Gate`).
2. **Project Health Semafory (5 klíčových pilířů):**
   - **Database & Migrations:** Stav Prisma schématu, migrací a DB integrity.
   - **Security & RBAC:** Stav autorizace, secrets inspekce, 0-PII telemetrie a fail-closed pravidel.
   - **Control Plane:** Stav audit registry, snapshot mechanismu a schvalovací fronty.
   - **Test Suite & Build:** Stav unit/integračních testů a produkčního buildu.
   - **AI Subsystem:** Stav Orion bezpečnostních mantinelů a telemetrie modelů.
   - Každý semafor zobrazuje stav: `HEALTHY` (zelená), `DEGRADED` (oranžová), `CRITICAL` (červená), `UNKNOWN` (šedá).

### 3.2 Registr Zjištění a Regresí (Findings & Regressions)
1. **Souhrn závažností (Severity Counters):**
   - P0 (CRITICAL) – Okamžitý blokátor releasu.
   - P1 (HIGH) – Vysoké bezpečnostní / funkční riziko.
   - P2 (MEDIUM) – Střední architektonický / výkonnostní dluh.
   - P3 (LOW) – Drobná doporučení a kosmetické úpravy.
2. **Detektor Regresí (Active Regressions Alert):**
   - Zobrazuje nálezy, které dříve prošly (`PASS`), ale v novějších auditech selhaly (`FAIL`).
3. **Filtrovatelná Tabulka Nálezů:**
   - Filtry: Závažnost (ALL, P0, P1, P2, P3), Kategorie (SECURITY, DATABASE, CONTROL_PLANE, BUILD_TEST, GENERAL), Status (OPEN, RESOLVED, SUPPRESSED), Fulltextové vyhledávání.
   - Každý řádek obsahuje: Kód nálezu, Závažnost, Zprávu, Zdrojový audit, Odhadovaný dopad a tlačítka:
     - **Detail:** Otevře modal s plným kontextem.
     - **Analyzovat Orionem:** Předvyplní dotaz do Orion AI panelu.
     - **Navrhnout akci:** Otevře dialog pro vytvoření návrhu DRAFT akce do Control Plane.

### 3.3 Orion AI Security Analyst Bridge UI
1. **Identita a mantinely:**
   - Zřetelně označen jako `agent-orion-qa-v1` (AI_SECURITY_ANALYST).
   - Zobrazení bezpečnostního štítku: *„Orion je pouze analytická entita. Nemá právo provádět mutace, schvalovat akce ani měnit verdikt Release Gate.“*
2. **Interaktivní rozhraní:**
   - **Scope Selector:** Výběr rozsahu analýzy (`REGISTRY`, `FINDING`, `REGRESSION`, `HEALTH`, `GENERAL`).
   - **Dotazovací formulář:** Uživatelský dotaz / zadání analýzy se sanitizací a limitem znaků.
   - **Výstup analýzy:**
     - Závažnost a souhrn doporučení.
     - Analyzované nálezy a rizika.
     - Doporučený postup řešení (Rationale & Action Plan).
     - Informace o použitém modelu, tokenech a latenci.
3. **Návrh akce (Propose DRAFT Action):**
   - Formulář pro sestavení návrhu akce (`title`, `intent`, `targetResource`, `findingReference`).
   - Tlačítko **„Vytvořit návrh akce (DRAFT)“** – odesílá požadavek na `/api/admin/audits/orion/propose-action`.
   - Explicitně **bez možnosti přímého schválení nebo spuštění** (tyto akce zůstávají vyhrazeny lidskému administrátorovi v Control Center).

### 3.4 Katalog Auditních Zpráv (Existing Functionality Preserved)
- Zachování stávající funkcionality procházení Markdown reportů, synchronizace z disku, zobrazení obsahu, PDF/Tisk exportu a bezpečného sdílení.

---

## 4. Backend API Připravenost pro UI
Všechny potřebné server-side endpointy již byly v předchozích fázích implementovány, otestovány a jsou plně dostupné:

| Endpoint | Metoda | Autentizace & RBAC | Popis a výstup |
| :--- | :--- | :--- | :--- |
| `/api/admin/audits/release-gate` | `GET` | `ADMIN` / `SUPER_ADMIN` | Vrací celkový Release Gate verdikt (`READY_TO_MERGE` / `DO_NOT_MERGE` / `UNKNOWN`), metriky, blokátory, varování a stavy 5 pilířů zdraví. |
| `/api/admin/audits/findings` | `GET` | `ADMIN` / `SUPER_ADMIN` | Vrací normalizovaný registr všech nálezů, souhrn závažností (P0–P3), detekované regrese a varování parseru. |
| `/api/admin/audits/orion/analyze` | `POST` | `ADMIN` / `SUPER_ADMIN` | Spouští bezpečnou read-only AI bezpečnostní analýzu prostřednictvím Orion identity. |
| `/api/admin/audits/orion/propose-action` | `POST` | `ADMIN` / `SUPER_ADMIN` | Vytváří návrh `ControlPlaneAction` výhradně ve stavu `DRAFT`. |
| `/api/admin/audits` | `GET` | `ADMIN` / `SUPER_ADMIN` | Seznam indexovaných auditních dokumentů s filtrací a řazením. |
| `/api/admin/audits/sync` | `POST` | `ADMIN` / `SUPER_ADMIN` | Spouští re-synchronizaci auditních zpráv ze souborového systému. |
| `/api/admin/audits/:id` | `GET` | `ADMIN` / `SUPER_ADMIN` | Detail konkrétního auditního dokumentu s Markdown obsahem. |
| `/api/admin/audits/:id/share` | `POST` | `ADMIN` / `SUPER_ADMIN` | Vytvoření zabezpečeného tokenu pro sdílení auditu. |

---

## 5. Bezpečnostní a UX Mantinely (Security & UX Guardrails)
1. **Fail-Closed & RBAC:**
   - Veškeré citlivé operace vyžadují roli `ADMIN` nebo `SUPER_ADMIN`.
   - V případě výpadku backendu UI zobrazuje jasný chybový stav (HTTP 503 / 500) a nikdy nezobrazuje falešné pozitivní semafory.
2. **Žádná falešná autorita v UI:**
   - UI nikdy nepočítá Release Gate verdikt na klientovi – vždy zobrazuje autoritativní data ze serverového endpointu.
3. **Orion Safety Bridge:**
   - Orion UI komponenty mají striktně oddělenou prezentační vrstvu od řídicích akcí.
   - Vytvořené akce mají viditelný štítek `[ORION DRAFT - REQUIRES HUMAN APPROVAL]`.

---

## 6. Struktura Souborů pro Implementaci Fáze 4

Pro zachování modularity a přehlednosti budou komponenty rozděleny:
- `/src/components/admin/AuditCenter.tsx` (Hlavní kontejner a koordinátor tabů)
- `/src/components/admin/audit/ProjectHealthCard.tsx` (Semafory a Release Gate status)
- `/src/components/admin/audit/AuditFindingsList.tsx` (Tabulka nálezů, regrese a P0-P3 filtry)
- `/src/components/admin/audit/OrionAssistantPanel.tsx` (Interaktivní Orion AI bezpečnostní konzole)
- `/src/components/admin/audit/AuditDocumentsCatalog.tsx` (Katalog a prohlížeč Markdown zpráv)

---

## 7. Závěr a Připravenost k Implementaci
- **Stav:** READ-ONLY AUDIT DOKONČEN.
- **Backend připravenost:** 100% (Endpointy pro Release Gate, Findings, Regrese i Orion jsou otestované a plně funkční).
- **Frontend plán:** 100% (Struktura, subkomponenty a prevence duplicit jsou detailně navrženy).
- **Rizika:** Nízká. Žádné breaking changes pro existující funkce prohlížení auditů.
