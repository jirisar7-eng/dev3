import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { Subjekt, EntityType, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Star,
  ShieldCheck,
  Filter,
  RefreshCw,
  Scale,
  Users,
  Award,
  Briefcase,
  HeartHandshake,
  MessageSquare,
  MapPin,
  X,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
  Clock,
  ShieldAlert,
  FileText,
  CheckCircle,
  Info,
  ChevronRight,
  AlertTriangle
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

export const SubjektManager: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';
  const isModerator = isAdmin || currentUser?.role === 'MODERATOR';

  const [subjekty, setSubjekty] = useState<Subjekt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('Všechny kraje');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [verifiedFilter, setVerifiedFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING_REVIEW' | 'STALE'>('ALL');

  // Detail Modal & Moderation state
  const [detailSubjekt, setDetailSubjekt] = useState<Subjekt | null>(null);
  const [detailProfile, setDetailProfile] = useState<any | null>(null);
  const [detailSources, setDetailSources] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [sourcesTab, setSourcesTab] = useState<'PENDING' | 'ALL'>('PENDING');

  // Review actions state
  const [reviewLoadingId, setReviewLoadingId] = useState<string | null>(null);
  const [rejectModalSource, setRejectModalSource] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Direct Admin Edit state
  const [directEditOpen, setDirectEditOpen] = useState<boolean>(false);
  const [directEditForm, setDirectEditForm] = useState<any>({});
  const [directEditSaving, setDirectEditSaving] = useState<boolean>(false);

  // Edit / Add modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSubjekt, setEditingSubjekt] = useState<Subjekt | null>(null);

  const [form, setForm] = useState({
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
    isVerified: true,
    lat: "" as string | number,
    lng: "" as string | number,
  });

  const [saving, setSaving] = useState<boolean>(false);

  // ARES State
  const [aresIco, setAresIco] = useState<string>('');
  const [aresLoading, setAresLoading] = useState<boolean>(false);
  const [aresResult, setAresResult] = useState<any | null>(null);
  const [aresError, setAresError] = useState<string | null>(null);
  const [aresApplied, setAresApplied] = useState<boolean>(false);

  useEffect(() => {
    fetchSubjekty();
  }, [selectedType, selectedRegion, search, statusFilter]);

  const fetchSubjekty = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedRegion !== 'Všechny kraje') params.append('region', selectedRegion);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await apiFetch(`/api/subjekty?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubjekty(data);
      }
    } catch (err) {
      console.error('Error fetching subjekty in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSubjekt(null);
    setAresIco('');
    setAresResult(null);
    setAresError(null);
    setAresApplied(false);
    setForm({
      type: 'SOUD',
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
      isVerified: true,
    lat: "" as string | number,
    lng: "" as string | number,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Subjekt) => {
    setEditingSubjekt(item);
    setAresIco('');
    setAresResult(null);
    setAresError(null);
    setAresApplied(false);
    setForm({
      type: item.type,
      name: item.name,
      titleBefore: item.titleBefore || '',
      position: item.position || '',
      institution: item.institution || '',
      city: item.city,
      region: item.region,
      address: item.address || '',
      email: item.email || '',
      phone: item.phone || '',
      website: item.website || '',
      isVerified: item.isVerified,
      lat: typeof item.lat === "number" ? item.lat : "",
      lng: typeof item.lng === "number" ? item.lng : "",
    });
    setShowModal(true);
  };

  const handleVerifyAres = async () => {
    const cleanIco = aresIco.trim();
    if (!cleanIco) {
      setAresError('Zadejte platné IČO subjektu (6 až 8 číslic).');
      setAresResult(null);
      return;
    }

    setAresLoading(true);
    setAresError(null);
    setAresResult(null);
    setAresApplied(false);

    try {
      const res = await apiFetch('/api/subjekty/verify-ico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ico: cleanIco }),
      });
      const data = await res.json();
      if (data.success && data.subject) {
        setAresResult(data.subject);
      } else {
        setAresError(data.error?.message || 'Subjekt s tímto IČO nebyl v registru ARES nalezen.');
      }
    } catch (err: any) {
      console.error('Error verifying IČO with ARES in UI:', err);
      setAresError('Chyba při komunikaci se serverem při dotazu na ARES.');
    } finally {
      setAresLoading(false);
    }
  };

  const handleApplyAresData = () => {
    if (!aresResult) return;
    setForm((prev) => ({
      ...prev,
      name: aresResult.name || prev.name,
      city: aresResult.city || prev.city,
      region: aresResult.region || prev.region,
      address: aresResult.address || prev.address,
      type: (aresResult.suggestedType && ['SOUD', 'OSPOD', 'ZNALEC', 'ADVOKAT', 'PORADNA_CHARITA'].includes(aresResult.suggestedType))
        ? (aresResult.suggestedType as EntityType)
        : prev.type,
      isVerified: true,
    lat: "" as string | number,
    lng: "" as string | number,
    }));
    setAresApplied(true);
  };

  
  const [geocodeLoading, setGeocodeLoading] = useState<boolean>(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const handleGeocode = async () => {
    const addressQuery = `${form.address ? form.address + ',' : ''} ${form.city}`.trim();
    if (!addressQuery || addressQuery === ',') {
      setGeocodeError('Zadejte město a nejlépe i adresu pro vyhledání.');
      return;
    }
    setGeocodeLoading(true);
    setGeocodeError(null);
    try {
      const res = await apiFetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setForm(prev => ({ ...prev, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }));
        setGeocodeError(null);
      } else {
        setGeocodeError('Poloha nebyla nalezena. Zadejte souřadnice ručně.');
      }
    } catch (err) {
      setGeocodeError('Chyba při komunikaci s geocoding službou.');
    } finally {
      setGeocodeLoading(false);
    }
  };

const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
    let finalLat = typeof form.lat === 'number' ? form.lat : parseFloat(form.lat as string);
    let finalLng = typeof form.lng === 'number' ? form.lng : parseFloat(form.lng as string);
    
    if (!isNaN(finalLat) && (finalLat < -90 || finalLat > 90)) {
       alert("Zeměpisná šířka (Latitude) musí být mezi -90 a 90.");
       setSaving(false);
       return;
    }
    if (!isNaN(finalLng) && (finalLng < -180 || finalLng > 180)) {
       alert("Zeměpisná délka (Longitude) musí být mezi -180 a 180.");
       setSaving(false);
       return;
    }

    const payload = {
       ...form,
       lat: !isNaN(finalLat) ? finalLat : null,
       lng: !isNaN(finalLng) ? finalLng : null,
    };

      if (editingSubjekt) {
        await apiFetch(`/api/subjekty/${editingSubjekt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/subjekty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      fetchSubjekty();
    } catch (err) {
      console.error('Error saving subjekt:', err);
    } finally {
      setSaving(false);
    }
  };

  
  const handleApprove = async (id: string) => {
    try {
      const res = await apiFetch(`/api/subjekty/${id}/approve`, { method: 'PUT' });
      if (res.ok) {
        fetchSubjekty();
      } else {
        const error = await res.json();
        alert(error.error || 'Chyba při schvalování');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Zadejte důvod zamítnutí:');
    if (!reason) return;
    try {
      const res = await apiFetch(`/api/subjekty/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason: reason })
      });
      if (res.ok) {
        fetchSubjekty();
      } else {
        const error = await res.json();
        alert(error.error || 'Chyba při zamítání');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu chcete smazat tento subjekt včetně všech jeho recenzí?')) return;
    try {
      await apiFetch(`/api/subjekty/${id}`, { method: 'DELETE' });
      fetchSubjekty();
    } catch (err) {
      console.error('Error deleting subjekt:', err);
    }
  };

  // ============================================================================
  // P1 HANDLERY PRO OVĚŘENÉ INFORMACE A MODERACI NÁVRHŮ ZDROJŮ
  // ============================================================================

  const handleOpenDetail = async (subjekt: Subjekt) => {
    setDetailSubjekt(subjekt);
    setDetailLoading(true);
    setDetailError(null);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    try {
      const [profileRes, sourcesRes] = await Promise.all([
        apiFetch(`/api/subjekty/${subjekt.id}/verified-profile`),
        isModerator ? apiFetch(`/api/subjekty/${subjekt.id}/information-sources`) : Promise.resolve(null),
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setDetailProfile(pData);
      } else {
        setDetailProfile(null);
      }

      if (sourcesRes && sourcesRes.ok) {
        const sData = await sourcesRes.json();
        setDetailSources(Array.isArray(sData) ? sData : []);
      } else {
        setDetailSources([]);
      }
    } catch (err: any) {
      console.error('Error fetching detail verified info:', err);
      setDetailError('Nepodařilo se načíst ověřené informace subjektu.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApproveProposal = async (source: any) => {
    if (!detailSubjekt) return;
    const fieldName = formatFieldKey(source.fieldKey);
    if (!window.confirm(`Opravdu chcete schválit tento návrh pro pole "${fieldName}" a promítnout hodnotu do ověřeného profilu subjektu?`)) {
      return;
    }

    setReviewLoadingId(source.id);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await apiFetch(`/api/subjekty/sources/${source.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE',
          subjektId: detailSubjekt.id,
        }),
      });

      if (res.ok) {
        setActionSuccessMessage(`Návrh pro pole "${fieldName}" byl úspěšně schválen a profil aktualizován.`);
        await handleOpenDetail(detailSubjekt);
        fetchSubjekty();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setActionErrorMessage('Záznam byl již modifikován jiným uživatelem.');
        } else if (res.status === 403) {
          setActionErrorMessage(data.error || 'Nemáte oprávnění k této akci.');
        } else if (res.status === 404) {
          setActionErrorMessage('Subjekt nebo návrh nebyl nalezen.');
        } else {
          setActionErrorMessage(data.error || 'Došlo k chybě při schvalování návrhu.');
        }
      }
    } catch (err) {
      console.error('Error approving proposal:', err);
      setActionErrorMessage('Došlo k chybě při schvalování návrhu.');
    } finally {
      setReviewLoadingId(null);
    }
  };

  const handleOpenRejectModal = (source: any) => {
    setRejectModalSource(source);
    setRejectionReasonInput('');
    setActionErrorMessage(null);
  };

  const handleConfirmRejectProposal = async () => {
    if (!rejectModalSource || !detailSubjekt) return;
    const trimmed = rejectionReasonInput.trim();
    if (trimmed.length < 5 || trimmed.length > 500) {
      setActionErrorMessage('Důvod zamítnutí musí mít délku mezi 5 a 500 znaky.');
      return;
    }

    setReviewLoadingId(rejectModalSource.id);
    setActionErrorMessage(null);
    setActionSuccessMessage(null);

    try {
      const res = await apiFetch(`/api/subjekty/sources/${rejectModalSource.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionReason: trimmed,
          subjektId: detailSubjekt.id,
        }),
      });

      if (res.ok) {
        setActionSuccessMessage(`Návrh byl zamítnut s odůvodněním.`);
        setRejectModalSource(null);
        await handleOpenDetail(detailSubjekt);
        fetchSubjekty();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setActionErrorMessage('Záznam byl již modifikován jiným uživatelem.');
        } else if (res.status === 403) {
          setActionErrorMessage(data.error || 'Nemáte oprávnění k této akci.');
        } else if (res.status === 404) {
          setActionErrorMessage('Subjekt nebo návrh nebyl nalezen.');
        } else {
          setActionErrorMessage(data.error || 'Došlo k chybě při zamítání návrhu.');
        }
      }
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      setActionErrorMessage('Došlo k chybě při zamítání návrhu.');
    } finally {
      setReviewLoadingId(null);
    }
  };

  const handleOpenDirectEdit = () => {
    if (!detailSubjekt) return;
    setDirectEditForm({
      officialWebsite: detailProfile?.officialWebsite || '',
      officialPhone: detailProfile?.officialPhone || '',
      officialEmail: detailProfile?.officialEmail || '',
      dataBoxId: detailProfile?.dataBoxId || '',
      bookingUrl: detailProfile?.bookingUrl || '',
      accessibility: detailProfile?.accessibility || '',
      appointmentRequired: Boolean(detailProfile?.appointmentRequired),
      staleAfterDays: detailProfile?.staleAfterDays || 180,
      submissionMethods: detailProfile?.submissionMethods || ['DATA_BOX', 'POST', 'IN_PERSON'],
    });
    setDirectEditOpen(true);
  };

  const handleSaveDirectEdit = async () => {
    if (!detailSubjekt) return;
    setDirectEditSaving(true);
    setActionErrorMessage(null);
    try {
      const res = await apiFetch(`/api/subjekty/${detailSubjekt.id}/verified-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(directEditForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setDetailProfile(updated);
        setDirectEditOpen(false);
        setActionSuccessMessage('Ověřený profil byl úspěšně přímo aktualizován.');
        fetchSubjekty();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setActionErrorMessage('Nemáte oprávnění k této akci.');
        } else {
          setActionErrorMessage(errData.error || 'Chyba při přímé úpravě ověřeného profilu.');
        }
      }
    } catch (err) {
      console.error('Error saving direct edit:', err);
      setActionErrorMessage('Chyba při komunikaci se serverem.');
    } finally {
      setDirectEditSaving(false);
    }
  };

  const formatFieldKey = (key: string): string => {
    const map: Record<string, string> = {
      officialWebsite: 'Úřední web',
      officialPhone: 'Oficiální telefon',
      officialEmail: 'Oficiální e-mail',
      openingHours: 'Úřední hodiny',
      appointmentRequired: 'Nutnost objednání předem',
      bookingUrl: 'Odkaz na objednání / rezervaci',
      accessibility: 'Bezbariérovost',
      dataBoxId: 'ID datové schránky',
      submissionMethods: 'Způsoby podání',
    };
    return map[key] || key;
  };

  const formatSourceLevel = (level: string) => {
    switch (level) {
      case 'P0':
        return {
          code: 'P0',
          title: 'P0 – Oficiální doména subjektu dle klasifikace věrohodnosti zdrojů',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        };
      case 'P1':
        return {
          code: 'P1',
          title: 'P1 – Ústřední registr nebo nadřízený státní orgán (např. justice.cz, ARES)',
          bg: 'bg-blue-50 text-blue-800 border-blue-300',
        };
      case 'P2':
        return {
          code: 'P2',
          title: 'P2 – Důvěryhodný veřejný zdroj s redakční kontrolou',
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        };
      case 'P3':
        return {
          code: 'P3',
          title: 'P3 – Uživatelský podnět vyžadující manuální ověření',
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
        };
      default:
        return {
          code: level || 'N/A',
          title: 'Zdroj dle klasifikace věrohodnosti',
          bg: 'bg-slate-50 text-slate-800 border-slate-300',
        };
    }
  };

  const formatExtractionMethod = (method: string): string => {
    switch (method) {
      case 'MANUAL_ENTRY':
        return 'Manuální zadání moderátorem/správcem';
      case 'SCRAPED':
        return 'Strukturovaná extrakce z webu';
      case 'API':
        return 'Automatický import z úředního registru (API)';
      default:
        return method || 'Nespecifikováno';
    }
  };

  // Client-side filtering by verified information status
  const filteredSubjekty = subjekty.filter((item) => {
    if (verifiedFilter === 'VERIFIED') {
      return item.verifiedProfile?.status === 'VERIFIED' && (!item.pendingSourcesCount || item.pendingSourcesCount === 0);
    }
    if (verifiedFilter === 'PENDING_REVIEW') {
      return (item.pendingSourcesCount && item.pendingSourcesCount > 0) || item.verifiedProfile?.status === 'PENDING_REVIEW';
    }
    if (verifiedFilter === 'STALE') {
      return item.verifiedProfile?.status === 'STALE';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4" />
            <span>Správa Registru Subjektů</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Opatrovnické Soudy, OSPOD, Znalci, Advokáti a Poradny
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Kompletní databáze subjektů opatrovnického systému, správa ověření a monitoring hodnocení.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-white hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Přidat nový subjekt</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Vyhledat v registru..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
          >
            <option value="ALL">Všechny stavy registrace</option>
            <option value="PENDING_VERIFICATION">Ke schválení (čekající)</option>
            <option value="VERIFIED">Schválené</option>
            <option value="REJECTED">Zamítnuté</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
          >
            <option value="ALL">Všechny typy</option>
            <option value="SOUD">Soudy</option>
            <option value="OSPOD">OSPOD</option>
            <option value="ZNALEC">Znalci / Psychologové</option>
            <option value="ADVOKAT">Advokáti</option>
            <option value="PORADNA_CHARITA">Poradny / Mediátoři</option>
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800"
          >
            {CZECH_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <button
            onClick={fetchSubjekty}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer shrink-0"
            title="Obnovit"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* P1 Ověřené informace filter bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-700">Ověřené údaje subjektu:</span>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              onClick={() => setVerifiedFilter('ALL')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                verifiedFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vše ({subjekty.length})
            </button>
            <button
              onClick={() => setVerifiedFilter('VERIFIED')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                verifiedFilter === 'VERIFIED' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ověřeno ({subjekty.filter(s => s.verifiedProfile?.status === 'VERIFIED' && (!s.pendingSourcesCount || s.pendingSourcesCount === 0)).length})
            </button>
            <button
              onClick={() => setVerifiedFilter('PENDING_REVIEW')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                verifiedFilter === 'PENDING_REVIEW' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Čeká na kontrolu ({subjekty.filter(s => (s.pendingSourcesCount && s.pendingSourcesCount > 0) || s.verifiedProfile?.status === 'PENDING_REVIEW').length})
            </button>
            <button
              onClick={() => setVerifiedFilter('STALE')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                verifiedFilter === 'STALE' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Vyžaduje přezkoumání ({subjekty.filter(s => s.verifiedProfile?.status === 'STALE').length})
            </button>
          </div>
        </div>
      </div>

      {/* Subjekty Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Načítám registrační záznamy...</div>
        ) : filteredSubjekty.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">Žádné subjekty neodpovídají zadanému filtru.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Subjekt / Jméno</th>
                  <th className="px-5 py-3.5">Typ</th>
                  <th className="px-5 py-3.5">Město / Kraj</th>
                  <th className="px-5 py-3.5">Hodnocení</th>
                  <th className="px-5 py-3.5">Registrace</th>
                  <th className="px-5 py-3.5">Ověřené údaje & Návrhy</th>
                  <th className="px-5 py-3.5 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjekty.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      <div>
                        {item.titleBefore && <span className="font-normal text-slate-500 mr-1">{item.titleBefore}</span>}
                        {item.name}
                      </div>
                      {item.position && <div className="text-[11px] font-normal text-slate-500">{item.position}</div>}
                    </td>
                    <td className="px-5 py-3.5 font-medium">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {item.city}, <span className="text-slate-400">{item.region}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{item.avgRating > 0 ? item.avgRating.toFixed(1) : '0.0'}</span>
                        <span className="text-[10px] font-normal text-slate-400">({item.reviewCount})</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {item.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Schváleno
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Neověřeno
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.verifiedProfile?.status === 'STALE' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Údaje vyžadují přezkoumání
                          </span>
                          {item.verifiedProfile.nextCheckAt && (
                            <div className="text-[10px] text-amber-700 font-medium">
                              od {new Date(item.verifiedProfile.nextCheckAt).toLocaleDateString('cs-CZ')}
                            </div>
                          )}
                        </div>
                      ) : (item.pendingSourcesCount && item.pendingSourcesCount > 0) || item.verifiedProfile?.status === 'PENDING_REVIEW' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-300 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3 text-indigo-600" />
                            Návrh ke schválení
                            {item.pendingSourcesCount ? (
                              <span className="ml-1 px-1.5 py-0.2 bg-indigo-200 text-indigo-900 rounded-full font-extrabold text-[9px]">
                                {item.pendingSourcesCount}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      ) : item.verifiedProfile?.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ověřené údaje
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                          Bez ověřeného profilu
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer relative ${
                          item.pendingSourcesCount && item.pendingSourcesCount > 0
                            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 ring-1 ring-indigo-300'
                            : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        title="Ověřené informace a moderace návrhů"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {item.pendingSourcesCount && item.pendingSourcesCount > 0 ? (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600 text-[8px] font-bold text-white items-center justify-center">
                              {item.pendingSourcesCount}
                            </span>
                          </span>
                        ) : null}
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Upravit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Smazat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900">
              {editingSubjekt ? 'Upravit subjekt' : 'Přidat nový subjekt'}
            </h3>

            {/* ARES IČO Verification Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Ověření v ARES (v3 REST API)</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Oficiální registr MF ČR
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={aresIco}
                  onChange={(e) => setAresIco(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Zadejte IČO (např. 00023841)..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyAres();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleVerifyAres}
                  disabled={aresLoading || !aresIco.trim()}
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                >
                  {aresLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Ověřuji...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Ověřit v ARES</span>
                    </>
                  )}
                </button>
              </div>

              {/* ARES Error Display */}
              {aresError && (
                <div className="flex items-start gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">Ověření selhalo: </span>
                    <span>{aresError}</span>
                  </div>
                </div>
              )}

              {/* ARES Result Card with Explicit Apply Action */}
              {aresResult && (
                <div className="bg-white border border-emerald-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Subjekt ověřen v registru ARES</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      aresResult.isEntityActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {aresResult.isEntityActive ? 'Aktivní subjekt' : 'Zaniklý subjekt'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Obchodní jméno / Název</span>
                      <span className="font-bold text-slate-900">{aresResult.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IČO & Právní forma</span>
                      <span className="font-mono font-bold text-slate-800">{aresResult.ico}</span>
                      {aresResult.legalForm && <span className="text-slate-500 text-[10px] ml-1">({aresResult.legalForm})</span>}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">Sídlo / Adresa</span>
                      <span className="text-slate-800">{aresResult.address}</span>
                      <span className="text-slate-500 text-[10px] ml-1">({aresResult.region})</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      Ověřeno: {new Date(aresResult.verifiedAt).toLocaleTimeString()}
                    </span>
                    <button
                      type="button"
                      onClick={handleApplyAresData}
                      className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Použít údaje z ARES do formuláře</span>
                    </button>
                  </div>

                  {aresApplied && (
                    <div className="text-[11px] text-emerald-800 font-medium bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/80 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Údaje byly přeneseny do formuláře. Můžete je zkontrolovat a uložit.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Typ subjektu:</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as EntityType })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="SOUD">Soud</option>
                  <option value="OSPOD">OSPOD</option>
                  <option value="ZNALEC">Znalec / Psycholog</option>
                  <option value="ADVOKAT">Advokát</option>
                  <option value="PORADNA_CHARITA">Poradna / Mediace</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Titul:</label>
                  <input
                    type="text"
                    value={form.titleBefore}
                    onChange={(e) => setForm({ ...form, titleBefore: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-800 block mb-1">Název / Jméno:*</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Pozice / Funkce:</label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />

              </div>

              <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-600"/> GPS Souřadnice</label>
                  <button type="button" onClick={handleGeocode} disabled={geocodeLoading} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                    {geocodeLoading ? 'Hledám...' : 'Získat z adresy'}
                  </button>
                </div>
                {geocodeError && <div className="text-xs text-rose-600 font-semibold">{geocodeError}</div>}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Zeměpisná šířka (Lat):</label>
                    <input
                      type="number" step="any" min="-90" max="90"
                      value={form.lat}
                      onChange={(e) => setForm({ ...form, lat: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      placeholder="např. 50.088"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Zeměpisná délka (Lng):</label>
                    <input
                      type="number" step="any" min="-180" max="180"
                      value={form.lng}
                      onChange={(e) => setForm({ ...form, lng: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      placeholder="např. 14.42"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  Pokud souřadnice smažete nebo necháte prázdné, subjekt se na mapě nezobrazí.
                </div>

              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Pracoviště / Kancelář:</label>
                <input
                  type="text"
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Město:*</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Kraj:*</label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {CZECH_REGIONS.filter((r) => r !== 'Všechny kraje').map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Adresa:</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Telefon:</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">E-mail:</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Web:</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 pt-2">
                <input
                  type="checkbox"
                  checked={form.isVerified}
                  onChange={(e) => setForm({ ...form, isVerified: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Ověřený subjekt</span>
              </label>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl shadow-xs"
                >
                  {saving ? 'Ukládám...' : 'Uložit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* P1 DETAIL A MODERACE OVĚŘENÝCH INFORMACÍ SUBJEKTU                        */}
      {/* ========================================================================= */}
      {detailSubjekt && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {detailSubjekt.type}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {detailSubjekt.city}, {detailSubjekt.region}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  <span>{detailSubjekt.name}</span>
                </h3>
                {detailSubjekt.position && (
                  <p className="text-xs text-slate-600">{detailSubjekt.position}</p>
                )}
              </div>
              <button
                onClick={() => setDetailSubjekt(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Zavřít"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            {actionSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessMessage}</span>
              </div>
            )}
            {actionErrorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{actionErrorMessage}</span>
              </div>
            )}
            {detailError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{detailError}</span>
              </div>
            )}

            {detailLoading ? (
              <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Načítám ověřený profil a návrhy zdrojů...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* SECTION 1: OVĚŘENÉ INFORMACE SUBJEKTU */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                        OVĚŘENÉ INFORMACE SUBJEKTU
                      </h4>
                      {detailProfile?.status === 'STALE' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Vyžaduje přezkoumání
                        </span>
                      ) : detailProfile?.status === 'PENDING_REVIEW' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                          Čeká na kontrolu návrhů
                        </span>
                      ) : detailProfile?.status === 'VERIFIED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Ověřený stav
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                          Zatím neověřeno
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={handleOpenDirectEdit}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Přímá úprava (Admin)</span>
                      </button>
                    )}
                  </div>

                  {/* Key metadata grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Úřední web</div>
                      {detailProfile?.officialWebsite ? (
                        <a
                          href={detailProfile.officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 break-all"
                        >
                          <span>{detailProfile.officialWebsite}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Neuvedeno</span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Oficiální telefon</div>
                      {detailProfile?.officialPhone ? (
                        <a href={`tel:${detailProfile.officialPhone}`} className="font-bold text-slate-800 hover:text-indigo-600">
                          {detailProfile.officialPhone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Neuvedeno</span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Oficiální e-mail</div>
                      {detailProfile?.officialEmail ? (
                        <a href={`mailto:${detailProfile.officialEmail}`} className="font-bold text-slate-800 hover:text-indigo-600 break-all">
                          {detailProfile.officialEmail}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Neuvedeno</span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">ID Datové schránky</div>
                      {detailProfile?.dataBoxId ? (
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {detailProfile.dataBoxId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Neuvedeno</span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Nutnost objednání</div>
                      <span className="font-bold text-slate-800">
                        {detailProfile?.appointmentRequired ? 'Ano, vyžadováno předem' : 'Ne, není vyžadováno'}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Rezervační odkaz</div>
                      {detailProfile?.bookingUrl ? (
                        <a
                          href={detailProfile.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 break-all"
                        >
                          <span>{detailProfile.bookingUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Neuvedeno</span>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1 md:col-span-2">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Bezbariérovost</div>
                      <span className="text-slate-700">
                        {detailProfile?.accessibility || <span className="text-slate-400 italic">Neuvedeno</span>}
                      </span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Platnost revize</div>
                      <div className="text-slate-700">
                        {detailProfile?.nextCheckAt ? (
                          <span>Další kontrola: <strong className="text-slate-900">{new Date(detailProfile.nextCheckAt).toLocaleDateString('cs-CZ')}</strong></span>
                        ) : (
                          <span className="text-slate-400 italic">Nastaveno na {detailProfile?.staleAfterDays || 180} dní</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submission methods */}
                  {Array.isArray(detailProfile?.submissionMethods) && detailProfile.submissionMethods.length > 0 && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Podporované způsoby podání</div>
                      <div className="flex flex-wrap gap-1.5">
                        {detailProfile.submissionMethods.map((m: string) => (
                          <span key={m} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {m === 'DATA_BOX' ? 'Datová schránka' : m === 'POST' ? 'Pošta' : m === 'IN_PERSON' ? 'Osobně na podatelně' : m === 'EMAIL_SIGNED' ? 'E-mail s uznávaným el. podpisem' : m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opening hours snippet if available */}
                  {detailProfile?.openingHours && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Úřední hodiny</div>
                      <pre className="text-[11px] text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {typeof detailProfile.openingHours === 'string'
                          ? detailProfile.openingHours
                          : JSON.stringify(detailProfile.openingHours, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* SECTION 2: NAVRŽENÉ ZDROJE A ZMĚNY (MODERACE) */}
                <div className="border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                        NAVRŽENÉ ZDROJE A ZMĚNY
                      </h4>
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                      <button
                        onClick={() => setSourcesTab('PENDING')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          sourcesTab === 'PENDING' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Čekající návrhy ({detailSources.filter((s) => s.status === 'PENDING_REVIEW').length})
                      </button>
                      <button
                        onClick={() => setSourcesTab('ALL')}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          sourcesTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Všechny návrhy ({detailSources.length})
                      </button>
                    </div>
                  </div>

                  {/* Sources list */}
                  {(() => {
                    const displayedSources =
                      sourcesTab === 'PENDING'
                        ? detailSources.filter((s) => s.status === 'PENDING_REVIEW')
                        : detailSources;

                    if (displayedSources.length === 0) {
                      return (
                        <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-100">
                          {sourcesTab === 'PENDING'
                            ? 'Žádné návrhy nečekají na moderaci.'
                            : 'Zatím nebyly evidovány žádné návrhy zdrojů pro tento subjekt.'}
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {displayedSources.map((source) => {
                          const levelInfo = formatSourceLevel(source.sourceLevel);
                          const fieldLabel = formatFieldKey(source.fieldKey);
                          const isSelfProposed = source.createdById === currentUser?.id;
                          const currentValue = (detailProfile as any)?.[source.fieldKey];

                          return (
                            <div
                              key={source.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                source.status === 'PENDING_REVIEW'
                                  ? 'bg-white border-indigo-200 shadow-xs'
                                  : source.status === 'APPROVED'
                                  ? 'bg-emerald-50/30 border-emerald-200'
                                  : 'bg-rose-50/30 border-rose-200'
                              }`}
                            >
                              {/* Source item header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900">
                                    Pole: <span className="text-indigo-600">{fieldLabel}</span>
                                  </span>

                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${levelInfo.bg}`}
                                    title={levelInfo.title}
                                  >
                                    Úroveň {levelInfo.code}
                                  </span>

                                  {source.status === 'PENDING_REVIEW' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Čeká na schválení
                                    </span>
                                  ) : source.status === 'APPROVED' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      Schváleno
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      Zamítnuto
                                    </span>
                                  )}
                                </div>

                                <div className="text-[10px] text-slate-500 font-medium">
                                  Návrh vytvořen: {new Date(source.createdAt).toLocaleString('cs-CZ')}
                                </div>
                              </div>

                              {/* Source level explanatory banner */}
                              <div className="mt-2 text-[11px] px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-medium flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{levelInfo.title}</span>
                              </div>

                              {/* URL link */}
                              <div className="mt-3 text-xs flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-700">Zdrojová URL:</span>
                                <a
                                  href={source.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:underline inline-flex items-center gap-1 break-all font-mono text-[11px]"
                                >
                                  <span>{source.sourceUrl}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              </div>

                              {/* Side-by-side values comparison */}
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                  <div className="text-[10px] font-bold uppercase text-slate-400">
                                    Aktuální ověřená hodnota
                                  </div>
                                  <div className="font-medium text-slate-700 break-all">
                                    {currentValue !== undefined && currentValue !== null && currentValue !== '' ? (
                                      typeof currentValue === 'object' ? (
                                        <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(currentValue, null, 2)}</pre>
                                      ) : typeof currentValue === 'boolean' ? (
                                        currentValue ? 'Ano' : 'Ne'
                                      ) : (
                                        String(currentValue)
                                      )
                                    ) : (
                                      <span className="text-slate-400 italic">Zatím nevyplněno</span>
                                    )}
                                  </div>
                                </div>

                                <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-1">
                                  <div className="text-[10px] font-bold uppercase text-indigo-600">
                                    Navrhovaná hodnota
                                  </div>
                                  <div className="font-bold text-slate-900 break-all">
                                    {typeof source.extractedValue === 'object' ? (
                                      <pre className="text-[10px] whitespace-pre-wrap">{JSON.stringify(source.extractedValue, null, 2)}</pre>
                                    ) : typeof source.extractedValue === 'boolean' ? (
                                      source.extractedValue ? 'Ano' : 'Ne'
                                    ) : (
                                      String(source.extractedValue)
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Evidence snippet */}
                              {source.evidenceSnippet && (
                                <div className="mt-3 p-3 bg-amber-50/40 border border-amber-200 rounded-xl space-y-1">
                                  <div className="text-[10px] font-bold uppercase text-amber-800">
                                    Nalezený úryvek v textu zdroje (Evidence snippet)
                                  </div>
                                  <div className="text-[11px] text-slate-700 italic">
                                    "{source.evidenceSnippet}"
                                  </div>
                                </div>
                              )}

                              {/* Extraction and audit metadata */}
                              <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500 pt-2 border-t border-slate-100">
                                <div>
                                  Metoda extrakce: <strong>{formatExtractionMethod(source.extractionMethod)}</strong>
                                  {source.confidenceScore && (
                                    <span className="ml-2">
                                      Spolehlivost: <strong>{Math.round(source.confidenceScore * 100)}%</strong>
                                    </span>
                                  )}
                                </div>

                                {source.status !== 'PENDING_REVIEW' && (
                                  <div className="text-slate-600 font-medium">
                                    Posouzeno: {source.reviewedAt ? new Date(source.reviewedAt).toLocaleString('cs-CZ') : 'N/A'}
                                    {source.rejectionReason && (
                                      <span className="ml-1 text-rose-700">({source.rejectionReason})</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Action buttons for PENDING_REVIEW */}
                              {source.status === 'PENDING_REVIEW' && isModerator && (
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                                  {isSelfProposed ? (
                                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5">
                                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                                      <span>Pravidlo čtyř očí: Nemůžete schválit vlastní návrh. Musí jej schválit jiný moderátor/administrátor.</span>
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-slate-500">
                                      Schválením bude hodnota okamžitě propsána do ověřeného profilu subjektu.
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 ml-auto">
                                    <button
                                      onClick={() => handleOpenRejectModal(source)}
                                      disabled={reviewLoadingId === source.id}
                                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      Zamítnout návrh...
                                    </button>

                                    <button
                                      onClick={() => handleApproveProposal(source)}
                                      disabled={reviewLoadingId === source.id || isSelfProposed}
                                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                                    >
                                      {reviewLoadingId === source.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>Schválit a promítnout</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* P1 REJECTION MODAL (MANDATORY REASON 5-500 CHARS)                         */}
      {/* ========================================================================= */}
      {rejectModalSource && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Zamítnutí návrhu zdroje</span>
              </div>
              <button
                onClick={() => setRejectModalSource(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Uveďte věcný důvod zamítnutí pro pole <strong>{formatFieldKey(rejectModalSource.fieldKey)}</strong>.
              Důvod bude uložen do auditu a zobrazen autorovi návrhu.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700">Důvod zamítnutí (5–500 znaků):</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Např. Zdrojová stránka neobsahuje aktuální telefonní číslo nebo se jedná o neoficiální blog..."
                rows={4}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Minimálně 5 znaků</span>
                <span className={rejectionReasonInput.trim().length > 500 ? 'text-rose-600 font-bold' : ''}>
                  {rejectionReasonInput.trim().length} / 500
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalSource(null)}
                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectProposal}
                disabled={
                  reviewLoadingId === rejectModalSource.id ||
                  rejectionReasonInput.trim().length < 5 ||
                  rejectionReasonInput.trim().length > 500
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                {reviewLoadingId === rejectModalSource.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Potvrdit zamítnutí</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* P1 DIRECT ADMIN EDIT MODAL                                                */}
      {/* ========================================================================= */}
      {directEditOpen && detailSubjekt && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm">
                <Edit2 className="w-4 h-4" />
                <span>Přímá administrátorská úprava ověřeného profilu</span>
              </div>
              <button
                onClick={() => setDirectEditOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Oficiální webová stránka</label>
                <input
                  type="url"
                  value={directEditForm.officialWebsite}
                  onChange={(e) => setDirectEditForm({ ...directEditForm, officialWebsite: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Oficiální telefon</label>
                  <input
                    type="text"
                    value={directEditForm.officialPhone}
                    onChange={(e) => setDirectEditForm({ ...directEditForm, officialPhone: e.target.value })}
                    placeholder="+420..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Oficiální e-mail</label>
                  <input
                    type="email"
                    value={directEditForm.officialEmail}
                    onChange={(e) => setDirectEditForm({ ...directEditForm, officialEmail: e.target.value })}
                    placeholder="posta@..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ID Datové schránky</label>
                  <input
                    type="text"
                    value={directEditForm.dataBoxId}
                    onChange={(e) => setDirectEditForm({ ...directEditForm, dataBoxId: e.target.value })}
                    placeholder="7 znaků"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Doba platnosti ověření (dny)</label>
                  <input
                    type="number"
                    value={directEditForm.staleAfterDays}
                    onChange={(e) => setDirectEditForm({ ...directEditForm, staleAfterDays: parseInt(e.target.value) || 180 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Rezervační odkaz / Objednání</label>
                <input
                  type="url"
                  value={directEditForm.bookingUrl}
                  onChange={(e) => setDirectEditForm({ ...directEditForm, bookingUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bezbariérovost</label>
                <input
                  type="text"
                  value={directEditForm.accessibility}
                  onChange={(e) => setDirectEditForm({ ...directEditForm, accessibility: e.target.value })}
                  placeholder="např. Bezbariérový přístup včetně výtahu..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 pt-1">
                <input
                  type="checkbox"
                  checked={directEditForm.appointmentRequired}
                  onChange={(e) => setDirectEditForm({ ...directEditForm, appointmentRequired: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span>Vyžaduje se objednání předem</span>
              </label>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDirectEditOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Zrušit
                </button>
                <button
                  type="button"
                  onClick={handleSaveDirectEdit}
                  disabled={directEditSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  {directEditSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Uložit změny</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
