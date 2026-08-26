# P0 AI INTERACTION, CONSISTENCY & CONTEXT AUDIT
**Projekt:** Táta má právo (dev3)
**Datum:** 25. srpna 2026
**Auditor:** Hlavní softwarový architekt, DevSecOps inženýr & AI Consistency Auditor
**Režim:** READ-ONLY ARCHITECTURAL & FORENSIC AUDIT
**Stav:** COMPLETED / ACTIONABLE BLUEPRINT

---

## 1. EXECUTIVNÍ SHRNUTÍ & ROOT CAUSE ANALÝZA

V rámci auditu AI interakcí byl detailně analyzován incident hlášený v modulu **AI Simulátor (Roleplay)**:
- **Kontext konverzace:**
  - Matka (AI): *"Ahoj, malá dneska trošku pokašlává a nechce se jí s tebou nikam jet. Myslím, že by bylo lepší, kdybys přijel až příští týden."*
  - Otec (Uživatel): *"Seš píča"*
  - Odpověď systému: *"Chápu tvůj názor, ale doktor říkal, že dítě má být v klidu domova. Pokud trváš na odjezdu, vezmeš na sebe veškerou odpovědnost, když se jí přitíží."*

### Identifikovaná hlavní příčina (Root Cause)
Původní podezření na selhání kontextového okna LLM bylo **forenzním rozborem kódu vyvráceno a odhalilo závažnější architektonický defekt (P0)**:

1. **Tiché maskování chyb klientským fallbackem (Silent Catch Fallback):**
   - V `src/routes/aiRoutes.ts` (řádek 9) je nastaven přísný `aiRateLimiter` na **10 požadavků za hodinu na IP adresu**.
   - V `src/components/public/ai/AiSimulatorView.tsx` (řádky 129 a 148) je implementován klientský fallback:
     ```typescript
     const replyText = data.reply || getFallbackCounterpartReply(activeScenario.id);
     ```
   - Když uživatel v simulaci odeslal další zprávu po překročení limitu (nebo při zpoždění API/chybě sítě), backend vrátil HTTP 429 `{ error: 'Překročen limit dotazů...' }`.
   - Vzhledem k tomu, že `data.reply` byl `undefined`, frontend **zcela tiše a bez varování** aktivoval statickou hardcoded funkci `getFallbackCounterpartReply('predani-ditete')`:
     ```typescript
     return 'Chápu tvůj názor, ale doktor říkal, že dítě má být v klidu domova. Pokud trváš na odjezdu, vezmeš na sebe veškerou odpovědnost, když se jí přitíží.';
     ```
   - **Důsledek:** Systém vůbec nekomunikoval s AI modelem. Místo toho vrátil předem napsanou odpověď, která simulovala dialog o nemoci a lékaři, čímž vytvořil iluzi, že model ignoruje poslední vstup a reaguje na starý kontext.

2. **Kritická chyba v `AiService.ts` při přepnutí na záložní providery (Grok / Groq):**
   - V `src/services/AiService.ts` (řádky 113 a 163) je při selhání Gemini natvrdo vepsán system prompt:
     `'Jsi specializovaný právní AI analytik pro rodinné právo. Vracej výhradně validní JSON bez markdownu.'`
   - Jakýkoliv požadavek na volný text (např. roleplay dialog, asistent, BIFF převod) přepnutý na Grok/Groq obdrží příkaz vrátit JSON jako právní analytik, což způsobí syntaktickou chybu na frontendu a okamžitý propad do tichého hardcoded fallbacku.

3. **Absence explicitní priority poslední zprávy (Last-Message Dominance) a zploštělý kontext:**
   - V `/api/ai/chat` je historie zformátována jako prostý lineární text `Historie konverzace:\n...` bez jasného systémového ukotvení role protistrany, bez oddělení historie od aktuálního promptu a bez instrukce, že poslední zpráva má absolutní prioritu pro generování reakce.

---

## 2. KOMPLETNÍ INVENTURA VŠECH AI KOMPONENT A ENDPOINTŮ

