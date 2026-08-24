# Audit Report: JSDOM/Undici Node 20 Startup Compatibility
Datum: 2026-08-24

## 1. Symptom
Při startu aplikace (konkrétně v rámci backendu Node.js 20.20.2) docházelo k chybě:
`TypeError: webidl.util.markAsUncloneable is not a function` at `/app/node_modules/undici/lib/web/cache/cachestorage.js`.
Aplikace se restartovala a vracela HTTP 502, protože server.js spadl hned na začátku.

## 2. Root Cause
Nové verze knihovny `undici` (od verze 6.16 a 8.x) používají `webidl.util.markAsUncloneable`, které bylo zavedeno až v Node.js 21. Protože `jsdom@30.0.1` používá `undici` (respektive vyžaduje Node.js 22+), je s Node 20.20.2 nekompatibilní a vyhazuje výše zmíněnou chybu. `jsdom` je načítán backendem kvůli `dompurify` (pro sanitizaci SVG).

## 3. Dotčené balíčky a verze
- `jsdom`: z verze `^30.0.1` downgradováno na kompatibilní verzi `^25.0.1` (která podporuje Node 18+).
- `@types/jsdom`: downgradováno z `^30.0.0` na `^21.1.7`.

## 4. Oprava
Snížili jsme verzi balíčků `jsdom` a `@types/jsdom` na stabilní verze (25.0.1 a 21.1.7), které jsou plně kompatibilní s Node.js 20. Oprava nevyžadovala žádné zásahy do implementace samotné sanitizace nebo aplikační logiky.

## 5. Bezpečnostní dopad
Bezpečnost SVG sanitizace není nijak snížena. Starší verze JSDOM nadále bezpečně izoluje sanitizaci DOM struktur bez vlivu na výsledek, protože nevyužíváme experimentální web specifikace. Naopak stabilizuje samotný chod aplikace.

## 6. Provedené testy
- TypeScript typecheck a lint testy prošly.
- Build aplikace pro produkci byl ověřen (Vite/Esbuild).
- Spuštění `dist/server.cjs` lokálně prošlo bez pádu.
- Existující testy na `branding-and-svg.test.ts` a validace SVG prošly úspěšně.

## 7. Výsledek
Aplikace se nyní úspěšně zkompiluje a spustí na Node.js 20.20.2. Chyba s `undici` je odstraněna. Testy pro SVG sanitizaci a fungování Branding Editoru byly ověřeny.
