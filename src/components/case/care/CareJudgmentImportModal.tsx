import React, { useState } from 'react';
import { CarePlan, CaseChild } from '../../../types';
import {
  FileText,
  Sparkles,
  Scale,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
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
  const [judgmentText, setJudgmentText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<{
    title: string;
    pattern: string;
    handoverDay: number;
    handoverTime: string;
    handoverLocation: string;
    custodyType: string;
    summary: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParseJudgment = () => {
    if (!judgmentText.trim()) {
      setError('Vložte text výrokové části rozsudku nebo dohody o péči.');
      return;
    }

    setIsParsing(true);
    setError(null);

    // Heuristic analysis of Czech family court custody decree text
    setTimeout(() => {
      const lower = judgmentText.toLowerCase();
      let pattern = '7/7';
      let handoverDay = 1; // Monday
      let handoverTime = '16:00';
      let handoverLocation = 'Bydliště matky / škola';
      let custodyType = 'ALTERNATING';

      if (lower.includes('každý sudý týden') || lower.includes('každý lichý týden') || lower.includes('vždy od pátku do neděle') || lower.includes('běžný styk')) {
        pattern = 'EVERY_OTHER_WEEKEND';
        custodyType = 'ASYMMETRIC';
      } else if (lower.includes('2 dny') && lower.includes('3 dny')) {
        pattern = '2-2-3';
      } else if (lower.includes('čtvrtek') && lower.includes('pondělí')) {
        pattern = 'EXTENDED_WEEKEND';
        custodyType = 'ASYMMETRIC';
      }

      // Detect handover time
      const timeMatch = judgmentText.match(/(\d{1,2})[:.](\d{2})\s*hod/i) || judgmentText.match(/v\s*(\d{1,2})[:.]00/i);
      if (timeMatch) {
        const hour = timeMatch[1].padStart(2, '0');
        const min = timeMatch[2] || '00';
        handoverTime = `${hour}:${min}`;
      }

      // Detect handover day
      if (lower.includes('v pátek')) handoverDay = 5;
      else if (lower.includes('v neděli')) handoverDay = 0;
      else if (lower.includes('ve středu')) handoverDay = 3;
      else if (lower.includes('ve čtvrtek')) handoverDay = 4;

      setParsedData({
        title: `Plán péče dle rozsudku (${pattern})`,
        pattern,
        handoverDay,
        handoverTime,
        handoverLocation,
        custodyType,
        summary: `Z textu byl rozpoznán režim ${pattern} s předáváním v ${handoverTime} hod.`,
      });
      setIsParsing(false);
    }, 600);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    try {
      await onImportPlan({
        title: parsedData.title,
        type: parsedData.custodyType === 'ASYMMETRIC' ? 'ASYMMETRIC' : 'ALTERNATING',
        rotationPattern: parsedData.pattern,
        startDate: new Date().toISOString().split('T')[0],
        rotationIntervalDays: 28,
        defaultHandoverTime: parsedData.handoverTime,
        status: 'ACTIVE',
        childIds: childrenList.map((c) => c.id),
      } as any);
      onClose();
    } catch (err: any) {
      setError(`Chyba importu: ${err.message}`);
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
              <h3 className="text-base font-black text-slate-900">Import rozsudku nebo soudní dohody</h3>
              <p className="text-xs text-slate-500">
                Převedení textu výroku o péči do strukturovaného kalendáře a plánu
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

        {/* Text Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Vložte text výrokové části rozsudku nebo dohody:
          </label>
          <textarea
            rows={5}
            value={judgmentText}
            onChange={(e) => setJudgmentText(e.target.value)}
            placeholder="např. 'Soud schvaluje dohodu rodičů tak, že nezletilý se svěřuje do střídavé péče obou rodičů vždy v intervalu jednoho týdne, přičemž k předání dochází v pondělí v 16:00 hodin v místě bydliště matky...'"
            className="w-full p-4 rounded-2xl border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleParseJudgment}
              disabled={isParsing || !judgmentText.trim()}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              {isParsing ? 'Analyzuji text...' : 'Extrahovat parametry péče'}
            </button>
          </div>
        </div>

        {/* Parsed output preview */}
        {parsedData && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Nalezené parametry rozsudku</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Režim péče</span>
                <strong className="text-slate-900 font-black">{parsedData.pattern}</strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Čas předávání</span>
                <strong className="text-slate-900 font-black">{parsedData.handoverTime}</strong>
              </div>
              <div className="bg-white p-3 rounded-xl border border-emerald-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Typ péče</span>
                <strong className="text-slate-900 font-black">
                  {parsedData.custodyType === 'ALTERNATING' ? 'Střídavá' : 'Asymetrická'}
                </strong>
              </div>
            </div>

            <p className="text-[11px] text-emerald-900 font-medium">{parsedData.summary}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            Zrušit
          </button>
          <button
            type="button"
            disabled={!parsedData}
            onClick={handleConfirmImport}
            className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            Vytvořit a aktivovat plán péče
          </button>
        </div>
      </div>
    </div>
  );
};
