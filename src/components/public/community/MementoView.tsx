import React from 'react';
import { SeoHead } from '../SeoHead';
import { 
  ArrowLeft, 
  MessageSquare, 
  Clock, 
  Users, 
  Building, 
  Scale, 
  FileText, 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';

interface MementoViewProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

interface MementoSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  problem: string;
  risk: string;
  whatNotToDo: string;
  whatToDoInstead: string;
  nextStepLabel: string;
  nextStepUrl: string;
}

const sections: MementoSection[] = [
  {
    id: 'komunikace',
    title: 'Komunikace v konfliktu',
    icon: MessageSquare,
    description: 'Během vyhroceného sporu je snadné podlehnout emocím. Každá zpráva však může být přečtena dalšími osobami a může ovlivnit celkové vnímání situace.',
    problem: 'Zasílání emotivních, dlouhých nebo obviňujících zpráv (SMS, e-maily), často ve večerních nebo nočních hodinách.',
    risk: 'Dlouhé a emotivní zprávy mohou působit útočně a mohou zkomplikovat budoucí dohodu. Mohou být v konkrétní situaci zohledněny jako neochota ke konstruktivní komunikaci.',
    whatNotToDo: 'Nereagujte okamžitě pod vlivem emocí. Nepište výčitky, urážky ani rozsáhlé analýzy minulosti.',
    whatToDoInstead: 'Odpovídejte s odstupem (např. po 24 hodinách). Buďte struční, věcní a zaměřte se výhradně na potřeby dítěte (metoda BIFF).',
    nextStepLabel: 'Jak funguje metoda BIFF',
    nextStepUrl: '/komunikace-biff'
  },
  {
    id: 'prvni-dny',
    title: 'První dny po rozchodu',
    icon: Clock,
    description: 'Začátek odloučení často určuje další dynamiku rodiny. Unáhlená rozhodnutí nebo snaha o "klid za každou cenu" mohou ztížit pozdější úpravy.',
    problem: 'Impulzivní odsouhlasení nevýhodných podmínek nebo absence jakékoliv struktury a dokumentace skutečné péče.',
    risk: 'Faktický stav (status quo) může mít váhu pro posuzování stability prostředí dítěte. Nejistota a nepředvídatelnost mohou zbytečně zvyšovat napětí.',
    whatNotToDo: 'Neuzavírejte nevýhodné dohody pouze z touhy vyhnout se sporu a nespoléhejte jen na ústní sliby.',
    whatToDoInstead: 'Snažte se od začátku o stabilní a předvídatelné uspořádání. Zaznamenávejte si, kdy a jak péče probíhá, a dbejte na potřebu jistoty pro dítě. Respektujte, že neexistuje jediná univerzální forma péče.',
    nextStepLabel: 'Sestavení SOS Plánu',
    nextStepUrl: '/sos-plan'
  },
  {
    id: 'konflikt',
    title: 'Konflikt místo rodičovství',
    icon: Users,
    description: 'Někdy se pozornost nechtěně přesune z dítěte na boj s druhým rodičem, což dítěti dlouhodobě neprospívá.',
    problem: 'Osobní útoky, používání dítěte jako prostředníka pro vyřizování vzkazů nebo řešení dospělých sporů před dítětem.',
    risk: 'Zapojování dítěte do konfliktu dospělých může vést k jeho psychické zátěži a může být vnímáno jako neschopnost oddělit rovinu partnerskou od rodičovské.',
    whatNotToDo: 'Nekritizujte druhého rodiče před dítětem, nevyslýchejte ho a nepoužívejte ho k předávání zpráv.',
    whatToDoInstead: 'Soustřeďte se na řešení konkrétních problémů péče. Před dítětem udržujte neutrální postoj a dbejte na jeho emoční bezpečí.',
    nextStepLabel: 'Krizová pomoc a podpora',
    nextStepUrl: '/krizova-pomoc'
  },
  {
    id: 'ospod',
    title: 'OSPOD a instituce',
    icon: Building,
    description: 'Pracovníci OSPOD hájí zájmy dítěte, nikoliv zájmy jednotlivých rodičů. Přístup k nim by měl být vždy věcný.',
    problem: 'Podávání opakovaných podnětů bez jasných důkazů za účelem tlaku na druhého rodiče, nebo zahlcování instituce vlastními emocemi.',
    risk: 'Nepodložené podněty nebo vyhraněně nepřátelský tón mohou ztížit efektivní spolupráci a mohou působit jako snaha zneužít instituci k osobnímu boji.',
    whatNotToDo: 'Nepodsouvejte úřadům konkrétní závěry, nevyžadujte okamžité sankce pro druhého rodiče za drobnosti.',
    whatToDoInstead: 'Předkládejte věcné a přehledné informace. Jasně rozlišujte mezi faktem, vlastním pozorováním a domněnkou.',
    nextStepLabel: 'Právní poradna a instituce',
    nextStepUrl: '/pravni-poradna'
  },
  {
    id: 'soud',
    title: 'Soud a proces',
    icon: Scale,
    description: 'Soudní řízení vyžaduje chronologii, fakta a prokazatelnost. Emoce a nepodložená obvinění v rozhodování nepomáhají.',
    problem: 'Zahlcování soudu nesouvislými dokumenty, zveličování drobných chyb nebo manipulace s důkazy k očernění druhého rodiče.',
    risk: 'Nepřehledná nebo manipulativní podání mohou znevěrohodnit i oprávněné argumenty. Záleží na okolnostech případu, ale soud se primárně řídí prokázanými fakty a zájmem dítěte.',
    whatNotToDo: 'Neodbočujte od tématu dítěte k historickým partnerským křivdám. Nepřehánějte a neupravujte si realitu.',
    whatToDoInstead: 'Udržujte přehlednou dokumentaci a chronologii událostí. Upozorňujte pouze na to podstatné, co má přímý vliv na výchovu a vývoj dítěte.',
    nextStepLabel: 'Můj případ a podání (Právní poradna)',
    nextStepUrl: '/pravni-poradna'
  },
  {
    id: 'dukazy',
    title: 'Důkazy a dokumentace',
    icon: FileText,
    description: 'Správná dokumentace neslouží k "usvědčení" druhého rodiče, ale k prokázání reálného stavu péče o dítě.',
    problem: 'Záznamy vedené formou osobního deníku plného nadávek, nebo naopak chybějící záznamy o dohodách a harmonogramu předávání.',
    risk: 'Emocionálně zabarvené poznámky ztrácejí vypovídací hodnotu a mohou ukazovat na zaujatost spíše než na objektivní situaci.',
    whatNotToDo: 'Nespojujte záznamy faktů se svými domněnkami a nevytvářejte z nich nástroj pomsty.',
    whatToDoInstead: 'Zaznamenávejte údaje fakticky (čas, místo, událost). Oddělujte fakta od interpretace a dbejte na ochranu osobních údajů.',
    nextStepLabel: 'Tipy pro vedení dokumentace',
    nextStepUrl: '/pravni-poradna'
  },
  {
    id: 'site',
    title: 'Sociální sítě a soukromí',
    icon: Globe,
    description: 'Internet nezapomíná. Sdílení detailů z opatrovnických řízení je rizikové pro všechny zúčastněné.',
    problem: 'Zveřejňování osobních údajů dítěte, částí soudních spisů nebo identifikujících údajů pracovníků a druhého rodiče na sociálních sítích.',
    risk: 'Porušení soukromí může mít právní dohru a může zásadně narušit vaši důvěryhodnost. Veřejné zostuzování navíc dítěti zprostředkovaně velmi ubližuje.',
    whatNotToDo: 'Neřešte rodinné spory veřejně, konflikty se nesmí řešit veřejným zostuzováním.',
    whatToDoInstead: 'Zachovejte maximální diskrétnost. Záležitosti dítěte řešte v kruhu odborníků, vždy bez veřejného sdílení citlivých údajů.',
    nextStepLabel: 'Zpět na bezpečný rozcestník',
    nextStepUrl: '/krizova-pomoc'
  }
];

