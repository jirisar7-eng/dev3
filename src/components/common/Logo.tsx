import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface LogoProps {
  variant?: 'full' | 'icon' | 'white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  onClick,
  showSubtitle = true,
}) => {
  const isWhite = variant === 'white';
  
  const { branding } = useTheme();
  
  // Check if we are in dark mode to show dark logo if available
  const isDarkMode = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const customSvg = isDarkMode && branding?.darkLogoSvg ? branding.darkLogoSvg : branding?.primaryLogoSvg;

  if (customSvg) {
    return (
      <div 
        onClick={onClick}
        className={`inline-flex items-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
        title={branding?.logoAlt || 'Táta má právo'}
        dangerouslySetInnerHTML={{ __html: customSvg }}
        style={{ maxWidth: '100%', maxHeight: '48px' }}
      />
    );
  }

  const isIconOnly = variant === 'icon';

  // Size configurations
  const sizeClasses = {
    sm: {
      icon: 'w-8 h-8',
      title: 'text-sm',
      subtitle: 'text-[8px] sm:text-[9px]',
      gap: 'gap-2',
    },
    md: {
      icon: 'w-10 h-10',
      title: 'text-base sm:text-lg',
      subtitle: 'text-[9.5px] sm:text-[10.5px]',
      gap: 'gap-2.5',
    },
    lg: {
      icon: 'w-12 h-12',
      title: 'text-xl sm:text-2xl',
      subtitle: 'text-xs',
      gap: 'gap-3.5',
    },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const titleColor = isWhite ? 'text-white' : 'text-slate-900';
  const subtitleColor = isWhite ? 'text-teal-400 font-semibold' : 'text-teal-700 font-bold';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${selectedSize.gap} ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${className}`}
    >
      {/* Vector Shield Icon */}
      <svg
        className={`${selectedSize.icon} shrink-0 drop-shadow-sm`}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Outer Base (#1E3A8A) */}
        <path
          d="M50 6 C74 6, 88 15, 88 38 C88 66, 62 86, 50 94 C38 86, 12 66, 12 38 C12 15, 26 6, 50 6 Z"
          fill="#1E3A8A"
          stroke={isWhite ? '#3B82F6' : '#1D4ED8'}
          strokeWidth="3.5"
        />

        {/* Outer Protective Arc (#0D9488) - Father's protective arm */}
        <path
          d="M26 48 C26 27, 74 27, 74 48"
          stroke="#0D9488"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner Light Teal Accent Arc (#2DD4BF) */}
        <path
          d="M33 55 C33 40, 67 40, 67 55"
          stroke="#2DD4BF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />

        {/* Father Dot (white) under upper shield */}
        <circle cx="50" cy="38" r="5" fill="#FFFFFF" />

        {/* Child protection Heart & Dot (#F59E0B) */}
        <circle cx="50" cy="49" r="3.5" fill="#F59E0B" />
        <path
          d="M50 56 C50 53.5, 46.5 51, 44 53.5 C41.5 56, 50 64, 50 64 C50 64, 58.5 56, 56 C53.5, 50 53.5, 50 56 Z"
          fill="#F59E0B"
        />
      </svg>

      {/* Typography */}
      {!isIconOnly && (
        <div className="flex flex-col justify-center leading-tight">
          <span
            className={`font-black tracking-tight ${selectedSize.title} ${titleColor} uppercase font-sans`}
          >
            TÁTA MÁ PRÁVO
          </span>
          {showSubtitle && (
            <span
              className={`tracking-wider uppercase ${selectedSize.subtitle} ${subtitleColor} font-sans mt-0.5`}
            >
              PRO NEJLEPŠÍ ZÁJEM DÍTĚTE
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
