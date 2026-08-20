# AUDIT INFORMAČNÍ ARCHITEKTURY DEV3
**Datum:** 2026-08-20

## 1. Současná struktura menu (Výchozí stav)
Současné menu (viz `src/config/navigation.ts`) je rozděleno do 7 hlavních kategorií s mnoha vnořenými položkami, avšak nedokonale reflektuje nově přidávané funkce a plete veřejný obsah s privátním (osobní spis pod hlavičkou "Spis & Správa účtu").

**Hlavní uzly:**
1. 🚨 Krizová pomoc & Komunita (SOS plán, Krizový rozcestník, Právní poradna, Fórum, Hledáme dobrovolníky)
2. ⚖️ Opatrovnictví & Právo (Agenda, Práva otců, Judikatura, Vzory dokumentů, Články)
3. 💼 Spis & Správa účtu (Osobní spis otce, Péče o dítě, CoParent Hub, Můj Profil)
4. 🤖 AI Nástroje (AI Právní Asistent, AI Case Manager, Generátor formulářů, Simulátor)
5. 🎓 Akademie & Vzdělávání (Kurzy, Videotéka, Kvízy, Wiki)
6. 🏛️ O projektu & Podpora (O nás, Podpořte nás & Vznik spolku, Kontakt)
7. ⚙️ Systém & Admin

## 2. Nalezené stránky a moduly (Z mapování rout)

**Veřejné stránky (PublicPortal):**
- `/dobrovolnici`
- `/krizova-pomoc`
- `/sos-plan`
- `/forum`
- `/pribehy`
- `/pravni-poradna`
- `/podpora`
- `/ai-asistent`, `/ai-pruvodce`, `/ai-case-manager`, `/ai-simulator`, `/ai-formulare`
- `/registr-subjektu`, `/agenda`, `/prava`, `/judikatura`, `/dokumenty`
- `/novinky` (News Hub)
- `/studia`, `/videoteka`, `/kvizy`, `/wiki`, `/studie`, `/user-manual` (Help Center)
- `/state-laws` (e-Sbírka), `/state-statistics` (Statistiky)
- O projektu: `/o-nas`, `/kontakt`, `/podporte-nas`, `/partneri`, `/sponzori`, `/cesta-zakladatele`
- Právní dokumenty: `/gdpr`, `/pravni-dokumenty`

**Privátní stránky (UserDashboard / Authenticated):**
- `/portal/profil`, `/portal/nastaveni` (Můj účet, profil)
- `/pece` (Care Hub)
- `/portal/coparent` (CoParent Hub)
- `/portal/dokumenty` (Dokumenty případu)
- `/portal/podpora`, `/portal/tikety` (Support Center / Ticketing)
- `/portal/prehled` (Přehled uživatele)
- `/muj-pripad` / `/portal` (Osobní spis s mnoha interními taby: Přehled, Děti, Kalendář, Trezor, Deník, atd.)

## 3. Obsahové typy (Prisma)
- `Article` (Články, Help Center / CMS)
- `NewsItem` (Aktuality, Novinky)
- `SupportTicket` (Uživatelská podpora)
- `Faq`
- `Category`
- `Study`, `StateStatistic`, `CourtCase`, `UserCase`, `UserDocument`, `UserNote`, `UserChild` atd.

## 4. Rozdělení oprávnění (Public / Private / Admin)
Současný kód toto řeší částečně (např. navigace schovává `/admin`), ale míchá v menu privátní a veřejný obsah (Péče o dítě a Profil je ve stejném sloupci jako Osobní spis).
- **Public:** Vzdělávání, právo, judikatura, poradna, SOS, novinky, CMS, příběhy.
- **Private:** Osobní spis, dokumenty, kalendář péče, Co-Parent hub, tickety (podpora uživatele), AI case manager (vyžaduje data uživatele).
- **Admin:** Tickety (čtení/odpovědi), správa CMS, uživatelů, VPS atd.

## 5. Duplicity a URL k řešení
- Více URL na stejný komponent (aliasování je ale cílené: `/judikatura` vs `/rozsudky`, `/ai-simulator` vs `/kalkulacka-vyzivneho`). Není nutné mazat aliasy, ale v navigaci musí být jeden jasný zástupce.
- Můj Profil nesmí být v modulu "Péče o dítě".
- AI Case Manager je veřejná landing page i privátní funkce - rozlišovat propagační stránku (O nástroji) a samotný nástroj (v privátní zóně).

