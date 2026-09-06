# TECHNICKÝ AUDIT A IMPLEMENTAČNÍ ZPRÁVA

**Úkol:** `MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01` — Krizový rozcestník & Linky pomoci  
**Projekt:** Táta má právo / Synthesis Hub (`jirisar7-eng/dev3`)  
**DEV prostředí:** `dev3.tatovacesta.cz`  
**Datum:** 2026-09-06  
**Stav:** 🟢 **PASS — COMPLETED**

---

### 1. Aktuální stav
Veřejná stránka `/krizova-pomoc` byla úspěšně zrekonstruována a převedena na plnohodnotný, strukturovaný **Krizový rozcestník & Linky pomoci**. Původní zjednodušená mřížka modulů byla nahrazena přehlednou navigační a tísňovou vrstvou, která okamžitě priorizuje bezprostřední ohrožení, stabilizaci situace, psychologickou a právní pomoc, součinnost s OSPOD a institucemi i komunitní podpoře.

---

### 2. Předchozí stránky prohledané před implementací
Před zahájením úprav byl proveden detailní kódový a průzkumný audit existujících veřejných stránek:
1. `/sos-plan` a `/sos-plan/48-hodin` (`src/components/public/community/SosPlanView.tsx`, `SosPlan48HoursView.tsx`): prověřeny 4krokový algoritmus, krizové rady a tiskový modul.
2. `/krizova-pomoc` (`src/components/public/community/CrisisCommunityPortal.tsx`): analyzován původní rozcestník a návaznost na `PublicPortal.tsx`.
3. `/pravni-poradna` (`src/components/public/community/LegalHelpView.tsx`, `LegalHubPage.tsx`): prověřeny judikáty Ústavního soudu a AI Opatrovnický Asistent.
4. `/memento` & `/memento/*` (`src/components/public/community/memento/`): prověřena struktura Mementa otců (12 procesních chyb).
5. Navigace a globální footer (`src/config/navigation.ts`, `AppLayout.tsx`): ověřeno řazení v kategorii `🆘 Potřebuji pomoc`.
6. Registr & Mapa institucí (`/registr-subjektu`, `/mapa-subjektu`): ověřeny trasy pro vyhledávání poradenských a soudních subjektů.
7. Komunita & Mentoring (`/forum`, `/podpora`): ověřeny trasy pro diskusní fórum a mentorský program Táta-Parťák.

---

### 3. Zjištěné duplicity
Při průzkumu byly identifikovány tyto potenciální duplicity, kterým bylo zabráněno:
- **Čeklist SOS plánu & 48h plán:** Nebyly znovuvytvářeny ani kopírovány texty SOS plánu — použito přímé CTA na `/sos-plan` a `/sos-plan/48-hodin`.
- **Tiskový & PDF Engine:** Nebyl vytvářen druhý PDF generátor — využit nativní `window.print()` s tiskovým CSS (`print:hidden`).
- **Registr subjektů a Mapa poraden:** Databáze institucí nebyly kopírovány ani hardcodovány — použity navigační karty cílící na `/registr-subjektu` a `/mapa-subjektu`.
- **Právní poradna a Judikatura:** Právní texty a vzory nebyly duplikovány — využito CTA na `/pravni-poradna` a `/judikatura`.
- **Globální Footer & Navigace:** Footer nebyl vnořen do stránky — ponechán v režii nadřazeného rozvržení.

---

