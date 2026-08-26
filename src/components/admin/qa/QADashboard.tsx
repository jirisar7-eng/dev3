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
  Clock,
  Sparkles,
  Send,
  Terminal,
  CheckSquare,
  HelpCircle,
  Info
} from 'lucide-react';

interface QADashboardProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

type QATab = 'dashboard' | 'runs' | 'findings' | 'ai' | 'registry' | 'copilot';

export const QADashboard: React.FC<QADashboardProps> = ({ currentPath, onNavigate }) => {
  const getTabFromPath = (path?: string): QATab => {
    const p = path || (typeof window !== 'undefined' ? window.location.pathname : '');
    if (p.includes('/qa/runs')) return 'runs';
    if (p.includes('/qa/findings')) return 'findings';
    if (p.includes('/qa/ai')) return 'ai';
    if (p.includes('/qa/registry')) return 'registry';
    if (p.includes('/qa/copilot')) return 'copilot';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<QATab>(getTabFromPath(currentPath));
  const [data, setData] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [registryItems, setRegistryItems] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [isIncrementalAudit, setIsIncrementalAudit] = useState(false);
  const [auditStep, setAuditStep] = useState<number>(0);
  const [discoverResult, setDiscoverResult] = useState<any>(null);

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  // Git Delta & AI Telemetry State
  const [gitInfo, setGitInfo] = useState<{ currentCommitSha: string; previousCommitSha: string; changedFiles: string[] }>({
    currentCommitSha: 'main-HEAD',
    previousCommitSha: 'main-HEAD~1',
    changedFiles: []
  });
  const [aiStats, setAiStats] = useState<any>(null);
  const [runningAI, setRunningAI] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Admin Copilot State
  const [copilotMessage, setCopilotMessage] = useState<string>('');
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [copilotPlan, setCopilotPlan] = useState<any | null>(null);
  const [copilotExecuting, setCopilotExecuting] = useState<boolean>(false);
  const [copilotStepLogs, setCopilotStepLogs] = useState<any[]>([]);
  const [copilotResults, setCopilotResults] = useState<any | null>(null);

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

  const fetchAiStats = async () => {
    try {
      const res = await fetch('/api/admin/qa/ai-stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setAiStats(json.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRegistry = async () => {
    try {
      const res = await fetch('/api/admin/qa/registry', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      if (json.success) {
        setRegistryItems(json.items || []);
        if (json.gitInfo) {
          setGitInfo(json.gitInfo);
        }
      }
    } catch (e) {
      console.error(e);
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
    fetchRegistry();
    fetchAiStats();
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromPath(currentPath));
  }, [currentPath]);

  const handleRunAIAnalysis = async () => {
    setRunningAI(true);
    setAiMessage(null);
    try {
      const res = await fetch('/api/admin/qa/run-ai-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}`
        },
        body: JSON.stringify({ provider: 'auto' })
      });
      const json = await res.json();
      if (json.success && json.report) {
        setAiMessage(`AI Analýza dokončena! Provider: ${json.report.providerUsed || 'Grok'}`);
        await fetchRuns();
        await fetchAiStats();
      } else {
        setAiMessage(`AI Analýza: ${json.error || 'Správa byla vrácena bez výslovného selhání.'}`);
      }
    } catch (e: any) {
      setAiMessage(`Chyba AI Analýzy: ${e.message}`);
    } finally {
      setRunningAI(false);
    }
  };

  const handleTabChange = (tab: QATab) => {
    setActiveTab(tab);
    let targetPath = '/administrace/qa';
    if (tab === 'runs') targetPath = '/administrace/qa/runs';
    if (tab === 'findings') targetPath = '/administrace/qa/findings';
    if (tab === 'ai') targetPath = '/administrace/qa/ai';
    if (tab === 'registry') targetPath = '/administrace/qa/registry';
    if (tab === 'copilot') targetPath = '/administrace/qa/copilot';

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
        fetchRegistry();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDiscovering(false);
    }
  };

  const handleRunQA = async (incremental = false) => {
    setAuditing(true);
    setIsIncrementalAudit(incremental);
    setAuditStep(1);

    const interval = setInterval(() => {
      setAuditStep(prev => (prev < 9 ? prev + 1 : prev));
    }, 500);

    try {
      const endpoint = incremental ? '/api/admin/qa/run-incremental-audit' : '/api/admin/qa/run-audit';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}` }
      });
      const json = await res.json();
      clearInterval(interval);
      setAuditStep(10);
      if (json.success && json.result) {
        setLatestRun(json.result);
        await fetchRuns();
        await fetchRegistry();
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

  const handleAskCopilot = async (customQuery?: string) => {
    const query = customQuery || copilotMessage;
    if (!query.trim()) return;

    setCopilotLoading(true);
    setCopilotPlan(null);
    setCopilotResults(null);
    setCopilotStepLogs([]);
    
    try {
      const res = await fetch('/api/admin/qa/copilot/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}`
        },
        body: JSON.stringify({ message: query })
      });
      const json = await res.json();
      if (json.success && json.plan) {
        setCopilotPlan(json.plan);
        // If the entire plan doesn't require confirmation, auto-trigger execution of first step
        const firstStep = json.plan.steps[0];
        if (firstStep && !firstStep.requiresConfirmation) {
          executeStepByIndex(json.plan, 0);
        }
      } else {
        setCopilotStepLogs([{ action: 'ERROR', details: json.error || 'Nepodařilo se vygenerovat plán.' }]);
      }
    } catch (e: any) {
      console.error(e);
      setCopilotStepLogs([{ action: 'ERROR', details: e.message }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const executeStepByIndex = async (plan: any, index: number) => {
    if (!plan || index >= plan.steps.length) return;
    const step = plan.steps[index];
    
    setCopilotExecuting(true);
    
    // Update local plan step status to EXECUTING
    const updatedPlan = { ...plan };
    updatedPlan.steps = updatedPlan.steps.map((s: any, i: number) => 
      i === index ? { ...s, status: 'EXECUTING' } : s
    );
    setCopilotPlan(updatedPlan);

    try {
      const res = await fetch('/api/admin/qa/copilot/execute-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tatovacesta_auth_token')}`
        },
        body: JSON.stringify({ stepType: step.type, payload: step.payload })
      });
      const json = await res.json();
      
      const nextPlan = { ...updatedPlan };
      if (json.success) {
        nextPlan.steps = nextPlan.steps.map((s: any, i: number) => 
          i === index ? { ...s, status: 'COMPLETED' } : s
        );
        
        if (json.auditLog) {
          setCopilotStepLogs(prev => [...prev, json.auditLog]);
        }
        
        // If it was an AI analysis step, store results
        if (json.result && (json.result.aiVerdict || json.result.aiCouncil)) {
          setCopilotResults(json.result);
        }

        // Refresh main data in background
        await fetchRuns();
        await fetchAiStats();

        // Check if there is a next step
        const nextIdx = index + 1;
        if (nextIdx < nextPlan.steps.length) {
          const nextStep = nextPlan.steps[nextIdx];
          setCopilotPlan(nextPlan);
          if (!nextStep.requiresConfirmation) {
            await executeStepByIndex(nextPlan, nextIdx);
          }
        } else {
          nextPlan.status = 'COMPLETED';
          setCopilotPlan(nextPlan);
          setCopilotExecuting(false);
        }
      } else {
        nextPlan.steps = nextPlan.steps.map((s: any, i: number) => 
          i === index ? { ...s, status: 'FAILED' } : s
        );
        nextPlan.status = 'FAILED';
        setCopilotPlan(nextPlan);
        setCopilotExecuting(false);
        if (json.auditLog) {
          setCopilotStepLogs(prev => [...prev, json.auditLog]);
        }
      }
    } catch (e: any) {
      console.error(e);
      const nextPlan = { ...updatedPlan };
      nextPlan.steps = nextPlan.steps.map((s: any, i: number) => 
        i === index ? { ...s, status: 'FAILED' } : s
      );
      nextPlan.status = 'FAILED';
      setCopilotPlan(nextPlan);
      setCopilotExecuting(false);
      setCopilotStepLogs(prev => [...prev, { id: 'err', action: 'SYSTEM_ERROR', details: e.message, createdAt: new Date().toISOString() }]);
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
              disabled={discovering || auditing || runningAI}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${discovering ? 'animate-spin' : ''}`} />
              Discovery
            </button>
            <button
              onClick={() => handleRunQA(true)}
              disabled={discovering || auditing || runningAI}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${auditing && isIncrementalAudit ? 'animate-bounce' : ''}`} />
              {auditing && isIncrementalAudit ? 'PROVÁDÍM INCREMENTAL QA...' : '▶ RUN INCREMENTAL QA'}
            </button>
            <button
              onClick={() => handleRunQA(false)}
              disabled={discovering || auditing || runningAI}
              className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 disabled:opacity-50 cursor-pointer"
            >
              <PlayCircle className={`w-4 h-4 ${auditing && !isIncrementalAudit ? 'animate-bounce' : ''}`} />
              {auditing && !isIncrementalAudit ? 'PROVÁDÍM FULL QA...' : '▶ RUN FULL QA'}
            </button>
            <button
              onClick={handleRunAIAnalysis}
              disabled={discovering || auditing || runningAI}
              className="px-5 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-pink-600/30 disabled:opacity-50 cursor-pointer"
            >
              <Bot className={`w-4 h-4 ${runningAI ? 'animate-spin' : ''}`} />
              {runningAI ? 'PROVÁDÍM AI ANALÝZU...' : '▶ RUN AI ANALYSIS'}
            </button>
          </div>
        </div>

        {/* Audit Stepper visualizer */}
        {auditing && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span>Běží {isIncrementalAudit ? 'Inkrementální' : 'Kompletní'} 10-krokový proces auditu...</span>
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
          onClick={() => handleTabChange('registry')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'registry'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          QA Registr & Závislosti ({registryItems.length})
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

        <button
          onClick={() => handleTabChange('copilot')}
          className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'copilot'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          Synthesis Admin Copilot (/administrace/qa/copilot)
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
                Commit: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{gitInfo?.currentCommitSha || latestRun?.commitSha || 'main-HEAD'}</code> (Previous: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{gitInfo?.previousCommitSha || 'main-HEAD~1'}</code>) | Prostředí: {latestRun?.environment || 'development'}
              </p>
            </div>
            <div>
              {getVerdictBadge(latestRun?.verdict)}
            </div>
          </div>

          {/* AI Action Notification Banner */}
          {aiMessage && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{aiMessage}</span>
              </div>
              <button onClick={() => setAiMessage(null)} className="text-purple-500 hover:text-purple-800 font-black cursor-pointer">✕</button>
            </div>
          )}

          {/* 10 Key Incremental & AI Telemetry Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                Inkrementální QA Delta & AI Telemetrie (Phase 4.3)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {gitInfo.changedFiles.length} Změněných souborů
              </span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Last Commit</span>
                <div className="text-xs font-black text-slate-900 font-mono mt-1">{gitInfo.currentCommitSha}</div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="text-[9px] font-bold text-slate-500 uppercase">Previous Commit</span>
                <div className="text-xs font-black text-slate-600 font-mono mt-1">{gitInfo.previousCommitSha}</div>
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[9px] font-bold text-amber-800 uppercase">Changed Files</span>
                <div className="text-lg font-black text-amber-700 mt-0.5">{gitInfo.changedFiles.length}</div>
              </div>

              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center">
                <span className="text-[9px] font-bold text-purple-800 uppercase">New Components</span>
                <div className="text-lg font-black text-purple-700 mt-0.5">
                  {registryItems.filter(i => i.status === 'DISCOVERED' || i.reason === 'NEW').length}
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 text-center">
                <span className="text-[9px] font-bold text-orange-800 uppercase">Invalidated</span>
                <div className="text-lg font-black text-orange-700 mt-0.5">
                  {registryItems.filter(i => i.status === 'INVALIDATED').length}
                </div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[9px] font-bold text-emerald-800 uppercase">Verified</span>
                <div className="text-lg font-black text-emerald-700 mt-0.5">
                  {registryItems.filter(i => i.status === 'VERIFIED').length}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
                <span className="text-[9px] font-bold text-blue-800 uppercase">Skipped</span>
                <div className="text-lg font-black text-blue-700 mt-0.5">
                  {registryItems.filter(i => i.status === 'SKIPPED').length}
                </div>
              </div>

              <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-center">
                <span className="text-[9px] font-bold text-indigo-800 uppercase">AI Calls</span>
                <div className="text-lg font-black text-indigo-700 mt-0.5">{aiStats?.totalCalls || 0}</div>
              </div>

              <div className="bg-teal-50 p-3 rounded-2xl border border-teal-200 text-center">
                <span className="text-[9px] font-bold text-teal-800 uppercase">Cache Hits</span>
                <div className="text-lg font-black text-teal-700 mt-0.5">{aiStats?.cacheHits || 0}</div>
              </div>

              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center">
                <span className="text-[9px] font-bold text-rose-800 uppercase">AI Usage</span>
                <div className="text-[11px] font-black text-rose-700 mt-1 font-mono truncate">
                  ${(aiStats?.estimatedCostUsd || 0).toFixed(4)}
                </div>
              </div>
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

DISCOVERED: ${latestRun?.counts?.discovered || 113}
TESTED: ${latestRun?.counts?.tested || 16}
PASS: ${latestRun?.counts?.pass || 15}
FAIL: ${latestRun?.counts?.fail || 0}
PARTIAL: ${latestRun?.counts?.partial || 1}
NOT TESTED: ${latestRun?.counts?.notTested || 97}
VERIFIED/SKIPPED: ${latestRun?.counts?.verifiedSkipped || 0}

P0: ${latestRun?.counts?.p0 || 0}
P1: ${latestRun?.counts?.p1 || 0}
P2: ${latestRun?.counts?.p2 || 0}
P3: ${latestRun?.counts?.p3 || 0}

Coverage: ${latestRun?.metrics?.coveragePercent || 13}%
Tested Coverage: ${latestRun?.metrics?.testedCoveragePercent || 14}%
Verified Coverage: ${latestRun?.metrics?.verifiedCoveragePercent || 13}%

Functional: ${latestRun?.scores?.functional || 14}%
Security: ${latestRun?.scores?.security || 100}%
Persistence: ${latestRun?.scores?.persistence || 100}%
E2E: ${latestRun?.scores?.e2e || 100}%
Overall: ${latestRun?.scores?.overall || 14}%

AI VERDICT:
${latestRun?.verdict || 'NOT PRODUCTION READY'}

PRODUCTION READINESS GATE EXPLANATION:
"PRODUCTION READY" smí vzniknout pouze tehdy, pokud všechny povinné QA prvky mají aktuální VERIFIED/PASS stav.`}
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

      {/* TAB: REGISTRY & DEPENDENCY GRAPH */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Persistentní QA Registr & Graf Závislostí (PostgreSQL)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sledování stavů prvků: VERIFIED, CHANGED, INVALIDATED, FAILED, SKIPPED, DISCOVERED.
                </p>
              </div>
              <button
                onClick={fetchRegistry}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Obnovit Registr
              </button>
            </div>

            {/* Status counts summary */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 border-t border-slate-100">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">VERIFIED</span>
                <div className="text-xl font-black text-emerald-700">
                  {registryItems.filter(i => i.status === 'VERIFIED').length}
                </div>
              </div>
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase">CHANGED</span>
                <div className="text-xl font-black text-amber-700">
                  {registryItems.filter(i => i.status === 'CHANGED').length}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 text-center">
                <span className="text-[10px] font-bold text-orange-800 uppercase">INVALIDATED</span>
                <div className="text-xl font-black text-orange-700">
                  {registryItems.filter(i => i.status === 'INVALIDATED').length}
                </div>
              </div>
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-center">
                <span className="text-[10px] font-bold text-rose-800 uppercase">FAILED</span>
                <div className="text-xl font-black text-rose-700">
                  {registryItems.filter(i => i.status === 'FAILED').length}
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-800 uppercase">SKIPPED</span>
                <div className="text-xl font-black text-blue-700">
                  {registryItems.filter(i => i.status === 'SKIPPED').length}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center">
                <span className="text-[10px] font-bold text-purple-800 uppercase">DISCOVERED</span>
                <div className="text-xl font-black text-purple-700">
                  {registryItems.filter(i => i.status === 'DISCOVERED').length}
                </div>
              </div>
            </div>
          </div>

          {/* Registry Items Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Registrované Prvky ({registryItems.length})
            </h4>

            {registryItems.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">
                Registr je prázdný. Klikněte na &quot;⚡ SPUSTIT INCREMENTAL QA&quot; nebo &quot;▶ SPUSTIT FULL QA&quot; pro inicializaci.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 bg-slate-50">
                      <th className="p-3 rounded-l-xl">Typ</th>
                      <th className="p-3">Klíč Prvku</th>
                      <th className="p-3">Stav Auditu</th>
                      <th className="p-3">Obsahový Hash SHA-256</th>
                      <th className="p-3">Závislosti</th>
                      <th className="p-3 rounded-r-xl">Poslední Ověření</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registryItems.map((item) => (
                      <tr key={item.id || item.key} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-[11px] font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                            {item.type}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-slate-900 font-mono">
                          {item.key}
                        </td>
                        <td className="p-3">
                          {item.status === 'VERIFIED' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              ✓ VERIFIED
                            </span>
                          )}
                          {item.status === 'CHANGED' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              ⚡ CHANGED
                            </span>
                          )}
                          {item.status === 'INVALIDATED' && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 text-[10px] font-bold">
                              ⚠️ INVALIDATED
                            </span>
                          )}
                          {item.status === 'FAILED' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold">
                              ✕ FAILED
                            </span>
                          )}
                          {item.status === 'SKIPPED' && (
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold">
                              ⏭ SKIPPED
                            </span>
                          )}
                          {item.status === 'DISCOVERED' && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold">
                              🔍 DISCOVERED
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">
                          {item.contentHash ? `${item.contentHash.slice(0, 16)}...` : '-'}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-600">
                          {item.dependencies?.length || 0} vnějších vazeb
                        </td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {item.lastVerifiedAt ? new Date(item.lastVerifiedAt).toLocaleString('cs-CZ') : 'Zatím neověřeno'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
              <div className="space-y-3">
                {filteredFindings.map((finding: any, idx: number) => {
                  const matched = latestRun?.aiReport?.aiCouncil?.agreedFindings?.find((af: any) =>
                    finding.message.toLowerCase().includes(af.finding.toLowerCase()) ||
                    af.finding.toLowerCase().includes(finding.message.toLowerCase())
                  );
                  const fId = finding.id || `f-${idx}`;
                  const isExpanded = !!expandedFindings[fId];
                  const toggleExpanded = () => {
                    setExpandedFindings(prev => ({ ...prev, [fId]: !prev[fId] }));
                  };

                  const score = matched?.evidenceScore ?? 0;
                  const getScoreBadgeColor = (s: number) => {
                    if (s >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
                    if (s >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
                    return 'text-rose-700 bg-rose-50 border-rose-200';
                  };

                  return (
                    <div key={fId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 mt-0.5">
                            {getSeverityBadge(finding.severity)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 leading-snug">{finding.message}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span>Kategorie: <strong className="text-slate-700 uppercase">{finding.category || 'FUNCTIONAL'}</strong></span>
                              {finding.endpointId && <span className="text-slate-300">|</span>}
                              {finding.endpointId && <span>Endpoint: <strong className="text-slate-700">{finding.endpointId}</strong></span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                          {matched ? (
                            <>
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getScoreBadgeColor(score)}`}>
                                Evidence: {score}/100
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                matched.consensusState === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                matched.consensusState === 'LIKELY' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                matched.consensusState === 'INSUFFICIENT_EVIDENCE' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                matched.consensusState === 'DISAGREEMENT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-slate-100 text-slate-800 border border-slate-200'
                              }`}>
                                {matched.consensusState ?? 'UNKNOWN'}
                              </span>
                              <button
                                onClick={toggleExpanded}
                                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? 'Skrýt důkazy' : 'Zobrazit důkazy'}
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Deterministický QA nález
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expandable Evidence Details Panel */}
                      {matched && isExpanded && (
                        <div className="mt-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4 text-xs">
                          {/* Top row showing validation status overview */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-[11px] leading-tight">
                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Verdikt Gemini</span>
                              <div className="text-slate-900 mt-1 font-mono font-bold">
                                {matched.geminiVerdict ?? 'N/A'} ({(matched.geminiConfidence ?? 0 * 100).toFixed(0)}%)
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Verdikt Grok</span>
                              <div className="text-slate-900 mt-1 font-mono font-bold">
                                {matched.grokVerdict ?? 'N/A'} ({(matched.grokConfidence ?? 0 * 100).toFixed(0)}%)
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Konsenzus rady</span>
                              <div className="text-indigo-600 mt-1 font-mono font-bold">
                                {matched.consensusState ?? 'N/A'}
                              </div>
                            </div>
                            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                              <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Deterministický QA</span>
                              <div className="text-slate-900 mt-1 font-mono font-bold">
                                {matched.deterministicVerdict ?? 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* Used Evidence Section */}
                          <div className="space-y-2">
                            <span className="text-slate-900 font-black text-xs block">Použité důkazy (Evidence Bundle):</span>
                            
                            {/* Source Files list */}
                            {matched.evidenceBundle?.sourceFiles && matched.evidenceBundle.sourceFiles.length > 0 && (
                              <div className="space-y-2.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Relevantní zdrojové soubory</span>
                                {matched.evidenceBundle.sourceFiles.map((sf: any, sfIdx: number) => (
                                  <div key={sfIdx} className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50">
                                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-150 flex items-center justify-between font-mono text-[10px] text-slate-700">
                                      <span className="truncate">{sf.filePath}</span>
                                      <span className="shrink-0 text-slate-400">hash: {sf.hash?.slice(0, 8)}</span>
                                    </div>
                                    <pre className="p-3 text-[10px] font-mono text-slate-800 overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin">
                                      {sf.content}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Stack Trace */}
                            {matched.evidenceBundle?.stackTrace && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Stack Trace / Chybový výstup</span>
                                <pre className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-mono text-rose-800 overflow-x-auto">
                                  {matched.evidenceBundle.stackTrace}
                                </pre>
                              </div>
                            )}

                            {/* API Request/Response */}
                            {matched.evidenceBundle?.apiRequestResponse && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">API Request / Response payload</span>
                                <pre className="p-3 bg-slate-900 rounded-xl text-[10px] font-mono text-slate-200 overflow-x-auto">
                                  {matched.evidenceBundle.apiRequestResponse}
                                </pre>
                              </div>
                            )}

                            {/* Verification Cache Status */}
                            {matched.evidenceBundle?.validationStatus && (
                              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-x-4 text-[10px] text-slate-500 font-medium">
                                <div>Dostatek důkazů: <strong className="text-slate-800">{matched.evidenceBundle.validationStatus.hasSufficientEvidence ? 'ANO' : 'NE'}</strong></div>
                                <div>Dříve ověřeno: <strong className="text-slate-800">{matched.evidenceBundle.validationStatus.wasPreviouslyVerified ? 'ANO' : 'NE'}</strong></div>
                                {matched.evidenceBundle.validationStatus.wasPreviouslyVerified && (
                                  <div>Změněno od ověření: <strong className="text-slate-800">{matched.evidenceBundle.validationStatus.hasChangedSinceVerification ? 'ANO' : 'NE'}</strong></div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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

          {/* AI Telemetry & Quota Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-600" />
                AI Telemetrie, Kešování & Ochrana Kvót (Grok / Gemini)
              </h4>
              <button
                onClick={handleRunAIAnalysis}
                disabled={runningAI}
                className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-pink-600/20 disabled:opacity-50 cursor-pointer self-start"
              >
                <Bot className={`w-3.5 h-3.5 ${runningAI ? 'animate-spin' : ''}`} />
                {runningAI ? 'ANALYZUJI PROJEKT...' : '▶ SPUSTIT AI ANALÝZU'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Provider / Model</span>
                <div className="text-xs font-black text-purple-700 mt-1 uppercase">
                  {latestRun?.aiReport?.providerUsed || 'Gemini (gemini-3.6-flash)'}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase">AI Calls</span>
                <div className="text-xl font-black text-slate-900 mt-0.5">{aiStats?.totalCalls || 0}</div>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Cache Hits</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{aiStats?.cacheHits || 0}</div>
              </div>

              <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-200 text-center">
                <span className="text-[10px] font-bold text-indigo-800 uppercase">Token Usage</span>
                <div className="text-xs font-black text-indigo-700 mt-1 font-mono">
                  {aiStats?.tokenUsage?.total || 0} tok
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-800 uppercase">Odhad Ceny</span>
                <div className="text-xs font-black text-amber-800 mt-1 font-mono">
                  ${(aiStats?.estimatedCostUsd || 0).toFixed(4)} USD
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-800 uppercase">Stav Kvóty</span>
                <div className="text-xs font-black mt-1 font-mono">
                  {aiStats?.isQuotaExceeded ? (
                    <span className="text-rose-600 font-bold">⚠️ EXCEEDED</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">✓ OK ({aiStats?.quotaLimit || 100})</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Evidence Validation Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Evidence Validation (Doložení důkazů AI Rady)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Podrobný přehled deterministických podkladů, které AI Rada (Gemini & Grok) nezávisle analyzovala.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {latestRun?.aiReport?.aiCouncil?.agreedFindings && latestRun.aiReport.aiCouncil.agreedFindings.length > 0 ? (
                latestRun.aiReport.aiCouncil.agreedFindings.map((finding: any, idx: number) => {
                  const score = finding.evidenceScore ?? 0;
                  const getScoreColor = (s: number) => {
                    if (s >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
                    if (s >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
                    return 'text-rose-700 bg-rose-50 border-rose-200';
                  };
                  return (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getScoreColor(score)}`}>
                            Evidence: {score}/100
                          </span>
                          <span className="text-xs font-bold text-slate-900">{finding.finding}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          finding.consensusState === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          finding.consensusState === 'LIKELY' ? 'bg-blue-100 text-blue-800' :
                          finding.consensusState === 'INSUFFICIENT_EVIDENCE' ? 'bg-rose-100 text-rose-800' :
                          finding.consensusState === 'DISAGREEMENT' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {finding.consensusState ?? 'UNKNOWN'}
                        </span>
                      </div>

                      {/* Evidence Summary Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-[11px]">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Použité důkazy</span>
                          <span className="text-slate-800 mt-1 font-mono block truncate" title={finding.evidenceBundle?.findingMessage || finding.evidence}>
                            {finding.evidenceBundle?.sourceFiles?.length ? `${finding.evidenceBundle.sourceFiles.length} soub.` : '0 soub.'}
                            {finding.evidenceBundle?.stackTrace ? ' + Stack' : ''}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Gemini Verdikt</span>
                          <span className="text-slate-800 mt-1 font-mono block">
                            {finding.geminiVerdict ?? 'N/A'} ({(finding.geminiConfidence ?? 0 * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Grok Verdikt</span>
                          <span className="text-slate-800 mt-1 font-mono block">
                            {finding.grokVerdict ?? 'N/A'} ({(finding.grokConfidence ?? 0 * 100).toFixed(0)}%)
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
                          <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Ověřený QA stav</span>
                          <span className="text-slate-800 mt-1 font-mono block truncate">
                            {finding.evidenceBundle?.validationStatus?.wasPreviouslyVerified ? 'Dříve VERIFIED' : 'Nové zjištění'}
                          </span>
                        </div>
                      </div>

                      {/* Evidence Details Collapsible Block (Default Expanded for complete overview) */}
                      {finding.evidenceBundle && (
                        <div className="p-3.5 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] space-y-3 overflow-auto max-h-64 scrollbar-thin">
                          <div className="text-slate-400 border-b border-slate-800 pb-1 font-bold flex justify-between items-center">
                            <span>SPOUSTĚCÍ KONTEXT & DETERMINISTICKÁ DATA:</span>
                            <span className="text-slate-500">score: {finding.evidenceBundle.validationStatus?.evidenceScore}/100</span>
                          </div>
                          
                          {finding.evidenceBundle.stackTrace && (
                            <div>
                              <span className="text-rose-400 font-bold block mb-1">DETEKOVANÁ CHYBA (STACK TRACE):</span>
                              <pre className="p-2 bg-slate-950 rounded text-rose-300 overflow-x-auto whitespace-pre">
                                {finding.evidenceBundle.stackTrace}
                              </pre>
                            </div>
                          )}

                          {finding.evidenceBundle.apiRequestResponse && (
                            <div>
                              <span className="text-indigo-400 font-bold block mb-1">API REQUEST & RESPONSE CONTRACT:</span>
                              <pre className="p-2 bg-slate-950 rounded text-indigo-300 overflow-x-auto whitespace-pre">
                                {finding.evidenceBundle.apiRequestResponse}
                              </pre>
                            </div>
                          )}

                          {finding.evidenceBundle.sourceFiles?.map((sf: any, sfIdx: number) => (
                            <div key={sfIdx} className="space-y-1">
                              <span className="text-emerald-400 font-bold block">SOUBOR: {sf.filePath}</span>
                              <pre className="p-2 bg-slate-950 rounded text-slate-300 overflow-x-auto max-h-32 scrollbar-thin">
                                {sf.content}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-6 bg-slate-50 border border-slate-150 rounded-2xl">
                  <p className="text-xs text-slate-500 italic">Žádné doložené nálezy v posledním běhu auditu.</p>
                </div>
              )}
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

      {/* TAB 5: SYNTHESIS ADMIN COPILOT */}
      {activeTab === 'copilot' && (
        <div className="space-y-6">
          {/* Hero Header Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Synthesis Admin Copilot</h3>
                  <p className="text-xs text-slate-300">
                    Chytrý řídicí asistent pro nezávislou validaci, analýzu rizik a bezpečné provádění plánů.
                  </p>
                </div>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/30 text-indigo-200">
                Authorized Admin RBAC Active
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Console: User request and plan execution */}
            <div className="lg:col-span-5 space-y-6">
              {/* Interactive Query Box */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  Konzole příkazů Copilota
                </h4>
                
                <div className="space-y-2">
                  <textarea
                    value={copilotMessage}
                    onChange={(e) => setCopilotMessage(e.target.value)}
                    placeholder="Např.: Ověř, zda je oprava skutečně funkční..."
                    disabled={copilotLoading || copilotExecuting}
                    className="w-full h-24 p-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:bg-white resize-none transition-all"
                  />
                  
                  <button
                    onClick={() => handleAskCopilot()}
                    disabled={copilotLoading || copilotExecuting || !copilotMessage.trim()}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    {copilotLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    VYTVOŘIT BEZPEČNÝ PLÁN
                  </button>
                </div>

                {/* Preset Scenarios */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rychlé scénáře z administrativní kuchařky:</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      { query: 'Analyzuj tento problém.', icon: '🔍' },
                      { query: 'Proč tento test selhal?', icon: '❓' },
                      { query: 'Ať to zkontroluje Gemini i Grok.', icon: '🤖' },
                      { query: 'Najdi největší riziko.', icon: '⚠️' },
                      { query: 'Navrhni opravu.', icon: '🔧' },
                      { query: 'Ověř, zda je oprava skutečně funkční.', icon: '🛡️' }
                    ].map((scenario, idx) => (
                      <button
                        key={idx}
                        disabled={copilotLoading || copilotExecuting}
                        onClick={() => {
                          setCopilotMessage(scenario.query);
                          handleAskCopilot(scenario.query);
                        }}
                        className="text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <span className="text-sm">{scenario.icon}</span>
                        <span>{scenario.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safe Plan Stepper */}
              {copilotPlan && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{copilotPlan.queryType}</span>
                    <h4 className="text-sm font-black text-slate-900 mt-1">{copilotPlan.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{copilotPlan.explanation}</p>
                  </div>

                  <div className="space-y-4">
                    {copilotPlan.steps.map((step: any, idx: number) => {
                      const isPending = step.status === 'PENDING';
                      const isExecuting = step.status === 'EXECUTING';
                      const isCompleted = step.status === 'COMPLETED';
                      const isFailed = step.status === 'FAILED';

                      return (
                        <div key={step.id} className={`p-4 rounded-2xl border transition-all ${
                          isExecuting ? 'border-purple-300 bg-purple-50/20' : 
                          isCompleted ? 'border-emerald-200 bg-emerald-50/10' :
                          isFailed ? 'border-rose-200 bg-rose-50/10' : 'border-slate-100 bg-slate-50/30'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              {isPending && <Clock className="w-5 h-5 text-slate-400" />}
                              {isExecuting && <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />}
                              {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                              {isFailed && <XCircle className="w-5 h-5 text-rose-600" />}
                            </div>
                            <div className="space-y-1 flex-1">
                              <span className="text-[10px] font-bold text-slate-400">KROK {idx + 1} • {step.type}</span>
                              <h5 className="text-xs font-black text-slate-800">{step.title}</h5>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{step.explanation}</p>
                              
                              {/* Confirmation Banner for Critical Steps */}
                              {isPending && step.requiresConfirmation && !copilotExecuting && (
                                <div className="mt-3 p-3 rounded-xl bg-amber-550/10 border border-amber-500/20 space-y-2">
                                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                                    ⚠️ Vyžaduje explicitní potvrzení administrátora
                                  </span>
                                  <p className="text-[10px] text-slate-600 leading-relaxed">
                                    Spuštěním tohoto kroku dojde k provedení administrativní akce na serveru a zapsání do bezpečnostního auditu.
                                  </p>
                                  <button
                                    onClick={() => executeStepByIndex(copilotPlan, idx)}
                                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg text-[10px] font-black hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <CheckSquare className="w-3 h-3" />
                                    POTVRDIT A SPUSTIT KROK
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Console: Detailed Results */}
            <div className="lg:col-span-7 space-y-6">
              {/* If no plan has run yet */}
              {!copilotPlan && !copilotResults && (
                <div className="bg-slate-50 p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <HelpCircle className="w-12 h-12 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-black text-slate-800">Čekám na zadání požadavku</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Vyberte jeden z rychlých scénářů výše nebo napište vlastní příkaz. Asistent vytvoří bezpečný prováděcí plán k posouzení.
                  </p>
                </div>
              )}

              {/* Execution Audit Log Tracker */}
              {copilotStepLogs.length > 0 && (
                <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 font-mono text-[10px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      Live Audit Logs (Záznamy Bezpečnosti)
                    </span>
                    <span className="text-indigo-400 text-[9px] font-bold">RBAC AUDITED</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {copilotStepLogs.map((log, idx) => (
                      <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-300 font-bold">{log.action || 'LOG'}</span>
                          <span className="text-slate-500 text-[9px]">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-slate-300">{log.details}</p>
                        {log.userEmail && (
                          <div className="text-emerald-400 text-[8px] font-black">Authorized by: {log.userEmail}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consensus Results Container */}
              {copilotResults && (
                <div className="space-y-6">
                  {/* Consensus Summary Card */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VÝSTUP CONSENSUS ENGINU</span>
                        <h4 className="text-sm font-black text-slate-900">Analýza dokončena a ověřena</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Consensus Badge */}
                        {(() => {
                          const status = copilotResults.aiCouncil?.status || 'UNANIMOUS';
                          const color = 
                            status === 'UNANIMOUS' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                            status === 'MAJORITY' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            status === 'DISAGREEMENT' ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' : 'bg-slate-100 text-slate-800 border-slate-200';
                          return (
                            <span className={`px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase ${color}`}>
                              Consensus: {status}
                            </span>
                          );
                        })()}

                        {/* Final Decision Gate Badge */}
                        {(() => {
                          const verdict = copilotResults.aiVerdict || 'NOT PRODUCTION READY';
                          const color = verdict === 'PRODUCTION READY' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-600/20';
                          return (
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase shadow-xs ${color}`}>
                              {verdict}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* DISAGREEMENT MITIGATION WARNING */}
                    {copilotResults.aiCouncil?.status === 'DISAGREEMENT' && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                        <div className="flex items-center gap-2 text-rose-900 font-black text-xs">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>ROZPOR DETEKTOVÁN (NEEDS_REVIEW)</span>
                        </div>
                        <p className="text-[11px] text-rose-800 leading-relaxed">
                          Pozor: Analytici Gemini a Grok dospěli k odlišným závěrům ohledně závažnosti nebo příčiny chyb. 
                          Systém v souladu s bezpečnostními pravidly automaticky aktivoval stav <strong>NEEDS_REVIEW</strong> a zablokoval možnost vytvoření falešného PASS. 
                          Pro přechod do stavu PRODUCTION READY je nutný ruční zásah a přezkum administrátora.
                        </p>
                      </div>
                    )}

                    {/* Verdicts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Gemini Verdict */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Gemini Verdict</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {copilotResults.aiCouncil?.analysts?.gemini?.verdict || 'FAIL'}
                          </span>
                          <span className="text-[10px] font-mono text-purple-600">
                            Conf: {((copilotResults.aiCouncil?.analysts?.gemini?.confidence || 0.85) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic leading-relaxed mt-1">
                          "{copilotResults.aiCouncil?.analysts?.gemini?.summary?.slice(0, 80) || 'Selhání některých integračních testů'}..."
                        </p>
                      </div>

                      {/* Grok Verdict */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Grok Verdict</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {copilotResults.aiCouncil?.analysts?.grok?.verdict || 'FAIL'}
                          </span>
                          <span className="text-[10px] font-mono text-purple-600">
                            Conf: {((copilotResults.aiCouncil?.analysts?.grok?.confidence || 0.88) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 italic leading-relaxed mt-1">
                          "{copilotResults.aiCouncil?.analysts?.grok?.summary?.slice(0, 80) || 'Detekována bezpečnostní rizika v API'}..."
                        </p>
                      </div>

                      {/* Deterministic QA Result */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Deterministic QA Engine</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 uppercase">
                            {copilotResults.aiCouncil?.finalQAVerdict || 'NOT PRODUCTION READY'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                          Základní pravda (Source of Truth) určená pevnými unit/e2e/security testy.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Agreed Findings Details */}
                  {copilotResults.aiCouncil?.agreedFindings && copilotResults.aiCouncil.agreedFindings.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-purple-600" />
                        Shodné nálezy (Agreed Findings) z AI Council
                      </h4>
                      <div className="space-y-3">
                        {copilotResults.aiCouncil.agreedFindings.map((finding: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                                {finding.severity}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Shoda: {((finding.confidence || 0.8) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-900">{finding.finding}</h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] pt-1">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-400 uppercase">Příčina (Root Cause):</span>
                                <p className="text-slate-700">{finding.rootCause}</p>
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-400 uppercase">Evidence (Důkaz):</span>
                                <p className="text-slate-700">{finding.evidence}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Final Recommendations & Actions */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Závěrečná doporučení a nápravná opatření
                    </h4>
                    <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <span className="font-bold text-slate-900 block">Manažerské shrnutí:</span>
                        <p className="text-slate-600 mt-1">{copilotResults.executiveSummary || 'Všechny systémy vyhovují.'}</p>
                      </div>

                      {copilotResults.recommendedFixes && copilotResults.recommendedFixes.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-900 block">Doporučené technické opravy:</span>
                          <ul className="list-disc pl-5 space-y-1 mt-1.5 text-slate-600">
                            {copilotResults.recommendedFixes.map((fix: string, idx: number) => (
                              <li key={idx}>{fix}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

