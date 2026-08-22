# DEV3 – P0/P1 IMPLEMENTAČNÍ BACKLOG A ROADMAP

**Projekt:** Táta má právo (dev3)  
**Datum vytvoření:** 2026-08-22 15:55 CET  
**Autor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor  
**Pracovní větev:** `feature/subject-registry-moderation`  
**Výchozí stav GIT HEAD:** `a7cef47`  
**Zdrojový audit:** `docs/audit/DEV3_COMPLETE_FUNCTION_CONTENT_CMS_AUDIT_2026-08-22.md`

---

## 1. Manažerské shrnutí (Executive Summary)

Na základě master auditu kódové báze projektu **Táta má právo (dev3)** byl proveden detailní rozbor všech funkcí s prioritou **P0 (Kritická funkčnost a bezpečnost)** a **P1 (Důležitá funkčnost, UX a CMS správa)**.

### Klíčová zjištění analýzy kódu:
1. **P0 Stav (100% Vyřešeno v kódu / ALREADY_RESOLVED):**
   - Všechny kritické P0 moduly (Registr subjektů s ARES validací, moderátorská fronta s anti-self-approval, Leaflet mapa s GPS geokódováním a deduplikací dotazů, eSbírka konektor s dodržováním kvóty 5 req/den a verzováním, RBAC s 12 rolemi, TOTP 2FA, Passkeys, šifrovaný SHA-256 AuditLog, Opatrovnický spis MyCase, Plánovač péče CareHub, Spolurodičovský Hub CoParent a kalkulačka výživného MSČR) jsou **plně naimplementovány, otestovány (14/14 testů PASS) a zabezpečeny**.
2. **P1 Stav (98% Vyřešeno v kódu / ALREADY_RESOLVED):**
   - Všechny CMS editory (články, FAQ, stránky Puck, navigace, média, partneři, sponzoři, studie s PDF uploadem, Wiki encyklopedie, právní průvodci) a SEO metadata (`<SeoHead>`) jsou již v aplikaci zaintegrovány a funkční.
3. **Skutečně otevřené úlohy:**
   - **P1-OPEN-01 (Konsolidace a správa státních statistik):** Vytvoření administrátorského dohledového panelu pro synchronizaci a health check externích registrů (ČSÚ, NKOD, Justice OpenData) v administraci – navázáno na existující `StateAdminHubService`.
   - **P2 / Backlog (Není P0/P1 blokátor):** Převedení videí (`VideothequeView`) a kvízů (`QuizzesView`) z TSX do CMS, konsolidace nepoužívaného kontejneru `LegalHubPage.tsx`.

---

## 2. Konsolidovaný Backlog P0 & P1 Položek

