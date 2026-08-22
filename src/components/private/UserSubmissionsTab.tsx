import React, { useState, useEffect } from 'react';
import { Subjekt, EntityType } from '../../types';
import { Clock, CheckCircle2, XCircle, MapPin, Briefcase } from 'lucide-react';

const ENTITY_LABELS: Record<EntityType, string> = {
  SOUD: 'Soud',
  OSPOD: 'OSPOD',
  ZNALEC: 'Znalec',
  ADVOKAT: 'Advokát',
  PORADNA_CHARITA: 'Poradna / Mediace',
};

export const UserSubmissionsTab: React.FC = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('tatovacesta_auth_token') || localStorage.getItem('token');
      const res = await fetch('/api/subjekty/my/submissions', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Moje přidané subjekty</h2>
        <p className="text-sm text-slate-600 mb-6">
          Zde vidíte všechny návrhy subjektů, které jste doporučili do našeho registru, a jejich aktuální stav schvalování.
        </p>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Načítám návrhy...</div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Zatím jste nenavrhli žádný subjekt.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{ENTITY_LABELS[sub.type as EntityType] || sub.type}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{new Date(sub.createdAt).toLocaleDateString('cs-CZ')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{sub.name}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{sub.address ? `${sub.address}, ${sub.city}` : sub.city}</span>
                  </div>
                  
                  {sub.status === 'REJECTED' && sub.rejectionReason && (
                    <div className="mt-3 text-xs bg-red-50 text-red-800 p-2.5 rounded-xl border border-red-100 flex flex-col gap-1">
                      <span className="font-bold">Důvod zamítnutí:</span>
                      <span>{sub.rejectionReason}</span>
                    </div>
                  )}
                </div>
                
                <div className="shrink-0">
                  {sub.status === 'PENDING_VERIFICATION' && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl font-bold text-sm border border-amber-200">
                      <Clock className="w-4 h-4" />
                      <span>Čeká na ověření</span>
                    </div>
                  )}
                  {sub.status === 'VERIFIED' && (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-bold text-sm border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ověřeno</span>
                    </div>
                  )}
                  {sub.status === 'REJECTED' && (
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-xl font-bold text-sm border border-red-200">
                      <XCircle className="w-4 h-4" />
                      <span>Zamítnuto</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
