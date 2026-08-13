import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Trash2, Phone, Mail, MapPin, AlertCircle, Building2 } from 'lucide-react';
import { Pracovnik } from '../../types';

export const ContactModerationManager: React.FC = () => {
  const [pendingPracovnici, setPendingPracovnici] = useState<Pracovnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pracovnici/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingPracovnici(data);
      }
    } catch (err) {
      console.error('Error fetching pending workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/pracovnici/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPendingPracovnici(pendingPracovnici.filter(p => p.id !== id));
        setMessage(status === 'APPROVED' ? 'Kontakt byl úspěšně schválen a zveřejněn.' : 'Kontakt byl zamítnut a odstraněn.');
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error updating worker status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete tohoto pracovníka trvale smazat?')) return;
    try {
      const res = await fetch(`/api/pracovnici/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPendingPracovnici(pendingPracovnici.filter(p => p.id !== id));
        setMessage('Pracovník byl smazán.');
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error deleting worker:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Schvalování kontaktů (Pracovníci úřadů)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Zde můžete schvalovat nebo zamítat návrhy konkrétních pracovníků a kontaktních osob od uživatelů.
          </p>
        </div>
        <button
          onClick={fetchPending}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Obnovit seznam
        </button>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-4 rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Načítání čekajících kontaktů...</div>
      ) : pendingPracovnici.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Žádné kontakty ke schválení</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Všechny navržené kontakty byly zkontrolovány nebo žádné nové návrhy zatím nečekají.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingPracovnici.map((prac) => (
            <div key={prac.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    Čeká na schválení
                  </span>
                  {prac.subjektName && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
                      <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{prac.subjektName}</span>
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900">{prac.jmeno}</h4>
                  {prac.pozice && <p className="text-xs font-bold text-indigo-600">{prac.pozice}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  {prac.telefon && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prac.telefon}</span>
                    </div>
                  )}
                  {prac.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prac.email}</span>
                    </div>
                  )}
                  {prac.kancelar && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{prac.kancelar}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => handleStatusUpdate(prac.id, 'APPROVED')}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Schválit</span>
                </button>
                <button
                  onClick={() => handleStatusUpdate(prac.id, 'REJECTED')}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer border border-rose-200"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Zamítnout</span>
                </button>
                <button
                  onClick={() => handleDelete(prac.id)}
                  title="Trvale smazat"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
