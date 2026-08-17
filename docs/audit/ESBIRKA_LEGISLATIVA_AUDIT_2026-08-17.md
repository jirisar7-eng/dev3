# TECHNICKÝ A BEZPEČNOSTNÍ AUDIT INTEGRACE e-Sbírka / e-Legislativa
**Projekt:** dev3.tatovacesta.cz (dev3)  
**Datum auditu:** 17. srpna 2026  
**Role:** Hlavní architekt & Bezpečnostní auditor projektu „Táta má právo“  
**Režim:** READ-ONLY kompletní technický audit  
**Stav:** DOKONČENO (BEZ ZMĚN VE ZDROJOVÉM KÓDU A DATABÁZI)

---

## Manažerské shrnutí (Executive Summary)

Tento audit představuje ucelený, do hloubky jdoucí přezkum současného stavu integrace státních legislativních a justičních datových zdrojů v projektu **dev3.tatovacesta.cz**. Audit se zaměřil na:
1. **e-Sbírku a e-Legislativu Ministerstva vnitra a Ministerstva spravedlnosti ČR**,
2. Dodržování striktních podmínek schváleného API přístupu (**max. 1 požadavek/s**, **3–5 volání/den**),
3. Architekturu lokálního ukládání (PostgreSQL/Prisma vs. in-memory store) a oddělení klientského provozu od externích API,
4. Bezpečnost autentizace, ochranu API klíčů a odolnost vůči vyčerpání kvót (Denial of Service),
5. Datovou integritu (analýza rizika zápisu fallback/dummy dat do databáze),
6. Navazující moduly státních dat: **Judikatura ÚS/NS**, **Případová databáze rozsudků**, **Statistiky opatrovnické praxe**, **Ke stažení** a **AI Generátor formulářů**.

---

## 1. Mapování repozitáře a dotčených komponent

V repozitáři byly identifikovány následující klíčové komponenty tvořící legislativní subsystém:

| Soubor / Komponenta | Typ | Účel a funkce |
|---|---|---|
| `src/services/EsbirkaService.ts` | Backend Služba | Jádro integrace s e-Sbírkou, řízení HTTP komunikace, rate limiting, denní kvóta, cron plánovač, DB čtení/zápis. |
| `server.ts` (řádky 257–408) | REST API Router | Expozice koncových bodů `/api/esbirka/*`, `/api/state/laws/*`, `/api/state/statistics`, `/api/state/cases`. |
| `prisma/schema.prisma` (řádky 627–667) | Datový model | Definice tabulek `Law`, `StateStatistic`, `CourtCase`. |
| `src/services/seedService.ts` (řádky 1118–1280) | DB Seeder | Inicializace výchozích statistických dat a precedenčních nálezů Ústavního a Nejvyššího soudu. |
| `src/services/dbStore.ts` | Fallback Store | In-memory záloha pro prostředí bez aktivního PostgreSQL/Prisma připojení. |
| `src/components/public/StateLawsView.tsx` | Frontend View | Veřejná stránka `/state-laws` (aliasy `/e-sbirka`, `/zakony`, `/e-legislativa`) s vyhledáváním v paragrafech a praktickým výkladem. |
| `src/components/public/StateStatisticsView.tsx` | Frontend View | Veřejná stránka `/state-statistics` (`/statistiky`) vizualizující délky řízení, formy péče a výživné. |
| `src/components/public/ai/AiFormsView.tsx` | Frontend AI Hub | Generátor 6 typů soudních podání se začleněnou ověřovací doložkou e-Sbírky. |
| `src/components/public/PublicPortal.tsx` | Frontend Router | Směrování URL slugů na příslušné legislativní a justiční komponenty. |
| `.env.example` | Konfigurace | Deklarace proměnných `ESBIRKA_API_KEY` a `ESBIRKA_BASE_URL`. |

---

## 2. Architektura a tok dat (Data Flow)

Systém uplatňuje striktní **architekturu asynchronní synchronizace do lokální databáze (Cache-First / DB-Only Client Pattern)**:

