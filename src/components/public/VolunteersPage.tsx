import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import { AlertTriangle, Key, Users, BookOpen, Code, BrainCircuit, HeartHandshake, CheckCircle2 } from 'lucide-react';

const positions = [
  {
    id: 'legal',
    title: 'Právní rešeršista',
    description: 'Dobrovolná kontrola nových nálezů Ústavního a Nejvyššího soudu ČR, příprava stručných právních rozborů a aktualizace databáze e-Sbírky pro táty.',
    tags: ['#Judikatura', '#Ústavní soud', '#e-Sbírka', '#Analýza'],
    icon: BookOpen
  },
  {
    id: 'moderator',
    title: 'Komunitní moderátor',
    description: 'Dobrovolný dohled nad komunitním fórem, lidská podpora otců v tísni, prevence konfliktů a dohled nad dodržováním etických pravidel komunity.',
    tags: ['#Komunita', '#Fórum', '#Moderování', '#Deeskalace'],
    icon: Users
  },
  {
    id: 'developer',
    title: 'Vývojář / Frontend & AI Integrátor',
    description: 'Dobrovolná pomoc s vývojem webu v Reactu, Tailwind CSS, TypeScriptu, příprava promptů pro Google Gemini AI Studio a tvorba interaktivních nástrojů.',
    tags: ['#React', '#TypeScript', '#Tailwind', '#Gemini AI'],
    icon: Code
  },
  {
    id: 'psychologist',
    title: 'Dětský psycholog / Consultant',
    description: 'Dobrovolná příprava odborných edukačních článků zaměřených na dětský attachment, vývojovou psychologii, loajalitní konflikt a syndrom zavrženého rodiče.',
    tags: ['#Attachment', '#Vývojová psychologie', '#OSPOD', '#Prevence'],
    icon: BrainCircuit
  }
];

export const VolunteersPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [selectedPosition, setSelectedPosition] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
    motivation: '',
    linkedin: '',
    acceptedVolunteering: false,
    acceptedGDPR: false,
    acceptedCodex: false
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptedVolunteering || !formData.acceptedGDPR || !formData.acceptedCodex) {
      alert('Prosím, potvrďte všechny povinné souhlasy.');
      return;
    }
    
    // Simulate API call
    try {
      const response = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, position: selectedPosition })
      });
      if (response.ok) setSubmitted(true);
      else throw new Error('Chyba při odesílání.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Nastala chyba.');
    }
  };

  const handleSelectPosition = (id: string) => {
    setSelectedPosition(id);
    document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900">Děkujeme!</h2>
        <p className="text-slate-600">Vaše přihláška byla úspěšně odeslána. Ozveme se vám do 48 hodin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      <SeoHead title="Nábor dobrovolníků" description="Staň se součástí neziskové iniciativy a pomáhej chránit práva dětí a podporovat táty." canonicalPath="/dobrovolnici" />

      {/* Hero Section */}
      <section className="bg-slate-50 pt-16 pb-12 px-4">
        <div className="max-w-5xl mx-auto space-y-6 text-center">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider">
            Nezisková iniciativa • Hledáme posily
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
            Stavěj s námi systém, který chrání práva dětí a podporuje táty
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-lg">
            Jsme neziskový komunitní projekt bez jakýchkoliv příjmů. Hledáme zapálené dobrovolníky a odborníky, kteří chtějí ve svém volném čase pomoci měnit opatrovnickou praxi v ČR.
          </p>
          <div className="max-w-3xl mx-auto bg-amber-50 border border-amber-200 p-6 rounded-3xl flex gap-4 text-left text-sm text-amber-900">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-1">Upozornění k povaze zapojení:</strong>
              Veškeré zapojení a pomoc probíhá výhradně na bázi neplatného dobrovolnictví. Projekt nemá žádné komerční příjmy a je tvořen srdcem pro táty a jejich děti.
            </div>
          </div>
          <button onClick={() => document.getElementById('positions')?.scrollIntoView({ behavior: 'smooth' })} className="px-8 py-4 bg-blue-900 text-white font-bold rounded-2xl hover:bg-blue-800 transition-colors">
            Prohlédnout možnosti zapojení
          </button>
        </div>
      </section>

      {/* Positions Grid */}
      <section id="positions" className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">Otevřené dobrovolnické pozice</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {positions.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="p-3 bg-blue-50 text-blue-900 w-fit rounded-2xl">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p.description}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {p.tags.map(t => <span key={t} className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{t}</span>)}
                </div>
                <button onClick={() => handleSelectPosition(p.id)} className="w-full mt-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
                  Mám zájem o tuto oblast
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Registration Form */}
      <section id="application-form" className="max-w-3xl mx-auto px-4">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-100 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Chci pomáhat jako dobrovolník</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Jméno a Příjmení *</label>
                <input required type="text" className="w-full p-3 rounded-xl border border-slate-300" placeholder="Jan Novák" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-mailová adresa *</label>
                <input required type="email" className="w-full p-3 rounded-xl border border-slate-300" placeholder="jan.novak@email.cz" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Výběr oblasti pomoci *</label>
              <select required className="w-full p-3 rounded-xl border border-slate-300" value={selectedPosition} onChange={e => setSelectedPosition(e.target.value)}>
                <option value="">-- Vyberte pozici --</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                <option value="other">Iná / Vlastní iniciativa</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Stručný popis zkušeností a motivace *</label>
              <textarea required rows={4} className="w-full p-3 rounded-xl border border-slate-300" placeholder="Napište nám krátce o sobě..." value={formData.motivation} onChange={e => setFormData({...formData, motivation: e.target.value})} />
            </div>

            {/* Checkboxes */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input required type="checkbox" className="w-4 h-4" checked={formData.acceptedVolunteering} onChange={e => setFormData({...formData, acceptedVolunteering: e.target.checked})} />
                Beru na vědomí, že projekt nemá žádné příjmy a pomoc je poskytována výhradně dobrovolně bez nároku na finanční odměnu.
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input required type="checkbox" className="w-4 h-4" checked={formData.acceptedGDPR} onChange={e => setFormData({...formData, acceptedGDPR: e.target.checked})} />
                Souhlasím ze zpracováním osobních údajů podle Zásad ochrany osobních údajů (GDPR) a akceptuji Podmínky užívání portálu.
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input required type="checkbox" className="w-4 h-4" checked={formData.acceptedCodex} onChange={e => setFormData({...formData, acceptedCodex: e.target.checked})} />
                Seznámil(a) jsem se s Dobrovolnickým kodexem a zavazuji se jej dodržovat.
              </label>
            </div>

            <button type="submit" className="w-full py-4 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-800 transition-colors">
              Odeslat přihlášku dobrovolníka
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
