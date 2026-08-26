# IMPLEMENTAČNÍ PLÁN & ARCHITEKTONICKÝ NÁVRH: AI SIMULATOR – SPRÁVA SCÉNÁŘŮ

**Projekt:** Táta má právo (`dev3`)
**Datum:** 25. srpna 2026
**Autor:** Hlavní softwarový architekt, DevSecOps inženýr & QA auditor
**Typ dokumentu:** READ-ONLY ARCHITECTURAL & IMPLEMENTATION SPECIFICATION
**Vazba na předchozí audit:** `docs/audit/AUDIT_2026-08-25_P0_AI_INTERACTION_CONSISTENCY_AUDIT.md`
**Stav:** READY FOR REVIEW (Nulové zásahy do kódu / databáze / Git repozitáře)

---

## 1. EXECUTIVE SUMMARY

Tento dokument představuje ucelený architektonický a implementační návrh na převod stávajících statických (hardcoded) AI Roleplay scénářů do **plně dynamického, databázově řízeného a bezpečně auditovatelného systému správy scénářů v administraci portálu „Táta má právo“**.

### Klíčové cíle návrhu:
1. **Separace obsahu od kódu:** Umožnit Super Adminům a administrátorům s odpovídajícím oprávněním vytvářet, upravovat, verzovat, testovat a aktivovat scénáře bez nutnosti nasazování nové verze aplikace.
2. **Eliminace bezpečnostních rizik (P0):** Odstranit posílání klientských systémových promptů na backend (`req.body.systemPrompt`) a zabránit nekontrolované injektáži systémových instrukcí z administrátorského formuláře přímo do LLM providerů.
3. **Zamezení halucinacím (P0 Data Integrity):** Zavedení striktních struktur **`KNOWN_FACTS`** a **`FORBIDDEN_CLAIMS`** pro každý scénář, které ohraničují znalostní bázi modelu a zabraňují vymýšlení lékařských diagnóz, soudních výroků či nových skutkových okolností.
4. **Priorita poslední zprávy (Last-Message Dominance):** Architektura promptu odděluje historii konverzace od poslední reakce uživatele (`priority="CRITICAL_HIGHEST"`), čímž zaručuje bezprostřední a konzistentní reakci na afekt, vulgarismus či věcný argument.
5. **Nulové fake-data fallbacky:** Totální vymýcení klientských a serverových falešných odpovědí simulujících funkční AI při výpadku sítě nebo rate limitu.

---

## 2. SOUČASNÝ STAV & INVENTÁŘ SCÉNÁŘŮ

### 2.1 Kde jsou scénáře definovány dnes
Všechny scénáře AI Simulátoru jsou v současnosti pevně zakódovány v jediném klientském souboru:
- **Umístění:** `src/components/public/ai/AiSimulatorView.tsx` (řádky 34–59)
- **Konstanta:** `const SCENARIOS = [...]`
- **Počet nalezených scénářů:** **3**
- **Stav scénářů v UI:** Všechny 3 jsou trvale viditelné pro všechny návštěvníky bez možnosti administrátorského zásahu.

### 2.2 Inventář současných scénářů

| ID (Slug) | Název scénáře | Ikona | Popis v UI | Role AI (`counterpartName`) | Úvodní zpráva (`initialMessage`) |
|---|---|---|---|---|---|
| `predani-ditete` | Předávání dítěte u domu matky | `UserX` | Stresová situace předání dítěte za přítomnosti babičky nebo nového partnera. | Matka / Příbuzný | *„Ahoj, malá dneska trošku pokašlává a nechce se jí s tebou nikam jet. Myslím, že by bylo lepší, kdybys přijel až příští týden.“* |
| `vyslech-u-soudu` | Výslech u opatrovnického soudu | `Scale` | Kladené otázky samosoudce a advokáta protistrany k vašemu pracovnímu vytížení a péči. | Soudce / Advokát matky | *„Pane otče, z podkladů vyplývá, že pracujete v manažerské pozici. Jak konkrétně chcete skloubit náročnou práci s plnohodnotnou péčí o tříleté dítě?“* |
| `jednani-ospod` | Jednání na OSPODu | `Building2` | Pohovor se sociální pracovnicí, která zpochybňuje přespávání kojence/batolete. | Pracovnice OSPOD | *„Dobrý den pane otče. Matka poukazuje na to, že dítě je v noci neklidné, když přespává u vás. Doporučuji zatím přespávání pozastavit a scházet se jen na pár hodin bez přespání.“* |

