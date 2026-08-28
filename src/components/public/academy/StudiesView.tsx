import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  PlayCircle,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Search,
  BookMarked,
  ShieldCheck,
  Brain,
  MessageSquare,
  Coins,
  X,
  FileText
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface StudiesViewProps {
  onNavigate?: (path: string) => void;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  summary: string;
  keyTakeaways: string[];
}

interface Course {
  id: string;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
  totalLessons: number;
  totalDuration: string;
  level: 'Začátečník' | 'Mírně pokročilý' | 'Pokročilý';
  lessons: Lesson[];
}

const COURSES_DATA: Course[] = [
  {
    id: 'zaklady-opatrovnictvi',
    title: '1. Základy opatrovnického práva v ČR',
    category: 'Právní rámec',
    badge: 'Klíčový kurz',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
    icon: ShieldCheck,
    description: 'Komplexní průvodce rodinným právem, úlohou OSPOD, soudní soustavou a ústavně zaručenými právy rodičů a dětí.',
    totalLessons: 6,
    totalDuration: '45 min',
    level: 'Začátečník',
    lessons: [
      {
        id: 'lekce-1-1',
        title: 'Právní postavení rodiče a Listina základních práv a svobod',
        duration: '7 min',
        summary: 'Článek 32 odst. 4 Listiny garantuje právo rodičů na péči o děti. Občanský zákoník (§ 855 o.z.) stanoví, že rodičovská odpovědnost náleží oběma rodičům stejně.',
        keyTakeaways: [
          'Péče a výchova dětí je právem rodičů; děti mají právo na péči obou rodičů.',
          'Žádný z rodičů nemůže jednostranně omezit práva druhého rodiče bez rozhodnutí soudu.'
        ]
      },
      {
        id: 'lekce-1-2',
        title: 'Skutečná role OSPOD: Mýty vs. Realita',
        duration: '8 min',
        summary: 'OSPOD je opatrovnickým soudem jmenován jako kolizní opatrovník dítěte. Jeho úkolem je zastupovat práva dítěte, nikoliv matky ani otce.',
        keyTakeaways: [
          'Před sociální pracovnicí vystupujte věcně, klidně a bez osobních útoků na druhého rodiče.',
          'Máte právo na pořízení kopií ze spisu Om na OSPOD podle § 38 správního řádu.'
        ]
      },
      {
        id: 'lekce-1-3',
        title: 'Návrh na úpravu péče: Formální náležitosti a petit',
        duration: '9 min',
        summary: 'Jak správně sestavit návrh k okresnímu soudu na střídavou péči. Správná formulace petitu týkající se dnů, hodin a místa předání dítěte.',
        keyTakeaways: [
          'Petit musí být naprosto přesný a vykonatelný.',
          'Využijte citací závazné judikatury Ústavního soudu (např. Nález I. ÚS 2482/13).'
        ]
      },
      {
        id: 'lekce-1-4',
        title: 'Předběžná opatření (§ 452 z.ř.s.): Kdy a jak podat',
        duration: '8 min',
        summary: 'Pokud vám druhý rodič svévolně odpírá kontakt s dítětem, předběžné opatření je krizovým nástrojem pro rychlé obnovení vazeb.',
        keyTakeaways: [
          'Soud rozhoduje bezdůvodně rychle (do 24 hodin podle § 452 z.ř.s.).',
          'Je nutné doložit bezprostřední ohrožení nebo zamezení styku.'
        ]
      },
      {
        id: 'lekce-1-5',
        title: 'Právo na informace od škol a zdravotnických zařízení (§ 885 o.z.)',
        duration: '6 min',
        summary: 'Oba rodiče mají ze zákona nárok na informace o vzdělávání a zdravotním stavu dítěte ze strany mateřských i základních škol a lékařů.',
        keyTakeaways: [
          'Škola ani lékař nemohou odepřít informace na základě přání druhého rodiče.',
          'Škola má povinnost zřídit přístup do Bakalářů / EduPage oběma rodičům.'
        ]
      },
      {
        id: 'lekce-1-6',
        title: 'Jak postupovat při maření styku a uplatňování pokut (§ 500 z.ř.s.)',
        duration: '7 min',
        summary: 'Metodika dokumentování nepředání dítěte a podávání návrhů na výkon rozhodnutí uložením pokuty až do výše 50 000 Kč.',
        keyTakeaways: [
          'Každé nepředání dítěte pečlivě evidujte v Deníku péče.',
          'Opakované maření styku je závažným důvodem pro změnu péče u soudu.'
        ]
      }
    ]
  },
  {
    id: 'vyvojova-psychologie',
    title: '2. Vývojová psychologie & Citová vazba dítěte',
    category: 'Psychologie & Dítě',
    badge: 'Doporučeno',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    icon: Brain,
    description: 'Vědecké poznatky o teorii attachmentu, přespávání kojenců u otců a předcházení syndromu zavrženého rodiče (PAS).',
    totalLessons: 5,
    totalDuration: '40 min',
    level: 'Mírně pokročilý',
    lessons: [
      {
        id: 'lekce-2-1',
        title: 'Teorie citové vazby (Attachment) a vícečetná vazba',
        duration: '8 min',
        summary: 'Děti mají přirozenou schopnost vytvořit si primární citovou vazbu k oběma rodičům zároveň. Izolace jednoho rodiče poškozuje dětský mozkový vývoj.',
        keyTakeaways: [
          'Péče obou rodičů v raném věku posiluje psychickou odolnost dítěte.',
          'Vědecké studie vyvracejí mýtus o tom, že matka je jediným primárním pečovatelem.'
        ]
      },
      {
        id: 'lekce-2-2',
        title: 'Přespávání kojenců a batolat u otce: Co říká věda',
        duration: '9 min',
        summary: 'Rozbor mezinárodních studií (Warshak, Fabricius) potvrzujících, že noční péče obou rodičů od útlého věku upevňuje jistou vazbu.',
        keyTakeaways: [
          'Paušální zakazování přespávání u otců do 3 let věku nemá vědecké opodstatnění.',
          'Ústavní soud v nálezu II. ÚS 1835/12 výslovně podpořil zapojení otců v raném věku.'
        ]
      },
      {
        id: 'lekce-2-3',
        title: 'Syndrom zavrženého rodiče (PAS) a parentální manipulace',
        duration: '8 min',
        summary: 'Jak rozpoznat symptomy psychické manipulace dítěte proti druhému rodiči a jak účinně reagovat bez vyvolávání tlaku na dítě.',
        keyTakeaways: [
          'Manipulované dítě přejímá černobílé vidění a cizí slova jednoho z rodičů.',
          'Klíčem k nápravě je zachování láskyplného, klidného a konzistentního kontaktu.'
        ]
      },
      {
        id: 'lekce-2-4',
        title: 'Příprava dítěte na střídavou péči a přechody mezi domácnostmi',
        duration: '7 min',
        summary: 'Praktické techniky, jak usnadnit předávání dítěte, zajistit stejné rituály a eliminovat napětí při střídání domovů.',
        keyTakeaways: [
          'Dítě nesmí sloužit jako posel zpráv mezi rodiči.',
          'Vytvořte dítěti pocit bezpečí a vlastního prostoru v obou domovech.'
        ]
      },
      {
        id: 'lekce-2-5',
        title: 'Spolupráce se soudními znalci v oboru dětské psychologie',
        duration: '8 min',
        summary: 'Jak probíhá psychologické vyšetření u znalce, na co si dát pozor při pozorování interakce a jak se autenticky prezentovat.',
        keyTakeaways: [
          'Při testech buďte přirození a autentičtí; nepokoušejte se stylizovat.',
          'Znalec hodnotí vaši schopnost podporovat vztah dítěte k druhému rodiči.'
        ]
      }
    ]
  },
  {
    id: 'biff-komunikace',
    title: '3. BIFF Komunikace v praxi (Deeskalace konfliktu)',
    category: 'Komunikace',
    badge: 'Praktický trenažér',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    icon: MessageSquare,
    description: 'Metodika psaní stručných, informativních, přátelských a pevných zpráv (Brief, Informative, Friendly, Firm) druhému rodiči.',
    totalLessons: 4,
    totalDuration: '30 min',
    level: 'Začátečník',
    lessons: [
      {
        id: 'lekce-3-1',
        title: 'Princip BIFF: Brief, Informative, Friendly, Firm',
        duration: '7 min',
        summary: 'Základní pravidla písomné komunikace s konfliktním rodičem. Eliminace obvinění, vulgarismů a nekončících diskusí.',
        keyTakeaways: [
          'Brief (Stručná): Max 2–4 věty.',
          'Informative (Informativní): Pouze věcná fakta bez emocí.',
          'Friendly (Přátelská): Slušný a neutrální tón.',
          'Firm (Pevná): Jasné vymezení hranic bez prostoru pro manipulaci.'
        ]
      },
      {
        id: 'lekce-3-2',
        title: 'Pravidlo 24 hodin a test soudního oka',
        duration: '7 min',
        summary: 'Proč nikdy neodpovídat na provokativní SMS v afektu. Každá vaše zpráva může být předložena soudci jako důkaz.',
        keyTakeaways: [
          'Napište si odpověď do neodeslaných konceptů a počkejte do druhého dne.',
          'Přečtěte si zprávu očima soudce: Působíte jako zralý a vyrovnaný rodič?'
        ]
      },
      {
        id: 'lekce-3-3',
        title: 'Rozbor reálných e-mailů: Špatná vs. BIFF varianta',
        duration: '8 min',
        summary: 'Praktická ukázka transformace dlouhého, výčitkového e-mailu na profesionální a věcnou BIFF zprávu.',
        keyTakeaways: [
          'Ignorujte osobní urážky v textu protistrany.',
          'Odpovídejte pouze na logistické dotazy týkající se dítěte.'
        ]
      },
      {
        id: 'lekce-3-4',
        title: 'Komunikační aplikace a písemný Deník péče',
        duration: '8 min',
        summary: 'Využití specializovaných rodičovských aplikací a vedení chronologického deníku pro potřeby opatrovnického soudu.',
        keyTakeaways: [
          'Komunikace přes e-mail nebo aplikaci vytváří nezpochybnitelnou důkazní stopu.',
          'Zaznamenávejte časy předání, omluvy ze školy a výdaje za dítě.'
        ]
      }
    ]
  },
  {
    id: 'finance-vyzivne',
    title: '4. Finance, Výživné & Správa nákladů',
    category: 'Finance',
    badge: 'Nové tabulky MS ČR',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    icon: Coins,
    description: 'Oficiální metodické tabulky Ministerstva spravedlnosti ČR, zápočty výživného při střídavé péči a výdaje na kroužky.',
    totalLessons: 4,
    totalDuration: '35 min',
    level: 'Pokročilý',
    lessons: [
      {
        id: 'lekce-4-1',
        title: 'Nová doporučující tabulka výživného MS ČR',
        duration: '9 min',
        summary: 'Jak soudy určují výživné podle věkových kategorií dítěte (0–5 let, 6–9 let, 10–15 let, 16+ let) a podílu na příjmu rodiče.',
        keyTakeaways: [
          'Procentuální rozmezí výživného se pohybuje od 8 % do 20 % čistého příjmu.',
          'Zohledňuje se počet vyživovacích povinností rodiče.'
        ]
      },
      {
        id: 'lekce-4-2',
        title: 'Určování výživného při střídavé péči (Nález II. ÚS 1642/22)',
        duration: '9 min',
        summary: 'Při srovnatelném rozsahu péče a podobných příjmech obou rodičů je namístě určení nulového nebo pouze dorovnávacího výživného.',
        keyTakeaways: [
          'Střídavá péče automaticky neznamená vysoké výživné pro jednoho z rodičů.',
          'Výživné nesmí sloužit jako majetkový transfer mezi rodiči.'
        ]
      },
      {
        id: 'lekce-4-3',
        title: 'Mimořádné náklady (Kroužky, rovnatka, tábory)',
        duration: '8 min',
        summary: 'Jak správně definovat mimořádné výdaje nad rámec běžného výživného a kdy je nutný předchozí souhlas obou rodičů.',
        keyTakeaways: [
          'Běžné kroužky a školní pomůcky jsou zpravidla kryty řádným výživným.',
          'Drahé mimořádné výdaje vyžadují dohodu obou rodičů předem.'
        ]
      },
      {
        id: 'lekce-4-4',
        title: 'Dokazování čistých příjmů před opatrovnickým soudem',
        duration: '9 min',
        summary: 'Jak doložit své reálné čisté příjmy (OSVČ vs. zaměstnanec) a jak čelit nadhodnoceným požadavkům protistrany.',
        keyTakeaways: [
          'Předložte daňová přiznání, výpisy z účtů a přehled pravidelných životních nákladů.',
          'Soud zkoumá i potenciál příjmů podle kvalifikace a trhu práce.'
        ]
      }
    ]
  }
];

