import React, { useEffect, useState } from 'react';
import { Article } from '../../types';
import { ArticleCard } from '../../components/public/ArticleCard';
import { fetchCmsPublic } from '../../lib/cmsCache';

export interface ArticlesFeedAdapterProps {
  title?: string;
  subtitle?: string;
  limit?: number;
  categoryFilter?: string;
}

export const ArticlesFeedAdapter: React.FC<ArticlesFeedAdapterProps> = ({
  title = 'Opatrovnické právo v praxi',
  subtitle = 'Odborné články, judikáty Ústavního soudu a osvědčené postupy pro otce.',
  limit = 3,
  categoryFilter = '',
}) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // Secure deduplicated API fetch of CMS articles
    fetchCmsPublic('/api/cms/articles')
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data)) {
          let filtered = data;
          if (categoryFilter) {
            filtered = data.filter(
              (art) => art.category?.toLowerCase() === categoryFilter.toLowerCase()
            );
          }
          setArticles(filtered.slice(0, limit));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Error loading articles in adapter:', err);
        setError('Nepodařilo se načíst články.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [limit, categoryFilter]);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Metodické články & Judikatura
          </span>
          <h2 className="text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-slate-600 max-w-md mt-2 md:mt-0">
            {subtitle}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center text-slate-500 py-12">{error}</div>
      ) : articles.length === 0 ? (
        <div className="text-center text-slate-500 py-12">Nebyly nalezeny žádné články.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((art) => (
            <ArticleCard
              key={art.id}
              article={art}
            />
          ))}
        </div>
      )}
    </section>
  );
};