*Poznámka:* V repozitáři nebyly nalezeny žádné další skryté ani neaktivní roleplay scénáře.

### 2.3 Forenzní analýza datového toku a slabin

```
[ Frontend: AiSimulatorView ]
  ├── 1. Výběr scénáře: lokální React state (selectedScenarioId)
  ├── 2. Odeslání zprávy: POST /api/ai/chat
  │      └── Body obsahuje: { messages, systemPrompt: "Simuluješ hraní rolí..." }
  ├── 3. Selhání / 429: Aktivace getFallbackCounterpartReply(scenarioId)
  │      └── Vrací pevný text (např. o lékaři), model není vůbec kontaktován
  └── 4. Hodnocení: POST /api/ai/simulator-evaluate
         └── Při chybě se vrací pevný objekt: emotionalityScore: 18, objectivityScore: 88...
```

**Slabiny současného stavu:**
1. **Frontend-driven System Prompt:** Klient sestavuje text instrukce pro model a posílá jej po síti.
2. **Chybějící granularita pravidel:** Scénář nemá definováno, co je dovoleno tvrdit a co je zakázáno.
3. **Pevný tichý fallback:** Uživatel dostane smyšlenou odpověď, která vyvolává dojem chyby v porozumění modelu.

---

## 3. ANALÝZA EXISTUJÍCÍ PRISMA DATABÁZE

V rámci auditu `prisma/schema.prisma` bylo analyzováno celkem **64 existujících modelů** a jejich použitelnost pro AI scénáře:

### 3.1 Prozkoumané existující modely
1. **`CustomModule` / `Module` / `ModuleSetting`:**
   - *Účel:* Slouží pro dynamické zapínání/vypínání modulů celého webu, správu widgetů na domovské stránce a definici oprávnění k modulům.
   - *Důvod nevhodnosti:* Modely jsou optimalizovány pro layout a konfiguraci stránek (JSON parametry). Neobsahují stavový lifecycle roleplay scénářů, verzování, AI role ani pravidla pro fakta a evaluaci.
2. **`PageTemplate` / `Template`:**
   - *Účel:* Slouží pro Puck editor stránek a šablony obsahu (`puckDataJson`).
   - *Důvod nevhodnosti:* Sémanticky zcela odlišná doména (CMS šablony layoutu).
3. **`Quiz` / `QuizQuestion`:**
   - *Účel:* Vzdělávací kvízy a testy znalostí uživatelů.
   - *Důvod nevhodnosti:* Obsahuje otázky a pevné odpovědi, neumožňuje dynamický dialog ani LLM guardraily.
4. **`AuditLog`:**
   - *Účel:* Centralizovaný neměnný auditní log všech systémových a administrativních operací.
   - **Vhodnost pro znovupoužití: 100 % (ANO).** Auditní záznamy o změnách scénářů, aktivacích a archivacích budou plně integrovány do stávajícího modelu `AuditLog` s modulem `"AI_SIMULATOR"`.

### 3.2 Závěr analýzy Prisma
Pro zajištění čisté architektury, typové bezpečnosti a výkonu **je nezbytné vytvořit dedikovaný model `AiSimulatorScenario`** a doprovodný model pro historii verzí `AiSimulatorScenarioVersion`. Žádný z existujících modelů neposkytuje dostatečnou strukturu pro bezpečné řízení AI interakcí.

---

## 4. NAVRŽENÝ DATOVÝ MODEL (PRISMA SCHEMA BLUEPRINT)

Následující návrh představuje čistý, vysoce indexovaný datový model respektující existující konvence projektu `dev3`:

