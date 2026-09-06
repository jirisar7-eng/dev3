# MASTER-IMPLEMENT-MEMENTO-02 — Memento otců: Rozšíření obsahu a napojení na systém pomoci

**Projekt:** Táta má právo / Synthesis Hub (`jirisar7-eng/dev3`)  
**Datum:** 2026-09-06  
**Režim:** DEV3 ONLY (Rozšíření modulu Memento na 12 procesních chyb)  
**Stav:** ✅ SCHVÁLENO A IMPLEMENOVÁNO  

---

## 1. ÚČEL A ROZSAH ZMĚNY

Cílem úkolu `MASTER-IMPLEMENT-MEMENTO-02` bylo rozšířit modul `/memento` z původního náhledu 4 případů na plnohodnotný edukační, preventivní a deeskalační modul obsahující **12 procesních chyb**, kterým je nutné se vyhnout v komunikaci, péči o dítě a opatrovnickém řízení.

### Hlavní pilíře rozšířeného modulu:
1. **Rozšířený obsah (12 chyb):** Zpracování 12 krizových vzorců v jednotném metodickém formátu:
   `❌ CHYBA → ⚠️ RIZIKO & NÁSLEDEK → ✅ SPRÁVNÝ POSTUP → 📝 PRAKTICKÝ VZOR (Bad vs. Good BIFF)`
2. **Standardní metodické sekce:**
   - **Úvodní slovo:** Upozornění na rychlost vzniku chyb a nutnost zastavení před reakcí v afektu.
   - **Právní výhrada (Disclaimer):** Výslovné upozornění, že Memento nenahrazuje individuální právní/psychologickou pomoc.
   - **Sekce D (BIFF komunikace):** Zásady Brief, Informative, Friendly, Firm, 5 kontrolních otázek před odesláním a Pravidlo 24 hodin.
   - **Sekce E (Ochrana dítěte):** Dítě jako posel/výslech/nahrávky/kritika vs. ochrana před dospělým konfliktem.
   - **Sekce F (Dokumentace & Důkazy):** Zásady věcné evidence (datum, čas, místo, přítomní, reakce) bez osobních dojmů.
   - **Sekce G & H (OSPOD & Soud):** Zásady 4 pilířů jednání s OSPOD a 7 bodů kontrolního seznamu pro soud.
   - **Sekce I (Sociální sítě & Soukromí):** Přehled materiálů, které nepatří na internet (rozsudky, fotky dětí, spisy).
   - **Sekce J & K (Rychlotahák):** Do's & Don'ts srovnání pro rychlou orientaci v krizovém momentu.
   - **Sekce L (Systém pomoci):** Propojení na 5 krizových modulů (`/sos-plan`, `/krizova-pomoc`, `/pravni-poradna`, `/registr-subjektu`, `/mapa-subjektu`).
   - **Sekce M (Právní zdroje):** Primární zdroje (Ústavní soud, e-Sbírka, SPOD, ÚOOÚ) s časovou platností a verzí.

---

## 2. ZMĚNĚNÉ SOUBORY

| Soubor | Druh změny | Popis změny |
| :--- | :--- | :--- |
| `src/data/mementoSeed.ts` | **Úprava data seedu** | Rozšíření z 4 na 12 kompletních procesních chyb podle produktové specifikace. |
| `src/components/public/community/MementoView.tsx` | **Předělání UI komponenty** | Kompletní implementace 12 chyb, filtrů, vyhledávání, BIFF sekce, tiskové úpravy, disclaimery a CTA. |
| `src/config/navigation.ts` | **Ověření navigace** | Zajištění, že `/memento` je registrováno pod `cat-1` ("Potřebuji pomoc") na 6. pozici. |
| `src/components/public/community/CrisisCommunityPortal.tsx` | **Úprava popisu** | Aktualizace popisku v Krizovém rozcestníku na 12 procesních chyb. |
| `src/puck/defaultPageData.ts` | **Úprava Puck dat** | Aktualizace nadpisu a popisu Mementa v Puck CMS default hodnotách. |
| `src/tests/mementoModuleExpansion.test.ts` | **Nový unit test** | 5 testovacích případů pro ověření datové struktury, CmsService fallbacku, navigace a UI prvků. |

---

## 3. PRISMA A DATABÁZOVÉ ZMĚNY

- **Žádné nové Prisma modely ani migrace nebyly vytvořeny.**
- Využita stávající infrastruktura:
  - Prisma model `MementoCase` (zůstal beze změn).
  - `CmsService.getMementoCases()` se zařazením fallbacku na `dbStore` (který je napojen na `DEFAULT_MEMENTO_CASES`).
  - Zero DB failure risk: Pokud PostgreSQL databáze není dostupná, aplikace transparentně přehmátne na lokální memory seed.

---

## 4. TESTY A VÝSLEDKY

```bash
npx vitest run src/tests/mementoModuleExpansion.test.ts
```
**Výsledek:**
- `✓ DEFAULT_MEMENTO_CASES contains exactly 12 expanded process errors`
- `✓ Each MementoCase has complete structure`
- `✓ CmsService.getMementoCases returns all published cases sorted by order`
- `✓ Navigation config places Memento otců as 6th item in Potřebuji pomoc`
- `✓ MementoView component contains required educational sections and CTA links`
- **5 / 5 PASSED**

### Linter & Typecheck:
```bash
npm run lint (tsc --noEmit) -> SUCCESS (0 errors)
```

### Production Build:
```bash
npm run build (compile_applet) -> SUCCESS
```

---

## 5. BEZPEČNOSTNÍ AUDIT (P0–P3)

- **P0 (Secrets & Auth Bypass):** Žádné API klíče, hesla ani PII v kódu. Povolení i neregistrovanému uživateli (veřejný edukační modul).
- **P1 (BOLA / IDOR & Tenant Isolation):** Memento nepředává ani nepřistupuje k žádným spisu, případu, sporu či dokumentům uživatelů. Je přísně izolováno od `Case` a `UserCase` modelů.
- **P2 (SSRF & Input Sanity):** Vyhledávací pole je sanitizováno klientsky, filtry jsou bezpečné enumy (`all`, `komunikace`, `pece`, `soud`, `soukromi`, `dokazovani`).
- **P3 (Informační integrita & Právní výhrada):** Vložena jasná výhrada (Disclaimer), že Memento nenahrazuje individuální právní pomoc a primární zdroje odkazují na e-Sbírku a NALUS Ústavního soudu.

---

## 6. OTEVŘENÁ RIZIKA A DALŠÍ KROKY

- **Riziko:** Žádné. Modul funguje plně autonomně s okamžitým klientským tiskem (`window.print()`).
- **Další krok:** Připraveno pro integraci do produkčního nasazení Synthesis Hub / Táta má právo.
