import React from 'react';
import { sanitizeCtaUrl } from './utils';

export interface CtaAdapterProps {
  title: string;
  description: string;
  buttonText: string;
  buttonUrl?: string;
  variant?: 'primary' | 'secondary' | 'dark';
}

export const CtaAdapter: React.FC<CtaAdapterProps> = ({
  title,
  description,
  buttonText,
  buttonUrl,
  variant = 'primary',
}) => {
  const safeButtonUrl = sanitizeCtaUrl(buttonUrl);

  let bannerStyle = 'bg-indigo-600 text-white';
  let btnStyle = 'bg-white text-indigo-700 hover:bg-slate-100';

  if (variant === 'secondary') {
    bannerStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700';
    btnStyle = 'bg-indigo-600 text-white hover:bg-indigo-500';
  } else if (variant === 'dark') {
    bannerStyle = 'bg-slate-900 text-white border border-slate-800';
    btnStyle = 'bg-indigo-500 text-white hover:bg-indigo-400';
  }

  return (
    <div className={`p-8 md:p-10 rounded-2xl my-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md ${bannerStyle} w-full max-w-7xl mx-auto`}>
      <div className="space-y-2 text-center md:text-left">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="opacity-90 max-w-xl text-sm md:text-base">{description}</p>
      </div>
      {buttonText && (
        <a
          href={safeButtonUrl}
          className={`whitespace-nowrap font-semibold px-6 py-3 rounded-xl transition-all shadow-sm active:scale-95 shrink-0 ${btnStyle}`}
        >
          {buttonText}
        </a>
      )}
    </div>
  );
};
