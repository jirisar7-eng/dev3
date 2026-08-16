import React, { useState } from 'react';
import { ClientCase, CaseEvent } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Filter,
  Search,
  Check,
  X,
  Tag,
} from 'lucide-react';

interface CaseEventsTabProps {
  activeCase: ClientCase;
  onAddEvent: (event: Partial<CaseEvent>) => Promise<void>;
  onDeleteEvent: (eventId: string) => Promise<void>;
}

export const CaseEventsTab: React.FC<CaseEventsTabProps> = ({
  activeCase,
  onAddEvent,
  onDeleteEvent,
}) => {
  const events = activeCase.events || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('CHILD_HANDOVER');
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('CHILD_HANDOVER');
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
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = events
    .filter((e) => {
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchDesc = e.description?.toLowerCase().includes(q);
        const matchLoc = e.location?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchLoc;
      }
      return true;
    })
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

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

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Deník událostí & Záznam incidentů
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Faktická evidence předávání dětí, jednání na OSPOD, soudních stání a důležitých událostí s přesným časem a místem.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Zaznamenat novou událost
          </button>
        )}
      </div>

      {/* Add Event Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Nový záznam do deníku událostí
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
                Název záznamu / události *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Předání Jakuba u školy, Pohovor s kolizní opatrovnicí, Návštěva u lékaře"
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
                <option value="CHILD_HANDOVER">🔄 Předání dítěte</option>
                <option value="COURT">⚖️ Soudní jednání</option>
                <option value="OSPOD">🏛️ OSPOD / Sociální pracovník</option>
                <option value="SCHOOL">🏫 Škola / Školka / Kroužek</option>
                <option value="MEDICAL">🩺 Zdravotní péče / Lékař</option>
                <option value="COMMUNICATION">💬 Komunikace s matkou</option>
                <option value="OTHER">📌 Jiné</option>
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
                placeholder="např. Před ZŠ Filosofská, Praha 4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum a čas *
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
                Konec události (volitelné)
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <MarkdownEditor
                label="Podrobný popis průběhu & poznámky"
                value={description}
                onChange={setDescription}
                rows={3}
                placeholder="Objektivní popis: jak proběhlo předání, nálada dítěte, přítomné osoby, případné nestandardní situace..."
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
              {isSubmitting ? 'Ukládám...' : 'Zapsat do deníku'}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat v deníku událostí (název, popis, místo)..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Vše' },
            { key: 'CHILD_HANDOVER', label: '🔄 Předání' },
            { key: 'COURT', label: '⚖️ Soud' },
            { key: 'OSPOD', label: '🏛️ OSPOD' },
            { key: 'MEDICAL', label: '🩺 Lékař' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedCategory(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === f.key
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events Timeline / List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Deník je zatím prázdný</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Zaznamenávejte pravidelná předání, kontakt s OSPOD a další důležité milníky.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
          >
            Zapsat první událost
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black uppercase leading-none">
                    {new Date(evt.eventDate).toLocaleDateString('cs-CZ', { month: 'short' })}
                  </span>
                  <span className="text-base font-black leading-none mt-1">
                    {new Date(evt.eventDate).getDate()}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{evt.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCategoryColor(evt.category)}`}>
                      {evt.category}
                    </span>
                  </div>

                  {evt.description && (
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {evt.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1 font-medium">
                    <span className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {new Date(evt.eventDate).toLocaleDateString('cs-CZ')} v{' '}
                      {new Date(evt.eventDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
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

              <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                <button
                  onClick={() => {
                    if (confirm(`Opravdu chcete odstranit záznam "${evt.title}"?`)) {
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
  );
};
