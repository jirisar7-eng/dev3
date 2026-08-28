import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import {
  Search,
  Copy,
  Check,
  BookOpen,
  Scale,
  Calendar,
  Layers,
  History,
  ArrowLeft,
  AlertTriangle,
  Info,
  ExternalLink,
  Tag,
  Clock,
  CheckCircle2,
  Database,
  ArrowRight,
  RefreshCw,
  FileText,
  FileCode,
  HeartHandshake
} from 'lucide-react';
import { SeoHead } from './SeoHead';

interface Section {
  id: string;
  sectionNumber: string;
  sectionOrder: number;
  title: string | null;
  content: string;
  isKeySection?: boolean;
  practicalNote?: string | null;
  courtRelevance?: string | null;
}

interface Version {
  id: string;
  versionNumber: string;
  effectiveFrom: string | Date;
  effectiveTo: string | Date | null;
  promulgationDate?: string | Date | null;
  contentSnapshot?: any;
  contentHash?: string;
  changeSummary?: string | null;
  sourceNote?: string | null;
  createdAt?: string | Date;
  isValidAtDate?: boolean;
  isCurrent?: boolean;
  validityStatus?: 'CURRENT' | 'PAST' | 'FUTURE';
}

interface LegalAct {
  id: string;
  actCode: string;
  actNumber: number;
  actYear: number;
  collection: string;
  title: string;
  shortTitle: string | null;
  actType: string;
  category: string;
  status: string;
  source: string;
  sourceUri: string | null;
  passedDate: string | Date | null;
  promulgationDate: string | Date | null;
  effectiveFrom: string | Date | null;
  effectiveTo: string | Date | null;
  lastAmendedDate: string | Date | null;
  lastSyncedAt: string | Date | null;
  lastVerifiedAt: string | Date | null;
  contentHash?: string;
  sectionsCount?: number;
  versionsCount?: number;
  validityStatus?: 'CURRENT' | 'PAST' | 'FUTURE';
  sections?: Section[];
  versions?: Version[];
}

interface LegislativeBill {
  id: string;
  billNumber: string;
  title: string;
  status: string;
  proposedBy: string;
  submittedAt: string;
  summary: string;
  relatedActCode: string;
  lifeSituation: string;
  sourceUrl: string;
}

interface StateAdminResult<T> {
  success: boolean;
  source: string;
  fetchedAt: string;
  recordsCount: number;
  data: T;
  error?: string;
}

type WordingMode = 'current' | 'date' | 'history';

interface StateLawsViewProps {
  onNavigate?: (path: string) => void;
}

