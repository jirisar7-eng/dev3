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
  ArrowRight
} from 'lucide-react';
import { SeoHead } from './SeoHead';

interface Section {
  id: string;
  sectionNumber: string;
  sectionOrder: number;
  title: string | null;
  content: string;
  isKeySection: boolean;
  practicalNote: string | null;
  courtRelevance: string | null;
}

interface Version {
  id: string;
  versionNumber: string;
  effectiveFrom: string | Date;
  effectiveTo: string | Date | null;
  promulgationDate: string | Date | null;
  contentSnapshot: any;
  contentHash: string;
  changeSummary: string | null;
  sourceNote: string | null;
  createdAt: string | Date;
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
  contentHash: string;
  sections?: Section[];
  versions?: Version[];
}

export const StateLawsView: React.FC = () => {
  const [laws, setLaws] = useState<LegalAct[]>([]);
  const [selectedLawCode, setSelectedLawCode] = useState<string | null>(null);
  const [selectedLaw, setSelectedLaw] = useState<LegalAct | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filters inside the selected law
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Vše');
  const [viewTab, setViewTab] = useState<'sections' | 'versions'>('sections');

  // Historical version selection
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [historicSections, setHistoricSections] = useState<any[] | null>(null);

  // Fetch all laws on mount
  useEffect(() => {
    setLoading(true);
    setErrorStatus(null);
    fetch('/api/state/laws')
      .then(async (res) => {
        if (!res.ok) {
          setErrorStatus(res.status);
          throw new Error(`HTTP Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.laws)) {
          setLaws(data.laws);
        } else {
          setLaws([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load laws:', err);
        setLoading(false);
      });
  }, []);

  // Fetch single law details when selected
  useEffect(() => {
    if (!selectedLawCode) {
      setSelectedLaw(null);
      setSelectedVersionId(null);
      setHistoricSections(null);
      return;
    }

    setLoading(true);
    setErrorStatus(null);
    fetch(`/api/state/laws/${encodeURIComponent(selectedLawCode)}`)
      .then(async (res) => {
        if (!res.ok) {
          setErrorStatus(res.status);
          throw new Error(`HTTP Error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.law) {
          setSelectedLaw(data.law);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load law details:', err);
        setLoading(false);
      });
  }, [selectedLawCode]);

  // Handle historic version viewing
  const handleSelectVersion = (version: Version) => {
    if (selectedVersionId === version.id) {
      // Toggle off to current version
      setSelectedVersionId(null);
      setHistoricSections(null);
      return;
    }

    setSelectedVersionId(version.id);

    // Resolve snapshot data
    const snapshot = version.contentSnapshot;
    if (snapshot && Array.isArray(snapshot)) {
      setHistoricSections(snapshot);
    } else if (snapshot && typeof snapshot === 'object' && Array.isArray(snapshot.sections)) {
      setHistoricSections(snapshot.sections);
    } else if (snapshot && typeof snapshot === 'object') {
      // Map properties to section objects if stored differently
      const list = Object.keys(snapshot).map((key, idx) => ({
        id: `hist-sec-${idx}`,
        sectionNumber: key,
        sectionOrder: idx,
        content: typeof snapshot[key] === 'string' ? snapshot[key] : JSON.stringify(snapshot[key]),
        title: null,
        isKeySection: false,
        practicalNote: null,
        courtRelevance: null
      }));
      setHistoricSections(list);
    } else {
      setHistoricSections([]);
    }
    setViewTab('sections'); // Switch to sections view to browse them
  };

  const handleCopyCitation = (sec: any, isHistorical = false) => {
    const actTitle = selectedLaw?.shortTitle || selectedLaw?.title || 'Občanský zákoník';
    const citationText = `Dle ${sec.sectionNumber} zákona č. ${selectedLaw?.actCode} (${actTitle})${
      isHistorical ? ' v historickém znění' : ''
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
      day: 'numeric'
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
      minute: '2-digit'
    });
  };

  // Determine current display list of sections (historic vs current)
  const activeSections: any[] = historicSections || selectedLaw?.sections || [];

  // Categorize sections inside current view (purely based on paragraf number to give logical groupings)
  const getSectionCategory = (secNum: string): string => {
    const cleanNum = parseInt(secNum.replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanNum)) return 'Obecná ustanovení';

    if (selectedLaw?.actCode === '89/2012') {
      if (cleanNum >= 855 && cleanNum <= 859) return 'Rodičovská odpovědnost';
      if (cleanNum >= 888 && cleanNum <= 891) return 'Styk s dítětem';
      if (cleanNum >= 906 && cleanNum <= 909) return 'Péče a svěření';
      if (cleanNum >= 910 && cleanNum <= 923) return 'Výživné dětí';
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
  if (selectedLaw && !historicSections) {
    const foundCats = Array.from(new Set(selectedLaw.sections?.map((s) => getSectionCategory(s.sectionNumber)) || []));
    categories.push(...foundCats);
  }

  // Find active version object
  const activeVersionObj = selectedLaw?.versions?.find((v) => v.id === selectedVersionId);

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
        description="Plně integrované znění a kompletní historie rodinného práva ze systému e-Sbírka Ministerstva vnitra ČR."
        canonicalPath="/state-laws"
      />

      {/* Primary Layout Switcher */}
      {!selectedLaw ? (
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
                Opatrovnické e-Zákony & Právní znění
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Zde naleznete kompletní, v reálném čase synchronizovaný přehled klíčových rodinněprávních kodexů. Veškeré informace a historie verzí pocházejí přímo z centrálního vládního systému **e-Sbírka / e-Legislativa MV ČR**, jsou bezpečně uloženy v naší PostgreSQL databázi a jsou doplňovány o komentáře a soudní tipy pro opatrovnickou praxi otců.
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
                      Zákon č. {act.actCode}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      act.status === 'ACTIVE' || act.status === 'PLATNY'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {act.status === 'ACTIVE' || act.status === 'PLATNY' ? 'Platný a účinný' : act.status}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {act.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 pt-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Účinnost od: <strong>{formatDate(act.effectiveFrom)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Paragrafů: <strong>{act.sections?.length || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Synchronizováno: <strong>{formatDateTime(act.lastSyncedAt)}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLawCode(act.actCode)}
                  className="w-full py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Prohlížet a studovat zákon</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}

            {laws.length === 0 && !loading && (
              <div className="col-span-1 md:col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">V databázi nejsou uloženy žádné zákony</h3>
                <p className="text-xs text-slate-500">Zákony budou do databáze vloženy během příští naplánované synchronizace.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // --- VIEW 2: SINGLE LAW DETAILS & SECTION BROWSER ---
        <div className="space-y-6">
          {/* Detailed View Navigation */}
          <button
            onClick={() => setSelectedLawCode(null)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Zpět na přehled zákonů</span>
          </button>

          {/* Detailed Header Banner */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black text-blue-950 px-2.5 py-1 bg-blue-50 rounded-lg border border-blue-100">
                  Sbírka zákonů ČR • {selectedLaw.actCode}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {selectedLaw.status === 'ACTIVE' || selectedLaw.status === 'PLATNY' ? 'Platný a účinný' : selectedLaw.status}
                </span>
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
                <span>Schváleno:</span>
                <strong className="text-slate-900">{formatDate(selectedLaw.passedDate)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span>Zveřejněno ve sbírce:</span>
                <strong className="text-slate-900">{formatDate(selectedLaw.promulgationDate)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Poslední synchronizace:</span>
                <strong className="text-slate-900">{formatDateTime(selectedLaw.lastSyncedAt)}</strong>
              </div>
            </div>
          </div>

          {/* Layout for detail view: Sidebar (versions) + Main (paragraphs) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Sidebar: Metadata and Versions list */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Tabs Switcher for Mobile/Layout convenience */}
              <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm flex lg:flex-col gap-1">
                <button
                  onClick={() => setViewTab('sections')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center lg:justify-start ${
                    viewTab === 'sections'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>Znění & Výklad</span>
                </button>
                <button
                  onClick={() => setViewTab('versions')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 justify-center lg:justify-start ${
                    viewTab === 'versions'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Historie znění ({selectedLaw.versions?.length || 0})</span>
                </button>
              </div>

              {/* Version timeline (displayed always on desktop, integrated in tabs for general routing) */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-900" />
                  <span>Aktivní znění</span>
                </h4>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedVersionId(null);
                      setHistoricSections(null);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      selectedVersionId === null
                        ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Aktuální platné znění</span>
                      {selectedVersionId === null && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Účinné od {formatDate(selectedLaw.effectiveFrom)}</span>
                  </button>

                  {selectedLaw.versions && selectedLaw.versions.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Historie novelizací:</span>
                      
                      {selectedLaw.versions.map((ver) => (
                        <button
                          key={ver.id}
                          onClick={() => handleSelectVersion(ver)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                            selectedVersionId === ver.id
                              ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold shadow-sm'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Verze {ver.versionNumber}</span>
                            {selectedVersionId === ver.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />}
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Účinná: {formatDate(ver.effectiveFrom)} {ver.effectiveTo ? `– ${formatDate(ver.effectiveTo)}` : ' (doposud)'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Main Area: Search, category filtering, sections list */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Disclaimer for historical version */}
              {selectedVersionId && activeVersionObj && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex gap-3 text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-xs space-y-1">
                    <strong className="font-bold">Prohlížíte historické znění předpisu!</strong>
                    <p className="leading-relaxed">
                      Zobrazené znění verze **{activeVersionObj.versionNumber}** bylo účinné od **{formatDate(activeVersionObj.effectiveFrom)}** do **{formatDate(activeVersionObj.effectiveTo)}**. Nejedná se o aktuální platný zákon.
                    </p>
                    {activeVersionObj.changeSummary && (
                      <span className="block mt-2 text-[11px] text-amber-900 bg-amber-100/50 px-2 py-1 rounded">
                        Změna: <em>{activeVersionObj.changeSummary}</em>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* View Tab 1: Sections & Explanations Browser */}
              {viewTab === 'sections' && (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="relative md:col-span-2">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Hledat v paragrafu, znění, lidském výkladu či tipech..."
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-bold text-slate-700"
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
                              {sec.title || `Ustanovení zákona č. ${selectedLaw.actCode}`}
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
                              onClick={() => handleCopyCitation(sec, !!selectedVersionId)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
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

                          {/* Practical Note for Fathers (Only available on current version) */}
                          {!selectedVersionId && sec.practicalNote && (
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

                          {/* Court Relevance (Only available on current version) */}
                          {!selectedVersionId && sec.courtRelevance && (
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

              {/* View Tab 2: Full History Timeline & Change log */}
              {viewTab === 'versions' && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-900">Kompletní historie verzí a novelizací</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Zde naleznete chronologický přehled všech dříve schválených a evidovaných verzí tohoto právního předpisu. Každá verze uchovává kompletní neměnný otisk (snapshot) tehdejší struktury paragrafů pro možnost srovnání historického vývoje.
                    </p>
                  </div>

                  <div className="relative border-l border-slate-200 pl-6 ml-2 space-y-8">
                    {selectedLaw.versions?.map((ver, idx) => (
                      <div key={ver.id} className="relative space-y-2">
                        {/* Bullet circle */}
                        <div className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-4 ${
                          selectedVersionId === ver.id
                            ? 'bg-amber-500 border-amber-200'
                            : 'bg-blue-900 border-blue-150'
                        }`} />

                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-xs font-bold text-slate-900">Verze {ver.versionNumber}</strong>
                          <span className="text-[10px] text-slate-400">({formatDate(ver.effectiveFrom)} {ver.effectiveTo ? `– ${formatDate(ver.effectiveTo)}` : ' (doposud)'})</span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2 max-w-xl">
                          {ver.changeSummary && (
                            <p><strong>Popis změny:</strong> <em>{ver.changeSummary}</em></p>
                          )}
                          <p className="font-mono text-[10px] text-slate-400">HASH: {ver.contentHash.substring(0, 32)}...</p>
                          
                          <button
                            onClick={() => handleSelectVersion(ver)}
                            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                              selectedVersionId === ver.id
                                ? 'bg-amber-500 text-white hover:bg-amber-600'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>{selectedVersionId === ver.id ? 'Zavřít náhled verze' : 'Prohlížet tehdejší znění'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
