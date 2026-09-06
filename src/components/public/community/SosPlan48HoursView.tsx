import React, { useState, useEffect } from 'react';
import { SeoHead } from '../SeoHead';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Square, 
  CheckSquare, 
  Printer, 
  Clock, 
  ShieldAlert,
  Info,
  ChevronLeft
} from 'lucide-react';

interface SosPlan48HoursViewProps {
  onNavigate?: (view: string) => void;
}

export const SosPlan48HoursView: React.FC<SosPlan48HoursViewProps> = ({ onNavigate }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tata_sos_checklist');
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch (e) {
      // Ignore localStorage errors gracefully
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

  const checklist0to2 = [
    { id: 'item-0-1', label: 'Zajištění bezpečí: Pokud hrozí bezprostřední nebezpečí, odejděte na bezpečné místo nebo volejte 158.' },
    { id: 'item-0-2', label: 'Emoční STOP: Nerozhodujte v afektu, neposílejte vyčítavé laviny zpráv a učiňte vědomý časový odstup.' },
    { id: 'item-0-3', label: 'Stabilizace stavu: Dýchejte zhluboka, soustřeďte se na přítomný okamžik a oddělte emoce od faktů.' }
  ];

  const checklist2to12 = [
    { id: 'item-2-1', label: 'Ochrana dítěte: Zamezte jakýmkoli hádkám nebo právním debatám před dítětem.' },
    { id: 'item-2-2', label: 'Nastavení klientského tónu: S druhým rodičem komunikujte pouze písemně, věcně a stručně.' },
    { id: 'item-2-3', label: 'Organizační shoda: Pokud je to možné, dohodněte se písemně na nejbližším předání dítěte.' }
  ];

  const checklist12to24 = [
    { id: 'item-12-1', label: 'Zajištění základních dokumentů: Zabezpečte kopie rodných listů dětí a klíčových soudních rozhodnutí.' },
    { id: 'item-12-2', label: 'Vedení faktického deníku: Začněte si chronologicky a bez emocí zapisovat události a průběh předávání.' },
    { id: 'item-12-3', label: 'Bezpečnostní limit: Nic zásadního nepodepisujte pod tlakem ani bez konzultace s odborníkem.' }
  ];

  const checklist24to48 = [
    { id: 'item-24-1', label: 'Konzultace s odborníkem: Vyhledejte specializovaného rodinného psychologa nebo bezplatnou poradnu.' },
    { id: 'item-24-2', label: 'Kontaktování OSPOD: V případě zamezování kontaktu s dítětem informujte příslušný OSPOD věcným podnětem.' },
    { id: 'item-24-3', label: 'Příprava strategie: Sestavte si s chladnou hlavou seznam kroků pro stabilizaci pravidelného režimu dětí.' }
  ];

  const totalItems = 12;
  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / totalItems) * 100);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 print:bg-white print:pb-0">
      <SeoHead
        title="Interaktivní krizový plán 48 hodin • Táta má právo"
        description="Detailní interaktivní checklist pro prvních 48 hodin po rozpadu vztahu. Udržte chladnou hlavu, postupujte systematicky a chraňte zájmy svých dětí."
        canonicalPath="/sos-plan/48-hodin"
      />
      
      {/* Header bar */}
      <div className="bg-slate-900 text-white pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-200 print:pt-4 print:pb-4">
        <div className="max-w-4xl mx-auto relative z-10">
          {onNavigate && (
            <button 
              onClick={() => onNavigate('/sos-plan')}
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold tracking-wide print:hidden"
              id="btn-back-to-sos"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zpět na SOS plán
            </button>
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-3 print:bg-rose-50 print:text-rose-700 print:border-rose-200">
                <Clock className="w-3.5 h-3.5 text-rose-400 print:text-rose-600" />
                <span>Prvních 48 hodin</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Interaktivní krizový plán
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed print:text-slate-600">
                Systematický průvodce s perzistentním checklistem. Odškrtnuté úkoly zůstávají uloženy ve vašem prohlížeči.
              </p>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-md cursor-pointer print:hidden"
              id="btn-print-pdf"
            >
              <Printer className="w-4 h-4" />
              <span>Vytisknout / Uložit PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Progress tracking */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 print:hidden">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-500">Celkový postup plánu</span>
              <span className="text-xs font-black text-indigo-600">{completedCount} ze {totalItems} hotovo ({progressPercent} %)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Checklist Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Phase 1 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs print:shadow-none print:border-slate-200 print:p-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Fáze 1: 0 až 2 hodiny — Fáze šoku
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bezprostředně po vypuknutí krizové situace. Cílem je deeskalace a zabránění zkratovému jednání.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {checklist0to2.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    isChecked 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-slate-400 group cursor-pointer" aria-label="Označit úkol">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                  <span className={`text-xs sm:text-sm font-semibold leading-relaxed ${isChecked ? 'line-through opacity-75' : ''}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Phase 2 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs print:shadow-none print:border-slate-200 print:p-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Fáze 2: 2 až 12 hodin — První opatření
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                První den krize. Cílem je nastavení základních hranic a bezpečné klientské komunikace.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {checklist2to12.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    isChecked 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-slate-400 group cursor-pointer" aria-label="Označit úkol">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                  <span className={`text-xs sm:text-sm font-semibold leading-relaxed ${isChecked ? 'line-through opacity-75' : ''}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Phase 3 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs print:shadow-none print:border-slate-200 print:p-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Fáze 3: 12 až 24 hodin — Odstup a přehled
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Druhý den ráno. Cílem je zajištění dokumentace a klidné zhodnocení reality bez právních zkratek.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {checklist12to24.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    isChecked 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-slate-400 group cursor-pointer" aria-label="Označit úkol">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                  <span className={`text-xs sm:text-sm font-semibold leading-relaxed ${isChecked ? 'line-through opacity-75' : ''}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Phase 4 */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs print:shadow-none print:border-slate-200 print:p-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Fáze 4: 24 až 48 hodin — Plánování pomoci
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Závěr druhého dne. Cílem je vyhledání odborné podpory a zformování stabilního režimu dětí.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {checklist24to48.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div 
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    isChecked 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' 
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-slate-400 group cursor-pointer" aria-label="Označit úkol">
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                    )}
                  </button>
                  <span className={`text-xs sm:text-sm font-semibold leading-relaxed ${isChecked ? 'line-through opacity-75' : ''}`}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Legal notice footer */}
        <div className="bg-slate-100 rounded-2xl p-4.5 border border-slate-200 flex items-start gap-3 print:bg-white print:border-slate-200">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            <strong>Důležité právní upozornění:</strong> Informace obsažené v tomto krizovém průvodci slouží výhradně jako obecné vzdělávací a informační materiály pro stabilizaci krizových situací. Nejedná se o individuální právní nebo psychologické poradenství a tyto pokyny nenahrazují odborné služby specializovaného advokáta, psychoterapeuta či rodinného poradce.
          </p>
        </div>

        {/* Print only footer */}
        <div className="hidden print:block text-center text-[10px] text-slate-400 pt-8 border-t border-slate-200">
          <p>Generováno portálem Táta má právo • tatamapravo.cz</p>
        </div>
      </div>
    </div>
  );
};
