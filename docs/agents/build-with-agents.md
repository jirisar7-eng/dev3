# Agent Documentation: BUILD_WITH_AGENTS

**Název:** Build With Agents  
**ID:** `BUILD_WITH_AGENTS`  
**Stav implementace:** `EXPERIMENTAL`  
**Source of Truth:** ✅ VERIFIED (Registry/Catalog registered, Execution Sandbox PROPOSED)  

---

## 1. Základní identifikace & Účel

- **Účel:** Deklarativní návrh, generování a konfigurace agentních definic a modulárních kódových struktur v rámci platformy Synthesis.
- **Pro koho je určen:** Vývojáři, systémoví architekti a administrátoři platformy Synthesis s oprávněním `project.manage` / `ADMIN` / `SUPER_ADMIN`.
- **Co umí:**
  - Generování návrhů deklarativních agentních rozhraní (`AgentType`, `capabilities`).
  - Generování zdrojového kódu pomocných modulů v TypeScriptu.
  - Příprava návrhů konfigurace bez přímého zápisu na disk či do DB.
- **Co neumí:**
  - Neumí přímý zápis na filesystem serveru (bez Human Approval a Control Plane).
  - Neumí spouštět shell příkazy, Docker kontejnerové operace ani databázové migrace.
  - Neumí obcházet RBAC ani měnit přístupová práva uživatelů.
- **Kdy jej použít:** Při návrhu nových modulů, šablonování nových agentních archetypů nebo přípravě TypeScript kódových fragmentů.
- **Kdy jej nepoužívat:** Při živé produkční úpravě databáze, při správě uživatelských účtů nebo při pokusu o přímý deploy.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Nástroj pro asistované navrhování a generování kódových struktur pro nové agenty v ekosystému Synthesis.
- **K čemu to slouží?**  
  Urychluje vývoj modulů a zajišťuje, že nový kód automaticky dodržuje bezpečnostní vzory Control Plane.
- **Co s tím můžu dělat?**  
  Zadat požadavek na strukturu agenta nebo funkci a získat zkontrolovaný návrh kódu.
- **Jak začít — krok za krokem:**
  1. Přihlaste se do Admin Shellu s adminským účtem.
  2. Otevřete záložku "Agent Studio / Builder".
  3. Zadejte specifikaci požadované funkce (např. "Navrhni kód pro validátor dokumentů").
  4. Počkejte na vygenerování návrhu v sandboxu.
  5. Provedené změny zkontrolujte a schvalte (Human Approval Gate).
- **Jaký vstup potřebuji?**  
  Textový popis požadované funkce nebo specifikace rozhraní v JSON/TypeScript.
- **Co dostanu jako výsledek?**  
  Strukturovaný návrh kódu nebo konfigurace (Draft).
- **Jak poznám, že operace proběhla správně?**  
  Systém vrátí stav `REQUIRE_HUMAN_APPROVAL` s platným `traceId` v protokolu OrionTraceStore.
- **Jaké jsou limity?**  
  Návrh neproběhne přímo do produkčního kódu; vyžaduje manuální review a schválení.
- **Kdy potřebuji schválení administrátora?**  
  Při KAŽDÉM použití capabilities `agent.build` nebo `code.generate` (`requiresHumanApproval: true`).
- **Co dělat při chybě?**  
  Zkontrolujte auditní protokol podle `traceId`. Ujistěte se, že váš uživatelský účet má roli `ADMIN` nebo `SUPER_ADMIN`.
- **Bezpečnostní upozornění:**  
  Vygenerovaný kód nespouštějte bez předchozí statické analýzy a schválení.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `BUILD_WITH_AGENTS`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `agent.build` (RiskLevel: `P2`, RequiresHumanApproval: `true`)
  - `code.generate` (RiskLevel: `P2`, RequiresHumanApproval: `true`)
