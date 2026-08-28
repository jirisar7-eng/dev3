import { apiFetch } from '../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClientCase, CaseChild, CaseEvent, CaseTask, CaseDeadline, CaseNote, CaseEvidence, CaseParticipant, CareArrangement } from '../types';
import {
  Briefcase,
  Baby,
  Calendar,
  FileText,
  Clock,
  Scale,
  CheckSquare,
  Search,
  ShieldCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Lock,
  Sparkles,
} from 'lucide-react';

import { CaseOverviewTab } from '../components/case/CaseOverviewTab';
import { CaseChildrenTab } from '../components/case/CaseChildrenTab';
import { CaseCalendarTab } from '../components/case/CaseCalendarTab';
import { CaseDocumentsTab } from '../components/case/CaseDocumentsTab';
import { CaseEventsTab } from '../components/case/CaseEventsTab';
import { CaseProceedingsTab } from '../components/case/CaseProceedingsTab';
import { CaseTasksTab } from '../components/case/CaseTasksTab';
import { CaseNotesTab } from '../components/case/CaseNotesTab';
import { CaseEvidenceTab } from '../components/case/CaseEvidenceTab';
import { CaseTimelineTab } from '../components/case/CaseTimelineTab';
import { CaseSecurityTab } from '../components/case/CaseSecurityTab';
import { OfflineVaultSyncTab } from '../components/case/OfflineVaultSyncTab';
import { CareHubTab } from '../components/case/care/CareHubTab';
import { CareJudgmentImportModal } from '../components/case/care/CareJudgmentImportModal';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Database, Wifi, WifiOff, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

export type CaseTabKey =
  | 'overview'
  | 'care'
  | 'children'
  | 'calendar'
  | 'documents'
  | 'events'
  | 'proceedings'
  | 'tasks'
  | 'notes'
  | 'evidence'
  | 'timeline'
  | 'security'
  | 'offline-sync';

interface MyCasePageProps {
  onNavigate?: (path: string) => void;
}

