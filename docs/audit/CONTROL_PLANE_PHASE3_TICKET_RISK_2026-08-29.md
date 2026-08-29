# Audit Report
Date: 2026-08-29
Task: CONTROL_PLANE_PHASE3_TICKET_RISK

## Původní požadavek/cíl
Rozšířit Project Control Plane o inteligentní vrstvu pro správu problémů, technického dluhu, QA nálezů a rizik (Risk Intelligence & Ticket Engine) s udržením přísných bezpečnostních mantinelů (Fail Closed, No Auto-Mutation).

## Výchozí stav
Project Control Plane Foundation obsahoval `ControlPlaneService`, `AdminCopilot` integraci a 48h snapshoty. Ticket systém (SynthesisTicket) a analýza chyběly nebo byly nedotčené, QA engine pouze prováděl nezávislý audit.

## Provedené změny
1. **Control Plane Types**
   - Aktualizován `src/types/controlPlane.ts` s rozhraními `ControlPlaneFinding`, `ControlPlaneFindingSource`, `RiskAnalysisResult`.

2. **Risk Engine**
   - Vytvořen `src/services/controlPlaneRiskEngine.ts`.
   - Přidána čistě **deterministická** pravidla pro výpočet rizika a priority (Priority Score). Systém ignoruje AI, pokud AI navrhne P0 bez jakéhokoli jasného deterministického důkazu, a vyvolává "Fail Closed" eskalaci pro Human Review.
   - Pravidla pro výpočet confidence penalty, rozlišení P0 (leak secretů, bypass), P1, P2 a P3.

3. **Ticket Engine**
   - Vytvořen `src/services/controlPlaneTicketEngine.ts`.
   - Implementován lifecycle převodu nálezu na `SynthesisTicket`.
   - Vytvořen deduplikační hash z (zdroj, název, afektované zdroje).
   - Při duplicitě vytváří `SynthesisTicketEvent` s `FINDING_REOCCURRED` (nemnoží tickety).
   - Mapování Severity a Kategorie.
   - Detekce root-cause a blast radius.

4. **Copilot Integrace**
   - Upraven `src/services/qa/adminCopilot.ts` - přidán intent parser pro "najdi problém", "technický dluh".
   - Přidány execute kroky pro zjištění dat, kalkulaci rizika a vytvoření ticketu.
   - Vylepšené logování do AuditService.

## Dotčené soubory
- `src/types/controlPlane.ts`
- `src/services/controlPlaneRiskEngine.ts`
- `src/services/controlPlaneTicketEngine.ts`
- `src/services/qa/adminCopilot.ts`
- `tests/control-plane-ticket-risk.test.ts`

## Testování
- Testy Risk Engine: úspěšně detekují P0 (auth bypass), P1 (výpadek), ověřují "Fail closed" pro AI návrhy bez důkazů, aplikují confidence penalty.
- Testy Ticket Engine: ověřují generování hashe, prevenci duplicit (FINDING_REOCCURRED event) a správný zápis nového ticketu.
- Výsledky testů: 8/8 PASSED.
- Lint byl opraven a zkontrolován manuálním review syntaxe v Copilot souboru.

## Upozornění & Rizika
- **Otevřená rizika:** 
  1. `PrismaClient` byl pro testy mockován globálně; integration testy s reálnou db nebyly spuštěny (pouze unit testy).
  2. Mapování kategorií v `ControlPlaneTicketEngine.mapCategory` používá heuristiku, která by do budoucna mohla vyžadovat komplexnější LLM post-processing po uložení ticketu.
- **Bezpečnostní rizika:** Skutečné zamezení destrukci produkce nadále visí na tom, že AI nemá právo provádět operace bez approval a 48h snapshotu. Změna se plně řídí "ZATÍM NIC NEMERGUJ DO MAIN. ZATÍM NIC NENASAZUJ NA VPS."

## Git Status a Commit
- Změny pushnuty na izolovanou větev `feat/project-control-plane-ticket-risk`. Main nebyl nijak dotčen.
