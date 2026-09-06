import React from 'react';
import { ExperimentalFeatureStatus } from '../../types/experimental';
import { FlaskConical, AlertTriangle, Sparkles, Clock, CheckCircle2, Info } from 'lucide-react';

interface ExperimentBannerProps {
  status: ExperimentalFeatureStatus;
  featureName?: string;
  customNote?: string;
  className?: string;
}

export const ExperimentBanner: React.FC<ExperimentBannerProps> = ({
  status,
  featureName,
  customNote,
  className = '',
}) => {
  if (status === 'READY') {
    return (
      <div className={`rounded-2xl bg-emerald-50/80 border border-emerald-200 p-4 text-emerald-900 flex items-start gap-3 ${className}`}>
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="block text-emerald-950 font-bold mb-0.5">
            🟢 Plně funkční produkční modul {featureName ? `(${featureName})` : ''}
          </strong>
          <span>Tato funkce disponuje plnohodnotným backendovým zpracováním a ověřenou integritou.</span>
        </div>
      </div>
    );
  }

  if (status === 'BETA') {
    return (
      <div className={`rounded-2xl bg-blue-50/80 border border-blue-200 p-4 text-blue-900 flex items-start gap-3 ${className}`}>
        <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="block text-blue-950 font-bold mb-0.5">
            🔵 BETA režim — Experimentální produkce {featureName ? `(${featureName})` : ''}
          </strong>
          <span>
            {customNote || 'Funkce je aktivní a pracuje se skutečnými daty, avšak její rozhraní a parametry mohou podléhat průběžnému ladění.'}
          </span>
        </div>
      </div>
    );
  }

  if (status === 'EXPERIMENT') {
    return (
      <div className={`rounded-2xl bg-amber-50/90 border-2 border-amber-300 p-4 text-amber-950 flex items-start gap-3 shadow-xs ${className}`}>
        <FlaskConical className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs leading-relaxed">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[11px] bg-amber-200/80 px-2 py-0.5 rounded-md">
              🟠 EXPERIMENT
            </span>
            <strong className="text-amber-950 font-bold">
              Rozhraní je připravené. Backendová funkce se připravuje.
            </strong>
          </div>
          <p className="text-amber-900/90">
            {customNote || 'Tato obrazovka představuje funkční návrh uživatelského rozhraní. Backendová logika a datové napojení jsou ve vývoji. Aplikace nepoužívá falešná data k simulaci dokončeného procesu.'}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'PLANNED') {
    return (
      <div className={`rounded-2xl bg-slate-50 border border-slate-300 p-4 text-slate-800 flex items-start gap-3 ${className}`}>
        <Clock className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] bg-slate-200 px-2 py-0.5 rounded-md">
              ⚪ PLÁNOVÁNO
            </span>
            <strong className="text-slate-900 font-bold">
              Architektonický koncept {featureName ? `(${featureName})` : ''}
            </strong>
          </div>
          <p className="text-slate-600">
            {customNote || 'Funkce je ve fázi metodického a technického návrhu. Backend ani finální UI zatím nejsou implementovány.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-900 flex items-start gap-3 ${className}`}>
      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
      <div className="text-xs leading-relaxed">
        <strong className="block text-rose-950 font-bold mb-0.5">
          🔴 Dočasná nedostupnost funkce {featureName ? `(${featureName})` : ''}
        </strong>
        <span>
          {customNote || 'Funkce existuje v repozitáři, ale v současném runtime prostředí není plně provozuschopná.'}
        </span>
      </div>
    </div>
  );
};
