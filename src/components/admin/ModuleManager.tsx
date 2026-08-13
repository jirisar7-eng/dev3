import React, { useState } from 'react';
import { useModules } from '../../context/ModuleContext';
import { Module } from '../../types';
import { SystemTestModuleAdmin } from './modules/SystemTestModuleAdmin';
import { Sliders, CheckCircle2, XCircle, Code, Save, RefreshCw, TestTube, Layers, Lock, Globe } from 'lucide-react';

export const ModuleManager: React.FC = () => {
  const { modules, toggleModule, updateModuleConfig, reloadModules } = useModules();
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [activeTestModule, setActiveTestModule] = useState<string | null>(null);
  const [configJson, setConfigJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const filteredModules = modules.filter((mod) => {
    if (filterTab === 'active') return mod.enabled;
    if (filterTab === 'inactive') return !mod.enabled;
    return true;
  });

  const handleOpenConfig = (mod: Module) => {
    setSelectedModule(mod);
    setConfigJson(mod.config);
    setJsonError(null);
  };

  const handleSaveConfig = async () => {
    if (!selectedModule) return;
    try {
      JSON.parse(configJson);
      await updateModuleConfig(selectedModule.key, configJson);
      setSelectedModule(null);
    } catch {
      setJsonError('Chyba v zápisu JSON: Neplatný formát.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-600" />
            Module Manager (Správa modulů)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Architektura rozšiřitelnosti CORE → MODULE ENGINE → MODULES. Umožňuje přidávat moduly bez přepisování jádra.
          </p>
        </div>

        <button
          onClick={() => reloadModules()}
          className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Obnovit moduly
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilterTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterTab === 'all'
              ? 'bg-indigo-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Všechny moduly ({modules.length})
        </button>

        <button
          onClick={() => setFilterTab('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterTab === 'active'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Aktivní ({modules.filter((m) => m.enabled).length})
        </button>

        <button
          onClick={() => setFilterTab('inactive')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            filterTab === 'inactive'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Neaktivní ({modules.filter((m) => !m.enabled).length})
        </button>
      </div>

      {/* Test Module Inspection Area if opened */}
      {activeTestModule === 'system-test-module' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TestTube className="w-4 h-4 text-purple-600" />
              Administrační Obrazovka Testovacího Modulu
            </h3>
            <button
              onClick={() => setActiveTestModule(null)}
              className="px-3 py-1 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg text-xs font-bold"
            >
              Zavřít testovací obrazovku
            </button>
          </div>
          <SystemTestModuleAdmin />
        </div>
      )}

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((mod) => (
          <div
            key={mod.id}
            className={`bg-white rounded-2xl border p-6 shadow-xs flex flex-col justify-between transition-all ${
              mod.enabled ? 'border-blue-300 ring-1 ring-blue-500/20' : 'border-slate-200 opacity-80 bg-slate-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {mod.key}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    v{mod.version}
                  </span>
                </div>

                {/* Status Badge & Toggle */}
                <button
                  onClick={() => toggleModule(mod.key, !mod.enabled)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    mod.enabled
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {mod.enabled ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ENABLED
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      DISABLED
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900">{mod.name}</h3>
                {mod.public ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md shrink-0">
                    <Globe className="w-3 h-3" /> Veřejný
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md shrink-0">
                    <Lock className="w-3 h-3" /> Privátní
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">{mod.description}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
              {mod.key === 'system-test-module' ? (
                <button
                  onClick={() => setActiveTestModule(mod.key === activeTestModule ? null : mod.key)}
                  className="px-2.5 py-1.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <TestTube className="w-3.5 h-3.5" />
                  {activeTestModule === mod.key ? 'Skrýt Test Admin' : 'Otevřít Test Admin'}
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">
                  STAV: {mod.enabled ? 'INSTALLED & ENABLED' : 'INSTALLED & DISABLED'}
                </span>
              )}

              <button
                onClick={() => handleOpenConfig(mod)}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                Konfigurace
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* JSON Config Editor Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Konfigurace modulu: {selectedModule.name}
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                v{selectedModule.version}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Upravte parametry modulu v platném formátu JSON. Konfigurace se ukládá v databázi a je přístupná přes Module Service.
            </p>

            <textarea
              value={configJson}
              onChange={(e) => {
                setConfigJson(e.target.value);
                setJsonError(null);
              }}
              rows={8}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />

            {jsonError && (
              <p className="text-xs text-rose-600 font-bold mt-2">{jsonError}</p>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedModule(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Zrušit
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-semibold hover:bg-indigo-950 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Uložit konfiguraci
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
