# NÁVRH OPTIMÁLNÍ ARCHITEKTURY SYNCHRONIZACE e-SBÍRKY / e-LEGISLATIVY
**Projekt:** dev3.tatovacesta.cz (dev3)  
**Dokument:** `docs/audit/ESBIRKA_SYNC_ARCHITECTURE_2026-08-17.md`  
**Datum:** 17. srpna 2026  
**Autor:** Hlavní architekt a bezpečnostní auditor projektu „Táta má právo“  
**Režim:** READ-ONLY ARCHITEKTONICKÝ NÁVRH (ÚKOL 2/10)

---

## 1. Executive Summary

Tento dokument představuje **přesnou cílovou architekturu a synchronizační strategii pro integraci REST API e-Sbírka / e-Legislativa Ministerstva vnitra ČR a Ministerstva spravedlnosti ČR** v projektu *dev3.tatovacesta.cz*.

Návrh striktně vychází ze zjištění technického auditu (`docs/audit/ESBIRKA_LEGISLATIVA_AUDIT_2026-08-17.md`) a řeší klíčový paradox:  
**Jak zajistit 100% aktuální, právně závazná a spolehlivá data opatrovnické legislativy pro tisíce návštěvníků a desítky funkcí (včetně AI generátoru podání a kalkulaček), aniž by byl překročen striktní přidělený limit autorizačního klíče:**
- **Max. 1 požadavek za sekundu**,
- **Max. 1 souběžné připojení (žádný paralelismus)**,
- **Nárazové využití cca 3× denně**,
- **Celkem pouze 3–5 volání za 24 hodin**,
- **Žádné provozní špičky**,
- **100% klientských čtení výhradně z lokální PostgreSQL databáze**.

### Klíčové principy návrhu:
1. **Zero-Client-API Leakage:** Klient (prohlížeč, mobil) nikdy nevysílá požadavek na vnější státní API. Všechna data se čtou z lokální PostgreSQL.
2. **Deterministic Token-Bucket & Persistent Lock:** Ochrana API kvóty s perzistencí v PostgreSQL zabrání překročení limitu i při pádu či restartu kontejneru.
3. **No-Dummy-Data Policy (Fail-Closed):** Zákaz zápisu offline/placeholder fallbacků při chybě API. Pokud API selže, transakce je zrušena a v DB zůstává poslední ověřený stav.
4. **Smart Incremental Change Detection via Content Hashing (SHA-256):** Zápis do DB a inkrementace verze nastává výhradně při detekované změně normativního textu.
5. **Persistent Multi-Level Audit Trail:** Kompletní logování každého pokusu o volání API, stavu odezvy, počtu přijatých změn a spotřebované kvóty.

---

## 2. Současný stav a identifikované problémy

| Oblast | Současný stav v kódu | Zjištěný problém / Riziko | Navržené cílové řešení | Počet API volání |
|---|---|---|---|---|
| **Rate Limiter & Quota** | In-memory pole `callTimestamps: number[]` v RAM Node.js | Při restartu kontejneru / redeployi se paměť vymaže, hrozí neúmyslné vyčerpání kvóty. | Perzistentní tabulka `EsbirkaQuotaAudit` v PostgreSQL s atomickým zámkem `pg_try_advisory_xact_lock`. | **0 dodatečných** (DB only) |
| **Chyba formátu / API** | `lawData = { nazev: 'Offline záloha', paragrafy: [...] }` ukládáno do DB | Do produkční PostgreSQL se zapsal falešný text při chybě 502/503. Porušení datové integrity. | Striktní **Fail-Closed**: validace JSON schématu, při chybě okamžitý `ROLLBACK` bez zápisu do DB. | **0** |
| **Sync Endpoint** | `POST /api/esbirka/sync` bez autentizace | Anonymní uživatel může odeslat 5 požadavků a vyčerpat denní kvótu (DoS). | Zabezpečení middlewarem `requireAdmin` (Role ADMIN / SUPERADMIN) + IP rate limiter. | **0** |
| **Plánovač synchronizace** | Cron v paměti (`0 3,11,19 * * *`) rotuje 2 předpisy | Rotace v proměnné `cronRotationIndex` se po restartu resetuje na index 0. | Deterministická fronta v DB s prioritním řazením podle data poslední úspěšné synchronizace (`lastSyncedAt ASC`). | **3 volání/den** |
| **Datový model** | `model Law { code, title, content (String) }` | `content` je nestrukturovaný JSON string bez verzování, hashů a data účinnosti. | Robustní model `model LegalAct` + `model LegalActSection` + `model LegalActVersion` + `model LegalSyncAudit`. | **0 dodatečných** |
| **Správa verzí** | Přepisuje existující záznam v tabulce `Law` | Ztráta historického znění před novelou (např. novela OZ 2025/2026). | Uchování verzí s platností `effectiveFrom` / `effectiveTo` a SHA-256 hashem. | **0 dodatečných** |

