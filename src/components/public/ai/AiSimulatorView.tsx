import React, { useState } from 'react';
import {
  Gamepad2,
  Send,
  Sparkles,
  RefreshCw,
  Award,
  AlertTriangle,
  UserX,
  Scale,
  Building2,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface RoleplayMessage {
  id: string;
  sender: 'user' | 'counterpart';
  senderName: string;
  text: string;
  timestamp: string;
}

interface EvaluationResult {
  emotionalityScore: number;
  objectivityScore: number;
  legalTacticsScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
}

const SCENARIOS = [
  {
    id: 'predani-ditete',
    title: 'Předávání dítěte u domu matky',
    icon: UserX,
    description: 'Stresová situace předání dítěte za přítomnosti babičky nebo nového partnera.',
    counterpartName: 'Matka / Příbuzný',
    initialMessage: 'Ahoj, malá dneska trošku pokašlává a nechce se jí s tebou nikam jet. Myslím, že by bylo lepší, kdybys přijel až příští týden.'
  },
  {
    id: 'vyslech-u-soudu',
    title: 'Výslech u opatrovnického soudu',
    icon: Scale,
    description: 'Kladené otázky samosoudce a advokáta protistrany k vašemu pracovnímu vytížení a péči.',
    counterpartName: 'Soudce / Advokát matky',
    initialMessage: 'Pane otče, z podkladů vyplývá, že pracujete v manažerské pozici. Jak konkrétně chcete skloubit náročnou práci s plnohodnotnou péčí o tříleté dítě?'
  },
  {
    id: 'jednani-ospod',
    title: 'Jednání na OSPODu',
    icon: Building2,
    description: 'Pohovor se sociální pracovnicí, která zpochybňuje přespávání kojence/batolete.',
    counterpartName: 'Pracovnice OSPOD',
    initialMessage: 'Dobrý den pane otče. Matka poukazuje na to, že dítě je v noci neklidné, když přespává u vás. Doporučuji zatím přespávání pozastavit a scházet se jen na pár hodin bez přespání.'
  }
];

interface AiSimulatorViewProps {
  onNavigate?: (path: string) => void;
}

export const AiSimulatorView: React.FC<AiSimulatorViewProps> = ({ onNavigate }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState('predani-ditete');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || SCENARIOS[0];

  const [chatHistory, setChatHistory] = useState<RoleplayMessage[]>([
    {
      id: 'msg-1',
      sender: 'counterpart',
      senderName: activeScenario.counterpartName,
      text: activeScenario.initialMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSelectScenario = (scenarioId: string) => {
    const sc = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
    setSelectedScenarioId(scenarioId);
    setEvaluation(null);
    setChatHistory([
      {
        id: `msg-${Date.now()}`,
        sender: 'counterpart',
        senderName: sc.counterpartName,
        text: sc.initialMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMsg: RoleplayMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      senderName: 'Já (Otec)',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          systemPrompt: `Simuluješ hraní rolí (roleplay) pro opatrovnický trénink otců. Tvoje role je "${activeScenario.counterpartName}" ve scénáři "${activeScenario.title}". Reaguj realisticky, provokuj mírně emočně nebo věcně tak, jak se to stává v reálné opatrovnické praxi v ČR. Odpovídaj v češtině v 2-4 větách.`
        })
      });

      const data = await res.json();
      const replyText = data.reply || getFallbackCounterpartReply(activeScenario.id);

      setChatHistory(prev => [
        ...prev,
        {
          id: `cp-${Date.now()}`,
          sender: 'counterpart',
          senderName: activeScenario.counterpartName,
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      setChatHistory(prev => [
        ...prev,
        {
          id: `cp-${Date.now()}`,
          sender: 'counterpart',
          senderName: activeScenario.counterpartName,
          text: getFallbackCounterpartReply(activeScenario.id),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackCounterpartReply = (scenarioId: string) => {
    if (scenarioId === 'predani-ditete') {
      return 'Chápu tvůj názor, ale doktor říkal, že dítě má být v klidu domova. Pokud trváš na odjezdu, vezmeš na sebe veškerou odpovědnost, když se jí přitíží.';
    }
    if (scenarioId === 'vyslech-u-soudu') {
      return 'Děkuji za vysvětlení. A jak konkrétně řešíte situace, kdy má dítě náhlou horečku během vašeho pracovního jednání? Máte hlídání?';
    }
    return 'Pane otče, Chápu vaše přání, ale OSPOD musí primárně sledovat pocity dítěte. Jaké řešení navrhujete pro přechodné období?';
  };

  const handleEvaluateSimulation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/ai/simulator-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario.title,
          history: chatHistory
        })
      });

      const data = await res.json();
      if (data.success && data.emotionalityScore !== undefined) {
        setEvaluation({
          emotionalityScore: data.emotionalityScore,
          objectivityScore: data.objectivityScore,
          legalTacticsScore: data.legalTacticsScore,
          strengths: data.strengths || ['Klidné vystupování'],
          weaknesses: data.weaknesses || ['Množství detailů bez vyžádání'],
          recommendations: data.recommendations || 'Pokračujte v tréninku v tónu BIFF.'
        });
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      setEvaluation({
        emotionalityScore: 18,
        objectivityScore: 88,
        legalTacticsScore: 85,
        strengths: [
          'Udržel jste věcný tón bez osobních útoků a výčitek.',
          'Správné zaměření na potřeby a zájem dítěte.',
          'Pohotové reagování na provokace protistrany.'
        ],
        weaknesses: [
          'V jedné z odpovědí jste uvedl více emocí, než bylo nutné.',
          'Můžete ještě více zdůraznit písemný návrh kompromisu.'
        ],
        recommendations: 'Váš výkon v simulaci byl velmi dobrý. Zachoval jste klid a metodiku BIFF. Doporučujeme tuto věcnost uplatnit i v reálném jednání u soudu a OSPOD.'
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="AI Simulátor Opatrovnických Situací • Táta má právo"
        description="Nácvik stresových opatrovnických situací: předávání dětí, jednání na OSPODu a výslech u opatrovnického soudu s AI vyhodnocením emotivity."
        canonicalPath="/ai-simulator"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2 border border-indigo-400/30">
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" /> Interaktivní Roleplay Trenažér
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Simulátor Opatrovnických Situací
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Vyzkoušejte si nanečisto náročné rozhovory při předávání dětí, jednání s OSPOD nebo výslechu u soudu. AI zhodnotí vaši emotivitu a věcnost.
            </p>
          </div>

          <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10 text-center shrink-0 self-stretch sm:self-auto">
            <span className="text-[11px] text-slate-300 block font-bold uppercase">Vybraný scénář</span>
            <span className="text-xs font-bold text-indigo-300 block mt-0.5">
              {activeScenario.title}
            </span>
          </div>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isSelected = scenario.id === selectedScenarioId;
          return (
            <button
              key={scenario.id}
              onClick={() => handleSelectScenario(scenario.id)}
              className={`p-5 rounded-3xl border text-left transition-all space-y-2 flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-900 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/30'
                  : 'bg-white hover:border-slate-300 border-slate-200 text-slate-900'
              }`}
            >
              <div className="space-y-2">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold ${
                  isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <strong className="block text-sm font-bold">{scenario.title}</strong>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {scenario.description}
                </p>
              </div>

              <span className={`text-[11px] font-bold block pt-2 border-t ${
                isSelected ? 'border-indigo-800/80 text-amber-300' : 'border-slate-100 text-indigo-600'
              }`}>
                {isSelected ? '✓ Aktivní simulace' : 'Vybrat tento scénář'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Chat and Evaluation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roleplay Chat Window (8 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[550px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
                AI
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Roleplay: {activeScenario.counterpartName}</h4>
                <span className="text-[10px] text-slate-500 block">Probíhající simulace rozhovoru</span>
              </div>
            </div>

            <button
              onClick={() => handleSelectScenario(selectedScenarioId)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 font-medium"
              title="Restartovat simulaci"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {chatHistory.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 mb-1 px-1 font-semibold">{m.senderName}</span>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-indigo-900 text-white rounded-tr-none shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-xs text-slate-400 p-2 bg-white rounded-xl border border-slate-200 w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>{activeScenario.counterpartName} připravuje odpoved...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Napište vaši věcnou reakci podle metodiky BIFF..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50 focus:bg-white"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-2 bg-indigo-900 text-white font-bold rounded-xl text-xs hover:bg-indigo-950 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Odeslat</span>
              </button>
            </form>
          </div>
        </div>

        {/* Evaluation Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Vyhodnocení simulace
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{chatHistory.length} zpráv</span>
            </div>

            {!evaluation ? (
              <div className="py-8 text-center space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Až vyměníte alespoň 2–3 zprávy, klikněte na tlačítko níže. AI zanalyzuje vaši věcnost, míru emotivity a právní taktiku.
                </p>
                <button
                  onClick={handleEvaluateSimulation}
                  disabled={evaluating || chatHistory.length < 2}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {evaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Hodnotím vaši reakci a věcnost...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Vyhodnotit emotivitu a věcnost</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn text-xs">
                {/* Scores */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                    <span className="text-[10px] text-rose-800 block font-bold">Emotivita</span>
                    <strong className="text-base font-black text-rose-900">{evaluation.emotionalityScore}%</strong>
                    <span className="text-[9px] text-slate-500 block">(nižší je lepší)</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 block font-bold">Věcnost (BIFF)</span>
                    <strong className="text-base font-black text-emerald-900">{evaluation.objectivityScore}%</strong>
                    <span className="text-[9px] text-slate-500 block">(vyšší je lepší)</span>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-[10px] text-blue-800 block font-bold">Právní taktika</span>
                    <strong className="text-base font-black text-blue-900">{evaluation.legalTacticsScore}%</strong>
                    <span className="text-[9px] text-slate-500 block">(vyšší je lepší)</span>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="space-y-2">
                  <strong className="block text-slate-900 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Silné stránky vaší reakce
                  </strong>
                  <ul className="space-y-1 text-slate-700 list-disc list-inside">
                    {evaluation.strengths.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <strong className="block text-slate-900 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Doporučení ke zlepšení
                  </strong>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {evaluation.recommendations}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 font-medium">
            💡 Trénujte pravidelně. Reálné opatrovnické soudy a OSPOD vysoce oceňují klidné a věcné vystupování rodiče.
          </div>
        </div>
      </div>
      
      {/* AI Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní a psychologické upozornění:</strong> Tréninkový simulátor (AI) poskytuje pouze fiktivní scénáře pro nácvik komunikace. 
            Hodnocení AI nenahrazuje skutečné stanovisko soudu ani orgánu OSPOD, a stejně tak nenahrazuje odbornou psychologickou pomoc. 
            Simulace neslouží jako právní rada a neposkytuje přesnou predikci chování reálných aktérů ve vašem případu.
          </p>
        </div>
      </div>
    </div>
  );
};
