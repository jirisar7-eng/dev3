import React from 'react';
import {
  UserCheck,
  Database,
  FileCode,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  Layers,
  FileText,
  User,
} from 'lucide-react';
import { OrionTraceStep, OrionTraceStepId, OrionTraceStepStatus } from '../../../services/audit/orionTraceTypes';

interface OrionTraceMindMapProps {
  steps: OrionTraceStep[];
  activeStepId?: OrionTraceStepId;
  onSelectStep: (step: OrionTraceStep) => void;
  selectedStepId?: OrionTraceStepId;
}

export const OrionTraceMindMap: React.FC<OrionTraceMindMapProps> = ({
  steps,
  onSelectStep,
  selectedStepId,
}) => {
  const getStepIcon = (id: OrionTraceStepId) => {
    switch (id) {
      case 'USER':
        return User;
      case 'CONTEXT':
        return Database;
      case 'SOURCES':
        return FileText;
      case 'SANITIZER':
        return ShieldCheck;
      case 'PERMISSION_INTERSECTION':
        return UserCheck;
      case 'AI_PROVIDER':
        return Cpu;
      case 'EVIDENCE':
        return Layers;
      case 'RECOMMENDATION':
        return Sparkles;
      case 'CONTROL_PLANE_DRAFT':
        return FileCode;
      case 'HUMAN_APPROVAL_GATE':
        return Lock;
      default:
        return Clock;
    }
  };

  const getStatusBadge = (status: OrionTraceStepStatus) => {
    switch (status) {
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:border-emerald-500',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          badgeText: 'DOKONČENO',
          icon: CheckCircle2,
          iconColor: 'text-emerald-600',
        };
      case 'ACTIVE':
        return {
          bg: 'bg-purple-50 border-purple-400 text-purple-900 shadow-md shadow-purple-100 animate-pulse hover:border-purple-600',
          badgeBg: 'bg-purple-100 text-purple-900',
          badgeText: 'BĚŽÍ...',
          icon: Sparkles,
          iconColor: 'text-purple-600 animate-spin',
        };
      case 'FAILED':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-800 hover:border-rose-500',
          badgeBg: 'bg-rose-100 text-rose-800',
          badgeText: 'CHYBA',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
        };
      case 'BLOCKED':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-500',
          badgeBg: 'bg-amber-100 text-amber-800',
          badgeText: 'BLOKOVÁNO',
          icon: Lock,
          iconColor: 'text-amber-600',
        };
      case 'WAITING':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300',
          badgeBg: 'bg-slate-200/80 text-slate-600',
          badgeText: 'ČEKÁ',
          icon: Clock,
          iconColor: 'text-slate-400',
        };
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl overflow-hidden relative">
      {/* Mindmap Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              ORION PROCESS TRACE MIND-MAP
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Bezpečná auditovatelná vizualizace 10 procesních kroků Oriona (0-PII sanitized, bez raw promptů a reasoning).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI_RECOMMENDATION
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 font-bold">
            0-PII SAFE
          </span>
        </div>
      </div>

      {/* Interactive Process Trace Graph Layout */}
      <div className="relative py-4">
        {/* SVG Connector Lines */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
          <svg className="w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGradCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="lineGradActive" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Node Grid: 2 rows of 5 nodes or responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const IconComponent = getStepIcon(step.id);
            const style = getStatusBadge(step.status);
            const StatusIcon = style.icon;
            const isSelected = selectedStepId === step.id;

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(step)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group ${style.bg} ${
                  isSelected ? 'ring-2 ring-purple-400 scale-[1.02] shadow-lg' : ''
                }`}
              >
                {/* Connector Arrow Indicator for Non-last Items */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 text-slate-600 group-hover:text-purple-400 transition-colors">
                    <span className="text-xs font-mono font-bold">→</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900/10 flex items-center justify-center font-bold">
                      <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded-full uppercase ${style.badgeBg}`}>
                      {style.badgeText}
                    </span>
                  </div>

                  <h4 className="text-xs font-black tracking-tight line-clamp-1 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[11px] opacity-80 leading-snug line-clamp-2">
                    {step.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-900/10 flex items-center justify-between text-[10px] font-mono opacity-90">
                  <span className="flex items-center gap-1 font-semibold">
                    <StatusIcon className="w-3.5 h-3.5" />
                    {step.latencyMs !== undefined ? `${step.latencyMs} ms` : '—'}
                  </span>
                  <span className="font-bold underline group-hover:translate-x-0.5 transition-transform">
                    Detail →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Summary Legend */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Dokončeno
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" /> Běží AI
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Vyžaduje schválení
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Čeká
          </span>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Klikněte na libovolný uzel pro zobrazení 0-PII sanitizovaného detailu.
        </div>
      </div>
    </div>
  );
};
