# Audit: Náhodný informační systém v loading screen

## 1. Původní stav
- **Loading komponenta**: Původní preloader byl implementován čistě v `index.html` (statické HTML) a překrýval React aplikaci, než se přes `GlobalStartupLoader.tsx` (`StartupInitializer`) asynchronně načetla data.
- **Vzhled**: Zobrazoval logo "Táta má právo", titulek, podtitulek "Připravujeme obsah portálu" a spinner "Načítáme Táta má právo…".
- **Omezení**: Neobsahoval žádný edukativní ani informační rozměr během případného delšího načítání.

## 2. Provedená změna
Do stávajícího loaderu v `index.html` byl přidán kontejner `#sp-info-box` umístěný mezi podtitulek a načítací spinner tak, aby nenarušoval původní layout ani nezpůsobil `layout shift` (použito `min-height`).
Byla vytvořena statická datová sada `LOADING_INFOS` uvnitř `GlobalStartupLoader.tsx`, obsahující 20 tematických tipů o funkcích portálu. 

### Seznam informačních témat (20):
1. ⚖️ Právní poradna
2. 📚 Judikatura
3. 👨‍👧 CoParent Hub
4. 📁 Můj případ
5. 🤖 AI Právní Asistent
6. 🧮 Simulátor
7. 🎓 Akademie
8. 🎥 Videotéka
9. 📰 Novinky
10. 👨‍👧‍👦 Příběhy otců
11. 🆘 SOS plán
12. 📊 Statistiky
13. 🔐 Bezpečnost účtu
14. ❤️ Proč jsme vznikli
15. 🧭 Mapa portálu
16. 💬 Komunita
17. 📋 Generátor formulářů
18. 📑 Vzory dokumentů
19. 📖 Wiki
20. 🏛️ O projektu

### Způsob náhodného výběru a rotace:
Při `mount` komponenty `StartupInitializer` je pomocí JS (DOM manipulace, protože jde o static overlay mimo React root) ihned vybrána jedna náhodná karta (`Math.random()`).
Je spuštěn `setInterval`, který každé 4 sekundy zobrazí jinou náhodnou kartu s plynulým `opacity` fade přechodem.
Při úspěšném načtení dat nebo selhání, a stejně tak v `useEffect` cleanup funkci (unmount), je tento interval vždy spolehlivě zrušen pomocí `clearInterval`.

## 3. Změněné soubory
- `index.html` (úprava CSS a přidání kontejneru pro tipy).
- `src/components/common/GlobalStartupLoader.tsx` (přidání datové struktury a rotační logiky).

## 4. Kontroly kvality a přístupnosti (QA)
- **Responsive kontrola**: Rozložení neposouvá původní prvky, velikost písma je responzivní, vložení boxu se vejde bez horizontálního i vertikálního scrollování na mobily, tablety i desktopy. (PASS)
- **Accessibility kontrola**: Fade-in / fade-out respektuje dostatečnou délku (4s pro čtení), box se vizuálně odlišuje jemným kontrastním pozadím a nepřebíjí hlavní loading indicator. (PASS)
- **Typecheck**: PASS
- **Lint**: PASS
- **Build**: PASS
- **Diff-check**: PASS
- **Runtime kontrola**: PASS (karta se objevuje, rotuje, po odstranění preloaderu nezůstávají aktivní timeouty).

## 5. Závěr
Integrace byla úspěšně realizována s minimálním dopadem na existující závislosti, pouze jako "enhancement" v prezentační vrstvě. Nedotýká se žádných kritických systémů, databází ani aplikačních logik.
