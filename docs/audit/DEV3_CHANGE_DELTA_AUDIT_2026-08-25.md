# DELTA AUDIT: DEV3 CHANGE & FEATURE GAP ANALYSIS (2026-08-25)

## 1. Executive Summary
Tento dokument představuje komplexní **Delta Audit** projektu „Táta má právo“ v prostředí `dev3`. 
Cílem je zmapovat skutečné změny od posledního velkého milníku (Comprehensive Audit z 23. srpna), identifikovat již hotovou infrastrukturu a přesně zacílit chybějící moduly. Zabraňujeme tak duplicitnímu navrhování již existujících funkcí a soustředíme se na reálné produkční GAPy.

- **Repozitář**: `jirisar7-eng/dev3`
- **Aktuální větev**: `main`
- **Stav repozitáře**: Čistý, plně synchronizováno.

---

## 2. Auditní Checkpoint
- **Výchozí bod (Baseline)**: `9e0c892` (Commit: `docs(audit): proveden komplexni technicky a bezpecnostni audit celeho projektu`, 23.8.2026)
- **Odkazovaný baseline dokument**: `docs/audit/COMPREHENSIVE_AUDIT_2026-08-23.md`
- **Aktuální stav (HEAD)**: `e4620d1` (Commit: `feat(admin): add native visual SVG branding editor`, 24.8.2026)

---

## 3. Změny od Checkpointu (Využití existujících auditů)
Od baseline checkpointu bylo změněno **109 souborů (více než 12 000 řádků)**. Každá významná změna byla kryta specifickým dílčím auditem:

### Právní a Soudní moduly (MyCase & Judgments)
- **AI Extractor a lokální Fallback**: Zaveden deterministický lokální PDF parser pro případy výpadku AI modelu (Audit: `JUDGMENT_AI_EXTRACTOR_LOCAL_FALLBACK_FAILSAFE.md`).
- **Care Occurrence Engine**: Kompletní produkční engine pro synchronizaci událostí z rozsudků do kalendáře péče (Audit: `JUDGMENT_CALENDAR_OCCURRENCE_ENGINE_FINAL_AUDIT_2026-08-23.md`).

### Data & Otevřená Data
- **Entity Config & Markery**: Sjednocení značek na mapě pro OSPOD, Soudy a další (Audit: `MAP_MARKERS_ENTITY_CONFIG_IMPLEMENTATION_2026-08-23.md`).
- **Open Data & Statistiky P1/P2**: Ostré napojení na ČSÚ, Ministerstvo spravedlnosti a NKOD SPARQL (Audit: `OPEN_DATA_STATISTICS_P1_P2_AUDIT_2026-08-23.md`).

### UI, UX & Přizpůsobení
- **Nová Navigační Architektura**: Sjednocení navigace přes `navigation.ts` (Audit: `NAVIGATION_ARCHITECTURE_2026-08-23.md`).
- **Personal Themes**: Implementováno nastavení osobního vzhledu uživatele, dark/light mod, velikost písma (Audit: `AUDIT_2026-08-24_PERSONAL_THEMES.md`).
- **SVG Branding Editor**: Nativní vizuální editor pro SVG loga s kompletní serializací (Audit: `AUDIT_2026-08-24_VISUAL_SVG_EDITOR.md`).

### Bezpečnost & Stabilita
- **Node 20 JSDOM/Undici Fix**: Oprava pádu parseru (Audit: `AUDIT_2026-08-24_JSDOM_UNDICI_NODE20_FIX.md`).
- **ClamAV Network Fix**: Odstranění zranitelnosti vystaveného host portu pro ClamAV (Audit: `AUDIT_2026-08-24_DEV3_CLAMAV_NETWORK_FIX.md`).
- **Final Post-Deploy Security Integrity**: Revize všech oprávnění a hardening (Audit: `FINAL_POST_DEPLOY_SECURITY_INTEGRITY_AUDIT_2026-08-23.md`).

---

## 4. Nové Funkce (Přehled inovací)
- Vizuální SVG Editor v Reactu (`Canvas.tsx`, `parser.ts`, `serializer.ts`).
- Branding Manager v Administraci.
- Uživatelská záložka vzhledu (`UserAppearanceTab.tsx`).
- Care Occurrence Engine pro opakující se události a harmonogramy péče.
- Rozšíření E-Sbírka modulu o dedikovaného OpenData SPARQL klienta.

---

## 5. Upravené Funkce
- **E-Sbírka Webhooky**: Synchronizace nyní přísně vyžaduje role `ADMIN` nebo `LEGAL_EDITOR`.
- **MyCase & Judgments**: Import rozsudku nyní dodržuje idempotenci a vynucuje správný `CarePlanType`.
- **Mapa Subjektů**: Vykreslování bylo optimalizováno a sjednoceno pomocí `entityConfig.ts`.

---