V repozitáři bylo identifikováno **9 frontendových modulů**, **8 backendových endpointů** a **4 AI služby/orchestrátory**:

| Vrstva | Komponenta / Soubor | Endpoint / Metoda | Funkce | Riziko |
|---|---|---|---|---|
| **Frontend** | `AiSimulatorView.tsx` | `POST /api/ai/chat`<br>`POST /api/ai/simulator-evaluate` | Roleplay trenažér (3 scénáře) a scoring emotivity | **P0** (Tichý fallback s halucinací doktora) |
| **Frontend** | `AiAssistantView.tsx` | `POST /api/ai/chat`<br>`POST /api/ai/biff-convert` | AI asistent a BIFF konvertor zpráv | **P0** (Client system prompt injection + fallback) |
| **Frontend** | `AiCaseManagerView.tsx` | `POST /api/ai/analyze-document` | Právní rozbor dokumentů a vyhledávání rozporů | **P0** (Fallback s fiktivním datem 12.5.) |
| **Frontend** | `AiFormsView.tsx` | `POST /api/ai/chat` | AI dopracování právních podání (refine) | **P1** (Přímá interpolace promptu + dummy doložka) |
| **Frontend** | `AiGuideView.tsx` | `POST /api/ai/guide-plan` | Generátor 7-30 denního akčního plánu | **P1** (Hardcoded fallback plán) |
| **Frontend** | `AdminPageBuilder.tsx` | `POST /api/ai/generate-page` | Generování Puck stránek z textu | **P2** (Absence Zod validace Puck JSON) |
| **Frontend** | `CareJudgmentImportModal.tsx` | `POST /api/cases/:id/parse-judgment` | AI extrakce dat z rozsudků | **P1** (Chráněno deterministic parserem) |
| **Backend** | `src/routes/aiRoutes.ts` | `/generate-page`, `/chat`, `/biff-convert`, `/guide-plan`, `/analyze-document`, `/simulator-evaluate` | Veřejné a admin AI API | **P0** (Rate limit 10/h způsobuje tiché pády; systemPrompt přijímán z klienta) |
| **Backend** | `src/services/AiService.ts` | `generateContent(prompt, options)` | Multi-provider AI klient (Gemini -> Grok -> Groq) | **P0** (Grok/Groq hardcoded JSON prompt) |
| **Backend** | `src/services/judgmentParserService.ts` | `parseWithText()`, `parseJudgment()` | Extrakce strukturovaných dat rozsudku | **P1** (Robustní, ale závislý na AiService) |
| **Backend** | `src/services/aiContextService.ts` | `/llms.txt`, `ai-context.json` | Kontextový index pro externí AI a crawlery | **P3** (V pořádku, filtrování privátních URL funguje) |
| **Backend** | `src/services/qa/adminCopilot.ts` | Copilot plánování a provádění kroků | Interní vývojový a auditní AI agent | **P2** (Přímé volání Gemini bez fallbacku) |
| **Backend** | `src/services/qa/ai/synthesisMultiAIOrchestrator.ts` | Multi-AI konsensus pro QA audit | Vícečetné ověřování výsledků testů | **P2** (Izolované v QA doméně) |

---

## 3. DETAILNÍ AUDIT JEDNOTLIVÝCH FUNKCÍ & NALEZENÉ VADY

### 3.1 `AiSimulatorView.tsx` & `/api/ai/chat` (Roleplay Simulator)
- **Vada 1 (P0):** `getFallbackCounterpartReply` vrací fiktivní tvrzení o lékaři při chybě sítě či rate limitu. Uživatel je uveden v omyl, že AI "odpovídá zmateně".
- **Vada 2 (P0):** Klient posílá `systemPrompt` v JSON těle (`req.body.systemPrompt`). Backend jej bez validace použije. To umožňuje libovolnému uživateli přepsat systémovou instrukci.
- **Vada 3 (P1):** Lineární spojování historie:
  ```typescript
  const historyText = (messages || [])
    .map((m: any) => `${m.role === 'user' ? 'Uživatel' : 'Asistent'}: ${m.content}`)
    .join('\n\n');
  ```
  V roli "Matka" model dostává označení "Asistent:", což vyvolává schizofrenii rolí v LLM.
