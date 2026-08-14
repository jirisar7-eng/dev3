import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Power, Server, HardDrive, Cpu, Loader2, Play } from 'lucide-react';

export const VpsManagement: React.FC = () => {
  const [logs, setLogs] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/vps/logs', {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.logs);
      } else {
        setError(data.error || 'Nepodařilo se načíst logy.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLogs(false);
      scrollToBottom();
    }
  };

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/admin/vps/status', {
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Nepodařilo se načíst stav.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingStatus(false);
    }
  };

  const handleUpdate = async () => {
    if (!confirm('Opravdu chcete spustit aktualizaci na pozadí? Aplikace se může restartovat.')) return;
    
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/vps/update', {
        method: 'POST',
        headers: { 'Authorization': `Bearer jwt_token_user_${Date.now()}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
      } else {
        alert('Chyba: ' + (data.error || 'Neznámá chyba'));
      }
    } catch (err: any) {
      alert('Chyba: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    fetchLogs();
    fetchStatus();
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
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Správa VPS & Systémové Logy</h2>
          <p className="text-sm text-slate-500 mt-1">Nástroje pro SUPER_ADMIN správce</p>
        </div>
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md transition-colors disabled:opacity-50"
        >
          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Spustit aktualizaci (update-dev3)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Stav Kontejnerů */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-slate-900">Stav Docker kontejnerů</h3>
          {loadingStatus && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
        </div>
        <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
            {status || 'Načítám...'}
          </pre>
        </div>
      </div>

      {/* Logy aplikace */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-700" />
            <h3 className="text-lg font-bold text-slate-900">Konzole logů (Tail 150)</h3>
            {loadingLogs && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-2" />}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              Auto-refresh 5s
            </label>
            <button 
              onClick={() => { fetchLogs(); fetchStatus(); }}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Obnovit logy
            </button>
          </div>
        </div>
        
        <div className="flex-1 bg-slate-950 p-4 overflow-y-auto font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap break-all">
            {logs || 'Žádné logy k zobrazení.'}
          </pre>
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