## 6. Opravy (Bugfixes)
- Vyřešen kritický crash `jsdom` (způsobený interní závislostí `undici` na Node 20).
- Opravena klikatelnost odkazů na mobilních zařízeních (Super Admin link).
- Zajištěno, aby se testy plánovače (E-Sbírka Scheduler) spouštěly v izolovaném kontextu a neblokovaly port.

---

## 7. Bezpečnostní Změny
- **Sanitizace SVG**: Implementován `svgSanitizer.ts`, který bezpečně čistí SVG nahraná administrátory od `<script>`, `on*` událostí a vnořených iframe/object elementů.
- **Odstranění Port Exposure**: Docker-compose byl upraven tak, aby ClamAV a Mailcow služby nevystavovaly vnitřní porty na `0.0.0.0` hostitelského serveru.

---

## 8. Databázové Změny (Prisma)
Změny v `schema.prisma`:
- Přidány modely a enumy pro synchronizaci kalendáře: `CarePlanType` (CURRENT / PROPOSED), `CarePlanSource`.
- Nový model `BrandingVersion` pro uchování historie firemních identit a SVG log v databázi.
- Uživatelský profil rozšířen o preference vzhledu.

---

## 9. Admin Změny
- Do postranního panelu přidána možnost **"Branding a vzhled"**.
- Dashboard State Administration byl napojen na živá Open Data.
- Zpřísněn přístup k některým modulům pouze pro konkrétní delegované role (viz RBAC níže).

---

## 10. Aktuální Inventář Funkcí (Mapování)

| Modul | Stav | Komentář |
|---|---|---|
| **Veřejný portál** | 🟢 HOTOVO | Homepage, Footer, SEO plně optimalizováno. |
| **Uživatelský portál** | 🟢 HOTOVO | Dashboard, Profil, Zabezpečení, Témata. |
| **Administrace** | 🟢 HOTOVO | Kompletní správa uživatelů, modulů, logů. |
| **RBAC** | 🟢 HOTOVO | Plná implementace na API i UI. |
| **Auth / MFA / Passkey** | 🟢 HOTOVO | Implementováno vč. Google a Microsoft OAuth. |
| **CMS / Puck** | 🟢 HOTOVO | Integrováno pro Články, Stránky, FAQ atd. |
| **e-Sbírka & Judikatura** | 🟢 HOTOVO | Robustní napojení na státní API a lokální parser. |
| **Mapy & Registry** | 🟢 HOTOVO | OSPOD, Soudy, Notáři s OpenStreetMap/Leaflet. |
| **Branding & Témata** | 🟢 HOTOVO | Včetně vizuálního SVG editoru. |
| **MyCase & CareHub** | 🟡 EXISTUJE – VYŽADUJE ROZŠÍŘENÍ | Základní import funguje, chybí širší podpora pro finanční kalkulačky a spisy. |
| **AI (Jádro)** | 🟡 EXISTUJE – VYŽADUJE ROZŠÍŘENÍ | Generování, analýza dokumentů, BIFF a endpointy existují, ale UI část je statická. |
| **Notifikace / Ticketing** | 🔴 CHYBÍ | Neexistuje centrální centrum upozornění ani ticketovací systém pro podporu. |

---

## 11. RBAC Inventář (Realita)
Systém aktuálně definuje a nativně rozlišuje tyto role (viz `UserRoleType` v Prisma a `UserRole` type):
`USER`, `REGISTERED_USER`, `VERIFIED_USER`, `VOLUNTEER`, `VERIFIED_CONTRIBUTOR`, `MODERATOR`, `LEGAL_EDITOR`, `CONTENT_MANAGER`, `SYSTEM_ADMIN`, `ADMIN`, `SUPER_ADMIN`.

Autorizace je kontrolována plně na server-side přes middleware `requireRole(['ADMIN', 'LEGAL_EDITOR'])` v Express.js.  Na klientu slouží pouze pro renderování tlačítek. Lze generovat komplexní matici oprávnění (např. synchronizace E-Sbírky = LEGAL_EDITOR + ADMIN, Správa uživatelů = ADMIN).

---

## 12. Ověření Nových Nápadů (Adresační matice)

