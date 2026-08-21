import React, { useState, useEffect } from 'react';
import { ShieldAlert, Phone, ArrowLeft, AlertTriangle, HeartPulse, Scale, Info, CheckCircle2, Square, CheckSquare, Printer, Clock } from 'lucide-react';

interface SosPlanViewProps {
  onNavigate?: (view: string) => void;
}

export const SosPlanView: React.FC<SosPlanViewProps> = ({ onNavigate }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tata_sos_checklist');
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (e) {
      // Ignorovat chyby LS
    }
  }, []);

  const toggleCheck = (id: string) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(newChecked);
    try {
      localStorage.setItem('tata_sos_checklist', JSON.stringify(newChecked));
    } catch (e) {}
  };

  const handlePrint = () => {
    window.print();
  };

  const crisisContacts = [
    {
      category: 'A. Bezprostřední ohrožení života nebo zdraví',
      icon: <ShieldAlert className="w-5 h-5 text-rose-500" />,
      contacts: [
        { name: 'Tísňová linka', phone: '112', desc: 'Při bezprostředním ohrožení života nebo zdraví.' },
        { name: 'Policie ČR', phone: '158', desc: 'Při fyzickém napadení, nebezpečném vyhrožování.' },
        { name: 'Zdravotnická záchranná služba', phone: '155', desc: 'Akutní zdravotní potíže, zranění.' }
      ],
      source: 'Integrovaný záchranný systém ČR',
      verified: '2026-08-21'
    },
    {
      category: 'B. Krizová psychologická pomoc (Nonstop)',
      icon: <HeartPulse className="w-5 h-5 text-rose-500" />,
      contacts: [
        { name: 'Linka první psychické pomoci', phone: '116 123', desc: 'Pro dospělé v krizi, zdarma a anonymně.' },
        { name: 'Linka bezpečí (pro děti)', phone: '116 111', desc: 'Pokud je dítě v akutní tísni.' },
        { name: 'Bílý kruh bezpečí', phone: '116 006', desc: 'Pomoc obětem trestných činů a domácího násilí.' }
      ],
      source: 'Ministerstvo vnitra ČR / Cesta z krize',
      verified: '2026-08-21'
    },
    {
      category: 'C. Právní a sociální pomoc (Pracovní dny)',
      icon: <Scale className="w-5 h-5 text-indigo-500" />,
      contacts: [
        { name: 'OSPOD (dle trvalého bydliště dítěte)', phone: 'Vyhledejte na webu obce', desc: 'Klíčový orgán pro ochranu dětí. Podejte věcný podnět bez emocí.' },
        { name: 'APERIO – Linka pro rodiče', phone: '739 062 836', desc: 'Právní a psychologická podpora (Út, St, Čt).' },
        { name: 'Česká advokátní komora', phone: 'www.cak.cz', desc: 'Vyhledávání advokátů pro rodinné právo.' }
      ],
      source: 'ÚMPOD / APERIO',
      verified: '2026-08-21'
    }
  ];

  const checklist0to2 = [
    { id: 'item-0-1', label: 'Zajištění bezpečí: Jste vy i děti v bezpečí? Pokud hrozí násilí, volejte 158.' },
    { id: 'item-0-2', label: 'Emoční STOP: Nedělejte žádná ukvapená rozhodnutí. Neodpovídejte v afektu na zprávy.' },
    { id: 'item-0-3', label: 'Zdržení se odchodu: Neopouštějte společnou domácnost v emocích bez domluvy (může mít vliv na péči). Před odchodem to zvažte/konzultujte.' }
  ];

  const checklist2to12 = [
    { id: 'item-2-1', label: 'Minimalizace konfliktu před dětmi: Děti nesmí být svědky hádek. Udržujte rutinu.' },
    { id: 'item-2-2', label: 'Písemná komunikace: Přesuňte komunikaci do písemné formy (SMS, email). Používejte pravidlo BIFF (Stručně, Fakta, Slušně, K věci).' },
    { id: 'item-2-3', label: 'Zálohování důkazů: Udělejte screenshoty důležitých zpráv a uložte fotky s dětmi na bezpečné místo.' }
  ];

  const checklist12to24 = [
    { id: 'item-12-1', label: 'Pravidlo 24h: Na provokativní nebo konfliktní zprávy odpovídejte až s odstupem.' },
    { id: 'item-12-2', label: 'Nic nepodepisujte v tlaku: Nevzdávejte se práv a nepodepisujte dohody o dětech/majetku bez právní porady.' },
    { id: 'item-12-3', label: 'Ochrana majetku: Zajistěte si přístup k vlastním dokladům a důležitým listinám.' }
  ];

  const checklist24to48 = [
    { id: 'item-24-1', label: 'Vyhledání odborníka: Kontaktujte rodinného advokáta pro konzultaci prvních kroků.' },
    { id: 'item-24-2', label: 'Kontakt s OSPOD: V případě bránění ve styku nebo krize s dětmi pošlete na OSPOD věcný (nikoli útočný) podnět.' },
    { id: 'item-24-3', label: 'Nepředání dítěte: Pokud matka dítě nepředá, zůstaňte v klidu, pošlete zdvořilou SMS s žádostí o náhradní termín (evidence).' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hlavní hlavička */}
      <div className="bg-slate-900 text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          {onNavigate && (
            <button 
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold tracking-wide"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zpět na přehled
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-4">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Krizový průvodce</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
            Co dělat během prvních 48 hodin po rozpadu vztahu / krizové situaci
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            První hodiny a dny po vzniku akutního konfliktu určují budoucí vývoj. Následující postupy a kontakty vám pomohou situaci stabilizovat, chránit děti a vyvarovat se nevratných chyb. Obsah slouží pro informační účely a nenahrazuje právní zastoupení.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Krizové kontakty */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Phone className="w-6 h-6 text-rose-600" />
            Krizové kontakty
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {crisisContacts.map((group, idx) => (
              <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  {group.icon}
                  <h3 className="font-bold text-slate-900 text-sm">{group.category}</h3>
                </div>
                <div className="space-y-4">
                  {group.contacts.map((contact, cIdx) => (
                    <div key={cIdx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <div className="font-extrabold text-slate-900 text-sm">{contact.name}</div>
                      <div className="text-lg font-black text-indigo-600 my-1">{contact.phone}</div>
                      <div className="text-xs text-slate-600">{contact.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                  Zdroj: {group.source} • Ověřeno: {group.verified}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Metodika APERIO a obecné info */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
           <div className="inline-flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Info className="w-4 h-4" />
            <span>Odborná doporučení a prevence</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-4">
            Jak ochránit psychiku dětí (Metodika APERIO)
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Děti nesmí být nikdy přítomny hádkám, výčitkám, napadání ani rozhovorům o financích či majetku. Pokud možno oznamte dětem rozchod společně, bez svalování viny, a udržte jejich stávající rituály (škola, kroužky).
          </p>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3">
             <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
             <div className="text-xs text-amber-900">
               <strong>Právní disclaimer:</strong> Prezentované postupy představují obecná doporučení pro minimalizaci konfliktu. Nejedná se o závazné právní rady. Například odchod ze společné domácnosti může mít v konkrétní situaci právní a praktické důsledky. Před zásadním rozhodnutím vždy konzultujte advokáta.
             </div>
          </div>
        </section>

        {/* Checklist 48 hodin */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl print:bg-white print:text-black print:border-none print:shadow-none">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800 print:border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-2 print:text-emerald-700 print:bg-emerald-50 print:border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                <span>Interaktivní kontrolní seznam</span>
              </div>
              <h3 className="text-2xl font-black text-white print:text-slate-900">
                Checklist: Prvních 48 hodin
              </h3>
              <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                Zaškrtněte splněné body. Stav se automaticky ukládá pouze ve vašem prohlížeči.
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all flex items-center gap-2 shadow-md cursor-pointer shrink-0 print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>Vytisknout / Uložit PDF</span>
            </button>
          </div>

          <div className="space-y-8">
            {/* 0-2 h */}
            <div>
              <h4 className="flex items-center gap-2 text-rose-400 font-bold mb-4 print:text-rose-600">
                <Clock className="w-5 h-5" /> 0–2 hodiny (Fáze šoku)
              </h4>
              <div className="space-y-3">
                {checklist0to2.map((item) => {
                  const isDone = !!checkedItems[item.id];
                  return (
                    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 print:bg-emerald-50 print:border-emerald-200 print:text-slate-500' : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 print:bg-white print:border-slate-300 print:text-slate-800'}`}>
                      <button className="mt-0.5 text-indigo-400 shrink-0 cursor-pointer">
                        {isDone ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </button>
                      <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2-12 h */}
            <div>
              <h4 className="flex items-center gap-2 text-amber-400 font-bold mb-4 print:text-amber-600">
                <Clock className="w-5 h-5" /> 2–12 hodin (Stabilizace)
              </h4>
              <div className="space-y-3">
                {checklist2to12.map((item) => {
                  const isDone = !!checkedItems[item.id];
                  return (
                    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 print:bg-emerald-50 print:border-emerald-200 print:text-slate-500' : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 print:bg-white print:border-slate-300 print:text-slate-800'}`}>
                      <button className="mt-0.5 text-indigo-400 shrink-0 cursor-pointer">
                        {isDone ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </button>
                      <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 12-24 h */}
            <div>
              <h4 className="flex items-center gap-2 text-indigo-400 font-bold mb-4 print:text-indigo-600">
                <Clock className="w-5 h-5" /> 12–24 hodin (Odstup a strategie)
              </h4>
              <div className="space-y-3">
                {checklist12to24.map((item) => {
                  const isDone = !!checkedItems[item.id];
                  return (
                    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 print:bg-emerald-50 print:border-emerald-200 print:text-slate-500' : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 print:bg-white print:border-slate-300 print:text-slate-800'}`}>
                      <button className="mt-0.5 text-indigo-400 shrink-0 cursor-pointer">
                        {isDone ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </button>
                      <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 24-48 h */}
            <div>
              <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-4 print:text-emerald-600">
                <Clock className="w-5 h-5" /> 24–48 hodin (Odborná pomoc)
              </h4>
              <div className="space-y-3">
                {checklist24to48.map((item) => {
                  const isDone = !!checkedItems[item.id];
                  return (
                    <div key={item.id} onClick={() => toggleCheck(item.id)} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200 print:bg-emerald-50 print:border-emerald-200 print:text-slate-500' : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 print:bg-white print:border-slate-300 print:text-slate-800'}`}>
                      <button className="mt-0.5 text-indigo-400 shrink-0 cursor-pointer">
                        {isDone ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </button>
                      <span className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
