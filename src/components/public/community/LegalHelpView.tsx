import React from 'react';
import { SeoHead } from '../SeoHead';
import {
  Gavel,
  ArrowLeft,
  Scale,
  Sparkles,
  Download,
  FileText,
  CheckCircle2,
  ExternalLink,
  Bot
} from 'lucide-react';

interface LegalHelpViewProps {
  onNavigate: (path: string) => void;
}

export const LegalHelpView: React.FC<LegalHelpViewProps> = ({ onNavigate }) => {
  const judicatureList = [
    {
      code: 'I. ÚS 2482/13',
      title: 'Kritéria pro posuzování střídavé péče obou rodičů',
      summary: 'Jsou-li splněna základní kritéria (způsobilost obou rodičů k výchově, jejich zájem o péči, citová vazba dítěte k oběma rodičům a stabilita výchovného prostředí), představuje střídavá péče prioritní ústavní model výchovy s ohledem na nejlepší zájem dítěte.',
    },
    {
      code: 'II. ÚS 1835/12',
      title: 'Péče a přespávání dětí útlého věku u otce',
      summary: 'Nízký věk dítěte (včetně kojenců a batolat) sám o sobě neodůvodňuje vyloučení otce z péče nebo přespávání, existuje-li vybudovaná vzájemná citová vazba.',
    },
    {
      code: 'I. ÚS 1506/13',
      title: 'Vzdálenost bydlišť rodičů a možnost střídavé péče',
      summary: 'Vzdálenost mezi bydlišti rodičů sama o sobě nevylučuje střídavou péči, jsou-li rodiče schopni vzájemné logistické a organizační součinnosti v zájmu dítěte.',
    },
    {
      code: 'III. ÚS 149/20',
      title: 'Důsledky bezdůvodného maření kontaktu s dítětem',
      summary: 'Dlouhodobé a bezdůvodné maření kontaktu dítěte s jedním z rodičů představuje závažný zásah do práv dítěte a může být relevantním důvodem pro změnu výchovného prostředí.',
    },
  ];

  const templatesList = [
    { title: 'Návrh na úpravu péče a výživného (Střídavá péče)', category: 'Vzor podání', url: '/ke-stazeni' },
    { title: 'Návrh na vydání Předběžného opatření (§ 452 z.ř.s.)', category: 'Krizový vzor', url: '/ke-stazeni' },
    { title: 'Věcný a konstruktivní podnět na OSPOD', category: 'OSPOD podání', url: '/ke-stazeni' },
    { title: 'Odvolání proti usnesení opatrovnického soudu', category: 'Opravný prostředek', url: '/ke-stazeni' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Právní poradna & Judikatura • Táta má právo"
        description="Judikatura Ústavního soudu garantující práva dítěte na oba rodiče, AI Asistent Synthesis OS a vzory podání ke stažení."
        canonicalPath="/pravni-poradna"
      />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => onNavigate('/krizova-pomoc')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na rozcestník Krizové pomoci</span>
        </button>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Gavel className="w-5 h-5" />
            <span>Právní jistota • Ústavní záruky</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Právní poradna & Judikatura Ústavního soudu
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Srozumitelný přehled klíčových nálezů Ústavního soudu ČR, propojení s AI Asistentem Synthesis OS a ověřenými vzory podání.
          </p>
        </div>
      </div>

      {/* AI Synthesis OS Promo Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Opatrovnický Asistent (Synthesis OS)</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              Potřebujete bleskový rozbor usnesení nebo generování návrhu?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Využijte našeho specializovaného AI Asistenta trénovaného na českém opatrovnickém právu a judikatuře Ústavního soudu.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/ai-assistant')}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Bot className="w-5 h-5" />
            <span>Spustit AI Asistenta</span>
          </button>
        </div>
      </div>

      {/* Judicature Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <span>Klíčové nálezy Ústavního soudu ČR</span>
          </h2>
          <button
            onClick={() => onNavigate('/judikatura')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <span>Celá databáze rozsudků</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {judicatureList.map((j, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-200">
                  {j.code}
                </span>
                <Scale className="w-4 h-4 text-slate-400" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900">
                {j.title}
              </h3>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  Shrnutí právního závěru
                </span>
                <p className="italic text-slate-700">
                  {j.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sekce ČAK & Ombudsman - Bezplatná pomoc a obrana proti OSPOD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4" id="section-cak-ombudsman">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ČAK - Bezplatný advokát */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4" id="card-cak">
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider" id="header-cak">
              <Gavel className="w-5 h-5 text-indigo-500" />
              <span>Bezplatná právní pomoc • Česká advokátní komora</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight" id="title-cak">
              Jak získat bezplatného advokáta pro opatrovnický spor
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Kvalitní zastoupení je pro ochranu dětí i rodičů klíčové. Pokud nemáte prostředky na komerčního advokáta, zákon o advokacii (§ 18a) vám umožňuje požádat Českou advokátní komoru (ČAK) o bezplatné určení zástupce.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <strong className="text-slate-900 text-xs block font-bold">Klíčové podmínky pro určení ČAK:</strong>
              <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4">
                <li>Nesplňujete podmínky pro bezplatné ustanovení zástupce přímo soudem (např. řízení ještě nezačalo).</li>
                <li>Doložíte, že vás písemně odmítli zastoupit alespoň dva oslovení komerční advokáti (písemné odmítnutí).</li>
                <li>Doložíte nízké příjmy – čistý příjem žadatele a společně posuzovaných osob nedosahuje 3násobku životního minima.</li>
              </ul>
            </div>

            <div className="bg-slate-100/60 p-3 rounded-xl text-[10px] text-slate-500 border border-slate-200 leading-relaxed">
              <strong>Jak postupovat:</strong> Stáhněte si formulář „Žádost o určení advokáta k poskytnutí právní služby bezplatně“ na portálu{' '}
              <a
                href="https://www.cak.cz"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-700 hover:text-indigo-900 underline inline-flex items-center gap-0.5"
              >
                cak.cz
                <ExternalLink className="w-2.5 h-2.5 inline" />
              </a>
              , vyplňte čestné prohlášení o majetku a příjmech, přiložte 2 odmítnutí a zašlete na ČAK (poštou či datovou schránkou).
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
              <span>Zdroj: Česká advokátní komora (§ 18a zákona č. 85/1996 Sb.)</span>
              <span>Ověřeno: 19. srpna 2026</span>
            </div>
          </div>

          {/* Ombudsman - Stížnosti na OSPOD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4" id="card-ombudsman">
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider" id="header-ombudsman">
              <Scale className="w-5 h-5 text-indigo-500" />
              <span>Obrana proti pochybení OSPOD • Veřejný ochránce práv</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight" id="title-ombudsman">
              Jak podat stížnost na nečinnost či podjatost OSPOD
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              OSPOD vystupuje jako kolizní opatrovník dítěte. Je povinen postupovat objektivně, bez předsudků vůči rodičům a s primárním zřetelem na nejlepší zájem dítěte. Pokud se setkáte s podjatostí, pasivitou či neprofesionálním chováním sociálního pracovníka, máte plné právo se bránit.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <strong className="text-slate-900 text-xs block font-bold">Tříkrokový postup obrany podle Ombudsmana:</strong>
              <ol className="space-y-2 text-xs text-slate-600 list-decimal pl-4">
                <li><strong>Stížnost vedoucímu OSPOD:</strong> Podejte písemnou stížnost tajemníkovi městského úřadu podle § 175 správního řádu (lhůta na vyřízení je 60 dnů).</li>
                <li><strong>Podnět na Krajský úřad:</strong> Pokud úřad stížnost zamítne, požádejte nadřízený Krajský úřad o výkon hierarchického dozoru a nápravu.</li>
                <li><strong>Podnět Ombudsmanovi:</strong> Pokud dozor selže, obraťte se přímo na Veřejného ochránce práv v Brně, který zahájí nezávislé šetření.</li>
              </ol>
            </div>

            <div className="bg-slate-100/60 p-3 rounded-xl text-[10px] text-slate-500 border border-slate-200 leading-relaxed">
              <strong>Zásada:</strong> OSPOD nesmí nadržovat žádné straně. Jakákoliv jednostranná nečinnost při zamezování styku, ignorování vašich důkazů nebo odmítání zapsat vaše vyjádření je závažným pochybením.
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between items-center">
              <span>Zdroj: Oficiální metodické sborníky Kanceláře Veřejného ochránce práv</span>
              <span>Ověřeno: 19. srpna 2026</span>
            </div>
          </div>

        </div>
      </div>

      {/* Downloads / Templates */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Rychlé vzory podání a žádostí</span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Stáhněte si ověřené vzory pro opatrovnické soudy a OSPOD.
              </p>
            </div>

            <button
              onClick={() => onNavigate('/ke-stazeni')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              Všechny dokumenty
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templatesList.map((tpl, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(tpl.url)}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase block mb-0.5">
                    {tpl.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {tpl.title}
                  </h4>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center shrink-0 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Download className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Právní upozornění */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
          <strong className="text-slate-900 font-bold block text-xs sm:text-sm">Právní upozornění:</strong>
          <p className="leading-relaxed">
            Informace, vzory podání a výstupy AI asistenta mají pouze obecný informativní a vzdělávací charakter. Nenahrazují individuální právní posouzení ani právní zastoupení advokátem. Konkrétní opatrovnická věc vždy závisí na skutkových okolnostech a aktuálním právním stavu.
          </p>
        </div>
      </div>
    </div>
  );
};
