import React, { useState } from 'react';
import { User } from '../../types';
import { LifeBuoy, Plus, MessageCircle, Clock, CheckCircle2, AlertCircle, Paperclip } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  lastUpdate: string;
}

const MOCK_TICKETS: Ticket[] = [
  { id: 'TKT-1024', subject: 'Problém s nahráním PDF do spisu', category: 'Technická podpora', status: 'resolved', priority: 'normal', createdAt: '2026-07-15T10:30:00Z', lastUpdate: '2026-07-16T09:15:00Z' },
  { id: 'TKT-1089', subject: 'Dotaz na využití AI asistenta', category: 'Nápověda k funkcím', status: 'in_progress', priority: 'low', createdAt: '2026-08-18T14:20:00Z', lastUpdate: '2026-08-19T11:00:00Z' }
];

export const UserSupportTicketingView: React.FC<{ user: User }> = ({ user }) => {
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
            Podpora a tikety
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Zde můžete sledovat své dotazy na technickou podporu a otevírat nové tikety.
          </p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nový požadavek
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">ID tiketu</th>
                <th className="px-6 py-4 font-bold">Předmět</th>
                <th className="px-6 py-4 font-bold">Stav</th>
                <th className="px-6 py-4 font-bold">Poslední aktualizace</th>
                <th className="px-6 py-4 font-bold text-right">Akce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_TICKETS.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">{ticket.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{ticket.subject}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      ticket.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {ticket.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                      {ticket.status === 'in_progress' && <Clock className="w-3 h-3" />}
                      {ticket.status === 'open' && <AlertCircle className="w-3 h-3" />}
                      {ticket.status === 'resolved' ? 'Vyřešeno' : ticket.status === 'in_progress' ? 'V řešení' : 'Otevřeno'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {new Date(ticket.lastUpdate).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-xs transition-colors">Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-blue-600" />
                Nový požadavek na podporu
              </h3>
              <button onClick={() => setShowNewTicketModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">
                ✕ Zavřít
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Předmět</label>
                <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Krátký popis problému" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategorie</label>
                <select className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm">
                  <option>Technická podpora</option>
                  <option>Nápověda k funkcím</option>
                  <option>Fakturace a předplatné</option>
                  <option>Jiné</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Popis problému</label>
                <textarea rows={4} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm" placeholder="Popište svůj problém detailně..."></textarea>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewTicketModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Zrušit</button>
                <button type="button" onClick={() => setShowNewTicketModal(false)} className="px-5 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800">Odeslat požadavek</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
