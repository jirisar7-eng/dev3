import React, { useState, useEffect } from 'react';
import { Subjekt, EntityType, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { SubjektyMap } from './SubjektyMap';
import { SeoHead } from './SeoHead';
import {
  Scale,
  Users,
  Award,
  Briefcase,
  HeartHandshake,
  Search,
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Filter,
  Plus,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  X,
  ChevronRight,
  Sparkles,
  Building2,
  AlertCircle,
  ThumbsUp,
  Clock,
  BookOpen
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

const ENTITY_CONFIG: Record<EntityType, { label: string; icon: React.FC<{ className?: string }>; badgeBg: string; badgeText: string; desc: string }> = {
  SOUD: {
    label: 'Opatrovnické soudy',
    icon: Scale,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'Soud',
    desc: 'Okresní, obvodní a krajské soudy rozhodující o péči a výživném',
  },
  OSPOD: {
    label: 'Orgány OSPOD',
    icon: Users,
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
    badgeText: 'OSPOD',
    desc: 'Oddělení sociálně-právní ochrany dětí vykonávající kolizní opatrovnictví',
  },
  ZNALEC: {
    label: 'Soudní znalci & Psychologové',
    icon: Award,
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    badgeText: 'Znalec',
    desc: 'Certifikovaní znalci pro dětskou a klinickou psychologii a psychiatrii',
  },
  ADVOKAT: {
    label: 'Advokáti pro rodinné právo',
    icon: Briefcase,
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    badgeText: 'Advokát',
    desc: 'Advokáti se specializací na střídavou péči, mediaci a úpravu poměrů',
  },
  PORADNA_CHARITA: {
    label: 'Poradny & Mediátoři',
    icon: HeartHandshake,
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    badgeText: 'Poradna / Mediace',
    desc: 'Manželské a rodinné poradny, krizové centrum a akreditovaní mediátoři',
  },
};

export const RegistrSubjektu: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [subjekty, setSubjekty] = useState<Subjekt[]>([]);
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [activeType, setActiveType] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('Všechny kraje');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'LIST' | 'MAP'>('LIST');

  // P3 ARES Verification state
  const [aresIco, setAresIco] = useState('');
  const [aresResult, setAresResult] = useState<any | null>(null);
  const [aresLoading, setAresLoading] = useState(false);

  // Modals state
  const [selectedSubjekt, setSelectedSubjekt] = useState<Subjekt | null>(null);
  const [showAddSubjektModal, setShowAddSubjektModal] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<Subjekt | null>(null);
  const [showAddPracovnikModal, setShowAddPracovnikModal] = useState<boolean>(false);

  const handleVerifyAres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aresIco.trim()) return;
    setAresLoading(true);
    try {
      const res = await fetch(`/api/state-admin/registries/verify-professional?ico=${encodeURIComponent(aresIco.trim())}`);
      const data = await res.json();
      setAresResult(data);
    } catch (err) {
      setAresResult({
        success: false,
        source: 'P3_PUBLIC_REGISTRIES_ARES',
        fetchedAt: new Date().toISOString(),
        data: null,
        error: 'Chyba při komunikaci s ARES v3 API.',
      });
    } finally {
      setAresLoading(false);
    }
  };

  // New Subjekt Form
  const [newSubjektForm, setNewSubjektForm] = useState({
    type: 'SOUD' as EntityType,
    name: '',
    titleBefore: '',
    position: '',
    institution: '',
    city: '',
    region: 'Pardubický kraj',
    address: '',
    email: '',
    phone: '',
    website: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
  });

  // Review Form
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    supportSharedCare: 5,
    professionalism: 5,
    speedAndDeadlines: 5,
    comment: '',
    isAnonymous: true,
  });

  // Worker rating state
  const [showPracovnikRatingModal, setShowPracovnikRatingModal] = useState<boolean>(false);
  const [selectedPracovnikForRating, setSelectedPracovnikForRating] = useState<any | null>(null);
  const [pracovnikReviewForm, setPracovnikReviewForm] = useState({
    rating: 5,
    objektivita: 5,
    komunikace: 5,
    rychlost: 5,
    comment: '',
    isAnonymous: true,
  });

  // Pracovnik Form
  const [pracovnikForm, setPracovnikForm] = useState({
    jmeno: '',
    pozice: '',
    telefon: '',
    email: '',
    kancelar: '',
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeWarning, setGeocodeWarning] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<Subjekt | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddPracovnik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjekt || !pracovnikForm.jmeno.trim()) return;
    try {
      const res = await fetch('/api/pracovnici', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pracovnikForm,
          subjektId: selectedSubjekt.id,
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
    }
  };

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
        const data = await res.json();
        setSubjekty(data);
      }
    } catch (err) {
      console.error('Error loading subjekty:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubjekt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjektForm.name || !newSubjektForm.city || !newSubjektForm.region) return;

    if (!newSubjektForm.lat && !geocodeWarning) {
      // Step 1: Geocode
      setGeocodeLoading(true);
      try {
        const geoRes = await fetch('/api/subjekty/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: newSubjektForm.address, city: newSubjektForm.city })
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          // Check if city matches
          if (newSubjektForm.city && geoData.name && !geoData.name.toLowerCase().includes(newSubjektForm.city.toLowerCase())) {
            setGeocodeWarning(`⚠️ Výsledek geokódování neodpovídá zadanému městu (${geoData.name}). Prosím, potvrďte polohu nebo ji upravte.`);
            setNewSubjektForm({ ...newSubjektForm, lat: geoData.lat, lng: geoData.lng });
            setGeocodeLoading(false);
            return;
          }
          setNewSubjektForm({ ...newSubjektForm, lat: geoData.lat, lng: geoData.lng });
        } else {
          setGeocodeWarning('⚠️ Lokace nenalezena. Můžete návrh odeslat bez GPS.');
          setGeocodeLoading(false);
          return;
        }
      } catch (err) {
        setGeocodeWarning('⚠️ Chyba geokódování. Můžete návrh odeslat bez GPS.');
        setGeocodeLoading(false);
        return;
      }
      setGeocodeLoading(false);
    }
    
    // Step 2: Check Duplicates
    if (!duplicateWarning) {
      const isDuplicate = subjekty.find(s => 
        s.name.toLowerCase() === newSubjektForm.name.toLowerCase() && 
        s.city.toLowerCase() === newSubjektForm.city.toLowerCase()
      );
      if (isDuplicate) {
        setDuplicateWarning(isDuplicate);
        return;
      }
    }

    // Step 3: Submit
    setFormSubmitting(true);
    try {
      const res = await fetch('/api/subjekty/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubjektForm),
      });
      if (res.ok) {
        setShowAddSubjektModal(false);
        setNewSubjektForm({
          type: 'SOUD', name: '', titleBefore: '', position: '', institution: '', city: '', region: 'Pardubický kraj', address: '', email: '', phone: '', website: '', lat: undefined, lng: undefined
        });
        setGeocodeWarning(null);
        setDuplicateWarning(null);
        setSuccessMessage('Děkujeme. Návrh subjektu byl odeslán ke kontrole administrátorovi.');
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchSubjekty();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReviewModal || !reviewForm.comment) return;

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
        setSuccessMessage('Vaše věcné hodnocení bylo úspěšně uloženo!');
        setTimeout(() => setSuccessMessage(null), 4000);
        fetchSubjekty();

        // Refresh detail if open
        if (selectedSubjekt && selectedSubjekt.id === showReviewModal.id) {
          const detailRes = await fetch(`/api/subjekty/${selectedSubjekt.id}`);
          if (detailRes.ok) {
            const updatedDetail = await detailRes.json();
            setSelectedSubjekt(updatedDetail);
          }
        }
      }
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleAddPracovnikReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjekt || !selectedPracovnikForRating || !pracovnikReviewForm.comment) return;

    setFormSubmitting(true);
    try {
      const res = await fetch(`/api/subjekty/${selectedSubjekt.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pracovnikReviewForm,
          pracovnikId: selectedPracovnikForRating.id,
        }),
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
        setShowPracovnikRatingModal(false);
        setPracovnikReviewForm({
          rating: 5,
          objektivita: 5,
          komunikace: 5,
          rychlost: 5,
          comment: '',
          isAnonymous: true,
        });
        setSuccessMessage('Vaše hodnocení pracovníka bylo úspěšně odesláno!');
        setTimeout(() => setSuccessMessage(null), 4000);

        // Refresh detail to get the new reviews of the workers
        const detailRes = await fetch(`/api/subjekty/${selectedSubjekt.id}`);
        if (detailRes.ok) {
          const updatedDetail = await detailRes.json();
          setSelectedSubjekt(updatedDetail);
        }
      }
    } catch (err) {
      console.error('Error adding worker review:', err);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Registr & Hodnocení opatrovnických subjektů"
        description="Transparentní registr soudců, orgánů OSPOD, znalců a rodinných advokátů. Ověřené zkušenosti rodičů s podporou střídavé péče a dodržováním práv dítěte."
        canonicalPath="/registr-subjektu"
      />
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ověřené zkušenosti rodičů & Transparentní registr</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Registr & Hodnocení Opatrovnických Subjektů
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Vyhledávejte opatrovnické soudce, orgány OSPOD, soudní znalce, psychology, rodinné advokáty i odborné poradny. Získejte věcnou zpětnou vazbu zaměřenou na podporu rovnocenné péče, odbornost a rychlost jednání.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddSubjektModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Přidat subjekt / Doporučit odborníka</span>
            </button>
            <a
              href="#metodika"
              onClick={(e) => {
                e.preventDefault();
                alert('Hodnocení vychází z věcných kritérií: 1) Podpora střídavé/společné péče, 2) Věcnost a odbornost, 3) Dodržování lhůt a rychlost.');
              }}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-2xl transition-all text-sm backdrop-blur-xs"
            >
              <BookOpen className="w-4 h-4 text-indigo-300" />
              <span>Metodika hodnocení</span>
            </a>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs (Entity Types) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveType('ALL')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeType === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>Všechny subjekty</span>
        </button>

        {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((typeKey) => {
          const cfg = ENTITY_CONFIG[typeKey];
          const Icon = cfg.icon;
          const isActive = activeType === typeKey;
          return (
            <button
              key={typeKey}
              onClick={() => setActiveType(typeKey)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 text-indigo-400" />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar (Search & Location) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-12 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat podle jména, instituce, města nebo pozice..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Region Dropdown */}
        <div className="w-full md:w-64">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {CZECH_REGIONS.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* Min Rating Filter */}
        <div className="w-full md:w-48">
          <select
            value={minRatingFilter}
            onChange={(e) => setMinRatingFilter(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value={0}>Libovolné hodnocení</option>
            <option value={4}>4.0+ hvězdiček ★</option>
            <option value={4.5}>4.5+ hvězdiček ★</option>
          </select>
        </div>
      </div>

      {/* P3 ARES PROFESSIONAL VERIFICATION CARD */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              P3 – Ověření subjektu v ARES v3 (IČO advokáta, znalce, poradenství)
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Zdroj: ARES v3 (MFCR / ARES API v3)
          </span>
        </div>

        <form onSubmit={handleVerifyAres} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={aresIco}
            onChange={(e) => setAresIco(e.target.value)}
            placeholder="Zadejte IČO subjektu (např. 70890692, 00231339)..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-800"
          />
          <button
            type="submit"
            disabled={aresLoading || !aresIco.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {aresLoading ? 'Ověřuji v ARES...' : 'Ověřit v ARES v3'}
          </button>
        </form>

        {aresResult && (
          <div className="pt-2">
            {aresResult.success && aresResult.data ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Subjekt ověřen v ARES v3 (Aktivní)</span>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Aktualizováno: {new Date(aresResult.fetchedAt).toLocaleString('cs-CZ')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div><strong className="text-slate-600 font-sans block text-[10px]">Název:</strong> {aresResult.data.name}</div>
                  <div><strong className="text-slate-600 font-sans block text-[10px]">IČO:</strong> {aresResult.data.ico}</div>
                  <div><strong className="text-slate-600 font-sans block text-[10px]">Sídlo:</strong> {aresResult.data.address}</div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-950 space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Subjekt nebylo možné ověřit v ARES v3</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  {aresResult.error || 'Zadané IČO nebylo nalezeno nebo je ARES v3 API dočasně nedostupné.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subjekty List */}
      {(() => {
        const filteredSubjekty = subjekty.filter((item) => {
          if (!selectedRegion || selectedRegion === "Všechny kraje") return true;
          const selectedNorm = selectedRegion.trim().toLowerCase();
          const itemRegion = (item.region || "").trim().toLowerCase();
          return itemRegion === selectedNorm || itemRegion.includes(selectedNorm);
        });

        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="bg-slate-100 p-1 rounded-xl flex items-center shadow-inner inline-flex">
                <button
                  onClick={() => setViewMode("LIST")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === "LIST" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Seznam
                </button>
                <button
                  onClick={() => setViewMode("MAP")}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === "MAP" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Mapa
                </button>
              </div>
            </div>
            {loading ? (
              <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium">Načítám registr subjektů...</p>
              </div>
            ) : viewMode === "MAP" ? (
              <SubjektyMap
                subjekty={filteredSubjekty}
                selectedSubjektId={selectedSubjekt?.id}
                onSelectSubjekt={(subj) => setSelectedSubjekt(subj)}
              />
            ) : filteredSubjekty.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">Nenalezeny žádné zadané subjekty</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Zkus upravit vyhledávací dotaz nebo filtr krajů. Můžeš také do registru vložit nový subjekt.
                </p>
                <button
                  onClick={() => setShowAddSubjektModal(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-2xl shadow-xs transition-all text-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Přidat nový subjekt</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjekty.map((item) => {
                  const cfg = ENTITY_CONFIG[item.type] || ENTITY_CONFIG.SOUD;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
                    >
                <div className="space-y-3">
                  {/* Category Badge & Rating */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.badgeBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cfg.badgeText}</span>
                    </span>

                    {/* Rating badge */}
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{item.avgRating > 0 ? item.avgRating.toFixed(1) : 'Nové'}</span>
                      <span className="text-slate-400 font-normal">({item.reviewCount})</span>
                    </div>
                  </div>

                  {/* Title & Position */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.titleBefore && <span className="font-medium text-slate-500 mr-1">{item.titleBefore}</span>}
                      {item.name}
                    </h3>
                    {item.position && <p className="text-xs text-slate-600 font-medium mt-0.5">{item.position}</p>}
                    {item.institution && <p className="text-xs text-slate-500 mt-0.5">{item.institution}</p>}
                  </div>

                  {/* Contact details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{item.city}, {item.region}</span>
                    </div>
                    {item.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                    {item.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedSubjekt(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    <span>Detail a recenze</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowReviewModal(item)}
                    className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Hodnotit</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
            )}
          </div>
        );
      })()}

      {/* DETAIL MODAL */}
      {selectedSubjekt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSubjekt(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header detail */}
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ENTITY_CONFIG[selectedSubjekt.type].badgeBg}`}>
                  {ENTITY_CONFIG[selectedSubjekt.type].badgeText}
                </span>
                <span className="text-xs text-slate-500">{selectedSubjekt.region}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                {selectedSubjekt.titleBefore} {selectedSubjekt.name}
              </h2>
              {selectedSubjekt.position && <p className="text-sm font-semibold text-slate-700">{selectedSubjekt.position}</p>}
              {selectedSubjekt.institution && <p className="text-xs text-slate-500">{selectedSubjekt.institution}</p>}
            </div>

            {/* Rating Overview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-slate-900">{selectedSubjekt.avgRating > 0 ? selectedSubjekt.avgRating.toFixed(1) : '—'}</span>
                  <div className="flex items-center text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s <= Math.round(selectedSubjekt.avgRating) ? 'fill-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">Celkové hodnocení na základě {selectedSubjekt.reviewCount} recenzí</p>
              </div>

              <button
                onClick={() => {
                  const item = selectedSubjekt;
                  setSelectedSubjekt(null);
                  setShowReviewModal(item);
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
                  <span>{selectedSubjekt.address || `${selectedSubjekt.city}, ${selectedSubjekt.region}`}</span>
                </div>
                {typeof selectedSubjekt.lat === 'number' &&
                typeof selectedSubjekt.lng === 'number' &&
                !isNaN(selectedSubjekt.lat) &&
                !isNaN(selectedSubjekt.lng) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubjekt(null);
                      if (onNavigate) {
                        onNavigate(`/mapa-subjektu?subject=${selectedSubjekt.id}`);
                      } else {
                        window.history.pushState({}, '', `/mapa-subjektu?subject=${selectedSubjekt.id}`);
                        window.dispatchEvent(new Event('popstate'));
                      }
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
              {selectedSubjekt.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{selectedSubjekt.phone}</span>
                </div>
              )}
              {selectedSubjekt.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{selectedSubjekt.email}</span>
                </div>
              )}
              {selectedSubjekt.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={selectedSubjekt.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate">
                    {selectedSubjekt.website}
                  </a>
                </div>
              )}
            </div>

            {/* Workers / Contact Persons Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Konkrétní pracovníci / Kontakty ({selectedSubjekt.pracovnici?.length || 0})</span>
                </h3>
                <button
                  onClick={() => setShowAddPracovnikModal(true)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer border border-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Navrhnout / Přidat pracovníka</span>
                </button>
              </div>

              {!selectedSubjekt.pracovnici || selectedSubjekt.pracovnici.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center text-xs text-slate-500 italic">
                  Zatím zde nejsou evidováni žádní konkrétní pracovníci (sociální pracovníci, soudci, kurátoři).
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSubjekt.pracovnici.map((prac) => {
                    const pracReviews = prac.reviews || [];
                    const pracAvgRating = pracReviews.length > 0
                      ? (pracReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / pracReviews.length).toFixed(1)
                      : null;

                    return (
                      <div key={prac.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{prac.jmeno}</h4>
                              {prac.pozice && <p className="text-[11px] text-indigo-600 font-semibold">{prac.pozice}</p>}
                            </div>
                            {prac.kancelar && (
                              <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {prac.kancelar}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 pt-1.5 text-xs text-slate-600">
                            {prac.telefon && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a href={`tel:${prac.telefon}`} className="hover:text-indigo-600 font-medium">{prac.telefon}</a>
                              </div>
                            )}
                            {prac.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <a href={`mailto:${prac.email}`} className="hover:text-indigo-600 truncate">{prac.email}</a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2">
                          <div className="flex items-center gap-1">
                            {pracAvgRating ? (
                              <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 font-extrabold text-[11px] px-2 py-0.5 rounded-lg border border-amber-200">
                                ★ {pracAvgRating} <span className="text-[9px] font-normal text-slate-500">({pracReviews.length}x)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Zatím nehodnocen</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPracovnikForRating(prac);
                              setShowPracovnikRatingModal(true);
                            }}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-400" />
                            <span>Hodnotit</span>
                          </button>
                        </div>

                        {pracReviews.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-200 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Zkušenosti rodičů ({pracReviews.length}):</span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {pracReviews.map((rev: any) => (
                                <div key={rev.id} className="bg-white border border-slate-100 rounded-xl p-2 space-y-1.5 shadow-2xs">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-extrabold text-amber-600">★ {rev.rating}/5</span>
                                    <span className="text-slate-400">{new Date(rev.createdAt).toLocaleDateString('cs-CZ')}</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-1 text-[9px] text-slate-500 bg-slate-50 p-1 rounded-md text-center">
                                    <div>
                                      <span className="block font-semibold">Objektivita</span>
                                      <span>{rev.objektivita ?? rev.rating}/5</span>
                                    </div>
                                    <div>
                                      <span className="block font-semibold">Komunikace</span>
                                      <span>{rev.komunikace ?? rev.rating}/5</span>
                                    </div>
                                    <div>
                                      <span className="block font-semibold">Rychlost</span>
                                      <span>{rev.rychlost ?? rev.rating}/5</span>
                                    </div>
                                  </div>
                                  {rev.comment && (
                                    <p className="text-[10.5px] text-slate-600 italic leading-snug">
                                      "{rev.comment}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reviews list */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Věcné zkušenosti a hodnocení rodičů ({selectedSubjekt.reviews?.length || 0})
              </h3>

              {!selectedSubjekt.reviews || selectedSubjekt.reviews.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">Zatím nebyly přidány žádné ověřené zkušenosti. Buďte první, kdo napíše hodnocení!</p>
              ) : (
                <div className="space-y-3">
                  {selectedSubjekt.reviews.map((rev) => (
                    <div key={rev.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="text-amber-500 font-black">{rev.rating} ★</span>
                          <span>{rev.isAnonymous ? 'Anonymní rodič' : 'Ověřený rodič'}</span>
                        </div>
                        <span className="text-slate-400">{new Date(rev.createdAt).toLocaleDateString('cs-CZ')}</span>
                      </div>

                      {/* Criteria breakdown */}
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
                          <span className="text-slate-400 block">Rychlost/lhůty:</span>
                          <span className="font-bold text-slate-800">{rev.speedAndDeadlines}/5</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REVIEW FORM MODAL */}
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
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Věcné hodnocení</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Hodnocení: {showReviewModal.name}
              </h2>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              {/* Overall rating */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Celkové hodnocení (1-5 hvězdiček):</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        reviewForm.rating >= num ? 'text-amber-400 bg-amber-50' : 'text-slate-300 bg-slate-100'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${reviewForm.rating >= num ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criteria Ratings */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Podpora střídavé/společné péče:</span>
                    <span className="font-bold text-indigo-600">{reviewForm.supportSharedCare} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewForm.supportSharedCare}
                    onChange={(e) => setReviewForm({ ...reviewForm, supportSharedCare: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Věcnost a odbornost:</span>
                    <span className="font-bold text-indigo-600">{reviewForm.professionalism} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewForm.professionalism}
                    onChange={(e) => setReviewForm({ ...reviewForm, professionalism: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Dodržování lhůt a rychlost:</span>
                    <span className="font-bold text-indigo-600">{reviewForm.speedAndDeadlines} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={reviewForm.speedAndDeadlines}
                    onChange={(e) => setReviewForm({ ...reviewForm, speedAndDeadlines: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Slovní zkušenost / komentář:</label>
                <textarea
                  required
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Popište věcně svou zkušenost s tímto subjektu (např. průběh jednání, přístup k dítěti)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={reviewForm.isAnonymous}
                  onChange={(e) => setReviewForm({ ...reviewForm, isAnonymous: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Zveřejnit hodnocení jako Anonymní rodič</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Zrušit
                </button>
                {currentUser ? (
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Ukládám...' : 'Odeslat hodnocení'}
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
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
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

      {/* ADD NEW SUBJEKT MODAL */}
      {showAddSubjektModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddSubjektModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Registr Opatrovnictví</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Přidat subjekt / Doporučit odborníka
              </h2>
            </div>

            <form onSubmit={handleCreateSubjekt} className="space-y-4 text-xs">

              {geocodeWarning && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 text-xs flex flex-col gap-2">
                  <span>{geocodeWarning}</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setGeocodeWarning(null)} className="px-3 py-1 bg-white rounded border border-amber-300 font-bold hover:bg-amber-100">Pokračovat a odeslat</button>
                  </div>
                </div>
              )}
              {duplicateWarning && (
                <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-200 text-xs flex flex-col gap-2">
                  <span>⚠️ Podobný subjekt (<strong>{duplicateWarning.name}</strong>) již v registru existuje.</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setDuplicateWarning(null); setShowAddSubjektModal(false); window.open('/mapa-subjektu?id=' + duplicateWarning.id, '_blank'); }} className="px-3 py-1 bg-white rounded border border-red-300 font-bold hover:bg-red-100">Zkontrolovat existující</button>
                    <button type="button" onClick={() => setDuplicateWarning(null)} className="px-3 py-1 bg-white rounded border border-red-300 font-bold hover:bg-red-100">Přesto odeslat návrh</button>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Typ subjektu:</label>
                <select
                  value={newSubjektForm.type}
                  onChange={(e) => setNewSubjektForm({ ...newSubjektForm, type: e.target.value as EntityType })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium"
                >
                  <option value="SOUD">Opatrovnický soud</option>
                  <option value="OSPOD">Orgán OSPOD</option>
                  <option value="ZNALEC">Soudní znalec / Psycholog</option>
                  <option value="ADVOKAT">Advokát pro rodinné právo</option>
                  <option value="PORADNA_CHARITA">Poradna / Mediátor</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Titul (před):</label>
                  <input
                    type="text"
                    placeholder="PhDr., JUDr."
                    value={newSubjektForm.titleBefore}
                    onChange={(e) => setNewSubjektForm({ ...newSubjektForm, titleBefore: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="font-bold text-slate-800 block">Jméno a příjmení / Název:</label>
                  <input
                    type="text"
                    required
                    placeholder="Např. Okresní soud v Přelouči nebo MUDr. Jan Novák"
                    value={newSubjektForm.name}
                    onChange={(e) => setNewSubjektForm({ ...newSubjektForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Funkce / Pozice:</label>
                <input
                  type="text"
                  placeholder="Soudce opatrovnického oddělení, Dětský psycholog..."
                  value={newSubjektForm.position}
                  onChange={(e) => setNewSubjektForm({ ...newSubjektForm, position: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Pracoviště / Kancelář:</label>
                <input
                  type="text"
                  placeholder="Název úřadu / advokátní kanceláře"
                  value={newSubjektForm.institution}
                  onChange={(e) => setNewSubjektForm({ ...newSubjektForm, institution: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Město:</label>
                  <input
                    type="text"
                    required
                    placeholder="Pardubice"
                    value={newSubjektForm.city}
                    onChange={(e) => setNewSubjektForm({ ...newSubjektForm, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Kraj:</label>
                  <select
                    value={newSubjektForm.region}
                    onChange={(e) => setNewSubjektForm({ ...newSubjektForm, region: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium"
                  >
                    {CZECH_REGIONS.filter((r) => r !== 'Všechny kraje').map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Adresa:</label>
                <input
                  type="text"
                  placeholder="Ulica, Číslo popisné, PSČ"
                  value={newSubjektForm.address}
                  onChange={(e) => setNewSubjektForm({ ...newSubjektForm, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Telefon:</label>
                  <input
                    type="text"
                    placeholder="+420 123 456 789"
                    value={newSubjektForm.phone}
                    onChange={(e) => setNewSubjektForm({ ...newSubjektForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">E-mail:</label>
                  <input
                    type="email"
                    placeholder="kontakt@subjekt.cz"
                    value={newSubjektForm.email}
                    onChange={(e) => setNewSubjektForm({ ...newSubjektForm, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Webové stránky:</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newSubjektForm.website}
                  onChange={(e) => setNewSubjektForm({ ...newSubjektForm, website: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubjektModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {formSubmitting ? 'Ukládám...' : 'Zaevidovat subjekt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ADD WORKER MODAL */}
      {showAddPracovnikModal && selectedSubjekt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowAddPracovnikModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Kontaktní osoba / Pracovník</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Přidat pracovníka k: {selectedSubjekt.name}
              </h2>
            </div>

            <form onSubmit={handleAddPracovnik} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Jméno a titul (např. Bc. Pavelková): *</label>
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
                  placeholder="např. Sociální pracovnice OSPOD, Soudce"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Přímý telefon:</label>
                  <input
                    type="text"
                    value={pracovnikForm.telefon}
                    onChange={(e) => setPracovnikForm({ ...pracovnikForm, telefon: e.target.value })}
                    placeholder="+420 469 605 ..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Kancelář / Číslo dveří:</label>
                  <input
                    type="text"
                    value={pracovnikForm.kancelar}
                    onChange={(e) => setPracovnikForm({ ...pracovnikForm, kancelar: e.target.value })}
                    placeholder="Kancelář č. 214"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Email:</label>
                <input
                  type="email"
                  value={pracovnikForm.email}
                  onChange={(e) => setPracovnikForm({ ...pracovnikForm, email: e.target.value })}
                  placeholder="pracovnik@urad.cz"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddPracovnikModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-all cursor-pointer"
                >
                  Zrušit
                </button>
                {currentUser ? (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md transition-all cursor-pointer"
                  >
                    Uložit pracovníka
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Pro přidání pracovníka se musíte nejdříve přihlásit. Chcete přejít na přihlášení?')) {
                        if (onNavigate) onNavigate('/login');
                        else window.location.href = '/login';
                      }
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-300 text-slate-600 font-bold cursor-pointer"
                  >
                    Přihlásit se
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WORKER RATING MODAL */}
      {showPracovnikRatingModal && selectedPracovnikForRating && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <button
              onClick={() => {
                setShowPracovnikRatingModal(false);
                setSelectedPracovnikForRating(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Hodnocení jednání pracovníka</span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Hodnotit: {selectedPracovnikForRating.jmeno}
              </h2>
              {selectedPracovnikForRating.pozice && (
                <p className="text-xs text-indigo-600 font-semibold">{selectedPracovnikForRating.pozice}</p>
              )}
            </div>

            <form onSubmit={handleAddPracovnikReview} className="space-y-4 text-xs">
              {/* Notice to user */}
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl flex gap-2 text-[11px] leading-relaxed">
                <span className="font-bold shrink-0">⚠️ Upozornění:</span>
                <span>Prosíme o dodržování věcnosti, slušnosti a konstruktivního tónu. Popisujte pouze svou přímou osobní zkušenost. Nepravdivá či vulgární hodnocení budou smazána.</span>
              </div>

              {/* Overall rating */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Celkový dojem a spokojenost (1-5 hvězdiček):</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPracovnikReviewForm({ ...pracovnikReviewForm, rating: num })}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        pracovnikReviewForm.rating >= num ? 'text-amber-400 bg-amber-50' : 'text-slate-300 bg-slate-100'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${pracovnikReviewForm.rating >= num ? 'fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Criteria Ratings */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Objektivita a nestrannost jednání:</span>
                    <span className="font-bold text-indigo-600">{pracovnikReviewForm.objektivita} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={pracovnikReviewForm.objektivita}
                    onChange={(e) => setPracovnikReviewForm({ ...pracovnikReviewForm, objektivita: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Komunikace a přístup (slušnost, empatie):</span>
                    <span className="font-bold text-indigo-600">{pracovnikReviewForm.komunikace} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={pracovnikReviewForm.komunikace}
                    onChange={(e) => setPracovnikReviewForm({ ...pracovnikReviewForm, komunikace: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Rychlost vyřízení / dodržování termínů:</span>
                    <span className="font-bold text-indigo-600">{pracovnikReviewForm.rychlost} / 5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={pracovnikReviewForm.rychlost}
                    onChange={(e) => setPracovnikReviewForm({ ...pracovnikReviewForm, rychlost: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Popis osobní zkušenosti s jednáním:</label>
                <textarea
                  required
                  rows={4}
                  value={pracovnikReviewForm.comment}
                  onChange={(e) => setPracovnikReviewForm({ ...pracovnikReviewForm, comment: e.target.value })}
                  placeholder="Popište věcně průběh jednání, komunikaci a věcnost přístupu tohoto pracovníka..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Anonymous Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={pracovnikReviewForm.isAnonymous}
                  onChange={(e) => setPracovnikReviewForm({ ...pracovnikReviewForm, isAnonymous: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Zveřejnit hodnocení anonymně</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPracovnikRatingModal(false);
                    setSelectedPracovnikForRating(null);
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Zrušit
                </button>
                {currentUser ? (
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {formSubmitting ? 'Ukládám...' : 'Odeslat hodnocení'}
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
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-md cursor-pointer"
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
    </div>
  );
};
