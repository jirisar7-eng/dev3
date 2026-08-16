import React, { useState } from 'react';
import { ClientCase } from '../../types';
import {
  Clock,
  Calendar,
  FileText,
  CheckSquare,
  Search,
  ArrowRight,
  Filter,
  Sparkles,
  Baby,
} from 'lucide-react';

interface CaseTimelineTabProps {
  activeCase: ClientCase;
}

export const CaseTimelineTab: React.FC<CaseTimelineTabProps> = ({ activeCase }) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  // Aggregate all events, documents, notes, deadlines into a unified chronological stream
  const timelineItems: Array<{
    id: string;
    date: Date;
    type: 'EVENT' | 'DOCUMENT' | 'TASK' | 'DEADLINE' | 'NOTE';
    title: string;
    description?: string;
    meta?: string;
  }> = [];

  // Events
  (activeCase.events || []).forEach((e) => {
    timelineItems.push({
      id: `event-${e.id}`,
      date: new Date(e.eventDate),
      type: 'EVENT',
      title: e.title,
      description: e.description,
      meta: `${e.category} ${e.location ? `• ${e.location}` : ''}`,
    });
  });

  // Documents
  (activeCase.documents || []).forEach((d) => {
    timelineItems.push({
      id: `doc-${d.id}`,
      date: new Date(d.createdAt),
      type: 'DOCUMENT',
      title: `Nahrán dokument: ${d.name}`,
      description: d.notes,
      meta: `${d.category} • ${(d.size / 1024).toFixed(0)} KB`,
    });
  });

  // Deadlines
  (activeCase.deadlines || []).forEach((dl) => {
    timelineItems.push({
      id: `dl-${dl.id}`,
      date: new Date(dl.dueDate),
      type: 'DEADLINE',
      title: `Lhůta: ${dl.title}`,
      description: dl.description,
      meta: `Priorita: ${dl.priority}`,
    });
  });

  // Notes
  (activeCase.notes || []).forEach((n) => {
    timelineItems.push({
      id: `note-${n.id}`,
      date: new Date(n.createdAt),
      type: 'NOTE',
      title: `Zápis: ${n.title}`,
      description: n.content,
      meta: n.category,
    });
  });

  // Sort descending by date
  timelineItems.sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredItems = timelineItems.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const getItemBadge = (type: string) => {
    switch (type) {
      case 'EVENT':
        return {
          icon: <Calendar className="w-4 h-4 text-blue-600" />,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          label: 'Událost / Jednání',
        };
      case 'DOCUMENT':
        return {
          icon: <FileText className="w-4 h-4 text-indigo-600" />,
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          label: 'Dokument',
        };
      case 'DEADLINE':
        return {
          icon: <Clock className="w-4 h-4 text-amber-600" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          label: 'Lhůta',
        };
      case 'NOTE':
        return {
          icon: <FileText className="w-4 h-4 text-emerald-600" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          label: 'Poznámka / Zápis',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-600" />,
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          label: 'Záznam',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Časová osa spisu (Master Timeline)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Ucelená chronologická rekonstrukce všech podání, jednání u soudu a OSPOD, předání dětí a strategií.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Vše' },
            { key: 'EVENT', label: '📅 Události' },
            { key: 'DOCUMENT', label: '📄 Dokumenty' },
            { key: 'DEADLINE', label: '⏰ Lhůty' },
            { key: 'NOTE', label: '📝 Zápisy' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === f.key
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Časová osa je zatím prázdná</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Přidejte události, nahrajte dokumenty nebo zapište poznámky k případu.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 space-y-6 ml-4">
          {filteredItems.map((item) => {
            const badge = getItemBadge(item.type);
            return (
              <div key={item.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-xs"></div>

                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs group-hover:border-blue-300 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">{item.title}</h4>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.date.toLocaleDateString('cs-CZ')} v {item.date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-2xl border border-slate-100 whitespace-pre-wrap font-normal">
                      {item.description}
                    </p>
                  )}

                  {item.meta && (
                    <div className="text-[11px] text-slate-500 font-medium pt-1">
                      {item.meta}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
