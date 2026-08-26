import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TestStatusState {
  isTesting: boolean;
  lastRun: string | null;
  result: 'passed' | 'failed' | 'running' | 'idle';
  exitCode: number | null;
  durationMs: number | null;
  startedAt: string | null;
  outputLog?: string[];
  reportUrl?: string;
  hasReport?: boolean;
  triggeredBy?: string;
}

export const TestRunnerCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [status, setStatus] = useState<TestStatusState>({
    isTesting: false,
    lastRun: null,
    result: 'idle',
    exitCode: null,
    durationMs: null,
    startedAt: null,
    outputLog: [],
    reportUrl: '/test-report',
    hasReport: false,
  });

  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await apiFetch('/api/admin/test-status', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setStatus(data.state);
        } else {
          setStatus((prev) => ({
            ...prev,
            isTesting: data.isTesting,
            lastRun: data.lastRun,
            result: data.result,
            reportUrl: data.reportUrl || '/test-report',
            hasReport: data.hasReport,
          }));
        }
        setError(null);
      }
    } catch (err: any) {
      console.error('Chyba při zjišťování stavu testů:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTests = async () => {
    if (status.isTesting) return;
    setStarting(true);
    setError(null);

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await apiFetch('/api/admin/run-tests', {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.state) setStatus(data.state);
        setShowLogs(true);
      } else {
        setError(data.error || data.message || 'Nepodařilo se spustit testy.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci se serverem.');
    } finally {
      setStarting(false);
      fetchStatus();
    }
  };

  const handleOpenReport = () => {
    window.open('/test-report', '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Poll status while testing is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (status.isTesting) {
      interval = setInterval(() => {
        fetchStatus();
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status.isTesting]);

  // Auto scroll logs to bottom when updated
  useEffect(() => {
    if (showLogs && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status.outputLog, showLogs]);

  const formatDuration = (ms: number | null) => {
    if (!ms) return null;
    const sec = (ms / 1000).toFixed(1);
    return `${sec} s`;
  };

  const formatTimestamp = (iso: string | null) => {
    if (!iso) return 'Zatím nespuštěno';
    try {
      const date = new Date(iso);
      return date.toLocaleString('cs-CZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div id="e2e-test-runner-card" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">E2E AI Test Runner</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                Playwright + Midscene
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatizované vizuální a funkční end-to-end testování aplikace s AI vizuální analýzou.
            </p>
          </div>
        </div>

        <button
          id="btn-refresh-test-status"
          onClick={fetchStatus}
          disabled={loading}
          className="self-start sm:self-auto p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="Obnovit stav"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Obnovit stav</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block font-bold">Chyba spouštěče testů:</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Status & Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Indicator Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Stav testování
          </span>

          <div className="flex items-center gap-2">
            {status.isTesting ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Běží testování...
              </span>
            ) : status.result === 'passed' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Poslední test: Úspěšný
              </span>
            ) : status.result === 'failed' ? (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs">
                <XCircle className="w-3.5 h-3.5" />
                Poslední test: Selhal
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Zatím nespuštěno
              </span>
            )}
          </div>

          {status.durationMs && (
            <span className="text-[11px] text-slate-500 block font-medium">
              Doba běhu: <strong>{formatDuration(status.durationMs)}</strong>
            </span>
          )}
        </div>

        {/* Last Run Info Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Poslední spuštění
          </span>
          <span className="text-xs font-bold text-slate-800 block font-mono">
            {formatTimestamp(status.lastRun || status.startedAt)}
          </span>
          {status.triggeredBy && (
            <span className="text-[11px] text-slate-500 block">
              Spustil: <strong className="text-slate-700">{status.triggeredBy}</strong>
            </span>
          )}
          {status.exitCode !== null && (
            <span className="text-[10px] text-slate-400 font-mono block">
              Exit Code: {status.exitCode}
            </span>
          )}
        </div>

        {/* Environment Info Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Konfigurace AI & Runneru
          </span>
          <div className="text-[11px] space-y-1 text-slate-600 font-medium">
            <p className="flex items-center justify-between">
              <span>Runner:</span>
              <span className="font-mono font-bold text-indigo-700">Playwright E2E</span>
            </p>
            <p className="flex items-center justify-between">
              <span>AI Provider:</span>
              <span className="font-mono text-slate-800">Midscene + LLM</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          id="btn-run-e2e-tests"
          onClick={handleRunTests}
          disabled={status.isTesting || starting}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
            status.isTesting || starting
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-indigo-600/20'
          }`}
        >
          {status.isTesting || starting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Běží testování...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Spustit E2E AI Testy</span>
            </>
          )}
        </button>

        <button
          id="btn-open-test-report"
          onClick={handleOpenReport}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <ExternalLink className="w-4 h-4 text-blue-600" />
          <span>Otevřít Vizuální Report</span>
        </button>

        {status.outputLog && status.outputLog.length > 0 && (
          <button
            id="btn-toggle-test-logs"
            onClick={() => setShowLogs(!showLogs)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>{showLogs ? 'Skrýt konzoli' : 'Zobrazit konzoli'}</span>
            {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Terminal Output Log Drawer */}
      {showLogs && status.outputLog && status.outputLog.length > 0 && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-slate-200 shadow-inner space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              Playwright Console Output
            </span>
            <span className="font-mono text-slate-500">{status.outputLog.length} řádků</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
            {status.outputLog.map((line, idx) => {
              const isError = line.includes('❌') || line.includes('Error') || line.includes('failed');
              const isSuccess = line.includes('passed') || line.includes('ÚSPĚCH') || line.includes('✔');
              const isInfo = line.includes('▶') || line.includes('Spouštím');

              return (
                <div
                  key={idx}
                  className={`leading-relaxed whitespace-pre-wrap break-words ${
                    isError
                      ? 'text-rose-400 font-bold'
                      : isSuccess
                      ? 'text-emerald-400 font-semibold'
                      : isInfo
                      ? 'text-sky-300'
                      : 'text-slate-300'
                  }`}
                >
                  {line}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