```
[ e-Sbírka REST API (MV ČR) ]
           │
           ▼ (1 req/1.2s, max 5x/24h)
[ EsbirkaService (Rate Limiter & Quota Guard) ] ── (Řízeno Cronem: 03:00, 11:00, 19:00 UTC)
           │
           ▼
[ PostgreSQL / Prisma DB (`model Law`) ] ◄─── (Fallback: in-memory `dbStore.laws`)
           │
           ├─────────────────────────────────────────┐
           ▼                                         ▼
[ GET /api/state/laws ]                   [ GET /api/esbirka/verify ]
           │                                         │
           ▼                                         ▼
[ StateLawsView (/state-laws) ]           [ AiFormsView (/ai-formulare) ]
(100% obslouženo z lokální DB,             (Zobrazuje ověřovací doložku,
 0 HTTP dotazů na externí API)             0 dotazů na externí API)
```

### Zásadní architektonické zjištění:
- **Žádný návštěvník webu ani registrovaný uživatel nevyvolává přímý HTTP požadavek na e-Sbírku.**
- Veškeré klientské GET endpointy (`/api/state/laws`, `/api/state/laws/:code`, `/api/esbirka`, `/api/esbirka/verify`) čtou výhradně lokální data uložená v databázi PostgreSQL (nebo v `dbStore`).
- Tím je splněn základní bezpečnostní a výkonnostní požadavek pro ochranu státní infrastruktury.

---

## 3. Audit dodržování limitů API (Rate Limiting & Daily Quotas)

Schválené podmínky přístupu:
1. **Maximální frekvence:** 1 požadavek za sekundu.
2. **Denní limit:** 3 až 5 volání za den.

### Analýza implementace v `EsbirkaService.ts`:

#### A. Ochrana frekvence (Rate Limiting)
- V `EsbirkaService.ts` je definována konstanta `MIN_DELAY_MS = 1200` (1,2 sekundy).
- Před každým odesláním HTTP požadavku se kontroluje interval:
  ```typescript
  const timeSinceLastCall = now - this.lastRequestTimestamp;
  if (timeSinceLastCall < this.MIN_DELAY_MS) {
    const waitTime = this.MIN_DELAY_MS - timeSinceLastCall;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  ```
- **Souběžnost:** Všechna volání jsou řazena do jediné sekvenční fronty (`this.requestQueue = this.requestQueue.then(...)`), což vylučuje paralelní souběh dvou a více dotazů.
- **Verdikt:** **SPLNĚNO A PŘEKRAČUJE POŽADAVEK** (interval 1200 ms zaručuje max. 0,83 req/s, což je bezpečně pod limitem 1 req/s).

#### B. Denní kvóta (Daily Quota)
- Implementováno klouzavé 24hodinové okno `callTimestamps`:
  ```typescript
  private static MAX_DAILY_CALLS = 5;
  private static checkAndCleanDailyQuota(): number {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    this.callTimestamps = this.callTimestamps.filter((t) => t > twentyFourHoursAgo);
    return this.callTimestamps.length;
  }
  ```
- Pokud `usedToday >= 5`, služba okamžitě vyhodí výjimku `Aktivní denní limit API e-Sbírka (5/5) doručen.` a žádný HTTP požadavek neodešle.
- **Verdikt:** **SPLNĚNO**.

#### C. Automatický plánovač (Cron Scheduler)
- V `EsbirkaService.initCronScheduler()` je nastaven výraz `0 3,11,19 * * *`:
  - Běh probíhá přesně 3× denně (v 03:00, 11:00 a 19:00 UTC).
  - V každém běhu se rotuje **přesně 1 předpis** ze seznamu prioritních zákonů:
    1. Zákon č. 89/2012 Sb., občanský zákoník
    2. Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (zOSPOD)
  - Celkový počet automatických volání za 24 hodin činí **přesně 3 volání**.
- **Verdikt:** **SPLNĚNO** (odpovídá přesně schválenému rozsahu 3–5 volání/den).

---

## 4. Bezpečnostní audit a analýza rizik (Security & Vulnerability Analysis)

Při detailní statické a logické analýze kódu byla identifikována následující bezpečnostní a architektonická zjištění:

