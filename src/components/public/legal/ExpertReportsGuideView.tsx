import React from 'react';
import { AlertTriangle, BookOpen, Brain, CheckCircle2, AlertOctagon, Scale } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface ExpertReportsGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const ExpertReportsGuideView: React.FC<ExpertReportsGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Znalecké posudky v opatrovnickém řízení"
        description="Průvodce znaleckým dokazováním. Co čekat od znalce, jak se připravit a jak reagovat na nesrovnalosti v posudku."
        canonicalPath="/znalecke-posudky"
      />

      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <Brain className="w-4 h-4 text-indigo-400" />
            <span>Znalecké posudky</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Znalci a dokazování
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Role znalce, průběh znaleckého zkoumání, jak se na něj připravit a jak se bránit vůči případným chybám.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Tento obsah má pouze informační charakter a nenahrazuje individuální právní poradenství. Opatrovnické a psychologické posudky podléhají hodnocení soudu.
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Co je znalecký posudek a průběh
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            V případech, kdy je spor velmi vyostřený, nebo panují neshody o výchovných schopnostech rodičů, může soud nařídit zpracování <strong>znaleckého posudku</strong> z oboru psychiatrie nebo psychologie.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Ustanovení znalce:</strong> Znalce ustanovuje soud svým usnesením a formuluje mu konkrétní otázky k posouzení.</li>
            <li><strong>Průběh zkoumání:</strong> Obvykle zahrnuje psychodiagnostické testy, osobní pohovory s rodiči a vyšetření dítěte (často včetně zkoumání interakce s oběma rodiči).</li>
            <li><strong>Dokumenty:</strong> Znalec primárně vychází z nařízení soudu a ze soudního spisu. Jakékoli další důkazy znalci předkládejte pouze pokud se týkají vašich výchovných schopností nebo zdraví dítěte (s přihlédnutím k jeho otázkám).</li>
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Příprava a komunikace se znalcem
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Buďte autentičtí a věcní:</strong> Odpovídejte na otázky pravdivě, klidně a stručně. Neutíkejte od tématu.</li>
            <li><strong>Neútočte na druhého rodiče:</strong> Znalec hodnotí i váš postoj k druhému rodiči. Destruktivní kritika se obrátí proti vám. Popisujte pouze objektivní fakta ovlivňující dítě.</li>
            <li><strong>Vyhněte se autodiagnostice:</strong> <strong>Neurčujte druhým diagnózy.</strong> Neříkejte znalci, že je bývalá partnerka "narcis" nebo "psychopat". Místo toho popisujte její konkrétní jednání a jaký to má dopad na dítě.</li>
          </ul>
        </div>
      </section>

      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-400" /> Obrana proti nesprávnému posudku
        </h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Znalec není soudce. Soud hodnotí posudek jako jeden z důkazů, i když velmi vlivný. Pokud posudek obsahuje zjevné chyby:
          </p>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
            <div>
              <strong className="text-indigo-400 block mb-1">Fakta vs. Interpretace</strong>
              Rozlišujte, zda znalec uvedl špatný fakt (např. spletl věk, ignoroval jasný lékařský záznam), nebo zda nesouhlasíte s jeho odbornou interpretací. Chyby ve faktech se vyvracejí snáze.
            </div>
            <div>
              <strong className="text-amber-400 block mb-1">Výslech znalce u soudu</strong>
              Máte právo žádat, aby byl znalec předvolán k soudu a tam mu s vaším advokátem můžete klást otázky k jeho závěrům a metodice.
            </div>
            <div>
              <strong className="text-rose-400 block mb-1">Revizní posudek</strong>
              V krajním případě, pokud jsou v posudku zásadní vady nebo si odporuje, lze u soudu žádat vypracování tzv. revizního posudku (novým znalcem nebo znaleckým ústavem). Toto je nutné důkladně probrat s advokátem, jde o nákladný proces.
            </div>
          </div>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Zákon č. 99/1963 Sb. (o.s.ř.), Zákon č. 254/2019 Sb., o znalcích, znaleckých kancelářích a znaleckých ústavech. Aktuálnost ověřena k: Srpen 2026. Upozornění: Nevytvářejte pro znalce falešné důkazy a nesnažte se manipulovat psychodiagnostické testy.
      </div>
    </div>
  );
};
