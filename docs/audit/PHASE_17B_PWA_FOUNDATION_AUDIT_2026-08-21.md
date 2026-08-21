# Fáze 17B: PWA Foundation Audit
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated
HEAD: ba72666 (před touto fází)

## 1. Architektura PWA
Implementovali jsme robustní, ultra-bezpečný základ PWA (Progressive Web Application) bez použití složitých, těžko laditelných build-time pluginů, které by mohly zavést neočekávané chování nebo narušit HMR a vývojový server.
- **Web App Manifest**: Vytvořen standardní a validní `manifest.json`.
- **Service Worker**: Ručně napsaný `sw.js` s absolutní kontrolou nad bezpečností a cachingem.
- **Offline Fallback**: Stránka `offline.html` designově sladěná s preloaderem aplikace.
- **Branding**: SVG ikona `icon.svg` vytvořená z oficiálního loga zobrazeného v preloaderu `index.html`.

## 2. Web App Manifest
Soubor `/public/manifest.json` definuje parametry aplikace:
- **Název**: Táta má právo
- **Start URL**: `/`
- **Režim zobrazení**: `standalone` (zobrazuje se jako samostatná mobilní aplikace bez URL řádku)
- **Ikony**: `/icon.svg` (přizpůsobená i pro `maskable` zobrazení)
- **Barva motivu**: `#1e3a8a` (hluboká modrá odpovídající brandingu)
- **Barva pozadí**: `#f8fafc` (off-white)

## 3. Service Worker & Cache Strategie
Service Worker `/public/sw.js` uplatňuje přísně konzervativní bezpečnostní standardy:
- **Cachování statických souborů**: Statické assety (JS, CSS, obrázky, fonty) jsou cachovány strategií **Cache First** po jejich prvním vyžádání.
- **Navigační requesty**: HTML navigace využívá **Network First** s bezpečným fallbackem do cache. Pokud je uživatel offline, zobrazí se `/offline.html`.
- **API a Auth (ABSOLUTNÍ BEZPEČNOST)**: Veškeré API a autentizační endpoints jsou nastaveny jako **Network Only**. Do cache se nikdy neukládají citlivá data, JWT tokeny, dokumenty, ani MFA údaje. Service Worker ignoruje všechny requesty jiné než `GET`.
- **Aktualizace cache**: Při aktivaci nového Service Workeru dochází k bezpečnému smazání starých verzí cache.

## 4. Offline Fallback
Pokud uživatel ztratí připojení a pokusí se načíst novou stránku, Service Worker mu zobrazí `/public/offline.html`, která:
- Jasně informuje o offline stavu.
- Obsahuje tlačítko "Zkusit znovu" pro znovunačtení stránky.
- Uvádí pravdivé informace a neslibuje neexistující offline funkce.

## 5. Security & Mobile UX
- **Security Check (PASS)**: SW neovlivňuje autentizační cookies ani hlavičky. Všechny POST/PUT/DELETE requesty jdou přímo na síť. Cache poisoning je znemožněn validací `status === 200` a `type === 'basic'`.
- **Mobile UX Check (PASS)**: Přidána metadata do `<head>` v `index.html` pro iOS (`apple-mobile-web-app-capable`). Nastavena barva stavového řádku a safe-area podpora.

## 6. Testy a Verifikace
- **Linter**: `npm run lint` - 100% PASS
- **Build**: `npm run build` - 100% PASS
- **SW registrace**: SW se registruje výhradně v produkčním prostředí a v prohlížečích, které jej podporují, pomocí bezpečné detekce `(import.meta as any).env?.PROD`.
- **Regrese**: Kalkulačka výživného funguje bez jakýchkoliv omezení.

## 7. Co zůstává pro budoucí fáze (17C+)
- **17C (Offline Public Content)**: Caching krizových článků (bude řešeno v Beta 1.1).
- **17D (Secure Offline Case Data)**: Asymetricky šifrované IndexedDB úložiště pro klientský spis (P3 - Future).
- **17E (Sync Queue)**: Odesílání zpráv v CoParentHub offline s pozadím na Background Sync API (P3 - Future).
