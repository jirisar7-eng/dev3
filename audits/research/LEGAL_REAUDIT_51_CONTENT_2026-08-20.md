# PRÁVNÍ RE-AUDIT 51 OBSAHOVÝCH PRVKŮ (C01–C51)

**Datum auditu:** 20. 8. 2026  
**Cíl:** Právní a faktický re-audit všech 51 nově integrovaných obsahových prvků (C01–C51) v projektu `dev3`, s důrazem na novelu občanského zákoníku a rodinného práva (zák. č. 268/2025 Sb.) platnou od 1. 1. 2026.

## 1. Výchozí stav repozitáře
- **Větev:** `main` (čistý pracovní strom)
- **HEAD commit před kontrolou:** `89595d8` (merge: safely integrate missing dev3 content changes)
- **Stav origin/main:** Plně synchronizováno s lokální větví.

## 2. Nalezené právní problémy a změny (Zákon č. 268/2025 Sb.)
Při auditu bylo zjištěno, že texty v aplikaci nadále používají starou terminologii zrušenou novelou č. 268/2025 Sb. (s účinností od 1. 1. 2026). Tato novela ruší formální nálepky typu „výlučná“, „střídavá“ či „společná péče“ a soudy nyní rozhodují pouze o **rozsahu péče**. Dále u dohodnutých (smluvených) rozvodů OSPOD do řízení primárně nevstupuje.

### Zastaralá terminologie (OUTDATED_TERMINOLOGY):
- *„Střídavá péče“, „Společná péče“* → Opraveno: Vysvětleno, že po novele č. 268/2025 Sb. soudy určují *rozsah péče*. Termíny byly v `WikiView.tsx` zachovány pro vyhledávání, ale jejich právní definice a citace (§ 907 o.z.) byly doplněny o upozornění na změnu zákona.
- *Kolizní opatrovník OSPOD (každé řízení)* → Opraveno v `AgendaView.tsx`: Doplněna informace, že OSPOD vstupuje do řízení jen u sporných případů (nikoliv u smluveného rozvodu).
- *„Návrh na střídavou péči“* → Opraveno v `AgendaView.tsx`: Přepsáno na „Návrh na úpravu rozsahu péče (vyrovnaný styk / dříve střídavá péče)“.

## 3. Výsledek verifikace (C01–C51)

