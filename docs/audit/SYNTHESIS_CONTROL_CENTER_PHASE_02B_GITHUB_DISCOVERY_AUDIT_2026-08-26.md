# SYNTHESIS CONTROL CENTER — PHASE 02B AUDIT REPORT
**GitHub Synchronization Read-Only Discovery & Architecture Plan**

- **Datum a čas:** 2026-08-26T20:05:00Z
- **Úkol:** PHASE 02B — GitHub Synchronization Read-Only Discovery
- **Projekt:** Táta má právo / DEV3
- **Větev:** `feature/auth-session-consistency`
- **Výchozí commit:** `e2e467c875c7048f4d41c67f5db1e180f73ba695`
- **Výsledný stav:** PASS (Discovery Completed)

---

## 1. EXISTING IMPLEMENTATION & ARCHITECTURE

### A. Existing Services
1. **`GithubPublisherService` (`src/services/githubPublisherService.ts`)**:
   - Modul pro serverové publikování kódu přes Git CLI (`git status`, `git commit`, `git push`, `git push --force`).
   - Autentizace pomocí serverové proměnné `GITHUB_TOKEN` v URL vzdáleného repozitáře (`https://${token}@github.com/${repo}.git`).
   - Bezpečnostní mechanismy: Sanitizace tokenu z chybových hlášek, kontrola zakázaných souborů (`.env`, `secrets/`, `*.pem`, `*.key`), vyžaduje oprávnění `system.github.publish` / `system.github.force_publish` a roli `SUPER_ADMIN`.
2. **`SynthesisService` (`src/services/synthesisService.ts`)**:
   - Obsahuje připravenou datovou strukturu pro uchování stavu GitHub synchronizace u `SynthesisTicket`:
     - `githubIssueNumber` (Int?)
     - `githubIssueUrl` (String?)
     - `githubPrNumber` (Int?)
     - `githubPrUrl` (String?)
     - `githubSyncStatus` (`GitHubSyncStatus`: `NOT_SYNCED`, `ISSUE_CREATED`, `PR_LINKED`, `CLOSED_BY_COMMIT`, `SYNC_ERROR`, `PENDING`, `SYNCED`, `FAILED`)
     - `githubSyncError` (String?)
     - `githubSyncedAt` (DateTime?)
     - `coderabbitCommentId` (String?)

### B. Existing Endpoints
1. **GitHub Publisher API (`server.ts`)**:
   - `GET /api/admin/github/status`: Kontrola stavu `GITHUB_TOKEN` a pracovní složky Git.
   - `POST /api/admin/github/push`: Spuštění Git commit & push.
   - `POST /api/admin/github/force-push`: Spuštění Git force push.
   - `GET /api/admin/git/suggest-push-name`: AI/fallback návrh názvu commitu.
2. **Webhook API (`src/routes/system.ts`)**:
   - `POST /api/system/webhook-deploy` (aliasy: `/api/webhook/deploy`, `/api/webhook`, `/api/webhooks/github`):
     - Zpracovává automatické redeploy události z GitHub Webhooku.
     - Ověřuje HMAC SHA-256 podpis v hlavičce `X-Hub-Signature-256` pomocí `WEBHOOK_SECRET`.
     - Spouští `npx prisma db push && npx prisma generate` a restartuje kontejner.

### C. Existing UI Components
- **`GitHubPublisher.tsx` (`src/components/admin/GitHubPublisher.tsx`)**:
  - Administrátorská komponenta záložky "GitHub" v `AdminDashboard.tsx`.
  - Slouží k ručnímu pushování kódu na GitHub.

---

## 2. EXISTING ENV & SECRETS REFERENCES

- `GITHUB_TOKEN`: Personal Access Token s oprávněním pro repozitář (uložen výhradně na serveru).
- `GITHUB_REPOSITORY`: Repozitář ve tvaru `jirisar7-eng/dev3`.
- `GITHUB_BRANCH`: Cílová větev pro push (výchozí `main` nebo aktuální feature branch).
- `WEBHOOK_SECRET`: Tajný klíč pro ověření příchozích webhooků z GitHubu.

---

## 3. EXISTING AUDITS RELEVANT TO GITHUB

- `docs/audit/PHASE_14B_GITHUB_SYNC_AUDIT_2026-08-21.md`: Detailní rozbor obnovy poškozeného Git repozitáře a autentizace.
- `docs/audit/PHASE_14D_GITHUB_PUSH_AUDIT_2026-08-21.md`: Potvrzení funkčního odesílání commitů na remote `jirisar7-eng/dev3`.
- `docs/audit/PHASE_19_FINAL_RELEASE_GITHUB_MERGE_AUDIT_2026-08-21.md`: Finální synchronizace produkčních větvení.

