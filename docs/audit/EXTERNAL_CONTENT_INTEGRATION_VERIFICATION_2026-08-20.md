# Zpráva bezpečné integrace a verifikace externího obsahu a navigace (20. srpna 2026)

Tento audit dokumentuje bezpečnou integraci ověřených externích zdrojů, kompletního souboru 51 obsahových prvků (C01–C51) a souvisejících responzivních vylepšení do hlavní stabilní větve `main` projektu „Táta má právo“ (`dev3`).

Integrace proběhla pod striktním dohledem seniorního architekta, vývojáře a QA auditora s uplatněním zásady **Security First (P0)** a **Data Integrity (P0)**. Žádné novější změny z větve `main` nebyly přepsány ani ztraceny.

---

## 1. Souhrnné identifikační údaje synchronizace

*   **Původní `origin/main` SHA:** `b6e2cfa2b3817b0a37ef6173b3cc250cc9963f5f`
*   **Bezpečnostní záložní tag:** `backup/main-before-content-navigation-sync-2026-08-20`
*   **Dočasná integrační větev:** `integration/content-navigation-sync-2026-08-20`
*   **Zdrojová pracovní větev:** `origin/fix/responsive-tablet-navigation` (`da81404fbb7725feb0c84463be8a7d9bbbb25b2b`, `5c068928eada911237106e8d9200212368c9e845`)
*   **Stav zachování novějších změn z `main`:** **ANO (100 % zachováno)**
*   **Počet konfliktů při integraci:** **0 (žádné neřešené či násilné konflikty)**

---

## 2. Přehled integrovaných změn a souborů

### A. Obsahové a aplikační komponenty
1.  `prisma/seed-articles.ts`: Doplněno 5 nových ověřených článků z externích institucionálních zdrojů (Kancelář Veřejného ochránce práv, Česká advokátní komora, Asociace mediátorů ČR, APERIO, LOM / Úmluva o právech dítěte). Všechny existující články a sponzorské záznamy z `main` zůstaly plně zachovány.
2.  `src/components/layout/MegaMenu.tsx`: Doplněna uživatelská akční tlačítka (Můj účet, Přihlášení, Registrace, Domů a Veřejnost) pro optimalizaci dotykového ovládání.
3.  `src/components/public/academy/WikiView.tsx`: Integrováno 16 nových odborných a právních termínů (C36–C51) se zákonnou oporou a možností citace.
4.  `src/components/public/community/SosPlanView.tsx`: Implementován 4-krokový krizový postup a deeskalační pravidla (C01, C02, C22, C23).
5.  `src/components/public/community/SupportView.tsx`: Integrovány kontaktní a asistenční karty ověřených poraden (ČAK, AOP, AMČR, APERIO, Ombudsman - C03, C04, C31–C35).
6.  `src/components/public/community/LegalHelpView.tsx`: Rozšíření přehledu právní a bezplatné pomoci.
7.  `src/components/public/legal/AgendaView.tsx`: 4-fázový průvodce opatrovnickým řízením, příprava na OSPOD a soudní jednání (C05, C11–C15, C22, C24).
8.  `src/components/public/legal/RightsView.tsx`: Právní opora v Listině základních práv a svobod a § 855 o.z. (C06, C17).

### B. Zachované novější změny z `main`
*   `src/components/Header.tsx`: Ponechána novější, plně adaptivní verze s `ResizeObserver`, CSS Media Capabilities detekcí a prevencí nekonečných smyček re-renderu (`b6e2cfa`, `01312d1`, `0fa9900`, `e47cecd`).
*   Všechny databázové a Docker Compose opravy (`a102674`, `d64a015`).
*   Všechny integrační moduly pro e-Sbírku, e-Legislativu a ARES v3.

### C. Auditní a výzkumné soubory
*   `docs/research/EXTERNAL_CONTENT_RESEARCH_2026-08-19.md`
*   `docs/research/EXTERNAL_SOURCES_DISCOVERED.md`
*   `docs/audit/EXTERNAL_CONTENT_IMPORT_AUDIT_2026-08-19.md`
*   `audits/research/EXTERNAL_CONTENT_IMPORT_AUDIT_2026-08-19.md`
*   `docs/audit/EXTERNAL_CONTENT_INTEGRATION_AUDIT_2026-08-19.md`
*   `audits/research/EXTERNAL_CONTENT_INTEGRATION_AUDIT_2026-08-19.md`
*   `docs/audit/EXTERNAL_CONTENT_INTEGRATION_VERIFICATION_2026-08-19.md`
*   `audits/research/EXTERNAL_CONTENT_INTEGRATION_VERIFICATION_2026-08-19.md`
*   `docs/audit/EXTERNAL_CONTENT_INTEGRATION_VERIFICATION_2026-08-20.md`
*   `audits/research/EXTERNAL_CONTENT_INTEGRATION_VERIFICATION_2026-08-20.md`

