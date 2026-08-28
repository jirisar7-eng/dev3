# ARCHITEKTURNÍ AUDIT FÁZE 20: KLIENTSKÝ PORTÁL × PODÁNÍ × DOKUMENTY × SYNCHRONIZACE

**Projekt:** „Táta má právo“ (dev3)  
**Datum a čas auditu:** 2026-08-28 10:20:00 CEST  
**Větev:** `audit/phase-20-client-portal-submissions`  
**Pracovní režim:** ABSOLUTNĚ READ-ONLY AUDIT (0 změn v produkčním kódu, DB schema i API)  
**Auditor:** Hlavní softwarový architekt, DevSecOps inženýr a QA auditor  

---

## EXEKUTIVNÍ SHRNUTÍ

Tento architektury audit podrobně zkoumá stav Klientského portálu (`/muj-pripad`), správy spisu otce, generování a správy právních podání, práce s klientskými dokumenty a důkazy, AI asistenty a offline/PWA šifrovaného úložiště v projektu „Táta má právo“.

Audit potvrdil, že klientská část disponuje **velmi pokročilou a funkční architekturou pro správu spisu otce** s reálnou PostgreSQL/Prisma persistencí, bezpečnými API endpointy s RBAC/owner izolací, antivirovou kontrolou nahraných souborů (ClamAV) a S3/MinIO objektovým úložištěm. Stejně tak PWA offline vrstva obsahuje produkční kryptografické úložiště `SecureDB` pracující s AES-256-GCM a PBKDF2 klíči uchovávanými výhradně v paměti.

Zároveň audit odhalil **architektonické mezery v oblasti verze a persistence rozpracovaných podání (draftů)**, které jsou v současnosti drženy primárně v `sessionStorage` nebo stahovány jako lokální soubory (PDF/DOCX), a chybějící automatizovanou obousměrnou synchronizaci offline změn (Conflict Resolution Sync Queue) při výpadku sítě.

---

## 1. ZMAPOVÁNÍ KLIENTSKÉHO PORTÁLU (`/muj-pripad` & `UserDashboard`)

Klientský portál je koncipován jako privátní, plně zabezpečený prostor otce pro správu jeho opatrovnického případu, dětí, dokumentů, důkazů a soudního harmonogramu.

### Součásti a jejich reálný stav:

1. **Osobní spis otce (`/muj-pripad`, `MyCasePage.tsx`):**
   - **Stav:** `EXISTUJE` (Plně funkční produkční modul).
   - **Popis:** Načítá a spravuje reálné případy uživatele skrze `/api/cases`. Umožňuje zakládání nových spisů, přepínání mezi spisy a detailní správu 12 specializovaných záložek (Přehled, Péče & Harmonogram, Děti, Kalendář, Trezor dokumentů, Deník & Incidenty, Soud & OSPOD, Úkoly & Lhůty, Poznámky, Důkazy, Časová osa, Zabezpečení).
   - **Data:** Název spisu, spisová značka (sp. zn.), příslušný okresní/krajský soud, soudce, účastníci řízení.

2. **Přehledová nástěnka (`UserDashboard.tsx`):**
   - **Stav:** `EXISTUJE`.
   - **Popis:** Poskytuje agregovaný pohled pro přihlášeného uživatele (profil, stav podpory, navržené subjekty v záložce `UserSubmissionsTab`, klientské dokumenty a odkaz na Osobní spis).

3. **Správa dětí ve spisu (`CaseChildrenTab.tsx`, `Child` model):**
   - **Stav:** `EXISTUJE`.
   - **Popis:** Ukládá jméno, příjmení, datum narození, rodné číslo (šifrovaně/chráněno), školu/školku, lékaře, režim bydliště a speciální potřeby dítěte.

4. **Trezor dokumentů (`CaseDocumentsTab.tsx`, `CaseDocument` model):**
   - **Stav:** `EXISTUJE`.
   - **Popis:** Bezpečné nahrávání a správa spisových dokumentů (návrhy, rozsudky, zprávy OSPOD, znalecké posudky). Propojeno na S3/MinIO a antivirovou kontrolu.