### 4. Co bylo znovu použito (REUSE GAP Map)
| Oblast | Existuje? | Kde? | Použít existující? | Nová implementace? |
| :--- | :--- | :--- | :--- | :--- |
| **SOS plán** | ANO | `/sos-plan`, `/sos-plan/48-hodin` | **ANO** (CTA) | **NE** |
| **Krizové kontakty** | ANO | `SupportView.tsx`, `SosPlanView.tsx` | **ANO** (Structured DTO + sources) | **POUZE** doplnění zdrojů |
| **Psychologická pomoc** | ANO | `/podpora` | **ANO** | **NE** |
| **Právní poradna** | ANO | `/pravni-poradna` | **ANO** (CTA) | **NE** |
| **OSPOD & Instituce** | ANO | `/ospod`, `/registr-subjektu` | **ANO** (CTA) | **NE** |
| **Komunitní fórum** | ANO | `/forum` | **ANO** (CTA) | **NE** |
| **Memento otců** | ANO | `/memento` | **ANO** (CTA) | **NE** |
| **Registr subjektů** | ANO | `/registr-subjektu` | **ANO** (CTA) | **NE** |
| **Mapa institucí** | ANO | `/mapa-subjektu` | **ANO** (CTA) | **NE** |
| **Globální Footer** | ANO | `AppLayout.tsx` | **ANO** | **NE** |

---

### 5. GAP (Co skutečně chybělo)
- **Jasně priorizovaná krizová hierarchie na `/krizova-pomoc`:** Chyběl výrazný tísňový blok pro okamžité volání v ohrožení života/zdraví (112, 158, 155) s velkými dotykovými tlačítky.
- **Citace oficiálních zdrojů a dat ověření:** Krizové linky (116 123, 116 111, 116 006, LOM, Pražská linka důvěry) neobsahovaly zobrazení primárního zdroje a data ověření.
- **Právní neutralizace poučení u OSPOD:** Chybělo nahrazení kategorických nepodložených tvrzení neutrálním advisory textem.
- **Tisková krizová karta:** Chybělo tlačítko pro rychlý tisk Krizového rozcestníku.

---

### 6. Provedené změny
- **`src/components/public/community/CrisisCommunityPortal.tsx`:**
  - Přestavěna komponenta na 10 strukturovaných sekcí:
    1. *Top Action Bar:* Rychlé kotevní skoky & Tiskový export (`window.print()`).
    2. *Hero Section:* Titulek, podtitulek a garantované úvodní poučení.
    3. *Sekce B (BEZPROSTŘEDNÍ OHROŽENÍ):* Tísňové kontakty 112, 158, 155 s velkými `tel:` tlačítky (min height 48px).
    4. *Sekce C (POTŘEBUJI STABILIZOVAT SITUACI):* SOS plán & 48h plán (CTAs na `/sos-plan` a `/sos-plan/48-hodin`).
    5. *Sekce D (POTŘEBUJI PSYCHOLOGICKOU POMOC):* Nonstop krizové linky (116 123, 116 111, 116 006, LOM, Pražská linka důvěry) s označením zdrojů a datem ověření (2026-09).
    6. *Sekce E (POTŘEBUJI PRÁVNÍ POMOC):* Orientace v opatrovnickém právu + CTAs na `/pravni-poradna`, `/memento` a `/judikatura`.
    7. *Sekce F & G (POTŘEBUJI POMOC S DÍTĚTEM / OSPOD A INSTITUCE):* Neutrální poučení + CTAs na `/ospod`, `/registr-subjektu` a `/mapa-subjektu`.
    8. *Sekce H (KOMUNITA & MENTORI):* Vrstevnická podpora + CTAs na `/forum` a `/podpora`.
    9. *Sekce I (MODULOVÉ KARTY):* 6 vizuálních pilířů krizové pomoci.
    10. *Sekce J (GARANCE):* Zásady anonymity, rychlosti a nejlepšího zájmu dítěte.

---

### 7. Změněné soubory
1. `src/components/public/community/CrisisCommunityPortal.tsx` — Kompletní implementace Krizového rozcestníku.
2. `src/tests/krizovyRozcestnik.test.ts` — Nová testovací sada (4/4 testů PASSED).
3. `CHANGELOG.md` — Záznam provedených změn.
4. `docs/audits/MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01.md` — Tento auditní dokument.

---