### Zjištění 1 (Vysoká priorita - P1): Nekrytý administrátorský endpoint `/api/esbirka/sync`
- **Umístění:** `server.ts`, řádky 309–320.
- **Problém:** Endpoint `POST /api/esbirka/sync` přijímá parametry `{ cislo, rok }` a volá `EsbirkaService.syncLaw()`. Tento endpoint v současné době **nemá aplikovaný autentizační middleware** (např. `requireAdmin` nebo `requireAuth`).
- **Důsledek:** Anonymní útočník by mohl odesláním 5 rychlých POST požadavků záměrně vyčerpat denní kvótu (Denial of Service na denní synchronizaci). Rate limiter sice zabrání přetížení API e-Sbírky, ale kvóta pro daný den by byla spotřebována.
- **Doporučení pro Fázi 2:** Obalit endpoint middlewarem `requireAdmin` a zavést přísný rate limiter na úrovni Express routy.

### Zjištění 2 (Vysoká priorita - P1): Riziko zápisu offline/dummy fallback dat do databáze
- **Umístění:** `src/services/EsbirkaService.ts`, řádky 129–137.
- **Kód:**
  ```typescript
  if (contentType.includes('application/json')) {
    lawData = await response.json();
  } else {
    console.warn(`[e-Sbírka Sync] API pro ${code} vrátilo neplatný formát (${contentType}). Používám offline záložní data.`);
    lawData = {
      nazev: `Zákon č. ${code} (Offline záloha)`,
      paragrafy: [
        { paragraf: 1, text: "API e-Sbírka je momentálně nedostupné. Toto je dočasná offline kopie." }
      ]
    };
  }
  ```
- **Problém:** Pokud e-Sbírka API vrátí ne-JSON odpověď (např. HTML chybovou stránku 502/503), kód vytvoří umělý objekt `Offline záloha` a následně ho **uloží do PostgreSQL tabulky `Law` přes `prisma.law.upsert`**.
- **Důsledek:** Do produkční databáze by se zapsal falešný/neúplný záznam, což odporuje zásadě *DATA INTEGRITY: ŽÁDNÝ DUMMY/FALLBACK ZÁPIS*.
- **Doporučení pro Fázi 2:** Pokud odpověď není validní JSON nebo API selže, operace musí **okamžitě vyhodit chybu bez zápisu do DB**, přičemž stávající platný záznam v DB zůstane netknutý.

### Zjištění 3 (Střední priorita - P2): Volatilita počítadla kvót při restartu kontejneru
- **Umístění:** `src/services/EsbirkaService.ts`, řádek 22.
- **Problém:** `callTimestamps` je udržováno pouze v paměti Node.js procesu (`private static callTimestamps: number[] = []`).
- **Důsledek:** V případě častých restartů kontejneru v Cloud Run / Dockeru by se počítadlo mohlo vynulovat dříve než po 24 hodinách. Vzhledem k tomu, že cron běží pouze 3× denně v pevných časech (03:00, 11:00, 19:00), je riziko v praxi nízké, nicméně pro absolutní garanci je vhodné persistovat časy volání v DB.
- **Doporučení pro Fázi 2:** Ukládat časová razítka volání do DB tabulky (např. `SystemQuotaAudit`) nebo perzistentního souboru.

### Zjištění 4 (Nízká priorita - P3): Struktura datového modelu `Law`
- **Umístění:** `prisma/schema.prisma`, řádky 627–636.
- **Aktuální schéma:**
  ```prisma
  model Law {
    id        String   @id @default(uuid())
    code      String   @unique
    title     String
    content   String   // Ukládá stringifikovaný JSON paragrafů
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([code])
  }
  ```
- **Analýza:** Pole `content` je typu `String` (nikoliv dedikované tabulky pro jednotlivé paragrafy `LawSection`). Pro základní textové zobrazení a fulltextové vyhledávání je toto řešení funkční a flexibilní, avšak pro pokročilé filtrování podle odstavců/písmen je v budoucnu výhodnější JSONB nebo relační struktura.

---

## 5. Audit souvisejících modulů státních dat

