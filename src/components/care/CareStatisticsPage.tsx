import React from 'react';
import { ClientCase, CarePlan, CareMetrics } from '../../types';
import {
  BarChart3,
  ArrowLeft,
  Moon,
  Clock,
  Repeat,
  Car,
  Calendar,
  ShieldCheck,
  Users,
  Info,
} from 'lucide-react';
import { CareMetricsPanel } from '../case/care/CareMetricsPanel';

interface CareStatisticsPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  metrics: CareMetrics | null;
  onNavigate: (path: string) => void;
}

export const CareStatisticsPage: React.FC<CareStatisticsPageProps> = ({
  activeCase,
  activePlan,
  metrics,
  onNavigate,
}) => {
  const pA = activePlan?.parentAName || 'Otec';
  const pB = activePlan?.parentBName || 'Matka';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('/pece')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na přehled Péče o dítě</span>
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📊</span>
          <h1 className="text-2xl font-black text-slate-900">Statistiky a metriky péče</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailní matematický rozbor modelu: poměr celých nocí, čas v hodinách, stabilita bloků a logistika.
        </p>
      </div>

      {!activePlan || !metrics ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
          <BarChart3 className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Statistiky nejsou k dispozici</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pro zobrazení statistik vytvořte a aktivujte plán péče v hlavním přehledu.
          </p>
          <button
            onClick={() => onNavigate('/pece')}
            className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Přejít na hlavní přehled
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main metrics panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <CareMetricsPanel metrics={metrics} parentAName={pA} parentBName={pB} />
          </div>

          {/* Sibling & Additional Context Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" />
              Sourozenecká a věková analýza spisu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-slate-500 font-medium block">Děti ve spisu:</span>
                <div className="space-y-1">
                  {(activeCase.children || []).map((child) => (
                    <div key={child.id} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0">
                      <strong className="text-slate-900 font-bold">{child.firstName} {child.lastName}</strong>
                      <span className="text-slate-500">{child.birthDate ? `nar. ${new Date(child.birthDate).toLocaleDateString('cs-CZ')}` : 'Věk neuveden'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2 text-blue-950">
                <span className="font-bold block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  Kritérium nejlepšího zájmu dítěte (Ústavní soud):
                </span>
                <p className="text-[11px] leading-relaxed text-blue-900">
                  Střídavá či vyrovnaná péče je dle konstantní judikatury Ústavního soudu (např. sp. zn. I. ÚS 2482/13, I. ÚS 1506/13) prioritním modelem, pokud oba rodiče mají o dítě zájem a mají pro výchovu vhodné předpoklady.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
