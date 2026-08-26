import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Calendar, CheckCircle2, ArrowLeft, FileText, ExternalLink, AlertTriangle } from 'lucide-react';
import { ComplianceDoc } from '../../types';

interface PublicComplianceViewProps {
  slug: string;
  onNavigate?: (route: string) => void;
  currentUser?: { id: string; email?: string; name?: string } | null;
}

export const PublicComplianceView: React.FC<PublicComplianceViewProps> = ({ slug, onNavigate, currentUser }) => {
  const [doc, setDoc] = useState<ComplianceDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [consentLoading, setConsentLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/compliance/docs/public/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setDoc(data);

        if (currentUser && data) {
          // Check existing consent
          const consentRes = await apiFetch(`/api/compliance/consent/${currentUser.id}`);
          if (consentRes.ok) {
            const consents = await consentRes.json();
            const existing = consents.find(
              (c: any) => c.docKey === data.key && c.docVersion === data.version && c.status === 'ACCEPTED'
            );
            if (existing) setHasConsented(true);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching public compliance document:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [slug, currentUser]);

  const handleRecordConsent = async () => {
    if (!doc) return;
    try {
      setConsentLoading(true);
      setMessage(null);
      const res = await apiFetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'guest-user',
          docKey: doc.key,
          docVersion: doc.version,
          status: 'ACCEPTED',
        }),
      });

      if (res.ok) {
        setHasConsented(true);
        setMessage('Váš souhlas s touto verzí dokumentu byl bezpečně zaznamenán.');
      }
    } catch (err) {
      console.error('Error recording consent:', err);
    } finally {
      setConsentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Načítám oficiální verzi právního dokumentu...</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Dokument nenalezen</h2>
        <p className="text-xs text-slate-500">Požadovaný právní dokument nebyl v databázi nalezen nebo není publikován.</p>
        <button
          onClick={() => onNavigate?.('/')}
          className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold"
        >
          Zpět na hlavní stránku
        </button>
      </div>
    );
  }

  const complianceLinks = [
    { slug: 'podminky-uzivani', title: 'Podmínky užívání' },
    { slug: 'gdpr', title: 'Ochrana osobních údajů (GDPR)' },
    { slug: 'cookies', title: 'Soubory cookie' },
    { slug: 'moje-pravni-dokumenty', title: 'Právní výhrada' },
    { slug: 'dobrovolnicky-kodex', title: 'Dobrovolnický kodex' },
    { slug: 'dohoda-o-spolupraci', title: 'e-Dohoda o spolupráci' },
    { slug: 'ai-prohlaseni', title: 'AI Prohlášení' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <button
          onClick={() => onNavigate?.('/')}
          className="text-xs font-semibold text-slate-600 hover:text-blue-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na portál
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold font-mono text-[10px]">
            v{doc.version}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            PLATNÁ VERZE
          </span>
        </div>
      </div>

      {/* Document Header Header Card */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-blue-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Compliance Center — Oficiální dokument</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{doc.title}</h1>
        {doc.description && <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">{doc.description}</p>}
        <div className="flex items-center gap-4 text-[11px] text-slate-300 pt-2 border-t border-white/10 font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            Účinnost: {new Date(doc.effectiveDate).toLocaleDateString('cs-CZ')}
          </span>
          <span>•</span>
          <span>Autor: {doc.author || 'Administrátor portálu'}</span>
        </div>
      </div>

      {/* Document Content Body */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
        <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
          {doc.content}
        </div>

        {/* Consent Box */}
        <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-900">Potvrzení seznámení a souhlasu</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tento souhlas bude bezpečně zaznamenán v databázi Compliance Center pod vaší e-mailovou adresou.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {hasConsented ? (
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Souhlas udělen
              </span>
            ) : (
              <button
                onClick={handleRecordConsent}
                disabled={consentLoading}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {consentLoading ? 'Ukládám...' : 'Potvrdit souhlas s touto verzí'}
              </button>
            )}
          </div>
        </div>

        {message && (
          <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            {message}
          </p>
        )}
      </div>

      {/* Quick links to other legal documents */}
      <div className="bg-slate-100/70 p-6 rounded-2xl border border-slate-200 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-slate-500" />
          Ostatní dokumenty v Compliance Center
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {complianceLinks.map((item) => (
            <button
              key={item.slug}
              onClick={() => onNavigate?.(`/${item.slug}`)}
              className={`p-2.5 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                slug === item.slug
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <span className="truncate">{item.title}</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
