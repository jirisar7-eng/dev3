import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/apiClient';
import {
  Cpu,
  BarChart2,
  DollarSign,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Database,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ProviderStatusItem {
  name: string;
  modelName: string;
  available: boolean;
  enabled: boolean;
  failureCount: number;
  lastFailureAt: string | null;
  cooldownUntil: string | null;
}

interface AIStatsData {
  totalCalls: number;
  cacheHits: number;
  skipped: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  estimatedCostUsd: number;
  lastCallAt: string | null;
  skippedReasons: Record<string, number>;
}

interface AiContextStatusData {
  lastUpdated: string;
  pagesCount: number;
  routesCount: number;
  indexedUrlsCount: number;
}

export const AiTelemetryCard: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [providers, setProviders] = useState<ProviderStatusItem[]>([]);
  const [stats, setStats] = useState<AIStatsData | null>(null);
  const [aiContextStatus, setAiContextStatus] = useState<AiContextStatusData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [togglingProvider, setTogglingProvider] = useState<string | null>(null);
  const [refreshingIndex, setRefreshingIndex] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // 1. Fetch AI Orchestrator & Stats
      const orchRes = await apiFetch('/api/admin/qa/ai-orchestrator/status');
      const orchData = await orchRes.json();
      if (orchData.success) {
        setProviders(orchData.statuses || []);
        if (orchData.stats) {
          setStats(orchData.stats);
        }
      }

      // 2. Fetch AI Context Status
      const ctxRes = await apiFetch('/api/ai-context/status');
      if (ctxRes.ok) {
        const ctxData = await ctxRes.json();
        setAiContextStatus(ctxData);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Chyba při načítání AI telemetrie.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleToggleProvider = async (providerName: string, currentEnabled: boolean) => {
    setTogglingProvider(providerName);
    try {
      const res = await apiFetch('/api/admin/qa/ai-orchestrator/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerName, enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success && data.statuses) {
        setProviders(data.statuses);
        setMessage({
          type: 'success',
          text: `Provider ${providerName} byl ${!currentEnabled ? 'aktivován' : 'deaktivován'}.`,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Nepodařilo se změnit stav providera.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Chyba sítě při přepínání providera.' });
    } finally {
      setTogglingProvider(null);
    }
  };

  const handleRefreshIndex = async () => {
    setRefreshingIndex(true);
    try {
      const res = await apiFetch('/api/admin/ai-context/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiContextStatus(data.status);
        setMessage({ type: 'success', text: 'AI Context Index (llms.txt, sitemap) byl úspěšně regenerován.' });
      } else {
        setMessage({ type: 'error', text: 'Chyba při obnově indexu.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Chyba při komunikaci s indexační službou.' });
    } finally {
      setRefreshingIndex(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-600 text-white rounded-xl shadow-xs">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">AI Telemetrie & Model Orchestration</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                0-PII Telemetrie
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Přehled multi-AI providerů (Gemini, Grok, Groq), odhadované náklady, spotřeba tokenů a cacheování.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            <span>Obnovit telemetrii</span>
          </button>
        </div>
      </div>

      {/* Alert message if any */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-[10px] font-bold underline hover:opacity-80 cursor-pointer ml-4"
          >
            Zavřít
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tokeny celkem */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Spotřeba Tokenů</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats ? stats.tokenUsage.totalTokens.toLocaleString('cs-CZ') : '—'}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span>Prompt: {stats?.tokenUsage.promptTokens || 0}</span>
            <span>•</span>
            <span>Completion: {stats?.tokenUsage.completionTokens || 0}</span>
          </div>
        </div>

        {/* Odhadované náklady */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Odhadované Náklady</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${stats ? stats.estimatedCostUsd.toFixed(4) : '0.0000'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Reálná kalkulace na bázi $0.000005/token
          </p>
        </div>

        {/* Celkem volání & Cache */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Volání & Cache</span>
            <BarChart2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats ? stats.totalCalls : 0}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
            <span className="text-emerald-700 font-semibold">Cache hit: {stats?.cacheHits || 0}</span>
            <span>•</span>
            <span className="text-slate-500">Přeskočeno: {stats?.skipped || 0}</span>
          </div>
        </div>

        {/* Poslední volání */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Poslední AI Aktivita</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 mt-1">
            {stats?.lastCallAt ? new Date(stats.lastCallAt).toLocaleTimeString('cs-CZ') : 'Zatím bez volání'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">
            {stats?.lastCallAt ? new Date(stats.lastCallAt).toLocaleDateString('cs-CZ') : 'In-Memory Telemetrie'}
          </p>
        </div>
      </div>

      {/* Multi-Provider Status Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Multi-AI Provider Stav & Failover Matice
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatický failover: Gemini (Primary) → Grok (Secondary) → Groq (Tertiary)
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200 self-start sm:self-auto">
            {providers.length} Konfigurovaní provideři
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {providers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Načítání stavu multi-AI orchestrátoru...
            </div>
          ) : (
            providers.map((p) => {
              const isCooldown = p.cooldownUntil && new Date(p.cooldownUntil) > new Date();
              return (
                <div key={p.name} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl text-white ${
                        p.name === 'gemini'
                          ? 'bg-blue-600'
                          : p.name === 'grok'
                          ? 'bg-slate-900'
                          : 'bg-amber-600'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm capitalize">{p.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                          {p.modelName}
                        </span>
                        {p.name === 'gemini' && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>Chyby: {p.failureCount}</span>
                        {p.lastFailureAt && (
                          <>
                            <span>•</span>
                            <span className="text-rose-600">
                              Poslední chyba: {new Date(p.lastFailureAt).toLocaleTimeString('cs-CZ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {isCooldown ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Cooldown ({new Date(p.cooldownUntil!).toLocaleTimeString('cs-CZ')})
                        </span>
                      ) : p.available && p.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Aktivní & Dostupný
                        </span>
                      ) : !p.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          Deaktivován
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Nedostupný
                        </span>
                      )}
                    </div>

                    {/* Toggle Button */}
                    <button
                      onClick={() => handleToggleProvider(p.name, p.enabled)}
                      disabled={togglingProvider === p.name}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        p.enabled
                          ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {p.enabled ? (
                        <>
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                          Vypnout
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 text-slate-300" />
                          Zapnout
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI Context & Index Card */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Context & LLM Index (llms.txt / sitemap.xml)</h3>
              <p className="text-xs text-slate-500">
                Deterministická znalostní báze poskytovaná AI modelům pro snížení halucinací a úsporu tokenů.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshIndex}
            disabled={refreshingIndex}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingIndex ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Regenerovat LLM Index</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Indexované Stránky</span>
            <span className="text-lg font-black text-slate-800">{aiContextStatus?.pagesCount || '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Indexované Routy</span>
            <span className="text-lg font-black text-slate-800">{aiContextStatus?.routesCount || '—'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Poslední Aktualizace</span>
            <span className="text-xs font-bold text-slate-700 block mt-1 truncate">
              {aiContextStatus?.lastUpdated ? new Date(aiContextStatus.lastUpdated).toLocaleString('cs-CZ') : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Security & 0-PII Guarantee Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">0-PII & Privacy Mandát pro LLM Orchestraci</span>
          <p className="text-slate-600 text-[11px] mt-0.5">
            Veškerá data vstupující do AI modelů (Gemini, Grok, Groq) jsou sanitizována modulem{' '}
            <code className="px-1 py-0.5 rounded bg-white font-mono text-[10px] text-indigo-700 border border-indigo-100">
              sanitizer.ts
            </code>
            . Osobní údaje (jména, rodná čísla, e-maily, rodinné spory) jsou maskovány před odesláním. API klíče a tajemství nikdy neopouštějí serverové prostředí.
          </p>
        </div>
      </div>
    </div>
  );
};
