# BRANCH MERGE RECOMMENDATIONS
**Datum:** 2026-08-27

Cílem tohoto dokumentu je stanovit postup konsolidace 25 větví do jediné, stabilní a aktuální `main` větve pro přípravu vydání Beta 1.0.

## FÁZE 1: FAST-FORWARD MAIN (Kritické) - DOKONČENO
Nejkvalitnější, nejvíce otestovaná a funkční větev je aktuálně `feature/auth-session-consistency`. Je o 20 commitů napřed před `main` a 0 pozadu.
**Akce:**
1. Vytvořit Pull Request z `feature/auth-session-consistency` do `main`.
2. Provést **Fast-Forward merge**. Tím se `main` stane moderním základem (obsahující Admin Shell, Team Center, čistou Auth).

## FÁZE 2: REBASE A MERGE DIVERGOVANÝCH VĚTVÍ - DOKONČENO NA INTEGRAČNÍ VĚTVI
Větev `feat/ai-failsafe-client-prompt-hardening` obsahuje kritické (P0) opravy pro AI.
**Akce:**
1. Po sloučení Fáze 1 provést `git checkout feat/ai-failsafe-client-prompt-hardening`.
2. `git rebase main` (vyřešit případné konflikty v AI službách a docker souborech).
3. Merge rebasované větve do `main`.

## FÁZE 3: ZAMRAŽENÍ A SMAZÁNÍ MRTVÝCH VĚTVÍ
Následující větve jsou "Behind only" a jejich práce byla buď zavrhnuta, nebo přepsána lepším řešením v novějších commitech.
**Akce:** Tyto větve smazat nebo je přesunout do archivu (např. tagováním a smazáním).
- `feature/state-admin-ares`
- `feature/navigation-reorganization`
- `fix/responsive-tablet-navigation`
- `feature/puck-adapter-layer`
- ... (a dalších 10 starých feature větví).

## FÁZE 4: SOUSTŘEDĚNÍ NA ZBÝVAJÍCÍ VÝVOJ
Po Fázi 1 a 2 bude `main` obsahovat veškerou HOTOVOU práci. Další vývoj (PWA Offline, Kalkulátor) se musí dít na striktně krátkodobých (short-lived) větvích.

## DOKONČENÍ FÁZE 1 A 2
Všechny kroky z Fáze 1 (Fast-forward) a Fáze 2 (Divergované integrace) úspěšně dokončeny k datu 2026-08-27 na větvi `integration/ai-failsafe-after-auth-consolidation`. Main branch byla fast-forwardnuta na stav obsahující Auth, Navigation a Admin Shell.
Vytvořen nový PR pro dokončení integrace přes GitHub.
