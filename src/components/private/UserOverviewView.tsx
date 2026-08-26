import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { User, UserCase, UserChild, UserCalendarEvent, UserNote } from '../../types';
import { MarkdownEditor } from '../MarkdownEditor';
import { useModules } from '../../context/ModuleContext';
import {
  ShieldCheck,
  Briefcase,
  Baby,
  Calendar,
  FileText,
  Plus,
  Package,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
} from 'lucide-react';

interface UserOverviewViewProps {
  user: User;
}

export const UserOverviewView: React.FC<UserOverviewViewProps> = ({ user }) => {
  const { modules } = useModules();

  const [cases, setCases] = useState<UserCase[]>([]);
  const [children, setChildren] = useState<UserChild[]>([]);
  const [events, setEvents] = useState<UserCalendarEvent[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);

  // New Case Modal State
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');

  // New Child Modal State
  const [showChildModal, setShowChildModal] = useState(false);
  const [childName, setChildName] = useState('');
  const [childBirthDate, setChildBirthDate] = useState('');

  // New Note State
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // New Event State
  const [showEvtModal, setShowEvtModal] = useState(false);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtCategory, setEvtCategory] = useState('handover');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer jwt_token_${user.id}_${Date.now()}`,
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [resCases, resChildren, resEvents, resNotes] = await Promise.all([
        apiFetch(`/api/portal/cases/${user.id}`, { headers: authHeaders }),
        apiFetch(`/api/portal/children/${user.id}`, { headers: authHeaders }),
        apiFetch(`/api/portal/events/${user.id}`, { headers: authHeaders }),
        apiFetch(`/api/portal/notes/${user.id}`, { headers: authHeaders }),
      ]);

      if (resCases.ok) setCases(await resCases.json());
      if (resChildren.ok) setChildren(await resChildren.json());
      if (resEvents.ok) setEvents(await resEvents.json());
      if (resNotes.ok) setNotes(await resNotes.json());
    } catch (e) {
      console.error('Error loading overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user.id]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) return;

    try {
      const res = await apiFetch('/api/portal/cases', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: user.id,
          title: caseTitle,
          caseNumber,
          courtName,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCases((prev) => [created, ...prev]);
        setShowCaseModal(false);
        setCaseTitle('');
        setCaseNumber('');
        setCourtName('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName.trim()) return;

    try {
      const res = await apiFetch('/api/portal/children', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: user.id,
          name: childName,
          birthDate: childBirthDate,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setChildren((prev) => [created, ...prev]);
        setShowChildModal(false);
        setChildName('');
        setChildBirthDate('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    try {
      const res = await apiFetch('/api/portal/notes', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: user.id,
          title: newNoteTitle,
          content: newNoteContent,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setNotes((prev) => [created, ...prev]);
        setNewNoteTitle('');
        setNewNoteContent('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await apiFetch(`/api/portal/notes/${noteId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitle.trim() || !evtDate) return;

    try {
      const res = await apiFetch('/api/portal/events', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          userId: user.id,
          title: evtTitle,
          eventDate: evtDate,
          category: evtCategory,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setEvents((prev) => [...prev, created]);
        setShowEvtModal(false);
        setEvtTitle('');
        setEvtDate('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl border-2 border-blue-600 object-cover" />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900">Vítejte, {user.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Přístupová vrstva: <strong className="text-blue-900">PRIVATE PORTAL LAYER</strong> • ID: <span className="font-mono">{user.id}</span>
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 block">Stav účtu: Aktivní</span>
            <span className="text-[11px] text-slate-500">Registrován: {new Date(user.createdAt).toLocaleDateString('cs-CZ')}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Cases, Children, Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Cases & Children */}
        <div className="lg:col-span-2 space-y-8">
          {/* Opatrovnický Spis / Cases */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Moje Opatrovnické Spisy</h2>
              </div>
              <button
                onClick={() => setShowCaseModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Založit spis
              </button>
            </div>

            {cases.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Zatím nemáte registrovaný žádný opatrovnický spis.</p>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {c.caseNumber && <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">Sp. zn. {c.caseNumber}</span>}
                        {c.courtName && <span>{c.courtName}</span>}
                      </div>
                      {c.notes && <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-xl border border-slate-100">{c.notes}</p>}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Children Profiles */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Děti v péči</h2>
              </div>
              <button
                onClick={() => setShowChildModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Přidat dítě
              </button>
            </div>

            {children.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Zatím nemáte vytvořen profil dítěte.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children.map((ch) => (
                  <div key={ch.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm shrink-0">
                      {ch.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{ch.name}</h4>
                      {ch.birthDate && <p className="text-[11px] text-slate-500">Narození: {new Date(ch.birthDate).toLocaleDateString('cs-CZ')}</p>}
                      {ch.notes && <p className="text-[11px] text-slate-600 line-clamp-1">{ch.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Private Notes Scratchpad */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <FileText className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Soukromé poznámky & Časová osa</h2>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="Předmět poznámky (např. Průběh předávání dítěte...)"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
              />
              <MarkdownEditor
                value={newNoteContent}
                onChange={setNewNoteContent}
                rows={3}
                placeholder="Detailní záznam události, časový údaj, dohoda s matkou či OSPOD..."
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Uložit poznámku
                </button>
              </div>
            </form>

            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{new Date(n.createdAt).toLocaleString('cs-CZ')}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    className="text-slate-400 hover:text-red-600 p-1.5 transition-colors cursor-pointer"
                    title="Smazat poznámku"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Calendar & Module Shortcuts */}
        <div className="space-y-8">
          {/* Calendar Events */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900">Nadcházející události</h2>
              </div>
              <button
                onClick={() => setShowEvtModal(true)}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                + Přidat
              </button>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Žádné naplánované události.</p>
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div key={e.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{e.title}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {e.eventDate ? new Date(e.eventDate).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                      {e.category}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Module Engine Shortcuts */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-4">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Aktivní moduly</h2>
            </div>

            <div className="space-y-3">
              {modules.filter((m) => m.enabled).map((m) => (
                <div key={m.key} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{m.description}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Aktivní
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Case Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Založit nový opatrovnický spis</h3>
            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Název spisu</label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="např. Úprava péče k dceři Anetě"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Spisová značka (volitelné)</label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="např. 12 Nc 305/2025"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Příslušný soud (volitelné)</label>
                <input
                  type="text"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  placeholder="např. Okresní soud v Olomouci"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCaseModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
                >
                  Vytvořit spis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Child Modal */}
      {showChildModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Přidat profil dítěte</h3>
            <form onSubmit={handleCreateChild} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jméno a příjmení dítěte</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="např. Aneta Svobodová"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Datum narození</label>
                <input
                  type="date"
                  value={childBirthDate}
                  onChange={(e) => setChildBirthDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
                >
                  Uložit profil dítěte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEvtModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Naplánovat událost v kalendáři</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Název události</label>
                <input
                  type="text"
                  value={evtTitle}
                  onChange={(e) => setEvtTitle(e.target.value)}
                  placeholder="např. Předání dítěte před domem..."
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Datum a čas</label>
                <input
                  type="datetime-local"
                  value={evtDate}
                  onChange={(e) => setEvtDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategorie</label>
                <select
                  value={evtCategory}
                  onChange={(e) => setEvtCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="handover">Předání dítěte</option>
                  <option value="ospod">Jednání OSPOD</option>
                  <option value="court">Soudní jednání</option>
                  <option value="meeting">Konzultace</option>
                </select>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEvtModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
                >
                  Uložit událost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
