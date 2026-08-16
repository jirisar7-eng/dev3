import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Coins, Users, Building2, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
import { SeoHead } from './SeoHead';

interface StatItem {
  id: string;
  category: string;
  title: string;
  description?: string;
  value: string;
  unit?: string;
  period: string;
  source: string;
  chartData?: any;
}

const FALLBACK_STATISTICS: StatItem[] = [
  {
    id: 'stat-1',
    category: 'Péče o děti',
    title: 'Podíl střídavé péče schválené soudy',
    description: 'Procento dětí svěřených do střídavé péče obou rodičů po rozchodu rodičů v ČR.',
    value: '34 %',
    unit: '%',
    period: '2025/2026',
    source: 'Ministerstvo spravedlnosti ČR / ČSÚ 2025/2026',
  },
  {
    id: 'stat-2',
    category: 'Péče o děti',
    title: 'Péče jednoho rodiče (výhradní péče matky)',
    description: 'Podíl rozhodnutí, kde bylo dítě svěřeno do výhradní péče matky.',
    value: '58 %',
    unit: '%',
    period: '2025/2026',
    source: 'Ministerstvo spravedlnosti ČR / ČSÚ 2025/2026',
  },
  {
    id: 'stat-3',
    category: 'Délka řízení',
    title: 'Průměrná délka opatrovnického řízení u okresních soudů',
    description: 'Průměrný počet dnů od podání návrhu na úpravu poměrů do vydání prvostupňového rozsudku.',
    value: '215',
    unit: 'dní',
    period: '2025/2026',
    source: 'Ministerstvo spravedlnosti ČR - Statistická ročenka 2025/2026',
  },
  {
    id: 'stat-4',
    category: 'Délka řízení',
    title: 'Průměrná doba rozhodování o předběžném opatření (§ 452 ZVR)',
    description: 'Doba rozhodování soudů o akutních návrzích na předběžnou úpravu poměrů dítěte.',
    value: '7',
    unit: 'dní',
    period: '2025/2026',
    source: 'Ministerstvo spravedlnosti ČR 2025/2026',
  },
  {
    id: 'stat-5',
    category: 'Výživné',
    title: 'Průměrná stanovená výše výživného na jedno dítě',
    description: 'Průměrné měsíční výživné určované soudy ČR podle věkových kategorií.',
    value: '3 850',
    unit: 'Kč',
    period: '2025/2026',
    source: 'Český statistický úřad (ČSÚ) / MS ČR 2025/2026',
  },
  {
    id: 'stat-6',
    category: 'Výživné',
    title: 'Míra plnění vyživovací povinnosti a náhradní výživné',
    description: 'Procento povinných rodičů hradících stanovené výživné řádně a včas.',
    value: '84 %',
    unit: '%',
    period: '2025/2026',
    source: 'Úřad práce ČR / Ministerstvo práce a sociálních věcí 2025/2026',
  },
];

