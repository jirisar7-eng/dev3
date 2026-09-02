import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Scale,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Info,
  CalendarDays,
  ShieldAlert,
  BookOpen
} from 'lucide-react';
import { SeoHead } from './SeoHead';

interface KalendarLhutViewProps {
  onNavigate?: (path: string) => void;
}

interface ProcessDeadline {
  id: string;
  title: string;
  legalBase: string;
  typicalDuration: string;
  description: string;
  practicalAdvice: string;
  urgency: 'high' | 'medium' | 'standard';
}

const STATUTORY_DEADLINES: ProcessDeadline[] = [
  {
    id: 'odvolani',
    title: 'Lhůta pro podání odvolání proti rozsudku',
    legalBase: '§ 204 odst. 1 Občanského soudního řádu (OSŘ)',
    typicalDuration: '15 dnů od doručení písemného vyhotovení rozsudku',
    description:
      'Odvolání je řádný opravný prostředek. Lhůta běží každému účastníkovi samostatně ode dne následujícího po doručení (např. do datové schránky nebo převzetím doporučeného dopisu).',
    practicalAdvice:
      'Lhůta je zachována, je-li poslední den lhůty podání odevzdáno soudu nebo podáno k poštovní / datové přepravě. Připadne-li konec lhůty na sobotu, neděli nebo svátek, je posledním dnem nejblíže následující pracovní den.',
    urgency: 'high'
  },
  {
    id: 'predbezne-opatreni',
    title: 'Lhůta soudu pro rozhodnutí o běžném předběžném opatření (péče/styk)',
    legalBase: '§ 457 a násl. Zákona o zvláštních řízeních soudních (Z.ř.s.)',
    typicalDuration: 'Do 7 dnů od podání návrhu',
    description:
      'U návrhů na předběžnou úpravu poměrů dítěte (např. úprava styku či prozatímní péče) má soud zákonnou lhůtu 7 dnů pro vydání usnesení bez nařízení jednání.',
    practicalAdvice:
      'U zvlášť naléhavých situací bezprostředního ohrožení života/zdraví (§ 452 Z.ř.s.) rozhoduje soud do 24 hodin na návrh OSPOD.',
    urgency: 'high'
  },
  {
    id: 'odvolani-usneseni-po',
    title: 'Odvolání proti usnesení o předběžném opatření',
    legalBase: '§ 204 odst. 1 OSŘ',
    typicalDuration: '15 dnů od doručení usnesení',
    description:
      'Proti usnesení o předběžném opatření lze podat odvolání. Pozor: Odvolání nemá odkladný účinek (§ 463 Z.ř.s.), usnesení je předběžně vykonatelné doručením nebo vyhlášením.',
    practicalAdvice:
      'Pokud bylo předběžné opatření nařízeno, musíte se jím řídit ihned, i když podáváte odvolání.',
    urgency: 'high'
  },
  {
    id: 'vyjadreni-k-navrhu',
    title: 'Lhůta pro vyjádření k návrhu protistrany (soudní výzva)',
    legalBase: 'Stanovuje soud individuálně usnesením / výzvou dle OSŘ',
    typicalDuration: 'Zpravidla 10 až 30 dnů dle určení soudu',
    description:
      'Soud zasílá návrh druhého rodiče s výzvou k písemnému vyjádření a označení důkazů.',
    practicalAdvice:
      'Pokud nemůžete z objektivních důvodů lhůtu stihnout (např. pracovní neschopnost, vyhledání advokáta), včas požádejte soud písemně o prodloužení lhůty s uvedením důvodů.',
    urgency: 'medium'
  },
  {
    id: 'dovolani',
    title: 'Lhůta pro dovolání k Nejvyššímu soudu ČR',
    legalBase: '§ 240 odst. 1 OSŘ',
    typicalDuration: '2 měsíce od doručení rozhodnutí odvolacího (krajského) soudu',
    description:
      'Mimořádný opravný prostředek. Pozor: V opatrovnických věcech péče o nezletilé je přípustnost dovolání zákonem významně omezena (§ 30 Z.ř.s. vylučuje dovolání ve věcech osvojení a úpravy poměrů dětí vyjma specifických otázek).',
    practicalAdvice:
      'Při podání dovolání musíte být ze zákona povinně zastoupeni advokátem.',
    urgency: 'medium'
  },
  {
    id: 'ustavni-stiznost',
    title: 'Lhůta pro podání ústavní stížnosti k Ústavnímu soudu ČR',
    legalBase: '§ 72 odst. 3 Zákona o Ústavním soudu (č. 182/1993 Sb.)',
    typicalDuration: '2 měsíce od doručení rozhodnutí o posledním procesním prostředku',
    description:
      'Ústavní stížnost lze podat po vyčerpání všech procesních prostředků k ochraně práva (pravomocné rozhodnutí krajského soudu o odvolání, případně po rozhodnutí o dovolání).',
    practicalAdvice:
      'Povinné zastoupení advokátem na základě speciální plné moci pro Ústavní soud. Lhůtu 2 měsíců nelze prominout.',
    urgency: 'high'
  }
];

