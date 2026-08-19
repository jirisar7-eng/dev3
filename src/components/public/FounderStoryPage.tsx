import React from 'react';
import { SeoHead } from './SeoHead';
import { Heart, Compass, Shield, Award, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

interface FounderStoryPageProps {
  onNavigate?: (path: string) => void;
}

export const FounderStoryPage: React.FC<FounderStoryPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-500">
      <SeoHead
        title="Příběh zakladatele projektu • Táta má právo & Synthesis OS"
        description="Osobní příběh, motivace a vize stojící za vznikem platformy Táta má právo a operačního systému Synthesis OS."
        canonicalPath="/cesta-zakladatele"
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Synthesis OS • Osobní příběh &amp; mise</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Cesta zakladatele projektu
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed">
            Proč vznikla platforma <strong className="text-white">Táta má právo</strong>? Osobní zkušenost s opatrovnickým systémem, hledání spravedlnosti a vize digitální infrastruktury pro rodiny v krizi.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onNavigate?.('/o-projektu')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <span>O projektu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate?.('/kontakt')}
              className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-all"
            >
              Kontaktovat zakladatele
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Blocks */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">1. Když se zhroutí jistoty</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Každý velký projekt obvykle začíná hlubokou osobní krizí nebo silným impulzem. Platforma <strong className="text-slate-900">Táta má právo</strong> (součást ekosystému Synthesis OS) nevznikla u rýsovacího prkna marketingové agentury, ale z reálné potřeby v situaci, kdy se rodinný svět rozpadl a otcové se ocitli v labyrintu institucí, o kterých dříve nic nevěděli.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            V okamžiku, kdy dojde k rozchodu nebo rozvodu, se rodičovská role často zužuje na boj o termíny, peníze a paragrafy. Právní systém může působit chladně, nepřehledně a vyčerpávajícím dojmem. Právě tehdy vzniká pocit bezmocnosti: <em>„Kde mám hledat informace? Kdo mi řekne pravdu? Proč nikde neexistuje jedno přehledné místo?“</em>
          </p>
        </div>

        <blockquote className="bg-blue-50/60 border-l-4 border-blue-600 p-6 rounded-r-2xl my-6 shadow-sm">
          <p className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight leading-snug">
            „Otec není návštěva. Otec není pouze plátce výživného. Otec je rodič, který má mít právo být součástí života svého dítěte.“
          </p>
          <span className="block mt-2 text-sm font-bold text-blue-700">— Jiří Šár, zakladatel projektu</span>
        </blockquote>

        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">2. Od poznání k systémovému řešení</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Pozorování praxe v opatrovnických řízeních ukázalo, že největším nepřítelem otců (a rodin obecně) není zlá vůle jednotlivců, ale <strong className="text-slate-900">neinformovanost, roztříštěnost dat a absence metodiky</strong>. Otcové často přicházejí k soudu nepřipraveni, bez znalosti svých procesních práv, bez přehledu o judikatuře a s emocemi, které jim v konfrontaci s institucemi nepomáhají.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Zjištění, že statisíce rodin řeší totožné problémy zcela izolovaně, vedlo k rozhodnutí vybudovat otevřenou digitální platformu. Ne šedou zónu plnou stížností a obviňování, ale moderní odborný portál poskytující reálné nástroje, vzory podání, judikaturu a systematické poradenství.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Právní jistota &amp; fakta</h3>
            <p className="text-slate-600 leading-relaxed">
              Všechny výstupy a materiály vycházejí z platné legislativy České republiky, judikatury Ústavního a Nejvyššího soudu a ověřených odborných studií.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Dítě v centru zájmu</h3>
            <p className="text-slate-600 leading-relaxed">
              Hlavním motorem projektu je ochrana nejlepšího zájmu dítěte. Cílem není eskalace konfliktů, ale kultivace komunikace a nalezení stabilního uspořádání péče.
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">3. Vize Synthesis OS &amp; budoucnost</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Projekt <strong className="text-slate-900">Táta má právo</strong> se postupně vyvinul v robustní ekosystém pod hlavičkou <strong className="text-slate-900">Synthesis OS</strong>. Spojuje moderní webové technologie, krizové akční plány SOS, analyzátory spisů, kalkulačky výživného a bezpečné úložiště pro správu opatrovnických případů.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Cesta zakladatele pokračuje rozvojem komunity, vzděláváním dobrovolníků a prosazováním spravedlivého a předvídatelného přístupu v rodinném právu.
          </p>
        </div>

        <div className="bg-blue-900 text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-black">Chcete podpořit naši misi?</h3>
            <p className="text-blue-200">Připojte se k naší komunitě dobrovolníků nebo podpořte provoz portálu.</p>
          </div>
          <button
            onClick={() => onNavigate?.('/podporte-nas')}
            className="px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-xl transition-all shadow-md whitespace-nowrap"
          >
            Podpořit projekt
          </button>
        </div>
      </div>
    </div>
  );
};
