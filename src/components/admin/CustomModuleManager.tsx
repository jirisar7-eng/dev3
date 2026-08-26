import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { CustomModule, SchemaDrivenContent } from '../../types';
import { SchemaDrivenRenderer } from '../common/SchemaDrivenRenderer';
import {
  Code,
  Layers,
  Plus,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Edit,
  Save,
  Copy,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Menu,
  Box,
  FileCode,
  Sliders,
  Check,
  X,
  Shield,
  HelpCircle,
  Search,
} from 'lucide-react';

// Pre-built JSON templates for fast Schema-Driven creation
const JSON_PRESETS = [
  {
    name: 'Krizový rozcestník (Hero + Alert + Grid + FAQ)',
    category: 'Krizová pomoc & Komunita',
    icon: 'ShieldAlert',
    json: {
      version: '1.0',
      title: 'Krizový rozcestník rychlé pomoci',
      description: 'Přehled okamžitých právních a psychologických kroků v náročné situaci.',
      sections: [
        {
          type: 'hero',
          title: 'Stali jste se obětí zamezování styku?',
          subtitle: 'Rychlý návod jak reagovat věcně, právně čistě a bez emocí.',
          badge: '🚨 První pomoc',
          badgeColor: 'rose',
          buttonText: 'Přejít do SOS Plánu',
          buttonLink: '/sos-plan'
        },
        {
          type: 'alert',
          variant: 'danger',
          title: 'Akutní zásada',
          description: 'Nikdy nepřistupujte na konflikty před dětmi. Vše zapisujte do deníku a zasílejte písemné výzvy.'
        },
        {
          type: 'grid',
          title: 'Doporučené kroky',
          columns: 3,
          items: [
            {
              title: '1. Písemná komunikace',
              description: 'Komunikujte pouze SMS nebo e-mailem, věcně a s návrhem konkrétních časů.',
              icon: 'FileText',
              badge: 'Příprava',
              badgeColor: 'blue'
            },
            {
              title: '2. Protokol OSPOD',
              description: 'Informujte OSPOD o překážkách v péči a vyžádejte si zprávu.',
              icon: 'Users',
              badge: 'Úřad',
              badgeColor: 'indigo'
            },
            {
              title: '3. Návrh na PO',
              description: 'Podávejte návrh na předběžné opatření do 7 dnů od zamezení.',
              icon: 'Scale',
              badge: 'Soud',
              badgeColor: 'emerald'
            }
          ]
        },
        {
          type: 'accordion',
          title: 'Časté krizové dotazy',
          items: [
            {
              question: 'Jak postupovat při nepředání dítěte z kroužku nebo školy?',
              answer: 'Informujte vedení školy o tom, že jste zákonný zástupce s plnými rodičovskými právy a doložte rodný list nebo rozsudek.'
            }
          ]
        }
      ]
    }
  },
  {
    name: 'Poradní modul s formulářem (Hero + FAQ + Formular)',
    category: 'Právní & Poradna',
    icon: 'HelpCircle',
    json: {
      version: '1.0',
      title: 'Poradna a konzultace',
      description: 'Získejte odpovědi na vaše dotazy od zkušených otců a právních poradců.',
      sections: [
        {
          type: 'hero',
          title: 'Bezplatná orientační poradna',
          subtitle: 'Pomáháme otcům zorientovat se v soudních procesech a opatrovnických řízeních.',
          badge: '👥 Komunitní podpora',
          badgeColor: 'blue'
        },
        {
          type: 'faq',
          title: 'Nejčastější dotazy do poradny',
          items: [
            {
              question: 'Kolik stojí první právní konzultace?',
              answer: 'Naše základní orientační poradna v komunitě je zdarma. Pro zastupování doporučujeme ověřené advokáty.'
            }
          ]
        },
        {
          type: 'form',
          title: 'Napište svůj dotaz do poradny',
          description: 'Vyplňte základní údaje pro věcné posouzení vašich možností.',
          submitLabel: 'Odeslat dotaz do poradny',
          submitMessage: 'Váš dotaz byl zaznamenán. Poradce se ozve co nejdříve.',
          fields: [
            { name: 'name', label: 'Jméno a příjmení', type: 'text', required: true, placeholder: 'Jan Novák' },
            { name: 'email', label: 'E-mailový kontakt', type: 'email', required: true, placeholder: 'jan@example.com' },
            { name: 'topic', label: 'Téma dotazu', type: 'select', required: true, options: ['Střídavá péče', 'Výživné', 'OSPOD', 'Předběžné opatření'] },
            { name: 'message', label: 'Popis vaší situace', type: 'textarea', required: true, placeholder: 'Stručně popište situaci...' }
          ]
        }
      ]
    }
  },
  {
    name: 'Přehled statistik & Čísel (Hero + Stats + Callout)',
    category: 'Soudy & Judikatura',
    icon: 'Scale',
    json: {
      version: '1.0',
      title: 'Statistiky opatrovnické justice v ČR',
      description: 'Data a fakta o rozhodování soudů o péči o děti.',
      sections: [
        {
          type: 'hero',
          title: 'Data o rovnoprávném rodičovství',
          subtitle: 'Prohlédněte si aktuální fakta o svěřování dětí do péče.',
          badge: '📊 Fakta a data',
          badgeColor: 'indigo'
        },
        {
          type: 'stats',
          title: 'Klíčové ukazatele péče',
          items: [
            { value: '88%', label: 'Případů střídavé péče funguje stabilně', subtitle: 'Při včasné dohodě rodičů' },
            { value: '14 dní', label: 'Průměrná lhůta na rozhodnutí OSPOD', subtitle: 'U akutních podnětů' },
            { value: '2 400+', label: 'Zapojených otců v komunitě', subtitle: 'Společně za spravedlivou péči' }
          ]
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Věděli jste, že?',
          description: 'Ústavní soud opakovaně potvrdil, že svěření dítěte do výlučné péče jednoho rodiče má být až krajním řešením.'
        }
      ]
    }
  }
];

