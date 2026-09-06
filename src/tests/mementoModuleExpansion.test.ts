import { describe, it, expect } from 'vitest';
import { DEFAULT_MEMENTO_CASES } from '../data/mementoSeed';
import { NAVIGATION_ITEMS } from '../config/navigation';
import { CmsService } from '../services/cmsService';
import fs from 'fs';
import path from 'path';

describe('Memento Otců — Module Expansion Tests (MASTER-IMPLEMENT-MEMENTO-02)', () => {
  it('DEFAULT_MEMENTO_CASES contains exactly 12 expanded process errors', () => {
    expect(DEFAULT_MEMENTO_CASES).toBeDefined();
    expect(DEFAULT_MEMENTO_CASES.length).toBe(12);

    const requiredSlugs = [
      'nocni-vycitky-a-sms-plne-vzteku',
      'ustupovani-pro-klid-v-rodine-na-zacatku-rozchodu',
      'boj-mezi-rodici-misto-zamereni-na-dite',
      'zverejnovani-rodinneho-konfliktu-a-spisu',
      'chaoticka-komunikace-a-pleveleni-zpravami',
      'nedokumentovani-dulezitych-udalosti-a-fakt',
      'michani-fakt-domnenek-a-emoci',
      'reakce-na-kazdou-provokaci',
      'vyhrazovani-soudem-a-trestnim-oznamenim',
      'podepisovani-dokumentu-pod-tlakem',
      'priprava-k-soudu-na-posledni-chvili',
      'zamena-konfliktu-rodicu-za-potreby-ditete',
    ];

    requiredSlugs.forEach((slug) => {
      const found = DEFAULT_MEMENTO_CASES.find((c) => c.slug === slug);
      expect(found, `Missing expected memento case slug: ${slug}`).toBeDefined();
    });
  });

  it('Each MementoCase has complete structure (error, consequence, correctAction, exampleBad, exampleGood)', () => {
    DEFAULT_MEMENTO_CASES.forEach((c) => {
      expect(c.id).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.error).toBeTruthy();
      expect(c.consequence).toBeTruthy();
      expect(c.correctAction).toBeTruthy();
      expect(c.exampleBad).toContain('❌');
      expect(c.exampleGood).toContain('✅');
      expect(c.status).toBe('PUBLISHED');
      expect(typeof c.order).toBe('number');
    });
  });

  it('CmsService.getMementoCases returns all published cases sorted by order', async () => {
    const cases = await CmsService.getMementoCases({ status: 'PUBLISHED' });
    expect(cases.length).toBeGreaterThanOrEqual(12);
    expect(cases[0].order).toBeLessThanOrEqual(cases[1].order);
  });

  it('Navigation config places Memento otců as 6th item in Potřebuji pomoc (cat-1)', () => {
    const cat1SubItems = NAVIGATION_ITEMS.filter((item) => item.parentId === 'cat-1').sort((a, b) => a.order - b.order);
    expect(cat1SubItems.length).toBeGreaterThanOrEqual(6);

    const mementoNavItem = cat1SubItems.find((item) => item.url === '/memento');
    expect(mementoNavItem).toBeDefined();
    expect(mementoNavItem?.labelKey).toBe('Memento otců');
    expect(mementoNavItem?.id).toBe('sub-1-6');
  });

  it('MementoView components contain required educational sections and CTA links', () => {
    const homeFilePath = path.resolve(__dirname, '../components/public/community/memento/MementoHomeView.tsx');
    const themeFilePath = path.resolve(__dirname, '../components/public/community/memento/MementoThematicView.tsx');
    const homeContent = fs.readFileSync(homeFilePath, 'utf-8');
    const themeContent = fs.readFileSync(themeFilePath, 'utf-8');

    // Section headers & key text requirements in home / thematic views
    expect(homeContent).toContain('Memento otců: Procesní chyby, kterým je dobré se vyhnout');
    expect(homeContent).toContain('«Některé chyby vzniknou během několika minut');
    expect(homeContent).toContain('⚠️ Memento otců je edukační a preventivní obsah');
    expect(themeContent).toContain('Metodika BIFF');
    expect(themeContent).toContain('Brief (Stručně)');
    expect(themeContent).toContain('Pravidlo 24 hodin');
    expect(themeContent).toContain('Zásady ochrany psychiky dítěte');
    expect(themeContent).toContain('Věcný deník péče');
    expect(themeContent).toContain('4 pilíře jednání s OSPOD');
    expect(themeContent).toContain('7-bodový checklist k opatrovnickému řízení');
    expect(themeContent).toContain('Co nepatří na sociální sítě');
    expect(homeContent).toContain('Rychlotahák Mementa: «Když si nejsem jistý, zastavím se»');
    expect(homeContent).toContain('Primární právní zdroje a oficiální metodiky');

    // Required CTA routes
    expect(homeContent).toContain('/sos-plan');
    expect(homeContent).toContain('/krizova-pomoc');
    expect(homeContent).toContain('/pravni-poradna');
    expect(homeContent).toContain('/registr-subjektu');
    expect(homeContent).toContain('/mapa-subjektu');

    // Print support
    expect(homeContent).toContain('window.print()');
    expect(themeContent).toContain('window.print()');
  });
});
