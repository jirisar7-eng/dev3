# Agent Documentation: ANTIGRAVITY_PREVIEW

**Název:** Antigravity Preview  
**ID:** `ANTIGRAVITY_PREVIEW`  
**Stav implementace:** `EXPERIMENTAL`  
**Source of Truth:** ✅ VERIFIED (Registry/Catalog registered)  

---

## 1. Základní identifikace & Účel

- **Účel:** Bezpečné renderování a inspekce UI komponent v izolovaném klientském sandboxu v rámci Admin Shellu.
- **Pro koho je určen:** UI/UX vývojáři, testeři a správci obsahu.
- **Co umí:**
  - Inspekovat strukturu klientských React komponent.
  - Generovat a zobrazovat vizuální náhledy UI prvků.
- **Co neumí:**
  - Neumí provádět backendové API změny.
  - Neumí obcházet klientské bezpečnostní hranice iframe sandboxu.
  - Neumí přistupovat k produkčním datům databáze.
- **Kdy jej použít:** Při vývoji nových UI prvků, testování responzivity a kontrole vizuálních stylů.
- **Kdy jej nepoužívat:** Při zpracování citlivých osobních údajů nebo při pokusu o spuštění backendové logiky.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Náhledový modul pro bezpečnou prezentaci a inspekci uživatelského rozhraní.
- **K čemu to slouží?**  
  Umožňuje vidět živý náhled komponent bez rizika poškození produkčního stavu.
- **Co s tím můžu dělat?**  
  Zobrazit náhled formulářů, tlačítkových panelů a vizuálních karet.
- **Jak začít — krok za krokem:**
  1. Otevřete Admin Shell -> "Preview Studio".
  2. Vyberte požadovanou UI komponentu ze seznamu.
  3. Klikněte na "Zobrazit náhled".
  4. Zkontrolujte strukturu v náhledovém okně.
- **Jaký vstup potřebuji?**  
  Název komponenty nebo deklarativní JSON specifikace vlastností (props).
- **Co dostanu jako výsledek?**  
  Vizuální náhled v izolovaném klientském okně.
- **Jak poznám, že operace proběhla správně?**  
  UI se vykreslí bez konzolových chyb a v auditním logu se objeví záznam inspekce.
- **Jaké jsou limity?**  
  Komponenty nemají přístup k živým produkčním databázím.
- **Kdy potřebuji schválení administrátora?**  
  Capability `preview.render` vyžaduje schválení (`requiresHumanApproval: true`).
- **Co dělat při chybě?**  
  Obnovte náhledové okno nebo zkontrolujte platnost zadávaných props.
- **Bezpečnostní upozornění:**  
  V náhledu nevkládejte reálná hesla ani API klíče.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `ANTIGRAVITY_PREVIEW`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `preview.render` (RiskLevel: `P3`, RequiresHumanApproval: `true`)
  - `ui.inspect` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
- **Allowed Scopes:** `preview.render`, `ui.inspect`
- **RBAC Requirement:** Uživatel musí mít roli `ADMIN` nebo `SUPER_ADMIN`.
- **Policy Engine:** Strict Fail-Closed.
- **ControlPlaneAuthorization:** Vyhodnocováno přes `authorizeAgentRequest()`.
- **Allowed Providers:** `gemini`
- **Trace Required:** `true`
- **Input Validation:** Sanitizace props a komponentních názvů.
- **Output Validation:** HTML/JSX sanitizace proti XSS.
- **Failure Behavior:** Vrací chybový stav náhledu bez pádu aplikace.

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | 🟡 PROPOSED | Náhledový klientský modul je v návrhu |
| **Backend** | PARTIAL | Deklarativní registr v registry a katalogu |
| **API** | ⚪ NOT FOUND | Žádný backend execution endpoint |
| **Database** | ⚪ NOT FOUND | 0 schema mutation |
| **RBAC** | ✅ VERIFIED | Podléhá RBAC autorizaci |
| **Policy Engine** | ✅ VERIFIED | Vyžaduje schválení pro render |
| **Audit** | ✅ VERIFIED | Svázáno s OrionTraceStore |
| **Telemetry** | ✅ VERIFIED | Auditované události inspekce |
| **AI Provider** | ✅ VERIFIED | Gemini konektor |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1: Náhled tlačítka v Admin Shellu**  
   - *Vstup:* Component `PrimaryButton` s props `{ label: "Uložit" }`.  
   - *Výsledek:* Vykreslený klientský prvek v náhledu.
2. **Scénář 2: Inspekce stromu komponent**  
   - *Vstup:* Dotaz na strukturu `CaseCard`.  
   - *Výsledek:* Zobrazení vlastností a podřazených prvků.
3. **Scénář 3: Test responzivity karet**  
   - *Vstup:* Vykreslení mobilního pohledu karty.  
   - *Výsledek:* Korektní přizpůsobení šířce okna.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Inspekce temného režimu** 🟡 PROPOSED  
   - *Vstup:* Prepnutí do dark mode v náhledu.  
   - *Výsledek:* Zobrazení s korektním kontrastem.
2. **Scénář 2 (Pokročilý): Validace prístupnosti (WCAG)** 🟡 PROPOSED  
   - *Vstup:* Inspekce ARIA atributů karty.  
   - *Výsledek:* Zpráva o prístupnosti.

### Zakázané scénáře
1. **Zakázaný scénář 1: Zpracování reálných tokenů v náhledu**  
   - *Pokus:* Připojení živého JWT tokenu do props.  
   - *Reakce:* `DENY` — Systém neumožňuje předávat tajné klíče do náhledového prostředí.
2. **Zakázaný scénář 2: Pokus o spuštění serverového skriptu**  
   - *Pokus:* Spuštění backendové akce z náhledu.  
   - *Reakce:* `DENY` — Náhled je přísně izolovaný na klientské straně.
