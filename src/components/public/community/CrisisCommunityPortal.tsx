import React from 'react';
import { SeoHead } from '../SeoHead';
import {
  PhoneCall,
  ShieldAlert,
  MessageSquare,
  BookOpen,
  AlertCircle,
  Gavel,
  HandHeart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Printer,
  Compass,
  Building2,
  MapPin,
  ExternalLink,
  Users,
  Scale,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface CrisisCommunityPortalProps {
  onNavigate: (path: string) => void;
}

export const CrisisCommunityPortal: React.FC<CrisisCommunityPortalProps> = ({ onNavigate }) => {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const emergencyContacts = [
    {
      name: '112 • Tísňová linka',
      phone: '112',
      label: 'Volat 112',
      desc: 'Integrovaný záchranný systém — bezprostřední ohrožení života nebo zdraví.',
      bgColor: 'bg-red-600 hover:bg-red-700 text-white',
      badge: 'IZS 24/7',
    },
    {
      name: '158 • Policie ČR',
      phone: '158',
      label: 'Volat 158',
      desc: 'Fyzické napadení, vyhrožování, bezprostřední nebezpečí nebo protiprávní jednání.',
      bgColor: 'bg-rose-700 hover:bg-rose-800 text-white',
      badge: 'Policie 24/7',
    },
    {
      name: '155 • Záchranná služba',
      phone: '155',
      label: 'Volat 155',
      desc: 'Akutní ohrožení zdraví, úraz, kolaps nebo závažný tísňový stav.',
      bgColor: 'bg-amber-600 hover:bg-amber-700 text-white',
      badge: 'ZZS 24/7',
    },
  ];

  const crisisHelplines = [
    {
      name: '116 123 • Linka první psychické pomoci',
      phone: '116 123',
      telLink: 'tel:116123',
      badge: '24/7 ZDARMA',
      desc: 'Anonymní krizová intervence zdarma pro dospělé v akutním psychickém stresu, zmatku nebo náročné životní situaci.',
      source: 'Ministerstvo zdravotnictví ČR / Linka 116 123 (Ověřeno: 2026-09)',
      color: 'border-rose-200 bg-rose-50/60',
    },
    {
      name: '116 111 • Linka bezpečí',
      phone: '116 111',
      telLink: 'tel:116111',
      badge: '24/7 ZDARMA',
      desc: 'Bezplatná krizová linka pro děti, mládež a rodiče řešící závažné krizové situace týkající se dětí.',
      source: 'Z.s. Linka bezpečí (Ověřeno: 2026-09)',
      color: 'border-indigo-200 bg-indigo-50/60',
    },
    {
      name: '116 006 • Bílý kruh bezpečí',
      phone: '116 006',
      telLink: 'tel:116006',
      badge: '24/7 ZDARMA',
      desc: 'Odborná pomoc obětem trestných činů, domácího násilí, vyhrožování a bezdůvodného osočování.',
      source: 'Bílý kruh bezpečí, z.s. (Ověřeno: 2026-09)',
      color: 'border-amber-200 bg-amber-50/60',
    },
    {
      name: '+420 733 642 905 • Liga otevřených mužů (LOM)',
      phone: '+420 733 642 905',
      telLink: 'tel:+420733642905',
      badge: 'Psychologická pomoc',
      desc: 'Odborná psychologická krizová pomoc a poradenství zaměřené na muže v tísni a při rozpadu rodiny.',
      source: 'LOM z.s. (Ověřeno: 2026-09)',
      color: 'border-blue-200 bg-blue-50/60',
    },
    {
      name: '+420 222 580 697 • Pražská linka důvěry',
      phone: '+420 222 580 697',
      telLink: 'tel:+420222580697',
      badge: '24/7 Provoz',
      desc: 'Odborná psychologická intervence a telefonická krizová pomoc v náročných životních okamžicích.',
      source: 'Centrum sociálních služeb Praha (Ověřeno: 2026-09)',
      color: 'border-slate-200 bg-slate-50/80',
    },
  ];

  const portalCards = [
    {
      id: 'sos-plan',
      title: 'SOS Plán pro akutní krizi',
      path: '/sos-plan',
      icon: ShieldAlert,
      badge: 'Akutní pomoc',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-500 text-white',
      borderColor: 'hover:border-rose-300',
      description: '4krokový algoritmus krizového postupu. Emoční STOP, pravidlo 24h, zásady deeskalace a správná evidencia.',
      actionText: 'Otevřít SOS plán',
    },
    {
      id: 'forum',
      title: 'Komunitní fórum a diskuse',
      path: '/forum',
      icon: MessageSquare,
      badge: 'Anonymní diskuse',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      borderColor: 'hover:border-indigo-300',
      description: 'Diskuzní prostor pro sdílení zkušeností v opatrovnických řízeních s přísnou anonymizací dětí.',
      actionText: 'Vstoupit do fóra',
    },
    {
      id: 'pribehy',
      title: 'Příběhy z opatrovnické praxe',
      path: '/pribehy',
      icon: BookOpen,
      badge: 'Kazuistiky',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      borderColor: 'hover:border-amber-300',
      description: 'Reálné anonymizované kazuistiky: Zvládnutí náhlého konfliktu, obnovení kontaktu s dítětem a věcný postup.',
      actionText: 'Číst příběhy',
    },
    {
      id: 'memento',
      title: 'Memento: Procesní chyby otců',
      path: '/memento',
      icon: AlertCircle,
      badge: 'Prevence chyb',
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
      iconBg: 'bg-red-600 text-white',
      borderColor: 'hover:border-red-300',
      description: 'Poučení a rozbor 12 procesních chyb u soudu a OSPOD. Zásady BIFF, deeskalace a bezpečné věcné postupy.',
      actionText: 'Studovat Memento',
    },
    {
      id: 'pravni-poradna',
      title: 'Právní poradna & Judikatura',
      path: '/pravni-poradna',
      icon: Gavel,
      badge: 'Ústavní soud',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      borderColor: 'hover:border-emerald-300',
      description: 'Přehled judikatury Ústavního soudu garantující právo na oba rodiče, propojení s AI poradnou a vzory podání.',
      actionText: 'Otevřít poradnu',
    },
    {
      id: 'podpora',
      title: 'Podpora & Mentorská síť',
      path: '/podpora',
      icon: HandHeart,
      badge: 'Táta-Parťák',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      borderColor: 'hover:border-blue-300',
      description: 'Vrstevnický mentorský program Táta-Parťák, krizové linky a zapojení dobrovolníků s garancí Kodexu.',
      actionText: 'Získat podporu',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Krizový rozcestník & Linky pomoci • Táta má právo"
        description="Rychlá orientace a krizový rozcestník pro otce a rodiče v náročné situaci: tísňové linky, SOS plán, krizová psychologická pomoc, právní poradna, OSPOD, registr a komunita."
        canonicalPath="/krizova-pomoc"
      />

      {/* Akční nástrojová lišta a Tisk */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:hidden flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
          <span className="text-slate-400">Rychlý skok:</span>
          <a href="#tisnove-linky" className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors">
            🚨 Tísňové linky
          </a>
          <a href="#sos-plan-sekce" className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors">
            🛡️ SOS Plán
          </a>
          <a href="#krizove-linky-sekce" className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors">
            📞 Linky pomoci
          </a>
          <a href="#pravo-sekce" className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors">
            ⚖️ Právní poradna
          </a>
          <a href="#instituce-sekce" className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
            🏛️ OSPOD & Registr
          </a>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          <span>Vytisknout Krizový rozcestník</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold">
              <Compass className="w-4 h-4 text-rose-400" />
              <span>Rychlá orientace v krizové situaci</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Krizový rozcestník & Linky pomoci
            </h1>

            <p className="text-slate-200 text-sm sm:text-base leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-xs">
              «Nacházíte se v náročné nebo akutní situaci? Zvolte podle toho, co právě potřebujete. Pokud jste v bezprostředním ohrožení života nebo zdraví, volejte příslušnou tísňovou linku.»
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('/sos-plan')}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Otevřít SOS Plán</span>
              </button>

              <button
                onClick={() => onNavigate('/pravni-poradna')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Gavel className="w-4 h-4 text-emerald-400" />
                <span>Právní poradna</span>
              </button>

              <button
                onClick={() => onNavigate('/forum')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Komunitní fórum</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEKCE B: BEZPROSTŘEDNÍ OHROŽENÍ (Tísňová volání) */}
      <div id="tisnove-linky" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-black text-rose-700 uppercase tracking-wider block">
                  Akutní tísňové volání
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  BEZPROSTŘEDNÍ OHROŽENÍ ŽIVOTA, ZDRAVÍ NEBO BEZPEČÍ
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black tracking-wider uppercase shrink-0 self-start sm:self-center">
              VOLÁNÍ ZDARMA 24/7
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emergencyContacts.map((contact, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-slate-900">{contact.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-extrabold text-[10px]">
                      {contact.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {contact.desc}
                  </p>
                </div>

                <a
                  href={`tel:${contact.phone}`}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer min-h-[48px] ${contact.bgColor}`}
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{contact.label}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEKCE C: POTŘEBUJI STABILIZOVAT SITUACI (SOS Plán) */}
      <div id="sos-plan-sekce" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Potřebuji stabilizovat situaci</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              🚨 SOS krizový plán pro první kroky v krizi
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              «Praktický postup pro první kroky v akutní krizové situaci. Emoční STOP, pravidlo 24h, zásady deeskalace komunikace a zajištění důkazní stopy.»
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('/sos-plan')}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Otevřít SOS plán</span>
            </button>

            <button
              onClick={() => onNavigate('/sos-plan/48-hodin')}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-amber-400" />
              <span>48hodinový plán</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKCE D: POTŘEBUJI PSYCHOLOGICKOU / KRIZOVOU POMOC (Linky pomoci) */}
      <div id="krizove-linky-sekce" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block">
              Důvěrná & anonymní podpora
            </span>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-6 h-6 text-indigo-600" />
              <span>Nonstop Krizové linky psychické pomoci</span>
            </h2>
          </div>

          <button
            onClick={() => onNavigate('/podpora')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Mentorská síť & Táta-Parťák</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crisisHelplines.map((line, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between space-y-4 ${line.color}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-slate-900">{line.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 text-[10px] font-black border border-slate-200">
                    {line.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {line.desc}
                </p>

                <div className="pt-1 text-[11px] text-slate-500 italic">
                  Zdroj: {line.source}
                </div>
              </div>

              <a
                href={line.telLink}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Volat {line.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* SEKCE E: POTŘEBUJI PRÁVNÍ POMOC */}
      <div id="pravo-sekce" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block">
                Právní orientace & Judikatura
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Potřebuji právní pomoc
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            «Pokud potřebujete posoudit konkrétní právní situaci, postup nebo dokument, využijte právní poradnu. Opatrovnická řízení se řídí nejlepším zájmem dítěte a ústavním právem na péči obou rodičů. Využijte ověřené judikáty a doporučení.»
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => onNavigate('/pravni-poradna')}
              className="p-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <strong className="text-xs font-black text-emerald-900 block mb-1">
                  ⚖️ Právní poradna
                </strong>
                <span className="text-[11px] text-slate-600 block">
                  Judikatura Ústavního soudu, vzory a konzultace.
                </span>
              </div>
              <span className="mt-4 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Otevřít poradnu →
              </span>
            </button>

            <button
              onClick={() => onNavigate('/memento')}
              className="p-5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <strong className="text-xs font-black text-rose-900 block mb-1">
                  ⚠️ Memento otců
                </strong>
                <span className="text-[11px] text-slate-600 block">
                  Poučení z 12 procesních chyb otců u soudu a OSPOD.
                </span>
              </div>
              <span className="mt-4 text-xs font-bold text-rose-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Studovat Memento →
              </span>
            </button>

            <button
              onClick={() => onNavigate('/judikatura')}
              className="p-5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <strong className="text-xs font-black text-indigo-900 block mb-1">
                  📜 Přelomová judikatura
                </strong>
                <span className="text-[11px] text-slate-600 block">
                  Nálezy Ústavního a Nejvyššího soudu ČR.
                </span>
              </div>
              <span className="mt-4 text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Zobrazit judikáty →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKCE F & G: POTŘEBUJI POMOC S DÍTĚTEM / OSPOD A NAJÍT INSTITUCI */}
      <div id="instituce-sekce" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-black text-blue-700 uppercase tracking-wider block">
                Instituce, OSPOD & Poradny
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Potřebuji pomoc s dítětem / najít OSPOD nebo poradnu
              </h2>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              «Pokud se situace týká péče o dítě, jeho bezpečí nebo problémů s kontaktem s druhým rodičem, může být důležité obrátit se na příslušný OSPOD a situaci věcně zdokumentovat.»
            </p>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-slate-900 block font-bold">💡 Neutrální doporučení:</strong>
              <p>
                «Pokud je kontakt s dítětem náhle a závažně omezen, zvažte bezodkladnou konzultaci právního postupu a podle okolností také kontakt s příslušnými institucemi.»
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => onNavigate('/ospod')}
              className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <strong className="text-xs font-black text-slate-900 block mb-1">
                  🏛️ Průvodce OSPOD
                </strong>
                <span className="text-[11px] text-slate-600 block">
                  Jak věcně a konstruktivně jednat s orgány sociálně-právní ochrany dětí.
                </span>
              </div>
              <span className="mt-4 text-xs font-bold text-slate-800 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Otevřít průvodce →
              </span>
            </button>

            <button
              onClick={() => onNavigate('/registr-subjektu')}
              className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <strong className="text-xs font-black text-slate-900 block mb-1">
                  📋 Registr subjektů
                </strong>
                <span className="text-[11px] text-slate-600 block">
                  Katalog advokátů, mediátorů, psychologů a krizových center.
                </span>
              </div>
              <span className="mt-4 text-xs font-bold text-slate-800 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Vyhledat v registru →
              </span>
            </button>

            <button
              onClick={() => onNavigate('/mapa-subjektu')}
              className="p-5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-left transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <strong className="text-xs font-black text-slate-900 block mb-1">
                  🗺️ Mapa institucí & poraden
                </strong>
                <span className="text-[11px] text-slate-600 block">
                  Interaktivní mapa soudů, OSPOD a poraden ve vašem regionu.
                </span>
              </div>
              <span className="mt-4 text-xs font-bold text-slate-800 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Otevřít mapu →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKCE H: POTŘEBUJI MLUVIT S LIDMI (Komunita) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-wider block">
              Vrstevnická podpora
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Potřebuji mluvit s lidmi (Komunita & Mentoři)
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Sdílejte zkušenosti s otci, kteří si prošli podobnými situacemi. Využijte anonymní komunitní fórum nebo se spojte s vrstevnickým mentorem z programu Táta-Parťák.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => onNavigate('/forum')}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Vstoupit do fóra</span>
            </button>

            <button
              onClick={() => onNavigate('/podpora')}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm border border-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HandHeart className="w-4 h-4 text-blue-600" />
              <span>Táta-Parťák</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Vizuálních Karet Sekcí Modulu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
            Přehledový rozcestník
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            6 pilířů krizové pomoci a komunitního zázemí
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portalCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate(card.path)}
                className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group ${card.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full border font-bold text-[10px] ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>{card.actionText}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rychlá garance a zásady komunity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block mb-0.5">Anonymita & bezpečí</strong>
              <p className="text-[11px] text-slate-600 leading-normal">
                Všechna data, příspěvky i kazuistiky jsou přísně anonymizovány k ochraně osobních údajů dětí a rodičů.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block mb-0.5">Rychlost rozhoduje</strong>
              <p className="text-[11px] text-slate-600 leading-normal">
                První hodiny a dny mohou významně ovlivnit další vývoj situace. S naším algoritmem neuděláte osudovou chybu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block mb-0.5">Nejlepší zájem dítěte</strong>
              <p className="text-[11px] text-slate-600 leading-normal">
                Nepodporujeme boj proti matkám, ale konstruktivní hájení práva dítěte na péči obou milujících rodičů.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
