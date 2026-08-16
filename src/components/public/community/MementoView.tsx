import React from 'react';
import { SeoHead } from '../SeoHead';
import {
  AlertCircle,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldAlert,
  Flame,
  Globe,
  Clock,
  Heart
} from 'lucide-react';

interface MementoCase {
  id: string;
  title: string;
  icon: any;
  error: string;
  consequence: string;
  correctAction: string;
  exampleBad: string;
  exampleGood: string;
}

interface MementoViewProps {
  onNavigate: (path: string) => void;
}

export const MementoView: React.FC<MementoViewProps> = ({ onNavigate }) => {
  const cases: MementoCase[] = [
    {
      id: 'case-1',
      title: 'Případ 1: Noční výčitky a SMS plné vzteku v 1:00 ráno',
      icon: Flame,
      error: 'Odpověď na provokaci matky pod vlivem emocí a zmatku u piva nebo v noci. Psaní nočních SMS, výčitek z minulosti či vyhrůžek.',
      consequence: 'Matka zprávy znechuceně vytiskne a založí do soudního spisu. OSPOD i opatrovnický soudce vyhodnotí otce jako "agresivního, emociálně nestabilního a potenciálně nebezpečného".',
      correctAction: 'Zásada BIFF (Stručně, Informativně, Slušně, Rázně) a Pravidlo 24h. Při vzteku mobil odložte, dojděte se vynechat a odpovězte v klidu až druhý den.',
      exampleBad: '❌ "Jsi neskutečná sebecká potvora, zničila jsi mi život, u soudu tě zničím a o malýho přijdeš!"',
      exampleGood: '✅ "Dobrý den. Rozumím tvému stanovisku. Navrhuji předání syna v pátek v 16:00 tak, jak platí dohoda. Přeji hezký den."',
    },
    {
      id: 'case-2',
      title: 'Případ 2: Ustupování pro "klid v rodině" na začátku rozchodu',
      icon: Clock,
      error: 'Přistoupení na "dočasné" víkendové návštěvy 1x za 14 dní v naději, že matka časem obměkne a styk povolí.',
      consequence: 'Vytvoření faktického stavu (status quo). Matka po 6 měsících u soudu řekne: "Dítě je zvyklé žít se mnou, otec se vídal jen o víkendu a střídavá péče by byla pro dítě traumatizujícím zásahem."',
      correctAction: 'Od 1. dne rozchodu jasně trvejte na rovnocenné péči. Podejte návrh na úpravu péče na soud bez jakéhokoliv zbytečného odkladu.',
      exampleBad: '❌ "Tak já tedy na pár měsíců ustoupím a budu jezdit jen v neděli odpoledne, abychom se nehádali..."',
      exampleGood: '✅ "Považuji za klíčové pro psychický vývoj dítěte, abychom se o péči delili rovnocenně od samého počátku. Podávám návrh na střídavou péči."',
    },
    {
      id: 'case-3',
      title: 'Případ 3: Boj o dítě jako skrytá pomsta partnerce',
      icon: Heart,
      error: 'Podávání desítek návrhů na pokuty, udávání matky na OSPOD za drobnosti, neustálá kritika její domácnosti a výchovy.',
      consequence: 'Soudní znalec i soudce označí otce za člověka neschopného sebereflexe, zaměřeného na válku s bývalou partnerkou na úkor duševního zdraví dítěte.',
      correctAction: 'Veškeré podání i kroky formulujte VÝHRADNĚ s ohledem na potřeby a zájem DÍTĚTE, nikoliv boj s bývalou partnerkou.',
      exampleBad: '❌ "Odmítám, aby matka dávala dítěti nezdravá jídla, trvám na tom, aby jí OSPOD uložil pokutu!"',
      exampleGood: '✅ "Záleží mi na zdravém životním stylu syna. Rád se zapojím do vaření a zajistím mu sportovní kroužky během dnů v mé péči."',
    },
    {
      id: 'case-4',
      title: 'Případ 4: Zveřejňování spisu a útoky na sociálních sítích',
      icon: Globe,
      error: 'Psaní rozhořčených příspěvků na Facebooku, zveřejňování fotek soudních rozsudků, rodných čísel či jmen pracovnic OSPOD.',
      consequence: 'Porušení práv dítěte na soukromí, vysoká pokuta od ÚOOÚ, zásadní ztráta důvěryhodnosti u soudu a možné trestní stíhání pro pomluvu.',
      correctAction: 'Přísná diskrétnost. Záležitosti se řeší v soudní síni a v poradenském kruhu, nikoli na veřejném internetu.',
      exampleBad: '❌ "Podívejte se všichni na FB, co ta nekompetentní úřednice OSPODu Nováková z Prahy zase napsala za blábol!"',
      exampleGood: '✅ "(Zachování diskrétnosti) Své výhrady k metodice OSPOD uplatním kvalifikovaným písemným vyjádřením do soudního spisu."',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Memento (Procesní chyby otců) • Táta má právo"
        description="Rozbor 4 nejčastějších osudových chyb otců u opatrovnického soudu a návod, jak jim předejít."
        canonicalPath="/memento"
      />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => onNavigate('/krizova-pomoc')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na rozcestník Krizové pomoci</span>
        </button>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <AlertCircle className="w-5 h-5" />
            <span>Prevence rizik • Poučení z chyb</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Memento: 4 osudové procesní chyby otců u soudu
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Přečtěte si nejčastější chyby, kterými otcové v emociálním vypětí neúmyslně poškozují svou pozici u opatrovnického soudu, a zjistěte, jak reagovat správně.
          </p>
        </div>
      </div>

      {/* Cases List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {cases.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                    {c.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {c.error}
                  </p>
                </div>
              </div>

              {/* Consequence Box */}
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-950 space-y-1">
                <strong className="text-xs font-black uppercase tracking-wider text-red-800 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Procesní následek u soudu a OSPOD:</span>
                </strong>
                <p className="text-xs leading-relaxed">{c.consequence}</p>
              </div>

              {/* Bad vs Good Example */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black text-rose-600 uppercase block">Častá špatná reakce</span>
                  <p className="text-xs text-slate-700 italic">{c.exampleBad}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-black text-emerald-700 uppercase block">Správný BIFF postup</span>
                  <p className="text-xs text-emerald-950 font-medium">{c.exampleGood}</p>
                </div>
              </div>

              {/* Correct Action Box */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-1">
                <strong className="text-xs font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Správný postup a stratégia:</span>
                </strong>
                <p className="text-xs leading-relaxed">{c.correctAction}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
