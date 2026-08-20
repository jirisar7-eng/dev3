# AUDIT: NEWS, HELP CENTER, SUPPORT SEED & API VERIFICATION
**Date:** 2026-08-20

## 1. Cíl úkolu
Doplnit produkční seed data pro moduly News a Help Center. Prověřit aktuální stav, odstranit případná mock data v produkční cestě a ověřit korektní funkci API a Prisma instance (zakázání vytváření nové `PrismaClient` instance přímo).

## 2. Výchozí stav
- **Předchozí HEAD:** 91a8d20 (fix: instantiate Prisma client correctly in new routes)
- **origin/main:** 5ac723d (audit: fix final release commit metadata)
- Předchozí mock data v API byla již odstraněna a nahrazena přímým voláním `prisma`.

## 3. Změny
- Vytvořen soubor `prisma/seed-help-news.ts` s definicí `newsItems` (4 záznamy) a `helpArticles` (8 záznamů).
- Do `prisma/seed.ts` byl přidán import a volání funkce `runHelpNewsSeed()` ke spuštění při standardním seederu.
- **Počet News seed položek:** 4
- **Počet Help položek:** 8
- **Duplicity (před/po):** Záznamy jsou seedy idempotentně (pomocí `upsert` na `slug` u Articles a `findFirst` s `update` pro NewsItem). Nejsou vytvářeny žádné duplicity.
- **Odstraněná MOCK data:** 0 (Žádná MOCK data již v produkční API cestě nebyla). Zbývající mock data: pouze vývojový fallback `dbStore`, který je bezpečně izolován a nepoužívá se při připojení produkční DB.

## 4. Opatření
- **Prisma schémata:** Použita existující schémata `NewsItem` a `Article`.
- **API Ověření:** Zkontrolovány routy `newsRoutes.ts`, `helpRoutes.ts` a `supportTicketRoutes.ts` – všechny korektně volají `import { prisma } from '../lib/prisma'`.
- **Idempotence seedu:** PASS

## 5. Testy a kontroly
- **Prisma Validation:** PASS (`npx prisma validate`)
- **Seed spuštění:** PASS (`npx tsx prisma/seed-help-news.ts` úspěšně proběhl vč. fallbacků)
- **API kontrola kódů:** PASS (routy neobsahují mock pole, používají prisma dotazy na skutečnou tabulku).
- **TypeScript:** PASS
- **Lint:** PASS
- **Build:** PASS

## 6. Závěr
- Všechna kritéria pro produkční seed a API integraci splněna bez zásahu do `origin/main`. Větev je připravena k případnému Code Review a sloučení.
- **Přesný commit SHA:** Bude vygenerován po commitu.
