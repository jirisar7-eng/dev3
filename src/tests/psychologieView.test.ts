import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Psychologický vývoj & Emoce dítěte (MASTER-IMPLEMENT-MOJE-DITE-01)', () => {
  const filePath = path.resolve(__dirname, '../components/public/PsychologieView.tsx');

  it('PsychologieView.tsx file exists', () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('Verifies Hero title, subtitle, and intro text', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Psychologický vývoj & Emoce dítěte');
    expect(content).toContain('Jak dítě prožívá konflikt rodičů, jak chránit jeho pocit bezpečí a jak přizpůsobit komunikaci jeho věku.');
    expect(content).toContain('«Rozchod nebo dlouhodobý konflikt rodičů může být pro dítě náročnou životní situací. Cílem tohoto průvodce je nabídnout rodičům srozumitelné informace o dětském prožívání, komunikaci a způsobech, jak dítě co nejvíce chránit před přenášením konfliktu mezi dospělými.»');
  });

  it('Verifies Professional and Ethics Disclaimer', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('Odborné a etické vymezení:');
    expect(content).toContain('Informace v tomto modulu mají podpůrný a edukativní charakter.');
    expect(content).toContain('Nenahrazují individuální psychologickou, psychiatrickou ani rodinnou terapii.');
    expect(content).toContain('Tento modul neslouží k diagnostice dítěte ani druhého rodiče.');
    expect(content).toContain('Vyvarujte se patologizování nebo označování druhého rodiče bez odborného posouzení.');
  });

  it('Verifies Tab 1: Dítě uprostřed konfliktu principles and age stages', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Main principle
    expect(content).toContain('«Dítě může mít současně pozitivní vztah k oběma rodičům. Pro dítě bývá důležité, aby nemuselo rozhodovat mezi rodiči, přenášet jejich zprávy ani nést odpovědnost za jejich konflikt.»');

    // What helps
    expect(content).toContain('Ujištění, že za rozchod ani konflikt dospělých nenese žádnou odpovědnost.');
    expect(content).toContain('Možnost mít vztah k oběma rodičům bez pocitu viny nebo loajalitního tlaku.');

    // What to avoid
    expect(content).toContain('Dítě jako poslíček zpráv mezi rodiči.');
    expect(content).toContain('Dítě jako „vyzvědač“ o soukromí druhého rodiče.');
    expect(content).toContain('Výslek dítěte po návratu od druhého rodiče.');

    // Age 0-3 non-categorical phrasing
    expect(content).toContain('Kojenci a batolata (0–3 roky)');
    expect(content).toContain('U kojenců a batolat se vyvíjí schopnost vytvářet a udržovat stabilní vztahy s pečujícími osobami.');
    expect(content).toContain('Konkrétní uspořádání péče je však třeba přizpůsobit věku, vývoji, dosavadnímu vztahu dítěte k rodičům, jeho potřebám a konkrétním podmínkám rodiny.');
    expect(content).toContain('Přespávání může být součástí péče i u malých dětí.');
  });

  it('Verifies Research studies citations and Legal US judgements', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Research studies
    expect(content).toContain('Fabricius & Suh (2017)');
    expect(content).toContain('Warshak Consensus Report (2014)');
    expect(content).toContain('Nielsen (2014, 2018)');
    expect(content).toContain('Fučík / MUNI (2021)');

    // Legal US judgments
    expect(content).toContain('I. ÚS 2482/13');
    expect(content).toContain('I. ÚS 3216/13');
    expect(content).toContain('I. ÚS 1506/13');
  });

  it('Verifies Tab 2: BIFF communication principles', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('«Při konfliktní komunikaci může pomoci věcný, stručný a klidný způsob odpovědi. Podrobnější průvodce metodou BIFF je dostupný v samostatném modulu.»');
    expect(content).toContain('Brief (Stručné)');
    expect(content).toContain('Informative (Věcné)');
    expect(content).toContain('Friendly (Zdvořilé)');
    expect(content).toContain('Firm (Jasné & Pevné)');
  });

  it('Verifies Tab 4: Crisis telephone links with tel: protocol', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).toContain('tel:606021021');
    expect(content).toContain('tel:116111');
    expect(content).toContain('tel:116123');
    expect(content).toContain('tel:116006');
    expect(content).toContain('tel:+420733642905');
  });

  it('Verifies Next steps cross-links and print support', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Cross-links
    expect(content).toContain('/komunikace-biff');
    expect(content).toContain('/studie');
    expect(content).toContain('/judikatura');
    expect(content).toContain('/ospod');
    expect(content).toContain('/kalkulacka-vyzivneho');
    expect(content).toContain('/majetek');
    expect(content).toContain('/krizova-pomoc');

    // Print
    expect(content).toContain('window.print()');
    expect(content).toContain('print:hidden');
  });

  it('Safety & Security: Verifies absence of private Case Management data or diagnostic labels', () => {
    const content = fs.readFileSync(filePath, 'utf-8');

    expect(content).not.toContain('UserCase');
    expect(content).not.toContain('CaseChild');
    expect(content).not.toContain('UserChild');
    expect(content).not.toContain('narcis');
    expect(content).not.toContain('psychopat');
  });
});