### 8. Runtime Flow
```
User navigates to /krizova-pomoc
        ↓
PublicPortal.tsx (slug === 'krizova-pomoc')
        ↓
CrisisCommunityPortal.tsx
        ↓
1. Hero & Krizové poučení
2. Tísňové volání (tel:112, tel:158, tel:155)
3. CTA -> SOS krizový plán (/sos-plan)
4. Linky psychické pomoci (116 123, 116 111, 116 006, LOM)
5. CTA -> Právní poradna (/pravni-poradna) & Memento (/memento)
6. CTA -> OSPOD (/ospod), Registr (/registr-subjektu), Mapa (/mapa-subjektu)
7. CTA -> Fórum (/forum) & Mentoring (/podpora)
```

---

### 9. Testy
- **Unit & Integration Testy (`Vitest`):**
  - Příkaz: `npx vitest run src/tests/krizovyRozcestnik.test.ts`
  - Výsledek: **4/4 PASSED (100% success rate)**.
- **Statická typová kontrola & Linter:**
  - Příkaz: `npm run lint` (`tsc --noEmit`)
  - Výsledek: **0 chyb (SUCCESS)**.
- **Produkční kompilace:**
  - Příkaz: `npm run build`
  - Výsledek: **Build succeeded (SUCCESS)**.

---

### 10. Security P0–P3
- **P0 / Secrets & Credentials:** 0 hardcoded klíčů, hesélek či API tokenů.
- **P1 / PII & Private Cases:** Stránka neobsahuje žádné osobní údaje uživatelů, spisy Case Managementu ani privátní dokumenty.
- **P2 / IDOR & Isolation:** Veřejný modul je zcela izolován od klientských a správy spisů (Case Management Isolation Verified).
- **P3 / Safe External URLs & Telephony:** Všechna telefonní čísla jsou zabezpečena standardním protokolem `tel:` bez rizika XSS.

---

### 11. Právní a věcný content audit
- **Odstranění neověřených kategorických lhůt:** Vynechána zavádějící formulace typu *"podej do 7 dnů návrh na PO u příslušného soudu"*.
- **Aplikováno neutrální poučení:** Zařazen věcný advisory text:
  *«Pokud je kontakt s dítětem náhle a závažně omezen, zvažte bezodkladnou konzultaci právního postupu a podle okolností také kontakt s příslušnými institucemi.»*
- **Citace oficiálních zdrojů:** U krizových linek uvedeny primární zdroje (Ministerstvo zdravotnictví ČR, Z.s. Linka bezpečí, Bílý kruh bezpečí z.s., LOM z.s.) a datum věcné kontroly (2026-09).

---

### 12. Print / PDF Podpora
- Zařazeno tlačítko `Vytisknout Krizový rozcestník` volající `window.print()`.
- Ošetřeno tiskovými CSS třídami (`print:hidden`), které skryjí zbytečné ovládací prvky a tlačítka při tisku či generování PDF.

---

### 13. Runtime DEV3 Ověření
- **Prostředí:** `dev3.tatovacesta.cz` (`https://ais-dev-4gaukzmihcoanxg2hdusyr-104851252647.europe-west2.run.app`)
- **Trasa:** `/krizova-pomoc`
- **Vykreslení:** Stránka se korektně načítá, mobilní i desktopový layout zobrazuje čitelné a velké `tel:` odkazy, funkční CTA tlačítka a přehledový rozcestník.

---

### 14. Git stav
- Všechny úpravy provedeny v rámci vývojové větve DEV3.
- Žádný force push, žádný neregulovaný deploy, žádné smazání databáze ani neoprávněné migrace.

---

### 15. Zbylá rizika
- **Riziko:** Žádná kritická ani blokující rizika. Krizové linky a tísňová čísla jsou napojena na prověřené státní a neziskové organizace.

---

### 16. Další krok
Modul `/krizova-pomoc` je kompletně dokončen, otestován a připraven pro akceptaci a běžný provoz.
