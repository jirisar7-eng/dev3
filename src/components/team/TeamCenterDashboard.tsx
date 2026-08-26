import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/apiClient';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  MessageSquare,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  UserPlus,
  Send,
  Lock,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  ChevronRight,
  Inbox,
  Sparkles,
  HelpCircle,
  FileText,
  Building2,
  Calendar,
  X,
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt?: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  assignedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedAt?: string | null;
  internalNotesCount?: number;
  _count?: {
    messages: number;
  };
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  _count?: {
    assignedTickets: number;
  };
}

interface TeamStats {
  totalOpen: number;
  unassignedTriage: number;
  myAssigned: number;
  resolvedCount: number;
  pendingSubjects: number;
  pendingReviews: number;
}

interface TeamCenterDashboardProps {
  onNavigate?: (path: string) => void;
  isEmbedded?: boolean;
}

export const TeamCenterDashboard: React.FC<TeamCenterDashboardProps> = ({
  onNavigate,
  isEmbedded = false,
}) => {
  const { currentUser, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'moderation' | 'volunteers' | 'knowledge'>('overview');
  const [ticketView, setTicketView] = useState<'my' | 'triage' | 'all'>('my');

  const [stats, setStats] = useState<TeamStats>({
    totalOpen: 0,
    unassignedTriage: 0,
    myAssigned: 0,
    resolvedCount: 0,
    pendingSubjects: 0,
    pendingReviews: 0,
  });

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reply / Note composer state
  const [replyContent, setReplyContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [newStatusOnReply, setNewStatusOnReply] = useState<string>('');
  const [sendingReply, setSendingReply] = useState(false);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const isCoordinatorOrAdmin =
    hasRole('ADMIN') ||
    hasRole('SUPER_ADMIN') ||
    hasRole('SYSTEM_ADMIN') ||
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'SUPER_ADMIN';

  // Load initial stats and data
  useEffect(() => {
    loadStats();
    loadVolunteers();
    loadKnowledge();
  }, []);

  useEffect(() => {
    if (activeTab === 'tickets') {
      loadTickets();
    }
  }, [activeTab, ticketView, statusFilter, categoryFilter, searchQuery]);

  const loadStats = async () => {
    try {
      const res = await apiFetch('/api/team/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn('Failed to load team stats:', err);
    }
  };

  const loadVolunteers = async () => {
    try {
      const res = await apiFetch('/api/team/volunteers');
      if (res.ok) {
        const data = await res.json();
        setVolunteers(data);
      }
    } catch (err) {
      console.warn('Failed to load volunteers:', err);
    }
  };

  const loadKnowledge = async () => {
    try {
      const res = await apiFetch('/api/team/knowledge');
      if (res.ok) {
        const data = await res.json();
        setKnowledgeItems(data);
      }
    } catch (err) {
      console.warn('Failed to load knowledge base:', err);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/team/tickets/assigned';
      if (ticketView === 'triage') {
        endpoint = '/api/team/tickets/triage';
      } else if (ticketView === 'all') {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        if (searchQuery) params.append('search', searchQuery);
        endpoint = `/api/team/tickets/all?${params.toString()}`;
      } else {
        if (statusFilter !== 'all') {
          endpoint += `?status=${statusFilter}`;
        }
      }

      const res = await apiFetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const openTicketDetail = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/api/team/tickets/${ticketId}`);
      if (res.ok) {
        const fullTicket = await res.json();
        setSelectedTicket(fullTicket);
        setReplyContent('');
        setIsInternalNote(false);
        setNewStatusOnReply(fullTicket.status);
      }
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    }
  };

  const handleSelfAssign = async (ticketId: string) => {
    try {
      const res = await apiFetch(`/api/team/tickets/${ticketId}/self-assign`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadStats();
        if (activeTab === 'tickets') await loadTickets();
        if (selectedTicket && selectedTicket.id === ticketId) {
          await openTicketDetail(ticketId);
        }
      }
    } catch (err) {
      console.error('Self-assign failed:', err);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket) return;
    setAssigning(true);
    try {
      const res = await apiFetch(`/api/team/tickets/${selectedTicket.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: selectedAssigneeId || null }),
      });
      if (res.ok) {
        setShowAssignModal(false);
        await loadStats();
        await loadTickets();
        await openTicketDetail(selectedTicket.id);
      }
    } catch (err) {
      console.error('Assign failed:', err);
    } finally {
      setAssigning(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent.trim()) return;

    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/team/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          isInternal: isInternalNote,
          newStatus: newStatusOnReply || undefined,
        }),
      });

      if (res.ok) {
        setReplyContent('');
        await openTicketDetail(selectedTicket.id);
        await loadStats();
      }
    } catch (err) {
      console.error('Send reply failed:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const res = await apiFetch(`/api/team/tickets/${selectedTicket.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await openTicketDetail(selectedTicket.id);
        await loadStats();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Nový / Otevřený</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">V řešení</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Vyřešen</span>;
      case 'closed':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Uzavřen</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">Vysoká</span>;
      case 'normal':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">Normální</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 text-slate-500 uppercase tracking-wider">Nízká</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${!isEmbedded ? 'max-w-7xl mx-auto px-4 py-8' : ''}`}>
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-300" />
                Spolkové centrum pomoci & koordinace
              </span>
              <span className="text-xs text-blue-300/80 font-medium">Fáze 4 • RBAC Team Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              🏛️ Team Center
            </h1>
            <p className="text-blue-200/90 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Pracovní prostředí pro mentory, dobrovolníky a koordinátory spolku. Správa klientských požadavků, moderace registru a vzájemná peer podpora.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
            <div className="text-right px-2">
              <div className="text-xs text-blue-200 font-medium">Přihlášený pracovník</div>
              <div className="text-sm font-bold text-white truncate max-w-[160px]">{currentUser?.name}</div>
              <div className="text-[10px] text-blue-300 font-mono font-bold uppercase">{currentUser?.role}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => { setActiveTab('overview'); setSelectedTicket(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-blue-900 shadow-md scale-102'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Přehled (Overview)
          </button>
          <button
            onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'tickets'
                ? 'bg-white text-blue-900 shadow-md scale-102'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Tikety & Podpora
            {stats.unassignedTriage > 0 && (
              <span className="ml-1.5 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black animate-pulse">
                {stats.unassignedTriage}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('volunteers'); setSelectedTicket(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'volunteers'
                ? 'bg-white text-blue-900 shadow-md scale-102'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Dobrovolnická síť
          </button>
          <button
            onClick={() => { setActiveTab('knowledge'); setSelectedTicket(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'knowledge'
                ? 'bg-white text-blue-900 shadow-md scale-102'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Znalostní báze & Metodiky
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 1. OVERVIEW TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moje přidělené tikety</div>
                <div className="text-2xl font-black text-blue-700 mt-1">{stats.myAssigned}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Aktivní požadavky v péči</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fronta Triage</div>
                <div className="text-2xl font-black text-amber-600 mt-1">{stats.unassignedTriage}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Čeká na přiřazení mentora</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Inbox className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vyřešené případy</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{stats.resolvedCount}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Úspěšně uzavřená pomoc</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivní tým spolku</div>
                <div className="text-2xl font-black text-purple-600 mt-1">{volunteers.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Mentorů a koordinátorů</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Quick Actions & Security Notice */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Rychlé operace & Akutní požadavky
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Níže naleznete doporučené kroky pro koordinaci peer podpory a správu příchozích případů.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setTicketView('triage');
                  }}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Inbox className="w-4 h-4 text-amber-600" />
                      Fronta Triage ({stats.unassignedTriage})
                    </span>
                    <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-amber-800/80">
                    Převezměte nepřiřazený klientský požadavek k okamžitému řešení.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('tickets');
                    setTicketView('my');
                  }}
                  className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Moje aktivní tikety ({stats.myAssigned})
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-[11px] text-blue-800/80">
                    Zkontrolujte své rozpracované případy a odpovězte rodičům v tísni.
                  </p>
                </button>
              </div>
            </div>

            {/* Security Isolation Protocol Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center mb-3 border border-blue-400/30">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">
                  Bezpečnostní protokol izolace spisů
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Týmová role neposkytuje plošný přístup k osobním spisům (Case) ani citlivým rodinným dokumentům. Všechny operace jsou striktně auditovány v souladu s GDPR.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                Least Privilege • Fail-Closed RBAC
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. TICKETS & SUPPORT TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tickets' && !selectedTicket && (
        <div className="space-y-6">
          {/* Sub-view switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setTicketView('my')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ticketView === 'my'
                    ? 'bg-white text-blue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Přiděleno mně ({stats.myAssigned})
              </button>
              <button
                onClick={() => setTicketView('triage')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  ticketView === 'triage'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fronta Triage ({stats.unassignedTriage})
              </button>
              {isCoordinatorOrAdmin && (
                <button
                  onClick={() => setTicketView('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    ticketView === 'all'
                      ? 'bg-white text-purple-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Všechny tikety ({stats.totalOpen})
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium"
              >
                <option value="all">Všechny stavy</option>
                <option value="open">Otevřené</option>
                <option value="in_progress">V řešení</option>
                <option value="resolved">Vyřešené</option>
                <option value="closed">Uzavřené</option>
              </select>

              <button
                onClick={loadTickets}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="Obnovit seznam"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                Načítám klientské požadavky...
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">Žádné tikety v této frontě</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {ticketView === 'triage'
                    ? 'Ve frontě Triage nejsou žádné nepřiřazené požadavky. Všechny případy jsou v péči mentorů.'
                    : 'V této kategorii nemáte v tuto chvíli žádné aktivní požadavky.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium">
                          {ticket.category}
                        </span>
                        {ticket.internalNotesCount && ticket.internalNotesCount > 0 ? (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            {ticket.internalNotesCount} poznámek
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {ticket.subject}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>Klient: <strong>{ticket.user?.name || 'Anonym'}</strong> ({ticket.user?.email})</span>
                        <span>•</span>
                        <span>
                          Řešitel:{' '}
                          {ticket.assignedTo ? (
                            <strong className="text-blue-700">{ticket.assignedTo.name}</strong>
                          ) : (
                            <span className="text-amber-600 font-bold">Nepřiřazeno (Triage)</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString('cs-CZ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!ticket.assignedToId && (
                        <button
                          onClick={() => handleSelfAssign(ticket.id)}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Převzít k řešení
                        </button>
                      )}

                      <button
                        onClick={() => openTicketDetail(ticket.id)}
                        className="px-4 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Otevřít detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TICKET DETAIL & REPLY VIEW */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'tickets' && selectedTicket && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedTicket(null);
                loadTickets();
              }}
              className="text-xs font-bold text-slate-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer"
            >
              ← Zpět na seznam tiketů
            </button>

            <div className="flex items-center gap-2">
              {isCoordinatorOrAdmin && (
                <button
                  onClick={() => {
                    setSelectedAssigneeId(selectedTicket.assignedToId || '');
                    setShowAssignModal(true);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Přiřadit / Přerozdělit
                </button>
              )}

              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-800 shadow-2xs"
              >
                <option value="open">Otevřený</option>
                <option value="in_progress">V řešení</option>
                <option value="resolved">Vyřešený</option>
                <option value="closed">Uzavřený</option>
              </select>
            </div>
          </div>

          {/* Ticket Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {selectedTicket.category}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ID: {selectedTicket.id}
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{selectedTicket.subject}</h2>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {selectedTicket.description}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Klient</span>
                <strong className="text-slate-900">{selectedTicket.user?.name}</strong> ({selectedTicket.user?.email})
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Přiřazený řešitel</span>
                {selectedTicket.assignedTo ? (
                  <strong className="text-blue-700">{selectedTicket.assignedTo.name} ({selectedTicket.assignedTo.role})</strong>
                ) : (
                  <span className="text-amber-600 font-bold">Nepřiřazeno</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Vytvořeno</span>
                <span>{new Date(selectedTicket.createdAt).toLocaleString('cs-CZ')}</span>
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Průběh komunikace & Interní poznámky
            </h3>

            <div className="space-y-4">
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                      msg.isInternal
                        ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                        : msg.user?.id === selectedTicket.userId
                        ? 'bg-slate-50 border-slate-200 text-slate-800'
                        : 'bg-blue-50/80 border-blue-200 text-blue-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-black/5">
                      <div className="flex items-center gap-2">
                        <strong className="font-bold">{msg.user?.name}</strong>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/60 font-mono font-bold">
                          {msg.user?.role}
                        </span>
                        {msg.isInternal && (
                          <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-black flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            INTERNÍ POZNÁMKA (Klient nevidí)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleString('cs-CZ')}
                      </span>
                    </div>

                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Zatím žádné další zprávy v tomto vlákně.
                </div>
              )}
            </div>

            {/* Composer */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className={isInternalNote ? 'text-amber-800 flex items-center gap-1 font-black' : ''}>
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      Uložit jako interní poznámku pro tým
                    </span>
                  </label>
                </div>

                <div className="text-[11px] text-slate-400">
                  {isInternalNote ? 'Tuto zprávu uvidí pouze ověření členové týmu.' : 'Tato odpověď bude odeslána klientovi.'}
                </div>
              </div>

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={
                  isInternalNote
                    ? 'Zadejte interní poznámku k případu (např. doporučený další postup, kontakt na OSPOD...)'
                    : 'Napište věcnou a empatickou odpověď pro klienta...'
                }
                rows={4}
                className={`w-full p-3.5 rounded-2xl border text-xs leading-relaxed focus:outline-none focus:ring-2 ${
                  isInternalNote
                    ? 'bg-amber-50/40 border-amber-300 focus:ring-amber-500'
                    : 'bg-white border-slate-200 focus:ring-blue-500'
                }`}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Nastavit stav na:</span>
                  <select
                    value={newStatusOnReply}
                    onChange={(e) => setNewStatusOnReply(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700"
                  >
                    <option value="">Ponechat stávající</option>
                    <option value="in_progress">V řešení</option>
                    <option value="resolved">Vyřešený</option>
                    <option value="closed">Uzavřený</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sendingReply || !replyContent.trim()}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer ${
                    isInternalNote
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-blue-800 hover:bg-blue-900 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingReply ? 'Ukládám...' : isInternalNote ? 'Uložit interní záznam' : 'Odeslat odpověď'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. VOLUNTEERS HUB TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'volunteers' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Aktivní dobrovolníci & Mentoring síť
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Přehled aktivních mentorů, jejich aktuálního vytížení a rolí.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {volunteers.map((v) => (
              <div
                key={v.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center border border-blue-200">
                    {v.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{v.name}</h3>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      {v.role}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>Aktivní tikety v péči:</span>
                  <strong className="text-blue-700 font-bold">{v._count?.assignedTickets || 0}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. KNOWLEDGE BASE TAB */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'knowledge' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Znalostní báze & Metodické postupy pro tým
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Doporučené krizové postupy, vzory podání a etický kodex dobrovolníka spolku.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {knowledgeItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {item.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Přiřadit / Přerozdělit tiket</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Vyberte člena týmu, který převezme odpovědnost za tento klientský požadavek.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Řešitel:</label>
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
              >
                <option value="">-- Nepřiřazeno (Vrátit do Triage) --</option>
                {volunteers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.role}) — {v._count?.assignedTickets || 0} aktivních tiketů
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                onClick={handleAssignTicket}
                disabled={assigning}
                className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                {assigning ? 'Ukládám...' : 'Potvrdit přiřazení'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCenterDashboard;
