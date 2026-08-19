import React from 'react';
import { sanitizeCtaUrl } from './utils';

export interface ColumnsAdapterProps {
  columnsCount?: '2' | '3' | '4';
  ratio?: 'equal' | '70-30' | '30-70' | '60-40' | '40-60';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  col1Title?: string;
  col1Text?: string;
  col1Image?: string;
  col1ButtonText?: string;
  col1ButtonUrl?: string;

  col2Title?: string;
  col2Text?: string;
  col2Image?: string;
  col2ButtonText?: string;
  col2ButtonUrl?: string;

  col3Title?: string;
  col3Text?: string;

  col4Title?: string;
  col4Text?: string;
}

export const ColumnsAdapter: React.FC<ColumnsAdapterProps> = ({
  columnsCount = '2',
  ratio = 'equal',
  gap = 'md',
  col1Title,
  col1Text,
  col1Image,
  col1ButtonText,
  col1ButtonUrl,
  col2Title,
  col2Text,
  col2Image,
  col2ButtonText,
  col2ButtonUrl,
  col3Title,
  col3Text,
  col4Title,
  col4Text,
}) => {
  const gapClass =
    gap === 'sm' ? 'gap-4' :
    gap === 'lg' ? 'gap-8' :
    gap === 'xl' ? 'gap-12' :
    'gap-6';

  let gridClass = 'grid-cols-1 md:grid-cols-2';
  if (columnsCount === '3') gridClass = 'grid-cols-1 md:grid-cols-3';
  if (columnsCount === '4') gridClass = 'grid-cols-1 md:grid-cols-4';

  // Apply custom ratio if 2 columns
  if (columnsCount === '2' && ratio !== 'equal') {
    if (ratio === '70-30') gridClass = 'grid-cols-1 md:grid-[2.33fr_1fr]';
    if (ratio === '30-70') gridClass = 'grid-cols-1 md:grid-[1fr_2.33fr]';
    if (ratio === '60-40') gridClass = 'grid-cols-1 md:grid-[1.5fr_1fr]';
    if (ratio === '40-60') gridClass = 'grid-cols-1 md:grid-[1fr_1.5fr]';
  }

  const renderColumn = (title?: string, text?: string, image?: string, btnText?: string, btnUrl?: string) => {
    if (!title && !text && !image) return null;
    const safeImage = image ? sanitizeCtaUrl(image) : undefined;
    const safeBtnUrl = btnUrl ? sanitizeCtaUrl(btnUrl) : undefined;

    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 shadow-2xs">
        {safeImage && (
          <img
            src={safeImage}
            alt={title || ''}
            className="w-full h-48 object-cover rounded-xl mb-4"
            referrerPolicy="no-referrer"
          />
        )}
        {title && <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h4>}
        {text && <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 flex-grow">{text}</p>}
        {btnText && safeBtnUrl && (
          <a
            href={safeBtnUrl}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all self-start mt-auto"
          >
            {btnText}
          </a>
        )}
      </div>
    );
  };

  return (
    <div className={`grid ${gridClass} ${gapClass} w-full max-w-7xl mx-auto py-8 px-4`}>
      {renderColumn(col1Title, col1Text, col1Image, col1ButtonText, col1ButtonUrl)}
      {renderColumn(col2Title, col2Text, col2Image, col2ButtonText, col2ButtonUrl)}
      {columnsCount !== '2' && renderColumn(col3Title, col3Text)}
      {columnsCount === '4' && renderColumn(col4Title, col4Text)}
    </div>
  );
};