```prisma
// ------------------------------------------------------
// AI SIMULATOR & ROLEPLAY SCENARIOS
// ------------------------------------------------------

enum ScenarioStatus {
  DRAFT
  ACTIVE
  INACTIVE
  ARCHIVED
}

enum ScenarioDifficulty {
  BEGINNER     // Mírný tlak, jasné argumentační body
  INTERMEDIATE // Běžný opatrovnický konflikt, emocionální výpady
  ADVANCED     // Manipulativní techniky, právní pasti, vysoký stres
}

enum ScenarioCategory {
  HANDOVER     // Předávání dětí a styk
  COURT        // Opatrovnický soud, výslechy, znalci
  OSPOD        // Orgán sociálně-právní ochrany dětí
  COMMUNICATION// Písemná komunikace, SMS, e-maily
  CRISIS       // Akutní krize, asistence PČR
}

model AiSimulatorScenario {
  id               String             @id @default(uuid())
  slug             String             @unique // např. "predani-ditete-u-domu-matky"
  title            String
  shortDescription String
  category         ScenarioCategory   @default(HANDOVER)
  difficulty       ScenarioDifficulty @default(INTERMEDIATE)
  iconName         String             @default("UserX") // Název Lucide ikony

  // Roleplay definice
  aiRoleName       String             // např. "Matka / Nový partner"
  initialMessage   String             @db.Text

  // Řízená strukturovaná data (Guardrails)
  knownFacts       Json               // string[] - Fakta, která AI zná a smí použít
  allowedBehaviors Json               // string[] - Povolené taktiky protistrany
  forbiddenClaims  Json               // string[] - Striktní zákaz tvrzení (lékař, rozsudek...)
  evaluationRules  Json               // StructuredEvaluationCriteria

  // Stav a řazení
  status           ScenarioStatus     @default(DRAFT)
  sortOrder        Int                @default(0)
  version          Int                @default(1)

  // Systémové a auditní vazby
  isSystem         Boolean            @default(false) // Výchozí systémové scénáře
  createdById      String?
  createdBy        User?              @relation("ScenarioCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedById      String?
  updatedBy        User?              @relation("ScenarioUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  archivedAt       DateTime?

  // Vazba na historii verzí
  versions         AiSimulatorScenarioVersion[]

  @@index([status])
  @@index([category])
  @@index([sortOrder])
  @@index([slug])
}

model AiSimulatorScenarioVersion {
  id          String              @id @default(uuid())
  scenarioId  String
  scenario    AiSimulatorScenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  version     Int
  snapshot    Json                // Kompletní JSON snapshot scénáře v dané verzi
  changeNote  String?             // Poznámka autora k provedené změně
  createdById String?
  createdBy   User?               @relation("ScenarioVersionCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt   DateTime            @default(now())

  @@unique([scenarioId, version])
  @@index([scenarioId])
}
```

### 4.1 Detailní specifikace JSON struktur (TypeScript Interfaces)

Pro zajištění striktní typové kontroly a validace pomocí Zod schémat:

```typescript
// Známá fakta o situaci
export type KnownFacts = string[];

// Povolené chování protistrany
export type AllowedBehaviors = string[];

// Zakázaná tvrzení pro zamezení halucinacím
export type ForbiddenClaims = string[];

// Pravidla a váhy hodnocení
export interface EvaluationCriteria {
  emotionalityWeight: number;    // např. 0.35 (důraz na klid)
  objectivityWeight: number;      // např. 0.40 (důraz na fakta a BIFF)
  legalTacticsWeight: number;     // např. 0.25 (důraz na procesní opatrnost)
  keyObjectives: string[];        // Co má otec v situaci primárně dosáhnout
  criticalMistakes: string[];     // Chyby, které vedou k okamžitému snížení skóre
  customFeedbackPrompt?: string;  // Doplňující instrukce pro hodnotící model
}
```

---

## 5. STAVOVÝ LIFECYCLE SCÉNÁŘE

Životní cyklus scénáře sleduje přísný stavový diagram zaručující stabilitu produkčního prostředí:

```
                  ┌──────────────┐
                  │    DRAFT     │ <── Vytvoření / Editace ve vývoji
                  └──────┬───────┘
                         │ Testování v Admin UI (PASS)
                         ▼
                  ┌──────────────┐
  Deaktivace      │    ACTIVE    │ ─── Zobrazeno v klientském UI
  ┌────────────── │  (Produkce)  │ <── Aktivace
  │               └──────┬───────┘
  ▼                      │
┌──────────────┐         │
│   INACTIVE   │ ────────┘
└──────┬───────┘
       │
       │ Archivace
       ▼
┌──────────────┐
│   ARCHIVED   │ ─── Trvale skryto, pouze pro auditní historii
└──────────────┘
```

### Pravidla přechodu mezi stavy:
1. **`DRAFT`:**
   - Nově vytvořený nebo rozpracovaný scénář.
   - Není viditelný na veřejném portálu.
   - Lze jej spustit a interaktivně vyzkoušet výhradně v testovacím režimu administrace.
