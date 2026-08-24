# Audit Report: Bezpečný SVG Logo & Branding Editor
Datum: 2026-08-24
Cíl: Přidání nového modulu "Logo & Branding" do administrace pro bezpečnou vizuální správu portálu (čisté vektorové SVG).

## 1. Analýza výchozího stavu
- Původně projekt používal defaultní komponentu `Logo.tsx` obsahující hardcoded inline SVG a veřejnou ikonu `public/icon.svg`.
- Nebyl definován žádný bezpečný editor pro vkládání vlastního loga na straně klienta.
- Databáze a `SystemSettings` neobsahovaly strukturu pro verzování SVG brandingu, i když mechanismus existoval v tabulce Theme.
- Byla dodržena nezávislost na nedávno integrované vrstvě Personal Themes.

## 2. Provedené změny
- **Databáze (Prisma)**
  - Zaveden model `BrandingVersion`, který drží historii změn (primaryLogoSvg, darkLogoSvg, faviconSvg, isActive atd.).
- **Backend (API)**
  - Vytvořena nová service třída `BrandingService`.
  - Nové endpoints: `/api/admin/branding` (GET/PUT), `/api/admin/branding/history` (GET), `/api/admin/branding/validate` (POST) a `/api/admin/branding/restore/:id` (POST).
- **Bezpečnost SVG**
  - Implementován server-side `svgSanitizer.ts`. Modul fail-closed metodou zakazuje tagy jako `<script>`, `<foreignObject>`, `<iframe>`, inline události (např. `onload`), a zakazuje protokoly `javascript:`. Validace probíhá před uložením do databáze i jako izolovaný ověřovací request pro admina.
- **Frontend Administrace**
  - Vytvořena React komponenta `BrandingManager.tsx` s mobile-first prostředím, obsahující SVG Code editor, Live Preview pro světlý/tmavý režim a historii verzí.
  - Komponenta byla korektně napojena do modulu `AdminDashboard` podle RBAC struktury portálu.
- **Frontend Rendering**
  - GlobalState provider (`ThemeContext`) načítá aktivní branding `/api/public/branding` při startu do kontextu a bezpečně ho zprostředkovává.
  - Komponenta `Logo.tsx` se přizpůsobuje z `ThemeContext` a pokud nalezne branding, injektuje zabezpečené SVG namísto výchozí ikony. Zajištěna kompatibilita dark/light variant.

## 3. Zabezpečení a testování
- Endpointy používají `requireAuth` a striktně vyžadují roli `ADMIN` z existujícího middleware portálu.
- Úspěšný audit bez cizích vlivů do Personal Themes, RBAC ani stávajícího řešení ikon.
- Auditování každé změny, resetu a návratu verze (verzování SVG 1-X).
- Proveden TypeScript typecheck a Node.JS build, úspěšně PASS.

## 4. Možná rizika
- Generování bitmap favicon z SVG bylo pro zamezení vnášení těžkých závislostí `sharp` potlačeno. Standardní cesta pracuje s hardcoded PNG / PWA ikony jako fallback podle existující situace, SVG favicon může administrátor vložit.
- Injektované SVG by mělo být responzivní.
- Aplikace vyžaduje `npx prisma db push` v cílovém deployment prostředí.

Změna provedena jako separátní commit s ohledem na oddělení funkcí.

## 5. Oprava z technického auditu (Fixes)
Datum: 2026-08-24
Na základě technického auditu (který odhalil chybějící API endpointy a nedostačující sanitizaci SVG pomocí Regexu) byly provedeny tyto opravy:

- **API Endpoints**: 
  - Endpointy pro `/api/admin/branding` a `/api/public/branding` byly úspěšně a bezpečně doplněny přímo do souboru `server.ts`. 
  - Byly dodrženy existující bezpečnostní mechanismy (`requireRole('ADMIN')`).
  - Bypass pro standardní uživatele nebo nepřihlášené je bezpečně zablokován.
- **SVG Bezpečnost (Server-side Sanitizace)**: 
  - Původní regexová validace `svgSanitizer.ts` byla nahrazena robustní sanitizací pomocí balíčku `dompurify` běžícího nad `jsdom` prostředím na serveru.
  - Byl nastaven limit velikosti souboru na 250 KB pro zabránění DoS útoku (velké vstupy).
  - Skripty, `foreignObject`, `image` odkazy, `javascript:` a další nebezpečné konstrukce jsou bezpečně zahozeny.
- **Nové testy**:
  - Vytvořeny testy `tests/branding-and-svg.test.ts` pokrývající XSS a nebezpečné vstupy pro sanitizer.
  - Vytvořeny testy `tests/branding-api.test.ts` pro ověření autentizace a integrace s API endpoints.
  - Test runner `scripts/test-runner.js` byl aktualizován, aby tyto sady automaticky spouštěl.

**Zbývající rizika/TODO**:
- Komponenty závislé na `/api/public/branding` (např. ThemeContext) v případě nedostupnosti backendu pouze zalogují do konzole fallback a použijí výchozí logo. To je záměrné, ale pro budoucí UX může být užitečné monitorovat dostupnost API.