export const MementoView: React.FC<MementoViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Memento otců (Prevence konfliktů) • Táta má právo"
        description="Preventivní a vzdělávací centrum: jak se vyhnout chybám, které mohou zbytečně zhoršit rodičovský konflikt."
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

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/3 -translate-y-1/3 opacity-50" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider mb-3">
              <ShieldCheck className="w-5 h-5" />
              <span>Vzdělávací centrum prevence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
              Memento otců
            </h1>
            <div className="text-sm text-slate-600 max-w-3xl space-y-3 font-medium">
              <p>
                Jak se vyhnout chybám, které mohou zbytečně zhoršit rodičovský konflikt? 
                Cílem tohoto průvodce <strong>není strašit</strong>, ale pomoci vám zastavit eskalaci 
                a jednat s rozmyslem i v nejnáročnějších situacích.
              </p>
              <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Informace zde uvedené slouží výhradně jako <strong>obecné vzdělávací doporučení</strong>. 
                  Soudy a úřady rozhodují vždy na základě individuálních okolností konkrétního případu a dostupných důkazů.
                  Neexistuje univerzální postup, který by garantoval výsledek. V případě potřeby doporučujeme 
                  vyhledat kvalifikovanou právní radu a ověřit aktuální právní stav.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6 transition-all hover:shadow-md"
            >
              {/* Section Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold border border-indigo-100">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
                    {section.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Grid: Problem & Risk vs Solutions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                
                {/* Left Column: Problem & Risk */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-2">
                    <strong className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-slate-500" />
                      <span>Častý problém</span>
                    </strong>
                    <p className="text-sm text-slate-800 font-medium">
                      {section.problem}
                    </p>
                  </div>
                  
                  <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50 space-y-2">
                    <strong className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-amber-600" />
                      <span>Možné riziko</span>
                    </strong>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {section.risk}
                    </p>
                  </div>
                </div>

                {/* Right Column: What Not To Do & What To Do */}
                <div className="space-y-4">
                  <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100 space-y-2 h-full flex flex-col justify-center">
                    <strong className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>Co nedělat</span>
                    </strong>
                    <p className="text-sm text-rose-950">
                      {section.whatNotToDo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Width Bottom: What to do instead & Call to Action */}
              <div className="bg-emerald-50/80 rounded-2xl p-5 border border-emerald-200 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="space-y-2 flex-1">
                  <strong className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Co udělat místo toho</span>
                  </strong>
                  <p className="text-sm text-emerald-950 font-medium leading-relaxed">
                    {section.whatToDoInstead}
                  </p>
                </div>
                
                <button
                  onClick={() => onNavigate(section.nextStepUrl)}
                  className="shrink-0 bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <span>{section.nextStepLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