5. **Katalog důkazů (`CaseEvidenceTab.tsx`, `CaseEvidence` model):**
   - **Stav:** `EXISTUJE`.
   - **Popis:** Evidence komunikace, audio nahrávek, fotografií a listinných důkazů s hodnocením důkazní síly, relevancí a vazbou na incidenty.

6. **Kalendář péče & událostí (`CaseCalendarTab.tsx`, `CaseEvent` model):**
   - **Stav:** `EXISTUJE`.
   - **Popis:** Plánování předávání dětí, soudních stání, OSPOD jednání a incidentů s barevným odlišením a výpočtem ročních statistik péče.

7. **AI Generátory podání (`AiFormsView.tsx`, `/ai-formulare`):**
   - **Stav:** `ČÁSTEČNĚ`.
   - **Popis:** Generuje návrhy na střídavou péči, předběžná opatření a vyjádření pro OSPOD z oficiálních vzorů MS ČR a e-Sbírky. Umožňuje úpravu pomocí Gemini AI (`/api/ai/chat`) a export do PDF/DOCX/TXT. **Chybí však přímé ukládání konceptu návrhu do databáze jako klientský draft podání.**

8. **AI Case Manager (`AiCaseManagerView.tsx`, `/ai-asistent`):**
   - **Stav:** `EXISTUJE`.
   - **Popis:** Provádí AI rozbor zpráv OSPOD a vyjádření protistrany. Obsahuje klientský automatický anonymizátor citlivých údajů (RČ, e-maily, tel. čísla) před odesláním na LLM endpoint `/api/ai/analyze-document`.

9. **Uložené návrhy a historie verzí podání:**
   - **Stav:** `CHYBÍ`.
   - **Popis:** Vytvořená podání v `AiFormsView` se neukládají do vyhrazené DB tabulky návrhů s verzováním. Uživatel je musí okamžitě vytisknout, stáhnout nebo manuálně nahrát do Trezoru dokumentů.

10. **PWA / Offline šifrované úložiště (`SecureDB.ts`, `CryptoService.ts`):**
    - **Stav:** `EXISTUJE`.
    - **Popis:** Šifrování IndexedDB pomocí AES-256-GCM. Klíč MEK je odvozen z uživatelského PINu přes PBKDF2 a žije výhradně v paměti. Po 15 min neaktivity se DB automaticky uzamkne.

---

## 2. ZMAPOVÁNÍ NÁVRHŮ PRÁVNÍCH PODÁNÍ

| Aspekt podání | Zjištěný stav v kódové základně | Hodnocení |
| :--- | :--- | :--- |
| **Místo vzniku** | `AiFormsView.tsx` (`/ai-formulare`), `COURT_TEMPLATES` (`legalTemplates.ts`) | `EXISTUJE` |
| **Ukládání na server** | Návrhy se na server ukládají **pouze tehdy**, pokud je uživatel explicitně uloží jako `CaseDocument` přes `/api/cases/:id/documents`. Neexistuje samostatný model `CaseSubmissionDraft`. | `ČÁSTEČNĚ` |
| **Lokální mezipaměť** | Kontext formuláře se dočasně ukládá do `sessionStorage` pod klíčem `tatovapravo_form_context`. | `ČÁSTEČNĚ` |
| **Finalizovaná podání** | Export do PDF (přes `window.print` se speciálním print CSS) a DOCX (přes `docx` knihovnu) v `DocumentExportService.ts`. | `EXISTUJE` |
| **Historie verzí podání** | V DB neexistuje tabulka pro verzování rozpracovaných textů podání. | `CHYBÍ` |
| **Opětovné otevření draftu** | Lze prefillovat z existujícího spisu přes URL parametr `?caseId=XYZ`, ale rozpracovaný neodeslaný text z minulé relace se neobnoví. | `ČÁSTEČNĚ` |
| **Propojení na e-Sbírku** | Každé generované podání automaticky připojuje právní doložku e-Sbírky s datem ověření platnosti legislativy. | `EXISTUJE` |

---

## 3. ZMAPOVÁNÍ SPRÁVY DOKUMENTŮ A DŮKAZŮ

Proces zpracování dokumentů v klientském portálu je navržen s vysokým důrazem na bezpečnost a datovou integritu:

