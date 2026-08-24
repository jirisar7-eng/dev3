# Audit Report: Osobní vzhled uživatele (Personal Themes)
Datum: 2026-08-24
Cíl: Implementace systému osobních vzhledů (dark mode, písmo, velikost textu, témata) pro jednotlivé uživatele s podporou české diakritiky.

## Výchozí stav
- Existující model `Theme` a `ThemeVariable` byl zaměřen na globální / admin nastavení.
- Témata se načítala pro všechny uživatele stejně ze `/api/themes`.
- `index.css` a `ThemeContext` používaly standardní Tailwind a CSS proměnné, ale bez personalizace.

## Provedené změny
1. **Databáze (Prisma)**
   - Vytvořen nový model `UserPreference` napojený na `User` model s poli: `themeMode`, `colorPreset`, `fontFamily`, `fontSize`, `density`, `borderRadius`, `highContrast`.
   - Úspěšně proveden `npx prisma validate`.
2. **Backend (API)**
   - Rozšířen `UserDataService.getUserProfile` o načítání `preferences`.
   - Přidána metoda `updateUserPreferences` do `UserDataService`.
   - Vytvořen endpoint `PUT /api/users/me/preferences` v `server.ts` pro bezpečné uložení nastavení vzhledu.
3. **Frontend (UI & Context)**
   - Upraven `ThemeContext` tak, aby naslouchal objektu `currentUser.preferences` z `AuthContext` a aplikoval změny na `:root` `documentElement`.
   - Rozšířeny typy ve `src/types/index.ts` o `UserPreference`.
   - Vytvořena nová komponenta `UserAppearanceTab.tsx` obsahující přepínače pro barevný režim, téma, písmo, velikost textu, atd., včetně live preview s diakritikou (Příliš žluťoučký kůň...).
   - Tab přidán do `UserProfileView.tsx` mezi Profil a Zabezpečení.
4. **Fonty a Diakritika**
   - Přidána deklarace `unicode-range` s podporou `latin-ext` pro všechny `WOFF2` lokální fonty v `index.css`.
   - Tím je zaručeno, že prohlížeč explicitně ví o podpoře českých znaků a nevyužije fallback fonty pro diakritiku.

## Testování a QA
- **Bezpečnost**: Endpoint `/api/users/me/preferences` je chráněn middlewarem `requireAuth` a data jsou spárována striktně přes `req.user.id`. SQL Injection / IDOR je zabráněno strukturou Prisma.
- **Validace**: Kompilace Typescriptu (TSC) úspěšná po odstranění `fetchCurrentUser` dependency a opravení importu lucide-react ikon.
- **Integrita dat**: Lokální data `UserPreference` nevynucují migraci (pro existující uživatele nevznikne problém, model bude vytvořen na požádání přes Prisma upsert).
- **Stav Buildu**: Otestován kompletní `npm run build` s výsledkem PASS.

## TODO / Možná rizika
- Pro zajištění, že styl se propíše před vykreslením komponent (FOUC), by mohlo být přidáno načtení ze storage nebo blocking skript, aktuálně se však načítá v momentě inicializace Auth (rychlé).
- `UserPreference` tabulka vyžaduje Prisma migraci na cílovém prostředí `npx prisma db push` nebo `migrate deploy`.

Git status a commit budou následovat přes automatický workflow.
