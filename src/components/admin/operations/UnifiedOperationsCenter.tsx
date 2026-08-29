import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/apiClient';
import {
  ShieldCheck,
  Activity,
  FileCode,
  Cpu,
  FileText,
  RefreshCw,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  BarChart2,
  Sparkles,
  PlayCircle,
  Clock,
  Terminal,
  CheckCircle2,
  XCircle,
  Lock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { ProjectHealthCard } from '../audit/ProjectHealthCard';
import { AuditFindingsList } from '../audit/AuditFindingsList';
import { OrionAssistantPanel } from '../audit/OrionAssistantPanel';
import { AuditDocumentsCatalog } from '../audit/AuditDocumentsCatalog';
import { AiTelemetryCard } from '../audit/AiTelemetryCard';
import {
  ReleaseGateEvaluationResult,
  AuditFinding,
  RegressionFinding,
} from '../../../services/audit/types';

interface UnifiedOperationsCenterProps {
  initialSubTab?: 'overview' | 'health' | 'findings' | 'orion' | 'catalog' | 'telemetry';
  onNavigate?: (path: string) => void;
}

export const UnifiedOperationsCenter: React.FC<UnifiedOperationsCenterProps> = ({
  initialSubTab = 'overview',
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'health' | 'findings' | 'orion' | 'catalog' | 'telemetry'>(
    initialSubTab
  );

  // Backend Data State
  const [releaseGate, setReleaseGate] = useState<ReleaseGateEvaluationResult | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [regressions, setRegressions] = useState<RegressionFinding[]>([]);
  const [loadingGate, setLoadingGate] = useState<boolean>(true);
  const [loadingFindings, setLoadingFindings] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected finding for Orion deep analysis
  const [orionTargetFinding, setOrionTargetFinding] = useState<AuditFinding | null>(null);

  // Fetch Release Gate Status
  const fetchReleaseGate = async () => {
    setLoadingGate(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/audits/release-gate');
      const json = await res.json();
      if (json.success && json.data) {
        setReleaseGate(json.data);
      } else {
        setError(json.error || 'Nepodařilo se načíst Release Gate data.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci s Release Gate API.');
    } finally {
      setLoadingGate(false);
    }
  };

  // Fetch Findings & Regressions
  const fetchFindings = async () => {
    setLoadingFindings(true);
    try {
      const res = await apiFetch('/api/admin/audits/findings');
      const json = await res.json();
      if (json.success && json.data) {
        setFindings(json.data.findings || []);
        setRegressions(json.data.regressions || []);
      }
    } catch (err: any) {
      console.error('Chyba při načítání registru nálezů:', err);
    } finally {
      setLoadingFindings(false);
    }
  };

  useEffect(() => {
    fetchReleaseGate();
    fetchFindings();
  }, []);

  const handleRefreshAll = async () => {
    await Promise.all([fetchReleaseGate(), fetchFindings()]);
  };

  const handleAnalyzeWithOrion = (finding: AuditFinding) => {
    setOrionTargetFinding(finding);
    setActiveSubTab('orion');
  };

  const handleProposeAction = (finding: AuditFinding) => {
    setOrionTargetFinding(finding);
    setActiveSubTab('orion');
  };

  const navigateToExternalTab = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Critical blockers count
  const p0Count = findings.filter((f) => f.severity === 'P0').length;
  const p1Count = findings.filter((f) => f.severity === 'P1').length;
  const regressionCount = regressions.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* 1. Header & Unified Operations Center Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Unified AI & Audit Operations Center
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Velín & Observability
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Jednotné operační centrum spojující vývojové audity (SSOT), autoritativní Release Gate, Orion AI bezpečnostního asistenta a multi-AI telemetrii.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={loadingGate || loadingFindings}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingGate || loadingFindings ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Obnovit stav</span>
          </button>
        </div>
      </div>

      {/* 2. Global Error Banner if API Fails */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={handleRefreshAll}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium cursor-pointer"
          >
            Zkusit znovu
          </button>
        </div>
      )}

      {/* 3. Sub-Navigation Tabs within Operations Center */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Přehled Velína</span>
        </button>

        <button
          onClick={() => setActiveSubTab('health')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'health'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Zdraví & Release Gate</span>
          {releaseGate && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                releaseGate.verdict === 'READY_TO_MERGE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : releaseGate.verdict === 'DO_NOT_MERGE'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {releaseGate.verdict === 'READY_TO_MERGE' ? 'MERGE OK' : 'BLOCKED'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('findings')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'findings'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Nálezy & Regrese</span>
          {findings.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {findings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('orion')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'orion'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Orion AI Asistent</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
            agent-v1
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('telemetry')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'telemetry'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>AI Telemetrie & Modely</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
            0-PII
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Katalog Auditů (Docs)</span>
        </button>
      </div>

      {/* 4. Tab Content: OVERVIEW HUB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Release Gate Executive Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-xs transition-all ${
              releaseGate?.verdict === 'READY_TO_MERGE'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : releaseGate?.verdict === 'DO_NOT_MERGE'
                ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-2xl ${
                    releaseGate?.verdict === 'READY_TO_MERGE'
                      ? 'bg-emerald-600 text-white'
                      : releaseGate?.verdict === 'DO_NOT_MERGE'
                      ? 'bg-rose-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {releaseGate?.verdict === 'READY_TO_MERGE' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <XCircle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                      Release Gate Status
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-black uppercase ${
                        releaseGate?.verdict === 'READY_TO_MERGE'
                          ? 'bg-emerald-200 text-emerald-900'
                          : releaseGate?.verdict === 'DO_NOT_MERGE'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-amber-200 text-amber-900'
                      }`}
                    >
                      {releaseGate?.verdict || 'EVALUATING'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-1">
                    {releaseGate?.verdict === 'READY_TO_MERGE'
                      ? 'Projekt je v souladu se všemi 5 pilíři zdraví a je připraven k nasazení.'
                      : releaseGate?.verdict === 'DO_NOT_MERGE'
                      ? 'Release Gate je zablokován kvůli aktivním P0/P1 nálezům nebo regresím.'
                      : 'Probíhá deterministické vyhodnocení stavu systému.'}
                  </h3>
                  <p className="text-xs mt-1 opacity-90 max-w-3xl">
                    {releaseGate?.blockers && releaseGate.blockers.length > 0
                      ? releaseGate.blockers.map((b) => b.message).join(' • ')
                      : releaseGate?.warnings && releaseGate.warnings.length > 0
                      ? releaseGate.warnings.join(' • ')
                      : 'Všechna bezpečnostní a architektonická kritéria splněna.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveSubTab('health')}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Detail Pilířů Zdraví</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Command Launcher Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Synthesis Admin Copilot */}
            <div
              onClick={() => navigateToExternalTab('/administrace/qa/copilot')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                  Multi-AI
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                Synthesis Admin Copilot
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Multi-AI agent pro asistovanou správu, kontrolu integrity a plánování oprav.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-purple-600 mt-3">
                <span>Spustit Copilota</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. QA & Audit Syntéza */}
            <div
              onClick={() => navigateToExternalTab('/administrace/qa')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                  Orchestrátor
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">
                QA & Audit Syntéza
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Komplexní QA orchestrátor, discovery komponent a validace invariantů.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 mt-3">
                <span>Otevřít QA Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. Orion AI Safety Assistant */}
            <div
              onClick={() => setActiveSubTab('orion')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  DRAFT Only
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition-colors">
                Orion Safety Bridge
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                AI Asistent pro analýzu příčin chyb a návrh DRAFT akcí pod přísným RBAC.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600 mt-3">
                <span>Analyzovat s Orionem</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 4. Project Control Center */}
            <div
              onClick={() => navigateToExternalTab('/admin/project-control')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
                  Control Plane
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-700 transition-colors">
                Control Plane & Exekuce
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Izolovaná exekuční zóna pro bezpečné schvalování a provádění systémových změn.
              </p>
              <div className="flex items-center gap-1 text-xs font-bold text-rose-600 mt-3">
                <span>Otevřít Control Center</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Quick Metrics & 5 Pillars Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: 5 Pillars Status */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-sm">5 Pilířů Zdraví Projektu (SSOT)</h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Stav: <strong className="text-slate-900">{releaseGate?.verdict === 'READY_TO_MERGE' ? '100 % VERIFIED' : 'KONTROLA'}</strong>
                </span>
              </div>

              <div className="space-y-3">
                {releaseGate?.health ? (
                  [
                    { name: 'Database & Migrations', data: releaseGate.health.databaseAndMigrations },
                    { name: 'Security & RBAC', data: releaseGate.health.securityAndRbac },
                    { name: 'Control Plane', data: releaseGate.health.controlPlane },
                    { name: 'Test Suite & Build', data: releaseGate.health.testSuiteAndBuild },
                    { name: 'AI Subsystem (Orion)', data: releaseGate.health.aiSubsystem },
                  ].map((pillar, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            pillar.data.status === 'VERIFIED'
                              ? 'bg-emerald-500'
                              : pillar.data.status === 'UNKNOWN'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <div>
                          <span className="font-bold text-slate-800 text-xs block">{pillar.name}</span>
                          <span className="text-[11px] text-slate-500">{pillar.data.message}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          pillar.data.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pillar.data.status === 'UNKNOWN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {pillar.data.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4">Načítání pilířů...</div>
                )}
              </div>
            </div>

            {/* Right: Blocker Summary & Fast Actions */}
            <div className="space-y-4">
              {/* Blocker Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Aktivní Nálezy & Blokery
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-700 uppercase block">P0 Kritické</span>
                    <span className="text-xl font-black text-rose-900">{p0Count}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">P1 Vysoké</span>
                    <span className="text-xl font-black text-amber-900">{p1Count}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase block">Regrese</span>
                    <span className="text-xl font-black text-indigo-900">{regressionCount}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setActiveSubTab('findings')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Zobrazit Registr Nálezů ({findings.length})
                  </button>
                </div>
              </div>

              {/* AI Privacy & Control notice */}
              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 text-xs text-indigo-950">
                <div className="flex items-center gap-2 font-bold mb-1 text-indigo-900">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Bezpečnostní Izolace (Fail-Closed)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Orion ani Synthesis Copilot nemají exekuční práva. Všechny AI výstupy jsou striktně označené jako <code className="text-indigo-700 font-mono">DRAFT / AI_RECOMMENDATION</code> a vyžadují autorizaci člověka s rolí ADMIN.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab Content: HEALTH & RELEASE GATE */}
      {activeSubTab === 'health' && (
        <ProjectHealthCard
          releaseGate={releaseGate}
          loading={loadingGate}
          onRefresh={fetchReleaseGate}
        />
      )}

      {/* 6. Tab Content: FINDINGS & REGRESSIONS */}
      {activeSubTab === 'findings' && (
        <AuditFindingsList
          findings={findings}
          regressions={regressions}
          loading={loadingFindings}
          onAnalyzeWithOrion={handleAnalyzeWithOrion}
          onProposeAction={handleProposeAction}
          onRefresh={fetchFindings}
        />
      )}

      {/* 7. Tab Content: ORION AI SAFETY ASSISTANT */}
      {activeSubTab === 'orion' && (
        <OrionAssistantPanel
          initialFinding={orionTargetFinding}
          onActionProposed={() => {
            fetchReleaseGate();
            fetchFindings();
          }}
        />
      )}

      {/* 8. Tab Content: AI TELEMETRY & MODELS */}
      {activeSubTab === 'telemetry' && (
        <AiTelemetryCard onNavigate={onNavigate} />
      )}

      {/* 9. Tab Content: AUDIT DOCUMENTS CATALOG (DOCS/AUDIT) */}
      {activeSubTab === 'catalog' && (
        <AuditDocumentsCatalog
          onSyncCompleted={() => {
            fetchReleaseGate();
            fetchFindings();
          }}
        />
      )}
    </div>
  );
};
export default UnifiedOperationsCenter;
