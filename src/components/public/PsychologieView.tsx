import React, { useState } from 'react';
import {
  Heart,
  Shield,
  MessageSquare,
  Sparkles,
  Phone,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Users,
  Smile,
  Clock,
  AlertTriangle,
  FileText,
  LifeBuoy,
  Printer,
  Scale,
  GraduationCap,
  ExternalLink,
  Info
} from 'lucide-react';
import { SeoHead } from './SeoHead';

interface PsychologieViewProps {
  onNavigate?: (path: string) => void;
}

export const PsychologieView: React.FC<PsychologieViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'child' | 'communication' | 'hygiene' | 'crisis'>('child');
  const [selectedAge, setSelectedAge] = useState<'0-3' | '3-6' | '6-11' | '12+'>('0-3');

  const handleNav = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Psychologický vývoj & Emoce dítěte • Táta má právo"
        description="Jak dítě prožívá konflikt rodičů, jak chránit jeho pocit bezpečí, potřeby podle věkových etap (0–3, 3–6, 6–11, 12+), vědecké studie a metoda BIFF."
        canonicalPath="/psychologie"
      />

      {/* Top Action Bar / Quick Navigation & Print Export */}
      <div className="flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:px-5 print:hidden">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <BookOpen className="w-4 h-4 text-blue-900" />
          <span>Moje dítě: Edutainment & Odborný průvodce</span>
        </div>
        <button
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          title="Vytisknout tuto stránku nebo uložit do PDF"
        >
          <Printer className="w-3.5 h-3.5 text-slate-600" />
          <span>Vytisknout / PDF</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Odborná informační opora & Psychohygiena</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Psychologický vývoj & Emoce dítěte
          </h1>
          <p className="text-xs sm:text-base text-slate-200 font-bold leading-snug">
            Jak dítě prožívá konflikt rodičů, jak chránit jeho pocit bezpečí a jak přizpůsobit komunikaci jeho věku.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
            «Rozchod nebo dlouhodobý konflikt rodičů může být pro dítě náročnou životní situací. Cílem tohoto průvodce je nabídnout rodičům srozumitelné informace o dětském prožívání, komunikaci a způsobech, jak dítě co nejvíce chránit před přenášením konfliktu mezi dospělými.»
          </p>
        </div>
      </div>

      {/* Ethics & Professional Note Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-2xl shadow-2xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <strong className="font-extrabold text-amber-950">Odborné a etické vymezení:</strong>
          <p className="text-amber-800 leading-relaxed">
            Informace v tomto modulu mají podpůrný a edukativní charakter. Nenahrazují individuální psychologickou, psychiatrickou ani rodinnou terapii. Tento modul neslouží k diagnostice dítěte ani druhého rodiče. Vyvarujte se patologizování nebo označování druhého rodiče bez odborného posouzení. Konkrétní potřeby dítěte se mohou lišit podle jeho věku, vývoje a rodinné situace.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 print:hidden">
        <button
          onClick={() => setActiveTab('child')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'child'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Smile className="w-4 h-4" />
          <span>Dítě uprostřed konfliktu</span>
        </button>
        <button
          onClick={() => setActiveTab('communication')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'communication'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Komunikace a metoda BIFF</span>
        </button>
        <button
          onClick={() => setActiveTab('hygiene')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'hygiene'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Psychohygiena otce</span>
        </button>
        <button
          onClick={() => setActiveTab('crisis')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'crisis'
              ? 'bg-rose-900 text-white shadow-2xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-rose-600" />
          <span>Krizové linky a pomoc</span>
        </button>
      </div>

      {/* TAB 1: Dítě uprostřed konfliktu */}
      {(activeTab === 'child' || typeof window === 'undefined') && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Jak dítě vnímá konflikt rodičů a jak ho chránit
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium">
                «Dítě může mít současně pozitivní vztah k oběma rodičům. Pro dítě bývá důležité, aby nemuselo rozhodovat mezi rodiči, přenášet jejich zprávy ani nést odpovědnost za jejich konflikt.»
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Co dítěti pomáhá */}
              <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-extrabold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Co dítěti pomáhá</span>
                </div>
                <ul className="text-xs text-emerald-900 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                  <li>Ujištění, že za rozchod ani konflikt dospělých nenese žádnou odpovědnost.</li>
                  <li>Možnost mít vztah k oběma rodičům bez pocitu viny nebo loajalitního tlaku.</li>
                  <li>Předvídatelný režim a dodržování dohodnutého harmonogramu.</li>
                  <li>Klidná předávání dítěte bez slovních přestřelek.</li>
                  <li>Možnost volně mluvit o zážitcích z pobytu u druhého rodiče.</li>
                  <li>Dôsledná ochrana před konfliktní komunikací dospělých.</li>
                </ul>
              </div>

              {/* Čemu se vyhnout */}
              <div className="p-5 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-950 font-extrabold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Čemu se vyhnout (rizika pro dítě)</span>
                </div>
                <ul className="text-xs text-rose-900 space-y-2 list-disc pl-4 leading-relaxed font-medium">
                  <li>Dítě jako poslíček zpráv mezi rodiči.</li>
                  <li>Dítě jako „vyzvědač“ o soukromí druhého rodiče.</li>
                  <li>Výslek dítěte po návratu od druhého rodiče.</li>
                  <li>Rozebírání soudu, advokátů nebo sporů před dítětem.</li>
                  <li>Projednávání výživného nebo majetku v přítomnosti dítěte.</li>
                  <li>Nucení dítěte, aby si volilo stranu nebo kým chce bydlet.</li>
                  <li>Vyvolávání pocitu viny při odchodu k druhému rodiči.</li>
                </ul>
              </div>
            </div>

            {/* Věková specifika */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Potřeby dítěte podle věkových etap
                </h3>
                <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl print:hidden">
                  {(['0-3', '3-6', '6-11', '12+'] as const).map((age) => (
                    <button
                      key={age}
                      onClick={() => setSelectedAge(age)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedAge === age
                          ? 'bg-blue-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {age === '0-3' && '0–3 roky (Kojenci/Batolata)'}
                      {age === '3-6' && '3–6 let (Předškoláci)'}
                      {age === '6-11' && '6–11 let (Mladší školáci)'}
                      {age === '12+' && '12+ let (Dospívající)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail věkové etapy */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-3">
                {(selectedAge === '0-3' || typeof window === 'undefined') && (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-800" />
                      <span>Kojenci a batolata (0–3 roky): Citová vazba a stálost pečujících osob</span>
                    </h4>
                    <p>
                      U kojenců a batolat se vyvíjí schopnost vytvářet a udržovat stabilní vztahy s pečujícími osobami. Pro dítě může být důležitý předvídatelný a pravidelný kontakt s rodiči, které zná jako své pečující osoby. Konkrétní uspořádání péče je však třeba přizpůsobit věku, vývoji, dosavadnímu vztahu dítěte k rodičům, jeho potřebám a konkrétním podmínkám rodiny.
                    </p>
                    <p className="bg-white p-3 rounded-xl border border-slate-200 font-medium text-slate-700">
                      <strong>Přespávání u druhého rodiče:</strong> Přespávání může být součástí péče i u malých dětí. Vhodnost konkrétního režimu nelze určit pouze podle věku dítěte; významné jsou také jeho vývojové potřeby, dosavadní péče, vztah k rodiči, předvídatelnost prostředí a schopnost rodičů zajistit klidnou péči.
                    </p>
                  </div>
                )}

                {(selectedAge === '3-6' || typeof window === 'undefined') && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/50">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Smile className="w-4 h-4 text-indigo-800" />
                      <span>Předškolní věk (3–6 let): Předvídatelnost a prevence pocitů viny</span>
                    </h4>
                    <p>
                      Děti v tomto věku mohou mít sklon k tvoření egocentrických představ („rodiče se hádají, protože jsem nezjedl oběd“). Často pomáhá vizuální kalendář s barevným vyznačením dní u jednotlivých rodičů, srozumitelné rituály předávání a neustálé ujišťování, že láska rodičů k dítěti je trvalá.
                    </p>
                  </div>
                )}

                {(selectedAge === '6-11' || typeof window === 'undefined') && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/50">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-800" />
                      <span>Mladší školní věk (6–11 let): Školní povinnosti a zapojení obou rodičů</span>
                    </h4>
                    <p>
                      V tomto období je účelné, aby se oba rodiče zapojovali do běžných školních a mimoškolních aktivit (domácí úkoly, kroužky, komunikace se školou, lékařská péče). Otec by neměl být redukován pouze na víkendového baviče. Pro dítě bývá přínosné mít stabilní studijní zázemí v obou domovech.
                    </p>
                  </div>
                )}

                {(selectedAge === '12+' || typeof window === 'undefined') && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/50">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-800" />
                      <span>Dospívající (12+ let): Vrstevnické vazby a respekt k názoru</span>
                    </h4>
                    <p>
                      Dospívající mají přirozenou potřebu budovat vrstevnické vztahy a vlastní program. Záleží na konkrétním dítěti – rigidní vynucování harmonogramu bez ohledu na jeho kroužky a přátele může vyvolávat odpor. Doporučuje se s dospívajícím jednat partnersky, naslouchat jeho potřebám a současně udržovat pevné a bezpečné hranice.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Výzkumná a vědecká opora */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-900" />
                  <h3 className="text-base font-black text-slate-900">
                    Odborná výzkumná data a mezinárodní studie
                  </h3>
                </div>
                <button
                  onClick={() => handleNav('/studie')}
                  className="text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors flex items-center gap-1 print:hidden cursor-pointer"
                >
                  <span>Knihovna studií Synthesis OS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <strong className="font-bold text-indigo-950 block">Fabricius & Suh (2017) — Overnights and Infant Attachment</strong>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Výzkum publikovaný v <em>Psychology, Public Policy, and Law (APA)</em> potvrzující, že častá noční péče obou rodičů od útlého věku podporuje tvorbu bezpečné citové vazby k oběma rodičům bez negativního dopadu.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <strong className="font-bold text-indigo-950 block">Warshak Consensus Report (2014) — 110 mezinárodních expertů</strong>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Metodický konsenzus 110 předních odborníků na dětský vývoj konstatující, že plošná zákazová pravidla pro přespávání malých dětí u otců nemají oporu ve vědeckých datech.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <strong className="font-bold text-indigo-950 block">Nielsen (2014, 2018) — Shared Physical Custody Meta-analyses</strong>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Systematický přehled desítek studií prokazující vyšší psychickou pohodu a lepší výsledky dětí v oboustranné péči ve srovnání s výhradní péčí.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1">
                  <strong className="font-bold text-indigo-950 block">Fučík / MUNI (2021) — Střídavá péče v ČR</strong>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Sociologický výzkum Masarykovy univerzity mapující fungování oboustranné péče v českém právním a sociálním prostředí.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Upozornění k metodice:</strong> Výzkumný poznatek z mezinárodních studií představuje statistický vědecký trend, nikoli automatické právní pravidlo. Konkrétní uspořádání musí vždy zohlednit individuální zájem a potřeby dítěte.
                </span>
              </div>
            </div>

            {/* Právní kontext & Judikatura ÚS */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-900" />
                  <h3 className="text-base font-black text-slate-900">
                    Právní kontext & Judikatura Ústavního soudu ČR
                  </h3>
                </div>
                <button
                  onClick={() => handleNav('/judikatura')}
                  className="text-xs font-bold text-blue-900 hover:text-blue-950 transition-colors flex items-center gap-1 print:hidden cursor-pointer"
                >
                  <span>Přehled judikatury ÚS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                «Věk dítěte nelze při rozhodování o péči posuzovat izolovaně. Při rozhodování je třeba zohlednit konkrétní okolnosti dítěte, jeho potřeby, vztahy s rodiči a jeho nejlepší zájem.»
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="font-bold text-slate-900 block mb-0.5">I. ÚS 2482/13</strong>
                  <p className="text-[11px] text-slate-600">Nízký věk dítěte sám o sobě nepředstavuje překážku pro svěření do péče druhého rodiče či přespávání.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="font-bold text-slate-900 block mb-0.5">I. ÚS 3216/13</strong>
                  <p className="text-[11px] text-slate-600">Právo dítěte na péči obou rodičů a rovnoprávné postavení matky i otce při výchově.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <strong className="font-bold text-slate-900 block mb-0.5">I. ÚS 1506/13</strong>
                  <p className="text-[11px] text-slate-600">Kritéria posuzování nejlepšího zájmu dítěte a povinnost soudů zkoumat konkrétní pečovatelské předpoklady.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Komunikace a BIFF */}
      {(activeTab === 'communication' || typeof window === 'undefined') && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ověřená metoda komunikace s vysokokonfliktním partnerem</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Metoda BIFF v praxi rodičovské komunikace
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
                «Při konfliktní komunikaci může pomoci věcný, stručný a klidný způsob odpovědi. Podrobnější průvodce metodou BIFF je dostupný v samostatném modulu.»
              </p>
            </div>

            {/* 4 BIFF Pilíře */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center">B</div>
                <strong className="text-slate-900 text-xs block font-bold">Brief (Stručné)</strong>
                <p className="text-[11px] text-slate-600">Krátké zprávy. Čím více slov napíšete, tím více munice poskytujete k protiútoku.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center">I</div>
                <strong className="text-slate-900 text-xs block font-bold">Informative (Věcné)</strong>
                <p className="text-[11px] text-slate-600">Pouze fakta, časy, termíny, lékařské zprávy. Žádné hodnocení, výčitky ani analýzy chování.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center">F</div>
                <strong className="text-slate-900 text-xs block font-bold">Friendly (Zdvořilé)</strong>
                <p className="text-[11px] text-slate-600">Slušné oslovení a zakončení („Dobrý den“, „Děkuji za zprávu“). Neutrální a klidný tón.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-900 text-white font-black text-xs flex items-center justify-center">F</div>
                <strong className="text-slate-900 text-xs block font-bold">Firm (Jasné & Pevné)</strong>
                <p className="text-[11px] text-slate-600">Jednoznačné stanovisko uzavírající debatu bez otevírání prostoru pro další slovní přestřelku.</p>
              </div>
            </div>

            {/* Praktický příklad */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <h3 className="text-sm font-black text-slate-900">Praktická ukázka převodu zprávy</h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200">
                  <div className="font-bold text-rose-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    Útočná zpráva od protistrany:
                  </div>
                  <p className="text-rose-900 italic font-serif">
                    „Jsi naprosto neschopný otec, včera měl kluk špinavé kalhoty a zakašlal! Pokud se nenaučíš 
                    starat o vlastní dítě, tak ti ho příští týden vůbec nedám, jsi sobec a zničíš ho!“
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="font-bold text-emerald-800 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    Správná odpověď podle zásad BIFF:
                  </div>
                  <p className="text-emerald-900 font-medium">
                    „Dobrý den. Děkuji za zprávu. Syn byl u lékaře zkontrolován, je zcela zdráv a bez teplot. 
                    V pátek v 16:00 budu připraven k jeho převzetí dle platného soudního rozsudku. S pozdravem, [Jméno]“
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="text-xs text-indigo-950 font-medium">
                <strong>Chcete si nechat zprávu zkontrolovat AI?</strong> Využijte náš integrovaný BIFF převodník.
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => handleNav('/komunikace-biff')}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
                >
                  <span>Komunikace BIFF</span>
                </button>
                <button
                  onClick={() => handleNav('/ai-asistent')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>BIFF Převodník v AI Asistentovi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Psychohygiena otce */}
      {(activeTab === 'hygiene' || typeof window === 'undefined') && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Psychohygiena otce: Jak ustát tlak a zůstat pevnou oporou
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dlouhodobý opatrovnický spor přináší extrémní hladinu stresu, pocity bezmoci a vyčerpání. 
                Pamatujte na pravidlo kyslíkové masky v letadle: abyste mohli pomoci svému dítěti, musíte 
                nejprve udržet vlastní psychickou a fyzickou stabilitu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-extrabold text-sm">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Pravidlo 24 hodin na odpověď</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Na provokativní e-maily a zprávy nikdy neodpovídejte okamžitě v afektu. Dopřejte si odstup 
                  alespoň 12 až 24 hodin. Nechte emoce opadnout a odpovězte pouze na věcnou podstatu.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-extrabold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Oddělení role otce a ex-partnera</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Partnerský vztah skončil, rodičovský vztah trvá navždy. Když jste s dítětem, věnujte se plně jemu 
                  a nenechte spor s bývalou partnerkou otravovat váš společný čas.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-extrabold text-sm">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Podpůrná síť a ventilace</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nezůstávejte na situaci sami. Mluvte s přáteli, rodinou, vyhledejte podpůrnou skupinu otců 
                  nebo psychoterapeuta. Dítě nikdy nesmí být vaším důvěrníkem ani hromosvodem stresu.
                </p>
              </div>
            </div>

            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-2">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                Deník a evidence faktů jako nástroj psychického klidu
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Vedení věcného kalendáře a deníku péče (kdy dítě bylo u vás, co jste dělali, jak proběhlo předání) 
                vám pomůže získat kontrolu nad realitou a zbavit se pocitu bezmoci před soudem a OSPOD.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Krizové linky a kontakty */}
      {(activeTab === 'crisis' || typeof window === 'undefined') && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-2">
                <Phone className="w-3.5 h-3.5" />
                <span>Bezplatná a anonymní krizová pomoc</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Krizové linky a kontakty odborné pomoci v ČR
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pokud procházíte akutní krizí, cítíte se vyčerpaní nebo potřebujete poradit s konkrétní 
                situací u dítěte, neváhejte kontaktovat akreditované linky důvěry a odborná pracoviště.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Rodičovská linka */}
              <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-blue-950 text-base">Rodičovská linka</span>
                    <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px] font-bold">Pro rodiče</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Odborná krizová intervence a poradenství pro rodiče v krizových rodinných situacích.
                  </p>
                </div>
                <a
                  href="tel:606021021"
                  className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>606 021 021</span>
                </a>
              </div>

              {/* Linka bezpečí */}
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-emerald-950 text-base">Linka bezpečí</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">Pro děti</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Bezplatná nonstop linka pro děti a mládež v krizových a obtížných životních situacích.
                  </p>
                </div>
                <a
                  href="tel:116111"
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>116 111</span>
                </a>
              </div>

              {/* Linka první psychické pomoci */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-indigo-950 text-base">Linka první psych. pomoci</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[10px] font-bold">Pro dospělé</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Anonymní a bezplatná nonstop linka pro dospělé v akutní psychické krizi nebo stresu.
                  </p>
                </div>
                <a
                  href="tel:116123"
                  className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>116 123</span>
                </a>
              </div>

              {/* Bílý kruh bezpečí */}
              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-purple-950 text-base">Bílý kruh bezpečí</span>
                    <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-bold">Krize & Právo</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Nonstop bezplatná linka pro oběti kriminality, domácího násilí a náročných konfliktů.
                  </p>
                </div>
                <a
                  href="tel:116006"
                  className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>116 006</span>
                </a>
              </div>

              {/* Linka pro mámy a táty LOM */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-slate-900 text-base">Linka LOM pro táty</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">Pro muže</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    Specializovaná poradenská linka Ligy otevřených mužů pro otce v krizových situacích.
                  </p>
                </div>
                <a
                  href="tel:+420733642905"
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>733 642 905</span>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2 print:hidden">
              <button
                onClick={() => handleNav('/krizova-pomoc')}
                className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Krizový rozcestník & Linky pomoci</span>
              </button>
              <button
                onClick={() => handleNav('/sos-plan')}
                className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                <span>Otevřít SOS Krizový plán</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAVAZUJÍCÍ MODULY: Chcete pokračovat? */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-md print:hidden">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
            Navazující moduly & Nástroje
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Chcete pokračovat dále?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Propojení s dalšími specializovanými průvodci, kalkulačkami a právními rozcestníky portálu.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={() => handleNav('/komunikace-biff')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Komunikace BIFF</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Průvodce deeskalační komunikací a pravidly pro psaní věcných zpráv.</p>
          </button>

          <button
            onClick={() => handleNav('/studie')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Knihovna studií</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Databáze peer-reviewed mezinárodních výzkumů o péči a vývoji dětí.</p>
          </button>

          <button
            onClick={() => handleNav('/judikatura')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <Scale className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Judikatura ÚS</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Klíčové nálezy Ústavního soudu ČR týkající se péče o děti a práv otců.</p>
          </button>

          <button
            onClick={() => handleNav('/ospod')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Průvodce OSPOD</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Jak komunikovat s orgánem sociálně-právní ochrany dětí věcně a bez emocí.</p>
          </button>

          <button
            onClick={() => handleNav('/kalkulacka-vyzivneho')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Kalkulačka výživného</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Informativní výpočet výživného dle platných doporučujících tabulek MS ČR.</p>
          </button>

          <button
            onClick={() => handleNav('/majetek')}
            className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <strong className="text-sm font-bold block text-white">Majetkové vypořádání</strong>
            <p className="text-[11px] text-slate-300 mt-0.5">Vypořádání společného jmění manželů (SJM) a bydlení po rozvodu.</p>
          </button>
        </div>
      </div>
    </div>
  );
};