---

## 3. Analýza možností a limitů REST API e-Sbírka

Podle technické specifikace rozhraní e-Sbírka / e-Legislativa Ministerstva vnitra:
1. **Granularita odpovědi:** Endpoint `GET /predpisy/{rok}/{cislo}` vrací strukturovaný JSON obsahující metadata předpisu, datum platnosti, datum účinnosti, konsolidované znění a strom paragrafů s odstavci a písmeny.
2. **Dávkové stahování:** API **nepodporuje** stažení celé sbírky zákonů v jednom archivu skrze tento endpoint.
3. **Inkrementální zjišťování změn:** API nabízí metadata v hlavičkách (`ETag`, `Last-Modified`) nebo v kořenovém uzlu dokumentu (`datumZmeny`, `verze`).
4. **Strategie pro 3–5 volání denně:**
   - Nelze stahovat všechny české zákony.
   - **Musíme synchronizovat přesně definovanou množinu prioritních opatrovnických a rodinných předpisů.**
   - Celý katalog opatrovnické legislativy čítá **7 klíčových předpisů**. Při frekvenci 3 synchronizací denně se kompletní portfolio zkontroluje a zaktualizuje **jednou za 48–72 hodin**, což je pro legislativní proces (kde jsou legisvakanční lhůty v řádu týdnů až měsíců) naprosto dostačující a optimální.

---

## 4. Prioritní portfolio legislativy pro projekt „Táta má právo“

Na základě právní analýzy opatrovnických sporů a rodinného práva v ČR bylo sestaveno následující prioritní portfolio:

| Poř. | Číslo / Rok | Oficiální název | Klíčové oblasti a relevantní ustanovení | Priorita |
|:---:|:---:|---|---|:---:|
| **1.** | **89/2012 Sb.** | **Občanský zákoník (OZ)** | Rodičovská odpovědnost (§ 858 a násl.), Péče o dítě a formy péče (§ 888–§ 909), Styk s dítětem (§ 887 a násl.), Vyživovací povinnost a výživné (§ 910–§ 923), Změna poměrů (§ 907). | **P0 (Kritická)** |
| **2.** | **359/1999 Sb.** | **Zákon o sociálně-právní ochraně dětí (zOSPOD)** | Výkon funkce kolizního opatrovníka (§ 19), Vyhodnocování situace dítěte a IPOD (§ 10), Opatření na ochranu dětí (§ 14), Práva rodičů při kontaktu s OSPOD (§ 9a). | **P0 (Kritická)** |
| **3.** | **292/2013 Sb.** | **Zákon o zvláštních řízeních soudních (ZVR)** | Řízení ve věcech péče soudu o nezletilé (§ 452–§ 513), Předběžná opatření ve věcech péče o děti (§ 452 a násl.), Výkon rozhodnutí o péči a styku (§ 492–§ 507, odnětí dítěte, ukládání pokut). | **P0 (Kritická)** |
| **4.** | **99/1963 Sb.** | **Občanský soudní řád (OSŘ)** | Obecná pravidla dokazování (§ 120–§ 136), Zjišťování příjmů a majetku rodičů (§ 130), Náklady řízení (§ 140 a násl.), Odvolací řízení (§ 201 a násl.). | **P1 (Vysoká)** |
| **5.** | **120/2001 Sb.** | **Exekuční řád** | Vymáhání dlužného a běžného výživného, Exekuce srážkami ze mzdy / přikázáním pohledávky, Pozastavení řidičského oprávnění pro neplnění vyživovací povinnosti (§ 71a). | **P1 (Vysoká)** |
| **6.** | **85/1996 Sb.** | **Zákon o advokacii** | Práva a povinnosti advokátů, Bezplatná právní pomoc a určení advokáta ČAK (§ 18 a násl.). | **P2 (Střední)** |
| **7.** | **2/1993 Sb.** | **Listina základních práv a svobod (LZPS)** | Čl. 32 (Právo na rodinný život, péče o děti a jejich výchova je právem obou rodičů), Čl. 36 (Právo na spravedlivý proces a soudní ochranu). | **P2 (Střední)** |

