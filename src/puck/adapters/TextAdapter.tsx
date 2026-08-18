import React from 'react';

export interface TextAdapterProps {
  text: string;
  align?: 'left' | 'center' | 'right';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  color?: 'default' | 'muted' | 'lead';
}

export const TextAdapter: React.FC<TextAdapterProps> = ({
  text,
  align = 'left',
  maxWidth = 'lg',
  color = 'default',
}) => {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  
  const widthClass = 
    maxWidth === 'sm' ? 'max-w-xl' :
    maxWidth === 'md' ? 'max-w-2xl' :
    maxWidth === 'lg' ? 'max-w-4xl' :
    maxWidth === 'xl' ? 'max-w-6xl' :
    'max-w-full';

  const colorClass =
    color === 'muted' ? 'text-slate-500' :
    color === 'lead' ? 'text-xl text-slate-800 font-medium' :
    'text-base md:text-lg text-slate-700';

  return (
    <div className={`py-6 px-4 my-2 mx-auto ${alignClass} ${widthClass} w-full`}>
      <p className={`${colorClass} dark:text-slate-200 leading-relaxed whitespace-pre-wrap`}>
        {text || 'Zde zadejte váš text...'}
      </p>
    </div>
  );
};
