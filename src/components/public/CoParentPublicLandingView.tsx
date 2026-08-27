import React, { useState } from 'react';
import { SeoHead } from './SeoHead';
import { 
  Users, MessageSquare, ShieldCheck, DollarSign, Calendar, 
  FileText, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, 
  Copy, Check, Scale, HeartHandshake, Eye, Lock, FileSpreadsheet,
  HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CoParentPublicLandingViewProps {
  onNavigate?: (path: string) => void;
}

export const CoParentPublicLandingView: React.FC<CoParentPublicLandingViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [copiedProposal, setCopiedProposal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
      navigateTo('/portal/coparent');
    } else {
      navigateTo('/login');
    }
  };

  const sampleCourtProposal = `„Rodiče se dohodli, že veškerou písemnou komunikaci týkající se dítěte (včetně informací o zdravotním stavu, školních výsledcích, plánovaných lékařských vyšetřeních, změnách v harmonogramu styku a schvalování mimořádných výdajů) budou vést výhradně prostřednictvím specializované digitální platformy pro spolurodiče s neměnnou auditní stopou a archivací záznamů. V naléhavých situacích ohrožujících zdraví či život dítěte je možný telefonický kontakt s následným písemným záznamem do aplikace.“`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleCourtProposal);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 3000);
  };

  const faqs = [
    {
      q: 'Uznávají české opatrovnické soudy a OSPOD komunikaci z aplikace?',
      a: 'Ano. Export z aplikace je opatřen kryptografickým otiskem (časovým razítkem a hashem integrity), což vylučuje možnost dodatečné editace nebo mazání zpráv. Soudy i OSPOD takový přehled preferují před chaotickými a vytrženými screenshoty z WhatsAppu či SMS.'
    },
    {
      q: 'Co dělat, pokud druhý rodič odmítá aplikaci používat?',
      a: 'Doporučujeme podat návrh soudu nebo OSPODu na úpravu formy komunikace s odkazem na ochranu dítěte před rodičovským konfliktem. Pokud druhý rodič odmítne, můžete do aplikace zaznamenávat jednostranné nabídky, informace o dítěti a výdaje, což u soudu prokazuje vaši snahu o konstruktivní spolupráci.'
    },
    {
      q: 'Jak funguje schvalování mimořádných výdajů na dítě?',
      a: 'Jeden rodič zadá výdaj (např. rovnátka nebo lyžařský výcvik), přiloží doklad/cenovou nabídku a určí navrhovaný podíl. Druhý rodič obdrží notifikaci a má možnost výdaj odsouhlasit nebo navrhnout úpravu. Vše je jasně archivováno pro případné soudní vypořádání.'
    },
    {
      q: 'Je používání CoParent Hubu bezplatné?',
      a: 'Základní verze pro komunikaci, kalendář, sdílení výdajů a export pro soud je v rámci projektu Táta má právo poskytována zdarma jako veřejná služba pro podporu rodin.'
    }
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      <SeoHead
        title="CoParent Hub • Bezkonfliktní spolurodičovství & Komunikace • Táta má právo"
        description="Profesionální nástroj a metodika pro bezkonfliktní spolurodičovství po rozchodu. Zásady BIFF komunikace, auditní soudní export zpráv, sdílení výdajů na dítě a vzorové dohody pro soud."
        canonicalPath="/coparent"
      />

      {/* HERO SECTION */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl text-white p-8 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Spolurodičovství bez hádek
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            CoParent Hub: Bezpečná komunikace a spolupráce rodičů
          </h1>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            Rozchodem partnerství rodičovství nekončí. CoParent Hub chrání děti před konflikty rodičů, 
            vede komunikaci k věcnosti (metodika BIFF), transparentně eviduje výdaje na dítě a 
            vytváří nezpochybnitelnou auditní stopu pro soud a OSPOD.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={handleCtaClick}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{currentUser ? 'Otevřít můj CoParent Hub' : 'Založit spolurodičovský profil'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('/soud')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-indigo-400" />
              <span>Průvodce soudním řízením</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 HLAVNÍ PILÍŘE SPOLEHLIVÉHO SPOLURODIČOVSTVÍ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">1. Věcná komunikace (BIFF)</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Metodika mezinárodně uznávaná soudy: zprávy jsou krátké, informativní, věcné a bez emocí. 
            AI asistent pomáhá před odesláním odfiltrovat toxické či útočné formulace.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">2. Transparentní výdaje</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Konec dohadování o účtenkách. Evidence školních výdajů, kroužků a léků s možností 
            schválení druhým rodičem před nákupem a okamžitým přehledem o vyrovnání.
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">3. Certifikovaný auditní export</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Zprávy nelze mazat ani dodatečně upravovat. Jedním kliknutím vytvoříte kompletní 
            chronologickou zprávu pro soud a OSPOD s časovými razítky doručení a přečtení.
          </p>
        </div>
      </div>

      {/* METODIKA BIFF V PRAXI (POROVNÁNÍ) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
        <div className="space-y-2">
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Komunikační standard</div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Metodika BIFF v každodenní praxi
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl">
            BIFF je zlatý standard komunikace s vysoce konfliktními osobami vyvinutý High Conflict Institute. 
            Podívejte se na rozdíl mezi běžnou emoční reakcí a konstruktivní BIFF zprávou:
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Špatný příklad */}
          <div className="p-6 rounded-2xl bg-red-50/70 border border-red-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100 text-red-800 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-600" /> Špatně: Emoční hádka
              </span>
              <span className="text-xs text-red-500 font-semibold">Vyvolává další konflikt</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-red-100 text-sm text-slate-700 italic space-y-2">
              <p>
                „Zase jsi zapomněl Tomášovi sbalit sešit do matematiky! Jsi naprosto nespolehlivý a vůbec tě nezajímá, 
                že dostane poznámku. Jako obvykle myslíš jen na sebe. Okamžitě mi ho přivez, jinak to nahlásím na OSPOD!“
              </p>
            </div>
            <ul className="text-xs text-red-700 space-y-1 pl-4 list-disc">
              <li>Osobní útoky a urážky, které soud vyhodnotí negativně.</li>
              <li>Vyhrožování institucemi bez věcného řešení situace.</li>
              <li>Zvyšuje napětí a stres přenášený na dítě.</li>
            </ul>
          </div>

          {/* Správný BIFF příklad */}
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Správně: BIFF zpráva
              </span>
              <span className="text-xs text-emerald-600 font-semibold">Brief • Informative • Friendly • Firm</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-100 text-sm text-slate-700 space-y-2">
              <p className="font-medium text-slate-900">
                „Ahoj, Tomáš dnes v aktovce nemá sešit do matematiky na zítřejší úkol. Prosím o potvrzení, zda zůstal u tebe. 
                Pokud ano, mohu se pro něj stavit dnes mezi 17:00–18:00, nebo pošli fotku zadaného cvičení do 19:00. Děkuji.“
              </p>
            </div>
            <ul className="text-xs text-emerald-800 space-y-1 pl-4 list-disc">
              <li><strong>Brief:</strong> Pouze 3 věty bez zbytečných slov.</li>
              <li><strong>Informative:</strong> Popisuje přesný fakt a časový rámec.</li>
              <li><strong>Friendly:</strong> Neutrální a slušný tón bez výčitek.</li>
              <li><strong>Firm:</strong> Nabízí dvě konkrétní funkční řešení s termínem.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* DESATERO KOMUNIKACE S MANIPULATIVNÍM EXPARTNEREM */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <HeartHandshake className="w-7 h-7 text-indigo-600" />
          Desatero bezpečné komunikace pro rodiče
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {[
            { n: '1', t: 'Pravidlo 24 hodin', d: 'Na provokativní zprávy nikdy neodpovídejte v afektu. Dopřejte si čas na zklidnění emocí.' },
            { n: '2', t: 'Pouze téma dítě', d: 'Ignorujte narážky na váš osobní život, nového partnera či minulost. Odpovídejte výhradně k dítěti.' },
            { n: '3', t: 'Vše písemně', d: 'Ústní dohody po telefonu se u soudu nedají prokázat. Veškeré žádosti a změny termínů veďte v aplikaci.' },
            { n: '4', t: 'Zákaz obhajování', d: 'Neomlouvejte se za nesmyslná obvinění. Odpovězte věcným faktem nebo vůbec, pokud zpráva nevyžaduje reakci.' },
            { n: '5', t: 'Jasná volba A / B', d: 'Dávejte druhému rodiči na výběr ze 2 konkrétních časových možností s termínem pro odpověď.' },
            { n: '6', t: 'Žádné ironie a smajlíky', d: 'Psaný text bez intonace může být snadno vyložen jako sarkasmus. Držte profesionální tón.' },
            { n: '7', t: 'Předpoklad soudního čtení', d: 'Před odesláním každé zprávy si představte, jak bude znít, až ji soudce nahlas přečte v síni.' },
            { n: '8', t: 'Včasné informování', d: 'O návštěvách lékaře či třídních schůzkách informujte druhého rodiče neprodleně a prokazatelně.' },
            { n: '9', t: 'Dítě jako posel je tabu', d: 'Nikdy nevzkazujte zprávy ani peníze přes dítě. Dítě nesmí nést tíhu dospělé komunikace.' },
            { n: '10', t: 'Chraňte svůj klid', d: 'Nastavte si v aplikaci notifikace tak, aby vás zprávy nerušily v práci a v době, kdy jste s dětmi.' }
          ].map((item) => (
            <div key={item.n} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.n}
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{item.t}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VZOROVÝ NÁVRH PRO SOUD / OSPOD */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Vzor formulace pro soudní dohodu či rozsudek</h2>
            <p className="text-sm text-slate-400 mt-1">Text, který můžete navrhnout do rodičovské dohody nebo návrhu k soudu</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer w-fit"
          >
            {copiedProposal ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedProposal ? 'Zkopírováno do schránky' : 'Kopírovat text návrhu'}</span>
          </button>
        </div>

        <div className="bg-slate-800/90 p-6 rounded-2xl border border-slate-700 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed">
          {sampleCourtProposal}
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <HelpCircle className="w-7 h-7 text-indigo-600" />
          Často kladené otázky k aplikaci a komunikaci
        </h2>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left font-bold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="text-sm sm:text-base">{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </button>
              {openFaq === idx && (
                <div className="p-4 sm:p-5 pt-0 text-sm text-slate-600 bg-slate-50/50 border-t border-slate-100 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-6 text-center border-t border-slate-200">
          <button
            onClick={handleCtaClick}
            className="px-8 py-4 rounded-2xl bg-indigo-900 hover:bg-indigo-800 text-white font-black text-base shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-3 cursor-pointer"
          >
            <span>{currentUser ? 'Vstoupit do CoParent Hubu' : 'Vytvořit bezplatný profil spolurodiče'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
