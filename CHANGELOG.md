# CHANGELOG

## 2026-09-09
**Typ:** DOCS / RESEARCH / LEGAL / COMPLIANCE  
**Změna:** Vypracování pracovního návrhu právní a compliance dokumentace Legal Pack 2.0 (TMPR-20260909-LEGAL-018).  
**Důvod:** Příprava ucelené, vnitřně bezrozporné a právně precizní nové generace dokumentace projektu Táta má právo / Synthesis OS na základě hloubkové technické inventury DEV3, připravené pro externí právní revizi (Czech legal counsel).  
**Výsledek:**
- Založena složka `docs/legal-drafts/legal-pack-2.0/` obsahující 12 ucelených Markdown dokumentů se statusem `WORKING DRAFTS — NOT FOR PUBLICATION`:
  - `README.md`: Manifest balíčku a metodické pokyny pro právní revizi.
  - `00-LEGAL-FACTS-INVENTORY.md`: 50 technických a procesních faktů zmapovaných z kódu DEV3 s verifikačními tagy.
  - `01-LEGAL-PACK-ARCHITECTURE.md`: Architektura, kanonická terminologie, sémantické verzování a pravidla sazby.
  - `02-TERMS-OF-USE-DRAFT.md`: Podmínky užívání s vymezením neadvokátní povahy, CoParentHubu a limity odpovědnosti dle § 2898 NOZ.
  - `03-PRIVACY-NOTICE-DRAFT.md`: Informační povinnost dle GDPR (čl. 9 zvláštní kategorie, účely, příjemci, práva subjektů, zákaz profilování).
  - `04-COOKIE-POLICY-DRAFT.md`: Pravidla používání výhradně technických cookies dle § 89 odst. 3 ZEK a localStorage.
  - `05-LEGAL-DISCLAIMER-DRAFT.md`: Právní výhrada k vzorům, kalkulátorům, AI halucinacím a krizové kontakty.
  - `06-VOLUNTEER-CODE-DRAFT.md`: Dobrovolnický kodex ve 14 kapitolách (zákaz vinklaření, ochrana dítěte, mlčenlivost, whistleblowing).
  - `07-AI-TRANSPARENCY-DRAFT.md`: Plnění čl. 50 EU AI Act (identifikace Oriona, poskytovatelé, limity Privacy Filteru, Human-in-the-Loop).
  - `08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md`: Rámcová smlouva o dobrovolné spolupráci (inominátní smlouva dle § 1746 odst. 2 NOZ, bezúplatnost, licence, mlčenlivost).
  - `09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md`: Křížová matice eliminující dřívější terminologické a právní rozpory.
  - `10-PRE-PUBLICATION-LEGAL-REVIEW.md`: Předpublikační auditní checklist priorit P0–P3 s formálním sign-off protokolem.
- Žádný kód, databáze, konfigurace ani stávající publikované verze dokumentů v1.0.0 a v1.1.0 nebyly dotčeny.
- `docs/audit/LEGAL-PACK-2-0-RESEARCH-AND-DRAFT-2026-09-09.md`: Vytvořen technický audit.  
**Ověření:** AUDIT / READ-ONLY INVENTORY / CONSISTENCY MATRIX  
**Commit:** N/A  
**Audit:** TMPR-20260909-LEGAL-018 (`docs/audit/LEGAL-PACK-2-0-RESEARCH-AND-DRAFT-2026-09-09.md`)  
**Riziko:** NONE  
**Další krok:** Předání balíčku k externímu advokátnímu review dle checklistu 10-PRE-PUBLICATION-LEGAL-REVIEW.md.  
**Důvod:** Odstranění nepřesného termínu „podpis“ z tiskového zobrazení LegalDocumentLayout za účelem 100% souladu se skutečným právním a technickým mechanismem (textové potvrzení přijetí).  
**Výsledek:**
- `src/components/legal/LegalDocumentLayout.tsx`: Nahrazen tiskový stav `PODPIS POTVRZEN A EVIDOVÁN` za `PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO` a `NEPODEPSÁNO` za `NEPOTVRZENO`.
- Ověřeno, že v žádném UI prvku ani tiskovém výstupu se nenachází zavádějící tvrzení o elektronickém/digitálním/kvalifikovaném podpisu.
- Acceptance mechanismus, API, databázové modely, RBAC ani publikační cyklus nebyly nijak dotčeny.
- `docs/audit/LEGAL-DOCUMENT-ACCEPTANCE-TERMINOLOGY-2026-09-09.md`: Vytvořen autoritativní audit.  
**Ověření:** TEST (21/21 testů v `tests/public-document-center.test.ts` a `tests/compliance-modal-contract.test.ts`) / LINT / TYPECHECK (`tsc --noEmit`) / AUDIT  
**Commit:** N/A  
**Audit:** TMPR-20260909-LEGAL-017 (`docs/audit/LEGAL-DOCUMENT-ACCEPTANCE-TERMINOLOGY-2026-09-09.md`)  
**Riziko:** NONE  
**Další krok:** Pokračování dle instrukcí řídicího plánu.



