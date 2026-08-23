# AUDIT REPORT: AI Extractor rozsudků a dohod o péči (Technický audit a náprava)

**Datum a čas:** 2026-08-23 13:38 UTC  
**Úkol:** Audit a bezpečná oprava AI Extractoru rozsudků & dohody o péči v modulu CoParent Hub  
**Projekt:** Táta má právo (dev3)  
**Pracovní větev:** main / dev3  
**Status:** DOKONČENO & PLNĚ OTESTOVÁNO (13/13 testů PASS, Build PASS)

---

## 1. PŮVODNÍ PROBLÉM A CÍL

V modulu CoParent Hub (`/coparenting/schedule` a `/cases/:caseId/care`) se při nahrání dokumentu (PDF / DOCX / TXT) zobrazovala fáze:
> *«Načítání a čtení textové vrstvy z dokumentu...»*
> a následně skončila obecnou chybou: *«Chyba při AI analýze.»*

**Cíl úlohy:**
1. Zjistit skutečný root cause bez hádání.
2. Zmapovat celou trasu zpracování: UI modal -> upload route -> controller -> validace a ClamAV -> text extraction -> AI orchestrator -> AI providers -> fallback -> structured response parser.
3. Odstranit polykání chyb (`catch (e) { res.status(500).json({ error: 'Chyba při AI analýze' }) }`).
4. Zavést robustní multi-provider AI fallback (Gemini Primary -> Gemini Secondary -> Grok/xAI -> Groq Llama-3.3-70b).
5. Implementovat detailní klasifikaci chyb s uživatelsky přívětivými hlášeními (rate limit, quota exceeded, missing auth, timeout, invalid JSON, scanned document without text layer).
6. Zavést přísné limity velikosti (25 MB), ochranu proti prompt injection a validaci strukturovaného výstupu.

---

## 2. NALEZENÝ ROOT CAUSE (VÝCHOZÍ STAV)

Detailní kódová a runtime analýza odhalila následující příčiny:
1. **Volání neexistujícího modelu ve staré verzi `AiService.ts`:**
   Kód volal neexistující/zastaralý modelový alias `gemini-3.6-flash` a při chybě neexistoval fallback na sekundární Gemini klíč ani alternativní providery (Grok, Groq).
2. **Polykání chyb v controlleru:**
   `CoParentController.parseJudgment` a `caseRoutes.ts` v catch bloku zachytávaly jakoukoliv výjimku a vracely obecný řetězec `res.status(500).json({ error: 'Chyba při AI analýze' })`. Frontend neměl informaci o tom, zda šlo o chybějící textovou vrstvu, překročení kvóty nebo timeout.
3. **Chybějící timeout ochrana:**
   Při zpoždění externího AI API request visel do vypršení HTTP gateway timeoutu.
4. **Nenormalizované české měnové částky a lhůty:**
   Vstup z AI obsahující text jako `4 500,00 Kč` byl nesprávně parsován nebo házel nekonzistentní typ.
5. **Nedostatečná vizuální signalizace na frontendu:**
   Modální okno `JudgmentImportModal.tsx` nemělo strukturovaný error banner pro zobrazení přesného doporučení (např. vložení textu ručně při skenovaném PDF).

---

## 3. PROVEDENÉ ZMĚNY A ARCHITEKTURA

### A. AI Orchestrátor (`src/services/AiService.ts`)
- Implementována multi-provider kaskáda s časovým limitem na providera (`timeoutMs: 25000`):
  1. **Primary Gemini**: model `gemini-2.5-flash` s nativním `responseMimeType: 'application/json'`.
  2. **Secondary Gemini**: model `gemini-2.5-flash` přes `GEMINI_API_KEY_2`.
  3. **Grok AI / xAI**: model `grok-2-latest` přes REST API s JSON modelem a system promptem.
  4. **Groq AI**: model `llama-3.3-70b-versatile` přes OpenAI-kompatibilní REST API.
- Přesná klasifikace chyb (`AI_RATE_LIMIT`, `AI_TIMEOUT`, `AI_AUTH_ERROR`, `AI_PROVIDER_ERROR`).

### B. Judgment Parser Engine (`src/services/judgmentParserService.ts`)
- **Třída `JudgmentParserError`**: nese `code`, `statusCode` a lokalizovaný `userMessage`.
- **Víceúrovňová extrakce PDF**:
  - Primární: `pdf-parse` (třída `PDFParse`).
  - Sekundární záloha: `pdfjs-dist/legacy`.
  - Detekce skenovaných PDF bez textové vrstvy a delegace na Gemini Vision OCR.
- **Inteligentní zkracování dlouhých spisů (Legal Slicing)**:
  - Dokumenty nad 35 000 znaků jsou inteligentně rozděleny na hlavičku + výrok (prvních 22 000 znaků) a závěr s poučením (posledních 10 000 znaků).
- **Bezpečnostní gatekeeper (ClamAV)**:
  - Každý nahraný soubor projde antivirovou kontrolou před textovou extrakcí.
