import React from 'react';
import { ExperimentalFeature } from '../../types/experimental';
import { FeatureStatusBadge } from './FeatureStatusBadge';
import { ExperimentBanner } from './ExperimentBanner';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Code,
  Tag,
  ArrowRight,
} from 'lucide-react';

interface ExperimentalFeatureDetailModalProps {
  feature: ExperimentalFeature | null;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const ExperimentalFeatureDetailModal: React.FC<ExperimentalFeatureDetailModalProps> = ({
  feature,
  onClose,
  onNavigate,
}) => {
  if (!feature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                {feature.category.toUpperCase()}
              </span>
              <FeatureStatusBadge status={feature.status} size="sm" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950">
              {feature.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Zavřít detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm text-slate-700">
          <p className="leading-relaxed text-slate-700 font-medium">
            {feature.description}
          </p>

          {/* Status banner */}
          <ExperimentBanner
            status={feature.status}
            featureName={feature.name}
            customNote={feature.implementationNote.technicalDetails}
          />

          {/* Detailed breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Co aktuálně funguje</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {feature.implementationNote.works.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">
                <CircleDashed className="w-4 h-4 text-amber-600" />
                <span>Ve vývoji / Plánováno</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {feature.implementationNote.inProgressOrMissing.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Technical and architectural metadata */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Code className="w-4 h-4 text-blue-700" />
              <span>Technické a architektonické parametry</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                <span className="text-slate-400 block text-[10px]">Cílová URL cesta</span>
                <code className="font-mono text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px]">
                  {feature.route}
                </code>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Backend Capability</span>
                <code className="font-mono text-slate-800 bg-slate-200/70 px-1.5 py-0.5 rounded text-[11px]">
                  {feature.backendCapability || 'none'}
                </code>
              </div>
            </div>

            {feature.requiredRole && (
              <div className="pt-2 border-t border-slate-200 text-slate-600">
                <span className="text-slate-400 block text-[10px]">Oprávnění (RBAC)</span>
                <span className="text-slate-800">
                  Přístup vyžaduje minimálně roli{' '}
                  <strong className="font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                    {feature.requiredRole}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {feature.tags && feature.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {feature.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Zavřít
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate(feature.route);
            }}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Otevřít modul</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
