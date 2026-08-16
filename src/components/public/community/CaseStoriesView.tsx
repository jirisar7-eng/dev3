import React, { useState } from 'react';
import { SeoHead } from '../SeoHead';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Scale,
  Award,
  ChevronDown,
  ChevronUp,
  Heart,
  ShieldCheck,
  Calendar,
  Sparkles
} from 'lucide-react';

interface Story {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  childAge: string;
  duration: string;
  result: string;
  summary: string;
  timeline: Array<{ period: string; event: string }>;
  takeaway: string;
  judicature?: string;
  details: string;
}

interface CaseStoriesViewProps {
  onNavigate: (path: string) => void;
}

export const CaseStoriesView: React.FC<CaseStoriesViewProps> = ({ onNavigate }) => {
  const stories: Story[] = [
    {
      id: 'story-1',
      title: 'Od nuly ke střídavé péči u 10měsíčního chlapce',
      subtitle: 'Vyvrácení mýtu o údajné nemožnosti přespávání kojenců a batolat u otce',
      badge: 'Ústřední judikatura',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      childAge: '10 měsíců na začátku (nyní 3 roky)',
      duration: '8 měsíců soudního řízení',
      result: 'Rovnocenná střídavá péče 7/7 dní s přespáváním',
      summary: 'Matka i OSPOD tvrdily, že kojenec potřebuje výhradní péči matky a přespávání u otce je možné až od 3 let. Díky vědeckým studiím a nálezům Ústavního soudu se podařilo dohodnout postupné navyšování péče zakončené rovnocenným režimem.',
      timeline: [
        { period: '1. měsíc', event: 'Matka brání kontaktu. Otec podává návrh na úpravu péče s odkazem na studii dr. Warshak (2014) o přespávání batolat.' },
        { period: '3. měsíc', event: 'Soud vydává úpravu styku: 3x týdně odpoledne po 4 hodinách + sobota. Otec důsledně pečuje, nakupuje výbavu.' },
        { period: '5. měsíc', event: 'Rozšíření na 1 noc týdně (sobota-neděle). OSPOD na základě zprávy dětské lékařky konstatuje vynikající vazbu.' },
        { period: '8. měsíc', event: 'Rozsudek: Střídavá péče v cyklu týden / týden od 18 měsíců věku chlapce.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. II. ÚS 1642/22 & I. ÚS 3216/13 – věk dítěte sám o sobě nevylučuje přespávání u otce, je-li vybudována citová vazba.',
      takeaway: 'Nenechte se odbýt tvrzením, že malé dítě "patří k matce". Trvejte na postupné adaptaci od prvních měsíců rozchodu.',
      details: 'Klíčem k úspěchu bylo, že otec okamžitě zajistil plně vybavený dětský pokojíček, kojeneckou stravu, pleny a vedl si pečlivý deník. Na OSPOD se choval maximálně vstřícně a nikdy nekritizoval matku.',
    },
    {
      id: 'story-2',
      title: 'Jak jsem ustál 14 měsíců křivého obvinění a získal dítě do péče',
      subtitle: 'Praktická metodika obrany proti falešným nařčením z domácího násilí a zneužívání',
      badge: 'Forenzní znalecký posudek',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      childAge: '5 let (dcera)',
      duration: '14 měsíců',
      result: 'Střídavá péče + očištění jména otce',
      summary: 'Během vyhroceného rozvodu podala matka na otce trestní oznámení pro údajné psychické a fyzické týrání. Otec zachoval absolutní klid, nesnížil se k odplatě a aktivně součinnil s PČR a soudními znalci.',
      timeline: [
        { period: '1. měsíc', event: 'Podáno trestní oznámení. Otec okamžitě přechází výhradně na písemnou komunikaci a vyhledává právní zastoupení.' },
        { period: '4. měsíc', event: 'PČR po prověření věc odkládá. Matka podává stížnost. Otec navrhuje vypracování komplexního znaleckého posudku.' },
        { period: '9. měsíc', event: 'Znalecký posudek z oboru dětské psychologie potvrzuje vysoce nadprůměrnou vazbu dcery k otci a účelovost nařčení matky.' },
        { period: '14. měsíc', event: 'Soud schvaluje střídavou péči a varuje matku před dalším ovlivňováním dítěte.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. III. ÚS 149/20 – účelové bránění ve styku a falešná obvinění jsou závažným porušením práv dítěte.',
      takeaway: 'Při křivém obvinění nepodléhejte panice. Nevyhrožujte, trvejte na odborném psychologickém posudku a zachovejte chladnou hlavu.',
      details: 'Rozhodujícím faktorem byl kompletní archiv zpráv v BIFF tónu. Když soudní znalec četl komunikaci, viděl klidného otce nabízejícího dohodu a hysterií reagující matku.',
    },
    {
      id: 'story-3',
      title: 'Rekonstrukce vztahu s dospívající dcerou po letech manipulace',
      subtitle: 'Překonání syndromu zavrženého rodiče (PAS) a obnova citové vazby u 14leté slečny',
      badge: 'Obnova vazby & Terapie',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      childAge: '14 let (dcera)',
      duration: '18 měsíců',
      result: 'Obnovení pravidelného styku a víkendových pobytů',
      summary: 'Po 3 letech od rozvodu dcera pod vlivem matky odmítala s otcem mluvit i se setkat. Otec nevyvíjel agresivní tlak, ale nabízel nepodmíněnou lásku, trpělivost a odbornou rodinnou terapii.',
      timeline: [
        { period: '1. měsíc', event: 'Dcera na setkání pláče a opakuje matčina slova. Otec netrestá, nekritizuje matku, ale ujišťuje dceru o své lásce.' },
        { period: '6. měsíc', event: 'Soud nařídil odbornou rodinnou terapii v neutrálním krizovém centru. Pravidelná 45minutová sezení.' },
        { period: '12. měsíc', event: 'První společný víkendový výlet bez přítomnosti matky. Dcera se postupně otevírá a svěřuje.' },
        { period: '18. měsíc', event: 'Obnoven přirozený vztah. Dcera k otci jezdí dobrovolně každý druhý víkend a část prázdnin.' },
      ],
      judicature: 'Nález Ústavního soudu sp. zn. I. ÚS 2482/13 – povinnost státu a orgánů aktivně pomáhat obnovit narušenou vazbu mezi rodičem a dítětem.',
      takeaway: 'I dospívající dítě zasažené manipulací potřebuje vědět, že ho otec neopustil. Trpělivost a terapie dokáží zázraky.',
      details: 'Otec dceři nikdy neříkal: "Matka ti lže". Místo toho jí ukazoval fotky z dětství, psal jí milé dopisy a na sezeních ji naslouchal bez výčitek.',
    },
  ];

  const [expandedId, setExpandedId] = useState<string | null>('story-1');

  return (
    <div className="space-y-8 pb-16">
      <SeoHead
        title="Příběhy z opatrovnické praxe • Táta má právo"
        description="3 reálné anonymizované kazuistiky otců: Střídavá péče u kojence, zvládnutí křivého obvinění i obnova vztahu s dcerou."
        canonicalPath="/pribehy"
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
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs uppercase tracking-wider mb-2">
            <BookOpen className="w-5 h-5" />
            <span>Kazuistiky & Skutečné příběhy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Příběhy z opatrovnické praxe
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
            Inspirativní a poučné příběhy otců, kteří úspěšně prošli opatrovnickým labyrintem a obhájili právo svého dítěte na oba rodiče.
          </p>
        </div>
      </div>

      {/* Stories Cards List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {stories.map((story) => {
          const isExpanded = expandedId === story.id;
          return (
            <div
              key={story.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-amber-300"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : story.id)}
                className="p-6 sm:p-8 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full border font-bold text-[10px] ${story.badgeBg}`}>
                      {story.badge}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Věk dítěte: {story.childAge}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                    {story.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    {story.subtitle}
                  </p>

                  <p className="text-xs text-slate-500 leading-relaxed pt-1">
                    {story.summary}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Výsledek</span>
                    <strong className="text-xs font-black text-emerald-600">{story.result}</strong>
                  </div>

                  <button className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold cursor-pointer">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Story Details */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-6 sm:p-8 bg-slate-50/50 space-y-6">
                  {/* Key Takeaway Banner */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                    <strong className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Klíčové ponaučení (Takeaway pro vás):</span>
                    </strong>
                    <p className="text-xs font-bold leading-relaxed">{story.takeaway}</p>
                  </div>

                  {/* Details Paragraph */}
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-5 rounded-2xl border border-slate-200">
                    <h4 className="font-extrabold text-slate-900 mb-2 text-xs uppercase tracking-wider">
                      Podrobný průběh kazuistiky:
                    </h4>
                    <p>{story.details}</p>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 mb-3 text-xs uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Časová osa sporu:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {story.timeline.map((step, idx) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                          <span className="text-[10px] font-black text-amber-600 uppercase block">
                            {step.period}
                          </span>
                          <p className="text-xs text-slate-700 leading-snug">{step.event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Judicature Citation */}
                  {story.judicature && (
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex items-start gap-3">
                      <Scale className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block mb-0.5 font-bold">Judikatorní opora:</strong>
                        <span className="text-slate-300">{story.judicature}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