2. **`ACTIVE`:**
   - Plně validovaný scénář dostupný běžným uživatelům na `/ai-simulator`.
   - Aktivaci může provést pouze administrátor s právem publikace po úspěšném testovacím běhu.
3. **`INACTIVE`:**
   - Scénář je dočasně stažen z nabídky pro uživatele (např. při revizi legislativy nebo přepracování dialogu).
   - Historická data a testy zůstávají zachovány.
4. **`ARCHIVED`:**
   - Ukončený scénář, který již nemá být používán.
   - Záznam je uzamčen pro další úpravy (read-only) a uchován pro integritu auditní stopy.

---

## 6. RBAC & OPRÁVNĚNÍ

Návrh plně integruje stávající systém rolí v `dev3` (`UserRoleType` a `authMiddleware.ts`):

| Role | Zobrazení scénářů | Vytvoření DRAFT | Editace / Testování | Aktivace / Deaktivace | Archivace / Smazání |
|---|:---:|:---:|:---:|:---:|:---:|
| **SUPER_ADMIN** | Plný přístup | ANO | ANO | ANO | ANO (vč. systémových) |
| **ADMIN** | Plný přístup | ANO | ANO | ANO | ANO (mimo systémové) |
| **CONTENT_MANAGER** | Plný přístup | ANO | ANO | ANO | NE |
| **LEGAL_EDITOR** | Plný přístup | ANO (návrh) | ANO (právní fakta) | NE | NE |
| **MODERATOR** | Pouze čtení | NE | NE | NE | NE |
| **USER / Veřejnost** | Pouze ACTIVE | NE | NE | NE | NE |

**Zabezpečení MFA (2FA):**
Všechny administrativní operace nad scénáři (`POST`, `PATCH`, `DELETE`) vyžadují aktivní a ověřené 2FA (vynuceno přes `checkUserStatusAndMfa`).

---

## 7. NÁVRH ADMINISTRACE (ADMIN UI)

V administraci vznikne nová záložka v rámci sekce AI / Obsah: **`AI Simulator → Scénáře`** (`AdminDashboard.tsx`, tab: `'simulator-scenarios'`).

### 7.1 Seznam scénářů (Data Grid)
- **Filtry a vyhledávání:**
  - Podle stavu (`Vše`, `ACTIVE`, `DRAFT`, `INACTIVE`, `ARCHIVED`)
  - Podle kategorie (`Předávání`, `Soud`, `OSPOD`, `Komunikace`)
  - Podle obtížnosti (`Začátečník`, `Pokročilý`, `Expert`)
- **Sloupce tabulky:**
  1. **Pořadí / Ikona:** Drag-and-drop rukojeť pro seřazení + vizuální Lucide ikona.
  2. **Název a slug:** Název scénáře a systémový identifikátor.
  3. **Kategorie a role:** Štítek kategorie + název protistrany (např. *Pracovnice OSPOD*).
  4. **Obtížnost:** Barevný badge (Zelená = Začátečník, Žlutá = Pokročilý, Červená = Expert).
  5. **Stav:** Interaktivní přepínač (Active / Draft / Inactive).
  6. **Verze & Změna:** Číslo verze (`v2`), datum poslední změny a autor.
  7. **Rychlé akce:**
     - ✏️ **Upravit:** Otevře editační formulář.
     - 🧪 **Testovat (Playground):** Otevře integrovaný testovací simulátor.
     - 📋 **Duplikovat:** Vytvoří kopii jako `DRAFT`.
     - 📦 **Archivovat:** Bezpečná archivace scénáře.

### 7.2 Formulář pro vytvoření / úpravu scénáře
Formulář je rozdělen do 4 logických karet pro přehlednost a eliminaci chyb:

1. **Základní informace:**
   - Název scénáře (např. *Předávání dítěte za asistence PČR*)
   - Slug (automaticky generován, editovatelný)
   - Popis pro uživatele (zobrazí se na kartě v simulátoru)
   - Kategorie, obtížnost, výběr ikony a pořadí zobrazení
2. **Roleplay & Dialog:**
   - Název role AI (např. *Policista / Hlídka PČR*)
   - Úvodní zpráva simulace (první replika protistrany)
   - Povolené taktiky chování (seznam povolených reakcí)
3. **Faktické mantinely (Guardrails):**
   - **`KNOWN_FACTS` (Známá fakta):** Přidávání jednotlivých faktických bodů (např. *„Otec má platný rozsudek o styku na sudé víkendy.“*).
   - **`FORBIDDEN_CLAIMS` (Zakázaná tvrzení):** Striktní negativní mantinely (např. *„Nesmí tvrdit, že byl vydán nový rozsudek.“*).
