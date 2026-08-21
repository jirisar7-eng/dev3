import React from 'react';
import { AlertTriangle, BookOpen, FileText, CheckCircle2, GraduationCap, Users, Calculator, Link as LinkIcon } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface SchoolsGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const SchoolsGuideView: React.FC<SchoolsGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Práva rodičů ve škole a školce"
        description="Průvodce komunikací se školou, školními informačními systémy (Bakaláři, EduPage), změnou školy a náklady."
        canonicalPath="/skola"
      />

      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Vzdělávání dítěte</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Školy a školky
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Práva rodičů ve vztahu ke vzdělávacím institucím. Jak si zajistit informace o prospěchu, řešit omluvenky, třídní schůzky a neshody ohledně změny školy.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Tento obsah má pouze informační charakter a nenahrazuje individuální právní poradenství. Technické řešení přístupů (např. EduPage/Bakaláři) závisí i na možnostech konkrétní školy.
        </p>
      </div>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" /> Práva rodiče vůči škole a školce
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Vzdělávání je zásadní součástí rodičovské odpovědnosti, kterou mají <strong>oba rodiče</strong> (pokud soud nerozhodl jinak), nezávisle na tom, u koho dítě žije.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Informace:</strong> Škola má povinnost poskytovat informace o vzdělávání a chování dítěte oběma rodičům (včetně prospěchu, hodnocení a akcí).</li>
            <li><strong>Omluvenky a komunikace:</strong> Rodič, u kterého se dítě aktuálně zdržuje, má plné právo dítě omlouvat, komunikovat s třídním učitelem a účastnit se třídních schůzek (buď samostatně, nebo společně s druhým rodičem).</li>
            <li><strong>Vyzvedávání:</strong> Pokud není soudním rozhodnutím výslovně zakázán styk, může školka/škola vydat dítě oběma rodičům. Škola však není a nesmí být místem výkonu rozhodnutí nebo "přetahování" o dítě. Rodiče by měli školu předem informovat o harmonogramu péče.</li>
          </ul>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Školní informační systémy (Bakaláři, EduPage)
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Máte právo na zajištění vlastního přístupu do elektronických systémů školy (Bakaláři, EduPage, Škola OnLine atd.). 
          </p>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2">Jak postupovat:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Písemně (e-mailem) požádejte třídního učitele nebo ředitele školy o vytvoření vlastního rodičovského účtu.</li>
              <li>Školy už na tuto praxi bývají zvyklé. Pokud s tím má škola technický problém (např. systém podporuje jen jeden email na rodinu), trvejte na tom, že právo na informace máte, a požadujte po škole alternativní řešení (např. přeposílání zpráv z daného systému).</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" /> Změna školy nebo školky
        </h2>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Výběr vzdělávací instituce (nebo změna školy/školky, přestup) patří mezi <strong>významné záležitosti dítěte</strong> podle občanského zákoníku (§ 877).
          </p>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
            <div>
              <strong className="text-indigo-400 block mb-1">Dohoda je nutná</strong>
              Jeden rodič nemůže jednostranně dítě odhlásit ze stávající školy a zapsat do jiné bez souhlasu druhého rodiče.
            </div>
            <div>
              <strong className="text-amber-400 block mb-1">Co dělat při neshodě</strong>
              Pokud se rodiče nedohodnou na přestupu, může se kterýkoli z nich obrátit na soud, aby v této věci nahradil souhlas druhého rodiče. Zkoumá se, co je v nejlepším zájmu dítěte (dojíždění, kolektiv, vzdělávací program).
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" /> Školní a mimoškolní výdaje
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Náklady spojené se školou (pomůcky, lyžařské kurzy, kroužky) bývají častým zdrojem konfliktů.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Běžné náklady vs. Mimořádné výdaje:</strong> Běžné náklady by měly být pokryty z výživného. Mimořádné, nepravidelné výdaje (rovnátka, lyžařský kurz za 10 000 Kč) se často řeší dohodou mimo výživné.</li>
            <li>Neexistuje automatické pravidlo, že určitý náklad vždy platí jen jeden konkrétní rodič. Při neshodě soud hodnotí, nakolik byl výdaj odůvodněný a jaké jsou možnosti obou rodičů.</li>
            <li>Doporučujeme všechny podobné výdaje transparentně evidovat (např. přes modul Spolurodičovský Hub) a předem s druhým rodičem probírat (alespoň e-mailem/zprávou).</li>
          </ul>
        </div>
      </section>

      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 leading-relaxed">
        <strong>Zdroje:</strong> Zákon č. 89/2012 Sb. (občanský zákoník), Zákon č. 561/2004 Sb. (školský zákon). MŠMT, Česká školní inspekce. Aktuálnost ověřena k: Srpen 2026. Školy se řídí školským zákonem, nikoli "přáním" jednoho z rodičů. Vedení školy postupuje neutrálně.
      </div>
    </div>
  );
};
