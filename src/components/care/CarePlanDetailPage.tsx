import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan, CareMetrics, CareDay, CareHolidayRule, CareLocation } from '../../types';
import {
  Calendar,
  Sparkles,
  Layers,
  Clock,
  MapPin,
  Palmtree,
  BarChart3,
  History,
  CheckCircle2,
  AlertCircle,
  Edit2,
  RotateCcw,
  Trash2,
  Archive,
  ArrowLeft,
  Users,
  Repeat,
  Car,
  Check,
  Moon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { CarePlanFormModal } from './CarePlanFormModal';
import { CareCalendarView } from '../case/care/CareCalendarView';
import { CareMetricsPanel } from '../case/care/CareMetricsPanel';
import { CareHolidaysTab } from '../case/care/CareHolidaysTab';

interface CarePlanDetailPageProps {
  planId: string;
  activeCase: ClientCase;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

type TabType = 'overview' | 'calendar' | 'schedule' | 'handovers' | 'holidays' | 'statistics' | 'history';

export const CarePlanDetailPage: React.FC<CarePlanDetailPageProps> = ({
  planId,
  activeCase,
  onNavigate,
  onRefresh,
}) => {
  const [plan, setPlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [planHistory, setPlanHistory] = useState<any[]>([]);

  const setDays = (updated: CareDay[]) => {
    setPlan((prev) => (prev ? { ...prev, days: updated } : null));
  };

  const fetchPlan = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${planId}`, {
        headers: authHeaders,
      });

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        if (res.status === 404) {
          throw new Error('Plán péče nebyl nalezen.');
        }
        throw new Error('Nepodařilo se načíst detail plánu péče.');
      }

      const data = await res.json();
      if (data.success && data.data) {
        setPlan(data.data);
      }
    } catch (err: any) {
      console.error('Chyba při načítání plánu:', err);
      setError(err.message || 'Chyba při načítání plánu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/history`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const filtered = data.data.filter((l: any) => !l.details || l.details.includes(planId) || l.details.includes(plan?.title || ''));
          setPlanHistory(filtered);
        }
      }
    } catch (err) {
      console.error('Chyba historie:', err);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [planId, activeCase.id]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const handleActivate = async () => {
    if (!plan) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${plan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný.');
        }
        throw new Error('Nepodařilo se aktivovat plán.');
      }

      fetchPlan();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba při aktivaci plánu.');
    }
  };

  const handleArchive = async () => {
    if (!plan) return;
    if (!confirm('Opravdu chcete tento plán archivovat?')) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${plan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: 'ARCHIVED' }),
      });

      if (!res.ok) throw new Error('Nepodařilo se archivovat plán.');
      fetchPlan();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba.');
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    if (!confirm(`Opravdu chcete trvale smazat plán "${plan.title}"? Tato akce je nevratná.`)) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${plan.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!res.ok) throw new Error('Nepodařilo se smazat plán.');
      onRefresh();
      onNavigate('/pece');
    } catch (err: any) {
      alert(err.message || 'Chyba při mazání.');
    }
  };

  const handleSyncCalendar = async () => {
    if (!plan) return;
    setSyncing(true);
    setSyncSuccess(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${plan.id}/sync`, {
        method: 'POST',
        headers: authHeaders,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        throw new Error(data.error || 'Synchronizace selhala.');
      }

      const resData = await res.json();
      setSyncSuccess(
        `Úspěšně synchronizováno ${resData.data?.eventsCount ?? plan.days?.length ?? 0} událostí do kalendáře spisu.`
      );
      setTimeout(() => setSyncSuccess(null), 5000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba synchronizace kalendáře.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDayOverride = async (date: string, assignedParent: 'PARENT_A' | 'PARENT_B', isHandover?: boolean) => {
    if (!plan) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${plan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          dayOverrides: [
            {
              date,
              assignedParent,
              isHandover,
            },
          ],
        }),
      });

      if (!res.ok) throw new Error('Nepodařilo se aktualizovat den.');
      fetchPlan();
    } catch (err: any) {
      alert(err.message || 'Chyba při změně dne.');
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Načítám plán péče...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto">
        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
        <h2 className="text-lg font-black text-red-900">Plán se nepodařilo načíst</h2>
        <p className="text-sm text-red-700">{error || 'Plán péče neexistuje.'}</p>
        <button
          onClick={() => onNavigate('/pece')}
          className="px-5 py-2.5 rounded-xl bg-red-800 text-white font-bold text-xs hover:bg-red-900 transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na přehled péče</span>
        </button>
      </div>
    );
  }

  const pA = plan.parentAName || 'Otec';
  const pB = plan.parentBName || 'Matka';
  const metrics = plan.metrics;
  const days = plan.days || [];

  return (
    <div className="space-y-6">
      {/* Top back button */}
      <div>
        <button
          onClick={() => onNavigate('/pece')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na hlavní přehled Péče o dítě</span>
        </button>
      </div>

      {/* Synchronizace Alert */}
      {syncSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* Plan Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  plan.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : plan.status === 'ARCHIVED'
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {plan.status === 'ACTIVE'
                  ? 'Aktivní plán'
                  : plan.status === 'ARCHIVED'
                  ? 'Archivovaný'
                  : 'Návrh (Draft)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
                Model: {plan.rotationPattern || '7/7'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{plan.title}</h1>
            <p className="text-xs text-slate-500">
              Období: <strong className="text-slate-800">{formatDate(plan.startDate)} – {formatDate(plan.endDate)}</strong>{' '}
              ({days.length} dní cyklu) • Spis: <strong>{activeCase.title}</strong>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Upravit</span>
            </button>

            {plan.status !== 'ACTIVE' && (
              <button
                onClick={handleActivate}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aktivovat plán</span>
              </button>
            )}

            <button
              onClick={handleSyncCalendar}
              disabled={syncing}
              className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronizuji...' : 'Synchronizovat kalendář'}</span>
            </button>

            {plan.status === 'ACTIVE' && (
              <button
                onClick={handleArchive}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Archivovat plán"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleDelete}
              className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Smazat plán"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-100 pt-4 mt-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📋 Přehled
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📅 Kalendář
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📑 Rozvrh cyklu
          </button>
          <button
            onClick={() => setActiveTab('handovers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'handovers'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🔄 Předávání
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'holidays'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🏖️ Prázdniny
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'statistics'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            📊 Statistiky
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-blue-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            🕘 Historie
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* TAB 1: PŘEHLED */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top overview metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">PODÍL PÉČE</span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.estimatedTimePercentA != null
                    ? `${metrics.estimatedTimePercentA}% : ${metrics.estimatedTimePercentB}%`
                    : `${metrics?.nightsPercentA ?? 50}% : ${metrics?.nightsPercentB ?? 50}%`}
                </div>
                <div className="w-full h-2 bg-purple-200 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${metrics?.estimatedTimePercentA ?? metrics?.nightsPercentA ?? 50}%` }}
                  />
                  <div
                    className="bg-purple-600 h-full"
                    style={{ width: `${metrics?.estimatedTimePercentB ?? metrics?.nightsPercentB ?? 50}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">PŘEDÁNÍ V CYKLU</span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.totalHandovers ?? days.filter((d) => d.isHandover).length} ×
                </div>
                <p className="text-[11px] text-slate-500">
                  Frekvence: cca {metrics?.handoversPerWeek ? (metrics.handoversPerWeek * 4.33).toFixed(1) : 4} předání za měsíc
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">PRŮMĚRNÝ BLOK</span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.avgBlockLengthDaysA != null ? `${((metrics.avgBlockLengthDaysA + metrics.avgBlockLengthDaysB) / 2).toFixed(1)} dne` : '3.5 dne'}
                </div>
                <p className="text-[11px] text-slate-500">Délka nepřetržitého pobytu u rodiče</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase">MAX. ODLOUČENÍ</span>
                <div className="text-2xl font-black text-slate-900">
                  {metrics?.maxSeparationDaysA != null ? `${Math.max(metrics.maxSeparationDaysA, metrics.maxSeparationDaysB)} dní` : '7 dní'}
                </div>
                <p className="text-[11px] text-slate-500">Maximální doba bez kontaktu s jedním z rodičů</p>
              </div>
            </div>

            {/* Plan Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900">Parametry uspořádání</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Rodič A:</span>
                    <strong className="text-slate-800 font-bold">{pA}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Rodič B:</span>
                    <strong className="text-slate-800 font-bold">{pB}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Počáteční rodič:</span>
                    <strong className="text-slate-800 font-bold">
                      {pA}
                    </strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Výchozí čas předání:</span>
                    <strong className="text-slate-800 font-bold">{plan.defaultHandoverTime || '16:00'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Výchozí místo:</span>
                    <strong className="text-slate-800 font-bold">
                      {plan.parentAAddress || 'Domov / Dle dohody'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Děti:</span>
                    <strong className="text-slate-800 font-bold">
                      {(plan.children || []).map((c) => c.child?.firstName || (c as any).firstName).filter(Boolean).join(', ') ||
                        (activeCase.children || []).map((c) => c.firstName).join(', ')}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KALENDÁŘ */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <CareCalendarView
              plan={plan}
              days={days}
              onUpdateDays={(updated) => setDays(updated)}
            />
          </div>
        )}

        {/* TAB 3: ROZVRH CYKLU */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Rozpis jednotlivých dní cyklu ({days.length} dní)</h3>
              <span className="text-xs text-slate-500">Kliknutím na den v kalendáři můžete provést ruční úpravu</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Den</th>
                    <th className="py-3 px-4">Datum</th>
                    <th className="py-3 px-4">Pečující rodič</th>
                    <th className="py-3 px-4">Předání</th>
                    <th className="py-3 px-4">Čas předání</th>
                    <th className="py-3 px-4">Místo</th>
                    <th className="py-3 px-4">Poznámka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {days.map((day, idx) => (
                    <tr
                      key={day.id || day.date}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        day.isHandover ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">#{idx + 1}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{formatDate(day.date)}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            day.assignedParent === 'PARENT_A'
                              ? 'bg-blue-50 text-blue-900 border border-blue-200'
                              : 'bg-purple-50 text-purple-900 border border-purple-200'
                          }`}
                        >
                          {day.assignedParent === 'PARENT_A' ? pA : pB}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {day.isHandover ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <Repeat className="w-3 h-3" />
                            Předání
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{day.isHandover ? day.handoverTime || plan.defaultHandoverTime || '16:00' : '—'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{day.handoverLocation?.name || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-500">{day.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PŘEDÁVÁNÍ */}
        {activeTab === 'handovers' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Seznam všech předání v cyklu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {days
                .filter((d) => d.isHandover)
                .map((handover, index) => {
                  const toParent = handover.assignedParent === 'PARENT_A' ? pA : pB;
                  const fromParent = handover.assignedParent === 'PARENT_A' ? pB : pA;
                  return (
                    <div
                      key={handover.id || handover.date}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                        <span className="font-black text-slate-800 text-sm">
                          Předání #{index + 1} • {formatDate(handover.date)}
                        </span>
                        <span className="font-mono bg-blue-900 text-white px-2 py-0.5 rounded-md text-[11px] font-bold">
                          {handover.handoverTime || plan.defaultHandoverTime || '16:00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Předává: <strong className="text-slate-900">{fromParent}</strong></span>
                        <span>Přebírá: <strong className="text-emerald-700">{toParent}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{handover.handoverLocation?.name || plan.parentAAddress || 'Běžné místo'}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TAB 5: PRÁZDNINY */}
        {activeTab === 'holidays' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <CareHolidaysTab
              plan={plan}
              parentAName={pA}
              parentBName={pB}
              onSaveHolidayRules={async (newRules) => {
                const token = localStorage.getItem('tatovacesta_auth_token');
                const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                if (token) authHeaders['Authorization'] = `Bearer ${token}`;

                await fetch(`/api/cases/${activeCase.id}/care/plans/${plan.id}`, {
                  method: 'PATCH',
                  headers: authHeaders,
                  body: JSON.stringify({
                    holidayRules: newRules,
                  }),
                });
                fetchPlan();
              }}
            />
          </div>
        )}

        {/* TAB 6: STATISTIKY */}
        {activeTab === 'statistics' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            {metrics ? (
              <CareMetricsPanel metrics={metrics} parentAName={pA} parentBName={pB} />
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Statistická data nejsou k dispozici.
              </div>
            )}
          </div>
        )}

        {/* TAB 7: HISTORIE */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Historie změn plánu péče</h3>
            {planHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Žádné auditní záznamy pro tento plán.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {planHistory.map((item: any) => (
                  <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{item.action}</span>
                        <span className="text-[11px] text-slate-400">{item.userEmail || 'Uživatel'}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{item.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleString('cs-CZ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <CarePlanFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          activeCase={activeCase}
          editingPlan={plan}
          onSuccess={() => {
            fetchPlan();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
