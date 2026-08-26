import { apiFetch } from '../../utils/apiClient';
import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import { 
  Scale, 
  Brain, 
  Laptop, 
  PenTool, 
  Heart, 
  Users, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export const VolunteersPage: React.FC<{ onNavigate: (path: string) => void; formOnly?: boolean }> = ({ onNavigate, formOnly }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    position: '',
    availability: '',
    message: '',
    acceptedVolunteering: false,
    acceptedGDPR: false,
    acceptedCodex: false
  });

  const handleScrollToForm = () => {
    document.getElementById('zapojit-se-formular')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPositionAndScroll = (posName: string) => {
    setFormData((prev) => ({ ...prev, position: posName }));
    handleScrollToForm();
  };

  const handleSelectOtherAndScroll = () => {
    setFormData((prev) => ({ ...prev, position: 'Jiné' }));
    handleScrollToForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.acceptedVolunteering || !formData.acceptedGDPR || !formData.acceptedCodex) {
      setError('Pro odeslání přihlášky musíte vyjádřit souhlas se všemi třemi prohlášeními.');
      return;
    }

    setLoading(true);

    try {
      // Map availability & message to 'motivation' field for existing DB schema compatibility
      const compositeMotivation = `Dostupnost: ${formData.availability || 'Nespecifikováno'}\n\nZpráva / motivace:\n${formData.message}`;

      const response = await apiFetch('/api/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || '',
          birthDate: '', // Optional for existing schema
          address: formData.location || '', // Localized location mapped to 'address'
          motivation: compositeMotivation,
          linkedin: '', // Optional
          position: formData.position,
          acceptedVolunteering: formData.acceptedVolunteering,
          acceptedGDPR: formData.acceptedGDPR,
          acceptedCodex: formData.acceptedCodex
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nepodařilo se odeslat přihlášku.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Nastala neočekávaná chyba při odesílání formuláře. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-6">
        <SeoHead 
          title="Děkujeme za váš zájem | Táta má právo" 
          description="Pomozte nám budovat spravedlivější prostředí pro táty a jejich děti. Hledáme dobrovolníky z oblasti práva, psychologie, IT, obsahu i komunity."
          canonicalPath="/o-projektu/dobrovolnici"
        />
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Děkujeme!</h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
          Děkujeme za váš zájem pomoci projektu Táta má právo. Vaše přihláška byla úspěšně odeslána a náš koordinační tým se vám ozve zpět.
        </p>
        <button 
          onClick={() => onNavigate('/')}
          className="mt-4 px-6 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-850 transition-all shadow-sm"
        >
          Zpět na hlavní stránku
        </button>
      </div>
    );
  }

  return (
    <>
      {!formOnly && (
        <div className="space-y-20 pb-24">
          <SeoHead 
            title="Hledáme dobrovolníky | Táta má právo" 
            description="Pomozte nám budovat spravedlivější prostředí pro táty a jejich děti. Hledáme dobrovolníky z oblasti práva, psychologie, IT, obsahu i komunity."
            canonicalPath="/o-projektu/dobrovolnici"
          />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 border-b border-slate-200 py-16 sm:py-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Společně pro děti a rodiny</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Pomozte nám budovat spravedlivé prostředí pro táty a jejich děti.
          </h1>
          <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed">
            Táta má právo vzniká jako komunitní a osvětový projekt, který propojuje lidi ochotné pomáhat, sdílet své znalosti a společně hledat cesty, jak zlepšit prostředí pro děti, otce a rodiny.
          </p>
          <div className="pt-4">
            <button 
              onClick={handleScrollToForm}
              className="px-8 py-3.5 bg-blue-900 text-white font-bold rounded-xl hover:bg-blue-950 transition-all text-xs tracking-wider shadow-sm flex items-center gap-2 mx-auto"
            >
              <span>🚀 Chci se zapojit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Koho hledáme */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Koho hledáme</h2>
          <p className="text-slate-600 text-sm max-w-xl mx-auto">
            Nemusíte být odborník. Potřebujeme také lidi, kteří mají zkušenost, nápad, čas nebo chuť pomáhat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>⚖️</span> Právo & opatrovnictví
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hledáme advokáty, koncipienty, studenty práv a další odborníky.
              </p>
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oblast pomoci:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 list-inside list-disc">
                  <li>odborné články</li>
                  <li>metodiky</li>
                  <li>kontrola vzorových podání</li>
                  <li>práce s právními zdroji</li>
                  <li>odborné připomínkování obsahu</li>
                  <li>konzultace anonymizovaných případů</li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
              <p className="text-[10px] text-slate-400 italic leading-normal">
                Upozorňujeme, že dobrovolnická spolupráce v rámci projektu nenahrazuje individuální právní zastoupení ani poskytování právních služeb ve smyslu zákona o advokacii.
              </p>
              <button 
                onClick={() => handleSelectPositionAndScroll('Právo & opatrovnictví')}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all text-center block"
              >
                Mám zájem o tuto oblast
              </button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>🧠</span> Psychologie, mediace & krizová podpora
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hledáme psychology, mediátory, terapeuty a další odborníky.
              </p>
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oblast pomoci:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 list-inside list-disc">
                  <li>podpůrné materiály</li>
                  <li>komunikace mezi rodiči</li>
                  <li>řešení konfliktních situací</li>
                  <li>odborný obsah</li>
                  <li>moderace citlivých témat</li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <button 
                onClick={() => handleSelectPositionAndScroll('Psychologie & mediace')}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all text-center block"
              >
                Mám zájem o tuto oblast
              </button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Laptop className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>💻</span> Vývoj, UI/UX & technologie
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hledáme React, TypeScript, Node.js, backend vývojáře, UI/UX designéry, testery, DevOps a AI/LLM specialisty.
              </p>
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oblast pomoci:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 list-inside list-disc">
                  <li>vývoj portálu</li>
                  <li>UX/UI design</li>
                  <li>testování a QA</li>
                  <li>bezpečnost a audit</li>
                  <li>automatizace procesů</li>
                  <li>technická dokumentace</li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <button 
                onClick={() => handleSelectPositionAndScroll('IT & technologie')}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all text-center block"
              >
                Mám zájem o tuto oblast
              </button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-200 transition-all">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>✍️</span> Obsah & komunita
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Hledáme copywritery, redaktory, autory článků, správce sociálních sítí, moderátory a komunitní správce.
              </p>
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Oblast pomoci:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 list-inside list-disc">
                  <li>tvorba článků a redakce</li>
                  <li>správa sociálních sítí</li>
                  <li>moderování komunit</li>
                  <li>zpracování příběhů otců</li>
                  <li>vnější komunikace projektu</li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <button 
                onClick={() => handleSelectPositionAndScroll('Obsah & komunikace')}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all text-center block"
              >
                Mám zájem o tuto oblast
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Nemusíte být odborník */}
      <section className="bg-blue-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Máte jiný způsob, jak pomoci?
          </h2>
          <p className="text-slate-700 text-sm leading-relaxed max-w-2xl mx-auto">
            Nemusíte být právník, psycholog ani programátor. Možná máte zkušenost, která může pomoci jinému otci. Možná umíte organizovat, překládat, fotografovat, natáčet, hledat informace nebo jednoduše věnovat několik hodin měsíčně.
          </p>
          <div className="pt-2">
            <button 
              onClick={handleSelectOtherAndScroll}
              className="px-6 py-3 bg-blue-900 text-white font-bold text-xs rounded-xl hover:bg-blue-950 transition-all"
            >
              Napište nám, s čím byste chtěli pomoci
            </button>
          </div>
        </div>
      </section>

      {/* Co nabízíme */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Co získáte zapojením do projektu</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Item 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">❤️ Smysluplný dopad</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pomáháte vytvářet nástroje a informace s reálným dopadem na životy otců a jejich dětí.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Laptop className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">💻 Moderní technologie</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Možnost podílet se na moderním technologickém projektu.
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">🤝 Odborná komunita</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Propojení s lidmi z oblasti práva, psychologie, IT, komunikace a dalších oborů.
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">🌱 Dlouhodobá spolupráce</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Možnost dlouhodobě se podílet na rozvoji projektu podle vašich možností.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Jak spolupráce funguje */}
      <section className="bg-slate-50 py-16 border-t border-b border-slate-200 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Jak spolupráce funguje</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-3 relative text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center text-sm shadow-sm mx-auto sm:mx-0">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Podání nabídky</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Odešlete nám nabídku pomoci přes formulář níže.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3 relative text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center text-sm shadow-sm mx-auto sm:mx-0">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Ozvěme se</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Náš koordinační tým se vám brzy ozve.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3 relative text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center text-sm shadow-sm mx-auto sm:mx-0">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Dohoda</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Domluvíme rozsah, oblast a formu spolupráce.
              </p>
            </div>

            {/* Step 4 */}
            <div className="space-y-3 relative text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black flex items-center justify-center text-sm shadow-sm mx-auto sm:mx-0">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Spolupráce</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Začneme společně pracovat na rozvoji projektu.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl flex gap-3 text-xs text-slate-600 leading-relaxed max-w-2xl mx-auto">
            <Clock className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
            <span>
              Nemusíte se zavazovat k pravidelné práci. Rozsah spolupráce se může plně přizpůsobit vašemu času a možnostem.
            </span>
          </div>
        </div>
      </section>
        </div>
      )} {/* End !formOnly */}

      {/* Formulář (zobrazí se vždy, tedy i když formOnly=true) */}
      <section id="zapojit-se-formular" className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">
              Registrační formulář
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Chci se zapojit</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vyplňte prosím níže uvedený formulář. Vyjádření zájmu je nezávazné, spojíme se s vámi a prodiskutujeme možnosti.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 text-xs text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jméno a příjmení *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Např. Jan Novák"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail *
                </label>
                <input
                  required
                  type="email"
                  placeholder="Např. jan.novak@example.cz"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefon (volitelné)
                </label>
                <input
                  type="tel"
                  placeholder="Např. +420 777 123 456"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lokalita (volitelné)
                </label>
                <input
                  type="text"
                  placeholder="Např. Praha, Brno, Online"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Oblast zájmu *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                >
                  <option value="">-- Vyberte oblast zájmu --</option>
                  <option value="Právo & opatrovnictví">Právo & opatrovnictví</option>
                  <option value="Psychologie & mediace">Psychologie & mediace</option>
                  <option value="IT & technologie">IT & technologie</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="AI & automatizace">AI & automatizace</option>
                  <option value="Obsah & komunikace">Obsah & komunikace</option>
                  <option value="Komunita">Komunita</option>
                  <option value="Jiné">Jiné</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kolik času můžete věnovat *
                </label>
                <select
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                >
                  <option value="">-- Vyberte časové možnosti --</option>
                  <option value="Jednorázově">Jednorázově</option>
                  <option value="Příležitostně">Příležitostně</option>
                  <option value="Několik hodin měsíčně">Několik hodin měsíčně</option>
                  <option value="Pravidelně">Pravidelně</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stručná zpráva / motivace *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Napište nám krátce o své motivaci nebo s čím konkrétně byste chtěli pomoci..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>

            {/* Consents list */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  required
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 shrink-0 rounded border-slate-300 accent-blue-900 focus:ring-blue-500"
                  checked={formData.acceptedVolunteering}
                  onChange={(e) => setFormData({ ...formData, acceptedVolunteering: e.target.checked })}
                />
                <span>
                  Beru na vědomí, že projekt nemá žádné příjmy a pomoc je poskytována výhradně dobrovolně bez nároku na finanční odměnu. *
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  required
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 shrink-0 rounded border-slate-300 accent-blue-900 focus:ring-blue-500"
                  checked={formData.acceptedGDPR}
                  onChange={(e) => setFormData({ ...formData, acceptedGDPR: e.target.checked })}
                />
                <span>
                  Souhlasím se zpracováním osobních údajů podle{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/pravni-dokumenty?doc=gdpr');
                    }}
                    className="text-blue-600 hover:underline cursor-pointer font-semibold focus:outline-none inline"
                  >
                    Zásad ochrany osobních údajů (GDPR)
                  </button>{' '}
                  a akceptuji{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/pravni-dokumenty?doc=terms');
                    }}
                    className="text-blue-600 hover:underline cursor-pointer font-semibold focus:outline-none inline"
                  >
                    Podmínky užívání portálu
                  </button>
                  . *
                </span>
              </label>

              <label className="flex items-start gap-3 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  required
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 shrink-0 rounded border-slate-300 accent-blue-900 focus:ring-blue-500"
                  checked={formData.acceptedCodex}
                  onChange={(e) => setFormData({ ...formData, acceptedCodex: e.target.checked })}
                />
                <span>
                  Seznámil(a) jsem se s{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/pravni-dokumenty?doc=volunteer_code');
                    }}
                    className="text-blue-600 hover:underline cursor-pointer font-semibold focus:outline-none inline"
                  >
                    Dobrovolnickým kodexem
                  </button>{' '}
                  a zavazuji se jej dodržovat. *
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Odesílám přihlášku...</span>
              ) : (
                <>
                  <span>🚀 Chci se zapojit</span>
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </>
  );
};
