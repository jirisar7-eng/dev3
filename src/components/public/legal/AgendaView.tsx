import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Scale,
  ShieldAlert,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Info,
  Calendar,
  Gavel,
  Lock,
  UserCheck,
  Eye,
  FileCheck
} from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface AgendaViewProps {
  onNavigate?: (path: string) => void;
}

interface PhaseStep {
  title: string;
  subtitle: string;
  timeframe: string;
  description: string;
  keyTasks: string[];
  risks: string[];
  tips: string[];
  recommendedForm?: string;
  formUrl?: string;
}

const AGENDA_PHASES: { id: number; number: string; title: string; badge: string; color: string; steps: PhaseStep[] }[] = [
  {
    id: 1,
    number: 'FÁZE 1',
    title: 'OSPOD & Předprocesní příprava',
    badge: 'Krizová stabilizace & Příprava',
    color: 'from-amber-600 to-amber-700',
    steps: [
      {
        title: '1. Krizová stabilizace & Emoční odstup (BIFF komunikace)',
        subtitle: 'Prvních 48 hodin až 2 týdny po vzniku konfliktu',
        timeframe: '1–14 dní',
        description: 'Vzniká-li rozpad partnerství nebo hrozí-li omezení styku s dítětem, prvním pravidlem je absolutní emoční sebeovládání. Všechna písemná i ústní komunikace s druhým rodičem musí podléhat principu BIFF (Brief, Informative, Friendly, Firm - Stručná, Informativní, Přátelská, Pevná).',
        keyTasks: [
          'Založte si podrobný Deník péče a incidentů (zaznamenávejte přesná data, časy a průběh předání dítěte).',
          'Všechnu komunikaci s matkou/otcem vedete výhradně písemně (SMS, e-mail, doporučený dopis).',
          'Udržujte stabilní a plně vybavený dětský pokoj ve svém bydlišti.',
          'Zajistěte potvrzení od zaměstnavatele o flexibilitě vaší pracovní doby.'
        ],
        risks: [
          'Reagování v afektu (SMS v hněvu, vulgarismy) – protistrana okamžitě použije u OSPOD/soudu jako důkaz "agresivity".',
          'Opuštění společného bydliště bez písemné dohody o péči o dítě.',
          'Souhlas s "zatímním" nepravidelným stykem ("zatím víkend jednou za 14 dní"), ze kterého se stane dlouhodobý status quo.'
        ],
        tips: [
          'Před odesláním jakékoliv zprávy počkejte 24 hodin a přečtěte si ji očima soudce.',
          'Nikdy nesouhlaste s tím, že se dítěte vzdáváte na delší dobu "než se věci uklidní".'
        ],
        recommendedForm: 'SOS Plán 72h',
        formUrl: '/sos-plan'
      },
      {
        title: '2. První jednání s OSPOD a vytvoření spisu Om',
        subtitle: 'Procesní role Orgánu sociálně-právní ochrany dětí',
        timeframe: '2–4 týdny',
        description: 'OSPOD je opatrovnickým soudem jmenován jako kolizní opatrovník dítěte. Jeho úkolem je zastupovat zájem dítěte, nikoliv zájem matky nebo otce. První dojem a věcnost jednání s klíčovou sociální pracovnicí je zásadní pro celý následující proces.',
        keyTasks: [
          'Sjednejte si osobní schůzku na OSPOD a předložte písemný věcný přehled své dosavadní péče.',
          'Prezentujte se jako aktivní, milující rodič, který plně respektuje roli druhého rodiče a usiluje o dohody.',
          'Požádejte sociální pracovnici o prověření bytových podmínek v místě vašeho bydliště (místní šetření).',
          'Požádejte o možnost nahlédnutí do spisu Om na OSPOD (§ 38 správního řádu).'
        ],
        risks: [
          'Útočení na matku/otce před sociální pracovnicí – namísto toho hovořte výhradně o potřebách a vztahu k dítěti.',
          'Pasivita a čekání, až OSPOD "něco sám vyřeší". OSPOD není soud ani váš advokát.'
        ],
        tips: [
          'Z každého jednání na OSPOD si udělejte písemný zápis a zašlete jej sociální pracovnici e-mailem jako rekapitulaci.',
          'Předložte fotografie dětského pokoje, plán kroužků a důkazy o vašem zapojení do školy/lékařské péče.',
          'Podle Veřejného ochránce práv (Ombudsmana) má OSPOD absolutní povinnost nestrannosti. Pokud se setkáte s nečinností či zjevnou podjatostí sociální pracovnice, máte právo podat oficiální stížnost tajemníkovi městského úřadu podle § 175 správního řádu.'
        ],
        recommendedForm: 'Vyjádření rodiče pro OSPOD',
        formUrl: '/ai-formulare'
      }
    ]
  },
  {
    id: 2,
    number: 'FÁZE 2',
    title: 'Podání návrhu & Předběžné opatření',
    badge: 'Zahájení soudního řízení',
    color: 'from-blue-600 to-blue-700',
    steps: [
      {
        title: '3. Příprava a podání Návrhu na úpravu péče',
        subtitle: 'Zahájení opatrovnického řízení u věcně a místně příslušného okresního soudu',
        timeframe: '1. měsíc',
        description: 'Návrh se podává u okresního soudu, v jehož obvodu má dítě své faktické bydliště. Návrh musí přesně splňovat formální náležitosti podle § 466 a násl. z.ř.s. a občanského zákoníku.',
        keyTasks: [
          'Přesná specifikace účastníků: Navrhovatel (otec), Odpůrkyně (matka), Nezletilé dítě.',
          'Formulace jasného petitu: Návrh na střídavou péči (např. týden/týden s předáním v pondělí v 17:00) a úpravu výživného.',
          'Doložení důkazních návrhů: Výpis z banky, rodný list dítěte, fotodokumentace zázemí, rozpis pracovní doby.',
          'Citování judikatury Ústavního soudu (I. ÚS 2482/13, II. ÚS 1642/22).'
        ],
        risks: [
          'Vágni formulovaný petit ("chci vídat dítě co nejvíce") – soud potřebuje přesné dny, hodiny a místo předání.',
          'Opomenutí návrhu výživného nebo chybějící důkazy o příjmech.'
        ],
        tips: [
          'Využijte náš AI Generátor formulářů pro sestavení právně přesného petitu propojeného s e-Sbírkou.',
          'Soudní řízení ve věcech péče o nezletilé je osvobozeno od soudních poplatků.',
          'Pokud jste v tíživé finanční situaci, můžete požádat Českou advokátní komoru (ČAK) o bezplatné určení advokáta podle § 18a zákona o advokacii, pokud doložíte odmítnutí právní pomoci od alespoň dvou advokátů a čistý příjem pod 3násobkem životního minima.'
        ],
        recommendedForm: 'Návrh na střídavou péči',
        formUrl: '/ai-formulare'
      },
      {
        title: '4. Naléhavé řešení: Předběžné opatření (§ 452 z.ř.s. / § 74 o.s.ř.)',
        subtitle: 'Když druhý rodič zcela zamezí kontaktu s dítětem',
        timeframe: 'Rozhodnutí do 24 hodin až 7 dnů',
        description: 'Pokud vám druhý rodič svévolně odepře jakýkoliv kontakt s dítětem, odveze dítě do jiného města nebo hrozí psychická újma dítěte z izolace, je nutné podat návrh na vydání předběžného opatření podle § 452 z.ř.s.',
        keyTasks: [
          'Prokázání naléhavého zájmu a bezprostředního ohrožení vazby mezi rodičem a dítětem.',
          'Předložení důkazů o maření styku (SMS, e-maily, protokoly PČR nebo vyjádření OSPOD).',
          'Soud o návrhu podle § 452 z.ř.s. rozhoduje bezodkladně, nejpozději do 24 hodin (případně do 7 dnů podle § 74 o.s.ř.).'
        ],
        risks: [
          'Podání předběžného opatření bez dostatečných důkazů – soud návrh zamítne a protistrana to zneužije.',
          'Nedostatečné prokázání faktického stavu těsně před odepřením styku.'
        ],
        tips: [
          'Předběžné opatření má trvat jen po dobu trvání naléhavé situace do rozhodnutí ve věci samé.',
          'V případě zamítnutí je možné podat odvolání k krajskému soudu do 15 dnů.'
        ],
        recommendedForm: 'Návrh na předběžné opatření',
        formUrl: '/ai-formulare'
      }
    ]
  },
  {
    id: 3,
    number: 'FÁZE 3',
    title: 'Soudní jednání & Znalci',
    badge: 'Dokazování & Znalecké posudky',
    color: 'from-indigo-600 to-indigo-700',
    steps: [
      {
        title: '5. Přípravné jednání & Výslech účastníků',
        subtitle: 'První ústní jednání před opatrovnickým soudcem',
        timeframe: '2.–4. měsíc',
        description: 'Soudce na prvním jednání zjišťuje stanoviska obou rodičů, zprávu OSPOD a pokouší se směřovat rodiče k uzavření smírné dohody (např. doporučením mediace nebo Cochemské praxe).',
        keyTasks: [
          'Důkladná příprava na výslech: Vystupujte klidně, věcně, kultivovaně a s úctou k soudu.',
          'Důraz na nejlepší zájem dítěte: Zdůrazňujte právo dítěte na obě rodinná prostředí.',
          'Vyjádření k návrhům protistrany: Písemně i ústně reagujte na nepravdivá tvrzení pouze věcnými důkazy.',
          'Návrh na využití Cochemského modelu (společná dohoda za účasti OSPOD a psychologa).'
        ],
        risks: [
          'Nechání se vyprovokovat advokátem protistrany k emotivní reakci přímo v soudní síni.',
          'Souhlas s nepříznivým rozsudkem "na zkoušku" bez jasného časového ohraničení.'
        ],
        tips: [
          'Vyzkoušejte náš AI Simulátor soudního výslechu pro nácvik otázek soudce a advokáta.',
          'Před jednáním si nahlédněte do soudního spisu a pořiďte fotokopie všech nově doručených listin.'
        ],
        recommendedForm: 'Žádost o nahlédnutí do spisu',
        formUrl: '/ai-formulare'
      },
      {
        title: '6. Znalecké dokazování (Psychologický posudek)',
        subtitle: 'Když soud nařídí psychologické vyšetření rodičů a dítěte',
        timeframe: '4.–9. měsíc',
        description: 'V konfliktních případech soud jmenuje soudního znalce z oboru dětské psychologie a psychiatrie. Znalec zkoumá výchovné předpoklady rodičů, citové vazby dítěte a případnou manipulaci či syndrom zavrženého rodiče.',
        keyTasks: [
          'Aktivní a autentická součinnost se znalcem při psychologických testech a pozorování interakce s dítětem.',
          'Předložení objektivních podkladů znalci (střízlivý popis historie péče).',
          'Příprava případných výhrad k metodice nebo závěrům znalce (možnost výslechu znalce u soudu).'
        ],
        risks: [
          'Snaha "přečůrat" psychologické testy nebo hrát nepřirozenou roli – zkušený znalec to okamžitě odhalí.',
          'Podceňování přípravy na pozorování interakce s dítětem (tzv. rodičovská zkouška).'
        ],
        tips: [
          'Při vyšetření buďte uvolnění, plně se soustřeďte na dítě a nenechte se znejistět přítomností znalce.',
          'Pokud posudek trpí metodickými vadami, máte právo požadovat výslech znalce nebo revizní posudek.'
        ],
        recommendedForm: 'Případová databáze judikatury',
        formUrl: '/judikatura'
      }
    ]
  },
  {
    id: 4,
    number: 'FÁZE 4',
    title: 'Rozsudek & Výkon rozhodnutí',
    badge: 'Finální rozsudek & Vynucování',
    color: 'from-emerald-600 to-emerald-700',
    steps: [
      {
        title: '7. Vyhlášení rozsudku & Právní moc',
        subtitle: 'Rozhodnutí soudu prvního stupně a případné odvolání',
        timeframe: '6.–12. měsíc',
        description: 'Soud vyhlásí rozsudek, kterým upraví péči (střídavá, společná, výlučná), stanoví přesný harmonogram styku a určí výši výživného obou rodičů.',
        keyTasks: [
          'Pečlivá kontrola písemného vyhotovení rozsudku po jeho doručení.',
          'Vyhodnocení potřeby odvolání k krajskému soudu (lhůta 15 dnů od doručení).',
          'Pokud rozsudek odpovídá zájmu dítěte, vyznačení doložky právní moci a vykonatelnosti na podatelně soudu.'
        ],
        risks: [
          'Zmeškání 15-denní odvolací lhůty při nesouhlasu s výrokem soudu.',
          'Nedodržování rozsudku hned v prvních týdnech od jeho vykonatelnosti.'
        ],
        tips: [
          'Odvolání k krajskému soudu má odkladný účinek ohledně péče a výživného (vyjma předběžně vykonatelných výroků).',
          'Pro účely exekuce styku je nutné mít rozsudek opatřený razítkem doložky právní moci.'
        ],
        recommendedForm: 'AI Formuláře podání',
        formUrl: '/ai-formulare'
      },
      {
        title: '8. Výkon rozhodnutí & Řešení maření styku (§ 500 z.ř.s.)',
        subtitle: 'Co dělal při nedodržování schválené péče druhým rodičem',
        timeframe: 'Trvale v průběhu vykonatelnosti',
        description: 'Pokud druhý rodič odmítá předávat dítě podle pravomocného rozsudku, nastupuje fáze výkonu rozhodnutí. Soud postupuje podle § 500 a násl. z.ř.s. (výzva k dobrovolnému plnění, ukládání pokut až do 50.000 Kč, případně odnětí dítěte).',
        keyTasks: [
          'Při každém nepředání dítěte se dostavte do místa předání, pořiďte video/audio záznam nebo vyčkejte s svědkem.',
          'Zašlete druhému rodiči okamžitou písemnou výzvu k náhradnímu termínu styku.',
          'Podavejte návrh na výkon rozhodnutí uložením pokuty podle § 500 z.ř.s. u opatrovnického soudu.',
          'Opakované maření styku je důvodem pro změnu péče ve prospěch poškozovaného rodiče (§ 888 o.z.).'
        ],
        risks: [
          'Samoctelné vyžádání si dítěte silou nebo vyvolávání konfliktů na veřejnosti před dítětem.',
          'Rezignace na evidování nepředání – bez důkazů nemůže soud pokutu uložit.'
        ],
        tips: [
          'Soudní pokuty uložené podle § 500 z.ř.s. přapadají státu a jsou účinným tlakem na mařícího rodiče.',
          'Judikatura Ústavního soudu potvrzuje, že dlouhodobé maření styku je závažným selháním rodičovské způsobilosti.',
          'Při opakovaném zamezování kontaktu doporučuje Ombudsman ČR vyžadovat od opatrovnického soudu průběžné vymáhání rozhodnutí ukládáním pokut do výše 50 000 Kč (§ 500 z.ř.s.) s cílem vytvořit trvalý tlak na dodržování rozsudku.'
        ],
        recommendedForm: 'Návrh na výkon rozhodnutí (pokuta)',
        formUrl: '/ai-formulare'
      }
    ]
  }
];

