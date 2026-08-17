import React, { useState, useEffect } from 'react';
import {
  Scale,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Lock,
  Unlock,
  Clock,
  Settings,
  Database,
  Hash,
  ArrowRight,
  ChevronRight,
  Info,
  Gauge,
  FileText,
  Layers,
  Search,
  Sparkles,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface QuotaStatus {
  usedToday: number;
  maxDailyCalls: number;
  targetDailyCalls: number;
  remainingCalls: number;
  resetInMs: number;
  minIntervalMs: number;
  isExceeded: boolean;
}

interface LockInfo {
  isLocked: boolean;
  lockAcquiredAt: string | null;
  lockOwnerId: string | null;
}

interface PriorityActTarget {
  actCode: string;
  cislo: number;
  rok: number;
  title: string;
  lastSyncedAt?: string | null;
}

interface SchedulerStatus {
  isInitialized: boolean;
  isRunning: boolean;
  cronExpression: string;
  nextScheduledHoursUtc: string[];
  lastRunAt: string | null;
  lastRunResult: any | null;
  quota: QuotaStatus;
  lock: LockInfo | null;
  priorityActs: PriorityActTarget[];
  nextActToSync: PriorityActTarget | null;
}

interface SyncAudit {
  syncId: string;
  actCode: string;
  legalActId: string | null;
  legalActTitle?: string;
  syncType: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'UNCHANGED' | 'FAILED' | 'SKIPPED' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED';
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  httpStatus: number | null;
  apiCallsCount: number;
  recordsReceived: number;
  recordsNew: number;
  recordsChanged: number;
  recordsUnchanged: number;
  errorsCount: number;
  responseHash: string | null;
  errorMessage: string | null;
  initiatedBy: string;
  quotaUsageIn24h: number;
}

interface LawAct {
  id: string;
  actCode: string;
  actNumber: number;
  actYear: number;
  collection: string;
  title: string;
  shortTitle: string | null;
  actType: string;
  category: string;
  status: string;
  source: string;
  sourceUri: string | null;
  passedDate: string | null;
  promulgationDate: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  lastAmendedDate: string | null;
  lastSyncedAt: string | null;
  lastVerifiedAt: string | null;
  contentHash: string;
  etag: string | null;
  syncPriority: number;
  sections?: any[];
  versions?: any[];
}

export const EsbirkaAdminPanel: React.FC = () => {
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [audits, setAudits] = useState<SyncAudit[]>([]);
  const [laws, setLaws] = useState<LawAct[]>([]);
  const [selectedLaw, setSelectedLaw] = useState<LawAct | null>(null);
  const [selectedLawCode, setSelectedLawCode] = useState<string | null>(null);

  // Loading & error states
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [loadingLaws, setLoadingLaws] = useState(true);
  const [loadingLawDetails, setLoadingLawDetails] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<any | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Tab within the panel
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'laws' | 'versions' | 'audits' | 'stats'>('status');

  // Manual Sync fields
  const [manualActCode, setManualActCode] = useState<string>('89/2012');
  const [customCislo, setCustomCislo] = useState<string>('');
  const [customRok, setCustomRok] = useState<string>('');
  const [useCustomAct, setUseCustomAct] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/admin/esbirka/scheduler/status');
      const data = await res.json();
      if (data.success) {
        setSchedulerStatus(data.status);
      } else {
        setError(data.error || 'Nepodařilo se načíst stav plánovače.');
      }
    } catch (err: any) {
      setError(err?.message || 'Chyba při komunikaci se serverem.');
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchAudits = async () => {
    try {
      setLoadingAudits(true);
      const res = await fetch('/api/admin/esbirka/audits?limit=50');
      const data = await res.json();
      if (data.success) {
        setAudits(data.audits);
      }
    } catch (err) {
      console.error('Chyba při načítání auditů:', err);
    } finally {
      setLoadingAudits(false);
    }
  };

  const fetchLaws = async () => {
    try {
      setLoadingLaws(true);
      const res = await fetch('/api/admin/esbirka/laws');
      const data = await res.json();
      if (data.success) {
        setLaws(data.laws);
      }
    } catch (err) {
      console.error('Chyba při načítání zákonů:', err);
    } finally {
      setLoadingLaws(false);
    }
  };

  const fetchLawDetails = async (code: string) => {
    try {
      setLoadingLawDetails(true);
      const urlFriendlyCode = code.replace('/', '-');
      const res = await fetch(`/api/admin/esbirka/laws/${urlFriendlyCode}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLaw(data.law);
      }
    } catch (err) {
      console.error('Chyba při načítání detailů zákona:', err);
    } finally {
      setLoadingLawDetails(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAudits();
    fetchLaws();
  }, []);

  useEffect(() => {
    if (selectedLawCode) {
      fetchLawDetails(selectedLawCode);
    } else {
      setSelectedLaw(null);
    }
  }, [selectedLawCode]);

  const handleManualSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    setSyncSuccess(null);
    setSyncError(null);

    let payload: any = {};
    if (useCustomAct) {
      if (!customCislo || !customRok) {
        setSyncError('Prosím zadejte číslo a rok předpisu.');
        setSyncing(false);
        return;
      }
      payload = {
        cislo: Number(customCislo),
        rok: Number(customRok),
      };
    } else {
      payload = {
        actCode: manualActCode,
      };
    }

    try {
      const res = await fetch('/api/esbirka/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSyncSuccess(data.result);
        // Refresh data
        fetchStatus();
        fetchAudits();
        fetchLaws();
        if (selectedLawCode) {
          fetchLawDetails(selectedLawCode);
        }
      } else {
        setSyncError(data.error || 'Synchronizace selhala.');
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Chyba sítě při požadavku na synchronizaci.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> Úspěch</span>;
      case 'UNCHANGED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1 w-fit"><Info className="w-3.5 h-3.5" /> Beze změny</span>;
      case 'SKIPPED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1 w-fit"><Info className="w-3.5 h-3.5" /> Přeskočeno</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> Selhání</span>;
      case 'RATE_LIMITED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1 w-fit"><AlertTriangle className="w-3.5 h-3.5" /> Rate limit</span>;
      case 'QUOTA_EXCEEDED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 w-fit"><AlertTriangle className="w-3.5 h-3.5" /> Kvóta vyčerpána</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-50 text-slate-700 border border-slate-100 w-fit">{status}</span>;
    }
  };

  const getSyncStats = () => {
    if (audits.length === 0) return { successRate: 100, total: 0, success: 0, failed: 0, unchanged: 0, skipped: 0 };
    const total = audits.length;
    const success = audits.filter(a => a.status === 'SUCCESS').length;
    const unchanged = audits.filter(a => a.status === 'UNCHANGED').length;
    const skipped = audits.filter(a => a.status === 'SKIPPED').length;
    const failed = audits.filter(a => a.status === 'FAILED' || a.status === 'RATE_LIMITED' || a.status === 'QUOTA_EXCEEDED').length;
    const successRate = total > 0 ? Math.round(((success + unchanged + skipped) / total) * 100) : 100;

    return { successRate, total, success, failed, unchanged, skipped };
  };

  const stats = getSyncStats();

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-xs shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Administrace e-Sbírka / e-Legislativa
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Řídicí centrum pro bezpečnou a plně kontrolovanou synchronizaci rodinněprávní legislativy MV ČR.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchStatus();
                fetchAudits();
                fetchLaws();
                if (selectedLawCode) {
                  fetchLawDetails(selectedLawCode);
                }
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-700"
              title="Obnovit data"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
              Obnovit data
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-200 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-Tabs Nav */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => { setActiveSubTab('status'); setSelectedLawCode(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'status' && !selectedLawCode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Gauge className="w-4 h-4" />
          Stav a plánovač
        </button>
        <button
          onClick={() => { setActiveSubTab('laws'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'laws' || selectedLawCode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Zákony a znění {laws.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-black">{laws.length}</span>}
        </button>
        <button
          onClick={() => { setActiveSubTab('audits'); setSelectedLawCode(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'audits' && !selectedLawCode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Logy auditů {audits.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-black">{audits.length}</span>}
        </button>
        <button
          onClick={() => { setActiveSubTab('stats'); setSelectedLawCode(null); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'stats' && !selectedLawCode ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          Statistiky
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB */}

      {/* 1. STATUS & PLANNER */}
      {activeSubTab === 'status' && !selectedLawCode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Scheduler status card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" /> Stav automatizovaného plánovače (Cron)
                </h3>
                {loadingStatus ? (
                  <span className="text-xs text-slate-400">Načítání...</span>
                ) : schedulerStatus?.isRunning ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">Aktivní</span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Neaktivní</span>
                )}
              </div>

              {loadingStatus ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded-md w-2/3"></div>
                  <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
                  <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                </div>
              ) : schedulerStatus ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
                  <div className="space-y-3">
                    <p className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-500">Inicializace systému:</span>
                      <span className="font-bold text-slate-800">{schedulerStatus.isInitialized ? 'ANO' : 'NE'}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-500">Cron perioda (UTC):</span>
                      <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-800">{schedulerStatus.cronExpression}</span>
                    </p>
                    <p className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-500">Naplánované hodiny (UTC):</span>
                      <span className="font-bold text-slate-800">{schedulerStatus.nextScheduledHoursUtc.join(', ')}</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <p className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-500">Poslední kontrola (UTC):</span>
                      <span className="font-bold text-slate-800">
                        {schedulerStatus.lastRunAt ? new Date(schedulerStatus.lastRunAt).toLocaleString('cs-CZ', { timeZone: 'UTC' }) : 'Nikdy'}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-500">Poslední výsledek:</span>
                      <span>
                        {schedulerStatus.lastRunResult ? (
                          <strong className={schedulerStatus.lastRunResult.status === 'SUCCESS' || schedulerStatus.lastRunResult.status === 'UNCHANGED' ? 'text-emerald-600' : 'text-rose-600'}>
                            {schedulerStatus.lastRunResult.status}
                          </strong>
                        ) : 'Žádný'}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-slate-50 pb-2">
                      <span className="font-semibold text-slate-500">Další na řadě pro rotaci:</span>
                      <span className="font-bold text-slate-800">{schedulerStatus.nextActToSync?.actCode || 'Není definován'}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">Data o stavu plánovače nejsou k dispozici.</div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-500 space-y-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" /> Pravidla rotace předpisů (Priority Rotation List)
                </h4>
                <p className="leading-relaxed">
                  Abychom nevytěžovali API MV ČR a vyhověli smlouvě o užití, synchronizační engine běží v režimu rotace. Během každého ze 3 denních tiků vybere přesně jeden předpis, který byl nejdéle nesynchronizovaný, a u něj provede stažení a analýzu změn.
                </p>
              </div>
            </div>

            {/* Quota guard & locks status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Lock card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Lock className="w-4 h-4 text-indigo-500" /> Concurrency Lock Guard
                </h3>
                {loadingStatus ? (
                  <div className="h-10 bg-slate-50 rounded-lg animate-pulse"></div>
                ) : schedulerStatus?.lock?.isLocked ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center gap-3">
                      <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-amber-800 block">ZÁMEK AKTIVNÍ (ZAMKNUTO)</span>
                        <span className="text-[10px] text-amber-600 font-mono">Pouze 1 běžící synchronizace</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <p><span className="font-semibold">Vlastník:</span> <code className="bg-slate-50 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">{schedulerStatus.lock.lockOwnerId}</code></p>
                      <p><span className="font-semibold">Akvizice:</span> {schedulerStatus.lock.lockAcquiredAt ? new Date(schedulerStatus.lock.lockAcquiredAt).toLocaleTimeString('cs-CZ') : '-'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
                      <Unlock className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 block">ZÁMEK VOLNÝ</span>
                        <span className="text-[10px] text-emerald-600">Systém je připraven pro další běh</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Lock Guard spolehlivě zabraňuje souběhu více procesů a zaručuje, že nikdy neproběhnou 2 volání paralelně, což by porušilo limit 1 spojení.
                    </p>
                  </div>
                )}
              </div>

              {/* Quota guard card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Gauge className="w-4 h-4 text-emerald-500" /> Quota Guard (Denní limity)
                </h3>
                {loadingStatus ? (
                  <div className="h-10 bg-slate-50 rounded-lg animate-pulse"></div>
                ) : schedulerStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Využití kvóty:</span>
                      <span className="font-black font-mono text-slate-900">{schedulerStatus.quota.usedToday} / {schedulerStatus.quota.maxDailyCalls} volání</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          schedulerStatus.quota.isExceeded
                            ? 'bg-rose-600'
                            : schedulerStatus.quota.usedToday >= schedulerStatus.quota.targetDailyCalls
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min((schedulerStatus.quota.usedToday / schedulerStatus.quota.maxDailyCalls) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-1">
                      <p><span className="font-semibold">Bezpečný cíl:</span> 3 volání/den</p>
                      <p><span className="font-semibold">Absolutní strop:</span> 5 volání/den (MV ČR)</p>
                      <p><span className="font-semibold">Stav kvóty:</span> {schedulerStatus.quota.isExceeded ? <strong className="text-rose-600">PŘEKROČENO - BLOKOVÁNO</strong> : <strong className="text-emerald-600">V NORMĚ (OK)</strong>}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">Data o kvótě nejsou dostupná.</div>
                )}
              </div>

            </div>
          </div>

          {/* Manual sync controller */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-amber-500" /> Manuální synchronizace
              </h3>

              <form onSubmit={handleManualSync} className="space-y-4 text-xs">

                {/* Mode Selector */}
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useCustomAct}
                      onChange={() => setUseCustomAct(false)}
                      className="accent-slate-900"
                    />
                    Klíčový předpis
                  </label>
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      checked={useCustomAct}
                      onChange={() => setUseCustomAct(true)}
                      className="accent-slate-900"
                    />
                    Libovolný předpis
                  </label>
                </div>

                {!useCustomAct ? (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Vyberte klíčový zákon k rotaci:</label>
                    <select
                      value={manualActCode}
                      onChange={(e) => setManualActCode(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium bg-white text-slate-800"
                    >
                      {loadingStatus ? (
                        <option>Načítání...</option>
                      ) : schedulerStatus?.priorityActs ? (
                        schedulerStatus.priorityActs.map((act) => (
                          <option key={act.actCode} value={act.actCode}>
                            {act.actCode} - {act.title.length > 35 ? act.title.slice(0, 35) + '...' : act.title}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="89/2012">Zákon č. 89/2012 Sb. (OZ)</option>
                          <option value="292/2013">Zákon č. 292/2013 Sb. (ZŘS)</option>
                          <option value="99/1963">Zákon č. 99/1963 Sb. (OSŘ)</option>
                          <option value="359/1999">Zákon č. 359/1999 Sb. (zOSPOD)</option>
                        </>
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Číslo předpisu:</label>
                      <input
                        type="number"
                        placeholder="Např. 89"
                        value={customCislo}
                        onChange={(e) => setCustomCislo(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block">Rok vydání:</label>
                      <input
                        type="number"
                        placeholder="Např. 2012"
                        value={customRok}
                        onChange={(e) => setCustomRok(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* Quota warn status */}
                {schedulerStatus && schedulerStatus.quota.usedToday >= schedulerStatus.quota.targetDailyCalls && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2 text-[10px] text-amber-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Dnešní doporučená denní kvóta (3) byla dosažena. Pokračováním spotřebujete další z absolutního stropu 5/5.
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={syncing || (schedulerStatus?.quota?.isExceeded)}
                  className="w-full py-3 px-4 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Probíhá synchronizace...' : 'Spustit okamžitou synchronizaci'}
                </button>
              </form>

              {/* Status and output logs of last sync */}
              {syncSuccess && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Synchronizace úspěšně dokončena!</span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                    <p>• Status: <strong>{syncSuccess.status}</strong></p>
                    <p>• Zákony staženy: {syncSuccess.recordsReceived}</p>
                    <p>• Nové verze: {syncSuccess.recordsNew}</p>
                    <p>• Trvání: {syncSuccess.durationMs} ms</p>
                    <p>• Zbývá v kvótě: {syncSuccess.quotaUsageIn24h ? (5 - syncSuccess.quotaUsageIn24h) : '-'}</p>
                  </div>
                </div>
              )}

              {syncError && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Synchronizace selhala:</span>
                  </div>
                  <p className="text-[11px] text-rose-700 font-mono leading-relaxed bg-white/50 p-2 rounded-lg border border-rose-100">
                    {syncError}
                  </p>
                </div>
              )}
            </div>

            {/* Fail-Closed Guard banner */}
            <div className="bg-rose-50/50 p-4 rounded-3xl border border-rose-200/60 text-xs text-rose-950 space-y-2">
              <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> FAIL-CLOSED Bezpečnostní pojistka
              </h4>
              <p className="leading-relaxed text-[11px]">
                Systém je striktně uzavřený vůči neočekávaným stavům. Pokud dojde k selhání API MV ČR, vypršení limitů, narušení integrity nebo nevalidním datům, synchronizační engine okamžitě přeruší zápis a zruší probíhající transakci. Nikdy nebudou zapsána falešná (dummy) data.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* 2. LAWS AND TEXT VERSIONS */}
      {((activeSubTab === 'laws') || selectedLawCode) && (
        <div className="space-y-6">

          {selectedLawCode && selectedLaw ? (
            /* Detailed View of selected Law Act */
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">

              {/* Back Button and Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <button
                  onClick={() => setSelectedLawCode(null)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Zpět na seznam zákonů
                </button>
                <div className="text-[11px] font-mono text-slate-400">
                  ID: <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{selectedLaw.id}</span>
                </div>
              </div>

              {/* Law Header Info */}
              <div className="space-y-2">
                <div className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-extrabold uppercase">
                  {selectedLaw.category} / {selectedLaw.status}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {selectedLaw.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Zdroj: <strong className="text-slate-700">{selectedLaw.source} ({selectedLaw.collection})</strong> | Kód e-Sbírky: <strong className="text-slate-700 font-mono">{selectedLaw.actCode}</strong>
                </p>
              </div>

              {/* Grid metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Účinnost od</span>
                  <span className="font-bold text-slate-800">{selectedLaw.effectiveFrom ? new Date(selectedLaw.effectiveFrom).toLocaleDateString('cs-CZ') : 'Neznámé'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Poslední novelizace</span>
                  <span className="font-bold text-slate-800">{selectedLaw.lastAmendedDate ? new Date(selectedLaw.lastAmendedDate).toLocaleDateString('cs-CZ') : 'Neproběhla'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">Poslední synchronizace</span>
                  <span className="font-bold text-slate-800">{selectedLaw.lastSyncedAt ? new Date(selectedLaw.lastSyncedAt).toLocaleString('cs-CZ') : 'Nikdy'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px] tracking-wider mb-0.5">SHA-256 Hash obsahu</span>
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 block truncate text-[9px] text-slate-700" title={selectedLaw.contentHash}>
                    {selectedLaw.contentHash}
                  </span>
                </div>
              </div>

              {/* Subtabs for details (Versions vs Paragrafy) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. History of synchronized versions */}
                <div className="md:col-span-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Layers className="w-4 h-4 text-blue-500" /> Historie znění a novel
                  </h4>

                  {loadingLawDetails ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-10 bg-slate-100 rounded-lg"></div>
                      <div className="h-10 bg-slate-100 rounded-lg"></div>
                    </div>
                  ) : selectedLaw.versions && selectedLaw.versions.length > 0 ? (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                      {selectedLaw.versions.map((ver, idx) => (
                        <div key={ver.id || idx} className="bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded font-mono font-bold text-[9px]">
                              {ver.versionNumber}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ver.effectiveFrom).toLocaleDateString('cs-CZ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed font-medium bg-slate-50 p-2 rounded border border-slate-100">
                            {ver.changeSummary || 'Počáteční verze stažená z MV ČR.'}
                          </p>
                          <div className="text-[9px] text-slate-400 font-mono truncate">
                            SHA: {ver.contentHash.slice(0, 16)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">Žádné zaznamenané verze znění.</div>
                  )}
                </div>

                {/* 2. List of sections (paragrafy) */}
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-emerald-500" /> Synkronizované klíčové paragrafy</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold font-mono">
                      {selectedLaw.sections ? selectedLaw.sections.length : 0} paragrafů
                    </span>
                  </h4>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {selectedLaw.sections && selectedLaw.sections.length > 0 ? (
                      selectedLaw.sections.map((sec, idx) => (
                        <div key={sec.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs">
                          <div className="flex justify-between items-start gap-4">
                            <h5 className="font-bold text-slate-800 text-sm">
                              § {sec.sectionNumber} {sec.title ? `- ${sec.title}` : ''}
                            </h5>
                            {sec.isKeySection && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-black text-[9px] uppercase shrink-0">
                                Klíčový pro otce
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 leading-relaxed font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100/60 max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                            {sec.content}
                          </p>
                          {sec.practicalNote && (
                            <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                              <strong className="text-blue-950 uppercase text-[9px] block tracking-wider mb-0.5">Praktický komentář k opatrovnictví:</strong>
                              {sec.practicalNote}
                            </div>
                          )}
                          {sec.courtRelevance && (
                            <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-[11px] text-indigo-900 leading-relaxed">
                              <strong className="text-indigo-950 uppercase text-[9px] block tracking-wider mb-0.5">Soudní argumentace:</strong>
                              {sec.courtRelevance}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Nebyly nalezeny žádné synchronizované paragrafy pro tento předpis.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* List of Law Acts */
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="w-4 h-4 text-emerald-500" /> Lokální úložiště legislativy (PostgreSQL)
              </h3>

              {loadingLaws ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-12 bg-slate-100 rounded-lg"></div>
                  <div className="h-12 bg-slate-100 rounded-lg"></div>
                  <div className="h-12 bg-slate-100 rounded-lg"></div>
                </div>
              ) : laws.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Kód e-Sbírky</th>
                        <th className="py-3 px-4">Název předpisu</th>
                        <th className="py-3 px-4">Platnost / Účinnost</th>
                        <th className="py-3 px-4">Naposledy synchronizováno</th>
                        <th className="py-3 px-4 text-right">Akce</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {laws.map((law) => (
                        <tr key={law.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{law.actCode}</td>
                          <td className="py-3.5 px-4 font-medium leading-relaxed max-w-[280px]">
                            <div className="font-bold text-slate-900 truncate" title={law.title}>{law.title}</div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">{law.category}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold block">{law.status}</span>
                            <span className="text-[10px] text-slate-400">{law.effectiveFrom ? `Od ${new Date(law.effectiveFrom).toLocaleDateString('cs-CZ')}` : 'Bez termínu'}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-semibold block">{law.lastSyncedAt ? new Date(law.lastSyncedAt).toLocaleString('cs-CZ') : 'Nikdy'}</span>
                            <span className="text-[10px] text-slate-400 font-mono text-[9px] block">SHA: {law.contentHash.slice(0, 10)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLawCode(law.actCode)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              Zobrazit detaily a znění <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  V lokální databázi nejsou uloženy žádné právní předpisy. Proveďte synchronizaci.
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* 3. AUDIT LOGS */}
      {activeSubTab === 'audits' && !selectedLawCode && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" /> Auditní záznamy synchronizací
            </h3>
            <span className="text-[10px] font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
              Zobrazeno posledních {audits.length} operací
            </span>
          </div>

          {loadingAudits ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-lg"></div>
              <div className="h-12 bg-slate-100 rounded-lg"></div>
            </div>
          ) : audits.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Datum a čas</th>
                    <th className="py-3 px-4">Předpis / ID</th>
                    <th className="py-3 px-4">Typ / Spouštěč</th>
                    <th className="py-3 px-4">Výsledek API</th>
                    <th className="py-3 px-4">Trvání</th>
                    <th className="py-3 px-4">Změny</th>
                    <th className="py-3 px-4">Chybová zpráva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {audits.map((audit) => (
                    <tr key={audit.syncId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold block">{new Date(audit.startedAt).toLocaleString('cs-CZ')}</span>
                        <span className="text-[10px] text-slate-400 font-mono text-[9px]">{audit.syncId.slice(0, 8)}...</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span>{audit.actCode}</span>
                        {audit.legalActTitle && <span className="text-[10px] text-slate-400 font-semibold font-sans block max-w-[150px] truncate" title={audit.legalActTitle}>{audit.legalActTitle}</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold block text-[10px] uppercase">{audit.syncType}</span>
                        <span className="text-[10px] text-slate-400">Odp: {audit.initiatedBy}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(audit.status)}
                        {audit.httpStatus && <span className="text-[10px] text-slate-400 font-mono block mt-0.5">HTTP {audit.httpStatus}</span>}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono">{audit.durationMs ? `${audit.durationMs} ms` : '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {audit.status === 'SUCCESS' ? (
                          <div className="text-[11px] font-mono leading-relaxed text-slate-600">
                            <p className="text-emerald-600">Nové: {audit.recordsNew}</p>
                            <p className="text-blue-600">Změněné: {audit.recordsChanged}</p>
                            <p>Celkem: {audit.recordsReceived}</p>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 max-w-[200px] truncate font-mono text-[10px] text-rose-700 font-medium" title={audit.errorMessage || ''}>
                        {audit.errorMessage || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Dosud nebyly zaznamenány žádné synchronizační audity.
            </div>
          )}
        </div>
      )}

      {/* 4. STATISTICS DASHBOARD */}
      {activeSubTab === 'stats' && !selectedLawCode && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Gauge className="w-4 h-4 text-emerald-500" /> Analytické statistiky synchronizace
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Úspěšnost synchronizací</span>
                <span className={`text-3xl font-black ${stats.successRate >= 90 ? 'text-emerald-600' : stats.successRate >= 70 ? 'text-amber-500' : 'text-rose-600'}`}>{stats.successRate} %</span>
                <p className="text-[10px] text-slate-500 mt-2">Včetně úspěšných bez změn a přeskočení</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Celkem spuštění</span>
                <span className="text-3xl font-black text-slate-800">{stats.total}</span>
                <p className="text-[10px] text-slate-500 mt-2">Zaznamenáno v auditní tabulce</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Úspěšné novely / stažení</span>
                <span className="text-3xl font-black text-emerald-600">{stats.success}</span>
                <p className="text-[10px] text-slate-500 mt-2">Zapsáno nových/změněných verzí</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Selhání / Blokování</span>
                <span className="text-3xl font-black text-rose-600">{stats.failed}</span>
                <p className="text-[10px] text-slate-500 mt-2">Selhání sítě, rate limit nebo quota</p>
              </div>

            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-emerald-500" /> Analýza chyb a limitů (Failures & Quota Limits Summary)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-500" /> Blokování kvót a limitů</h4>
                <p>
                  Pokud se ve statistice vyskytují selhání typu <code className="bg-rose-50 px-1 py-0.5 rounded text-rose-700">RATE_LIMITED</code> nebo <code className="bg-rose-50 px-1 py-0.5 rounded text-rose-700">QUOTA_EXCEEDED</code>, znamená to, že se administrátor nebo automatické skripty pokusili spustit synchronizaci častěji než je povoleno:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                  <li><strong>Maximálně 5 volání za den</strong> (kalendářní den UTC).</li>
                  <li><strong>Minimální prodleva 1 sekunda</strong> mezi requesty.</li>
                  <li><strong>Maximálně 1 současné API připojení</strong>.</li>
                </ul>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Integrita lokálního úložiště</h4>
                <p>
                  Všechna klientská rozhraní a vyhledávací moduly pro veřejný portál čtou data <strong>výhradně z lokální databáze (PostgreSQL)</strong>.
                </p>
                <p className="text-slate-600 text-[11px]">
                  Tím je zaručeno, že běžný provoz portálu negeneruje žádné externí dotazy na ministerstvo, což zajišťuje maximální odezvu systému (rychlost) a eliminuje riziko vyčerpání kvót naší aplikace.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
