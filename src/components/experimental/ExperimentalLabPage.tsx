import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ExperimentalFeature,
  ExperimentalFeatureCategory,
  ExperimentalFeatureStatus,
} from '../../types/experimental';
import {
  getExperimentalFeatures,
  getFeatureStatusStats,
  filterExperimentalFeatures,
} from '../../config/experimentalFeatures';
import { ExperimentalFeatureCard } from './ExperimentalFeatureCard';
import { ExperimentalFeatureDetailModal } from './ExperimentalFeatureDetailModal';
import {
  FlaskConical,
  Search,
  CheckCircle2,
  Sparkles,
  Clock,
  AlertTriangle,
  Layers,
  Cpu,
  Scale,
  Folder,
  Coins,
  GraduationCap,
  Server,
  Filter,
  Users,
  Trash2,
} from 'lucide-react';

interface ExperimentalLabPageProps {
  onNavigate: (route: string) => void;
}

export const ExperimentalLabPage: React.FC<ExperimentalLabPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [selectedCategory, setSelectedCategory] = useState<string>('vse');
  const [selectedStatus, setSelectedStatus] = useState<string>('vse');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDetailFeature, setSelectedDetailFeature] = useState<ExperimentalFeature | null>(
    null
  );

  const [approvedUsers, setApprovedUsers] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [showAccessPanel, setShowAccessPanel] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchApprovedUsers = async () => {
    setIsLoadingUsers(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/admin/experimental/approved-users');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setApprovedUsers(data.data);
      } else {
        setErrorMsg(data.error || 'Nepodařilo se načíst schválené uživatele');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Chyba komunikace se serverem');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (showAccessPanel) {
      fetchApprovedUsers();
    }
  }, [showAccessPanel]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setIsSubmittingUser(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/admin/experimental/approved-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        setNewEmail('');
        fetchApprovedUsers();
      } else {
        setErrorMsg(data.error || 'Nepodařilo se přidat uživatele');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Chyba komunikace se serverem');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!window.confirm(`Opravdu chcete odebrat uživatele ${email} z experimentálního přístupu?`)) {
      return;
    }
    setIsLoadingUsers(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/admin/experimental/approved-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        fetchApprovedUsers();
      } else {
        setErrorMsg(data.error || 'Nepodařilo se odebrat uživatele');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Chyba komunikace se serverem');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const stats = useMemo(() => getFeatureStatusStats(), []);

  const filteredFeatures = useMemo(() => {
    return filterExperimentalFeatures(selectedCategory, selectedStatus, searchQuery);
  }, [selectedCategory, selectedStatus, searchQuery]);

  const categories = [
    { id: 'vse', label: 'Všechny moduly', icon: Layers },
    { id: 'ai', label: 'AI & Orion', icon: Cpu },
    { id: 'pravo', label: 'Právo & Soudy', icon: Scale },
    { id: 'pripad', label: 'Případ & Péče', icon: Folder },
    { id: 'finance', label: 'Finance & Majetek', icon: Coins },
    { id: 'vzdelavani', label: 'Vzdělávání', icon: GraduationCap },
    { id: 'platforma', label: 'Platforma', icon: Server },
  ];

  const statuses = [
    { id: 'vse', label: 'Všechny stavy', count: stats.total },
    { id: 'READY', label: 'READY', count: stats.ready, color: 'text-emerald-600' },
    { id: 'BETA', label: 'BETA', count: stats.beta, color: 'text-blue-600' },
    { id: 'EXPERIMENT', label: 'EXPERIMENT', count: stats.experiment, color: 'text-amber-600' },
    { id: 'PLANNED', label: 'PLÁNOVÁNO', count: stats.planned, color: 'text-slate-600' },
    { id: 'ERROR', label: 'CHYBA', count: stats.error, color: 'text-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold">
                <FlaskConical className="w-4 h-4 text-blue-600" />
                <span>Synthesis Hub • DEV3 Playground</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                🧪 Experimentální laboratoř
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Kompletní přehled všech současných, rozpracovaných i plánovaných modulů a systémových
                agentů ekosystému Synthesis. Všechny stavy jsou zobrazeny s maximální architektonickou
                upřímností — bez falešných dat a bez předstírání neexistujících backendů.
              </p>
            </div>

            {/* Quick stats badges */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 shrink-0">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-center">
                <span className="text-base font-black text-emerald-700 block">{stats.ready}</span>
                <span className="text-[10px] font-bold text-emerald-900 uppercase">Ready</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                <span className="text-base font-black text-blue-700 block">{stats.beta}</span>
                <span className="text-[10px] font-bold text-blue-900 uppercase">Beta</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-center">
                <span className="text-base font-black text-amber-700 block">{stats.experiment}</span>
                <span className="text-[10px] font-bold text-amber-900 uppercase">Exp</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-center">
                <span className="text-base font-black text-slate-700 block">{stats.planned}</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase">Plán</span>
              </div>
              <div className="bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-center col-span-2 sm:col-span-1">
                <span className="text-base font-black text-slate-900 block">{stats.total}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Celkem</span>
              </div>
            </div>
          </div>

          {/* Approved Users Management panel (SUPER_ADMIN / SYSTEM_ADMIN only can manage, other approved can view list) */}
          <div className="border-t border-slate-100 pt-6">
            <button
              onClick={() => setShowAccessPanel(!showAccessPanel)}
              className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-900" />
              <span>Správa přístupových oprávnění k laboratoři</span>
              <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono font-bold">
                {isSuperAdmin ? 'ŘÍZENÍ PŘÍSTUPU' : 'ZOBRAZIT SEZNAM'}
              </span>
            </button>

            {showAccessPanel && (
              <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl max-w-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Uživatelé se schváleným přístupem
                  </h3>
                  {isLoadingUsers && <span className="text-[10px] text-slate-400">Načítání...</span>}
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-100">
                    {errorMsg}
                  </div>
                )}

                {/* Add new user form - SUPER_ADMIN ONLY */}
                {isSuperAdmin ? (
                  <form onSubmit={handleAddUser} className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Zadejte e-mail administrátora či editora..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-950 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                      required
                      disabled={isSubmittingUser}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingUser || !newEmail.trim()}
                      className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Schválit přístup</span>
                    </button>
                  </form>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Pouze SUPER_ADMIN může explicitně schvalovat další e-maily pro přístup do Experimentální laboratoře.
                  </p>
                )}

                {/* List of users */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {approvedUsers.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Seznam schválených uživatelů je prázdný.</p>
                  ) : (
                    approvedUsers.map((email) => (
                      <div key={email} className="flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs">
                        <span className="font-medium text-slate-700">{email}</span>
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(email)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Odebrat přístup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search bar and Filters */}
          <div className="pt-4 space-y-4">
            {/* Search Input */}
            <div className="relative max-w-xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="experimental-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat podle názvu, popisu, značek či capability..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer select-none ${
                      isActive
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Stav:
              </span>
              {statuses.map((st) => {
                const isActive = selectedStatus === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStatus(st.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span className="ml-1.5 opacity-60 text-[10px]">({st.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {filteredFeatures.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 my-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Žádný modul neodpovídá filtrům</h3>
            <p className="text-xs text-slate-500">
              Zkuste upravit hledaný výraz nebo zvolit jinou kategorii či stav.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('vse');
                setSelectedStatus('vse');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-950 transition-all cursor-pointer"
            >
              Resetovat filtry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFeatures.map((feature) => (
              <ExperimentalFeatureCard
                key={feature.id}
                feature={feature}
                onNavigate={onNavigate}
                onViewDetails={(feat) => setSelectedDetailFeature(feat)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      <ExperimentalFeatureDetailModal
        feature={selectedDetailFeature}
        onClose={() => setSelectedDetailFeature(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
