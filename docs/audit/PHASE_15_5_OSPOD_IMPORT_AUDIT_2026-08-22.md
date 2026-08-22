# AUDIT REPORT: FÁZE 15.5 — KROK 3 (IMPORT OSPOD DO REGISTRU)

**Datum a čas:** 22. 8. 2026  
**Projekt:** Táta má právo (dev3)  
**Pracovní větev:** `feature/subject-registry-moderation`  
**Autor:** Senior Backend/Frontend Architect & QA Auditor  

---

## 1. VÝSLEDEK DRY-RUN TESTU

Před provedením zápisu do databáze proběhl dry-run test:

- **Celkový počet v datasetu:** 227 záznamů
- **Unikátních OSPOD k procesování:** 227
- **Bude CREATE:** 227
- **Bude UPDATE:** 0
- **Bude SKIP:** 0
- **Nalezené kolize/duplicity v datasetu:** 0
- **Dotčené ne-OSPOD subjekty:** 0 (Žádný existující ne-OSPOD subjekt nebyl modifikován)
- **Výsledek dry-run:** **PASS** (100% bezpečný pro import)

---

## 2. STATISTIKA PROVEDENÉHO IMPORTU

Import proběhl bezpečně přes upsert logiku podle název + město + typ:

| Metrika | Před importem | Po importu | Změna |
| :--- | :---: | :---: | :---: |
| **OSPOD subjekty v DB** | **0** | **227** | **+227 (CREATE)** |
| **Ostatní subjekty (SOUD, ZNALEC, ADVOKAT, atd.)** | **56** | **56** | **0 (BEZE ZMĚNY - ZACHOVÁNO)** |
| **Celkem subjektů v Registru** | **56** | **283** | **+227** |

---

## 3. VERIFIKACE KONTROL A API

1. **Kontrola duplicit:** 0 duplicitních záznamů vytvořeno.
2. **Integrita ne-OSPOD subjektů:** 56 existujících subjektů zůstalo v nedotčeném stavu.
3. **API `/api/subjekty`:**
   - Bez filtrů navrací **283 subjektů**.
   - S filtrem `type=OSPOD` navrací přesně **227 OSPOD**.
   - S filtrem `type=OSPOD&region=Hlavní město Praha` navrací **22 OSPOD**.
4. **Mapa a zobrazení:**
   - Všechny body OSPOD (227) mají geografické souřadnice (`lat`, `lng`) v ČR a zobrazují se korektně na interaktivní mapě v komponentě `MapaSubjektuView`.

---

## 4. SKRIPT A SOUBORY

- **Nové skripty:** `src/scripts/importOspody.ts` (poskytuje bezpečný, reusabilní import s korektním odpojením databáze v `finally` bloku).
- **Prisma Schema:** **BEZE ZMĚNY** (nepanuje potřeba nových modelů ani migrací).
- **Větev main:** Zůstala 100% nedotčena.

---

## 5. VÝSLEDKY TESTŮ A KONTROL

- **TypeScript Lint (`npm run lint`):** **PASS**
- **Production Build (`npm run build`):** **PASS**
- **Integrita Databáze (DB Check):** **PASS** (227 OSPOD / 56 ostatních / 283 celkem)