```
[Klient Browser] 
    │ (Upload Base64 / Multipart)
    ▼
[Express Endpoint: POST /api/cases/:caseId/documents]
    │
    ├── 1. Antivirová kontrola: ClamAvService.scanBuffer(buffer)
    │      └── Pokud nález vírus/malware ➔ HTTP 400 Bad Request (REJECTED)
    │
    ├── 2. Hashování a uložení: MinioStorageService.uploadPdf(buffer)
    │      ├── Vytvoření SHA-256 otisku (fileHash)
    │      └── Uložení do MinIO/S3 bucketu 'tatovacesta-vault'
    │
    └── 3. Z zápis do PostgreSQL přes Prisma:
           ClientCaseService.createDocument(...)
           └── Vytvoří záznam v CaseDocument (fileUrl, s3Bucket, s3ObjectKey, fileHash)
```

### Zhodnocení vlastností:
- **Podpora formátů:** PDF, DOCX, TXT, PNG, JPG (v `extractTextFromFile.ts` je integrován parser pro extrakci textu z PDF a obrázků).
- **Integrita:** Každý soubor má vypočten SHA-256 hash a je sledována velikost a MIME typ.
- **Asociace ke spisu:** Dokumenty jsou striktně navázány na `Case` skrze cizí klíč `caseId` s kaskádovým pravidlem.
- **Právní rozsudky:** Rozsudky vložené do spisu mohou být analyzovány přes `JudgmentParserService` / `deterministicJudgmentParser.ts` a automaticky extrahovat povinnosti, výživné a harmonogram péče do tabulky `Judgment`.

---

## 4. ZMAPOVÁNÍ AI CASE MANAGERU A BEZPEČNOSTI SOUKROMÍ

AI asistent a generátory pracují v přísně vymezeném režimu ochrany soukromí:

1. **Klientský auto-anonymizátor (`AiCaseManagerView.tsx`):**
   - Před odosláním textu dokumentu (např. zprávy OSPOD nebo vyjádření matky) na backend spustí klientskou funkci `anonymizeText()`.
   - Regulační výrazy automaticky nahradí:
     - Rodná čísla (`\b\d{6}\/\d{3,4}\b`) ➔ `[RODNÉ ČÍSLO MASKUJE AI]`
     - E-mailové adresy ➔ `[E-MAIL MASKUJE AI]`
     - Telefonní čísla ČR ➔ `[TELEFON MASKUJE AI]`
   - Uživatel vidí přesný počet anonymizovaných výskytů.

2. **Izolace AI od spisu:**
   - AI služby nečtou automaticky celý spis na pozadí bez vědomí uživatele.
   - Do AI se posílají pouze data, která uživatel explicitně vloží do kontextu formuláře nebo nahraje k analýze.
   - **Důležitý invariant:** AI prompt logy na serveru neukládají neanonymizovaná osobní data.

3. **Garantovaná izolace veřejného AI kontextu:**
   - Modul `AiContextService.ts` generující index pro AI agenty (`/ai-context`, `llms.txt`) má v konstantě `PRIVATE_SLUGS_PREFIXES` explicitně uvedeno:
     `'muj-pripad'`, `'pripad'`, `'moje-slozka'`, `'portal'`, `'user-portal'`, `'coparent'`.
   - **Osobní spisy otců jsou 100% vyloučeny z jakéhokoli indexování pro vyhledávače i LLM crawlery.**

---

## 5. ZMAPOVÁNÍ OFFLINE A PWA STORAGE (`SecureDB` & `CryptoService`)

Architektura offline úložiště splňuje vysoké bezpečnostní standardy:

1. **Kryptografické řešení (`CryptoService.ts`):**
   - Algoritmus: **AES-256-GCM** s náhodným 12-bytovým IV pro každý záznam.
   - Derivace klíče: **PBKDF2** (SHA-256, 100 000 iterací, 16-bytový salt).
   - Klíč MEK (Master Encryption Key) žije pouze v paměti (`private mek: any | null = null`) a **nikdy se nezapisuje na disk ani do localStorage**.

