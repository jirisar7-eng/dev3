# Agent Documentation: REPO_MAINTAINER

**Název:** Repo Maintainer Agent  
**ID:** `REPO_MAINTAINER`  
**Stav implementace:** `EXPERIMENTAL`  
**Source of Truth:** ✅ VERIFIED (Registry/Catalog registered, `enabled: true`)  

---

## 1. Základní identifikace & Účel

- **Účel:** Automatizovaná inspekce kódové báze, spouštění bezpečnostních auditních kontrol a příprava návrhů na opravení zjištěných nálezů.
- **Pro koho je určen:** Senior vývojáři, DevSecOps architekti a QA inženýři.
- **Co umí:**
  - Čtení struktury kódové báze a konfigurací.
  - Spouštění deklarativních auditních testů (QA discovery).
  - Vytváření návrhů (Drafts) bezpečnostních opatření (`actions.propose`).
- **Co neumí:**
  - Neumí spouštět `git push --force` ani přímý deploy.
  - Neumí provádět neautorizované úpravy souborů bez schválení.
  - Neumí obcházet testovací runner ani Control Plane.
- **Kdy jej použít:** Při pravidelné kontrole kódové čistoty, hledání bezpečnostních zranitelností a přípravě návrhu refaktoringu.
- **Kdy jej nepoužívat:** Při pokusu o obcházení schvalovacích procesů.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Bezpečnostní a údržbový asistent pro kontrolu kódové báze projektu.
- **K čemu to slouží?**  
  Pomáhá udržovat projekt v souladu s pravidly Synthesis a bezpečnostními standardy.
- **Co s tím můžu dělat?**  
  Spustit audit kódové báze a získat přehled zjištěných zranitelností.
- **Jak začít — krok za krokem:**
  1. Přihlaste se jako `ADMIN` / `SUPER_ADMIN` do Admin Shellu.
  2. Otevřete "Security & Code Audit".
  3. Zvolte "Spustit inspekci repozitáře".
  4. Prohlédněte si nalezené zjištění (Findings).
  5. Návrhy oprav schvalte přes Human Approval.
- **Jaký vstup potřebuji?**  
  Rozsah inspekce (napr. `src/services`).
- **Co dostanu jako výsledek?**  
  Auditní zprávu a návrh akce (`actions.propose`).
- **Jak poznám, že operace proběhla správně?**  
  Systém vrátí zprávu s nálezy a zapíše krok do `OrionTraceStore`.
- **Jaké jsou limity?**  
  Agent nesmí provádět změny bez explicitního schválení.
- **Kdy potřebuji schválení administrátora?**  
  Návrh změny (`actions.propose`) striktně vyžaduje Human Approval (`requiresHumanApproval: true`).
- **Co dělat při chybě?**  
  Prověřte logy v auditním protokolu podle `traceId`.
- **Bezpečnostní upozornění:**  
  Agent nemá přístup k produkčním klíčům v `.env`.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `REPO_MAINTAINER`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `repo.read` (RiskLevel: `P2`, RequiresHumanApproval: `false`)
  - `audit.run` (RiskLevel: `P2`, RequiresHumanApproval: `false`)
  - `qa.run` (RiskLevel: `P2`, RequiresHumanApproval: `false`)
  - `findings.view` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
  - `actions.propose` (RiskLevel: `P1`, RequiresHumanApproval: `true`)
- **Allowed Scopes:** `repo.read`, `audit.run`, `qa.run`, `findings.view`, `actions.propose`
- **RBAC Requirement:** Role `ADMIN` nebo `SUPER_ADMIN`.
- **Policy Engine:** Strict Fail-closed na operace `git.push.force` a `shell.execute`.
- **ControlPlaneAuthorization:** Evaluováno přes `authorizeAgentRequest()`.
- **Allowed Providers:** `gemini`, `grok`
- **Trace Required:** `true`

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | 🟡 PROPOSED | Rozhraní v Admin Shellu |
| **Backend** | PARTIAL | Registrovaný v registr a catalog |
| **API** | ⚪ NOT FOUND | Žádné spouštěcí API |
| **Database** | ⚪ NOT FOUND | 0 schema mutation |
| **RBAC** | ✅ VERIFIED | Podléhá autorizaci |
| **Policy Engine** | ✅ VERIFIED | Zákaz force push a shell |
| **Audit** | ✅ VERIFIED | Povinné trasování v OrionTraceStore |
| **Telemetry** | ✅ VERIFIED | Sledování auditních kroků |
| **AI Provider** | ✅ VERIFIED | Gemini & Grok |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1: Kontrola dodržení importních pravidel**  
   - *Vstup:* Poptávka na kontrolu nepovolených importů.  
   - *Výsledek:* Zobrazení nálezů (`findings.view`).
2. **Scénář 2: Spuštění QA testovací sady**  
   - *Vstup:* Příkaz k verifikaci testů.  
   - *Výsledek:* Zpráva o stavu testů (`qa.run`).
3. **Scénář 3: Zobrazení přehledu zranitelností**  
   - *Vstup:* Žádost o přehled bezpečnostních zjištění.  
   - *Výsledek:* Seznam nálezů s úrovní rizika.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Návrh opravného balíčku (Draft Action)**  
   - *Vstup:* Poptávka na návrh refaktoringu.  
   - *Výsledek:* `REQUIRE_HUMAN_APPROVAL` pro `actions.propose`.
2. **Scénář 2 (Pokročilý): Detekce zastaralých závislostí v package.json**  
   - *Vstup:* Kontrola balíčků.  
   - *Výsledek:* Zpráva s doporučením aktualizace.

### Zakázané scénáře
1. **Zakázaný scénář 1: Pokus o spuštění git push --force**  
   - *Pokus:* "Odesli změny na GitHub s přepínačem --force."  
   - *Reakce:* `DENY` — Capability `git.push.force` je přísně zakázána (P0 Policy).
2. **Zakázaný scénář 2: Přímá úprava souborů bez schválení**  
   - *Pokus:* Zápis zjištěné opravy přímo na disk serveru.  
   - *Reakce:* `DENY` — Agent smí pouze navrhovat akce (`actions.propose`).
