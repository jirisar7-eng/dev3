import React from 'react';
import { ExperimentalFeature } from '../../types/experimental';
import { FeatureStatusBadge } from './FeatureStatusBadge';
import { ExperimentBanner } from './ExperimentBanner';
import { ShieldCheck, ArrowLeft, Cpu, FileCode, CheckCircle2, CircleDashed } from 'lucide-react';

interface ComingSoonStateProps {
  feature: ExperimentalFeature;
  onNavigate?: (path: string) => void;
  onBackToLab?: () => void;
}

export const ComingSoonState: React.FC<ComingSoonStateProps> = ({
  feature,
  onNavigate,
  onBackToLab,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      {/* Top back link */}
      <div>
        <button
          type="button"
          onClick={() => (onBackToLab ? onBackToLab() : onNavigate ? onNavigate('/experimenty') : window.history.back())}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět do Experimentální laboratoře</span>
        </button>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Kategorie: {feature.category.toUpperCase()}
              </span>
              {feature.backendCapability && (
                <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                  capability: {feature.backendCapability}
                </span>
              )}
            </div>
            <FeatureStatusBadge status={feature.status} size="lg" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mb-3">
            {feature.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-3xl">
            {feature.description}
          </p>
        </div>

        {/* Banner */}
        <div className="p-6 sm:p-8 space-y-6">
          <ExperimentBanner
            status={feature.status}
            featureName={feature.name}
            customNote={feature.implementationNote.technicalDetails}
          />

          {/* Implementation status comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* What works */}
            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Co aktuálně funguje</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {feature.implementationNote.works.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* In progress or missing */}
            <div className="bg-amber-50/40 rounded-2xl p-5 border border-amber-100">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wider mb-3">
                <CircleDashed className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Ve vývoji / Plánováno</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {feature.implementationNote.inProgressOrMissing.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Security & RBAC boundary declaration */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Bezpečnostní ohraničení Synthesis Hubu</span>
            </div>
            <p>
              Tento modul podléhá striktní serverové autorizaci. Uživatelské rozhraní v žádném případě
              nenahrazuje autorizační autoritu (ControlPlaneAuthorization). Server odmítá neautorizované
              operace zásadou Default DENY.
            </p>
            {feature.requiredRole && (
              <div className="pt-1">
                <span className="text-slate-500">Požadovaná systémová role: </span>
                <strong className="text-slate-900 font-mono bg-slate-200 px-1.5 py-0.5 rounded">
                  {feature.requiredRole}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
