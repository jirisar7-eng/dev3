import React from 'react';
import { CareMetrics, CarePlan } from '../../../types';
import {
  Calendar,
  Moon,
  Clock,
  Car,
  Repeat,
  Layers,
  HeartHandshake,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface CareMetricsPanelProps {
  metrics?: CareMetrics;
  plan?: CarePlan;
  parentAName?: string;
  parentBName?: string;
}

export const CareMetricsPanel: React.FC<CareMetricsPanelProps> = ({
  metrics,
  plan,
  parentAName = 'Otec (Rodič A)',
  parentBName = 'Matka (Rodič B)',
}) => {
  if (!metrics) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs">
        Metriky péče nejsou k dispozici.
      </div>
    );
  }

  const pA = plan?.parentAName || parentAName;
  const pB = plan?.parentBName || parentBName;

  return (
    <div className="space-y-6">
      {/* Top 3 Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Night Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-600" />
              Podíl nocí ({metrics.totalNights} nocí)
            </span>
            <span className="text-xs font-mono font-bold text-indigo-900">
              {metrics.nightsA} : {metrics.nightsB}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-blue-900">{pA}: {metrics.nightsPercentA}%</span>
              <span className="text-purple-900">{pB}: {metrics.nightsPercentB}%</span>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full h-3 bg-purple-200 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${metrics.nightsPercentA}%` }}
                title={`${pA}: ${metrics.nightsPercentA}%`}
              />
              <div
                className="bg-purple-600 h-full transition-all duration-300"
                style={{ width: `${metrics.nightsPercentB}%` }}
                title={`${pB}: ${metrics.nightsPercentB}%`}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Počet celých přenocování u každého z rodičů v modelovaném cyklu.
          </p>
        </div>

        {/* 2. Estimated Time Share (Principle 15: Noc != Čas) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              Odhadovaný podíl času
            </span>
            {metrics.timeEstimateCalculable ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Stanoveno
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                Informativní
              </span>
            )}
          </div>

          {metrics.timeEstimateCalculable ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-900">{pA}: {metrics.estimatedTimePercentA}%</span>
                <span className="text-purple-900">{pB}: {metrics.estimatedTimePercentB}%</span>
              </div>
              <div className="w-full h-3 bg-purple-200 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full"
                  style={{ width: `${metrics.estimatedTimePercentA}%` }}
                />
                <div
                  className="bg-purple-600 h-full"
                  style={{ width: `${metrics.estimatedTimePercentB}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">{metrics.timeEstimateNote}</p>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Noc ≠ Čas</span>
              </div>
              <p>Podíl času nelze přesně určit z dostupných údajů bez zadání přesných časů předávání.</p>
            </div>
          )}
        </div>

        {/* 3. Handover Dynamics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-amber-600" />
              Dynamika předávání
            </span>
            <span className="text-xs font-bold text-slate-800">
              {metrics.handoversPerWeek} × / týdně
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-base font-black text-slate-900">{metrics.totalHandovers}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Celkem předání</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <div className="text-base font-black text-slate-900">{metrics.schoolHandoversCount}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Přes školu</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Předávání přes školu snižuje přímý kontakt mezi rodiči v konfliktních situacích.
          </p>
        </div>
      </div>

      {/* Secondary Detailed Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Logistics & Travel Distance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Car className="w-4 h-4 text-slate-600" />
            <span>Cestovní logistika</span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {metrics.totalDistanceKm > 0 ? `${metrics.totalDistanceKm} km` : 'Nezadáno'}
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.totalTravelMinutes > 0
              ? `Odhadovaný čas na cestách: ${metrics.totalTravelMinutes} min`
              : 'Zadejte adresy rodičů pro výpočet kilometrů a času na cestách.'}
          </p>
        </div>

        {/* Max Separation Period */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Layers className="w-4 h-4 text-slate-600" />
            <span>Max. odloučení</span>
          </div>
          <div className="text-sm font-bold text-slate-900 space-y-0.5">
            <div>Od otce: <strong className="text-blue-900">{metrics.maxSeparationDaysA} dní</strong></div>
            <div>Od matky: <strong className="text-purple-900">{metrics.maxSeparationDaysB} dní</strong></div>
          </div>
          <p className="text-[11px] text-slate-500">
            Nejdelší nepřerušený interval, po který je dítě u druhého rodiče.
          </p>
        </div>

        {/* Average Care Block Length */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Calendar className="w-4 h-4 text-slate-600" />
            <span>Průměrný blok péče</span>
          </div>
          <div className="text-sm font-bold text-slate-900 space-y-0.5">
            <div>{pA}: <strong>{metrics.avgBlockLengthDaysA} d</strong> (max {metrics.maxBlockLengthDaysA} d)</div>
            <div>{pB}: <strong>{metrics.avgBlockLengthDaysB} d</strong> (max {metrics.maxBlockLengthDaysB} d)</div>
          </div>
          <p className="text-[11px] text-slate-500">
            Průměrná délka jednoho nepřetržitého pobytu u daného rodiče.
          </p>
        </div>

        {/* Weekend Distribution */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <HeartHandshake className="w-4 h-4 text-slate-600" />
            <span>Víkendové dny</span>
          </div>
          <div className="text-sm font-bold text-slate-900 space-y-0.5">
            <div className="text-blue-900">{pA}: <strong>{metrics.weekendDaysA} dnů</strong></div>
            <div className="text-purple-900">{pB}: <strong>{metrics.weekendDaysB} dnů</strong></div>
          </div>
          <p className="text-[11px] text-slate-500">
            Rozdělení sobot a nedělí pro volnočasové a rodinné aktivity.
          </p>
        </div>
      </div>
    </div>
  );
};
