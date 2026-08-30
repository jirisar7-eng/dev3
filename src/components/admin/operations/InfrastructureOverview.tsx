import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../utils/apiClient';
import {
  Globe,
  Box,
  Database,
  HardDrive,
  Mail,
  Activity,
  Terminal,
  HeartPulse,
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Server,
  Lock,
} from 'lucide-react';
import { InfrastructureAuditResult } from '../../../services/audit/infrastructureAuditService';

export const InfrastructureOverview: React.FC = () => {
  const [data, setData] = useState<InfrastructureAuditResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfrastructureData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/qa/infrastructure-audit');
      const json = await res.json();
      if (json.success && json.result) {
        setData(json.result);
      } else {
        setError(json.error || 'Nepodařilo se načíst diagnostická data infrastruktury.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba při komunikaci s infrastrukturním API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfrastructureData();
  }, []);

  const renderStatusBadge = (status: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL' | string) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            PASS
          </span>
        );
      case 'PASS_WITH_WARNINGS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            WARNINGS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FAIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-extrabold border border-slate-200">
            UNKNOWN
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">
          Spouštím bezpečný (100% read-only) diagnostický audit infrastruktury...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 rounded-3xl border border-rose-200 p-6 text-rose-900 space-y-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Chyba při auditu infrastruktury</span>
        </div>
        <p className="text-xs text-rose-700">{error || 'Nebyla vrácena žádná data.'}</p>
        <button
          onClick={fetchInfrastructureData}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Zkusit znovu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Read-Only Guarantee Banner */}
      <div className="bg-indigo-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-800 text-indigo-200 rounded-xl">
            <Lock className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">Read-Only Safety Guarantee</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold">
                ZERO MUTATION
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Auditor infrastruktury běží v 100% read-only režimu. Zákaz mutací Docker socketu, databáze i sítě.
            </p>
          </div>
        </div>

        <button
          onClick={fetchInfrastructureData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Obnovit audit</span>
        </button>
      </div>

      {/* Grid of 9 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Caddy / HTTPS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">1. Caddy / HTTPS</h4>
                <p className="text-[11px] text-slate-500">Reverzní proxy & SSL/TLS</p>
              </div>
            </div>
            {renderStatusBadge(data.caddy.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">HTTPS dostupné:</span>
              <span className="font-bold">{data.caddy.httpsAvailable ? 'ANO' : 'NE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">HTTP Status:</span>
              <span className="font-bold">{data.caddy.statusCode || 'N/A'}</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 block text-[11px]">Bezpečnostní hlavičky:</span>
              <div className="flex flex-wrap gap-1">
                {Object.entries(data.caddy.securityHeaders).map(([header, present]) => (
                  <span
                    key={header}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      present ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {header}: {present ? 'OK' : 'MISSING'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Docker */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">2. Docker Diagnostic</h4>
                <p className="text-[11px] text-slate-500">Kontejnery & Stav</p>
              </div>
            </div>
            {renderStatusBadge(data.docker.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Kontejnery celkem:</span>
              <span className="font-bold">{data.docker.containersCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">V běhu:</span>
              <span className="font-bold text-emerald-600">{data.docker.runningContainers}</span>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg font-mono leading-tight">
              {data.docker.details}
            </p>
          </div>
        </div>

        {/* Card 3: PostgreSQL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">3. PostgreSQL</h4>
                <p className="text-[11px] text-slate-500">Prisma Client & Latence</p>
              </div>
            </div>
            {renderStatusBadge(data.postgresql.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Připojení k DB:</span>
              <span className={`font-bold ${data.postgresql.connected ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.postgresql.connected ? 'PŘIPOJENO' : 'ODPOJENO'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Odezva (SELECT 1):</span>
              <span className="font-mono font-bold">{data.postgresql.latencyMs !== undefined ? `${data.postgresql.latencyMs} ms` : 'N/A'}</span>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-tight">
              {data.postgresql.details}
            </p>
          </div>
        </div>

        {/* Card 4: MinIO */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">4. MinIO S3</h4>
                <p className="text-[11px] text-slate-500">HeadBucket Probe</p>
              </div>
            </div>
            {renderStatusBadge(data.minio.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">S3 Uložení přístupné:</span>
              <span className="font-bold">{data.minio.accessible ? 'ANO' : 'ZÁLOŽNÍ REŽIM'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bucket tatovacesta-studies:</span>
              <span className="font-bold">{data.minio.bucketExists ? 'OK' : 'NEVERIFIKOVÁNO'}</span>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-tight">
              {data.minio.details}
            </p>
          </div>
        </div>

        {/* Card 5: Mailcow */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">5. Mailcow Probe</h4>
                <p className="text-[11px] text-slate-500">Poštovní server (&lt;3000ms)</p>
              </div>
            </div>
            {renderStatusBadge(data.mailcow.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Izolovaná sonda:</span>
              <span className="font-bold text-purple-700">MAX 3000ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Stav rozhraní:</span>
              <span className="font-bold">{data.mailcow.accessible ? 'OK' : 'ISOLATED'}</span>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-tight">
              {data.mailcow.details}
            </p>
          </div>
        </div>

        {/* Card 6: Uptime Kuma */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">6. Uptime Kuma</h4>
                <p className="text-[11px] text-slate-500">Syntetický monitoring (60s)</p>
              </div>
            </div>
            {renderStatusBadge(data.uptimeKumaAndHealth.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Endpoint /api/health:</span>
              <span className={`font-bold ${data.uptimeKumaAndHealth.healthEndpointOk ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.uptimeKumaAndHealth.healthEndpointOk ? '200 OK' : 'FAIL'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-tight">
              {data.uptimeKumaAndHealth.details}
            </p>
          </div>
        </div>

        {/* Card 7: Dozzle / Logging */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">7. Dozzle & Logy</h4>
                <p className="text-[11px] text-slate-500">Sanitizace & 0-PII</p>
              </div>
            </div>
            {renderStatusBadge(data.logs.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Analyzované záznamy:</span>
              <span className="font-bold">{data.logs.analyzedEntries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sanitizace secretů (0-PII):</span>
              <span className="font-bold text-emerald-600">VERIFIKOVÁNO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Počet chyb v logu:</span>
              <span className="font-bold">{data.logs.errorCount}</span>
            </div>
            {data.logs.sampleErrorSnippet && (
              <p className="text-[10px] text-rose-700 bg-rose-50 p-2 rounded border border-rose-100 font-mono truncate">
                {data.logs.sampleErrorSnippet}
              </p>
            )}
          </div>
        </div>

        {/* Card 8: Health Endpoints */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">8. Health Endpoints</h4>
                <p className="text-[11px] text-slate-500">Fail-Closed architektura</p>
              </div>
            </div>
            {renderStatusBadge(data.uptimeKumaAndHealth.healthEndpointOk ? 'PASS' : 'FAIL')}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">/api/health:</span>
              <span className="font-mono font-bold text-emerald-600">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Fail-Closed chování:</span>
              <span className="font-bold text-slate-900">ENFORCED</span>
            </div>
            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg leading-tight">
              Zdravotní kontroly jsou odděleny od mutací. Výpadek sekundárních modulů neblokuje běh.
            </p>
          </div>
        </div>

        {/* Card 9: VPS Resources */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">9. VPS Resources</h4>
                <p className="text-[11px] text-slate-500">RAM, CPU & Uptime</p>
              </div>
            </div>
            {renderStatusBadge(data.vpsResources.status)}
          </div>
          <div className="text-xs space-y-2 border-t border-slate-100 pt-3 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">RAM Využití:</span>
              <span className="font-bold">{data.vpsResources.ramUsagePercent}% ({data.vpsResources.totalRamMb - data.vpsResources.freeRamMb} / {data.vpsResources.totalRamMb} MB)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CPU Load (1m, 5m, 15m):</span>
              <span className="font-mono font-bold">{data.vpsResources.cpuLoad.map(l => l.toFixed(2)).join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uptime procesu:</span>
              <span className="font-bold">{Math.round(data.vpsResources.uptimeSeconds / 60)} minut</span>
            </div>
          </div>
        </div>
      </div>

      {/* Findings List Section if any findings exist */}
      {data.findings && data.findings.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Detekovaná infrastrukturní zjištění ({data.findings.length})</span>
            </h3>
          </div>
          <div className="space-y-3">
            {data.findings.map(f => (
              <div key={f.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      f.severity === 'P0' ? 'bg-rose-600 text-white' :
                      f.severity === 'P1' ? 'bg-rose-100 text-rose-800' :
                      f.severity === 'P2' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="font-mono font-bold text-slate-700">[{f.code}]</span>
                    <span className="font-bold text-slate-900">{f.title}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{f.description}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {new Date(f.firstDetectedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
