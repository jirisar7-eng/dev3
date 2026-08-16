import React, { useState, useMemo } from 'react';
import { ClientCase, CarePlan, CareMetrics, CareDay } from '../../types';
import {
  Calendar,
  Sparkles,
  Layers,
  Scale,
  Palmtree,
  MapPin,
  BarChart3,
  History,
  Clock,
  Car,
  Repeat,
  HeartHandshake,
  ChevronRight,
  AlertCircle,
  Plus,
  Edit2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Users,
  Moon,
  Info,
} from 'lucide-react';
import { CarePlanFormModal } from './CarePlanFormModal';

interface CareMainDashboardProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  plans: CarePlan[];
  metrics: CareMetrics | null;
  days: CareDay[];
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

export const CareMainDashboard: React.FC<CareMainDashboardProps> = ({
  activeCase,
  activePlan,
  plans,
  metrics,
  days,
  onNavigate,
  onRefresh,
}) => {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEditingActivePlan, setIsEditingActivePlan] = useState(false);

  // Compute Next Upcoming Handover from activePlan.days
  const nextHandover = useMemo(() => {
    if (!days || days.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Find next day marked as handover starting today or future
    const upcoming = days.find((d) => d.isHandover && d.date >= todayStr) || days.find((d) => d.isHandover);
    if (!upcoming) return null;

    // Determine who hands over and who receives
    const assigned = upcoming.assignedParent;
    const handoverTime = upcoming.handoverTime || activePlan?.defaultHandoverTime || '16:00';
    const pA = activePlan?.parentAName || 'Otec (Rodič A)';
    const pB = activePlan?.parentBName || 'Matka (Rodič B)';

    const fromParent = assigned === 'PARENT_A' ? pB : pA;
    const toParent = assigned === 'PARENT_A' ? pA : pB;

    // Children names
    const childrenNames = (activeCase.children || []).map((c) => `${c.firstName} ${c.lastName}`.trim()).join(', ');

    return {
      date: upcoming.date,
      time: handoverTime,
      children: childrenNames || 'Děti ve spisu',
      fromParent,
      toParent,
      locationName: upcoming.handoverLocation?.name || activePlan?.parentAAddress || 'Domov / Dle dohody',
      locationAddress: upcoming.handoverLocation?.address || activePlan?.parentAAddress || 'Běžné předávací místo',
      notes: upcoming.notes,
    };
  }, [days, activePlan, activeCase]);

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const pA = activePlan?.parentAName || 'Otec';
  const pB = activePlan?.parentBName || 'Matka';

  const careTypeLabel = (type?: string) => {
    switch (type) {
      case 'SHARED':
        return 'Střídavá péče 50/50';
      case 'ALTERNATING':
        return 'Asymetrická střídavá péče';
      case 'SOLE_A':
        return `Výlučná péče (${pA})`;
      case 'SOLE_B':
        return `Výlučná péče (${pB})`;
      default:
        return 'Střídavá péče';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👨‍👧</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">PÉČE O DÍTĚ</h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Přehled vašeho aktuálního uspořádání péče o dítě.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsEditingActivePlan(false);
              setIsPlanModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Vytvořit Care Plan</span>
          </button>
        </div>
      </div>

      {/* 2. Empty State if No Active Plan */}
      {!activePlan ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Zatím nemáte aktivní plán péče.
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Vytvořte si Care Plan a sestavte rozvrh péče, předávání, prázdnin a dalších pravidel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsEditingActivePlan(false);
                setIsPlanModalOpen(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Vytvořit Care Plan</span>
            </button>
            <button
              onClick={() => onNavigate('/pece/simulator')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Vyzkoušet simulátor</span>
            </button>
          </div>
        </div>
      ) : (
        /* 3. Dashboard with Active Plan */
        <div className="space-y-8">
          {/* Top Row: Big Active Plan Card + Next Handover Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AKTIVNÍ CARE PLAN (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        AKTIVNÍ CARE PLAN
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                        {activePlan.rotationPattern || '7/7'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{activePlan.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsEditingActivePlan(true);
                        setIsPlanModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Upravit</span>
                    </button>
                    <button
                      onClick={() => onNavigate(`/pece/plany/${activePlan.id}`)}
                      className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Otevřít plán</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Key metadata grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1 text-xs">
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block text-[11px]">Období platnosti</span>
                    <strong className="text-slate-800 block mt-0.5 font-bold">
                      {formatDate(activePlan.startDate)} – {formatDate(activePlan.endDate)}
                    </strong>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block text-[11px]">Typ péče</span>
                    <strong className="text-slate-800 block mt-0.5 font-bold">
                      {careTypeLabel(activePlan.type)}
                    </strong>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block text-[11px]">Předávání za cyklus</span>
                    <strong className="text-slate-800 block mt-0.5 font-bold">
                      {metrics?.totalHandovers ?? days.filter((d) => d.isHandover).length} předání
                    </strong>
                  </div>

                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <span className="text-slate-500 font-medium block text-[11px]">Max. odloučení</span>
                    <strong className="text-slate-800 block mt-0.5 font-bold">
                      {metrics?.maxSeparationDaysA != null ? `${Math.max(metrics.maxSeparationDaysA, metrics.maxSeparationDaysB)} dní` : '7 dní'}
                    </strong>
                  </div>
                </div>

                {/* Children & Care Ratio preview */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Děti:{' '}
                      <span className="text-slate-900 font-semibold">
                        {(activeCase.children || []).map((c) => c.firstName).join(', ') || 'Všechny děti'}
                      </span>
                    </span>
                    <span className="text-slate-600 font-mono">
                      {metrics?.estimatedTimePercentA != null
                        ? `${pA}: ${metrics.estimatedTimePercentA}% / ${pB}: ${metrics.estimatedTimePercentB}%`
                        : `${pA}: 50% / ${pB}: 50%`}
                    </span>
                  </div>

                  {/* Ratio bar */}
                  <div className="w-full h-3 bg-purple-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{
                        width: `${metrics?.estimatedTimePercentA ?? metrics?.nightsPercentA ?? 50}%`,
                      }}
                    />
                    <div
                      className="bg-purple-600 h-full transition-all duration-300"
                      style={{
                        width: `${metrics?.estimatedTimePercentB ?? metrics?.nightsPercentB ?? 50}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Poslední úprava: {formatDate(activePlan.updatedAt || activePlan.createdAt)}</span>
                <span className="text-emerald-700 font-bold">Plán je aktivní a synchronizován</span>
              </div>
            </div>

            {/* NEJBLIŽŠÍ PŘEDÁNÍ (1 Col) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    NEJBLIŽŠÍ PŘEDÁNÍ
                  </h3>
                  {nextHandover && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-900">
                      {formatDate(nextHandover.date)}
                    </span>
                  )}
                </div>

                {nextHandover ? (
                  <div className="mt-4 space-y-3.5 text-xs">
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">Datum a čas:</span>
                        <strong className="text-blue-950 font-black text-sm">
                          {formatDate(nextHandover.date)} v {nextHandover.time}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Předává:</span>
                        <span className="font-bold text-slate-800">{nextHandover.fromParent}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Přebírá:</span>
                        <span className="font-bold text-emerald-800">{nextHandover.toParent}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-600">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <strong className="text-slate-800 block">{nextHandover.locationName}</strong>
                          <span className="text-slate-500 text-[11px]">{nextHandover.locationAddress}</span>
                        </div>
                      </div>
                    </div>

                    {nextHandover.children && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Děti: {nextHandover.children}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Žádné nadcházející předání.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Všechna předání v cyklu proběhla nebo nejsou v plánu.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => onNavigate('/pece/kalendar')}
                  className="w-full py-2 rounded-xl border border-slate-200 text-slate-700 hover:text-blue-900 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Zobrazit kalendář</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. RYCHLÝ PŘEHLED (Statistické karty ze skutečných API metrik) */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
              RYCHLÝ PŘEHLED METRIK
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Podíl péče */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">PODÍL PÉČE</span>
                  <Moon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.estimatedTimePercentA != null
                    ? `${metrics.estimatedTimePercentA}% : ${metrics.estimatedTimePercentB}%`
                    : `${metrics?.nightsPercentA ?? 50}% : ${metrics?.nightsPercentB ?? 50}%`}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {metrics?.timeEstimateCalculable
                    ? 'Přesně stanovený podíl času na základě předávání'
                    : 'Podíl celých nocí v zadaném cyklu'}
                </p>
              </div>

              {/* Card 2: Předání */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">PŘEDÁNÍ</span>
                  <Repeat className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.totalHandovers ?? days.filter((d) => d.isHandover).length} ×
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Celkem {metrics?.totalHandovers ?? days.filter((d) => d.isHandover).length} předání dítěte za
                  modelovaný cyklus ({days.length || 28} dní)
                </p>
              </div>

              {/* Card 3: Průměrný blok */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">PRŮMĚRNÝ BLOK</span>
                  <Calendar className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.avgBlockLengthDaysA != null
                    ? `${((metrics.avgBlockLengthDaysA + metrics.avgBlockLengthDaysB) / 2).toFixed(1)} dne`
                    : '3.5 dne'}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Průměrná nepřetržitá doba strávená u jednoho z rodičů
                </p>
              </div>

              {/* Card 4: Dojezd */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">DOJEZD</span>
                  <Car className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.totalDistanceKm != null && metrics.totalDistanceKm > 0
                    ? `${Math.round(metrics.totalDistanceKm)} km`
                    : '0 km'}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {metrics?.totalTravelMinutes != null && metrics.totalTravelMinutes > 0
                    ? `Cca ${Math.round(metrics.totalTravelMinutes)} minut na cestách celkem`
                    : 'Výchozí logistická zátěž předávání'}
                </p>
              </div>
            </div>
          </div>

          {/* 5. RYCHLÉ AKCE (7 dlaždic pro plný přístup ke Care Hubu) */}
          <div>
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
              RYCHLÉ AKCE & NÁSTROJE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Akce 1: Kalendář péče */}
              <button
                onClick={() => onNavigate('/pece/kalendar')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    📅 Kalendář péče
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Měsíční, týdenní a seznamový rozpis směn, předávání a prázdnin.
                  </p>
                </div>
              </button>

              {/* Akce 2: Simulovat péči */}
              <button
                onClick={() => onNavigate('/pece/simulator')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">
                    🧮 Simulovat péči
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Vyzkoušejte různé varianty nanečisto bez vlivu na aktivní plán.
                  </p>
                </div>
              </button>

              {/* Akce 3: Porovnat varianty */}
              <button
                onClick={() => onNavigate('/pece/porovnani')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Scale className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-900 transition-colors">
                    ⚖️ Porovnat varianty
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Srovnání 7/7, 2-2-3 a 3-4-4-3 s exportem pro opatrovnický soud.
                  </p>
                </div>
              </button>

              {/* Akce 4: Prázdniny a svátky */}
              <button
                onClick={() => onNavigate('/pece/prazdniny')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Palmtree className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-900 transition-colors">
                    🏖️ Prázdniny a svátky
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Pravidla pro Vánoce, Velikonoce, letní prázdniny a sudé/liché roky.
                  </p>
                </div>
              </button>

              {/* Akce 5: Místa předávání */}
              <button
                onClick={() => onNavigate('/pece/mista')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                    📍 Místa předávání
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Adresy domovů, školy, školky a výpočty dojezdových vzdáleností.
                  </p>
                </div>
              </button>

              {/* Akce 6: Statistiky */}
              <button
                onClick={() => onNavigate('/pece/statistiky')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-cyan-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-cyan-900 transition-colors">
                    📊 Statistiky
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Detailní analýza poměru péče, odloučení a logistické zátěže.
                  </p>
                </div>
              </button>

              {/* Akce 7: Historie změn */}
              <button
                onClick={() => onNavigate('/pece/historie')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-900/40 hover:shadow-md transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <History className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                    🕘 Historie změn
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Auditní záznam všech úprav plánu a synchronizací do kalendáře.
                  </p>
                </div>
              </button>

              {/* Akce 8: Jak se počítá */}
              <button
                onClick={() => onNavigate('/pece/jak-se-pocita')}
                className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 hover:border-blue-900/40 hover:bg-white transition-all text-left group flex flex-col justify-between space-y-3 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-blue-900 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900 transition-colors" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                    ℹ️ Jak se počítá
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Vysvětlení algoritmů, principu Noc != Čas a právního kontextu.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      {isPlanModalOpen && (
        <CarePlanFormModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          activeCase={activeCase}
          editingPlan={isEditingActivePlan ? activePlan : null}
          onSuccess={(savedPlan) => {
            onRefresh();
            if (!isEditingActivePlan) {
              onNavigate(`/pece/plany/${savedPlan.id}`);
            }
          }}
        />
      )}
    </div>
  );
};
