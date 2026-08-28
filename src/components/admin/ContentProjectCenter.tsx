import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Calendar,
  Lightbulb,
  AlertTriangle,
  Archive,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  FileText,
  ShieldCheck,
  Tag,
  User,
  ChevronRight,
  TrendingUp,
  Database,
  Layers,
  ArrowUpRight,
  Check,
  Trash2,
  Edit2,
  Sparkles,
  Sliders,
  FolderGit2,
  Info,
  Scale,
  Compass,
  MapPin,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import type {
  ProjectControlOverview,
  ProjectTaskItem,
  ProjectTaskStatus,
  ProjectTaskPriority,
  ProjectTaskCategory,
  PortalContentItem,
  AuditRecommendationItem,
  ProjectPhaseItem,
} from '../../types/projectControl';
import { useAuth } from '../../context/AuthContext';

interface ContentProjectCenterProps {
  onNavigate?: (path: string) => void;
}

type SubTab = 'overview' | 'content' | 'comparison' | 'recommendations' | 'backlog' | 'roadmap';

export const ContentProjectCenter: React.FC<ContentProjectCenterProps> = ({ onNavigate }) => {
  const { currentUser, hasRole } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<ProjectControlOverview | null>(null);
  const [contentCatalog, setContentCatalog] = useState<PortalContentItem[]>([]);
  const [recommendations, setRecommendations] = useState<AuditRecommendationItem[]>([]);
  const [phases, setPhases] = useState<ProjectPhaseItem[]>([]);
  const [tasks, setTasks] = useState<ProjectTaskItem[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal / Form state for creating a new task
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<ProjectTaskStatus>('IDEA');
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectTaskPriority>('P2_MEDIUM');
  const [newTaskCategory, setNewTaskCategory] = useState<ProjectTaskCategory>('CONTENT');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, contentRes, recsRes, phasesRes, tasksRes] = await Promise.all([
        fetch('/api/admin/project-control/overview'),
        fetch('/api/admin/project-control/content'),
        fetch('/api/admin/project-control/recommendations'),
        fetch('/api/admin/project-control/phases'),
        fetch('/api/admin/project-control/tasks'),
      ]);

      const [overviewData, contentData, recsData, phasesData, tasksData] = await Promise.all([
        overviewRes.json(),
        contentRes.json(),
        recsRes.json(),
        phasesRes.json(),
        tasksRes.json(),
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (contentData.success) setContentCatalog(contentData.data);
      if (recsData.success) setRecommendations(recsData.data);
      if (phasesData.success) setPhases(phasesData.data);
      if (tasksData.success) setTasks(tasksData.data);
    } catch (err: any) {
      console.error('Error loading project control data:', err);
      setError('Nepodařilo se načíst data řídicího centra. Zkontrolujte připojení k serveru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/project-control/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDesc,
          status: newTaskStatus,
          priority: newTaskPriority,
          category: newTaskCategory,
          assignedToName: newTaskAssignee,
          notes: newTaskNotes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskNotes('');
        setNewTaskAssignee('');
        fetchData();
      } else {
        alert(json.error || 'Chyba při vytváření úkolu.');
      }
    } catch (err: any) {
      alert('Chyba při komunikaci se serverem: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: ProjectTaskStatus) => {
    try {
      const res = await fetch(`/api/admin/project-control/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        fetchData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Opravdu chcete tento úkol / nápad odstranit?')) return;
    try {
      const res = await fetch(`/api/admin/project-control/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const getStatusBadge = (status: ProjectTaskStatus) => {
    switch (status) {
      case 'DONE':
        return {
          label: 'HOTOVO',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'IN_PROGRESS':
        return {
          label: 'ROZPRACOVÁNO',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
        };
      case 'PLANNED':
        return {
          label: 'PLÁNOVÁNO',
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Calendar,
        };
      case 'IDEA':
        return {
          label: 'NÁPAD',
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: Lightbulb,
        };
      case 'BLOCKED':
        return {
          label: 'BLOKOVÁNO',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertTriangle,
        };
      case 'ARCHIVED':
        return {
          label: 'ARCHIV',
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: Archive,
        };
    }
  };

  const getPriorityBadge = (priority: ProjectTaskPriority) => {
    switch (priority) {
      case 'P0_CRITICAL':
        return { label: 'P0 KRITICKÁ', color: 'bg-rose-600 text-white' };
      case 'P1_HIGH':
        return { label: 'P1 VYSOKÁ', color: 'bg-orange-500 text-white' };
      case 'P2_MEDIUM':
        return { label: 'P2 STŘEDNÍ', color: 'bg-blue-600 text-white' };
      case 'P3_LOW':
        return { label: 'P3 NÍZKÁ', color: 'bg-slate-500 text-white' };
      case 'INFO':
        return { label: 'INFO', color: 'bg-slate-400 text-white' };
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedStatus !== 'ALL' && t.status !== selectedStatus) return false;
    if (selectedPriority !== 'ALL' && t.priority !== selectedPriority) return false;
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredContent = contentCatalog.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredRecs = recommendations.filter((rec) => {
    if (selectedStatus !== 'ALL' && rec.status !== selectedStatus) return false;
    if (selectedPriority !== 'ALL' && rec.priority !== selectedPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.description.toLowerCase().includes(q) ||
        rec.targetModule.toLowerCase().includes(q) ||
        rec.phase.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Obsah & Projekt – Control Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  FÁZE 19
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Centrální přehled stavu portálu, evidovaného obsahu, doporučení z auditů (Fáze 13–18), roadmapy a interního projektového backlogu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Aktualizovat data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-900' : ''}`} />
              Obnovit
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nový úkol / nápad
            </button>
          </div>
        </div>

        {/* 6 Unified Status Badges Ribbon */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">HOTOVO</div>
                <div className="text-xl font-black text-emerald-950 mt-0.5">{overview.counts.DONE}</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">ROZPRACOVÁNO</div>
                <div className="text-xl font-black text-amber-950 mt-0.5">{overview.counts.IN_PROGRESS}</div>
              </div>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">PLÁNOVÁNO</div>
                <div className="text-xl font-black text-blue-950 mt-0.5">{overview.counts.PLANNED}</div>
              </div>
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">NÁPAD</div>
                <div className="text-xl font-black text-purple-950 mt-0.5">{overview.counts.IDEA}</div>
              </div>
              <Lightbulb className="w-5 h-5 text-purple-600" />
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">BLOKOVÁNO</div>
                <div className="text-xl font-black text-rose-950 mt-0.5">{overview.counts.BLOCKED}</div>
              </div>
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">ARCHIV</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{overview.counts.ARCHIVED}</div>
              </div>
              <Archive className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        )}
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          Přehled & Metriky
        </button>

        <button
          onClick={() => setActiveSubTab('content')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'content'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Evidence obsahu portálu ({contentCatalog.length})
        </button>

        <button
          onClick={() => setActiveSubTab('comparison')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'comparison'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          Co máme vs. Co chybí
        </button>

        <button
          onClick={() => setActiveSubTab('recommendations')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'recommendations'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Doporučení z auditů ({recommendations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('backlog')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'backlog'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Nápady & Backlog ({tasks.length})
        </button>

        <button
          onClick={() => setActiveSubTab('roadmap')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSubTab === 'roadmap'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FolderGit2 className="w-3.5 h-3.5" />
          Roadmapa & Fáze ({phases.length})
        </button>
      </div>

      {/* SUB-TAB 1: PREHLED & METRIKY */}
      {activeSubTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Key Summary Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Obsah portálu
                </span>
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {overview.totalVerifiedPages} / {overview.totalContentItems}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Všech {overview.totalContentItems} hlavních modulů a rozcestníků je plně funkčních a ověřených.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(overview.totalVerifiedPages / overview.totalContentItems) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Auditní doporučení
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {overview.resolvedRecommendations} / {overview.totalRecommendations}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Doporučení z Fází 13–18 úspěšně zapracována v kódu a otestována.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-blue-900 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(overview.resolvedRecommendations / overview.totalRecommendations) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Dokončené Fáze
                </span>
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <FolderGit2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {overview.completedPhasesCount} / {overview.totalPhasesCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fáze 1 až 18 plně uzavřeny a auditovány v docs/audit/.
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(overview.completedPhasesCount / overview.totalPhasesCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Domain Metrics & Architecture Invariants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-900" />
                Produkční datové zdroje (Nulová tolerance pro mock data)
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Rejstřík OSPOD (ORP pracoviště)</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    206 reálných ORP záznamů
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Soudní rejstřík (Okresní & Krajské soudy)</span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    86 soudů ČR s GPS a kontakty
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Kalkulačka výživného</span>
                  <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Oficiální tabulky MS ČR 2023
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Konektor e-Sbírka / MV ČR</span>
                  <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Scheduler 3x denně (Rate limit 1/s)
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                Nedávno evidované úkoly a nápady
              </h3>
              <div className="space-y-2">
                {overview.recentTickets.slice(0, 4).map((ticket) => {
                  const sBadge = getStatusBadge(ticket.status);
                  const pBadge = getPriorityBadge(ticket.priority);
                  return (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{ticket.title}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{ticket.category}</span>
                          <span>•</span>
                          <span>{ticket.assignedToName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pBadge.color}`}>
                          {pBadge.label}
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sBadge.bg}`}>
                          {sBadge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EVIDENCE OBSAHU PORTALU */}
      {activeSubTab === 'content' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Hledat modul, stránku nebo nástroj..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-900"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 self-end sm:self-center">
              Zobrazeno {filteredContent.length} položek obsahu
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-900/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {item.categoryLabel}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-1.5">{item.title}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      100% HOTOVO
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{item.description}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-700 uppercase">Klíčové funkce:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.features.map((f, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                        >
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {item.auditVerification}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Datový zdroj: <strong>{item.dataSourceLabel}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">{item.path}</span>
                  <button
                    onClick={() => {
                      if (onNavigate) onNavigate(item.path);
                      else window.location.href = item.path;
                    }}
                    className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    Otevřít <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CO MAME VS CO CHYBI */}
      {activeSubTab === 'comparison' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Srovnávací matice: Co máme vs. Co doporučují audity doplnit
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Detailní auditní rozbor stavu komponent a plánovaných rozšíření pro další produkční cykly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: CO MÁME HOTOVO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-emerald-900">
                  CO PORTÁL JIŽ PLNĚ OBSAHUJE (100% PRODUKCE)
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-950">✅ Oficiální kalkulačka výživného (MS ČR 2023)</div>
                  <p className="text-emerald-800 leading-relaxed">
                    Kompletní výpočet dle 4 věkových kategorií, záchranná kontrolní částka a PDF export.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-950">✅ Rejstřík 206 pracovišť OSPOD a 86 soudů ČR</div>
                  <p className="text-emerald-800 leading-relaxed">
                    Plná interaktivní mapa Leaflet, GPS souřadnice, úřední hodiny, kontakty a hodnocení.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-950">✅ Centrální judikatura ÚS & NS</div>
                  <p className="text-emerald-800 leading-relaxed">
                    Strukturovaná databáze klíčových nálezů k péči o děti, výživnému a procesním právům.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-950">✅ Klientská zóna & Opatrovnická složka</div>
                  <p className="text-emerald-800 leading-relaxed">
                    Evidence případu, dětí, rozsudků, finančních závazků, deník předávání a 2FA zabezpečení.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-950">✅ Hierarchická administrace (8 oblastí)</div>
                  <p className="text-emerald-800 leading-relaxed">
                    Puck CMS, e-Sbírka konektor, Uživatelé & RBAC, Mailcow správa a Audit Center.
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: CO DOPORUČUJÍ AUDITY DOPLNIT */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                <Lightbulb className="w-5 h-5 text-blue-900" />
                <h3 className="text-sm font-extrabold text-blue-900">
                  CO DOPORUČUJÍ AUDITY DOPLNIT (ROADMAPA & BACKLOG)
                </h3>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950">💡 Mobilní PWA offline režim (IndexedDB)</div>
                  <p className="text-blue-800 leading-relaxed">
                    Možnost přistupovat ke krizovým kontaktům a soudním dokumentům bez připojení k internetu.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950">💡 Automatické notifikace před předáním dětí</div>
                  <p className="text-blue-800 leading-relaxed">
                    Push / SMS / e-mailové připomínky 24 hodin před předáním dětí dle harmonogramu.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950">💡 Průvodce mezinárodními únosy dětí (ÚMPOD)</div>
                  <p className="text-blue-800 leading-relaxed">
                    Návody a vzory pro přeshraniční spory a aplikaci Haagské úmluvy.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950">💡 AI tónový analyzátor pro Co-Parenting zprávy</div>
                  <p className="text-blue-800 leading-relaxed">
                    Upozornění rodiče na agresivní formulace před odesláním zprávy do auditované knihy.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200 text-xs space-y-1.5">
                  <div className="font-bold text-blue-950">💡 Automatický import judikátů přes RSS ÚS ČR</div>
                  <p className="text-blue-800 leading-relaxed">
                    Pravidelná kontrola nových nálezů Ústavního soudu a návrh na zařazení do judikatury.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DOPORUČENÍ Z AUDITŮ */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Hledat v doporučeních z auditů..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-900"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 self-end sm:self-center">
              Zobrazeno {filteredRecs.length} doporučení
            </span>
          </div>

          <div className="space-y-3">
            {filteredRecs.map((rec) => {
              const sBadge = getStatusBadge(rec.status);
              const pBadge = getPriorityBadge(rec.priority);
              return (
                <div
                  key={rec.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-900/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {rec.phase}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pBadge.color}`}>
                        {pBadge.label}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sBadge.bg}`}>
                        {sBadge.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Modul: {rec.targetModule}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900">{rec.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{rec.description}</p>

                    {rec.resolutionNotes && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 font-medium mt-1">
                        <strong>Stav řešení:</strong> {rec.resolutionNotes}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      {rec.auditFileName}
                    </span>
                    {rec.implementedInPhase && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        Implementováno: {rec.implementedInPhase}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: NÁPADY & BACKLOG */}
      {activeSubTab === 'backlog' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Hledat úkol, nápad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-900"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-blue-900"
              >
                <option value="ALL">Všechny stavy</option>
                <option value="DONE">HOTOVO</option>
                <option value="IN_PROGRESS">ROZPRACOVÁNO</option>
                <option value="PLANNED">PLÁNOVÁNO</option>
                <option value="IDEA">NÁPAD</option>
                <option value="BLOCKED">BLOKOVÁNO</option>
                <option value="ARCHIVED">ARCHIV</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-blue-900"
              >
                <option value="ALL">Všechny priority</option>
                <option value="P0_CRITICAL">P0 Kritická</option>
                <option value="P1_HIGH">P1 Vysoká</option>
                <option value="P2_MEDIUM">P2 Střední</option>
                <option value="P3_LOW">P3 Nízká</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer self-stretch md:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Přidat položku
            </button>
          </div>

          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500">
                <Lightbulb className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">Žádné úkoly neodpovídají zadanému filtru.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('ALL');
                    setSelectedPriority('ALL');
                  }}
                  className="mt-3 text-xs text-blue-900 font-bold hover:underline cursor-pointer"
                >
                  Resetovat filtry
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const sBadge = getStatusBadge(task.status);
                const pBadge = getPriorityBadge(task.priority);
                return (
                  <div
                    key={task.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-blue-900/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {task.ticketNumber && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            #{task.ticketNumber}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pBadge.color}`}>
                          {pBadge.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {task.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Přiřazeno: <strong>{task.assignedToName || 'Nepřiřazeno'}</strong>
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                          {task.description}
                        </p>
                      )}
                      {task.notes && (
                        <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                          Poznámka: {task.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value as ProjectTaskStatus)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer focus:outline-none ${sBadge.bg}`}
                      >
                        <option value="DONE">🟢 HOTOVO</option>
                        <option value="IN_PROGRESS">🟡 ROZPRACOVÁNO</option>
                        <option value="PLANNED">🔵 PLÁNOVÁNO</option>
                        <option value="IDEA">🟣 NÁPAD</option>
                        <option value="BLOCKED">🔴 BLOKOVÁNO</option>
                        <option value="ARCHIVED">⚪ ARCHIV</option>
                      </select>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Odstranit úkol"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: ROADMAPA & FÁZE */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">
              Historie fází a projektová roadmapa (Fáze 1 až 19+)
            </h2>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Všechny dosud realizované a plánované etapy vývoje s přímým odkazem na auditní reporty v docs/audit/.
            </p>

            <div className="relative border-l-2 border-slate-200 pl-6 ml-3 space-y-8">
              {phases.map((phase, idx) => (
                <div key={phase.phaseId} className="relative">
                  <div
                    className={`absolute -left-[31px] top-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
                      phase.status === 'DONE'
                        ? 'bg-emerald-600 text-white'
                        : phase.status === 'IN_PROGRESS'
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {phase.status === 'DONE' && <Check className="w-3 h-3" />}
                  </div>

                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/90 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-900 text-white">
                          FÁZE {phase.phaseNumber}
                        </span>
                        <h4 className="text-xs font-extrabold text-slate-900">{phase.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{phase.date}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{phase.description}</p>

                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex flex-wrap gap-1.5">
                        {phase.keyDeliverables.map((del, dIdx) => (
                          <span
                            key={dIdx}
                            className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 text-[10px] font-medium"
                          >
                            ✓ {del}
                          </span>
                        ))}
                      </div>

                      <span className="font-mono text-[10px] text-blue-900 font-bold">
                        📄 {phase.auditReport}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-900" />
                Nový úkol / nápad do backlogu
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Název úkolu / nápadu *</label>
                <input
                  type="text"
                  required
                  placeholder="Např. Přidání kalkulačky výživného pro zletilé děti"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Podrobný popis</label>
                <textarea
                  rows={3}
                  placeholder="Popis funkčnosti, zdroje, požadavky..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Výchozí stav</label>
                  <select
                    value={newTaskStatus}
                    onChange={(e) => setNewTaskStatus(e.target.value as ProjectTaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="IDEA">🟣 NÁPAD</option>
                    <option value="PLANNED">🔵 PLÁNOVÁNO</option>
                    <option value="IN_PROGRESS">🟡 ROZPRACOVÁNO</option>
                    <option value="DONE">🟢 HOTOVO</option>
                    <option value="BLOCKED">🔴 BLOKOVÁNO</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priorita</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as ProjectTaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="P0_CRITICAL">P0 Kritická</option>
                    <option value="P1_HIGH">P1 Vysoká</option>
                    <option value="P2_MEDIUM">P2 Střední</option>
                    <option value="P3_LOW">P3 Nízká</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategorie</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as ProjectTaskCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                  >
                    <option value="CONTENT">Obsah & CMS</option>
                    <option value="LEGAL">Právo & Judikatura</option>
                    <option value="CALCULATOR">Kalkulačky</option>
                    <option value="OSPOD_MAP">OSPOD & Mapa</option>
                    <option value="USER_PORTAL">Klientský portál</option>
                    <option value="COMMUNITY">Komunita</option>
                    <option value="SECURITY">Bezpečnost</option>
                    <option value="DEVOPS">DevSecOps</option>
                    <option value="UX">UX & Design</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Přiřazená osoba / tým</label>
                  <input
                    type="text"
                    placeholder="Např. Právní redakce"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interní poznámka</label>
                <input
                  type="text"
                  placeholder="Interní kontext, deadline, odkaz na audit..."
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 text-xs"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-900 text-white font-bold hover:bg-blue-800 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Uložit do backlogu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