2. **Bezpečnostní mechanismy (`SecureDB.ts`):**
   - DB Name: `tata_ma_pravo_secure_db` (IndexedDB).
   - **Auto-Lock:** Timer automaticky skartuje MEK z paměti po 15 minutách neaktivity (`LOCK_TIMEOUT_MS = 15 * 60 * 1000`).
   - **Secure Wipe:** Funkce `secureWipe()` okamžitě vymaže celou IndexedDB a uzamkne relaci.
   - **Fail-closed:** Při jakékoli chybě dešifrování nebo poškození záznamu vrátí chybu dešifrování a neposkytne částečný plaintext.

3. **Architektonická mezera v synchronizaci:**
   - `SecureDB` v současnosti slouží jako lokální offline trezor.
   - **Chybí automatická synchronizační fronta (Background Sync Queue)**, která by při obnovení internetového připojení automaticky odeslala offline vytvořené události nebo dokumenty na server a vyřešila případné konflikty razítek (Conflict Resolution).

---

## 6. ZMAPOVÁNÍ PRÁV, ROLES (RBAC) A IZOLACE

Přístup ke klientským spisům je chráněn na úrovni middleware i databázové vrstvy:

1. **Authentication Middleware:**
   - Endpointy `/api/cases/*` používají `requireAuth`. Každý požadavek musí obsahovat platný JWT Bearer token nebo session cookie.

2. **BOLA / IDOR Ochrana (`ClientCaseService.ts`):**
   - Všechny DB dotazy striktně kontrolují vlastníka spisu (`ownerId = user.id`).
   - Uživatel s rolí `USER` vidí **výhradně své vlastní spisy**. Pokus o přístup k cizímu `caseId` končí chybou HTTP 403 Forbidden.

3. **Oddělení Administrace od Osobních spisů otců:**
   - Uživatelé s rolí `ADMIN` nebo `SUPER_ADMIN` mají přístup k administraci (CMS, správa uživatelů, VPS, audit logy, Project Control Center).
   - **Administrátoři NEMÁJÍ v UI ani v API automatické právo prohlížet osobní spisy otců (`/muj-pripad`)**, pokud jim otce neudělí explicitní přístup (např. právní zastoupení/podpora).
   - Tím je dodržen princip nejmenších oprávnění a ochrana osobních údajů.

---

## 7. SYNCHRONIZACE A DATOVÝ TOK

```
+-----------------------------------------------------------------------------------+
|                                  KLIENTSKÝ PROHLÍŽEČ                              |
|                                                                                   |
|  +--------------------+     +---------------------+     +----------------------+  |
|  | MyCasePage         |     | AiFormsView         |     | SecureDB (IndexedDB) |  |
|  | (React State)      |     | (Form State)        |     | (AES-256-GCM Vault)  |  |
|  +---------+----------+     +----------+----------+     +----------+-----------+  |
+------------|---------------------------|---------------------------|--------------+
             | REST API                  | REST API                  | Offline State
             ▼                           ▼                           ▼
+-----------------------------------------------------------------------------------+
|                                EXPRESS BACKEND SERVER                             |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | requireAuth Middleware (JWT / Session Verification)                         |  |
|  +-------------------------------------+---------------------------------------+  |
|                                        |                                          |
|  +-------------------------------------v---------------------------------------+  |
|  | ClientCaseService (BOLA/IDOR Checks: ownerId === user.id)                   |  |
|  +----------+--------------------------+---------------------------+-----------+  |
+-------------|--------------------------|---------------------------|--------------+
              |                          | Antivirus                 | Storage
              ▼                          ▼                           ▼
     +-----------------+        +------------------+        +------------------+
     | PostgreSQL DB   |        | ClamAV Daemon    |        | MinIO / S3       |
     | (Prisma Engine) |        | (Buffer Scanner) |        | (Vault Bucket)   |
     +-----------------+        +------------------+        +------------------+
```

### Chování při výpadku sítě:
- Aplikace přepne do režimu zobrazení upozornění: *"Aplikace běží v bezpečném lokálním režimu"*.
- Data v paměti Reactu zůstávají dostupná.
- Změny vytvořené offline vyžadují ruční obnovení nebo uložení do `SecureDB`.

---

## 8. VYHODNOOCENÍ ARCHITEKTURNÍCH MEZER

1. **Chybějící persistence rozpracovaných podání (Submission Drafts):**
   - V Prisma schématu neexistuje model `CaseSubmissionDraft`. Pokud uživatel zavře prohlížeč během tvorby složitého podání v `AiFormsView`, neuložené změny mimo `sessionStorage` mohou být ztraceny.

