import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Public CareHub /pece (MASTER-IMPLEMENT-MOJE-DITE-02C)', () => {
  const portalPath = path.resolve(__dirname, '../components/public/PublicPortal.tsx');
  const viewPath = path.resolve(__dirname, '../components/public/CareHubPublicLandingView.tsx');

  it('1. Files exist', () => {
    expect(fs.existsSync(portalPath)).toBe(true);
    expect(fs.existsSync(viewPath)).toBe(true);
  });

  it('2. PublicPortal.tsx routes /pece to CareHubPublicLandingView and NOT private CareHubPage', () => {
    const portalContent = fs.readFileSync(portalPath, 'utf-8');

    // Must import CareHubPublicLandingView
    expect(portalContent).toContain("import { CareHubPublicLandingView } from './CareHubPublicLandingView'");

    // Must contain route check for pece
    expect(portalContent).toContain("slug === 'pece'");
    expect(portalContent).toContain('<CareHubPublicLandingView');

    // Must NOT use private CareHubPage inside PublicPortal for /pece
    expect(portalContent).not.toContain("import { CareHubPage }");
  });

  it('3. CareHubPublicLandingView contains Hero, titles, subtitle and intro text', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Péče o novorozence a malé děti');
    expect(viewContent).toContain('Praktický průvodce péčí, předáváním dítěte a spoluprací rodičů');
    expect(viewContent).toContain('Péče o malé dítě se mění podle jeho věku, zdravotního stavu');
  });

  it('4. CareHubPublicLandingView contains quick orientation navigation', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Rychlá orientace na stránce:');
    expect(viewContent).toContain('🛡 Bezpečí');
    expect(viewContent).toContain('🍼 Novorozenec (0–1 rok)');
    expect(viewContent).toContain('👨👩👧 Jak nastavit péči');
    expect(viewContent).toContain('🔄 Předávání');
    expect(viewContent).toContain('📋 Rodičovský plán');
    expect(viewContent).toContain('✅ Checklist');
  });

  it('5. CareHubPublicLandingView contains newborn & infant methodology with passing info box', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Novorozenec: první týdny');
    expect(viewContent).toContain('Při předání malého dítěte si mohou rodiče předat:');
    expect(viewContent).toContain('Kdy dítě naposledy jedlo a pilo');
    expect(viewContent).toContain('Kdy naposledy spalo');
  });

  it('6. CareHubPublicLandingView contains non-dogmatic language, ethics disclaimer and general disclaimer', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Odborné a etické vymezení:');
    expect(viewContent).toContain('Tato stránka poskytuje obecné informační a vzdělávací informace');
    expect(viewContent).toContain('Nenahrazuje individuální zdravotní péči, psychologickou pomoc ani právní zastoupení');
    expect(viewContent).toContain('může být vhodné');
    expect(viewContent).toContain('podle potřeb dítěte');
  });

  it('7. CareHubPublicLandingView contains care models, parenting plan table and age groups', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('7-7');
    expect(viewContent).toContain('2-2-3');
    expect(viewContent).toContain('2-2-5-5');
    expect(viewContent).toContain('extended');
    expect(viewContent).toContain('Rodičovský plán — Příklady otázek k dohodě');
    expect(viewContent).toContain('Příklad pro orientaci — nejde o závazný právní vzor');
    expect(viewContent).toContain('0–3 roky');
    expect(viewContent).toContain('3–6 let');
    expect(viewContent).toContain('6–11 let');
  });

  it('8. CareHubPublicLandingView contains interactive checklist with localStorage', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Praktický checklist předání dítěte');
    expect(viewContent).toContain('pece_public_checklist');
    expect(viewContent).toContain('Stav checklistu se ukládá pouze ve vašem prohlížeči');
    expect(viewContent).toContain('Vím, kdy dítě naposledy jedlo a pilo.');
  });

  it('9. CareHubPublicLandingView contains expert consultation guide and verified sources', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Kdy řešit situaci s odborníkem');
    expect(viewContent).toContain('Použité zdroje a odborné reference');
    expect(viewContent).toContain('Ministerstvo zdravotnictví ČR (MZČR)');
    expect(viewContent).toContain('Národní zdravotnický informační portál (NZIP)');
    expect(viewContent).toContain('Česká pediatrická společnost ČLS JEP (ČPS)');
    expect(viewContent).toContain('Dr. Richard Warshak (2014)');
    expect(viewContent).toContain('Prof. William Fabricius');
  });

  it('10. CareHubPublicLandingView contains return link, print support and cross-links', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).toContain('Zpět na Moje dítě');
    expect(viewContent).toContain('window.print()');
    expect(viewContent).toContain('print:hidden');
    expect(viewContent).toContain('/psychologie');
    expect(viewContent).toContain('/skola');
    expect(viewContent).toContain('/zdravotni-pece');
    expect(viewContent).toContain('/studie/citova-vazba');
  });

  it('11. Security check: Public view does not import or use private Case models or PII', () => {
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    expect(viewContent).not.toContain('UserCase');
    expect(viewContent).not.toContain('CaseChild');
    expect(viewContent).not.toContain('UserChild');
    expect(viewContent).not.toContain('CareHubTab');
    expect(viewContent).not.toContain('CareHubPage');
  });

  it('12. Routing check: App.tsx classifies /pece as public and CTA navigates to /portal/pece', () => {
    const appPath = path.resolve(__dirname, '../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');
    const viewContent = fs.readFileSync(viewPath, 'utf-8');

    // App.tsx must not classify /pece as private
    expect(appContent).not.toContain("path.startsWith('/pece')");
    // CTA for logged-in user in CareHubPublicLandingView must navigate to /portal/pece
    expect(viewContent).toContain("navigateTo('/portal/pece')");
  });
});