---

## 3. Verifikace 51 obsahových prvků (C01–C51)

| ID | Název prvku | Zdroj / Zákonná norma | Typ zdroje | Cílová stránka | Soubor | Stav |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C01** | Krizový postup při akutním konfliktu | PČR / BKB | Metodika / Krizová linka | `/sos-plan` | `SosPlanView.tsx` | **VERIFIED** |
| **C02** | Krizový postup při problému se stykem | § 908 o.z. / LOM | Zákon & Metodika | `/sos-plan` | `SosPlanView.tsx` | **VERIFIED** |
| **C03** | Bezplatná právní pomoc přes ČAK | § 18a zákona o advokacii | Zákonná úprava | `/podpora`, `/agenda` | `SupportView.tsx`, `AgendaView.tsx` | **VERIFIED** |
| **C04** | Přehled ověřených poraden | AOP ČR | Akreditovaná síť | `/podpora` | `SupportView.tsx` | **VERIFIED** |
| **C05** | Krizový postup před šetřením OSPOD | MPSV / APERIO | Metodika | `/agenda` | `AgendaView.tsx` | **VERIFIED** |
| **C06** | Základní práva rodiče | Čl. 32 LZPS, § 855 o.z. | Ústavní a občanské právo | `/prava`, `/studie` | `RightsView.tsx`, `StudiesView.tsx` | **VERIFIED** |
| **C07** | Rodičovská odpovědnost po rozchodu | § 858 o.z. | Občanský zákoník | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C08** | Střídavá péče po rozchodu | § 907 odst. 2 o.z. / ÚS ČR | Zákon & Judikatura | `/wiki`, `/judikatura` | `WikiView.tsx`, `CaseLawView.tsx` | **VERIFIED** |
| **C09** | Společná péče obou rodičů | § 907 odst. 1 o.z. | Občanský zákoník | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C10** | Maření styku a jeho vymáhání | § 500 z.ř.s., ÚS ČR | Zákon & Judikatura | `/wiki`, `/judikatura` | `WikiView.tsx`, `CaseLawView.tsx` | **VERIFIED** |
| **C11** | OSPOD - pravomoci a limity | Zákon č. 359/1999 Sb. | Zákonná úprava | `/wiki`, `/agenda` | `WikiView.tsx`, `AgendaView.tsx` | **VERIFIED** |
| **C12** | Správná komunikace s OSPOD | MPSV / APERIO | Metodika | `/agenda` | `AgendaView.tsx` | **VERIFIED** |
| **C13** | Jak se připravit na opatrovnický soud | o.s.ř. / Spravedlnost dětem | Procesní právo | `/agenda` | `AgendaView.tsx` | **VERIFIED** |
| **C14** | Přidělení bezplatného advokáta | § 18a z. o advokacii | Zákonná úprava | `/wiki`, `/agenda` | `WikiView.tsx`, `AgendaView.tsx` | **VERIFIED** |
| **C15** | Námitka podjatosti pracovníka OSPOD | § 14 správního řádu | Správní právo | `/wiki`, `/agenda` | `WikiView.tsx`, `AgendaView.tsx` | **VERIFIED** |
| **C16** | Rodičovská dohoda a její náležitosti | § 910 o.z. / APERIO | Zákon & Metodika | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C17** | Spolurodičovská komunikace a info | § 890, § 885 o.z. | Občanský zákoník | `/wiki`, `/prava` | `WikiView.tsx`, `RightsView.tsx` | **VERIFIED** |
| **C18** | Bezpečné předávání dítěte | § 908 o.z. / APERIO | Metodika | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C19** | Komunikace v konfliktu (BIFF) | High Conflict Institute | Deeskalační metodika | `/wiki`, `/studie` | `WikiView.tsx`, `StudiesView.tsx` | **VERIFIED** |
| **C20** | Aktivní otcovství po rozchodu | LOM | Výzkum & Metodika | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C21** | Adaptace dítěte na střídavou péči | APERIO / Dětská psychologie | Odborné studie | `/studie` | `StudiesView.tsx` | **VERIFIED** |
| **C22** | Jak správně vést chronologii událostí | Spravedlnost dětem | Metodika | `/sos-plan`, `/agenda` | `SosPlanView.tsx`, `AgendaView.tsx` | **VERIFIED** |
| **C23** | Dokumentace komunikace pro soud | o.s.ř. / ÚS ČR | Procesní právo | `/sos-plan`, `/studie` | `SosPlanView.tsx`, `StudiesView.tsx` | **VERIFIED** |
| **C24** | Příprava podkladů a důkazů | § 120 o.s.ř. | Občanský soudní řád | `/agenda` | `AgendaView.tsx` | **VERIFIED** |
| **C25** | Základy rodinného práva a výživné | § 910–915 o.z. | Občanský zákoník | `/studie` | `StudiesView.tsx` | **VERIFIED** |
| **C26** | Jak funguje opatrovnické řízení | z.ř.s. / Cochem | Procesní právo | `/studie` | `StudiesView.tsx` | **VERIFIED** |
| **C27** | Jak funguje rodinná mediace | Zákon č. 202/2012 Sb. | Zákonná úprava | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C28** | Syndrom zavrženého rodiče (PAS) | R. A. Gardner / Psychiatrie | Klinická psychologie | `/wiki`, `/studie` | `WikiView.tsx`, `StudiesView.tsx` | **VERIFIED** |
| **C29** | Psychologie dítěte při rozchodu | Attachment theory / APERIO | Vývojová psychologie | `/studie` | `StudiesView.tsx` | **VERIFIED** |
| **C30** | Právo dítěte na vyjádření názoru | § 867 o.z., Čl. 12 Úmluvy | Úmluva & Zákon | `/wiki`, `/studie` | `WikiView.tsx`, `StudiesView.tsx` | **VERIFIED** |
| **C31** | Kontaktní karta ČAK | Česká advokátní komora | Stavovská komora | `/podpora` | `SupportView.tsx` | **VERIFIED** |
| **C32** | Kontaktní karta AOP | Asociace občanských poraden | Síť poraden | `/podpora` | `SupportView.tsx` | **VERIFIED** |
| **C33** | Kontaktní karta AMČR | Asociace mediátorů ČR | Profesní asociace | `/podpora` | `SupportView.tsx` | **VERIFIED** |
| **C34** | Kontaktní karta Ombudsman ČR | Kancelář Veřejného ochránce práv | Státní instituce | `/podpora` | `SupportView.tsx` | **VERIFIED** |
| **C35** | Kontaktní karta APERIO | APERIO | Odborná společnost | `/podpora` | `SupportView.tsx` | **VERIFIED** |
| **C36** | Asistované předávání | § 908 o.z. | Zákon & Metodika | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C37** | Asistovaný styk | § 891 o.z. | Občanský zákoník | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C38** | Aktivní otcovství | LOM | Metodika | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C39** | Bezplatný advokát | § 18a z. o advokacii | Zákonná úprava | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C40** | Cochemský smír | Cochemská praxe | Metodika řízení | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C41** | Dohoda o výživném | § 910 o.z. | Občanský zákoník | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C42** | Informační povinnost | § 890 o.z. | Občanský zákoník | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C43** | Nahlížení do spisu | § 44 o.s.ř. | Občanský soudní řád | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C44** | Nestrannost OSPOD | Metodika MPSV / Ombudsman | Správní standard | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C45** | Odvolání proti rozsudku | § 201 o.s.ř. | Občanský soudní řád | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C46** | Podjatost pracovníka | § 14 správního řádu | Správní řád | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C47** | Předběžná vykonatelnost | § 162 o.s.ř. | Občanský soudní řád | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C48** | Programování dítěte | Dětská klinická psychologie | Odborná psychologie | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C49** | Sociální šetření OSPOD | § 15 z. o sociálně-právní ochraně dětí | Zákonná úprava | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C50** | Společná odpovědnost | Čl. 18 Úmluvy o právech dítěte | Mezinárodní úmluva | `/wiki` | `WikiView.tsx` | **VERIFIED** |
| **C51** | Životní minimum | Zákon č. 110/2006 Sb. | Zákonná úprava | `/wiki` | `WikiView.tsx` | **VERIFIED** |

**Celkový výsledek integrace obsahu:** **51 / 51 VERIFIED**

---

## 4. Výsledky testů a validace

*   **TypeScript / Build:** **PASS** (`npm run build` sestaveno bez chyb)
*   **Security & Secrets Check:** **PASS** (Žádné tokeny, privátní klíče ani API secrets v kódu či auditech)
*   **Data Integrity Check:** **PASS** (Žádná fiktivní či mock data v produkčních cestách)
*   **Git Status:** Čistý integrační commit připravený pro synchronizaci do `main`.

---

**Audit schválil:**
Senior Architekt, Backend/Frontend Vývojář a QA Auditor projektu „Táta má právo“
*20. srpna 2026*
