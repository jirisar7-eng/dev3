import React from 'react';
import {
  ClientCase,
  CaseChild,
  CaseDeadline,
  CaseTask,
  CaseDocument,
  CaseEvent,
  CaseParticipant,
} from '../../types';
import {
  ShieldCheck,
  Scale,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Baby,
  Plus,
  ArrowRight,
  Sparkles,
  MapPin,
  Building,
  CheckSquare,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface CaseOverviewTabProps {
  activeCase: ClientCase;
  onTabChange: (tabKey: string) => void;
  onOpenNewEvent: () => void;
  onOpenNewTask: () => void;
  onOpenNewDoc: () => void;
  onOpenNewDeadline: () => void;
  onOpenJudgmentImport: () => void;
}

export const CaseOverviewTab: React.FC<CaseOverviewTabProps> = ({
  activeCase,
  onTabChange,
  onOpenNewEvent,
  onOpenNewTask,
  onOpenNewDoc,
  onOpenNewDeadline,
  onOpenJudgmentImport,
}) => {
  const children = activeCase.children || [];
  const deadlines = (activeCase.deadlines || []).filter((d) => !d.isCompleted);
  const openTasks = (activeCase.tasks || []).filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
  const recentDocs = (activeCase.documents || []).slice(0, 4);
  const upcomingEvents = (activeCase.events || [])
    .filter((e) => new Date(e.eventDate).getTime() >= Date.now() - 86400000)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 3);
  const participants = activeCase.participants || [];

  const nextDeadline = (activeCase.deadlines || [])
    .filter((d) => !d.isCompleted && new Date(d.dueDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>Aktivní řízení</span>;
      case 'CLOSED':
        return <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-full text-xs font-bold">Uzavřeno</span>;
      case 'ARCHIVED':
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">Archivováno</span>;
      default:
        return <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">Koncept</span>;
    }
  };

  const getCareTypeText = (type?: string) => {
    switch (type) {
      case 'STRIDAVA':
        return 'Střídavá péče (7/7)';
      case 'SPOLECNA':
        return 'Společná péče rodičů';
      case 'VYHRADNI_OTEC':
        return 'Výhradní péče otce';
      case 'VYHRADNI_MATKA':
        return 'Péče matky s úpravou styku';
      case 'UPRAVA_STYKU':
        return 'Rozšířený styk otce';
      default:
        return 'Střídavá péče';
    }
  };

  return (
    <div className="space-y-6">
      {/* Primary Case Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {getStatusBadge(activeCase.status)}
              <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold">
                {activeCase.caseType === 'OPATROVNICKE' ? '⚖️ Opatrovnické řízení' : activeCase.caseType}
              </span>
              {activeCase.caseNumber && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-mono font-bold">
                  Spis. zn: {activeCase.caseNumber}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeCase.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {activeCase.description || 'Komplexní spis a dokumentace opatrovnického řízení, evidence termínů a péče o děti.'}
            </p>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-2 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Building className="w-4 h-4 text-blue-600" />
                <span>{activeCase.court || 'Příslušný okresní / obvodní soud'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <Scale className="w-4 h-4 text-blue-600" />
                <span>Režim: <strong className="text-blue-900">{getCareTypeText(activeCase.currentCareType)}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={onOpenJudgmentImport}
              className="px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border border-emerald-600/50"
            >
              <FileText className="w-4 h-4 text-white" />
              📄 NAHRÁT ROZSUDek A AUTOMATICKY VYPLNIT
            </button>
            <button
              onClick={onOpenNewEvent}
              className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Zapsat událost
            </button>
            <button
              onClick={onOpenNewDoc}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-blue-600" />
              Nahrát dokument
            </button>
            <button
              onClick={onOpenNewTask}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Nový úkol
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onTabChange('children')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Děti v péči</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Baby className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{children.length}</span>
            <span className="text-xs text-slate-500 font-medium">{children.length === 1 ? 'dítě' : 'dětí'}</span>
          </div>
        </div>

        <div
          onClick={() => onTabChange('calendar')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lhůty & Termíny</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">{deadlines.length}</span>
            <span className="text-xs text-slate-500 font-medium">otevřených</span>
          </div>
        </div>

        <div
          onClick={() => onTabChange('tasks')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aktivní úkoly</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{openTasks.length}</span>
            <span className="text-xs text-slate-500 font-medium">k řešení</span>
          </div>
        </div>

        <div
          onClick={() => onTabChange('documents')}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Spis & Důkazy</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{(activeCase.documents || []).length}</span>
            <span className="text-xs text-slate-500 font-medium">dokumentů</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide): Children, Upcoming events & Recent docs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Care & Parenting Hub Spotlight Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-lg">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900">
                  Nový modul
                </span>
                <span className="text-xs text-blue-200 font-bold">Care & Parenting Hub</span>
              </div>
              <h3 className="text-base font-black text-white">
                Simulátor a plánovač péče o dítě
              </h3>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Modelujte střídavou péči (7/7, 2-2-3), porovnejte podíly nocí, odhadovaný čas a kilometry cestování mezi bydlišti rodičů.
              </p>
            </div>

            <button
              onClick={() => onTabChange('care')}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-sm"
            >
              <span>Otevřít Care Hub</span>
              <ArrowRight className="w-4 h-4 text-blue-900" />
            </button>
          </div>

          {/* Children Summary Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Baby className="w-5 h-5 text-blue-600" />
                Děti evidované ve spisu
              </h2>
              <button
                onClick={() => onTabChange('children')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Spravovat profil dětí <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {children.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Baby className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Zatím nebylo přidáno žádné dítě.</p>
                <button
                  onClick={() => onTabChange('children')}
                  className="mt-3 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all cursor-pointer"
                >
                  Přidat profil dítěte
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-100 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900">
                          {child.firstName} {child.lastName}
                        </h4>
                        {child.dateOfBirth && (
                          <span className="text-xs font-semibold px-2.5 py-0.5 bg-white border border-blue-200 text-blue-800 rounded-lg">
                            {new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()} let
                          </span>
                        )}
                      </div>
                      {child.schoolName && (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                          🏫 {child.schoolName}
                        </p>
                      )}
                      {child.pediatrician && (
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                          🩺 {child.pediatrician}
                        </p>
                      )}
                    </div>
                    {child.notes && (
                      <p className="text-xs text-slate-500 italic bg-white/70 p-2 rounded-xl border border-slate-100 line-clamp-2">
                        "{child.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events & Hearings */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Nadcházející události & jednání
              </h2>
              <button
                onClick={() => onTabChange('calendar')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Otevřít kalendář <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-medium">Žádné nadcházející termíny v nejbližších dnech.</p>
                <button
                  onClick={onOpenNewEvent}
                  className="mt-3 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold hover:bg-blue-800 transition-all cursor-pointer"
                >
                  Naplánovat termín / jednání
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 flex items-start justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black uppercase leading-none">
                          {new Date(evt.eventDate).toLocaleDateString('cs-CZ', { month: 'short' })}
                        </span>
                        <span className="text-sm font-extrabold leading-none mt-0.5">
                          {new Date(evt.eventDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                            {evt.category}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">{evt.description}</p>
                        )}
                        {evt.location && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {evt.location}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 shrink-0">
                      {new Date(evt.eventDate).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Documents */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Poslední přidané dokumenty spisu
              </h2>
              <button
                onClick={() => onTabChange('documents')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Všechny dokumenty <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentDocs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">V tomto spisu zatím nejsou uloženy žádné dokumenty.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0 text-xs font-bold">
                        {doc.fileType.toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-slate-900 truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <span className="text-xs text-slate-500 block">
                          {doc.category} • {(doc.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col wide): Urgent Deadlines, Open Tasks & Participants */}
        <div className="space-y-6">
          {/* Urgent Deadlines Alert Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-3xl border border-amber-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Lhůty & Soudní termíny
              </h3>
              <button
                onClick={onOpenNewDeadline}
                className="text-xs font-bold text-amber-900 hover:text-amber-700 bg-amber-200/60 px-2 py-1 rounded-lg cursor-pointer"
              >
                + Přidat lhůtu
              </button>
            </div>

            {deadlines.length === 0 ? (
              <p className="text-xs text-amber-800 font-medium py-2">
                Všechny zákonné i soudní lhůty jsou aktuálně vyřízeny.
              </p>
            ) : (
              <div className="space-y-2.5">
                {deadlines.slice(0, 4).map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs flex items-start justify-between gap-2 shadow-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{d.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{d.description}</p>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-900 shrink-0 px-2 py-0.5 bg-amber-100 rounded-md">
                      {new Date(d.dueDate).toLocaleDateString('cs-CZ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Tasks List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Otevřené úkoly ({openTasks.length})
              </h3>
              <button
                onClick={onOpenNewTask}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                + Nový úkol
              </button>
            </div>

            {openTasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">Žádné otevřené úkoly.</p>
            ) : (
              <div className="space-y-2">
                {openTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 block">{t.title}</span>
                      {t.description && <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-extrabold uppercase shrink-0 ${
                        t.priority === 'URGENT'
                          ? 'bg-red-100 text-red-700'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Účastníci řízení
              </h3>
              <button
                onClick={() => onTabChange('proceedings')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                Detail
              </button>
            </div>

            <div className="space-y-2.5">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                  <div>
                    <span className="font-bold text-slate-900 block">{p.name}</span>
                    <span className="text-slate-500 text-xs">{p.institution || p.email}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-xs">
                    {p.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
