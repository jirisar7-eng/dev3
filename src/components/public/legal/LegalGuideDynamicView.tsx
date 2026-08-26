import { apiFetch } from '../../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import {
  Scale,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Clock,
  Tag
} from 'lucide-react';
import { SeoHead } from '../SeoHead';
import { LegalGuide } from '../../../types';

interface LegalGuideDynamicViewProps {
  slug: string;
  fallbackComponent?: React.ReactNode;
  onNavigate?: (path: string) => void;
}

export const LegalGuideDynamicView: React.FC<LegalGuideDynamicViewProps> = ({
  slug,
  fallbackComponent,
  onNavigate
}) => {
  const [guide, setGuide] = useState<LegalGuide | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    apiFetch(`/api/cms/legal-guides/${slug}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data: LegalGuide | null) => {
        if (isMounted) {
          if (data && data.status !== 'DRAFT') {
            setGuide(data);
          } else {
            setGuide(null);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn(`[LegalGuideDynamicView] Nepodařilo se načíst průvodce '${slug}':`, err);
        if (isMounted) {
          setGuide(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Load saved checklist state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tata_guide_check_${slug}`);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (e) {}
  }, [slug]);

  const toggleCheck = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    try {
      localStorage.setItem(`tata_guide_check_${slug}`, JSON.stringify(next));
    } catch (e) {}
  };

  const handlePrint = () => {
    window.print();
  };

  // If loading or no dynamic guide found and fallback exists, render fallback
  if (!guide && !loading && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  if (loading && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  if (!guide && !loading && !fallbackComponent) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Právní průvodce nebyl nalezen</h2>
        <p className="text-sm text-slate-600">Požadovaný průvodce zatím není k dispozici nebo byl přesunut.</p>
        {onNavigate && (
          <button
            onClick={() => onNavigate('/agenda')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět na přehled agendy</span>
          </button>
        )}
      </div>
    );
  }

  if (!guide) return null;

  return (
    <div className="space-y-8 pt-4 pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      <SeoHead
        title={`${guide.title} • Právní průvodce Táta má právo`}
        description={guide.seoDescription || guide.excerpt || 'Komplexní praktický právní průvodce pro otce v opatrovnických řízeních.'}
        canonicalPath={`/${guide.slug}`}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{guide.categoryLabel || guide.category || 'Právní průvodce'}</span>
            </div>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Tisk průvodce</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {guide.title}
          </h1>

          {guide.excerpt && (
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              {guide.excerpt}
            </p>
          )}

          {guide.badgeText && (
            <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${guide.badgeBg || 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
              {guide.badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Legal disclaimer */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Právní upozornění & metodický rámec</p>
          <p>
            {guide.disclaimer ||
              'Obsah slouží výhradně k obecné právní orientaci a nenahrazuje individuální právní poradenství advokáta zapsaného u ČAK. Všechny postupy doporučujeme konzultovat s odborníkem podle konkrétních okolností vašeho případu.'}
          </p>
        </div>
      </div>

      {/* Chapters list */}
      {guide.chapters && guide.chapters.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Klíčové kapitoly & Postup</span>
          </h2>
          <div className="space-y-6">
            {guide.chapters
              .sort((a, b) => a.order - b.order)
              .map((chap, idx) => (
                <div
                  key={chap.id || idx}
                  className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-100 shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{chap.title}</h3>
                  </div>

                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line prose prose-slate max-w-none">
                    {chap.content}
                  </div>

                  {chap.checklistItems && chap.checklistItems.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-4 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Důležité body:</h4>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {chap.checklistItems.map((kp, kIdx) => (
                          <li key={kIdx} className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{kp.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Interactive checklist */}
      {guide.checklist && guide.checklist.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Praktický kontrolní seznam (Checklist)</h3>
                <p className="text-xs text-slate-500">Označte si kroky a dokumenty, které již máte připravené.</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {guide.checklist.filter((i) => checkedItems[i.id]).length} / {guide.checklist.length} hotovo
            </span>
          </div>

          <div className="space-y-2.5">
            {guide.checklist.map((item) => {
              const isDone = !!checkedItems[item.id];
              return (
                <label
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-start gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all select-none ${
                    isDone
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="space-y-0.5 flex-1">
                    <span className={`text-xs sm:text-sm font-semibold block ${isDone ? 'line-through text-slate-500' : ''}`}>
                      {item.label}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ Accordion */}
      {guide.faqs && guide.faqs.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>Často kladené otázky k tématu</span>
          </h3>

          <div className="space-y-3 pt-2">
            {guide.faqs.map((faq, fIdx) => {
              const isOpen = openFaqIndex === fIdx;
              return (
                <div key={fIdx} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                    className="w-full px-4 py-3.5 text-left bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-slate-800 transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
