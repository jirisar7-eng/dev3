import React, { useState, useEffect } from 'react';
import { SeoHead } from './SeoHead';
import { calculateChildSupport, AlimonyInput, ChildInput, AlimonyResult, AgeGroup } from '../../utils/alimonyCalculator';
import { Calculator, AlertTriangle, Info, RefreshCw, ChevronRight, User, Plus, Trash2 } from 'lucide-react';
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
      setError('Zadejte platný čistý měsíční příjem.');
      return;
    }

    try {
      const calcResult = calculateChildSupport({
        netIncome: parsedIncome,
        children: children.map(c => ({
          ...c,
          careDays: Number(c.careDays)
        })),
        otherObligations: Number(otherObligations)
      });
      setResult(calcResult);
      analytics.trackFeature('alimony_calculator', 'feature_complete');
    } catch (err: any) {
      setError(err.message || 'Nastala chyba při výpočtu.');
    }
  };

  const handleReset = () => {
    setNetIncome('');
    setOtherObligations(0);
    setChildren([{ id: '1', ageGroup: '0-5', careDays: 0 }]);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <SeoHead
        title="Kalkulačka výživného | Táta má právo"
        description="Orientační kalkulačka výživného podle aktuálních doporučujících tabulek Ministerstva spravedlnosti ČR."
      />

      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4 text-blue-600">
          <Calculator className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Kalkulačka výživného</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Orientační výpočet podle aktuálních doporučujících tabulek Ministerstva spravedlnosti ČR. 
          Výpočet probíhá výhradně ve vašem prohlížeči, žádná finanční data se nikam neodesílají ani neukládají.
        </p>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8 rounded-r-lg shadow-sm">
        <div className="flex">
          <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-bold text-amber-800">Právní upozornění</h3>
            <p className="text-sm text-amber-700 mt-1">
              Tato kalkulačka poskytuje pouze <strong>orientační a nezávazný výpočet</strong>. 
              Doporučující tabulky nejsou pro soudy závazné. Soud vždy hodnotí celkovou majetkovou 
              situaci, životní úroveň obou rodičů a odůvodněné potřeby dítěte. Kalkulačka nenahrazuje 
              právní poradenství.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">1. Vstupní údaje</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Váš čistý měsíční příjem (Kč)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={netIncome}
              onChange={(e) => setNetIncome(e.target.value)}
              className="w-full sm:w-1/2 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Např. 35000"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Další vyživovací povinnosti
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Např. nová manželka (bez vlastního příjmu) nebo další děti z jiných vztahů, které nezahrnujete do tohoto výpočtu.
            </p>
            <input
              type="number"
              min="0"
              max="10"
              value={otherObligations}
              onChange={(e) => setOtherObligations(parseInt(e.target.value) || 0)}
              className="w-24 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Děti zahrnuté do výpočtu</h3>
              {children.length < 5 && (
                <button
                  onClick={handleAddChild}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full"
                >
                  <Plus className="w-4 h-4" /> Přidat dítě
                </button>
              )}
            </div>

            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={child.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                  {children.length > 1 && (
                    <button
                      onClick={() => handleRemoveChild(child.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-600"
                      title="Odebrat dítě"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Dítě {index + 1}
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Věková kategorie</label>
                      <select
                        value={child.ageGroup}
                        onChange={(e) => updateChild(child.id, { ageGroup: e.target.value as AgeGroup })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="0-5">0 - 5 let (Předškolní)</option>
                        <option value="6-9">6 - 9 let (1. stupeň ZŠ)</option>
                        <option value="10-14">10 - 14 let (2. stupeň ZŠ)</option>
                        <option value="15+">15 a více let (SŠ / VŠ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Počet dní vaší péče (měsíčně)</label>
                      <input
                        type="number"
                        min="0"
                        max="30.4"
                        step="0.5"
                        value={child.careDays}
                        onChange={(e) => updateChild(child.id, { careDays: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <p className="text-xs text-slate-500 mt-1">Průměrný měsíc má 30.4 dní. (Např. běžný víkend = 4 dny, střídavá = 15.2 dní)</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleCalculate}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2"
          >
            Spočítat výživné <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-blue-600 p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Výsledek orientačního výpočtu</h2>
            <div className="text-sm opacity-90">Celkový počet zohledněných vyživovacích povinností: {result.totalObligations}</div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4 mb-8">
              {result.childrenResults.map((cr, idx) => (
                <div key={cr.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Dítě {idx + 1}</h3>
                    <div className="text-sm text-slate-500 flex flex-col gap-1 mt-1">
                      <span>Základní podíl z příjmu: {(cr.basePercentage * 100).toFixed(0)} % ({cr.baseAmount.toLocaleString('cs-CZ')} Kč)</span>
                      {cr.careReduction > 0 && (
                        <span className="text-green-600">Sleva za osobní péči: -{cr.careReduction.toLocaleString('cs-CZ')} Kč</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Výsledná částka</div>
                    <div className="text-3xl font-black text-blue-600">{cr.finalAmount.toLocaleString('cs-CZ')} Kč</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Celkové výživné</h3>
                <p className="text-sm text-slate-500">Součet za všechny zahrnuté děti</p>
              </div>
              <div className="text-4xl font-black text-slate-900">
                {result.totalFinalAmount.toLocaleString('cs-CZ')} Kč
              </div>
            </div>

            {result.controlAmountWarning && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-amber-800 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Upozornění na kontrolní částku:</strong> Vypočtené celkové výživné přesahuje 50 % vašeho čistého příjmu. 
                  Soudy v takových případech zpravidla zkoumají tzv. kontrolní částku a nezabavitelné minimum, aby vám zůstal dostatek 
                  prostředků pro zajištění vlastních základních životních potřeb. Reálná částka stanovená soudem by mohla být nižší.
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-center">
            <button
              onClick={handleReset}
              className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Spočítat znovu
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm text-slate-600">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" /> O metodice výpočtu
        </h3>
        <p className="mb-2">
          Tato kalkulačka využívá pravidla z Doporučujícího materiálu Ministerstva spravedlnosti ČR (verze 2022). 
          Algoritmus zohledňuje:
        </p>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>Celkový počet vyživovacích povinností rodiče (čím více povinností, tím nižší procentní sazba na jedno dítě).</li>
          <li>Věk (životní etapu) dítěte.</li>
          <li>Rozsah osobní péče – vypočtená částka je proporcionálně ponížena podle počtu dní, kdy o dítě pečujete vy.</li>
        </ul>
        <p className="text-xs text-slate-500 border-t border-slate-200 pt-3">
          Zdroj: <a href="https://vyzivne.justice.cz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">vyzivne.justice.cz</a>. 
          Všechny výpočty probíhají bezpečně pouze ve vašem zařízení (offline-first).
        </p>
      </div>
    </div>
  );
};
