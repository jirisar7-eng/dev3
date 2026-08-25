import React, { useEffect, useState } from 'react';
import {
  AdminAnalyticsStats,
  AnalyticsTimeRange,
  UserJourneyStats,
  FunnelStats,
  SearchIntelligenceStats,
  FeatureAnalyticsDeepStat,
  UserAnalyticsHistory,
  AnalyticsAiInsightsData,
} from '../../types';
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
  Compass,
  Filter,
  ArrowRight,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  RefreshCw,
  Zap,
  HelpCircle,
  Activity,
  History,
  BrainCircuit,
  PieChart,
} from 'lucide-react';

export const AnalyticsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'journey' | 'funnels' | 'search' | 'zero_results' | 'features' | 'user_history' | 'ai_insights' | 'simulation'
  >('overview');

  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Core Overview Stats
  const [overviewData, setOverviewData] = useState<AdminAnalyticsStats | null>(null);

  // Analytics 2.0 Sub-datasets
  const [journeyData, setJourneyData] = useState<UserJourneyStats | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelStats | null>(null);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>('generator_podani');
  const [searchData, setSearchData] = useState<SearchIntelligenceStats | null>(null);
  const [featureData, setFeatureData] = useState<FeatureAnalyticsDeepStat[]>([]);
  const [aiInsights, setAiInsights] = useState<AnalyticsAiInsightsData | null>(null);

  // User Timeline search state
  const [searchUserId, setSearchUserId] = useState<string>('');
  const [userHistoryData, setUserHistoryData] = useState<UserAnalyticsHistory | null>(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState<boolean>(false);
  const [userHistoryError, setUserHistoryError] = useState<string | null>(null);

  // Simulation settings form state
  const [formSettings, setFormSettings] = useState({
    publicStatsEnabled: true,
    simulatedActivityEnabled: false,
    simulationMultiplier: 1.0,
    simulationMin: 0,
    simulationMax: 5,
    simulationTimeWindow: 15,
  });

  const fetchOverviewStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/admin-stats');
      if (res.ok) {
        const json: AdminAnalyticsStats = await res.json();
        setOverviewData(json);
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
        setErrorMessage('Chyba při načítání základních analytických dat.');
      }
    } catch {
      setErrorMessage('Nepodařilo se připojit k analytickému backendu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJourneyStats = async () => {
    try {
      const res = await fetch(`/api/analytics/admin/journey?timeRange=${timeRange}`);
      if (res.ok) {
        const json: UserJourneyStats = await res.json();
        setJourneyData(json);
      }
    } catch {
      console.warn('Failed to load user journey data');
    }
  };

  const fetchFunnelStats = async (fid = selectedFunnelId) => {
    try {
      const res = await fetch(`/api/analytics/admin/funnels?funnelId=${fid}&timeRange=${timeRange}`);
      if (res.ok) {
        const json: FunnelStats = await res.json();
        setFunnelData(json);
      }
    } catch {
      console.warn('Failed to load funnel data');
    }
  };

  const fetchSearchStats = async () => {
    try {
      const res = await fetch(`/api/analytics/admin/search-intelligence?timeRange=${timeRange}`);
      if (res.ok) {
        const json: SearchIntelligenceStats = await res.json();
        setSearchData(json);
      }
    } catch {
      console.warn('Failed to load search stats');
    }
  };

  const fetchFeatureStats = async () => {
    try {
      const res = await fetch(`/api/analytics/admin/features?timeRange=${timeRange}`);
      if (res.ok) {
        const json: FeatureAnalyticsDeepStat[] = await res.json();
        setFeatureData(json);
      }
    } catch {
      console.warn('Failed to load feature stats');
    }
  };

  const fetchAiInsights = async () => {
    try {
      const res = await fetch(`/api/analytics/admin/ai-insights-data?timeRange=${timeRange}`);
      if (res.ok) {
        const json: AnalyticsAiInsightsData = await res.json();
        setAiInsights(json);
      }
    } catch {
      console.warn('Failed to load AI insights data');
    }
  };

  // Load all analytics modules on mount and timeRange change
  useEffect(() => {
    fetchOverviewStats();
    fetchJourneyStats();
    fetchFunnelStats();
    fetchSearchStats();
    fetchFeatureStats();
    fetchAiInsights();
  }, [timeRange]);

  const handleSearchUserHistory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchUserId.trim()) {
      setUserHistoryError('Zadejte prosím platné ID uživatele.');
      return;
    }

    try {
      setUserHistoryLoading(true);
      setUserHistoryError(null);
      const res = await fetch(`/api/analytics/admin/users/${encodeURIComponent(searchUserId.trim())}/history?timeRange=${timeRange}`);
      if (res.ok) {
        const json: UserAnalyticsHistory = await res.json();
        setUserHistoryData(json);
      } else {
        const err = await res.json().catch(() => ({}));
        setUserHistoryError(err.error || 'Uživatel nenalezen nebo pro něj neexistují žádné analytické záznamy.');
        setUserHistoryData(null);
      }
    } catch {
      setUserHistoryError('Chyba při komunikaci se serverem při vyhledávání historie.');
      setUserHistoryData(null);
    } finally {
      setUserHistoryLoading(false);
    }
  };

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
        setSuccessMessage('Nastavení analytiky a simulace bylo úspěšně uloženo.');
        if (override) {
          setFormSettings((prev) => ({ ...prev, ...override }));
        }
        fetchOverviewStats();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Uložení nastavení selhalo.');
      }
    } catch {
      setErrorMessage('Chyba při komunikaci se serverem při ukládání nastavení.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const handleDisableSimulationImmediate = () => {
    handleSaveSettings({ simulatedActivityEnabled: false });
  };

  if (loading && !overviewData) {
    return (
      <div className="min-h-[400px] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
          <span className="text-sm font-semibold text-slate-600">Načítání analytického dashboardu 2.0...</span>
        </div>
      </div>
    );
  }

  const real = overviewData?.real;
  const sim = overviewData?.simulation;
  const pub = overviewData?.publicDisplay;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Analytics 2.0 • User Journey & Search Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Analytika a Návštěvnost Portálu
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sledování reálného chování návštěvníků, konverzních trychtýřů, vyhledávání a funkčních mezer s absolutním
            dodržením Zero-PII soukromí.
          </p>
        </div>

        {/* Global Time Range Filter */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          <span className="text-xs font-semibold text-slate-600 mr-1 hidden sm:inline">Období:</span>
          {(
            [
              { id: 'today', label: 'Dnes' },
              { id: '7d', label: '7 dní' },
              { id: '30d', label: '30 dní' },
              { id: 'all', label: 'Vše' },
            ] as { id: AnalyticsTimeRange; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === t.id
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => {
              fetchOverviewStats();
              fetchJourneyStats();
              fetchFunnelStats();
              fetchSearchStats();
              fetchFeatureStats();
              fetchAiInsights();
            }}
            title="Aktualizovat data"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: '1. Přehled & Realita', icon: BarChart2 },
          { id: 'journey', label: '2. User Journey (Cesty)', icon: Compass },
          { id: 'funnels', label: '3. Konverzní Funnels', icon: Filter },
          { id: 'search', label: '4. Vyhledávání', icon: Search },
          { id: 'zero_results', label: '5. Hledání bez výsledku', icon: HelpCircle },
          { id: 'features', label: '6. Nástroje & Moduly', icon: Layers },
          { id: 'user_history', label: '7. Uživatelé & Historie', icon: UserCheck },
          { id: 'ai_insights', label: '8. AI Příprava & Mezery', icon: BrainCircuit },
          { id: 'simulation', label: '9. Nastavení & Simulace', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                isActive
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && real && (
        <div className="space-y-6">
          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivní právě teď</span>
                <span className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100">
                  <Activity className="w-5 h-5 animate-pulse" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{real.activeVisitorsNow}</span>
                <span className="text-xs text-slate-500 font-medium">posledních 15 min</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Unikátních aktivních relací v reálném čase</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Návštěvy dnes</span>
                <span className="p-2.5 bg-blue-50 rounded-2xl text-blue-900 border border-blue-100">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{real.visitsToday}</span>
                <span className="text-xs text-slate-500 font-medium">relací</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                <span>Anonymní: {real.anonymousVisitsToday}</span>
                <span>Registrovaní: {real.registeredVisitsToday}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zobrazení stránek</span>
                <span className="p-2.5 bg-purple-50 rounded-2xl text-purple-700 border border-purple-100">
                  <Eye className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{real.pageViewsToday}</span>
                <span className="text-xs text-slate-500 font-medium">dnes</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Celkem v historii: {real.pageViewsTotal}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Úspěšnost nástrojů</span>
                <span className="p-2.5 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100">
                  <TrendingUp className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{real.completedFeaturesCount}</span>
                <span className="text-xs text-slate-500 font-medium">dokončení</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Průměrný čas: {real.avgTimeInFeatureSeconds ? `${real.avgTimeInFeatureSeconds}s` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Real vs Public Comparison Banner */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Dual-View Architecture
                  </span>
                  <span className="text-xs text-slate-400">
                    Simulace veřejné aktivity:{' '}
                    <strong className={sim?.enabled ? 'text-amber-400' : 'text-emerald-400'}>
                      {sim?.enabled ? 'AKTIVNÍ' : 'VYPNUTÁ'}
                    </strong>
                  </span>
                </div>
                <h3 className="text-lg font-black mt-1">Porovnání: Reálná data vs. Veřejný widget</h3>
              </div>
              {sim?.enabled && (
                <button
                  onClick={handleDisableSimulationImmediate}
                  className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors flex items-center gap-2"
                >
                  <ToggleLeft className="w-4 h-4" />
                  Okamžitý Killswitch simulace
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Aktivní (Realita / Widget):</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {real.activeVisitorsNow} <span className="text-slate-400">/</span> {pub?.activeVisitorsNow}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Návštěvy dnes (Realita / Widget):</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {real.visitsToday} <span className="text-slate-400">/</span> {pub?.visitsToday}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Zobrazení stránek (Realita / Widget):</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {real.pageViewsToday} <span className="text-slate-400">/</span> {pub?.pageViewsToday}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Využití nástrojů (Realita / Widget):</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {real.completedFeaturesCount} <span className="text-slate-400">/</span> {pub?.featureUsesToday}
                </p>
              </div>
            </div>
          </div>

          {/* Section & Feature Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Sections */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-blue-900" />
                Nejnavštěvovanější sekce portálu
              </h3>
              <div className="space-y-3">
                {real.topSections.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Zatím žádná zaznamenaná data.</p>
                ) : (
                  real.topSections.map((sec, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-900 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <code className="text-xs font-semibold text-slate-800">{sec.route}</code>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
                        {sec.count} zobrazení
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Features */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-500" />
                Využívání interaktivních nástrojů
              </h3>
              <div className="space-y-3">
                {real.topFeatures.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">Zatím žádné spuštění nástrojů.</p>
                ) : (
                  real.topFeatures.map((feat, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{feat.label}</span>
                        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {feat.completedCount} dokončeno
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Otevření: {feat.count}</span>
                        <span>
                          Úspěšnost:{' '}
                          {feat.count > 0 ? `${Math.round((feat.completedCount / feat.count) * 100)} %` : '0 %'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER JOURNEY */}
      {activeTab === 'journey' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-blue-900" />
              Rekonstrukce cest návštěvníků (User Journey)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Agregovaná analýza anonymních průchodů webem: vstupní a výstupní stránky, tranzice a nejčastější sekvence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Analyzovaných relací</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{journeyData?.totalSessionsAnalyzed || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Průměrně kroků na návštěvu</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{journeyData?.avgStepsPerSession || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Průměrná délka session</span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {journeyData?.avgSessionDurationSeconds
                    ? `${Math.floor(journeyData.avgSessionDurationSeconds / 60)}m ${journeyData.avgSessionDurationSeconds % 60}s`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entry Pages */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-600" />
                Nejčastější vstupní stránky (Landing pages)
              </h4>
              <div className="space-y-2">
                {journeyData?.entryPages.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                    <code className="font-bold text-slate-800">{entry.route}</code>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">{entry.count}×</span>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                        {entry.percentage} %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exit Pages */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-rose-600" />
                Nejčastější výstupní stránky (Exit pages)
              </h4>
              <div className="space-y-2">
                {journeyData?.exitPages.map((exit, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                    <code className="font-bold text-slate-800">{exit.route}</code>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-500">{exit.count}×</span>
                      <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold">
                        {exit.percentage} %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top User Journey Paths */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-900" />
              Nejčastější kompletní sekvence (Top Flow Paths)
            </h4>
            <div className="space-y-3">
              {journeyData?.topPaths.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-800">
                    {p.path.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <span className="px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
                          {step}
                        </span>
                        {sIdx < p.path.length - 1 && <ArrowRight className="w-3 h-3 text-slate-400" />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <span className="text-xs text-slate-500 font-bold">{p.count} relací</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-black">
                      {p.percentage} %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FUNNEL ANALYTICS */}
      {activeTab === 'funnels' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-900" />
                Konverzní trychtýře (Funnel Analytics)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Krok za krokem analýza dokončení a opuštění klíčových generátorů a formulářů.
              </p>
            </div>

            {/* Funnel Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Zvolit funkci:</span>
              <select
                value={selectedFunnelId}
                onChange={(e) => {
                  setSelectedFunnelId(e.target.value);
                  fetchFunnelStats(e.target.value);
                }}
                className="bg-slate-50 border border-slate-300 rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              >
                <option value="generator_podani">Generátor podání k soudu</option>
                <option value="alimony_calculator">Kalkulačka výživného</option>
                <option value="care_simulator">Plánovač střídavé péče</option>
                <option value="consultation_booking">Rezervace konzultace</option>
              </select>
            </div>
          </div>

          {/* Funnel Summary Header */}
          {funnelData && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">Zahájení trychtýře</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{funnelData.totalStarts}</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">Dokončení trychtýře</span>
                <p className="text-2xl font-black text-emerald-700 mt-1">{funnelData.totalCompletions}</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">Míra dokončení (Completion Rate)</span>
                <p className="text-2xl font-black text-blue-900 mt-1">{funnelData.completionRate} %</p>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">Míra opuštění (Abandonment)</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{funnelData.abandonmentRate} %</p>
              </div>
            </div>
          )}

          {/* Funnel Step-by-Step Visualization */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-6">
              Průchod jednotlivými kroky: {funnelData?.title}
            </h4>

            {funnelData?.biggestDropOffStep && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-900 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <strong className="font-bold">Kritické místo odchodu (Drop-off bottleneck):</strong> Největší
                  procento uživatelů ({funnelData.biggestDropOffStep.dropOffRate} %, tj.{' '}
                  {funnelData.biggestDropOffStep.dropOffCount} uživatelů) opouští proces v kroku č.{' '}
                  {funnelData.biggestDropOffStep.stepIndex} ({funnelData.biggestDropOffStep.stepName}).
                </div>
              </div>
            )}

            <div className="space-y-6">
              {funnelData?.steps.map((step, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center text-xs">
                        {step.stepIndex}
                      </span>
                      <span className="text-slate-900 text-sm font-bold">{step.stepName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span>{step.count} uživatelů</span>
                      <span className="text-blue-900 font-bold">({step.conversionFromFirstStep} % z celku)</span>
                      {step.dropOffCount > 0 && (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                          - {step.dropOffCount} odchodů ({step.dropOffRate} %)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-900 h-full transition-all duration-500 rounded-l-full"
                      style={{ width: `${Math.max(2, step.conversionFromFirstStep)}%` }}
                    ></div>
                    {step.dropOffRate > 0 && (
                      <div
                        className="bg-rose-400 h-full opacity-60"
                        style={{ width: `${Math.max(1, (step.dropOffCount / (funnelData.totalStarts || 1)) * 100)}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEARCH INTELLIGENCE */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-900" />
              Search Intelligence (Analýza vyhledávání)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Statistika hledaných právních výrazů a judikatury v portálu. Dotazy jsou striktně sanitizovány bez PII.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Celkem hledání</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{searchData?.totalSearches || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Unikátních výrazů</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{searchData?.uniqueQueriesCount || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Průměrně výsledků</span>
                <p className="text-2xl font-black text-slate-900 mt-1">{searchData?.avgResultsCount || 0}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Podíl bez výsledku</span>
                <p className="text-2xl font-black text-rose-600 mt-1">{searchData?.zeroResultsRate || 0} %</p>
              </div>
            </div>
          </div>

          {/* Top Search Queries Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 mb-4">Nejčastější vyhledávané výrazy</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <th className="pb-3">Hledaný výraz</th>
                    <th className="pb-3">Počet hledání</th>
                    <th className="pb-3">Průměr výsledků</th>
                    <th className="pb-3">Stav výsledků</th>
                    <th className="pb-3">Naposledy hledáno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchData?.topQueries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Zatím žádné vyhledávací dotazy.
                      </td>
                    </tr>
                  ) : (
                    searchData?.topQueries.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-bold text-slate-900">"{q.query}"</td>
                        <td className="py-3 font-semibold text-slate-700">{q.count}×</td>
                        <td className="py-3 text-slate-600">{q.resultsCountAvg}</td>
                        <td className="py-3">
                          {q.hasResults ? (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">
                              Nalezeno
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md font-bold">
                              0 výsledků
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(q.lastSearchedAt).toLocaleString('cs-CZ')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ZERO RESULTS (Hledání bez výsledku) */}
      {activeTab === 'zero_results' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Obsahové mezery (Content Gaps)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900">Dotazy s nulovým výsledkem (Zero-Result Searches)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Přehled dotazů, které uživatelé na portálu hledají, ale systém pro ně nenašel žádný relevantní judikát,
              článek ani vzor. Klíčový podklad pro rozvoj obsahu portálu.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <th className="pb-3">Hledaný dotaz</th>
                    <th className="pb-3">Počet neúspěšných hledání</th>
                    <th className="pb-3">Doporučená akce administrátora</th>
                    <th className="pb-3">Naposledy hledáno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchData?.zeroResultQueries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Skvělá zpráva! V tomto období nebyly zaznamenány žádné neúspěšné vyhledávací dotazy.
                      </td>
                    </tr>
                  ) : (
                    searchData?.zeroResultQueries.map((zq, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 font-bold text-rose-900">"{zq.query}"</td>
                        <td className="py-3 font-black text-slate-900">{zq.count}×</td>
                        <td className="py-3 text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-100">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Doplnit článek / vzor k tématu "{zq.query}"
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(zq.lastSearchedAt).toLocaleString('cs-CZ')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FEATURES DEEP ANALYTICS */}
      {activeTab === 'features' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-900" />
              Kompletní analytika modulů a interaktivních nástrojů
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Podrobný přehled využití jednotlivých funkcí portálu, průměrná doba práce a míra dokončení.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <th className="pb-3">Nástroj / Modul</th>
                    <th className="pb-3">Otevření</th>
                    <th className="pb-3">Interakce</th>
                    <th className="pb-3">Dokončení</th>
                    <th className="pb-3">Míra dokončení</th>
                    <th className="pb-3">Průměrný čas</th>
                    <th className="pb-3">Unikátní uživatelé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {featureData.map((f, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">
                        {f.label}
                        <code className="block text-2xs text-slate-400 font-normal">{f.featureId}</code>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700">{f.openCount}</td>
                      <td className="py-3.5 text-slate-600">{f.useCount}</td>
                      <td className="py-3.5 font-bold text-emerald-700">{f.completeCount}</td>
                      <td className="py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold ${
                            f.completionRate >= 50
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {f.completionRate} %
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {f.avgDurationSeconds > 0 ? `${f.avgDurationSeconds}s` : 'N/A'}
                      </td>
                      <td className="py-3.5 text-slate-600 font-semibold">{f.uniqueUsersCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: USER TIMELINE & INDIVIDUAL HISTORY */}
      {activeTab === 'user_history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Audited Administrative Feature (RBAC Restricted)
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900">Časová osa konkrétního uživatele</h3>
            <p className="text-xs text-slate-500 mt-1">
              Umožňuje administrátorovi prověřit anonymizovanou časovou osu relací registrovaného uživatele. Každý dotaz
              je povinně zaznamenán do auditního logu.
            </p>

            {/* Search Input */}
            <form onSubmit={handleSearchUserHistory} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Zadejte ID registrovaného uživatele (např. usr-12345)..."
                value={searchUserId}
                onChange={(e) => setSearchUserId(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-900"
              />
              <button
                type="submit"
                disabled={userHistoryLoading}
                className="px-5 py-2.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-2"
              >
                {userHistoryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Zobrazit historii
              </button>
            </form>
          </div>

          {userHistoryError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {userHistoryError}
            </div>
          )}

          {userHistoryData && (
            <div className="space-y-6">
              {/* User Summary Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase">Uživatel</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{userHistoryData.userId}</p>
                </div>
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase">Celkem relací</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{userHistoryData.totalSessions}</p>
                </div>
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase">Celkem událostí</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{userHistoryData.totalEvents}</p>
                </div>
                <div>
                  <span className="text-2xs font-bold text-slate-400 uppercase">První / Poslední návštěva</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {new Date(userHistoryData.firstSeenAt).toLocaleDateString('cs-CZ')} -{' '}
                    {new Date(userHistoryData.lastSeenAt).toLocaleDateString('cs-CZ')}
                  </p>
                </div>
              </div>

              {/* Timeline list */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-900" />
                  Časová osa událostí (Chronologicky od nejnovějších)
                </h4>
                <div className="space-y-3">
                  {userHistoryData.timeline.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{item.safeDescription}</span>
                          <span className="text-2xs px-2 py-0.5 bg-blue-100 text-blue-900 font-bold rounded-md">
                            {item.eventType}
                          </span>
                        </div>
                        <code className="text-2xs text-slate-500">{item.route}</code>
                      </div>
                      <span className="text-2xs text-slate-400 font-medium whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString('cs-CZ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: AI INSIGHTS DATA PREPARATION */}
      {activeTab === 'ai_insights' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" />
                Aggregated AI-Ready Data Layer
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900">Příprava pro AI Studio & Automatická doporučení</h3>
            <p className="text-xs text-slate-500 mt-1">
              Bezpečně agregovaná data připravená pro budoucí lokální nebo AI analýzu. Žádná surová uživatelská data
              nejsou odesílána externím službám.
            </p>
          </div>

          {aiInsights && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Content Gaps */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Identifikované obsahové mezery
                </h4>
                <div className="space-y-2">
                  {aiInsights.missingContentTopics.length === 0 ? (
                    <p className="text-xs text-slate-500">Žádné identifikované mezery.</p>
                  ) : (
                    aiInsights.missingContentTopics.map((m, idx) => (
                      <div key={idx} className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs">
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span>Téma: "{m.topic}"</span>
                          <span>{m.queryCount} neúspěšných hledání</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Funnel Bottlenecks */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Kritická místa procesů (Bottlenecks)
                </h4>
                <div className="space-y-2">
                  {aiInsights.funnelBottlenecks.length === 0 ? (
                    <p className="text-xs text-slate-500">Žádné kritické bottlenecks nebyly detekovány.</p>
                  ) : (
                    aiInsights.funnelBottlenecks.map((b, idx) => (
                      <div key={idx} className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs space-y-1">
                        <div className="font-bold text-rose-900">
                          {b.funnelTitle} → Krok "{b.dropOffStep}" ({b.dropOffPercentage} % odchodů)
                        </div>
                        <p className="text-slate-600 font-medium">{b.recommendation}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 9: SIMULATION SETTINGS */}
      {activeTab === 'simulation' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-900" />
              Nastavení a Správa Prezentační Simulace
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simulace slouží výhradně pro veřejný widget na hlavní stránce. Změna těchto hodnot nikdy neovlivní ani
              nezapíše falešné řádky do databáze reálných událostí.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            {/* Toggle Switches */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Zobrazovat widget aktivity na portálu</h4>
                  <p className="text-2xs text-slate-500">Povolí nebo skryje spodní informační panel pro veřejnost.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormSettings((prev) => ({ ...prev, publicStatsEnabled: !prev.publicStatsEnabled }))
                  }
                  className="text-slate-700 hover:text-blue-900 transition-colors"
                >
                  {formSettings.publicStatsEnabled ? (
                    <ToggleRight className="w-8 h-8 text-blue-900" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900">Aktivovat simulaci aktivity</h4>
                  <p className="text-2xs text-slate-500">
                    Navýší čísla na veřejném widgetu o matematicky modelovanou návštěvnost.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setFormSettings((prev) => ({
                      ...prev,
                      simulatedActivityEnabled: !prev.simulatedActivityEnabled,
                    }))
                  }
                  className="text-slate-700 hover:text-blue-900 transition-colors"
                >
                  {formSettings.simulatedActivityEnabled ? (
                    <ToggleRight className="w-8 h-8 text-amber-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Numeric controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Násobič simulace (Multiplier): {formSettings.simulationMultiplier}×
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={formSettings.simulationMultiplier}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, simulationMultiplier: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min. simulovaných návštěvníků</label>
                  <input
                    type="number"
                    value={formSettings.simulationMin}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, simulationMin: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max. simulovaných návštěvníků</label>
                  <input
                    type="number"
                    value={formSettings.simulationMax}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, simulationMax: parseInt(e.target.value) || 0 }))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleSaveSettings()}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Ukládám nastavení...' : 'Uložit nastavení simulace'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
