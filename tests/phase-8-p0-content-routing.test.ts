import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateChildSupport } from '../src/utils/alimonyCalculator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');

describe('Phase 8: P0 Content & Routing Integration Verification', () => {

  test('Alimony Calculator: Correctly computes support according to MSČR guidelines', () => {
    // 1 child (age 6-9 -> 16%), net income 40,000 CZK, 0 care days
    const res1 = calculateChildSupport({
      netIncome: 40000,
      otherObligations: 0,
      children: [{ id: '1', ageGroup: '6-9', careDays: 0 }]
    });

    assert.strictEqual(res1.totalObligations, 1);
    assert.strictEqual(res1.childrenResults[0].basePercentage, 0.16);
    assert.strictEqual(res1.childrenResults[0].baseAmount, 6400);
    assert.strictEqual(res1.childrenResults[0].careReduction, 0);
    assert.strictEqual(res1.childrenResults[0].finalAmount, 6400);
    assert.strictEqual(res1.controlAmountWarning, false);

    // With 50% shared care (15.2 days out of 30.4)
    const res2 = calculateChildSupport({
      netIncome: 40000,
      otherObligations: 0,
      children: [{ id: '1', ageGroup: '6-9', careDays: 15.2 }]
    });
    assert.strictEqual(res2.childrenResults[0].careReduction, 3200);
    assert.strictEqual(res2.childrenResults[0].finalAmount, 3200);

    // Warning trigger when alimony > 50% of income (4 children 15+ -> 4 x 14% = 56%)
    const res3 = calculateChildSupport({
      netIncome: 30000,
      otherObligations: 0,
      children: [
        { id: '1', ageGroup: '15+', careDays: 0 },
        { id: '2', ageGroup: '15+', careDays: 0 },
        { id: '3', ageGroup: '15+', careDays: 0 },
        { id: '4', ageGroup: '15+', careDays: 0 },
      ]
    });
    assert.strictEqual(res3.controlAmountWarning, true);
  });

  test('PublicPortal.tsx: Dispatches /kalkulacka-vyzivneho directly to AlimonyCalculatorPage (no AI simulator collision)', () => {
    const publicPortalCode = fs.readFileSync(path.join(BASE_DIR, 'src/components/public/PublicPortal.tsx'), 'utf8');
    
    // Ensure kalkulacka-vyzivneho was removed from ai-simulator check
    const aiSimMatch = publicPortalCode.match(/if\s*\([^)]*ai-simulator[^)]*\)/);
    assert.ok(aiSimMatch, 'AI simulator route check should exist');
    assert.ok(!aiSimMatch[0].includes('kalkulacka-vyzivneho'), 'AI simulator route check must not intercept kalkulacka-vyzivneho');

    // Ensure AlimonyCalculatorPage route handler exists
    assert.ok(publicPortalCode.includes("slug === 'kalkulacka-vyzivneho'"), 'Handler for kalkulacka-vyzivneho must exist');
    assert.ok(publicPortalCode.includes('<AlimonyCalculatorPage'), 'AlimonyCalculatorPage must be rendered');
  });

  test('PublicPortal.tsx: Dispatches /pece and /coparent to their respective public landing pages', () => {
    const publicPortalCode = fs.readFileSync(path.join(BASE_DIR, 'src/components/public/PublicPortal.tsx'), 'utf8');

    assert.ok(publicPortalCode.includes('CareHubPublicLandingView'), 'CareHubPublicLandingView must be referenced');
    assert.ok(publicPortalCode.includes("slug === 'pece'"), 'PublicPortal must handle pece slug');

    assert.ok(publicPortalCode.includes('CoParentPublicLandingView'), 'CoParentPublicLandingView must be referenced');
    assert.ok(publicPortalCode.includes("slug === 'coparent'"), 'PublicPortal must handle coparent slug');
  });

  test('navigation.ts: sub-3-2 points to /coparent instead of /portal/coparent for public navigation', () => {
    const navCode = fs.readFileSync(path.join(BASE_DIR, 'src/config/navigation.ts'), 'utf8');
    assert.ok(navCode.includes("id: 'sub-3-2', labelKey: 'CoParent Hub (Spolurodičovství)', url: '/coparent'"), 'Navigation item sub-3-2 must point to /coparent');
  });

  test('App.tsx: Authenticated guard preserves private CareHub and CoParent while exposing public landing pages', () => {
    const appCode = fs.readFileSync(path.join(BASE_DIR, 'src/App.tsx'), 'utf8');
    assert.ok(appCode.includes("path.startsWith('/pece')"), 'App.tsx must check /pece');
    assert.ok(appCode.includes("currentUser ? 'private' : 'public'"), 'Unauthenticated /pece must route to public view');
    assert.ok(appCode.includes("path.startsWith('/coparent')"), 'App.tsx must check /coparent');
  });

  test('UserDashboard.tsx: Preserves private authenticated access for /pece and /portal/coparent', () => {
    const userDashCode = fs.readFileSync(path.join(BASE_DIR, 'src/components/private/UserDashboard.tsx'), 'utf8');
    assert.ok(userDashCode.includes("currentPath.startsWith('/pece')"), 'UserDashboard must route /pece to CareHubPage');
    assert.ok(userDashCode.includes('<CareHubPage'), 'CareHubPage must be rendered for authenticated user');
    assert.ok(userDashCode.includes("currentPath.includes('/portal/coparent')"), 'UserDashboard must route /portal/coparent to CoParentPage');
    assert.ok(userDashCode.includes('<CoParentPage'), 'CoParentPage must be rendered for authenticated user');
  });
});