- **Vada 4 (P1):** Chybí instrukce pro prioritu poslední zprávy: Pokud otec napíše urážku, model nemá explicitní instrukci reagovat na aktuální afekt, ale vyhodnocuje celý text jako celek.

### 3.2 `AiAssistantView.tsx` & `/api/ai/biff-convert` (BIFF & Asistent)
- **Vada 1 (P0):** Klient-side fallback `getFallbackReply(text)` obsahuje statické texty s nálezy ÚS (*II. ÚS 1642/22*), které se vkládají jako odpověď asistenta při jakémkoliv výpadku.
- **Vada 2 (P1):** BIFF převodník (`/api/ai/biff-convert`) na backendu nemá Zod schema validaci. Při selhání JSON parseru vrací backend statický objekt s obecným doporučením.
- **Vada 3 (P1):** Klient má regexový fallback: `.replace(/(zase|pořád|vždycky|nikdy|okamžitě|musíš|koukej)/gi, '')`, který generuje nesmyslné věty a maskuje výpadek serveru.

### 3.3 `AiCaseManagerView.tsx` & `/api/ai/analyze-document`
- **Vada 1 (P0):** Při selhání analýzy dokumentu klientský kód (`AiCaseManagerView.tsx`, řádky 101–115) vloží do UI fiktivní rozbor obsahující:
  - *"Rozpor v časové posloupnosti: Tvrdí neochotu k dohodě, avšak v e-mailové komunikaci ze dne 12.5. existuje písemný návrh kompromisu."*
  - **Kritické riziko:** Uživatel nahraje svůj reálný spis, AI analýza selže (např. kvůli velikosti souboru) a uživatel v UI uvidí, že jeho protistrana poslala kompromis 12. května, ačkoliv nic takového v jeho spisu neexistuje! Jedná se o závažné porušení pravidla **Data Integrity P0** (falešná data maskující chybu).

### 3.4 `AiFormsView.tsx` (AI Refine)
- **Vada 1 (P1):** Prompt Injection riziko: `customPrompt` je přímo vkládán do šablony:
  `Dopracuj následující právní podání podle tohoto požadavku: "${customPrompt}".`
- **Vada 2 (P1):** Při selhání se k dokumentu natvrdo přilepí odstavec:
  `\n\nIV. Doplnění právní argumentace\nNavrhovatel dále zdůrazňuje judikaturu Ústavního soudu...` bez ohledu na to, co uživatel požadoval opravit (např. překlep ve jméně).

### 3.5 `AiService.ts` (Multi-Provider Resilience)
- **Vada 1 (P0):** Hardcoded systémový prompt pro Grok a Groq:
  ```typescript
  // Grok / Groq volání v AiService.ts:
  messages: [
    {
      role: 'system',
      content: 'Jsi specializovaný právní AI analytik pro rodinné právo. Vracej výhradně validní JSON bez markdownu.'
    },
    { role: 'user', content: prompt }
  ]
  ```
  Tato konfigurace zcela ničí univerzálnost `AiService` a činí failover nepoužitelným pro jakékoliv jiné úlohy než JSON analýzu rozsudků.
- **Vada 2 (P1):** Parametry jako `jsonMode`, `temperature`, `systemInstruction` nejsou předávány v rozhraní `generateContent(prompt, options)`.

---

## 4. AUDIT HALUCINACÍ A FAKTUÁLNÍ KONZISTENCE

