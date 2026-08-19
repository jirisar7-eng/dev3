import React from 'react';
import { useText } from '../../context/TextContext';
import { Shield, HeartHandshake, Scale, ArrowRight } from 'lucide-react';
import { sanitizeCtaUrl } from './utils';

export interface HeroAdapterProps {
  title?: string;
  subtitle?: string;
  description?: string;
  badgeText?: string;
  highlightBadge?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export const HeroAdapter: React.FC<HeroAdapterProps> = ({
  title,
  subtitle,
  description,
  badgeText,
  highlightBadge,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
}) => {
  const { t } = useText();

  const finalBadge = badgeText || t('home.hero.badge', 'Portál pro právní a psychologickou oporu otců v ČR');
  const finalTitle = title || t('home.hero.title', 'Táta má právo');
  const finalSubtitle = subtitle || 'Pomoc, když se rozpadá rodina. Podpora, když nechcete přijít o své dítě.';
  const finalDescription = description || t(
    'home.hero.subtitle',
    'Rozchod rodičů nemusí znamenat konec vztahu otce s dítětem. Na jednom místě získáte přehled, co můžete udělat, jaká máte práva, jak postupovat vůči soudu a OSPOD, jak si připravit podklady a jak si dlouhodobě udržet přehled o péči o své dítě.'
  );
  const finalHighlight = highlightBadge || 'Nejsme proti matkám. Jsme pro dítě a jeho právo mít oba rodiče.';
  const finalCtaText = ctaText || t('home.hero.cta', 'Začít podle mé situace');
  const finalCtaUrl = sanitizeCtaUrl(ctaUrl || '#situace');
  const finalSecondaryCtaText = secondaryCtaText || 'Prozkoumat portál';
  const finalSecondaryCtaUrl = sanitizeCtaUrl(secondaryCtaUrl || '#sekce');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 py-16 lg:py-24 border-b border-slate-200 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          {finalBadge && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold mb-6 shadow-2xs">
              <Shield className="w-4 h-4 text-blue-700" />
              <span>{finalBadge}</span>
            </div>
          )}

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            {finalTitle}
          </h1>

          {/* Subtitle */}
          {finalSubtitle && (
            <p className="text-xl sm:text-2xl font-bold text-blue-900 leading-snug mb-6">
              {finalSubtitle}
            </p>
          )}

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-8 whitespace-pre-line opacity-90">
            {finalDescription}
          </p>

          {/* Highlight Message */}
          {finalHighlight && (
            <div className="inline-block p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold mb-8 shadow-2xs max-w-xl mx-auto">
              ❤️ {finalHighlight}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={finalCtaUrl}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-900 text-white font-extrabold shadow-md hover:bg-blue-950 transition-all text-sm"
            >
              <span>{finalCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={finalSecondaryCtaUrl}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold shadow-2xs hover:bg-slate-50 transition-all text-sm"
            >
              <span>{finalSecondaryCtaText}</span>
            </a>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-14 text-left border-t border-[var(--color-border,#e2e8f0)] pt-10">
            <div className="p-4 rounded-xl bg-white/70 border border-slate-100 shadow-2xs">
              <Scale className="w-6 h-6 text-blue-600 mb-2" />
              <h2 className="font-bold text-slate-900 text-sm">Právní jistota</h2>
              <p className="text-xs text-slate-600 mt-1">Metodika opatrovnického řízení, OSPOD a rozhodování soudů v ČR.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-slate-100 shadow-2xs">
              <HeartHandshake className="w-6 h-6 text-emerald-600 mb-2" />
              <h2 className="font-bold text-slate-900 text-sm">Mentoring & Komunita</h2>
              <p className="text-xs text-slate-600 mt-1">Spojení s ověřenými dobrovolníky a otci se zkušeností s péčí.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/70 border border-slate-100 shadow-2xs">
              <Shield className="w-6 h-6 text-indigo-600 mb-2" />
              <h2 className="font-bold text-slate-900 text-sm">Modulární Architektura</h2>
              <p className="text-xs text-slate-600 mt-1">Rozšiřitelný systém: kalkulačka, simulátor předávání, kalendář.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
