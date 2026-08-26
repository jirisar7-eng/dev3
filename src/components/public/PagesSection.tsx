import { apiFetch } from '../../utils/apiClient';
import React, { useEffect, useState } from 'react';
import { Page } from '../../types';
import { FileText, Compass, Info, ArrowUpRight } from 'lucide-react';
import { PageRenderer } from './PageRenderer';

export const PagesSection: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>('');

  useEffect(() => {
    apiFetch('/api/cms/pages')
      .then((res) => res.json())
      .then((data: Page[]) => {
        const published = data.filter((p) => p.published);
        setPages(published);
        if (published.length > 0 && !activeSlug) {
          setActiveSlug(published[0].slug);
        }
      })
      .catch((err) => console.error('Error fetching CMS pages:', err));
  }, []);

  return (
    <section id="o-nas" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white border border-[var(--color-border,#e2e8f0)] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Informace a Návody (Data-Driven CMS Pages)</span>
          </div>

          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-3 py-1 rounded-full w-fit">
            Database → REST API → Dynamic Sections
          </span>
        </div>

        {/* Navigation Tabs for Published CMS Pages */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          {pages.map((pg) => (
            <button
              key={pg.id}
              onClick={() => setActiveSlug(pg.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeSlug === pg.slug
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{pg.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Page Renderer for Active Page */}
        {activeSlug && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50">
            <PageRenderer slug={activeSlug} />
          </div>
        )}
      </div>
    </section>
  );
};
