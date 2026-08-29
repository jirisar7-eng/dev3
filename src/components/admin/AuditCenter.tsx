import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiClient';
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
} from 'lucide-react';
import { ProjectHealthCard } from './audit/ProjectHealthCard';
import { AuditFindingsList } from './audit/AuditFindingsList';
import { OrionAssistantPanel } from './audit/OrionAssistantPanel';
import { AuditDocumentsCatalog } from './audit/AuditDocumentsCatalog';
import {
  ReleaseGateEvaluationResult,
  AuditFinding,
  RegressionFinding,
} from '../../services/audit/types';

export const AuditCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health' | 'findings' | 'orion' | 'catalog'>('health');

  // Backend Data State
  const [releaseGate, setReleaseGate] = useState<ReleaseGateEvaluationResult | null>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [regressions, setRegressions] = useState<RegressionFinding[]>([]);
  const [loadingGate, setLoadingGate] = useState<boolean>(true);
  const [loadingFindings, setLoadingFindings] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected finding to analyze in Orion
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
    setActiveTab('orion');
  };

  const handleProposeAction = (finding: AuditFinding) => {
    setOrionTargetFinding(finding);
    setActiveTab('orion');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header & Global Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-xs">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Audit Center 2.0</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                Observability & Governance
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Centrální registr auditů, 5 pilířů zdraví projektu, autoritativní Release Gate a Orion AI bezpečnostní
              analytik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshAll}
            disabled={loadingGate || loadingFindings}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingGate || loadingFindings ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Aktualizovat vše</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner if API Fails */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={handleRefreshAll}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium"
          >
            Zkusit znovu
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('health')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'health'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" />
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
          onClick={() => setActiveTab('findings')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'findings'
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
          onClick={() => setActiveTab('orion')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'orion'
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
          onClick={() => setActiveTab('catalog')}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Katalog Zpráv (Docs)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'health' && (
        <ProjectHealthCard
          releaseGate={releaseGate}
          loading={loadingGate}
          onRefresh={fetchReleaseGate}
        />
      )}

      {activeTab === 'findings' && (
        <AuditFindingsList
          findings={findings}
          regressions={regressions}
          loading={loadingFindings}
          onAnalyzeWithOrion={handleAnalyzeWithOrion}
          onProposeAction={handleProposeAction}
          onRefresh={fetchFindings}
        />
      )}

      {activeTab === 'orion' && (
        <OrionAssistantPanel
          initialFinding={orionTargetFinding}
          onActionProposed={() => {
            fetchReleaseGate();
            fetchFindings();
          }}
        />
      )}

      {activeTab === 'catalog' && (
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
export default AuditCenter;
