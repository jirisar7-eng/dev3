import React, { useState, useEffect } from 'react';
import { SeoHead } from './SeoHead';
import { 
  Users, Calendar, Clock, CheckCircle2, ShieldCheck, 
  ArrowRight, FileText, Sparkles, Scale, HeartHandshake, 
  Layers, AlertCircle, Info, BookOpen, Compass,
  Printer, ArrowLeft, AlertTriangle, GraduationCap, Stethoscope, Baby, Heart, Shield, MessageSquare,
  Brain, ExternalLink, School, HelpCircle, CheckSquare, Square
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CareHubPublicLandingViewProps {
  onNavigate?: (path: string) => void;
}

export const CareHubPublicLandingView: React.FC<CareHubPublicLandingViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  
  // Interactive Care Ratio Calculator State
  const [selectedModel, setSelectedModel] = useState<'7-7' | '2-2-3' | '2-2-5-5' | 'extended'>('7-7');

  // Interactive Checklist State in LocalStorage
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('pece_public_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('pece_public_checklist', JSON.stringify(checklist));
    } catch {
      // Ignore storage error
    }
  }, [checklist]);

  const toggleCheckitem = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
      navigateTo('/portal/pece');
    } else {
      navigateTo('/login');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
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

  const checklistItems = [
    { id: 'check_1', text: 'Vím, kdy dítě naposledy jedlo a pilo.' },
    { id: 'check_2', text: 'Vím, kdy dítě naposledy spalo a jaký mělo denní rytmus.' },
    { id: 'check_3', text: 'Mám přesné informace o případně užívaných lécích a dávkování.' },
    { id: 'check_4', text: 'Mám sbalené potřebné věci (oblečení, hračka, zdravotní průkaz, škola).' },
    { id: 'check_5', text: 'Předání proběhlo klidně a bez řešení konfliktů před dítětem.' },
    { id: 'check_6', text: 'Důležité zdravotní a organizační informace jsem předal/a druhému rodiči.' },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <SeoHead
        title="Péče o novorozence a malé děti • Care Hub • Táta má právo"
        description="Praktický průvodce péčí, předáváním dítěte a spoluprací rodičů. Edukační metodika pro novorozence, kojence, předškoláky a školní děti, modely péče, praktický checklist a zdroje."
        canonicalPath="/pece"
      />

      {/* TOP NAV & PRINT BAR */}
      <div className="flex items-center justify-between gap-4 print:hidden border-b border-slate-200 pb-4">
        <button
          onClick={() => navigateTo('/psychologie')}
          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Zpět na Moje dítě</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Vytisknout tuto stránku nebo uložit do PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Vytisknout / PDF</span>
        </button>
      </div>

      {/* ODBORNÉ A ETICKÉ VYMEZENÍ */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-2xl shadow-2xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <strong className="font-extrabold text-amber-950">Odborné a etické vymezení:</strong>
          <p className="text-amber-800 leading-relaxed">
            Tato stránka poskytuje obecné informační a vzdělávací informace. Nenahrazuje individuální zdravotní péči, psychologickou pomoc ani právní zastoupení. Potřeby každého dítěte jsou individuální. Pokud jde o akutní ohrožení zdraví nebo bezpečí dítěte, kontaktujte příslušnou odbornou službu. Stránka neposkytuje diagnózu, neposuzuje psychický stav dítěte ani rodiče a neurčuje, který rodič je „lepší“.
          </p>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl text-white p-8 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Metodické centrum péče o dítě
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Péče o novorozence a malé děti
          </h1>
          <p className="text-lg sm:text-xl text-blue-200 font-semibold">
            Praktický průvodce péčí, předáváním dítěte a spoluprací rodičů
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Péče o malé dítě se mění podle jeho věku, zdravotního stavu, potřeb a rodinné situace. Tato stránka nabízí praktické informace pro rodiče, kteří chtějí nastavit péči předvídatelně a s ohledem na potřeby dítěte. Nejde o univerzální návod ani právní doporučení.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 print:hidden">
            <button
              onClick={handleCtaClick}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{currentUser ? 'Otevřít můj Care Hub' : 'Chci vytvořit vlastní rodičovský plán'}</span>
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

      {/* RYCHLÁ ORIENTACE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 print:hidden">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-blue-600" /> Rychlá orientace na stránce:
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'sec-bezpeci', label: '🛡 Bezpečí', bg: 'hover:bg-slate-100' },
            { id: 'sec-novorozenec', label: '🍼 Novorozenec (0–1 rok)', bg: 'hover:bg-rose-50 hover:text-rose-700' },
            { id: 'sec-nastaveni', label: '👨👩👧 Jak nastavit péči', bg: 'hover:bg-blue-50 hover:text-blue-700' },
            { id: 'sec-predavani', label: '🔄 Předávání', bg: 'hover:bg-indigo-50 hover:text-indigo-700' },
            { id: 'sec-psychika', label: '🧠 Psychika dítěte', bg: 'hover:bg-purple-50 hover:text-purple-700' },
            { id: 'sec-zdravi', label: '🏥 Zdraví a nemoc', bg: 'hover:bg-emerald-50 hover:text-emerald-700' },
            { id: 'sec-skolka', label: '🏫 Školka a režim', bg: 'hover:bg-amber-50 hover:text-amber-700' },
            { id: 'sec-plan', label: '📋 Rodičovský plán', bg: 'hover:bg-slate-100' },
            { id: 'sec-vek', label: '👶 Podle věku', bg: 'hover:bg-slate-100' },
            { id: 'sec-checklist', label: '✅ Checklist', bg: 'hover:bg-slate-100' },
            { id: 'sec-odbornik', label: '🤝 Odborná pomoc', bg: 'hover:bg-slate-100' },
            { id: 'sec-zdroje', label: '📚 Zdroje & Výzkumy', bg: 'hover:bg-slate-100' },
          ].map((nav) => (
            <button
              key={nav.id}
              onClick={() => scrollToSection(nav.id)}
              className={`px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer ${nav.bg}`}
            >
              {nav.label}
            </button>
          ))}
        </div>
      </div>

      {/* PROČ JE BEZPEČÍ A PLÁN KLÍČOVÝ */}
      <div id="sec-bezpeci" className="grid grid-cols-1 md:grid-cols-3 gap-6 scroll-mt-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">1. Právní jistota a dohoda</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Soudy i OSPOD preferují dohodu rodičů. Pokud soudu předložíte detailní a funkční plán péče zohledňující věk dítěte, výrazně zvyšujete šanci na bezproblémové schválení péče bez zbytečných opatrovnických sporů.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">2. Klid a stabilita pro dítě</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dítě potřebuje vědět, kdo o něj pečuje a jaký má denní rytmus. Předvídatelný harmonogram odstraňuje úzkost a umožňuje dítěti zachovat si bezpečný vztah s oběma rodiči.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">3. Eliminace třecích ploch</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Jasná pravidla předávání informací o zdraví, krmení, spánku, kroužcích a školce předcházejí každodenním nedorozuměním a zbytečným konfrontacím mezi rodiči.
          </p>
        </div>
      </div>

      {/* NOVOROZENEC: PRVNÍ TÝDNY (0–1 ROK) */}
      <div id="sec-novorozenec" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold uppercase">
            <Baby className="w-4 h-4 text-rose-600" />
            <span>Novorozenec a kojenec (0–1 rok)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            🍼 Novorozenec: první týdny a měsíce
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Vývoj v prvním roce života vyžaduje citlivý a flexibilní přístup. Níže uvedená doporučení mají orientační charakter; konkrétní uspořádání je vhodné zohlednit podle potřeb dítěte a po konzultaci s odborníkem (pediatrem, dětským psychologem).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Bezpečné prostředí dítěte</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kojenci a novorozenci si vytvářejí citovou vazbu (attachment) prostřednictvím předvídatelné a citlivé péče. Může být vhodné, aby dítě zažívalo klidné a bezpečné reakce od obou rodičů bez přítomnosti napětí či konfliktu dospělých.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Baby className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Krmení a výživa</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Je vhodné respektovat výživové potřeby dítěte (kojení, odsáté mateřské mléko v lahvičce, umělá výživa či příkrmy). Vzájemná dohoda rodičů pomáhá předcházet tlaku na kojící matku i vyčleňování otce z každodenní péče.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Spánek a denní rytmus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pravidelné spánkové rituály při ukládání a usínání v přítomnosti otce posilují pocit bezpečí. Podle odborných výzkumů (Warshak 2014, Fabricius & Suh 2017) může postupně nastavená večerní a noční péče otce přispívat k bezpečné vazbě bez narušení stability dítěte.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Heart className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Hygiena, chování a kontakt</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Přebalování, koupání, stimulace smyslů, nošení a chování na rukou jsou přirozenou součástí budování vztahu. Aktivní zapojení otce od prvních týdnů posiluje jeho rodičovskou jistotu i pocit důvěry dítěte.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Předávání a adaptace</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              U nejmenších dětí může být vhodné začínat častějšími, ale kratšími úseky péče a rozsah péče postupně rozšiřovat podle reakcí a věku dítěte. Předávání by mělo probíhat v klidné atmosféře bez spěchu.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Sdílení informací</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sdílení praktických informací o časech krmení, spánku, stolici, teplotách nebo prořezávání zubů pomáhá udržet kontinuitu péče a zajišťuje, že se dítě v obou domovech cítí bezpečně a pohodlně.
            </p>
          </div>
        </div>

        {/* PRAKTICKÝ BOX PŘEDÁVÁNÍ U KOJENCE */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-blue-950 text-sm flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600" />
            Při předání malého dítěte si mohou rodiče předat:
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-900">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Kdy dítě naposledy jedlo a pilo</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Kdy naposledy spalo a jak dlouho</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Zda užívalo předepsané léky či kapky</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Zda se objevily neobvyklé potíže (teplota, pláč)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Co dítě aktuálně potřebuje (pleny, oblečení)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Důležité informace od pediatra</span>
            </li>
          </ul>
        </div>
      </div>

      {/* JAK NASTAVIT PÉČI */}
      <div id="sec-nastaveni" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Kritéria rozhodování</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            👨👩👧 Jak nastavit péči o dítě
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Při nastavování péče je zásadní rozlišovat mezi <strong>potřebami dítěte</strong>, <strong>přáními rodičů</strong> a <strong>právním uspořádáním</strong>. Nejlepší rozvrh je ten, který odpovídá realitě dítěte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-extrabold uppercase text-blue-600">1. Hledisko dítěte</span>
            <h3 className="font-bold text-slate-900 text-sm">Potřeby dítěte</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Věk, vývojová fáze, citová vazba k oběma rodičům, spánkové rituály, dosavadní způsob péče, zdravotní stav a potřeba pocitu bezpečí.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-extrabold uppercase text-indigo-600">2. Hledisko rodičů</span>
            <h3 className="font-bold text-slate-900 text-sm">Možnosti rodičů</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pracovní doba, směnnost, vzdálenost bydlišť, schopnost vzájemné komunikace a předávání informací bez zbytečných konfliktů.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-extrabold uppercase text-purple-600">3. Právní rámec</span>
            <h3 className="font-bold text-slate-900 text-sm">Rozhodnutí & Dohoda</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dohoda schválená soudem nebo rozsudek o péči. Právní úprava poskytuje rámec, ale každodenní praxi tvoří rodiče společně.
            </p>
          </div>
        </div>

        {/* NEUTRÁLNÍ UPOZORNĚNÍ */}
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-300 text-xs text-slate-700 italic leading-relaxed">
          «Model péče není vhodné vybírat pouze podle věku dítěte. Stejný režim nemusí být vhodný pro každé dítě. Při neshodě rodičů může být vhodné konzultovat konkrétní situaci s odborníkem (dětský psycholog, mediátor) nebo právním zástupcem.»
        </div>
      </div>

      {/* MODELY PÉČE (INTERAKTIVNÍ TABY) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-blue-600" />
            Příklady modelů střídavé a společné péče
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Níže uvedené modely slouží jako <strong>příklady možného uspořádání péče</strong>, nikoli jako automaticky univerzální řešení pro každé dítě. Každý model je třeba přizpůsobit konkrétním okolnostem a věku.
          </p>
        </div>

        {/* Přepínače modelů */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
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
                Orientační věk dítěte: {currentStats.ageSuitability}
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

      {/* PŘEDÁVÁNÍ DÍTĚTE */}
      <div id="sec-predavani" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            🔄 Předávání dítěte a komunikace
          </h2>
          <p className="text-sm text-slate-600">
            Předávání dítěte by mělo probíhat předvídatelně, věcně a bez přítomnosti konfliktů.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <h3 className="font-extrabold text-indigo-950 text-sm">1. Informace</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Zdravotní stav, užívané léky, jídlo, spánek, škola/školka, plánované kroužky a mimořádné události.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <h3 className="font-extrabold text-blue-950 text-sm">2. Věci a výbava</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Oblečení podle počasí, léky, zdravotní pomůcky (brýle, rovnátka), oblíbená hračka, školní aktovka a učebnice.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <h3 className="font-extrabold text-purple-950 text-sm">3. Komunikace</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              Stručně, věcně, bez výčitek a zásadně bez zapojování dítěte do sporů dospělých.
            </p>
          </div>
        </div>

        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl text-xs font-bold text-rose-950">
          «Předávání dítěte není vhodný okamžik pro řešení partnerského konfliktu.»
        </div>
      </div>

      {/* PSYCHICKÁ POHODA DÍTĚTE */}
      <div id="sec-psychika" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-extrabold uppercase">
            <Brain className="w-4 h-4 text-purple-600" />
            <span>Emoční stabilita</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            🧠 Psychická pohoda dítěte
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dítě potřebuje cítit, že má právo mít rádo obou rodičů bez pocitu viny či loajality k jednomu z nich.
          </p>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <li className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>Dítě nesmí být používáno jako prostředník pro předávání vzkazů ani peněz.</span>
          </li>
          <li className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>Nevyžadovat po dítěti volbu strany ani vyzvídání na poměry v druhé domácnosti.</span>
          </li>
          <li className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>Nepředávat dítěti informace o soudních sporech a partnerských konfliktech.</span>
          </li>
          <li className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>Zachovávat běžné uklidňovací rituály a všímat si dlouhodobých změn v chování.</span>
          </li>
        </ul>

        <div className="pt-2 print:hidden">
          <button
            onClick={() => navigateTo('/psychologie')}
            className="px-5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Chci lépe rozumět psychice dítěte → Psychologický vývoj & Emoce</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
          </button>
        </div>
      </div>

      {/* ZDRAVÍ A NEMOC */}
      <div id="sec-zdravi" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>Zdravotní péče</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            🏥 Zdraví a nemoc dítěte
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Oba rodiče mají právo na kompletní informace o zdravotním stavu dítěte a povinnost si je vzájemně neprodleně sdělovat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="font-bold text-slate-900 block">Informovanost a dokumentace:</strong>
            <p>Oba rodiče mají mít přístup k očkovacímu průkazu, průkazu pojištěnce, kontaktům na pediatra a zprávám ze specialistů.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <strong className="font-bold text-slate-900 block">Péče v době nemoci:</strong>
            <p>Při běžném onemocnění (teplota, rýma) se rodiče předem dohodnou na podávání léků, návštěvě lékaře a případném OČR.</p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
          «Zdravotní informace na této stránce nenahrazují pokyny lékaře ani zdravotnické služby.»
        </div>

        <div className="pt-2 print:hidden">
          <button
            onClick={() => navigateTo('/zdravotni-pece')}
            className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Lékařská péče, OČR & Dokumentace</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      </div>

      {/* ŠKOLKA A REŽIM */}
      <div id="sec-skolka" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase">
            <School className="w-4 h-4 text-amber-600" />
            <span>Předškolní a školní režim</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            🏫 Školka a každodenní režim
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Docházka do školky či školy vyžaduje úzkou koordinaci obou rodičů ohledně omluvenek, kroužků a vyzvedávání.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-slate-900 block">Vyzvedávání & Docházka</strong>
            <p>Oba rodiče jsou zapsáni v evidenčním listu školky jako osoby oprávněné kzvedávání dítěte.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-slate-900 block">Školní informace</strong>
            <p>Oba rodiče mají mít přístup k elektronické žákovské knížce, aplikacím školky a pozvánkám na besídky.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-slate-900 block">Kroužky a oblečení</strong>
            <p>Kroužky se plánují po vzájemné dohodě, náhradní oblečení se doplňuje průběžně do skříňky.</p>
          </div>
        </div>

        <div className="pt-2 print:hidden">
          <button
            onClick={() => navigateTo('/skola')}
            className="px-5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Škola, školka & Informovanost rodiče</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
          </button>
        </div>
      </div>

      {/* RODIČOVSKÝ PLÁN (PŘÍKLAD TABULKY) */}
      <div id="sec-plan" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            📋 Rodičovský plán — Příklady otázek k dohodě
          </h2>
          <p className="text-sm text-slate-600">
            Příklady otázek, které je vhodné v rodičovském plánu vyřešit.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-900 border-b border-slate-200">
                <th className="p-3 font-extrabold w-1/3">Oblast péče</th>
                <th className="p-3 font-extrabold">Klíčová otázka k ujasnění mezi rodiči</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              <tr>
                <td className="p-3 font-bold bg-slate-50">Běžná péče</td>
                <td className="p-3">Kdo a kdy o dítě běžně pečuje během týdne a víkendu?</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-slate-50">Předávání</td>
                <td className="p-3">Kde, v kolik hodin a jakým způsobem předávání probíhá (předání ve školce vs. doma)?</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-slate-50">Nemoc</td>
                <td className="p-3">Jak si rodiče neprodleně předají informace o teplotě, lécích a OČR?</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-slate-50">Lékař</td>
                <td className="p-3">Kdo informuje druhého rodiče o termínech preventivních prohlídek a očkování?</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-slate-50">Školka / Škola</td>
                <td className="p-3">Jak se sdílejí přístupy do školních aplikací a omlouvání docházky?</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-slate-50">Svátky a prázdniny</td>
                <td className="p-3">Jak se střídají Vánoce, Velikonoce, jarní a letní prázdniny?</td>
              </tr>
              <tr>
                <td className="p-3 font-bold bg-slate-50">Mimořádné situace</td>
                <td className="p-3">Jakým způsobem se rodiče kontaktují v případě úrazu či náhlé hospitalizace?</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-xs text-slate-500 italic">
          «Příklad pro orientaci — nejde o závazný právní vzor.»
        </div>
      </div>

      {/* PÉČE PODLE VĚKU DÍTĚTE */}
      <div id="sec-vek" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Baby className="w-7 h-7 text-indigo-600" />
            👶 Doporučení podle věku dítěte
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Potřeby dítěte se s věkem výrazně proměňují. Formulace mají orientační charakter; vhodnost se může lišit u každého dítěte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-lg inline-block">0–3 roky</span>
            <h3 className="font-bold text-slate-900 text-sm">Batolecí věk</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Může být užitečné zachovávat kratší intervaly bez rodiče.</li>
              <li>Důraz na bezpečí, krmení, spánek a stálost prostředí.</li>
              <li>Postupné zvykání na večerní a noční péči otce.</li>
            </ul>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-extrabold text-xs rounded-lg inline-block">3–6 let</span>
            <h3 className="font-bold text-slate-900 text-sm">Předškolní věk</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Stabilní týdenní režim spojený s docházkou do školky.</li>
              <li>Zvládání přechodů mezi domácnostmi v klidu.</li>
              <li>Záleží na konkrétním dítěti a jeho rozvoji řeči a emocí.</li>
            </ul>
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-extrabold text-xs rounded-lg inline-block">6–11 let</span>
            <h3 className="font-bold text-slate-900 text-sm">Mladší školní věk</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Rostoucí samostatnost, škola, kroužky a kamarádi.</li>
              <li>Vhodné střídání po týdnech (7-7) či v pevných dnech (2-2-5-5).</li>
              <li>Oba rodiče aktivně sledují školní výsledky.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* PRAKTICKÝ CHECKLIST (INTERAKTIVNÍ LOCALSTORAGE) */}
      <div id="sec-checklist" className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-6 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <CheckSquare className="w-6 h-6 text-blue-400" />
              Praktický checklist předání dítěte
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Odškrtněte si položky při předání dítěte. Stav se ukládá ve vašem prohlížeči.
            </p>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            «Stav checklistu se ukládá pouze ve vašem prohlížeči.»
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklistItems.map((item) => {
            const isChecked = !!checklist[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleCheckitem(item.id)}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-blue-950/60 border-blue-500/50 text-blue-200'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                )}
                <span className={`text-xs ${isChecked ? 'line-through text-slate-400' : ''}`}>
                  {item.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KDY ŘEŠIT SITUACI S ODBORNÍKEM */}
      <div id="sec-odbornik" className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6 scroll-mt-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-blue-600" />
            🤝 Kdy řešit situaci s odborníkem
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Zvažte odbornou konzultaci, pokud se rodiče opakovaně nedokážou dohodnout, konflikt ovlivňuje dítě, vznikají opakované problémy při předávání nebo si rodiče nepředávají důležité informace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-blue-900 block">Právník / Advokát</strong>
            <p className="text-slate-600">Právní otázky, příprava dohody o péči, návrh na soud a úprava výživného.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-emerald-900 block">Pediatr</strong>
            <p className="text-slate-600">Zdravotní otázky, očkování, výživa, vývoj dítěte a posouzení zdravotních rizik.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-purple-900 block">Psycholog / Mediátor</strong>
            <p className="text-slate-600">Psychická pohoda dítěte, zvládání emocí, rodinná mediace a komunikace rodičů.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <strong className="font-bold text-amber-900 block">OSPOD / Úřad</strong>
            <p className="text-slate-600">Ochrana práv a zájmů dítěte, poradenství pro rodiče a zastupování před soudem.</p>
          </div>
        </div>
      </div>

      {/* ZDROJE A ODBORNÁ LITERATURA */}
      <div id="sec-zdroje" className="bg-slate-100 rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 scroll-mt-6">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-700" />
          📚 Použité zdroje a odborné reference
        </h2>
        <p className="text-xs text-slate-600">
          Tato stránka vychází z ověřených primárních zdrojů, doporučení zdravotnických orgánů a odborného výzkumu:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          <li className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
            <strong className="font-bold block text-slate-900">Ministerstvo zdravotnictví ČR (MZČR)</strong>
            <span className="text-[11px] text-slate-500 block">Oficiální zdravotnická doporučení a péče o matku a dítě.</span>
            <a href="https://www.mzcr.cz" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
              www.mzcr.cz <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ověřeno: 09/2026</span>
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
            <strong className="font-bold block text-slate-900">Národní zdravotnický informační portál (NZIP)</strong>
            <span className="text-[11px] text-slate-500 block">Garantované informace o vývoji a zdraví dítěte.</span>
            <a href="https://www.nzip.cz" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
              www.nzip.cz <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ověřeno: 09/2026</span>
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
            <strong className="font-bold block text-slate-900">Česká pediatrická společnost ČLS JEP (ČPS)</strong>
            <span className="text-[11px] text-slate-500 block">Standardy preventivních prohlídek a výživy dětí.</span>
            <a href="https://www.pediatrie.cz" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
              www.pediatrie.cz <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ověřeno: 09/2026</span>
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
            <strong className="font-bold block text-slate-900">Světová zdravotnická organizace (WHO) & ÚMPOD</strong>
            <span className="text-[11px] text-slate-500 block">Doporučení pro péči o kojence a mezinárodní práva dětí.</span>
            <a href="https://www.who.int" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
              www.who.int <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ověřeno: 09/2026</span>
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
            <strong className="font-bold block text-slate-900">Dr. Richard Warshak (2014)</strong>
            <span className="text-[11px] text-slate-500 block">Social Science and Parenting Plans for Young Children (Psychology, Public Policy, and Law).</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ověřeno: Konsenzus 110 odborníků na dětský vývoj</span>
          </li>
          <li className="p-3 bg-white rounded-xl border border-slate-200 space-y-0.5">
            <strong className="font-bold block text-slate-900">Prof. William Fabricius & Prof. Go Woon Suh (2017)</strong>
            <span className="text-[11px] text-slate-500 block">Should Infants and Toddlers Have Frequent Overnight Stays With Fathers? (Developmental Psychology).</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Ověřeno: Dlouhodobý výzkum citové vazby k oběma rodičům</span>
          </li>
        </ul>
      </div>

      {/* CO NABÍZÍ DIGITÁLNÍ CARE HUB V APLIKACI */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Co získáte v aplikaci Care Hub
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

        <div className="pt-4 text-center print:hidden">
          <button
            onClick={handleCtaClick}
            className="px-8 py-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-black text-base shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3 cursor-pointer"
          >
            <span>{currentUser ? 'Otevřít můj Care Hub' : 'Chci vytvořit vlastní rodičovský plán zdarma'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* NAVAZUJÍCÍ STRÁNKY SEKCE MOJE DÍTĚ */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md print:hidden">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            Kategorie Moje dítě
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Navazující veřejné moduly
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Pokračujte na další specializované průvodce z kategorie Moje dítě.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => navigateTo('/psychologie')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Psychologický vývoj</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Emoce dítěte, vývojové etapy a zvládání konfliktu.</p>
          </button>

          <button
            onClick={() => navigateTo('/skola')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Škola a kroužky</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Komunikace se školou, informace o prospěchu a volný čas.</p>
          </button>

          <button
            onClick={() => navigateTo('/zdravotni-pece')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <Stethoscope className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Zdravotní péče</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Lékařská dokumentace, očkování a výběr pediatra.</p>
          </button>

          <button
            onClick={() => navigateTo('/studie/citova-vazba')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Citová vazba & Studie</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Výzkumy a vědecké poznatky o attachmentu u dětí.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
