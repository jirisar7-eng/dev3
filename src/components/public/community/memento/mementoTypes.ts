import { MementoCase } from '../../../../types';

export interface MementoThemeInfo {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  iconName: string;
  badge: string;
  description: string;
  caseIds: string[]; // matching order or id in seed
  relatedThemes: string[];
  seoTitle: string;
  seoDescription: string;
}

export const MEMENTO_THEMES: Record<string, MementoThemeInfo> = {
  komunikace: {
    id: 'komunikace',
    slug: 'komunikace',
    title: 'Komunikace mezi rodiči',
    subtitle: 'Metodika BIFF, Pravidlo 24h a prevence emotivních zpráv',
    iconName: 'MessageSquare',
    badge: '1. Tématický okruh',
    description: 'Jak komunikovat s druhým rodičem bez emocí, výčitek a zbytečného rizika pro opatrovnický spis.',
    caseIds: ['case-1', 'case-5', 'case-8', 'case-9'],
    relatedThemes: ['dite', 'soud', 'dokumentace'],
    seoTitle: 'Komunikace mezi rodiči • Memento otců',
    seoDescription: 'Metodika BIFF, pravidlo 24 hodin a deeskalační komunikace v rodinném konfliktu. Memento otců.',
  },
  dite: {
    id: 'dite',
    slug: 'dite',
    title: 'Dítě není prostředník',
    subtitle: 'Ochrana psychiky dítěte a zaměření na jeho skutečné potřeby',
    iconName: 'Heart',
    badge: '2. Tématický okruh',
    description: 'Zásady ochrany dítěte před rodičovským konfliktem, výslechy a zneužíváním jako posla.',
    caseIds: ['case-3', 'case-12'],
    relatedThemes: ['komunikace', 'soud', 'ospod-a-instituce'],
    seoTitle: 'Dítě není prostředník • Memento otců',
    seoDescription: 'Ochrana dětí před konfliktem rodičů, manipulací a zatahováním do opatrovnického sporu.',
  },
  dokumentace: {
    id: 'dokumentace',
    slug: 'dokumentace',
    title: 'Dokumentujte fakta, ne emoce',
    subtitle: 'Věcný deník péče, věcné záznamy a objektivní evidencia',
    iconName: 'FileText',
    badge: '3. Tématický okruh',
    description: 'Jak správně vést deník péče, ukládat důkazy a oddělovat ověřená fakta od pocitů.',
    caseIds: ['case-6', 'case-7'],
    relatedThemes: ['komunikace', 'ospod-a-instituce', 'soud'],
    seoTitle: 'Dokumentujte fakta, ne emoce • Memento otců',
    seoDescription: 'Jak správně vedený deník péče a věcná dokumentace pomáhají u soudu a OSPODu.',
  },
  'ospod-a-instituce': {
    id: 'ospod-a-instituce',
    slug: 'ospod-a-instituce',
    title: 'OSPOD a další instituce',
    subtitle: 'Konstruktivní jednání s orgány sociálně-právní ochrany dětí',
    iconName: 'Building2',
    badge: '4. Tématický okruh',
    description: 'Pravidla komunikace s OSPOD, soudními znalci a poradami bez osobních útoků.',
    caseIds: ['case-7', 'case-10'],
    relatedThemes: ['soud', 'dokumentace', 'komunikace'],
    seoTitle: 'OSPOD a další instituce • Memento otců',
    seoDescription: 'Zásady komunikace s OSPOD, podávání podnětů a jednání se znalci v zájmu dítěte.',
  },
  soud: {
    id: 'soud',
    slug: 'soud',
    title: 'Příprava na opatrovnické řízení',
    subtitle: '7-bodový checklist, časová osa a koordinovaná obhajoba',
    iconName: 'Gavel',
    badge: '5. Tématický okruh',
    description: 'Klíčové kroky při přípravě na soudní jednání, formulace návrhů a prevence nevýhodných dohod.',
    caseIds: ['case-2', 'case-10', 'case-11'],
    relatedThemes: ['ospod-a-instituce', 'dokumentace', 'komunikace'],
    seoTitle: 'Příprava na opatrovnické řízení • Memento otců',
    seoDescription: '7-bodový checklist pro opatrovnický soud, časová osa a věcná příprava návrhů.',
  },
  soukromi: {
    id: 'soukromi',
    slug: 'soukromi',
    title: 'Sociální sítě a soukromí',
    subtitle: 'Rizika zveřejňování spisů, rozsudků a útoků na internetu',
    iconName: 'Globe',
    badge: '6. Tématický okruh',
    description: 'Ochrana soukromí rodiny, rizika publikace citlivých údajů a právní následky útoků online.',
    caseIds: ['case-4'],
    relatedThemes: ['komunikace', 'dokumentace', 'soud'],
    seoTitle: 'Sociální sítě a soukromí • Memento otců',
    seoDescription: 'Proč nezveřejňovat soudní spisy, osobní údaje a spory na sociálních sítích.',
  },
};
