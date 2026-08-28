import React, { useState } from 'react';
import { Gavel, Scale, FileText, CheckCircle2, AlertTriangle, ChevronRight, Clock, Users, ArrowRight, BrainCircuit, CheckSquare, Square, Calculator, Link as LinkIcon, Download, BookOpen } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface CourtGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const CourtGuideView: React.FC<CourtGuideViewProps> = ({ onNavigate }) => {
  const [activeAccordion, setActiveAccordion] = useState<string | null>('krok-1');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checklist = [
    { id: 'c1', label: 'Zkontrolovat datum, čas a číslo jednací síně na předvolání' },
    { id: 'c2', label: 'Platný občanský průkaz (bez něj vás soudkyně nevyslechne)' },
    { id: 'c3', label: 'Chronologie událostí a návrh řešení (stručný, jasný)' },
    { id: 'c4', label: 'Návrhy důkazů (vytištěné e-maily, lékařské zprávy ve trojím vyhotovení - soud, OSPOD, matka)' },
    { id: 'c5', label: 'Důležité otázky na druhého rodiče či svědky' },
    { id: 'c6', label: 'Základní přehled: Kdo se staral, jak, kdy, kdo platil, zdravotní/školní potřeby' },
    { id: 'c7', label: 'Doklad o výdělku (pokud se řeší výživné)' },
    { id: 'c8', label: 'Psací potřeby a blok na poznámky' },
  ];

  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Průvodce opatrovnickým soudem krok za krokem"
        description="Praktický průvodce soudním řízením o péči a výživném pro rodiče. Jak se připravit, jak vystupovat a jak funguje dokazování."
        canonicalPath="/soud"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <Gavel className="w-4 h-4 text-indigo-400" />
            <span>Soudní řízení</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Opatrovnický soud<br className="hidden sm:block" /> krok za krokem
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Co čekat od opatrovnického soudu, jak probíhá dokazování a jak se chovat v jednací síni. Orientace pro rodiče, kteří usilují o péči o dítě.
          </p>
        </div>
      </div>

      {/* Legal & AI Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p>
            <strong>Právní upozornění:</strong> Obsah slouží pouze k informační orientaci a nenahrazuje individuální právní poradenství ani zastoupení advokátem. Každé řízení je vysoce individuální.
          </p>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-200 flex gap-3 text-xs text-indigo-900">
          <BrainCircuit className="w-5 h-5 text-indigo-600 shrink-0" />
          <p>
            <strong>AI asistence:</strong> AI nástroje (např. shrnutí dokumentů) mohou obsahovat chyby. AI negarantuje výsledek soudu a nenahrazuje advokáta. Důležité právní informace vždy ověřujte v předpisech.
          </p>
        </div>
      </div>

      {/* Jak to probíhá (Timeline) */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" /> Průběh opatrovnického řízení
        </h2>
        <p className="text-sm text-slate-600 mb-8">
          Řízení o péči o nezletilé děti a výživném je specifické (tzv. nesporné řízení). Typický průběh může vypadat takto:
        </p>

        <div className="space-y-4">
          {/* Krok 1 */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setActiveAccordion(activeAccordion === 'krok-1' ? null : 'krok-1')}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">1</span>
                <span className="font-bold text-slate-900 text-left">Zahájení řízení a první kroky</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeAccordion === 'krok-1' ? 'rotate-90' : ''}`} />
            </button>
            {activeAccordion === 'krok-1' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 text-sm text-slate-700 space-y-3">
                <p>Opatrovnické řízení může začít na návrh jednoho z rodičů (např. návrh na úpravu péče) nebo z moci úřední (pokud soud nebo OSPOD zjistí ohrožení dítěte).</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Podání návrhu:</strong> Musí obsahovat komu se navrhuje dítě svěřit do péče a jaké má být výživné.</li>
                  <li><strong>Role soudu:</strong> Má povinnost zjistit skutečný stav (zjistit, co je v nejlepším zájmu dítěte).</li>
                  <li><strong>Role OSPOD:</strong> Soud ustanoví OSPOD jako kolizního opatrovníka dítěte. Ten provede šetření a podá zprávu soudu.</li>
                </ul>
              </div>
            )}
          </div>

          {/* Krok 2 */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setActiveAccordion(activeAccordion === 'krok-2' ? null : 'krok-2')}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">2</span>
                <span className="font-bold text-slate-900 text-left">Příprava a dokazování</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeAccordion === 'krok-2' ? 'rotate-90' : ''}`} />
            </button>
            {activeAccordion === 'krok-2' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 text-sm text-slate-700 space-y-3">
                <p>Následuje fáze shromažďování důkazů, která probíhá často před i během samotného ústního jednání.</p>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <strong>Vysvětlení pojmů dokazování:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><strong>Listinné důkazy:</strong> E-maily, potvrzení o příjmu, výpisy z účtu, lékařské zprávy, školní posudky. (Nejsilnější a nejčastější).</li>
                    <li><strong>Výslech účastníků (Rodičů):</strong> Jste vyslýcháni vy i druhý rodič. Musíte mluvit pravdu. Důležité je rozlišovat mezi "co se stalo" (Fakt) a "co si myslím, že se stalo" (Domněnka).</li>
                    <li><strong>Svědci:</strong> Příbuzní, noví partneři, sousedé. (Soud k nim přistupuje kriticky, jelikož bývají na straně jednoho rodiče).</li>
                    <li><strong>Znalecké posudky:</strong> Pokud je situace složitá a je třeba zkoumat psychologii rodičů či dítěte. Zabírá to měsíce a je to nákladné.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Krok 3 */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setActiveAccordion(activeAccordion === 'krok-3' ? null : 'krok-3')}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">3</span>
                <span className="font-bold text-slate-900 text-left">Ústní jednání</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeAccordion === 'krok-3' ? 'rotate-90' : ''}`} />
            </button>
            {activeAccordion === 'krok-3' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 text-sm text-slate-700 space-y-3">
                <p>Na samotné soudní jednání dostanete předvolání (nebo váš advokát). Obyčejně trvá 1–3 hodiny, případně se nařídí více jednání.</p>
                <p>Probíhá výslech, OSPOD přednese návrh a provádějí se listinné důkazy k přečtení.</p>
                <div className="mt-3 flex gap-2">
                  <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded">TIP: Pokud máte advokáta, drtivou většinu práce obstará on. Vy odpovídáte jen na to, na co jste tázáni.</span>
                </div>
              </div>
            )}
          </div>

          {/* Krok 4 */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setActiveAccordion(activeAccordion === 'krok-4' ? null : 'krok-4')}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">4</span>
                <span className="font-bold text-slate-900 text-left">Rozhodnutí a Odvolání</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${activeAccordion === 'krok-4' ? 'rotate-90' : ''}`} />
            </button>
            {activeAccordion === 'krok-4' && (
              <div className="px-6 py-4 bg-white border-t border-slate-200 text-sm text-slate-700 space-y-3">
                <p>Soudce po provedení důkazů vyhlásí <strong>rozsudek</strong> (ve věci samé) nebo <strong>usnesení</strong> (časté pro předběžná opatření).</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Právní moc:</strong> Doba, kdy rozhodnutí "definitivně platí" a nelze se proti němu běžně bránit. Bývá to 15 dnů od doručení písemného vyhotovení (pokud není podáno odvolání).</li>
                  <li><strong>Vykonatelnost:</strong> U některých rozsudků (např. běžné výživné) vzniká vykonatelnost až nabytím právní moci. Ale např. <em>předběžné opatření</em> je vykonatelné už svým doručením (nebo vyhlášením).</li>
                  <li><strong>Odvolání:</strong> Proti nepravomocnému rozhodnutí se lze ve stanovené lhůtě odvolat k nadřízenému krajskému soudu. Tady vždy doporučujeme sepsat odvolání s advokátem – velmi záleží na lhůtách a právní argumentaci.</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Checklist Přípravy a Chování */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Příprava na jednání
          </h2>
          <div className="space-y-3">
            {checklist.map((item) => {
              const isDone = !!checkedItems[item.id];
              return (
                <div 
                  key={item.id} 
                  onClick={() => toggleCheck(item.id)} 
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'}`}
                >
                  <button className="mt-0.5 shrink-0 text-indigo-400">
                    {isDone ? <CheckSquare className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-400" />}
                  </button>
                  <span className={`text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Jak vystupovat u soudu
            </h2>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Mluvte věcně a s úctou</strong>
                  K soudu (soudci/soudkyni) mluvte jako ke "Slavnému soudu". Nemluvte bez vyzvání. Nikdy soudce nepřerušujte.
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Neútočte na druhého rodiče</strong>
                  Soustřeďte se výhradně na dítě. Místo "Ona je šílená" použijte objektivní fakt: "Matka nepředala dítě v těchto 3 konkrétních termínech, což dítě stresovalo."
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Stručné odpovědi a neznámé otázky</strong>
                  Na otázky odpovídejte k věci. Nerozvíjejte historky z před pěti let. Pokud otázce nerozumíte nebo si nejste jisti, požádejte o vysvětlení nebo řekněte "Nevzpomínám si". Nehadejte.
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Poznámky a emoce</strong>
                  Když mluví druhý rodič a nesouhlasíte, neklepejte si na čelo, nevzdychtejte. Dělejte si poznámky na papír a jakmile dostanete slovo, vraťte se k nepřesnostem logicky a v klidu.
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 italic">Tyto zásady nejsou manipulativní triky, ale základy slušného a věcného procesu.</span>
          </div>
        </section>
      </div>

      {/* Propojené nástroje */}
      <section className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-indigo-600" /> Nástroje a generátory podání
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {onNavigate && (
            <>
              {/* Vzory podání */}
              <button 
                onClick={() => onNavigate('/ai-formulare')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
              >
                <FileText className="w-6 h-6 text-indigo-600 mb-3" />
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">AI Formuláře</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Předpřipravené vzory: Návrh na úpravu péče (střídavá), návrh na předběžné opatření, žádost o nahlédnutí do spisu.
                </p>
              </button>

              {/* Kalkulačka výživného */}
              <button 
                onClick={() => onNavigate('/kalkulacka-vyzivneho')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group"
              >
                <Calculator className="w-6 h-6 text-emerald-600 mb-3" />
                <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Kalkulačka výživného</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Orientační výpočet podle tabulek MS ČR. Výsledek je pouze orientační a nepředstavuje rozhodnutí soudu.
                </p>
              </button>

              {/* Spolurodičovský Hub */}
              <button 
                onClick={() => onNavigate('/coparent-hub')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
              >
                <Users className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Spolurodičovský Hub</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Elektronická evidence výdajů na dítě, plán péče a komunikační záznamník jako silný listinný důkaz pro soud.
                </p>
              </button>

              {/* Judikatura ÚS */}
              <button 
                onClick={() => onNavigate('/judikatura')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group"
              >
                <Scale className="w-6 h-6 text-indigo-600 mb-3" />
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Judikatura ÚS</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Klíčové nálezy Ústavního soudu k rovné péči, kritériím a přespávání dětí u otce.
                </p>
              </button>

              {/* Kvíz soudního řízení */}
              <button 
                onClick={() => onNavigate('/kvizy')}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all text-left group"
              >
                <BookOpen className="w-6 h-6 text-purple-600 mb-3" />
                <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Kvízy & Trenažéry</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Otestujte si orientaci v procesních pravidlech opatrovnického soudu a předběžných opatřeních.
                </p>
              </button>
            </>
          )}
        </div>
      </section>

      {/* Footer zdroje */}
      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Zákon č. 89/2012 Sb. (občanský zákoník), Zákon č. 99/1963 Sb. (občanský soudní řád), Ministerstvo spravedlnosti ČR. Aktuálnost ověřena k: Srpen 2026. 
        Mějte na paměti, že opatrovnická judikatura Ústavního soudu (např. k rovnoměrné péči) se neustále vyvíjí a je dobré ji s advokátem pro váš konkrétní případ sledovat.
      </div>
    </div>
  );
};