4. **Hodnoticí kritéria:**
   - Nastavení vah pro emotivitu, věcnost a taktiku
   - Klíčové cíle pro otce (co má v dialogu splnit)
   - Kritické chyby (co vede k penalizaci)

---

## 8. NÁVRH API ENDPOINTŮ

Všechny endpointy respektují REST konvence a standardy `dev3`:

### 8.1 Veřejné endpointy (Klientská zóna)

#### `GET /api/ai/simulator/scenarios`
- **Oprávnění:** Veřejné (Public)
- **Popis:** Vrátí seznam všech scénářů ve stavu `ACTIVE` seřazených podle `sortOrder`.
- **Response:**
  ```json
  [
    {
      "id": "c4b8e210-...",
      "slug": "predani-ditete",
      "title": "Předávání dítěte u domu matky",
      "shortDescription": "Stresová situace předání dítěte...",
      "category": "HANDOVER",
      "difficulty": "INTERMEDIATE",
      "iconName": "UserX",
      "aiRoleName": "Matka / Příbuzný",
      "initialMessage": "Ahoj, malá dneska trošku pokašlává...",
      "version": 1
    }
  ]
  ```

#### `POST /api/ai/simulator/reply`
- **Oprávnění:** Veřejné / Rate-limited (`aiRateLimiter`, 60 req/h per IP, session-based)
- **Popis:** Vygeneruje odpověď protistrany na základě ID scénáře a historie.
- **Request Body:**
  ```json
  {
    "scenarioId": "c4b8e210-...",
    "messages": [
      { "role": "assistant", "content": "Ahoj, malá dneska trošku..." },
      { "role": "user", "content": "Ahoj, mám s sebou léky i čaj..." }
    ]
  }
  ```
- **Zabezpečení:** Klient **neposílá žádný `systemPrompt`**. Server načte scénář z DB, zkontroluje stav `ACTIVE`, sestaví bezpečný prompt a zavolá AI vrstvu.

#### `POST /api/ai/simulator/evaluate`
- **Oprávnění:** Veřejné / Rate-limited
- **Popis:** Vyhodnotí proběhlou simulaci podle hodnoticích pravidel scénáře.
- **Request Body:**
  ```json
  {
    "scenarioId": "c4b8e210-...",
    "history": [ ... ]
  }
  ```

### 8.2 Administrátorské endpointy (Admin API)

Všechny vyžadují `requireAuth` + `requireRole('ADMIN')` + `MFA_VERIFIED`.

- **`GET /api/admin/ai/simulator/scenarios`** – Seznam všech scénářů vč. DRAFT, INACTIVE a ARCHIVED.
- **`GET /api/admin/ai/simulator/scenarios/:id`** – Detail scénáře vč. historie verzí a kompletních JSON guardrails.
- **`POST /api/admin/ai/simulator/scenarios`** – Vytvoření nového scénáře (automaticky stav `DRAFT`, zápis do `AuditLog`).
- **`PATCH /api/admin/ai/simulator/scenarios/:id`** – Aktualizace scénáře (inkrementace verze, snapshot do `AiSimulatorScenarioVersion`, zápis do `AuditLog`).
- **`POST /api/admin/ai/simulator/scenarios/:id/activate`** – Aktivace scénáře (přepnutí do `ACTIVE`).
- **`POST /api/admin/ai/simulator/scenarios/:id/deactivate`** – Deaktivace scénáře (přepnutí do `INACTIVE`).
- **`POST /api/admin/ai/simulator/scenarios/:id/archive`** – Archivace scénáře (přepnutí do `ARCHIVED`).
- **`POST /api/admin/ai/simulator/scenarios/:id/duplicate`** – Vytvoření duplikátu scénáře ve stavu `DRAFT`.
- **`POST /api/admin/ai/simulator/scenarios/:id/test`** – Spuštění testovacího scénáře v sandboxu (umožňuje testovat i `DRAFT` scénáře).

---

## 9. AI INTERACTION LAYER & PROMPT CONTRACT

Řešení striktně navazuje na zjištění z P0 auditu a integruje deterministický kontrakt pro skládání promptu:

