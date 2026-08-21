# Fáze 17A: Implementace Kalkulačky výživného
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated

## 1. Závěry implementace
Byla implementována chybějící funkce z "Beta 1.0 Backlogu": Kalkulačka výživného (Nutrition/Alimony Calculator).
- **Architektura**: Výhradně klientská (client-side). Využívá React pro UI a čistý TypeScript modul pro výpočet.
- **Logika**: Umístěna v izolovaném souboru `src/utils/alimonyCalculator.ts`.
- **UI Komponenty**: `AlimonyCalculatorView.tsx` (hlavní interaktivní komponenta) a `AlimonyCalculatorPage.tsx` (stránkový wrapper).
- **Routování**: Zaregistrováno pod `/kalkulacka-vyzivneho` a `/vyzivne` uvnitř `PublicPortal.tsx`.

## 2. Metodika a validace (Official Methodology)
- **Metodika**: Implementován model aproximující Doporučující tabulky Ministerstva spravedlnosti ČR (2022). 
- **Zohledněné proměnné**: 
  - Věk (4 kategorie: 0-5, 6-9, 10-14, 15+).
  - Počet vyživovacích povinností (1 až 5 a více).
  - Rozsah osobní péče povinného (v dnech za měsíc, proporcionální snížení).
  - Čistý příjem.
- **Validace**:
  - Kontrola záporných hodnot, neplatných stringů a počtu dnů péče (max 30.4).
  - Upozornění na tzv. kontrolní částku, pokud výsledné výživné přesáhne 50 % čistého příjmu.
  - Zřetelný **právní disclaimer**, že jde o čistě orientační výpočet.

## 3. Privacy & Security
- **Privacy (PASS)**: Aplikace z důvodu bezpečnosti neukládá vstupy do žádné formy paměti (`localStorage`, `sessionStorage` ani do `IndexedDB`). Jakmile uživatel stránku opustí nebo klikne na "Spočítat znovu", data zanikají. Nekomunikuje se s žádným API (Zero-knowledge princip).
- **Security (PASS)**: Implementace brání XSS pomocí standardního React sanitizovaného renderingu a přísného typování (TypeScript `Number` a `parseInt`). Absolutní zákaz volání eval(). XSS vektory byly mitigovány tím, že výstupem jsou pouze propočítaná čísla.

## 4. Testy (Tests)
- Soubor: `tests/alimonyCalculator.test.ts`.
- Běžely a prošly následující test cases:
  1. Jedno dítě, standardní péče.
  2. Dvě děti s další povinností (správný posun v procentní matici).
  3. Střídavá péče (správně aplikovaný slevový koeficient).
  4. Ošetření chyb (záporný příjem, neplatné dny).
  5. Hraniční hodnota (více než 5 vyživovacích povinností - test zastropování matice).

## 5. Závěr a Build
- Linter a produkční `esbuild` proběhly bez chyb.
- Tímto je splněn bod P1 (Must Have) pro verzi Beta 1.0.

*Dalším doporučeným krokem je implementace Fáze 17B (PWA Foundation).*
