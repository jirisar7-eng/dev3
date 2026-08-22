import { LegalGuide } from '../types';

export const DEFAULT_LEGAL_GUIDES: LegalGuide[] = [
  {
    id: 'guide-ospod',
    slug: 'ospod',
    title: 'OSPOD & Sociální šetření',
    subtitle: 'Praktický průvodce pro rodiče při jednání s orgánem sociálně-právní ochrany dětí.',
    excerpt: 'Jak probíhá sociální šetření, jaká máte zákonná práva, jak nahlížet do spisu Om a jak jednat věcně a asertivně.',
    category: 'ospod',
    categoryLabel: 'OSPOD & Sociální šetření',
    order: 1,
    status: 'PUBLISHED',
    badgeText: 'Klíčový průvodce',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    disclaimer: 'Informace obsažené v tomto průvodci slouží jako orientační metodická pomůcka a nenahrazují individuální právní poradenství advokáta.',
    sources: [
      'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí',
      'Zákon č. 500/2004 Sb., správní řád',
      'Zákon č. 89/2012 Sb., občanský zákoník',
      'Metodická doporučení MPSV ČR pro výkon SPOD'
    ],
    chapters: [
      {
        id: 'ospod-ch-1',
        title: '1. Kdo je OSPOD a jaká je jeho role v opatrovnickém sporu',
        content: 'Orgán sociálně-právní ochrany dětí (OSPOD) působí na pověřených obecních či městských úřadech. V soudním řízení o péči a výživném bývá soudem jmenován **kolizním opatrovníkem** dítěte (§ 892 odst. 3 o.z.). Jeho posláním je hájit nejlepší zájem dítěte, nikoli matky či otce.',
        order: 1,
        type: 'info'
      },
      {
        id: 'ospod-ch-2',
        title: '2. Práva rodiče při sociálním šetření v domácnosti',
        content: 'Sociální pracovník provádí šetření za účelem zjištění bytových a rodinných poměrů. Máte právo na důstojné zacházení, seznámení se s účelem návštěvy a pořizování zvukového záznamu pro vlastní potřebu (v souladu s judikaturou NSS). Byt má být čistý, bezpečný, s vlastním lůžkem a koutkem pro dítě.',
        order: 2,
        type: 'steps'
      },
      {
        id: 'ospod-ch-3',
        title: '3. Nahlížení do spisu Om a námitky podjatosti',
        content: 'Jako rodič máte podle § 38 správního řádu plné právo nahlížet do spisu Om vedeného o vašem dítěti, pořizovat si výpisky a fotokopie. Pokud pracovník vykazuje zjevnou jednostrannost nebo má osobní vazby na druhého rodiče, lze podat písemnou **námitku podjatosti** vedoucímu odboru.',
        order: 3,
        type: 'warning'
      },
      {
        id: 'ospod-ch-4',
        title: '4. Komunikace metodou BIFF',
        content: 'Veškerá písemná komunikace s OSPODem by měla být věcná, stručná, zdvořilá a pevná (Brief, Informative, Friendly, Firm). Nepoužívejte emocionální výlevy, ale opírejte se o doložitelná fakta a časovou osu.',
        order: 4,
        type: 'checklist'
      }
    ],
    checklist: [
      { id: 'osp-c1', label: 'Připravené klidné zázemí pro dítě (postel, stůl, hračky, hygiena)' },
      { id: 'osp-c2', label: 'Doložené lékařské zprávy, kontakt na pediatra a školu' },
      { id: 'osp-c3', label: 'Písemná žádost o nahlížení do spisu Om podaná na podatelnu' },
      { id: 'osp-c4', label: 'Stručný a věcný přehled péče o dítě (časový harmonogram a náklady)' }
    ],
    seoTitle: 'OSPOD & Sociální šetření krok za krokem • Práva rodičů',
    seoDescription: 'Kompletní průvodce jednáním s OSPOD, sociálním šetřením v bytě a nahlížením do spisu Om pro rodiče v opatrovnickém sporu.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-soud',
    slug: 'soud',
    title: 'Opatrovnický soud krok za krokem',
    subtitle: 'Jak probíhá řízení o péči a výživném, jak se připravit na jednání a jak vystupovat.',
    excerpt: 'Co čekat od opatrovnického soudu, jak probíhá dokazování a jak se chovat v jednací síni.',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    order: 2,
    status: 'PUBLISHED',
    badgeText: 'Soudní řízení',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    disclaimer: 'Obsah slouží pouze k informační orientaci a nenahrazuje individuální právní zastoupení advokátem.',
    sources: [
      'Zákon č. 89/2012 Sb., občanský zákoník',
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (z.ř.s.)',
      'Zákon č. 99/1963 Sb., občanský soudní řád (o.s.ř.)'
    ],
    chapters: [
      {
        id: 'soud-ch-1',
        title: '1. Zahájení řízení a příprava na první jednání',
        content: 'Řízení ve věcech péče o nezletilé se zahajuje na návrh rodiče nebo i bez návrhu (z úřední povinnosti). Před jednáním je nezbytné nahlédnout do soudního spisu (oddíl Nc), prostudovat zprávu OSPOD a vyjádření matky.',
        order: 1,
        type: 'info'
      },
      {
        id: 'soud-ch-2',
        title: '2. Průběh výslechu a chování v jednací síni',
        content: 'Mluvte pouze tehdy, když vám soudce udělí slovo. Adresujte své odpovědi soudci („vážený soude / pane předsedo“), nikoliv druhému rodiči. Vyhněte se skákání do řeči, emotivním gestům a osobním útokům. Zaměřte se výhradně na potřeby dítěte.',
        order: 2,
        type: 'steps'
      },
      {
        id: 'soud-ch-3',
        title: '3. Dokazování: co soud uznává a co ne',
        content: 'Soud zkoumá výchovné kompetence, vztah dítěte k oběma rodičům, stabilitu prostředí a dosavadní péči. Důkazy: výpisy z účtu (hrazení potřeb), lékařské zprávy, potvrzení ze školy/školky, fotografie a písemná komunikace.',
        order: 3,
        type: 'warning'
      },
      {
        id: 'soud-ch-4',
        title: '4. Vyhlášení rozsudku a předběžná vykonatelnost',
        content: 'Rozsudky ve věcech péče o nezletilé a výživného jsou ze zákona předběžně vykonatelné doručením písemného vyhotovení. To znamená, že i když podáte odvolání, rozsudek musíte do rozhodnutí odvolacího soudu plnit.',
        order: 4,
        type: 'info'
      }
    ],
    checklist: [
      { id: 'soud-c1', label: 'Zkontrolovat datum, čas a číslo jednací síně na předvolání' },
      { id: 'soud-c2', label: 'Platný občanský průkaz (bez něj vás soud nevyslechne)' },
      { id: 'soud-c3', label: 'Chronologie událostí a návrh řešení (stručný, jasný)' },
      { id: 'soud-c4', label: 'Návrhy důkazů ve trojím vyhotovení (soud, OSPOD, matka)' },
      { id: 'soud-c5', label: 'Doklad o výdělku za posledních 12 měsíců (pro posouzení výživného)' }
    ],
    seoTitle: 'Opatrovnický soud krok za krokem • Průvodce pro otce',
    seoDescription: 'Praktický průvodce soudním řízením o péči a výživném pro rodiče. Jak se připravit, jak vystupovat a jak funguje dokazování.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-odvolani',
    slug: 'odvolani',
    title: 'Odvolání v opatrovnickém řízení',
    subtitle: 'Lhůty, náležitosti, argumentace a postup u krajského soudu.',
    excerpt: 'Jak správně podat odvolání proti rozsudku o péči nebo výživném, jak dodržet 15denní lhůtu a jak formulovat odvolací důvody.',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    order: 3,
    status: 'PUBLISHED',
    badgeText: 'Opravné prostředky',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    disclaimer: 'Odvolání má přísné procesní náležitosti. V případě pochybností konzultujte text s advokátem.',
    sources: [
      'Zákon č. 99/1963 Sb., občanský soudní řád (§ 201 a násl.)',
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních',
      'Nálezy Ústavního soudu k právu na spravedlivý proces'
    ],
    chapters: [
      {
        id: 'odv-ch-1',
        title: '1. Lhůta 15 dnů a místo podání',
        content: 'Odvolání se podává do 15 dnů od doručení písemného vyhotovení rozsudku k soudu prvního stupně, který rozhodnutí vydal (nikoliv přímo ke krajskému soudu). Lhůta je zachována, pokud je poslední den podáno na poště nebo do datové schránky soudu.',
        order: 1,
        type: 'warning'
      },
      {
        id: 'odv-ch-2',
        title: '2. Náležitosti odvolání a odvolací důvody',
        content: 'V odvolání musí být uvedeno: kterému soudu je určeno, kdo ho podává, proti kterému rozsudku směřuje, v jakém rozsahu se napadá, v čem je spatřována nesprávnost rozhodnutí (skutková nebo právní) a čeho se odvolatel domáhá (odvolací petit).',
        order: 2,
        type: 'steps'
      },
      {
        id: 'odv-ch-3',
        title: '3. Účinky odvolání v péči vs. výživném',
        content: 'U výroků o péči o dítě a styku nemá odvolání odkladný účinek (platí předběžná vykonatelnost). U výživného je výrok vykonatelný co do běžného výživného, nikoli však zpětného doplatku před právní mocí.',
        order: 3,
        type: 'info'
      }
    ],
    checklist: [
      { id: 'odv-c1', label: 'Ověřit datum doručení rozsudku do datové schránky / obálky s pruhem' },
      { id: 'odv-c2', label: 'Přesně specifikovat napadené výroky (I., II., III.)' },
      { id: 'odv-c3', label: 'Zformulovat nový odvolací petit (jak má krajský soud rozhodnout)' },
      { id: 'odv-c4', label: 'Odeslat včas přes datovou schránku nebo doporučeně' }
    ],
    seoTitle: 'Odvolání v opatrovnickém řízení • Vzor a 15denní lhůta',
    seoDescription: 'Jak napsat a podat odvolání proti rozsudku o péči o dítě a výživném, zákonné lhůty a náležitosti.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-spis',
    slug: 'spis',
    title: 'Nahlížení do spisu & Příprava',
    subtitle: 'Jak nahlížet do spisu Nc na soudu a spisu Om na OSPODu.',
    excerpt: 'Praktický manuál, jak si vyžádat nahlížení do spisu, jak si vyfotit důkazy a jak odhalit nová tvrzení protistrany včas.',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    order: 4,
    status: 'PUBLISHED',
    badgeText: 'Důkazní příprava',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    disclaimer: 'Nahlížení do spisu je zákonné právo každého účastníka řízení zaručené občanským soudním řádem.',
    sources: [
      '§ 44 zákona č. 99/1963 Sb., občanský soudní řád',
      '§ 38 zákona č. 500/2004 Sb., správní řád'
    ],
    chapters: [
      {
        id: 'spis-ch-1',
        title: '1. Kde a jak žádat o nahlédnutí',
        content: 'Na soudu se nahlížení provádí v informačním centru nebo opatrovnické kanceláři po předchozím objednání s uvedením spisové značky (např. 12 Nc 34/2026). Na OSPODu podáváte písemnou žádost o nahlédnutí do spisu Om.',
        order: 1,
        type: 'steps'
      },
      {
        id: 'spis-ch-2',
        title: '2. Pořizování kopií a fotodokumentace',
        content: 'Máte plné právo si celý spis vyfotografovat vlastním telefonem nebo fotoaparátem zcela zdarma. Zkontrolujte zejména: zprávu OSPOD, vyjádření pediatra, zprávu ze školy a nová podání matky.',
        order: 2,
        type: 'info'
      }
    ],
    checklist: [
      { id: 'spis-c1', label: 'Zapsat si přesnou spisovou značku řízení (Nc)' },
      { id: 'spis-c2', label: 'Objednat termín v infocentru soudu s předstihem před jednáním' },
      { id: 'spis-c3', label: 'Nabitý mobilní telefon s dostatkem paměti na fotografie' },
      { id: 'spis-c4', label: 'Platný doklad totožnosti' }
    ],
    seoTitle: 'Nahlížení do soudního spisu a spisu OSPOD • Návod pro rodiče',
    seoDescription: 'Jak si sjednat nahlédnutí do opatrovnického spisu, na co máte právo a jak si bezplatně pořídit kopie všech listin.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-vykon-rozhodnuti',
    slug: 'vykon-rozhodnuti',
    title: 'Výkon rozhodnutí & Maření styku',
    subtitle: 'Postup při nerespektování rozsudku, nepředání dítěte a vymáhání péče.',
    excerpt: 'Co dělat při svévolném maření kontaktu s dítětem, jak dokumentovat neuskutečněná předání a jak podat návrh na výkon rozhodnutí s pokutami.',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    order: 5,
    status: 'PUBLISHED',
    badgeText: 'Vymáhání práva',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    disclaimer: 'Výkon rozhodnutí ukládáním pokut má vést k obnovení styku, nikoliv k eskalaci rodinného konfliktu.',
    sources: [
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 492 a násl.)',
      'Judikatura Ústavního soudu k maření rodičovského styku'
    ],
    chapters: [
      {
        id: 'vyk-ch-1',
        title: '1. Dokumentace maření styku',
        content: 'Pokud matka dítě v určený čas nepředá, zůstaňte klidní. Pošlete slušnou SMS s dotazem a žádostí o náhradní termín. Vyhněte se hysterii, bouchání na dveře či volání policie k běžným zpožděním (policie věc zpravidla odkáže na opatrovnický soud).',
        order: 1,
        type: 'warning'
      },
      {
        id: 'vyk-ch-2',
        title: '2. Výzva soudu a ukládání pokut do 50 000 Kč',
        content: 'Soud po podání návrhu na výkon rozhodnutí nejprve vyzve povinného rodiče k plnění. Při dalším maření ukládá opakované pokuty až do výše 50 000 Kč, které propadají státu. Při soustavném maření může soud změnit péči o dítě.',
        order: 2,
        type: 'steps'
      }
    ],
    checklist: [
      { id: 'vyk-c1', label: 'Pravomocný a vykonatelný rozsudek nebo předběžné opatření' },
      { id: 'vyk-c2', label: 'Evidence neproběhlých styků (data, časy, kopie zpráv)' },
      { id: 'vyk-c3', label: 'Důkaz o marném pokusu o převzetí dítěte na určeném místě' }
    ],
    seoTitle: 'Výkon rozhodnutí o styku s dítětem • Postup při maření',
    seoDescription: 'Jak vymáhat styk s dítětem, ukládání pokut za nepředání a změna péče při dlouhodobém bránění ve styku.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-znalecke-posudky',
    slug: 'znalecke-posudky',
    title: 'Znalecké posudky & Psychologie',
    subtitle: 'Jak probíhá znalecké zkoumání osobnosti rodičů a vztahů s dětmi.',
    excerpt: 'Kdy soud nařizuje znalecký posudek, jaké otázky znalci odpovídají, jak se připravit na psychotesty a jak se bránit nekvalitnímu posudku.',
    category: 'soud',
    categoryLabel: 'Soudní řízení',
    order: 6,
    status: 'PUBLISHED',
    badgeText: 'Psychologie & Znalci',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    disclaimer: 'Znalecký posudek je jedním z důkazů, nikoliv rozsudkem. Soud jej musí hodnotit v souvislostech.',
    sources: [
      'Zákon č. 254/2019 Sb., o znalcích, znaleckých kancelářích a znaleckých ústavech',
      '§ 127 zákona č. 99/1963 Sb., občanský soudní řád'
    ],
    chapters: [
      {
        id: 'znal-ch-1',
        title: '1. Kdy soud znalce nařídí a kolik to stojí',
        content: 'Znalecký posudek z oboru zdravotnictví, odvětví psychiatrie a psychologie soud nařizuje při závažných podezřeních na duševní poruchy, závislosti, syndrom zavrženého rodiče nebo silný odpor dítěte. Náklady (30 000–80 000 Kč) zpravidla hradí rodiče formou zálohy.',
        order: 1,
        type: 'info'
      },
      {
        id: 'znal-ch-2',
        title: '2. Průběh vyšetření a psychodiagnostické metody',
        content: 'Vyšetření zahrnuje anamnestický rozhovor, standardizované osobnostní dotazníky (MMPI-2, Rorschachův test atd.) a interakční zkoušku dítěte s každým z rodičů. Buďte přirození, nesnažte se manipulovat výsledky, znalci odhalí stylizaci.',
        order: 2,
        type: 'steps'
      },
      {
        id: 'znal-ch-3',
        title: '3. Námitky proti posudku a revizní posudek',
        content: 'Pokud posudek obsahuje metodické chyby, nepodložené závěry nebo znalec překročil své kompetence (např. právně hodnotil věc), podejte podrobné písemné námitky a požadujte výslech znalce u soudu.',
        order: 3,
        type: 'warning'
      }
    ],
    checklist: [
      { id: 'znal-c1', label: 'Přijít na vyšetření včas, odpočatý a střízlivý' },
      { id: 'znal-c2', label: 'Vzít s sebou brýle na čtení a zdravotní dokumentaci' },
      { id: 'znal-c3', label: 'Při interakci s dítětem se soustředit na hru a jeho pohodu, nikoli na znalce' }
    ],
    seoTitle: 'Znalecké posudky v rodinném právu • Průběh a námitky',
    seoDescription: 'Co obnáší psychologický znalecký posudek rodičů a dětí, jak probíhají testy a jak uplatnit námitky.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-skola',
    slug: 'skola',
    title: 'Škola, Školka & Vzdělávání dítěte',
    subtitle: 'Práva obou rodičů na informace ze školy a přístup do elektronických žákovských knížek.',
    excerpt: 'Jak si zajistit přístup do Bakalářů/EduPage, právo na účast na třídních schůzkách a řešení zápisů a odkladů bez souhlasu druhého rodiče.',
    category: 'pravo',
    categoryLabel: 'Práva rodičů',
    order: 7,
    status: 'PUBLISHED',
    badgeText: 'Vzdělávání',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    disclaimer: 'Škola nesmí diskriminovat žádného z rodičů, pokud nebyl zbaven rodičovské odpovědnosti.',
    sources: [
      'Zákon č. 561/2004 Sb., školský zákon (§ 21)',
      '§ 865 a násl. zákona č. 89/2012 Sb., občanský zákoník',
      'Metodický pokyn MŠMT k poskytování informací rodičům'
    ],
    chapters: [
      {
        id: 'skola-ch-1',
        title: '1. Rovná práva rodičů ve školském zákoně',
        content: 'Podle § 21 školského zákona mají oba zákonní zástupci stejné právo na informace o průběhu a výsledcích vzdělávání dítěte. Škola nesmí odmítnout vydat přístupové údaje do informačního systému (Bakaláři, EduPage, Škola OnLine) s odkazem na to, že dítě má v péči matka.',
        order: 1,
        type: 'info'
      },
      {
        id: 'skola-ch-2',
        title: '2. Výběr školy a přestup bez souhlasu druhého rodiče',
        content: 'Výběr školy či školky je významnou záležitostí dítěte (§ 877 o.z.). Jeden rodič nesmí dítě svévolně přehlásit na jinou školu bez písemného souhlasu druhého rodiče nebo nahrazujícího rozhodnutí soudu.',
        order: 2,
        type: 'warning'
      }
    ],
    checklist: [
      { id: 'skola-c1', label: 'Písemná žádost řediteli školy o vydání přístupových údajů do systému' },
      { id: 'skola-c2', label: 'Předložení rodného listu dítěte k prokázání otcovství' },
      { id: 'skola-c3', label: 'Žádost o zasílání informací o třídních schůzkách a akcích na vlastní e-mail' }
    ],
    seoTitle: 'Škola a práva rodičů • Bakaláři, třídní schůzky a přestupy',
    seoDescription: 'Práva otce na informace ze školy, přístup do elektronické žákovské knížky a postup při blokování informací.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-zdravotni-pece',
    slug: 'zdravotni-pece',
    title: 'Zdravotní péče & Informace o zdraví dítěte',
    subtitle: 'Nahlížení do zdravotnické dokumentace a souhlas s lékařskými zákroky.',
    excerpt: 'Jak získat výpis ze zdravotní karty u pediatra, právo na informace o hospitalizaci a řešení neshod o očkování či operacích.',
    category: 'pravo',
    categoryLabel: 'Práva rodičů',
    order: 8,
    status: 'PUBLISHED',
    badgeText: 'Zdravotnictví',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    disclaimer: 'Lékař je povinen poskytnout informace oběma rodičům, pokud rodičovská odpovědnost nebyla omezena soudem.',
    sources: [
      'Zákon č. 372/2011 Sb., o zdravotních službách (§ 65)',
      '§ 858 a násl. zákona č. 89/2012 Sb., občanský zákoník'
    ],
    chapters: [
      {
        id: 'zdrav-ch-1',
        title: '1. Nahlížení do zdravotnické dokumentace',
        content: 'Podle § 65 zákona o zdravotních službách má každý z rodičů právo nahlížet do zdravotnické dokumentace dítěte, pořizovat si výpisy a kopie. Lékař nesmí otci odepřít informace s odůvodněním, že „karty má u sebe matka“.',
        order: 1,
        type: 'info'
      },
      {
        id: 'zdrav-ch-2',
        title: '2. Souhlas s léčbou a závažnými zákroky',
        content: 'Běžnou péči zajišťuje rodič, u něhož se dítě právě nachází. U závažných lékařských zákroků (plánované operace, dlouhodobá medikace psychofarmaky) je nutný souhlas obou rodičů, jinak musí rozhodnout soud.',
        order: 2,
        type: 'warning'
      }
    ],
    checklist: [
      { id: 'zdrav-c1', label: 'Zapsat si kontakt na ošetřujícího pediatra a specialisty' },
      { id: 'zdrav-c2', label: 'Písemná žádost o nahlédnutí do zdravotnické dokumentace dítěte' },
      { id: 'zdrav-c3', label: 'Kartička pojištěnce nebo její fotokopie k dispozici při péči' }
    ],
    seoTitle: 'Zdravotní péče o dítě a práva rodičů • Zdravotnická dokumentace',
    seoDescription: 'Práva otce na informace o zdravotním stavu dítěte, nahlížení do karty u pediatra a souhlas se zákroky.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-mezinarodni-spory',
    slug: 'mezinarodni-spory',
    title: 'Mezinárodní únosy a přeshraniční spory',
    subtitle: 'Haagská úmluva, ÚMPOD a řešení neoprávněného přemístění dítěte do zahraničí.',
    excerpt: 'Co dělat při neoprávněném vycestování dítěte do ciziny, jak podat žádost k Úřadu pro mezinárodněprávní ochranu dětí a jak funguje návratové řízení.',
    category: 'pravo',
    categoryLabel: 'Mezinárodní právo',
    order: 9,
    status: 'PUBLISHED',
    badgeText: 'Haagská úmluva',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    disclaimer: 'Při podezření na mezinárodní únos dítěte je nutné jednat okamžitě, lhůty jsou kritické.',
    sources: [
      'Haagská úmluva o občanskoprávních aspektech mezinárodních únosů dětí (č. 34/1998 Sb.)',
      'Nařízení Rady (EU) 2019/1111 (Brusel IIb)',
      'Zákon č. 359/1999 Sb. (Úřad pro mezinárodněprávní ochranu dětí - ÚMPOD)'
    ],
    chapters: [
      {
        id: 'mez-ch-1',
        title: '1. Co je mezinárodní únos dítěte',
        content: 'Mezinárodním únosem je neoprávněné přemístění nebo zadržení dítěte v jiném státě, než ve kterém mělo své obvyklé bydliště, pokud tím bylo porušeno právo péče o dítě druhého rodiče.',
        order: 1,
        type: 'warning'
      },
      {
        id: 'mez-ch-2',
        title: '2. Role Úřadu pro mezinárodněprávní ochranu dětí (ÚMPOD)',
        content: 'ÚMPOD sídlící v Brně je ústředním orgánem ČR pro Haagskou úmluvu. Pomáhá zprostředkovat návratové řízení, komunikuje se zahraničními orgány a zajišťuje bezplatnou asistenci při zahájení řízení v cizině.',
        order: 2,
        type: 'steps'
      }
    ],
    checklist: [
      { id: 'mez-c1', label: 'Okamžitý kontakt na ÚMPOD (umpod.cz, tel. +420 542 215 522)' },
      { id: 'mez-c2', label: 'Doložit rodný list a důkaz o obvyklém bydlišti dítěte v ČR (školka, lékař)' },
      { id: 'mez-c3', label: 'Doložit, že jste nedali písemný souhlas s trvalým přestěhováním do ciziny' }
    ],
    seoTitle: 'Mezinárodní únosy dětí a Haagská úmluva • Postup ÚMPOD',
    seoDescription: 'Právní obrana při neoprávněném odvezení dítěte do zahraničí, návratové řízení a asistence ÚMPOD.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  }
];
