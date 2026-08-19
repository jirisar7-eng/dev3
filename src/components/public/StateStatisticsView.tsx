import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Coins, Users, Building2, ShieldCheck, CheckCircle2, Info, AlertTriangle, Search, ExternalLink, RefreshCw } from 'lucide-react';
import { SeoHead } from './SeoHead';

interface StateAdminResult<T> {
  success: boolean;
  source: string;
  sourceUrl?: string;
  fetchedAt: string;
  httpStatus: number;
  recordsCount: number;
  data: T;
  error?: string;
}

interface JudicialStat {
  code: string;
  title: string;
  value: string;
  unit: string;
  period: string;
  category: string;
  description: string;
  source: string;
}

interface DemographicStat {
  code: string;
  title: string;
  value: string;
  unit: string;
  period: string;
  category: string;
  description: string;
  source: string;
}

interface NkodDataset {
  id: string;
  title: string;
  description: string;
  publisher: string;
  keyword: string[];
  distributionUrl: string;
  issuedAt: string;
}

export const StateStatisticsView: React.FC = () => {
  // P1 Justice state
  const [justiceData, setJusticeData] = useState<StateAdminResult<JudicialStat[]> | null>(null);
  const [justiceLoading, setJusticeLoading] = useState<boolean>(true);

  // P2 ČSÚ Demographics state
  const [csuData, setCsuData] = useState<StateAdminResult<DemographicStat[]> | null>(null);
  const [csuLoading, setCsuLoading] = useState<boolean>(true);

  // P2 NKOD Search state
  const [nkodQuery, setNkodQuery] = useState<string>('rodina');
  const [nkodData, setNkodData] = useState<StateAdminResult<NkodDataset[]> | null>(null);
  const [nkodLoading, setNkodLoading] = useState<boolean>(false);

  // Fetch P1 Justice & P2 ČSÚ on mount
  useEffect(() => {
    fetchJusticeStats();
    fetchCsuDemographics();
    fetchNkodDatasets('rodina');
  }, []);

  const fetchJusticeStats = async () => {
    setJusticeLoading(true);
    try {
      const res = await fetch('/api/state-admin/justice/statistics?agenda=P');
      const data = await res.json();
      setJusticeData(data);
    } catch (err) {
      setJusticeData({
        success: false,
        source: 'P1_JUSTICE',
        fetchedAt: new Date().toISOString(),
        httpStatus: 500,
        recordsCount: 0,
        data: [],
        error: 'Chyba při komunikaci se server-side rozhraním MSp ČR.',
      });
    } finally {
      setJusticeLoading(false);
    }
  };

  const fetchCsuDemographics = async () => {
    setCsuLoading(true);
    try {
      const res = await fetch('/api/state-admin/csu/demographics');
      const data = await res.json();
      setCsuData(data);
    } catch (err) {
      setCsuData({
        success: false,
        source: 'P2_CSU_NKOD',
        fetchedAt: new Date().toISOString(),
        httpStatus: 500,
        recordsCount: 0,
        data: [],
        error: 'Chyba při komunikaci se server-side rozhraním ČSÚ.',
      });
    } finally {
      setCsuLoading(false);
    }
  };

  const fetchNkodDatasets = async (keyword: string) => {
    setNkodLoading(true);
    try {
      const res = await fetch(`/api/state-admin/csu/nkod?keyword=${encodeURIComponent(keyword)}`);
      const data = await res.json();
      setNkodData(data);
    } catch (err) {
      setNkodData({
        success: false,
        source: 'P2_CSU_NKOD',
        fetchedAt: new Date().toISOString(),
        httpStatus: 500,
        recordsCount: 0,
        data: [],
        error: 'Chyba při vyhledávání v Národním katalogu otevřených dat (NKOD).',
      });
    } finally {
      setNkodLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString('cs-CZ', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Státní statistiky rodinného práva • ČSÚ & MS ČR • Táta má právo"
        description="Oficiální statistické ukazatele opatrovnických soudů, podílů střídavé péče, průměrných délek soudních řízení a otevřených datových sad ČSÚ v ČR."
        canonicalPath="/state-statistics"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <BarChart3 className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Oficiální otevřená data ČSÚ & Ministerstva spravedlnosti ČR</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Statistiky opatrovnické praxe & Otevřená data ČR
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Přímo napojené oficiální datové sady Ministerstva spravedlnosti ČR a Českého statistického úřadu. Sledování opatrovnických statistik, statistik rozvodovosti, výživného a veřejně přístupných datasetů NKOD (data.gov.cz).
          </p>
        </div>
      </div>

      {/* SECTION 1: P1 JUSTICE STATISTICS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-black text-lg">
              <Users className="w-5 h-5 text-blue-700" />
              <h2>P1 – Statistiky opatrovnické agendy MSp ČR</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Oficiální indikátory délky řízení a rozhodovací praxe opatrovnických soudů (OpenData MSp ČR)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Zdroj: Ministerstvo spravedlnosti ČR (data.gov.cz)
            </span>
            {justiceData?.success && justiceData.data.length > 0 ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Dostupné (Aktualizováno: {formatDate(justiceData.fetchedAt)})</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Momentálně nedostupné z oficiálního zdroje</span>
              </span>
            )}
          </div>
        </div>

        {justiceLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
            <span>Načítám oficiální statistiky MSp ČR...</span>
          </div>
        ) : justiceData?.success && justiceData.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {justiceData.data.map((stat) => (
              <div key={stat.code} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>{stat.category}</span>
                  <span>{stat.period}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{stat.title}</h3>
                <div className="text-2xl font-black text-blue-900">
                  {stat.value} <span className="text-xs font-medium text-slate-600">{stat.unit}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{stat.description}</p>
                <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2 mt-2">
                  {stat.source}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-950">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <strong className="font-bold block text-sm">Data MSp ČR momentálně nejsou dostupná z oficiálního zdroje</strong>
            <p className="text-xs text-rose-800 max-w-lg mx-auto">
              Upstream server Ministerstva spravedlnosti je dočasně nedostupný nebo nenavrátil požadovaná data. V souladu s pravidly nebyly zobrazeny žádné náhradní ani syntetické údaje.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: P2 ČSÚ DEMOGRAPHICS & FAMILY STATS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-900 font-black text-lg">
              <Building2 className="w-5 h-5 text-indigo-700" />
              <h2>P2 – Demografie a rodinné statistiky ČSÚ</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Oficiální demografická data o manželství, rozvodovosti a nezletilých dětech (Český statistický úřad)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Zdroj: Český statistický úřad / NKOD
            </span>
            {csuData?.success && csuData.data.length > 0 ? (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Dostupné (Aktualizováno: {formatDate(csuData.fetchedAt)})</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Momentálně nedostupné z oficiálního zdroje</span>
              </span>
            )}
          </div>
        </div>

        {csuLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-900" />
            <span>Načítám oficiální demografická data ČSÚ...</span>
          </div>
        ) : csuData?.success && csuData.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {csuData.data.map((stat) => (
              <div key={stat.code} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                  <span>{stat.category}</span>
                  <span>{stat.period}</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 leading-snug">{stat.title}</h3>
                <div className="text-2xl font-black text-indigo-900">
                  {stat.value} <span className="text-xs font-medium text-slate-600">{stat.unit}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{stat.description}</p>
                <div className="text-[10px] text-slate-400 border-t border-slate-200/60 pt-2 mt-2">
                  {stat.source}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-2 text-rose-950">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <strong className="font-bold block text-sm">Data ČSÚ momentálně nejsou dostupná z oficiálního zdroje</strong>
            <p className="text-xs text-rose-800 max-w-lg mx-auto">
              Upstream server ČSÚ / NKOD je dočasně nedostupný.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: P2 NKOD DATASET SEARCH (data.gov.cz) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
              <Search className="w-5 h-5 text-blue-700" />
              <h2>P2 – Vyhledávání v Národním katalogu otevřených dat (NKOD data.gov.cz)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Vyhledávání v oficiálním registru otevřených datových sad veřejné správy ČR k opatrovnictví a rodině
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 self-start sm:self-auto">
            Zdroj: NKOD / data.gov.cz API v2
          </span>
        </div>

        {/* NKOD Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={nkodQuery}
              onChange={(e) => setNkodQuery(e.target.value)}
              placeholder="Zadejte klíčové slovo (např. rodina, výživné, soudy, OSPOD)..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
            />
          </div>
          <button
            onClick={() => fetchNkodDatasets(nkodQuery)}
            disabled={nkodLoading || !nkodQuery.trim()}
            className="px-5 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {nkodLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Vyhledat v NKOD</span>
          </button>
        </div>

        {/* NKOD Results */}
        {nkodLoading ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
            <span>Vyhledávám v Národním katalogu otevřených dat...</span>
          </div>
        ) : nkodData?.success && nkodData.data.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-600">
              Nalezeno {nkodData.data.length} otevřených datových sad pro klíčové slovo "{nkodQuery}":
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nkodData.data.map((ds) => (
                <div key={ds.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-900 px-2 py-0.5 bg-blue-100 rounded">
                      {ds.publisher}
                    </span>
                    <span className="text-[10px] text-slate-400">Vydáno: {ds.issuedAt}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{ds.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">{ds.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1 flex-wrap">
                      {ds.keyword.slice(0, 3).map((kw) => (
                        <span key={kw} className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          #{kw}
                        </span>
                      ))}
                    </div>
                    {ds.distributionUrl && (
                      <a
                        href={ds.distributionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1"
                      >
                        <span>Otevřít na data.gov.cz</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800">Pro dotaz "{nkodQuery}" nebyly v NKOD nalezeny otevřené datové sady nebo je služba momentálně nedostupná.</p>
            <p className="text-[11px] text-slate-500">Zkuste použít obecnější klíčové slovo (např. rodina, opatrovnictví, soudy).</p>
          </div>
        )}
      </div>
    </div>
  );
};
