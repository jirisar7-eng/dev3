# Fáze 17C: Crisis Content & AI Disclaimers Audit
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated

## 1. Cíle Fáze
Dokončit obsahovou část Beta 1.0 (P1), konkrétně zavedení a rozšíření krizového obsahu (48h checklist, krizové kontakty) a standardizaci AI/Právních disclaimerů napříč všemi AI Views.

## 2. Krizový obsah (SOS Průvodce)
- **48h Checklist**: Úplně přepracován `SosPlanView`. Zaveden interaktivní checklist pro prvních 48 hodin opatrovnického konfliktu rozdělený do fází:
  - 0–2 hodiny (Fáze šoku - Zajištění bezpečí, Emoční STOP)
  - 2–12 hodin (Stabilizace - Minimalizace konfliktu, BIFF komunikace)
  - 12–24 hodin (Odstup - Pravidlo 24h, ochrana majetku)
  - 24–48 hodin (Odborná pomoc - Advokát, OSPOD)
- **Krizové kontakty**: Doplněna sekce s jasným dělením (A. Ohrožení života, B. Psychologická krizová pomoc, C. Právní a sociální pomoc). Kontakty pochází z ověřených zdrojů (Integrovaný záchranný systém, MV ČR, ÚMPOD, APERIO) s vyznačeným datem ověření.
- **APERIO Metodika**: Ponechány klíčové body pro ochranu psychiky dětí (konflikt mimo děti, společné oznámení). Zřetelné upozornění, že se jedná o prevenci a nikoliv závaznou právní radu.

## 3. Právní a AI Disclaimery
Následující AI komponenty byly zkontrolovány a na jejich konec byly explicitně přidány disclaimery upozorňující, že obsah generovaný pomocí AI slouží pouze jako informační podpora, nenahrazuje advokáta, negarantuje soudní výsledek a může obsahovat chyby:
- `AiAssistantView` (BIFF & Asistent)
- `AiFormsView` (Generování podání)
- `AiCaseManagerView` (Analýza dokumentů)
- `AiGuideView` (Procesní plánování)
- `AiSimulatorView` (Trénink komunikace)
- (`AlimonyCalculatorView` - přidáno již ve fázi 17A)

## 4. Regresní Testování
- **Security & AI Regression (PASS)**: Nedošlo k úpravě žádných kontrolních, autorizačních, nebo RBAC mechanismů. `run_security_tests.cjs` reportuje PASS u `rate limiting`, `authorization`, a `audit logging`.
- **PWA Regression (PASS)**: Veřejné statické views se bez problémů cachují (v souladu s 17B), jelikož neobsahují dynamický server-side load mimo standardní UI flow (dokud neprobíhá volání AI - což zůstává bezpečně na 'Network Only').
- **Lint (PASS)**: Statická analýza kódu nehlásí žádné TypeScript typové chyby ani problémy s formátováním.
- **Build (PASS)**: Aplikace zkompilována úspěšně (Vite/Tsc).

## 5. Závěr & Známá omezení
- PWA momentálně nepodporuje offline funkčnost pro samotné odeslání požadavků na AI modely (nutné internetové připojení k backendu, plánováno částečně do Beta 1.1 přes fallback obsahy).
- Kontaktní telefony (112, 155, 158) nelze přes prohlížeč standardně vytáčet z desktopů, pouze na mobilních zařízeních (telefonní `tel:` linky nejsou striktně nutné v textové formě, ale je vhodné je v další iteraci UX na mobily napojit).
