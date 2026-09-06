import React, { useState } from 'react';
import { SeoHead } from '../SeoHead';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  Phone, 
  ArrowLeft, 
  AlertTriangle, 
  HeartPulse, 
  Scale, 
  Info, 
  CheckCircle2, 
  Clock, 
  Map, 
  HelpCircle, 
  X,
  ChevronRight,
  Compass
} from 'lucide-react';

interface SosPlanViewProps {
  onNavigate?: (view: string) => void;
}

export const SosPlanView: React.FC<SosPlanViewProps> = ({ onNavigate }) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const emergencyContacts = [
    { name: 'Tísňová linka — 112', phone: '112', desc: 'Bezprostřední ohrožení života nebo zdraví.' },
    { name: 'Policie ČR — 158', phone: '158', desc: 'Fyzické napadení, ohrožení nebo nebezpečné vyhrožování.' },
    { name: 'Záchranná služba — 155', phone: '155', desc: 'Akutní zdravotní potíže, zranění nebo tísňový stav.' }
  ];

  const situationCards = [
    {
      id: 'dite',
      emoji: '👶',
      title: 'Ochrana a režim dětí',
      tag: 'Prostředí dítěte',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      shortDesc: 'Jak chránit dítě před dopady konfliktu a zajistit kontinuitu jeho režimu a jistot.',
      tips: [
        'Bezpečné prostředí: Dítě nesmí za žádných okolností slyšet hádky, výčitky nebo právní spory rodičů.',
        'Rutina a jistoty: Udržujte stabilní časy spánku, jídla, školní docházky a zájmových kroužků dítěte.',
        'Zdravotní péče: Dbejte na kontinuitu zdravotní péče, podávání předepsaných léků a kontakt s pediatrem.',
        'Právo na oba rodiče: Dítě má právo milovat oba rodiče. Netlačte ho k volbě loajality ani nepromítejte své křivdy.'
      ],
      ctaText: 'Spustit Coparent Hub',
      ctaPath: '/coparent-hub'
    },
    {
      id: 'komunikace',
      emoji: '💬',
      title: 'Deeskalační komunikace',
      tag: 'Klientská rovina',
      tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      shortDesc: 'Jak přejít na bezpečný, klientský a vysoce věcný tón v písemném styku s druhým rodičem.',
      tips: [
        'Výhradně písemná forma: V krizové fází komunikujte e-mailem nebo SMS, abyste měli prokazatelnou stopu bez emocí.',
        'Struktura B.I.F.F.: Pište stručně (Brief), informativně (Informative), přátelsky/zdvořile (Friendly) a pevně (Firm).',
        'Pravidlo 48 hodin: Na emocionální nebo útočné zprávy neodpovídejte hned. Odpovězte až s odstupem a pouze na věcnou část.',
        'Formulace zpráv: Uvádějte pouze prokazatelná fakta, konkrétní věcnou otázku a konstruktivní návrh řešení.'
      ],
      ctaText: 'Spustit B.I.F.F. deeskalátor',
      ctaPath: '/biff'
    },
    {
      id: 'dokumentace',
      emoji: '📂',
      title: 'Dokumentace & Deník',
      tag: 'Zajištění podkladů',
      tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
      shortDesc: 'Příprava podkladů, vedení deníku a zálohování zpráv pro případné opatrovnické řízení.',
      tips: [
        'Faktický deník: Zapisujte si přesná data, časy a věcný průběh předávání (např. "předání v 15:20 namísto 15:00, bez omluvy").',
        'Zákaz interpretací: Do deníku nepatří věty typu "přišla schválně pozdě, aby mě naštvala". Uvádějte pouze ověřitelná fakta.',
        'Zabezpečení dokumentů: Mějte digitálně zálohovaný rodný list dítěte, dohodu rodičů a proběhlá soudní usnesení.',
        'Právní čistota: Nikdy neupravujte komunikaci, nemažte své zprávy a nevstupujte neoprávněně do cizích účtů.'
      ],
      ctaText: 'Zobrazit AI formuláře',
      ctaPath: '/ai-formulare'
    },
    {
      id: 'domacnost',
      emoji: '🏠',
      title: 'Společná domácnost',
      tag: 'Rozhodovací dilema',
      tagColor: 'bg-slate-50 text-slate-700 border-slate-200',
      shortDesc: 'Základní právní pravidla při zvažování odchodu, ochraně majetku a bydliště dětí.',
      tips: [
        'Právní posouzení: Unáhlený odchod z domácnosti bez dětí může být u soudu interpretován jako "opuštění rodinné domácnosti".',
        'Bydliště dětí: Nikdy jednostranně nepřestěhujte dítě do jiného města bez písemného souhlasu druhého rodiče.',
        'Bezpečí na prvním místě: Pokud čelíte fyzickému napadání nebo závažnému teroru, odejděte s dětmi na bezpečné místo.',
        'Finanční rezerva: Zajistěte si přístup k vlastním finančním prostředkům a průběžně hraďte náklady na domácnost.'
      ],
      ctaText: 'Zobrazit Právní poradnu',
      ctaPath: '/pravni-poradna'
    },
    {
      id: 'chyby',
      emoji: '🚫',
      title: 'Čemu se striktně vyhnout',
      tag: 'Kritická varování',
      tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
      shortDesc: 'Nejčastější taktické a procesní chyby, které mohou nevratně oslabit vaše postavení u soudu.',
      tips: [
        'Žádné vyhrožování: Nikdy nevyhrožujte policií, soudy, sociálkou, zákazem kontaktu ani omezením alimentů.',
        'Absence nátlaku: Nepodepisujte pod bezprostředním psychickým nátlakem žádné dohody. Trvejte na čase pro prostudování.',
        'Sociální sítě: Nezveřejňujte detaily sporu, nahrávky ani fotky dětí na internetu. Soudy to vnímají velmi negativně.',
        'Nemanipulujte dětmi: Nepoužívejte děti jako prostředníky ke vzkazům, nevyptávejte se jich a netlačte na ně.'
      ],
      ctaText: 'Zobrazit Memento otců',
      ctaPath: '/memento'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <SeoHead
        title="Krizový SOS plán pro otce • První kroky a kontakty"
        description="Akutní krizový průvodce pro otce: ověřené nonstop linky pomoci, krizové intervence a strukturovaný přehled pro první kroky v opatrovnické krizi."
        canonicalPath="/sos-plan"
      />
      
      {/* Hlavní hlavička */}
      <div className="bg-slate-900 text-white pt-20 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <ShieldAlert className="w-64 h-64" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          {onNavigate && (
            <button 
              onClick={() => onNavigate('/')}
              className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm font-semibold tracking-wide"
              id="btn-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zpět na přehled
            </button>
          )}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-4">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Krizový rozcestník</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
            Krizový průvodce po rozpadu vztahu
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
            První hodiny a dny po vzniku akutního opatrovnického konfliktu jsou kritické pro stabilizaci vaší situace a ochranu zájmů vašich dětí. Tento rozcestník vám pomůže rychle se zorientovat a vyvarovat se nevratným chybám.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* AKUTNÍ NEBEZPEČÍ & KRIZOVÉ KONTAKTY */}
        <section id="sekce-kontakty" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-3">
              <Phone className="w-6 h-6 text-rose-600" />
              Bezprostřední tísňové linky
            </h2>
            <button
              onClick={() => onNavigate?.('/krizova-pomoc')}
              className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors"
              id="btn-all-contacts"
            >
              <span>Všechny krizové kontakty</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-rose-50/40 rounded-2xl p-5 border border-rose-100">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-rose-950 text-xs sm:text-sm uppercase tracking-wider">Bezprostřední nebezpečí</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{contact.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{contact.desc}</div>
                  </div>
                  <a 
                    href={`tel:${contact.phone}`}
                    className="w-full text-center py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black transition-colors block"
                  >
                    Volat {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CO UDĚLAT TEĎ */}
        <section id="sekce-co-ted" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Co udělat teď — okamžité kroky stabilizace
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-2xl mb-3 block">🛡️</span>
              <h3 className="font-black text-slate-900 mb-2 text-base">1. Zajistěte bezpečí</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prioritou je život, zdraví a bezpečí. Pokud čelíte fyzickému či závažnému psychickému násilí, odjeďte s dětmi na bezpečné místo nebo volejte policii. Majetkové či opatrovnické spory vyřešíte s chladnou hlavou později.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-2xl mb-3 block">🧘</span>
              <h3 className="font-black text-slate-900 mb-2 text-base">2. Uplatněte emociální STOP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nerozhodujte v afektu, nehádejte se před dítětem. Neposílejte laviny vyčítavých zpráv a nevolejte opakovaně. Zásadně deeskalujte napětí vědomým odstupem (např. "Rozumím tvému postoji, odpovím ti písemně zítra").
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <span className="text-2xl mb-3 block">🧠</span>
              <h3 className="font-black text-slate-900 mb-2 text-base">3. Chraňte dítě před konfliktem</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Zamezte jakýmkoli hádkám nebo právním debatám před dětmi. Dítě má právo na oba rodiče a nesmí být stavěno do role rozhodce, prostředníka či společníka ve sporu dospělých.
              </p>
            </div>
          </div>
        </section>

        {/* COMPACT 48h PLAN CTA BLOCK */}
        <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Clock className="w-48 h-48" />
          </div>
          <div className="max-w-3xl relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Interaktivní krizový plán</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Kompletní plán prvních 48 hodin
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Postupujte systematicky fázi po fázi. Otevřete si plný, tiskem podpořený interaktivní checklist (0 až 2 hodiny, 2 až 12 hodin, 12 až 24 hodin a 24 až 48 hodin), který si pamatuje stav vašich úkolů přímo v prohlížeči.
              </p>
            </div>
            <button
              onClick={() => onNavigate?.('/sos-plan/48-hodin')}
              className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer shrink-0 inline-flex items-center gap-2"
              id="btn-open-48-plan"
            >
              <Clock className="w-4 h-4" />
              <span>Otevřít krizový plán 48h</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ŘEŠÍM KONKRÉTNÍ SITUACI (DASHBOARD CARDS) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <Compass className="w-6 h-6 text-indigo-600" />
            Řeším konkrétní situaci — rychlé rady & nástroje
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-4xl leading-relaxed">
            Vyberte téma, které vás aktuálně nejvíce trápí. Získáte okamžité praktické pokyny v kostce a přímé napojení na pokročilé platformní moduly a kalkulačky.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {situationCards.map((card) => (
              <div 
                key={card.id}
                onClick={() => setActiveModal(card.id)}
                className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 bg-slate-50/40 hover:bg-white transition-all cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-3xl">{card.emoji}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${card.tagColor}`}>
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {card.shortDesc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                  <span>Zobrazit krizové rady</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* NAVIGAČNÍ ROZCESTNÍK POMOCI */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Potřebujete další pomoc? Přejít na platformní moduly
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <button
              onClick={() => onNavigate?.('/krizova-pomoc')}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-rose-50/30 transition-all text-left group cursor-pointer w-full"
              id="help-link-krize"
            >
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-105 transition-transform shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-rose-600 transition-colors mb-1">
                  🆘 Krizová pomoc
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Širší rozcestník krizové pomoci, nonstop telefonní linky a krizové poradny v ČR.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('/registr-subjektu')}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-indigo-50/30 transition-all text-left group cursor-pointer w-full"
              id="help-link-registr"
            >
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors mb-1">
                  🏛️ Registr & Hodnocení subjektů
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vyhledávání a zkušenosti s opatrovnickými soudy, OSPOD a soudními znalci.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('/mapa-subjektu')}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 bg-slate-50/50 hover:bg-emerald-50/30 transition-all text-left group cursor-pointer w-full"
              id="help-link-mapa"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors mb-1">
                  🗺️ Mapa institucí a poraden
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Interaktivní mapa soudů, pracovišť OSPOD a odborných poraden v ČR.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('/pravni-poradna')}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/30 transition-all text-left group cursor-pointer w-full"
              id="help-link-poradna"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors mb-1">
                  ⚖️ Právní poradna & Dotazy
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Právní poradna pro otce, odpovědi na nejčastější dotazy a vyhodnocení rizik.
                </p>
              </div>
            </button>

            <button
              onClick={() => onNavigate?.('/memento')}
              className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 hover:border-amber-200 bg-slate-50/50 hover:bg-amber-50/30 transition-all text-left group cursor-pointer w-full"
              id="help-link-memento"
            >
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-600 transition-colors mb-1">
                  ⚠️ Memento otců
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Svědectví, poučení, prevence procesních chyb a opatrovnického odcizení.
                </p>
              </div>
            </button>

          </div>
        </section>
      </div>

      {/* DETAILED MODAL PORTAL */}
      <AnimatePresence>
        {activeModal && (() => {
          const card = situationCards.find(c => c.id === activeModal);
          if (!card) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
              />
              
              {/* Modal window */}
              <motion.div 
                initial={{ scale: 0.95, y: 15, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 15, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 relative shadow-2xl z-10 max-h-[90vh] overflow-y-auto flex flex-col justify-between"
              >
                <div>
                  {/* Close button */}
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label="Zavřít"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">{card.emoji}</span>
                    <div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${card.tagColor}`}>
                        {card.tag}
                      </span>
                      <h3 className="text-lg font-black text-slate-950 mt-1 leading-tight">
                        {card.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {card.shortDesc}
                  </p>

                  <div className="space-y-3.5 mb-6">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Praktické pokyny & kroky:
                    </h4>
                    <ul className="space-y-2.5">
                      {card.tips.map((tip, idx) => {
                        const parts = tip.split(': ');
                        return (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <span>
                              {parts.length > 1 ? (
                                <>
                                  <strong className="text-slate-950">{parts[0]}:</strong> {parts[1]}
                                </>
                              ) : (
                                tip
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="sm:flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer text-center"
                  >
                    Zavřít
                  </button>
                  <button 
                    onClick={() => {
                      setActiveModal(null);
                      if (onNavigate) onNavigate(card.ctaPath);
                    }}
                    className="sm:flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>{card.ctaText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
