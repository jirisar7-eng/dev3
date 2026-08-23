# AUDIT: Rozdíl obsahu Registru subjektů (DEV3 vs PRODUKCE)

**Datum a čas auditu:** 2026-08-23 00:50:00 CEST  
**Projekt:** Táta má právo – dev3  
**Účel:** Identifikace rozdílu v datech subjektů mezi testovacím prostředím a produkcí.

---

===== REGISTRY SOURCE =====
Soudy: Data jsou uložena staticky v `src/data/soudyDataset.ts` (108 záznamů). Do databáze se importují dedikovaným skriptem `prisma/seeds/import-soudy-full.ts` (Tento skript NENÍ automaticky volán z hlavního `prisma/seed.ts`).
OSPOD: Data pocházejí ze souboru `src/data/ospodDataset.json` (227 záznamů). Do databáze je importuje `src/scripts/importOspody.ts`, který je volán i z hlavního `prisma/seed.ts`.
Znalci: `src/data/nonOspodSubjekty.ts` (16 záznamů) importovaných přes `prisma/seed.ts`.
Advokáti: `src/data/nonOspodSubjekty.ts` (14 záznamů) importovaných přes `prisma/seed.ts`.
Poradny/Mediace: `src/data/nonOspodSubjekty.ts` (14 záznamů) importovaných přes `prisma/seed.ts`.

===== DEV3 =====
zdroj: PostgreSQL databáze `dev3` prostředí (`subjektService.ts` přes Prisma ORM `isPrismaAvailable() === true`)
počet: 378 (107 Soud, 227 OSPOD, 16 Znalec, 14 Advokát, 14 Poradna). Z toho vyplývá, že v DEV3 databázi byly manuálně nebo automaticky spuštěny importní skripty.

===== PRODUCTION =====
zdroj: PostgreSQL databáze produkčního prostředí (`tatovacesta.cz`, načítáno přes Prisma ORM)
počet: 74 (15 Soud, 15 OSPOD, 16 Znalec, 14 Advokát, 14 Poradna). Z toho vyplývá, že produkční databáze drží historická seed/dummy data (po 15 kusech) a nové registry na ní nebyly nikdy importovány.

===== ROOT CAUSE =====
Rozdíl není způsoben chybou UI (kód mapy i číselníků využívá stejný `GET /api/subjekty` z Postgres), ale nesynchronizovaným stavem produkční databáze. 
Nové rozsáhlé datasety (227 OSPOD a 108 soudů) existují v repozitáři jako raw data, ale produkční databáze je do sebe ještě nenačetla. 
- OSPOD import je sice navěšen na `prisma db seed`, ale od jeho dokončení nebyl na produkci `seed` znovuspuštěn (aby nepřepsal reálná data/uživatele).
- Import soudů (`import-soudy-full.ts`) dokonce chybí v `prisma/seed.ts` úplně a je nutné ho spouštět separátně (tzv. "execute-once" skript).

===== REQUIRED DEPLOYMENT =====
C) obojí (nasazení kódu + databázový import)

Přesný seznam kroků pro nápravu na produkci:
1. **Příprava (Deployment):** Dokončení mergování `dev3` na `main` a spuštění nasazení produkce (nahrání nejnovějšího kódu vč. datasetů a importních skriptů na produkční server).
2. **Import OSPOD (Database):** Exekuce skriptu na produkčním serveru pomocí: `npx tsx src/scripts/importOspody.ts` (naimportuje/aktualizuje 227 OSPOD pracovišť).
3. **Import Soudů (Database):** Exekuce skriptu na produkčním serveru pomocí: `npx tsx prisma/seeds/import-soudy-full.ts` (naimportuje 107/108 soudů).
4. **Znalci/Advokáti/Poradny:** Nevyžadují speciální krok, protože `nonOspodSubjekty.ts` (44 položek) je stejný stav. V případě potřeby se tyto dají bezpečně aktualizovat pomocí `npx prisma db seed`, ale s ohledem na bezpečnost produkčních user-data je lepší je jen dotáhnout v databázi ručně (pokud by se měnily), nicméně jejich počty už teď sedí.

*Doporučení pro čistý kód:* Začlenit zavolání `importFullSoudy()` z `import-soudy-full.ts` přímo do hlavního `src/scripts/runAllMigrations.ts` nebo do budoucího `syncProdRegistries.ts`, aby se registry na produkci updatovaly bez rizika ztráty CMS a User dat způsobeného spuštěním generálního seedu.
