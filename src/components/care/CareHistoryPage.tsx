import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan } from '../../types';
import { History, ArrowLeft, RotateCcw, ShieldCheck, AlertCircle, Calendar, User } from 'lucide-react';

interface CareHistoryPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  onNavigate: (path: string) => void;
}

export const CareHistoryPage: React.FC<CareHistoryPageProps> = ({
  activeCase,
  activePlan,
  onNavigate,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await apiFetch(`/api/cases/${activeCase.id}/care/history`, {
        headers: authHeaders,
      });

      if (!res.ok) {
        if (res.status === 503) throw new Error('Databázový server je momentálně nedostupný.');
        throw new Error('Nepodařilo se načíst historii změn.');
      }

      const data = await res.json();
      if (data.success && data.data) {
        setLogs(data.data);
      }
    } catch (err: any) {
      console.error('Chyba historie:', err);
      setError(err.message || 'Chyba historie.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeCase.id]);

  const actionLabel = (action: string) => {
    switch (action) {
      case 'CARE_PLAN_CREATED':
        return 'Vytvoření plánu péče';
      case 'CARE_PLAN_UPDATED':
        return 'Úprava parametrů / dnů';
      case 'CARE_PLAN_CALENDAR_SYNC':
        return 'Synchronizace s kalendářem';
      case 'CARE_PLAN_SIMULATION_SAVED':
        return 'Uložení srovnání variant';
      case 'CARE_PLAN_DELETED':
        return 'Smazání plánu péče';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('/pece')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět na přehled Péče o dítě</span>
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🕘</span>
            <h1 className="text-2xl font-black text-slate-900">Historie změn a synchronizací</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auditní záznamy všech operací nad moduly péče o dítě ve spisu {activeCase.title}.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Obnovit</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Načítám auditní záznamy...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <History className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Zatím nebyly zaznamenány žádné změny v péči.</p>
            <p className="text-xs text-slate-400">Všechny budoucí úpravy plánů, kalendáře i simulací budou bezpečně auditovány zde.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-[10px]">
                      {actionLabel(log.action)}
                    </span>
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <User className="w-3 h-3 text-slate-400" />
                      {log.userEmail || 'Autorizovaný uživatel'}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium leading-relaxed">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {new Date(log.createdAt).toLocaleString('cs-CZ')}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-end gap-1 mt-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Ověřeno v auditu
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
