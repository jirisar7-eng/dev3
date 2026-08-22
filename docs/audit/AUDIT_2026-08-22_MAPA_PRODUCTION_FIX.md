# Auditní zpráva: Oprava Mapy subjektů v produkci (PROD3)

**Datum a čas:** 2026-08-22
**Úkol:** Oprava Mapy subjektů – Produkční data + Navigace
**Původní požadavek:** Mapa po nasazení do produkce nezobrazuje žádné body a z menu zmizel odkaz, ačkoli kód tyto komponenty obsahuje.

## Výchozí stav a Root Cause
- **Databáze:** Počet reálných registrovaných subjektů (vč. seed dat) neměl nastavenou žádnou hodnotu `lat` a `lng`, což mapě bránilo v jejich zobrazení.
- **Menu:** V `Header.tsx` docházelo k situaci, kdy při existenci libovolných položek navigace z databáze (CMS API) byly zcela potlačeny všechny hardcoded (fallback) položky, včetně nově přidané "Mapy subjektů".
- **Chyba z předchozí změny:** Z předchozí implementace byly pomocí regulárního výrazu do `seed.ts` zaneseny duplicitní chybné/falešné souřadnice pouze pro soudy (každý dostal Prahu: 50.0865, 14.4239).

## Provedené změny
1. **Oprava Navigace (`Header.tsx`):**
   - Změněna logika načítání `dynamicNav`.
   - Nyní, pokud se načte databázové menu z API, provede se bezpečné sloučení s `FALLBACK_NAV_ITEMS`. Nové statické routy (jako `/mapa-subjektu`), které ještě nejsou v databázi uloženy, jsou dynamicky a bezpečně přidány.
2. **Databázový Seed (`prisma/seed.ts`):**
   - Odstraněny falešné duplicitní souřadnice zkopírované hromadně pro soudy.
   - Doplněny skutečné a přesné souřadnice vybraným testovacím subjektům: Alena Malá, Diecézní charita Plzeň, OSPOD České Budějovice, Okresní soud v Č. Budějovicích, Petr Havlíček (advokát).
3. **Backfill Skript (`scripts/backfill-gps.ts`):**
   - Vytvořen idempotentní Node.js skript používající Nominatim (OpenStreetMap) pro jednorázový backfill souřadnic produkčních dat. Skript projde všechny záznamy s NULL souřadnicemi, geokóduje je a bezpečně je updatuje.
4. **Rozšíření Testů:**
   - Rozšířen test `test-mapa-subjektu.cjs` o kontrolu správného skládání `baseNav` a validace komponent pro zobrazení reálných dat.
5. **Validace UX:**
   - Tlačítka pro přepnutí Seznam/Mapa fungují, stejně jako odkaz "Zobrazit na mapě". Subjekty bez polohy ukazují adekvátní placeholder zprávu.

## Bezpečnostní a Regresní Rizika
- Skript na backfill pracuje postupně (delay 1s mezi requesty), čímž respektuje Rate Limity služby OSM Nominatim a zabrání blockingu. Nebyly zavedeny žádné mock ani fake záznamy do produkčního workflow aplikace.
- Úprava navigace je provedena tak, že zachovává přednost databáze a CMS (id / url).

## Výsledky Testů
- **TypeScript:** PASS
- **Test Mapy:** PASS
- **Lint:** PASS (chyby opraveny včasným odstraněním duplicit)
- Zkontrolováno sloučení menu (Mapa subjektů je trvale v navigaci).

## Výsledný stav
Všechny subjekty, u nichž lze adresu lokalizovat, nyní mohou mít zadané a zpracované souřadnice, které se správně přenesou z PostgreSQL (přes Prisma) na mapu na frontendu. Administrace i uživatelské rozhraní správně reflektuje přítomnost i absenci GPS lokace.

## Dodatečná oprava (2026-08-22): Oprava inicializace Prisma klienta v Backfill skriptu
- **Problém:** Skript `scripts/backfill-gps.ts` selhával v produkčním prostředí s chybou `PrismaClientInitializationError: PrismaClient was instantiated without any options. A driver adapter is required...`
- **Root Cause:** Projekt využívá verzi Prisma vyžadující `@prisma/adapter-pg` pro Node.js ovladače (např. kvůli kompatibilitě v edge/serverless prostředí nebo specifické architektuře projektu, viz `src/db/prisma.ts`). Samotné zavolání `new PrismaClient()` v samostatném skriptu bez konfigurace adaptéru proto selhalo.
- **Oprava:** Skript byl upraven tak, aby explicitně vyžadoval `DATABASE_URL` z prostředí a správně inicializoval `pg.Pool` s adaptérem `PrismaPg`, stejným způsobem, jakým je to řešeno ve vrstvě aplikace (`src/db/prisma.ts`). Bylo také doplněno správné uzavření poolu `await pool.end()` po skončení operace, aby skript nezůstal viset. Skript v případě absence `DATABASE_URL` z bezpečnostních důvodů (fallback mitigace) ihned s chybou skončí.