export const StateStatisticsView: React.FC = () => {
  const [stats, setStats] = useState<StatItem[]>(FALLBACK_STATISTICS);

  useEffect(() => {
    fetch('/api/state/statistics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.statistics) && data.statistics.length > 0) {
          setStats(data.statistics);
        }
      })
      .catch(() => {
        // Fallback already set
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <SeoHead
        title="Státní statistiky rodinného práva • ČSÚ & MS ČR • Táta má právo"
        description="Oficiální statistické ukazatele opatrovnických soudů, podílů střídavé péče, průměrných délek soudních řízení a výše výživného v ČR."
        canonicalPath="/state-statistics"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-10">
          <BarChart3 className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Oficiální data ČSÚ & Ministerstva spravedlnosti ČR</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Statistiky opatrovnické praxe v ČR
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Data o rozhodování českých okresních a krajských soudů v rodinných věcech. Podíly forem péče, průměrné délky trvání sporu, výše alimentů podle věku dítěte a objektivní ukazatele pro opatrovnická řízení.
          </p>
        </div>
      </div>

      {/* Section 1: Breakdown of Custody Forms in CR */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-black text-lg">
              <Users className="w-5 h-5 text-blue-700" />
              <h2>Formy péče o nezletilé děti v ČR</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Aktuální podíl soudních rozsudků o úpravě poměrů nezletilých dětí
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto border border-slate-200">
            Zdroj: Ministerstvo spravedlnosti ČR / ČSÚ 2025/2026
          </span>
        </div>

        {/* Visual Progress Bar Breakdown */}
        <div className="space-y-4">
          {/* Main Combined Bar */}
          <div className="h-6 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
            <div
              style={{ width: '58%' }}
              className="bg-purple-600 hover:bg-purple-700 transition-all text-white font-bold text-[10px] flex items-center justify-center px-1"
              title="Výhradní péče matky 58 %"
            >
              58 %
            </div>
            <div
              style={{ width: '34%' }}
              className="bg-blue-600 hover:bg-blue-700 transition-all text-white font-bold text-[10px] flex items-center justify-center px-1"
              title="Střídavá péče 34 %"
            >
              34 %
            </div>
            <div
              style={{ width: '7%' }}
              className="bg-emerald-600 hover:bg-emerald-700 transition-all text-white font-bold text-[10px] flex items-center justify-center px-1"
              title="Výhradní péče otce 7 %"
            >
              7 %
            </div>
            <div
              style={{ width: '1%' }}
              className="bg-amber-500 hover:bg-amber-600 transition-all text-white font-bold text-[10px] flex items-center justify-center px-1"
              title="Společná péče 1 %"
            >
              1 %
            </div>
          </div>

          {/* Cards for each Custody Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900">Výhradní péče matky</span>
                <span className="text-2xl font-black text-purple-700">58 %</span>
              </div>
              <div className="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: '58%' }}></div>
              </div>
              <p className="text-[11px] text-purple-900 leading-snug">
                Postupný pokles z původních 78 % před pěti lety ve prospěch střídavé péče.
              </p>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900">Střídavá péče</span>
                <span className="text-2xl font-black text-blue-700">34 %</span>
              </div>
              <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '34%' }}></div>
              </div>
              <p className="text-[11px] text-blue-900 leading-snug">
                Nejrychleji rostoucí forma péče po judikátní praxi Ústavního soudu.
              </p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Výhradní péče otce</span>
                <span className="text-2xl font-black text-emerald-700">7 %</span>
              </div>
              <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '7%' }}></div>
              </div>
              <p className="text-[11px] text-emerald-900 leading-snug">
                Schvalována nejčastěji při dlouhodobém nezájmu či nezpůsobilosti matky.
              </p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Společná péče</span>
                <span className="text-2xl font-black text-amber-700">1 %</span>
              </div>
              <div className="w-full bg-amber-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '1%' }}></div>
              </div>
              <p className="text-[11px] text-amber-900 leading-snug">
                Předpokládá naprostou dohodu bez nutnosti rozepisovat přesný kalendář.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Court Proceedings Duration & Interim Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Court Duration Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <Clock className="w-5 h-5 text-blue-700" />
              <h3>Průměrná délka řízení</h3>
            </div>
            <span className="text-2xl font-black text-blue-900">215 dní</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Průměrný počet dnů od podání opatrovnické žaloby do vydání nepravomocného rozsudku I. stupně u okresního soudu v ČR.
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Nenesporná dohoda rodičů:</span>
              <strong className="text-emerald-700 font-bold">45–60 dní</strong>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Spor se znaleckým posudkem:</span>
              <strong className="text-amber-700 font-bold">320–480 dní</strong>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Odvolací krajský soud:</span>
              <strong className="text-blue-900 font-bold">+120–180 dní</strong>
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-400">
            Zdroj: Ministerstvo spravedlnosti ČR / Statistická ročenka 2025/2026
          </div>
        </div>

        {/* Interim Measures Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3>Předběžná opatření (§ 452 ZVR)</h3>
            </div>
            <span className="text-2xl font-black text-emerald-700">7 dní</span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Zákonná lhůta, ve které musí opatrovnický soud rozhodnout o akutním návrhu na předběžnou úpravu poměrů dítěte při zamezení styku.
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>Zákonná rozhodovací lhůta:</span>
              <strong className="text-emerald-700 font-bold">7 dní</strong>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Vyhovění návrhům na předběžné opatření:</span>
              <strong className="text-blue-900 font-bold">42 %</strong>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>Rychlé odvolání k krajskému soudu:</span>
              <strong className="text-amber-700 font-bold">do 15 dní</strong>
            </div>
          </div>

          <div className="text-[11px] font-medium text-slate-400">
            Zdroj: Ministerstvo spravedlnosti ČR / ČSÚ 2025/2026
          </div>
        </div>
      </div>

      {/* Section 3: Average Maintenance / Maintenance Guidelines */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-black text-lg">
              <Coins className="w-5 h-5 text-amber-600" />
              <h2>Průměrná stanovená výše výživného v ČR podle věku dítěte</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Orientační průměry určované soudy ČR v souladu s Doporučující tabulkou výživného MPSV
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto border border-slate-200">
            Zdroj: Ministerstvo spravedlnosti ČR / ČSÚ 2025/2026
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">0 – 5 let</span>
            <div className="text-3xl font-black text-slate-900">2 800 Kč</div>
            <span className="text-[11px] text-slate-500 block">Doporučený podíl: 14 % čistého příjmu</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">6 – 11 let</span>
            <div className="text-3xl font-black text-slate-900">3 500 Kč</div>
            <span className="text-[11px] text-slate-500 block">Doporučený podíl: 16 % čistého příjmu</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">12 – 15 let</span>
            <div className="text-3xl font-black text-slate-900">4 200 Kč</div>
            <span className="text-[11px] text-slate-500 block">Doporučený podíl: 18 % čistého příjmu</span>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">16 – 26 let (studenti)</span>
            <div className="text-3xl font-black text-slate-900">4 900 Kč</div>
            <span className="text-[11px] text-slate-500 block">Doporučený podíl: 20 % čistého příjmu</span>
          </div>
        </div>

        <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-950 leading-relaxed">
            <strong>Poznámka k výživnému při střídavé péči:</strong> Při střídavé péči se výživné určuje oběma rodičům navzájem. Pokud mají rodiče srovnatelné příjmy a rozsah péče, může soud výživné určit v symbolické výši nebo ho nepředepsat vůbec.
          </p>
        </div>
      </div>

      {/* Dynamic API Statistics List */}
      {stats.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900">Kompletní přehled sledovaných státních indikátorů</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-50 text-blue-800 rounded">
                    {s.category}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">{s.period}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{s.title}</h4>
                <div className="text-2xl font-black text-blue-900">{s.value}</div>
                {s.description && <p className="text-xs text-slate-600">{s.description}</p>}
                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 mt-2">
                  {s.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
