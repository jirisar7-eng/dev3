import { apiFetch } from '../../utils/apiClient';
import React, { useState } from 'react';
import { ClientCase, CarePlan, CareHolidayRule } from '../../types';
import {
  Palmtree,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { CareHolidaysTab } from '../case/care/CareHolidaysTab';

interface CareHolidaysPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

export const CareHolidaysPage: React.FC<CareHolidaysPageProps> = ({
  activeCase,
  activePlan,
  onNavigate,
  onRefresh,
}) => {
  const pA = activePlan?.parentAName || 'Otec';
  const pB = activePlan?.parentBName || 'Matka';

  const handleAddRule = async (newRule: Omit<CareHolidayRule, 'id'>) => {
    if (!activePlan) {
      alert('Nejprve musíte mít vytvořený a aktivní plán péče.');
      return;
    }
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const existing = activePlan.holidayRules || [];
    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/plans/${activePlan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          holidayRules: [...existing, newRule],
        }),
      });

      if (!res.ok) {
        if (res.status === 503) throw new Error('Databázový server je momentálně nedostupný.');
        throw new Error('Nepodařilo se přidat prázdninové pravidlo.');
      }

      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba při ukládání pravidla.');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!activePlan) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const existing = activePlan.holidayRules || [];
    const updated = existing.filter((r) => r.id !== ruleId);
    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/plans/${activePlan.id}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          holidayRules: updated,
        }),
      });

      if (!res.ok) throw new Error('Nepodařilo se smazat pravidlo.');
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Chyba.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('/pece')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na přehled Péče o dítě</span>
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🏖️</span>
          <h1 className="text-2xl font-black text-slate-900">Prázdniny a svátky</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Definujte pravidla pro Vánoce, letní prázdniny, Velikonoce a svátky s automatickou rotací lichých a sudých roků.
        </p>
      </div>

      {!activePlan ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 shadow-xs">
          <Palmtree className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Nemáte aktivní plán péče</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Pro nastavení prázdninových pravidel je potřeba mít vytvořený alespoň jeden Care Plan.
          </p>
          <button
            onClick={() => onNavigate('/pece')}
            className="px-5 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800 transition-colors cursor-pointer"
          >
            Přejít na vytvoření plánu
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <CareHolidaysTab
            rules={activePlan.holidayRules || []}
            parentAName={pA}
            parentBName={pB}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
          />
        </div>
      )}
    </div>
  );
};
