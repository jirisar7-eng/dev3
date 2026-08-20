# Audit: Moje cesta zakladatele

## 1. Výchozí stav
- HEAD: 8a3466600ae02d9aece1850ea37012c28eed79f6
- Stránka s příběhem zakladatele existovala na route `/cesta-zakladatele` pod technickým označením a marketingovějším abstraktním obsahem. Původní `O nás` existuje odděleně.
- Úkol: Vytvořit kanonickou route `/moje-cesta-zakladatele` (případně se zpětnou kompatibilitou na `/cesta-zakladatele`), implementovat původní autentický text bez zkreslování faktů a přidat odkaz do navigace `O projektu & Podpora`.

## 2. Změněné soubory
- `src/components/public/FounderStoryPage.tsx`: Kompletní přepis komponenty, použití `SeoHead` (Title, Description, canonicalPath) a rozdělení předloženého syrového textu do vizuálních sekcí s ikonami. Nepřidána žádná nová tvrzení.
- `src/components/public/PublicPortal.tsx`: Úprava routování tak, aby reactová komponenta byla přístupná primárně na `/moje-cesta-zakladatele`, ale i na původní `/cesta-zakladatele` (kvůli existující provázanosti na Puck CMS a `dbStore.ts`).
- `src/config/navigation.ts`: Přidán odkaz "Moje cesta zakladatele" (url: `/moje-cesta-zakladatele`) přímo pod odkaz "O nás" v sekci "🏛️ O projektu & Podpora".

## 3. SEO a Navigace
- SEO integrováno přes `SeoHead` s předepsanými hodnotami a canonical URL na `/moje-cesta-zakladatele`.
- Navigace zapadá do struktury, kategorie 'cat-8'.

## 4. Kvalita a QA
- **Typecheck & Lint**: PASS
- **Build**: PASS
- **Obsah a faktická správnost**: Zůstal zachován doslovný význam zdrojového textu. (PASS)
- **CMS/Puck kompatibilita**: Zůstala zachována původní struktura `CmsPageRenderer`, pouze se akceptuje nový URL slug navíc. (PASS)
- **Responsive**: Tailwind classes (`sm:grid-cols-2`, `md:grid-cols-3`, `px-4 sm:px-6 lg:px-8`) nasazeny bez horizontálního přetečení obrazovky na tabletu i mobilu. (PASS)

## 5. Závěr a provedení změn
- Původní stránka `O nás` nebyla dotčena.
- Aplikace neobsahuje dummy nebo mock chování v produkční cestě.
- Změna přidána do working branch, bude commitována.
