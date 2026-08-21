# Fáze 17C: Crisis Content & AI Disclaimers Audit
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated

## 1. Cíle Fáze
Dokončit obsahovou část Beta 1.0 (P1), konkrétně zavedení a rozšíření krizového obsahu (48h checklist, krizové kontakty) a standardizaci AI/Právních disclaimerů napříč všemi AI Views, včetně revize psychologických upozornění.

## 2. Krizový obsah (SOS Průvodce)
- **48h Checklist**: Úplně přepracován `SosPlanView`. Zaveden interaktivní checklist pro prvních 48 hodin opatrovnického konfliktu rozdělený do fází:
  - 0–2 hodiny (Fáze šoku - Zajištění bezpečí, Emoční STOP)
  - 2–12 hodin (Stabilizace - Minimalizace konfliktu, BIFF komunikace)
  - 12–24 hodin (Odstup - Pravidlo 24h, ochrana majetku)
  - 24–48 hodin (Odborná pomoc - Advokát, OSPOD)
- **Krizové kontakty**: Doplněna sekce s jasným dělením (A. Ohrožení života, B. Psychologická krizová pomoc, C. Právní a sociální pomoc). Kontakty pochází z ověřených zdrojů (Integrovaný záchranný systém, MV ČR, ÚMPOD, APERIO) s vyznačeným datem ověření.
- **APERIO Metodika**: Ponechány klíčové body pro ochranu psychiky dětí (konflikt mimo děti, společné oznámení). Zřetelné upozornění, že se jedná o prevenci a nikoliv závaznou právní radu.

## 3. Právní a AI Disclaimery
Všechny AI a výpočetní komponenty v aplikaci byly zkontrolovány a obsahují relevantní disclaimery odpovídající typu funkce:
- `AiAssistantView` (BIFF & Asistent) -> Obecná AI přesnost + právní a psychologické upozornění
- `AiFormsView` (Generování podání) -> AI přesnost + právní upozornění
- `AiCaseManagerView` (Analýza dokumentů) -> AI přesnost + právní a psychologické upozornění
- `AiGuideView` (Procesní plánování) -> AI přesnost + právní upozornění
- `AiSimulatorView` (Trénink komunikace) -> AI přesnost + právní a psychologické upozornění (doplněno)
- `AlimonyCalculatorView` (Kalkulačka výživného) -> Orientační výpočet + zdroj metodiky (doplněno v 17A)

## 4. Regresní Testování
- **Security & AI Regression (PASS)**: Nedošlo k úpravě žádných kontrolních, autorizačních, nebo RBAC mechanismů. `run_security_tests.cjs` reportuje PASS u `rate limiting`, `authorization`, a `audit logging`. Skript `run_ai_rate_limit_test.cjs` reportuje PASS.
- **PWA Regression (PASS)**: Veřejné statické views se bez problémů cachují, komponenty správně renderují.
- **Calculator Regression (PASS)**: `AlimonyCalculatorView` funguje a renderuje kontrolní upozornění.
- **Lint (PASS)**: Statická analýza kódu nehlásí žádné TypeScript typové chyby ani problémy s formátováním.
- **Build (PASS)**: Aplikace zkompilována úspěšně (Vite/Tsc).

## 5. Závěr & Známá omezení
- PWA momentálně nepodporuje offline funkčnost pro samotné odeslání požadavků na AI modely.
- Všechny AI/Tools funkce mají implementované varování o povaze informací a nenahraditelnosti odborné péče.
