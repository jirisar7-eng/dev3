import React, { useState } from 'react';
import { ClientCase, CaseParticipant, CareArrangement } from '../../types';
import {
  Scale,
  Users,
  Building,
  Edit2,
  Plus,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Clock,
  Shield,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface CaseProceedingsTabProps {
  activeCase: ClientCase;
  onUpdateCase: (data: Partial<ClientCase>) => Promise<void>;
  onAddParticipant: (p: Partial<CaseParticipant>) => Promise<void>;
  onUpdateParticipant: (id: string, p: Partial<CaseParticipant>) => Promise<void>;
  onDeleteParticipant: (id: string) => Promise<void>;
  onAddCareArrangement: (care: Partial<CareArrangement>) => Promise<void>;
}

export const CaseProceedingsTab: React.FC<CaseProceedingsTabProps> = ({
  activeCase,
  onUpdateCase,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
  onAddCareArrangement,
}) => {
  const participants = activeCase.participants || [];
  const careArrangements = activeCase.careArrangements || [];

  // Edit Case Modal state
  const [isEditingCase, setIsEditingCase] = useState(false);
  const [caseTitle, setCaseTitle] = useState(activeCase.title || '');
  const [caseNumber, setCaseNumber] = useState(activeCase.caseNumber || '');
  const [court, setCourt] = useState(activeCase.court || '');
  const [status, setStatus] = useState(activeCase.status || 'ACTIVE');
  const [currentCareType, setCurrentCareType] = useState(activeCase.currentCareType || 'STRIDAVA');
  const [description, setDescription] = useState(activeCase.description || '');

  // Participant Form state
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [partName, setPartName] = useState('');
  const [partRole, setPartRole] = useState<string>('MATKA');
  const [partEmail, setPartEmail] = useState('');
  const [partPhone, setPartPhone] = useState('');
  const [partAddress, setPartAddress] = useState('');
  const [partInstitution, setPartInstitution] = useState('');
  const [partNotes, setPartNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPartForm = () => {
    setPartName('');
    setPartRole('MATKA');
    setPartEmail('');
    setPartPhone('');
    setPartAddress('');
    setPartInstitution('');
    setPartNotes('');
    setIsAddingPart(false);
    setEditingPartId(null);
  };

  const startEditPart = (p: CaseParticipant) => {
    setEditingPartId(p.id);
    setPartName(p.name);
    setPartRole(p.role);
    setPartEmail(p.email || '');
    setPartPhone(p.phone || '');
    setPartAddress(p.address || '');
    setPartInstitution(p.institution || '');
    setPartNotes(p.notes || '');
    setIsAddingPart(true);
  };

  const handleCaseSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateCase({
        title: caseTitle,
        caseNumber,
        court,
        status: status as any,
        currentCareType: currentCareType as any,
        description,
      });
      setIsEditingCase(false);
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingPartId) {
        await onUpdateParticipant(editingPartId, {
          name: partName,
          role: partRole as any,
          email: partEmail,
          phone: partPhone,
          address: partAddress,
          institution: partInstitution,
          notes: partNotes,
        });
      } else {
        await onAddParticipant({
          name: partName,
          role: partRole as any,
          email: partEmail,
          phone: partPhone,
          address: partAddress,
          institution: partInstitution,
          notes: partNotes,
        });
      }
      resetPartForm();
    } catch (err: any) {
      alert(`Chyba: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OTEC':
        return '👨 Otec';
      case 'MATKA':
        return '👩 Matka';
      case 'OSPOD':
        return '🏛️ Kolizní opatrovník (OSPOD)';
      case 'SOUDCE':
        return '⚖️ Samosoudce / Předseda senátu';
      case 'ADVOKAT_OTEC':
        return '👔 Advokát otce';
      case 'ADVOKAT_MATKA':
        return '💼 Advokát matky';
      case 'ZNALEC':
        return '🧠 Znalec (Psycholog / Psychiatr)';
      case 'MEDIATOR':
        return '🤝 Mediátor';
      default:
        return '👤 Účastník';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            Soudní řízení, Účastníci & Režim péče
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Evidence příslušného soudu, spisové značky, kontaktů na OSPOD a advokáty a specifikace modelu péče.
          </p>
        </div>

        <button
          onClick={() => setIsEditingCase(true)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Edit2 className="w-4 h-4 text-blue-600" />
          Upravit parametry spisu
        </button>
      </div>

      {/* Edit Case Modal */}
      {isEditingCase && (
        <form
          onSubmit={handleCaseSave}
          className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-600 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Úprava parametrů soudního spisu
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingCase(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Název spisu *
              </label>
              <input
                type="text"
                required
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Spisová značka soudu
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="např. 12 P 45/2026, 34 Nc 120/2025"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Příslušný soud
              </label>
              <input
                type="text"
                value={court}
                onChange={(e) => setCourt(e.target.value)}
                placeholder="např. Obvodní soud pro Prahu 4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stav řízení
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="ACTIVE">Aktivní řízení (probíhá)</option>
                <option value="CLOSED">Pravomocně uzavřeno</option>
                <option value="ARCHIVED">Archivováno</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Požadovaný / Aktuální model péče
              </label>
              <select
                value={currentCareType}
                onChange={(e) => setCurrentCareType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              >
                <option value="STRIDAVA">Střídavá péče (např. 7/7 nebo 14/14)</option>
                <option value="SPOLECNA">Společná péče obou rodičů bez přesného dělení</option>
                <option value="VYHRADNI_OTEC">Výhradní péče otce s úpravou styku matky</option>
                <option value="VYHRADNI_MATKA">Péče matky s rozšířeným stykem otce</option>
                <option value="UPRAVA_STYKU">Pouze rozšířený styk (každý druhý víkend + všední dny)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Stručné shrnutí sporu a procesní strategie
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditingCase(false)}
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
              {isSubmitting ? 'Ukládám...' : 'Uložit parametry'}
            </button>
          </div>
        </form>
      )}

      {/* Case Details Card & Care Arrangement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 lg:col-span-2">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-blue-600" />
            Parametry soudního řízení
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-xs">Soudní orgán</span>
              <span className="font-bold text-slate-900 text-sm">{activeCase.court || 'Neuveden'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-xs">Spisová značka</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{activeCase.caseNumber || 'Zatím nepřidělena'}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-xs">Typ řízení</span>
              <span className="font-bold text-slate-900 text-sm">Opatrovnické řízení o péči a výživě</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 block text-xs">Model péče</span>
              <span className="font-bold text-blue-900 text-sm">{activeCase.currentCareType || 'Střídavá péče'}</span>
            </div>
          </div>

          {activeCase.description && (
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 text-xs text-slate-700 space-y-1">
              <strong className="text-blue-900 block font-bold">Popis řízení & stanovisko:</strong>
              <p className="leading-relaxed">{activeCase.description}</p>
            </div>
          )}
        </div>

        {/* Care Arrangement Summary */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md flex flex-col justify-between space-y-4">
          <div>
            <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold inline-block">
              Model péče
            </span>
            <h4 className="text-lg font-black mt-3">Střídavá péče 7/7</h4>
            <p className="text-xs text-blue-200 mt-1">
              Rovnoměrný střídavý interval s předáváním v pátek odpoledne.
            </p>

            <div className="mt-4 space-y-2 text-xs text-blue-100 font-medium">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-300" />
                <span>Předání: <strong>Pátek 15:30 / 16:00</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-300" />
                <span>Místo: <strong>Před školou / bydlištěm</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
            <span className="text-blue-200">Výživné:</span>
            <span className="font-bold text-white text-sm">Vzájemně se neplatí / 0 Kč</span>
          </div>
        </div>
      </div>

      {/* Participants Directory */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Adresář účastníků řízení & OSPOD ({participants.length})
          </h3>
          {!isAddingPart && (
            <button
              onClick={() => {
                resetPartForm();
                setIsAddingPart(true);
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Přidat účastníka
            </button>
          )}
        </div>

        {/* Add/Edit Participant Form */}
        {isAddingPart && (
          <form
            onSubmit={handlePartSubmit}
            className="p-5 rounded-2xl bg-slate-50 border-2 border-blue-500 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-bold text-slate-900">
                {editingPartId ? 'Upravit účastníka' : 'Přidat nového účastníka / orgán'}
              </h4>
              <button
                type="button"
                onClick={resetPartForm}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Jméno a příjmení / Název *
                </label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="např. Bc. Martina Veselá, JUDr. Eva Nováková"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Role v řízení
                </label>
                <select
                  value={partRole}
                  onChange={(e) => setPartRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                >
                  <option value="MATKA">👩 Matka</option>
                  <option value="OTEC">👨 Otec</option>
                  <option value="OSPOD">🏛️ Kolizní opatrovník (OSPOD)</option>
                  <option value="SOUDCE">⚖️ Samosoudce</option>
                  <option value="ADVOKAT_OTEC">👔 Advokát otce</option>
                  <option value="ADVOKAT_MATKA">💼 Advokát matky</option>
                  <option value="ZNALEC">🧠 Soudní znalec</option>
                  <option value="MEDIATOR">🤝 Mediátor</option>
                  <option value="JINY">👤 Jiný účastník</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={partEmail}
                  onChange={(e) => setPartEmail(e.target.value)}
                  placeholder="m.vesela@praha4.cz"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={partPhone}
                  onChange={(e) => setPartPhone(e.target.value)}
                  placeholder="+420 261 197 111"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Instituce / Pracoviště
                </label>
                <input
                  type="text"
                  value={partInstitution}
                  onChange={(e) => setPartInstitution(e.target.value)}
                  placeholder="např. ÚMČ Praha 4, Odbor sociálních věcí"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Adresa sídla / Bydliště
                </label>
                <input
                  type="text"
                  value={partAddress}
                  onChange={(e) => setPartAddress(e.target.value)}
                  placeholder="Antala Staška 2059/80b, Praha 4"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Poznámky & úřední hodiny
                </label>
                <textarea
                  rows={2}
                  value={partNotes}
                  onChange={(e) => setPartNotes(e.target.value)}
                  placeholder="např. Úřední dny Po a St 8-17 hod, kancelář 312..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetPartForm}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-1.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 cursor-pointer"
              >
                {isSubmitting ? 'Ukládám...' : editingPartId ? 'Uložit změny' : 'Přidat účastníka'}
              </button>
            </div>
          </form>
        )}

        {/* Participants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {participants.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{p.name}</h4>
                    <span className="text-xs font-bold text-blue-800 px-2 py-0.5 bg-blue-100 rounded-md inline-block mt-0.5">
                      {getRoleLabel(p.role)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditPart(p)}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Upravit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Opravdu chcete odstranit účastníka ${p.name}?`)) {
                          onDeleteParticipant(p.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Odstranit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {p.institution && (
                    <p className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{p.institution}</span>
                    </p>
                  )}
                  {p.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${p.email}`} className="text-blue-600 hover:underline">
                        {p.email}
                      </a>
                    </p>
                  )}
                  {p.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${p.phone}`} className="text-slate-800 hover:underline">
                        {p.phone}
                      </a>
                    </p>
                  )}
                  {p.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{p.address}</span>
                    </p>
                  )}
                </div>

                {p.notes && (
                  <p className="mt-2 text-xs text-slate-500 italic bg-white p-2 rounded-xl border border-slate-100">
                    {p.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
