import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan, CareMetrics, CareDay, ChildAgeDetail } from '../../../types';
import {
  Sparkles,
  Calendar,
  Layers,
  Scale,
  Palmtree,
  Users,
  Printer,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Car,
  ChevronRight,
  ShieldCheck,
  Send,
  Trash2,
} from 'lucide-react';

import { CareMetricsPanel } from './CareMetricsPanel';
import { CareCalendarView } from './CareCalendarView';
import { CareSimulatorModal } from './CareSimulatorModal';
import { CareComparisonView } from './CareComparisonView';
import { CareHolidaysTab } from './CareHolidaysTab';
import { CareSiblingAnalysis } from './CareSiblingAnalysis';
import { CarePlanPrintView } from './CarePlanPrintView';
import { CareJudgmentImportModal } from './CareJudgmentImportModal';

export type CareSubTab =
  | 'overview_calendar'
  | 'simulator'
  | 'comparison'
  | 'holidays'
  | 'siblings'
  | 'print_export';

export interface ChildAgeInfo {
  childId: string;
  name: string;
  dateOfBirth?: string;
  age: {
    years: number;
    months: number;
    days: number;
    totalDays?: number;
    exactAgeString: string;
    developmentalBracket: string;
    isAdult: boolean;
  };
}

interface CareHubTabProps {
  activeCase: ClientCase;
  onRefreshCase?: () => void;
}