### A. Judikatura Ústavního a Nejvyššího soudu (`/judikatura`, `model CourtCase`)
- **Stav v DB:** Tabulka `CourtCase` má definovaný model se všemi náležitostmi (`fileNumber`, `court`, `legalRatio`, `tags`, `fullTextUrl`, `publishedAt`).
- **Seeder:** V `seedService.ts` je naseedováno 5 klíčových judikátů (I. ÚS 1506/23, II. ÚS 3242/22, III. ÚS 1200/21, 21 Cdo 1890/2022, I. ÚS 2482/24).
- **API:** Endpoints `/api/state/cases` a `/api/state/court-cases` vracejí data z PostgreSQL / `dbStore`.
- **Frontend:** Slug `/judikatura` je v `PublicPortal.tsx` směrován na CMS Page Renderer, kde je připraven obsahový rámec.

### B. Případová databáze rozsudků (`/pripadova-databaze`)
- **Stav v DB:** Využívá data z `CourtCase` a `stateStatistics`.
- **Frontend:** Registrována v `PageService.ts` a `dbStore.ts` pod kategorií „Státní data“.

### C. Statistiky opatrovnické praxe (`/state-statistics`, `model StateStatistic`)
- **Stav v DB:** Plně funkční model `StateStatistic` s poli pro vizualizaci časových řad (`chartData`).
- **Seeder:** Naseedovány reálné statistické indikátory (podíly střídavé péče 34 %, výhradní péče 58 %, délky řízení 215 dní, předběžná opatření 7 dní, výživné dle věkových skupin).
- **Frontend:** Komponenta `StateStatisticsView.tsx` obsahuje plně interaktivní grafické znázornění rozpadu péče, lhůt a výživného.

### D. Vzory a dokumenty ke stažení (`/ke-stazeni`)
- **Stav:** Integrováno v rámci právního a compliance hubu `LegalDocsPage` a CMS rendereru.

### E. AI Generátor formulářů (`/ai-formulare`, `AiFormsView.tsx`)
- **Stav:** Nabízí 6 ověřených vzorů podání. Při načtení stránky se dotazuje na `/api/esbirka`, odkud přebírá autoritativní časové razítko a generuje zákonnou ověřovací doložku:
  `Právní citace ověřeny vůči e-Sbírce k [DD. MM. RRRR]`.

---

## 6. Souhrnná tabulka souladu s pravidly (Compliance Matrix)

| Požadavek / Pravidlo | Stav | Poznámka k auditu |
|---|---|---|
| Max. 1 požadavek / sekundu | **PROŠLO (100 %)** | Vynuceno 1200ms zpožděním a sekvenční frontou Promise. |
| Max. 3–5 volání / 24 hodin | **PROŠLO (100 %)** | Vynuceno klouzavým oknem (max 5) a cronem (3x denně). |
| Žádné volání z klientského UI | **PROŠLO (100 %)** | Všechny uživatelské endpointy čtou výhradně lokální DB. |
| Ochrana API klíče | **PROŠLO (100 %)** | `ESBIRKA_API_KEY` je pouze na backendu, neproniká do frontendu. |
| Žádný zápis dummy dat při chybě | **VAROVÁNÍ (P1)** | Zjištěn zápis offline placeholderu při ne-JSON odpovědi (ř. 130). |
| Autentizace sync endpointu | **VAROVÁNÍ (P1)** | `/api/esbirka/sync` postrádá `requireAdmin`. |
| Read-only integrita auditu | **PROŠLO (100 %)** | Během auditu nebyly provedeny žádné změny kódu ani DB. |

---

## 7. Doporučení pro další fázi (Action Plan pro Fázi 2)

Pro plánovanou implementační fázi (až bude zadán pokyn k úpravám) doporučujeme realizovat tyto 3 přesně cílené kroky:

1. **Zabezpečení sync endpointu:** Přidat `requireAdmin` middleware k `POST /api/esbirka/sync` v `server.ts`.
2. **Odstranění dummy DB zápisu:** V `EsbirkaService.ts` nahradit větev `Offline záloha` přímým vyhozením chyby (fail-safe), aby v databázi zůstávala výhradně autentická data přímo z API e-Sbírky.
3. **Perzistentní audit log volání:** Vytvořit lehkou tabulku `EsbirkaApiLog` v Prisma pro trvalý záznam HTTP volání a ochranu kvóty napříč restarty kontejneru.

---
*Audit vyhotovil Hlavní architekt & Bezpečnostní auditor projektu dev3.tatovacesta.cz dne 17. 8. 2026.*
