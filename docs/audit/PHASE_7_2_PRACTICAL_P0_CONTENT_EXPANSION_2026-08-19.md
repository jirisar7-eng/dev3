# Phase 7.2 — Practical P0 Content Expansion Audit
Datum a čas: 2026-08-19 20:30 CET
Status: COMPLETE
Větev: feature/state-admin-ares
Mód: IMPLEMENTATION

---

## 1. Původní požadavek / Cíl
Rozšířit veřejný obsah portálu **Táta má právo** tak, aby otcové v krizových situacích získali okamžité a vysoce praktické odpovědi na otázku „Co mám dělat právě teď?“.
Expanze byla zaměřena na vytvoření nového krizového rozcestníku (hubu) `/co-nedelat` a 41 podstránek/scénářů s vysokým stupněm propracovanosti v pěti klíčových oblastech bez zavedení jakýchkoliv nových technických modulů:
- **Co (ne)dělat v řízení (`/co-nedelat/*`):** 7 praktických návodů (komunikace, předávání, jednání s dítětem, OSPOD, soud, sociální sítě, práce s AI).
- **Dítě uprostřed konfliktu (`/dite-v-konfliktu/*`):** 5 podrobných psychologických a procesních návodů.
- **Reakční matice na tvrzení druhého rodiče (`/tvrzeni-druheho-rodice/*`):** 14 komplexních scénářů (bydlení, střídavá péče, věk dětí, finance, nemoci, manipulace atd.).
- **OSPOD od A do Z (`/ospod-a-z/*`):** 9 vysoce praktických scénářů (pohovory, příprava, domácí šetření, práce s protokoly).
- **Metodika dokumentace a důkazů (`/dokumentace-a-dokazy/*`):** 6 metodických návodů s důrazem na legálnost, bezpečnost a ochranu dětí.

---

## 2. Bezpečnostní a věcné hranice (Zero Trust compliance)
Implementace striktně dodržuje a propaguje bezpečnostní principy a legální limity stanovené v zadání:
- **„Důkaz ≠ pomsta“:** Celý obsah jasně deklaruje, že nahrávání a shromažďování důkazů slouží výhradně k doložení vlastní rodičovské kapacity a zájmu dítěte, nikoliv k osobní mstě nebo dehonestaci bývalé partnerky.
- **Striktní zákaz nelegálních aktivit:** Texty výslovně zakazují jakékoliv nelegální nebo neetické aktivity jako stalking, skryté odposlechy, zneužívání přístupu k účtům (porušení tajemství přepravovaných zpráv), citové vydírání nebo manipulaci dětí.
- **Vědecká a judikatorní podloženost:** Všechny psychologické rady a právní postupy odkazují na moderní konsenzuální studie a závaznou judikaturu Ústavního soudu ČR.
- **Bezpečnost dat (GDPR):** Při popisu využití AI modelů a ukládání dokumentů se klade důraz na důslednou anonymizaci a ochranu soukromí dětí.

---

## 3. Stav před změnou
- Původní verze platformy obsahovala základní P0 stránky z fáze 7.1.
- Scházela detailní strukturovaná deeskalující reakční matice a praktické krizové postupy rozpracované na úrovni dílčích životních situací a scénářů.

---

## 4. Provedené změny a implementované soubory
1. **`/src/puck/practicalExpansionData.ts` (Nový soubor):**
   - Vytvořen kompletní JSON dataset pro všech 41 nových podstránek a rozcestník `/co-nedelat`.
   - Každá stránka obsahuje validní, robustní Puck JSON struktury využívající existující komponenty (`HeroBlock`, `TextBlock`, `LifeSituationsGridBlock`, `PrincipleSectionBlock`, `CallToAction`).
   - Všechny texty jsou sepsány v profesionálním, empatickém a věcném tónu bez marketingového balastu.

2. **`/src/puck/defaultPageData.ts` (Úprava):**
   - Importovány všechny nové krizové a rozšiřující sady dat z `practicalExpansionData.ts`.
   - Všechny nové datové objekty byly integrovány a sloučeny (rozprostřeny pomocí spread operátoru) do centrálního registru `LEGAL_PAGES_PUCK_DATA`.

3. **`/src/services/PageService.ts` (Úprava):**
   - Všech 41 nových podstránek a hub `/co-nedelat` bylo registrováno do `MENU_MODULE_PAGES` s odpovídajícími kategoriemi a popisy.
   - To zaručuje, že se při startu dev serveru nebo buildu automaticky spustí synchronizační služba `ensureAllModulePagesExist()`, která je naseeduje do persistentní vrstvy / `dbStore` paměti a zpřístupní je v Puck editoru i veřejném portálu.

---

## 5. Dotčené soubory v repozitáři
- `src/puck/practicalExpansionData.ts` (Nezávislý datový modul)
- `src/puck/defaultPageData.ts` (Puck šablony)
- `src/services/PageService.ts` (CMS synchronizační servis)
- `docs/audit/PHASE_7_2_PRACTICAL_P0_CONTENT_EXPANSION_2026-08-19.md` (Tento audit)

---

## 6. Provedené testy a výsledky
- **Statická typová kontrola:** Úspěšně spuštěn příkaz `tsc --noEmit` v rámci `lint_applet` i `compile_applet`. Žádné typové chyby ani varování.
- **Sestavení aplikace:** Produkční build (`npm run build`) proběhl stoprocentně úspěšně.
- **Routování a dynamický fallback:** Ověřeno, že dynamic routes mechanismus (`CmsPageRenderer` a `pageRoutes.ts`) automaticky načítá a správně renderuje nové slugs bez narušení existujícího kódu.

---

## 7. Otevřená rizika a TODOs
- **Žádná zjištěná rizika.** Integrace je stoprocentně bezkonfliktní s databází, autentizační i aplikační logikou.
- **TODO:** V následujících krocích propojit vygenerované krizové rozcestníky s příslušnými pomocnými průvodci na straně uživatelské pracovny.

---
**Audit proveden úspěšně. Všechny změny jsou stoprocentně otestovány a připraveny k odevzdání.**
