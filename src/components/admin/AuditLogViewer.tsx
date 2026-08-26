import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, RefreshCw, Clock } from 'lucide-react';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterModule, setFilterModule] = useState('');

  const fetchLogs = () => {
    const url = filterModule ? `/api/audit?module=${filterModule}` : '/api/audit';
    apiFetch(url)
      .then((res) => res.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setLogs([]);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [filterModule]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Audit Log (Systémový protokol změn)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Záznam všech administrátorských operací, úprav textů, změn rolí a modifikací modulů.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Obnovit protokol
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs shadow-2xs">
        <label className="font-semibold text-slate-700">Filtrovat modul:</label>
        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="p-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600"
        >
          <option value="">Všechny moduly</option>
          <option value="CORE">CORE</option>
          <option value="AUTH">AUTH</option>
          <option value="RBAC">RBAC</option>
          <option value="TEXT_MANAGER">TEXT_MANAGER</option>
          <option value="THEME_MANAGER">THEME_MANAGER</option>
          <option value="MODULE_MANAGER">MODULE_MANAGER</option>
          <option value="CMS">CMS</option>
          <option value="COMPLIANCE">COMPLIANCE</option>
          <option value="SETTINGS">SETTINGS</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Čas razítka</th>
              <th className="p-3.5">Uživatel</th>
              <th className="p-3.5">Modul</th>
              <th className="p-3.5">Akce</th>
              <th className="p-3.5">Detail změny</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80">
                <td className="p-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('cs-CZ')}
                </td>

                <td className="p-3.5 font-bold text-slate-900">
                  {log.userEmail || 'System Core'}
                </td>

                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold">
                    {log.module}
                  </span>
                </td>

                <td className="p-3.5 font-mono text-blue-900 font-semibold">{log.action}</td>

                <td className="p-3.5 text-slate-700 leading-relaxed max-w-md">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