---

## 4. EXISTING PARALLEL WORK (DO NOT TOUCH)

- **`GithubPublisherService` & `GitHubPublisher.tsx`**: Zcela oddělená existující komponenta pro nasazování kódové báze. Nesmí být modifikována ani slučována se Synthesis REST API synchronizací.
- **`/api/system/webhook-deploy`**: Existující deploy pipeline webhook. Nesmí být přepsán ani narušen.

---

## 5. DUPLICATES & CONFLICTS

1. **Webhook Path Collision**:
   - Cesta `/api/webhooks/github` je v `server.ts` namontována na `systemRoutes` (`webhook-deploy`). Příchozí webhooky pro Synthesis GitHub Issues nebo PRs by při poslání na stejnou URL vyvolaly deploy logiku.
   - **Řešení pro PHASE 02C**: Vytvořit dedikovaný endpoint `/api/admin/synthesis/webhooks/github` nebo `/api/synthesis/webhooks/github`.

2. **Publishing vs. Issue/PR Sync**:
   - `GithubPublisherService` používá příkazovou řádku `git` pro push kódu.
   - `GithubSyncService` (v PHASE 02C) bude používat GitHub REST API (`https://api.github.com/repos/{owner}/{repo}/issues`) pro správu tiketů a úkolů.

---

## 6. MISSING COMPONENTS FOR PHASE 02C

1. **`GithubSyncService` (`src/services/githubSyncService.ts`)**:
   - Služba pro volání GitHub REST API přes native `fetch` s hlavičkou `Authorization: Bearer ${GITHUB_TOKEN}`:
     - Vytvoření GitHub Issue z `SynthesisTicket` (`POST /repos/{owner}/{repo}/issues`).
     - Aktualizace GitHub Issue při změně statusu v Synthesis Control Center (`PATCH /repos/{owner}/{repo}/issues/{issue_number}`).
     - Připojení Pull Requestu k tiketu.
2. **Synthesis Webhook Handler**:
   - Příchozí webhook pro odchytávání událostí z GitHubu (`issues`, `pull_request`):
     - Automatický posun statusu Synthesis tiketu na `CLOSED` / `RESOLVED` při uzavření issue nebo merge PR.
3. **Resilient Error & Rate-Limit Handling**:
   - Při chybě API nebo překročení rate limitu nastavit `githubSyncStatus = SYNC_ERROR` a zapsat `githubSyncError`, aniž by došlo ke zhroucení lokální operace nebo k výpadku databáze.

---

## 7. SECURITY RISKS & SAFEGUARDS

1. **Token Protection**: `GITHUB_TOKEN` nesmí být nikdy zobrazen na frontendu ani zapsán v auditních logách či komentářích.
2. **Inbound Webhook Verification**: Všechny příchozí webhooky z GitHubu MUSÍ být verifikovány pomocí HMAC SHA-256 podpisu přes `WEBHOOK_SECRET`.
3. **Fail-Closed / Non-Blocking Isolation**: Propojení s GitHub API nesmí blokovat lokální DB transakce Synthesis tiketu. Pokud je GitHub nedostupný, lokální tiket se vytvoří/aktualizuje a synchronizace se označí jako `SYNC_ERROR` / `PENDING`.

---

## 8. EXACT IMPLEMENTATION PLAN FOR PHASE 02C

1. **Vytvoření `GithubSyncService`**:
   - Metoda `createIssueFromTicket(ticketId)`: Vytvoří GitHub Issue a uloží `githubIssueNumber`, `githubIssueUrl`, nastaví `githubSyncStatus = ISSUE_CREATED`.
   - Metoda `updateIssueFromTicket(ticketId)`: Synchronizuje status a komentáře.
2. **Přidání Admin API Endpointů v `src/routes/synthesisRoutes.ts`**:
   - `POST /api/admin/synthesis/tickets/:id/sync-github`: Ruční spuštění synchronizace tiketu s GitHubem.
3. **Vytvoření Webhook Endpointu pro Synthesis**:
   - `POST /api/synthesis/webhooks/github`: Ověří signature a zpracuje události `issues.closed`, `pull_request.closed` (merged).
4. **Verifikace a Testy**:
   - Doplnění unit/integration testů do `src/tests/synthesisCore.test.ts` pro ověření `GithubSyncService` a sanitizace tokenů.
