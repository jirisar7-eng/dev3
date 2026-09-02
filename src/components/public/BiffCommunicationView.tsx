import React, { useState } from 'react';
import {
  MessageSquare,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  Send,
  RefreshCw,
  Info,
  Scale
} from 'lucide-react';
import { SeoHead } from './SeoHead';

interface BiffCommunicationViewProps {
  onNavigate?: (path: string) => void;
}

interface BiffExample {
  title: string;
  context: string;
  hostileMessage: string;
  hostileAnalysis: string[];
  biffResponse: string;
  biffBreakdown: {
    brief: string;
    informative: string;
    friendly: string;
    firm: string;
  };
}

const BIFF_EXAMPLES: BiffExample[] = [
  {
    title: 'Obvinění z nedostatečné péče a výhružka zrušením styku',
    context: 'Matka posílá agresivní SMS po víkendovém pobytu dítěte u otce.',
    hostileMessage:
      'Jsi naprosto neschopný otec, včera měl kluk špinavé kalhoty a zakašlal! Pokud se nenaučíš starat o vlastní dítě, tak ti ho příští týden vůbec nedám, jsi sobec a zničíš ho!',
    hostileAnalysis: [
      'Útočné osobní nálepkování („neschopný“, „sobec“)',
      'Generalizace a zveličování běžných situací (špinavé kalhoty, zakašlání)',
      'Nezákonná výhružka zmařením soudně určené péče'
    ],
    biffResponse:
      'Dobrý den. Děkuji za zprávu. Syn byl v pořádku, oblečení jsem vypral a u lékaře jsme nebyli, neboť teplotu neměl a je zdráv. V pátek v 16:00 budu připraven k jeho převzetí dle platného rozsudku před školou. S pozdravem, Jan',
    biffBreakdown: {
      brief: '4 věty, žádné protiútoky ani ospravedlňování.',
      informative: 'Fakta o zdravotním stavu a potvrzení času i místa předání.',
      friendly: 'Slušné oslovení, poděkování a formální podpis.',
      firm: 'Jednoznačný odkaz na platný rozsudek a termín bez další diskuze.'
    }
  },
  {
    title: 'Požadavek na mimořádnou platbu bez dokladu',
    context: 'Druhý rodič požaduje okamžitý převod peněz s nátlakem a obviňováním.',
    hostileMessage:
      'Koukej mi hned poslat 5000 Kč na kroužky a nové boty, nebo všem řeknu, jaký jsi lakomec a jak na dítě kašleš! Prachy chci na účtu do zítra!',
    hostileAnalysis: [
      'Emocionální nátlak a vydírání reputační újmou',
      'Absence položkového rozpisu a daňových dokladů',
      'Nereálné ultimátum'
    ],
    biffResponse:
      'Dobrý den. Řádné výživné stanovené soudem jsem odeslal k 15. dni v měsíci. Pro posouzení příspěvku na mimořádné výdaje mi prosím zašlete fakturu či doklad o zaplacení kroužku a doklad za obuv do e-mailu. Po jejich obdržení se k nim obratem vyjádřím. Přeji hezký den, Jan',
    biffBreakdown: {
      brief: 'Stručné shrnutí bez emocí a obhajování se před nařčením z lakomství.',
      informative: 'Připomenutí zaplaceného výživného a výzva k doložení dokladů.',
      friendly: 'Neutrální oslovení a popřání hezkého dne.',
      firm: 'Jasná procesní podmínka: napřed doklady, potom posouzení.'
    }
  },
  {
    title: 'Jednostranná změna termínu prázdnin na poslední chvíli',
    context: 'Rodič oznámí týden předem, že dítě nepředá z důvodu své dovolené.',
    hostileMessage:
      'Příští týden v tvůj termín jedeme k moři, letenky už mám koupené, tak s klukem nepočítej. Pokud budeš dělat scény, jsi bezohledný!',
    hostileAnalysis: [
      'Jednostranné porušení dohodnutého nebo rozsudkem daného plánu',
      'Manipulativní obrácení viny („pokud budeš protestovat, jsi bezohledný“)'
    ],
    biffResponse:
      'Dobrý den. Termín letních prázdnin od 10. do 24. července připadá dle rozsudku na mou péči a mám na tyto dny naplánovaný program se synem. Vzhledem k tomu nemohu s jednostrannou změnou souhlasit. V pondělí v 9:00 budu syna očekávat dle harmonogramu. Děkuji za pochopení. S pozdravem, Jan',
    biffBreakdown: {
      brief: 'Přímé odmítnutí bez výčitek a bez detailního popisování svého programu.',
      informative: 'Konstatování platného harmonogramu a nesouhlasu se změnou.',
      friendly: 'Zdvořilé poděkování za pochopení.',
      firm: 'Jasné trvání na předání v určený čas.'
    }
  }
];

