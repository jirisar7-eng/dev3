import React from 'react';
import { SeoHead } from '../../SeoHead';
import {
  ArrowLeft,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronRight,
  ShieldAlert,
  Flame,
  Clock,
  Heart,
  Globe,
  MessageSquare,
  FileText,
  FileCheck,
  Calendar,
  Gavel,
  Scale,
  Building2,
  BookOpen
} from 'lucide-react';
import { MementoCase } from '../../../../types';
import { MEMENTO_THEMES } from './mementoTypes';

interface MementoCaseDetailViewProps {
  caseData: MementoCase;
  allCases: MementoCase[];
  onNavigate: (path: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Flame,
  Clock,
  Heart,
  Globe,
  MessageSquare,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Gavel,
  FileCheck,
  Calendar,
  Scale,
  Building2
};

export const MementoCaseDetailView: React.FC<MementoCaseDetailViewProps> = ({
  caseData,
  allCases,
  onNavigate,
}) => {
  const IconComp = ICON_MAP[caseData.icon] || AlertTriangle;

  // Find matching theme
  const parentTheme = Object.values(MEMENTO_THEMES).find((t) => t.caseIds.includes(caseData.id)) || MEMENTO_THEMES['komunikace'];

  // Other cases in the same theme
  const otherThemeCases = allCases.filter((c) => parentTheme.caseIds.includes(c.id) && c.id !== caseData.id);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20 print:p-0 print:space-y-6">
      <SeoHead
        title={`${caseData.seoTitle || caseData.title} • Memento otců`}
        description={caseData.seoDescription || caseData.error}
        canonicalPath={`/memento/chyba/${caseData.slug}`}
      />

      {/* Breadcrumbs & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 print:hidden">
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => onNavigate('/memento')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
              id="memento-case-breadcrumb-root"
            >
              Memento otců
            </button>
            <span>/</span>
            <button
              onClick={() => onNavigate(`/memento/${parentTheme.slug}`)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
              id="memento-case-breadcrumb-parent"
            >
              {parentTheme.title}
            </button>
            <span>/</span>
            <span className="text-slate-900 line-clamp-1 max-w-[200px]">
              Chyba #{caseData.order}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(`/memento/${parentTheme.slug}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Zpět na {parentTheme.title}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-300"
              id="memento-case-print"
            >
              <Printer className="w-4 h-4" />
              <span>Vytisknout / PDF</span>
            </button>
          </div>
        </div>

        {/* Main Detail Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs print:border-none print:p-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Procesní chyba #{caseData.order}
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Téma: {parentTheme.title}
              </span>
            </div>

            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
              <IconComp className="w-5 h-5" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {caseData.title}
          </h1>

          {/* ❌ Chyba */}
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
            <strong className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              ❌ Popis chybného chování pod tlakem:
            </strong>
            <p className="text-sm text-rose-900 leading-relaxed font-medium">
              {caseData.error}
            </p>
          </div>

          {/* ⚠️ Riziko */}
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
            <strong className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              ⚠️ Procesní riziko u soudu a OSPOD:
            </strong>
            <p className="text-sm text-amber-950 leading-relaxed font-medium">
              {caseData.consequence}
            </p>
          </div>

          {/* 🔎 Co je důležité rozlišit */}
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-2">
            <strong className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              🔎 Co je klíčové v této situaci rozlišit:
            </strong>
            <p className="text-xs sm:text-sm text-indigo-900 leading-relaxed">
              Při řešení této situace je nutné oddělit vaše osobní pocity a frustraci od toho, jak bude vaše jednání vnímáno nezávislým orgánem (soudcem, pracovnicí OSPOD či znalcem). Každé vyjádření zanechává písemnou stopu, která vás může buď poškodit, nebo podpořit vaš střízlivý postoj.
            </p>
          </div>

          {/* ✅ Správný postup */}
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <strong className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ✅ Doporučený věcný postup a strategie:
            </strong>
            <p className="text-sm text-emerald-950 font-bold leading-relaxed">
              {caseData.correctAction}
            </p>
          </div>

          {/* 📝 Praktický vzor Bad vs Good */}
          {(caseData.exampleBad || caseData.exampleGood) && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                📝 Porovnání nevhodné vs. věcné reakce:
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                {caseData.exampleBad && (
                  <div className="p-5 rounded-2xl bg-slate-900 text-rose-300 border border-slate-800 space-y-1">
                    <span className="font-sans font-bold text-rose-400 block mb-1">❌ NEVHODNÁ EMOTIVNÍ REAKCE:</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{caseData.exampleBad}</p>
                  </div>
                )}

                {caseData.exampleGood && (
                  <div className="p-5 rounded-2xl bg-slate-900 text-emerald-300 border border-slate-800 space-y-1">
                    <span className="font-sans font-bold text-emerald-400 block mb-1">✅ VĚCNÁ DEESKALAČNÍ REAKCE (BIFF):</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{caseData.exampleGood}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Další chyby v rámci stejného tématu */}
      {otherThemeCases.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Další chyby v tématu «{parentTheme.title}»
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {otherThemeCases.map((other) => (
                <div
                  key={other.id}
                  onClick={() => onNavigate(`/memento/chyba/${other.slug}`)}
                  className="p-4 rounded-2xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-600 block mb-1">Chyba #{other.order}</span>
                    <strong className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 block line-clamp-2">
                      {other.title}
                    </strong>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 mt-2 flex items-center gap-1">
                    Zobrazit detail <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigace zpět na Memento a Krizovou pomoc */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200">
          <button
            onClick={() => onNavigate('/memento')}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ← Zpět na hlavní přehled Mementa
          </button>

          <button
            onClick={() => onNavigate('/krizova-pomoc')}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            Krizový rozcestník →
          </button>
        </div>
      </div>
    </div>
  );
};
