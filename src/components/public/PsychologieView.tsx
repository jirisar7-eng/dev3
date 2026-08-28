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
  LifeBuoy
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <SeoHead
        title="Psychologická podpora dětí a otců v rozvodové situaci • Táta má právo"
        description="Odborný a praktický průvodce zvládáním rozvodového konfliktu, ochranou psychiky dítěte, metodou komunikace BIFF a kontakty na krizovou pomoc."
        canonicalPath="/psychologie"
      />

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Odborná informační opora & Psychohygiena</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Psychologická podpora a ochrana dítěte
          </h1>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed opacity-95">
            Rozvod rodičů představuje pro dítě i rodiče náročnou životní tranzici. 
            Cílem tohoto průvodce je pomoci vám udržet pro dítě bezpečný přístav, 
            odfiltrovat destruktivní emoce a nastavit udržitelnou komunikaci bez eskalace konfliktů.
          </p>
        </div>
      </div>

      {/* Ethics & Professional Note Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl shadow-xs flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <strong className="font-bold">Odborné a etické vymezení:</strong>
          <p className="text-amber-800 leading-relaxed">
            Informace v tomto modulu mají podpůrný a edukativní charakter a nenahrazují individuální 
            psychologickou, psychiatrickou ani rodinnou terapii. Zásadně odmítáme laické stanovování 
            diagnóz a patologizování druhého rodiče. Veškerá doporučení jsou vedena principem 
            ochrany zdravého citového vývoje a nejlepšího zájmu dítěte.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('child')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'child'
              ? 'bg-blue-900 text-white shadow-sm'
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
              ? 'bg-blue-900 text-white shadow-sm'
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
              ? 'bg-blue-900 text-white shadow-sm'
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
              ? 'bg-rose-900 text-white shadow-sm'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-rose-600" />
          <span>Krizové linky a pomoc</span>
        </button>
      </div>

      {/* TAB 1: Dítě uprostřed konfliktu */}
      {activeTab === 'child' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Jak dítě vnímá konflikt rodičů a jak ho chránit
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Dítě miluje oba rodiče přirozeně a bezpodmínečně. Konflikt mezi rodiči pro něj představuje 
                ohrožení jeho základní životní jistoty. Největším darem, který můžete dítěti dát, je povolení 
                mít rádo druhého rodiče bez pocitu viny a loajalitního konfliktu.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Co dítěti zásadně pomáhá</span>
                </div>
                <ul className="text-xs text-emerald-800 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Pravidelné ujišťování: „Rozchod je věc dospělých, ty za nic nemůžeš.“</li>
                  <li>Pozitivní nebo neutrální vyjadřování o druhém rodiči v přítomnosti dítěte.</li>
                  <li>Předvídatelný režim, dodržování dohodnutého harmonogramu a předávání bez scén.</li>
                  <li>Možnost volně a bez obav sdílet zážitky z pobytu u druhého rodiče.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Čeho se vyvarovat (rizika pro dítě)</span>
                </div>
                <ul className="text-xs text-rose-800 space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>Používání dítěte jako poslíčka nebo vyzvědače („Co táta dělal? Kdo tam byl?“).</li>
                  <li>Rozebírání detailů soudu, výživného nebo advokátů před dítětem.</li>
                  <li>Vyvolávání pocitu viny při odchodu k druhému rodiči („Bude mi tu bez tebe smutno“).</li>
                  <li>Nucení dítěte, aby si volilo, koho má raději nebo s kým chce bydlet.</li>
                </ul>
              </div>
            </div>

            {/* Věková specifika */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Potřeby dítěte podle věkových etap
                </h3>
                <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                  {(['0-3', '3-6', '6-11', '12+'] as const).map((age) => (
                    <button
                      key={age}
                      onClick={() => setSelectedAge(age)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedAge === age
                          ? 'bg-blue-900 text-white shadow-xs'
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

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-3">
                {selectedAge === '0-3' && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Kojenci a batolata (0–3 roky): Budování attachmentu a častý kontakt
                    </h4>
                    <p>
                      V tomto věku je klíčová frekvence kontaktu. Dítě nemá vyvinuté dlouhodobé vnímání času – pauza 
                      delší než několik dní oslabuje paměťovou stopu. Ideální je častý kontakt vícekrát týdně a postupné 
                      zvykání na nocování v bezpečném a klidném prostředí u otce. Judikatura Ústavního soudu 
                      opakovaně potvrdila, že věk sám o sobě není překážkou pro péči otce.
                    </p>
                  </div>
                )}

                {selectedAge === '3-6' && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Předškolní věk (3–6 let): Magické myšlení a potřeba stálosti
                    </h4>
                    <p>
                      Děti v tomto věku často trpí egocentrickou vinou (myslí si, že se rodiče rozešli, protože zlobily). 
                      Velmi pomáhá vizuální kalendář s barevným vyznačením dní („dny u táty / dny u mámy“), rituály předávání 
                      a jasné ujištění, že láska rodičů k dítěti se nikdy nemění.
                    </p>
                  </div>
                )}

                {selectedAge === '6-11' && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Mladší školní věk (6–11 let): Školní povinnosti a kroužky
                    </h4>
                    <p>
                      Zde je zásadní, aby oba rodiče byli plnohodnotně zapojeni do běžného života – domácí úkoly, 
                      třídní schůzky, sportovní kroužky, návštěvy lékaře. Otec nesmí být redukován pouze na víkendového 
                      baviče. Respektujte zázemí pro učení v obou domovech (stejné učebnice, psací stůl).
                    </p>
                  </div>
                )}

                {selectedAge === '12+' && (
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">
                      Dospívající (12+ let): Vlastní sociální svět a participativní práva
                    </h4>
                    <p>
                      Dospívající dítě má silnou potřebu být s vrstevníky a mít svůj program. Rigidní vynucování 
                      harmonogramu může vyvolat odpor. Je nutné s dítětem partnersky komunikovat, respektovat jeho názor 
                      a současně mu poskytovat stabilní oporu a hranice.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Komunikace a BIFF */}
      {activeTab === 'communication' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ověřená metoda komunikace s vysokokonfliktním partnerem</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                Metoda BIFF v praxi rodičovské komunikace
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Metoda BIFF (Brief, Informative, Friendly, Firm) vyvinutá Billem Eddym slouží k deeskalaci napětí. 
                Cílem není „vyhrát hádku“, ale předat nezbytné informace o dítěti bez emocí, které by druhá strana 
                mohla použít k dalšímu konfliktu nebo u soudu.
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

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-indigo-900">
                <strong>Chcete si nechat zprávu zkontrolovat AI?</strong> Využijte náš integrovaný BIFF převodník.
              </div>
              <button
                onClick={() => handleNav('/ai-asistent')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <span>Otevřít BIFF Převodník v AI Asistentovi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Psychohygiena otce */}
      {activeTab === 'hygiene' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
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
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Pravidlo 24 hodin na odpověď</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Na provokativní e-maily a zprávy nikdy neodpovídejte okamžitě v afektu. Dopřejte si odstup 
                  alespoň 12 až 24 hodin. Nechte emoce opadnout a odpovězte pouze na věcnou podstatu.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Oddělení role otce a ex-partnera</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Partnerský vztah skončil, rodičovský vztah trvá navždy. Když jste s dítětem, věnujte se plně jemu 
                  a nenechte spor s bývalou partnerkou otravovat váš společný čas.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
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
      {activeTab === 'crisis' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Rodičovská linka */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-950 text-base">Rodičovská linka</span>
                  <span className="px-2 py-0.5 rounded bg-blue-200 text-blue-900 text-[10px] font-bold">Pro rodiče</span>
                </div>
                <div className="text-xl font-black text-blue-600 font-mono">606 021 021</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Odborná krizová intervence a poradenství pro rodiče v krizových rodinných situacích. 
                  Dostupné i přes e-mail a chat.
                </p>
              </div>

              {/* Linka bezpečí */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-950 text-base">Linka bezpečí</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">Pro děti</span>
                </div>
                <div className="text-xl font-black text-emerald-600 font-mono">116 111</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bezplatná nonstop linka pro děti a mládež v krizových a obtížných životních situacích.
                </p>
              </div>

              {/* Linka první psychické pomoci */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-950 text-base">Linka první psychické pomoci</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-200 text-indigo-900 text-[10px] font-bold">Pro dospělé</span>
                </div>
                <div className="text-xl font-black text-indigo-600 font-mono">116 123</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Anonymní a bezplatná linka pro dospělé v akutní psychické krizi, stresu nebo beznaději.
                </p>
              </div>

              {/* Bílý kruh bezpečí */}
              <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-purple-950 text-base">Bílý kruh bezpečí</span>
                  <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-900 text-[10px] font-bold">Krize & Právo</span>
                </div>
                <div className="text-xl font-black text-purple-600 font-mono">116 006</div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nonstop bezplatná linka pro oběti kriminality, domácího násilí a náročných krizových konfliktů.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => handleNav('/sos-plan')}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                <LifeBuoy className="w-4 h-4" />
                <span>Otevřít SOS Krizový plán</span>
              </button>
              <button
                onClick={() => handleNav('/forum')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-slate-600" />
                <span>Komunitní fórum & zkušenosti otců</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Cross-links */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-black text-slate-900 text-sm">Potřebujete řešit právní nebo finanční souvislosti?</h4>
          <p className="text-xs text-slate-600 mt-0.5">Navštivte naše navazující specializované moduly a kalkulačky.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleNav('/kalkulacka-vyzivneho')}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            Kalkulačka výživného
          </button>
          <button
            onClick={() => handleNav('/majetek')}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            Majetkové vypořádání (SJM)
          </button>
          <button
            onClick={() => handleNav('/judikatura')}
            className="px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Judikatura ÚS
          </button>
        </div>
      </div>
    </div>
  );
};
