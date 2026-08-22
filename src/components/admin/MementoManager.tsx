import React, { useState, useEffect } from 'react';
import { MementoCase } from '../../types';
import {
  AlertTriangle,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Archive,
  Save,
  X,
  Flame,
  Clock,
  Heart,
  Globe,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Všechny kategorie' },
  { id: 'komunikace', label: 'Komunikace & Písemný styk' },
  { id: 'pece', label: 'Péče & Předávání dětí' },
  { id: 'soud', label: 'Soudní řízení & OSPOD' },
  { id: 'soukromi', label: 'Sociální sítě & Soukromí' },
  { id: 'obecne', label: 'Obecné procesní chyby' },
];

const ICONS = ['Flame', 'Clock', 'Heart', 'Globe', 'Scale', 'AlertTriangle', 'ShieldAlert'];

export const MementoManager: React.FC = () => {
  const [cases, setCases] = useState<MementoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MementoCase | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<MementoCase>>({
    title: '',
    slug: '',
    icon: 'Flame',
    category: 'komunikace',
    error: '',
    consequence: '',
    correctAction: '',
    exampleBad: '',
    exampleGood: '',
    order: 0,
    status: 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
  });

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/memento');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Chyba při načítání memento případů:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      slug: '',
      icon: 'Flame',
      category: 'komunikace',
      error: '',
      consequence: '',
      correctAction: '',
      exampleBad: '',
      exampleGood: '',
      order: cases.length + 1,
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: '',
    });
    setSelectedCase(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (mCase: MementoCase) => {
    setSelectedCase(mCase);
    setFormData({ ...mCase });
    setIsEditModalOpen(true);
  };

  const handleOpenPreview = (mCase: MementoCase) => {
    setSelectedCase(mCase);
    setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.error?.trim() || !formData.correctAction?.trim()) {
      alert('Vyplňte prosím název, popis chyby i správný postup.');
      return;
    }

    const payload = {
      ...formData,
      slug:
        formData.slug?.trim() ||
        formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
    };

    try {
      if (selectedCase) {
        const res = await fetch(`/api/cms/memento/${selectedCase.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchCases();
          setIsEditModalOpen(false);
        } else {
          const err = await res.json();
          alert(`Chyba: ${err.error || 'Uložení se nezdařilo'}`);
        }
      } else {
        const res = await fetch('/api/cms/memento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          await fetchCases();
          setIsEditModalOpen(false);
        } else {
          const err = await res.json();
          alert(`Chyba: ${err.error || 'Vytvoření se nezdařilo'}`);
        }
      }
    } catch (err) {
      console.error('Chyba při ukládání memento případu:', err);
      alert('Chyba komunikace se serverem.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Opravdu chcete smazat případ procesní chyby "${title}"?`)) return;
    try {
      const res = await fetch(`/api/cms/memento/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCases();
      } else {
        alert('Nepodařilo se smazat záznam.');
      }
    } catch (err) {
      console.error('Chyba při mazání:', err);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame className="w-5 h-5 text-rose-600" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-purple-600" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'Scale':
        return <Scale className="w-5 h-5 text-indigo-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    }
  };

  // Filtered
  const filteredCases = cases.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(s) ||
        c.error.toLowerCase().includes(s) ||
        c.correctAction.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Procesní chyby / Memento (CMS)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Správa varovných případů z praxe, fatálních chyb rodičů, jejich následků a doporučených strategií (BIFF).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          id="btn-create-memento"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Přidat varovný případ
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat procesní chybu..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Všechny stavy</option>
            <option value="PUBLISHED">Publikováno</option>
            <option value="DRAFT">Koncept</option>
            <option value="ARCHIVED">Archivováno</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Nalezeno: <strong className="text-slate-900">{filteredCases.length}</strong> případů
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">Načítání memento případů...</div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs font-medium">
            Nebyly nalezeny žádné procesní chyby.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCases.map((mCase) => (
              <div
                key={mCase.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                    {renderIcon(mCase.icon)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-800 border border-amber-200/60">
                        {mCase.category}
                      </span>

                      {mCase.status === 'PUBLISHED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Publikováno
                        </span>
                      )}
                      {mCase.status === 'DRAFT' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Koncept
                        </span>
                      )}
                      {mCase.status === 'ARCHIVED' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <Archive className="w-3 h-3" /> Archiv
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{mCase.title}</h3>
                    <p className="text-xs text-rose-600 font-medium line-clamp-1">❌ {mCase.error}</p>
                    <p className="text-xs text-emerald-700 font-medium line-clamp-1">✅ {mCase.correctAction}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleOpenPreview(mCase)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    title="Náhled případu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(mCase)}
                    className="p-2 rounded-xl text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                    title="Upravit případ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(mCase.id, mCase.title)}
                    className="p-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                    title="Smazat případ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {selectedCase ? 'Upravit procesní případ' : 'Vytvořit nový memento případ'}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Název případu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Např. 1. Emocionální výbuchy v písemné komunikaci"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">URL Slug</label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="automaticky-z-nazvu"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategorie</label>
                  <select
                    value={formData.category || 'komunikace'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="komunikace">Komunikace & Písemný styk</option>
                    <option value="pece">Péče & Předávání dětí</option>
                    <option value="soud">Soudní řízení & OSPOD</option>
                    <option value="soukromi">Sociální sítě & Soukromí</option>
                    <option value="obecne">Obecné procesní chyby</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ikona</label>
                  <select
                    value={formData.icon || 'Flame'}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    {ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stav publikace</label>
                  <select
                    value={formData.status || 'PUBLISHED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="PUBLISHED">Publikováno</option>
                    <option value="DRAFT">Koncept (Draft)</option>
                    <option value="ARCHIVED">Archivováno</option>
                  </select>
                </div>
              </div>

              {/* Error and Consequence */}
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-3">
                <h4 className="text-xs font-bold text-rose-900 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Fatální krok & Následky
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    Popis fatální chyby <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.error || ''}
                    onChange={(e) => setFormData({ ...formData, error: e.target.value })}
                    placeholder="Psaní dlouhých, vyčítavých zpráv plných osobních útoků..."
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs text-rose-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    Reakce soudu / OSPODu a následky
                  </label>
                  <textarea
                    rows={2}
                    value={formData.consequence || ''}
                    onChange={(e) => setFormData({ ...formData, consequence: e.target.value })}
                    placeholder="Druhá strana zprávy vytiskne a předloží soudu jako důkaz neklidného prostředí..."
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    ❌ Příklad špatného jednání (zprávy / vyjádření)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.exampleBad || ''}
                    onChange={(e) => setFormData({ ...formData, exampleBad: e.target.value })}
                    placeholder="'Jsi neschopná matka a u soudu ti to spočítám...'"
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-mono text-rose-800"
                  />
                </div>
              </div>

              {/* Correct Strategy */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Správný postup & BIFF Strategie
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    Doporučený postup <span className="text-emerald-600">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.correctAction || ''}
                    onChange={(e) => setFormData({ ...formData, correctAction: e.target.value })}
                    placeholder="Používejte metodu BIFF: Brief, Informative, Friendly, Firm..."
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                    ✅ Příklad správného jednání (vzorová reakce)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.exampleGood || ''}
                    onChange={(e) => setFormData({ ...formData, exampleGood: e.target.value })}
                    placeholder="'Ahoj, vyzvednu Tomáše v pátek v 16:00 u školy, jak bylo dohodnuto...'"
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800"
                  />
                </div>
              </div>

              {/* SEO Meta */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">SEO Metadata</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Titulek pro vyhledávače"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">SEO Description</label>
                    <textarea
                      rows={2}
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Meta popis pro Google"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs"
                >
                  <Save className="w-4 h-4" /> Uložit případ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                {renderIcon(selectedCase.icon)}
                <h3 className="text-sm font-bold">{selectedCase.title}</h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Error box */}
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                <div className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Fatální chyba:
                </div>
                <p className="text-xs text-rose-900">{selectedCase.error}</p>
                {selectedCase.consequence && (
                  <p className="text-[11px] text-rose-700 italic">Důsledek: {selectedCase.consequence}</p>
                )}
                {selectedCase.exampleBad && (
                  <div className="p-2.5 bg-white/80 rounded-xl border border-rose-200 text-xs font-mono text-rose-900">
                    ❌ {selectedCase.exampleBad}
                  </div>
                )}
              </div>

              {/* Correct box */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <div className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Správný postup (BIFF):
                </div>
                <p className="text-xs text-emerald-900">{selectedCase.correctAction}</p>
                {selectedCase.exampleGood && (
                  <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-xs font-mono text-emerald-900">
                    ✅ {selectedCase.exampleGood}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
