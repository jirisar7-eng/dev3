import React from 'react';
import { Article } from '../../types';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { truncateText } from '../../utils/textUtils';

interface ArticleCardProps {
  article: Article;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onNavigate,
  className = '',
}) => {
  const targetUrl = `/clanky/${article.slug || article.id}`;

  const cleanPerex = article.summary
    ? truncateText(article.summary, 160)
    : article.content
    ? truncateText(article.content, 160)
    : '';

  return (
    <div
      onClick={() => onNavigate?.(targetUrl)}
      className={`bg-[var(--color-surface,#ffffff)] border border-[var(--color-border,#e2e8f0)] rounded-2xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:border-blue-300 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold tracking-wide">
            {article.category || 'Článek'}
          </span>
          {article.createdAt && (
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {new Date(article.createdAt).toLocaleDateString('cs-CZ')}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-[var(--color-heading,#0f172a)] mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {article.title}
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3 font-normal">
          {cleanPerex}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
          <User className="w-3.5 h-3.5 text-slate-400" />
          {article.authorName || 'Redakce'}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate?.(targetUrl);
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Číst celý článek</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
