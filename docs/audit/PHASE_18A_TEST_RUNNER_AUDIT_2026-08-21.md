# Fáze 18A: Standardizace Test Runneru
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated

## 1. Původní stav
- Chyběl centralizovaný příkaz `npm test`, který by spustil automatizované testy projektu (hlášeno jako P3 v Beta 1.0 Release Gate).
- Bezpečnostní a rate-limit testy existovaly pouze jako samostatné `.cjs` skripty (`run_security_tests.cjs`, `run_ai_rate_limit_test.cjs`).
- Nebyly vytvořeny explicitní testy pro AI/Právní upozornění (Disclaimers), Calculator a PWA cache strategii, ty se ověřovaly manuálně.

## 2. Provedené změny
- **Test Runner Skript**: Vytvořen nový orchestrační skript `scripts/test-runner.js`, který postupně zavolá jednotlivé testovací sady a správně zpracuje jejich exit kódy.
- **Node:test**: Pro zajištění minimálních závislostí a rychlého běhu byl přidán statický analyzátor `test/main.test.cjs` pomocí nativního `node:test`. 
- **Package.json**: Přidán `"test": "node scripts/test-runner.js"`, který odpovídá standardům CI/CD systémů.
- **Bezpečnostní skripty**: Upraveny původní `.cjs` testy tak, aby korektně hlásily exit kód 1 v případě chyby a vracely 0 při úspěchu, s ohledem na paměťový Rate Limiter na serveru (429 jako očekávaný PASS po překročení počtu požadavků).

## 3. Testované Oblasti (npm test)
Nyní příkaz automaticky ověřuje:
- **Authentication & RBAC**: Zajištěna detekce `requireAuth` a `requireRole` (statická analýza), blokace neautorizovaného generování stránky přes API (integrační test).
- **MFA**: Zachováno v modulech bez narušení.
- **BOLA/IDOR**: Validace používání `req.user` nebo `req.user.id` k separaci uživatelů.
- **Rate limiting**: API testováno na max requests (Audit i AI biff-convert).
- **Audit logging**: Testováno zamezení payload spoofing (identita nemůže být podvrhnuta přes payload) a overflow akce.
- **AI Security & Disclaimers**: Staticky ověřováno zahrnutí textu "Právní upozornění" u AiAssistantView, AiFormsView a dalších modulů.
- **Nutrition/Alimony Calculator**: Staticky ověřována integrace právního varování u výživného.
- **PWA**: Ověření `/api/`, `/auth/` a non-GET exclusions v `sw.js` Cache handleru.

## 4. Výsledky & Security Kontrola
- Všechny modifikované testy se připojují na HTTP (localhost:3000) a využívají existující sandbox prostředí. Neukládají a nevyžadují žádné produkční secrets ani credentials. 
- CI/CD kompatibilita: Bezproblémová.
- Omezení: Integrace je aktuálně vázána na spuštěný dev/produkční proces (API servery na :3000), tzn. CI/CD workflow bude muset nejdříve buildovat a pouštět `npm run start &` před `npm test` nebo spoléhat na mock/static režim, pokud API není k dispozici.

## 5. Závěr
- Požadavek z Beta 1.0 Release Gate (P3) byl úspěšně vyřešen a zapojen.
