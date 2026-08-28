# GIT BRANCH REALITY AUDIT
**Datum:** 2026-08-27
**Nástroj:** GitHub API (token ověřen)

Tento audit reprezentuje skutečný stav Gitu, nikoliv jen složky. Bylo analyzováno 25 větví v repozitáři `jirisar7-eng/dev3`.

## 1. HLAVNÍ ZJIŠTĚNÍ
Projekt trpí syndromem "nekonečných feature branchí". Mnoho zásadních změn a oprav (včetně kritických P0 security fixů a redesignu navigace) nebylo nikdy začleněno do `main`.
Větev `main` je tak zastaralá o desítky commitů a funkčních bloků, které jsou "schovány" ve větvích.

## 2. STAV VĚTVÍ (PŘEHLED)
- **main (HEAD: 5a5b01c...)**: Zastaralý základ.
- **feature/auth-session-consistency (HEAD: 918229a1e..., Ahead: 20, Behind: 0)**: Nejpokročilejší větev. Obsahuje čistou a nezávislou implementaci Fáze 04 (Team Center), Fáze 05 (Auth Session), Fáze 06 (Navigation) a Fáze 02 (Synthesis Control Center). Tato větev by se měla stát novým mainem.
- **feat/ai-failsafe-client-prompt-hardening (HEAD: 5d2702fb5..., Ahead: 14, Behind: 2)**: Divergovaná větev obsahující důležité AI failsafe mechanismy, ale chybí jí 20 nejnovějších commitů z Auth Session větve.
- **15 plně neintegrovaných / zastaralých větví (Behind only)**: Tyto větve obsahují starší práce (např. `feature/state-admin-ares`, `feature/puck-adapter-layer`), které již byly pravděpodobně nahrazeny, přepsány nebo nebyly nikdy dokončeny. Představují historický dluh.

## 3. ANALÝZA KLÍČOVÝCH FUNKCÍ PODLE VĚTVÍ

### A. Bezpečnost a Auth Session (MFA, JWT, CSRF)
- **HOTOVO POUZE NA FEATURE BRANCHI:** `feature/auth-session-consistency`. Opravuje úniky sessions mezi uživateli po odhlášení a vynucuje striktní clearování MFA tokenů.
- **ČÁSTEČNĚ V MAIN:** Starý kód, který byl zranitelný vůči MFA pending leakage.

### B. RBAC a Team Center
- **HOTOVO POUZE NA FEATURE BRANCHI:** `feature/auth-session-consistency`. Plnohodnotný Team Center Dashboard a granular RBAC.
- **NEIMPLEMENTOVÁNO V MAIN:** Main tuto celou funkcionalitu postrádá.

### C. Administrace a Navigace (Admin Shell)
- **HOTOVO POUZE NA FEATURE BRANCHI:** `feature/auth-session-consistency`. Nový čistý `Header.tsx`, `Footer.tsx`, sjednocené UI, eliminace `Navbar.tsx`.
- **ROZBITÉ/DUPLICITNÍ V MAIN:** Main stále obsahuje starou duplicitní navigaci.

### D. AI a Failsafe Prompty
- **HOTOVO POUZE NA FEATURE BRANCHI:** `feat/ai-failsafe-client-prompt-hardening`. Ochrana proti AI halucinacím.
- **KONFLIKTNÍ IMPLEMENTACE:** Tato větev se rozchází s `auth-session-consistency`.

### E. E-Sbírka Sync
- **HOTOVO POUZE NA FEATURE BRANCHI:** `feature/auth-session-consistency` obsahuje opravu překročení limitů (EsbirkaScheduler remediation).
- **ROZBITÉ V MAIN:** Synchronizace může padat na limity.

### F. CoParent Hub a B.I.F.F.
- **ČÁSTEČNĚ V MAIN i FEATURE:** Základní UI a routy existují, ale reálná logika a auditování B.I.F.F. zpráv chybí všude.
- **STAV:** ROZPRACOVÁNO.

### G. PWA a Secure Offline Case Data
- **NEIMPLEMENTOVÁNO VŠUDE:** Žádná větev neobsahuje plnohodnotné offline šifrování v IndexedDB.

### H. Generátor Podání a Kalkulátor
- **ČÁSTEČNĚ V MAIN:** Testy existují, propojení s frontendem (UI) chybí.
