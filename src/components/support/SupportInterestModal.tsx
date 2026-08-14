import React, { useState } from 'react';
import { X, Heart, Building2, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface SupportInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultInterest?: 'SPONSOR' | 'FOUNDER' | 'BOARD';
}

export const SupportInterestModal: React.FC<SupportInterestModalProps> = ({ 
  isOpen, 
  onClose,
  defaultInterest = 'SPONSOR'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interestType: defaultInterest,
    amountOrNote: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/system/support-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Něco se pokazilo. Zkuste to prosím znovu.');
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          interestType: defaultInterest,
          amountOrNote: ''
        });
      }, 3000);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-900 p-6 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-white/5 blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-400 fill-current" />
              Podpořte projekt
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Pomozte nám rozvíjet bezplatné nástroje</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Děkujeme za Váš zájem!</h3>
                <p className="text-slate-500 mt-2">Váš vzkaz jsme v pořádku přijali.<br/>Brzy se Vám ozveme s dalšími informacemi.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Jméno a příjmení / Firma <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Jan Novák / Můj Podnik s.r.o."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    E-mail <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="jan@email.cz"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    placeholder="+420 123 456 789"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Typ podpory
                </label>
                <select
                  value={formData.interestType}
                  onChange={(e) => setFormData({...formData, interestType: e.target.value as any})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 font-medium"
                >
                  <option value="SPONSOR">💙 Sponzor / Dárce</option>
                  <option value="FOUNDER">🏛️ Zakládající člen spolku</option>
                  <option value="BOARD">👔 Člen rady spolku</option>
                  <option value="OTHER">Ostatní podpora</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Představa o podpoře / Poznámka
                </label>
                <textarea
                  rows={4}
                  value={formData.amountOrNote}
                  onChange={(e) => setFormData({...formData, amountOrNote: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Jakou formou byste rádi pomohli? (např. Finanční dar 5000 Kč měsíčně, Odborné konzultace, atd.)"
                ></textarea>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.name || !formData.email}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Odeslat zprávu
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
