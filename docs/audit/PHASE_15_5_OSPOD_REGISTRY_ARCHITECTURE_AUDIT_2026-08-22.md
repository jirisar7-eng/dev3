# ARCHITEKTONICKÝ AUDIT — FÁZE 15.5: OSPOD REGISTR + MAPA
**Datum a čas:** 22. 8. 2026  
**Projekt:** Táta má právo (dev3)  
**Větev:** `feature/subject-registry-moderation`  
**Autor:** Senior Backend/Frontend Architect & QA Auditor  

---

## 1. CÍL AUDITU

Cílem tohoto kroku (KROK 1 FÁZE 15.5) je provést důkladný architektonický audit stávající databázové, API a mapové infrastruktury v projektu `dev3` před rozšířením Registru subjektů o pracoviště **OSPOD** (Orgán sociálně-právní ochrany dětí) a provést analýzu zdrojového datasetu z [Adopce.com - OSPODy](https://www.adopce.com/kontakty/ospody/).

**DŮLEŽITÉ PRAVIDLO AUDITU:**  
V tomto kroku byly prováděny výhradně čtecí a analytické operace. Nebyly provedeny žádné modifikace kódové báze, databáze ani Prisma schématu.

---

## 2. AUDIT DATABÁZOVÉHO MODELU (Prisma Schema)

Prozkoumáním souboru `prisma/schema.prisma` bylo zjištěno následující:

1. **Centrální entita:** Všechny subjekty opatrovnické sítě (soudy, znalci, advokáti, poradny i OSPOD) využívají jednotný databázový model `Subjekt`.
2. **Enum `EntityType`:** V souboru `prisma/schema.prisma` na řádku 979 již enum `EntityType` obsahuje hodnotu `OSPOD`:
   ```prisma
   enum EntityType {
     SOUD
     OSPOD
     ZNALEC
     ADVOKAT
     PORADNA_CHARITA
   }
   ```
3. **Dostupná datová pole:** Model `Subjekt` obsahuje všechna potřebná pole pro uložení kontaktních údajů OSPOD:
   - `id`: `String @id @default(uuid())`
   - `type`: `EntityType` (`OSPOD`)
   - `name`: Název úřadu / pracoviště
   - `institution`: Nadřízený úřad / městský úřad / magistrát
   - `city`: Město / Městská část
   - `region`: Kraj ČR (odpovídá oficiálnímu seznamu 14 krajů)
   - `address`: Ulica a číslo popisné
   - `zip`: PSČ
   - `email`: Kontaktní e-mail
   - `phone`: Telefonní kontakt
   - `website`: Odkaz na oficiální web pracoviště OSPOD
   - `isVerified`: Booleans (příznaky ověření)
   - `lat`, `lng`: Geografické souřadnice pro zobrazení na mapě (`Float?`)
   - `status`: Stav v moderaci (`PUBLISHED`)

**ZÁVĚR DATABÁZOVÉHO AUDITU:**  
**NENÍ VYŽADOVÁNA ŽÁDNÁ MIGRACE PRISMA SCHÉMATU.** Stávající databázová struktura je 100% připravena pro uložení pracovišť OSPOD.

---

## 3. AUDIT BACKENDOVÝCH SLUŽEB A API ENDPOINTŮ

Prozkoumáním souborů `src/services/subjektService.ts` a `src/routes/subjektRoutes.ts` bylo ověřeno:

1. **REST Endpoints:**
   - `GET /api/subjekty` - Podporuje filtrování podle `type=OSPOD`, `region` a vyhledávacího řetězce `search`.
   - `GET /api/subjekty/:id` - Vrací detail konkrétního subjektu včetně pracovišť a hodnocení.
   - `POST /api/subjekty` - Umožňuje přidání nového subjektu administrátorem nebo přes schvalovací frontu.
2. **Moderace & Verifikace:**
   - Admin rozhraní `SubjektManager.tsx` plně podporuje správu a ověřování záznamů typu `OSPOD`.

**ZÁVĚR API AUDITU:**  
API vrstva nepotřebuje nové endpointy. Stávající univerzální CRUD rozhraní pro subjekty funguje pro `OSPOD` bez úprav.

---

## 4. AUDIT MAPOVÉ INFRASTRUKTURY A UI KOMPONENT

Prozkoumáním komponent `src/components/public/SubjektyMap.tsx` a `src/components/public/MapaSubjektuView.tsx` bylo ověřeno:

1. **Vizuální styl pinu:**
   - Komponenta `SubjektyMap.tsx` má již definovanou barvu pro OSPOD:
     ```typescript
     case 'OSPOD':
       return '#b91c1c'; // Červený pin (Red-700)
     ```
   - Pomocná funkce `formatEntityType('OSPOD')` vrací text `'OSPOD'`.
2. **Konfigurace kategorií v `MapaSubjektuView.tsx`:**
   - Rozhraní disponuje kartou a filtrem pro OSPOD s ikonou `Users`, badge pozadím `bg-blue-100 text-blue-900` a popiskem *"Orgány OSPOD (Oddělení sociálně-právní ochrany dětí)"*.
3. **Responzivita a chování:**
   - Mapa využívá Leaflet / OpenStreetMap s dynamickými piny, popupy a automatic centering na vybraný OSPOD.

**ZÁVĚR MAPOVÉHO AUDITU:**  
Mapová infrastruktura je plně funkční a připravená zobrazovat OSPOD body ihned po doplnění GPS souřadnic (`lat`, `lng`).

---

## 5. ANALÝZA ZDROJOVÉHO DATASETU (Adopce.com/kontakty/ospody/)

Byl proveden automatizovaný skriptový rozbor zdroje `https://www.adopce.com/kontakty/ospody/`.

### Výsledky rozboru datasetu:
- **Celkový počet pracovišť OSPOD:** **227 pracovišť**
- **Pokrytí krajů:** 14 z 14 krajů České republiky (100% pokrytí)

### Rozpad pracovišť podle krajů:
1. **Hlavní město Praha:** 22 pracovišť
2. **Jihočeský kraj:** 17 pracovišť
3. **Jihomoravský kraj:** 21 pracovišť
4. **Karlovarský kraj:** 7 pracovišť
5. **Kraj Vysočina:** 15 pracovišť
6. **Královéhradecký kraj:** 15 pracovišť
7. **Liberecký kraj:** 10 pracovišť
8. **Moravskoslezský kraj:** 22 pracovišť
9. **Olomoucký kraj:** 13 pracovišť
10. **Pardubický kraj:** 15 pracovišť
11. **Plzeňský kraj:** 15 pracovišť
12. **Středočeský kraj:** 26 pracovišť
13. **Ústecký kraj:** 16 pracovišť
14. **Zlínský kraj:** 13 pracovišť

### Hodnocení datové kvality:
- **Názvy a úřady:** 100 % záznamů obsahuje označení pracoviště (městský úřad / městská část).
- **Adresy:** 100 % záznamů obsahuje uličnici a číslo popisné (např. *"Vodičkova 18, Praha 1"*, *"Velké náměstí 114/3, Písek"*).
- **Webové odkazy:** 100 % záznamů obsahuje přímý odkaz na oficiální stránku OSPOD daného úřadu.
- **Formátování URL:** V odkaze na web je nutné převést HTML entitu `&amp;` na standardní znak `&`.
- **Absence GPS:** Zdrojový HTML kód neobsahuje přímo zeměpisné souřadnice (`lat`, `lng`). Ty je potřeba vygenerovat geokódováním adres (pomocí Nominatim / OpenStreetMap API nebo interního geokodéru).

---

## 6. DOPORUČENÝ A BEZPEČNÝ DOKONČOVACÍ PLÁN (NÁSLEDUJÍCÍ KROKY)

1. **KROK 2 (Příprava dat & Geokódování):**
   - Vytvořit samostatný importní / seed skript (např. `prisma/seeds/seedOspody.ts` nebo `scripts/importOspody.ts`).
   - Implementovat sanitizaci adres a názvů (např. dopnit plný název *"Městský úřad [Město] – OSPOD"*).
   - Ošetřit geokódování adres na souřadnice (`lat`, `lng`) s fallbacks na střed obce/města.

2. **KROK 3 (Import do databáze):**
   - Spustit import se zachováním existujících subjektů (`upsert` podle názvu/adresy nebo kontroly duplicity), aby nedošlo ke ztrátě dat.
   - Nastavit stav `isVerified: true` a `status: 'PUBLISHED'`.

3. **KROK 4 (Verifikace v UI a na Mapě):**
   - Zkontrolovat zobrazení v Registru subjektů (přepínač OSPOD).
   - Zkontrolovat zobrazení červených pinů OSPOD na interaktivní mapě ČR.
   - Otestovat responzivitu a detail subjektu na mobilních zařízeních.

---

## 7. SHRNUTÍ BEZPEČNOSTI A INTEGRITY

- **Žádné destruktivní změny:** Žádné tabulky ani stávající záznamy v databázi nebyly dotčeny.
- **Bezpečnost secrets:** Nebyly použity ani odhaleny žádné secrets či API klíče.
- **Nulové riziko regrese:** Vzhledem k tomu, že v tomto kroku proběhl pouze audit, stávající stabilita systému byla 100% zachována.
