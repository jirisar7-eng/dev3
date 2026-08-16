import React, { useState } from 'react';
import { CareDay, CarePlan } from '../../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Moon,
  Clock,
  Sparkles,
  School,
  Palmtree,
  Edit2,
  X,
  Check,
} from 'lucide-react';

interface CareCalendarViewProps {
  plan: CarePlan;
  days: CareDay[];
  onUpdateDays?: (updatedDays: CareDay[]) => void;
  readOnly?: boolean;
}

export const CareCalendarView: React.FC<CareCalendarViewProps> = ({
  plan,
  days,
  onUpdateDays,
  readOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<'7' | '14' | '28' | 'month'>('28');
  const [selectedDay, setSelectedDay] = useState<CareDay | null>(null);
  const [editDayModal, setEditDayModal] = useState<boolean>(false);

  // Editable day state
  const [editParent, setEditParent] = useState<string>('PARENT_A');
  const [editIsHandover, setEditIsHandover] = useState<boolean>(false);
  const [editHandoverTime, setEditHandoverTime] = useState<string>('16:00');
  const [editNotes, setEditNotes] = useState<string>('');

  const pA = plan.parentAName || 'Otec (Rodič A)';
  const pB = plan.parentBName || 'Matka (Rodič B)';

  const dayNames = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

  // Slice days according to viewMode
  let displayDays: CareDay[] = days;
  if (viewMode === '7') displayDays = days.slice(0, 7);
  else if (viewMode === '14') displayDays = days.slice(0, 14);
  else if (viewMode === '28') displayDays = days.slice(0, 28);

  const handleOpenEditDay = (day: CareDay) => {
    if (readOnly) return;
    setSelectedDay(day);
    setEditParent(day.assignedParent);
    setEditIsHandover(day.isHandover);
    setEditHandoverTime(day.handoverTime || plan.defaultHandoverTime || '16:00');
    setEditNotes(day.notes || '');
    setEditDayModal(true);
  };

  const handleSaveDayEdit = () => {
    if (!selectedDay || !onUpdateDays) return;

    const updated = days.map((d) => {
      if (d.date === selectedDay.date) {
        return {
          ...d,
          assignedParent: editParent,
          overnightParent: editParent,
          isHandover: editIsHandover,
          handoverTime: editIsHandover ? editHandoverTime : undefined,
          notes: editNotes,
        };
      }
      return d;
    });

    onUpdateDays(updated);
    setEditDayModal(false);
    setSelectedDay(null);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header & View Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-900" />
            Rozpis dnů a předávání péče
          </h3>
          <p className="text-xs text-slate-500">
            {plan.rotationPattern ? `Režim ${plan.rotationPattern}` : 'Vlastní harmonogram'} • Kliknutím na den můžete upravit rodiče nebo předání
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setViewMode('7')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === '7' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1 týden
          </button>
          <button
            onClick={() => setViewMode('14')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === '14' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2 týdny
          </button>
          <button
            onClick={() => setViewMode('28')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === '28' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4 týdny (28 d)
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Všechny dny
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-100 border border-blue-400 inline-block" />
            <span className="font-bold text-slate-700">{pA}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-100 border border-purple-400 inline-block" />
            <span className="font-bold text-slate-700">{pB}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-500 flex items-center justify-center text-[9px] font-black text-emerald-800">
              ⇄
            </span>
            <span className="font-bold text-slate-700">Předání</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-500 inline-block" />
            <span className="font-bold text-slate-700">Školní předání</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-orange-100 border border-orange-500 inline-block" />
            <span className="font-bold text-slate-700">Prázdniny / Svátky</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          Celkem dnů v náhledu: <strong>{displayDays.length}</strong>
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 pb-2 border-b border-slate-100 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {dayNames.map((dn, idx) => (
            <div key={dn} className={idx >= 5 ? 'text-amber-700 font-black' : ''}>
              {dn}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {displayDays.map((day, idx) => {
            const isA = day.assignedParent === 'PARENT_A';
            const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
            const dateObj = new Date(day.date);
            const dayNum = dateObj.getDate();
            const monthStr = dateObj.toLocaleDateString('cs-CZ', { month: 'short' });

            return (
              <div
                key={day.date + idx}
                onClick={() => handleOpenEditDay(day)}
                className={`min-h-[88px] p-2 rounded-xl border transition-all flex flex-col justify-between cursor-pointer hover:shadow-md ${
                  isA
                    ? 'bg-blue-50/60 border-blue-200 hover:border-blue-400'
                    : 'bg-purple-50/60 border-purple-200 hover:border-purple-400'
                } ${day.isHoliday ? 'ring-1 ring-orange-400 bg-orange-50/40' : ''}`}
              >
                {/* Cell Header: Day & Date */}
                <div className="flex items-start justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-black text-slate-800">{dayNum}.</span>
                    <span className="text-[10px] text-slate-400">{monthStr}</span>
                  </div>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                      isA ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
                    }`}
                  >
                    {isA ? 'A' : 'B'}
                  </span>
                </div>

                {/* Handover & Holiday Badges */}
                <div className="space-y-1 my-1">
                  {day.isHandover && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-bold">
                      <Repeat className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{day.handoverTime || '16:00'}</span>
                    </div>
                  )}

                  {day.isHoliday && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-100 border border-orange-300 text-orange-900 text-[9px] font-bold truncate">
                      <Palmtree className="w-2.5 h-2.5 shrink-0 text-orange-700" />
                      <span className="truncate">{day.holidayName || 'Prázdniny'}</span>
                    </div>
                  )}

                  {day.notes && (
                    <div className="text-[9px] text-slate-500 truncate italic">
                      {day.notes}
                    </div>
                  )}
                </div>

                {/* Footer: Night indicator */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                  <span className="flex items-center gap-1">
                    <Moon className="w-2.5 h-2.5 text-indigo-500" />
                    <span className="text-[9px]">{isA ? 'U otce' : 'U matky'}</span>
                  </span>
                  {day.travelDistanceKm ? (
                    <span className="text-[9px] font-bold text-slate-600">{day.travelDistanceKm} km</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Day Modal */}
      {editDayModal && selectedDay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">
                  Úprava dne: {new Date(selectedDay.date).toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>
                <p className="text-xs text-slate-500">Ruční úprava přiřazení péče a logistiky</p>
              </div>
              <button
                onClick={() => setEditDayModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Assigned Parent Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Péče a přespání v tento den:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditParent('PARENT_A')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      editParent === 'PARENT_A'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{pA}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Rodič A</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditParent('PARENT_B')}
                    className={`p-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      editParent === 'PARENT_B'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{pB}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Rodič B</span>
                  </button>
                </div>
              </div>

              {/* Handover toggle */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsHandover}
                    onChange={(e) => setEditIsHandover(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    V tento den probíhá předání dítěte
                  </span>
                </label>

                {editIsHandover && (
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Čas předání:
                      </label>
                      <input
                        type="time"
                        value={editHandoverTime}
                        onChange={(e) => setEditHandoverTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Typ:
                      </label>
                      <select className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium">
                        <option value="STANDARD">Běžné předání</option>
                        <option value="SCHOOL">Přes školu / školku</option>
                        <option value="NEUTRAL">Neutrální místo</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Poznámka k tomuto dni (nepovinné):
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="např. kroužek keramiky, lékařská kontrola"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditDayModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="button"
                onClick={handleSaveDayEdit}
                className="px-5 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                Uložit změnu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
