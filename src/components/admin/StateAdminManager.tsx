import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Server,
  Database,
  ShieldCheck,
  Clock,
  ExternalLink,
  Search,
  Filter,
  Layers,
  ArrowRight,
  Code,
  Gauge
} from 'lucide-react';

export interface ConnectorHealthInfo {
  id: string;
  name: string;
  provider: string;
  priority: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
  lastHttpStatus?: number;
  durationMs?: number;
  lastCheckedAt?: string;
  lastSuccessAt?: string;
  errorMessage?: string;
  recordsCount?: number;
  endpoint: string;
}

export interface StateAdminHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';
  connectors: Record<string, ConnectorHealthInfo>;
  auditLogsCount: number;
  lastCheckedAt: string;
}

export interface StateAdminAuditItem {
  id: string;
  source: string;
  endpoint: string;
  httpStatus: number;
  durationMs: number;
  success: boolean;
  recordsCount: number;
  errorMessage?: string;
  timestamp: string | Date;
}

export const StateAdminManager: React.FC = () => {
  const [healthData, setHealthData] = useState<StateAdminHealthResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<StateAdminAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [lastCheckTriggeredAt, setLastCheckTriggeredAt] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Fetch current health status and audits
  const fetchHealthAndAudits = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [healthRes, auditsRes] = await Promise.all([
        fetch('/api/admin/state-admin/health'),
        fetch('/api/admin/state-admin/audits'),
      ]);

      if (!healthRes.ok) {
        throw new Error(`Chyba načtení stavu health checku: HTTP ${healthRes.status}`);
      }

      const healthJson = await healthRes.json();
      if (healthJson.success) {
        setHealthData(healthJson);
      }

      if (auditsRes.ok) {
        const auditsJson = await auditsRes.json();
        if (auditsJson.success && Array.isArray(auditsJson.audits)) {
          setAuditLogs(auditsJson.audits);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Nepodařilo se načíst diagnostiku státní správy.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndAudits();
  }, []);

  // Cooldown timer handler
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Trigger live manual health check
  const handleTriggerHealthCheck = async () => {
    if (cooldownRemaining > 0 || isChecking) return;

    try {
      setIsChecking(true);
      setError(null);

      const res = await fetch('/api/admin/state-admin/health-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Kontrola selhala: HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        setHealthData(json);
        setLastCheckTriggeredAt(Date.now());
        setCooldownRemaining(10); // 10s cooldown to protect upstream APIs
      }

      // Refresh audit logs
      const auditsRes = await fetch('/api/admin/state-admin/audits');
      if (auditsRes.ok) {
        const auditsJson = await auditsRes.json();
        if (auditsJson.success && Array.isArray(auditsJson.audits)) {
          setAuditLogs(auditsJson.audits);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při provádění živé diagnostiky.');
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN') => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            HEALTHY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            DEGRADED
          </span>
        );
      case 'UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            UNAVAILABLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            UNKNOWN
          </span>
        );
    }
  };

  const filteredAudits = selectedSourceFilter === 'ALL'
    ? auditLogs
    : auditLogs.filter((a) => a.source === selectedSourceFilter);

  const connectorsList = healthData?.connectors ? Object.values(healthData.connectors) : [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                State Administration Hub
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ČSÚ • NKOD • MSp • e-Sbírka
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dohledový panel státních registrů a otevřených dat
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Centralizovaná diagnostika a monitoring konektorů pro data státní správy ČR.
              Veškeré dotazy jsou striktně chráněny server-side SSRF validací a fail-closed politikou bez syntetických dat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchHealthAndAudits}
              disabled={isLoading || isChecking}
              className="p-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              title="Obnovit stav z mezipaměti"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>

            <button
              onClick={handleTriggerHealthCheck}
              disabled={isChecking || cooldownRemaining > 0}
              className="px-5 py-2.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Gauge className={`w-4 h-4 ${isChecking ? 'animate-spin text-amber-300' : ''}`} />
              {isChecking
                ? 'Provádím kontrolu...'
                : cooldownRemaining > 0
                ? `Čekej (${cooldownRemaining}s)`
                : 'Spustit diagnostiku'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Summary Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Celkový stav systému
            </span>
            <div className="mt-1">
              {getStatusBadge(healthData?.status || 'UNKNOWN')}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Aktivní konektory
            </span>
            <span className="text-xl font-black text-slate-900">
              {connectorsList.length} / 4
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Auditních záznamů
            </span>
            <span className="text-xl font-black text-slate-900 font-mono">
              {healthData?.auditLogsCount ?? auditLogs.length}
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Poslední kontrola
            </span>
            <span className="text-xs font-bold text-slate-700 font-mono block truncate">
              {healthData?.lastCheckedAt ? new Date(healthData.lastCheckedAt).toLocaleTimeString('cs-CZ') : 'Zatím neprovedena'}
            </span>
          </div>
        </div>
      </div>

      {/* Individual Connector Health Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-900" />
            Přehled jednotlivých konektorů státní správy
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Izolované konektory s ochranou proti kaskádovému selhání
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connectorsList.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold uppercase tracking-wider">
                      {c.priority} • {c.id}
                    </span>
                    <h4 className="text-base font-black text-slate-900 mt-1">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {c.provider}
                    </p>
                  </div>
                  {getStatusBadge(c.status)}
                </div>

                <div className="space-y-2 mt-4 text-xs font-mono">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">HTTP Status:</span>
                    <span className={`font-bold ${c.lastHttpStatus === 200 ? 'text-emerald-700' : c.lastHttpStatus ? 'text-amber-700' : 'text-slate-500'}`}>
                      {c.lastHttpStatus ? `HTTP ${c.lastHttpStatus}` : 'Neověřeno'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Doba odezvy:</span>
                    <span className="font-bold text-slate-800">
                      {c.durationMs !== undefined ? `${c.durationMs} ms` : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Vráceno záznamů:</span>
                    <span className="font-bold text-slate-800">
                      {c.recordsCount !== undefined ? c.recordsCount : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Endpoint:</span>
                    <span className="font-bold text-slate-700 text-[10px] truncate max-w-[200px]" title={c.endpoint}>
                      {c.endpoint}
                    </span>
                  </div>
                </div>

                {c.errorMessage && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    <span className="font-bold block mb-0.5">Diagnostická poznámka / Chyba:</span>
                    {c.errorMessage}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Poslední dotaz:</span>
                <span className="font-bold text-slate-700">
                  {c.lastCheckedAt ? new Date(c.lastCheckedAt).toLocaleTimeString('cs-CZ') : 'Nikdy'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-900" />
              Auditní protokol dotazů na státní API
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Historie server-side požadavků, HTTP odezev, časů a výsledků (bez citlivých klíčů).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSourceFilter}
              onChange={(e) => setSelectedSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">Všechny zdroje ({auditLogs.length})</option>
              <option value="P1_JUSTICE">P1: MSp OpenData</option>
              <option value="P2_CSU_NKOD">P2: ČSÚ / NKOD</option>
              <option value="P3_PUBLIC_REGISTRY">P3: Registr OVM</option>
              <option value="P4_E_LEGISLATIVA">P4: e-Legislativa</option>
            </select>
          </div>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
            <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Žádné auditní záznamy pro vybraný filtr</p>
            <p className="text-[11px] text-slate-500 mt-1">Spusťte diagnostiku výše pro provedení testovacích dotazů.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <th className="py-3 px-3">Čas</th>
                  <th className="py-3 px-3">Zdroj</th>
                  <th className="py-3 px-3">Endpoint</th>
                  <th className="py-3 px-3">HTTP</th>
                  <th className="py-3 px-3">Odezva</th>
                  <th className="py-3 px-3">Záznamy</th>
                  <th className="py-3 px-3">Stav</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredAudits.slice(0, 30).map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {new Date(audit.timestamp).toLocaleTimeString('cs-CZ')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold">
                        {audit.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 truncate max-w-[220px]" title={audit.endpoint}>
                      {audit.endpoint}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`font-bold ${audit.httpStatus === 200 ? 'text-emerald-600' : audit.httpStatus === 403 || audit.httpStatus === 401 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {audit.httpStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {audit.durationMs} ms
                    </td>
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {audit.recordsCount}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {audit.success ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          OK
                        </span>
                      ) : (
                        <span className="text-rose-700 font-bold flex items-center gap-1" title={audit.errorMessage}>
                          <XCircle className="w-3 h-3 text-rose-500" />
                          CHYBA
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security & SSRF Policy Footer */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white mb-1">
              Bezpečnostní architektura a SSRF ochrana
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              Všechny požadavky na externí registry státní správy jsou vykonávány výhradně serverovým modulem <code>StateAdminApiClient</code>.
              Klientovi je zakázáno volat externí API přímo (SSRF obrana). Každé volání je validováno proti lokálním a privátním IP rozsahům,
              aplikuje rate limiting 30 volání/min a dodržuje striktní kvóty a fail-closed politiku – žádná data nejsou generována uměle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
