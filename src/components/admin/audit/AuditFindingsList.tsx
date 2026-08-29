import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Cpu,
  Layers,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  History,
  FileCode,
  Check,
  X,
} from 'lucide-react';
import {
  AuditFinding,
  FindingSeverity,
  FindingStatus,
  RegressionFinding,
  RegressionChangeType,
} from '../../../services/audit/types';

interface AuditFindingsListProps {
  findings: AuditFinding[];
  regressions: RegressionFinding[];
  loading: boolean;
  onAnalyzeWithOrion?: (finding: AuditFinding) => void;
  onProposeAction?: (finding: AuditFinding) => void;
  onRefresh?: () => void;
}

export const AuditFindingsList: React.FC<AuditFindingsListProps> = ({
  findings,
  regressions,
  loading,
  onAnalyzeWithOrion,
  onProposeAction,
  onRefresh,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [search, setSearch] = useState<string>('');
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);

  // Severity counts
  const p0Count = findings.filter((f) => f.severity === 'P0' && f.status === 'OPEN').length;
  const p1Count = findings.filter((f) => f.severity === 'P1' && f.status === 'OPEN').length;
  const p2Count = findings.filter((f) => f.severity === 'P2' && f.status === 'OPEN').length;
  const p3Count = findings.filter((f) => f.severity === 'P3' && f.status === 'OPEN').length;

  const filteredFindings = findings.filter((f) => {
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        f.code.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.auditId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSeverityBadge = (sev: FindingSeverity) => {
    switch (sev) {
      case 'P0':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            <span>P0 CRITICAL</span>
          </span>
        );
      case 'P1':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span>P1 HIGH</span>
          </span>
        );
      case 'P2':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <span>P2 MEDIUM</span>
          </span>
        );
      case 'P3':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <span>P3 LOW</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            IN PROGRESS
          </span>
        );
      case 'FIXED':
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {status}
          </span>
        );
      case 'ACCEPTED_RISK':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            ACCEPTED RISK
          </span>
        );
    }
  };

  const getRegressionBadge = (type: RegressionChangeType) => {
    switch (type) {
      case 'REGRESSION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white animate-pulse">
            <TrendingDown className="w-3 h-3" />
            REGRESSION
          </span>
        );
      case 'SEVERITY_DRIFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
            <TrendingUp className="w-3 h-3" />
            DRIFT
          </span>
        );
      case 'NEW':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            NEW
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            RESOLVED
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Severity Filter Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSeverityFilter(severityFilter === 'P0' ? 'ALL' : 'P0')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'P0'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-rose-700">
            <span>P0 (CRITICAL)</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-900 mt-1">{p0Count}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Blokátory pro merge</div>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'P1' ? 'ALL' : 'P1')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'P1'
              ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-200'
              : 'bg-white border-slate-200 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-orange-700">
            <span>P1 (HIGH)</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-900 mt-1">{p1Count}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Vysoká bezpečnostní rizika</div>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'P2' ? 'ALL' : 'P2')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'P2'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-amber-700">
            <span>P2 (MEDIUM)</span>
            <Info className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 mt-1">{p2Count}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Technický dluh</div>
        </button>

        <button
          onClick={() => setSeverityFilter(severityFilter === 'P3' ? 'ALL' : 'P3')}
          className={`p-4 rounded-xl border text-left transition-all ${
            severityFilter === 'P3'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>P3 (LOW)</span>
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{p3Count}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Doporučení a čistota</div>
        </button>
      </div>

      {/* Regressions Alert Card if any */}
      {regressions.length > 0 && (
        <div className="bg-rose-50/90 border border-rose-300 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-sm mb-3">
            <TrendingDown className="w-5 h-5 text-rose-600" />
            <span>Detekované regrese napříč časovou osou auditů ({regressions.length})</span>
          </div>
          <div className="space-y-2">
            {regressions.map((reg, idx) => (
              <div
                key={idx}
                className="bg-white p-3 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-2.5">
                  {getRegressionBadge(reg.changeType)}
                  <span className="font-mono font-bold text-slate-900">{reg.code}</span>
                  <span className="text-slate-700">{reg.title}</span>
                </div>
                <div className="text-slate-500 text-[11px] flex items-center gap-2">
                  <span>{reg.explanation}</span>
                  {onAnalyzeWithOrion && (
                    <button
                      onClick={() =>
                        onAnalyzeWithOrion({
                          id: reg.findingId,
                          code: reg.code,
                          title: reg.title,
                          description: reg.explanation,
                          severity: reg.currentSeverity,
                          status: reg.currentStatus,
                          auditId: reg.currentAuditId,
                          firstDetectedAt: '',
                          lastSeenAt: '',
                        })
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors"
                      title="Spustit analýzu Oriona pro tuto regresi"
                    >
                      <Cpu className="w-3 h-3" />
                      <span>Analyzovat</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat v kódu, názvu, popisu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <span className="px-2 text-slate-500">Závažnost:</span>
            {['ALL', 'P0', 'P1', 'P2', 'P3'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  severityFilter === sev
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <span className="px-2 text-slate-500">Stav:</span>
            {['ALL', 'OPEN', 'FIXED', 'VERIFIED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Registr nálezů ({filteredFindings.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
            Načítám registr nálezů ze serveru...
          </div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Nenalezeny žádné nálezy odpovídající zadaným filtrům.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Závažnost</th>
                  <th className="px-4 py-3">Kód & Název</th>
                  <th className="px-4 py-3">Stav</th>
                  <th className="px-4 py-3">Zdrojový Audit</th>
                  <th className="px-4 py-3 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFindings.map((finding) => (
                  <tr key={finding.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{getSeverityBadge(finding.severity)}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{finding.code}</div>
                      <div className="text-slate-700 line-clamp-1 max-w-md">{finding.title}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(finding.status)}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                      {finding.auditId}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedFinding(finding)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                          title="Zobrazit detail nálezu"
                        >
                          Detail
                        </button>
                        {onAnalyzeWithOrion && (
                          <button
                            onClick={() => onAnalyzeWithOrion(finding)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200 transition-colors"
                            title="Spustit Orion AI analýzu"
                          >
                            <Cpu className="w-3 h-3" />
                            <span>Orion</span>
                          </button>
                        )}
                        {onProposeAction && (
                          <button
                            onClick={() => onProposeAction(finding)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
                            title="Navrhnout akci do Control Plane"
                          >
                            <Layers className="w-3 h-3" />
                            <span>Návrh akce</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {getSeverityBadge(selectedFinding.severity)}
                <div>
                  <h3 className="font-mono font-bold text-sm text-slate-900">{selectedFinding.code}</h3>
                  <div className="text-xs text-slate-500">Detail zjištěného nálezu v auditu</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedFinding(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <div className="font-semibold text-slate-900 mb-1 text-sm">{selectedFinding.title}</div>
                <div className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">
                  {selectedFinding.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Stav nálezu</div>
                  <div className="mt-1">{getStatusBadge(selectedFinding.status)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 font-medium">Zdrojový Audit Report</div>
                  <div className="font-mono text-slate-800 mt-1 truncate">{selectedFinding.auditId}</div>
                </div>
              </div>

              {selectedFinding.actionId && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
                  <div className="text-indigo-900 font-semibold">Navázaná Control Plane akce:</div>
                  <div className="font-mono text-indigo-700 mt-0.5">{selectedFinding.actionId}</div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Zavřít
              </button>
              {onAnalyzeWithOrion && (
                <button
                  onClick={() => {
                    const f = selectedFinding;
                    setSelectedFinding(null);
                    onAnalyzeWithOrion(f);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Analyzovat v Orionu</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
