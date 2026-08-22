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

## Dodatečná oprava (2026-08-22): Oprava chyb Geocoderu z DRY-RUN testu
- **Diagnostika:**
  - PROD3 připojení funguje, `PostgreSQL` databáze je dostupná přes `postgres_prod3:5432`.
  - Příkaz `npx tsx scripts/backfill-gps.ts --dry-run` byl v produkčním kontejneru úspěšně spuštěn.
  - Ochranný mechanismus zafungoval správně – databáze **nebyla** změněna.
  - V důsledku velkého zatížení nebo anomálie služby Nominatim obdržel skript neočekávanou odpověď (XML/HTML) namísto validního JSON.
  - Z toho důvodu skript selhal při parsování (`Unexpected token '<', "<?xml vers"... is not valid JSON`).
  - Běh byl manuálně zastaven kvůli velkým opakováním shodných chyb, režim `--apply` nebyl záměrně vůbec spuštěn, žádná data nebyla narušena.
- **Oprava:**
  - `backfill-gps.ts` rozšířen o robustní kontrolu formátu odpovědi.
  - Nyní se explicitně ověřuje HTTP kód (`res.ok`) a typ obsahu (`content-type` musí obsahovat `application/json`).
  - Při XML nebo neznámé odpovědi skript chybu chytí a danou adresu klasifikuje jako bezpečný status `ERROR` (přeskočeno), aniž by neošetřeně padal.
  - Byl nastaven pevný limit maximálních pokusů o geokódování (`MAX_RETRIES`), který zamezuje nekonečnému opakování z důvodu selhávající služby na konkrétním endpointu.
- **Commit SHA:** ce85d7d

## Dodatečná oprava (2026-08-22): Ochrana proti systémovému HTTP 429 Rate Limitingu Nominatim
- **Diagnostika:**
  - Oprava detekce XML byla úspěšně nasazena do testovacího dry-runu v kontejneru PROD3.
  - Sice se vyřešilo padání na chybných parserech (`XML/HTML`), ale ihned po startu nového dry-runu narazil systém na `HTTP 429 Too Many Requests`.
  - Stávající kód obsahoval rychlý retry mechanismus, čímž vznikalo opakované agresivní dotazování do služby Nominatim i přes rate limity.
  - Skript běžel celou dobu izolovaně, `--apply` modifikátor nebyl spuštěn. Databáze nebyla nijak zasažena ani změněna.
- **Oprava:**
  - Implemenováno striktní dodržování rate-limitů Nominatim serveru pro geokódování (`HTTP 429`).
  - **Deduplikace/Cache:** Skript nyní agreguje totožné adresy do in-memory `geocodeCache`, a filtruje duplicitní query před odesláním requestu na server (výrazně snižuje počet payloadů zbytečně opakujících se v kontextu stejných městských sond).
  - **Zpracování hlavičky `Retry-After`:** Pokud je hlavička nalezena, skript vyčká adekvátní dobu, případně se spolehne na bezpečný 15sekundový backoff.
  - **Graceful Termination (Ochrana celku):** Kód nyní hlídá počet globálně navázaných 429 pádů (`MAX_GLOBAL_429 = 2`). Pokud skript prokazatelně narazí na tvrdý rate limit ze strany poskytovatele opakovaně, označí stav za `RATE_LIMITED` a kompletně zruší hlavní iterativní smyčku s okamžitým opuštěním skriptu (`process.exit(2)`). Minimalizuje se tím riziko systémového IP banu na straně aplikace.
- **Commit SHA:** b09f72a