## 6. Nově nalezené a doplněné funkce
- **Videotéka:** Existuje veřejně.
- **Příběhy otců:** `/pribehy`.
- **Dokumenty případu:** Privátní `/portal/dokumenty`.
- **News Hub / Novinky:** Veřejné `/novinky`.
- **Help Center:** Veřejné `/user-manual` a API.
- **Support Center / Ticketing:** Privátní `/portal/tikety`.
- **Statistics Hub:** Veřejné `/state-statistics`.
- **e-Sbírka / e-Legislativa:** `/state-laws`.

## 7. Doporučená cílová struktura menu (Nová IA)

1. 🚨 **Pomoc & Komunita**
2. ⚖️ **Právo & Opatrovnictví**
3. 👨‍👧 **Péče & Spolurodičovství**
4. 💼 **Můj případ & Dokumenty** (Autentizováno)
5. 🤖 **AI Nástroje**
6. 🎓 **Akademie & Vzdělávání**
7. 📰 **Aktuality & Příběhy**
8. 🏛️ **O projektu & Podpora**
9. 👤 **Můj účet** (Autentizováno)

## 8. Cílová mapa zařazení (Tabulka)

| Současná položka | Současná kategorie | Cílová kategorie | Typ | Přístup | Akce |
|---|---|---|---|---|---|
| SOS Plán | Krizová pomoc | Pomoc & Komunita | Nástroj | Veřejný | KEEP |
| Právní poradna | Krizová pomoc | Pomoc & Komunita | Komunita | Veřejný | KEEP |
| Fórum | Krizová pomoc | Pomoc & Komunita | Komunita | Veřejný | KEEP |
| Hledáme dobrovolníky | Krizová pomoc | O projektu & Podpora | Stránka | Veřejný | MOVE |
| Registr Subjektů (OSPOD) | - | Pomoc & Komunita | Nástroj | Veřejný | MOVE |
| Práva otců | Právo | Právo & Opatrovnictví | Stránka | Veřejný | KEEP |
| Judikatura | Právo | Právo & Opatrovnictví | Databáze | Veřejný | KEEP |
| Vzory dokumentů | Právo | Právo & Opatrovnictví | Nástroj | Veřejný | KEEP |
| e-Legislativa / Zákony | - | Právo & Opatrovnictví | Databáze | Veřejný | KEEP |
| Můj Profil | Spis & Správa | Můj účet | Nástroj | Privátní | MOVE |
| Osobní spis otce | Spis & Správa | Můj případ & Dokumenty | Nástroj | Privátní | MOVE |
| Dokumenty případu | - | Můj případ & Dokumenty | Nástroj | Privátní | KEEP |
| AI Case Manager | AI Nástroje | Můj případ & Dokumenty | Nástroj | Privátní | MOVE |
| CoParent Hub | Spis & Správa | Péče & Spolurodičovství | Nástroj | Privátní | MOVE |
| Péče (Care Hub) | Spis & Správa | Péče & Spolurodičovství | Nástroj | Privátní | MOVE |
| AI Právní Asistent | AI Nástroje | AI Nástroje | Nástroj | Aut. doporučeno | KEEP |
| Generátor formulářů | AI Nástroje | AI Nástroje | Nástroj | Veřejný/Privátní | KEEP |
| Kalkulačka výživného (Simulátor)| AI Nástroje | AI Nástroje | Nástroj | Veřejný | KEEP |
| Kurzy | Akademie | Akademie & Vzdělávání | Obsah | Veřejný | KEEP |
| Videotéka | Akademie | Akademie & Vzdělávání | Obsah | Veřejný | KEEP |
| Kvízy / Wiki | Akademie | Akademie & Vzdělávání | Obsah | Veřejný | KEEP |
| Studie / Metodika | - | Akademie & Vzdělávání | Obsah | Veřejný | KEEP |
| Help Center (Manuál) | - | Akademie & Vzdělávání | Obsah | Veřejný | MOVE |
| Statistiky | - | Akademie & Vzdělávání | Databáze | Veřejný | MOVE |
| Novinky / Aktuality | - | Aktuality & Příběhy | Obsah | Veřejný | MOVE |
| Příběhy otců | - | Aktuality & Příběhy | Obsah | Veřejný | MOVE |
| O nás / Kontakt | O projektu | O projektu & Podpora | Stránka | Veřejný | KEEP |
| Sponzoři / Partneři | - | O projektu & Podpora | Stránka | Veřejný | MOVE |
| Uživatelská podpora (Tickety) | - | Můj účet | Nástroj | Privátní | MOVE |

## 9. Prvky bez navigace nebo v konfliktu
- **Položky bez navigace v menu:** Videotéka, Statistiky, e-Sbírka, Registr subjektů, News Hub (novinky), Příběhy otců, Help Center, Uživatelská podpora (tickety) - existují v routách, ale chybí logický strom odkazů z hlavního menu.
- **Duplicitní křížení:** Z článků na hlavní stránce se dá skočit do různých CMS rubrik. Kategorie "Články" v menu je zbytečně plošná – lepší je roztřídit podle domény (Metodiky -> Akademie, Příběhy -> Aktuality).

