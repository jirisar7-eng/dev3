export interface CourtTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  lawsCited: string[];
  content: string;
}

export const COURT_TEMPLATES: CourtTemplate[] = [
  {
    id: 'stridava-pece',
    title: '1. Návrh na úpravu péče (Střídavá / Společná péče)',
    category: 'Péče o dítě',
    description: 'Oficiální návrh k opatrovnickému soudu na zahájení řízení o úpravě poměrů nezletilého dítěte se žádostí o střídavou péči podle MS ČR.',
    lawsCited: [
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 855–§ 927 o.z.)',
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 466–§ 507 z.ř.s.)',
      'Listina základních práv a svobod (čl. 32 odst. 4)',
      'Judikatura Ústavního soudu ČR (I. ÚS 2482/13, II. ÚS 1642/22)',
    ],
    content: `Okresní soud v {{court.name}}
Se sídlem: [Adresa příslušného okresního soudu]

Navrhovatel (otec):
{{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}
Bytem: {{user.street}}, {{user.city}}, {{user.zip}}
Kontakt: Telefon {{user.phone}}, E-mail: {{user.email}}

Odpůrkyně (matka):
{{ex.firstName}} {{ex.lastName}}
Bytem: {{ex.street}}, {{ex.city}}

Nezletilé dítě:
{{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

Spisová značka (pokud řízení již probíhá): {{case.number}}

NÁVRH NA ÚPRAVU PÉČE A VÝŽIVNÉHO NEZLETILÉHO DÍTĚTE (STŘÍDAVÁ PÉČE)

I. Poměry nezletilého a rodičů
Nezletilý/á {{child.firstName}} {{child.lastName}} pochází z partnerství navrhovatele a odpůrkyně. Navrhovatel má k nezletilému vytvořenou hlubokou citovou vazbu a ve svém bydlišti na adrese {{user.street}}, {{user.city}} vytváří plnohodnotné materiální a výchovné zázemí pro jeho všestranný psychický i fyzický vývoj.

II. Právní odůvodnění
Podle § 855 a násl. zákona č. 89/2012 Sb., občanský zákoník (o.z.), mají oba rodiče rovnocennou rodičovskou odpovědnost. Podle čl. 32 odst. 4 Listiny základních práv a svobod je péče o děti a jejich výchova právem rodičů a děti mají právo na péči obou rodičů.
Konstantní judikatura Ústavního soudu ČR (např. nález sp. zn. I. ÚS 2482/13 a II. ÚS 1642/22) výslovně stanoví, že střídavá péče obou rodičů je primárním pravidlem, pokud jsou oba rodiče způsobilí o dítě pečovat a mají o péči zájem.

III. Důkazní návrhy
1. Výslech navrhovatele a odpůrkyně.
2. Zpráva příslušného orgánu sociálně-právní ochrany dětí (OSPOD {{court.name}}).
3. Důkaz o bytových a pracovních podmínkách navrhovatele.

IV. Petitum (Závěrečný návrh)
Navrhovatel navrhuje, aby soud po provedeném dokazování vydal tento rozsudek:

1. Nezletilý/á {{child.firstName}} {{child.lastName}} se svěřuje do střídavé péče obou rodičů v cyklu jednoho týdne. Předání nezletilého proběhne vždy v pondělí v 17:00 hodin v místě bydliště rodiče, u něhož péče končí.
2. Výživné se stanoví oběma rodičům s přihlédnutím k rovnocennému rozsahu péče a odůvodněným potřebám dítěte.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}} (Navrhovatel)

{{esbirka.clause}}`
  },
  {
    id: 'predbezne-opatreni',
    title: '2. Návrh na předběžné opatření při odepření styku (§ 452 z.ř.s.)',
    category: 'Urgentní opatření',
    description: 'Naléhavé soudní podání při akutním zamezení kontaktu s dítětem nebo bezdůvodném bránění ve styku ze strany druhého rodiče.',
    lawsCited: [
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 452 z.ř.s.)',
      'Zákon č. 99/1963 Sb., občanský soudní řád (§ 74 a násl. o.s.ř.)',
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 888, § 889 o.z.)',
    ],
    content: `Okresní soud v {{court.name}}

Navrhovatel:
{{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}
Bytem: {{user.street}}, {{user.city}}, {{user.zip}}
Tel: {{user.phone}}, E-mail: {{user.email}}

Odpůrkyně:
{{ex.firstName}} {{ex.lastName}}
Bytem: {{ex.street}}, {{ex.city}}

Nezletilé dítě:
{{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

Spisová značka: {{case.number}}

NÁVRH NA VYDÁNÍ PŘEDBĚŽNÉHO OPATŘENÍ PODLE § 452 Z.Ř.S. O ÚPRAVĚ STYKU

I. Naléhavost situace a skutkový stav
Odpůrkyně od [Uveďte datum odepření] bez jakéhokoliv právního či věcného důvodu odepřela navrhovateli kontakt s nezletilým {{child.firstName}}. Navrhovatel byl jednostranným krokem odpůrkyně zcela izolován od osobního kontaktu s dítětem.
Tento stav bezprostředně ohrožuje psychický vývoj nezletilého a narušuje jeho citovou vazbu k otci. Je dán naléhavý zájem na zatímní úpravě poměrů podle § 452 zákona č. 292/2013 Sb., o zvláštních řízeních soudních (z.ř.s.).

II. Důkazní opora
1. Písemná komunikace (SMS, e-mailové zprávy) dokládající opakované bezdůvodné maření předání dítěte.
2. Vyjádření OSPOD / protokoly o nepředání dítěte.

III. Návrh usnesení
Navrhovatel navrhuje, aby soud bezodkladně vydal toto usnesení:

Matka {{ex.firstName}} {{ex.lastName}} je povinna předat nezletilého {{child.firstName}} {{child.lastName}} navrhovateli k realizaci styku každý sudý týden v roce od pátku 16:00 hodin do neděle 18:00 hodin, přičemž předání proběhne v místě bydliště matky.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}

{{esbirka.clause}}`
  },
  {
    id: 'vyjadreni-ospod',
    title: '3. Vyjádření rodiče k podnětu OSPOD a návrhu druhého rodiče',
    category: 'Stanoviska & Reakce',
    description: 'Oficiální věcné stanovisko pro opatrovnický soud a OSPOD reagující na podnět sociální pracovnice nebo návrh matky.',
    lawsCited: [
      'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí (zOSPOD)',
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 888, § 889 o.z.)',
      'Správní řád č. 500/2004 Sb. (§ 38 právo nahlížet)',
    ],
    content: `Okresní soud v {{court.name}} / OSPOD {{court.name}}

Spisová značka: {{case.number}}

Otec: {{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}, bytem {{user.street}}, {{user.city}}
Matka: {{ex.firstName}} {{ex.lastName}}, bytem {{ex.street}}, {{ex.city}}
Nezletilé dítě: {{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

VYJÁDŘENÍ OTCE K PODNĚTU OSPOD A NÁVRHU MATKY

I. Uvedení skutečností na pravou míru
K tvrzením uvedeným v návrhu matky a zprávě orgánu sociálně-právní ochrany dětí (OSPOD) uvádím tato fakta:
Otec aktivně vytvořil na adrese {{user.street}}, {{user.city}} samostatný plně vybavený dětský pokoj s potřebami pro předškolní/školní přípravu i volný čas nezletilého {{child.firstName}}.
Pracovní doba otce je plně flexibilní a umožňuje osobní věnování se dítěti bez nutnosti hlídání třetími osobami.

II. Právní rámec a připravenost k dohodě
Podle § 888 a § 889 zákona č. 89/2012 Sb., občanský zákoník, má dítě právo na péči obou rodičů a rodič, který má dítě v péči, je povinen usnadňovat styk druhého rodiče s dítětem.
Otec deklaruje svou připravenost k konstruktivní dohodě a podporuje rovnocennou roli obou rodičů.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}

{{esbirka.clause}}`
  },
  {
    id: 'exekuce-styku',
    title: '4. Návrh na výkon rozhodnutí (exekuce styku při maření)',
    category: 'Výkon rozhodnutí',
    description: 'Soudní návrh na uložení pokuty druhému rodiči podle § 500 z.ř.s. za opakované vědomé maření soudem stanoveného styku.',
    lawsCited: [
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 500–§ 510 z.ř.s.)',
      'Zákon č. 99/1963 Sb., občanský soudní řád (§ 272 a násl. o.s.ř.)',
      'Pokuty dle § 502 z.ř.s. až do výše 50.000 Kč',
    ],
    content: `Okresní soud v {{court.name}}

Spisová značka rozsudku: {{case.number}}

Oprávněný (otec): {{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}, bytem {{user.street}}, {{user.city}}
Povinná (matka): {{ex.firstName}} {{ex.lastName}}, bytem {{ex.street}}, {{ex.city}}
Nezletilé dítě: {{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

NÁVRH NA VÝKON ROZHODNUTÍ UNESENÍM O UKLÁDÁNÍ POKUT PODLE § 500 A NÁSL. Z.Ř.S.

I. Exekuční titul a opakované maření
Vykonatelným rozsudkem Okresního soudu v {{court.name}} ze dne [Datum rozsudku], sp. zn. {{case.number}}, byla povinné uložena povinnost předávat nezletilého {{child.firstName}} oprávněnému v určených termínech.
Povinná tuto vykonatelnou povinnost opakovaně maří. Ke zmaření předání došlo konkrétně ve dnech: [Doplňte data nepředání]. Oprávněný byl v místě předání přítomen, avšak povinná dítě neposkytla.

II. Právní odůvodnění
Podle § 500 a § 502 zákona č. 292/2013 Sb., o zvláštních řízeních soudních, nesplňuje-li povinný dobrovolně soudní rozhodnutí o úpravě styku, soud mu uloží pokutu až do výše 50.000 Kč, a to i opakovaně.

III. Petitum
Oprávněný navrhuje, aby soud vydal toto usnesení:

1. Povinné {{ex.firstName}} {{ex.lastName}} se za maření styku stanoveného rozsudkem sp. zn. {{case.number}} ukládá pokuta ve výši 10.000 Kč splatná do 15 dnů od doručení usnesení.
2. Povinná je povinna uhradit oprávněnému náklady exekučního řízení.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}

{{esbirka.clause}}`
  },
  {
    id: 'nahlednuti-spis',
    title: '5. Žádost o nahlédnutí do opatrovnického spisu a kopie (§ 44 o.s.ř.)',
    category: 'Soudní úkony',
    description: 'Žádost účastníka řízení o nahlédnutí do spisu, pořízení fotokopií zpráv OSPOD, znaleckých posudků a podání protistrany.',
    lawsCited: [
      'Zákon č. 99/1963 Sb., občanský soudní řád (§ 44 o.s.ř.)',
      'Instrukce MS ČR pro nahlížení do soudních spisů',
    ],
    content: `Okresní soud v {{court.name}}
Opatrovnické oddělení

Spisová značka: {{case.number}}

Žadatel (účastník řízení - otec):
{{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}
Bytem: {{user.street}}, {{user.city}}, {{user.zip}}
Telefon: {{user.phone}}, E-mail: {{user.email}}

Nezletilé dítě: {{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

ŽÁDOST O NAHLÉDNUTÍ DO OPATROVNICKÉHO SPISU A POŘÍZENÍ KOPIÍ PODLE § 44 O.S.Ř.

Jako účastník opatrovnického řízení žádám podle § 44 zákona č. 99/1963 Sb., občanský soudní řád (o.s.ř.), o umožnění nahlédnutí do soudního spisu sp. zn. {{case.number}} a pořízení fotokopií / elektronických kopií ze všech listin doručených soudu od OSPOD, znaleckých posudků a vyjádření druhého účastníka.

Prosím o sdělení termínu, kdy je možné do spisu v nahlížecím centru soudu nahlédnout.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}

{{esbirka.clause}}`
  },
  {
    id: 'zmena-vyzivneho',
    title: '6. Návrh na změnu výše výživného (dle tabulek MS ČR)',
    category: 'Finance & Výživné',
    description: 'Návrh na úpravu/snížení/zvýšení výživného reflektující aktuální doporučující tabulky Ministerstva spravedlnosti ČR a změnu poměrů.',
    lawsCited: [
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 910–§ 923 o.z.)',
      'Doporučující tabulka Ministerstva spravedlnosti ČR pro výživné',
      'Změna poměrů podle § 923 o.z.',
    ],
    content: `Okresní soud v {{court.name}}

Spisová značka původního rozsudku: {{case.number}}

Navrhovatel:
{{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}
Bytem: {{user.street}}, {{user.city}}, {{user.zip}}

Druhý rodič:
{{ex.firstName}} {{ex.lastName}}
Bytem: {{ex.street}}, {{ex.city}}

Nezletilé dítě:
{{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

NÁVRH NA ZMĚNU VÝŠE VÝŽIVNÉHO NEZLETILÉHO DÍTĚTE PODLE § 910 A NÁSL. O.Z.

I. Podstatná změna poměrů
Původním rozsudkem Okresního soudu v {{court.name}} sp. zn. {{case.number}} ze dne [Datum původního rozsudku] bylo výživné určeno částkou [Původní částka] Kč měsíčně.
Od té doby došlo k podstatné změně poměrů (§ 923 o.z.):
1. Výrazná změna věku dítěte {{child.firstName}} a jeho potřeb / navýšení osobní péče navrhovatele.
2. Změna příjmových a majetkových možností rodičů.

II. Aplikace doporučujících tabulek MS ČR
Podle doporučujících tabulek Ministerstva spravedlnosti ČR pro stanovování výživného a § 913 občanského zákoníku se výše výživného odvíjí od čistého příjmu povinného rodiče, věkové kategorie dítěte a rozsahu péče.

III. Petitum
Navrhovatel navrhuje, aby soud vydal tento rozsudek:

Výživné pro nezletilého/ou {{child.firstName}} {{child.lastName}} se s účinností od [Datum změny] určuje částkou [Nová částka] Kč měsíčně, splatnou do 15. dne v měsíci.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}

{{esbirka.clause}}`
  },
  {
    id: 'zdravotni-informace',
    title: '7. Žádost lékaři o informace o zdravotním stavu dítěte',
    category: 'Zdravotnictví & Škola',
    description: 'Písemná žádost poskytovateli zdravotních služeb (pediatrovi) o sdělení informací o zdravotním stavu dítěte podle zákona o zdravotních službách.',
    lawsCited: [
      'Zákon č. 372/2011 Sb., o zdravotních službách (§ 31 odst. 1 a § 41)',
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 858 a § 876 o.z.)'
    ],
    content: `Vážená paní doktorko / Vážený pane doktore,

Žádost o sdělení informací o zdravotním stavu dítěte podle § 31 a násl. zákona č. 372/2011 Sb., o zdravotních službách

Žadatel (zákonný zástupce):
{{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}
Bytem: {{user.street}}, {{user.city}}, {{user.zip}}
Kontakt: [Váš e-mail / telefon]

Nezletilý pacient:
{{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}

Jako zákonný zástupce výše jmenovaného nezletilého dítěte Vás žádám o poskytnutí úplných informací o jeho zdravotním stavu, probíhající léčbě a plánovaných zdravotních úkonech.

Podle § 31 zákona č. 372/2011 Sb., o zdravotních službách, mám jako zákonný zástupce nezletilého pacienta plné právo na tyto informace, bez ohledu na to, u kterého z rodičů se dítě zrovna nachází. Souhlas druhého rodiče k poskytnutí těchto informací není vyžadován.

Prosím o zaslání informací nebo o návrh termínu osobní konzultace, na které by mi byl zdravotní stav dítěte vysvětlen.

Předem Vám děkuji za součinnost a spolupráci.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}
zákonný zástupce nezletilého pacienta`
  },
  {
    id: 'skolni-pristup',
    title: '8. Žádost řediteli o přístup do školního systému (Bakaláři/EduPage)',
    category: 'Zdravotnictví & Škola',
    description: 'Písemná žádost škole o zřízení vlastního rodičovského přístupového účtu k elektronickému systému školy (známky, rozvrh, omluvenky).',
    lawsCited: [
      'Zákon č. 561/2004 Sb., školský zákon (§ 21 odst. 1 písm. b)',
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 858 a § 876 o.z.)'
    ],
    content: `Vážený pan ředitel / Vážená paní ředitelko,

Žádost o zřízení samostatného rodičovského přístupu do školního informačního systému

Žadatel (zákonný zástupce):
{{user.firstName}} {{user.lastName}}, nar. {{user.birthDate}}
Bytem: {{user.street}}, {{user.city}}, {{user.zip}}
Kontakt: [Váš e-mail / telefon]

Nezletilý žák / žákyně:
{{child.firstName}} {{child.lastName}}, nar. {{child.birthDate}}
Třída: [Doplňte třídu]

Jako zákonný zástupce výše uvedeného nezletilého žáka / žákyně si Vás dovoluji požádat o zřízení a zaslání mých vlastních přihlašovacích údajů do elektronického informačního systému vaší školy (např. Bakaláři, EduPage, Škola OnLine).

Podle § 21 odst. 1 písm. b) zákona č. 561/2004 Sb., školský zákon, mám jako zákonný zástupce právo na informace o průběhu a výsledcích vzdělávání dítěte. Rodičovská odpovědnost, jejíž součástí je dohled nad vzděláváním dítěte, náleží oběma rodičům bez ohledu na to, komu bylo dítě svěřeno do péče.

Prosím o zaslání přístupových údajů na můj e-mail: [Váš e-mail]. Pokud systém neumožňuje zřídit dva nezávislé rodičovské účty, žádám Vás o návrh alternativního způsobu, jak mi budou tyto povinné informace ze strany školy doručovány (např. pravidelný e-mailový výpis, předávání papírové žákovské knížky atd.).

Předem děkuji za spolupráci a Váš čas.

V {{user.city}} dne {{current.date}}

__________________________________________
{{user.firstName}} {{user.lastName}}
zákonný zástupce`
  }
];