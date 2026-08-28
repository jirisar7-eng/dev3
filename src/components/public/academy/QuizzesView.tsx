import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Home,
  ChevronRight,
  Scale,
  Coins,
  Gavel,
  Check,
  AlertCircle
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface QuizzesViewProps {
  onNavigate?: (path: string) => void;
}

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  legalCitation?: string;
}

interface Quiz {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  description: string;
  badge: string;
  difficulty: 'Začátečník' | 'Středně pokročilý' | 'Pokročilý';
  questions: Question[];
  recommendedStudyPath: string;
  recommendedStudyLabel: string;
}

const QUIZZES_DATA: Quiz[] = [
  {
    id: 'kviz-ospod',
    title: '1. Kvíz práv a povinností u OSPODu',
    category: 'Právní povědomí',
    badge: '5 Klíčových otázek',
    difficulty: 'Začátečník',
    icon: ShieldCheck,
    description: 'Otestujte si znalosti svých zákonných práv v roli rodiče při jednání s kolizním opatrovníkem (OSPOD), nahlížení do spisu Om a sociálním šetření.',
    recommendedStudyPath: '/ospod',
    recommendedStudyLabel: 'Průvodce jednáním s OSPOD',
    questions: [
      {
        id: 'q1',
        questionText: 'Máte právo nahlížet do spisu Om vedeného na OSPOD a pořizovat si z něj kopie či výpisy?',
        options: [
          'Ne, spis OSPOD je interním úředním dokumentem a rodič do něj nesmí nahlédnout.',
          'Ano, podle § 38 správního řádu (z. č. 500/2004 Sb.) máte jako účastník řízení právo nahlížet do spisu a pořizovat si kopie.',
          'Pouze v případě, že k tomu dá předchozí písemný souhlas druhý rodič.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Jako rodič a účastník máte podle § 38 správního řádu plné právo nahlížet do spisu Om, dělat si výpisy i fotokopie. OSPOD může odepřít nahlížení pouze do výjimečných anonymizovaných podnětů třetích osob, pokud by to ohrozilo ochranu dítěte.',
        legalCitation: '§ 38 zákona č. 500/2004 Sb., správní řád'
      },
      {
        id: 'q2',
        questionText: 'Může sociální pracovnice OSPOD provést sociální šetření ve vašem bytě bez vaší přítomnosti nebo souhlasu?',
        options: [
          'Ano, sociální pracovník má status policisty a může vstoupit kdykoliv bez ohlášení.',
          'Ne, šetření v obydlí vyžaduje vaši součinnost; jako občan máte ústavní právo na nedotknutelnost obydlí dle čl. 12 Listiny.',
          'Ano, ale pouze v doprovodu sousedů jako svědků.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Sociální šetření v místě bydliště rodiče se koná za jeho přítomnosti a součinnosti. Čl. 12 Listiny základních práv a svobod zaručuje nedotknutelnost obydlí. Rodič aktivně ukazuje zázemí pro dítě.',
        legalCitation: 'Čl. 12 Listiny základních práv a svobod & § 359/1999 Sb. o sociálně-právní ochraně dětí'
      },
      {
        id: 'q3',
        questionText: 'Jaká je zákonná role OSPODu před opatrovnickým soudem podle § 469 z.ř.s.?',
        options: [
          'Hájit zájmy a finanční požadavky matky dítěte.',
          'Zastupovat nezletilé dítě jako jeho kolizní opatrovník nezávisle na obou rodičích v jeho nejlepším zájmu.',
          'Vynášet pravomocné rozsudky o péči namísto soudce.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Soud jmenuje OSPOD kolizním opatrovníkem z důvodu možného střetu zájmů mezi rodiči a dítětem (§ 469 z.ř.s.). OSPOD má chránit výhradně zájem dítěte, nikoli preferovat jednoho z rodičů.',
        legalCitation: '§ 469 zákona č. 292/2013 Sb., o zvláštních řízeních soudních'
      },
      {
        id: 'q4',
        questionText: 'Pokud záznam OSPOD ze sociálního šetření obsahuje nepravdivá či překroucená tvrzení, jaký je správný postup?',
        options: [
          'Záznam roztrhat a odmítnout se s OSPOD dále bavit.',
          'Záznam podepsat bez výhrad, protože názor OSPOD nelze nijak zpochybnit.',
          'K záznamu připojit písemné výhrady s věcnou opravou a doložit důkazy (např. přes podatelnu do spisu Om).'
        ],
        correctAnswerIndex: 2,
        explanation: 'Máte právo připojit k protokolu své písemné vyjádření a námitky a doručit je oficiálně do spisu. Veškeré písemné výhrady se stávají pevnou součástí spisové dokumentace pro soud.',
        legalCitation: '§ 18 odst. 2 a § 38 zákona č. 500/2004 Sb., správní řád'
      },
      {
        id: 'q5',
        questionText: 'Má škola nebo dětský lékař právo odepřít otci informace o dítěti, pokud si to matka nepřeje?',
        options: [
          'Ano, přání matky je pro školu i lékaře závazné.',
          'Ne, podle § 885 občanského zákoníku mají oba rodiče rovné právo na informace od škol i zdravotnických zařízení.',
          'Pouze v případě, že otec platí výživné vyšší než 5 000 Kč měsíčně.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Podle § 885 o.z. a § 21 školského zákona má každý rodič s rodičovskou odpovědností zákonné právo na informace o vzdělávání a zdravotním stavu. Škola ani lékař nesmí informace tajit na základě přání druhého rodiče.',
        legalCitation: '§ 885 zákona č. 89/2012 Sb. (občanský zákoník) & § 21 školského zákona'
      }
    ]
  },
  {
    id: 'kviz-biff',
    title: '2. BIFF Trenažér deeskalace komunikace',
    category: 'Komunikace',
    badge: 'Interaktivní Scénáře',
    difficulty: 'Středně pokročilý',
    icon: MessageSquare,
    description: 'Procvičte si výběr správných reakcí na provokativní SMS a e-maily od protistrany podle mezinárodně uznávané metody BIFF (Brief, Informative, Friendly, Firm).',
    recommendedStudyPath: '/studia',
    recommendedStudyLabel: 'E-learning kurz BIFF komunikace',
    questions: [
      {
        id: 'q-biff-1',
        questionText: 'Druhý rodič vám pošle SMS: "Jsi neschopný otec! Zase jsi malému zapomněl dát teplou mikinu! Nic o výchově nevíš a soud ti to spočítá!" Jak má vypadat správná BIFF odpověď?',
        options: [
          '"Ty mi nemáš co vyčítat! Sama jsi minule zapomněla přibalit léky a jsi hysterická!"',
          '"Ahoj. Mikinu měl malý v batohu v postranní kapse. Víkend proběhl v pořádku a těšíme se na další setkání. Hezký den."',
          'Zprávu ignorovat a přeposlat ji s vulgárním komentářem na OSPOD a soudci.'
        ],
        correctAnswerIndex: 1,
        explanation: 'BIFF odpověď je stručná (Brief), věcná (Informative), slušná (Friendly) a pevná (Firm). Ignoruje osobní útoky ("jsi neschopný") a zodpovídá pouze faktickou podstatu (kde je mikina).',
        legalCitation: 'Metodika deeskalace konfliktů v rodinném právu (Bill Eddy, High Conflict Institute)'
      },
      {
        id: 'q-biff-2',
        questionText: 'Protistrana napíše: "Pokud mi okamžitě nepošleš 3000 Kč navíc na nový tablet, dítě ti v pátek nepředám!" Jak reagovat?',
        options: [
          '"Ahoj. Úhrada mimořádných nákladů podléhá předchozí dohodě dle rozsudku. Předání dítěte v pátek v 16:00 platí beze změn dle platného rozhodnutí soudu. S pozdravem."',
          '"Okamžitě na tebe podávám trestní oznámení za vydírání, ty zlodějko!"',
          'Peníze obratem poslat a doufat, že dítě v pátek uvidíte.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Odpověď věcně odkazuje na platný rozsudek soudu a pravidla pro mimořádné výdaje. Odmítá vydírání klidným, pevným tónem bez emocí a vytváří perfektní důkazní materiál pro případný výkon rozhodnutí.',
        legalCitation: '§ 500 z.ř.s. (výkon rozhodnutí) & § 888 o.z.'
      },
      {
        id: 'q-biff-3',
        questionText: 'Co znamená tzv. "Test soudního oka" před odesláním jakékoliv zprávy druhému rodiči?',
        options: [
          'Zda zprávu schválil oční lékař.',
          'Představit si, jak bude zpráva působit na soudce, když ji protistrana vytiskne a předloží jako důkaz v soudní síni.',
          'Použití speciálního šifrovaného písma.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Každá SMS, e-mail nebo zpráva v chatu může být předložena opatrovnickému soudci. Pokud soudce čte klidné, věcné zprávy otce plné péče o dítě, získává otec zásadní důkazní výhodu.',
        legalCitation: 'Zásady procesního dokazování před opatrovnickým soudem'
      },
      {
        id: 'q-biff-4',
        questionText: 'Protistrana vám zašle 4stránkový e-mail plný výčitek za posledních 7 let vztahu zakončený dotazem: "V kolik hodin v neděli dítě přivezeš?". Jak odpovíte?',
        options: [
          'Napsat 5stránkovou odpověď bod po bodu vyvracející všech 20 výčitek.',
          '"Ahoj. Dítě přivezu v neděli přesně v 18:00 dle platného rozsudku. Přeji pěkný víkend."',
          'Neodpovídat vůbec a dítě přivézt v pondělí.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Pravidlo BIFF velí reagovat POUZE na operativní dotaz týkající se dítěte (čas předání). Nekonečné rozebírání historických křivd v e-mailech konflikt pouze eskaluje.',
        legalCitation: 'Pravidlo eliminace redundantních sporů v rodičovské komunikaci'
      }
    ]
  },
  {
    id: 'kviz-stridavka',
    title: '3. Test připravenosti na střídavou péči & Judikatura ÚS',
    category: 'Péče & Judikatura',
    badge: 'Ústavní standardy',
    difficulty: 'Pokročilý',
    icon: Scale,
    description: 'Hodnocení kritérií a judikaturních mantinelů, podle kterých Ústavní soud ČR posuzuje návrhy rodičů na střídavou / rovnocennou péči.',
    recommendedStudyPath: '/judikatura',
    recommendedStudyLabel: 'Databáze judikatury Ústavního soudu',
    questions: [
      {
        id: 'q-s-1',
        questionText: 'Je podle ustálené judikatury Ústavního soudu ČR (např. nález I. ÚS 2482/13) střídavá péče prioritním modelem uspořádání?',
        options: [
          'Ne, výhradní péče matky je v českém právu vždy zákonnou prioritou.',
          'Ano, pokud oba rodiče projevují o dítě zájem a mají výchovné předpoklady, je střídavá péče ústavním pravidlem a výjimky musí soud pečlivě zdůvodnit.',
          'Pouze pokud s tím matka dítěte výslovně a písemně souhlasí.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Ústavní soud opakovaně judikoval (např. I. ÚS 2482/13, II. ÚS 1642/22), že svěření do péče jednoho rodiče při zájmu a způsobilosti obou rodičů je ústavní výjimkou vyžadující mimořádné odůvodnění.',
        legalCitation: 'Nález Ústavního soudu sp. zn. I. ÚS 2482/13 ze dne 26. 5. 2014'
      },
      {
        id: 'q-s-2',
        questionText: 'Může být nízký věk dítěte (např. 1,5 roku) sám o sobě důvodem pro zákaz přespávání u otce a vyloučení střídavé péče?',
        options: [
          'Ano, dítě do 3 let nesmí u otce nikdy přespat.',
          'Ne, podle nálezů ÚS (např. I. ÚS 3216/13) věk dítěte sám o sobě nevylučuje přespávání ani střídavou péči, existuje-li citová vazba.',
          'Záleží pouze na doporučení laktační poradkyně.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Ústavní soud odmítl paušální tabuizaci přespávání malých dětí u otců. Pokud otec pečuje a dítě na něj má vybudovanou vazbu, je žádoucí postupná adaptace a rozšiřování péče včetně noclehů.',
        legalCitation: 'Nález Ústavního soudu sp. zn. I. ÚS 3216/13 & II. ÚS 1642/22'
      },
      {
        id: 'q-s-3',
        questionText: 'Je nesouhlas jednoho z rodičů se střídavou péčí automatickým důvodem pro její zamítnutí soudem?',
        options: [
          'Ano, střídavá péče vyžaduje bezpodmínečný souhlas obou rodičů.',
          'Ne, svévolný nesouhlas jednoho rodiče nesmí být vetem bránícím rovnocenné péči druhého rodiče.',
          'Pouze v případě, že nesouhlas vyjádří matka.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Ústavní soud výslovně uvedl, že nesouhlas rodiče nemůže být důvodem pro vyloučení střídavé péče, pokud nesouhlas nepramení z objektivních a závažných důvodů ohrožujících dítě.',
        legalCitation: 'Nález Ústavního soudu sp. zn. I. ÚS 2482/13'
      },
      {
        id: 'q-s-4',
        questionText: 'Co je podle § 889 občanského zákoníku důsledkem opakovaného svévolného bránění dítěti ve styku s druhým rodičem?',
        options: [
          'Rodič, který brání, dostane odměnu za péči.',
          'Bezdůvodné bránění ve styku je novým důvodem pro změnu rozhodnutí o péči (předání dítěte do péče druhého rodiče).',
          'Soud věc automaticky odloží bez řešení.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Podle § 889 o.z. platí, že pokud rodič dlouhodobě maří styk dítěte s druhým rodičem, považuje se to za změnu poměrů zakládající důvod pro nové rozhodnutí soudu o změně péče.',
        legalCitation: '§ 889 zákona č. 89/2012 Sb., občanský zákoník'
      }
    ]
  },
  {
    id: 'kviz-finance',
    title: '4. Majetek, SJM a výpočet výživného',
    category: 'Finance & Majetek',
    badge: 'Nové tabulky MS ČR',
    difficulty: 'Středně pokročilý',
    icon: Coins,
    description: 'Prověřte své znalosti ohledně určování výživného podle doporučujících tabulek Ministerstva spravedlnosti, zápočtu péče a správy nákladů.',
    recommendedStudyPath: '/kalkulacka-vyzivneho',
    recommendedStudyLabel: 'Kalkulačka výživného MS ČR',
    questions: [
      {
        id: 'q-f-1',
        questionText: 'Jak se určuje výživné při symetrické střídavé péči (50:50) při srovnatelných příjmech obou rodičů?',
        options: [
          'Otec vždy platí minimálně 30 % svého platu matce bez ohledu na péči.',
          'Soud určí nulové výživné (vzájemné započtení) nebo pouze symbolický dorovnávací rozdíl.',
          'Výživné platí ten rodič, který má menší byt.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Při symetrické péči (50/50) a srovnatelných příjmech hradí každý rodič potřeby dítěte v době své péče a soud zpravidla výživné neurčuje, nebo určí pouze kompenzaci rozdílu v příjmech.',
        legalCitation: 'Metodika Ministerstva spravedlnosti ČR k určování výživného (2022/2026)'
      },
      {
        id: 'q-f-2',
        questionText: 'Zahrnuje řádné stanovené měsíční výživné i běžné náklady na školní pomůcky, obědy a standardní kroužky?',
        options: [
          'Ne, na každou tužku a oběd musí otec posílat zvláštní peníze nad rámec výživného.',
          'Ano, běžné výživné kryje veškeré standardní a předvídatelné životní potřeby dítěte.',
          'Zahrnuje pouze jídlo, oblečení se platí zvlášť.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Pravidelné výživné pokrývá veškeré běžné náklady na výživu, ošacení, běžné kroužky i školní potřeby. Mimořádné náklady (např. rovnátka, lyžařský výcvik) vyžadují předchozí dohodu obou rodičů.',
        legalCitation: '§ 913 a násl. zákona č. 89/2012 Sb., občanský zákoník'
      },
      {
        id: 'q-f-3',
        questionText: 'Může si rodič sám jednostranně snížit placené výživné, pokud ztratil zaměstnání nebo onemocněl?',
        options: [
          'Ano, stačí poslat SMS druhému rodiči.',
          'Ne, platné soudní rozhodnutí je závazné; je nutné neprodleně podat k soudu návrh na snížení výživného pro změnu poměrů.',
          'Ano, pokud je v evidenci Úřadu práce, výživné zaniká automaticky.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Výživné stanovené rozsudkem je exekučním titulem. Jednostranné snížení zakládá dluh na výživném. Při změně poměrů (ztráta práce, nemoc) je nutné ihned podat návrh na snížení k soudu.',
        legalCitation: '§ 923 zákona č. 89/2012 Sb. & Zákon č. 99/1963 Sb. (OSŘ)'
      }
    ]
  },
  {
    id: 'kviz-soud',
    title: '5. Soudní řízení, dokazování a výkon rozhodnutí',
    category: 'Soudní proces',
    badge: 'Procesní právo',
    difficulty: 'Pokročilý',
    icon: Gavel,
    description: 'Orientace v procesních nástrojích před opatrovnickým soudem: předběžná opatření (§ 452 z.ř.s.), pokuty za maření styku (§ 500 z.ř.s.) a výslech znalců.',
    recommendedStudyPath: '/soud',
    recommendedStudyLabel: 'Průvodce soudním řízením',
    questions: [
      {
        id: 'q-p-1',
        questionText: 'V jaké lhůtě musí opatrovnický soud rozhodnout o návrhu na předběžné opatření ve věci péče o dítě podle § 452 z.ř.s.?',
        options: [
          'Do 6 měsíců od podání návrhu.',
          'Bezodkladně, nejpozději do 24 hodin od podání návrhu (při ohrožení dítěte), resp. do 7 dnů v běžném režimu předběžného opatření.',
          'Soud o předběžném opatření rozhodovat nemusí.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Předběžná opatření podle § 452 z.ř.s. (rychlé umístění / ochrana) se rozhodují do 24 hodin. Standardní předběžné opatření o úpravě styku dle § 102 OSŘ / § 459 z.ř.s. se rozhoduje do 7 dnů.',
        legalCitation: '§ 452 a § 459 zákona č. 292/2013 Sb., o zvláštních řízeních soudních'
      },
      {
        id: 'q-p-2',
        questionText: 'Jakou maximální jednorázovou pokutu může soud uložit rodiči za maření styku podle § 502 z.ř.s.?',
        options: [
          'Max 500 Kč.',
          'Až do výše 50 000 Kč, a to i opakovaně.',
          'Pokuty v rodinném právu neexistují.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Při neplnění soudního rozhodnutí může soud v rámci výkonu rozhodnutí uložit povinnému rodiči pokutu až do výše 50 000 Kč, a to i opakovaně za každé jednotlivé zmaření styku.',
        legalCitation: '§ 502 zákona č. 292/2013 Sb., o zvláštních řízeních soudních'
      },
      {
        id: 'q-p-3',
        questionText: 'Máte právo klást soudnímu znalci z oboru dětské psychologie doplňující otázky a žádat jeho osobní výslech u soudu?',
        options: [
          'Ne, znalecký posudek je nezpochybnitelný posvátný dokument.',
          'Ano, máte právo podat k posudku písemné námitky, navrhnout výslech znalce u jednání a žádat revizní posudek při závažných vadách.',
          'Pouze pokud zaplatíte soudci zvláštní poplatek.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Jako účastník řízení máte plné procesní právo seznámit se s posudkem, podat k němu věcné výhrady, klást znalci při výslechu otázky a při zjištění metodických vad navrhnout revizní znalecký posudek.',
        legalCitation: '§ 127 a § 127a zákona č. 99/1963 Sb., občanský soudní řád'
      }
    ]
  }
];

export const QuizzesView: React.FC<QuizzesViewProps> = ({ onNavigate }) => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setUserAnswers([]);
    setIsSubmitted(false);
    setShowResult(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null || !activeQuiz) return;
    setIsSubmitted(true);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz || selectedOption === null) return;

    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);
    setSelectedOption(null);
    setIsSubmitted(false);

    if (currentQuestionIndex < activeQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateScore = () => {
    if (!activeQuiz) return 0;
    let correct = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return Math.round((correct / activeQuiz.questions.length) * 100);
  };

  const getCorrectCount = () => {
    if (!activeQuiz) return 0;
    let correct = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });
    return correct;
  };

  const filteredQuizzes = QUIZZES_DATA.filter((quiz) => {
    if (categoryFilter === 'all') return true;
    return quiz.category === categoryFilter;
  });

  const categories = ['all', ...Array.from(new Set(QUIZZES_DATA.map((q) => q.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Opatrovnické Kvízy & BIFF Trenažér • Táta má právo"
        description="Otestujte si své právní znalosti u OSPODu, procvičte si deeskalaci komunikace s protistranou a vyhodnoťte svou připravenost na střídavou péči a soudní jednání."
        canonicalPath="/kvizy"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Kvízy a Trenažéry
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Interaktivní Kvízy & BIFF Trenažér
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              5 specializovaných testů prověřujících práva u OSPODu, BIFF deeskalaci e-mailů, judikaturu Ústavního soudu, kalkulaci výživného i soudní proces.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                onClick={() => onNavigate('/studia')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <BookOpen className="w-4 h-4 text-indigo-300" />
                <span>Akademie kurzů</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {!activeQuiz && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'Všechny kvízy' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Quiz Selection Cards */}
      {!activeQuiz && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const Icon = quiz.icon;
            return (
              <div
                key={quiz.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:border-slate-300 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-indigo-200">
                      {quiz.badge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{quiz.difficulty}</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {quiz.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">
                    {quiz.questions.length} otázek s vysvětlením
                  </span>
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <span>Spustit kvíz</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Quiz Runner */}
      {activeQuiz && !showResult && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Zpět na výběr kvízů
            </button>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Otázka {currentQuestionIndex + 1} z {activeQuiz.questions.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`
              }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center shrink-0 text-sm">
                {currentQuestionIndex + 1}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                {activeQuiz.questions[currentQuestionIndex].questionText}
              </h2>
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {activeQuiz.questions[currentQuestionIndex].options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === activeQuiz.questions[currentQuestionIndex].correctAnswerIndex;

                let optionClasses = 'p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all text-left w-full flex items-start gap-3 cursor-pointer ';

                if (!isSubmitted) {
                  if (isSelected) {
                    optionClasses += 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-sm';
                  } else {
                    optionClasses += 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80';
                  }
                } else {
                  if (isCorrect) {
                    optionClasses += 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optionClasses += 'bg-rose-50 border-rose-400 text-rose-900 line-through opacity-80';
                  } else {
                    optionClasses += 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isSubmitted}
                    className={optionClasses}
                  >
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 leading-relaxed">{opt}</span>
                    {isSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-submit Explanation Box */}
            {isSubmitted && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-2 text-xs leading-relaxed border border-slate-800 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Sparkles className="w-4 h-4" /> Právní vysvětlení a odůvodnění:
                </div>
                <p className="text-slate-200">
                  {activeQuiz.questions[currentQuestionIndex].explanation}
                </p>
                {activeQuiz.questions[currentQuestionIndex].legalCitation && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-indigo-300 font-bold">
                    Citace zákona: {activeQuiz.questions[currentQuestionIndex].legalCitation}
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              {!isSubmitted ? (
                <button
                  onClick={handleConfirmAnswer}
                  disabled={selectedOption === null}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                >
                  Ověřit odpověď
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>
                    {currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Další otázka' : 'Zobrazit celkové výsledky'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Result Summary */}
      {activeQuiz && showResult && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner border border-indigo-100">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kvíz byl úspěšně dokončen!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Váš výsledek v modulu: <strong>{activeQuiz.title}</strong>
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-slate-400 block font-bold">Úspěšnost</span>
              <strong className="text-3xl font-black text-indigo-600">
                {calculateScore()} %
              </strong>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-bold">Správné odpovědi</span>
              <strong className="text-3xl font-black text-slate-800">
                {getCorrectCount()} / {activeQuiz.questions.length}
              </strong>
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-left flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <strong className="block text-indigo-900 font-bold">Doporučený další studijní krok:</strong>
              <p className="text-slate-600">
                Pro prohloubení témat doporučujeme projít:{' '}
                {onNavigate ? (
                  <button
                    onClick={() => onNavigate(activeQuiz.recommendedStudyPath)}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {activeQuiz.recommendedStudyLabel} &rarr;
                  </button>
                ) : (
                  <strong>{activeQuiz.recommendedStudyLabel}</strong>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Spustit znovu
            </button>
            <button
              onClick={() => setActiveQuiz(null)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              Vybrat další kvíz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
