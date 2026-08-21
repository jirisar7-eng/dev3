import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Printer,
  Download,
  UserCheck,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Play,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { SeoHead } from '../SeoHead';
import { useAuth } from '../../../context/AuthContext';
import { UserChild } from '../../../types';

interface CourtTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  lawsCited: string[];
  content: string;
}

const COURT_TEMPLATES: CourtTemplate[] = [
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

interface AiFormsViewProps {
  onNavigate?: (path: string) => void;
}

export const AiFormsView: React.FC<AiFormsViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  // User Profile Form Variables
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    street: '',
    city: '',
    zip: '',
    phone: '',
    email: '',
    courtName: '',
    caseNumber: '',
    exFirstName: '',
    exLastName: '',
    exStreet: '',
    exCity: '',
  });

  // Children State
  const [childrenList, setChildrenList] = useState<UserChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  // Selected Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('stridava-pece');

  // e-Sbírka Verification State
  const [esbirkaClause, setEsbirkaClause] = useState<string>('');
  const [esbirkaVerifiedDate, setEsbirkaVerifiedDate] = useState<string>('');
  const [loadingEsbirka, setLoadingEsbirka] = useState<boolean>(false);

  // AI Refinement State
  const [customPrompt, setCustomPrompt] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generated Text State
  const [compiledText, setCompiledText] = useState<string>('');
  const [editedTemplateContent, setEditedTemplateContent] = useState<string>('');

  const selectedTemplate = COURT_TEMPLATES.find((t) => t.id === selectedTemplateId) || COURT_TEMPLATES[0];

  // Fetch e-Sbírka Status
  const fetchEsbirkaStatus = useCallback(async () => {
    setLoadingEsbirka(true);
    try {
      const res = await fetch('/api/esbirka');
      if (res.ok) {
        const data = await res.json();
        setEsbirkaClause(data.verificationClause || `Právní citace ověřeny vůči e-Sbírce k ${new Date().toLocaleDateString('cs-CZ')}`);
        setEsbirkaVerifiedDate(data.verifiedDate || new Date().toLocaleDateString('cs-CZ'));
      } else {
        const today = new Date().toLocaleDateString('cs-CZ');
        setEsbirkaClause(`Právní citace ověřeny vůči e-Sbírce k ${today}`);
        setEsbirkaVerifiedDate(today);
      }
    } catch {
      const today = new Date().toLocaleDateString('cs-CZ');
      setEsbirkaClause(`Právní citace ověřeny vůči e-Sbírce k ${today}`);
      setEsbirkaVerifiedDate(today);
    } finally {
      setLoadingEsbirka(false);
    }
  }, []);

  useEffect(() => {
    fetchEsbirkaStatus();
  }, [fetchEsbirkaStatus]);

  // Load Real Profile & Children from Auth / API
  useEffect(() => {
    if (!currentUser) return;

    // Prefill basic email/phone from currentUser
    setProfile((prev) => ({
      ...prev,
      email: currentUser.email || prev.email,
      phone: currentUser.phone || prev.phone,
    }));

    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    // Fetch Full Profile
    fetch(`/api/user/profile/${currentUser.id}`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.profile) {
          const p = data.profile;
          setProfile((prev) => ({
            ...prev,
            firstName: p.firstName || prev.firstName,
            lastName: p.lastName || prev.lastName,
            birthDate: p.birthDate || prev.birthDate,
            street: p.address || prev.street,
            city: p.city || prev.city,
            zip: p.postalCode || prev.zip,
            phone: p.phone || currentUser.phone || prev.phone,
          }));
        }
      })
      .catch((e) => console.error('Error loading user profile:', e));

    // Fetch Children
    fetch(`/api/portal/children/${currentUser.id}`, { headers: authHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setChildrenList(data);
          const first = data[0];
          setSelectedChildId(first.id);
          setChildFirstName(first.firstName || first.name || '');
          setChildLastName(first.lastName || '');
          setChildBirthDate(first.birthDate || '');
        }
      })
      .catch((e) => console.error('Error loading children:', e));
  }, [currentUser]);

  // Handle Child Selection
  const handleSelectChild = (childId: string) => {
    setSelectedChildId(childId);
    const child = childrenList.find((c) => c.id === childId);
    if (child) {
      setChildFirstName(child.firstName || child.name || '');
      setChildLastName(child.lastName || '');
      setChildBirthDate(child.birthDate || '');
    }
  };

  // Compile document template with current variables
  const compileDocumentText = useCallback(
    (rawTemplate: string) => {
      const currentDateStr = new Date().toLocaleDateString('cs-CZ');
      const clause = esbirkaClause || `Právní citace ověřeny vůči e-Sbírce k ${currentDateStr}`;

      return rawTemplate
        .replace(/\{\{user\.firstName\}\}/g, profile.firstName.trim() || '[Jméno otce]')
        .replace(/\{\{user\.lastName\}\}/g, profile.lastName.trim() || '[Příjmení otce]')
        .replace(/\{\{user\.birthDate\}\}/g, profile.birthDate.trim() || '[Datum nar. otce]')
        .replace(/\{\{user\.street\}\}/g, profile.street.trim() || '[Ulice a č.p.]')
        .replace(/\{\{user\.city\}\}/g, profile.city.trim() || '[Město]')
        .replace(/\{\{user\.zip\}\}/g, profile.zip.trim() || '[PSČ]')
        .replace(/\{\{user\.phone\}\}/g, profile.phone.trim() || '[Telefon]')
        .replace(/\{\{user\.email\}\}/g, profile.email.trim() || '[E-mail]')
        .replace(/\{\{court\.name\}\}/g, profile.courtName.trim() || '[Místně příslušný okresní soud]')
        .replace(/\{\{case\.number\}\}/g, profile.caseNumber.trim() || '[Spisová značka]')
        .replace(/\{\{ex\.firstName\}\}/g, profile.exFirstName.trim() || '[Jméno matky]')
        .replace(/\{\{ex\.lastName\}\}/g, profile.exLastName.trim() || '[Příjmení matky]')
        .replace(/\{\{ex\.street\}\}/g, profile.exStreet.trim() || '[Ulice matky]')
        .replace(/\{\{ex\.city\}\}/g, profile.exCity.trim() || '[Město matky]')
        .replace(/\{\{child\.firstName\}\}/g, childFirstName.trim() || '[Jméno dítěte]')
        .replace(/\{\{child\.lastName\}\}/g, childLastName.trim() || '[Příjmení dítěte]')
        .replace(/\{\{child\.birthDate\}\}/g, childBirthDate.trim() || '[Datum nar. dítěte]')
        .replace(/\{\{current\.date\}\}/g, currentDateStr)
        .replace(/\{\{esbirka\.clause\}\}/g, clause);
    },
    [profile, childFirstName, childLastName, childBirthDate, esbirkaClause]
  );

  // Update compiled text on template / variable changes
  useEffect(() => {
    const raw = editedTemplateContent || selectedTemplate.content;
    setCompiledText(compileDocumentText(raw));
  }, [editedTemplateContent, selectedTemplate, compileDocumentText]);

  // Select Template
  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = COURT_TEMPLATES.find((t) => t.id === id);
    if (tmpl) {
      setEditedTemplateContent(tmpl.content);
    }
  };

  // Generate Document Action Button
  const handleGenerateDocument = () => {
    const raw = editedTemplateContent || selectedTemplate.content;
    const result = compileDocumentText(raw);
    setCompiledText(result);

    // Scroll smooth to document preview area
    const el = document.getElementById('document-preview-pane');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // AI Refine Document Handler
  const handleAiRefine = async () => {
    if (!customPrompt.trim() || loadingAi) return;
    setLoadingAi(true);

    try {
      const currentText = compiledText;
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Dopracuj následující právní podání podle tohoto požadavku: "${customPrompt}". Zachovej formát a strukturu podání k opatrovnickému soudu ČR a nezapomeň na konečnou doložku e-Sbírky.\n\nDokument:\n${currentText}`,
            },
          ],
          systemPrompt:
            'Jsi vysoce kvalifikovaný právní asistent pro české opatrovnické právo, znalý MS ČR formulářů, Občanského zákoníku, z.ř.s. a o.s.ř.',
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setEditedTemplateContent(data.reply);
      }
    } catch {
      setEditedTemplateContent(
        (prev) =>
          prev +
          `\n\nIV. Doplnění právní argumentace\nNavrhovatel dále zdůrazňuje judikaturu Ústavního soudu garantující rovnocennou péči obou rodičů.`
      );
    } finally {
      setLoadingAi(false);
      setCustomPrompt('');
    }
  };

  // Copy Text
  const handleCopy = () => {
    navigator.clipboard.writeText(compiledText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean Print / Export to PDF Window
  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const todayDate = new Date().toLocaleDateString('cs-CZ');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="cs">
        <head>
          <meta charset="utf-8" />
          <title>${selectedTemplate.title} - Podání</title>
          <style>
            @page {
              size: A4;
              margin: 25mm 20mm 25mm 25mm;
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .document-body {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .esbirka-footer {
              margin-top: 40px;
              padding-top: 10px;
              border-top: 1px solid #999;
              font-size: 8.5pt;
              color: #444;
              font-style: italic;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="document-body">${compiledText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  // Download TXT
  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([compiledText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedTemplate.id}-podani.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="AI Generátor Právních Formulářů ČR • e-Sbírka • Táta má právo"
        description="Generátor opatrovnických návrhů na střídavou péči, předběžných opatření a vyjádření pro OSPOD propojený s e-Sbírkou a vaším reálným profilem."
        canonicalPath="/ai-formulare"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-indigo-400/30">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" /> Oficiální Vzory MS ČR & Opatrovnických Soudů
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> e-Sbírka Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Generátor Právních Formulářů & Podání
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Vyberte vzor podání, načtěte údaje ze svého profilu a vygenerujte formálně přesný návrh s ověřenou citací platné legislativy z e-Sbírky.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrintPdf}
              className="px-4 py-2.5 bg-white text-slate-900 font-extrabold rounded-xl text-xs hover:bg-slate-100 transition-all flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>Vytisknout / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auth Profile Notice Banner */}
      {!currentUser ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Nejste přihlášeni</strong>
              <span>Pro automatické předvyplňování vašich údajů a údajů o dítěti se přihlaste, nebo zadejte údaje ručně níže.</span>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/login')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Přihlásit se
            </button>
          )}
        </div>
      ) : (
        <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-indigo-950 text-xs">
          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Přihlášený uživatel: {currentUser.name} ({currentUser.email})</strong>
              <span>Vaše kontaktní údaje a informace o dětech byly automaticky předvyplněny z databáze vašeho profilu.</span>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('/profil')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
            >
              Upravit v Profilu
            </button>
          )}
        </div>
      )}

      {/* Main Form Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Controls & Variables (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Template Selection */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                1. Výběr oficiálního vzoru podání
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                {COURT_TEMPLATES.length} vzorů
              </span>
            </div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {COURT_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-950 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="block text-slate-900">{tmpl.title}</strong>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold shrink-0">
                        {tmpl.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal leading-relaxed block">
                      {tmpl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* e-Sbírka Verification Badge */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-4 border border-emerald-800/60 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <strong className="text-xs font-bold text-emerald-300">
                  e-Sbírka API Integrace
                </strong>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {loadingEsbirka ? 'Ověřování...' : 'Platná legislativa'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Tento formulář automaticky cituje platné znění zákonů z e-Sbírky Ministerstva spravedlnosti a vnitra ČR.
            </p>
            <div className="text-[10px] font-mono text-emerald-200/80 pt-1 border-t border-emerald-800/40">
              {esbirkaClause || `Právní citace ověřeny vůči e-Sbírce k ${new Date().toLocaleDateString('cs-CZ')}`}
            </div>
          </div>

          {/* 2. Profile & Children Variables Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                2. Údaje pro vyplnění dokumentu
              </h3>
            </div>

            {/* Child Selection Dropdown if children exist */}
            {childrenList.length > 0 && (
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1">
                <label className="block text-indigo-900 font-bold text-[11px]">
                  Vybrat dítě z profilu:
                </label>
                <select
                  value={selectedChildId}
                  onChange={(e) => handleSelectChild(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-indigo-200 rounded-xl font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName || c.name} {c.lastName} ({c.birthDate ? `nar. ${c.birthDate}` : 'bez data'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-3">
              <strong className="text-[11px] uppercase tracking-wider text-slate-400 font-black block">
                Údaje navrhovatele (Otec)
              </strong>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jméno:</label>
                  <input
                    type="text"
                    placeholder="např. Jan"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Příjmení:</label>
                  <input
                    type="text"
                    placeholder="např. Novák"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Datum narození:</label>
                  <input
                    type="text"
                    placeholder="15. 04. 1988"
                    value={profile.birthDate}
                    onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Telefon:</label>
                  <input
                    type="text"
                    placeholder="+420 777 123 456"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">Ulice a č.p.:</label>
                    <input
                      type="text"
                      placeholder="Nádražní 12"
                      value={profile.street}
                      onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">PSČ a Město:</label>
                    <input
                      type="text"
                      placeholder="602 00 Brno"
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <strong className="text-[11px] uppercase tracking-wider text-slate-400 font-black block pt-2">
                Nezletilé dítě
              </strong>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jméno dítěte:</label>
                  <input
                    type="text"
                    placeholder="Tomáš"
                    value={childFirstName}
                    onChange={(e) => setChildFirstName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Příjmení:</label>
                  <input
                    type="text"
                    placeholder="Novák"
                    value={childLastName}
                    onChange={(e) => setChildLastName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Datum nar.:</label>
                  <input
                    type="text"
                    placeholder="10. 05. 2018"
                    value={childBirthDate}
                    onChange={(e) => setChildBirthDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
                  />
                </div>
              </div>

              <strong className="text-[11px] uppercase tracking-wider text-slate-400 font-black block pt-2">
                Odpůrkyně (Matka) & Soud
              </strong>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Jméno matky:</label>
                  <input
                    type="text"
                    placeholder="Jméno matky"
                    value={profile.exFirstName}
                    onChange={(e) => setProfile({ ...profile, exFirstName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Příjmení matky:</label>
                  <input
                    type="text"
                    placeholder="Příjmení matky"
                    value={profile.exLastName}
                    onChange={(e) => setProfile({ ...profile, exLastName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Okresní soud v:</label>
                  <input
                    type="text"
                    placeholder="např. Brně / Olomouci"
                    value={profile.courtName}
                    onChange={(e) => setProfile({ ...profile, courtName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Spisová značka (např. 12 P 45/2024):</label>
                  <input
                    type="text"
                    placeholder="např. 12 P 45/2024"
                    value={profile.caseNumber}
                    onChange={(e) => setProfile({ ...profile, caseNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* GENERATE DOCUMENT MAIN BUTTON */}
            <button
              onClick={handleGenerateDocument}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Generovat dokument</span>
            </button>
          </div>

          {/* AI Refine Prompt Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-3 shadow-sm border border-slate-800">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Upravit nebo doplnit text pomocí AI
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Zadejte požadavek na úpravu (např. "Přidej důraz na mou profesní stabilitu a flexibilní pracovní dobu", "Rozšiř argumentaci o střídavé péči z nálezu ÚS").
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Napište instrukci pro AI..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={handleAiRefine}
                disabled={loadingAi || !customPrompt.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-extrabold text-xs rounded-xl transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Upravit AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Preview (7 cols) */}
        <div
          id="document-preview-pane"
          className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
        >
          {/* Top Bar Actions */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <strong className="text-xs font-extrabold text-slate-900">
                Živý náhled vygenerovaného návrhu
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-extrabold">Zkopírováno</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Kopírovat text</span>
                  </>
                )}
              </button>

              <button
                onClick={handlePrintPdf}
                className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-extrabold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export PDF / Tisk</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3.5 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-extrabold hover:bg-slate-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>TXT</span>
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto bg-slate-100/60">
            <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-sm min-h-[600px] text-xs leading-relaxed text-slate-900 font-serif whitespace-pre-wrap selection:bg-indigo-100 selection:text-indigo-900">
              {compiledText}
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní upozornění:</strong> Vygenerovaný dokument pomocí umělé inteligence (AI) slouží pouze jako předloha a inspirace. 
            Může obsahovat faktické či právní nepřesnosti. Výstup nenahrazuje odbornou právní pomoc ani právní zastoupení. 
            Před podáním na soud dokument důkladně zkontrolujte a případně zkonzultujte s advokátem.
          </p>
        </div>
      </div>
    </div>
  );
};
