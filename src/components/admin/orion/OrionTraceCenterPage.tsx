import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  Play,
  Clock,
  ShieldCheck,
  Cpu,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Database,
  ExternalLink,
  Info,
  Terminal,
} from 'lucide-react';
import { OrionTraceRecord, OrionTraceStep } from '../../../services/audit/orionTraceTypes';
import { OrionTraceMindMap } from './OrionTraceMindMap';
import { OrionTraceDetailDrawer } from './OrionTraceDetailDrawer';
import { apiFetch } from '../../../utils/apiClient';

interface NotionStatus {
  enabled: boolean;
  databaseConfigured: boolean;
  message: string;
}

interface OrionTraceCenterPageProps {
  onNavigate?: (path: string) => void;
}

export const OrionTraceCenterPage: React.FC<OrionTraceCenterPageProps> = ({ onNavigate }) => {
  const [activeTrace, setActiveTrace] = useState<OrionTraceRecord | null>(null);
  const [selectedStep, setSelectedStep] = useState<OrionTraceStep | null>(null);
  const [recentTraces, setRecentTraces] = useState<OrionTraceRecord[]>([]);
  const [notionStatus, setNotionStatus] = useState<NotionStatus | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [scope, setScope] = useState<'REGISTRY' | 'FINDING' | 'REGRESSION' | 'HEALTH' | 'GENERAL'>('REGISTRY');
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Poll active trace every 1000ms
  useEffect(() => {
    fetchActiveTrace();
    fetchRecentTraces();

    const interval = setInterval(() => {
      fetchActiveTrace();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Stopwatch timer when analysis is running
  useEffect(() => {
    if (isRunning) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const fetchActiveTrace = async () => {
    try {
      const res = await apiFetch('/api/admin/orion/active-trace');
      if (res.ok) {
        const body = await res.json();
        if (body && body.success && body.data) {
          if (body.data.trace) {
            setActiveTrace(body.data.trace);
            if (body.data.trace.status === 'ACTIVE') {
              setIsRunning(true);
            } else {
              setIsRunning(false);
            }
          }
          if (body.data.notionStatus) {
            setNotionStatus(body.data.notionStatus);
          }
        }
      }
    } catch (err: any) {
      // Quiet background polling error handling
      console.warn('[OrionTraceCenter] Polling active trace error:', err?.message);
    }
  };

  const fetchRecentTraces = async () => {
    try {
      const res = await apiFetch('/api/admin/orion/traces');
      if (res.ok) {
        const body = await res.json();
        if (body && body.success && Array.isArray(body.data)) {
          setRecentTraces(body.data);
        }
      }
    } catch (err: any) {
      console.warn('[OrionTraceCenter] Fetching recent traces error:', err?.message);
    }
  };

  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setElapsedMs(0);
    setErrorMessage(null);

    try {
      const res = await apiFetch('/api/admin/orion/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });

      const body = await res.json();
      if (res.ok && body && body.success && body.data?.trace) {
        setActiveTrace(body.data.trace);
        fetchRecentTraces();
      } else {
        setErrorMessage(body?.error || 'Chyba při spouštění Orion Trace analýzy.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Chyba komunikace se serverem.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Title & Trust Model Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-900 text-white flex items-center justify-center font-bold shadow-md">
              <Terminal className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Orion Process Trace & Observability Center
                </h1>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                  FÁZE 6B
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vizuální procesní mind-mapa 10 systémových kroků AI agenta Orion (agent-orion-qa-v1).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchActiveTrace();
                fetchRecentTraces();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Obnovit (1000ms Polling)
            </button>
          </div>
        </div>

        {/* Mandatory Trust Model Notice */}
        <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-purple-950">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-700 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold text-purple-900 underline uppercase tracking-wider block sm:inline mr-2">
                Orion Trust Level: AI_RECOMMENDATION
              </span>
              <span className="text-slate-700">
                Všechny výstupy jsou výhradně indikativní. Release Gate zůstává 100%
                deterministický a Orion nemá oprávnění měnit stav schválení. Každý návrh akce směřuje
                do stavu <strong>DRAFT</strong> a vyžaduje lidské schválení SUPER_ADMINem.
              </span>
            </div>
          </div>

          {notionStatus && (
            <div className="shrink-0 font-mono text-[11px]">
              <span
                className={`px-3 py-1 rounded-full border font-bold flex items-center gap-1.5 ${
                  notionStatus.enabled
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Notion Mirror: {notionStatus.enabled ? 'AKTIVNÍ' : 'LOKÁLNÍ'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Panel: Run Analysis & Live Timer */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-[10px] font-mono text-slate-400 font-bold uppercase block mb-1">
              Rozsah Analýzy (Scope)
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              disabled={isRunning}
              className="bg-slate-800 text-white border border-slate-700 text-xs rounded-xl px-3 py-2 font-mono font-bold focus:outline-hidden focus:border-purple-500 cursor-pointer"
            >
              <option value="REGISTRY">REGISTRY (Kompletní auditní registr)</option>
              <option value="FINDING">FINDING (Specifická zjištění P0-P3)</option>
              <option value="REGRESSION">REGRESSION (Časové regrese)</option>
              <option value="HEALTH">HEALTH (4 Pilíře zdraví projektu)</option>
              <option value="GENERAL">GENERAL (Celkový přehled)</option>
            </select>
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              isRunning
                ? 'bg-purple-950 text-purple-300 border border-purple-800 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-purple-300" />
                Orion Trace Běží...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-purple-200" />
                Spustit Orion Trace
              </>
            )}
          </button>
        </div>

        {/* Live Elapsed Stopwatch & Telemetry Summary */}
        <div className="flex items-center gap-6 font-mono text-xs">
          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Časomíra Latence</span>
            <span className="text-sm font-black text-purple-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-400" />
              {isRunning ? `${(elapsedMs / 1000).toFixed(2)} s` : `${((activeTrace?.totalLatencyMs || 0) / 1000).toFixed(2)} s`}
            </span>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/80">
            <span className="text-[10px] text-slate-400 block font-sans uppercase">Aktivní Provider</span>
            <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              {activeTrace?.provider.active || 'Gemini 2.5 Flash'}
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-xs font-mono">
          <strong>CHYBA ANALÝZY:</strong> {errorMessage}
        </div>
      )}

      {/* 1. Main Interactive Mind-Map Renderer */}
      {activeTrace ? (
        <OrionTraceMindMap
          steps={activeTrace.steps}
          activeStepId={activeTrace.currentStepId}
          onSelectStep={(step) => setSelectedStep(step)}
          selectedStepId={selectedStep?.id}
        />
      ) : (
        <div className="bg-slate-900 text-white p-12 rounded-3xl text-center border border-slate-800">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-bounce" />
          <p className="text-sm font-bold">Načítám procesní mind-mapu Oriona...</p>
        </div>
      )}

      {/* 2. Step Detail Side Drawer */}
      <OrionTraceDetailDrawer
        step={selectedStep}
        onClose={() => setSelectedStep(null)}
        providerInfo={activeTrace?.provider}
      />

      {/* 3. Telemetry & AI_RECOMMENDATION Summary Card */}
      {activeTrace && activeTrace.recommendationSummary && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Poslední Výstup AI_RECOMMENDATION
            </h3>
            <span className="text-[10px] font-mono bg-purple-50 text-purple-800 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              TRUST: AI_RECOMMENDATION
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            {activeTrace.recommendationSummary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 block">Prompt Tokeny</span>
              <span className="font-bold text-slate-900">{activeTrace.telemetry.promptTokens}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 block">Completion Tokeny</span>
              <span className="font-bold text-slate-900">{activeTrace.telemetry.completionTokens}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 block">Celkem Tokenů</span>
              <span className="font-bold text-purple-700">{activeTrace.telemetry.totalTokens}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 block">Odhadované Náklady</span>
              <span className="font-bold text-emerald-700">${activeTrace.telemetry.estimatedCostUsd.toFixed(5)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Recent Traces History Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-900" />
            Historie Procesních Trace Záznamů
          </h3>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
            {recentTraces.length} ZÁZNAMŮ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Trace ID</th>
                <th className="py-2.5 px-3">Agent</th>
                <th className="py-2.5 px-3">Uživatel</th>
                <th className="py-2.5 px-3">Scope</th>
                <th className="py-2.5 px-3">Stav</th>
                <th className="py-2.5 px-3">Latence</th>
                <th className="py-2.5 px-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentTraces.map((trace) => (
                <tr key={trace.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{trace.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-purple-700">{trace.agentId}</td>
                  <td className="py-2.5 px-3">{trace.actor.email}</td>
                  <td className="py-2.5 px-3 font-bold">{trace.scope}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        trace.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : trace.status === 'ACTIVE'
                          ? 'bg-purple-100 text-purple-900 animate-pulse'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {trace.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">{trace.totalLatencyMs} ms</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setActiveTrace(trace)}
                      className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold hover:bg-purple-100 hover:text-purple-900 transition-colors cursor-pointer text-[10px]"
                    >
                      Zobrazit Mind-Map
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
