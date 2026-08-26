import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan, CaseChild } from '../../types';
import { X, Calendar, Clock, MapPin, Users, Sparkles, Check, AlertCircle } from 'lucide-react';

interface CarePlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCase: ClientCase;
  editingPlan?: CarePlan | null;
  onSuccess: (plan: CarePlan) => void;
}

export const CarePlanFormModal: React.FC<CarePlanFormModalProps> = ({
  isOpen,
  onClose,
  activeCase,
  editingPlan,
  onSuccess,
}) => {
  const [title, setTitle] = useState<string>('');
  const [careType, setCareType] = useState<string>('SHARED');
  const [rotationPattern, setRotationPattern] = useState<string>('7/7');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [startParent, setStartParent] = useState<string>('PARENT_A');
  const [defaultHandoverTime, setDefaultHandoverTime] = useState<string>('16:00');
  const [parentAName, setParentAName] = useState<string>('Otec');
  const [parentBName, setParentBName] = useState<string>('Matka');
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPlan) {
      setTitle(editingPlan.title || '');
      setCareType(editingPlan.type || 'SHARED');
      setRotationPattern(editingPlan.rotationPattern || '7/7');
      setStartDate(editingPlan.startDate ? editingPlan.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setEndDate(
        editingPlan.endDate
          ? editingPlan.endDate.split('T')[0]
          : new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setStartParent('PARENT_A');
      setDefaultHandoverTime(editingPlan.defaultHandoverTime || '16:00');
      setParentAName(editingPlan.parentAName || 'Otec');
      setParentBName(editingPlan.parentBName || 'Matka');
      if (editingPlan.children && editingPlan.children.length > 0) {
        setSelectedChildIds(editingPlan.children.map((c) => c.childId || (c as any).id));
      } else {
        setSelectedChildIds((activeCase.children || []).map((c) => c.id));
      }
    } else {
      setTitle(`Plán péče – ${activeCase.title || 'Spis'}`);
      setCareType('SHARED');
      setRotationPattern('7/7');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStartParent('PARENT_A');
      setDefaultHandoverTime('16:00');
      setParentAName('Otec');
      setParentBName('Matka');
      setSelectedChildIds((activeCase.children || []).map((c) => c.id));
    }
    setError(null);
  }, [editingPlan, activeCase, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Zadejte název plánu péče.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('Konec období musí být stejný nebo pozdější než začátek.');
      return;
    }

    setLoading(true);
    setError(null);

    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const payload = {
      title: title.trim(),
      careType,
      rotationPattern,
      startDate,
      endDate,
      startParent,
      defaultHandoverTime,
      parentAName,
      parentBName,
      childIds: selectedChildIds,
    };

    try {
      const url = editingPlan
        ? `/api/cases/${activeCase.id}/care/plans/${editingPlan.id}`
        : `/api/cases/${activeCase.id}/care/plans`;
      const method = editingPlan ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        throw new Error(data.error || 'Nepodařilo se uložit plán péče.');
      }

      const result = await res.json();
      if (result.success && result.data) {
        onSuccess(result.data);
        onClose();
      }
    } catch (err: any) {
      console.error('Chyba při ukládání plánu:', err);
      setError(err.message || 'Chyba při ukládání plánu.');
    } finally {
      setLoading(false);
    }
  };

  const toggleChild = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {editingPlan ? 'Upravit plán péče' : 'Vytvořit nový plán péče'}
              </h2>
              <p className="text-xs text-slate-500">
                Spis: <strong className="text-slate-800">{activeCase.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Zavřít"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Název plánu */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Název plánu péče *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Např. Střídavá péče 7/7 – školní rok 2026/2027"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden"
              required
            />
          </div>

          {/* Rotační model a Typ péče */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rotační model
              </label>
              <select
                value={rotationPattern}
                onChange={(e) => setRotationPattern(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden bg-white"
              >
                <option value="7/7">7/7 (Týden / Týden – klasická střídavka)</option>
                <option value="2-2-3">2-2-3 (2 dny / 2 dny / 3 dny – předškolní)</option>
                <option value="3-4-4-3">3-4-4-3 (Půltýdenní režim)</option>
                <option value="2-2-5-5">2-2-5-5 (Fixní dny v týdnu + dlouhý víkend)</option>
                <option value="ALTERNATING_WEEKENDS">Každý 2. víkend (Asymetrický styk)</option>
                <option value="EXTENDED_WEEKENDS">Rozšířené víkendy (Čt–Po)</option>
                <option value="CUSTOM">Vlastní individuální harmonogram</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Typ uspořádání
              </label>
              <select
                value={careType}
                onChange={(e) => setCareType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden bg-white"
              >
                <option value="SHARED">Střídavá péče (50/50)</option>
                <option value="ALTERNATING">Asymetrická střídavá péče (např. 60/40)</option>
                <option value="SOLE_A">Výlučná péče otce se stykem matky</option>
                <option value="SOLE_B">Výlučná péče matky se stykem otce</option>
              </select>
            </div>
          </div>

          {/* Období */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Začátek platnosti *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Konec platnosti / délka cyklu *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden"
                required
              />
            </div>
          </div>

          {/* Začínající rodič a Čas předání */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                První den cyklu začíná u:
              </label>
              <select
                value={startParent}
                onChange={(e) => setStartParent(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden bg-white"
              >
                <option value="PARENT_A">{parentAName} (Rodič A)</option>
                <option value="PARENT_B">{parentBName} (Rodič B)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Výchozí čas předání
              </label>
              <input
                type="time"
                value={defaultHandoverTime}
                onChange={(e) => setDefaultHandoverTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-hidden"
              />
            </div>
          </div>

          {/* Pojmenování rodičů */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Pojmenování Rodiče A
              </label>
              <input
                type="text"
                value={parentAName}
                onChange={(e) => setParentAName(e.target.value)}
                placeholder="Otec"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Pojmenování Rodiče B
              </label>
              <input
                type="text"
                value={parentBName}
                onChange={(e) => setParentBName(e.target.value)}
                placeholder="Matka"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-hidden"
              />
            </div>
          </div>

          {/* Děti ve spisu */}
          {activeCase.children && activeCase.children.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Děti zahrnuté do plánu péče
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCase.children.map((child) => {
                  const isSelected = selectedChildIds.includes(child.id);
                  return (
                    <button
                      type="button"
                      key={child.id}
                      onClick={() => toggleChild(child.id)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-900 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-xs">
                          {child.firstName} {child.lastName}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          isSelected ? 'bg-blue-900 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Ukládám...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingPlan ? 'Uložit změny' : 'Vytvořit Care Plan'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
