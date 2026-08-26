import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ShieldCheck,
  Calendar,
  User,
  GitCommit,
  GitBranch,
  Printer,
  Download,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  FileText,
  Lock,
} from 'lucide-react';
import { AuditDocumentItem, AuditShareItem } from '../../types';

interface SharedAuditViewProps {
  token: string;
  onNavigate: (path: string) => void;
}

export const SharedAuditView: React.FC<SharedAuditViewProps> = ({ token, onNavigate }) => {
  const [audit, setAudit] = useState<AuditDocumentItem | null>(null);
  const [content, setContent] = useState<string>('');
  const [shareInfo, setShareInfo] = useState<AuditShareItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchSharedAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/audit/share/${encodeURIComponent(token)}`);
        const json = await res.json();

        if (json.success && json.audit) {
          setAudit(json.audit);
          setContent(json.content || '');
          setShareInfo(json.shareInfo || null);
        } else {
          setError(json.error || 'Sdílený odkaz je neplatný, zrušen nebo vypršela jeho platnost.');
        }
      } catch (err: any) {
        setError(err.message || 'Chyba při komunikaci se serverem.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedAudit();
    } else {
      setError('Nebyl poskytnut bezpečnostní token.');
      setLoading(false);
    }
  }, [token]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            STAV: PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            STAV: WARNING
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            STAV: FAIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            STAV: NEUVEDENO
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 max-w-4xl mx-auto px-4 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-sm font-semibold text-slate-600">Ověřuji bezpečnostní token a načítám sdílený audit...</p>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="py-20 max-w-md mx-auto text-center px-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black uppercase mb-3">
          403 Access Error
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Sdílený audit nelze zobrazit</h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">{error}</p>
        <button
          onClick={() => onNavigate('/')}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Návrat na hlavní stranu</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              SDÍLENÝ SYSTEMOVÝ AUDIT
            </span>
            <span className="text-xs text-slate-400 font-mono">dev3 / synthesis hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{audit.title}</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">Zdroj: {audit.sourcePath}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={copyToClipboard}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Zkopírováno' : 'Kopírovat'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Vytisknout / PDF</span>
          </button>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Stav Auditu</span>
          <div className="mt-1">{renderStatusBadge(audit.status)}</div>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Kategorie</span>
          <span className="font-bold text-slate-800 block mt-1">{audit.category}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Datum Auditu</span>
          <span className="font-bold text-slate-800 block mt-1">{audit.auditDate || 'Neuvedeno'}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Autor / Inženýr</span>
          <span className="font-bold text-slate-800 block mt-1">{audit.author || 'Neuvedeno'}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Git Commit</span>
          <span className="font-bold text-slate-800 block mt-1">{audit.commitSha ? audit.commitSha.slice(0, 8) : 'N/A'}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Git Větev</span>
          <span className="font-bold text-slate-800 block mt-1">{audit.branch || 'main'}</span>
        </div>

        <div className="col-span-2">
          <span className="text-slate-400 block text-[10px] uppercase font-bold">Platnost Sdílení</span>
          <span className="font-bold text-slate-800 block mt-1">
            {shareInfo?.expiresAt ? new Date(shareInfo.expiresAt).toLocaleDateString('cs-CZ') : 'Neomezená platnost'}
          </span>
        </div>
      </div>

      {/* Rendered Markdown Body */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
        <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
