import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCheck,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Printer,
  Scale,
  UserCheck
} from 'lucide-react';

interface AssociationDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinClick?: () => void;
  initialTab?: 'stanovy' | 'prohlaseni';
}

export const AssociationDocumentsModal: React.FC<AssociationDocumentsModalProps> = ({
  isOpen,
  onClose,
  onJoinClick,
  initialTab = 'stanovy'
}) => {
  const [activeTab, setActiveTab] = useState<'stanovy' | 'prohlaseni'>(initialTab);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const stanovyText = `STANOVY ZAPSANÉHO SPOLKU
Táta má právo, z.s.

Článek I. Základní ustanovení
1. Název spolku zní: Táta má právo, z.s. (dále jen „spolek“).
2. Sídlem spolku je Praha, Česká republika.
3. Spolek je dobrovolným, nevládním, neziskovým a nezávislým svazkem občanů a odborníků spojených společným zájmem na ochraně práv dětí a rodičů v rovnoprávné péči a spravedlivém opatrovnickém soudnictví.
4. Spolek je právnickou osobou založenou v souladu se zákonem č. 89/2012 Sb., občanský zákoník, v platném znění.

Článek II. Účel a hlavní činnosti spolku
1. Hlavním účelem spolku je:
   a) Podpora rovnoprávného rodičovství a zachování vazeb dětí s oběma rodiči po rozpadu partnerství.
   b) Vývoj a poskytování bezplatných digitálních a AI nástrojů pro rodiče v opatrovnickém řízení.
   c) Osvětová, vzdělávací a poradenská činnost v oblasti rodinného práva a opatrovnického soudnictví.
   d) Prosazování systémových změn pro zrychlení a zefektivnění rozhodování soudů a OSPOD v zájmu dítěte.
2. Hlavní činnost spolku je vykonávána výhradně k naplňování jeho účelu a není podnikáním.

Článek III. Členství ve spolku
1. Členství ve spolku je dobrovolné. Členem spolku se může stát fyzická osoba starší 18 let nebo právnická osoba.
2. Druhy členství:
   a) Zakládající člen – fyzická nebo právnická osoba, která finančně či odborně podpořila právní vznik spolku a podepsala zakladatelskou listinu. Zakládající člen má právo přednostního hlasování a navrhování členů Rady spolku.
   b) Řádný člen – fyzická osoba přijatá na základě písemné přihlášky a schválení Radou spolku.
   c) Čestný člen – významné osobnosti nebo odborníci (psychologové, právníci), kterým čestné členství udělí Valná hromada.

Článek IV. Orgány spolku
1. Orgány spolku jsou:
   a) Valná hromada – nejvyšší orgán spolku tvořený všemi členy.
   b) Rada spolku – výkonný a statutární orgán spolku.
   c) Předseda spolku – zastupuje spolek navenek samostatně.
2. Funkční období volených orgánů je 3 roky.

Článek V. Hospodaření a transparentnost
1. Spolek hospodaří s majetkem získaným z členských příspěvků, dobrovolných darů, dotací a grantů.
2. Spolek zřizuje transparentní bankovní účet pro příjem všech sponzorských darů a dotací.
3. Výnosy z majetku a činnosti spolku slouží výhradně k financování jeho hlavních cílů a vývoji veřejně prospěšných nástrojů.

Článek VI. Závěrečná ustanovení
1. Stanovy nabývají účinnosti dnem zápisu spolku do spolkového rejstříku vedeného Městským soudem v Praze.
2. Otázky neuvedené v těchto stanovách se řídí příslušnými ustanoveními občanského zákoníku (zákon č. 89/2012 Sb.).`;

  const prohlaseniText = `ČESTNÉ PROHLÁŠENÍ ZAKLÁDAJÍCÍHO ČLENA / ČLENA ORGÁNU SPOLKU A SOUHLAS SE ZÁPISEM DO SPOLKOVÉHO REJSTŘÍKU
(dle § 153 a § 154 zákona č. 89/2012 Sb., občanský zákoník a zákona č. 304/2013 Sb., o veřejných rejstřících)

Já, níže podepsaný/á:
Jméno a příjmení: [Jméno a příjmení zakládajícího člena / funkcionáře]
Datum narození: [DD.MM.YYYY]
Bydliště: [Ulice a číslo popisné, PSČ, Město]
Státní občanství: Česká republika

tímto čestně prohlašuji, že:
1. Jsem plně svéprávný/á a moje způsobilost k právním úkonům nebyla žádným způsobem omezena.
2. Splňuji všechny podmínky pro výkon funkce zakládajícího člena / člena orgánu spolku podle § 153 a násl. zákona č. 89/2012 Sb., občanský zákoník.
3. U mě nenastala žádná překážka výkonu funkce stanovená právními předpisy (zejména nebyl na můj majetek prohlášen konkurz ani mi nebyl uložen zákaz činnosti týkající se předmětu činnosti spolku).
4. Vyslovuji svůj plný a bezvýhradný souhlas se svým zápisem jako zakládající člen / člen statutárního orgánu spolku Táta má právo, z.s. do spolkového rejstříku vedeného Městským soudem v Praze.
5. Souhlasím se zpracováním osobních údajů pro účely zápisu do veřejného rejstříku v souladu s GDPR a zákonem č. 110/2019 Sb.

V [Město], dne [Datum]

_______________________________________
(Úředně ověřený podpis zakládajícího člena)`;

  const handleCopy = () => {
    const textToCopy = activeTab === 'stanovy' ? stanovyText : prohlaseniText;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const textToPrint = activeTab === 'stanovy' ? stanovyText : prohlaseniText;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${activeTab === 'stanovy' ? 'Stanovy spolku Táta má právo, z.s.' : 'Čestné prohlášení'}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1 { font-size: 20px; text-align: center; margin-bottom: 24px; border-bottom: 2px solid #334155; padding-bottom: 12px; }
              pre { font-family: inherit; white-space: pre-wrap; font-size: 13px; }
            </style>
          </head>
          <body>
            <h1>Táta má právo, z.s. - ${activeTab === 'stanovy' ? 'Návrh stanov spolku' : 'Čestné prohlášení zakládajícího člena'}</h1>
            <pre>${textToPrint}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 text-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white flex items-start justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-1 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 mb-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Zapsaný spolek (z.s.) • Oficiální návrh</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Dokumenty pro vznik spolku <span className="text-indigo-300">Táta má právo, z.s.</span>
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80">
              Vzorové právní podklady a zakladatelské předpisy připravené pro registraci u Městského soudu v Praze
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors shrink-0 relative z-10 cursor-pointer"
            aria-label="Zavřít okno"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-2xl border border-slate-300/80">
            <button
              type="button"
              onClick={() => setActiveTab('stanovy')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'stanovy'
                  ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Stanovy spolku (Návrh)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prohlaseni')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'prohlaseni'
                  ? 'bg-indigo-600 text-white shadow-xs border border-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/60'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Čestné prohlášení & Souhlas</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Kopírovat text dokumentu"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Zkopírováno' : 'Kopírovat'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Tisk / Uložit jako PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Tisknout</span>
            </button>
          </div>
        </div>

        {/* Modal Content - Scrollable Formatted Text */}
        <div className="bg-slate-50 flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 font-sans text-slate-700 text-sm leading-relaxed">
          
          {activeTab === 'stanovy' ? (
            <div className="space-y-6">
              {/* Document Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Základní předpis zapsaného spolku</h3>
                    <p className="text-xs text-slate-500">Podle ustanovení § 214 a násl. zákona č. 89/2012 Sb., občanský zákoník</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Připraveno k registraci</span>
                </div>
              </div>

              {/* Formatted Article Content */}
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-center pb-4 border-b border-slate-100">
                  <span className="text-xs uppercase tracking-widest text-indigo-600 font-bold block mb-1">Právní dokument spolku</span>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">STANOVY ZAPSANÉHO SPOLKU</h1>
                  <p className="text-lg font-bold text-indigo-700 mt-1">Táta má právo, z.s.</p>
                </div>

                {/* Article I */}
                <section className="space-y-2">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Článek I. Základní ustanovení
                  </h4>
                  <ul className="space-y-1.5 pl-4 text-slate-700 text-xs sm:text-sm">
                    <li><strong className="text-slate-900">1. Název spolku:</strong> Název zní <span className="text-indigo-800 font-semibold font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">Táta má právo, z.s.</span> (dále jen „spolek“).</li>
                    <li><strong className="text-slate-900">2. Sídlo spolku:</strong> Sídlem je Praha, Česká republika.</li>
                    <li><strong className="text-slate-900">3. Charakter spolku:</strong> Dobrovolný, nevládním, neziskový a nezávislý svazek občanů a odborníků spojených společným zájmem na ochraně práv dětí a rodičů v rovnoprávné péči a spravedlivém opatrovnickém soudnictví.</li>
                    <li><strong className="text-slate-900">4. Právní forma:</strong> Spolek je právnickou osobou založenou v souladu se zákonem č. 89/2012 Sb., občanský zákoník.</li>
                  </ul>
                </section>

                {/* Article II */}
                <section className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Článek II. Účel a hlavní činnosti spolku
                  </h4>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <p className="text-slate-800 font-medium">1. Hlavním účelem spolku je:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-indigo-700 font-bold text-xs block">a) Podpora rovnoprávnosti</span>
                        <p className="text-xs text-slate-600">Podpora rovnoprávného rodičovství a zachování stabilních vazeb dětí s oběma rodiči po rozpadu partnerství.</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-indigo-700 font-bold text-xs block">b) Vývoj AI & Digitálních nástrojů</span>
                        <p className="text-xs text-slate-600">Bezplatný vývoj a provoz digitálních asistenta a analytických nástrojů pro rodiče v opatrovnických sporech.</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-indigo-700 font-bold text-xs block">c) Osvěta a poradenství</span>
                        <p className="text-xs text-slate-600">Vzdělávání v oblasti rodinného práva, metodiky BIFF a odborné psychologické i právní osvěty.</p>
                      </div>
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-indigo-700 font-bold text-xs block">d) Systémová advokacie</span>
                        <p className="text-xs text-slate-600">Prosazování systémových změn pro spravedlivější rozhodování soudů a orgánů OSPOD v zájmu dítěte.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Article III */}
                <section className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Článek III. Členství ve spolku a Zakládající členové
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <p className="text-slate-700">1. Členství ve spolku je dobrovolné pro fyzické osoby starší 18 let i právnické osoby.</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <span className="text-indigo-900 font-bold text-xs flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          a) Zakládající člen (Čestné zakladatelské členství)
                        </span>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Fyzická nebo právnická osoba, která podpořila právní vznik spolku a podepsala zakladatelskou listinu. Zakládající člen získává čestný titul zapsaný v rejstříku, přednostní hlasovací právo a možnost navrhovat členy Rada spolku.
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-slate-900 font-bold text-xs block mb-1">b) Řádný člen</span>
                        <p className="text-xs text-slate-600">Přijatý na základě písemné přihlášky a schválení Radou spolku.</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Article IV & V */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700">Článek IV. Orgány spolku</h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li>• <strong>Valná hromada:</strong> Nejvyšší orgán spolku tvořený všemi členy.</li>
                      <li>• <strong>Rada spolku:</strong> Výkonný a statutární orgán (předseda + členové rady).</li>
                      <li>• <strong>Funkční období:</strong> Volení funkcionáři působí 3 roky.</li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-700">Článek V. Hospodaření & Transparentnost</h5>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li>• <strong>Transparentní účet:</strong> Všechny finanční dary a dotace vedené na veřejném účtu.</li>
                      <li>• <strong>Užití prostředků:</strong> Zisk slouží výhradně pro vývoj nástrojů a osvětu.</li>
                    </ul>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Banner */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Úřední formulář pro rejstříkový soud</h3>
                    <p className="text-xs text-slate-500">Prohlášení o způsobilosti a souhlas dle § 153 a § 154 Občanského zákoníku</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
                  <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Náležitost zakladatelského spisu</span>
                </div>
              </div>

              {/* Formatted Declaration Content */}
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-xs text-slate-700">
                <div className="text-center pb-4 border-b border-slate-100">
                  <span className="text-xs uppercase tracking-widest text-purple-600 font-bold block mb-1">Úřední doklad</span>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">ČESTNÉ PROHLÁŠENÍ ZAKLÁDAJÍCÍHO ČLENA</h1>
                  <p className="text-xs text-slate-500 mt-1">A souhlas se zápisem do spolkového rejstříku (Městský soud v Praze)</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-slate-900 font-bold text-xs uppercase text-indigo-700">1. Identifikace zakládajícího člena / funkcionáře:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-mono pt-1">
                    <div><span className="text-slate-500">Jméno a příjmení:</span> <span className="text-slate-900 font-bold">[Jan Novák]</span></div>
                    <div><span className="text-slate-500">Datum narození:</span> <span className="text-slate-900">[XX.XX.XXXX]</span></div>
                    <div><span className="text-slate-500">Bydliště:</span> <span className="text-slate-900">[Vodičkova 12, 110 00 Praha 1]</span></div>
                    <div><span className="text-slate-500">Občanství:</span> <span className="text-slate-900">Česká republika</span></div>
                  </div>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  <p className="font-bold text-slate-900 text-sm">Tímto čestně prohlašuji a stvrzuji, že:</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block">Plná svéprávnost (§ 153 NOZ)</strong>
                        <span className="text-slate-600">Jsem plně svéprávný/á a moje způsobilost k právním úkonům nebyla žádným způsobem omezena.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-slate-900 block">Bezúhonnost a neexistence překážek</strong>
                        <span className="text-slate-600">Splňuji všechny statutární podmínky pro výkon funkce člena orgánu / zakládajícího člena. Nebyl na mě prohlášen konkurz ani mi nebyl uložen zákaz činnosti.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                      <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-indigo-900 block">Souhlas se zápisem do rejstříku spolku</strong>
                        <span className="text-slate-700">Vyslovuji svůj plný a bezvýhradný souhlas se zápisem mé osoby jako zakládajícího člena / člena statutárního orgánu spolku <strong className="text-indigo-900">Táta má právo, z.s.</strong> do spolkového rejstříku vedeného Městským soudem v Praze.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 font-mono text-xs text-slate-500">
                  <div>
                    <p>V Městě: <span className="text-slate-900">[Praha]</span></p>
                    <p>Dne: <span className="text-slate-900">[..................... 2026]</span></p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-2 text-center w-full sm:w-64">
                    <p className="text-slate-900 font-bold font-sans text-xs">Podpis zakládajícího člena</p>
                    <p className="text-[10px] text-slate-500">(Úředně ověřený podpis / datová schránka)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Chcete se stát zakládajícím členem? Získáte čestný titul v rejstříku spolku.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto text-center"
            >
              Zavřít náhled
            </button>

            {onJoinClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onJoinClick();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto"
              >
                <span>Chci se stát zakládajícím členem</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
