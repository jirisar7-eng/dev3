import React, { useState, useEffect } from 'react';
import { LifeBuoy, Plus, MessageCircle, AlertCircle, Clock, CheckCircle2, ChevronRight, X, Tag, Calendar } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TicketMessage {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export const UserSupportTicketingView: React.FC<{ user: User }> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('technical');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/portal/tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (response.ok) {
        setTickets(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ subject, category, description, priority })
      });
      
      if (response.ok) {
        setShowNewTicketModal(false);
        setSubject('');
        setDescription('');
        fetchTickets();
      }
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const loadTicketDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/portal/tickets/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (response.ok) {
        setSelectedTicket(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch ticket details:', error);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyContent) return;

    try {
      const response = await fetch(`/api/portal/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ content: replyContent, isInternal })
      });
      
      if (response.ok) {
        setReplyContent('');
        loadTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">Otevřený</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">Řeší se</span>;
      case 'resolved': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded font-bold">Vyřešený</span>;
      default: return <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded font-bold">{status}</span>;
    }
  };

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

  if (selectedTicket) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <button onClick={() => setSelectedTicket(null)} className="text-sm text-blue-600 font-bold hover:underline flex items-center">
          &larr; Zpět na seznam tiketů
        </button>
        
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedTicket.subject}</h2>
              <div className="flex gap-3 items-center">
                {getStatusBadge(selectedTicket.status)}
                <span className="text-xs text-slate-500 font-medium">Kategorie: {selectedTicket.category}</span>
                <span className="text-xs text-slate-500 font-medium">Vytvořeno: {new Date(selectedTicket.createdAt).toLocaleString('cs-CZ')}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800 mb-2">Původní zpráva:</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{selectedTicket.description}</p>
            </div>
            
            {selectedTicket.messages?.map(msg => (
              <div key={msg.id} className={`p-4 rounded-2xl border ${msg.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'} ${msg.user.id === user.id ? 'ml-8' : 'mr-8'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700">{msg.user.name} {msg.isInternal ? '(Interní poznámka)' : ''}</span>
                  <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString('cs-CZ')}</span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleReply} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Vaše odpověď</label>
              <textarea 
                value={replyContent} 
                onChange={e => setReplyContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-sm" 
                rows={4} 
                required
              />
            </div>
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                Interní poznámka (neviditelná pro uživatele)
              </label>
            )}
            <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors">
              Odeslat odpověď
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-blue-600" />
            Podpora a tikety {isAdmin && '(Admin pohled)'}
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
        {loading ? (
          <div className="p-8 text-center text-sm font-bold text-slate-500">Načítám tikety...</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Zatím nemáte žádné otevřené tikety.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => loadTicketDetails(ticket.id)}
                className="p-5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    ticket.status === 'open' ? 'bg-amber-100 text-amber-600' :
                    ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {ticket.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> :
                     ticket.status === 'open' ? <AlertCircle className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {ticket.subject}
                    </h4>
                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                      {getStatusBadge(ticket.status)}
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {ticket.category}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ticket.updatedAt).toLocaleDateString('cs-CZ')}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Nový požadavek na podporu</h3>
              <button onClick={() => setShowNewTicketModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Předmět</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Kategorie</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm"
                  >
                    <option value="technical">Technický problém</option>
                    <option value="billing">Platby a fakturace</option>
                    <option value="account">Nastavení účtu</option>
                    <option value="other">Jiné</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Priorita</label>
                  <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-sm"
                  >
                    <option value="low">Nízká</option>
                    <option value="normal">Normální</option>
                    <option value="high">Vysoká (Kritické)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Popis problému</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm" 
                  rows={5} 
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">Prosím, popište problém co nejpodrobněji. Nesdílejte zde citlivé údaje z právních případů.</p>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl text-sm transition-colors"
                >
                  Zrušit
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
                >
                  Odeslat požadavek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
