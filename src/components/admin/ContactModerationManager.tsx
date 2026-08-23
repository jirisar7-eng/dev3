import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Trash2, Phone, Mail, MapPin, AlertCircle, Building2 } from 'lucide-react';
import { Pracovnik } from '../../types';

export const ContactModerationManager: React.FC = () => {
  const [pracovnici, setPracovnici] = useState<Pracovnik[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'PENDING' | 'ALL'>('PENDING');
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const url = viewMode === 'PENDING' ? '/api/pracovnici/pending' : '/api/pracovnici';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPracovnici(data);
      } else {
        setMessage({ text: 'Chyba při načítání pracovníků.', type: 'error' });
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
      setMessage({ text: 'Systémová chyba při načítání.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [viewMode]);

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/pracovnici/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        if (viewMode === 'PENDING') {
          setPracovnici(pracovnici.filter(p => p.id !== id));
        } else {
          setPracovnici(pracovnici.map(p => p.id === id ? { ...p, status } : p));
        }
        setMessage({ text: status === 'APPROVED' ? 'Kontakt byl úspěšně schválen a zveřejněn.' : 'Kontakt byl zamítnut.', type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error updating worker status:', err);
    }
  };

  const handleDelete = async (id: string, jmeno: string) => {
    if (isDeleting) return;
    
    if (!confirm(`Opravdu chcete odstranit pracovníka ${jmeno}? Tato akce odstraní pracovníka z registru.`)) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pracovnici/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setPracovnici(pracovnici.filter(p => p.id !== id));
        setMessage({ text: 'Pracovník byl smazán.', type: 'success' });
        setTimeout(() => setMessage(null), 4000);
      } else {
        if (res.status === 401 || res.status === 403) {
          setMessage({ text: 'Nemáte oprávnění ke smazání pracovníka.', type: 'error' });
        } else if (res.status === 404) {
          setMessage({ text: 'Pracovník nebyl nalezen.', type: 'error' });
        } else if (res.status === 409) {
          setMessage({ text: 'Pracovníka nelze smazat kvůli existujícím vazbám.', type: 'error' });
        } else {
          setMessage({ text: 'Při mazání pracovníka došlo k chybě.', type: 'error' });
        }
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error deleting worker:', err);
      setMessage({ text: 'Při komunikaci se serverem došlo k chybě.', type: 'error' });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Správa kontaktů (Pracovníci)</h2>
          <p className="text-xs text-slate-500 mt-1">
            Zde můžete spravovat konkrétní pracovníky, schvalovat návrhy nebo odstraňovat existující kontakty.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('PENDING')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Ke schválení
            </button>
            <button
              onClick={() => setViewMode('ALL')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                viewMode === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Všichni
            </button>
          </div>
          <button
            onClick={fetchWorkers}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Obnovit
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-bold ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500">Načítání kontaktů...</div>
      ) : pracovnici.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {viewMode === 'PENDING' ? 'Žádné kontakty ke schválení' : 'Žádní pracovníci nenalezeni'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {viewMode === 'PENDING' 
              ? 'Všechny navržené kontakty byly zkontrolovány nebo žádné nové návrhy zatím nečekají.'
              : 'V databázi zatím nejsou evidováni žádní pracovníci.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pracovnici.map((prac) => (
            <div key={prac.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {prac.status === 'PENDING' ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                      Čeká na schválení
                    </span>
                  ) : prac.status === 'APPROVED' ? (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                      Schváleno
                    </span>
                  ) : (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md">
                      Zamítnuto
                    </span>
                  )}
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
                {prac.status === 'PENDING' && (
                  <>
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
                  </>
                )}
                
                <button
                  onClick={() => handleDelete(prac.id, prac.jmeno)}
                  title="Smazat pracovníka z registru"
                  disabled={isDeleting}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
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
