import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, ExternalLink, Layout, Sparkles, FileText, RefreshCw } from 'lucide-react';

export interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface AdminPagesListProps {
  onNavigate?: (path: string) => void;
}

export const AdminPagesList: React.FC<AdminPagesListProps> = ({ onNavigate }) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const loadPages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pages');
      if (!res.ok) throw new Error('Nepodařilo se načíst seznam stránek.');
      const data = await res.json();
      setPages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Chyba při načítání stránek.');
    } finally {
      setIsLoading(false);
    }
  };

  const [isConverting, setIsConverting] = useState<boolean>(false);

  const handleConvertAllPages = async () => {
    setIsConverting(true);
    setSyncMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/pages/convert-all-to-puck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Nepodařilo se převést stránky do Puck editoru.');
      const data = await res.json();
      setSyncMessage(data.message || 'Všechny stávající stránky byly úspěšně převedeny do Puck editoru.');
      await loadPages();
    } catch (err: any) {
      setError(err.message || 'Chyba při převodu stránek.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleSyncModules = async () => {

    setIsSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/pages/sync-modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Nepodařilo se synchronizovat modulové stránky.');
      const data = await res.json();
      setSyncMessage(data.message || 'Všech 33 stránek z menu bylo úspěšně synchronizováno.');
      await loadPages();
    } catch (err: any) {
      setError(err.message || 'Chyba při synchronizaci stránek modulů.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Opravdu chcete smazat stránku "${title}"?`)) return;

    try {
      const res = await fetch(`/api/pages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Chyba při mazání stránky.');
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Nepodařilo se smazat stránku.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-extrabold text-slate-900">Správa stránek (Puck Builder)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Přehled všech vytvořených stránek. Můžete vytvářet nové stránky nebo upravovat stávající pomocí vizuálního Puck editoru.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleConvertAllPages}
            disabled={isConverting}
            className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Převede všechny stávající staré stránky na strukturovaný Puck formát"
          >
            <Sparkles className={`w-4 h-4 ${isConverting ? 'animate-spin' : ''}`} />
            <span>Převést stávající stránky na Puck</span>
          </button>
          <button
            onClick={handleSyncModules}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Synchronizuje všech 33 modulů z hlavního menu do seznamu stránek pro Puck Builder"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Synchronizovat 33 stránek z menu</span>
          </button>

          <button
            onClick={loadPages}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all cursor-pointer"
            title="Obnovit seznam"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/admin/pages/new')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Vytvořit novou stránku</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl border border-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Content State */}
      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-600">Načítám seznam stránek...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-800 p-6 rounded-3xl border border-rose-200 text-sm font-medium">
          {error}
        </div>
      ) : pages.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Zatím nebyly vytvořeny žádné stránky</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vytvořte svou první stránku pomocí drag & drop vizuálního builderu Puck.
          </p>
          <button
            onClick={() => navigate('/admin/pages/new')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Vytvořit první stránku</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Název stránky</th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4">Poslední úprava</th>
                  <th className="px-6 py-4 text-right">Akce</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{page.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs">
                        /{page.slug}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(page.updatedAt).toLocaleString('cs-CZ')}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/admin/pages/edit/${page.slug}`)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        title="Upravit v Puck Editoru"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Upravit v Puck</span>
                      </button>

                      <button
                        onClick={() => handleDelete(page.id, page.title)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all inline-flex items-center cursor-pointer"
                        title="Smazat stránku"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPagesList;
