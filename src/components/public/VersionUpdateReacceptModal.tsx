import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ComplianceDoc } from '../../types';

export const VersionUpdateReacceptModal: React.FC = () => {
  const { currentUser } = useAuth();
  const [pendingDocs, setPendingDocs] = useState<ComplianceDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [acceptedSuccessfully, setAcceptedSuccessfully] = useState<boolean>(false);

  // Dev/Preview check
  const isDevOrPreview = (import.meta as any).env?.DEV || 
    window.location.hostname.includes('localhost') || 
    window.location.hostname.includes('run.app') || 
    window.location.hostname.includes('aistudio');

  useEffect(() => {
    if (!currentUser || isDevOrPreview) return;

    const checkRequiredConsents = async () => {
      try {
        // Fetch all active/published documents
        const docsRes = await fetch('/api/legal/documents');
        // Fetch user's recorded consents
        const consentsRes = await fetch(`/api/compliance/consent/${currentUser.id}`);

        if (docsRes.ok && consentsRes.ok) {
          const docs: ComplianceDoc[] = await docsRes.json();
          const consents = await consentsRes.json();

          // Filter documents to ONLY require 'terms' and 'gdpr' for the global modal
          const mandatoryKeys = ['terms', 'gdpr'];
          const mandatoryDocs = docs.filter(d => mandatoryKeys.includes(d.key));

          // Filter documents that the user has not accepted the latest version of
          const outstanding = mandatoryDocs.filter(doc => {
            // Find if there is an ACCEPTED consent for this doc key and EXACT version
            const hasAcceptedLatest = consents.some(
              (c: any) => c.docKey === doc.key && c.docVersion === doc.version && c.status === 'ACCEPTED'
            );
            return !hasAcceptedLatest;
          });

          // Check localStorage as well in case DB is slow or out of sync in current session
          const finalOutstanding = outstanding.filter(doc => {
             const localKey = `accepted_${doc.key}_v${doc.version}`;
             return localStorage.getItem(localKey) !== 'true';
          });

          setPendingDocs(finalOutstanding);
        }
      } catch (err) {
        console.error('Error checking user terms compliance state:', err);
      }
    };

    checkRequiredConsents();
  }, [currentUser, acceptedSuccessfully, isDevOrPreview]);

  const handleAcceptAll = async () => {
    if (pendingDocs.length === 0 || !currentUser) return;

    try {
      setLoading(true);
      // Accept all pending docs concurrently
      const acceptPromises = pendingDocs.map(doc => 
        fetch('/api/legal/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            docKey: doc.key,
            version: doc.version
          })
        }).then(res => {
          if (res.ok) {
            localStorage.setItem(`accepted_${doc.key}_v${doc.version}`, 'true');
          }
          return res;
        })
      );

      await Promise.all(acceptPromises);

      // Finished all pending terms re-acceptances
      setPendingDocs([]);
      setAcceptedSuccessfully(true);
      
    } catch (err) {
      console.error('Error accepting legal documents:', err);
    } finally {
      setLoading(false);
    }
  };

  if (pendingDocs.length === 0 || isDevOrPreview) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header Alert */}
        <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Aktualizace právních ujednání
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-1">
              Vyžadován souhlas s novými podmínkami
            </h2>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              Abychom ochránili vaše práva, musíme vás požádat o prostudování a odsouhlasení aktualizovaných povinných dokumentů předtím, než budete moci pokračovat v užívání portálu.
            </p>
          </div>
        </div>

        {/* Scrollable Doc content listing all updates */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2">
          {pendingDocs.map(doc => (
             <div key={doc.key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 mb-2 text-blue-900 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <span className="font-bold block text-slate-800">{doc.title}</span>
                    <span className="text-[10px] text-slate-500">Účinnost od: {new Date(doc.effectiveDate).toLocaleDateString('cs-CZ')}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-950 font-bold font-mono text-[10px]">
                    v{doc.version}
                  </span>
                </div>
                <div className="prose prose-slate max-w-none text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-700 max-h-[150px] overflow-y-auto">
                  {doc.content}
                </div>
             </div>
          ))}
        </div>

        {/* Accept button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={handleAcceptAll}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Rozumím a souhlasím se všemi podmínkami</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

