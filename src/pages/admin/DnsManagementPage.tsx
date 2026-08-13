import React, { useState, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, AlertTriangle } from 'lucide-react';

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  value: string;
  ttl: number;
}

export const DnsManagementPage: React.FC = () => {
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState({ name: '', type: 'A', value: '', ttl: 60 });

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/dns');
      if (!res.ok) throw new Error('Failed to load DNS records');
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadRecords(); }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      });
      if (!res.ok) throw new Error('Failed to add record');
      await loadRecords();
      setNewRecord({ name: '', type: 'A', value: '', ttl: 60 });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Opravdu chcete smazat tento DNS záznam?')) return;
    try {
      const res = await fetch(`/api/admin/dns/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete record');
      await loadRecords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Správa DNS záznamů</h1>
      {error && <div className="bg-red-100 text-red-800 p-4 rounded">{error}</div>}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleAddRecord} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <input type="text" placeholder="Název (subdoména)" className="border p-2 rounded" value={newRecord.name} onChange={e => setNewRecord({...newRecord, name: e.target.value})} />
          <select className="border p-2 rounded" value={newRecord.type} onChange={e => setNewRecord({...newRecord, type: e.target.value})}>
            {['A', 'CNAME', 'TXT', 'MX'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="text" placeholder="Hodnota / IP" className="border p-2 rounded" value={newRecord.value} onChange={e => setNewRecord({...newRecord, value: e.target.value})} />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2"><Plus size={16}/> Přidat</button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-3">Název</th>
              <th className="p-3">Typ</th>
              <th className="p-3">Hodnota</th>
              <th className="p-3 text-right">Akce</th>
            </tr>
          </thead>
          <tbody>
            {records.map(rec => (
              <tr key={rec.id} className="border-b">
                <td className="p-3">{rec.name}</td>
                <td className="p-3">{rec.type}</td>
                <td className="p-3">{rec.value}</td>
                <td className="p-3 text-right">
                  <button onClick={() => handleDelete(rec.id)} className="text-red-600"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
