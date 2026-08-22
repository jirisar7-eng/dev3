import React, { useState, useEffect } from 'react';
import { LegalGuide, LegalGuideChapter } from '../../types';
import {
  Scale,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Archive,
  Tag,
  List,
  Save,
  X,
  FileText,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckSquare,
  Shield,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'Všechny kategorie' },
  { id: 'ospod', label: 'OSPOD & Sociální šetření' },
  { id: 'soud', label: 'Soudní řízení a jednání' },
  { id: 'pece', label: 'Péče & Střídavka' },
  { id: 'vyzivne', label: 'Výživné a finance' },
  { id: 'mediace', label: 'Dohody & Mediace' },
  { id: 'posudky', label: 'Znalecké posudky' },
  { id: 'vykon', label: 'Výkon rozhodnutí' },
  { id: 'krize', label: 'Krizové situace' },
  { id: 'mezinarodni', label: 'Mezinárodní prvek' },
];

export const LegalGuideManager: React.FC = () => {
  const [guides, setGuides] = useState<LegalGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<LegalGuide | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<LegalGuide>>({
    title: '',
    slug: '',
    subtitle: '',
    excerpt: '',
    category: 'ospod',
    categoryLabel: 'OSPOD & Sociální šetření',
    order: 1,
    status: 'PUBLISHED',
    badgeText: '',
    badgeBg: '',
    disclaimer: '',
    sources: [],
    checklist: [],
    faqs: [],
    chapters: [],
    seoTitle: '',
    seoDescription: '',
  });

  const [newSource, setNewSource] = useState('');
  const [newChecklist, setNewChecklist] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Chapter editing
  const [expandedChapterIdx, setExpandedChapterIdx] = useState<number | null>(null);

  const fetchGuides = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/legal-guides');
      if (res.ok) {
        const data = await res.json();
        setGuides(data);
      }
    } catch (err) {
      console.error('Chyba při načítání průvodců:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      slug: '',
      subtitle: '',
      excerpt: '',
      category: 'ospod',
      categoryLabel: 'OSPOD & Sociální šetření',
      order: guides.length + 1,
      status: 'PUBLISHED',
      badgeText: '',
      badgeBg: '',
      disclaimer: 'Tento průvodce slouží jako informační a metodický přehled pro rodiče. Nenahrazuje individuální právní pomoc advokáta.',
      sources: ['Zákon č. 89/2012 Sb., občanský zákoník', 'Zákon č. 292/2013 Sb., o zvláštních řízeních soudních'],
      checklist: [],
      faqs: [],
      chapters: [
        {
          id: `ch-1`,
          title: '1. Základní přehled a práva rodiče',
          content: 'Zde popište první krok průvodce...',
          order: 1,
          type: 'info',
        },
      ],
      seoTitle: '',
      seoDescription: '',
    });
    setSelectedGuide(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (guide: LegalGuide) => {
    setSelectedGuide(guide);
    setFormData({
      title: guide.title,
      slug: guide.slug,
      subtitle: guide.subtitle || '',
      excerpt: guide.excerpt,
      category: guide.category,
      categoryLabel: guide.categoryLabel,
      order: guide.order,
      status: guide.status,
      badgeText: guide.badgeText || '',
      badgeBg: guide.badgeBg || '',
      disclaimer: guide.disclaimer || '',
      sources: [...(guide.sources || [])],
      checklist: [...(guide.checklist || [])],
      faqs: [...(guide.faqs || [])],
      chapters: (guide.chapters || []).map((ch) => ({ ...ch })),
      seoTitle: guide.seoTitle || '',
      seoDescription: guide.seoDescription || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenPreview = (guide: LegalGuide) => {
    setSelectedGuide(guide);
    setIsPreviewModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt) {
      alert('Vyplňte prosím název a stručný souhrn průvodce.');
      return;
    }

    try {
      const payload = {
        ...formData,
        slug:
          formData.slug ||
          formData.title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
      };

      let res;
      if (selectedGuide) {
        res = await fetch(`/api/cms/legal-guides/${selectedGuide.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/cms/legal-guides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchGuides();
      } else {
        const data = await res.json();
        alert(`Chyba: ${data.error || 'Nepodařilo se uložit průvodce'}`);
      }
    } catch (err: any) {
      alert(`Chyba při ukládání: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Opravdu chcete smazat průvodce "${title}"?`)) return;
    try {
      const res = await fetch(`/api/cms/legal-guides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGuides();
      } else {
        alert('Chyba při mazání průvodce.');
      }
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    }
  };

  // Chapter management
  const addChapter = () => {
    const chapters = formData.chapters || [];
    const newCh: LegalGuideChapter = {
      id: `ch-${Date.now()}`,
      title: `${chapters.length + 1}. Nová kapitola`,
      content: '',
      order: chapters.length + 1,
      type: 'info',
    };
    setFormData({
      ...formData,
      chapters: [...chapters, newCh],
    });
    setExpandedChapterIdx(chapters.length);
  };

  const updateChapter = (idx: number, patch: Partial<LegalGuideChapter>) => {
    const chapters = [...(formData.chapters || [])];
    chapters[idx] = { ...chapters[idx], ...patch };
    setFormData({ ...formData, chapters });
  };

  const removeChapter = (idx: number) => {
    const chapters = (formData.chapters || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, chapters });
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

  const addChecklistItem = () => {
    if (!newChecklist.trim()) return;
    setFormData((prev) => ({
      ...prev,
      checklist: [...(prev.checklist || []), { id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, label: newChecklist.trim() }],
    }));
    setNewChecklist('');
  };

  const removeChecklistItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      checklist: (prev.checklist || []).filter((_, i) => i !== idx),
    }));
  };

  const addFaqItem = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFormData((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), { question: newFaqQ.trim(), answer: newFaqA.trim() }],
    }));
    setNewFaqQ('');
    setNewFaqA('');
  };

  const removeFaqItem = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== idx),
    }));
  };

  const filteredGuides = guides.filter((g) => {
    const matchSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      (g.subtitle && g.subtitle.toLowerCase().includes(search.toLowerCase())) ||
      g.excerpt.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === 'all' || g.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || g.status === statusFilter;

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="space-y-6" id="legal-guide-manager">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900">Správa Právních průvodců & Rádců</h2>
          </div>
          <p className="text-sm text-slate-500">
            Spravujte podrobné metodické návody (OSPOD, soud, posudky, výživné) s kapitolami, checklisty a FAQ.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          id="btn-create-legal-guide"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Přidat nového průvodce
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Hledat v názvech, popisech, kapitolách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="all">Všechny stavy publikace</option>
              <option value="PUBLISHED">Publikováno (PUBLISHED)</option>
              <option value="DRAFT">Koncept (DRAFT)</option>
              <option value="ARCHIVED">Archivováno (ARCHIVED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* List of Guides */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            Nalezeno {filteredGuides.length} {filteredGuides.length === 1 ? 'průvodce' : 'průvodců'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Načítání právních průvodců...</div>
        ) : filteredGuides.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            Žádní průvodci neodpovídají zadaným filtrům.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Pořadí</th>
                  <th className="py-3.5 px-4">Název a podtitul</th>
                  <th className="py-3.5 px-4">Kategorie</th>
                  <th className="py-3.5 px-4">Struktura obsahu</th>
                  <th className="py-3.5 px-4">Stav</th>
                  <th className="py-3.5 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                      {guide.order}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{guide.title}</div>
                      {guide.subtitle && (
                        <div className="text-xs text-slate-500 mt-0.5">{guide.subtitle}</div>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-1 mt-1">{guide.excerpt}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/50">
                        <Tag className="w-3 h-3 text-amber-500" />
                        {guide.categoryLabel || guide.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-600 space-y-0.5">
                        <div>📖 {guide.chapters?.length || 0} kapitol</div>
                        <div>✅ {guide.checklist?.length || 0} položek checklistu</div>
                        <div>❓ {guide.faqs?.length || 0} FAQ otázek</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {guide.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" /> Publikováno
                        </span>
                      ) : guide.status === 'DRAFT' ? (
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
                          onClick={() => handleOpenPreview(guide)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Náhled"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(guide)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Upravit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(guide.id, guide.title)}
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-6">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedGuide ? `Upravit průvodce: ${selectedGuide.title}` : 'Vytvořit nového právního průvodce'}
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
                    Název průvodce *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="např. Jak zvládnout sociální šetření OSPOD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Podtitul / slogan
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="např. Kompletní metodický postup pro rodiče"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategorie</label>
                  <select
                    value={formData.category || 'ospod'}
                    onChange={(e) => {
                      const sel = CATEGORIES.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        categoryLabel: sel ? sel.label : e.target.value,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                    URL Slug (např. ospod-pruvodce)
                  </label>
                  <input
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="ospod-pruvodce"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stav publikace</label>
                  <select
                    value={formData.status || 'PUBLISHED'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  >
                    <option value="PUBLISHED">Publikováno</option>
                    <option value="DRAFT">Koncept</option>
                    <option value="ARCHIVED">Archivováno</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stručný souhrn / Excerpt *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Výstižný popis průvodce zobrazený v přehledu karet..."
                />
              </div>

              {/* Chapters Builder */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Kapitoly průvodce ({(formData.chapters || []).length})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={addChapter}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Přidat kapitolu
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.chapters || []).map((chapter, idx) => (
                    <div
                      key={chapter.id || idx}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                    >
                      <div
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                        onClick={() => setExpandedChapterIdx(expandedChapterIdx === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs text-slate-900">
                            {chapter.title || `Kapitola ${idx + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeChapter(idx);
                            }}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedChapterIdx === idx ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {expandedChapterIdx === idx && (
                        <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Název kapitoly
                            </label>
                            <input
                              type="text"
                              value={chapter.title}
                              onChange={(e) => updateChapter(idx, { title: e.target.value })}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Typ boxu
                              </label>
                              <select
                                value={chapter.type || 'info'}
                                onChange={(e) => updateChapter(idx, { type: e.target.value as any })}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                              >
                                <option value="info">Informativní (Modrý)</option>
                                <option value="warning">Upozornění (Jantarový)</option>
                                <option value="success">Doporučený postup (Zelený)</option>
                                <option value="danger">Rizika a sankce (Červený)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Pořadí
                              </label>
                              <input
                                type="number"
                                value={chapter.order}
                                onChange={(e) => updateChapter(idx, { order: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Obsah kapitoly (Markdown / Text)
                            </label>
                            <textarea
                              rows={5}
                              value={chapter.content}
                              onChange={(e) => updateChapter(idx, { content: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                              placeholder="Detailní obsah kapitoly, paragrafy, doporučení..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist & FAQs Builder */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Checklist */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    Kontrolní seznam kroků (Checklist)
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(formData.checklist || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100"
                      >
                        <span>☑️ {typeof item === 'string' ? item : item.label}</span>
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(idx)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChecklist}
                      onChange={(e) => setNewChecklist(e.target.value)}
                      placeholder="Přidat položku do checklistu..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={addChecklistItem}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg font-semibold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* FAQs */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    Často kladené otázky k tématu (FAQ)
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(formData.faqs || []).map((faq, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded-lg border border-slate-100 relative group"
                      >
                        <div className="font-semibold text-slate-900 pr-6">❓ {faq.question}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{faq.answer}</div>
                        <button
                          type="button"
                          onClick={() => removeFaqItem(idx)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={newFaqQ}
                      onChange={(e) => setNewFaqQ(e.target.value)}
                      placeholder="Otázka..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFaqA}
                        onChange={(e) => setNewFaqA(e.target.value)}
                        placeholder="Odpověď..."
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={addFaqItem}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg font-semibold"
                      >
                        + FAQ
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer & Sources */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Právní upozornění / Disclaimer
                  </label>
                  <textarea
                    rows={2}
                    value={formData.disclaimer || ''}
                    onChange={(e) => setFormData({ ...formData, disclaimer: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Zdroje a právní předpisy
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
                      placeholder="Přidat zdroj / zákon..."
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
                  <FileText className="w-4 h-4 text-amber-600" />
                  SEO Metadata (Vyhledávače & OpenGraph)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={formData.seoTitle || ''}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      placeholder="Průvodce: [Název] | Táta má právo"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">SEO Description</label>
                    <input
                      type="text"
                      value={formData.seoDescription || ''}
                      onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      placeholder="Kompletní metodický přehled a doporučené kroky..."
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
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {selectedGuide ? 'Uložit změny' : 'Vytvořit průvodce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50/50 rounded-t-2xl">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  {selectedGuide.categoryLabel || selectedGuide.category}
                </span>
                <h3 className="text-2xl font-black text-slate-900">{selectedGuide.title}</h3>
                {selectedGuide.subtitle && (
                  <p className="text-xs text-slate-600 mt-1">{selectedGuide.subtitle}</p>
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
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Anotace</h4>
                <p className="leading-relaxed text-slate-800">{selectedGuide.excerpt}</p>
              </div>

              {selectedGuide.chapters && selectedGuide.chapters.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Kapitoly ({selectedGuide.chapters.length})
                  </h4>
                  {selectedGuide.chapters.map((ch, i) => (
                    <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                      <h5 className="font-bold text-slate-900 text-sm mb-2">{ch.title}</h5>
                      <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                        {ch.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedGuide.checklist && selectedGuide.checklist.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckSquare className="w-4 h-4" /> Doporučený kontrolní seznam
                  </h4>
                  <div className="space-y-1.5">
                    {selectedGuide.checklist.map((item, i) => (
                      <div key={i} className="p-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-xl text-emerald-950 text-xs">
                        ☑️ {typeof item === 'string' ? item : item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedGuide.faqs && selectedGuide.faqs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <HelpCircle className="w-4 h-4" /> Často kladené otázky
                  </h4>
                  <div className="space-y-2">
                    {selectedGuide.faqs.map((faq, i) => (
                      <div key={i} className="p-3 bg-indigo-50/60 border border-indigo-200/60 rounded-xl text-xs">
                        <div className="font-bold text-indigo-950 mb-1">❓ {faq.question}</div>
                        <div className="text-indigo-900">{faq.answer}</div>
                      </div>
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