2. **Chybějící obousměrná offline synchronizační fronta (Offline Sync Queue):**
   - Při vytvoření záznamu bez internetu se změna uloží lokálně, ale po připojení chybí automatický pozadní worker, který by poslal offline změny na server.

3. **Chybějící verzování právních podání:**
   - Není sledována historie úprav návrhu podání (verze 1, verze 2 s vyjádřením OSPOD, finální verze odeslaná na soud).

4. **Absence explicitního příznaku stavu podání:**
   - V souborech spisu nelze jednoznačně odlišit běžný naskenovaný dokument od "Oficiálního podání odeslaného na soud" s potvrzením o doručení (datová schránka / pošta).

---

## 9. SOUHRNNÁ TABULKA STAVU KOMPONENT FÁZE 20

| Komponenta / Funkcionalita | Místo v kódové základně | Stav |
| :--- | :--- | :--- |
| **Osobní spis otce (`/muj-pripad`)** | `src/pages/MyCasePage.tsx` | `EXISTUJE` |
| **Klientský Dashboard** | `src/components/private/UserDashboard.tsx` | `EXISTUJE` |
| **Správa dětí ve spisu** | `src/components/case/CaseChildrenTab.tsx` | `EXISTUJE` |
| **Trezor dokumentů (S3/MinIO)** | `src/routes/caseRoutes.ts`, `MinioStorageService.ts` | `EXISTUJE` |
| **Antivirová kontrola (ClamAV)** | `src/services/clamAvService.ts` | `EXISTUJE` |
| **Katalog důkazů** | `src/components/case/CaseEvidenceTab.tsx` | `EXISTUJE` |
| **AI Generátor podání** | `src/components/public/ai/AiFormsView.tsx` | `ČÁSTEČNĚ` |
| **AI Case Manager & Anonymizátor** | `src/components/public/ai/AiCaseManagerView.tsx` | `EXISTUJE` |
| **PWA Offline Vault (`SecureDB`)** | `src/services/offline/SecureDB.ts` | `EXISTUJE` |
| **AES-256-GCM Kryptografie** | `src/services/offline/CryptoService.ts` | `EXISTUJE` |
| **Persistence konceptů podání (Drafts)**| `prisma/schema.prisma` (model chybí) | `CHYBÍ` |
| **Offline Sync Queue & Resolution** | Service Worker / Sync Manager | `CHYBÍ` |
| **Verzování podání v DB** | Model pro vícenásobné verze podání | `CHYBÍ` |

---

## 10. BEZPEČNOSTNÍ A PRIVÁTNÍ INVARIANTY

В rámci auditu byly ověřeny a potvrzeny následující invarianty ochrany soukromí:

1. **INVARIANT 1 (Smart Audit Isolation):**
   - Systém Smart Audit (Fáze 19) a administrátorské přehledy pracují **výhradně s technickými metadaty projektu** (GitHub repozitář, úkoly vývoje, kódová základna).
   - **Smart Audit má nulový přístup k obsahu osobních spisů otců, dokumentům, důkazům či textům podání.**

2. **INVARIANT 2 (Ochrana před LLM Leakage):**
   - Osobní spisy (`/muj-pripad`) jsou explicitně blockované pro AI indexování v `AiContextService.ts` a v `robots.txt` (`Disallow: /muj-pripad/`).
   - AI rozbory v `AiCaseManagerView` povinně maskují rodná čísla, e-maily a telefony před odesláním na LLM endpoint.

3. **INVARIANT 3 (Owner-Only Access):**
   - Přístup ke spisu je na úrovni databáze svázán s `ownerId`. Ani v případě BOLA útoku se změněným ID v URL nelze přistoupit k cizímu spisu.

---

## 11. NÁVRH BEZPEČNÉHO HYBRIDNÍHO MODELU SYNCHRONIZACE

Probudoucí Fázi 21 se navrhuje následující třívrstvá architektura hybridní synchronizace:

