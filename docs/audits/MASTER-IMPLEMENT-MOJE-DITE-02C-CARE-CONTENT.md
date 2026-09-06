# AUDIT A DOKUMENTACE OBSAHU — MASTER-IMPLEMENT-MOJE-DITE-02C

**Název úkolu:** MASTER-IMPLEMENT-MOJE-DITE-02C — Rozšíření obsahu veřejné stránky "/pece"  
**Projekt:** Táta má právo / Synthesis Hub (`jirisar7-eng/dev3`)  
**DEV3 Runtime:** `https://dev3.tatovacesta.cz/pece`  
**Datum:** 2026-09-06  
**Autor:** Senior Full-Stack Architect & DevSecOps  

---

### A. PŮVODNÍ A CÍLOVÝ STAV
- **Původní stav (02B):** Po opravení routovací kolizy zobrazovala veřejná trasa `/pece` základní veřejné UI `CareHubPublicLandingView.tsx` se 6 metodickými kartami pro nejmenší děti (0–1 rok) a základním porovnáním modelů střídání.
- **Cílový stav (02C):** Významné rozšíření veřejné edukační a praktické metodiky v `CareHubPublicLandingView.tsx` bez zásahu do privátního CareHubu (`CareHubPage`), bez nového routeru a bez zavedení nového CMS mechanismu.

---

### B. VYTVOŘENÝ A ROZŠÍŘENÝ OBSAH
1. **Hero & SEO:**
   - H1: *„Péče o novorozence a malé děti“*
   - Subtitle: *„Praktický průvodce péčí, předáváním dítěte a spoluprací rodičů“*
   - Přesný uvozující text zdůrazňující potřeby dítěte a orientační charakter.
2. **Rychlá orientace (Quick Navigation):**
   - Mobilně přívětivá lišta záložek / kotev pro okamžitý skok do sekcí: 🛡 Bezpečí, 🍼 Novorozenec, 👨👩👧 Jak nastavit péči, 🔄 Předávání, 🧠 Psychika, 🏥 Zdraví, 🏫 Školka, 📋 Rodičovský plán, 👶 Podle věku, ✅ Checklist, 🤝 Odborník, 📚 Zdroje.
3. **Novorozenec: první týdny (0–1 rok):**
   - 6 metodických karet v nekategorickém jazyce.
   - Praktický přehledový box s informacemi předávanými při předání kojence (poslední krmení, spánek, léky, potíže, potřeby, pokyny pediatra).
4. **Jak nastavit péči:**
   - Rozlišení: *potřeby dítěte* vs *možnosti rodičů* vs *právní rozhodnutí*.
   - Neutrální upozornění ohledně výběru modelu podle individuálních potřeb.
5. **Předávání dítěte & Komunikace:**
   - Rozdělení na: Informace, Věci, Komunikaci.
   - Zvýrazněná zásada: *„Předávání dítěte není vhodný okamžik pro řešení partnerského konfliktu.“*
6. **Psychická pohoda dítěte:**
   - Pravidla pro ochranu dítěte před konfliktem dospělých a loajalitním tlakem.
   - Propojení na veřejný modul `/psychologie`.
7. **Zdraví a nemoc:**
   - Organizace informací o zdravotním stavu, očkování, lécích a OČR.
   - Propojení na veřejný modul `/zdravotni-pece`.
8. **Školka a každodenní režim:**
   - Docházka, omluvenky, vyzvedávání a kroužky.
   - Propojení na veřejný modul `/skola`.
9. **Rodičovský plán — Příklady otázek k dohodě:**
   - Přehledná tabulka (Oblast vs Klíčová otázka).
   - Upozornění: *„Příklad pro orientaci — nejde o závazný právní vzor.“*
10. **Péče podle věku (0–3, 3–6, 6–11 let):**
    - Formulováno pomocí nekategorických spojení (*„může být užitečné“*, *„záleží na konkrétním dítěti“*).
11. **Praktický interaktivní checklist:**
    - Ukládání stavu do klientského `localStorage` (`pece_public_checklist`).
    - Informační přípis: *„Stav checklistu se ukládá pouze ve vašem prohlížeči.“* (Žádný únik PII na server).
12. **Kdy řešit situaci s odborníkem:**
    - Rozlišení úloh: Právník / Pediatr / Psycholog / OSPOD.
13. **Zdroje a odborná literatura:**
    - Zdroje: MZČR, NZIP, Česká pediatrická společnost (ČPS), WHO, ÚMPOD, Dr. Richard Warshak (2014), Prof. William Fabricius & Prof. Go Woon Suh (2017).
14. **Všeobecný disclaimer & Etika:**
    - Amber box v úvodu i finální disclaimer zdůrazňující edukativní a doporučující charakter.

---

### C. ZMĚNĚNÉ SOUBORY
- `src/components/public/CareHubPublicLandingView.tsx` *(Rozšířené UI)*
- `src/tests/careHubPublicView.test.ts` *(Rozšířené testy 12/12)*
- `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02C-CARE-CONTENT.md` *(Tento dokument)*
- `CHANGELOG.md`

---

### D. FUNKČNOST A SECURITY (P0–P3)
- **Checklist:** Plně funkční interaktivní stav uložený v `localStorage`, bez odesílání dat na backend.
- **Print / PDF:** Podpora `window.print()` s CSS třídami `print:hidden` pro čitelný tisk bez rušivých tlačítkových prvků.
- **CTA:** Nepřihlášený uživatel je směrován na `/login`, přihlášený na `/portal/pece`.
- **Security P0–P3:** **Clean (0 nálezů)**. Žádná soukromá data spisu (`UserCase`, `CaseChild`, `UserChild`), 0 leaku PII, 0 secrets, 0 authorization bypass.

---

### E. VÝSLEDKY TESTŮ A BUILDU

1. **Vitest Unit Testy:**
   - **PŘÍKAZ:** `npx vitest run src/tests/careHubPublicView.test.ts src/tests/psychologieView.test.ts`
   - **VÝSLEDKY:** `21 passed (21/21)` — 100% testů uspělo.

2. **Typecheck & Lint:**
   - **PŘÍKAZ:** `npm run lint` (`tsc --noEmit`)
   - **VÝSLEDKY:** `0 errors` — TypeScript kontrola proběhla čistě bez chyb.

3. **Produkční Build:**
   - **PŘÍKAZ:** `npm run build`
   - **VÝSLEDKY:** Build proběhl úspěšně bez chyb.

---

### F. DEV3 RUNTIME
- `GET https://dev3.tatovacesta.cz/pece` ➔ Plně funkční rozšířená veřejná landing page bez vyžadování přihlášení.
- `GET https://dev3.tatovacesta.cz/portal/pece` ➔ Chráněná privátní zóna CareHub.
- `GET https://dev3.tatovacesta.cz/psychologie` ➔ Bez regrese.

---

### G. GIT STAV
- `git status` ➔ `Git verification BLOCKED — repository není v aktuálním runtime prostředí dostupné` (absence složky `.git` v kontejneru Cloud Run).
- **Potvrzení:** NO COMMIT, NO PUSH, NO MERGE, NO PRODUCTION DEPLOYMENT.

---

### H. ZÁVĚREČNÝ STATUS
🟢 **PASS** — Obsah veřejné stránky `/pece` byl úspěšně rozšířen v souladu se všemi metodickými, etickými a bezpečnostními požadavky.