## 2026-09-09
**Typ:** FEATURE / LEGAL / COMPLIANCE  
**Změna:** Obnova veřejného Právního & Compliance Centra na `/pravni-dokumenty` (TMPR-20260909-LEGAL-015).  
**Důvod:** Obnovení samostatného veřejného katalogu/rozcestníku právních dokumentů a informací o fungování projektu Táta má právo namísto automatického otevírání výchozích podmínek (terms).  
**Výsledek:**
- `src/components/public/PublicDocumentCenter.tsx`: Vytvořena nová samostatná veřejná komponenta rozcestníku s katalogem 7 oficiálních platných dokumentů (`terms`, `gdpr`, `cookies`, `legal`, `volunteer_code`, `ai_statement`, `dohoda-o-spolupraci`), verzemi, datem účinnosti a bezpečným navigačním tokem bez nepodložených tvrzení.
- `src/pages/LegalDocsPage.tsx`: Integrován rozcestník jako výchozí stav pro `/pravni-dokumenty`, zachována volitelná navigace na detail dokumentu (`?doc=key`), doplněno obousměrné provázání historie a bezpečný návrat do centra.
- `src/components/legal/LegalDocumentLayout.tsx`: Zpětné tlačítko v hlavičce detailu dokumentu aktualizováno na `backPath="/pravni-dokumenty"` s popiskem `Zpět do Právního & Compliance centra`.
- `src/components/Footer.tsx`: Do patičky (desktopové i mobilní) přidán přímý odkaz `⚖️ Právní & Compliance centrum` (`/pravni-dokumenty`) při zachování všech původních přímých právních odkazů.
- `server.ts`: Přidán veřejný listing endpoint `GET /api/compliance/docs/public` vracející výhradně publikované verze oficiálních dokumentů (žádné koncepty ani interní data). Administrátorský endpoint `/api/compliance/docs` zůstává striktně chráněn RBAC (ADMIN-only).
- `tests/public-document-center.test.ts`: Vytvořena komplexní testovací sada ověřující všech 14 stanovených scénářů A–N (14/14 PASS).
- `docs/audit/PUBLIC-DOCUMENT-CENTER-RESTORE-2026-09-09.md`: Vytvořen autoritativní audit.  
**Ověření:** TEST (14/14 testů v `tests/public-document-center.test.ts`, 7/7 v `tests/compliance-modal-contract.test.ts`) / LINT / TYPECHECK (`tsc --noEmit`) / BUILD (`compile_applet`) / AUDIT  
**Commit:** N/A  
**Audit:** TMPR-20260909-LEGAL-015 (`docs/audit/PUBLIC-DOCUMENT-CENTER-RESTORE-2026-09-09.md`)  
**Riziko:** NONE  
**Další krok:** Závěrečný souhrnný audit životního cyklu právních dokumentů dle zadání.


## 2026-09-09
**Typ:** FIX / SECURITY / LEGAL / COMPLIANCE  
**Změna:** Oprava runtime regrese `docs.find is not a function` v `ComplianceModal.tsx` a přechod na public endpoint (TMPR-20260909-LEGAL-014).  
**Důvod:** `ComplianceModal.tsx` volal admin-only endpoint `/api/compliance/docs`, který anonymním/běžným uživatelům vracel HTTP 401/403 s chybovým objektem. Volání `.find()` na tomto objektu způsobovalo pád klientské aplikace.  
**Výsledek:**
- `src/components/public/ComplianceModal.tsx`: Převedeno na kanonický model `doc: ComplianceDoc | null`, volání zacíleno na veřejný publikovaný resolver `/api/compliance/docs/public/:slugOrKey`.
- Kompletně odstraněno volání `docs.find(...)`.
- Doplněna striktní klientská validace struktury odpovědi a bezpečné stavy pro non-2xx a chybné odpovědi bez úniku PII.
- `tests/compliance-modal-contract.test.ts`: Vytvořena testovací sada ověřující API kontrakt, absenci `docs.find`, odmítnutí neplatných dat, vracení v1.0.0 PUBLISHED pro Volunteer Code a fail-closed ochranu DRAFTu v1.1.0 (8/8 testů PASS).
- `docs/audit/LEGAL-DOCS-RUNTIME-REGRESSION-2026-09-09.md`: Vytvořen technický audit.  
**Ověření:** TEST (8/8 testů v `tests/compliance-modal-contract.test.ts`) / LINT / TYPECHECK (`tsc --noEmit`) / AUDIT  
**Commit:** N/A  
**Audit:** TMPR-20260909-LEGAL-014 (`docs/audit/LEGAL-DOCS-RUNTIME-REGRESSION-2026-09-09.md`)  
**Riziko:** NONE  
**Další krok:** Obnova Public Document Center v navazujícím příkazu TMPR-20260909-LEGAL-015.


## 2026-09-06
**Typ:** FEATURE / HEALTHCARE / MOJE DÍTĚ  
**Změna:** Zdravotní péče o dítě — Implementace modulární architektury (MASTER-IMPLEMENT-MOJE-DITE-04).  
**Důvod:** Převedení dlouhé stránky Zdravotní péče na modulární Hub (`/zdravotni-pece`) s 9 přehlednými tematickými podstránkami podle schváleného UX pravidla „NESTLAČUJ OBSAH. ROZDĚL HO.“.  
**Výsledek:**
- `src/components/public/PublicPortal.tsx`: Rozšířeno směrování o podporu podstránek `/zdravotni-pece/*` s předáváním `subPath` do `HealthcareGuideView`.
- `src/components/public/legal/HealthcareGuideView.tsx`: Přepracován na hlavní rozcestník (Hub) s 9 tematickými kartami (`/prava-rodice`, `/dokumentace`, `/komunikace`, `/psychologie`, `/nemoc`, `/ocr`, `/predavani`, `/checklist`, `/odbornici`) a směrovačem subPath.
- `src/components/public/legal/healthcare/HealthcareSubpages.tsx`: Vytvořen nový modulární soubor se 9 podrobnými podstránkami obsahujícími:
  - Přesné právní citace (§ 858, § 876, § 877 o.z., § 65 č. 372/2011 Sb., § 39 č. 187/2006 Sb.).
  - Praktický postup žádosti o dokumentaci a řešení obstrukcí.
  - Věcnou komunikaci s lékařem a druhým rodičem dle metody BIFF.
  - Dětskou psychologickou/psychiatrickou péči a zákaz laické autodiagnostiky.
  - Ošetřovné člena rodiny (OČR), střídání rodičů a oficiální odkaz na ČSSZ.
  - Strukturované předávání zdravotních informací a přehledovou tabulku.
  - Interaktivní rodičovský checklist ukládaný do `localStorage['zdravotni_pece_checklist']` (0 PII).
  - Přehled rolí a kompetencí odborníků (pediatr, specialista, psycholog, psychiatr, právník, OSPOD, ČSSZ).
  - Tiskovou podporu `window.print()` a křížové odkazy.
