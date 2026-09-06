import React from 'react';
import { SeoHead } from '../../SeoHead';
import {
  ArrowLeft,
  Printer,
  BookOpen,
  MessageSquare,
  Heart,
  FileText,
  Building2,
  Gavel,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Clock,
  Check,
  Scale
} from 'lucide-react';
import { MementoCase } from '../../../../types';
import { MEMENTO_THEMES, MementoThemeInfo } from './mementoTypes';

interface MementoThematicViewProps {
  themeId: string;
  cases: MementoCase[];
  onNavigate: (path: string) => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  MessageSquare,
  Heart,
  FileText,
  Building2,
  Gavel,
  Globe,
};

export const MementoThematicView: React.FC<MementoThematicViewProps> = ({
  themeId,
  cases,
  onNavigate,
}) => {
  const theme: MementoThemeInfo = MEMENTO_THEMES[themeId] || MEMENTO_THEMES['komunikace'];
  const IconComp = ICON_MAP[theme.iconName] || BookOpen;

  // Filter cases belonging to this theme
  const relatedCases = cases.filter((c) => theme.caseIds.includes(c.id));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-20 print:p-0 print:space-y-6">
      <SeoHead
        title={`${theme.seoTitle} • Táta má právo`}
        description={theme.seoDescription}
        canonicalPath={`/memento/${theme.slug}`}
      />

      {/* Breadcrumbs & Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 print:p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 print:hidden">
          <nav className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => onNavigate('/memento')}
              className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
              id="memento-breadcrumb-root"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Memento otců</span>
            </button>
            <span>/</span>
            <span className="text-slate-900">{theme.title}</span>
          </nav>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-300"
            id="memento-theme-print"
          >
            <Printer className="w-4 h-4" />
            <span>Vytisknout / PDF</span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs print:border-none print:p-0">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wider mb-3">
            <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 flex items-center gap-1.5">
              <IconComp className="w-4 h-4 text-indigo-600" />
              {theme.badge}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            {theme.title}
          </h1>
          <p className="text-sm sm:text-base font-bold text-indigo-900 mb-3">
            {theme.subtitle}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {theme.description}
          </p>
        </div>
      </div>

      {/* METODICKÉ NÁSTROJE K DANÉMU TÉMATU */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {themeId === 'komunikace' && (
          <div className="space-y-6">
            {/* Metodika BIFF */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800">
              <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-2 text-indigo-300">
                <MessageSquare className="w-6 h-6 text-indigo-400" />
                <span>Metodika BIFF (Stručně, Informativně, Slušně, Rázně)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                Při komunikaci v rodinném sporu se držte čtyř zásad BIFF. Cílem je předat věcnou informaci bez emocí a ukončit zbytečný spor.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-xs font-black text-indigo-300 uppercase block mb-1">B — Brief (Stručně)</span>
                  <p className="text-xs text-slate-200">Pište jen to nejnutnější. Vyhněte se dlouhým odstáncům, výčitkám a vysvětlování minulosti.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-xs font-black text-indigo-300 uppercase block mb-1">I — Informative (Informativně)</span>
                  <p className="text-xs text-slate-200">Uvádějte pouze ověřená fakta: čas, datum, místo, konkrétní návrh či reakci na organizační věc.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-xs font-black text-indigo-300 uppercase block mb-1">F — Friendly (Slušně)</span>
                  <p className="text-xs text-slate-200">Zachovejte neutrální až zdvořilý tón («Dobrý den», «Děkuji za zprávu»). Žádné sarkasmy ani ironie.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="text-xs font-black text-indigo-300 uppercase block mb-1">F — Firm (Rázně/Jasně)</span>
                  <p className="text-xs text-slate-200">Předložte jasné stanovisko nebo dvě věcné varianty bez dalšího prostor pro hádku.</p>
                </div>
              </div>
            </div>

            {/* Pravidlo 24h & 5 kontrolních otázek */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                <h3 className="text-base font-black text-amber-950 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <span>Pravidlo 24 hodin (Odstup při afektu)</span>
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed mb-3">
                  Obdržíte-li provokativní nebo urážlivou zprávu, <strong>nikdy neodpovídejte ihned</strong>. Odložte telefon. Pokud zpráva neobsahuje bezprostřední ohrožení zdraví či života, odpovězte až druhý den po vychladnutí.
                </p>
                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs font-bold text-amber-950">
                  💡 «Žádný soud ani OSPOD vám nevytkne, že jste na neurgentní zprávu odpověděli věcně po 12–24 hodinách.»
                </div>
              </div>

              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-200">
                <h3 className="text-base font-black text-indigo-950 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                  <span>5 kontrolních otázek před odesláním</span>
                </h3>
                <ul className="text-xs text-indigo-900 space-y-1.5 font-medium">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>1. Je v textu jediná výčitka z minulosti? (Pokud ano, smažte ji.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>2. Je v textu emoce nebo ironie? (Pokud ano, přepište do věcné roviny.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>3. Přečte-li zprávu soudce, uvidí v ní klidného rodiče?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>4. Týká se zpráva přímo potřeb nebo péče o dítě?</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <span>5. Může zpráva vyvolat další zbytečnou hádku?</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {themeId === 'dite' && (
          <div className="bg-rose-50 rounded-3xl p-6 sm:p-8 border border-rose-200 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-rose-950 flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-600" />
              <span>Zásady ochrany psychiky dítěte v konfliktu rodičů</span>
            </h2>
            <p className="text-xs sm:text-sm text-rose-900 leading-relaxed max-w-3xl">
              Dítě potřebuje pro zdravý vývoj vědomí, že má právo milovat oba rodiče. Nikdy je nevystavujte tlaku, výslechům ani roli rozhodčího ve sporu dospělých.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <strong className="text-xs font-black text-rose-900 block mb-1">🚫 Nepoužívat jako posla</strong>
                <p className="text-xs text-slate-700">Všechny vzkazy, finance a dohody vyřizujte přímo s druhým rodičem, nikoli přes dítě.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <strong className="text-xs font-black text-rose-900 block mb-1">🚫 Nevyslechovat dítě</strong>
                <p className="text-xs text-slate-700">Když se dítě vrátí od druhého rodiče, nekladejte mu výzvědné otázky ani je nepodrobujte výslechu.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <strong className="text-xs font-black text-rose-900 block mb-1">🚫 Netajně nenahrávat</strong>
                <p className="text-xs text-slate-700">Pořizování tajných zvukových či video nahrávek dítěte u soudu poškozuje rodiče a traumatizuje dítě.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <strong className="text-xs font-black text-rose-900 block mb-1">🚫 Nepomlouvat druhého</strong>
                <p className="text-xs text-slate-700">Mluvení o druhém rodiči v negativním světle dítě zraňuje a způsobuje mu syndrom konfliktu loajality.</p>
              </div>
            </div>
          </div>
        )}

        {themeId === 'dokumentace' && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-indigo-300 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              <span>Věcný deník péče a pravidla objektivní dokumentace</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Deník péče slouží jako chronologický přehled faktických událostí. U soudu má váhu pouze zápis bez osobních výlevů a domněnek.
            </p>

            <div className="p-5 rounded-2xl bg-white/10 border border-white/10 text-xs text-slate-200 space-y-3">
              <strong className="text-sm font-bold text-white block">Struktura jednoho věcného záznamu v deníku:</strong>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div><span className="text-indigo-400 font-bold block">DATUM & ČAS:</span> 12.05.2026, 16:00</div>
                <div><span className="text-indigo-400 font-bold block">MÍSTO:</span> Byt matky, Praha</div>
                <div><span className="text-indigo-400 font-bold block">PŘÍTOMNÍ:</span> Otec, Matka, Syn</div>
                <div><span className="text-indigo-400 font-bold block">DOKUMENT:</span> SMS potvrzení</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200">
                  <span className="font-bold block mb-1">❌ Emotivní špatný zápis:</span>
                  «Matka zase dělala scény, hystericky křičela na ulici a zkazila klukovi víkend, je hrozná sobka.»
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200">
                  <span className="font-bold block mb-1">✅ Věcný správný zápis:</span>
                  «Předání proběhlo v 16:15 (zpoždění 15 min). Matka odmítla předat zdravotní průkaz syna s odkazem, že je ztracený. Odeslána SMS s žádostí o zaslání fotokopie do 24h.»
                </div>
              </div>
            </div>
          </div>
        )}

        {themeId === 'ospod-a-instituce' && (
          <div className="bg-blue-50 rounded-3xl p-6 sm:p-8 border border-blue-200 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-blue-950 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-700" />
              <span>4 pilíře jednání s OSPOD a úřady</span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-900 max-w-3xl leading-relaxed">
              Pracovníci OSPOD posuzují situaci z pohledu nejlepšího zájmu dítěte. Rodič, který komunikuje věcně, bez útoků a s doloženými fakty, získává přirozenou důvěru.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                <strong className="text-xs font-black text-blue-900 block mb-1">1. VĚCNÁ KOMUNIKACE</strong>
                <p className="text-xs text-slate-700">Mluvte o péči, zdraví, škole a potřebách dítěte. Vyhněte se osočování bývalého partnera.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                <strong className="text-xs font-black text-blue-900 block mb-1">2. KONKRÉTNÍ TVRZENÍ</strong>
                <p className="text-xs text-slate-700">Místo obecných soudů («ona nepečuje») uveďte konkrétní události («syn neměl 2x připravené učebnice»).</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                <strong className="text-xs font-black text-blue-900 block mb-1">3. DOLOŽENÁ FAKTA</strong>
                <p className="text-xs text-slate-700">Ke všem závažným tvrzením přiložte písemný důkaz (lékařskou zprávu, zprávu ze školy, písemnou komunikaci).</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                <strong className="text-xs font-black text-blue-900 block mb-1">4. ODDĚLENÍ EMOCÍ</strong>
                <p className="text-xs text-slate-700">Při jednání na OSPOD udržte emoce pod kontrolou. Nevstupujte do hádek a zachovejte klid.</p>
              </div>
            </div>
          </div>
        )}

        {themeId === 'soud' && (
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 flex items-center gap-2">
              <Gavel className="w-6 h-6 text-amber-400" />
              <span>7-bodový checklist k opatrovnickému řízení</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Příprava na opatrovnický soud vyžaduje strukturovaný přístup. Projděte si tyto klíčové body dříve, než stanete před soudcem:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="font-extrabold text-amber-300 block">1. Časová osa případu</span>
                <p className="text-slate-300 text-[11px]">Sestavte si přehlednou chronologii klíčových událostí v péči od rozchodu po současnost.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="font-extrabold text-amber-300 block">2. Šanon s dokumenty</span>
                <p className="text-slate-300 text-[11px]">Mějte přehledně vytištěné a roztříděné lékařské zprávy, zprávy ze školy a klíčovou komunikaci.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="font-extrabold text-amber-300 block">3. Jasné a věcné návrhy</span>
                <p className="text-slate-300 text-[11px]">Mějte připravený konkrétní návrh rozvrhu péče včetně svátků, prázdnin a předávání.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="font-extrabold text-amber-300 block">4. Odůvodnění v zájmu dítěte</span>
                <p className="text-slate-300 text-[11px]">Vysvětlete, proč je navrhovaná péče výhodná pro zdravý vývoj dítěte, nikoli pro vaše pohodlí.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="font-extrabold text-amber-300 block">5. Oddělení faktů a domněnek</span>
                <p className="text-slate-300 text-[11px]">Před soudem uvádějte pouze to, co můžete doložit nebo prokázat svědecky.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 space-y-1">
                <span className="font-extrabold text-amber-300 block">6. Konzultace s advokátem</span>
                <p className="text-slate-300 text-[11px]">Složité právní kroky a předběžná opatření vždy předem konzultujte se zkušeným advokátem.</p>
              </div>
            </div>
          </div>
        )}

        {themeId === 'soukromi' && (
          <div className="bg-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200 space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
              <Globe className="w-6 h-6 text-amber-700" />
              <span>Co nepatří na sociální sítě a internet</span>
            </h2>
            <p className="text-xs sm:text-sm text-amber-900 max-w-3xl leading-relaxed">
              Zveřejňování soudních spisů, osobních údajů nebo výpadů proti druhému rodiči na Facebooku, YouTube či Instagramu představuje zásadní procesní i právní riziko.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-amber-200">
                <span className="font-black text-red-600 block mb-1">❌ SOUDNÍ SPISY A ROZSUDKY</span>
                <p className="text-slate-700">Zveřejnění protokolů, psychologických posudků či jmen dětí porušuje právo na soukromí a zákon o SPOD.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-amber-200">
                <span className="font-black text-red-600 block mb-1">❌ ÚTOKY NA ÚŘEDNÍKY</span>
                <p className="text-slate-700">Jmenovité osočování pracovnic OSPOD nebo soudců online soudy vyhodnocují jako nátlakové a agresivní jednání.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-amber-200">
                <span className="font-black text-red-600 block mb-1">❌ SOUKROMÁ KOMUNIKACE</span>
                <p className="text-slate-700">Vystavování screenshotů zpráv druhého rodiče veřejnosti poškozuje atmosféru a ohrožuje psychiku dítěte.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SOUVISEJÍCÍ PROCESNÍ CHYBY Z 12 PŘÍPADŮ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Související procesní chyby k tomuto tématu ({relatedCases.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Detailní rozbor konkrétních chyb, procesních rizik a praktických vzorů Bad ❌ vs Good ✅.
          </p>
        </div>

        <div className="space-y-6">
          {relatedCases.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5"
              id={`memento-theme-case-${c.id}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-black text-xs border border-rose-200">
                    Chyba #{c.order}
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900">
                    {c.title}
                  </h3>
                </div>

                <button
                  onClick={() => onNavigate(`/memento/chyba/${c.slug}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Samostatná stránka chyby</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Popis chyby & Riziko */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80">
                  <span className="font-black text-rose-950 block mb-1 uppercase tracking-wide text-xs">
                    ❌ Čemu se vyhnout (Chyba):
                  </span>
                  <p className="text-rose-900 leading-relaxed font-medium">{c.error}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                  <span className="font-black text-amber-950 block mb-1 uppercase tracking-wide text-xs">
                    ⚠️ Hlavní procesní riziko a následek:
                  </span>
                  <p className="text-amber-900 leading-relaxed font-medium">{c.consequence}</p>
                </div>
              </div>

              {/* Správný postup */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs sm:text-sm">
                <span className="font-black text-emerald-950 block mb-1 uppercase tracking-wide text-xs">
                  ✅ Doporučený věcný postup:
                </span>
                <p className="text-emerald-900 font-bold leading-relaxed">{c.correctAction}</p>
              </div>

              {/* Bad vs Good příklady */}
              {(c.exampleBad || c.exampleGood) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-2">
                  {c.exampleBad && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-rose-300 border border-slate-800">
                      <span className="font-sans font-bold text-rose-400 block mb-1">❌ NEVHODNÁ EMOTIVNÍ REAKCE:</span>
                      <p className="leading-relaxed whitespace-pre-wrap">{c.exampleBad}</p>
                    </div>
                  )}

                  {c.exampleGood && (
                    <div className="p-4 rounded-2xl bg-slate-900 text-emerald-300 border border-slate-800">
                      <span className="font-sans font-bold text-emerald-400 block mb-1">✅ VĚCNÁ DEESKALAČNÍ REAKCE (BIFF):</span>
                      <p className="leading-relaxed whitespace-pre-wrap">{c.exampleGood}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigační rozcestník na ostatní tématické podstránky */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="p-6 rounded-3xl bg-slate-100 border border-slate-200 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
            Ostatní tématické okruhy Mementa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {Object.values(MEMENTO_THEMES)
              .filter((t) => t.id !== themeId)
              .map((otherTheme) => (
                <button
                  key={otherTheme.id}
                  onClick={() => onNavigate(`/memento/${otherTheme.slug}`)}
                  className="p-3.5 rounded-2xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-left transition-all cursor-pointer group"
                >
                  <strong className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 block mb-0.5">
                    {otherTheme.title}
                  </strong>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                    Prohlédnout <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
