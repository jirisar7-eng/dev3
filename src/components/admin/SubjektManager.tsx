import React, { useState, useEffect } from 'react';
import { Subjekt, EntityType, Review } from '../../types';
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
  ExternalLink
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
  const [subjekty, setSubjekty] = useState<Subjekt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('Všechny kraje');

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
  }, [selectedType, selectedRegion, search]);

  const fetchSubjekty = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedRegion !== 'Všechny kraje') params.append('region', selectedRegion);
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/subjekty?${params.toString()}`);
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
      const res = await fetch('/api/subjekty/verify-ico', {
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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
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
        await fetch(`/api/subjekty/${editingSubjekt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/subjekty', {
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu chcete smazat tento subjekt včetně všech jeho recenzí?')) return;
    try {
      await fetch(`/api/subjekty/${id}`, { method: 'DELETE' });
      fetchSubjekty();
    } catch (err) {
      console.error('Error deleting subjekt:', err);
    }
  };

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
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Přidat nový subjekt</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-12 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Vyhledat v registru..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

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
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors cursor-pointer"
          title="Obnovit"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Subjekty Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Načítám registrační záznamy...</div>
        ) : subjekty.length === 0 ? (
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
                  <th className="px-5 py-3.5">Stav</th>
                  <th className="px-5 py-3.5 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjekty.map((item) => (
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
                          Ověřeno
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Neověřeno
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
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
    </div>
  );
};
