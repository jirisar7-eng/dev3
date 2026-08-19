import React from 'react';
import {
  Compass,
  Scale,
  Calendar,
  FileText,
  BookOpen,
  Sparkles,
  Shield,
  Users,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Home,
  AlertCircle,
  Phone,
  Lock,
  MessageSquare,
  ListCheck,
  FolderOpen,
  Brain,
  HelpCircle,
  Activity,
  Heart,
  Eye,
  ArrowDown,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { sanitizeCtaUrl } from './utils';

// Helper to safely resolve Lucide icons by string name
export function getIconComponent(iconName?: string) {
  if (!iconName) return Compass;
  const normalized = iconName.trim().toLowerCase();
  switch (normalized) {
    case 'compass': return Compass;
    case 'scale': return Scale;
    case 'calendar': return Calendar;
    case 'filetext':
    case 'file-text': return FileText;
    case 'bookopen':
    case 'book-open': return BookOpen;
    case 'sparkles': return Sparkles;
    case 'shield': return Shield;
    case 'users': return Users;
    case 'hearthandshake':
    case 'heart-handshake': return HeartHandshake;
    case 'arrowright':
    case 'arrow-right': return ArrowRight;
    case 'gavel': return Gavel;
    case 'home': return Home;
    case 'phone': return Phone;
    case 'folderopen':
    case 'folder-open': return FolderOpen;
    case 'brain': return Brain;
    case 'heart': return Heart;
    case 'eye': return Eye;
    case 'lightbulb': return Lightbulb;
    default: return Compass;
  }
}

// ---------------------------------------------------------------------------
// 1. SituationSelectorAdapter ("Nevíte, kde začít?")
// ---------------------------------------------------------------------------
export interface SituationCard {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  icon?: string;
  active?: string | boolean;
}

export interface SituationSelectorProps {
  title?: string;
  subtitle?: string;
  cards?: SituationCard[];
}

export const SituationSelectorAdapter: React.FC<SituationSelectorProps> = ({
  title = 'Nevíte, kde začít?',
  subtitle = 'Vyberte, co právě řešíte.',
  cards = [],
}) => {
  const visibleCards = cards.filter((c) => c.active !== 'false' && c.active !== false);

  return (
    <section className="py-12 sm:py-16 bg-[var(--color-surface,#ffffff)] border-b border-[var(--color-border,#e2e8f0)] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base sm:text-lg text-[var(--color-text,#475569)] font-medium">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCards.map((card, idx) => {
            const IconComp = getIconComponent(card.icon);
            const safeUrl = sanitizeCtaUrl(card.ctaUrl || '#');
            return (
              <div
                key={idx}
                className="flex flex-col justify-between p-6 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>
                {card.ctaText && (
                  <a
                    href={safeUrl}
                    className="inline-flex items-center gap-2 text-sm font-bold text-blue-900 hover:text-blue-700 pt-2 transition-colors border-t border-slate-200/60"
                  >
                    <span>{card.ctaText}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 2. ProcessTimelineAdapter ("Vaše dítě. Vaše péče. Vaše práva.")
// ---------------------------------------------------------------------------
export interface TimelineStep {
  stepNumber?: string;
  title: string;
  description: string;
}

export interface ProcessTimelineProps {
  title?: string;
  subtitle?: string;
  description?: string;
  steps?: TimelineStep[];
}

export const ProcessTimelineAdapter: React.FC<ProcessTimelineProps> = ({
  title = 'Vaše dítě. Vaše péče. Vaše práva.',
  subtitle = 'Portál, který spojuje informace, dokumenty a praktickou pomoc.',
  description = 'Táta má právo není jen databáze článků. Je to nástroj, který má otci pomoci projít celou cestou:',
  steps = [],
}) => {
  return (
    <section className="py-14 sm:py-20 bg-slate-900 text-white w-full border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4">
            <HeartHandshake className="w-4 h-4 text-blue-400" />
            <span>Komplexní proces</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-slate-300 font-medium mb-4">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Process Timeline */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="relative bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/50 transition-all"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-3">
                    {step.stepNumber || idx + 1}
                  </div>
                  <h3 className="font-bold text-white text-base mb-1">
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-xs text-slate-400 leading-normal">
                      {step.description}
                    </p>
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-500">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 3. FeatureGridAdapter ("Co můžete na portálu dělat?")
// ---------------------------------------------------------------------------
export interface FeatureItem {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  icon?: string;
  active?: string | boolean;
}

export interface FeatureGridProps {
  title?: string;
  subtitle?: string;
  features?: FeatureItem[];
}

export const FeatureGridAdapter: React.FC<FeatureGridProps> = ({
  title = 'Co můžete na portálu dělat?',
  subtitle = 'Nástroje a funkce pro každodenní oporu otce.',
  features = [],
}) => {
  const visibleFeatures = features.filter((f) => f.active !== 'false' && f.active !== false);

  return (
    <section className="py-14 sm:py-20 bg-[var(--color-background,#f8fafc)] border-b border-[var(--color-border,#e2e8f0)] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base sm:text-lg text-slate-600">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleFeatures.map((item, idx) => {
            const IconComp = getIconComponent(item.icon);
            const safeUrl = sanitizeCtaUrl(item.ctaUrl || '#');
            return (
              <div
                key={idx}
                className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-blue-900 flex items-center justify-center mb-4">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>
                {item.ctaUrl && item.ctaText && (
                  <a
                    href={safeUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 hover:text-blue-700 transition-colors"
                  >
                    <span>{item.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 4. LifeSituationsGridAdapter ("Řešte svou situaci podle toho, co právě prožíváte")
// ---------------------------------------------------------------------------
export interface SituationGridCard {
  title: string;
  description: string;
  ctaText?: string;
  ctaUrl?: string;
  icon?: string;
  active?: string | boolean;
}

export interface LifeSituationsGridProps {
  title?: string;
  subtitle?: string;
  situations?: SituationGridCard[];
}

export const LifeSituationsGridAdapter: React.FC<LifeSituationsGridProps> = ({
  title = 'Řešte svou situaci podle toho, co právě prožíváte',
  subtitle = 'Vyberte konkrétní téma pro okamžité informace a návody.',
  situations = [],
}) => {
  const visible = situations.filter((s) => s.active !== 'false' && s.active !== false);

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {title}
          </h2>
          {subtitle && (
            <p className="text-base sm:text-lg text-slate-600">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {visible.map((item, idx) => {
            const IconComp = getIconComponent(item.icon);
            const safeUrl = sanitizeCtaUrl(item.ctaUrl || '#');
            return (
              <a
                key={idx}
                href={safeUrl}
                className="group p-5 bg-slate-50 hover:bg-blue-900 text-slate-900 hover:text-white rounded-2xl border border-slate-200/80 hover:border-blue-900 shadow-2xs transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 group-hover:bg-blue-800 group-hover:text-white flex items-center justify-center mb-4 transition-colors">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base mb-2 group-hover:text-white transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 group-hover:text-blue-100 leading-relaxed mb-4 transition-colors">
                    {item.description}
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 group-hover:text-amber-300 pt-2 transition-colors">
                  <span>{item.ctaText || 'Zobrazit téma'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 5. GuideSectionAdapter ("Nevíte, co řešit jako první?")
// ---------------------------------------------------------------------------
export interface GuideSectionProps {
  title?: string;
  text?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const GuideSectionAdapter: React.FC<GuideSectionProps> = ({
  title = 'Nevíte, co řešit jako první?',
  text = 'Použijte našeho průvodce. Odpovězte na několik jednoduchých otázek a portál vám sestaví orientační seznam oblastí, které mohou být pro vaši situaci důležité.',
  ctaText = 'Spustit průvodce',
  ctaUrl = '/ai-guide',
}) => {
  const safeUrl = sanitizeCtaUrl(ctaUrl);

  return (
    <section className="py-14 sm:py-18 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white w-full border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          {title}
        </h2>
        <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed mb-8">
          {text}
        </p>
        <a
          href={safeUrl}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-400 text-slate-950 font-extrabold shadow-lg hover:bg-amber-300 transition-all text-sm"
        >
          <span>{ctaText}</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 6. WorkspaceSectionAdapter ("Vaše dokumenty nemusí být rozházené")
// ---------------------------------------------------------------------------
export interface WorkspaceSectionProps {
  title?: string;
  subtitle?: string;
  note?: string;
  ctaText?: string;
  ctaUrl?: string;
  itemsText?: string;
}

export const WorkspaceSectionAdapter: React.FC<WorkspaceSectionProps> = ({
  title = 'Vaše dokumenty nemusí být rozházené',
  subtitle = 'Vytvořte si vlastní opatrovnickou složku',
  note = 'Jednou zadané údaje nemusíte zbytečně přepisovat do dalších částí portálu.',
  ctaText = 'Otevřít Moji pracovnu',
  ctaUrl = '/user-portal',
  itemsText = 'Rozhodnutí soudu\nNávrhy a vyjádření\nKomunikace rodičů\nDůležité události\nDůkazní materiály\nTermíny jednání\nÚdaje o dítěti\nPlán péče\nDůležitá judikatura\nVlastní poznámky',
}) => {
  const safeUrl = sanitizeCtaUrl(ctaUrl);
  const items = itemsText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="py-14 sm:py-20 bg-slate-50 border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-semibold mb-4">
              <FolderOpen className="w-4 h-4" />
              <span>Můj případ & Osobní složka</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-xl font-bold text-blue-900 mb-6">
              {subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>

            {note && (
              <p className="text-xs text-slate-500 italic mb-6">
                💡 {note}
              </p>
            )}

            <a
              href={safeUrl}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-900 text-white font-bold shadow-md hover:bg-blue-950 transition-all text-sm"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold">
                📁
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Klientský spis otce</h3>
                <p className="text-xs text-slate-500">Zabezpečený centrální uzel</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">Soudní spis:</span> OS Praha 4 • č.j. 12 P 45/2026
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">Harmonogram péče:</span> Liché týdny (ČT - PO), Sudé týdny (ST)
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">Důkazní deník:</span> 14 protokolů o předání, 28 BIFF zpráv
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 7. AiSectionAdapter ("Nechte si pomoci s orientací")
// ---------------------------------------------------------------------------
export interface AiSectionProps {
  title?: string;
  subtitle?: string;
  disclaimer?: string;
  ctaText?: string;
  ctaUrl?: string;
  capabilitiesText?: string;
}

export const AiSectionAdapter: React.FC<AiSectionProps> = ({
  title = 'Nechte si pomoci s orientací',
  subtitle = 'AI průvodce',
  disclaimer = 'AI nenahrazuje advokáta ani soud. Je to nástroj pro orientaci, organizaci informací a přípravu.',
  ctaText = 'Vyzkoušet AI průvodce',
  ctaUrl = '/ai-guide',
  capabilitiesText = 'vytvořit stručné shrnutí\nvytáhnout důležité údaje\nvytvořit seznam otázek\nnajít související témata\npřipravit podklady\nporovnat informace v dokumentech\nvysvětlit složitý text srozumitelněji',
}) => {
  const safeUrl = sanitizeCtaUrl(ctaUrl);
  const caps = capabilitiesText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="py-14 sm:py-20 bg-slate-900 text-white border-b border-slate-800 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-4">
            <Brain className="w-4 h-4 text-amber-400" />
            <span>{subtitle}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            {title}
          </h2>
        </div>

        <div className="max-w-4xl mx-auto bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl">
          <h3 className="text-lg font-bold text-slate-200 mb-6">
            S čím vším vám AI průvodce pomůže:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {caps.map((cap, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/50">
                <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-200 font-medium capitalize">{cap}</span>
              </div>
            ))}
          </div>

          {disclaimer && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl mb-8 flex items-start gap-3 text-amber-200 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{disclaimer}</span>
            </div>
          )}

          <div className="text-center">
            <a
              href={safeUrl}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-400 text-slate-950 font-extrabold shadow-lg hover:bg-amber-300 transition-all text-sm"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 8. KnowledgeCenterAdapter ("Ověřené informace místo chaosu")
// ---------------------------------------------------------------------------
export interface KnowledgeCenterProps {
  title?: string;
  text?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const KnowledgeCenterAdapter: React.FC<KnowledgeCenterProps> = ({
  title = 'Ověřené informace místo chaosu',
  text = 'Cílem je, aby otec nemusel hledat odpověď na deseti různých místech.',
  ctaText = 'Prozkoumat znalostní centrum',
  ctaUrl = '/legal-wiki',
}) => {
  const safeUrl = sanitizeCtaUrl(ctaUrl);

  const funnelSteps = [
    { name: 'České právní předpisy', url: '/state-laws' },
    { name: 'Soudní judikatura', url: '/judikatura' },
    { name: 'Odborné studie', url: '/knihovna-studii' },
    { name: 'Praktické návody', url: '/user-manual' },
    { name: 'Formuláře', url: '/centrum-formularu' },
    { name: 'Vlastní případ uživatele', url: '/user-portal' },
  ];

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            {title}
          </h2>
          {text && (
            <p className="text-base sm:text-lg text-slate-600 font-medium">
              {text}
            </p>
          )}
        </div>

        {/* Funnel Flow */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="flex flex-col items-center space-y-3">
            {funnelSteps.map((step, idx) => (
              <React.Fragment key={idx}>
                <a
                  href={sanitizeCtaUrl(step.url)}
                  className="w-full sm:w-4/5 p-4 rounded-2xl bg-slate-50 hover:bg-blue-900 hover:text-white border border-slate-200 text-center font-bold text-slate-800 text-sm sm:text-base shadow-2xs hover:shadow-md transition-all flex items-center justify-between px-6"
                >
                  <span className="w-6 text-xs text-slate-400 font-mono">{idx + 1}.</span>
                  <span>{step.name}</span>
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </a>
                {idx < funnelSteps.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-blue-600 animate-bounce" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a
            href={safeUrl}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-900 text-white font-bold shadow-md hover:bg-blue-950 transition-all text-sm"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 9. PrincipleSectionAdapter ("Co je důležité? / Dítě není předmět sporu.")
// ---------------------------------------------------------------------------
export interface PrincipleSectionProps {
  title?: string;
  highlightTitle?: string;
  body?: string;
}

export const PrincipleSectionAdapter: React.FC<PrincipleSectionProps> = ({
  title = 'Co je důležité?',
  highlightTitle = 'Dítě není předmět sporu.',
  body = 'Rozchod rodičů je situace dospělých.\n\nPro dítě je ale zásadní, aby mělo bezpečný vztah k oběma rodičům, pokud jsou oba rodiče schopni o něj řádně pečovat.\n\nProto nechceme stavět portál na boji:\notec proti matce\n\nale na principu:\ndítě + oba rodiče + odpovědná péče',
}) => {
  const paragraphs = body.split('\n\n');

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50 to-slate-100 border-b border-slate-200 w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-900 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
          {title}
        </span>

        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight my-6">
          „{highlightTitle}“
        </h2>

        <div className="space-y-4 text-base sm:text-xl text-slate-700 leading-relaxed max-w-2xl mx-auto font-medium">
          {paragraphs.map((p, idx) => (
            <p key={idx} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 10. CtaGridAdapter ("Začněte tam, kde právě jste")
// ---------------------------------------------------------------------------
export interface CtaButtonItem {
  text: string;
  url: string;
}

export interface CtaGridProps {
  title?: string;
  buttons?: CtaButtonItem[];
}

export const CtaGridAdapter: React.FC<CtaGridProps> = ({
  title = 'Začněte tam, kde právě jste',
  buttons = [],
}) => {
  return (
    <section className="py-14 sm:py-20 bg-white border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
          {buttons.map((btn, idx) => {
            const safeUrl = sanitizeCtaUrl(btn.url || '#');
            return (
              <a
                key={idx}
                href={safeUrl}
                className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-blue-900 text-slate-900 hover:text-white font-bold text-sm border border-slate-200 hover:border-blue-900 shadow-2xs hover:shadow-md transition-all flex items-center gap-2"
              >
                <span>{btn.text}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// 11. FooterCtaAdapter ("Táta má právo" Footer Section)
// ---------------------------------------------------------------------------
export interface FooterCtaProps {
  title?: string;
  subtitle?: string;
  text?: string;
  legalDisclaimer?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const FooterCtaAdapter: React.FC<FooterCtaProps> = ({
  title = 'Táta má právo',
  subtitle = 'Informace. Nástroje. Orientace. Podpora.',
  text = 'Projekt vzniká s cílem pomáhat rodičům lépe se orientovat v situacích spojených s rozchodem, péčí o dítě a opatrovnickým řízením.',
  legalDisclaimer = 'Informace na portálu mají informační charakter a nenahrazují individuální právní služby.',
  ctaText = 'Začít',
  ctaUrl = '/sos-plan',
}) => {
  const safeUrl = sanitizeCtaUrl(ctaUrl);

  return (
    <section className="py-16 sm:py-20 bg-slate-950 text-white w-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base sm:text-lg text-blue-400 font-bold mb-6">
            {subtitle}
          </p>
        )}
        {text && (
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
            {text}
          </p>
        )}

        <div className="mb-10">
          <a
            href={safeUrl}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-extrabold shadow-lg hover:bg-blue-500 transition-all text-sm"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {legalDisclaimer && (
          <p className="text-xs text-slate-500 max-w-xl mx-auto border-t border-slate-900 pt-6">
            ⚖️ {legalDisclaimer}
          </p>
        )}
      </div>
    </section>
  );
};
