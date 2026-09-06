import React, { useState, useEffect } from 'react';
import { DEFAULT_MEMENTO_CASES } from '../../../data/mementoSeed';
import { MementoCase } from '../../../types';
import { MEMENTO_THEMES } from './memento/mementoTypes';
import { MementoHomeView } from './memento/MementoHomeView';
import { MementoThematicView } from './memento/MementoThematicView';
import { MementoCaseDetailView } from './memento/MementoCaseDetailView';
import { MementoNotFoundView } from './memento/MementoNotFoundView';

interface MementoViewProps {
  onNavigate: (path: string) => void;
  currentPath?: string;
}

export const MementoView: React.FC<MementoViewProps> = ({ onNavigate, currentPath }) => {
  const [cases, setCases] = useState<MementoCase[]>(DEFAULT_MEMENTO_CASES);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchCases = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/cms/memento');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setCases(data);
          }
        }
      } catch (err) {
        console.warn('Načítání Memento případů z API selhalo, použit lokální seed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCases();
    return () => {
      isMounted = false;
    };
  }, []);

  // Determine active path
  const rawPath = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '/memento');
  const path = rawPath.split('?')[0].split('#')[0];
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

  // 1. Home Overview Page (/memento)
  if (normalizedPath === '/memento' || normalizedPath === '') {
    return <MementoHomeView cases={cases} onNavigate={onNavigate} />;
  }

  // 2. Case detail route via /memento/chyba/:slug
  if (normalizedPath.startsWith('/memento/chyba/')) {
    const caseSlug = normalizedPath.replace('/memento/chyba/', '');
    const foundCase = cases.find((c) => c.slug === caseSlug);
    if (foundCase) {
      return <MementoCaseDetailView caseData={foundCase} allCases={cases} onNavigate={onNavigate} />;
    }
    return <MementoNotFoundView onNavigate={onNavigate} />;
  }

  // 3. Subroutes via /memento/:sub
  if (normalizedPath.startsWith('/memento/')) {
    const subSlug = normalizedPath.replace('/memento/', '');

    // Check if subSlug is a theme (e.g. /memento/komunikace)
    if (MEMENTO_THEMES[subSlug]) {
      return <MementoThematicView themeId={subSlug} cases={cases} onNavigate={onNavigate} />;
    }

    // Check if subSlug is a case slug directly (e.g. /memento/nocni-vycitky-a-sms-plne-vzteku)
    const foundCase = cases.find((c) => c.slug === subSlug);
    if (foundCase) {
      return <MementoCaseDetailView caseData={foundCase} allCases={cases} onNavigate={onNavigate} />;
    }

    // Fallback 404 for unknown subroute
    return <MementoNotFoundView onNavigate={onNavigate} />;
  }

  return <MementoHomeView cases={cases} onNavigate={onNavigate} />;
};
