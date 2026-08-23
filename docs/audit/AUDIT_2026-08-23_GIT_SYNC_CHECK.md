# AUDIT: Ověření kompletní synchronizace AI Studio → GitHub

**Datum a čas auditu:** 2026-08-23 00:26:00 CEST  
**Projekt:** Táta má právo – dev3  
**Účel:** Ověření stavu Git repozitáře a synchronizace změn mezi AI Studiem a GitHubem.

---

## A. Git synchronizace

- **aktuální větev:** `master`
- **lokální HEAD:** `97dbdc07815d5d4815b03607cd6bca5e435a5bc1`
- **origin/main:** `bb1fbdad9ace16fade5e9df01227ab1f2e3650e1`
- **jsou HEAD a origin/main stejné?** NE (`origin/main` má 2 dodatečné commity z VPS skriptů: `003ed84` a `bb1fbda`)
- **existují necommitnuté změny?** ANO (13 modifikovaných souborů, 5 nesledovaných nových souborů)
- **existují commity pouze lokálně?** NE (všechny předchozí lokální commity po `97dbdc0` jsou obsaženy v `origin/main`)
- **existují commity na GitHubu, které lokálně chybí?** ANO (commity `003ed84` a `bb1fbda` obsahující skripty `auto-sync-main.sh` a `update`)

---

## B. Změny AI Studia

Poslední změny týkající se vývoje **Audit Center (DEV3)** provedené v AI Studiu **NEJSOU na GitHubu**.
Zůstávají v lokálním pracovním stromě AI Studia jako necommitnuté a untracked soubory.

---

## C. Registry

