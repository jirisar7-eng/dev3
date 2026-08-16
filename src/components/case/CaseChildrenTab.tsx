import React, { useState } from 'react';
import { ClientCase, CaseChild } from '../../types';
import { Baby, Plus, Edit2, Trash2, Calendar, School, Stethoscope, FileText, Check, X, Sparkles } from 'lucide-react';

interface CaseChildrenTabProps {
  activeCase: ClientCase;
  onAddChild: (child: Partial<CaseChild>) => Promise<void>;
  onUpdateChild: (childId: string, child: Partial<CaseChild>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
}

export const CaseChildrenTab: React.FC<CaseChildrenTabProps> = ({
  activeCase,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
}) => {
  const children = activeCase.children || [];
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [birthNumber, setBirthNumber] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [pediatrician, setPediatrician] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setBirthNumber('');
    setSchoolName('');
    setPediatrician('');
    setNotes('');
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (child: CaseChild) => {
    setEditingId(child.id);
    setFirstName(child.firstName);
    setLastName(child.lastName || '');
    setDateOfBirth(child.dateOfBirth ? child.dateOfBirth.split('T')[0] : '');
    setBirthNumber(child.birthNumber || '');
    setSchoolName(child.schoolName || '');
    setPediatrician(child.pediatrician || '');
    setNotes(child.notes || '');
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdateChild(editingId, {
          firstName,
          lastName,
          dateOfBirth,
          birthNumber,
          schoolName,
          pediatrician,
          notes,
        });
      } else {
        await onAddChild({
          firstName,
          lastName,
          dateOfBirth,
          birthNumber,
          schoolName,
          pediatrician,
          notes,
        });
      }
      resetForm();
    } catch (err: any) {
      alert(`Chyba při ukládání: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Baby className="w-6 h-6 text-blue-600" />
            Evidence dětí v opatrovnickém spisu
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Základní údaje, věk, vzdělávací zařízení, lékařská péče a klíčové potřeby dětí pro soud a OSPOD.
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
            Přidat dítě do spisu
          </button>
        )}
      </div>

      {/* Modal / Form to add/edit child */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Baby className="w-5 h-5 text-blue-600" />
              {editingId ? 'Upravit profil dítěte' : 'Nový záznam dítěte do spisu'}
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
                Jméno dítěte *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="např. Jakub"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Příjmení dítěte
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="např. Novák"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Datum narození
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rodné číslo
              </label>
              <input
                type="text"
                value={birthNumber}
                onChange={(e) => setBirthNumber(e.target.value)}
                placeholder="např. 190615/1234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Škola / Školka (ZŠ / MŠ)
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="např. ZŠ Filosofská, Praha 4 (1. třída)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Praktický lékař (Pediatr)
              </label>
              <input
                type="text"
                value={pediatrician}
                onChange={(e) => setPediatrician(e.target.value)}
                placeholder="např. MUDr. Helena Malá, Poliklinika"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Poznámky, kroužky, zdraví & režimové zvyklosti
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Uveďte zájmy dítěte, kroužky, vztah k oběma rodičům, stravovací návyky nebo lékařské zprávy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              {isSubmitting ? 'Ukládám...' : editingId ? 'Uložit změny' : 'Zaregistrovat dítě'}
            </button>
          </div>
        </form>
      )}

      {/* Children List */}
      {children.length === 0 && !isAdding ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Baby className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Ve spisu zatím není evidováno žádné dítě</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Přidejte dítě pro přehlednou správu věku, rozvrhu školy, kroužků a důkazních materiálů.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer"
          >
            Přidat první dítě
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children.map((child) => {
            const age = calculateAge(child.dateOfBirth);
            return (
              <div
                key={child.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base">
                          {child.firstName[0]}
                        </span>
                        <div>
                          <h3 className="text-lg font-black text-slate-900">
                            {child.firstName} {child.lastName}
                          </h3>
                          {child.birthNumber && (
                            <span className="text-xs text-slate-500 font-mono">
                              RČ: {child.birthNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => startEdit(child)}
                        className="p-2 rounded-xl text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Upravit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Opravdu chcete odstranit dítě ${child.firstName} ze spisu?`)) {
                            onDeleteChild(child.id);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Odstranit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <span className="text-slate-400 block text-xs">Datum narození / Věk</span>
                        <span className="font-bold text-slate-800">
                          {child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString('cs-CZ') : 'Neuvedeno'}
                          {age !== null && ` (${age} let)`}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <School className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 block text-xs">Škola / Školka</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {child.schoolName || 'Neuvedeno'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 sm:col-span-2">
                      <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="truncate">
                        <span className="text-slate-400 block text-xs">Ošetřující pediatr</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {child.pediatrician || 'Neuveden'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {child.notes && (
                    <div className="mt-3 p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-slate-700">
                      <strong className="text-blue-900 block mb-0.5">Poznámky & zájmy:</strong>
                      {child.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
