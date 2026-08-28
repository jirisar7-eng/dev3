# MASTER PROJECT AUDIT MATRIX

| Audit | Oblast | Nález | Stav | Ověřeno v kódu | Akce |
|---|---|---|---|---|---|
| `AUTH_SESSION_CONSISTENCY` | Security / Auth | Problém s MFA pending tokeny přes různé uživatele. | OPRAVENO | ANO (`authMiddleware.ts` ř. 54) | Nechat beze změny |
| `ESBIRKA_ENDPOINTS` | E-Sbírka Sync | Překročení Rate-limitu (1 req/sec). | OPRAVENO | ANO (`EsbirkaService.ts`) | Neporušovat limit |
| `JUDGMENT_AI_EXTRACTOR` | AI Failsafe | Selhání AI způsobí smazání existujících dat. | OPRAVENO | ANO (`deterministicJudgmentParser.ts`) | Fail-closed mechanismus zachovat |
| `GITHUB_SYNC_PHASE_02D` | Tracability | Chybí navázání ticketů na GitHub (PR/Issue). | OPRAVENO | ANO (`githubSyncService.ts`) | Zachovat nezávislost webhooku |
| `PWA_FOUNDATION` | PWA / Offline | Chybí offline data storage pro Case. | STÁLE PLATÍ | ANO (Chybí IndexDB sync) | Naplánovat pro P0/P1 fix |
| `NAVIGATION_REDESIGN` | UI/UX | Duplicitní hlavičky, rozbitá mobilní navigace. | OPRAVENO | ANO (`Header.tsx`) | Odstranit legacy kód. |
| `AI_PROVIDER_CONSISTENCY` | AI | Halucinace v krizových odpovědích. | OPRAVENO | ANO (Prompt Hardening test pass) | Sledovat při produkčním provozu |
| `COPARENT_HUB` | Funkcionalita | B.I.F.F. komunikátor není spojen s DB. | STÁLE PLATÍ | ANO | Implementovat datový model zpráv |
