import React from 'react';
import { SeoHead } from './SeoHead';
import { ShieldCheck, Heart, Scale, Users, Target, BookOpen, Award } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-500">
      <SeoHead
        title="O projektu • Táta má právo & tatovacesta.cz"
        description="Přečtěte si o poslání portálu Táta má právo. Poskytujeme komplexní oporu pro otce a rodiče v opatrovnických řízeních s důrazem na nejlepší zájem dítěte."
        canonicalPath="/o-nas"
      />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>O projektu tatovacesta.cz</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Právo na oba rodiče a spravedlivou péči
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          Portál <strong className="text-slate-900">Táta má právo</strong> vznikl jako odpověď na krizi v oblasti opatrovnického soudnictví a rodinného práva v České republice. Pomáháme otcům orientovat se v právních labyrintech, zvládat psychický tlak a hájit nejlepší zájem svých dětí.
        </p>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Odborná právní orientace</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Poskytujeme přehled judikatury Ústavního soudu, vzory procesních podání, návrhů na svěření do péče a metodiky pro jednání s OSPOD a soudy.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">AI Asistenti a Simulátory</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Využíváme moderní umělou inteligenci k analýze spisů, přípravě na soudní jednání a tréninku komunikačních strategií bez emocí (metoda BIFF).
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Podpora komunity</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Propojujeme otce v podobných situacích, sdílíme reálné příběhy úspěšných obhajob a poskytujeme bezpečný prostor pro vzájemnou svépomoc.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-blue-300 font-bold text-xs uppercase tracking-wider">
          <Target className="w-4 h-4" />
          <span>Naše vize</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
          Žádné dítě by nemělo ztratit milujícího rodiče kvůli administrativním průtahům nebo předsudkům.
        </h2>
        <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl">
          Věříme v rovnocenné rodičovství, v němž oba rodiče (otec i matka) hrají aktivní a rovnocennou roli v životě dítěte po rozvodu či rozpadu vztahu. Naším cílem je kultivovat české rodinné právo a poskytovat konkrétní nástroje, které vedou k mimosoudním dohodám a rychlému urovnání sporů.
        </p>
        <div className="pt-4 flex flex-wrap gap-4">
          <button
            onClick={() => onNavigate('/registr-subjektu')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/30"
          >
            Prozkoumat registr subjektů
          </button>
          <button
            onClick={() => onNavigate('/kontakt')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20"
          >
            Kontaktujte nás
          </button>
        </div>
      </div>
    </div>
  );
};
