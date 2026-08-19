# AUDIT RESPONZIVNÍ ADAPTIVNÍ NAVIGACE (DEV3)

**Datum a čas auditu:** 19. 8. 2026, 20:30 UTC  
**Systém / Aplikace:** Táta má právo (dev3.tatovacesta.cz)  
**Téma:** Architektonická oprava responzivní navigace pomocí adaptivního ResizeObserveru a Media Capabilities  
**Stav úkolu:** DOKONČENO, VERIFIKOVÁNO, OTESTOVÁNO PŘÍMO NA MAIN  
**Git větev:** `main`

---

## 1. PŮVODNÍ PROBLÉM & PROČ "XL" BREAKPOINT NEBYL DOSTAČUJÍCÍ
Původní řešení spoléhalo pouze na pevné šířkové breakpointy v CSS (`lg` / `xl`). To se však ukázalo jako nedostatečné z následujících důvodů:
1. **Velké dotykové obrazovky (Tablety v landscape):** Moderní tablety (např. iPad Pro, velké Samsung tablety) mají běžně rozlišení viewportu >= 1280px v režimu landscape. Pouhé nastavení šířkového breakpointu `xl` (1280px) tak stále zobrazovalo desktopovou navigaci, která je však pro dotyková zařízení zcela nevhodná (chybí myš, hover interakce a hrozí nechtěná kliknutí).
2. **Dynamická šířka obsahu:** Počet a délka položek v navigaci se mohou měnit dynamicky přes administraci (CMS / Puck). Fixní šířkové breakpointy neumí reagovat na situaci, kdy se navigace vlivem delšího textu nebo přidání nových kategorií nevejde do dostupného prostoru, což způsobuje zalamování navigace, horizontální přetečení (overflow) nebo překrývání loga.

---

## 2. NOVÝ ARCHITEKTONICKÝ ADAPTIVNÍ MECHANISMUS
Pro vyřešení těchto nedostatků jsme navrhli a implementovali **skutečně adaptivní navigaci** založenou na schopnostech zařízení a reálném dostupném prostoru v hlavičce.

Mechanismus funguje na základě následujících technických pilířů:

### A. Detekce vlastností a schopností zařízení (Media Capabilities)
Sledujeme nativní vlastnosti prohlížeče pomocí `window.matchMedia`:
* **Hover podpora:** `window.matchMedia('(hover: hover)').matches` — zjišťuje, zda zařízení podporuje najetí myší.
* **Přesnost ukazatele:** `window.matchMedia('(pointer: fine)').matches` — zjišťuje, zda uživatel ovláda rozhraní přesným ukazatelem (myš/trackpad).
Změny těchto schopností jsou dynamicky odposlouchávány pomocí event listenerů na Media Query, což bezpečně ošetřuje i simulaci zařízení v DevTools či připojení/odpojení periférií.

### B. Měření reálných rozměrů (ResizeObserver & HTML Refs)
Přes React `useRef` sledujeme reálné fyzické rozměry klíčových částí Headeru v reálném čase:
1. `containerRef` — celková dostupná šířka vnitřního layoutu hlavičky.
2. `logoRef` — skutečná šířka loga.
3. `navMeasureRef` — přesná šířka, kterou navigace fyzicky potřebuje pro bezchybné zobrazení bez zalamování.
4. `rightRef` — skutečná šířka pravých ovládacích prvků (přepínač režimů, profil, přihlášení).

### C. Technika "Off-Screen" měření (Prevence nekonečných cyklů)
Pokud bychom navigaci při nedostatku místa zcela odpojili z DOM, její šířka by klesla na `0`, což by okamžitě vyvolalo stav "dostatek místa" a vedlo k nekonečné renderovací smyčce a blikání.
Proto v DOM **vždy** renderujeme neviditelnou kopii navigace posunutou mimo obrazovku (`pointer-events-none invisible absolute left-[-9999px] top-[-9999px] flex whitespace-nowrap`), na které `ResizeObserver` v reálném čase měří přesnou požadovanou šířku navigace (včetně všech dynamických CMS modulů).

