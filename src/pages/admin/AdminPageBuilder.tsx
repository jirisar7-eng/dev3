import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { puckConfig, normalizePuckData } from '../../components/builder/puck.config';
import { ArrowLeft, Save, LayoutTemplate, Sparkles, Plus, Copy } from 'lucide-react';
import { PageTemplateData } from '../../services/templateService';

export function useParams<T extends Record<string, string | undefined>>(): T {
  if (typeof window === 'undefined') return {} as T;
  const path = window.location.pathname;
  const editMatch = path.match(/\/admin\/pages\/edit\/([^/]+)/);
  if (editMatch) {
    return { slug: decodeURIComponent(editMatch[1]) } as unknown as T;
  }
  return {} as T;
}

export const AdminPageBuilder: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { slug: urlSlug } = useParams<{ slug?: string }>();
  
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [initialData, setInitialData] = useState<Data>({ content: [], root: {} });
  const [localData, setLocalData] = useState<Data>({ content: [], root: {} });
  const [isLoading, setIsLoading] = useState<boolean>(!!urlSlug);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // AI Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiRawText, setAiRawText] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Templates Modal
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templates, setTemplates] = useState<PageTemplateData[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [saveAsTemplateMode, setSaveAsTemplateMode] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('CUSTOM');
  const [templateDescription, setTemplateDescription] = useState('');

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  // Check if pending template in localStorage on mount
  useEffect(() => {
    const pendingTpl = localStorage.getItem('puck_pending_template');
    if (pendingTpl && !urlSlug) {
      try {
        const parsed = JSON.parse(pendingTpl);
        const normalized = normalizePuckData(parsed);
        setInitialData(normalized);
        setLocalData(normalized);
        if (parsed.root?.props?.title) {
          setTitle(parsed.root.props.title);
        }
        localStorage.removeItem('puck_pending_template');
      } catch (e) {
        console.warn('Failed to parse pending template JSON:', e);
      }
    }
  }, [urlSlug]);

  useEffect(() => {
    if (!urlSlug) return;
    const fetchPage = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(`/api/pages/${encodeURIComponent(urlSlug)}`);
        if (!res.ok) throw new Error('Stránka nebyla nalezena.');
        const pageData = await res.json();
        setTitle(pageData.title || '');
        setSlug(pageData.slug || '');
        
        let parsedContent = pageData.content;
        if (typeof parsedContent === 'string') {
          try { parsedContent = JSON.parse(parsedContent); } catch (e) { /*...*/ }
        }
        
        const normalized = normalizePuckData(parsedContent);
        setInitialData(normalized);
        setLocalData(normalized);
      } catch (err: any) {
        setNotification({ type: 'error', message: err.message || 'Nepodařilo se načíst stránku.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPage();
  }, [urlSlug]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await apiFetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch (e) {
      console.warn('Failed to fetch templates:', e);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleOpenTemplatesModal = () => {
    setIsTemplateModalOpen(true);
    setSaveAsTemplateMode(false);
    fetchTemplates();
  };

  const handleApplyTemplate = (tpl: PageTemplateData) => {
    try {
      const parsed = JSON.parse(tpl.puckDataJson);
      const normalized = normalizePuckData(parsed);
      setInitialData(normalized);
      setLocalData(normalized);
      if (!title) {
        setTitle(tpl.name);
      }
      setIsTemplateModalOpen(false);
      setNotification({ type: 'success', message: `Šablona "${tpl.name}" byla úspěšně načtena.` });
    } catch (e) {
      setNotification({ type: 'error', message: 'Načtení šablony selhalo - neplatný JSON.' });
    }
  };

  const handleSaveAsTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    try {
      const payload = {
        name: templateName.trim(),
        category: templateCategory,
        description: templateDescription.trim(),
        puckDataJson: JSON.stringify(localData),
      };

      const res = await apiFetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Uložení šablony selhalo.');

      setNotification({ type: 'success', message: `Rozvržení bylo uloženo jako nová šablona "${templateName}".` });
      setIsTemplateModalOpen(false);
      setSaveAsTemplateMode(false);
      setTemplateName('');
      setTemplateDescription('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Při ukládání šablony došlo k chybě.' });
    }
  };

  const handleSave = async (puckData: Data) => {
    const finalTitle = title.trim() || 'Bez názvu';
    const finalSlug = slug.trim() || (title ? title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : 'nova-stranka');

    setIsSaving(true);
    setNotification(null);

    try {
      const res = await apiFetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTitle, slug: finalSlug, content: puckData }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Uložení stránky selhalo.');
      }

      setNotification({ type: 'success', message: 'Stránka byla úspěšně uložena.' });
      setTimeout(() => navigate('/admin/pages'), 1000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Při ukládání došlo k chybě.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAi = async () => {
    if (!aiRawText) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/ai/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: aiRawText, title: aiTitle }),
      });
      if (!res.ok) throw new Error('Generování selhalo.');
      const aiData = await res.json();
      setLocalData(aiData);
      setInitialData(aiData);
      setIsAiModalOpen(false);
      setNotification({ type: 'success', message: 'Stránka vygenerována AI.' });
    } catch (err) {
      setNotification({ type: 'error', message: 'Generování selhalo.' });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="p-20 text-center text-white bg-slate-900 h-screen">Načítám stránku v Puck editoru...</div>;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col w-screen h-screen bg-slate-900 overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/pages')} className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Zpět</span>
          </button>
          <div className="flex items-center gap-2">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Název..." className="bg-transparent text-white font-bold text-sm focus:outline-none w-32 md:w-48" />
            <span className="text-slate-600">/</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug..." className="bg-transparent text-slate-400 font-mono text-xs focus:outline-none w-24 md:w-32" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {notification && <span className={`text-xs font-semibold ${notification.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>{notification.message}</span>}
          
          <button
            onClick={handleOpenTemplatesModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded-lg text-xs font-bold transition-all border border-slate-600 cursor-pointer"
          >
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            <span>Šablony</span>
          </button>

          <button onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs font-semibold transition-colors cursor-pointer">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Generátor</span>
          </button>
          
          <button onClick={() => handleSave(localData)} disabled={isSaving} className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer">
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Ukládám...' : 'Uložit stránku'}</span>
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 w-full h-[calc(100vh-56px)] overflow-hidden">
        <Puck
          config={puckConfig}
          data={initialData}
          onChange={(data) => setLocalData(data)}
          overrides={{
            headerActions: () => null // Hide Puck's default actions
          }}
        />
      </div>

      {/* Templates Drawer Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-white shadow-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-xl font-bold">Puck Template Engine</h3>
                <p className="text-xs text-slate-400">Načtěte hotovou šablonu nebo uložte aktuální stav jako novou šablonu.</p>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-white text-xl font-bold cursor-pointer">&times;</button>
            </div>

            <div className="flex gap-2 mb-4 border-b border-slate-800 pb-3">
              <button
                onClick={() => setSaveAsTemplateMode(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${!saveAsTemplateMode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                Vybrat z existujících šablon
              </button>
              <button
                onClick={() => setSaveAsTemplateMode(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${saveAsTemplateMode ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}
              >
                + Uložit rozvržení jako novou šablonu
              </button>
            </div>

            {!saveAsTemplateMode ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {isLoadingTemplates ? (
                  <div className="py-12 text-center text-xs text-slate-400">Načítám šablony...</div>
                ) : templates.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">Žádné šablony nejsou k dispozici.</div>
                ) : (
                  templates.map((tpl) => (
                    <div key={tpl.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{tpl.name}</span>
                          <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 font-bold text-[10px] rounded uppercase">{tpl.category}</span>
                        </div>
                        {tpl.description && <p className="text-xs text-slate-400 line-clamp-2">{tpl.description}</p>}
                      </div>
                      <button
                        onClick={() => handleApplyTemplate(tpl)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg whitespace-nowrap cursor-pointer shadow-xs"
                      >
                        Aplikovat
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveAsTemplate} className="space-y-4 my-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Název nové šablony *</label>
                  <input
                    type="text"
                    required
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="např. Šablona s Anketou a Formuárom"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kategorie</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                  >
                    <option value="LANDING">LANDING</option>
                    <option value="ARTICLE">ARTICLE</option>
                    <option value="LEGAL">LEGAL</option>
                    <option value="FORM">FORM</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stručný popis</label>
                  <textarea
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    rows={3}
                    placeholder="Popište prvky obsažené v této šabloně..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSaveAsTemplateMode(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                  >
                    Zpět
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                  >
                    Uložit jako šablonu
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>Generovat stránku pomocí AI</span>
            </h2>
            <input value={aiTitle} onChange={(e) => setAiTitle(e.target.value)} placeholder="Název článku nebo témata..." className="w-full p-2.5 mb-4 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm"/>
            <textarea value={aiRawText} onChange={(e) => setAiRawText(e.target.value)} placeholder="Vložte podklady..." className="w-full h-56 p-3 mb-4 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 text-slate-300 text-xs">Zrušit</button>
              <button onClick={handleGenerateAi} disabled={isGenerating} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold disabled:opacity-50">
                {isGenerating ? 'AI sestavuje Puck...' : 'Generovat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPageBuilder;

