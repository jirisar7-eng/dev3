# MASTER-IMPLEMENT-06A: MAPA SUBJEKTŮ — POKROČILÉ FILTRY (GAP-02 FÁZE A)

**Projekt:** Táta má právo / Synthesis Hub  
**Repo:** `jirisar7-eng/dev3`  
**Datum:** 2026-09-06  
**Status:** ✅ IMPLEMENTOVÁNO & OVĚŘENO (PASS)  
**Autor:** Hlavní architekt & DevSecOps ekosystému Synthesis  
**Scope:** Pouze GAP-02 FÁZE A (Pokročilé filtry v existující `MapaSubjektuView`)

---

## 1. Souhrn implementace

V souladu se zadáním MASTER-IMPLEMENT-06A a výsledky průzkumu MASTER-AUDIT-06 byla do existující komponenty `MapaSubjektuView` implementována první část GAP-02 — **Pokročilé ověřené filtry**:

1. **Pouze bezbariérové (`onlyAccessible`):**
   - Vyhodnocuje textový atribut `accessibility` z existujícího `verifiedProfile`.
   - **Fail-closed:** Projde pouze tehdy, pokud je profil ve stavu `VERIFIED` nebo `STALE` a hodnota `accessibility` je neprázdný, sanitizovaný řetězec.

2. **Bez nutnosti objednání (`noAppointmentNeeded`):**
   - Vyhodnocuje atribut `appointmentRequired` z `verifiedProfile`.
   - **Fail-closed:** Projde výhradně tehdy, pokud je profil ve stavu `VERIFIED` nebo `STALE` a `appointmentRequired === false`.

3. **Otevřeno dnes (`openToday`):**
   - Využívá existující rozhraní `WeeklyOpeningHours` z `src/types/verifiedSubjectInfo.ts`.
   - Bezpečně určuje aktuální den v časové zóně `Europe/Prague` (`Intl.DateTimeFormat`).
   - Kontroluje, zda pro daný den platí `isOpen === true` a existuje alespoň jeden platný časový interval (`intervals.length > 0`, neprázdný `from` a `to`).
   - **Odolnost proti chybám:** Pokud je `openingHours` poškozené, nevalidní JSON nebo chybí, vyhodnotí se jako `false` a aplikace nespadne.

4. **Konzistentní filtrování a synchronizace:**
   - Výsledný stav `filteredSubjekty` synchronně filtruje:
     - **Značky na mapě** (`mapSubjekty` a `SubjektyMap`)
     - **Seznam v sidebaru** (včetně počítadla a vizuálních štítků)
     - **Počítadla v horní liště kategorií**
   - Využívá konjunkci **AND** (subjekt musí splňovat všechny aktivní filtry).
   - Tlačítko **„Resetovat filtry“** se zobrazuje výhradně tehdy, je-li alespoň jeden pokročilý filtr aktivní.
   - Synchronizace s URL query parametry (`?bezbarierove=1`, `?bez-objednani=1`, `?otevreno-dnes=1` / `?accessible=true`, `?no-appointment=true`, `?open-today=true`).

5. **Nulová duplicita:**
   - Nebyl vytvořen žádný nový registr, nová mapa, paralelní DTO ani nová DB tabulka.
   - Používá se výhradně stávající veřejné `Subjekt` DTO s veřejným `verifiedProfile`.

---

## 2. Dotčené soubory a provedené úpravy

| Soubor | Typ změny | Popis úpravy |
|---|---|---|
| `src/utils/mapFilters.ts` | **Nový modul** | Čisté, otestované predikáty pro vyhodnocení stavů: `isProfileStatusActive`, `isSubjectAccessible`, `isSubjectNoAppointmentNeeded`, `isSubjectOpenToday`, `getPragueDayKey`, `parseOpeningHoursSafely`, `matchesAdvancedFilters`. |
| `src/components/public/MapaSubjektuView.tsx` | **Úprava komponenty** | Přidání stavů filtrů (`onlyAccessible`, `noAppointmentNeeded`, `openToday`), filtrovací lišty s tlačítky filtrů a resetem, napojení na URL query parametry, synchronizace zobrazení v mapě, sidebaru a kategoriích. |
| `tests/mapa-subjektu-advanced-filters.test.ts` | **Testovací sada** | 15 unit/integračních testů pokrývajících fail-closed logiku, `Europe/Prague` kalendář, AND konjunkci, parsování JSON a reset. |
| `scripts/test-runner.js` | **Test Runner** | Zařazení nové testovací sady do centrálního test runneru. |