```
                    ┌────────────────────────────────┐
                    │     Client: scenarioId +       │
                    │   messages (čistý uživatel)    │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │    Backend: Scenario Loader    │
                    │   (Načtení z DB + Guardrails)  │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │    Scenario Context Builder    │
                    │  (Sestavení XML Tagged Prompt) │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │       AiService Gateway        │
                    │  (Gemini 1 -> Gemini 2 ->      │
                    │   Grok -> Groq s čistým textem)│
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │        Output Validator        │
                    │   (Kontrola forbidden claims)  │
                    └───────────────┬────────────────┘
                                    │
                                    ▼
                    ┌────────────────────────────────┐
                    │     Response: { reply: "..." } │
                    │   NEBO explicitní HTTP 429/503 │
                    └────────────────────────────────┘
```

### 9.1 Šablona Promptu (Context Contract)

Server sestavuje prompt pro `AiService` v následujícím formátu s využitím strukturálních tagů:

```xml
<system_identity>
Jsi pokročilý trenažér opatrovnických situací v českém rodinném právu.
Vystupuješ v roli: "${scenario.aiRoleName}".
Scénář: "${scenario.title}" (${scenario.shortDescription}).
Tvůj cíl: Poskytnout realistický trénink pro otce. Odpovídej autenticky, stručně (2-4 věty) v češtině.
</system_identity>

<known_facts>
Zde jsou jediná platná a existující fakta této situace:
${scenario.knownFacts.map(f => `- ${f}`).join('\n')}
</known_facts>

<forbidden_claims>
KRITICKÝ ZÁKAZ - NIKDY NEPOUŽIJ ANI NENAZNAČUJ NÁSLEDUJÍCÍ TVRZENÍ:
- Žádná lékařská zpráva ani vyjádření lékaře, pokud není výslovně uvedeno v <known_facts>.
- Žádné nové soudní rozhodnutí ani předběžné opatření, pokud není v <known_facts>.
- Žádné vymyšlené třetí osoby, termíny ani diagnózy.
${scenario.forbiddenClaims.map(c => `- ${c}`).join('\n')}
</forbidden_claims>

<allowed_behaviors>
Povolené reakce a taktiky protistrany:
${scenario.allowedBehaviors.map(b => `- ${b}`).join('\n')}
</allowed_behaviors>

<conversation_history>
${historyWithoutLastMessage}
</conversation_history>

<latest_user_input priority="CRITICAL_HIGHEST">
${lastUserMessage}
</latest_user_input>

<mandatory_instruction>
1. Reaguj VÝHRADNĚ a PŘEDNOSTNĚ na obsah v tagu <latest_user_input>.
2. Pokud je poslední vstup emotivní, útočný nebo vulgární, reaguj v roli na tento tón (ohraď se, nastav hranice nebo přeruš komunikaci). NIKDY se nevracej k původnímu tématu, jako by urážka nezazněla!
3. Nepoužívej markdown formátování, vracej pouze přímou řeč tvé postavy.
</mandatory_instruction>
```

---

## 10. ZAMEZENÍ HALUCINACÍM & ZKOUŠKA ROZPORŮ

### 10.1 Konkrétní příklad: Scénář „Jednání na OSPODu“

**`KNOWN_FACTS`:**
- Dítě (2 roky) tráví u otce každé úterý a čtvrtek odpoledne a každý druhý víkend od pátku do neděle.
- Matka podala na OSPOD podnět s tvrzením, že dítě se po víkendu u otce vrací unavené.
- Otec předložil záznamy o pravidelném spánkovém režimu.

**`FORBIDDEN_CLAIMS`:**
- Pracovnice OSPOD nesmí tvrdit, že „lékař doporučil zákaz styku“.
- Pracovnice OSPOD nesmí tvrdit, že „soud již rozhodl o zrušení přespávání“.
- Pracovnice OSPOD nesmí vymýšlet policejní vyšetřování ani psychiatrické posudky.

### 10.2 Backend Output Validator (Inspekce výstupu)
Před odesláním vygenerované odpovědi klientovi server provede rychlou kontrolu:
1. **Forbidden Keyword Check:** Kontrola, zda výstup neobsahuje zakázané termíny (např. *„lékař řekl“*, *„doktor zakázal“*, pokud nejsou v `knownFacts`).
2. **Length & Sanity Check:** Ověření, že model nevrací prázdný řetězec, neopakuje systémové instrukce a nepřekračuje maximální délku 600 znaků.
3. Při detekci porušení zakázaných tvrzení server request opakuje s penalizací teploty (`temperature: 0.2`) nebo vrátí bezpečný generický error bez halucinace.

