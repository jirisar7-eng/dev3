import { LucideIcon } from 'lucide-react';
import { UserRole } from '../types';

export type ExperimentalFeatureStatus = 'READY' | 'BETA' | 'EXPERIMENT' | 'PLANNED' | 'ERROR';

export type ExperimentalFeatureCategory =
  | 'ai'
  | 'pravo'
  | 'pripad'
  | 'finance'
  | 'vzdelavani'
  | 'platforma';

export interface FeatureImplementationNote {
  works: string[];
  inProgressOrMissing: string[];
  technicalDetails?: string;
}

export interface ExperimentalFeature {
  id: string;
  name: string;
  description: string;
  category: ExperimentalFeatureCategory;
  status: ExperimentalFeatureStatus;
  route: string;
  iconName: string;
  backendCapability?: string;
  requiredRole?: UserRole;
  requiredPermission?: string;
  visible: boolean;
  experimental: boolean;
  implementationNote: FeatureImplementationNote;
  ctaLabel?: string;
  tags?: string[];
}
