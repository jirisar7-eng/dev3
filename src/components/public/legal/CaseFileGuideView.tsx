import React from 'react';
import { BookOpen, AlertTriangle, FileText, Scale, Search, ShieldAlert, Cpu, Copy } from 'lucide-react';
import { SeoHead } from '../SeoHead';

interface CaseFileGuideViewProps {
  onNavigate?: (path: string) => void;
}

export const CaseFileGuideView: React.FC<CaseFileGuideViewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 pt-4">
      <SeoHead
        title="Práce se spisem a nahlížení do opatrovnického spisu"
        description="Jak nahlížet do spisu, jak si vést evidenci a připravit se na soud. Průvodce prací s opatrovnickým a správním spisem."
        canonicalPath="/spis"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold mb-4">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Nahlížení do spisu</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Práce s opatrovnickým spisem
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Spis je základním a často jediným zdrojem, ze kterého soud vychází při svém rozhodování. Co není ve spise, jako by se nestalo.
          </p>
        </div>
      </div>

      {/* Právní disclaimer */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní upozornění:</strong> Obsah slouží pouze k informační orientaci a nenahrazuje individuální právní poradenství. Nahlížení do soudního spisu se řídí § 44 zákona č. 99/1963 Sb. (o.s.ř.). Nahlížení do spisu OSPOD se řídí § 55 zákona č. 359/1999 Sb.
        </p>
      </div>

      {/* Dva typy spisů */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Kde a jaké spisy jsou vedeny
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-700">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Scale className="w-4 h-4" /> Soudní spis
            </h3>
            <p className="mb-3">
              Vedený u příslušného okresního (obvodního) soudu. Obsahuje veškerá podání obou rodičů, zprávy OSPOD, znalecké posudky a protokoly z jednání.
            </p>
            <p><strong>Nahlížení:</strong> Právo účastníka řízení (§ 44 o.s.ř.). Lze pořídit fotokopie. Požádejte soudní informační centrum / infocentrum soudu s dostatečným předstihem.</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Spis OSPOD
            </h3>
            <p className="mb-3">
              Vedený u příslušného úřadu (oddělení sociálně-právní ochrany dětí). Obsahuje podrobnější interní záznamy, šetření a protokoly o jednání s rodiči.
            </p>
            <p><strong>Nahlížení:</strong> Zvláštní režim (dle § 55 z. o SPOD). OSPOD může vyloučit nahlédnutí do určitých částí, pokud by to ohrozilo zájem dítěte nebo prozradilo totožnost oznamovatele. Lze se proti tomu bránit.</p>
          </div>
        </div>
      </section>

      {/* Žádost a kopie */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
          <Copy className="w-5 h-5 text-indigo-600" /> Žádost o nahlédnutí a pořízení kopií
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Nikdy nespoléhejte jen na to, co vám druhý rodič nebo úředník řekne ústně. Před jakýmkoliv vyjádřením k soudu byste měli přesně znát obsah spisu.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Objednejte se k nahlédnutí telefonicky či e-mailem v informačním centru příslušného soudu.</li>
            <li>Vezměte si s sebou průkaz totožnosti a chytrý telefon/fotoaparát.</li>
            <li>Nafoťte <strong>kompletně celý spis</strong> (včetně obálek a doručenek, které dokazují, kdy byl dokument převzat).</li>
          </ul>
          {onNavigate && (
            <div className="pt-4">
              <button
                onClick={() => onNavigate('/ai-formulare')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>Generovat: Žádost o nahlédnutí do spisu (Formulář 5)</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Analýza spisu a AI */}
      <section className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-400" /> Vlastní evidence a analýza dokumentů
        </h2>
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            V opatrovnickém řízení vyhrává ten, kdo má lepší evidenci a schopnost pracovat s fakty. Z vašich nafocených dokumentů si vytvořte <strong>chronologickou osu</strong>.
          </p>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
            <h3 className="font-bold text-slate-200">Klíčová pravidla práce se spisem:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Rozlišujte fakta od tvrzení a hodnocení:</strong> "Otec přišel pozdě" je tvrzení. "Matka považuje otce za nezodpovědného" je hodnocení. Fakt je pouze to, co lze prokázat (např. jízdenka zpožděného vlaku).</li>
              <li><strong>Hledejte rozpory:</strong> Srovnávejte, co druhá strana tvrdila před rokem, a co tvrdí dnes. Rozpory v tvrzeních výrazně snižují věrohodnost.</li>
              <li><strong>Příprava pro advokáta:</strong> Advokát nemá čas číst 500 stran chaotických fotek. Připravte mu PDF soubor, seřazený podle data, a stručný výtah hlavních nepravdivých bodů s odkazy na důkazy.</li>
            </ul>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-900 rounded-xl p-4 flex gap-3 mt-4">
            <Cpu className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 mb-1">Využití AI pro analýzu</h4>
              <p className="text-xs">
                Můžete využít AI k chronologickému seřazení, shrnutí obsáhlých textů, nalezení faktických tvrzení nebo vygenerování otázek na protistranu k soudu. 
                <strong> Pozor:</strong> AI nesmí měnit originální dokument a její závěry nejsou právními radami.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Disclaimer */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Důležité upozornění pro AI:</strong> AI výstup (jako je Case Manager nebo AI rozbor) může obsahovat chyby či halucinovat fakta. Neumí rozhodovat, kdo má pravdu, ani nahrazovat advokáta. Důležité skutečnosti vždy ověřte v originálním fyzickém dokumentu.
        </p>
      </div>

      {/* Footer zdroje */}
      <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400">
        Zdroje: Zákon č. 99/1963 Sb. (o.s.ř.), Zákon č. 359/1999 Sb. (z. o SPOD), Instrukce Ministerstva spravedlnosti. Aktuálnost ověřena k: Srpen 2026.
      </div>
    </div>
  );
};
