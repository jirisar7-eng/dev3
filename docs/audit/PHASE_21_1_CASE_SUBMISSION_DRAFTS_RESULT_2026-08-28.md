# AUDIT REPORT – FÁZE 21.1: CASE SUBMISSION DRAFTS & PERSISTENCE

**Datum a čas auditu:** 2026-08-28 10:31 UTC  
**Název úkolu:** FÁZE 21.1 – Persistentní databázová vrstva pro rozpracovaná podání (AiFormsView Submission Drafts)  
**Pracovní větev:** `feature/phase-21-1-case-submission-drafts`  
**Cílový stav:** Dokončeno, otestováno, ověřeno buildem  

---

## 1. PŮVODNÍ POŽADAVEK A CÍL
Implementovat bezpečnou persistentní databázovou vrstvu a backendové API pro koncepty podání (submission drafts) generované z interaktivních formulářů `AiFormsView`.
Systém musí podporovat:
- Vytvoření a automatické ukládání rozpracovaného návrhu (draftu) navázaného na konkrétní případ (`Case`) a uživatele (`User`).
- Přísnou kontrolu vlastnictví na serverové straně proti IDOR / BOLA útokům.
- Kompletní verzování změn s možností návratu (rollback) k libovolné historické verzi návrhu.
- Plnou podporu jak pro PostgreSQL (Prisma ORM), tak pro in-memory / fallback režim (`dbStore.ts`).
- REST API endpointy autorizované pomocí JWT tokenů.

---

## 2. PROVEDENÉ SEZNAMY ZMĚN A ARCHITEKTURA

### A. Databázové schématu a typy
1. **`prisma/schema.prisma`**:
   - Vytvořen model `CaseSubmissionDraft` s unikátním klíčem `id`, vazbami `@relation` na `Case` (`caseId`) a `User` (`userId`), políčky `title`, `templateId`, `status` (DRAFT, FINAL, ARCHIVED), `formData` (Json), `generatedContent` (Text), `notes` (Text), `version` (Int).
   - Vytvořen model `CaseSubmissionDraftVersion` udržující historické snapshoty verzí pro každý koncept.
2. **`src/types/index.ts`**:
   - Přidány TypeScript rozhraní `CaseSubmissionDraft`, `CaseSubmissionDraftVersion` a typ `SubmissionDraftStatus`.
3. **`src/services/dbStore.ts`**:
   - Rozšířen in-memory store o pole `submissionDrafts` a `submissionDraftVersions` pro podporu testovacího prostředí a fail-safe fallbacku.

### B. Backendová logika a služby
4. **`src/services/submissionDraftService.ts`**:
   - Vytvořena kompletní služba `SubmissionDraftService` zajišťující:
     - `createDraft`: Vytvoření konceptu a automatické vytvoření Prvotní verze 1.
     - `getDraftsForCase`: Vrácení seznamu konceptů pro spis (autorizovaný přístup).
     - `getDraftById`: Vrácení jednoho konceptu včetně historie verzí s IDOR/BOLA kontrolou.
     - `updateDraft`: Aktualizace obsahu/metadat a automatická tvorba nové verze při změně obsahu.
     - `getDraftVersions`: Načtení historie verzí.
     - `rollbackDraftVersion`: Obnovení předchozí verze vytvořením nové verze se zadaným historickým obsahem.
     - `deleteDraft`: Bezpečné smazání konceptu a jeho verzí z databáze i auditního logu.

### C. REST API Endpointy & Routing
5. **`src/routes/caseRoutes.ts`**:
   - `GET /api/cases/:caseId/submissions` – Seznam konceptů podání pro spis
   - `POST /api/cases/:caseId/submissions` – Vytvoření nového konceptu podání (HTTP 201)
   - `GET /api/cases/:caseId/submissions/:draftId` – Detail konceptu podání včetně historie
   - `PUT /api/cases/:caseId/submissions/:draftId` – Aktualizace / auto-save konceptu
   - `GET /api/cases/:caseId/submissions/:draftId/versions` – Seznam historických verzí
   - `POST /api/cases/:caseId/submissions/:draftId/rollback` – Obnovení verze
   - `DELETE /api/cases/:caseId/submissions/:draftId` – Smazání konceptu

---

## 3. SEZNAM ZMĚNĚNÝCH A VYTVOŘENÝCH SOUBORŮ
- `prisma/schema.prisma` (modifikováno)
- `src/types/index.ts` (modifikováno)
- `src/services/dbStore.ts` (modifikováno)
- `src/services/submissionDraftService.ts` (vytvořeno)
- `src/routes/caseRoutes.ts` (modifikováno)
- `tests/case-submission-drafts-phase21-1.test.ts` (vytvořeno)
- `scripts/test-runner.js` (modifikováno)
- `docs/audit/PHASE_21_1_CASE_SUBMISSION_DRAFTS_RESULT_2026-08-28.md` (tento auditní soubor)

---

## 4. AUDIT BEZPEČNOSTI & PRIVACY (SECURITY CHECK)
- **IDOR / BOLA ochrana:** Všechny servisní metody i API endpointy explicitně volají `ClientCaseService.authorizeCaseAccess(caseId, user)`. Uživatel bez oprávnění k danému spisu neuspěje (obdrží 403 Forbidden).
- **Vlastnictví konceptu:** Každý `draft` je svázán s `userId`. Uživatel bez role ADMIN nemůže přistupovat k cizím konceptům.
- **Secrets Check:** V repozitáři ani v logovacích hlášeních nejsou přítomna žádná nešifrovaná hesla, API klíče ani tokeny.
- **Zamezení úniku PII:** Auditní logování (`AuditService.recordLog`) zaznamenává pouze technická ID objektů a akci, nikoli citlivý osobní text podání.

---

## 5. VÝSLEDKY TESTOVÁNÍ A VERIFIKACE

| Test / Kontrola | Výsledek | Detail / Hlášení |
| :--- | :--- | :--- |
| `tsc --noEmit` | **PASS (100 %)** | 0 typových chyb v celém projektu |
| `case-submission-drafts-phase21-1.test.ts` | **PASS (5/5 subtests)** | CRUD, BOLA/IDOR isolation, Versioning, Rollback, HTTP API |
| `node scripts/test-runner.js` | **PASS (100 %)** | Všechny testovací suity v projektu prošly bez chyby |
| `compile_applet` | **PASS** | Produkční build aplikace je plně funkční a kompilovatelný |

---

## 6. GIT STATUS & CHANGE CONTROL
- **Pracovní větev:** `feature/phase-21-1-case-submission-drafts`
- **Main větev dotčena:** NE (Merge do `main` se provádí výhradně na pokyn uživatele)
- **Příprava na commit & push:** Změny budou commitnuty a pushnuty výhradně na větev `feature/phase-21-1-case-submission-drafts`.

---
*Konec auditního reportu.*
