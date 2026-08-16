import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Article } from '../../types';
import { SeoHead } from './SeoHead';
import { Calendar, User, ArrowLeft, Tag } from 'lucide-react';
import { stripMarkdown } from '../../utils/textUtils';

interface ArticleDetailViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const ArticleDetailView: React.FC<ArticleDetailViewProps> = ({ slug, onNavigate }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/cms/articles')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data: Article[]) => {
        const decodedSlug = decodeURIComponent(slug);
        const found = data.find(
          (a) => a.slug === decodedSlug || a.id === decodedSlug || a.slug === slug || a.id === slug
        );
        if (found) {
          setArticle(found);
        } else {
          setError('Článek nebyl nalezen.');
        }
      })
      .catch((err) => {
        console.error('Error loading article:', err);
        setError('Nepodařilo se načíst článek.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">{error || 'Článek nenalezen'}</h2>
        <button
          onClick={() => onNavigate('/clanky')}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na přehled článků
        </button>
      </div>
    );
  }

  const cleanSummary = article.summary ? stripMarkdown(article.summary) : '';

  return (
    <article className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <SeoHead
        title={`${article.seoTitle || article.title} | Táta má právo`}
        description={article.seoDescription || cleanSummary}
        canonicalPath={`/clanky/${article.slug}`}
      />

      <div className="mb-8">
        <button
          onClick={() => onNavigate('/clanky')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na všechny články
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1.5">
            <Tag className="w-3 h-3" />
            {article.category}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 border-b border-slate-200 pb-8">
          <div className="flex items-center gap-1.5 font-medium">
            <User className="w-4 h-4 text-slate-400" />
            <span>{article.authorName || 'Redakce'}</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block"></div>
          {article.createdAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date(article.createdAt).toLocaleDateString('cs-CZ')}</span>
            </div>
          )}
        </div>
      </div>

      {cleanSummary && (
        <div className="text-lg text-slate-700 font-medium leading-relaxed mb-8 p-6 bg-blue-50/60 rounded-2xl border border-blue-100 shadow-xs">
          {cleanSummary}
        </div>
      )}

      <div className="prose prose-slate prose-lg max-w-none text-slate-800 leading-relaxed dark:prose-invert space-y-4">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>
    </article>
  );
};
