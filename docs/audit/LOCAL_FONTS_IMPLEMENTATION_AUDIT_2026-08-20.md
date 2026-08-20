# LOCAL FONTS IMPLEMENTATION AUDIT (2026-08-20)

## Původ fontů
Fonty Playfair Display a Plus Jakarta Sans byly staženy přímo z originálního zdroje distribučního systému Google Fonts (ve formátu woff2 optimalizovaném pro latinku), čímž je zachována jejich kvalita a původní metrika. 

## Licence
Obe písma (Playfair Display a Plus Jakarta Sans) jsou poskytována pod otevřenou licencí SIL Open Font License (OFL) v1.1. Tato licence umožňuje komerční i nekomerční užití, lokální hostování, modifikace a distribuci, pokud jsou zahrnuty příslušné podmínky, což vyhovuje požadavkům tohoto projektu.

## Seznam přidaných souborů
Do nové složky `public/fonts/` byly přidány následující soubory:
- `public/fonts/playfair-display-regular.woff2`
- `public/fonts/playfair-display-600.woff2`
- `public/fonts/playfair-display-700.woff2`
- `public/fonts/plus-jakarta-sans-400.woff2`
- `public/fonts/plus-jakarta-sans-500.woff2`
- `public/fonts/plus-jakarta-sans-600.woff2`
- `public/fonts/plus-jakarta-sans-700.woff2`

## Použité font-weight
- **Playfair Display**: 400 (regular), 600 (semibold), 700 (bold)
- **Plus Jakarta Sans**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

## Odstraněné externí reference
- **Google Fonts runtime dependency**: NOT FOUND.
  Při důkladném lokálním read-only průzkumu projektu nebyla nalezena žádná aktuální reference na `fonts.googleapis.com` nebo `fonts.gstatic.com` (v `index.html`, `src/index.css` ani `vite.config.ts`). Fonty zřejmě existovaly v konceptuálním návrhu, ale nebyly ještě v repozitáři aktivně odkazovány. 
- Místo toho jsme v rámci tohoto úkolu provedli plnohodnotné lokální zavedení a nasazení fontů tak, jak projekt zřejmě vyžadoval.

## Přidané modifikace
- Úprava `src/index.css` a přidání bloku `@theme` (Tailwind CSS v4 podpora) k napojení fontů na proměnné `--font-sans` a `--font-serif`.
- Definice `@font-face` s atributem `font-display: swap` a relativními cestami pro všechny stažené řezy.

## QA výsledky
- Lint (`npm run lint`): PASS (bez chyb)

## Build výsledky
- Build (`npm run build`): PASS (bez chyb, vygenerovány assets včetně index-DDOanqfW.css, proběhlo bez selhání sestavení server.js přes esbuild).

## Diff summary
- Místo stahování přes `<link href...>` bylo vytvořeno `public/fonts/` 
- Upraven pouze `src/index.css` (přidáno @font-face a @theme)
- Žádné mazání jiných aplikačních kódů.
- Žádné logování nebo odhalení secrets.

## Případné známé limity
- Tailwind v4 bere defaultní sadu proměnných z `@theme` bloku - implementovali jsme definice fontů (font-sans a font-serif) s defaultními web-safe fallbacky (system-ui, apod.).
- Staženy byly striktně znakové sady pro latinku (latin), což je plně dostačující pro český i anglický text.
