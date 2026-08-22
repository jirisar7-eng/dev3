# AUDITNÍ REPORT OBSAHOVÉ INTEGRACE: ODBORNÍCI A SUBJEKTY V OPATROVNICKÉM ŘÍZENÍ
**Datum:** 22. srpna 2026  
**Oblast:** Informační a datová architektura – Odborníci & Průvodci  
**Autor:** Seniorní vývojář & Architekt projektu  

---

## 1. Účel úkolu
Cílem úkolu bylo zpracovat a integrovat ucelený, vysoce odborný a pro rodiče srozumitelný přehled klíčových subjektů a odborníků, kteří vystupují v opatrovnických řízeních o nezletilých dětech (Soudy, OSPOD, Soudní znalci, Rodinní advokáti, Rodinné poradny & Mediátoři).

Tento obsah musel být bezpečně integrován do struktury právních průvodců (`LegalGuide`), propojen s naším interaktivním Registrem subjektů (`/registr-subjektu`) a ošetřen jak pro produkční PostgreSQL databázi (přes Prisma ORM), tak pro in-memory datový fallback (`dbStore`).

---

## 2. Výchozí stav
- V systému existovali dílčí právní průvodci (pro OSPOD, soudní řízení, znalecké posudky atd.), ale chyběl ucelený přehledový průvodce (rozcestník), který by rodičům na jednom místě objasnil role všech 5 hlavních typů subjektů.
- Informační články a průvodci nebyly přímo propojeny s Registrem subjektů, což omezovalo schopnost rodičů okamžitě kontaktovat vyhledaný státní orgán či odborníka.
- Neexistoval centralizovaný, idempotentní mechanismus pro kompletní seedování Právních průvodců a WikiTermů do PostgreSQL, data byla dříve načítána převážně v in-memory fallbacku v `dbStore`.

---

## 3. Návrh a architektonické řešení
Pro naplnění zadání a zajištění maximální kvality jsme zvolili robustní, vícevrstvý přístup:

1. **Strukturovaný obsahový prvek (`guide-subjekty`):**
   Vytvořili jsme nový profilový průvodce s klíčem `subjekty` a názvem *"Kdo je kdo v opatrovnickém řízení"*. Tento průvodce obsahuje disclaimer o tom, že data neslouží jako náhradní právní poradenství, a je rozdělen do 5 kapitol odpovídajících typům opatrovnických subjektů:
   - **Soudy**: Rozhodovací autorita, jejímž prvořadým kritériem je nejlepší zájem dítěte.
   - **OSPOD**: Kolizní opatrovník dítěte chránící jeho práva a zjišťující jeho názor.
   - **Soudní znalci**: Odborníci pro posouzení osobností a interakcí, jejichž posudek je významným, nikoliv však jediným důkazem.
   - **Advokáti**: Zástupci rodičů usilující o věcnou argumentaci a rodičovskou dohodu bez zbytečné eskalace konfliktu.
   - **Poradny, mediátoři a rodinná centra**: Klíčoví partneři pro mimosoudní dohodu, terapii a zdravou spolurodičovskou komunikaci.

2. **Propojení s Registrem subjektů:**
   Každá kapitola byla přímo a elegantně prolinkována s naším Registrem subjektů (`/registr-subjektu`) s přednastaveným filtrem typu subjektu:
   - Soudy: `/registr-subjektu?type=SOUD`
   - OSPOD: `/registr-subjektu?type=OSPOD`
   - Soudní znalci: `/registr-subjektu?type=ZNALEC`
   - Rodinní advokáti: `/registr-subjektu?type=ADVOKAT`
   - Poradny a mediátoři: `/registr-subjektu?type=PORADNA_CHARITA`

3. **Database-Level Seeding a Robustnost:**
   - Připravili jsme dedikovaný, idempotentní skript `/prisma/seed-wiki-guides.ts`, který upsertuje všechny `WikiTerm` a `LegalGuide` (včetně jejich kapitol) do PostgreSQL.
   - Skript nejprve vyčistí staré provázané kapitoly (`legalGuideChapter.deleteMany`) a následně bezpečně zapíše nové, čímž předchází porušení integrity cizích klíčů a vzniku duplicit.
   - Tento skript byl integrován do hlavní seedovací pipeline (`/prisma/seed.ts`).

---

## 4. Změněné a vytvořené soubory
- `MODIFY` `/src/data/legalGuidesSeed.ts` — Přidání nového průvodce `guide-subjekty` se všemi 5 kapitolami, checklistem, SEO metadaty a prolinkováním.
- `CREATE` `/prisma/seed-wiki-guides.ts` — Samostatný idempotentní skript pro synchronizaci Wiki a Průvodců do PostgreSQL.
- `MODIFY` `/prisma/seed.ts` — Propojení hlavní seedovací pipeline s novým skriptem.
- `CREATE` `/docs/audit/EXPERTS_AND_INSTITUTIONS_CONTENT_AUDIT_2026-08-22.md` — Tento auditní report.

---

## 5. Ověření a testování (Definition of Done)
1. **Type-Safety (Linter):** Spuštěn příkaz `npm run lint` (`tsc --noEmit`). Všechny importy, typy a datové vazby jsou 100% v pořádku, linter proběhl bez chyb.
2. **Produkční sestavení (Build):** Příkaz `npm run build` kompiluje celou klientskou i serverovou část bez jakýchkoliv varování či výpadků.
3. **Běh seedu (Seed execution):** Příkaz `npm run seed` proběhl úspěšně.
   - Skript detekoval lokální nedostupnost PostgreSQL databáze (předpokládané chování v izolovaném sandboxu bez lokální DB instance) a bezpečně aktivoval in-memory fallback synchronizaci.
   - Všechny položky (včetně nového průvodce `guide-subjekty`) byly úspěšně naimportovány do datového úložiště `dbStore`.
   - Všechny texty a kapitoly jsou připraveny k okamžitému vykreslení ve veřejné části portálu na adresách `/pruvodce/subjekty` nebo v přehledu právních průvodců.

---

## 6. Bezpečnostní a věcné posouzení (P0)
- **Tón a styl:** Text je formulován v souladu s hodnotami portálu. Je věcný, neutrální a podporuje kulturu smíru, rodičovské dohody a ochranu dětí před rodinným konfliktem.
- **Bez falešné jistoty:** Průvodce výslovně upozorňuje, že opatrovnické soudy a instituce rozhodují individuálně a text slouží pouze jako orientační a metodické doprovázení.
- **Ochrana soukromí:** Dataset neobsahuje žádné neprověřené, soukromé ani citlivé osobní údaje.
- **Zabezpečení:** Kód neobsahuje žádné hardcoded secrets, hesla či přístupové klíče.