---

## 11. STRATEGIE CHYBOVÝCH STAVŮ (ZERO FAKE DATA POLICY)

V souladu s pravidlem **Data Integrity P0** se zcela ruší veškeré klientské i serverové záchranné sítě vracející statické odpovědi:

```typescript
// ❌ PŮVODNÍ ZAKÁZANÝ VZOR (Tichý fake fallback):
const replyText = data.reply || getFallbackCounterpartReply(activeScenario.id);

//  NOVÝ SPRÁVNÝ VZOR (Explicitní stav chyby s možností Retry):
if (!res.ok) {
  if (res.status === 429) {
    setErrorMessage('Překročen limit dotazů. Trénink můžete obnovit za chvíli.');
  } else {
    setErrorMessage('AI asistent je dočasně přetížen. Zkuste prosím odeslat zprávu znovu.');
  }
  setShowRetryButton(true);
  return;
}
```

**Uživatelská zkušenost (UX):**
- V chatu se při selhání zobrazí decentní inline chybový proužek s červeným vykřičníkem: *„Zprávu se nepodařilo odeslat. [Zkusit znovu]“*.
- Do historie se **nikdy nezapíše falešná zpráva protistrany**.

---

## 12. TESTOVACÍ REŽIM V ADMINISTRACI (SCENARIO PLAYGROUND)

V administračním rozhraní bude k dispozici vestavěný testovací modul pro validaci scénářů před jejich publikací:

### Kontrolní seznam automatického testu (Automated Scenario Health Check):
1. **Roleplay Alignment Test:** Ověření, že AI model správně přebírá zadanou roli.
2. **Stress & Insult Test:** Automatický test reakce na urážku (*„Seš neschopná“*) – ověřuje prioritu poslední zprávy.
3. **Forbidden Claims Leaking Test:** Test pokusu o vylákání vymyšlených faktů (*„Co říkal včera pan doktor?“* -> AI musí odpovědět, že o žádném lékaři neví).
4. **Provider Failover Test:** Otestování, že scénář funguje identicky na Gemini i při fallbacku na Grok / Groq.

Výsledkem je přehledný report v Admin UI:
- `PASS / FAIL` status
- Latence odpovědi v ms
- Log použitých systémových tokenů

---

## 13. AUDIT LOGOVÁNÍ & TRVALÁ STOPA

Všechny operace nad scénáři budou přímo zapisovány do stávajícího modelu `AuditLog` (`src/services/auditService.ts`):

```typescript
// Příklad zápisu auditního logu:
await prisma.auditLog.create({
  data: {
    userId: currentUser.id,
    userEmail: currentUser.email,
    module: 'AI_SIMULATOR',
    action: 'SCENARIO_ACTIVATE',
    details: JSON.stringify({
      scenarioId: scenario.id,
      slug: scenario.slug,
      version: scenario.version,
      title: scenario.title
    }),
    ipAddress: req.ip
  }
});
```

---

## 14. PŘESNÝ SEZNAM SOUBORŮ K NÁSLEDNÉ ZMĚNĚ

| Soubor | Typ zásahu | Popis změny |
|---|---|---|
| `prisma/schema.prisma` | Změna schématu | Přidání modelů `AiSimulatorScenario`, `AiSimulatorScenarioVersion` a enumů `ScenarioStatus`, `ScenarioDifficulty`, `ScenarioCategory`. |
| `src/types/index.ts` | Typové definice | Přidání TypeScript rozhraní pro scénáře, guardrails a auditní struktury. |
| `src/services/AiService.ts` | Úprava infrastruktury | Podpora předávání dynamických `systemInstruction`, `temperature` a oprava systémového promptu u Grok/Groq adaptérů. |
| `src/services/aiSimulatorService.ts` | **Nový soubor** | Backendová business logika pro správu scénářů, sestavování promptu, validaci a testování. |
| `src/routes/aiSimulatorRoutes.ts` | **Nový soubor** | REST API routy pro veřejný i administrátorský přístup k simulátoru. |
| `server.ts` | Registrace rout | Registrace `/api/ai/simulator` a `/api/admin/ai/simulator`. |
| `src/components/public/ai/AiSimulatorView.tsx` | Refaktoring frontendu | Odstranění hardcoded konstant, načítání scénářů z API, odstranění fake fallbacků, zavedení Retry UX. |
| `src/components/admin/simulator/ScenarioManager.tsx` | **Nový soubor** | Administrační komponenta pro správu, editaci, verzování a testování scénářů. |
| `src/components/admin/AdminDashboard.tsx` | Rozšíření navigace | Přidání záložky `AI Simulátor → Scénáře` do administrace. |

