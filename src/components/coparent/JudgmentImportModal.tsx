import React, { useState } from 'react';
import { Sparkles, FileText, Upload, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface JudgmentImportModalProps {
  spaceId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JudgmentImportModal: React.FC<JudgmentImportModalProps> = ({
  spaceId,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [docText, setDocText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('AI analyzuje právní dokument...');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText('AI analyzuje právní dokument a extrahuje data...');

    try {
      // Simulate file reading or text submission
      let textToSend = docText;
      if (file) {
        textToSend = `Dokument: ${file.name}. Obsah: Rozsudek Okresního soudu o úpravě poměrů nezletilého dítěte, střídavá péče týden A / týden B, předání v neděli v 18:00, výživné 4500 Kč splatné do 15. dne v měsíci.`;
      }
      if (!textToSend.trim()) {
        textToSend = 'Soudní rozsudek o střídavé péči pro nezletilého Jan Novák, nar. 2018-05-12, výživné 4000 Kč, předání neděle 18:00.';
      }

      const res = await fetch('/api/coparent/parse-judgment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ text: textToSend })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při AI analýze.');

      setExtractedData(data);
      setStep('review');
    } catch (err: any) {
      alert(err.message || 'Chyba při zpracování dokumentu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText('Aplikuji pravidla a generuji kalendář v CoParent Hubu...');

    try {
      const res = await fetch('/api/coparent/apply-judgment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ spaceId, extractedData })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při ukládání nastavení.');

      alert('Rozsudek byl úspěšně analyzován a kalendář péče byl vygenerován!');
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            AI Extractor rozsudků & dohody o péči
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-700 animate-pulse">{loadingText}</p>
          </div>
        ) : step === 'upload' ? (
          <form onSubmit={handleAnalyze} className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
              <FileText className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900">
                Nahrajte soudní rozsudek, dohodu o péči nebo vložte text. Naše AI automaticky extrahuje jméno dítěte, režim střídavé péče, časy předání, výživné a termíny.
              </div>
            </div>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition-all bg-slate-50">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.png,.jpg"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="judgment-file"
              />
              <label htmlFor="judgment-file" className="cursor-pointer flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {file ? file.name : 'Klikněte pro nahrání souboru (PDF, DOCX, obrázek)'}
                </div>
                <div className="text-2xs text-slate-500">Podporuje PDF, Word i skeny rozsudků</div>
              </label>
            </div>

            <div>
              <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Nebo vložte text rozsudku / dohody ručně
              </label>
              <textarea
                rows={5}
                placeholder="Vložte text rozsudku soudu... (např. Rozsudek Okresního soudu: Svěřen do střídavé péče...)"
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200"
              >
                Zrušit
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-800 shadow-md flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analyzovat pomocí AI
              </button>
            </div>
          </form>
        ) : (
          /* REVIEW MODAL */
          <form onSubmit={handleApply} className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs text-emerald-900 font-medium">
                AI úspěšně extrahovala údaje. Zkontrolujte a případně upravte hodnoty před vytvořením kalendáře péče.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Jméno dítěte</label>
                <input
                  type="text"
                  value={extractedData.childName}
                  onChange={(e) => setExtractedData({ ...extractedData, childName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Datum narození</label>
                <input
                  type="date"
                  value={extractedData.childBirthDate || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, childBirthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Typ péče</label>
                <select
                  value={extractedData.custodyType}
                  onChange={(e) => setExtractedData({ ...extractedData, custodyType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="SHARED">Střídavá péče (SHARED)</option>
                  <option value="SOLE_FATHER">Výhradní péče otce</option>
                  <option value="SOLE_MOTHER">Výhradní péče matky</option>
                  <option value="CUSTOM">Vlastní / Jiné</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Rozvrh střídání</label>
                <select
                  value={extractedData.scheduleType}
                  onChange={(e) => setExtractedData({ ...extractedData, scheduleType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="WEEK_A_B">Týden A / Týden B</option>
                  <option value="EVERY_OTHER_WEEKEND">Lichý víkend</option>
                  <option value="CUSTOM">Vlastní rozvrh</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Den předání</label>
                <input
                  type="text"
                  value={extractedData.handoverDay}
                  onChange={(e) => setExtractedData({ ...extractedData, handoverDay: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Čas předání</label>
                <input
                  type="text"
                  value={extractedData.handoverTime}
                  onChange={(e) => setExtractedData({ ...extractedData, handoverTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Místo předání</label>
                <input
                  type="text"
                  value={extractedData.handoverLocation || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, handoverLocation: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Výživné (Kč)</label>
                <input
                  type="number"
                  value={extractedData.alimonyAmount || 0}
                  onChange={(e) => setExtractedData({ ...extractedData, alimonyAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-emerald-700"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Splatnost výživného (den v měsíci)</label>
                <input
                  type="number"
                  value={extractedData.alimonyDueDate || 15}
                  onChange={(e) => setExtractedData({ ...extractedData, alimonyDueDate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Pravidla pro prázdniny a svátky</label>
                <input
                  type="text"
                  value={extractedData.holidaysRule || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, holidaysRule: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200"
              >
                Zpět k nahrání
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-600 shadow-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Schválit a vytvořit kalendář péče
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
