import React, { useEffect, useState } from 'react';
import { PublicActivitySummary } from '../../types';
import { Users, Eye, Sparkles, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';

interface PortalActivityPanelProps {
  variant?: 'compact' | 'full';
  className?: string;
  onNavigate?: (path: string) => void;
}

export const PortalActivityPanel: React.FC<PortalActivityPanelProps> = ({
  variant = 'compact',
  className = '',
  onNavigate,
}) => {
  const [data, setData] = useState<PublicActivitySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/analytics/public-summary');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) {
    return (
      <div className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return null; // Fail gracefully without breaking page layout
  }

  const activeNow = data?.activeVisitorsNow || 1;
  const visitsToday = data?.visitsToday || 0;
  const pageViewsToday = data?.pageViewsToday || 0;
  const featureUses = data?.featureUsesToday || 0;

  if (variant === 'compact') {
    return (
      <div
        className={`bg-white/95 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/90 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">Aktivita na portálu</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Dnes</span>
            <button
              onClick={fetchStats}
              title="Obnovit aktivitu"
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-500">Aktivní nyní</span>
            </div>
            <span className="text-lg font-black text-slate-900 leading-tight">{activeNow}</span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-500">Návštěv dnes</span>
            </div>
            <span className="text-lg font-black text-slate-900 leading-tight">{visitsToday}</span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col">
            <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-500">Zobrazení stránek</span>
            </div>
            <span className="text-lg font-black text-slate-900 leading-tight">{pageViewsToday}</span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 flex flex-col">
            <div className="flex items-center gap-1.5 text-amber-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold text-slate-500">Použití nástrojů</span>
            </div>
            <span className="text-lg font-black text-slate-900 leading-tight">{featureUses}</span>
          </div>
        </div>
      </div>
    );
  }

  // Full detailed variant
  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Živý přehled portálu
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Aktivita komunity a interaktivních nástrojů
          </h3>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Obnovit data</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-gradient-to-br from-emerald-50/60 to-white p-4 rounded-2xl border border-emerald-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800">Aktivní relace</span>
            <div className="p-1.5 rounded-lg bg-emerald-100/70 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeNow}</div>
          <span className="text-[11px] text-slate-500 font-medium">návštěvníků v posledních 15 min</span>
        </div>

        <div className="bg-gradient-to-br from-blue-50/60 to-white p-4 rounded-2xl border border-blue-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800">Návštěv za dnešek</span>
            <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{visitsToday}</div>
          <span className="text-[11px] text-slate-500 font-medium">unikátních relací</span>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/60 to-white p-4 rounded-2xl border border-indigo-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-800">Zobrazení stránek</span>
            <div className="p-1.5 rounded-lg bg-indigo-100/70 text-indigo-700">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{pageViewsToday}</div>
          <span className="text-[11px] text-slate-500 font-medium">otevřených právních materiálů</span>
        </div>

        <div className="bg-gradient-to-br from-amber-50/60 to-white p-4 rounded-2xl border border-amber-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800">Použití nástrojů</span>
            <div className="p-1.5 rounded-lg bg-amber-100/70 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{featureUses}</div>
          <span className="text-[11px] text-slate-500 font-medium">výpočtů, analýz a plánů</span>
        </div>
      </div>

      {data?.topFeaturesToday && data.topFeaturesToday.length > 0 && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-xs uppercase tracking-wide">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>Nejvyužívanější sekce a nástroje dnes</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {data.topFeaturesToday.map((f, i) => (
              <div
                key={f.featureId || i}
                onClick={() => {
                  if (onNavigate) {
                    if (f.featureId === 'alimony_calculator') onNavigate('/kalkulacka-vyzivneho');
                    else if (f.featureId === 'care_simulator') onNavigate('/coparent-hub');
                    else if (f.featureId === 'judgment_parser') onNavigate('/judikatura');
                    else if (f.featureId === 'studies_search') onNavigate('/studie');
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 transition-colors cursor-pointer group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 transition-colors truncate">
                  {f.label}
                </span>
                <span className="text-xs font-extrabold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md shrink-0 ml-2">
                  {f.count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
