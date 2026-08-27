import React from 'react';
import { CoParentPublicLandingView } from '../components/public/CoParentPublicLandingView';

interface CoParentHubPageProps {
  onNavigate?: (path: string) => void;
}

export const CoParentHubPage: React.FC<CoParentHubPageProps> = ({ onNavigate }) => {
  return <CoParentPublicLandingView onNavigate={onNavigate} />;
};