- **Allowed Scopes:** `agent.build`, `code.generate`
- **RBAC Requirement:** Uživatel musí mít roli `ADMIN` nebo `SUPER_ADMIN` a capability `project.manage`.
- **Policy Engine:** Strict Fail-Closed. Pokus o přístup k `shell.execute` nebo `secrets.read` vyvolá P0 DENY.
- **ControlPlaneAuthorization:** Integrováno přes `authorizeAgentRequest()`.
- **Allowed Providers:** `gemini`, `grok`
- **Trace Required:** `true` (Použití je povinně zaznamenáváno do `OrionTraceStore`).
- **Input Validation:** Zpráva a kontext jsou sanitizovány protichybovými pravidly.
- **Output Validation:** Vygenerovaný kód prochází kontrolou zakázaných klíčových slov (shell/eval/exec).
- **Failure Behavior:** Při jakékoliv chybě vrací `DENY` se zaznamenaným selháním v auditním logu.

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | 🟡 PROPOSED | UI rozhraní v Admin Shellu je ve fázi návrhu |
| **Backend** | PARTIAL | Registrovaný v Registry & Capability Catalog |
| **API** | ⚪ NOT FOUND | Žádný execution endpoint neexistuje |
| **Database** | ⚪ NOT FOUND | Žádné databázové tabulky (0 schema mutation) |
| **RBAC** | ✅ VERIFIED | Podléhá ControlPlaneAuthorization a `getUserCapabilities()` |
| **Policy Engine** | ✅ VERIFIED | Vyžaduje Human Approval, blokuje P0 zakázané operace |
| **Audit** | ✅ VERIFIED | `traceRequired: true`, svázáno s OrionTraceStore |
| **Telemetry** | ✅ VERIFIED | Zaznamenávání do audit protokolu |
| **AI Provider** | ✅ VERIFIED | Gemini & Grok konektory |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1 (Běžný): Návrh nového pomocného typu**  
   - *Vstup:* "Vytvoř TypeScript rozhraní pro vyhledávání judikátů."  
   - *Výsledek:* Agent vygeneruje rozhraní v draftu. Vyžaduje schválení administrátorem (`REQUIRE_HUMAN_APPROVAL`).
2. **Scénář 2 (Běžný): Generování šablony validátoru**  
   - *Vstup:* "Vygeneruj funkci pro kontrolu formátu IČO."  
   - *Výsledek:* Čistá funkce v TypeScriptu vrácená v odpovědi.
3. **Scénář 3 (Běžný): Refaktorování typu odpovědi**  
   - *Vstup:* "Přidej pole createdAt do typu DTO."  
   - *Výsledek:* Návrh aktualizovaného typu.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Generování komplexní specifikace agentní capability** 🟡 PROPOSED  
   - *Vstup:* "Navrhni definici capability pre OCR zpracování."  
   - *Výsledek:* Vygenerovaný objekt `AgentCapability` s určeným RiskLevel `P3`.
2. **Scénář 2 (Pokročilý): Audit generovaných typů vůči skriptům** 🟡 PROPOSED  
   - *Vstup:* "Zkontroluj zda navržené DTO odpovídá OpenAPI schématu."  
   - *Výsledek:* Report nesrovnalostí.

### Zakázané scénáře (NESMÍ SE POUŽÍT)
1. **Zakázaný scénář 1: Přímý zápis na disk serveru**  
   - *Pokus:* "Zapiš tento vygenerovaný soubor přímo do `/src/services/newService.ts`."  
   - *Reakce systému:* `DENY` — Agent nemá oprávnění k zápisu na filesystem.
2. **Zakázaný scénář 2: Spuštění shell příkazu pro instalaci balíčku**  
   - *Pokus:* "Spusť `npm install lodash`."  
   - *Reakce systému:* `DENY` — Capability `shell.execute` je striktně zakázána (P0 Policy).

---

## 6. Omezení & Bezpečnostní pravidla

- **Čtení:** Pouze veřejné deklarativní typy a konfigurace.
- **Vytváření:** Pouze in-memory návrhy (Drafts).
- **Změny:** Žádné přímé změny v kódové bázi bez schválení uživatelem.
- **Zakázané akce:** Shell, Docker, DB push, secrets access, file system write.
- **Audit:** Všechna volání jsou logována s uníkatním `traceId`.
