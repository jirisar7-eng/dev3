import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { Cpu, FileText, Globe, Shield, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Copy, Terminal, Database } from 'lucide-react';

export const AiContextManager: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'llms' | 'sitemap' | 'robots' | 'summary'>('summary');
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await apiFetch('/api/ai-context/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Error fetching AI context status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch('/api/admin/ai-context/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
        showToast('AI Context index byl úspěšně obnoven.');
      } else {
        showToast('Chyba při obnově indexu.');
      }
    } catch (e) {
      showToast('Síťová chyba při obnově indexu.');
    } finally {
      setRefreshing(false);
    }
  };

  const loadPreview = async (type: 'llms' | 'sitemap' | 'robots') => {
    setActiveTab(type);
    setPreviewLoading(true);
    const url = type === 'llms' ? '/llms.txt' : type === 'sitemap' ? '/sitemap.xml' : '/robots.txt';
    try {
      const res = await apiFetch(url);
      const text = await res.text();
      setPreviewContent(text);
    } catch (e) {
      setPreviewContent('Chyba při načítání náhledu.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Zkopírováno do schránky.');
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
            <Cpu className="w-4 h-4 text-blue-700" />
            AI Context & Machine Index Admin
          </div>
          <h1 className="text-2xl font-black text-slate-900">Správa AI kontextu a strojových výstupů</h1>
          <p className="text-xs text-slate-500">
            Dohled nad generováním llms.txt, sitemap.xml, robots.txt a veřejných AI direktiv portálu.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-5 py-3 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Generuji index...' : 'Obnovit index'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stav systému</div>
          <div className="flex items-center gap-2 text-base font-black text-slate-900">
            <span className={`w-2.5 h-2.5 rounded-full ${status?.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="capitalize">{status?.status || 'Aktivní'}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Veřejné URL v indexu</div>
          <div className="text-xl font-black text-blue-900">{status?.publicUrlCount || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Poslední generování</div>
          <div className="text-xs font-mono font-bold text-slate-700 truncate">
            {status?.lastGenerated ? new Date(status.lastGenerated).toLocaleString('cs-CZ') : 'N/A'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detekované chyby</div>
          <div className="text-xs font-bold text-emerald-600 truncate">
            {status?.error || 'Žádné'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Previews */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-4 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'summary' ? 'border-blue-900 text-blue-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Přehled výstupů
          </button>
          <button
            onClick={() => loadPreview('llms')}
            className={`px-6 py-4 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'llms' ? 'border-blue-900 text-blue-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Náhled /llms.txt
          </button>
          <button
            onClick={() => loadPreview('sitemap')}
            className={`px-6 py-4 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'sitemap' ? 'border-blue-900 text-blue-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            Náhled /sitemap.xml
          </button>
          <button
            onClick={() => loadPreview('robots')}
            className={`px-6 py-4 font-bold text-xs flex items-center gap-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'robots' ? 'border-blue-900 text-blue-950 bg-white' : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Náhled /robots.txt
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {activeTab === 'summary' ? (
            <div className="space-y-6">
              <h2 className="text-base font-extrabold text-slate-900">Strojové kontextové adresy</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Hlavní AI Context stránka</div>
                    <a href="/ai-context" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                      /ai-context
                    </a>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">LLMS.txt dokument</div>
                    <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                      /llms.txt
                    </a>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Sitemap XML</div>
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                      /sitemap.xml
                    </a>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Robots.txt direktivy</div>
                    <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-blue-600 hover:underline">
                      /robots.txt
                    </a>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-800 uppercase font-mono">
                  Náhled {activeTab === 'llms' ? '/llms.txt' : activeTab === 'sitemap' ? '/sitemap.xml' : '/robots.txt'}
                </h2>
                <button
                  onClick={() => copyToClipboard(previewContent)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Kopírovat
                </button>
              </div>

              {previewLoading ? (
                <div className="py-20 text-center text-slate-400 text-xs font-bold">Načítám náhled...</div>
              ) : (
                <pre className="p-6 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px] leading-relaxed">
                  {previewContent}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