export const StateLawsView: React.FC<StateLawsViewProps> = ({ onNavigate }) => {
  const [activePortalTab, setActivePortalTab] = useState<'laws' | 'bills'>('laws');
  const [laws, setLaws] = useState<LegalAct[]>([]);
  const [selectedLawCode, setSelectedLawCode] = useState<string | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<LegalAct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // P4 Legislative Bills State
  const [billsData, setBillsData] = useState<StateAdminResult<LegislativeBill[]> | null>(null);
  const [billsLoading, setBillsLoading] = useState<boolean>(false);

  // 3-way mode switch: "current" | "date" | "history"
  const [wordingMode, setWordingMode] = useState<WordingMode>('current');

  // Reference date picker state
  const [targetDate, setTargetDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dateWordingLoading, setDateWordingLoading] = useState<boolean>(false);
  const [dateWordingError, setDateWordingError] = useState<string | null>(null);
  const [dateWordingResult, setDateWordingResult] = useState<{
    version: Version | null;
    sections: Section[];
    validity: 'CURRENT' | 'PAST' | 'FUTURE';
    requestedDate: string;
  } | null>(null);

  // Search & Filters inside the selected law
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Vše');

  // Specific historical version selected from history list
  const [selectedHistoricalVersion, setSelectedHistoricalVersion] = useState<Version | null>(null);

  // Fetch all laws on mount
  useEffect(() => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    apiFetch('/api/esbirka/acts')
      .then(async (res) => {
        if (!res.ok) {
          setErrorStatus(res.status);
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `HTTP Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.acts)) {
          setLaws(data.acts);
        } else if (data.success && Array.isArray(data.laws)) {
          setLaws(data.laws);
        } else {
          setLaws([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load laws:', err);
        setErrorMessage(err.message || 'Služba je dočasně nedostupná.');
        setLoading(false);
      });

    fetchLegislativeBills();
  }, []);

  const fetchLegislativeBills = async () => {
    setBillsLoading(true);
    try {
      const res = await apiFetch('/api/state-admin/e-legislativa/bills?actCode=89/2012');
      const data = await res.json();
      setBillsData(data);
    } catch (err) {
      setBillsData({
        success: false,
        source: 'P4_E_LEGISLATIVA',
        fetchedAt: new Date().toISOString(),
        recordsCount: 0,
        data: [],
        error: 'Chyba při komunikaci s API e-Legislativy.',
      });
    } finally {
      setBillsLoading(false);
    }
  };

  // Fetch single law details when selected
  useEffect(() => {
    if (!selectedLawCode) {
      setSelectedLaw(null);
      setWordingMode('current');
      setDateWordingResult(null);
      setSelectedHistoricalVersion(null);
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    setDateWordingResult(null);
    setSelectedHistoricalVersion(null);

    apiFetch(`/api/esbirka/acts/${encodeURIComponent(selectedLawCode)}`)
      .then(async (res) => {
        if (!res.ok) {
          setErrorStatus(res.status);
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `HTTP Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.act) {
          setSelectedLaw(data.act);
        } else if (data.success && data.law) {
          setSelectedLaw(data.law);
        } else {
          setSelectedLaw(null);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load law details:', err);
        setErrorMessage(err.message || 'Chyba při načítání detailu předpisu.');
        setLoading(false);
      });
  }, [selectedLawCode]);

  // Fetch wording at specific date
  const fetchWordingAtDate = (dateStr: string) => {
    if (!selectedLawCode || !dateStr) return;

    setDateWordingLoading(true);
    setDateWordingError(null);

    apiFetch(`/api/esbirka/acts/${encodeURIComponent(selectedLawCode)}/at-date?date=${encodeURIComponent(dateStr)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          if (res.status === 404) {
            throw new Error(errData?.error || `K zadanému datu (${dateStr}) nebylo v lokální databázi nalezeno žádné platné znění předpisu.`);
          }
          throw new Error(errData?.error || `HTTP Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setDateWordingResult({
            version: data.version || null,
            sections: data.sections || [],
            validity: data.validity || 'CURRENT',
            requestedDate: data.requestedDate || dateStr,
          });
        }
        setDateWordingLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch wording at date:', err);
        setDateWordingError(err.message || 'Chyba při načítání znění k datu.');
        setDateWordingResult(null);
        setDateWordingLoading(false);
      });
  };

  // Trigger fetch wording when switching to 'date' mode
  const handleModeChange = (mode: WordingMode) => {
    setWordingMode(mode);
    if (mode === 'date' && !dateWordingResult && !dateWordingLoading) {
      fetchWordingAtDate(targetDate);
    }
  };

  const handleCopyCitation = (sec: any, isHistorical = false, versionNum?: string) => {
    const actTitle = selectedLaw?.shortTitle || selectedLaw?.title || 'Zákon';
    const citationText = `Dle ${sec.sectionNumber} zákona č. ${selectedLaw?.actCode} (${actTitle})${
      isHistorical ? ` ve znění verze ${versionNum || ''}` : ''
    }: "${sec.content}"`;

    navigator.clipboard.writeText(citationText);
    setCopiedId(sec.id || sec.sectionNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return 'Není specifikováno';
    const date = new Date(dateInput);
    return date.toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return '—';
    const date = new Date(dateInput);
    return date.toLocaleString('cs-CZ', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to render validity badge
  const renderValidityBadge = (status: string | undefined) => {
    if (status === 'CURRENT' || status === 'ACTIVE' || status === 'PLATNY') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>Platné a účinné znění (CURRENT)</span>
        </span>
      );
    }
    if (status === 'PAST') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          <span>Historické znění (PAST)</span>
        </span>
      );
    }
    if (status === 'FUTURE') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Calendar className="w-3 h-3" />
          <span>Budoucí schválené znění (FUTURE)</span>
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
        {status || 'NEZNÁMÝ'}
      </span>
    );
  };

  // Determine current display list of sections depending on active mode
  let activeSections: Section[] = [];
  if (wordingMode === 'current') {
    activeSections = selectedLaw?.sections || [];
  } else if (wordingMode === 'date') {
    activeSections = dateWordingResult?.sections || [];
  } else if (wordingMode === 'history' && selectedHistoricalVersion) {
    const snap = selectedHistoricalVersion.contentSnapshot;
    if (Array.isArray(snap)) {
      activeSections = snap;
    } else if (snap && typeof snap === 'object' && Array.isArray(snap.sections)) {
      activeSections = snap.sections;
    } else {
      activeSections = selectedLaw?.sections || [];
    }
  }

  // Categorize sections inside current view
  const getSectionCategory = (secNum: string): string => {
    const cleanNum = parseInt(secNum.replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanNum)) return 'Obecná ustanovení';

    if (selectedLaw?.actCode === '89/2012') {
      if (cleanNum >= 855 && cleanNum <= 859) return 'Rodičovská odpovědnost';
      if (cleanNum >= 888 && cleanNum <= 891) return 'Styk s dítětem';
      if (cleanNum >= 906 && cleanNum <= 909) return 'Péče a svěření';
      if (cleanNum >= 910 && cleanNum <= 923) return 'Výživné dětí';
    }
    if (selectedLaw?.actCode === '359/1999') {
      if (cleanNum <= 10) return 'Základní ustanovení SPOD';
      if (cleanNum <= 20) return 'Opatření k ochraně dětí';
      return 'Výkon pěstounské a ústavní péče';
    }
    if (selectedLaw?.actCode === '292/2013') {
      if (cleanNum >= 452 && cleanNum <= 470) return 'Předběžná opatření v péči soudu o nezletilé';
      if (cleanNum >= 471 && cleanNum <= 507) return 'Řízení ve věcech péče soudu o nezletilé';
      return 'Zvláštní soudní řízení';
    }
    if (selectedLaw?.actCode === '99/1963') {
      if (cleanNum <= 50) return 'Účastníci a zastoupení';
      if (cleanNum >= 74 && cleanNum <= 80) return 'Předběžná opatření';
      return 'Postup v občanském soudním řízení';
    }
    return 'Ostatní ustanovení';
  };

  // Filter sections based on search and optional category
  const filteredSections = activeSections.filter((sec) => {
    const matchesCategory =
      selectedCategory === 'Vše' || getSectionCategory(sec.sectionNumber) === selectedCategory;

    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      sec.sectionNumber.toLowerCase().includes(lowerSearch) ||
      (sec.title && sec.title.toLowerCase().includes(lowerSearch)) ||
      sec.content.toLowerCase().includes(lowerSearch) ||
      (sec.practicalNote && sec.practicalNote.toLowerCase().includes(lowerSearch)) ||
      (sec.courtRelevance && sec.courtRelevance.toLowerCase().includes(lowerSearch));

    return matchesCategory && matchesSearch;
  });

  const categories = ['Vše'];
  if (selectedLaw) {
    const foundCats = Array.from(
      new Set(selectedLaw.sections?.map((s) => getSectionCategory(s.sectionNumber)) || [])
    );
    foundCats.forEach((c) => {
      if (!categories.includes(c)) categories.push(c);
    });
  }

  // 1. Error Page (HTTP 503 State)
  if (errorStatus === 503) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <SeoHead
          title="Databáze nedostupná (503) • Táta má právo"
          description="Systém státní e-Legislativy a e-Sbírky je momentálně nedostupný."
          canonicalPath="/state-laws"
        />
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-red-200">
          <Database className="w-10 h-10 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Služba je dočasně nedostupná (Chyba 503)</h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Místní databáze PostgreSQL, která spravuje znění a historii právních předpisů e-Sbírky, je momentálně odpojena nebo probíhá údržba.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-6 py-4 rounded-2xl max-w-md mx-auto text-xs text-left flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="space-y-1">
            <strong className="font-bold block text-amber-950">Vyjádření DevSecOps a QA:</strong>
            <span>Zásada integrity dat zakazuje načítání neověřených dummy/in-memory náhrad pro produkční právní informace. Prosím, zkuste akci opakovat později.</span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 transition-all shadow"
        >
          Opakovat pokus o připojení
        </button>
      </div>
    );
  }

  // 2. Loading State
  if (loading && laws.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center space-y-4">
        <Scale className="w-12 h-12 text-blue-900 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Načítám opatrovnickou e-Legislativu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Opatrovnická e-Sbírka & e-Legislativa • Táta má právo"
        description="Plně integrované znění a kompletní historie rodinného práva ze systému e-Sbírka a e-Legislativa Ministerstva vnitra ČR."
        canonicalPath="/state-laws"
      />

      {/* Global Error Banner (Fail-Closed) */}
      {errorMessage && !selectedLaw && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl text-rose-950 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <strong className="font-bold">Chyba při komunikaci s repozitářem právních předpisů</strong>
            <p>{errorMessage}</p>
            <p className="text-[11px] text-rose-700">Podle bezpečnostního principu Fail-Closed systém negeneruje náhradní obsah.</p>
          </div>
        </div>
      )}

      {/* Primary Navigation Tabs: Active Laws vs Legislative Proposals (P4) */}
      {!selectedLaw && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActivePortalTab('laws')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activePortalTab === 'laws'
                ? 'bg-blue-950 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
            <span>Platné e-Zákony (e-Sbírka)</span>
          </button>

          <button
            onClick={() => setActivePortalTab('bills')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activePortalTab === 'bills'
                ? 'bg-blue-950 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>P4 – Sněmovní tisky & Legislativní návrhy</span>
          </button>
        </div>
      )}

      {/* Primary Layout Switcher */}
      {!selectedLaw ? (
        activePortalTab === 'bills' ? (
          /* --- VIEW 3: P4 LEGISLATIVE BILLS (SNĚMOVNÍ TISKY) --- */
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Sněmovní tisky & Projednávané novely (e-Legislativa)</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Legislativní Návrhy & Sněmovní Tisky
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Sledování projednávaných poslaneckých a vládních návrhů zákonů v oblasti rodinného práva, péče o děti a výživného. Přímé napojení na e-Legislativu a Sněmovní tisky PČR.
                </p>

                <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-bold text-slate-200 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                    Zdroj: Sněmovní tisky / e-Legislativa api.e-sbirka.gov.cz
                  </span>
                  {billsData?.success && billsData.recordsCount > 0 ? (
                    <span className="font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Dostupné (Aktualizováno: {new Date(billsData.fetchedAt).toLocaleDateString('cs-CZ')})</span>
                    </span>
                  ) : (
                    <span className="font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Momentálně nedostupné z oficiálního rozhraní</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {billsLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-900" />
                <span>Načítám legislativní návrhy z e-Legislativy...</span>
              </div>
            ) : billsData?.success && billsData.data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {billsData.data.map((bill) => (
                  <div key={bill.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-black text-indigo-950 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                          {bill.billNumber}
                        </span>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-[10px]">
                          {bill.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900">{bill.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{bill.summary}</p>

                      <div className="pt-2 space-y-1.5 text-[11px] text-slate-500 border-t border-slate-100">
                        <div>Předkladatel: <strong className="text-slate-800">{bill.proposedBy}</strong></div>
                        <div>Předloženo: <strong className="text-slate-800">{bill.submittedAt}</strong></div>
                        <div>Dotčený zákon: <strong className="text-indigo-900">č. {bill.relatedActCode} Sb.</strong></div>
                        <div>
                          Životní situace: <strong className="text-blue-900 font-bold">{bill.lifeSituation}</strong>
                        </div>
                      </div>
                    </div>

                    {bill.sourceUrl && (
                      <a
                        href={bill.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 bg-indigo-900 text-white font-bold rounded-xl text-xs hover:bg-indigo-950 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-4"
                      >
                        <span>Zobrazit sněmovní tisk na psp.cz</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center text-xs text-rose-950 space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                <strong className="font-bold block text-sm">Legislativní návrhy momentálně nejsou dostupné</strong>
                <p className="text-rose-800 max-w-md mx-auto">
                  Upstream rozhraní e-Legislativy nepředalo žádné aktivní návrhy. V souladu s pravidly nebyly zobrazeny žádné náhradní údaje.
                </p>
              </div>
            )}
          </div>
        ) : (
          // --- VIEW 1: LAWS LIST VIEW ---
          <div className="space-y-8">
            {/* Header Jumbotron */}
            <div className="bg-gradient-to-br from-blue-950 via-slate-950 to-blue-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
              <div className="absolute right-0 top-0 bottom-0 opacity-5 pointer-events-none flex items-center pr-10">
                <Scale className="w-96 h-96" />
              </div>
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-400/20 text-xs font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Integrovaná e-Sbírka & e-Legislativa ČR</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                  Opatrovnické e-Zákony & Časová znění
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                  Přehled klíčových rodinněprávních kodexů synchronizovaných z oficiálního systému **e-Sbírka / e-Legislativa MV ČR**. Data jsou bezpečně uchovávána v lokální PostgreSQL databázi včetně historie všech novelizací a časových znění. Veřejný portál čte výhradně z lokálního úložiště v souladu se zásadou Fail-Closed.
                </p>
              </div>
            </div>

            {/* Laws Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {laws.map((act) => (
                <div
                  key={act.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition-all p-6 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-blue-900 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100">
                        Zákon č. {act.actCode} Sb.
                      </span>
                      {renderValidityBadge(act.validityStatus || act.status)}
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {act.title}
                    </h3>

                    {act.shortTitle && (
                      <p className="text-xs text-slate-500">
                        Zkratka: <strong className="text-slate-700 font-bold">{act.shortTitle}</strong>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Účinnost od: <strong>{formatDate(act.effectiveFrom)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Vyhlášeno: <strong>{formatDate(act.promulgationDate)}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Paragrafů: <strong>{act.sectionsCount || act.sections?.length || 0}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Časových znění: <strong>{act.versionsCount || act.versions?.length || 1}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLawCode(act.actCode)}
                    className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center justify-center gap-2 group shadow-sm cursor-pointer"
                  >
                    <span>Prohlížet aktuální i časová znění</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}

              {laws.length === 0 && !loading && (
                <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">V lokální databázi nejsou uloženy žádné předpisy</h3>
                  <p className="text-xs text-slate-500">
                    Data budou načtena při automatické synchronizaci e-Sbírky nebo spuštěním administrátorského synchronizačního procesu.
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        // --- VIEW 2: SINGLE LAW DETAILS & SECTION BROWSER ---
        <div className="space-y-6">
          {/* Detailed View Navigation */}
          <button
            onClick={() => setSelectedLawCode(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zpět na přehled zákonů</span>
          </button>

          {/* Detailed Header Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black text-blue-950 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100">
                  Sbírka zákonů ČR • č. {selectedLaw.actCode} Sb.
                </span>
                {renderValidityBadge(selectedLaw.validityStatus || selectedLaw.status)}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {selectedLaw.title}
              </h2>
              {selectedLaw.shortTitle && (
                <p className="text-xs text-slate-500">
                  Zažitá zkratka: <strong className="text-slate-700 font-bold">{selectedLaw.shortTitle}</strong>
                </p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-[11px] text-slate-600 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span>Účinnost od:</span>
                <strong className="text-slate-900">{formatDate(selectedLaw.effectiveFrom)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span>Účinnost do:</span>
                <strong className="text-slate-900">{selectedLaw.effectiveTo ? formatDate(selectedLaw.effectiveTo) : 'doposud platný'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span>Vyhlášeno ve Sbírce:</span>
                <strong className="text-slate-900">{formatDate(selectedLaw.promulgationDate)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Poslední synchronizace:</span>
                <strong className="text-slate-900">{formatDateTime(selectedLaw.lastSyncedAt)}</strong>
              </div>
            </div>
          </div>

          {/* 3-WAY VIEW SWITCHER BAR */}
          <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleModeChange('current')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                wordingMode === 'current'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Aktuální znění (platné dnes)</span>
            </button>

            <button
              onClick={() => handleModeChange('date')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                wordingMode === 'date'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Znění k vybranému datu</span>
            </button>

            <button
              onClick={() => handleModeChange('history')}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                wordingMode === 'history'
                  ? 'bg-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Historie znění ({selectedLaw.versions?.length || 1})</span>
            </button>
          </div>

          {/* MODE 2: DATE PICKER & WIDGET */}
          {wordingMode === 'date' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-900" />
                    <span>Výběr referenčního data pro zobrazení tehdejšího znění</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Zvolte libovolné datum v minulosti nebo přítomnosti pro načtení dobového znění předpisu účinného k tomuto dni.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="px-3 py-2 text-xs bg-white rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                  <button
                    onClick={() => fetchWordingAtDate(targetDate)}
                    disabled={dateWordingLoading}
                    className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-950 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {dateWordingLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Načíst znění k datu</span>
                  </button>
                </div>
              </div>

              {/* Fail-closed Notice if date wording failed or not found */}
              {dateWordingError && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-950 text-xs space-y-1">
                  <strong className="font-bold">Znění k datu nebylo nalezeno</strong>
                  <p>{dateWordingError}</p>
                </div>
              )}

              {dateWordingResult && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Stav k {formatDate(dateWordingResult.requestedDate)}:</span>
                    {renderValidityBadge(dateWordingResult.validity)}
                    {dateWordingResult.version && (
                      <span className="font-bold text-slate-800">
                        Verze: {dateWordingResult.version.versionNumber}
                      </span>
                    )}
                  </div>
                  {dateWordingResult.version?.effectiveFrom && (
                    <span className="text-slate-500">
                      Účinnost verze: {formatDate(dateWordingResult.version.effectiveFrom)} {dateWordingResult.version.effectiveTo ? `– ${formatDate(dateWordingResult.version.effectiveTo)}` : ' (doposud)'}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MODE 3: HISTORY LIST & TIMELINE */}
          {wordingMode === 'history' && !selectedHistoricalVersion && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Kompletní historie verzí a časových znění</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chronologický přehled všech novelizací a evidovaných verzí tohoto právního předpisu. Každá verze uchovává kompletní neměnný otisk paragrafů ze systému e-Sbírka.
                </p>
              </div>

              <div className="relative border-l border-slate-200 pl-6 ml-2 space-y-8">
                {selectedLaw.versions && selectedLaw.versions.length > 0 ? (
                  selectedLaw.versions.map((ver) => (
                    <div key={ver.id} className="relative space-y-2">
                      {/* Bullet circle */}
                      <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 bg-blue-900 border-blue-100" />

                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs font-bold text-slate-900">Verze {ver.versionNumber}</strong>
                        {renderValidityBadge(ver.validityStatus || (ver.effectiveTo ? 'PAST' : 'CURRENT'))}
                        <span className="text-[11px] text-slate-500">
                          (Účinná: {formatDate(ver.effectiveFrom)} {ver.effectiveTo ? `– ${formatDate(ver.effectiveTo)}` : ' doposud'})
                        </span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 max-w-2xl">
                        {ver.changeSummary && (
                          <p><strong>Popis novely:</strong> <em>{ver.changeSummary}</em></p>
                        )}
                        {ver.promulgationDate && (
                          <p className="text-[11px] text-slate-500">Vyhlášeno ve Sbírce: {formatDate(ver.promulgationDate)}</p>
                        )}
                        <p className="font-mono text-[10px] text-slate-400">HASH: {ver.contentHash?.substring(0, 32)}...</p>

                        <button
                          onClick={() => setSelectedHistoricalVersion(ver)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-blue-900" />
                          <span>Zobrazit znění této verze</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">
                    V databázi je pro tento předpis evidováno základní výchozí znění.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTIONS BROWSER */}
          {(wordingMode === 'current' || (wordingMode === 'date' && dateWordingResult) || (wordingMode === 'history' && selectedHistoricalVersion)) && (
            <div className="space-y-6">
              {/* Historical Warning Banner if inspecting historical version */}
              {wordingMode === 'history' && selectedHistoricalVersion && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-center justify-between gap-4 text-amber-950">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-xs space-y-0.5">
                      <strong className="font-bold">Prohlížíte historické znění verze {selectedHistoricalVersion.versionNumber}</strong>
                      <p className="text-[11px] text-amber-800">
                        Účinnost od {formatDate(selectedHistoricalVersion.effectiveFrom)} {selectedHistoricalVersion.effectiveTo ? `do ${formatDate(selectedHistoricalVersion.effectiveTo)}` : ''}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedHistoricalVersion(null)}
                    className="px-3 py-1.5 bg-amber-200/80 text-amber-950 text-xs font-bold rounded-lg hover:bg-amber-300 transition-all shrink-0 cursor-pointer"
                  >
                    Zavřít náhled verze
                  </button>
                </div>
              )}

              {/* Search and Filters */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Hledat v paragrafu, textu ustanovení či výkladu..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium text-slate-800"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-700 cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-6">
                {filteredSections.map((sec, idx) => (
                  <div
                    key={sec.id || `sec-${idx}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Section Header */}
                    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-900 text-white font-black text-xs rounded-lg shadow-sm">
                          {sec.sectionNumber}
                        </span>
                        <h3 className="text-sm font-black text-slate-900">
                          {sec.title || `Ustanovení zákona č. ${selectedLaw.actCode} Sb.`}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {sec.isKeySection && (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-100 text-[10px] font-bold rounded">
                            Klíčový paragraf
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                          {getSectionCategory(sec.sectionNumber)}
                        </span>
                        <button
                          onClick={() => handleCopyCitation(sec, wordingMode !== 'current', selectedHistoricalVersion?.versionNumber)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
                        >
                          {copiedId === (sec.id || sec.sectionNumber) ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 text-[10px]">Zkopírováno</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-500" />
                              <span>Kopírovat citaci</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Section Body */}
                    <div className="p-6 space-y-4">
                      {/* Official Content */}
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono leading-relaxed border border-slate-800">
                        „{sec.content}“
                      </div>

                      {/* Practical Note for Fathers */}
                      {sec.practicalNote && (
                        <div className="bg-amber-50/50 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Výklad a lidský překlad pro opatrovnickou praxi:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed pl-4.5">
                            {sec.practicalNote}
                          </p>
                        </div>
                      )}

                      {/* Court Relevance */}
                      {sec.courtRelevance && (
                        <div className="bg-blue-50/40 border border-blue-200/60 p-4 rounded-xl space-y-1">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1">
                            <Scale className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            Jak paragraf efektivně uplatnit u soudu:
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed pl-4.5">
                            {sec.courtRelevance}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredSections.length === 0 && (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">Paragraf nebyl nalezen</h3>
                    <p className="text-xs text-slate-500">Zkuste upřesnit vyhledávací text nebo změnit kategorii předpisu.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Cross-links Banner */}
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Navazující právní nástroje a judikatura</h4>
          <p className="text-xs text-slate-500 mt-0.5">Využijte paragrafy v judikatuře Ústavního soudu, kalkulačce nebo AI generátoru podání.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { if (onNavigate) onNavigate('/judikatura'); else window.location.href = '/judikatura'; }}
            className="px-3.5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Judikatura ÚS ČR
          </button>
          <button
            onClick={() => { if (onNavigate) onNavigate('/kalkulacka-vyzivneho'); else window.location.href = '/kalkulacka-vyzivneho'; }}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Kalkulačka výživného
          </button>
          <button
            onClick={() => { if (onNavigate) onNavigate('/ai-formulare'); else window.location.href = '/ai-formulare'; }}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            AI Generátor podání
          </button>
        </div>
      </div>
    </div>
  );
};
