import React from 'react';
import {
  HelpCircle,
  ArrowLeft,
  Moon,
  Clock,
  Repeat,
  Car,
  Palmtree,
  Sparkles,
  ShieldCheck,
  Scale,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface CareHowItCalculatesPageProps {
  onNavigate: (path: string) => void;
}

export const CareHowItCalculatesPage: React.FC<CareHowItCalculatesPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => onNavigate('/pece')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-900 transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zpět na přehled Péče o dítě</span>
        </button>
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">ℹ️</span>
          <h1 className="text-2xl font-black text-slate-900">Jak se počítají metriky a co znamenají</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailní metodika výpočtu podílu péče, předávání, odloučení a logistiky.
        </p>
      </div>

      {/* Prominent Legal Disclaimer */}
      <div className="p-5 bg-slate-900 text-white rounded-3xl space-y-2 shadow-sm">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Důležité právní upozornění</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          Výpočty představují technické vyhodnocení zadaného rozvrhu. Nejedná se o právní posouzení ani doporučení, jak má být péče soudem upravena.
        </p>
      </div>

      {/* Principle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Podíl péče & Noc != Čas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">1. Podíl péče (Princip Noc ≠ Čas)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            V praxi soudů a úřadů se často nesprávně počítají pouze <strong>celé přespané noci</strong>. Pokud si však jeden rodič dítě přebírá v neděli v 18:00 a druhý v pondělí ráno v 8:00, podíl reálně stráveného času a bdělé péče je odlišný od počtu nocí.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Náš algoritmus počítá jak <strong>podíl celých nocí</strong>, tak <strong>přesný odhad v hodinách</strong> od okamžiku předání do okamžiku dalšího předání.
          </p>
        </div>

        {/* 2. Počet předání a tranzic */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
              <Repeat className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">2. Počet předání dítěte</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Předání je identifikováno v každý den, kdy dochází k přechodu dítěte z péče Rodiče A do péče Rodiče B (nebo naopak).
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Příliš vysoký počet předání u starších školních dětí (např. model 2-2-3 generuje až 8–10 předání měsíčně) může znamenat zvýšený stres ze stěhování školních pomůcek, zatímco model 7/7 má pouze 4 předání měsíčně.
          </p>
        </div>

        {/* 3. Maximální odloučení */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">3. Maximální odloučení od rodiče</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Udává nejdelší nepřetržitý úsek dnů, kdy dítě není v kontaktu s jedním z rodičů.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            U dětí batolecího a předškolního věku (do 3–4 let) psychologické poznatky doporučují kratší intervaly (max. 2–3 dny bez rodiče), aby nedocházelo k oslabení citové vazby. U dospívajících dětí naopak delší bloky (7 nebo 14 dní) přinášejí větší klid a soustředění na školu.
          </p>
        </div>

        {/* 4. Dojezdy a čas v autě */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold">
              <Car className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">4. Dojezdové kilometry a čas</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Na základě zadaných adres předávacích míst systém vypočítává celkový roční a měsíční nájezd kilometrů a počet hodin, které dítě stráví cestováním mezi bydlišti rodičů.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tato metrika je klíčovým argumentem při posuzování logistické únosnosti střídavé péče v situaci, kdy rodiče bydlí ve větší vzdálenosti od sebe.
          </p>
        </div>

        {/* 5. Prázdninová pravidla */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-900 flex items-center justify-center font-bold">
              <Palmtree className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">5. Rotace svátků a prázdnin</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Prázdninový engine podporuje jak střídání po celých letech (sudý rok Rodič A, lichý rok Rodič B pro Štědrý den / Silvestr), tak půlení prázdnin (první polovina července vs. druhá polovina srpna).
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tato pravidla automaticky přepisují běžný týdenní rotační cyklus a zajišťují spravedlivé rozdělení svátečních dnů.
          </p>
        </div>

        {/* 6. Nezávislost simulací */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">6. Nezávislé simulace nanečisto</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Simulátor péče funguje v sandboxu. Veškeré úpravy parametrů a porovnávání modelů probíhají bez jakéhokoliv zápisu do vašeho schváleného plánu.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Teprve po ověření a vaší spokojenosti můžete simulovaný model uložit jedním kliknutím jako nový platný Care Plan.
          </p>
        </div>
      </div>
    </div>
  );
};