- **Normalizace dat**:
  - Podpora českých formátů částek (`4 500,00 Kč` -> `4500`), splatností a JSON markdown fence (` ```json `).
  - Výpočet metadat důvěryhodnosti (`confidence`, `status: VERIFIED | NEEDS_REVIEW | NOT_FOUND`, `sourceText`).

### C. Backend API Controller & Routy
- `src/controllers/coparentController.ts`: `parseJudgment` vrací přesné chybové kódy a zprávy (`res.status(err.statusCode || 500).json({ success: false, code: err.code, message: err.userMessage || err.message })`).
- `src/routes/caseRoutes.ts`: `handleCareError` přenáší strukturované chyby z `JudgmentParserService`.

### D. Frontend UI Modály
- `src/components/coparent/JudgmentImportModal.tsx`:
  - Přidán responzivní chybový banner (`error` state) s ikonou `AlertCircle` a jasným českým vysvětlením.
  - Ošetřeny specifické stavy (OCR požadavek, rate limit, timeout, prázdný dokument).
- `src/components/case/care/CareJudgmentImportModal.tsx`:
  - Sjednoceno zpracování odpovědí z endpointu (`data.message || data.error`).

---

## 4. DOTČENÉ SOUBORY

1. `src/services/AiService.ts` – multi-provider fallback a timeout management
2. `src/services/judgmentParserService.ts` – robustní extrakce, error typing a normalizace
3. `src/controllers/coparentController.ts` – strukturovaná HTTP error pipeline
4. `src/routes/caseRoutes.ts` – opatrovnická složka error handling
5. `src/components/coparent/JudgmentImportModal.tsx` – UI banner a error states
6. `src/components/case/care/CareJudgmentImportModal.tsx` – UI fallback hlášení
7. `src/tests/judgmentParserRegression.test.ts` – 13-bodová regresní testovací sada
8. `docs/audit/AI_EXTRACTOR_JUDGMENTS_2026-08-23.md` – tento auditní záznam

---

## 5. PROVEDENÉ TESTY A VÝSLEDKY

Byl spuštěn automatizovaný 13-bodový integrační a regresní testovací scénář (`npx tsx src/tests/judgmentParserRegression.test.ts`):

| # | Testovaný scénář | Výsledek | Poznámka |
|---|---|---|---|
| 1 | Validní PDF s textovou vrstvou | **PASS** | Extrakce sp. zn., dítěte, typu péče |
| 2 | PDF bez textové vrstvy (OCR větev) | **PASS** | Detekce 0 znaků, přepnutí na Vision / hlášení |
| 3 | Prázdný dokument (0 B) | **PASS** | Okamžité zamítnutí s kódem `EMPTY_DOCUMENT` |
| 4 | Příliš velký dokument (> 25 MB) | **PASS** | Zamítnutí s kódem `FILE_TOO_LARGE` |
| 5 | Poškozený/nepodporovaný soubor | **PASS** | Zamítnutí s kódem `INVALID_FILE` |
| 6 | AI Timeout (simulace > 25s) | **PASS** | Zachyceno a vráceno jako `AI_TIMEOUT` |
| 7 | AI Quota / HTTP 429 Rate Limit | **PASS** | Zachyceno a vráceno jako `AI_RATE_LIMIT` |
| 8 | Chybějící konfigurace API klíčů | **PASS** | Detekováno jako `AI_AUTH_ERROR` |
| 9 | Nevalidní AI JSON výstup | **PASS** | Detekováno jako `AI_INVALID_RESPONSE` |
| 10 | Multi-provider Fallback kaskáda | **PASS** | Přepnutí při selhání primárního poskytovatele |
| 11 | Normalizace strukturovaného výstupu | **PASS** | Parsování částek, termínů a markdown fence |
| 12 | Částečná/nekompletní data | **PASS** | Nastavení `NOT_FOUND` a nulování polí |
| 13 | Antivirový scan (ClamAV gatekeeper) | **PASS** | Infikovaný/EICAR soubor bezpečně zablokován |

**Výsledek aplikačního buildu (`npm run build`):**  
- **Vite compilation:** `dist/` vygenerován bez chyb
- **Server bundle:** `dist/server.cjs` vygenerován bez chyb
- **Status:** **PASS**

---

## 6. BEZPEČNOSTNÍ A REGRESNÍ VYHODNOCENÍ

- **Secrets:** Žádné API klíče, hesla ani tokeny nebyly uloženy v kódu, testech ani v tomto auditu. Veškerá konfigurace probíhá striktně přes `process.env`.
- **Integrita dat:** Dokumenty jsou zpracovávány v paměti (in-memory buffer) a neukládají se do neautorizovaných dočasných souborů.
- **Prompt Injection:** Do promptu byl přidán bezpečnostní prefix vymezující obsah dokumentu jako nedůvěryhodný vstup, který nesmí být interpretován jako systémové příkazy pro LLM.
- **Zpětná kompatibilita:** Všechny stávající formuláře v CoParent Hubu i Opatrovnické složce zůstávají 100% kompatibilní se strukturou `JudgmentExtractedData`.

---

## 7. DEFINITION OF DONE OVĚŘENÍ

- [x] Implementace odpovídá zadání
- [x] Bezpečnost a integrita zachována
- [x] Žádná fake data v produkční cestě
- [x] Všech 13 testů proběhlo a prošlo (PASS)
- [x] Žádné secrets v repozitáři
- [x] Auditní report uložen v `docs/audit/`
