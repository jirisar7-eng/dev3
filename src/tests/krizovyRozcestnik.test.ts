import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Krizový rozcestník & Linky pomoci (MASTER-IMPLEMENT-KRIZOVY-ROZCESTNIK-01)', () => {
  it('CrisisCommunityPortal.tsx exists and contains required structural sections and titles', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/CrisisCommunityPortal.tsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Title & Hero
    expect(content).toContain('Krizový rozcestník & Linky pomoci');
    expect(content).toContain('«Nacházíte se v náročné nebo akutní situaci? Zvolte podle toho, co právě potřebujete.');

    // 2. Sekce B: Bezprostřední ohrožení (Tísňové linky)
    expect(content).toContain('BEZPROSTŘEDNÍ OHROŽENÍ ŽIVOTA, ZDRAVÍ NEBO BEZPEČÍ');
    expect(content).toContain("phone: '112'");
    expect(content).toContain("phone: '158'");
    expect(content).toContain("phone: '155'");
    expect(content).toContain('href={`tel:${contact.phone}`}');

    // 3. Sekce C: Potřebuji stabilizovat situaci (SOS Plán)
    expect(content).toContain('🚨 SOS krizový plán pro první kroky v krizi');
    expect(content).toContain('/sos-plan');
    expect(content).toContain('/sos-plan/48-hodin');

    // 4. Sekce D: Potřebuji psychologickou / krizovou pomoc (Linky pomoci)
    expect(content).toContain('Nonstop Krizové linky psychické pomoci');
    expect(content).toContain('tel:116123');
    expect(content).toContain('tel:116111');
    expect(content).toContain('tel:116006');
    expect(content).toContain('tel:+420733642905');
    expect(content).toContain('tel:+420222580697');
    expect(content).toContain('Zdroj:');

    // 5. Sekce E: Potřebuji právní pomoc
    expect(content).toContain('Potřebuji právní pomoc');
    expect(content).toContain('/pravni-poradna');
    expect(content).toContain('/memento');
    expect(content).toContain('/judikatura');

    // 6. Sekce F & G: Potřebuji pomoc s dítětem / OSPOD & Registr / Mapa
    expect(content).toContain('Potřebuji pomoc s dítětem / najít OSPOD nebo poradnu');
    expect(content).toContain('/ospod');
    expect(content).toContain('/registr-subjektu');
    expect(content).toContain('/mapa-subjektu');

    // 7. Sekce H: Potřebuji mluvit s lidmi (Komunita)
    expect(content).toContain('Potřebuji mluvit s lidmi (Komunita & Mentoři)');
    expect(content).toContain('/forum');
    expect(content).toContain('/podpora');

    // 8. Tisková podpora
    expect(content).toContain('window.print()');
    expect(content).toContain('print:hidden');
  });

  it('Legal Audit: verifies neutral wording and absence of non-verified categoric deadlines', () => {
    const filePath = path.resolve(__dirname, '../components/public/community/CrisisCommunityPortal.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Categoric unverified 7-day deadline must NOT be present
    expect(content.includes('podej do 7 dnů návrh na PO')).toBe(false);

    // Neutral advisory must be present
    expect(content).toContain('Pokud je kontakt s dítětem náhle a závažně omezen, zvažte bezodkladnou konzultaci právního postupu');
  });

  it('Navigation Config: verifies /krizova-pomoc is registered in navigation items', () => {
    const navPath = path.resolve(__dirname, '../config/navigation.ts');
    expect(fs.existsSync(navPath)).toBe(true);

    const navContent = fs.readFileSync(navPath, 'utf-8');
    expect(navContent).toContain("url: '/krizova-pomoc'");
    expect(navContent).toContain("Krizový rozcestník & Linky pomoci");
  });

  it('PublicPortal.tsx: routes /krizova-pomoc to CrisisCommunityPortal', () => {
    const portalPath = path.resolve(__dirname, '../components/public/PublicPortal.tsx');
    expect(fs.existsSync(portalPath)).toBe(true);

    const portalContent = fs.readFileSync(portalPath, 'utf-8');
    expect(portalContent).toContain("slug === 'krizova-pomoc'");
    expect(portalContent).toContain("CrisisCommunityPortal");
  });
});
