import React from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { OrionTraceStep } from '../../../services/audit/orionTraceTypes';

interface OrionTraceDetailDrawerProps {
  step: OrionTraceStep | null;
  onClose: () => void;
  providerInfo?: {
    primary: string;
    active: string;
    fallbackUsed: boolean;
    model: string;
  };
}

export const OrionTraceDetailDrawer: React.FC<OrionTraceDetailDrawerProps> = ({
  step,
  onClose,
  providerInfo,
}) => {
  if (!step) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between p-6 border-l border-slate-200 animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Detail Krokem Process Trace
                </h3>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  KROK ID: {step.id}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Title and Status */}
          <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-900">{step.title}</span>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  step.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : step.status === 'ACTIVE'
                    ? 'bg-purple-100 text-purple-900 animate-pulse'
                    : step.status === 'FAILED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {step.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{step.subtitle}</p>
          </div>

          {/* Latency & Timing */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                Latence kroků
              </span>
              <span className="text-sm font-black font-mono text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-purple-600" />
                {step.latencyMs !== undefined ? `${step.latencyMs} ms` : 'N/A'}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                Sanitizace
              </span>
              <span className="text-sm font-black font-mono text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                0-PII SAFE
              </span>
            </div>
          </div>

          {/* AI Provider & Model Info (if relevant) */}
          {step.id === 'AI_PROVIDER' && providerInfo && (
            <div className="mb-6 bg-purple-50/70 p-4 rounded-2xl border border-purple-100 space-y-2">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5 uppercase">
                <Cpu className="w-4 h-4 text-purple-700" /> AI Provider & Cascade Status
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500 text-[10px] block">Primární provider:</span>
                  <span className="font-bold text-slate-900">{providerInfo.primary}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Aktivní model:</span>
                  <span className="font-bold text-slate-900">{providerInfo.model}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-purple-200/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Záložní fallback spuštěn:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${providerInfo.fallbackUsed ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {providerInfo.fallbackUsed ? 'ANO (Offline syntéza)' : 'NE (Primární Gemini ok)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Structured Safe Metadata */}
          {step.details && Object.keys(step.details).length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" /> Strukturovaná Metadata Kroku
              </h4>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner border border-slate-800">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(step.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Message (Sanitized) */}
          {step.error && (
            <div className="mb-6 bg-rose-50 p-4 rounded-2xl border border-rose-200 text-rose-900">
              <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-rose-600" /> Sanitizovaná Chybová Hláška
              </h4>
              <p className="text-xs font-mono leading-relaxed">{step.error}</p>
            </div>
          )}

          {/* Security & Observability Notice */}
          <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-blue-900 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-blue-600" /> Observability & Security Guarantee
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Tento panel poskytuje výhradně <strong>auditní observability stopu</strong>. Interní
              myšlenkové pochody (chain-of-thought) a neobrané raw prompty jsou z bezpečnostních
              důvodů filtrovány. Žádné schvalovací ani exekuční tlačítko zde není přítomno (Human
              Approval Gate zůstává čistě na autoritativním Release Gate).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-600 font-mono">
            Orion Trust Model: AI_RECOMMENDATION
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            Zavřít panel
          </button>
        </div>
      </div>
    </div>
  );
};
