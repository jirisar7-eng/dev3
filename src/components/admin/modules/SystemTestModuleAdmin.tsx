import React, { useState } from 'react';
import { useModules } from '../../../context/ModuleContext';
import { useAuth } from '../../../context/AuthContext';
import { TestTube, Play, CheckCircle2, AlertTriangle, ShieldCheck, Settings, RefreshCw, Cpu } from 'lucide-react';

export const SystemTestModuleAdmin: React.FC = () => {
  const { isModuleEnabled, getModuleConfig, modules } = useModules();
  const { currentUser } = useAuth();
  const [testResult, setTestResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const moduleKey = 'system-test-module';
  const enabled = isModuleEnabled(moduleKey);
  const config = getModuleConfig<any>(moduleKey) || {
    maxRequestsPerMin: 100,
    debugMode: true,
    apiEndpointUrl: 'https://test.api',
  };
  const moduleData = modules.find((m) => m.key === moduleKey);

  const handleRunApiTest = async () => {
    setLoading(true);
    setTestError(null);
    setTestResult(null);

    try {
      const token = localStorage.getItem('tatovacesta_auth_token');
      const res = await fetch('/api/modules/system-test-module/run-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          triggeredBy: currentUser?.email || 'Admin',
          timestamp: new Date().toISOString(),
          configUsed: config,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestError(data.error || 'Chyba při spouštění testovací akce modulu.');
      } else {
        setTestResult(data);
      }
    } catch (err: any) {
      setTestError('Chyba sítě při volání API modulu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <TestTube className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">System Test Module</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 rounded-md">
                Technický Testovací Modul
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Demonstrační modul pro verifikaci Module Engine, RBAC a dynamických konfigurací.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {enabled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ENABLED (Aktivní)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              DISABLED (Deaktivováno)
            </span>
          )}
        </div>
      </div>

      {/* Warning if disabled */}
      {!enabled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Modul je momentálně vypnutý (DISABLED)</p>
            <p className="mt-1 text-amber-800">
              Veškeré veřejné i chráněné API endpointy tohoto modulu jsou zablokovány. Pro spuštění testů modul nejdříve aktivujte v přehledu modulů nahoru.
            </p>
          </div>
        </div>
      )}

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module Metadata Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Cpu className="w-4 h-4 text-indigo-600" />
            Registrační Metadata
          </div>
          <div className="text-xs space-y-1 text-slate-600 font-mono">
            <p><span className="text-slate-400">Key:</span> {moduleData?.key || moduleKey}</p>
            <p><span className="text-slate-400">Verze:</span> {moduleData?.version || '1.0.0'}</p>
            <p><span className="text-slate-400">Typ:</span> {moduleData?.public ? 'Veřejný' : 'Privátní / Interní'}</p>
          </div>
        </div>

        {/* RBAC Permissions Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Vlastní Oprávnění (RBAC)
          </div>
          <div className="text-xs space-y-1">
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px] mr-1">
              systemtest.read
            </span>
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px]">
              systemtest.manage
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Uživatel: {currentUser?.role || 'Anonym'}</p>
          </div>
        </div>

        {/* Config Display Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Settings className="w-4 h-4 text-purple-600" />
            Aktuální Konfigurace
          </div>
          <div className="text-xs space-y-1 font-mono text-slate-600">
            <p><span className="text-slate-400">maxReq/min:</span> {config.maxRequestsPerMin ?? 100}</p>
            <p><span className="text-slate-400">debugMode:</span> {config.debugMode ? 'true' : 'false'}</p>
            <p><span className="text-slate-400">URL:</span> {config.apiEndpointUrl || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Action / Test Execution */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Ověřit funkčnost Module Contract & API</h4>
            <p className="text-xs text-slate-500">
              Odeslat požadavek na `/api/modules/system-test-module/run-test`
            </p>
          </div>

          <button
            onClick={handleRunApiTest}
            disabled={loading || !enabled}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
              !enabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Spustit testovací požadavek
          </button>
        </div>

        {/* Test Error */}
        {testError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-mono">
            <strong>❌ Chyba testu:</strong> {testError}
          </div>
        )}

        {/* Test Result JSON Output */}
        {testResult && (
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Testovací akce proběhla úspěšně! Výstup z Module Engine:
            </p>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
