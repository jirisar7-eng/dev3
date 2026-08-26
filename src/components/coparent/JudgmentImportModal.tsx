import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, Upload, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface JudgmentImportModalProps {
  spaceId?: string;
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

  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && step === 'upload') {
      const startTime = Date.now();
      setProgress(0);
      setSecondsElapsed(0);
      
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setSecondsElapsed(elapsed);
        
        setProgress(() => {
          // Linear progress up to 95% over 15 seconds
          const linear = ((now - startTime) / 15000) * 95;
          return Math.min(linear, 95);
        });
      }, 100);
    } else if (!loading) {
      setProgress(100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, step]);

  const getAnalyzingText = (seconds: number) => {
    if (seconds <= 3) return "📄 Načítání a čtení textové vrstvy z dokumentu...";
    if (seconds <= 8) return "🤖 Gemini AI analyzuje střídavou péči, časy a výživné...";
    return "✨ Extrahují se strukturovaná data a připravuje se formulář...";
  };

  if (!isOpen) return null;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setLoadingText('AI analyzuje právní dokument a extrahuje data...');

    try {
      const formData = new FormData();
      if (file) {
        formData.append('document', file);
      } else if (docText.trim()) {
        formData.append('text', docText.trim());
      } else {
        throw new Error('Musíte nahrát soubor nebo zadat text.');
      }

      const res = await apiFetch('/api/coparent/parse-judgment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Chyba při AI analýze.');

      setExtractedData(data);
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'Chyba při zpracování dokumentu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoadingText('Aplikuji pravidla a generuji kalendář v CoParent Hubu...');

    try {
      const activeSpaceId = spaceId || null;
      const formData = extractedData;

      const res = await apiFetch('/api/coparent/apply-judgment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({
          spaceId: activeSpaceId || null,
          extractedData: formData
        })
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
          <div className="py-16 flex flex-col items-center justify-center space-y-6">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            
            {step === 'upload' ? (
              <div className="w-full max-w-sm space-y-4 text-center">
                <p className="text-sm font-bold text-slate-800 animate-pulse">
                  {getAnalyzingText(secondsElapsed)}
                </p>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-100 ease-linear" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-slate-500 font-mono">
                  Čas analýzy: 00:{secondsElapsed.toString().padStart(2, '0')} / odhadem ~15 s
                </p>
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-700 animate-pulse">{loadingText}</p>
            )}
          </div>
        ) : step === 'upload' ? (
          <form onSubmit={handleAnalyze} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Nepodařilo se zpracovat dokument</div>
                  <div className="mt-0.5">{error}</div>
                </div>
              </div>
            )}
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
            {extractedData.aiEnrichmentFailed ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block">Lokální deterministické zpracování:</span>
                  <span>{extractedData.userNotice || 'Externí AI analýza nebyla dostupná. Dokument byl přečten lokálním deterministickým parserem. Zkontrolujte prosím extrahované údaje před vytvořením kalendáře péče.'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900 font-medium">
                  {extractedData.userNotice || 'Dokument byl úspěšně analyzován. Zkontrolujte a případně upravte hodnoty před vytvořením kalendáře péče.'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Jméno dítěte</label>
                <input
                  type="text"
                  value={extractedData.childName || ''}
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
                  value={extractedData.custodyType || 'SHARED'}
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
                  value={extractedData.scheduleType || 'WEEK_A_B'}
                  onChange={(e) => setExtractedData({ ...extractedData, scheduleType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                >
                  <option value="WEEK_A_B">Týden A / Týden B</option>
                  <option value="EVEN_ODD_WEEKS">Sudý / Lichý týden</option>
                  <option value="EVERY_OTHER_WEEKEND">Lichý víkend</option>
                  <option value="STANDARD">Standardní</option>
                  <option value="CUSTOM">Vlastní rozvrh</option>
                </select>
              </div>

              {extractedData.scheduleType === 'EVEN_ODD_WEEKS' ? (
                <>
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">📅 Sudý týden</label>
                      <input
                        type="text"
                        value={extractedData.evenWeek?.summary || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, evenWeek: { ...extractedData.evenWeek, summary: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        placeholder="Např. Po 8:45 - Út 15:30, Pá 8:45 - 15:30"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">📅 Lichý týden</label>
                      <input
                        type="text"
                        value={extractedData.oddWeek?.summary || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, oddWeek: { ...extractedData.oddWeek, summary: e.target.value } })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                        placeholder="Např. Po, St, Pá 8:45 - 15:30"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Čas od (HH:MM)</label>
                      <input
                        type="time"
                        value={extractedData.handoverStartTime || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, handoverStartTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Čas do (HH:MM)</label>
                      <input
                        type="time"
                        value={extractedData.handoverEndTime || ''}
                        onChange={(e) => setExtractedData({ ...extractedData, handoverEndTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Den předání</label>
                    <input
                      type="text"
                      value={extractedData.handoverDay || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, handoverDay: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-bold uppercase tracking-wider text-slate-500 mb-1">Čas předání (HH:MM)</label>
                    <input
                      type="time"
                      value={extractedData.handoverTime || ''}
                      onChange={(e) => setExtractedData({ ...extractedData, handoverTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </>
              )}

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
