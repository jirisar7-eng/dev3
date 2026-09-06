# Agent Documentation: CUSTOMER_SUPPORT

**Název:** Customer Support Agent  
**ID:** `CUSTOMER_SUPPORT`  
**Stav implementace:** `PROPOSED` (`DISABLED`)  
**Source of Truth:** 🟡 PROPOSED (V registru s `enabled: false`)  

---

## 1. Základní identifikace & Účel

- **Účel:** Asistence návštěvníkům webu s odpověďmi na nejčastější dotazy (FAQ) a navigací v portálu.
- **Pro koho je určen:** Anonymní návštěvníci a registrovaní uživatelé portálu.
- **Co umí (Navrženo):**
  - Vyhledávání v databázi FAQ a nápovědě.
  - Generování návrhu odpovedi na uživatelský dotaz.
- **Co neumí:**
  - Neumí poskytovat právní poradenství.
  - Neumí měnit stav uživatelských účtů ani tiketů.
  - V současnosti je zakázán (`enabled: false`).
- **Kdy jej použít:** Po aktivaci pro zodpovídání běžných provozních dotazů.
- **Kdy jej nepoužívat:** Při požadování právního posouzení případu.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Asistent zákaznické podpory pro rychlé vyhledání informací v nápovědě.
- **K čemu to slouží?**  
  Pomáhá uživatelům najít správné návody a odpovědi na technické dotazy.
- **Co s tím můžu dělat?**  
  V současné fázi je agent neaktivní (`enabled: false`).
- **Jak začít — krok za krokem:**  
  Funkce je ve fázi návrhu. Po aktivaci se zobrazí v pravém dolním rohu portálu.
- **Jaký vstup potřebuji?**  
  Dotaz k používání aplikace.
- **Co dostanu jako výsledek?**  
  Odkaz na nápovědu nebo stručnou odpověď.
- **Jak poznám, že operace proběhla správně?**  
  Požadavek nyní vrací `DENY: Agent 'CUSTOMER_SUPPORT' is disabled`.
- **Jaké jsou limity?**  
  Poskytuje pouze technickou a provozní nápovědu, nikoliv právní rady.
- **Kdy potřebuji schválení administrátora?**  
  Návrh odpovědi nevyžaduje schválení, ale agent samotný vyžaduje administrátorskou aktivaci.
- **Co dělat při chybě?**  
  Využijte kontaktní formulář podpory.
- **Bezpečnostní upozornění:**  
  Asistent neposkytuje závazné právní informace.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `CUSTOMER_SUPPORT`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `faq.read` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
  - `ticket.read` (RiskLevel: `P2`, RequiresHumanApproval: `false`)
  - `support.respond` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
- **Allowed Scopes:** `faq.read`, `ticket.read`, `support.respond`
- **RBAC Requirement:** Uživatel / Anonym.
- **Policy Engine:** Strict DENY z důvodu `enabled: false`.
- **ControlPlaneAuthorization:** `authorizeAgentRequest()` vrací `DENY`.
- **Allowed Providers:** `gemini`, `groq`
- **Trace Required:** `true`

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | ⚪ NOT FOUND | Žádné widgety |
| **Backend** | 🟡 PROPOSED | Záznam v registru (`enabled: false`) |
| **API** | ⚪ NOT FOUND | Žádné API |
| **Database** | ⚪ NOT FOUND | 0 schema mutation |
| **RBAC** | ✅ VERIFIED | Podléhá autorizaci |
| **Policy Engine** | ✅ VERIFIED | Blokováno deaktivací |
| **Audit** | ⚪ NOT FOUND | Neaktivní |
| **Telemetry** | ⚪ NOT FOUND | Neaktivní |
| **AI Provider** | 🟡 PROPOSED | Gemini / Grok |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1: Pokus o dotaz na jak resetovat heslo (Neaktivní)** 🟡 PROPOSED  
   - *Vstup:* "Jak si změním heslo?"  
   - *Výsledek:* `DENY` — Agent je zakázán.
2. **Scénář 2: Vyhledání návodu pro kalkulačku výživného** 🟡 PROPOSED  
   - *Vstup:* "Kde najdu kalkulačku?"  
   - *Výsledek:* `DENY`.
3. **Scénář 3: Dotaz na ceník služeb** 🟡 PROPOSED  
   - *Vstup:* "Je aplikace zdarma?"  
   - *Výsledek:* `DENY`.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Automatická kategorizace tiketu** 🟡 PROPOSED  
   - *Vstup:* Přečtení stavu tiketu.  
   - *Výsledek:* `DENY`.
2. **Scénář 2 (Pokročilý): Generování návrhu odpovědi podpory** 🟡 PROPOSED  
   - *Vstup:* Šablona odpovědi.  
   - *Výsledek:* `DENY`.

### Zakázané scénáře
1. **Zakázaný scénář 1: Žádost o právní posouzení rozvodu**  
   - *Pokus:* "Napiš mi jak vyhrát soudní spor."  
   - *Reakce:* `DENY` — Podpora nesmí dávat právní rady.
2. **Zakázaný scénář 2: Čtení cizích tiketů bez oprávnění**  
   - *Pokus:* Přístup k tiketu jiného uživatele.  
   - *Reakce:* `DENY` — RBAC izolace uživatelů.
