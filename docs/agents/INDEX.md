# Unified Agent Layer — Documentation Catalog (Phase 1B-0)

**Projekt:** Táta má právo / Synthesis Hub  
**Architektúra:** Unified Agent Layer (Phase 1A / Phase 1B / Phase 1B-0)  
**Bezpečnostný status:** Fail-Closed, Single Authority (`ControlPlaneAuthorization`)  
**Posledná aktualizácia:** 2026-09-04  

---

## Prehľad registrovaných experimentálnych agentov

| Agent ID | Názov | Status | Povolene | Trace | Approval | Doc Link |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `BUILD_WITH_AGENTS` | Build With Agents | `EXPERIMENTAL` | ✅ | ✅ | ⚠️ Ano | [build-with-agents.md](./build-with-agents.md) |
| `ANTIGRAVITY_PREVIEW` | Antigravity Preview | `EXPERIMENTAL` | ✅ | ✅ | ⚠️ Ano | [antigravity-preview.md](./antigravity-preview.md) |
| `AI_TALK_RADIO` | AI Talk Radio | `PROPOSED` | ❌ | ✅ | ⚠️ Ano | [ai-talk-radio.md](./ai-talk-radio.md) |
| `CUSTOMER_SUPPORT` | Customer Support Agent | `PROPOSED` | ❌ | ✅ | ❌ Nie | [customer-support.md](./customer-support.md) |
| `DATA_ANALYST` | Data Analyst Agent | `EXPERIMENTAL` | ✅ | ✅ | ❌ Nie | [data-analyst.md](./data-analyst.md) |
| `DOCUMENT_PROCESSOR` | Document Processor Agent | `PARTIAL` | ✅ | ✅ | ❌ Nie | [document-processor.md](./document-processor.md) |
| `REPO_MAINTAINER` | Repo Maintainer Agent | `EXPERIMENTAL` | ✅ | ✅ | ⚠️ Ano | [repo-maintainer.md](./repo-maintainer.md) |

---

## Štruktúra dokumentačného štandardu

Každý agentný dokument v katalogu `docs/agents/` dodržiava povinne 25 bodov špecifikácie:
1. Násobná identifikácia a metadata (ID, Archetype, Status badges)
2. User Guide („Co je to?“, „Jak začít“, „Co dostanu“, „Limity“, „Chyby“)
3. Technical Spec (Identity, Capabilities, RBAC, ControlPlaneAuthorization, Failure behavior)
4. Matrix implementačného stavu (Frontend, Backend, API, DB, RBAC, Policy, Audit, Telemetry, AI Provider)
5. Practical Scenarios (3x bežný, 2x pokročilý, 2x zakázaný)
6. Security Constraints & Audit Trail
