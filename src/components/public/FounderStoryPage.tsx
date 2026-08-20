import React from 'react';
import { SeoHead } from './SeoHead';
import { Heart, Compass, Shield, ArrowRight, CheckCircle2, FileText, Scale, Milestone } from 'lucide-react';

interface FounderStoryPageProps {
  onNavigate?: (path: string) => void;
}

export const FounderStoryPage: React.FC<FounderStoryPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-500">
      <SeoHead
        title="Moje cesta zakladatele | Táta má právo"
        description="Osobní příběh vzniku projektu Táta má právo, jeho motivace a cesta od vlastní zkušenosti k vytvoření nástroje pro pomoc otcům a jejich dětem."
        canonicalPath="/moje-cesta-zakladatele"
      />

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs uppercase tracking-wider">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Osobní příběh zakladatele</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Moje cesta zakladatele
          </h1>
          
          <p className="text-xl sm:text-2xl text-blue-100 font-bold max-w-3xl leading-snug">
            Když se dítě stane zbraní a stát tichým spolupachatelem: Skutečný důvod, proč vznikl tento portál
          </p>
          
          <p className="text-lg text-slate-300 max-w-3xl leading-relaxed">
            Příběh portálu <strong>Táta má právo</strong> nezačal u rýsovacího prkna softwarového architekta. Začal u absurdního a tvrdého boje o mého mladšího syna Štěpánka.
          </p>
        </div>
      </div>

      {/* Main Content Blocks */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-10">
        
        {/* Intro */}
        <div className="space-y-4">
          <p className="text-slate-700 leading-relaxed text-lg">
            Zkušenost, kterou si právě procházím, není jen běžným sporem dvou rodičů. Je to pro mě zkušenost s tím, jak mohou státní úřady, soudy i další organizace prostřednictvím nečinnosti, formalismu nebo rozdílného přístupu ovlivnit práva dítěte a jeho vztah k rodičům.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Ačkoliv sám dlouhodobě, řádně a bez jakýchkoliv problémů vychovávám ve své výlučné péči svého staršího syna Jiříka, v případě mého mladšího syna jsem narazil na situaci, kterou jsem vnímal jako zásadně odlišnou.
          </p>
        </div>

        {/* Section 1 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-600" />
            Zkušenost s neziskovou organizací a péčí o dítě
          </h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Tento boj odhalil, jak obtížné může být pro rodiče získat informace a dokumentaci týkající se vlastního dítěte a jak rozdílně mohou jednotlivé organizace vnímat postavení rodičů.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            V mém případě došlo také k události v době, kdy měl Štěpánek akutní fázi planých neštovic s masivním výsevem a horečkami. Nacházel se u mě a podle platného ujednání měl zůstat v klidovém režimu. Následně došlo k situaci, kterou jsem vnímal jako zásadní zásah do péče o nemocné dítě.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg font-medium">
            Tato zkušenost se stala jedním z momentů, které zásadně ovlivnily můj pohled na fungování systému.
          </p>
        </div>

        {/* Section 2 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Scale className="w-7 h-7 text-blue-600" />
            Zkušenost se soudním rozhodnutím
          </h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Mé naděje směřované k justici byly spojeny s očekáváním, že rozhodování bude vycházet především z nejlepšího zájmu dítěte a z konkrétních potřeb dítěte. V mém případě jsem se setkal s rozhodnutím, jehož jednotlivé části jsem vnímal jako vzájemně rozporné.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Jedním z problémů, který jsem začal podrobně analyzovat, byl také způsob výpočtu času, který měl být podle rozhodnutí věnován péči jednotlivých rodičů. Právě zde jsem pochopil, jak důležité může být umět pracovat s dokumenty, časovými údaji, daty a vlastními výpočty.
          </p>
        </div>

        {/* Section 3 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="w-7 h-7 text-blue-600" />
            Neprostupná zeď úřadů
          </h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Při snaze o obranu jsem postupně narazil na několik státních institucí. V mém případě se jednalo mimo jiné o OSPOD Přelouč, Městský úřad Přelouč, Ministerstvo práce a sociálních věcí a další instituce, na které jsem se obracel.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Jednotlivé reakce institucí, jejich rozhodnutí a průběh komunikace jsem si začal systematicky ukládat. Postupně jsem zjistil, že samotné tvrzení rodiče často nestačí.
          </p>
          
          <blockquote className="bg-blue-50/60 border-l-4 border-blue-600 p-6 rounded-r-2xl my-6 shadow-sm">
            <p className="text-xl font-bold text-blue-900 leading-snug">
              Je potřeba mít dokumenty, data, časovou osu, rozhodnutí, komunikaci, důkazy a schopnost jednotlivé informace vzájemně propojit.
            </p>
          </blockquote>
        </div>

        {/* Section 4 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Milestone className="w-7 h-7 text-blue-600" />
            Systém se nezmění sám
          </h2>
          <p className="text-slate-700 leading-relaxed text-lg font-bold">
            Nevzdám to. Žádné dítě by podle mě nemělo být rukojmím rodičovského konfliktu a žádný milující rodič by neměl být redukován pouze na formálního návštěvníka života svého dítěte.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Rozhodl jsem se proto svou frustraci a bezmoc přetavit v akci. Své IT znalosti a zkušenosti s moderními technologiemi jsem vložil do vývoje portálu <strong className="text-slate-900">Táta má právo</strong>.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Tento systém vznikl proto, aby otcové, kteří se ocitnou v podobně složité situaci, měli možnost najít na jednom místě informace, právní zdroje, praktické návody, dokumenty, data a nástroje.
          </p>
          
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[
              "Aby dokázali lépe rozumět své situaci.",
              "Aby uměli pracovat s vlastními podklady.",
              "Aby dokázali klást správné otázky.",
              "A aby se nemuseli spoléhat pouze na informace získané náhodně z desítek různých míst."
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 5 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Proč právě Táta má právo</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Táta má právo nevzniklo jako projekt proti matkám. Nevzniklo jako projekt proti soudům. Nevzniklo jako projekt proti úřadům.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg">
            Vzniklo z osobní zkušenosti člověka, který potřeboval nástroj, jenž v danou chvíli neexistoval v podobě, kterou potřeboval.
          </p>
          <p className="text-slate-700 leading-relaxed text-lg font-medium">
            Na prvním místě je dítě. Cílem je pomoci rodiči orientovat se v jeho situaci, pracovat s ověřitelnými informacemi a hledat řešení, která respektují nejlepší zájem dítěte.
          </p>
        </div>

        {/* Section 6 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Od osobního problému k nástroji pro ostatní</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Zpočátku jsem řešil především vlastní situaci. Postupně mi ale začalo docházet, že podobný problém může řešit mnoho dalších otců.
          </p>
          
          <div className="flex flex-wrap gap-2 my-6">
            {["Před soudem", "Řešení OSPOD", "Právní informace", "Dokumentace péče", "Další kroky"].map((tag, i) => (
              <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200">
                {tag}
              </span>
            ))}
          </div>
          
          <p className="text-slate-700 leading-relaxed text-lg">
            Proto jsem začal jednotlivé nástroje, informace a zkušenosti spojovat do jednoho systému. Tak vzniká Táta má právo.
          </p>
        </div>

        {/* Section 7 */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900">Kam projekt směřuje</h2>
          <p className="text-slate-700 leading-relaxed text-lg">
            Táta má právo má být postupně více než informační web. Má být praktickým systémem, který umožní rodiči:
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
            {[
              "Orientovat se v situaci", "Pracovat s právními informacemi", "Vyhledávat judikaturu",
              "Připravovat dokumenty", "Evidovat vlastní případ", "Pracovat s důkazy",
              "Sledovat důležité události", "Využívat vzdělávací obsah", "Používat interaktivní nástroje",
              "Získat přehled o další pomoci"
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-slate-700 leading-relaxed text-lg mt-6">
            Technologie jsou pouze prostředek. Smyslem je pomoci člověku získat zpět orientaci, která se v krizové životní situaci velmi snadno ztratí.
          </p>
        </div>

        {/* Section 8 */}
        <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-md">
          <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
            <Heart className="w-6 h-6 text-blue-400" />
            Moje cesta pokračuje
          </h2>
          <p className="text-slate-300 leading-relaxed text-lg">
            Táta má právo proto není hotový projekt. Je to projekt, který vznikl z konkrétní životní zkušenosti a který se bude dál vyvíjet podle toho, co skutečně potřebují lidé, kterým má sloužit.
          </p>
          <p className="text-slate-300 leading-relaxed text-lg mt-4">
            Moje osobní zkušenost byla začátkem. Cílem je vytvořit nástroj, který bude mít hodnotu i pro další otce a jejich děti.
          </p>
          <p className="text-xl font-bold text-white mt-6 pt-6 border-t border-slate-700/50">
            Proto Táta má právo pokračuje.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold text-slate-900">Podpořte vznik projektu</h3>
            <p className="text-slate-500">Každá pomoc má smysl. Přidejte se k nám.</p>
          </div>
          <button
            onClick={() => onNavigate?.('/podporte-nas')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
          >
            <span>Jak mohu pomoci</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