export const CareHubTab: React.FC<CareHubTabProps> = ({
  activeCase,
  onRefreshCase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CareSubTab>('overview_calendar');
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [activePlan, setActivePlan] = useState<CarePlan | null>(null);
  const [activeDays, setActiveDays] = useState<CareDay[]>([]);
  const [activeMetrics, setActiveMetrics] = useState<CareMetrics | null>(null);
  const [childrenAges, setChildrenAges] = useState<ChildAgeInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const extractMetrics = (plan: CarePlan | null | undefined): CareMetrics | null => {
    if (!plan) return null;
    if (plan.metrics && typeof plan.metrics === 'object') return plan.metrics;
    if (plan.metricsJson) {
      try {
        return typeof plan.metricsJson === 'string' ? JSON.parse(plan.metricsJson) : (plan.metricsJson as any);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState<boolean>(false);

  const token = localStorage.getItem('tatovacesta_auth_token');
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders['Authorization'] = `Bearer ${token}`;

  // Load Care Hub Data
  const loadCareData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care`, {
        headers: authHeaders,
      });

      if (!res.ok) {
        throw new Error(`Nepodařilo se načíst data péče (${res.status})`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        const { plans: loadedPlans, activePlan: loadedActivePlan, childrenAges: loadedAges } = result.data;
        setPlans(loadedPlans || []);
        setChildrenAges(loadedAges || []);

        if (loadedActivePlan) {
          setActivePlan(loadedActivePlan);
          setActiveDays(loadedActivePlan.days || []);
          setActiveMetrics(extractMetrics(loadedActivePlan));
        } else if (loadedPlans && loadedPlans.length > 0) {
          setActivePlan(loadedPlans[0]);
          setActiveDays(loadedPlans[0].days || []);
          setActiveMetrics(extractMetrics(loadedPlans[0]));
        } else {
          setActivePlan(null);
          setActiveDays([]);
          setActiveMetrics(null);
        }
      }
    } catch (err: any) {
      console.error('CareHub load error:', err);
      setError(err.message || 'Chyba serveru při načítání Care Hubu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCareData();
  }, [activeCase.id]);

  // Handle plan selection
  const handleSelectPlan = async (planId: string) => {
    const selected = plans.find((p) => p.id === planId);
    if (selected) {
      setActivePlan(selected);
      setActiveDays(selected.days || []);
      setActiveMetrics(extractMetrics(selected));
    }
  };

  // Handle creating new plan from Simulator or Import
  const handleSaveNewPlan = async (planData: Partial<CarePlan>) => {
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(planData),
      });

      if (!res.ok) {
        throw new Error('Chyba při ukládání plánu péče');
      }

      const result = await res.json();
      const created = result.success ? result.data : result;
      setSuccessMsg(`Plán péče '${created.title}' byl úspěšně vytvořen.`);
      await loadCareData();
      if (onRefreshCase) onRefreshCase();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle updating days sequence in active plan
  const handleUpdateDays = async (updatedDays: CareDay[]) => {
    if (!activePlan) return;
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${activePlan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ days: updatedDays }),
      });

      if (!res.ok) throw new Error('Chyba při aktualizaci dnů v plánu.');
      const result = await res.json();
      const updated = result.success ? result.data : result;
      setActivePlan(updated);
      setActiveDays(updated.days || []);
      setActiveMetrics(updated.metricsJson || null);
      setSuccessMsg('Změny v harmonogramu byly uloženy.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Sync plan to Case Calendar
  const handleSyncToCalendar = async () => {
    if (!activePlan) return;
    setIsSyncingCalendar(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/sync`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ planId: activePlan.id }),
      });

      if (!res.ok) throw new Error('Synchronizace do kalendáře selhala.');
      const result = await res.json();
      const count = result.data?.syncedEventsCount || 0;
      setSuccessMsg(`Úspěšně synchronizováno! Vytvořeno ${count} událostí předání v kalendáři spisu.`);
      if (onRefreshCase) onRefreshCase();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Opravdu chcete smazat tento plán péče?')) return;
    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${planId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error('Chyba při mazání plánu.');
      setSuccessMsg('Plán péče byl smazán.');
      await loadCareData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const subTabs = [
    { key: 'overview_calendar', label: 'Přehled & Kalendář', icon: <Calendar className="w-4 h-4" /> },
    { key: 'simulator', label: 'Simulátor péče', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'comparison', label: 'Porovnání modelů', icon: <Scale className="w-4 h-4" /> },
    { key: 'holidays', label: 'Prázdniny & Svátky', icon: <Palmtree className="w-4 h-4" /> },
    { key: 'siblings', label: 'Sourozenci', icon: <Users className="w-4 h-4" /> },
    { key: 'print_export', label: 'Tisk & Export', icon: <Printer className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Child Ages & Status */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-900 text-white">
              Care & Parenting Hub
            </span>
            <span className="text-xs font-bold text-slate-500">
              Spis: {activeCase.title}
            </span>
          </div>

          {/* Children Age Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {childrenAges.length > 0 ? (
              childrenAges.map((ca) => (
                <div
                  key={ca.childId}
                  className="px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs font-bold flex items-center gap-2"
                >
                  <Users className="w-3.5 h-3.5 text-blue-700" />
                  <span>{ca.name} ({ca.age.exactAgeString})</span>
                  <span className="text-[10px] font-medium text-blue-700 bg-white/70 px-1.5 py-0.5 rounded-md border border-blue-200">
                    {ca.age.developmentalBracket}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">Ve spisu zatím nejsou evidovány děti.</span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            Import rozsudku
          </button>

          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            Nový model v simulátoru
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1 overflow-x-auto">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key as CareSubTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === tab.key
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-center justify-between font-medium animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* SUBTAB 1: Overview & Calendar */}
      {activeSubTab === 'overview_calendar' && (
        <div className="space-y-6">
          {plans.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Vybraný plán:
                </label>
                <select
                  value={activePlan?.id || ''}
                  onChange={(e) => handleSelectPlan(e.target.value)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.rotationPattern || p.type}) {p.status === 'ACTIVE' ? '★ Aktivní' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncToCalendar}
                  disabled={isSyncingCalendar || !activePlan}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSyncingCalendar ? 'Synchronizuji...' : 'Synchronizovat do kalendáře spisu'}
                </button>

                {activePlan && (
                  <button
                    onClick={() => handleDeletePlan(activePlan.id)}
                    className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Smazat plán"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Metrics Panel */}
          <CareMetricsPanel
            metrics={activeMetrics || undefined}
            plan={activePlan || undefined}
            parentAName="Otec"
            parentBName="Matka"
          />

          {/* Calendar View */}
          {activePlan ? (
            <CareCalendarView
              plan={activePlan}
              days={activeDays}
              onUpdateDays={handleUpdateDays}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">Zatím nebyl vytvořen žádný plán péče</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Spusťte simulátor péče pro modelování střídavého režimu (např. 7/7, 2-2-3) nebo naimportujte výrokovou část soudního rozsudku.
              </p>
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer shadow-xs"
              >
                Spustit simulátor péče
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Simulator (embedded view) */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Interaktivní simulátor modelů péče</h3>
                <p className="text-xs text-slate-500">
                  Otevřete konfigurátor pro modelování různých variant, zadání adres a výpočet kilometrů.
                </p>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                Otevřít simulátor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Comparison */}
      {activeSubTab === 'comparison' && (
        <CareComparisonView
          caseId={activeCase.id}
          childrenList={activeCase.children || []}
          parentAName="Otec"
          parentBName="Matka"
          parentAAddress={activePlan?.parentAAddress || ''}
          parentBAddress={activePlan?.parentBAddress || ''}
          onApplyVariant={(pattern) => {
            setIsSimulatorOpen(true);
          }}
        />
      )}

      {/* SUBTAB 4: Holidays */}
      {activeSubTab === 'holidays' && (
        <CareHolidaysTab
          plan={activePlan || undefined}
          parentAName="Otec"
          parentBName="Matka"
        />
      )}

      {/* SUBTAB 5: Siblings */}
      {activeSubTab === 'siblings' && (
        <CareSiblingAnalysis
          childrenList={activeCase.children || []}
          plan={activePlan || undefined}
        />
      )}

      {/* SUBTAB 6: Print & Export */}
      {activeSubTab === 'print_export' && (
        activePlan ? (
          <CarePlanPrintView
            plan={activePlan}
            clientCase={activeCase}
            metrics={activeMetrics || undefined}
            days={activeDays}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            Pro tisk a export je nutné nejprve vytvořit nebo vybrat plán péče.
          </div>
        )
      )}

      {/* Simulator Modal */}
      <CareSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        caseId={activeCase.id}
        childrenList={activeCase.children || []}
        onSavePlan={handleSaveNewPlan}
      />

      {/* Judgment Import Modal */}
      <CareJudgmentImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        caseId={activeCase.id}
        childrenList={activeCase.children || []}
        onImportPlan={handleSaveNewPlan}
      />
    </div>
  );
};
