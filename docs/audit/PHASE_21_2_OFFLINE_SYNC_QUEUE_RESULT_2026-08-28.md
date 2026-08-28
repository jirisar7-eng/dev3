# AUDIT REPORT: FÁZE 21.2 – OFFLINE SYNC QUEUE & CONFLICT RESOLUTION

**Datum a čas:** 2026-08-28 03:40:00 UTC  
**Větev:** `feature/phase-21-2-offline-sync-queue`  
**Projekt:** „Táta má právo“ (dev3)  
**Autor:** Senior Architect & DevSecOps Engineer  
**Stav Fáze:** DOKONČENO (100 % TEST PASS)

---

## 1. PŮVODNÍ POŽADAVEK A CÍL FÁZE 21.2

Implementovat bezpečnou obousměrnou synchronizační frontu mezi PWA Offline Vault (`SecureDB`) a serverovou databází po obnovení připojení k síti.

### Klíčové bezpečnostní a architektureální požadavky:
1. **Analýza Background Sync API vs. Klientský Fallback:**
   - Posoudit vhodnost `Background Sync API` v Service Workeru vs. bezpečného klientského řízení synchronizace (`OfflineSyncService`).
   - Zkontrolovat existující pravidla v `public/sw.js` (např. `SENSITIVE_ROUTES`).
2. **Šifrované ukládání fronty v PWA Vault (`SecureDB`):**
   - Čekající operace ukládat výhradně šifrované pomocí AES-256-GCM pod klíčem `offline_sync_queue`.
   - Vypnout a zakázat ukládání JWT/session tokenů v `SecureDB`.
3. **Automatická synchronizace & Idempotence:**
   - Automaticky zpracovat frontu po detekci konektivity.
   - Retry mechanismus s limitem pokusů (`maxRetries = 3`).
   - Garantovat idempotenci (opakované volání s rovnakým `operationId` / `draftId` nesmí způsobit duplicity).
4. **Detekce & Řešení Konfliktů (LOCAL vs. SERVER):**
   - Detekovat nesoulad verze, pokud se serverový koncept posunul před obnovením spojení (`serverVersion !== baseVersion`).
   - Vrací stav `CONFLICT` (HTTP 409) a detailní porovnání (`conflictDetails`).
   - Manuální možnost řešení: `LOCAL` (přepsání novou verzí) vs. `SERVER` (ponechání serverového konceptu).
5. **Ochrana před BOLA/IDOR:**
   - Všechny operace musí striktně procházet serverovou autorizací spisu `ClientCaseService.authorizeCaseAccess(caseId, user)`.
6. **Fail-Closed & Ochrana neplatných relací:**
   - Pokud je `SecureDB` uzamčena, operace selžou s `ACCESS_DENIED`.
   - Pokud relace vypršela (HTTP 401/403), operace ve frontě dostanou stav `FAILED` s příznakem `EXPIRED_SESSION`.

---

## 2. VÝCHOZÍ STAV & ARCHITEKTONICKÁ ANALÝZA

### 2.1 Analýza Service Workeru (`public/sw.js`)
Při read-only analýze souboru `public/sw.js` byla nalezena pravidla:
```js
const SENSITIVE_ROUTES = ['/api/', '/muj-pripad', '/admin', '/auth'];
```
Service worker má explicitní bezpečnostní pravidlo: **všechny citlivé endpointy `/api/` spadají pod striktní "Network Only" režim a Service Worker je NESMÍ kešovat ani autonomně zachytávat.**

### 2.2 Závěr architektury pro Background Sync
Použití nativního `Background Sync API` přímo v Service Workeru by vyžadovalo:
1. Povolení obcházení "Network Only" pro API požadavky v SW, což by narušilo bezpečnostní architekturu.
2. Předávání JWT/session tokenů do Service Workeru, což je v rozporu s principem Zero-Trust a pravidlem neuplatňovat secrets mimo autorizovaný klientský runtime s MEK.

**Rozhodnutí:**
Bylo implementováno **bezpečné klientské řízení synchronizace (`OfflineSyncService`)**, které běží v kontextu přihlášeného uživatele (s odemčeným `SecureDB` a platným session tokenem v paměti). Toto řešení nevyžaduje ukládání tokenů do databáze a dodržuje pravidlo "Network Only" pro Service Worker.

