import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Lock,
  Cpu,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import {
  ReleaseGateEvaluationResult,
  ProjectHealthPillars,
  ProjectHealthStatus,
  ReleaseGateVerdict,
  PillarHealth,
} from '../../../services/audit/types';

interface ProjectHealthCardProps {
  releaseGate: ReleaseGateEvaluationResult | null;
  loading: boolean;
  onRefresh: () => void;
}

export const ProjectHealthCard: React.FC<ProjectHealthCardProps> = ({
  releaseGate,
  loading,
  onRefresh,
}) => {
  const getVerdictBadge = (verdict: ReleaseGateVerdict) => {
    switch (verdict) {
      case 'READY_TO_MERGE':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 shadow-xs">
            <ShieldCheck className="w-6 h-6 text-emerald-600 animate-pulse" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Release Gate Verdict</div>
              <div className="text-base font-bold">READY TO MERGE</div>
            </div>
          </div>
        );
      case 'DO_NOT_MERGE':
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 shadow-xs">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">Release Gate Verdict</div>
              <div className="text-base font-bold">DO NOT MERGE (BLOCKED)</div>
            </div>
          </div>
        );
      case 'UNKNOWN':
      default:
        return (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 shadow-xs">
            <HelpCircle className="w-6 h-6 text-amber-600" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Release Gate Verdict</div>
              <div className="text-base font-bold">UNKNOWN / UNVERIFIED</div>
            </div>
          </div>
        );
    }
  };

  const getPillarStatusIcon = (status: ProjectHealthStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case 'UNKNOWN':
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getPillarBadgeColor = (status: ProjectHealthStatus) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'FAILED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'UNKNOWN':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const pillarsList = releaseGate?.health
    ? [
        {
          key: 'databaseAndMigrations',
          title: 'Database & Migrations',
          icon: Database,
          pillar: releaseGate.health.databaseAndMigrations,
          description: 'Prisma schema, tabulky, migrační integrita',
        },
        {
          key: 'securityAndRbac',
          title: 'Security & RBAC',
          icon: Lock,
          pillar: releaseGate.health.securityAndRbac,
          description: 'Fail-closed autorizace, 0-secrets a sanitizace',
        },
        {
          key: 'controlPlane',
          title: 'Control Plane',
          icon: Layers,
          pillar: releaseGate.health.controlPlane,
          description: 'Audit registry, state machine, schvalovací fronta',
        },
        {
          key: 'testSuiteAndBuild',
          title: 'Test Suite & Build',
          icon: Terminal,
          pillar: releaseGate.health.testSuiteAndBuild,
          description: 'Typecheck (tsc), Vitest test suite, esbuild server',
        },
        {
          key: 'aiSubsystem',
          title: 'AI Subsystem (Orion)',
          icon: Cpu,
          pillar: releaseGate.health.aiSubsystem,
          description: 'AI Safety bridge, prompt/output sanitizér, zod schémata',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner: Release Gate Verdict */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Project Health & Release Gate</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  Autoritativní backend
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Deterministické vyhodnocení stavu 5 pilířů systému a blokátorů pro merge do produkce.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {releaseGate ? getVerdictBadge(releaseGate.verdict) : null}
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors disabled:opacity-50 shadow-xs"
              title="Přepočítat Release Gate na serveru"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>{loading ? 'Vyhodnocuji...' : 'Přepočítat'}</span>
            </button>
          </div>
        </div>

        {/* Evaluation Metadata & Quick Metrics */}
        {releaseGate && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500">Otevřená P0 (Blokátory)</div>
              <div className={`text-lg font-bold mt-1 ${releaseGate.summary.openP0 > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {releaseGate.summary.openP0}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500">Otevřená P1 (Vysoká)</div>
              <div className={`text-lg font-bold mt-1 ${releaseGate.summary.openP1 > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {releaseGate.summary.openP1}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500">P2 / P3 dluh</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {releaseGate.summary.openP2 + releaseGate.summary.openP3}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500">Kritické regrese</div>
              <div className={`text-lg font-bold mt-1 ${releaseGate.summary.criticalRegressions > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {releaseGate.summary.criticalRegressions}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500">Evidence auditů</div>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {releaseGate.summary.totalAudits} reportů
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-medium text-slate-500">Poslední vyhodnocení</div>
              <div className="text-xs font-semibold text-slate-700 mt-1.5 truncate">
                {releaseGate.evaluatedAt ? new Date(releaseGate.evaluatedAt).toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Blockers & Warnings */}
        {releaseGate && releaseGate.blockers && releaseGate.blockers.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-rose-50/80 border border-rose-200">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Aktivní blokátory bránící mergi ({releaseGate.blockers.length})</span>
            </div>
            <ul className="space-y-1.5 text-xs text-rose-900">
              {releaseGate.blockers.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-rose-200/60">
                  <span className="font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    {b.code}
                  </span>
                  <span className="font-medium text-slate-800">{b.component}:</span>
                  <span className="text-slate-700 flex-1">{b.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {releaseGate && releaseGate.warnings && releaseGate.warnings.length > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Upozornění a varování ({releaseGate.warnings.length})</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-amber-900">
              {releaseGate.warnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 5 Health Pillars Cards */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          <span>5 Klíčových pilířů zdraví systému</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillarsList.map((item) => {
            const Icon = item.icon;
            const p = item.pillar as PillarHealth;
            return (
              <div
                key={item.key}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getPillarBadgeColor(
                        p.status
                      )}`}
                    >
                      {getPillarStatusIcon(p.status)}
                      <span>{p.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{item.description}</p>
                </div>

                <div className="pt-2.5 border-t border-slate-100 text-xs text-slate-700">
                  <span className="font-medium text-slate-900">Stav: </span>
                  <span>{p.message || 'Žádné doplňující informace.'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Runtime Evidence Section */}
      {releaseGate?.evidence && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <span>Automatická runtime evidence z posledního běhu</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">TypeScript (tsc)</div>
              <div className="flex items-center gap-1.5 mt-1 font-semibold">
                {getPillarStatusIcon(releaseGate.evidence.tscStatus as ProjectHealthStatus)}
                <span className="text-slate-800">{releaseGate.evidence.tscStatus}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Vitest Suite</div>
              <div className="flex items-center gap-1.5 mt-1 font-semibold">
                {getPillarStatusIcon(releaseGate.evidence.testSuiteStatus as ProjectHealthStatus)}
                <span className="text-slate-800">{releaseGate.evidence.testSuiteStatus}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Build Bundle</div>
              <div className="flex items-center gap-1.5 mt-1 font-semibold">
                {getPillarStatusIcon(releaseGate.evidence.buildStatus as ProjectHealthStatus)}
                <span className="text-slate-800">{releaseGate.evidence.buildStatus}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-medium">Database Schema</div>
              <div className="flex items-center gap-1.5 mt-1 font-semibold">
                {getPillarStatusIcon(releaseGate.evidence.migrationStatus as ProjectHealthStatus)}
                <span className="text-slate-800">{releaseGate.evidence.migrationStatus}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
