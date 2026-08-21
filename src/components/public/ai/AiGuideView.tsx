import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Printer,
  Sparkles,
  Shield,
  Clock,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface ActionPlan {
  summary: string;
  days1to7: string[];
  days8to14: string[];
  days15to30: string[];
  legalTips: string[];
  communicationRule: string;
}

interface AiGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const AiGuideView: React.FC<AiGuideViewProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Form selections
  const [childAge, setChildAge] = useState('kojenec (0-12 měsíců)');
  const [conflictStage, setConflictStage] = useState('akutní krizové bránění ve styku');
  const [ospodStance, setOspodStance] = useState('pasivní / nakloněn matce');
  const [primaryGoal, setPrimaryGoal] = useState('rovnocenná střídavá péče');

  // Generated Plan
  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/guide-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childAge,
          conflictStage,
          ospodStance,
          primaryGoal
        })
      });

      const data = await res.json();
      if (data.success && data.days1to7) {
        setPlan({
          summary: data.summary || 'Strategický plán stabilizace péče a právní přípravy.',
          days1to7: data.days1to7,
          days8to14: data.days8to14,
          days15to30: data.days15to30,
          legalTips: data.legalTips || ['Odkaz na judikaturu ÚS (střídavá péče od nejútlejšího věku).'],
          communicationRule: data.communicationRule || 'Komunikovat výhradně písemně v BIFF tónu.'
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      // Fallback action plan generator
      setPlan({
        summary: `Personalizovaná strategie pro situaci (${conflictStage}) u dítěte věku (${childAge}) zaměřená na cíl: ${primaryGoal}.`,
        days1to7: [
          'Zavést deník evidování styku a komunikace (datum, čas, reakce).',
          'Přestat reagovat v afektu a přejít výhradně na BIFF e-mailovou komunikaci.',
          'Písemně požádat druhou stranu o navržení konkrétního harmonogramu péče.'
        ],
        days8to14: [
          'Zašlete věcný podnět na OSPOD k prověření poměrů a svolání případové konfigurace.',
          'Zabezpečte důkazy o vašem bytovém a materiálním zázemí pro dítě.',
          'Připravte si podrobný Rodičovský plán péče s ohledem na věk dítěte.'
        ],
        days15to30: [
          'Konzultujte opatrovnický návrh s právním zástupcem nebo v naší Právní poradně.',
          'Podejte návrh na předběžné opatření (§ 452 z.ř.s.) s odkazem na nález ÚS II. ÚS 1642/22.',
          'Udržujte stabilní a klidný režim při každém kontaktu s dítětem.'
        ],
        legalTips: [
          'Podle nálezu ÚS sp. zn. II. ÚS 1642/22 není věk dítěte překážkou pro střídavou péči.',
          'Vyvarujte se verbálních konfliktů před předáním – každou událost zaznamenávejte v klidu.'
        ],
        communicationRule: 'Všechny výzvy směřujte písemně s jasně danou přiměřenou lhůtou (např. 48 hodin).'
      });
    } finally {
      setLoading(false);
      setStep(5); // Show plan view
    }
  };

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="AI Průvodce Opatrovnickým Řízením • Táta má právo"
        description="Interaktivní AI průvodce pro tvorbu akčního plánu na 7–30 dní v opatrovnickém konfliktu podle věku dítěte a postoje OSPOD."
        canonicalPath="/ai-pruvodce"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2 border border-indigo-400/30">
              <Compass className="w-3.5 h-3.5 text-indigo-400" /> Akční Strategie 7–30 dní
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Průvodce Opatrovnickým Řízením
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Zadejte základní parametry vaší opatrovnické situace a AI vám okamžitě sestaví strukturovaný akční plán krok za krokem.
            </p>
          </div>

          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-center shrink-0 self-stretch sm:self-auto">
            <span className="text-[11px] text-slate-300 block uppercase font-bold">Postup v průvodci</span>
            <span className="text-lg font-black text-indigo-300">
              {step <= 4 ? `Krok ${step} ze 4` : 'Akční plán vygenerován'}
            </span>
          </div>
        </div>
      </div>

      {/* Wizard Form or Plan View */}
      {step <= 4 ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          {/* Progress Indicator */}
          <div className="grid grid-cols-4 gap-2 border-b border-slate-100 pb-6">
            {[
              { num: 1, label: 'Věk dítěte' },
              { num: 2, label: 'Fáze konfliktu' },
              { num: 3, label: 'Postoj OSPOD' },
              { num: 4, label: 'Cíl & Generování' }
            ].map(item => (
              <div
                key={item.num}
                onClick={() => setStep(item.num)}
                className={`cursor-pointer text-center space-y-1 p-2 rounded-xl transition-all ${
                  step === item.num
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold'
                    : step > item.num
                    ? 'text-emerald-700 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  {step > item.num ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center justify-center">
                      {item.num}
                    </span>
                  )}
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Step 1: Věk dítěte */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  1. Jaký je věk vašeho dítěte (nebo nejmladšího dítěte)?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Věk dítěte zásadně určuje argumentaci ohledně kojení, přespávání a tempa střídavé péče.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 'kojenec (0-12 měsíců)', label: 'Kojenec / Miminko (0–12 měsíců)', desc: 'Specifické nároky na přespávání a postupné zvyšování péče.' },
                  { id: 'batole (1-3 roky)', label: 'Batole (1–3 roky)', desc: 'Rychle se rozvíjející citová vazba na oba rodiče.' },
                  { id: 'předškolák (3-6 let)', label: 'Předškolák (3–6 let)', desc: 'Ideální věk pro plnohodnotný střídavý režim týden/týden.' },
                  { id: 'školák (6-12 let)', label: 'Mladší školák (6–12 let)', desc: 'Fixace na školu, vrstevníky a kroužky.' },
                  { id: 'dospívající (12+ let)', label: 'Dospívající (12+ let)', desc: 'Vyšší váha přání samotného dítěte před soudem.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setChildAge(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      childAge === opt.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <strong className="block font-bold text-slate-900 mb-1">{opt.label}</strong>
                    <span className="text-slate-500 leading-relaxed block">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-950 transition-all flex items-center gap-2"
                >
                  <span>Pokračovat k fázi konfliktu</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Fáze konfliktu */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  2. V jaké fázi se nachází opatrovnický konflikt?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Správné načasování kroku určuje, zda zvolit rychlé předběžné opatření nebo postupný návrh.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 'před rozchodem / rozvodem', label: 'Před rozchodem / v počátku separace', desc: 'Bydlíme společně nebo těsně po odstěhování jednoho z rodičů.' },
                  { id: 'akutní krizové bránění ve styku', label: 'Akutní bránění ve styku (prvních 72h až týdny)', desc: 'Matka nečinně brání kontaktu a odmítá předávat dítě.' },
                  { id: 'probíhající soudní řízení', label: 'Probíhající soudní řízení (čekání na rozsudek)', desc: 'Návrh je již podán na soudě, čeká se na OSPOD či znalce.' },
                  { id: 'výkon rozhodnutí / exekuce styku', label: 'Pravomocný rozsudek se nedodržuje', desc: 'Existuje rozsudek, ale matka ho ignoruje.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setConflictStage(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      conflictStage === opt.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <strong className="block font-bold text-slate-900 mb-1">{opt.label}</strong>
                    <span className="text-slate-500 leading-relaxed block">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all"
                >
                  Zpět
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-950 transition-all flex items-center gap-2"
                >
                  <span>Pokračovat k postoji OSPOD</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Postoj OSPOD */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  3. Jaký je aktuální postoj OSPOD ve vaší lokalitě?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Chování sociální pracovnice ovlivňuje, jak přistoupit k písemným podnětům a případovým konferencím.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 'pasivní / nakloněn matce', label: 'Pasivní nebo zjevně nakloněn matce', desc: 'OSPOD pasivně přihlíží bránění nebo doporučuje otci ustoupit.' },
                  { id: 'neutrální / čeká na soud', label: 'Neutrální / Vyčkávající na dokazování', desc: 'Pracovnice je věcná, ale nechce sama rozhodovat.' },
                  { id: 'falešná obvinění z násilí', label: 'Čelím falešnému obvinění z dom. násilí / Trestní oznámení', desc: 'Krizová situace s vysokým rizikem izolačních opatření.' },
                  { id: 'aktivní / podpora střídavé péče', label: 'Aktivní a podporující střídavou péči', desc: 'OSPOD doporučuje rovnoměrný kontakt.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setOspodStance(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      ospodStance === opt.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <strong className="block font-bold text-slate-900 mb-1">{opt.label}</strong>
                    <span className="text-slate-500 leading-relaxed block">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all"
                >
                  Zpět
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-indigo-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-950 transition-all flex items-center gap-2"
                >
                  <span>Pokračovat k cíli</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Cíl & Generování */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  4. Jaký je váš primární cíl v následujících měsících?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  AI přizpůsobí akční plán vašemu cíli tak, aby každý krok vedl k právní jistotě.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 'rovnocenná střídavá péče', label: 'Rovnocenná střídavá péče (50/50)', desc: 'Oba rodiče se podílí rovnou měrou na výchově a rozhodování.' },
                  { id: 'obnovení styku / přespávání', label: 'Obnovení pravidelného styku & přespávání', desc: 'Stabilizace rozšiřujícího se kontaktu před soudem.' },
                  { id: 'ochrana před manipulací a odcizením', label: 'Ochrana dítěte před syndromem zavrženého rodiče', desc: 'Zamezení manipulaci ze strany matky a rodiny.' },
                  { id: 'snížení výživného / narovnání financí', label: 'Snížení / spravedlivá úprava výživného', desc: 'Vyvážení finanční zátěže podle reálných příjmů.' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setPrimaryGoal(opt.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      primaryGoal === opt.id
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <strong className="block font-bold text-slate-900 mb-1">{opt.label}</strong>
                    <span className="text-slate-500 leading-relaxed block">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-all self-start sm:self-auto"
                >
                  Zpět
                </button>

                <button
                  onClick={handleGeneratePlan}
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Sestavuji akční plán na 7–30 dní...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Vygenerovat akční plán (7–30 dní)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Plan Results View */
        <div className="space-y-6">
          {/* Top Plan Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-slate-900">Vybraná konfigurace:</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold">{childAge}</span>
              <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">{primaryGoal}</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setStep(1)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Upravit zadání
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Vytisknout / PDF</span>
              </button>
            </div>
          </div>

          {/* Plan Summary Card */}
          {plan && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
              <div className="border-b border-slate-100 pb-6">
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  Manažerské shrnutí strategie
                </span>
                <h2 className="text-xl font-bold text-slate-900">{plan.summary}</h2>
              </div>

              {/* 3-Stage Timelines */}
              <div className="space-y-6">
                {/* Days 1-7 */}
                <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-3">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>Dni 1–7: Okamžitá stabilizace a ochrana důkazů</span>
                  </div>

                  <div className="space-y-2">
                    {plan.days1to7.map((item, idx) => {
                      const taskId = `d1-7-${idx}`;
                      const isDone = !!completedTasks[taskId];
                      return (
                        <label
                          key={taskId}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                            isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-rose-100 text-slate-800 hover:border-rose-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleTask(taskId)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={isDone ? 'line-through text-slate-500' : 'font-medium'}>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Days 8-14 */}
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Dni 8–14: Písemná podání a OSPOD jednání</span>
                  </div>

                  <div className="space-y-2">
                    {plan.days8to14.map((item, idx) => {
                      const taskId = `d8-14-${idx}`;
                      const isDone = !!completedTasks[taskId];
                      return (
                        <label
                          key={taskId}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                            isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-amber-100 text-slate-800 hover:border-amber-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleTask(taskId)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={isDone ? 'line-through text-slate-500' : 'font-medium'}>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Days 15-30 */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Dni 15–30: Soudní příprava a upevnění návyků</span>
                  </div>

                  <div className="space-y-2">
                    {plan.days15to30.map((item, idx) => {
                      const taskId = `d15-30-${idx}`;
                      const isDone = !!completedTasks[taskId];
                      return (
                        <label
                          key={taskId}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer text-xs ${
                            isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-white border-blue-100 text-slate-800 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => toggleTask(taskId)}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={isDone ? 'line-through text-slate-500' : 'font-medium'}>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legal Tips and Communication Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <strong className="block text-slate-900 font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Klíčové právní tipy a judikatura
                  </strong>
                  <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                    {plan.legalTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                  <strong className="block text-amber-950 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Základní pravidlo komunikace
                  </strong>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    {plan.communicationRule}
                  </p>
                </div>
              </div>

              {/* Action Button to Generate Form */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Připraveni přejít k sepsání podání k opatrovnickému soudu?
                </p>
                <button
                  onClick={() => onNavigate?.('/ai-formulare')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Přejít k vygenerování formuláře</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* AI Disclaimer */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní upozornění:</strong> Vygenerovaný procesní plán (AI) slouží pouze jako orientační průvodce. 
            Právní situace v rodinném právu je vždy vysoce individuální. Tento výstup není právní radou, 
            nenahrazuje odbornou pomoc advokáta a negarantuje výsledek u soudu. 
          </p>
        </div>
      </div>
    </div>
  );
};