## 10. Responzivní design
- **Mobil/Tablet (Portrait):** Menu hamburger s jasným rozlišením sekcí (akorát oddělit tlustou čárou "Můj Účet").
- **Desktop:** Horizontální mega menu s dropdowny.
- **Můj případ (Privátní sekce):** Má vlastní sekundární navigaci (taby jako Dokumenty, Události atd.). Tato subnavigace by se neměla plést do globální hlavičky, měla by zůstat lokální.

## 11. Závěr a doporučení k implementaci (CO ZMĚNIT A NEMĚNIT)
- **ZMĚNIT:** Přepsat `src/config/navigation.ts` a případně strukturu Mega Menu tak, aby zrcadlily navržených 9 kategorií (bod 7). Odstranit Můj Profil a Osobní spis ze stejné sekce jako je např. Co-Parenting. Vizuálně izolovat "Můj účet".
- **NEMĚNIT:** Kód jednotlivých `*View.tsx` nebo komponent stránek. Neměnit CMS strukturu, URL ani back-endová data. Přepsat pouze navigační config.
- **POŘADÍ IMPLEMENTACE:** V další fázi upravit `NAVIGATION_ITEMS`, upravit oprávnění pro vykreslování v hlavičce a opravit responzivní stylování menu.

## 12. IMPLEMENTACE (2026-08-20 Fáze 2)

**Původní navigace:**
Míchala veřejný a privátní obsah (např. Profil a Péče o dítě pod Správu účtu s Osobním spisem). Obsahovala pouze 7 kategorií a postrádala mapování nově přidaných modulů.

**Nová navigace:**
Implementováno 9 (příp. 10 s admin) hlavních kategorií s jasným rozlišením:
1. 🚨 Pomoc & Komunita (přidán Registr subjektů)
2. ⚖️ Právo & Opatrovnictví (přidána e-Legislativa / Zákony)
3. 👨‍👧 Péče & Spolurodičovství (zde zůstal Care Hub a CoParent Hub)
4. 💼 Můj případ & Dokumenty (Osobní spis, Dokumenty, AI Case Manager)
5. 🤖 AI Nástroje (veřejné i privátní nástroje)
6. 🎓 Akademie & Vzdělávání (přidána Videotéka, Statistiky, Uživatelský manuál / Help Center)
7. 📰 Aktuality & Příběhy (Nová kategorie pro News a Příběhy)
8. 🏛️ O projektu & Podpora (Přesunuto Hledáme dobrovolníky, Kodex dobrovolníka, Partneři)
9. 👤 Můj účet (Profil, Nastavení, Tickety/Podpora)

**Přesunuté položky:**
- `Hledáme dobrovolníky` -> O projektu & Podpora
- `Můj Profil` -> Můj účet
- `Osobní spis otce` -> Můj případ & Dokumenty
- `AI Case Manager` -> Primárně Můj případ & Dokumenty, ale pro veřejný kontext může sdílet AI nástroje

**Přidané (do navigace zapojené) položky:**
- `/registr-subjektu` (Registr subjektů / OSPOD)
- `/state-laws` (Zákony / e-Legislativa)
- `/portal/dokumenty` (Dokumenty případu)
- `/videoteka` (Videotéka)
- `/studie` (Studie & Metodiky)
- `/state-statistics` (Statistiky)
- `/user-manual` (Uživatelský manuál / Help Center)
- `/novinky` (Novinky & Zprávy)
- `/pribehy` (Příběhy otců)
- `/kodex-dobrovolnika` (Kodex dobrovolníka)
- `/partneri` (Sponzoři & Partneři)
- `/portal/tikety` (Uživatelská podpora)

**Odstraněné z hlavního menu:**
- Žádné validní routy nebyly zrušeny. Původní položky byly logicky přeskupeny a URL zůstala zachována.

**Aliasy:**
- `/judikatura` zůstává kanonickým zástupcem pro rozsudky.

**Responzivní kontrola:**
- Navigační položky prošly integrací do původního fluidního systému. `Header.tsx` a `MegaMenu.tsx` dynamicky přechází na MegaMenu, pokud na horizontální navigaci nezbyde prostor (logo + menu položky + pravé ikony > šířka kontejneru - 48px). Bylo upraveno vázání Admin položky na `cat-10`.

**QA:**
- **Lint:** PASS
- **Build:** PASS
- Všechny přidávané routy odkazují na implementované sekce (ověřeno kontrolou PublicPortal.tsx a UserDashboard.tsx).