export const CustomModuleManager: React.FC = () => {
  const [modules, setModules] = useState<CustomModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Editor states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Krizová pomoc & Komunita');
  const [icon, setIcon] = useState('Box');
  const [showInMenu, setShowInMenu] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [contentJson, setContentJson] = useState('{\n  "version": "1.0",\n  "sections": []\n}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // View / Preview Mode in editor
  const [editorTab, setEditorTab] = useState<'editor' | 'preview'>('editor');
  const [previewModalModule, setPreviewModalModule] = useState<CustomModule | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchModules = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/custom-modules/admin');
      if (res.ok) {
        const data = await res.json();
        setModules(data);
      } else {
        const fallbackRes = await apiFetch('/api/custom-modules?all=true');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setModules(fallbackData);
        }
      }
    } catch (err) {
      console.error('Chyba při načítání custom modulů:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('Krizová pomoc & Komunita');
    setIcon('Box');
    setShowInMenu(true);
    setIsActive(true);
    setContentJson(JSON.stringify(JSON_PRESETS[0].json, null, 2));
    setJsonError(null);
    setEditorTab('editor');
    setIsEditing(true);
  };

  const handleOpenEdit = (mod: CustomModule) => {
    setEditingId(mod.id);
    setTitle(mod.title);
    setSlug(mod.slug);
    setCategory(mod.category);
    setIcon(mod.icon || 'Box');
    setShowInMenu(mod.showInMenu);
    setIsActive(mod.isActive);
    try {
      const parsed = JSON.parse(mod.contentJson);
      setContentJson(JSON.stringify(parsed, null, 2));
    } catch {
      setContentJson(mod.contentJson);
    }
    setJsonError(null);
    setEditorTab('editor');
    setIsEditing(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      const autoSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_-]/g, '-')
        .replace(/-+/g, '-');
      setSlug(autoSlug);
    }
  };

  const validateJson = (): boolean => {
    try {
      JSON.parse(contentJson);
      setJsonError(null);
      return true;
    } catch (err: any) {
      setJsonError(`Chyba v zápisu JSON: ${err.message}`);
      return false;
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(contentJson);
      setContentJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError(`Nelze formátovat neplatný JSON: ${err.message}`);
    }
  };

  const handleApplyPreset = (presetJson: any) => {
    setContentJson(JSON.stringify(presetJson, null, 2));
    setJsonError(null);
  };

  const handleSave = async () => {
    if (!title || !slug) {
      alert('Vyplňte prosím název a slug modulu.');
      return;
    }

    if (!validateJson()) {
      alert('Váš JSON obsahuje syntaktickou chybu. Opravte ji před uložením.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        slug,
        category,
        icon,
        showInMenu,
        isActive,
        contentJson,
      };

      const url = editingId ? `/api/custom-modules/${editingId}` : '/api/custom-modules';
      const method = editingId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Uložení selhalo');
      }

      await fetchModules();
      setIsEditing(false);
    } catch (err: any) {
      alert(`Chyba při ukládání: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleState = async (id: string, field: 'isActive' | 'showInMenu', currentValue: boolean) => {
    try {
      const res = await apiFetch(`/api/custom-modules/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      if (res.ok) {
        setModules((prev) =>
          prev.map((m) => (m.id === id ? { ...m, [field]: !currentValue } : m))
        );
      }
    } catch (err) {
      console.error('Chyba při přepínání stavu:', err);
    }
  };

  const handleDelete = async (id: string, moduleTitle: string) => {
    if (!window.confirm(`Opravdu chcete smazat modul "${moduleTitle}"?`)) return;

    try {
      const res = await apiFetch(`/api/custom-modules/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setModules((prev) => prev.filter((m) => m.id !== id));
      } else {
        const data = await res.json();
        alert(`Chyba při mazání: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Chyba při mazání: ${err.message}`);
    }
  };

  const filteredModules = modules.filter((mod) => {
    const matchesSearch =
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'active') return matchesSearch && mod.isActive;
    if (filterStatus === 'inactive') return matchesSearch && !mod.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Code className="w-6 h-6 text-indigo-600" />
            Schema-Driven JSON Moduly
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Vytvářejte a spravujte vlastní dynamické moduly definované strukturovaným JSON schématem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchModules()}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Obnovit
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Vytvořit JSON Modul</span>
          </button>
        </div>
      </div>

      {/* Editor Modal / Workspace */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-white border border-indigo-200 shadow-xl space-y-5 relative">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'Úprava Schema-Driven modulu' : 'Nový Schema-Driven modul'}
              </h3>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Název modulu *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Např. Krizový rozcestník"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="krizovy-rozcestnik-modul"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategorie</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Krizová pomoc & Komunita"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ikona (Lucide)</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="ShieldAlert, FileText, Box..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Aktivní modul (dostupný pro uživatele)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showInMenu}
                onChange={(e) => setShowInMenu(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Zobrazit v menu hlavního portálu</span>
            </label>
          </div>

          {/* Presets and JSON Editor bar */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  Definice obsahu (JSON Schema):
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Presets Dropdown */}
                <select
                  onChange={(e) => {
                    const idx = parseInt(e.target.value, 10);
                    if (!isNaN(idx) && JSON_PRESETS[idx]) {
                      handleApplyPreset(JSON_PRESETS[idx].json);
                      setCategory(JSON_PRESETS[idx].category);
                      setIcon(JSON_PRESETS[idx].icon);
                    }
                  }}
                  defaultValue=""
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg text-slate-700"
                >
                  <option value="" disabled>
                    -- Načíst vzorovou šablonu --
                  </option>
                  {JSON_PRESETS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Formátovat JSON
                </button>

                {/* Tab Switcher: Editor vs Live Preview */}
                <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setEditorTab('editor')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      editorTab === 'editor'
                        ? 'bg-white text-indigo-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kód (JSON)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      validateJson();
                      setEditorTab('preview');
                    }}
                    className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                      editorTab === 'preview'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3 h-3" />
                    Živý náhled
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message if JSON Invalid */}
            {jsonError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-mono text-[11px]">{jsonError}</span>
              </div>
            )}

            {/* Editor vs Live Preview Display */}
            {editorTab === 'editor' ? (
              <textarea
                value={contentJson}
                onChange={(e) => {
                  setContentJson(e.target.value);
                  setJsonError(null);
                }}
                rows={14}
                className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner leading-relaxed"
                placeholder='{\n  "version": "1.0",\n  "sections": []\n}'
              />
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 max-h-[500px] overflow-y-auto">
                <SchemaDrivenRenderer
                  contentJson={contentJson}
                  title={title || 'Náhled modulu'}
                  category={category}
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Ukládám...' : editingId ? 'Uložit změny' : 'Vytvořit modul'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-indigo-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Všechny ({modules.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'active'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Aktivní ({modules.filter((m) => m.isActive).length})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'inactive'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Neaktivní ({modules.filter((m) => !m.isActive).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat modul..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Modules Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Načítám Schema-Driven moduly...</span>
          </div>
        ) : filteredModules.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Box className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">Žádné Schema-Driven moduly nebyl nalezeny.</p>
            <p className="text-[11px] opacity-80">
              Vytvořte svůj první modul tlačítkem "Vytvořit JSON Modul" výše.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Modul / Název</th>
                  <th className="py-3 px-4">Slug / Cesta</th>
                  <th className="py-3 px-4">Kategorie</th>
                  <th className="py-3 px-4 text-center">Aktivní</th>
                  <th className="py-3 px-4 text-center">V Menu</th>
                  <th className="py-3 px-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredModules.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                          <Code className="w-4 h-4" />
                        </div>
                        <span>{mod.title}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                      /{mod.slug}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {mod.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleState(mod.id, 'isActive', mod.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                          mod.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {mod.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aktivní</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Vypnutý</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleState(mod.id, 'showInMenu', mod.showInMenu)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-all ${
                          mod.showInMenu
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {mod.showInMenu ? 'Ano' : 'Ne'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewModalModule(mod)}
                          title="Živý náhled"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(mod)}
                          title="Upravit modul"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(mod.id, mod.title)}
                          title="Smazat modul"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Standalone Preview Modal */}
      {previewModalModule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  Živý náhled modulu
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {previewModalModule.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalModule(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SchemaDrivenRenderer
              contentJson={previewModalModule.contentJson}
              title={previewModalModule.title}
              category={previewModalModule.category}
            />

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setPreviewModalModule(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
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

export default CustomModuleManager;
