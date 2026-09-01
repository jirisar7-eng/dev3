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
    title: 'Nahlížení do spisu OSPOD a soudu',
    subtitle: 'Procesní postup nahlížení do spisu Om na OSPOD a spisu Nc u soudu, zákonné právo na bezplatné kopie a obrana proti obstrukcím.',
    excerpt: 'Komplexní právní průvodce pro rodiče: Rozdíl mezi soudním a úředním spisem, uplatnění § 38 správního řádu a § 55 ZSPOD, judikatura NSS k fotodokumentaci a postup při nezákonném odepření nahlédnutí.',
    category: 'soud',
    categoryLabel: 'Soudní řízení & OSPOD',
    order: 4,
    status: 'PUBLISHED',
    badgeText: 'Důkazní příprava & OSPOD',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    disclaimer: 'Informace mají metodický charakter a vycházejí ze zákonných norem a judikatury soudů ČR. Nenahrazují individuální právní poradenství advokáta.',
    sources: [
      '§ 38 zákona č. 500/2004 Sb., správní řád (nahlížení do spisu a pořizování kopií)',
      '§ 55 zákona č. 359/1999 Sb., o sociálně-právní ochraně dětí (spisová dokumentace Om a evidence)',
      '§ 44 zákona č. 99/1963 Sb., občanský soudní řád (nahlížení účastníka do soudního spisu)',
      'Rozsudek NSS sp. zn. 1 As 7/2010 (právo na bezplatné pořízení fotodokumentace spisu vlastním zařízením)',
      'Rozsudek NSS sp. zn. 6 As 242/2014 (nepřípustnost zpoplatnění vlastní fotodokumentace správního spisu)',
      'Nález Ústavního soudu sp. zn. II. ÚS 866/12 (zákaz zatajování důkazních listin a rovnost zbraní)'
    ],
    chapters: [
      {
        id: 'spis-ch-1',
        title: '1. Dva různé spisy: Soudní spis (Nc / P a Nc) vs. spis Om na OSPOD',
        content: 'V opatrovnických věcech existují dvě zcela oddělené složky:\n\n1. **Soudní spis (sp. zn. Nc nebo P a Nc):** Vedený u okresního soudu. Obsahuje veškerá písemná podání rodičů, vyjádření kolizního opatrovníka (zprávy OSPOD), znalecké posudky, protokoly ze soudních jednání a doručenky. Nahlížení se řídí **§ 44 občanského soudního řádu (o.s.ř.)**.\n\n2. **Spis Om (a spis Nom) na OSPOD:** Vedený u příslušného orgánu sociálně-právní ochrany dětí (městský/obecní úřad). Obsahuje úřední záznamy z rozhovorů s oběma rodiči, záznamy z návštěv v rodině (sociální šetření), zprávy od dětského lékaře, ze školy a školky a interní záznamy. Nahlížení se řídí **§ 38 správního řádu** ve spojení s **§ 55 zákona č. 359/1999 Sb. (ZSPOD)**.\n\nZatímco soudní spis zachycuje formální procesní dění, spis OSPOD často obsahuje bezprostřední záznamy úředníků, které se do soudu dostanou až ve formě shrnující zprávy.',
        order: 1,
        type: 'info'
      },
      {
        id: 'spis-ch-2',
        title: '2. Zákonné právo na bezplatnou fotodokumentaci a judikatura NSS',
        content: 'Jako rodič máte nezadatelné právo pořídit si kopie veškerých listin ve spisu vlastním technickým zařízením (chytrým telefonem, fotoaparátem, přenosným skenerem).\n\n- **Bezplatnost:** Dle konstantní judikatury Nejvyššího správního soudu (**rozsudek NSS sp. zn. 1 As 7/2010 a 6 As 242/2014**) je pořizování kopií vlastním zařízením bezplatné. Úřad ani soud nesmí za použití vlastního telefonu účtovat žádné poplatky ani jej podmiňovat souhlasem druhého rodiče.\n- **Zákaz obstrukcí:** Úředník vám nesmí bránit ve focení spisu argumentem, že „kopírování je zakázáno“ nebo „musíte si zažádat o placené úřední kopie“. Máte právo nafotit celý spis list po listu včetně úředních záznamů a doručenek.',
        order: 2,
        type: 'warning'
      },
      {
        id: 'spis-ch-3',
        title: '3. Spis Om na OSPOD a limity oddělené části spisu (§ 55 odst. 5 ZSPOD)',
        content: 'Zákon o SPOD v **§ 55 odst. 5** stanoví, že do spisové dokumentace Om má právo nahlížet rodič, kterému náleží rodičovská odpovědnost, nebo jiná osoba odpovědná za výchovu dítěte.\n\n- **Oddělená část spisu:** OSPOD může do oddělené části vložit pouze údaje, jejichž prozrazení by mohlo ohrozit život nebo zdraví dítěte, oznamovatele nebo fyzické osoby, která upozornila na porušování péče.\n- **Zneužívání oddělené části:** OSPOD nesmí do oddělené části schovávat běžná vyjádření matky/otce, pedagogické zprávy ze školy či běžnou korespondenci. Pokud OSPOD předloží soudu zprávu, která vychází z podkladů v oddělené části, porušuje právo na spravedlivý proces (**nález Ústavního soudu sp. zn. II. ÚS 866/12**). Vše, o co se opírá soudní zpráva, musí mít rodič právo znát a vyjádřit se k tomu.',
        order: 3,
        type: 'info'
      },
      {
        id: 'spis-ch-4',
        title: '4. Procesní obrana: Odmítnutí nahlížení a usnesení dle § 38 odst. 5 SŘ',
        content: 'Pokud sociální pracovník OSPOD odmítá nahlédnutí umožnit (např. argumentuje nedostatkem času, nepřítomností vedoucího nebo nepravdivě tvrdí, že nemáte právo nahlížet):\n\n1. **Trvejte na vydání formálního usnesení:** Dle **§ 38 odst. 5 správního řádu** platí: *„Odepřít nahlížet do spisu nebo jeho části lze pouze usnesením.“* Ústní odmítnutí je procesně neplatné.\n2. **Upozorněte úředníka na povinnost vydat usnesení:** Vyžádejte si písemné usnesení s odůvodněním, proč vám nahlížení odpírají.\n3. **Podání odvolání:** Proti usnesení o odepření nahlížení do spisu lze podat odvolání ke krajskému úřadu (lhůta 15 dnů). Krajský úřad nezákonné odepření zpravidla obratem zruší.\n4. **Podnět k nápravě a stížnost dle § 175 SŘ:** Proti nevhodnému chování úředníka nebo průtahům podejte písemnou stížnost vedoucímu odboru sociálních věcí.',
        order: 4,
        type: 'steps'
      },
      {
        id: 'spis-ch-5',
        title: '5. Metodika analýzy spisu a záznam námitek do protokolu (§ 18 SŘ)',
        content: 'Při nahlížení postupujte systematicky:\n\n1. **Žádejte protokol o nahlížení:** Dle **§ 18 správního řádu** má být o nahlížení sepsán protokol, v němž můžete uvést své námitky k obsahu spisu.\n2. **Fotografujte v chronologickém pořadí:** Nafoťte sběrný arch (soupis listin), jednotlivá podání a obálky/doručenky.\n3. **Hledejte asymetrie v záznamech:** Zkontrolujte, zda úředník OSPOD zaznamenal vaše telefonáty a schůzky stejně podrobně jako kontakty s druhým rodičem.\n4. **Zkontrolujte zprávu pro soud:** Pokud OSPOD odeslal soudu zprávu s doporučením, porovnejte, zda zpráva odpovídá listinným důkazům ve spisu, nebo zda některé příznivé skutečnosti zamlčela.',
        order: 5,
        type: 'steps'
      },
      {
        id: 'spis-ch-6',
        title: '6. Klíčové listiny ke kontrole před soudním jednáním',
        content: 'Před každým opatrovnickým soudem ověřte přítomnost těchto konkrétních dokumentů ve spisu:\n\n- **Vyjádření dětského lékaře (pediatra):** Zda obsahuje objektivní záznamy o zdravotním stavu dítěte a zda je v kartě evidován i otec.\n- **Zprávy ze školy a školky:** Zda škola poskytla vyvážené informace a zda nepopisuje vliv konfliktu jednostranně.\n- **Písemná podání druhého rodiče:** Včasné odhalení nepravdivých obvinění vám umožní připravit listinné protidůkazy ještě před zahájením výslechu.\n- **Úřední záznamy OSPOD o rozhovoru s dítětem:** Jakým způsobem byl rozhovor veden a zda nebyl na dítě vyvíjen sugestivní nátlak.',
        order: 6,
        type: 'checklist'
      }
    ],
    checklist: [
      { id: 'spis-c1', label: 'Zjistit a zapsat přesnou spisovou značku řízení (Nc na soudu, spis Om na OSPOD)' },
      { id: 'spis-c2', label: 'Objednat se v infocentru soudu či u sociální pracovnice OSPOD písemně/telefonicky 7–10 dnů před jednáním' },
      { id: 'spis-c3', label: 'Vzít s sebou platný doklad totožnosti (OP/pas) a plně nabitý mobilní telefon s dostatkem volné paměti' },
      { id: 'spis-c4', label: 'Nafoťte spis kompletně od první do poslední strany včetně sběrného archu a doručenek' },
      { id: 'spis-c5', label: 'Pokud úředník odpírá nahlédnutí, trvat na vydání písemného usnesení o odepření dle § 38 odst. 5 správního řádu' },
      { id: 'spis-c6', label: 'Založit pořízené fotografie do klientské složky Můj případ a provést časovou osu tvrzení protistrany' }
    ],
    faqs: [
      {
        question: 'Může mi pracovník OSPOD zakázat fotografování spisu Om vlastním telefonem?',
        answer: 'Nikoliv. Nejvyšší správní soud opakovaně judikoval (např. rozsudek sp. zn. 1 As 7/2010 a 6 As 242/2014), že právo na nahlížení zahrnuje i právo pořizovat si kopie a výpisy vlastními technickými prostředky bezplatně. Zákaz focení nebo požadavek na platbu za vlastní fotky je nezákonný.'
      },
      {
        question: 'Co dělat, pokud OSPOD tvrdí, že podklady jsou v „tajné / oddělené části spisu“?',
        answer: 'Dle § 55 odst. 5 ZSPOD smí být v oddělené části pouze údaje ohrožující život, zdraví či bezpečí oznamovatele. Běžné zprávy školy, vyjádření matky či lékařské zprávy v oddělené části být nesmí. Ústavní soud (II. ÚS 866/12) potvrdil, že soud ani OSPOD nesmí rozhodovat na základě důkazů, se kterými se účastník nemohl seznámit.'
      },
      {
        question: 'Jak postupovat, pokud úředník OSPOD odmítá spis zpřístupnit nebo tvrdí, že nemá čas?',
        answer: 'Požádejte o vydání písemného usnesení o odepření nahlížení dle § 38 odst. 5 správního řádu. Samotná hrozba nutnosti vydat formální usnesení většinou vede k okamžitému zpřístupnění spisu. Pokud usnesení vydají, podejte do 15 dnů odvolání ke krajskému úřadu.'
      },
      {
        question: 'Kdy je nejvhodnější do soudního spisu nahlížet?',
        answer: 'Ideálně 7 až 10 kalendářních dnů před nařízeným soudním jednáním. V této době jsou již ve spise založena vyjádření kolizního opatrovníka i protistrany a máte dostatek času na přípravu písemné repliky a protidůkazů.'
      }
    ],
    seoTitle: 'Nahlížení do spisu OSPOD a soudního spisu • Průvodce a fotodokumentace',
    seoDescription: 'Právní manuál pro rodiče: Nahlížení do spisu Om na OSPOD a spisu Nc u soudu dle § 38 SŘ a § 55 ZSPOD. Bezplatné kopie a judikatura NSS.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
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
  },
  {
    id: 'guide-subjekty',
    slug: 'subjekty',
    title: 'Kdo je kdo v opatrovnickém řízení',
    subtitle: 'Přehled klíčových odborníků, institucí a jejich rolí při rozhodování o dětech.',
    excerpt: 'Srozumitelný průvodce pro rodiče, který objasňuje pravomoci a úkoly soudů, OSPODu, znalců, advokátů a poraden s přímým odkazem na náš Registr subjektů.',
    category: 'pravo',
    categoryLabel: 'Opatrovnictví & Právo',
    order: 10,
    status: 'PUBLISHED',
    badgeText: 'Odborný přehled',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    disclaimer: 'Tento přehled slouží výhradně k orientaci v opatrovnické soustavě ČR a nenahrazuje individuální právní zastoupení či odbornou psychologickou pomoc.',
    sources: [
      'Zákon č. 89/2012 Sb., občanský zákoník',
      'Zákon č. 359/1999 Sb., o sociálně-právní ochraně dětí',
      'Zákon č. 254/2019 Sb., o znalcích, znaleckých kancelářích a znaleckých ústavech',
      'Zákon č. 85/1996 Sb., o advokacii'
    ],
    chapters: [
      {
        id: 'subj-ch-1',
        title: '1. Opatrovnické soudy – Rozhodovací autorita',
        content: 'Opatrovnické soudy (okresní, obvodní či městské soudy) jsou jedinou autoritou, která může pravomocně rozhodnout o péči, výživném a styku rodičů s nezletilým dítětem. Soud rozhoduje vždy na základě shromážděných důkazů a jeho prvořadým kritériem je **nejlepší zájem dítěte** (§ 866 o.z.). Soudce nehledá vítěze sporu, ale stabilní uspořádání pro budoucnost dítěte. Kompletní seznam a kontakty na všech 109 soudů v ČR naleznete v našem [Registru soudů](/registr-subjektu?type=SOUD).',
        order: 1,
        type: 'info'
      },
      {
        id: 'subj-ch-2',
        title: '2. OSPOD – Kolizní opatrovník a ochránce práv dítěte',
        content: 'Orgán sociálně-právní ochrany dětí (OSPOD) je soudem jmenován jako **kolizní opatrovník** dítěte, protože dítě jako nezletilé nemůže v řízení samo právně jednat. Sociální pracovník OSPODu provádí sociální šetření v domácnostech obou rodičů, mluví s dítětem (zjišťuje jeho názor úměrně věku) a vypracovává pro soud doporučující zprávu. OSPOD není obhájcem matky ani otce, jeho úkolem je nestranně chránit blaho nezletilého. Pro vyhledání příslušného pracoviště využijte náš [Registr OSPOD](/registr-subjektu?type=OSPOD).',
        order: 2,
        type: 'steps'
      },
      {
        id: 'subj-ch-3',
        title: '3. Soudní znalci – Odborné posouzení rodinných vazeb',
        content: 'Soudní znalci z oboru psychologie a psychiatrie jsou jmenováni soudem v případech, kdy mezi rodiči panuje hluboký konflikt, hrozí odcizení dítěte (syndrom zavrženého rodiče) nebo je třeba odborně posoudit výchovné kompetence. Znalec provádí vyšetření obou rodičů i dítěte a zkoumá jejich vzájemnou interakci. Výstupem je znalecký posudek, který pro soud představuje významný (nikoli však jediný závazný) důkaz. Seznam licencovaných znalců naleznete v sekci [Registr soudních znalců](/registr-subjektu?type=ZNALEC).',
        order: 3,
        type: 'warning'
      },
      {
        id: 'subj-ch-4',
        title: '4. Rodinní advokáti – Právní zastoupení a vyjednávání',
        content: 'Advokát specializovaný na rodinné právo zastupuje zájmy rodiče v řízení. Dobrý opatrovnický advokát se vyznačuje tím, že neeskaluje konflikt, ale usiluje o smírné vyřešení a uzavření rodičovské dohody, která je pro dítě vždy nejméně zatěžující. Pomáhá správně formulovat soudní návrhy a vyvarovat se procesních chyb. Kontakty na ověřené odborníky naleznete v kategorii [Registr rodinných advokátů](/registr-subjektu?type=ADVOKAT).',
        order: 4,
        type: 'info'
      },
      {
        id: 'subj-ch-5',
        title: '5. Poradny, mediátoři a rodinná centra – Mimosoudní podpora',
        content: 'Mediátoři a rodinné poradny hrají klíčovou roli v mimosoudním řešení sporů. Mediace je dobrovolný proces, kde nezávislý odborník (mediátor) pomáhá rodičům nalézt společné řešení a uzavřít dohodu o péči a výživném bez vleklých soudních bitev. Rodinná centra a psychologické poradny pak nabízejí doprovázení, terapii pro děti i rodiče a kurzy zdravé spolurodičovské komunikace. Kontakty na tato centra najdete pod položkou [Registr poraden a mediátorů](/registr-subjektu?type=PORADNA_CHARITA).',
        order: 5,
        type: 'checklist'
      }
    ],
    checklist: [
      { id: 'subj-c1', label: 'Ujasnit si roli každého subjektu před zahájením jednání' },
      { id: 'subj-c2', label: 'Komunikovat se všemi subjekty (soud, OSPOD, znalci) slušně, věcně a bez emocí' },
      { id: 'subj-c3', label: 'Upřednostnit mimosoudní dohodu a mediaci před soudním rozhodnutím' },
      { id: 'subj-c4', label: 'Vždy stavět nejlepší zájem a psychickou pohodu dítěte na první místo' }
    ],
    seoTitle: 'Kdo je kdo v opatrovnickém řízení • Přehled institucí a odborníků',
    seoDescription: 'Kompletní přehled rolí soudů, OSPODu, soudních znalců, advokátů a rodinných poraden v opatrovnickém řízení v České republice.',
    createdAt: '2026-08-22T00:00:00.000Z',
    updatedAt: '2026-08-22T00:00:00.000Z',
  },
  {
    id: 'guide-predbezne-opatreni-452',
    slug: 'predbezne-opatreni-452-zrs',
    title: 'Předběžné opatření ve věcech péče a styku (§ 452 ZŘS)',
    subtitle: 'Metodický procesní průvodce pro urgentní situace: zamezení styku, svévolné odstěhování a ochrana vazeb s dítětem.',
    excerpt: 'Komplexní rozbor podmínek pro vydání předběžného opatření podle § 452 ZŘS a § 74 an. OSŘ, lhůty pro rozhodnutí, formulace petitu a judikatura Ústavního soudu.',
    category: 'soud',
    categoryLabel: 'Soudní řízení & Judikatura',
    order: 11,
    status: 'PUBLISHED',
    badgeText: 'Urgentní právní ochrana',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    disclaimer: 'Tento metodický průvodce vychází z platného znění zákona č. 292/2013 Sb. (ZŘS), zákona č. 99/1963 Sb. (OSŘ) a ustálené judikatury Ústavního soudu ČR. Jedná se o edukační a metodický rozbor procesních postupů (AI_DERIVED / METHODOLOGY) a nenahrazuje individuální právní pomoc advokáta v konkrétní věci.',
    sources: [
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 452–§ 465)',
      'Zákon č. 99/1963 Sb., občanský soudní řád (§ 74–§ 77b, § 102)',
      'Nález Ústavního soudu sp. zn. II. ÚS 3436/14 ze dne 14. 4. 2015 (K povinnosti soudu zatímně upravit styk při svévolném odepření kontaktu)',
      'Nález Ústavního soudu sp. zn. I. ÚS 615/17 ze dne 21. 6. 2017 (K ochraně práva dítěte na oba rodiče prostřednictvím předběžného opatření)',
      'Nález Ústavního soudu sp. zn. II. ÚS 3765/17 ze dne 19. 12. 2017 (K nepřípustnosti pasivity soudu při postupném odcizování dítěte)'
    ],
    chapters: [
      {
        id: 'po-ch-1',
        title: '1. Účel předběžného opatření a rozdíl mezi § 452 ZŘS a obecným § 74 OSŘ',
        content: 'Předběžné opatření v rodinněprávních věcech slouží k **rychlé a zatímní úpravě poměrů dítěte** v situacích, kdy je nutný okamžitý zásah soudu předtím, než může proběhnout plnohodnotné a časově náročné dokazování v hlavním řízení. Zvláštní předběžné opatření podle **§ 452 zákona o zvláštních řízeních soudních (ZŘS)** řeší urgentní situaci, kdy se dítě ocitlo bez jakékoliv péče nebo je jeho život, zdraví či příznivý vývoj vážně ohrožen (rozhoduje se do 24 hodin na návrh OSPODu). Naopak běžné předběžné opatření o úpravě styku či péče podávané rodičem se řídí **§ 74 a násl. občanského soudního řádu (OSŘ)** ve spojení s ustanoveními ZŘS, kde má soud lhůtu pro rozhodnutí **7 dnů** od podání návrhu.',
        order: 1,
        type: 'info'
      },
      {
        id: 'po-ch-2',
        title: '2. Kdy má návrh šanci na úspěch: Zamezení styku a svévolná změna poměrů',
        content: 'Ústavní soud opakovaně judikoval (zejména v nálezu **II. ÚS 3436/14** a **I. ÚS 615/17**), že pokud jeden z rodičů jednostranně a bez legitimního důvodu zcela odstřihne druhého rodiče od kontaktu s dítětem, vzniká **akutní nebezpečí nevratného přetrhání citových vazeb**. V takovém případě je soud **povinen** poměry zatímně upravit předběžným opatřením. Důvody pro nařízení jsou zejména: 1) úplné odepření fyzického i telefonického kontaktu, 2) pokus o svévolné přestěhování dítěte do jiného okresu/státu bez souhlasu druhého rodiče, 3) hrubé manipulativní jednání a izolace dítěte. Pouhá obava bez doložených důkazů však k nařízení nestačí.',
        order: 2,
        type: 'warning'
      },
      {
        id: 'po-ch-3',
        title: '3. Lhůty soudu pro rozhodnutí, vykonatelnost doručením a odvolání',
        content: 'Soud rozhoduje o návrhu rodiče na předběžné opatření ve lhůtě **7 kalendářních dnů** ode dne doručení návrhu (§ 102 odst. 1 OSŘ). Rozhodnutí je **vykonatelné okamžikem jeho doručení** povinnému rodiči (resp. vyhlášením či vyvěšením, pokud to stanoví zákon). Proti usnesení o nařízení či zamítnutí předběžného opatření lze podat **odvolání do 15 dnů** od doručení k příslušnému krajskému soudu. Důležité: **Odvolání nemá odkladný účinek!** Nařízené předběžné opatření je druhý rodič povinen respektovat ihned po doručení.',
        order: 3,
        type: 'steps'
      },
      {
        id: 'po-ch-4',
        title: '4. Náležitosti návrhu, precizní formulace petitu a povinné důkazy',
        content: 'Nejčastějším důvodem zamítnutí návrhu na předběžné opatření je vágní formulace nebo nedostatek osvědčených skutečností. V návrhu musíte: **1) Jednoznačně identifikovat účastníky** (otec, matka, nezletilé dítě včetně RČ a bydliště), **2) Osvědčit naléhavost situace** (proč věc nesnese odkladu do konečného rozsudku), **3) Přesně formulovat žalobní návrh (petit)** – např. přesné vymezení lichých/sudých týdnů od pátku 16:00 do neděle 18:00, místo předání a předávající osoby, **4) Přiložit listinné důkazy** (rodný list dítěte, printscreeny odmítavých SMS zpráv, e-mailů, záznamy o marných pokusech o kontakt či zprávy OSPODu).',
        order: 4,
        type: 'checklist'
      },
      {
        id: 'po-ch-5',
        title: '5. Úloha OSPODu, kolizního opatrovníka a souběžné řízení ve věci samé',
        content: 'Předběžné opatření je svou povahou dočasné. Soud při jeho nařízení zpravidla stanoví navrhovateli lhůtu k podání **návrhu na zahájení řízení ve věci samé** (pokud již řízení o úpravě péče a styku neběží podle § 459 ZŘS). OSPOD je soudem neprodleně vyrozuměn a je ustanoven kolizním opatrovníkem nezletilého. Je klíčové informovat sociální pracovnici OSPODu o podaném návrhu ještě před rozhodnutím soudu a předat jí veškeré důkazy o obstrukcích druhého rodiče, aby mohla soudu poskytnout součinnost.',
        order: 5,
        type: 'info'
      }
    ],
    checklist: [
      { id: 'po-c1', label: 'Jednoznačně a detailně formulovaný návrh výroku (petit) s konkrétními dny, časy a místem předání' },
      { id: 'po-c2', label: 'Prokázání a doložení naléhavé potřeby zatímní úpravy (akutní hrozba odcizení dítěte)' },
      { id: 'po-c3', label: 'Přiložené listinné důkazy (rodný list, písemná komunikace dokládající odmítání styku)' },
      { id: 'po-c4', label: 'Podání k místně příslušnému okresnímu soudu podle trvalého bydliště nezletilého dítěte' },
      { id: 'po-c5', label: 'Souběžně podaný nebo běžící návrh na úpravu péče a styku ve věci samé' }
    ],
    faqs: [
      {
        question: 'Platí se za návrh na předběžné opatření v opatrovnické věci soudní poplatek?',
        answer: 'Ne. Řízení ve věcech péče soudu o nezletilé, včetně návrhů na předběžná opatření týkajících se péče a styku s dětmi, je ze zákona osvobozeno od soudních poplatků podle zákona č. 549/1991 Sb., o soudních poplatcích. Neskládá se ani jistota (kauce 10 000 Kč), která se jinak skládá u majetkových předběžných opatření.'
      },
      {
        question: 'Co dělat, když matka/otec nerespektuje nařízené předběžné opatření?',
        answer: 'Předběžné opatření je vykonatelným titulem. Pokud druhý rodič brání styku navzdory doručenému usnesení soudu, neprodleně podejte k opatrovnickému soudu Návrh na výkon rozhodnutí (§ 500 ZŘS) a požádejte o uložení pokuty až do výše 50 000 Kč.'
      },
      {
        question: 'Jak dlouho předběžné opatření platí?',
        answer: 'Předběžné opatření platí do doby, než nabude právní moci konečný rozsudek soudu ve věci samé, pokud jej soud v průběhu řízení nezruší nebo nezmění na základě změny poměrů.'
      }
    ],
    seoTitle: 'Předběžné opatření na péči a styk s dítětem (§ 452 ZŘS) • Kompletní manuál',
    seoDescription: 'Podrobný právní návod jak podat návrh na předběžné opatření při zamezení styku s dítětem, vzor petitu, lhůty soudu 7 dnů a judikatura Ústavního soudu ČR.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  },
  {
    id: 'guide-vyzivne',
    slug: 'vyzivne',
    title: 'Výživné na dítě & Metodika dokazování příjmů',
    subtitle: 'Komplexní průvodce výpočtem výživného, doporučujícími tabulkami MS ČR, dokazováním u OSVČ a specifiky střídavé péče.',
    excerpt: 'Podrobný rozbor zákonných zásad výživného (§ 910–§ 923 OZ), algoritmus tabulek Ministerstva spravedlnosti ČR, řešení potenciality příjmů OSVČ, kompenzace při střídavé péči a mimořádné výdaje.',
    category: 'finance',
    categoryLabel: 'Finance & Výživné',
    order: 12,
    status: 'PUBLISHED',
    badgeText: 'Metodika & Judikatura',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    disclaimer: 'Tento metodický průvodce vychází z platného znění zákona č. 89/2012 Sb. (občanský zákoník), metodického materiálu Ministerstva spravedlnosti ČR k určování výživného a ustálené judikatury Ústavního a Nejvyššího soudu ČR. Jedná se o odborný metodický a edukační rozbor (AI_DERIVED / METHODOLOGY) s orientačním charakterem výpočtů a nenahrazuje individuální právní pomoc advokáta v konkrétní věci.',
    sources: [
      'Zákon č. 89/2012 Sb., občanský zákoník (§ 910–§ 923, § 877)',
      'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 466–§ 477)',
      'Zákon č. 120/2001 Sb., exekuční řád (§ 71a)',
      'Zákon č. 588/2020 Sb., o náhradním výživném pro nezaopatřené dítě',
      'Doporučující tabulka a metodika Ministerstva spravedlnosti ČR pro určování výživného (verze 2022/2023, vyzivne.justice.cz)',
      'Nález Ústavního soudu sp. zn. IV. ÚS 650/15 ze dne 16. 12. 2015 (K principu shodné životní úrovně a výživnému z nadstandardních příjmů)',
      'Nález Ústavního soudu sp. zn. I. ÚS 3065/21 ze dne 3. 5. 2022 (K výživnému a kompenzaci životní úrovně při střídavé péči)',
      'Nález Ústavního soudu sp. zn. I. ÚS 2482/13 ze dne 26. 5. 2014 (Ke kritériím střídavé péče a rodičovské odpovědnosti)'
    ],
    chapters: [
      {
        id: 'vyz-ch-1',
        title: '1. Základy vyživovací povinnosti a princip shodné životní úrovně (§ 910–§ 923 OZ)',
        content: 'Vyživovací povinnost rodičů k dětem je primárním zákonným institutem rodinného práva (§ 910 a násl. občanského zákoníku). Základním východiskem je **princip shodné životní úrovně dítěte a rodičů** (§ 915 odst. 1 OZ). Tento princip má přednost před pouhým mechanickým hodnocením minimálních odůvodněných potřeb dítěte – dítě má nezadatelné právo podílet se na reálné životní a ekonomické úrovni obou svých rodičů. Zároveň platí, že oba rodiče přispívají na výživu podle svých schopností, možností a majetkových poměrů (§ 913 odst. 1 OZ), přičemž soud zkoumá nejen faktické příjmy, ale i to, zda se rodič bez vážného důvodu nevzdal výhodnějšího zaměstnání či majetkového prospěchu (§ 913 odst. 2 OZ).',
        order: 1,
        type: 'info'
      },
      {
        id: 'vyz-ch-2',
        title: '2. Doporučující tabulka Ministerstva spravedlnosti ČR a algoritmus výpočtu',
        content: 'Ministerstvo spravedlnosti ČR vydalo aktualizovanou metodiku s doporučujícími tabulkami (verze 2022/2023, účinná od 1. 9. 2022), která rozděluje vývoj dítěte do **4 životních etap**: 1. etapa (0–5 let), 2. etapa (6–10 let, 1. stupeň ZŠ), 3. etapa (11–15 let, 2. stupeň ZŠ) a 4. etapa (16+ let, SŠ a VŠ). Výchozí procentní podíl z čistého příjmu klesá s celkovým počtem vyživovacích povinností (např. při 1 dítěti činí 14–20 %, při 2 dětech 12–16 %, při 3 dětech 10–14 %). Klíčovým ochranným prvkem metodiky je tzv. **kontrolní částka** (zpravidla 55–66 % čistého příjmu), která musí povinnému rodiči zůstat pro zachování vlastní důstojné obživy a pracovní motivace. Při stanovení výživného se navíc provádí matematický **odečet za rozsah osobní péče**, kdy je vypočtená částka poměrně redukována podle počtu dnů v měsíci, kdy má dítě v osobní péči povinný rodič. Pro okamžitý orientační propočet můžete využít naši [Kalkulačku výživného](/kalkulacka-vyzivneho).',
        order: 2,
        type: 'steps'
      },
      {
        id: 'vyz-ch-3',
        title: '3. Potencialita příjmů a dokazování u podnikatelů a OSVČ (§ 913 odst. 2 a § 916 OZ)',
        content: 'U rodičů podnikajících jako OSVČ nelze vycházet pouze z daňového přiznání. Využití daňové optimalizace, paušálních výdajů či účetních odpisů často vede k vykázání minimálního základu daně nebo ztráty, což neodráží skutečné majetkové toky a disponibilní příjem. Opatrovnické soudy jsou podle **§ 913 odst. 2 OZ** povinny zkoumat reálnou **potencialitu příjmů** – tedy jakých výdělků by rodič mohl dosahovat s ohledem na své vzdělání, praxi, situaci na trhu práce a celkové majetkové zázemí (srov. nález Ústavního soudu sp. zn. **IV. ÚS 650/15**). Pokud povinný rodič odmítá doložit své kompletní účetnictví a bankovní výpisy, uplatní soud zákonnou domněnku podle **§ 916 OZ**, podle níž se má za to, že měsíční příjem rodiče činí 25násobek životního minima jednotlivce.',
        order: 3,
        type: 'warning'
      },
      {
        id: 'vyz-ch-4',
        title: '4. Výživné při střídavé a rovnocenné péči (I. ÚS 3065/21 a IV. ÚS 650/15)',
        content: 'Častým mýtem je představa, že při rovnoměrném rozdělení péče 50/50 se výživné nikdy neplatí. Ústavní soud v nálezech sp. zn. **I. ÚS 3065/21** a **IV. ÚS 650/15** zdůraznil, že i při střídavé péči je nutné v odůvodněných případech kompenzovat podstatný rozdíl v životní úrovni obou rodičů. Cílem je, aby dítě při přechodu mezi domácnostmi nezažívalo v jedné materiální deprivaci a ve druhé přepych. Soud může: 1) určit výživné oběma rodičům vzájemně, 2) určit výživné pouze lépe situovanému rodiči k rukám druhého, nebo 3) schválit dohodu o nulovém výživném s přesným určením, kdo hradí společné fixní náklady (školné, kroužky, rovnátka).',
        order: 4,
        type: 'info'
      },
      {
        id: 'vyz-ch-5',
        title: '5. Mimořádné a nahodilé výdaje (§ 877 a § 917 OZ)',
        content: 'Pravidelné měsíční výživné stanovené soudem slouží k úhradě všech běžných, předvídatelných a opakujících se nákladů na dítě (strava, běžné ošacení, hygiena, standardní školní pomůcky a běžné zájmy). Výdaje většího rozsahu, které vznikají jednorázově či nahodile (např. ortodontická léčba/rovnátka, zahraniční studijní pobyt, nákladné kroužky), představují podstatné záležitosti dítěte ve smyslu **§ 877 OZ**, o kterých jsou rodiče povinni se předem dohodnout. Nelze je bez předchozí dohody jednostranně naúčtovat druhému rodiči nad rámec výživného. Soud může pro tyto účely stanovit tvorbu zvláštních úspor pro dítě podle **§ 917 OZ**.',
        order: 5,
        type: 'checklist'
      },
      {
        id: 'vyz-ch-6',
        title: '6. Změna poměrů a zpětné přiznání či snížení výživného (§ 923 OZ)',
        content: 'Dojde-li k podstatné změně poměrů na straně dítěte (nástup na střední/vysokou školu, zvýšené náklady na léčbu) nebo na straně rodiče (ztráta práce ze zdravotních důvodů, invalidita, narození dalšího dítěte), může soud podle **§ 923 OZ** pravomocný rozsudek změnit. U nezletilých dětí lze výživné přiznat či zvýšit **až 3 roky zpětně** ode dne zahájení řízení (§ 921 odst. 1 OZ). Zásadní procesní varování: **Spotřebované výživné za minulost se u nezletilých dětí nevrací** (§ 923 odst. 2 OZ). Pokud tedy rodič ztratí příjem, musí podat návrh na snížení výživného neprodleně, jinak mu bude vznikat nevratný exekuční dluh.',
        order: 6,
        type: 'warning'
      }
    ],
    checklist: [
      { id: 'vyz-c1', label: 'Komplexní doložení čistých příjmů za posledních 12 měsíců (výplatní pásky, daňová přiznání včetně všech příloh, přehledy OSVČ)' },
      { id: 'vyz-c2', label: 'Detailní rozpis a doklady o odůvodněných potřebách dítěte (školné, kroužky, zdravotní péče, strava, bydlení)' },
      { id: 'vyz-c3', label: 'Přesná evidence reálného rozsahu osobní péče a počtu dní kontaktu za sledované období' },
      { id: 'vyz-c4', label: 'Zmapování a doložení dalších zákonných vyživovacích povinností k jiným nezletilým dětem či manželovi/manželce' },
      { id: 'vyz-c5', label: 'Příprava argumentace k potencialitě příjmů obou rodičů a návrh na vyžádání bankovních účtů při důvodných pochybnostech' },
      { id: 'vyz-c6', label: 'Návrh přiměřeného petitu s využitím doporučující tabulky MS ČR a kontrolní nezabavitelné částky' }
    ],
    faqs: [
      {
        question: 'Může soud stanovit výživné z fiktivního příjmu, pokud rodič tají skutečné výdělky nebo vykazuje nulový zisk v daňovém přiznání?',
        answer: 'Ano. Pokud povinný rodič nepředloží soudu úplné a věrohodné podklady o svých příjmech a majetkových poměrech (daňová přiznání, výpisy z účtů, účetnictví), uplatní soud zákonnou domněnku podle § 916 občanského zákoníku. V takovém případě se má za to, že jeho měsíční příjem činí 25násobek částky životního minima jednotlivce. Zároveň soudy podle § 913 odst. 2 OZ zkoumají celkovou životní úroveň a potencialitu výdělku, nikoli pouze formální položky optimalizovaného daňového přiznání.'
      },
      {
        question: 'Musí rodič platit nad rámec stanoveného výživného drahé mimořádné kroužky či soukromou školu, pokud s tím nesouhlasil?',
        answer: 'Ne, nikoliv automaticky. Běžné měsíční výživné stanovené rozsudkem pokrývá veškeré standardní potřeby dítěte. Výběr nákladné soukromé školy či mimořádně drahých kroužků představuje podstatnou záležitost dítěte ve smyslu § 877 občanského zákoníku, o které musí rozhodnout oba rodiče ve shodě. Pokud jeden rodič přihlásí dítě na nákladnou aktivitu bez souhlasu druhého rodiče, nemůže po něm jednostranně požadovat doplácení nad rámec rozsudku, ledaže by o tom rozhodl soud nebo se rodiče dohodli.'
      },
      {
        question: 'Platí se výživné i při rovnoměrné střídavé péči v poměru 50/50?',
        answer: 'Ano, je to v praxi běžné. Podle ustálené judikatury Ústavního soudu (např. sp. zn. I. ÚS 3065/21 a IV. ÚS 650/15) má dítě právo na shodnou životní úroveň s oběma rodiči (§ 915 odst. 1 OZ). Pokud jeden z rodičů vydělává výrazně více než druhý (např. 80 000 Kč vs. 25 000 Kč), soud stanoví lépe vydělávajícímu rodiči povinnost platit výživné i při rovnoměrném střídání, aby dítě nezažívalo v jedné domácnosti materiální nouzi a ve druhé přepych.'
      },
      {
        question: 'Co se stane, když přijdu o práci nebo onemocním – zaniká vyživovací povinnost automaticky?',
        answer: 'Ne. Vyživovací povinnost stanovená pravomocným rozsudkem trvá v nezměněné výši bez ohledu na ztrátu zaměstnání či nemoc, dokud o její změně nerozhodne soud. Pokud rodič přestane platit nebo začne svévolně posílat méně, vzniká dluh na výživném, který může být vymáhán exekucí s rizikem exekučního pozastavení řidičského průkazu (§ 71a exekučního řádu). Při podstatné změně příjmů je proto nutné okamžitě podat k soudu návrh na snížení výživného podle § 923 občanského zákoníku.'
      }
    ],
    seoTitle: 'Výživné na dítě & Metodika dokazování příjmů • Zákon a Tabulky MS ČR',
    seoDescription: 'Odborný metodický průvodce výpočtem výživného, doporučujícími tabulkami MS ČR, dokazováním u OSVČ a specifiky střídavé péče pro rodiče a opatrovnické soudy.',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  }
];