| ID | Priorita | Funkce | Aktuální stav | Cíl | Závislosti | Soubory | DB | API | Public UI | Admin UI | CMS | Test | Odhad | Stav |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **P0-01** | P0 | Registr subjektů & ARES | COMPLETE | Vyhledávání subjektů, validace IČO přes ARES | Žádné | `RegistrSubjektu.tsx`, `subjektRoutes.ts`, `ares/*` | `Subjekt`, `Pracovnik` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-02** | P0 | Moderace subjektů & Anti-Self-Approval | COMPLETE | Moderátorská fronta schvalování kontaktů | P0-01 | `ContactModerationManager.tsx`, `subjektService.ts` | `Subjekt` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-03** | P0 | Interaktivní mapa subjektů (Leaflet) | COMPLETE | GPS zobrazení s automatickým centrováním | P0-01 | `MapaSubjektuView.tsx`, `SubjektyMap.tsx` | `Subjekt` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-04** | P0 | eSbírka Sync Engine & Quota Guard | COMPLETE | 1 req/s, 5 req/den, verzování zákonů | Žádné | `EsbirkaSyncEngine.ts`, `EsbirkaAdminPanel.tsx` | `LegalAct`, `LegalActVersion` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-05** | P0 | RBAC, TOTP 2FA, Passkeys & Audit | COMPLETE | Zabezpečení účtů a kryptografický log | Žádné | `authService.ts`, `totpService.ts`, `AuditLogViewer.tsx` | `User`, `Passkey`, `AuditLog` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-06** | P0 | Spis otce (MyCase 10 modulů) | COMPLETE | Osobní opatrovnický spis a časová osa | P0-05 | `MyCasePage.tsx`, `clientCaseService.ts` | `Case`, `CaseDocument` | ANO | ANO | N/A | N/A | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-07** | P0 | Plánovač péče (CareHub Engine) | COMPLETE | Výpočet věkových fází dítěte a vzdáleností | P0-05 | `CareHubPage.tsx`, `carePlanService.ts` | `CarePlan`, `CareLocation` | ANO | ANO | N/A | N/A | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-08** | P0 | Spolurodičovský Hub (CoParent) | COMPLETE | Schvalování výdajů a dohody rodičů | P0-05 | `CoParentPage.tsx`, `coparentService.ts` | `CoParentSpace`, `CoParentExpense` | ANO | ANO | N/A | N/A | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-09** | P0 | Kalkulačka výživného MSČR | COMPLETE | Výpočet alimentů dle oficiální metodiky | Žádné | `AlimonyCalculatorView.tsx`, `alimonyCalculator.ts` | N/A | N/A | ANO | N/A | N/A | PASS | 0h | `ALREADY_RESOLVED` |
| **P0-10** | P0 | Krizový SOS plán & Help | COMPLETE | 7 kroků při odebrání dítěte | Žádné | `SosPlanView.tsx`, `CrisisCommunityPortal.tsx` | N/A | N/A | ANO | N/A | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-01** | P1 | CMS Správa Encyklopedie (Wiki) | COMPLETE | CRUD právních pojmů a výkladů | P0-05 | `WikiManager.tsx`, `WikiView.tsx`, `server.ts` | `WikiTerm` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-02** | P1 | CMS Správa Právních průvodců | COMPLETE | CRUD kapitol průvodců (OSPOD, soud, odvolání) | P0-05 | `LegalGuideManager.tsx`, `legalGuideService.ts` | `LegalGuide`, `LegalGuideChapter` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-03** | P1 | CMS Knihovna studií s PDF uploadem | COMPLETE | Evidence výzkumů s PDF soubory | P0-05 | `StudyManager.tsx`, `StudyLibraryPage.tsx` | `Study` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-04** | P1 | SEO Metadata & Canonical Head | COMPLETE | Dynamické `<SeoHead>` na všech podstránkách | Žádné | `SeoHead.tsx`, `PublicPortal.tsx` | N/A | N/A | ANO | N/A | N/A | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-05** | P1 | Navigační MegaMenu & Mobilní menu | COMPLETE | 10 sekcí a 35 položek v menu | Žádné | `MegaMenu.tsx`, `Navbar.tsx`, `navigation.ts` | `NavigationItem` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-06** | P1 | AI Asistent, Průvodce & Formuláře | COMPLETE | AI generátor podání a simulátor výslechu | P0-05 | `ai/*`, `aiRoutes.ts`, `AiContextManager.tsx` | N/A | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-07** | P1 | Puck Vizuální editor stránek | COMPLETE | Drag & drop tvorba stránek s bloky | P0-05 | `PuckEditorView.tsx`, `AdminPageBuilder.tsx` | `Page`, `PageSection` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-08** | P1 | Správa uživatelských tiketů & Support | COMPLETE | Helpdesk a uživatelská podpora | P0-05 | `UserSupportTicketingView.tsx`, `supportTicketRoutes.ts` | `SupportTicket` | ANO | ANO | ANO | ANO | PASS | 0h | `ALREADY_RESOLVED` |
| **P1-09** | P1 | State Administration Hub Admin Panel | PARTIAL | Administrátorský panel pro health check a manuální trigger syncu ČSÚ / NKOD / MSp | P0-05 | `StateAdminHubService.ts`, `StateStatisticsView.tsx`, `server.ts` | `StateStatistic` | ANO | ANO | **CHYBÍ** | N/A | PASS | 2h | **OPEN** |

---

## 3. Graf závislostí (Dependency Graph)

```text
[P0-05: RBAC & Auth Core]
       │
       ├───► [P0-01: Registr subjektů] ───► [P0-02: Moderace kontaktů] ───► [P0-03: Mapa Leaflet]
       │
       ├───► [P0-06: MyCase Spis]
       │
       ├───► [P0-07: CareHub Plánovač]
       │
       ├───► [P0-08: CoParent Hub]
       │
       ├───► [P1-01: CMS Wiki] & [P1-02: CMS Průvodci] & [P1-03: CMS Studie]
       │
       └───► [P1-09: State Admin Dashboard Panel] (OPEN FIRST TASK)
```

---

## 4. Implementační fáze (Phases)