export const BiffCommunicationView: React.FC<BiffCommunicationViewProps> = ({ onNavigate }) => {
  const [selectedExampleIndex, setSelectedExampleIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'principles' | 'examples' | 'checklist' | 'training'>('principles');

  // Interactive self-check state
  const [interactiveDraft, setInteractiveDraft] = useState<string>('');
  const [criteriaChecked, setCriteriaChecked] = useState<{
    brief: boolean;
    informative: boolean;
    friendly: boolean;
    firm: boolean;
    noAccusations: boolean;
    noEmotions: boolean;
  }>({
    brief: false,
    informative: false,
    friendly: false,
    firm: false,
    noAccusations: false,
    noEmotions: false
  });

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentEx = BIFF_EXAMPLES[selectedExampleIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Deeskalační komunikace B.I.F.F. • Táta má právo"
        description="Metodický trénink konstruktivní a bezpečné komunikace s vysokokonfliktním rodičem dle metody BIFF (Brief, Informative, Friendly, Firm)."
        canonicalPath="/komunikace-biff"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ověřená metoda komunikace ve vysokokonfliktních vztazích</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Metoda B.I.F.F. v rodičovské praxi
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed opacity-95">
            Jak psát zprávy druhému rodiči tak, abyste chránili sebe i dítě, neeskalovali konflikt, 
            odfiltrovali emoce a neposkytovali protistraně žádnou munici pro soudní řízení či zprávy OSPOD.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('principles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'principles'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          4 Základní pilíře B.I.F.F.
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'examples'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Praktické vzory odpovědí
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Bezpečnostní checklist před odesláním
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'training'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Interaktivní trenažér
        </button>
      </div>

      {/* TAB 1: 4 PRINCIPLES */}
      {activeTab === 'principles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Co je metoda BIFF a proč funguje?
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Metodu vyvinul americký rodinný mediátor, právník a sociální pracovník <strong>Bill Eddy</strong> (High Conflict Institute). 
                Jejím účelem není změnit chování druhého rodiče ani vyhrát slovní souboj, ale ukončit komunikační ping-pong 
                a chránit integritu rodičovské komunikace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* B */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black text-base flex items-center justify-center shadow-xs">
                    B
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Brief • Stručné</h3>
                    <span className="text-[11px] text-blue-700 font-semibold">1 až 4 ucelené věty</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Čím delší zprávu napíšete, tím více záchytných bodů dáváte protistraně k dalším útokům. 
                  Vysvětlování, ospravedlňování a dlouhé odstavce jsou vnímány jako slabost nebo záminka k další hádce.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                  💡 <strong>Pravidlo:</strong> Pokud vaše odpověď přesahuje 100 slov, s vysokou pravděpodobností obsahuje zbytečné emoce.
                </div>
              </div>

              {/* I */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black text-base flex items-center justify-center shadow-xs">
                    I
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Informative • Věcné</h3>
                    <span className="text-[11px] text-blue-700 font-semibold">Pouze fakta a termíny</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zaměřte se výhradně na chybějící nebo nezbytné informace o dítěti (lékař, škola, časy předání, platby). 
                  Zcela ignorujte urážky, analýzy vaší povahy a nepravdivá obvinění.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                  💡 <strong>Pravidlo:</strong> Neopravujte historické lži. Soustřeďte se jen na budoucí praktický krok.
                </div>
              </div>

              {/* F */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black text-base flex items-center justify-center shadow-xs">
                    F
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Friendly • Zdvořilé</h3>
                    <span className="text-[11px] text-blue-700 font-semibold">Neutrální profesionalita</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Použijte neutrální, ale zdvořilé oslovení („Dobrý den“) a zakončení („S pozdravem“, „Děkuji za zprávu“). 
                  Vyhněte se sarkasmu, vykřičníkům a psaní velkými písmeny (CAPSLOCK).
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                  💡 <strong>Pravidlo:</strong> Pište tak, jako by zprávu četl opatrovnický soudce nebo pracovnice OSPOD (protože ji pravděpodobně číst budou).
                </div>
              </div>

              {/* F */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black text-base flex items-center justify-center shadow-xs">
                    F
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Firm • Jasné & Pevné</h3>
                    <span className="text-[11px] text-blue-700 font-semibold">Uzavření debaty</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zpráva musí jasně formulovat stanovisko nebo nabídnout konkrétní volbu ze dvou možností (A/B) 
                  a stanovit přiměřený termín odpovědi. Neklaďte otevřené provokativní otázky.
                </p>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                  💡 <strong>Pravidlo:</strong> Nabídněte 2 konkrétní termíny místo obecné otázky „Kdy se ti to hodí?“.
                </div>
              </div>
            </div>

            {/* AI Assistant Promo Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  AI Kontrola zpráv v reálném čase
                </h4>
                <p className="text-xs text-indigo-800">
                  Nejste si jisti, zda vaše zpráva neobsahuje skryté emoce? Nechte si ji zkontrolovat naším AI asistentem.
                </p>
              </div>
              <button
                onClick={() => handleNav('/ai-asistent')}
                className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Otevřít AI Asistenta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRACTICAL EXAMPLES */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Reálné scénáře: Útok vs. BIFF odpověď
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Vyberte typickou krizovou situaci a porovnejte rozdíl mezi reakcí v emocích a profesionální odpovědí dle zásad BIFF.
              </p>
            </div>

            {/* Example selector pills */}
            <div className="flex flex-wrap gap-2">
              {BIFF_EXAMPLES.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedExampleIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    selectedExampleIndex === idx
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Scénář {idx + 1}: {ex.title}
                </button>
              ))}
            </div>

            {/* Current Example Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-6">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Kontext situace
                </span>
                <p className="text-xs font-medium text-slate-800">{currentEx.context}</p>
              </div>

              {/* Hostile Input */}
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Útočná zpráva od druhého rodiče:</span>
                </div>
                <p className="text-xs text-rose-950 font-serif italic bg-white/70 p-3 rounded-lg border border-rose-100">
                  „{currentEx.hostileMessage}“
                </p>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-rose-900 block">Identifikované pasti:</span>
                  <ul className="text-[11px] text-rose-800 list-disc pl-4 space-y-0.5">
                    {currentEx.hostileAnalysis.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BIFF Output */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Doporučená odpověď dle B.I.F.F.:</span>
                  </div>
                  <button
                    onClick={() => handleCopy(currentEx.biffResponse)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Zkopírováno' : 'Kopírovat'}</span>
                  </button>
                </div>
                <p className="text-xs text-emerald-950 font-medium bg-white p-3.5 rounded-lg border border-emerald-200 leading-relaxed">
                  {currentEx.biffResponse}
                </p>

                {/* Breakdown of BIFF pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 text-[11px]">
                    <strong className="text-emerald-900 block">B (Stručné):</strong>
                    <span className="text-slate-600">{currentEx.biffBreakdown.brief}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 text-[11px]">
                    <strong className="text-emerald-900 block">I (Věcné):</strong>
                    <span className="text-slate-600">{currentEx.biffBreakdown.informative}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 text-[11px]">
                    <strong className="text-emerald-900 block">F (Zdvořilé):</strong>
                    <span className="text-slate-600">{currentEx.biffBreakdown.friendly}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-emerald-100 text-[11px]">
                    <strong className="text-emerald-900 block">F (Pevné):</strong>
                    <span className="text-slate-600">{currentEx.biffBreakdown.firm}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Bezpečnostní checklist před kliknutím na „Odeslat“
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Před odesláním jakékoliv zprávy v napjaté situaci si projděte těchto 7 kontrolních otázek.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: '1. Pravidlo 24 hodin (není-li to akutní ohrožení zdraví)',
                  desc: 'Neodpovídejte v první vlně vzteku nebo dotčení. Napište koncept, uložte ho a přečtěte si ho až s odstupem několika hodin.'
                },
                {
                  title: '2. Odstranil jsem obhajobu a protiútoky?',
                  desc: 'Vynechte věty typu „To není pravda“, „Ty jsi udělala to samé“, „Lžeš jako vždycky“. Soudce zajímá dítě, nikoliv vaše vzájemné výčitky.'
                },
                {
                  title: '3. Obsahuje zpráva pouze fakta o dítěti?',
                  desc: 'Uveďte pouze to, co je nezbytné pro zajištění péče, zdraví, školní docházky nebo předání.'
                },
                {
                  title: '4. Je tón zprávy zdvořilý a formální?',
                  desc: 'Začíná zpráva oslovením a končí neutrálním podpisem? Nejsou v ní vykřičníky, sarkasmus nebo velká písmena?'
                },
                {
                  title: '5. Je formulace jasná a uzavírá téma?',
                  desc: 'Pokud navrhujete řešení, dáváte jasnou volbu A/B nebo uvádíte konkrétní termín, do kdy očekáváte vyjádření?'
                },
                {
                  title: '6. Obstála by tato zpráva nahlas přečtená u soudu?',
                  desc: 'Představte si, že tuto SMS promítá soudce v jednací síni na plátno. Budete působit jako klidný a stabilní rodič?'
                },
                {
                  title: '7. Je zvolen bezpečný a archivovatelný komunikační kanál?',
                  desc: 'Doporučujeme písemnou formu (e-mail, vyhrazená rodičovská aplikace), která uchovává přesný čas odeslání a obsah bez možnosti dodatečné úpravy.'
                }
              ].map((check, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{check.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{check.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTERACTIVE TRAINING */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Tréninkový editor BIFF zprávy
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Vložte svůj pracovní koncept zprávy a zkontrolujte, zda splňuje všech 6 kritérií pro bezpečné odeslání.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Váš koncept zprávy:
                </label>
                <textarea
                  rows={5}
                  value={interactiveDraft}
                  onChange={(e) => setInteractiveDraft(e.target.value)}
                  placeholder="Napište nebo vložte text vaší zprávy zde..."
                  className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 px-1">
                  <span>Počet slov: {interactiveDraft.trim() ? interactiveDraft.trim().split(/\s+/).length : 0}</span>
                  <span className={interactiveDraft.trim().split(/\s+/).length > 80 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-medium'}>
                    {interactiveDraft.trim().split(/\s+/).length > 80 ? '⚠️ Zpráva je příliš dlouhá (doporučeno do 80 slov)' : '✅ Délka v normě'}
                  </span>
                </div>
              </div>

              {/* Self-check criteria */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">
                  Kritéria pro ověření před odesláním:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteriaChecked.brief}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, brief: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="text-slate-700"><strong>Brief:</strong> Max. 1–4 ucelené věty</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteriaChecked.informative}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, informative: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="text-slate-700"><strong>Informative:</strong> Pouze fakta o dítěti</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteriaChecked.friendly}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, friendly: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="text-slate-700"><strong>Friendly:</strong> Slušné oslovení a podpis</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteriaChecked.firm}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, firm: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="text-slate-700"><strong>Firm:</strong> Jasné uzavření bez hádek</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteriaChecked.noAccusations}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, noAccusations: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="text-slate-700">Bez protiútoků a výčitek</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteriaChecked.noEmotions}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, noEmotions: e.target.checked })}
                      className="rounded text-blue-900"
                    />
                    <span className="text-slate-700">Bez vykřičníků a CAPSLOCK</span>
                  </label>
                </div>

                {/* Score */}
                {Object.values(criteriaChecked).filter(Boolean).length === 6 ? (
                  <div className="p-3 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Výborně! Všechna kritéria BIFF jsou splněna. Zpráva je připravena k bezpečnému odeslání.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-900 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Splněno {Object.values(criteriaChecked).filter(Boolean).length} z 6 kritérií. Před odesláním zkontrolujte zbývající body.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal & Educational Notice */}
      <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Scale className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Upozornění k metodice:</strong> Metoda BIFF je vzdělávací a komunikační nástroj pro deeskalaci mezilidských konfliktů. 
          Nenahrazuje právní zastoupení advokátem ani závazná procesní podání k soudu. V případě pochybností o právních důsledcích svých kroků 
          konzultujte věc s advokátem se specializací na rodinné právo.
        </p>
      </div>
    </div>
  );
};
