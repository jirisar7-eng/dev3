import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Zdravotní péče o dítě — Modular Hub & Subpages (MASTER-IMPLEMENT-MOJE-DITE-04)', () => {
  const portalPath = path.resolve(__dirname, '../components/public/PublicPortal.tsx');
  const hubPath = path.resolve(__dirname, '../components/public/legal/HealthcareGuideView.tsx');
  const subpagesPath = path.resolve(__dirname, '../components/public/legal/healthcare/HealthcareSubpages.tsx');

  it('1. Files exist and are in place', () => {
    expect(fs.existsSync(portalPath)).toBe(true);
    expect(fs.existsSync(hubPath)).toBe(true);
    expect(fs.existsSync(subpagesPath)).toBe(true);
  });

  it('2. PublicPortal.tsx routes /zdravotni-pece and /zdravotni-pece/* to HealthcareGuideView with subPath', () => {
    const portalContent = fs.readFileSync(portalPath, 'utf-8');

    expect(portalContent).toContain("slug === 'zdravotni-pece'");
    expect(portalContent).toContain("slug.startsWith('zdravotni-pece/')");
    expect(portalContent).toContain('subPath = slug.replace(/^zdravotni-pece\\//, \'\')');
    expect(portalContent).toContain('<HealthcareGuideView subPath={subPath}');
  });

  it('3. HealthcareGuideView.tsx acts as Hub and subPath router', () => {
    const hubContent = fs.readFileSync(hubPath, 'utf-8');

    // Subpath delegates
    expect(hubContent).toContain('PravaRodiceSubpage');
    expect(hubContent).toContain('DokumentaceSubpage');
    expect(hubContent).toContain('KomunikaceSubpage');
    expect(hubContent).toContain('PsychologieSubpage');
    expect(hubContent).toContain('NemocSubpage');
    expect(hubContent).toContain('OcrSubpage');
    expect(hubContent).toContain('PredavaniSubpage');
    expect(hubContent).toContain('ChecklistSubpage');
    expect(hubContent).toContain('OdborniciSubpage');

    // Hub 9 categories
    expect(hubContent).toContain('/zdravotni-pece/prava-rodice');
    expect(hubContent).toContain('/zdravotni-pece/dokumentace');
    expect(hubContent).toContain('/zdravotni-pece/komunikace');
    expect(hubContent).toContain('/zdravotni-pece/psychologie');
    expect(hubContent).toContain('/zdravotni-pece/nemoc');
    expect(hubContent).toContain('/zdravotni-pece/ocr');
    expect(hubContent).toContain('/zdravotni-pece/predavani');
    expect(hubContent).toContain('/zdravotni-pece/checklist');
    expect(hubContent).toContain('/zdravotni-pece/odbornici');
  });

  it('4. HealthcareSubpages.tsx contains exact legal citations and verified sources', () => {
    const subpagesContent = fs.readFileSync(subpagesPath, 'utf-8');

    // Legal citations
    expect(subpagesContent).toContain('§ 858');
    expect(subpagesContent).toContain('§ 876');
    expect(subpagesContent).toContain('§ 877');
    expect(subpagesContent).toContain('372/2011');
    expect(subpagesContent).toContain('187/2006');

    // Official ČSSZ Link
    expect(subpagesContent).toContain('https://www.cssz.cz');
  });

  it('5. HealthcareSubpages.tsx contains BIFF method, checklist with localStorage, and model examples', () => {
    const subpagesContent = fs.readFileSync(subpagesPath, 'utf-8');

    // BIFF Method
    expect(subpagesContent).toContain('BIFF');
    expect(subpagesContent).toContain('Brief');
    expect(subpagesContent).toContain('Informative');

    // Checklist localStorage key (0 PII)
    expect(subpagesContent).toContain('zdravotni_pece_checklist');
    expect(subpagesContent).toContain('Ochrana soukromí');

    // Model examples label
    expect(subpagesContent).toContain('Modelový příklad — nejde o právně závazný vzor');

    // Print button
    expect(subpagesContent).toContain('window.print()');
  });
});
