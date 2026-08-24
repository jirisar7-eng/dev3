# Audit Report: Implementace Vizuálního SVG Editoru
Datum: 2026-08-24
Úkol: Vytvoření vizuálního SVG editoru pro úpravu loga

## 1. Původní stav a zjištění
- SVG editor dosud umožňoval pouze vkládat syrový kód do `<textarea>`.
- Vizuální úprava a generování SVG z uživatelského rozhraní chyběla.
- Sanitizace probíhala výhradně na serveru pomocí JSDOM a DOMPurify a byla funkční, avšak stávající implementace klienta nepodporovala plný vizuální WYSIWYG přístup.

## 2. Provedené změny
- **`src/components/admin/svg/types.ts`**:
  - Definice interního modelu `SvgDocument` a `SvgNode`.
- **`src/components/admin/svg/parser.ts`**:
  - Vytvořen parser postavený na `DOMParser`, který čistě parsuje podporované SVG elementy (`g, path, rect, circle, ellipse, line, polyline, polygon, text`) do interního stavu.
  - Ochrana proti neznámým tagům (automaticky je ignoruje již při importu).
- **`src/components/admin/svg/serializer.ts`**:
  - Sérializace interního stavu zpět do validního SVG.
  - Implementace escaping mechanizmů pro textové uzly.
- **`src/components/admin/svg/useHistory.ts`**:
  - Zaveden hook pro Undo/Redo (paměť na 50 kroků vzad).
- **`src/components/admin/svg/Canvas.tsx` a `VisualSvgEditor.tsx`**:
  - Klientské UI vytvořené nativně v Reactu (bez těžkých závislostí jako Fabric.js/Konva).
  - Vykreslení canvasu, Drag&Drop transformace, zoom.
  - Podpora pro vlastnosti (Properties panel), layers (Vrstvy), výběr fontů a barev.
- **`src/components/admin/BrandingManager.tsx`**:
  - Přidán přepínač mezi "Kód" a "Vizuální Editor".
  - Editor volá `sanitizeSvg` před uložením pro zachování bezpečnosti (pre-flight).
- **`tests/branding-editor.test.ts`**:
  - Vytvořeny komplexní testy pro parser, serializaci a bezpečnost (odmítnutí scriptů/iframe).
  - Přidán regression round-trip test s dodaným SVG ("TÁTA MÁ PRÁVO" logo).

## 3. Omezení a nedotčené části
- Žádné změny v backend API.
- Žádné změny ve schématu databáze.
- Server-side sanitizer `svgSanitizer.ts` zůstal nezměněn a nadále představuje hlavní bezpečností bariéru.
- Editor generuje pouze podporované SVG konstrukce a výsledné SVG je před uložením vždy podrobeno server-side sanitizaci a validaci.

## 4. Testy a ověření
- `npm run lint`: Prošlo.
- `npx tsc --noEmit`: Prošlo (bez type errorů).
- `npm run build`: Prošlo.
- `npm run test`: Všechny unit testy a integrační testy prošly. Nové testy `tests/branding-editor.test.ts` prošly bez chyb (100% roundtrip validace dodaného loga vč. zachování diakritiky, letter-spacing a transform).

## 5. Bezpečnostní a regresní rizika
- Pre-flight validace a nativní filtrování v `parser.ts` omezuje jakékoli HTML injection pokusy z existujících malformovaných SVG.
- Backend sanitizer (DOMPurify) dál autoritativně blokuje pokusy o XSS.
- Editor je optimalizován na nativní React, nezvětšuje podstatně bundle (bez 3rd party SVG knihoven).
- Riziko: Větší či velmi komplexní SVG grafika, než je výčet v ALLOWED_TAGS, nebude editorem plně parsována (převod na code režim doporučen pro exotické struktury).

## 6. Závěr a Git stav
- Visual editor úspěšně integrován.
- Původní textový editor plně zachován a dostupný přes přepínač.
- Změny zapsány do větve a připraveny na commit.
