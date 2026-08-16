import React, { useState } from 'react';
import { CareHolidayRule, CarePlan } from '../../../types';
import {
  Palmtree,
  Sun,
  Snowflake,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
} from 'lucide-react';

interface CareHolidaysTabProps {
  plan?: CarePlan;
  rules?: CareHolidayRule[];
  onAddRule?: (newRule: Omit<CareHolidayRule, 'id'>) => Promise<void>;
  onDeleteRule?: (ruleId: string) => Promise<void>;
  onSaveHolidayRules?: (rules: Partial<CareHolidayRule>[]) => void;
  parentAName?: string;
  parentBName?: string;
}

export const CareHolidaysTab: React.FC<CareHolidaysTabProps> = ({
  plan,
  rules: propRules,
  onAddRule,
  onDeleteRule,
  onSaveHolidayRules,
  parentAName = 'Otec',
  parentBName = 'Matka',
}) => {
  const defaultRules: Partial<CareHolidayRule>[] = [
    {
      holidayType: 'SUMMER',
      name: 'Letní prázdniny (červenec – srpen)',
      rulePattern: 'HALF_HALF',
      oddYearParent: 'PARENT_A',
      evenYearParent: 'PARENT_B',
      daysCount: 62,
    },
    {
      holidayType: 'CHRISTMAS',
      name: 'Vánoční svátky (24.–26. prosince)',
      rulePattern: 'ALTERNATING_YEARS',
      oddYearParent: 'PARENT_A',
      evenYearParent: 'PARENT_B',
      daysCount: 3,
    },
    {
      holidayType: 'NEW_YEAR',
      name: 'Silvestr a Nový rok (31.12. – 1.1.)',
      rulePattern: 'ALTERNATING_YEARS',
      oddYearParent: 'PARENT_B',
      evenYearParent: 'PARENT_A',
      daysCount: 2,
    },
    {
      holidayType: 'EASTER',
      name: 'Velikonoční prázdniny (Čt–Po)',
      rulePattern: 'ALTERNATING_YEARS',
      oddYearParent: 'PARENT_A',
      evenYearParent: 'PARENT_B',
      daysCount: 5,
    },
    {
      holidayType: 'SPRING',
      name: 'Jarní prázdniny (1 týden dle okresu)',
      rulePattern: 'ALTERNATING_YEARS',
      oddYearParent: 'PARENT_B',
      evenYearParent: 'PARENT_A',
      daysCount: 7,
    },
    {
      holidayType: 'AUTUMN',
      name: 'Podzimní prázdniny',
      rulePattern: 'ALTERNATING_YEARS',
      oddYearParent: 'PARENT_A',
      evenYearParent: 'PARENT_B',
      daysCount: 4,
    },
  ];

  const [rules, setRules] = useState<Partial<CareHolidayRule>[]>(
    propRules || (plan as any)?.holidayRules || defaultRules
  );

  // Sync state if propRules changes
  React.useEffect(() => {
    if (propRules) {
      setRules(propRules);
    }
  }, [propRules]);

  const pA = plan?.parentAName || parentAName;
  const pB = plan?.parentBName || parentBName;

  const handleUpdateRule = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
    if (onSaveHolidayRules) onSaveHolidayRules(updated);
  };

  const getHolidayIcon = (type?: string) => {
    switch (type) {
      case 'SUMMER':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'CHRISTMAS':
      case 'NEW_YEAR':
        return <Snowflake className="w-5 h-5 text-blue-500" />;
      case 'EASTER':
      case 'SPRING':
        return <Palmtree className="w-5 h-5 text-emerald-500" />;
      default:
        return <Calendar className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Palmtree className="w-5 h-5 text-orange-600" />
            Harmonogram prázdnin a svátků
          </h3>
          <p className="text-xs text-slate-500">
            Pravidla střídání letních prázdnin, Vánoc, Velikonoc a dalších volných dnů
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-950 text-xs font-bold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-orange-600" />
          <span>Prázdninová pravidla mají přednost před běžným rozpisem</span>
        </div>
      </div>

      {/* Holiday Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {getHolidayIcon(rule.holidayType)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{rule.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Délka: cca {rule.daysCount} dní
                    </span>
                  </div>
                </div>
              </div>

              {/* Pattern Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Princip rozdělení:
                </label>
                <select
                  value={rule.rulePattern || 'ALTERNATING_YEARS'}
                  onChange={(e) => handleUpdateRule(idx, 'rulePattern', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium"
                >
                  <option value="ALTERNATING_YEARS">Střídání po letech (lichý / sudý rok)</option>
                  <option value="HALF_HALF">Rozdělení na dvě stejné poloviny</option>
                  <option value="BY_AGREEMENT">Vždy dle vzájemné dohody rodičů</option>
                  <option value="SPECIFIC_DATES">Pevně stanovené termíny</option>
                </select>
              </div>

              {/* Odd / Even year assignment */}
              {rule.rulePattern === 'ALTERNATING_YEARS' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-900 uppercase block mb-1">
                      Liché roky (2025, 2027...)
                    </span>
                    <select
                      value={rule.oddYearParent || 'PARENT_A'}
                      onChange={(e) => handleUpdateRule(idx, 'oddYearParent', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-blue-300 text-xs font-bold bg-white text-blue-950"
                    >
                      <option value="PARENT_A">{pA}</option>
                      <option value="PARENT_B">{pB}</option>
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200">
                    <span className="text-[10px] font-bold text-purple-900 uppercase block mb-1">
                      Sudé roky (2026, 2028...)
                    </span>
                    <select
                      value={rule.evenYearParent || 'PARENT_B'}
                      onChange={(e) => handleUpdateRule(idx, 'evenYearParent', e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-purple-300 text-xs font-bold bg-white text-purple-950"
                    >
                      <option value="PARENT_A">{pA}</option>
                      <option value="PARENT_B">{pB}</option>
                    </select>
                  </div>
                </div>
              )}

              {rule.rulePattern === 'HALF_HALF' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800">1. polovina vs 2. polovina:</div>
                  <p className="text-[11px]">
                    V lichých letech má 1. polovinu {pA} a 2. polovinu {pB}. V sudých letech se pořadí obrací.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