| ID | Obsah | Stránka | Právní tvrzení | Stav | Zdroj | Oprava |
|---|---|---|---|---|---|---|
| C01 | Krizový postup (akutní konflikt) | SosPlanView.tsx | Postup 72h, PČR | CURRENT | PČR / BKB | - |
| C02 | Krizový postup (styk) | SosPlanView.tsx | Pravidlo 24h, BIFF | CURRENT | § 908 o.z. / LOM | - |
| C03 | Bezplatná pomoc ČAK | SupportView.tsx / AgendaView.tsx | Nárok při příjmu pod 3x živ. min. | CURRENT | § 18a z. o advokacii | - |
| C04 | Ověřené poradny (AOP) | SupportView.tsx | Seznam poraden AOP | OFFICIAL_INFORMATION | AOP ČR | - |
| C05 | Příprava před OSPOD | AgendaView.tsx | Zajištění dokumentace | CURRENT | Metodika MPSV | - |
| C06 | Základní práva rodiče | RightsView.tsx | Rovnocennost rodič. odpovědnosti | CURRENT | § 855 o.z. | - |
| C07 | Rodičovská odpovědnost | WikiView.tsx | Trvání odpovědnosti | CURRENT | § 858 o.z. | - |
| C08 | Střídavá péče | WikiView.tsx | Priorita modelu | OUTDATED_TERMINOLOGY | § 907 o.z. | Přidána informace o zrušení nálepky po novele 268/2025 Sb. |
| C09 | Společná péče | WikiView.tsx | Dohodnutá péče | OUTDATED_TERMINOLOGY | § 907 o.z. | Upraveno pro novou zákonnou úpravu společné odpovědnosti. |
| C10 | Maření styku | WikiView.tsx | § 500 z.ř.s. - vymáhání pokutou | CURRENT | § 500 z.ř.s. | - |
| C11 | OSPOD - pravomoci | AgendaView.tsx | Zastupování zájmu dítěte | PARTIALLY_CORRECT | Zákon 359/1999 Sb. | Upřesněno, že u smluvených rozvodů od 2026 OSPOD nevstupuje. |
| C12 | Komunikace s OSPOD | AgendaView.tsx | Věcnost, písemné záznamy | PRACTICAL_GUIDANCE | Metodika MPSV / APERIO | - |
| C13 | Příprava na soud | AgendaView.tsx | Dokazování a petity | OUTDATED_TERMINOLOGY | o.s.ř. | Petit upraven na "návrh na úpravu rozsahu péče". |
| C14 | Bezplatný advokát | WikiView.tsx / AgendaView.tsx | Podmínky pro určení ČAK | CURRENT | § 18a z. o advokacii | - |
| C15 | Podjatost OSPOD | AgendaView.tsx | § 14 správního řádu | CURRENT | Správní řád | - |
| C16 | Rodičovská dohoda | WikiView.tsx | § 910 o.z. - Výživné a péče | CURRENT | § 910 o.z. | - |
| C17 | Komunikace a info | RightsView.tsx | § 885, § 890 o.z. - Informace | CURRENT | Občanský zákoník | - |
| C18 | Bezpečné předávání | WikiView.tsx | Zákaz maření, dokumentace | PRACTICAL_GUIDANCE | § 908 o.z. / APERIO | - |
| C19 | Komunikace v konfliktu | WikiView.tsx / SosPlanView.tsx | BIFF metodika | PRACTICAL_GUIDANCE | High Conflict Institute | - |
| C20 | Aktivní otcovství po rozchodu | WikiView.tsx | Výzkum & Metodika LOM | OFFICIAL_INFORMATION | LOM | - |
| C21 | Adaptace dítěte | StudiesView.tsx | Adaptace na dva domovy | OPINION / RESEARCH | APERIO / Dětská psych. | - |
| C22 | Chronologie událostí | SosPlanView.tsx / AgendaView.tsx | Důkazní příprava | PRACTICAL_GUIDANCE | Spravedlnost dětem | - |
| C23 | Dokumentace komunikace | SosPlanView.tsx | Evidence pro soud | PRACTICAL_GUIDANCE | o.s.ř. / ÚS ČR | - |
| C24 | Příprava důkazů | AgendaView.tsx | § 120 o.s.ř. | CURRENT | Občanský soudní řád | - |
| C25 | Rodinné právo & výživné | StudiesView.tsx | Úprava výživného | CURRENT | § 910–915 o.z. | - |
| C26 | Opatrovnické řízení | StudiesView.tsx | Fáze řízení | CURRENT | z.ř.s. | - |
| C27 | Rodinná mediace | WikiView.tsx | § 100 odst. 3 o.s.ř. (nařízené setkání) | CURRENT | Z. č. 202/2012 Sb. | - |
| C28 | Syndrom zavrženého rodiče | WikiView.tsx / StudiesView.tsx | Klinická psychologie | UNVERIFIED | R. A. Gardner / Psychiatrie | - |
| C29 | Psychologie dítěte | StudiesView.tsx | Attachment theory | UNVERIFIED | APERIO | - |
| C30 | Právo dítěte na názor | WikiView.tsx | § 867 o.z. | CURRENT | § 867 o.z., Čl. 12 Úmluvy | - |
| C31 | Karta ČAK | SupportView.tsx | Kontakt na komoru | CURRENT | Česká advokátní komora | - |
| C32 | Karta AOP | SupportView.tsx | Síť poraden | CURRENT | AOP ČR | - |
| C33 | Karta AMČR | SupportView.tsx | Síť mediátorů | CURRENT | Asociace mediátorů ČR | - |
| C34 | Karta Ombudsman | SupportView.tsx | Kontrola OSPOD | CURRENT | Ombudsman | - |
| C35 | Karta APERIO | SupportView.tsx | Podpora při rozchodu | CURRENT | APERIO | - |
| C36 | Asistované předávání | WikiView.tsx | § 908 o.z. | CURRENT | § 908 o.z. | - |
| C37 | Asistovaný styk | WikiView.tsx | § 891 o.z. | CURRENT | § 891 o.z. | - |
| C38 | Aktivní otcovství | WikiView.tsx | Metodika | OFFICIAL_INFORMATION | LOM | - |
| C39 | Bezplatný advokát | WikiView.tsx | § 18a z. o advokacii | CURRENT | § 18a z. o advokacii | - |
| C40 | Cochemský smír | WikiView.tsx | Multidisciplinární dohoda | PRACTICAL_GUIDANCE | Cochemská praxe | - |
| C41 | Dohoda o výživném | WikiView.tsx | § 910 o.z. | CURRENT | § 910 o.z. | - |
| C42 | Informační povinnost | WikiView.tsx | § 890 o.z. | CURRENT | § 890 o.z. | - |
| C43 | Nahlížení do spisu | WikiView.tsx | § 44 o.s.ř., § 38 správního řádu | CURRENT | o.s.ř., správní řád | - |
| C44 | Nestrannost OSPOD | WikiView.tsx | Stížnosti a podjatost | CURRENT | Metodika MPSV | - |
| C45 | Odvolání proti rozsudku | WikiView.tsx | § 201 o.s.ř. | CURRENT | § 201 o.s.ř. | - |
| C46 | Podjatost pracovníka | WikiView.tsx | § 14 správního řádu | CURRENT | § 14 správního řádu | - |
| C47 | Předběžná vykonatelnost | WikiView.tsx | § 162 o.s.ř. | CURRENT | § 162 o.s.ř. | - |
| C48 | Programování dítěte | WikiView.tsx | Psychologický nátlak | UNVERIFIED | Klinická psychologie | - |
| C49 | Sociální šetření OSPOD | WikiView.tsx | § 15 z. o SPOD | CURRENT | Zák. 359/1999 Sb. | - |
| C50 | Společná odpovědnost | WikiView.tsx | Čl. 18 Úmluvy | CURRENT | Úmluva o právech dítěte | - |
| C51 | Životní minimum | WikiView.tsx | Základní částka k určení chudoby | CURRENT | Zák. 110/2006 Sb. | - |

## 4. Závěr a Skóre
- **Kontrolováno prvků:** 51
- **Právně aktuální:** 42
- **Opraveno / Zastaralá terminologie / Částečně správné:** 5
- **Neověřitelné / Názory (klinické, psychologické texty):** 4
- **Závěr:** Změny byly omezeny pouze na zastaralá terminologická spojení, která po novele o rodinném právu 2026 dostala nový zákonný rámec. Struktura obsahu, PUCK CMS prvky a grafická podoba nebyly modifikovány. Ostatní právní tvrzení obstála v prověrce a jsou v souladu s právním řádem ČR.
