import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import { 
  Users, Calendar, Clock, CheckCircle2, ShieldCheck, 
  ArrowRight, FileText, Sparkles, Scale, HeartHandshake, 
  Layers, Download, AlertCircle, Info, ChevronRight, BookOpen, Compass
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CareHubPublicLandingViewProps {
  onNavigate?: (path: string) => void;
}

export const CareHubPublicLandingView: React.FC<CareHubPublicLandingViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // Interactive Care Ratio Calculator State
  const [selectedModel, setSelectedModel] = useState<'7-7' | '2-2-3' | '2-2-5-5' | 'extended'>('7-7');
  const [customDaysFather, setCustomDaysFather] = useState<number>(14);

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  const handleCtaClick = () => {
    if (currentUser) {
      navigateTo('/pece');
    } else {
      navigateTo('/login');
    }
  };

  // Model statistics calculation
  const getModelStats = () => {
    switch (selectedModel) {
      case '7-7':
        return {
          fatherDays: 14,
          motherDays: 14,
          fatherPercent: 50,
          motherPercent: 50,
          ageSuitability: '6 – 18 let (školní věk a dospívající)',
          handoversPerMonth: 4,
          description: 'Klasické střídání po týdnech se střídáním v pondělí ráno přímo ve škole či školce. Minimalizuje kontakt rodičů a poskytuje dítěti ucelený týdenní režim bez stěhování uprostřed školního týdne.',
          advantages: ['Nejmenší počet předání v měsíci (pouze 4x)', 'Předání ve škole eliminuje konflikty rodičů', 'Dítě má klid na školní přípravu na jednom místě'],
        };
      case '2-2-3':
        return {
          fatherDays: 14,
          motherDays: 14,
          fatherPercent: 50,
          motherPercent: 50,
          ageSuitability: '1 – 6 let (batolata a předškoláci)',
          handoversPerMonth: 10,
          description: 'Rotující dvoutýdenní cyklus (Po-Út táta, St-Čt máma, Pá-Ne táta; další týden obráceně). Zabraňuje dlouhému odloučení od kteréhokoliv z rodičů u dětí, které ještě nemají plně vyvinutý pojem o čase.',
          advantages: ['Maximální doba odloučení od rodiče je 2–3 dny', 'Vhodné pro citlivou adaptaci batolat', 'Rovnoměrné střídání víkendů'],
        };
      case '2-2-5-5':
        return {
          fatherDays: 14,
          motherDays: 14,
          fatherPercent: 50,
          motherPercent: 50,
          ageSuitability: '4 – 15 let (předškoláci a 1. stupeň ZŠ)',
          handoversPerMonth: 8,
          description: 'Pevné dny v týdnu: Pondělí a úterý vždy u jednoho rodiče, středa a čtvrtek vždy u druhého rodiče, víkendy (pátek až neděle) se střídají.',
          advantages: ['Předvídatelný týdenní rytmus pro kroužky a práci', 'Rodič má vždy stejné dny v týdnu pro své aktivity', 'Snadné plánování dlouhodobých zájmů dítěte'],
        };
      case 'extended':
        return {
          fatherDays: 10,
          motherDays: 18,
          fatherPercent: 36,
          motherPercent: 64,
          ageSuitability: 'Při větší vzdálenosti bydlišť nebo směnném provozu',
          handoversPerMonth: 4,
          description: 'Rozšířený styk zahrnující prodloužené víkendy (čtvrtek odpoledne až pondělí ráno) plus jedno odpoledne či přespání uprostřed týdne.',
          advantages: ['Umožňuje aktivní účast na školním životě dítěte', 'Vhodné při větší vzdálenosti bydlišť rodičů', 'Zachovává silnou vazbu na oba rodiče'],
        };
    }
  };

  const currentStats = getModelStats();

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <SeoHead
        title="Péče o dítě & Rodičovský plán (Care Hub) • Táta má právo"
        description="Komplexní metodický průvodce péčí o dítě, modely střídavé péče (2-2-3, 7-7, 2-2-5-5), kalkulačka rozvrhu, checklist předávání a tvorba rodičovského plánu pro soud."
        canonicalPath="/pece"
      />

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl text-white p-8 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Metodické centrum péče o dítě
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Rodičovský plán & spravedlivá péče o dítě
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Písemný rodičovský plán je nejúčinnějším nástrojem prevence konfliktů po rozchodu. 
            Definuje jasná pravidla střídání, prázdnin, financí i školních povinností a moderní 
            opatrovnické soudy jej považují za základní důkaz rodičovské zralosti.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={handleCtaClick}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{currentUser ? 'Přejít do Care Hubu' : 'Vytvořit plán v aplikaci'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('/kalkulacka-vyzivneho')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-blue-400" />
              <span>Kalkulačka výživného</span>
            </button>
          </div>
        </div>
      </div>

      {/* PROČ JE RODIČOVSKÝ PLÁN KLÍČOVÝ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">1. Právní jistota u soudu</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Soudy preferují dohodu rodičů. Pokud soudu předložíte detailní a funkční plán péče 
            zohledňující věk dítěte, výrazně zvyšujete šanci na bezproblémové schválení střídavé či společné péče.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">2. Klid a stabilita pro dítě</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dítě potřebuje vědět, kde bude spát a kdo ho vyzvedne ze školy. Předvídatelný harmonogram 
            odstraňuje úzkost ze stěhování a umožňuje dítěti zachovat si bezpečný vztah s oběma rodiči.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">3. Eliminace třecích ploch</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Plán přesně určuje rozdělení svátků, jarních i letních prázdnin, úhradu kroužků a postup 
            při nemoci dítěte, čímž předchází každoročním hádkám o termíny.
          </p>
        </div>
      </div>

      {/* INTERAKTIVNÍ SROVNÁNÍ MODELŮ PÉČE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-blue-600" />
            Srovnání nejčastějších modelů střídavé péče
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Zvolte model péče a prozkoumejte jeho vhodnost podle věku dítěte, frekvenci předávání a praktické výhody.
          </p>
        </div>

        {/* Přepínače modelů */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: '7-7', label: 'Týden / Týden (7-7)', tag: 'Zlatý standard' },
            { id: '2-2-3', label: 'Model 2-2-3', tag: 'Pro batolata' },
            { id: '2-2-5-5', label: 'Model 2-2-5-5', tag: 'Pevné dny' },
            { id: 'extended', label: 'Rozšířená péče', tag: 'Větší vzdálenost' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id as any)}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                selectedModel === m.id
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80 text-slate-700'
              }`}
            >
              <div className="text-xs font-semibold text-blue-600 mb-0.5">{m.tag}</div>
              <div className="text-sm font-bold text-slate-900">{m.label}</div>
            </button>
          ))}
        </div>

        {/* Detail vybraného modelu */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg mb-2">
                Doporučený věk dítěte: {currentStats.ageSuitability}
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedModel === '7-7' && 'Model 7 dní / 7 dní (střídání v pondělí ráno)'}
                {selectedModel === '2-2-3' && 'Model 2-2-3 (rotující krátké intervaly)'}
                {selectedModel === '2-2-5-5' && 'Model 2-2-5-5 (pevné dny v týdnu)'}
                {selectedModel === 'extended' && 'Model rozšířeného styku a asymetrické péče'}
              </h3>
            </div>
            <div className="flex items-center gap-6 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-center">
                <div className="text-xs text-slate-500 font-semibold uppercase">Péče otce</div>
                <div className="text-2xl font-black text-blue-600">{currentStats.fatherPercent} %</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center">
                <div className="text-xs text-slate-500 font-semibold uppercase">Péče matky</div>
                <div className="text-2xl font-black text-slate-700">{currentStats.motherPercent} %</div>
              </div>
            </div>
          </div>

          <p className="text-slate-700 text-sm leading-relaxed">
            {currentStats.description}
          </p>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hlavní praktické výhody tohoto modelu:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentStats.advantages.map((adv, i) => (
                <div key={i} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-200/80 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* METODIKA ADAPTACE & HLADKÉHO PŘEDÁVÁNÍ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          Metodika adaptace dítěte a zásady předávání
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
            <h3 className="font-bold text-indigo-950 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Zlaté pravidlo: Předávání přes školu / školku
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Nejšetrnější formou předání dítěte je předání v instituci (školka, škola, kroužek). 
              Rodič A dítě ráno dovede do školy a rodič B jej odpoledne vyzvedne. Tím zcela odpadá 
              stresující loučení před očima druhého rodiče a riziko slovních konfliktů.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-4">
            <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Dvě plnohodnotná zázemí
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed">
              Dítě by v obou domácnostech mělo mít vlastní postel, psací stůl, základní oblečení, 
              hygienické potřeby a pyžamo. Dítě se nemá cítit jako „návštěva s kufrem“, ale jako doma 
              u obou svých rodičů.
            </p>
          </div>
        </div>
      </div>

      {/* CHECKLIST PŘEDÁVÁNÍ DÍTĚTE */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Checklist pro bezproblémové předání dítěte</h2>
            <p className="text-sm text-slate-400 mt-1">Co si zkontrolovat před každým předáním mezi rodiči</p>
          </div>
          <span className="px-3.5 py-1.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold rounded-full w-fit">
            Doporučení odborníků
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="font-bold text-blue-400 text-sm">1. Zdravotní pomůcky & léky</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Průkaz pojištěnce, pravidelně užívané léky s rozpisem dávkování, očkovací průkaz, brýle či rovnátka.
            </p>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="font-bold text-blue-400 text-sm">2. Škola & domácí úkoly</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Školní aktovka, sešity na pondělní úkoly, čip na obědy, informace o plánovaných písemkách a třídních akcích.
            </p>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="font-bold text-blue-400 text-sm">3. Sport & zájmové kroužky</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Tréninkové vybavení, dres, hudební nástroj, rozvrh mimoškolních aktivit a kontakt na trenéra či vedoucího.
            </p>
          </div>
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="font-bold text-blue-400 text-sm">4. Citová kotva & komfort</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Oblíbená plyšová hračka, knížka na dobrou noc, nebo předmět, který dítěti pomáhá s usínáním v obou domovech.
            </p>
          </div>
        </div>
      </div>

      {/* CO NABÍZÍ DIGITÁLNÍ CARE HUB V APLIKACI */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Co získáte v plné verzi Care Hubu
          </h2>
          <p className="text-sm text-slate-600">
            V naší bezplatné privátní zóně máte k dispozici profesionální digitální nástroje pro správu plánu péče.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h3 className="font-bold text-slate-900">Interaktivní kalendář péče</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generování rozvrhu na rok dopředu, podpora střídání sudý/lichý týden, státní svátky a export do Google Kalendáře.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h3 className="font-bold text-slate-900">Generátor dohody pro soud</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automatický export hotového rodičovského plánu do PDF a Wordu s právními formulacemi akceptovanými opatrovnickými soudy.
            </p>
          </div>
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
            <Clock className="w-8 h-8 text-emerald-600" />
            <h3 className="font-bold text-slate-900">Deník předávání & Lhůty</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zaznamenávání přesných časů předání, evidence zpoždění či omluvenek pro případné doložení OSPODu.
            </p>
          </div>
        </div>

        <div className="pt-4 text-center">
          <button
            onClick={handleCtaClick}
            className="px-8 py-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-black text-base shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3 cursor-pointer"
          >
            <span>{currentUser ? 'Otevřít můj Care Hub' : 'Zaregistrovat se a vytvořit plán péče zdarma'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
