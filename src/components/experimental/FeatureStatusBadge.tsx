import React from 'react';
import { ExperimentalFeatureStatus } from '../../types/experimental';
import { CheckCircle2, Sparkles, FlaskConical, Clock, AlertTriangle } from 'lucide-react';

interface FeatureStatusBadgeProps {
  status: ExperimentalFeatureStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const FeatureStatusBadge: React.FC<FeatureStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'READY':
        return {
          label: 'READY',
          tooltip: 'Funkce skutečně a plnohodnotně funguje',
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case 'BETA':
        return {
          label: 'BETA',
          tooltip: 'Funkce funguje, ale je v experimentálním režimu',
          icon: Sparkles,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
        };
      case 'EXPERIMENT':
        return {
          label: 'EXPERIMENT',
          tooltip: 'UI rozhraní existuje, backendová funkce se připravuje',
          icon: FlaskConical,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500 animate-pulse',
        };
      case 'PLANNED':
        return {
          label: 'PLÁNOVÁNO',
          tooltip: 'Funkce je ve fázi architektonického návrhu',
          icon: Clock,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
      case 'ERROR':
        return {
          label: 'CHYBA',
          tooltip: 'Funkce existuje, ale aktuálně není provozuschopná',
          icon: AlertTriangle,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: status,
          tooltip: '',
          icon: Clock,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      title={config.tooltip}
      className={`inline-flex items-center rounded-full font-bold border ${config.bg} ${sizeClasses} ${className} select-none`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
};
