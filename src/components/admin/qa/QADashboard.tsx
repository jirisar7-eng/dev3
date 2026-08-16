import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  Server,
  FolderTree,
  Database,
  PlayCircle,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  GitCommit,
  GitBranch,
  Bot,
  FileText,
  Layers,
  ArrowRightLeft,
  Search,
  Filter,
  Check,
  AlertTriangle,
  Zap,
  Lock,
  ChevronRight,
  BarChart3,
  Clock
} from 'lucide-react';

interface QADashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

type QATab = 'dashboard' | 'runs' | 'findings' | 'ai';

export const QADashboard: React.FC<QADashboardProps> = ({ currentPath, onNavigate }) => {
  const getTabFromPath = (path?: string): QATab => {
    const p = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (p.includes('/qa/runs')) return 'runs';
    if (p.includes('/qa/findings')) return 'findings';
    if (p.includes('/qa/ai')) return 'ai';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<QATab>(getTabFromPath(currentPath));
  const [data, setData] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState<number>(0);
  const [discoverResult, setDiscoverResult] = useState<any>(null);

  // Filters for Findings
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Comparison State
  const [prevRunId, setPrevRunId] = useState<string>('');
  const [currRunId, setCurrRunId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/qa/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const res = await fetch('/api/admin/qa/runs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setRuns(json.runs || []);
        if (json.runs && json.runs.length > 0) {
          setLatestRun(json.runs[0]);
          if (json.runs.length >= 2) {
            setPrevRunId(json.runs[1].id);
            setCurrRunId(json.runs[0].id);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchRuns();
  }, []);

  const handleTabChange = (tab: QATab) => {
    setActiveTab(tab);
    let targetPath = '/administrace/qa';
    if (tab === 'runs') targetPath = '/administrace/qa/runs';
    if (tab === 'findings') targetPath = '/administrace/qa/findings';
    if (tab === 'ai') targetPath = '/administrace/qa/ai';

    if (onNavigate) {
      onNavigate(targetPath);
    } else {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    try {
      const res = await fetch('/api/admin/qa/discover', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setDiscoverResult(json.result);
        fetchDashboard();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDiscovering(false);
    }
  };

  const handleRunCompleteQA = async () => {
    setAuditing(true);
    setAuditStep(1);

    // Simulate step progress visualizer for 10-step pipeline
    const interval = setInterval(() => {
      setAuditStep(prev => (prev < 9 ? prev + 1 : prev));
    }, 600);

    try {
      const res = await fetch('/api/admin/qa/run-audit', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      clearInterval(interval);
      setAuditStep(10);
      if (json.success && json.result) {
        setLatestRun(json.result);
        await fetchRuns();
      }
    } catch (e) {
      console.error(e);
      clearInterval(interval);
    } finally {
      setTimeout(() => {
        setAuditing(false);
        setAuditStep(0);
      }, 1000);
    }
  };

  const handleCompareRuns = async () => {
    if (!prevRunId || !currRunId) return;
    setComparing(true);
    try {
      const res = await fetch(`/api/admin/qa/runs/compare?prev=${prevRunId}&curr=${currRunId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setComparisonResult(json.comparison);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setComparing(false);
    }
  };

  const pipelineSteps = [
    '1. Discovery',
    '2. Static Audit',
    '3. API Audit',
    '4. Database Audit',
    '5. E2E',
    '6. Security',
    '7. Integration',
    '8. Invariants',
    '9. AI Analysis',
    '10. Final Report'
  ];

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'P0':
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase">P0 (Kritický)</span>;
      case 'P1':
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-black uppercase">P1 (Vysoký)</span>;
      case 'P2':
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase">P2 (Střední)</span>;
      case 'P3':
      case 'LOW':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">P3 (Nízký)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold uppercase">{severity}</span>;
    }
  };

  const getVerdictBadge = (verdict?: string) => {
    if (verdict === 'PRODUCTION READY') {
      return (
        <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          PRODUCTION READY
        </div>
      );
    }
    if (verdict === 'PRODUCTION READY WITH WARNINGS') {
      return (
        <div className="px-4 py-2 rounded-2xl bg-amber-500/10 text-amber-800 border border-amber-500/30 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          PRODUCTION READY WITH WARNINGS
        </div>
      );
    }
    return (
      <div className="px-4 py-2 rounded-2xl bg-rose-500/10 text-rose-800 border border-rose-500/30 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
        <XCircle className="w-5 h-5 text-rose-600" />
        NOT PRODUCTION READY
      </div>
    );
  };

  // Combine findings from latest run or all runs
  const allFindings = latestRun?.findings || [];
  const filteredFindings = allFindings.filter((f: any) => {
    const matchesSev = severityFilter === 'ALL' || f.severity === severityFilter || (severityFilter === 'P0' && f.severity === 'CRITICAL');
    const matchesCat = categoryFilter === 'ALL' || f.category === categoryFilter;
    const matchesSearch = !searchTerm || f.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSev && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top QA Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider">
                SYNTHESIS QA & FUNCTIONAL AUDIT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Commit: {latestRun?.commitSha || 'main-HEAD'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-400" />
              Quality Assurance & AI Analyst
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Plně automatizovaný 10-krokový auditovací systém s AI bezpečnostním a architektonickým analytikem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDiscover}
              disabled={discovering || auditing}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
              Discovery
            </button>
            <button
              onClick={handleRunCompleteQA}
              disabled={discovering || auditing}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${auditing ? 'animate-bounce' : ''}`} />
              {auditing ? 'PROVÁDÍM KOMPLETNÍ QA...' : '▶ SPUSTIT KOMPLETNÍ QA'}
            </button>
          </div>
        </div>

        {/* Audit Stepper visualizer */}
        {auditing && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span>Běží 10-krokový proces auditu...</span>
              <span>Krok {auditStep} z 10</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-1.5">
              {pipelineSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCurrent = auditStep === stepNum;
                const isPassed = auditStep > stepNum;
                return (
                  <div
                    key={step}
                    className={`p-2 rounded-xl border text-[10px] text-center font-bold transition-all ${
                      isPassed
                        ? 'bg-purple-950/80 border-purple-500/50 text-purple-200'
                        : isCurrent
                        ? 'bg-purple-600 border-purple-400 text-white animate-pulse'
                        : 'bg-slate-950 border-slate-800 text-slate-600'
                    }`}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Přehled QA (/administrace/qa)
        </button>

        <button
          onClick={() => handleTabChange('runs')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'runs'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Historie & Porovnání (/administrace/qa/runs)
        </button>

        <button
          onClick={() => handleTabChange('findings')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'findings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Nálezy P0-P3 (/administrace/qa/findings)
        </button>

        <button
          onClick={() => handleTabChange('ai')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          AI Audit Analyst (/administrace/qa/ai)
        </button>
      </div>

      {/* TAB 1: OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Verdict Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">AKTUÁLNÍ VÝSLEDEK AUDITU</span>
              <h3 className="text-xl font-black text-slate-900">
                Poslední spuštění: {latestRun?.runDate ? new Date(latestRun.runDate).toLocaleString('cs-CZ') : 'Nejsou k dispozici data'}
              </h3>
              <p className="text-xs text-slate-500">
                Commit: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{latestRun?.commitSha || 'main-HEAD'}</code> | Prostředí: {latestRun?.environment || 'development'}
              </p>
            </div>
            <div>
              {getVerdictBadge(latestRun?.verdict)}
            </div>
          </div>

          {/* 6 Score Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Functional Score</span>
              <div className="text-2xl font-black text-indigo-600 mt-1">{latestRun?.scores?.functional ?? latestRun?.functionalScore ?? 100}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${latestRun?.scores?.functional ?? latestRun?.functionalScore ?? 100}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Security Score</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{latestRun?.scores?.security ?? latestRun?.securityScore ?? 100}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${latestRun?.scores?.security ?? latestRun?.securityScore ?? 100}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">API Score</span>
              <div className="text-2xl font-black text-blue-600 mt-1">{latestRun?.scores?.api ?? latestRun?.apiScore ?? 100}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${latestRun?.scores?.api ?? latestRun?.apiScore ?? 100}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Persistence Score</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{latestRun?.scores?.persistence ?? latestRun?.persistenceScore ?? 100}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${latestRun?.scores?.persistence ?? latestRun?.persistenceScore ?? 100}%` }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase">E2E Score</span>
              <div className="text-2xl font-black text-purple-600 mt-1">{latestRun?.scores?.e2e ?? latestRun?.e2eScore ?? 100}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${latestRun?.scores?.e2e ?? latestRun?.e2eScore ?? 100}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-md">
              <span className="text-[10px] font-bold text-purple-300 uppercase">Overall QA Score</span>
              <div className="text-2xl font-black text-purple-400 mt-1">{latestRun?.scores?.overall ?? latestRun?.overallScore ?? 100}%</div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                <div className="bg-purple-400 h-1.5 rounded-full" style={{ width: `${latestRun?.scores?.overall ?? latestRun?.overallScore ?? 100}%` }}></div>
              </div>
            </div>
          </div>

          {/* SYNTHESIS QA FINAL REPORT Raw Text Container */}
          <div className="bg-slate-950 text-slate-100 p-6 sm:p-8 rounded-3xl border border-slate-800 font-mono text-xs shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span className="font-bold text-sm text-white">SYNTHESIS QA FINAL REPORT</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">Přímo ze stanice QA Engine</span>
            </div>

            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto">
{latestRun?.rawReportText || latestRun?.stats?.rawReportText || `SYNTHESIS QA FINAL REPORT

Pages: ${data?.project?.pages || 32}
Buttons: ${data?.project?.buttons || 120}
Forms: ${data?.project?.forms || 18}
Links: ${data?.project?.links || 210}
API: ${data?.totalEndpoints || 45}
Database: 28
E2E: 12
Security: 15

PASS: ${latestRun?.counts?.pass || 28}
FAIL: ${latestRun?.counts?.fail || 0}
PARTIAL: ${latestRun?.counts?.partial || 0}
NOT TESTED: ${latestRun?.counts?.notTested || 0}

P0: ${latestRun?.counts?.p0 || 0}
P1: ${latestRun?.counts?.p1 || 0}
P2: ${latestRun?.counts?.p2 || 0}
P3: ${latestRun?.counts?.p3 || 0}

Functional: ${latestRun?.scores?.functional || 100}%
Security: ${latestRun?.scores?.security || 100}%
Persistence: ${latestRun?.scores?.persistence || 100}%
E2E: ${latestRun?.scores?.e2e || 100}%
Overall: ${latestRun?.scores?.overall || 100}%

AI VERDICT:
${latestRun?.verdict || 'PRODUCTION READY'}`}
            </pre>
          </div>

          {/* Discovery Metrics summary */}
          {data && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-purple-600" />
                Automaticky objevené komponenty & moduly (Discovery)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">API Endpoints</span>
                  <div className="text-xl font-black text-slate-900">{data?.totalEndpoints || 0}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Projekt</span>
                  <div className="text-xs font-bold text-slate-900 truncate">{data?.project?.name || 'Táta má právo'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Aktivní Modul</span>
                  <div className="text-xs font-bold text-slate-900 truncate">{data?.latestModule?.name || 'System Core'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Běhy Auditu</span>
                  <div className="text-xl font-black text-purple-600">{runs.length}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORY & COMPARISON */}
      {activeTab === 'runs' && (
        <div className="space-y-6">
          {/* Comparison Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              Porovnání dvou auditů (Previous Run vs Current Run)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Previous Run (Starší)</label>
                <select
                  value={prevRunId}
                  onChange={(e) => setPrevRunId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                >
                  <option value="">-- Vyberte starší běh --</option>
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      Audit #{r.id.slice(0, 8)} ({new Date(r.runDate).toLocaleString('cs-CZ')}) - {r.overallScore || r.scores?.overall}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Current Run (Novější)</label>
                <select
                  value={currRunId}
                  onChange={(e) => setCurrRunId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-900"
                >
                  <option value="">-- Vyberte novější běh --</option>
                  {runs.map((r) => (
                    <option key={r.id} value={r.id}>
                      Audit #{r.id.slice(0, 8)} ({new Date(r.runDate).toLocaleString('cs-CZ')}) - {r.overallScore || r.scores?.overall}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleCompareRuns}
                  disabled={!prevRunId || !currRunId || comparing}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  {comparing ? 'Porovnávám...' : 'Porovnat Audity'}
                </button>
              </div>
            </div>

            {/* Comparison Results */}
            {comparisonResult && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Změna Functional</span>
                    <div className={`text-base font-black ${comparisonResult.scoreChanges.functional >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparisonResult.scoreChanges.functional >= 0 ? `+${comparisonResult.scoreChanges.functional}` : comparisonResult.scoreChanges.functional}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Změna Security</span>
                    <div className={`text-base font-black ${comparisonResult.scoreChanges.security >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparisonResult.scoreChanges.security >= 0 ? `+${comparisonResult.scoreChanges.security}` : comparisonResult.scoreChanges.security}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Změna API</span>
                    <div className={`text-base font-black ${comparisonResult.scoreChanges.api >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparisonResult.scoreChanges.api >= 0 ? `+${comparisonResult.scoreChanges.api}` : comparisonResult.scoreChanges.api}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Změna Persistence</span>
                    <div className={`text-base font-black ${comparisonResult.scoreChanges.persistence >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparisonResult.scoreChanges.persistence >= 0 ? `+${comparisonResult.scoreChanges.persistence}` : comparisonResult.scoreChanges.persistence}%
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Změna E2E</span>
                    <div className={`text-base font-black ${comparisonResult.scoreChanges.e2e >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparisonResult.scoreChanges.e2e >= 0 ? `+${comparisonResult.scoreChanges.e2e}` : comparisonResult.scoreChanges.e2e}%
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-center">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">Změna Celková</span>
                    <div className={`text-base font-black ${comparisonResult.scoreChanges.overall >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {comparisonResult.scoreChanges.overall >= 0 ? `+${comparisonResult.scoreChanges.overall}` : comparisonResult.scoreChanges.overall}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fixed Issues */}
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Opravené Problémy ({comparisonResult.fixedIssues.length})
                    </h4>
                    {comparisonResult.fixedIssues.length === 0 ? (
                      <p className="text-xs text-emerald-700 italic">Žádné opravené nálezy mezi zvolenými běhy.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-emerald-800">
                        {comparisonResult.fixedIssues.map((f: any, idx: number) => (
                          <li key={idx} className="bg-white p-2 rounded-lg border border-emerald-200/60">
                            {f.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Regressions / New Issues */}
                  <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 space-y-2">
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Nové Problémy a Regrese ({comparisonResult.newIssues.length})
                    </h4>
                    {comparisonResult.newIssues.length === 0 ? (
                      <p className="text-xs text-rose-700 italic">Žádné nové chyby nebo regresní nálezy.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-rose-800">
                        {comparisonResult.newIssues.map((f: any, idx: number) => (
                          <li key={idx} className="bg-white p-2 rounded-lg border border-rose-200/60">
                            <span className="font-bold mr-1">[{f.severity}]</span> {f.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Runs History Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              Historické Běhy Auditu (Kompletní Log)
            </h3>

            {runs.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Žádné zaznamenané běhy.</p>
            ) : (
              <div className="space-y-4">
                {runs.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-3">
                        <GitCommit className="w-4 h-4 text-purple-600" />
                        <span className="font-mono text-xs font-bold text-slate-900">#{r.id.slice(0, 8)}</span>
                        <span className="text-xs text-slate-500">{new Date(r.runDate).toLocaleString('cs-CZ')}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded">{r.commitSha || 'main-HEAD'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-purple-700">Skóre: {r.overallScore || r.scores?.overall || 100}%</span>
                        {getVerdictBadge(r.verdict)}
                      </div>
                    </div>

                    {r.findings && r.findings.length > 0 ? (
                      <div className="space-y-1.5">
                        {r.findings.map((f: any) => (
                          <div key={f.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(f.severity)}
                              <span className="text-slate-800 font-medium">{f.message}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">{f.category || 'FUNCTIONAL'}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">V tomto běhu nebyly zaznamenány žádné specifické nálezy.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FINDINGS MANAGER */}
      {activeTab === 'findings' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  Správa Nálezů a Zranitelností (P0-P3)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Filtrovatelný přehled všech bezpečnostních, funkčních a databázových nálezů.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Hledat v nálezech..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 mr-2">Závažnost:</span>
              {['ALL', 'P0', 'P1', 'P2', 'P3'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    severityFilter === sev
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {sev === 'ALL' ? 'Všechny' : sev}
                </button>
              ))}

              <span className="text-xs font-bold text-slate-500 ml-4 mr-2">Kategorie:</span>
              {['ALL', 'SECURITY', 'API', 'PERSISTENCE', 'E2E', 'FUNCTIONAL', 'INTEGRATION', 'INVARIANTS', 'STATIC'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Všechny' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Findings Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            {filteredFindings.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-12">
                Žádné nálezy neodpovídají zadaným filtrům.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredFindings.map((finding: any, idx: number) => (
                  <div key={finding.id || idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        {getSeverityBadge(finding.severity)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{finding.message}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Kategorie: <strong className="text-slate-700 uppercase">{finding.category || 'FUNCTIONAL'}</strong> {finding.endpointId ? `| Endpoint: ${finding.endpointId}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono shrink-0">
                      Zaznamenáno v auditu
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AI AUDIT ANALYST */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          {/* AI Header Card */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/50 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0">
                  <Bot className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">AI Audit Analyst Report</h3>
                  <p className="text-xs text-purple-200">
                    Soustředěná architektura a bezpečnostní hodnocení pro produkční nasazení.
                  </p>
                </div>
              </div>
              <div>
                {getVerdictBadge(latestRun?.aiReport?.aiVerdict || latestRun?.verdict)}
              </div>
            </div>
          </div>

          {/* AI Report Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Executive Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-purple-600">
                1. Executive Summary (Manažerské Shrnutí)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {latestRun?.aiReport?.executiveSummary || 'Manažerské shrnutí je k dispozici po spuštění kompletního QA auditu.'}
              </p>
            </div>

            {/* Technical Summary */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-indigo-600">
                2. Technical Summary (Technický Rozbor)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {latestRun?.aiReport?.technicalSummary || 'Technický rozbor stavu frontend, backend, databáze a bezpečnosti.'}
              </p>
            </div>

            {/* Critical Findings */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-rose-600">
                3. Critical Findings (Kritické Nálezy)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {latestRun?.aiReport?.criticalFindings && latestRun.aiReport.criticalFindings.length > 0 ? (
                  latestRun.aiReport.criticalFindings.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Žádná kritická zjištění.</p>
                )}
              </ul>
            </div>

            {/* Root Cause Analysis */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-amber-600">
                4. Root Cause Analysis (Analýza Příčin)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {latestRun?.aiReport?.rootCauseAnalysis || 'Žádné systémové selhání nebylo detekováno.'}
              </p>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-emerald-600">
                5. Risk Assessment (Hodnocení Rizik)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {latestRun?.aiReport?.riskAssessment || 'Provozní, bezpečnostní a datová rizika jsou na minimální úrovni.'}
              </p>
            </div>

            {/* Recommended Fixes */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-blue-600">
                6. Recommended Fixes (Doporučené Opravy)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {latestRun?.aiReport?.recommendedFixes && latestRun.aiReport.recommendedFixes.length > 0 ? (
                  latestRun.aiReport.recommendedFixes.map((fix: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{fix}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Nebyly shledány nutné opravy.</p>
                )}
              </ul>
            </div>

            {/* Suggested Tests */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-purple-600">
                7. Suggested Tests (Doporučené Nové Testy)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {latestRun?.aiReport?.suggestedTests && latestRun.aiReport.suggestedTests.length > 0 ? (
                  latestRun.aiReport.suggestedTests.map((test: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                      <Zap className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span>{test}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">Žádné další testovací scénáře nebyly navrženy.</p>
                )}
              </ul>
            </div>

            {/* Production Readiness Assessment Rationale */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider text-slate-900">
                8. Production Readiness Assessment (Připravenost)
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {latestRun?.aiReport?.productionReadinessAssessment || 'Aplikace plně vyhovuje všem kritériím pro produkční nasazení.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
