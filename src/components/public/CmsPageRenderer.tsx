import React, { useEffect, useState } from 'react';
import { Page, Faq, CustomModule } from '../../types';
import { useModules } from '../../context/ModuleContext';
import { useText } from '../../context/TextContext';
import { SeoHead } from './SeoHead';
import { PageRender } from '../builder/PageRender';
import { SchemaDrivenRenderer } from '../common/SchemaDrivenRenderer';
import { fetchCmsPublic } from '../../lib/cmsCache';
import { DEFAULT_HOMEPAGE_PUCK_DATA } from '../../puck/defaultPageData';
import { normalizePuckData } from '../../puck/config';
import {
  FileText,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  Image as ImageIcon,
  Layers,
  Lock,
} from 'lucide-react';

interface CmsPageRendererProps {
  slug: string;
  onNavigate?: (path: string) => void;
  fallbackComponent?: React.ReactNode;
}

export const CmsPageRenderer: React.FC<CmsPageRendererProps> = ({ slug, onNavigate, fallbackComponent }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [customModule, setCustomModule] = useState<CustomModule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { isModuleEnabled } = useModules();
  const { t } = useText();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPage(null);
    setCustomModule(null);

    // Try /api/pages/:slug first, then fallback to /api/cms/pages/slug/:slug, then /api/custom-modules/slug/:slug
    fetch(`/api/pages/${slug}`)
      .then(async (res) => {
        if (res.ok) return res.json();
        const fallbackRes = await fetch(`/api/cms/pages/slug/${slug}`);
        if (fallbackRes.ok) return fallbackRes.json();
        const moduleRes = await fetch(`/api/custom-modules/slug/${slug}`);
        if (moduleRes.ok) {
          const modData = await moduleRes.json();
          return { _isCustomModule: true, ...modData };
        }
        throw new Error('Stránka ani modul nebyly nalezeny');
      })
      .then((data: any) => {
        if (data._isCustomModule) {
          setCustomModule(data);
        } else {
          setPage(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    fetchCmsPublic('/api/cms/faqs')
      .then((data) => { if (Array.isArray(data)) setFaqs(data); })
      .catch(() => {});
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  // Render Custom Module if present
  if (customModule) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <SeoHead
          title={`${customModule.title} • Táta má právo`}
          description={`Schema-Driven modul: ${customModule.title}`}
          canonicalPath={`/${customModule.slug}`}
        />
        <SchemaDrivenRenderer
          contentJson={customModule.contentJson}
          title={customModule.title}
          category={customModule.category}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  if (error || !page) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <SeoHead title="Stránka nenalezena" canonicalPath={`/${slug}`} />
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('cms.page_not_found', 'Stránka nenalezena')}
        </h2>
        <p className="text-slate-600 text-sm mb-6">
          Požadovaná stránka s adresou <code className="font-mono bg-slate-100 px-2 py-1 rounded">/{slug}</code> neexistuje nebo byla deaktivována.
        </p>
        <button
          onClick={() => onNavigate && onNavigate('/')}
          className="px-6 py-2.5 bg-blue-900 text-white font-bold rounded-xl text-xs hover:bg-blue-950 transition-all"
        >
          {t('common.back_home', 'Zpět na hlavní stranu')}
        </button>
      </div>
    );
  }

  // Helper to convert plain string/markdown into safe Puck structure
  const convertTextToPuckData = (title: string, pageSlug: string, rawText: string) => {
    const cleanText = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || `Obsah stránky ${title}.`;
    return normalizePuckData({
      content: [
        {
          type: 'HeroBlock',
          props: {
            id: `hero-${pageSlug}`,
            title: title || 'Název stránky',
            description: cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText,
            buttonText: 'Zobrazit více',
            buttonUrl: `#${pageSlug}`,
          },
        },
        {
          type: 'TextBlock',
          props: {
            id: `text-${pageSlug}`,
            text: rawText,
            align: 'left',
          },
        },
        {
          type: 'CallToAction',
          props: {
            id: `cta-${pageSlug}`,
            title: `Potřebujete poradit v oblasti ${title}?`,
            description: 'Navštivte naši bezplatnou poradnu nebo využijte AI Opatrovnického asistenta.',
            buttonText: 'Přejít do poradny',
            buttonUrl: '/advice',
            variant: 'primary',
          },
        },
      ],
      root: { props: { title: title || 'Stránka' } },
    });
  };

  // Parse Puck content if available
  let puckData: any = null;
  try {
    const raw = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
    if (raw && typeof raw === 'object' && Array.isArray(raw.content)) {
      puckData = normalizePuckData(raw);
    } else if (slug === 'home' || slug === 'domu') {
      puckData = normalizePuckData(DEFAULT_HOMEPAGE_PUCK_DATA);
    } else if (typeof page.content === 'string' && page.content.trim()) {
      puckData = convertTextToPuckData(page.title, slug, page.content);
    }
  } catch (e) {
    if (slug === 'home' || slug === 'domu') {
      puckData = normalizePuckData(DEFAULT_HOMEPAGE_PUCK_DATA);
    } else if (page?.content && typeof page.content === 'string' && page.content.trim()) {
      puckData = convertTextToPuckData(page.title, slug, page.content);
    }
  }

  // HARDENED FALLBACK LOGIC:
  // If we have a fallbackComponent but no valid Puck data was loaded (either missing, invalid, or fetch failed),
  // we MUST use the fallbackComponent. We only use legacy CMS rendering if there's no fallbackComponent.
  if (fallbackComponent && !puckData) {
    return <>{fallbackComponent}</>;
  }

  if (puckData) {
    const hasHeroBlock = Array.isArray(puckData.content) && puckData.content.some((b: any) => b?.type === 'HeroBlock');
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <SeoHead
          title={page.seoTitle || page.title}
          description={page.seoDescription || page.title}
          canonicalPath={`/${page.slug}`}
        />
        {!hasHeroBlock && (
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-black text-white">{page.title}</h1>
            </div>
          </div>
        )}
        <div className={hasHeroBlock ? 'w-full' : 'max-w-5xl mx-auto px-4 py-8'}>
          <PageRender data={puckData} />
        </div>
      </div>
    );
  }

  if (fallbackComponent && (!page.sections || page.sections.length === 0) && !page.content) {
    return <>{fallbackComponent}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background,#f8fafc)] pb-20">
      <SeoHead
        title={page.seoTitle || page.title}
        description={page.seoDescription || page.content}
        canonicalPath={`/${page.slug}`}
      />

      {/* Page Header Banner */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Táta má právo • CMS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            {page.title}
          </h1>
          {page.seoDescription && (
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl leading-relaxed">
              {page.seoDescription}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Main Content Body */}
        {page.content && (
          <div className="bg-[var(--color-surface,#ffffff)] rounded-3xl p-6 sm:p-8 border border-[var(--color-border,#e2e8f0)] shadow-xs leading-relaxed text-[var(--color-text,#1e293b)] text-sm space-y-4">
            <div className="prose prose-slate max-w-none whitespace-pre-line">
              {page.content}
            </div>
          </div>
        )}

        {/* CMS Page Sections Renderer */}
        {page.sections && page.sections.length > 0 && (
          <div className="space-y-10">
            {page.sections.map((sec) => {
              let config: any = {};
              try {
                config = JSON.parse(sec.config || '{}');
              } catch {
                config = {};
              }

              // Check if section requires a module
              if (config.moduleKey && !isModuleEnabled(config.moduleKey)) {
                return (
                  <div
                    key={sec.id}
                    className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 text-center text-xs text-amber-900 flex items-center justify-center gap-3"
                  >
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Sekce „<strong>{sec.title || sec.sectionKey}</strong>“ je dočasně nedostupná, protože modul „<code>{config.moduleKey}</code>“ je neaktivní.
                    </span>
                  </div>
                );
              }

              switch (sec.sectionKey) {
                case 'hero':
                  return (
                    <div
                      key={sec.id}
                      className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-blue-800 relative overflow-hidden"
                    >
                      {config.badge && (
                        <span className="inline-block px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider mb-4">
                          {config.badge}
                        </span>
                      )}
                      <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight">
                        {sec.title}
                      </h2>
                      {sec.content && (
                        <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
                          {sec.content}
                        </p>
                      )}
                      {config.buttonText && (
                        <button
                          onClick={() => onNavigate && onNavigate(config.buttonUrl || '/')}
                          className="px-6 py-3 bg-amber-400 text-slate-950 font-black rounded-2xl hover:bg-amber-300 transition-all flex items-center gap-2 text-xs shadow-md"
                        >
                          <span>{config.buttonText}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );

                case 'text':
                  return (
                    <div
                      key={sec.id}
                      className={`rounded-3xl p-6 sm:p-8 border shadow-xs space-y-3 ${
                        config.highlight
                          ? 'bg-amber-500/10 border-amber-300/60 text-slate-900'
                          : 'bg-[var(--color-surface,#ffffff)] border-[var(--color-border,#e2e8f0)] text-slate-800'
                      }`}
                    >
                      {sec.title && (
                        <h3 className="text-xl font-black text-[var(--color-heading,#0f172a)] tracking-tight flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          {sec.title}
                        </h3>
                      )}
                      {sec.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
                          {sec.content}
                        </p>
                      )}
                    </div>
                  );

                case 'image':
                  return (
                    <div
                      key={sec.id}
                      className="bg-[var(--color-surface,#ffffff)] rounded-3xl p-6 border border-[var(--color-border,#e2e8f0)] shadow-xs space-y-4"
                    >
                      {sec.title && (
                        <h3 className="text-xl font-bold text-[var(--color-heading,#0f172a)]">
                          {sec.title}
                        </h3>
                      )}
                      {config.imageUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200">
                          <img
                            src={config.imageUrl}
                            alt={sec.title || 'Obrázek v sekci'}
                            className="w-full max-h-[400px] object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="bg-slate-100 rounded-2xl py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-xs">Obrázek nebyl v konfiguraci zadán</span>
                        </div>
                      )}
                      {sec.content && (
                        <p className="text-xs text-slate-600 italic text-center">
                          {sec.content}
                        </p>
                      )}
                    </div>
                  );

                case 'cards':
                  return (
                    <div key={sec.id} className="space-y-6">
                      {sec.title && (
                        <div className="text-center max-w-2xl mx-auto">
                          <h3 className="text-2xl font-black text-[var(--color-heading,#0f172a)] tracking-tight">
                            {sec.title}
                          </h3>
                          {sec.content && (
                            <p className="text-xs text-slate-600 mt-1">{sec.content}</p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {config.cards && Array.isArray(config.cards) ? (
                          config.cards.map((card: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-[var(--color-surface,#ffffff)] p-6 rounded-3xl border border-[var(--color-border,#e2e8f0)] shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-900 font-black flex items-center justify-center mb-4 text-sm">
                                  0{idx + 1}
                                </div>
                                <h4 className="font-bold text-[var(--color-heading,#0f172a)] text-base mb-2">
                                  {card.title}
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  {card.desc || card.content}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-3 text-xs text-slate-500 text-center py-4">
                            Žádné kartičky v konfiguraci sekce.
                          </div>
                        )}
                      </div>
                    </div>
                  );

                case 'faq':
                  return (
                    <div key={sec.id} className="bg-[var(--color-surface,#ffffff)] p-8 rounded-3xl border border-[var(--color-border,#e2e8f0)] shadow-xs space-y-6">
                      <div>
                        <h3 className="text-2xl font-black text-[var(--color-heading,#0f172a)] tracking-tight flex items-center gap-2">
                          <HelpCircle className="w-6 h-6 text-blue-600" />
                          {sec.title || 'Časté otázky a odpovědi'}
                        </h3>
                        {sec.content && (
                          <p className="text-xs text-slate-500 mt-1">{sec.content}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {faqs.slice(0, config.limit || 5).map((f) => (
                          <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <h4 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
                              {f.question}
                            </h4>
                            <p className="text-xs text-slate-600 pl-6 leading-relaxed">{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );

                case 'cta':
                  return (
                    <div
                      key={sec.id}
                      className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                      <div>
                        <h3 className="text-2xl font-black tracking-tight mb-2">
                          {sec.title}
                        </h3>
                        <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                          {sec.content}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 shrink-0">
                        {config.primaryBtnText && (
                          <button
                            onClick={() => onNavigate && onNavigate(config.primaryBtnUrl || '/')}
                            className="px-5 py-2.5 bg-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-300 transition-all"
                          >
                            {config.primaryBtnText}
                          </button>
                        )}
                        {config.secondaryBtnText && (
                          <button
                            onClick={() => onNavigate && onNavigate(config.secondaryBtnUrl || '/kontakt')}
                            className="px-5 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs border border-slate-700 hover:bg-slate-700 transition-all"
                          >
                            {config.secondaryBtnText}
                          </button>
                        )}
                      </div>
                    </div>
                  );

                default:
                  return (
                    <div key={sec.id} className="bg-[var(--color-surface,#ffffff)] p-6 rounded-3xl border border-[var(--color-border,#e2e8f0)] text-xs">
                      <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px] mb-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Sekce: {sec.sectionKey}</span>
                      </div>
                      <h4 className="font-bold text-[var(--color-heading,#0f172a)] text-sm">{sec.title}</h4>
                      <p className="text-slate-600 mt-1">{sec.content}</p>
                    </div>
                  );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
};
