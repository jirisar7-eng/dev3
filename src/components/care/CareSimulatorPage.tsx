import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan, CareMetrics } from '../../types';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Repeat,
  Car,
  AlertTriangle,
  Check,
  Scale,
  ShieldCheck,
  Info,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

interface CareSimulatorPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

export const CareSimulatorPage: React.FC<CareSimulatorPageProps> = ({
  activeCase,
  activePlan,
  onNavigate,
  onRefresh,
}) => {
  const [rotationPattern, setRotationPattern] = useState<string>('7/7');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [startParent, setStartParent] = useState<string>('PARENT_A');
  const [handoverTime, setHandoverTime] = useState<string>('16:00');
  const [selectedChildId, setSelectedChildId] = useState<string>(
    activeCase.children && activeCase.children.length > 0 ? activeCase.children[0].id : ''
  );
  const [includeHolidays, setIncludeHolidays] = useState<boolean>(true);
  const [parentAName, setParentAName] = useState<string>('Otec');
  const [parentBName, setParentBName] = useState<string>('Matka');

  const [loading, setLoading] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Run simulation
  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/simulate`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          rotationPattern,
          startDate,
          endDate,
          startParent,
          defaultHandoverTime: handoverTime,
          parentAName,
          parentBName,
          childId: selectedChildId || undefined,
          includeHolidays,
        }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Simulace se nezdařila.');
      }

      const data = await res.json();
      if (data.success && data.data) {
        setSimResult(data.data);
      }
    } catch (err: any) {
      console.error('Chyba simulace:', err);
      setError(err.message || 'Chyba simulace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [rotationPattern, startDate, endDate, startParent, handoverTime, selectedChildId, includeHolidays]);

  // Save simulation as new Care Plan
  const handleSaveAsPlan = async () => {
    if (!simResult) return;
    setSavingPlan(true);
    setSaveSuccess(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const newPlanTitle = `Plán péče (${rotationPattern}) – ${new Date().toLocaleDateString('cs-CZ')}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: newPlanTitle,
          rotationPattern,
          careType: 'SHARED',
          startDate,
          endDate,
          startParent,
          defaultHandoverTime: handoverTime,
          parentAName,
          parentBName,
          childIds: selectedChildId ? [selectedChildId] : (activeCase.children || []).map((c) => c.id),
        }),
      });

      if (!res.ok) {
        if (res.status === 503) throw new Error('Databázový server je momentálně nedostupný.');
        throw new Error('Nepodařilo se vytvořit plán.');
      }

      const data = await res.json();
      setSaveSuccess('Plán péče byl úspěšně vytvořen a uložen.');
      onRefresh();
      setTimeout(() => {
        if (data.data?.id) {
          onNavigate(`/pece/plany/${data.data.id}`);
        }
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Chyba při ukládání plánu.');
    } finally {
      setSavingPlan(false);
    }
  };

  const metrics: CareMetrics | undefined = simResult?.metrics;

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
          <span className="text-2xl">🧮</span>
          <h1 className="text-2xl font-black text-slate-900">Simulátor péče o dítě</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Otestujte různé modely rozvrhu a zjistěte jejich dopad na podíl péče, logistiku a odloučení.
        </p>
      </div>

      {/* Prominent Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs font-bold">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-sm font-black block">⚠️ Simulace nemění aktivní Care Plan.</span>
          <span className="font-normal text-amber-800">
            Veškeré změny v tomto simulátoru jsou pouze orientační výpočty nanečisto. Váš aktivní plán ani kalendář nebudou nijak dotčeny, pokud sami nekliknete na tlačítko "Uložit jako nový plán".
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess} Přesměrovávám na detail plánu...</span>
        </div>
      )}

      {/* Main Grid: Parameters on Left, Real-time Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-900" />
            Parametry simulace
          </h2>

          {/* Model selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rotační model
            </label>
            <select
              value={rotationPattern}
              onChange={(e) => setRotationPattern(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-blue-900 outline-hidden bg-white text-slate-800"
            >
              <option value="7/7">7/7 (Týden / Týden – klasická střídavá péče)</option>
              <option value="2-2-3">2-2-3 (2 dny / 2 dny / 3 dny – předškolní děti)</option>
              <option value="3-4-4-3">3-4-4-3 (Půltýdenní režim)</option>
              <option value="2-2-5-5">2-2-5-5 (Fixní dny v týdnu + dlouhý víkend)</option>
              <option value="ALTERNATING_WEEKENDS">Každý 2. víkend (Asymetrický model)</option>
              <option value="EXTENDED_WEEKENDS">Rozšířené víkendy (Čtvrtek – Pondělí)</option>
            </select>
          </div>

          {/* Dítě */}
          {activeCase.children && activeCase.children.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Dítě pro výpočet věkových doporučení
              </label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden bg-white text-slate-800"
              >
                {activeCase.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.firstName} {child.lastName} {child.dateOfBirth ? `(nar. ${new Date(child.dateOfBirth).getFullYear()})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Období */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Začátek
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Konec
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden"
              />
            </div>
          </div>

          {/* Počáteční rodič & Čas předání */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Začínající rodič
              </label>
              <select
                value={startParent}
                onChange={(e) => setStartParent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-hidden"
              >
                <option value="PARENT_A">{parentAName} (A)</option>
                <option value="PARENT_B">{parentBName} (B)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Čas předání
              </label>
              <input
                type="time"
                value={handoverTime}
                onChange={(e) => setHandoverTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden"
              />
            </div>
          </div>

          {/* Prázdniny toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHolidays}
                onChange={(e) => setIncludeHolidays(e.target.checked)}
                className="rounded-md border-slate-300 text-blue-900 focus:ring-blue-900 w-4 h-4"
              />
              <span>Zahrnout standardní prázdninové rotace</span>
            </label>
          </div>
        </div>

        {/* Right: Simulation Outputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Počítám metriky simulace...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Podíl péče */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">PODÍL PÉČE (% ČASU)</span>
                  <div className="text-3xl font-black text-slate-900">
                    {metrics?.estimatedTimePercentA != null
                      ? `${metrics.estimatedTimePercentA}% : ${metrics.estimatedTimePercentB}%`
                      : `${metrics?.nightsPercentA ?? 50}% : ${metrics?.nightsPercentB ?? 50}%`}
                  </div>
                  <div className="w-full h-2.5 bg-purple-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${metrics?.estimatedTimePercentA ?? metrics?.nightsPercentA ?? 50}%` }}
                    />
                    <div
                      className="bg-purple-600 h-full"
                      style={{ width: `${metrics?.estimatedTimePercentB ?? metrics?.nightsPercentB ?? 50}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 pt-1">
                    <span>{parentAName}: {metrics?.nightsA != null ? `${metrics.nightsA} nocí` : '—'}</span>
                    <span>{parentBName}: {metrics?.nightsB != null ? `${metrics.nightsB} nocí` : '—'}</span>
                  </div>
                </div>

                {/* Počet předání */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">POČET PŘEDÁNÍ</span>
                  <div className="text-3xl font-black text-slate-900">
                    {metrics?.totalHandovers ?? 0} ×
                  </div>
                  <p className="text-xs text-slate-500">
                    Frekvence: cca {metrics?.handoversPerWeek ? (metrics.handoversPerWeek * 4.33).toFixed(1) : 4} předání měsíčně
                  </p>
                </div>

                {/* Průměrný blok */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">PRŮMĚRNÝ BLOK</span>
                  <div className="text-3xl font-black text-slate-900">
                    {metrics?.avgBlockLengthDaysA != null ? `${((metrics.avgBlockLengthDaysA + metrics.avgBlockLengthDaysB) / 2).toFixed(1)} dne` : '3.5 dne'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Nepřetržitý čas u jednoho rodiče před změnou
                  </p>
                </div>

                {/* Maximální odloučení */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">MAX. ODLOUČENÍ</span>
                  <div className="text-3xl font-black text-slate-900">
                    {metrics?.maxSeparationDaysA != null ? `${Math.max(metrics.maxSeparationDaysA, metrics.maxSeparationDaysB)} dní` : '7 dní'}
                  </div>
                  <p className="text-xs text-slate-500">
                    Doporučení pro nízký věk: do 3–4 dnů
                  </p>
                </div>
              </div>

              {/* Age Bracket Recommendation */}
              {simResult?.ageRecommendation && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-3xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-950 font-black text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-900" />
                    <span>Vývojové posouzení modelu pro věk dítěte</span>
                  </div>
                  <p className="text-xs text-blue-900 font-medium leading-relaxed">
                    {simResult.ageRecommendation.text ||
                      `Tento rotační model (${rotationPattern}) má maximální odloučení ${metrics?.maxSeparationDaysA ?? 7} dní. Pro vybrané dítě poskytuje vyrovnanou stabilitu a kontakt s oběma rodiči.`}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleSaveAsPlan}
                    disabled={savingPlan}
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{savingPlan ? 'Ukládám plán...' : 'Uložit jako nový plán'}</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/pece/porovnani')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Scale className="w-4 h-4 text-purple-600" />
                    <span>Porovnat s dalšími modely</span>
                  </button>
                </div>

                <button
                  onClick={() => onNavigate('/pece')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Zpět na přehled
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
