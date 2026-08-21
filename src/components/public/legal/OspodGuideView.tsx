import React, { useState } from 'react';
import { ShieldCheck, BookOpen, AlertTriangle, Users, CheckCircle2, Info, Building2, ExternalLink, Printer } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface OspodGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const OspodGuideView: React.FC<OspodGuideViewProps> = ({ onNavigate }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checklist = [
    { id: '1', label: 'Doklady totožnosti (OP, pas)' },
    { id: '2', label: 'Informace o dítěti (režim dne, zájmy, zdraví)' },
    { id: '3', label: 'Škola/školka (kontakt, prospěch, vaše zapojení)' },
    { id: '4', label: 'Zdravotní péče (karta u lékaře, očkování)' },
    { id: '5', label: 'Režim péče (jak se o dítě staráte, váš návrh)' },
    { id: '6', label: 'Bydlení (vlastní lůžko pro dítě, pracovní kout, bezpečí)' },
    { id: '7', label: 'Pracovní situace (flexibilita, příjem)' },
    { id: '8', label: 'Komunikace s druhým rodičem (fakticky doložitelná, bez emocí)' },
    { id: '9', label: 'Relevantní dokumenty (lékařské zprávy, posudky, komunikace školy)' },
  ];

  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Průvodce jednáním s OSPOD a sociálním šetřením"
        description="Jak přistupovat k OSPOD, co čekat od kolizního opatrovníka a jak se připravit na sociální šetření. Průvodce pro otce."
        canonicalPath="/ospod"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Jednání s OSPOD</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Orgán sociálně-právní ochrany dětí
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Role OSPOD, práva a povinnosti rodiče, a jak zvládnout komunikaci a sociální šetření v nejlepším zájmu dítěte.
          </p>
        </div>
      </div>

      {/* Právní disclaimer */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Obsah slouží pouze k informační orientaci a nenahrazuje
          individuální právní poradenství ani zastoupení advokátem. Úkony OSPOD se řídí zákonem č. 359/1999 Sb. 
          a zákonem č. 292/2013 Sb., o zvláštních řízeních soudních.
        </p>
      </div>

      {/* Role OSPOD */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" /> Co je OSPOD a jeho role
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            <strong>Orgán sociálně-právní ochrany dětí (OSPOD)</strong> chrání zájmy nezletilých dětí. V opatrovnickém řízení figuruje 
            zpravidla jako <strong>kolizní opatrovník</strong> dítěte (§ 469 z.ř.s.), protože mezi rodiči existuje konflikt zájmů.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Kolizní opatrovník:</strong> OSPOD nezastupuje matku, ani otce. Zastupuje výhradně <strong>dítě</strong>.</li>
            <li><strong>Zpráva pro soud:</strong> OSPOD podává soudu zprávy o situaci dítěte, rodinných poměrech, a navrhuje řešení (které však není pro soud absolutně závazné, byť je velmi vlivné).</li>
            <li><strong>Práva a povinnosti rodiče:</strong> Máte povinnost s OSPOD spolupracovat, poskytnout informace a umožnit nahlédnutí do obydlí. Máte ale právo na objektivní přístup a vyjádření svého postoje.</li>
          </ul>
        </div>
      </section>

      {/* Příprava a komunikace */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" /> První kontakt a komunikace
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Vztah s pracovníkem OSPOD by měl být vždy formální, slušný a věcný. Emoce odložte stranou.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Příprava:</strong> Mějte vždy jasno v tom, jaké uspořádání péče navrhujete a proč je to pro dítě nejlepší. Doložte své tvrzení fakticky (např. rozvrhem svých směn, dostupností kroužků).</li>
            <li><strong>Komunikace:</strong> Veškerou důležitou komunikaci (návrhy, omluvy z termínů, zásadní informace o druhém rodiči) veďte písemně (e-mail, datová schránka, podatelna).</li>
            <li><strong>Neeskalace:</strong> Zdržte se osočování druhého rodiče. Pokud druhý rodič selhává, popisujte pouze konkrétní fakta a jejich dopad na dítě, nikoli hodnocení jeho povahy.</li>
          </ul>
        </div>
      </section>

      {/* Sociální šetření */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" /> Sociální šetření (Checklist)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pracovník OSPOD přijde zhodnotit bytové a výchovné zázemí pro dítě.
              Dbejte na pravdivost, bezpečí dítěte a vytvoření klidného prostředí. Nevytvářejte falešný obraz domácnosti.
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-md shrink-0"
          >
            <Printer className="w-4 h-4" />
            Vytisknout
          </button>
        </div>
        
        <div className="space-y-3">
          {checklist.map((item) => {
            const isDone = !!checkedItems[item.id];
            return (
              <div 
                key={item.id} 
                onClick={() => toggleCheck(item.id)} 
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'}`}
              >
                <button className="mt-0.5 shrink-0 cursor-pointer text-indigo-400">
                  {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <div className="w-5 h-5 rounded-md border-2 border-slate-500" />}
                </button>
                <span className={`text-sm font-medium ${isDone ? 'line-through opacity-80' : ''}`}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Právní prostředky vůči OSPOD */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Nepřesnosti v záznamech a ochrana práv
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Záznam z jednání nebo sociálního šetření může obsahovat chyby nebo zkreslení. 
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li><strong>Odmítnutí podpisu / výhrady:</strong> Pokud se zápisem nesouhlasíte, máte právo připojit k němu své písemné výhrady (přímo na místě, nebo následně podáním doručeným přes podatelnu).</li>
            <li><strong>Žádost o nápravu:</strong> Lze podat žádost o opravu nepřesností ve spise vedeném OSPOD.</li>
            <li><strong>Podnět/Stížnost:</strong> Pokud pracovník porušuje práva dítěte či vaše, lze podat stížnost vedoucímu oddělení (případně tajemníkovi úřadu, nebo na nadřízený krajský úřad).</li>
            <li><strong>Námitka podjatosti:</strong> Pokud pracovník projevuje zaujatost, máte právo podat námitku podjatosti. <em>(Doporučeno pouze při jasných důkazech, např. prokazatelné přátelství s druhým rodičem, jinak může být vnímáno jako účelová obstrukce.)</em></li>
            <li><strong>Kdy vyhledat advokáta:</strong> Pokud jsou kroky OSPOD zjevně jednostranné, navrhují drakonická omezení vašich rodičovských práv, nebo nereagují na vaše legitimní podněty.</li>
          </ul>
        </div>
      </section>

      {/* Footer zdroje */}
      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400">
        Zdroje: Ministerstvo práce a sociálních věcí (MPSV), Metodiky OSPOD. Aktuálnost ověřena k: Srpen 2026.
      </div>
    </div>
  );
};
