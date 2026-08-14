import React, { useState } from 'react';
import { ClientCase, CaseTask, CaseDeadline } from '../../types';
import {
  CheckSquare,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  X,
  Check,
  Filter,
} from 'lucide-react';

interface CaseTasksTabProps {
  activeCase: ClientCase;
  onAddTask: (task: Partial<CaseTask>) => Promise<void>;
  onUpdateTask: (taskId: string, data: Partial<CaseTask>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onAddDeadline: (deadline: Partial<CaseDeadline>) => Promise<void>;
  onToggleDeadline: (deadlineId: string) => Promise<void>;
  onDeleteDeadline: (deadlineId: string) => Promise<void>;
}

export const CaseTasksTab: React.FC<CaseTasksTabProps> = ({
  activeCase,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddDeadline,
  onToggleDeadline,
  onDeleteDeadline,
}) => {
  const tasks = activeCase.tasks || [];
  const deadlines = activeCase.deadlines || [];

  const [taskFilter, setTaskFilter] = useState<string>('ALL');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);

  // Task form
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<string>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deadline form
  const [deadTitle, setDeadTitle] = useState('');
  const [deadDesc, setDeadDesc] = useState('');
  const [deadDueDate, setDeadDueDate] = useState('');
  const [deadPriority, setDeadPriority] = useState<string>('HIGH');
  const [deadType, setDeadType] = useState<string>('COURT');

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddTask({
        title: taskTitle,
        description: taskDesc,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        priority: taskPriority as any,
        status: 'TODO',
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setIsAddingTask(false);
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeadlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddDeadline({
        title: deadTitle,
        description: deadDesc,
        dueDate: deadDueDate ? new Date(deadDueDate).toISOString() : new Date().toISOString(),
        priority: deadPriority as any,
        type: deadType as any,
        isCompleted: false,
      });
      setDeadTitle('');
      setDeadDesc('');
      setDeadDueDate('');
      setIsAddingDeadline(false);
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'ALL') return true;
    return t.status === taskFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-blue-600" />
            Úkoly, Lhůty & Soudní termíny
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Evidence procesních úkonů, přípravy důkazů, lhůt pro vyjádření a platebních termínů.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsAddingDeadline(true)}
            className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-amber-700" />
            + Přidat lhůtu / termín
          </button>
          <button
            onClick={() => setIsAddingTask(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Nový úkol
          </button>
        </div>
      </div>

      {/* Deadline Add Form */}
      {isAddingDeadline && (
        <form
          onSubmit={handleDeadlineSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-amber-500 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Nová procesní lhůta / Soudní termín
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingDeadline(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Název lhůty / Povinnost *
              </label>
              <input
                type="text"
                required
                value={deadTitle}
                onChange={(e) => setDeadTitle(e.target.value)}
                placeholder="např. Doplnění vyjádření k návrhu na úpravu styku, Zaplacení poplatku"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Termín splnění (Deadline) *
              </label>
              <input
                type="datetime-local"
                required
                value={deadDueDate}
                onChange={(e) => setDeadDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priorita
              </label>
              <select
                value={deadPriority}
                onChange={(e) => setDeadPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
              >
                <option value="URGENT">🔴 URGENTNÍ (Zákonná propadná lhůta)</option>
                <option value="HIGH">🟠 Vysoká priorita</option>
                <option value="MEDIUM">🟡 Běžná priorita</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Podrobnosti k lhůtě
              </label>
              <textarea
                rows={2}
                value={deadDesc}
                onChange={(e) => setDeadDesc(e.target.value)}
                placeholder="Číslo jednací, způsob doručení (datová schránka / pošta) nebo instrukce..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingDeadline(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Ukládám...' : 'Zapsat lhůtu'}
            </button>
          </div>
        </form>
      )}

      {/* Task Add Form */}
      {isAddingTask && (
        <form
          onSubmit={handleTaskSubmit}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              Nový úkol pro přípravu spisu
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Název úkolu *
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="např. Sestavit tabulku nákladů na kroužky, Vyžádat zprávu z MŠ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Termín splnění (volitelné)
              </label>
              <input
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priorita
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="LOW">🟢 Nízká</option>
                <option value="MEDIUM">🟡 Střední</option>
                <option value="HIGH">🟠 Vysoká</option>
                <option value="URGENT">🔴 URGENTNÍ</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Popis úkolu & pokyny
              </label>
              <textarea
                rows={2}
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                placeholder="Kroky k dokončení, potřebné dokumenty..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
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
              {isSubmitting ? 'Ukládám...' : 'Vytvořit úkol'}
            </button>
          </div>
        </form>
      )}

      {/* Deadlines Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-amber-600" />
          Procesní a soudní lhůty ({deadlines.length})
        </h3>

        {deadlines.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Nejsou nastaveny žádné procesní lhůty.</p>
        ) : (
          <div className="space-y-3">
            {deadlines.map((d) => (
              <div
                key={d.id}
                className={`p-4 rounded-2xl border transition-colors flex items-start justify-between gap-4 ${
                  d.isCompleted
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-amber-50/50 border-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onToggleDeadline(d.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      d.isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-blue-600 bg-white'
                    }`}
                  >
                    {d.isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold ${d.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {d.title}
                    </h4>
                    {d.description && <p className="text-xs text-slate-600">{d.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="font-mono font-bold text-amber-900">
                        Termín: {new Date(d.dueDate).toLocaleDateString('cs-CZ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                        {d.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Smazat lhůtu "${d.title}"?`)) onDeleteDeadline(d.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Seznam úkolů ({tasks.length})
          </h3>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'Všechny' },
              { key: 'TODO', label: 'K řešení' },
              { key: 'IN_PROGRESS', label: 'V řešení' },
              { key: 'DONE', label: 'Dokončené' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTaskFilter(f.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  taskFilter === f.key
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">V této kategorii nejsou žádné úkoly.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 flex items-start justify-between gap-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      onUpdateTask(t.id, {
                        status: t.status === 'DONE' ? 'TODO' : 'DONE',
                      })
                    }
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      t.status === 'DONE'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-blue-600 bg-white'
                    }`}
                  >
                    {t.status === 'DONE' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold ${t.status === 'DONE' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {t.title}
                    </h4>
                    {t.description && <p className="text-xs text-slate-600">{t.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5 font-medium">
                      {t.dueDate && (
                        <span className="flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          Do: {new Date(t.dueDate).toLocaleDateString('cs-CZ')}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          t.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Opravdu smazat úkol "${t.title}"?`)) onDeleteTask(t.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