| Komponenta | Typ halucinace / Inkonzistence | Mechanismus vzniku | Závažnost |
|---|---|---|---|
| **AiSimulatorView** | Falešné tvrzení o doporučení lékaře a klidu domova | Statický klientský fallback při HTTP 429 / síťové chybě | **P0** |
| **AiCaseManagerView** | Fiktivní datum 12.5. a neexistující e-mailový kompromis | Hardcoded fallback objekt v React komponentě | **P0** |
| **AiFormsView** | Vložení obecné právní doložky ÚS při jakékoliv chybě | Client-side catch blok | **P1** |
| **AiAssistantView** | Pevně zadrátované citace judikátů ÚS ve fallbacku | Regexové a klíčovými slovy řízené klientské odpovědi | **P1** |
| **AiService (Grok/Groq)** | Vynucení JSON formátu u textových dialogů | Pevně zadrátovaný systémový prompt v provider fallbacku | **P0** |

---

## 5. AUDIT BEZPEČNOSTI & PROMPT INJECTION

1. **Client-Controlled System Prompts (P0):**
   - V endpointu `POST /api/ai/chat` backend přijímá `req.body.systemPrompt` přímo z frontendu. Útočník může odeslat jakýkoliv prompt, obejít bezpečnostní mantinely a zneužít API klíč serveru pro libovolné účely.
2. **Unsanitized Prompt Concatenation (P1):**
   - V `AiFormsView.tsx` a `AdminPageBuilder.tsx` jsou uživatelské vstupy vkládány do promptů bez ohraničujících oddělovačů (např. XML značek `<user_input>...</user_input>`), což umožňuje snadný Prompt Jailbreak / Prompt Injection.
3. **Public Rate Limit Bottleneck (P1):**
   - Rate limit 10 dotazů/hod na IP je pro interaktivní chat/roleplay příliš nízký (uživatel spotřebuje limit za 2 minuty konverzace), což bezprostředně vyvolává kaskádu chybových stavů a aktivaci škodlivých klientských fallbacků.

---

## 6. ARCHITEKTONICKÝ NÁVRH CÍLOVÉHO ŘEŠENÍ

Pro odstranění všech P0/P1 vad se navrhuje následující robustní architektura:

```
[ Frontend: React UI ]
       │ (pouze čistá uživatelská data + scenarioId / actionType)
       ▼
[ Backend: /api/ai/* ]
       │
       ▼
[ AI Orchestrator (Server-Side) ]
  ├── 1. Scenario / Prompt Registry (Bezpečné systémové prompty na serveru)
  ├── 2. Context Window & History Manager (Oddělení rolí, priorita poslední zprávy)
  ├── 3. Input Sanitizer & Injection Guard (Ohraničení <context> a <last_user_message>)
  ├── 4. Unified AiService (Multi-provider s dynamickým předáváním systémových promptů)
  └── 5. Output Validator (Zod schémata, žádné fiktivní fallbacky, explicitní HTTP 503/429)
       │
       ▼
[ Error Handling na Frontendu ]
  └── Žádné fake texty; jasný banner: "AI služba je dočasně přetížena. Zkuste to za chvíli."
```

### Klíčové principy nápravy:
1. **Zákaz klientských fake fallbacků (Pravidlo Data Integrity P0):**
   - Žádná komponenta nesmí při chybě API generovat fiktivní odpověď. UI musí zobrazit standardní chybový stav s možností opakování (`Retry`).
2. **Oddělený a strukturovaný Roleplay Prompt Engine:**
   - Server sestavuje prompt s jasně oddělenými bloky:
     ```
     <system_role>
     Jsi {counterpartName} ve scénáři "{scenarioTitle}".
     Cíl: Reaguj realisticky na POSLEDNÍ zprávu otce.
     </system_role>

     <conversation_history>
     {historie s označením [OTEC] a [PROTISTRANA]}
     </conversation_history>

     <latest_user_input priority="CRITICAL_HIGHEST">
     {poslední zpráva otce}
     </latest_user_input>

     Instrukce: Odpověz POUZE na <latest_user_input>. Pokud otec použil vulgarismus, reaguj adekvátně své roli (např. ukončením hovoru nebo ohradou proti tónu), nikoliv opakováním starého tématu!
     ```