---

## 5. Návrh databázového modelu (Prisma / PostgreSQL)

Pro zajištění verzování, auditability a integrity nahradíme stávající minimalistický model `Law` komplexním systémem 4 provázaných modelů:

```prisma
// ============================================================================
// 1. ZÁKLADNÍ ENTITA PRÁVNÍHO PŘEDPISU (LegalAct)
// ============================================================================
model LegalAct {
  id               String            @id @default(uuid())
  code             String            @unique // Např. "89/2012", "359/1999"
  actNumber        Int               // 89
  actYear          Int               // 2012
  collection       String            @default("Sb.") // "Sb.", "Sb.m.s."
  title            String            // "Zákon č. 89/2012 Sb., občanský zákoník"
  shortTitle       String?           // "Občanský zákoník" / "OZ"
  category         String            // "FAMILY_LAW", "CHILD_PROTECTION", "CIVIL_PROCEDURE"
  status           LegalActStatus    @default(ACTIVE) // ACTIVE, AMENDED, REPEALED
  
  // Časová razítka a účinnost
  effectiveFrom    DateTime?         // Datum nabytí účinnosti aktuálního znění
  effectiveTo      DateTime?         // Datum konce účinnosti (pokud známo)
  promulgationDate DateTime?         // Datum vyhlášení ve Sbírce
  
  // Synchronizační a ověřovací metadata
  lastSyncedAt     DateTime?         // Datum a čas posledního kontaktu s e-Sbírka API
  lastVerifiedAt   DateTime?         // Datum a čas, kdy byl obsah ověřen jako platný
  contentHash      String            // SHA-256 hash konsolidovaného normativního textu
  etag             String?           // ETag hlavička z HTTP odezvy pro If-None-Match
  syncPriority     Int               @default(10) // 1 = nejvyšší (P0), 10 = standard
  
  // Vazby
  sections         LegalActSection[]
  versions         LegalActVersion[]
  syncAudits       LegalSyncAudit[]

  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([code])
  @@index([category])
  @@index([lastSyncedAt])
  @@index([syncPriority])
}

// ============================================================================
// 2. STRUKTUROVANÁ USTANOVENÍ A PARAGRAFY (LegalActSection)
// ============================================================================
model LegalActSection {
  id               String       @id @default(uuid())
  legalActId       String
  legalAct         LegalAct     @relation(fields: [legalActId], references: [id], onDelete: Cascade)
  
  sectionNumber    String       // "888", "888a", "19"
  sectionOrder     Int          // Pořadí pro řazení (88800)
  title            String?      // Např. "Rodičovská odpovědnost a styk s dítětem"
  content          String       @db.Text // Úplné znění paragrafu včetně odstavců
  
  // Opatrovnická metadata
  isKeySection     Boolean      @default(false) // Označení klíčových paragrafů pro otce
  practicalNote    String?      @db.Text // Praktický výklad a metodický komentář
  courtRelevance   String?      @db.Text // Jak argumentovat u soudu / na OSPOD
  
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  @@unique([legalActId, sectionNumber])
  @@index([legalActId])
  @@index([isKeySection])
}

// ============================================================================
// 3. ARCHIV HISTORICKÝCH VERZÍ PRO NOVELIZACE (LegalActVersion)
// ============================================================================
model LegalActVersion {
  id               String       @id @default(uuid())
  legalActId       String
  legalAct         LegalAct     @relation(fields: [legalActId], references: [id], onDelete: Cascade)
  
  versionNumber    String       // Identifikátor novely (např. "novela-450/2025")
  effectiveFrom    DateTime     // Účinnost této verze od
  effectiveTo      DateTime?    // Účinnost této verze do (null = aktuální)
  contentSnapshot  Json         // Úplný JSON snapshot znění k danému období
  contentHash      String       // SHA-256 hash dané verze
  changeSummary    String?      @db.Text // Přehled změn přinesených novelou
  
  createdAt        DateTime     @default(now())

  @@index([legalActId])
  @@index([effectiveFrom])
}

// ============================================================================
// 4. PERZISTENTNÍ AUDIT LOG SYNCHRONIZACE (LegalSyncAudit)
// ============================================================================
model LegalSyncAudit {
  id               String          @id @default(uuid())
  legalActId       String?
  legalAct         LegalAct?       @relation(fields: [legalActId], references: [id], onDelete: SetNull)
  
  actCode          String          // "89/2012"
  startedAt        DateTime        @default(now())
  finishedAt       DateTime?
  durationMs       Int?
  
  status           SyncAuditStatus // SUCCESS, UNCHANGED, FAILED, QUOTA_EXCEEDED, RATE_LIMITED
  httpStatus       Int?            // 200, 304, 429, 500, 503
  initiatedBy      String          // "CRON_SCHEDULE", "ADMIN_MANUAL", "SYSTEM_BOOTSTRAP"
  
  // Datová statistika
  responseHash     String?         // SHA-256 příchozího payloadu
  sectionsReceived Int             @default(0)
  sectionsUpdated  Int             @default(0)
  errorMessage     String?         @db.Text
  quotaUsedIn24h   Int             // Kolikáté volání v klouzavém okně to bylo (1..5)
  
  createdAt        DateTime        @default(now())

  @@index([actCode])
  @@index([status])
  @@index([startedAt])
}

// ============================================================================
// 5. PERZISTENTNÍ KVÓTOVÝ HLÍDAČ (EsbirkaQuotaAudit)
// ============================================================================
model EsbirkaQuotaAudit {
  id               String       @id @default(uuid())
  calledAt         DateTime     @default(now()) // Čas odeslání HTTP požadavku na e-Sbírku
  actCode          String       // "89/2012"
  httpStatus       Int          // 200, 304, 500...
  initiatedBy      String       // "CRON" / "ADMIN"

  @@index([calledAt])
}

enum LegalActStatus {
  ACTIVE
  AMENDED
  REPEALED
}

enum SyncAuditStatus {
  SUCCESS
  UNCHANGED
  FAILED
  QUOTA_EXCEEDED
  RATE_LIMITED
}
```

