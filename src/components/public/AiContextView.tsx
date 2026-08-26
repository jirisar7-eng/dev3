import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { SeoHead } from './SeoHead';
import { Cpu, FileText, Globe, Shield, RefreshCw, CheckCircle2, Terminal, Database, Copy, ExternalLink, ArrowRight } from 'lucide-react';

interface AiContextViewProps {
  onNavigate: (path: string) => void;
}

export const AiContextView: React.FC<AiContextViewProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

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
      }
    } catch (e) {
      console.error('Error refreshing index:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <SeoHead
        title="AI Context & Machine Index • Táta má právo"
        description="Strojově čitelný kontext, llms.txt, sitemap a metadata pro AI agenty, LLM crawlery a vývojáře."
        canonicalPath="/ai-context"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold border border-blue-400/30">
            <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
            AI CONTEXT & MACHINE INDEX
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Strojově čitelný kontext portálu Táta má právo
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Oficiální rozhraní a strukturované zdroje určené pro LLM agenty, webové crawlery (GPTBot, ClaudeBot, PerplexityBot) a vývojáře s garantovanou ochranou osobních údajů (PII) a fail-closed zabezpečením.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <a
              href="/llms.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Zobrazit /llms.txt
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              Zobrazit /sitemap.xml
            </a>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              Zobrazit /robots.txt
            </a>
          </div>
        </div>
      </div>

      {/* Status & Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stav indexu</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-lg font-black text-slate-900 capitalize">{status?.status || 'Aktivní'}</span>
          </div>
          <p className="text-xs text-slate-500">Automaticky synchronizováno</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Veřejné URL v indexu</div>
          <div className="text-2xl font-black text-blue-900">{status?.publicUrlCount || 35}+</div>
          <p className="text-xs text-slate-500">Exkluzivně ověřené veřejné stránky</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Poslední generování</div>
          <div className="text-sm font-mono font-bold text-slate-800">
            {status?.lastGenerated ? new Date(status.lastGenerated).toLocaleString('cs-CZ') : 'Nyní'}
          </div>
          <p className="text-xs text-slate-500">Dynamická cashovaná revalidace</p>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identity & Purpose */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Identita a účel portálu</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            <strong>Táta má právo</strong> je přední česká odborná platforma poskytující otcům v opatrovnických řízeních komplexní právní, psychologickou a krizovou oporu. Hlavním krédem je prosazování nejlepšího zájmu dítěte prostřednictvím rovnocenné a střídavé péče.
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ochrana ústavních práv dětí a rodičů</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Odborná e-Sbírka paragrafů (OZ, ZSPOD, o.s.ř.)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>AI asistenti pro analýzu rozsudků a přípravu podání</span>
            </li>
          </ul>
        </div>

        {/* Security & Constraints */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Bezpečnost a ochrana dat (P0)</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Architektura striktně dodržuje pravidlo nulové tolerance k úniku citlivých dat. Všechny strojově čitelné výstupy a robotí direktivy striktně ignorují a blokují:
          </p>
          <ul className="space-y-2 text-xs text-slate-700 pt-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span>Osobní spisy otců a klientské dokumenty (/muj-pripad)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span>Uživatelské e-maily, JWT tokeny a tajné klíče</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0"></span>
              <span>Administrativní rozhraní a interní API endpointy</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Machine Endpoints Table */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900">Dostupné strojové endpointy</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                <th className="pb-3">Endpoint / URL</th>
                <th className="pb-3">Formát</th>
                <th className="pb-3">Účel</th>
                <th className="pb-3 text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 font-mono font-bold text-blue-900">/llms.txt</td>
                <td className="py-3"><span className="px-2 py-1 rounded bg-blue-50 text-blue-800 font-mono text-[10px]">Markdown</span></td>
                <td className="py-3 text-slate-600">Standardizovaný LLM kontext a strukturovaný přehled portálu.</td>
                <td className="py-3 text-right">
                  <a href="/llms.txt" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1">
                    Otevřít <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-mono font-bold text-blue-900">/sitemap.xml</td>
                <td className="py-3"><span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px]">XML</span></td>
                <td className="py-3 text-slate-600">Kompletní sitemap všech veřejných stránek pro vyhledávače.</td>
                <td className="py-3 text-right">
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1">
                    Otevřít <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-mono font-bold text-blue-900">/robots.txt</td>
                <td className="py-3"><span className="px-2 py-1 rounded bg-amber-50 text-amber-800 font-mono text-[10px]">Plain Text</span></td>
                <td className="py-3 text-slate-600">Pravidla pro crawlery a roboty s definicí zakázaných privátních sekcí.</td>
                <td className="py-3 text-right">
                  <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1">
                    Otevřít <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
              <tr>
                <td className="py-3 font-mono font-bold text-blue-900">/api/ai-context/status</td>
                <td className="py-3"><span className="px-2 py-1 rounded bg-purple-50 text-purple-800 font-mono text-[10px]">JSON</span></td>
                <td className="py-3 text-slate-600">Stavový API endpoint pro diagnostiku a metriky AI kontextu.</td>
                <td className="py-3 text-right">
                  <a href="/api/ai-context/status" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-1">
                    Otevřít <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