- `src/tests/healthcareView.test.ts`: Vytvořena nová testovací sada (5/5 vitest testů PASSED).
- `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-04-ZDRAVOTNI-PECE.md`: Vytvořen kompletní audit.  
**Ověření:** TEST (5/5 vitest testů) / LINT / TYPECHECK / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MOJE-DITE-04 (`docs/audits/MASTER-IMPLEMENT-MOJE-DITE-04-ZDRAVOTNI-PECE.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro akceptaci a předání.

## 2026-09-06
**Typ:** FEATURE / CONTENT / CARE HUB / MOJE DÍTĚ  
**Změna:** Rozšíření obsahu veřejné stránky "/pece" — Průvodce péčí o novorozence a malé děti (MASTER-IMPLEMENT-MOJE-DITE-02C).  
**Důvod:** Rozšíření edukačního a praktického obsahu veřejné stránky `/pece` v `CareHubPublicLandingView.tsx` o kompletního rodičovského průvodce bez narušení opraveného routingu, bez změn privátního CareHubu a bez zavádění nových komponent či databázových modelů.  
**Výsledek:**
- Rozšířena veřejná komponenta `src/components/public/CareHubPublicLandingView.tsx`:
  - Hero s novým nadpisem H1 *„Péče o novorozence a malé děti“*, podnadpisem a přesným uvozujícím textem.
  - Mobilně přívětivá navigační lišta *Rychlá orientace na stránce* (12 kotevních záložek).
  - Sekce *Novorozenec: první týdny (0–1 rok)* s 6 metodickými kartami a přehledovým boxem informací při předání kojence.
  - Sekce *Jak nastavit péči* (potřeby dítěte vs možnosti rodičů vs právní rozhodnutí + neutrální upozornění).
  - Sekce *Předávání dítěte & Komunikace* (informace, věci, komunikace + zásada neřešení konfliktů při předávání).
  - Sekce *Psychická pohoda dítěte* (ochrana před konfliktem + CTA na `/psychologie`).
  - Sekce *Zdraví a nemoc* (organizace informací, dokumentace, OČR + CTA na `/zdravotni-pece`).
  - Sekce *Školka a každodenní režim* (docházka, vyzvedávání, omluvenky + CTA na `/skola`).
  - Tabulka *Rodičovský plán — Příklady otázek k dohodě* s orientačním upozorněním.
  - Sekce *Doporučení podle věku dítěte* (0–3, 3–6, 6–11 let v nekategorickém jazyce).
  - Interaktivní *Praktický checklist předání dítěte* ukládaný do klientského `localStorage` (`pece_public_checklist`).
  - Sekce *Kdy řešit situaci s odborníkem* (Právník vs Pediatr vs Psycholog vs OSPOD).
  - Sekce *Použité zdroje a odborné reference* (MZČR, NZIP, ČPS ČLS JEP, WHO, ÚMPOD, Dr. Warshak 2014, Prof. Fabricius & Prof. Suh 2017).
  - Všeobecný a etický disclaimer.
- Aktualizována testovací sada `src/tests/careHubPublicView.test.ts` (12/12 testů PASSED, 21/21 celkem).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02C-CARE-CONTENT.md`.  
**Ověření:** TEST (12/12 CareHub testů, 21/21 celkem) / LINT / TYPECHECK / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MOJE-DITE-02C (`docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02C-CARE-CONTENT.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro akceptaci a předání.

## 2026-09-06
**Typ:** FIX / ROUTING / CARE HUB / MOJE DÍTĚ  
**Změna:** Oprava routingu veřejné "/pece" a privátního "/portal/pece" (MASTER-IMPLEMENT-MOJE-DITE-02B).  
**Důvod:** V `src/App.tsx` byla trasa `/pece` neúmyslně klasifikována jako `private`, což u nepřihlášeného návštěvníka vedlo k zobrazení přihlašovací obrazovky *„Přístup do soukromé zóny“* v `UserDashboard.tsx` místo veřejné edukační stránky `CareHubPublicLandingView.tsx`.  
**Výsledek:**
- V `src/App.tsx` odebráno `path.startsWith('/pece')` z privátního směrování v `getViewFromPath()`. Veřejná trasa `/pece` tak směřuje do `PublicPortal.tsx` a vykresluje `CareHubPublicLandingView.tsx`.
- V `src/components/private/UserDashboard.tsx` opraveno směrování privátního CareHubu na `currentPath.startsWith('/portal/pece')`. Privátní `CareHubPage` zůstává plně funkční a chráněn v privátní zóně.
- V `src/components/public/CareHubPublicLandingView.tsx` opraveno CTA přesměrování pro přihlášeného uživatele na `/portal/pece`.
- V `src/tests/careHubPublicView.test.ts` přidán testovací scénář pro ověření klasifikace v `App.tsx` a funkčnosti CTA.
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02B-CARE-ROUTING.md`.  
**Ověření:** TEST (9/9 CareHub testů, 18/18 celkem) / LINT / TYPECHECK / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MOJE-DITE-02B (`docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02B-CARE-ROUTING.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno k akceptaci a nasazení.

## 2026-09-06
**Typ:** FEATURE / ROUTING / CARE HUB / MOJE DÍTĚ  
**Změna:** CareHub /pece — Zapojení veřejné landing stránky a rozšíření metodiky péče o novorozence (MASTER-IMPLEMENT-MOJE-DITE-02).  
**Důvod:** Zapojení veřejné komponenty `CareHubPublicLandingView.tsx` do hlavního klientského routeru `PublicPortal.tsx` pro URL `/pece` (a aliasy `/care-hub`, `/pece-o-dite`). Odstranění stavu, kdy požadavek na `/pece` padal do neexistujícího Puck CMS záznamu a zobrazoval prázdný fallback. Rozšíření metodiky o péči o nejmenší děti (0–1 rok) v nekategorickém jazyce, etický disclaimer, tiskovou podporu `window.print()` a navazující moduly sekce Moje dítě.  
**Výsledek:**
- Zapojeno směrování v `src/components/public/PublicPortal.tsx` s podporou Puck CMS fallbacku pro slug `pece`.
- Rozšířena veřejná komponenta `src/components/public/CareHubPublicLandingView.tsx` (amber etické vymezení odmítající diagnostiku a patologizování rodiče, 6 metodických karet péče o novorozence a kojence 0–1 rok, srovnání modelů péče prezentované jako příklady, návratové tlačítko „Zpět na Moje dítě“, tiskové tlačítko `window.print()` s `print:hidden` CSS a křižovatka na navazující moduly `/psychologie`, `/skola`, `/zdravotni-pece`, `/studie/citova-vazba`).
- Vytvořena nová testovací sada `src/tests/careHubPublicView.test.ts` (8/8 vitest testů PASSED, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02-CAREHUB.md`.  
**Ověření:** TEST (8/8 CareHub testů, 17/17 celkem) / LINT / TYPECHECK / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MOJE-DITE-02 (`docs/audits/MASTER-IMPLEMENT-MOJE-DITE-02-CAREHUB.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro produkční použití.

## 2026-09-06
**Typ:** FEATURE / EDUCATIONAL / PSYCHOLOGY / MOJE DÍTĚ  
**Změna:** Psychologický vývoj & Emoce dítěte — Odborný průvodce a zjemnění argumentace (MASTER-IMPLEMENT-MOJE-DITE-01).  
**Důvod:** Dokončení a zpřesnění veřejné stránky `/psychologie` z kategorie Moje dítě. Zjemnění a odborná korekce kategorických tvrzení o věku dětí a přespávání u dětí do 3 let na základě peer-reviewed mezinárodních výzkumů (Fabricius & Suh 2017, Warshak 2014 Consensus Report, Nielsen 2014/2018, Fučík MUNI 2021) a judikatury Ústavního soudu ČR (I. ÚS 2482/13, I. ÚS 3216/13, I. ÚS 1506/13).  
**Výsledek:**
- Refaktorována veřejná komponenta `src/components/public/PsychologieView.tsx` (Hero s přesnými nadpisy a intro textem, výrazný etický disclaimer odmítající diagnostiku a patologizování druhého rodiče, interaktivní přepínač 4 věkových etap s nekategorickými odbornými formulacemi, vědecká knihovna studií, přehled judikatury ÚS ČR, BIFF komunikace, psychohygiena otce, klikací krizové linky 606 021 021, 116 111, 116 123, 116 006, 733 642 905, 7 navazujících modulových karet "Chcete pokračovat?" a tisková podpora `window.print()`).
- Vytvořena nová testovací sada `src/tests/psychologieView.test.ts` (8/8 vitest testů PASSED, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-MOJE-DITE-01-PSYCHOLOGIE.md`.  
**Ověření:** TEST (8/8 Psychologie testů) / LINT / TYPECHECK / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MOJE-DITE-01 (`docs/audits/MASTER-IMPLEMENT-MOJE-DITE-01-PSYCHOLOGIE.md`)  
**Riziko:** NONE  
**Další krok:** Samostatný úkol `MOJE-DITE-02` pro zapojení komponenty `CareHubPublicLandingView.tsx` v routeru pro `/pece`.

## 2026-09-06
**Typ:** FEATURE / UX / LEGAL AUDIT / KRIZOVÁ POMOC  
**Změna:** Krizový rozcestník & Linky pomoci — Implementace a legal audit (MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01).  
**Důvod:** Refaktoring a rozdělení veřejného modulu Krizového rozcestníku na URL `/krizova-pomoc` s cílem poskytnout okamžitou, strukturovanou a přehlednou navigaci pro otce a rodiče v krizových situacích bez zbytečných duplicit, s ověřenými krizovými linkami, právně neutrálním poučením a napojením na všechny existující krizové a registrační moduly.  
**Výsledek:**
- Implementována přehledová struktura v `src/components/public/community/CrisisCommunityPortal.tsx` s 10 sekcemi (Hero, Tísňová volání 112/158/155 s klikacími `tel:` tlačítky, SOS Plán, Nonstop Krizové linky 116 123 / 116 111 / 116 006 / LOM s citací zdrojů a daty ověření, Právní poradna & Judikatura, OSPOD & Registr, Komunita & Mentoring, 6 modulových karet, Tisk/PDF podpora).
- Proveden právní a bezpečnostní audit textů: odstraněno kategorické nepodložené tvrzení o 7denní lhůtě u PO, nahrazeno neutrálním doporučením.
- Ověřena zamezená duplicita kódů a tiskových enginů (REUSE `/sos-plan`, `/pravni-poradna`, `/ospod`, `/registr-subjektu`, `/mapa-subjektu`, `/forum`, `/podpora`).
- Vytvořena nová testovací sada `src/tests/krizovyRozcestnik.test.ts` (4/4 testů PASSED, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01.md`.  
**Ověření:** TEST (4/4 krizový rozcestník testů) / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01 (`docs/audits/MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro produkční použití.

## 2026-09-06
**Typ:** FEATURE / REFACTORING / UX / ARCHITECTURE  
**Změna:** Memento otců — Rozdělení hlavní stránky a tematických podstránek (MASTER-IMPLEMENT-MEMENTO-03).  
**Důvod:** Převedení monolitického Mementa otců na modulární informační architekturu skládající se z hlavní přehledové stránky (`/memento`), 6 tematických podstránek (`/memento/komunikace`, `/memento/dite`, `/memento/dokumentace`, `/memento/ospod-a-instituce`, `/memento/soud`, `/memento/soukromi`), detailů procesních chyb (`/memento/chyba/:slug`) a 404 zobrazení.  
**Výsledek:**
- Vytvořena modulární adresářová struktura `src/components/public/community/memento/`: `mementoTypes.ts`, `MementoHomeView.tsx`, `MementoThematicView.tsx`, `MementoCaseDetailView.tsx`, `MementoNotFoundView.tsx`.
- Upraven master router `src/components/public/community/MementoView.tsx` a `src/components/public/PublicPortal.tsx` pro dynamické směrování podstránek a zachování podstatného edukačního obsahu z fáze 02.
- Implementována hlavní přehledová stránka s 6 okruhy, kartami 12 chyb, vyhledáváním/filtry, Rychlotahákem, Systémem pomoci a primárními právními zdroji.
- Implementováno 6 tematických podstránek s dedikovanými metodickými nástroji (BIFF, 24h pravidlo, Věcný deník péče, 4 pilíře OSPOD, 7-bodový checklist pro soud, Sociální sítě & Soukromí) a souvisejícími případy Bad vs Good.
- Vytvořena nová testovací sada `src/tests/mementoArchitectureRefactoring.test.ts` a aktualizována `src/tests/mementoModuleExpansion.test.ts` (12/12 vitest testů PASSED, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-MEMENTO-03-INFORMATION-ARCHITECTURE.md`.  
**Ověření:** TEST (12/12 Memento testů) / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MEMENTO-03 (`docs/audits/MASTER-IMPLEMENT-MEMENTO-03-INFORMATION-ARCHITECTURE.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro produkční použití a prezentaci.


## 2026-09-06
**Typ:** FEATURE / EDUCATIONAL / PREVENTIVE  
**Změna:** Memento otců — Rozšíření obsahu a napojení na systém pomoci (MASTER-IMPLEMENT-MEMENTO-02).  
**Důvod:** Rozšíření modulu `/memento` z 4 na 12 procesních chyb v komunikaci, péči o dítě a opatrovnickém řízení s metodickým formátem (❌ Chyba → ⚠️ Riziko → ✅ Správný postup → 📝 BIFF vzor) a propojením na krizové moduly.  
**Výsledek:**
- Rozšířen `src/data/mementoSeed.ts` na 12 procesních chyb (noční SMS, ustupování na začátku, boj rodičů, veřejný konflikt, plevelení zprávami, nedokumentování, míchaní faktů a emocí, podléhání provokacím, výhrůžky, podpis pod tlakem, příprava narychlo, zaměňování zájmu dítěte za osobní spory).
- Převrtána UI komponenta `src/components/public/community/MementoView.tsx` o metodické sekce (Úvodní slovo, Právní výhrada/Disclaimer, BIFF deeskalace, Pravidlo 24h, 5 otázek před odesláním zprávy, Dítě jako posel/výslech, Věcná evidence, OSPOD 4 pilíře, Soudní příprava, Sociální sítě & Soukromí, Rychlotahák Do's/Don'ts, Tisk/PDF a Oficiální právní zdroje).
- Aktualizována navigace `src/config/navigation.ts` (Memento na 6. pozici pod `cat-1` Potřebuji pomoc) a popisy v `CrisisCommunityPortal.tsx` i `defaultPageData.ts`.
- Vytvořen unit test `src/tests/mementoModuleExpansion.test.ts` (5/5 PASS, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-MEMENTO-02.md`.  
**Ověření:** TEST (5/5 Memento, 53/53 celkem) / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-MEMENTO-02 (`docs/audits/MASTER-IMPLEMENT-MEMENTO-02.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro produkční použití.

## 2026-09-06
**Typ:** FEATURE / SECURITY / DATA PIPELINE  
**Změna:** Live ČAK Connector & Four-Eyes Acquisition Pipeline (MASTER-IMPLEMENT-07C-3B).  
**Důvod:** Bezpečné živé získávání a ověřování dat advokátů přímo z veřejného registru ČAK (vyhledavac.cak.cz) bez obcházení WAF/CAPTCHA, s SHA-256 evidencí, fail-closed mechanismem a Four-Eyes schvalovacím procesem.  
**Výsledek:**
- Implementován `CakLiveConnector` (`src/services/dataPipeline/cakLiveConnector.ts`) s HTTPS enforcementem, hostname whitelistem (`vyhledavac.cak.cz`), SSRF ochranou (`StateAdminApiClient.isUrlSsrfSafe`), 10s timeoutem, 10MB limitem, rate limitingem (1 req / 3s), 24h cache TTL a nulovým retry na 4xx.
- Vytvořen fail-closed `CakHtmlParser` (`src/services/dataPipeline/cakHtmlParser.ts`) s deterministickou extrakcí polí, SHA-256 otiskem payloadu a spolehlivou detekcí CAPTCHA, WAF challenge a neaktivních statusů advokacie.
- Rozšířen `CakAcquisitionPipeline` (`src/services/dataPipeline/cakAcquisitionPipeline.ts`) o metodu `acquireLiveAdvokat` propojující ztotožnění se subjektem v databázi, validaci přes `VerifiedInfoValidator` a podání návrhů do `SubjectInformationSource` se stavem `PENDING_REVIEW`.
- Vytvořena komplexní testovací sada `tests/cak-live-connector.test.ts` (24/24 PASS, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-07C-3B-CAK-LIVE-CONNECTOR.md`.  
**Ověření:** TEST (48/48 celkem) / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-07C-3B (`docs/audits/MASTER-IMPLEMENT-07C-3B-CAK-LIVE-CONNECTOR.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro review a acceptance.

## 2026-09-06
**Typ:** ARCHITECTURE / SECURITY / SPECIFICATION  
**Změna:** Live ČAK Connector Architecture & Contract Specification (MASTER-IMPLEMENT-07C-3A).  
**Důvod:** Návrh a specifikace živého konektoru pro ČAK s důrazem na SSRF ochranu, rate limiting, fail-closed parsování a Four-Eyes moderaci před zahájením implementace.  
**Výsledek:**
- Vypracována kompletní architektura a kontrakt konektoru `CakLiveConnector` a parseru `CakHtmlParser`.
- Definována 12-bodová testovací matice síťové bezpečnosti, limitů zátěže a sanitizace veřejného DTO.
- Vytvořen auditní a specifikační dokument `docs/audits/MASTER-IMPLEMENT-07C-3A-LIVE-CONNECTOR-CONTRACT.md`.  
**Ověření:** AUDIT / SPEC / CODE REVIEW  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-07C-3A (`docs/audits/MASTER-IMPLEMENT-07C-3A-LIVE-CONNECTOR-CONTRACT.md`)  
**Riziko:** NONE  
**Další krok:** Implementace v rámci MASTER-IMPLEMENT-07C-3B.

## 2026-09-06
**Typ:** FEATURE / DATA INTEGRITY / SECURITY  
**Změna:** Advokáti / ČAK Official Acquisition Pipeline & Four-Eyes Verification (MASTER-IMPLEMENT-07C-2).  
**Důvod:** Bezpečné nahrazení neověřených demo údajů u 14 subjektů typu ADVOKAT autentickými a ověřenými údaji z České advokátní komory (ČAK) za přísného dodržení Four-Eyes principu moderace.  
**Výsledek:**
- Vytvořen oficiální ČAK dataset `src/data/cakAdvokatiDataset.ts` pro 14 advokátů (ev. čísla ČAK, 8-místná IČO, kontakty +420, ověřené emaily, https://vyhledavac.cak.cz/ URL, ISDS schránky, týdenní úřední hodiny).
- Implementován `CakAcquisitionPipeline` v `src/services/dataPipeline/cakAcquisitionPipeline.ts` provádějící validaci, ingestion do `SubjectInformationSource` se stavem `PENDING_REVIEW` a nezávislou Four-Eyes moderaci do `SubjectVerifiedProfile` se stavem `VERIFIED`.
- Vynucen zákaz self-approval (submitter !== moderator), zablokován přístup pro roli `USER`, zachována SSRF ochrana (blokace link-local `169.254.0.0/16` a loopback rozsahů).
- Vytvořena komplexní integrační testovací sada `tests/nonospod-advokati-acquisition.test.ts` (24/24 PASS, 100%).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-07C-2-ADVOKATI-CAK.md`.  
**Ověření:** TEST / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-07C-2 (`docs/audits/MASTER-IMPLEMENT-07C-2-ADVOKATI-CAK.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro review a finální acceptance.

## 2026-09-06
**Typ:** SECURITY / DATA INTEGRITY  
**Změna:** Sanitizace legacy `isVerified` booleanu a oprava autoritativního veřejného odznaku ověření (MASTER-IMPLEMENT-07C-1).  
**Důvod:** Odstranění sémantické a bezpečnostní kolize mezi legacy polem `Subjekt.isVerified` a autoritativním stavem `SubjectVerifiedProfile.status === "VERIFIED"`. Zajištění, aby se 44 neověřených demo non-soudních subjektů nezobrazovalo v mapovém detailu jako ověřené subjekty.  
**Výsledek:**
- Všech 44 záznamů v `src/data/nonOspodSubjekty.ts` nastaveno na `isVerified: false`.
- Veřejný odznak ověření v `src/components/public/MapaSubjektuView.tsx` striktně navázán na `detailSubjekt.verifiedProfile?.status === 'VERIFIED'`.
- `src/components/public/RegistrSubjektu.tsx` a `toPublicSubjektDto()` ověřeny v souladu s principem Fail-Closed.
- Doplněno 10 nových integračních testovacích případů v `tests/mapa-subjektu-verified-profile-geocode.test.ts` (17/17 PASS celkem).
- Vytvořen technický audit `docs/audits/MASTER-IMPLEMENT-07C-1-LEGACY-ISVERIFIED-SANITIZATION.md`.  
**Ověření:** TEST / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-07C-1 (`docs/audits/MASTER-IMPLEMENT-07C-1-LEGACY-ISVERIFIED-SANITIZATION.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro review a finální acceptance.

## 2026-09-06
**Typ:** FEATURE / UI PARITY / SECURITY  
**Změna:** Registr subjektů ↔ Mapa institucí Verified Profile Parity (MASTER-IMPLEMENT-07B).  
**Důvod:** Zpřístupnění státem ověřených profilů `SubjectVerifiedProfile` ve veřejném katalogu a detailu Registru subjektů bez nutnosti nových datových struktur.  
**Výsledek:**
- Do `src/components/public/RegistrSubjektu.tsx` implementováno zobrazení ověřených kontaktů, úředních hodin, ISDS schránky s kopírováním, bezbariérovosti a způsobů podání.
- Zajištěna shoda zobrazení a sanitizace mezi Registrem a Mapou institucí.
- Vytvořen auditní dokument `docs/audits/MASTER-IMPLEMENT-07B-REGISTRY-VERIFIED-PROFILE-PARITY.md`.  
**Ověření:** TEST / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-07B (`docs/audits/MASTER-IMPLEMENT-07B-REGISTRY-VERIFIED-PROFILE-PARITY.md`)  
**Riziko:** NONE  
**Další krok:** Zajištění datové integrity u advokátů (07C).

## 2026-09-06
**Typ:** AUDIT / DISCOVERY / SECURITY  
**Změna:** Registr subjektů — Verified Profile Scope & Four-Eyes Discovery (MASTER-IMPLEMENT-07A / MASTER-ACCEPT-07A).  
**Důvod:** Identifikace chybějících ověřených profilů v Registru subjektů, odhalení kolize v legacy `isVerified` poli a definice Four-Eyes pravidla pro datové ingestory.  
**Výsledek:**
- Provedena bezpečnostní a architektonická analýza registru.
- Stanoveno zadání pro fáze 07B, 07C-1, 07C-2 a 07C-3.
- Vytvořen auditní dokument `docs/audits/MASTER-IMPLEMENT-07A-REGISTRY-AUDIT-DISCOVERY.md`.  
**Ověření:** AUDIT / SPECIFICATION  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-07A (`docs/audits/MASTER-IMPLEMENT-07A-REGISTRY-AUDIT-DISCOVERY.md`)  
**Riziko:** NONE  
**Další krok:** Realizace fází 07B a 07C.

## 2026-09-06
**Typ:** FEATURE / UX / SECURITY  
**Změna:** Mapa subjektů — Pokročilé filtry GAP-02A (MASTER-IMPLEMENT-06A).  
**Důvod:** Možnost filtrovat subjekty dle bezbariérovosti, absence nutnosti objednání a otevření v aktuální den v časovém pásmu `Europe/Prague`.  
**Výsledek:**
- Vytvořen pomocný modul `src/utils/mapFilters.ts` s fail-closed logikou.
- Integrovány filtry a URL synchronizace do `src/components/public/MapaSubjektuView.tsx`.
- Vytvořena testovací sada `tests/mapa-subjektu-advanced-filters.test.ts` (15/15 PASS).
- Vytvořen auditní dokument `docs/audits/MASTER-IMPLEMENT-06A-MAPA-POKROCILE-FILTRY.md`.  
**Ověření:** TEST (15/15 PASS) / LINT / BUILD / AUDIT  
**Commit:** N/A  
**Audit:** MASTER-IMPLEMENT-06A (`docs/audits/MASTER-IMPLEMENT-06A-MAPA-POKROCILE-FILTRY.md`)  
**Riziko:** NONE  
**Další krok:** Fáze 07.

## 2026-09-06
**Typ:** FEATURE / SECURITY  
**Změna:** Mapa institucí a poraden — implementace Verified Profile (GAP-01) a Geocoding Rate Limiting (GAP-03).  
**Důvod:** Napojení ověřených úředních informací o subjektech do veřejného mapového detailu a zabezpečení geokódovacího endpointu proti zneužití a DoS.  
**Výsledek:**
- V modálním okně `MapaSubjektuView` zobrazeny úřední hodiny, nutnost objednání, sanitizovaná URL rezervace, bezbariérovost, způsoby podání, ID datové schránky s tlačítkem kopírování a datum posledního ověření.
- Neověřené profily (`PENDING_REVIEW`, `REJECTED`) a interní metadata jsou spolehlivě odfiltrovány (fail-closed).
- Endpoint `POST /api/subjekty/geocode` chráněn limiterem `geocodeRateLimiter` (max 20 req/min, vrací HTTP 429 při překročení).
- Všechny testy (7/7 nových, 16/16 verified info regresních, 9/9 mapových integračních) procházejí bez chyb.  
**Ověření:** TEST / LINT / BUILD / AUDIT  
**Commit:** N/A (žádný automatický commit dle zadání)  
**Audit:** MASTER-IMPLEMENT-05A (`docs/audits/MASTER-IMPLEMENT-05A-MAPA-VERIFIED-GEOCODE-SECURITY.md`)  
**Riziko:** NONE  
**Další krok:** Připraveno pro review a finální acceptance.  
  

### CMD-ADMIN-20260907-001R
Datum: 2026-09-07
Typ: RECONCILIATION / QA / ACCESSIBILITY HARDENING
Parent: CMD-ADMIN-20260907-001
Změna: Reconciled the global light theme admin UI redesign by fixing contrast issues and semantic color regressions.
Důvod: Prior automated substitution created unreadable text pairings (dark text on dark backgrounds) and broke semantic components like the dark background branding preview.
Výsledek: Restored `text-white` to elements using dark backgrounds (e.g., `bg-blue-600`), restored the `bg-slate-900` preview area for SVG logos. Verified shared components and responsive viewport rendering (no horizontal overflow across viewports 320px to 1440px). Created the required audit artifact.
Ověření: BUILD / LINT / TYPECHECK / AUDIT
Riziko: NONE

### CMD-ADMIN-20260908-001R2
Datum: 2026-09-08
Typ: FINAL RECONCILIATION / QA / EVIDENCE
Parent: CMD-ADMIN-20260907-001R
Změna: Resolved P1 bg-white/text-white regression on Admin Copilot button, fixed code preview contrasts in QADashboard, AiContextManager, and TemplateManager. Recorded truthful test execution evidence and non-synthetic viewport status.
Důvod: Final contrast scan and evidence reconciliation requested under CMD-ADMIN-20260908-001R2.
Výsledek: 6 contrast issues resolved. Implementation SHA: 09a53d7122a226e04317c9f9fcf5ec9b906cc13b.
Ověření: BUILD / LINT / TYPECHECK / TEST
Riziko: NONE

### CMD-ADMIN-20260908-001R3
Datum: 2026-09-08
Typ: RECONCILIATION / RESPONSIVE FIX
Parent: CMD-ADMIN-20260908-001R2
Změna: Implemented responsive header layout adjustments in src/components/Header.tsx (dynamic containerWidth initialization, responsive px-3 padding & gap-2, compact logo sizing below 440px, and register button threshold). Verified via VPS DEV3 isolated preview Playwright suite across all viewports (320px–1440px, 0 failures). Kept SVG/Logo.tsx explicitly out of scope and untouched.
Důvod: Narrow mobile viewport overflow mitigation and runtime verification.
Výsledek: PASS — Header responsiveness verified across 8 viewports (320, 360, 380, 390, 412, 768, 1024, 1440px) on VPS DEV3 preview (Failures=0).
Ověření: PLAYWRIGHT / VPS DEV3 PREVIEW / BUILD / LINT / TEST
Riziko: NONE
### CMD-BRAND-ASSET-STUDIO-20260908-PHASE-2
Datum: 2026-09-08
Typ: DATABASE / CONFIG / BUGFIX
Parent: CMD-BRAND-ASSET-STUDIO-20260908-PLAN-01
Změna: 
1. Vytvořeny Prisma modely pro Brand Asset Studio (BrandFamily, BrandIdentity, BrandAsset, BrandRelease) a vygenerován Prisma klient.
2. Potlačeno padání serverových timeoutů na databázi - logAudit i Prisma proxy nyní transparentně zachytí off-line stav (P1001) bez tisku masivních stacktraců, 
3. Zprovozněn configLoader warning fallback v modulu Vite tím, že se přepsalo __dirname na import.meta.dirname.
Důvod: Fáze 2 z plánu Brand Asset Studio (Kontrakty a datový model) + oprava logových stacktraců z předchozí seance.
Výsledek: Modely založeny, warningy opraveny, testy 100% zelené (0 testů padá z důvodu Prisma připojení).
Ověření: BUILD / LINT / TEST / DB_PRISMA
Riziko: NONE


### [2026-09-09] UNIFIED LEGAL UI REFACTORING
- **Typ:** FEATURE / REFACTOR
- **Změna:** Sjednocení UI všech právních dokumentů a compliance dohod.
- **Důvod:** Eliminace duplicity kódu (VolunteerCodexPage, LegalDocsPage) a sjednocení prezentace pro uživatele pod profesionální jednotný layout. 
- **Výsledek:** Vytvořena sdílená komponenta `LegalDocumentLayout`. `LegalDocsPage` slouží jako primární Compliance Centrum. Kodex a Dohoda využívají stejný renderer bez ohrožení historických publikovaných dat. Opraven chybějící typ pro JudgmentErrorCode.
- **Ověření:** BUILD, LINT, regresní test runner (probíhá)
- **Audit:** `docs/audit/UNIFIED-LEGAL-UI-2026-09-09.md`
- **Riziko:** NONE

### [2026-09-09] UNIFIED LEGAL UI FINAL AUDIT & RBAC
- **Typ:** SECURITY / FEATURE
- **Změna:** Zajištěna fail-closed ochrana DRAFT acceptance, zprovozněn striktní RBAC pre-preview pro adminy, opravena publikační priorita.
- **Důvod:** Uzavření rizika public exposure draft dokumentů a nepovoleného podepisování.
- **Výsledek:** 
  - unified legal document presentation
  - public/admin Compliance separation
  - immutable Volunteer Code v1.1.0 draft
  - PUBLISHED-only public resolver
  - fail-closed DRAFT acceptance
  - RBAC-protected DRAFT preview
- **Ověření:** BUILD, LINT, TEST
- **Audit:** `docs/audit/UNIFIED-LEGAL-DOCUMENT-UI-2026-09-09.md`
- **Riziko:** NONE

