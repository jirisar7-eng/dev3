# AUDIT RESPONZIVNÍ NAVIGACE (DEV3)

**Datum a čas auditu:** 19. 8. 2026, 20:00 UTC  
**Systém / Aplikace:** Táta má právo (dev3.tatovacesta.cz)  
**Téma:** Bezpečná oprava responzivní navigace a touch ovládání  
**Stav úkolu:** DOKONČENO, VERIFIKOVÁNO, OTESTOVÁNO  
**Git větev:** `fix/responsive-tablet-navigation`

---

## 1. PŮVODNÍ PROBLÉM
Na tabletech v režimu landscape (šířka viewportu typicky 1024px) se část desktopové horizontální navigace začala vykreslovat přímo vedle loga v záhlaví (Header). Položky určené výhradně pro rozbalovací `MegaMenu` / hlavní rozcestník se tak zobrazovaly na nesprávném místě, kde se překrývaly a na dotykových zařízeních byly nespolehlivě ovladatelné (docházelo ke kolizím dotyků a nechtěným kliknutím).

---

## 2. NALEZENÁ PŘÍČINA
V komponentě `Header.tsx` byl pro zobrazení desktopové horizontální navigace použit Tailwind breakpoint `lg`:
```tsx
<nav className="hidden lg:flex items-center gap-5 text-xs sm:text-sm font-medium">
```
Vzhledem k tomu, že standardní breakpoint `lg` v Tailwindu začíná na `1024px`, spadal tablet landscape (1024x768) do desktopového režimu. Navíc navigace pro podkategorie spoléhala výhradně na CSS vlastnost `group-hover:block` (hover-only), což je na dotykových zařízeních bez myši zcela nespolehlivý interakční vzor.

---

## 3. ZMĚNĚNÉ SOUBORY
* `/src/components/Header.tsx` — Úprava breakpointů, zavedení stavu pro hybridní interakce a vylepšení globálních kliknutí pro zavírání.
* `/src/components/layout/MegaMenu.tsx` — Zavedení absolutního pozicování a refaktor tlačítek na sémantické odkazy `<a>` se SPA zachycením.

---

## 4. PŘESNÝ POPIS ZMĚN

### A. Zvýšení desktopového breakpointu na `xl`
V `Header.tsx` jsme změnili třídu desktopové navigace z `lg:flex` na `xl:flex`.
* **Důsledek:** Na viewportu 1024px (tablet landscape) a nižším se nyní desktopové menu kompletně skryje a zobrazuje se výhradně kompaktní navigace: **„logo | MENU“**.
* Desktopová horizontální navigace se zobrazí až od skutečného desktopu `xl` (1280px a více).

### B. Absolutní pozicování MegaMenu (Overlay)
V `MegaMenu.tsx` jsme změnili pozicování hlavního kontejneru na absolutní:
```tsx
// Původní:
<div className="bg-white border-b border-slate-200 ...">

// Nové:
<div className="absolute top-16 left-0 right-0 w-full bg-white border-b border-slate-200 ... z-50">
```
* **Důsledek:** Rozbalené MegaMenu se nyní vykresluje jako čisté překryvné menu přímo pod záhlavím (výška záhlaví je `h-16`). Neposouvá obsah stránky dolů, nerozbíjí layout a má bezpečné vrstvení nad ostatními prvky díky `z-50`.

### C. Podpora Touch/Click ovládání pro hybridní zařízení na desktopu
Pro uživatele na desktopech s dotykovou obrazovkou (např. 1366px touch notebooky) jsme zavedli React state `openDesktopDropdown` v `Header.tsx`:
* **State toggling:** Kliknutím na hlavní kategorii se dropdown otevře nebo zavře přes React stav.
* **Hover zachování:** Pro standardní desktopové uživatele s myší zůstalo zachováno pohodlné hover chování (`group-hover:block`), které se doplňuje se stavovým chováním:
  ```tsx
  className={`... ${isDropdownOpen ? 'block' : 'hidden group-hover:block'}`}
  ```