---

## 6. Detailní návrh synchronizačního procesu (Pipeline)

Synchronizační proces funguje na principu **přísné validační brány**:

```
[ TRIGGER: Cron (03:00 / 11:00 / 19:00 UTC) nebo Admin ]
                           │
                           ▼
  1. KONTROLA KVÓTY V POSTGRESQL (EsbirkaQuotaAudit count za posledních 24h < 5)
     └─ Pokud >= 5 ➔ ZÁKAZ VOLÁNÍ, Audit Status: QUOTA_EXCEEDED, Konec.
                           │
                           ▼
  2. ACQUIRE ATOMIC LOCK (Zabránění souběhu pomocí pg_advisory_xact_lock)
                           │
                           ▼
  3. RATE LIMIT DELAY (Vynucení prodlevy min. 1 500 ms od posledního požadavku)
                           │
                           ▼
  4. ODESLÁNÍ HTTP POŽADAVKU S ETAG / IF-NONE-MATCH
     └─ Header: Accept: application/json, Authorization: Bearer [REDACTED_API_KEY]
                           │
                           ▼
  5. VYHODNOCENÍ HTTP ODPOVĚDI:
     ├─ [HTTP 304 Not Modified]:
     │    ➔ Žádná změna na straně e-Sbírky.
     │    ➔ Update `lastVerifiedAt = now()`.
     │    ➔ Audit Status: UNCHANGED. Konec.
     │
     ├─ [HTTP != 200 nebo Content-Type != application/json]:
     │    ➔ CHYBA API (např. 500, 502, 503 nebo HTML response).
     │    ➔ STRICT FAIL-CLOSED: Žádný zápis do `LegalAct` ani `LegalActSection`!
     │    ➔ Stávající data v DB zůstávají nedotčena.
     │    ➔ Audit Status: FAILED + záznam chyby. Konec.
     │
     └─ [HTTP 200 OK & validní JSON]:
                           │
                           ▼
  6. SCHÉMA VALIDACE & NORMALIZACE PAYLOADU (Zod / TypeScript Validator)
     └─ Kontrola přítomnosti polí: číslo, rok, název, paragrafy[]
                           │
                           ▼
  7. VÝPOČET SHA-256 KONTROLNÍHO HASHU NORM текста
                           │
                           ▼
  8. POROVNÁNÍ S EXISTUJÍCÍM HASH v PostgreSQL (`LegalAct.contentHash`):
     ├─ [Hash se SHODUJE]:
     │    ➔ Text zákona se nezměnil.
     │    ➔ Update `lastVerifiedAt = now()`, `lastSyncedAt = now()`.
     │    ➔ Audit Status: UNCHANGED.
     │
     └─ [Hash je ROZDÍLNÝ (Detekována novela / legislativní změna!)]:
          ➔ ATOMICKÁ TRANSAKCE ($transaction):
             a) Archivace stávajícího znění do `LegalActVersion` (snapshot).
             b) Aktualizace hlavního záznamu `LegalAct` (nový hash, datum účinnosti, etag).
             c) Upsert jednotlivých paragrafů do `LegalActSection`.
             d) Zápis do `LegalSyncAudit` (Status: SUCCESS, sectionsUpdated: N).
             e) Zápis do `EsbirkaQuotaAudit` (čas volání).
                           │
                           ▼
  9. UVOLNĚNÍ ZÁMKU & NOTIFIKACE ADMINA (V případě detekce novelizace)
```

