import { apiFetch } from '../utils/apiClient';
import React, { useState, useEffect } from 'react';
import { ClientCase, CarePlan, CareMetrics, CareDay } from '../types';
import {
  AlertCircle,
  Briefcase,
  ChevronDown,
  Plus,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { CareMainDashboard } from '../components/care/CareMainDashboard';
import { CarePlanDetailPage } from '../components/care/CarePlanDetailPage';
import { CareCalendarPage } from '../components/care/CareCalendarPage';
import { CareSimulatorPage } from '../components/care/CareSimulatorPage';
import { CareComparisonPage } from '../components/care/CareComparisonPage';
import { CareHolidaysPage } from '../components/care/CareHolidaysPage';
import { CareLocationsPage } from '../components/care/CareLocationsPage';
import { CareStatisticsPage } from '../components/care/CareStatisticsPage';
import { CareHistoryPage } from '../components/care/CareHistoryPage';
import { CareHowItCalculatesPage } from '../components/care/CareHowItCalculatesPage';

interface CareHubPageProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

export const CareHubPage: React.FC<CareHubPageProps> = ({ onNavigate, currentPath = '/pece' }) => {
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [activeCase, setActiveCase] = useState<ClientCase | null>(null);
  const [activePlan, setActivePlan] = useState<CarePlan | null>(null);
  const [plans, setPlans] = useState<CarePlan[]>([]);
  const [metrics, setMetrics] = useState<CareMetrics | null>(null);
  const [days, setDays] = useState<CareDay[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDb503, setIsDb503] = useState(false);

  // Fetch Cases and then Care Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsDb503(false);

    const token = localStorage.getItem('tatovacesta_auth_token');
    const authHeaders: Record<string, string> = {};
    if (token) authHeaders['Authorization'] = `Bearer ${token}`;

    try {
      // 1. Load cases
      const casesRes = await apiFetch('/api/cases', { headers: authHeaders });
      if (!casesRes.ok) {
        if (casesRes.status === 503) {
          setIsDb503(true);
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        if (casesRes.status === 401) {
          onNavigate('/login');
          return;
        }
        throw new Error('Nepodařilo se načíst spisy uživatele.');
      }

      const casesData = await casesRes.json();
      const userCases: ClientCase[] = casesData.data || [];
      setCases(userCases);

      if (userCases.length === 0) {
        // Create a default case if none exists
        const createRes = await apiFetch('/api/cases', {
          method: 'POST',
          headers: authHeaders,
        });
        if (createRes.ok) {
          const createdCase = await createRes.json();
          if (createdCase.success && createdCase.data) {
            setCases([createdCase.data]);
            await loadCareData(createdCase.data.id, authHeaders);
            return;
          }
        }
      }

      const targetCase = activeCase
        ? userCases.find((c) => c.id === activeCase.id) || userCases[0]
        : userCases[0];

      if (targetCase) {
        setActiveCase(targetCase);
        await loadCareData(targetCase.id, authHeaders);
      }
    } catch (err: any) {
      console.error('Chyba při načítání péče:', err);
      setError(err.message || 'Chyba při načítání dat péče.');
    } finally {
      setLoading(false);
    }
  };

  const loadCareData = async (caseId: string, authHeaders: Record<string, string>) => {
    try {
      const careRes = await apiFetch(`/api/cases/${caseId}/care`, { headers: authHeaders });
      if (!careRes.ok) {
        if (careRes.status === 503) {
          setIsDb503(true);
          throw new Error('Databázový server je momentálně nedostupný. Zkuste to prosím znovu.');
        }
        throw new Error('Nepodařilo se načíst data Care Hubu.');
      }

      const careData = await careRes.json();
      if (careData.success && careData.data) {
        const cData = careData.data;
        setActivePlan(cData.activePlan || null);
        setPlans(cData.plans || []);
        setMetrics(cData.activePlan?.metrics || null);
        setDays(cData.activePlan?.days || []);
      }
    } catch (err: any) {
      console.error('Chyba Care data:', err);
      setError(err.message || 'Chyba dat péče.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCaseChange = async (newCaseId: string) => {
    const found = cases.find((c) => c.id === newCaseId);
    if (found) {
      setActiveCase(found);
      const token = localStorage.getItem('tatovacesta_auth_token');
      const authHeaders: Record<string, string> = {};
      if (token) authHeaders['Authorization'] = `Bearer ${token}`;
      setLoading(true);
      await loadCareData(found.id, authHeaders);
      setLoading(false);
    }
  };

  // Determine Sub-view from currentPath
  const path = currentPath || '/pece';

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Načítám modul Péče o dítě...</p>
      </div>
    );
  }

  // 2. 503 Database Unavailable State
  if (isDb503) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-xl font-black text-amber-950">Databázový server je momentálně nedostupný</h2>
          <p className="text-sm text-amber-800 max-w-md mx-auto leading-relaxed">
            Databázový server je momentálně nedostupný. Zkuste to prosím znovu za několik okamžiků.
          </p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Zkusit znovu</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error && !activeCase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto" />
          <h2 className="text-xl font-black text-red-950">Nepodařilo se načíst data</h2>
          <p className="text-sm text-red-800 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 rounded-xl bg-red-800 text-white font-bold text-xs hover:bg-red-900 transition-colors shadow-xs cursor-pointer"
          >
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  if (!activeCase) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-black text-slate-900">Nemáte žádný aktivní spis</h2>
        <p className="text-xs text-slate-500">Pro využití modulu péče je potřeba mít založený spis.</p>
      </div>
    );
  }

  // Sub-routes logic
  const renderSubView = () => {
    // /pece/plany/:id
    if (path.startsWith('/pece/plany/')) {
      const parts = path.split('/pece/plany/');
      const planId = parts[1]?.split('?')[0]?.split('/')[0];
      return (
        <CarePlanDetailPage
          planId={planId}
          activeCase={activeCase}
          onNavigate={onNavigate}
          onRefresh={fetchData}
        />
      );
    }

    // /pece/kalendar
    if (path.startsWith('/pece/kalendar')) {
      return (
        <CareCalendarPage
          activeCase={activeCase}
          activePlan={activePlan}
          days={days}
          onNavigate={onNavigate}
          onRefresh={fetchData}
        />
      );
    }

    // /pece/simulator
    if (path.startsWith('/pece/simulator')) {
      return (
        <CareSimulatorPage
          activeCase={activeCase}
          activePlan={activePlan}
          onNavigate={onNavigate}
          onRefresh={fetchData}
        />
      );
    }

    // /pece/porovnani
    if (path.startsWith('/pece/porovnani')) {
      return (
        <CareComparisonPage
          activeCase={activeCase}
          activePlan={activePlan}
          onNavigate={onNavigate}
          onRefresh={fetchData}
        />
      );
    }

    // /pece/prazdniny
    if (path.startsWith('/pece/prazdniny')) {
      return (
        <CareHolidaysPage
          activeCase={activeCase}
          activePlan={activePlan}
          onNavigate={onNavigate}
          onRefresh={fetchData}
        />
      );
    }

    // /pece/mista
    if (path.startsWith('/pece/mista')) {
      return (
        <CareLocationsPage
          activeCase={activeCase}
          activePlan={activePlan}
          onNavigate={onNavigate}
          onRefresh={fetchData}
        />
      );
    }

    // /pece/statistiky
    if (path.startsWith('/pece/statistiky')) {
      return (
        <CareStatisticsPage
          activeCase={activeCase}
          activePlan={activePlan}
          metrics={metrics}
          onNavigate={onNavigate}
        />
      );
    }

    // /pece/historie
    if (path.startsWith('/pece/historie')) {
      return (
        <CareHistoryPage
          activeCase={activeCase}
          activePlan={activePlan}
          onNavigate={onNavigate}
        />
      );
    }

    // /pece/jak-se-pocita
    if (path.startsWith('/pece/jak-se-pocita')) {
      return <CareHowItCalculatesPage onNavigate={onNavigate} />;
    }

    // Default: Main Dashboard
    return (
      <CareMainDashboard
        activeCase={activeCase}
        activePlan={activePlan}
        plans={plans}
        metrics={metrics}
        days={days}
        onNavigate={onNavigate}
        onRefresh={fetchData}
      />
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Case Selector Bar (if user has multiple cases) */}
      {cases.length > 1 && (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Briefcase className="w-4 h-4 text-slate-500" />
            <span>Aktivní spis:</span>
            <select
              value={activeCase.id}
              onChange={(e) => handleCaseChange(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-900 focus:ring-2 focus:ring-blue-900 outline-hidden"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Render Current Sub-View */}
      {renderSubView()}
    </div>
  );
};
