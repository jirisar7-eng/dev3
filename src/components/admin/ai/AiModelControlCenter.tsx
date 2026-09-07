import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch, safeJsonResponse } from '../../../utils/apiClient';
import {
  Cpu,
  Zap,
  BarChart2,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Sparkles,
  Info,
  Edit2,
  DollarSign,
  Activity,
  Globe,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ProviderData {
  id: string;
  key: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'DEPRECATED';
  enabled: boolean;
  adapterKey: string;
  baseUrl?: string;
  documentationUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  totalModels: number;
  activeModels: number;
  stats: {
    requestCount: number;
    successCount: number;
    failureCount: number;
    errorRate: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    totalTokens: number;
    estimatedCostUsd: number;
    telemetryStatus: string;
  };
  updatedAt: string;
}

export interface ModelData {
  id: string;
  providerId: string;
  providerKey: string;
  providerName: string;
  providerEnabled: boolean;
  providerStatus: string;
  key: string;
  displayName: string;
  modelName: string;
  status: string;
  enabled: boolean;
  lifecycleStatus: string;
  capabilities: string[];
  contextWindow: number;
  maxOutputTokens?: number;
  supportsTools: boolean;
  supportsStructuredOutput: boolean;
  supportsVision: boolean;
  supportsAudio?: boolean;
  supportsVideo?: boolean;
  supportsReasoning?: boolean;
  routingPriority: number;
  fallbackPriority: number;
  timeoutMs: number;
  maxRetries: number;
  freeTier: boolean;
  inputPricePer1M: number | null;
  outputPricePer1M: number | null;
  currency: string;
  zeroDataRetention: boolean;
  legalDataAllowed: boolean;
  role?: string;
  effectivePolicy?: any;
  notes?: string;
  updatedAt: string;
  stats: {
    requestCount: number;
    fallbackCount: number;
    avgLatencyMs: number;
    estimatedCostUsd: number;
  };
}

export interface RoutingTopologyData {
  requestParameters: {
    sensitiveData?: boolean;
    freeOnly?: boolean;
    capabilitiesRequired?: string[];
    preferredProviderKey?: string;
  };
  primary: { providerKey: string; modelName: string } | null;
  fallbacks: Array<{ providerKey: string; modelName: string }>;
  rejectedChain: Array<{
    id: string;
    key: string;
    providerKey: string;
    providerName: string;
    modelName: string;
    displayName: string;
    routingPriority: number;
    fallbackPriority: number;
    reason: string;
  }>;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Potvrdit',
  variant = 'warning',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`p-3 rounded-xl ${
              variant === 'danger'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400">Bezpečnostní potvrzení akce</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 mb-6 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700"
          >
            Zrušit
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-lg ${
              variant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AiModelControlCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'routing' | 'policy' | 'roles' | 'council' | 'telemetry'>('providers');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [models, setModels] = useState<ModelData[]>([]);
  const [routingTopology, setRoutingTopology] = useState<RoutingTopologyData | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Policy & Council State
  const [globalPolicy, setGlobalPolicy] = useState<any>(null);
  const [modelOverrides, setModelOverrides] = useState<Record<string, any>>({});
  const [editingRoleModel, setEditingRoleModel] = useState<ModelData | null>(null);
  const [roleForm, setRoleForm] = useState<{
    role: string;
    delegationEnabled: boolean;
    maxDelegationDepth: number;
    maxWorkersPerTask: number;
    sensitiveDataPolicy: string;
  }>({
    role: 'WORKER',
    delegationEnabled: true,
    maxDelegationDepth: 3,
    maxWorkersPerTask: 5,
    sensitiveDataPolicy: 'ALLOW_SECURE'
  });

  // Council Simulator State
  const [councilSim, setCouncilSim] = useState<{
    orchestratorModelKey: string;
    mode: 'SEQUENTIAL' | 'PARALLEL' | 'EVALUATION' | 'SYNTHESIS';
    taskTitle: string;
    taskDescriptionSummary: string;
    sensitiveData: boolean;
    freeOnly: boolean;
  }>({
    orchestratorModelKey: 'gemini-1.5-pro',
    mode: 'SEQUENTIAL',
    taskTitle: 'Rozbor právního podání a návrh strategie',
    taskDescriptionSummary: 'Srovnání judikátů a generování argumentů pro opatrovnické řízení.',
    sensitiveData: false,
    freeOnly: false
  });
  const [councilResult, setCouncilResult] = useState<any>(null);
  const [councilSimulating, setCouncilSimulating] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('ALL');
  const [selectedLifecycleFilter, setSelectedLifecycleFilter] = useState('ALL');
  const [legalDataFilter, setLegalDataFilter] = useState<'ALL' | 'ALLOWED' | 'FORBIDDEN'>('ALL');

  // Simulator state
  const [simSensitiveData, setSimSensitiveData] = useState(false);
  const [simFreeOnly, setSimFreeOnly] = useState(false);
  const [simPreferredProvider, setSimPreferredProvider] = useState('');

  // Confirmation Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning',
    onConfirm: () => {},
  });

  // Edit Model Modal State
  const [editingModel, setEditingModel] = useState<ModelData | null>(null);
  const [editForm, setEditForm] = useState<{
    displayName: string;
    routingPriority: number;
    fallbackPriority: number;
    legalDataAllowed: boolean;
    zeroDataRetention: boolean;
    lifecycleStatus: string;
    inputPricePer1M: number | string;
    outputPricePer1M: number | string;
    notes: string;
  }>({
    displayName: '',
    routingPriority: 10,
    fallbackPriority: 10,
    legalDataAllowed: false,
    zeroDataRetention: false,
    lifecycleStatus: 'PAID',
    inputPricePer1M: 0,
    outputPricePer1M: 0,
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/admin/ai/overview');
      const res = await safeJsonResponse<any>(response);
      if (res && res.success && res.data) {
        setProviders(res.data.providers || []);
        setModels(res.data.models || []);
        setRoutingTopology(res.data.routingTopology || null);
        setStats(res.data.stats || null);
        setGlobalPolicy(res.data.globalPolicy || null);
        setModelOverrides(res.data.modelOverrides || {});
      } else {
        setError(res?.error || 'Nepodařilo se načíst přehled AI registrů.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci se serverem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefreshCatalog = async () => {
    setRefreshing(true);
    setSuccessMsg(null);
    try {
      const response = await apiFetch('/api/admin/ai/refresh', { method: 'POST' });
      const res = await safeJsonResponse<any>(response);
      if (res && res.success) {
        setSuccessMsg('Katalog AI modelů byl úspěšně synchronizován a obnoven.');
        await fetchData();
      } else {
        setError(res?.error || 'Chyba při synchronizaci katalogu.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při synchronizaci.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDiscoverCatalog = async (providerKey?: string) => {
    setRefreshing(true);
    setSuccessMsg(null);
    try {
      const response = await apiFetch('/api/admin/ai/models/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerKey })
      });
      const res = await safeJsonResponse<any>(response);
      if (res && res.success && res.data) {
        const newCount = res.data.newModelsCreatedCount || 0;
        const updatedCount = res.data.updatedModelsCount || 0;
        setSuccessMsg(`Dynamické zjišťování dokonceno. Objeveno nových modelů: ${newCount} (výchozí stav: VYPNUTO/non-routable), ověřeno: ${updatedCount}.`);
        await fetchData();
      } else {
        setError(res?.error || 'Chyba při zjišťování dynamického katalogu.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při spouštění katalogové discovery.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRunHealthCheck = async (providerKey?: string) => {
    setRefreshing(true);
    setSuccessMsg(null);
    try {
      const response = await apiFetch('/api/admin/ai/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerKey }),
      });
      const res = await safeJsonResponse<any>(response);
      if (res && res.success && Array.isArray(res.data)) {
        const okCount = res.data.filter((r: any) => r.status === 'OK').length;
        setSuccessMsg(`Health-check dokončen. Ok: ${okCount}/${res.data.length}`);
        await fetchData();
      } else {
        setError(res?.error || 'Health-check selhal.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při spouštění health-check.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleProvider = (provider: ProviderData) => {
    const newEnabled = !provider.enabled;
    const title = newEnabled ? `Povolit providera ${provider.name}` : `VYPNUTÍ providera ${provider.name}`;
    const message = newEnabled
      ? `Opravdu chcete povolit AI providera ${provider.name}? Všechny jeho aktivní modely budou k dispozici pro směrování.`
      : `POZOR: Vypnutím providera ${provider.name} deaktivujete VŠECHNY jeho registrované modely (${provider.totalModels}) v živém směrování orchestrátoru!`;

    setModalConfig({
      isOpen: true,
      title,
      message,
      variant: newEnabled ? 'warning' : 'danger',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await apiFetch(`/api/admin/ai/providers/${provider.key}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: newEnabled }),
          });
          const res = await safeJsonResponse<any>(response);
          if (res && res.success) {
            setSuccessMsg(`Stav providera ${provider.name} byl změněn na ${newEnabled ? 'Aktivní' : 'Vypnutý'}.`);
            await fetchData();
          } else {
            setError(res?.error || 'Změna stavu providera selhala.');
          }
        } catch (err: any) {
          setError(err.message);
        }
      },
    });
  };

  const handleToggleModel = (model: ModelData) => {
    const newEnabled = !model.enabled;
    const isPrimaryCandidate = model.routingPriority >= 20;

    const title = newEnabled ? `Povolit model ${model.displayName}` : `VYPNUTÍ modelu ${model.displayName}`;
    const message = newEnabled
      ? `Chcete aktivovat model ${model.displayName} pro produkční směrování?`
      : isPrimaryCandidate
      ? `VAROVÁNÍ: Tento model (${model.displayName}) má vysoké routing priority skóre (${model.routingPriority}). Jeho vypnutím dojde k automatickému přepnutí na fallback modely.`
      : `Opravdu chcete zakázat model ${model.displayName}?`;

    setModalConfig({
      isOpen: true,
      title,
      message,
      variant: isPrimaryCandidate && !newEnabled ? 'danger' : 'warning',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        try {
          const response = await apiFetch(`/api/admin/ai/models/${model.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: newEnabled }),
          });
          const res = await safeJsonResponse<any>(response);
          if (res && res.success) {
            setSuccessMsg(`Model ${model.displayName} byl ${newEnabled ? 'povolen' : 'zakázán'}.`);
            await fetchData();
          } else {
            setError(res?.error || 'Změna stavu modelu selhala.');
          }
        } catch (err: any) {
          setError(err.message);
        }
      },
    });
  };

  const openEditModel = (model: ModelData) => {
    setEditingModel(model);
    setEditForm({
      displayName: model.displayName,
      routingPriority: model.routingPriority,
      fallbackPriority: model.fallbackPriority,
      legalDataAllowed: model.legalDataAllowed,
      zeroDataRetention: model.zeroDataRetention,
      lifecycleStatus: model.lifecycleStatus,
      inputPricePer1M: model.inputPricePer1M ?? 0,
      outputPricePer1M: model.outputPricePer1M ?? 0,
      notes: model.notes || '',
    });
  };

  const handleSaveModelConfig = async () => {
    if (!editingModel) return;

    try {
      const payload = {
        displayName: editForm.displayName,
        routingPriority: Number(editForm.routingPriority),
        fallbackPriority: Number(editForm.fallbackPriority),
        legalDataAllowed: editForm.legalDataAllowed,
        zeroDataRetention: editForm.zeroDataRetention,
        lifecycleStatus: editForm.lifecycleStatus,
        inputPricePer1M: Number(editForm.inputPricePer1M),
        outputPricePer1M: Number(editForm.outputPricePer1M),
        notes: editForm.notes,
      };

      const response = await apiFetch(`/api/admin/ai/models/${editingModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const res = await safeJsonResponse<any>(response);

      if (res && res.success) {
        setSuccessMsg(`Konfigurace modelu ${editingModel.displayName} byla úspěšně uložena.`);
        setEditingModel(null);
        await fetchData();
      } else {
        setError(res?.error || 'Uložení modelu selhalo.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveGlobalPolicy = async (policyUpdates: any) => {
    try {
      const response = await apiFetch('/api/admin/ai/policy', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policyUpdates),
      });
      const res = await safeJsonResponse<any>(response);
      if (res && res.success) {
        setSuccessMsg('Globální AI politika byla úspěšně aktualizována.');
        setGlobalPolicy(res.data);
      } else {
        setError(res?.error || 'Aktualizace globální politiky selhala.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveRoleOverride = async () => {
    if (!editingRoleModel) return;
    try {
      const response = await apiFetch(`/api/admin/ai/policy/models/${editingRoleModel.key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      });
      const res = await safeJsonResponse<any>(response);
      if (res && res.success) {
        setSuccessMsg(`Role a politika modelu ${editingRoleModel.displayName} byly uloženy.`);
        setEditingRoleModel(null);
        await fetchData();
      } else {
        setError(res?.error || 'Uložení role selhalo.');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRunCouncilSimulation = async () => {
    setCouncilSimulating(true);
    setCouncilResult(null);
    setError(null);
    try {
      const response = await apiFetch('/api/admin/ai/council/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(councilSim),
      });
      const res = await safeJsonResponse<any>(response);
      if (res && res.success && res.data) {
        setCouncilResult(res.data);
        setSuccessMsg(`Simulace AI Council dokončena. Stav plánu: ${res.data.status}`);
      } else {
        setError(res?.error || 'Simulace Council selhala.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCouncilSimulating(false);
    }
  };

  const fetchSimulatedRouting = async () => {
    try {
      const params = new URLSearchParams();
      if (simSensitiveData) params.append('sensitiveData', 'true');
      if (simFreeOnly) params.append('freeOnly', 'true');
      if (simPreferredProvider) params.append('preferredProviderKey', simPreferredProvider);

      const response = await apiFetch(`/api/admin/ai/routing?${params.toString()}`);
      const res = await safeJsonResponse<any>(response);
      if (res && res.success && res.data) {
        setRoutingTopology(res.data);
      }
    } catch (err) {
      console.error('Simulation error', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'routing') {
      fetchSimulatedRouting();
    }
  }, [simSensitiveData, simFreeOnly, simPreferredProvider, activeTab]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const matchesSearch =
        m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider = selectedProviderFilter === 'ALL' || m.providerKey === selectedProviderFilter;
      const matchesLifecycle = selectedLifecycleFilter === 'ALL' || m.lifecycleStatus === selectedLifecycleFilter;
      const matchesLegal =
        legalDataFilter === 'ALL' ||
        (legalDataFilter === 'ALLOWED' && m.legalDataAllowed) ||
        (legalDataFilter === 'FORBIDDEN' && !m.legalDataAllowed);

      return matchesSearch && matchesProvider && matchesLifecycle && matchesLegal;
    });
  }, [models, searchQuery, selectedProviderFilter, selectedLifecycleFilter, legalDataFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm font-medium text-slate-300">Načítám AI Control Center & Registr modelů...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & QUICK STATS BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-800 shadow-xl text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl shadow-inner">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">AI Model Control Center</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Control Plane
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Řídicí vrstva multi-provider AI orchestrátoru Synthesis • Zabezpečené server-side trasování
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDiscoverCatalog()}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-lg shadow-emerald-950 disabled:opacity-50"
              title="Aktivovat dynamické zjišťování dostupných modelů přes API/katalogy providerů"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Zjišťovat Katalog (Discovery)
            </button>
            <button
              onClick={handleRefreshCatalog}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Obnovit Katalog
            </button>
            <button
              onClick={() => handleRunHealthCheck()}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-950 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Spustit Health Check
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Aktivní Providerzy</span>
            <div className="text-lg font-extrabold text-slate-100 mt-0.5">
              {providers.filter((p) => p.enabled).length} / {providers.length}
            </div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Registrované Modely</span>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
              {models.filter((m) => m.enabled).length} / {models.length} aktivních
            </div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Celkový Počet Volání</span>
            <div className="text-lg font-extrabold text-indigo-400 mt-0.5">{stats?.totalCalls || 0}</div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Průměrná Latence P95</span>
            <div className="text-lg font-extrabold text-amber-400 mt-0.5">
              {stats?.providers ? Math.max(...Object.values(stats.providers).map((p: any) => p.p95LatencyMs || 0)) : 0} ms
            </div>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Odhadované Náklady</span>
            <div className="text-lg font-extrabold text-sky-400 mt-0.5">${stats?.estimatedCostUsd?.toFixed(4) || '0.0000'}</div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION MESSAGES */}
      {error && (
        <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-rose-400 hover:underline">
            Zavřít
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs text-emerald-400 hover:underline">
            Zavřít
          </button>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('providers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'providers'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          Dostavitelé (Providers) ({providers.length})
        </button>

        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'models'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Katalog Modelů ({models.length})
        </button>

        <button
          onClick={() => setActiveTab('routing')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'routing'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Směrování & Fallbacky
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'policy'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Globální AI Politika
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'roles'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-indigo-400" />
          Role Modelů & Overrides
        </button>

        <button
          onClick={() => setActiveTab('council')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'council'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          AI Council & Delegace
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'telemetry'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Telemetrie
        </button>
      </div>

      {/* TAB 1: PROVIDERS VIEW */}
      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                p.enabled
                  ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                  : 'bg-slate-950/60 border-slate-900/80 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      p.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-100">{p.name}</h3>
                    <p className="text-xs font-mono text-slate-400">{p.key}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                      p.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : p.status === 'DEGRADED'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {p.status}
                  </span>

                  <button
                    onClick={() => handleToggleProvider(p)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      p.enabled
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {p.enabled ? 'Vypnout' : 'Povolit'}
                  </button>
                </div>
              </div>

              {/* STATS METRICS GRID */}
              <div className="grid grid-cols-4 gap-2 my-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Modely</span>
                  <p className="font-bold text-slate-200 mt-0.5">
                    {p.activeModels} / {p.totalModels}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Requesty</span>
                  <p className="font-bold text-slate-200 mt-0.5">{p.stats.requestCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Chybovost</span>
                  <p className={`font-bold mt-0.5 ${p.stats.errorRate > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {p.stats.errorRate}%
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">P95 Latence</span>
                  <p className="font-bold text-amber-400 mt-0.5">{p.stats.p95LatencyMs} ms</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="truncate max-w-[200px] font-mono">{p.baseUrl || 'Bez baseUrl'}</span>
                <div className="flex items-center gap-2">
                  {p.documentationUrl && (
                    <a
                      href={p.documentationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-indigo-400 flex items-center gap-1"
                    >
                      Docs <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => handleRunHealthCheck(p.key)}
                    className="hover:text-white flex items-center gap-1 text-indigo-400"
                  >
                    Ping
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MODELS CATALOG VIEW */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS BAR */}
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat model podle názvu, klíče..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Provider Filter */}
              <select
                value={selectedProviderFilter}
                onChange={(e) => setSelectedProviderFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Všichni providerzy</option>
                {providers.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Lifecycle Filter */}
              <select
                value={selectedLifecycleFilter}
                onChange={(e) => setSelectedLifecycleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Všechny lifecycle stavy</option>
                <option value="FREE">FREE</option>
                <option value="FREE_TIER">FREE_TIER</option>
                <option value="PAID">PAID</option>
                <option value="OPEN_SOURCE">OPEN_SOURCE</option>
                <option value="DEPRECATED">DEPRECATED</option>
                <option value="UNAVAILABLE">UNAVAILABLE</option>
              </select>

              {/* Legal Data Filter */}
              <select
                value={legalDataFilter}
                onChange={(e) => setLegalDataFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">Všechny politiky právních dat</option>
                <option value="ALLOWED">🛡️ Právní data POVOLENA</option>
                <option value="FORBIDDEN">🚫 Právní data ZAKÁZÁNA</option>
              </select>
            </div>
          </div>

          {/* MODELS LIST */}
          <div className="space-y-3">
            {filteredModels.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all ${
                  m.enabled
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/60 border-slate-900 opacity-70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl border mt-0.5 ${
                        m.enabled
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          : 'bg-slate-800 text-slate-500 border-slate-700'
                      }`}
                    >
                      <Cpu className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-100">{m.displayName}</h4>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                          {m.modelName}
                        </span>
                        <span className="text-[10px] bg-slate-800/80 text-indigo-300 px-2 py-0.5 rounded-md font-medium">
                          {m.providerName}
                        </span>
                      </div>

                      {/* BADGES ROW */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                        {!m.enabled && (
                          <span className="px-2 py-0.5 rounded-md font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            VYPNUTO (Non-Routable)
                          </span>
                        )}

                        {(m.displayName.includes('(Discovered)') || m.notes?.includes('Dynamicky objeveno')) && (
                          <span className="px-2 py-0.5 rounded-md font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Discovered Model
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                            m.lifecycleStatus.includes('FREE')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : m.lifecycleStatus === 'PAID'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.lifecycleStatus}
                        </span>

                        {/* Legal Data Policy Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                            m.legalDataAllowed
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {m.legalDataAllowed ? (
                            <>
                              <ShieldCheck className="w-3 h-3" /> Právní Data OK
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="w-3 h-3" /> Právní Data Zakázána
                            </>
                          )}
                        </span>

                        {/* Priorities Badges */}
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono">
                          Routing Priority: <strong className="text-indigo-300">{m.routingPriority}</strong>
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono">
                          Fallback Priority: <strong className="text-amber-300">{m.fallbackPriority}</strong>
                        </span>

                        {/* Pricing Badge */}
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md font-mono">
                          Cena: ${m.inputPricePer1M ?? 0} / ${m.outputPricePer1M ?? 0} za 1M tokenů
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS & CONTROLS */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                      onClick={() => openEditModel(m)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Konfigurovat
                    </button>

                    <button
                      onClick={() => handleToggleModel(m)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                        m.enabled
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {m.enabled ? 'Zakázat Model' : 'Povolit Model'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredModels.length === 0 && (
              <div className="text-center p-8 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Žádný AI model neodpovídá zvoleným filtrům.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ROUTING & TOPOLOGY VIEW */}
      {activeTab === 'routing' && (
        <div className="space-y-6">
          {/* SIMULATOR CONTROLS */}
          <div className="p-5 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <SlidersHorizontal className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-100 uppercase tracking-wider">
                Simulátor Směrování AI Požadavků
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Otestujte, jak orchestrátor vyhodnocuje prioritní řetězec modelů pro různé bezpečnostní a rozpočtové
              podmínky:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={simSensitiveData}
                  onChange={(e) => setSimSensitiveData(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Citlivá / Právní data</span>
                  <span className="text-[10px] text-slate-400">Povolí pouze modely s legalDataAllowed=true</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={simFreeOnly}
                  onChange={(e) => setSimFreeOnly(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Pouze Bezplatný Režim</span>
                  <span className="text-[10px] text-slate-400">Povolí pouze modely s Free / Open Source tarifem</span>
                </div>
              </label>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-200 block mb-1">Preferovaný Provider</span>
                <select
                  value={simPreferredProvider}
                  onChange={(e) => setSimPreferredProvider(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Bez preference (Automatický výběr)</option>
                  {providers.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* VISUAL PIPELINE DISPLAY */}
          {routingTopology && (
            <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Aktuální Vypočítaná Trasa (Pipeline)
              </h4>

              {/* PRIMARY ROUTE */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 1. Hlavní Model (Primary Route)
                </span>

                {routingTopology.primary ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-slate-100">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="font-bold text-sm block">{routingTopology.primary.modelName}</span>
                        <span className="text-xs text-emerald-300 font-mono">
                          Provider: {routingTopology.primary.providerKey}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-lg uppercase">
                      Primary Selected
                    </span>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    Žádný model neodpovídá zvoleným restrikcím. Požadavek by selhal bez primární trasy!
                  </div>
                )}
              </div>

              {/* FALLBACK CHAIN */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-4 h-4" /> 2. Záchranný Řetězec (Fallback Chain)
                </span>

                {routingTopology.fallbacks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {routingTopology.fallbacks.map((fb, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-slate-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold">{fb.modelName}</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-mono">Provider: {fb.providerKey}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-950 p-3 rounded-xl border border-slate-800">
                    Žádné další dostupné fallback modely pro zvolené podmínky.
                  </p>
                )}
              </div>

              {/* REJECTED MODELS */}
              {routingTopology.rejectedChain.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Vyřazené / Přeskočené Modely Z Trasy ({routingTopology.rejectedChain.length})
                  </span>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {routingTopology.rejectedChain.map((rej) => (
                      <div
                        key={rej.id}
                        className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400"
                      >
                        <div className="flex items-center gap-2">
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="font-medium text-slate-300">{rej.displayName}</span>
                        </div>
                        <span className="text-[11px] text-rose-300/80 italic">{rej.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GLOBAL POLICY VIEW */}
      {activeTab === 'policy' && (
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Centrální Bezpečnostní a Runtime Politika AI
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Globální baseline pravidla pro oprávnění, citlivá data, nástroje a rozpočet.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
              Default DENY Enforced
            </span>
          </div>

          {globalPolicy && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security & Data Policy */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Datová & Bezpečnostní Politika
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Správa Citlivých Dat</span>
                    <select
                      value={globalPolicy.sensitiveDataPolicy}
                      onChange={(e) => handleSaveGlobalPolicy({ sensitiveDataPolicy: e.target.value })}
                      className="bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded px-2 py-1 text-xs"
                    >
                      <option value="ALLOW_SECURE">ALLOW_SECURE (Pouze vybrané modely)</option>
                      <option value="DENY">DENY (Aktivně blokovat)</option>
                      <option value="ANONYMIZE_REQUIRED">ANONYMIZE_REQUIRED</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Zpracování Právních Dat</span>
                    <select
                      value={globalPolicy.legalDataPolicy}
                      onChange={(e) => handleSaveGlobalPolicy({ legalDataPolicy: e.target.value })}
                      className="bg-slate-950 border border-slate-700 text-indigo-400 font-bold rounded px-2 py-1 text-xs"
                    >
                      <option value="RESTRICTED">RESTRICTED (Vyžaduje legalDataAllowed=true)</option>
                      <option value="ALLOW_ALL">ALLOW_ALL</option>
                      <option value="DENY">DENY</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Politika Nástrojů (Tools/FC)</span>
                    <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {globalPolicy.toolsPolicy}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Vision / Dokumenty Politika</span>
                    <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {globalPolicy.visionPolicy} / {globalPolicy.documentPolicy}
                    </span>
                  </div>
                </div>
              </div>

              {/* Limits & Delegation Limits */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Runtime Limity & Delegace
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Max Výstupní Tokeny</span>
                    <span className="font-mono text-slate-100 font-bold">{globalPolicy.maxTokens?.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Timeout / Max Retries</span>
                    <span className="font-mono text-slate-100 font-bold">{globalPolicy.timeoutMs} ms / {globalPolicy.retryLimit}x</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Delegace Povolena</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${globalPolicy.delegationEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {globalPolicy.delegationEnabled ? 'ANO' : 'NE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-300 font-semibold">Max Hloubka Delegace / Max Workerů</span>
                    <span className="font-mono text-amber-300 font-bold">{globalPolicy.maxDelegationDepth} úrovně / {globalPolicy.maxWorkersPerTask} workerů</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MODEL ROLES & OVERRIDES VIEW */}
      {activeTab === 'roles' && (
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                Role Modelů a Bezpečnostní Overrides
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfigurace architektonických rolí (Orchestrator, Specialist, Worker, Evaluator) a model-specific restrikcí.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((m) => {
              const override = modelOverrides[m.key] || {};
              const effectiveRole = m.role || override.role || 'WORKER';

              return (
                <div key={m.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-100 block">{m.displayName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.providerName} • {m.key}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase border ${
                      effectiveRole.includes('ORCHESTRATOR')
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : effectiveRole === 'SPECIALIST'
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : effectiveRole === 'EVALUATOR'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {effectiveRole}
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-slate-900 text-slate-400">
                    <div className="flex justify-between">
                      <span>Legal Data:</span>
                      <span className={`font-bold ${m.legalDataAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.legalDataAllowed ? 'POVOLENO' : 'ZAKÁZÁNO'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Hloubka Delegace:</span>
                      <span className="font-mono text-slate-200">{override.maxDelegationDepth ?? 3}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditingRoleModel(m);
                      setRoleForm({
                        role: effectiveRole,
                        delegationEnabled: override.delegationEnabled ?? true,
                        maxDelegationDepth: override.maxDelegationDepth ?? 3,
                        maxWorkersPerTask: override.maxWorkersPerTask ?? 5,
                        sensitiveDataPolicy: override.sensitiveDataPolicy || 'INHERIT'
                      });
                    }}
                    className="w-full py-1.5 mt-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Upravit Role & Policy
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: AI COUNCIL & DELEGATION SIMULATOR VIEW */}
      {activeTab === 'council' && (
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                AI Council & Delegace Workflow Simulator
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulace multimodálního rozhodování AI Council (Grok-2/OpenRouter/ChatGPT vs Gemini) a kontrola policy bran v reálném čase.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* SIMULATOR CONFIG FORM */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Nastavení Simulace</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hlavní Orchestrátor (Primary)</label>
                <select
                  value={councilSim.orchestratorModelKey}
                  onChange={(e) => setCouncilSim(p => ({ ...p, orchestratorModelKey: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:border-amber-500"
                >
                  {models.filter(m => m.enabled).map(m => (
                    <option key={m.key} value={m.key}>
                      {m.displayName} ({m.providerName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Režim AI Council Workflow</label>
                <select
                  value={councilSim.mode}
                  onChange={(e) => setCouncilSim(p => ({ ...p, mode: e.target.value as any }))}
                  className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl p-2.5 focus:border-amber-500"
                >
                  <option value="SEQUENTIAL">SEQUENTIAL (Sériové předávání podle rolí)</option>
                  <option value="PARALLEL">PARALLEL (Paralelní vypracování specialisty)</option>
                  <option value="EVALUATION">EVALUATION (Oponentura a nezávislá kontrola)</option>
                  <option value="SYNTHESIS">SYNTHESIS (Kombinovaný multimodální výstup)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Název Úkolu</label>
                <input
                  type="text"
                  value={councilSim.taskTitle}
                  onChange={(e) => setCouncilSim(p => ({ ...p, taskTitle: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-900">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                  <input
                    type="checkbox"
                    checked={councilSim.sensitiveData}
                    onChange={(e) => setCouncilSim(p => ({ ...p, sensitiveData: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500"
                  />
                  <span>🛡️ Obsahuje citlivá / právní data</span>
                </label>
              </div>

              <button
                onClick={handleRunCouncilSimulation}
                disabled={councilSimulating}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                {councilSimulating ? 'Generuji Plán Council...' : 'Spustit Simulaci Council'}
              </button>
            </div>

            {/* COUNCIL WORKFLOW RESULTS DISPLAY */}
            <div className="md:col-span-2 p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Výsledný Řízený Plán Delegace (Council Execution Plan)</span>
                {councilResult && (
                  <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                    councilResult.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {councilResult.status}
                  </span>
                )}
              </h4>

              {councilResult ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 flex justify-between">
                    <span>Orchestrátor: <strong className="text-amber-300">{councilResult.orchestratorModelKey}</strong></span>
                    <span>Režim: <strong className="text-indigo-300">{councilResult.mode}</strong></span>
                    <span>Kroků: <strong className="text-emerald-400">{councilResult.steps.length}</strong></span>
                  </div>

                  <div className="space-y-2">
                    {councilResult.steps.map((step: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                          step.policyEvaluation?.allowed
                            ? 'bg-slate-900/80 border-slate-800'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-[10px] font-extrabold">
                              #{step.stepIndex}
                            </span>
                            {step.stepTitle}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            step.policyEvaluation?.allowed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {step.policyEvaluation?.allowed ? 'ALLOW' : 'DENY'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>Delegováno na: <strong className="text-indigo-300">{step.targetAgentOrModel}</strong></span>
                          <span>Úloha: {step.taskType}</span>
                        </div>

                        <p className="text-[11px] text-slate-400 italic">{step.policyEvaluation?.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  Klikněte na "Spustit Simulaci Council" pro vygenerování a bezpečnostní posouzení delegovaného plánu.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE / POLICY OVERRIDE MODAL */}
      {editingRoleModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">Role & Policy Override: {editingRoleModel.displayName}</h3>
              <button onClick={() => setEditingRoleModel(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Architektonická Role</label>
                <select
                  value={roleForm.role}
                  onChange={(e) => setRoleForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-bold rounded-xl p-2.5"
                >
                  <option value="PRIMARY_ORCHESTRATOR">PRIMARY_ORCHESTRATOR (Hlavní řídicí entita)</option>
                  <option value="SECONDARY_ORCHESTRATOR">SECONDARY_ORCHESTRATOR (Sekundární koordinátor)</option>
                  <option value="SPECIALIST">SPECIALIST (Specializovaný modul/analytik)</option>
                  <option value="WORKER">WORKER (Běžný výpočetní worker)</option>
                  <option value="EVALUATOR">EVALUATOR (Oponentura / Audit / Kontrola)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max Hloubka Delegace</label>
                <input
                  type="number"
                  value={roleForm.maxDelegationDepth}
                  onChange={(e) => setRoleForm(p => ({ ...p, maxDelegationDepth: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button onClick={() => setEditingRoleModel(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Zrušit</button>
                <button onClick={handleSaveRoleOverride} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">Uložit Override</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MEASURED TELEMETRY VIEW */}
      {activeTab === 'telemetry' && (
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-100">Naměřená Telemetrie a Spotřeba</h3>
              <p className="text-xs text-slate-400">Přehled reálné spotřeby tokenů, latencí, chybovosti a kvót podle jednotlivých modelů</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                0-PII Sanitováno
              </span>
            </div>
          </div>

          {/* GOOGLE AI PRO SUBSCRIPTION NOTICE */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-200 block mb-0.5">Upozornění ke kvótám předplatného Google AI Pro:</strong>
              Google AI Pro Subscription usage <strong>NOT_AVAILABLE_THROUGH_CURRENT_API</strong>.
              Oficiální Gemini API neposkytuje telemetrii spotřeby osobního předplatného Google AI Pro. Všechna zobrazená data představují reálnou API Quota telemetrii projektového klíče Synthesis.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Prompt Tokeny</span>
              <p className="text-xl font-extrabold text-slate-100 mt-1">
                {stats?.tokenUsage?.promptTokens?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Completion Tokeny</span>
              <p className="text-xl font-extrabold text-slate-100 mt-1">
                {stats?.tokenUsage?.completionTokens?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Celkem Tokenů</span>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">
                {stats?.tokenUsage?.totalTokens?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-semibold">Odhadované Náklady</span>
              <p className="text-xl font-extrabold text-sky-400 mt-1">
                ${stats?.estimatedCostUsd?.toFixed(6) || '0.000000'}
              </p>
            </div>
          </div>

          {/* DETAILED PER-MODEL TELEMETRY TABLE */}
          <div className="mt-6 space-y-3">
            <h4 className="font-bold text-sm text-slate-200">Telemetrický Přehled po Modelech</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Model & Provider</th>
                    <th className="p-3">API Model ID</th>
                    <th className="p-3">Volání / Chyby</th>
                    <th className="p-3">Latence (Avg / P95)</th>
                    <th className="p-3">Typ Kvóty</th>
                    <th className="p-3">Stav Kvóty</th>
                    <th className="p-3 text-right">Náklady</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {models.map((m) => {
                    const tel = (m as any).telemetry;
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-all">
                        <td className="p-3">
                          <div className="font-bold text-slate-200">{m.displayName}</div>
                          <div className="text-[10px] text-slate-400">{m.providerName}</div>
                        </td>
                        <td className="p-3 font-mono text-indigo-300">
                          {m.modelName}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-200">{tel?.totalRequests || m.stats?.requestCount || 0}</span>
                          {' / '}
                          <span className={tel?.totalErrors ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {tel?.totalErrors || 0}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {tel?.avgLatencyMs || m.stats?.avgLatencyMs || 0}ms / {tel?.p95LatencyMs || 0}ms
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {tel?.quotaType || 'API_QUOTA'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.providerKey === 'gemini'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {m.providerKey === 'gemini' ? 'NOT_AVAILABLE_THROUGH_CURRENT_API' : (tel?.quotaStatus || 'OK')}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-400 font-bold">
                          ${tel?.totalCostUsd?.toFixed(6) || m.stats?.estimatedCostUsd?.toFixed(6) || '0.000000'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODEL MODAL */}
      {editingModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-100">Konfigurace Modelu</h3>
              <button
                onClick={() => setEditingModel(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zobrazovaný Název</label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Routing Priority</label>
                  <input
                    type="number"
                    value={editForm.routingPriority}
                    onChange={(e) => setEditForm((p) => ({ ...p, routingPriority: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fallback Priority</label>
                  <input
                    type="number"
                    value={editForm.fallbackPriority}
                    onChange={(e) => setEditForm((p) => ({ ...p, fallbackPriority: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Input Cena za 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.inputPricePer1M}
                    onChange={(e) => setEditForm((p) => ({ ...p, inputPricePer1M: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Output Cena za 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.outputPricePer1M}
                    onChange={(e) => setEditForm((p) => ({ ...p, outputPricePer1M: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.legalDataAllowed}
                    onChange={(e) => setEditForm((p) => ({ ...p, legalDataAllowed: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-200">
                    🛡️ Povolit spracování právních / citlivých dat (legalDataAllowed)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.zeroDataRetention}
                    onChange={(e) => setEditForm((p) => ({ ...p, zeroDataRetention: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-200">🔒 Zero-Data Retention Policy</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Poznámka / Popis</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingModel(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl"
              >
                Zrušit
              </button>
              <button
                onClick={handleSaveModelConfig}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg"
              >
                Uložit Konfiguraci
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        variant={modalConfig.variant}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AiModelControlCenter;
