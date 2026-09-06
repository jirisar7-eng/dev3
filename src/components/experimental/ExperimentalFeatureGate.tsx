import React from 'react';
import { ExperimentalFeature } from '../../types/experimental';
import { useAuth } from '../../context/AuthContext';
import { FeatureStatusBadge } from './FeatureStatusBadge';
import { ExperimentBanner } from './ExperimentBanner';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface ExperimentalFeatureGateProps {
  feature: ExperimentalFeature;
  children: React.ReactNode;
  onNavigate?: (path: string) => void;
}

export const ExperimentalFeatureGate: React.FC<ExperimentalFeatureGateProps> = ({
  feature,
  children,
  onNavigate,
}) => {
  const { currentUser, hasRole } = useAuth();

  // Check required role
  if (feature.requiredRole && !hasRole(feature.requiredRole)) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <FeatureStatusBadge status={feature.status} size="lg" />
          <h2 className="text-2xl font-black text-slate-900">{feature.name}</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Tento modul vyžaduje vyšší systémová oprávnění. V souladu se zásadami Least Privilege
            a Zero Trust je přístup omezen na roli{' '}
            <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
              {feature.requiredRole}
            </strong>
            .
          </p>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('/experimenty') : window.history.back())}
            className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zpět do Experimentální laboratoře</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Visual banner in beta or experiment state */}
      {feature.status !== 'READY' && (
        <div className="max-w-5xl mx-auto px-4 pt-2">
          <ExperimentBanner
            status={feature.status}
            featureName={feature.name}
            customNote={feature.implementationNote.technicalDetails}
          />
        </div>
      )}
      {children}
    </div>
  );
};
