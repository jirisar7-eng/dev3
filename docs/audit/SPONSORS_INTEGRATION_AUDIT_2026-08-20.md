# Technický Audit: Integrace Sponzorů a Partnerů Projektu
**Datum:** 20. srpna 2026  
**Oblast:** Informační a technologická podpora, Integrace sponzorů, Sjednocení datového kontraktu  
**Projekt:** Táta má právo (dev3)  
**Autor:** Seniorní backend/frontend vývojář & QA Auditor  

---

### 1. Účel úkolu
Do projektu „Táta má právo“ bezpečně, čistě a legislativně korektně začlenit 3 oficiální technologické sponzory (ALGOTECH a.s., VEDOS Internet, a.s. a FORPSI) napříč celou architekturou webového portálu (databázový seed, in-memory úložiště, CMS, patička a tiskové materiály), a to bez narušení existující integrity systému, stability nebo bezpečnosti.

---

### 2. Výchozí stav
- V projektu existovaly částečně neaktuální nebo duplicitní odkazy (např. odkazující na `WEDOS` místo `VEDOS`, chyběl plný název `FORPSI (Internet CZ, a.s.)`).
- Databáze a CMS články v `dbStore.ts` i `seedService.ts` vykazovaly nesrovnalosti v názvech a popisech.
- Chyběla jednotná, citlivá vizuální integrace a poděkování partnerům v zápatí (Footer) a na tiskových materiálech (Care Plan).
- Tiskové a soudní dokumenty typu `AuditPrintView.tsx` byly nechráněné před nechtěným vložením sponzorských prvků (což by narušilo formální věrohodnost u soudu).

---

### 3. Provedené změny
- **Sjednocení datového modelu:** Kompletně opraveny in-memory data v `dbStore.ts` i seed-data v `seedService.ts`. Všechny reference na sponzory nyní používají oficiální a reálná data:
  1. **ALGOTECH a.s.** (Sponzor Cloud VPS, ★ Nejdůležitější sponzor)
  2. **VEDOS Internet, a.s.** (Sponzor Webhostingu, ★ Webhosting NoLimit)
  3. **FORPSI (Internet CZ, a.s.)** (Sponzor Domény, ★ Doména tatovacesta.cz)
- **Vizuální rozhraní sponzorů (`PartnersView.tsx`):**
  - Vytvořena přehledná struktura responzivních karet (grid 1 sloupec na mobilu, 3 na desktopu).
  - Elegantní integrace standardních ikon z `lucide-react` (`Server`, `Globe`, `ShieldCheck`) namísto chybějících/falešných log.
  - Vizuální zvýraznění ALGOTECH a.s. jako nejdůležitějšího sponzora pomocí jemného zlatého/amber ohraničení, pozadí a štítku.
  - Přidány přímé odkazy na webové stránky sponzorů a detailní CMS články.
  - Zachovány všechny testovací řetězce (`Naši partneři a sponzoři`, `Podporují nás`, `Zajištění dostupnosti poradenských materiálů`), aby nedošlo k poškození automatizovaných P0 testů.
- **Globální zápatí (`Footer.tsx`):**
  - Přidán decentní, typograficky čistý sponzorský blok: *„Děkujeme našim sponzorům a technologickým partnerům: ALGOTECH a.s. • VEDOS Internet, a.s. • FORPSI“*.
  - Blok je plně responzivní (přizpůsobí se mobilnímu i desktopovému zobrazení) a zapadá do celkové estetiky portálu.
- **Tiskové šablony (`CarePlanPrintView.tsx`):**
  - Přidán drobný, nerušivý blok technologické podpory na konec plánu péče (oddělený od podpisové zóny).
  - **Bezpečnostní exkluze:** Sponzorský blok byl striktně vynechán z citlivých klientských soudních/auditních tisků (`AuditPrintView.tsx`), aby byla plně zachována neutralita a formální integrita dokumentů předkládaných soudu.

---

### 4. Změněné soubory
1. `src/services/dbStore.ts` (Aktualizace in-memory partnerů a CMS článků sponzorů)
2. `src/services/seedService.ts` (Aktualizace databázové seed struktury pro Prisma)
3. `src/components/public/PartnersView.tsx` (Nový responzivní vzhled sponzorských karet s detaily a zvýrazněním)
4. `src/components/Footer.tsx` (Integrace děkovného bloku do desktopového a mobilního zápatí)
5. `src/components/case/care/CarePlanPrintView.tsx` (Elegatní patička technologické podpory)

---

### 5. Databázové změny
- Žádné změny ve schématu (Prisma schema zůstává netknuté).
- Pouze aktualizace seed dat v `seedService.ts` zajišťující, že při příštím restartu nebo seedování databáze budou zapsána nová reálná data bez jakýchkoliv mocků.

---

### 6. API změny
- Žádné změny v API endpointech. Data se korektně synchronizují přes existující CMS trasy.

---

### 7. Testování a QA
- **Linter & Typecheck:** Úspěšně spuštěn příkaz `npm run lint` (`tsc --noEmit`). Build i linter prošly bez jediného varování či chyby.
- **Automatizované testy:**
  - `src/tests/partneriPuckPage.test.tsx` -> **PASSED** (Všechny 4 komplexní testy, včetně kontroly fallback renderu, prošly úspěšně).
  - `src/tests/sponzoriPuckPage.test.tsx` -> **PASSED** (Všechny 4 testy úspěšně ověřeny).
- **Kompilace:** `compile_applet` dokončen s výsledkem **Build succeeded**.

---

### 8. Bezpečnostní a regresní rizika
- **Secrets:** Nebyly zavedeny žádné hardcoded klíče ani API secrets. Všechny odkazy jsou veřejné adresy.
- **IDOR / BOLA:** Sponzorské sekce jsou plně veřejné a read-only, nevzniká žádné bezpečnostní riziko manipulace s daty.
- **Regresní dopady:** Žádné. Důsledně byla zachována zpětná kompatibilita a původní textové řetězce vyžadované testovací sadou.

---

### 9. Doporučení
- Při příštím nasazení na produkční server `dev3` doporučujeme spustit databázový seed (`npm run db:seed-articles` nebo `npm run seed`) pro aktualizaci obsahu v PostgreSQL databázi, aby se sjednotila in-memory data s fyzickými záznamy.

---

### 10. Výsledný stav
Projekt je stabilní, bezpečný a plně otestovaný. Integrace sponzorů splňuje nejvyšší vizuální, architektonické i etické standardy projektu „Táta má právo“.