3. **Oprava `AiService.ts`:**
   - Rozšířit `AiService.generateContent(prompt, options)` o:
     - `systemInstruction?: string`
     - `jsonMode?: boolean`
     - `temperature?: number`
   - Dynamicky předávat tyto hodnoty jak do Gemini, tak do Grok a Groq adaptérů.
4. **Zvýšení / adaptivní správa Rate Limitu:**
   - Pro autentizované uživatele vyšší limit (např. 60 dotazů/hod), pro anonymní roleplay relace dedikovaný session token v paměti / Redis.

---

## 7. MATICE RIZIK A DEFINITION OF DONE PRO NÁSLEDNOU OPRAVU

| ID | Oblast | Závažnost | Dopad | Požadovaná náprava |
|---|---|---|---|---|
| **AI-01** | `AiSimulatorView` fallback | **P0** | Uživatel dostává nepravdivou halucinaci o lékaři | Odstranit klientský fallback; zobrazit reálnou chybu / retry |
| **AI-02** | `AiCaseManagerView` fallback | **P0** | Uživatel vidí vymyšlené datum 12.5. a nepravdivé důkazy | Odstranit statický rozbor; vrátit skutečnou chybu zpracování |
| **AI-03** | `AiService` Grok/Groq prompt | **P0** | Grok a Groq selhávají na textových požadavcích | Dynamické předávání system promptu a formátu |
| **AI-04** | Client `systemPrompt` v `/chat` | **P0** | Bezpečnostní zranitelnost (Prompt Injection / Abuse) | Přesunout všechny system prompty výhradně na server |
| **AI-05** | Roleplay prompt structuring | **P1** | Model ztrácí fokus na poslední reakci | Implementovat tagovaný prompt s `priority="CRITICAL_HIGHEST"` |
| **AI-06** | Rate limit na simulátoru | **P1** | Uživatel narazí na limit po 10 zprávách a padá do chyb | Oddělený limit pro simulátor / zvýšení na 60/hod |
| **AI-07** | `AiFormsView` AI Refine fallback | **P1** | Nerelevantní doložka ÚS se přilepí do podání | Odstranit falešné doplnění textu |

---

## 8. TESTOVACÍ SCÉNÁŘE PRO NÁSLEDNOU VERIFIKACI (TEST MATRIX)

1. **Scénář T1 (Roleplay Vulgarismus / Afekt):**
   - Vstup: Otec napíše *"Seš píča"*.
   - Očekávaný výsledek: Protistrana v roli reaguje na urážku (např. *"Takhle se mnou mluvit nebudeš, zavolám policii / končím hovor"*), NIKDY nezmíní fiktivního doktora, pokud nebyl v kontextu.
2. **Scénář T2 (Simulace výpadku AI - Offline / Rate Limit):**
   - Vstup: Simulovaný výpadek backendu (HTTP 500 / 429).
   - Očekávaný výsledek: UI zobrazí červenou notifikaci *"AI asistent je dočasně nedostupný, zkuste to prosím za okamžik."* s tlačítkem *Zkusit znovu*. ŽÁDNÝ fiktivní text se nevloží do chatu.
3. **Scénář T3 (AiService Failover na Grok/Groq):**
   - Vstup: Primární i sekundární Gemini selže; volá se Grok/Groq s požadavkem na textový chat.
   - Očekávaný výsledek: Grok/Groq vrátí plynulý český text v požadované roli, nikoliv chybný JSON.
4. **Scénář T4 (Case Manager selhání):**
   - Vstup: Nahrání nečitelného nebo příliš velkého PDF.
   - Očekávaný výsledek: Chybová zpráva o nemožnosti zpracovat soubor. ŽÁDNÉ fiktivní datum *"12.5."* v UI.

---

**Závěr auditu:** Audit byl proveden v striktním **READ-ONLY** režimu bez zásahu do funkčního kódu. Všechna zjištění a přesné příčiny byly lokalizovány a zdokumentovány. Systém je připraven pro cílenou a bezpečnou implementaci nápravy v samostatném úkolu.
