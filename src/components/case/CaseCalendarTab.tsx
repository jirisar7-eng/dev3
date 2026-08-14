import React, { useState } from 'react';
import { ClientCase, CaseEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Tag,
  Trash2,
  Check,
  X,
  Filter,
} from 'lucide-react';

interface CaseCalendarTabProps {
  activeCase: ClientCase;
  onAddEvent: (event: Partial<CaseEvent>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export const CaseCalendarTab: React.FC<CaseCalendarTabProps> = ({
  activeCase,
  onAddEvent,
  onDeleteEvent,
}) => {
  const events = activeCase.events || [];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('COURT');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('COURT');
    setEventDate(new Date().toISOString().slice(0, 16));
    setEndDate('');
    setLocation('');
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddEvent({
        title,
        description,
        category: category as any,
        eventDate: new Date(eventDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location,
      });
      resetForm();
    } catch (err: any) {
      alert(`Chyba při ukládání: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'COURT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OSPOD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CHILD_HANDOVER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SCHOOL':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMMUNICATION':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'COURT':
        return '⚖️ Soudní jednání';
      case 'OSPOD':
        return '🏛️ OSPOD';
      case 'CHILD_HANDOVER':
        return '🔄 Předání dítěte';
      case 'SCHOOL':
        return '🏫 Škola / Kroužky';
      case 'MEDICAL':
        return '🩺 Lékař';
      case 'COMMUNICATION':
        return '💬 Komunikace';
      default:
        return '📌 Ostatní';
    }
  };

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust so Monday is first day of week (0=Mon ... 6=Sun)
  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === 'ALL') return true;
    return e.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Kalendář spisu & Plán péče
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Plánování soudních stání, pohovorů na OSPOD, předávání dětí a lékařských prohlídek.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Naplánovat událost
            </button>
          )}
        </div>
      </div>

      {/* Add Event Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Naplánovat novou událost / jednání
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Název události *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Soudní jednání - opatrovnické řízení, Předání dětí, Návštěva OSPOD"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="COURT">⚖️ Soudní jednání</option>
                <option value="OSPOD">🏛️ Jednání OSPOD / Kolizní opatrovník</option>
                <option value="CHILD_HANDOVER">🔄 Předání dítěte do péče</option>
                <option value="SCHOOL">🏫 Škola / Kroužky</option>
                <option value="MEDICAL">🩺 Lékař / Psycholog</option>
                <option value="COMMUNICATION">💬 Komunikace s protistranou</option>
                <option value="OTHER">📌 Ostatní</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Místo konání / Adresa
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="např. Obvodní soud pro Prahu 4, místnost č. 104"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum a čas začátku *
              </label>
              <input
                type="datetime-local"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum a čas konce (volitelné)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Popis, program & poznámky k přípravě
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Co je potřeba vzít s sebou, kdo bude přítomen, klíčové argumenty..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Ukládám...' : 'Uložit do kalendáře'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filtr:
        </span>
        {[
          { key: 'ALL', label: 'Všechny události' },
          { key: 'COURT', label: '⚖️ Soud' },
          { key: 'OSPOD', label: '🏛️ OSPOD' },
          { key: 'CHILD_HANDOVER', label: '🔄 Předání dětí' },
          { key: 'SCHOOL', label: '🏫 Škola' },
          { key: 'MEDICAL', label: '🩺 Lékař' },
          { key: 'COMMUNICATION', label: '💬 Komunikace' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedCategory(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedCategory === f.key
                ? 'bg-blue-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Month Navigation & Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 capitalize flex items-center gap-2">
            {monthName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Dnes
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-100">
          <div>Po</div>
          <div>Út</div>
          <div>St</div>
          <div>Čt</div>
          <div>Pá</div>
          <div className="text-blue-600">So</div>
          <div className="text-blue-600">Ne</div>
        </div>

        {/* Month Day Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty prefix cells */}
          {Array.from({ length: adjustedFirstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 sm:h-24 rounded-2xl bg-slate-50/50 border border-transparent"></div>
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = filteredEvents.filter(
              (e) => e.eventDate.startsWith(cellDateStr)
            );
            const isToday =
              new Date().getFullYear() === year &&
              new Date().getMonth() === month &&
              new Date().getDate() === dayNum;

            return (
              <div
                key={`day-${dayNum}`}
                className={`h-20 sm:h-24 rounded-2xl border p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                  isToday
                    ? 'border-blue-500 bg-blue-50/30'
                    : 'border-slate-100 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black w-5 h-5 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-12">
                  {dayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      title={`${evt.title} (${new Date(evt.eventDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })})`}
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate border ${getCategoryColor(
                        evt.category
                      )}`}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chronological List of Events */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Seznam naplánovaných událostí ({filteredEvents.length})
        </h3>

        {filteredEvents.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">V tomto filtru nejsou žádné události.</p>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-black uppercase leading-none">
                      {new Date(evt.eventDate).toLocaleDateString('cs-CZ', { month: 'short' })}
                    </span>
                    <span className="text-base font-black leading-none mt-1">
                      {new Date(evt.eventDate).getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">{evt.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(evt.category)}`}>
                        {getCategoryLabel(evt.category)}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-600">{evt.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1 font-medium">
                      <span className="flex items-center gap-1 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {new Date(evt.eventDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                        {evt.endDate && ` – ${new Date(evt.endDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                      {evt.location && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          {evt.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => {
                      if (confirm(`Opravdu chcete smazat událost "${evt.title}"?`)) {
                        onDeleteEvent(evt.id);
                      }
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Smazat událost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
