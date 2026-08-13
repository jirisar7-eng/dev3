import React from 'react';
import { SeoHead } from './SeoHead';
import { Award, HeartHandshake, ShieldCheck, Zap, Globe, Building } from 'lucide-react';

interface SponsorsViewProps {
  onNavigate: (path: string) => void;
}

export const SponsorsView: React.FC<SponsorsViewProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-500">
      <SeoHead
        title="Sponzoři • Táta má právo"
        description="Seznamte se s partnery, sponzory a dárci portálu Táta má právo, kteří podporují rozvoj vzdělávacích materiálů a bezplatné právní orientace pro otce."
        canonicalPath="/sponzori"
      />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs uppercase tracking-wider">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Naši sponzoři a dárci</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Děkujeme za vaši podporu
        </h1>
        <p className="text-base md:text-lg text-slate-600 leading-relaxed">
          Provoz a neustálý rozvoj portálu <strong className="text-slate-900">Táta má právo</strong> závisí na pomoci partnerů, technologických dárců a dobrodinců, kterým není lhostejný spravedlivý přístup k dětem.
        </p>
      </div>

      {/* Sponsor Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            Generální partner
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Algotech & Cloud Systems</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Poskytovatel robustní serverové infrastruktury, cloudového hostingu a zabezpečení databáze pro naše AI modely a registr subjektů.
          </p>
          <div className="pt-2 text-xs font-bold text-amber-800 flex items-center gap-1">
            <span>Hlavní technologický sponzor</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            Hlavní dárce
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Fond spravedlivé péče</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nezisková iniciativa podporující osvětu o střídavé péči, právech dětí na oba rodiče a rovnoprávném postavení otců v rodinném právu.
          </p>
          <div className="pt-2 text-xs font-bold text-blue-600 flex items-center gap-1">
            <span>Partner grantového programu</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
            Podporovatel
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Advokátní kancelář JUDr. V.</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Dlouhodobý partner poskytující odborné konzultace pro tvorbu vzorů právních podání a revizi judikatury Ústavního soudu.
          </p>
          <div className="pt-2 text-xs font-bold text-emerald-700 flex items-center gap-1">
            <span>Odborný garant</span>
          </div>
        </div>
      </div>

      {/* Call to action for becoming a sponsor */}
      <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-xl">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Chcete se stát sponzorem?</span>
          <h2 className="text-2xl font-bold">Podpořte osvětu a práva dětí na oba rodiče</h2>
          <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
            Každý příspěvek pomáhá udržovat provoz serverů, rozšiřovat bezplatný registr subjektů ve 14 krajích ČR a poskytovat materiály otcům v nouzi.
          </p>
        </div>
        <button
          onClick={() => onNavigate('/kontakt')}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-colors whitespace-nowrap shadow-lg shadow-blue-600/30"
        >
          Kontaktovat pro spolupráci
        </button>
      </div>
    </div>
  );
};
