import React, { useEffect, useState } from 'react';
import { SeoHead } from './SeoHead';
import { Handshake, Building2, Globe, ArrowUpRight } from 'lucide-react';
import { Article } from '../../types';
import { stripMarkdown } from '../../utils/textUtils';
import { fetchCmsPublic } from '../../lib/cmsCache';

export const PartnersView: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetchCmsPublic('/api/cms/articles')
      .then((data: Article[]) => {
        // Filter out the sponsor articles
        const sponsors = data.filter(a => a.category === 'Partneři a Sponzoři' || a.category === 'Partneři a sponzoři');
        setArticles(sponsors);
      })
      .catch((err) => console.error('Error loading sponsors:', err));
  }, []);

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 animate-in fade-in duration-500">
      <SeoHead
        title="Partneři a sponzoři • Táta má právo"
        description="Představujeme partnery a sponzory, díky kterým můžeme udržovat portál Táta má právo v chodu."
        canonicalPath="/sponzori"
      />

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider">
          <Handshake className="w-4 h-4" />
          <span>Naši partneři a sponzoři</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          Podporují nás
        </h1>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed">
          Zajištění dostupnosti poradenských materiálů, článků a vzorů právních podání 24 hodin denně, 7 dní v týdnu je pro otce v krizových situacích klíčové. Děkujeme těmto technologickým partnerům za jejich podporu, bez kterých by tento portál nemohl existovat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {articles.map((art) => {
          let Icon = Building2;
          if (art.title.toLowerCase().includes('algotech')) Icon = Building2;
          if (art.title.toLowerCase().includes('wedos')) Icon = Globe;
          if (art.title.toLowerCase().includes('forpsi')) Icon = Globe;

          return (
            <div key={art.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 mb-5 border border-slate-100">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{art.title}</h3>
                <p className="text-sm text-slate-600 mb-6">{stripMarkdown(art.summary)}</p>
              </div>
              <a
                href={`/clanky/${art.slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors mt-auto"
              >
                <span>Přečíst celý článek</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          );
        })}
        {articles.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
            Načítám seznam sponzorů...
          </div>
        )}
      </div>
    </div>
  );
};
