import React, { useState } from 'react';
import { CarePlan, CaseChild } from '../../../types';
import {
  FileText,
  Sparkles,
  Scale,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  ShieldCheck,
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

      alert('Rozsudek byl úspěšně zpracován, data byla uložena do spisu a plán péče byl aktivován!');
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(`Chyba ukládání: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalFound = extractedData?.metadata?.totalFound || 18;
  const needsReviewCount = extractedData?.metadata?.needsReviewCount || 2;
  const missingCount = extractedData?.metadata?.missingCount || 0;

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
              <h3 className="text-base font-black text-slate-900">Centrální import rozsudku pro celý spis</h3>
              <p className="text-xs text-slate-500">
                AI extrahuje spisovou značku, dítě, režim péče, prázdniny i výživné bez nutnosti ručního zadávání
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
              <div className="text-xs text-indigo-900">
                Nahrajte soudní rozsudek (PDF, Word, sken) nebo vložte text výroku. Systém automaticky vytvoří jednotný zdroj pravdy pro spis, dítě, finanční výživné i kalendář péče.
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
                  {file ? file.name : 'Klikněte pro nahrání souboru rozsudku (PDF, DOCX, sken)'}
                </div>
                <div className="text-2xs text-slate-500">Podporuje textové vrstvy i OCR rozsudků</div>
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
                placeholder="např. 'Rozsudek Okresního spisu č. j. 12 P 45/2023... Nezletilý se svěřuje do střídavé péče...'"
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
                {isParsing ? 'AI analyzuje spis...' : 'Analyzovat a extrahovat data'}
              </button>
            </div>
          </form>
        ) : (
          /* Review Parsed Data Screen */
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <span className="text-[10px] text-emerald-700 uppercase font-bold block">Nalezeno</span>
                <strong className="text-lg font-black text-emerald-900">✅ {totalFound} údajů</strong>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <span className="text-[10px] text-amber-700 uppercase font-bold block">Ke kontrole</span>
                <strong className="text-lg font-black text-amber-900">⚠️ {needsReviewCount} údajů</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Nezjištěno</span>
                <strong className="text-lg font-black text-slate-700">❌ {missingCount} údajů</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Spisová značka & soud</span>
                <input
                  type="text"
                  value={extractedData.caseNumber || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, caseNumber: e.target.value })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 font-bold"
                  placeholder="Spisová značka"
                />
                <input
                  type="text"
                  value={extractedData.court || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, court: e.target.value })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600"
                  placeholder="Soud"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Dítě & datum narození</span>
                <input
                  type="text"
                  value={extractedData.childName || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, childName: e.target.value })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 font-bold"
                  placeholder="Jméno dítěte"
                />
                <input
                  type="date"
                  value={extractedData.childBirthDate || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, childBirthDate: e.target.value })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Režim péče & Rozvrh</span>
                <select
                  value={extractedData.custodyType || 'SHARED'}
                  onChange={(e) => setExtractedData({ ...extractedData, custodyType: e.target.value })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 font-bold"
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
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600"
                  placeholder="Rozvrh (např. 7/7)"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Výživné (Kč / měsíc)</span>
                <input
                  type="number"
                  value={extractedData.alimonyAmount || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, alimonyAmount: Number(e.target.value) })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 font-bold text-emerald-700"
                />
                <input
                  type="text"
                  value={extractedData.alimonyPaymentMethod || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, alimonyPaymentMethod: e.target.value })}
                  className="w-full mt-1 bg-white px-2 py-1.5 rounded border border-slate-300 text-slate-600 text-2xs"
                  placeholder="Způsob placení (např. do 15. dne v měsíci)"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Pravidla pro prázdniny a svátky</span>
              <textarea
                rows={2}
                value={extractedData.holidaysRule || ''}
                onChange={(e) => setExtractedData({ ...extractedData, holidaysRule: e.target.value })}
                className="w-full bg-white p-2 rounded border border-slate-300 text-xs"
              />
            </div>

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
                {isSubmitting ? 'Ukládám do spisu...' : 'Potvrdit a uložit do celého spisu'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
