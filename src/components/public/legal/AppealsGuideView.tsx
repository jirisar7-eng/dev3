import React from 'react';
import { AlertTriangle, BookOpen, Scale, ArrowUpRight, ShieldAlert, Gavel } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface AppealsGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const AppealsGuideView: React.FC<AppealsGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Odvolání a opravné prostředky v opatrovnictví"
        description="Průvodce opravnými prostředky: Odvolání, Dovolání a Ústavní stížnost. Kdy a jak se bránit proti rozhodnutí soudu o dítěti."
        canonicalPath="/opravne-prostredky"
      />

      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <Scale className="w-4 h-4 text-indigo-400" />
            <span>Opravné prostředky</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Odvolání a <br className="hidden sm:block" /> další kroky
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Nejste spokojeni s prvostupňovým rozhodnutím? Průvodce možnostmi, jak se bránit u krajského soudu, Nejvyššího soudu a Ústavního soudu.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Obsah má pouze informační charakter. U opravných prostředků <strong>záleží kriticky na procesních lhůtách</strong>. Nikdy tyto kroky nepodnikejte bez konzultace s advokátem, můžete nevratně ztratit svá práva.
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-indigo-600" /> 1. Odvolání
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Odvolání je řádný opravný prostředek proti nepravomocnému rozsudku nebo usnesení okresního soudu. Směřuje ke krajskému soudu, ale podává se prostřednictvím soudu okresního, který rozhodnutí vydal.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Lhůty:</strong> Lhůta k podání odvolání činí obvykle <strong>15 dnů</strong> od doručení písemného vyhotovení rozhodnutí (§ 204 o.s.ř.). <em>Upozornění: Vždy se řiďte písemným poučením na konci konkrétního rozhodnutí.</em></li>
            <li><strong>Co musí obsahovat:</strong> Kromě běžných náležitostí (kdo podává, proti čemu, podpis) musí odvolání přesně vymezit, v jakém rozsahu rozhodnutí napadáte a v čem spatřujete pochybení soudu (tzv. odvolací důvod). Např. neúplné zjištění skutkového stavu nebo nesprávné právní posouzení.</li>
            <li><strong>Důkazy:</strong> V nesporných opatrovnických řízeních (péče o nezletilé) lze obvykle uvést nové skutečnosti a navrhnout nové důkazy, které nebyly uplatněny před soudem prvního stupně.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Gavel className="w-5 h-5 text-indigo-600" /> 2. Dovolání (Nejvyšší soud)
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Dovolání je mimořádný opravný prostředek. Směřuje proti pravomocnému rozhodnutí odvolacího soudu, a podává se k Nejvyššímu soudu ČR.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Nejde o automatický krok:</strong> Nelze se dovolat jen proto, že "nesouhlasíte". Dovolání musí splňovat přísné formální a věcné podmínky (např. otázka zásadního právního významu, která dosud nebyla řešena, nebo je řešena rozdílně).</li>
              <li><strong>Povinné zastoupení:</strong> U dovolání musíte být <strong>povinně zastoupeni advokátem</strong>, jinak ho soud odmítne. Lhůta jsou obvykle 2 měsíce.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-600" /> 3. Ústavní stížnost (Ústavní soud)
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Ústavní stížnost se podává k Ústavnímu soudu, pokud tvrdíte, že pravomocným rozhodnutím bylo <strong>porušeno vaše základní lidské právo nebo svoboda</strong> (např. právo na rodinný život, právo na spravedlivý proces).
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Předchozí prostředky:</strong> Lze ji podat až po vyčerpání všech procesních prostředků, které vám zákon k ochraně práva poskytuje.</li>
            <li><strong>Lhůta:</strong> Lhůta činí obvykle 2 měsíce od doručení rozhodnutí o posledním procesním prostředku.</li>
            <li><strong>Povinné zastoupení:</strong> I zde musíte být <strong>povinně zastoupeni advokátem</strong> na základě speciální plné moci. Zastoupení konzultujte včas.</li>
          </ul>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Zákon č. 99/1963 Sb. (občanský soudní řád), Zákon č. 182/1993 Sb. (o Ústavním soudu), Listina základních práv a svobod, Ústava ČR. Informace z Ministerstva spravedlnosti a Ústavního soudu ČR. Aktuálnost ověřena k: Srpen 2026. Nepodávejte opravné prostředky svévolně bez konzultace, zejména pak Dovolání a Ústavní stížnost, pro které je ze zákona povinné advokátní zastoupení.
      </div>
    </div>
  );
};