```
+---------------------------------------------------------------------------+
| VRSTVA 1: PWA OFFLINE VAULT (LOKÁLNÍ)                                     |
| - SecureDB (IndexedDB + AES-256-GCM)                                      |
| - Ukládá okamžitě všechny offline úpravy, rozpracovaná podání a poznámky.  |
+------------------------------------+--------------------------------------+
                                     |
                                     | Event: Online Detected
                                     ▼
+---------------------------------------------------------------------------+
| VRSTVA 2: SYNC ENGINE & CONFLICT RESOLUTION (KLIENT / SERVER INTERFACE)  |
| - Porovnání razítek updatedAt a verzí (Vector Clocks / Client Timestamp)   |
| - Řešení konfliktů: Server-Wins pro oficiální soudní záznamy,            |
|   Client-Merge pro rozpracované poznámky a drafty podání.                |
+------------------------------------+--------------------------------------+
                                     |
                                     | Authenticated Encrypted Transport
                                     ▼
+---------------------------------------------------------------------------+
| VRSTVA 3: CENTRAL SERVER VAULT (PERSISTENTNÍ)                             |
| - PostgreSQL DB (Prisma) + MinIO / S3 Storage                             |
| - Trvalé bezpečné uložení finalizovaných spisů, dokumentů a podání.       |
+---------------------------------------------------------------------------+
```

---

## 12. DOPORUČENÝ PLÁN PRO FÁZI 21+ (BACKLOG TECHNICKÝCH ÚKOLŮ)

Na základě výsledků auditu FÁZE 20 se doporučuje následující prioritizovaný postup realizace:

### Fáze 21.1: Persistence a verzování konceptů podání (Drafts)
- Vytvořit Prisma model `CaseSubmission` a `CaseSubmissionVersion` navázaný na `Case`.
- Umožnit průběžné automatické ukládání rozpracovaného podání z `AiFormsView` do DB.
- Přidat stav podání (`DRAFT`, `FINALIZED`, `SUBMITTED_TO_COURT`, `ARCHIVED`).

### Fáze 21.2: Implementace Offline Sync Queue (Obousměrná synchronizace)
- Vytvořit klient-side frontend službu `CaseSyncService`, která bude evidovat offline frontu změn v `SecureDB`.
- Po obnovení připojení provést bezpečný flush fronty na `/api/cases/sync` s detekcí konfliktů.

### Fáze 21.3: Přímá integrace generátoru podání s Trezorem dokumentů
- Přidat tlačítko *"Uložit vygenerované podání přímo do spisu otce"* do `AiFormsView`.
- Automaticky vygenerovat PDF/DOCX na backendu a zařadit jej mezi `CaseDocument` s příznakem `GENERATED_BY_AI`.

---

## 13. AUDITNÍ REPORTING A AUDIT LOG

Chování systému při práci s dokumenty a spisy je zaznamenáváno do auditu:
- Nahrání dokumentu ➔ Záznam v `LegalAuditLog` s akcí `DOCUMENT_UPLOADED` a fileHash.
- Smazání dokumentu ➔ Záznam v `LegalAuditLog` s akcí `DOCUMENT_DELETED`.
- Přístup ke spisu ➔ Záznam v `LegalAuditLog` s akcí `CASE_VIEWED`.

---

## 14. ZÁVĚREČNÝ VERDIKT AUDITORŮ

**Celkové hodnocení architektury Klientského portálu a podání:**

### **STAV: ARCHITEKTONICKY STABILNÍ A BEZPEČNÉ • PŘIPRAVENO PRO PROSOUHLASENOU FÁZI 21**

**Zdůvodnění:**  
Klientský portál (`/muj-pripad`) a správa spisové agendy otců mají vybudované **velmi silné bezpečnostní základy** (BOLA/IDOR ochrana, ClamAV antivir, S3/MinIO úložiště, AES-256-GCM šifrovaná offline DB). Podání a AI nástroje důsledně chránějí soukromí uživatelů anonymizací a izolací od veřejného indexování.

Implementací Fáze 21 (persistence draftů podání a automatizovaná synchronizace) získá portál plnou produkční zralost bez rizika ztráty dat při výpadku spojení.

---
*Auditní zpráva byla vyhotovena a ověřena v read-only režimu.*  
*Git Commit SHA (HEAD): `869d85b`*  
*Větev: `audit/phase-20-client-portal-submissions`*
