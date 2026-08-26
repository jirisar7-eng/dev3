import { apiFetch } from '../../utils/apiClient';
import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  RefreshCw,
  Server,
  Loader2,
  Play,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Layers,
  Globe,
  Copy,
  Check,
} from 'lucide-react';

interface ContainerInfo {
  Id?: string;
  id?: string;
  Names?: string[];
  name?: string;
  Image?: string;
  image?: string;
  State?: string;
  state?: string;
  Status?: string;
  status?: string;
}

export const VpsManagement: React.FC = () => {
  const [logs, setLogs] = useState<string>('');
  const [statusText, setStatusText] = useState<string>('');
  const [containers, setContainers] = useState<ContainerInfo[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<string>('');
  const [podmanApiUrl, setPodmanApiUrl] = useState<string>('');
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);

  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [tailLines, setTailLines] = useState<number>(150);
  const [logSearch, setLogSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('tatovacesta_auth_token') || localStorage.getItem('token') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await apiFetch('/api/admin/vps/status', {
        headers: {
          ...getAuthHeader(),
          'Accept': 'application/json',
        },
      });
      const data = await res.json();
      if (data.podmanApiUrl) {
        setPodmanApiUrl(data.podmanApiUrl);
      }
      setIsApiConnected(!!data.success);

      if (data.status) {
        setStatusText(data.status);
      }
      if (Array.isArray(data.containers)) {
        setContainers(data.containers);
        if (!selectedContainer && data.containers.length > 0) {
          const first = data.containers[0];
          setSelectedContainer(first.Id || first.id || '');
        }
      }

      if (!data.success && data.error) {
        setError(data.error);
      } else {
        setError(null);
      }
    } catch (err: any) {
      setError(`Chyba sítě při načítání stavu VPS: ${err.message}`);
      setIsApiConnected(false);
    } finally {
      setLoadingStatus(false);
    }
  };

  const fetchLogs = async (containerId?: string, tail?: number) => {
    setLoadingLogs(true);
    try {
      const targetId = containerId !== undefined ? containerId : selectedContainer;
      const targetTail = tail !== undefined ? tail : tailLines;

      let url = `/api/admin/vps/logs?tail=${targetTail}`;
      if (targetId) {
        url += `&container=${encodeURIComponent(targetId)}`;
      }

      const res = await apiFetch(url, {
        headers: {
          ...getAuthHeader(),
          'Accept': 'application/json',
        },
      });
      const data = await res.json();

      if (data.podmanApiUrl) {
        setPodmanApiUrl(data.podmanApiUrl);
      }

      if (data.logs) {
        setLogs(data.logs);
      } else if (!data.success) {
        setLogs(data.error || 'Nepodařilo se získa logy.');
      }

      if (!data.success && data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(`Chyba při načítání logů: ${err.message}`);
    } finally {
      setLoadingLogs(false);
      scrollToBottom();
    }
  };

  const handleUpdate = async () => {
    if (!confirm('Opravdu chcete odeslat požadavek na restart/aktualizaci kontejneru přes Podman API?')) return;

    setUpdating(true);
    try {
      const res = await apiFetch('/api/admin/vps/update', {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Příkaz byl úspěšně odeslán.');
        fetchStatus();
        fetchLogs();
      } else {
        alert('Chyba: ' + (data.error || 'Neznámá chyba'));
      }
    } catch (err: any) {
      alert('Chyba komunikace s API: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyLogs = () => {
    if (!logs) return;
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    if (!logs) return;
    const blob = new Blob([logs], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vps_podman_logs_${new Date().toISOString().slice(0, 10)}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchLogs();
        fetchStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedContainer, tailLines]);

  const filteredLogs = React.useMemo(() => {
    if (!logSearch.trim()) return logs;
    return logs
      .split('\n')
      .filter((line) => line.toLowerCase().includes(logSearch.toLowerCase()))
      .join('\n');
  }, [logs, logSearch]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Správa VPS & Podman Logy</h2>
            {isApiConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Podman API Připojeno
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Podman API Nedostupné
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            Endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{podmanApiUrl || 'https://10.211.2.130:9090'}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchStatus();
              fetchLogs();
            }}
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Obnovit vše
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Restartovat kontejner (Podman API)
          </button>
        </div>
      </div>

      {/* Error Banner if API offline */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Upozornění ke komunikaci s Podman / Docker API</span>
          </div>
          <p className="leading-relaxed">{error}</p>
          <div className="bg-amber-100/70 p-2.5 rounded-xl text-[11px] font-mono text-amber-950">
            Tip: Připojení lze nakonfigurovat na serveru pomocí proměnných <code>DOCKER_HOST</code> nebo <code>PODMAN_API_URL</code> (např. <code>https://10.211.2.130:9090</code> nebo <code>http://10.211.2.130:8080</code>). SSL certifikáty jsou ošetřeny přes rejection bypass.
          </div>
        </div>
      )}

      {/* Stav Kontejnerů */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Stav Podman / Docker kontejnerů</h3>
            {loadingStatus && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
          </div>

          {containers.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Vybraný kontejner pro logy:</span>
              <select
                value={selectedContainer}
                onChange={(e) => {
                  setSelectedContainer(e.target.value);
                  fetchLogs(e.target.value, tailLines);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {containers.map((c, i) => {
                  const id = (c.Id || c.id || '').substring(0, 12);
                  const name = Array.isArray(c.Names) ? c.Names[0] : c.Names || c.name || id || `Kontejner ${i + 1}`;
                  return (
                    <option key={id || i} value={id}>
                      {name} ({id}) - {c.Status || c.status || c.State || 'Aktivní'}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        {/* CLI Table Output */}
        <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto shadow-inner">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap leading-relaxed">
            {statusText || 'Načítám stav kontejnerů z Podman API...'}
          </pre>
        </div>
      </div>

      {/* Logy aplikace */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[560px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">Konzole systémových logů</h3>
            {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Filter */}
            <div className="relative">
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrovat logy..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="pl-8 pr-3 py-1 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48"
              />
            </div>

            {/* Tail selector */}
            <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
              <span>Řádků:</span>
              <select
                value={tailLines}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTailLines(val);
                  fetchLogs(selectedContainer, val);
                }}
                className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800"
              >
                <option value={50}>50</option>
                <option value={150}>150</option>
                <option value={300}>300</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>

            {/* Auto refresh checkbox */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer"
              />
              Auto-refresh (5s)
            </label>

            {/* Action buttons */}
            <button
              type="button"
              onClick={handleCopyLogs}
              title="Kopírovat do schránky"
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDownloadLogs}
              title="Stáhnout log jako .log soubor"
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => fetchLogs()}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Obnovit
            </button>
          </div>
        </div>

        {/* Log Viewer Area */}
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
          <pre className="whitespace-pre-wrap break-all">
            {filteredLogs || 'Žádné logy k zobrazení.'}
          </pre>
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};