export const StudiesView: React.FC<StudiesViewProps> = ({ onNavigate }) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLessonIndex, setActiveLessonIndex] = useState<number>(0);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('completed_academy_lessons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('completed_academy_lessons', JSON.stringify(completedLessons));
    } catch (e) {
      console.error(e);
    }
  }, [completedLessons]);

  const toggleLessonCompleted = (lessonId: string) => {
    setCompletedLessons((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const getCourseProgress = (course: Course) => {
    const completedCount = course.lessons.filter((l) => completedLessons.includes(l.id)).length;
    return Math.round((completedCount / course.totalLessons) * 100);
  };

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCourses = COURSES_DATA.filter((course) => {
    const matchesCat = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.lessons.some((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(COURSES_DATA.map((c) => c.category)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Akademie E-learningových Kurzů • Táta má právo"
        description="Strukturované vzdělávací kurzy pro otce a rodiče v opatrovnickém řízení: základy rodinného práva, vývojová psychologie dětí, BIFF komunikace a finance."
        canonicalPath="/studia"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" /> Akademie Opatrovnictví
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              E-Learningové Kurzy pro Rodiče v Řízení
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              4 specializované moduly provádějící rodinným právem, dětskou psychologií, deeskalací konfliktů (BIFF) a výpočtem výživného podle nového metodického pokynu MS ČR.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-xs text-white shrink-0">
            <Award className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <span className="text-slate-300 block text-[10px]">Dokončené lekce</span>
              <strong className="text-sm text-white font-extrabold">{completedLessons.length} z 19 lekcí</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Subnavigation Hub for Academy */}
      {onNavigate && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            onClick={() => onNavigate('/studia')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>E-learning Kurzy</span>
          </button>
          <button
            onClick={() => onNavigate('/kvizy')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kvízy & Trenažéry</span>
          </button>
          <button
            onClick={() => onNavigate('/videoteka')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <PlayCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Videotéka</span>
          </button>
          <button
            onClick={() => onNavigate('/studie')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Vědecké studie</span>
          </button>
          <button
            onClick={() => onNavigate('/wiki')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
            <span>Právní Wiki</span>
          </button>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? 'Všechny moduly' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat v lekcích kurzu..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => {
          const Icon = course.icon;
          const progress = getCourseProgress(course);

          return (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${course.badgeColor}`}>
                    {course.badge}
                  </span>
                  <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {course.totalDuration}
                  </span>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {course.title}
                    </h3>
                    <span className="text-xs font-bold text-slate-400 block mt-0.5">
                      {course.category} • Úroveň: {course.level}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {course.description}
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-500">Pokrok v kurzu</span>
                    <span className="text-indigo-600">{progress}% dokončeno</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {course.totalLessons} strukturovaných lekcí
                </span>
                <button
                  onClick={() => {
                    setSelectedCourse(course);
                    setActiveLessonIndex(0);
                  }}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{progress > 0 ? 'Pokračovat v kurzu' : 'Spustit kurz'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Reader Drawer/Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  {selectedCourse.title}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Lekce {activeLessonIndex + 1} z {selectedCourse.totalLessons}: {selectedCourse.lessons[activeLessonIndex].title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
              {/* Lessons Sidebar */}
              <div className="p-4 bg-slate-50 border-r border-slate-200 space-y-2 overflow-y-auto max-h-[300px] md:max-h-none">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block px-2 mb-2">
                  Seznam lekcí kurzu
                </span>
                {selectedCourse.lessons.map((lesson, lIdx) => {
                  const isDone = completedLessons.includes(lesson.id);
                  const isCurrent = lIdx === activeLessonIndex;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLessonIndex(lIdx)}
                      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 text-xs font-bold ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 line-clamp-1">
                        <span>{lIdx + 1}.</span>
                        <span className="line-clamp-1">{lesson.title}</span>
                      </div>
                      {isDone && <CheckCircle2 className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />}
                    </button>
                  );
                })}
              </div>

              {/* Lesson Content Area */}
              <div className="p-6 md:col-span-2 space-y-6 overflow-y-auto">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Délka studia: {selectedCourse.lessons[activeLessonIndex].duration}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedCourse.lessons[activeLessonIndex].title}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  {selectedCourse.lessons[activeLessonIndex].summary}
                </div>

                <div className="space-y-2">
                  <strong className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                    💡 Hlavní poznatky lekce:
                  </strong>
                  <ul className="space-y-2">
                    {selectedCourse.lessons[activeLessonIndex].keyTakeaways.map((takeaway, tIdx) => (
                      <li key={tIdx} className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lesson Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() => toggleLessonCompleted(selectedCourse.lessons[activeLessonIndex].id)}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center ${
                      completedLessons.includes(selectedCourse.lessons[activeLessonIndex].id)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>
                      {completedLessons.includes(selectedCourse.lessons[activeLessonIndex].id)
                        ? 'Označeno jako dokončené'
                        : 'Označit lekci jako dokončenou'}
                    </span>
                  </button>

                  {activeLessonIndex < selectedCourse.lessons.length - 1 && (
                    <button
                      onClick={() => setActiveLessonIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
                    >
                      <span>Další lekce</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