---

## 15. IMPLEMENTAČNÍ POŘADÍ (FÁZOVÁNÍ P0 / P1 / P2)

### Fáze P0: Bezpečnost, stabilita & oprava AI vrstvy
1. **Oprava `AiService.ts`:**
   - Zobecnění systémových instrukcí pro Grok/Groq (odstranění natvrdo vepsaného JSON požadavku).
   - Přidání podpory pro dynamické předávání systémových pravidel a teploty.
2. **Odstranění klientských systémových promptů:**
   - Úprava existujících endpointů v `aiRoutes.ts`, aby nepřijímaly `systemPrompt` z těla požadavku.
3. **Odstranění klientských fake fallbacků:**
   - Vyčištění `AiSimulatorView.tsx` od statických záchranných textů o lékaři a nahrazení standardním chybovým stavem.

### Fáze P1: Databázový model & Scenario Management
1. **Prisma migrace:**
   - Přidání modelů `AiSimulatorScenario` a `AiSimulatorScenarioVersion`.
   - Vytvoření a ověření migrace.
2. **Seed výchozích scénářů:**
   - Převedení 3 stávajících scénářů (`predani-ditete`, `vyslech-u-soudu`, `jednani-ospod`) do databáze jako výchozí systémové `ACTIVE` záznamy.
3. **Backend Service & API:**
   - Implementace `aiSimulatorService.ts` a `aiSimulatorRoutes.ts` s plným RBAC a validací.
4. **Admin UI:**
   - Vytvoření `ScenarioManager.tsx` v administraci (přehled, tvorba, editace, aktivace).
5. **Napojení veřejného frontendu:**
   - Přepnutí `AiSimulatorView.tsx` na dynamické načítání z `GET /api/ai/simulator/scenarios`.

### Fáze P2: Pokročilé funkce & Testovací Playground
1. **Admin Scenario Playground:**
   - Implementace interaktivního testování scénářů přímo v administraci před jejich aktivací.
2. **Verzování & Diff historie:**
   - Zobrazení rozdílů mezi verzemi scénáře v administraci.
3. **Detailní analytika:**
   - Anonymní statistiky úspěšnosti otců v jednotlivých scénářích (průměrná emotivita a věcnost).

---

## 16. SHRNUTÍ & ZÁVĚREČNÝ AUDITNÍ CHECKLIST

| Kontrolní otázka | Zjištěný stav / Odpověď |
|---|---|
| **Kolik scénářů bylo nalezeno?** | **3 scénáře** (`predani-ditete`, `vyslech-u-soudu`, `jednani-ospod`). |
| **Kolik scénářů je dnes hardcoded?** | **Všechny 3 (100 %)** jsou zapsány jako statické pole v `AiSimulatorView.tsx`. |
| **Kolik scénářů používá fallback?** | **Všechny 3 (100 %)** využívají funkci `getFallbackCounterpartReply()`. |
| **Kolik používá společný `AiService`?** | Všechny scénáře volají `/api/ai/chat`, který využívá univerzální `AiService.ts`. |
| **Je potřeba nový Prisma model?** | **ANO.** Je nezbytný model `AiSimulatorScenario` a `AiSimulatorScenarioVersion`. |
| **Které existující modely lze znovu použít?** | **`AuditLog`** (pro neměnnou auditní stopu) a **`User`** (pro vazbu na autora/editora). |
| **Které soubory bude nutné změnit?** | Celkem **9 souborů** (viz tabulka v sekci 14). |
| **Doporučený první implementační krok?** | **Krok P0.1:** Zobecnění `AiService.ts` a odstranění hardcoded JSON promptu u Grok/Groq adaptérů, následované vytvořením Prisma modelu a seedem původních 3 scénářů. |

---

**Závěr:** Tento návrh poskytuje kompletní, bezpečný a deterministický plán pro realizaci správy AI scénářů. Žádné změny v kódu ani databázi nebyly v rámci tohoto úkolu provedeny. Repozitář zůstává v čistém, neporušeném stavu.
