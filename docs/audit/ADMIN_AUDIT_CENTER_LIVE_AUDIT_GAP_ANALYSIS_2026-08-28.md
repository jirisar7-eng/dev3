# Auditní report: Gap Analysis - Živý Interaktivní Audit & Audit Center (DEV3)

- **Datum a čas auditu:** 2026-08-28
- **Název úlohy:** Read-only analýza stávající architektury AI/QA administrace
- **Cíl úlohy:** Zmapovat přesný stav infrastruktury, odhalit slabá místa a chybějící vazby mezi "živým auditem" a "Audit Centrem".

---

## 1. Mapa současného stavu (As-Is Architecture)

1. **Synthesis Admin Copilot** (`/administrace/qa/copilot`)
   - **UI:** Integrováno v `QADashboard.tsx`.
   - **Backend:** `/api/admin/qa/copilot/plan`, `/api/admin/qa/copilot/execute-step`.
   - **Stav:** Funkční AI orchestrace s využitím Gemini. LLM parsuje požadavky a může volat podřízené služby (včetně `RUN_AUDIT`).

2. **AI Context & Index** (`/administrace/ai-context`)
   - **UI/API:** `AiContextManager.tsx` / `/api/ai-context/status`
   - **Stav:** Funkční generátor sitemap a `llms.txt`.

3. **QA & Audit Syntéza (Živý interaktivní audit)** (`/administrace/qa`)
   - **UI:** `QADashboard.tsx`
   - **Backend:** `/api/admin/qa/run-audit` řízený přes `qaAuditEngine.ts`.
   - **Funkce:** Provádí statický scan, API requesty, databázové persistency testy (CRUD na `user`), a E2E detekce. Získaná data odesílá do AI Analyst (`aiAnalystService.ts`) k posouzení produkční připravenosti. 
   - **Stav:** Interně plně funkční, ale výsledky zapisuje izolovaně pouze do `prisma.qARun` a `prisma.qAFinding`.

4. **E2E AI Testy** (`/administrace/tests`)
   - **Stav:** Běží izolovaně pomocí Playwright. Backend endpointuje stav a výstup přes child process wrapper. Funkční.

5. **Analytika & Návštěvnost** (`/admin/analytics`)
   - **Stav:** Funkční provozní analytický dashboard (vyčítá `prisma.pageView`).

6. **Audit Log (Provozní DB)** (`/admin/audit`)
   - **Stav:** Funkční systémový deník (`prisma.auditLog`), kam se logují akce (např. sync auditů, úpravy).

7. **Audit Center (Vývojové zprávy)** (`/admin/audits`)
   - **UI/API:** `AuditCenter.tsx` / `auditCenterRoutes.ts`.
   - **Stav:** Plně funkční platforma pro zobrazování, export (PDF/MD) a bezpečné sdílení statických Markdown auditů načítaných ze souborového systému `docs/audit/` (přes `AuditCenterService`).

---

## 2. Analýza funkčnosti & Falešné mocky
- **Co je skutečně funkční:** Databázový QA audit, API testování a samotné Audit Center (čtení existujících `.md` dokumentů).
- **Co je pouze UI / Mock:** 
  - V `qaAuditEngine.ts` je Security IDOR check prováděn zasláním dotazu s fake tokenem na fixní endpoint, což nevyhnutelně spadne na 401. Jde o pouhé otestování existence middleware vrstvy (Auth/BOLA block), nikoliv test konkrétního aplikačního byznys IDORu.

---

## 3. Identifikované meziprostory (Gap Analysis)
Hlavní a **kritický problém** celé architektury spočívá v oddělení datové persistence "Živého Auditu" od "Audit Centra":
- Když uživatel v UI spustí **Živý QA Audit**, motor to správně změří a nechá zpracovat AI. 
- Výsledek se uloží pouze do databáze (tabulka `qARun`).
- **Nenastane generování fyzického `.md` souboru do `docs/audit/`**. 
- Vzhledem k tomu, že **Audit Center** je postaveno nad synchronizací souborů z repozitáře (`docs/audit/*.md`), tento nový živý audit se v Audit Centru nikdy nezobrazí a po opuštění stránky / refreši historie splyne do zapomnění izolované tabulky. Tím se narušuje primární pravidlo celého projektu (uchovávat audity v Gitu v `docs/audit`).

---

## 4. Návrh cílové architektury
Živý interaktivní audit (QA Syntéza) musí automaticky propisovat svá data do Audit Centra:
1. `QADashboard.tsx` zavolá `qaAuditEngine.runAudit()`.
2. Backend nasbírá testy, vytvoří AI report.
3. **NOVĚ:** V závěru běhu `qaAuditEngine.runAudit()` dojde ke složení plnohodnotného Markdown dokumentu (kombinace metrik, grafu, failů a doporučení od AI).
4. **NOVĚ:** Dokument se fyzicky uloží jako `docs/audit/AUDIT_YYYY-MM-DD_LIVE_QA_<runId>.md`.
5. **NOVĚ:** Backend okamžitě zavolá `AuditCenterService.syncAudits()`, čímž dokument propíše do databáze jako `AuditDocument`.
6. Frontend (`QADashboard`) zobrazí potvrzení, že se audit vypsal, a nabídne proklik do Audit Centra.

---

## 5. Seznam požadovaných minimálních změn (Action Plan)
1. Upravit `src/services/qa/qaAuditEngine.ts`:
   - Importovat `fs` a modul pro získání aktuálního data.
   - V bloku "Step 10: FINAL REPORT GENERATION" vytvořit novou funkci pro export MD stringu (včetně `rawReportText` a hodnocení od `aiAnalystService`).
   - Přidat `fs.writeFileSync(...)` pro uložení pod názvem s datem a ID.
   - Po úspěšném zápisu zavolat `await AuditCenterService.syncAudits({ forceResync: true })`.
2. Provést audit refaktoringu UI komponenty `QADashboard.tsx`, aby po úspěšném zpracování správně informovala uživatele o přesunu dat do Audit Centra.
3. Sjednotit sekci "Runs" v QADashboard tak, aby preferenčně odkazovala na reálné zprávy v Audit Centru.
