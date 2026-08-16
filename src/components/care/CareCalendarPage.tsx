import React, { useState, useMemo } from 'react';
import { ClientCase, CarePlan, CareDay } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Repeat,
  MapPin,
  Clock,
  RotateCcw,
  ArrowLeft,
  Filter,
  CheckCircle2,
  Users,
  Moon,
  Sun,
  Palmtree,
  Info,
} from 'lucide-react';

interface CareCalendarPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  days: CareDay[];
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

type CalendarMode = 'month' | 'week' | 'list';

export const CareCalendarPage: React.FC<CareCalendarPageProps> = ({
  activeCase,
  activePlan,
  days,
  onNavigate,
  onRefresh,
}) => {
  const [mode, setMode] = useState<CalendarMode>('month');
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<CareDay | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const pA = activePlan?.parentAName || 'Otec (Rodič A)';
  const pB = activePlan?.parentBName || 'Matka (Rodič B)';

  // Build month grid days
  const monthDays = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday as start of week in Czech locale
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const grid: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; careDay?: CareDay }[] = [];

    // Prepend empty / previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dNum = prevMonthLastDay - i;
      const d = new Date(year, month - 1, dNum);
      const dStr = d.toISOString().split('T')[0];
      const found = days.find((cd) => cd.date === dStr);
      grid.push({ dateStr: dStr, dayNumber: dNum, isCurrentMonth: false, careDay: found });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const found = days.find((cd) => cd.date === dStr);
      grid.push({ dateStr: dStr, dayNumber: i, isCurrentMonth: true, careDay: found });
    }

    // Pad end of grid to complete 6-row or 5-row full weeks (multiple of 7)
    const remaining = 7 - (grid.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        const dStr = d.toISOString().split('T')[0];
        const found = days.find((cd) => cd.date === dStr);
        grid.push({ dateStr: dStr, dayNumber: i, isCurrentMonth: false, careDay: found });
      }
    }

    return grid;
  }, [selectedMonth, days]);

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setSelectedMonth(new Date());
  };

  const handleSync = async () => {
    if (!activePlan) return;
    setSyncing(true);
    setSyncMessage(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/plans/${activePlan.id}/sync`, {
        method: 'POST',
        headers: authHeaders,
      });
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        throw new Error('Synchronizace selhala.');
      }
      const data = await res.json();
      setSyncMessage(`Úspěšně synchronizováno ${data.data?.eventsCount ?? days.length} událostí do kalendáře spisu.`);
      setTimeout(() => setSyncMessage(null), 5000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba synchronizace.');
    } finally {
      setSyncing(false);
    }
  };

  const monthName = selectedMonth.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header with back button & tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('/pece')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět na přehled Péče o dítě</span>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <h1 className="text-2xl font-black text-slate-900">Kalendář péče</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Plán péče:{' '}
            <strong className="text-slate-800">{activePlan ? activePlan.title : 'Žádný aktivní plán'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'month' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Měsíc
            </button>
            <button
              onClick={() => setMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                mode === 'list' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Seznam směn
            </button>
          </div>

          {activePlan && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Synchronizuji...' : 'Synchronizovat kalendář'}</span>
            </button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Legend & Navigation Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-900 capitalize">{monthName}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                aria-label="Předchozí měsíc"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
              >
                Dnes
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                aria-label="Následující měsíc"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="font-bold text-slate-700">{pA}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-purple-600" />
              <span className="font-bold text-slate-700">{pB}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="font-bold text-slate-700">Předání</span>
            </div>
          </div>
        </div>

        {/* MONTH VIEW */}
        {mode === 'month' && (
          <div className="space-y-2">
            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-500 pb-2">
              <div>Po</div>
              <div>Út</div>
              <div>St</div>
              <div>Čt</div>
              <div>Pá</div>
              <div className="text-amber-700">So</div>
              <div className="text-amber-700">Ne</div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {monthDays.map((item, index) => {
                const cDay = item.careDay;
                const isParentA = cDay?.assignedParent === 'PARENT_A';
                const isParentB = cDay?.assignedParent === 'PARENT_B';
                const isHandover = cDay?.isHandover;

                return (
                  <button
                    key={index}
                    onClick={() => cDay && setSelectedDay(cDay)}
                    className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      item.isCurrentMonth
                        ? isParentA
                          ? 'bg-blue-50/70 border-blue-200 hover:border-blue-400'
                          : isParentB
                          ? 'bg-purple-50/70 border-purple-200 hover:border-purple-400'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-50/50 border-slate-100 text-slate-300 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-xs font-black ${
                          item.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        {item.dayNumber}
                      </span>
                      {isHandover && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-xs" title="Předání dítěte">
                          <Repeat className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {cDay && (
                      <div className="space-y-1 mt-1">
                        <div
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate ${
                            isParentA
                              ? 'bg-blue-600 text-white'
                              : isParentB
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isParentA ? pA : pB}
                        </div>
                        {isHandover && (
                          <div className="text-[9px] font-bold text-amber-800 truncate flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{cDay.handoverTime || activePlan?.defaultHandoverTime || '16:00'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {mode === 'list' && (
          <div className="divide-y divide-slate-100">
            {days.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Žádné záznamy v kalendáři pro aktivní plán.
              </div>
            ) : (
              days.map((day, idx) => {
                const isParentA = day.assignedParent === 'PARENT_A';
                return (
                  <div
                    key={day.id || idx}
                    onClick={() => setSelectedDay(day)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-bold text-slate-400 w-8">#{idx + 1}</div>
                      <div>
                        <strong className="text-slate-900 font-bold block">
                          {new Date(day.date).toLocaleDateString('cs-CZ', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric',
                          })}
                        </strong>
                        <span className="text-[11px] text-slate-500">{day.notes || 'Běžný den v péči'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {day.isHandover && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          <span>{day.handoverTime || activePlan?.defaultHandoverTime || '16:00'}</span>
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isParentA
                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                            : 'bg-purple-50 text-purple-900 border border-purple-200'
                        }`}
                      >
                        {isParentA ? pA : pB}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detail dne</span>
                <h3 className="text-lg font-black text-slate-900">
                  {new Date(selectedDay.date).toLocaleDateString('cs-CZ', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Pečující rodič:</span>
                  <strong className="text-slate-900 font-bold">
                    {selectedDay.assignedParent === 'PARENT_A' ? pA : pB}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Předání dítěte:</span>
                  <strong className={selectedDay.isHandover ? 'text-amber-700 font-black' : 'text-slate-600'}>
                    {selectedDay.isHandover ? `Ano v ${selectedDay.handoverTime || activePlan?.defaultHandoverTime || '16:00'}` : 'Ne'}
                  </strong>
                </div>
                {selectedDay.isHandover && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Místo předání:</span>
                    <strong className="text-slate-800 font-bold">
                      {selectedDay.locationName || activePlan?.defaultLocationName || 'Domov / Dle dohody'}
                    </strong>
                  </div>
                )}
              </div>

              {selectedDay.notes && (
                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 text-blue-950">
                  <span className="font-bold block mb-0.5">Poznámka:</span>
                  <span>{selectedDay.notes}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