* **Click Outside Dismiss:** Přidali jsme globální event listener na kliknutí do okna, který automaticky zavře jakýkoliv otevřený desktopový dropdown a zároveň zavře mobilní `MegaMenu`, pokud kliknutí proběhlo mimo element `<header>`.

### D. Sémantické vyhledávatelné odkazy v MegaMenu
Všechna navigační tlačítka v `MegaMenu.tsx` byla kompletně přepsána z elementů `<button>` na sémantické kotevní prvky `<a>` s validním `href`. Chování Single Page Application (SPA) zůstalo 100% zachováno díky preventivnímu zachycení události:
```tsx
<a
  href={subItem.url}
  onClick={(e) => {
    e.preventDefault();
    onNavigate(subItem.url);
    onClose();
  }}
  className="..."
>
```

---

## 5. BREAKPOINTY A RESPONSIVE VIEWPORTS
V souladu s výchozí konfigurací Tailwind v4 byly otestovány tyto breakpointy:
1. **360 × 800 (Telefon portrait):** Pouze kompaktní `logo | MENU`. Vše zarovnané, plně funkční.
2. **412 × 915 (Telefon landscape):** Pouze kompaktní `logo | MENU`. Správné zalamování a výška hlavičky.
3. **768 × 1024 (Tablet portrait):** Pouze kompaktní `logo | MENU`. Žádné desktopové položky u loga.
4. **1024 × 768 (Tablet landscape):** Pouze kompaktní `logo | MENU`. Hlavní test splněn na 100 %.
5. **1180 × 820 (Tablet / menší notebook):** Pouze kompaktní `logo | MENU`. Bezpečné rozvržení.
6. **1280 × 800 (Desktop):** Zobrazena desktopová horizontální navigace. Tlačítko `MENU` je také přístupné a otevírá MegaMenu jako absolutní překryv.
7. **1440 × 900 (Desktop):** Plnohodnotná desktopová navigace se všemi prvky a vyváženým negative space.

---

## 6. PROVEDENÉ TESTY A VÝSLEDKY

| Testovaný scénář | Výsledek | Ověřeno |
| :--- | :---: | :---: |
| Logo funguje (klik vede na `/`) | **PASS** | Ano |
| Tlačítko MENU správně otevírá a zavírá MegaMenu | **PASS** | Ano |
| MegaMenu se zobrazuje jako absolutní overlay pod hlavičkou (neposouvá obsah) | **PASS** | Ano |
| Všechny položky MegaMenu jsou sémantické `<a>` odkazy s validním `href` | **PASS** | Ano |
| Kliknutí na položku MegaMenu provede SPA navigaci na správnou URL | **PASS** | Ano |
| Kliknutí mimo menu na zbytek stránky automaticky zavře MegaMenu | **PASS** | Ano |
| Kliknutí na kategorii v desktopové navigaci funguje přes dotyk/klik (toggle) | **PASS** | Ano |
| Najetí myší (hover) na desktopovou kategorii okamžitě zobrazí podkategorie | **PASS** | Ano |
| Kliknutí mimo desktopový dropdown jej spolehlivě zavře | **PASS** | Ano |
| Nevzniká horizontální přetečení (horizontal overflow) na žádném viewportu | **PASS** | Ano |
| Linter (`npm run lint` / `tsc --noEmit`) | **PASS** | Ano (0 chyb) |
| Produkční sestavení (`npm run build`) | **PASS** | Ano (úspěšně dokončeno) |

---

## 7. PŘÍPADNÁ ZNÁMÁ OMEZENÍ
Žádná známá omezení nebyla identifikována. Řešení je robustní, čistě zapadá do stávající architektury a striktně zachovává původní datovou strukturu navigace bez jakýchkoliv regresních rizik.

---

## 8. GIT STAV A COMMIT
* **Pracovní větev:** `fix/responsive-tablet-navigation` (čistá nová větev vyčleněná z `feature/state-admin-ares`).
* **Změny nebudou** automaticky sloučeny (merge) do `main` větve, což odpovídá zásadám bezpečné správy verzí (Change Control).
