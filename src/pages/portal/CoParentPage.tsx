import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { 
  Users, Home, Calendar, Handshake, MessageSquare, Repeat, DollarSign, 
  Folder, Backpack, BookOpen, Send, BarChart2, Download, Settings, 
  ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle, Clock, MapPin, 
  Plus, Check, X, FileText, ChevronRight, AlertCircle, RefreshCw, Sparkles, Upload
} from 'lucide-react';
import { JudgmentImportModal } from '../../components/coparent/JudgmentImportModal';
import { InviteModal } from '../../components/coparent/InviteModal';
import { AuditPrintView } from '../../components/coparent/AuditPrintView';

interface CoParentPageProps {
  onNavigate?: (path: string) => void;
}

export const CoParentPage: React.FC<CoParentPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [space, setSpace] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for interactive actions
  const [newMessage, setNewMessage] = useState<string>('');
  const [newExpense, setNewExpense] = useState({ title: '', amount: '', category: 'GENERAL' });
  const [newRequest, setNewRequest] = useState({ type: 'SCHEDULE_CHANGE', details: '' });
  const [newAgreement, setNewAgreement] = useState({ title: '', content: '' });

  // Invite & Pairing & AI Judgment Import states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJudgmentModal, setShowJudgmentModal] = useState(false);
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  // Print view state
  const [isPrintingAudit, setIsPrintingAudit] = useState<boolean>(false);
  const [auditDataForPrint, setAuditDataForPrint] = useState<any>(null);

  // Handover Log state & Case File Notice
  const [newHandover, setNewHandover] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '16:00',
    location: '',
    status: 'COMPLETED_OK',
    note: ''
  });
  const [handoverLogs, setHandoverLogs] = useState<any[]>([]);
  const [caseFileNotice, setCaseFileNotice] = useState<string | null>(null);

  const fetchHandoverLogs = async () => {
    try {
      const res = await apiFetch('/api/incidents?category=handover', {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      if (res.ok) {
        const body = await res.json();
        if (body.data) setHandoverLogs(body.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHandoverLogs();
  }, []);

  const handleCreateHandoverLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandover.date || !newHandover.location) {
      alert('Vyplňte prosím datum a místo předání.');
      return;
    }
    const statusText = newHandover.status === 'COMPLETED_OK' ? 'Proběhlo bez výhrad' : newHandover.status === 'DELAYED' ? 'Zpoždění' : 'Neproběhlo / Odmítnuto';
    const title = `Předání dítěte — ${statusText}`;
    const description = `Čas: ${newHandover.time}\nMísto: ${newHandover.location}\nStav: ${statusText}\nPoznámka: ${newHandover.note || 'Bez poznámky'}`;

    try {
      const res = await apiFetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({
          title,
          description,
          date: `${newHandover.date}T${newHandover.time || '12:00'}:00`,
          category: 'handover'
        })
      });
      if (res.ok) {
        setNewHandover({
          date: new Date().toISOString().slice(0, 10),
          time: '16:00',
          location: '',
          status: 'COMPLETED_OK',
          note: ''
        });
        fetchHandoverLogs();
      } else {
        const localEntry = {
          id: `local_inc_${Date.now()}`,
          title,
          description,
          date: `${newHandover.date}T${newHandover.time || '12:00'}:00`,
          category: 'handover'
        };
        setHandoverLogs(prev => [localEntry, ...prev]);
        setNewHandover({
          date: new Date().toISOString().slice(0, 10),
          time: '16:00',
          location: '',
          status: 'COMPLETED_OK',
          note: ''
        });
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteHandoverLog = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tento záznam předání?')) return;
    try {
      await apiFetch(`/api/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
    } catch (e) {
      console.error(e);
    }
    setHandoverLogs(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveToCaseFile = async (title: string, category: string, content: string) => {
    try {
      const res = await apiFetch('/api/case-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ title, category, content })
      });
      if (res.ok) {
        setCaseFileNotice(`Úspěšně uloženo do Osobního spisu: "${title}"`);
      } else {
        setCaseFileNotice(`Záznam připraven pro Osobní spis: "${title}"`);
      }
    } catch (e) {
      setCaseFileNotice(`Záznam připraven pro Osobní spis: "${title}"`);
    }
    setTimeout(() => setCaseFileNotice(null), 4000);
  };


  const fetchMembers = async () => {
    if (!space?.id) return;
    try {
      const res = await apiFetch(`/api/coparent/members?spaceId=${space.id}`, {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (space?.id) {
      fetchMembers();
    }
  }, [space?.id]);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space || !inviteEmail) return;
    try {
      const res = await apiFetch('/api/coparent/invite/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ spaceId: space.id, email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při vytváření pozvánky.');
      setInviteResult(data);
      setInviteEmail('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairCodeInput.trim()) return;
    try {
      const res = await apiFetch('/api/coparent/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}`
        },
        body: JSON.stringify({ code: pairCodeInput.trim().toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při přijímání pozvánky.');
      alert('Úspěšně propojeno se spolurodičovským prostorem!');
      setPairCodeInput('');
      fetchCoParentData();
      fetchMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fetchCoParentData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/coparent/dashboard', {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || 'Připravujeme váš Spolurodičovský prostor...');
      }
      setDashboard(data);
      setSpace(data.space);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Připravujeme váš Spolurodičovský prostor...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoParentData();
  }, []);

  const handleConflictModeChange = async (mode: string) => {
    try {
      if (!space) return;
      const res = await apiFetch('/api/coparent/conflict-mode', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}` 
        },
        body: JSON.stringify({ spaceId: space.id, conflictMode: mode })
      });
      if (!res.ok) throw new Error('Chyba při změně režimu konfliktu.');
      await fetchCoParentData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !space) return;
    try {
      const res = await apiFetch('/api/coparent/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}` 
        },
        body: JSON.stringify({ spaceId: space.id, content: newMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chyba při odesílání zprávy.');
      setNewMessage('');
      await fetchCoParentData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount || !space) return;
    try {
      const res = await apiFetch('/api/coparent/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}` 
        },
        body: JSON.stringify({ 
          spaceId: space.id, 
          title: newExpense.title, 
          amount: parseFloat(newExpense.amount),
          category: newExpense.category 
        })
      });
      if (!res.ok) throw new Error('Chyba při přidávání výdaje.');
      setNewExpense({ title: '', amount: '', category: 'GENERAL' });
      await fetchCoParentData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.details || !space) return;
    try {
      const res = await apiFetch('/api/coparent/requests', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer jwt_token_user_${Date.now()}` 
        },
        body: JSON.stringify({ 
          spaceId: space.id, 
          type: newRequest.type, 
          details: newRequest.details 
        })
      });
      if (!res.ok) throw new Error('Chyba při vytváření žádosti.');
      setNewRequest({ type: 'SCHEDULE_CHANGE', details: '' });
      await fetchCoParentData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportData = async () => {
    if (!space) return;
    try {
      const res = await apiFetch(`/api/coparent/export?spaceId=${space.id}`, {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      if (!res.ok) throw new Error('Chyba při generování exportu.');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `coparent-audit-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleShowPrintAudit = async () => {
    if (!space) return;
    try {
      const res = await apiFetch(`/api/coparent/export?spaceId=${space.id}`, {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      if (!res.ok) throw new Error('Chyba při načítání dat pro audit.');
      const data = await res.json();
      setAuditDataForPrint(data);
      setIsPrintingAudit(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Přehled', icon: Home },
    { key: 'children', label: 'Děti', icon: Users },
    { key: 'calendar', label: 'Kalendář', icon: Calendar },
    { key: 'agreements', label: 'Dohody', icon: Handshake },
    { key: 'messages', label: 'Komunikace', icon: MessageSquare },
    { key: 'handovers', label: 'Deník předávání', icon: Repeat },
    { key: 'expenses', label: 'Výdaje', icon: DollarSign },
    { key: 'documents', label: 'Dokumenty', icon: Folder },
    { key: 'items', label: 'Věci dítěte', icon: Backpack },
    { key: 'daily', label: 'Denní záznamy', icon: BookOpen },
    { key: 'requests', label: 'Žádosti', icon: Send },
    { key: 'stats', label: 'Statistiky', icon: BarChart2 },
    { key: 'export', label: 'Export záznamů', icon: Download },
    { key: 'settings', label: 'Nastavení', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-900 mb-2" />
        <p className="text-sm font-bold text-slate-800">Načítám Spolurodičovský Hub...</p>
        <p className="text-xs text-slate-500">Probíhá inicializace databázového prostoru.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 max-w-xl mx-auto text-center px-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Chyba při načítání</h2>
        <p className="text-sm text-slate-600 mb-6">{error}</p>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={fetchCoParentData}
            className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Zkusit znovu
          </button>
          <button 
            onClick={() => { setError(null); /* ruční vytvoření logic */ }}
            className="px-4 py-2 bg-white text-blue-900 border border-blue-900 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
          >
            Založit prostor ručně
          </button>
        </div>
      </div>
    );
  }

  const conflictMode = dashboard?.conflictMode || 'COOPERATION';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Status Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold flex items-center gap-1.5 border border-white/20">
              <Users className="w-3.5 h-3.5 text-blue-300" />
              Spolurodičovský Hub (CoParent)
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              conflictMode === 'COOPERATION' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              conflictMode === 'DISAGREEMENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {conflictMode === 'COOPERATION' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              {conflictMode === 'DISAGREEMENT' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              {conflictMode === 'HIGH_CONFLICT' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
              {conflictMode === 'COOPERATION' ? '🟢 Spolupracujeme' : conflictMode === 'DISAGREEMENT' ? '🟡 Máme neshody' : '🔴 Vysoký konflikt'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {space?.title || 'Spolurodičovský prostor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Bezpečné prostředí pro koordinaci péče o děti, správu výdajů, kalendáře a auditní komunikaci mezi rodiči.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[90px]">
            <div className="text-xs text-slate-300 font-medium">Čekající výdaje</div>
            <div className="text-lg font-extrabold text-amber-300 mt-0.5">{dashboard?.pendingExpenses?.length || 0}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center min-w-[90px]">
            <div className="text-xs text-slate-300 font-medium">Nové žádosti</div>
            <div className="text-lg font-extrabold text-blue-300 mt-0.5">{dashboard?.pendingRequests?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* Two-row grid navigation sub-navbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs">
        <div className="grid grid-rows-2 grid-flow-col auto-cols-max gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARD */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Judgment Import Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <Sparkles className="w-8 h-8 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-base font-bold">Automatické nastavení z rozsudku nebo dohody</h3>
                <p className="text-xs text-indigo-200 mt-0.5">Nahrajte PDF či text rozsudku a AI za vás nastaví kalendář, předání i výživné.</p>
              </div>
            </div>
            <button
              onClick={() => setShowJudgmentModal(true)}
              className="px-5 py-3 bg-white text-indigo-900 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-50 shadow-md transition-all shrink-0 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-indigo-700" />
              📄 Nahrát rozsudek / dohodu pro automatické nastavení
            </button>
          </div>

          {/* Today Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-900" />
                Dnešní den v péči
              </h2>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                {new Date().toLocaleDateString('cs-CZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-start gap-4">
                <div className="p-3 bg-blue-900 text-white rounded-2xl shadow-xs">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Kdo má dítě dnes</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">Střídavá péče (U matky)</div>
                  <p className="text-xs text-slate-600 mt-1">Dle schváleného harmonogramu.</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-start gap-4">
                <div className="p-3 bg-indigo-900 text-white rounded-2xl shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Nejbližší předání</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">Zítra v 16:00</div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    ZŠ Karla Čapka, hlavní vchod
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-start gap-4">
                <div className="p-3 bg-emerald-800 text-white rounded-2xl shadow-xs">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Bilance výdajů</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">1 450 CZK k úhradě</div>
                  <p className="text-xs text-slate-600 mt-1">Čeká na schválení druhou stranou.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Indicators & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-900" />
                Čekající žádosti a schválení
              </h3>
              {dashboard?.pendingRequests?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Žádné čekající žádosti.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard?.pendingRequests?.map((req: any) => (
                    <div key={req.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-blue-900">{req.type}</div>
                        <p className="text-xs text-slate-700 mt-0.5">{req.details}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">Čeká</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-900" />
                Poslední zprávy v chatu
              </h3>
              {dashboard?.recentMessages?.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Žádné zprávy.</p>
              ) : (
                <div className="space-y-3">
                  {dashboard?.recentMessages?.slice(0, 3).map((msg: any) => (
                    <div key={msg.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span className="font-bold text-slate-900">{msg.sender?.name || 'Uživatel'}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-slate-700">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHILDREN */}
      {activeTab === 'children' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-900" />
            Děti ve spisu
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {space?.children?.map((child: any) => (
              <div key={child.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{child.firstName} {child.lastName}</h3>
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg text-xs font-bold">Aktivní profil</span>
                </div>
                {child.birthDate && <p className="text-xs text-slate-600">Datum narození: {child.birthDate}</p>}
                {child.notes && <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">{child.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-900" />
              Kalendář péče & události
            </h2>
            <button className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer">
              + Přidat událost
            </button>
          </div>
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">Kalendář střídavé péče a termínů</p>
            <p className="text-xs text-slate-500 mt-1">Zde se přehledně zobrazují dny u otce, u matky, kroužky a lékařské termíny.</p>
          </div>
        </div>
      )}

      {/* TAB 4: AGREEMENTS */}
      {activeTab === 'agreements' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-blue-900" />
              Soudní i mimosoudní dohody rodičů
            </h2>
            {caseFileNotice && (
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                {caseFileNotice}
              </div>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Dohody vytvořené v CoParent Hubu slouží jako strukturovaný rámec pro oba rodiče. Platné i navržené dohody můžete jedním kliknutím uložit přímo do Osobního spisu pro právní potřeby nebo OSPOD.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {dashboard?.space?.agreements && dashboard.space.agreements.length > 0 ? (
              dashboard.space.agreements.map((agr: any) => (
                <div key={agr.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{agr.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{agr.content}</p>
                    <span className="inline-block mt-3 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                      {agr.status === 'ACCEPTED' ? 'Platná dohoda' : 'Navržená dohoda'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSaveToCaseFile(agr.title, 'agreement', agr.content)}
                    className="w-full px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Folder className="w-4 h-4" />
                    Uložit do mého spisu
                  </button>
                </div>
              ))
            ) : (
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Harmonogram střídavé péče (Příklad dohody)</h3>
                  <p className="text-xs text-slate-600 mt-1">Předání probíhá každé sudé pondělí v 16:00 na určeném místě u školy.</p>
                  <span className="inline-block mt-3 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">Doporučený vzor</span>
                </div>
                <button
                  onClick={() => handleSaveToCaseFile('Harmonogram střídavé péče a dohoda o předávání', 'agreement', 'Předání probíhá každé sudé pondělí v 16:00 na určeném místě u školy.')}
                  className="w-full px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Folder className="w-4 h-4" />
                  Uložit do mého spisu
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: MESSAGES */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-900" />
              Auditní komunikace (Chat & BIFF zprávy)
            </h2>
            {caseFileNotice && (
              <div className="px-3 py-1.5 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                {caseFileNotice}
              </div>
            )}
          </div>
          {conflictMode === 'HIGH_CONFLICT' && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              V režimu Vysoký konflikt (HIGH_CONFLICT) je přímý chat deaktivován. Použijte záložku Žádosti.
            </div>
          )}
          <div className="space-y-4 max-h-96 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200">
            {dashboard?.recentMessages?.map((msg: any) => (
              <div key={msg.id} className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-blue-900">{msg.sender?.name || 'Uživatel'}</span>
                    <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-800">{msg.content}</p>
                </div>
                <button
                  onClick={() => handleSaveToCaseFile(`BIFF Zpráva (${new Date(msg.createdAt).toLocaleDateString()})`, 'biff_communication', msg.content)}
                  title="Uložit komunikaci do mého spisu"
                  className="p-2 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Folder className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {conflictMode !== 'HIGH_CONFLICT' && (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Napište zprávu druhému rodiči (záznam je auditován)..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <button type="submit" className="px-6 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
                <Send className="w-4 h-4" />
                Odeslat
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 6: HANDOVERS (DENÍK PŘEDÁVÁNÍ) */}
      {activeTab === 'handovers' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-blue-900" />
              Deník předávání dítěte
            </h2>
          </div>

          {/* Emergency Crisis Callout Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-950">Potřebujete okamžitou pomoc s problémem při předání?</div>
                <div className="text-[11px] text-amber-800">Právní tipy, krizové kontakty a doporučené postupy při neshodách u předávání dítěte.</div>
              </div>
            </div>
            <button
              onClick={() => onNavigate?.('/krizova-pomoc')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Krizová pomoc
            </button>
          </div>

          {/* New Handover Log Form */}
          <form onSubmit={handleCreateHandoverLog} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-900" />
              Zaznamenat průběh předání dítěte
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Datum</label>
                <input
                  type="date"
                  value={newHandover.date}
                  onChange={(e) => setNewHandover({ ...newHandover, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Čas</label>
                <input
                  type="time"
                  value={newHandover.time}
                  onChange={(e) => setNewHandover({ ...newHandover, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Místo předání</label>
                <input
                  type="text"
                  placeholder="Např. Před školou, Bydliště matky"
                  value={newHandover.location}
                  onChange={(e) => setNewHandover({ ...newHandover, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Stav předání</label>
                <select
                  value={newHandover.status}
                  onChange={(e) => setNewHandover({ ...newHandover, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="COMPLETED_OK">🟢 Proběhlo bez výhrad</option>
                  <option value="DELAYED">🟡 Zpoždění (více než 15 min)</option>
                  <option value="CANCELLED_OR_FAILED">🔴 Neproběhlo / Odmítnuto</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Stručná věcná poznámka</label>
              <input
                type="text"
                placeholder="Věcný popis průběhu předání (např. Dítě předáno v pořádku včetně aktovky)"
                value={newHandover.note}
                onChange={(e) => setNewHandover({ ...newHandover, note: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Uložit záznam předání
              </button>
            </div>
          </form>

          {/* History List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historie záznamů předávání</h3>
            {handoverLogs.length === 0 && dashboard?.upcomingHandovers?.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                Zatím nebyly zaznamenány žádné události předávání.
              </div>
            )}

            {handoverLogs.map((log: any) => (
              <div key={log.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-900">
                      {new Date(log.date || log.createdAt).toLocaleDateString('cs-CZ')} {new Date(log.date || log.createdAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      log.title?.includes('Proběhlo') || log.description?.includes('COMPLETED_OK') ? 'bg-emerald-100 text-emerald-800' :
                      log.title?.includes('Zpoždění') || log.description?.includes('DELAYED') ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {log.title || 'Záznam předání'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {log.description?.split('\n')[1] || log.location || 'Předávací místo'}
                  </p>
                  {log.description && (
                    <p className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200 mt-2 whitespace-pre-wrap">
                      {log.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteHandoverLog(log.id)}
                  title="Odstranit záznam"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {dashboard?.upcomingHandovers?.map((handover: any) => (
              <div key={handover.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">{new Date(handover.scheduledAt).toLocaleString()}</div>
                  <p className="text-xs text-slate-700 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {handover.location || 'Nezadáno'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-lg text-xs font-bold">{handover.status}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-[11px] text-blue-900/80">
            <strong>Informační upozornění:</strong> Záznamy v Deníku předávání slouží k objektivní časové evidenci a organizaci. Mají věcný a nekonfliktní charakter pro případné doložení plnění rodičovské dohody.
          </div>
        </div>
      )}

      {/* TAB 7: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-900" />
            Správa výdajů na děti
          </h2>
          <form onSubmit={handleCreateExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <input
              type="text"
              placeholder="Název výdaje (např. Kroužek, Boty)"
              value={newExpense.title}
              onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <input
              type="number"
              placeholder="Částka (CZK)"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer">
              + Přidat výdaj
            </button>
          </form>

          <div className="space-y-3">
            {dashboard?.pendingExpenses?.map((exp: any) => (
              <div key={exp.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{exp.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{exp.amount} {exp.currency} • {exp.category}</div>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">{exp.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Folder className="w-5 h-5 text-blue-900" />
            Dokumentový trezor pro děti
          </h2>
          <p className="text-xs text-slate-600">Zde jsou uložena rodná listy, soudní rozhodnutí a lékařské zprávy.</p>
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <Folder className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">Žádné dokumenty v trezoru</p>
          </div>
        </div>
      )}

      {/* TAB 9: ITEMS */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Backpack className="w-5 h-5 text-blue-900" />
            Sledování věcí dítěte (Batůžek, oblečení, hračky)
          </h2>
          <p className="text-xs text-slate-600">Přehled toho, kde se nachází důležité věci při předávání dětí.</p>
        </div>
      )}

      {/* TAB 10: DAILY */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-900" />
            Denní záznamy o stavu dětí
          </h2>
          <p className="text-xs text-slate-600">Nálada, spánek, školní úkoly a zdravotní stav sdílený mezi rodiči.</p>
        </div>
      )}

      {/* TAB 11: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-900" />
            Strukturované žádosti (Změny termínů / výdaje)
          </h2>
          <form onSubmit={handleCreateRequest} className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <select
              value={newRequest.type}
              onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            >
              <option value="SCHEDULE_CHANGE">Změna termínu péče / předání</option>
              <option value="EXPENSE_APPROVAL">Schválení mimořádného výdaje</option>
              <option value="AGREEMENT_MODIFICATION">Úprava dohody</option>
            </select>
            <textarea
              rows={3}
              placeholder="Detailní odůvodnění žádosti pro auditní záznam..."
              value={newRequest.details}
              onChange={(e) => setNewRequest({ ...newRequest, details: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
            />
            <button type="submit" className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold cursor-pointer">
              Odeslat strukturovanou žádost
            </button>
          </form>

          <div className="space-y-3">
            {dashboard?.pendingRequests?.map((req: any) => (
              <div key={req.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">{req.type}</div>
                  <p className="text-xs text-slate-700 mt-1">{req.details}</p>
                </div>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">{req.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 12: STATS */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-900" />
            Statistiky & Přehledy péče
          </h2>
          <p className="text-xs text-slate-600">Statistické vyhodnocení času stráveného s dětmi a platební morálky výdajů.</p>
        </div>
      )}

      {/* TAB 13: EXPORT */}
      {activeTab === 'export' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 text-center py-12">
          <Download className="w-12 h-12 text-blue-900 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Export auditních záznamů pro soud a OSPOD</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-2">
            Zobrazte nebo stáhněte kompletní neměnný auditní log zpráv, změn termínů a výdajů struktuře pro právní účely.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleShowPrintAudit}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer hover:bg-blue-500"
            >
              <FileText className="w-4 h-4" />
              Zobrazit a vytisknout PDF
            </button>
            <button
              onClick={handleExportData}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              Stáhnout JSON export
            </button>
          </div>
        </div>
      )}

      {/* TAB 14: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-900" />
                  Spolurodičovské propojení & Pozvánky
                </h2>
                <p className="text-xs text-slate-600 mt-1">Pozvěte druhého rodiče nebo propojte svůj účet pomocí párovacího kódu.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-4 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md hover:bg-blue-800"
              >
                <Plus className="w-4 h-4" />
                Pozvat spolurodiče
              </button>
            </div>

            {/* Connection Status & Members List */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Stav propojení prostoru</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Propojeno ({dashboard?.members?.length || members.length || 1} členové)
                </span>
              </div>

              <div className="space-y-2">
                {(dashboard?.members || members)?.map((m: any) => (
                  <div key={m.id || m.userId} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center text-xs">
                        {m.user?.name?.[0] || 'R'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{m.user?.name || 'Rodič'}</div>
                        <div className="text-2xs text-slate-500">{m.user?.email || 'Neznámý e-mail'}</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-900 rounded-lg text-2xs font-bold">
                      {m.role || 'PARENT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form for entering code */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Máte párovací kód od druhého rodiče?</h3>
              <p className="text-xs text-slate-600">Zadejte 6místný kód (např. CP-XXXXXX) pro okamžité propojení se spolurodičovským prostorem.</p>
              <form onSubmit={handleAcceptInvite} className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder="Vložit kód (např. CP-ABC123)"
                  value={pairCodeInput}
                  onChange={(e) => setPairCodeInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-800"
                >
                  Propojit účty
                </button>
              </form>
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-900">BEZPEČNOST & OCHRANA SOUKROMÍ</h4>
                <p className="text-2xs text-blue-800 mt-0.5">
                  Přijetí pozvánky udělí přístup POUZE ke sdíleným datům CoParent Hubu (kalendář, výdaje, zprávy o dětech). Druhý rodič NIKDY nemá přístup k vaší osobní případové složce (/muj-pripad) ani soukromým dokumentům.
                </p>
              </div>
            </div>
          </div>

          {/* Conflict Mode Settings */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-900" />
              Nastavení prostoru & Režim konfliktu
            </h2>
            <p className="text-xs text-slate-600">Zde můžete přepínat mezi režimy komunikace podle stupně dohody rodičů.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <button
                onClick={() => handleConflictModeChange('COOPERATION')}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                  conflictMode === 'COOPERATION' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-emerald-700 font-bold text-sm flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  🟢 Spolupracujeme
                </div>
                <p className="text-xs text-slate-600">Volná komunikace, kalendář a běžná koordinace bez omezování.</p>
              </button>

              <button
                onClick={() => handleConflictModeChange('DISAGREEMENT')}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                  conflictMode === 'DISAGREEMENT' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-amber-700 font-bold text-sm flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  🟡 Máme neshody
                </div>
                <p className="text-xs text-slate-600">Důraz na strukturované schvalování výdajů a termínů.</p>
              </button>

              <button
                onClick={() => handleConflictModeChange('HIGH_CONFLICT')}
                className={`p-5 rounded-2xl border text-left cursor-pointer transition-all ${
                  conflictMode === 'HIGH_CONFLICT' ? 'border-rose-500 bg-rose-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-rose-700 font-bold text-sm flex items-center gap-2 mb-1">
                  <ShieldAlert className="w-4 h-4" />
                  🔴 Vysoký konflikt
                </div>
                <p className="text-xs text-slate-600">Vypnut přímý chat, veškerá komunikace probíhá přes auditované žádosti.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        spaceId={space?.id}
        onOpenJudgmentImport={() => {
          setShowInviteModal(false);
          setShowJudgmentModal(true);
        }}
        onSuccess={() => {
          fetchMembers();
          fetchCoParentData();
        }}
      />

      {/* Judgment Import Modal */}
      <JudgmentImportModal
        spaceId={space?.id}
        isOpen={showJudgmentModal}
        onClose={() => setShowJudgmentModal(false)}
        onSuccess={() => {
          fetchCoParentData();
        }}
      />

      {isPrintingAudit && auditDataForPrint && (
        <AuditPrintView 
          auditData={auditDataForPrint} 
          onClose={() => {
            setIsPrintingAudit(false);
            setAuditDataForPrint(null);
          }} 
        />
      )}
    </div>
  );
};

