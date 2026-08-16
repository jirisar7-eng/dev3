import React, { useState, useEffect } from 'react';
import { CareMetrics, CareDay, CaseChild, CarePlan } from '../../../types';
import {
  Sparkles,
  Calendar,
  Clock,
  Car,
  MapPin,
  CheckCircle,
  AlertCircle,
  Repeat,
  Layers,
  Save,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';

interface CareSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  childrenList: CaseChild[];
  onSavePlan: (newPlanData: Partial<CarePlan>) => Promise<void>;
  initialPattern?: string;
  defaultParentA?: string;
  defaultParentB?: string;
}

export const CareSimulatorModal: React.FC<CareSimulatorModalProps> = ({
  isOpen,
  onClose,
  caseId,
  childrenList,
  onSavePlan,
  initialPattern = '7/7',
  defaultParentA = 'Otec',
  defaultParentB = 'Matka',
}) => {
  const [title, setTitle] = useState<string>('Simulovaný plán péče – Střídavá péče 7/7');
  const [pattern, setPattern] = useState<string>(initialPattern);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cycleDays, setCycleDays] = useState<number>(28);
  const [startWithParent, setStartWithParent] = useState<string>('PARENT_A');
  const [handoverDay, setHandoverDay] = useState<number>(1); // Monday
  const [handoverTime, setHandoverTime] = useState<string>('16:00');
  const [handoverType, setHandoverType] = useState<string>('STANDARD');

  // Parents
  const [parentAName, setParentAName] = useState<string>(defaultParentA);
  const [parentBName, setParentBName] = useState<string>(defaultParentB);
  const [parentAAddress, setParentAAddress] = useState<string>('');
  const [parentBAddress, setParentBAddress] = useState<string>('');

  // Selected children
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
    childrenList.map((c) => c.id)
  );

  // Simulation output
  const [simulatedDays, setSimulatedDays] = useState<CareDay[]>([]);
  const [simulatedMetrics, setSimulatedMetrics] = useState<CareMetrics | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [geoTesting, setGeoTesting] = useState<boolean>(false);
  const [geoResult, setGeoResult] = useState<{ distanceKm: number; travelMinutes: number; routeType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('tatovacesta_auth_token');
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;

  // Patterns list
  const presetPatterns = [
    {
      key: '7/7',
      label: '7/7 (Týden / Týden)',
      desc: 'Klasické týdenní střídání, minimální počet předání (1× týdně). Vhodné pro školní děti.',
    },
    {
      key: '2-2-3',
      label: '2-2-3 (2 dny / 2 dny / 3 dny)',
      desc: 'Častější střídání s max. odloučením 3 dny. Vhodné pro batolata a předškoláky.',
    },
    {
      key: '3-4-4-3',
      label: '3-4-4-3 (Půltýdenní cyklus)',
      desc: 'Fixní dny v týdnu pro každého rodiče, střídání víkendů.',
    },
    {
      key: '2-2-5-5',
      label: '2-2-5-5 (Dva dny pevně + dlouhý víkend)',
      desc: 'Stabilní rozvrh pro školní režim.',
    },
    {
      key: 'EVERY_OTHER_WEEKEND',
      label: 'Každý 2. víkend (Běžný styk)',
      desc: 'Jeden rodič má péči přes týden, druhý o rozšířený/běžný víkend.',
    },
    {
      key: 'EXTENDED_WEEKEND',
      label: 'Rozšířený víkend (Čt-Po)',
      desc: 'Péče druhého rodiče od čtvrtečního odpoledne do pondělního rána každé 2 týdny.',
    },
  ];

  // Run live simulation whenever core params change
  useEffect(() => {
    if (!isOpen) return;
    runSimulation();
  }, [pattern, startDate, cycleDays, startWithParent, handoverDay, handoverTime, parentAAddress, parentBAddress]);

  const runSimulation = async () => {
    setIsSimulating(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/care/simulate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          pattern,
          startDate,
          cycleDays,
          startWithParent,
          handoverDay,
          handoverTime,
          parentAAddress,
          parentBAddress,
        }),
      });

      if (!res.ok) {
        throw new Error('Chyba při výpočtu simulace');
      }

      const result = await res.json();
      if (result.success && result.data) {
        setSimulatedDays(result.data.days || []);
        setSimulatedMetrics(result.data.metrics || null);
      }
    } catch (err: any) {
      console.warn('Simulace error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleTestRoute = async () => {
    if (!parentAAddress.trim() || !parentBAddress.trim()) {
      setError('Zadejte obě adresy pro výpočet trasy.');
      return;
    }
    setGeoTesting(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/care/route`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          origin: parentAAddress,
          destination: parentBAddress,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeoResult(data.data);
      } else {
        throw new Error(data.error || 'Výpočet trasy selhal.');
      }
    } catch (err: any) {
      setError(`Chyba trasy: ${err.message}`);
    } finally {
      setGeoTesting(false);
    }
  };

  const handleSave = async (status: 'DRAFT' | 'ACTIVE' | 'PROPOSED') => {
    if (!title.trim()) {
      setError('Vyplňte název plánu péče.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSavePlan({
        title,
        type: pattern.includes('WEEKEND') ? 'ASYMMETRIC' : 'ALTERNATING',
        rotationPattern: pattern,
        startDate: startDate,
        rotationIntervalDays: cycleDays,
        status,
        parentAName,
        parentBName,
        parentAAddress,
        parentBAddress,
        defaultHandoverTime: handoverTime,
        childIds: selectedChildIds,
        days: simulatedDays,
        metrics: simulatedMetrics || undefined,
        metricsJson: simulatedMetrics ? JSON.stringify(simulatedMetrics) : undefined,
      } as any);
      onClose();
    } catch (err: any) {
      setError(`Chyba při ukládání plánu: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Simulátor péče o dítě</h3>
              <p className="text-xs text-slate-500">
                Modelování modelů střídavé péče, výpočet podílů, předávání a vzdáleností
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

        {/* Plan Title & Preset Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Název varianty plánu *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Výběr modelu / rotačního vzorce:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {presetPatterns.map((p) => (
                <div
                  key={p.key}
                  onClick={() => {
                    setPattern(p.key);
                    setTitle(`Plán péče – Režim ${p.key}`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    pattern === p.key
                      ? 'border-blue-900 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-slate-900">{p.label}</div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-tight">{p.desc}</p>
                  </div>
                  {pattern === p.key && (
                    <span className="mt-2 text-[10px] font-black text-blue-900 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-blue-600" /> Vybráno
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Children in this plan */}
        {childrenList.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Děti zahrnuté do tohoto harmonogramu:
            </label>
            <div className="flex flex-wrap gap-2">
              {childrenList.map((child) => {
                const isSelected = selectedChildIds.includes(child.id);
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedChildIds(selectedChildIds.filter((id) => id !== child.id));
                      } else {
                        setSelectedChildIds([...selectedChildIds, child.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600'
                    }`}
                  >
                    {child.firstName} {child.lastName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Schedule & Handover Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Datum zahájení cyklu:
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Délka simulace:
            </label>
            <select
              value={cycleDays}
              onChange={(e) => setCycleDays(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            >
              <option value={14}>14 dní (2 týdny)</option>
              <option value={28}>28 dní (4 týdny)</option>
              <option value={56}>56 dní (8 týdnů)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              První týden zahajuje:
            </label>
            <select
              value={startWithParent}
              onChange={(e) => setStartWithParent(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            >
              <option value="PARENT_A">Rodič A ({parentAName})</option>
              <option value="PARENT_B">Rodič B ({parentBName})</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Výchozí čas předání:
            </label>
            <input
              type="time"
              value={handoverTime}
              onChange={(e) => setHandoverTime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
            />
          </div>
        </div>

        {/* Addresses & Distance Logistics */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-900" />
              Adresy bydliště & Cestovní vzdálenost
            </h4>
            <button
              type="button"
              onClick={handleTestRoute}
              disabled={geoTesting || !parentAAddress || !parentBAddress}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              {geoTesting ? 'Počítám trasu...' : 'Ověřit vzdálenost trasy'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Bydliště Rodiče A ({parentAName}):
              </label>
              <input
                type="text"
                value={parentAAddress}
                onChange={(e) => setParentAAddress(e.target.value)}
                placeholder="např. Vinohradská 120, Praha 3"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Bydliště Rodiče B ({parentBName}):
              </label>
              <input
                type="text"
                value={parentBAddress}
                onChange={(e) => setParentBAddress(e.target.value)}
                placeholder="např. Nádražní 45, Beroun"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
          </div>

          {geoResult && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Car className="w-4 h-4 text-emerald-700" />
                <span>Trasa mezi bydlišti: {geoResult.distanceKm} km (cca {geoResult.travelMinutes} min)</span>
              </div>
              <span className="text-[10px] text-emerald-800 font-mono">
                {geoResult.routeType === 'OSRM_ROUTING' ? 'Skutečná trasa silniční sítě' : 'Ortodromický odhad (Haversine)'}
              </span>
            </div>
          )}
        </div>

        {/* Live Simulation Preview */}
        {simulatedMetrics && (
          <div className="p-5 rounded-2xl bg-blue-900/5 border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-900" />
                Výsledek simulace ({cycleDays} dní)
              </h4>
              {isSimulating && <RefreshCw className="w-4 h-4 animate-spin text-blue-900" />}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <div className="text-xs text-slate-500 font-bold">Podíl nocí A/B</div>
                <div className="text-base font-black text-blue-900">
                  {simulatedMetrics.nightsPercentA}% / {simulatedMetrics.nightsPercentB}%
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {simulatedMetrics.nightsA} : {simulatedMetrics.nightsB} nocí
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <div className="text-xs text-slate-500 font-bold">Předávání za týden</div>
                <div className="text-base font-black text-slate-900">
                  {simulatedMetrics.handoversPerWeek} ×
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  celkem {simulatedMetrics.totalHandovers} předání
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <div className="text-xs text-slate-500 font-bold">Max. odloučení</div>
                <div className="text-base font-black text-slate-900">
                  {simulatedMetrics.maxSeparationDaysA} d / {simulatedMetrics.maxSeparationDaysB} d
                </div>
                <div className="text-[10px] text-slate-400">od otce / od matky</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-100">
                <div className="text-xs text-slate-500 font-bold">Víkendy A / B</div>
                <div className="text-base font-black text-slate-900">
                  {simulatedMetrics.weekendDaysA} d / {simulatedMetrics.weekendDaysB} d
                </div>
                <div className="text-[10px] text-slate-400">soboty a neděle</div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 italic text-center sm:text-left">
            * Simulace slouží jako plánovací pomůcka. Nenahrazuje soudní rozhodnutí.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Zavřít
            </button>
            <button
              type="button"
              onClick={() => handleSave('DRAFT')}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-200 cursor-pointer"
            >
              Uložit koncept
            </button>
            <button
              type="button"
              onClick={() => handleSave('ACTIVE')}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Ukládám...' : 'Nastavit jako aktivní plán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
