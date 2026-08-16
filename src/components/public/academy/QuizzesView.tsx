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
  ChevronRight
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
}

interface Quiz {
  id: string;
  title: string;
  category: string;
  icon: React.ElementType;
  description: string;
  badge: string;
  questions: Question[];
  recommendedStudyPath: string;
}

const QUIZZES_DATA: Quiz[] = [
  {
    id: 'kviz-ospod',
    title: '1. Kvíz práv a povinností u OSPODu',
    category: 'Právní povědomí',
    badge: '10 Otázek',
    icon: ShieldCheck,
    description: 'Otestujte si znalosti svých práv v roli rodiče při jednání s kolizním opatrovníkem (OSPOD) a nahlížení do spisu Om.',
    recommendedStudyPath: '/studia',
    questions: [
      {
        id: 'q1',
        questionText: 'Máte právo nahlížet do spisu Om vedeného na OSPOD a pořizovat si z něj kopie?',
        options: [
          'Ne, spis OSPOD je přísně tajný a slouží pouze pro potřeby soudu.',
          'Ano, podle § 38 správního řádu jako účastník řízení máte právo do spisu nahlížet a dělat si z něj kopie.',
          'Pouze pokud k tomu dá výslovný písemný souhlas druhý rodič.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Podle § 38 správního řádu má každý účastník správního řízení (rodič) právo nahlížet do spisu, v pořizovat si fotokopie a výpisy.'
      },
      {
        id: 'q2',
        questionText: 'Může sociální pracovnice OSPODu zakázat otci účastnit se sociálního šetření v jeho bytě?',
        options: [
          'Ano, sociální pracovnice může rozhodnout podle vlastního uvážení.',
          'Ne, sociální šetření v místě bydliště rodiče vyžaduje jeho součinnost a má právo být přítomen.',
          'Pouze v případě, že je přítomen policista.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Sociální šetření v bytě rodiče je prováděno za jeho přítomnosti a součinnosti. Rodič má právo ukázat své zázemí.'
      },
      {
        id: 'q3',
        questionText: 'Jaká je hlavní role OSPODu před opatrovnickým soudem?',
        options: [
          'Hájit zájmy a požadavky matky dítěte.',
          'Zastupovat nezletilé dítě jako jeho kolizní opatrovník nezávisle na obou rodičích.',
          'Vynášet rozsudky namísto soudce.'
        ],
        correctAnswerIndex: 1,
        explanation: 'OSPOD je jmenován kolizním opatrovníkem, aby zastupoval výhradně nejlepší zájem dítěte.'
      }
    ]
  },
  {
    id: 'kviz-biff',
    title: '2. BIFF Trenažér deeskalace komunikace',
    category: 'Komunikace',
    badge: 'Interaktivní Scénáře',
    icon: MessageSquare,
    description: 'Procvičte si správný výběr reakcí na provokativní SMS a e-maily od protistrany podle metody BIFF.',
    recommendedStudyPath: '/studia',
    questions: [
      {
        id: 'q-biff-1',
        questionText: 'Druhý rodič vám napíše: "Jsi neschopný otec, dítěti jsi zase zapomněl dát čepici a nevěnuješ se mu! Nic o výchově nevíš!" Jak má vypadat BIFF odpověď?',
        options: [
          '"Ty mi nemáš co vyčítat, sama jsi minule zapomněla přibalit boty a staráš se hrozně!"',
          '"Ahoj, dítě čepici mělo. Na víkend je vše připraveno. Děkuji a přeji hezký den."',
          'Ignorovat SMS zcela a poslat ji s urážkami na OSPOD.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Správná BIFF odpověď je stručná (Brief), věcná (Informative), zdvořilá (Friendly) a jasná (Firm) bez zapojování se do osobních útoků.'
      },
      {
        id: 'q-biff-2',
        questionText: 'Protistrana napíše: "Pokud mi okamžitě nepošleš 2000 Kč na kroužek, dítě ti v patek nepředám!" Jak reagovat?',
        options: [
          '"Ahoj. Úhrada kroužků probíhá dle dohody z výživného. Předání dítěte v patek v 16:00 platí dle rozsudku. S pozdravem."',
          '"Jsi vyděračka! Zase porušuješ rozsudek, hned na tebe podávám exekuci!"',
          'Okamžitě peníze poslat na účet bez dalšího komentáře.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Odpověď odkazuje věcně na rozsudek a dohodu bez ustupování vydírání nebo emociálního výbuchu.'
      }
    ]
  },
  {
    id: 'kviz-stridavka',
    title: '3. Test připravenosti na střídavou péči',
    category: 'Péče & Zázemí',
    badge: 'Diagnostický Test',
    icon: Home,
    description: 'Hodnocení kritérií, které opatrovnické soudy posuzují při rozhodování o rovnocenné střídavé péči obou rodičů.',
    recommendedStudyPath: '/judikatura',
    questions: [
      {
        id: 'q-s-1',
        questionText: 'Je podle judikatury Ústavního soudu vzdálenost domovů rodičů automatickou překážkou pro střídavou péči?',
        options: [
          'Ano, pokud rodiče bydlí ve vzdálenosti větší než 10 km, střídavá péče je vyloučena.',
          'Ne, vyšší vzdálenost vyžaduje úpravu logistiky (např. střídání po týdnech), ale sama o sobě střídavou péči nevylučuje.',
          'Záleží pouze na přání matky.'
        ],
        correctAnswerIndex: 1,
        explanation: 'Ústavní soud opakovaně judikoval, že vzdálenost bydlišť není sama o sobě důvodem pro vyloučení střídavé péče.'
      },
      {
        id: 'q-s-2',
        questionText: 'Co je podle § 888 o.z. povinností rodiče, který má dítě zrovna u sebe?',
        options: [
          'Umožnit a usnadnit styk dítěte s druhým rodičem a nepomlouvat ho.',
          'Informovat druhého rodiče o každé minutě dne.',
          'Kontrolovat e-maily a telefony dítěte.'
        ],
        correctAnswerIndex: 0,
        explanation: 'Rodiče mají zákonnou povinnost styk s druhým rodičem podporovat a spolupracovat v zájmu dítěte.'
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Opatrovnické Kvízy & BIFF Trenažér • Táta má právo"
        description="Otestujte si své právní znalosti u OSPODu, procvičte si deeskalaci komunikace s protistranou a vyhodnoťte svou připravenost na střídavou péči."
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
              Prověřte své praktické znalosti právních předpisů, správných reakcí na provokativní zprávy a připravenosti na jednání u opatrovnického soudu.
            </p>
          </div>
        </div>
      </div>

      {/* Quiz Selection Cards */}
      {!activeQuiz && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {QUIZZES_DATA.map((quiz) => {
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
                    <span className="text-xs font-bold text-slate-400">{quiz.category}</span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {quiz.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {quiz.description}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4">
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Spustit test</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Quiz Runner */}
      {activeQuiz && !showResult && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                {activeQuiz.title}
              </span>
              <span className="text-xs font-bold text-slate-500">
                Otázka {currentQuestionIndex + 1} z {activeQuiz.questions.length}
              </span>
            </div>

            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              Ukončit test
            </button>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
              {activeQuiz.questions[currentQuestionIndex].questionText}
            </h2>

            <div className="space-y-3">
              {activeQuiz.questions[currentQuestionIndex].options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                const isCorrect = oIdx === activeQuiz.questions[currentQuestionIndex].correctAnswerIndex;

                let btnStyle = 'border-slate-200 hover:bg-slate-50 text-slate-800';
                if (isSelected) {
                  btnStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20';
                }
                if (isSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'border-red-500 bg-red-50 text-red-900 font-bold';
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-2xl border transition-all text-xs sm:text-sm flex items-start gap-3 cursor-pointer ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Box after submission */}
          {isSubmitted && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold">
                <Sparkles className="w-4 h-4" />
                <span>Vysvětlení a právní základ:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {activeQuiz.questions[currentQuestionIndex].explanation}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {!isSubmitted ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={selectedOption === null}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Potvrdit odpověď
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{currentQuestionIndex < activeQuiz.questions.length - 1 ? 'Další otázka' : 'Zobrazit vyhodnocení'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Screen */}
      {showResult && activeQuiz && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Vyhodnocení Testu</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{activeQuiz.title}</p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs text-slate-500 font-bold block">Vaše celkové skóre:</span>
            <span className="text-4xl font-black text-indigo-600">{calculateScore()}%</span>
            <p className="text-xs text-slate-600 mt-2">
              {calculateScore() >= 80
                ? 'Výborný výsledek! Máte velmi dobré znalosti opatrovnické problematiky.'
                : 'Doporučujeme prostudovat návazná studia v Akademii pro upevnění právního povědomí.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => startQuiz(activeQuiz)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Opakovat test</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate(activeQuiz.recommendedStudyPath)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center shadow-xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Přejít na doporučená studia</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