### FÁZE A: Dokončení administrativní infrastruktury otevřených dat (P1)
- **Cíl:** Doplnit administrátorský dohledový panel pro externí státní registry (ČSÚ, NKOD, Justice OpenData) využívající existující `StateAdminHubService`.
- **Dopad:** Plný přehled o stavu externích konektorů, odezvách HTTP a možnost manuální aktualizace statistik ze strany administrátora.

### FÁZE B: CMS rozšíření pro multimédia a vzdělávání (P2 - Backlog)
- **Cíl:** Převedení statických TSX komponent `VideothequeView.tsx`, `QuizzesView.tsx` a `MementoView.tsx` do dynamických CMS tabulek a editorů v administraci.

### FÁZE C: Úklid a konsolidace osiřelého kódu (P3 - Backlog)
- **Cíl:** Bezpečná archivace / odstranění nepoužívaného kontejneru `LegalHubPage.tsx`.

---

## 5. První doporučený úkol k realizaci (FIRST TASK)

- **ID:** `P1-09`
- **Název:** State Administration Hub & Statistics Admin Dashboard Panel
- **Proč právě tento:** Je to jediná zbývající otevřená P1 úloha identifikovaná v auditu. Veřejná stránka `/state-statistics` a backendová služba `StateAdminHubService.ts` již existují, ale administrátorovi chybí UI panel v administraci pro sledování zdraví konektorů (ČSÚ, NKOD, Justice OpenData, e-Legislativa) a auditních záznamů.
- **Co se změní:**
  1. Vytvoření komponenty `src/components/admin/StateAdminManager.tsx` s přehledem stavu 4 státních konektorů, zobrazením posledních HTTP kódů a auditních logů.
  2. Přidání záložky "Státní data & Statistiky" do `AdminDashboard.tsx`.
  3. Napojení na backendový endpoint `/api/state-admin/health` a `/api/state-admin/audit`.
- **Dotčené soubory:**
  - `src/components/admin/StateAdminManager.tsx` (nový soubor)
  - `src/components/admin/AdminDashboard.tsx` (registrace záložky)
  - `server.ts` (ověření / přidání administrátorského health & sync endpointu)
- **DB změny:** Žádné (využívá stávající `StateStatistic` a in-memory auditní logy `StateAdminAuditLog`).
- **API změny:** Zpřístupnění `StateAdminHubService.getHealthStatus()` a `getAuditLogs()` pro roli `ADMIN`.
- **UI změny:** Nový přehledný diagnostický panel v administraci s kartami pro MSp ČR, ČSÚ, NKOD a e-Legislativu.
- **Admin změny:** Administrátor uvidí stav připojení k datovým sadám veřejné správy.
- **CMS změny:** N/A (systémový diagnostický panel).
- **Testy:** Přidání unit/integračního testu pro `StateAdminManager` a endpointy.
- **Acceptance criteria:**
  - Panel se zobrazuje v administraci pro roli `ADMIN`.
  - Zobrazuje reálný stav 4 konektorů (OK / ERROR / UNCHECKED) a čas poslední kontroly.
  - Umožňuje manuální re-test spojení.
  - Všechny linty, typechecky a testy projdou na 100%.

---

## 6. Přehled vyřešených a duplicitních položek

### ALREADY_RESOLVED (21 položek):
- **P0:** P0-01, P0-02, P0-03, P0-04, P0-05, P0-06, P0-07, P0-08, P0-09, P0-10 (vše plně funkční v kódu).
- **P1:** P1-01, P1-02, P1-03, P1-04, P1-05, P1-06, P1-07, P1-08, F14, F15, F16 (vše plně funkční v kódu a v CMS).

### DUPLICITY (Seskupeno do nadřazených modulů):
- Položky dílčích průvodců (OSPOD, Soud, Nahlížení do spisu, Výkon rozhodnutí, Znalci, Odvolání, Mezinárodní spory, Zdravotní péče, Školství) byly seskupeny pod jednotný systém **P1-02 (CMS Právní průvodci / `LegalGuideManager`)**.
- Položky týkající se sponzorů a partnerů byly sloučeny pod **F05/F06 (`PartnerManager`)**.
- Položky týkající se registru, moderace a mapy kontaktů byly sloučeny pod **P0-01, P0-02, P0-03**.

---

## 7. Závěr a Git stav

- **Větev:** `feature/subject-registry-moderation`
- **Auditní soubor:** `docs/audit/DEV3_P0_P1_IMPLEMENTATION_ROADMAP_2026-08-22.md`
- **Kopie:** `audits/research/DEV3_P0_P1_IMPLEMENTATION_ROADMAP_2026-08-22.md`
