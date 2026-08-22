import React, { useState, useEffect } from 'react';
import { WikiTerm } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Archive,
  Tag,
  Scale,
  Sparkles,
  List,
  Save,
  X,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Všechny kategorie' },
  { id: 'pravo', label: 'Právní pojmy' },
  { id: 'psychologie', label: 'Psychologie & Rodina' },
  { id: 'instituce', label: 'Instituce a orgány' },
  { id: 'rizeni', label: 'Soudní řízení' },
  { id: 'pece', label: 'Péče & Výživné' },
];

export const WikiManager: React.FC = () => {
  const [terms, setTerms] = useState<WikiTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [letterFilter, setLetterFilter] = useState<string>('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<WikiTerm | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<WikiTerm>>({
    term: '',
    firstLetter: 'A',
    slug: '',
    category: 'pravo',
    categoryLabel: 'Právní pojmy',
    citation: '',
    definition: '',
    practicalTips: [],
    relatedTerms: [],
    sources: [],
    order: 0,
    status: 'PUBLISHED',
    seoTitle: '',
    seoDescription: '',
  });

  const [newTip, setNewTip] = useState('');
  const [newRelated, setNewRelated] = useState('');
  const [newSource, setNewSource] = useState('');

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/wiki');
      if (res.ok) {
        const data = await res.json();
        setTerms(data);
      }
    } catch (err) {
      console.error('Chyba při načítání wiki pojmů:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTerms();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      term: '',
      firstLetter: 'A',
      slug: '',
      category: 'pravo',
      categoryLabel: 'Právní pojmy',
      citation: '',
      definition: '',
      practicalTips: [],
      relatedTerms: [],
      sources: [],
      order: terms.length + 1,
      status: 'PUBLISHED',
      seoTitle: '',
      seoDescription: '',
    });
    setSelectedTerm(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (term: WikiTerm) => {
    setSelectedTerm(term);
    setFormData({
      term: term.term,
      firstLetter: term.firstLetter,
      slug: term.slug,
      category: term.category,
      categoryLabel: term.categoryLabel,
      citation: term.citation || '',
      definition: term.definition,
      practicalTips: [...(term.practicalTips || [])],
      relatedTerms: [...(term.relatedTerms || [])],
      sources: [...(term.sources || [])],
      order: term.order,
      status: term.status,
      seoTitle: term.seoTitle || '',
      seoDescription: term.seoDescription || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenPreview = (term: WikiTerm) => {
    setSelectedTerm(term);
    setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.term || !formData.definition) {
      alert('Vyplňte prosím název pojmu a jeho definici.');
      return;
    }

    try {
      const payload = {
        ...formData,
        firstLetter: (formData.term.trim().charAt(0) || 'A').toUpperCase(),
        slug:
          formData.slug ||
          formData.term
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
      };

      let res;
      if (selectedTerm) {
        res = await fetch(`/api/cms/wiki/${selectedTerm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/cms/wiki', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchTerms();
      } else {
        const data = await res.json();
        alert(`Chyba: ${data.error || 'Nepodařilo se uložit pojem'}`);
      }
    } catch (err: any) {
      alert(`Chyba při ukládání: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, termName: string) => {
    if (!confirm(`Opravdu chcete smazat pojem "${termName}"?`)) return;
    try {
      const res = await fetch(`/api/cms/wiki/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTerms();
      } else {
        alert('Chyba při mazání pojmu.');
      }
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    }
  };

  const addTip = () => {
    if (!newTip.trim()) return;
    setFormData((prev) => ({
      ...prev,
      practicalTips: [...(prev.practicalTips || []), newTip.trim()],
    }));
    setNewTip('');
  };

  const removeTip = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      practicalTips: (prev.practicalTips || []).filter((_, i) => i !== idx),
    }));
  };

  const addRelated = () => {
    if (!newRelated.trim()) return;
    setFormData((prev) => ({
      ...prev,
      relatedTerms: [...(prev.relatedTerms || []), newRelated.trim()],
    }));
    setNewRelated('');
  };

  const removeRelated = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      relatedTerms: (prev.relatedTerms || []).filter((_, i) => i !== idx),
    }));
  };

  const addSource = () => {
    if (!newSource.trim()) return;
    setFormData((prev) => ({
      ...prev,
      sources: [...(prev.sources || []), newSource.trim()],
    }));
    setNewSource('');
  };

  const removeSource = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      sources: (prev.sources || []).filter((_, i) => i !== idx),
    }));
  };

  // Letters for filter
  const uniqueLetters = Array.from(new Set(terms.map((t) => t.firstLetter.toUpperCase()))).sort((a, b) =>
    a.localeCompare(b, 'cs')
  );

  const filteredTerms = terms.filter((t) => {
    const matchSearch =
      !search ||
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase()) ||
      (t.citation && t.citation.toLowerCase().includes(search.toLowerCase()));

    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchLetter = letterFilter === 'all' || t.firstLetter.toUpperCase() === letterFilter.toUpperCase();

    return matchSearch && matchCategory && matchStatus && matchLetter;
  });

  return (
    <div className="space-y-6" id="wiki-manager">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">Správa Encyklopedie & Právní Wiki</h2>
          </div>
          <p className="text-sm text-slate-500">
            Spravujte abecední výkladový slovník právních a opatrovnických pojmů bez zásahu do zdrojového kódu.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          id="btn-create-wiki-term"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Přidat nový pojem
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Hledat v pojmech, definicích, paragrafech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Všechny stavy publikace</option>
              <option value="PUBLISHED">Publikováno (PUBLISHED)</option>
              <option value="DRAFT">Koncept (DRAFT)</option>
              <option value="ARCHIVED">Archivováno (ARCHIVED)</option>
            </select>
          </div>
        </div>

        {/* Alphabet Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-2">Písmeno:</span>
          <button
            onClick={() => setLetterFilter('all')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              letterFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            VŠE ({terms.length})
          </button>
          {uniqueLetters.map((l) => {
            const count = terms.filter((t) => t.firstLetter.toUpperCase() === l).length;
            return (
              <button
                key={l}
                onClick={() => setLetterFilter(l)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                  letterFilter === l
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Table of Terms */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Nalezeno {filteredTerms.length} {filteredTerms.length === 1 ? 'pojem' : 'pojmů'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Načítání encyklopedických hesel...</div>
        ) : filteredTerms.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Žádné pojmy neodpovídají zadaným filtrům.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Písmeno</th>
                  <th className="py-3.5 px-4">Pojem a zákonná citace</th>
                  <th className="py-3.5 px-4">Kategorie</th>
                  <th className="py-3.5 px-4">Tipy & Souvislosti</th>
                  <th className="py-3.5 px-4">Stav</th>
                  <th className="py-3.5 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTerms.map((term) => (
                  <tr key={term.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm">
                        {term.firstLetter}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{term.term}</div>
                      {term.citation && (
                        <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Scale className="w-3 h-3" />
                          {term.citation}
                        </div>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">{term.definition}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {term.categoryLabel || term.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div>💡 {term.practicalTips?.length || 0} praktických tipů</div>
                        <div>🔗 {term.relatedTerms?.length || 0} souvisejících hesel</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {term.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Publikováno
                        </span>
                      ) : term.status === 'DRAFT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Koncept
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <Archive className="w-3 h-3" /> Archiv
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(term)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Náhled"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(term)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Upravit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(term.id, term.term)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTerm ? `Upravit pojem: ${selectedTerm.term}` : 'Přidat nový encyklopedický pojem'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Název pojmu *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.term || ''}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="např. Střídavá péče"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Slug (volitelné, jinak se vygeneruje)
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="např. stridava-pece"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategorie</label>
                  <select
                    value={formData.category || 'pravo'}
                    onChange={(e) => {
                      const sel = CATEGORIES.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryLabel: sel ? sel.label : e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zákonná citace / Paragraf
                  </label>
                  <input
                    type="text"
                    value={formData.citation || ''}
                    onChange={(e) => setFormData({ ...formData, citation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="např. § 907 odst. 2 občanského zákoníku"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stav publikace</label>
                  <select
                    value={formData.status || 'PUBLISHED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="PUBLISHED">Publikováno</option>
                    <option value="DRAFT">Koncept</option>
                    <option value="ARCHIVED">Archivováno</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Odborná definice a vysvětlení pojmu *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.definition || ''}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Detailní, přesný a srozumitelný výklad pojmu..."
                />
              </div>

              {/* Practical Tips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Praktické tipy pro rodiče (doporučené postupy)
                </label>
                <div className="space-y-2 mb-2">
                  {(formData.practicalTips || []).map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-900"
                    >
                      <span>💡 {tip}</span>
                      <button
                        type="button"
                        onClick={() => removeTip(idx)}
                        className="text-amber-700 hover:text-red-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTip();
                      }
                    }}
                    placeholder="Přidat praktický tip..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTip}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    + Přidat tip
                  </button>
                </div>
              </div>

              {/* Related Terms & Sources */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Související pojmy
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(formData.relatedTerms || []).map((rel, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs"
                      >
                        {rel}
                        <button
                          type="button"
                          onClick={() => removeRelated(idx)}
                          className="hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRelated}
                      onChange={(e) => setNewRelated(e.target.value)}
                      placeholder="Přidat pojem..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={addRelated}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ověřené zdroje a judikáty
                  </label>
                  <div className="space-y-1 mb-2">
                    {(formData.sources || []).map((src, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-1.5 rounded-lg"
                      >
                        <span className="truncate">{src}</span>
                        <button
                          type="button"
                          onClick={() => removeSource(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="Přidat zdroj / nález ÚS..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={addSource}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* SEO metadata */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  SEO Metadata (Vyhledávače & OpenGraph)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Co je to [Pojem] | Táta má právo"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">SEO Description</label>
                    <input
                      type="text"
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Přehledný právní výklad a praktické rady pro rodiče..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {selectedTerm ? 'Uložit změny' : 'Vytvořit pojem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedTerm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {selectedTerm.categoryLabel || selectedTerm.category}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{selectedTerm.term}</h3>
                {selectedTerm.citation && (
                  <p className="text-xs text-indigo-600 flex items-center gap-1 mt-1 font-medium">
                    <Scale className="w-3.5 h-3.5" />
                    {selectedTerm.citation}
                  </p>
                )}
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Definice</h4>
                <p className="leading-relaxed">{selectedTerm.definition}</p>
              </div>

              {selectedTerm.practicalTips && selectedTerm.practicalTips.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    💡 Praktické tipy pro rodiče
                  </h4>
                  <div className="space-y-2">
                    {selectedTerm.practicalTips.map((tip, i) => (
                      <div key={i} className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-amber-950 text-xs">
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Související hesla</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTerm.relatedTerms.map((rel, i) => (
                      <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Zavřít náhled
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
