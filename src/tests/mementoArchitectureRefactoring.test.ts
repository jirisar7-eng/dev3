import { describe, it, expect } from 'vitest';
import { MEMENTO_THEMES } from '../components/public/community/memento/mementoTypes';
import { DEFAULT_MEMENTO_CASES } from '../data/mementoSeed';
import fs from 'fs';
import path from 'path';

describe('Memento Otců — Information Architecture Refactoring (MASTER-IMPLEMENT-MEMENTO-03)', () => {
  it('MEMENTO_THEMES defines all 6 required thematic subpages', () => {
    expect(MEMENTO_THEMES).toBeDefined();
    const requiredThemes = ['komunikace', 'dite', 'dokumentace', 'ospod-a-instituce', 'soud', 'soukromi'];

    requiredThemes.forEach((themeId) => {
      const theme = MEMENTO_THEMES[themeId];
      expect(theme, `Missing theme: ${themeId}`).toBeDefined();
      expect(theme.title).toBeTruthy();
      expect(theme.subtitle).toBeTruthy();
      expect(theme.description).toBeTruthy();
      expect(theme.caseIds.length).toBeGreaterThan(0);
      expect(theme.seoTitle).toContain('Memento otců');
      expect(theme.seoDescription).toBeTruthy();
    });
  });

  it('MementoHomeView.tsx contains required elements for main overview page (/memento)', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/memento/MementoHomeView.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Memento otců: Procesní chyby, kterým je dobré se vyhnout');
    expect(content).toContain('«Některé chyby vzniknou během několika minut');
    expect(content).toContain('⚠️ Memento otců je edukační a preventivní obsah');
    expect(content).toContain('Tematické okruhy Mementa');
    expect(content).toContain('Rychlotahák Mementa: «Když si nejsem jistý, zastavím se»');
    expect(content).toContain('Přehled 12 procesních chyb');
    expect(content).toContain('Potřebujete navazující pomoc?');
    expect(content).toContain('Primární právní zdroje a oficiální metodiky');
    expect(content).toContain('window.print()');
  });

  it('MementoThematicView.tsx contains required elements for thematic subpages', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/memento/MementoThematicView.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Metodika BIFF');
    expect(content).toContain('Pravidlo 24 hodin');
    expect(content).toContain('5 kontrolních otázek před odesláním');
    expect(content).toContain('Zásady ochrany psychiky dítěte');
    expect(content).toContain('Věcný deník péče');
    expect(content).toContain('4 pilíře jednání s OSPOD');
    expect(content).toContain('7-bodový checklist k opatrovnickému řízení');
    expect(content).toContain('Co nepatří na sociální sítě');
    expect(content).toContain('SeoHead');
    expect(content).toContain('window.print()');
  });

  it('MementoCaseDetailView.tsx contains required elements for case details (/memento/chyba/:slug)', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/memento/MementoCaseDetailView.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Procesní chyba #');
    expect(content).toContain('❌ Popis chybného chování pod tlakem');
    expect(content).toContain('⚠️ Procesní riziko u soudu a OSPOD');
    expect(content).toContain('🔎 Co je klíčové v této situaci rozlišit');
    expect(content).toContain('✅ Doporučený věcný postup a strategie');
    expect(content).toContain('📝 Porovnání nevhodné vs. věcné reakce');
    expect(content).toContain('SeoHead');
    expect(content).toContain('window.print()');
  });

  it('MementoNotFoundView.tsx exists and handles invalid subroutes', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/memento/MementoNotFoundView.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('Požadovaná stránka v modulu Memento otců nebyla nalezena');
    expect(content).toContain('Dostupné tématické okruhy Mementa');
  });

  it('MementoView.tsx correctly delegates subroutes to specialized view components', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/MementoView.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('MementoHomeView');
    expect(content).toContain('MementoThematicView');
    expect(content).toContain('MementoCaseDetailView');
    expect(content).toContain('MementoNotFoundView');
    expect(content).toContain('/memento/chyba/');
  });

  it('PublicPortal.tsx supports /memento subroutes and passes currentPath', () => {
    const filePath = path.resolve(__dirname, '../components/public/PublicPortal.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain("slug === 'memento' || slug.startsWith('memento/')");
    expect(content).toContain("currentPath={cleanPath}");
  });
});
