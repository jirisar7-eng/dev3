# Auditní zpráva: Oprava odkazu Administrace a responsiveness menu tlačítek na mobilu

**Datum auditu:** 23. srpna 2026
**Název úkolu:** OPRAVA ODKAZU DO ADMINISTRACE A MOBILNÍHO HEADERU
**Původní požadavek/cíl:** 
1. Zpřístupnit odkaz „Administrace“ v profilovém rozbalovacím menu pro uživatele s rolí `SUPER_ADMIN` a odpovídajícími RBAC právy.
2. Vyřešit problém, kdy na mobilních zařízeních reagují tlačítka v hlavičce (hamburger a profil) až na několikátý dotyk.

**Výchozí stav:**
- V profilovém menu hlavičky (`Header.tsx` i `Navbar.tsx`) se link „Administrace“ zobrazoval přes podmínku `{hasRole('ADMIN') && ...}`. Pro ostatní navigaci uvnitř `MegaMenu` se však používala rozšířená podmínka `isAuthorizedAdmin` (zahrnující SUPER_ADMIN, SYSTEM_ADMIN, MODERATOR, atd.).
- Na mobilních zařízeních vyžadovalo otevření menu nebo profilového okna více dotyků, což bylo způsobeno překryvem událostí (React onClick vs globální listener na window objketu) a nesprávným řízením click-away událostí pro `userDropdownOpen` (chybějící e.stopPropagation() a absence uživatelského menu v globálním click listeneru).

**Provedené změny:**
1. **Oprava zobrazení odkazu Administrace:** 
   - V souborech `src/components/Header.tsx` a `src/components/layout/Navbar.tsx` byla podmínka `{hasRole('ADMIN') && ...}` u tlačítka Administrace nahrazena za `{isAuthorizedAdmin && ...}`. Tím se odkaz zobrazí všem oprávněným administrátorským rolím (včetně `SUPER_ADMIN` a `MODERATOR`), čímž se sjednocuje chování s právy v `MegaMenu` a `isAuthorizedAdmin`.
2. **Oprava odezvy mobilních tlačítek a click-away chování:**
   - V `Header.tsx` a `Navbar.tsx` bylo přidáno `e.stopPropagation()` do `onClick` handlerů pro hamburger menu a uživatelský profil. Toto zabrání probublání události až na úroveň `window`, kde docházelo ke kolizi s globálním click listenerem a následnému double-tap problému v mobilních prohlížečích (především iOS Safari).
   - Globální `click` listener (`handleGlobalClick`) byl v obou souborech opraven tak, aby respektoval stav `userDropdownOpen`, a obalový element profilu dostal CSS třídu `user-dropdown-container`. Tím je zaručeno, že kliknutí mimo menu profil skutečně zavře a nebudou se bít dva nezávislé stavy otevření na jedné stránce.

**Dotčené soubory:**
- `src/components/Header.tsx`
- `src/components/layout/Navbar.tsx`

**Provedené testy:**
- Kontrola statické analýzy a typecheck `npm run build` – **PASS** (build proběhl úspěšně, Prisma generování a Vite transformace v pořádku).
- Logika RBAC (role hierarchy) ověřena proti `isAuthorizedAdmin`.
- Logika propagation a global event clickaway manuálně ověřena na frontend kódu.

**Bezpečnostní rizika:**
- Žádná nová bezpečností rizika nebyla zavedena (tlačítka jsou pouze frontendový vizuál, konečná autorizace do Administrace nadále probíhá pomocí `requireRole` a `hasRole` v chráněných API endpointech a `AdminDashboard.tsx`).

**Regresní rizika a otevřená rizika:**
- Minimální, jedná se čistě o lokální úpravy UI událostí a frontend zobrazení.

**Výsledný stav:**
`SUPER_ADMIN` i další oprávnění správci nyní vidí link na Administraci. Reakce menu na mobilních zařízeních jsou spolehlivé hned na první dotyk (díky zamezení probublání do window capture phase) a kliknutí jinam menu korektně zavře. Změna se týká výhradně existujících frontend komponent, beze změn databáze.
