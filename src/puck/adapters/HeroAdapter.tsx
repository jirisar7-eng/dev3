import React from 'react';
import { useText } from '../../context/TextContext';
import { Shield, HeartHandshake, Scale, ArrowRight } from 'lucide-react';
import { sanitizeCtaUrl } from './utils';

export interface HeroAdapterProps {
  title?: string;
  description?: string;
  badgeText?: string;
  ctaText?: string;
  ctaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
}

export const HeroAdapter: React.FC<HeroAdapterProps> = ({
  title,
  description,
  badgeText,
  ctaText,
  ctaUrl,
  secondaryCtaText,
  secondaryCtaUrl,
}) => {
  const { t } = useText();

  const finalBadge = badgeText || t('home.hero.badge', 'Portál pro právní a psychologickou oporu otců v ČR');
  const finalTitle = title || t('home.hero.title', 'Táta má právo. Dítě má právo na oba rodiče.');
  const finalDescription = description || t(
    'home.hero.subtitle',
    'Komplexní opora pro otce v opatrovnických situacích. Právní orientace, psychologická podpora a spravedlivá péče zohledňující NEJLEPŠÍ ZÁJEM DÍTĚTE.'
  );
  const finalCtaText = ctaText || t('home.hero.cta', 'Prozkoumat poradnu');
  const finalCtaUrl = sanitizeCtaUrl(ctaUrl || '#poradna');
  const finalSecondaryCtaText = secondaryCtaText || 'Přehled modulů';
  const finalSecondaryCtaUrl = sanitizeCtaUrl(secondaryCtaUrl || '#moduly');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-surface,#ffffff)] via-[var(--color-background,#f8fafc)] to-[var(--color-background,#f8fafc)] py-16 lg:py-24 border-b border-[var(--color-border,#e2e8f0)] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-6 shadow-2xs">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>{finalBadge}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-heading,#0f172a)] tracking-tight leading-tight mb-6">
            {finalTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-[var(--color-text,#1e293b)] leading-relaxed mb-8 opacity-90">
            {finalDescription}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={finalCtaUrl}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-primary,#1e3a8a)] text-white font-semibold shadow-md hover:opacity-95 transition-all text-sm"
            >
              <span>{finalCtaText}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={finalSecondaryCtaUrl}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[var(--color-border,#e2e8f0)] text-[var(--color-heading,#0f172a)] font-semibold shadow-2xs hover:bg-slate-50 transition-all text-sm"
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
