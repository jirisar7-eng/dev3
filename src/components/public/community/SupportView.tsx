import React from 'react';
import { SeoHead } from '../SeoHead';
import {
  HandHeart,
  ArrowLeft,
  PhoneCall,
  Users,
  ShieldCheck,
  FileCheck,
  HeartHandshake,
  CheckCircle2,
  ExternalLink,
  MessageCircle
} from 'lucide-react';

interface SupportViewProps {
  onNavigate: (path: string) => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onNavigate }) => {
  const crisisHelplines = [
    {
      name: 'Linka první psychické pomoci',
      phone: '116 123',
      detail: 'Anonymně, zdarma, 24 hodin denně, 7 dní v týdnu. Pro každého v akutní psychické krizi.',
      badge: 'Nonstop zdarma',
      color: 'border-rose-200 bg-rose-50/50',
    },
    {
      name: 'Pražská linka důvěry',
      phone: '+420 222 580 697',
      detail: 'Odborná psychologická intervence a telefonická krizová pomoc.',
      badge: '24/7 Provoz',
      color: 'border-indigo-200 bg-indigo-50/50',
    },
    {
      name: 'Krizové centrum RIAPS',
      phone: '+420 222 582 151',
      detail: 'Ambulantní krizová péče, osobní konzultace i telefonická podpora.',
      badge: 'Krizové centrum',
      color: 'border-blue-200 bg-blue-50/50',
    },
    {
      name: 'Bílý kruh bezpečí',
      phone: '116 006',
      detail: 'Pomoc obětem trestných činů, domácího násilí a bezdůvodného osočování.',
      badge: 'BKB Pomoc',
      color: 'border-amber-200 bg-amber-50/50',
    },
    {
      name: 'Liga otevřených mužů (LOM) – Psychologická pomoc',
      phone: '+420 733 642 905',
      detail: 'Odborná psychologická pomoc, krizová intervence a poradenství zaměřené specificky na muže v obtížných životních situacích, při rozpadu rodiny nebo v tísni.',
      badge: 'LOM Pomoc',
      color: 'border-indigo-200 bg-indigo-50/50',
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Podpora & Mentoring (Táta-Parťák) • Táta má právo"
        description="Kontakty na nonstop krizové linky, vrstevnický mentorský program Táta-Parťák a zapojení dobrovolníků s garancí Kodexu."
        canonicalPath="/podpora"
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
          <div className="flex items-center gap-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <HandHeart className="w-5 h-5" />
            <span>Krizová Opora & Mentorská Síť</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Podpora & Mentorský program Táta-Parťák
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Vrstevnická podpora otců, kteří si úspěšně prošli opatrovnickým řízením a nabízejí pomoc tátům v akutní krizi.
          </p>
        </div>
      </div>

      {/* Helplines Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <PhoneCall className="w-5 h-5 text-rose-600" />
          <span>Nonstop Krizové linky psychické pomoci</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {crisisHelplines.map((line, idx) => (
            <div key={idx} className={`p-6 rounded-2xl border shadow-xs flex flex-col justify-between ${line.color}`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-extrabold text-slate-900">{line.name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 font-bold text-[10px] border border-slate-200">
                    {line.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{line.detail}</p>
              </div>

              <a
                href={`tel:${line.phone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 text-sm font-black text-indigo-700 hover:text-indigo-900 transition-colors pt-2 border-t border-slate-200/60"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{line.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Program Táta-Parťák (Peer Mentoring) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Vrstevnický Mentoring</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Program "Táta-Parťák": Osobní mentor v opatrovnické krizi
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Propojujeme otce, kteří čelí akutnímu rozchodu nebo odepření styku, se zkušenými mentory z naší komunity, kteří sami úspěšně obhájili práva svých dětí u soudů a mají věcný nadhled.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <strong className="text-white text-xs block font-bold">1. Chladná hlava</strong>
              <p className="text-[11px] text-slate-400">Pomoc s aplikací BIFF komunikace a odvrácením afektu.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <strong className="text-white text-xs block font-bold">2. Příprava na soud</strong>
              <p className="text-[11px] text-slate-400">Sdílení praktických zkušeností s chováním u OSPOD a soudce.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <strong className="text-white text-xs block font-bold">3. Lidské porozumění</strong>
              <p className="text-[11px] text-slate-400">Vědomí, že v tom nejste sami a někdo vás skutečně chápe.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('/poradna')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              Chci požádat o Táta-Parťáka
            </button>
            <button
              onClick={() => onNavigate('/dohoda-o-spolupraci')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
            >
              Chci se stát mentorem
            </button>
          </div>
        </div>
      </div>

      {/* Ověřené specializované organizace */}
      <div id="section-organizations" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <span>Odborné státní a nestátní organizace (Ověřené zdroje k srpnu 2026)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Oficiální instituce a organizace, na které se můžete obrátit pro odbornou psychologickou, právní a sociální pomoc.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div id="card-cak" className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200 rounded-md">Právní zastoupení</span>
                <h4 className="text-sm font-black text-slate-900">Česká advokátní komora (ČAK)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Oficiální profesní komora advokátů. Umožňuje bezplatné přidělení advokáta (§ 18a zákona o advokacii) a nabízí online vyhledávač specialistů na rodinné právo.
                </p>
              </div>
              <a href="https://www.cak.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span>Přejít na cak.cz</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div id="card-aop" className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Bezplatná pomoc</span>
                <h4 className="text-sm font-black text-slate-900">Asociace občanských poraden (AOP)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Síť nezávislých občanských poraden po celé ČR. Poskytují bezplatné, anonymní a nestranné sociálně-právní poradenství v otázkách bydlení, rodiny, dluhů a práva.
                </p>
              </div>
              <a href="https://www.obcanskeporadny.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span>obcanskeporadny.cz</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div id="card-amcr" className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200 rounded-md">Mimosoudní smír</span>
                <h4 className="text-sm font-black text-slate-900">Asociace mediátorů ČR (AMČR)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Zastřešující asociace akreditovaných zapsaných mediátorů. Pomáhá vyhledat nezávislé odborníky pro rodinnou mediaci a uzavření mimosoudní rodičovské dohody.
                </p>
              </div>
              <a href="https://www.amcr.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span>amcr.cz</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div id="card-aperio" className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md">Podpora rodiny</span>
                <h4 className="text-sm font-black text-slate-900">Aperio – zdravé rodičovství</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nezisková organizace specializovaná na podporu rodičů při rozchodu. Nabízí prověřené metodiky pro střídavou péči, bezplatné psychologické i právní poradny a kurzy.
                </p>
              </div>
              <a href="https://www.aperio.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span>aperio.cz</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div id="card-lom" className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-purple-50 text-purple-700 border border-purple-200 rounded-md">Psychická pomoc</span>
                <h4 className="text-sm font-black text-slate-900">Liga otevřených mužů (LOM)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Nezisková organizace zaměřená na rozvoj aktivního otcovství a psychologickou pomoc mužům. Nabízí specializované konzultace při rozpadu rodiny, kurzy zvládání hněvu a krize.
                </p>
              </div>
              <a href="https://ilom.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span>ilom.cz</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div id="card-ombudsman" className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 text-[9px] font-black tracking-wider uppercase bg-rose-50 text-rose-700 border border-rose-200 rounded-md">Státní kontrola</span>
                <h4 className="text-sm font-black text-slate-900">Veřejný ochránce práv (Ombudsman)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Státní orgán kontroly veřejné správy. Přejímá a prošetřuje stížnosti rodičů na pochybení, podjatost či nečinnost kolizního opatrovníka OSPOD a navrhuje nápravná opatření.
                </p>
              </div>
              <a href="https://www.ochrance.cz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span>ochrance.cz</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Volunteer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-indigo-600" />
            <span>Dobrovolnictví & Transparentnost</span>
          </h3>
          <p className="text-xs text-slate-600 max-w-2xl">
            Všichni naši mentoři a poradci podepisují oficiální Dobrovolnický kodex a e-Smlouvu o spolupráci garanci etického přístupu.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/kodex-dobrovolnika')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Zobrazit Kodex dobrovolníka</span>
            </button>

            <button
              onClick={() => onNavigate('/e-dohoda-dobrovolnika')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>e-Dohoda / e-Smlouva dobrovolníka</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
