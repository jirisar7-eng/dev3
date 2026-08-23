import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Subjekt, EntityType, Review } from '../../types';
import { SubjektyMap } from './SubjektyMap';
import { SeoHead } from './SeoHead';
import {
  MapPin,
  Search,
  Filter,
  Scale,
  Users,
  Award,
  Briefcase,
  HeartHandshake,
  Star,
  ChevronRight,
  Plus,
  ArrowLeft,
  X,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Building2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const CZECH_REGIONS = [
  'Všechny kraje',
  'Hlavní město Praha',
  'Středočeský kraj',
  'Jihočeský kraj',
  'Plzeňský kraj',
  'Karlovarský kraj',
  'Ústecký kraj',
  'Liberecký kraj',
  'Královéhradecký kraj',
  'Pardubický kraj',
  'Kraj Vysočina',
  'Jihomoravský kraj',
  'Olomoucký kraj',
  'Zlínský kraj',
  'Moravskoslezský kraj',
];

const ENTITY_CONFIG: Record<
  EntityType,
  {
    label: string;
    icon: React.FC<{ className?: string }>;
    badgeBg: string;
    badgeText: string;
    pinColor: string;
    desc: string;
  }
> = {
  SOUD: {
    label: 'Opatrovnické soudy',
    icon: Scale,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'Soud',
    pinColor: 'bg-indigo-600',
    desc: 'Okresní, obvodní a krajské soudy',
  },
  OSPOD: {
    label: 'Orgány OSPOD',
    icon: Users,
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
    badgeText: 'OSPOD',
    pinColor: 'bg-red-600',
    desc: 'Oddělení sociálně-právní ochrany dětí',
  },
  ZNALEC: {
    label: 'Soudní znalci & Psychologové',
    icon: Award,
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    badgeText: 'Znalec',
    pinColor: 'bg-purple-600',
    desc: 'Certifikovaní znalci pro dětskou psychologii',
  },
  ADVOKAT: {
    label: 'Advokáti pro rodinné právo',
    icon: Briefcase,
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    badgeText: 'Advokát',
    pinColor: 'bg-sky-600',
    desc: 'Advokáti se specializací na střídavou péči',
  },
  PORADNA_CHARITA: {
    label: 'Poradny & Mediátoři',
    icon: HeartHandshake,
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    badgeText: 'Poradna / Mediace',
    pinColor: 'bg-emerald-600',
    desc: 'Manželské a rodinné poradny a mediátoři',
  },
};

interface MapaSubjektuViewProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const MapaSubjektuView: React.FC<MapaSubjektuViewProps> = ({

  currentPath = '',
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const [subjekty, setSubjekty] = useState<Subjekt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('Všechny kraje');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  // Selected subject for map highlighting & detail modal
  const [selectedSubjektId, setSelectedSubjektId] = useState<string | null>(null);
  const [detailSubjekt, setDetailSubjekt] = useState<Subjekt | null>(null);
  const [showReviewModal, setShowReviewModal] = useState<Subjekt | null>(null);
  const [showAddPracovnikModal, setShowAddPracovnikModal] = useState<boolean>(false);

  // Form states
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    supportSharedCare: 5,
    professionalism: 5,
    speedAndDeadlines: 5,
    comment: '',
    isAnonymous: true,
  });

  const [pracovnikForm, setPracovnikForm] = useState({
    jmeno: '',
    pozice: '',
    telefon: '',
    email: '',
    kancelar: '',
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Extract query parameter on mount or path change
  useEffect(() => {
    let search = '';
    if (currentPath && currentPath.includes('?')) {
      search = currentPath.substring(currentPath.indexOf('?'));
    } else if (typeof window !== 'undefined' && window.location.search) {
      search = window.location.search;
    }

    const params = new URLSearchParams(search);
    const targetSubjectId =
      params.get('subject') || params.get('subjekt') || params.get('id') || null;

    if (targetSubjectId) {
      setSelectedSubjektId(targetSubjectId);
    }
  }, [currentPath]);

  // Fetch subjects from backend API
  useEffect(() => {
    fetchSubjekty();
  }, [activeType, selectedRegion, searchQuery, minRatingFilter]);

  const fetchSubjekty = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== 'ALL') params.append('type', activeType);
      if (selectedRegion && selectedRegion !== 'Všechny kraje') {
        params.append('region', selectedRegion);
        params.append('kraj', selectedRegion);
      }
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (minRatingFilter > 0) params.append('minRating', minRatingFilter.toString());

      const res = await fetch(`/api/subjekty?${params.toString()}`);
      if (res.ok) {
        const data: Subjekt[] = await res.json();
        setSubjekty(data);
      }
    } catch (err) {
      console.error('Error loading subjekty for map:', err);
    } finally {
      setLoading(false);
    }
  };

  // Find targeted subject object
  const targetedSubject = useMemo(() => {
    if (!selectedSubjektId) return null;
    return subjekty.find((s) => s.id === selectedSubjektId) || null;
  }, [selectedSubjektId, subjekty]);

  // Check if targeted subject has coordinates
  const targetedSubjectHasCoords = useMemo(() => {
    if (!targetedSubject) return false;
    return (
      typeof targetedSubject.lat === 'number' &&
      typeof targetedSubject.lng === 'number' &&
      !isNaN(targetedSubject.lat) &&
      !isNaN(targetedSubject.lng)
    );
  }, [targetedSubject]);

  // Subjekty with valid coordinates for the map
  const mapSubjekty = useMemo(() => {
    return subjekty.filter(
      (s) =>
        typeof s.lat === 'number' &&
        typeof s.lng === 'number' &&
        !isNaN(s.lat) &&
        !isNaN(s.lng)
    );
  }, [subjekty]);

  const handleSelectSubjektFromMap = (s: Subjekt) => {
    setSelectedSubjektId(s.id);
    setDetailSubjekt(s);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewModal) return;

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/subjekty/${showReviewModal.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });

      if (res.status === 401 || res.status === 403) {
        if (confirm('Platnost přihlášení vypršela. Chcete se nyní přihlásit?')) {
          if (onNavigate) onNavigate('/login');
          else window.location.href = '/login';
        }
        return;
      }
      if (!res.ok) {
        setSuccessMessage('Chyba při odesílání hodnocení. Zkuste to prosím znovu.');
        setTimeout(() => setSuccessMessage(null), 5000);
        return;
      }

      if (res.ok) {
        setShowReviewModal(null);
        setReviewForm({
          rating: 5,
          supportSharedCare: 5,
          professionalism: 5,
          speedAndDeadlines: 5,
          comment: '',
          isAnonymous: true,
        });
        setSuccessMessage('Děkujeme za hodnocení! Bylo odesláno ke schválení administrátorovi.');
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchSubjekty();
      }
    } catch (err) {
      console.error('Error creating review:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddPracovnik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailSubjekt || !pracovnikForm.jmeno.trim()) return;

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/pracovnici', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pracovnikForm,
          subjektId: detailSubjekt.id,
          status: 'PENDING',
        }),
      });

      if (res.ok) {
        setPracovnikForm({ jmeno: '', pozice: '', telefon: '', email: '', kancelar: '' });
        setShowAddPracovnikModal(false);
        setSuccessMessage('Děkujeme! Návrh byl odeslán ke schválení administrátorovi.');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error adding pracovnik:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SeoHead
        title="Mapa opatrovnických subjektů ČR"
        description="Interaktivní geografická mapa opatrovnických soudů, OSPOD, soudních znalců, advokátů a krizových poraden po celé ČR."
        canonicalPath="/mapa-subjektu"
      />
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate('/registr-subjektu');
                    } else {
                      window.history.pushState({}, '', '/registr-subjektu');
                      window.dispatchEvent(new Event('popstate'));
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zpět do registru subjektů</span>
                </button>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  <span>Interaktivní mapa ČR</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Mapa subjektů opatrovnictví
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Geografický přehled opatrovnických soudů, pracovišť OSPOD, soudních znalců, advokátů a
                poraden se skutečnými souřadnicemi po celé České republice.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('/registr-subjektu');
                  } else {
                    window.history.pushState({}, '', '/registr-subjektu');
                    window.dispatchEvent(new Event('popstate'));
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>Tabulkový seznam</span>
              </button>
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
            {/* Entity category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setActiveType('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeType === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Všechny subjekty ({subjekty.length})
              </button>

              {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((typeKey) => {
                const cfg = ENTITY_CONFIG[typeKey];
                const Icon = cfg.icon;
                const count = subjekty.filter((s) => s.type === typeKey).length;
                return (
                  <button
                    key={typeKey}
                    onClick={() => setActiveType(typeKey)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeType === typeKey
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cfg.badgeText}</span>
                    <span className="opacity-70 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search & Region Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Hledat podle názvu, města, jména znalce či instituce..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="sm:col-span-3">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  aria-label="Filtrovat podle kraje"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  {CZECH_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2">
                <select
                  value={minRatingFilter}
                  onChange={(e) => setMinRatingFilter(Number(e.target.value))}
                  aria-label="Filtrovat podle minimálního hodnocení"
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value={0}>Všechna hodnocení</option>
                  <option value={4}>4.0+ ★★★★★</option>
                  <option value={3}>3.0+ ★★★★☆</option>
                  <option value={2}>2.0+ ★★★☆☆</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TARGETED SUBJECT NOTICE / ALERT */}
      {selectedSubjektId && targetedSubject && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          {targetedSubjectHasCoords ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs text-indigo-950">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-indigo-900 block sm:inline mr-2">
                    Vycentrováno na subjekt:
                  </span>
                  <span className="font-bold">{targetedSubject.name}</span>
                  {targetedSubject.address && (
                    <span className="text-indigo-700 ml-1">({targetedSubject.address})</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailSubjekt(targetedSubject)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Otevřít detail
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubjektId(null)}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                  title="Zrušit zaměření"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-amber-950 text-sm">
                    Poloha tohoto subjektu zatím není dostupná.
                  </h4>
                  <p className="text-amber-800 mt-0.5">
                    Subjekt <strong>{targetedSubject.name}</strong> nemá v databázi zadané geografické
                    souřadnice (lat/lng). Pro tento subjekt proto nevzniká bod na mapě.
                  </p>
                  {targetedSubject.address && (
                    <p className="text-amber-700 mt-1">
                      Adresa: <strong>{targetedSubject.address}</strong>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDetailSubjekt(targetedSubject)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Zobrazit kontakty
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubjektId(null)}
                  className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA: MAP & SIDEBAR LIST */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-280px)] min-h-[550px]">
          {/* MAP CONTAINER (8 or 12 cols) */}
          <div className="lg:col-span-8 h-full flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>
                Zobrazeno <strong>{mapSubjekty.length}</strong> z celkem{' '}
                <strong>{subjekty.length}</strong> subjektů se souřadnicemi
              </span>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Layers className="w-3 h-3" />
                  Kliknutím na značku otevřete vizitku
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>{sidebarOpen ? 'Skrýt seznam' : 'Zobrazit seznam'}</span>
                </button>
              </div>
            </div>

            <div className="flex-1 rounded-3xl overflow-hidden shadow-sm border border-slate-200 bg-white relative">
              {loading ? (
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center space-y-3 z-10">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Načítám mapu a body...</p>
                </div>
              ) : (
                <SubjektyMap
                  subjekty={subjekty}
                  selectedSubjektId={selectedSubjektId}
                  onSelectSubjekt={handleSelectSubjektFromMap}
                  height="h-full min-h-[480px]"
                />
              )}
            </div>
          </div>

          {/* SIDEBAR LIST (4 cols) */}
          <div
            className={`lg:col-span-4 h-full flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm p-4 overflow-hidden ${
              sidebarOpen ? 'block' : 'hidden lg:flex'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Seznam subjektů ({subjekty.length})</span>
              </h3>
              <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {selectedRegion !== 'Všechny kraje' ? selectedRegion : 'Celá ČR'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 mt-3 scrollbar-thin">
              {subjekty.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Nenalezeny žádné subjekty podle zadaných kritérií.
                </div>
              ) : (
                subjekty.map((s) => {
                  const isSelected = s.id === selectedSubjektId;
                  const cfg = ENTITY_CONFIG[s.type] || ENTITY_CONFIG.SOUD;
                  const Icon = cfg.icon;
                  const hasCoords =
                    typeof s.lat === 'number' &&
                    typeof s.lng === 'number' &&
                    !isNaN(s.lat) &&
                    !isNaN(s.lng);

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedSubjektId(s.id);
                        if (hasCoords) {
                          // Already set selectedSubjektId to center map
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${cfg.badgeBg}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{cfg.badgeText}</span>
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{s.avgRating > 0 ? s.avgRating.toFixed(1) : '–'}</span>
                          <span className="text-slate-400 font-normal text-[10px]">({s.reviewCount})</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {s.titleBefore ? `${s.titleBefore} ` : ''}
                        {s.name}
                      </h4>

                      {s.position && (
                        <p className="text-[11px] text-indigo-600 font-medium mt-0.5 leading-tight">
                          {s.position}
                        </p>
                      )}

                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-600 text-[11px] truncate">
                          <MapPin className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="truncate">{s.city || s.region}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasCoords ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Na mapě
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Bez polohy</span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailSubjekt(s);
                            }}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="Otevřít detail"
                          >
                            Detail
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailSubjekt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailSubjekt(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    (ENTITY_CONFIG[detailSubjekt.type] || ENTITY_CONFIG.SOUD).badgeBg
                  }`}
                >
                  {(ENTITY_CONFIG[detailSubjekt.type] || ENTITY_CONFIG.SOUD).badgeText}
                </span>
                {detailSubjekt.isVerified && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ověřený subjekt</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {detailSubjekt.titleBefore && (
                  <span className="text-slate-500 font-medium mr-1.5">
                    {detailSubjekt.titleBefore}
                  </span>
                )}
                {detailSubjekt.name}
              </h2>

              {detailSubjekt.position && (
                <p className="text-sm font-semibold text-indigo-600 mt-1">{detailSubjekt.position}</p>
              )}
              {detailSubjekt.institution && (
                <p className="text-xs text-slate-500 mt-0.5">{detailSubjekt.institution}</p>
              )}
            </div>

            {/* Rating Summary Bar & Action */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-black text-slate-900">
                    {detailSubjekt.avgRating > 0 ? detailSubjekt.avgRating.toFixed(1) : '–'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-800 block">
                    {detailSubjekt.reviewCount} recenzí
                  </span>
                  <span>od reálných rodičů</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowReviewModal(detailSubjekt);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                + Přidat hodnocení
              </button>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <span>{detailSubjekt.address || `${detailSubjekt.city}, ${detailSubjekt.region}`}</span>
                </div>
                {typeof detailSubjekt.lat === 'number' &&
                typeof detailSubjekt.lng === 'number' &&
                !isNaN(detailSubjekt.lat) &&
                !isNaN(detailSubjekt.lng) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubjektId(detailSubjekt.id);
                      setDetailSubjekt(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-6.5 mt-0.5 cursor-pointer group text-left"
                  >
                    <MapPin className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="underline decoration-indigo-300 hover:decoration-indigo-600">
                      Zobrazit na mapě
                    </span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 italic ml-6.5 mt-0.5">
                    Poloha tohoto subjektu zatím není dostupná.
                  </span>
                )}
              </div>

              {detailSubjekt.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${detailSubjekt.phone.replace(/\s+/g, '')}`} className="text-indigo-600 hover:underline">
                    {detailSubjekt.phone}
                  </a>
                </div>
              )}

              {detailSubjekt.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${detailSubjekt.email}`} className="truncate text-indigo-600 hover:underline">
                    {detailSubjekt.email}
                  </a>
                </div>
              )}

              {detailSubjekt.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={detailSubjekt.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline truncate"
                  >
                    {detailSubjekt.website}
                  </a>
                </div>
              )}
            </div>

            {/* Workers / Contact Persons Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Konkrétní pracovníci / Kontakty ({detailSubjekt.pracovnici?.length || 0})</span>
                </h3>
                <button
                  onClick={() => setShowAddPracovnikModal(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Navrhnout pracovníka</span>
                </button>
              </div>

              {!detailSubjekt.pracovnici || detailSubjekt.pracovnici.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center text-xs text-slate-500 italic">
                  Zatím zde nejsou evidováni žádní konkrétní pracovníci.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {detailSubjekt.pracovnici.map((prac) => (
                    <div
                      key={prac.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{prac.jmeno}</h4>
                            {prac.pozice && (
                              <p className="text-[11px] text-indigo-600 font-semibold">{prac.pozice}</p>
                            )}
                          </div>
                          {prac.kancelar && (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {prac.kancelar}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                        {prac.telefon && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{prac.telefon}</span>
                          </div>
                        )}
                        {prac.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{prac.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Věcné zkušenosti a hodnocení rodičů ({detailSubjekt.reviews?.length || 0})</span>
              </h3>

              {!detailSubjekt.reviews || detailSubjekt.reviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">
                  Zatím nebyly přidány žádné ověřené zkušenosti. Buďte první, kdo napíše hodnocení!
                </p>
              ) : (
                <div className="space-y-3">
                  {detailSubjekt.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="text-amber-500 font-black">{rev.rating} ★</span>
                          <span>{rev.isAnonymous ? 'Anonymní rodič' : 'Ověřený rodič'}</span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(rev.createdAt).toLocaleDateString('cs-CZ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1.5 border-y border-slate-200/60 text-[11px] text-slate-600">
                        <div>
                          <span className="text-slate-400 block">Střídavá péče:</span>
                          <span className="font-bold text-slate-800">{rev.supportSharedCare}/5</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Odbornost:</span>
                          <span className="font-bold text-slate-800">{rev.professionalism}/5</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Lhůty & rychlost:</span>
                          <span className="font-bold text-slate-800">{rev.speedAndDeadlines}/5</span>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed pt-1">{rev.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowReviewModal(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Věcné hodnocení subjektu
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                {showReviewModal.name}
              </h2>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Celkový dojem (1–5):</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, rating: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} hvězdiček
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Podpora střídavé péče:</label>
                  <select
                    value={reviewForm.supportSharedCare}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, supportSharedCare: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} / 5 bodů
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Odbornost & objektivita:</label>
                  <select
                    value={reviewForm.professionalism}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, professionalism: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} / 5 bodů
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Dodržování lhůt & rychlost:</label>
                  <select
                    value={reviewForm.speedAndDeadlines}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, speedAndDeadlines: Number(e.target.value) })
                    }
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {[5, 4, 3, 2, 1].map((v) => (
                      <option key={v} value={v}>
                        {v} / 5 bodů
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  Věcný popis vaší zkušenosti (bez vulgarit):
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Popište průběh jednání, přístup k oběma rodičům, objektivitu posudku či zprávy..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mapReviewAnon"
                  checked={reviewForm.isAnonymous}
                  onChange={(e) => setReviewForm({ ...reviewForm, isAnonymous: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <label htmlFor="mapReviewAnon" className="text-slate-700 font-medium">
                  Zveřejnit jako anonymní rodič (doporučeno z důvodu ochrany soukromí)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                {currentUser ? (
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Odesílám...' : 'Odeslat hodnocení'}
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-amber-600 font-semibold text-xs">Pro přidání hodnocení se musíte přihlásit.</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('/login');
                        } else {
                          window.location.href = '/login';
                        }
                      }}
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-sm cursor-pointer"
                    >
                      Přihlásit se pro přidání hodnocení
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD WORKER MODAL */}
      {showAddPracovnikModal && detailSubjekt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddPracovnikModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Kontaktní osoba / Pracovník
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Přidat pracovníka k: {detailSubjekt.name}
              </h2>
            </div>

            <form onSubmit={handleAddPracovnik} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Jméno a titul: *</label>
                <input
                  type="text"
                  required
                  value={pracovnikForm.jmeno}
                  onChange={(e) => setPracovnikForm({ ...pracovnikForm, jmeno: e.target.value })}
                  placeholder="např. Bc. Jana Nováková"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Pozice / Funkce:</label>
                <input
                  type="text"
                  value={pracovnikForm.pozice}
                  onChange={(e) => setPracovnikForm({ ...pracovnikForm, pozice: e.target.value })}
                  placeholder="např. Sociální pracovnice / Kurátorka pro děti"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Telefon:</label>
                  <input
                    type="text"
                    value={pracovnikForm.telefon}
                    onChange={(e) =>
                      setPracovnikForm({ ...pracovnikForm, telefon: e.target.value })
                    }
                    placeholder="+420 123 456 789"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">E-mail:</label>
                  <input
                    type="email"
                    value={pracovnikForm.email}
                    onChange={(e) =>
                      setPracovnikForm({ ...pracovnikForm, email: e.target.value })
                    }
                    placeholder="jmeno@urad.cz"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Kancelář / Dveře:</label>
                <input
                  type="text"
                  value={pracovnikForm.kancelar}
                  onChange={(e) =>
                    setPracovnikForm({ ...pracovnikForm, kancelar: e.target.value })
                  }
                  placeholder="např. 2. patro, dveře 214"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPracovnikModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Ukládám...' : 'Navrhnout pracovníka'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
