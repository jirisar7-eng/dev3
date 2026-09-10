import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  Lock,
  UserCheck,
  Clock,
  History
} from 'lucide-react';

export type DocumentBehavior =
  | 'INFORMATION'
  | 'TERMS_ACCEPTANCE'
  | 'COOKIE_POLICY'
  | 'VOLUNTEER_CODE'
  | 'AGREEMENT'
  | 'AI_DISCLOSURE'
  | 'LEGAL_NOTICE';

export interface LegalDocumentLayoutProps {
  documentId: string;
  version: string;
  effectiveDate: string;
  title: string;
  subtitle?: string;
  content: string;
  behavior: DocumentBehavior;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  previousVersion?: string;
  hasHistory?: boolean;
  onViewHistory?: () => void;
  onNavigate?: (path: string) => void;
  // Acceptance logic
  isConsented?: boolean;
  onRecordConsent?: (payload: any) => Promise<void>;
  consentLoading?: boolean;
  consentMessage?: string | null;
  hideBackButton?: boolean;
  backPath?: string;
  backLabel?: string;
}

export const LegalDocumentLayout: React.FC<LegalDocumentLayoutProps> = ({
  documentId,
  version,
  effectiveDate,
  title,
  subtitle,
  content,
  behavior,
  status,
  previousVersion,
  hasHistory,
  onViewHistory,
  onNavigate,
  isConsented,
  onRecordConsent,
  consentLoading,
  consentMessage,
  hideBackButton = false,
  backPath = '/pravni-dokumenty',
  backLabel = 'Zpět do Právního & Compliance centra',
}) => {
  const { currentUser } = useAuth();

  // State for typed signature and agreement
  const [agreed, setAgreed] = useState<boolean>(false);
  const [signatureText, setSignatureText] = useState<string>('');
  const [volunteerName, setVolunteerName] = useState<string>(
    currentUser?.name || currentUser?.email?.split('@')[0] || ''
  );

  useEffect(() => {
    if (currentUser && !volunteerName) {
      setVolunteerName(currentUser.name || currentUser.email.split('@')[0]);
    }
  }, [currentUser]);

  const handlePrint = () => {
    window.print();
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onRecordConsent) {
      await onRecordConsent({
        signature: signatureText,
        name: volunteerName,
        behavior
      });
    }
  };

  const handleSimpleConsent = async () => {
    if (onRecordConsent) {
      await onRecordConsent({ behavior });
    }
  };

  return (
    <div className="font-sans w-full">

      {(status === 'DRAFT' || version.includes('DRAFT')) && (
        <div className="print:hidden w-full bg-amber-500 text-amber-950 px-4 py-3 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm relative z-50 rounded-b-xl mb-4 text-center">
          ⚠️ PRACOVNÍ NÁVRH — NEPUBLIKOVÁNO (Verze {version}, DRAFT). Tento dokument není aktuálně účinnou verzí právních podmínek.
        </div>
      )}
{/* Print Only Header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
          Synthesis OS • Samostatný modul compliance
        </div>
        <h1 className="text-3xl font-black text-slate-900">{title}</h1>
        <div className="flex gap-4 mt-2 text-xs font-mono text-slate-600">
          <span>ID: {documentId}</span>
          <span>Verze: {version}</span>
          <span>Účinnost od: {effectiveDate}</span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="print:hidden mb-8 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          {!hideBackButton && (
            <button
              onClick={() => onNavigate?.(backPath)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 mb-4 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>{backLabel}</span>
            </button>
          )}
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Synthesis OS • Samostatný modul compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-2 font-medium">{subtitle}</p>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Vytisknout / PDF</span>
          </button>
        </div>
      </div>

      {/* Metadata Banner */}
      <div className="print:hidden bg-white rounded-2xl border border-slate-200 p-4 mb-8 shadow-sm flex flex-wrap items-center gap-x-6 gap-y-3 text-xs">
        <div className="flex items-center gap-1.5 break-normal">
          <span className="text-slate-500 font-medium whitespace-nowrap">Verze:</span>
          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono whitespace-nowrap">{version}</span>
        </div>
        <div className="flex items-center gap-1.5 break-all">
          <span className="text-slate-500 font-medium whitespace-nowrap">ID:</span>
          <span className="font-mono text-slate-700">{documentId}</span>
        </div>
        <div className="flex items-center gap-1.5 break-normal">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-500 font-medium whitespace-nowrap">Účinnost od:</span>
          <span className="font-bold text-slate-700 whitespace-nowrap">{effectiveDate}</span>
        </div>
        <div className="flex items-center gap-1.5 md:ml-auto">
          {status === 'DRAFT' || version.includes('DRAFT') ? (
            <>
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-bold text-amber-800 tracking-wide whitespace-nowrap">PRACOVNÍ NÁVRH (NEÚČINNÉ)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-800 tracking-wide whitespace-nowrap">PLATNÉ ZNĚNÍ</span>
            </>
          )}
        </div>
      </div>

      {/* Previous Version & History */}
      {(previousVersion || hasHistory) && (
        <div className="print:hidden flex items-center justify-between mb-8 px-2 text-xs">
          {previousVersion && (
            <span className="text-slate-500">Nahrazuje verzi: {previousVersion}</span>
          )}
          {hasHistory && (
            <button
              onClick={onViewHistory}
              className="ml-auto inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Zobrazit historii verzí</span>
            </button>
          )}
        </div>
      )}

      {/* Document Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 print:bg-transparent">
        <div className="prose prose-slate prose-headings:text-slate-900 prose-headings:font-black prose-a:text-blue-700 max-w-none text-sm leading-relaxed text-slate-800 markdown-body">
          <Markdown>{content}</Markdown>
        </div>
      </div>

      {/* Acceptance / Consent Section */}
      {behavior !== 'INFORMATION' && behavior !== 'COOKIE_POLICY' && behavior !== 'LEGAL_NOTICE' && behavior !== 'AI_DISCLOSURE' && (
        <div className="print:block mt-8">
          {(status === 'DRAFT' || version.includes('DRAFT')) ? (
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-center text-xs sm:text-sm font-bold text-amber-900 flex flex-col items-center justify-center gap-1.5">
              <span>⚠️ PRACOVNÍ NÁVRH — NEPUBLIKOVÁNO (WORKING DRAFT — NOT FOR PUBLICATION)</span>
              <span className="font-normal text-xs text-amber-800">
                U nepublikované verze (DRAFT {version}) není možné zaznamenat přijetí, souhlas ani podpis. Tento dokument není aktuálně účinný.
              </span>
            </div>
          ) : (
            <>
              {/* VOLUNTEER_CODE or AGREEMENT */}
              {(behavior === 'VOLUNTEER_CODE' || behavior === 'AGREEMENT') && (
                currentUser ? (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-4">
                      <UserCheck className="w-5 h-5 text-blue-700" />
                      <span>Identifikace {behavior === 'VOLUNTEER_CODE' ? 'dobrovolníka' : 'spolupracovníka'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Jméno a příjmení</label>
                        <input
                          type="text"
                          value={volunteerName}
                          onChange={(e) => setVolunteerName(e.target.value)}
                          placeholder="Jan Svoboda"
                          disabled={isConsented}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Uživatelské ID / E-mail</label>
                        <input
                          type="text"
                          value={currentUser.email}
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-500 text-xs"
                        />
                      </div>
                    </div>

                    <form onSubmit={handleSign} className="space-y-5 pt-6 border-t border-slate-100 print:hidden">
                      <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <input
                          type="checkbox"
                          id="agreeCheckbox"
                          checked={isConsented ? true : agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          disabled={isConsented}
                          className="mt-1 w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="agreeCheckbox" className="text-xs sm:text-sm text-slate-700 font-semibold cursor-pointer leading-relaxed">
                          Seznámil(a) jsem se s dokumentem verze {version}, rozumím jeho ustanovením a zavazuji se jej dodržovat v rámci projektu Táta má právo / Synthesis OS.
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Elektronické potvrzení přijetí (napište celé své jméno)
                        </label>
                        <input
                          type="text"
                          required
                          value={isConsented ? (currentUser.name || currentUser.email) : signatureText}
                          onChange={(e) => setSignatureText(e.target.value)}
                          disabled={isConsented}
                          placeholder="např. Jan Svoboda"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:bg-slate-50"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                        <div className="text-[10px] sm:text-xs text-slate-500 max-w-sm leading-relaxed">
                          Záznamy o přijetí a souhlasech jsou evidovány v auditní historii systému.
                        </div>

                        {!isConsented ? (
                          <button
                            type="submit"
                            disabled={consentLoading || !agreed || signatureText.length < 3}
                            className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                          >
                            <Lock className="w-4 h-4" />
                            <span>{consentLoading ? 'Ukládám...' : 'Potvrdit přijetí dokumentu'}</span>
                          </button>
                        ) : (
                          <div className="px-5 py-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Úspěšně potvrzeno</span>
                          </div>
                        )}
                      </div>
                    </form>
                    <div className="hidden print:block pt-4 border-t border-slate-300">
                      <div className="text-xs text-slate-600 font-bold mb-2">Záznam o elektronickém potvrzení přijetí:</div>
                      <div className="text-xs text-slate-900 font-mono">Status: {isConsented ? 'PŘIJETÍ DOKUMENTU POTVRZENO A EVIDOVÁNO' : 'NEPOTVRZENO'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Přijetí dokumentu vyžaduje přihlášení</h4>
                      <p className="text-xs text-slate-500 mt-1">Pro zobrazení identifikace a potvrzení přijetí je nutné se přihlásit.</p>
                    </div>
                    <button
                       onClick={() => onNavigate?.('/login')}
                       className="px-6 py-3 bg-blue-900 text-white hover:bg-blue-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                     >
                       <Lock className="w-4 h-4" />
                       Přihlásit se
                     </button>
                  </div>
                )
              )}

              {/* General TERMS_ACCEPTANCE */}
              {behavior === 'TERMS_ACCEPTANCE' && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Souhlas s podmínkami užívání</div>
                      <div className="text-xs text-slate-500 font-medium">Potvrzením vyjadřujete souhlas s aktuálním zněním.</div>
                    </div>
                  </div>

                  {currentUser ? (
                    isConsented ? (
                      <div className="px-5 py-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        <span>Souhlas udělen</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleSimpleConsent}
                        disabled={consentLoading}
                        className="px-6 py-3 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        {consentLoading ? 'Ukládám...' : 'Potvrdit přijetí dokumentu'}
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => onNavigate?.('/login')}
                      className="px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      Přihlásit se k odsouhlasení
                    </button>
                  )}
                </div>
              )}

            </>
          )}
        </div>
      )}

      {consentMessage && (
        <div className={`print:hidden mt-6 text-xs font-semibold p-4 rounded-xl border ${
          consentMessage.includes('chyb')
            ? 'text-rose-800 bg-rose-50 border-rose-200'
            : 'text-emerald-800 bg-emerald-50 border-emerald-200'
        }`}>
          {consentMessage}
        </div>
      )}

    </div>
  );
};