export const AgendaView: React.FC<AgendaViewProps> = ({ onNavigate }) => {
  const [activePhaseId, setActivePhaseId] = useState<number>(1);
  const [expandedStepIndex, setExpandedStepIndex] = useState<number | null>(0);

  const activePhase = AGENDA_PHASES.find((p) => p.id === activePhaseId) || AGENDA_PHASES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Opatrovnická Agenda & Časová osa řízení • Táta má právo"
        description="Interaktivní průvodce 4 fázemi opatrovnického řízení v ČR: OSPOD, návrhy na střídavou péči, předběžná opatření, znalecké posudky a výkon rozhodnutí."
        canonicalPath="/agenda"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-400/30 mb-3">
              <Scale className="w-3.5 h-3.5 text-indigo-400" /> Opatrovnická Praktická Agenda
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              4 Fáze Opatrovnického Řízení v ČR
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Krok za krokem od prvního kontaktu s OSPOD, přes podání návrhu na střídavou péči, dokazování u soudu až po vymáhání stanoveného styku.
            </p>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/ai-formulare')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>Generovat návrh k soudu</span>
            </button>
          )}
        </div>
      </div>

      {/* Phase Selector Timeline Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {AGENDA_PHASES.map((phase) => {
          const isActive = phase.id === activePhaseId;
          return (
            <button
              key={phase.id}
              onClick={() => {
                setActivePhaseId(phase.id);
                setExpandedStepIndex(0);
              }}
              className={`p-4 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900 text-white border-indigo-500 shadow-lg ring-2 ring-indigo-500/50'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isActive ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-400/30' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {phase.number}
                </span>
                <Clock className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              </div>
              <h3 className={`font-black text-xs sm:text-sm leading-snug ${isActive ? 'text-white' : 'text-slate-900'}`}>
                {phase.title}
              </h3>
              <p className={`text-[11px] mt-1 line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                {phase.badge}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Phase Content Area */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
              {activePhase.number} • {activePhase.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              {activePhase.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Kliknutím na krok zobrazíte podrobný návod</span>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-4">
          {activePhase.steps.map((step, idx) => {
            const isExpanded = expandedStepIndex === idx;

            return (
              <div
                key={idx}
                className={`rounded-2xl border transition-all ${
                  isExpanded ? 'border-indigo-600 bg-indigo-50/20 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Step Header */}
                <button
                  onClick={() => setExpandedStepIndex(isExpanded ? null : idx)}
                  className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5 ${
                        isExpanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {step.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {step.subtitle} • <span className="text-indigo-600 font-bold">Časový rámec: {step.timeframe}</span>
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90 text-indigo-600' : ''}`}
                  />
                </button>

                {/* Expanded Step Body */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-indigo-100/60 space-y-6 text-xs leading-relaxed text-slate-800">
                    <p className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                      {step.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Key Tasks */}
                      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                        <strong className="text-emerald-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Klíčové úkony a doporučený postup
                        </strong>
                        <ul className="space-y-1.5 text-emerald-950 font-medium list-disc pl-4">
                          {step.keyTasks.map((task, tIdx) => (
                            <li key={tIdx}>{task}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Risks & Traps */}
                      <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 space-y-2">
                        <strong className="text-rose-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          Na co si dát pozor (Časté chyby)
                        </strong>
                        <ul className="space-y-1.5 text-rose-950 font-medium list-disc pl-4">
                          {step.risks.map((risk, rIdx) => (
                            <li key={rIdx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Pro Tips & Form Link */}
                    <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <strong className="text-amber-400 font-bold text-xs flex items-center gap-1">
                          💡 Tipy z opatrovnické praxe:
                        </strong>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {step.tips.join(' ')}
                        </p>
                      </div>

                      {step.recommendedForm && onNavigate && step.formUrl && (
                        <button
                          onClick={() => onNavigate(step.formUrl!)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-extrabold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{step.recommendedForm}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
