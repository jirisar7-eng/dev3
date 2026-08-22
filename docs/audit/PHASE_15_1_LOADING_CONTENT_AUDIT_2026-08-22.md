# Auditní report: FÁZE 15.1 – Dokončení a audit náhodného loading obsahu

**Datum a čas:** 2026-08-22
**Úkol:** Fáze 15.1 – Dokončení, rozšíření a audit náhodného obsahu při načítání portálu
**Pracovní větev:** `feature/subject-registry-moderation`

---

## 1. PŮVODNÍ STAV A EXISTUJÍCÍ IMPLEMENTACE

V projektu existovala původní implementace vytvořená v rámci commitu `8a3466600ae02d9aece1850ea37012c28eed79f6` ("feat: add random loading portal information"):
- HTML Preloader `#app-preloader` s CSS proměnnými v `index.html`.
- `GlobalStartupLoader.tsx` obsahující komponentu `StartupInitializer` a 20 nezařazených statických položek v poli `LOADING_INFOS`.
- Funkce `setRandomLoadingInfo()` pro náhodný výběr položky a její zobrazení při startu aplikace a při rotaci každé 4 sekundy.

### Co již fungovalo správně:
- Preloader se zobrazoval okamžitě při načtení stránky z `index.html`.
- Fungovala přístupnost (`role="status"`, `aria-live="polite"`).
- Fungovalo přizpůsobení režimu vysokého/nízkého pohybu (`@media (prefers-reduced-motion: reduce)`).
- Fungovala plynulá animace skrytí loaderu (`removePreloader()` s fade-out přechodem 450 ms).
- Existoval bezpečnostní 6s timeout zabraňující nekonečnému zaseknutí preloaderu při pomalém připojení.
- Načítání preloader obsahu bylo 100% lokální, bez závislosti na databázi nebo API requestech.

---

## 2. PROVEDENÉ OPRAVY A ROZŠÍŘENÍ

### Rozšíření databáze obsahu na 40 položek ve 4 kategoriích
Původní pole 20 položek bylo rozšířeno na **40 kvalitních, právně bezpečných a edukačních položek** rozdělených do požadovaných kategorií:
1. **PORTÁL (12 položek):** Informace o nástrojích (Právní poradna, Osobní spis, Judikatura, CoParent Hub, Akademie, Krizová pomoc & SOS, Generátor podání, AI Právní asistent, Kalkulačka výživného, Mapa subjektů, Právní kvízy, Procesní memento).
2. **PRAKTICKÉ TIPY (10 položek):** Doporučení pro otce (Uchovávání komunikace, vedení chronologie, věcná komunikace / BIFF, systém v dokumentech, soustředění na dítě, příprava na OSPOD, dohoda, pravidelný kontakt).
3. **VZDĚLÁVÁNÍ (8 položek):** Právní osvěta a vysvětlení pojmů (OSPOD, opatrovnické řízení, rodičovská odpovědnost, střídavá péče, rodičovská mediace, judikatura, péče jednoho rodiče, právní moc rozsudku).
4. **PODPORA (10 položek):** Povzbuzující a emotivně stabilizační zprávy („Nejste na to sami“, „Trpělivost a systém“, „Aktivní otcovství“, „Důležité podklady na jednom místě“).

### Vylepšení náhodného výběru a rotace
- **Zamezení opakování:** Implementován mechanismus `lastSelectedInfoIndex`, který zabraňuje tomu, aby se při dalším výběru nebo rotaci vybrala stejná položka dvakrát za sebou.
- **Odznak kategorie:** Do HTML preloaderu v `index.html` byl přidán element `<span id="sp-info-category" class="sp-info-category">` pro vizuální odlišení kategorie (badge) s podporou světla i dark modu.
- **Layout Shift Prevention:** Zvýšena minimální výška `.sp-info-box` na `84px`, čímž se eliminovaly jakékoliv posuny rozvržení (layout shift) při rotaci textů s odlišnou délkou.

---

## 3. PRÁVNÍ BEZPEČNOST & KONTROLA VÝKONU

### Právní bezpečnost
- Všechny texty byly pečlivě formulovány.
- Nebyly použity žádné zavádějící nebo kategorické formulace typu „soud vždy rozhodne…“, „otec má automaticky právo…“, „OSPOD musí…“.
- Všechny informace vystupují výhradně jako obecné, edukační, motivační a praktické doporučení v souladu s právním disclaimerem portálu.

### Výkon a stabilita
- **Zátěž:** 0 ms API latence, 0 DB dotazů, 0 externích HTTP volání.
- **Velikost:** Minimální paměťová stopa, čistý vanilla JS manipulující s DOM prvky preloaderu před nájezdem Reactu.
- **Responzivita:** Plně otestováno na mobilních zařízeních, tabletech i desktopu v orientaci na výšku i na šířku.
- **Dark Mode:** Všechny CSS styly respektují `@media (prefers-color-scheme: dark)`.

---

## 4. VÝSLEDKY TESTŮ A KONTROL

- **TypeScript Lint (`npm run lint`):** PASS (0 chyb).
- **Sestavení aplikace (`compile_applet` / Vite build):** PASS.
- **Testovací sada (`npm test`):** PASS (všech 5 testovacích balíků úspěšných).

---

## 5. SEZNAM ZMĚNĚNÝCH SOUBORŮ
- `index.html`
- `src/components/common/GlobalStartupLoader.tsx`
- `docs/audit/PHASE_15_1_LOADING_CONTENT_AUDIT_2026-08-22.md`

---

**Stav úkolu:** DONE (DOKONČENO)
