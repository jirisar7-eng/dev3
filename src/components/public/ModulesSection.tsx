import React from 'react';
import { useModules } from '../../context/ModuleContext';
import {
  Layers,
  Calculator,
  RefreshCw,
  Calendar,
  FileText,
  Users,
  Bot,
  CheckCircle,
  XCircle,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ModulesSectionProps {
  onNavigate?: (path: string) => void;
}

export const ModulesSection: React.FC<ModulesSectionProps> = ({ onNavigate }) => {
  const { modules } = useModules();

  const getModuleIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Calculator':
        return <Calculator className="w-6 h-6 text-blue-600" />;
      case 'RefreshCw':
        return <RefreshCw className="w-6 h-6 text-indigo-600" />;
      case 'Calendar':
        return <Calendar className="w-6 h-6 text-sky-600" />;
      case 'FileText':
        return <FileText className="w-6 h-6 text-emerald-600" />;
      case 'Users':
        return <Users className="w-6 h-6 text-amber-600" />;
      case 'Bot':
        return <Bot className="w-6 h-6 text-purple-600" />;
      default:
        return <Layers className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <section id="moduly" className="py-16 bg-slate-100/70 border-y border-[var(--color-border,#e2e8f0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Modulární Architektura (Core + Modules)</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight mb-3">
            Modulární systém & Připravované nástroje
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Architektura portálu umožňuje dynamické připojování specializovaných modulů bez nutnosti přepisování jádra (Core). Administrátor může moduly zapínat, vypínat a konfigurovat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            let parsedConfig = {};
            try {
              parsedConfig = JSON.parse(mod.config);
            } catch {
              parsedConfig = {};
            }

            return (
              <div
                key={mod.id}
                className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
                  mod.enabled
                    ? 'border-blue-200 ring-1 ring-blue-500/10'
                    : 'border-slate-200 opacity-75 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/60">
                      {getModuleIcon(mod.icon)}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        v{mod.version}
                      </span>
                      {mod.enabled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Aktivní
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          Vypnuto
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{mod.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{mod.description}</p>
                </div>

                <div>
                  <button
                    onClick={() => {
                      const targetUrl = (mod.key === 'coparent' || mod.key === 'CoParent') ? '/coparent-hub' : `/${mod.key}`;
                      if (onNavigate) onNavigate(targetUrl);
                      else {
                        window.history.pushState({}, '', targetUrl);
                        window.dispatchEvent(new Event('popstate'));
                      }
                    }}
                    className="w-full mb-3 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    Otevřít modul
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <div className="border-t border-slate-100 pt-3 mt-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3 h-3 text-slate-400" />
                        Klíč: {mod.key}
                      </span>
                      <span>Config: {Object.keys(parsedConfig).length} parametrů</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
