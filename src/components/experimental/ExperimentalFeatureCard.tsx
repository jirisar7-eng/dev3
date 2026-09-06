import React from 'react';
import { ExperimentalFeature } from '../../types/experimental';
import { FeatureStatusBadge } from './FeatureStatusBadge';
import {
  ArrowRight,
  Sparkles,
  FlaskConical,
  Clock,
  AlertTriangle,
  Play,
  Cpu,
  MessageSquare,
  LayoutDashboard,
  Database,
  Send,
  BarChart2,
  FileText,
  Users,
  ShieldCheck,
  Activity,
  Shield,
  Scale,
  FileUp,
  FileSearch,
  Search,
  BookOpen,
  Files,
  PenTool,
  CheckSquare,
  ShieldAlert,
  Archive,
  Folder,
  Layout,
  Calendar,
  FolderLock,
  HeartHandshake,
  Sliders,
  SplitSquareVertical,
  FileEdit,
  Calculator,
  Coins,
  Receipt,
  CreditCard,
  History,
  GraduationCap,
  Award,
  Gavel,
  Compass,
  HelpCircle,
  Bookmark,
  Server,
  FileCheck,
  HardDrive,
  Bell,
  Plug,
  Book,
  Users2,
  Info,
  CheckCircle2,
  CircleDashed,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Cpu,
  MessageSquare,
  LayoutDashboard,
  Database,
  Send,
  BarChart2,
  FileText,
  Users,
  ShieldCheck,
  Activity,
  Shield,
  Scale,
  FileUp,
  FileSearch,
  Search,
  BookOpen,
  Files,
  PenTool,
  CheckSquare,
  ShieldAlert,
  Archive,
  Folder,
  Layout,
  Clock,
  Calendar,
  FolderLock,
  HeartHandshake,
  Sliders,
  SplitSquareVertical,
  FileEdit,
  Calculator,
  Coins,
  Receipt,
  CreditCard,
  History,
  GraduationCap,
  Award,
  Gavel,
  Compass,
  HelpCircle,
  Bookmark,
  Server,
  FileCheck,
  HardDrive,
  Bell,
  Plug,
  Book,
  Users2,
};

interface ExperimentalFeatureCardProps {
  feature: ExperimentalFeature;
  onNavigate: (route: string) => void;
  onViewDetails?: (feature: ExperimentalFeature) => void;
}

export const ExperimentalFeatureCard: React.FC<ExperimentalFeatureCardProps> = ({
  feature,
  onNavigate,
  onViewDetails,
}) => {
  const IconComponent = ICON_MAP[feature.iconName] || Cpu;

  const getCtaConfig = () => {
    switch (feature.status) {
      case 'READY':
        return {
          label: 'Spustit',
          icon: Play,
          btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        };
      case 'BETA':
        return {
          label: 'Vyzkoušet',
          icon: Sparkles,
          btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
      case 'EXPERIMENT':
        return {
          label: 'Prohlédnout experiment',
          icon: FlaskConical,
          btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      case 'PLANNED':
        return {
          label: 'Zobrazit návrh',
          icon: Clock,
          btnClass: 'bg-slate-700 hover:bg-slate-800 text-white',
        };
      case 'ERROR':
        return {
          label: 'Zobrazit stav',
          icon: AlertTriangle,
          btnClass: 'bg-rose-600 hover:bg-rose-700 text-white',
        };
      default:
        return {
          label: 'Detail',
          icon: ArrowRight,
          btnClass: 'bg-slate-800 hover:bg-slate-900 text-white',
        };
    }
  };

  const cta = getCtaConfig();
  const CtaIcon = cta.icon;

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'ai':
        return 'AI & Orion';
      case 'pravo':
        return 'Právo & Soudy';
      case 'pripad':
        return 'Případ & Péče';
      case 'finance':
        return 'Finance & Majetek';
      case 'vzdelavani':
        return 'Vzdělávání';
      case 'platforma':
        return 'Platforma';
      default:
        return cat;
    }
  };

  return (
    <div
      id={`feature-card-${feature.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-slate-300"
    >
      <div className="p-5 space-y-4">
        {/* Top bar with icon, category, and status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                {getCategoryLabel(feature.category)}
              </span>
              {feature.backendCapability && (
                <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                  {feature.backendCapability}
                </span>
              )}
            </div>
          </div>
          <FeatureStatusBadge status={feature.status} size="sm" />
        </div>

        {/* Title and description */}
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1 mb-1.5">
            {feature.name}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
            {feature.description}
          </p>
        </div>

        {/* Implementation notes preview */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
          <div className="flex items-start gap-1.5 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="line-clamp-1">
              <strong>Funguje:</strong> {feature.implementationNote.works[0] || 'Základní komponenta'}
            </span>
          </div>

          {feature.implementationNote.inProgressOrMissing.length > 0 && (
            <div className="flex items-start gap-1.5 text-amber-900">
              <CircleDashed className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span className="line-clamp-1">
                <strong>Plánováno:</strong> {feature.implementationNote.inProgressOrMissing[0]}
              </span>
            </div>
          )}
        </div>

        {/* RBAC Notice if restricted */}
        {feature.requiredRole && (
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-150">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Vyžaduje roli: </span>
            <strong className="font-mono text-slate-700">{feature.requiredRole}</strong>
          </div>
        )}
      </div>

      {/* Footer with action CTA */}
      <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => (onViewDetails ? onViewDetails(feature) : onNavigate(feature.route))}
          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5" />
          <span>Podrobnosti</span>
        </button>

        <button
          id={`feature-cta-${feature.id}`}
          type="button"
          onClick={() => onNavigate(feature.route)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer ${cta.btnClass}`}
        >
          <CtaIcon className="w-3.5 h-3.5" />
          <span>{cta.label}</span>
        </button>
      </div>
    </div>
  );
};