---

## 3. ROZHODOVACÍ PRAVIDLA
Desktopové horizontální menu se zobrazí pouze tehdy, jsou-li splněny **všechny** tyto podmínky najednou:
1. **Fyzický prostor:** Celková šířka kontejneru je větší než součet šířek: `Logo + Navigace + Pravá část + 48px (bezpečnostní rezerva)`.
2. **Přesný pointer:** Zařízení podporuje `pointer: fine`.
3. **Hover podpora:** Zařízení podporuje `hover: hover`.

Pokud **kterákoliv** z těchto podmínek není splněna (např. chybí prostor, nebo jde o dotykové zařízení), Header se okamžitě a bezpečně přepne do kompaktního režimu **"LOGO | MENU"**.

---

## 4. ACCESSIBILITY & SEMANTIKA
* **Sémantická struktura:** Pro desktop navigaci a podkategorie se používají sémantické tagy `<nav>` a odkazy, které jsou plně přístupné čtečkám obrazovky.
* **Aria standardy:** Tlačítko `MENU` a dropdowny plně zachovávají atributy `aria-expanded`, `aria-label` a podporují plnou klávesnicovou navigaci (včetně zavírání přes `ESC`).

---

## 5. VERIFIKACE VIEWPORTŮ & TESTOVACÍ MATICE

Byl proveden kompletní audit napříč všemi specifikovanými viewporty a kombinacemi schopností:

| Viewport | Typ vstupu / Capabilities | Očekávané zobrazení | Skutečné zobrazení | Stav |
| :--- | :--- | :--- | :--- | :---: |
| **375x812** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **390x844** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **430x932** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **768x1024** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **820x1180** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **1024x768** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **1180x820** | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **1280x800** (Tablet) | Touch (coarse, hover none) | LOGO \| MENU | LOGO \| MENU | **PASS** |
| **1280x800** (Desktop) | Mouse (fine, hover hover) | Desktop Nav + MENU | Desktop Nav + MENU | **PASS** |
| **1366x768** | Mouse (fine, hover hover) | Desktop Nav + MENU | Desktop Nav + MENU | **PASS** |
| **1440x900** | Mouse (fine, hover hover) | Desktop Nav + MENU | Desktop Nav + MENU | **PASS** |
| **1920x1080** | Mouse (fine, hover hover) | Desktop Nav + MENU | Desktop Nav + MENU | **PASS** |
| **2560x1440** | Mouse (fine, hover hover) | Desktop Nav + MENU | Desktop Nav + MENU | **PASS** |

### Kombinované zátěžové testy:
1. **Coarse + Hover None + 1280px (Tablet Landscape):** Zobrazuje se výhradně **LOGO | MENU** (desktop položky skryty). **PASS**
2. **Fine + Hover + Málo prostoru (např. malé okno na desktopu):** Navigace se nevejde $\rightarrow$ automatický fallback na **LOGO | MENU**. Žádné přetečení ani překryv. **PASS**
3. **Fine + Hover + Dostatek prostoru:** Zobrazuje se plná horizontální navigace. **PASS**

---

## 6. REGRESNÍ KONTROLA
* **Zadání splněno:** Změna se týká výhradně vnitřního výpočtu zobrazení navigace v `Header.tsx`.
* **Zero-Trust:** Nebylo zasaženo do routingu, obsahu stránek, CMS vrstvy, Pucku, databáze ani backendového API. Všechny stávající funkce a přístupová práva (RBAC) zůstaly 100% neporušené.

---

## 7. SHODA S DEFINITION OF DONE & GIT
* **Linter & Typecheck:** `npm run lint` $\rightarrow$ **SUCCESS**
* **Produkční sestavení:** `npm run build` $\rightarrow$ **SUCCESS**
* **Pracovní větev:** `main` (změny zapsány přímo do produkční větve na základě požadavku)
