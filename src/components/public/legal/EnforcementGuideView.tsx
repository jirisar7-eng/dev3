import React from 'react';
import { AlertTriangle, ShieldCheck, FileText, CheckCircle2, Info, Gavel, Scale, AlertOctagon } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface EnforcementGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const EnforcementGuideView: React.FC<EnforcementGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Maření styku a výkon rozhodnutí"
        description="Průvodce vymáháním práva na styk s dítětem. Jak dokumentovat maření styku, ukládání pokut a soudní výkon rozhodnutí."
        canonicalPath="/vykon-rozhodnuti"
      />

      <div className="bg-gradient-to-br from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold mb-4">
            <ShieldCheck className="w-4 h-4 text-rose-400" />
            <span>Maření styku a výkon rozhodnutí</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Vymáhání péče a styku
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Co dělat, když druhý rodič nerespektuje soudní rozhodnutí, jak dokumentovat incidenty a kdy podat návrh na soudní výkon rozhodnutí.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Tento obsah má pouze informační charakter a nenahrazuje individuální právní poradenství ani zastoupení advokátem. Postup soudu se řídí § 500 a násl. zákona č. 292/2013 Sb. (z.ř.s.).
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Dokumentace a chronologie
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Při opakovaném maření styku je klíčová kvalitní dokumentace. Soud zajímají objektivní fakta, nikoli emoce.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Záznam incidentů:</strong> Evidujte každé neuskutečněné předání (datum, čas, místo, důvod udaný druhým rodičem). Můžete využít Spolurodičovský Hub nebo vlastní deník.</li>
            <li><strong>Fakta vs. Domněnky:</strong> "Matka nepřišla na místo předání a na SMS reagovala až za 2 hodiny s tím, že dítě spí" je <strong>fakt</strong>. "Matka mě chce zničit a dítě schválně zatajuje" je <strong>hodnocení/domněnka</strong>, kterou do soudních návrhů nepište.</li>
            <li><strong>Uchovávání komunikace:</strong> Zálohujte e-maily a SMS zprávy. Nemažte je, ani když jsou nepříjemné. Tvoří klíčový důkaz.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-rose-600" /> Kdo vám může a nemůže pomoci
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> Policie ČR
            </h3>
            <p>
              Policie <strong>neřeší opatrovnické spory ani nevymáhá styk</strong>. Policie nepojede k matce domů "zabavit dítě", pokud máte v ruce rozsudek. Policii volejte pouze při reálném ohrožení zdraví nebo života. Lze u ní učinit úřední záznam o tom, že k předání nedošlo, ale často vás policisté odkážou rovnou na OSPOD nebo soud.
            </p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> OSPOD a Odborníci
            </h3>
            <p>
              OSPOD by měl být o problémech informován. Může s rodiči promluvit a upozornit je na následky neplnění rozsudku. OSPOD však <strong>nemůže nařídit</strong> výkon rozhodnutí. K řešení vleklých sporů je vhodné zvážit mediaci, rodinnou terapii a pomoc advokáta.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Gavel className="w-6 h-6 text-indigo-400" /> Soudní výkon rozhodnutí
        </h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Základním předpokladem pro donucení je <strong>vykonatelné soudní rozhodnutí</strong> nebo schválená dohoda.
          </p>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
            <div>
              <strong className="text-indigo-400 block mb-1">1. Výzva soudu</strong>
              Soud může rodiči usnesením uložit výzvu, aby rozsudek plnil, a upozorní jej na následky neplnění (§ 502 z.ř.s.).
            </div>
            <div>
              <strong className="text-amber-400 block mb-1">2. Ukládání pokut</strong>
              Pokud výzva nevede k nápravě, může soud nařídit výkon rozhodnutí uložením pokuty (až do výše 50 000 Kč). Pokuty lze ukládat i opakovaně (§ 503 z.ř.s.).
            </div>
            <div>
              <strong className="text-rose-400 block mb-1">3. Odnětí dítěte (Krajní řešení)</strong>
              Zcela výjimečně, pokud mírnější prostředky selžou a je to v zájmu dítěte, může soud nařídit odnětí dítěte tomu, u koho nemá být, a jeho předání druhému rodiči (§ 504 z.ř.s.).
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Zákon č. 292/2013 Sb., o zvláštních řízeních soudních (§ 500 a násl.). Ministerstvo spravedlnosti ČR. Aktuálnost ověřena k: Srpen 2026. Informace neslouží jako právní rada. V případě chronického maření styku bezodkladně vyhledejte specializovaného advokáta. Exekutoři rodinné právo ohledně dětí nevykonávají (řeší se soudně).
      </div>
    </div>
  );
};
