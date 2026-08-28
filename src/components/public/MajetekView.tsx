import React, { useState } from 'react';
import {
  Coins,
  Scale,
  Home,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Calculator,
  Clock,
  Sparkles,
  ShieldAlert,
  Layers,
  ChevronRight
} from 'lucide-react';
import { SeoHead } from './SeoHead';

interface MajetekViewProps {
  onNavigate?: (path: string) => void;
}

export const MajetekView: React.FC<MajetekViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'sjm' | 'mortgage' | 'investments' | 'procedure' | 'checklist'>('sjm');

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Finanční a majetkové vypořádání (SJM) při rozvodu • Táta má právo"
        description="Komplexní právní průvodce vypořádáním společného jmění manželů (SJM), řešením hypotéky, vnosů, zápočtů a 3leté zákonné lhůty."
        canonicalPath="/majetek"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Společné jmění manželů (SJM) & Finance</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Finanční a majetkové vypořádání
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed opacity-95">
            Přehledný právní a praktický průvodce rozdělením majetku, řešením hypotéky, 
            investic (vnosů) a závazků podle zákona č. 89/2012 Sb., občanský zákoník.
          </p>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl shadow-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <strong className="font-bold">Právní upozornění:</strong>
          <p className="text-amber-800 leading-relaxed">
            Informace v tomto modulu mají informativní a orientační charakter pro základní právní orientaci. 
            Majetkové vztahy mohou být modifikovány předmanželskou smlouvou nebo zúžením SJM. 
            Pro konkrétní smluvní transakce doporučujeme konzultaci s advokátem nebo notářem.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sjm')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'sjm'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Co je a není SJM</span>
        </button>
        <button
          onClick={() => setActiveTab('mortgage')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'mortgage'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Hypotéka & Dluhy</span>
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'investments'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Vnosy a zápočty</span>
        </button>
        <button
          onClick={() => setActiveTab('procedure')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'procedure'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Postup a 3letá lhůta</span>
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Praktický checklist</span>
        </button>
      </div>

      {/* TAB 1: SJM Rozsah */}
      {activeTab === 'sjm' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Základní rozsah společného jmění manželů (§ 708 a násl. o.z.)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Společné jmění manželů vzniká uzavřením manželství a zaniká jeho právní mocí rozvodu. 
                Základním pravidlem vypořádání je zásada parity (rovnosti podílů obou manželů – 50:50), 
                která však může být modifikována vnosy a specifickými okolnostmi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
                  <Coins className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Co do SJM SPADÁ (§ 709 o.z.)</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Veškeré příjmy a mzdy ze zaměstnání nebo podnikání plynoucí za trvání manželství.</li>
                  <li>Nemovitosti a pozemky pořízené za trvání manželství ze společných prostředků.</li>
                  <li>Vozidla, vybavení domácnosti, elektronika a úspory na bankovních účtech.</li>
                  <li>Výnosy z výlučného majetku (např. nájemné z bytu, který jeden z manželů zdědil).</li>
                  <li>Závazky a úvěry převzaté za trvání manželství (mimo výjimky).</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Scale className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Co je VÝLUČNÝM majetkem (nespadá do SJM)</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Majetek nabytý dědictvím nebo darováním (i za trvání manželství).</li>
                  <li>Věci sloužící osobní potřebě jednoho z manželů (oblečení, osobní šperky).</li>
                  <li>Majetek nabytý jedním z manželů před uzavřením manželství.</li>
                  <li>Náhrada nemajetkové újmy na přirozených právech nebo odškodnění za úraz.</li>
                  <li>Majetek pořízený výhradně z prodeje výlučného majetku (tzv. surogace).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Hypotéka & Dluhy */}
      {activeTab === 'mortgage' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Jak vypořádat společnou hypotéku a úvěry
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hypotéka představuje nejčastější a nejnáročnější bod vypořádání. Je nutné rozlišovat mezi 
                vnitřním vztahem mezi manžely a vnějším vztahem vůči bance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center">1</div>
                <h3 className="font-bold text-slate-900 text-sm">Převzetí nemovitosti a dluhu</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jeden z manželů si ponechá nemovitost, převezme hypotéku a vyplatí druhého manžela z jeho podílu na čisté hodnotě (tzv. equity). 
                  <strong>Pozor:</strong> Banka musí s vyvázáním druhého manžela písemně souhlasit na základě posouzení bonity.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center">2</div>
                <h3 className="font-bold text-slate-900 text-sm">Prodej nemovitosti a doplacení</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nemovitost se prodá třetí osobě na volném trhu za tržní cenu. Z utržených peněz se doplatí zůstatek 
                  hypotéky u banky a zbylý čistý zisk se rozdělí mezi manžele (zpravidla rovným dílem po zohlednění vnosů).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 font-bold text-sm flex items-center justify-center">3</div>
                <h3 className="font-bold text-slate-900 text-sm">Společný pronájem a splácení</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Dočasná varianta: manželé si nemovitost ponechají v podílovém spoluvlastnictví, pronajmou ji 
                  a nájemné pokrývá měsíční splátky hypotéky do doby, než se tržní nebo osobní situace vyjasní.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Riziko dohody bez souhlasu banky:</strong>
                <p className="mt-0.5 leading-relaxed">
                  Pokud se manželé mezi sebou dohodnou, že hypotéku bude platit jen jeden, ale banka druhého manžela 
                  nevyváže ze smlouvy, pro banku zůstávají oba manželé solidárními dlužníky. Pokud jeden přestane platit, 
                  banka bude peníze vymáhat po druhém.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Vnosy a zápočty */}
      {activeTab === 'investments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Vnosy a zápočty: Jak zohlednit vlastní investice (§ 742 o.z.)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Každý z manželů má právo požadovat, aby mu bylo nahrazeno to, co ze svého výlučného majetku 
                vynaložil na společný majetek (vnos do SJM), a naopak je povinen nahradit to, co ze společného majetku 
                bylo vynaloženo na jeho výlučný majetek.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Vnos z výlučného majetku do SJM
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Příklad: Otec před svatbou vlastnil úspory 1 000 000 Kč nebo zdědil finance po rodičích 
                  a použil je na zaplacení akontace rodinného domu v SJM.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                  <strong>Výsledek:</strong> Tuto částku 1 000 000 Kč má otec právo požadovat zpět před rozdělením 
                  zbytku společného majetku. Od roku 2021 se navíc vnos může valorizovat podle růstu hodnoty nemovitosti.
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  Vnos ze SJM do výlučného majetku
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Příklad: Jeden z manželů vlastnil chatu z doby před manželstvím a za trvání manželství se z výplat 
                  obou manželů (ze SJM) zaplatila rekonstrukce chaty za 500 000 Kč.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                  <strong>Výsledek:</strong> Vlastník chaty je povinen vrátit 500 000 Kč do společné majetkové masy, 
                  která se následně rozdělí mezi oba manžele.
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
              <strong className="font-bold">Klíč k úspěšnému uplatnění vnosu:</strong>
              <p className="leading-relaxed">
                Vnosy musíte být schopni jednoznačně prokázat listinnými důkazy (bankovní výpisy, kupní smlouvy, 
                darovací smlouvy, dědická usnesení). Tvrzení bez dokladů soudy zpravidla neuznají.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Postup a 3letá lhůta */}
      {activeTab === 'procedure' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Způsoby vypořádání a 3letá zákonná lhůta (§ 741 o.z.)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Majetkové vypořádání lze provést třemi způsoby. Pozor na tříletou prekluzivní lhůtu od právní moci rozvodu!
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                  A
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">1. Písemná dohoda o vypořádání SJM</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nejrychlejší, nejlevnější a nejméně konfliktní cesta. Manželé se dohodnou na rozdělení všech položek. 
                    Pokud se vypořádávají nemovitosti, dohoda musí mít písemnou formu s ověřenými podpisy a vkladem do katastru nemovitostí.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center shrink-0">
                  B
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">2. Žaloba na vypořádání SJM u soudu</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Pokud se manželé nedohodnou, kterýkoliv z nich může podat žalobu k okresnímu soudu. Soudce provede 
                    dokazování, nařídí znalecké posudky a autoritativně rozhodne. Řízení trvá zpravidla 2 až 4 roky a je zatíženo soudními poplatky a náklady na posudky.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 font-black text-sm flex items-center justify-center shrink-0">
                  C
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-amber-950 text-sm">3. Zákonná fikce po 3 letech (§ 741 o.z.)</h3>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Pokud do 3 let od právní moci rozvodu nedojde k dohodě ani není podána žaloba u soudu, nastupuje zákonná domněnka:
                  </p>
                  <ul className="text-xs text-amber-800 list-disc pl-4 space-y-1 pt-1">
                    <li>Nemovitosti a věci v katastru přecházejí do podílového spoluvlastnictví obou manželů v poměru 1/2 ku 1/2.</li>
                    <li>Movité věci připadnou tomu, kdo je pro svou potřebu nebo rodinu výlučně užívá.</li>
                    <li>Ostatní majetková práva a pohledávky se stávají společnými rovným dílem.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Praktický checklist kroků pro otce
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Strukturovaný postup, jak bezpečně zmapovat a připravit majetkové podklady před jednáním s protistranou nebo soudem.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: '1. Inventura bankovních účtů a úspor ke dni zániku SJM',
                  desc: 'Stáhněte si kompletní výpisy ze všech bankovních účtů, stavebních spoření, penzijních připojištění a investičních účtů.'
                },
                {
                  title: '2. Zajištění listů vlastnictví a nabývacích titulů k nemovitostem',
                  desc: 'Stáhněte aktuální výpis z katastru nemovitostí (LV) a vyhledejte původní kupní smlouvy a hypoteční smlouvy.'
                },
                {
                  title: '3. Zajištění tržního ocenění nemovitosti (Odhad)',
                  desc: 'Nechte zpracovat tržní odhad licencovaným odhadcem nebo realitní kanceláří k určení reálné tržní ceny (equity).'
                },
                {
                  title: '4. Vyčíslení zůstatku úvěrů u banky',
                  desc: 'Požádejte banku o oficiální potvrzení o aktuálním zůstatku jistiny hypotéky a podmínkách vyvázání spoludlužníka.'
                },
                {
                  title: '5. Zmapování a doložení vnosů (předmanželské úspory, dědictví, dary)',
                  desc: 'Připravte darovací smlouvy, dědická usnesení a výpisy převodů dokazující použití vašich výlučných peněz na společný majetek.'
                },
                {
                  title: '6. Písemný návrh narovnání protistraně',
                  desc: 'Zpracujte věcnou tabulku majetku a závazků a navrhněte férové vypořádání dříve, než se spor přenese k drahému soudu.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cross-linking to AI Tools and Calculator */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
        <h3 className="text-base font-black text-slate-900">Propojené nástroje portálu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleNav('/kalkulacka-vyzivneho')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 text-left shadow-2xs transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <Calculator className="w-5 h-5 text-blue-600 mb-2" />
              <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600">Kalkulačka výživného</div>
              <p className="text-[11px] text-slate-500 mt-1">Orientační výpočet podle tabulek Ministerstva spravedlnosti ČR.</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-3">
              <span>Otevřít kalkulačku</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => handleNav('/ai-formulare')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 text-left shadow-2xs transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <FileText className="w-5 h-5 text-indigo-600 mb-2" />
              <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600">AI Generátor podání</div>
              <p className="text-[11px] text-slate-500 mt-1">Příprava vzorových návrhů pro soud a vyjádření s citacemi zákonů.</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 mt-3">
              <span>Přejít k formulářům</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={() => handleNav('/state-laws')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 text-left shadow-2xs transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <Scale className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-600">Zákony & e-Sbírka</div>
              <p className="text-[11px] text-slate-500 mt-1">Plná znění Občanského zákoníku a ZŘS s časovými verzemi.</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-3">
              <span>Zobrazit zákony</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