### 1. Soudy – registr 109 soudů
- **nalezeno:** ANO (`src/data/soudyDataset.ts`, `prisma/seeds/import-soudy-full.ts`, `audits/registry/SOUDY_REGISTRY_IMPORT_AUDIT_2026-08-22.md`)
- **commitnuto:** ANO (commit `97dbdc0`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 2. OSPOD – registr 227 pracovišť
- **nalezeno:** ANO (`src/data/ospodDataset.json`, `src/scripts/importOspody.ts`, auditní zprávy)
- **commitnuto:** ANO (commity `0bf31b0`, `dcdf741`, `9dfc9e9`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 3. Znalci – registr soudních znalců
- **nalezeno:** ANO (`src/data/nonOspodSubjekty.ts`, `docs/audit/EXPERTS_AND_INSTITUTIONS_CONTENT_AUDIT_2026-08-22.md`)
- **commitnuto:** ANO (commit `97dbdc0`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 4. Advokáti – registr rodinných advokátů
- **nalezeno:** ANO (`src/data/nonOspodSubjekty.ts`, `docs/audit/EXPERTS_AND_INSTITUTIONS_CONTENT_AUDIT_2026-08-22.md`)
- **commitnuto:** ANO (commit `97dbdc0`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 5. Poradny – registr poraden
- **nalezeno:** ANO (`src/data/nonOspodSubjekty.ts`, `docs/audit/EXPERTS_AND_INSTITUTIONS_CONTENT_AUDIT_2026-08-22.md`)
- **commitnuto:** ANO (commit `97dbdc0`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 6. Mediátoři – registr mediátorů
- **nalezeno:** ANO (`src/data/nonOspodSubjekty.ts`, `docs/audit/EXPERTS_AND_INSTITUTIONS_CONTENT_AUDIT_2026-08-22.md`)
- **commitnuto:** ANO (commit `97dbdc0`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 7. Centrální registr subjektů
- **nalezeno:** ANO (`src/components/public/RegistrSubjektu.tsx`, `src/routes/subjektRoutes.ts`, `src/services/subjektService.ts`, `src/components/admin/SubjektManager.tsx`)
- **commitnuto:** ANO (commity `8d0d36c`, `e137b61`, `4a72ffd`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 8. Mapa subjektů
- **nalezeno:** ANO (`src/components/public/MapaSubjektuView.tsx`, `src/components/public/SubjektyMap.tsx`)
- **commitnuto:** ANO (commity `dcac0a2`, `aa87efc`, `8791e13`, `4a72ffd`, `8a1ad18`)
- **pushnuto:** ANO (součást `origin/main`)
- **aktuální stav:** Synchronizováno na GitHubu

### 9. Audit Center
- **nalezeno:** ANO (`src/components/admin/AuditCenter.tsx`, `src/routes/auditCenterRoutes.ts`, `src/services/auditCenterService.ts`, `src/components/public/SharedAuditView.tsx`, `docs/audit/AUDIT_2026-08-23_AUDIT_CENTER_DEV3.md`)
- **commitnuto:** NE
- **pushnuto:** NE
- **aktuální stav:** Pouze v necommitnutém lokálním pracovním stromu AI Studia

---

## D. Chybějící změny

Následující změny vytvořené v AI Studiu nejsou commitnuté ani pushnuté do GitHubu:

1. **SOUBOR:** `src/components/admin/AuditCenter.tsx`  
   **STAV:** Untracked (Není v Gitu)  
   **DŮVOD:** Vytvořen během vývoje Audit Center DEV3, dosud necommitnut.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

2. **SOUBOR:** `src/routes/auditCenterRoutes.ts`  
   **STAV:** Untracked (Není v Gitu)  
   **DŮVOD:** Vytvořen během vývoje Audit Center DEV3, dosud necommitnut.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

3. **SOUBOR:** `src/services/auditCenterService.ts`  
   **STAV:** Untracked (Není v Gitu)  
   **DŮVOD:** Vytvořen během vývoje Audit Center DEV3, dosud necommitnut.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

4. **SOUBOR:** `src/components/public/SharedAuditView.tsx`  
   **STAV:** Untracked (Není v Gitu)  
   **DŮVOD:** Vytvořen během vývoje Audit Center DEV3, dosud necommitnut.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

5. **SOUBOR:** `docs/audit/AUDIT_2026-08-23_AUDIT_CENTER_DEV3.md`  
   **STAV:** Untracked (Není v Gitu)  
   **DŮVOD:** Vytvořen jako auditní zpráva k Audit Center, dosud necommitnut.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

6. **SOUBOR:** `prisma/schema.prisma`  
   **STAV:** Modified (Necommitnutá změna)  
   **DŮVOD:** Přidány Prisma modely `AuditDocument` a `AuditShare`.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

7. **SOUBOR:** `server.ts`  
   **STAV:** Modified (Necommitnutá změna)  
   **DŮVOD:** Namontovány routy `/api/admin/audits` a `/api/audit/share`.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

8. **SOUBOR:** `src/components/admin/AdminDashboard.tsx`  
   **STAV:** Modified (Necommitnutá změna)  
   **DŮVOD:** Přidána navigace a záložka Audit Center DEV3.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

9. **SOUBOR:** `src/components/public/PublicPortal.tsx`  
   **STAV:** Modified (Necommitnutá změna)  
   **DŮVOD:** Přidáno směrování veřejných odkazů `/audit/share/*`.  
   **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

10. **SOUBOR:** `src/services/dbStore.ts`  
    **STAV:** Modified (Necommitnutá změna)  
    **DŮVOD:** Přidána in-memory pole pro auditDocuments a auditShares.  
    **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

11. **SOUBOR:** `src/types/index.ts`  
    **STAV:** Modified (Necommitnutá změna)  
    **DŮVOD:** Přidány TypeScript typy a rozhraní pro Audit Center.  
    **POSLEDNÍ ZNÁMÁ ZMĚNA:** 23.08.2026  

---

## E. Závěr

**SYNC INCOMPLETE**  
Některé změny nejsou commitnuté nebo pushnuté.

---

*Poznámka:* Tento auditní soubor byl vytvořen v pracovním stromě v souladu s instrukcí uživatele bez následného spustění `git add`, `git commit` nebo `git push`.
