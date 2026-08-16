import React, { useEffect, useState } from 'react';
import { Article } from '../../types';
import { ArticleCard } from './ArticleCard';

export const ArticlesSection: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    fetch('/api/cms/articles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setArticles(data);
        }
      })
      .catch((err) => console.error('Error loading articles:', err));
  }, []);

  return (
    <section id="poradna" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
            Metodické články & Judikatura
          </span>
          <h2 className="text-3xl font-extrabold text-[var(--color-heading,#0f172a)] tracking-tight">
            Opatrovnické právo v praxi
          </h2>
        </div>
        <p className="text-sm text-slate-600 max-w-md mt-2 md:mt-0">
          Odborné články, judikáty Ústavního soudu a osvědčené postupy pro otce.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {articles.map((art) => (
          <ArticleCard
            key={art.id}
            article={art}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
};
