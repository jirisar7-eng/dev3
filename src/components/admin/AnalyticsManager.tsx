import React, { useEffect, useState } from 'react';
import { AdminAnalyticsStats } from '../../types';
import {
  BarChart2,
  Users,
  Eye,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Search,
  CheckCircle2,
  Layers,
  Save,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';

export const AnalyticsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'real' | 'simulation'>('real');
  const [data, setData] = useState<AdminAnalyticsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for simulation settings
  const [formSettings, setFormSettings] = useState({
    publicStatsEnabled: true,
    simulatedActivityEnabled: false,
    simulationMultiplier: 1.0,
    simulationMin: 0,
    simulationMax: 5,
    simulationTimeWindow: 15,
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/admin-stats');
      if (res.ok) {
        const json: AdminAnalyticsStats = await res.json();
        setData(json);
        if (json.settings) {
          setFormSettings({
            publicStatsEnabled: json.settings.publicStatsEnabled,
            simulatedActivityEnabled: json.settings.simulatedActivityEnabled,
            simulationMultiplier: json.settings.simulationMultiplier,
            simulationMin: json.settings.simulationMin,
            simulationMax: json.settings.simulationMax,
            simulationTimeWindow: json.settings.simulationTimeWindow,
          });
        }
      } else {
        setErrorMessage('Chyba při načítání analytických dat z administrátorského rozhraní.');
      }
    } catch (err) {
      setErrorMessage('Nepodařilo se připojit k analytickému backendu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSaveSettings = async (override?: Partial<typeof formSettings>) => {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const payload = override ? { ...formSettings, ...override } : formSettings;

      const res = await fetch('/api/analytics/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setSuccessMessage('Nastavení analytiky a simulace bylo úspěšně uloženo.');
        if (override) {
          setFormSettings((prev) => ({ ...prev, ...override }));
        }
        fetchStats();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Uložení nastavení selhalo.');
      }
    } catch (err) {
      setErrorMessage('Chyba při komunikaci se serverem při ukládání nastavení.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDisableSimulationImmediate = () => {
    handleSaveSettings({ simulatedActivityEnabled: false });
  };

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
          <span className="text-sm font-semibold text-slate-600">Načítání autentických analytických dat...</span>
        </div>
      </div>
    );
  }

  const real = data?.real;
  const sim = data?.simulation;
  const pub = data?.publicDisplay;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Privacy-First & Zero-PII Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Analytika a Návštěvnost Portálu
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Systém pro sledování reálného využívání portálu s absolutním oddělením od prezentační simulace. Reálná data
            jsou vždy 100% autentická a nemaskovaná.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            Obnovit data
          </button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('real')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'real'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>1. Reálná analytická data (Nemaskovaná)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'simulation'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Veřejná prezentace & Simulace</span>
          {formSettings.simulatedActivityEnabled && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* TAB 1: REAL DATA */}
      {activeTab === 'real' && real && (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Aktivní nyní
              </span>
              <div className="text-2xl font-black text-slate-900">{real.activeVisitorsNow}</div>
              <span className="text-[10px] text-slate-400">okno 15 minut</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Návštěvy dnes
              </span>
              <div className="text-2xl font-black text-slate-900">{real.visitsToday}</div>
              <span className="text-[10px] text-slate-400">relací od půlnoci</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                Unikátní lidé
              </span>
              <div className="text-2xl font-black text-slate-900">{real.uniqueVisitorsToday}</div>
              <span className="text-[10px] text-slate-400">dnes</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Návštěvy včera
              </span>
              <div className="text-2xl font-black text-slate-900">{real.visitsYesterday}</div>
              <span className="text-[10px] text-slate-400">předchozí den</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Posledních 7 dní
              </span>
              <div className="text-2xl font-black text-slate-900">{real.visitsLast7Days}</div>
              <span className="text-[10px] text-slate-400">týdenní souhrn</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Posledních 30 dní
              </span>
              <div className="text-2xl font-black text-slate-900">{real.visitsLast30Days}</div>
              <span className="text-[10px] text-slate-400">měsíční souhrn</span>
            </div>
          </div>

          {/* User Type & Page Views Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Zobrazení stránek (Page Views)
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Aktivita obsahu</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-900">{real.pageViewsToday}</span>
                  <span className="text-xs text-slate-500 font-semibold">dnes ({real.pageViewsTotal} celkem)</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                Průměrně {(real.visitsToday > 0 ? (real.pageViewsToday / real.visitsToday).toFixed(1) : 0)} stránek na
                relaci
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Typ uživatelů dnes
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Anonymní vs Přihlášení</h3>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Anonymní návštěvníci</span>
                    <strong className="text-slate-900">{real.anonymousVisitsToday}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 font-medium">Registrovaní otcové / uživatelé</span>
                    <strong className="text-blue-900">{real.registeredVisitsToday}</strong>
                  </div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 flex">
                <div
                  className="bg-slate-400 h-full"
                  style={{
                    width: `${
                      real.visitsToday > 0
                        ? Math.round((real.anonymousVisitsToday / real.visitsToday) * 100)
                        : 50
                    }%`,
                  }}
                ></div>
                <div
                  className="bg-blue-600 h-full"
                  style={{
                    width: `${
                      real.visitsToday > 0
                        ? Math.round((real.registeredVisitsToday / real.visitsToday) * 100)
                        : 50
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Úspěšnost interaktivních nástrojů
                </span>
                <h3 className="text-xl font-black text-slate-900 mb-2">Dokončené průchody</h3>
                <div className="space-y-1 mt-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span>Dokončeno:</span>
                    <strong className="text-emerald-700">{real.completedFeaturesCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>Opuštěno / Nedokončeno:</span>
                    <strong className="text-slate-500">{real.uncompletedFeaturesCount}</strong>
                  </div>
                  {real.avgTimeInFeatureSeconds && (
                    <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-100">
                      <span>Průměrný čas v nástroji:</span>
                      <strong className="text-blue-900">{real.avgTimeInFeatureSeconds} s</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-slate-400">
                Měřeno anonymně bez ukládání jakýchkoliv osobních údajů.
              </div>
            </div>
          </div>

          {/* Top Features & Top Sections Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Features */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900">Využití interaktivních nástrojů</h3>
                </div>
                <span className="text-xs text-slate-400 font-semibold">{real.topFeatures.length} modulů</span>
              </div>

              {real.topFeatures.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Zatím žádná data o použití nástrojů.</div>
              ) : (
                <div className="space-y-2.5">
                  {real.topFeatures.map((f) => (
                    <div
                      key={f.featureId}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-xs text-slate-900 block">{f.label}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">{f.featureId}</span>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-xs font-black text-slate-900 block">{f.count}×</span>
                          <span className="text-[10px] text-slate-400">spuštěno</span>
                        </div>
                        <div className="border-l border-slate-200 pl-3">
                          <span className="text-xs font-black text-emerald-700 block">{f.completedCount}×</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">dokončeno</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Sections */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-base font-black text-slate-900">Nejnavštěvovanější sekce portálu</h3>
                </div>
                <span className="text-xs text-slate-400 font-semibold">Top {real.topSections.length}</span>
              </div>

              {real.topSections.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">Zatím žádná data o návštěvnosti stránek.</div>
              ) : (
                <div className="space-y-2">
                  {real.topSections.map((sec, idx) => (
                    <div
                      key={sec.route}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold text-slate-400 w-5">{idx + 1}.</span>
                        <code className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {sec.route}
                        </code>
                      </div>
                      <span className="text-xs font-black text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg">
                        {sec.count} zobrazení
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Searches & Entry/Exit pages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Searches */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-black text-sm">
                <Search className="w-4 h-4 text-blue-600" />
                <span>Vyhledávání ({real.searches.totalCount} celkem)</span>
              </div>

              {real.searches.topQueries.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">Žádné vyhledávací dotazy.</div>
              ) : (
                <div className="space-y-2">
                  {real.searches.topQueries.map((q) => (
                    <div key={q.query} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                      <span className="font-semibold text-slate-800 truncate mr-2">„{q.query}“</span>
                      <strong className="text-blue-900 bg-blue-100/60 px-1.5 py-0.5 rounded shrink-0">{q.count}×</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Entry Pages */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-black text-sm">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Vstupní stránky (Entry pages)</span>
              </div>
              <div className="space-y-2">
                {real.entryPages.map((p) => (
                  <div key={p.route} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                    <code className="font-bold text-slate-800 truncate mr-2">{p.route}</code>
                    <strong className="text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded shrink-0">
                      {p.count}×
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Pages */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-black text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Výstupní stránky (Exit pages)</span>
              </div>
              <div className="space-y-2">
                {real.exitPages.map((p) => (
                  <div key={p.route} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                    <code className="font-bold text-slate-800 truncate mr-2">{p.route}</code>
                    <strong className="text-amber-800 bg-amber-100/60 px-1.5 py-0.5 rounded shrink-0">{p.count}×</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PUBLIC PRESENTATION & SIMULATION SETTINGS */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          {/* Live Transparency Comparison Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">
              <Sliders className="w-4 h-4" />
              <span>Živý srovnávací náhled (Data Integrity Guarantee)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-4">
              Oddělení skutečných statistik od prezentační vrstvy
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed mb-6">
              Simulace slouží výhradně k prezentačním účelům v testovacích či startovních fázích. Simulovaná data{' '}
              <strong>nikdy nezapisují žádné falešné řádky do databáze reálných událostí</strong>. Administrátor má
              vždy k dispozici přesná skutečná čísla.
            </p>

            {/* Live Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  1. Skutečná data (Nemaskovaná)
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Aktivní relace nyní:</span>
                    <strong>{real?.activeVisitorsNow || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Návštěvy dnes:</span>
                    <strong>{real?.visitsToday || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Zobrazení stránek dnes:</span>
                    <strong>{real?.pageViewsToday || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                  2. Simulovaný přídavek {formSettings.simulatedActivityEnabled ? '(Aktivní)' : '(Vypnuto)'}
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">+ Simulovaní návštěvníci:</span>
                    <strong>+{sim?.simulatedActiveVisitors || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">+ Simulované návštěvy dnes:</span>
                    <strong>+{sim?.simulatedVisitsToday || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">+ Simulovaná zobrazení:</span>
                    <strong>+{sim?.simulatedPageViewsToday || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4 bg-white/5 p-3 rounded-xl">
                <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                  3. Co vidí veřejnost
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Aktivní relace:</span>
                    <strong className="text-base text-emerald-400">{pub?.activeVisitorsNow || 1}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Návštěv dnes:</span>
                    <strong className="text-base text-blue-300">{pub?.visitsToday || 0}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Zobrazení stránek:</span>
                    <strong className="text-base text-indigo-300">{pub?.pageViewsToday || 0}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick emergency button */}
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={handleDisableSimulationImmediate}
                disabled={!formSettings.simulatedActivityEnabled || saving}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  formSettings.simulatedActivityEnabled
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
                    : 'bg-white/10 text-slate-400 cursor-not-allowed'
                }`}
              >
                ZOBRAZIT POUZE REÁLNÁ DATA (Vypnout simulaci)
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 pb-3 border-b border-slate-100">
              Konfigurace prezentační simulace
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Toggle: Public Stats Visible */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-xs font-black text-slate-900 block mb-1">
                    Veřejný panel aktivity na portálu
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Zda je widget aktivity zobrazen pro běžné návštěvníky portálu.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setFormSettings((prev) => ({ ...prev, publicStatsEnabled: !prev.publicStatsEnabled }))
                  }
                  className="text-blue-900 hover:text-blue-700 transition-colors"
                >
                  {formSettings.publicStatsEnabled ? (
                    <ToggleRight className="w-8 h-8 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Toggle: Simulation Enabled */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-xs font-black text-slate-900 block mb-1">
                    Simulovaná prezentační aktivita
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Doplňuje matematický odhad k reálným datům pro veřejné zobrazení.
                  </span>
                </div>
                <button
                  onClick={() =>
                    setFormSettings((prev) => ({
                      ...prev,
                      simulatedActivityEnabled: !prev.simulatedActivityEnabled,
                    }))
                  }
                  className="text-blue-900 hover:text-blue-700 transition-colors"
                >
                  {formSettings.simulatedActivityEnabled ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Slider parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Multiplikátor aktivity ({formSettings.simulationMultiplier.toFixed(1)}×)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="10.0"
                  step="0.1"
                  value={formSettings.simulationMultiplier}
                  onChange={(e) =>
                    setFormSettings((prev) => ({
                      ...prev,
                      simulationMultiplier: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Základní škálování intenzity provozu</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Minimální rozsah (nyní: {formSettings.simulationMin})
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formSettings.simulationMin}
                  onChange={(e) =>
                    setFormSettings((prev) => ({
                      ...prev,
                      simulationMin: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-blue-600"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Spodní hranice simulovaných návštěvníků</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Maximální rozsah (nyní: {formSettings.simulationMax})
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formSettings.simulationMax}
                  onChange={(e) =>
                    setFormSettings((prev) => ({
                      ...prev,
                      simulationMax: parseInt(e.target.value) || 5,
                    }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-blue-600"
                />
                <span className="text-[10px] text-slate-400 block mt-1">Horní hranice simulovaných návštěvníků</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Každá změna konfigurace je auditována a zaznamenána do systémového logu.</span>
              </div>

              <button
                onClick={() => handleSaveSettings()}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Ukládání...' : 'Uložit nastavení'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
