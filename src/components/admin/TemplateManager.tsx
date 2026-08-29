import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  Copy,
  Folder,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { PageTemplateData } from '../../services/templateService';

interface TemplateManagerProps {
  onNavigate?: (path: string) => void;
  onSelectTemplate?: (template: PageTemplateData) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ onNavigate, onSelectTemplate }) => {
  const [templates, setTemplates] = useState<PageTemplateData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal state for Create / Edit Template
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<PageTemplateData | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('CUSTOM');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formThumbnail, setFormThumbnail] = useState<string>('');
  const [formPuckJson, setFormPuckJson] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Preview JSON Modal
  const [previewTemplate, setPreviewTemplate] = useState<PageTemplateData | null>(null);

  const categories = [
    { key: 'ALL', label: 'Všechny šablony' },
    { key: 'LANDING', label: 'Landing Pages' },
    { key: 'ARTICLE', label: 'Články & Návody' },
    { key: 'LEGAL', label: 'Právní & GDPR' },
    { key: 'FORM', label: 'Formuláře & Poradna' },
    { key: 'CUSTOM', label: 'Vlastní šablony' },
  ];

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/templates');
      if (!res.ok) throw new Error('Nepodařilo se načíst šablony.');
      const data = await res.json();
      setTemplates(data || []);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Chyba při načítání šablon.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCategory('CUSTOM');
    setFormDescription('');
    setFormThumbnail('');
    setFormPuckJson(
      JSON.stringify(
        {
          content: [
            {
              type: 'HeroBlock',
              props: {
                title: 'Nová šablona',
                description: 'Popis šablony...',
                buttonText: 'Akce',
                buttonUrl: '#',
              },
            },
            {
              type: 'TextBlock',
              props: {
                text: 'Vložte obsah pro novou šablonu...',
                align: 'left',
              },
            },
          ],
          root: { props: { title: 'Nová šablona' } },
        },
        null,
        2
      )
    );
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tpl: PageTemplateData) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormCategory(tpl.category);
    setFormDescription(tpl.description || '');
    setFormThumbnail(tpl.thumbnailUrl || '');
    
    let formattedJson = tpl.puckDataJson;
    try {
      formattedJson = JSON.stringify(JSON.parse(tpl.puckDataJson), null, 2);
    } catch (e) {
      /* Keep raw */
    }
    setFormPuckJson(formattedJson);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPuckJson.trim()) return;

    setSaving(true);
    setNotification(null);

    try {
      // Validate JSON
      let parsed = null;
      try {
        parsed = JSON.parse(formPuckJson);
      } catch (e) {
        throw new Error('Zadaný Puck JSON má neplatný formát SyntaxError.');
      }

      const payload = {
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        thumbnailUrl: formThumbnail.trim() || null,
        puckDataJson: JSON.stringify(parsed),
      };

      let res;
      if (editingTemplate) {
        res = await apiFetch(`/api/templates/${editingTemplate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error('Uložení šablony selhalo.');

      setNotification({
        type: 'success',
        message: editingTemplate ? 'Šablona byla úspěšně aktualizována.' : 'Nová šablona byla vytvořena.',
      });
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Při ukládání došlo k chybě.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Opravdu chcete smazat šablonu "${name}"?`)) return;

    try {
      const res = await apiFetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Smazání selhalo.');

      setNotification({ type: 'success', message: 'Šablona byla smazána.' });
      fetchTemplates();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Při mazání došlo k chybě.' });
    }
  };

  const handleSeedTemplates = async () => {
    try {
      const res = await apiFetch('/api/templates/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Inicializace selhala.');
      setNotification({ type: 'success', message: 'Systémové šablony byly úspěšně inicializovány.' });
      fetchTemplates();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Chyba při obnově šablon.' });
    }
  };

  const handleUseTemplateForNewPage = (tpl: PageTemplateData) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl);
      return;
    }
    // Encode template JSON or pass via query/localStorage
    localStorage.setItem('puck_pending_template', tpl.puckDataJson);
    const path = `/admin/pages/new?templateId=${tpl.id}`;
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = activeCategory === 'ALL' || t.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <LayoutTemplate className="w-4 h-4" />
            <span>Puck Template Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold">Správa šablon stránek</h2>
          <p className="text-sm text-slate-300 mt-1">
            Vytvářejte a spravujte opakovaně použitelné layoutové šablony pro rychlé zakládání stránek a modulů.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedTemplates}
            title="Obnovit výchozí systémové šablony"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Obnovit výchozí</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Vytvořit novou šablonu</span>
          </button>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-xs opacity-70 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Categories & Search */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat v šablonách..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Načítám šablony Puck...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <LayoutTemplate className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200 mb-1">Žádné šablony nenalezeny</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Pro zvolenou kategorii nebo hledaný výraz neexistují žádné šablony.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Vytvořit první šablonu
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
            >
              <div>
                {/* Thumbnail Header */}
                <div
                  onClick={() => setPreviewTemplate(tpl)}
                  className="h-40 w-full relative bg-slate-950 overflow-hidden border-b border-slate-800 cursor-pointer"
                >
                  {tpl.thumbnailUrl ? (
                    <img
                      src={tpl.thumbnailUrl}
                      alt={tpl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                      <LayoutTemplate className="w-10 h-10 mb-2 opacity-50" />
                      <span className="text-xs font-mono">Puck Template</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-indigo-300 font-bold text-[10px] rounded-lg border border-slate-700 uppercase tracking-wider">
                      {tpl.category}
                    </span>
                    {tpl.isSystem && (
                      <span className="px-2 py-0.5 bg-emerald-950/90 text-emerald-300 font-semibold text-[10px] rounded-lg border border-emerald-800">
                        Systémová
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3
                    onClick={() => setPreviewTemplate(tpl)}
                    className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {tpl.name}
                  </h3>
                  {tpl.description && (
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      {tpl.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewTemplate(tpl)}
                  title="Zobrazit Puck JSON strukturu"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(tpl)}
                    title="Upravit šablonu"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {!tpl.isSystem && (
                    <button
                      onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                      title="Smazat šablonu"
                      className="p-2 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleUseTemplateForNewPage(tpl)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <span>Použít</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl p-6 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-xl font-bold">
                {editingTemplate ? 'Upravit šablonu' : 'Vytvořit novou šablonu'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Název šablony <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="např. Speciální Právní Návod"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kategorie <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="LANDING">LANDING (Prezentační stránka)</option>
                    <option value="ARTICLE">ARTICLE (Článek & Návod)</option>
                    <option value="LEGAL">LEGAL (Právní & GDPR)</option>
                    <option value="FORM">FORM (Formulář & Poradna)</option>
                    <option value="CUSTOM">CUSTOM (Vlastní šablona)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    URL náhledu (Obrázek)
                  </label>
                  <input
                    type="url"
                    value={formThumbnail}
                    onChange={(e) => setFormThumbnail(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Popis šablony</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Stručně popište, k čemu šablona slouží..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Puck Data (JSON struktura) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  value={formPuckJson}
                  onChange={(e) => setFormPuckJson(e.target.value)}
                  rows={10}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {saving ? 'Ukládám...' : 'Uložit šablonu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview JSON Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl p-6 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold">{previewTemplate.name}</h3>
                <span className="text-xs text-indigo-400 font-mono">Puck JSON Data</span>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <pre className="flex-1 overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-indigo-300 mb-4">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(previewTemplate.puckDataJson), null, 2);
                } catch (e) {
                  return previewTemplate.puckDataJson;
                }
              })()}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewTemplate.puckDataJson);
                  setNotification({ type: 'success', message: 'JSON byl zkopírován do schránky.' });
                  setPreviewTemplate(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Zkopírovat JSON</span>
              </button>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