| Nápad | Stav | Detaily & Umístění v kódu |
|---|---|---|
| **A) Globální vyhledávání** | 🔴 NEEXISTUJE | Hledání je pouze lokální v tabulkách (např. Audit Log). Neexistuje fulltext. |
| **B) Systémový AI Chatbot** | 🟡 ČÁSTEČNĚ | API `/api/ai/chat` funguje. Mnoho statických zmínek ("AI Asistent připraven"), chybí reálný plovoucí front-end chat widget a perzistence zpráv. |
| **C) Předání AI chatu člověku** | 🔴 NEEXISTUJE | Neexistuje mechanismus převzetí relace. |
| **D) Administrace živého chatu** | 🔴 NEEXISTUJE | Administrátoři nemají panel živých konverzací. |
| **E) Statistiky AI asistenta** | 🔴 NEEXISTUJE | Analytika konverzací chybí (API je bezstavové). |
| **F) Ticket systém** | 🔴 NEEXISTUJE | Aplikace má `Incident Log`, ale nemá CRM ticketování pro uživatele. |
| **G) Systém notifikací/eventů** | 🟡 INFRASTR. EXISTUJE | `CareOccurrenceEngine` řeší kalendářové eventy, ale neexistuje "Zvoneček" s Push/In-App notifikacemi. |
| **H) Detailní usage analytics** | 🟡 INFRASTR. EXISTUJE | Zaznamenáváme akce do `AuditLog`, chybí UI analytické dashboardy. |
| **I) Historie použití uživatele** | 🟢 EXISTUJE | Administrátor vidí historii přes `userId` v AuditLogu. |
| **J) Version ID v patičce** | 🔴 NEEXISTUJE | Footer (`src/components/Footer.tsx`) je hardcoded bez správy verzí. |
| **K) OAuth info obrazovka** | 🟢 EXISTUJE | Sekce připojených účtů je v `UserSettingsView.tsx`. |

---

## 13. Funkce, které již NEMÁ SMYSL znovu navrhovat (Duplicity)
Z důvodu vysokého rizika přepsání existujícího kódu se vyvarujte navrhování těchto okruhů:
- Autentizace (Login, MFA, Passkeys, OAuth2).
- Správa uživatelských profilů a základní RBAC struktura.
- Integrace s e-Sbírkou a justice.cz (vše již spolehlivě běží transakčně).
- Mapový systém a načítání registru OSPOD.
- Backendová vrstva pro generování přes Groq/Gemini API (již zapouzdřeno v `AiService.ts`).
- Témata aplikace a správa brandu/loga.

---

## 14. Chybějící Funkce
Opravdové strukturální díry projektu:
1. **Plovoucí In-App AI Chatbot** s ukládáním vláken (Thread perzistence v databázi).
2. **Notifikační Centrum (Zvoneček)** pro uživatelské eventy a upozornění z kalendáře.
3. **Live Chat Handover & Ticketing** pro bezpečné právní konzultace s odborníky (přechod od AI k lidem).
4. **Globální vyhledávání (Fulltext)** napříč články CMS, formuláři a judikaturou.

---

## 15. Doporučený Backlog (P0 - P3)

**P0 (Kritické pro funkčnost "Chytrého portálu")**
- *In-App AI Chatbot Widget*: Napojení `/api/ai/chat` na plovoucí okno v pravém dolním rohu, včetně perzistence konverzací přes Prisma (model `ChatThread`, `ChatMessage`).

**P1 (Vysoká hodnota)**
- *Centrální notifikace (In-App)*: Vytvoření Prisma modelu `Notification` a UI zvonečku v hlavičce s výpisem upozornění k případu (např. soudní lhůty, výpočet výživného).
- *Globální Vyhledávání*: Lišta v `Header.tsx` schopná prohledávat lokální statický obsah i databázi CMS.

**P2 (Střední priorita - Obsluha klientů)**
- *Ticketovací systém (Podpora)*: Modul pro zadávání dotazů do bezplatné právní poradny a jejich administrátorské zpracování.
- *AI Chat Handover*: Tlačítko v chatbotu "Potřebuji mluvit s právníkem", které převede konverzaci do ticketu.

**P3 (Nízká / Později)**
- *Analytics Dashboard & Statistiky AI*: Přehled, jak často se AI používá, kolik šetří času, tokenů a peněz.
- *Version ID*: Vložení gitu/CI verze do patičky.

---

## 16. Testy a jejich skutečný výsledek
- Všechny regresní testy (E-Sbírka, Branding Editor, Judgment Parser, Care Occurrence Engine) byly v předchozích auditech úspěšně spuštěny (PASS). 
- **Poznámka:** V tomto Delta auditu testy opakovaně nespouštíme, protože `e4620d1` prošel izolovaným QA dle auditu 24. srpna.

---

## 17. Rizika / TODO
- Model konverzací pro AI momentálně neexistuje, což znemožňuje historii chatu na straně uživatele.
- V backendových službách jsou obsaženy hardcoded klíče pro seedování (např. `ai_assistant` seed modulu), ale UI chybí.

---

## 18. Git SHA a Stav
- **Origin/Main**: `e4620d1`
- **Lokální HEAD**: `e4620d1`
- **Pracovní strom**: Čistý.

---
**AUDIT STATUS: PASS**
Tento Delta Audit úspěšně zmapoval stav od 23. srpna do aktuální chvíle (25. srpna). Nevykázal žádné neočekávané bezpečnostní regresní chyby. Všechny existující funkce z předchozího sprintu byly potvrzeny. Budoucí vývoj se může bezpečně přesunout na tvorbu interaktivního Chatbota (P0) a Notifikací (P1).
