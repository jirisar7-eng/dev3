import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan, CareSimulationComparison } from '../../types';
import {
  Scale,
  ArrowLeft,
  Printer,
  Bookmark,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  ShieldCheck,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CareComparisonView } from '../case/care/CareComparisonView';

interface CareComparisonPageProps {
  activeCase: ClientCase;
  activePlan: CarePlan | null;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
}

export const CareComparisonPage: React.FC<CareComparisonPageProps> = ({
  activeCase,
  activePlan,
  onNavigate,
  onRefresh,
}) => {
  const [comparisons, setComparisons] = useState<CareSimulationComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantsData, setVariantsData] = useState<any[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  const fetchSavedComparisons = async () => {
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/comparisons`, {
        headers: authHeaders,
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setComparisons(data.data);
        }
      }
    } catch (err) {
      console.error('Chyba při načítání srovnání:', err);
    }
  };

  const runComparison = async (save = false) => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    const childId = activeCase.children && activeCase.children.length > 0 ? activeCase.children[0].id : undefined;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/compare`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          patterns: ['7/7', '2-2-3', '3-4-4-3', '2-2-5-5', 'ALTERNATING_WEEKENDS'],
          childId,
          save,
          title: `Porovnání modelů péče – ${activeCase.title}`,
        }),
      });

      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        throw new Error('Porovnání modelů selhalo.');
      }

      const data = await res.json();
      if (data.success && data.data) {
        setVariantsData(data.data);
        if (save) {
          setIsSaved(true);
          fetchSavedComparisons();
          setTimeout(() => setIsSaved(false), 4000);
        }
      }
    } catch (err: any) {
      console.error('Chyba porovnání:', err);
      setError(err.message || 'Chyba porovnání.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComparison = async (id: string) => {
    if (!confirm('Opravdu chcete smazat toto uložené srovnání?')) return;
    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`/api/cases/${activeCase.id}/care/comparisons/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        fetchSavedComparisons();
      }
    } catch (err) {
      console.error('Chyba při mazání srovnání:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    runComparison(false);
    fetchSavedComparisons();
  }, [activeCase.id]);

  const pA = activePlan?.parentAName || 'Otec';
  const pB = activePlan?.parentBName || 'Matka';

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
            <span className="text-2xl">⚖️</span>
            <h1 className="text-2xl font-black text-slate-900">Porovnání modelů péče</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Objektivní analýza klíčových parametrů: poměr péče, počet předání, délka odloučení a dojezdy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => runComparison(true)}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Bookmark className="w-4 h-4" />
            <span>Uložit srovnání do spisu</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Tisknout / Export</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Srovnání bylo úspěšně uloženo do spisu.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Comparison Component */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Přepočítávám srovnávací tabulku...</p>
          </div>
        ) : (
          <CareComparisonView
            variants={variantsData}
            parentAName={pA}
            parentBName={pB}
            onSelectVariant={(pattern) => {
              onNavigate(`/pece/simulator?pattern=${pattern}`);
            }}
          />
        )}
      </div>

      {/* Saved Comparisons Section */}
      {comparisons.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Uložená srovnání ve spisu ({comparisons.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {comparisons.map((comp) => (
              <div key={comp.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <strong className="text-slate-900 font-bold block">{comp.title || 'Srovnání variant péče'}</strong>
                  <span className="text-[11px] text-slate-400">
                    Vytvořeno: {new Date(comp.createdAt).toLocaleString('cs-CZ')}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteComparison(comp.id)}
                  className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Smazat srovnání"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
