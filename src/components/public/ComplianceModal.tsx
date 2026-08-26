import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { ComplianceDoc } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, FileCheck, CheckCircle2, Clock } from 'lucide-react';

interface ComplianceModalProps {
  activeDocKey: string | null;
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ activeDocKey, onClose }) => {
  const { currentUser } = useAuth();
  const [docs, setDocs] = useState<ComplianceDoc[]>([]);
  const [currentDocKey, setCurrentDocKey] = useState<string>(activeDocKey || 'terms');
  const [consented, setConsented] = useState<boolean>(false);

  useEffect(() => {
    apiFetch('/api/compliance/docs')
      .then((res) => res.json())
      .then((data) => setDocs(data))
      .catch((err) => console.error('Error fetching compliance docs:', err));
  }, []);

  useEffect(() => {
    if (activeDocKey) {
      setCurrentDocKey(activeDocKey);
    }
  }, [activeDocKey]);

  const resolveAlias = (key: string) => {
    const map: Record<string, string> = {
      'terms': 'terms',
      'podminky-uzivani': 'terms',
      'gdpr': 'gdpr',
      'privacy': 'gdpr',
      'cookies': 'cookies',
      'legal_docs': 'legal',
      'moje-pravni-dokumenty': 'legal',
      'legal': 'legal',
      'volunteer_code': 'volunteer_code',
      'dobrovolnicky-kodex': 'volunteer_code',
      'dohoda-o-spolupraci': 'dohoda-o-spolupraci',
      'volunteer_agreement': 'dohoda-o-spolupraci',
      'e-dohoda': 'dohoda-o-spolupraci',
      'ai_disclaimer': 'ai_statement',
      'ai-prohlaseni': 'ai_statement',
      'ai_statement': 'ai_statement',
    };
    return map[key] || key;
  };

  const targetKey = resolveAlias(currentDocKey);
  const activeDoc = docs.find((d) => d.key === targetKey || d.key === currentDocKey) || docs[0];

  const handleRecordConsent = async () => {
    if (!currentUser || !activeDoc) return;
    try {
      const res = await apiFetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          docKey: activeDoc.key,
          docVersion: activeDoc.version,
        }),
      });
      if (res.ok) {
        setConsented(true);
      }
    } catch (e) {
      console.error('Consent error:', e);
    }
  };

  if (!activeDocKey) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Verzované Právní & Compliance Dokumenty</h2>
              <span className="text-xs text-slate-500">Systémová správa souhlasů a právních podmínek</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs for all 6 compliance docs */}
        <div className="flex flex-wrap gap-2 my-4 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold">
          {docs.map((doc) => (
            <button
              key={doc.key}
              onClick={() => {
                setCurrentDocKey(doc.key);
                setConsented(false);
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentDocKey === doc.key
                  ? 'bg-blue-900 text-white shadow-xs font-bold'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              {doc.title}
            </button>
          ))}
        </div>

        {/* Content View */}
        {activeDoc && (
          <div className="flex-1 overflow-y-auto my-2 pr-2">
            <div className="flex items-center justify-between bg-blue-50/80 p-3 rounded-xl mb-4 border border-blue-100 text-xs text-blue-900 font-mono">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Verze: <strong>v{activeDoc.version}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Účinnost od: {new Date(activeDoc.effectiveDate).toLocaleDateString('cs-CZ')}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-4">{activeDoc.title}</h3>

            <div className="prose prose-slate text-sm leading-relaxed text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-200/80 whitespace-pre-line">
              {activeDoc.content}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRecordConsent}
                disabled={consented}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  consented
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-900 text-white hover:bg-blue-950 shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {consented ? 'Souhlas zaznamenán' : `Potvrdit souhlas s v${activeDoc?.version}`}
              </button>
              <span className="text-[11px] text-slate-500">
                Uživatel: {currentUser.email}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              Přihlaste se pro zaznamenání souhlasu do databáze.
            </span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-300"
          >
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
};
