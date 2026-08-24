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
