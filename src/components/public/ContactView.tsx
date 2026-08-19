import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock, HelpCircle } from 'lucide-react';

interface ContactViewProps {
  onNavigate: (path: string) => void;
  formOnly?: boolean;
}

export const ContactView: React.FC<ContactViewProps> = ({ onNavigate, formOnly }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Opatrovnická poradna',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: 'Opatrovnická poradna', message: '' });
    }, 6000);
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-500">
      {!formOnly && (
        <>
      <SeoHead
        title="Kontakt • Táta má právo"
        description="Spojte se s týmem portálu Táta má právo. Poskytujeme konzultace, právní orientaci a podporu otcům v opatrovnických řízeních."
        canonicalPath="/kontakt"
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider">
          <Mail className="w-4 h-4" />
          <span>Spojte se s námi</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Potřebujete poradit nebo pomoci?
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          Jsme tu pro otce, kteří procházejí náročným opatrovnickým sporem, rozvodem nebo jednáním s OSPOD. Neváhejte se na nás obrátit.
        </p>
      </div>

        </>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">E-mailová podpora</span>
                <strong className="text-slate-900 text-sm">info@tatovacesta.cz</strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Infolinka pro otce</span>
                <strong className="text-slate-900 text-sm">+420 800 123 456</strong>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Pracovní doba</span>
                <strong className="text-slate-900 text-sm">Po – Pá: 9:00 – 17:00</strong>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Rychlá orientace</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Než napíšete, podívejte se do naší <button onClick={() => onNavigate('/faq')} className="underline font-bold hover:text-blue-950">sekce FAQ</button> nebo vyzkoušejte <button onClick={() => onNavigate('/ai-assistant')} className="underline font-bold hover:text-blue-950">AI Asistenta</button> pro okamžitou právní orientaci 24/7.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          {submitted ? (
            <div className="py-16 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Zpráva byla úspěšně odeslána!</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Děkujeme za kontakt. Váš požadavek evidujeme a náš poradenský tým se vám ozve na zadaný e-mail co nejdříve.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Odeslat další zprávu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Kontaktní formulář</h3>
                <p className="text-xs text-slate-500">Vyplňte formulář a my se vám ozveme zpět do 24 hodin.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vaše jméno a příjmení *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="např. Jan Novák"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mailová adresa *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="např. jan.novak@email.cz"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefonní číslo (nepovinné)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+420 777 888 999"
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Téma / Předmět</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Opatrovnická poradna">Opatrovnická poradna</option>
                    <option value="Jednání s OSPOD">Jednání s OSPOD</option>
                    <option value="Střídavá péče / Výživné">Střídavá péče / Výživné</option>
                    <option value="Technická podpora portálu">Technická podpora portálu</option>
                    <option value="Jiné / Spolupráce">Jiné / Spolupráce</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Text zprávy / Popis vaší situace *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Stručně popište váš případ, aktuální fázi řízení u soudu nebo otázku..."
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
              >
                <Send className="w-4 h-4" />
                <span>Odeslat zprávu poradně</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
