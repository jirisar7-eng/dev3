import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight,
  FileText,
  AlertCircle, AlertTriangle,
  BookOpen
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  biffResult?: {
    original: string;
    converted: string;
    explanation: string;
    advice?: string;
  };
}

interface AiAssistantViewProps {
  onNavigate?: (path: string) => void;
}

const PRESET_QUESTIONS = [
  {
    icon: BookOpen,
    label: 'Judikatura ÚS k přespávání a střídavé péči',
    prompt: 'Jaká je aktuální judikatura Ústavního soudu ohledně střídavé péče a přespávání dětí útlého věku (kojenec/batole) u obou rodičů?'
  },
  {
    icon: AlertCircle, AlertTriangle,
    label: 'Postup při bránění a odepření styku',
    prompt: 'Matka mi bezdůvodně odepřela styk s dcerou. Jaký je přesný procesní postup v prvních 24 a 48 hodinách (OSPOD, PČR, soud)?'
  },
  {
    icon: MessageSquare,
    label: 'Reakce na lživé obvinění v e-mailu',
    prompt: 'Obdržel jsem útočný e-mail s nepravdivými tvrzeními o mém chování k dítěti. Jak reagovat podle zásad BIFF?'
  },
  {
    icon: FileText,
    label: 'Příprava podnětu na OSPOD pro nečinnost',
    prompt: 'Jak sepsat věcný podnět na OSPOD k prověření poměrů a aktivní součinnosti bez napadání matky?'
  }
];

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'biff'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // BIFF state
  const [biffInput, setBiffInput] = useState('');
  const [biffLoading, setBiffLoading] = useState(false);
  const [biffResult, setBiffResult] = useState<{
    original: string;
    converted: string;
    explanation: string;
    advice?: string;
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: 'Dobrý den. Jsem AI Opatrovnický asistent portálu **Táta má právo**. Můžete se mě zeptat na judikaturu Ústavního soudu, postupy OSPOD, přípravu soudního podání nebo využít náš **BIFF Převodník** pro převod emotivních zpráv na věcnou komunikaci.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [chatError, setChatError] = useState<string | null>(null);
  const [biffError, setBiffError] = useState<string | null>(null);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    setChatError(null);
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'assistant',
          messages: newMessages
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || (res.status === 429 ? 'Překročen limit dotazů na AI (HTTP 429).' : 'Odpověď AI se nepodařilo načíst.'));
      }

      const data = await res.json();
      if (!data.reply) {
        throw new Error('Odpověď AI se nepodařilo načíst.');
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setChatError(err?.message || 'Odpověď AI se nepodařilo načíst. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvertBiff = async () => {
    if (!biffInput.trim() || biffLoading) return;
    setBiffLoading(true);
    setBiffError(null);

    try {
      const res = await fetch('/api/ai/biff-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawMessage: biffInput })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Převod do BIFF tónu selhal.');
      }

      const data = await res.json();
      if (data.success && data.convertedMessage) {
        setBiffResult({
          original: biffInput,
          converted: data.convertedMessage,
          explanation: data.explanation || 'Odstraněny emotivní výčitky, text byl zkrácen na jasná a věcná fakta.',
          advice: data.keyAdvice || 'Odešlete zprávu bez dalších úprav.'
        });
      } else {
        throw new Error('Převod do BIFF tónu selhal.');
      }
    } catch (err: any) {
      setBiffError(err?.message || 'Převod do BIFF tónu se nepodařilo provést. Zkuste to prosím znovu.');
    } finally {
      setBiffLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="AI Opatrovnický Asistent • Táta má právo"
        description="Inteligentní AI asistent s BIFF převodníkem zpráv, rozborem opatrovnických situací a judikaturou Ústavního soudu."
        canonicalPath="/ai-asistent"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> AI Engine v3.6
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                Aktivní
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AI Opatrovnický Asistent & BIFF Převodník
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Získejte okamžité právní výklady judikatury, doporučení k OSPODu a převeďte náročné e-maily do bezúhonné věcné komunikace podle metodiky BIFF.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 self-stretch sm:self-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Chat & Poradce</span>
            </button>
            <button
              onClick={() => setActiveTab('biff')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'biff'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>BIFF Převodník zpráv</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Mode Content */}
      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Window (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
            {/* Chat Top Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Právní Asistent</h3>
                  <span className="text-[11px] text-slate-500 block">Expert na opatrovnické právo & judikaturu ÚS</span>
                </div>
              </div>

              <button
                onClick={() => setMessages([{
                  id: 'msg-reset',
                  role: 'assistant',
                  content: 'Konverzace byla vyčištěna. S čím vám mohu pomoci?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-xs flex items-center gap-1 font-semibold"
                title="Vyčistit konverzaci"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vyčistit chat</span>
              </button>
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 flex items-start gap-2 text-[11px] text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>Upozornění:</strong> Odpovědi AI asistenta mají pouze informativní charakter a <strong>nenahrazují závaznou právní radu advokáta</strong>. Před provedením zásadních právních úkonů se poraďte s odborníkem.
              </p>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-900 text-white rounded-tr-none shadow-sm'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                    <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-100/20 text-[10px] opacity-75">
                      <span>{msg.timestamp}</span>
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="hover:text-blue-500 flex items-center gap-1 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-600 font-bold">Zkopírováno</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Kopírovat</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 font-bold text-xs shadow-xs">
                      Já
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 items-center text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
                  <Bot className="w-4 h-4 text-blue-600 animate-bounce" />
                  <span>AI přemýšlí a vyhledává judikaturu...</span>
                </div>
              )}

              {chatError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 gap-2">
                  <span>{chatError}</span>
                  <button
                    onClick={() => handleSendMessage()}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Zkusit znovu</span>
                  </button>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
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
                  placeholder="Zadejte dotaz k opatrovnickému řízení, OSPODu či soudním krokům..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Odeslat</span>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Preset Prompts (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Rychlé přednastavené dotazy
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Klikněte na jakékoli téma a AI asistent vám okamžitě připraví věcnou odpověď s odkazy na legislativu.
              </p>

              <div className="space-y-2.5">
                {PRESET_QUESTIONS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex items-start gap-3 text-xs"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-slate-700 group-hover:text-blue-700 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <strong className="block text-slate-900 font-semibold group-hover:text-blue-900 mb-0.5">
                          {item.label}
                        </strong>
                        <span className="text-[11px] text-slate-500 line-clamp-2">
                          {item.prompt}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Banner Quick Link to Forms */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-3xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Potřebujete vytvořit oficiální návrh?</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Přejděte do náho AI Generátoru formulářů, kde vygenerujete předvyplněné právní podání pro opatrovnický soud.
              </p>
              <button
                onClick={() => onNavigate?.('/ai-formulare')}
                className="w-full py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Otevřít AI Generátor formulářů</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* BIFF Converter Tab */
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                Metodika BIFF
              </span>
              <span className="text-xs text-slate-500">• Brief, Informative, Friendly, Firm</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              BIFF Převodník e-mailů a zpráv
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Vložte jakýkoliv e-mail nebo zprávu od druhé strany (či váš koncept v afektu). AI zprávu očistí od emotivního balastu, výčitek a vytvoří právně neprůstřelnou reakci.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Vložte původní nebo emotivní text zprávy:
              </label>
              <textarea
                rows={5}
                value={biffInput}
                onChange={(e) => setBiffInput(e.target.value)}
                placeholder="Např.: Už zase mi nebereš telefon a schválně mi tajíš, do jaké školky má malá chodit! Jsi absolutně neseriózní a dávám to k soudu..."
                className="w-full p-4 rounded-2xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50 focus:bg-white transition-all font-sans"
              />
            </div>

            {biffError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 gap-2">
                <span>{biffError}</span>
                <button
                  onClick={handleConvertBiff}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors text-xs whitespace-nowrap shrink-0 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Zkusit znovu</span>
                </button>
              </div>
            )}

            <button
              onClick={handleConvertBiff}
              disabled={biffLoading || !biffInput.trim()}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {biffLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Převádím na věcnou BIFF komunikaci...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Převeď na věcnou komunikaci (BIFF)</span>
                </>
              )}
            </button>
          </div>

          {/* BIFF Result Output */}
          {biffResult && (
            <div className="pt-6 border-t border-slate-200 space-y-6 animate-fadeIn">
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" /> Vygenerovaná BIFF verze
                  </span>
                  <button
                    onClick={() => handleCopyText(biffResult.converted, 'biff-copy')}
                    className="px-3 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                  >
                    {copiedId === 'biff-copy' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Zkopírováno</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Kopírovat BIFF text</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
                  {biffResult.converted}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <strong className="block text-slate-900 font-bold mb-1">
                    💡 Vysvětlení provedených změn
                  </strong>
                  <p className="text-slate-600 leading-relaxed">
                    {biffResult.explanation}
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-1">
                  <strong className="block text-blue-900 font-bold mb-1">
                    🛡️ Taktické doporučení
                  </strong>
                  <p className="text-slate-700 leading-relaxed">
                    {biffResult.advice}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Disclaimer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní upozornění:</strong> Umělá inteligence (AI) může obsahovat chyby a generovat nepřesné informace. 
            Výstup slouží pouze jako informační pomoc a nenahrazuje odbornou právní nebo psychologickou pomoc. 
            Výstup není právní radou ani právním zastoupením. Všechny vygenerované texty si před odesláním nebo použitím pečlivě zkontrolujte.
          </p>
        </div>
      </div>
    </div>
  );
};