---

## 7. Řešení specifických provozních a chybových scénářů

### A) První naplnění databáze (Bootstrap)
- **Problém:** V databázi je 7 zákonů, ale denní limit je 5 volání.
- **Řešení:** 
  1. *Fáze 1 (Den 1, 03:00, 11:00, 19:00):* Stažení prvních 3 kritických předpisů (OZ 89/2012, zOSPOD 359/1999, ZVR 292/2013).
  2. *Fáze 2 (Den 2, 03:00, 11:00):* Stažení dalších 2 předpisů (OSŘ 99/1963, Exekuční řád 120/2001).
  3. *Fáze 3 (Den 2, 19:00 + Den 3):* Stažení zbývajících předpisů (Zákon o advokacii 85/1996, LZPS 2/1993).
  4. Všechny předpisy jsou nahrány **do 48 hodin bez překročení jediného limitu**.

### B) Běžný denní provoz
- Plánovač Cron spouští běh 3× denně (03:00, 11:00, 19:00 UTC).
- V každém běhu vybere **přesně 1 předpis s nejstarším `lastSyncedAt`** (`ORDER BY syncPriority ASC, lastSyncedAt ASC NULLS FIRST LIMIT 1`).
- Každé volání spotřebuje 1 API kredit. Denní spotřeba: **přesně 3 volání**. Zbývá rezerva 2 volání pro mimořádný ruční zásah administrátora.

### C) Detekce změny předpisu (Novela)
- Při zjištění nového hashe se stávající stav atomicky odloží do `LegalActVersion`.
- Na portálu `/state-laws` i v AI generátoru podání se okamžitě projeví nové znění bez nutnosti restartu serveru či zásahu vývojáře.
- Systém vygeneruje interní upozornění pro administrátora o novelizaci předpisu.

### D) Výpadek API nebo nevalidní odpověď (500 / 502 / 503 / Timeout / HTML)
- **Striktní pravidlo:** **ŽÁDNÝ ZÁPIS DO DB.**
- Žádný „offline fallback“ string, žádný „dummy zákon“.
- Operace zaloguje chybu do `LegalSyncAudit` se stavem `FAILED`.
- Uživatelé portálu nadále čtou **poslední platná ověřená data z PostgreSQL**, která zůstala nedotčena.

### E) Restart aplikace / kontejneru
- Stav spotřeby kvóty je dotazován přímo z PostgreSQL (`SELECT COUNT(*) FROM "EsbirkaQuotaAudit" WHERE "calledAt" > NOW() - INTERVAL '24 HOURS'`).
- Restart kontejneru **nezpůsobí reset čítače**, čímž je vyloučeno riziko přetížení API.

