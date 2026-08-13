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
  X
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
  });

  const [saving, setSaving] = useState<boolean>(false);

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
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: Subjekt) => {
    setEditingSubjekt(item);
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
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSubjekt) {
        await fetch(`/api/subjekty/${editingSubjekt.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/subjekty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
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
