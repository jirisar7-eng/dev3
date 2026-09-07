import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  X,
  Send,
  Shield,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronDown,
  RefreshCw,
  FileCode,
  Info
} from 'lucide-react';
import { apiFetch, safeJsonResponse } from '../../utils/apiClient';
import { ControlPlaneCapability } from '../../types/controlPlane';
import { OrionProposedAction } from '../../services/orion/orionTypes';

interface OrionMessage {
  id: string;
  sender: 'user' | 'orion';
  text: string;
  timestamp: string;
  decision?: 'ALLOW' | 'DENY' | 'AI_RECOMMENDATION' | 'HUMAN_APPROVAL_REQUIRED';
  proposedActions?: OrionProposedAction[];
  requiresHumanApproval?: boolean;
  correlationId?: string;
  error?: string;
}

interface OrionContextResponse {
  correlationId: string;
  userRole: string;
  isAuthenticated: boolean;
  userName: string;
  effectiveCapabilities: ControlPlaneCapability[];
  currentRoute: string;
}

interface OrionGlobalShellProps {
  currentPath?: string;
  pageContext?: Record<string, any>;
  onNavigate?: (path: string) => void;
}

export const OrionGlobalShell: React.FC<OrionGlobalShellProps> = ({
  currentPath = '/',
  pageContext,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<OrionMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showCapabilities, setShowCapabilities] = useState<boolean>(false);
  const [orionContext, setOrionContext] = useState<OrionContextResponse | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current session context on mount and when path changes
  const loadContext = async () => {
    try {
      const res = await apiFetch(`/api/orion/context?route=${encodeURIComponent(currentPath)}`);
      if (res.ok) {
        const data = await safeJsonResponse<OrionContextResponse>(res);
        if (data) {
          setOrionContext(data);
        }
      }
    } catch (err) {
      console.warn('[OrionGlobalShell] Nelze načíst kontext Oriona:', err);
    }
  };

  useEffect(() => {
    loadContext();
  }, [currentPath]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'orion-welcome',
          sender: 'orion',
          text: `Dobrý den. Jsem **ORION**, globální asistenční a bezpečnostní inteligence ekosystému Táta má právo.\n\nSleduji aktivní sekci **${currentPath}**. Můžete se mě zeptat na procesní postupy, kalkulačky výživného, BIFF komunikaci nebo bezpečnostní stav systému.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          decision: 'AI_RECOMMENDATION'
        }
      ]);
    }
  }, [currentPath]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const query = (presetText || inputMessage).trim();
    if (!query || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMsg: OrionMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!presetText) setInputMessage('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/orion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          currentRoute: currentPath,
          pageContext: pageContext || {}
        })
      });

      const data = await safeJsonResponse<any>(res);

      if (data) {
        const orionReply: OrionMessage = {
          id: `orn-${Date.now()}`,
          sender: 'orion',
          text: data.message || 'Dotaz byl zpracován.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          decision: data.decision,
          proposedActions: data.proposedActions,
          requiresHumanApproval: data.requiresHumanApproval,
          correlationId: data.correlationId,
          error: data.error
        };
        setMessages((prev) => [...prev, orionReply]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: 'orion',
            text: 'Chyba spojení s Orion Control Plane. Zkuste to prosím za okamžik.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            decision: 'DENY'
          }
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'orion',
          text: `Chyba při odesílání dotazu: ${err?.message || 'Neznámá chyba'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          decision: 'DENY'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Quick contextual questions based on path and role
  const getSuggestions = () => {
    if (orionContext?.userRole === 'ADMIN' || orionContext?.userRole === 'SUPER_ADMIN') {
      return [
        'Analyzuj stav auditních zjištění',
        'Zkontroluj bezpečnostní politiku AI',
        'Přehled aktivních kontrolních akcí'
      ];
    }
    if (orionContext?.isAuthenticated) {
      return [
        'Jak postupovat při nečinnosti OSPOD?',
        'Převod zprávy podle zásad BIFF',
        'Jak funguje výpočet výživného?'
      ];
    }
    return [
      'Jak funguje kalkulačka výživného?',
      'Co je to BIFF komunikace?',
      'Judikatura Ústavního soudu k péči'
    ];
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button (System Trigger: 44x44px, icon: 20px) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-11 h-11 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-cyan-400 rounded-xl shadow-lg border border-slate-700/80 hover:border-cyan-500/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 backdrop-blur-sm group"
          title="ORION"
          aria-label="ORION"
        >
          <Cpu className="w-5 h-5 text-cyan-400/90 group-hover:text-cyan-300 transition-colors" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400/80"></span>
          </span>
        </button>
      )}

      {/* Floating Interactive Panel */}
      {isOpen && (
        <div className="flex flex-col w-[380px] sm:w-[440px] h-[580px] bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold tracking-wide text-white">ORION</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                    GLOBAL
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[220px]">
                  Cesta: <span className="font-mono text-slate-300">{currentPath}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={loadContext}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Aktualizovat kontext"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                title="Zavřít panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context & Capabilities Status Strip */}
          <div className="px-3.5 py-1.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 text-slate-300">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span className="font-medium">{orionContext?.userRole || 'ANONYMOUS'}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                {orionContext?.isAuthenticated ? orionContext.userName : 'Veřejný režim'}
              </span>
            </div>

            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition text-[10px]"
            >
              <span>{orionContext?.effectiveCapabilities?.length || 0} capabilities</span>
              <ChevronDown className={`w-3 h-3 transform transition ${showCapabilities ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Capabilities Viewer (Read-only) */}
          {showCapabilities && (
            <div className="px-3.5 py-2 bg-slate-950 border-b border-slate-800 text-[11px]">
              <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                <span>Efektivní oprávnění (průnik role a Oriona):</span>
                <span className="text-slate-500 text-[9px]">UI neuděluje práva</span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {orionContext?.effectiveCapabilities && orionContext.effectiveCapabilities.length > 0 ? (
                  orionContext.effectiveCapabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded font-mono text-[10px] border border-slate-700"
                    >
                      {cap}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic text-[10px]">
                    Žádná chráněná capability (pouze veřejný režim).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Decision Badge for Orion responses */}
                {msg.sender === 'orion' && msg.decision && (
                  <div className="mb-1 flex items-center space-x-1">
                    {msg.decision === 'AI_RECOMMENDATION' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800 text-[9px] font-semibold tracking-wider uppercase flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        AI Doporučení
                      </span>
                    )}
                    {msg.decision === 'ALLOW' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[9px] font-semibold tracking-wider uppercase flex items-center space-x-1">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Povoleno
                      </span>
                    )}
                    {msg.decision === 'DENY' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800 text-[9px] font-semibold tracking-wider uppercase flex items-center space-x-1">
                        <Lock className="w-2.5 h-2.5 mr-1" />
                        Zamítnuto (Fail Closed)
                      </span>
                    )}
                    {msg.decision === 'HUMAN_APPROVAL_REQUIRED' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 text-[9px] font-semibold tracking-wider uppercase flex items-center space-x-1">
                        <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                        Vyžaduje lidské schválení
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-xl max-w-[88%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : msg.decision === 'DENY'
                      ? 'bg-rose-950/40 border border-rose-800/80 text-rose-100 rounded-bl-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Proposed Actions Card */}
                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/70 space-y-1.5">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-amber-300 flex items-center space-x-1">
                        <FileCode className="w-3 h-3 mr-1" />
                        Navržená akce (DRAFT):
                      </div>
                      {msg.proposedActions.map((act, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-900/90 rounded border border-amber-900/60 text-[11px]"
                        >
                          <div className="font-semibold text-amber-200">{act.title}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5 font-mono">
                            Cíl: {act.targetResource} | Riziko: {act.riskLevel}
                          </div>
                          <div className="text-slate-300 text-[10px] mt-1 italic">
                            "{act.intent}"
                          </div>
                        </div>
                      ))}
                      <div className="text-[10px] text-amber-400/80 flex items-center space-x-1 mt-1">
                        <Info className="w-3 h-3 mr-0.5" />
                        Orion akce sám neprovádí; čeká na autorizaci v Control Plane.
                      </div>
                    </div>
                  )}

                  {msg.correlationId && (
                    <div className="mt-1.5 text-[9px] font-mono text-slate-500 text-right">
                      id: {msg.correlationId}
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-500 whitespace-nowrap">Tipy:</span>
            {getSuggestions().map((tip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(undefined, tip)}
                className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-[10px] whitespace-nowrap border border-slate-700 transition"
              >
                {tip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Zeptejte se Oriona na cokoliv v portálu..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-40"
              title="Odeslat dotaz"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
