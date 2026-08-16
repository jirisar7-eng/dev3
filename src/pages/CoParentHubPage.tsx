import React from 'react';
import { CoParentPage } from './portal/CoParentPage';
import { SeoHead } from '../components/public/SeoHead';

interface CoParentHubPageProps {
  onNavigate?: (path: string) => void;
}

export const CoParentHubPage: React.FC<CoParentHubPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      <SeoHead
        title="Spolurodičovský Hub (CoParent) • Táta má právo"
        description="Kompletní interaktivní nástroj pro spolurodičovství, správu kalendáře, výdajů, dohod a bezpečnou komunikaci bez zbytečných konfliktů."
        canonicalPath="/coparent-hub"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CoParentPage onNavigate={onNavigate} />
      </div>
    </div>
  );
};
