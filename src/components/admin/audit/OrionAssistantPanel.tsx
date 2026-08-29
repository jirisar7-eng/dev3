import React, { useState } from 'react';
import { apiFetch } from '../../../utils/apiClient';
import {
  Cpu,
  Shield,
  AlertTriangle,
  Layers,
  Send,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  FileCode,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  OrionAnalysisRequest,
  OrionAnalysisResponse,
  OrionFindingAnalysis,
  OrionSuggestedDraftAction,
  AuditFinding,
} from '../../../services/audit/types';

interface OrionAssistantPanelProps {
  initialFinding?: AuditFinding | null;
  onActionProposed?: (actionId: string) => void;
}

export const OrionAssistantPanel: React.FC<OrionAssistantPanelProps> = ({
  initialFinding,
  onActionProposed,
}) => {
  const [scope, setScope] = useState<'REGISTRY' | 'FINDING' | 'REGRESSION' | 'HEALTH' | 'GENERAL'>(
    initialFinding ? 'FINDING' : 'HEALTH'
  );
  const [targetCode, setTargetCode] = useState<string>(initialFinding?.code || '');
  const [userQuery, setUserQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<OrionAnalysisResponse | null>(null);

  // Propose Draft Action State
  const [proposingAction, setProposingAction] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedDraftAction, setSelectedDraftAction] = useState<OrionSuggestedDraftAction | null>(null);

  const handleRunAnalysis = async () => {
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    try {
      const payload: OrionAnalysisRequest = {
        scope,
        targetCode: targetCode.trim() || undefined,
        userQuery: userQuery.trim() || undefined,
      };

      const res = await apiFetch('/api/admin/audits/orion/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAnalysis(json.data);
      } else {
        setError(json.error || 'Orion AI analýza selhala.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci se službou Orion.');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeDraftAction = async (actionSuggestion: OrionSuggestedDraftAction) => {
    setProposingAction(true);
    setError(null);
    setActionSuccess(null);
    try {
      const payload = {
        title: actionSuggestion.title,
        intent: actionSuggestion.intent,
        targetResource: actionSuggestion.targetResource,
        findingReference: targetCode || undefined,
      };

      const res = await apiFetch('/api/admin/audits/orion/propose-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setActionSuccess(
          `Návrh akce ${json.data.actionId} byl úspěšně zařazen jako DRAFT. Vyžaduje schválení administrátorem v Control Center.`
        );
        if (onActionProposed) {
          onActionProposed(json.data.actionId);
        }
      } else {
        setError(json.error || 'Nepodařilo se vytvořit návrh akce.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při odesílání návrhu akce.');
    } finally {
      setProposingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Orion Identity & Trust Notice Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600/30 border border-indigo-400/30 rounded-xl text-indigo-300">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">Orion Safety Assistant</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  agent-orion-qa-v1
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  AI_RECOMMENDATION
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                Řízená AI bezpečnostní identita pro syntézu auditních nálezů, detekci regresí a návrhy DRAFT akcí.
                <strong className="text-amber-300 font-semibold block mt-0.5">
                  Upozornění: Orion poskytuje pouze doporučení a NIKDY nemůže schvalovat ani spouštět akce bez lidského
                  potvrzení.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Query Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Konfigurace analýzy</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rozsah analýzy (Scope)</label>
            <select
              value={scope}
              onChange={(e: any) => setScope(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="HEALTH">Celkové zdraví systému (HEALTH)</option>
              <option value="REGISTRY">Všechny otevřené nálezy (REGISTRY)</option>
              <option value="REGRESSION">Časová osa a regrese (REGRESSION)</option>
              <option value="FINDING">Konkrétní kód nálezu (FINDING)</option>
              <option value="GENERAL">Obecný dotaz (GENERAL)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cílový kód nálezu (volitelné)</label>
            <input
              type="text"
              placeholder="např. SEC-001 nebo DB-002"
              value={targetCode}
              onChange={(e) => setTargetCode(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Doplňující dotaz administrátora</label>
            <input
              type="text"
              placeholder="např. Jaké jsou kroky k odstranění P0 blokátorů?"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-slate-400">
            Vstupy i výstupy procházejí automatickou sanitizací (redakce tokenů, hesel a PII).
          </div>
          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{loading ? 'Orion analyzuje...' : 'Spustit AI analýzu'}</span>
          </button>
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Analysis Result Display */}
      {analysis && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold border border-indigo-200">
                Výsledek analýzy
              </span>
              <span className="text-xs font-mono text-slate-500">
                Model: {analysis.metadata?.model || 'gemini-3.7-flash'} | Latence: {analysis.metadata?.latencyMs || 0}ms
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {new Date(analysis.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Manažerský souhrn</h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap">
              {analysis.summary}
            </div>
          </div>

          {/* Safety Warnings if any */}
          {analysis.safetyWarnings && analysis.safetyWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Bezpečnostní varování a omezení ({analysis.safetyWarnings.length})</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                {analysis.safetyWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Findings Analysis */}
          {analysis.findingsAnalysis && analysis.findingsAnalysis.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Detailní rozbor nálezů ({analysis.findingsAnalysis.length})
              </h4>
              <div className="space-y-3">
                {analysis.findingsAnalysis.map((fa: OrionFindingAnalysis, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                          {fa.code}
                        </span>
                        <span className="font-semibold text-slate-800">{fa.title}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {fa.severity}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <strong>Vyhodnocení rizika: </strong>
                      {fa.riskEvaluation}
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-indigo-900 font-medium">
                      <strong>Doporučená náprava: </strong>
                      {fa.recommendedRemediation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested DRAFT Actions */}
          {analysis.suggestedDraftActions && analysis.suggestedDraftActions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Navržené akce pro Control Plane ({analysis.suggestedDraftActions.length})
                </h4>
                <span className="text-[11px] text-amber-700 font-semibold">
                  Vyžaduje schválení administrátorem
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.suggestedDraftActions.map((sug: OrionSuggestedDraftAction, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-indigo-950">{sug.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-white font-bold">
                          DRAFT ONLY
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{sug.intent}</p>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Cíl: {sug.targetResource} | Riziko: {sug.riskLevel}
                      </div>
                    </div>

                    <button
                      onClick={() => handleProposeDraftAction(sug)}
                      disabled={proposingAction}
                      className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs disabled:opacity-50"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{proposingAction ? 'Vytvářím návrh...' : 'Vytvořit DRAFT návrh do fronty'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
