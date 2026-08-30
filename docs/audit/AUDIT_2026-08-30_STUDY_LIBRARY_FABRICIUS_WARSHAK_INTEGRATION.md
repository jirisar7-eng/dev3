# AUDIT: Implementace vědeckých publikací Fabricius & Suh (2017) a Warshak (2018) do Knihovny studií

**Datum a čas:** 2026-08-30 19:38 UTC  
**Název úlohy:** KNIHOVNA VĚDECKÝCH STUDIÍ – FABRICIUS/SUH 2017 + WARSHAK 2018  
**Režim:** IMPLEMENTACE + AUDIT  

---

## 1. Původní požadavek / Cíl
- Doplnit do existujícího mechanismu Knihovny vědeckých studií (`Study`) dvě skutečné vědecké publikace jako dva samostatné a bibliograficky přesné záznamy:
  1. **William V. Fabricius & Go Woon Suh (2017)** – *Should Infants and Toddlers Have Frequent Overnight Parenting Time With Fathers? The Policy Debate and New Data*, DOI: `10.1037/law0000108`
  2. **Richard A. Warshak (2018)** – *Night Shifts: Revisiting Blanket Restrictions on Children’s Overnights With Separated Parents*, DOI: `10.1080/10502556.2018.1454193`
- Opravit původní záznam v `dbStore.ts`, který bibliograficky nesprávně sdružoval autory Fabricius, Suh a Warshak do jednoho záznamu.
- Zachovat stávající architekturu (`StudyService`, `dbStore.ts`, `prisma/seed.ts`, endpointy `/api/cms/studies`), nevytvářet duplicity ani neautorizované aliasy.

---

## 2. Provedené změny
1. **`src/services/dbStore.ts`**:
   - Upraven záznam `study-fabricius-suh-2017` se slugem `fabricius-suh-2017-prespavani-kojencu-batolat-otcove`, přesnými autory *William V. Fabricius, Go Woon Suh*, rokem 2017, DOI `10.1037/law0000108`, statusem `PUBLISHED` a `featured: true`.
   - Přidán samostatný záznam `study-warshak-2018` se slugem `warshak-2018-nocni-pece-prespavani-deti-odmitnuti-pausalnich-omezeni`, autorem *Richard A. Warshak*, rokem 2018, DOI `10.1080/10502556.2018.1454193`, statusem `PUBLISHED` a `featured: true`.
2. **`prisma/seed.ts`**:
   - Doplněn krok seedování vědeckých studií do PostgreSQL databáze pomocí `prisma.study.upsert({ where: { slug: study.slug }, ... })` pro zajištění idempotence v produkčních prostředích s PostgreSQL.
3. **Testovací sada**:
   - `tests/study-library-publications.test.ts`: Ověření počtu publikovaných studií (2), integrity metadat pro obě publikace, unikátnosti slugů a DOI a fulltextového vyhledávání.
   - `tests/cms-studies-api.test.ts`: Ověření API endpointu `/api/cms/studies?status=PUBLISHED` a detailu `/api/cms/studies/slug/:slug`.

---

## 3. Dotčené soubory
- `src/services/dbStore.ts`
- `prisma/seed.ts`
- `tests/study-library-publications.test.ts`
- `tests/cms-studies-api.test.ts`
- `docs/audit/AUDIT_2026-08-30_STUDY_LIBRARY_FABRICIUS_WARSHAK_INTEGRATION.md`

---

## 4. Výsledky testů a verifikace
- `npx prisma validate`: **PASS** (Schema is valid 🚀)
- `npx tsc --noEmit --pretty false`: **PASS** (0 chyb)
- `npx tsx --test tests/study-library-publications.test.ts`: **PASS** (5/5 podtestů)
- `npx tsx --test tests/cms-studies-api.test.ts`: **PASS** (2/2 podtestů)
- Kontrola duplicit DOI / slug: **0 duplicit**
- Počet publikovaných studií: **2**
- Změny produkčního kódu mimo určené datové vrstvy: **ŽÁDNÉ (0)**

---

## 5. Závěr
Implementace byla úspěšně dokončena v souladu se zadanými pravidly, bez Git push a bez mergování.
