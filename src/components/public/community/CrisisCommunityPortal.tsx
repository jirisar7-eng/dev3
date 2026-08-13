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
  HeartHandshake
} from 'lucide-react';

interface CrisisCommunityPortalProps {
  onNavigate: (path: string) => void;
}

export const CrisisCommunityPortal: React.FC<CrisisCommunityPortalProps> = ({ onNavigate }) => {
  const portalCards = [
    {
      id: 'sos-plan',
      title: 'SOS Plán prvních 72 hodin',
      path: '/sos-plan',
      icon: ShieldAlert,
      badge: 'Akutní pomoc',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      iconBg: 'bg-rose-500 text-white',
      borderColor: 'hover:border-rose-300',
      description: '4-kroký algoritmus krizového postupu. Emoční STOP, pravidlo 24h, zásady BIFF komunikace, okamžitá evidence a správná formulace podání.',
      actionText: 'Otevřít SOS plán',
    },
    {
      id: 'forum',
      title: 'Komunitní fórum a diskuse',
      path: '/forum',
      icon: MessageSquare,
      badge: '5 Kategorií',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      borderColor: 'hover:border-indigo-300',
      description: 'Diskuzní prostor pro sdílení zkušeností v opatrovnických řízeních. Přísná anonymizace dětí a nulová tolerance k eskalaci.',
      actionText: 'Vstoupit do fóra',
    },
    {
      id: 'pribehy',
      title: 'Příběhy z opatrovnické praxe',
      path: '/pribehy',
      icon: BookOpen,
      badge: '3 Kazuistiky',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-500 text-white',
      borderColor: 'hover:border-amber-300',
      description: 'Reálné anonymizované kazuistiky: Střídavá péče u 10měsíčního kojence, zvládnutí 14 měsíců křivého obvinění i obnova vztahu po manipulaci.',
      actionText: 'Číst příběhy',
    },
    {
      id: 'memento',
      title: 'Memento: Procesní chyby otců',
      path: '/memento',
      icon: AlertCircle,
      badge: 'Prevence rizika',
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
      iconBg: 'bg-red-600 text-white',
      borderColor: 'hover:border-red-300',
      description: 'Rozbor 4 nejčastějších fatálních chyb otců u soudu: SMS v 1:00 ráno v afektu, počáteční ustupování, osobní pomsta a útoky na sociálních sítích.',
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
      description: 'Klíčové nálezy Ústavního soudu garantující právo na oba rodiče, propojení s AI Opatrovnickým Asistentem Synthesis OS a vzory ke stažení.',
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
      description: 'Kontakty na nonstop krizové linky, vrstevnický program Peer Mentorů a možnost zapojení dobrovolníků s garancí Kodexu.',
      actionText: 'Získat podporu',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Krizová pomoc & Komunita • Táta má právo"
        description="Komplexní modul prvé pomoci pro otce v opatrovnické krizi: SOS plán, Fórum, Kazuistiky, Memento procesních chyb, Právní poradna a Mentorská síť."
        canonicalPath="/krizova-pomoc"
      />

      {/* Akutní Krizová Lišta První Psychické Pomoci */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-lg border-b border-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-pulse">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  Akutní krizová linka první psychické pomoci
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black tracking-wider uppercase">
                  24/7 ZDARMA
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium">
                Jste v akutním stresu, zmatku nebo krizi? Anonymní odborná pomoc na čísle <strong className="text-white text-sm">116 123</strong>.
              </p>
            </div>
          </div>
          <a
            href="tel:116123"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs transition-all shadow-md shrink-0 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Volat 116 123</span>
          </a>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Modul 1.0 • Krizová pomoc & Komunita</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 leading-tight">
              Nejste v tom sami. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300">
                Krizová opora a právní jistota pro otce.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
              Okamžitá psychická a právní opora pro otce, kteří čelí akutnímu opatrovnickému konfliktu, odepření styku s dítětem nebo partnerské krizi. Nabízíme strukturované postupy, odbornou poradnu a komunitní solidaritu.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate('/sos-plan')}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Otevřít SOS Plán (72h)</span>
              </button>

              <button
                onClick={() => onNavigate('/forum')}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Vstoupit do Komunitního Fóra</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Vizuálních Karet Sekcí */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
            Rozcestník modulu
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            6 pilířů krizové pomoci a komunitního zázemí
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Zvolte podsekci podle vaší aktuální situace – od okamžitého krizového algoritmu po právní vzory.
          </p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block mb-0.5">100% Anonymita & Bezpečí</strong>
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
                Prvních 72 hodin určuje budoucí procesní stav. S naším algoritmem neuděláte osudovou chybu.
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
