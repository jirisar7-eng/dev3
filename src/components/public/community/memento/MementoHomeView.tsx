import React, { useState } from 'react';
import { SeoHead } from '../../SeoHead';
import {
  AlertCircle,
  ArrowLeft,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ShieldAlert,
  Flame,
  Globe,
  Clock,
  Heart,
  MessageSquare,
  FileText,
  FileCheck,
  Calendar,
  Printer,
  BookOpen,
  ShieldCheck,
  Gavel,
  PhoneCall,
  HelpCircle,
  Info,
  ExternalLink,
  Search,
  Filter,
  Check,
  Building2,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { MementoCase } from '../../../../types';
import { MEMENTO_THEMES } from './mementoTypes';

interface MementoHomeViewProps {
  cases: MementoCase[];
  onNavigate: (path: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Flame,
  Clock,
  Heart,
  Globe,
  MessageSquare,
  FileText,
  AlertTriangle,
  ShieldAlert,
  Gavel,
  FileCheck,
  Calendar,
  Scale,
  Building2
};

export const MementoHomeView: React.FC<MementoHomeViewProps> = ({ cases, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handlePrint = () => {
    window.print();
  };

  const filteredCases = cases.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.error.toLowerCase().includes(q) ||
      c.correctAction.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-20 print:p-0 print:space-y-6">
      <SeoHead
        title="Memento otců: Procesní chyby, kterým je dobré se vyhnout • Táta má právo"
        description="Poučení z častých chyb v komunikaci, péči o dítě a opatrovnickém řízení. Praktický edukační modul prevence procesních chyb."
        canonicalPath="/memento"
      />

      {/* Header & Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 print:hidden">
          <button
            onClick={() => onNavigate('/krizova-pomoc')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            id="memento-back-to-crisis"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět na Krizový rozcestník</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-300"
            id="memento-print-button"
          >
            <Printer className="w-4 h-4" />
            <span>Vytisknout / Uložit PDF</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs print:border-none print:p-0">
          <div className="flex flex-wrap items-center gap-2 text-red-600 font-extrabold text-xs uppercase tracking-wider mb-3">
            <span className="px-3 py-1 rounded-full bg-red-50 border border-red-200 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Potřebuji pomoc • 6. položka rozcestníku
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Prevence procesních chyb
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-3 leading-tight">
            Memento otců: Procesní chyby, kterým je dobré se vyhnout
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-3xl leading-relaxed mb-6">
            Poučení z častých chyb v komunikaci, péči o dítě a opatrovnickém řízení. Praktický edukační průvodce, který pomáhá zastavit se před reakcí v afektu či chybou, jež by mohla zkomplikovat situaci vaší rodiny.
          </p>

          {/* Úvodní citativní blok */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed mb-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-slate-900 block mb-1">Úvodní slovo k modulu</strong>
                <p className="italic text-slate-700">
                  «Některé chyby vzniknou během několika minut, ale mohou zbytečně komplikovat další průběh rodinného konfliktu nebo řízení. Memento otců pomáhá rozpoznat rizikové situace a nabídnout věcnější postup.»
                </p>
              </div>
            </div>
          </div>

          {/* Stručný viditelný disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs leading-normal flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-amber-900 block mb-0.5 uppercase tracking-wide">
                Důležité upozornění:
              </strong>
              <p>
                ⚠️ Memento otců je edukační a preventivní obsah. Nenahrazuje individuální právní, psychologickou ani sociální pomoc. Konkrétní postup závisí na okolnostech případu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Jak Memento funguje (Metodický princip) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:p-0">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-md">
          <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Jak Memento používat (Metodický filtr chování)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
            Před odesláním zprávy nebo provedením nevratného kroku projděte tento 4krokový věcný filtr:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider block">1. KROK</span>
              <strong className="text-sm font-bold text-white block">❌ CHYBA</strong>
              <p className="text-xs text-slate-300">Rozpoznat rizikový vzorec chování nebo reakce v afektu.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">2. KROK</span>
              <strong className="text-sm font-bold text-white block">⚠️ RIZIKO & NÁSLEDEK</strong>
              <p className="text-xs text-slate-300">Pochopit procesní dopad u soudu, OSPODu či znalce.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">3. KROK</span>
              <strong className="text-sm font-bold text-white block">✅ SPRÁVNÝ POSTUP</strong>
              <p className="text-xs text-slate-300">Zastavit se a zvolit věcné řešení zaměřené na zájem dítěte.</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 border border-white/10 space-y-1">
              <span className="text-xs font-black text-blue-400 uppercase tracking-wider block">4. KROK</span>
              <strong className="text-sm font-bold text-white block">📝 PRAKTICKÝ VZOR</strong>
              <p className="text-xs text-slate-300">Použít ověřený vzor zprávy nebo kroku podle metodiky BIFF.</p>
            </div>
          </div>
        </div>
      </div>

      {/* TEMATICKÉ OKRUHY (Navigační rozcestník do 6 podstránek) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Tematické okruhy Mementa
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Vyberte oblast, ve které chcete získat detailní informace a věcné metodické doporučení.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(MEMENTO_THEMES).map((theme) => {
            const IconComp = ICON_MAP[theme.iconName] || BookOpen;
            return (
              <div
                key={theme.id}
                onClick={() => onNavigate(`/memento/${theme.slug}`)}
                className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                id={`memento-theme-card-${theme.id}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wide">
                      {theme.badge}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 text-slate-700 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                    {theme.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 mb-2">
                    {theme.subtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                  <span>Prohlédnout téma</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rychlotahák (zkrácená verze) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
              ⚡
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-amber-950">
                Rychlotahák Mementa: «Když si nejsem jistý, zastavím se»
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 font-medium">
                Pět základních pravidel, která zabrání nejčastějším procesním chybám v praxi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-xs font-black text-red-600 block mb-1">1. STOP</span>
              <p className="text-xs text-slate-800 font-bold">Nereaguji v afektu ani v noci.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-xs font-black text-amber-600 block mb-1">2. FAKTA</span>
              <p className="text-xs text-slate-800 font-bold">Oddělím skutečnost od domněnky.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-xs font-black text-emerald-600 block mb-1">3. DÍTĚ</span>
              <p className="text-xs text-slate-800 font-bold">Ptám se, co pomůže dítěti.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-xs font-black text-blue-600 block mb-1">4. DOKUMENTACE</span>
              <p className="text-xs text-slate-800 font-bold">Zaznamenám skutečný průběh.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-xs font-black text-indigo-600 block mb-1">5. ODBORNÍK</span>
              <p className="text-xs text-slate-800 font-bold">Konzultuji složitou situaci včas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Přehled 12 procesních chyb (Cards / Grid) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Přehled 12 procesních chyb
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Stručný přehled všech metodicky zpracovaných případů. Kliknutím otevřete detail chyby.
            </p>
          </div>

          {/* Vyhledávání a Filtry */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Hledat v chybách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                id="memento-search-input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {[
                { id: 'all', label: 'Všechny (12)' },
                { id: 'komunikace', label: 'Komunikace' },
                { id: 'pece', label: 'Péče & Dítě' },
                { id: 'soud', label: 'Soud' },
                { id: 'soukromi', label: 'Soukromí' },
                { id: 'dokazovani', label: 'Dokazování' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mřížka 12 karet */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((c) => {
            const IconComp = ICON_MAP[c.icon] || AlertTriangle;
            return (
              <div
                key={c.id}
                onClick={() => onNavigate(`/memento/chyba/${c.slug}`)}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                id={`memento-case-card-${c.id}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-extrabold text-[11px] uppercase tracking-wide border border-rose-200">
                      Chyba #{c.order}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                      <IconComp className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mb-2 line-clamp-2">
                    {c.title}
                  </h3>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-bold text-slate-700 block mb-0.5">❌ Čemu se vyhnout:</span>
                      <p className="text-slate-600 line-clamp-2">{c.error}</p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
                      <span className="font-bold text-amber-900 block mb-0.5">⚠️ Hlavní procesní riziko:</span>
                      <p className="text-amber-800 line-clamp-2">{c.consequence}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 hover:text-indigo-800">
                  <span>Detail chyby & vzory</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Systém pomoci (Stručný blok s kartami) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:hidden">
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800">
          <div className="max-w-2xl mb-6">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold uppercase tracking-wide inline-block mb-2">
              Systém pomoci
            </span>
            <h2 className="text-2xl font-black">Potřebujete navazující pomoc?</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Memento otců je 6. pilířem rozcestníku. Využijte navazující bezplatné a ověřené nástroje portálu Táta má právo:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'SOS krizový plán', url: '/sos-plan', icon: ShieldAlert, desc: 'Krok za krokem v krizové situaci' },
              { label: 'Krizová pomoc', url: '/krizova-pomoc', icon: PhoneCall, desc: 'Infolinky a rychlá krizová pomoc' },
              { label: 'Právní poradna', url: '/pravni-poradna', icon: HelpCircle, desc: 'Právní dotazy a konzultace' },
              { label: 'Registr subjektů', url: '/registr-subjektu', icon: CheckCircle2, desc: 'Hodnocení advokátů a poraden' },
              { label: 'Mapa institucí', url: '/mapa-subjektu', icon: MapPin, desc: 'Geografická mapa OSPOD a soudů' },
            ].map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <div
                  key={idx}
                  onClick={() => onNavigate(tool.url)}
                  className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <ToolIcon className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                    <strong className="text-xs font-extrabold text-white block mb-1">{tool.label}</strong>
                    <p className="text-[11px] text-slate-300">{tool.desc}</p>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-300 mt-3 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Otevřít <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Primární a oficiální právní zdroje */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-700" />
            <span>Primární právní zdroje a oficiální metodiky</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <a
              href="https://nalus.usoud.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between"
            >
              <span>NALUS — Databáze Ústavního soudu</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://www.e-sbirka.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between"
            >
              <span>e-Sbírka — Zákon o rodině & NOZ</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://www.mpsv.cz/spod"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between"
            >
              <span>MPSV — Metodika SPOD & OSPOD</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://www.uoou.cz"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-medium flex items-center justify-between"
            >
              <span>ÚOOÚ — Ochrana osobních údajů</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
