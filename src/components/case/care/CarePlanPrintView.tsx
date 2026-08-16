import React from 'react';
import { CarePlan, CareMetrics, CareDay, CaseChild, ClientCase } from '../../../types';
import { Printer, Scale, Calendar, Moon, Clock, Car, MapPin, AlertCircle } from 'lucide-react';

interface CarePlanPrintViewProps {
  plan: CarePlan;
  clientCase: ClientCase;
  metrics?: CareMetrics;
  days?: CareDay[];
}

export const CarePlanPrintView: React.FC<CarePlanPrintViewProps> = ({
  plan,
  clientCase,
  metrics,
  days = [],
}) => {
  const pA = plan.parentAName || 'Otec';
  const pB = plan.parentBName || 'Matka';

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <div>
          <h3 className="text-sm font-black text-slate-900">Formát pro tisk a export do PDF</h3>
          <p className="text-xs text-slate-500">
            Kompletní strukturovaný přehled plánu péče připravený pro jednání nebo založení do spisu
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4" />
          Vytisknout / Uložit jako PDF
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-300 shadow-md space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Táta má právo • Synthesis OS
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-1">
              ORGANIZAČNÍ PLÁN PÉČE O DÍTĚ
            </h1>
            <p className="text-xs text-slate-600">
              Varianta: <strong>{plan.title}</strong> (Režim: {plan.rotationPattern || 'Vlastní'})
            </p>
          </div>

          <div className="text-right text-xs text-slate-600 space-y-0.5">
            <div>Spis: <strong>{clientCase.title}</strong></div>
            {clientCase.caseNumber && <div>Spisová značka: <strong>{clientCase.caseNumber}</strong></div>}
            <div>Vygenerováno: {new Date().toLocaleDateString('cs-CZ')}</div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-700 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-slate-900">
            <Scale className="w-4 h-4 text-slate-800" />
            <span>Právní a metodické upozornění</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Tento dokument slouží jako organizační a plánovací pomůcka pro rodiče a zúčastněné strany. Nepředstavuje právní posouzení ani doporučení konkrétního režimu péče ve smyslu zákona o advokacii.
          </p>
        </div>

        {/* Parties & Children */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
              Rodič A (Otec)
            </div>
            <div className="font-bold text-slate-900 text-sm">{pA}</div>
            <div className="text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{plan.parentAAddress || 'Adresa nezadána'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
              Rodič B (Matka)
            </div>
            <div className="font-bold text-slate-900 text-sm">{pB}</div>
            <div className="text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{plan.parentBAddress || 'Adresa nezadána'}</span>
            </div>
          </div>
        </div>

        {/* Children in Plan */}
        {clientCase.children && clientCase.children.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Děti zahrnuté v plánu péče
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {clientCase.children.map((child) => (
                <div key={child.id} className="p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">{child.firstName} {child.lastName}</div>
                  <div className="text-slate-500 text-[11px]">
                    Narozen(a): {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('cs-CZ') : '–'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Summary Table */}
        {metrics && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Souhrnné časové a logistické metriky
            </h3>
            <table className="w-full text-xs border border-slate-300 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2.5 text-left">Metrika</th>
                  <th className="p-2.5 text-center">Rodič A ({pA})</th>
                  <th className="p-2.5 text-center">Rodič B ({pB})</th>
                  <th className="p-2.5 text-center">Celkem / Poznámka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-bold">Podíl nocí v cyklu</td>
                  <td className="p-2.5 text-center font-bold text-blue-900">{metrics.nightsA} ({metrics.nightsPercentA} %)</td>
                  <td className="p-2.5 text-center font-bold text-purple-900">{metrics.nightsB} ({metrics.nightsPercentB} %)</td>
                  <td className="p-2.5 text-center">{metrics.totalNights} nocí</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Frekvence předávání</td>
                  <td colSpan={2} className="p-2.5 text-center font-bold">{metrics.handoversPerWeek} × za týden</td>
                  <td className="p-2.5 text-center">{metrics.totalHandovers} předání v cyklu</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold">Maximální odloučení</td>
                  <td className="p-2.5 text-center">{metrics.maxSeparationDaysA} dní od otce</td>
                  <td className="p-2.5 text-center">{metrics.maxSeparationDaysB} dní od matky</td>
                  <td className="p-2.5 text-center">Nepřerušený pobyt</td>
                </tr>
                {metrics.totalDistanceKm > 0 && (
                  <tr>
                    <td className="p-2.5 font-bold">Cestovní kilometry</td>
                    <td colSpan={2} className="p-2.5 text-center font-bold">{metrics.totalDistanceKm} km za cyklus</td>
                    <td className="p-2.5 text-center">cca {metrics.totalTravelMinutes} min</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Days Table */}
        {days.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Denní rozpis cyklu péče
            </h3>
            <table className="w-full text-[11px] border border-slate-300 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 text-left">Den</th>
                  <th className="p-2 text-left">Datum</th>
                  <th className="p-2 text-left">Péče / Přespání</th>
                  <th className="p-2 text-left">Předání</th>
                  <th className="p-2 text-left">Poznámka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {days.slice(0, 28).map((d, idx) => {
                  const isA = d.assignedParent === 'PARENT_A';
                  return (
                    <tr key={idx} className={isA ? 'bg-blue-50/30' : 'bg-purple-50/30'}>
                      <td className="p-2 font-bold">{idx + 1}. den</td>
                      <td className="p-2">{new Date(d.date).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })}</td>
                      <td className="p-2 font-bold">{isA ? pA : pB}</td>
                      <td className="p-2">
                        {d.isHandover ? `Ano v ${d.handoverTime || '16:00'}` : '–'}
                      </td>
                      <td className="p-2 text-slate-500">{d.notes || d.holidayName || '–'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures Area */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-12 text-xs">
          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1 font-bold">
              Podpis / Vyjádření Rodiče A ({pA}):
            </div>
            <div className="text-[10px] text-slate-400">Datum: ........................................</div>
          </div>

          <div className="space-y-8">
            <div className="border-b border-slate-400 pb-1 font-bold">
              Podpis / Vyjádření Rodiče B ({pB}):
            </div>
            <div className="text-[10px] text-slate-400">Datum: ........................................</div>
          </div>
        </div>
      </div>
    </div>
  );
};