export const MyCasePage: React.FC<MyCasePageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const offlineSync = useOfflineSync({ autoSyncOnOnline: true });
  const [activeTab, setActiveTab] = useState<CaseTabKey>('overview');
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [activeCase, setActiveCase] = useState<ClientCase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingCase, setIsCreatingCase] = useState<boolean>(false);
  const [isJudgmentImportOpen, setIsJudgmentImportOpen] = useState<boolean>(false);
  const [newCaseTitle, setNewCaseTitle] = useState<string>('');
  const [newCaseNumber, setNewCaseNumber] = useState<string>('');
  const [newCourt, setNewCourt] = useState<string>('');

  const token = localStorage.getItem('tatovacesta_auth_token');
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
  }

  const loadCases = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/cases', { credentials: 'include', headers: authHeaders });
      if (!res.ok) {
        throw new Error(`Nepodařilo se načíst spisy (kód: ${res.status})`);
      }
      const _resData = await res.json();
      const data: ClientCase[] = _resData.success ? _resData.data : _resData;
      setCases(data);
      if (data.length > 0) {
        // preserve selected case or pick first
        setActiveCase((prev) => (prev ? data.find((c) => c.id === prev.id) || data[0] : data[0]));
      } else {
        setActiveCase(null);
      }
    } catch (err: any) {
      console.error('Chyba načítání spisu:', err);
      setError(err.message || 'Chyba serveru při načítání spisu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [currentUser?.id]);

  // Case creation
  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim()) return;
    try {
      const res = await apiFetch('/api/cases', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: newCaseTitle,
          caseNumber: newCaseNumber,
          court: newCourt,
        }),
      });
      if (!res.ok) throw new Error('Chyba při zakládání spisu.');
      const result = await res.json();
    const created = result.success ? result.data : result;
      setCases((prev) => [created, ...prev]);
      setActiveCase(created);
      setIsCreatingCase(false);
      setNewCaseTitle('');
      setNewCaseNumber('');
      setNewCourt('');
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    }
  };

  // Case update
  const handleUpdateCase = async (data: Partial<ClientCase>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Chyba aktualizace spisu.');
    const result = await res.json();
    const updated = result.success ? result.data : result;
    setActiveCase(updated);
    setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Child handlers
  const handleAddChild = async (childData: Partial<CaseChild>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/children`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(childData),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat dítě.');
    const result = await res.json();
    const newChild = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      children: [...(activeCase.children || []), newChild],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleUpdateChild = async (childId: string, childData: Partial<CaseChild>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/children/${childId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(childData),
    });
    if (!res.ok) throw new Error('Nepodařilo se upravit dítě.');
    const result = await res.json();
    const updatedChild = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      children: (activeCase.children || []).map((c) => (c.id === childId ? updatedChild : c)),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteChild = async (childId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/children/${childId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat dítě.');
    const updatedCase = {
      ...activeCase,
      children: (activeCase.children || []).filter((c) => c.id !== childId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Event handlers
  const handleAddEvent = async (eventData: Partial<CaseEvent>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/events`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat událost.');
    const result = await res.json();
    const newEvt = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      events: [...(activeCase.events || []), newEvt],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/events/${eventId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat událost.');
    const updatedCase = {
      ...activeCase,
      events: (activeCase.events || []).filter((e) => e.id !== eventId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Document upload
  const handleUploadDoc = async (docData: {
    fileName: string;
    fileData?: string;
    category: string;
    notes?: string;
    mimeType?: string;
  }) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/documents`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(docData),
    });
    if (!res.ok) throw new Error('Nepodařilo se nahrát dokument.');
    const result = await res.json();
    const newDoc = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      documents: [newDoc, ...(activeCase.documents || [])],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/documents/${docId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat dokument.');
    const updatedCase = {
      ...activeCase,
      documents: (activeCase.documents || []).filter((d) => d.id !== docId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Participant handlers
  const handleAddParticipant = async (pData: Partial<CaseParticipant>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/participants`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(pData),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat účastníka.');
    const result = await res.json();
    const newP = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      participants: [...(activeCase.participants || []), newP],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleUpdateParticipant = async (id: string, pData: Partial<CaseParticipant>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/participants/${id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(pData),
    });
    if (!res.ok) throw new Error('Nepodařilo se upravit účastníka.');
    const result = await res.json();
    const updatedP = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      participants: (activeCase.participants || []).map((p) => (p.id === id ? updatedP : p)),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/participants/${id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat účastníka.');
    const updatedCase = {
      ...activeCase,
      participants: (activeCase.participants || []).filter((p) => p.id !== id),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Task & Deadline handlers
  const handleAddTask = async (tData: Partial<CaseTask>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/tasks`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(tData),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat úkol.');
    const result = await res.json();
    const newT = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      tasks: [newT, ...(activeCase.tasks || [])],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleUpdateTask = async (taskId: string, tData: Partial<CaseTask>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(tData),
    });
    if (!res.ok) throw new Error('Nepodařilo se upravit úkol.');
    const result = await res.json();
    const updatedT = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      tasks: (activeCase.tasks || []).map((t) => (t.id === taskId ? updatedT : t)),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat úkol.');
    const updatedCase = {
      ...activeCase,
      tasks: (activeCase.tasks || []).filter((t) => t.id !== taskId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleAddDeadline = async (dlData: Partial<CaseDeadline>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/deadlines`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(dlData),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat lhůtu.');
    const result = await res.json();
    const newDl = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      deadlines: [...(activeCase.deadlines || []), newDl],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleToggleDeadline = async (dlId: string) => {
    if (!activeCase) return;
    const target = (activeCase.deadlines || []).find((d) => d.id === dlId);
    if (!target) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/deadlines/${dlId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ isCompleted: !target.isCompleted }),
    });
    if (!res.ok) throw new Error('Nepodařilo se změnit stav lhůty.');
    const result = await res.json();
    const updatedDl = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      deadlines: (activeCase.deadlines || []).map((d) => (d.id === dlId ? updatedDl : d)),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteDeadline = async (dlId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/deadlines/${dlId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat lhůtu.');
    const updatedCase = {
      ...activeCase,
      deadlines: (activeCase.deadlines || []).filter((d) => d.id !== dlId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Note handlers
  const handleAddNote = async (nData: Partial<CaseNote>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/notes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(nData),
    });
    if (!res.ok) throw new Error('Nepodařilo se přidat poznámku.');
    const result = await res.json();
    const newN = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      notes: [newN, ...(activeCase.notes || [])],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleUpdateNote = async (noteId: string, nData: Partial<CaseNote>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/notes/${noteId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(nData),
    });
    if (!res.ok) throw new Error('Nepodařilo se upravit poznámku.');
    const result = await res.json();
    const updatedN = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      notes: (activeCase.notes || []).map((n) => (n.id === noteId ? updatedN : n)),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/notes/${noteId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se smazat poznámku.');
    const updatedCase = {
      ...activeCase,
      notes: (activeCase.notes || []).filter((n) => n.id !== noteId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  // Evidence handlers
  const handleAddEvidence = async (eviData: Partial<CaseEvidence>) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/evidence`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(eviData),
    });
    if (!res.ok) throw new Error('Nepodařilo se zařadit důkaz.');
    const result = await res.json();
    const newEvi = result.success ? result.data : result;
    const updatedCase = {
      ...activeCase,
      evidence: [newEvi, ...(activeCase.evidence || [])],
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  const handleDeleteEvidence = async (eviId: string) => {
    if (!activeCase) return;
    const res = await apiFetch(`/api/cases/${activeCase.id}/evidence/${eviId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    if (!res.ok) throw new Error('Nepodařilo se vyřadit důkaz.');
    const updatedCase = {
      ...activeCase,
      evidence: (activeCase.evidence || []).filter((ev) => ev.id !== eviId),
    };
    setActiveCase(updatedCase);
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  if (!currentUser) {
    return (
      <div className="py-20 max-w-xl mx-auto text-center px-4">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-200 shadow-xs">
          <Lock className="w-8 h-8 text-blue-900" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Osobní klientská složka otce</h2>
        <p className="text-sm text-slate-600 mb-6">Pro přístup k vašemu spisu a důkazním materiálům se prosím přihlaste.</p>
        <button
          onClick={() => (onNavigate ? onNavigate('/login') : (window.location.href = '/login'))}
          className="px-6 py-3 rounded-xl bg-blue-900 text-white font-bold text-sm hover:bg-blue-800 transition-all shadow-md cursor-pointer"
        >
          Přihlásit se k účtu
        </button>
      </div>
    );
  }

  const tabItems: Array<{ key: CaseTabKey; label: string; icon: React.ReactNode; count?: number }> = [
    { key: 'overview', label: 'Přehled spisu', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'care', label: 'Péče & Harmonogram', icon: <Sparkles className="w-4 h-4 text-amber-500" /> },
    { key: 'children', label: 'Děti ve spisu', icon: <Baby className="w-4 h-4" />, count: activeCase?.children?.length },
    { key: 'calendar', label: 'Kalendář péče', icon: <Calendar className="w-4 h-4" />, count: activeCase?.events?.length },
    { key: 'documents', label: 'Trezor dokumentů', icon: <FileText className="w-4 h-4" />, count: activeCase?.documents?.length },
    { key: 'events', label: 'Deník & Incidenty', icon: <Clock className="w-4 h-4" /> },
    { key: 'proceedings', label: 'Soud & OSPOD', icon: <Scale className="w-4 h-4" />, count: activeCase?.participants?.length },
    { key: 'tasks', label: 'Úkoly & Lhůty', icon: <CheckSquare className="w-4 h-4" />, count: (activeCase?.tasks?.length || 0) + (activeCase?.deadlines?.length || 0) },
    { key: 'notes', label: 'Strategické zápisy', icon: <FileText className="w-4 h-4" />, count: activeCase?.notes?.length },
    { key: 'evidence', label: 'Katalog důkazů', icon: <Search className="w-4 h-4" />, count: activeCase?.evidence?.length },
    { key: 'timeline', label: 'Časová osa', icon: <Clock className="w-4 h-4" /> },
    { key: 'security', label: 'Zabezpečení & Export', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'offline-sync', label: 'Offline Trezor & Sync', icon: <Database className="w-4 h-4 text-blue-600" />, count: offlineSync.queue.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black shadow-sm">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">
                {activeCase ? activeCase.title : 'Osobní klientská složka otce'}
              </h1>
              {activeCase?.caseNumber && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {activeCase.caseNumber}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Přihlášen: <strong className="text-slate-800">{currentUser.name}</strong> • Zabezpečená složka spisové agendy
            </p>
          </div>
        </div>

        {/* Case Selector and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {cases.length > 1 && (
            <select
              value={activeCase?.id || ''}
              onChange={(e) => {
                const found = cases.find((c) => c.id === e.target.value);
                if (found) setActiveCase(found);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-hidden"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  📁 {c.title} ({c.caseNumber || 'bez sp. zn.'})
                </option>
              ))}
            </select>
          )}

          
          {/* Rozbalitelný detail (Dropdown) pro stav synchronizace */}
          <div className="relative group">
            <button
              onClick={() => setActiveTab('offline-sync')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : (offlineSync.syncStatus === 'OFFLINE' || offlineSync.queue.length > 0)
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  : offlineSync.syncStatus === 'SYNCHRONIZUJE'
                  ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  : offlineSync.syncStatus === 'KONFLIKT'
                  ? 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
              }`}
              title="Stav offline synchronizace"
            >
              {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : offlineSync.syncStatus === 'OFFLINE' || offlineSync.syncStatus === 'ČEKÁ NA PŘIPOJENÍ' ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
              ) : offlineSync.syncStatus === 'SYNCHRONIZUJE' ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : offlineSync.syncStatus === 'KONFLIKT' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-purple-600" />
              ) : offlineSync.queue.length > 0 ? (
                 <Clock className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className="hidden sm:inline">
                {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0 && 'Synchronizováno'}
                {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length > 0 && 'Čeká na synchronizaci'}
                {(offlineSync.syncStatus === 'OFFLINE' || offlineSync.syncStatus === 'ČEKÁ NA PŘIPOJENÍ') && 'Offline'}
                {offlineSync.syncStatus === 'SYNCHRONIZUJE' && 'Synchronizace...'}
                {offlineSync.syncStatus === 'KONFLIKT' && 'Konflikt'}
                {offlineSync.syncStatus === 'CHYBA' && 'Chyba'}
              </span>
              {offlineSync.queue.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white">
                  {offlineSync.queue.length}
                </span>
              )}
            </button>
            
            {/* Popover na hover (Rozbalitelný detail) */}
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                Stav synchronizace
              </h4>
              <div className="space-y-2 text-xs text-slate-600 mb-3">
                <p>
                  <strong>Stav:</strong> {offlineSync.syncStatus === 'ONLINE' && offlineSync.queue.length === 0 ? 'Všechny změny jsou odeslány na server.' : offlineSync.queue.length > 0 ? 'Existují změny uložené pouze lokálně.' : 'Offline režim.'}
                </p>
                <p>
                  <strong>Čekající změny:</strong> {offlineSync.queue.length}
                </p>
                {offlineSync.lastSyncTime && (
                  <p>
                    <strong>Poslední sync:</strong> {new Date(offlineSync.lastSyncTime).toLocaleTimeString('cs-CZ')}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTab('offline-sync');
                }}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-colors"
              >
                Otevřít přehled synchronizace
              </button>
            </div>
          </div>


          <button
            onClick={() => setIsCreatingCase(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nový spis
          </button>

          <button
            onClick={loadCases}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Aktualizovat data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Case Creation Modal */}
      {isCreatingCase && (
        <form
          onSubmit={handleCreateCase}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              Založit nový právní spis
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingCase(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Název spisu *
              </label>
              <input
                type="text"
                required
                value={newCaseTitle}
                onChange={(e) => setNewCaseTitle(e.target.value)}
                placeholder="např. Opatrovnické řízení o péči – syn Jakub"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Spisová značka
              </label>
              <input
                type="text"
                value={newCaseNumber}
                onChange={(e) => setNewCaseNumber(e.target.value)}
                placeholder="např. 15 P 12/2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Příslušný soud
              </label>
              <input
                type="text"
                value={newCourt}
                onChange={(e) => setNewCourt(e.target.value)}
                placeholder="např. Obvodní soud pro Prahu 4"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreatingCase(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer"
            >
              Vytvořit spis
            </button>
          </div>
        </form>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs grid grid-rows-2 grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.key
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && tab.count > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{error} (Aplikace běží v bezpečném lokálním režimu)</span>
        </div>
      )}

      {/* Tab Content */}
      {activeCase ? (
        <div>
          {activeTab === 'overview' && (
            <CaseOverviewTab
              activeCase={activeCase}
              onTabChange={(t) => setActiveTab(t as CaseTabKey)}
              onOpenNewEvent={() => setActiveTab('events')}
              onOpenNewTask={() => setActiveTab('tasks')}
              onOpenNewDoc={() => setActiveTab('documents')}
              onOpenNewDeadline={() => setActiveTab('tasks')}
              onOpenJudgmentImport={() => setIsJudgmentImportOpen(true)}
            />
          )}

          {activeTab === 'care' && (
            <CareHubTab
              activeCase={activeCase}
              onRefreshCase={loadCases}
            />
          )}

          {activeTab === 'children' && (
            <CaseChildrenTab
              activeCase={activeCase}
              onAddChild={handleAddChild}
              onUpdateChild={handleUpdateChild}
              onDeleteChild={handleDeleteChild}
            />
          )}

          {activeTab === 'calendar' && (
            <CaseCalendarTab
              activeCase={activeCase}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === 'documents' && (
            <CaseDocumentsTab
              activeCase={activeCase}
              onUploadDoc={handleUploadDoc}
              onDeleteDoc={handleDeleteDoc}
            />
          )}

          {activeTab === 'events' && (
            <CaseEventsTab
              activeCase={activeCase}
              onAddEvent={handleAddEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeTab === 'proceedings' && (
            <CaseProceedingsTab
              activeCase={activeCase}
              onUpdateCase={handleUpdateCase}
              onAddParticipant={handleAddParticipant}
              onUpdateParticipant={handleUpdateParticipant}
              onDeleteParticipant={handleDeleteParticipant}
              onAddCareArrangement={async () => {}}
            />
          )}

          {activeTab === 'tasks' && (
            <CaseTasksTab
              activeCase={activeCase}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddDeadline={handleAddDeadline}
              onToggleDeadline={handleToggleDeadline}
              onDeleteDeadline={handleDeleteDeadline}
            />
          )}

          {activeTab === 'notes' && (
            <CaseNotesTab
              activeCase={activeCase}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'evidence' && (
            <CaseEvidenceTab
              activeCase={activeCase}
              onAddEvidence={handleAddEvidence}
              onDeleteEvidence={handleDeleteEvidence}
            />
          )}

          {activeTab === 'timeline' && <CaseTimelineTab activeCase={activeCase} />}

          {activeTab === 'security' && <CaseSecurityTab activeCase={activeCase} />}

          {activeTab === 'offline-sync' && (
            <OfflineVaultSyncTab activeCase={activeCase} syncHook={offlineSync} />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Zatím nemáte založený žádný spis</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Založte svůj první případ pro evidenci dětí, soudních stání, zpráv OSPOD a důkazních materiálů.
          </p>
          <button
            onClick={() => setIsCreatingCase(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
          >
            Založit první spis
          </button>
        </div>
      )}

      {activeCase && (
        <CareJudgmentImportModal
          isOpen={isJudgmentImportOpen}
          onClose={() => setIsJudgmentImportOpen(false)}
          caseId={activeCase.id}
          childrenList={activeCase.children || []}
          onImportPlan={loadCases}
        />
      )}
    </div>
  );
};
