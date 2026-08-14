import React, { useState } from 'react';
import { ClientCase, CaseNote } from '../../types';
import {
  FileText,
  Plus,
  Trash2,
  Lock,
  Edit2,
  Check,
  X,
  Tag,
  Search,
} from 'lucide-react';

interface CaseNotesTabProps {
  activeCase: ClientCase;
  onAddNote: (note: Partial<CaseNote>) => Promise<void>;
  onUpdateNote: (noteId: string, data: Partial<CaseNote>) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
}

export const CaseNotesTab: React.FC<CaseNotesTabProps> = ({
  activeCase,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const notes = activeCase.notes || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('LEGAL_STRATEGY');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('LEGAL_STRATEGY');
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (note: CaseNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateNote(editingId, {
          title,
          content,
          category: category as any,
        });
      } else {
        await onAddNote({
          title,
          content,
          category: category as any,
          visibility: 'PRIVATE',
        });
      }
      resetForm();
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'LEGAL_STRATEGY':
        return '⚖️ Právní strategie & Judikatura';
      case 'OSPOD_MEETING':
        return '🏛️ Jednání OSPOD';
      case 'CHILD_PSYCHOLOGY':
        return '🧠 Psychologie & Potřeby dítěte';
      case 'COMMUNICATION_ANALYSIS':
        return '💬 Analýza komunikace (BIFF)';
      case 'EXPENSES':
        return '💰 Náklady & Výdaje';
      default:
        return '📝 Osobní poznámka';
    }
  };

  const filteredNotes = notes.filter((n) => {
    if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Důvěrné poznámky & Procesní strategie
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Soukromé zápisky ze schůzek s advokátem, příprava argumentace pro soud a záznamy o potřebách dítěte.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nová poznámka
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {editingId ? 'Upravit poznámku' : 'Vytvořit důvěrnou poznámku'}
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
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Název poznámky *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="např. Poznámky z konzultace s advokátem, Otázky pro kolizního opatrovníka"
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
                <option value="LEGAL_STRATEGY">⚖️ Právní strategie & Judikatura ÚS</option>
                <option value="OSPOD_MEETING">🏛️ Jednání OSPOD & Sociální šetření</option>
                <option value="CHILD_PSYCHOLOGY">🧠 Psychologie & Potřeby dítěte</option>
                <option value="COMMUNICATION_ANALYSIS">💬 Analýza komunikace (BIFF)</option>
                <option value="EXPENSES">💰 Náklady na dítě & Výživné</option>
                <option value="GENERAL">📝 Ostatní soukromé poznámky</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Obsah poznámky / Strategický text *
              </label>
              <textarea
                rows={6}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Zapište detailní fakta, citace z judikatury (např. I. ÚS 2482/13), postřehy k chování dítěte nebo plán vystoupení u soudu..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              Šifrovaný soukromý záznam — přístupný pouze vám
            </span>

            <div className="flex items-center gap-3">
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
                {isSubmitting ? 'Ukládám...' : editingId ? 'Uložit změny' : 'Vytvořit poznámku'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hledat v poznámkách a strategiích..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Vše' },
            { key: 'LEGAL_STRATEGY', label: '⚖️ Strategie' },
            { key: 'OSPOD_MEETING', label: '🏛️ OSPOD' },
            { key: 'CHILD_PSYCHOLOGY', label: '🧠 Dítě' },
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

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Žádné poznámky</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vytvořte si poznámky s právní strategií, postřehy z jednání a argumentací pro soud.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
          >
            Vytvořit první poznámku
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{note.title}</h3>
                    <span className="text-[11px] font-bold text-blue-800 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md inline-block mt-1">
                      {getCategoryLabel(note.category)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Upravit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Opravdu smazat poznámku "${note.title}"?`)) onDeleteNote(note.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Smazat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 p-3 rounded-2xl border border-slate-100 font-normal">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Vytvořeno: {new Date(note.createdAt).toLocaleDateString('cs-CZ')}</span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Důvěrné
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
