import React from 'react';
import { AlertTriangle, Globe, MapPin, Building, Clock, ArrowRight } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface InternationalDisputesGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const InternationalDisputesGuideView: React.FC<InternationalDisputesGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Mezinárodní spory o dítě a únos dítěte"
        description="Průvodce přeshraničními opatrovnickými spory, Haagskou úmluvou a pomocí Úřadu pro mezinárodněprávní ochranu dětí (ÚMPOD)."
        canonicalPath="/mezinarodni-spory"
      />

      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Přeshraniční rodinné právo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Mezinárodní spory o dítě
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Co dělat, pokud se druhý rodič odstěhuje s dítětem do zahraničí bez vašeho souhlasu. Orientace v Haagské úmluvě a role ÚMPOD.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> U mezinárodních sporů o dítě jde doslova o čas. Neprodleně vyhledejte advokáta specializujícího se na mezinárodní právo rodinné nebo kontaktujte ÚMPOD. Tento text má pouze informativní charakter.
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-indigo-600" /> Mezinárodní rodičovský únos
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            V rodinném právu se "únosem" rozumí <strong>neoprávněné přemístění nebo zadržení dítěte</strong> mimo stát jeho obvyklého bydliště, a to bez souhlasu druhého rodiče, který má právo péče.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Obvyklé bydliště:</strong> Určuje, soudy kterého státu mají pravomoc ve věci rozhodovat. Dítě nemůže "obvyklé bydliště" změnit jen tím, že ho matka/otec na týden odveze k babičce do ciziny a už se nevrátí.</li>
            <li><strong>Zadržení:</strong> O únos jde i tehdy, pokud jste dali souhlas k dovolené na 14 dní v zahraničí, ale druhý rodič tam s dítětem bez domluvy zůstal.</li>
            <li><strong>Důsledek:</strong> Soudy ve státě, kam bylo dítě přemístěno, obvykle nesmí rozhodovat o péči a výživném, dokud se nevyřeší řízení o návrat dítěte podle Haagské úmluvy.</li>
          </ul>
        </div>
      </section>

      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Building className="w-6 h-6 text-indigo-400" /> Úřad pro mezinárodněprávní ochranu dětí (ÚMPOD)
        </h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            ÚMPOD (sídlící v Brně) funguje v ČR jako ústřední orgán pro aplikaci Haagské úmluvy. Jeho služby jsou pro rodiče obvykle bezplatné.
          </p>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
            <div>
              <strong className="text-indigo-400 block mb-1">Co ÚMPOD umí</strong>
              Pomůže zprostředkovat komunikaci s ústředním orgánem cizího státu, zjistit místo pobytu dítěte, pomoci podat návrh na navrácení dítěte nebo zprostředkovat mezinárodní rodinnou mediaci.
            </div>
            <div>
              <strong className="text-amber-400 block mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Běží vám čas
              </strong>
              Klíčovou podmínkou pro aplikaci Haagské úmluvy je podat návrh na navrácení do <strong>1 roku</strong> od únosu. Pokud uběhne rok, soud může návrat zamítnout s tím, že dítě už se v novém prostředí usadilo. Reagujte ihned (v řádu týdnů).
            </div>
          </div>
          <a href="https://www.umpod.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mt-4 font-bold">
            Přejít na oficiální web ÚMPOD <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Úřad pro mezinárodněprávní ochranu dětí (ÚMPOD), Haagská úmluva o občanskoprávních aspektech mezinárodních únosů dětí (Sdělení MZV č. 34/1998 Sb.), Zákon č. 91/2012 Sb. (o mezinárodním právu soukromém). Aktuálnost ověřena k: Srpen 2026.
      </div>
    </div>
  );
};
