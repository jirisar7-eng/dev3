import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { Search, Scale, ExternalLink, Tag, Gavel, Filter, Calendar, BookOpen, ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SeoHead } from './SeoHead';

interface CourtCaseItem {
  id: string;
  fileNumber: string;
  court: string;
  title: string;
  summary: string;
  legalRatio: string;
  tags: string[];
  fullTextUrl?: string;
  publishedAt: string | Date;
  source?: string;
}

interface StateAdminResult<T> {
  success: boolean;
  source: string;
  fetchedAt: string;
  recordsCount: number;
  data: T;
  error?: string;
}

const PRESET_TAGS = [
  'Vše',
  'střídavá péče',
  'předběžné opatření',
  'maření styku',
  'výživné',
  'OSPOD',
  'názor dítěte',
];

export const CaseDatabaseView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Vše');
  const [cases, setCases] = useState<CourtCaseItem[]>([]);
  const [stateCasesResult, setStateCasesResult] = useState<StateAdminResult<CourtCaseItem[]> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      // 1. Fetch from P1 State Admin Hub API
      const res = await apiFetch('/api/state-admin/justice/cases?court=Ústavní+soud');
      const data: StateAdminResult<CourtCaseItem[]> = await res.json();
      setStateCasesResult(data);

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCases(data.data);
      } else {
        // Also query legacy local endpoint if needed
        const legacyRes = await apiFetch('/api/state/cases');
        if (legacyRes.ok) {
          const legacyData = await legacyRes.json();
          const list = legacyData.cases || legacyData.courtCases || legacyData.data;
          if (Array.isArray(list) && list.length > 0) {
            setCases(list);
          }
        }
      }
    } catch (err) {
      setStateCasesResult({
        success: false,
        source: 'P1_JUSTICE',
        fetchedAt: new Date().toISOString(),
        recordsCount: 0,
        data: [],
        error: 'Chyba při komunikaci s MSp ČR / Ústavním soudem.',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleDateString('cs-CZ');
    } catch {
      return isoStr;
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesTag =
      selectedTag === 'Vše' || (Array.isArray(c.tags) && c.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

    const s = searchTerm.toLowerCase();
    const matchesSearch =
      (c.fileNumber || '').toLowerCase().includes(s) ||
      (c.title || '').toLowerCase().includes(s) ||
      (c.summary || '').toLowerCase().includes(s) ||
      (c.legalRatio || '').toLowerCase().includes(s) ||
      (c.court || '').toLowerCase().includes(s) ||
      (Array.isArray(c.tags) && c.tags.some((t) => t.toLowerCase().includes(s)));

    return matchesTag && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Případová databáze rozsudků & Precedentů • MSp ČR • Táta má právo"
        description="Oficiální rejstřík klíčové judikatury Ústavního a Nejvyššího soudu z MSp ČR k opatrovnictví, střídavé péči, bránění ve styku a výživnému."
        canonicalPath="/pripadova-databaze"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <Gavel className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Oficiální judikatura Ústavního & Nejvyššího soudu (MSp OpenData)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Případová Databáze Rozsudků
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Přímo napojená oficiální judikatura z Ministerstva spravedlnosti ČR a Nalús Ústavního soudu ČR. Oficiální právní věty a judikáty použitelné jako argumentační základ ve vašem opatrovnickém řízení.
          </p>

          <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Zdroj: Ministerstvo spravedlnosti ČR (MSp OpenData) / Ústavní soud ČR
            </span>
            {stateCasesResult?.success && stateCasesResult.recordsCount > 0 ? (
              <span className="font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Dostupné (Aktualizováno: {formatDate(stateCasesResult.fetchedAt)})</span>
              </span>
            ) : (
              <span className="font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Oficiální MSp konektor: Nedostupné z rozhraní</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar & Tag Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Field */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hledat např. I. ÚS 1506/23, střídavá péče, OSPOD..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>

          {/* Quick Tag Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:block" />
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tag === 'Vše' ? 'Vše' : `#${tag}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rulings / Cases List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-900" />
            <span>Načítám oficiální judikaturu MSp ČR...</span>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
            <Gavel className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              {stateCasesResult && !stateCasesResult.success
                ? 'Data judikatury momentálně nejsou dostupná z oficiálního zdroje'
                : 'Žádný rozsudek neodpovídá vyhledávání'}
            </h3>
            <p className="text-xs text-slate-500">
              {stateCasesResult && !stateCasesResult.success
                ? 'Upstream server MSp ČR nenavrátil požadovaná data. V souladu s pravidly nebyla zobrazena žádná syntetická data.'
                : 'Zkuste zadat jinou spisovou značku nebo zvolte jiný tag.'}
            </p>
          </div>
        ) : (
          filteredCases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-950 text-white font-mono font-black text-xs rounded-lg shadow-sm border border-blue-900">
                    {caseItem.fileNumber}
                  </span>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider block">
                      {caseItem.court}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{caseItem.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(caseItem.publishedAt.toString())}</span>
                  </span>

                  {caseItem.fullTextUrl && (
                    <a
                      href={caseItem.fullTextUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-bold hover:bg-blue-950 transition-all shadow-sm"
                    >
                      <span>Plný text rozsudku</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Legal Ratio / Precedent Highlight */}
                <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-2 border border-slate-800 relative shadow-inner">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>PRÁVNÍ VĚTA / PRECEDENT PRO SOUDNÍ PODÁNÍ:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-100 pl-6">
                    „{caseItem.legalRatio}“
                  </p>
                </div>

                {/* Case Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Stručné shrnutí případu:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {caseItem.summary}
                  </p>
                </div>

                {/* Tags Footer */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  {Array.isArray(caseItem.tags) && caseItem.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {caseItem.tags.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTag(t)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-md transition-all cursor-pointer"
                        >
                          #{t}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 italic">
                    {caseItem.source || 'Zdroj: Ministerstvo spravedlnosti ČR'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer info box */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center space-y-1.5">
        <p className="text-xs text-slate-600">
          Judikatura je napojena na oficiální otevřené datové sady <strong>Ministerstva spravedlnosti ČR</strong> a <strong>Nalús (Ústavní soud ČR)</strong>.
        </p>
        <span className="text-[11px] text-slate-400 block">
          Zdroj: Ministerstvo spravedlnosti ČR (MSp OpenData) & Ústavní soud ČR
        </span>
      </div>
    </div>
  );
};
