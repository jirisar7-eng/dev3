# Audit Report: Control Plane Phase 5A - Safety Core
**Date:** 2026-08-29
**Task:** Implementation of Control Plane Safety Core (State Machine, Catalog, RBAC, Validation)

## Původní stav (Phase 5 Discovery)
* `ControlPlaneService.ts` držel JSON seznam akcí s částečným stavem.
* Neexistoval deterministický stavový automat.
* Chyběl whitelist operací (Operation Catalog).
* Zranitelnost: Stav `EXECUTING` nebo `MERGED` neověřoval existenci předchozího explicitního human approvalu. Ochrana main větve před Copilotem spoléhala na neúplné podmínky.
* Konkurence: Lokální JSON soubor neodolává paralelním zápisům (race conditions).
* RBAC se kontrolovalo pouze na úrovni hardkódovaných skupin pro některé intent analýzy, chyběly "capabilities".

## Provedené Změny

### 1. State Machine (`ControlPlaneStateMachine`)
* Vytvořen tvrdý fail-closed state machine, který reguluje veškeré přesuny životním cyklem.
* Seznam stavů rozšířen pro plný Control Plane lifecycle: od `DRAFT` po `MONITORING`, `FINALIZED`, `ROLLED_BACK`.
* Striktní definice přechodů.
* Invariants checks (Transitions Guards) zamezující přeskočení kroků (např. vynucuje 48h snapshot a human approval pro critical mutace před přesunem do `EXECUTING`).

### 2. Operation Catalog (`ControlPlaneOperationCatalog`)
* Definice zhruba 25 izolovaných "whitelist" operací.
* Každá operace definuje: required capability (např. `deploy.production`), risk level, approval rule a zda potřebuje snapshot.
* Bez tohoto katalogu a bezpečné identifikace (operationId) nelze vytvořit novou akci pod Control Plane orchestrem.

### 3. RBAC Matrix (`ControlPlaneAuthorization`)
* Adaptér nad existujícími Rolemi (USER, CONTENT_MANAGER, ADMIN, SUPER_ADMIN) do jemných capabilities (např. `content.write`, `github.branch.create`).
* Bezpečně validuje operaci vůči kontextu (např. forbidden target pro secrets čtení).
* Kontroluje existenci actorId (nelze mutovat anonymně).

### 4. Approval Boundaries & Main Protection
* Nastaven invariant proti úpravě větve `main` z neautorizovaných Copilot operací.
* `DEPLOY` a `MERGE_MAIN` vyžadují absolutní přítomnost `approvalPresent` v kontextu State Machine požadavku. 
* SUPER_ADMIN neobejde požadavek na schvalování kritických operací, automat stále vyžaduje projít explicitním stavem `APPROVED`.

### 5. Snapshot Contract
* Formálně definován snapshot interface zaručující neměnnost a propojení na hash provedených změn (v `src/types/controlPlane.ts`).
* Zápis snapshotu v `ControlPlaneService.ts` generuje 256bit SHA hash reprezentující stav, navazující na kontrolní bod do 48 hodin.

### 6. Concurrency Analysis
* `control-plane-actions.json` stále funguje jako mock vrstva per-request persistence. 
* **Varování/Limity:** Bylo zjištěno, že JSON read/modify/write není concurrency safe. V rámci Phase 5A byla tato implementace sice zachována, aby nebyla narušena aplikace, avšak byla formálně dokumentována v kódu. Následující krok integrace (Phase 5B/6) musí migrovat do relační/transakční DB s optimistic lockingem, aby chránila před double-execution nebo double-approval.

### 7. Testy a Validace
* Implementovány deterministické unit testy `src/tests/controlPlaneSafety.test.ts`.
* 15/15 testů úspěšně prošlo (Vitest).
* TSC kompilace bez typových chyb.
* Testuje striktní boundary conditions, RBAC průchody a zamítnutí chybných transitionů.

## Známé limity a Co zůstává pro Phase 5B
* Zabezpečovací jádro je hotovo, ale je třeba dokončit fyzické propojování operací z `githubPublisherService` k `ControlPlaneService`.
* `AdminCopilot` frontend a backend controller musí přejít plně z 'intent analyze' (legacy mód) na výběr z `ControlPlaneOperationCatalog`.
* Propojení na Prisma/DB pro ukládání Action Eventů.

