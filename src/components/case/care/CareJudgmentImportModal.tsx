import React, { useState } from 'react';
import { CarePlan, CaseChild } from '../../../types';
import {
  FileText,
  Sparkles,
  Scale,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Upload,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface CareJudgmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  childrenList: CaseChild[];
  onImportPlan: (newPlanData: Partial<CarePlan>) => Promise<void>;
}

export const CareJudgmentImportModal: React.FC<CareJudgmentImportModalProps> = ({
  isOpen,
  onClose,
  caseId,
  childrenList,
  onImportPlan,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [judgmentText, setJudgmentText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeSourceSnippet, setActiveSourceSnippet] = useState<{ fieldName: string; sourceText: string; confidence: number } | null>(null);

  if (!isOpen) return null;

  const handleParseJudgment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !judgmentText.trim()) {
      setError('Nahrajte soubor rozsudku nebo vložte text výrokové části.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('document', file);
      } else {
        formData.append('text', judgmentText.trim());
      }

      const res = await fetch(`/api/cases/${caseId}/parse-judgment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při AI analýze dokumentu.');

      setExtractedData(data);
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se analyzovat dokument.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!extractedData) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/apply-judgment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ extractedData })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Chyba při ukládání údajů do spisu.');

      alert('Rozsudek byl úspěšně zpracován a data byla uložena do spisu!');
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(`Chyba ukládání: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFound = extractedData?.metadata?.totalFound || 0;
  const needsReviewCount = extractedData?.metadata?.needsReviewCount || 0;
  const notFoundCount = extractedData?.metadata?.notFoundCount || 0;
  const fieldsMeta = extractedData?.metadata?.fields || {};

  const getStatusBadge = (fieldName: string) => {
    const meta = fieldsMeta[fieldName];
    if (!meta) return null;
    if (meta.status === 'VERIFIED') {
      return (
        <span
          title={`Ověřeno (jistota: ${Math.round(meta.confidence * 100)}%)`}
          onClick={() => meta.sourceText && setActiveSourceSnippet({ fieldName, sourceText: meta.sourceText, confidence: meta.confidence })}
          className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold cursor-pointer hover:bg-emerald-200"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {Math.round(meta.confidence * 100)}%
        </span>
      );
    } else if (meta.status === 'NEEDS_REVIEW') {
      return (
        <span
          title={`Vyžaduje kontrolu (jistota: ${Math.round(meta.confidence * 100)}%)`}
          onClick={() => meta.sourceText && setActiveSourceSnippet({ fieldName, sourceText: meta.sourceText, confidence: meta.confidence })}
          className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold cursor-pointer hover:bg-amber-200"
        >
          <AlertCircle className="w-3 h-3 text-amber-600" /> Kontrola
        </span>
      );
    } else {
      return (
        <span title="Nenalezeno v dokumentu" className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
          <HelpCircle className="w-3 h-3 text-slate-400" /> Nenalezeno
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Centrální import rozsudku (Fáze 1)</h3>
              <p className="text-xs text-slate-500">
                AI analýza s ověřenou jistotou, traceability zdrojového textu a ochranou proti halucinacím
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!extractedData ? (
          <form onSubmit={handleParseJudgment} className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 space-y-1">
                <p className="font-bold">Bezpečný import soudního dokumentu:</p>
                <p>Podporuje PDF, Word (DOCX přes parser), TXT a skeny (OCR Vision). Každé pole obsahuje traceability, míru jistoty a status ověření.</p>
              </div>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition-all bg-slate-50">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.png,.jpg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="case-judgment-file"
              />
              <label htmlFor="case-judgment-file" className="cursor-pointer flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {file ? file.name : 'Klikněte pro nahrání souboru (PDF, DOCX, TXT, sken)'}
                </div>
                <div className="text-2xs text-slate-500">Ochrana ClamAV antivirem a kontrola formátu</div>
              </label>
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nebo vložte text výrokové části rozsudku / dohody
              </label>
              <textarea
                rows={5}
                value={judgmentText}
                onChange={(e) => setJudgmentText(e.target.value)}
                placeholder="např. 'Rozsudek Okresního spisu č. j. 12 P 45/2023...'"
                className="w-full p-4 rounded-2xl border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={isParsing || (!file && !judgmentText.trim())}
                className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                {isParsing ? 'Bezpečná AI analýza...' : 'Analyzovat a ověřit data'}
              </button>
            </div>
          </form>
        ) : (
          /* Review Parsed Data Screen */
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Nalezeno (VERIFIED)</span>
                <strong className="text-lg font-black text-emerald-900">✅ {totalFound} údajů</strong>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Ke kontrole (REVIEW)</span>
                <strong className="text-lg font-black text-amber-900">⚠️ {needsReviewCount} údajů</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Nenalezeno (NOT_FOUND)</span>
                <strong className="text-lg font-black text-slate-700">❌ {notFoundCount} údajů</strong>
              </div>
            </div>

            <div className="text-2xs text-slate-500 flex items-center justify-between px-1">
              <span>Metoda: <strong className="text-slate-700">{extractedData.extractionMethod}</strong></span>
              <span>ID dokumentu: <strong className="text-slate-700">{extractedData.sourceDocumentId}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Spisová značka & soud */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Spisová značka & soud</span>
                  <div className="flex gap-1">
                    {getStatusBadge('caseNumber')}
                    {getStatusBadge('court')}
                  </div>
                </div>
                <input
                  type="text"
                  value={extractedData.caseNumber || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, caseNumber: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 font-bold"
                  placeholder="Spisová značka"
                />
                <input
                  type="text"
                  value={extractedData.court || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, court: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600"
                  placeholder="Soud"
                />
              </div>

              {/* Dítě & datum narození */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Dítě & datum narození</span>
                  <div className="flex gap-1">
                    {getStatusBadge('childName')}
                    {getStatusBadge('childBirthDate')}
                  </div>
                </div>
                <input
                  type="text"
                  value={extractedData.childName || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, childName: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 font-bold"
                  placeholder="Jméno dítěte"
                />
                <input
                  type="date"
                  value={extractedData.childBirthDate || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, childBirthDate: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600"
                />
              </div>

              {/* Režim péče & Rozvrh */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Režim péče & Rozvrh</span>
                  <div className="flex gap-1">
                    {getStatusBadge('custodyType')}
                    {getStatusBadge('scheduleType')}
                  </div>
                </div>
                <select
                  value={extractedData.custodyType || 'SHARED'}
                  onChange={(e) => setExtractedData({ ...extractedData, custodyType: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 font-bold"
                >
                  <option value="SHARED">Střídavá péče</option>
                  <option value="SOLE_FATHER">Péče otce</option>
                  <option value="SOLE_MOTHER">Péče matky</option>
                  <option value="CUSTOM">Vlastní režim</option>
                </select>
                <input
                  type="text"
                  value={extractedData.scheduleType || 'EVEN_ODD_WEEKS'}
                  onChange={(e) => setExtractedData({ ...extractedData, scheduleType: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600"
                  placeholder="Rozvrh (např. 7/7)"
                />
              </div>

              {/* Výživné */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Výživné (Kč / měsíc)</span>
                  <div className="flex gap-1">
                    {getStatusBadge('alimonyAmount')}
                  </div>
                </div>
                <input
                  type="number"
                  value={extractedData.alimonyAmount || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, alimonyAmount: Number(e.target.value) })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 font-bold text-emerald-700"
                />
                <input
                  type="text"
                  value={extractedData.alimonyPaymentMethod || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, alimonyPaymentMethod: e.target.value })}
                  className="w-full bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600 text-2xs"
                  placeholder="Způsob placení"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pravidla pro prázdniny a svátky</span>
                {getStatusBadge('holidaysRule')}
              </div>
              <textarea
                rows={2}
                value={extractedData.holidaysRule || ''}
                onChange={(e) => setExtractedData({ ...extractedData, holidaysRule: e.target.value })}
                className="w-full bg-white p-2 rounded border border-slate-300 text-xs"
              />
            </div>

            {/* Traceability snippet modal / popup box */}
            {activeSourceSnippet && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1">
                <div className="flex items-center justify-between text-blue-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-700" /> Traceability zdrojového textu ({activeSourceSnippet.fieldName})
                  </span>
                  <button onClick={() => setActiveSourceSnippet(null)} className="text-blue-500 hover:text-blue-700 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-slate-700 italic bg-white p-2 rounded border border-blue-100">
                  „{activeSourceSnippet.sourceText || 'Zdrojový výňatek nebyl v textu explicitně označen.'}“
                </p>
                <div className="text-3xs text-blue-600 font-medium">Odhadovaná jistota AI: {Math.round(activeSourceSnippet.confidence * 100)}%</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Zpět k nahrání
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmImport}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Ukládám data...' : 'Potvrdit extrahovaná data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

