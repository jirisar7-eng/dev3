import React, { useState, useEffect } from 'react';
import { CareMetrics, CaseChild, CarePlan } from '../../../types';
import {
  Layers,
  Scale,
  Sparkles,
  CheckCircle,
  Moon,
  Repeat,
  Car,
  Clock,
  HeartHandshake,
  AlertCircle,
  ArrowRight,
  Printer,
} from 'lucide-react';

interface ComparisonVariant {
  pattern: string;
  label: string;
  desc: string;
  metrics: CareMetrics;
  developmentalNote: string;
  pros: string[];
  neutralPoints: string[];
}

interface CareComparisonViewProps {
  variants?: ComparisonVariant[];
  caseId?: string;
  childrenList?: CaseChild[];
  parentAName?: string;
  parentBName?: string;
  parentAAddress?: string;
  parentBAddress?: string;
  onApplyVariant?: (pattern: string) => void;
  onSelectVariant?: (pattern: string) => void;
}

export const CareComparisonView: React.FC<CareComparisonViewProps> = ({
  variants: variantsProp,
  caseId,
  childrenList,
  parentAName = 'Otec',
  parentBName = 'Matka',
  parentAAddress = '',
  parentBAddress = '',
  onApplyVariant,
  onSelectVariant,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [variants, setVariants] = useState<ComparisonVariant[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>(['7/7', '2-2-3', '3-4-4-3']);

  const token = localStorage.getItem('tatovacesta_auth_token');
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;

  // Descriptions & notes for patterns
  const patternMeta: Record<string, { label: string; desc: string; developmentalNote: string; pros: string[]; neutral: string[] }> = {
    '7/7': {
      label: '7/7 (Týden / Týden)',
      desc: 'Klasický střídavý režim po celých týdnech.',
      developmentalNote: 'Vhodné od mladšího školního věku (cca 6+ let). U menších dětí může být týdenní odloučení dlouhé.',
      pros: ['Pouze 1 předání týdně', 'Vysoká stabilita v průběhu školního týdne', 'Menší nároky na logistiku'],
      neutral: ['Odloučení od druhého rodiče trvá 7 celých dní', 'Vyžaduje týdenní plánování kroužků u obou rodičů'],
    },
    '2-2-3': {
      label: '2-2-3 (2 dny / 2 dny / 3 dny)',
      desc: 'Rotující 14denní cyklus s častějším střídáním.',
      developmentalNote: 'Výborné pro předškolní děti (2–6 let) pro udržení pevné vazby s oběma rodiči bez dlouhého odloučení.',
      pros: ['Maximální odloučení pouze 3 dny', 'Pravidelný styk s oběma rodiči', 'Střídání celých víkendů'],
      neutral: ['Častější předávání (cca 2,5× týdně)', 'Vyžaduje precizní synchronizaci školních věcí a oblečení'],
    },
    '3-4-4-3': {
      label: '3-4-4-3 (Půltýdenní cyklus)',
      desc: 'Fixní dny v týdnu pro každého z rodičů.',
      developmentalNote: 'Vhodné pro děti i rodiče preferující pevný rozvrh týdenních aktivit (např. pondělí–středa u otce).',
      pros: ['Předvídatelný rozvrh kroužků v pracovní dny', 'Vyvážený podíl péče', 'Max. odloučení 4 dny'],
      neutral: ['Předávání probíhá dvakrát v týdnu', 'Střídání víkendů'],
    },
    '2-2-5-5': {
      label: '2-2-5-5 (Dva dny pevně + dlouhý víkend)',
      desc: 'Dva fixní dny v týdnu a střídání 5denních bloků o víkendech.',
      developmentalNote: 'Kombinuje výhody fixních všedních dnů s delším víkendovým blokem.',
      pros: ['Fixní všední dny', 'Delší víkendový prostor pro výlety a rodinu'],
      neutral: ['Vyžaduje 14denní plánování'],
    },
    'EVERY_OTHER_WEEKEND': {
      label: 'Každý 2. víkend (Asymetrický styk)',
      desc: 'Výlučná péče jednoho rodiče s víkendovým stykem druhého rodiče.',
      developmentalNote: 'Historický model, často aplikovaný při velké geografické vzdálenosti rodičů.',
      pros: ['Jedno stálé zázemí přes všední dny'],
      neutral: ['Výrazně asymetrický podíl na výchově a péči', 'Odloučení od druhého rodiče až 12 dní'],
    },
  };

  const loadComparison = async () => {
    if (variantsProp && variantsProp.length > 0) {
      setLoading(false);
      return;
    }
    
    if (!caseId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/care/compare`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          patterns: selectedPatterns,
          parentAAddress,
          parentBAddress,
        }),
      });

      if (!res.ok) throw new Error('Chyba při porovnání variant.');
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        const enriched: ComparisonVariant[] = result.data.map((item: any) => {
          const meta = patternMeta[item.pattern] || {
            label: item.pattern,
            desc: 'Vlastní model péče',
            developmentalNote: 'Individuální režim péče dle potřeb dítěte.',
            pros: ['Přizpůsobeno konkrétním podmínkám'],
            neutral: ['Doporučeno sledovat reakci dítěte'],
          };
          return {
            pattern: item.pattern,
            label: meta.label,
            desc: meta.desc,
            metrics: item.metrics,
            developmentalNote: meta.developmentalNote,
            pros: meta.pros,
            neutralPoints: meta.neutral,
          };
        });
        setVariants(enriched);
      }
    } catch (err: any) {
      console.warn('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (variantsProp && variantsProp.length > 0) {
      const enriched: ComparisonVariant[] = variantsProp.map((item: any) => {
        const meta = patternMeta[item.pattern] || {
          label: item.pattern,
          desc: 'Vlastní model péče',
          developmentalNote: 'Individuální režim péče dle potřeb dítěte.',
          pros: ['Přizpůsobeno konkrétním podmínkám'],
          neutral: ['Doporučeno sledovat reakci dítěte'],
        };
        return {
          pattern: item.pattern,
          label: meta.label,
          desc: meta.desc,
          metrics: item.metrics || item, 
          developmentalNote: meta.developmentalNote,
          pros: meta.pros,
          neutralPoints: meta.neutral,
        };
      });
      setVariants(enriched);
      setLoading(false);
    } else {
      loadComparison();
    }
  }, [selectedPatterns, parentAAddress, parentBAddress, variantsProp]);

  const togglePatternSelection = (pat: string) => {
    if (selectedPatterns.includes(pat)) {
      if (selectedPatterns.length <= 1) return; // Keep at least 1
      setSelectedPatterns(selectedPatterns.filter((p) => p !== pat));
    } else {
      if (selectedPatterns.length >= 4) return; // Max 4
      setSelectedPatterns([...selectedPatterns, pat]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Pattern selector chips */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-900" />
              Srovnání variant a modelů péče
            </h3>
            <p className="text-xs text-slate-500">
              Objektivní porovnání časových podílů, frekvence předávání a vývojových hledisek
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`/api/cases/${caseId}/care/compare`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                      patterns: selectedPatterns,
                      parentAAddress,
                      parentBAddress,
                      save: true,
                      title: `Srovnání modelů péče (${selectedPatterns.join(', ')})`,
                    }),
                  });
                  if (res.ok) {
                    alert('Srovnání modelů péče bylo úspěšně uloženo do spisu.');
                  } else {
                    const errData = await res.json();
                    alert(errData.error || 'Uložení srovnání selhalo.');
                  }
                } catch {
                  alert('Chyba při komunikaci se serverem.');
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <HeartHandshake className="w-4 h-4" />
              Uložit srovnání do spisu
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Tisk srovnání
            </button>
          </div>
        </div>

        {/* Pattern chips selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Vyberte 2 až 4 varianty ke srovnání:
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(patternMeta).map((patKey) => {
              const isSelected = selectedPatterns.includes(patKey);
              return (
                <button
                  key={patKey}
                  onClick={() => togglePatternSelection(patKey)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {patternMeta[patKey].label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Comparison Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          Načítám porovnávací metriky...
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(variants.length, 3)} gap-4`}>
          {variants.map((v) => {
            return (
              <div
                key={v.pattern}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Variant Title */}
                  <div className="border-b border-slate-100 pb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                      Model {v.pattern}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-2">{v.label}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{v.desc}</p>
                  </div>

                  {/* Night ratio bar */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-blue-900">{parentAName}: {v.metrics.nightsPercentA}%</span>
                      <span className="text-purple-900">{parentBName}: {v.metrics.nightsPercentB}%</span>
                    </div>
                    <div className="w-full h-3 bg-purple-200 rounded-full overflow-hidden flex">
                      <div className="bg-blue-600 h-full" style={{ width: `${v.metrics.nightsPercentA}%` }} />
                      <div className="bg-purple-600 h-full" style={{ width: `${v.metrics.nightsPercentB}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 text-center font-mono">
                      {v.metrics.nightsA} nocí / {v.metrics.nightsB} nocí (v 28denním cyklu)
                    </div>
                  </div>

                  {/* Key Metrics List */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Repeat className="w-3.5 h-3.5 text-amber-600" />
                        Předávání za týden
                      </span>
                      <strong className="text-slate-900">{v.metrics.handoversPerWeek} ×</strong>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        Max. odloučení od otce
                      </span>
                      <strong className="text-blue-900">{v.metrics.maxSeparationDaysA} dní</strong>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        Max. odloučení od matky
                      </span>
                      <strong className="text-purple-900">{v.metrics.maxSeparationDaysB} dní</strong>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        Průměrný blok péče
                      </span>
                      <strong className="text-slate-900">{v.metrics.avgBlockLengthDaysA} dní</strong>
                    </div>

                    {v.metrics.totalDistanceKm > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-emerald-600" />
                          Cestování za 4 týdny
                        </span>
                        <strong className="text-slate-900">{v.metrics.totalDistanceKm} km</strong>
                      </div>
                    )}
                  </div>

                  {/* Developmental Note */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Vývojové hledisko věku:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{v.developmentalNote}</p>
                  </div>

                  {/* Pros & Neutral Points */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div>
                      <div className="text-[11px] font-bold text-emerald-900 uppercase mb-1">
                        Výhody modelu:
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-600 list-disc list-inside">
                        {v.pros.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase mb-1">
                        K zvážení:
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-500 list-disc list-inside">
                        {v.neutralPoints.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Apply as Plan Action */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => onSelectVariant ? onSelectVariant(v.pattern) : onApplyVariant?.(v.pattern)}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <span>Vybrat a vytvořit plán</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legal and methodological disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-700">
          Upozornění k metodice srovnávání:
        </p>
        <p className="text-[11px] max-w-3xl mx-auto">
          Simulace slouží jako organizační a plánovací pomůcka pro rodiče. Nepředstavuje právní posouzení ani doporučení konkrétního režimu péče. Vždy zohledněte individuální zájem a vývojové potřeby konkrétního dítěte.
        </p>
      </div>
    </div>
  );
};