export const KalendarLhutView: React.FC<KalendarLhutViewProps> = ({ onNavigate }) => {
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const filteredDeadlines = STATUTORY_DEADLINES.filter((d) => {
    const matchesUrgency = selectedUrgency === 'all' || d.urgency === selectedUrgency;
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.legalBase.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesUrgency && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Procesní lhůty a kalendář opatrovnického řízení • Táta má právo"
        description="Přehled klíčových zákonných procesních lhůt v opatrovnickém řízení: odvolání, předběžná opatření, vyjádření a ústavní stížnosti dle OSŘ a Z.ř.s."
        canonicalPath="/kalendar"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <CalendarDays className="w-3.5 h-3.5 text-blue-300" />
            <span>Zákonné procesní termíny a pravidla jejich počítání</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Průvodce procesními lhůtami opatrovnického řízení
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed opacity-95">
            Zmeškání procesní lhůty může mít nevratné právní následky (např. nabytí právní moci rozsudku). 
            Zde naleznete přehled klíčových zákonných lhůt podle Občanského soudního řádu (OSŘ) a Zákona o zvláštních řízeních soudních (Z.ř.s.).
          </p>
        </div>
      </div>

      {/* Rules of computation box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-black text-lg">
          <Clock className="w-5 h-5 text-blue-900" />
          <h2>Základní pravidla počítání procesního času (§ 57 OSŘ)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">1. Počátek běhu lhůty</strong>
            <p className="text-slate-600 leading-relaxed">
              Do běhu lhůty určené podle dnů se nezapočítává den, kdy došlo ke skutečnosti určující její začátek (den doručení písemnosti). Lhůta začíná běžet až následující den.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">2. Konec lhůty o víkendu / svátku</strong>
            <p className="text-slate-600 leading-relaxed">
              Připadne-li konec lhůty na sobotu, neděli nebo svátek, je posledním dnem lhůty nejblíže následující pracovní den (např. pondělí).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">3. Zachování lhůty odesláním</strong>
            <p className="text-slate-600 leading-relaxed">
              Lhůta je zachována, je-li podání v poslední den lhůty odevzdáno soudu nebo odesláno prostřednictvím držitele poštovní licence či datové schránky do 23:59:59.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and List of Deadlines */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Katalog zákonných procesních lhůt</h2>
            <p className="text-xs text-slate-600">Vyhledejte konkrétní typ řízení a procesního úkonu</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filtrovat lhůty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredDeadlines.map((deadline) => (
            <div
              key={deadline.id}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 transition-all hover:border-slate-300 hover:shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                  {deadline.title}
                </h3>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs shrink-0 self-start sm:self-auto">
                  ⏱️ {deadline.typicalDuration}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Právní základ: <strong>{deadline.legalBase}</strong></span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                {deadline.description}
              </p>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong className="block font-bold">💡 Praktické doporučení:</strong>
                <p className="leading-relaxed text-[11px]">{deadline.practicalAdvice}</p>
              </div>
            </div>
          ))}

          {filteredDeadlines.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              Nenalezena žádná lhůta odpovídající zadanému výrazu.
            </div>
          )}
        </div>
      </div>

      {/* Link to Private MyCase Calendar if Authenticated or Info */}
      <div className="p-6 rounded-3xl bg-blue-900 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-bold">Potřebujete hlídat termíny vašeho konkrétního spisu?</h3>
          <p className="text-xs text-blue-200">
            V klientské zóně Můj případ naleznete interaktivní kalendář střídání péče, termíny soudních jednání a upomínky.
          </p>
        </div>
        <button
          onClick={() => handleNav('/muj-pripad')}
          className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <span>Otevřít Osobní spis</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Statutory & Legal Disclaimer */}
      <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Důležité právní upozornění:</strong> Uvedené informace mají výhradně informativní charakter a shrnují obecné procesní lhůty platné v právním řádu České republiky. 
          V individuálních soudních řízeních mohou být soudem stanoveny odlišné lhůty (např. soudcovské lhůty k vyjádření). Pro posouzení konkrétní procesní situace doporučujeme konzultaci s advokátem.
        </p>
      </div>
    </div>
  );
};
