# Brand Asset Studio — autoritativní inventura

Datum: 2026-09-09
Větev: `audit/brand-asset-studio-inventory-20260909`
Base SHA: `a8f84a93cace6249849701cf66918afc15ce0874`

## Rozsah

Read-only inventura aktuálního `origin/main`. Nebyla provedena změna aplikace,
databáze, infrastruktury, DEV3 ani PROD3.

## Současná architektura brandingu

- Branding je globální a nerozlišuje jednotlivé aplikace.
- `BrandingVersion` ukládá primary, dark a favicon SVG přímo v PostgreSQL.
- Existuje pouze jedna aktivní verze pro celý systém.
- Uložení nové verze ji okamžitě aktivuje; chybí oddělený draft a publish.
- SVG se před uložením sanitizuje pomocí DOMPurify/JSDOM.
- Chybí limity počtu uzlů, hloubky stromu a složitosti SVG cest.
- `Logo.tsx` používá dynamický SVG obsah nebo hardcoded fallback.
- `ThemeContext.tsx` globálně mění favicon, metadata a Blob manifest.

## Současný PWA stav

- Existuje pouze jeden statický `public/manifest.json`.
- Manifest používá `start_url` a `scope` `/`.
- PWA používá jednu identitu „Táta má právo“.
- Stejné PNG je označeno současně jako `any maskable`.
- Existuje jeden root service worker `/sw.js`.
- Cache namespace je globální `tata-ma-pravo-v2`.
- `/administrace` a `/muj-pripad` jsou vedeny jako citlivé trasy.
- Citlivé trasy používají network-only režim a jejich odpovědi se necachují.
- Veřejný worker je však stále řídí a při nedostupnosti vrací obecný offline fallback.
- Statické brandové assety používají společnou globální cache.

## Spotřebitelé značky

- `Logo.tsx` načítá jedno globální primary/dark SVG.
- Při chybě používá hardcoded logo a název.
- Tři aplikační identity zatím nerozlišuje.
- Administrace nemá vlastní dynamický lockup.
- `emailService.ts` obsahuje hardcoded název značky.
- E-maily nepoužívají publikovaný brand release.

## Dokumenty a exporty

- DOCX nemá centrální logo, záhlaví ani patičku.
- Tisk a PDF používají samostatné HTML.
- Auditní PDF obsahuje hardcoded název projektu.
- Vodoznaky nejsou centrálně řízené.
- Chybí `DocumentBrandingProfile`.
- Dokumenty neevidují použitý brand release.
- Importované originály musí zůstat nezměněné.

## Datový model

- Existuje pouze globální `BrandingVersion`.
- SVG je uložené přímo v PostgreSQL.
- Media/MinIO se pro branding nepoužívá.
- Chybí aplikační identity a profily.
- Chybí immutable `BrandRelease`.
- Uložení nové verze ji ihned aktivuje.
- Draft a publish nejsou oddělené.

## Bezpečnostní zjištění

- SVG se sanitizuje pomocí DOMPurify/JSDOM.
- Zakázané jsou aktivní a externí SVG prvky.
- Maximální velikost SVG je 250 KB.
- Chybí limity počtu uzlů, hloubky a cest.
- Přímé vložení SVG do DOM vyžaduje obranu navíc.
- Citlivé stránky se necachují, ale worker je globální.

## Cílové identity

- `public_portal`: Táta má právo, scope `/`.
- `case_portal`: Můj případ – Táta má právo.
- `admin_portal`: Synthesis Admin – Táta má právo.
- Každá identita bude mít vlastní manifest a assety.
- Společné rodinné logo se bude řízeně dědit.
- Výjimky jednotlivých identit budou verzované.

## Cílový model

`BrandFamily → AppIdentity → BrandProfile → BrandAsset`

`BrandAsset → BrandAssetVersion → BrandRelease`

Dokumenty použijí samostatný `DocumentBrandingProfile`.
Každý export uloží verzi releasu a hashe assetů.
Editace, validace a publikování budou oddělené.
Rollback vytvoří nový release bez mazání historie.

## Povinná propagace značky

- Hlavičky, patičky, přihlášení a administrace.
- Favicony, PWA ikony, manifesty a offline stránky.
- SEO, Open Graph a sociální náhledy.
- E-mailové šablony a systémové notifikace.
- PDF, DOCX, tiskové sestavy a auditní reporty.
- Generátor podání a export osobního případu.
- Brandové a stavové vodoznaky.
- Staré dokumenty zůstanou beze změny.

## Publikování

Stavy: `DRAFT → VALIDATED → READY → PUBLISHED`.

Publikování bude samostatná autorizovaná akce.
Celá sada assetů se přepne atomicky.
Neúplný nebo nevalidní release se nezveřejní.
Při chybě zůstane aktivní poslední funkční release.
Starší release lze bezpečně znovu publikovat.

## Migrace a úložiště

- Nové assety budou uložené přes Media/MinIO.
- PostgreSQL bude držet metadata, vazby a SHA-256.
- Stará historie `BrandingVersion` se nesmaže.
- Přechod použije copy, hash verification a resolver switch.
- Migrace bude pouze forward-only.
- `prisma db push` je zakázán.
- DEV3 a PROD3 zůstanou striktně oddělené.

## Pořadí realizace

1. Kontrakty a datový model.
2. Bezpečná asset pipeline.
3. Draft editor pro tři identity.
4. Publish, rollback, RBAC a audit.
5. Runtime brand resolver.
6. Generátor ikon a náhledová matice.
7. Oddělení tří PWA.
8. Dokumenty, e-maily a vodoznaky.
9. Migrace staré historie.
10. Integrační a release testy.

## Verdikt

`PASS_FOR_PLANNING`

Současný branding je bezpečný základ, ale nepokrývá tři identity,
centrální publikování ani úplnou propagaci do dokumentů.

Implementace musí probíhat po malých fázích z aktuálního `main`.
Tento audit neopravuje kód ani nemění databázi.
