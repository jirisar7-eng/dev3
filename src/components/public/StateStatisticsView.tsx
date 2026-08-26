import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Coins,
  Users,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Info,
  AlertTriangle,
  Search,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Filter,
  Layers,
  Database
} from 'lucide-react';
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
  isCached?: boolean;
  lastSuccessAt?: string;
  warning?: string;
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
  provider: string;
  keywords: string[];
  downloadUrl: string;
  issuedDate: string;
  relevanceScore?: number;
  thematicCategory?: string;
}

type ThematicCategoryKey = 'ALL' | 'DIVORCES' | 'MARRIAGES' | 'FAMILY_CHILDREN' | 'CUSTODY_CARE' | 'COURT_STATS';

export const StateStatisticsView: React.FC = () => {
  // P1 Justice state
  const [justiceData, setJusticeData] = useState<StateAdminResult<JudicialStat[]> | null>(null);
  const [justiceLoading, setJusticeLoading] = useState<boolean>(true);

  // P2 ČSÚ Demographics state
  const [csuData, setCsuData] = useState<StateAdminResult<DemographicStat[]> | null>(null);
  const [csuLoading, setCsuLoading] = useState<boolean>(true);

  // P2 NKOD Search state
  const [nkodQuery, setNkodQuery] = useState<string>('');
  const [selectedThematicGroup, setSelectedThematicGroup] = useState<ThematicCategoryKey>('ALL');
  const [nkodData, setNkodData] = useState<StateAdminResult<NkodDataset[]> | null>(null);
  const [nkodLoading, setNkodLoading] = useState<boolean>(false);

  // Fetch P1 Justice & P2 ČSÚ on mount
  useEffect(() => {
    fetchJusticeStats();
    fetchCsuDemographics();
    fetchNkodDatasets('', 'ALL');
  }, []);

  const fetchJusticeStats = async () => {
    setJusticeLoading(true);
    try {
      const res = await apiFetch('/api/state-admin/justice/statistics?agenda=P');
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
      const res = await apiFetch('/api/state-admin/csu/demographics');
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

  const fetchNkodDatasets = async (keyword: string, thematicGroup: ThematicCategoryKey) => {
    setNkodLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.append('keyword', keyword.trim());
      if (thematicGroup !== 'ALL') params.append('category', thematicGroup);

      const res = await apiFetch(`/api/state-admin/nkod/search?${params.toString()}`);
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

  const handleGroupSelect = (groupKey: ThematicCategoryKey) => {
    setSelectedThematicGroup(groupKey);
    fetchNkodDatasets(nkodQuery, groupKey);
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

  const THEMATIC_TABS: { id: ThematicCategoryKey; label: string; desc: string }[] = [
    { id: 'ALL', label: 'Všechny rodinné datasety', desc: 'Všechny otevřené datové sady rodinného a opatrovnického práva' },
    { id: 'DIVORCES', label: 'Skupina A – Rozvody', desc: 'Rozvody, rozvodovost, rozvedená manželství' },
    { id: 'MARRIAGES', label: 'Skupina B – Sňatky', desc: 'Sňatky, sňatečnost, uzavírání manželství' },
    { id: 'FAMILY_CHILDREN', label: 'Skupina C – Děti a rodina', desc: 'Děti, nezletilí, rodinné domácnosti, samoživitelé' },
    { id: 'CUSTODY_CARE', label: 'Skupina D – Opatrovnictví & péče', desc: 'Péče o dítě, střídavá péče, výživné, OSPOD' },
    { id: 'COURT_STATS', label: 'Skupina E – Soudní statistiky', desc: 'Okresní soudy, agenda P/Nc, délka řízení, judikatura' },
  ];

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
            Přímo napojené oficiální datové sady Ministerstva spravedlnosti ČR a Českého statistického úřadu. Sledování opatrovnických statistik, statistik rozvodovosti, výživného a veřejně přístupných datasetů NKOD (data.gov.cz) s ochranou proti syntetickým datům.
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
              Oficiální indikátory délky řízení a rozhodovací praxe opatrovnických soudů (OpenData MSp ČR & Ročenka justice)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              Zdroj: Ministerstvo spravedlnosti ČR (data.justice.cz)
            </span>
            {justiceData?.success && justiceData.data.length > 0 ? (
              justiceData.isCached ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Oficiální zdroj je momentálně nedostupný. Zobrazuji ověřená data z {formatDate(justiceData.lastSuccessAt || justiceData.fetchedAt)}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Dostupné (Aktualizováno: {formatDate(justiceData.fetchedAt)})</span>
                </span>
              )
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
              <div key={stat.code} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-2 hover:border-blue-300 transition-colors">
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
              Upstream server Ministerstva spravedlnosti je dočasně nedostupný a v perzistentní paměti zatím nejsou uložena žádná předchozí ověřená data. V souladu se zásadou Zero Synthetic Data nebyly zobrazeny žádné vymyšlené údaje.
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
              Zdroj: Český statistický úřad / data.gov.cz
            </span>
            {csuData?.success && csuData.data.length > 0 ? (
              csuData.isCached ? (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Oficiální zdroj je momentálně nedostupný. Zobrazuji ověřená data z {formatDate(csuData.lastSuccessAt || csuData.fetchedAt)}</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Dostupné (Aktualizováno: {formatDate(csuData.fetchedAt)})</span>
                </span>
              )
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
              <div key={stat.code} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-2 hover:border-indigo-300 transition-colors">
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
              Upstream server ČSÚ / NKOD je dočasně nedostupný a v perzistentní paměti zatím nejsou uložena žádná data.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 3: P2 NKOD DATASET SEARCH & THEMATIC FILTERING */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
              <Search className="w-5 h-5 text-blue-700" />
              <h2>P2 – Tematické otevřené datové sady NKOD (data.gov.cz)</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Filtrované a relevančně bodované datové sady veřejné správy ČR (s penalizací nerelevantních domén jako stavebnictví a telekomunikace)
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 self-start sm:self-auto flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-blue-800" />
            <span>NKOD / SPARQL data.gov.cz</span>
          </span>
        </div>

        {/* Thematic Group Selection Pills */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-blue-700" />
            <span>Tematické okruhy rodinné a opatrovnické agendy:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {THEMATIC_TABS.map((tab) => {
              const isSelected = selectedThematicGroup === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleGroupSelect(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={tab.desc}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* NKOD Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={nkodQuery}
              onChange={(e) => setNkodQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchNkodDatasets(nkodQuery, selectedThematicGroup);
                }
              }}
              placeholder="Vyhledat v názvu nebo popisu datasetu (např. rozvodovost, výživné, soudy, OSPOD)..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-800"
            />
          </div>
          <button
            onClick={() => fetchNkodDatasets(nkodQuery, selectedThematicGroup)}
            disabled={nkodLoading}
            className="px-5 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {nkodLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Hledat v NKOD</span>
          </button>
        </div>

        {/* NKOD Results */}
        {nkodLoading ? (
          <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />
            <span>Vyhledávám a boduji relevanci datových sad v NKOD...</span>
          </div>
        ) : nkodData?.success && nkodData.data.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold">
                Nalezeno {nkodData.data.length} ověřených a relevančně bodovaných datových sad:
              </span>
              {nkodData.isCached && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Načteno z ověřené mezipaměti
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nkodData.data.map((ds) => (
                <div key={ds.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2 hover:border-slate-300 transition-all">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-blue-900 px-2 py-0.5 bg-blue-100 rounded">
                      {ds.provider}
                    </span>
                    {ds.thematicCategory && (
                      <span className="text-[10px] font-bold text-indigo-800 px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded">
                        {ds.thematicCategory}
                      </span>
                    )}
                    {typeof ds.relevanceScore === 'number' && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 ml-auto flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Skóre: {ds.relevanceScore}</span>
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{ds.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">{ds.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(ds.keywords || []).slice(0, 3).map((kw) => (
                        <span key={kw} className="text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          #{kw}
                        </span>
                      ))}
                    </div>
                    {ds.downloadUrl && (
                      <a
                        href={ds.downloadUrl}
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
            <p className="font-bold text-slate-800">
              {nkodQuery
                ? `Pro dotaz "${nkodQuery}" nebyly v NKOD nalezeny otevřené datové sady splňující kritéria relevance.`
                : 'V této tematické kategorii nebyly v NKOD nalezeny otevřené datové sady splňující kritéria relevance.'}
            </p>
            <p className="text-[11px] text-slate-500">
              Systém automaticky penalizuje a vyřazuje nerelevantní technické a stavební datasety (stavební povolení, infrastrukturu, telekomunikace).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
