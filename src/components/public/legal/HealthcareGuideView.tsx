import React from 'react';
import {
  Stethoscope,
  Scale,
  FileText,
  MessageSquare,
  Activity,
  Thermometer,
  Briefcase,
  Share2,
  CheckSquare,
  Users,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { SeoHead } from '../SeoHead';
import {
  PravaRodiceSubpage,
  DokumentaceSubpage,
  KomunikaceSubpage,
  PsychologieSubpage,
  NemocSubpage,
  OcrSubpage,
  PredavaniSubpage,
  ChecklistSubpage,
  OdborniciSubpage
} from './healthcare/HealthcareSubpages';

interface HealthcareGuideViewProps {
  subPath?: string;
  onNavigate?: (path: string) => void;
}

export const HealthcareGuideView: React.FC<HealthcareGuideViewProps> = ({ subPath = '', onNavigate }) => {
  const cleanSubPath = subPath.toLowerCase().trim();

  // Subpage routing based on subPath
  if (cleanSubPath === 'prava-rodice' || cleanSubPath === 'prava') {
    return <PravaRodiceSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'dokumentace' || cleanSubPath === 'zdravotni-dokumentace') {
    return <DokumentaceSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'komunikace') {
    return <KomunikaceSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'psychologie') {
    return <PsychologieSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'nemoc') {
    return <NemocSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'ocr') {
    return <OcrSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'predavani' || cleanSubPath === 'predavani-informaci') {
    return <PredavaniSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'checklist') {
    return <ChecklistSubpage onNavigate={onNavigate} />;
  }
  if (cleanSubPath === 'odbornici') {
    return <OdborniciSubpage onNavigate={onNavigate} />;
  }

  // Default: Main HUB / Rozcestník (/zdravotni-pece)
  const categories = [
    {
      id: 'prava-rodice',
      title: 'Práva rodiče',
      url: '/zdravotni-pece/prava-rodice',
      description: 'Rovnocennost rodičovské odpovědnosti, běžná vs. závažná péče a přítomnost u vyšetření.',
      icon: <Scale className="w-5 h-5 text-teal-600" />,
      badge: 'Zákonný rámec'
    },
    {
      id: 'dokumentace',
      title: 'Zdravotnická dokumentace',
      url: '/zdravotni-pece/dokumentace',
      description: 'Nahlížení, výpisy a kopie podle § 65 zákona č. 372/2011 Sb. a vzory žádostí.',
      icon: <FileText className="w-5 h-5 text-teal-600" />,
      badge: 'Právo na nahlížení'
    },
    {
      id: 'komunikace',
      title: 'Komunikace s lékařem',
      url: '/zdravotni-pece/komunikace',
      description: 'BIFF tón, věcné předávání informací a jak nezatahovat lékaře do sporu.',
      icon: <MessageSquare className="w-5 h-5 text-teal-600" />,
      badge: 'Metodika BIFF'
    },
    {
      id: 'psychologie',
      title: 'Psychologická péče',
      url: '/zdravotni-pece/psychologie',
      description: 'Dětská terapie, krizová intervence, ochrana soukromí dítěte a napojení na psychologii.',
      icon: <Activity className="w-5 h-5 text-teal-600" />,
      badge: 'Duševní zdraví'
    },
    {
      id: 'nemoc',
      title: 'Nemoc dítěte',
      url: '/zdravotni-pece/nemoc',
      description: 'Praktický režim při onemocnění, teplota, léky dle zdravotníka a podstatná pravidla.',
      icon: <Thermometer className="w-5 h-5 text-teal-600" />,
      badge: 'Péče o nemocné'
    },
    {
      id: 'ocr',
      title: 'Ošetřovné (OČR)',
      url: '/zdravotni-pece/ocr',
      description: 'Ošetřovné člena rodiny dle zákona č. 187/2006 Sb., střídání rodičů a ČSSZ.',
      icon: <Briefcase className="w-5 h-5 text-teal-600" />,
      badge: 'Nárok & ČSSZ'
    },
    {
      id: 'predavani',
      title: 'Předávání informací',
      url: '/zdravotni-pece/predavani',
      description: 'Doporučená struktura zápisu, přehledová tabulka a modelové příklady zpráv.',
      icon: <Share2 className="w-5 h-5 text-teal-600" />,
      badge: 'Předávací protokol'
    },
    {
      id: 'checklist',
      title: 'Interaktivní checklist',
      url: '/zdravotni-pece/checklist',
      description: 'Interaktivní kontrolní seznam kroků u lékaře s lokálním ukládáním bez PII.',
      icon: <CheckSquare className="w-5 h-5 text-teal-600" />,
      badge: 'Ukládá se v prohlížeči'
    },
    {
      id: 'odbornici',
      title: 'Přehled odborníků',
      url: '/zdravotni-pece/odbornici',
      description: 'Přehled rolí a kompetencí: pediatr, specialista, psycholog, psychiatr, právník, OSPOD, ČSSZ.',
      icon: <Users className="w-5 h-5 text-teal-600" />,
      badge: 'Kompetence rolí'
    }
  ];

  return (
    <div className="space-y-8 pt-4 max-w-5xl mx-auto">
      <SeoHead
        title="Zdravotní péče o dítě — Praktický rozcestník pro rodiče"
        description="Praktická orientace v péči o zdraví dítěte, komunikaci s lékaři, zdravotnické dokumentaci a OČR."
        canonicalPath="/zdravotni-pece"
      />

      {/* Main Hub Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
            <Stethoscope className="w-4 h-4 text-teal-400" />
            <span>Zdravotnictví a lékaři</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Zdravotní péče o dítě
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            Praktická orientace v péči o zdraví dítěte, komunikaci s lékaři, zdravotnické dokumentaci a OČR. Vyberte tematickou oblast pro detailní průvodce a kroky.
          </p>
        </div>
      </div>

      {/* Amber Legal Disclaimer */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <p>
          <strong>Právní & zdravotní upozornění:</strong> Informace na této stránce mají obecný informační a vzdělávací charakter. Nenahrazují individuální právní ani zdravotní poradenství. Konkrétní postup může záviset na zdravotním stavu dítěte, rozhodnutí zdravotníka a konkrétní právní situaci.
        </p>
      </div>

      {/* 9 Category Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Tematické okruhy (9 oblastí)</h2>
          <span className="text-xs text-slate-500 font-medium">Klikněte pro detailní postup</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigate ? onNavigate(cat.url) : (window.location.href = cat.url)}
              className="group bg-white hover:bg-teal-50/50 p-5 rounded-2xl border border-slate-200 hover:border-teal-300 shadow-sm hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 group-hover:bg-teal-100/80 transition-colors">
                    {cat.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {cat.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="flex items-center justify-end text-xs font-bold text-teal-700 group-hover:text-teal-900 pt-2 border-t border-slate-100">
                <span>Otevřít průvodce</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fast Action CTA Band */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-teal-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Rychlé právní formuláře pro lékaře
          </h3>
          <p className="text-xs text-slate-300">
            Potřebujete okamžitě vygenerovat písemnou Žádost o informace o zdravotním stavu dítěte?
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => onNavigate ? onNavigate('/ai-formulare?template=zdravotni-informace') : (window.location.href = '/ai-formulare?template=zdravotni-informace')}
            className="inline-flex items-center gap-2 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            <span>Generovat žádost</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Provenance Footer */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
        <strong>Primární zdroje & právní garance:</strong> Zákon č. 89/2012 Sb. (občanský zákoník), Zákon č. 372/2011 Sb. (o zdravotních službách), Zákon č. 187/2006 Sb. (o nemocenském pojištění). Ministerstvo zdravotnictví ČR, Česká správa sociálního zabezpečení (ČSSZ). Aktuálnost ověřena k: Srpen 2026.
      </div>
    </div>
  );
};