### F) Pokus o překročení kvóty (ruční nebo automatický)
- Pokud `EsbirkaQuotaAudit` vrátí >= 5 záznamů za 24 hodin, pokus o synchronizaci je **odmítnut ještě před sestavením HTTP požadavku**.
- Vyvolána kontrolovaná výjimka `DailyQuotaExceededException`.

---

## 8. Odstranění stávajícího in-memory fallbacku v `EsbirkaService.ts`

V současném souboru `src/services/EsbirkaService.ts` se nachází problematický kód (řádky 129–137 a 165–181), který při chybě API generuje umělá data a při výpadku Prisma zapisuje do `dbStore.laws`.

### Přesný plán refaktoringu pro Fázi 3:
1. **Odstranit větev vytvářející fiktivní JSON:**
   ```typescript
   // ❌ STÁVAJÍCÍ NEBEZPEČNÝ KÓD (BUDE ZCELA ODSTRANĚN):
   lawData = {
     nazev: `Zákon č. ${code} (Offline záloha)`,
     paragrafy: [{ paragraf: 1, text: "API e-Sbírka je momentálně nedostupné..." }]
   };
   ```
2. **Nahradit striktním vyhozením výjimky (Fail-Closed):**
   ```typescript
   //  CÍLOVÝ BEZPEČNÝ KÓD:
   if (!contentType.includes('application/json')) {
     throw new Error(`[e-Sbírka Sync] API vrátilo neplatný formát obsahu: ${contentType}. Zápis byl zrušen pro zachování integrity dat.`);
   }
   ```
3. **Zrušit zápis do `dbStore.laws` jako náhražky databáze při selhání DB transakce.**
4. **Všechny klientské metody (`getLawsFromDb`, `getLawByCodeFromDb`) budou číst primárně z PostgreSQL modelu `LegalAct`.**

---

## 9. Zabezpečení API klíče a řízení přístupu (Security & RBAC)

1. **Uložení tajemství:** `ESBIRKA_API_KEY` je definován výhradně jako systémová proměnná prostředí na serveru.
2. **Ochrana před únikem do frontendu:**
   - Žádná proměnná nesmí mít prefix `VITE_`.
   - V žádném API endpointu ani logovacím výpisu (`console.log`) se nesmí tisknout hodnota klíče ani `Authorization` hlavička.
3. **Ochrana synchronizačních endpointů:**
   - `POST /api/esbirka/sync` bude podléhat striktnímu ověření `requireAdmin`.
   - Běžní uživatelé a anonymní návštěvníci mají přístup pouze ke čtecím `GET` endpointům (`/api/state/laws`, `/api/state/laws/:code`, `/api/esbirka/verify`), které přistupují výhradně k lokální PostgreSQL.

---

## 10. Přehled změn pro implementační Fázi (ÚKOL 3/10)

Následující seznam vymezuje soubory, které budou v další fázi upraveny, a soubory, na které se nesmí sahat:

### Soubory určené ke změně v Fázi 3:
1. `prisma/schema.prisma` — Přidání modelů `LegalAct`, `LegalActSection`, `LegalActVersion`, `LegalSyncAudit`, `EsbirkaQuotaAudit` a migrace.
2. `src/services/EsbirkaService.ts` — Kompletní implementace robustního rate-limiteru, DB perzistence kvóty, SHA-256 detekce změn, odstranění dummy fallbacků.
3. `server.ts` — Přidání zabezpečení `requireAdmin` pro `POST /api/esbirka/sync`, aktualizace čtecích endpointů na nový model.
4. `src/components/public/StateLawsView.tsx` — Přizpůsobení strukturovanému zobrazení paragrafů a praktických výkladů.
5. `src/components/public/ai/AiFormsView.tsx` — Navázání ověřovací doložky na `lastVerifiedAt` z nového modelu `LegalAct`.

### Seznam prvků, které ZATÍM NESMÍ BÝT ZMĚNĚNY (Read-Only Guard):
- Žádné změny v produkční PostgreSQL databázi v této fázi.
- Žádné zásahy do běžících kontejnerů a ostrého API klíče.
- Žádná volání živého API e-Sbírka.

---
*Architektonický návrh vypracoval Hlavní architekt a bezpečnostní auditor projektu dev3.tatovacesta.cz dne 17. 8. 2026.*
