import { Scale, Users, Award, Briefcase, HeartHandshake, MapPin, Building2 } from 'lucide-react';
import React from 'react';
import { EntityType } from '../types';

export interface EntityConfigItem {
  label: string;
  icon: React.FC<{ className?: string }>;
  badgeBg: string;
  badgeText: string;
  pinColorHex: string;
  pinColorBgClass: string;
  desc: string;
  svgPath: string;
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfigItem> = {
  SOUD: {
    label: 'Opatrovnické soudy',
    icon: Scale,
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    badgeText: 'Soud',
    pinColorHex: '#4338ca', // Indigo 700
    pinColorBgClass: 'bg-indigo-600',
    desc: 'Okresní, obvodní a krajské soudy rozhodující o péči a výživném',
    svgPath: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>'
  },
  OSPOD: {
    label: 'Orgány OSPOD',
    icon: Building2,
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
    badgeText: 'OSPOD',
    pinColorHex: '#b91c1c', // Red 700
    pinColorBgClass: 'bg-red-600',
    desc: 'Oddělení sociálně-právní ochrany dětí vykonávající kolizní opatrovnictví',
    svgPath: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>'
  },
  ZNALEC: {
    label: 'Soudní znalci & Psychologové',
    icon: Award,
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    badgeText: 'Znalec',
    pinColorHex: '#7c3aed', // Purple 600
    pinColorBgClass: 'bg-purple-600',
    desc: 'Certifikovaní znalci pro dětskou a klinickou psychologii a psychiatrii',
    svgPath: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>'
  },
  ADVOKAT: {
    label: 'Advokáti pro rodinné právo',
    icon: Briefcase,
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    badgeText: 'Advokát',
    pinColorHex: '#0284c7', // Sky 600
    pinColorBgClass: 'bg-sky-600',
    desc: 'Advokáti se specializací na střídavou péči, mediaci a úpravu poměrů',
    svgPath: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
  },
  PORADNA_CHARITA: {
    label: 'Poradny & Mediátoři',
    icon: HeartHandshake,
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    badgeText: 'Poradna / Mediace',
    pinColorHex: '#059669', // Emerald 600
    pinColorBgClass: 'bg-emerald-600',
    desc: 'Manželské a rodinné poradny, krizové centrum a akreditovaní mediátoři',
    svgPath: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66"/><path d="m18 15-2-2"/><path d="m15 18-2-2"/>'
  },
};

export const ALL_SUBJECTS_ICON_SVG = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
