import React, { useState, useEffect } from 'react';
import { SeoHead } from './SeoHead';
import { calculateChildSupport, AlimonyInput, ChildInput, AlimonyResult, AgeGroup } from '../../utils/alimonyCalculator';
import { 
  Calculator, AlertTriangle, Info, RefreshCw, ChevronRight, 
  User, Plus, Trash2, Scale, BookOpen, ShieldAlert, 
  HelpCircle, ChevronDown, ChevronUp, FileText, CheckCircle2 
} from 'lucide-react';
import { analytics } from '../../lib/analyticsClient';

export const AlimonyCalculatorView: React.FC = () => {
  useEffect(() => {
    analytics.trackFeature('alimony_calculator', 'feature_open');
  }, []);

  const [netIncome, setNetIncome] = useState<string>('');
  const [otherObligations, setOtherObligations] = useState<number>(0);
  const [children, setChildren] = useState<ChildInput[]>([
    { id: '1', ageGroup: '0-5', careDays: 0 }
  ]);
  const [result, setResult] = useState<AlimonyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleAddChild = () => {
    setChildren([...children, { id: Date.now().toString(), ageGroup: '0-5', careDays: 0 }]);
  };

  const handleRemoveChild = (id: string) => {
    setChildren(children.filter(c => c.id !== id));
  };

  const updateChild = (id: string, updates: Partial<ChildInput>) => {
    setChildren(children.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleCalculate = () => {
    setError(null);
    setResult(null);

    const parsedIncome = parseInt(netIncome.replace(/\D/g, ''), 10);
    if (isNaN(parsedIncome) || parsedIncome < 0) {
      setError('Zadejte prosím platný čistý měsíční příjem.');
      return;
    }

    if (children.length === 0) {
      setError('Přidejte alespoň jedno dítě pro výpočet.');
      return;
    }

    // Validate care days
    for (let i = 0; i < children.length; i++) {
      if (children[i].careDays < 0 || children[i].careDays > 30.4) {
        setError(`Počet dní péče u dítěte ${i + 1} musí být mezi 0 a 30,4 dní.`);
        return;
      }
    }

    const input: AlimonyInput = {
      netIncome: parsedIncome,
      otherObligationsCount: otherObligations,
      children: children
    };

    try {
      const res = calculateChildSupport(input);
      setResult(res);
      analytics.trackFeature('alimony_calculator', 'calculation_completed', {
        childrenCount: children.length,
        hasResult: true
      });
    } catch (e: any) {
      setError('Nastala chyba při výpočtu výživného.');
    }
  };

  const handleReset = () => {
    setNetIncome('');
    setOtherObligations(0);
    setChildren([{ id: '1', ageGroup: '0-5', careDays: 0 }]);
    setResult(null);
    setError(null);
  };

  const alimonyFaqs = [
    {
      q: 'Jsou tabulky Ministerstva spravedlnosti pro soud závazné?',
      a: 'Ne. Doporučující tabulky MSČR mají pouze podpůrný a orientační charakter. Soud je povinen zkoumat konkrétní individuální poměry na straně obou rodičů (skutečný majetek, životní úroveň, náklady na bydlení) i odůvodněné potřeby konkrétního dítěte.'
    },
    {
      q: 'Jak se posuzuje výživné při střídavé péči (např. 50/50)?',
      a: 'Při stejnoměrném rozsahu péče se výživné vypočítá oběma rodičům vzájemně podle jejich příjmů. Pokud mají rodiče podobné příjmy, soud může rozhodnout, že se výživné neurčuje, nebo stanoví pouze doplatek rodiče s vyšším příjmem k vyrovnání životní úrovně dítěte.'
    },
    {
      q: 'Co je to kontrolní částka povinného rodiče?',
      a: 'Kontrolní částka chrání povinného rodiče před existenčním ohrožením. Dle metodiky MSČR by rodiči po odečtení veškerého výživného měla zůstat částka na zajištění jeho základních životních potřeb (zpravidla min. 50 % čistého příjmu nebo zákonné nezabavitelné minimum).'
    },
    {
      q: 'Jak se do výživného promítá tvorba úspor pro dítě?',
      a: 'Dle judikatury Ústavního soudu (např. sp. zn. I. ÚS 2908/14) mají děti právo podílet se na životní úrovni svých rodičů. Pokud má rodič nadstandardní příjmy, může část výživného směřovat na vázaný spořicí účet dítěte pro jeho budoucí studium či start do života.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <SeoHead
        title="Kalkulačka výživného 2026 • Výpočet dle metodiky MSČR • Táta má právo"
        description="Orientační kalkulačka výživného na děti podle oficiální doporučující metodiky Ministerstva spravedlnosti ČR. Zohlednění věkových kategorií, počtu vyživovacích povinností a rozsahu péče."
        canonicalPath="/kalkulacka-vyzivneho"
      />

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold uppercase tracking-wider">
          <Scale className="w-4 h-4 text-blue-600" /> Metodika MSČR (Aktualizovaná)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Kalkulačka výživného na dítě
        </h1>
        <p className="text-base text-slate-600 max-w-2xl mx-auto">
          Orientační výpočet výživného vycházející z oficiálního doporučujícího materiálu 
          Ministerstva spravedlnosti ČR. Všechny výpočty probíhají bezpečně ve vašem prohlížeči.
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="space-y-6">
          {/* Čistý příjem */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Váš průměrný čistý měsíční příjem (Kč)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="např. 45 000"
                value={netIncome}
                onChange={(e) => setNetIncome(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">Kč</span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Zadejte průměrný čistý příjem za posledních 6–12 měsíců včetně prémií, odměn a dalších příjmů.
            </p>
          </div>

          {/* Ostatní vyživovací povinnosti */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">
              Počet dalších vyživovacích povinností (mimo níže uvedené děti)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={otherObligations}
              onChange={(e) => setOtherObligations(parseInt(e.target.value, 10) || 0)}
              className="w-full p-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Např. děti z nového manželství nebo vyživovací povinnost k manželovi/manželce.
            </p>
          </div>

          {/* Děti */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Posuzované děti v tomto řízení</h3>
              {children.length < 5 && (
                <button
                  onClick={handleAddChild}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Přidat další dítě
                </button>
              )}
            </div>

            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={child.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" /> Dítě {index + 1}
                    </h4>
                    {children.length > 1 && (
                      <button
                        onClick={() => handleRemoveChild(child.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Odebrat dítě"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Věková kategorie dítěte</label>
                      <select
                        value={child.ageGroup}
                        onChange={(e) => updateChild(child.id, { ageGroup: e.target.value as AgeGroup })}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-semibold"
                      >
                        <option value="0-5">0 - 5 let (Předškolní věk, 14 %)</option>
                        <option value="6-9">6 - 9 let (1. stupeň ZŠ, 16 %)</option>
                        <option value="10-14">10 - 14 let (2. stupeň ZŠ, 19 %)</option>
                        <option value="15+">15 a více let (SŠ / VŠ, 22 %)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Dny vaší péče v měsíci</label>
                      <input
                        type="number"
                        min="0"
                        max="30.4"
                        step="0.5"
                        value={child.careDays}
                        onChange={(e) => updateChild(child.id, { careDays: parseFloat(e.target.value) || 0 })}
                        className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                      />
                      <p className="text-2xs text-slate-500 mt-1">Průměrný měsíc = 30,4 dní. Střídavá 50/50 = 15,2 dní.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleCalculate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 cursor-pointer"
          >
            <Calculator className="w-5 h-5" />
            <span>Vypočítat orientační výživné</span>
          </button>
        </div>
      </div>

      {/* VÝSLEDEK VÝPOČTU */}
      {result && (
        <div className="bg-white rounded-3xl shadow-lg border-2 border-blue-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 text-white text-center">
            <h2 className="text-2xl font-black mb-1">Výsledek orientačního výpočtu</h2>
            <div className="text-xs text-blue-200">
              Celkový počet započtených vyživovacích povinností: {result.totalObligations}
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-4">
              {result.childrenResults.map((cr, idx) => (
                <div key={cr.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Dítě {idx + 1}</h3>
                    <div className="text-xs text-slate-500 space-y-1 mt-1">
                      <div>Základní podíl z příjmu: {(cr.basePercentage * 100).toFixed(0)} % ({cr.baseAmount.toLocaleString('cs-CZ')} Kč)</div>
                      {cr.careReduction > 0 && (
                        <div className="text-emerald-700 font-semibold">Sleva za rozsah osobní péče: -{cr.careReduction.toLocaleString('cs-CZ')} Kč</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Výživné na dítě</div>
                    <div className="text-2xl sm:text-3xl font-black text-blue-700">{cr.finalAmount.toLocaleString('cs-CZ')} Kč</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Celkové měsíční výživné</h3>
                <p className="text-xs text-slate-500">Součet částek za všechny zahrnuté děti</p>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900">
                {result.totalFinalAmount.toLocaleString('cs-CZ')} Kč
              </div>
            </div>

            {result.controlAmountWarning && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-amber-900 text-xs sm:text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <strong>Upozornění na kontrolní částku:</strong> Vypočtené celkové výživné přesahuje 50 % vašeho čistého příjmu. 
                  Soudy v takových případech zkoumají tzv. kontrolní částku a nezabavitelné minimum, aby rodiči zůstal 
                  dostatek prostředků pro zajištění vlastních základních životních potřeb.
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-center">
            <button
              onClick={handleReset}
              className="text-slate-600 hover:text-slate-900 font-bold text-sm flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Spočítat znovu
            </button>
          </div>
        </div>
      )}

      {/* METODICKÝ VÝKLAD A PRÁVNÍ KONTEXT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Jak fungují tabulky MSČR
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Metodika Ministerstva spravedlnosti ČR vychází ze 4 věkových pásem (0–5, 6–9, 10–14, 15+ let) 
            a počtu vyživovacích povinností. Při 1 povinnosti se základní sazba pohybuje od 14 % do 22 % 
            z čistého příjmu; s každou další vyživovací povinností se sazba adekvátně snižuje.
          </p>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong>Klíčová zásada:</strong> Osobní péče o dítě má stejnou hodnotu jako finanční plnění. 
            Pokud o dítě pečujete polovinu času, výživné se adekvátně krátí.
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Běžné výživné vs. Mimořádné náklady
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Stanovené měsíční výživné ze zákona pokrývá veškeré běžné životní potřeby dítěte (jídlo, běžné oblečení, 
            školní obědy, běžné pomůcky).
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Mimořádné výdaje</strong> (rovnátka, brýle, lyžařský kurz, jazykový pobyt) by si rodiče 
            měli odsouhlasit předem a podělit se o ně rovným dílem nebo poměrně podle svých příjmů.
          </p>
        </div>
      </div>

      {/* FAQ SEKCE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Často kladené otázky k výživnému
        </h2>

        <div className="space-y-3">
          {alimonyFaqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer text-sm"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs sm:text-sm text-slate-600 bg-slate-50/50 border-t border-slate-100 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
