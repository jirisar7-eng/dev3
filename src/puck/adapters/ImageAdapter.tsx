import React from 'react';
import { sanitizeCtaUrl } from './utils';

export interface ImageAdapterProps {
  url: string;
  alt?: string;
  caption?: string;
  aspectRatio?: 'auto' | '16/9' | '4/3' | '1/1' | '21/9';
  align?: 'left' | 'center' | 'right' | 'full';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  linkUrl?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const ImageAdapter: React.FC<ImageAdapterProps> = ({
  url,
  alt = '',
  caption,
  aspectRatio = 'auto',
  align = 'center',
  maxWidth = 'lg',
  borderRadius = 'xl',
  linkUrl,
  shadow = 'md',
}) => {
  const safeLinkUrl = linkUrl ? sanitizeCtaUrl(linkUrl) : undefined;
  // Ensure the image URL itself is safe
  const safeImgUrl = url ? sanitizeCtaUrl(url) : 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&q=80&w=1200';

  const ratioClass =
    aspectRatio === '16/9' ? 'aspect-16/9' :
    aspectRatio === '4/3' ? 'aspect-4/3' :
    aspectRatio === '1/1' ? 'aspect-1/1' :
    aspectRatio === '21/9' ? 'aspect-21/9' :
    '';

  const alignContainerClass =
    align === 'left' ? 'mr-auto text-left' :
    align === 'right' ? 'ml-auto text-right' :
    align === 'full' ? 'w-full' :
    'mx-auto text-center';

  const widthClass =
    align === 'full' ? 'w-full' :
    maxWidth === 'sm' ? 'max-w-md' :
    maxWidth === 'md' ? 'max-w-xl' :
    maxWidth === 'lg' ? 'max-w-3xl' :
    maxWidth === 'xl' ? 'max-w-5xl' :
    'w-full';

  const radiusClass =
    borderRadius === 'none' ? 'rounded-none' :
    borderRadius === 'sm' ? 'rounded-xs' :
    borderRadius === 'md' ? 'rounded-md' :
    borderRadius === 'lg' ? 'rounded-lg' :
    borderRadius === 'xl' ? 'rounded-2xl' :
    borderRadius === '2xl' ? 'rounded-3xl' :
    borderRadius === 'full' ? 'rounded-full' :
    'rounded-2xl';

  const shadowClass =
    shadow === 'none' ? 'shadow-none' :
    shadow === 'sm' ? 'shadow-xs' :
    shadow === 'md' ? 'shadow-md' :
    shadow === 'lg' ? 'shadow-lg' :
    shadow === 'xl' ? 'shadow-xl' :
    'shadow-md';

  const content = (
    <div className={`relative overflow-hidden ${ratioClass} ${radiusClass} ${shadowClass} group inline-block w-full`}>
      <img
        src={safeImgUrl}
        alt={alt || caption || 'Obrázek'}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        referrerPolicy="no-referrer"
      />
    </div>
  );

  return (
    <div className={`py-6 px-4 w-full ${alignContainerClass} ${widthClass}`}>
      {safeLinkUrl && safeLinkUrl !== '#' ? (
        <a href={safeLinkUrl} className="block cursor-pointer">
          {content}
        </a>
      ) : (
        content
      )}
      {caption && (
        <p className="mt-2.5 text-xs text-slate-500 italic max-w-lg mx-auto">
          {caption}
        </p>
      )}
    </div>
  );
};
