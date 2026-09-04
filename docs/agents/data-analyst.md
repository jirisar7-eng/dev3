# Agent Documentation: DATA_ANALYST

**Název:** Data Analyst Agent  
**ID:** `DATA_ANALYST`  
**Stav implementace:** `EXPERIMENTAL`  
**Source of Truth:** ✅ VERIFIED (Registry/Catalog registered, `enabled: true`)  

---

## 1. Základní identifikace & Účel

- **Účel:** Čtení a agregace anonymizovaných provozních metrik a generování analytických přehledů pro administrátory.
- **Pro koho je určen:** Analytici, správci obsahu a administrátoři s přístupem k analytice.
- **Co umí:**
  - Čtení agregovaných statistik navštěvnosti a využití funkcí.
  - Generování souhrnných analytických zpráv (bez PII).
- **Co neumí:**
  - Neumí číst osobní údaje uživatelů (PII).
  - Neumí provádět zápis ani úpravy v databázi.
  - Neumí spouštět SQL dotazy mimo schválené metriky.
- **Kdy jej použít:** Při přípravě měsíčních přehledů využití portálu nebo kontrole výkonnosti funkcí.
- **Kdy jej nepoužívat:** Při pokusu o sledování konkrétního uživatele.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Analytický asistent pro vyhodnocování anonymních provozních dat.
- **K čemu to slouží?**  
  Poskytuje přehled o využívanosti jednotlivých kalkulaček a článků.
- **Co s tím můžu dělat?**  
  Položit dotaz na celkový počet výpočtů výživného za minulý měsíc.
- **Jak začít — krok za krokem:**
  1. Přihlaste se jako `ADMIN` do Admin Shellu.
  2. Otevřete záložku "Analytics / Data Analyst".
  3. Zadejte analytický dotaz.
  4. Získejte agregovaný přehled.
- **Jaký vstup potřebuji?**  
  Specifikace časového období a typu metriky.
- **Co dostanu jako výsledek?**  
  Agregovaná data a souhrnnou zprávu.
- **Jak poznám, že operace proběhla správně?**  
  Vrať přehled a v logu se zaznamená `analytics.read` s platným `traceId`.
- **Jaké jsou limity?**  
  Všechna data jsou přísně anonymizována.
- **Kdy potřebuji schválení administrátora?**  
  Čtení analytiky nevyžaduje schválení (`requiresHumanApproval: false`).
- **Co dělat při chybě?**  
  Zkontrolujte, zda dotaz nesměřuje na zakázané osobní údaje.
- **Bezpečnostní upozornění:**  
  Data neobsahují IP adresy ani e-maily uživatelů.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `DATA_ANALYST`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `analytics.read` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
  - `metrics.query` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
  - `report.generate` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
- **Allowed Scopes:** `analytics.read`, `metrics.query`, `report.generate`
- **RBAC Requirement:** Role `ADMIN` nebo `SUPER_ADMIN`.
- **Policy Engine:** Fail-closed při pokusu o přístup k PII.
- **ControlPlaneAuthorization:** Evaluováno přes `authorizeAgentRequest()`.
- **Allowed Providers:** `gemini`, `groq`
- **Trace Required:** `true`

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | 🟡 PROPOSED | UI rozhraní v Admin Shellu |
| **Backend** | PARTIAL | Registrovaný v registr a catalog |
| **API** | ⚪ NOT FOUND | Žádný samostatný endpoint |
| **Database** | ⚪ NOT FOUND | 0 schema mutation |
| **RBAC** | ✅ VERIFIED | Podléhá ControlPlaneAuthorization |
| **Policy Engine** | ✅ VERIFIED | Kontrola PII a zakázaných dat |
| **Audit** | ✅ VERIFIED | Logováno v OrionTraceStore |
| **Telemetry** | ✅ VERIFIED | Zaznamenávání dotazů |
| **AI Provider** | ✅ VERIFIED | Gemini & Grok |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1: Počet generování kalkulačky za měsíc**  
   - *Vstup:* "Souhrn výpočtů kalkulačky výživného za říjen."  
   - *Výsledek:* `ALLOW` — Vrácen agregovaný počet.
2. **Scénář 2: Nejčtenější články v sekci Rodina**  
   - *Vstup:* "Seznam 5 nejnavštěvovanějších článků."  
   - *Výsledek:* `ALLOW` — Anonymní statistika čtenosti.
3. **Scénář 3: Generování měsíčního reportu využití**  
   - *Vstup:* "Vygeneruj graf využití portálu."  
   - *Výsledek:* `ALLOW` — Souhrnný report.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Porovnání meziměsíčního růstu** 🟡 PROPOSED  
   - *Vstup:* Trend využití formulářů.  
   - *Výsledek:* Statistický přehled.
2. **Scénář 2 (Pokročilý): Analýza chybovosti vyplňování formulářů** 🟡 PROPOSED  
   - *Vstup:* Agregované chyby ve formulářích.  
   - *Výsledek:* Přehled problematických polí.

### Zakázané scénáře
1. **Zakázaný scénář 1: Dotaz na konkrétní e-mail uživatele**  
   - *Pokus:* "Ukaž mi co počítal uživatel user@test.cz."  
   - *Reakce:* `DENY` — PII únik je přísně blokován.
2. **Zakázaný scénář 2: Zákaz úpravy analytických dat**  
   - *Pokus:* "Smaž statistiky za minulý týden."  
   - *Reakce:* `DENY` — Agent nemá žádné zapisovací capabilities.
