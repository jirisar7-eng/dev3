# Agent Documentation: DOCUMENT_PROCESSOR

**Název:** Document Processor Agent  
**ID:** `DOCUMENT_PROCESSOR`  
**Stav implementace:** `PARTIAL`  
**Source of Truth:** ✅ VERIFIED (Registry/Catalog registered, Extractor integration existuje)  

---

## 1. Základní identifikace & Účel

- **Účel:** Automatizovaná analýza, strukturální parsing a textová OCR extrakce z nahraných právních dokumentů a rozsudků.
- **Pro koho je určen:** Uživatelé vkládající spisy, právní asistenti a správci prípadov.
- **Co umí:**
  - Čtení a parsing obsahu nahraných dokumentů (PDF, rozsudky).
  - OCR extrakce textových vrstev z naskenovaných dokumentů.
  - Extrakce metadat (spisová značka, soud, datum, částky).
- **Co neumí:**
  - Neumí upravovat ani mazat původní nahrané soubory.
  - Neumí automaticky podávat dokumenty na soudy.
  - Neumí přistupovat k souborům mimo povolený uživatelský kontekst.
- **Kdy jej použít:** Při vkládání nového soudního rozhodnutí nebo rozsudku do systému.
- **Kdy jej nepoužívat:** Při zpracování zašifrovaných nebo poškozených souborů.

---

## 2. User Guide (Uživatelská příručka)

- **Co je to?**  
  Inteligentní vytěžovač dat z právních dokumentů a rozsudků.
- **K čemu to slouží?**  
  Automaticky předvyplňuje formuláře a spisové karty podle nahraného PDF.
- **Co s tím můžu dělat?**  
  Nahrát rozsudek a získat strukturované údaje (datum, soud, výživné).
- **Jak začít — krok za krokem:**
  1. Otevřete formulář "Nahrát soudní rozhodnutí".
  2. Vyberte PDF soubor rozsudku z počítače.
  3. Klikněte na "Zpracovat dokument".
  4. Zkontrolujte extrahované údaje před uložením.
- **Jaký vstup potřebuji?**  
  PDF nebo obrázkový dokument soudního rozhodnutí.
- **Co dostanu jako výsledek?**  
  Strukturovaný JSON objekt s nalezenými údaji.
- **Jak poznám, že operace proběhla správně?**  
  Pola formuláře se automaticky vyplní a operace získá `traceId`.
- **Jaké jsou limity?**  
  Extrakce slouží jako návrh a vyžaduje kontrolu uživatelem.
- **Kdy potřebuji schválení administrátora?**  
  Zpracování dokumentů pro uživatele neprochází schválením (`requiresHumanApproval: false`).
- **Co dělat při chybě?**  
  Ujistěte se, že PDF obsahuje čitelný text nebo kvalitní sken.
- **Bezpečnostní upozornění:**  
  Dokumenty jsou zpracovávány důvěrně v rámci vašeho účtu.

---

## 3. Technical Guide (Technická specifikace)

- **Agent Identity:** `DOCUMENT_PROCESSOR`
- **AgentType:** `ExperimentalAgentArchetype`
- **Capabilities:**
  - `document.read` (RiskLevel: `P2`, RequiresHumanApproval: `false`)
  - `document.parse` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
  - `ocr.extract` (RiskLevel: `P3`, RequiresHumanApproval: `false`)
- **Allowed Scopes:** `document.read`, `document.parse`, `ocr.extract`
- **RBAC Requirement:** Přihlášený uživatel / `CONTENT_MANAGER` / `ADMIN`.
- **Policy Engine:** Kontrola vlastnictví dokumentu (BOLA/IDOR).
- **ControlPlaneAuthorization:** Evaluováno přes `authorizeAgentRequest()`.
- **Allowed Providers:** `gemini`
- **Trace Required:** `true`

---

## 4. Matrix implementačního stavu

| Komponenta | Stav | Poznámka |
| :--- | :--- | :--- |
| **Frontend** | PARTIAL | Rozhraní pro nahrávání rozsudků v aplikaci |
| **Backend** | PARTIAL | Integrace na AI Extractor a Fallback engine |
| **API** | PARTIAL | Extrakční endpointy pro rozsudky |
| **Database** | ⚪ NOT FOUND | Záznamy v spisu (bez změny schéma agenta) |
| **RBAC** | ✅ VERIFIED | Podléhá autorizaci |
| **Policy Engine** | ✅ VERIFIED | Kontrola přístupu k dokumentu |
| **Audit** | ✅ VERIFIED | Logování zpracování v OrionTraceStore |
| **Telemetry** | ✅ VERIFIED | Měření času extrakce |
| **AI Provider** | ✅ VERIFIED | Gemini Vision / Document OCR |

---

## 5. Praktické scénáře

### Běžné scénáře
1. **Scénář 1: Extrakce spisové značky z rozsudku**  
   - *Vstup:* PDF soubor rozsudku.  
   - *Výsledek:* Extrahovaná značka "12 C 45/2024".
2. **Scénář 2: Parsing výše stanoveného výživného**  
   - *Vstup:* Sken rozsudku o výživném.  
   - *Výsledek:* Extrahované částky a lhůty splatnosti.
3. **Scénář 3: OCR vytěžení naskenované strany**  
   - *Vstup:* Obrázek dokumentu bez textové vrstvy.  
   - *Výsledek:* Převedený čistý text.

### Pokročilé scénáře
1. **Scénář 1 (Pokročilý): Anonymizace osobních údajů z rozsudku**  
   - *Vstup:* Plný text rozsudku.  
   - *Výsledek:* Text s nahrazenými jmény za iniciály.
2. **Scénář 2 (Pokročilý): Detekce typu právního úkonu**  
   - *Vstup:* Právní podání.  
   - *Výsledek:* Klasifikace typu dokumentu.

### Zakázané scénáře
1. **Zakázaný scénář 1: Pokus o čtení spisu jiného uživatele (BOLA)**  
   - *Pokus:* Extrakce dokumentu s ID cizího uživatele.  
   - *Reakce:* `DENY` — BOLA kontrola přístupu zamezí operaci.
2. **Zakázaný scénář 2: Úprava původního PDF na disku**  
   - *Pokus:* Příkaz k přepsání souboru na disku.  
   - *Reakce:* `DENY` — Soubory na disku jsou read-only.