---

## 3. Výsledky testů a verifikace

### A. Testovací sada pokročilých filtrů (`tests/mapa-subjektu-advanced-filters.test.ts`)
```
TAP version 13
# Subtest: MASTER-IMPLEMENT-06A: Pokročilé filtry mapy subjektů (GAP-02 FÁZE A)
    # Subtest: 1. Fail-closed status enforcement
        ok 1 - isProfileStatusActive accepts only VERIFIED and STALE
        ok 2 - subjects with PENDING_REVIEW or REJECTED never pass any active filter
        ok 3 - subjects without verifiedProfile never pass when any filter is active
    ok 1 - 1. Fail-closed status enforcement
    # Subtest: 2. Filter: Pouze bezbariérové
        ok 1 - passes for VERIFIED or STALE profile with non-empty accessibility text
        ok 2 - fails closed for empty, whitespace-only, or missing accessibility text
    ok 2 - 2. Filter: Pouze bezbariérové
    # Subtest: 3. Filter: Bez nutnosti objednání
        ok 1 - passes strictly when appointmentRequired === false on VERIFIED/STALE
        ok 2 - fails closed when appointmentRequired is true, undefined, or not boolean false
    ok 3 - 3. Filter: Bez nutnosti objednání
    # Subtest: 4. Filter: Otevřeno dnes (Europe/Prague calculation)
        ok 1 - getPragueDayKey correctly extracts weekday in Europe/Prague
        ok 2 - parseOpeningHoursSafely parses JSON string or raw object without exceptions
        ok 3 - passes when current Prague day has isOpen: true with non-empty intervals
        ok 4 - fails closed when current Prague day has isOpen: false or empty intervals
        ok 5 - fails closed without error on corrupted or missing openingHours
    ok 4 - 4. Filter: Otevřeno dnes (Europe/Prague calculation)
    # Subtest: 5. Multi-filter AND conjunction
        ok 1 - all subjects pass when no advanced filters are active
        ok 2 - subject must satisfy ALL active filters simultaneously
    ok 5 - 5. Multi-filter AND conjunction
    # Subtest: 6. Zero duplicate registry/map check
        ok 1 - filters utilize existing Subjekt DTO and verifiedProfile fields without schema mutation
    ok 6 - 6. Zero duplicate registry/map check
ok 1 - MASTER-IMPLEMENT-06A: Pokročilé filtry mapy subjektů (GAP-02 FÁZE A)
# tests 15, suites 7, pass 15, fail 0
```

### B. Regresní test předchozí fáze (`tests/mapa-subjektu-verified-profile-geocode.test.ts`)
- **Stav:** PASS (7/7 testů úspěšných).

### C. TypeScript & Build verifikace
- `npm run lint` (`tsc --noEmit`): 0 chyb.
- `compile_applet`: Build succeeded.

---

## 4. Bezpečnostní a architektonické zhodnocení

1. **Least Privilege & Fail-Closed:**
   - Jakýkoliv subjekt, který nemá profil ve stavu `VERIFIED` nebo `STALE`, je při aktivaci jakéhokoliv pokročilého filtru automaticky vyřazen z výsledků.
   - Neexistuje žádný stav, kdy by `PENDING_REVIEW` nebo `REJECTED` profil způsobil zařazení subjektu do filtrovaného seznamu.

2. **Nulový únik metadat / Zero PII:**
   - Filtry pracují výhradně s veřejným DTO `Subjekt`, které prošlo sanitizací v `toPublicSubjektDto`.
   - Interní poznámky recenzentů, ID verifikátorů ani systémové audity nejsou na klientu přítomny.

3. **Respektování limitů zadání:**
   - Neproběhl žádný commit, push, merge, deployment ani DB migrace.
   - FÁZE B (offline / cache) nebyla implementována v souladu se striktním rozdělením úkolu.
