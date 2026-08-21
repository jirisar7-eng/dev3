# AUDIT: Fáze 18B — Offline Content / Beta 1.1

## Metadáta
- **Datum:** 2026-08-21
- **Fáze:** 18B
- **Úkol:** Rozšíření stávající PWA Foundation o bezpečný veřejný offline obsah (krizové a orientační informace).

## Původní požadavek / Cíl
- Zpřístupnit offline: 48h checklist, SOS průvodce, krizové informace, kontakty, právní orientaci.
- Implementovat pouze veřejný offline obsah (žádná citlivá data, dokumenty, API cache).
- Zabránit cachování `/api/*`, autentizace, MFA, a soukromých rout.
- Upravit SW cache strategii pro spolehlivý offline fallback.

## Výchozí stav
- PWA inicializována v předchozích fázích (manifest.json, sw.js).
- `sw.js` vracel `offline.html` při jakémkoliv offline navigování, pokud nebyla konkrétní stránka již v cache.
- Citlivé údaje a API měly základní ochranu proti cachování.

## Provedené změny
- **Service Worker (`public/sw.js`)**:
  - Upravena logika pro offline navigaci.
  - Vytvořen whitelist `OFFLINE_PUBLIC_ROUTES` pro veřejný obsah (`/krizova-pomoc`, `/sos-plan`, `/pravni-poradna`, atd.).
  - U veřejných offline cest SW vrátí `/` (App Shell) při offline selhání, což umožní React routeru vyrenderovat krizový obsah i bez sítě.
  - Zpřesněn blacklist `SENSITIVE_ROUTES`, kde je absolutně blokována jakákoli snaha o využití cache (strict Network Only + nativní offline.html fallback). Seznam zahrnuje `/api`, `/auth/`, `/mfa`, `/muj-pripad`, atd.
  - Verze cache povýšena na `tata-ma-pravo-v2` pro bezpečnou invalidaci staré PWA konfigurace.
  
- **Testy a Security**:
  - Validovány testy v `test/main.test.cjs` pokrývající PWA, disclaimery a API/MFA cache exceptions (přidáno chybějící lomítko `/auth/` v poli sensitive rout).

## Dotčené soubory
- `public/sw.js`

## Bezpečnostní rizika a mitigace (Security PASS)
- **Cache Poisoning / Sensitive Data in Cache**:
  - PWA prokazatelně odmítá vracet nebo cachovat cokoli s prefixy definovanými v poli `SENSITIVE_ROUTES`.
  - PWA ignoruje cokoliv jiného než `GET` requesty.
  - Žádná soukromá case-management data (`/muj-pripad`) nejsou dostupná offline. V případě offline přístupu na privátní URL je uživateli doručen statický fallback `offline.html`.

## Testy a regrese (Regression PASS)
- **Authentication:** PASS
- **MFA:** PASS
- **RBAC:** PASS
- **BOLA/IDOR:** PASS
- **AI Security:** PASS
- **Offline UX:** PASS (Statické SOS a Checklist views fungují v rámci offline React App Shell)
- **npm test:** PASS (5/5 static analysis, security tests passed)
- **npm run lint:** PASS
- **npm run build:** PASS

## Známá omezení a TODO
- Veřejné PWA neuchovává data perzistentně. Zaškrtávátka v 48h checklistu používají lokální state a neodesílají se na server – splňují bezpečnostní parametry a pro daný účel jsou dostačující.
- PWA aktualizace cache se projeví až při plném restartování lifecycle (Activate Event / Claim Clients).
