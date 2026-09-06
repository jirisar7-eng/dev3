# Agent Documentation: AI_TALK_RADIO

**Název:** AI Talk Radio  
**ID:** `AI_TALK_RADIO`  
**Stav implementace:** `PROPOSED` (`DISABLED`)  
**Source of Truth:** 🟡 PROPOSED (V registru s `enabled: false`, nepovoleno pro produkční spuštění)  

---

## 1. Základní identifikace & Účel

- **Účel:** Syntéza mluveného slova a zvukových relací z veřejně přístupných právních článek a zpráv pro projekt Táta má právo.
- **Pro koho je určen:** Veřejní návštěvníci a posluchači audio obsahu.
- **Co umí (Navrženo):**
  - Čtení schválených veřejných článků.
  - Generování návrhu hlasové syntézy.
- **Co neumí:**
  - Neumí přistupovat k neveřejným uživatelským spisu ani datům.
  - Neumí generovat nepodložený nebo nevytvořený právní obsah.
  - V současném stavu je vypnutý (`enabled: false`).
- **Kdy jej použít:** Po schválení a aktivaci pro tvorbu přístupných audio verze článek.
- **Kdy jej nepoužívat:** V současnosti nelze použít. Veškeré požadavky vrací `DENY`.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Plánovaný audio modul pro převod právních textů na mluvené slovo.
- **K čemu to slouží?**  
  Zvýšení přístupnosti obsahu pro zrakově postižené a uživatele preferující audio.
- **Co s tím můžu dělat?**  
  V současné fázi je modul vypnutý a nepřístupný.
- **Jak začít — krok za krokem:**
  1. Funkce je navržena (`PROPOSED`), ale neaktivní.
  2. Po spuštění bude dostupná v sekci "Audio zprávy".
- **Jaký vstup potřebuji?**  
  Schválený text článku.
- **Co dostanu jako výsledek?**  
  Zvukový soubor / stream.
- **Jak poznám, že operace proběhla správně?**  
  V současnosti vrací `DENY: Agent 'AI_TALK_RADIO' is disabled`.
- **Jaké jsou limity?**  
  Funkce je zakázána až do produkčního schválení.
- **Kdy potřebuji schválení administrátora?**  
  Spuštění vyžaduje aktivaci a schválení administrátorem.
- **Co dělat při chybě?**  
  Chyba je očekávaná, jelikož agent je vypnutý.
- **Bezpečnostní upozornění:**  
  Neobsahuje žádný přístup k soukromým datům.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `AI_TALK_RADIO`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `audio.synthesize` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
  - `content.read` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
- **Allowed Scopes:** `audio.synthesize`, `content.read`
- **RBAC Requirement:** Veřejný čtenář / USER.
- **Policy Engine:** Absolute DENY z důvodu `enabled: false`.
- **ControlPlaneAuthorization:** Metoda `authorizeAgentRequest()` okamžitě vrací `DENY`.
- **Allowed Providers:** `gemini`
- **Trace Required:** `true`

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | ⚪ NOT FOUND | Žádná UI komponenta |
| **Backend** | 🟡 PROPOSED | Deklarativní záznam v registru (`enabled: false`) |
| **API** | ⚪ NOT FOUND | Žádné API endpointy |
| **Database** | ⚪ NOT FOUND | 0 schema mutation |
| **RBAC** | ✅ VERIFIED | Podléhá autorizaci |
| **Policy Engine** | ✅ VERIFIED | Okamžitý DENY z důvodu deaktivace |
| **Audit** | ⚪ NOT FOUND | Neaktivní agent negeneruje stopy |
| **Telemetry** | ⚪ NOT FOUND | Žádná telemetrie |
| **AI Provider** | 🟡 PROPOSED | Plánován konektor Gemini |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1: Pokus o spuštění syntézy (Deaktivovaný agent)** 🟡 PROPOSED  
   - *Vstup:* Požadavek na hlasové přečtení článku ID 123.  
   - *Výsledek:* `DENY` — Agent je zakázán (`enabled: false`).
2. **Scénář 2: Náhled audio verze v administraci** 🟡 PROPOSED  
   - *Vstup:* Žádost o vytvoření audio stopy v testovacím režimu.  
   - *Výsledek:* `DENY` — Vyžaduje aktivaci v registru.
3. **Scénář 3: Čtení veřejného nadpisu** 🟡 PROPOSED  
   - *Vstup:* Název článku.  
   - *Výsledek:* `DENY`.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Generování podcastového přehledu týdne** 🟡 PROPOSED  
   - *Vstup:* Souhrn 5 článků.  
   - *Výsledek:* `DENY`.
2. **Scénář 2 (Pokročilý): Hlasová syntéza v různých jazycích** 🟡 PROPOSED  
   - *Vstup:* Český text.  
   - *Výsledek:* `DENY`.

### Zakázané scénáře
1. **Zakázaný scénář 1: Pokus o přečtení neveřejného spisu**  
   - *Pokus:* Syntéza citlivého soudního dokumentu.  
   - *Reakce:* `DENY` — Agent má přístup výhradně k veřejnému obsahu.
2. **Zakázaný scénář 2: Obcházení stavu DISABLED**  
   - *Pokus:* Přímé volání `checkAccess('AI_TALK_RADIO', 'audio.synthesize')`.  
   - *Reakce:* `allowed: false` — Registr striktně blokuje deaktivované agenty.
