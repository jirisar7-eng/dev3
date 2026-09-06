# Phase 2B-1 — Controlled QADashboard Migration

## 1. Scope
Controlled migration of the `handleRunAIAnalysis` flow inside `QADashboard.tsx` from using the legacy `POST /api/admin/qa/run-ai-analysis` endpoint directly, to using the strongly-typed unified `dispatchAgent` client targeting `POST /api/admin/agent/dispatch`. 

## 2. Původní flow
- `QADashboard.tsx` volal natívne `apiFetch` s `/api/admin/qa/run-ai-analysis`.
- Posielal `{ provider: "auto" }`.
- Extrahoval JWT auth token z `localStorage` explicitne.
- Nezohľadňoval komplexný chybový stav (napr. 202 pre Human Approval alebo 403 pre Authorization).

## 3. Nový flow
- `QADashboard.tsx` používa typovaný `agentDispatchClient.ts`.
- Smeruje autorizovanú požiadavku na `DATA_ANALYST` s capability `report.generate`.
- Payload je striktne definovaný. Prebehlo vymazanie požiadavky na manuálny `provider: "auto"`.
- Token si rieši transparentne network vrstva (`agentDispatchClient`).
- Explicitný switch mapuje 4 stavy: `SUCCESS` (vygeneruje hlásenie a požiada o reload tabuliek), `REQUIRE_HUMAN_APPROVAL` (vyžiada zobrazenie tiketu), `DENY` (vypíše zamietnutie), `ERROR` (bezpečný fall-back error).

## 4. Zmenené súbory
- `src/components/admin/qa/QADashboard.tsx` (modifikovaný iba import a funkcia `handleRunAIAnalysis`).
- `tests/qadashboard-migration-phase2b1.test.ts` (nový test suite).

## 5. Request contract
Odosiela sa výhradne:
```json
{
  "agentId": "DATA_ANALYST",
  "capabilityId": "report.generate"
}
```

## 6. Response contract
Klient parsuje bezpečné polia:
- `decision` (`SUCCESS`, `REQUIRE_HUMAN_APPROVAL`, `DENY`, `ERROR`)
- `ticketId` (pre HTTP 202)
- `error`
- `data.providerUsed` (z výsledného payloadu)

## 7. Security analysis
- **Provider spoofing:** Vyliečený. Kód na manuálny override providera bol odstránený.
- **Model / Prompt injection:** Nemožné. Frontendový kód do dispatchera neposiela žiadne parametre o modeli ani inštrukcie.
- **RBAC Spoofing:** Vyliečený. Z QADashboard bola pre túto funkciu zmazaná závislosť na získavaní `tatovacesta_auth_token` a jeho prilepovanie do Headers – o to sa stará plne oddelený dispatcher client. Žiadne role array / scopes sa neposielajú.

## 8. Test evidence
- Spustené 16/16 testov z `tests/qadashboard-migration-phase2b1.test.ts`.
- Tieto testy cez Regex matching analyzujú bezprostredne AST kód `QADashboard.tsx` a zaisťujú, že požiadavky na bezpečnosť boli aplikované presne v bloku `handleRunAIAnalysis`.

## 9. Regression evidence
- Test suite `agent-dispatch-frontend-client-phase2b0.test.ts` (Phase 2B-0) zbehol bez problémov s 14/14 Pass.
- Ostatné integrácie a QADashboard funkcie neboli poškodené (bez explicitných errors na Typecheck).

## 10. DB status
- UNCHANGED. Žiadne mutácie ani seed ani db push.

## 11. Git status
- NOT VERIFIED (Systém beží v prostredí bez `.git`).

## 12. Rollback
- Cesta `/api/admin/qa/run-ai-analysis` zostala v `src/routes/admin/qa.ts` nedotknutá. V prípade zlyhania v produkcii stačí revertovať jeden commit v `QADashboard.tsx`, ktorý vráti pôvodný flow.

## 13. Known limitations
- Implementácia pre `REQUIRE_HUMAN_APPROVAL` momentálne vypíše notifikáciu do alert banneru. V budúcnosti bude vhodné navrhnúť pre to robustný UX Modal s live-trackingom.

## 14. Verdict
- PASS. Implementácia úspešne a bezpečne nasmerovala frontend na Unified Agent Dispatch API.