---

## 3. IMPLEMENTOVANÉ ZMĚNY A KOMPONENTY

### 3.1 Klientská Synchronizační Služba (`src/services/offline/OfflineSyncService.ts`)
Vytvořena nová služba zajišťující:
- **`enqueueOperation(db, params)`**: Zařadí operaci do fronty `offline_sync_queue` v `SecureDB`. Každý záznam má unikatní `operationId`, `clientTimestamp`, `retryCount: 0`, `maxRetries: 3`, `status: 'PENDING'`.
- **`getQueue(db)` / `saveQueue(db, queue)`**: Přečte / uloží šifrovanou frontu přes AES-256-GCM v `SecureDB`.
- **`processQueue(db, apiFetcher)`**: Prochází `PENDING` a `FAILED` operace, odesílá požadavky na backend API, aktualizuje stavy (`COMPLETED`, `CONFLICT`, `FAILED`). Ošetřuje HTTP 401/403 označením `EXPIRED_SESSION`.
- **`resolveConflict(db, operationId, resolution, apiFetcher)`**: Posílá požadavky na vyřešení konfliktu (`LOCAL` nebo `SERVER`) a po úspěšné reakci označuje operaci jako `COMPLETED`.

### 3.2 Rozšíření Serverové Služby (`src/services/submissionDraftService.ts`)
Přidány metody:
- **`processSyncOperation(caseId, user, item)`**:
  - Provede IDOR/BOLA autorizaci spisu přes `ClientCaseService.authorizeCaseAccess(caseId, user)`.
  - **CREATE:** Idempotentně zkontroluje, zda již koncept s daným ID neexistuje (`ALREADY_SYNCED`). Pokud ne, vytvoří nový koncept.
  - **UPDATE:** Porovná `item.baseVersion` se serverovým `existing.version`. Pokud se verze liší, vrátí `CONFLICT` (HTTP 409) s daty `serverDraft`. Pokud verze souhlasí, vytvoří novou verzi v2/v3.
  - **DELETE:** Idempotentně smaže koncept nebo vrátí `ALREADY_SYNCED`.
- **`resolveConflict(caseId, draftId, user, resolution, localPayload)`**:
  - `SERVER`: Ponechá stávající serverový draft a zaznamená auditní log `SUBMISSION_DRAFT_CONFLICT_RESOLVED`.
  - `LOCAL`: Aplikuje `localPayload` a vytvoří novou verzi serverového draftu s popisem `Vyřešení konfliktu: Aplikována verze LOCAL`.

### 3.3 Nové API Endpointy (`src/routes/caseRoutes.ts`)
- **`POST /api/cases/:caseId/submissions/sync`**: Přijímá offline operaci/operace ze synchronizační fronty. Při detekci konfliktu vrací HTTP 409 Conflict.
- **`POST /api/cases/:caseId/submissions/:draftId/resolve-conflict`**: Přijímá požadavek na vyřešení konfliktu s `resolution: 'LOCAL' | 'SERVER'`.

---

## 4. BEZPEČNOSTNÍ VERIFIKACE (SECURITY AUDIT)

| Bezpečnostní Hledisko | Stav | Způsob Ověření |
| :--- | :--- | :--- |
| **BOLA / IDOR Ochrana** | **PASS** | Pokus uživatele 2 o synchronizaci do spisu uživatele 1 vrací HTTP 403 Forbidden. |
| **AES-256-GCM Šifrování** | **PASS** | Data v IndexedDB jsou uložena jako šifrovaný ciphertext bez plaintextových řetězců. |
| **Fail-Closed při uzamčení** | **PASS** | Pokud je `SecureDB` zamčena, volání vyhodí výjimku `ACCESS_DENIED`. |
| **Absence JWT / Secrets** | **PASS** | Ověřeno, že v šifrovaném záznamu ani IndexedDB se nenachází žádné JWT tokeny ani secrets. |
| **Expirace relace** | **PASS** | Požadavek s vypršenou relací (401/403) nastaví stav operace na `FAILED` s `EXPIRED_SESSION`. |
| **Idempotence & Konflikty** | **PASS** | Opakovaný sync neduplikuje data. Při konfliktu verzí se data na serveru neoverwritnou automaticky. |

