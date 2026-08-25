# AUDIT REPORT: P0.1 AI PROVIDER CONSISTENCY & FAILOVER HARDENING

**Datum a čas auditu:** 2026-08-25 21:07 UTC  
**Úkol:** P0.1 — AI Provider Consistency Hardening  
**Projekt:** Táta má právo (dev3)  
**Status:** DOKONČENO (PASS)

---

## 1. Cíl úkolu

Sjednotit chování a předávání systémových instrukcí napříč všemi AI providery (`Gemini Primary`, `Gemini Secondary`, `Grok`, `Groq`), odstranit natvrdo zakódované role z adaptérů a zajistit, že failover mezi providery probíhá zcela transparentně bez nechtěné změny role AI (persona), formátu nebo kontextu.

---

## 2. Výchozí stav

Při předchozím P0 auditu bylo zjištěno:
1. Grok a Groq adaptéry v `AiService.ts` měly natvrdo vepsaný systémový prompt:
   `"Jsi specializovaný právní AI analytik pro rodinné právo. Vracej výhradně validní JSON bez markdownu."`
2. `AiGenerateOptions` nepodporovalo předávání dedikovaného `systemInstruction`.
3. Při failoveru z Gemini na Grok/Groq docházelo k degradaci role (např. roleplay scénář simulující pracovnici OSPOD nebo soudkyni byl při přepnutí na fallback providera přepsán na generického právního analytika v JSON režimu).
4. `jsonMode` nebyl oddělen od systémových instrukcí.

---

## 3. Provedené technické změny

### Soubor `src/services/AiService.ts`:
1. **Rozšíření rozhraní `AiGenerateOptions`:**
   - Přidáno `systemInstruction?: string` pro oddělené předávání systémových instrukcí / role.
   - Přidáno `temperature?: number` pro možnost jemného ladění kreativity/deterministického chování.
   - Zachována 100% zpětná kompatibilita pro všechna stávající volání `generateContent(prompt)`.

2. **Gemini integrace (@google/genai SDK):**
   - Systémové instrukce jsou bezpečně předávány přes `config.systemInstruction`.
   - `jsonMode` nastavuje `config.responseMimeType = 'application/json'` bez zásahu do role.

3. **Grok (xAI) a Groq (Llama-3.3-70b-versatile) adaptéry:**
   - Kompletně odstraněn hardcoded řetězec `"Jsi specializovaný právní AI analytik pro rodinné právo..."`.
   - Sestaveno pole zpráv `openAiMessages`:
     - Pokud je definován `systemInstruction`, vloží se `{ role: 'system', content: options.systemInstruction }`.
     - Pokud není definován, vloží se pouze `{ role: 'user', content: prompt }` bez jakýchkoli domyšlených nebo falešných instrukcí.
   - `jsonMode` řídí výhradně `response_format: { type: 'json_object' }`.

4. **Failover logika:**
   - Posloupnost `Gemini Primary -> Gemini Secondary -> Grok -> Groq` plně zachovává stejný prompt, `systemInstruction`, `jsonMode` i `temperature`.

5. **Bezpečné logování (Zero-PII / Zero-Prompt Leak):**
   - Žádné prompty, systémové instrukce ani uživatelská data se nezapisují do logů.
   - Logují se pouze technická metadata (název providera, latence v ms, délka výstupu ve znacích, chybové hlášení providera při selhání).

---

## 4. Testy a verifikace

Vytvořen nový integrační testovací balík `tests/ai-provider-consistency.test.ts` (napojený do hlavního test runneru `scripts/test-runner.js`), který pokrývá 6 kritických scénářů:

1. **Test 1: Roleplay systemInstruction:** Ověřeno, že identická instrukce (např. `"Jsi pracovnice OSPOD..."`) je předána v `config.systemInstruction` pro Gemini a v roli `system` pro Grok i Groq.
2. **Test 2: Roleplay bez jsonMode:** Ověřeno, že Grok i Groq neobdrží žádný vynucený JSON formát ani domyšlený právní prompt.
3. **Test 3: Roleplay s jsonMode=true:** Ověřeno, že se mění výhradně výstupní formát (`application/json` / `json_object`), zatímco role zůstává nedotčena.
4. **Test 4: Failover Gemini Primary -> Grok:** Ověřeno, že při selhání Gemini (např. HTTP 429 quota) přebírá Grok identický `systemInstruction`, `prompt` a parametry.
5. **Test 5: Failover Gemini -> Grok -> Groq:** Ověřeno, že při kaskádovém selhání obou Gemini klíčů a Groku dostává Groq identická data.
6. **Test 6: Zpětná kompatibilita:** Ověřeno, že volání bez `systemInstruction` neobsahuje žádné umělé systémové zprávy.

### Výsledky testů:
- `npx tsx --test tests/ai-provider-consistency.test.ts`: **6/6 PASS**
- `npm test` (celý projektový test suite): **12/12 sad PASS**
- `npm run lint` (`tsc --noEmit`): **PASS (0 errors)**
- `npm run build` (`compile_applet`): **PASS (Production build OK)**

---

## 5. Bezpečnostní a architektonické zhodnocení

- **Security & Privacy:** Žádné hardcoded secrets, žádné API klíče v kódu/verzování, žádné logování citlivých promptů.
- **Data Integrity:** Žádná mock data v produkčních cestách; transparentní propagace chyb při výpadku všech providerů.
- **Regresní rizika:** Nulová (100% zpětná kompatibilita s existujícími službami jako `judgmentParserService` a `aiRoutes`).