---

## 5. VÝSLEDKY TESTOVACÍ SADY (`tests/offline-sync-queue-phase21-2.test.ts`)

Byla vytvořena rozsáhlá testovací sada obsahující 11 integračních testů.

```text
TAP version 13
# Subtest: Phase 21.2 – Offline Sync Queue & Conflict Resolution
    # Subtest: 1. should safely enqueue offline draft changes into SecureDB with encryption
    ok 1 - 1. should safely enqueue offline draft changes into SecureDB with encryption
    # Subtest: 2. should fail-closed and throw ACCESS_DENIED if SecureDB is locked
    ok 2 - 2. should fail-closed and throw ACCESS_DENIED if SecureDB is locked
    # Subtest: 3. should process offline queue and successfully sync changes to backend API
    ok 3 - 3. should process offline queue and successfully sync changes to backend API
    # Subtest: 4. should enforce idempotency on repeated sync operations
    ok 4 - 4. should enforce idempotency on repeated sync operations
    # Subtest: 5. should detect conflict when server draft updated before sync
    ok 5 - 5. should detect conflict when server draft updated before sync
    # Subtest: 6. should resolve conflict using LOCAL resolution mode
    ok 6 - 6. should resolve conflict using LOCAL resolution mode
    # Subtest: 7. should resolve conflict using SERVER resolution mode
    ok 7 - 7. should resolve conflict using SERVER resolution mode
    # Subtest: 8. should retry failed network operations up to maxRetries before marking FAILED
    ok 8 - 8. should retry failed network operations up to maxRetries before marking FAILED
    # Subtest: 9. should handle expired or invalid session and mark item FAILED with EXPIRED_SESSION
    ok 9 - 9. should handle expired or invalid session and mark item FAILED with EXPIRED_SESSION
    # Subtest: 10. should reject unauthorized caseId sync attempt on server (BOLA/IDOR protection)
    ok 10 - 10. should reject unauthorized caseId sync attempt on server (BOLA/IDOR protection)
    # Subtest: 11. should NEVER store JWT or session tokens in SecureDB
    ok 11 - 11. should NEVER store JWT or session tokens in SecureDB
1..11
ok 1 - Phase 21.2 – Offline Sync Queue & Conflict Resolution
```

**Výsledek linting & kompilace:**
- `lint_applet`: **PASS (0 chybných modulů)**
- `compile_applet`: **PASS (Build succeeded)**

---

## 6. SOUBORY DOTČENÉ FÁZÍ 21.2

1. **`src/services/offline/OfflineSyncService.ts`** *(NOVÝ)* - Klientská služba synchronizační fronty s AES-256-GCM integrací.
2. **`src/services/submissionDraftService.ts`** *(UPRAVENÝ)* - Přidána podpora `processSyncOperation` a `resolveConflict`.
3. **`src/routes/caseRoutes.ts`** *(UPRAVENÝ)* - Přidány REST API endpointy `/submissions/sync` a `/resolve-conflict`.
4. **`tests/offline-sync-queue-phase21-2.test.ts`** *(NOVÝ)* - Kompletní testovací sada pro Fázi 21.2.
5. **`scripts/test-runner.js`** *(UPRAVENÝ)* - Registrace testu v hlavním test spouštěči.
6. **`docs/audit/PHASE_21_2_OFFLINE_SYNC_QUEUE_RESULT_2026-08-28.md`** *(NOVÝ)* - Výsledný auditní report.

---

## 7. AUDIT A GIT WORKFLOW (DEFINITION OF DONE)

- **Pracovní větev:** `feature/phase-21-2-offline-sync-queue`
- **Main větev:** Nedotčena (přísně zachována jako stabilní produkční základ).
- **Secrets:** Ověřeno, žádné API klíče ani JWT tokeny v repozitáři ani v logách.
- **Data integrity:** Žádná mock data v produkční databázové cestě.

---
*Report připraven a ověřen pro projekt „Táta má právo“ (dev3).*
